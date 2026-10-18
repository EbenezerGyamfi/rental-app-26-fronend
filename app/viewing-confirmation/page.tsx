import Link from 'next/link';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Date unavailable';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(value: string | undefined) {
  const match = value?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 'Time unavailable';
  const hour = Number(match[1]);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${match[2]} ${suffix}`;
}

export default async function ViewingConfirmationPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const property = first(params.property)?.trim() || 'your selected property';
  const date = first(params.date);
  const time = first(params.time);
  const email = first(params.email);
  const notice = first(params.notice);
  const hasBookingDetails = Boolean(date && time);

  return <main className="container viewing-confirmation-page">
    <section className="viewing-confirmation-card" aria-labelledby="viewing-confirmation-title">
      <span className="viewing-confirmation-icon" aria-hidden="true">✓</span>
      <span className="eyebrow">VIEWING CONFIRMED</span>
      <h1 id="viewing-confirmation-title">Your viewing is booked successfully</h1>
      <p className="viewing-confirmation-property">You’re booked to view <strong>{property}</strong>.</p>
      {hasBookingDetails ? <dl className="viewing-confirmation-details">
        <div><dt>Viewing date</dt><dd>{formatDate(date)}</dd></div>
        <div><dt>Viewing time</dt><dd>{formatTime(time)}</dd></div>
      </dl> : <p className="rental-workflow-message is-error" role="status">Your booking was accepted, but the date and time could not be displayed. Check your viewing requests for the latest details.</p>}
      {email === 'sent' ? <p className="viewing-confirmation-email" role="status">A confirmation email has been sent to the email address on your account.</p> : <p className="viewing-confirmation-email" role="status">Your booking is confirmed. The booking service did not confirm whether it sent an email.</p>}
      {notice && <p className="viewing-confirmation-notice">{notice}</p>}
      <div className="viewing-confirmation-actions"><Link className="button button-primary" href="/dashboard">View my dashboard <span aria-hidden="true">↗</span></Link><Link className="button button-outline" href="/list-layout-new">Browse more homes</Link></div>
    </section>
  </main>;
}
