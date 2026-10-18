'use client';

import { useEffect, useMemo, useState } from 'react';
import PropertyCard from './PropertyCard';
import type { Property } from '@/src/data/real-estate';
import { getDeletedPropertyIds, subscribeToDeletedProperties } from './deleted-properties';
import { backendPropertyImages } from '@/src/lib/property-images';

type ListingProperty = Omit<Property, 'id'> & { id: number | string; apiBacked?: boolean };
function readApiProperties(value: unknown): ListingProperty[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.map(readApiProperty).filter((item): item is ListingProperty => Boolean(item));
  const row = value as Record<string, unknown>;
  for (const key of ['data', 'properties', 'listings', 'result', 'results', 'items', 'content']) if (key in row) return readApiProperties(row[key]);
  const property = readApiProperty(value);
  return property ? [property] : [];
}
function readApiProperty(value: unknown): ListingProperty | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>; const id = row.id ?? row.propertyId; if (typeof id !== 'string' && typeof id !== 'number') return null;
  if (String(row.status ?? row.listingStatus ?? '').toUpperCase() !== 'ACTIVE') return null;
  const images = backendPropertyImages(row.imageUrls, row.image_urls, row.images, row.imageKeys, row.image_keys, row.imageKey, row.image_key, row.profileImage, row.imageUrl, row.image_url, row.image);
  const image = images[0];
  if (!image) return null;
  const rent = Number(row.rent ?? row.price ?? 0);
  return { id: String(id), title: String(row.title ?? 'Property'), address: String(row.address ?? ''), price: `GH₵ ${rent.toLocaleString()} / month`, amount: rent, status: 'For Rent', beds: Number(row.bedrooms ?? 0), baths: Number(row.bathroom ?? row.bathrooms ?? 0), area: Number(row.area ?? 0), image, images, type: String(row.type ?? 'Rental home'), apiBacked: true };
}

