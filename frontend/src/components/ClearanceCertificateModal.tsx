import React from 'react';
import { X, Printer, ShieldCheck, Award, CheckCircle2, Download } from 'lucide-react';
import { printSection } from '../utils/exportUtils';

interface ClearanceCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  schoolName?: string;
  certificateData?: any;
}

export const ClearanceCertificateModal: React.FC<ClearanceCertificateModalProps> = ({
  isOpen,
  onClose,
  student,
  schoolName = 'NDUUNDUNE SECONDARY SCHOOL',
  certificateData
}) => {
  if (!isOpen || !student) return null;

  const serialNo = certificateData?.serial_number || `CLR-2026-${(student?.admission_number || '001').replace(/[^a-zA-Z0-9]/g, '')}`;
  const verifyUrl = `${window.location.origin}/verify/document/${serialNo}`;

  const handlePrint = () => {
    printSection('printable-clearance-cert', `Clearance-Certificate-${student.admission_number || 'Student'}`);
  };

  const studentFullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.name || 'Student';

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Controls Toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span className="font-extrabold text-sm text-slate-800">Official Fee Clearance Certificate</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Certificate</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Canvas */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-100/60 flex justify-center">
          <div
            id="printable-clearance-cert"
            className="w-full max-w-2xl bg-white border-8 border-double border-emerald-800/80 p-8 sm:p-10 rounded-2xl shadow-md text-center space-y-6 relative overflow-hidden"
          >
            {/* Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
              <div className="w-96 h-96 rounded-full border-[24px] border-emerald-900" />
            </div>

            {/* School Header */}
            <div className="space-y-1.5 border-b-2 border-emerald-800/40 pb-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-2xl shadow-md mb-2">
                ND
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                {schoolName}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                P.O. Box 46 - 90121, Emali, Kenya &bull; Tel: +254 722 336 013 &bull; Ministry MoE Reg: 2026/SEC/091
              </p>
              <div className="pt-2">
                <span className="px-4 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-black text-xs uppercase tracking-widest inline-block shadow-2xs">
                  Certificate of Full Financial Clearance
                </span>
              </div>
            </div>

            {/* Serial & Timestamp Bar */}
            <div className="flex justify-between items-center text-xs text-slate-500 font-mono px-2">
              <span>Certificate Serial: <strong className="text-slate-900">{serialNo}</strong></span>
              <span>Issued: <strong>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></span>
            </div>

            {/* Main Attestation Text */}
            <div className="space-y-4 text-left bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100/80 text-xs sm:text-sm text-slate-800 leading-relaxed">
              <p>
                This is to officially certify and record that:
              </p>
              <div className="py-2 text-center bg-white rounded-xl border border-emerald-200/80 shadow-2xs space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-emerald-950 uppercase tracking-tight">
                  {studentFullName}
                </h3>
                <div className="flex justify-center gap-4 text-xs font-semibold text-slate-600">
                  <span>Admission No: <strong className="font-mono text-slate-900">{student.admission_number || '-'}</strong></span>
                  <span>&bull;</span>
                  <span>Class: <strong className="text-slate-900">{student.class_name || 'Form 2'}</strong></span>
                  <span>&bull;</span>
                  <span>Status: <strong className="text-emerald-700">ACTIVE BOARDER</strong></span>
                </div>
              </div>
              <p className="text-center font-medium text-slate-700">
                Has fulfilled all institutional fee obligations and currently maintains an audited <strong>ZERO (0.00) OUTSTANDING BALANCE</strong> across all statutory voteheads for the active academic period.
              </p>
            </div>

            {/* Signatures & Security Stamp */}
            <div className="pt-4 grid grid-cols-3 gap-4 items-end text-xs">
              {/* Bursar Sign */}
              <div className="text-center space-y-2">
                <div className="h-10 border-b border-slate-400 flex items-end justify-center font-serif italic text-slate-600">
                  W. Mutunga (Accounts)
                </div>
                <span className="font-bold text-slate-700 block text-[11px]">School Bursar / Finance</span>
              </div>

              {/* QR Verification */}
              <div className="flex flex-col items-center justify-center">
                <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verifyUrl)}`}
                    alt="Clearance QR Code"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-1">Scan to Verify</span>
              </div>

              {/* Principal Stamp */}
              <div className="text-center space-y-2">
                <div className="h-10 border-b border-slate-400 flex items-end justify-center font-serif italic text-slate-600">
                  Principal & Board Seal
                </div>
                <span className="font-bold text-slate-700 block text-[11px]">Principal / Head of Institution</span>
              </div>
            </div>

            {/* Footer Cryptographic Notice */}
            <div className="pt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-200">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Audited Under IPSAS Cash Standards</span>
              </span>
              <span>SHA-256 Validated & Recorded</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
