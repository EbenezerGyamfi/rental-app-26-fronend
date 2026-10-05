'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import ListingPhotoPicker from './ListingPhotoPicker';

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export function RentalAccountForm({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';
  const [role, setRole] = useState('TENANT');
  const [message, setMessage] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(isLogin ? 'Sign in form submitted. Account verification will be connected to the backend.' : `Your ${role.toLowerCase()} account details are ready to connect to registration and verification.`);
  }

  return <form className="form-card rental-account-form" onSubmit={handleSubmit}>
    {!isLogin && <>
      <label>Full name<input required name="name" autoComplete="name" placeholder="Your name" /></label>
      <label>Phone<input name="phone" type="tel" autoComplete="tel" placeholder="+233" /></label>
      <label>Account role<select name="role" value={role} onChange={(event) => setRole(event.target.value)}><option value="TENANT">Tenant</option><option value="LANDLORD">Landlord</option></select></label>
    </>}
    <label>Email address<input required type="email" name="email" autoComplete="email" placeholder="you@example.com" /></label>
    <label>Password<input required type="password" name="password" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={8} placeholder="At least 8 characters" /></label>
    {!isLogin && <p className="rental-demo-note">Email verification will be completed through the connected account service.</p>}
    {message && <p className="rental-workflow-message" role="status">{message}</p>}
    <button className="button button-primary" type="submit">{isLogin ? 'Sign in' : 'Create account'} <span aria-hidden="true">↗</span></button>
  </form>;
}

export function RentalPropertyForm() {
  const [message, setMessage] = useState('');
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(`“${String(form.get('title'))}” is ready to submit as a draft listing.`);
  }

  return <form className="form-card listing-form-card rental-property-form" onSubmit={handleSubmit}>
    <h2>Property details</h2><p>Add a rental home. New listings start as drafts until a landlord activates them.</p>
    <section className="listing-form-section"><div className="form-grid">
      <label>Property title<input required name="title" placeholder="e.g. Bright apartment in East Legon" /></label>
      <label>Location<input required name="address" placeholder="Area or neighbourhood" /></label>
      <label>Monthly rent (GH₵)<input required name="rent" type="number" min="1" step="0.01" /></label>
      <label>Security deposit (GH₵)<input required name="deposit" type="number" min="0" step="0.01" /></label>
      <label>Bedrooms<input required name="bedrooms" type="number" min="0" defaultValue="1" /></label>
      <label>Bathrooms<input required name="bathrooms" type="number" min="0" defaultValue="1" /></label>
    </div>
    <label>Description<textarea required name="description" rows={4} /></label>
    <ListingPhotoPicker /></section>
    {message && <p className="rental-workflow-message" role="status">{message}</p>}
    <button className="button button-primary" type="submit">Save draft ↗</button>
  </form>;
}

export function RentalPropertyActions({ propertyID, propertyTitle, rent, deposit = 0 }: { propertyID: string; propertyTitle: string; rent: number; deposit?: number }) {
  const [message, setMessage] = useState('');
  function submit(event: FormEvent<HTMLFormElement>, action: 'viewing' | 'application') {
    event.preventDefault();
    setMessage(action === 'viewing' ? `Your viewing request for ${propertyTitle} is ready to submit.` : `Your application for ${propertyTitle} is ready for landlord review as PENDING.`);
  }

  return <div className="rental-detail-actions" data-property-id={propertyID} data-rent={rent} data-deposit={deposit}>
    <form className="form-card rental-action-form" onSubmit={(event) => submit(event, 'viewing')}>
      <h3>Book a viewing</h3><label>Preferred date and time<input required type="datetime-local" name="datetime" /></label>
      <button className="button button-outline" type="submit">Request viewing</button>
    </form>
    <form className="form-card rental-action-form" onSubmit={(event) => submit(event, 'application')}>
      <h3>Apply for this rental</h3><p>Include a supporting document for the landlord to review.</p>
      <label>Supporting document (PDF or image)<input required type="file" name="document" accept="application/pdf,image/*" /></label>
      <button className="button button-primary" type="submit">Submit application</button>
    </form>
    {message && <p className="rental-workflow-message" role="status">{message}</p>}
  </div>;
}

const sampleProperties = [
  { title: 'East Legon apartment', address: 'East Legon, Accra', rent: 12500, status: 'ACTIVE' },
  { title: 'Labone garden residence', address: 'Labone, Accra', rent: 9800, status: 'DRAFT' },
];
const sampleViewings = [
  { property: 'East Legon apartment', tenant: 'Akosua A.', datetime: 'Oct 11, 2026 · 10:30 AM', status: 'ACTIVE' },
];
const sampleApplications = [
  { id: 'app-1', property: 'East Legon apartment', tenant: 'Kojo M.', document: 'tenant-reference.pdf', status: 'PENDING' as ApplicationStatus },
];

