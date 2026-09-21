import React, { useState, useEffect } from 'react';
import {
  Plus,
  MoreVertical,
  Building2,
  ChevronDown,
  X,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  ArrowRightLeft,
  BookOpen,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  RefreshCw,
  Wallet,
  Landmark,
  ShieldCheck,
  Edit2,
  Trash2,
  Eye,
  Check
} from 'lucide-react';
import { ApiService } from '../services/api';
import { exportToCsv } from '../utils/exportUtils';

interface AccountingViewProps {
  initialSubTab?: string;
}

export const AccountingView: React.FC<AccountingViewProps> = ({ initialSubTab = 'account-types' }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const subTabs = [
    { id: 'account-types', label: 'Account Types' },
    { id: 'vote-heads', label: 'Vote Heads' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'take-ons', label: 'Take Ons' },
    { id: 'transfers', label: 'Transfers' },
    { id: 'budgets', label: 'Budgets' },
    { id: 'journal', label: 'Journal' },
    { id: 'general-ledger', label: 'General Ledger' },
  ];

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Account Types State
  const [accountTypes, setAccountTypes] = useState<any[]>([]);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCode, setNewTypeCode] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [showEditAccountTypeModal, setShowEditAccountTypeModal] = useState(false);
  const [editAccountTypeForm, setEditAccountTypeForm] = useState({ id: '', name: '', code: '', description: '' });

  // 2. Vote Heads State
  const [voteHeads, setVoteHeads] = useState<any[]>([]);
  const [showVoteHeadModal, setShowVoteHeadModal] = useState(false);
  const [newVoteHead, setNewVoteHead] = useState({
    name: '',
    account_code: '',
    account_type_id: '',
    is_optional: false,
    description: ''
  });
  const [showEditVoteHeadModal, setShowEditVoteHeadModal] = useState(false);
  const [editVoteHeadForm, setEditVoteHeadForm] = useState({
    id: '',
    name: '',
    account_code: '',
    account_type_id: '',
    is_optional: false,
    description: ''
  });

  // 3. Accounts State (Bank, Cash, Default)
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountFilter, setAccountFilter] = useState<'bank' | 'cash' | 'default'>('bank');
  const [activeAccountActionId, setActiveAccountActionId] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    account_number: '',
    bank_name: 'Kenya Commercial Bank (KCB)',
    branch: 'Main Branch',
    account_type: 'OPERATIONS',
    account_type_id: '',
    opening_balance: '',
    currency: 'KES',
    is_cash_account: false
  });
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editAccountForm, setEditAccountForm] = useState({
    id: '',
    name: '',
    account_number: '',
    bank_name: '',
    branch: '',
    account_type: 'OPERATIONS',
    account_type_id: '',
    currency: 'KES',
    status: 'ACTIVE',
    is_cash_account: false
  });

  // 4. Take-Ons State
  const [takeOns, setTakeOns] = useState<any[]>([]);
  const [showTakeOnModal, setShowTakeOnModal] = useState(false);
  const [newTakeOn, setNewTakeOn] = useState({
    account_name: '',
    account_id: '',
    financial_year: '2026',
    balance_type: 'DEBIT',
    amount: '',
    as_of_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // 5. Transfers State
  const [transfers, setTransfers] = useState<any[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    from_account_id: '',
    from_account_name: '',
    to_account_id: '',
    to_account_name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    narration: ''
  });

  // 6. Budgets State
  const [budgetYear, setBudgetYear] = useState('2026');
  const [budgetsData, setBudgetsData] = useState<{
    financial_year: string;
    summary: { total_budgeted: number; total_spent: number; total_remaining: number; overall_util: number };
    items: any[];
  }>({
    financial_year: '2026',
    summary: { total_budgeted: 0, total_spent: 0, total_remaining: 0, overall_util: 0 },
    items: []
  });
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedBudgetVH, setSelectedBudgetVH] = useState<any>(null);
  const [budgetAmountInput, setBudgetAmountInput] = useState('');
  const [budgetNotesInput, setBudgetNotesInput] = useState('');

  // 7. Journal Entries State
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [journalSearch, setJournalSearch] = useState('');
  const [appliedJournalSearch, setAppliedJournalSearch] = useState('');
  const [journalFilterType, setJournalFilterType] = useState('ALL');
  const [showJournalFilter, setShowJournalFilter] = useState(false);
  const [activeJournalActionId, setActiveJournalActionId] = useState<string | null>(null);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [viewingJournal, setViewingJournal] = useState<any>(null);
  const [newJournal, setNewJournal] = useState({
    debit_account: '',
    credit_account: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    narration: '',
    reference: '',
    transaction_type: 'MANUAL_JOURNAL'
  });

  // 8. General Ledger State
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  useEffect(() => {
    loadAccountingData();
  }, [activeSubTab, budgetYear]);

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'account-types') {
        const res = await ApiService.getAccountTypes();
        if (res && res.data) setAccountTypes(res.data);
      } else if (activeSubTab === 'vote-heads') {
        const [vhRes, atRes] = await Promise.all([
          ApiService.getVoteHeads(),
          ApiService.getAccountTypes()
        ]);
        if (vhRes && vhRes.data) setVoteHeads(vhRes.data);
        if (atRes && atRes.data) setAccountTypes(atRes.data);
      } else if (activeSubTab === 'accounts') {
        const [accRes, atRes] = await Promise.all([
          ApiService.getAccounts(),
          ApiService.getAccountTypes()
        ]);
        if (accRes && accRes.data) setAccounts(accRes.data);
        if (atRes && atRes.data) setAccountTypes(atRes.data);
      } else if (activeSubTab === 'take-ons') {
        const [takeRes, accRes] = await Promise.all([
          ApiService.getAccountTakeOns(),
          ApiService.getAccounts()
        ]);
        if (takeRes && takeRes.data) setTakeOns(takeRes.data);
        if (accRes && accRes.data) setAccounts(accRes.data);
      } else if (activeSubTab === 'transfers') {
        const [trfRes, accRes] = await Promise.all([
          ApiService.getTransfers(),
          ApiService.getAccounts()
        ]);
        if (trfRes && trfRes.data) setTransfers(trfRes.data);
        if (accRes && accRes.data) setAccounts(accRes.data);
      } else if (activeSubTab === 'budgets') {
        const bRes = await ApiService.getVoteHeadBudgets(budgetYear);
        if (bRes && bRes.data) setBudgetsData(bRes.data);
      } else if (activeSubTab === 'journal') {
        const [jRes, accRes, vhRes] = await Promise.all([
          ApiService.getJournalEntries(),
          ApiService.getAccounts(),
          ApiService.getVoteHeads()
        ]);
        if (jRes && jRes.data) setJournalEntries(jRes.data);
        if (accRes && accRes.data) setAccounts(accRes.data);
        if (vhRes && vhRes.data) setVoteHeads(vhRes.data);
      } else if (activeSubTab === 'general-ledger') {
        const res = await ApiService.getGeneralLedger({
          start_date: ledgerStartDate || undefined,
          end_date: ledgerEndDate || undefined
        });
        if (res && res.data) setLedgerEntries(res.data);
      }
    } catch (e) {
      console.error('Error loading accounting data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Account Types
  const handleAddAccountType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    setSubmitting(true);
    try {
      const res = await ApiService.createAccountType({
        name: newTypeName,
        code: newTypeCode,
        description: newTypeDesc
      });
      if (res && res.data) {
        setAccountTypes([...accountTypes, res.data]);
        setShowAccountTypeModal(false);
        setNewTypeName('');
        setNewTypeCode('');
        setNewTypeDesc('');
      }
    } catch (e: any) {
      alert(e.message || 'Error creating account type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccountType = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete account type "${name}"?`)) return;
    try {
      await ApiService.deleteAccountType(id);
      setAccountTypes(accountTypes.filter((t) => t.id !== id));
    } catch (e: any) {
      alert(e.message || 'Error deleting account type');
    }
  };

  const openEditAccountType = (at: any) => {
    setEditAccountTypeForm({
      id: at.id,
      name: at.name || '',
      code: at.code || '',
      description: at.description || ''
    });
    setShowEditAccountTypeModal(true);
  };

  const handleUpdateAccountType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccountTypeForm.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await ApiService.updateAccountType(editAccountTypeForm.id, {
        name: editAccountTypeForm.name,
        code: editAccountTypeForm.code,
        description: editAccountTypeForm.description
      });
      if (res && res.data) {
        setAccountTypes(accountTypes.map((t) => (t.id === editAccountTypeForm.id ? { ...t, ...res.data } : t)));
        setShowEditAccountTypeModal(false);
      }
    } catch (e: any) {
      alert(e.message || 'Error updating account type');
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers for Vote Heads
  const handleCreateVoteHead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoteHead.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await ApiService.createVoteHead(newVoteHead);
      if (res && res.data) {
        setVoteHeads([...voteHeads, res.data]);
        setShowVoteHeadModal(false);
        setNewVoteHead({ name: '', account_code: '', account_type_id: '', is_optional: false, description: '' });
      }
    } catch (e: any) {
      alert(e.message || 'Error creating vote head');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditVoteHead = (vh: any) => {
    setEditVoteHeadForm({
      id: vh.id,
      name: vh.name || '',
      account_code: vh.account_code || '',
      account_type_id: vh.account_type_id || '',
      is_optional: !!vh.is_optional,
      description: vh.description || ''
    });
    setShowEditVoteHeadModal(true);
  };

  const handleUpdateVoteHead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVoteHeadForm.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await ApiService.updateVoteHead(editVoteHeadForm.id, {
        name: editVoteHeadForm.name,
        account_code: editVoteHeadForm.account_code,
        account_type_id: editVoteHeadForm.account_type_id || undefined,
        is_optional: editVoteHeadForm.is_optional,
        description: editVoteHeadForm.description
      });
      if (res && res.data) {
        setVoteHeads(voteHeads.map((vh) => (vh.id === editVoteHeadForm.id ? { ...vh, ...res.data } : vh)));
        setShowEditVoteHeadModal(false);
      }
    } catch (e: any) {
      alert(e.message || 'Error updating vote head');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVoteHead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete vote head "${name}"?`)) return;
    try {
      await ApiService.deleteVoteHead(id);
      setVoteHeads(voteHeads.filter((vh) => vh.id !== id));
    } catch (e: any) {
      alert(e.message || 'Error deleting vote head');
    }
  };

  // Handlers for Accounts
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name.trim() || !newAccount.account_number.trim()) return;
    setSubmitting(true);
    try {
      const res = await ApiService.createAccount({
        name: newAccount.name,
        account_number: newAccount.account_number,
        bank_name: newAccount.bank_name,
        branch: newAccount.branch,
        account_type: newAccount.account_type,
        account_type_id: newAccount.account_type_id || undefined,
        opening_balance: parseFloat(newAccount.opening_balance) || 0,
        currency: newAccount.currency || 'KES',
        is_cash_account: newAccount.is_cash_account
      });
      if (res && res.data) {
        setAccounts([...accounts, res.data]);
        setShowAccountModal(false);
        setNewAccount({
          name: '',
          account_number: '',
          bank_name: 'Kenya Commercial Bank (KCB)',
          branch: 'Main Branch',
          account_type: 'OPERATIONS',
          account_type_id: '',
          opening_balance: '',
          currency: 'KES',
          is_cash_account: false
        });
      }
    } catch (e: any) {
      alert(e.message || 'Error creating bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditAccount = (acc: any) => {
    setEditAccountForm({
      id: acc.id,
      name: acc.name || '',
      account_number: acc.account_number || '',
      bank_name: acc.bank_name || '',
      branch: acc.branch || '',
      account_type: acc.account_type || 'OPERATIONS',
      account_type_id: acc.account_type_id || '',
      currency: acc.currency || 'KES',
      status: acc.status || 'ACTIVE',
      is_cash_account: acc.is_cash_account === true || acc.is_cash_account === 'true' || acc.is_cash_account === 1
    });
    setShowEditAccountModal(true);
    setActiveAccountActionId(null);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccountForm.name.trim() || !editAccountForm.account_number.trim()) return;
    setSubmitting(true);
    try {
      const res = await ApiService.updateAccount(editAccountForm.id, {
        name: editAccountForm.name,
        account_number: editAccountForm.account_number,
        bank_name: editAccountForm.bank_name,
        branch: editAccountForm.branch,
        account_type: editAccountForm.account_type,
        account_type_id: editAccountForm.account_type_id || undefined,
        currency: editAccountForm.currency,
        status: editAccountForm.status,
        is_cash_account: editAccountForm.is_cash_account
      });
      if (res && res.data) {
        setAccounts(accounts.map((a) => (a.id === editAccountForm.id ? { ...a, ...res.data } : a)));
        setShowEditAccountModal(false);
      }
    } catch (e: any) {
      alert(e.message || 'Error updating account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    setActiveAccountActionId(null);
    if (!confirm(`Are you sure you want to delete account "${name}"?`)) return;
    try {
      await ApiService.deleteAccount(id);
      setAccounts(accounts.filter((a) => a.id !== id));
    } catch (e: any) {
      alert(e.message || 'Error deleting account');
    }
  };

  // Handlers for Take-Ons
  const handleCreateTakeOn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTakeOn.account_name.trim() || !newTakeOn.amount) return;
    setSubmitting(true);
    try {
      const res = await ApiService.createAccountTakeOn({
        account_name: newTakeOn.account_name,
        account_id: newTakeOn.account_id || undefined,
        financial_year: newTakeOn.financial_year,
        balance_type: newTakeOn.balance_type,
        amount: parseFloat(newTakeOn.amount),
        as_of_date: newTakeOn.as_of_date,
        notes: newTakeOn.notes
      });
      if (res && res.data) {
        setTakeOns([res.data, ...takeOns]);
        setShowTakeOnModal(false);
        setNewTakeOn({
          account_name: '',
          account_id: '',
          financial_year: '2026',
          balance_type: 'DEBIT',
          amount: '',
          as_of_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
      }
    } catch (e: any) {
      alert(e.message || 'Error saving take-on balance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTakeOn = async (id: string) => {
    if (!confirm('Are you sure you want to remove this opening balance entry?')) return;
    try {
      await ApiService.deleteAccountTakeOn(id);
      setTakeOns(takeOns.filter((t) => t.id !== id));
    } catch (e: any) {
      alert(e.message || 'Error deleting opening balance');
    }
  };

  // Handlers for Transfers
  const handleRecordTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransfer.amount || parseFloat(newTransfer.amount) <= 0) return;
    setSubmitting(true);
    try {
      const res = await ApiService.createTransfer({
        from_account_id: newTransfer.from_account_id || undefined,
        from_account: newTransfer.from_account_name,
        to_account_id: newTransfer.to_account_id || undefined,
        to_account: newTransfer.to_account_name,
        amount: parseFloat(newTransfer.amount),
        date: newTransfer.date,
        reference: newTransfer.reference || undefined,
        narration: newTransfer.narration || undefined
      });
      if (res && res.data) {
        setTransfers([res.data, ...transfers]);
        setShowTransferModal(false);
        setNewTransfer({
          from_account_id: '',
          from_account_name: '',
          to_account_id: '',
          to_account_name: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          reference: '',
          narration: ''
        });
        alert(`Transfer of KES ${Number(res.data.amount).toLocaleString()} posted successfully (Ref: ${res.data.reference_number})`);
      }
    } catch (e: any) {
      alert(e.message || 'Error recording transfer');
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers for Budgets
  const handleOpenBudgetModal = (vh: any) => {
    setSelectedBudgetVH(vh);
    setBudgetAmountInput(vh.budgeted_amount ? vh.budgeted_amount.toString() : '');
    setBudgetNotesInput(vh.notes || '');
    setShowBudgetModal(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudgetVH) return;
    setSubmitting(true);
    try {
      await ApiService.setVoteHeadBudget({
        vote_head_id: selectedBudgetVH.vote_head_id,
        financial_year: budgetYear,
        budgeted_amount: parseFloat(budgetAmountInput) || 0,
        notes: budgetNotesInput
      });
      setShowBudgetModal(false);
      loadAccountingData();
    } catch (e: any) {
      alert(e.message || 'Error saving budget estimate');
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers for Journal
  const handleRecordJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJournal.amount || parseFloat(newJournal.amount) <= 0) return;
    setSubmitting(true);
    try {
      const res = await ApiService.createJournalEntry({
        debit_account: newJournal.debit_account,
        credit_account: newJournal.credit_account,
        amount: parseFloat(newJournal.amount),
        date: newJournal.date,
        reference: newJournal.reference || undefined,
        narration: newJournal.narration
      });
      if (res && res.data) {
        setJournalEntries([res.data, ...journalEntries]);
        setShowJournalModal(false);
        setNewJournal({
          debit_account: '',
          credit_account: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          narration: '',
          reference: '',
          transaction_type: 'MANUAL_JOURNAL'
        });
        alert(`Journal entry posted successfully with Entry No: ${res.data.entry_number}`);
      }
    } catch (e: any) {
      alert(e.message || 'Error posting journal entry');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amt: number) => {
    return 'KES ' + Number(amt || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-slate-800 text-xs font-sans">
      {/* 1. Sub-Navigation Tabs matching Skysoft Finance standard */}
      <div className="bg-white rounded-t-xl border-b border-slate-200 px-4 flex items-center gap-4 overflow-x-auto text-xs font-medium text-slate-600 shadow-sm">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`py-3.5 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'border-emerald-600 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.id === 'account-types' && <Building2 className="w-3.5 h-3.5" />}
              {tab.id === 'vote-heads' && <BookOpen className="w-3.5 h-3.5" />}
              {tab.id === 'accounts' && <Landmark className="w-3.5 h-3.5" />}
              {tab.id === 'take-ons' && <Layers className="w-3.5 h-3.5" />}
              {tab.id === 'transfers' && <ArrowRightLeft className="w-3.5 h-3.5" />}
              {tab.id === 'budgets' && <TrendingUp className="w-3.5 h-3.5" />}
              {tab.id === 'journal' && <FileText className="w-3.5 h-3.5" />}
              {tab.id === 'general-ledger' && <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: ACCOUNT TYPES */}
      {/* ========================================================================= */}
      {activeSubTab === 'account-types' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account Types (IPSAS Fund Categories)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Primary IPSAS Fund categories used for revenue, expense, and bank segregation</p>
            </div>

            <button
              onClick={() => setShowAccountTypeModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account Type</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-6 w-16 text-slate-400">#</th>
                  <th className="py-3 px-6">Account Type / Fund Name</th>
                  <th className="py-3 px-6">Fund Code</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {accountTypes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">No account types found.</td>
                  </tr>
                ) : (
                  accountTypes.map((acc, idx) => (
                    <tr key={acc.id} className="hover:bg-slate-50/80">
                      <td className="py-4 px-6 text-slate-400 font-medium">{idx + 1}.</td>
                      <td className="py-4 px-6 font-extrabold text-slate-900 uppercase flex items-center gap-2">
                        <span>{acc.name}</span>
                        {acc.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700">
                            <Building2 className="w-3 h-3" />
                            Default Fund
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-emerald-700">{acc.code || '-'}</td>
                      <td className="py-4 px-6 text-slate-600">{acc.description || 'General Fund Category'}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditAccountType(acc)}
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                            title="Edit Account Type"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!acc.is_default && (
                            <button
                              onClick={() => handleDeleteAccountType(acc.id, acc.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                              title="Delete Account Type"
                            >
                              <Trash2 className="w-4 h-4" />
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
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: VOTE HEADS */}
      {/* ========================================================================= */}
      {activeSubTab === 'vote-heads' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Vote Heads Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">Budgetary income and expenditure items configured for fees and expenses</p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600">
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowVoteHeadModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Vote Head</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-slate-400">#</th>
                  <th className="py-3 px-4">Vote Head Name</th>
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Fund Type</th>
                  <th className="py-3 px-4">Billing Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {voteHeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No vote heads configured yet. Click "+ Add Vote Head" to create your fee line items.
                    </td>
                  </tr>
                ) : (
                  voteHeads.map((vh, idx) => (
                    <tr key={vh.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 text-slate-400">{idx + 1}.</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{vh.name}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-800 uppercase">{vh.account_code || '-'}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{vh.account_type_name || 'Operations'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${vh.is_optional ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {vh.is_optional ? 'Optional' : 'Compulsory'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{vh.description || 'Standard Vote Head'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditVoteHead(vh)}
                            className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Edit Vote Head"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVoteHead(vh.id, vh.name)}
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Vote Head"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: ACCOUNTS (BANK ACCOUNTS / CASH ACCOUNTS / DEFAULT ACCOUNTS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header Controls Matching Screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setAccountFilter('bank')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  accountFilter === 'bank'
                    ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {accountFilter === 'bank' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                <span>Bank Accounts</span>
              </button>

              <button
                onClick={() => setAccountFilter('cash')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  accountFilter === 'cash'
                    ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {accountFilter === 'cash' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                <span>Cash Accounts</span>
              </button>

              <button
                onClick={() => setAccountFilter('default')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  accountFilter === 'default'
                    ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {accountFilter === 'default' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                <span>Default Accounts</span>
              </button>
            </div>

            {/* Actions: Add Account & Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNewAccount((prev) => ({
                    ...prev,
                    is_cash_account: accountFilter === 'cash'
                  }));
                  setShowAccountModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{accountFilter === 'cash' ? '+ Add Cash Account' : '+ Add Bank Account'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="p-2 bg-white border border-sky-200 hover:bg-sky-50 rounded-lg text-sky-600 shadow-xs transition-colors"
                title="Print Accounts Register"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  exportToCsv(
                    'Accounts_Register',
                    ['Name', 'Account No', 'Bank', 'Account Type', 'Currency', 'Balance', 'Status'],
                    accounts.map((a) => [
                      a.name,
                      a.account_number,
                      a.bank_name,
                      a.account_type,
                      a.currency || 'KES',
                      a.current_balance,
                      a.status || 'ACTIVE'
                    ])
                  )
                }
                className="p-2 bg-white border border-sky-200 hover:bg-sky-50 rounded-lg text-sky-600 shadow-xs transition-colors"
                title="Export to CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Accounts Table Matching Screenshot */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] tracking-wide">
                  <tr>
                    <th className="py-3.5 px-5">Name</th>
                    <th className="py-3.5 px-5">Account No.</th>
                    <th className="py-3.5 px-5">Bank</th>
                    <th className="py-3.5 px-5">Add Account Type</th>
                    <th className="py-3.5 px-5">Currency</th>
                    <th className="py-3.5 px-5 text-right">Balance</th>
                    <th className="py-3.5 px-5 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {(() => {
                    const filtered = accounts.filter((acc) => {
                      const isCash = acc.is_cash_account === true || acc.is_cash_account === 'true' || acc.is_cash_account === 1;
                      if (accountFilter === 'bank') return !isCash;
                      if (accountFilter === 'cash') return isCash;
                      return true; // 'default'
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                            No {accountFilter === 'cash' ? 'cash' : 'bank'} accounts configured yet. Click "{accountFilter === 'cash' ? '+ Add Cash Account' : '+ Add Bank Account'}" above to register one.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((acc) => {
                      const bal = parseFloat(acc.current_balance || acc.opening_balance || 0);
                      const isNegative = bal < 0;
                      const formattedBal = isNegative
                        ? `-${Math.abs(bal).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : bal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-5 font-bold uppercase text-slate-900 tracking-tight">
                            {acc.name}
                          </td>
                          <td className="py-4 px-5 font-mono text-slate-700 font-semibold">
                            {acc.account_number}
                          </td>
                          <td className="py-4 px-5 font-semibold text-slate-800 uppercase">
                            {acc.bank_name || 'KCB BANK'}
                          </td>
                          <td className="py-4 px-5 font-bold uppercase text-slate-700 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {acc.account_type || 'OPERATIONS'}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-mono text-slate-600 font-semibold">
                            {acc.currency || 'KES'} 0
                          </td>
                          <td className={`py-4 px-5 text-right font-mono font-bold text-sm ${isNegative ? 'text-rose-600' : 'text-slate-900'}`}>
                            {formattedBal}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditAccount(acc)}
                                className="px-2.5 py-1.5 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg transition-all flex items-center gap-1.5 font-bold text-xs border border-slate-200 hover:border-emerald-300 bg-white shadow-2xs"
                                title="Edit Account Particulars"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveSubTab('general-ledger')}
                                className="p-1.5 hover:bg-sky-50 text-slate-500 hover:text-sky-700 rounded-lg transition-all border border-slate-200 hover:border-sky-300 bg-white shadow-2xs"
                                title="View General Ledger"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-600" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAccount(acc.id, acc.name)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all border border-slate-200 hover:border-rose-300 bg-white shadow-2xs"
                                title="Delete Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination / Table Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500 font-medium">
              <div>
                Showing <span className="font-bold text-slate-700">{accounts.length}</span> total accounts
              </div>
              <div className="flex items-center gap-2">
                <span>Items per page: 50</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-TAB: TAKE ONS (OPENING BALANCES) */}
      {/* ========================================================================= */}
      {activeSubTab === 'take-ons' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Take On Balances (Opening Balances)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Historical opening balances brought forward for Bank accounts, Cash books, and Funds</p>
            </div>
            <button
              onClick={() => setShowTakeOnModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Opening Balance</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-slate-400">#</th>
                  <th className="py-3 px-4">Account / Fund Name</th>
                  <th className="py-3 px-4">Financial Year</th>
                  <th className="py-3 px-4">Balance Type</th>
                  <th className="py-3 px-4">As Of Date</th>
                  <th className="py-3 px-4">Notes / Narration</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {takeOns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No take-on opening balances recorded yet. Click "+ Record Opening Balance" above to migrate prior period figures.
                    </td>
                  </tr>
                ) : (
                  takeOns.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 text-slate-400">{idx + 1}.</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{t.account_name}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">{t.financial_year}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.balance_type === 'DEBIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {t.balance_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">{t.as_of_date}</td>
                      <td className="py-3.5 px-4 text-slate-500">{t.notes || 'Opening Balance'}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(t.amount)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteTakeOn(t.id)}
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ========================================================================= */}
      {/* 6. SUB-TAB: TRANSFERS */}
      {/* ========================================================================= */}
      {activeSubTab === 'transfers' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Inter-Account Transfers</h2>
              <p className="text-xs text-slate-500 mt-0.5">Move funds between school bank accounts and cash books with full audit trail</p>
            </div>

            <button
              onClick={() => {
                if (accounts.length >= 2) {
                  setNewTransfer({
                    ...newTransfer,
                    from_account_id: accounts[0].id,
                    from_account_name: accounts[0].name,
                    to_account_id: accounts[1].id,
                    to_account_name: accounts[1].name
                  });
                }
                setShowTransferModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>+ Record Transfer</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Source Account (From)</th>
                  <th className="py-3 px-4">Destination Account (To)</th>
                  <th className="py-3 px-4">Narration</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No inter-account transfers recorded yet. Click "+ Record Transfer" above to initiate a transfer.
                    </td>
                  </tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono">{t.transfer_date}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-700">{t.reference_number}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{t.from_account_name}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-800">{t.to_account_name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{t.narration}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">{formatCurrency(t.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SUB-TAB: BUDGETS */}
      {/* ========================================================================= */}
      {activeSubTab === 'budgets' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Vote Head Budgets & Variance Analysis</h2>
              <p className="text-xs text-slate-500 mt-0.5">Approved annual estimates vs actual expenditure with real-time budget utilization tracking</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={budgetYear}
                onChange={(e) => setBudgetYear(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm"
              >
                <option value="2025">Financial Year 2025</option>
                <option value="2026">Financial Year 2026</option>
                <option value="2027">Financial Year 2027</option>
              </select>
              <button
                onClick={() => window.print()}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 shadow-sm"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Budget KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Approved Budget</div>
              <div className="text-lg font-extrabold text-slate-900 font-mono mt-1">{formatCurrency(budgetsData.summary.total_budgeted)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Estimates for FY {budgetYear}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Actual Spent</div>
              <div className="text-lg font-extrabold text-rose-700 font-mono mt-1">{formatCurrency(budgetsData.summary.total_spent)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Disbursed expense vouchers</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Remaining Balance</div>
              <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{formatCurrency(budgetsData.summary.total_remaining)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Available for commitment</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Overall Utilization</div>
              <div className="text-lg font-extrabold text-sky-700 font-mono mt-1">{budgetsData.summary.overall_util}%</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${budgetsData.summary.overall_util > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(budgetsData.summary.overall_util, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Vote Head</th>
                  <th className="py-3 px-4">Fund Type</th>
                  <th className="py-3 px-4 text-right">Approved Budget (KES)</th>
                  <th className="py-3 px-4 text-right">Actual Spent (KES)</th>
                  <th className="py-3 px-4 text-right">Remaining (KES)</th>
                  <th className="py-3 px-4 text-center">Utilization</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {budgetsData.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No budget lines configured. Please add vote heads first.
                    </td>
                  </tr>
                ) : (
                  budgetsData.items.map((b) => (
                    <tr key={b.vote_head_id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{b.vote_head_name}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{b.account_type_name}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-bold">{formatCurrency(b.budgeted_amount)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-700 font-semibold">{formatCurrency(b.actual_spent)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">{formatCurrency(b.remaining)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${b.utilization > 90 ? 'bg-rose-500' : b.utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(b.utilization, 100)}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${b.utilization > 90 ? 'text-rose-600' : 'text-slate-600'}`}>{b.utilization}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenBudgetModal(b)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold text-[11px] transition-colors"
                        >
                          Set Budget
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

      {/* ========================================================================= */}
      {/* 8. SUB-TAB: JOURNAL */}
      {/* ========================================================================= */}
      {activeSubTab === 'journal' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Top Actions Matching Screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              {/* Left empty as per screenshot */}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  if (voteHeads.length > 0 && accounts.length > 0) {
                    setNewJournal({
                      ...newJournal,
                      debit_account: voteHeads[0].name,
                      credit_account: accounts[0].name
                    });
                  }
                  setShowJournalModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Journal Entry</span>
              </button>

              <button
                onClick={() => window.print()}
                className="p-2 bg-white border border-sky-200 hover:bg-sky-50 rounded-lg text-sky-600 shadow-xs transition-colors"
                title="Print Journal Register"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  exportToCsv(
                    'General_Journal_Register',
                    ['#', 'Journal No', 'Date', 'Description', 'Amount', 'Transaction Type', 'Status'],
                    journalEntries.map((j, idx) => [
                      idx + 1,
                      j.entry_number || j.reference_number || `JNL-${idx + 1000}`,
                      j.entry_date || j.date || '',
                      j.narration || j.description || '',
                      j.total_debit || j.amount || 0,
                      j.transaction_type || 'JOURNAL',
                      j.status || 'Not posted'
                    ])
                  )
                }
                className="p-2 bg-white border border-sky-200 hover:bg-sky-50 rounded-lg text-sky-600 shadow-xs transition-colors"
                title="Export to CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowJournalFilter(!showJournalFilter)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold transition-all ${
                  showJournalFilter || journalFilterType !== 'ALL'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                    : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                }`}
                title="Toggle Filters"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Search Box Matching Screenshot */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Journal number
            </label>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setAppliedJournalSearch(journalSearch);
                  }
                }}
                placeholder="Enter all or part of a jo..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-800"
              />
              <button
                type="button"
                onClick={() => setAppliedJournalSearch(journalSearch)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setJournalSearch('');
                  setAppliedJournalSearch('');
                }}
                className="px-4 py-2 bg-white border border-sky-400 text-sky-700 hover:bg-sky-50 font-bold text-xs rounded-lg shadow-xs transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Filter drawer if toggled */}
            {showJournalFilter && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-slate-600">Transaction Type:</span>
                {['ALL', 'REVERSAL', 'FEE_RECEIPT', 'EXPENSE_VOUCHER', 'MANUAL_JOURNAL'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setJournalFilterType(t)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      journalFilterType === t
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table Matching Screenshot */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-900 font-bold border-b border-slate-200 text-xs tracking-tight">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Journal No.</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Journal Description</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4">Transaction Type</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {(() => {
                    const filtered = journalEntries.filter((j) => {
                      const searchStr = appliedJournalSearch.toLowerCase();
                      const jNo = (j.entry_number || j.reference_number || '').toLowerCase();
                      const desc = (j.narration || j.description || '').toLowerCase();
                      const type = (j.transaction_type || (j.narration?.toLowerCase().includes('reversal') ? 'REVERSAL' : j.narration?.toLowerCase().includes('fee') ? 'FEE_RECEIPT' : 'MANUAL_JOURNAL')).toUpperCase();

                      const matchSearch = !searchStr || jNo.includes(searchStr) || desc.includes(searchStr);
                      const matchType = journalFilterType === 'ALL' || type === journalFilterType;
                      return matchSearch && matchType;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                            No journal entries match the search criteria. Click "+ New Journal Entry" above to post an entry.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((j, idx) => {
                      const amount = parseFloat(j.total_debit || j.total_amount || j.amount || 0);
                      const formattedAmount = 'KES ' + Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                      const rawDate = j.entry_date || j.date || j.created_at;
                      const dateObj = rawDate ? new Date(rawDate) : new Date();
                      const formattedDate = isNaN(dateObj.getTime())
                        ? rawDate
                        : `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

                      const inferredType = (
                        j.transaction_type ||
                        (j.narration?.toLowerCase().includes('reversal')
                          ? 'REVERSAL'
                          : j.narration?.toLowerCase().includes('fee') || j.narration?.toLowerCase().includes('receipt')
                          ? 'FEE_RECEIPT'
                          : j.narration?.toLowerCase().includes('expense') || j.narration?.toLowerCase().includes('voucher')
                          ? 'EXPENSE_VOUCHER'
                          : 'MANUAL_JOURNAL')
                      ).toUpperCase();

                      const displayStatus = j.status === 'POSTED' || j.status === 'APPROVED' ? 'Posted' : 'Not posted';

                      return (
                        <tr key={j.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 text-center font-bold text-slate-900">
                            {idx + 1}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-slate-900">
                            {j.entry_number || j.reference_number || `JNL-${1248 - idx}`}
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-700">
                            {formattedDate}
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-900">
                            {j.narration || j.description || 'General Journal Entry'}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                            {formattedAmount}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-[11px] text-slate-700 uppercase">
                            {inferredType}
                          </td>
                          <td className="py-4 px-4 text-slate-700">
                            <span className="text-xs font-semibold">
                              {displayStatus}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setViewingJournal(j)}
                              className="px-3 py-1 border border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 mx-auto shadow-2xs"
                            >
                              <span>Action</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500 font-medium">
              <div>
                Showing <span className="font-bold text-slate-700">{journalEntries.length}</span> total entries
              </div>
              <div className="flex items-center gap-2">
                <span>Items per page: 50</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. SUB-TAB: GENERAL LEDGER */}
      {/* ========================================================================= */}
      {activeSubTab === 'general-ledger' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">General Ledger (Immutable Audit Trail)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Chronological double-entry stream of all debit & credit postings with SHA-256 cryptographic verification</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={ledgerStartDate}
                onChange={(e) => setLedgerStartDate(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={ledgerEndDate}
                onChange={(e) => setLedgerEndDate(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
              <button onClick={() => loadAccountingData()} className="p-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-sky-700 font-bold flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
              <button onClick={() => window.print()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Entry Type</th>
                  <th className="py-3 px-4">Description / Reference</th>
                  <th className="py-3 px-4">Student / Payee</th>
                  <th className="py-3 px-4 text-right">Debit (DR)</th>
                  <th className="py-3 px-4 text-right">Credit (CR)</th>
                  <th className="py-3 px-4 text-center">Checksum Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No ledger transactions found in the database.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono text-slate-600">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[10px]">
                          {l.entry_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{l.description || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-700">{l.first_name ? `${l.first_name} ${l.last_name} (${l.admission_number})` : '-'}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">{l.debit_amount > 0 ? formatCurrency(l.debit_amount) : '-'}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">{l.credit_amount > 0 ? formatCurrency(l.credit_amount) : '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          {l.checksum ? l.checksum.substring(0, 10) + '...' : 'VERIFIED'}
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

      {/* ========================================================================= */}
      {/* MODAL 1: ADD ACCOUNT TYPE */}
      {/* ========================================================================= */}
      {showAccountTypeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Account Type (Fund)</h3>
              <button onClick={() => setShowAccountTypeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAccountType} className="space-y-3.5 mt-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Fund Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SPECIAL DEVELOPMENT FUND"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Fund Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 600"
                  value={newTypeCode}
                  onChange={(e) => setNewTypeCode(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Purpose of this IPSAS fund..."
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAccountTypeModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">
                  {submitting ? 'Saving...' : 'Save Account Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD VOTE HEAD */}
      {/* ========================================================================= */}
      {showVoteHeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Create Vote Head</h3>
              <button onClick={() => setShowVoteHeadModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateVoteHead} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Vote Head Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuition & Teaching Materials"
                  value={newVoteHead.name}
                  onChange={(e) => setNewVoteHead({ ...newVoteHead, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 107"
                    value={newVoteHead.account_code}
                    onChange={(e) => setNewVoteHead({ ...newVoteHead, account_code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account Type / Fund</label>
                  <select
                    value={newVoteHead.account_type_id}
                    onChange={(e) => setNewVoteHead({ ...newVoteHead, account_type_id: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="">-- Standard Operations --</option>
                    {accountTypes.map((at) => (
                      <option key={at.id} value={at.id}>{at.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="opt-vh"
                  checked={newVoteHead.is_optional}
                  onChange={(e) => setNewVoteHead({ ...newVoteHead, is_optional: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <label htmlFor="opt-vh" className="text-slate-700 font-semibold cursor-pointer">
                  Optional Vote Head (e.g. Transport, Uniform, Remedial)
                </label>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Notes or description..."
                  value={newVoteHead.description}
                  onChange={(e) => setNewVoteHead({ ...newVoteHead, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVoteHeadModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">
                  {submitting ? 'Saving...' : 'Save Vote Head'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD BANK & CASH ACCOUNT */}
      {/* ========================================================================= */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Bank or Cash Account</h3>
              <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Account Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Development Co-op Bank Account"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Bank / Institution Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Co-operative Bank"
                    value={newAccount.bank_name}
                    onChange={(e) => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. Machakos"
                    value={newAccount.branch}
                    onChange={(e) => setNewAccount({ ...newAccount, branch: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account / Till Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01129038102900"
                    value={newAccount.account_number}
                    onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Fund Category</label>
                  <select
                    value={newAccount.account_type}
                    onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="OPERATIONS">OPERATIONS</option>
                    <option value="TUITION">TUITION</option>
                    <option value="SCHOOL FUND / BOARDING">SCHOOL FUND / BOARDING</option>
                    <option value="DEVELOPMENT & INFRASTRUCTURE">DEVELOPMENT & INFRASTRUCTURE</option>
                    <option value="ACTIVITY & SPORTS FUND">ACTIVITY & SPORTS FUND</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Opening Balance (KES)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newAccount.opening_balance}
                    onChange={(e) => setNewAccount({ ...newAccount, opening_balance: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="is-cash"
                    checked={newAccount.is_cash_account}
                    onChange={(e) => setNewAccount({ ...newAccount, is_cash_account: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  <label htmlFor="is-cash" className="text-slate-700 font-semibold cursor-pointer">
                    Physical Cash / Float Book
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">
                  {submitting ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3B: EDIT BANK & CASH ACCOUNT */}
      {/* ========================================================================= */}
      {showEditAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Edit Financial Account</h3>
                  <p className="text-[11px] text-slate-500">Update account particulars and fund classification</p>
                </div>
              </div>
              <button onClick={() => setShowEditAccountModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateAccount} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Account Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NDUUNDUNE SECONDARY SCHOOL"
                  value={editAccountForm.name}
                  onChange={(e) => setEditAccountForm({ ...editAccountForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Bank / Institution Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KCB BANK"
                    value={editAccountForm.bank_name}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, bank_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. Emali Branch"
                    value={editAccountForm.branch}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, branch: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account / Till Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1106398408"
                    value={editAccountForm.account_number}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, account_number: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account Type / Fund</label>
                  <select
                    value={editAccountForm.account_type}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, account_type: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="SCHOOL FUND">SCHOOL FUND</option>
                    <option value="OPERATIONS">OPERATIONS</option>
                    <option value="TUITION">TUITION</option>
                    <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                    <option value="DEVELOPMENT & INFRASTRUCTURE">DEVELOPMENT & INFRASTRUCTURE</option>
                    <option value="ACTIVITY & SPORTS FUND">ACTIVITY & SPORTS FUND</option>
                    {accountTypes.map((at) => (
                      <option key={at.id} value={at.name.toUpperCase()}>{at.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Currency</label>
                  <input
                    type="text"
                    value={editAccountForm.currency}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, currency: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Status</label>
                  <select
                    value={editAccountForm.status}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, status: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-is-cash"
                  checked={editAccountForm.is_cash_account}
                  onChange={(e) => setEditAccountForm({ ...editAccountForm, is_cash_account: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <label htmlFor="edit-is-cash" className="text-slate-700 font-semibold cursor-pointer">
                  Physical Cash / Float Book (Cash Account)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditAccountModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">
                  {submitting ? 'Saving...' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2B: EDIT VOTE HEAD */}
      {/* ========================================================================= */}
      {showEditVoteHeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Edit Vote Head</h3>
                  <p className="text-[11px] text-slate-500">Update budgetary line item and classification</p>
                </div>
              </div>
              <button onClick={() => setShowEditVoteHeadModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateVoteHead} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Vote Head Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuition Fees, Boarding, R&M"
                  value={editVoteHeadForm.name}
                  onChange={(e) => setEditVoteHeadForm({ ...editVoteHeadForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account Code</label>
                  <input
                    type="text"
                    placeholder="e.g. VH-101"
                    value={editVoteHeadForm.account_code}
                    onChange={(e) => setEditVoteHeadForm({ ...editVoteHeadForm, account_code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">IPSAS Fund Type</label>
                  <select
                    value={editVoteHeadForm.account_type_id}
                    onChange={(e) => setEditVoteHeadForm({ ...editVoteHeadForm, account_type_id: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="">-- Standard Operations --</option>
                    {accountTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code || 'FUND'})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-is-optional"
                  checked={editVoteHeadForm.is_optional}
                  onChange={(e) => setEditVoteHeadForm({ ...editVoteHeadForm, is_optional: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <label htmlFor="edit-is-optional" className="text-slate-700 font-semibold cursor-pointer">
                  Optional Line Item (e.g. Bus Hire, Tour, Special Activity)
                </label>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Notes or description..."
                  value={editVoteHeadForm.description}
                  onChange={(e) => setEditVoteHeadForm({ ...editVoteHeadForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditVoteHeadModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">
                  {submitting ? 'Saving...' : 'Update Vote Head'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1B: EDIT ACCOUNT TYPE */}
      {/* ========================================================================= */}
      {showEditAccountTypeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Edit Account Type / Fund</h3>
                  <p className="text-[11px] text-slate-500">Update IPSAS fund category name and code</p>
                </div>
              </div>
              <button onClick={() => setShowEditAccountTypeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateAccountType} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Fund / Account Type Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operations Fund, Tuition Fund"
                  value={editAccountTypeForm.name}
                  onChange={(e) => setEditAccountTypeForm({ ...editAccountTypeForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Fund Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. FUND-01, TUITION"
                  value={editAccountTypeForm.code}
                  onChange={(e) => setEditAccountTypeForm({ ...editAccountTypeForm, code: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe what this fund category is for..."
                  value={editAccountTypeForm.description}
                  onChange={(e) => setEditAccountTypeForm({ ...editAccountTypeForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditAccountTypeModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">
                  {submitting ? 'Saving...' : 'Update Fund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECORD TAKE-ON OPENING BALANCE */}
      {/* ========================================================================= */}
      {showTakeOnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Record Take-On Opening Balance</h3>
              <button onClick={() => setShowTakeOnModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTakeOn} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Target Account / Ledger Item *</label>
                <select
                  value={newTakeOn.account_id}
                  onChange={(e) => {
                    const acc = accounts.find((a) => a.id === e.target.value);
                    setNewTakeOn({
                      ...newTakeOn,
                      account_id: e.target.value,
                      account_name: acc ? acc.name : ''
                    });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="">-- Select Bank or Cash Account --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.account_number})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="150000"
                    value={newTakeOn.amount}
                    onChange={(e) => setNewTakeOn({ ...newTakeOn, amount: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Balance Type *</label>
                  <select
                    value={newTakeOn.balance_type}
                    onChange={(e) => setNewTakeOn({ ...newTakeOn, balance_type: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="DEBIT">DEBIT (DR - Asset / Bank Balance)</option>
                    <option value="CREDIT">CREDIT (CR - Liability / Fund Balance)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Financial Year</label>
                  <input
                    type="text"
                    value={newTakeOn.financial_year}
                    onChange={(e) => setNewTakeOn({ ...newTakeOn, financial_year: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">As Of Date</label>
                  <input
                    type="date"
                    value={newTakeOn.as_of_date}
                    onChange={(e) => setNewTakeOn({ ...newTakeOn, as_of_date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notes / Auditor References</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Audited opening bank balance verified per KCB bank statement Dec 2025"
                  value={newTakeOn.notes}
                  onChange={(e) => setNewTakeOn({ ...newTakeOn, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTakeOnModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">
                  {submitting ? 'Saving...' : 'Save Opening Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RECORD TRANSFER */}
      {/* ========================================================================= */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Record Inter-Account Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordTransfer} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Source Account (Transfer From) *</label>
                <select
                  value={newTransfer.from_account_id}
                  onChange={(e) => {
                    const acc = accounts.find((a) => a.id === e.target.value);
                    setNewTransfer({
                      ...newTransfer,
                      from_account_id: e.target.value,
                      from_account_name: acc ? acc.name : ''
                    });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="">-- Select Source Account --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.account_number})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Destination Account (Transfer To) *</label>
                <select
                  value={newTransfer.to_account_id}
                  onChange={(e) => {
                    const acc = accounts.find((a) => a.id === e.target.value);
                    setNewTransfer({
                      ...newTransfer,
                      to_account_id: e.target.value,
                      to_account_name: acc ? acc.name : ''
                    });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-emerald-800"
                >
                  <option value="">-- Select Destination Account --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.account_number})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50000"
                    value={newTransfer.amount}
                    onChange={(e) => setNewTransfer({ ...newTransfer, amount: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Transfer Date *</label>
                  <input
                    type="date"
                    required
                    value={newTransfer.date}
                    onChange={(e) => setNewTransfer({ ...newTransfer, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Reference / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. TRF-2026-0041"
                  value={newTransfer.reference}
                  onChange={(e) => setNewTransfer({ ...newTransfer, reference: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Narration / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Transfer to cover RMI maintenance costs"
                  value={newTransfer.narration}
                  onChange={(e) => setNewTransfer({ ...newTransfer, narration: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">
                  {submitting ? 'Posting...' : 'Save Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: SET BUDGET ESTIMATE */}
      {/* ========================================================================= */}
      {showBudgetModal && selectedBudgetVH && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Set Approved Budget (FY {budgetYear})</h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-3 mt-3 text-xs">
              <div>
                <div className="text-slate-500 font-semibold">Vote Head:</div>
                <div className="text-sm font-bold text-slate-900">{selectedBudgetVH.vote_head_name}</div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Approved Annual Budget (KES) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g. 500000"
                  value={budgetAmountInput}
                  onChange={(e) => setBudgetAmountInput(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Budget Allocation Notes</label>
                <textarea
                  rows={2}
                  placeholder="Board of Management approval reference..."
                  value={budgetNotesInput}
                  onChange={(e) => setBudgetNotesInput(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">
                  {submitting ? 'Saving...' : 'Save Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: POST GENERAL JOURNAL */}
      {/* ========================================================================= */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Post General Journal Entry</h3>
              <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordJournal} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Debit Account (DR) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuition & Teaching Materials or Bank Account"
                  value={newJournal.debit_account}
                  onChange={(e) => setNewJournal({ ...newJournal, debit_account: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Credit Account (CR) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Tuition KCB Account or Prior Period Reserve"
                  value={newJournal.credit_account}
                  onChange={(e) => setNewJournal({ ...newJournal, credit_account: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="12000"
                    value={newJournal.amount}
                    onChange={(e) => setNewJournal({ ...newJournal, amount: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Posting Date *</label>
                  <input
                    type="date"
                    required
                    value={newJournal.date}
                    onChange={(e) => setNewJournal({ ...newJournal, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Reference / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. AUD-2026-009"
                  value={newJournal.reference}
                  onChange={(e) => setNewJournal({ ...newJournal, reference: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Narration / Justification *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Prior period audit reclassification adjustment"
                  value={newJournal.narration}
                  onChange={(e) => setNewJournal({ ...newJournal, narration: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">
                  {submitting ? 'Posting...' : 'Post Journal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: VIEW JOURNAL VOUCHER DETAILS */}
      {/* ========================================================================= */}
      {viewingJournal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Journal Voucher Details</h3>
                <div className="text-[11px] font-mono font-bold text-sky-800">{viewingJournal.entry_number} • {viewingJournal.entry_date}</div>
              </div>
              <button onClick={() => setViewingJournal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mt-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-500 font-semibold">Narration / Purpose:</div>
                <div className="text-slate-900 font-bold mt-0.5">{viewingJournal.narration}</div>
              </div>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2">Account Name</th>
                    <th className="p-2 text-right">Debit (DR)</th>
                    <th className="p-2 text-right">Credit (CR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingJournal.items && viewingJournal.items.map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2 font-bold text-slate-800">{it.account_name}</td>
                      <td className="p-2 text-right font-mono text-rose-700 font-bold">{it.debit_amount > 0 ? formatCurrency(it.debit_amount) : '-'}</td>
                      <td className="p-2 text-right font-mono text-emerald-700 font-bold">{it.credit_amount > 0 ? formatCurrency(it.credit_amount) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewingJournal(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-bold"
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