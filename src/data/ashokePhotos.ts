// Module mapping all genuine photos downloaded from ashokenursery.store
const modules = import.meta.glob(
  '/src/assets/images/ashoke_photos/*.webp',
  { eager: true, import: 'default' }
) as Record<string, string>;

export function getAshokePhotoUrl(photoId: number | string): string {
  const key = `/src/assets/images/ashoke_photos/photo_${photoId}.webp`;
  return modules[key] || '';
}

export const ALL_ASHOKE_PHOTOS = modules;
