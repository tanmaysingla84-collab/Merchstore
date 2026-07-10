import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShoppingBag,
  Users,
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  fetchAnalyticsSummary,
  fetchRevenueAnalytics,
  fetchTopProductsAnalytics,
} from '../../features/admin/adminSlice';

const PERIOD_OPTIONS = [
  { label: 'Week', period: 'week', groupBy: 'day' },
  { label: 'Month', period: 'month', groupBy: 'day' },
  { label: 'Quarter', period: 'quarter', groupBy: 'week' },
  { label: 'Year', period: 'year', groupBy: 'month' },
];

const AdminAnalytics = () => {
  const dispatch = useDispatch();
  const { analytics, loading, error } = useSelector((state) => state.admin);
  const [activePeriod, setActivePeriod] = useState(PERIOD_OPTIONS[1]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAnalytics = useCallback(() => {
    dispatch(fetchAnalyticsSummary());
    dispatch(fetchRevenueAnalytics({
      period: activePeriod.period,
      groupBy: activePeriod.groupBy,
    }));
    dispatch(fetchTopProductsAnalytics());
    setLastUpdated(new Date());
  }, [dispatch, activePeriod]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    const interval = setInterval(loadAnalytics, 60000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  const summary = analytics.summary;
  const revenueData = analytics.revenue?.periods || [];
  const topProducts = analytics.topProducts || [];

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  const formatPeriodLabel = (period) => {
    if (!period) return '';
    if (period.includes('W')) return period.replace('W', ' Wk ');
    if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
      return new Date(period).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
    if (/^\d{4}-\d{2}$/.test(period)) {
      const [year, month] = period.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
    return period;
  };

  if (loading.analytics && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
        <span className="font-sans text-sm text-white/50 font-medium">Loading dashboard statistics...</span>
      </div>
    );
  }

  if (error.analytics && !summary) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-6 rounded-2xl text-center max-w-xl mx-auto mt-10">
        <h4 className="font-display font-bold text-base">Analytics Fetch Failure</h4>
        <p className="font-sans text-sm mt-1">{error.analytics}</p>
        <button onClick={loadAnalytics} className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-semibold transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const renderRevenueChart = () => {
    if (!revenueData || revenueData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-white/40 font-sans text-sm gap-2">
          <DollarSign className="w-8 h-8 text-white/20" />
          No revenue data for this period yet.
        </div>
      );
    }

    const width = 800;
    const height = 280;
    const padding = 50;

    const revenues = revenueData.map((d) => d.revenue);
    const maxRevenue = Math.max(...revenues, 1000) * 1.15;

    const getX = (index) => {
      if (revenueData.length <= 1) return width / 2;
      return padding + (index * (width - padding * 2)) / (revenueData.length - 1);
    };

    const getY = (value) =>
      height - padding - (value * (height - padding * 2)) / maxRevenue;

    let pathD = '';
    let areaD = '';

    revenueData.forEach((d, idx) => {
      const x = getX(idx);
      const y = getY(d.revenue);
      if (idx === 0) {
        pathD = `M ${x} ${y}`;
        areaD = `M ${x} ${height - padding} L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
        areaD += ` L ${x} ${y}`;
      }
      if (idx === revenueData.length - 1) {
        areaD += ` L ${x} ${height - padding} Z`;
      }
    });

    return (
      <div className="relative w-full overflow-x-auto scrollbar-thin">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9c2637" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const val = maxRevenue * ratio;
            const y = getY(val);
            return (
              <g key={idx} className="opacity-30">
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#ffffff"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  opacity="0.15"
                />
                <text
                  x={padding - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="font-sans text-[10px] fill-white/40 font-medium"
                >
                  {formatCurrency(val)}
                </text>
              </g>
            );
          })}

          {revenueData.map((d, idx) => {
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - 12}
                textAnchor="middle"
                className="font-sans text-[10px] fill-white/50 font-medium"
              >
                {formatPeriodLabel(d.period)}
              </text>
            );
          })}

          {revenueData.length > 0 && <path d={areaD} fill="url(#areaGrad)" />}
          {revenueData.length > 0 && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {revenueData.map((d, idx) => {
            const x = getX(idx);
            const y = getY(d.revenue);
            return (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  className="fill-[#d4af37] stroke-[#9c2637] stroke-[2]"
                />
                <title>{`${formatPeriodLabel(d.period)}: ${formatCurrency(d.revenue)} (${d.orderCount} orders)`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderTopProductsChart = () => {
    if (!topProducts || topProducts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-white/40 font-sans text-sm gap-2">
          <ShoppingBag className="w-8 h-8 text-white/20" />
          No sales data recorded yet.
        </div>
      );
    }

    const maxQty = Math.max(...topProducts.map((p) => p.totalQtySold), 1);

    return (
      <div className="space-y-5 pt-2">
        {topProducts.slice(0, 5).map((prod, idx) => {
          const percent = (prod.totalQtySold / maxQty) * 100;
          return (
            <div key={prod.productId || idx} className="space-y-2 font-sans">
              <div className="flex justify-between items-center text-xs gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-white/90 truncate">{prod.productName}</span>
                </div>
                <span className="font-medium text-white/50 flex-shrink-0">
                  <span className="text-[#d4af37] font-bold">{prod.totalQtySold}</span> sold
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#9c2637] to-[#d4af37] rounded-full transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-[10px] text-white/30">{formatCurrency(prod.totalRevenue)} revenue</p>
            </div>
          );
        })}
      </div>
    );
  };

  const getTrendIcon = (change) =>
    change > 0
      ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
      : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />;

  const getTrendBadgeClass = (change) =>
    change > 0
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

  const statCards = [
    {
      label: 'All-Time Revenue',
      value: summary ? formatCurrency(summary.revenue.allTime) : '₹0',
      icon: DollarSign,
      iconBg: 'bg-[#9c2637]/20 border-[#9c2637]/30 text-[#d4af37]',
      trend: summary?.revenue.monthlyChange,
      trendLabel: 'vs last month',
    },
    {
      label: 'Total Orders',
      value: summary ? summary.orders.total : '0',
      icon: ShoppingBag,
      iconBg: 'bg-[#d4af37]/10 border-[#d4af37]/20 text-[#d4af37]',
      trend: summary?.orders.monthlyChange,
      trendLabel: 'vs last month',
    },
    {
      label: 'Total Users',
      value: summary ? summary.users.total : '0',
      icon: Users,
      iconBg: 'bg-white/5 border-white/10 text-white/60',
      extra: summary ? `+${summary.users.newThisMonth} new this month` : null,
    },
    {
      label: 'Pending Actions',
      value: summary ? summary.orders.pending : '0',
      icon: Activity,
      iconBg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
      extra: summary ? `${summary.orders.pending} awaiting dispatch` : null,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/40 font-medium">
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading...'}
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading.analytics}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading.analytics ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[#12081a]/80 border border-white/5 p-5 rounded-2xl hover:border-[#d4af37]/20 transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{card.label}</span>
                  <h3 className="font-display font-extrabold text-2xl text-white leading-none">{card.value}</h3>
                </div>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              {card.trend !== undefined && (
                <div className="flex items-center gap-1.5 mt-4">
                  <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getTrendBadgeClass(card.trend)}`}>
                    {getTrendIcon(card.trend)}
                    <span>{Math.abs(card.trend)}%</span>
                  </div>
                  <span className="text-[10px] text-white/30 font-medium">{card.trendLabel}</span>
                </div>
              )}
              {card.extra && (
                <p className="text-[10px] text-white/40 font-medium mt-4">{card.extra}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#12081a]/80 border border-white/5 p-6 rounded-2xl lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h3 className="font-display font-bold text-base text-white">Revenue Performance</h3>
              <p className="font-sans text-xs text-white/40 mt-0.5">Gross sales from paid orders</p>
            </div>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setActivePeriod(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activePeriod.label === opt.label
                      ? 'bg-[#9c2637] text-white shadow-sm'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {loading.analytics ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
            </div>
          ) : (
            renderRevenueChart()
          )}
        </div>

        <div className="bg-[#12081a]/80 border border-white/5 p-6 rounded-2xl space-y-5 flex flex-col">
          <div>
            <h3 className="font-display font-bold text-base text-white">Top 5 Products</h3>
            <p className="font-sans text-xs text-white/40 mt-0.5">Best sellers by volume (all-time)</p>
          </div>
          <div className="flex-1">
            {loading.analytics ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 text-[#d4af37] animate-spin" />
              </div>
            ) : (
              renderTopProductsChart()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
