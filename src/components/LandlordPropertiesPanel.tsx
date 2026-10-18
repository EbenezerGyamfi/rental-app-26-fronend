'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { isPropertyDeleted, markPropertyDeleted } from './deleted-properties';

type PropertyRecord = {
  id: string; title: string; description: string; address: string; rent: number; deposit: number;
  bedrooms: number; bathroom: number; status: string; amenities: string[]; rentedOut: boolean; imageKeys: string[]; raw: Record<string, unknown>;
};
type ViewingRecord = { id: string; propertyId: string; property: string; tenant: string; startTime: string; status: string; raw: Record<string, unknown> };

const apiBaseUrl = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');
const landlordPropertiesPath = process.env.NEXT_PUBLIC_RENTAL_LANDLORD_PROPERTIES_PATH?.trim() || '/landlords/properties';
const landlordViewingsPath = process.env.NEXT_PUBLIC_RENTAL_LANDLORD_VIEWINGS_PATH?.trim() || '/viewings';

function accessToken() {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try { const session = JSON.parse(storage.getItem('rentrite-session') ?? 'null') as { accessToken?: unknown } | null; if (typeof session?.accessToken === 'string') return session.accessToken; } catch { /* Try the other storage. */ }
  }
  return null;
}

function unwrap(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const row = value as Record<string, unknown>;
  for (const key of ['data', 'properties', 'property', 'result']) if (key in row) return unwrap(row[key]);
  return value;
}

function imageKeys(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(imageKeys);
  if (!value || typeof value !== 'object') return [];
  const row = value as Record<string, unknown>;
  return imageKeys(row.imageKeys ?? row.images ?? row.imageKey ?? row.key ?? row.url ?? row.storageKey);
}

function asProperty(value: unknown): PropertyRecord | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = row.id ?? row.propertyId;
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  return {
    id: String(id), title: String(row.title ?? 'Untitled property'), description: String(row.description ?? ''),
    address: String(row.address ?? ''), rent: Number(row.rent ?? 0), deposit: Number(row.deposit ?? 0),
    bedrooms: Number(row.bedrooms ?? 0), bathroom: Number(row.bathroom ?? row.bathrooms ?? 0),
    status: String(row.status ?? 'DRAFT').toUpperCase(), amenities: Array.isArray(row.amenities) ? row.amenities.map(String) : [], rentedOut: Boolean(row.rentedOut ?? row.isRented ?? row.occupied ?? row.isOccupied ?? ['RENTED', 'OCCUPIED'].includes(String(row.status ?? '').toUpperCase())), imageKeys: imageKeys(row.imageKeys ?? row.images), raw: row,
  };
}

function records(value: unknown): PropertyRecord[] {
  const list = unwrap(value);
  return (Array.isArray(list) ? list : list && typeof list === 'object' ? [list] : []).map(asProperty).filter((item): item is PropertyRecord => Boolean(item));
}

function messageFrom(value: unknown, fallback: string) {
  if (value && typeof value === 'object') { const row = value as Record<string, unknown>; const error = row.error ?? row.message ?? row.detail; if (typeof error === 'string') return error; if (Array.isArray(error)) return error.join(' '); }
  return fallback;
}

function viewingRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const row = value as Record<string, unknown>;
  for (const key of ['data', 'viewings', 'viewing', 'bookings', 'results', 'items', 'content', 'records', 'result']) {
    if (key in row) return viewingRows(row[key]);
  }
  return [value];
}

