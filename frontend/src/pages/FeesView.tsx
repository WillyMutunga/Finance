import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { FeeStructure } from '../types';
import { FeeStructurePrintModal } from '../components/FeeStructurePrintModal';
import { StudentInvoicePrintModal } from '../components/StudentInvoicePrintModal';
import { InvoicesRegisterPrintModal } from '../components/InvoicesRegisterPrintModal';
import {
  Layers,
  FileText,
  FileMinus,
  FilePlus,
  Percent,
  Copy,
  Plus,
  Printer,
  ChevronDown,
  Edit,
  Eye,
  RotateCcw,
  CheckCircle2,
  X,
  ShieldCheck,
  ArrowRight,
  Download,
  Filter,
  Search,
  Trash2,
  Check,
  Receipt,
  DollarSign
} from 'lucide-react';

export const FeesView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('structures');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoicing Modal / Status
  const [invoicingTerm, setInvoicingTerm] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showAddStructureModal, setShowAddStructureModal] = useState(false);
  const [showDebitNoteModal, setShowDebitNoteModal] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedStructureForView, setSelectedStructureForView] = useState<any | null>(null);
  const [selectedStructureForPrint, setSelectedStructureForPrint] = useState<any | null>(null);
  const [editingStructure, setEditingStructure] = useState<any | null>(null);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<any | null>(null);
  const [showInvoicesRegisterPrint, setShowInvoicesRegisterPrint] = useState(false);

  // Subtabs
  const subTabs = [
    { id: 'structures', label: 'Fee Structures' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'debit-notes', label: 'Debit Notes' },
    { id: 'credit-notes', label: 'Credit Notes' },
    { id: 'discounts', label: 'Discounts' },
    { id: 'templates', label: 'Templates' },
  ];

  // System Configuration Data
  const [classesList, setClassesList] = useState<any[]>([]);
  const [termsList, setTermsList] = useState<any[]>([]);
  const [yearsList, setYearsList] = useState<any[]>([]);
  const [voteHeadsList, setVoteHeadsList] = useState<any[]>([]);
  const [invoicesList, setInvoicesList] = useState<Array<any>>([]);
  const [students, setStudents] = useState<Array<any>>([]);
  const [debitNotes, setDebitNotes] = useState<Array<any>>([]);
  const [creditNotes, setCreditNotes] = useState<Array<any>>([]);
  const [discountsList, setDiscountsList] = useState<Array<any>>([]);

  // Fee Structure Form
  const [newStructure, setNewStructure] = useState({
    title: '',
    class_id: '',
    term_id: '',
    academic_year_id: '',
    boarding_status: 'DAY',
    auto_invoice: true,
    items: {} as Record<string, number>
  });

  // Edit Structure Form State
  const [editForm, setEditForm] = useState({
    title: '',
    class_id: '',
    term_id: '',
    academic_year_id: '',
    boarding_status: 'ALL',
    items: {} as Record<string, number>
  });

  const [templatesList] = useState<Array<any>>([
    { id: 'tmpl-1', name: 'Standard Boarding Secondary Fee Structure', itemsCount: 6, total: 35000, target: 'Boarding' },
    { id: 'tmpl-2', name: 'Day Scholar Secondary Standard Package', itemsCount: 5, total: 18500, target: 'Day' },
    { id: 'tmpl-3', name: 'CBC Junior Secondary Grade 7-9 Package', itemsCount: 6, total: 22000, target: 'All' },
  ]);

  // Adjustment Forms
  const [newDebitNote, setNewDebitNote] = useState({ studentId: '', amount: '', reason: 'Lost textbook replacement fee' });
  const [newCreditNote, setNewCreditNote] = useState({ studentId: '', amount: '', reason: 'Fee waiver / overbilling correction' });
  const [newDiscount, setNewDiscount] = useState({ studentId: '', amount: '', reason: 'Needy Student Bursary Subsidy' });

  useEffect(() => {
    loadFeeData();
    loadAdjustments();
    loadStudents();
  }, [activeSubTab]);

  const loadStudents = async () => {
    try {
      const res = await ApiService.getStudents();
      if (res && res.data) {
        setStudents(res.data);
        if (res.data.length > 0) {
          setNewDebitNote((prev) => ({ ...prev, studentId: prev.studentId || res.data[0].id }));
          setNewCreditNote((prev) => ({ ...prev, studentId: prev.studentId || res.data[0].id }));
          setNewDiscount((prev) => ({ ...prev, studentId: prev.studentId || res.data[0].id }));
        }
      }
    } catch (e) {
      console.error('Error loading students:', e);
    }
  };

  const loadAdjustments = async () => {
    try {
      const res = await ApiService.getAdjustments();
      if (res && res.data) {
        setDebitNotes(res.data.filter((a: any) => a.adjustment_type === 'DEBIT_NOTE'));
        setCreditNotes(res.data.filter((a: any) => a.adjustment_type === 'CREDIT_NOTE'));
        setDiscountsList(res.data.filter((a: any) => a.adjustment_type === 'DISCOUNT_WAIVER'));
      }
    } catch (e) {
      console.error('Error loading adjustments:', e);
    }
  };

  const loadFeeData = async () => {
    setLoading(true);
    try {
      const [fsRes, vhRes, clsRes, trmRes, ayRes, invRes] = await Promise.all([
        ApiService.getFeeStructures(),
        ApiService.getVoteHeads(),
        ApiService.getClasses(),
        ApiService.getTerms(),
        ApiService.getAcademicYears(),
        ApiService.getInvoices()
      ]);

      if (fsRes && fsRes.data) setStructures(fsRes.data);
      if (vhRes && vhRes.data) {
        setVoteHeadsList(vhRes.data);
        const initialItems: Record<string, number> = {};
        vhRes.data.forEach((vh: any) => {
          if (vh.name.toLowerCase().includes('tuition')) initialItems[vh.id] = 12000;
          else if (vh.name.toLowerCase().includes('boarding')) initialItems[vh.id] = 15000;
          else if (vh.name.toLowerCase().includes('rmi') || vh.name.toLowerCase().includes('repair')) initialItems[vh.id] = 2500;
          else if (vh.name.toLowerCase().includes('activity') || vh.name.toLowerCase().includes('sport')) initialItems[vh.id] = 1500;
          else if (vh.name.toLowerCase().includes('water') || vh.name.toLowerCase().includes('electr')) initialItems[vh.id] = 2000;
          else initialItems[vh.id] = 2000;
        });
        setNewStructure((prev) => ({ ...prev, items: Object.keys(prev.items).length > 0 ? prev.items : initialItems }));
      }
      if (clsRes && clsRes.data) {
        setClassesList(clsRes.data);
        setNewStructure((prev) => ({ ...prev, class_id: prev.class_id || clsRes.data[0]?.id }));
      }
      if (trmRes && trmRes.data) {
        setTermsList(trmRes.data);
        const currTerm = trmRes.data.find((t: any) => t.is_current) || trmRes.data[0];
        setNewStructure((prev) => ({ ...prev, term_id: prev.term_id || currTerm?.id }));
      }
      if (ayRes && ayRes.data) {
        setYearsList(ayRes.data);
        setNewStructure((prev) => ({ ...prev, academic_year_id: prev.academic_year_id || ayRes.data[0]?.id }));
      }
      if (invRes && invRes.data) setInvoicesList(invRes.data);
    } catch (e) {
      console.error('Error loading fee data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStructure.class_id || !newStructure.term_id) {
      alert('Please select both a class and a term.');
      return;
    }

    const itemsPayload = Object.entries(newStructure.items)
      .filter(([_, amt]) => Number(amt) > 0)
      .map(([vote_head_id, amount]) => ({
        vote_head_id,
        amount: Number(amount),
        is_optional: false
      }));

    if (itemsPayload.length === 0) {
      alert('Please enter an amount for at least one vote head.');
      return;
    }

    try {
      const selectedClass = classesList.find((c) => c.id === newStructure.class_id);
      const selectedTerm = termsList.find((t) => t.id === newStructure.term_id);
      const autoTitle =
        newStructure.title.trim() ||
        `${selectedClass?.name || 'Form 1'} ${selectedTerm?.name || 'Term 1'} Fee Structure`;

      const res = await ApiService.createFeeStructure({
        title: autoTitle,
        class_id: newStructure.class_id,
        term_id: newStructure.term_id,
        academic_year_id: newStructure.academic_year_id || yearsList[0]?.id,
        boarding_status: newStructure.boarding_status,
        items: itemsPayload,
        auto_invoice: newStructure.auto_invoice
      });

      if (newStructure.auto_invoice && res?.data?.id) {
        await ApiService.bulkInvoice(res.data.id);
      }

      setShowAddStructureModal(false);
      setStatusMessage('Fee structure configured successfully and ledger synchronized.');
      await loadFeeData();
    } catch (err: any) {
      alert(err.message || 'Failed to create fee structure');
    }
  };

  const handleStartEdit = (fs: any) => {
    const itemsMap: Record<string, number> = {};
    if (fs.items && fs.items.length > 0) {
      fs.items.forEach((it: any) => {
        itemsMap[it.vote_head_id] = Number(it.amount) || 0;
      });
    } else {
      voteHeadsList.forEach((vh: any) => {
        itemsMap[vh.id] = 0;
      });
    }

    setEditingStructure(fs);
    setEditForm({
      title: fs.title || '',
      class_id: fs.class_id || classesList[0]?.id || '',
      term_id: fs.term_id || termsList[0]?.id || '',
      academic_year_id: fs.academic_year_id || yearsList[0]?.id || '',
      boarding_status: fs.boarding_status || 'ALL',
      items: itemsMap
    });
  };

  const handleUpdateFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStructure) return;

    const itemsPayload = Object.entries(editForm.items)
      .filter(([_, amt]) => Number(amt) > 0)
      .map(([vote_head_id, amount]) => ({
        vote_head_id,
        amount: Number(amount),
        is_optional: false
      }));

    if (itemsPayload.length === 0) {
      alert('Please enter an amount for at least one vote head.');
      return;
    }

    try {
      await ApiService.updateFeeStructure(editingStructure.id, {
        title: editForm.title.trim() || editingStructure.title,
        class_id: editForm.class_id,
        term_id: editForm.term_id,
        academic_year_id: editForm.academic_year_id,
        items: itemsPayload
      });

      setEditingStructure(null);
      setStatusMessage(`Fee structure "${editForm.title}" updated successfully.`);
      await loadFeeData();
    } catch (err: any) {
      alert(err.message || 'Failed to update fee structure');
    }
  };

  const handleDeleteFeeStructure = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await ApiService.deleteFeeStructure(id);
      setStatusMessage(`Fee structure "${title}" deleted successfully.`);
      await loadFeeData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete fee structure');
    }
  };

  const handleInvoiceStructure = async (structureId: string, title: string) => {
    setInvoicingTerm(structureId);
    setStatusMessage(null);
    try {
      const res = await ApiService.bulkInvoice(structureId);
      setStatusMessage(`Invoiced students for "${title}" successfully: ${res.message}`);
      await loadFeeData();
    } catch (e: any) {
      setStatusMessage(e.message || `Invoiced "${title}" successfully.`);
    } finally {
      setInvoicingTerm(null);
    }
  };

  const handleCreateDebitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.createAdjustment({
        student_id: newDebitNote.studentId,
        adjustment_type: 'DEBIT_NOTE',
        amount: Number(newDebitNote.amount),
        reason: newDebitNote.reason
      });
      setShowDebitNoteModal(false);
      setStatusMessage(res.message || 'Debit note posted to ledger.');
      await loadAdjustments();
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to issue debit note');
    }
  };

  const handleCreateCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.createAdjustment({
        student_id: newCreditNote.studentId,
        adjustment_type: 'CREDIT_NOTE',
        amount: Number(newCreditNote.amount),
        reason: newCreditNote.reason
      });
      setShowCreditNoteModal(false);
      setStatusMessage(res.message || 'Credit note waiver applied.');
      await loadAdjustments();
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to issue credit note');
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.createAdjustment({
        student_id: newDiscount.studentId,
        adjustment_type: 'DISCOUNT_WAIVER',
        amount: Number(newDiscount.amount),
        reason: newDiscount.reason
      });
      setShowDiscountModal(false);
      setStatusMessage(res.message || 'Scholarship discount voucher credited.');
      await loadAdjustments();
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to apply discount');
    }
  };

  const formatCurrency = (amt: number) => {
    return 'KES ' + Number(amt || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-slate-800">
      {/* 1. Sub-Navigation Tabs */}
      <div className="bg-white rounded-t-xl border-b border-slate-200 px-4 flex items-center gap-6 overflow-x-auto text-xs font-medium text-slate-600">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`py-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-700 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. SUB-TAB: FEE STRUCTURES */}
      {activeSubTab === 'structures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Academic Year</div>
              <div className="flex items-center gap-1 text-xs font-bold text-sky-600">
                <span>{selectedYear}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (classesList.length > 0 && termsList.length > 0) {
                  const cObj = classesList[0];
                  const tObj = termsList.find((t) => t.is_current) || termsList[0];
                  setNewStructure((prev) => ({
                    ...prev,
                    class_id: cObj.id,
                    term_id: tObj.id,
                    title: `${cObj.name} ${tObj.name} 2026 Fee Structure`
                  }));
                }
                setShowAddStructureModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fee Structure</span>
            </button>
          </div>

          <div className="space-y-3">
            {structures.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-3">
                <p className="text-slate-500 text-xs">No fee structures configured yet for this academic year.</p>
                <button
                  onClick={() => setShowAddStructureModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  + Create First Fee Structure
                </button>
              </div>
            ) : (
              structures.map((fs) => (
                <div
                  key={fs.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-extrabold text-sm text-slate-900">{fs.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        {fs.term_name || 'Term'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {fs.class_name || 'Class'}
                      </span>
                      {fs.boarding_status === 'DAY' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Day Scholar
                        </span>
                      ) : fs.boarding_status === 'BOARDING' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Boarding
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          All Students
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div>
                        Total Fee:{' '}
                        <span className="font-extrabold font-mono text-emerald-700 text-sm">
                          {formatCurrency(fs.total_amount)}
                        </span>
                      </div>
                      <div>
                        Vote Heads:{' '}
                        <span className="font-bold text-slate-800">
                          {fs.items ? fs.items.length : 0} items
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedStructureForView(fs)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                      title="View itemized vote head breakdown"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Breakdown</span>
                    </button>

                    <button
                      onClick={() => setSelectedStructureForPrint(fs)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors"
                      title="Print official fee structure document"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Print</span>
                    </button>

                    <button
                      onClick={() => handleStartEdit(fs)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-sky-700 hover:bg-sky-50 border border-sky-200 transition-colors"
                      title="Edit fee structure & vote heads"
                    >
                      <Edit className="w-3.5 h-3.5 text-sky-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteFeeStructure(fs.id, fs.title)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
                      title="Delete fee structure"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete</span>
                    </button>

                    <button
                      disabled={invoicingTerm === fs.id}
                      onClick={() => handleInvoiceStructure(fs.id, fs.title)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{invoicingTerm === fs.id ? 'Invoicing...' : 'Issue Invoices'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. SUB-TAB: INVOICES REGISTER */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Invoices Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">Immutable term billing records and official student fee invoices</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInvoicesRegisterPrint(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 shadow-sm transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Register Report</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-5">Invoice No</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Admission No</th>
                  <th className="py-3 px-5">Student Name</th>
                  <th className="py-3 px-5">Class</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Term</th>
                  <th className="py-3 px-5 text-right">Amount (KES)</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoicesList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                      No invoices generated yet. Click "Issue Invoices" in Fee Structures to bill active learners.
                    </td>
                  </tr>
                ) : (
                  invoicesList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="font-mono font-bold text-emerald-700 hover:text-emerald-900 hover:underline text-left cursor-pointer flex items-center gap-1"
                          title="Click to view & print invoice"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{inv.invoice_number || inv.id}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{inv.admission_number}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">{inv.first_name} {inv.last_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{inv.class_name}</td>
                      <td className="py-3.5 px-5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          inv.student_boarding_status === 'BOARDING' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}>
                          {inv.student_boarding_status === 'BOARDING' ? 'Boarding' : 'Day Scholar'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 font-medium">{inv.term_name}</td>
                      <td className="py-3.5 px-5 text-right font-mono font-black text-slate-950">
                        {formatCurrency(inv.total_billed)}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {inv.status || 'ISSUED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-2xs transition-colors"
                          title="Print official fee invoice"
                        >
                          <Printer className="w-3 h-3 text-emerald-700" />
                          <span>Print</span>
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

      {/* 4. SUB-TAB: DEBIT NOTES */}
      {activeSubTab === 'debit-notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Debit Notes Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">Post individual fee charges (lost books, damages, trip additions) to student ledgers</p>
            </div>

            <button
              onClick={() => setShowDebitNoteModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Issue Debit Note</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-5">Debit Note #</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Student Adm</th>
                  <th className="py-3 px-5">Reason / Description</th>
                  <th className="py-3 px-5 text-right">Amount (KES)</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {debitNotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No debit notes issued yet. Click "+ Issue Debit Note" to post an extra charge.
                    </td>
                  </tr>
                ) : (
                  debitNotes.map((dbn) => (
                    <tr key={dbn.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{dbn.id}</td>
                      <td className="py-3.5 px-5 text-slate-600">{dbn.date}</td>
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{dbn.studentAdm}</td>
                      <td className="py-3.5 px-5 text-slate-700">{dbn.reason}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-rose-600 font-mono">
                        KES {Number(dbn.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {dbn.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SUB-TAB: CREDIT NOTES */}
      {activeSubTab === 'credit-notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Credit Notes Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">Approved fee reductions and billing corrections credited to student ledger</p>
            </div>

            <button
              onClick={() => setShowCreditNoteModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Issue Credit Note</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-5">Credit Note #</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Student Adm</th>
                  <th className="py-3 px-5">Reason</th>
                  <th className="py-3 px-5 text-right">Amount (KES)</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditNotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No credit notes issued.
                    </td>
                  </tr>
                ) : (
                  creditNotes.map((crn) => (
                    <tr key={crn.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{crn.id}</td>
                      <td className="py-3.5 px-5 text-slate-600">{crn.date}</td>
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{crn.studentAdm}</td>
                      <td className="py-3.5 px-5 text-slate-700">{crn.reason}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-emerald-600 font-mono">
                        KES {Number(crn.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {crn.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SUB-TAB: DISCOUNTS */}
      {activeSubTab === 'discounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Discounts & Bursary Subsidies</h2>
              <p className="text-xs text-slate-500 mt-0.5">Needy student scholarships, CDF subsidies, and sibling discounts</p>
            </div>

            <button
              onClick={() => setShowDiscountModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Apply Discount Voucher</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-5">Voucher #</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Student Adm</th>
                  <th className="py-3 px-5">Discount Title</th>
                  <th className="py-3 px-5 text-right">Value (KES)</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discountsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No discounts recorded.
                    </td>
                  </tr>
                ) : (
                  discountsList.map((disc) => (
                    <tr key={disc.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{disc.id}</td>
                      <td className="py-3.5 px-5 text-slate-600">{disc.date}</td>
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{disc.studentAdm}</td>
                      <td className="py-3.5 px-5 text-slate-700">{disc.reason}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-emerald-600 font-mono">
                        KES {Number(disc.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {disc.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. SUB-TAB: TEMPLATES */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fee Structure Templates</h2>
              <p className="text-xs text-slate-500 mt-0.5">Standardized fee blueprints for quick term setup</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templatesList.map((tmpl) => (
              <div key={tmpl.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{tmpl.name}</span>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Vote Heads: <span className="font-bold text-slate-800">{tmpl.itemsCount} heads</span></div>
                  <div>Default Target: <span className="font-bold text-slate-800">{tmpl.target}</span></div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatCurrency(tmpl.total)}
                  </span>
                  <button
                    onClick={() => {
                      setShowAddStructureModal(true);
                    }}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-bold text-xs"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Fee Structure Modal */}
      {showAddStructureModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Create New Fee Structure</h3>
                <p className="text-xs text-slate-500">Configure term fee structures and vote head breakdown</p>
              </div>
              <button onClick={() => setShowAddStructureModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFeeStructure} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Target Class *</label>
                  <select
                    value={newStructure.class_id}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const cObj = classesList.find((c) => c.id === cid);
                      const tObj = termsList.find((t) => t.id === newStructure.term_id);
                      const catLabel = newStructure.boarding_status === 'DAY' ? ' - Day Scholar' : (newStructure.boarding_status === 'BOARDING' ? ' - Boarding' : '');
                      setNewStructure({
                        ...newStructure,
                        class_id: cid,
                        title: `${cObj?.name || 'Class'} ${tObj?.name || 'Term'} Fee Structure${catLabel}`
                      });
                    }}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Term *</label>
                  <select
                    value={newStructure.term_id}
                    onChange={(e) => {
                      const tid = e.target.value;
                      const cObj = classesList.find((c) => c.id === newStructure.class_id);
                      const tObj = termsList.find((t) => t.id === tid);
                      const catLabel = newStructure.boarding_status === 'DAY' ? ' - Day Scholar' : (newStructure.boarding_status === 'BOARDING' ? ' - Boarding' : '');
                      setNewStructure({
                        ...newStructure,
                        term_id: tid,
                        title: `${cObj?.name || 'Class'} ${tObj?.name || 'Term'} Fee Structure${catLabel}`
                      });
                    }}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    {termsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.is_current ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-800 mb-1">Boarding Status *</label>
                  <select
                    value={newStructure.boarding_status}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const cObj = classesList.find((c) => c.id === newStructure.class_id);
                      const tObj = termsList.find((t) => t.id === newStructure.term_id);
                      const catLabel = cat === 'DAY' ? ' - Day Scholar' : (cat === 'BOARDING' ? ' - Boarding' : '');
                      setNewStructure({
                        ...newStructure,
                        boarding_status: cat,
                        title: `${cObj?.name || 'Class'} ${tObj?.name || 'Term'} Fee Structure${catLabel}`
                      });
                    }}
                    required
                    className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg font-bold text-emerald-950 bg-emerald-50/50"
                  >
                    <option value="DAY">Day Scholar</option>
                    <option value="BOARDING">Boarding</option>
                    <option value="ALL">All (Day & Boarding)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Academic Year</label>
                  <select
                    value={newStructure.academic_year_id}
                    onChange={(e) => setNewStructure({ ...newStructure, academic_year_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    {yearsList.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Fee Structure Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Form 1 Term 1 2026 Fee Structure"
                  value={newStructure.title}
                  onChange={(e) => setNewStructure({ ...newStructure, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-900"
                />
              </div>

              {/* Vote Heads Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-[11px] uppercase text-slate-700">Vote Head Particulars</span>
                  <span className="font-bold text-[11px] uppercase text-slate-500">Amount (KES)</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto p-2 space-y-1">
                  {voteHeadsList.map((vh) => (
                    <div key={vh.id} className="flex items-center justify-between gap-4 p-2 hover:bg-slate-50 rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs">{vh.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Code: {vh.account_code || '100'}</span>
                      </div>
                      <div className="w-40">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="0.00"
                          value={newStructure.items[vh.id] ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setNewStructure({
                              ...newStructure,
                              items: { ...newStructure.items, [vh.id]: val }
                            });
                          }}
                          className="w-full text-right px-3 py-1.5 border border-slate-200 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Summary Footer */}
                <div className="bg-emerald-50 px-4 py-3 border-t border-emerald-100 flex justify-between items-center font-extrabold text-sm text-emerald-900">
                  <span>TOTAL FEE PER STUDENT:</span>
                  <span className="font-mono text-base text-emerald-800">
                    KES{' '}
                    {Object.values(newStructure.items)
                      .reduce((acc, curr) => acc + (Number(curr) || 0), 0)
                      .toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Invoicing Option Checkbox */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="auto_invoice"
                  checked={newStructure.auto_invoice}
                  onChange={(e) => setNewStructure({ ...newStructure, auto_invoice: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="auto_invoice" className="text-xs text-slate-700 cursor-pointer">
                  <span className="font-bold block text-slate-900">Auto-Generate & Issue Invoices to Active Students</span>
                  Immediately generate invoices and debit the student financial ledgers for this class.
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStructureModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95"
                >
                  Save Fee Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fee Structure Modal */}
      {editingStructure && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Fee Structure</h3>
                <p className="text-xs text-slate-500">Modify vote head breakdown and term fee amounts</p>
              </div>
              <button onClick={() => setEditingStructure(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFeeStructure} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Target Class *</label>
                  <select
                    value={editForm.class_id}
                    onChange={(e) => setEditForm({ ...editForm, class_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Term *</label>
                  <select
                    value={editForm.term_id}
                    onChange={(e) => setEditForm({ ...editForm, term_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    {termsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.is_current ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-800 mb-1">Boarding Status *</label>
                  <select
                    value={editForm.boarding_status}
                    onChange={(e) => setEditForm({ ...editForm, boarding_status: e.target.value })}
                    required
                    className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg font-bold text-emerald-950 bg-emerald-50/50"
                  >
                    <option value="DAY">Day Scholar</option>
                    <option value="BOARDING">Boarding</option>
                    <option value="ALL">All (Day & Boarding)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Academic Year</label>
                  <select
                    value={editForm.academic_year_id}
                    onChange={(e) => setEditForm({ ...editForm, academic_year_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    {yearsList.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Fee Structure Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-900"
                />
              </div>

              {/* Vote Heads Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-[11px] uppercase text-slate-700">Vote Head Particulars</span>
                  <span className="font-bold text-[11px] uppercase text-slate-500">Amount (KES)</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto p-2 space-y-1">
                  {voteHeadsList.map((vh) => (
                    <div key={vh.id} className="flex items-center justify-between gap-4 p-2 hover:bg-slate-50 rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs">{vh.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Code: {vh.account_code || '100'}</span>
                      </div>
                      <div className="w-40">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="0.00"
                          value={editForm.items[vh.id] ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEditForm({
                              ...editForm,
                              items: { ...editForm.items, [vh.id]: val }
                            });
                          }}
                          className="w-full text-right px-3 py-1.5 border border-slate-200 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Summary Footer */}
                <div className="bg-emerald-50 px-4 py-3 border-t border-emerald-100 flex justify-between items-center font-extrabold text-sm text-emerald-900">
                  <span>TOTAL FEE PER STUDENT:</span>
                  <span className="font-mono text-base text-emerald-800">
                    KES{' '}
                    {Object.values(editForm.items)
                      .reduce((acc, curr) => acc + (Number(curr) || 0), 0)
                      .toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStructure(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Fee Structure Breakdown Modal */}
      {selectedStructureForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedStructureForView.title}</h3>
                <p className="text-xs text-slate-500">
                  {selectedStructureForView.term_name} &bull; {selectedStructureForView.class_name}
                </p>
              </div>
              <button onClick={() => setSelectedStructureForView(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {selectedStructureForView.items && selectedStructureForView.items.length > 0 ? (
                  selectedStructureForView.items.map((item: any) => (
                    <div key={item.id} className="p-3 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800">{item.vote_head_name}</span>
                        <span className="text-[10px] text-slate-400 ml-2 font-mono">
                          {item.account_code ? `(${item.account_code})` : ''}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400">No vote head breakdown details found.</div>
                )}

                <div className="p-3 bg-emerald-50 flex justify-between items-center font-extrabold text-emerald-900">
                  <span>TOTAL BILLING:</span>
                  <span className="font-mono text-base">{formatCurrency(selectedStructureForView.total_amount)}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedStructureForView(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleInvoiceStructure(selectedStructureForView.id, selectedStructureForView.title);
                    setSelectedStructureForView(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold"
                >
                  Issue Invoices Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debit Note Modal */}
      {showDebitNoteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Issue Debit Note (Extra Fee Charge)</h3>
              <button onClick={() => setShowDebitNoteModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDebitNote} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Student</label>
                <select
                  value={newDebitNote.studentId}
                  onChange={(e) => setNewDebitNote({ ...newDebitNote, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.admission_number} - {s.first_name} {s.last_name} ({s.class_name || 'Form 1'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Debit Amount (KES)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 1500"
                  value={newDebitNote.amount}
                  onChange={(e) => setNewDebitNote({ ...newDebitNote, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Reason / Item Description</label>
                <input
                  type="text"
                  required
                  value={newDebitNote.reason}
                  onChange={(e) => setNewDebitNote({ ...newDebitNote, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDebitNoteModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">
                  Post Debit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Note Modal */}
      {showCreditNoteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Issue Credit Note / Fee Reduction</h3>
              <button onClick={() => setShowCreditNoteModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCreditNote} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Student</label>
                <select
                  value={newCreditNote.studentId}
                  onChange={(e) => setNewCreditNote({ ...newCreditNote, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.admission_number} - {s.first_name} {s.last_name} ({s.class_name || 'Form 1'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Amount to Credit (KES)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 2000"
                  value={newCreditNote.amount}
                  onChange={(e) => setNewCreditNote({ ...newCreditNote, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Reason / Waiver Detail</label>
                <input
                  type="text"
                  required
                  value={newCreditNote.reason}
                  onChange={(e) => setNewCreditNote({ ...newCreditNote, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreditNoteModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">
                  Approve Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Apply Bursary / Discount Voucher</h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDiscount} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Student</label>
                <select
                  value={newDiscount.studentId}
                  onChange={(e) => setNewDiscount({ ...newDiscount, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.admission_number} - {s.first_name} {s.last_name} ({s.class_name || 'Form 1'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Scholarship Amount (KES)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={newDiscount.amount}
                  onChange={(e) => setNewDiscount({ ...newDiscount, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Discount Scheme / Sponsor</label>
                <input
                  type="text"
                  required
                  value={newDiscount.reason}
                  onChange={(e) => setNewDiscount({ ...newDiscount, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">
                  Credit Scholarship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Fee Structure Modal */}
      {selectedStructureForPrint && (
        <FeeStructurePrintModal
          structure={selectedStructureForPrint}
          onClose={() => setSelectedStructureForPrint(null)}
          schoolName="NDUUNDUNE SECONDARY SCHOOL"
        />
      )}

      {/* Official Printable Student Fee Invoice Modal */}
      {selectedInvoiceForPrint && (
        <StudentInvoicePrintModal
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}

      {/* Official Printable Invoices Register Report Modal */}
      {showInvoicesRegisterPrint && (
        <InvoicesRegisterPrintModal
          invoices={invoicesList}
          onClose={() => setShowInvoicesRegisterPrint(false)}
        />
      )}
    </div>
  );
};