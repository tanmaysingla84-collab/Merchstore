import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Activity, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { 
  fetchAnalyticsSummary, 
  fetchRevenueAnalytics, 
  fetchTopProductsAnalytics 
} from '../../features/admin/adminSlice';

const AdminAnalytics = () => {
  const dispatch = useDispatch();
  const { analytics, loading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAnalyticsSummary());
    dispatch(fetchRevenueAnalytics());
    dispatch(fetchTopProductsAnalytics());
  }, [dispatch]);

  const summary = analytics.summary;
  const revenueData = analytics.revenue?.periods || [];
  const topProducts = analytics.topProducts || [];

  if (loading.analytics && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-10 h-10 text-brand-maroon-700 animate-spin" />
        <span className="font-sans text-sm text-brand-dark-500 font-medium">Crunching dashboard statistics...</span>
      </div>
    );
  }

  if (error.analytics) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center max-w-xl mx-auto mt-10">
        <h4 className="font-display font-bold text-base">Analytics Fetch Failure</h4>
        <p className="font-sans text-sm mt-1">{error.analytics}</p>
      </div>
    );
  }

  // Format currency helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper to generate SVG coordinates for Area Chart
  const renderRevenueChart = () => {
    if (!revenueData || revenueData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-brand-dark-400 font-sans text-sm">
          No historical revenue data recorded yet.
        </div>
      );
    }

    const width = 800;
    const height = 280;
    const padding = 45;

    const revenues = revenueData.map(d => d.revenue);
    const maxRevenue = Math.max(...revenues, 1000) * 1.1; // Add 10% padding on top

    const getX = (index) => {
      if (revenueData.length <= 1) return width / 2;
      return padding + (index * (width - padding * 2)) / (revenueData.length - 1);
    };

    const getY = (value) => {
      return height - padding - (value * (height - padding * 2)) / maxRevenue;
    };

    // Build the SVG path string
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
              <stop offset="0%" stopColor="#8A173A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8A173A" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const val = maxRevenue * ratio;
            const y = getY(val);
            return (
              <g key={idx} className="opacity-40">
                <line 
                  x1={padding} 
                  y1={y} 
                  x2={width - padding} 
                  y2={y} 
                  stroke="#E2E8F0" 
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text 
                  x={padding - 8} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="font-sans text-[10px] fill-brand-dark-400 font-bold"
                >
                  {formatCurrency(val)}
                </text>
              </g>
            );
          })}

          {/* X Axis labels */}
          {revenueData.map((d, idx) => {
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - 15}
                textAnchor="middle"
                className="font-sans text-[10px] fill-brand-dark-500 font-semibold"
              >
                {d._id}
              </text>
            );
          })}

          {/* Area under the line */}
          {revenueData.length > 0 && (
            <path d={areaD} fill="url(#areaGrad)" />
          )}

          {/* Line Path */}
          {revenueData.length > 0 && (
            <path 
              d={pathD} 
              fill="none" 
              stroke="#8A173A" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Data points */}
          {revenueData.map((d, idx) => {
            const x = getX(idx);
            const y = getY(d.revenue);
            return (
              <g key={idx} className="group cursor-pointer">
                <circle 
                  cx={x} 
                  cy={y} 
                  r="5" 
                  className="fill-brand-gold-500 stroke-brand-maroon-700 stroke-[2.5] hover:r-7 transition-all duration-150" 
                />
                <circle 
                  cx={x} 
                  cy={y} 
                  r="14" 
                  className="fill-transparent hover:fill-brand-maroon-700/5 transition-colors" 
                />
                {/* Floating tooltip inline on hover */}
                <title>{`${d._id}: ${formatCurrency(d.revenue)} (${d.orderCount} orders)`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Helper to render Horizontal Top Products Chart
  const renderTopProductsChart = () => {
    if (!topProducts || topProducts.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-brand-dark-400 font-sans text-sm">
          No sales logs recorded yet.
        </div>
      );
    }

    const maxQty = Math.max(...topProducts.map(p => p.totalQty), 1);

    return (
      <div className="space-y-4 pt-2">
        {topProducts.slice(0, 5).map((prod, idx) => {
          const percent = (prod.totalQty / maxQty) * 100;
          return (
            <div key={idx} className="space-y-1.5 font-sans">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-brand-dark-800 truncate max-w-[200px]">{prod.name}</span>
                <span className="font-semibold text-brand-dark-500">
                  <span className="text-brand-maroon-700 font-bold">{prod.totalQty}</span> sold ({formatCurrency(prod.totalRevenue)})
                </span>
              </div>
              <div className="w-full h-3 bg-brand-dark-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-maroon-700 to-brand-gold-500 rounded-full transition-all duration-500" 
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getTrendIcon = (change) => {
    if (change > 0) return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />;
    return <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />;
  };

  const getTrendBadgeClass = (change) => {
    if (change > 0) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Revenue */}
        <div className="bg-white border border-brand-dark-100 p-6 rounded-2xl shadow-premium relative overflow-hidden group hover:border-brand-maroon-300 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-400">All-Time Revenue</span>
              <h3 className="font-display font-extrabold text-2xl text-brand-dark-900 leading-none">
                {summary ? formatCurrency(summary.revenue.allTime) : '₹0'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-maroon-50 border border-brand-maroon-100 flex items-center justify-center text-brand-maroon-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          {summary && (
            <div className="flex items-center gap-1.5 mt-5">
              <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getTrendBadgeClass(summary.revenue.monthlyChange)}`}>
                {getTrendIcon(summary.revenue.monthlyChange)}
                <span>{Math.abs(summary.revenue.monthlyChange)}%</span>
              </div>
              <span className="text-[10px] font-sans text-brand-dark-400 font-medium">vs last month</span>
            </div>
          )}
        </div>

        {/* Card 2: Orders */}
        <div className="bg-white border border-brand-dark-100 p-6 rounded-2xl shadow-premium relative overflow-hidden group hover:border-brand-maroon-300 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-400">Total Orders</span>
              <h3 className="font-display font-extrabold text-2xl text-brand-dark-900 leading-none">
                {summary ? summary.orders.total : '0'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-gold-50 border border-brand-gold-100 flex items-center justify-center text-brand-gold-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          {summary && (
            <div className="flex items-center gap-1.5 mt-5">
              <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getTrendBadgeClass(summary.orders.monthlyChange)}`}>
                {getTrendIcon(summary.orders.monthlyChange)}
                <span>{Math.abs(summary.orders.monthlyChange)}%</span>
              </div>
              <span className="text-[10px] font-sans text-brand-dark-400 font-medium">vs last month</span>
            </div>
          )}
        </div>

        {/* Card 3: Users */}
        <div className="bg-white border border-brand-dark-100 p-6 rounded-2xl shadow-premium relative overflow-hidden group hover:border-brand-maroon-300 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-400">Total Users</span>
              <h3 className="font-display font-extrabold text-2xl text-brand-dark-900 leading-none">
                {summary ? summary.users.total : '0'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          {summary && (
            <div className="flex items-center gap-1.5 mt-5">
              <span className="text-[10px] font-sans text-brand-dark-500 font-bold uppercase tracking-wider">
                +{summary.users.newThisMonth} new
              </span>
              <span className="text-[10px] font-sans text-brand-dark-400 font-medium">joined this month</span>
            </div>
          )}
        </div>

        {/* Card 4: Pending / Active */}
        <div className="bg-white border border-brand-dark-100 p-6 rounded-2xl shadow-premium relative overflow-hidden group hover:border-brand-maroon-300 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-400">Pending Actions</span>
              <h3 className="font-display font-extrabold text-2xl text-brand-dark-900 leading-none">
                {summary ? summary.orders.pending : '0'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          {summary && (
            <div className="flex items-center gap-1.5 mt-5">
              <span className="text-[10px] font-sans text-orange-600 font-bold uppercase tracking-wider">
                {summary.orders.pending} Orders
              </span>
              <span className="text-[10px] font-sans text-brand-dark-400 font-medium">awaiting packing/dispatch</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="bg-white border border-brand-dark-100 p-6 rounded-2xl shadow-premium lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-brand-dark-900">Revenue Performance</h3>
              <p className="font-sans text-xs text-brand-dark-400">Monthly gross sales trends across semesters</p>
            </div>
            <div className="flex items-center gap-1 bg-brand-dark-50 p-1 rounded-xl border border-brand-dark-100">
              <button className="px-3 py-1.5 bg-white shadow-sm border border-brand-dark-100 rounded-lg text-xs font-bold text-brand-maroon-700">
                Monthly
              </button>
            </div>
          </div>
          <div className="pt-2">
            {renderRevenueChart()}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white border border-brand-dark-100 p-6 rounded-2xl shadow-premium space-y-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-brand-dark-900 font-display">Top 5 Products</h3>
            <p className="font-sans text-xs text-brand-dark-400">Best performing merchandise by volume</p>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {renderTopProductsChart()}
          </div>
          <div className="border-t border-brand-dark-100 pt-4 mt-4 text-center">
            <span className="text-xs font-sans text-brand-dark-400 font-medium">
              Data aggregates updated in real-time
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
