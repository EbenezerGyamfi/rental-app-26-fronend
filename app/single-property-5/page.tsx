import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Single Property 5 | Resido' };

export default function Page() { return <TemplatePage slug="single-property-5" />; }
