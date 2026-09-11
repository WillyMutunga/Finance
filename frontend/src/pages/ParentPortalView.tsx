import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ReceiptModal } from '../components/ReceiptModal';
import { FeeStatementModal } from '../components/FeeStatementModal';
import { Search, FileText } from 'lucide-react';
import {
  Smartphone,
  CreditCard,
  Receipt,
  CalendarHeart,
  CheckCircle2,
  Phone,
  ShieldCheck,
  RefreshCw,
  Users,
  Printer,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const ParentPortalView: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [admSearch, setAdmSearch] = useState('');
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // M-Pesa STK Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPhone, setPayPhone] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [stkSuccessMessage, setStkSuccessMessage] = useState<string | null>(null);

  // Pledge Modal
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [pledgeDate, setPledgeDate] = useState('');
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [pledgeNotes, setPledgeNotes] = useState('');

  useEffect(() => {
    initPortal();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadParentData(selectedStudentId);
    }
  }, [selectedStudentId]);

  const initPortal = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getStudents();
      if (res && res.data && res.data.length > 0) {
        setStudents(res.data);
        setSelectedStudentId(res.data[0].id);
      } else {
        setStudents([]);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleSearchAdm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admSearch.trim()) return;
    setLoading(true);
    try {
      const res = await ApiService.getParentStudentSummary(admSearch.trim());
      if (res && res.data && res.data.student) {
        setProfile(res.data);
        setSelectedStudentId(res.data.student.id);
      } else {
        alert('No student found with admission number ' + admSearch);
      }
    } catch (e: any) {
      alert(e.message || 'Student not found');
    } finally {
      setLoading(false);
    }
  };

  const loadParentData = async (studId: string) => {
    setLoading(true);
    try {
      const res = await ApiService.getParentStudentSummary(studId);
      if (res && res.data) {
        setProfile(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSTK = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setPaying(true);
    setStkSuccessMessage(null);
    try {
      const res = await ApiService.payMpesaSTK(
        selectedStudentId,
        payPhone,
        parseFloat(payAmount)
      );
      if (res && res.data) {
        setStkSuccessMessage(
          `STK Push prompted on ${payPhone}! Payment of KES ${Number(payAmount).toLocaleString()} confirmed and fee account credited.`
        );
        setShowPayModal(false);
        loadParentData(selectedStudentId);
      }
    } catch (e: any) {
      alert(e.message || 'Error triggering STK Push.');
    } finally {
      setPaying(false);
    }
  };

  const handleMakePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      await ApiService.createPledge({
        student_id: selectedStudentId,
        amount: parseFloat(pledgeAmount),
        expected_payment_date: pledgeDate,
        notes: pledgeNotes
      });
      setShowPledgeModal(false);
      setPledgeAmount('');
      setPledgeDate('');
      setPledgeNotes('');
      loadParentData(selectedStudentId);
    } catch (e: any) {
      alert(e.message || 'Error creating pledge.');
    }
  };

  const formatCurrency = (amt: number) => {
    return 'KES ' + Number(amt || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading Parent Portal...</span>
      </div>
    );
  }

  if (!loading && students.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center space-y-4 my-8">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <Smartphone className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-lg">Parent Portal Ready</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          No student records found in the database. Please admit students first from the Students view to access their live fee statements and M-Pesa paybill.
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <span>No profile loaded.</span>
      </div>
    );
  }

  const student = profile.student;
  const balance = profile.balance;
  const receipts = profile.receipts || [];
  const statement = profile.statement || [];
  const pledges = profile.pledges || [];

  return (
    <div className="max-w-md mx-auto space-y-5 pb-10">
      {/* Admission Number Lookup Bar */}
      <form onSubmit={handleSearchAdm} className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Enter Adm No (e.g. 4000, 4001, 4002)..."
            value={admSearch}
            onChange={(e) => setAdmSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <button
          type="submit"
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
        >
          Lookup
        </button>
      </form>

      {/* Mobile Header Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {student.school_name}
            </span>
          </div>
          <span className="bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-sky-400/30">
            Paybill: {student.mpesa_paybill}
          </span>
        </div>

        {/* Sibling Switcher Tabs */}
        {profile.siblings && profile.siblings.length > 0 && (
          <div className="bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 mb-4 flex gap-1">
            <button
              onClick={() => setSelectedStudentId(student.id)}
              className="flex-1 py-1.5 text-center text-xs font-bold rounded-xl bg-sky-600 text-white shadow-sm"
            >
              {student.first_name} ({student.class_name})
            </button>
            {profile.siblings.map((sib: any) => (
              <button
                key={sib.id}
                onClick={() => setSelectedStudentId(sib.id)}
                className="flex-1 py-1.5 text-center text-xs font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50"
              >
                {sib.first_name} ({sib.class_name})
              </button>
            ))}
          </div>
        )}

        {/* Student Name & Adm */}
        <div className="mb-4">
          <div className="text-xs text-slate-400">Student Account</div>
          <h2 className="text-xl font-extrabold text-white">{student.first_name} {student.last_name}</h2>
          <div className="text-xs text-sky-300 font-mono">Admission No: {student.admission_number} • {student.class_name}</div>
        </div>

        {/* Fee Balance Big Display */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-4 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Outstanding Fee Balance</span>
            <span className="font-semibold text-slate-300">Term 1 2026</span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(balance.current_balance)}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-700/60 text-xs">
            <div>
              <div className="text-[10px] text-slate-400">Total Invoiced</div>
              <div className="font-bold text-slate-200">{formatCurrency(balance.total_billed)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Total Paid</div>
              <div className="font-bold text-emerald-400">{formatCurrency(balance.total_paid)}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => setShowPayModal(true)}
            className="py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Smartphone className="w-4 h-4" />
            <span>Pay via M-Pesa</span>
          </button>
          <button
            onClick={() => setShowPledgeModal(true)}
            className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <CalendarHeart className="w-4 h-4 text-amber-400" />
            <span>Promise Pledge</span>
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setShowStatementModal(true)}
            className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>View Full Financial Statement</span>
          </button>
        </div>
      </div>

      {stkSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-start gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Payment Confirmed!</div>
            <div>{stkSuccessMessage}</div>
          </div>
          <button onClick={() => setStkSuccessMessage(null)} className="text-emerald-700 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Payment Receipts History */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-sky-600" />
            <span>Official Receipts Issued</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">{receipts.length} Receipts</span>
        </div>

        {receipts.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-xs">No receipts recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {receipts.map((r: any) => (
              <div key={r.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-slate-900 text-xs">{r.receipt_number}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(r.date).toLocaleDateString()} • Ref: {r.reference_code}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-emerald-600 text-xs">
                    +{formatCurrency(r.amount)}
                  </div>
                  <button
                    onClick={() => setActiveReceipt({
                      ...r,
                      student_name: `${student.first_name} ${student.last_name}`,
                      student_admission_number: student.admission_number,
                      class_name: student.class_name
                    })}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200"
                  >
                    <Receipt className="w-3 h-3 text-emerald-600" />
                    <span>Official Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* M-Pesa STK Push Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Lipa Na M-Pesa Online</h3>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriggerSTK} className="space-y-4 mt-4 text-xs">
              <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 text-sky-900">
                <div className="font-bold">Instant Reconciliation:</div>
                <p className="text-[11px] text-sky-800/80 mt-0.5">
                  An M-Pesa PIN prompt will appear on your phone. Fee balance will update in real-time.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">M-Pesa Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0720123456"
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Amount to Pay (KES) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{paying ? 'Prompting Phone...' : 'Send STK Prompt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pledge Promise Modal */}
      {showPledgeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Make a Payment Promise</h3>
              <button onClick={() => setShowPledgeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMakePledge} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Amount You Promise to Pay (KES) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 15000"
                  value={pledgeAmount}
                  onChange={(e) => setPledgeAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Expected Payment Date *</label>
                <input
                  type="date"
                  required
                  value={pledgeDate}
                  onChange={(e) => setPledgeDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Note to School Bursar (Optional)</label>
                <textarea
                  placeholder="e.g. Will pay immediately upon salary disbursement at end of month"
                  value={pledgeNotes}
                  onChange={(e) => setPledgeNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPledgeModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold shadow-md shadow-sky-600/20"
                >
                  Submit Pledge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    {/* Official Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
        schoolName={student.school_name || "MOI FORCES ACADEMY"}
      />

      {/* Fee Statement Modal */}
      {showStatementModal && (
        <FeeStatementModal
          studentId={student?.id || selectedStudentId}
          onClose={() => setShowStatementModal(false)}
          schoolName={student?.school_name || "MOI FORCES ACADEMY"}
        />
      )}
    </div>
  );
};
