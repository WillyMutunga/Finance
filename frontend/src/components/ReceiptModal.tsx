import React, { useEffect, useState } from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { printSection } from '../utils/exportUtils';
import { ApiService } from '../services/api';

interface ReceiptModalProps {
  receipt: any | null;
  onClose: () => void;
  schoolName?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose, schoolName = 'NDUUNDUNE SECONDARY SCHOOL' }) => {
  const [format, setFormat] = useState<'a4' | 'thermal'>('a4');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    ApiService.getSchoolProfile().then((res) => {
      if (res && res.data) {
        setProfile(res.data);
      }
    }).catch(() => {});
  }, []);

  if (!receipt) return null;

  const handlePrint = () => {
    printSection('printable-receipt-area', `Receipt-${receipt.receipt_number || 'Official'}`);
  };

  const activeSchoolName = profile?.name || schoolName;
  const activeAddress = profile?.address || `${profile?.postal_address || 'P.O. Box 100 - 90100'}, ${profile?.county || 'Machakos, Kenya'}`;
  const activePhone = profile?.phone || '+254 712 345 678';
  const activeEmail = profile?.email || 'accounts@nduundune.ac.ke';
  const activePaybill = profile?.mpesa_paybill || '522123';

  const amount = Number(receipt.amount || receipt.total_value || 0);
  const studentName = receipt.student_name || `${receipt.first_name || ''} ${receipt.last_name || ''}`.trim() || 'Student';
  const admNo = receipt.admission_number || receipt.student_admission_number || receipt.student_admission || receipt.adm_no || receipt.admission_no || receipt.student?.admission_number || 'N/A';
  const className = receipt.class_name ? `${receipt.class_name}${receipt.stream_name ? ` (${receipt.stream_name})` : ''}` : (receipt.student?.class_name || 'Form 1');
  const receiptNo = receipt.receipt_number || 'RCT-2026-0001';

  const formatReceiptDate = (raw: any) => {
    if (!raw) return new Date().toLocaleString();
    try {
      // In case timestamp was concatenated without a space or has ISO formatting
      const dateStr = String(raw).replace(/^(\d{4}-\d{2}-\d{2})(\d{2}:)/, '$1 $2');
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } catch {
      return String(raw);
    }
  };

  const paymentDate = formatReceiptDate(receipt.issued_at || receipt.payment_date || receipt.date || receipt.created_at);
  const channel = receipt.payment_mode || receipt.channel || receipt.payment_method || 'MPESA_C2B';
  const refCode = receipt.reference_code || receipt.reference_number || 'N/A';
  const paidBy = receipt.payer_name || receipt.delivered_by || receipt.paid_by || 'Guardian / Parent';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Toolbar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Receipt Format:</span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => setFormat('a4')}
                className={`px-3 py-1 rounded-md transition-all ${
                  format === 'a4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Official A4
              </button>
              <button
                onClick={() => setFormat('thermal')}
                className={`px-3 py-1 rounded-md transition-all ${
                  format === 'thermal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80mm Thermal Slip
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50 flex justify-center">
          <div
            id="printable-receipt-area"
            className={`bg-white shadow-sm border border-slate-200 p-6 ${
              format === 'thermal' ? 'w-80 text-xs font-mono' : 'w-full max-w-xl text-slate-800 rounded-xl'
            }`}
          >
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-200 space-y-1">
              <div className="w-12 h-12 mx-auto bg-emerald-600 rounded-full flex items-center justify-center text-white font-extrabold text-lg mb-1">
                {(activeSchoolName || 'SC').slice(0, 2)}
              </div>
              <h2 className="font-extrabold text-base tracking-tight text-slate-900 uppercase">{activeSchoolName}</h2>
              <p className="text-[11px] text-slate-500">{activeAddress} &bull; Tel: {activePhone}</p>
              <p className="text-[11px] font-semibold text-emerald-700">M-Pesa Paybill: {activePaybill} &bull; Email: {activeEmail}</p>
              <div className="pt-2">
                <span className="px-3 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-xs uppercase tracking-wider">
                  Official Fee Receipt
                </span>
              </div>
            </div>

            {/* Meta Details */}
            <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Receipt Serial No.</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">{receiptNo}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date & Time</span>
                <span className="font-medium text-slate-700">{paymentDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Mode</span>
                <span className="font-bold text-emerald-700 uppercase">{channel}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Transaction Reference</span>
                <span className="font-mono font-bold text-slate-800">{refCode}</span>
              </div>
            </div>

            {/* Student Info */}
            <div className="py-3 border-b border-slate-100 bg-slate-50/70 p-3 rounded-lg my-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-extrabold text-slate-900">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission No:</span>
                <span className="font-mono font-bold text-slate-800">{admNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Class / Stream:</span>
                <span className="font-medium text-slate-700">{className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid By:</span>
                <span className="font-medium text-slate-700">{paidBy}</span>
              </div>
            </div>

            {/* Amount Summary */}
            <div className="py-3 border-b border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                <span className="font-bold text-slate-700 text-sm">Total Amount Paid:</span>
                <span className="font-mono font-black text-lg text-emerald-700">
                  KES {amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Security / Verification */}
            <div className="pt-4 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified System Generated Document</span>
              </div>
              <div>Served by: School Accounts</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <span>Official audit-ready receipt</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};