import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'My Profile | Resido' };

export default function Page() { return <TemplatePage slug="my-profile" />; }
