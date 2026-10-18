'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isPropertyDeleted, subscribeToDeletedProperties } from './deleted-properties';
import { RentalViewingBooking } from './RentalWorkflow';
import { backendPropertyImages } from '@/src/lib/property-images';

type ApiProperty = {
  id: string;
  title: string;
  description: string;
  address: string;
  rent: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  amenities: string[];
  images: string[];
};


function unwrapProperty(value: unknown): ApiProperty | null {
  if (Array.isArray(value)) return value.length ? unwrapProperty(value[0]) : null;
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (!('id' in row || 'propertyId' in row)) {
    for (const key of ['data', 'property', 'result']) {
      const nested = unwrapProperty(row[key]);
      if (nested) return nested;
    }
    return null;
  }
  const images = backendPropertyImages(row.imageUrls, row.image_urls, row.images, row.imageKeys, row.image_keys, row.imageKey, row.image_key, row.profileImage, row.imageUrl, row.image_url, row.image);
  return {
    id: String(row.id ?? row.propertyId),
    title: String(row.title ?? 'Property'),
    description: String(row.description ?? ''),
    address: String(row.address ?? ''),
    rent: Number(row.rent ?? 0),
    deposit: Number(row.deposit ?? 0),
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathroom ?? row.bathrooms ?? 0),
    status: String(row.status ?? ''),
    amenities: Array.isArray(row.amenities) ? row.amenities.map(String).map((item) => item.trim()).filter(Boolean) : [],
    images,
  };
}

function PropertyImageGallery({ title, images }: { title: string; images: string[] }) {
  const [active, setActive] = useState(0);
  if (!images.length) return <div className="api-property-no-photos">The landlord has not uploaded property photos yet.</div>;
  const current = Math.min(active, images.length - 1);
  return <section className="api-property-gallery" aria-label={`${title} property photos`}>
    <div className="api-property-gallery-main">
      <Image src={images[current]} alt={`${title}, photo ${current + 1} of ${images.length}`} fill priority unoptimized sizes="(max-width: 900px) 100vw, 1050px" />
      <span className="api-property-gallery-count">Photo {current + 1} of {images.length}</span>
    </div>
    {images.length > 1 && <div className="api-property-gallery-thumbs" aria-label="All property photos">
      {images.map((image, index) => <button type="button" className={`api-property-gallery-thumb${current === index ? ' is-active' : ''}`} key={`${image}-${index}`} onClick={() => setActive(index)} aria-label={`Show property photo ${index + 1}`} aria-pressed={current === index}>
        <Image src={image} alt={`${title}, thumbnail ${index + 1}`} fill unoptimized sizes="(max-width: 600px) 30vw, 180px" />
      </button>)}
    </div>}
  </section>;
}

export default function ApiPropertyDetail({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<ApiProperty | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');
    if (!base) {
      setError('Property details are not configured.');
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetch(`${base}/properties/${encodeURIComponent(propertyId)}`, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null);
        if (!response.ok) throw new Error('We could not load this property. Please try again later.');
        const parsed = unwrapProperty(body);
        if (!parsed) throw new Error('The property service returned an unsupported response.');
        if (isPropertyDeleted(parsed.id)) throw new Error('This property is no longer available.');
        setProperty(parsed);
      })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'We could not load this property.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    const unsubscribe = subscribeToDeletedProperties(() => {
      if (isPropertyDeleted(propertyId)) {
        setProperty(null);
        setError('This property is no longer available.');
        setLoading(false);
      }
    });
    return () => { controller.abort(); unsubscribe(); };
  }, [propertyId]);

  if (loading) return <main className="container api-property-detail"><p role="status">Loading property details…</p></main>;
  if (error || !property) return <main className="container api-property-detail"><p className="rental-workflow-message is-error" role="alert">{error || 'Property not found.'}</p><Link className="button button-outline" href="/list-layout-new">Browse properties</Link></main>;

  return <main className="container api-property-detail">
    <Link className="api-property-back" href="/list-layout-new"><span aria-hidden="true">←</span> Back to properties</Link>
    <PropertyImageGallery title={property.title} images={property.images} />
    <header className="api-property-detail-heading">
      <div className="api-property-title-group">
        <span className="property-status status-rent">{property.status || 'For Rent'}</span>
        <h1>{property.title}</h1>
        <p><span aria-hidden="true">⌖</span>{property.address || 'Location not provided'}</p>
      </div>
      <div className="api-property-price"><small>Monthly rent</small><strong>GH₵ {property.rent.toLocaleString()}</strong><span>per month</span></div>
    </header>
    <div className="api-property-facts" aria-label="Property highlights">
      <div className="api-property-fact"><span className="api-property-fact-icon" aria-hidden="true">⌂</span><span><b>{property.bedrooms}</b><small>Bedrooms</small></span></div>
      <div className="api-property-fact"><span className="api-property-fact-icon" aria-hidden="true">▤</span><span><b>{property.bathrooms}</b><small>Bathrooms</small></span></div>
      <div className="api-property-fact"><span className="api-property-fact-icon" aria-hidden="true">₵</span><span><b>GH₵ {property.deposit.toLocaleString()}</b><small>Security deposit</small></span></div>
    </div>
    <div className="api-property-content-grid">
      <div className="api-property-main-content">
        <section className="api-property-section api-property-description">
          <span className="eyebrow">ABOUT THIS HOME</span><h2>Property description</h2>
          <p>{property.description || 'The landlord has not added a description yet.'}</p>
        </section>
        <section className="api-property-section api-property-amenity-section">
          <span className="eyebrow">THE DETAILS</span><h2>Features and amenities</h2>
          {property.amenities.length ? <ul className="api-property-amenities">{property.amenities.map((amenity) => <li key={amenity}><span aria-hidden="true">✓</span>{amenity}</li>)}</ul> : <p>No amenities have been listed for this property.</p>}
        </section>
      </div>
      <aside id="book-a-viewing" className="api-property-viewing-section" aria-label="Book a property viewing">
        <div className="api-property-viewing-intro"><span aria-hidden="true">◷</span><div><small>LIKE WHAT YOU SEE?</small><p>Choose a time to visit this home.</p></div></div>
        <RentalViewingBooking propertyID={property.id} propertyTitle={property.title} rent={property.rent} />
      </aside>
    </div>
  </main>;
}
