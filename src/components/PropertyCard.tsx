'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Property } from '@/src/data/real-estate';

export default function PropertyCard({ property, compact = false }: { property: Property; compact?: boolean }) {
  const detailHref = `/single-property-${property.id}`;
  const [saved, setSaved] = useState(false);
  const [compared, setCompared] = useState(false);
  useEffect(() => {
    try {
      const savedIds: number[] = JSON.parse(localStorage.getItem('resido-saved') ?? '[]');
      const compareIds: number[] = JSON.parse(localStorage.getItem('resido-compare') ?? '[]');
      setSaved(savedIds.includes(property.id));
      setCompared(compareIds.includes(property.id));
    } catch {
      setSaved(false);
      setCompared(false);
    }
  }, [property.id]);
  function toggleSaved() {
    try {
      const ids: number[] = JSON.parse(localStorage.getItem('resido-saved') ?? '[]');
      const next = saved ? ids.filter((id) => id !== property.id) : [...new Set([...ids, property.id])];
      localStorage.setItem('resido-saved', JSON.stringify(next));
      setSaved(!saved);
    } catch {
      setSaved(!saved);
    }
  }
  function toggleCompared() {
    try {
      const ids: number[] = JSON.parse(localStorage.getItem('resido-compare') ?? '[]');
      const next = compared ? ids.filter((id) => id !== property.id) : [...new Set([...ids, property.id])];
      localStorage.setItem('resido-compare', JSON.stringify(next));
      setCompared(!compared);
    } catch {
      setCompared(!compared);
    }
  }
  return (
    <article className={compact ? 'property-card property-card-compact' : 'property-card'}>
      <div className="property-photo">
        <Link href={detailHref} aria-label={`View ${property.title}`}><Image src={property.image} alt={property.title} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" /></Link>
        <span className={property.status === 'For Sale' ? 'property-status status-sale' : 'property-status status-rent'}>{property.status}</span>
        {property.featured && <span className="property-featured">Featured</span>}
        <button className={saved ? 'save-button is-saved' : 'save-button'} type="button" aria-label={saved ? 'Remove saved property' : 'Save property'} aria-pressed={saved} onClick={toggleSaved}>{saved ? '♥' : '♡'}</button>
      </div>
      <div className="property-info">
        <p className="eyebrow property-kind">{property.type}<span> · </span>{property.address}</p>
        <h3><Link href={detailHref}>{property.title}</Link></h3>
        <div className="property-facts"><span>{property.beds} beds</span><span>{property.baths} baths</span><span>{property.area.toLocaleString()} sq ft</span></div>
        <div className="property-card-bottom"><strong>{property.price}</strong><div><button className={compared ? 'compare-icon is-selected' : 'compare-icon'} type="button" aria-pressed={compared} aria-label={compared ? 'Remove from compare' : 'Add to compare'} onClick={toggleCompared}>⇄</button><Link href={detailHref} aria-label={`Details for ${property.title}`}>↗</Link></div></div>
      </div>
    </article>
  );
}
