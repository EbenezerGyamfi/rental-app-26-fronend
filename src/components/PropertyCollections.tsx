'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { properties, type Property } from '@/src/data/real-estate';

export function SavedHomes() {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    try { setIds(JSON.parse(localStorage.getItem('resido-saved') ?? '[]')); } catch { setIds([]); }
  }, []);
  const saved = properties.filter((item) => ids.includes(item.id));
  return saved.length ? <div className="saved-list">{saved.map((property) => <div className="saved-row" key={property.id}><Image src={property.image} alt="" width={116} height={82} /><div><span className="eyebrow">{property.status}</span><h3>{property.title}</h3><p>{property.address}</p></div><strong>{property.price}</strong></div>)}</div> : <div className="empty-state collection-empty"><h2>Your saved homes will show up here</h2><p>Use the heart on any property card to keep it close while you browse.</p><Link href="/list-layout-new" className="button button-primary">Explore homes ↗</Link></div>;
}

export function CompareHomes() {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    try { setIds(JSON.parse(localStorage.getItem('resido-compare') ?? '[]')); } catch { setIds([]); }
  }, []);
  const selected = properties.filter((item) => ids.includes(item.id));
  function remove(id: number) {
    const next = ids.filter((item) => item !== id);
    setIds(next);
    try { localStorage.setItem('resido-compare', JSON.stringify(next)); } catch { /* Local comparison remains usable for this visit. */ }
  }
  function clearAll() {
    setIds([]);
    try { localStorage.setItem('resido-compare', '[]'); } catch { /* Comparison can still be reset for this visit. */ }
  }
  const rows: { label: string; value: (item: Property) => string }[] = [
    { label: 'Location', value: (item) => item.address },
    { label: 'Status', value: (item) => item.status },
    { label: 'Bedrooms', value: (item) => String(item.beds) },
    { label: 'Bathrooms', value: (item) => String(item.baths) },
    { label: 'Area', value: (item) => `${item.area.toLocaleString()} sq. ft.` },
    { label: 'Type', value: (item) => item.type },
  ];
  return selected.length ? <div className="compare-results">
    <div className="compare-results-bar"><div><strong>{selected.length} {selected.length === 1 ? 'home' : 'homes'} selected</strong><span>Compare location, size, and key details side by side.</span></div><button type="button" onClick={clearAll}>Clear comparison <span aria-hidden="true">×</span></button></div>
    <div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>Compare homes</th>{selected.map((item) => <th key={item.id}><button type="button" className="compare-remove" onClick={() => remove(item.id)} aria-label={`Remove ${item.title}`}>×</button><Image src={item.image} alt="" width={180} height={115} /><b>{item.title}</b><span>{item.price}</span></th>)}</tr></thead><tbody>{rows.map(({ label, value }) => <tr key={label}><th>{label}</th>{selected.map((item) => <td key={item.id}>{value(item)}</td>)}</tr>)}</tbody></table></div>
    <div className="compare-mobile-list">{selected.map((item) => <article className="compare-mobile-card" key={item.id}><div className="compare-mobile-photo"><Image src={item.image} alt={item.title} fill sizes="100vw" /><button type="button" className="compare-remove" onClick={() => remove(item.id)} aria-label={`Remove ${item.title}`}>×</button><span>{item.status}</span></div><div className="compare-mobile-content"><div className="compare-mobile-title"><div><h3>{item.title}</h3><p>{item.price}</p></div><Link href={`/single-property-${item.id}`} aria-label={`View ${item.title}`}>↗</Link></div><dl>{rows.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value(item)}</dd></div>)}</dl></div></article>)}</div>
  </div> : <div className="compare-empty"><span className="compare-empty-icon" aria-hidden="true">⇄</span><span className="eyebrow">Your shortlist, side by side</span><h2>Choose homes to compare</h2><p>Select the compare control on any property card, then come back here to review the details together.</p><Link href="/list-layout-new" className="button button-primary">Browse properties <span aria-hidden="true">↗</span></Link></div>;
}
