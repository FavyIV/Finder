export type Category =
  'ELECTRONICS' | 'CLOTHING' | 'ACCESSORIES' | 'BOOKS' | 'DOCUMENTS' | 'KEYS' | 'BAGS' | 'OTHER';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'ELECTRONICS', label: 'Electronics (Phones, Laptops, Chargers)' },
  { value: 'KEYS', label: 'Keys' },
  { value: 'DOCUMENTS', label: 'Documents (IDs, Cards, Notebooks)' },
  { value: 'BAGS', label: 'Bags & Backpacks' },
  { value: 'CLOTHING', label: 'Clothing & Footwear' },
  { value: 'ACCESSORIES', label: 'Accessories (Watches, Glasses, Jewellery)' },
  { value: 'BOOKS', label: 'Books & Stationery' },
  { value: 'OTHER', label: 'Other Items' },
];

export type CampusLocation = {
  id: string;
  name: string;
  isSecurityPost: boolean;
};

export type FoundStatus = 'AVAILABLE' | 'CLAIMED' | 'EXPIRED';

export type FoundListing = {
  id: string;
  photoUrl: string;
  category: Category;
  description: string | null;
  foundAt: string;
  status: FoundStatus;
  isUnderReview: boolean;
  createdAt: string;
  location: {
    id: string;
    name: string;
    isSecurityPost: boolean;
  };
  reportedBy: {
    id: string;
    name: string;
  };
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SearchFoundListingsParams = {
  category?: Category | '';
  locationId?: string;
  foundFrom?: string;
  foundTo?: string;
  page?: number;
  pageSize?: number;
};

export type SearchFoundListingsResponse = {
  data: FoundListing[];
  meta: PaginationMeta;
};
