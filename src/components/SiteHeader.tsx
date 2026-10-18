'use client';

import Link from 'next/link';
import { useState } from 'react';

const homeLinks = [
  ['Home layout 1', '/'], ['Home layout 2', '/home-2'], ['Home layout 3', '/home-3'],
  ['Home layout 4', '/home-4'], ['Home layout 5', '/home-5'], ['Home layout 6', '/home-6'],
  ['Home layout 7', '/home-7'], ['Home layout 8', '/home-8'], ['Home layout 9', '/home-9'],
  ['Home layout 10', '/home-10'], ['Home layout 11', '/home-11'], ['Video home', '/video'], ['Map home', '/map'],
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Resido home">
          <span className="brand-mark" aria-hidden="true">R</span><span>resido<span className="brand-dot">.</span></span>
        </Link>
        <button className="menu-toggle" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
        <nav id="primary-navigation" className={open ? 'primary-nav is-open' : 'primary-nav'} aria-label="Main navigation" onClick={(event) => { if ((event.target as HTMLElement).closest('a')) setOpen(false); }}>
          <div className="nav-group"><Link href="/" className="nav-link">Home</Link><div className="nav-menu">{homeLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div></div>
          <div className="nav-group"><Link href="/list-layout-new" className="nav-link">Properties</Link><div className="nav-menu">
            <Link href="/list-layout-new">Browse properties</Link><Link href="/grid">Grid view</Link><Link href="/half-map">Map search</Link><Link href="/compare-property">Compare properties</Link>
          </div></div>
          <div className="nav-group"><Link href="/agents" className="nav-link">Agents</Link><div className="nav-menu"><Link href="/agents">Find an agent</Link><Link href="/agencies">Agencies</Link><Link href="/agency-page">Agency profile</Link></div></div>
          <div className="nav-group"><Link href="/blog" className="nav-link">Journal</Link><div className="nav-menu"><Link href="/blog">Latest articles</Link><Link href="/about-us">About Resido</Link><Link href="/contact">Contact</Link></div></div>
          <Link href="/dashboard" className="nav-link nav-dashboard-link">Dashboard</Link>
          <Link href="/login" className="nav-account">Sign in</Link>
          <Link href="/submit-property" className="button button-primary header-cta">List your property <span aria-hidden="true">＋</span></Link>
        </nav>
      </div>
    </header>
  );
}
