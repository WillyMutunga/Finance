import React, { useState, useEffect } from 'react';
import { UserRole, DashboardSummary, PaymentTransaction } from '../types';
import { ApiService } from '../services/api';
import {
  TrendingUp,
  CreditCard,
  Users,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Send,
  FileText,
  DollarSign,
  Smartphone,
  Info,
  AlertTriangle,
  Filter,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Building,
  Calendar
} from 'lucide-react';

interface DashboardViewProps {
  currentRole: UserRole;
  onNavigate: (tab: string) => void;
  currentUser?: any;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentRole, onNavigate, currentUser }) => {
  const [activeTimeFilter, setActiveTimeFilter] = useState('This Term');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  // Accordion state for Balances card
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null);

  // Live Database State
  const [metrics, setMetrics] = useState<DashboardSummary>({
    timeframe: 'This Term',
    total_students: 0,
    total_expected: 0,
    total_collected: 0,
    total_outstanding: 0,
    total_expenses: 0,
    net_cashflow: 0,
    collection_rate: 0,
    pending_pledges: 0,
    pledges_count: 0,
    unreconciled_count: 0
  });
  const [collectionsData, setCollectionsData] = useState<Array<{ name: string; collected: number; target: number; percentage: number }>>([]);
  const [balancesData, setBalancesData] = useState<Array<{ grade: string; balance: number }>>([]);
  const [supplierData, setSupplierData] = useState<Array<{ name: string; balance: number }>>([]);
  const [categoriesData, setCategoriesData] = useState<Array<{ name: string; spent: number }>>([]);
  const [recentTransactions, setRecentTransactions] = useState<PaymentTransaction[]>([]);

  const timeFilters = ['This Term', 'This Month', 'This Week', 'Today', 'Date Range', 'Academic Year'];

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = currentUser?.name || 'Willy';

  useEffect(() => {
    if (activeTimeFilter !== 'Date Range') {
      setShowDatePicker(false);
      fetchDashboardData(activeTimeFilter);
    } else {
      setShowDatePicker(true);
      fetchDashboardData('Date Range', customStartDate, customEndDate);
    }
  }, [activeTimeFilter]);

  const fetchDashboardData = async (timeframe = activeTimeFilter, start = customStartDate, end = customEndDate) => {
    setLoading(true);
    try {
      const params: { timeframe?: string; start_date?: string; end_date?: string } = { timeframe };
      if (timeframe === 'Date Range' && start && end) {
        params.start_date = start;
        params.end_date = end;
      }

      const res = await ApiService.getDashboard(params);
      if (res && res.data && res.data.summary) {
        setMetrics(res.data.summary);
        
        if (res.data.recent_payments && res.data.recent_payments.length > 0) {
          setRecentTransactions(res.data.recent_payments);
        } else {
          setRecentTransactions([]);
        }

        if (res.data.class_metrics && res.data.class_metrics.length > 0) {
          setCollectionsData(
            res.data.class_metrics.map((cm: any) => ({
              name: cm.class_name ? cm.class_name.toUpperCase() : 'UNKNOWN',
              collected: Number(cm.collected) || 0,
              target: Number(cm.expected) || 0,
              percentage: cm.expected > 0 ? Math.round((cm.collected / cm.expected) * 100) : 0
            }))
          );
          setBalancesData(
            res.data.class_metrics.map((cm: any) => ({
              grade: cm.class_name,
              balance: Math.max(0, (Number(cm.expected) || 0) - (Number(cm.collected) || 0))
            }))
          );
        } else {
          setCollectionsData([]);
          setBalancesData([]);
        }

        if (res.data.supplier_balances && res.data.supplier_balances.length > 0) {
          setSupplierData(
            res.data.supplier_balances.map((sb: any) => ({
              name: sb.name,
              balance: Number(sb.balance) || 0
            }))
          );
        } else {
          setSupplierData([]);
        }

        if (res.data.category_breakdown && res.data.category_breakdown.length > 0) {
          setCategoriesData(
            res.data.category_breakdown.map((cb: any) => ({
              name: cb.category_name,
              spent: Number(cb.total_spent) || 0
            }))
          );
        } else {
          setCategoriesData([]);
        }

        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics from database:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStartDate && customEndDate) {
      fetchDashboardData('Date Range', customStartDate, customEndDate);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] animate-fadeIn pb-10">
      {/* 1. TOP CONTROLS & COMMAND ACTION BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1 animate-fadeInDown">
        {/* Modern Segmented Time Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-600">
            {timeFilters.map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeFilter(tf)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all duration-200 text-xs ${
                  activeTimeFilter === tf
                    ? 'bg-emerald-600 text-white font-bold shadow-xs scale-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchDashboardData()}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-emerald-700 border border-slate-200/90 rounded-2xl shadow-2xs transition-all active:rotate-180 duration-300"
            title="Refresh Dashboard Live Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* 4 Sleek Quick Action Command Buttons */}
        <div className="flex items-center gap-2.5 overflow-x-auto select-none">
          <button
            onClick={() => onNavigate('reconciliation')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-sky-50 to-sky-100/80 hover:from-sky-100 hover:to-sky-200/80 text-sky-900 border border-sky-200/80 rounded-xl text-xs font-bold shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-600" />
            <span>Receive M-Pesa</span>
          </button>

          <button
            onClick={() => onNavigate('expenses')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-50 to-amber-100/80 hover:from-amber-100 hover:to-amber-200/80 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Add Expense</span>
          </button>

          <button
            onClick={() => onNavigate('fees')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100/80 hover:from-emerald-100 hover:to-emerald-200/80 text-emerald-900 border border-emerald-200/80 rounded-xl text-xs font-bold shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Add Invoice</span>
          </button>

          <button
            onClick={() => onNavigate('messaging')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-rose-50 to-rose-100/80 hover:from-rose-100 hover:to-rose-200/80 text-rose-900 border border-rose-200/80 rounded-xl text-xs font-bold shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-rose-600" />
            <span>Broadcast SMS</span>
          </button>
        </div>
      </div>

      {/* Date Range Picker Bar when 'Date Range' is selected */}
      {activeTimeFilter === 'Date Range' && (
        <form
          onSubmit={handleApplyCustomRange}
          className="flex flex-wrap items-center gap-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-slate-700 shadow-2xs animate-fadeInDown"
        >
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Custom Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500 font-medium">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500 font-medium">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors text-xs"
          >
            Apply Range
          </button>
          <span className="text-[11px] text-slate-400 italic ml-auto hidden sm:inline">
            Showing metrics from {customStartDate} to {customEndDate}
          </span>
        </form>
      )}

      {/* 2. EXECUTIVE GREETING & LEDGER STATUS BANNER */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden animate-fadeIn">
        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 w-96 h-full bg-radial from-emerald-500/15 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Executive Finance Overview</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 normal-case font-medium">Synced at {lastSyncTime}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {getTimeGreeting()}, <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{displayName}</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Institutional fee collections, expenditures, and treasury cashflow status for {activeTimeFilter.toLowerCase()}.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-300 leading-none">Academic Cycle</span>
              <span className="font-bold text-white text-xs mt-0.5">2026 • Term 1</span>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-emerald-200 leading-none">Audit Ledger</span>
              <span className="font-bold text-emerald-300 text-xs mt-0.5">100% Balanced</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOP 4 METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp">
        {/* Card 1: Fees Collected */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs card-hover-lift hover:border-emerald-300 hover:shadow-md cursor-pointer flex flex-col justify-between group transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-slate-700">Fees Collected</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60">
                {metrics.total_expected > 0
                  ? `${Math.round((metrics.total_collected / metrics.total_expected) * 100)}% Target`
                  : 'Active Inflow'}
              </span>
            </div>

            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                KES {metrics.total_collected.toLocaleString()}
              </div>
              
              {/* Target Mini Bar */}
              {metrics.total_expected > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((metrics.total_collected / metrics.total_expected) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Target: KES {metrics.total_expected.toLocaleString()}</span>
                    <span>{Math.round((metrics.total_collected / metrics.total_expected) * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600">View collection receipts</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Card 2: Total Payments (Expenses) */}
        <div
          onClick={() => onNavigate('expenses')}
          className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs card-hover-lift hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs font-bold text-slate-700">Total Payments</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200/60">
                Outflow
              </span>
            </div>

            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                KES {metrics.total_expenses.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Disbursed across {categoriesData.length || 1} active vote heads
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600">Approved vouchers</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Card 3: Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs card-hover-lift hover:shadow-md hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4 text-sky-600" />
                </div>
                <span className="text-xs font-bold text-slate-700">Total Students</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-800 rounded-full border border-sky-200/60">
                Enrolled
              </span>
            </div>

            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {metrics.total_students} <span className="text-xs font-semibold text-slate-400">Students</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Form 1 & Form 2 active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600">Active student roster</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Card 4: SkyPay Gateway Fintech Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-5 text-white shadow-2xs flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-black text-sm text-white">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>SkyPay Gateway</span>
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                M-PESA IPN
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug font-medium">
              Collect fees through Safaricom M-Pesa with auto-reconciling and instant ledger posting.
            </p>
          </div>

          <div className="mt-3 pt-2">
            <button
              onClick={() => onNavigate('reconciliation')}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Manage Gateway</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN 2-COLUMN ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ----------------- LEFT COLUMN (7 COLS) ----------------- */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card: Collections by Class */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">Fee Collections by Class</h2>
                <p className="text-[11px] text-slate-500">Progress against total billable fee targets</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200/60">
                KES {metrics.total_collected.toLocaleString()} / {metrics.total_expected.toLocaleString()}
              </span>
            </div>

            {collectionsData.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">
                No active class fee collections recorded yet.
              </div>
            ) : (
              <div className="space-y-3.5 pt-1">
                {collectionsData.map((item, idx) => (
                  <div key={idx} className="space-y-2 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100/90 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs">{item.name}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          KES {item.collected.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">target: KES {item.target.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.percentage >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.percentage > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {item.percentage >= 75 ? 'On Track' : item.percentage > 0 ? 'In Progress' : 'Pending'}
                        </span>
                        <span className={`text-xs font-black ${item.percentage >= 80 ? 'text-emerald-700' : item.percentage > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          item.percentage >= 80
                            ? 'bg-emerald-600'
                            : item.percentage > 0
                            ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.max(2, Math.min(100, item.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Income Vs Expense / Cashflow */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">Income vs Outflow Performance</h2>
                <p className="text-[11px] text-slate-500">Cashflow & expenditure breakdown for {activeTimeFilter.toLowerCase()}</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-slate-700">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span className="text-slate-700">Expenses</span>
                </div>
              </div>
            </div>

            {/* Inflow vs Outflow Tiles */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-emerald-800 tracking-wider">Total Inflow</span>
                <div className="text-lg sm:text-xl font-black text-emerald-900">
                  KES {metrics.total_collected.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-100 space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-rose-800 tracking-wider">Total Outflow</span>
                <div className="text-lg sm:text-xl font-black text-rose-900">
                  KES {metrics.total_expenses.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Visual Ratio Bar */}
            {metrics.total_collected + metrics.total_expenses > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Inflow Ratio: {Math.round((metrics.total_collected / (metrics.total_collected + metrics.total_expenses)) * 100)}%</span>
                  <span>Outflow Ratio: {Math.round((metrics.total_expenses / (metrics.total_collected + metrics.total_expenses)) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 flex overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{
                      width: `${(metrics.total_collected / (metrics.total_collected + metrics.total_expenses)) * 100}%`
                    }}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{
                      width: `${(metrics.total_expenses / (metrics.total_collected + metrics.total_expenses)) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Net Surplus / Deficit Result Pill */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/90 text-xs">
              <span className="font-bold text-slate-700">Net Surplus / Cashflow Position:</span>
              <span className={`font-black text-sm ${metrics.net_cashflow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                KES {metrics.net_cashflow.toLocaleString()}
              </span>
            </div>

            {/* Expense Categories Breakdown */}
            {categoriesData.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">Expenses by Vote Head:</span>
                <div className="space-y-2">
                  {categoriesData.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-800 font-semibold">{c.name}</span>
                      <span className="font-black text-slate-900">KES {c.spent.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card: Recent Live Collections Feed */}
          {recentTransactions.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">Recent Receipts Stream</h2>
                  <p className="text-[11px] text-slate-500">Live verified transactions posted to ledger</p>
                </div>
                <button
                  onClick={() => onNavigate('payments')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {recentTransactions.slice(0, 5).map((t, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {t.payer_name || (t.first_name ? `${t.first_name} ${t.last_name || ''}` : 'Student Payment')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ref: {t.reference_number || t.receipt_number || t.id.slice(0, 8)} • {t.channel || 'M-PESA'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-slate-900 text-xs">
                        +KES {Number(t.amount).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">{t.payment_date || 'Today'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ----------------- RIGHT COLUMN (5 COLS) ----------------- */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card: Outstanding Student Balances */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">Student Balances</h2>
                <p className="text-[11px] text-slate-500">Uncollected fees across cohorts</p>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                Arrears
              </span>
            </div>

            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Outstanding Balance</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                KES {metrics.total_outstanding.toLocaleString()}
              </div>
            </div>

            {/* Accordion rows */}
            {balancesData.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-medium border-t border-slate-100">
                All student accounts are fully reconciled with 0 balances.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs pt-1">
                {balancesData.map((b, idx) => {
                  const isExp = expandedGrade === b.grade;
                  const isCleared = b.balance <= 0;
                  return (
                    <div key={idx} className="py-2">
                      <div
                        onClick={() => setExpandedGrade(isExp ? null : b.grade)}
                        className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800">{b.grade}</span>
                          {isCleared ? (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                              Cleared
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-200">
                              Pending
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`font-black ${isCleared ? 'text-slate-400' : 'text-slate-900'}`}>
                            KES {b.balance.toLocaleString()}
                          </span>
                          {isExp ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {isExp && (
                        <div className="pl-3 pr-2 py-2 mt-1 bg-slate-50 rounded-xl text-[11px] text-slate-600 flex items-center justify-between animate-fadeIn border border-slate-100">
                          <span>Unpaid cohort invoices:</span>
                          <span className="font-bold text-slate-900">KES {b.balance.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card: Supplier Accounts Payable */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">Supplier Payables</h2>
                  <p className="text-[11px] text-slate-500">Outstanding vendor obligations</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  Accounts Payable
                </span>
              </div>

              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Supplier Balance</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  KES {(supplierData.reduce((acc, curr) => acc + curr.balance, 0)).toLocaleString()}
                </div>
              </div>

              {/* Table list */}
              <div className="pt-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 pb-2 border-b border-slate-100">
                  <span>Supplier Name</span>
                  <span>Amount Due</span>
                </div>
                {supplierData.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium">
                    No supplier payables recorded. All vendors settled.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {supplierData.map((s, idx) => (
                      <div key={idx} className="flex justify-between py-2 text-slate-700 hover:bg-slate-50 px-1 rounded-lg">
                        <span className="font-bold text-slate-800">{s.name}</span>
                        <span className="font-black text-slate-900">
                          KES {s.balance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-right border-t border-slate-100">
              <button
                onClick={() => onNavigate('expenses')}
                className="text-emerald-600 hover:text-emerald-700 font-bold text-xs hover:underline inline-flex items-center gap-1"
              >
                <span>View All Supplier Accounts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

