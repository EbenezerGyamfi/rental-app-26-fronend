const backendImageHost = 'rental-app-26-971966100280-us-east-1-an.s3.us-east-1.amazonaws.com';

function readImages(value: unknown): string[] {
  if (typeof value === 'string') {
    const source = value.trim();
    if (/^https?:\/\//i.test(source)) return [source];
    const key = source.replace(/^\/+/, '');
    return key.startsWith('uploads/images/') ? [`https://${backendImageHost}/${key}`] : [];
  }
  if (Array.isArray(value)) return value.flatMap(readImages);
  if (!value || typeof value !== 'object') return [];

  const row = value as Record<string, unknown>;
  for (const key of ['url', 'imageUrl', 'imageKey', 'storageKey', 'image_url', 'image_key', 'storage_key', 'key', 'src']) {
    if (key in row) {
      const images = readImages(row[key]);
      if (images.length) return images;
    }
  }
  for (const key of ['data', 'images', 'imageKeys', 'imageUrls', 'photos', 'result', 'image_keys', 'image_urls']) {
    if (key in row) {
      const images = readImages(row[key]);
      if (images.length) return images;
    }
  }
  return [];
}

export function backendPropertyImages(...values: unknown[]): string[] {
  return [...new Set(values.flatMap(readImages))];
}
