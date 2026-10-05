import type { Metadata } from 'next';
import { TemplatePage } from '@/src/components/PageViews';

export const metadata: Metadata = { title: 'About Us | Resido' };

export default function Page() { return <TemplatePage slug="about-us" />; }
