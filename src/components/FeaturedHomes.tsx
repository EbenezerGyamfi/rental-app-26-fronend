'use client';

import { useState } from 'react';
import type { Property } from '@/src/data/real-estate';
import PropertyCard from './PropertyCard';

export default function FeaturedHomes({ items }: { items: Property[] }) {
  const [start, setStart] = useState(0);
  const visible = [...items.slice(start), ...items.slice(0, start)].slice(0, 3);
  function move(direction: number) {
    setStart((current) => (current + direction + items.length) % items.length);
  }
  return <div className="featured-carousel">
    <div className="property-grid">{visible.map((property) => <PropertyCard key={property.id} property={property} />)}</div>
    <div className="carousel-controls"><span>Featured set {start + 1} of {items.length}</span><div><button type="button" aria-label="Previous featured homes" onClick={() => move(-1)}>←</button><button type="button" aria-label="Next featured homes" onClick={() => move(1)}>→</button></div></div>
  </div>;
}
