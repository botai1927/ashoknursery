import type express from 'express';
import { validateUploadImagePayload } from '../lib/uploadValidation.ts';
import {
  adminFirestore,
  isFirebaseAdminInfraUnavailableError,
  issuePublicChallenge,
  publicChallengeRateLimiter,
  publicInquiryRateLimiter,
  publicReviewRateLimiter,
  requireVerifiedFirebaseUser,
  verifyPublicRequestGuard,
  withTimeout,
} from './firebaseAdmin.ts';

export function registerPublicRoutes(app: express.Application) {
  // Minimal sanitized public health check (does not disclose internal keys, configured services, or auth internals)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      nursery: 'Brahmyaman Nursery',
      location: 'Kalsuli, Bankura',
      timestamp: new Date().toISOString(),
    });
  });

  // Zero-billing Anti-Bot Challenge Issuer (single-use HMAC-SHA256 + lightweight PoW)
  app.get('/api/public/challenge', publicChallengeRateLimiter, (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      success: true,
      ...issuePublicChallenge(),
    });
  });

  // Public Customer Review Submission (Mandatory Google Firebase Auth + Zero-billing Challenge + Rate Limited + Honeypot + Image Validation)
  app.post(
    '/api/public/reviews',
    publicReviewRateLimiter,
    requireVerifiedFirebaseUser,
    verifyPublicRequestGuard,
    async (req, res) => {
      const verifiedUser = (req as any).verifiedUser as { uid: string; email: string } | undefined;
      if (!verifiedUser?.uid) {
        return res.status(401).json({
          success: false,
          code: 'AUTH_REQUIRED',
          error: 'রিভিউ জমা দিতে আগে Google অ্যাকাউন্ট দিয়ে লগইন করুন।',
        });
      }

      const body = req.body || {};
      const honeypot = String(body.hp || body.honeypot || body.website || '').trim();
      if (honeypot.length > 0) {
        return res.status(400).json({
          success: false,
          code: 'SPAM_DETECTED',
          error: 'অস্বাভাবিক অনুরোধ শনাক্ত হয়েছে।',
        });
      }

      const customerNameBn = String(body.customerNameBn || body.customerName || '')
        .trim()
        .slice(0, 120);
      const commentBn = String(body.commentBn || '').trim().slice(0, 1500);
      const locationBn = String(body.locationBn || 'বাঁকুড়া').trim().slice(0, 160) || 'বাঁকুড়া';
      const ratingNum = Math.round(Number(body.rating) || 5);
      if (!customerNameBn || customerNameBn.length < 2) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_NAME',
          error: 'অনুগ্রহ করে আপনার সঠিক নাম লিখুন।',
        });
      }
      if (!commentBn || commentBn.length < 3) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_COMMENT',
          error: 'অনুগ্রহ করে কমপক্ষে কয়েকটি শব্দে আপনার অভিজ্ঞতা লিখুন।',
        });
      }

      const rawPhoto = String(body.gardenImage || body.photoUrl || '').trim();
      let cleanPhoto: string | undefined;
      if (rawPhoto) {
        const photoCheck = validateUploadImagePayload(rawPhoto, 450_000);
        if (!photoCheck.ok) {
          return res.status(photoCheck.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400).json({
            success: false,
            code: photoCheck.code,
            error: photoCheck.error,
          });
        }
        cleanPhoto = rawPhoto;
      }

      const docId = String(body.id || `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 128);
      const createdAt = String(body.createdAt || new Date().toISOString()).slice(0, 100);
      const createdAtBn = String(body.createdAtBn || '').slice(0, 160);

      const sanitizedDoc: Record<string, unknown> = {
        id: docId,
        authorUid: verifiedUser.uid.slice(0, 128),
        customerNameBn,
        locationBn,
        rating: Math.min(5, Math.max(1, ratingNum)),
        commentBn,
        status: 'pending',
        createdAt,
        createdAtBn,
      };
      if (typeof body.plantId === 'string' && body.plantId.trim()) {
        sanitizedDoc.plantId = body.plantId.trim().slice(0, 128);
      }
      if (typeof body.plantNameBn === 'string' && body.plantNameBn.trim()) {
        sanitizedDoc.plantNameBn = body.plantNameBn.trim().slice(0, 200);
      }
      if (cleanPhoto) {
        sanitizedDoc.gardenImage = cleanPhoto;
      }

      try {
        await withTimeout(
          adminFirestore.collection('customer_reviews').doc(docId).set(sanitizedDoc),
          4500,
          'Firestore review write timeout'
        );
        return res.status(201).json({
          success: true,
          id: docId,
          authorUid: verifiedUser.uid,
          status: 'pending',
          persistedBy: 'server',
        });
      } catch (err: any) {
        if (isFirebaseAdminInfraUnavailableError(err) || err?.isTimeout) {
          return res.status(202).json({
            success: true,
            id: docId,
            authorUid: verifiedUser.uid,
            status: 'pending',
            persistedBy: 'client_fallback_allowed',
          });
        }
        return res.status(500).json({
          success: false,
          code: 'REVIEW_PERSIST_FAILED',
          error: 'রিভিউ সার্ভারে সংরক্ষণ করা যায়নি। অনুগ্রহ করে পরে চেষ্টা করুন।',
        });
      }
    }
  );

  // Public WhatsApp Order Inquiry Logging (Zero-billing Challenge + Rate Limited + Honeypot)
  app.post('/api/public/inquiries', publicInquiryRateLimiter, verifyPublicRequestGuard, async (req, res) => {
    const body = req.body || {};
    const honeypot = String(body.hp || body.honeypot || body.website || '').trim();
    if (honeypot.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'SPAM_DETECTED',
        error: 'অস্বাভাবিক অনুরোধ শনাক্ত হয়েছে।',
      });
    }

    const rawItems = Array.isArray(body.items) ? body.items.slice(0, 25) : [];
    if (rawItems.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'EMPTY_ITEMS',
        error: 'কমপক্ষে একটি চারার তথ্য আবশ্যক।',
      });
    }

    const cleanItems = rawItems.map((it: any) => {
      const name = String(it?.plantNameBn || it?.nameBn || 'চারাগাছ').trim().slice(0, 200);
      const unitPrice = Math.max(0, Math.round(Number(it?.unitPrice ?? it?.price) || 0));
      const quantity = Math.max(1, Math.min(999, Math.round(Number(it?.quantity) || 1)));
      const row: Record<string, unknown> = {
        plantId: String(it?.plantId || 'unknown')
          .replace(/[^a-zA-Z0-9_-]/g, '-')
          .slice(0, 128),
        plantNameBn: name,
        nameBn: name,
        category: String(it?.category || 'নার্সারি চারা').trim().slice(0, 120),
        optionLabelBn: String(it?.optionLabelBn || 'গ্রো ব্যাগ').trim().slice(0, 120),
        unitPrice,
        price: unitPrice,
        quantity,
      };
      if (typeof it?.image === 'string' && it.image.startsWith('https://') && it.image.length <= 1500) {
        row.image = it.image;
      }
      return row;
    });

    const docId = String(body.id || `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 128);
    const allowedEvents = new Set(['single_order', 'cart_order', 'voice_order', 'photo_share']);
    const eventType = allowedEvents.has(body.eventType) ? body.eventType : 'single_order';

    const sanitizedInquiry: Record<string, unknown> = {
      id: docId,
      timestamp: String(body.timestamp || new Date().toISOString()).slice(0, 100),
      dateBn: String(body.dateBn || '').slice(0, 100),
      timeBn: String(body.timeBn || '').slice(0, 100),
      eventType,
      customerName: String(body.customerName || 'ওয়েবসাইট ক্রেতা').trim().slice(0, 120),
      items: cleanItems,
      totalAmount: Math.max(0, Math.round(Number(body.totalAmount) || 0)),
      totalQuantity: Math.max(
        1,
        Number(body.totalQuantity) ||
          cleanItems.reduce((sum: number, it: Record<string, unknown>) => sum + Number(it.quantity || 1), 0)
      ),
      status: 'new',
    };
    if (typeof body.customerVillage === 'string' && body.customerVillage.trim()) {
      sanitizedInquiry.customerVillage = body.customerVillage.trim().slice(0, 200);
    }
    if (typeof body.customerPhone === 'string' && body.customerPhone.trim()) {
      sanitizedInquiry.customerPhone = body.customerPhone.trim().slice(0, 40);
    }
    if (body.deliveryMode === 'delivery' || body.deliveryMode === 'pickup') {
      sanitizedInquiry.deliveryMode = body.deliveryMode;
    }
    if (typeof body.voiceTranscript === 'string' && body.voiceTranscript.trim()) {
      sanitizedInquiry.voiceTranscript = body.voiceTranscript.trim().slice(0, 1000);
    }

    try {
      await withTimeout(
        adminFirestore.collection('whatsapp_inquiries').doc(docId).set(sanitizedInquiry),
        4500,
        'Firestore inquiry write timeout'
      );
      return res.status(201).json({
        success: true,
        id: docId,
        status: 'new',
        persistedBy: 'server',
      });
    } catch (err: any) {
      if (isFirebaseAdminInfraUnavailableError(err) || err?.isTimeout) {
        return res.status(202).json({
          success: true,
          id: docId,
          status: 'new',
          persistedBy: 'client_fallback_allowed',
        });
      }
      return res.status(500).json({
        success: false,
        code: 'INQUIRY_PERSIST_FAILED',
        error: 'অর্ডার অনুরোধ সংরক্ষণ করা যায়নি।',
      });
    }
  });
}
