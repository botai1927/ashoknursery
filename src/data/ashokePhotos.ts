// Module mapping all genuine photos downloaded from ashokenursery.store
const modules = import.meta.glob(
  '/src/assets/images/ashoke_photos/*.{jpg,webp}',
  { eager: true, import: 'default' }
) as Record<string, string>;

export function getAshokePhotoUrl(photoId: number | string): string {
  const base = `/src/assets/images/ashoke_photos/photo_${photoId}`;
  return modules[`${base}.webp`] || modules[`${base}.jpg`] || '';
}

export const ALL_ASHOKE_PHOTOS = modules;
