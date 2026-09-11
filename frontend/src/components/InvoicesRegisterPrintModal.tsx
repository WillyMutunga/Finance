import React, { useEffect, useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, ShieldCheck, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { ApiService } from '../services/api';
import { printSection, exportToCsv } from '../utils/exportUtils';

interface InvoicesRegisterPrintModalProps {
  invoices: any[];
  onClose: () => void;
  schoolName?: string;
  selectedTermName?: string;
  selectedClassName?: string;
}

export const InvoicesRegisterPrintModal: React.FC<InvoicesRegisterPrintModalProps> = ({
  invoices,
  onClose,
  schoolName = 'NDUUNDUNE SECONDARY SCHOOL',
  selectedTermName,
  selectedClassName
}) => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    ApiService.getSchoolProfile().then((res) => {
      if (res && res.data) {
        setProfile(res.data);
      }
    }).catch(() => {});
  }, []);

  const activeSchoolName = profile?.name || schoolName;
  const activeAddress = profile?.address || `${profile?.postal_address || 'P.O. Box 100 - 90100'}, ${profile?.county || 'Machakos, Kenya'}`;
  const activePhone = profile?.phone || '+254 712 345 678';
  const activeEmail = profile?.email || 'accounts@nduundune.ac.ke';
  const activeMotto = profile?.motto || 'Excellence and Integrity';

  const totalBilled = invoices.reduce((acc, inv) => acc + Number(inv.total_billed || 0), 0);

  const handlePrint = () => {
    printSection('printable-invoices-register-area', `InvoicesRegister_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportCsv = () => {
    const headers = ['Invoice No', 'Issue Date', 'Due Date', 'Admission No', 'Student Name', 'Class', 'Category', 'Term', 'Amount Billed (KES)', 'Status'];
    const rows = invoices.map((inv) => [
      inv.invoice_number,
      new Date(inv.created_at).toLocaleDateString(),
      inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-',
      inv.admission_number,
      `${inv.first_name} ${inv.last_name}`,
      inv.class_name,
      inv.student_boarding_status || 'DAY',
      inv.term_name,
      inv.total_billed,
      inv.status || 'ISSUED'
    ]);
    rows.push(['TOTAL', '-', '-', '-', '-', '-', '-', '-', totalBilled, '-']);
    exportToCsv(`InvoicesRegister_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Controls */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Student Invoices Register Print Preview</h3>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {invoices.length} Invoices
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Register</span>
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
            id="printable-invoices-register-area"
            className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-slate-900 max-w-3xl mx-auto"
            style={{ minHeight: '800px' }}
          >
            {/* School Header */}
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

            {/* Document Title & Filter Meta */}
            <div className="py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Accounts Department
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">STUDENT INVOICES REGISTER</h2>
              </div>
              <div className="text-right text-xs space-y-0.5 font-medium">
                <div><span className="text-slate-500">Total Invoices:</span> <strong className="font-mono">{invoices.length}</strong></div>
                <div><span className="text-slate-500">Date Generated:</span> <strong>{new Date().toLocaleDateString()}</strong></div>
                <div><span className="text-slate-500">Class/Filter:</span> <strong>{selectedClassName || 'All Classes'}</strong></div>
              </div>
            </div>

            {/* Table */}
            <div className="py-5">
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3">Invoice No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Adm No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Billed (KES)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No invoices found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv, idx) => (
                      <tr key={inv.id || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-sky-800">{inv.invoice_number}</td>
                        <td className="py-2 px-3 text-slate-600">{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{inv.admission_number}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{inv.first_name} {inv.last_name}</td>
                        <td className="py-2 px-3 text-slate-600">{inv.class_name}</td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${inv.student_boarding_status === 'BOARDING' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'}`}>
                            {inv.student_boarding_status === 'BOARDING' ? 'Boarding' : 'Day'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {Number(inv.total_billed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                            {inv.status || 'ISSUED'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                  <tr>
                    <td colSpan={7} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-700">
                      Total Invoiced Value ({invoices.length} Students):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-slate-950 font-black">
                      KES {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Summary & Verification Box */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
              <div>
                <div className="h-12 border-b border-dashed border-slate-400"></div>
                <div className="mt-1 font-bold text-slate-900">Prepared by: Accounts / Bursar</div>
                <div className="text-[10px] text-slate-500">Signature & Official Stamp</div>
              </div>
              <div className="text-right">
                <div className="h-12 border-b border-dashed border-slate-400"></div>
                <div className="mt-1 font-bold text-slate-900">Approved by: Principal / Head Teacher</div>
                <div className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};