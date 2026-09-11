import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { PaymentTransaction, Student, UserRole } from '../types';
import { ReceiptModal } from '../components/ReceiptModal';
import { MpesaSimulatorModal } from '../components/MpesaSimulatorModal';
import { exportToCsv } from '../utils/exportUtils';
import {
  CreditCard,
  Plus,
  Receipt as ReceiptIcon,
  Printer,
  Download,
  Search,
  RotateCcw,
  CheckCircle2,
  X,
  Smartphone,
  Building,
  DollarSign,
  Package,
  Award,
  Landmark,
  FileCheck,
  AlertTriangle,
  RotateCw,
  Send,
  ArrowRightLeft,
  Calendar,
  UserCheck,
  Check,
  AlertCircle
} from 'lucide-react';

interface PaymentsViewProps {
  currentRole: UserRole;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ currentRole }) => {
  const [activeSubTab, setActiveSubTab] = useState('collections-list');
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInKindModal, setShowInKindModal] = useState(false);
  const [showBursaryModal, setShowBursaryModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Active selections & targets
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [reversalTarget, setReversalTarget] = useState<any | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [transferSourceStudent, setTransferSourceStudent] = useState<any | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4500);
  };

  const subTabs = [
    { id: 'collections-list', label: 'Collections List' },
    { id: 'payment-in-kind', label: 'Payment In Kind' },
    { id: 'bursaries', label: 'Bursaries' },
    { id: 'grants', label: 'Grants' },
    { id: 'pledges', label: 'Pledges' },
    { id: 'overpayments', label: 'Overpayments' },
    { id: 'pending-reversals', label: 'Pending Reversals' },
    { id: 'reversed-receipts', label: 'Reversed Receipts' },
  ];

  // Data lists
  const [inKindList, setInKindList] = useState<Array<any>>([]);
  const [bursariesList, setBursariesList] = useState<Array<any>>([]);
  const [grantsList, setGrantsList] = useState<Array<any>>([]);
  const [pledgesList, setPledgesList] = useState<Array<any>>([]);
  const [overpaymentsList, setOverpaymentsList] = useState<Array<any>>([]);
  const [pendingReversals, setPendingReversals] = useState<Array<any>>([]);
  const [reversedReceipts, setReversedReceipts] = useState<Array<any>>([]);

  // Forms
  const [addForm, setAddForm] = useState({
    student_id: '',
    amount: '',
    channel: 'BANK_DEPOSIT',
    reference_number: '',
    payer_name: '',
    notes: ''
  });

  const [newInKind, setNewInKind] = useState({
    student_id: '',
    item_name: 'Maize (90kg Bags)',
    quantity: '2',
    unit_of_measure: 'Bags',
    unit_price: '3500',
    delivered_by: 'Parent / Guardian',
    notes: 'Agricultural produce delivered to school store'
  });

  const [newBursary, setNewBursary] = useState({
    student_id: '',
    sponsor_name: 'NG-CDF Bursary Fund',
    cheque_number: '',
    amount: '',
    disbursement_date: new Date().toISOString().split('T')[0],
    term_id: '',
    notes: 'Bursary allocation credited to learner fees'
  });

  const [newGrant, setNewGrant] = useState({
    grant_type: 'Ministry of Education (FDSE Capitation)',
    title: 'FDSE Term 1 Capitation Grant',
    amount: '',
    reference_number: '',
    bank_account: 'Main Operations Account (KCB)',
    term_id: '',
    notes: 'Direct Ministry capitation disbursement'
  });

  const [newPledge, setNewPledge] = useState({
    student_id: '',
    pledger_name: '',
    pledger_phone: '',
    amount: '',
    expected_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Committed to clear before mid-term exams'
  });

  const [transferForm, setTransferForm] = useState({
    target_student_id: '',
    amount: '',
    notes: 'Credit balance transfer to sibling/learner'
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        resPay,
        resStud,
        resTerms,
        resInKind,
        resBursaries,
        resGrants,
        resPledges,
        resOverpay,
        resPendingRev,
        resReversed
      ] = await Promise.all([
        ApiService.getPayments().catch(() => ({ data: [] })),
        ApiService.getStudents().catch(() => ({ data: [] })),
        ApiService.getTerms().catch(() => ({ data: [] })),
        ApiService.getPaymentsInKind().catch(() => ({ data: [] })),
        ApiService.getBursaries().catch(() => ({ data: [] })),
        ApiService.getGrants().catch(() => ({ data: [] })),
        ApiService.getPledges().catch(() => ({ data: [] })),
        ApiService.getOverpayments().catch(() => ({ data: [] })),
        ApiService.getPendingReversals().catch(() => ({ data: [] })),
        ApiService.getReversedReceipts().catch(() => ({ data: [] }))
      ]);

      if (resStud?.data) {
        setStudents(resStud.data);
        if (resStud.data.length > 0) {
          if (!addForm.student_id) setAddForm((prev) => ({ ...prev, student_id: resStud.data[0].id }));
          if (!newInKind.student_id) setNewInKind((prev) => ({ ...prev, student_id: resStud.data[0].id }));
          if (!newBursary.student_id) setNewBursary((prev) => ({ ...prev, student_id: resStud.data[0].id }));
          if (!newPledge.student_id) setNewPledge((prev) => ({ ...prev, student_id: resStud.data[0].id }));
        }
      }

      if (resTerms?.data) {
        setTerms(resTerms.data);
        const currentTerm = resTerms.data.find((t: any) => t.is_current) || resTerms.data[0];
        if (currentTerm) {
          setNewBursary((prev) => ({ ...prev, term_id: currentTerm.id }));
          setNewGrant((prev) => ({ ...prev, term_id: currentTerm.id }));
        }
      }

      if (resPay?.data) setPayments(resPay.data);
      if (resInKind?.data) setInKindList(resInKind.data);
      if (resBursaries?.data) setBursariesList(resBursaries.data);
      if (resGrants?.data) setGrantsList(resGrants.data);
      if (resPledges?.data) setPledgesList(resPledges.data);
      if (resOverpay?.data) setOverpaymentsList(resOverpay.data);
      if (resPendingRev?.data) setPendingReversals(resPendingRev.data);
      if (resReversed?.data) setReversedReceipts(resReversed.data);
    } catch (e) {
      console.error('Error loading collections data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(payments.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 1. Add Fee Payment
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.student_id || !addForm.amount) {
      alert('Please select a student and enter the payment amount');
      return;
    }

    try {
      const res = await ApiService.recordPayment({
        student_id: addForm.student_id,
        amount: parseFloat(addForm.amount),
        channel: addForm.channel,
        reference_number: addForm.reference_number || `REC-${Math.floor(Math.random() * 90000 + 10000)}`,
        payer_name: addForm.payer_name || 'Guardian / Parent',
        notes: addForm.notes || 'Fee Collection Receipt'
      });

      setShowAddModal(false);
      showToast('Payment recorded successfully into immutable ledger!');
      
      // Auto open receipt
      if (res?.data) {
        const studentObj = students.find((s) => s.id === addForm.student_id);
        setActiveReceipt({
          ...res.data,
          student_name: studentObj ? `${studentObj.first_name} ${studentObj.last_name}` : 'Student',
          admission_number: studentObj?.admission_number || '-',
          class_name: studentObj?.class_name || '-',
          amount: parseFloat(addForm.amount),
          payment_mode: addForm.channel,
          reference_code: addForm.reference_number,
          payer_name: addForm.payer_name
        });
      }

      setAddForm({
        student_id: students.length > 0 ? students[0].id : '',
        amount: '',
        channel: 'BANK_DEPOSIT',
        reference_number: '',
        payer_name: '',
        notes: ''
      });

      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error recording collection');
    }
  };

  // 2. Add Payment In Kind
  const handleAddInKind = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(newInKind.quantity) || 0;
    const rate = parseFloat(newInKind.unit_price) || 0;
    const totalVal = qty * rate;

    if (!newInKind.student_id || qty <= 0 || rate <= 0) {
      alert('Please fill in student, quantity and valid unit rate');
      return;
    }

    try {
      const res = await ApiService.createPaymentInKind({
        student_id: newInKind.student_id,
        item_name: newInKind.item_name,
        quantity: qty,
        unit_of_measure: newInKind.unit_of_measure,
        unit_price: rate,
        delivered_by: newInKind.delivered_by,
        notes: newInKind.notes
      });

      setShowInKindModal(false);
      const studentObj = students.find((s) => s.id === newInKind.student_id);
      showToast(`Payment in kind of KES ${totalVal.toLocaleString()} credited to ${studentObj?.first_name || 'student'}!`);

      if (res?.data) {
        setActiveReceipt({
          receipt_number: res.data.receipt_number,
          student_name: studentObj ? `${studentObj.first_name} ${studentObj.last_name}` : 'Student',
          admission_number: studentObj?.admission_number || '-',
          class_name: studentObj?.class_name || '-',
          amount: totalVal,
          payment_mode: `IN-KIND (${newInKind.item_name})`,
          reference_code: `${qty} ${newInKind.unit_of_measure} @ KES ${rate}`,
          payer_name: newInKind.delivered_by,
          created_at: res.data.created_at
        });
      }

      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording in-kind payment');
    }
  };

  // 3. Add Bursary
  const handleAddBursary = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newBursary.amount) || 0;
    if (!newBursary.student_id || amt <= 0) {
      alert('Please select student and enter bursary amount');
      return;
    }

    try {
      const res = await ApiService.createBursary({
        student_id: newBursary.student_id,
        sponsor_name: newBursary.sponsor_name,
        cheque_number: newBursary.cheque_number || `CHQ-${Math.floor(Math.random() * 900000 + 100000)}`,
        amount: amt,
        disbursement_date: newBursary.disbursement_date,
        term_id: newBursary.term_id,
        notes: newBursary.notes
      });

      setShowBursaryModal(false);
      const studentObj = students.find((s) => s.id === newBursary.student_id);
      showToast(`Bursary allocation of KES ${amt.toLocaleString()} credited to ledger!`);

      if (res?.data) {
        setActiveReceipt({
          receipt_number: res.data.cheque_number || `BUR-${res.data.id?.slice(0, 8)}`,
          student_name: studentObj ? `${studentObj.first_name} ${studentObj.last_name}` : 'Student',
          admission_number: studentObj?.admission_number || '-',
          class_name: studentObj?.class_name || '-',
          amount: amt,
          payment_mode: `BURSARY (${newBursary.sponsor_name})`,
          reference_code: newBursary.cheque_number || 'CHQ-DISBURSED',
          payer_name: newBursary.sponsor_name,
          created_at: res.data.created_at || newBursary.disbursement_date
        });
      }

      setNewBursary({
        student_id: students.length > 0 ? students[0].id : '',
        sponsor_name: 'NG-CDF Bursary Fund',
        cheque_number: '',
        amount: '',
        disbursement_date: new Date().toISOString().split('T')[0],
        term_id: terms[0]?.id || '',
        notes: 'Bursary allocation credited to learner fees'
      });

      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording bursary');
    }
  };

  // 4. Add Grant
  const handleAddGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newGrant.amount) || 0;
    if (amt <= 0 || !newGrant.title) {
      alert('Please enter title and valid grant amount');
      return;
    }

    try {
      await ApiService.createGrant({
        grant_type: newGrant.grant_type,
        title: newGrant.title,
        amount: amt,
        reference_number: newGrant.reference_number || `MOE-${Math.floor(Math.random() * 90000 + 10000)}`,
        bank_account: newGrant.bank_account,
        term_id: newGrant.term_id,
        notes: newGrant.notes
      });

      setShowGrantModal(false);
      showToast(`Institutional grant of KES ${amt.toLocaleString()} recorded successfully!`);
      setNewGrant({
        grant_type: 'Ministry of Education (FDSE Capitation)',
        title: 'FDSE Term 1 Capitation Grant',
        amount: '',
        reference_number: '',
        bank_account: 'Main Operations Account (KCB)',
        term_id: terms[0]?.id || '',
        notes: 'Direct Ministry capitation disbursement'
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording grant');
    }
  };

  // 5. Add Pledge
  const handleAddPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newPledge.amount) || 0;
    if (!newPledge.student_id || amt <= 0 || !newPledge.pledger_name) {
      alert('Please enter student, pledger name and committed amount');
      return;
    }

    try {
      await ApiService.createPledge({
        student_id: newPledge.student_id,
        pledger_name: newPledge.pledger_name,
        pledger_phone: newPledge.pledger_phone,
        amount: amt,
        expected_payment_date: newPledge.expected_payment_date,
        notes: newPledge.notes
      });

      setShowPledgeModal(false);
      const studentObj = students.find((s) => s.id === newPledge.student_id);
      showToast(`Fee pledge commitment of KES ${amt.toLocaleString()} recorded for ${studentObj?.first_name}!`);
      setNewPledge({
        student_id: students.length > 0 ? students[0].id : '',
        pledger_name: '',
        pledger_phone: '',
        amount: '',
        expected_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Committed to clear before mid-term exams'
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording pledge');
    }
  };

  // Send SMS Pledge Reminder
  const handleSendPledgeReminder = async (pledgeId: string, pledger: string) => {
    try {
      await ApiService.sendPledgeReminder(pledgeId);
      showToast(`SMS reminder sent successfully to ${pledger}!`);
    } catch (err: any) {
      showToast(`SMS reminder queued for dispatch to ${pledger}.`);
    }
  };

  // 6. Transfer Overpayment
  const handleTransferCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSourceStudent || !transferForm.target_student_id) {
      alert('Please select a target student to receive the credit');
      return;
    }
    const amt = parseFloat(transferForm.amount) || 0;
    const maxCredit = parseFloat(transferSourceStudent.credit_balance || 0);
    if (amt <= 0 || amt > maxCredit) {
      alert(`Please enter a valid transfer amount (Max: KES ${maxCredit.toLocaleString()})`);
      return;
    }

    try {
      await ApiService.transferOverpayment({
        source_student_id: transferSourceStudent.id,
        target_student_id: transferForm.target_student_id,
        amount: amt,
        notes: transferForm.notes
      });

      setShowTransferModal(false);
      const targetObj = students.find((s) => s.id === transferForm.target_student_id);
      showToast(`Successfully transferred KES ${amt.toLocaleString()} credit from ${transferSourceStudent.first_name} to ${targetObj?.first_name || 'target student'}!`);
      setTransferSourceStudent(null);
      setTransferForm({
        target_student_id: '',
        amount: '',
        notes: 'Credit balance transfer to sibling/learner'
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error transferring overpayment credit');
    }
  };

  // 7. Reversal Maker Request
  const handleRequestReversal = (payment: any) => {
    setReversalTarget(payment);
  };

  const handleConfirmReversalRequest = async () => {
    if (!reversalTarget || !reversalReason.trim()) {
      alert('Please provide a valid reason for reversing this payment');
      return;
    }

    try {
      await ApiService.requestPaymentReversal({
        payment_id: reversalTarget.id,
        receipt_number: reversalTarget.receipt_number || reversalTarget.reference_number || 'N/A',
        student_id: reversalTarget.student_id || reversalTarget.student?.id || students[0]?.id,
        amount: parseFloat(reversalTarget.amount),
        channel: reversalTarget.channel || reversalTarget.payment_channel || 'CASH',
        reason: reversalReason
      });

      setReversalTarget(null);
      setReversalReason('');
      showToast('Payment reversal request submitted for administrative dual-control approval.');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error submitting reversal request');
    }
  };

  // 8. Approve Reversal (Checker)
  const handleApproveReversal = async (id: string, receiptNo: string) => {
    if (!confirm(`Are you sure you want to approve the reversal of receipt ${receiptNo}? This will counter-balance the student ledger.`)) {
      return;
    }

    try {
      await ApiService.approvePaymentReversal(id);
      showToast(`Receipt ${receiptNo} reversed and ledger updated successfully!`);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error approving reversal');
    }
  };

  // 9. Reject Reversal
  const handleRejectReversal = async () => {
    if (!rejectTargetId) return;

    try {
      await ApiService.rejectPaymentReversal(rejectTargetId, rejectReason || 'Reversal rejected by administrator');
      setShowRejectModal(false);
      setRejectTargetId(null);
      setRejectReason('');
      showToast('Reversal request rejected.');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error rejecting reversal');
    }
  };

  const formatCurrency = (amt: number) => {
    return 'KES ' + Number(amt || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 });
  };

  const filtered = payments.filter((p) => {
    const s = search.toLowerCase();
    const sName = (p.student_name || `${p.first_name || ''} ${p.last_name || ''}`).toLowerCase();
    const adm = (p.student_admission_number || p.admission_number || '').toLowerCase();
    const rNo = (p.receipt_number || p.reference_number || '').toLowerCase();
    const ch = (p.channel || p.payment_channel || '').toLowerCase();
    const payer = (p.payer_name || '').toLowerCase();
    return sName.includes(s) || adm.includes(s) || rNo.includes(s) || ch.includes(s) || payer.includes(s);
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

      {/* 1. Sub-Navigation Tabs Row matching Skysoft Finance */}
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
              {tab.id === 'pending-reversals' && pendingReversals.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold">
                  {pendingReversals.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. SUB-TAB: COLLECTIONS LIST */}
      {activeSubTab === 'collections-list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Fee Collections Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time immutable ledger of student fee deposits, bank slips, and mobile payments</p>
            </div>

            {currentRole !== 'auditor' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMpesaModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95"
                >
                  <Smartphone className="w-4 h-4 text-emerald-300" />
                  <span>+ Simulate M-Pesa / C2B</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Collection</span>
                </button>
              </div>
            )}
          </div>

          {/* Search & Action Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student, admission number, receipt reference, payer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
              />
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
                onClick={() => exportToCsv('Fee_Collections_Register', ['Date', 'Student', 'AdmissionNo', 'Class', 'Channel', 'Amount', 'ReceiptNo', 'Payer'], filtered.map(p => [
                  new Date(p.created_at || p.payment_date).toLocaleDateString(),
                  p.student_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Student',
                  p.student_admission_number || p.admission_number || '-',
                  p.class_name || '-',
                  p.channel || p.payment_channel || 'BANK_DEPOSIT',
                  p.amount,
                  p.receipt_number || p.reference_number || '-',
                  p.payer_name || 'Guardian'
                ]))}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={loadAllData}
                className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors"
                title="Refresh Collections"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Main Collections Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === payments.length}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Student & Adm</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Payment Channel</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4">Receipt No.</th>
                    <th className="py-3 px-4">Payer</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        No collections found. Click "+ Add Collection" above to record a fee payment.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((pay) => {
                      const studentName = pay.student_name || `${pay.first_name || ''} ${pay.last_name || ''}`.trim() || 'Student';
                      const adm = pay.student_admission_number || pay.admission_number || '-';
                      const className = pay.class_name || '-';
                      const receiptNo = pay.receipt_number || pay.reference_number || '-';

                      return (
                        <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(pay.id)}
                              onChange={() => handleToggleSelect(pay.id)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {new Date(pay.payment_date || pay.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 uppercase">
                              {studentName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Adm: {adm}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {className}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                              {pay.channel || pay.payment_channel || 'BANK_DEPOSIT'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-600">
                            {formatCurrency(pay.amount)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                            {receiptNo}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {pay.payer_name || 'Guardian'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setActiveReceipt({
                                  ...pay,
                                  student_name: studentName,
                                  admission_number: adm,
                                  class_name: className,
                                  receipt_number: receiptNo,
                                  amount: pay.amount,
                                  payment_mode: pay.channel || pay.payment_channel || 'BANK_DEPOSIT',
                                  reference_code: pay.reference_number || receiptNo,
                                  payer_name: pay.payer_name || 'Guardian'
                                })}
                                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold flex items-center gap-1"
                                title="View & Print Official Receipt"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Receipt</span>
                              </button>
                              {currentRole !== 'auditor' && (
                                <button
                                  onClick={() => handleRequestReversal(pay)}
                                  className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs font-semibold flex items-center gap-1"
                                  title="Request Reversal (Maker-Checker)"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* 3. SUB-TAB: PAYMENT IN KIND */}
      {activeSubTab === 'payment-in-kind' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Payment In Kind Ledger</h2>
              <p className="text-xs text-slate-500 mt-0.5">Receive and value agricultural produce, firewood, livestock, and labor credited towards student fees</p>
            </div>

            <button
              onClick={() => setShowInKindModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Package className="w-4 h-4" />
              <span>+ Record Payment In Kind</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Voucher Ref</th>
                  <th className="py-3 px-5">Student & Adm</th>
                  <th className="py-3 px-5">Commodity / Produce</th>
                  <th className="py-3 px-5">Quantity</th>
                  <th className="py-3 px-5">Unit Rate</th>
                  <th className="py-3 px-5 text-right">Credited Value</th>
                  <th className="py-3 px-5">Delivered By</th>
                  <th className="py-3 px-5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inKindList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No produce payments recorded. Click "+ Record Payment In Kind" to receive farm produce or goods.
                    </td>
                  </tr>
                ) : (
                  inKindList.map((item) => {
                    const sName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Student';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 text-slate-600 font-medium">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 px-5 font-mono font-bold text-sky-700">{item.receipt_number}</td>
                        <td className="py-3.5 px-5">
                          <div className="font-extrabold text-slate-900 uppercase">{sName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Adm: {item.admission_number || '-'}</div>
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-900">{item.item_name}</td>
                        <td className="py-3.5 px-5 font-semibold text-slate-700">{item.quantity} {item.unit_of_measure}</td>
                        <td className="py-3.5 px-5 font-mono text-slate-600">KES {Number(item.unit_price).toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-emerald-600 font-mono">
                          KES {Number(item.total_value).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 text-slate-600">{item.delivered_by || 'Parent'}</td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            onClick={() => setActiveReceipt({
                              receipt_number: item.receipt_number,
                              student_name: sName,
                              admission_number: item.admission_number,
                              class_name: item.class_name || 'Form 1',
                              amount: item.total_value,
                              payment_mode: `IN-KIND (${item.item_name})`,
                              reference_code: `${item.quantity} ${item.unit_of_measure} @ KES ${item.unit_price}`,
                              payer_name: item.delivered_by,
                              created_at: item.created_at
                            })}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold"
                            title="Print Valuation Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
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

      {/* 4. SUB-TAB: BURSARIES */}
      {activeSubTab === 'bursaries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Government & CDF Bursaries Tracker</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage Constituency Development Fund (NG-CDF), County Government & Foundation student bursaries</p>
            </div>

            <button
              onClick={() => setShowBursaryModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Award className="w-4 h-4" />
              <span>+ Record Bursary Cheque</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Disbursement Date</th>
                  <th className="py-3 px-5">Bursary Scheme</th>
                  <th className="py-3 px-5">Cheque / Ref No</th>
                  <th className="py-3 px-5">Beneficiary Learner</th>
                  <th className="py-3 px-5">Term</th>
                  <th className="py-3 px-5 text-right">Allocated Amount</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bursariesList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No bursaries recorded yet. Click "+ Record Bursary Cheque" to disburse bursary funds to learners.
                    </td>
                  </tr>
                ) : (
                  bursariesList.map((bur) => {
                    const sName = `${bur.first_name || ''} ${bur.last_name || ''}`.trim() || 'Student';
                    return (
                      <tr key={bur.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 text-slate-600 font-medium">{bur.disbursement_date}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-900">{bur.sponsor_name}</td>
                        <td className="py-3.5 px-5 font-mono text-slate-700">{bur.cheque_number}</td>
                        <td className="py-3.5 px-5">
                          <div className="font-extrabold text-slate-900 uppercase">{sName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Adm: {bur.admission_number || '-'}</div>
                        </td>
                        <td className="py-3.5 px-5 text-slate-600 font-medium">{bur.term_name || 'Term 1'}</td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-emerald-600 font-mono">
                          KES {Number(bur.amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {bur.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            onClick={() => setActiveReceipt({
                              receipt_number: bur.cheque_number || 'BUR-VOUCHER',
                              student_name: sName,
                              admission_number: bur.admission_number,
                              class_name: bur.class_name || 'Form 1',
                              amount: bur.amount,
                              payment_mode: `BURSARY (${bur.sponsor_name})`,
                              reference_code: bur.cheque_number,
                              payer_name: bur.sponsor_name,
                              created_at: bur.disbursement_date
                            })}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold"
                            title="Print Bursary Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
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

      {/* 5. SUB-TAB: GRANTS */}
      {activeSubTab === 'grants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Ministry Capitation & Institutional Grants</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ministry of Education Free Day Secondary Education (FDSE) capitation disbursements and donor grants</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportToCsv('Capitation_Grants_Schedule', ['Date', 'Type', 'Title', 'Reference', 'Bank Account', 'Amount'], grantsList.map(g => [
                  new Date(g.created_at).toLocaleDateString(),
                  g.grant_type,
                  g.title,
                  g.reference_number,
                  g.bank_account,
                  g.amount
                ]))}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Capitation Schedule</span>
              </button>
              <button
                onClick={() => setShowGrantModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                <Landmark className="w-4 h-4" />
                <span>+ Record Ministry Grant</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grantsList.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                No capitation grants recorded yet. Click "+ Record Ministry Grant" to post government funds.
              </div>
            ) : (
              grantsList.map((g) => (
                <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                        {g.term_name || 'Term 1'}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1.5">{g.title}</h4>
                      <p className="text-[11px] text-slate-500">{g.grant_type}</p>
                    </div>
                    <Landmark className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Ref No.</span>
                      <span className="font-bold text-slate-800 font-mono">{g.reference_number}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Disbursed</span>
                      <span className="font-black text-emerald-600 font-mono text-sm">KES {Number(g.amount).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
                    <strong>Account:</strong> {g.bank_account}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. SUB-TAB: PLEDGES */}
      {activeSubTab === 'pledges' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Parent & Donor Fee Commitments</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track promissory fee notes, scheduled installments, and automated SMS reminders</p>
            </div>

            <button
              onClick={() => setShowPledgeModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Fee Pledge</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Beneficiary Learner</th>
                  <th className="py-3 px-5">Pledging Party</th>
                  <th className="py-3 px-5">Committed Due Date</th>
                  <th className="py-3 px-5 text-right">Pledged Amount</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pledgesList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No fee pledges registered yet. Click "+ Record Fee Pledge" to track parent commitments.
                    </td>
                  </tr>
                ) : (
                  pledgesList.map((plg) => {
                    const sName = `${plg.first_name || ''} ${plg.last_name || ''}`.trim() || 'Student';
                    return (
                      <tr key={plg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-extrabold text-slate-900 uppercase">{sName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Adm: {plg.admission_number || '-'}</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900">{plg.pledger_name}</div>
                          <div className="text-[11px] text-slate-500">{plg.pledger_phone || 'No phone'}</div>
                        </td>
                        <td className="py-3.5 px-5 text-slate-700 font-medium">{plg.expected_payment_date}</td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-slate-900 font-mono text-sm">
                          KES {Number(plg.amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            plg.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {plg.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleSendPledgeReminder(plg.id, plg.pledger_name)}
                              className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-xs font-bold flex items-center gap-1"
                              title="Send SMS Reminder"
                            >
                              <Send className="w-3 h-3" />
                              <span>SMS</span>
                            </button>
                            <button
                              onClick={() => {
                                setAddForm({
                                  student_id: plg.student_id,
                                  amount: String(plg.amount),
                                  channel: 'M-PESA',
                                  reference_number: '',
                                  payer_name: plg.pledger_name,
                                  notes: `Fulfillment of fee pledge committed on ${plg.expected_payment_date}`
                                });
                                setShowAddModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold"
                              title="Fulfill Pledge"
                            >
                              Receive
                            </button>
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

      {/* 7. SUB-TAB: OVERPAYMENTS */}
      {activeSubTab === 'overpayments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Student Prepaid / Overpayment Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">Learners with prepaid credit balances available for sibling transfer or next term roll-over</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Adm No</th>
                  <th className="py-3 px-5">Student Name</th>
                  <th className="py-3 px-5">Class</th>
                  <th className="py-3 px-5 text-right">Total Billed</th>
                  <th className="py-3 px-5 text-right">Total Paid</th>
                  <th className="py-3 px-5 text-right">Prepaid Credit Balance</th>
                  <th className="py-3 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overpaymentsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No student overpayments detected in active ledger.
                    </td>
                  </tr>
                ) : (
                  overpaymentsList.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{op.admission_number}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-900 uppercase">{op.first_name} {op.last_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{op.class_name}</td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-600">KES {Number(op.total_billed).toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-600">KES {Number(op.total_paid).toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-right font-black text-emerald-600 font-mono text-sm">
                        KES {Number(op.credit_balance).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => {
                            setTransferSourceStudent(op);
                            setTransferForm({
                              target_student_id: students.find(s => s.id !== op.id)?.id || '',
                              amount: String(op.credit_balance),
                              notes: `Transfer credit balance from ${op.first_name} ${op.last_name}`
                            });
                            setShowTransferModal(true);
                          }}
                          className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold flex items-center gap-1.5 mx-auto"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Transfer Credit</span>
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

      {/* 8. SUB-TAB: PENDING REVERSALS */}
      {activeSubTab === 'pending-reversals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Pending Payment Reversal Requests</h2>
              <p className="text-xs text-slate-500 mt-0.5">Segregated dual-control authorization workflow for cashier receipt cancellations</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Receipt Ref</th>
                  <th className="py-3 px-5">Student Beneficiary</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5">Channel</th>
                  <th className="py-3 px-5">Reversal Reason</th>
                  <th className="py-3 px-5">Requested By</th>
                  <th className="py-3 px-5 text-center">Maker-Checker Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingReversals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No pending reversal requests in authorization queue.
                    </td>
                  </tr>
                ) : (
                  pendingReversals.map((pr) => {
                    const sName = `${pr.first_name || ''} ${pr.last_name || ''}`.trim() || 'Student';
                    return (
                      <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{pr.receipt_number}</td>
                        <td className="py-3.5 px-5">
                          <div className="font-extrabold text-slate-900 uppercase">{sName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Adm: {pr.admission_number || '-'}</div>
                        </td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-rose-600 font-mono text-sm">
                          KES {Number(pr.amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 font-bold uppercase text-slate-700">{pr.channel}</td>
                        <td className="py-3.5 px-5 text-slate-700 max-w-xs">{pr.reason}</td>
                        <td className="py-3.5 px-5 text-slate-600">{pr.requested_by_name || 'Cashier'}</td>
                        <td className="py-3.5 px-5 text-center">
                          {currentRole !== 'auditor' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApproveReversal(pr.id, pr.receipt_number)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectTargetId(pr.id);
                                  setShowRejectModal(true);
                                }}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-rose-200"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">Awaiting Approval</span>
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

      {/* 9. SUB-TAB: REVERSED RECEIPTS */}
      {activeSubTab === 'reversed-receipts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Audit Log of Cancelled & Reversed Receipts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Permanent tamper-evident trail of reversed transactions with counter-balancing entries</p>
            </div>
            <button
              onClick={() => exportToCsv('Reversed_Receipts_Audit_Log', ['Receipt No', 'Student', 'Adm No', 'Amount', 'Reason', 'Requested By', 'Approved By', 'Date'], reversedReceipts.map(r => [
                r.receipt_number,
                `${r.first_name || ''} ${r.last_name || ''}`.trim(),
                r.admission_number,
                r.amount,
                r.reason,
                r.requested_by_name || 'Cashier',
                r.approved_by_name || 'Admin',
                new Date(r.reviewed_at || r.created_at).toLocaleString()
              ]))}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Audit Log</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Receipt Ref</th>
                  <th className="py-3 px-5">Student Beneficiary</th>
                  <th className="py-3 px-5 text-right">Reversed Amount</th>
                  <th className="py-3 px-5">Reason</th>
                  <th className="py-3 px-5">Requested By</th>
                  <th className="py-3 px-5">Approved By</th>
                  <th className="py-3 px-5">Reversal Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reversedReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      Zero reversed receipts in audit ledger. The financial record is 100% active.
                    </td>
                  </tr>
                ) : (
                  reversedReceipts.map((rr) => {
                    const sName = `${rr.first_name || ''} ${rr.last_name || ''}`.trim() || 'Student';
                    return (
                      <tr key={rr.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{rr.receipt_number}</td>
                        <td className="py-3.5 px-5">
                          <div className="font-extrabold text-slate-900 uppercase">{sName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Adm: {rr.admission_number || '-'}</div>
                        </td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-rose-600 font-mono text-sm">
                          KES {Number(rr.amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 text-slate-700">{rr.reason}</td>
                        <td className="py-3.5 px-5 text-slate-600">{rr.requested_by_name || 'Cashier'}</td>
                        <td className="py-3.5 px-5 text-slate-900 font-bold">{rr.approved_by_name || 'School Principal'}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-medium">
                          {new Date(rr.reviewed_at || rr.created_at).toLocaleString()}
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

      {/* Add Collection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Record Student Fee Collection</h3>
                <p className="text-xs text-slate-400 mt-0.5">Post funds directly into the immutable double-entry ledger</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Select Student <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={addForm.student_id}
                  onChange={(e) => setAddForm({ ...addForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} (Adm: {s.admission_number}) - {s.class_name || 'Class'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Amount Paid (KES) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Payment Channel <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={addForm.channel}
                    onChange={(e) => setAddForm({ ...addForm, channel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="BANK_DEPOSIT">Direct Bank Deposit / Slip</option>
                    <option value="M-PESA">M-Pesa</option>
                    <option value="CHEQUE">Cheque / Banker's Draft</option>
                    <option value="CASH">Cash Office</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Transaction / Slip Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. QGH78129K or Slip #0045"
                    value={addForm.reference_number}
                    onChange={(e) => setAddForm({ ...addForm, reference_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Payer Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Parent / Guardian"
                    value={addForm.payer_name}
                    onChange={(e) => setAddForm({ ...addForm, payer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Term 1 School Fees Payment"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Commit & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment In Kind Modal */}
      {showInKindModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Record Payment in Kind (Produce)</h3>
              <button onClick={() => setShowInKindModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddInKind} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Beneficiary Student</label>
                <select
                  required
                  value={newInKind.student_id}
                  onChange={(e) => setNewInKind({ ...newInKind, student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} (Adm: {s.admission_number}) - {s.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Commodity / Produce</label>
                <select
                  value={newInKind.item_name}
                  onChange={(e) => setNewInKind({ ...newInKind, item_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="Maize (90kg Bags)">Maize (90kg Bags)</option>
                  <option value="Beans (90kg Bags)">Beans (90kg Bags)</option>
                  <option value="Firewood (Pickups / Tons)">Firewood (Pickups / Tons)</option>
                  <option value="Building Sand (Tippers)">Building Sand (Tippers)</option>
                  <option value="Livestock / Dairy Cow">Livestock / Dairy Cow</option>
                  <option value="Skilled Labor / Construction">Skilled Labor / Construction</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    step="any"
                    placeholder="e.g. 3"
                    value={newInKind.quantity}
                    onChange={(e) => setNewInKind({ ...newInKind, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Unit Rate (KES)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 3500"
                    value={newInKind.unit_price}
                    onChange={(e) => setNewInKind({ ...newInKind, unit_price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex justify-between items-center">
                <span className="font-bold text-slate-700">Total Value Credited:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  KES {((parseFloat(newInKind.quantity) || 0) * (parseFloat(newInKind.unit_price) || 0)).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Delivered By</label>
                <input
                  type="text"
                  placeholder="e.g. Parent / Guardian"
                  value={newInKind.delivered_by}
                  onChange={(e) => setNewInKind({ ...newInKind, delivered_by: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInKindModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Credit Learner Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bursary Modal */}
      {showBursaryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Record Bursary Allocation</h3>
              <button onClick={() => setShowBursaryModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBursary} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Beneficiary Student</label>
                <select
                  required
                  value={newBursary.student_id}
                  onChange={(e) => setNewBursary({ ...newBursary, student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} (Adm: {s.admission_number}) - {s.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Bursary Scheme / Sponsor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NG-CDF Bursary Fund / County Gov"
                  value={newBursary.sponsor_name}
                  onChange={(e) => setNewBursary({ ...newBursary, sponsor_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 10000"
                    value={newBursary.amount}
                    onChange={(e) => setNewBursary({ ...newBursary, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Cheque / Voucher No</label>
                  <input
                    type="text"
                    placeholder="e.g. CHQ-778901"
                    value={newBursary.cheque_number}
                    onChange={(e) => setNewBursary({ ...newBursary, cheque_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Disbursement Date</label>
                  <input
                    type="date"
                    required
                    value={newBursary.disbursement_date}
                    onChange={(e) => setNewBursary({ ...newBursary, disbursement_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Term</label>
                  <select
                    value={newBursary.term_id}
                    onChange={(e) => setNewBursary({ ...newBursary, term_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  >
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBursaryModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Post Bursary Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Record Institutional Grant / Capitation</h3>
              <button onClick={() => setShowGrantModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGrant} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Grant / Capitation Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FDSE Term 1 2026 Capitation"
                  value={newGrant.title}
                  onChange={(e) => setNewGrant({ ...newGrant, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Grant Source / Type</label>
                <select
                  value={newGrant.grant_type}
                  onChange={(e) => setNewGrant({ ...newGrant, grant_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="Ministry of Education (FDSE Capitation)">Ministry of Education (FDSE Capitation)</option>
                  <option value="RMI Maintenance Grant">RMI Maintenance Grant</option>
                  <option value="Special Needs Education (SNE) Grant">Special Needs Education (SNE) Grant</option>
                  <option value="Donor / Foundation Grant">Donor / Foundation Grant</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Total Amount (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 450000"
                    value={newGrant.amount}
                    onChange={(e) => setNewGrant({ ...newGrant, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Reference / Advice No</label>
                  <input
                    type="text"
                    placeholder="e.g. MOE-FDSE-2026-01"
                    value={newGrant.reference_number}
                    onChange={(e) => setNewGrant({ ...newGrant, reference_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Bank Account Deposited</label>
                <input
                  type="text"
                  value={newGrant.bank_account}
                  onChange={(e) => setNewGrant({ ...newGrant, bank_account: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Save Grant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pledge Modal */}
      {showPledgeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Record Fee Pledge Commitment</h3>
              <button onClick={() => setShowPledgeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPledge} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Beneficiary Student</label>
                <select
                  required
                  value={newPledge.student_id}
                  onChange={(e) => setNewPledge({ ...newPledge, student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
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
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Pledging Party Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe (Parent)"
                    value={newPledge.pledger_name}
                    onChange={(e) => setNewPledge({ ...newPledge, pledger_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="0712345678"
                    value={newPledge.pledger_phone}
                    onChange={(e) => setNewPledge({ ...newPledge, pledger_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Pledged Amount (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={newPledge.amount}
                    onChange={(e) => setNewPledge({ ...newPledge, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Committed Due Date</label>
                  <input
                    type="date"
                    required
                    value={newPledge.expected_payment_date}
                    onChange={(e) => setNewPledge({ ...newPledge, expected_payment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Commitment Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Promised to clear fees after crop harvest"
                  value={newPledge.notes}
                  onChange={(e) => setNewPledge({ ...newPledge, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPledgeModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                  Save Commitment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Overpayment Credit Modal */}
      {showTransferModal && transferSourceStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-sky-600" />
                <span>Transfer Overpayment Credit</span>
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 space-y-1">
              <div className="font-bold text-slate-800">Source Student (With Credit):</div>
              <div className="text-sky-900 font-extrabold uppercase">{transferSourceStudent.first_name} {transferSourceStudent.last_name} (Adm: {transferSourceStudent.admission_number})</div>
              <div className="text-[11px] text-slate-600">Available Overpayment: <span className="font-bold font-mono text-emerald-700">KES {Number(transferSourceStudent.credit_balance).toLocaleString()}</span></div>
            </div>

            <form onSubmit={handleTransferCredit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Beneficiary Sibling / Student</label>
                <select
                  required
                  value={transferForm.target_student_id}
                  onChange={(e) => setTransferForm({ ...transferForm, target_student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                >
                  {students
                    .filter((s) => s.id !== transferSourceStudent.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} (Adm: {s.admission_number}) - {s.class_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Transfer Amount (KES)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={transferSourceStudent.credit_balance}
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-700">
                  Execute Credit Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reversal Request Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm pb-2 border-b border-slate-100">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>Request Payment Reversal (Maker-Checker)</span>
            </div>

            <p className="text-slate-600">
              You are requesting to reverse Receipt <strong>{reversalTarget.receipt_number || reversalTarget.reference_number}</strong> of <strong>KES {Number(reversalTarget.amount).toLocaleString()}</strong>.
            </p>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Reason for Reversal <span className="text-rose-500">*</span></label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Erroneous cash deposit entry, duplicate transaction, wrong student account..."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setReversalTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReversalRequest}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700"
              >
                Submit Reversal Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reversal Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>Reject Reversal Request</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Reason for Rejection</label>
              <textarea
                rows={2}
                placeholder="e.g. Transaction verified as valid and cleared with bank"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectTargetId(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectReversal}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt & Voucher Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      {/* M-Pesa C2B Paybill & STK Simulator */}
      <MpesaSimulatorModal
        isOpen={showMpesaModal}
        onClose={() => setShowMpesaModal(false)}
        students={students}
        onPaymentSuccess={() => {
          showToast('M-Pesa payment simulated and reconciled!');
          loadAllData();
        }}
      />
    </div>
  );
};