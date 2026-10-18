'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Property } from '@/src/data/real-estate';
import PropertyCard from './PropertyCard';
import { backendPropertyImages } from '@/src/lib/property-images';

type UploadedProperty = Omit<Property, 'id'> & { id: string; apiBacked: true; listingStatus: 'ACTIVE' };
const apiBaseUrl = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');

function getAccessToken() {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const session = JSON.parse(storage.getItem('rentrite-session') ?? 'null') as { accessToken?: unknown } | null;
      if (typeof session?.accessToken === 'string') return session.accessToken;
    } catch { /* Continue with public property browsing. */ }
  }
  return null;
}

function unwrapRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const row = value as Record<string, unknown>;
  for (const key of ['data', 'properties', 'listings', 'result', 'results', 'items', 'content']) if (key in row) return unwrapRows(row[key]);
  return [];
}

function toUploadedProperty(value: unknown): UploadedProperty | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = row.id ?? row.propertyId;
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  const status = String(row.listingStatus ?? row.status ?? '').trim().toUpperCase().replace(/[ _-]+/g, ' ');
  if (!['ACTIVE', 'AVAILABLE', 'PUBLISHED', 'FOR RENT', 'RENT'].includes(status)) return null;
  const availability = row.isAvailable ?? row.available;
  const occupied = row.rentedOut ?? row.isRented ?? row.occupied ?? row.isOccupied;
  if (availability === false || occupied === true || ['RENTED', 'OCCUPIED', 'UNAVAILABLE'].includes(status)) return null;
  const images = backendPropertyImages(row.imageUrls, row.image_urls, row.imageUrl, row.image_url, row.images, row.imageKeys, row.image_keys, row.imageKey, row.image_key, row.photos, row.image);
  const image = images[0] ?? '/assets/img/accra-apartments-hero.png';
  const rent = Number(row.rent ?? row.price ?? row.propertyPrice ?? 0);
  return {
    id: String(id),
    title: String(row.title ?? row.name ?? row.propertyName ?? 'Property'),
    address: String(row.address ?? row.location ?? row.propertyLocation ?? ''),
    price: `GH₵ ${rent.toLocaleString()} / month`,
    amount: rent,
    status: 'For Rent',
    beds: Number(row.bedrooms ?? row.bedroomCount ?? 0),
    baths: Number(row.bathroom ?? row.bathrooms ?? 0),
    area: Number(row.area ?? 0),
    image,
    images,
    type: String(row.type ?? 'Rental home'),
    apiBacked: true,
    listingStatus: 'ACTIVE',
  };
}

export default function FeaturedHomes() {
  const [items, setItems] = useState<UploadedProperty[]>([]);
  const [start, setStart] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!apiBaseUrl) {
      setFailed(true);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`${apiBaseUrl}/properties`, { headers, cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null);
        if (!response.ok) throw new Error('Could not load listings.');
        const published = unwrapRows(body).map(toUploadedProperty).filter((property): property is UploadedProperty => Boolean(property));
        setItems(published);
      })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, []);

  const visible = items.length ? Array.from({ length: Math.min(3, items.length) }, (_, index) => items[(start + index) % items.length]) : [];
  function move(direction: number) {
    if (items.length > 3) setStart((current) => (current + direction + items.length) % items.length);
  }

  return <div className="featured-carousel">
    {loading ? <p className="home-properties-empty" role="status">Loading landlord listings…</p> : visible.length ? <>
      <div className="property-grid">{visible.map((property) => <PropertyCard key={property.id} property={property} />)}</div>
      <div className="carousel-controls"><span>{items.length} published landlord listings</span><div><button type="button" aria-label="Previous uploaded properties" onClick={() => move(-1)} disabled={items.length <= 3}>←</button><button type="button" aria-label="Next uploaded properties" onClick={() => move(1)} disabled={items.length <= 3}>→</button></div></div>
    </> : <div className="home-properties-empty" role={failed ? 'status' : undefined}><strong>{failed ? 'Property listings are temporarily unavailable.' : 'No published property photos yet.'}</strong><p>{failed ? 'Please try browsing again shortly.' : 'New landlord and administrator listings will appear here once published.'}</p><Link href="/list-layout-new" className="text-link">Browse all properties ↗</Link></div>}
  </div>;
}
