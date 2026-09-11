import React, { useState } from 'react';
import { X, Smartphone, CheckCircle2, AlertCircle, RefreshCw, Send, ArrowRight } from 'lucide-react';
import { ApiService } from '../services/api';

interface MpesaSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  onPaymentSuccess?: (res: any) => void;
}

export const MpesaSimulatorModal: React.FC<MpesaSimulatorModalProps> = ({
  isOpen,
  onClose,
  students,
  onPaymentSuccess
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [amount, setAmount] = useState('10000');
  const [phone, setPhone] = useState('+254712345678');
  const [payerName, setPayerName] = useState('Jane Wambui');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const adm = currentStudent ? currentStudent.admission_number : '4000';

    try {
      const res = await ApiService.simulateMpesaC2B({
        account_reference: adm,
        amount: Number(amount),
        phone,
        payer_name: payerName,
        trans_id: 'QHD' + Math.floor(100000 + Math.random() * 900000)
      });

      if (res && (res.ResultCode === 0 || (res as any).status === 'success')) {
        setResult(res);
        if (onPaymentSuccess) {
          onPaymentSuccess(res);
        }
      } else {
        setError((res as any)?.message || 'Payment simulation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Simulation error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">M-Pesa Gateway Simulator</h3>
              <p className="text-[11px] text-emerald-100">Simulate C2B Paybill 247247 & Instant Reconciliation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSimulate} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Payment Accepted & Auto-Reconciled!</span>
              </div>
              <div className="text-[11px] space-y-1 font-mono text-emerald-800">
                <p>Receipt No: <span className="font-bold">{result.reconciliation?.receipt_number || 'RCT-AUTO'}</span></p>
                <p>Transaction ID: <span className="font-bold">{result.transaction_id}</span></p>
                <p>Amount Credited: <span className="font-bold">KES {Number(amount).toLocaleString()}</span></p>
                <p>Matched Student: <span className="font-bold">{currentStudent?.first_name} {currentStudent?.last_name} (Adm: {currentStudent?.admission_number})</span></p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Target Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.admission_number} - {s.first_name} {s.last_name} ({s.class_name || 'Form 1'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Amount (KES)</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">M-Pesa Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Payer Name (Depositor)</label>
            <input
              type="text"
              required
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send M-Pesa Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};