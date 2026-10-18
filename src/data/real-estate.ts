export type Property = {
  id: number | string;
  title: string;
  address: string;
  price: string;
  amount: number;
  status: 'For Sale' | 'For Rent';
  beds: number;
  baths: number;
  area: number;
  image: string;
  images?: string[];
  type: string;
  featured?: boolean;
  apiBacked?: boolean;
};

// Property listings, agents, and journal posts are loaded from services when
// those APIs are available. Keep the initial state empty instead of shipping
// fabricated records that can be mistaken for live marketplace data.
export const properties: Property[] = [];
export const agents: { name: string; role: string; area: string; image: string; listings: number }[] = [];
export const articles: { title: string; category: string; date: string; image: string }[] = [];

export const listingSlugs = new Set([
  'classical-layout-with-map', 'classical-layout-with-sidebar', 'classical-property',
  'grid-layout-with-map', 'grid-layout-with-sidebar', 'grid', 'half-map', 'half-map-2',
  'list-layout-full', 'list-layout-new', 'list-layout-new-2', 'list-layout-new-3',
  'list-layout-with-map', 'list-layout-with-sidebar', 'listings-list-with-sidebar', 'place-search',
]);

// Legacy template detail URLs do not identify real properties. They redirect
// to live listings; actual details are served by /property/[id] from the API.
export const detailSlugs = new Set([
  'property-detail', 'single-property-1', 'single-property-2', 'single-property-3', 'single-property-4', 'single-property-5', 'single-property-6',
]);
