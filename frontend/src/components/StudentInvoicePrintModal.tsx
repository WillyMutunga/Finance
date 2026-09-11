import React, { useEffect, useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, ShieldCheck, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { ApiService } from '../services/api';
import { printSection, exportToCsv } from '../utils/exportUtils';

interface StudentInvoicePrintModalProps {
  invoice: any | null;
  onClose: () => void;
  schoolName?: string;
}

export const StudentInvoicePrintModal: React.FC<StudentInvoicePrintModalProps> = ({
  invoice,
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

  if (!invoice) return null;

  const activeSchoolName = profile?.name || schoolName;
  const activeAddress = profile?.address || `${profile?.postal_address || 'P.O. Box 100 - 90100'}, ${profile?.county || 'Machakos, Kenya'}`;
  const activePhone = profile?.phone || '+254 712 345 678';
  const activeEmail = profile?.email || 'accounts@nduundune.ac.ke';
  const activePaybill = profile?.mpesa_paybill || '522123';
  const activeMotto = profile?.motto || 'Excellence and Integrity';

  const items = invoice.items || [];
  const totalBilled = Number(invoice.total_billed || 0);
  const totalPaid = Number(invoice.student_total_paid || 0);
  const currentBalance = Math.max(0, totalBilled - totalPaid);

  const handlePrint = () => {
    printSection('printable-student-invoice-area', `FeeInvoice_${invoice.invoice_number || invoice.admission_number}`);
  };

  const handleExportCsv = () => {
    const headers = ['Vote Head Code', 'Vote Head Item', 'Type', 'Amount (KES)'];
    const rows = items.map((item: any) => [
      item.account_code || '-',
      item.vote_head_name,
      item.is_optional ? 'Optional' : 'Compulsory',
      item.amount
    ]);
    rows.push(['TOTAL', 'TOTAL BILLED', '-', totalBilled]);
    exportToCsv(`FeeInvoice_${invoice.invoice_number || 'student'}`, headers, rows);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Modal Controls */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Student Fee Invoice Preview</h3>
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              {invoice.invoice_number || 'INV-OFFICIAL'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30">
          <div
            id="printable-student-invoice-area"
            className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-slate-900 max-w-2xl mx-auto"
            style={{ minHeight: '750px' }}
          >
            {/* School Official Header */}
            <div className="border-b-2 border-slate-900 pb-5 text-center relative">
              <div className="w-14 h-14 bg-emerald-800 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-xl mb-2 shadow-md">
                {activeSchoolName.substring(0, 2).toUpperCase()}
              </div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight uppercase">{activeSchoolName}</h1>
              <p className="text-xs text-slate-600 font-medium italic mt-0.5">"{activeMotto}"</p>
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-2">
                <span>📍 {activeAddress}</span>
                <span>📞 {activePhone}</span>
                <span>✉️ {activeEmail}</span>
              </div>
            </div>

            {/* Document Title & Invoice Meta */}
            <div className="py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Official Demand Note
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">STUDENT FEE INVOICE</h2>
              </div>
              <div className="text-right text-xs space-y-0.5 font-medium">
                <div><span className="text-slate-500">Invoice No:</span> <strong className="font-mono text-emerald-800">{invoice.invoice_number || 'INV-DRAFT'}</strong></div>
                <div><span className="text-slate-500">Date Issued:</span> <strong>{new Date(invoice.created_at || Date.now()).toLocaleDateString()}</strong></div>
                <div><span className="text-slate-500">Due Date:</span> <strong className="text-rose-700">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon Term Opening'}</strong></div>
              </div>
            </div>

            {/* Student Details Grid */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs bg-slate-50/60 -mx-8 px-8">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Student Particulars</div>
                <div className="text-sm font-black text-slate-900">{invoice.first_name} {invoice.last_name}</div>
                <div><span className="text-slate-500">Admission No:</span> <strong className="font-mono">{invoice.admission_number}</strong></div>
                <div><span className="text-slate-500">Class & Stream:</span> <strong>{invoice.class_name}</strong></div>
                <div>
                  <span className="text-slate-500">Category:</span>{' '}
                  <span className="font-bold text-emerald-800">
                    {invoice.student_boarding_status === 'BOARDING' ? 'Boarding Student' : 'Day Scholar'}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-right sm:text-left">
                <div className="text-[10px] uppercase font-bold text-slate-400">Billing Term & Guardian</div>
                <div><span className="text-slate-500">Academic Period:</span> <strong>{invoice.academic_year_name || '2026'} - {invoice.term_name || 'Term 1'}</strong></div>
                <div><span className="text-slate-500">Fee Schedule:</span> <strong>{invoice.structure_title || 'General Term Fees'}</strong></div>
                <div><span className="text-slate-500">Guardian Name:</span> <strong>{invoice.guardian_name || 'Parent / Guardian'}</strong></div>
                <div><span className="text-slate-500">Guardian Contact:</span> <strong className="font-mono">{invoice.guardian_phone || 'N/A'}</strong></div>
              </div>
            </div>

            {/* Fee Itemization Table */}
            <div className="py-5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Itemized Fee Breakdown</div>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 w-16">Code</th>
                    <th className="py-2.5 px-4">Fee Item / Vote Head</th>
                    <th className="py-2.5 px-4 w-28 text-center">Type</th>
                    <th className="py-2.5 px-4 text-right w-32">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {items.length === 0 ? (
                    <tr>
                      <td className="py-2.5 px-4 font-mono text-slate-500">100</td>
                      <td className="py-2.5 px-4 font-semibold">{invoice.structure_title || 'Term Tuition & School Fees'}</td>
                      <td className="py-2.5 px-4 text-center text-[10px] font-bold text-emerald-800">Compulsory</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">
                        {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ) : (
                    items.map((it: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-4 font-mono text-slate-500">{it.account_code || `10${idx + 1}`}</td>
                        <td className="py-2 px-4 font-semibold text-slate-900">{it.vote_head_name}</td>
                        <td className="py-2 px-4 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${it.is_optional ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {it.is_optional ? 'Optional' : 'Compulsory'}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                          {Number(it.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-4 text-right uppercase tracking-wider text-slate-700">
                      Total Invoiced Amount (This Term):
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-sm text-slate-950 font-black">
                      KES {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Account Financial Status Box */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center mb-6">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Total Billed</div>
                <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                  KES {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Paid to Date</div>
                <div className="text-sm font-black text-emerald-700 font-mono mt-0.5">
                  KES {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Net Due Balance</div>
                <div className="text-sm font-black text-rose-700 font-mono mt-0.5">
                  KES {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Payment Modes & Instructions */}
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 text-xs mb-6">
              <div className="font-black text-emerald-950 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Official Approved Payment Channels</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-700 mt-2">
                <div>
                  <strong className="text-slate-900">M-Pesa Paybill:</strong>
                  <div className="text-[11px] mt-0.5">
                    Paybill No: <strong className="font-mono text-emerald-900">{activePaybill}</strong><br/>
                    Account No: <strong className="font-mono text-emerald-900">{invoice.admission_number}</strong> (Student Adm No)
                  </div>
                </div>
                <div>
                  <strong className="text-slate-900">Bank Accounts:</strong>
                  <div className="text-[11px] mt-0.5">
                    Bank: <strong>Equity Bank / KCB</strong> | Acc: <strong className="font-mono">1234567890</strong><br/>
                    Acc Name: <strong>{activeSchoolName}</strong>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-2.5">
                * Note: Please ensure the student's admission number ({invoice.admission_number}) is quoted clearly on all payment slips. Cash is not accepted at the school premises.
              </p>
            </div>

            {/* Signatures & Stamp */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
              <div>
                <div className="h-10 border-b border-dashed border-slate-400"></div>
                <div className="mt-1 font-bold text-slate-900">School Bursar / Finance Office</div>
                <div className="text-[10px] text-slate-500">Signature & Official Stamp</div>
              </div>
              <div className="text-right">
                <div className="h-10 border-b border-dashed border-slate-400"></div>
                <div className="mt-1 font-bold text-slate-900">Principal / Headteacher</div>
                <div className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};