import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Agent Page | Resido' };

export default function Page() { return <TemplatePage slug="agent-page" />; }
