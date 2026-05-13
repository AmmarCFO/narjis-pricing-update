
export enum ApartmentStatus {
  RENTED = 'RENTED',
  VACANT = 'VACANT',
  RESERVED = 'RESERVED',
}

export enum ApartmentType {
  STUDIO = 'Studio',
  ONE_BEDROOM = 'One Bedroom',
  TWO_BEDROOM = 'Two Bedroom',
}

export interface Apartment {
  id: string;
  number: string;
  type: ApartmentType;
  status: ApartmentStatus;
  monthlyRent: number;
  contractDurationMonths: number;
  cashCollected: number;
  howHeard?: string;
  lifetimeValue?: number;
}

export interface Branch {
  id: string;
  name: string;
  apartments: Apartment[];
  targetYearlyRevenue: {
    min: number;
    max: number;
  };
}

export interface MarketingVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface NewBooking {
  branchId: string;
  apartmentId: string;
  contractDurationMonths: number;
  howHeard: string;
}
