import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Compare Property | Resido' };

export default function Page() { return <TemplatePage slug="compare-property" />; }
