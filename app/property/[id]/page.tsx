import type { Metadata } from 'next';
import ApiPropertyDetail from '@/src/components/ApiPropertyDetail';
export const metadata: Metadata = { title: 'Property Details | RentRite' };
export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ApiPropertyDetail propertyId={id} />; }
