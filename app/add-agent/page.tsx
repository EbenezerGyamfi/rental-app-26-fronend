import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Add Agent | Resido' };

export default function Page() { return <TemplatePage slug="add-agent" />; }
