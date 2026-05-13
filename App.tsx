import React, { useState, useEffect } from 'react';
import App_en from './App_en';
import App_ar from './App_ar';
import PricingDashboard from './components/PricingDashboard';
import { BRANCHES } from './constants';
import type { Branch, NewBooking, ApartmentStatus, Apartment } from './types';

const App: React.FC = () => {
  const [language, setLanguage] = useState('ar');
  const [branches, setBranches] = useState<Branch[]>(BRANCHES);
  const [view, setView] = useState<'dashboard' | 'pricing'>('pricing');

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const toggleView = () => {
    setView(prev => (prev === 'dashboard' ? 'pricing' : 'dashboard'));
  };

  useEffect(() => {
    if (language === 'ar') {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
      document.body.classList.add('font-cairo');
    } else {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
      document.body.classList.remove('font-cairo');
    }
  }, [language]);
  
  const handleAddBooking = (booking: NewBooking) => {
    setBranches(prevBranches => {
      return prevBranches.map(branch => {
        if (branch.id === booking.branchId) {
          const newApartments = branch.apartments.map(apt => {
            if (apt.id === booking.apartmentId) {
              return {
                ...apt,
                status: 'RENTED' as ApartmentStatus.RENTED,
                contractDurationMonths: booking.contractDurationMonths,
                howHeard: booking.howHeard,
                cashCollected: apt.monthlyRent, // One month's rent collected on booking
              };
            }
            return apt;
          });
          return { ...branch, apartments: newApartments };
        }
        return branch;
      });
    });
  };

  const handleUpdateApartments = (branchId: string, newApartments: Apartment[]) => {
    setBranches(prevBranches => {
      return prevBranches.map(branch => {
        if (branch.id === branchId) {
          // Create a new branch object with the updated apartments
          return { ...branch, apartments: newApartments };
        }
        return branch;
      });
    });
  };

  if (view === 'pricing') {
    return <PricingDashboard onBack={() => setView('dashboard')} language={language as 'en' | 'ar'} />;
  }

  return language === 'en' ? (
    <App_en 
      onToggleLanguage={toggleLanguage}
      branches={branches}
      onAddBooking={handleAddBooking}
      onUpdateApartments={handleUpdateApartments}
      onSwitchToPricing={() => setView('pricing')}
    />
  ) : (
    <App_ar 
      onToggleLanguage={toggleLanguage}
      branches={branches}
      onAddBooking={handleAddBooking}
      onUpdateApartments={handleUpdateApartments}
      onSwitchToPricing={() => setView('pricing')}
    />
  );
};

export default App;