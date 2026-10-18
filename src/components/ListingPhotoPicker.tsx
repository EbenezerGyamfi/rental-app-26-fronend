'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';

type SelectedPhoto = {
  file: File;
  previewUrl: string;
};

export default function ListingPhotoPicker({ name = 'images', onPhotoFilesChange }: { name?: string; onPhotoFilesChange?: (files: File[]) => void }) {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const previewUrls = useRef(new Set<string>());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const availableSlots = Math.max(0, 5 - photos.length);
    const newPhotos = Array.from(event.target.files ?? [])
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, availableSlots)
      .map((file) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrls.current.add(previewUrl);
        return { file, previewUrl };
      });

    const combined = [...photos, ...newPhotos].slice(0, 5);
    if (newPhotos.length) {
      setPhotos(combined);
      onPhotoFilesChange?.(combined.map(({ file }) => file));
    }
    const transfer = new DataTransfer();
    combined.forEach(({ file }) => transfer.items.add(file));
    event.target.files = transfer.files;
  }

  function removePhoto(previewUrl: string) {
    URL.revokeObjectURL(previewUrl);
    previewUrls.current.delete(previewUrl);
    const remaining = photos.filter((photo) => photo.previewUrl !== previewUrl);
    setPhotos(remaining);
    onPhotoFilesChange?.(remaining.map(({ file }) => file));
    const transfer = new DataTransfer();
    remaining.forEach(({ file }) => transfer.items.add(file));
    if (inputRef.current) inputRef.current.files = transfer.files;
  }

  return (
    <>
      <label className="listing-photo-upload">
        <span className="listing-upload-icon" aria-hidden="true">↥</span>
        <span><b>Choose photos from your device</b><small>JPG, PNG or WebP · You can select multiple images</small></span>
        <input ref={inputRef} type="file" name={name} accept="image/*" multiple onChange={handleFilesChange} />
      </label>
      {photos.length > 0 && <div className="listing-photo-previews" aria-label="Selected property photos">
        {photos.map(({ file, previewUrl }, index) => (
          <figure className="listing-photo-preview" key={previewUrl}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={`Selected property photo ${index + 1}`} />
            <button type="button" className="listing-photo-remove" onClick={() => removePhoto(previewUrl)} aria-label={`Remove ${file.name}`} title="Remove photo">×</button>
            <figcaption title={file.name}>{file.name}</figcaption>
          </figure>
        ))}
      </div>}
    </>
  );
}
