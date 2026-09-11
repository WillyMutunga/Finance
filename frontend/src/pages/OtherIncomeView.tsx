import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { OtherIncomeReceiptModal } from '../components/OtherIncomeReceiptModal';
import { exportToCsv } from '../utils/exportUtils';
import {
  Plus,
  Printer,
  Download,
  Search,
  RotateCw,
  MoreVertical,
  X,
  Building,
  DollarSign,
  FileText,
  Heart,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Wallet,
  Coins,
  Check,
  Trash2,
  Edit3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const OtherIncomeView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('receipts');
  const [loading, setLoading] = useState(true);

  // Data lists
  const [receipts, setReceipts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [takeOns, setTakeOns] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showAddReceiptModal, setShowAddReceiptModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showPayInvoiceModal, setShowPayInvoiceModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddTakeOnModal, setShowAddTakeOnModal] = useState(false);
  const [showAddDonationModal, setShowAddDonationModal] = useState(false);
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [selectedReceiptForSlip, setSelectedReceiptForSlip] = useState<any | null>(null);
  const [activeInvoiceToPay, setActiveInvoiceToPay] = useState<any | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  // Form states
  const [receiptForm, setReceiptForm] = useState({
    category_id: '',
    customer_id: '',
    payer_name: '',
    amount: '',
    payment_method: 'BANK_TRANSFER',
    bank_account: 'Main Operations Account (KCB)',
    transaction_reference: '',
    cheque_number: '',
    description: '',
    receipt_date: new Date().toISOString().split('T')[0]
  });

  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: '',
    category_id: '',
    amount: '',
    description: '',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [payInvoiceForm, setPayInvoiceForm] = useState({
    amount: '',
    payment_method: 'BANK_TRANSFER',
    bank_account: 'Main Operations Account (KCB)',
    transaction_reference: '',
    cheque_number: '',
    description: ''
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    category: 'Canteen Tenant / Contractor',
    phone: '',
    email: '',
    kra_pin: '',
    address: '',
    opening_balance: '0'
  });

  const [takeOnForm, setTakeOnForm] = useState({
    customer_id: '',
    amount: '',
    description: 'Opening historical balance brought forward'
  });

  const [donationForm, setDonationForm] = useState({
    donor_id: '',
    category_id: '',
    amount: '',
    purpose: '',
    payment_method: 'BANK_TRANSFER',
    bank_account: 'Development / Projects Account (Equity)',
    transaction_reference: '',
    donation_date: new Date().toISOString().split('T')[0]
  });

  const [donorForm, setDonorForm] = useState({
    name: '',
    donor_type: 'INDIVIDUAL',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    account_code: '',
    description: ''
  });

  const subTabs = [
    { id: 'receipts', label: 'Receipts Register' },
    { id: 'customer-invoices', label: 'Customer Invoices' },
    { id: 'customers', label: 'Customers / Debtors' },
    { id: 'customer-take-ons', label: 'Customer Take-Ons' },
    { id: 'donations', label: 'Donations & Grants' },
    { id: 'donors', label: 'Donors Directory' },
    { id: 'categories', label: 'Revenue Streams / Vote Heads' }
  ];

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        resCats,
        resReceipts,
        resInvoices,
        resCustomers,
        resTakeOns,
        resDonations,
        resDonors
      ] = await Promise.allSettled([
        ApiService.getOtherIncomeCategories(),
        ApiService.getOtherIncomeReceipts(),
        ApiService.getOtherIncomeInvoices(),
        ApiService.getOtherIncomeCustomers(),
        ApiService.getOtherIncomeTakeOns(),
        ApiService.getDonations(),
        ApiService.getDonors()
      ]);

      if (resCats.status === 'fulfilled' && resCats.value.data) {
        setCategories(resCats.value.data);
        if (resCats.value.data.length > 0 && !receiptForm.category_id) {
          setReceiptForm((prev) => ({ ...prev, category_id: resCats.value.data[0].id }));
          setInvoiceForm((prev) => ({ ...prev, category_id: resCats.value.data[0].id }));
          setDonationForm((prev) => ({ ...prev, category_id: resCats.value.data[0].id }));
        }
      }

      if (resReceipts.status === 'fulfilled' && resReceipts.value.data) setReceipts(resReceipts.value.data);
      if (resInvoices.status === 'fulfilled' && resInvoices.value.data) setInvoices(resInvoices.value.data);
      if (resCustomers.status === 'fulfilled' && resCustomers.value.data) {
        setCustomers(resCustomers.value.data);
        if (resCustomers.value.data.length > 0) {
          if (!invoiceForm.customer_id) setInvoiceForm((prev) => ({ ...prev, customer_id: resCustomers.value.data[0].id }));
          if (!takeOnForm.customer_id) setTakeOnForm((prev) => ({ ...prev, customer_id: resCustomers.value.data[0].id }));
        }
      }
      if (resTakeOns.status === 'fulfilled' && resTakeOns.value.data) setTakeOns(resTakeOns.value.data);
      if (resDonations.status === 'fulfilled' && resDonations.value.data) setDonations(resDonations.value.data);
      if (resDonors.status === 'fulfilled' && resDonors.value.data) {
        setDonors(resDonors.value.data);
        if (resDonors.value.data.length > 0 && !donationForm.donor_id) {
          setDonationForm((prev) => ({ ...prev, donor_id: resDonors.value.data[0].id }));
        }
      }
    } catch (e) {
      console.error('Error loading other income data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Format currency
  const formatKES = (val: number) => `KES ${Number(val || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Summary Metrics
  const totalReceiptsAmount = receipts.reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const totalCustomerReceivables = customers.reduce((acc, c) => acc + Number(c.current_balance || 0), 0);
  const totalDonationsAmount = donations.reduce((acc, d) => acc + Number(d.amount || 0), 0);

  // 1. Create Receipt
  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(receiptForm.amount);
    if (!receiptForm.payer_name.trim() || !amt || amt <= 0) {
      alert('Please provide Payer Name and a valid Amount.');
      return;
    }

    try {
      const res = await ApiService.createOtherIncomeReceipt({
        category_id: receiptForm.category_id || categories[0]?.id,
        customer_id: receiptForm.customer_id || undefined,
        payer_name: receiptForm.payer_name.trim(),
        amount: amt,
        payment_method: receiptForm.payment_method,
        bank_account: receiptForm.bank_account,
        transaction_reference: receiptForm.transaction_reference.trim() || undefined,
        cheque_number: receiptForm.cheque_number.trim() || undefined,
        description: receiptForm.description.trim() || 'Other Income Collection',
        receipt_date: receiptForm.receipt_date
      });

      setShowAddReceiptModal(false);
      showToast('Other income receipt posted successfully!');
      if (res?.data) {
        setSelectedReceiptForSlip(res.data);
      }
      setReceiptForm({
        category_id: categories[0]?.id || '',
        customer_id: '',
        payer_name: '',
        amount: '',
        payment_method: 'BANK_TRANSFER',
        bank_account: 'Main Operations Account (KCB)',
        transaction_reference: '',
        cheque_number: '',
        description: '',
        receipt_date: new Date().toISOString().split('T')[0]
      });
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error recording receipt');
    }
  };

  // 2. Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(invoiceForm.amount);
    if (!invoiceForm.customer_id || !amt || amt <= 0) {
      alert('Please select Customer and valid Amount.');
      return;
    }

    try {
      await ApiService.createOtherIncomeInvoice({
        customer_id: invoiceForm.customer_id,
        category_id: invoiceForm.category_id || categories[0]?.id,
        amount: amt,
        description: invoiceForm.description.trim() || 'Customer Invoice for Other Income Services',
        due_date: invoiceForm.due_date
      });

      setShowAddInvoiceModal(false);
      showToast('Customer invoice generated successfully!');
      setInvoiceForm({
        customer_id: customers[0]?.id || '',
        category_id: categories[0]?.id || '',
        amount: '',
        description: '',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error creating customer invoice');
    }
  };

  // 3. Pay Invoice
  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoiceToPay) return;
    const amt = parseFloat(payInvoiceForm.amount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    try {
      const res = await ApiService.payOtherIncomeInvoice(activeInvoiceToPay.id, {
        amount: amt,
        payment_method: payInvoiceForm.payment_method,
        bank_account: payInvoiceForm.bank_account,
        transaction_reference: payInvoiceForm.transaction_reference.trim() || undefined,
        cheque_number: payInvoiceForm.cheque_number.trim() || undefined,
        description: payInvoiceForm.description.trim() || undefined
      });

      setShowPayInvoiceModal(false);
      setActiveInvoiceToPay(null);
      showToast('Invoice settled & official receipt generated!');
      if (res?.data) {
        setSelectedReceiptForSlip(res.data);
      }
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error settling invoice');
    }
  };

  // 4. Create Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      alert('Customer Name is required.');
      return;
    }

    try {
      if (editingCustomer) {
        await ApiService.updateOtherIncomeCustomer(editingCustomer.id, customerForm);
        showToast('Customer profile updated successfully!');
      } else {
        await ApiService.createOtherIncomeCustomer({
          name: customerForm.name.trim(),
          category: customerForm.category,
          phone: customerForm.phone.trim() || undefined,
          email: customerForm.email.trim() || undefined,
          kra_pin: customerForm.kra_pin.trim() || undefined,
          address: customerForm.address.trim() || undefined,
          opening_balance: parseFloat(customerForm.opening_balance) || 0
        });
        showToast('External customer added successfully!');
      }

      setShowAddCustomerModal(false);
      setEditingCustomer(null);
      setCustomerForm({
        name: '',
        category: 'Canteen Tenant / Contractor',
        phone: '',
        email: '',
        kra_pin: '',
        address: '',
        opening_balance: '0'
      });
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error saving customer');
    }
  };

  // 5. Delete Customer
  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Delete customer profile "${name}"?`)) return;
    try {
      await ApiService.deleteOtherIncomeCustomer(id);
      showToast('Customer deleted.');
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error deleting customer');
    }
  };

  // 6. Create Take-On
  const handleCreateTakeOn = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(takeOnForm.amount);
    if (!takeOnForm.customer_id || !amt || amt <= 0) {
      alert('Please select Customer and valid Amount.');
      return;
    }

    try {
      await ApiService.createOtherIncomeTakeOn({
        customer_id: takeOnForm.customer_id,
        amount: amt,
        description: takeOnForm.description.trim() || 'Opening balance brought forward'
      });

      setShowAddTakeOnModal(false);
      showToast('Opening balance take-on committed!');
      setTakeOnForm({
        customer_id: customers[0]?.id || '',
        amount: '',
        description: 'Opening historical balance brought forward'
      });
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error creating take-on');
    }
  };

  // 7. Create Donation
  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(donationForm.amount);
    if (!donationForm.donor_id || !amt || amt <= 0 || !donationForm.purpose.trim()) {
      alert('Please select Donor, enter Amount and Purpose.');
      return;
    }

    try {
      const res = await ApiService.createDonation({
        donor_id: donationForm.donor_id,
        category_id: donationForm.category_id || undefined,
        amount: amt,
        purpose: donationForm.purpose.trim(),
        payment_method: donationForm.payment_method,
        bank_account: donationForm.bank_account,
        transaction_reference: donationForm.transaction_reference.trim() || undefined,
        donation_date: donationForm.donation_date
      });

      setShowAddDonationModal(false);
      showToast('Philanthropic donation logged successfully!');
      if (res?.data) {
        setSelectedReceiptForSlip(res.data);
      }
      setDonationForm({
        donor_id: donors[0]?.id || '',
        category_id: categories[0]?.id || '',
        amount: '',
        purpose: '',
        payment_method: 'BANK_TRANSFER',
        bank_account: 'Development / Projects Account (Equity)',
        transaction_reference: '',
        donation_date: new Date().toISOString().split('T')[0]
      });
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error recording donation');
    }
  };

  // 8. Create Donor
  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorForm.name.trim()) {
      alert('Donor Name is required.');
      return;
    }

    try {
      await ApiService.createDonor({
        name: donorForm.name.trim(),
        donor_type: donorForm.donor_type,
        contact_person: donorForm.contact_person.trim() || undefined,
        phone: donorForm.phone.trim() || undefined,
        email: donorForm.email.trim() || undefined,
        address: donorForm.address.trim() || undefined
      });

      setShowAddDonorModal(false);
      showToast('Donor profile added to directory!');
      setDonorForm({
        name: '',
        donor_type: 'INDIVIDUAL',
        contact_person: '',
        phone: '',
        email: '',
        address: ''
      });
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error creating donor');
    }
  };

  // 9. Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      alert('Category Name is required.');
      return;
    }

    try {
      await ApiService.createOtherIncomeCategory({
        name: categoryForm.name.trim(),
        account_code: categoryForm.account_code.trim() || undefined,
        description: categoryForm.description.trim() || undefined
      });

      setShowAddCategoryModal(false);
      showToast('Revenue vote head category added!');
      setCategoryForm({ name: '', account_code: '', description: '' });
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error creating category');
    }
  };

  // Filtered lists
  const filteredReceipts = receipts.filter((r) => {
    const matchSearch =
      search === '' ||
      r.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.payer_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.category_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || r.category_id === categoryFilter;
    return matchSearch && matchCat;
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      search === '' ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold transition-all ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Receipts Collected</span>
            <span className="text-lg font-extrabold text-emerald-600 font-mono mt-0.5 block">{formatKES(totalReceiptsAmount)}</span>
            <span className="text-[10px] text-slate-400 font-medium">{receipts.length} other income receipts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Customer Receivables</span>
            <span className="text-lg font-extrabold text-amber-600 font-mono mt-0.5 block">{formatKES(totalCustomerReceivables)}</span>
            <span className="text-[10px] text-slate-400 font-medium">{customers.length} registered external clients</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Donations & Grants</span>
            <span className="text-lg font-extrabold text-sky-600 font-mono mt-0.5 block">{formatKES(totalDonationsAmount)}</span>
            <span className="text-[10px] text-slate-400 font-medium">{donations.length} philanthropic gifts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Revenue Streams</span>
            <span className="text-lg font-extrabold text-indigo-600 font-mono mt-0.5 block">{categories.length} Vote Heads</span>
            <span className="text-[10px] text-slate-400 font-medium">Farm, Canteen, Hire, Fees</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white rounded-t-xl border-b border-slate-200 px-4 flex items-center gap-6 overflow-x-auto text-xs font-semibold text-slate-600">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`py-3.5 border-b-2 font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'customer-invoices' && invoices.filter((i) => i.status === 'PENDING').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                  {invoices.filter((i) => i.status === 'PENDING').length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. SUB-TAB: RECEIPTS REGISTER */}
      {activeSubTab === 'receipts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Other Income Receipts Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">Direct collections from canteen rent, bus hire, farm produce, uniforms & tender fees</p>
            </div>

            <button
              onClick={() => setShowAddReceiptModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Other Income Receipt</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search receipt no, payer, particulars..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Revenue Streams</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
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
                onClick={() =>
                  exportToCsv(
                    'Other_Income_Receipts',
                    ['Receipt No', 'Date', 'Payer', 'Category', 'Payment Method', 'Amount', 'Bank Account', 'Received By'],
                    filteredReceipts.map((r) => [
                      r.receipt_number,
                      r.receipt_date,
                      r.payer_name,
                      r.category_name,
                      r.payment_method,
                      r.amount,
                      r.bank_account,
                      r.received_by_name || 'Bursar'
                    ])
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={loadAllData}
                className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors"
                title="Refresh Receipts"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Receipt No.</th>
                  <th className="py-3 px-4">Payer / Customer</th>
                  <th className="py-3 px-4">Revenue Stream</th>
                  <th className="py-3 px-4">Channel / Mode</th>
                  <th className="py-3 px-4">Destination Cashbook</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No other income receipts recorded. Click "+ Add Other Income Receipt" above to post revenue.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{new Date(r.receipt_date || r.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <button
                          onClick={() => setSelectedReceiptForSlip(r)}
                          className="text-sky-700 hover:text-sky-900 hover:underline"
                          title="Click to print official receipt slip"
                        >
                          {r.receipt_number}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 uppercase">{r.payer_name}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                          {r.category_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold uppercase text-slate-600">{r.payment_method?.replace('_', ' ')}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px]">{r.bank_account}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-600 text-sm">
                        {formatKES(r.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedReceiptForSlip(r)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 border border-slate-200"
                          title="Print official receipt slip"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Slip</span>
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

      {/* 2. SUB-TAB: CUSTOMER INVOICES */}
      {activeSubTab === 'customer-invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Invoices (Receivables)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Billed rent, facility hire, transport and external service invoices</p>
            </div>

            <button
              onClick={() => setShowAddInvoiceModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Issue Customer Invoice</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice No.</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Revenue Stream</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Invoice Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No customer invoices issued yet. Click "+ Issue Customer Invoice" to bill an external client.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-800">{inv.invoice_number}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 uppercase">{inv.customer_name}</td>
                      <td className="py-3.5 px-4 text-slate-700">{inv.category_name}</td>
                      <td className="py-3.5 px-4 text-slate-600 italic text-[11px]">{inv.description}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{new Date(inv.due_date).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{formatKES(inv.amount)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-rose-600">{formatKES(inv.balance)}</td>
                      <td className="py-3.5 px-4 text-center">
                        {inv.status === 'PAID' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            PAID IN FULL
                          </span>
                        )}
                        {inv.status === 'PARTIAL' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            PARTIAL
                          </span>
                        )}
                        {inv.status === 'PENDING' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => {
                              setActiveInvoiceToPay(inv);
                              setPayInvoiceForm({
                                amount: String(inv.balance),
                                payment_method: 'BANK_TRANSFER',
                                bank_account: 'Main Operations Account (KCB)',
                                transaction_reference: '',
                                cheque_number: '',
                                description: `Payment for Invoice #${inv.invoice_number}`
                              });
                              setShowPayInvoiceModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] shadow-xs inline-flex items-center gap-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Receive Pay</span>
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

      {/* 3. SUB-TAB: CUSTOMERS DIRECTORY */}
      {activeSubTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">External Customers & Debtors</h2>
              <p className="text-xs text-slate-500 mt-0.5">Directory of facility rental clients, canteen operators, and non-student service consumers</p>
            </div>

            <button
              onClick={() => {
                setEditingCustomer(null);
                setCustomerForm({
                  name: '',
                  category: 'Canteen Tenant / Contractor',
                  phone: '',
                  email: '',
                  kra_pin: '',
                  address: '',
                  opening_balance: '0'
                });
                setShowAddCustomerModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Customer</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Code</th>
                  <th className="py-3 px-5">Customer / Organization Name</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Phone & Email</th>
                  <th className="py-3 px-5">KRA PIN</th>
                  <th className="py-3 px-5 text-right">Outstanding Debt</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No external customers registered. Click "+ Add Customer" above to create a profile.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{c.customer_code}</td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900 uppercase">{c.name}</td>
                      <td className="py-3.5 px-5 text-slate-600">{c.category}</td>
                      <td className="py-3.5 px-5 text-slate-600">
                        <div>{c.phone || '-'}</div>
                        {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-600">{c.kra_pin || '-'}</td>
                      <td className="py-3.5 px-5 text-right font-mono font-extrabold text-slate-900">
                        {formatKES(c.current_balance)}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCustomer(c);
                              setCustomerForm({
                                name: c.name,
                                category: c.category || 'General Customer',
                                phone: c.phone || '',
                                email: c.email || '',
                                kra_pin: c.kra_pin || '',
                                address: c.address || '',
                                opening_balance: String(c.opening_balance || 0)
                              });
                              setShowAddCustomerModal(true);
                            }}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded"
                            title="Edit customer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded"
                            title="Delete customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB: CUSTOMER TAKE-ONS */}
      {activeSubTab === 'customer-take-ons' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Take-Ons & Opening Balances</h2>
              <p className="text-xs text-slate-500 mt-0.5">Historical debt and uncollected revenue migrated during system setup</p>
            </div>

            <button
              onClick={() => setShowAddTakeOnModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Customer Take-On</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Date Recorded</th>
                  <th className="py-3 px-5">Customer Code</th>
                  <th className="py-3 px-5">Customer Name</th>
                  <th className="py-3 px-5">Description / Audit Notes</th>
                  <th className="py-3 px-5 text-right">Opening Balance Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {takeOns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                      No customer take-on balances active. Click "+ Add Customer Take-On" to migrate historical balances.
                    </td>
                  </tr>
                ) : (
                  takeOns.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 text-slate-600">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{t.customer_code}</td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900 uppercase">{t.customer_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 italic">{t.description}</td>
                      <td className="py-3.5 px-5 text-right font-mono font-extrabold text-slate-900">
                        {formatKES(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SUB-TAB: DONATIONS & GRANTS */}
      {activeSubTab === 'donations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Philanthropic Donations & Grants</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track endowment gifts, alumni project contributions, and NGO fundings</p>
            </div>

            <button
              onClick={() => setShowAddDonationModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Heart className="w-4 h-4" />
              <span>+ Record Donation</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Receipt No.</th>
                  <th className="py-3 px-5">Donor / Organization</th>
                  <th className="py-3 px-5">Designated Purpose</th>
                  <th className="py-3 px-5">Destination Bank Account</th>
                  <th className="py-3 px-5 text-right">Donation Amount</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No philanthropic donations logged yet. Click "+ Record Donation" to post contributions.
                    </td>
                  </tr>
                ) : (
                  donations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 text-slate-600">{new Date(d.donation_date || d.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5 font-mono font-bold text-sky-800">{d.receipt_number}</td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900 uppercase">{d.donor_name}</td>
                      <td className="py-3.5 px-5 text-slate-700 font-medium">{d.purpose}</td>
                      <td className="py-3.5 px-5 text-slate-600 text-[11px]">{d.bank_account}</td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-emerald-600 font-mono text-sm">
                        {formatKES(d.amount)}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => setSelectedReceiptForSlip(d)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs inline-flex items-center gap-1 border border-slate-200"
                          title="Print donation receipt"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Slip</span>
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

      {/* 6. SUB-TAB: DONORS DIRECTORY */}
      {activeSubTab === 'donors' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Institutional & Individual Donors Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">Foundations, alumni associations, corporate sponsors and NGO partners</p>
            </div>

            <button
              onClick={() => setShowAddDonorModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Donor</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Code</th>
                  <th className="py-3 px-5">Donor / Organization Name</th>
                  <th className="py-3 px-5">Donor Type</th>
                  <th className="py-3 px-5">Contact Person & Phone</th>
                  <th className="py-3 px-5 text-right">Total Contributed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                      No institutional donors recorded. Click "+ Add Donor" to register partners.
                    </td>
                  </tr>
                ) : (
                  donors.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{d.donor_code}</td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900 uppercase">{d.name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{d.donor_type}</td>
                      <td className="py-3.5 px-5 text-slate-600">
                        <div>{d.contact_person || '-'}</div>
                        {d.phone && <div className="text-[10px] text-slate-400">{d.phone}</div>}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-extrabold text-emerald-600">
                        {formatKES(d.total_contributed || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. SUB-TAB: REVENUE STREAMS / VOTE HEADS */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Revenue Streams & Vote Heads</h2>
              <p className="text-xs text-slate-500 mt-0.5">Chart of accounts & vote heads for non-fee school revenues</p>
            </div>

            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Revenue Category</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Account Code</th>
                  <th className="py-3 px-5">Category / Revenue Vote Head</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-sky-800">{c.account_code || 'REV-OI-000'}</td>
                    <td className="py-3.5 px-5 font-extrabold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-5 text-slate-600">{c.description || '-'}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Add Receipt Modal */}
      {showAddReceiptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Record Other Income Receipt</h3>
                <p className="text-[11px] text-slate-500">Collect revenue into the school fund cashbook</p>
              </div>
              <button onClick={() => setShowAddReceiptModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-3.5 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Revenue Category *</label>
                  <select
                    required
                    value={receiptForm.category_id}
                    onChange={(e) => setReceiptForm({ ...receiptForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Linked Customer (Optional)</label>
                  <select
                    value={receiptForm.customer_id}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const cust = customers.find((c) => c.id === cid);
                      setReceiptForm({
                        ...receiptForm,
                        customer_id: cid,
                        payer_name: cust ? cust.name : receiptForm.payer_name
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    <option value="">-- Direct / Walk-in Payer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customer_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payer / Received From *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe / Apex Canteen Contractors"
                  value={receiptForm.payer_name}
                  onChange={(e) => setReceiptForm({ ...receiptForm, payer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 25000"
                    value={receiptForm.amount}
                    onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={receiptForm.receipt_date}
                    onChange={(e) => setReceiptForm({ ...receiptForm, receipt_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={receiptForm.payment_method}
                    onChange={(e) => setReceiptForm({ ...receiptForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / EFT</option>
                    <option value="MPESA_PAYBILL">M-Pesa Paybill / Till</option>
                    <option value="DIRECT_DEPOSIT">Direct Bank Cash Deposit</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Reference / Cheque No</label>
                  <input
                    type="text"
                    placeholder="e.g. QX7890ABCD or CHQ 00124"
                    value={receiptForm.transaction_reference}
                    onChange={(e) => setReceiptForm({ ...receiptForm, transaction_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Destination Cashbook Bank Account</label>
                <select
                  value={receiptForm.bank_account}
                  onChange={(e) => setReceiptForm({ ...receiptForm, bank_account: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                >
                  <option value="Main Operations Account (KCB)">Main Operations Account (KCB)</option>
                  <option value="Development & Projects Account (Equity)">Development & Projects Account (Equity)</option>
                  <option value="School Fund Account (Co-op)">School Fund Account (Co-op)</option>
                  <option value="M-Pesa Paybill Primary Float">M-Pesa Paybill Primary Float</option>
                  <option value="Bursar Cash Office Safe">Bursar Cash Office Safe</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Particulars / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. May 2026 Canteen Lease Payment"
                  value={receiptForm.description}
                  onChange={(e) => setReceiptForm({ ...receiptForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReceiptModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Post & Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Issue Customer Invoice Modal */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Issue Customer Invoice</h3>
              <button onClick={() => setShowAddInvoiceModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Customer / Client *</label>
                <select
                  required
                  value={invoiceForm.customer_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customer_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Revenue Category *</label>
                <select
                  required
                  value={invoiceForm.category_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 50000"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Description / Particulars</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Term 2 Bus Hire for Community Excursion"
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm">
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Pay Customer Invoice Modal */}
      {showPayInvoiceModal && activeInvoiceToPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Receive Payment for Invoice</h3>
                <p className="text-[11px] text-slate-500 font-mono">Invoice #{activeInvoiceToPay.invoice_number}</p>
              </div>
              <button onClick={() => setShowPayInvoiceModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayInvoice} className="space-y-3 pt-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Customer</span>
                  <span className="font-extrabold text-slate-900 uppercase">{activeInvoiceToPay.customer_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Balance Due</span>
                  <span className="font-extrabold text-rose-600 font-mono text-sm">{formatKES(activeInvoiceToPay.balance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Amount to Pay (KES) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={activeInvoiceToPay.balance}
                  required
                  value={payInvoiceForm.amount}
                  onChange={(e) => setPayInvoiceForm({ ...payInvoiceForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={payInvoiceForm.payment_method}
                    onChange={(e) => setPayInvoiceForm({ ...payInvoiceForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / EFT</option>
                    <option value="MPESA_PAYBILL">M-Pesa Paybill</option>
                    <option value="DIRECT_DEPOSIT">Direct Cash Deposit</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Tx Reference / Cheque</label>
                  <input
                    type="text"
                    placeholder="Ref code"
                    value={payInvoiceForm.transaction_reference}
                    onChange={(e) => setPayInvoiceForm({ ...payInvoiceForm, transaction_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Destination Cashbook</label>
                <select
                  value={payInvoiceForm.bank_account}
                  onChange={(e) => setPayInvoiceForm({ ...payInvoiceForm, bank_account: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
                >
                  <option value="Main Operations Account (KCB)">Main Operations Account (KCB)</option>
                  <option value="Development & Projects Account (Equity)">Development & Projects Account (Equity)</option>
                  <option value="School Fund Account (Co-op)">School Fund Account (Co-op)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm">
                  Confirm & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add / Edit Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">{editingCustomer ? 'Edit Customer Profile' : 'Add External Customer'}</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Uniform Supplies & Accessories"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Category</label>
                  <select
                    value={customerForm.category}
                    onChange={(e) => setCustomerForm({ ...customerForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                  >
                    <option value="Canteen Tenant / Contractor">Canteen Tenant / Contractor</option>
                    <option value="Bus Hire Client">Bus Hire Client</option>
                    <option value="Hall / Grounds Tenant">Hall / Grounds Tenant</option>
                    <option value="Farm Produce Buyer">Farm Produce Buyer</option>
                    <option value="Uniform / Stationery Vendor">Uniform / Stationery Vendor</option>
                    <option value="General Customer">General Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="0712345678"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="info@client.com"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">KRA PIN</label>
                  <input
                    type="text"
                    placeholder="P051234567Z"
                    value={customerForm.kra_pin}
                    onChange={(e) => setCustomerForm({ ...customerForm, kra_pin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Opening Debt Balance (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={customerForm.opening_balance}
                    onChange={(e) => setCustomerForm({ ...customerForm, opening_balance: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm">
                  {editingCustomer ? 'Update Profile' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Customer Take-On Modal */}
      {showAddTakeOnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Record Customer Opening Take-On</h3>
              <button onClick={() => setShowAddTakeOnModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTakeOn} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Customer / Debtor *</label>
                <select
                  required
                  value={takeOnForm.customer_id}
                  onChange={(e) => setTakeOnForm({ ...takeOnForm, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customer_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Opening Debt Amount (KES) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 15000"
                  value={takeOnForm.amount}
                  onChange={(e) => setTakeOnForm({ ...takeOnForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Audit Description</label>
                <textarea
                  rows={2}
                  value={takeOnForm.description}
                  onChange={(e) => setTakeOnForm({ ...takeOnForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTakeOnModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm">
                  Commit Take-On
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Record Donation Modal */}
      {showAddDonationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Record Philanthropic Donation</h3>
              <button onClick={() => setShowAddDonationModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDonation} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Donor / Benefactor *</label>
                <select
                  required
                  value={donationForm.donor_id}
                  onChange={(e) => setDonationForm({ ...donationForm, donor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.donor_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 100000"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Donation Date</label>
                  <input
                    type="date"
                    required
                    value={donationForm.donation_date}
                    onChange={(e) => setDonationForm({ ...donationForm, donation_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Designated Purpose / Project *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. School Computer Lab Extension Project"
                  value={donationForm.purpose}
                  onChange={(e) => setDonationForm({ ...donationForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={donationForm.payment_method}
                    onChange={(e) => setDonationForm({ ...donationForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                  >
                    <option value="BANK_TRANSFER">Bank Wire / EFT</option>
                    <option value="CHEQUE">Banker's Cheque</option>
                    <option value="MPESA_PAYBILL">M-Pesa</option>
                    <option value="DIRECT_DEPOSIT">Direct Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Reference Code</label>
                  <input
                    type="text"
                    placeholder="Ref code"
                    value={donationForm.transaction_reference}
                    onChange={(e) => setDonationForm({ ...donationForm, transaction_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Destination Bank Account</label>
                <select
                  value={donationForm.bank_account}
                  onChange={(e) => setDonationForm({ ...donationForm, bank_account: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  <option value="Development / Projects Account (Equity)">Development / Projects Account (Equity)</option>
                  <option value="Main Operations Account (KCB)">Main Operations Account (KCB)</option>
                  <option value="School Endowment Fund">School Endowment Fund</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDonationModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm">
                  Record & Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Add Donor Modal */}
      {showAddDonorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Add Donor / Benefactor</h3>
              <button onClick={() => setShowAddDonorModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDonor} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Donor / Partner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenya Diaspora Alumni Trust"
                  value={donorForm.name}
                  onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Donor Type</label>
                  <select
                    value={donorForm.donor_type}
                    onChange={(e) => setDonorForm({ ...donorForm, donor_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                  >
                    <option value="INDIVIDUAL">Individual Philanthropist</option>
                    <option value="ORGANIZATION">Organization / NGO</option>
                    <option value="ALUMNI">Alumni Association</option>
                    <option value="CORPORATE">Corporate Foundation</option>
                    <option value="NGO_GOVERNMENT">Government / CDF Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Eng. Peter Mwangi"
                    value={donorForm.contact_person}
                    onChange={(e) => setDonorForm({ ...donorForm, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="0712345678"
                    value={donorForm.phone}
                    onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="donations@alumni.org"
                    value={donorForm.email}
                    onChange={(e) => setDonorForm({ ...donorForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDonorModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm">
                  Save Donor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Add Revenue Vote Head</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Category / Vote Head Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Examination Fees"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Account Code</label>
                <input
                  type="text"
                  placeholder="e.g. REV-OI-011"
                  value={categoryForm.account_code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, account_code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Particulars and purpose of this revenue line"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm">
                  Add Revenue Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Modal */}
      {selectedReceiptForSlip && (
        <OtherIncomeReceiptModal
          receipt={selectedReceiptForSlip}
          onClose={() => setSelectedReceiptForSlip(null)}
        />
      )}
    </div>
  );
};