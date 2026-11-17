import type express from 'express';
import {
  isCloudinaryConfigured,
  getCloudinaryStatus,
  verifyCloudinaryConnection,
  classifyCloudinaryError,
  generateCloudinaryUploadSignature,
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  listCloudinaryAssets,
  listAllCloudinaryAssets,
} from '../lib/cloudinary.ts';
import { validateUploadImagePayload } from '../lib/uploadValidation.ts';
import { cloudinaryUploadRateLimiter, requireFirebaseAdmin } from './firebaseAdmin.ts';

export function registerCloudinaryRoutes(
  app: express.Application,
  parsers: {
    standardJsonParser: express.RequestHandler;
    cloudinaryUploadJsonParser: express.RequestHandler;
  }
) {
  const { standardJsonParser, cloudinaryUploadJsonParser } = parsers;

  app.get('/api/admin/cloudinary-status', requireFirebaseAdmin, async (req, res) => {
    const forceRefresh = req.query.refresh === '1' || req.query.verify === '1';
    const verifiedStatus = await verifyCloudinaryConnection(forceRefresh);
    return res.json({
      success: true,
      ...verifiedStatus,
    });
  });

  app.post(
    '/api/admin/cloudinary-signature',
    requireFirebaseAdmin,
    cloudinaryUploadRateLimiter,
    standardJsonParser,
    (req, res) => {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({
          success: false,
          code: 'UNCONFIGURED',
          error:
            'সার্ভারে Cloudinary কনফিগারেশন সক্রিয় নেই। অনুগ্রহ করে Settings > Secrets-এ CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY এবং CLOUDINARY_API_SECRET সঠিকভাবে কনফিগার করুন।',
        });
      }

      try {
        const { plantName, slot, folder, publicId } = req.body || {};
        const signedParams = generateCloudinaryUploadSignature({
          plantName,
          slot,
          folder,
          publicId,
        });
        return res.json({
          success: true,
          ...signedParams,
        });
      } catch (err: any) {
        const classified = classifyCloudinaryError(err, getCloudinaryStatus().cloudName || undefined);
        console.warn(`Cloudinary signature warning [${classified.code}]:`, classified.rawMessage);
        return res.status(classified.statusCode).json({
          success: false,
          code: classified.code,
          error: classified.message,
        });
      }
    }
  );

  app.post(
    '/api/admin/cloudinary-upload',
    requireFirebaseAdmin,
    cloudinaryUploadRateLimiter,
    cloudinaryUploadJsonParser,
    async (req, res) => {
      const { image, plantName, slot, folder } = req.body || {};
      const validation = validateUploadImagePayload(image);
      if (!validation.ok) {
        return res.status(validation.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400).json({
          success: false,
          code: validation.code || 'INVALID_FILE_TYPE',
          error: validation.error || 'অবৈধ ছবির ফরম্যাট। শুধুমাত্র JPG, PNG বা WebP ছবি আপলোড করুন।',
        });
      }

      if (!isCloudinaryConfigured()) {
        return res.status(503).json({
          success: false,
          code: 'UNCONFIGURED',
          error:
            'সার্ভারে Cloudinary কনফিগারেশন সক্রিয় নেই। স্থায়ী ছবি সংরক্ষণের জন্য Settings > Secrets-এ CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY এবং CLOUDINARY_API_SECRET যোগ করুন।',
        });
      }

      try {
        const uploaded = await uploadImageToCloudinary({
          image,
          plantName,
          slot,
          folder,
        });

        return res.json({
          success: true,
          ...uploaded,
        });
      } catch (err: any) {
        const classified = classifyCloudinaryError(err, getCloudinaryStatus().cloudName || undefined);
        console.warn(`Cloudinary upload failed [${classified.code}]:`, classified.rawMessage);
        return res.status(classified.statusCode).json({
          success: false,
          code: classified.code,
          error: classified.message,
        });
      }
    }
  );

  app.post('/api/admin/cloudinary-delete', requireFirebaseAdmin, standardJsonParser, async (req, res) => {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        code: 'UNCONFIGURED',
        error: 'সার্ভারে Cloudinary কনফিগারেশন সক্রিয় নয়।',
      });
    }

    const { public_id } = req.body || {};
    const cleanPublicId = typeof public_id === 'string' ? public_id.trim() : '';
    if (!cleanPublicId || cleanPublicId.length > 300 || cleanPublicId.includes('..') || /\s/.test(cleanPublicId)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PUBLIC_ID',
        error: 'বৈধ public_id আবশ্যক।',
      });
    }

    try {
      const result = await deleteImageFromCloudinary(cleanPublicId);
      return res.json({ success: true, result });
    } catch (err: any) {
      const classified = classifyCloudinaryError(err, getCloudinaryStatus().cloudName || undefined);
      console.warn(`Cloudinary delete warning [${classified.code}]:`, classified.rawMessage);
      return res.status(classified.statusCode).json({
        success: false,
        code: classified.code,
        error: classified.message,
      });
    }
  });

  app.get('/api/admin/cloudinary-resources', requireFirebaseAdmin, cloudinaryUploadRateLimiter, async (req, res) => {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        code: 'UNCONFIGURED',
        error: 'সার্ভারে Cloudinary কনফিগারেশন সক্রিয় নেই।',
      });
    }

    const folder = typeof req.query.folder === 'string' ? req.query.folder : undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const maxResults = typeof req.query.maxResults === 'string' ? parseInt(req.query.maxResults, 10) : 100;

    try {
      const listing = await listCloudinaryAssets({
        folder,
        nextCursor: cursor,
        maxResults: Number.isFinite(maxResults) ? maxResults : 100,
      });
      return res.json({
        success: true,
        ...listing,
      });
    } catch (err: any) {
      const classified = classifyCloudinaryError(err, getCloudinaryStatus().cloudName || undefined);
      console.warn(`Cloudinary list warning [${classified.code}]:`, classified.rawMessage);
      return res.status(classified.statusCode).json({
        success: false,
        code: classified.code,
        error: classified.message,
      });
    }
  });

  app.get('/api/admin/cloudinary-export-all', requireFirebaseAdmin, cloudinaryUploadRateLimiter, async (req, res) => {
    const status = getCloudinaryStatus();
    if (!isCloudinaryConfigured()) {
      return res.json({
        success: true,
        configured: false,
        cloudName: status.cloudName,
        folder: status.folder,
        totalCount: 0,
        totalBytes: 0,
        truncated: false,
        resources: [],
      });
    }

    const folder = typeof req.query.folder === 'string' ? req.query.folder : undefined;
    try {
      const exported = await listAllCloudinaryAssets(folder);
      return res.json({
        success: true,
        configured: true,
        cloudName: status.cloudName,
        folder: folder || status.folder,
        ...exported,
      });
    } catch (err: any) {
      const classified = classifyCloudinaryError(err, status.cloudName || undefined);
      console.warn(`Cloudinary export warning [${classified.code}]:`, classified.rawMessage);
      return res.status(classified.statusCode).json({
        success: false,
        code: classified.code,
        error: classified.message,
      });
    }
  });
}
