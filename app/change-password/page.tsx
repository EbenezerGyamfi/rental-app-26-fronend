import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'Change Password | Resido' };

export default function Page() { return <TemplatePage slug="change-password" />; }
