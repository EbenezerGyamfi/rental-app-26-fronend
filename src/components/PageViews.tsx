import Image from 'next/image';
import Link from 'next/link';
import { articles, agents, detailSlugs, listingSlugs, properties } from '@/src/data/real-estate';
import PropertyCard from './PropertyCard';
import DetailGallery from './DetailGallery';
import FeaturedHomes from './FeaturedHomes';
import SearchPanel from './SearchPanel';
import SectionHeading from './SectionHeading';
import DashboardView from './DashboardView';
import { DemoForm, FAQList, ListingResults } from './Interactive';
import { RentalAccountForm, RentalPropertyActions } from './RentalWorkflow';

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
      <section className={`home-hero home-hero-${homeIndex} ${slug === 'index' ? 'home-hero-index' : ''} ${slug === 'video' ? 'home-hero-video' : ''}`}>
        {slug === 'video' ? <video className="hero-video" autoPlay muted loop playsInline aria-hidden="true"><source src="/assets/img/video-banner.mp4" type="video/mp4" /></video> : <div className="hero-image" aria-hidden="true"><Image src={slug === 'index' ? '/assets/img/accra-apartments-hero.png' : homeIndex % 2 ? '/assets/img/banner.png' : '/assets/img/banner-5.png'} alt="" fill priority sizes="100vw" /></div>}
        <div className="hero-shade" />
        <div className="container hero-content"><span className="eyebrow eyebrow-light">A more considered way to find home</span><h1>{heroTitle}</h1><p>Explore distinctive homes and meet the people who know them best.</p><SearchPanel /></div>
        <div className="hero-caption"><span>01 — 06</span><span>Homes with a sense of place</span></div>
      </section>
      {slug === 'map' && <section className="map-home-band"><div className="container map-home-inner"><div><span className="eyebrow">Explore by location</span><h2>See what’s waiting around the corner.</h2><p>Browse sample listings across Accra. A live map can be connected when a map provider is configured.</p><Link className="button button-primary" href="/half-map">Open map search ↗</Link></div><div className="home-map-art"><span className="home-map-chip chip-a">East Legon · GH₵ 2.45m</span><span className="home-map-chip chip-b">Cantonments · GH₵ 12.5k</span><span className="home-map-chip chip-c">Labone · GH₵ 9.8k</span></div></div></section>}
      <section className="section section-featured"><div className="container"><SectionHeading eyebrow="A few good places" title="Homes worth coming home to" description="A handpicked selection of homes to inspire your next move." href="/list-layout-new" />
        <FeaturedHomes items={properties} />
      </div></section>
      <section className="section neighborhood-section"><div className="container neighborhood-grid"><div><span className="eyebrow">Make yourself at home</span><h2>Find the neighbourhood that fits your life.</h2><p>From the energy of the city to the calm of the coast, discover places with room to grow.</p><Link className="button button-outline" href="/place-search">Explore locations <span aria-hidden="true">↗</span></Link></div>
        <Link className="neighborhood-tile neighborhood-large" href="/list-layout-new"><Image src="/assets/img/nice-neighborhood.jpg" alt="A residential neighbourhood in Accra" fill sizes="(max-width: 700px) 100vw, 50vw" /><span>Accra <small>City living, your way</small></span></Link>
        <Link className="neighborhood-tile neighborhood-small" href="/list-layout-with-sidebar"><Image src="/assets/img/neighborhood-aerial.jpeg" alt="Aerial view of a residential neighbourhood" fill sizes="(max-width: 700px) 100vw, 30vw" /><span>East Legon <small>Find your corner</small></span></Link>
      </div></section>
      <section className="section"><div className="container"><SectionHeading eyebrow="The Resido difference" title="A little more care in every step" description="From first search to final key, make your move with clarity." />
        <div className="value-grid"><article><span className="value-number">01</span><h3>Homes with character</h3><p>Thoughtfully presented spaces that help you picture everyday life.</p></article><article><span className="value-number">02</span><h3>People who know</h3><p>Meet local agents and agencies ready to guide your search.</p></article><article><span className="value-number">03</span><h3>Room to explore</h3><p>Compare options, save your favourites, and take the next step at your pace.</p></article></div>
      </div></section>
      <section className="section journal-section"><div className="container"><SectionHeading eyebrow="Notes from Resido" title="A little inspiration for the journey" href="/blog" linkLabel="Read the journal" /><div className="article-grid">{articles.map((article) => <Link href="/blog-detail" className="article-card" key={article.title}><div className="article-image"><Image src={article.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" /></div><span className="eyebrow">{article.category} · {article.date}</span><h3>{article.title}</h3><span className="text-link">Read article ↗</span></Link>)}</div></div></section>
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
  const property = properties[(Number(slug.match(/(\d+)/)?.[1] ?? 1) - 1) % properties.length];
  return <div className="container detail-page">
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/list-layout-new">Properties</Link><span>/</span><span>{property.title}</span></div>
    <DetailGallery title={property.title} images={property.id === 1 ? [
      '/assets/img/grand-residence-dining.jpeg',
      '/assets/img/grand-residence-bedroom.jpeg',
      '/assets/img/grand-residence-bathroom.jpeg',
    ] : property.id === 2 ? [
      '/assets/img/modern-city-dining.avif',
      '/assets/img/modern-city-bedroom.webp',
      '/assets/img/modern-city-apartment.webp',
    ] : property.id === 3 ? [
      '/assets/img/palm-grove-townhouse.webp',
      '/assets/img/palm-grove-kitchen.webp',
      '/assets/img/palm-grove-interior.webp',
    ] : property.id === 4 ? [
      '/assets/img/garden-view-living-room.jpg',
      '/assets/img/garden-view-interior.jpg',
      '/assets/img/garden-view-kitchen.jpg',
    ] : property.id === 5 ? [
      '/assets/img/coastal-escape-exterior.webp',
      '/assets/img/coastal-escape-1.avif',
      '/assets/img/coastal-escape-2.avif',
      '/assets/img/coastal-escape-3.avif',
      '/assets/img/coastal-escape-hall.avif',
      '/assets/img/coastal-escape-bath.avif',
      '/assets/img/coastal-escape-4.avif',
    ] : property.id === 6 ? [
      '/assets/img/veranda-house-exterior.webp',
      '/assets/img/veranda-living-room.webp',
      '/assets/img/veranda-bedroom.webp',
    ] : [property.image, '/assets/img/living-bg.png', '/assets/img/city-1.png']} />
    <div className="detail-columns"><article className="detail-content"><div className="detail-overview"><div><span className={property.status === 'For Sale' ? 'property-status status-sale' : 'property-status status-rent'}>{property.status}</span><h1>{property.title}</h1><p className="detail-address"><span aria-hidden="true">⌖</span>{property.address} · Greater Accra Region</p></div><div className="detail-price-panel"><small>{property.status === 'For Rent' ? 'Monthly rent' : 'Asking price'}</small><strong className="detail-price">{property.price}</strong><span>Price listed by the property team</span></div></div><div className="detail-facts"><span><b>{property.beds}</b><small>Bedrooms</small></span><span><b>{property.baths}</b><small>Bathrooms</small></span><span><b>{property.area.toLocaleString()}</b><small>Sq. ft.</small></span><span><b>{property.type}</b><small>Property type</small></span></div>
      <section className="detail-section"><span className="eyebrow">A closer look</span><h2>A home with room to feel at ease</h2><p>Thoughtfully arranged living spaces, natural light, and a welcoming neighbourhood make this home a lovely place to settle in. Explore the details and speak with the listing agent to arrange a viewing.</p><p>This listing is sample content for the Resido template conversion.</p></section>
      <section className="detail-section"><span className="eyebrow">The details</span><h2>Features and amenities</h2><div className="amenity-grid"><span><i>✓</i>Fitted kitchen</span><span><i>✓</i>Secure parking</span><span><i>✓</i>Garden space</span><span><i>✓</i>Air conditioning</span><span><i>✓</i>24-hour security</span><span><i>✓</i>Fibre ready</span></div></section>
      <section className="detail-section detail-location-section"><span className="eyebrow">Neighbourhood</span><h2>Location</h2><div className="location-placeholder"><span>⌖</span><div><b>{property.address}</b><p>Explore this home’s neighbourhood in Accra.</p></div><Link href="/place-search">Explore area <span aria-hidden="true">↗</span></Link></div></section>
    </article><aside className="contact-agent"><div className="contact-agent-heading"><span className="contact-agent-icon">⌂</span><div><span className="eyebrow">Your next step</span><h2>Interested in this home?</h2></div></div><p>Ask a question or arrange a viewing with the property team.</p><DemoForm className="detail-enquiry-form" title={property.status === 'For Rent' ? 'Send an enquiry' : 'Send an enquiry'} submitLabel="Send enquiry" description="Share your details and message to get started."><div className="form-grid"><label>Full name<input required autoComplete="name" /></label><label>Email address<input required type="email" autoComplete="email" /></label><label>Message<textarea rows={3} defaultValue={`I’m interested in ${property.title}.`} /></label></div></DemoForm>{property.status === 'For Rent' && <RentalPropertyActions propertyID={String(property.id)} propertyTitle={property.title} rent={property.amount} />}</aside></div>
  </div>;
}

export function PeoplePage({ slug }: { slug: string }) {
  if (slug === 'agency-page') return <AgencyProfilePage />;
  const isAgency = slug.includes('agency');
  const isProfile = slug === 'agent-page' || slug === 'agency-page';
  const title = isAgency ? 'People-first property agencies' : 'Meet your local property experts';
  return <><PageIntro eyebrow="A good move starts with good people" title={isProfile ? 'Property professionals who know the neighbourhood' : title} description="Get to know experienced local agents and teams who can help you take the next step." />
    <div className="container people-page">{isProfile ? <div className="profile-feature"><div className="profile-avatar"><Image src={agents[0].image} alt={agents[0].name} width={150} height={150} /></div><div><span className="eyebrow">Featured {isAgency ? 'agency' : 'agent'}</span><h2>{isAgency ? 'The Resido Property Group' : agents[0].name}</h2><p>{isAgency ? 'A local team helping people find a place to call home.' : `${agents[0].role} · ${agents[0].area}`}</p><p>Ask about current listings, neighbourhoods, and the process of finding a home.</p><Link className="button button-primary" href="/contact">Get in touch ↗</Link></div></div> : <><div className="listing-heading-row"><div><span className="eyebrow">Local knowledge, thoughtful service</span><h2>{isAgency ? 'Agencies in your area' : 'Find an agent'}</h2></div><span className="muted">{agents.length} professionals</span></div><div className="people-grid">{agents.map((agent, index) => <article className="person-card" key={agent.name}><div className="person-image"><Image src={agent.image} alt={agent.name} width={170} height={170} /></div><span className="eyebrow">{isAgency ? 'Independent agency' : agent.role}</span><h3>{isAgency ? ['Northstar Properties', 'Haven & Co.', 'Homebound Realty', 'The Resido Group'][index] : agent.name}</h3><p>{agent.area} · {agent.listings} active listings</p><Link className="text-link" href={isAgency ? '/agency-page' : '/agent-page'}>View profile ↗</Link></article>)}</div></>}</div></>;
}

function AgencyProfilePage() {
  return <div className="agency-profile-page">
    <section className="agency-profile-hero"><div className="container agency-profile-hero-inner">
      <div className="agency-profile-copy"><span className="agency-verified"><span>✓</span> Featured property agency</span><h1>The Resido<br /><em>Property Group</em></h1><p>Local knowledge and thoughtful guidance for finding a place to call home in Accra.</p><div className="agency-hero-actions"><Link href="/contact" className="button button-primary">Contact the agency <span aria-hidden="true">↗</span></Link><a href="#agency-listings" className="agency-text-link">Explore our homes <span aria-hidden="true">↓</span></a></div></div>
      <div className="agency-profile-visual"><Image src="/assets/img/nice-neighborhood.jpg" alt="A residential neighbourhood in Accra" fill priority sizes="(max-width: 760px) 100vw, 50vw" /><div className="agency-brand-card"><span className="agency-brand-mark">R</span><span><b>Resido Property Group</b><small>Homes across Greater Accra</small></span></div></div>
      <div className="agency-profile-meta"><span><small>Based in</small><b>Accra, Ghana</b></span><span><small>Speciality</small><b>Residential property</b></span><span><small>Here to help with</small><b>Buying · Renting · Listing</b></span></div>
    </div></section>
    <section className="agency-profile-about section"><div className="container agency-about-grid"><div><span className="eyebrow">A local team with a personal touch</span><h2>Finding a home should feel like a good beginning.</h2></div><div><p>We help people explore homes and neighbourhoods across Accra with practical guidance at every step. From the first search to arranging a conversation, our focus is on making the process feel clear and welcoming.</p><p>Tell us what matters to you, and our team can help you discover places that fit your next chapter.</p><Link className="text-link" href="/contact">Talk to our team <span aria-hidden="true">↗</span></Link></div></div></section>
    <section className="agency-team-section section"><div className="container"><div className="agency-section-heading"><div><span className="eyebrow">Meet the people</span><h2>Local expertise, real conversations.</h2></div><Link href="/agents" className="text-link">Meet all agents <span aria-hidden="true">↗</span></Link></div><div className="agency-team-grid">{agents.slice(0, 3).map((agent) => <article className="agency-team-card" key={agent.name}><div className="agency-team-photo"><Image src={agent.image} alt={agent.name} width={220} height={220} /></div><span className="eyebrow">{agent.role}</span><h3>{agent.name}</h3><p>{agent.area} · Local property guidance</p><Link href="/agent-page" aria-label={`View ${agent.name}'s profile`}>View profile <span aria-hidden="true">↗</span></Link></article>)}</div></div></section>
    <section className="agency-listings-section section" id="agency-listings"><div className="container"><div className="agency-section-heading"><div><span className="eyebrow">A few places to begin</span><h2>Homes from our neighbourhoods.</h2></div><Link href="/list-layout-new" className="text-link">View all properties <span aria-hidden="true">↗</span></Link></div><div className="property-grid agency-listings-grid">{properties.slice(0, 3).map((property) => <PropertyCard key={property.id} property={property} />)}</div></div></section>
    <section className="agency-profile-cta"><div className="container agency-profile-cta-inner"><div><span className="eyebrow eyebrow-light">Your next move starts with a conversation</span><h2>Let’s find a place that feels like yours.</h2></div><Link href="/contact" className="button button-white">Get in touch <span aria-hidden="true">↗</span></Link></div></section>
  </div>;
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
        <p className="account-demo-note">Demo interface · account services are not connected yet.</p>
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
        <div className="about-hero-visual"><Image src="/assets/img/nice-neighborhood.jpg" alt="A sunny residential neighbourhood in Ghana" fill priority sizes="(max-width: 760px) 100vw, 50vw" /><div className="about-image-note"><span className="about-note-icon">⌂</span><span><b>Find a place that feels right</b><small>Thoughtful homes, local insight</small></span></div><span className="about-visual-orb" aria-hidden="true" /></div>
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
  return <div className="contact-page">
    <section className="contact-hero"><div className="container contact-hero-inner"><div><span className="contact-hero-label"><i /> We’re here to help</span><h1>Let’s find the right way <em>forward.</em></h1><p>Have a question about a home, an agent, or Resido? Send us a note and we’ll help you find the right next step.</p></div><span className="contact-hero-mark" aria-hidden="true">↗</span></div></section>
    <section className="contact-main-section"><div className="container contact-main-grid">
      <div className="contact-form-wrap"><div className="contact-form-heading"><span className="eyebrow">Send us a message</span><h2>How can we help?</h2><p>Share a few details below and our team will know where to start.</p></div><DemoForm className="contact-page-form" submitLabel="Send your message"><div className="form-grid"><label>Your name<input required name="name" autoComplete="name" placeholder="e.g. Ama Mensah" /></label><label>Email address<input required type="email" name="email" autoComplete="email" placeholder="you@example.com" /></label></div><label>What can we help you with?<select defaultValue=""><option value="" disabled>Select a topic</option><option>Finding a property</option><option>Listing a property</option><option>Speaking with an agent</option><option>Something else</option></select></label><label>Your message<textarea name="message" rows={5} required placeholder="Tell us a little about what you need" /></label></DemoForm></div>
      <aside className="contact-side">
        <div className="contact-photo"><Image src="/assets/img/nice-neighborhood.jpg" alt="Homes in a welcoming Accra neighbourhood" fill sizes="(max-width: 760px) 100vw, 40vw" /><div className="contact-photo-caption"><span>⌂</span><div><b>A place to call home</b><small>We’ll help you find your next step.</small></div></div></div>
        <div className="contact-details-card"><span className="eyebrow">Get in touch</span><h3>We’re based in Accra.</h3><p>Our team is here to help with your property search and connect you with local professionals.</p><div className="contact-detail-row"><span>⌖</span><div><small>Location</small><b>Accra, Ghana</b></div></div><Link href="/agents" className="contact-detail-link"><span>Meet local agents</span><span aria-hidden="true">↗</span></Link><Link href="/faq" className="contact-detail-link"><span>Visit the help centre</span><span aria-hidden="true">↗</span></Link></div>
      </aside>
    </div></section>
  </div>;
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
  if (slug === 'component') return <><PageIntro eyebrow="Resido design system" title={title} description="A working preview of the buttons, listing cards, filters, and form controls used across the site." /><section className="section"><div className="container"><SectionHeading eyebrow="Interface elements" title="A consistent set of useful details" /><div className="component-showcase"><div className="component-showcase-row"><span className="eyebrow">Actions</span><div><Link href="/list-layout-new" className="button button-primary">Primary action ↗</Link><Link href="/contact" className="button button-outline">Secondary action</Link></div></div><div className="component-showcase-row"><span className="eyebrow">Form controls</span><div className="form-grid"><label>Location<input placeholder="Type a neighbourhood" /></label><label>Property type<select defaultValue="Any type"><option>Any type</option><option>House</option><option>Apartment</option></select></label></div></div><div className="component-showcase-row"><span className="eyebrow">Property card</span><div className="component-card-preview"><PropertyCard property={properties[0]} compact /></div></div></div></div></section></>;
  if (slug === 'blog-detail') return <><PageIntro eyebrow="The Resido journal · Buying guide" title={title} description="A thoughtful start to finding a home that feels like the right fit." /><article className="container article-detail"><Image src="/assets/img/city-banner.png" alt="A neighbourhood in Accra" width={1200} height={645} /><div className="article-detail-copy"><p className="eyebrow">Buying guide · 6 minute read</p><h2>Start with the way you want to live.</h2><p>Before comparing listings, think about the everyday details that will shape your life at home: where you need to be, how much space you need, and what makes a neighbourhood feel welcoming.</p><p>Set a comfortable budget, make a short list of priorities, and leave a little room for discovery. A local property professional can help answer questions about an area and guide you through the next steps.</p><h2>Look beyond the first impression.</h2><p>Visit at different times of day when you can. Ask about utilities, access, maintenance, and the surrounding community. The right home is one that works for your life, not just one that looks good in a photograph.</p><Link href="/list-layout-new" className="button button-primary">Explore homes ↗</Link></div></article></>;
  if (slug === 'blog') return <><PageIntro eyebrow="The Resido journal" title={title} description="Practical notes and inspiration for the search, the move, and everything that follows." /><div className="container article-listing">{articles.map((article) => <Link href="/blog-detail" className="article-card" key={article.title}><div className="article-image"><Image src={article.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" /></div><span className="eyebrow">{article.category} · {article.date}</span><h3>{article.title}</h3><p>Useful ideas for making a confident move and finding a place that feels like home.</p><span className="text-link">Read article ↗</span></Link>)}</div></>;
  if (slug === 'faq') return <><PageIntro eyebrow="Frequently asked questions" title={title} description="Helpful answers as you explore properties and plan a move." /><div className="container narrow-content"><FAQList /></div></>;
  if (slug === 'contact') return <><PageIntro eyebrow="Say hello" title={title} description="Tell us what you’re looking for and we’ll point you in the right direction." /><div className="container contact-layout"><div><span className="eyebrow">We’re here to help</span><h2>Good conversations make good moves.</h2><p>For help with a property, an agent, or the Resido experience, send the team a note.</p><p><b>Contact</b><br />Use the enquiry form to get in touch.</p><p><b>Based in</b><br />Accra, Ghana</p></div><DemoForm title="Send us a message" submitLabel="Send message" /></div></>;
  if (slug === 'login' || slug === 'create-account') return <AccountAccessPage mode={slug === 'login' ? 'login' : 'register'} />;
  if (slug === 'change-password') return <><PageIntro eyebrow="Your Resido account" title={title} description="Choose a new password for your account." /><div className="container narrow-content"><DemoForm title="Update password" description="Account services will be available when authentication is connected."><div className="form-grid"><label>Email address<input type="email" required autoComplete="email" /></label><label>New password<input type="password" required autoComplete="new-password" /></label></div></DemoForm></div></>;
  if (slug === 'pricing') return <><PageIntro eyebrow="Plans that make sense" title={title} description="Illustrative plans for the template demo; billing and listing services are not connected." /><div className="container pricing-grid">{[['Starter','Free','Explore the basics'],['Featured','GH₵ 250','Give one listing extra visibility'],['Agency','Let’s talk','Support for growing teams']].map(([name, price, desc]) => <article className="pricing-card" key={name}><span className="eyebrow">{name}</span><strong>{price}</strong><p>{desc}</p><ul><li>Property listing tools</li><li>Agent profile</li><li>Buyer enquiries</li></ul><Link href="/contact" className="button button-outline">Learn more ↗</Link></article>)}</div></>;
  if (slug === '404') return <section className="not-found-section"><div className="container"><span className="eyebrow">404 · Not found</span><h1>{title}</h1><p>Let’s get you back to a good place.</p><Link className="button button-primary" href="/">Return home ↗</Link></div></section>;
  return <><PageIntro eyebrow="About Resido" title={title} description="We believe finding a place to call home should feel considered, clear, and full of possibility." /><section className="section"><div className="container about-content"><div><span className="eyebrow">A home for every next step</span><h2>Places shape the way we live.</h2></div><div><p>Resido brings property seekers and local professionals together. We make it easier to browse thoughtfully presented homes, understand the neighbourhood, and start a conversation with the right person.</p><p>Our focus is simple: useful information, welcoming design, and a more human way to explore property.</p><Link href="/agents" className="text-link">Meet our local experts ↗</Link></div></div></section><section className="section section-muted"><div className="container"><SectionHeading eyebrow="Find the right fit" title="A little help, wherever you are in the journey" /><div className="value-grid"><article><span className="value-number">01</span><h3>Looking for a home</h3><p>Browse a considered range of sale and rental homes.</p><Link href="/list-layout-new" className="text-link">Explore homes ↗</Link></article><article><span className="value-number">02</span><h3>Ready to list?</h3><p>Share your property details with people searching for a home.</p><Link href="/submit-property" className="text-link">List your property ↗</Link></article><article><span className="value-number">03</span><h3>Need a guide?</h3><p>Connect with local agents who know the market.</p><Link href="/agents" className="text-link">Find an agent ↗</Link></article></div></div></section></>;
}

export function TemplatePage({ slug, initialTerm, initialStatus, initialType, initialPrice }: { slug: string; initialTerm?: string; initialStatus?: string; initialType?: string; initialPrice?: string }) {
  if (slug === 'index' || slug === 'video' || /^home-\d+$/.test(slug) || slug === 'map') return <HomePage slug={slug} />;
  if (listingSlugs.has(slug)) return <ListingPage slug={slug} initialTerm={initialTerm} initialStatus={initialStatus} initialType={initialType} initialPrice={initialPrice} />;
  if (detailSlugs.has(slug)) return <PropertyDetailPage slug={slug} />;
  if (['agencies', 'agents', 'agency-page', 'agent-page'].includes(slug)) return <PeoplePage slug={slug} />;
  if (['dashboard', 'my-profile', 'my-property', 'submit-property', 'submit-property-dashboard', 'add-agent', 'edit-agent', 'bookmark-list', 'compare-property', 'checkout', 'payment'].includes(slug)) return <DashboardView slug={slug} />;
  return <GeneralPage slug={slug} />;
}
