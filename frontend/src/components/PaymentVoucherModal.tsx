import React, { useEffect, useState } from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { printSection } from '../utils/exportUtils';
import { ApiService } from '../services/api';

interface PaymentVoucherModalProps {
  voucher: any | null;
  onClose: () => void;
  schoolName?: string;
}

function numberToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const num = Math.floor(amount);
  if (num === 0) return 'Zero Shillings Only';

  const convertLessThanOneThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    const t = tens[Math.floor(n / 10)];
    const o = ones[n % 10];
    return `${t}${o ? ' ' + o : ''}`;
  };

  const convert = (n: number): string => {
    if (n < 100) return convertLessThanOneThousand(n);
    if (n < 1000) {
      const h = ones[Math.floor(n / 100)] + ' Hundred';
      const rem = n % 100;
      return rem ? `${h} and ${convertLessThanOneThousand(rem)}` : h;
    }
    if (n < 1000000) {
      const th = convert(Math.floor(n / 1000)) + ' Thousand';
      const rem = n % 1000;
      return rem ? `${th} ${convert(rem)}` : th;
    }
    if (n < 1000000000) {
      const m = convert(Math.floor(n / 1000000)) + ' Million';
      const rem = n % 1000000;
      return rem ? `${m} ${convert(rem)}` : m;
    }
    return String(n);
  };

  return `${convert(num)} Shillings Only`.trim();
}

export const PaymentVoucherModal: React.FC<PaymentVoucherModalProps> = ({
  voucher,
  onClose,
  schoolName = 'NDUUNDUNE SECONDARY SCHOOL'
}) => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    ApiService.getSchoolProfile().then((res) => {
      if (res && res.data) {
        setProfile(res.data);
      }
    }).catch(() => {});
  }, []);

  if (!voucher) return null;

  const handlePrint = () => {
    printSection('printable-voucher-area', `Payment-Voucher-${voucher.voucher_number || 'Official'}`);
  };

  const activeSchoolName = profile?.name || schoolName;
  const activeAddress = profile?.address || `${profile?.postal_address || 'P.O. Box 100 - 90100'}, ${profile?.county || 'Machakos, Kenya'}`;
  const activePhone = profile?.phone || '+254 712 345 678';
  const activeEmail = profile?.email || 'accounts@nduundune.ac.ke';
  const activeRegNo = profile?.registration_number || '2040123';

  const amount = Number(voucher.amount || 0);
  const payee = voucher.payee_name || 'Authorized Payee';
  const voucherNo = voucher.voucher_number || 'PV-2026-0001';
  const dateStr = voucher.created_at ? new Date(voucher.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB');
  const category = voucher.category_name || 'School Operations';
  const categoryCode = voucher.category_code ? `(${voucher.category_code})` : '';
  const description = voucher.description || 'Payment for school procurement/service';
  const method = (voucher.payment_method || 'BANK_TRANSFER').replace('_', ' ');
  const requestedBy = voucher.requested_by_name || 'Bursar / Accountant';
  const approvedBy = voucher.approved_by_name || (voucher.status === 'APPROVED' || voucher.status === 'DISBURSED' ? 'Principal / Head Teacher' : 'Pending Approval');
  const cashBook = voucher.cash_book_name || 'School Operations Bank Account';
  const status = voucher.status || 'REQUESTED';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Toolbar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
              {voucherNo}
            </span>
            <span className="text-xs font-semibold text-slate-600">Official Payment Voucher Slip</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Voucher</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50 flex justify-center">
          <div
            id="printable-voucher-area"
            className="bg-white shadow-md border border-slate-300 p-8 w-full max-w-xl text-slate-900 rounded-lg space-y-6"
          >
            {/* Header / Letterhead */}
            <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
              <h2 className="font-extrabold text-lg tracking-tight text-slate-900 uppercase">
                {activeSchoolName}
              </h2>
              {profile?.motto && (
                <p className="text-[11px] italic text-emerald-800 font-medium">
                  &ldquo;{profile.motto}&rdquo;
                </p>
              )}
              <p className="text-xs text-slate-600 font-medium">
                {activeAddress} &bull; Tel: {activePhone}
              </p>
              <p className="text-xs font-semibold text-slate-700">
                Email: {activeEmail} &bull; MOE Code: {activeRegNo}
              </p>
              <div className="pt-2">
                <span className="px-4 py-1 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-widest">
                  OFFICIAL PAYMENT VOUCHER
                </span>
              </div>
            </div>

            {/* Voucher Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Voucher Number</span>
                <span className="font-mono font-bold text-sm text-sky-800">{voucherNo}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Date</span>
                <span className="font-semibold text-slate-900 text-xs">{dateStr}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Vote Head / Category</span>
                <span className="font-bold text-slate-800 text-xs">{category} {categoryCode}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Cash Book / Bank</span>
                <span className="font-semibold text-slate-800 text-xs">{cashBook}</span>
              </div>
            </div>

            {/* Payee & Particulars Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-4">Payee & Particulars of Payment</th>
                    <th className="py-2.5 px-4 text-right w-36">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-4 px-4 space-y-1.5">
                      <div className="font-bold text-sm text-slate-900">
                        <span className="text-slate-500 font-medium text-xs">Pay to: </span>
                        {payee}
                      </div>
                      <div className="text-slate-700 text-xs leading-relaxed">
                        <span className="text-slate-500 font-medium">Description: </span>
                        {description}
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Payment Mode: <span className="font-bold text-slate-800">{method}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-extrabold text-base text-slate-900 align-top">
                      KES {amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-100/80 font-bold border-t border-slate-300">
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 uppercase tracking-wider text-[11px]">Total Net Payment:</td>
                    <td className="py-2.5 px-4 text-right font-mono text-sm text-emerald-800 font-black">
                      KES {amount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Amount in words */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="font-bold text-slate-600 block text-[10px] uppercase">Amount in Words:</span>
              <span className="font-semibold text-slate-900 italic capitalize">
                {numberToWords(amount)}
              </span>
            </div>

            {/* Signatures & Authorizations */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-xs text-slate-700">
              <div className="space-y-3">
                <div className="border-b border-slate-400 pb-1">
                  <span className="font-bold text-[10px] text-slate-500 uppercase block">Prepared By:</span>
                  <span className="font-bold text-slate-800">{requestedBy}</span>
                </div>
                <div className="text-[10px] text-slate-400">Accountant / Bursar</div>
              </div>

              <div className="space-y-3">
                <div className="border-b border-slate-400 pb-1">
                  <span className="font-bold text-[10px] text-slate-500 uppercase block">Approved By:</span>
                  <span className="font-bold text-slate-800">{approvedBy}</span>
                </div>
                <div className="text-[10px] text-slate-400">Principal / Head Teacher</div>
              </div>

              <div className="space-y-3">
                <div className="border-b border-slate-400 pb-1">
                  <span className="font-bold text-[10px] text-slate-500 uppercase block">Received By (Payee):</span>
                  <span className="font-bold text-slate-800">{payee}</span>
                </div>
                <div className="text-[10px] text-slate-400">Signature / ID No / Date</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <span>Status: <strong className="uppercase text-emerald-700">{status}</strong></span>
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