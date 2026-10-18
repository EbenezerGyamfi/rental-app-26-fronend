import Link from 'next/link';

export default function SectionHeading({ eyebrow, title, description, href, linkLabel = 'View all homes' }: { eyebrow: string; title: string; description?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="section-heading">
      <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>
      {href && <Link href={href} className="text-link">{linkLabel} <span aria-hidden="true">↗</span></Link>}
    </div>
  );
}
