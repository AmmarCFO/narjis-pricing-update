
import React, { useState, useRef } from 'react';
import { MATHWAA_SHARE_PERCENTAGE } from './constants';
import { SOCIAL_MEDIA_VIDEOS_AR } from './constants_ar';
import { Apartment, ApartmentStatus, ApartmentType, type Branch, type NewBooking } from './types';
import Header_ar from './components/Header_ar';
import ApartmentTable_ar from './components/ApartmentTable_ar';
import MarketingCampaigns_ar from './components/MarketingCampaigns_ar';
import BranchComparisonChart_ar from './components/BranchComparisonChart_ar';
import BookingSourceChart_ar from './components/BookingSourceChart_ar';
import AddBookingModal_ar from './components/AddBookingModal_ar';
import { PlusIcon, UploadIcon, ChartBarIcon, BanknotesIcon } from './components/Icons';
import { FadeInUp, StaggeredGrid, AnimatedItem } from './components/AnimatedWrappers';
import { Section, Metric, ShareBreakdown, OccupancyRadial } from './components/DashboardComponents';
import { motion, AnimatePresence } from 'framer-motion';


const App_ar: React.FC<{ 
  onToggleLanguage: () => void;
  branches: Branch[];
  onAddBooking: (booking: NewBooking) => void;
  onUpdateApartments: (branchId: string, apartments: Apartment[]) => void;
  onSwitchToPricing?: () => void;
}> = ({ onToggleLanguage, branches, onAddBooking, onUpdateApartments, onSwitchToPricing }) => {
  const [visibleTable, setVisibleTable] = useState<string | null>(null);
  const [activeRevenueTab, setActiveRevenueTab] = useState<string>(branches[0].id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTable = (branchId: string) => {
    setVisibleTable(visibleTable === branchId ? null : branchId);
  };

  const totalTargetYearlyRevenue = branches.reduce((total, branch) => {
    total.min += branch.targetYearlyRevenue.min;
    total.max += branch.targetYearlyRevenue.max;
    return total;
  }, { min: 0, max: 0 });

  const totalCashCollected = branches.reduce((total, branch) => {
    const branchCash = branch.apartments.reduce((sum, apt) => sum + apt.cashCollected, 0);
    return total + branchCash;
  }, 0);

  const totalLifetimeValue = branches.reduce((total, branch) => {
    const branchLTV = branch.apartments.reduce((sum, apt) => sum + (apt.lifetimeValue || 0), 0);
    return total + branchLTV;
  }, 0);

  // Occupancy Calculations
  const calcOccupancy = (branch: Branch) => {
    const total = branch.apartments.length;
    const rented = branch.apartments.filter(a => a.status === ApartmentStatus.RENTED).length;
    return {
        total,
        rented,
        percentage: total > 0 ? Math.round((rented / total) * 100) : 0
    };
  };

  const branch1 = branches[0]; // Mathwaa 52
  const branch2 = branches[1]; // Mathwaa 53

  const occ1 = calcOccupancy(branch1);
  const occ2 = calcOccupancy(branch2);
  
  const totalApartments = branches.reduce((sum, b) => sum + b.apartments.length, 0);
  const totalRented = branches.reduce((sum, b) => sum + b.apartments.filter(a => a.status === ApartmentStatus.RENTED).length, 0);
  const portfolioPercentage = totalApartments > 0 ? Math.round((totalRented / totalApartments) * 100) : 0;

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('ar-SA')} ريال`;
  };

  const translateBranchName = (name: string) => {
    if (name === 'Mathwaa 52 - Al Murooj') {
        return 'مثوى ٥٢ - المروج';
    }
    if (name === 'Mathwaa 53 - Al Murooj') {
        return 'مثوى ٥٣ - المروج';
    }
    return name;
  };

  const chartData = branches.map(branch => ({
    name: translateBranchName(branch.name),
    'المبالغ المحصلة': branch.apartments.reduce((sum, apt) => sum + apt.cashCollected, 0),
    'الإيرادات المستهدفة': branch.targetYearlyRevenue.max,
  }));
  
  const getSourceCategory = (source: string): string => {
    const cleanedSource = source.toLowerCase();
    if (cleanedSource.includes('bayut') || cleanedSource.includes('aqar') || cleanedSource.includes('listing')) {
      return 'منصات الإدراج';
    }
    if (cleanedSource.includes('social') || cleanedSource.includes('facebook') || cleanedSource.includes('instagram') || cleanedSource.includes('tiktok')) {
      return 'إعلانات وسائل التواصل الاجتماعي المدفوعة';
    }
    if (cleanedSource.includes('word of mouth')) {
      return 'التوصيات الشفهية';
    }
    if (cleanedSource.includes('walk in') || cleanedSource.includes('building board')) {
      return 'زيارة مباشرة';
    }
    return 'أخرى';
  };

  const bookingSourceData = branches.flatMap(branch => branch.apartments)
    .filter(apt => apt.status === 'RENTED' && apt.howHeard)
    .reduce((acc, apt) => {
      const category = getSourceCategory(apt.howHeard!);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const bookingSourceChartData = Object.entries(bookingSourceData).map(([name, value]) => ({
      name,
      value,
  }));
  
  const handleSubmitBooking = (booking: NewBooking) => {
    onAddBooking(booking);
    setIsModalOpen(false);
  };
  
  const handleUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadStatus(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const newApartments = parseApartmentCSV(text);
        
        // Dynamic Branch Selection logic for uploads
        const firstAptId = newApartments[0]?.id || '';
        let targetBranchId = '';
        if (firstAptId.startsWith('52')) targetBranchId = 'mathwaa-52';
        else if (firstAptId.startsWith('53')) targetBranchId = 'mathwaa-53';
        else targetBranchId = branches[0].id; // Fallback

        if (targetBranchId) {
            onUpdateApartments(targetBranchId, newApartments);
            setUploadStatus({ message: 'تم تحديث بيانات الشقق بنجاح!', type: 'success' });
        } else {
             throw new Error("لم يتم العثور على فرع لتحديثه.");
        }
      } catch (error: any) {
        setUploadStatus({ message: error.message, type: 'error' });
      } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setUploadStatus({ message: 'فشل في قراءة الملف.', type: 'error' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const parseApartmentCSV = (csvText: string): Apartment[] => {
    const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error("يجب أن يحتوي ملف CSV على صف رأس وصف بيانات واحد على الأقل.");

    const rawHeader = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const headerMap: { [key: string]: number } = {};
    rawHeader.forEach((h, i) => {
        if (h.toLowerCase().startsWith('apt')) headerMap['Apt #'] = i;
        else if (h.toLowerCase().startsWith('type')) headerMap['Type'] = i;
        else if (h.toLowerCase().startsWith('status')) headerMap['Status'] = i;
        else if (h.toLowerCase().startsWith('monthly rent')) headerMap['Monthly Rent'] = i;
        else if (h.toLowerCase().startsWith('cash collected')) headerMap['Cash Collected'] = i;
        else if (h.toLowerCase().startsWith('estimated')) headerMap['Duration'] = i;
        else if (h.toLowerCase().startsWith('lifetime')) headerMap['Lifetime Value'] = i;
        else if (h.toLowerCase().startsWith('booking source')) headerMap['Source'] = i;
    });

    const requiredHeaders = ["Apt #", "Type", "Status", "Cash Collected", "Lifetime Value", "Source"];
     for(const req of requiredHeaders) {
        if(headerMap[req] === undefined) throw new Error(`العمود المطلوب مفقود في ملف CSV: ${req}`);
    }

    return lines.slice(1).map((line, index) => {
        const values = line.split(',');
        
        const numberStr = values[headerMap["Apt #"]].trim();
        if (!numberStr) throw new Error(`الصف ${index + 2}: 'رقم الشقة' لا يمكن أن يكون فارغًا.`);

        const typeStr = values[headerMap["Type"]].trim();
        const typeMap: {[key: string]: ApartmentType} = {
            '1br': ApartmentType.ONE_BEDROOM,
            '2br': ApartmentType.TWO_BEDROOM,
            'st': ApartmentType.STUDIO
        }
        const type = typeMap[typeStr.toLowerCase()] || Object.values(ApartmentType).find(t => t.toLowerCase() === typeStr.toLowerCase());
        if (!type) throw new Error(`الصف ${index + 2}: قيمة "النوع" غير صالحة "${typeStr}".`);

        const statusStr = values[headerMap["Status"]].trim().toUpperCase();
        const status = Object.values(ApartmentStatus).find(s => statusStr.startsWith(s));
        if (!status) throw new Error(`الصف ${index + 2}: قيمة "الحالة" غير صالحة "${values[headerMap["Status"]].trim()}".`);

        const lifetimeValueStr = (values[headerMap["Lifetime Value"]] || '0').replace(/[^0-9.]/g, '');
        const lifetimeValue = lifetimeValueStr ? parseFloat(lifetimeValueStr) : 0;
        
        const durationStr = (values[headerMap['Duration']] || '0').trim();
        const durationMatch = durationStr.match(/^(\d+)/);
        let contractDurationMonths = durationMatch ? parseInt(durationMatch[1], 10) : 1;
        if (contractDurationMonths === 0 && lifetimeValue > 0) contractDurationMonths = 1;

        const monthlyRentStr = (values[headerMap["Monthly Rent"]] || '').replace(/[^0-9.]/g, '');
        let monthlyRent = monthlyRentStr ? parseFloat(monthlyRentStr) : 0;
        
        if (monthlyRent === 0 && lifetimeValue > 0 && contractDurationMonths > 0) {
            monthlyRent = parseFloat((lifetimeValue / contractDurationMonths).toFixed(2));
        }

        const cashCollectedStr = (values[headerMap["Cash Collected"]] || '0').replace(/[^0-9.]/g, '');
        const cashCollected = cashCollectedStr ? parseFloat(cashCollectedStr) : 0;

        const howHeard = values[headerMap["Source"]]?.trim() || undefined;

        return {
            id: numberStr,
            number: numberStr,
            type,
            status,
            monthlyRent,
            contractDurationMonths,
            cashCollected,
            howHeard,
            lifetimeValue,
        };
    });
};
  
  const activeBranch = branches.find(b => b.id === activeRevenueTab) || branches[0];

  return (
    <div className="min-h-screen bg-[#F1ECE6] text-[#4A2C5A] overflow-x-hidden selection:bg-[#4A2C5A] selection:text-white">
      <Header_ar onToggleLanguage={onToggleLanguage} onSwitchToPricing={onSwitchToPricing} />
      <main className="max-w-6xl mx-auto px-4 pb-20">
        
        {/* Hero Info Card */}
        <FadeInUp>
          <div className="bg-white/40 backdrop-blur-xl border border-white/40 p-0 rounded-[2rem] my-8 sm:my-16 shadow-lg grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#4A2C5A]/5">
            <div className="p-6 sm:p-8 flex flex-col justify-center text-right">
              <h3 className="text-xs font-bold text-[#4A2C5A]/50 uppercase tracking-widest mb-3">الفرع</h3>
              <div className="flex flex-col gap-1">
                {branches.map(branch => (
                  <p key={branch.id} className="text-lg font-bold text-[#4A2C5A] leading-tight">{translateBranchName(branch.name)}</p>
                ))}
              </div>
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center text-right">
              <h3 className="text-xs font-bold text-[#4A2C5A]/50 uppercase tracking-widest mb-3">تقرير لـ</h3>
              <p className="text-xl font-bold text-[#4A2C5A]">السيد سامي اليحيى</p>
              <div className="mt-3 inline-block ml-auto">
                <p className="text-xs font-medium text-[#4A2C5A]/60 bg-[#4A2C5A]/5 px-3 py-1 rounded-full">آخر تحديث: ٥ ديسمبر ٢٠٢٥</p>
              </div>
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center text-right">
              <h3 className="text-xs font-bold text-[#4A2C5A]/50 uppercase tracking-widest mb-3">عدد الوحدات</h3>
              <div className="space-y-2">
                 <div className="flex justify-between items-start text-sm flex-row-reverse">
                    <span className="font-bold text-[#4A2C5A]">مثوى ٥٢</span>
                    <span className="text-[#4A2C5A]/70">٣٢ شقة</span>
                 </div>
                 <div className="flex justify-between items-start text-sm flex-row-reverse">
                    <span className="font-bold text-[#4A2C5A]">مثوى ٥٣</span>
                    <span className="text-[#4A2C5A]/70">٣٢ شقة</span>
                 </div>
              </div>
            </div>
          </div>
        </FadeInUp>

        {/* Title Section */}
        <FadeInUp>
          <div className="text-center pb-8 sm:pb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-[#4A2C5A] tracking-tighter leading-tight">
              أداء الفروع
            </h1>
            <p className="text-lg sm:text-xl text-[#4A2C5A]/70 mt-4 font-medium max-w-2xl mx-auto">
              نظرة عامة شاملة ودقيقة لمالك العقار
            </p>
          </div>
        </FadeInUp>

        {/* Occupancy Section */}
        <Section title="نظرة عامة على الإشغال" titleColor="text-[#4A2C5A]" className="!mt-0 !pt-8">
          <StaggeredGrid>
            <AnimatedItem>
              <OccupancyRadial 
                percentage={occ1.percentage} 
                label={translateBranchName(branch1.name)} 
                subLabel={`${occ1.rented} / ${occ1.total} مؤجرة`} 
                color="#2A5B64" 
              />
            </AnimatedItem>
            <AnimatedItem>
              <OccupancyRadial 
                percentage={occ2.percentage} 
                label={translateBranchName(branch2.name)} 
                subLabel={`${occ2.rented} / ${occ2.total} مؤجرة`} 
                color="#A99484" 
              />
            </AnimatedItem>
             <AnimatedItem>
              <OccupancyRadial 
                percentage={portfolioPercentage} 
                label="إجمالي المحفظة" 
                subLabel={`${totalRented} / ${totalApartments} الإجمالي`} 
                color="#4A2C5A" 
              />
            </AnimatedItem>
          </StaggeredGrid>
        </Section>
        
        {/* Target Revenue Section */}
        <Section title="الإيرادات السنوية المستهدفة" className="bg-gradient-to-br from-[#4A2C5A] to-[#2d1b36] rounded-[2.5rem] shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light pointer-events-none"></div>
            
            <FadeInUp>
              <div className="text-center relative z-10 pt-8 sm:pt-12 px-4">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
                      <div className="text-center group">
                          <p className="text-xs font-bold text-white/40 tracking-[0.2em] uppercase mb-2 group-hover:text-white/60 transition-colors">الحد الأدنى</p>
                          <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tighter">{formatCurrency(totalTargetYearlyRevenue.min)}</p>
                      </div>
                      <div className="hidden sm:block h-16 w-[1px] bg-white/10"></div>
                      <div className="w-16 h-[1px] bg-white/10 sm:hidden"></div>
                      <div className="text-center group">
                          <p className="text-xs font-bold text-white/40 tracking-[0.2em] uppercase mb-2 group-hover:text-white/60 transition-colors">الحد الأعلى</p>
                          <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tighter">{formatCurrency(totalTargetYearlyRevenue.max)}</p>
                      </div>
                  </div>
                  
                  {/* Range Indicator */}
                  <div className="w-full max-w-md mx-auto h-1.5 bg-white/10 rounded-full mt-8 sm:mt-10 relative hidden sm:block overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      <div className="absolute left-[10%] right-[10%] top-0 bottom-0 bg-gradient-to-r from-[#A99484] to-[#8A6E99] opacity-50 blur-sm"></div>
                  </div>

                  <p className="text-base sm:text-lg text-white/70 mt-6 sm:mt-8 max-w-lg mx-auto font-medium">إجمالي الدخل الإيجاري المحتمل للسنة.</p>
                  
                  <div className="mt-6 inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-5 py-2 rounded-full border border-white/5 shadow-inner flex-row-reverse">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <p className="text-sm text-white/90 font-medium">بدء الحساب: <span className="opacity-70">١٤ نوفمبر ٢٠٢٥</span></p>
                  </div>
              </div>
            </FadeInUp>
            
             <FadeInUp>
              <div className="mt-12 sm:mt-16 flex justify-center relative z-10 px-4">
                <div className="bg-black/20 backdrop-blur-xl p-1.5 rounded-full inline-flex border border-white/10 shadow-lg overflow-x-auto max-w-full">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => setActiveRevenueTab(branch.id)}
                      className={`px-6 sm:px-8 py-3 rounded-full text-sm font-bold transition-all duration-500 ease-out whitespace-nowrap ${
                        activeRevenueTab === branch.id
                          ? 'bg-white text-[#4A2C5A] shadow-md'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {translateBranchName(branch.name)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail Card */}
              <div className="mt-8 sm:mt-10 max-w-4xl mx-auto px-4 pb-8 sm:pb-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeBranch.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "backOut" }}
                    className="bg-[#F1ECE6] p-6 sm:p-10 rounded-[2rem] shadow-2xl border border-white/40 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-64 h-64 bg-[#4A2C5A]/5 rounded-full blur-3xl pointer-events-none -ml-16 -mt-16"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#2A5B64]/5 rounded-full blur-3xl pointer-events-none -mr-16 -mb-16"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#4A2C5A]/10 relative z-10">
                      <div className="text-center md:pl-10">
                        <div className="flex items-center justify-center gap-3 mb-4">
                           <div className="p-2 bg-[#4A2C5A]/5 rounded-lg">
                             <ChartBarIcon className="w-5 h-5 text-[#4A2C5A]" />
                           </div>
                           <p className="text-xs font-bold text-[#4A2C5A]/60 uppercase tracking-widest">الهدف السنوي</p>
                        </div>
                        <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                           <span className="text-2xl sm:text-3xl font-bold text-[#4A2C5A]">{formatCurrency(activeBranch.targetYearlyRevenue.min)}</span>
                           <span className="text-sm text-[#4A2C5A]/40 font-serif italic">إلى</span>
                           <span className="text-2xl sm:text-3xl font-bold text-[#4A2C5A]">{formatCurrency(activeBranch.targetYearlyRevenue.max)}</span>
                        </div>
                      </div>
                      
                      <div className="text-center pt-8 sm:pt-10 md:pt-0 md:pr-10">
                        <div className="flex items-center justify-center gap-3 mb-4">
                           <div className="p-2 bg-[#4A2C5A]/5 rounded-lg">
                             <BanknotesIcon className="w-5 h-5 text-[#4A2C5A]" />
                           </div>
                           <p className="text-xs font-bold text-[#4A2C5A]/60 uppercase tracking-widest">الهدف الشهري</p>
                        </div>
                        <div className="flex flex-col xl:flex-row items-center justify-center gap-2 mb-8">
                           <span className="text-2xl sm:text-3xl font-bold text-[#4A2C5A]">{formatCurrency(activeBranch.targetYearlyRevenue.min / 12)}</span>
                           <span className="text-sm text-[#4A2C5A]/40 font-serif italic">إلى</span>
                           <span className="text-2xl sm:text-3xl font-bold text-[#4A2C5A]">{formatCurrency(activeBranch.targetYearlyRevenue.max / 12)}</span>
                        </div>
                         
                         <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/60">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs">
                                <div>
                                    <p className="font-bold text-[#4A2C5A]/60 uppercase tracking-wide mb-2">حصة مثوى</p>
                                    <p className="text-[#4A2C5A] font-bold text-sm">
                                        {formatCurrency((activeBranch.targetYearlyRevenue.min / 12) * MATHWAA_SHARE_PERCENTAGE)}
                                        <span className="font-normal text-opacity-50 mx-1">-</span> 
                                        {formatCurrency((activeBranch.targetYearlyRevenue.max / 12) * MATHWAA_SHARE_PERCENTAGE)}
                                    </p>
                                </div>
                                <div>
                                    <p className="font-bold text-[#4A2C5A]/60 uppercase tracking-wide mb-2">حصة المستثمر</p>
                                    <p className="text-[#4A2C5A] font-bold text-sm">
                                        {formatCurrency((activeBranch.targetYearlyRevenue.min / 12) * (1 - MATHWAA_SHARE_PERCENTAGE))}
                                        <span className="font-normal text-opacity-50 mx-1">-</span>
                                        {formatCurrency((activeBranch.targetYearlyRevenue.max / 12) * (1 - MATHWAA_SHARE_PERCENTAGE))}
                                    </p>
                                </div>
                             </div>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </FadeInUp>

            <FadeInUp>
              <ShareBreakdown
                title="توزيع الحصص السنوي"
                totalValue={totalTargetYearlyRevenue}
                mathwaaSharePercentage={MATHWAA_SHARE_PERCENTAGE}
                mathwaaLabel="حصة مثوى"
                investorLabel="حصة المستثمر"
                formatCurrency={formatCurrency}
                className="text-white pb-12"
                valueClassName="text-xl sm:text-2xl"
              />
            </FadeInUp>
        </Section>
        
        {/* Cash Collections Section */}
        <Section title="المبالغ المحصلة" titleColor="text-[#4A2C5A]">
            <FadeInUp>
              <Metric value={formatCurrency(totalCashCollected)} label="نظرة محدثة على الإيرادات المستلمة من المستأجرين." valueColor="text-[#4A2C5A]" labelColor="text-[#4A2C5A]/80"/>
            </FadeInUp>
            <FadeInUp>
              <ShareBreakdown
                title="توزيع الحصص"
                totalValue={totalCashCollected}
                mathwaaSharePercentage={MATHWAA_SHARE_PERCENTAGE}
                mathwaaLabel="حصة مثوى"
                investorLabel="حصة المستثمر"
                formatCurrency={formatCurrency}
                className="text-[#4A2C5A]"
                cardClassName="bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg"
                investorCardClassName="bg-[#4A2C5A] text-white shadow-2xl scale-105 border-none"
              />
            </FadeInUp>
            
            <FadeInUp>
              <div className="mt-16 sm:mt-20 bg-white/60 backdrop-blur-xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/50">
                 <div className="flex items-center justify-between mb-8 flex-row-reverse">
                     <h3 className="text-lg sm:text-xl font-bold text-[#4A2C5A]">مقارنة أداء الفروع</h3>
                     <div className="px-3 py-1 rounded-full bg-[#4A2C5A]/5 text-[#4A2C5A] text-xs font-bold uppercase tracking-wider">تحليل</div>
                 </div>
                 <BranchComparisonChart_ar data={chartData} />
              </div>
            </FadeInUp>
            
            <FadeInUp>
               <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                  {branches.map(branch => (
                       <div key={`details-${branch.id}`}>
                          <button 
                             onClick={() => toggleTable(branch.id)} 
                             className={`w-full group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:shadow-xl border ${visibleTable === branch.id ? 'bg-[#4A2C5A] border-[#4A2C5A] text-white' : 'bg-white border-[#4A2C5A]/10 text-[#4A2C5A] hover:border-[#4A2C5A]'}`}
                          >
                             <div className="relative z-10 flex items-center justify-center gap-3">
                                <span className="font-bold text-lg">{visibleTable === branch.id ? 'إخفاء' : 'عرض'} التفاصيل</span>
                                <span className={`text-sm opacity-60 group-hover:opacity-100 transition-opacity`}>{translateBranchName(branch.name)}</span>
                             </div>
                          </button>
                       </div>
                  ))}
              </div>
              
              {uploadStatus && (
                  <div className={`mt-6 text-center p-4 rounded-xl font-medium ${uploadStatus.type === 'success' ? 'bg-teal-50 text-teal-800 border border-teal-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                      {uploadStatus.message}
                  </div>
              )}
              
               {branches.map(branch => (
                  visibleTable === branch.id && (
                      <div key={`table-${branch.id}`} className="mt-8 bg-white/60 backdrop-blur-xl p-4 sm:p-8 rounded-[2rem] shadow-2xl border border-white/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="mb-6 flex items-center justify-between flex-row-reverse">
                              <h4 className="text-lg sm:text-xl font-bold text-[#4A2C5A]">{translateBranchName(branch.name)}</h4>
                              <span className="text-xs font-bold text-[#4A2C5A]/40 uppercase tracking-widest">قائمة الشقق</span>
                          </div>
                          <ApartmentTable_ar apartments={branch.apartments} />
                      </div>
                  )
              ))}
            </FadeInUp>
        </Section>

        {/* LTV Section */}
        <Section title="القيمة الدائمة للمستأجرين الحاليين" className="bg-[#1e4248] rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-[#2A5B64] rounded-full blur-[120px] opacity-50 pointer-events-none"></div>
            <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-[#4A2C5A] rounded-full blur-[120px] opacity-40 pointer-events-none"></div>

            <FadeInUp>
              <div className="relative z-10 max-w-4xl mx-auto pt-8">
                 <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 sm:p-16 text-center shadow-2xl">
                    <p className="text-xs sm:text-sm font-bold text-[#F1ECE6]/50 uppercase tracking-[0.2em] mb-4 sm:mb-6">القيمة الإجمالية لجميع العقود</p>
                    <p className="text-5xl sm:text-7xl md:text-8xl font-bold text-white tracking-tighter drop-shadow-2xl">{formatCurrency(totalLifetimeValue)}</p>
                    <p className="text-lg sm:text-xl text-[#F1ECE6]/70 mt-6 sm:mt-8 max-w-xl mx-auto leading-relaxed font-light">القيمة الإجمالية لجميع عقود الإيجار الحالية، مما يعكس الدخل المستقبلي المضمون.</p>
                    
                    {/* Integrated Share Breakdown */}
                    <div className="mt-12 sm:mt-16 pt-10 sm:pt-12 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-8 sm:gap-16 relative">
                            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                            <div className="text-right pr-2 sm:pr-0">
                                <p className="text-xs font-bold text-[#F1ECE6]/40 uppercase tracking-widest mb-2">حصة المستثمر</p>
                                <p className="text-xl sm:text-2xl md:text-4xl font-bold text-[#A99484]">{formatCurrency(totalLifetimeValue * (1 - MATHWAA_SHARE_PERCENTAGE))}</p>
                            </div>
                            <div className="text-left pl-2 sm:pl-0">
                                <p className="text-xs font-bold text-[#F1ECE6]/40 uppercase tracking-widest mb-2">حصة مثوى</p>
                                <p className="text-xl sm:text-2xl md:text-4xl font-bold text-white">{formatCurrency(totalLifetimeValue * MATHWAA_SHARE_PERCENTAGE)}</p>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
            </FadeInUp>
        </Section>
        
        {/* Marketing Section */}
        <Section title="التسويق والتواصل" titleColor="text-[#4A2C5A]">
            <FadeInUp>
              <p className="text-center text-lg sm:text-xl text-[#4A2C5A]/70 mb-16 sm:mb-20 max-w-2xl mx-auto font-light leading-relaxed">نظرة عامة على جهودنا الاستراتيجية لجذب المستأجرين ذوي الجودة العالية والاحتفاظ بهم.</p>
            </FadeInUp>
            <FadeInUp>
              <BookingSourceChart_ar data={bookingSourceChartData} />
            </FadeInUp>
            <FadeInUp>
              <MarketingCampaigns_ar socialVideos={SOCIAL_MEDIA_VIDEOS_AR} />
            </FadeInUp>
        </Section>

        {/* Footer */}
        <footer className="relative text-center py-12 text-[#4A2C5A]/40 text-xs font-medium uppercase tracking-widest">
           <button 
            onClick={() => setIsModalOpen(true)}
            title="إضافة حجز جديد"
            aria-label="إضافة حجز جديد"
            className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white text-[#4A2C5A]/80 hover:bg-[#4A2C5A] hover:text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-500 hover:rotate-90 border border-[#4A2C5A]/5"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <button 
            onClick={handleUploadClick}
            title="تحميل جدول البيانات"
            aria-label="تحميل جدول البيانات"
            className="absolute bottom-6 right-24 w-12 h-12 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-500 hover:-translate-y-1 border border-red-100"
          >
            <UploadIcon className="w-5 h-5" />
          </button>

          &copy; {new Date().getFullYear()} مثوى لتشغيل الوحدات السكنيّة. تقرير خاص
        </footer>
      </main>
      <AddBookingModal_ar
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitBooking}
        branches={branches}
      />
    </div>
  );
};

export default App_ar;
