import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-block">
          <Link href="/" className="brand brand-footer"><span className="brand-mark" aria-hidden="true">R</span><span>resido<span className="brand-dot">.</span></span></Link>
          <p>Find a place to call home. Explore considered homes and trusted property professionals across Ghana.</p>
          <Link href="/contact" className="footer-contact">Contact the Resido team ↗</Link>
        </div>
        <div><h2>Explore</h2><Link href="/list-layout-new">Homes for sale</Link><Link href="/list-layout-with-sidebar">Homes for rent</Link><Link href="/agents">Find an agent</Link><Link href="/agencies">Agencies</Link></div>
        <div><h2>Resido</h2><Link href="/about-us">About us</Link><Link href="/blog">Journal</Link><Link href="/pricing">Pricing</Link><Link href="/contact">Contact</Link></div>
        <div><h2>Get in touch</h2><p>Have a question about a home or listing?</p><Link href="/contact" className="footer-contact">Talk to our team ↗</Link></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Resido. Sample property content.</span><span>Thoughtful places. Better living.</span></div>
    </footer>
  );
}
