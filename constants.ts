
import { Apartment, ApartmentStatus, ApartmentType, Branch, MarketingVideo } from './types';

export const MATHWAA_SHARE_PERCENTAGE = 0.20;

// --- Mathwaa 52 Data ---
// Total Target: 65,300 SAR
const mathwaa52RawData = [
  { number: '52-11', cash: 2300, duration: 12, ltv: 2300, source: 'Social Media Campaign' },
  { number: '52-19', cash: 2200, duration: 12, ltv: 26400, source: 'Bayut' },
  { number: '52-30', cash: 2000, duration: 12, ltv: 24000, source: 'Social Media Campaign' },
  { number: '52-13', cash: 2900, duration: 12, ltv: 34800, source: 'Aqar' },
  { number: '52-28', cash: 2600, duration: 12, ltv: 31200, source: 'Aqar' },
  { number: '52-27', cash: 2000, duration: 12, ltv: 24000, source: 'Bayut' },
  { number: '52-09', cash: 2300, duration: 12, ltv: 27600, source: 'Social Media Campaign' },
  { number: '52-14', cash: 2300, duration: 12, ltv: 27600, source: 'Word of Mouth' },
  { number: '52-18', cash: 2400, duration: 3, ltv: 7200, source: 'Bayut' },
  { number: '52-32', cash: 2000, duration: 12, ltv: 24000, source: 'Google Maps' },
  { number: '52-17', cash: 2200, duration: 12, ltv: 26400, source: 'Word of Mouth' },
  { number: '52-26', cash: 2200, duration: 12, ltv: 26400, source: 'Social Media Campaign' },
  { number: '52-29', cash: 2600, duration: 12, ltv: 31200, source: 'Social Media Campaign' },
  { number: '52-10', cash: 2500, duration: 12, ltv: 30000, source: 'Social Media Campaign' },
  { number: '52-22', cash: 2200, duration: 3, ltv: 6600, source: 'Social Media Campaign' },
  { number: '52-20', cash: 2200, duration: 3, ltv: 6600, source: 'Social Media Campaign' },
  { number: '52-21', cash: 2200, duration: 3, ltv: 2200, source: 'Social Media Campaign' },
  { number: '52-24', cash: 2200, duration: 12, ltv: 26400, source: 'Social Media Campaign' },
  { number: '52-16', cash: 2300, duration: 12, ltv: 27600, source: 'Social Media Campaign' },
  { number: '52-15', cash: 2500, duration: 12, ltv: 30000, source: 'Social Media Campaign' },
  { number: '52-25', cash: 2200, duration: 12, ltv: 26400, source: 'Social Media Campaign' },
  { number: '52-23', cash: 2400, duration: 12, ltv: 28800, source: 'Aqar' },
  { number: '52-31', cash: 2200, duration: 12, ltv: 26400, source: 'Social Media Campaign' },
  { number: '52-06', cash: 2400, duration: 12, ltv: 28800, source: 'Aqar' },
  { number: '52-08', cash: 2400, duration: 1, ltv: 2400, source: 'Bayut' },
  { number: '52-02', cash: 2600, duration: 3, ltv: 2600, source: 'Social Media Campaign' },
  { number: '52-03', cash: 2400, duration: 1, ltv: 2400, source: 'Paid Social Advertising' },
  { number: '52-07', cash: 2600, duration: 12, ltv: 31200, source: 'Bayut' },
];

const constructMathwaa52Apartments = (): Apartment[] => {
  const apartments: Apartment[] = [];
  const totalUnits = 32;
  
  for (let i = 1; i <= totalUnits; i++) {
    const unitNum = `52-${i.toString().padStart(2, '0')}`;
    // Use filter to find ALL entries for this unit, so we can sum cash/LTV if multiple exist
    const rentedEntries = mathwaa52RawData.filter(d => d.number === unitNum);
    
    // Determine type based on rent if rented, otherwise logic based on floor/index
    let type = ApartmentType.STUDIO;
    let monthlyRent = 2200; // Default vacant pricing

    // Pricing logic from CSV:
    // Ground (1-8): 2400
    // 1st (9-16): 2300
    // 2nd (17-24): 2200
    // 3rd (25-32): 2000
    if (i <= 8) { monthlyRent = 2400; }
    else if (i <= 16) { monthlyRent = 2300; }
    else if (i <= 24) { monthlyRent = 2200; }
    else { monthlyRent = 2000; }

    if (rentedEntries.length > 0) {
        // Aggregate data from all entries
        const totalCash = rentedEntries.reduce((sum, e) => sum + e.cash, 0);
        const totalLTV = rentedEntries.reduce((sum, e) => sum + e.ltv, 0);
        
        // Use the entry with the longest duration (or latest) for metadata
        const mainEntry = rentedEntries.reduce((prev, current) => (prev.duration > current.duration) ? prev : current);

        // Infer type from actual rent. If > 2500 likely 1BR, else Studio
        let calculatedRent = mainEntry.ltv / mainEntry.duration;
        if (mainEntry.duration === 0) calculatedRent = 0;
        
        if (calculatedRent > 2500 || mainEntry.cash > 2500) type = ApartmentType.ONE_BEDROOM;
        else type = ApartmentType.STUDIO;

        apartments.push({
            id: unitNum,
            number: unitNum,
            type: type,
            status: ApartmentStatus.RENTED,
            monthlyRent: calculatedRent > 0 ? parseFloat(calculatedRent.toFixed(0)) : monthlyRent,
            contractDurationMonths: mainEntry.duration,
            cashCollected: totalCash,
            howHeard: mainEntry.source, // Using the source of the main entry
            lifetimeValue: totalLTV
        });
    } else {
        // Vacant unit
        if (i % 4 === 0) type = ApartmentType.ONE_BEDROOM; 
        
        apartments.push({
            id: unitNum,
            number: unitNum,
            type: type,
            status: ApartmentStatus.VACANT,
            monthlyRent: monthlyRent,
            contractDurationMonths: 0,
            cashCollected: 0,
            lifetimeValue: 0
        });
    }
  }
  return apartments;
};

