import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Create Account | Resido' };

export default function Page() { return <TemplatePage slug="create-account" />; }
