import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ApiService } from '../services/api';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  Filter,
  Search,
  Plus,
  ChevronDown,
  X,
  CreditCard,
  DollarSign,
  User,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface PocketMoneyViewProps {
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

export const PocketMoneyView: React.FC<PocketMoneyViewProps> = ({ currentRole }) => {
  const [activeTab, setActiveTab] = useState<'Wallets' | 'Transactions'>('Wallets');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [walletsData, setWalletsData] = useState<any>({
    summary: { total_accounts: 0, total_balance: 0, total_deposits: 0, total_withdrawn: 0 },
    wallets: []
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Forms
  const [depositForm, setDepositForm] = useState({
    student_id: '',
    amount: 1000,
    channel: 'Cash',
    served_by: 'Bursar Desk',
    notes: 'Parent Top-up'
  });

  const [withdrawForm, setWithdrawForm] = useState({
    student_id: '',
    amount: 200,
    channel: 'Cash',
    served_by: 'Canteen Cashier',
    notes: 'Pocket money disbursement'
  });

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [wRes, tRes, sRes] = await Promise.all([
        ApiService.getPocketMoneyWallets(searchTerm),
        ApiService.getPocketMoneyTransactions(),
        ApiService.getStudents()
      ]);
      if (wRes?.data) setWalletsData(wRes.data);
      if (tRes?.data) setTransactions(tRes.data);
      if (sRes?.data) setStudentsList(sRes.data);
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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.recordPocketMoneyTransaction({
        ...depositForm,
        transaction_type: 'DEPOSIT'
      });
      showToast(res.message || 'Deposit recorded successfully');
      setShowDepositModal(false);
      setDepositForm({ student_id: '', amount: 1000, channel: 'Cash', served_by: 'Bursar Desk', notes: 'Parent Top-up' });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording deposit');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.recordPocketMoneyTransaction({
        ...withdrawForm,
        transaction_type: 'WITHDRAWAL'
      });
      showToast(res.message || 'Withdrawal processed successfully');
      setShowWithdrawModal(false);
      setWithdrawForm({ student_id: '', amount: 200, channel: 'Cash', served_by: 'Canteen Cashier', notes: 'Pocket money disbursement' });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error processing withdrawal');
    }
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
              <Wallet className="w-5 h-5" />
            </div>
            Student Pocket Money & Wallets
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage student digital wallets, parent top-ups, daily canteen disbursements, and balance statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
          >
            <ArrowDownLeft className="w-4 h-4" /> Issue Cash / Withdraw
          </button>
          <button
            onClick={() => setShowDepositModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
          >
            <ArrowUpRight className="w-4 h-4" /> Top-up / Deposit
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Wallets</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{walletsData.summary?.total_accounts || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Registered Student Wallets</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Balance Held</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            KES {Number(walletsData.summary?.total_balance || 0).toLocaleString()}
          </div>
          <div className="text-xs text-emerald-600 mt-1">Current Liquid Custody</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Top-ups (Deposits)</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            KES {Number(walletsData.summary?.total_deposits || 0).toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 mt-1">All-time Deposits</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Withdrawals</div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            KES {Number(walletsData.summary?.total_withdrawn || 0).toLocaleString()}
          </div>
          <div className="text-xs text-amber-600 mt-1">Canteen & Cash Outflows</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-8">
        {(['Wallets', 'Transactions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'Wallets' ? 'Student Wallet Balances' : 'Wallet Transactions Ledger'}
          </button>
        ))}
      </div>

      {/* 1. Wallets Tab */}
      {activeTab === 'Wallets' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {walletsData.wallets?.length === 0 ? (
            <ClipboardIllustration label="No students registered yet. Add students in the Students Module to open their pocket money wallets." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Current Balance</th>
                    <th className="px-6 py-4">Total Top-ups</th>
                    <th className="px-6 py-4">Total Spent</th>
                    <th className="px-6 py-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {walletsData.wallets.map((w: any) => (
                    <tr key={w.student_id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{w.student_name}</div>
                        <div className="text-xs text-slate-400">Adm: {w.adm_no}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{w.class_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="font-black text-emerald-700 text-base">
                          KES {Number(w.balance || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">KES {Number(w.total_deposits || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">KES {Number(w.total_withdrawals || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setDepositForm({ ...depositForm, student_id: w.student_id });
                            setShowDepositModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg transition"
                        >
                          Top-up
                        </button>
                        <button
                          onClick={() => {
                            setWithdrawForm({ ...withdrawForm, student_id: w.student_id });
                            setShowWithdrawModal(true);
                          }}
                          className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs rounded-lg transition"
                        >
                          Withdraw
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Transactions Tab */}
      {activeTab === 'Transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <ClipboardIllustration label="No wallet transactions recorded yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Ref No</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Balance After</th>
                    <th className="px-6 py-4">Channel / Served By</th>
                    <th className="px-6 py-4">Notes</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">{t.reference_no}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{t.student_name}</div>
                        <div className="text-xs text-slate-400">Adm: {t.adm_no}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          t.transaction_type === 'DEPOSIT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-black ${
                        t.transaction_type === 'DEPOSIT' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {t.transaction_type === 'DEPOSIT' ? '+' : '-'} KES {Number(t.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">KES {Number(t.balance_after).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <div>{t.channel}</div>
                        <div className="text-xs text-slate-400">{t.served_by}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{t.notes || '-'}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{t.created_at?.split('T')[0] || t.created_at?.substring(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Top-up / Deposit */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-emerald-600" /> Wallet Top-up (Deposit)
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Student *</label>
                <select
                  required
                  value={depositForm.student_id}
                  onChange={e => setDepositForm({ ...depositForm, student_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select Student --</option>
                  {studentsList.map((st: any) => (
                    <option key={st.id} value={st.id}>{st.first_name} {st.last_name} ({st.admission_number}) - {st.class_name || ''}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Deposit Amount (KES) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={depositForm.amount}
                    onChange={e => setDepositForm({ ...depositForm, amount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Payment Method</label>
                  <select
                    value={depositForm.channel}
                    onChange={e => setDepositForm({ ...depositForm, channel: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Cash">Cash at Desk</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notes / Depositor Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Deposited by Father (Mr. Kimani)"
                  value={depositForm.notes}
                  onChange={e => setDepositForm({ ...depositForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Credit Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Withdraw / Issue Cash */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-amber-600" /> Issue Cash / Canteen Disbursement
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Student *</label>
                <select
                  required
                  value={withdrawForm.student_id}
                  onChange={e => setWithdrawForm({ ...withdrawForm, student_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select Student --</option>
                  {studentsList.map((st: any) => (
                    <option key={st.id} value={st.id}>{st.first_name} {st.last_name} ({st.admission_number}) - {st.class_name || ''}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Disbursement Amount (KES) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={withdrawForm.amount}
                    onChange={e => setWithdrawForm({ ...withdrawForm, amount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Issued By / Channel</label>
                  <select
                    value={withdrawForm.served_by}
                    onChange={e => setWithdrawForm({ ...withdrawForm, served_by: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Canteen Cashier">Canteen Cashier</option>
                    <option value="Boarding Master">Boarding Master</option>
                    <option value="Bursar Desk">Bursar Desk</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Purpose / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Weekend Pocket Money / Canteen Snacks"
                  value={withdrawForm.notes}
                  onChange={e => setWithdrawForm({ ...withdrawForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Confirm Cash Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};