function asViewing(value: unknown): ViewingRecord | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const property = row.property && typeof row.property === 'object' ? row.property as Record<string, unknown> : null;
  const tenant = row.tenant && typeof row.tenant === 'object' ? row.tenant as Record<string, unknown> : null;
  const id = row.id ?? row.viewingId ?? row.bookingId;
  const propertyId = row.propertyId ?? property?.id;
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  return {
    id: String(id), propertyId: typeof propertyId === 'string' || typeof propertyId === 'number' ? String(propertyId) : '',
    property: String(row.propertyTitle ?? row.propertyName ?? property?.title ?? property?.name ?? (typeof row.property === 'string' ? row.property : 'Property viewing')),
    tenant: String(row.tenantName ?? row.renterName ?? tenant?.name ?? tenant?.fullName ?? (typeof row.tenant === 'string' ? row.tenant : 'Tenant')),
    startTime: String(row.startTime ?? row.scheduledAt ?? row.dateTime ?? row.viewingDate ?? row.datetime ?? ''),
    status: String(row.status ?? row.bookingStatus ?? 'PENDING').toUpperCase(),
    raw: row,
  };
}

function viewingRecords(value: unknown): ViewingRecord[] {
  return viewingRows(value).map(asViewing).filter((record): record is ViewingRecord => Boolean(record));
}

function formatViewingDate(value: string) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Time not provided';
}

function isActiveViewingStatus(status: string) {
  return !['CANCELLED', 'CANCELED', 'DELETED', 'COMPLETED', 'REJECTED'].includes(status.toUpperCase());
}

