
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Download, Filter, ArrowLeft } from 'lucide-react';

interface PricingUnit {
  unit: string;
  type: string;
  villa: string;
  oldPrice: number;
  newPrice: number;
  change: number;
  percentChange: number;
  reason: string;
  reasonCategory: 'Studios got a deep price cut' | 'Villa 1 got a small discount' | 'The 2-bedroom needs a deeper discount' | 'No price change';
}

const PRICING_DATA: PricingUnit[] = [
  { 
    unit: '51-101', type: 'Studio', villa: 'Villa 1', oldPrice: 6329, newPrice: 4500, change: -1829, percentChange: -28.9, 
    reason: 'Studios have been sitting empty for 4 months. We are cutting the price significantly so they actually start renting out.',
    reasonCategory: 'Studios got a deep price cut'
  },
  { 
    unit: '51-102', type: 'Studio', villa: 'Villa 1', oldPrice: 6329, newPrice: 4500, change: -1829, percentChange: -28.9, 
    reason: 'Studios have been sitting empty for 4 months. We are cutting the price significantly so they actually start renting out.',
    reasonCategory: 'Studios got a deep price cut'
  },
  { 
    unit: '51-202', type: 'Studio', villa: 'Villa 2', oldPrice: 6329, newPrice: 4500, change: -1829, percentChange: -28.9, 
    reason: 'Studios have been sitting empty for 4 months. We are cutting the price significantly so they actually start renting out.',
    reasonCategory: 'Studios got a deep price cut'
  },
  { 
    unit: '51-111', type: 'External Master', villa: 'Villa 1', oldPrice: 3520, newPrice: 3344, change: -176, percentChange: -5.0, 
    reason: 'Villa 1 only opened 3 months ago and is still only 10% full. A small discount helps us fill it faster.',
    reasonCategory: 'Villa 1 got a small discount'
  },
  { 
    unit: '51-112', type: 'Master', villa: 'Villa 1', oldPrice: 4100, newPrice: 3895, change: -205, percentChange: -5.0, 
    reason: 'Villa 1 only opened 3 months ago and is still only 10% full. A small discount helps us fill it faster.',
    reasonCategory: 'Villa 1 got a small discount'
  },
  { 
    unit: '51-121', type: 'Master', villa: 'Villa 1', oldPrice: 4100, newPrice: 3895, change: -205, percentChange: -5.0, 
    reason: 'Villa 1 only opened 3 months ago and is still only 10% full. A small discount helps us fill it faster.',
    reasonCategory: 'Villa 1 got a small discount'
  },
  { 
    unit: '51-113', type: 'Single Bedroom', villa: 'Villa 1', oldPrice: 3520, newPrice: 3344, change: -176, percentChange: -5.0, 
    reason: 'Villa 1 only opened 3 months ago and is still only 10% full. A small discount helps us fill it faster.',
    reasonCategory: 'Villa 1 got a small discount'
  },
  { 
    unit: '51-114', type: 'Single Bedroom', villa: 'Villa 1', oldPrice: 3520, newPrice: 3344, change: -176, percentChange: -5.0, 
    reason: 'Villa 1 only opened 3 months ago and is still only 10% full. A small discount helps us fill it faster.',
    reasonCategory: 'Villa 1 got a small discount'
  },
  { 
    unit: '51-122', type: 'Single Bedroom', villa: 'Villa 1', oldPrice: 3520, newPrice: 3344, change: -176, percentChange: -5.0, 
    reason: 'Villa 1 only opened 3 months ago and is still only 10% full. A small discount helps us fill it faster.',
    reasonCategory: 'Villa 1 got a small discount'
  },
  { 
    unit: '51-123', type: 'Single Bedroom', villa: 'Villa 1', oldPrice: 3520, newPrice: 3344, change: -176, percentChange: -5.0, 
    reason: 'Villa 1 only opened 3 months ago and is still only 10% full. A small discount helps us fill it faster.',
    reasonCategory: 'Villa 1 got a small discount'
  },
  { 
    unit: '51-130', type: '2 Bedroom', villa: 'Villa 1', oldPrice: 9492, newPrice: 7500, change: -1992, percentChange: -21.0, 
    reason: 'The 2-bedroom needs a deeper discount. The previous sale of the other 2-bedroom at SR 8,500 was a special deal with a loyal returning customer, not a normal market price. With current regional tensions reducing demand from executives, we need to price lower to attract new tenants.',
    reasonCategory: 'The 2-bedroom needs a deeper discount'
  },
  { 
    unit: '51-214', type: 'Single Bedroom', villa: 'Villa 2', oldPrice: 3520, newPrice: 3520, change: 0, percentChange: 0, 
    reason: 'Villa 2 single bedrooms are renting at full price (5 of 6 already rented). No reason to lower the price.',
    reasonCategory: 'No price change'
  },
];

