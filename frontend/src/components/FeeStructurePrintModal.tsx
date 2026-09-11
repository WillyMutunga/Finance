import React, { useEffect, useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { printSection } from '../utils/exportUtils';
import { ApiService } from '../services/api';

interface FeeStructurePrintModalProps {
  structure: any | null;
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

export const FeeStructurePrintModal: React.FC<FeeStructurePrintModalProps> = ({
  structure,
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

  if (!structure) return null;

  const handlePrint = () => {
    printSection('printable-fee-structure-area', `Fee-Structure-${structure.class_name || 'Class'}-${structure.term_name || 'Term'}`);
  };

  const activeSchoolName = profile?.name || schoolName;
  const activeAddress = profile?.address || `${profile?.postal_address || 'P.O. Box 100 - 90100'}, ${profile?.county || 'Machakos, Kenya'}`;
  const activePhone = profile?.phone || '+254 712 345 678';
  const activeEmail = profile?.email || 'accounts@nduundune.ac.ke';
  const activeRegNo = profile?.registration_number || '2040123';
  const activePaybill = profile?.mpesa_paybill || '522123';
  const activeBank = profile?.bank_name || 'Co-operative Bank of Kenya';
  const activeAccount = profile?.bank_account_number || '01129000000000';

  const amount = Number(structure.total_amount || 0);
  const items = structure.items || [];
  const className = structure.class_name || 'All Classes';
  const termName = structure.term_name || 'Term 1';
  const academicYear = structure.academic_year_name || '2026';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Toolbar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {structure.title || `${className} Fee Structure`}
            </span>
            <span className="text-xs font-semibold text-slate-600">Official Fee Schedule</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Schedule</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50 flex justify-center">
          <div
            id="printable-fee-structure-area"
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
                Email: {activeEmail} &bull; MOE Registration: {activeRegNo}
              </p>
              <div className="pt-2">
                <span className="px-4 py-1 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-widest">
                  OFFICIAL SCHOOL FEES STRUCTURE &bull; {academicYear}
                </span>
              </div>
            </div>

            {/* Structure Summary Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Target Class Level</span>
                <span className="font-extrabold text-slate-900 text-sm">{className}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Academic Term</span>
                <span className="font-bold text-slate-900 text-sm">{termName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Academic Year</span>
                <span className="font-semibold text-slate-800 text-xs">{academicYear}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Document Status</span>
                <span className="font-bold text-emerald-700 text-xs uppercase">Approved & Active</span>
              </div>
            </div>

            {/* Itemized Vote Head Breakdown Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-4 w-12">#</th>
                    <th className="py-2.5 px-4">Vote Head / Description</th>
                    <th className="py-2.5 px-4 text-right">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">
                        No vote head breakdown available.
                      </td>
                    </tr>
                  ) : (
                    items.map((it: any, idx: number) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-4 font-mono font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-4 font-semibold text-slate-800">
                          {it.vote_head_name} {it.account_code ? `(${it.account_code})` : ''}
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                          KES {Number(it.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-slate-900 uppercase tracking-wider text-xs">
                      Total Term Fee Per Student:
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-emerald-800 font-extrabold">
                      KES {amount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Amount In Words */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="font-bold text-slate-600 block text-[10px] uppercase">Amount in Words:</span>
              <span className="font-semibold text-slate-900 italic capitalize">
                {numberToWords(amount)}
              </span>
            </div>

            {/* Bank Payment Instructions */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-1.5 text-xs text-slate-700">
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                Official Fee Payment Channels:
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">M-Pesa Paybill:</span>{' '}
                  <span className="font-bold text-slate-900">{activePaybill}</span>
                </div>
                <div>
                  <span className="text-slate-500">Account Ref:</span>{' '}
                  <span className="font-bold text-slate-900">Student Admission No.</span>
                </div>
                <div>
                  <span className="text-slate-500">Bank Name:</span>{' '}
                  <span className="font-bold text-slate-900">{activeBank}</span>
                </div>
                <div>
                  <span className="text-slate-500">Account No:</span>{' '}
                  <span className="font-bold text-slate-900">{activeAccount}</span>
                </div>
              </div>
            </div>

            {/* Authorizations / Signatures */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-700">
              <div className="space-y-4">
                <div className="border-b border-slate-400 pb-1">
                  <span className="font-bold text-[10px] text-slate-500 uppercase block">Issued & Verified By:</span>
                  <span className="font-bold text-slate-800">School Bursar / Finance Officer</span>
                </div>
                <div className="h-6"></div>
                <div className="text-[10px] text-slate-400">Signature & Date Stamp</div>
              </div>

              <div className="space-y-4 text-right">
                <div className="border-b border-slate-400 pb-1">
                  <span className="font-bold text-[10px] text-slate-500 uppercase block">Approved By:</span>
                  <span className="font-bold text-slate-800">Principal / Head Teacher</span>
                </div>
                <div className="h-6"></div>
                <div className="text-[10px] text-slate-400">Official School Seal / Stamp</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <span>Standard Kenyan Ministry of Education Fee Schedule Format</span>
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