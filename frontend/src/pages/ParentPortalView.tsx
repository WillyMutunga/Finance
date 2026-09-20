import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ReceiptModal } from '../components/ReceiptModal';
import { FeeStatementModal } from '../components/FeeStatementModal';
import {
  Search,
  FileText,
  Smartphone,
  CreditCard,
  Receipt,
  CalendarHeart,
  CheckCircle2,
  Phone,
  ShieldCheck,
  RefreshCw,
  Users,
  Printer,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Download,
  Building,
  GraduationCap,
  ChevronRight,
  Calendar
} from 'lucide-react';

export const ParentPortalView: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [admSearch, setAdmSearch] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'receipts' | 'statement' | 'pledges'>('receipts');

  // M-Pesa STK Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPhone, setPayPhone] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [stkSuccessMessage, setStkSuccessMessage] = useState<string | null>(null);

  // Pledge Modal
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [pledgeDate, setPledgeDate] = useState('');
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [pledgeNotes, setPledgeNotes] = useState('');

  useEffect(() => {
    initPortal();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadParentData(selectedStudentId);
    }
  }, [selectedStudentId]);

  const initPortal = async () => {
    setLoading(true);
    try {
      const userStr = sessionStorage.getItem('skysoft_auth_user');
      const storedUser = userStr ? JSON.parse(userStr) : null;

      if (storedUser && (storedUser.role === 'parent' || storedUser.student_id || storedUser.email)) {
        const lookupId = storedUser.student_id || storedUser.id || storedUser.email;
        setSelectedStudentId(lookupId);
        const res = await ApiService.getParentStudentSummary(lookupId);
        if (res && res.data && res.data.student) {
          setProfile(res.data);
          setSelectedStudentId(res.data.student.id);
          if (res.data.student.guardian_phone) {
            setPayPhone(res.data.student.guardian_phone);
          }
          setLoading(false);
          return;
        }
      }

      const res = await ApiService.getStudents();
      if (res && res.data && res.data.length > 0) {
        setStudents(res.data);
        setSelectedStudentId(res.data[0].id);
        const pRes = await ApiService.getParentStudentSummary(res.data[0].id);
        if (pRes && pRes.data) {
          setProfile(pRes.data);
          if (pRes.data.student?.guardian_phone) {
            setPayPhone(pRes.data.student.guardian_phone);
          }
        }
      } else {
        setStudents([]);
      }
    } catch (e) {
      console.error('Error loading portal data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAdm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admSearch.trim()) return;
    setLoading(true);
    try {
      const res = await ApiService.getParentStudentSummary(admSearch.trim());
      if (res && res.data && res.data.student) {
        setProfile(res.data);
        setSelectedStudentId(res.data.student.id);
        setShowSearchModal(false);
        setAdmSearch('');
      } else {
        alert('No student found with admission number ' + admSearch);
      }
    } catch (e: any) {
      alert(e.message || 'Student not found');
    } finally {
      setLoading(false);
    }
  };

  const loadParentData = async (studId: string) => {
    if (!studId) return;
    setLoading(true);
    try {
      const res = await ApiService.getParentStudentSummary(studId);
      if (res && res.data) {
        setProfile(res.data);
        if (res.data.student?.guardian_phone && !payPhone) {
          setPayPhone(res.data.student.guardian_phone);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSTK = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setPaying(true);
    setStkSuccessMessage(null);
    try {
      const res = await ApiService.payMpesaSTK(
        selectedStudentId,
        payPhone,
        parseFloat(payAmount)
      );
      if (res && res.data) {
        setStkSuccessMessage(
          `STK Push prompted on ${payPhone}! Payment of KES ${Number(payAmount).toLocaleString()} confirmed and fee account credited.`
        );
        setShowPayModal(false);
        loadParentData(selectedStudentId);
      }
    } catch (e: any) {
      alert(e.message || 'Error triggering STK Push.');
    } finally {
      setPaying(false);
    }
  };

  const handleMakePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      await ApiService.createPledge({
        student_id: selectedStudentId,
        amount: parseFloat(pledgeAmount),
        expected_payment_date: pledgeDate,
        notes: pledgeNotes
      });
      setShowPledgeModal(false);
      setPledgeAmount('');
      setPledgeDate('');
      setPledgeNotes('');
      loadParentData(selectedStudentId);
    } catch (e: any) {
      alert(e.message || 'Error creating pledge.');
    }
  };

  const formatCurrency = (amt: number) => {
    return 'KES ' + Number(amt || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="text-sm font-semibold tracking-wide">Loading Student Financial Portal...</span>
      </div>
    );
  }

  if (!loading && !profile) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-10 border border-slate-200/90 shadow-sm text-center space-y-5 my-12">
        <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <Smartphone className="w-10 h-10" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-2xl tracking-tight">Parent Portal</h3>
        <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
          Please enter your student&apos;s admission number to access real-time fee statements, official payment receipts, and instant Lipa Na M-Pesa.
        </p>
        <form onSubmit={handleSearchAdm} className="max-w-md mx-auto flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Enter Student Admission Number (e.g. BDR-001)..."
            value={admSearch}
            onChange={(e) => setAdmSearch(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            Access
          </button>
        </form>
      </div>
    );
  }

  const student = profile.student;
  const balance = profile.balance || { total_billed: 0, total_paid: 0, current_balance: 0 };
  const receipts = profile.receipts || [];
  const statement = profile.statement || [];
  const pledges = profile.pledges || [];

  const totalBilled = Number(balance.total_billed || 0);
  const totalPaid = Number(balance.total_paid || 0);
  const currentBal = Number(balance.current_balance || 0);
  const percentCleared = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 100;

  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 sm:py-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm shadow-emerald-600/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">Parent & Student Portal</h1>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Live & Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {student.school_name || 'NDUUNDUNE SECONDARY SCHOOL'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profile.siblings && profile.siblings.length > 0 && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSelectedStudentId(student.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedStudentId === student.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {student.first_name} ({student.admission_number})
              </button>
              {profile.siblings.map((sib: any) => (
                <button
                  key={sib.id}
                  onClick={() => setSelectedStudentId(sib.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedStudentId === sib.id
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sib.first_name} ({sib.admission_number})
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowSearchModal(true)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search Adm</span>
          </button>
        </div>
      </div>

      {/* Main Student Card Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        {/* Luminous Background Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-lg shadow-emerald-500/20 border-2 border-white/20 flex-shrink-0">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {student.first_name} {student.last_name}
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-400/30">
                  {student.status || 'ACTIVE'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-mono text-sky-300 font-bold">
                  Adm: {student.admission_number}
                </span>
                <span>•</span>
                <span>{student.class_name} {student.stream_name ? `(${student.stream_name})` : ''}</span>
                <span>•</span>
                <span className="capitalize">{student.boarding_status?.toLowerCase() || 'Day'} Scholar</span>
              </div>
              {student.guardian_name && (
                <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registered Guardian: <strong className="text-slate-200">{student.guardian_name}</strong></span>
                  {student.guardian_phone && <span className="text-slate-400">({student.guardian_phone})</span>}
                </div>
              )}
            </div>
          </div>

          {/* Quick Paybill Badge & Fast Action */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-700/60">
            <div className="bg-slate-800/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 space-y-0.5 text-left md:text-right">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Official Lipa Na M-Pesa</div>
              <div className="text-xs font-mono text-slate-200">
                Paybill: <strong className="text-emerald-400 font-black">{student.mpesa_paybill || '522123'}</strong>
              </div>
              <div className="text-[11px] font-mono text-slate-300">
                Account: <strong className="text-sky-300 font-bold">{student.admission_number}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Outstanding Balance Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Outstanding Fee Balance</span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              currentBal > 0
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {currentBal > 0 ? 'Payment Due' : 'Fully Cleared'}
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
              {formatCurrency(currentBal)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Current Academic Assessment</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
              <span>Fee Clearance Rate</span>
              <span className="font-bold text-emerald-600">{percentCleared}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${percentCleared}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Total Invoiced Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Total Fees Assessed</span>
            </div>
            <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200">
              Term 1 2026
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
              {formatCurrency(totalBilled)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Official Tuition & Boarding Voteheads</p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Includes RMI, PE, Tuition, Lunch</span>
            <button
              onClick={() => setShowStatementModal(true)}
              className="text-sky-700 hover:text-sky-800 font-bold hover:underline cursor-pointer"
            >
              Details &rarr;
            </button>
          </div>
        </div>

        {/* 3. Total Paid Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Total Amount Paid</span>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              {receipts.length} Receipts
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight font-mono">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Confirmed M-Pesa & Bank Deposits</p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Instant Automated Receipting</span>
            <span className="font-bold text-slate-700">100% Reconciled</span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. M-Pesa STK Button */}
        <button
          onClick={() => {
            setPayAmount(currentBal > 0 ? String(currentBal) : '1000');
            setShowPayModal(true);
          }}
          className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="leading-tight font-bold">Lipa Na M-Pesa Online</div>
            <div className="text-[11px] text-emerald-100 font-normal">Instant STK push to phone</div>
          </div>
        </button>

        {/* 2. Official Statement Button */}
        <button
          onClick={() => setShowStatementModal(true)}
          className="p-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-2xl font-bold text-sm shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="leading-tight font-bold">Full Fee Statement</div>
            <div className="text-[11px] text-slate-400 font-normal">Print & Download Official PDF</div>
          </div>
        </button>

        {/* 3. Promise Pledge Button */}
        <button
          onClick={() => {
            setPledgeAmount(currentBal > 0 ? String(currentBal) : '5000');
            setShowPledgeModal(true);
          }}
          className="p-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-2xl font-bold text-sm shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarHeart className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="leading-tight font-bold">Payment Promise (Pledge)</div>
            <div className="text-[11px] text-slate-400 font-normal">Record commitment to Bursar</div>
          </div>
        </button>
      </div>

      {stkSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 sm:p-5 rounded-2xl text-xs sm:text-sm flex items-start gap-3 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <div className="font-extrabold text-emerald-950">Payment Successfully Confirmed!</div>
            <div className="text-emerald-800">{stkSuccessMessage}</div>
          </div>
          <button onClick={() => setStkSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Interactive Tabs Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tab Bar */}
        <div className="border-b border-slate-200 px-6 flex items-center justify-between overflow-x-auto bg-slate-50/70">
          <div className="flex items-center gap-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('receipts')}
              className={`py-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'receipts'
                  ? 'border-emerald-600 text-slate-900 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Official Payment Receipts ({receipts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('statement')}
              className={`py-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'statement'
                  ? 'border-emerald-600 text-slate-900 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Fee Ledger Statement ({statement.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pledges')}
              className={`py-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'pledges'
                  ? 'border-emerald-600 text-slate-900 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarHeart className="w-4 h-4 text-amber-500" />
              <span>Payment Promises ({pledges.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 py-2">
            <button
              onClick={() => loadParentData(selectedStudentId)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Official Payment Receipts */}
        {activeTab === 'receipts' && (
          <div className="p-6">
            {receipts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No payment receipts recorded yet.</p>
                <p className="text-xs text-slate-400">Payments made via Lipa Na M-Pesa will appear here instantly.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date Issued</th>
                      <th className="py-3 px-4">Receipt Number</th>
                      <th className="py-3 px-4">M-Pesa / Bank Reference</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4 text-right">Amount Paid</th>
                      <th className="py-3 px-4 text-center">Official Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {receipts.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {r.receipt_number}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {r.reference_code || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold text-[11px]">
                            {r.payment_method || 'M-Pesa'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                          +{formatCurrency(r.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setActiveReceipt({
                              ...r,
                              student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.name || 'Student',
                              admission_number: student.admission_number || r.admission_number,
                              student_admission: student.admission_number || r.admission_number,
                              student_admission_number: student.admission_number || r.admission_number,
                              class_name: student.class_name || r.class_name,
                              paid_by: r.payer_name || (student.guardian_name ? `${student.guardian_name} (Parent/Guardian)` : 'Guardian / Parent')
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition-all cursor-pointer text-xs"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Financial Ledger Statement */}
        {activeTab === 'statement' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs text-slate-500 font-medium">Complete chronological transaction ledger for this student account.</p>
              <button
                onClick={() => setShowStatementModal(true)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Statement</span>
              </button>
            </div>

            {statement.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No ledger transactions found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Transaction Details</th>
                      <th className="py-3 px-4 text-right">Debit (+)</th>
                      <th className="py-3 px-4 text-right">Credit (-)</th>
                      <th className="py-3 px-4 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                    {statement.map((tx: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-600 font-sans">
                          {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.transaction_type === 'PAYMENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-700">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600">
                          {Number(tx.debit) > 0 ? formatCurrency(tx.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                          {Number(tx.credit) > 0 ? formatCurrency(tx.credit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(tx.running_balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payment Promises & Commitments */}
        {activeTab === 'pledges' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Payment Promises & Commitments</h4>
                <p className="text-xs text-slate-500">Record a formal promise to clear outstanding fee balances on a specific future date.</p>
              </div>
              <button
                onClick={() => setShowPledgeModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <CalendarHeart className="w-4 h-4" />
                <span>New Promise</span>
              </button>
            </div>

            {pledges.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CalendarHeart className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No active payment promises recorded.</p>
                <p className="text-xs text-slate-400">If you need time to clear school fees, click &quot;New Promise&quot; to notify the bursar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pledges.map((p: any) => (
                  <div key={p.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Promised Amount</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'HONORED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status || 'PENDING'}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 font-mono">
                      {formatCurrency(p.amount)}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>Target Date: <strong>{new Date(p.expected_payment_date).toLocaleDateString()}</strong></span>
                    </div>
                    {p.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-200 mt-2">
                        &quot;{p.notes}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Adm Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Switch Student Profile</h3>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Enter any student admission number to look up their current fee balance and statement.
            </p>
            <form onSubmit={handleSearchAdm} className="space-y-4">
              <input
                type="text"
                placeholder="Admission Number (e.g. BDR-001, BDR-002)..."
                value={admSearch}
                onChange={(e) => setAdmSearch(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Lookup Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* M-Pesa STK Push Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Lipa Na M-Pesa Online</h3>
                  <p className="text-[11px] text-slate-500">Direct STK push to parent phone</p>
                </div>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriggerSTK} className="space-y-4 mt-5 text-xs">
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-100 text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Instant Automated Reconciliation</span>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  A PIN prompt will appear on your phone. Upon entering your M-Pesa PIN, your fee account will update immediately and an official receipt will be generated.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">M-Pesa Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0712345678 or 254712345678"
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Amount to Pay (KES) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-base text-slate-900 outline-none"
                  />
                </div>
                {currentBal > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(currentBal))}
                      className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                    >
                      Clear Full Balance ({formatCurrency(currentBal)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(Math.round(currentBal / 2)))}
                      className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                    >
                      Pay 50%
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{paying ? 'Prompting Phone...' : 'Send STK Prompt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pledge Promise Modal */}
      {showPledgeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <CalendarHeart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Record Fee Payment Promise</h3>
                  <p className="text-[11px] text-slate-500">Official commitment notice to School Bursar</p>
                </div>
              </div>
              <button onClick={() => setShowPledgeModal(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMakePledge} className="space-y-4 mt-5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Pledged Amount (KES) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 5000"
                  value={pledgeAmount}
                  onChange={(e) => setPledgeAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Expected Payment Date *</label>
                <input
                  type="date"
                  required
                  value={pledgeDate}
                  onChange={(e) => setPledgeDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Note to School Finance Office (Optional)</label>
                <textarea
                  placeholder="e.g. Will clear via M-Pesa immediately upon end of month salary."
                  value={pledgeNotes}
                  onChange={(e) => setPledgeNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 h-24 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPledgeModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-extrabold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Submit Commitment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
        schoolName={student.school_name || 'NDUUNDUNE SECONDARY SCHOOL'}
      />

      {/* Fee Statement Modal */}
      {showStatementModal && (
        <FeeStatementModal
          studentId={student?.id || selectedStudentId}
          onClose={() => setShowStatementModal(false)}
          schoolName={student?.school_name || 'NDUUNDUNE SECONDARY SCHOOL'}
        />
      )}
    </div>
  );
};