export function ListingResults({ variant, initialTerm = '', initialStatus = 'Any status', initialType = 'Any type', initialPrice = 'Any price' }: { variant: string; initialTerm?: string; initialStatus?: string; initialType?: string; initialPrice?: string }) {
  const [term, setTerm] = useState(initialTerm);
  const [status, setStatus] = useState(initialStatus);
  const [type, setType] = useState(initialType);
  const [price, setPrice] = useState(initialPrice);
  const [sort, setSort] = useState('Recommended');
  const [page, setPage] = useState(0);
  const [apiProperties, setApiProperties] = useState<ListingProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const mapLayout = /map|place-search|half-map/.test(variant);
  const listLayout = /list|classical/.test(variant);
  const halfMap = variant.startsWith('half-map');
  const sidebarLayout = variant.includes('sidebar');
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');
    if (!base) { setApiError(true); setLoading(false); return; }
    const controller = new AbortController();
    const headers: Record<string, string> = { Accept: 'application/json' };
    try { for (const storage of [window.sessionStorage, window.localStorage]) { const session = JSON.parse(storage.getItem('rentrite-session') ?? 'null') as { accessToken?: unknown } | null; if (typeof session?.accessToken === 'string') { headers.Authorization = `Bearer ${session.accessToken}`; break; } } } catch { /* Public property browsing can continue without a saved session. */ }
    fetch(`${base}/properties`, { headers, cache: 'no-store', signal: controller.signal }).then(async (response) => { const result: unknown = await response.json().catch(() => null); if (!response.ok) throw new Error('Could not load property listings.'); setApiProperties(readApiProperties(result)); }).catch(() => { if (!controller.signal.aborted) setApiError(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    const syncDeletedIds = () => setDeletedIds(getDeletedPropertyIds());
    syncDeletedIds();
    const unsubscribe = subscribeToDeletedProperties(syncDeletedIds);
    return () => { controller.abort(); unsubscribe(); };
  }, []);
  const deletedIdSet = new Set(deletedIds);
  const listingProperties = apiProperties.filter((property) => !deletedIdSet.has(String(property.id)));
  const results = useMemo(() => {
    const filtered = listingProperties.filter((item) => {
      const matchesText = `${item.title} ${item.address} ${item.type}`.toLowerCase().includes(term.toLowerCase());
      const matchesStatus = status === 'Any status' || item.status === status;
      const matchesType = type === 'Any type' || item.type === type;
      const matchesPrice = price === 'Any price' || (price === 'Under GH₵ 1m' && item.amount < 1000000) || (price === 'GH₵ 1m – 2m' && item.amount >= 1000000 && item.amount <= 2000000) || (price === 'GH₵ 2m+' && item.amount > 2000000);
      return matchesText && matchesStatus && matchesType && matchesPrice;
    });
    if (sort === 'Price: low to high') filtered.sort((a, b) => a.amount - b.amount);
    if (sort === 'Price: high to low') filtered.sort((a, b) => b.amount - a.amount);
    return filtered;
  }, [listingProperties, term, status, type, price, sort]);

  const mapPreview = <aside className="map-preview" aria-label="Property location map unavailable">
    <div className="map-topbar"><span><i aria-hidden="true" /> Property locations</span><small>Map service</small></div>
    <div className="map-art"><div className="map-data-unavailable"><span aria-hidden="true">⌖</span><b>Map locations aren’t available yet</b><p>The property API does not return coordinates. Live listings remain available beside this panel.</p></div></div>
    <div className="map-legend"><span>Location coordinates not provided</span><span>{results.length} matching listings</span></div>
  </aside>;
  return (
    <div className={`listing-results${mapLayout ? ' is-map' : ''}${listLayout ? ' is-list' : ''}${sidebarLayout ? ' has-filters' : ''}${halfMap ? ' map-on-left' : ''}`}>
      {sidebarLayout && <aside className="result-filters"><span className="eyebrow">Refine your search</span><label>Listing status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}><option>Any status</option><option>For Sale</option><option>For Rent</option></select></label><label>Property type<select value={type} onChange={(event) => { setType(event.target.value); setPage(0); }}><option>Any type</option><option>Villa</option><option>Apartment</option><option>Townhouse</option><option>House</option></select></label><label>Price range<select value={price} onChange={(event) => { setPrice(event.target.value); setPage(0); }}><option>Any price</option><option>Under GH₵ 1m</option><option>GH₵ 1m – 2m</option><option>GH₵ 2m+</option></select></label><button className="text-link" type="button" onClick={() => { setStatus('Any status'); setType('Any type'); setPrice('Any price'); setPage(0); }}>Clear filters</button></aside>}
      {mapLayout && halfMap && mapPreview}
      <div className="listing-result-main">
        <section className="results-toolbar" aria-label="Listing filters">
          <label className="toolbar-search"><span className="sr-only">Search listings</span><input value={term} onChange={(event) => { setTerm(event.target.value); setPage(0); }} placeholder="Search by area, address or keyword" /></label>
          {!sidebarLayout && <><label><span className="sr-only">Listing status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}><option>Any status</option><option>For Sale</option><option>For Rent</option></select></label><label><span className="sr-only">Property type</span><select value={type} onChange={(event) => { setType(event.target.value); setPage(0); }}><option>Any type</option><option>Villa</option><option>Apartment</option><option>Townhouse</option><option>House</option></select></label><label><span className="sr-only">Price range</span><select value={price} onChange={(event) => { setPrice(event.target.value); setPage(0); }}><option>Any price</option><option>Under GH₵ 1m</option><option>GH₵ 1m – 2m</option><option>GH₵ 2m+</option></select></label></>}
          <label><span className="sr-only">Sort listings</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Recommended</option><option>Price: low to high</option><option>Price: high to low</option></select></label>
        </section>
        <p className="result-count">{loading ? 'Loading live property listings…' : `Showing ${results.length} live homes matching your search`}</p>
        <div className="property-grid">
          {results.slice(page * 4, page * 4 + 4).map((property) => <PropertyCard key={property.id} property={property} />)}
          {!loading && results.length === 0 && <div className="empty-state"><h2>{apiError ? 'Live property listings are unavailable' : listingProperties.length ? 'No homes match those filters' : 'No active properties with photos yet'}</h2><p>{apiError ? 'The property service could not be reached. Try again later.' : listingProperties.length ? 'Try a different location or reset your search.' : 'Properties published by landlords and administrators will appear here once active and with photos.'}</p>{listingProperties.length > 0 && <button type="button" className="button button-outline" onClick={() => { setTerm(''); setStatus('Any status'); setType('Any type'); setPrice('Any price'); }}>Reset filters</button>}</div>}
        </div>
        {results.length > 4 && <div className="pagination"><button type="button" className="button button-outline" disabled={page === 0} onClick={() => setPage(page - 1)}>← Previous</button><span>Page {page + 1} of {Math.ceil(results.length / 4)}</span><button type="button" className="button button-outline" disabled={(page + 1) * 4 >= results.length} onClick={() => setPage(page + 1)}>Next →</button></div>}
      </div>
      {mapLayout && !halfMap && mapPreview}
    </div>
  );
}

export function ApiUnavailable({ title, description, className = '' }: { title?: string; description?: string; className?: string }) {
  return <section className={`form-card ${className}`} aria-label={title ?? 'Unavailable service'}>
    {title && <h2>{title}</h2>}
    <p role="status">{description ?? 'This feature is not available from the connected API yet. No information has been submitted or saved.'}</p>
  </section>;
}

export function FAQList() {
  const questions = [
    ['How do I arrange a property viewing?', 'Open a live property page, choose an available date and time, and submit a viewing request while signed in as a tenant.'],
    ['Can I save homes to compare later?', 'Use the heart or compare control on an active property listing. Saved and compared listings are kept in this browser.'],
    ['How do I list my property?', 'Sign in as a landlord and submit the property details and photos. New listings are sent to the property service for review.'],
    ['Are the prices and locations current?', 'Property details shown on listing pages are loaded from the property service. Contact the landlord to confirm availability before making a decision.'],
  ];
  return <div className="faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">＋</span></summary><p>{answer}</p></details>)}</div>;
}
