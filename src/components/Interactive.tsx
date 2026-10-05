'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import PropertyCard from './PropertyCard';
import { properties } from '@/src/data/real-estate';

export function ListingResults({ variant, initialTerm = '', initialStatus = 'Any status', initialType = 'Any type', initialPrice = 'Any price' }: { variant: string; initialTerm?: string; initialStatus?: string; initialType?: string; initialPrice?: string }) {
  const [term, setTerm] = useState(initialTerm);
  const [status, setStatus] = useState(initialStatus);
  const [type, setType] = useState(initialType);
  const [price, setPrice] = useState(initialPrice);
  const [sort, setSort] = useState('Recommended');
  const [page, setPage] = useState(0);
  const mapLayout = /map|place-search|half-map/.test(variant);
  const listLayout = /list|classical/.test(variant);
  const halfMap = variant.startsWith('half-map');
  const sidebarLayout = variant.includes('sidebar');
  const results = useMemo(() => {
    const filtered = properties.filter((item) => {
      const matchesText = `${item.title} ${item.address} ${item.type}`.toLowerCase().includes(term.toLowerCase());
      const matchesStatus = status === 'Any status' || item.status === status;
      const matchesType = type === 'Any type' || item.type === type;
      const matchesPrice = price === 'Any price' || (price === 'Under GH₵ 1m' && item.amount < 1000000) || (price === 'GH₵ 1m – 2m' && item.amount >= 1000000 && item.amount <= 2000000) || (price === 'GH₵ 2m+' && item.amount > 2000000);
      return matchesText && matchesStatus && matchesType && matchesPrice;
    });
    if (sort === 'Price: low to high') filtered.sort((a, b) => a.amount - b.amount);
    if (sort === 'Price: high to low') filtered.sort((a, b) => b.amount - a.amount);
    return filtered;
  }, [term, status, type, price, sort]);

  const mapHomes = [
    { property: properties[0], x: '30%', y: '33%' }, { property: properties[1], x: '68%', y: '27%' },
    { property: properties[2], x: '53%', y: '55%' }, { property: properties[3], x: '26%', y: '70%' },
  ];
  const mapPreview = <aside className="map-preview" aria-label="Illustrative Accra neighbourhood map">
    <div className="map-topbar"><span><i aria-hidden="true" /> Accra area guide</span><small>Illustrative map</small></div>
    <div className="map-art">
      <svg viewBox="0 0 600 600" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path className="map-park" d="M35 105l110-48 77 52-25 100-123 22-50-58zM383 45l128 39-12 94-93 17-50-67zM363 359l143-31 62 87-63 93-126-19-33-69zM70 385l91-40 80 59-27 112-98 20-65-71z" />
        <path className="map-road map-road-major" d="M-20 300C85 275 137 320 230 286s147-84 228-76 101 43 170 10M155-20c35 100 24 160 68 243s83 105 88 205 41 113 60 195M-20 496c95-42 165-38 248 4s158 43 229 2 94-84 165-73" />
        <path className="map-road" d="M10 157c80 40 146 60 218 51s104-45 163-25 108 91 208 90M45 35c28 79 87 101 91 173s-46 127-36 210 70 121 76 207M349-12c-15 89 18 138 77 179s69 84 64 142-43 92-28 157M-20 405c80-14 137-52 215-47s117 50 179 48 120-49 246-19M250-20c-4 67 30 119 89 156s112 46 149 114" />
        <path className="map-road map-road-small" d="M18 242l100-63m48 9 13-112m-80 281 126-44m31-23 60-72m-39 154 62 16m-92 147 22-114m103-316-48 104m171 40 52-65m-81 125 109 11m-40 96-74-47m79 133 32-52" />
      </svg>
      <span className="map-area-label map-area-east" aria-hidden="true">East Legon</span><span className="map-area-label map-area-airport" aria-hidden="true">Airport Residential</span><span className="map-area-label map-area-labone" aria-hidden="true">Labone</span><span className="map-area-label map-area-canton" aria-hidden="true">Cantonments</span>
      {mapHomes.map(({ property, x, y }) => <Link key={property.id} className="map-home-pin" href={`/single-property-${property.id}`} style={{ left: x, top: y }} aria-label={`${property.title}, ${property.price}`}><b>⌂</b><span>{property.price}</span></Link>)}
    </div>
    <div className="map-legend"><span><i /> Available homes</span><span>Accra, Ghana</span></div>
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
        <p className="result-count">Showing {results.length} homes matching your search</p>
        <div className="property-grid">
          {results.slice(page * 4, page * 4 + 4).map((property) => <PropertyCard key={property.id} property={property} />)}
          {results.length === 0 && <div className="empty-state"><h2>No homes match those filters</h2><p>Try a different location or reset your search.</p><button type="button" className="button button-outline" onClick={() => { setTerm(''); setStatus('Any status'); setType('Any type'); setPrice('Any price'); }}>Reset filters</button></div>}
        </div>
        {results.length > 4 && <div className="pagination"><button type="button" className="button button-outline" disabled={page === 0} onClick={() => setPage(page - 1)}>← Previous</button><span>Page {page + 1} of {Math.ceil(results.length / 4)}</span><button type="button" className="button button-outline" disabled={(page + 1) * 4 >= results.length} onClick={() => setPage(page + 1)}>Next →</button></div>}
      </div>
      {mapLayout && !halfMap && mapPreview}
    </div>
  );
}

export function DemoForm({ title, description, submitLabel = 'Submit request', children, className = '' }: { title?: string; description?: string; submitLabel?: string; children?: ReactNode; className?: string }) {
  const [submitted, setSubmitted] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }
  return (
    <form className={`form-card ${className}`} onSubmit={handleSubmit}>
      {title && <h2>{title}</h2>}{description && <p>{description}</p>}
      {children ?? <><div className="form-grid"><label>Full name<input required name="name" autoComplete="name" /></label><label>Email address<input required type="email" name="email" autoComplete="email" /></label></div><label>How can we help?<textarea name="message" rows={4} required /></label></>}
      <button className="button button-primary" type="submit">{submitted ? 'Demo complete' : submitLabel} <span aria-hidden="true">↗</span></button>
      {submitted && <p className="form-note" role="status">This is a front-end demonstration; nothing was sent to or saved on a server.</p>}
    </form>
  );
}

export function FAQList() {
  const questions = [
    ['How do I arrange a property viewing?', 'Open a property page and use the enquiry details to contact the listing agent. Viewing requests on this demo are not sent to a live service.'],
    ['Can I save homes to compare later?', 'Use the heart control on a listing to mark a home while you browse. Saved homes are local demo state and are not synced to an account.'],
    ['How do I list my property?', 'Start from the listing form and prepare your property details. Publishing a real listing will require an account and a connected backend.'],
    ['Are the prices and locations current?', 'The content on these pages is sample content for the template. Confirm details with the property owner or agent before making decisions.'],
  ];
  return <div className="faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">＋</span></summary><p>{answer}</p></details>)}</div>;
}