// --- Mathwaa 53 Data from CSV ---
const mathwaa53RawData = [
  { number: '53-25', cash: 2200, duration: 12, ltv: 26400, source: 'Social Media Campaign' },
  { number: '53-13', cash: 2530, duration: 12, ltv: 30360, source: 'Bayut' },
  { number: '53-03', cash: 2640, duration: 12, ltv: 31680, source: 'Word of Mouth' },
  { number: '53-11', cash: 2530, duration: 12, ltv: 30360, source: 'Social Media Campaign' },
  { number: '53-20', cash: 2420, duration: 1, ltv: 2420, source: 'Social Media Campaign' },
  { number: '53-27', cash: 2200, duration: 12, ltv: 26400, source: 'Google Maps' },
  { number: '53-29', cash: 2200, duration: 12, ltv: 26400, source: 'Social Media Campaign' },
  { number: '53-28', cash: 2420, duration: 12, ltv: 29040, source: 'Bayut' },
  { number: '53-32', cash: 2200, duration: 12, ltv: 26400, source: 'Bayut' },
  { number: '53-26', cash: 2860, duration: 3, ltv: 8580, source: 'Wasalt' },
  // New Bookings
  { number: '53-22', cash: 2420, duration: 2, ltv: 4840, source: 'Social Media Campaign' },
  { number: '53-09', cash: 2530, duration: 12, ltv: 30360, source: 'Bayut' },
  { number: '53-12', cash: 2750, duration: 12, ltv: 33000, source: 'Social Media Campaign' },
];

const constructMathwaa53Apartments = (): Apartment[] => {
  const apartments: Apartment[] = [];
  const totalUnits = 32;

  for (let i = 1; i <= totalUnits; i++) {
    const unitNum = `53-${i.toString().padStart(2, '0')}`;
    const rentedData = mathwaa53RawData.find(d => d.number === unitNum);

    let type = ApartmentType.STUDIO;
    let monthlyRent = 2420; // Default price based on mid-tiers

    // Pricing logic from CSV (10% higher approx):
    // Ground (1-8): 2640
    // 1st (9-16): 2530
    // 2nd (17-24): 2420
    // 3rd (25-32): 2200

    if (i <= 8) { monthlyRent = 2640; }
    else if (i <= 16) { monthlyRent = 2530; }
    else if (i <= 24) { monthlyRent = 2420; }
    else { monthlyRent = 2200; }

    if (rentedData) {
        let calculatedRent = rentedData.ltv / rentedData.duration;
         if (rentedData.duration === 0) calculatedRent = 0;
         
        // Type inference based on rent
        if (calculatedRent > 2800 || rentedData.cash > 2800) type = ApartmentType.ONE_BEDROOM;
        else type = ApartmentType.STUDIO;

        apartments.push({
            id: unitNum,
            number: unitNum,
            type: type,
            status: ApartmentStatus.RENTED,
            monthlyRent: calculatedRent > 0 ? parseFloat(calculatedRent.toFixed(0)) : monthlyRent,
            contractDurationMonths: rentedData.duration,
            cashCollected: rentedData.cash,
            howHeard: rentedData.source,
            lifetimeValue: rentedData.ltv
        });
    } else {
        if (i % 4 === 0) type = ApartmentType.ONE_BEDROOM;

        apartments.push({
            id: unitNum,
            number: unitNum,
            type: type,
            status: ApartmentStatus.VACANT,
            monthlyRent: monthlyRent,
            contractDurationMonths: 0,
            cashCollected: 0,
            lifetimeValue: 0
        });
    }
  }
  return apartments;
};

const mathwaa52Apartments = constructMathwaa52Apartments();
const mathwaa53Apartments = constructMathwaa53Apartments();


export const BRANCHES: Branch[] = [
  {
    id: 'mathwaa-52',
    name: 'Mathwaa 52 - Al Murooj',
    apartments: mathwaa52Apartments,
    targetYearlyRevenue: {
      min: 819000, 
      max: 936000, 
    },
  },
  {
    id: 'mathwaa-53',
    name: 'Mathwaa 53 - Al Murooj',
    apartments: mathwaa53Apartments,
    targetYearlyRevenue: {
      min: 907200, 
      max: 1036800, 
    },
  },
];

// --- Marketing Videos ---
export const SOCIAL_MEDIA_VIDEOS: MarketingVideo[] = [
    {
        id: 'sm1',
        title: 'Elevated Living at Mathwaa',
        thumbnailUrl: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
        videoUrl: 'https://drive.google.com/file/d/1u6i_7MN74iogQP0qwdS9o2GYOHtWTZA4/view?usp=sharing',
    },
    {
        id: 'sm2',
        title: 'Affordable Living in Al Murooj',
        thumbnailUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
        videoUrl: 'https://drive.google.com/file/d/1dO3W-8IX8JultVN768H1hyxVVmxC4F2I/view?usp=sharing',
    },
    {
        id: 'sm3',
        title: 'Uncompromising Quality, Exceptional Value',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        videoUrl: 'https://drive.google.com/file/d/16FpLmv2F_eMLI4qZZJZCFv-AX1xxYw-s/view?usp=sharing',
    },
];
