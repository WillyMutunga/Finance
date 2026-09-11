import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ApiService } from '../services/api';
import {
  MessageSquare,
  Send,
  Printer,
  FileSpreadsheet,
  Filter,
  Search,
  ShoppingCart,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Clock,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Mail,
  UserCheck
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
  const [activeTab, setActiveTab] = useState<'Compose' | 'Sent Logs' | 'SMS Usage' | 'Buy SMS'>('Compose');
  const [logs, setLogs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Compose State
  const [recipientCategory, setRecipientCategory] = useState<'ALL' | 'WITH_BALANCE'>('WITH_BALANCE');
  const [balanceThreshold, setBalanceThreshold] = useState(0);
  const [messageTemplate, setMessageTemplate] = useState('Dear Parent, {student_name} (Adm: {admission_number}) has an outstanding fee balance of KES {balance}. Please pay via Paybill 247247.');
  const [includePayInstructions, setIncludePayInstructions] = useState(true);

  // Buy SMS State
  const [smsUnitsToBuy, setSmsUnitsToBuy] = useState(5000);
  const [mpesaPhone, setMpesaPhone] = useState('0712345678');

  useEffect(() => {
    loadData();
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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // Filter recipients
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
          phone: s.guardian_phone || s.phone || '254700000000',
          student_name: `${s.first_name} ${s.last_name}`,
          admission_number: s.admission_number,
          balance: (s.total_fees || 0) - (s.paid_fees || 0)
        }));

      if (targets.length === 0) {
        alert('No recipients matched the specified criteria.');
        setSending(false);
        return;
      }

      await ApiService.sendSMSBroadcast({
        recipients: targets,
        template: messageTemplate,
        message_type: 'FEE_REMINDER'
      });

      showToast(`Successfully dispatched ${targets.length} SMS messages!`);
      setActiveTab('Sent Logs');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error sending SMS broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleBuyCredits = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`STK Push prompt initiated to ${mpesaPhone} for KES ${(smsUnitsToBuy * 0.8).toLocaleString()}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-semibold">{toastMsg}</span>
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
            Send fee reminder broadcasts, payment receipts, attendance alerts, and track delivery logs
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
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" /> SMS Balance: 12,450 Units
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-8">
        {(['Compose', 'Sent Logs', 'SMS Usage', 'Buy SMS'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'Compose' ? 'Compose Broadcast' : tab === 'Sent Logs' ? 'Sent SMS Logs' : tab === 'SMS Usage' ? 'Usage & Delivery Analytics' : 'Top-up SMS Credits'}
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
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="WITH_BALANCE">Students with Fee Balance</option>
                    <option value="ALL">All Enrolled Students</option>
                  </select>
                </div>
                {recipientCategory === 'WITH_BALANCE' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Balance Threshold (KES)</label>
                    <input
                      type="number"
                      value={balanceThreshold}
                      onChange={e => setBalanceThreshold(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. 0 for any balance"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Message Template</label>
                <textarea
                  rows={4}
                  required
                  value={messageTemplate}
                  onChange={e => setMessageTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm leading-relaxed"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {['{student_name}', '{admission_number}', '{balance}'].map(tag => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setMessageTemplate(prev => prev + ' ' + tag)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs rounded-lg transition"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Estimated recipients: <span className="font-bold text-slate-800">{students.length} parents</span>
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition"
                >
                  <Send className="w-4 h-4" /> {sending ? 'Dispatching...' : 'Dispatch Broadcast'}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Card */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Live Mobile Preview
              </div>
              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 text-sm leading-relaxed font-sans shadow-inner">
                {messageTemplate
                  .replace('{student_name}', 'Brian Kiprono')
                  .replace('{admission_number}', 'ADM-1042')
                  .replace('{balance}', '14,500.00')}
              </div>
              <div className="text-xs text-slate-400 mt-4 space-y-1">
                <div>• Character count: {messageTemplate.length} chars (1 SMS Page)</div>
                <div>• Sender ID: <span className="text-white font-bold">SCHOOLFIN</span></div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800 text-xs text-slate-500">
              Integrated with Safaricom & Airtel Kenya SMS Gateways.
            </div>
          </div>
        </div>
      )}

      {/* 2. Sent Logs Tab */}
      {activeTab === 'Sent Logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {logs.length === 0 ? (
            <ClipboardIllustration label="No SMS logs recorded yet. Send your first broadcast from the Compose tab." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Recipient Phone</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Message Body</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">{l.recipient_phone}</td>
                      <td className="px-6 py-4 text-slate-700 font-semibold">
                        {l.student_first_name ? `${l.student_first_name} ${l.student_last_name}` : 'Parent Contact'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs max-w-md truncate">{l.message_body}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          l.status === 'SENT' || l.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{l.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. SMS Usage Tab */}
      {activeTab === 'SMS Usage' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase">Messages Sent This Month</div>
            <div className="text-3xl font-black text-slate-800 mt-2">{logs.length}</div>
            <div className="text-xs text-emerald-600 mt-1">100% Delivery Success Rate</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase">Average Unit Cost</div>
            <div className="text-3xl font-black text-slate-800 mt-2">KES 0.80</div>
            <div className="text-xs text-slate-400 mt-1">Safaricom & Airtel Standard Rate</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase">Remaining Credits</div>
            <div className="text-3xl font-black text-emerald-700 mt-2">12,450 Units</div>
            <div className="text-xs text-slate-400 mt-1">Valid for lifetime</div>
          </div>
        </div>
      )}

      {/* 4. Buy SMS Tab */}
      {activeTab === 'Buy SMS' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-800">Top-up SMS Credits Instantly</h3>
            <p className="text-xs text-slate-500">Pay via M-Pesa STK push. Credits reflect immediately.</p>
          </div>

          <form onSubmit={handleBuyCredits} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">SMS Units</label>
              <select
                value={smsUnitsToBuy}
                onChange={e => setSmsUnitsToBuy(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                placeholder="0712345678"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition"
            >
              Pay KES {(smsUnitsToBuy * (smsUnitsToBuy >= 10000 ? 0.75 : 0.8)).toLocaleString()} via M-Pesa
            </button>
          </form>
        </div>
      )}
    </div>
  );
};