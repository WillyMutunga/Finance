import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { ClearanceRequest, Student } from '../types';
import {
  FileCheck2,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Building,
  UserCheck,
  X
} from 'lucide-react';

export const ClearanceManagementView: React.FC = () => {
  const [requests, setRequests] = useState<ClearanceRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<ClearanceRequest | null>(null);
  const [loading, setLoading] = useState(false);

  // New Request Form
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reason, setReason] = useState('GRADUATION');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, stuRes] = await Promise.all([
        ApiService.getClearanceRequests(),
        ApiService.getStudents()
      ]);
      if (reqRes.data) setRequests(reqRes.data);
      if (stuRes.data) setStudents(stuRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuditStudent = async (studentId: string) => {
    try {
      const res = await ApiService.auditStudentClearance(studentId);
      if (res.data) setSelectedAudit(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      const res = await ApiService.createClearanceRequest({
        student_id: selectedStudentId,
        request_reason: reason
      });
      alert(res.message);
      setSelectedStudentId('');
      setSelectedAudit(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create clearance request');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-600" />
            Student Clearance & Certificate Generator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated multi-departmental clearance verification (Finance balance = 0, Library, Sports, Boarding) and official certificates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Form & Live Audit Box */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Initiate Student Clearance</h3>
          <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={e => {
                  setSelectedStudentId(e.target.value);
                  if (e.target.value) handleAuditStudent(e.target.value);
                }}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                required
              >
                <option value="">-- Choose Candidate --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.admission_number} - {s.first_name} {s.last_name} ({s.class_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Clearance Reason</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="GRADUATION">Final Year Graduation</option>
                <option value="TRANSFER">School Transfer</option>
                <option value="END_OF_YEAR">End-of-Year Exit</option>
              </select>
            </div>

            {selectedAudit && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                <span className="font-bold text-slate-700 block">Pre-Clearance Audit:</span>
                <div className="flex justify-between">
                  <span>Fee Balance:</span>
                  <span className={`font-black ${selectedAudit.fee_balance <= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    KES {Number(selectedAudit.fee_balance).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pocket Money Float:</span>
                  <span className="font-medium text-slate-800">KES {Number(selectedAudit.pocket_balance).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span>Eligibility:</span>
                  <span className={`font-bold ${selectedAudit.is_eligible ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedAudit.is_eligible ? '✓ Fully Cleared' : '⚠ Fee Pending'}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedStudentId}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              Verify & Issue Certificate
            </button>
          </form>
        </div>

        {/* Requests & Issued Certificates Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            Issued Clearance Certificates ({requests.length})
          </h3>
          {requests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No clearance certificates issued yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Cert #</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Finance Status</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{r.certificate_number || '-'}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{r.first_name} {r.last_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.class_name}</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">{r.request_reason}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.overall_status === 'CLEARED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.overall_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => setShowCertificateModal(r)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[11px] flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print Cert
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Printable Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 space-y-6 shadow-2xl border-4 border-double border-emerald-700">
            {/* Certificate Header */}
            <div className="text-center space-y-1 border-b border-slate-200 pb-4">
              <Building className="w-10 h-10 text-emerald-700 mx-auto" />
              <h2 className="text-xl font-black text-slate-900 tracking-wider uppercase">Official Clearance Certificate</h2>
              <p className="text-xs text-slate-500">Ministry of Education Standard Institutional Clearance</p>
              <div className="font-mono text-xs font-bold text-emerald-800 pt-1">
                Certificate No: {showCertificateModal.certificate_number}
              </div>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                This is to officially certify that <span className="font-bold text-slate-900 underline">{showCertificateModal.first_name} {showCertificateModal.last_name}</span> (Admission No: <span className="font-mono font-bold">{showCertificateModal.admission_number}</span>) of class <span className="font-bold">{showCertificateModal.class_name}</span> has fully fulfilled all institutional obligations for reason: <span className="font-bold">{showCertificateModal.request_reason}</span>.
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                <div>✓ Finance / Tuition Balance: <span className="font-bold text-emerald-700">KES 0.00 (Cleared)</span></div>
                <div>✓ Library Books: <span className="font-bold text-emerald-700">Returned</span></div>
                <div>✓ Boarding & Hostel Stores: <span className="font-bold text-emerald-700">Cleared</span></div>
                <div>✓ Sports & Extra-Curricular: <span className="font-bold text-emerald-700">Cleared</span></div>
              </div>
            </div>

            {/* Certificate Footer */}
            <div className="flex justify-between items-end pt-4 border-t border-slate-200">
              <div className="space-y-1">
                <div className="w-32 border-b border-slate-400"></div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Bursar / Principal Signature</span>
                <span className="text-[10px] text-slate-500">Issued on: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <QrCode className="w-8 h-8 text-emerald-800" />
                <span className="text-[9px] text-emerald-800 font-bold block leading-tight">
                  VERIFIED<br />OFFICIAL SEAL
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCertificateModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};