export default function LandlordPropertiesPanel({ isAdmin, mode = 'manage' }: { isAdmin: boolean; mode?: 'overview' | 'manage' }) {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [landlordViewings, setLandlordViewings] = useState<ViewingRecord[]>([]);
  const [viewingPropertyId, setViewingPropertyId] = useState('');
  const [viewingsLoading, setViewingsLoading] = useState(false);
  const [viewingsError, setViewingsError] = useState('');
  const [selectedViewing, setSelectedViewing] = useState<ViewingRecord | null>(null);
  const [nextViewingStatus, setNextViewingStatus] = useState('PENDING');
  const [viewingDetailLoading, setViewingDetailLoading] = useState(false);
  const [viewingActionId, setViewingActionId] = useState<string | null>(null);
  const [bookedViewings, setBookedViewings] = useState<number | null>(null);
  const [view, setView] = useState<'landlord' | 'all'>(() => isAdmin ? 'all' : 'landlord');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PropertyRecord | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeMetric, setActiveMetric] = useState<'total' | 'available' | 'rented' | 'viewings'>('total');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('ALL');

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const token = accessToken();
    if (!apiBaseUrl) throw new Error('Property management is not configured. Set NEXT_PUBLIC_RENTAL_API_URL.');
    if (!token) throw new Error('Sign in again to manage your properties.');
    const response = await fetch(`${apiBaseUrl}${path}`, { ...init, cache: 'no-store', headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error(messageFrom(result, 'The property request could not be completed.'));
    return result;
  }, []);

  const load = useCallback(async (which = view) => {
    setLoading(true); setError(false); setMessage('');
    if (mode === 'overview' && !isAdmin) { setViewingsLoading(true); setViewingsError(''); }
    try {
      if (which === 'all' && !isAdmin) throw new Error('Only administrators can view the full property list.');
      const result = await request(mode === 'overview' && isAdmin || which === 'all' ? '/properties' : landlordPropertiesPath);
      const propertyRows = records(result).filter((property) => !isPropertyDeleted(property.id));
      setProperties(propertyRows);
      setLastUpdated(new Date());
      if (mode === 'overview' && !isAdmin) {
        try {
          const viewingResult = await request(landlordViewingsPath);
          const records = viewingRecords(viewingResult);
          setLandlordViewings(records);
          setBookedViewings(new Set(records.filter((record) => isActiveViewingStatus(record.status)).map((record) => record.id)).size);
          setViewingsError('');
        } catch (viewingLoadError) {
          setLandlordViewings([]);
          setViewingsError(viewingLoadError instanceof Error ? viewingLoadError.message : 'Could not load viewing requests.');
          setBookedViewings(null);
        }
      } else if (mode === 'overview' && !isAdmin) setBookedViewings(null);
    } catch (loadError) { setError(true); setMessage(loadError instanceof Error ? loadError.message : 'Could not load properties.'); }
    finally { setLoading(false); if (mode === 'overview' && !isAdmin) setViewingsLoading(false); }
  }, [isAdmin, mode, request, view]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function loadAllViewings() {
    setViewingPropertyId('');
    setSelectedViewing(null);
    setViewingsLoading(true);
    setViewingsError('');
    try { setLandlordViewings(viewingRecords(await request(landlordViewingsPath))); }
    catch (loadError) { setViewingsError(loadError instanceof Error ? loadError.message : 'Could not load all viewing requests.'); }
    finally { setViewingsLoading(false); }
  }

  async function loadPropertyViewings(propertyId: string) {
    setViewingPropertyId(propertyId);
    setSelectedViewing(null);
    setViewingsLoading(true);
    setViewingsError('');
    try { setLandlordViewings(viewingRecords(await request(`/properties/${encodeURIComponent(propertyId)}/viewings`))); }
    catch (loadError) { setLandlordViewings([]); setViewingsError(loadError instanceof Error ? loadError.message : 'Could not load viewings for this property.'); }
    finally { setViewingsLoading(false); }
  }

  async function loadViewingDetail(viewing: ViewingRecord) {
    setViewingActionId(viewing.id);
    setViewingDetailLoading(true);
    setViewingsError('');
    try {
      const result = await request(`/viewings/${encodeURIComponent(viewing.id)}`);
      const details = viewingRecords(result)[0];
      const selected = details ? { ...viewing, ...details } : viewing;
      setSelectedViewing(selected);
      setNextViewingStatus(selected.status);
    } catch (detailError) {
      setViewingsError(detailError instanceof Error ? detailError.message : 'Could not load viewing details.');
    } finally { setViewingDetailLoading(false); setViewingActionId(null); }
  }

  async function updateViewingStatus(viewing: ViewingRecord, status: string) {
    setViewingActionId(viewing.id);
    setViewingsError('');
    try {
      await request(`/bookings/${encodeURIComponent(viewing.id)}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const updated = { ...viewing, status };
      setLandlordViewings((current) => current.map((item) => item.id === viewing.id ? updated : item));
      setBookedViewings((current) => current === null || isActiveViewingStatus(viewing.status) === isActiveViewingStatus(status) ? current : Math.max(0, current + (isActiveViewingStatus(status) ? 1 : -1)));
      setSelectedViewing((current) => current?.id === viewing.id ? updated : current);
      setNextViewingStatus(status);
    } catch (statusError) {
      setViewingsError(statusError instanceof Error ? statusError.message : 'Could not update viewing status.');
    } finally { setViewingActionId(null); }
  }

  async function completeViewing(viewing: ViewingRecord) {
    setViewingActionId(viewing.id);
    setViewingsError('');
    try {
      await request(`/viewings/${encodeURIComponent(viewing.id)}/complete`, { method: 'PATCH' });
      const updated = { ...viewing, status: 'COMPLETED' };
      setLandlordViewings((current) => current.map((item) => item.id === viewing.id ? updated : item));
      setBookedViewings((current) => current === null || !isActiveViewingStatus(viewing.status) ? current : Math.max(0, current - 1));
      setSelectedViewing((current) => current?.id === viewing.id ? updated : current);
      setNextViewingStatus('COMPLETED');
    } catch (completeError) {
      setViewingsError(completeError instanceof Error ? completeError.message : 'Could not mark this viewing as completed.');
    } finally { setViewingActionId(null); }
  }

  async function updateStatus(property: PropertyRecord, status: string) {
    if (!isAdmin) { setError(true); setMessage('Only administrators can change property status.'); return; }
    setBusyId(property.id); setMessage(''); setError(false);
    try { await request(`/properties/${encodeURIComponent(property.id)}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); setMessage(`“${property.title}” is now ${status.toLowerCase()}.`); await load(); }
    catch (actionError) { setError(true); setMessage(actionError instanceof Error ? actionError.message : 'Could not update status.'); }
    finally { setBusyId(null); }
  }

  async function deleteProperty(property: PropertyRecord) {
    if (!isAdmin) { setError(true); setMessage('Only administrators can delete properties.'); return; }
    if (!window.confirm(`Delete “${property.title}”? This cannot be undone.`)) return;
    setBusyId(property.id); setMessage(''); setError(false);
    try { await request(`/properties/${encodeURIComponent(property.id)}`, { method: 'DELETE' }); markPropertyDeleted(property.id); setProperties((current) => current.filter((item) => item.id !== property.id)); setMessage(`“${property.title}” was deleted.`); await load(); }
    catch (actionError) { setError(true); setMessage(actionError instanceof Error ? actionError.message : 'Could not delete property.'); }
    finally { setBusyId(null); }
  }

  async function openEdit(property: PropertyRecord) {
    setBusyId(property.id); setMessage(''); setError(false);
    try { const result = await request(`/properties/${encodeURIComponent(property.id)}`); const loaded = records(result)[0] ?? asProperty(unwrap(result)); if (!loaded) throw new Error('The property service returned an unsupported property format.'); setEditing(loaded); }
    catch (editError) { setError(true); setMessage(editError instanceof Error ? editError.message : 'Could not load property details.'); }
    finally { setBusyId(null); }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return;
    const form = new FormData(event.currentTarget); const body: Record<string, unknown> = { title: String(form.get('title') ?? '').trim(), description: String(form.get('description') ?? '').trim(), address: String(form.get('address') ?? '').trim(), rent: Number(form.get('rent')), deposit: Number(form.get('deposit')), bedrooms: Number(form.get('bedrooms')), bathroom: Number(form.get('bathroom')), amenities: String(form.get('amenities') ?? '').split(/[\n,]/).map((amenity) => amenity.trim()).filter(Boolean) };
    const files = form.getAll('images').filter((item): item is File => item instanceof File && item.size > 0);
    setBusyId(editing.id); setMessage(''); setError(false);
    try {
      if (files.length) { const upload = new FormData(); files.forEach((file) => upload.append('images', file)); const uploaded = await request('/images', { method: 'POST', body: upload }); const keys = imageKeys(uploaded); if (!keys.length) throw new Error('Images uploaded, but the service did not return image keys.'); body.imageKeys = [...editing.imageKeys, ...keys]; }
      await request(`/properties/${encodeURIComponent(editing.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setEditing(null); setMessage('Property details saved.'); await load();
    } catch (saveError) { setError(true); setMessage(saveError instanceof Error ? saveError.message : 'Could not save property details.'); }
    finally { setBusyId(null); }
  }

  if (mode === 'overview' && isAdmin) {
    const reviewStatuses = ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'REVIEW', 'DRAFT'];
    const pendingCount = properties.filter((property) => reviewStatuses.includes(property.status)).length;
    const activeCount = properties.filter((property) => property.status === 'ACTIVE').length;
    const pausedCount = properties.filter((property) => property.status === 'PAUSED').length;
    const adminMetrics = [
      { label: 'Total properties', value: properties.length, icon: '⌂', tone: 'violet', note: 'Across the platform' },
      { label: 'Awaiting review', value: pendingCount, icon: '◷', tone: 'amber', note: 'Listings needing attention' },
      { label: 'Active listings', value: activeCount, icon: '✓', tone: 'green', note: 'Visible to property seekers' },
      { label: 'Paused listings', value: pausedCount, icon: 'Ⅱ', tone: 'violet', note: 'Currently hidden from search' },
    ];
    return <section className="admin-operations-dashboard" aria-label="Administrator operations">
      <header className="admin-console-header"><div><span className="eyebrow">PLATFORM ADMINISTRATION</span><h3>Property overview</h3><p>Monitor listing totals and status across the platform.</p></div><div className="admin-console-tools"><span className="landlord-sync-status" role="status"><i aria-hidden="true" />{loading ? 'Syncing properties' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Awaiting sync'}</span><button type="button" className="landlord-refresh-button" onClick={() => void load('all')} disabled={loading} aria-label="Refresh property overview"><span className={`refresh-button-icon${loading ? ' is-spinning' : ''}`} aria-hidden="true">↻</span>{loading ? 'Refreshing…' : 'Refresh data'}</button><Link href="/my-property" className="button button-primary">View all properties ↗</Link></div></header>
      {message && <p className={`rental-workflow-message${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}>{message}</p>}
      <div className="admin-metric-grid" aria-label="Platform property metrics">{adminMetrics.map((metric) => <article className={`admin-metric-card tone-${metric.tone}`} key={metric.label}><span className="admin-metric-icon" aria-hidden="true">{metric.icon}</span><div><small>{metric.label}</small><strong>{loading ? '—' : metric.value.toString().padStart(2, '0')}</strong><span>{metric.note}</span></div></article>)}</div>
    </section>;
  }

  if (mode === 'overview') {
    const rentedCount = properties.filter((property) => property.rentedOut).length;
    const availableCount = properties.filter((property) => property.status === 'ACTIVE' && !property.rentedOut).length;
    const metricItems = [
      { key: 'total' as const, label: 'Total properties', value: properties.length, icon: '⌂', tone: 'violet', note: 'Across your portfolio' },
      { key: 'available' as const, label: 'Available now', value: availableCount, icon: '↗', tone: 'green', note: 'Active and ready to rent' },
      { key: 'rented' as const, label: 'Rented out', value: rentedCount, icon: '✓', tone: 'amber', note: 'Currently occupied' },
      { key: 'viewings' as const, label: 'Booked viewings', value: bookedViewings ?? 0, icon: '◷', tone: 'violet', note: 'Upcoming property visits' },
    ];
    const metricDetails = {
      total: { title: 'Your portfolio at a glance', copy: `${properties.length} ${properties.length === 1 ? 'property is' : 'properties are'} connected to your landlord account.`, action: 'Explore properties' },
      available: { title: 'Ready for new tenants', copy: `${availableCount} ${availableCount === 1 ? 'home is' : 'homes are'} active and available for rent.`, action: 'Review availability' },
      rented: { title: 'Rental activity', copy: `${rentedCount} ${rentedCount === 1 ? 'property is' : 'properties are'} currently marked as rented out.`, action: 'Open your portfolio' },
      viewings: { title: 'Viewing schedule', copy: bookedViewings === null ? 'Viewing totals are temporarily unavailable. Refresh to try again.' : `${bookedViewings} active ${bookedViewings === 1 ? 'viewing is' : 'viewings are'} on your schedule.`, action: 'View your portfolio' },
    }[activeMetric];
    const insightRatio = activeMetric === 'total' ? (properties.length ? 100 : 0) : activeMetric === 'available' ? (properties.length ? Math.round(availableCount / properties.length * 100) : 0) : activeMetric === 'rented' ? (properties.length ? Math.round(rentedCount / properties.length * 100) : 0) : Math.min(100, (bookedViewings ?? 0) * 12);
    return <section className="landlord-portfolio-summary" aria-label="Property portfolio summary">
      <header className="landlord-summary-header"><div><span className="eyebrow">YOUR RENTAL BUSINESS</span><h3>Portfolio overview</h3><p>A live snapshot of your homes and rental activity.</p></div><div className="landlord-summary-tools"><span className="landlord-sync-status" role="status"><i aria-hidden="true" />{loading ? 'Updating portfolio' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Ready to refresh'}</span><button type="button" className="landlord-refresh-button" onClick={() => void load()} disabled={loading} aria-label="Refresh portfolio summary"><span className={`refresh-button-icon${loading ? ' is-spinning' : ''}`} aria-hidden="true">↻</span>{loading ? 'Refreshing…' : 'Refresh data'}</button></div></header>
      {error && <p className="rental-workflow-message is-error" role="alert">{message}</p>}
      <div className="landlord-overview-stats" role="group" aria-label="Select a portfolio metric">
        {metricItems.map((metric) => <button type="button" key={metric.key} className={`landlord-stat-card landlord-stat-card-button tone-${metric.tone}${activeMetric === metric.key ? ' is-selected' : ''}`} onClick={() => setActiveMetric(metric.key)} aria-pressed={activeMetric === metric.key}>
          <span className="landlord-stat-icon" aria-hidden="true">{metric.icon}</span><span className="landlord-stat-copy"><span>{metric.label}</span><strong>{loading ? '—' : metric.key === 'viewings' && bookedViewings === null ? '—' : metric.value.toString().padStart(2, '0')}</strong><small>{metric.note}</small></span><span className="landlord-stat-arrow" aria-hidden="true">↗</span><span className="landlord-stat-meter" aria-hidden="true"><i style={{ width: `${metric.key === 'viewings' && bookedViewings === null ? 0 : metric.key === 'total' ? (properties.length ? 100 : 0) : metric.key === 'available' ? (properties.length ? Math.round(availableCount / properties.length * 100) : 0) : metric.key === 'rented' ? (properties.length ? Math.round(rentedCount / properties.length * 100) : 0) : Math.min(100, metric.value * 12)}%` }} /></span>
        </button>)}
      </div>
      <div className="landlord-summary-insight" aria-live="polite"><div className="landlord-insight-icon" aria-hidden="true">✦</div><div className="landlord-insight-copy"><span>PORTFOLIO INSIGHT</span><h4>{metricDetails.title}</h4><p>{metricDetails.copy}</p></div><div className="landlord-insight-progress"><strong>{insightRatio}%</strong><span>{activeMetric === 'viewings' ? 'activity' : 'of portfolio'}</span><i><b style={{ width: `${insightRatio}%` }} /></i></div><Link className="landlord-insight-action" href="/my-property">{metricDetails.action}<span aria-hidden="true">↗</span></Link></div>
      <div className="landlord-summary-footer"><span><i aria-hidden="true">✓</i>{error ? 'Some portfolio data may be unavailable' : loading ? 'Refreshing your portfolio' : 'Portfolio synced with your account'}</span><div><Link href="/submit-property" className="landlord-summary-add">＋ Add property</Link><Link href="/my-property" className="landlord-summary-manage">Manage properties <span aria-hidden="true">↗</span></Link></div></div>
      <section className="landlord-viewing-manager" aria-label="Landlord viewing schedule">
        <header className="landlord-viewing-header"><div><span className="eyebrow">VIEWING SCHEDULE</span><h4>Property viewings</h4><p>Review viewings across your portfolio or open an individual viewing record.</p></div><div className="landlord-viewing-tools"><label>Property<select aria-label="Select a property to view its bookings" value={viewingPropertyId} onChange={(event) => setViewingPropertyId(event.target.value)}><option value="">All properties</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label><button type="button" onClick={() => void (viewingPropertyId ? loadPropertyViewings(viewingPropertyId) : loadAllViewings())} disabled={viewingsLoading}>{viewingsLoading ? 'Loading…' : viewingPropertyId ? 'Load property viewings' : 'Load all viewings'}</button></div></header>
        {viewingsError && <p className="rental-workflow-message is-error" role="alert">{viewingsError}</p>}
        {viewingsLoading ? <p className="landlord-viewing-empty" role="status">Loading viewing records…</p> : landlordViewings.length ? <div className="landlord-viewing-list">{landlordViewings.map((viewing) => <article className="landlord-viewing-row" key={viewing.id}><div><b>{viewing.property}</b><span>{viewing.tenant} · {formatViewingDate(viewing.startTime)}</span></div><span className={`rental-status status-${viewing.status.toLowerCase()}`}>{viewing.status}</span><button type="button" onClick={() => void loadViewingDetail(viewing)} disabled={viewingActionId === viewing.id}>{viewingActionId === viewing.id ? 'Loading…' : 'View details'}</button></article>)}</div> : <p className="landlord-viewing-empty">{viewingsError ? 'Viewing records could not be loaded.' : 'No viewing records found for this selection.'}</p>}
        {selectedViewing && <aside className="landlord-viewing-detail" aria-live="polite">
          <div className="landlord-viewing-detail-heading"><div><span className="eyebrow">VIEWING DETAILS</span><h5>{selectedViewing.property}</h5></div><button type="button" onClick={() => setSelectedViewing(null)} aria-label="Close viewing details">×</button></div>
          {viewingDetailLoading ? <p role="status">Loading viewing details…</p> : <>
            <dl><div><dt>Viewing ID</dt><dd>{selectedViewing.id}</dd></div><div><dt>Property ID</dt><dd>{selectedViewing.propertyId || 'Not provided'}</dd></div><div><dt>Tenant</dt><dd>{selectedViewing.tenant}</dd></div><div><dt>Scheduled time</dt><dd>{formatViewingDate(selectedViewing.startTime)}</dd></div><div><dt>Status</dt><dd>{selectedViewing.status}</dd></div>{typeof (selectedViewing.raw.endTime ?? selectedViewing.raw.endsAt) === 'string' && <div><dt>End time</dt><dd>{formatViewingDate(String(selectedViewing.raw.endTime ?? selectedViewing.raw.endsAt))}</dd></div>}</dl>
            <div className="landlord-viewing-actions"><label>Update status<select value={nextViewingStatus} onChange={(event) => setNextViewingStatus(event.target.value)}><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="COMPLETED">Completed</option></select></label><button type="button" onClick={() => void updateViewingStatus(selectedViewing, nextViewingStatus)} disabled={viewingActionId === selectedViewing.id || nextViewingStatus === selectedViewing.status}>{viewingActionId === selectedViewing.id ? 'Saving…' : 'Update status'}</button><button type="button" onClick={() => void completeViewing(selectedViewing)} disabled={viewingActionId === selectedViewing.id || selectedViewing.status === 'COMPLETED'}>{viewingActionId === selectedViewing.id ? 'Saving…' : 'Mark completed'}</button></div>
          </>}
        </aside>}
      </section>
    </section>;
  }

  const reviewStatuses = ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'REVIEW', 'DRAFT'];
  const inventoryMatches = properties.filter((property) => {
    const matchesStatus = !isAdmin || adminStatusFilter === 'ALL' || (adminStatusFilter === 'PENDING' ? reviewStatuses.includes(property.status) : property.status === adminStatusFilter);
    const query = isAdmin ? adminSearch.trim().toLowerCase() : '';
    const matchesSearch = !query || `${property.title} ${property.address} ${property.id}`.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return <section className="landlord-api-properties">
    <div className="listing-heading-row"><div><span className="eyebrow">{isAdmin ? 'PLATFORM CATALOG' : 'YOUR PORTFOLIO'}</span><h3>{isAdmin ? 'All properties' : 'Property listings'}</h3><p>{isAdmin ? 'Review and manage every property listed on the platform.' : 'Manage property details, visibility, and photos.'}</p></div><div className="landlord-api-controls">{!isAdmin && <label>Show<select value={view} onChange={(event) => setView(event.target.value as typeof view)}><option value="landlord">My properties</option></select></label>}<button type="button" className="button button-outline" onClick={() => void load(isAdmin ? 'all' : view)} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>{!isAdmin && <Link className="button button-primary" href="/submit-property">＋ Add property</Link>}</div></div>
    {isAdmin && <div className="admin-inventory-toolbar"><label className="admin-inventory-search"><span aria-hidden="true">⌕</span><input aria-label="Search properties" value={adminSearch} onChange={(event) => setAdminSearch(event.target.value)} placeholder="Search by property, address, or ID" /></label><label className="admin-status-select">Status<select aria-label="Filter properties by status" value={adminStatusFilter} onChange={(event) => setAdminStatusFilter(event.target.value)}><option value="ALL">All statuses</option><option value="PENDING">Needs review</option><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option><option value="RENTED">Rented</option><option value="REJECTED">Rejected</option></select></label><span className="admin-results-count">{loading ? 'Loading…' : `${inventoryMatches.length} properties`}</span></div>}
    {message && <p className={`rental-workflow-message${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}>{message}</p>}
    {loading ? <p role="status">Loading properties…</p> : properties.length ? inventoryMatches.length ? <div className="landlord-api-property-list">{inventoryMatches.map((property) => <article className="landlord-api-property" key={property.id}><div><span className={`rental-status status-${property.status.toLowerCase()}`}>{property.status}</span><h4>{property.title}</h4><p>{property.address}</p><strong>GH₵ {property.rent.toLocaleString()} / month</strong></div>{(view === 'landlord' || isAdmin) && <div className="landlord-api-actions">{view === 'landlord' && !isAdmin && <button type="button" className="button button-outline" disabled={busyId === property.id} onClick={() => void openEdit(property)}>Edit details</button>}{isAdmin && <button type="button" className="button button-outline" disabled={busyId === property.id} onClick={() => void deleteProperty(property)}>Delete</button>}{isAdmin && <>{property.status === 'ACTIVE' ? <button type="button" className="button button-outline" disabled={busyId === property.id} onClick={() => void updateStatus(property, 'PAUSED')}>Pause</button> : <button type="button" className="button button-outline" disabled={busyId === property.id} onClick={() => void updateStatus(property, 'ACTIVE')}>Activate</button>}</>}</div>}</article>)}</div> : <p>No properties match your search and status filters.</p> : <p>{error ? message || 'Could not load properties.' : 'No properties found.'}</p>}
    {editing && <div className="landlord-edit-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><form className="form-card landlord-edit-dialog" onSubmit={saveEdit} aria-labelledby="landlord-edit-title"><div><span className="eyebrow">PROPERTY DETAILS</span><h3 id="landlord-edit-title">Edit {editing.title}</h3></div><label>Property title<input required name="title" defaultValue={editing.title} /></label><label>Address<input required name="address" defaultValue={editing.address} /></label><div className="form-grid"><label>Monthly rent<input required name="rent" type="number" min="1" step="0.01" defaultValue={editing.rent} /></label><label>Deposit<input required name="deposit" type="number" min="0" step="0.01" defaultValue={editing.deposit} /></label><label>Bedrooms<input required name="bedrooms" type="number" min="0" defaultValue={editing.bedrooms} /></label><label>Bathrooms<input required name="bathroom" type="number" min="0" defaultValue={editing.bathroom} /></label></div><label>Description<textarea name="description" rows={4} defaultValue={editing.description} /></label><label>Amenities <span className="optional-field-label">Optional</span><textarea name="amenities" rows={3} defaultValue={editing.amenities.join('\n')} placeholder="e.g. WiFi, air conditioning, secure parking" /><small className="optional-field-help">Separate amenities with commas or put each on a new line.</small></label><label>Add property photos<input type="file" name="images" accept="image/*" multiple /></label><p className="rental-info-note">New photos will upload first, then their image keys will be saved with the property.</p><div className="landlord-api-actions"><button type="button" className="button button-outline" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="button button-primary" disabled={busyId === editing.id}>{busyId === editing.id ? 'Saving…' : 'Save changes'}</button></div></form></div>}
  </section>;
}