const COLORS = {
  primary: '#0F8B8C',
  deepAccent: '#075F60',
  studio: '#F4B6B6',
  villa1: '#FCD9A8',
  match: '#FFE699',
  hold: '#D9EAD3',
  info: '#CFE2F3',
  grey: '#F2F2F2',
  darkGrey: '#595959'
};

const CATEGORY_COLORS = {
  'Studios got a deep price cut': COLORS.studio,
  'Villa 1 got a small discount': COLORS.villa1,
  'The 2-bedroom needs a deeper discount': COLORS.match,
  'No price change': COLORS.hold
};

interface PricingDashboardProps {
  onBack?: () => void;
  language?: 'en' | 'ar';
}

const PricingDashboard: React.FC<PricingDashboardProps> = ({ onBack, language: initialLanguage = 'en' }) => {
  const [language, setLanguage] = useState<'en' | 'ar'>(initialLanguage);
  const [villaFilter, setVillaFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof PricingUnit, direction: 'asc' | 'desc' } | null>(null);
  const [isPullBackExpanded, setIsPullBackExpanded] = useState(false);

  const isAr = language === 'ar';

  const t = {
    title: isAr ? 'تعديل أسعار نرجس M51' : 'Narjis M51 Pricing Revision',
    subtitle: isAr ? 'فعال اعتباراً من 11 مايو 2026 | نافذة مراجعة لمدة 60 ليلة حتى 11 يوليو 2026 | 12 وحدة شاغرة' : 'Effective May 11, 2026 | 60-night review window through July 11, 2026 | 12 vacant units',
    export: isAr ? 'تصدير CSV' : 'Export CSV',
    back: isAr ? 'رجوع' : 'Back',
    vacantUnits: isAr ? 'الوحدات الشاغرة المعاد تسعيرها' : 'Vacant Units Repriced',
    oldTotal: isAr ? 'إجمالي الشهر القديم (T1)' : 'Old Monthly Total (T1)',
    newTotal: isAr ? 'إجمالي الشهر الجديد' : 'New Monthly Total',
    avgDiscount: isAr ? 'متوسط الخصم' : 'Average Discount',
    discountFooter: isAr ? 'تم خصم 11 من أصل 12 وحدة، وتم الإبقاء على وحدة واحدة عند T1' : '11 of 12 units discounted, 1 held at T1',
    insight: isAr ? 'هذه الوحدات الـ 12 كانت شاغرة. الوحدات الشاغرة لا تدر علينا أي دخل. الأسعار المنخفضة الجديدة مصممة بالفعل لتأجيرها. إذا تم ملء جميع الوحدات الـ 12 بالأسعار الجديدة، فسنربح 49,030 ريال سعودي شهرياً. هذا هو الفوز الحقيقي. تكلفة خصم 8,769 ريال سعودي التي تراها في الأرقام أعلاه لا تهم إلا إذا كانت هذه الوحدات مستأجرة بالفعل بالأسعار المرتفعة القديمة. لم تكن كذلك. لذا نحن لا نخسر 8,769 ريال سعودي. نحن نكسب 49,030 ريال سعودي.' : 'These 12 units have been sitting empty. Empty units earn us nothing. The new lower prices are designed to actually get them rented out. If all 12 fill up at the new prices, we earn SR 49,030 per month. That is the real win. The SR 8,769 discount cost you see in the numbers above only matters if these units were already rented at the old higher prices. They were not. So we are not losing SR 8,769. We are gaining SR 49,030.',
    chartAdjust: isAr ? 'تعديل السعر حسب الوحدة (ريال)' : 'Price Adjustment by Unit (SR)',
    chartBreakdown: isAr ? 'تفصيل حسب فئة السبب' : 'Breakdown by Reason Category',
    oldPrice: isAr ? 'السعر القديم' : 'Old Price',
    newPrice: isAr ? 'السعر الجديد' : 'New Price',
    searchUnit: isAr ? 'البحث عن وحدة' : 'Search Unit',
    villaFilter: isAr ? 'تصفية الفلل' : 'Villa Filter',
    typeFilter: isAr ? 'تصفية النوع' : 'Type Filter',
    reasonFilter: isAr ? 'تصفية السبب' : 'Reason Filter',
    reset: isAr ? 'إعادة تعيين الفلاتر' : 'Reset Filters',
    showing: (x: number, y: number) => isAr ? `عرض ${x} من أصل ${y} وحدة` : `Showing ${x} of ${y} units`,
    unit: isAr ? 'الوحدة' : 'Unit',
    type: isAr ? 'النوع' : 'Type',
    villa: isAr ? 'الفيلا' : 'Villa',
    change: isAr ? 'التغيير' : 'Change',
    percent: isAr ? '%' : '%',
    reason: isAr ? 'السبب' : 'Reason',
    triggersTitle: isAr ? 'محفزات التراجع (متى يتم تخفيف الخصومات)' : 'Pull-back Triggers (When to ease back discounts)',
    studios: isAr ? 'استوديوهات' : 'Studios',
    villa1Incentive: isAr ? 'حافز إطلاق فيلا 1' : 'Villa 1 launch incentive',
    branchWide: isAr ? 'على مستوى الفرع' : 'Branch-wide',
    triggers: {
      studios: isAr ? 'إذا تم ملء أي استوديو واحد في غضون 14 يوماً بسعر 4,500 ريال سعودي، فاختبر الاستوديو الشاغر التالي بسعر 4,800 ريال سعودي. إذا تم ملء ثلاثة استوديوهات في غضون 30 يوماً، فسيتم الإبقاء على السعر الجديد.' : 'If any single studio fills within 14 days at SR 4,500, test the next vacant studio at SR 4,800. If three studios fill within 30 days, the new floor holds.',
      villa1: isAr ? 'إذا تم ملء 4 من أصل 5 غرف نوم فردية شاغرة في غضون 30 يوماً، فهذا يعني أن الخصم نجح. سنعود إلى T1 في الشواغر المتبقية.' : 'If 4 of 5 vacant single bedrooms fill within 30 days, the discount worked. We pull back to T1 on remaining vacancies.',
      branch: isAr ? 'إذا تجاوز إجمالي إشغال فرع نرجس 80 بالمائة لمدة 30 يوماً متتالية، فسترتفع جميع الخصومات تدريجياً نحو مستويات T2.' : 'If total Narjis branch occupancy crosses 80 percent for 30 consecutive days, all discounts lift back toward T2 levels gradually.'
    },
    footer: isAr ? 'تم الإعداد بواسطة عمار | لاجتماع مراجعة الأسعار في 14 مايو 2026' : 'Prepared by Ammar | For pricing review meeting May 14, 2026',
    all: isAr ? 'الكل' : 'All',
    studio: isAr ? 'استوديو' : 'Studio',
    master: isAr ? 'ماستر' : 'Master',
    extMaster: isAr ? 'ماستر خارجي' : 'External Master',
    singleBR: isAr ? 'غرفة نوم واحدة' : 'Single Bedroom',
    twoBR: isAr ? 'غرفتي نوم' : '2 Bedroom',
    villa1: isAr ? 'فيلا 1' : 'Villa 1',
    villa2: isAr ? 'فيلا 2' : 'Villa 2',
  };

  const translateCategory = (cat: string) => {
    if (!isAr) return cat;
    switch (cat) {
      case 'Studios got a deep price cut': return 'حصلت الاستوديوهات على خفض كبير في الأسعار';
      case 'Villa 1 got a small discount': return 'حصلت فيلا 1 على خصم صغير';
      case 'The 2-bedroom needs a deeper discount': return 'تحتاج غرفتي النوم إلى خصم أكبر';
      case 'No price change': return 'لا يوجد تغيير في السعر';
      default: return cat;
    }
  };

  const translateType = (type: string) => {
    if (!isAr) return type;
    switch (type) {
      case 'Studio': return t.studio;
      case 'Master': return t.master;
      case 'External Master': return t.extMaster;
      case 'Single Bedroom': return t.singleBR;
      case '2 Bedroom': return t.twoBR;
      default: return type;
    }
  };

  const translateVilla = (v: string) => {
    if (!isAr) return v;
    switch (v) {
      case 'Villa 1': return t.villa1;
      case 'Villa 2': return t.villa2;
      default: return v;
    }
  };

  const translateReason = (reason: string) => {
    if (!isAr) return reason;
    const lower = reason.toLowerCase();
    if (lower.includes('studios') && lower.includes('sitting empty')) {
      return 'الاستوديوهات شاغرة منذ 4 أشهر. نحن نخفض السعر بشكل كبير حتى يبدأ تأجيرها بالفعل.';
    }
    if (lower.includes('villa 1') && lower.includes('opened 3 months ago')) {
      return 'افتتحت فيلا 1 منذ 3 أشهر فقط ولا تزال نسبة الإشغال فيها 10% فقط. يساعدنا الخصم الصغير في ملئها بشكل أسرع.';
    }
    if (lower.includes('2-bedroom') && lower.includes('deeper discount')) {
      return 'تحتاج غرفتي النوم إلى خصم أكبر. كان البيع السابق لغرفتي النوم الأخرى بسعر 8500 ريال سعودي صفقة خاصة مع عميل مخلص، وليس سعر السوق العادي. مع التوترات الإقليمية الحالية التي تقلل الطلب من التنفيذيين، نحتاج إلى تسعير أقل لجذب مستأجرين جدد.';
    }
    if (lower.includes('villa 2') && lower.includes('renting at full price')) {
      return 'يتم تأجير غرف النوم المنفردة في فيلا 2 بالسعر الكامل (5 من أصل 6 مؤجرة بالفعل). لا يوجد سبب لخفض السعر.';
    }
    return reason;
  };

  const villas = useMemo(() => ['All', ...Array.from(new Set(PRICING_DATA.map(d => d.villa)))], []);
  const types = useMemo(() => ['All', ...Array.from(new Set(PRICING_DATA.map(d => d.type)))], []);
  const categories = useMemo(() => ['All', ...Array.from(new Set(PRICING_DATA.map(d => d.reasonCategory)))], []);

  const filteredData = useMemo(() => {
    let data = PRICING_DATA.filter(item => {
      const villaMatch = villaFilter === 'All' || item.villa === villaFilter;
      const typeMatch = typeFilter === 'All' || item.type === typeFilter;
      const reasonMatch = reasonFilter === 'All' || item.reasonCategory === reasonFilter;
      const searchMatch = item.unit.toLowerCase().includes(searchTerm.toLowerCase());
      return villaMatch && typeMatch && reasonMatch && searchMatch;
    });

    if (sortConfig) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [villaFilter, typeFilter, reasonFilter, searchTerm, sortConfig]);

  const stats = useMemo(() => {
    const oldTotalValue = PRICING_DATA.reduce((sum, d) => sum + d.oldPrice, 0);
    const newTotalValue = PRICING_DATA.reduce((sum, d) => sum + d.newPrice, 0);
    const avgDiscountValue = ((oldTotalValue - newTotalValue) / oldTotalValue) * 100;
    return {
      vacantCount: PRICING_DATA.length,
      oldTotal: oldTotalValue,
      newTotal: newTotalValue,
      avgDiscount: avgDiscountValue
    };
  }, []);

  const chartData = useMemo(() => {
    return [...PRICING_DATA]
      .sort((a, b) => a.percentChange - b.percentChange)
      .map(item => ({
        unit: item.unit,
        [t.oldPrice]: item.oldPrice,
        [t.newPrice]: item.newPrice
      }));
  }, [t.oldPrice, t.newPrice]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    PRICING_DATA.forEach(d => {
      counts[d.reasonCategory] = (counts[d.reasonCategory] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name: translateCategory(name), 
      value,
      originalName: name,
      fill: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] || '#ccc'
    }));
  }, [language]);

  const requestSort = (key: keyof PricingUnit) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    const headers = [t.unit, t.type, t.villa, `${t.oldPrice} (SR)`, `${t.newPrice} (SR)`, `${t.change} (SR)`, `${t.percent}`, t.reason];
    const rows = filteredData.map(d => [
      d.unit, translateType(d.type), translateVilla(d.villa), d.oldPrice, d.newPrice, d.change, d.percentChange + '%', d.reason
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Narjis_M51_Pricing_Revision_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen bg-white text-black font-sans pb-20 ${isAr ? 'font-cairo' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Bar */}
      <header className="bg-[#0F8B8C] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start">
            <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
              {onBack && (
                <button 
                  onClick={onBack}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className={`w-6 h-6 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              )}
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.title}</h1>
            </div>
            <p className="text-sm opacity-90 mt-1">
              {t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setLanguage(isAr ? 'en' : 'ar')}
              className="px-4 py-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20"
             >
                {isAr ? 'English' : 'العربية'}
             </button>
             <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all border border-white/20 text-sm font-medium"
             >
                <Download className="w-4 h-4" />
                {t.export}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard label={t.vacantUnits} value={stats.vacantCount.toString()} isAr={isAr} />
          <KpiCard label={t.oldTotal} value={`SR ${stats.oldTotal.toLocaleString()}`} isAr={isAr} />
          <KpiCard label={t.newTotal} value={`SR ${stats.newTotal.toLocaleString()}`} isAr={isAr} />
          <KpiCard 
            label={t.avgDiscount} 
            value={`${stats.avgDiscount.toFixed(1)}%`} 
            footer={t.discountFooter}
            isAr={isAr}
          />
        </div>

        {/* Insight Banner */}
        <div className="bg-[#CFE2F3] p-6 rounded-lg border border-[#0F8B8C]/20 shadow-sm">
           <p className="text-center font-medium leading-relaxed">
             {t.insight.split(isAr ? '49,030' : 'SR 49,030').map((part, i, arr) => (
               <React.Fragment key={i}>
                 {part}
                 {i < arr.length - 1 && <span className="text-[#075F60] font-bold text-lg">{isAr ? '49,030' : 'SR 49,030'}</span>}
               </React.Fragment>
             ))}
           </p>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[450px]">
            <h3 className="text-lg font-bold mb-6 text-[#075F60]">{t.chartAdjust}</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: isAr ? 20 : 20, left: isAr ? 20 : 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" reversed={isAr} hide />
                <YAxis 
                  dataKey="unit" 
                  type="category" 
                  orientation={isAr ? 'right' : 'left'} 
                  width={60}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#333' }}
                />
                <Tooltip 
                  formatter={(value: any) => `SR ${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey={t.oldPrice} fill="#cccccc" radius={isAr ? [4, 0, 0, 4] : [0, 4, 4, 0]} />
                <Bar dataKey={t.newPrice} fill="#0F8B8C" radius={isAr ? [4, 0, 0, 4] : [0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[450px]">
            <h3 className="text-lg font-bold text-[#075F60]">{t.chartBreakdown}</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              {isAr ? 'كيف تتقسم الوحدات الـ 12 حسب ما فعلناه بأسعارها.' : 'How the 12 units break down by what we did to their prices.'}
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  onClick={(data) => setReasonFilter(data.originalName)}
                  cursor="pointer"
                  label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill} 
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table Filters */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <div className="space-y-1 w-full md:w-auto">
                <label className="text-xs font-bold text-gray-500 uppercase">{t.searchUnit}</label>
                <input 
                  type="text"
                  placeholder={isAr ? 'مثال: 51-101' : 'e.g. 51-101'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F8B8C] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t.villaFilter}</label>
                <div className="relative">
                  <select 
                    value={villaFilter}
                    onChange={(e) => setVillaFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-[#0F8B8C] outline-none min-w-[150px]"
                  >
                    {villas.map(v => <option key={v} value={v}>{v === 'All' ? t.all : translateVilla(v)}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t.typeFilter}</label>
                <div className="relative">
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-[#0F8B8C] outline-none min-w-[150px]"
                  >
                    {types.map(t_val => <option key={t_val} value={t_val}>{t_val === 'All' ? t.all : translateType(t_val)}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t.reasonFilter}</label>
                <div className="relative">
                  <select 
                    value={reasonFilter}
                    onChange={(e) => setReasonFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-[#0F8B8C] outline-none min-w-[200px]"
                  >
                    {categories.map(c => <option key={c} value={c}>{c === 'All' ? t.all : translateCategory(c)}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className={`flex flex-col items-end gap-2 ${isAr ? 'items-start' : 'items-end'}`}>
              <button 
                onClick={() => { setVillaFilter('All'); setTypeFilter('All'); setReasonFilter('All'); setSearchTerm(''); }}
                className="text-xs font-bold text-[#0F8B8C] hover:underline"
              >
                {t.reset}
              </button>
              <div className="text-sm font-medium text-[#595959]">
                {t.showing(filteredData.length, PRICING_DATA.length)}
              </div>
            </div>
          </div>
        </div>

        {/* Main Data Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse" dir={isAr ? 'rtl' : 'ltr'}>
              <thead className="sticky top-0 bg-[#075F60] text-white z-10">
                <tr>
                  <SortableTh label={t.unit} k="unit" sortConfig={sortConfig} onSort={requestSort} isAr={isAr} />
                  <SortableTh label={t.type} k="type" sortConfig={sortConfig} onSort={requestSort} isAr={isAr} />
                  <SortableTh label={t.villa} k="villa" sortConfig={sortConfig} onSort={requestSort} isAr={isAr} />
                  <SortableTh label={t.oldPrice} k="oldPrice" sortConfig={sortConfig} onSort={requestSort} isAr={isAr} />
                  <SortableTh label={t.newPrice} k="newPrice" sortConfig={sortConfig} onSort={requestSort} isAr={isAr} />
                  <SortableTh label={t.change} k="change" sortConfig={sortConfig} onSort={requestSort} isAr={isAr} />
                  <SortableTh label={t.percent} k="percentChange" sortConfig={sortConfig} onSort={requestSort} isAr={isAr} />
                  <th className={`px-6 py-4 text-sm font-bold uppercase tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>{t.reason}</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr 
                    key={row.unit} 
                    className="hover:brightness-95 transition-all text-sm"
                    style={{ backgroundColor: idx % 2 === 0 ? CATEGORY_COLORS[row.reasonCategory] : `${CATEGORY_COLORS[row.reasonCategory]}dd` }}
                  >
                    <td className="px-6 py-4 font-bold border-b border-black/5">{row.unit}</td>
                    <td className="px-6 py-4 border-b border-black/5">{translateType(row.type)}</td>
                    <td className="px-6 py-4 border-b border-black/5">{translateVilla(row.villa)}</td>
                    <td className="px-6 py-4 border-b border-black/5">SR {row.oldPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 border-b border-black/5 font-bold">SR {row.newPrice.toLocaleString()}</td>
                    <td className={`px-6 py-4 border-b border-black/5 ${row.change < 0 ? 'text-red-700 font-bold' : ''}`}>
                      {row.change !== 0 ? `SR ${row.change.toLocaleString()}` : '-'}
                    </td>
                    <td className={`px-6 py-4 border-b border-black/5 ${row.percentChange < 0 ? 'text-red-700 font-bold' : ''}`}>
                      {row.percentChange !== 0 ? `${row.percentChange}%` : '0%'}
                    </td>
                    <td className={`px-6 py-4 text-xs leading-relaxed border-b border-black/5 max-w-xs ${isAr ? 'text-right' : 'text-left'}`}>
                      {translateReason(row.reason)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                <tr>
                  <td colSpan={4} className={`px-6 py-4 text-right`}>{isAr ? 'إجمالي الشهر الجديد:' : 'New monthly total:'}</td>
                  <td className="px-6 py-4 text-[#0F8B8C]">SR {stats.newTotal.toLocaleString()}</td>
                  <td className="px-6 py-4 text-red-700">-SR {(stats.oldTotal - stats.newTotal).toLocaleString()}</td>
                  <td className="px-6 py-4 text-red-700">-{stats.avgDiscount.toFixed(1)}%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Pull-back Triggers Section */}
        <div className="bg-white border-2 border-[#0F8B8C] rounded-xl overflow-hidden">
          <button 
            onClick={() => setIsPullBackExpanded(!isPullBackExpanded)}
            className="w-full flex items-center justify-between p-6 bg-[#0F8B8C] text-white font-bold text-lg"
          >
            <span>{t.triggersTitle}</span>
            {isPullBackExpanded ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          <AnimatePresence>
            {isPullBackExpanded && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-[#075F60] border-b pb-2">{t.studios}</h4>
                    <p className="text-sm leading-relaxed text-gray-700">
                      {t.triggers.studios.split('SR 4,500').map((p, i, a) => (
                        <React.Fragment key={i}>
                          {p}{i < a.length - 1 && <span className="font-bold">SR 4,500</span>}
                        </React.Fragment>
                      )).flatMap((el, i, arr) => {
                        if (typeof el === 'string') {
                           return el.split('SR 4,800').map((p2, i2, a2) => (
                             <React.Fragment key={`${i}-${i2}`}>
                               {p2}{i2 < a2.length - 1 && <span className="font-bold">SR 4,800</span>}
                             </React.Fragment>
                           ));
                        }
                        return el;
                      })}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-[#075F60] border-b pb-2">{t.villa1Incentive}</h4>
                    <p className="text-sm leading-relaxed text-gray-700">
                      {t.triggers.villa1}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-[#075F60] border-b pb-2">{t.branchWide}</h4>
                    <p className="text-sm leading-relaxed text-gray-700">
                      {t.triggers.branch}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-gray-200">
          <p className="text-gray-500 font-medium">{t.footer}</p>
        </footer>

      </main>
    </div>
  );
};

const KpiCard: React.FC<{ label: string, value: string, footer?: string, isAr?: boolean }> = ({ label, value, footer, isAr }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-[#0F8B8C] transition-colors ${isAr ? 'text-right' : 'text-left'}`}>
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-bold text-[#0F8B8C]">{value}</p>
    </div>
    {footer && <p className="text-xs text-gray-400 mt-4 font-medium italic">{footer}</p>}
  </div>
);

const SortableTh: React.FC<{ 
  label: string, 
  k: keyof PricingUnit, 
  sortConfig: { key: keyof PricingUnit, direction: 'asc' | 'desc' } | null,
  onSort: (key: keyof PricingUnit) => void,
  isAr?: boolean
}> = ({ label, k, sortConfig, onSort, isAr }) => (
  <th 
    className="px-6 py-4 text-sm font-bold uppercase tracking-wider cursor-pointer hover:bg-[#0F8B8C] transition-colors"
    onClick={() => onSort(k)}
  >
    <div className={`flex items-center gap-1 ${isAr ? 'flex-row-reverse' : ''}`}>
      {label}
      {sortConfig?.key === k && (
        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      )}
    </div>
  </th>
);

export default PricingDashboard;
