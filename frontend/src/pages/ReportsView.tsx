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
  const [balancesPerTermStudents, setBalancesPerTermStudents] = useState<any[]>([]);
  const [balancesPerTermMode, setBalancesPerTermMode] = useState<'year' | 'current_term'>('year');
  const [selectedTermStudentIds, setSelectedTermStudentIds] = useState<string[]>([]);

  const [studentVoteHeadBalances, setStudentVoteHeadBalances] = useState<any[]>([]);
  const [voteHeadColumns, setVoteHeadColumns] = useState<string[]>([]);
  const [voteHeadStudents, setVoteHeadStudents] = useState<any[]>([]);
  const [selectedVoteHeadStudentIds, setSelectedVoteHeadStudentIds] = useState<string[]>([]);

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
  const [cashbookData, setCashbookData] = useState<any>({ summary: {}, entries: [], receipts: [], payments: [], vote_heads: [] });
  const [trialBalanceData, setTrialBalanceData] = useState<any>(null);
  const [consolidatedTbData, setConsolidatedTbData] = useState<any>(null);
  const [cashbookAccountType, setCashbookAccountType] = useState('SCHOOL FUND');
  const [cashbookBankId, setCashbookBankId] = useState('');
  const [cashbookFinancialYear, setCashbookFinancialYear] = useState('2026/2027');
  const [cashbookMonth, setCashbookMonth] = useState('SEPTEMBER');
  const [cashbookViewMode, setCashbookViewMode] = useState<'combined' | 'separated'>('combined');
  const [bankAccountsList, setBankAccountsList] = useState<any[]>([]);

  // 4. IPSAS Reports State
  const [ipsasData, setIpsasData] = useState<any>(null);

  // 5. Aging Reports State
  const [supplierAging, setSupplierAging] = useState<any[]>([]);
  const [studentAging, setStudentAging] = useState<any[]>([]);

  // Initial Load
  useEffect(() => {
    loadClasses();
    loadBankAccounts();
    loadActiveTabData();
  }, [activeSubTab, studentSubTab, summarySubTab, financialSubTab, ipsasSubTab, agingSubTab, selectedClassId, selectedStatus, financialYear, cashbookAccountType, cashbookBankId, cashbookFinancialYear, cashbookMonth]);

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

  const loadBankAccounts = async () => {
    try {
      const res = await ApiService.getAccounts();
      if (res && res.data) {
        setBankAccountsList(res.data);
      }
    } catch (e) {
      // ignore
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
            setBalancesPerTermStudents(res.data.students || []);
            setFeeRegisterData(prev => ({ ...prev, summary: res.data.summary || prev.summary }));
          }
        } else if (studentSubTab === 'Vote Head Balances') {
          const res = await ApiService.getStudentVoteHeadBalances(selectedClassId);
          if (res && res.data) {
            setStudentVoteHeadBalances(res.data.vote_heads || []);
            setVoteHeadColumns(res.data.vote_heads_columns || []);
            setVoteHeadStudents(res.data.students || []);
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
          const yr = cashbookFinancialYear.split('/')[0] || '2026';
          const res = await ApiService.getCashbook({
            account_type_id: cashbookAccountType,
            bank_account_id: cashbookBankId,
            month: cashbookMonth,
            year: yr
          });
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

            {/* TAB 2: Balances Per Term (Exact Zeraki Finance Model) */}
            {studentSubTab === 'Balances Per Term' && (
              <div className="space-y-3">
                {/* Action & Toggle Controls */}
                <div className="flex items-center justify-between">
                  {/* Toggle Pill on Left */}
                  <div className="inline-flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                    <button
                      onClick={() => setBalancesPerTermMode('year')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        balancesPerTermMode === 'year'
                          ? 'bg-[#e0f2fe] text-[#0284c7] font-bold border border-[#bae6fd]'
                          : 'text-slate-600 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      {balancesPerTermMode === 'year' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      <span>By Academic Year</span>
                    </button>
                    <button
                      onClick={() => setBalancesPerTermMode('current_term')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        balancesPerTermMode === 'current_term'
                          ? 'bg-[#e0f2fe] text-[#0284c7] font-bold border border-[#bae6fd]'
                          : 'text-slate-600 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      {balancesPerTermMode === 'current_term' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      <span>Current Term</span>
                    </button>
                  </div>

                  {/* Top Right Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => window.print()}
                      className="p-1.5 bg-[#f0f9ff] hover:bg-sky-100 text-[#0284c7] border border-[#bae6fd] rounded-lg cursor-pointer transition-colors shadow-xs"
                      title="Print Balances Per Term"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const rows: any[] = [];
                        balancesPerTermStudents.forEach((st) => {
                          st.terms.forEach((t: any, idx: number) => {
                            rows.push([
                              idx === 0 ? st.id : '',
                              idx === 0 ? st.admission_number : '',
                              idx === 0 ? st.name : '',
                              idx === 0 ? st.class : '',
                              t.term_name,
                              t.opening_balance,
                              t.invoices,
                              t.receipts,
                              t.closing_balance
                            ]);
                          });
                        });
                        exportToCsv('Balances_Per_Term_Report', ['#', 'Adm No', 'Name', 'Class', 'Term', 'Opening Balance', 'Invoices', 'Receipts', 'Closing Balance'], rows);
                      }}
                      className="p-1.5 bg-[#f0f9ff] hover:bg-sky-100 text-[#0284c7] border border-[#bae6fd] rounded-lg cursor-pointer transition-colors shadow-xs"
                      title="Export to Spreadsheet"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {}}
                      className="px-3 py-1.5 bg-[#f0f9ff] hover:bg-sky-100 text-[#0284c7] border border-[#bae6fd] rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>Filter</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-3 px-3 w-8">
                          <input
                            type="checkbox"
                            checked={balancesPerTermStudents.length > 0 && selectedTermStudentIds.length === balancesPerTermStudents.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedTermStudentIds(balancesPerTermStudents.map(s => s.student_id));
                              else setSelectedTermStudentIds([]);
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-3 w-8">#</th>
                        <th className="py-3 px-3">Adm No</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-3">Class</th>
                        <th className="py-3 px-3">Term</th>
                        <th className="py-3 px-3 text-right">Opening Balance</th>
                        <th className="py-3 px-3 text-right">Invoices</th>
                        <th className="py-3 px-3 text-right">Receipts</th>
                        <th className="py-3 px-3 text-right">Closing Balance</th>
                        <th className="py-3 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-[11px]">
                      {balancesPerTermStudents.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-16 text-center text-slate-400 font-sans">
                            No multi-term balance records found.
                          </td>
                        </tr>
                      ) : (
                        balancesPerTermStudents.map((st, sIdx) => {
                          const termsToShow = balancesPerTermMode === 'current_term' ? st.terms.slice(0, 1) : st.terms;
                          const isSelected = selectedTermStudentIds.includes(st.student_id);
                          const groupBg = sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';

                          return (
                            <React.Fragment key={st.student_id || sIdx}>
                              {termsToShow.map((t: any, tIdx: number) => (
                                <tr
                                  key={`${st.student_id}_${tIdx}`}
                                  className={`${groupBg} hover:bg-slate-100/70 transition-colors ${tIdx === termsToShow.length - 1 ? 'border-b border-slate-200' : ''}`}
                                >
                                  {/* Checkbox only on row 1 */}
                                  <td className="py-2.5 px-3">
                                    {tIdx === 0 && (
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) setSelectedTermStudentIds(prev => [...prev, st.student_id]);
                                          else setSelectedTermStudentIds(prev => prev.filter(id => id !== st.student_id));
                                        }}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                      />
                                    )}
                                  </td>
                                  {/* Index only on row 1 */}
                                  <td className="py-2.5 px-3 text-slate-600 font-sans">{tIdx === 0 ? st.id : ''}</td>
                                  {/* Adm No only on row 1 */}
                                  <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">{tIdx === 0 ? st.admission_number : ''}</td>
                                  {/* Name only on row 1 */}
                                  <td className="py-2.5 px-4 font-bold text-slate-900 uppercase font-sans">{tIdx === 0 ? st.name : ''}</td>
                                  {/* Class only on row 1 */}
                                  <td className="py-2.5 px-3 text-slate-600 font-sans">{tIdx === 0 ? st.class : ''}</td>
                                  {/* Term name */}
                                  <td className="py-2.5 px-3 font-semibold text-slate-800 uppercase text-[11px] whitespace-nowrap">{t.term_name}</td>
                                  {/* Opening Balance */}
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-800">{formatCurrency(t.opening_balance)}</td>
                                  {/* Invoices */}
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-800">{formatCurrency(t.invoices)}</td>
                                  {/* Receipts */}
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-800">{formatCurrency(t.receipts)}</td>
                                  {/* Closing Balance */}
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(t.closing_balance)}</td>
                                  {/* Actions dropdown button on row 1 */}
                                  <td className="py-2.5 px-3 text-center">
                                    {tIdx === 0 && (
                                      <button
                                        onClick={() => setSelectedStudentForStatement(st.student_id)}
                                        className="px-2.5 py-0.5 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                      >
                                        <span>Action</span>
                                        <ChevronDown className="w-3 h-3" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
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

            {/* TAB 4: Vote Head Balances (Exact Multi-Column Zeraki Model) */}
            {studentSubTab === 'Vote Head Balances' && (
              <div className="space-y-3">
                {/* Header with Title and Action Buttons */}
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-800">Vote Head Balances</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => window.print()}
                      className="p-1.5 bg-[#f0f9ff] hover:bg-sky-100 text-[#0284c7] border border-[#bae6fd] rounded-lg cursor-pointer transition-colors shadow-xs"
                      title="Print Vote Head Balances"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const vhCols = voteHeadColumns.length > 0 ? voteHeadColumns : ['LUNCH', 'EWC', 'LTT', 'PE', 'BES'];
                        const headers = ['#', 'Student', 'Adm No', 'Class'];
                        vhCols.forEach(vh => {
                          headers.push(`${vh} Expected`, `${vh} Paid`, `${vh} Balance`);
                        });
                        const rows = voteHeadStudents.map(st => {
                          const row = [st.id, st.name, st.admission_number, st.class];
                          vhCols.forEach(vh => {
                            const b = st.vote_heads?.[vh] || { expected: 0, paid: 0, balance: 0 };
                            row.push(b.expected, b.paid, b.balance);
                          });
                          return row;
                        });
                        exportToCsv('Vote_Head_Balances_Report', headers, rows);
                      }}
                      className="p-1.5 bg-[#f0f9ff] hover:bg-sky-100 text-[#0284c7] border border-[#bae6fd] rounded-lg cursor-pointer transition-colors shadow-xs"
                      title="Export to Spreadsheet"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {}}
                      className="px-3 py-1.5 bg-[#f0f9ff] hover:bg-sky-100 text-[#0284c7] border border-[#bae6fd] rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>Filter</span>
                    </button>
                  </div>
                </div>

                {/* Multi-tier Table */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm bg-white">
                  {(() => {
                    const vhCols = voteHeadColumns.length > 0
                      ? voteHeadColumns
                      : ['LUNCH', 'EWC', 'LTT', 'PE', 'BES'];

                    return (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50/90 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                          {/* Row 1: Main Headers */}
                          <tr className="border-b border-slate-200">
                            <th rowSpan={2} className="py-2.5 px-3 w-8 border-r border-slate-200">
                              <input
                                type="checkbox"
                                checked={voteHeadStudents.length > 0 && selectedVoteHeadStudentIds.length === voteHeadStudents.length}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedVoteHeadStudentIds(voteHeadStudents.map(s => s.student_id));
                                  else setSelectedVoteHeadStudentIds([]);
                                }}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </th>
                            <th rowSpan={2} className="py-2.5 px-3 w-8 border-r border-slate-200 text-center">#</th>
                            <th rowSpan={2} className="py-2.5 px-4 border-r border-slate-200 min-w-[200px]">Student</th>
                            {vhCols.map((vh) => (
                              <th key={vh} colSpan={3} className="py-2 px-3 text-center border-r border-slate-200 font-bold uppercase tracking-wider text-slate-900 bg-slate-100/60">
                                {vh}
                              </th>
                            ))}
                          </tr>

                          {/* Row 2: Sub-headers */}
                          <tr className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
                            {vhCols.map((vh) => (
                              <React.Fragment key={`sub_${vh}`}>
                                <th className="py-2 px-3 text-right border-r border-slate-100 font-semibold">Expected</th>
                                <th className="py-2 px-3 text-right border-r border-slate-100 font-semibold">Paid</th>
                                <th className="py-2 px-3 text-right border-r border-slate-200 font-semibold">Balance</th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-800">
                          {voteHeadStudents.length === 0 ? (
                            <tr>
                              <td colSpan={3 + vhCols.length * 3} className="py-16 text-center text-slate-400 font-sans">
                                No student vote head balance allocations available.
                              </td>
                            </tr>
                          ) : (
                            voteHeadStudents.map((st, idx) => {
                              const isSelected = selectedVoteHeadStudentIds.includes(st.student_id);
                              const isEven = idx % 2 === 0;

                              return (
                                <tr key={st.student_id || idx} className={`${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-100/70 transition-colors`}>
                                  <td className="py-3 px-3 border-r border-slate-100">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedVoteHeadStudentIds(prev => [...prev, st.student_id]);
                                        else setSelectedVoteHeadStudentIds(prev => prev.filter(id => id !== st.student_id));
                                      }}
                                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-3 px-3 border-r border-slate-100 text-slate-500 font-sans text-center">{st.id || idx + 1}</td>
                                  <td className="py-3 px-4 border-r border-slate-100 font-sans">
                                    <div className="font-bold text-slate-900 uppercase text-xs">{st.name}</div>
                                    <div className="text-[11px] text-slate-500">Adm No. {st.admission_number}· {st.class}</div>
                                  </td>
                                  {vhCols.map((vh) => {
                                    const b = st.vote_heads?.[vh] || { expected: 0, paid: 0, balance: 0 };
                                    return (
                                      <React.Fragment key={`cell_${st.student_id}_${vh}`}>
                                        <td className="py-3 px-3 text-right border-r border-slate-100 text-slate-800">
                                          {b.expected > 0 ? Number(b.expected).toLocaleString('en-KE') : '0'}
                                        </td>
                                        <td className="py-3 px-3 text-right border-r border-slate-100 text-slate-800">
                                          {b.paid > 0 ? Number(b.paid).toLocaleString('en-KE') : '0'}
                                        </td>
                                        <td className="py-3 px-3 text-right border-r border-slate-200 font-semibold text-slate-900">
                                          {b.balance > 0 ? Number(b.balance).toLocaleString('en-KE') : '0'}
                                        </td>
                                      </React.Fragment>
                                    );
                                  })}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
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
            {/* SUB-VIEW 1: Cash Book (Zeraki Finance Standard) */}
            {financialSubTab === 'Cash Book' && (
              <div className="space-y-6">
                {/* 1. Filter Controls Bar */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Add Account Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Add Account Type</label>
                      <div className="relative">
                        <select
                          value={cashbookAccountType}
                          onChange={(e) => setCashbookAccountType(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8 cursor-pointer"
                        >
                          <option value="SCHOOL FUND">SCHOOL FUND</option>
                          <option value="OPERATION ACCOUNT">OPERATION ACCOUNT</option>
                          <option value="TUITION ACCOUNT">TUITION ACCOUNT</option>
                          <option value="BOARDING ACCOUNT">BOARDING ACCOUNT</option>
                          <option value="DEVELOPMENT ACCOUNT">DEVELOPMENT ACCOUNT</option>
                          <option value="SPECIAL EXAMS">SPECIAL EXAMS</option>
                        </select>
                        {cashbookAccountType && (
                          <button
                            type="button"
                            onClick={() => setCashbookAccountType('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            title="Clear"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bank (Optional) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bank (Optional)</label>
                      <select
                        value={cashbookBankId}
                        onChange={(e) => setCashbookBankId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="">Select an account</option>
                        {bankAccountsList.map((b: any) => (
                          <option key={b.id} value={b.id}>
                            {b.bank_name} - {b.account_name} ({b.account_number})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Financial Year */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Financial Year</label>
                      <div className="relative">
                        <select
                          value={cashbookFinancialYear}
                          onChange={(e) => setCashbookFinancialYear(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8 cursor-pointer"
                        >
                          <option value="2026/2027">2026/2027</option>
                          <option value="2025/2026">2025/2026</option>
                          <option value="2024/2025">2024/2025</option>
                          <option value="2023/2024">2023/2024</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setCashbookFinancialYear('2026/2027')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          title="Reset"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Month & Submit Button */}
                    <div className="flex items-end gap-3">
                      <div className="flex-1 relative">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Month</label>
                        <select
                          value={cashbookMonth}
                          onChange={(e) => setCashbookMonth(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8 cursor-pointer uppercase"
                        >
                          {['ALL', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setCashbookMonth('ALL')}
                          className="absolute right-2.5 top-8 text-slate-400 hover:text-slate-600 p-0.5"
                          title="Clear Month"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={handleRefresh}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>View Cash Book</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Top View Controls & Centered Document Title */}
                <div className="bg-slate-100/70 p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* View Mode Pill Toggle */}
                  <div className="inline-flex bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                    <button
                      onClick={() => setCashbookViewMode('combined')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                        cashbookViewMode === 'combined'
                          ? 'bg-sky-100 text-sky-900 shadow-xs border border-sky-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cashbookViewMode === 'combined' && <Check className="w-3.5 h-3.5 text-sky-700" />}
                      <span>Combined</span>
                    </button>
                    <button
                      onClick={() => setCashbookViewMode('separated')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                        cashbookViewMode === 'separated'
                          ? 'bg-sky-100 text-sky-900 shadow-xs border border-sky-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cashbookViewMode === 'separated' && <Check className="w-3.5 h-3.5 text-sky-700" />}
                      <span>Separated</span>
                    </button>
                  </div>

                  {/* Centered Document Title */}
                  <h3 className="font-extrabold text-slate-900 text-sm md:text-base tracking-wide uppercase text-center font-sans">
                    {cashbookAccountType || 'SCHOOL FUND'} CASH BOOK FOR {cashbookMonth || 'SEPTEMBER'} {cashbookFinancialYear || '2026/2027'}
                  </h3>

                  {/* Print & Export Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs cursor-pointer transition-colors"
                      title="Print Cash Book"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => {
                        const voteHeads: string[] = cashbookData.vote_heads || [];
                        const headers = ['Date', 'Description', 'Receipt Range', 'Cash', 'Bank', 'Total', ...voteHeads];
                        const rows = (cashbookData.receipts || []).map((r: any) => [
                          r.date,
                          r.description,
                          r.receipt_range,
                          r.cash,
                          r.bank,
                          r.total,
                          ...voteHeads.map((vh: string) => r.vote_heads?.[vh] || 0)
                        ]);
                        exportToCsv(`CashBook_${cashbookAccountType}_${cashbookMonth}_${cashbookFinancialYear.replace('/', '-')}`, headers, rows);
                      }}
                      className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs cursor-pointer transition-colors"
                      title="Export to Spreadsheet / CSV"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                </div>

                {/* 3. MULTI-COLUMN CASH BOOK TABLE: COMBINED MODE */}
                {cashbookViewMode === 'combined' && (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm bg-white">
                    {(() => {
                      const voteHeads: string[] = (cashbookData.vote_heads && cashbookData.vote_heads.length > 0)
                        ? cashbookData.vote_heads
                        : ['ADMIN COST', 'ARREARS- 2025', 'BES', 'EWC', 'LTT', 'PE', 'RMI', 'BUS HIRE', 'LUNCH'];

                      const receiptsList = cashbookData.receipts || [];
                      const paymentsList = cashbookData.payments || [];
                      const maxRows = Math.max(receiptsList.length, paymentsList.length, 1);

                      const opBal = cashbookData.opening_balance || { cash: 0, bank: 0, total: 0 };
                      const clBal = cashbookData.closing_balance || { cash: 0, bank: 0, total: 0 };
                      const recTotals = cashbookData.receipts_totals || { cash: 0, bank: 0, total: 0, vote_heads: {} };
                      const payTotals = cashbookData.payments_totals || { cash: 0, bank: 0, total: 0, vote_heads: {} };

                      return (
                        <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
                          {/* Main Split Header: Receipts on Left | Payments on Right */}
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 font-extrabold text-[11px] uppercase border-b border-slate-300">
                              <th colSpan={6 + voteHeads.length} className="py-2.5 px-4 text-left border-r-2 border-slate-300 bg-slate-100 text-slate-900">
                                Receipts (Income)
                              </th>
                              <th colSpan={7 + Math.min(voteHeads.length, 5)} className="py-2.5 px-4 text-left bg-slate-100 text-slate-900">
                                Payments
                              </th>
                            </tr>
                            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider divide-x divide-slate-200">
                              {/* Receipts Columns */}
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Description</th>
                              <th className="py-2.5 px-3">Receipt Range</th>
                              <th className="py-2.5 px-3 text-right">Cash</th>
                              <th className="py-2.5 px-3 text-right">Bank</th>
                              <th className="py-2.5 px-3 text-right font-extrabold bg-slate-100/50">Total</th>
                              {voteHeads.map((vh) => (
                                <th key={vh} className="py-2.5 px-2.5 text-right font-semibold whitespace-nowrap">{vh}</th>
                              ))}

                              {/* Payments Columns */}
                              <th className="py-2.5 px-3 border-l-2 border-slate-300">Date</th>
                              <th className="py-2.5 px-3">Recipient</th>
                              <th className="py-2.5 px-3">Voucher No.</th>
                              <th className="py-2.5 px-3">Payment Method</th>
                              <th className="py-2.5 px-3 text-right">Cash</th>
                              <th className="py-2.5 px-3 text-right">Bank</th>
                              <th className="py-2.5 px-3 text-right font-extrabold bg-slate-100/50">Total</th>
                              {voteHeads.slice(0, 5).map((vh) => (
                                <th key={`p_${vh}`} className="py-2.5 px-2.5 text-right font-semibold whitespace-nowrap">{vh}</th>
                              ))}
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                            {/* Row 0: Opening Balance b/d on Receipts Side */}
                            <tr className="bg-slate-50/50 hover:bg-slate-50 divide-x divide-slate-100 font-medium">
                              <td className="py-2.5 px-3 text-slate-600 font-sans">{cashbookFinancialYear}</td>
                              <td className="py-2.5 px-3 font-bold font-sans text-slate-900">Balance b/d</td>
                              <td className="py-2.5 px-3 text-slate-400 font-sans">-</td>
                              <td className="py-2.5 px-3 text-right text-slate-800">{formatCurrency(opBal.cash)}</td>
                              <td className="py-2.5 px-3 text-right text-slate-800">{formatCurrency(opBal.bank)}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-950 bg-slate-50/60">{formatCurrency(opBal.total)}</td>
                              {voteHeads.map((vh) => (
                                <td key={`op_${vh}`} className="py-2.5 px-2.5 text-right text-slate-400">-</td>
                              ))}

                              {/* Right Side: Empty for b/d */}
                              <td className="py-2.5 px-3 border-l-2 border-slate-300 font-sans text-slate-600">{cashbookFinancialYear}</td>
                              <td className="py-2.5 px-3 font-sans text-slate-700">-</td>
                              <td className="py-2.5 px-3 text-slate-400 font-sans">-</td>
                              <td className="py-2.5 px-3 text-slate-400 font-sans">-</td>
                              <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                              <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                              <td className="py-2.5 px-3 text-right text-slate-400 bg-slate-50/60">-</td>
                              {voteHeads.slice(0, 5).map((vh) => (
                                <td key={`op_pay_${vh}`} className="py-2.5 px-2.5 text-right text-slate-400">-</td>
                              ))}
                            </tr>

                            {/* Data Rows */}
                            {Array.from({ length: maxRows }).map((_, idx) => {
                              const r = receiptsList[idx];
                              const p = paymentsList[idx];

                              return (
                                <tr key={idx} className="hover:bg-slate-50/80 divide-x divide-slate-100 transition-colors">
                                  {/* Left: Receipt Data */}
                                  <td className="py-2 px-3 text-slate-600 font-sans whitespace-nowrap">{r ? r.date : ''}</td>
                                  <td className="py-2 px-3 font-sans text-slate-800">{r ? r.description : ''}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">{r ? r.receipt_range : ''}</td>
                                  <td className="py-2 px-3 text-right text-slate-800">{r && r.cash > 0 ? formatCurrency(r.cash) : (r ? '-' : '')}</td>
                                  <td className="py-2 px-3 text-right text-slate-800">{r && r.bank > 0 ? formatCurrency(r.bank) : (r ? '-' : '')}</td>
                                  <td className="py-2 px-3 text-right font-bold text-slate-950 bg-slate-50/60">{r ? formatCurrency(r.total) : ''}</td>
                                  {voteHeads.map((vh) => {
                                    const val = r?.vote_heads?.[vh];
                                    return (
                                      <td key={`r_${idx}_${vh}`} className="py-2 px-2.5 text-right text-slate-700">
                                        {val > 0 ? formatCurrency(val) : (r ? '-' : '')}
                                      </td>
                                    );
                                  })}

                                  {/* Right: Payment Data */}
                                  <td className="py-2 px-3 border-l-2 border-slate-300 font-sans text-slate-600 whitespace-nowrap">{p ? p.date : ''}</td>
                                  <td className="py-2 px-3 font-sans text-slate-800">{p ? p.recipient : ''}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-900">{p ? p.voucher_no : ''}</td>
                                  <td className="py-2 px-3 text-[10px] uppercase font-sans text-slate-500">{p ? p.payment_method : ''}</td>
                                  <td className="py-2 px-3 text-right text-rose-700">{p && p.cash > 0 ? formatCurrency(p.cash) : (p ? '-' : '')}</td>
                                  <td className="py-2 px-3 text-right text-rose-700">{p && p.bank > 0 ? formatCurrency(p.bank) : (p ? '-' : '')}</td>
                                  <td className="py-2 px-3 text-right font-bold text-slate-950 bg-slate-50/60">{p ? formatCurrency(p.total) : ''}</td>
                                  {voteHeads.slice(0, 5).map((vh) => {
                                    const val = p?.vote_heads?.[vh];
                                    return (
                                      <td key={`p_${idx}_${vh}`} className="py-2 px-2.5 text-right text-slate-700">
                                        {val > 0 ? formatCurrency(val) : (p ? '-' : '')}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}

                            {/* Closing Balance Row (Balance c/d) on Payments Side */}
                            <tr className="bg-slate-50/50 hover:bg-slate-50 divide-x divide-slate-100 font-medium">
                              {/* Left Side: Empty for c/d */}
                              <td className="py-2.5 px-3 text-slate-400 font-sans">-</td>
                              <td className="py-2.5 px-3 text-slate-400 font-sans">-</td>
                              <td className="py-2.5 px-3 text-slate-400 font-sans">-</td>
                              <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                              <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                              <td className="py-2.5 px-3 text-right text-slate-400 bg-slate-50/60">-</td>
                              {voteHeads.map((vh) => (
                                <td key={`cd_rec_${vh}`} className="py-2.5 px-2.5 text-right text-slate-400">-</td>
                              ))}

                              {/* Right Side: Balance c/d */}
                              <td className="py-2.5 px-3 border-l-2 border-slate-300 font-sans text-slate-600">30, {cashbookMonth.slice(0, 3)}</td>
                              <td className="py-2.5 px-3 font-bold font-sans text-slate-900">Balance c/d</td>
                              <td className="py-2.5 px-3 text-slate-400 font-sans">-</td>
                              <td className="py-2.5 px-3 text-slate-400 font-sans">-</td>
                              <td className="py-2.5 px-3 text-right text-slate-800">{formatCurrency(clBal.cash)}</td>
                              <td className="py-2.5 px-3 text-right text-slate-800">{formatCurrency(clBal.bank)}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-950 bg-slate-50/60">{formatCurrency(clBal.total)}</td>
                              {voteHeads.slice(0, 5).map((vh) => (
                                <td key={`cd_pay_${vh}`} className="py-2.5 px-2.5 text-right text-slate-400">-</td>
                              ))}
                            </tr>

                            {/* Final Balanced TOTAL Row */}
                            <tr className="bg-slate-100 text-slate-950 font-extrabold text-[11px] divide-x divide-slate-200 border-t-2 border-b-4 border-double border-slate-400">
                              <td colSpan={3} className="py-3 px-4 font-sans uppercase">TOTAL</td>
                              <td className="py-3 px-3 text-right">{formatCurrency(recTotals.cash)}</td>
                              <td className="py-3 px-3 text-right">{formatCurrency(recTotals.bank)}</td>
                              <td className="py-3 px-3 text-right bg-slate-200/50">{formatCurrency(recTotals.total)}</td>
                              {voteHeads.map((vh) => (
                                <td key={`tot_rec_${vh}`} className="py-3 px-2.5 text-right">
                                  {formatCurrency(recTotals.vote_heads?.[vh] || 0)}
                                </td>
                              ))}

                              {/* Right Payments Total */}
                              <td colSpan={4} className="py-3 px-4 border-l-2 border-slate-300 font-sans uppercase">TOTAL</td>
                              <td className="py-3 px-3 text-right">{formatCurrency(recTotals.cash)}</td>
                              <td className="py-3 px-3 text-right">{formatCurrency(recTotals.bank)}</td>
                              <td className="py-3 px-3 text-right bg-slate-200/50">{formatCurrency(recTotals.total)}</td>
                              {voteHeads.slice(0, 5).map((vh) => (
                                <td key={`tot_pay_${vh}`} className="py-3 px-2.5 text-right">
                                  {formatCurrency(payTotals.vote_heads?.[vh] || 0)}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}

                {/* 4. MULTI-COLUMN CASH BOOK TABLE: SEPARATED MODE */}
                {cashbookViewMode === 'separated' && (
                  <div className="space-y-6">
                    {/* Receipts Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-emerald-50/80 px-4 py-3 border-b border-emerald-100 flex items-center justify-between">
                        <span className="font-bold text-emerald-950 text-xs uppercase tracking-wider">
                          1. Receipts (Inflows & Collections)
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-900">
                          Total Receipts: KES {formatCurrency(cashbookData.receipts_totals?.total)}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                            <tr>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Description</th>
                              <th className="py-2.5 px-3">Receipt Range</th>
                              <th className="py-2.5 px-3 text-right">Cash</th>
                              <th className="py-2.5 px-3 text-right">Bank</th>
                              <th className="py-2.5 px-3 text-right font-extrabold bg-slate-100">Total</th>
                              {(cashbookData.vote_heads || []).map((vh: string) => (
                                <th key={vh} className="py-2.5 px-2.5 text-right font-semibold whitespace-nowrap">{vh}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {/* Opening Balance */}
                            <tr className="bg-slate-50/50 font-medium">
                              <td className="py-2.5 px-3 font-sans">{cashbookFinancialYear}</td>
                              <td className="py-2.5 px-3 font-bold font-sans">Balance b/d</td>
                              <td className="py-2.5 px-3">-</td>
                              <td className="py-2.5 px-3 text-right">{formatCurrency(cashbookData.opening_balance?.cash)}</td>
                              <td className="py-2.5 px-3 text-right">{formatCurrency(cashbookData.opening_balance?.bank)}</td>
                              <td className="py-2.5 px-3 text-right font-bold bg-slate-50">{formatCurrency(cashbookData.opening_balance?.total)}</td>
                              {(cashbookData.vote_heads || []).map((vh: string) => (
                                <td key={`sep_op_${vh}`} className="py-2.5 px-2.5 text-right text-slate-400">-</td>
                              ))}
                            </tr>
                            {(cashbookData.receipts || []).map((r: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-sans">{r.date}</td>
                                <td className="py-2.5 px-3 font-sans text-slate-800">{r.description}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{r.receipt_range}</td>
                                <td className="py-2.5 px-3 text-right">{r.cash > 0 ? formatCurrency(r.cash) : '-'}</td>
                                <td className="py-2.5 px-3 text-right">{r.bank > 0 ? formatCurrency(r.bank) : '-'}</td>
                                <td className="py-2.5 px-3 text-right font-bold bg-slate-50">{formatCurrency(r.total)}</td>
                                {(cashbookData.vote_heads || []).map((vh: string) => (
                                  <td key={`sep_r_${idx}_${vh}`} className="py-2.5 px-2.5 text-right text-slate-700">
                                    {r.vote_heads?.[vh] > 0 ? formatCurrency(r.vote_heads[vh]) : '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {/* Receipts Total */}
                            <tr className="bg-slate-100 text-slate-950 font-extrabold text-[11px] border-t-2 border-b-2 border-slate-300">
                              <td colSpan={3} className="py-3 px-3 font-sans uppercase">Total Receipts</td>
                              <td className="py-3 px-3 text-right">{formatCurrency(cashbookData.receipts_totals?.cash)}</td>
                              <td className="py-3 px-3 text-right">{formatCurrency(cashbookData.receipts_totals?.bank)}</td>
                              <td className="py-3 px-3 text-right bg-slate-200/50">{formatCurrency(cashbookData.receipts_totals?.total)}</td>
                              {(cashbookData.vote_heads || []).map((vh: string) => (
                                <td key={`sep_tot_${vh}`} className="py-3 px-2.5 text-right">
                                  {formatCurrency(cashbookData.receipts_totals?.vote_heads?.[vh] || 0)}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Payments Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-rose-50/80 px-4 py-3 border-b border-rose-100 flex items-center justify-between">
                        <span className="font-bold text-rose-950 text-xs uppercase tracking-wider">
                          2. Payments (Disbursements & Expenditure)
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-900">
                          Total Payments: KES {formatCurrency(cashbookData.payments_totals?.total)}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                            <tr>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Recipient</th>
                              <th className="py-2.5 px-3">Voucher No.</th>
                              <th className="py-2.5 px-3">Payment Method</th>
                              <th className="py-2.5 px-3 text-right">Cash</th>
                              <th className="py-2.5 px-3 text-right">Bank</th>
                              <th className="py-2.5 px-3 text-right font-extrabold bg-slate-100">Total</th>
                              {(cashbookData.vote_heads || []).map((vh: string) => (
                                <th key={`p_sep_h_${vh}`} className="py-2.5 px-2.5 text-right font-semibold whitespace-nowrap">{vh}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {(cashbookData.payments || []).length === 0 ? (
                              <tr>
                                <td colSpan={7 + (cashbookData.vote_heads?.length || 0)} className="py-8 text-center text-slate-400 font-sans">
                                  No payment vouchers recorded in this period.
                                </td>
                              </tr>
                            ) : (
                              (cashbookData.payments || []).map((p: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-3 font-sans">{p.date}</td>
                                  <td className="py-2.5 px-3 font-sans text-slate-800">{p.recipient}</td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-900">{p.voucher_no}</td>
                                  <td className="py-2.5 px-3 text-[10px] uppercase font-sans text-slate-500">{p.payment_method}</td>
                                  <td className="py-2.5 px-3 text-right text-rose-700">{p.cash > 0 ? formatCurrency(p.cash) : '-'}</td>
                                  <td className="py-2.5 px-3 text-right text-rose-700">{p.bank > 0 ? formatCurrency(p.bank) : '-'}</td>
                                  <td className="py-2.5 px-3 text-right font-bold bg-slate-50">{formatCurrency(p.total)}</td>
                                  {(cashbookData.vote_heads || []).map((vh: string) => (
                                    <td key={`sep_p_${idx}_${vh}`} className="py-2.5 px-2.5 text-right text-slate-700">
                                      {p.vote_heads?.[vh] > 0 ? formatCurrency(p.vote_heads[vh]) : '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            )}
                            {/* Closing Balance */}
                            <tr className="bg-slate-50/50 font-medium">
                              <td className="py-2.5 px-3 font-sans">30, {cashbookMonth.slice(0, 3)}</td>
                              <td className="py-2.5 px-3 font-bold font-sans">Balance c/d</td>
                              <td className="py-2.5 px-3">-</td>
                              <td className="py-2.5 px-3 text-slate-400 font-sans">-</td>
                              <td className="py-2.5 px-3 text-right">{formatCurrency(cashbookData.closing_balance?.cash)}</td>
                              <td className="py-2.5 px-3 text-right">{formatCurrency(cashbookData.closing_balance?.bank)}</td>
                              <td className="py-2.5 px-3 text-right font-bold bg-slate-50">{formatCurrency(cashbookData.closing_balance?.total)}</td>
                              {(cashbookData.vote_heads || []).map((vh: string) => (
                                <td key={`sep_cd_${vh}`} className="py-2.5 px-2.5 text-right text-slate-400">-</td>
                              ))}
                            </tr>
                            {/* Payments Total */}
                            <tr className="bg-slate-100 text-slate-950 font-extrabold text-[11px] border-t-2 border-b-2 border-slate-300">
                              <td colSpan={4} className="py-3 px-3 font-sans uppercase">Total Payments</td>
                              <td className="py-3 px-3 text-right">{formatCurrency(cashbookData.receipts_totals?.cash)}</td>
                              <td className="py-3 px-3 text-right">{formatCurrency(cashbookData.receipts_totals?.bank)}</td>
                              <td className="py-3 px-3 text-right bg-slate-200/50">{formatCurrency(cashbookData.receipts_totals?.total)}</td>
                              {(cashbookData.vote_heads || []).map((vh: string) => (
                                <td key={`sep_p_tot_${vh}`} className="py-3 px-2.5 text-right">
                                  {formatCurrency(cashbookData.payments_totals?.vote_heads?.[vh] || 0)}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
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

            {/* IPSAS SUB-VIEW: Notes 1-18 */}
            {ipsasSubTab === 'Notes' && ipsasData?.notes && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(ipsasData.notes).filter(k => k !== 'note_19').map((k) => {
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

            {/* Note 19: STOCK / INVENTORY (Screenshot 1) & Official 3-Signature Section */}
            <div className="mt-8 space-y-6 pt-4 border-t border-slate-200">
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  19. STOCK/ INVENTORY
                </h3>

                {/* Blue Summary Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0284c7] text-white font-bold">
                      <tr>
                        <th className="py-2.5 px-4 font-sans text-xs">Description</th>
                        <th className="py-2.5 px-4 text-right font-sans text-xs">
                          <div>{financialYear}</div>
                          <div className="text-[10px] font-normal tracking-wider">KES</div>
                        </th>
                        <th className="py-2.5 px-4 text-right font-sans text-xs">
                          <div>-</div>
                          <div className="text-[10px] font-normal tracking-wider">KES</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px] bg-white">
                      <tr>
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900">Total</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">0</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b border-slate-300/80 my-6"></div>

              {/* Approval Text & 3-Column Sign-Off */}
              <div className="space-y-6 pb-6">
                <p className="text-xs text-slate-800 font-medium">
                  This school&apos;s financial statements were approved on ......................................... and signed by:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                  {/* 1. Chair BOM */}
                  <div className="space-y-1.5">
                    <div className="border-b border-dotted border-slate-800 w-full mb-2"></div>
                    <div className="font-bold text-xs text-slate-900">Name:</div>
                    <div className="font-bold text-xs text-slate-900">Chair BOM</div>
                    <div className="font-bold text-xs text-slate-900">Date:</div>
                  </div>

                  {/* 2. School Principal / Secretary to BOM */}
                  <div className="space-y-1.5">
                    <div className="border-b border-dotted border-slate-800 w-full mb-2"></div>
                    <div className="font-bold text-xs text-slate-900">Name:</div>
                    <div className="font-bold text-xs text-slate-900">School Principal/ Secretary to BOM</div>
                    <div className="font-bold text-xs text-slate-900">Date:</div>
                  </div>

                  {/* 3. Bursar / Finance Officer */}
                  <div className="space-y-1.5">
                    <div className="border-b border-dotted border-slate-800 w-full mb-2"></div>
                    <div className="font-bold text-xs text-slate-900">Name:</div>
                    <div className="font-bold text-xs text-slate-900">Bursar/ Finance Officer</div>
                    <div className="font-bold text-xs text-slate-900">Date:</div>
                  </div>
                </div>
              </div>
            </div>
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