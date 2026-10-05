'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function DetailGallery({ title, images }: { title: string; images: string[] }) {
  const [active, setActive] = useState(0);
  const move = (direction: number) => setActive((current) => (current + direction + images.length) % images.length);
  return (
    <section className="detail-gallery" aria-label={`${title} photo gallery`}>
      <div className="detail-main-image">
        <Image src={images[active]} alt={`${title}, photo ${active + 1}`} fill priority sizes="(max-width: 800px) 100vw, 65vw" />
        <button className="gallery-control gallery-previous" type="button" aria-label="Previous photo" onClick={() => move(-1)}>←</button>
        <button className="gallery-control gallery-next" type="button" aria-label="Next photo" onClick={() => move(1)}>→</button>
        <span className="gallery-count">{active + 1} / {images.length}</span>
      </div>
      <div className="detail-side-image">
        {images.slice(1, 3).map((image, index) => {
          const photoIndex = index + 1;
          return <button className="detail-thumb" type="button" key={image} onClick={() => setActive(photoIndex)} aria-label={`Show photo ${photoIndex + 1}`}><Image src={image} alt="" fill sizes="35vw" /></button>;
        })}
      </div>
    </section>
  );
}
