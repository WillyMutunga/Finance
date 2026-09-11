import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { PaymentTransaction, ReconciliationMatch, Student, UserRole } from '../types';
import {
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Phone,
  User,
  ArrowRight,
  Search,
  X,
  ShieldAlert,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

interface ReconciliationViewProps {
  currentRole: UserRole;
  onRefreshBadge?: () => void;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({ currentRole, onRefreshBadge }) => {
  const [exceptions, setExceptions] = useState<PaymentTransaction[]>([]);
  const [matchesLog, setMatchesLog] = useState<ReconciliationMatch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoReconciling, setAutoReconciling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Manual Resolver Modal
  const [selectedException, setSelectedException] = useState<PaymentTransaction | null>(null);
  const [targetStudentId, setTargetStudentId] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resEx, resLog, resStud] = await Promise.all([
        ApiService.getReconExceptions(),
        ApiService.getReconciliationMatches(),
        ApiService.getStudents()
      ]);
      if (resEx && resEx.data) setExceptions(resEx.data);
      if (resLog && resLog.data) setMatchesLog(resLog.data);
      if (resStud && resStud.data) setStudents(resStud.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAutoRecon = async () => {
    setAutoReconciling(true);
    setStatusMessage(null);
    try {
      const res = await ApiService.triggerAutoReconcile();
      if (res && res.status === 'success') {
        setStatusMessage(res.message || 'Automated reconciliation completed!');
        loadData();
        if (onRefreshBadge) onRefreshBadge();
      }
    } catch (e: any) {
      setStatusMessage(e.message || 'Failed to complete auto-reconciliation.');
    } finally {
      setAutoReconciling(false);
    }
  };

  const handleManualResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedException || !targetStudentId) return;

    setResolving(true);
    try {
      await ApiService.manualResolveException(
        selectedException.id,
        targetStudentId,
        resolveNotes || 'Manual Bursar Allocation'
      );
      setSelectedException(null);
      setTargetStudentId('');
      setResolveNotes('');
      loadData();
      if (onRefreshBadge) onRefreshBadge();
    } catch (e: any) {
      alert(e.message || 'Error resolving exception.');
    } finally {
      setResolving(false);
    }
  };

  const formatCurrency = (amt: number) => {
    return 'KES ' + Number(amt || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Header & Auto-Reconcile Action */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-sky-900/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Automated M-Pesa & Bank Matching Engine
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Reconciliation Operations & Exceptions</h2>
          <p className="text-sky-200/80 text-xs mt-1 max-w-xl">
            Multi-tier confidence matching (Exact Admission No $\rightarrow$ Guardian Phone $\rightarrow$ Fuzzy Ref). Unmatched transactions are isolated in the exceptions queue for auditable manual allocation.
          </p>
        </div>

        {currentRole !== 'auditor' && (
          <button
            disabled={autoReconciling}
            onClick={handleRunAutoRecon}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${autoReconciling ? 'animate-spin' : ''}`} />
            <span>{autoReconciling ? 'Matching Transactions...' : 'Run Automated Matching Engine'}</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Exceptions Queue Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Unmatched & Ambiguous Exceptions Queue</h3>
              <p className="text-xs text-slate-500">Inbound transactions awaiting manual bursar verification and ledger allocation</p>
            </div>
          </div>
          <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1 rounded-full">
            {exceptions.length} Pending
          </span>
        </div>

        {exceptions.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-slate-800 text-sm">Exceptions Queue is Clean!</div>
            <p className="text-xs text-slate-500 mt-0.5">All mobile money and bank feed transactions have been reconciled into ledger accounts.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Channel / Date</th>
                  <th className="p-3">Reference No</th>
                  <th className="p-3">Payer Details</th>
                  <th className="p-3">Raw Account Reference</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Status</th>
                  {currentRole !== 'auditor' && <th className="p-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exceptions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <span className="font-bold text-slate-800">{ex.channel}</span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(ex.payment_date).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-sky-900">{ex.reference_number}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{ex.payer_name || 'Anonymous Payer'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{ex.payer_phone || '-'}</div>
                    </td>
                    <td className="p-3 font-mono bg-slate-50 px-2 py-1 rounded text-slate-700">
                      {ex.account_reference || 'EMPTY_REF'}
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900">{formatCurrency(ex.amount)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {ex.reconciliation_status}
                      </span>
                    </td>
                    {currentRole !== 'auditor' && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedException(ex)}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs shadow-sm"
                        >
                          Allocate Student
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reconciliation Matches Audit Trail (Section 6a) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Reconciliation Audit Trail & Decision Logs</h3>
              <p className="text-xs text-slate-500">Documented rule matching evidence and receipt references for financial auditors</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Total Matched: {matchesLog.length}</span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Payment Ref</th>
                <th className="p-3">Matched Student</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Match Strategy Rule</th>
                <th className="p-3 text-center">Confidence</th>
                <th className="p-3 text-center">Receipt Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matchesLog.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-500 font-mono text-[10px]">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800">
                    <div>{m.reference_number}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{m.payer_name}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{m.first_name} {m.last_name}</div>
                    <div className="text-[10px] font-mono text-sky-800">Adm: {m.admission_number}</div>
                  </td>
                  <td className="p-3 text-right font-extrabold text-emerald-600">{formatCurrency(m.amount)}</td>
                  <td className="p-3">
                    <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold">
                      {m.match_strategy}
                    </span>
                    {m.match_notes && (
                      <div className="text-[10px] text-slate-500 mt-1 max-w-xs">{m.match_notes}</div>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {m.confidence_score}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-sky-700">
                    {m.receipt_number || 'AUTO-ISSUED'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Resolution Modal */}
      {selectedException && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Manual Transaction Allocation</h3>
                <p className="text-xs text-slate-500">Assign transaction {selectedException.reference_number} to a student fee account</p>
              </div>
              <button onClick={() => setSelectedException(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualResolveSubmit} className="space-y-4 mt-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Payment Amount:</span>
                  <span className="font-extrabold text-emerald-600">{formatCurrency(selectedException.amount)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Payer Name:</span>
                  <span className="font-medium text-slate-800">{selectedException.payer_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Raw Ref Entered:</span>
                  <span className="font-mono text-sky-800">{selectedException.account_reference || 'N/A'}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Destination Student Account *</label>
                <select
                  required
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.admission_number}) - {s.class_name} [Bal: {formatCurrency(s.balance)}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Auditor Reconciliation Notes *</label>
                <textarea
                  required
                  placeholder="Explain why this transaction is being assigned to this student (e.g. Parent confirmed via WhatsApp receipt screenshot)"
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800 h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedException(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {resolving ? 'Allocating & Issuing Receipt...' : 'Confirm Match & Credit Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
