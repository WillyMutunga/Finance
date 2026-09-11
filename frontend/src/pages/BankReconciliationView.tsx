import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { BankStatement, BankStatementLine, BankReconReport } from '../types';
import {
  Landmark,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  RefreshCw,
  Plus,
  ArrowRight,
  Filter,
  Check,
  X
} from 'lucide-react';

export const BankReconciliationView: React.FC<{ onNavigate?: (tab: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'statements' | 'reports'>('statements');
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);
  const [statementLines, setStatementLines] = useState<BankStatementLine[]>([]);
  const [reports, setReports] = useState<BankReconReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadBankName, setUploadBankName] = useState('Equity Bank');
  const [uploadAccountNo, setUploadAccountNo] = useState('011293847561');
  const [uploadDate, setUploadDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [uploadOpeningBal, setUploadOpeningBal] = useState('0');
  const [uploadClosingBal, setUploadClosingBal] = useState('0');
  const [uploadCsvText, setUploadCsvText] = useState('');

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportStmtBal, setReportStmtBal] = useState('0');
  const [reportCashbookBal, setReportCashbookBal] = useState('0');
  const [reportUnpresented, setReportUnpresented] = useState('0');
  const [reportDeposits, setReportDeposits] = useState('0');
  const [reportCharges, setReportCharges] = useState('0');

  useEffect(() => {
    fetchStatements();
    fetchReports();
  }, []);

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getBankStatements();
      if (res.data) setStatements(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await ApiService.getBankReconciliationReports();
      if (res.data) setReports(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectStatement = async (st: BankStatement) => {
    setSelectedStatement(st);
    try {
      const res = await ApiService.getBankStatementLines(st.id);
      if (res.data) setStatementLines(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const rows = uploadCsvText.split('\n').map(r => r.trim()).filter(r => r.length > 0);
    const lines = rows.map(r => {
      const parts = r.split(',');
      return {
        transaction_date: parts[0]?.trim() || uploadDate,
        reference_number: parts[1]?.trim() || '',
        description: parts[2]?.trim() || 'Bank credit',
        debit: parseFloat(parts[3] || '0') || 0,
        credit: parseFloat(parts[4] || '0') || 0,
        running_balance: parseFloat(parts[5] || '0') || 0
      };
    });

    try {
      await ApiService.uploadBankStatement({
        bank_name: uploadBankName,
        account_number: uploadAccountNo,
        statement_date: uploadDate,
        opening_balance: parseFloat(uploadOpeningBal) || 0,
        closing_balance: parseFloat(uploadClosingBal) || 0,
        lines
      });
      setShowUploadModal(false);
      setUploadCsvText('');
      fetchStatements();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createBankReconciliationReport({
        reconciliation_date: reportDate,
        statement_closing_balance: parseFloat(reportStmtBal) || 0,
        cashbook_balance: parseFloat(reportCashbookBal) || 0,
        unpresented_cheques_total: parseFloat(reportUnpresented) || 0,
        deposits_in_transit_total: parseFloat(reportDeposits) || 0,
        bank_charges_total: parseFloat(reportCharges) || 0
      });
      setShowReportModal(false);
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Failed to create report');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-600" />
            Bank Statement Import & Auto-Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Import CSV bank feeds from Equity, KCB, Co-op Bank with heuristic admission number auto-matching.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            New Recon Sheet
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Statement
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('statements')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'statements' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Imported Statements ({statements.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'reports' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Reconciliation Certificates ({reports.length})
        </button>
      </div>

      {activeTab === 'statements' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statement List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Statement Batches</h3>
            {statements.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No bank statements uploaded yet.</div>
            ) : (
              <div className="space-y-2">
                {statements.map(s => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectStatement(s)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedStatement?.id === s.id
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{s.bank_name}</span>
                        <span className="text-[11px] text-slate-400">{s.account_number} • {s.statement_date}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        {s.matched_lines_count} / {s.total_lines_count} Matched
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-600 flex justify-between">
                      <span>Closing: KES {Number(s.closing_balance).toLocaleString()}</span>
                      <span className="text-emerald-700 font-bold">
                        {s.total_lines_count > 0 ? Math.round((s.matched_lines_count / s.total_lines_count) * 100) : 0}% auto-reconciled
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statement Lines Workbench */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                {selectedStatement ? `Transaction Lines: ${selectedStatement.bank_name}` : 'Select a Statement'}
              </h3>
              <div className="text-xs text-slate-400">
                {statementLines.length} Lines Loaded
              </div>
            </div>

            {selectedStatement ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Ref</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Credit (In)</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Matched Student</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statementLines.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-600">{l.transaction_date}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{l.reference_number || '-'}</td>
                        <td className="py-2 px-3 text-slate-800 max-w-[200px] truncate" title={l.description}>
                          {l.description}
                        </td>
                        <td className="py-2 px-3 font-bold text-emerald-700">
                          {Number(l.credit) > 0 ? `KES ${Number(l.credit).toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.reconciliation_status === 'MATCHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {l.reconciliation_status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px]">
                          {l.matched_student_id ? (
                            <span className="font-bold text-slate-900">
                              {l.first_name} {l.last_name} ({l.admission_number})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                Select an imported statement from the left to view parsed lines.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Reconciliation Reports Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Formal Bank Reconciliation Statements</h3>
          {reports.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No reconciliation reports recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Bank Closing</th>
                    <th className="py-2 px-3">Cashbook Bal</th>
                    <th className="py-2 px-3">Unpresented Cheques</th>
                    <th className="py-2 px-3">Deposits in Transit</th>
                    <th className="py-2 px-3">Adjusted Bal</th>
                    <th className="py-2 px-3">Variance</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{r.reconciliation_date}</td>
                      <td className="py-2.5 px-3 font-semibold">KES {Number(r.statement_closing_balance).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-semibold">KES {Number(r.cashbook_balance).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-rose-600">KES {Number(r.unpresented_cheques_total).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-emerald-600">KES {Number(r.deposits_in_transit_total).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-black text-slate-900">KES {Number(r.adjusted_bank_balance).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] font-bold">
                        {Math.abs(Number(r.variance)) < 0.01 ? (
                          <span className="text-emerald-700">0.00 (Balanced)</span>
                        ) : (
                          <span className="text-rose-600">{Number(r.variance).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'RECONCILED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Upload Statement Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                Import Bank Statement (CSV)
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                  <select
                    value={uploadBankName}
                    onChange={e => setUploadBankName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option>Equity Bank</option>
                    <option>KCB Bank</option>
                    <option>Co-operative Bank</option>
                    <option>NCBA Bank</option>
                    <option>Stanbic Bank</option>
                    <option>Absa Bank</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                  <input
                    type="text"
                    value={uploadAccountNo}
                    onChange={e => setUploadAccountNo(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={e => setUploadDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Opening (KES)</label>
                  <input
                    type="number"
                    value={uploadOpeningBal}
                    onChange={e => setUploadOpeningBal(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Closing (KES)</label>
                  <input
                    type="number"
                    value={uploadClosingBal}
                    onChange={e => setUploadClosingBal(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">CSV Lines (Date,Ref,Narrative,Debit,Credit,Balance)</label>
                <textarea
                  rows={5}
                  value={uploadCsvText}
                  onChange={e => setUploadCsvText(e.target.value)}
                  placeholder="2026-09-11,REF1234,Fees Payment BDR-002,0,5000,5000"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Import & Auto-Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Reconciliation Sheet Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Monthly Bank Reconciliation Sheet
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reconciliation Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={e => setReportDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Statement Closing (KES)</label>
                  <input
                    type="number"
                    value={reportStmtBal}
                    onChange={e => setReportStmtBal(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cashbook Ledger Balance (KES)</label>
                  <input
                    type="number"
                    value={reportCashbookBal}
                    onChange={e => setReportCashbookBal(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unpresented Cheques</label>
                  <input
                    type="number"
                    value={reportUnpresented}
                    onChange={e => setReportUnpresented(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deposits in Transit</label>
                  <input
                    type="number"
                    value={reportDeposits}
                    onChange={e => setReportDeposits(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Charges / Fees</label>
                  <input
                    type="number"
                    value={reportCharges}
                    onChange={e => setReportCharges(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Calculate & Finalize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};