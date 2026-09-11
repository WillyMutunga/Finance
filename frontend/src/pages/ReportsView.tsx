import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ApiService } from '../services/api';
import { SMSBroadcastModal } from '../components/SMSBroadcastModal';
import { FeeStatementModal } from '../components/FeeStatementModal';
import { exportToCsv } from '../utils/exportUtils';
import {
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  Clock,
  ChevronDown,
  Building,
  Users,
  PieChart,
  DollarSign,
  Search,
  RotateCw,
  Check,
  X,
  Layers,
  ArrowRight,
  Smartphone,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  ShieldCheck,
  Info
} from 'lucide-react';

interface ReportsViewProps {
  initialSubTab?: string;
  currentRole: UserRole;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ initialSubTab = 'student-reports', currentRole }) => {
  // Main Category Tab
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const mainReportTabs = [
    { id: 'student-reports', label: 'Student Reports', icon: Users },
    { id: 'summary-reports', label: 'Summary Reports', icon: PieChart },
    { id: 'financial-reports', label: 'Financial Reports', icon: DollarSign },
    { id: 'ipsas-reports', label: 'IPSAS Reports', icon: Building },
    { id: 'aging-reports', label: 'Aging Reports', icon: Clock },
  ];

  // Internal Sub-tabs for each category
  const [studentSubTab, setStudentSubTab] = useState<'Balances' | 'Balances Per Term' | 'Statements' | 'Vote Head Balances'>('Balances');
  const [summarySubTab, setSummarySubTab] = useState<'Income Summary' | 'Expense Summary' | 'Expense Group Summary' | 'Vote Heads Summary' | 'Student Collection Summary' | 'Received Cheques'>('Income Summary');
  const [financialSubTab, setFinancialSubTab] = useState<'Cash Book' | 'Trial Balance' | 'Consolidated Trial Balance' | 'Fee Register' | 'Ledgers' | 'Arrears' | 'Prepayments' | 'Creditors'>('Cash Book');
  const [ipsasSubTab, setIpsasSubTab] = useState<'Notes' | 'Receipts And Payments' | 'Financial Assets and Liabilities' | 'Cash Flow Statement' | 'Appropriation'>('Notes');
  const [agingSubTab, setAgingSubTab] = useState<'Suppliers' | 'Students' | 'Customers'>('Suppliers');

  // Loading States
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Common Academic & Filter Data
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [financialYear, setFinancialYear] = useState('2026/2027');

  // 1. Student Reports State
  const [feeRegisterData, setFeeRegisterData] = useState<{ summary: any; records: any[] }>({
    summary: { total_students: 0, total_expected: 0, total_paid: 0, total_balance: 0, collection_rate: 0 },
    records: []
  });
  const [termBalances, setTermBalances] = useState<any[]>([]);
  const [studentVoteHeadBalances, setStudentVoteHeadBalances] = useState<any[]>([]);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [selectedStudentForStatement, setSelectedStudentForStatement] = useState<string | null>(null);

  // 2. Summary Reports State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [summaryBy, setSummaryBy] = useState('vote_head');
  const [incomeSummaryData, setIncomeSummaryData] = useState<any>(null);
  const [expenseSummaryData, setExpenseSummaryData] = useState<any>(null);
  const [voteHeadSummaryData, setVoteHeadSummaryData] = useState<any[]>([]);
  const [classCollectionSummary, setClassCollectionSummary] = useState<any[]>([]);
  const [receivedChequesList, setReceivedChequesList] = useState<any[]>([]);

  // 3. Financial Reports State
  const [cashbookData, setCashbookData] = useState<any>({ summary: {}, entries: [] });
  const [trialBalanceData, setTrialBalanceData] = useState<any>(null);
  const [consolidatedTbData, setConsolidatedTbData] = useState<any>(null);

  // 4. IPSAS Reports State
  const [ipsasData, setIpsasData] = useState<any>(null);

  // 5. Aging Reports State
  const [supplierAging, setSupplierAging] = useState<any[]>([]);
  const [studentAging, setStudentAging] = useState<any[]>([]);

  // Initial Load
  useEffect(() => {
    loadClasses();
    loadActiveTabData();
  }, [activeSubTab, studentSubTab, summarySubTab, financialSubTab, ipsasSubTab, agingSubTab, selectedClassId, selectedStatus, financialYear]);

  const loadClasses = async () => {
    try {
      const res = await ApiService.getClasses();
      if (res && res.data) {
        setClasses(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadActiveTabData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'student-reports') {
        if (studentSubTab === 'Balances') {
          const res = await ApiService.getFeeRegister({
            class_id: selectedClassId,
            status: selectedStatus,
            search: searchQuery
          });
          if (res && res.data) setFeeRegisterData(res.data);
        } else if (studentSubTab === 'Balances Per Term') {
          const res = await ApiService.getStudentBalancesPerTerm({ class_id: selectedClassId });
          if (res && res.data) {
            setTermBalances(res.data.matrix || []);
            setFeeRegisterData(prev => ({ ...prev, summary: res.data.summary || prev.summary }));
          }
        } else if (studentSubTab === 'Vote Head Balances') {
          const res = await ApiService.getStudentVoteHeadBalances(selectedClassId);
          if (res && res.data) {
            setStudentVoteHeadBalances(res.data.vote_heads || []);
            setFeeRegisterData(prev => ({ ...prev, summary: res.data.summary || prev.summary }));
          }
        } else if (studentSubTab === 'Statements') {
          const res = await ApiService.getFeeRegister({ class_id: selectedClassId, search: searchQuery });
          if (res && res.data) setFeeRegisterData(res.data);
        }
      } else if (activeSubTab === 'summary-reports') {
        if (summarySubTab === 'Income Summary') {
          const res = await ApiService.getIncomeSummary({ start_date: startDate, end_date: endDate, summary_by: summaryBy });
          if (res && res.data) setIncomeSummaryData(res.data);
        } else if (summarySubTab === 'Expense Summary' || summarySubTab === 'Expense Group Summary') {
          const res = await ApiService.getExpenseSummary({ start_date: startDate, end_date: endDate });
          if (res && res.data) setExpenseSummaryData(res.data);
        } else if (summarySubTab === 'Vote Heads Summary') {
          const res = await ApiService.getVoteHeadSummary();
          if (res && res.data) setVoteHeadSummaryData(res.data.vote_heads || []);
        } else if (summarySubTab === 'Student Collection Summary') {
          const res = await ApiService.getStudentCollectionSummary();
          if (res && res.data) setClassCollectionSummary(res.data.classes || []);
        } else if (summarySubTab === 'Received Cheques') {
          const res = await ApiService.getReceivedCheques();
          if (res && res.data) setReceivedChequesList(res.data.cheques || []);
        }
      } else if (activeSubTab === 'financial-reports') {
        if (financialSubTab === 'Cash Book') {
          const res = await ApiService.getCashbook({ start_date: startDate, end_date: endDate });
          if (res && res.data) setCashbookData(res.data);
        } else if (financialSubTab === 'Trial Balance') {
          const res = await ApiService.getTrialBalance();
          if (res && res.data) setTrialBalanceData(res.data);
        } else if (financialSubTab === 'Consolidated Trial Balance') {
          const res = await ApiService.getConsolidatedTrialBalance();
          if (res && res.data) setConsolidatedTbData(res.data);
        } else if (financialSubTab === 'Fee Register' || financialSubTab === 'Arrears' || financialSubTab === 'Prepayments') {
          const res = await ApiService.getFeeRegister({
            class_id: selectedClassId,
            status: financialSubTab === 'Arrears' ? 'UNPAID' : financialSubTab === 'Prepayments' ? 'OVERPAID' : selectedStatus
          });
          if (res && res.data) setFeeRegisterData(res.data);
        } else if (financialSubTab === 'Ledgers' || financialSubTab === 'Creditors') {
          const res = await ApiService.getTrialBalance();
          if (res && res.data) setTrialBalanceData(res.data);
        }
      } else if (activeSubTab === 'ipsas-reports') {
        const res = await ApiService.getIpsasStatements(financialYear);
        if (res && res.data) setIpsasData(res.data);
      } else if (activeSubTab === 'aging-reports') {
        if (agingSubTab === 'Suppliers' || agingSubTab === 'Customers') {
          const res = await ApiService.getAgingReports('suppliers');
          if (res && res.data) setSupplierAging(res.data.records || []);
        } else if (agingSubTab === 'Students') {
          const res = await ApiService.getAgingReports('students');
          if (res && res.data) setStudentAging(res.data.records || []);
        }
      }
    } catch (e) {
      console.error('Error fetching report data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadActiveTabData();
  };

  const formatCurrency = (amt: number | string | undefined | null) => {
    const val = Number(amt || 0);
    return val.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-slate-800 text-xs font-sans">
      {/* Top Main Category Switcher (Skysoft Finance Style) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-1.5 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {mainReportTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 min-w-[140px] py-2 px-3.5 rounded-lg font-bold text-xs transition-all text-center flex items-center justify-center gap-2 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-semibold'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. STUDENT REPORTS VIEW                                   */}
      {/* ========================================================= */}
      {activeSubTab === 'student-reports' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[640px] flex flex-col">
          {/* Sub-tabs Bar */}
          <div className="border-b border-slate-200 px-4 flex items-center justify-between overflow-x-auto text-xs font-semibold text-slate-600 bg-white">
            <div className="flex items-center gap-6">
              {(['Balances', 'Balances Per Term', 'Statements', 'Vote Head Balances'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStudentSubTab(tab)}
                  className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    studentSubTab === tab
                      ? 'border-emerald-600 text-emerald-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{tab}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 py-2">
              <button
                onClick={() => setShowSMSModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Broadcast Fee Reminder SMS to all Defaulters"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Broadcast SMS</span>
              </button>
              <button
                onClick={() => window.print()}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={() => exportToCsv('Student_Fee_Register_Report', ['#', 'AdmNo', 'Name', 'Class', 'Boarding', 'Expected', 'Paid', 'Credit', 'Balance', 'Status'], feeRegisterData.records.map(r => [
                  r.id, r.admission_number, r.name, r.class, r.boarding, r.expected, r.paid, r.credit_note, r.balance, r.status
                ]))}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Excel / CSV Export"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={handleRefresh}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Refresh"
              >
                <RotateCw className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 space-y-4">
            {/* Filter Controls Row */}
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">Class:</span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Classes</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="CLEARED">Cleared (0 Bal)</option>
                    <option value="PARTIAL">Partial Payment</option>
                    <option value="UNPAID">Zero Paid (Full Arrears)</option>
                    <option value="OVERPAID">Overpaid / Prepayment</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student or adm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadActiveTabData()}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 w-48"
                  />
                </div>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center gap-2 text-[11px]">
                <div className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-mono">
                  <span className="text-slate-500">Billed: </span>
                  <span className="font-bold text-slate-900">KES {formatCurrency(feeRegisterData.summary?.total_expected)}</span>
                </div>
                <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg font-mono">
                  <span className="text-emerald-700">Collected: </span>
                  <span className="font-bold text-emerald-800">KES {formatCurrency(feeRegisterData.summary?.total_paid)}</span>
                </div>
                <div className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg font-mono">
                  <span className="text-rose-700">Arrears: </span>
                  <span className="font-bold text-rose-800">KES {formatCurrency(feeRegisterData.summary?.total_balance)}</span>
                </div>
                <div className="px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-lg font-bold text-sky-800">
                  {feeRegisterData.summary?.collection_rate || 0}% Cleared
                </div>
              </div>
            </div>

            {/* TAB 1: Balances / Fee Register */}
            {studentSubTab === 'Balances' && (
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-3 px-3 w-8">#</th>
                      <th className="py-3 px-3">Adm No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-3">Class</th>
                      <th className="py-3 px-3">Boarding</th>
                      <th className="py-3 px-3 text-right">Expected (KES)</th>
                      <th className="py-3 px-3 text-right">Paid (KES)</th>
                      <th className="py-3 px-3 text-right">Balance (KES)</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center text-slate-400">
                          <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                          <span>Loading student balances...</span>
                        </td>
                      </tr>
                    ) : feeRegisterData.records.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center text-slate-400">
                          No student records match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      feeRegisterData.records.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-slate-400">{s.id}</td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-900">{s.admission_number}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 uppercase">{s.name}</td>
                          <td className="py-3 px-3 text-slate-600">{s.class}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${s.boarding === 'Boarding' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                              {s.boarding}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono">{formatCurrency(s.expected)}</td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">{formatCurrency(s.paid)}</td>
                          <td className={`py-3 px-3 text-right font-mono font-bold ${s.balance < 0 ? 'text-emerald-600' : s.balance === 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                            {formatCurrency(s.balance)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === 'CLEARED' ? 'bg-emerald-100 text-emerald-800' :
                              s.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                              s.status === 'OVERPAID' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setSelectedStudentForStatement(s.student_id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300 text-[11px] inline-flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Statement</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Balances Per Term Matrix */}
            {studentSubTab === 'Balances Per Term' && (
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-3 px-3 w-8">#</th>
                      <th className="py-3 px-3">Adm No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-3">Class</th>
                      <th className="py-3 px-3 text-right">T1 Billed</th>
                      <th className="py-3 px-3 text-right">T1 Paid</th>
                      <th className="py-3 px-3 text-right">T2 Billed</th>
                      <th className="py-3 px-3 text-right">T2 Paid</th>
                      <th className="py-3 px-3 text-right">T3 Billed</th>
                      <th className="py-3 px-3 text-right">T3 Paid</th>
                      <th className="py-3 px-3 text-right">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700 font-mono text-[11px]">
                    {termBalances.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-16 text-center text-slate-400 font-sans">
                          No multi-term balance records found.
                        </td>
                      </tr>
                    ) : (
                      termBalances.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-slate-400 font-sans">{r.id}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{r.adm}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 uppercase font-sans">{r.name}</td>
                          <td className="py-3 px-3 text-slate-600 font-sans">{r.class}</td>
                          <td className="py-3 px-3 text-right">{formatCurrency(r.t1_billed)}</td>
                          <td className="py-3 px-3 text-right text-emerald-700">{formatCurrency(r.t1_paid)}</td>
                          <td className="py-3 px-3 text-right">{formatCurrency(r.t2_billed)}</td>
                          <td className="py-3 px-3 text-right text-emerald-700">{formatCurrency(r.t2_paid)}</td>
                          <td className="py-3 px-3 text-right">{formatCurrency(r.t3_billed)}</td>
                          <td className="py-3 px-3 text-right text-emerald-700">{formatCurrency(r.t3_paid)}</td>
                          <td className={`py-3 px-3 text-right font-bold ${r.total_bal <= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {formatCurrency(r.total_bal)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: Statements */}
            {studentSubTab === 'Statements' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-emerald-950">Official Student Fee Statements</h3>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Click any student below to preview or print their comprehensive ledger statement.</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print All Statements</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {feeRegisterData.records.slice(0, 12).map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStudentForStatement(s.student_id)}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-slate-500">{s.admission_number}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.balance <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {s.balance <= 0 ? 'CLEARED' : `DUE: KES ${formatCurrency(s.balance)}`}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 uppercase group-hover:text-emerald-700 transition-colors">
                        {s.name}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{s.class}</span>
                        <span className="font-semibold text-emerald-700">View Statement →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Vote Head Balances */}
            {studentSubTab === 'Vote Head Balances' && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Vote Head</th>
                      <th className="py-3 px-4 text-right">Expected (KES)</th>
                      <th className="py-3 px-4 text-right">Collected (KES)</th>
                      <th className="py-3 px-4 text-right">Balance (KES)</th>
                      <th className="py-3 px-4 text-right">Collection Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {studentVoteHeadBalances.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                          No vote head balance allocations available.
                        </td>
                      </tr>
                    ) : (
                      studentVoteHeadBalances.map((vh) => (
                        <tr key={vh.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-sans font-bold text-slate-900">{vh.vote_head}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(vh.expected)}</td>
                          <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{formatCurrency(vh.collected)}</td>
                          <td className="py-3 px-4 text-right text-rose-600">{formatCurrency(vh.balance)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-800">{vh.collection_rate}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SUMMARY REPORTS VIEW                                   */}
      {/* ========================================================= */}
      {activeSubTab === 'summary-reports' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[640px] flex flex-col">
          {/* Top Sub-tabs Bar */}
          <div className="border-b border-slate-200 px-4 flex items-center justify-between overflow-x-auto text-xs font-semibold text-slate-600 bg-white">
            <div className="flex items-center gap-6">
              {(['Income Summary', 'Expense Summary', 'Expense Group Summary', 'Vote Heads Summary', 'Student Collection Summary', 'Received Cheques'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSummarySubTab(tab)}
                  className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    summarySubTab === tab
                      ? 'border-emerald-600 text-emerald-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>{tab}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 py-2">
              <button
                onClick={() => window.print()}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={handleRefresh}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Refresh"
              >
                <RotateCw className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 space-y-4">
            {/* Filter Toolbar */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent font-medium text-xs text-slate-800 outline-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent font-medium text-xs text-slate-800 outline-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">Summary By:</span>
                  <select
                    value={summaryBy}
                    onChange={(e) => setSummaryBy(e.target.value)}
                    className="bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="vote_head">Vote Head</option>
                    <option value="payment_mode">Payment Mode</option>
                  </select>
                </div>
              </div>

              <button
                onClick={loadActiveTabData}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer active:scale-95 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Filter Summary</span>
              </button>
            </div>

            {/* Sub-view: Income Summary */}
            {summarySubTab === 'Income Summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Inflow Collections</span>
                    <div className="text-xl font-extrabold text-emerald-950 font-mono mt-1">
                      KES {formatCurrency(incomeSummaryData?.total_collected)}
                    </div>
                  </div>
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
                    <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Payment Channels Active</span>
                    <div className="text-xl font-extrabold text-sky-950 mt-1">
                      {incomeSummaryData?.by_payment_mode?.length || 0} Methods
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Collection Efficiency</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">
                      {incomeSummaryData?.summary?.collection_rate || 0}%
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-800">
                    Collections Breakdown by Payment Mode
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Payment Channel</th>
                        <th className="py-2.5 px-4 text-center">Transactions Count</th>
                        <th className="py-2.5 px-4 text-right">Total Amount (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {(!incomeSummaryData?.by_payment_mode || incomeSummaryData.by_payment_mode.length === 0) ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-slate-400 font-sans">
                            No receipts found for the selected date range.
                          </td>
                        </tr>
                      ) : (
                        incomeSummaryData.by_payment_mode.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-sans font-bold text-slate-800 uppercase">{m.payment_mode || 'Cash'}</td>
                            <td className="py-2.5 px-4 text-center">{m.tx_count}</td>
                            <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">{formatCurrency(m.total_amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-view: Expense Summary */}
            {(summarySubTab === 'Expense Summary' || summarySubTab === 'Expense Group Summary') && (
              <div className="space-y-4">
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Total Disbursed Expenses</span>
                  <div className="text-xl font-extrabold text-rose-950 font-mono mt-1">
                    KES {formatCurrency(expenseSummaryData?.total_spent)}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Expense Category</th>
                        <th className="py-3 px-4 text-center">Vouchers Disbursed</th>
                        <th className="py-3 px-4 text-right">Total Spent (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {(!expenseSummaryData?.categories || expenseSummaryData.categories.length === 0) ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-slate-400 font-sans">
                            No expense records recorded in the selected period.
                          </td>
                        </tr>
                      ) : (
                        expenseSummaryData.categories.map((c: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-sans font-bold text-slate-900">{c.category_name}</td>
                            <td className="py-3 px-4 text-center">{c.voucher_count}</td>
                            <td className="py-3 px-4 text-right text-rose-700 font-bold">{formatCurrency(c.total_spent)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-view: Vote Heads Summary */}
            {summarySubTab === 'Vote Heads Summary' && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Vote Head</th>
                      <th className="py-3 px-4 text-right">Budget (KES)</th>
                      <th className="py-3 px-4 text-right">Income (KES)</th>
                      <th className="py-3 px-4 text-right">Spent (KES)</th>
                      <th className="py-3 px-4 text-right">Variance (KES)</th>
                      <th className="py-3 px-4 text-right">Absorption %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {voteHeadSummaryData.map((vh, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">{vh.vote_head}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(vh.budget)}</td>
                        <td className="py-3 px-4 text-right text-emerald-700">{formatCurrency(vh.income)}</td>
                        <td className="py-3 px-4 text-right text-rose-700">{formatCurrency(vh.expense)}</td>
                        <td className="py-3 px-4 text-right text-slate-800">{formatCurrency(vh.variance)}</td>
                        <td className="py-3 px-4 text-right font-bold text-sky-800">{vh.absorption}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub-view: Student Collection Summary */}
            {summarySubTab === 'Student Collection Summary' && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4 text-center">Students</th>
                      <th className="py-3 px-4 text-right">Expected (KES)</th>
                      <th className="py-3 px-4 text-right">Collected (KES)</th>
                      <th className="py-3 px-4 text-right">Balance (KES)</th>
                      <th className="py-3 px-4 text-right">Rate %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {classCollectionSummary.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">{c.class_name}</td>
                        <td className="py-3 px-4 text-center">{c.student_count}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(c.total_expected)}</td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{formatCurrency(c.total_collected)}</td>
                        <td className="py-3 px-4 text-right text-rose-600">{formatCurrency(c.total_balance)}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-800">{c.collection_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub-view: Received Cheques */}
            {summarySubTab === 'Received Cheques' && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Receipt No</th>
                      <th className="py-3 px-4">Cheque Ref</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Bank</th>
                      <th className="py-3 px-4 text-right">Amount (KES)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {receivedChequesList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                          No cheque transactions recorded in database.
                        </td>
                      </tr>
                    ) : (
                      receivedChequesList.map((ch, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-900">{ch.receipt_number}</td>
                          <td className="py-3 px-4 font-bold text-emerald-800">{ch.cheque_number}</td>
                          <td className="py-3 px-4 font-sans uppercase">{ch.student_name} ({ch.admission_number})</td>
                          <td className="py-3 px-4 font-sans">{ch.bank_name}</td>
                          <td className="py-3 px-4 text-right font-bold">{formatCurrency(ch.amount)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {ch.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. FINANCIAL REPORTS VIEW                                 */}
      {/* ========================================================= */}
      {activeSubTab === 'financial-reports' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[640px] flex flex-col">
          {/* Top Sub-tabs Bar */}
          <div className="border-b border-slate-200 px-4 flex items-center justify-between overflow-x-auto text-xs font-semibold text-slate-600 bg-white">
            <div className="flex items-center gap-6">
              {(['Cash Book', 'Trial Balance', 'Consolidated Trial Balance', 'Fee Register', 'Ledgers', 'Arrears', 'Prepayments', 'Creditors'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFinancialSubTab(tab)}
                  className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    financialSubTab === tab
                      ? 'border-emerald-600 text-emerald-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{tab}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 py-2">
              <button
                onClick={() => window.print()}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={handleRefresh}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Refresh"
              >
                <RotateCw className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 space-y-4">
            {/* SUB-VIEW 1: Cash Book */}
            {financialSubTab === 'Cash Book' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Inflows</span>
                    <div className="text-base font-extrabold text-emerald-800 font-mono mt-0.5">
                      KES {formatCurrency(cashbookData.summary?.total_inflows)}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Outflows</span>
                    <div className="text-base font-extrabold text-rose-700 font-mono mt-0.5">
                      KES {formatCurrency(cashbookData.summary?.total_outflows)}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Closing Bank</span>
                    <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                      KES {formatCurrency(cashbookData.summary?.closing_bank)}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Closing Cash</span>
                    <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                      KES {formatCurrency(cashbookData.summary?.closing_cash)}
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-4">Particulars</th>
                        <th className="py-2.5 px-3">Mode</th>
                        <th className="py-2.5 px-3 text-right">Bank In (DR)</th>
                        <th className="py-2.5 px-3 text-right">Cash In (DR)</th>
                        <th className="py-2.5 px-3 text-right">Bank Out (CR)</th>
                        <th className="py-2.5 px-3 text-right">Cash Out (CR)</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {(!cashbookData.entries || cashbookData.entries.length === 0) ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                            No cashbook transactions found in ledger.
                          </td>
                        </tr>
                      ) : (
                        cashbookData.entries.map((e: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-600 font-sans">{e.date}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{e.reference}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-800">{e.particulars}</td>
                            <td className="py-2.5 px-3 font-sans text-[10px] uppercase text-slate-500">{e.channel}</td>
                            <td className="py-2.5 px-3 text-right text-emerald-700">{e.bank_in > 0 ? formatCurrency(e.bank_in) : '-'}</td>
                            <td className="py-2.5 px-3 text-right text-emerald-700">{e.cash_in > 0 ? formatCurrency(e.cash_in) : '-'}</td>
                            <td className="py-2.5 px-3 text-right text-rose-700">{e.bank_out > 0 ? formatCurrency(e.bank_out) : '-'}</td>
                            <td className="py-2.5 px-3 text-right text-rose-700">{e.cash_out > 0 ? formatCurrency(e.cash_out) : '-'}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(e.total_balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: Trial Balance */}
            {(financialSubTab === 'Trial Balance' || financialSubTab === 'Consolidated Trial Balance') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-900 text-xs">Double-Entry Balance Verified: </span>
                      <span className="text-emerald-700 text-xs">Total Debits equal Total Credits.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span>Debits: KES {formatCurrency(trialBalanceData?.total_debits)}</span>
                    <span>Credits: KES {formatCurrency(trialBalanceData?.total_credits)}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Account Code</th>
                        <th className="py-3 px-5">Account Name</th>
                        <th className="py-3 px-4">Classification</th>
                        <th className="py-3 px-4 text-right">Debit (DR) KES</th>
                        <th className="py-3 px-4 text-right">Credit (CR) KES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {(!trialBalanceData?.accounts || trialBalanceData.accounts.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                            No ledger trial balance accounts available.
                          </td>
                        </tr>
                      ) : (
                        trialBalanceData.accounts.map((acc: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-semibold text-slate-900">{acc.code}</td>
                            <td className="py-3 px-5 font-sans font-bold text-slate-900">{acc.account_name}</td>
                            <td className="py-3 px-4 font-sans text-slate-500">{acc.category || 'General Ledger'}</td>
                            <td className="py-3 px-4 text-right">{acc.debit > 0 ? formatCurrency(acc.debit) : '-'}</td>
                            <td className="py-3 px-4 text-right">{acc.credit > 0 ? formatCurrency(acc.credit) : '-'}</td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-slate-100 font-extrabold text-slate-900 font-mono">
                        <td colSpan={3} className="py-3 px-4 font-sans uppercase">Total General Ledger Balance</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-950">{formatCurrency(trialBalanceData?.total_debits)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-950">{formatCurrency(trialBalanceData?.total_credits)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. IPSAS REPORTS VIEW                                     */}
      {/* ========================================================= */}
      {activeSubTab === 'ipsas-reports' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[640px] flex flex-col">
          {/* Top Sub-tabs Bar */}
          <div className="border-b border-slate-200 px-4 flex items-center justify-between overflow-x-auto text-xs font-semibold text-slate-600 bg-white">
            <div className="flex items-center gap-6">
              {(['Notes', 'Receipts And Payments', 'Financial Assets and Liabilities', 'Cash Flow Statement', 'Appropriation'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setIpsasSubTab(tab)}
                  className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    ipsasSubTab === tab
                      ? 'border-sky-600 text-sky-800 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>{tab}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 py-2">
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="2026/2027">FY 2026/2027</option>
                <option value="2025/2026">FY 2025/2026</option>
              </select>
              <button
                onClick={() => window.print()}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={handleRefresh}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Refresh"
              >
                <RotateCw className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 space-y-4">
            {/* Official Heading */}
            <div className="text-center py-2 border-b border-slate-200/60 space-y-1">
              <h2 className="font-extrabold text-base text-slate-900 tracking-wide uppercase">NDUUNDUNE SECONDARY SCHOOL</h2>
              <p className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                PUBLIC SECTOR IPSAS FINANCIAL STATEMENTS - {financialYear}
              </p>
            </div>

            {/* IPSAS SUB-VIEW: Notes 1-10 */}
            {ipsasSubTab === 'Notes' && ipsasData?.notes && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(ipsasData.notes).map((k) => {
                  const note = ipsasData.notes[k];
                  return (
                    <div key={k} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-[#0284c7] text-white px-3.5 py-2 font-bold text-[11px] flex justify-between items-center">
                        <span>{note.title}</span>
                      </div>
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-50 text-slate-500 text-[10px]">
                          <tr>
                            <th className="py-2 px-3 font-sans">Description</th>
                            <th className="py-2 px-3 text-right">Current FY</th>
                            <th className="py-2 px-3 text-right">Prior FY</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          <tr className="bg-white">
                            <td className="py-2 px-3 font-sans font-medium text-slate-800">Total Net Amount</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(note.current)}</td>
                            <td className="py-2 px-3 text-right text-slate-400">{formatCurrency(note.prior)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}

            {/* IPSAS SUB-VIEW: Statement of Receipts & Payments */}
            {ipsasSubTab === 'Receipts And Payments' && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-w-3xl mx-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0284c7] text-white font-bold">
                    <tr>
                      <th className="py-3 px-4 font-sans">Statement Item</th>
                      <th className="py-3 px-4 text-right">Current Year (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr className="bg-emerald-50/50 font-bold">
                      <td className="py-3 px-4 font-sans text-emerald-950">TOTAL RECEIPTS / REVENUE</td>
                      <td className="py-3 px-4 text-right text-emerald-800">{formatCurrency(ipsasData?.statement_of_receipts_and_payments?.total_receipts)}</td>
                    </tr>
                    <tr className="bg-rose-50/50 font-bold">
                      <td className="py-3 px-4 font-sans text-rose-950">TOTAL PAYMENTS / EXPENDITURE</td>
                      <td className="py-3 px-4 text-right text-rose-800">{formatCurrency(ipsasData?.statement_of_receipts_and_payments?.total_payments)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-extrabold text-slate-950">
                      <td className="py-3 px-4 font-sans uppercase">NET SURPLUS / (DEFICIT) FOR THE PERIOD</td>
                      <td className="py-3 px-4 text-right font-bold">{formatCurrency(ipsasData?.statement_of_receipts_and_payments?.surplus_deficit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* IPSAS SUB-VIEW: Financial Assets & Liabilities */}
            {ipsasSubTab === 'Financial Assets and Liabilities' && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-w-3xl mx-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0284c7] text-white font-bold">
                    <tr>
                      <th className="py-3 px-4 font-sans">Financial Asset / Liability Item</th>
                      <th className="py-3 px-4 text-right">Current Year (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr>
                      <td className="py-3 px-4 font-sans">Bank Account Balances</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(ipsasData?.statement_of_financial_assets_and_liabilities?.bank_balances)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-sans">Cash in Hand & Petty Cash</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(ipsasData?.statement_of_financial_assets_and_liabilities?.cash_in_hand)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-sans">Accounts Receivable (Outstanding Fee Debtors)</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(ipsasData?.statement_of_financial_assets_and_liabilities?.accounts_receivable)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-extrabold text-slate-950">
                      <td className="py-3 px-4 font-sans uppercase">NET FINANCIAL ASSETS / POSITION</td>
                      <td className="py-3 px-4 text-right font-bold">{formatCurrency(ipsasData?.statement_of_financial_assets_and_liabilities?.net_financial_assets)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. AGING REPORTS VIEW                                     */}
      {/* ========================================================= */}
      {activeSubTab === 'aging-reports' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[640px] flex flex-col">
          {/* Top Sub-tabs Bar */}
          <div className="border-b border-slate-200 px-4 flex items-center justify-between overflow-x-auto text-xs font-semibold text-slate-600 bg-white">
            <div className="flex items-center gap-6">
              {(['Suppliers', 'Students', 'Customers'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAgingSubTab(tab)}
                  className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    agingSubTab === tab
                      ? 'border-emerald-600 text-emerald-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{tab} Aging</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 py-2">
              <button
                onClick={() => window.print()}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={handleRefresh}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Refresh"
              >
                <RotateCw className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-8">#</th>
                    <th className="py-3 px-5">{agingSubTab === 'Students' ? 'Student / Adm' : 'Supplier / Vendor'}</th>
                    {agingSubTab === 'Students' && <th className="py-3 px-3">Class</th>}
                    <th className="py-3 px-4 text-right">0-30 Days</th>
                    <th className="py-3 px-4 text-right">31-60 Days</th>
                    <th className="py-3 px-4 text-right">61-120 Days</th>
                    <th className="py-3 px-4 text-right">Over 120 Days</th>
                    <th className="py-3 px-4 text-right">Total Overdue (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {agingSubTab === 'Students' ? (
                    studentAging.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                          No student fee debtors found in database.
                        </td>
                      </tr>
                    ) : (
                      studentAging.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-3 text-slate-400 font-sans">{s.id}</td>
                          <td className="py-3 px-5 font-sans font-bold text-slate-900 uppercase">
                            {s.name} <span className="text-slate-400 font-mono text-[10px]">({s.adm})</span>
                          </td>
                          <td className="py-3 px-3 font-sans text-slate-600">{s.class}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(s.d0_30)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(s.d31_60)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(s.d61_120)}</td>
                          <td className="py-3 px-4 text-right font-bold text-rose-700">{formatCurrency(s.over120)}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-950">{formatCurrency(s.total)}</td>
                        </tr>
                      ))
                    )
                  ) : (
                    supplierAging.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                          No outstanding supplier bills recorded.
                        </td>
                      </tr>
                    ) : (
                      supplierAging.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-3 text-slate-400 font-sans">{s.id}</td>
                          <td className="py-3 px-5 font-sans font-bold text-slate-900 uppercase">{s.name}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(s.d0_30)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(s.d31_60)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(s.d61_120)}</td>
                          <td className="py-3 px-4 text-right font-bold text-rose-700">{formatCurrency(s.over120)}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-950">{formatCurrency(s.total)}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SMSBroadcastModal
        isOpen={showSMSModal}
        onClose={() => setShowSMSModal(false)}
        recipients={feeRegisterData.records.filter(s => s.balance > 0).map(s => ({
          student_id: s.student_id,
          first_name: s.name.split(' ')[0],
          last_name: s.name.split(' ')[1] || '',
          admission_number: s.admission_number,
          guardian_name: s.guardian_name,
          guardian_phone: s.guardian_phone,
          balance: s.balance
        }))}
      />

      <FeeStatementModal
        studentId={selectedStudentForStatement}
        onClose={() => setSelectedStudentForStatement(null)}
      />
    </div>
  );
};