import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Single Property 3 | Resido' };

export default function Page() { return <TemplatePage slug="single-property-3" />; }
