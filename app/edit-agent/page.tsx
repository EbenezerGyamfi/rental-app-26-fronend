import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Edit Agent | Resido' };

export default function Page() { return <TemplatePage slug="edit-agent" />; }
