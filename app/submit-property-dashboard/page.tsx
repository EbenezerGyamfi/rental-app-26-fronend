import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Submit Property Dashboard | Resido' };

export default function Page() { return <TemplatePage slug="submit-property-dashboard" />; }
