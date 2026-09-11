import React, { useEffect, useState } from 'react';
import { X, Printer, Download, Plus, ShieldCheck, RefreshCw, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { printSection, exportToCsv } from '../utils/exportUtils';

interface FeeStatementModalProps {
  studentId: string | null;
  onClose: () => void;
  onRecordPayment?: (student: any) => void;
  schoolName?: string;
}

export const FeeStatementModal: React.FC<FeeStatementModalProps> = ({
  studentId,
  onClose,
  onRecordPayment,
  schoolName = 'NDUUNDUNE SECONDARY SCHOOL'
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    ApiService.getSchoolProfile().then((res) => {
      if (res && res.data) {
        setProfile(res.data);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (studentId) {
      loadStatement(studentId);
    }
  }, [studentId]);

  const loadStatement = async (id: string) => {
    setLoading(true);
    try {
      const res = await ApiService.getStudentDetails(id);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Error loading student statement:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!studentId) return null;

  const activeSchoolName = profile?.name || schoolName;
  const activeAddress = profile?.address || `${profile?.postal_address || 'P.O. Box 100 - 90100'}, ${profile?.county || 'Machakos, Kenya'}`;
  const activePhone = profile?.phone || '+254 712 345 678';
  const activeEmail = profile?.email || 'accounts@nduundune.ac.ke';
  const activePaybill = profile?.mpesa_paybill || '522123';
  const activeMotto = profile?.motto || 'Strive for Academic Excellence & Integrity';

  const student = data?.student || {};
  const ledger = data?.ledger || data?.ledger_history || [];
  const totalBilled = Number(data?.total_billed ?? data?.balance?.total_billed ?? 0);
  const totalPaid = Number(data?.total_paid ?? data?.balance?.total_paid ?? 0);
  const balance = Number(data?.current_balance ?? data?.balance ?? (totalBilled - totalPaid));

  const handlePrint = () => {
    printSection('printable-statement-area', `FeeStatement-${student.admission_number || 'Official'}`);
  };

  const handleExportCsv = () => {
    const headers = ['Date', 'Entry Type', 'Reference / Receipt', 'Description', 'Debit (KES)', 'Credit (KES)'];
    const rows = ledger.map((entry: any) => [
      entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-GB') : '-',
      entry.entry_type,
      entry.receipt_number || entry.original_ledger_id || '-',
      entry.description,
      entry.debit_amount || 0,
      entry.credit_amount || 0
    ]);
    rows.push(['-', 'SUMMARY', '-', 'TOTAL BILLED', totalBilled, '-']);
    rows.push(['-', 'SUMMARY', '-', 'TOTAL PAID', '-', totalPaid]);
    rows.push(['-', 'SUMMARY', '-', 'NET BALANCE DUE', balance > 0 ? balance : 0, balance < 0 ? Math.abs(balance) : 0]);
    exportToCsv(`FeeStatement_${student.admission_number || 'student'}`, headers, rows);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Toolbar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Official Student Fee Statement</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel (CSV)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </button>
            {onRecordPayment && (
              <button
                onClick={() => {
                  onClose();
                  onRecordPayment(student);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Receive Payment</span>
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-100/50 flex justify-center">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Generating student fee ledger statement...</p>
            </div>
          ) : (
            <div id="printable-statement-area" className="bg-white shadow-md border border-slate-300 p-8 w-full max-w-3xl text-slate-900 rounded-lg space-y-6">
              {/* Official School Letterhead */}
              <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
                <div className="w-14 h-14 bg-emerald-800 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-xl mb-2 shadow-md">
                  {activeSchoolName.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="font-black text-xl tracking-tight text-slate-900 uppercase">
                  {activeSchoolName}
                </h2>
                <p className="text-[11px] italic text-emerald-800 font-medium">
                  &ldquo;{activeMotto}&rdquo;
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  {activeAddress} &bull; Tel: {activePhone}
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  Email: {activeEmail} &bull; M-Pesa Paybill: {activePaybill}
                </p>
                <div className="pt-2">
                  <span className="px-4 py-1 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-widest">
                    OFFICIAL STUDENT FEES LEDGER STATEMENT
                  </span>
                </div>
              </div>

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Student Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{student.first_name} {student.last_name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Admission Number</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{student.admission_number}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Class & Stream</span>
                  <span className="font-bold text-slate-800">
                    {student.class_name || 'Form 1'} {student.stream_name ? `(${student.stream_name})` : ''} - {student.boarding_status === 'BOARDING' ? 'Boarding' : 'Day Scholar'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Statement Date</span>
                  <span className="font-medium text-slate-700">{new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Financial Summary KPI Cards */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Total Billed</div>
                  <div className="font-mono font-extrabold text-base text-slate-900 mt-0.5">KES {totalBilled.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <div className="text-[10px] font-bold uppercase text-emerald-800">Total Paid</div>
                  <div className="font-mono font-extrabold text-base text-emerald-800 mt-0.5">KES {totalPaid.toLocaleString()}</div>
                </div>
                <div className={`p-3 rounded-xl border ${balance > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className={`text-[10px] font-bold uppercase ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {balance > 0 ? 'Outstanding Balance' : 'Prepayment / Cleared'}
                  </div>
                  <div className={`font-mono font-black text-base mt-0.5 ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    KES {Math.abs(balance).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Ledger Entries Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Ref / Receipt</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (KES)</th>
                      <th className="py-2.5 px-3 text-right">Credit (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          No transactions or invoices recorded for this student yet.
                        </td>
                      </tr>
                    ) : (
                      ledger.map((entry: any, idx: number) => {
                        const debit = Number(entry.debit_amount || 0);
                        const credit = Number(entry.credit_amount || 0);
                        const isDebit = debit > 0;
                        return (
                          <tr key={entry.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                              {entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-GB') : '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isDebit
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {entry.entry_type?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 text-[11px]">
                              {entry.receipt_number || entry.original_ledger_id?.substring(0, 8) || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 max-w-xs font-medium">
                              {entry.description || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {debit > 0 ? `KES ${debit.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                              {credit > 0 ? `KES ${credit.toLocaleString()}` : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={4} className="py-3 px-3 uppercase text-slate-800 text-[11px]">Closing Balance Payable:</td>
                      <td colSpan={2} className="py-3 px-3 text-right font-mono text-sm font-black text-rose-700">
                        KES {balance > 0 ? balance.toLocaleString() : '0 (CLEARED)'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures & Stamp Verification */}
              <div className="grid grid-cols-2 gap-8 pt-4 text-xs">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400"></div>
                  <div className="mt-1 font-bold text-slate-900">School Bursar / Finance Office</div>
                  <div className="text-[10px] text-slate-500">Prepared & Issued By (Signature & Stamp)</div>
                </div>
                <div className="text-right">
                  <div className="h-10 border-b border-dashed border-slate-400"></div>
                  <div className="mt-1 font-bold text-slate-900">Principal / Head Teacher</div>
                  <div className="text-[10px] text-slate-500">Certified Correct & Approved</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};