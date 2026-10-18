'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Property } from '@/src/data/real-estate';

type ListingStatus = 'ACTIVE' | 'DRAFT' | 'PAUSED' | 'DELETED';
type RentalProperty = Property & {
  listingStatus?: ListingStatus;
  occupied: boolean;
  rentedByTenantId?: string;
  rentedByName?: string;
};

type RentalPropertiesContextValue = {
  properties: RentalProperty[];
  setOccupancy: (propertyId: number, occupied: boolean, tenant?: { id: string; name: string }) => void;
  setListingStatus: (propertyId: number, status: ListingStatus) => void;
};

const RentalPropertiesContext = createContext<RentalPropertiesContextValue | null>(null);

export function RentalStateProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<RentalProperty[]>([]);

  function setOccupancy(propertyId: number, occupied: boolean, tenant?: { id: string; name: string }) {
    setProperties((current) => current.map((property) => property.id === propertyId
      ? { ...property, occupied, rentedByTenantId: occupied ? tenant?.id : undefined, rentedByName: occupied ? tenant?.name : undefined }
      : property));
  }

  function setListingStatus(propertyId: number, status: ListingStatus) {
    setProperties((current) => current.map((property) => property.id === propertyId ? { ...property, listingStatus: status } : property));
  }

  return <RentalPropertiesContext.Provider value={{ properties, setOccupancy, setListingStatus }}>{children}</RentalPropertiesContext.Provider>;
}

export function useRentalProperties() {
  const value = useContext(RentalPropertiesContext);
  if (!value) throw new Error('useRentalProperties must be used within RentalStateProvider.');
  return value;
}
