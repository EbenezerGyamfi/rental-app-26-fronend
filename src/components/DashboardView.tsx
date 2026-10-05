import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { properties } from '@/src/data/real-estate';
import { CompareHomes, SavedHomes } from './PropertyCollections';
import { DemoForm } from './Interactive';
import { RentalDashboard, RentalPropertyForm } from './RentalWorkflow';

const titles: Record<string, string> = {
  dashboard: 'Your dashboard', 'my-profile': 'Your profile', 'my-property': 'Your properties',
  'submit-property': 'List a property', 'submit-property-dashboard': 'Add a new property',
  'add-agent': 'Add a team member', 'edit-agent': 'Edit agent details',
  'bookmark-list': 'Saved homes', 'compare-property': 'Compare homes',
  checkout: 'Complete your order', payment: 'Payment details',
};

function PropertySubmissionPage() {
  return <div className="submit-property-page">
    <section className="submit-property-hero"><div className="container submit-property-hero-copy"><span className="eyebrow eyebrow-light">A good home deserves to be seen</span><h1>Make your property<br /><em>the place they choose.</em></h1><p>Share your listing with people searching for their next home in Ghana.</p></div></section>
    <div className="container submit-property-content"><div className="submit-property-main">
      <div className="submit-property-progress"><span className="submit-progress-line" aria-hidden="true" /><div><b>1</b><span>Property details</span></div><div><b>2</b><span>Photos</span></div><div><b>3</b><span>Preview</span></div></div>
      <RentalPropertyForm />
    </div><aside className="submit-property-aside"><span className="submit-aside-icon">✦</span><span className="eyebrow">A few helpful tips</span><h2>Make a great first impression.</h2><p>Clear details and bright, recent photos help people get a better feel for your home.</p><ul><li>Use a clear, descriptive title</li><li>Include the neighbourhood</li><li>Choose your best property photos</li></ul><div className="submit-aside-note"><span>⌂</span><p>Listings follow a draft, active, paused, and deleted lifecycle.</p></div></aside></div>
  </div>;
}

function ProfileForm({ slug }: { slug: string }) {
  return <DemoForm title="Profile information" description="Profile updates are shown as a front-end demo and are not saved to an account.">
    <div className="form-grid">
      <label>Full name<input defaultValue={slug === 'my-profile' ? 'Resido Member' : ''} /></label>
      <label>Email<input type="email" placeholder="you@example.com" /></label>
      <label>Phone<input type="tel" placeholder="+233" /></label>
      <label>Role<select defaultValue="Agent"><option>Agent</option><option>Agency administrator</option><option>Property owner</option></select></label>
    </div>
    <label>About<textarea rows={4} /></label>
  </DemoForm>;
}

function PaymentForm() {
  return <DemoForm title="Payment information" description="This demo does not collect or process payment details.">
    <div className="form-grid">
      <label>Name on account<input required autoComplete="name" /></label>
      <label>Email address<input required type="email" autoComplete="email" /></label>
      <label>Billing address<input required autoComplete="street-address" /></label>
      <label>Payment method<select defaultValue="Choose a method"><option disabled>Choose a method</option><option>Card (demo only)</option><option>Mobile money (demo only)</option></select></label>
    </div>
  </DemoForm>;
}

function PropertyRows() {
  return <div className="saved-list">{properties.slice(0, 3).map((property) => <div className="saved-row" key={property.id}>
    <Image src={property.image} alt="" width={116} height={82} />
    <div><span className="eyebrow">{property.status}</span><h3>{property.title}</h3><p>{property.address}</p></div>
    <strong>{property.price}</strong>
  </div>)}</div>;
}

export default function DashboardView({ slug }: { slug: string }) {
  if (slug === 'submit-property') return <PropertySubmissionPage />;
  if (slug === 'compare-property') return <section className="compare-page">
    <div className="compare-page-hero"><div className="container"><span className="eyebrow">A clearer way to choose</span><h1>Compare your favourite homes.</h1><p>See the details side by side and find the one that feels right for you.</p><Link href="/list-layout-new" className="compare-add-link">Add another home <span aria-hidden="true">↗</span></Link></div></div>
    <div className="container compare-page-content"><CompareHomes /></div>
  </section>;
  const title = titles[slug] ?? 'Your Resido account';
  let panel: ReactNode;
  if (slug === 'bookmark-list') panel = <SavedHomes />;
  else if (slug === 'submit-property-dashboard') panel = <RentalPropertyForm />;
  else if (slug === 'checkout' || slug === 'payment') panel = <PaymentForm />;
  else if (slug === 'my-profile' || slug === 'add-agent' || slug === 'edit-agent') panel = <ProfileForm slug={slug} />;
  else if (slug === 'dashboard' || slug === 'my-property') panel = <RentalDashboard />;
  else panel = <PropertyRows />;

  return <>
    <section className="page-intro"><div className="container"><span className="eyebrow">Your Resido space</span><h1>{title}</h1><p>Manage your property journey and keep the details that matter in one place.</p></div></section>
    <div className="container dashboard-layout">
      <aside className="dashboard-nav">
        <div className="dashboard-user"><span className="user-avatar">R</span><div><b>Welcome back</b><small>Demo account</small></div></div>
        {[
          ['Overview', '/dashboard'], ['My profile', '/my-profile'], ['My properties', '/my-property'],
          ['Saved homes', '/bookmark-list'], ['Compare homes', '/compare-property'],
          ['Add property', '/submit-property-dashboard'], ['Agents', '/agents'],
        ].map(([label, href]) => <Link key={href} className={href.includes(slug) ? 'dashboard-link active' : 'dashboard-link'} href={href}>{label}<span>↗</span></Link>)}
        <Link className="dashboard-link dashboard-logout" href="/create-account">Sign in / register</Link>
      </aside>
      <section className="dashboard-content">
        <div className="dashboard-welcome"><div><span className="eyebrow">A fresh start</span><h2>{title}</h2><p>This account area is a front-end demonstration. Changes are not saved to an account.</p></div><span className="dashboard-date">Your property space</span></div>
        {slug === 'dashboard' && <div className="dashboard-stats"><article><span>Active listings</span><b>01</b></article><article><span>Viewing requests</span><b>01</b></article><article><span>Pending applications</span><b>01</b></article></div>}
        {panel}
      </section>
    </div>
  </>;
}
