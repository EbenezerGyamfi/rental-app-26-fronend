'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { CompareHomes, SavedHomes } from './PropertyCollections';
import { ApiUnavailable } from './Interactive';
import { RentalDashboard, RentalPropertyForm, useAccountRole } from './RentalWorkflow';

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
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    try {
      for (const storage of [window.sessionStorage, window.localStorage]) {
        const session = JSON.parse(storage.getItem('rentrite-session') ?? 'null') as { user?: unknown } | null;
        if (session?.user && typeof session.user === 'object') { setUser(session.user as Record<string, unknown>); return; }
      }
    } catch { setUser(null); }
  }, []);
  if (slug !== 'my-profile') return <ApiUnavailable title="Profile service unavailable" />;
  const display = (value: unknown) => typeof value === 'string' && value.trim() ? value : 'Not provided by the account service';
  const fullName = user?.name ?? user?.fullName ?? user?.full_name;
  const role = typeof user?.role === 'string' ? user.role : 'Account role not returned';
  const avatar = typeof fullName === 'string' && fullName ? fullName.slice(0, 1).toUpperCase() : '•';
  return <div className="landlord-profile-page">
    <header className="landlord-profile-hero"><div className="landlord-profile-avatar" aria-hidden="true">{avatar}</div><div className="landlord-profile-hero-copy"><span className="eyebrow">ACCOUNT PROFILE</span><h2>{display(fullName)}</h2><p>Profile details returned by your signed-in account.</p></div><span className="landlord-profile-role"><span aria-hidden="true">⌂</span> {role}</span></header>
    <div className="landlord-profile-layout"><section className="landlord-profile-form"><h2>Account information</h2><p>These details come from your authentication session.</p><dl className="account-profile-details"><div><dt>Full name</dt><dd>{display(fullName)}</dd></div><div><dt>Email</dt><dd>{display(user?.email)}</dd></div><div><dt>Phone</dt><dd>{display(user?.phone)}</dd></div><div><dt>Role</dt><dd>{role}</dd></div></dl><ApiUnavailable title="Profile editing is not available" description="The connected API collection does not include a profile update endpoint." /></section>
      <aside className="landlord-profile-aside"><div className="profile-aside-mark" aria-hidden="true">✦</div><span className="eyebrow">Connected account</span><h3>Your account details</h3><p>Account fields above are read from the user record returned at sign-in.</p><div className="profile-aside-tip"><span aria-hidden="true">⌂</span><div><b>{role}</b><small>Account permissions come from your authentication service.</small></div></div><Link href="/my-property" className="profile-aside-link">Go to my properties <span aria-hidden="true">↗</span></Link></aside>
    </div>
  </div>;
}

function PaymentForm() {
  return <ApiUnavailable title="Payment information" description="Payment services are not available from the connected API yet." />;
}

function PropertyRows() {
  return <div className="empty-state"><h2>No live activity to show</h2><p>Property and account activity will appear here when it is returned by the connected service.</p><Link href="/list-layout-new" className="button button-primary">Browse live properties ↗</Link></div>;
}

export default function DashboardView({ slug }: { slug: string }) {
  const { role: accountRole, ready: accountRoleReady } = useAccountRole();
  const isAdmin = accountRoleReady && accountRole === 'admin';
  const dashboardTitle = isAdmin && slug === 'dashboard' ? 'Admin dashboard' : isAdmin && slug === 'my-property' ? 'All properties' : titles[slug] ?? 'Your Resido account';
  const dashboardLinks = isAdmin ? [['Overview', '/dashboard'], ['All properties', '/my-property'], ['Browse public site', '/list-layout-new']] : [['Overview', '/dashboard'], ['My profile', '/my-profile'], ['My properties', '/my-property'], ['Saved homes', '/bookmark-list'], ['Compare homes', '/compare-property'], ['Add property', '/submit-property-dashboard'], ['Agents', '/agents']];
  if (slug === 'submit-property') return <PropertySubmissionPage />;
  if (slug === 'compare-property') return <section className="compare-page">
    <div className="compare-page-hero"><div className="container"><span className="eyebrow">A clearer way to choose</span><h1>Compare your favourite homes.</h1><p>See the details side by side and find the one that feels right for you.</p><Link href="/list-layout-new" className="compare-add-link">Add another home <span aria-hidden="true">↗</span></Link></div></div>
    <div className="container compare-page-content"><CompareHomes /></div>
  </section>;
  const title = dashboardTitle;
  let panel: ReactNode;
  if (slug === 'bookmark-list') panel = <SavedHomes />;
  else if (slug === 'submit-property-dashboard') panel = <RentalPropertyForm />;
  else if (slug === 'checkout' || slug === 'payment') panel = <PaymentForm />;
  else if (slug === 'my-profile' || slug === 'add-agent' || slug === 'edit-agent') panel = <ProfileForm slug={slug} />;
  else if (slug === 'dashboard' || slug === 'my-property') panel = <RentalDashboard page={slug === 'my-property' ? 'properties' : 'overview'} />;
  else panel = <PropertyRows />;

  return <>
    <section className="page-intro"><div className="container"><span className="eyebrow">{isAdmin ? 'Resido administration' : 'Your Resido space'}</span><h1>{title}</h1><p>{isAdmin ? 'Review property submissions and keep the marketplace accurate and up to date.' : 'Manage your property journey and keep the details that matter in one place.'}</p></div></section>
    <div className="container dashboard-layout">
      <aside className="dashboard-nav">
        <div className="dashboard-user"><span className="user-avatar">{isAdmin ? 'A' : 'R'}</span><div><b>{isAdmin ? 'Administrator' : 'Your account'}</b><small>{isAdmin ? 'Platform workspace' : accountRoleReady ? `${accountRole[0].toUpperCase()}${accountRole.slice(1)} account` : 'Loading account'}</small></div></div>
        {dashboardLinks.map(([label, href]) => <Link key={href} className={href === '/dashboard' && slug === 'dashboard' || href === '/my-property' && slug === 'my-property' ? 'dashboard-link active' : 'dashboard-link'} href={href}>{label}<span>↗</span></Link>)}
        {!isAdmin && <Link className="dashboard-link dashboard-logout" href="/create-account">Sign in / register</Link>}
      </aside>
      <section className="dashboard-content">
        <div className="dashboard-welcome"><div><span className="eyebrow">{isAdmin ? 'ADMIN CONSOLE' : 'ACCOUNT OVERVIEW'}</span><h2>{title}</h2><p>{isAdmin ? 'Moderate property listings and maintain marketplace quality.' : 'View and manage the information provided by your connected account.'}</p></div><span className="dashboard-date">{isAdmin ? 'Administrator workspace' : `${accountRole[0].toUpperCase()}${accountRole.slice(1)} account`}</span></div>
        {panel}
      </section>
    </div>
  </>;
}
