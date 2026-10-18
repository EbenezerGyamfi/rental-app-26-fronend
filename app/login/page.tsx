import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Sign in | Resido' };

export default function Page() { return <TemplatePage slug="login" />; }
