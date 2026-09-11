import React, { useEffect, useState } from 'react';
import { X, Printer, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { printSection } from '../utils/exportUtils';
import { ApiService } from '../services/api';

interface OtherIncomeReceiptModalProps {
  receipt: any | null;
  onClose: () => void;
  schoolName?: string;
}

// Numbers to words converter
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
    return n.toString();
  }

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  let words = convert(integerPart) + ' Kenya Shillings';
  if (decimalPart > 0) {
    words += ' and ' + convert(decimalPart) + ' Cents';
  } else {
    words += ' Only';
  }
  return words;
}

export const OtherIncomeReceiptModal: React.FC<OtherIncomeReceiptModalProps> = ({
  receipt,
  onClose,
  schoolName = 'NDUUNDUNE SECONDARY SCHOOL'
}) => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    ApiService.getSchoolProfile().then((res) => {
      if (res && res.data) setProfile(res.data);
    }).catch(() => {});
  }, []);

  if (!receipt) return null;

  const handlePrint = () => {
    printSection('other-income-printable-receipt', `Receipt-${receipt.receipt_number || 'OI-Official'}`);
  };

  const activeSchoolName = profile?.name || schoolName;
  const activeAddress = profile?.address || `${profile?.postal_address || 'P.O. Box 100 - 90100'}, ${profile?.county || 'Machakos, Kenya'}`;
  const activePhone = profile?.phone || '+254 712 345 678';
  const activeEmail = profile?.email || 'accounts@school.ac.ke';
  const activeKraPin = profile?.kra_pin || 'P051234567Z';

  const amount = Number(receipt.amount || 0);
  const payerName = receipt.payer_name || receipt.customer_name || receipt.donor_name || 'Customer / Client';
  const receiptNo = receipt.receipt_number || 'OI-2026-0001';
  const receiptDate = receipt.receipt_date || receipt.donation_date || new Date().toISOString().split('T')[0];
  const paymentMethod = (receipt.payment_method || 'BANK_TRANSFER').replace('_', ' ');
  const categoryName = receipt.category_name || receipt.purpose || 'Other Non-Fee Revenue';
  const description = receipt.description || receipt.purpose || 'Alternative Revenue Collection';
  const refCode = receipt.transaction_reference || receipt.cheque_number || 'N/A';
  const bankAccount = receipt.bank_account || 'School Fund Operations Account';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Toolbar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">Official Other Income Receipt Slip</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Receipt</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50 flex justify-center">
          <div
            id="other-income-printable-receipt"
            className="bg-white shadow-sm border border-slate-200 p-8 w-full max-w-xl text-slate-800 rounded-xl space-y-5"
          >
            {/* Header */}
            <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
              <div className="w-12 h-12 mx-auto bg-emerald-700 rounded-full flex items-center justify-center text-white font-extrabold text-lg mb-1">
                {(activeSchoolName || 'SC').slice(0, 2)}
              </div>
              <h2 className="font-extrabold text-base tracking-tight text-slate-900 uppercase">{activeSchoolName}</h2>
              <p className="text-[11px] text-slate-600 font-medium">{activeAddress} | Tel: {activePhone}</p>
              <p className="text-[11px] text-slate-600 font-medium">Email: {activeEmail} | KRA PIN: {activeKraPin}</p>
              <div className="pt-2">
                <span className="inline-block px-3 py-0.5 bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase rounded-sm">
                  OFFICIAL OTHER INCOME RECEIPT
                </span>
              </div>
            </div>

            {/* Receipt Details Box */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Receipt Number</span>
                <span className="font-mono font-extrabold text-sky-800 text-sm">{receiptNo}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Date of Issue</span>
                <span className="font-bold text-slate-800">{new Date(receiptDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Payer & Category Information */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Received From (Payer / Customer):</span>
                <span className="font-extrabold text-slate-900 uppercase">{payerName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Revenue Stream / Category:</span>
                <span className="font-bold text-slate-800">{categoryName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Payment Channel / Method:</span>
                <span className="font-bold uppercase text-slate-800">{paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Reference / Cheque No:</span>
                <span className="font-mono font-bold text-slate-800">{refCode}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Destination Account:</span>
                <span className="font-medium text-slate-700">{bankAccount}</span>
              </div>
              <div className="py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium block mb-0.5">Description / Particulars:</span>
                <span className="text-slate-700 italic">{description}</span>
              </div>
            </div>

            {/* Total Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">Total Amount Received</span>
                <span className="text-xs text-emerald-700 italic font-medium">
                  {numberToWords(amount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-emerald-900 font-mono">
                  KES {amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Signatures & Stamp */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-[11px] border-t border-slate-200">
              <div className="space-y-8">
                <div>
                  <div className="border-b border-slate-400 pb-1 text-slate-800 font-medium">
                    {receipt.received_by_name || 'Finance Officer / Bursar'}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Received By (Signature & Date)</span>
                </div>
              </div>

              <div className="text-center flex flex-col items-center justify-center">
                <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-[9px] font-bold p-1">
                  <ShieldCheck className="w-6 h-6 mb-1 text-slate-300" />
                  <span>OFFICIAL SCHOOL STAMP</span>
                </div>
              </div>
            </div>

            {/* Verification Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Skysoft Finance System Generated Receipt</span>
              <span>Valid Without Physical Signature If Digitally Sealed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};