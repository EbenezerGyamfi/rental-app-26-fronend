import Image from 'next/image';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { articles, detailSlugs, listingSlugs } from '@/src/data/real-estate';
import FeaturedHomes from './FeaturedHomes';
import SearchPanel from './SearchPanel';
import SectionHeading from './SectionHeading';
import DashboardView from './DashboardView';
import { ApiUnavailable, FAQList, ListingResults } from './Interactive';
import { PasswordRecoveryForm, RentalAccountForm } from './RentalWorkflow';

function PageIntro({ eyebrow, title, description, className = '' }: { eyebrow: string; title: string; description: string; className?: string }) {
  return <section className={`page-intro ${className}`}><div className="container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div></section>;
}

export function HomePage({ slug }: { slug: string }) {
  const homeIndex = slug === 'index' ? 1 : Number(slug.match(/home-(\d+)/)?.[1] ?? 1);
  const headlines = [
    'Find a home that feels like yours.', 'A better way to find your place.', 'Make room for what matters.',
    'Good homes. Good neighbourhoods.', 'Come home to something special.', 'Space for your next chapter.',
    'Find the right place to begin.', 'A little closer to home.', 'Live well, wherever you land.',
    'Your next home is out there.', 'A place to call your own.',
  ];
  const heroTitle = headlines[(homeIndex - 1) % headlines.length];
  return (
    <>
      <section className={`home-hero home-hero-${homeIndex} ${slug === 'index' ? 'home-hero-index' : ''}`}>
        <div className="hero-shade" />
        <div className="container hero-content"><span className="eyebrow eyebrow-light">A more considered way to find home</span><h1>{heroTitle}</h1><p>Browse active rental properties shared by landlords and administrators.</p><SearchPanel /></div>
        <div className="hero-caption"><span>RESIDO</span><span>Homes with a sense of place</span></div>
      </section>
      {slug === 'map' && <section className="map-home-band"><div className="container map-home-inner"><div><span className="eyebrow">Explore by location</span><h2>Search current listings by area.</h2><p>Map-based search will work when the property service returns location coordinates.</p><Link className="button button-primary" href="/half-map">Browse live listings ↗</Link></div><div className="home-map-art"><p>Property coordinates are not available yet.</p></div></div></section>}
      <section className="section section-featured"><div className="container"><SectionHeading eyebrow="Live listings" title="Homes worth coming home to" description="Active properties shared by landlords and administrators." href="/list-layout-new" />
        <FeaturedHomes />
      </div></section>
      <section className="section neighborhood-section"><div className="container neighborhood-grid"><div><span className="eyebrow">Make yourself at home</span><h2>Find the neighbourhood that fits your life.</h2><p>Explore places through the live listings shared by landlords and administrators.</p><Link className="button button-outline" href="/place-search">Explore locations <span aria-hidden="true">↗</span></Link></div>
        <Link className="neighborhood-tile neighborhood-large" href="/place-search"><span>Search by location <small>Browse active properties</small></span></Link>
        <Link className="neighborhood-tile neighborhood-small" href="/list-layout-with-sidebar"><span>Refine your search <small>Filter live listings</small></span></Link>
      </div></section>
      <section className="section"><div className="container"><SectionHeading eyebrow="The Resido difference" title="A little more care in every step" description="From first search to final key, make your move with clarity." />
        <div className="value-grid"><article><span className="value-number">01</span><h3>Current listings</h3><p>Browse active property records submitted through the connected service.</p></article><article><span className="value-number">02</span><h3>Property photos</h3><p>See images attached to each live property listing.</p></article><article><span className="value-number">03</span><h3>Plan a viewing</h3><p>Choose an available date and send a viewing request from a property page.</p></article></div>
      </div></section>
      {articles.length > 0 && <section className="section journal-section"><div className="container"><SectionHeading eyebrow="Notes from Resido" title="A little inspiration for the journey" href="/blog" linkLabel="Read the journal" /><div className="article-grid">{articles.map((article) => <Link href="/blog-detail" className="article-card" key={article.title}><div className="article-image"><Image src={article.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" /></div><span className="eyebrow">{article.category} · {article.date}</span><h3>{article.title}</h3><span className="text-link">Read article ↗</span></Link>)}</div></div></section>}
      <section className="closing-cta"><div className="container closing-cta-inner"><div><span className="eyebrow eyebrow-light">Have a home to share?</span><h2>Let’s help the right people find it.</h2></div><Link href="/submit-property" className="button button-white">List your property <span aria-hidden="true">↗</span></Link></div></section>
    </>
  );
}

export function ListingPage({ slug, initialTerm, initialStatus, initialType, initialPrice }: { slug: string; initialTerm?: string; initialStatus?: string; initialType?: string; initialPrice?: string }) {
  const layoutTitle = slug.includes('map') || slug === 'place-search' ? 'Find a home on the map' : 'Homes to make your own';
  const desc = slug.includes('map') || slug === 'place-search' ? 'Explore available homes by neighbourhood and price.' : 'Browse homes for sale and rent, and find a place that feels right.';
  return <><PageIntro eyebrow="Find your place" title={layoutTitle} description={desc} className="properties-intro" /><div className={`container listing-page${slug === 'place-search' ? ' place-search-page' : ''}`}><SearchPanel compact defaultIntent={initialStatus === 'For Rent' ? 'Rent' : 'Buy'} defaultLocation={initialTerm} defaultType={initialType} defaultPrice={initialPrice} /><section className="listing-heading-row"><div><span className="eyebrow">Curated homes</span><h2>Property listings</h2></div><Link href="/submit-property" className="text-link">List a property ↗</Link></section><ListingResults variant={slug} initialTerm={initialTerm} initialStatus={initialStatus} initialType={initialType} initialPrice={initialPrice} /></div></>;
}

export function PropertyDetailPage({ slug }: { slug: string }) {
  return <><PageIntro eyebrow="Live property details" title="Choose a property from current listings" description="These older template links do not identify a live property. Open a listing to see its API-backed details and viewing options." /><div className="container narrow-content"><div className="empty-state"><h2>Property details now come from the property service</h2><p>Use a listing card to open a property by its unique API ID.</p><Link href="/list-layout-new" className="button button-primary">Browse live properties ↗</Link></div></div></>;
}

export function PeoplePage({ slug }: { slug: string }) {
  const isAgency = slug.includes('agency');
  return <><PageIntro eyebrow="Property professionals" title={isAgency ? 'Agencies' : 'Agents'} description="Agent and agency listings are shown when the connected service provides them." /><div className="container narrow-content"><div className="empty-state"><h2>Directory data is unavailable</h2><p>The connected API collection does not include an agents or agencies endpoint yet.</p></div></div></>;
}

function AgencyProfilePage() {
  return <PeoplePage slug="agency-page" />;
}

function AccountAccessPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';
  return <section className="account-access">
    <div className="account-access-card">
      <div className="account-access-aside">
        <span className="account-access-kicker">RESIDO · YOUR NEXT CHAPTER</span>
        <h1>{isLogin ? 'Welcome back home.' : 'Find your place in the world.'}</h1>
        <p>{isLogin ? 'Pick up where you left off. Your saved homes and property search are waiting.' : 'Create an account to save homes, connect with agents, and make your next move with confidence.'}</p>
        <div className="account-access-points"><span>⌂ <b>Homes worth coming home to</b></span><span>♡ <b>Your favourites, all in one place</b></span><span>✓ <b>A smoother way to find your fit</b></span></div>
      </div>
      <div className="account-access-main">
        <Link className="account-back-link" href="/">← Back to Resido</Link>
        <span className="eyebrow">{isLogin ? 'Good to see you again' : 'Start your home search'}</span>
        <h2>{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
        <p className="account-access-intro">{isLogin ? 'Enter your details to continue.' : 'It only takes a moment to get started.'}</p>
        <RentalAccountForm mode={mode} />
        {isLogin && <div className="account-form-options"><label className="account-check"><input type="checkbox" name="remember" /> Remember me</label><Link href="/change-password">Forgot password?</Link></div>}
        <p className="account-switch">{isLogin ? 'New to Resido?' : 'Already have an account?'} <Link href={isLogin ? '/create-account' : '/login'}>{isLogin ? 'Create an account' : 'Sign in'}</Link></p>
        <p className="account-service-note">Sign in and account creation use the connected rental service.</p>
      </div>
    </div>
  </section>;
}

function AboutPage() {
  return <div className="about-page">
    <section className="about-hero">
      <div className="container about-hero-inner">
        <div className="about-hero-copy">
          <span className="eyebrow">A little about Resido</span>
          <h1>Home is more than a place. <em>It’s how life feels.</em></h1>
          <p>We bring people, homes, and local knowledge together to make finding your next place feel clearer and more human.</p>
          <div className="about-hero-actions"><Link href="/list-layout-new" className="button button-primary">Explore homes <span aria-hidden="true">↗</span></Link><Link href="/agents" className="text-link">Meet our local experts <span aria-hidden="true">→</span></Link></div>
        </div>
        <div className="about-hero-visual"><div className="about-image-note"><span className="about-note-icon">⌂</span><span><b>Find a place that feels right</b><small>Explore active API listings</small></span></div><span className="about-visual-orb" aria-hidden="true" /></div>
      </div>
      <div className="about-hero-glow" aria-hidden="true" />
    </section>
    <section className="about-story section"><div className="container about-story-inner">
      <div className="about-story-heading"><span className="eyebrow">Why we’re here</span><h2>A better move begins with feeling at home.</h2></div>
      <div className="about-story-copy"><p>Finding a home should feel full of possibility. But searching through listings and making sense of a new neighbourhood can be a lot to navigate.</p><p>Resido makes that journey easier to explore. Discover homes, learn about the places around them, and connect with property professionals who know the area.</p><Link href="/place-search" className="about-inline-link">Explore homes by neighbourhood <span aria-hidden="true">↗</span></Link></div>
    </div></section>
    <section className="about-values section"><div className="container"><div className="about-values-heading"><span className="eyebrow">The Resido difference</span><h2>Good guidance makes all the difference.</h2><p>Every part of the experience is designed to help you take your next step with confidence.</p></div><div className="about-values-grid">
      <article className="about-value-card"><span className="about-value-icon">⌖</span><span className="about-value-number">01</span><h3>Rooted in local knowledge</h3><p>Explore neighbourhoods with context from the people who know them best.</p></article>
      <article className="about-value-card"><span className="about-value-icon">⌂</span><span className="about-value-number">02</span><h3>Homes worth discovering</h3><p>Browse clear, considered listings and picture what life could look like there.</p></article>
      <article className="about-value-card"><span className="about-value-icon">♡</span><span className="about-value-number">03</span><h3>People here to help</h3><p>Save the homes you love and start a conversation when you’re ready.</p></article>
    </div></div></section>
    <section className="about-steps"><div className="container about-steps-inner"><div><span className="eyebrow eyebrow-light">Your next chapter starts here</span><h2>Find your place, at your pace.</h2><p>Whether you’re browsing or ready to make a move, we’re here to help you find the right fit.</p></div><Link href="/list-layout-new" className="button button-white">Start exploring <span aria-hidden="true">↗</span></Link></div></section>
  </div>;
}

function ContactPage() {
  return <><PageIntro eyebrow="Contact" title="Get in touch" description="The available rental API does not include a messaging or contact endpoint." /><div className="container narrow-content"><ApiUnavailable title="Messaging service unavailable" description="No contact request has been sent. A messaging API is required to enable this form." /></div></>;
}

export function GeneralPage({ slug }: { slug: string }) {
  const titles: Record<string, string> = {
    'about-us': 'A more thoughtful way to find home', contact: 'We’d love to hear from you', faq: 'A few things you might be wondering',
    blog: 'Ideas for the journey home', 'blog-detail': 'A practical guide to finding the right home', pricing: 'Simple plans for your next move',
    'create-account': 'Make yourself at home', login: 'Sign in to your Resido account', 'change-password': 'Choose a new password', checkout: 'Review your order', payment: 'Payment details',
    component: 'Design details and components', '404': 'This page has moved on',
  };
  const title = titles[slug] ?? slug.replaceAll('-', ' ');
  if (slug === 'about-us') return <AboutPage />;
  if (slug === 'contact') return <ContactPage />;
  if (slug === 'component') return <><PageIntro eyebrow="Resido interface" title={title} description="Controls used to browse and manage live property listings." /><section className="section"><div className="container"><SectionHeading eyebrow="Live content" title="Property cards use API listings" /><div className="empty-state"><p>There are no live property records to preview right now.</p><Link href="/list-layout-new" className="button button-primary">Browse properties ↗</Link></div></div></section></>;
  if (slug === 'blog-detail' || slug === 'blog') return <><PageIntro eyebrow="Resido journal" title={title} description="Journal entries will appear here when a content service is connected." /><div className="container narrow-content"><div className="empty-state"><h2>No journal entries available</h2><p>The current API collection does not include a journal endpoint.</p></div></div></>;
  if (slug === 'faq') return <><PageIntro eyebrow="Frequently asked questions" title={title} description="Helpful answers as you explore properties and plan a move." /><div className="container narrow-content"><FAQList /></div></>;
  if (slug === 'contact') return <><PageIntro eyebrow="Contact" title={title} description="The messaging form will be available when a contact service is connected." /><div className="container contact-layout"><ApiUnavailable title="Messaging service unavailable" /></div></>;
  if (slug === 'login' || slug === 'create-account') return <AccountAccessPage mode={slug === 'login' ? 'login' : 'register'} />;
  if (slug === 'change-password') return <><PageIntro eyebrow="Your Resido account" title={title} description="Request a reset code and set a new password." /><div className="container narrow-content"><PasswordRecoveryForm /></div></>;
  if (slug === 'pricing') return <><PageIntro eyebrow="Pricing" title={title} description="Pricing information will be shown when a billing service is connected." /><div className="container narrow-content"><div className="empty-state"><h2>No plans available</h2><p>The connected API does not provide billing plans.</p></div></div></>;
  if (slug === '404') return <section className="not-found-section"><div className="container"><span className="eyebrow">404 · Not found</span><h1>{title}</h1><p>Let’s get you back to a good place.</p><Link className="button button-primary" href="/">Return home ↗</Link></div></section>;
  return <><PageIntro eyebrow="About Resido" title={title} description="We believe finding a place to call home should feel considered, clear, and full of possibility." /><section className="section"><div className="container about-content"><div><span className="eyebrow">A home for every next step</span><h2>Places shape the way we live.</h2></div><div><p>Resido brings property seekers and local professionals together. We make it easier to browse thoughtfully presented homes, understand the neighbourhood, and start a conversation with the right person.</p><p>Our focus is simple: useful information, welcoming design, and a more human way to explore property.</p><Link href="/agents" className="text-link">Meet our local experts ↗</Link></div></div></section><section className="section section-muted"><div className="container"><SectionHeading eyebrow="Find the right fit" title="A little help, wherever you are in the journey" /><div className="value-grid"><article><span className="value-number">01</span><h3>Looking for a home</h3><p>Browse a considered range of sale and rental homes.</p><Link href="/list-layout-new" className="text-link">Explore homes ↗</Link></article><article><span className="value-number">02</span><h3>Ready to list?</h3><p>Share your property details with people searching for a home.</p><Link href="/submit-property" className="text-link">List your property ↗</Link></article><article><span className="value-number">03</span><h3>Need a guide?</h3><p>Connect with local agents who know the market.</p><Link href="/agents" className="text-link">Find an agent ↗</Link></article></div></div></section></>;
}

export function TemplatePage({ slug, initialTerm, initialStatus, initialType, initialPrice }: { slug: string; initialTerm?: string; initialStatus?: string; initialType?: string; initialPrice?: string }) {
  if (slug === 'index' || slug === 'video' || /^home-\d+$/.test(slug) || slug === 'map') return <HomePage slug={slug} />;
  if (listingSlugs.has(slug)) return <ListingPage slug={slug} initialTerm={initialTerm} initialStatus={initialStatus} initialType={initialType} initialPrice={initialPrice} />;
  if (detailSlugs.has(slug)) redirect('/list-layout-new');
  if (['agencies', 'agents', 'agency-page', 'agent-page'].includes(slug)) return <PeoplePage slug={slug} />;
  if (['dashboard', 'my-profile', 'my-property', 'submit-property', 'submit-property-dashboard', 'add-agent', 'edit-agent', 'bookmark-list', 'compare-property', 'checkout', 'payment'].includes(slug)) return <DashboardView slug={slug} />;
  return <GeneralPage slug={slug} />;
}
