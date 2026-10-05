export type Property = {
  id: number;
  title: string;
  address: string;
  price: string;
  amount: number;
  status: 'For Sale' | 'For Rent';
  beds: number;
  baths: number;
  area: number;
  image: string;
  type: string;
  featured?: boolean;
};

export const properties: Property[] = [
  { id: 1, title: 'The Grand Residence', address: 'East Legon, Accra', price: 'GH₵ 2,450,000', amount: 2450000, status: 'For Sale', beds: 4, baths: 3, area: 2400, image: '/assets/img/grand-residence-dining.jpeg', type: 'Villa', featured: true },
  { id: 2, title: 'Modern City Apartment', address: 'Cantonments, Accra', price: 'GH₵ 12,500 / month', amount: 12500, status: 'For Rent', beds: 2, baths: 2, area: 1150, image: '/assets/img/modern-city-dining.avif', type: 'Apartment' },
  { id: 3, title: 'Palm Grove Townhouse', address: 'Airport Residential, Accra', price: 'GH₵ 1,780,000', amount: 1780000, status: 'For Sale', beds: 3, baths: 3, area: 1850, image: '/assets/img/palm-grove-townhouse.webp', type: 'Townhouse', featured: true },
  { id: 4, title: 'Garden View Residence', address: 'Labone, Accra', price: 'GH₵ 9,800 / month', amount: 9800, status: 'For Rent', beds: 3, baths: 2, area: 1600, image: '/assets/img/garden-view-living-room.jpg', type: 'Apartment' },
  { id: 5, title: 'Coastal Escape', address: 'Axim, Western Region', price: 'GH₵ 3,100,000', amount: 3100000, status: 'For Sale', beds: 5, baths: 4, area: 3200, image: '/assets/img/coastal-escape-exterior.webp', type: 'Villa' },
  { id: 6, title: 'The Veranda House', address: 'Adenta, Accra', price: 'GH₵ 7,500 / month', amount: 7500, status: 'For Rent', beds: 3, baths: 2, area: 1450, image: '/assets/img/veranda-house-exterior.webp', type: 'House' },
];

export const agents = [
  { name: 'Ama Mensah', role: 'Real Estate Consultant', area: 'Accra', image: '/assets/img/user.svg', listings: 18 },
  { name: 'Kwame Boateng', role: 'Property Advisor', area: 'Tema', image: '/assets/img/user-dark.svg', listings: 12 },
  { name: 'Nana Owusu', role: 'Senior Agent', area: 'East Legon', image: '/assets/img/user-light.svg', listings: 24 },
  { name: 'Esi Addo', role: 'Residential Specialist', area: 'Cantonments', image: '/assets/img/agency-1.png', listings: 9 },
];

export const articles = [
  { title: 'A practical guide to buying your first home', category: 'Buying Guide', date: '6 min read', image: '/assets/img/first-home-guide.webp' },
  { title: 'What to look for when choosing a neighbourhood', category: 'Lifestyle', date: '4 min read', image: '/assets/img/neighborhood-guide.avif' },
  { title: 'Preparing your property for the rental market', category: 'Property Advice', date: '5 min read', image: '/assets/img/preparing-rental-market.webp' },
];

export const listingSlugs = new Set([
  'classical-layout-with-map', 'classical-layout-with-sidebar', 'classical-property',
  'grid-layout-with-map', 'grid-layout-with-sidebar', 'grid', 'half-map', 'half-map-2',
  'list-layout-full', 'list-layout-new', 'list-layout-new-2', 'list-layout-new-3',
  'list-layout-with-map', 'list-layout-with-sidebar', 'listings-list-with-sidebar', 'place-search',
]);

export const detailSlugs = new Set([
  'property-detail', 'single-property-1', 'single-property-2', 'single-property-3', 'single-property-4', 'single-property-5', 'single-property-6',
]);
