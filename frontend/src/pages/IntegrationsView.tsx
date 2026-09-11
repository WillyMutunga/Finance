import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { Student } from '../types';
import { exportToCsv } from '../utils/exportUtils';
import {
  Smartphone,
  Building,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  ShieldCheck,
  Download,
  Printer,
  Plus,
  Search,
  Key,
  Radio,
  Send,
  Code,
  X,
  RotateCw,
  CreditCard,
  Layers,
  Zap,
  Check,
  TrendingUp,
  Activity
} from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('skypay');
  const [loading, setLoading] = useState(true);

  // Overview stats
  const [overview, setOverview] = useState<{
    total_transactions_count: number;
    total_volume_amount: number;
    matched_transactions_count: number;
    pending_exceptions_count: number;
    auto_reconciliation_rate: number;
    active_gateways_count: number;
  }>({
    total_transactions_count: 0,
    total_volume_amount: 0,
    matched_transactions_count: 0,
    pending_exceptions_count: 0,
    auto_reconciliation_rate: 100,
    active_gateways_count: 4
  });

  // Data lists
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<any>({});

  // Filter & Search
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showConnectBankModal, setShowConnectBankModal] = useState(false);
  const [showSTKModal, setShowSTKModal] = useState(false);
  const [selectedRawPayload, setSelectedRawPayload] = useState<any | null>(null);
  const [manualMatchTx, setManualMatchTx] = useState<any | null>(null);
  const [selectedStudentForMatch, setSelectedStudentForMatch] = useState<string>('');

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  // Form states
  const [gatewayForm, setGatewayForm] = useState({
    mpesa_paybill: '',
    sms_sender_id: '',
    mpesa_consumer_key: '',
    mpesa_consumer_secret: '',
    mpesa_passkey: ''
  });

  const [simForm, setSimForm] = useState({
    channel: 'MPESA_C2B',
    amount: '15000',
    account_reference: '',
    payer_phone: '0712345678',
    payer_name: 'David Mwangi',
    reference_number: ''
  });

  const [bankForm, setBankForm] = useState({
    bank_name: 'Kenya Commercial Bank (KCB)',
    account_name: 'Main Operations Account',
    account_number: '',
    paybill: '522123',
    branch: 'Main Corporate Branch',
    auto_match_pattern: 'ADM-NO'
  });

  const [stkForm, setSTKForm] = useState({
    student_id: '',
    phone_number: '0712345678',
    amount: '5000',
    account_reference: ''
  });

  const subTabs = [
    { id: 'skypay', label: 'SkyPay & Mobile Money' },
    { id: 'bank-integrations', label: 'Bank Direct Feeds & IPN' },
    { id: 'transactions', label: 'Integrated IPN Transactions Feed' },
    { id: 'transaction-attempts', label: 'STK Telemetry & Attempts' }
  ];

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resOverview, resBanks, resTxs, resAtt, resSettings, resStudents] = await Promise.allSettled([
        ApiService.getIntegrationsOverview(),
        ApiService.getBankIntegrations(),
        ApiService.getIntegratedTransactions(),
        ApiService.getSTKAttempts(),
        ApiService.getIntegrationSettings(),
        ApiService.getStudents()
      ]);

      if (resOverview.status === 'fulfilled' && resOverview.value.data) setOverview(resOverview.value.data);
      if (resBanks.status === 'fulfilled' && resBanks.value.data) setBankAccounts(resBanks.value.data);
      if (resTxs.status === 'fulfilled' && resTxs.value.data) setTransactions(resTxs.value.data);
      if (resAtt.status === 'fulfilled' && resAtt.value.data) setAttempts(resAtt.value.data);
      if (resSettings.status === 'fulfilled' && resSettings.value.data) {
        setSettings(resSettings.value.data);
        setGatewayForm({
          mpesa_paybill: resSettings.value.data.mpesa_paybill || '',
          sms_sender_id: resSettings.value.data.sms_sender_id || '',
          mpesa_consumer_key: '',
          mpesa_consumer_secret: '',
          mpesa_passkey: ''
        });
      }
      if (resStudents.status === 'fulfilled' && resStudents.value.data) {
        setStudents(resStudents.value.data);
        if (resStudents.value.data.length > 0) {
          if (!simForm.account_reference) setSimForm((prev) => ({ ...prev, account_reference: resStudents.value.data[0].admission_number }));
          if (!stkForm.student_id) {
            setSTKForm((prev) => ({
              ...prev,
              student_id: resStudents.value.data[0].id,
              account_reference: resStudents.value.data[0].admission_number,
              phone_number: resStudents.value.data[0].guardian_phone || '0712345678'
            }));
          }
        }
      }
    } catch (e) {
      console.error('Error loading integrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const formatKES = (val: number) => `KES ${Number(val || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // 1. Update Gateway Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.updateIntegrationSettings(gatewayForm);
      setShowConfigModal(false);
      showToast('Gateway credentials updated successfully!');
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error updating settings');
    }
  };

  // 2. Connect Bank Account
  const handleConnectBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.account_number.trim() || !bankForm.account_name.trim()) {
      alert('Please fill in Account Name and Account Number.');
      return;
    }

    try {
      await ApiService.createBankIntegration(bankForm);
      setShowConnectBankModal(false);
      showToast('Bank gateway connection established!');
      setBankForm({
        bank_name: 'Kenya Commercial Bank (KCB)',
        account_name: 'Main Operations Account',
        account_number: '',
        paybill: '522123',
        branch: 'Main Corporate Branch',
        auto_match_pattern: 'ADM-NO'
      });
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error connecting bank');
    }
  };

  // 3. Simulate Inbound Payment
  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(simForm.amount);
    if (!amt || amt <= 0 || !simForm.account_reference.trim()) {
      alert('Please enter a valid amount and student account/admission reference.');
      return;
    }

    try {
      const res = await ApiService.simulateInboundPayment({
        channel: simForm.channel,
        amount: amt,
        account_reference: simForm.account_reference.trim(),
        payer_phone: simForm.payer_phone.trim(),
        payer_name: simForm.payer_name.trim(),
        reference_number: simForm.reference_number.trim() || undefined
      });

      setShowSimulateModal(false);
      const reconStatus = res?.data?.reconciliation?.status;
      if (reconStatus === 'SUCCESS') {
        showToast(`Payment processed & AUTO-MATCHED to student! Receipt #${res.data.reconciliation.receipt_number || 'Issued'}`);
      } else {
        showToast('Inbound payment logged in IPN feed for manual review.');
      }
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error simulating payment');
    }
  };

  // 4. Trigger STK Push
  const handleTriggerSTK = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(stkForm.amount);
    if (!amt || amt <= 0 || !stkForm.phone_number.trim()) {
      alert('Please enter valid phone and amount.');
      return;
    }

    try {
      const res = await ApiService.triggerSTKPushPrompt({
        phone_number: stkForm.phone_number.trim(),
        amount: amt,
        account_reference: stkForm.account_reference.trim(),
        student_id: stkForm.student_id || undefined
      });

      setShowSTKModal(false);
      showToast(`STK Push prompt sent to ${stkForm.phone_number}. Telemetry recorded!`);
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error dispatching STK push');
    }
  };

  // 5. Manual Match
  const handleManualResolve = async () => {
    if (!manualMatchTx || !selectedStudentForMatch) {
      alert('Please select a student to allocate this payment.');
      return;
    }

    try {
      await ApiService.manualResolveException(manualMatchTx.id, selectedStudentForMatch, 'Manual resolution from Integrations feed');
      setManualMatchTx(null);
      setSelectedStudentForMatch('');
      showToast('Transaction manually reconciled and credited to student fee ledger!');
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error reconciling transaction');
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchSearch =
      search === '' ||
      tx.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
      tx.payer_name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.payer_phone?.toLowerCase().includes(search.toLowerCase()) ||
      tx.account_reference?.toLowerCase().includes(search.toLowerCase()) ||
      (tx.first_name && `${tx.first_name} ${tx.last_name}`.toLowerCase().includes(search.toLowerCase()));

    const matchChannel = channelFilter === 'ALL' || tx.channel === channelFilter;
    const matchStatus = statusFilter === 'ALL' || tx.reconciliation_status === statusFilter;
    return matchSearch && matchChannel && matchStatus;
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

      {/* Top KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Integrated Inflow Volume</span>
            <span className="text-lg font-extrabold text-emerald-600 font-mono mt-0.5 block">{formatKES(overview.total_volume_amount)}</span>
            <span className="text-[10px] text-slate-400 font-medium">{overview.total_transactions_count} electronic payments</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Auto-Recon Match Rate</span>
            <span className="text-lg font-extrabold text-sky-600 font-mono mt-0.5 block">{overview.auto_reconciliation_rate}%</span>
            <span className="text-[10px] text-emerald-600 font-bold">{overview.matched_transactions_count} matched instantly</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Connected Gateways</span>
            <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">{bankAccounts.length} Live Feeds</span>
            <span className="text-[10px] text-emerald-600 font-bold">KCB, Equity, Co-op, M-Pesa</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pending Exceptions</span>
            <span className="text-lg font-extrabold text-amber-600 font-mono mt-0.5 block">{overview.pending_exceptions_count} Items</span>
            <span className="text-[10px] text-slate-400 font-medium">Unidentified reference codes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
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
              {tab.id === 'transactions' && overview.pending_exceptions_count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                  {overview.pending_exceptions_count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. SUB-TAB: SKYPAY & MOBILE MONEY */}
      {activeSubTab === 'skypay' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">SkyPay & Mobile Money Channels</h2>
              <p className="text-xs text-slate-500 mt-0.5">Automated settlement accounts, Safaricom Daraja API C2B/STK Push, and IPN listeners</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfigModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Configure Credentials</span>
              </button>

              <button
                onClick={() => setShowSimulateModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>+ Simulate Inbound Payment</span>
              </button>
            </div>
          </div>

          {/* Credentials Status Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">M-Pesa Paybill / Shortcode</span>
              <span className="font-mono font-extrabold text-slate-900 text-base">{settings.mpesa_paybill || '522123'}</span>
              <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> C2B Validation Registered
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SMS Sender ID</span>
              <span className="font-mono font-extrabold text-slate-900 text-base">{settings.sms_sender_id || 'NDUUNDUNE'}</span>
              <span className="text-[10px] text-slate-500 font-medium block">Active (Africa's Talking / SMS Gateway)</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daraja STK Passkey</span>
              <span className="font-mono font-bold text-slate-700 text-sm">••••••••••••••••</span>
              <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Encrypted in Keychain
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Webhook Listeners</span>
              <span className="font-bold text-slate-900 text-xs block">Live Real-time IPN (Port 8000)</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold inline-block border border-emerald-200">
                100% Operational
              </span>
            </div>
          </div>

          {/* Connected Accounts Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">Integrated Settlement Accounts</h3>
              <span className="text-[11px] text-slate-500 font-medium">Automatic deposit reconciliation active</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Bank &amp; Account Name</th>
                  <th className="py-3 px-5">Account Number / Paybill</th>
                  <th className="py-3 px-5">Auto-Recon Pattern</th>
                  <th className="py-3 px-5">Branch / Channel</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bankAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-extrabold text-slate-900 uppercase text-xs">{acc.account_name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{acc.bank_name}</div>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-sky-800">
                      <div>{acc.account_number}</div>
                      {acc.paybill && <span className="text-[10px] text-slate-400">Paybill: {acc.paybill}</span>}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-600 font-semibold">{acc.auto_match_pattern}</td>
                    <td className="py-3.5 px-5 text-slate-600">{acc.branch}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-flex items-center gap-1 font-extrabold text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wide border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{acc.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SUB-TAB: BANK INTEGRATIONS */}
      {activeSubTab === 'bank-integrations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Bank Direct IPN Feeds &amp; Gateways</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time payment notification hooks connected directly with Kenyan banking APIs</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConnectBankModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Connect Bank Account</span>
              </button>

              <button
                onClick={() => {
                  setSimForm((prev) => ({ ...prev, channel: 'BANK_TRANSFER' }));
                  setShowSimulateModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                <Building className="w-4 h-4" />
                <span>Simulate Bank Feed</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {b.bank_name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{b.bank_name}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Acc: {b.account_number} {b.paybill ? `| Paybill: ${b.paybill}` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Webhook
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Account Title:</span>
                    <span className="font-bold text-slate-800 uppercase">{b.account_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Auto-Recon Strategy:</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                      {b.auto_match_pattern} (Exact &amp; Fuzzy)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Webhook Endpoint:</span>
                    <span className="font-mono text-[10px] text-slate-500">/webhooks/bank/{b.bank_name.toLowerCase().includes('kcb') ? 'kcb' : b.bank_name.toLowerCase().includes('equity') ? 'equity' : 'coop'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SUB-TAB: TRANSACTIONS FEED */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Integrated IPN Transaction Logs</h2>
              <p className="text-xs text-slate-500 mt-0.5">Raw incoming bank webhooks &amp; M-Pesa notifications received through payment gateways</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSimulateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Simulate Inbound Payment</span>
              </button>

              <button
                onClick={() =>
                  exportToCsv(
                    'Integrated_IPN_Transactions',
                    ['Date', 'Channel', 'TransID', 'Payer', 'Phone', 'Account Ref', 'Amount', 'Reconciliation Status', 'Receipt No'],
                    filteredTransactions.map((tx) => [
                      new Date(tx.payment_date).toLocaleString(),
                      tx.channel,
                      tx.reference_number,
                      tx.payer_name,
                      tx.payer_phone,
                      tx.account_reference,
                      tx.amount,
                      tx.reconciliation_status,
                      tx.issued_receipt_number || '-'
                    ])
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={loadAllData}
                className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors"
                title="Refresh Transactions"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by TransID, payer name, phone, account reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
              >
                <option value="ALL">All Payment Channels</option>
                <option value="MPESA_C2B">M-Pesa C2B Paybill</option>
                <option value="MPESA_STK">M-Pesa STK Push</option>
                <option value="BANK_TRANSFER">Bank Transfer / EFT</option>
                <option value="BANK_DEPOSIT">Direct Bank Cash Deposit</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
              >
                <option value="ALL">All Recon Statuses</option>
                <option value="AUTO_MATCHED">Auto-Matched (100%)</option>
                <option value="MANUALLY_MATCHED">Manually Reconciled</option>
                <option value="UNMATCHED">Unmatched / Exception</option>
                <option value="AMBIGUOUS">Ambiguous</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">TransID / Ref</th>
                  <th className="py-3 px-4">Payer Particulars</th>
                  <th className="py-3 px-4">Account Reference</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No electronic payment transactions recorded. Use "+ Simulate Inbound Payment" above to test live feeds.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {new Date(tx.payment_date || tx.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-bold uppercase text-slate-700">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                          {tx.channel?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-800">{tx.reference_number}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 uppercase">
                        <div>{tx.payer_name}</div>
                        {tx.payer_phone && <div className="text-[10px] text-slate-400 font-mono font-normal">{tx.payer_phone}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        <div>{tx.account_reference || 'N/A'}</div>
                        {tx.first_name && (
                          <div className="text-[10px] text-emerald-700 font-semibold font-sans">
                            {tx.first_name} {tx.last_name} ({tx.class_name})
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-600 text-sm">
                        {formatKES(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {tx.reconciliation_status === 'AUTO_MATCHED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            AUTO-MATCHED
                          </span>
                        )}
                        {tx.reconciliation_status === 'MANUALLY_MATCHED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            RECONCILED
                          </span>
                        )}
                        {(tx.reconciliation_status === 'UNMATCHED' || tx.reconciliation_status === 'AMBIGUOUS') && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            UNMATCHED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedRawPayload(tx.raw_payload || tx)}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-xs"
                            title="Inspect raw JSON webhook payload"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>

                          {(tx.reconciliation_status === 'UNMATCHED' || tx.reconciliation_status === 'AMBIGUOUS') && (
                            <button
                              onClick={() => {
                                setManualMatchTx(tx);
                                setSelectedStudentForMatch(students[0]?.id || '');
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] shadow-xs"
                              title="Manually allocate to student"
                            >
                              Match
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

      {/* 4. SUB-TAB: STK TELEMETRY & ATTEMPTS */}
      {activeSubTab === 'transaction-attempts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">M-Pesa STK Push Attempts &amp; Telemetry</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time telemetry on parent-initiated mobile money prompts and payment responses</p>
            </div>

            <button
              onClick={() => setShowSTKModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>+ Dispatch Parent STK Push</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Initiation Timestamp</th>
                  <th className="py-3 px-5">Phone Number</th>
                  <th className="py-3 px-5">Target Student / Ref</th>
                  <th className="py-3 px-5">Checkout Request ID</th>
                  <th className="py-3 px-5 text-right">Amount (KES)</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5">Gateway Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      Zero failed transaction attempts. M-Pesa STK Push gateway is 100% operational.
                    </td>
                  </tr>
                ) : (
                  attempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 text-slate-600 font-medium">
                        {new Date(att.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{att.phone_number}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {att.first_name ? `${att.first_name} ${att.last_name} (${att.admission_number})` : att.account_reference}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-500 text-[11px]">{att.checkout_request_id || 'ws_CO_...'}</td>
                      <td className="py-3.5 px-5 text-right font-mono font-extrabold text-emerald-600">
                        {formatKES(att.amount)}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 italic text-[11px]">{att.response_description || 'Success'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Configure Gateway Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Configure Payment Gateway Credentials</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">M-Pesa Paybill / Shortcode *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 522123 or 247247"
                  value={gatewayForm.mpesa_paybill}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, mpesa_paybill: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">SMS Sender ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NDUUNDUNE"
                  value={gatewayForm.sms_sender_id}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, sms_sender_id: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Daraja Consumer Key</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep existing key"
                  value={gatewayForm.mpesa_consumer_key}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, mpesa_consumer_key: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Daraja Consumer Secret</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep existing secret"
                  value={gatewayForm.mpesa_consumer_secret}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, mpesa_consumer_secret: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Lipa Na M-Pesa Online Passkey</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep existing passkey"
                  value={gatewayForm.mpesa_passkey}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, mpesa_passkey: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-lg font-bold shadow-sm">
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Simulate Inbound Payment Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Simulate Inbound Payment Webhook</h3>
                <p className="text-[11px] text-slate-500">Test live auto-reconciliation engine in real time</p>
              </div>
              <button onClick={() => setShowSimulateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payment Gateway / Channel *</label>
                <select
                  value={simForm.channel}
                  onChange={(e) => setSimForm({ ...simForm, channel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  <option value="MPESA_C2B">Safaricom M-Pesa C2B Paybill</option>
                  <option value="MPESA_STK">Safaricom Lipa Na M-Pesa (STK Push)</option>
                  <option value="BANK_TRANSFER">KCB Bank Kenya Direct IPN</option>
                  <option value="BANK_DEPOSIT">Equity Bank Direct EazzyAPI</option>
                  <option value="BANK_TRANSFER">Co-operative Bank Webhook</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Target Student / Account Ref *</label>
                <select
                  value={simForm.account_reference}
                  onChange={(e) => {
                    const adm = e.target.value;
                    const st = students.find((s) => s.admission_number === adm);
                    setSimForm({
                      ...simForm,
                      account_reference: adm,
                      payer_name: st?.guardian_name || `${st?.first_name || ''} Parent`,
                      payer_phone: st?.guardian_phone || '0712345678'
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.admission_number}>
                      {s.first_name} {s.last_name} (Adm: {s.admission_number})
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
                    value={simForm.amount}
                    onChange={(e) => setSimForm({ ...simForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={simForm.payer_phone}
                    onChange={(e) => setSimForm({ ...simForm, payer_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payer Name</label>
                  <input
                    type="text"
                    required
                    value={simForm.payer_name}
                    onChange={(e) => setSimForm({ ...simForm, payer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Simulated TransID</label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value={simForm.reference_number}
                    onChange={(e) => setSimForm({ ...simForm, reference_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm">
                  Send IPN Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Connect Bank Modal */}
      {showConnectBankModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Connect Bank Direct Feed</h3>
              <button onClick={() => setShowConnectBankModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConnectBank} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Bank Name *</label>
                <select
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  <option value="Kenya Commercial Bank (KCB)">Kenya Commercial Bank (KCB)</option>
                  <option value="Equity Bank Kenya">Equity Bank Kenya</option>
                  <option value="Co-operative Bank of Kenya">Co-operative Bank of Kenya</option>
                  <option value="NCBA Bank Kenya">NCBA Bank Kenya</option>
                  <option value="Stanbic Bank Kenya">Stanbic Bank Kenya</option>
                  <option value="ABSA Bank Kenya">ABSA Bank Kenya</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Account Title / Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Tuition Fees Account"
                  value={bankForm.account_name}
                  onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1106398408"
                    value={bankForm.account_number}
                    onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Paybill / Bank Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 522123"
                    value={bankForm.paybill}
                    onChange={(e) => setBankForm({ ...bankForm, paybill: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. Machakos Branch"
                    value={bankForm.branch}
                    onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Auto-Match Pattern</label>
                  <input
                    type="text"
                    value={bankForm.auto_match_pattern}
                    onChange={(e) => setBankForm({ ...bankForm, auto_match_pattern: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConnectBankModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm">
                  Connect Bank Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Trigger Parent STK Modal */}
      {showSTKModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Dispatch Parent STK Push Prompt</h3>
              <button onClick={() => setShowSTKModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriggerSTK} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Student *</label>
                <select
                  value={stkForm.student_id}
                  onChange={(e) => {
                    const sid = e.target.value;
                    const st = students.find((s) => s.id === sid);
                    setSTKForm({
                      ...stkForm,
                      student_id: sid,
                      account_reference: st?.admission_number || '',
                      phone_number: st?.guardian_phone || stkForm.phone_number
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} (Adm: {s.admission_number})
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
                    value={stkForm.amount}
                    onChange={(e) => setSTKForm({ ...stkForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Parent Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={stkForm.phone_number}
                    onChange={(e) => setSTKForm({ ...stkForm, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSTKModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm">
                  Send STK Prompt Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Raw Webhook Payload Inspector Modal */}
      {selectedRawPayload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Raw IPN Webhook Payload</h3>
              </div>
              <button onClick={() => setSelectedRawPayload(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4">
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96">
                {JSON.stringify(
                  typeof selectedRawPayload === 'string' ? JSON.parse(selectedRawPayload) : selectedRawPayload,
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedRawPayload(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Manual Match Modal */}
      {manualMatchTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Manually Allocate Unmatched IPN Payment</h3>
              <button onClick={() => setManualMatchTx(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">TransID:</span>
                  <span className="font-mono font-bold text-slate-900">{manualMatchTx.reference_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payer Name:</span>
                  <span className="font-bold text-slate-900">{manualMatchTx.payer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-mono font-extrabold text-emerald-600">{formatKES(manualMatchTx.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Raw Account Ref:</span>
                  <span className="font-mono text-slate-700 font-bold">{manualMatchTx.account_reference || 'N/A'}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Target Student *</label>
                <select
                  value={selectedStudentForMatch}
                  onChange={(e) => setSelectedStudentForMatch(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} (Adm: {s.admission_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManualMatchTx(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleManualResolve}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm"
                >
                  Confirm &amp; Allocate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};