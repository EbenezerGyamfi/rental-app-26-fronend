import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Half Map 2 | Resido' };

type Props = { searchParams: Promise<{ location?: string; intent?: string; type?: string; price?: string }> };

export default async function Page({ searchParams }: Props) {
  const query = await searchParams;
  const initialStatus = query.intent === 'Buy' ? 'For Sale' : query.intent === 'Rent' ? 'For Rent' : 'Any status';
  return <TemplatePage slug="half-map-2" initialTerm={query.location ?? ''} initialStatus={initialStatus} initialType={query.type || 'Any type'} initialPrice={query.price || 'Any price'} />;
}
