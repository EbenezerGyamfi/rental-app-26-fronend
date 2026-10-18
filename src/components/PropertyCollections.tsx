'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Property } from '@/src/data/real-estate';
import { backendPropertyImages } from '@/src/lib/property-images';

type ApiProperty = Property & { id: string };

function getProperties(value: unknown): ApiProperty[] {
  if (!value || typeof value !== 'object') return [];
  if (!Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    for (const key of ['data', 'properties', 'listings', 'items', 'content', 'results', 'result']) if (key in row) return getProperties(row[key]);
    value = [value];
  }
  return (value as unknown[]).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const id = row.id ?? row.propertyId;
    if ((typeof id !== 'string' && typeof id !== 'number') || String(row.status ?? row.listingStatus ?? '').toUpperCase() !== 'ACTIVE') return [];
    const images = backendPropertyImages(row.imageUrls, row.image_urls, row.images, row.imageKeys, row.image_keys, row.imageKey, row.image_key, row.profileImage, row.imageUrl, row.image_url, row.image);
    const image = images[0];
    if (!image) return [];
    const amount = Number(row.rent ?? row.price ?? 0);
    return [{ id: String(id), title: String(row.title ?? 'Property'), address: String(row.address ?? ''), price: `GH₵ ${amount.toLocaleString()} / month`, amount, status: 'For Rent' as const, beds: Number(row.bedrooms ?? 0), baths: Number(row.bathroom ?? row.bathrooms ?? 0), area: Number(row.area ?? 0), image, images, type: String(row.type ?? 'Rental home'), apiBacked: true }];
  });
}

function useLiveProperties() {
  const [items, setItems] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');
    if (!base) { setFailed(true); setLoading(false); return; }
    const controller = new AbortController();
    const headers: Record<string, string> = { Accept: 'application/json' };
    try { for (const storage of [window.sessionStorage, window.localStorage]) { const session = JSON.parse(storage.getItem('rentrite-session') ?? 'null') as { accessToken?: unknown } | null; if (typeof session?.accessToken === 'string') { headers.Authorization = `Bearer ${session.accessToken}`; break; } } } catch { /* Public listings can still load without a saved token. */ }
    fetch(`${base}/properties`, { headers, cache: 'no-store', signal: controller.signal }).then(async (response) => {
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error('Could not load properties.');
      setItems(getProperties(body));
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return { items, loading, failed };
}

function useStoredIds(key: string) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => { try { setIds((JSON.parse(localStorage.getItem(key) ?? '[]') as (string | number)[]).map(String)); } catch { setIds([]); } }, [key]);
  function save(next: string[]) { setIds(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Keep this shortlist for the current view. */ } }
  return { ids, save };
}

function EmptyCollection({ title, copy }: { title: string; copy: string }) {
  return <div className="empty-state collection-empty"><h2>{title}</h2><p>{copy}</p><Link href="/list-layout-new" className="button button-primary">Browse properties ↗</Link></div>;
}

export function SavedHomes() {
  const { items, loading, failed } = useLiveProperties();
  const { ids } = useStoredIds('resido-saved');
  const saved = items.filter((item) => ids.includes(item.id));
  if (loading) return <p role="status">Loading saved properties…</p>;
  if (failed) return <EmptyCollection title="Saved properties are unavailable" copy="The property service could not be reached. Try again later." />;
  return saved.length ? <div className="saved-list">{saved.map((property) => <Link href={`/property/${encodeURIComponent(property.id)}`} className="saved-row" key={property.id}><Image src={property.image} alt="" width={116} height={82} unoptimized /><div><span className="eyebrow">{property.status}</span><h3>{property.title}</h3><p>{property.address}</p></div><strong>{property.price}</strong></Link>)}</div> : <EmptyCollection title="No saved properties" copy="Use the heart on a live property listing to save it here." />;
}

export function CompareHomes() {
  const { items, loading, failed } = useLiveProperties();
  const { ids, save } = useStoredIds('resido-compare');
  const selected = ids.flatMap((id) => { const property = items.find((item) => item.id === id); return property ? [property] : []; });
  function remove(id: string) { save(ids.filter((item) => item !== id)); }
  function clearAll() { save([]); }
  const rows: { label: string; value: (item: ApiProperty) => string }[] = [
    { label: 'Location', value: (item) => item.address }, { label: 'Status', value: (item) => item.status },
    { label: 'Bedrooms', value: (item) => String(item.beds) }, { label: 'Bathrooms', value: (item) => String(item.baths) },
    { label: 'Area', value: (item) => item.area ? `${item.area.toLocaleString()} sq. ft.` : 'Not provided' }, { label: 'Type', value: (item) => item.type },
  ];
  if (loading) return <p role="status">Loading properties to compare…</p>;
  if (failed) return <EmptyCollection title="Property comparison is unavailable" copy="The property service could not be reached. Try again later." />;
  return selected.length ? <div className="compare-results">
    <div className="compare-results-bar"><div><strong>{selected.length} {selected.length === 1 ? 'property' : 'properties'} selected</strong><span>Compare live listings side by side.</span></div><button type="button" onClick={clearAll}>Clear comparison <span aria-hidden="true">×</span></button></div>
    <div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>Properties</th>{selected.map((item) => <th key={item.id}><button type="button" className="compare-remove" onClick={() => remove(item.id)} aria-label={`Remove ${item.title}`}>×</button><Image src={item.image} alt="" width={180} height={115} unoptimized /><b>{item.title}</b><span>{item.price}</span></th>)}</tr></thead><tbody>{rows.map(({ label, value }) => <tr key={label}><th>{label}</th>{selected.map((item) => <td key={item.id}>{value(item)}</td>)}</tr>)}</tbody></table></div>
    <div className="compare-mobile-list">{selected.map((item) => <article className="compare-mobile-card" key={item.id}><div className="compare-mobile-photo"><Image src={item.image} alt={item.title} fill unoptimized sizes="100vw" /><button type="button" className="compare-remove" onClick={() => remove(item.id)} aria-label={`Remove ${item.title}`}>×</button><span>{item.status}</span></div><div className="compare-mobile-content"><div className="compare-mobile-title"><div><h3>{item.title}</h3><p>{item.price}</p></div><Link href={`/property/${encodeURIComponent(item.id)}`} aria-label={`View ${item.title}`}>↗</Link></div><dl>{rows.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value(item)}</dd></div>)}</dl></div></article>)}</div>
  </div> : <div className="compare-empty"><span className="compare-empty-icon" aria-hidden="true">⇄</span><span className="eyebrow">Your shortlist, side by side</span><h2>No properties selected</h2><p>Use the compare control on any live property card, then return here to review the details.</p><Link href="/list-layout-new" className="button button-primary">Browse properties ↗</Link></div>;
}
