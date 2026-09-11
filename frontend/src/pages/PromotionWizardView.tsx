import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { AcademicPromotion } from '../types';
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Users,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const PromotionWizardView: React.FC = () => {
  const [promotions, setPromotions] = useState<AcademicPromotion[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [fromYearId, setFromYearId] = useState('');
  const [toYearId, setToYearId] = useState('');
  const [fromTermId, setFromTermId] = useState('');
  const [toTermId, setToTermId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentActions, setStudentActions] = useState<Record<string, { action: string; to_class_id?: string }>>({});

  useEffect(() => {
    loadInitData();
  }, []);

  const loadInitData = async () => {
    setLoading(true);
    try {
      const [promRes, yearsRes, termsRes, previewRes] = await Promise.all([
        ApiService.getPromotions(),
        ApiService.getAcademicYears(),
        ApiService.getTerms(),
        ApiService.previewPromotions()
      ]);
      if (promRes.data) setPromotions(promRes.data);
      if (yearsRes.data) {
        setAcademicYears(yearsRes.data);
        if (yearsRes.data.length > 0) {
          setFromYearId(yearsRes.data[0].id);
          setToYearId(yearsRes.data[yearsRes.data.length - 1].id);
        }
      }
      if (termsRes.data) {
        setTerms(termsRes.data);
        if (termsRes.data.length > 0) {
          setFromTermId(termsRes.data[0].id);
          setToTermId(termsRes.data[0].id);
        }
      }
      if (previewRes.data) {
        setStudents(previewRes.data.students || []);
        setClasses(previewRes.data.classes || []);

        // Default mapping: map to next level_order
        const initialActions: Record<string, { action: string; to_class_id?: string }> = {};
        previewRes.data.students.forEach((st: any) => {
          const currentOrder = st.level_order || 1;
          const nextClass = previewRes.data.classes.find((c: any) => c.level_order === currentOrder + 1);
          if (nextClass) {
            initialActions[st.student_id] = { action: 'PROMOTED', to_class_id: nextClass.id };
          } else {
            initialActions[st.student_id] = { action: 'GRADUATED' };
          }
        });
        setStudentActions(initialActions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!fromYearId || !toYearId || !fromTermId || !toTermId) {
      alert('Please select both From and To Academic Year and Term.');
      return;
    }

    const payload = students.map(st => ({
      student_id: st.student_id,
      from_class_id: st.current_class_id,
      to_class_id: studentActions[st.student_id]?.to_class_id || null,
      action_type: studentActions[st.student_id]?.action || 'PROMOTED'
    }));

    if (!confirm(`Are you sure you want to promote/rollover ${payload.length} students to the next academic cycle?`)) return;

    try {
      setLoading(true);
      const res = await ApiService.executePromotions({
        from_academic_year_id: fromYearId,
        to_academic_year_id: toYearId,
        from_term_id: fromTermId,
        to_term_id: toTermId,
        promotions: payload
      });
      alert(res.message || 'Promotion successfully executed!');
      loadInitData();
    } catch (err: any) {
      alert(err.message || 'Failed to execute promotions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            End-of-Term Rollover & Student Promotion Wizard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Promote students to the next academic grade, graduate final year candidates, and carry forward fee balances.
          </p>
        </div>
        <button
          onClick={handleExecute}
          disabled={loading || students.length === 0}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          Execute Bulk Rollover ({students.length})
        </button>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">From Academic Year</label>
          <select
            value={fromYearId}
            onChange={e => setFromYearId(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
          >
            {academicYears.map(y => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">To Academic Year</label>
          <select
            value={toYearId}
            onChange={e => setToYearId(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg font-bold text-emerald-800"
          >
            {academicYears.map(y => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">From Term</label>
          <select
            value={fromTermId}
            onChange={e => setFromTermId(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
          >
            {terms.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">To Term</label>
          <select
            value={toTermId}
            onChange={e => setToTermId(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg font-bold text-emerald-800"
          >
            {terms.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Promotion Review Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            Student Progression Mapping ({students.length} Candidates)
          </h3>
          <span className="text-xs text-slate-400">All unbilled fee arrears and prepayments will carry forward</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Admission</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Current Class</th>
                <th className="py-2.5 px-3">Fee Balance (Carry-Fwd)</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(st => {
                const actionObj = studentActions[st.student_id] || { action: 'PROMOTED' };
                return (
                  <tr key={st.student_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{st.admission_number}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{st.first_name} {st.last_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{st.current_class_name}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      KES {Number(st.current_balance).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={actionObj.action}
                        onChange={e => {
                          const val = e.target.value;
                          setStudentActions(prev => ({
                            ...prev,
                            [st.student_id]: { ...prev[st.student_id], action: val }
                          }));
                        }}
                        className="p-1 border border-slate-300 rounded text-xs font-bold"
                      >
                        <option value="PROMOTED">Promote</option>
                        <option value="RETAINED">Retain (Repeat)</option>
                        <option value="GRADUATED">Graduate (Alumni)</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      {actionObj.action === 'PROMOTED' ? (
                        <select
                          value={actionObj.to_class_id || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setStudentActions(prev => ({
                              ...prev,
                              [st.student_id]: { ...prev[st.student_id], to_class_id: val }
                            }));
                          }}
                          className="p-1 border border-slate-300 rounded text-xs font-bold text-emerald-700"
                        >
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">{actionObj.action}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};