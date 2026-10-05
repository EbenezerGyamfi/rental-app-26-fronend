import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Map | Resido' };

export default function Page() { return <TemplatePage slug="map" />; }
