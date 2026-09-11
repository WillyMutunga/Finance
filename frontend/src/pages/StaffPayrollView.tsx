import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import {
  Users,
  DollarSign,
  Settings,
  Plus,
  Printer,
  Download,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  X,
  FileText,
  CreditCard,
  Building,
  ShieldCheck,
  Send,
  Calendar,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp,
  Percent,
  Edit3,
  Trash2,
  Save,
  HelpCircle,
  Calculator,
  Gift,
  Coins,
  Receipt,
  RefreshCw,
  Landmark,
  Eye
} from 'lucide-react';
import { ApiService } from '../services/api';

interface StaffPayrollViewProps {
  initialSubTab?: string;
  currentRole: UserRole;
}

export const StaffPayrollView: React.FC<StaffPayrollViewProps> = ({ initialSubTab = 'staff-management', currentRole }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState('July 2026');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Setup & Config State
  const [statutoryRates, setStatutoryRates] = useState<any>({
    nssf_max: 2160,
    shif_rate: 2.75,
    housing_levy_employee: 1.5,
    housing_levy_employer: 1.5,
    personal_relief: 2400,
    insurance_relief_rate: 15
  });

  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [allowancesList, setAllowancesList] = useState<any[]>([]);
  const [deductionsList, setDeductionsList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // 2. Payroll Period Summary State
  const [payrollData, setPayrollData] = useState<{
    period_month: string;
    status: string;
    summary: {
      staff_count: number;
      total_gross: number;
      total_taxable: number;
      total_paye: number;
      total_nssf: number;
      total_shif: number;
      total_housing_levy: number;
      total_statutory: number;
      total_custom_deductions: number;
      total_net_payable: number;
    };
    lines: any[];
  }>({
    period_month: 'July 2026',
    status: 'Approved',
    summary: {
      staff_count: 0,
      total_gross: 0,
      total_taxable: 0,
      total_paye: 0,
      total_nssf: 0,
      total_shif: 0,
      total_housing_levy: 0,
      total_statutory: 0,
      total_custom_deductions: 0,
      total_net_payable: 0
    },
    lines: []
  });

  // Modal States
  const [showEditRatesModal, setShowEditRatesModal] = useState(false);
  const [showPayeBandsModal, setShowPayeBandsModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddAllowanceModal, setShowAddAllowanceModal] = useState(false);
  const [showAddDeductionModal, setShowAddDeductionModal] = useState(false);

  // Form States
  const [tempRates, setTempRates] = useState<any>({});
  const [newDept, setNewDept] = useState({ name: '', code: '', head_title: '', vote_head_name: 'Tuition & Teaching Materials' });
  const [newAllowance, setNewAllowance] = useState({ name: '', type: 'Fixed', amount: '', taxable: true, applies_to: 'All Staff' });
  const [newDeduction, setNewDeduction] = useState({ name: '', amount: '', type: 'Fixed Monthly', recipient: '' });

  const [newStaff, setNewStaff] = useState({
    first_name: '',
    last_name: '',
    role: 'Teacher',
    department_name: 'Academic / Teaching',
    phone: '',
    email: '',
    national_id: '',
    kra_pin: '',
    nssf_number: '',
    nhif_number: '',
    bank_name: 'Kenya Commercial Bank (KCB)',
    bank_branch: 'Machakos Branch',
    bank_account_number: '',
    basic_salary: '50000',
    house_allowance: '0',
    commuter_allowance: '0',
    other_allowances: '0',
    custom_deductions: '500'
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    loadAllData();
  }, [activeSubTab, selectedPayrollMonth, deptFilter]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'setup-configs') {
        const [rRes, dRes, aRes, dedRes] = await Promise.all([
          ApiService.getStatutoryRates(),
          ApiService.getStaffDepartments(),
          ApiService.getStaffAllowances(),
          ApiService.getStaffDeductions()
        ]);
        if (rRes && rRes.data) setStatutoryRates(rRes.data);
        if (dRes && dRes.data) setDepartmentsList(dRes.data);
        if (aRes && aRes.data) setAllowancesList(aRes.data);
        if (dedRes && dedRes.data) setDeductionsList(dedRes.data);
      } else if (activeSubTab === 'staff-management') {
        const [sRes, dRes, rRes] = await Promise.all([
          ApiService.getStaffMembers({ department: deptFilter !== 'ALL' ? deptFilter : undefined, q: search || undefined }),
          ApiService.getStaffDepartments(),
          ApiService.getStatutoryRates()
        ]);
        if (sRes && sRes.data) setStaffList(sRes.data);
        if (dRes && dRes.data) setDepartmentsList(dRes.data);
        if (rRes && rRes.data) setStatutoryRates(rRes.data);
      } else if (activeSubTab === 'payroll-management') {
        const [pRes, rRes] = await Promise.all([
          ApiService.getPayrollPeriod(selectedPayrollMonth),
          ApiService.getStatutoryRates()
        ]);
        if (pRes && pRes.data) setPayrollData(pRes.data);
        if (rRes && rRes.data) setStatutoryRates(rRes.data);
      }
    } catch (e) {
      console.error('Error loading staff/payroll data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Setup & Configs
  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await ApiService.updateStatutoryRates(tempRates);
      if (res && res.data) {
        setStatutoryRates(res.data);
        setShowEditRatesModal(false);
        showToast('Statutory rates updated successfully.');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating statutory rates');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await ApiService.createStaffDepartment(newDept);
      if (res && res.data) {
        setDepartmentsList([...departmentsList, res.data]);
        setShowAddDeptModal(false);
        setNewDept({ name: '', code: '', head_title: '', vote_head_name: 'Tuition & Teaching Materials' });
        showToast(`Department "${res.data.name}" added successfully.`);
      }
    } catch (e: any) {
      alert(e.message || 'Error adding department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove department "${name}"?`)) return;
    try {
      await ApiService.deleteStaffDepartment(id);
      setDepartmentsList(departmentsList.filter((d) => d.id !== id));
      showToast(`Department "${name}" removed.`);
    } catch (e: any) {
      alert(e.message || 'Error deleting department');
    }
  };

  const handleAddAllowance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllowance.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await ApiService.createStaffAllowance({
        name: newAllowance.name,
        type: newAllowance.type,
        amount: parseFloat(newAllowance.amount) || 0,
        taxable: newAllowance.taxable,
        applies_to: newAllowance.applies_to
      });
      if (res && res.data) {
        setAllowancesList([...allowancesList, res.data]);
        setShowAddAllowanceModal(false);
        setNewAllowance({ name: '', type: 'Fixed', amount: '', taxable: true, applies_to: 'All Staff' });
        showToast(`Allowance "${res.data.name}" added.`);
      }
    } catch (e: any) {
      alert(e.message || 'Error adding allowance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAllowance = async (id: string, name: string) => {
    if (!confirm(`Remove allowance "${name}"?`)) return;
    try {
      await ApiService.deleteStaffAllowance(id);
      setAllowancesList(allowancesList.filter((a) => a.id !== id));
      showToast(`Allowance "${name}" removed.`);
    } catch (e: any) {
      alert(e.message || 'Error deleting allowance');
    }
  };

  const handleAddDeduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeduction.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await ApiService.createStaffDeduction({
        name: newDeduction.name,
        amount: parseFloat(newDeduction.amount) || 0,
        type: newDeduction.type,
        recipient: newDeduction.recipient
      });
      if (res && res.data) {
        setDeductionsList([...deductionsList, res.data]);
        setShowAddDeductionModal(false);
        setNewDeduction({ name: '', amount: '', type: 'Fixed Monthly', recipient: '' });
        showToast(`Deduction "${res.data.name}" added.`);
      }
    } catch (e: any) {
      alert(e.message || 'Error adding deduction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDeduction = async (id: string, name: string) => {
    if (!confirm(`Remove deduction "${name}"?`)) return;
    try {
      await ApiService.deleteStaffDeduction(id);
      setDeductionsList(deductionsList.filter((d) => d.id !== id));
      showToast(`Deduction "${name}" removed.`);
    } catch (e: any) {
      alert(e.message || 'Error deleting deduction');
    }
  };

  // Handlers for Staff Management
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.first_name.trim()) return;
    setSubmitting(true);
    try {
      const res = await ApiService.createStaffMember({
        first_name: newStaff.first_name,
        last_name: newStaff.last_name,
        role: newStaff.role,
        department_name: newStaff.department_name,
        phone: newStaff.phone,
        email: newStaff.email,
        national_id: newStaff.national_id,
        kra_pin: newStaff.kra_pin,
        nssf_number: newStaff.nssf_number,
        nhif_number: newStaff.nhif_number,
        bank_name: newStaff.bank_name,
        bank_branch: newStaff.bank_branch,
        bank_account_number: newStaff.bank_account_number,
        basic_salary: parseFloat(newStaff.basic_salary) || 0,
        house_allowance: parseFloat(newStaff.house_allowance) || 0,
        commuter_allowance: parseFloat(newStaff.commuter_allowance) || 0,
        other_allowances: parseFloat(newStaff.other_allowances) || 0,
        custom_deductions: parseFloat(newStaff.custom_deductions) || 0
      });
      if (res && res.data) {
        setStaffList([res.data, ...staffList]);
        setShowAddStaffModal(false);
        setNewStaff({
          first_name: '',
          last_name: '',
          role: 'Teacher',
          department_name: 'Academic / Teaching',
          phone: '',
          email: '',
          national_id: '',
          kra_pin: '',
          nssf_number: '',
          nhif_number: '',
          bank_name: 'Kenya Commercial Bank (KCB)',
          bank_branch: 'Machakos Branch',
          bank_account_number: '',
          basic_salary: '50000',
          house_allowance: '0',
          commuter_allowance: '0',
          other_allowances: '0',
          custom_deductions: '500'
        });
        showToast(`Staff member ${res.data.name} enrolled successfully.`);
      }
    } catch (e: any) {
      alert(e.message || 'Error registering staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove staff member "${name}"?`)) return;
    try {
      await ApiService.deleteStaffMember(id);
      setStaffList(staffList.filter((s) => s.id !== id));
      showToast(`Staff member "${name}" removed.`);
    } catch (e: any) {
      alert(e.message || 'Error deleting staff member');
    }
  };

  // Handlers for Payroll Processing
  const handleProcessPayroll = async () => {
    if (staffList.length === 0 && payrollData.lines.length === 0) {
      alert('Please onboard staff members before running payroll.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await ApiService.processMonthlyPayroll(selectedPayrollMonth);
      if (res && res.data) {
        showToast(`Monthly Payroll for ${selectedPayrollMonth} processed and locked.`);
        loadAllData();
      }
    } catch (e: any) {
      alert(e.message || 'Error processing payroll');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportBankEFT = () => {
    const lines = payrollData.lines;
    if (lines.length === 0) {
      alert('No payroll lines available to export.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Staff Number,Employee Name,Bank Name,Account Number,Net Payable (KES),Reference\n';
    lines.forEach((l) => {
      csvContent += `"${l.staff_number}","${l.name}","${l.bank_name || 'KCB'}","${l.bank_account || '1100000000'}",${l.net_pay},"SALARY-${selectedPayrollMonth.replace(/\s+/g, '')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bank_EFT_Transfer_${selectedPayrollMonth.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewPayslip = async (staff: any) => {
    try {
      const res = await ApiService.getStaffPayslip(staff.id || staff.staff_id, selectedPayrollMonth);
      if (res && res.data) {
        setShowPayslipModal(res.data);
      } else {
        setShowPayslipModal(staff);
      }
    } catch (e) {
      setShowPayslipModal(staff);
    }
  };

  const formatCurrency = (amt: number) => {
    return 'KES ' + Number(amt || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const subTabs = [
    { id: 'setup-configs', label: 'Setup & Configs', icon: Settings },
    { id: 'staff-management', label: 'Staff Management', icon: Users },
    { id: 'payroll-management', label: 'Payroll Management', icon: DollarSign },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-slate-800 text-xs">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-200 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Sub-Navigation Tabs matching Skysoft Finance */}
      <div className="bg-white rounded-t-xl border-b border-slate-200 px-4 flex items-center gap-6 overflow-x-auto font-medium text-slate-600 shadow-sm">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1.5 py-3.5 border-b-2 font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: STAFF MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'staff-management' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">Teaching and non-teaching personnel directory, compensation, and statutory profiles</p>
            </div>

            {currentRole !== 'auditor' && (
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Staff Member</span>
              </button>
            )}
          </div>

          {/* Search & Action Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative max-w-sm w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold text-[11px]">Filter Dept:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <button onClick={() => loadAllData()} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Role / Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Gross Salary</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No staff members registered yet. Click "+ Add Staff Member" to enroll teachers and non-teaching personnel.
                    </td>
                  </tr>
                ) : (
                  staffList.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.staff_number}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 uppercase">{s.name}</td>
                      <td className="py-3 px-4 text-slate-700">{s.role}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {s.dept}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">{formatCurrency(s.gross_pay)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatCurrency(s.net_pay)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewPayslip(s)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-300"
                        >
                          Payslip
                        </button>
                        {currentRole !== 'auditor' && (
                          <button
                            onClick={() => handleDeleteStaff(s.id, s.name)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete Staff"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: PAYROLL MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'payroll-management' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payroll Processing & Disbursal</h2>
              <p className="text-xs text-slate-500 mt-0.5">Statutory calculations (PAYE, NSSF, NHIF/SHIF, Housing Levy) & Bank EFT files</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedPayrollMonth}
                onChange={(e) => setSelectedPayrollMonth(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm"
              >
                <option value="January 2026">January 2026</option>
                <option value="February 2026">February 2026</option>
                <option value="March 2026">March 2026</option>
                <option value="April 2026">April 2026</option>
                <option value="May 2026">May 2026</option>
                <option value="June 2026">June 2026</option>
                <option value="July 2026">July 2026</option>
                <option value="August 2026">August 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="October 2026">October 2026</option>
                <option value="November 2026">November 2026</option>
                <option value="December 2026">December 2026</option>
              </select>

              <button
                onClick={handleExportBankEFT}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export Bank File</span>
              </button>

              {currentRole !== 'auditor' && (
                <button
                  onClick={handleProcessPayroll}
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>{submitting ? 'Processing...' : 'Process Monthly Payroll'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Gross Salary</span>
              <div className="text-xl font-black text-slate-900 font-mono">{formatCurrency(payrollData.summary.total_gross)}</div>
              <p className="text-[11px] text-slate-500">{payrollData.summary.staff_count} Active employees</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Statutory Deductions</span>
              <div className="text-xl font-black text-rose-600 font-mono">{formatCurrency(payrollData.summary.total_statutory)}</div>
              <p className="text-[11px] text-slate-500">PAYE, NSSF, NHIF/SHIF & Housing Levy</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Take-Home Disbursal</span>
              <div className="text-xl font-black text-emerald-600 font-mono">{formatCurrency(payrollData.summary.total_net_payable)}</div>
              <p className="text-[11px] text-slate-500">Payable via School Bank Account</p>
            </div>
          </div>

          {/* Monthly Payroll Sheet Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Monthly Payroll Sheet ({selectedPayrollMonth})</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Status: {payrollData.status}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Staff Name</th>
                    <th className="py-3 px-4 text-right">Basic / Gross</th>
                    <th className="py-3 px-4 text-right">NSSF (Tier I & II)</th>
                    <th className="py-3 px-4 text-right">NHIF / SHIF</th>
                    <th className="py-3 px-4 text-right">Housing Levy</th>
                    <th className="py-3 px-4 text-right">PAYE Tax</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Net Payable</th>
                    <th className="py-3 px-4 text-center">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payrollData.lines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No active employees in current payroll cycle. Add staff under "Staff Management".
                      </td>
                    </tr>
                  ) : (
                    payrollData.lines.map((s) => (
                      <tr key={s.staff_id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900 uppercase">{s.name}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(s.gross_pay)}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600">-{formatCurrency(s.nssf)}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600">-{formatCurrency(s.nhif)}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600">-{formatCurrency(s.housing_levy)}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600">-{formatCurrency(s.paye)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatCurrency(s.net_pay)}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleViewPayslip(s)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: SETUP & CONFIGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'setup-configs' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <span>Staff & Payroll Configurations</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory deductions, tax relief, cost center departments, recurring allowances, and staff welfare funds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Card 1: Statutory Tax & Pension Rates */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Percent className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Statutory Tax & Pension Rates</h3>
                </div>
                {currentRole !== 'auditor' && (
                  <button
                    onClick={() => {
                      setTempRates({ ...statutoryRates });
                      setShowEditRatesModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Rates</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">NSSF Tier I & II Max Contribution:</span>
                  <span className="font-bold font-mono text-slate-900">{formatCurrency(statutoryRates.nssf_max)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">NHIF / SHIF Standard Health Rate:</span>
                  <span className="font-bold font-mono text-slate-900">{statutoryRates.shif_rate}% of Gross</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">Affordable Housing Levy:</span>
                  <span className="font-bold font-mono text-slate-900">{statutoryRates.housing_levy_employee}% Employee + {statutoryRates.housing_levy_employer}% Employer</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">KRA Personal Tax Relief:</span>
                  <span className="font-bold font-mono text-slate-900">{formatCurrency(statutoryRates.personal_relief)} / month</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-600 font-medium">Insurance Relief Rate:</span>
                  <span className="font-bold font-mono text-slate-900">{statutoryRates.insurance_relief_rate}% (Max KES 5,000/mo)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowPayeBandsModal(true)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  <span>View KRA Graduated PAYE Tax Bands</span>
                </button>
              </div>
            </div>

            {/* Card 2: Departments & Cost Centers */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Departments & Cost Centers</h3>
                    <p className="text-[11px] text-slate-400">Expense vote head mapping & operational units</p>
                  </div>
                </div>
                {currentRole !== 'auditor' && (
                  <button
                    onClick={() => {
                      setNewDept({ name: '', code: '', head_title: '', vote_head_name: 'Tuition & Teaching Materials' });
                      setShowAddDeptModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Dept</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs max-h-60 overflow-y-auto pr-1">
                {departmentsList.map((d) => (
                  <div key={d.id} className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{d.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">{d.code}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Linked: {d.vote_head_name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                        {d.status || 'Active'}
                      </span>
                      {currentRole !== 'auditor' && (
                        <button
                          onClick={() => handleDeleteDept(d.id, d.name)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Recurring Allowances & Benefits */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Allowances & Benefits Builder</h3>
                    <p className="text-[11px] text-slate-400">Responsibility, housing, commuter & overtime items</p>
                  </div>
                </div>
                {currentRole !== 'auditor' && (
                  <button
                    onClick={() => {
                      setNewAllowance({ name: '', type: 'Fixed', amount: '', taxable: true, applies_to: 'All Staff' });
                      setShowAddAllowanceModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Allowance</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                {allowancesList.map((alw) => (
                  <div key={alw.id} className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900">{alw.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {formatCurrency(alw.amount)} • {alw.applies_to} • {alw.taxable ? 'Taxable' : 'Tax-Exempt'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                        {alw.status || 'Active'}
                      </span>
                      {currentRole !== 'auditor' && (
                        <button
                          onClick={() => handleDeleteAllowance(alw.id, alw.name)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4: Non-Statutory Deductions & Staff Welfare / Sacco */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Custom Deductions & Sacco Check-off</h3>
                    <p className="text-[11px] text-slate-400">Welfare contributions, Sacco loans & salary advance recovery</p>
                  </div>
                </div>
                {currentRole !== 'auditor' && (
                  <button
                    onClick={() => {
                      setNewDeduction({ name: '', amount: '', type: 'Fixed Monthly', recipient: '' });
                      setShowAddDeductionModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Deduction</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                {deductionsList.map((ded) => (
                  <div key={ded.id} className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900">{ded.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Default: {formatCurrency(ded.amount)} • {ded.type} • Remit to: {ded.recipient}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-100 text-purple-800">
                        {ded.status || 'Active'}
                      </span>
                      {currentRole !== 'auditor' && (
                        <button
                          onClick={() => handleDeleteDeduction(ded.id, ded.name)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT STATUTORY RATES */}
      {/* ========================================================================= */}
      {showEditRatesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Edit Statutory Tax & Deduction Rates</h3>
              </div>
              <button onClick={() => setShowEditRatesModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRates} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">NSSF Tier I & II Max Total (KES)</label>
                <input
                  type="number"
                  value={tempRates.nssf_max}
                  onChange={(e) => setTempRates({ ...tempRates, nssf_max: parseFloat(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">SHIF Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempRates.shif_rate}
                    onChange={(e) => setTempRates({ ...tempRates, shif_rate: parseFloat(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Housing Levy Employee (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempRates.housing_levy_employee}
                    onChange={(e) => setTempRates({ ...tempRates, housing_levy_employee: parseFloat(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Personal Relief (KES/mo)</label>
                  <input
                    type="number"
                    value={tempRates.personal_relief}
                    onChange={(e) => setTempRates({ ...tempRates, personal_relief: parseFloat(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Insurance Relief Rate (%)</label>
                  <input
                    type="number"
                    value={tempRates.insurance_relief_rate}
                    onChange={(e) => setTempRates({ ...tempRates, insurance_relief_rate: parseFloat(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditRatesModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KRA GRADUATED PAYE TAX BANDS */}
      {/* ========================================================================= */}
      {showPayeBandsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">KRA Graduated Monthly PAYE Tax Slabs</h3>
              </div>
              <button onClick={() => setShowPayeBandsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Per the Kenyan Finance Act (Section 5 of Income Tax Act), taxable employment income is subjected to the following individual monthly tax brackets:
              </p>

              <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Monthly Taxable Income Band</th>
                    <th className="p-2.5 text-center">Tax Rate</th>
                    <th className="p-2.5 text-right">Max Tax in Slab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="p-2.5">On the first KES 24,000</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">10.0%</td>
                    <td className="p-2.5 text-right">KES 2,400.00</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">On the next KES 8,333 (24,001 - 32,333)</td>
                    <td className="p-2.5 text-center font-bold text-blue-600">25.0%</td>
                    <td className="p-2.5 text-right">KES 2,083.25</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">On the next KES 467,667 (32,334 - 500,000)</td>
                    <td className="p-2.5 text-center font-bold text-purple-600">30.0%</td>
                    <td className="p-2.5 text-right">KES 140,300.10</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">On the next KES 300,000 (500,001 - 800,000)</td>
                    <td className="p-2.5 text-center font-bold text-amber-600">32.5%</td>
                    <td className="p-2.5 text-right">KES 97,500.00</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">On all income over KES 800,000</td>
                    <td className="p-2.5 text-center font-bold text-rose-600">35.0%</td>
                    <td className="p-2.5 text-right">Excess @ 35%</td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Statutory Reliefs Applied Automatically:</span>
                </div>
                <div>• <strong>Personal Tax Relief:</strong> KES 2,400.00 deducted monthly from computed gross tax.</div>
                <div>• <strong>SHIF Insurance Relief:</strong> 15% of monthly health contribution (up to KES 5,000.00/mo).</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPayeBandsModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD DEPARTMENT */}
      {/* ========================================================================= */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add School Department</h3>
              <button onClick={() => setShowAddDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDept} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science & ICT"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Department Code</label>
                <input
                  type="text"
                  placeholder="e.g. SCI"
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Head of Department Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Science Master"
                  value={newDept.head_title}
                  onChange={(e) => setNewDept({ ...newDept, head_title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Linked Expense Vote Head</label>
                <select
                  value={newDept.vote_head_name}
                  onChange={(e) => setNewDept({ ...newDept, vote_head_name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="Tuition & Teaching Materials">Tuition & Teaching Materials</option>
                  <option value="Administration & Operations">Administration & Operations</option>
                  <option value="Boarding & Kitchen Operations">Boarding & Kitchen Operations</option>
                  <option value="Repairs, Maintenance & Transport">Repairs, Maintenance & Transport</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {submitting ? 'Adding...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD ALLOWANCE */}
      {/* ========================================================================= */}
      {showAddAllowanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add Allowance / Benefit</h3>
              <button onClick={() => setShowAddAllowanceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAllowance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Allowance Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Night Duty / Remedial Allowance"
                  value={newAllowance.name}
                  onChange={(e) => setNewAllowance({ ...newAllowance, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Default Amount (KES)</label>
                  <input
                    type="number"
                    required
                    placeholder="4500"
                    value={newAllowance.amount}
                    onChange={(e) => setNewAllowance({ ...newAllowance, amount: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Applies To</label>
                  <select
                    value={newAllowance.applies_to}
                    onChange={(e) => setNewAllowance({ ...newAllowance, applies_to: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="All Staff">All Staff</option>
                    <option value="Teaching">Teaching Only</option>
                    <option value="Non-Teaching">Non-Teaching</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="taxable-alw"
                  checked={newAllowance.taxable}
                  onChange={(e) => setNewAllowance({ ...newAllowance, taxable: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <label htmlFor="taxable-alw" className="text-slate-700 font-semibold cursor-pointer">
                  Subject to PAYE Tax calculation
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAllowanceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Allowance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD DEDUCTION */}
      {/* ========================================================================= */}
      {showAddDeductionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add Custom Deduction</h3>
              <button onClick={() => setShowAddDeductionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDeduction} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Deduction Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sacco Savings Contribution"
                  value={newDeduction.name}
                  onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Default Amount (KES)</label>
                  <input
                    type="number"
                    required
                    placeholder="2000"
                    value={newDeduction.amount}
                    onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Deduction Type</label>
                  <select
                    value={newDeduction.type}
                    onChange={(e) => setNewDeduction({ ...newDeduction, type: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Fixed Monthly">Fixed Monthly</option>
                    <option value="Voluntary Checkoff">Voluntary Checkoff</option>
                    <option value="Loan Repayment">Loan Repayment</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Remit / Disburse To</label>
                <input
                  type="text"
                  placeholder="e.g. Metropolitan Sacco Account"
                  value={newDeduction.recipient}
                  onChange={(e) => setNewDeduction({ ...newDeduction, recipient: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDeductionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Deduction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ADD STAFF MEMBER */}
      {/* ========================================================================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Add Staff Member / Employee</h3>
              </div>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Peter"
                    value={newStaff.first_name}
                    onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kamau"
                    value={newStaff.last_name}
                    onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Mathematics Teacher"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Department *</label>
                  <select
                    value={newStaff.department_name}
                    onChange={(e) => setNewStaff({ ...newStaff, department_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    {departmentsList.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +254 712 345 678"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">National ID / Passport</label>
                  <input
                    type="text"
                    placeholder="e.g. 28910245"
                    value={newStaff.national_id}
                    onChange={(e) => setNewStaff({ ...newStaff, national_id: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">KRA PIN</label>
                  <input
                    type="text"
                    placeholder="e.g. A001928374X"
                    value={newStaff.kra_pin}
                    onChange={(e) => setNewStaff({ ...newStaff, kra_pin: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">NSSF Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 10294857"
                    value={newStaff.nssf_number}
                    onChange={(e) => setNewStaff({ ...newStaff, nssf_number: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">NHIF / SHIF Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 89201928"
                    value={newStaff.nhif_number}
                    onChange={(e) => setNewStaff({ ...newStaff, nhif_number: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Co-operative Bank"
                    value={newStaff.bank_name}
                    onChange={(e) => setNewStaff({ ...newStaff, bank_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 01129038102900"
                    value={newStaff.bank_account_number}
                    onChange={(e) => setNewStaff({ ...newStaff, bank_account_number: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-900 mb-2">Compensation & Salary Structure (KES)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Basic Salary *</label>
                    <input
                      type="number"
                      required
                      placeholder="50000"
                      value={newStaff.basic_salary}
                      onChange={(e) => setNewStaff({ ...newStaff, basic_salary: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">House Allowance</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newStaff.house_allowance}
                      onChange={(e) => setNewStaff({ ...newStaff, house_allowance: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Custom Deductions</label>
                    <input
                      type="number"
                      placeholder="500"
                      value={newStaff.custom_deductions}
                      onChange={(e) => setNewStaff({ ...newStaff, custom_deductions: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-rose-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {submitting ? 'Enrolling...' : 'Enroll Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: OFFICIAL PRINTABLE PAYSLIP */}
      {/* ========================================================================= */}
      {showPayslipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Official Payslip ({selectedPayrollMonth})</h3>
              </div>
              <button onClick={() => setShowPayslipModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Header Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 uppercase">{showPayslipModal.staff_name || showPayslipModal.name}</h4>
                    <p className="text-slate-500 font-medium">{showPayslipModal.role} • {showPayslipModal.department || showPayslipModal.dept}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      {showPayslipModal.staff_number || showPayslipModal.id}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">{selectedPayrollMonth}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/60 text-slate-600">
                  <div>KRA PIN: <strong className="font-mono text-slate-800">{showPayslipModal.kra_pin || 'A001928374X'}</strong></div>
                  <div>NSSF NO: <strong className="font-mono text-slate-800">{showPayslipModal.nssf_no || showPayslipModal.nssf_number || '10294857'}</strong></div>
                  <div>Bank: <strong className="text-slate-800">{showPayslipModal.bank_name || 'KCB Bank'}</strong></div>
                  <div>A/C No: <strong className="font-mono text-slate-800">{showPayslipModal.bank_account || showPayslipModal.bank_account_number || '1106398408'}</strong></div>
                </div>
              </div>

              {/* Earnings & Deductions Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="space-y-2 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
                  <div className="font-bold text-slate-900 border-b border-emerald-200/60 pb-1.5 flex justify-between">
                    <span>EARNINGS</span>
                    <span>AMOUNT</span>
                  </div>
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Basic Salary:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(showPayslipModal.basic_salary || showPayslipModal.gross_pay)}</span>
                    </div>
                    {showPayslipModal.allowances > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Allowances:</span>
                        <span className="font-bold text-slate-900">{formatCurrency(showPayslipModal.allowances)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-emerald-200/60 font-black text-emerald-900">
                      <span>GROSS PAY:</span>
                      <span>{formatCurrency(showPayslipModal.gross_pay)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2 bg-rose-50/40 p-3 rounded-xl border border-rose-100">
                  <div className="font-bold text-slate-900 border-b border-rose-200/60 pb-1.5 flex justify-between">
                    <span>DEDUCTIONS</span>
                    <span>AMOUNT</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">NSSF Tier I & II:</span>
                      <span className="text-rose-700 font-bold">{formatCurrency(showPayslipModal.total_nssf || showPayslipModal.nssf)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">SHIF / NHIF:</span>
                      <span className="text-rose-700 font-bold">{formatCurrency(showPayslipModal.shif_nhif || showPayslipModal.nhif)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Housing Levy (1.5%):</span>
                      <span className="text-rose-700 font-bold">{formatCurrency(showPayslipModal.housing_levy || (showPayslipModal.gross_pay * 0.015))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">PAYE Tax (Net):</span>
                      <span className="text-rose-700 font-bold">{formatCurrency(showPayslipModal.net_tax_paye || showPayslipModal.paye)}</span>
                    </div>
                    {showPayslipModal.welfare_deductions > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Welfare / Sacco:</span>
                        <span className="text-rose-700 font-bold">{formatCurrency(showPayslipModal.welfare_deductions)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-rose-200/60 font-black text-rose-900">
                      <span>TOTAL DED:</span>
                      <span>{formatCurrency(showPayslipModal.total_deductions || (showPayslipModal.gross_pay - showPayslipModal.net_pay))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Callout */}
              <div className="bg-emerald-600 text-white p-3.5 rounded-xl flex items-center justify-between shadow-md">
                <div>
                  <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">NET PAYABLE SALARY</div>
                  <div className="text-xl font-black font-mono mt-0.5">{formatCurrency(showPayslipModal.net_pay)}</div>
                </div>
                <div className="text-right text-[11px] text-emerald-100">
                  <div>Paid to Account:</div>
                  <div className="font-mono font-bold text-white">{showPayslipModal.bank_account || showPayslipModal.bank_account_number || '1106398408'}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400">System Generated Document • Confirmed & Approved</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Payslip</span>
                </button>
                <button
                  onClick={() => setShowPayslipModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};