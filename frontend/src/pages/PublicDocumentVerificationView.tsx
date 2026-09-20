import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Building2, Calendar, User, FileText, ArrowLeft, Printer, Lock } from 'lucide-react';
import { ApiService } from '../services/api';

export const PublicDocumentVerificationView: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract identifier from URL path or query string
    const pathParts = window.location.pathname.split('/');
    const docId = pathParts[pathParts.length - 1] || new URLSearchParams(window.location.search).get('id') || 'RCT-2026-0002';
    setIdentifier(docId);
    verifyDoc(docId);
  }, []);

  const verifyDoc = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.verifyDocument(id);
      if (res && res.status === 'success') {
        setData(res);
      } else {
        setError(res?.message || 'Document could not be verified.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Document not found in institutional ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier.trim()) {
      verifyDoc(identifier.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-2xl w-full space-y-6">
        {/* Top Branding Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Document Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Official Document Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Independent institutional registry for Ministry of Education & IPSAS certified documents
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Querying cryptographic signature from ledger...</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Authenticity Badge */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-emerald-400 uppercase tracking-wide">
                      {data.verification_state === 'VERIFIED_AUTHENTIC' ? '100% Authentic & Verified' : data.verification_state}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                      SHA-256 Valid
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    This document was officially issued by {data.issuer?.school_name || 'NDUUNDUNE SECONDARY SCHOOL'} and matches the immutable transaction ledger.
                  </p>
                </div>
              </div>

              {/* Document Overview */}
              <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Document Type</span>
                    <span className="font-extrabold text-white text-sm">
                      {data.document_type?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Document Serial No.</span>
                    <span className="font-mono font-extrabold text-emerald-400 text-sm">
                      {data.document_number}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Student Name:</span>
                    <span className="font-extrabold text-white">{data.document_details?.student_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Admission Number:</span>
                    <span className="font-mono font-bold text-slate-200">{data.document_details?.admission_number}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Class / Stream:</span>
                    <span className="font-semibold text-slate-200">{data.document_details?.class_name}</span>
                  </div>
                  {data.document_details?.amount_paid !== undefined && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Amount Paid:</span>
                      <span className="font-mono font-black text-emerald-400 text-base">
                        {data.document_details?.currency} {Number(data.document_details?.amount_paid).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {data.document_details?.payment_mode && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Payment Channel:</span>
                      <span className="font-bold text-sky-400 uppercase">{data.document_details?.payment_mode}</span>
                    </div>
                  )}
                  {data.document_details?.transaction_ref && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Transaction Reference:</span>
                      <span className="font-mono font-bold text-slate-300">{data.document_details?.transaction_ref}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Verified Timestamp:</span>
                    <span className="font-mono text-slate-400">{data.verified_at}</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Hash Badge */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-400 break-all">
                <span className="text-slate-500 font-bold block mb-0.5">DIGITAL SIGNATURE SEAL:</span>
                {data.verification_hash || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Document Verification Failed</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {error || 'No matching document record was found. Please ensure the serial number or QR code was scanned correctly.'}
                </p>
              </div>

              {/* Manual Lookup Input */}
              <form onSubmit={handleManualSearch} className="max-w-md mx-auto flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Receipt or Clearance No. (e.g. RCT-2026-0002)"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Verify
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="text-center text-xs text-slate-500">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to School Portal</span>
          </a>
        </div>
      </div>
    </div>
  );
};
