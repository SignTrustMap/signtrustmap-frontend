const stopSignImage = require('@/assets/images/smaple_signs/stop_sign.webp');

export const signCategories = [
  'All Signs',
  'Guidance',
  'Danger',
  'Regulatory',
  'Prohibition',
  'Supplementary',
] as const;

export type SignCategory = Exclude<(typeof signCategories)[number], 'All Signs'>;

export type CatalogSign = {
  category: SignCategory;
  description: string;
  id: string;
  image: number;
  name: string;
};

export const catalogSigns: CatalogSign[] = [
  {
    category: 'Guidance',
    description: 'Shows the route or location of a nearby hospital.',
    id: 'hospital',
    image: stopSignImage,
    name: 'Hospital',
  },
  {
    category: 'Guidance',
    description: 'Directs road users toward the nearest airport.',
    id: 'airport',
    image: stopSignImage,
    name: 'Airport',
  },
  {
    category: 'Guidance',
    description: 'Traffic may travel only in the indicated direction.',
    id: 'one-way',
    image: stopSignImage,
    name: 'One Way',
  },
  {
    category: 'Danger',
    description: 'Warns drivers that a winding road is ahead.',
    id: 'curvy-road',
    image: stopSignImage,
    name: 'Curvy Road',
  },
  {
    category: 'Regulatory',
    description: 'Requires drivers to come to a complete stop.',
    id: 'stop-sign',
    image: stopSignImage,
    name: 'Stop Sign',
  },
  {
    category: 'Prohibition',
    description: 'Entry from this direction is not permitted.',
    id: 'no-entry',
    image: stopSignImage,
    name: 'No Entry',
  },
  {
    category: 'Supplementary',
    description: 'Adds distance, direction, or timing details to another sign.',
    id: 'supplementary-plate',
    image: stopSignImage,
    name: 'Supplementary Plate',
  },
];
