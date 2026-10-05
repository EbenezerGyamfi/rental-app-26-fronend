import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Agency Page | Resido' };

export default function Page() { return <TemplatePage slug="agency-page" />; }
