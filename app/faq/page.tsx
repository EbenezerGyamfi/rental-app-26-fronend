import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Faq | Resido' };

export default function Page() { return <TemplatePage slug="faq" />; }
