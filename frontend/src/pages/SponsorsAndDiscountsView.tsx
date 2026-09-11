import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { SiblingRule, SiblingFamily, Sponsor, SponsorAllocation } from '../types';
import {
  Users2,
  HeartHandshake,
  Plus,
  Sparkles,
  Search,
  CheckCircle2,
  DollarSign,
  Percent,
  X
} from 'lucide-react';

export const SponsorsAndDiscountsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'siblings' | 'sponsors' | 'allocations'>('siblings');
  const [siblingRules, setSiblingRules] = useState<SiblingRule[]>([]);
  const [siblingFamilies, setSiblingFamilies] = useState<SiblingFamily[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [allocations, setAllocations] = useState<SponsorAllocation[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState('2nd Child Discount');
  const [ruleChildOrder, setRuleChildOrder] = useState('2');
  const [ruleType, setRuleType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [ruleValue, setRuleValue] = useState('10');

  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorCode, setSponsorCode] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesRes, famRes, sponRes, allocRes] = await Promise.all([
        ApiService.getSiblingRules(),
        ApiService.getDetectedSiblings(),
        ApiService.getSponsors(),
        ApiService.getSponsorAllocations()
      ]);
      if (rulesRes.data) setSiblingRules(rulesRes.data);
      if (famRes.data) setSiblingFamilies(famRes.data);
      if (sponRes.data) setSponsors(sponRes.data);
      if (allocRes.data) setAllocations(allocRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createSiblingRule({
        name: ruleName,
        child_order: parseInt(ruleChildOrder) || 2,
        discount_type: ruleType,
        discount_value: parseFloat(ruleValue) || 0
      });
      setShowRuleModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create sibling rule');
    }
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createSponsor({
        name: sponsorName,
        code: sponsorCode || sponsorName.substring(0, 4).toUpperCase(),
        phone: sponsorPhone
      });
      setShowSponsorModal(false);
      setSponsorName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create sponsor');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-emerald-600" />
            Sibling Discounts & Sponsor Bursary Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated family multi-child fee concessions and institutional sponsor fund tracking (CDF, Equity Wings to Fly, etc.).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRuleModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Percent className="w-4 h-4 text-slate-600" />
            Add Sibling Rule
          </button>
          <button
            onClick={() => setShowSponsorModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Sponsor
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('siblings')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'siblings' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Sibling Discounts & Families ({siblingFamilies.length})
        </button>
        <button
          onClick={() => setActiveTab('sponsors')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'sponsors' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Sponsors & Foundations ({sponsors.length})
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'allocations' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Fund Allocations ({allocations.length})
        </button>
      </div>

      {activeTab === 'siblings' && (
        <div className="space-y-6">
          {/* Active Rules Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {siblingRules.map(r => (
              <div key={r.id} className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Rule #{r.child_order} Child</span>
                <div className="text-base font-black text-emerald-900 mt-1">{r.name}</div>
                <div className="text-xs font-bold text-emerald-700 mt-1">
                  {r.discount_type === 'PERCENTAGE' ? `${r.discount_value}% Discount` : `KES ${Number(r.discount_value).toLocaleString()} Off`}
                </div>
              </div>
            ))}
          </div>

          {/* Families Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Auto-Detected Multi-Child Families</h3>
            {siblingFamilies.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No multi-child sibling families detected yet.</div>
            ) : (
              <div className="space-y-3">
                {siblingFamilies.map((fam, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900">
                        {fam.guardian_name || 'Guardian'} ({fam.guardian_phone})
                      </span>
                      <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-full">
                        {fam.sibling_count} Enrolled Siblings
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                      {fam.children.map((c, cIdx) => (
                        <div key={cIdx} className="p-2 bg-slate-50 rounded border border-slate-100 text-[11px]">
                          <span className="font-bold text-slate-800 block">Child #{cIdx + 1}: {c.name}</span>
                          <span className="text-slate-500">{c.class_name} • Adm: {c.admission_number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sponsors' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Registered Sponsors</h3>
          {sponsors.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No sponsors added yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Sponsor Code</th>
                    <th className="py-2.5 px-3">Organization Name</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Beneficiaries</th>
                    <th className="py-2.5 px-3">Total Allocated</th>
                    <th className="py-2.5 px-3">Total Disbursed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sponsors.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{s.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{s.phone || s.email || '-'}</td>
                      <td className="py-2.5 px-3 font-semibold text-sky-700">{s.sponsored_students_count} Students</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">KES {Number(s.total_allocated).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">KES {Number(s.total_disbursed).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'allocations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Sponsor Grant Dispatches</h3>
          {allocations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No sponsor allocations logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Sponsor</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Claim Ref</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocations.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-emerald-800">{a.sponsor_name}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{a.first_name} {a.last_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{a.class_name}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">KES {Number(a.allocated_amount).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{a.claim_reference}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          {a.status}
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

      {/* Sibling Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Configure Sibling Discount</h3>
            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Rule Name</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Child Order</label>
                  <select
                    value={ruleChildOrder}
                    onChange={e => setRuleChildOrder(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="2">2nd Child</option>
                    <option value="3">3rd Child</option>
                    <option value="4">4th+ Child</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={ruleType}
                    onChange={e => setRuleType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (KES)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Discount Value</label>
                <input
                  type="number"
                  value={ruleValue}
                  onChange={e => setRuleValue(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sponsor Modal */}
      {showSponsorModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Add New Sponsor</h3>
            <form onSubmit={handleCreateSponsor} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Organization / Sponsor Name</label>
                <input
                  type="text"
                  value={sponsorName}
                  onChange={e => setSponsorName(e.target.value)}
                  placeholder="Equity Wings to Fly"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Code</label>
                  <input
                    type="text"
                    value={sponsorCode}
                    onChange={e => setSponsorCode(e.target.value)}
                    placeholder="EQTY"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={sponsorPhone}
                    onChange={e => setSponsorPhone(e.target.value)}
                    placeholder="0712345678"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSponsorModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Sponsor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};