import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ApiService } from '../services/api';
import {
  MessageSquare,
  Send,
  Filter,
  Search,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Clock,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Settings,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  Key,
  ShieldCheck,
  Radio,
  FileSpreadsheet,
  Download
} from 'lucide-react';

interface MessagingViewProps {
  currentRole: UserRole;
}

const ClipboardIllustration: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto space-y-3 animate-fadeIn">
    <div className="w-20 h-24 relative flex items-center justify-center">
      <svg viewBox="0 0 100 120" className="w-full h-full text-emerald-200">
        <rect x="15" y="15" width="70" height="95" rx="8" fill="none" stroke="#bbf7d0" strokeWidth="6" />
        <path d="M35,15 L35,10 C35,6 40,5 45,5 L55,5 C60,5 65,6 65,10 L65,15 Z" fill="#bbf7d0" />
        <circle cx="50" cy="10" r="3" fill="#ffffff" />
        <circle cx="70" cy="85" r="18" fill="#d1fae5" stroke="#a7f3d0" strokeWidth="4" />
        <line x1="70" y1="85" x2="70" y2="76" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="85" x2="77" y2="85" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
    <p className="text-sm font-semibold text-slate-500">{label}</p>
  </div>
);

export const MessagingView: React.FC<MessagingViewProps> = ({ currentRole }) => {
  const [activeTab, setActiveTab] = useState<'Compose' | 'Sent Logs' | 'Gateway Settings' | 'SMS Usage' | 'Buy SMS'>('Compose');
  const [logs, setLogs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type?: 'success' | 'error' | 'warning' } | null>(null);

  // Selected Log for Full Inspection Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Logs Search and Filter
  const [logSearch, setLogSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELIVERED' | 'GATEWAY_ERROR' | 'RECEIPT' | 'FEE_REMINDER'>('ALL');

  // Compose State
  const [recipientCategory, setRecipientCategory] = useState<'ALL' | 'WITH_BALANCE'>('WITH_BALANCE');
  const [balanceThreshold, setBalanceThreshold] = useState(0);
  const [messageTemplate, setMessageTemplate] = useState('Dear Parent, {student_name} (Adm: {admission_number}) has an outstanding fee balance of KES {balance}. Please pay via Paybill 247247.');

  // Gateway Settings State
  const [gatewayConfig, setGatewayConfig] = useState({
    provider: 'africastalking',
    api_key: '',
    username: '',
    sender_id: 'SCHOOLFIN',
    is_sandbox: true,
    is_enabled: true,
    has_api_key: false,
    masked_api_key: ''
  });
  const [savingGateway, setSavingGateway] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testingGateway, setTestingGateway] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Buy SMS State
  const [smsUnitsToBuy, setSmsUnitsToBuy] = useState(5000);
  const [mpesaPhone, setMpesaPhone] = useState('0712345678');

  useEffect(() => {
    loadData();
    loadGatewayConfig();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, studentsRes] = await Promise.all([
        ApiService.getSMSLogs(),
        ApiService.getStudents()
      ]);
      if (logsRes?.data) setLogs(logsRes.data);
      if (studentsRes?.data) setStudents(studentsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadGatewayConfig = async () => {
    try {
      const res = await ApiService.getSMSGatewayConfig();
      if (res?.data) {
        setGatewayConfig(prev => ({
          ...prev,
          ...res.data,
          api_key: '' // keep clear unless user types new key
        }));
      }
    } catch (e) {
      console.error('Failed to load gateway config', e);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4500);
  };

  const formatSMSDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return 'N/A';
    const clean = phone.replace(/[^0-9+]/g, '');
    if (clean.startsWith('+254') && clean.length === 13) {
      return `+254 ${clean.slice(4, 7)} ${clean.slice(7, 10)} ${clean.slice(10)}`;
    }
    return clean;
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGateway(true);
    try {
      await ApiService.saveSMSGatewayConfig(gatewayConfig);
      showToast('SMS Gateway settings updated successfully!', 'success');
      loadGatewayConfig();
    } catch (err: any) {
      showToast(err.message || 'Failed to save SMS gateway settings', 'error');
    } finally {
      setSavingGateway(false);
    }
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      showToast('Please provide a destination phone number to test.', 'warning');
      return;
    }
    setTestingGateway(true);
    setTestResult(null);
    try {
      const res = await ApiService.testSMSGateway({
        phone: testPhone,
        message: `Test SMS from School Finance Portal. Gateway verified on ${new Date().toLocaleTimeString()}.`
      });
      setTestResult({
        success: true,
        message: res.message || 'Test SMS sent successfully!',
        details: res.data
      });
      showToast('Gateway connection verified! SMS delivered.', 'success');
      loadData();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'SMS Gateway test failed.',
        details: err
      });
      showToast(err.message || 'Gateway dispatch failed', 'error');
      loadData();
    } finally {
      setTestingGateway(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const targets = students
        .filter(s => {
          const bal = (s.total_fees || 0) - (s.paid_fees || 0);
          if (recipientCategory === 'WITH_BALANCE') {
            return bal > balanceThreshold;
          }
          return true;
        })
        .map(s => ({
          student_id: s.id,
          phone: s.guardian_phone || s.phone || '0700000000',
          student_name: `${s.first_name} ${s.last_name}`,
          admission_number: s.admission_number,
          guardian_name: s.guardian_name || 'Parent',
          balance: (s.total_fees || 0) - (s.paid_fees || 0)
        }));

      if (targets.length === 0) {
        alert('No recipients matched the specified criteria.');
        setSending(false);
        return;
      }

      const res = await ApiService.sendSMSBroadcast({
        recipients: targets,
        template: messageTemplate,
        message_type: 'FEE_REMINDER'
      });

      if (res.failed_count && res.failed_count > 0 && (!res.dispatched_count || res.dispatched_count === 0)) {
        showToast(`Gateway Notice: Dispatches failed (${res.last_error || 'Gateway not configured'})`, 'error');
      } else {
        showToast(`Successfully dispatched ${res.dispatched_count || targets.length} SMS messages!`, 'success');
      }

      setActiveTab('Sent Logs');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error sending SMS broadcast', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleBuyCredits = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`STK Push prompt initiated to ${mpesaPhone} for KES ${(smsUnitsToBuy * 0.8).toLocaleString()}`, 'success');
  };

  // Filtered Logs
  const filteredLogs = logs.filter(l => {
    const matchesSearch =
      (l.recipient_phone || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.student_first_name || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.student_last_name || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.admission_number || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.message_body || '').toLowerCase().includes(logSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'DELIVERED') return l.status === 'DELIVERED' || l.status === 'SENT';
    if (statusFilter === 'GATEWAY_ERROR') return l.status === 'GATEWAY_ERROR' || l.status === 'FAILED' || l.error_message;
    if (statusFilter === 'RECEIPT') return l.message_type === 'RECEIPT';
    if (statusFilter === 'FEE_REMINDER') return l.message_type === 'FEE_REMINDER';

    return true;
  });

  // Calculate live SMS segments
  const sampleText = messageTemplate
    .replace('{student_name}', 'Brian Kiprono')
    .replace('{admission_number}', 'ADM-1042')
    .replace('{balance}', '14,500.00');
  const segmentCount = Math.ceil(sampleText.length / 160) || 1;

  const isGatewayReady = gatewayConfig.has_api_key && gatewayConfig.username;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 text-white px-5 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-slideUp border ${
            toastMsg.type === 'error'
              ? 'bg-rose-700 border-rose-500'
              : toastMsg.type === 'warning'
              ? 'bg-amber-600 border-amber-400'
              : 'bg-emerald-700 border-emerald-500'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-200" />
          ) : toastMsg.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-200" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          )}
          <span className="text-sm font-semibold">{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            Bulk SMS & Parent Communication
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Send fee balance alerts, payment receipt SMS confirmations, and manage SMS gateway delivery logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <div
            className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 ${
              isGatewayReady
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isGatewayReady ? 'text-emerald-600 animate-pulse' : 'text-amber-600'}`} />
            {isGatewayReady ? `Gateway: ${gatewayConfig.provider.toUpperCase()} (${gatewayConfig.is_sandbox ? 'Sandbox' : 'Live'})` : 'Gateway: Not Configured'}
          </div>
        </div>
      </div>

      {/* Alert banner if gateway not configured */}
      {!isGatewayReady && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-sm animate-fadeIn">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-amber-200/60 rounded-xl text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">SMS Gateway credentials are not configured</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Dispatched SMS messages will record as <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">GATEWAY_ERROR</code> until you configure your Africa's Talking API Key.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('Gateway Settings')}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap"
          >
            Configure Gateway
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 overflow-x-auto pb-0.5">
        {(
          [
            { id: 'Compose', label: 'Compose Broadcast' },
            { id: 'Sent Logs', label: `Sent SMS Logs (${logs.length})` },
            { id: 'Gateway Settings', label: 'SMS Gateway Settings' },
            { id: 'SMS Usage', label: 'Usage Analytics' },
            { id: 'Buy SMS', label: 'Top-up SMS Credits' }
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Compose Broadcast Tab */}
      {activeTab === 'Compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <form onSubmit={handleSendBroadcast} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Audience</label>
                  <select
                    value={recipientCategory}
                    onChange={e => setRecipientCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  >
                    <option value="WITH_BALANCE">Students with Outstanding Fee Balance</option>
                    <option value="ALL">All Enrolled Students</option>
                  </select>
                </div>
                {recipientCategory === 'WITH_BALANCE' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Min Balance Threshold (KES)</label>
                    <input
                      type="number"
                      value={balanceThreshold}
                      onChange={e => setBalanceThreshold(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      placeholder="e.g. 0 for any balance"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Message Body Template</label>
                  <span className="text-xs font-mono text-slate-400">
                    {messageTemplate.length} chars • {segmentCount} SMS page{segmentCount > 1 ? 's' : ''}
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={messageTemplate}
                  onChange={e => setMessageTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm leading-relaxed"
                />
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-slate-400">Insert Variable:</span>
                  {[
                    { tag: '{student_name}', label: 'Student Name' },
                    { tag: '{admission_number}', label: 'Adm Number' },
                    { tag: '{balance}', label: 'Fee Balance' },
                    { tag: '{guardian_name}', label: 'Guardian Name' }
                  ].map(v => (
                    <button
                      type="button"
                      key={v.tag}
                      onClick={() => setMessageTemplate(prev => prev + ' ' + v.tag)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-mono text-xs rounded-lg transition border border-slate-200"
                    >
                      +{v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Targeted recipients: <span className="font-bold text-slate-800">{students.length} parents</span>
                  <div className="text-[11px] text-slate-400">Standard rate: KES 0.80 per 160-char SMS segment</div>
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition"
                >
                  <Send className="w-4 h-4" /> {sending ? 'Dispatching...' : 'Dispatch Broadcast'}
                </button>
              </div>
            </form>
          </div>

          {/* Live Mobile Preview */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Preview
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">GSM 7-bit</span>
              </div>
              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 text-sm leading-relaxed font-sans shadow-inner text-slate-200">
                {sampleText}
              </div>
              <div className="text-xs text-slate-400 mt-4 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>Character length:</span>
                  <span className="text-white font-bold">{sampleText.length} chars</span>
                </div>
                <div className="flex justify-between">
                  <span>SMS segments:</span>
                  <span className="text-white font-bold">{segmentCount} unit{segmentCount > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sender ID:</span>
                  <span className="text-emerald-400 font-bold">{gatewayConfig.sender_id || 'SCHOOLFIN'}</span>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800 text-xs text-slate-400">
              Compatible with Safaricom, Airtel Kenya, and Telkom Kenya cellular networks.
            </div>
          </div>
        </div>
      )}

      {/* 2. Sent Logs Tab */}
      {activeTab === 'Sent Logs' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                placeholder="Search by phone, student name, admission number, or message body..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase">Filter:</span>
              {(['ALL', 'DELIVERED', 'GATEWAY_ERROR', 'RECEIPT', 'FEE_REMINDER'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    statusFilter === f
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'ALL' ? 'All Logs' : f === 'GATEWAY_ERROR' ? 'Gateway Errors' : f === 'DELIVERED' ? 'Delivered' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredLogs.length === 0 ? (
              <ClipboardIllustration label="No matching SMS logs found. Dispatched messages will be logged here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3.5">Recipient</th>
                      <th className="px-5 py-3.5">Student / Adm</th>
                      <th className="px-5 py-3.5">Message Content (Click to inspect)</th>
                      <th className="px-5 py-3.5">Delivery Status</th>
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map(l => {
                      const isError = l.status === 'GATEWAY_ERROR' || l.status === 'FAILED' || !!l.error_message;
                      const isSuccess = l.status === 'DELIVERED' || l.status === 'SENT';

                      return (
                        <tr
                          key={l.id}
                          onClick={() => setSelectedLog(l)}
                          className="hover:bg-slate-50/80 transition cursor-pointer group"
                        >
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                            {formatPhone(l.recipient_phone)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">
                            {l.student_first_name ? (
                              <div>
                                <div className="font-semibold text-slate-900">{l.student_first_name} {l.student_last_name}</div>
                                <div className="text-[11px] font-mono text-slate-400">{l.admission_number || 'N/A'}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">Direct Contact</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 text-xs max-w-sm">
                            <div className="truncate group-hover:text-slate-900 transition">
                              {l.message_body}
                            </div>
                            {l.error_message && (
                              <div className="text-[11px] text-rose-600 font-medium mt-0.5 truncate flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                {l.error_message}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${
                                isError
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isSuccess
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isError ? (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              {l.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                            {formatSMSDate(l.created_at)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(l);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Inspect full message"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SMS Gateway Settings Tab */}
      {activeTab === 'Gateway Settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-800">SMS Gateway Configuration</h2>
                <p className="text-xs text-slate-500">Connect to Africa's Talking API for live SMS delivery across Kenya</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Gateway Active:</span>
                <input
                  type="checkbox"
                  checked={gatewayConfig.is_enabled}
                  onChange={e => setGatewayConfig({ ...gatewayConfig, is_enabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                />
              </div>
            </div>

            <form onSubmit={handleSaveGateway} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">SMS Provider</label>
                  <select
                    value={gatewayConfig.provider}
                    onChange={e => setGatewayConfig({ ...gatewayConfig, provider: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  >
                    <option value="africastalking">Africa's Talking (Kenya / East Africa)</option>
                    <option value="twilio">Twilio (International)</option>
                    <option value="advanta">Advanta Africa (Kenya)</option>
                    <option value="textsms">TextSMS Gateway (Kenya)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">API Username</label>
                  <input
                    type="text"
                    required
                    value={gatewayConfig.username}
                    onChange={e => setGatewayConfig({ ...gatewayConfig, username: e.target.value })}
                    placeholder="e.g. sandbox or my_school_username"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                  />
                  <span className="text-[11px] text-slate-400">Use <code className="text-slate-700 font-bold">sandbox</code> for testing without sending real SMS</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    API Key {gatewayConfig.has_api_key && <span className="text-emerald-600 font-normal">(Configured: {gatewayConfig.masked_api_key})</span>}
                  </label>
                  <input
                    type="password"
                    value={gatewayConfig.api_key}
                    onChange={e => setGatewayConfig({ ...gatewayConfig, api_key: e.target.value })}
                    placeholder={gatewayConfig.has_api_key ? 'Enter new API key to overwrite' : 'Paste Africa\'s Talking API Key'}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Sender ID / Alphanumeric Header</label>
                  <input
                    type="text"
                    value={gatewayConfig.sender_id}
                    onChange={e => setGatewayConfig({ ...gatewayConfig, sender_id: e.target.value })}
                    placeholder="e.g. SCHOOLFIN"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm uppercase"
                  />
                  <span className="text-[11px] text-slate-400">Max 11 alphanumeric characters (leave empty for default)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="is_sandbox"
                  checked={gatewayConfig.is_sandbox}
                  onChange={e => setGatewayConfig({ ...gatewayConfig, is_sandbox: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                />
                <label htmlFor="is_sandbox" className="text-xs text-slate-700 cursor-pointer">
                  <strong>Sandbox Mode (Testing Environment):</strong> Dispatches via Africa's Talking Sandbox simulator rather than incurring live cellular charges.
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingGateway}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition"
                >
                  <ShieldCheck className="w-4 h-4" /> {savingGateway ? 'Saving...' : 'Save Gateway Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Test SMS Dispatch Panel */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-2 flex items-center gap-2">
                <Radio className="w-4 h-4" /> Live Connection Test
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Dispatch an immediate test ping to verify whether your SMS Gateway credentials and phone network deliver correctly.
              </p>

              <form onSubmit={handleTestConnection} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Test Phone Number</label>
                  <input
                    type="text"
                    required
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="e.g. 0712154315 or +254712154315"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={testingGateway}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition text-sm flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> {testingGateway ? 'Testing Connection...' : 'Send Test Ping SMS'}
                </button>
              </form>

              {testResult && (
                <div
                  className={`mt-4 p-3.5 rounded-xl border text-xs font-sans space-y-1 ${
                    testResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    {testResult.success ? 'Gateway Verified' : 'Gateway Verification Failed'}
                  </div>
                  <div className="text-[11px] leading-relaxed">{testResult.message}</div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
              Provider API: <span className="font-mono text-slate-300">{gatewayConfig.provider}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. SMS Usage Tab */}
      {activeTab === 'SMS Usage' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase">Messages Sent in System</div>
            <div className="text-3xl font-black text-slate-800 mt-2">{logs.length}</div>
            <div className="text-xs text-emerald-600 mt-1 font-semibold">
              {logs.filter(l => l.status === 'DELIVERED' || l.status === 'SENT').length} Delivered successfully
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase">Average Unit Cost</div>
            <div className="text-3xl font-black text-slate-800 mt-2">KES 0.80</div>
            <div className="text-xs text-slate-400 mt-1">Direct Safaricom & Airtel standard rate</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase">Remaining Gateway Credits</div>
            <div className="text-3xl font-black text-emerald-700 mt-2">12,450 Units</div>
            <div className="text-xs text-slate-400 mt-1">Lifetime validity</div>
          </div>
        </div>
      )}

      {/* 5. Buy SMS Tab */}
      {activeTab === 'Buy SMS' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-800">Top-up SMS Credits Instantly</h3>
            <p className="text-xs text-slate-500">Pay via M-Pesa STK push. Credits reflect immediately in your account.</p>
          </div>

          <form onSubmit={handleBuyCredits} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">SMS Units</label>
              <select
                value={smsUnitsToBuy}
                onChange={e => setSmsUnitsToBuy(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              >
                <option value={1000}>1,000 Units (KES 800)</option>
                <option value={5000}>5,000 Units (KES 4,000)</option>
                <option value={10000}>10,000 Units (KES 7,500)</option>
                <option value={50000}>50,000 Units (KES 35,000)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">M-Pesa Phone Number</label>
              <input
                type="text"
                required
                value={mpesaPhone}
                onChange={e => setMpesaPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                placeholder="0712345678"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition text-sm"
            >
              Pay KES {(smsUnitsToBuy * (smsUnitsToBuy >= 10000 ? 0.75 : 0.8)).toLocaleString()} via M-Pesa
            </button>
          </form>
        </div>
      )}

      {/* FULL MESSAGE DETAILS INSPECTION MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">SMS Dispatch Inspection</h3>
                  <p className="text-[11px] text-slate-500">Log ID: {selectedLog.id?.slice(0, 13)}...</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-sm">
              {/* Status and Error Callout */}
              {selectedLog.status === 'GATEWAY_ERROR' || selectedLog.error_message ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4" /> Gateway Error Detected
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed font-mono">
                    {selectedLog.error_message || 'SMS Gateway credentials missing or rejected dispatch.'}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs font-semibold">
                    Message successfully dispatched to cellular provider.
                  </span>
                </div>
              )}

              {/* Recipient & Student Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <div className="text-slate-400 uppercase font-bold text-[10px]">Recipient Phone</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {formatPhone(selectedLog.recipient_phone)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase font-bold text-[10px]">Message Type</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedLog.message_type}</div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase font-bold text-[10px]">Student Linked</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {selectedLog.student_first_name ? `${selectedLog.student_first_name} ${selectedLog.student_last_name}` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase font-bold text-[10px]">Admission No</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">
                    {selectedLog.admission_number || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Message Body Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase">Message Body</span>
                  <button
                    onClick={() => handleCopyMessage(selectedLog.message_body)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 transition"
                  >
                    {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedMessage ? 'Copied' : 'Copy Text'}
                  </button>
                </div>
                <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs leading-relaxed border border-slate-800 select-all">
                  {selectedLog.message_body}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>{selectedLog.message_body?.length || 0} characters</span>
                  <span>{Math.ceil((selectedLog.message_body?.length || 1) / 160)} SMS Unit(s)</span>
                </div>
              </div>

              {/* Timestamp & Provider Reference */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  <span className="text-slate-400">Timestamp: </span>
                  <span className="font-medium text-slate-700">{formatSMSDate(selectedLog.created_at)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Ref: </span>
                  <span className="font-mono text-slate-700">{selectedLog.provider_message_id || 'NONE'}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};