export function RentalDashboard() {
  const [applications, setApplications] = useState(sampleApplications);
  const [properties, setProperties] = useState(sampleProperties);
  const [viewings, setViewings] = useState(sampleViewings);
  const [message, setMessage] = useState('');
  const [role, setRole] = useState<'LANDLORD' | 'TENANT' | 'ADMIN'>('LANDLORD');
  const isLandlord = role === 'LANDLORD' || role === 'ADMIN';

  function setApplicationStatus(id: string, status: ApplicationStatus) {
    setApplications((current) => current.map((application) => application.id === id ? { ...application, status } : application));
    setMessage(status === 'APPROVED' ? 'Application approved. Lease details can now be prepared.' : 'Application status updated.');
  }

  function setPropertyStatus(index: number, status: string) {
    setProperties((current) => current.map((property, i) => i === index ? { ...property, status } : property));
  }

  function setViewingStatus(index: number, status: string) {
    setViewings((current) => current.map((viewing, i) => i === index ? { ...viewing, status } : viewing));
  }

  return <div className="rental-workspace">
    <div className="rental-workspace-heading"><div><span className="eyebrow">Rental workspace</span><h2>Manage your rental journey</h2><p>Review the screens and actions for each account role.</p></div><label>Preview role<select value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="LANDLORD">Landlord</option><option value="TENANT">Tenant</option><option value="ADMIN">Admin</option></select></label></div>
    {message && <p className="rental-workflow-message" role="status">{message}</p>}
    {isLandlord && <section className="rental-workspace-section"><div className="listing-heading-row"><div><span className="eyebrow">Property lifecycle</span><h3>Property listings</h3></div><Link className="button button-primary" href="/submit-property">Add rental ↗</Link></div>
      <div className="rental-record-list">{properties.map((property, index) => <article className="rental-record" key={property.title}><div><b>{property.title}</b><span>{property.address} · GH₵ {property.rent.toLocaleString()} / month</span></div><span className={`rental-status status-${property.status.toLowerCase()}`}>{property.status}</span><div className="rental-record-actions">{property.status === 'DRAFT' && <button type="button" onClick={() => setPropertyStatus(index, 'ACTIVE')}>Activate</button>}{property.status === 'ACTIVE' && <button type="button" onClick={() => setPropertyStatus(index, 'PAUSED')}>Pause</button>}{property.status === 'PAUSED' && <button type="button" onClick={() => setPropertyStatus(index, 'ACTIVE')}>Reactivate</button>}{property.status !== 'DELETED' && <button type="button" onClick={() => setPropertyStatus(index, 'DELETED')}>Delete</button>}</div></article>)}</div>
    </section>}
    <section className="rental-workspace-section"><span className="eyebrow">Viewing workflow</span><h3>{isLandlord ? 'Viewing requests' : 'My viewing requests'}</h3><div className="rental-record-list">{viewings.map((viewing, index) => <article className="rental-record" key={viewing.property}><div><b>{viewing.property}</b><span>{isLandlord ? `${viewing.tenant} · ` : ''}{viewing.datetime}</span></div><span className={`rental-status status-${viewing.status.toLowerCase()}`}>{viewing.status}</span>{viewing.status === 'ACTIVE' && <div className="rental-record-actions"><button type="button" onClick={() => setViewingStatus(index, isLandlord ? 'PAUSED' : 'DELETED')}>{isLandlord ? 'Pause' : 'Cancel request'}</button></div>}</article>)}</div></section>
    <section className="rental-workspace-section"><span className="eyebrow">Application workflow</span><h3>{isLandlord ? 'Applications to review' : 'My applications'}</h3><div className="rental-record-list">{applications.map((application) => <article className="rental-record" key={application.id}><div><b>{application.property}</b><span>{isLandlord ? `${application.tenant} · ` : ''}{application.document}</span></div><span className={`rental-status status-${application.status.toLowerCase()}`}>{application.status}</span>{isLandlord && application.status === 'PENDING' && <div className="rental-record-actions"><button type="button" onClick={() => setApplicationStatus(application.id, 'APPROVED')}>Approve</button><button type="button" onClick={() => setApplicationStatus(application.id, 'REJECTED')}>Reject</button></div>}</article>)}</div></section>
    {applications.some((item) => item.status === 'APPROVED') && <section className="rental-workspace-section"><span className="eyebrow">Lease</span><h3>Lease preparation</h3><p>Approved rental applications are ready for a lease record with property, start/end dates, rent, deposit, and signing date.</p><div className="form-grid"><label>Lease start date<input type="date" /></label><label>Lease end date<input type="date" /></label><label>Monthly rent<input type="number" placeholder="GH₵" /></label><label>Deposit<input type="number" placeholder="GH₵" /></label></div><button className="button button-outline" type="button" onClick={() => setMessage('Lease details are ready to be connected to the backend.')}>Prepare lease</button></section>}
    <p className="rental-demo-note">Interactive UI preview only. Account data, listings, uploads, requests, and status changes are not saved or sent until the backend is connected.</p>
  </div>;
}
