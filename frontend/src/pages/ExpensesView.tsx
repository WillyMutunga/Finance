import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { UserRole, Student } from '../types';
import { PaymentVoucherModal } from '../components/PaymentVoucherModal';
import { exportToCsv } from '../utils/exportUtils';
import {
  Receipt,
  Plus,
  Printer,
  Download,
  Search,
  RotateCcw,
  Clock,
  MoreVertical,
  X,
  Building,
  DollarSign,
  FileText,
  Truck,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Wallet,
  Coins,
  Check,
  Trash2,
  Edit3
} from 'lucide-react';

interface ExpensesViewProps {
  currentRole: UserRole;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ currentRole }) => {
  const [activeSubTab, setActiveSubTab] = useState('payment-vouchers');
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Sub-tab specific lists
  const [lpoList, setLpoList] = useState<Array<any>>([]);
  const [billsList, setBillsList] = useState<Array<any>>([]);
  const [suppliersList, setSuppliersList] = useState<Array<any>>([]);
  const [supplierTakeOns, setSupplierTakeOns] = useState<Array<any>>([]);
  const [refundsList, setRefundsList] = useState<Array<any>>([]);
  const [pettyCashData, setPettyCashData] = useState<{ current_float_balance: number; entries: any[] }>({
    current_float_balance: 0,
    entries: []
  });

  // Modals
  const [showAddVoucherModal, setShowAddVoucherModal] = useState(false);
  const [showLPOModal, setShowLPOModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPayBillModal, setShowPayBillModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showTakeOnModal, setShowTakeOnModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showPettyCashModal, setShowPettyCashModal] = useState(false);
  const [selectedVoucherForSlip, setSelectedVoucherForSlip] = useState<any | null>(null);
  const [activeBillToPay, setActiveBillToPay] = useState<any | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4500);
  };

  // Forms
  const [addVoucherForm, setAddVoucherForm] = useState({
    payee_name: '',
    amount: '',
    category_id: '',
    payment_method: 'BANK_TRANSFER',
    description: '',
    lpo_number: '',
    cheque_number: '',
    bank_account: 'Main Operations Account (KCB)'
  });

  const [newLPO, setNewLPO] = useState({
    supplier_name: '',
    supplier_id: '',
    items_description: '',
    quantity_details: '',
    estimated_amount: '',
    delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  const [newBill, setNewBill] = useState({
    supplier_name: '',
    supplier_id: '',
    category_id: '',
    bill_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: '',
    notes: ''
  });

  const [payBillForm, setPayBillForm] = useState({
    amount: '',
    payment_method: 'BANK_TRANSFER',
    notes: ''
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    category: 'Food & Rations',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    bank_name: 'KCB Bank',
    bank_account_no: '',
    kra_pin: '',
    opening_balance: '0'
  });

  const [newTakeOn, setNewTakeOn] = useState({
    supplier_id: '',
    invoice_ref: '',
    invoice_date: new Date().toISOString().split('T')[0],
    amount: '',
    description: 'Historical supplier balance carried forward'
  });

  const [newRefund, setNewRefund] = useState({
    student_id: '',
    amount: '',
    payment_method: 'CHEQUE',
    cheque_number: '',
    bank_account: 'Main School Operating Account',
    recipient_name: 'Parent / Guardian',
    reason: 'Fee overpayment refund upon student transfer / clearance'
  });

  const [newPettyCash, setNewPettyCash] = useState({
    entry_type: 'EXPENSE_CLAIM' as 'FLOAT_TOPUP' | 'EXPENSE_CLAIM',
    amount: '',
    payee_name: '',
    category_id: '',
    receipt_reference: '',
    description: ''
  });

  const subTabs = [
    { id: 'payment-vouchers', label: 'Payment Vouchers' },
    { id: 'local-orders', label: 'Local Orders (LPO)' },
    { id: 'bills', label: 'Supplier Bills' },
    { id: 'suppliers', label: 'Suppliers Directory' },
    { id: 'supplier-take-ons', label: 'Supplier Take Ons' },
    { id: 'fee-refunds', label: 'Fee Refunds' },
    { id: 'petty-cash', label: 'Petty Cash Book' },
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        resVouchers,
        resCats,
        resLpos,
        resBills,
        resSuppliers,
        resTakeOns,
        resRefunds,
        resPetty,
        resStudents
      ] = await Promise.all([
        ApiService.getExpenses().catch(() => ({ data: [] })),
        ApiService.getExpenseCategories().catch(() => ({ data: [] })),
        ApiService.getLpos().catch(() => ({ data: [] })),
        ApiService.getBills().catch(() => ({ data: [] })),
        ApiService.getSuppliers().catch(() => ({ data: [] })),
        ApiService.getSupplierTakeOns().catch(() => ({ data: [] })),
        ApiService.getFeeRefunds().catch(() => ({ data: [] })),
        ApiService.getPettyCash().catch(() => ({ data: { current_float_balance: 0, entries: [] } })),
        ApiService.getStudents().catch(() => ({ data: [] }))
      ]);

      if (resVouchers?.data) setVouchers(resVouchers.data);
      if (resCats?.data) {
        setCategories(resCats.data);
        if (resCats.data.length > 0 && !addVoucherForm.category_id) {
          setAddVoucherForm((prev) => ({ ...prev, category_id: resCats.data[0].id }));
          setNewBill((prev) => ({ ...prev, category_id: resCats.data[0].id }));
          setNewPettyCash((prev) => ({ ...prev, category_id: resCats.data[0].id }));
        }
      }
      if (resLpos?.data) setLpoList(resLpos.data);
      if (resBills?.data) setBillsList(resBills.data);
      if (resSuppliers?.data) {
        setSuppliersList(resSuppliers.data);
        if (resSuppliers.data.length > 0) {
          if (!newTakeOn.supplier_id) setNewTakeOn((prev) => ({ ...prev, supplier_id: resSuppliers.data[0].id }));
          if (!newBill.supplier_id) setNewBill((prev) => ({ ...prev, supplier_id: resSuppliers.data[0].id, supplier_name: resSuppliers.data[0].name }));
          if (!newLPO.supplier_id) setNewLPO((prev) => ({ ...prev, supplier_id: resSuppliers.data[0].id, supplier_name: resSuppliers.data[0].name }));
        }
      }
      if (resTakeOns?.data) setSupplierTakeOns(resTakeOns.data);
      if (resRefunds?.data) setRefundsList(resRefunds.data);
      if (resPetty?.data) setPettyCashData(resPetty.data);
      if (resStudents?.data) {
        setStudents(resStudents.data);
        if (resStudents.data.length > 0 && !newRefund.student_id) {
          setNewRefund((prev) => ({ ...prev, student_id: resStudents.data[0].id }));
        }
      }
    } catch (e) {
      console.error('Error loading expenses data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(vouchers.map((v) => v.id));
    else setSelectedIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 1. Create Payment Voucher
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addVoucherForm.payee_name.trim() || !addVoucherForm.amount) {
      alert('Please fill in Payee Name and Amount.');
      return;
    }

    try {
      const res = await ApiService.createExpenseVoucher({
        category_id: addVoucherForm.category_id || (categories[0]?.id || ''),
        payee_name: addVoucherForm.payee_name.trim(),
        amount: parseFloat(addVoucherForm.amount),
        payment_method: addVoucherForm.payment_method,
        description: addVoucherForm.description.trim() || 'Payment voucher requisition',
        lpo_number: addVoucherForm.lpo_number,
        cheque_number: addVoucherForm.cheque_number,
        bank_account: addVoucherForm.bank_account
      });

      setShowAddVoucherModal(false);
      showToast('Payment voucher requisition posted successfully!');

      if (res?.data) {
        setSelectedVoucherForSlip(res.data);
      }

      setAddVoucherForm({
        payee_name: '',
        amount: '',
        category_id: categories[0]?.id || '',
        payment_method: 'BANK_TRANSFER',
        description: '',
        lpo_number: '',
        cheque_number: '',
        bank_account: 'Main Operations Account (KCB)'
      });

      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error creating payment voucher');
    }
  };

  // Approve Voucher
  const handleApproveVoucher = async (id: string) => {
    if (!confirm('Authorize and approve this payment voucher?')) return;
    try {
      await ApiService.approveVoucher(id);
      showToast('Payment voucher approved by administration!');
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error approving voucher');
    }
  };

  // Disburse Voucher
  const handleDisburseVoucher = async (id: string) => {
    if (!confirm('Confirm disbursement of funds for this voucher?')) return;
    try {
      await ApiService.disburseVoucher(id);
      showToast('Funds disbursed and posted to cashbook ledger!');
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error disbursing voucher');
    }
  };

  // Cancel Voucher
  const handleCancelVoucher = async (id: string) => {
    const reason = prompt('Please enter reason for cancelling this voucher:');
    if (!reason) return;
    try {
      await ApiService.cancelVoucher(id, reason);
      showToast('Voucher cancelled.');
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error cancelling voucher');
    }
  };

  // 2. Local Purchase Orders (LPOs)
  const handleCreateLPO = async (e: React.FormEvent) => {
    e.preventDefault();
    const est = parseFloat(newLPO.estimated_amount) || 0;
    if (!newLPO.supplier_name || !newLPO.items_description || est <= 0) {
      alert('Please fill in Supplier, Items and Estimated Amount');
      return;
    }

    try {
      await ApiService.createLpo({
        supplier_name: newLPO.supplier_name,
        supplier_id: newLPO.supplier_id || undefined,
        items_description: newLPO.items_description,
        quantity_details: newLPO.quantity_details,
        estimated_amount: est,
        delivery_date: newLPO.delivery_date,
        notes: newLPO.notes
      });

      setShowLPOModal(false);
      showToast('Local Purchase Order (LPO) generated successfully!');
      setNewLPO({
        supplier_name: suppliersList[0]?.name || '',
        supplier_id: suppliersList[0]?.id || '',
        items_description: '',
        quantity_details: '',
        estimated_amount: '',
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error creating LPO');
    }
  };

  const handleUpdateLpoStatus = async (id: string, status: string) => {
    try {
      await ApiService.updateLpoStatus(id, status);
      showToast(`LPO marked as ${status}!`);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error updating LPO');
    }
  };

  // 3. Supplier Bills & Invoices
  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newBill.amount) || 0;
    if (!newBill.supplier_name || amt <= 0) {
      alert('Please specify Supplier and valid Bill Amount');
      return;
    }

    try {
      await ApiService.createBill({
        supplier_name: newBill.supplier_name,
        supplier_id: newBill.supplier_id || undefined,
        category_id: newBill.category_id || undefined,
        bill_number: newBill.bill_number,
        bill_date: newBill.bill_date,
        due_date: newBill.due_date,
        amount: amt,
        notes: newBill.notes
      });

      setShowBillModal(false);
      showToast('Supplier bill recorded in accounts payable!');
      setNewBill({
        supplier_name: suppliersList[0]?.name || '',
        supplier_id: suppliersList[0]?.id || '',
        category_id: categories[0]?.id || '',
        bill_number: '',
        bill_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: '',
        notes: ''
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error creating bill');
    }
  };

  const handlePayBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBillToPay) return;
    const payAmt = parseFloat(payBillForm.amount) || 0;
    if (payAmt <= 0) {
      alert('Please enter valid payment amount');
      return;
    }

    try {
      await ApiService.payBill(activeBillToPay.id, payAmt);
      setShowPayBillModal(false);
      setActiveBillToPay(null);
      showToast(`Payment of KES ${payAmt.toLocaleString()} recorded against bill!`);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording bill payment');
    }
  };

  // 4. Suppliers Directory
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim()) {
      alert('Please enter Supplier Name');
      return;
    }

    try {
      await ApiService.createSupplier({
        name: newSupplier.name.trim(),
        category: newSupplier.category,
        contact_person: newSupplier.contact_person,
        phone: newSupplier.phone,
        email: newSupplier.email,
        address: newSupplier.address,
        bank_name: newSupplier.bank_name,
        bank_account_no: newSupplier.bank_account_no,
        kra_pin: newSupplier.kra_pin,
        opening_balance: parseFloat(newSupplier.opening_balance) || 0
      });

      setShowSupplierModal(false);
      showToast('Supplier registered in vendor directory!');
      setNewSupplier({
        name: '',
        category: 'Food & Rations',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        bank_name: 'KCB Bank',
        bank_account_no: '',
        kra_pin: '',
        opening_balance: '0'
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error adding supplier');
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove supplier ${name}?`)) return;
    try {
      await ApiService.deleteSupplier(id);
      showToast('Supplier removed from directory.');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error removing supplier');
    }
  };

  // 5. Supplier Take Ons
  const handleCreateTakeOn = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newTakeOn.amount) || 0;
    if (!newTakeOn.supplier_id || amt <= 0) {
      alert('Please select supplier and enter valid amount');
      return;
    }

    try {
      await ApiService.createSupplierTakeOn({
        supplier_id: newTakeOn.supplier_id,
        invoice_ref: newTakeOn.invoice_ref,
        invoice_date: newTakeOn.invoice_date,
        amount: amt,
        description: newTakeOn.description
      });

      setShowTakeOnModal(false);
      showToast('Supplier opening balance recorded successfully!');
      setNewTakeOn({
        supplier_id: suppliersList[0]?.id || '',
        invoice_ref: '',
        invoice_date: new Date().toISOString().split('T')[0],
        amount: '',
        description: 'Historical supplier balance carried forward'
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording take-on');
    }
  };

  // 6. Fee Refunds
  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newRefund.amount) || 0;
    if (!newRefund.student_id || amt <= 0) {
      alert('Please select student and enter refund amount');
      return;
    }

    try {
      await ApiService.createFeeRefund({
        student_id: newRefund.student_id,
        amount: amt,
        payment_method: newRefund.payment_method,
        cheque_number: newRefund.cheque_number,
        bank_account: newRefund.bank_account,
        recipient_name: newRefund.recipient_name,
        reason: newRefund.reason
      });

      setShowRefundModal(false);
      showToast('Student fee refund request submitted for approval!');
      setNewRefund({
        student_id: students[0]?.id || '',
        amount: '',
        payment_method: 'CHEQUE',
        cheque_number: '',
        bank_account: 'Main School Operating Account',
        recipient_name: 'Parent / Guardian',
        reason: 'Fee overpayment refund upon student transfer / clearance'
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error processing fee refund');
    }
  };

  const handleApproveRefund = async (id: string) => {
    if (!confirm('Approve this student fee refund?')) return;
    try {
      await ApiService.approveFeeRefund(id);
      showToast('Fee refund approved!');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error approving refund');
    }
  };

  const handleDisburseRefund = async (id: string) => {
    if (!confirm('Disburse fee refund and debit student ledger?')) return;
    try {
      await ApiService.disburseFeeRefund(id);
      showToast('Fee refund disbursed and student ledger adjusted!');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error disbursing refund');
    }
  };

  // 7. Petty Cash
  const handleRecordPettyCash = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newPettyCash.amount) || 0;
    if (amt <= 0 || !newPettyCash.description) {
      alert('Please enter valid amount and description');
      return;
    }

    try {
      await ApiService.recordPettyCash({
        entry_type: newPettyCash.entry_type,
        amount: amt,
        payee_name: newPettyCash.payee_name || (newPettyCash.entry_type === 'FLOAT_TOPUP' ? 'Petty Cash Custodian' : 'Claimant'),
        category_id: newPettyCash.category_id || undefined,
        receipt_reference: newPettyCash.receipt_reference,
        description: newPettyCash.description
      });

      setShowPettyCashModal(false);
      showToast(newPettyCash.entry_type === 'FLOAT_TOPUP' ? 'Petty cash float topped up!' : 'Petty cash expense claim recorded!');
      setNewPettyCash({
        entry_type: 'EXPENSE_CLAIM',
        amount: '',
        payee_name: '',
        category_id: categories[0]?.id || '',
        receipt_reference: '',
        description: ''
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording petty cash entry');
    }
  };

  const formatCurrency = (amt: number) => {
    return 'KES ' + Number(amt || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 });
  };

  const filteredVouchers = vouchers.filter((v) => {
    const s = search.toLowerCase();
    const payee = (v.payee_name || '').toLowerCase();
    const vNo = (v.voucher_number || '').toLowerCase();
    const desc = (v.description || '').toLowerCase();
    const cat = (v.category_name || '').toLowerCase();
    const matchesSearch = payee.includes(s) || vNo.includes(s) || desc.includes(s) || cat.includes(s);
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-slate-800 pb-12">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all shadow-md ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Sub-Navigation Tabs matching Skysoft Finance */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 flex items-center gap-4 overflow-x-auto text-xs font-semibold text-slate-600 shadow-xs">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`py-3.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'payment-vouchers' && vouchers.filter(v => v.status === 'REQUESTED').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                  {vouchers.filter(v => v.status === 'REQUESTED').length}
                </span>
              )}
              {tab.id === 'bills' && billsList.filter(b => b.status === 'PENDING').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold">
                  {billsList.filter(b => b.status === 'PENDING').length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. SUB-TAB: PAYMENT VOUCHERS */}
      {activeSubTab === 'payment-vouchers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Payment Vouchers Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">Dual-control expenditure authorization workflow: Requisition &rarr; Principal Approval &rarr; Cashier Disbursement</p>
            </div>

            {currentRole !== 'auditor' && (
              <button
                onClick={() => setShowAddVoucherModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Payment Voucher</span>
              </button>
            )}
          </div>

          {/* Filters & Search Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by payee, voucher number, description, category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="REQUESTED">Requested (Pending Approval)</option>
                <option value="APPROVED">Approved (Pending Disbursement)</option>
                <option value="DISBURSED">Disbursed / Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold text-slate-700">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Register</span>
              </button>

              <button
                onClick={() => exportToCsv('Payment_Vouchers_Register', ['Date', 'Voucher No', 'Payee', 'Category', 'Amount', 'Payment Method', 'Status', 'Requested By', 'Approved By'], filteredVouchers.map(v => [
                  new Date(v.created_at).toLocaleDateString(),
                  v.voucher_number || `PV-${v.id}`,
                  v.payee_name,
                  v.category_name,
                  v.amount,
                  v.payment_method,
                  v.status,
                  v.requested_by_name || 'Bursar',
                  v.approved_by_name || '-'
                ]))}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={loadAllData}
                className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors"
                title="Refresh Vouchers"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === vouchers.length}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Voucher No.</th>
                    <th className="py-3 px-4">Payee / Recipient</th>
                    <th className="py-3 px-4">Expense Category / Vote Head</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        No payment vouchers found. Click "+ Add Payment Voucher" to create an expenditure request.
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(v.id)}
                            onChange={() => handleToggleSelect(v.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{new Date(v.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <button
                            onClick={() => setSelectedVoucherForSlip(v)}
                            className="text-sky-700 hover:text-sky-900 hover:underline"
                            title="Click to view & print official slip"
                          >
                            {v.voucher_number || `PV-${v.id?.slice(0, 8)}`}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 uppercase">{v.payee_name}</td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                            {v.category_name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold uppercase text-slate-600">{v.payment_method?.replace('_', ' ')}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-rose-600 text-sm">
                          {formatCurrency(v.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {v.status === 'REQUESTED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              PENDING APPROVAL
                            </span>
                          )}
                          {v.status === 'APPROVED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                              APPROVED (READY)
                            </span>
                          )}
                          {v.status === 'DISBURSED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              PAID / DISBURSED
                            </span>
                          )}
                          {v.status === 'CANCELLED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              CANCELLED
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {v.status === 'REQUESTED' && ['super_admin', 'school_admin', 'head_teacher'].includes(currentRole) && (
                              <button
                                onClick={() => handleApproveVoucher(v.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] shadow-xs flex items-center gap-1"
                                title="Authorize and approve this payment request"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {v.status === 'APPROVED' && ['super_admin', 'school_admin', 'bursar'].includes(currentRole) && (
                              <button
                                onClick={() => handleDisburseVoucher(v.id)}
                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-[11px] shadow-xs flex items-center gap-1"
                                title="Disburse funds and post to cashbook"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Disburse</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedVoucherForSlip(v)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 border border-slate-200"
                              title="Print official payment voucher slip"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                              <span>Slip</span>
                            </button>

                            {v.status === 'REQUESTED' && (
                              <button
                                onClick={() => handleCancelVoucher(v.id)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs"
                                title="Cancel voucher"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* 3. SUB-TAB: LOCAL ORDERS (LPOs) */}
      {activeSubTab === 'local-orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Local Purchase Orders (LPO)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Procurement commitments and orders issued to suppliers before goods delivery</p>
            </div>

            <button
              onClick={() => setShowLPOModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Issue Local Order (LPO)</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">LPO Number</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Supplier Name</th>
                  <th className="py-3 px-5">Ordered Items Description</th>
                  <th className="py-3 px-5">Expected Delivery</th>
                  <th className="py-3 px-5 text-right">Estimated Amount</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lpoList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No local purchase orders recorded yet. Click "+ Issue Local Order (LPO)" above.
                    </td>
                  </tr>
                ) : (
                  lpoList.map((lpo) => (
                    <tr key={lpo.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-sky-800">{lpo.lpo_number}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{new Date(lpo.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900 uppercase">{lpo.supplier_name}</td>
                      <td className="py-3.5 px-5 text-slate-700 max-w-xs">{lpo.items_description}</td>
                      <td className="py-3.5 px-5 text-slate-600">{lpo.delivery_date}</td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-slate-900 font-mono text-sm">
                        KES {Number(lpo.estimated_amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lpo.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lpo.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {lpo.status === 'ISSUED' && (
                          <button
                            onClick={() => handleUpdateLpoStatus(lpo.id, 'DELIVERED')}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold"
                          >
                            Mark Delivered
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

      {/* 4. SUB-TAB: BILLS */}
      {activeSubTab === 'bills' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Supplier Invoices & Accounts Payable</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track unpaid vendor invoices, utility bills, due dates, and settlement progress</p>
            </div>
            <button
              onClick={() => setShowBillModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Supplier Bill</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Bill Ref</th>
                  <th className="py-3 px-5">Bill Date</th>
                  <th className="py-3 px-5">Supplier / Creditor</th>
                  <th className="py-3 px-5">Due Date</th>
                  <th className="py-3 px-5 text-right">Total Amount</th>
                  <th className="py-3 px-5 text-right">Amount Paid</th>
                  <th className="py-3 px-5 text-right">Balance Due</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No supplier invoices or accounts payable registered. Click "+ Record Supplier Bill" above.
                    </td>
                  </tr>
                ) : (
                  billsList.map((b) => {
                    const balanceDue = (Number(b.amount) || 0) - (Number(b.amount_paid) || 0);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{b.bill_number}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-medium">{b.bill_date}</td>
                        <td className="py-3.5 px-5 font-extrabold text-slate-900 uppercase">{b.supplier_name}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-medium">{b.due_date}</td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">KES {Number(b.amount).toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-600">KES {Number(b.amount_paid).toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-right font-mono font-extrabold text-rose-600 text-sm">
                          KES {balanceDue.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          {b.status !== 'PAID' && (
                            <button
                              onClick={() => {
                                setActiveBillToPay(b);
                                setPayBillForm({
                                  amount: String(balanceDue),
                                  payment_method: 'BANK_TRANSFER',
                                  notes: `Payment for Bill #${b.bill_number}`
                                });
                                setShowPayBillModal(true);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-xs"
                            >
                              Pay Bill
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SUB-TAB: SUPPLIERS */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Suppliers & Creditors Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage vendors, utility accounts, banking details, and procurement partners</p>
            </div>

            <button
              onClick={() => setShowSupplierModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Supplier</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Supplier Code</th>
                  <th className="py-3 px-5">Supplier Name</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Phone Number</th>
                  <th className="py-3 px-5">Bank Account / Details</th>
                  <th className="py-3 px-5 text-right">Outstanding Balance</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No suppliers registered. Click "+ Add Supplier" to build your vendor directory.
                    </td>
                  </tr>
                ) : (
                  suppliersList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{s.supplier_code}</td>
                      <td className="py-3.5 px-5">
                        <div className="font-extrabold text-slate-900 uppercase">{s.name}</div>
                        <div className="text-[11px] text-slate-500">{s.contact_person ? `Attn: ${s.contact_person}` : ''}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-600">{s.phone || '-'}</td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {s.bank_name ? `${s.bank_name} - ${s.bank_account_no}` : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-slate-900 font-mono text-sm">
                        KES {Number(s.current_balance || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => handleDeleteSupplier(s.id, s.name)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SUB-TAB: SUPPLIER TAKE ONS */}
      {activeSubTab === 'supplier-take-ons' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Supplier Opening Balances (Take-Ons)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Historical supplier balances carried forward from previous accounting periods</p>
            </div>
            <button
              onClick={() => setShowTakeOnModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Opening Balance</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Invoice Reference</th>
                  <th className="py-3 px-5">Invoice Date</th>
                  <th className="py-3 px-5">Supplier Name</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5 text-right">Carried Forward Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierTakeOns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                      No supplier opening balances recorded. Click "+ Record Opening Balance" to import historical liabilities.
                    </td>
                  </tr>
                ) : (
                  supplierTakeOns.map((to) => (
                    <tr key={to.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{to.invoice_ref}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{to.invoice_date}</td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900 uppercase">{to.supplier_name}</td>
                      <td className="py-3.5 px-5 text-slate-700">{to.description}</td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-slate-900 font-mono text-sm">
                        KES {Number(to.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. SUB-TAB: FEE REFUNDS */}
      {activeSubTab === 'fee-refunds' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Student Fee Refunds Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">Disburse fee overpayments and credit balances to graduating or transferring students</p>
            </div>

            <button
              onClick={() => setShowRefundModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>+ Process Fee Refund</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Refund Ref</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Student Beneficiary</th>
                  <th className="py-3 px-5">Recipient / Guardian</th>
                  <th className="py-3 px-5">Reason</th>
                  <th className="py-3 px-5 text-right">Refund Amount</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refundsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No fee refunds recorded. Click "+ Process Fee Refund" above to issue an overpayment refund.
                    </td>
                  </tr>
                ) : (
                  refundsList.map((r) => {
                    const sName = `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Student';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{r.refund_number}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-medium">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 px-5">
                          <div className="font-extrabold text-slate-900 uppercase">{sName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Adm: {r.admission_number || '-'}</div>
                        </td>
                        <td className="py-3.5 px-5 text-slate-800 font-medium">{r.recipient_name}</td>
                        <td className="py-3.5 px-5 text-slate-700 max-w-xs">{r.reason}</td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-rose-600 font-mono text-sm">
                          KES {Number(r.amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'DISBURSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {r.status === 'PENDING' && (
                              <button
                                onClick={() => handleApproveRefund(r.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs"
                              >
                                Approve
                              </button>
                            )}
                            {r.status === 'APPROVED' && (
                              <button
                                onClick={() => handleDisburseRefund(r.id)}
                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-bold shadow-xs"
                              >
                                Disburse
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. SUB-TAB: PETTY CASH */}
      {activeSubTab === 'petty-cash' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Petty Cash Float & Vouchers</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage small daily office expenses, float reimbursements, and claimant receipts</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNewPettyCash({
                    entry_type: 'FLOAT_TOPUP',
                    amount: '',
                    payee_name: 'Petty Cash Custodian',
                    category_id: categories[0]?.id || '',
                    receipt_reference: 'FLOAT-TOPUP',
                    description: 'Float replenishment from bank'
                  });
                  setShowPettyCashModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>+ Replenish Float</span>
              </button>

              <button
                onClick={() => {
                  setNewPettyCash({
                    entry_type: 'EXPENSE_CLAIM',
                    amount: '',
                    payee_name: '',
                    category_id: categories[0]?.id || '',
                    receipt_reference: '',
                    description: ''
                  });
                  setShowPettyCashModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record Cash Expense</span>
              </button>
            </div>
          </div>

          {/* Current Float Card */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-300">Active Petty Cash Float Balance</span>
              <div className="text-3xl font-black font-mono tracking-tight">
                {formatCurrency(pettyCashData.current_float_balance)}
              </div>
              <p className="text-xs text-emerald-200">Reconciled daily against physical safe cash</p>
            </div>
            <Wallet className="w-14 h-14 text-emerald-400/50" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Voucher No.</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Transaction Type</th>
                  <th className="py-3 px-5">Payee / Claimant</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5 text-right">Float Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pettyCashData.entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No petty cash records found. Click "+ Replenish Float" to fund your petty cash book.
                    </td>
                  </tr>
                ) : (
                  pettyCashData.entries.map((pc) => (
                    <tr key={pc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{pc.voucher_number}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{new Date(pc.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pc.entry_type === 'FLOAT_TOPUP' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {pc.entry_type === 'FLOAT_TOPUP' ? '+ FLOAT REPLENISHMENT' : '- EXPENSE CLAIM'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">{pc.payee_name}</td>
                      <td className="py-3.5 px-5 text-slate-700 max-w-xs">{pc.description}</td>
                      <td className={`py-3.5 px-5 text-right font-mono font-extrabold text-sm ${
                        pc.entry_type === 'FLOAT_TOPUP' ? 'text-sky-600' : 'text-rose-600'
                      }`}>
                        {pc.entry_type === 'FLOAT_TOPUP' ? '+' : '-'}{formatCurrency(pc.amount)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(pc.balance_after)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Voucher Modal */}
      {showAddVoucherModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Create Payment Voucher Requisition</h3>
              <button onClick={() => setShowAddVoucherModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateVoucher} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payee Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenya Power / Supplier Name / Staff Name"
                  value={addVoucherForm.payee_name}
                  onChange={(e) => setAddVoucherForm({ ...addVoucherForm, payee_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Amount (KES) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={addVoucherForm.amount}
                    onChange={(e) => setAddVoucherForm({ ...addVoucherForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={addVoucherForm.payment_method}
                    onChange={(e) => setAddVoucherForm({ ...addVoucherForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / EFT</option>
                    <option value="CHEQUE">Cheque / Banker's Draft</option>
                    <option value="MPESA_B2C">M-Pesa Business-to-Customer (B2C)</option>
                    <option value="PETTY_CASH">Petty Cash Office</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Expense Category / Vote Head <span className="text-rose-500">*</span></label>
                <select
                  value={addVoucherForm.category_id}
                  onChange={(e) => setAddVoucherForm({ ...addVoucherForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">LPO Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. LPO-2026-0045"
                    value={addVoucherForm.lpo_number}
                    onChange={(e) => setAddVoucherForm({ ...addVoucherForm, lpo_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Cheque No. (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CHQ-9901"
                    value={addVoucherForm.cheque_number}
                    onChange={(e) => setAddVoucherForm({ ...addVoucherForm, cheque_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Description / Particulars of Expense</label>
                <input
                  type="text"
                  placeholder="e.g. Supply of boarding kitchen groceries / July electricity bill"
                  value={addVoucherForm.description}
                  onChange={(e) => setAddVoucherForm({ ...addVoucherForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVoucherModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Commit Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LPO Modal */}
      {showLPOModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Issue Local Purchase Order (LPO)</h3>
              <button onClick={() => setShowLPOModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLPO} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select / Specify Supplier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kitui Millers & General Supplies"
                  value={newLPO.supplier_name}
                  onChange={(e) => setNewLPO({ ...newLPO, supplier_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Ordered Items Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. 50 Bags Grade-1 Maize, 20 Bags Beans"
                  value={newLPO.items_description}
                  onChange={(e) => setNewLPO({ ...newLPO, items_description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Estimated Amount (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 185000"
                    value={newLPO.estimated_amount}
                    onChange={(e) => setNewLPO({ ...newLPO, estimated_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    required
                    value={newLPO.delivery_date}
                    onChange={(e) => setNewLPO({ ...newLPO, delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Deliver to School Main Store before 4:00 PM"
                  value={newLPO.notes}
                  onChange={(e) => setNewLPO({ ...newLPO, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLPOModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Generate LPO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Record Supplier Bill / Invoice</h3>
              <button onClick={() => setShowBillModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBill} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenya Power & Lighting / Mama Nzasi Groceries"
                  value={newBill.supplier_name}
                  onChange={(e) => setNewBill({ ...newBill, supplier_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Invoice / Bill Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-9042"
                    value={newBill.bill_number}
                    onChange={(e) => setNewBill({ ...newBill, bill_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Amount Due (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 35000"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Bill Date</label>
                  <input
                    type="date"
                    required
                    value={newBill.bill_date}
                    onChange={(e) => setNewBill({ ...newBill, bill_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newBill.due_date}
                    onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Expense Category / Vote Head</label>
                <select
                  value={newBill.category_id}
                  onChange={(e) => setNewBill({ ...newBill, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Bill Modal */}
      {showPayBillModal && activeBillToPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Disburse Payment for Bill</h3>
              <button onClick={() => setShowPayBillModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 space-y-1">
              <div className="font-bold text-slate-800">Bill Ref: {activeBillToPay.bill_number}</div>
              <div className="text-emerald-900 font-extrabold uppercase">{activeBillToPay.supplier_name}</div>
              <div className="text-[11px] text-slate-600">Remaining Balance: <span className="font-bold font-mono text-rose-600">KES {((Number(activeBillToPay.amount) || 0) - (Number(activeBillToPay.amount_paid) || 0)).toLocaleString()}</span></div>
            </div>

            <form onSubmit={handlePayBillSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payment Amount (KES)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={(Number(activeBillToPay.amount) || 0) - (Number(activeBillToPay.amount_paid) || 0)}
                  value={payBillForm.amount}
                  onChange={(e) => setPayBillForm({ ...payBillForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payment Method</label>
                <select
                  value={payBillForm.payment_method}
                  onChange={(e) => setPayBillForm({ ...payBillForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer / EFT</option>
                  <option value="CHEQUE">Cheque / Banker's Draft</option>
                  <option value="MPESA_B2C">M-Pesa B2C</option>
                  <option value="PETTY_CASH">Petty Cash</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayBillModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Post Payment & Issue Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add New Supplier / Creditor</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Vendor / Enterprise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brookside Dairy / Kenya Power"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Category</label>
                  <select
                    value={newSupplier.category}
                    onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                  >
                    <option value="Food & Rations">Food & Rations</option>
                    <option value="Utilities (Power, Water, Internet)">Utilities (Power, Water, Internet)</option>
                    <option value="Textbooks & Stationery">Textbooks & Stationery</option>
                    <option value="Hardware & Building Supplies">Hardware & Building Supplies</option>
                    <option value="Laboratory & Science Equipment">Laboratory & Science Equipment</option>
                    <option value="Transport & Fuel">Transport & Fuel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="0712345678"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Equity Bank"
                    value={newSupplier.bank_name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, bank_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0110928374"
                    value={newSupplier.bank_account_no}
                    onChange={(e) => setNewSupplier({ ...newSupplier, bank_account_no: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Take-On Modal */}
      {showTakeOnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Record Supplier Opening Balance</h3>
              <button onClick={() => setShowTakeOnModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTakeOn} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Supplier</label>
                <select
                  required
                  value={newTakeOn.supplier_id}
                  onChange={(e) => setNewTakeOn({ ...newTakeOn, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  {suppliersList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.supplier_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Invoice Reference</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HIST-2025-01"
                    value={newTakeOn.invoice_ref}
                    onChange={(e) => setNewTakeOn({ ...newTakeOn, invoice_ref: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Carried Balance (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 45000"
                    value={newTakeOn.amount}
                    onChange={(e) => setNewTakeOn({ ...newTakeOn, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={newTakeOn.description}
                  onChange={(e) => setNewTakeOn({ ...newTakeOn, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTakeOnModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Save Opening Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Process Student Fee Refund</h3>
              <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRefund} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Beneficiary Student</label>
                <select
                  required
                  value={newRefund.student_id}
                  onChange={(e) => setNewRefund({ ...newRefund, student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} (Adm: {s.admission_number}) - {s.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Refund Amount (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={newRefund.amount}
                    onChange={(e) => setNewRefund({ ...newRefund, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={newRefund.payment_method}
                    onChange={(e) => setNewRefund({ ...newRefund, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                  >
                    <option value="CHEQUE">Cheque / Banker's Draft</option>
                    <option value="BANK_TRANSFER">Bank EFT / Transfer</option>
                    <option value="CASH">Cash Office</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Recipient Name (Guardian)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parent / Guardian Name"
                  value={newRefund.recipient_name}
                  onChange={(e) => setNewRefund({ ...newRefund, recipient_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Reason for Refund</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Overpayment transfer / Student cleared school"
                  value={newRefund.reason}
                  onChange={(e) => setNewRefund({ ...newRefund, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Post Refund Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Petty Cash Modal */}
      {showPettyCashModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {newPettyCash.entry_type === 'FLOAT_TOPUP' ? 'Replenish Petty Cash Float' : 'Record Petty Cash Expense Claim'}
              </h3>
              <button onClick={() => setShowPettyCashModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPettyCash} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 2500"
                    value={newPettyCash.amount}
                    onChange={(e) => setNewPettyCash({ ...newPettyCash, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payee / Claimant</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Messenger"
                    value={newPettyCash.payee_name}
                    onChange={(e) => setNewPettyCash({ ...newPettyCash, payee_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Expense Category</label>
                <select
                  value={newPettyCash.category_id}
                  onChange={(e) => setNewPettyCash({ ...newPettyCash, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Receipt / Slip Ref No.</label>
                <input
                  type="text"
                  placeholder="e.g. RECEIPT #88912"
                  value={newPettyCash.receipt_reference}
                  onChange={(e) => setNewPettyCash({ ...newPettyCash, receipt_reference: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency chalk & printer toner purchase"
                  value={newPettyCash.description}
                  onChange={(e) => setNewPettyCash({ ...newPettyCash, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPettyCashModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Commit Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Payment Voucher Modal */}
      {selectedVoucherForSlip && (
        <PaymentVoucherModal
          voucher={selectedVoucherForSlip}
          onClose={() => setSelectedVoucherForSlip(null)}
        />
      )}
    </div>
  );
};