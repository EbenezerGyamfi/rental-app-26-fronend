import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Agents | Resido' };

export default function Page() { return <TemplatePage slug="agents" />; }
