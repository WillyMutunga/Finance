import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ApiService } from '../services/api';
import {
  Landmark,
  Plus,
  Search,
  Filter,
  Trash2,
  X,
  CheckCircle2,
  Calendar,
  DollarSign,
  Layers,
  MapPin,
  User,
  Shield,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

interface AssetsRegisterViewProps {
  currentRole: UserRole;
}

const ClipboardIllustration: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto space-y-3 animate-fadeIn">
    <div className="w-20 h-24 relative flex items-center justify-center">
      <svg viewBox="0 0 100 120" className="w-full h-full text-emerald-200">
        <rect x="15" y="15" width="70" height="95" rx="8" fill="none" stroke="#bbf7d0" strokeWidth="6" />
        <path d="M35,15 L35,10 C35,6 40,5 45,5 L55,5 C60,5 65,6 65,10 L65,15 Z" fill="#bbf7d0" />
        <circle cx="50" cy="10" r="3" fill="#ffffff" />
        <circle cx="70" cy="85" r="18" fill="#d1fae5" stroke="#a7f3d0" strokeWidth="4" />
        <line x1="70" y1="85" x2="70" y2="76" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="85" x2="77" y2="85" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
    <p className="text-sm font-semibold text-slate-500">{label}</p>
  </div>
);

export const AssetsRegisterView: React.FC<AssetsRegisterViewProps> = ({ currentRole }) => {
  const [activeTab, setActiveTab] = useState<'Assets' | 'Asset Categories' | 'Depreciation Report'>('Assets');
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [assetsData, setAssetsData] = useState<any>({ summary: { total_assets: 0, total_cost_value: 0 }, assets: [] });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Forms
  const [newCategory, setNewCategory] = useState({
    name: '',
    code: '',
    depreciation_type: 'ANNUALLY',
    depreciation_method: 'STRAIGHT_LINE',
    depreciation_rate: 10.0,
    description: ''
  });

  const [newAsset, setNewAsset] = useState({
    name: '',
    category_id: '',
    serial_no: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_cost: 50000,
    salvage_value: 5000,
    useful_life_years: 5,
    location: 'Main Administration Block',
    custodian_id: '',
    condition: 'Good',
    status: 'In Use',
    notes: ''
  });

  useEffect(() => {
    loadAllData();
  }, [activeTab, selectedCategory]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes, sRes] = await Promise.all([
        ApiService.getAssetCategories(),
        ApiService.getAssets(selectedCategory, searchTerm),
        ApiService.getStaffMembers ? ApiService.getStaffMembers() : Promise.resolve({ data: [] })
      ]);
      if (cRes?.data) setCategories(cRes.data);
      if (aRes?.data) setAssetsData(aRes.data);
      if (sRes?.data) setStaffList(sRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.createAssetCategory(newCategory);
      showToast(res.message || 'Category created successfully');
      setShowAddCategoryModal(false);
      setNewCategory({ name: '', code: '', depreciation_type: 'ANNUALLY', depreciation_method: 'STRAIGHT_LINE', depreciation_rate: 10.0, description: '' });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error creating category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset category?')) return;
    try {
      await ApiService.deleteAssetCategory(id);
      showToast('Category deleted');
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.createAsset(newAsset);
      showToast(res.message || 'Asset registered successfully');
      setShowAddAssetModal(false);
      setNewAsset({
        name: '',
        category_id: '',
        serial_no: '',
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_cost: 50000,
        salvage_value: 5000,
        useful_life_years: 5,
        location: 'Main Administration Block',
        custodian_id: '',
        condition: 'Good',
        status: 'In Use',
        notes: ''
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error registering asset');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fixed asset?')) return;
    try {
      await ApiService.deleteAsset(id);
      showToast('Asset deleted');
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Landmark className="w-5 h-5" />
            </div>
            Fixed Assets & Equipment Register
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track institutional assets, locations, custodians, straight-line & reducing depreciation valuation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          {activeTab === 'Asset Categories' ? (
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Asset Category
            </button>
          ) : (
            <button
              onClick={() => setShowAddAssetModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Register New Asset
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fixed Assets</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{assetsData.summary?.total_assets || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Items in active registry</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Acquisition Cost</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            KES {Number(assetsData.summary?.total_cost_value || 0).toLocaleString()}
          </div>
          <div className="text-xs text-emerald-600 mt-1">Gross asset historical cost</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Categories</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{categories.length}</div>
          <div className="text-xs text-blue-600 mt-1">Depreciation classifications</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-8">
        {(['Assets', 'Asset Categories', 'Depreciation Report'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'Assets' ? 'Asset Catalog' : tab === 'Asset Categories' ? 'Asset Categories' : 'Depreciation & Net Book Value'}
          </button>
        ))}
      </div>

      {/* 1. Assets Tab */}
      {activeTab === 'Assets' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {assetsData.assets?.length === 0 ? (
            <ClipboardIllustration label="No fixed assets registered yet. Click 'Register New Asset' to record institutional assets." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Asset Tag</th>
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Custodian</th>
                    <th className="px-6 py-4">Cost Value</th>
                    <th className="px-6 py-4">Condition / Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assetsData.assets.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-mono font-black text-slate-800">{a.asset_tag}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{a.name}</div>
                        <div className="text-xs text-slate-400">SN: {a.serial_no || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{a.category_name || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 flex items-center gap-1.5 pt-5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {a.location || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{a.custodian_name || 'Unassigned'}</td>
                      <td className="px-6 py-4 font-black text-slate-800">
                        KES {Number(a.purchase_cost).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          a.condition === 'Good' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {a.condition} • {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteAsset(a.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Asset Categories Tab */}
      {activeTab === 'Asset Categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Category Name</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Depreciation Method</th>
                  <th className="px-6 py-4">Annual Rate</th>
                  <th className="px-6 py-4">Assets Count</th>
                  <th className="px-6 py-4">Total Historical Value</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">{c.code}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{c.depreciation_method}</td>
                    <td className="px-6 py-4 font-black text-slate-800">{Number(c.depreciation_rate || 0)}%</td>
                    <td className="px-6 py-4 text-slate-600">{c.assets_count || 0} Assets</td>
                    <td className="px-6 py-4 font-black text-emerald-700">
                      KES {Number(c.total_value || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Depreciation Report Tab */}
      {activeTab === 'Depreciation Report' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {assetsData.assets?.length === 0 ? (
            <ClipboardIllustration label="No assets registered for depreciation analysis." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Asset Tag & Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Acquisition Date</th>
                    <th className="px-6 py-4">Initial Cost</th>
                    <th className="px-6 py-4">Depreciation Rate</th>
                    <th className="px-6 py-4">Accumulated Depreciation</th>
                    <th className="px-6 py-4 text-right">Net Book Value (NBV)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assetsData.assets.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{a.name}</div>
                        <div className="font-mono text-xs text-slate-400">{a.asset_tag}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{a.category_name}</td>
                      <td className="px-6 py-4 text-slate-600">{a.purchase_date}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">KES {Number(a.purchase_cost).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">{Number(a.depreciation_rate || 10)}% p.a.</td>
                      <td className="px-6 py-4 text-rose-600 font-semibold">
                        - KES {Number(a.accumulated_depreciation || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-700 text-base">
                        KES {Number(a.net_book_value || a.purchase_cost).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Asset Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" /> Add Asset Category
              </h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Equipment"
                  value={newCategory.name}
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category Code</label>
                  <input
                    type="text"
                    placeholder="e.g. LAB"
                    value={newCategory.code}
                    onChange={e => setNewCategory({ ...newCategory, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Annual Dep. Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newCategory.depreciation_rate}
                    onChange={e => setNewCategory({ ...newCategory, depreciation_rate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Depreciation Method</label>
                <select
                  value={newCategory.depreciation_method}
                  onChange={e => setNewCategory({ ...newCategory, depreciation_method: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="STRAIGHT_LINE">Straight-Line Method</option>
                  <option value="REDUCING_BALANCE">Reducing-Balance Method</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Asset */}
      {showAddAssetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" /> Register Fixed Asset
              </h3>
              <button onClick={() => setShowAddAssetModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell PowerEdge Server Rack 16TB"
                  value={newAsset.name}
                  onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category *</label>
                  <select
                    required
                    value={newAsset.category_id}
                    onChange={e => setNewAsset({ ...newAsset, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Serial / Model No</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-8921-X9"
                    value={newAsset.serial_no}
                    onChange={e => setNewAsset({ ...newAsset, serial_no: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Purchase Cost (KES) *</label>
                  <input
                    type="number"
                    required
                    value={newAsset.purchase_cost}
                    onChange={e => setNewAsset({ ...newAsset, purchase_cost: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={newAsset.purchase_date}
                    onChange={e => setNewAsset({ ...newAsset, purchase_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Physical Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Server Room / Lab 2"
                    value={newAsset.location}
                    onChange={e => setNewAsset({ ...newAsset, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Condition</label>
                  <select
                    value={newAsset.condition}
                    onChange={e => setNewAsset({ ...newAsset, condition: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};