import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { Pledge, Student, UserRole } from '../types';
import {
  CalendarHeart,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Phone,
  AlertCircle,
  X,
  Smartphone
} from 'lucide-react';

interface PledgesViewProps {
  currentRole: UserRole;
}

export const PledgesView: React.FC<PledgesViewProps> = ({ currentRole }) => {
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [smsAlert, setSmsAlert] = useState<string | null>(null);

  // New Pledge Modal
  const [showModal, setShowModal] = useState(false);
  const [newPledge, setNewPledge] = useState({
    student_id: '',
    amount: '',
    expected_payment_date: '',
    notes: ''
  });

  useEffect(() => {
    loadPledges();
  }, []);

  const loadPledges = async () => {
    setLoading(true);
    try {
      const [resPlg, resStud] = await Promise.all([
        ApiService.getPledges(),
        ApiService.getStudents()
      ]);
      if (resPlg && resPlg.data) setPledges(resPlg.data);
      if (resStud && resStud.data) setStudents(resStud.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createPledge({
        ...newPledge,
        amount: parseFloat(newPledge.amount)
      });
      setShowModal(false);
      setNewPledge({
        student_id: '',
        amount: '',
        expected_payment_date: '',
        notes: ''
      });
      loadPledges();
    } catch (e: any) {
      alert(e.message || 'Error recording pledge');
    }
  };

  const handleSendReminder = async (id: string) => {
    setSendingId(id);
    setSmsAlert(null);
    try {
      const res = await ApiService.sendPledgeReminder(id);
      if (res && res.message) {
        setSmsAlert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Error dispatching SMS reminder.');
    } finally {
      setSendingId(null);
    }
  };

  const formatCurrency = (amt: number) => {
    return 'KES ' + Number(amt || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Parent Pledges & Promissory Notes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track parent commitments to pay by specific due dates and trigger automated bulk SMS follow-ups.
          </p>
        </div>

        {currentRole !== 'auditor' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Pledge</span>
          </button>
        )}
      </div>

      {smsAlert && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{smsAlert}</span>
          </div>
          <button onClick={() => setSmsAlert(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Pledges Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Guardian Contact</th>
                <th className="p-3.5 text-right">Promised Amount</th>
                <th className="p-3.5">Expected Due Date</th>
                <th className="p-3.5">Notes / Parent Promise</th>
                <th className="p-3.5 text-center">Status</th>
                {currentRole !== 'auditor' && <th className="p-3.5 text-center">SMS Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pledges.map((p) => {
                const isOverdue = new Date(p.expected_payment_date) < new Date() && p.status === 'PENDING';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{p.first_name} {p.last_name}</div>
                      <div className="text-[10px] font-mono text-sky-800">{p.admission_number} ({p.class_name})</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{p.guardian_name || 'Guardian'}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{p.guardian_phone || '-'}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-amber-600">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-3.5">
                      <div className={`font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                        {new Date(p.expected_payment_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {isOverdue && (
                        <div className="text-[10px] text-rose-500 font-bold uppercase">Overdue</div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs">{p.notes || 'No notes'}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'FULFILLED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOverdue
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isOverdue ? 'OVERDUE' : p.status}
                      </span>
                    </td>
                    {currentRole !== 'auditor' && (
                      <td className="p-3.5 text-center">
                        <button
                          disabled={sendingId === p.id}
                          onClick={() => handleSendReminder(p.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Send className="w-3 h-3 text-sky-400" />
                          <span>{sendingId === p.id ? 'Sending...' : 'Send SMS Reminder'}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Pledge Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Record Parent Fee Pledge</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePledge} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Student *</label>
                <select
                  required
                  value={newPledge.student_id}
                  onChange={(e) => setNewPledge({ ...newPledge, student_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.admission_number}) - {s.class_name} [Bal: {formatCurrency(s.balance)}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pledged Amount (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 15000"
                    value={newPledge.amount}
                    onChange={(e) => setNewPledge({ ...newPledge, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Promised Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={newPledge.expected_payment_date}
                    onChange={(e) => setNewPledge({ ...newPledge, expected_payment_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Parent Explanation / Promise Notes</label>
                <textarea
                  placeholder="e.g. Parent promised to clear balance from end-of-month salary / harvest proceeds..."
                  value={newPledge.notes}
                  onChange={(e) => setNewPledge({ ...newPledge, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold shadow-md shadow-sky-600/20"
                >
                  Save Pledge & Schedule Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
