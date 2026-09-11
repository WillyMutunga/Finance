import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ApiService } from '../services/api';
import { exportToCsv } from '../utils/exportUtils';
import {
  Package,
  Plus,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Settings,
  DollarSign,
  TrendingDown,
  X,
  ChevronDown,
  ShoppingCart,
  TrendingUp,
  RotateCcw,
  RotateCw,
  Building,
  Tag,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Briefcase,
  Archive
} from 'lucide-react';

interface StoresInventoryViewProps {
  initialSubTab?: string;
  currentRole: UserRole;
}

// Reusable SVG Illustration matching Skysoft Finance
const StoreLedgerIllustration: React.FC = () => (
  <div className="w-52 h-40 relative flex items-center justify-center">
    <svg viewBox="0 0 200 160" className="w-full h-full text-slate-300">
      <circle cx="65" cy="40" r="10" fill="#2d3748" />
      <path d="M55,55 C55,50 75,50 75,55 L78,90 L68,90 L68,135 L62,135 L62,90 L52,90 Z" fill="#059669" />
      <path d="M68,90 L68,135 L74,135 L74,90 Z" fill="#2d3748" />
      <path d="M58,90 L58,135 L52,135 L52,90 Z" fill="#2d3748" />
      <rect x="48" y="70" width="10" height="15" fill="#e2e8f0" rx="1" />
      <path d="M85,35 L145,25 L145,125 L85,135 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M145,25 L175,35 L175,135 L145,125 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="95" y1="50" x2="135" y2="43" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="95" y1="65" x2="135" y2="58" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="95" y1="80" x2="135" y2="73" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="95" y1="95" x2="135" y2="88" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="152" y1="55" x2="168" y2="60" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="152" y1="70" x2="168" y2="75" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="165" cy="120" r="6" fill="#059669" />
      <polygon points="163,117 168,120 163,123" fill="#ffffff" />
    </svg>
  </div>
);

export const StoresInventoryView: React.FC<StoresInventoryViewProps> = ({
  initialSubTab = 'inventory-register',
  currentRole
}) => {
  const [activeMainTab, setActiveMainTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveMainTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Main Category Tabs
  const mainTabs = [
    { id: 'inventory-setup', label: 'Setup & Configs', icon: Settings },
    { id: 'inventory-register', label: 'Inventory Register', icon: Package },
    { id: 'inventory-issuance', label: 'Item Issuance & Sales', icon: ArrowUpRight },
    { id: 'inventory-reports', label: 'Inventory Reports', icon: Layers },
  ];

  // Secondary sub-tab states
  const [setupSubTab, setSetupSubTab] = useState<'Stores' | 'Inventory Categories' | 'Units of Measure' | 'Items Code'>('Stores');
  const [registerSubTab, setRegisterSubTab] = useState<'Inventory Items' | 'Pricelist Management' | 'Direct Stock Adjustment'>('Inventory Items');
  const [issuanceSubTab, setIssuanceSubTab] = useState<'Sales' | 'Internal Use Items' | 'Wastage'>('Sales');
  const [reportsSubTab, setReportsSubTab] = useState<'Stock Usage Report' | 'Inventory Ledger' | 'Valuation & Revenue' | 'Wastage Report'>('Stock Usage Report');

  // Loading & Notification States
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // State Data
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [itemsData, setItemsData] = useState<{ summary: any; items: any[] }>({
    summary: { total_items: 0, total_units: 0, total_valuation: 0, low_stock_count: 0 },
    items: []
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usageReport, setUsageReport] = useState<any[]>([]);

  // Filter States
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStore, setFilterStore] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showInternalIssueModal, setShowInternalIssueModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  // Form states
  const [storeForm, setStoreForm] = useState({ name: '', location: '', manager: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '', description: '' });
  const [unitForm, setUnitForm] = useState({ name: '', short_code: '' });
  const [itemForm, setItemForm] = useState({
    name: '',
    category_id: '',
    store_id: '',
    unit_of_measure: 'Pieces',
    reorder_level: '10',
    quantity_in_stock: '0',
    unit_buying_price: '0',
    selling_price: '0'
  });

  const [txForm, setTxForm] = useState({
    item_id: '',
    quantity: '1',
    unit_price: '0',
    total_amount: '0',
    recipient_department: 'Kitchen / Boarding',
    issued_to: '',
    payment_method: 'M-Pesa',
    notes: ''
  });

  // Load All Data
  useEffect(() => {
    loadAllInventoryData();
  }, [activeMainTab, setupSubTab, registerSubTab, issuanceSubTab, reportsSubTab, filterCategory, filterStore]);

  const loadAllInventoryData = async () => {
    setLoading(true);
    try {
      const [storesRes, catsRes, unitsRes, itemsRes, txRes, usageRes] = await Promise.all([
        ApiService.getInventoryStores(),
        ApiService.getInventoryCategories(),
        ApiService.getInventoryUnits(),
        ApiService.getInventoryItems({ category_id: filterCategory, store_id: filterStore, search: searchQuery }),
        ApiService.getInventoryTransactions(),
        ApiService.getInventoryUsageReport()
      ]);

      if (storesRes && storesRes.data) setStores(storesRes.data);
      if (catsRes && catsRes.data) setCategories(catsRes.data);
      if (unitsRes && unitsRes.data) setUnits(unitsRes.data);
      if (itemsRes && itemsRes.data) setItemsData(itemsRes.data);
      if (txRes && txRes.data) setTransactions(txRes.data);
      if (usageRes && usageRes.data) setUsageReport(usageRes.data);
    } catch (e) {
      console.error('Error loading inventory data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllInventoryData();
  };

  const formatCurrency = (amt: number | string | undefined | null) => {
    const val = Number(amt || 0);
    return 'KES ' + val.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 1. Create Store
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeForm.name.trim()) return;
    try {
      const res = await ApiService.createInventoryStore(storeForm);
      notify(res.message || 'Store created successfully.');
      setStoreForm({ name: '', location: '', manager: '' });
      setShowAddStoreModal(false);
      loadAllInventoryData();
    } catch (err: any) {
      alert(err.message || 'Failed to create store.');
    }
  };

  // 2. Create Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    try {
      const res = await ApiService.createInventoryCategory(categoryForm);
      notify(res.message || 'Category created.');
      setCategoryForm({ name: '', code: '', description: '' });
      setShowAddCategoryModal(false);
      loadAllInventoryData();
    } catch (err: any) {
      alert(err.message || 'Failed to create category.');
    }
  };

  // 3. Create Unit
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.name.trim()) return;
    try {
      const res = await ApiService.createInventoryUnit(unitForm);
      notify(res.message || 'Unit created.');
      setUnitForm({ name: '', short_code: '' });
      setShowAddUnitModal(false);
      loadAllInventoryData();
    } catch (err: any) {
      alert(err.message || 'Failed to create unit.');
    }
  };

  // 4. Create or Update Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return;
    try {
      if (editingItem) {
        const res = await ApiService.updateInventoryItem(editingItem.id, itemForm);
        notify(res.message || 'Item updated successfully.');
      } else {
        const res = await ApiService.createInventoryItem(itemForm);
        notify(res.message || 'Item registered in inventory.');
      }
      setShowAddItemModal(false);
      setEditingItem(null);
      setItemForm({
        name: '',
        category_id: '',
        store_id: '',
        unit_of_measure: 'Pieces',
        reorder_level: '10',
        quantity_in_stock: '0',
        unit_buying_price: '0',
        selling_price: '0'
      });
      loadAllInventoryData();
    } catch (err: any) {
      alert(err.message || 'Failed to save item.');
    }
  };

  // 5. Record Movement / Transaction
  const handleRecordTransaction = async (type: 'SALE' | 'INTERNAL_ISSUE' | 'WASTAGE_DAMAGED' | 'STOCK_ADJUSTMENT') => {
    if (!txForm.item_id) {
      alert('Please select an item.');
      return;
    }
    const qty = parseFloat(txForm.quantity) || 0;
    if (qty <= 0) {
      alert('Quantity must be greater than 0.');
      return;
    }

    try {
      const res = await ApiService.recordInventoryTransaction({
        item_id: txForm.item_id,
        transaction_type: type,
        quantity: qty,
        unit_price: parseFloat(txForm.unit_price) || 0,
        total_amount: parseFloat(txForm.total_amount) || 0,
        recipient_department: txForm.recipient_department,
        issued_to: txForm.issued_to,
        payment_method: txForm.payment_method,
        notes: txForm.notes
      });
      notify(res.message || 'Transaction recorded.');
      setShowSaleModal(false);
      setShowInternalIssueModal(false);
      setShowWastageModal(false);
      setShowAdjustmentModal(false);
      setTxForm({
        item_id: '',
        quantity: '1',
        unit_price: '0',
        total_amount: '0',
        recipient_department: 'Kitchen / Boarding',
        issued_to: '',
        payment_method: 'M-Pesa',
        notes: ''
      });
      loadAllInventoryData();
    } catch (err: any) {
      alert(err.message || 'Failed to record transaction.');
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string, name: string) => {
    if (confirm(`Permanently remove ${name} from inventory?`)) {
      try {
        const res = await ApiService.deleteInventoryItem(id);
        notify(res.message || 'Item deleted.');
        loadAllInventoryData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete item.');
      }
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-slate-800 text-xs font-sans">
      {/* Toast Notification */}
      {feedback && (
        <div className={`p-3 rounded-xl border flex items-center gap-2 animate-fadeIn text-xs font-bold ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Main Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-1.5 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {mainTabs.map((tab) => {
          const isActive = activeMainTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`flex-1 min-w-[150px] py-2 px-3.5 rounded-lg font-bold text-xs transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-semibold'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. SETUP & CONFIGS VIEW                                   */}
      {/* ========================================================= */}
      {(activeMainTab === 'inventory-setup' || activeMainTab === 'setup-configs') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 min-h-[620px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Stores &amp; Inventory</span>
                <span>&gt;</span>
                <span>Setup &amp; Configurations</span>
                <span>&gt;</span>
                <span className="font-bold text-slate-900">{setupSubTab}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Setup &amp; Configurations</h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage storage locations, product categories, and standard measurement units.</p>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm cursor-pointer self-start sm:self-auto"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="border-b border-slate-200 flex items-center gap-8 text-xs font-semibold text-slate-600">
            {(['Stores', 'Inventory Categories', 'Units of Measure', 'Items Code'] as const).map((tab) => {
              const isActive = setupSubTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSetupSubTab(tab)}
                  className={`pb-3 transition-colors relative whitespace-nowrap cursor-pointer ${
                    isActive ? 'text-emerald-700 font-bold border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* 1.1 Stores Sub-tab */}
          {setupSubTab === 'Stores' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Physical Warehouses &amp; Stores</h3>
                  <p className="text-xs text-slate-500">Add granaries, stationery storage, and lab depot centers.</p>
                </div>
                <button
                  onClick={() => setShowAddStoreModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Store</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Store Name</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Storekeeper / Manager</th>
                      <th className="py-3 px-4 text-center">Items Stored</th>
                      <th className="py-3 px-4 text-right">Stock Valuation</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {stores.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">No stores configured.</td>
                      </tr>
                    ) : (
                      stores.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{s.code}</td>
                          <td className="py-3 px-4 text-slate-600">{s.location || 'Main Block'}</td>
                          <td className="py-3 px-4 text-slate-800">{s.manager || 'Storekeeper'}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">{s.items_count || 0}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">{formatCurrency(s.total_valuation)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Active</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 1.2 Categories Sub-tab */}
          {setupSubTab === 'Inventory Categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Item Classifications &amp; Categories</h3>
                  <p className="text-xs text-slate-500">Group stock into food, lab chemicals, uniforms, and stationery.</p>
                </div>
                <button
                  onClick={() => setShowAddCategoryModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((c) => (
                  <div key={c.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{c.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{c.items_count || 0} items</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{c.description || 'General school inventory items'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1.3 Units Sub-tab */}
          {setupSubTab === 'Units of Measure' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Standard Measurement Units</h3>
                  <p className="text-xs text-slate-500">Define measurement quantities (Bags, Jerrycans, Reams, Packets).</p>
                </div>
                <button
                  onClick={() => setShowAddUnitModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Unit</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {units.map((u) => (
                  <div key={u.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{u.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{u.short_code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1.4 Items Code */}
          {setupSubTab === 'Items Code' && (
            <div className="max-w-md space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Item Barcode &amp; SKU Configuration</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">SKU Code Prefix</label>
                  <input type="text" readOnly defaultValue="ITM-" className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Auto-Increment Sequence</label>
                  <input type="text" readOnly defaultValue="4 Digits (e.g. ITM-0001)" className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-500" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. INVENTORY REGISTER VIEW                                */}
      {/* ========================================================= */}
      {(activeMainTab === 'inventory-register' || activeMainTab === 'inventory') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 min-h-[620px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Stores &amp; Inventory</span>
                <span>&gt;</span>
                <span>Inventory Register</span>
                <span>&gt;</span>
                <span className="font-bold text-slate-900">{registerSubTab}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{registerSubTab}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Real-time stock catalog, quantities on hand, reorder alerts, and valuation.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setItemForm({
                    name: '',
                    category_id: categories[0]?.id || '',
                    store_id: stores[0]?.id || '',
                    unit_of_measure: 'Pieces',
                    reorder_level: '10',
                    quantity_in_stock: '0',
                    unit_buying_price: '0',
                    selling_price: '0'
                  });
                  setShowAddItemModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Stock Item</span>
              </button>
              <button
                onClick={() => exportToCsv('Inventory_Stock_Register', ['Code', 'Item', 'Category', 'Store', 'Unit', 'InStock', 'UnitCost', 'Valuation', 'Status'], itemsData.items.map(i => [
                  i.item_code, i.name, i.category_name, i.store_name, i.unit_of_measure, i.quantity_in_stock, i.unit_buying_price, i.valuation, i.status
                ]))}
                className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Excel Export"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={handleRefresh}
                className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Refresh"
              >
                <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="border-b border-slate-200 flex items-center gap-8 text-xs font-semibold text-slate-600">
            {(['Inventory Items', 'Pricelist Management', 'Direct Stock Adjustment'] as const).map((tab) => {
              const isActive = registerSubTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setRegisterSubTab(tab)}
                  className={`pb-3 transition-colors relative whitespace-nowrap cursor-pointer ${
                    isActive ? 'text-emerald-700 font-bold border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Catalog Items</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{itemsData.summary?.total_items || 0}</div>
            </div>
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Stock Valuation</span>
              <div className="text-xl font-extrabold text-emerald-950 mt-1 font-mono">{formatCurrency(itemsData.summary?.total_valuation)}</div>
            </div>
            <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200">
              <span className="text-[10px] font-bold text-sky-800 uppercase">Total Units in Stock</span>
              <div className="text-xl font-extrabold text-sky-950 mt-1 font-mono">{itemsData.summary?.total_units || 0}</div>
            </div>
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 uppercase">Low Stock Alerts</span>
              <div className="text-xl font-extrabold text-amber-950 mt-1 font-mono">{itemsData.summary?.low_stock_count || 0}</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">Category:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">Store:</span>
                <select
                  value={filterStore}
                  onChange={(e) => setFilterStore(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer"
                >
                  <option value="ALL">All Stores</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search item or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadAllInventoryData()}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 w-48"
                />
              </div>
            </div>
          </div>

          {/* 2.1 Inventory Items Table */}
          {registerSubTab === 'Inventory Items' && (
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Store Location</th>
                    <th className="py-3 px-3 text-right">In Stock</th>
                    <th className="py-3 px-3 text-right">Buying Price</th>
                    <th className="py-3 px-3 text-right">Total Valuation</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {itemsData.items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <StoreLedgerIllustration />
                        <p className="mt-2 font-bold text-slate-700">No stock items found</p>
                        <p className="text-[11px] text-slate-500">Click "+ New Stock Item" above to add food rations, uniforms, or stationery.</p>
                      </td>
                    </tr>
                  ) : (
                    itemsData.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{item.item_code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 uppercase">
                          {item.name}
                          <span className="block text-[10px] text-slate-400 font-normal lowercase">{item.unit_of_measure}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{item.category_name || '-'}</td>
                        <td className="py-3 px-3 text-slate-600">{item.store_name || '-'}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{item.quantity_in_stock}</td>
                        <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.unit_buying_price)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">{formatCurrency(item.valuation)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setItemForm({
                                  name: item.name,
                                  category_id: item.category_id || '',
                                  store_id: item.store_id || '',
                                  unit_of_measure: item.unit_of_measure,
                                  reorder_level: String(item.reorder_level),
                                  quantity_in_stock: String(item.quantity_in_stock),
                                  unit_buying_price: String(item.unit_buying_price),
                                  selling_price: String(item.selling_price)
                                });
                                setShowAddItemModal(true);
                              }}
                              className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                              title="Edit Item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2.2 Pricelist Management */}
          {registerSubTab === 'Pricelist Management' && (
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Unit of Measure</th>
                    <th className="py-3 px-4 text-right">Buying Price (Cost)</th>
                    <th className="py-3 px-4 text-right">Selling Price (To Students/Public)</th>
                    <th className="py-3 px-4 text-right">Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {itemsData.items.map((item) => {
                    const margin = Number(item.selling_price) - Number(item.unit_buying_price);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.item_code}</td>
                        <td className="py-3 px-4 font-sans font-bold text-slate-900 uppercase">{item.name}</td>
                        <td className="py-3 px-4 font-sans text-slate-600">{item.unit_of_measure}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.unit_buying_price)}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-800">{formatCurrency(item.selling_price)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(margin)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 2.3 Direct Stock Adjustment */}
          {registerSubTab === 'Direct Stock Adjustment' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-amber-950">Physical Stock Count Verification &amp; Variance Adjustment</h3>
                  <p className="text-[11px] text-amber-700 mt-0.5">Use this tool during periodic store audits to align ledger stock counts with actual physical warehouse counts.</p>
                </div>
                <button
                  onClick={() => setShowAdjustmentModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>+ Adjust Stock</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Store</th>
                      <th className="py-3 px-4 text-right">System Recorded Stock</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {itemsData.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900 uppercase">{item.name}</td>
                        <td className="py-3 px-4 text-slate-600">{item.store_name}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{item.quantity_in_stock} {item.unit_of_measure}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setTxForm({
                                ...txForm,
                                item_id: item.id,
                                quantity: String(item.quantity_in_stock),
                                notes: 'Physical audit adjustment'
                              });
                              setShowAdjustmentModal(true);
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-300 text-[11px] cursor-pointer"
                          >
                            Audit Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ITEM ISSUANCE & SALES VIEW                             */}
      {/* ========================================================= */}
      {(activeMainTab === 'inventory-issuance' || activeMainTab === 'item-issuance' || activeMainTab === 'issuance') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 min-h-[620px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Stores &amp; Inventory</span>
                <span>&gt;</span>
                <span>Item Issuance &amp; Sales</span>
                <span>&gt;</span>
                <span className="font-bold text-slate-900">{issuanceSubTab}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{issuanceSubTab}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Track direct counter sales to parents/students, internal departmental issues, and write-offs.</p>
            </div>

            <div className="flex items-center gap-2">
              {issuanceSubTab === 'Sales' && (
                <button
                  onClick={() => setShowSaleModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>+ Record Sale</span>
                </button>
              )}
              {issuanceSubTab === 'Internal Use Items' && (
                <button
                  onClick={() => setShowInternalIssueModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+ Issue to Department</span>
                </button>
              )}
              {issuanceSubTab === 'Wastage' && (
                <button
                  onClick={() => setShowWastageModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>+ Record Wastage</span>
                </button>
              )}
              <button
                onClick={handleRefresh}
                className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Refresh"
              >
                <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="border-b border-slate-200 flex items-center gap-8 text-xs font-semibold text-slate-600">
            {(['Sales', 'Internal Use Items', 'Wastage'] as const).map((tab) => {
              const isActive = issuanceSubTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setIssuanceSubTab(tab)}
                  className={`pb-3 transition-colors relative whitespace-nowrap cursor-pointer ${
                    isActive ? 'text-emerald-700 font-bold border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Transactions Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Ref No</th>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-right">Amount (KES)</th>
                  <th className="py-3 px-4">{issuanceSubTab === 'Sales' ? 'Customer / Buyer' : 'Department / Recipient'}</th>
                  <th className="py-3 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <StoreLedgerIllustration />
                      <p className="mt-2 font-bold text-slate-700">No stock movement records found</p>
                    </td>
                  </tr>
                ) : (
                  transactions
                    .filter(t => {
                      if (issuanceSubTab === 'Sales') return t.transaction_type === 'SALE';
                      if (issuanceSubTab === 'Internal Use Items') return t.transaction_type === 'INTERNAL_ISSUE';
                      if (issuanceSubTab === 'Wastage') return t.transaction_type === 'WASTAGE_DAMAGED';
                      return true;
                    })
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-500 font-mono">{t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-GB') : '-'}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{t.reference_no}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 uppercase">{t.item_name}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.transaction_type === 'SALE' ? 'bg-emerald-100 text-emerald-800' :
                            t.transaction_type === 'INTERNAL_ISSUE' ? 'bg-sky-100 text-sky-800' :
                            t.transaction_type === 'WASTAGE_DAMAGED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {t.transaction_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{t.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">{formatCurrency(t.total_amount)}</td>
                        <td className="py-3 px-4">{t.issued_to || t.recipient_department || '-'}</td>
                        <td className="py-3 px-3 text-slate-500">{t.notes || '-'}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. INVENTORY REPORTS VIEW                                 */}
      {/* ========================================================= */}
      {(activeMainTab === 'inventory-reports' || activeMainTab === 'reports-analytics') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 min-h-[620px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Stores &amp; Inventory</span>
                <span>&gt;</span>
                <span>Reports &amp; Analytics</span>
                <span>&gt;</span>
                <span className="font-bold text-slate-900">{reportsSubTab}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{reportsSubTab}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Comprehensive audit reports on stock consumption, cost of goods, and inventory ledgers.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={handleRefresh}
                className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm cursor-pointer"
                title="Refresh"
              >
                <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="border-b border-slate-200 flex items-center gap-8 text-xs font-semibold text-slate-600">
            {(['Stock Usage Report', 'Inventory Ledger', 'Valuation & Revenue', 'Wastage Report'] as const).map((tab) => {
              const isActive = reportsSubTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setReportsSubTab(tab)}
                  className={`pb-3 transition-colors relative whitespace-nowrap cursor-pointer ${
                    isActive ? 'text-emerald-700 font-bold border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Usage Report Table */}
          {reportsSubTab === 'Stock Usage Report' && (
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item SKU</th>
                    <th className="py-3 px-5">Item Description</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">Internal Consumed</th>
                    <th className="py-3 px-4 text-right">Quantity Sold</th>
                    <th className="py-3 px-4 text-right">Wastage / Lost</th>
                    <th className="py-3 px-4 text-right">Sales Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {usageReport.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                        No usage data available.
                      </td>
                    </tr>
                  ) : (
                    usageReport.map((u, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{u.item_code}</td>
                        <td className="py-3 px-5 font-sans font-bold text-slate-900 uppercase">{u.item_name}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">{u.quantity_in_stock}</td>
                        <td className="py-3 px-4 text-right text-sky-700">{u.internal_consumed}</td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-bold">{u.total_sold}</td>
                        <td className="py-3 px-4 text-right text-rose-600">{u.total_wasted}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-800">{formatCurrency(u.sales_revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Inventory Ledger Table */}
          {reportsSubTab === 'Inventory Ledger' && (
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Ref</th>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-3">Store</th>
                    <th className="py-3 px-3">Transaction</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-3 text-right">Value (KES)</th>
                    <th className="py-3 px-4">Authorized Recipient / Customer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-sans text-slate-500">{t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{t.reference_no}</td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 uppercase">{t.item_name}</td>
                      <td className="py-3 px-3 font-sans text-slate-600">{t.store_name}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.transaction_type === 'SALE' ? 'bg-emerald-100 text-emerald-800' :
                          t.transaction_type === 'INTERNAL_ISSUE' ? 'bg-sky-100 text-sky-800' :
                          t.transaction_type === 'WASTAGE_DAMAGED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{t.quantity}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-800">{formatCurrency(t.total_amount)}</td>
                      <td className="py-3 px-4 font-sans text-slate-800">{t.issued_to || t.recipient_department || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Valuation & Revenue */}
          {reportsSubTab === 'Valuation & Revenue' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <span className="font-bold text-xs text-emerald-800 uppercase tracking-wider">Total Warehouse Asset Valuation</span>
                <div className="text-2xl font-black text-emerald-950 font-mono">{formatCurrency(itemsData.summary?.total_valuation)}</div>
                <p className="text-xs text-emerald-700">Calculated as Current Stock × Unit Buying Price across all storage centers.</p>
              </div>

              <div className="p-5 bg-sky-50/60 rounded-xl border border-sky-200 space-y-2">
                <span className="font-bold text-xs text-sky-800 uppercase tracking-wider">Total Sales Inflow</span>
                <div className="text-2xl font-black text-sky-950 font-mono">
                  {formatCurrency(transactions.filter(t => t.transaction_type === 'SALE').reduce((sum, t) => sum + Number(t.total_amount || 0), 0))}
                </div>
                <p className="text-xs text-sky-700">Direct purchases by students and parents recorded into other income.</p>
              </div>
            </div>
          )}

          {/* Wastage Report */}
          {reportsSubTab === 'Wastage Report' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-rose-50 text-rose-900 font-bold border-b border-rose-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Ref</th>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4 text-right">Quantity Wasted</th>
                    <th className="py-3 px-4 text-right">Loss Amount (KES)</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {transactions.filter(t => t.transaction_type === 'WASTAGE_DAMAGED').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                        No wastage write-offs on record.
                      </td>
                    </tr>
                  ) : (
                    transactions.filter(t => t.transaction_type === 'WASTAGE_DAMAGED').map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-sans text-slate-500">{t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-GB') : '-'}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{t.reference_no}</td>
                        <td className="py-3 px-4 font-sans font-bold text-slate-900 uppercase">{t.item_name}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">{t.quantity}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-700">{formatCurrency(t.total_amount)}</td>
                        <td className="py-3 px-4 font-sans text-slate-600">{t.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* Modal: Add Store */}
      {showAddStoreModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add New Store Location</h3>
              <button onClick={() => setShowAddStoreModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStore} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Laboratory Store"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Location / Building</label>
                <input
                  type="text"
                  placeholder="e.g. Science Complex Floor 2"
                  value={storeForm.location}
                  onChange={(e) => setStoreForm({ ...storeForm, location: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Storekeeper / In-Charge</label>
                <input
                  type="text"
                  placeholder="e.g. Lab Technician"
                  value={storeForm.manager}
                  onChange={(e) => setStoreForm({ ...storeForm, manager: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddStoreModal(false)} className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm cursor-pointer">Save Store</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Inventory Category</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sports Equipment"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of items in this category"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddCategoryModal(false)} className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm cursor-pointer">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Unit */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Unit of Measure</h3>
              <button onClick={() => setShowAddUnitModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUnit} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Unit Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cartons (12 Pkts)"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Short Code</label>
                <input
                  type="text"
                  placeholder="e.g. Ctn"
                  value={unitForm.short_code}
                  onChange={(e) => setUnitForm({ ...unitForm, short_code: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddUnitModal(false)} className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm cursor-pointer">Save Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Inventory Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">{editingItem ? 'Edit Stock Item' : 'Add New Inventory Item'}</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Item Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade A Dry Maize"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category</label>
                  <select
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Store Warehouse</label>
                  <select
                    value={itemForm.store_id}
                    onChange={(e) => setItemForm({ ...itemForm, store_id: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="">Select store</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Unit of Measure</label>
                  <select
                    value={itemForm.unit_of_measure}
                    onChange={(e) => setItemForm({ ...itemForm, unit_of_measure: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Reorder Level Alert</label>
                  <input
                    type="number"
                    value={itemForm.reorder_level}
                    onChange={(e) => setItemForm({ ...itemForm, reorder_level: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {!editingItem && (
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Opening Stock Quantity</label>
                  <input
                    type="number"
                    value={itemForm.quantity_in_stock}
                    onChange={(e) => setItemForm({ ...itemForm, quantity_in_stock: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Buying Price / Cost (KES) *</label>
                  <input
                    type="number"
                    required
                    value={itemForm.unit_buying_price}
                    onChange={(e) => setItemForm({ ...itemForm, unit_buying_price: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Selling Price (KES)</label>
                  <input
                    type="number"
                    value={itemForm.selling_price}
                    onChange={(e) => setItemForm({ ...itemForm, selling_price: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddItemModal(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm cursor-pointer">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Direct Sale */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Record Direct Sale</h3>
              <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleRecordTransaction('SALE'); }} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Item to Sell *</label>
                <select
                  required
                  value={txForm.item_id}
                  onChange={(e) => {
                    const sel = itemsData.items.find(i => i.id === e.target.value);
                    setTxForm({
                      ...txForm,
                      item_id: e.target.value,
                      unit_price: String(sel?.selling_price || sel?.unit_buying_price || 0),
                      total_amount: String((parseFloat(txForm.quantity) || 1) * Number(sel?.selling_price || sel?.unit_buying_price || 0))
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                >
                  <option value="">Select stock item</option>
                  {itemsData.items.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (In Stock: {i.quantity_in_stock} {i.unit_of_measure})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer / Buyer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parent - Mary Wanjiku"
                  value={txForm.issued_to}
                  onChange={(e) => setTxForm({ ...txForm, issued_to: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={txForm.quantity}
                    onChange={(e) => {
                      const q = parseFloat(e.target.value) || 0;
                      const u = parseFloat(txForm.unit_price) || 0;
                      setTxForm({ ...txForm, quantity: e.target.value, total_amount: String(q * u) });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Unit Price (KES)</label>
                  <input
                    type="number"
                    value={txForm.unit_price}
                    onChange={(e) => {
                      const u = parseFloat(e.target.value) || 0;
                      const q = parseFloat(txForm.quantity) || 0;
                      setTxForm({ ...txForm, unit_price: e.target.value, total_amount: String(q * u) });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Total Amount (KES)</label>
                  <input
                    type="number"
                    readOnly
                    value={txForm.total_amount}
                    className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-lg font-mono font-bold text-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Payment Method</label>
                  <select
                    value={txForm.payment_method}
                    onChange={(e) => setTxForm({ ...txForm, payment_method: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option>M-Pesa</option>
                    <option>Cash</option>
                    <option>Bank Deposit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Bought 2 school ties"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowSaleModal(false)} className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm cursor-pointer">Record Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue to Department */}
      {showInternalIssueModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Issue Items to Department</h3>
              <button onClick={() => setShowInternalIssueModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleRecordTransaction('INTERNAL_ISSUE'); }} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Item to Issue *</label>
                <select
                  required
                  value={txForm.item_id}
                  onChange={(e) => {
                    const sel = itemsData.items.find(i => i.id === e.target.value);
                    setTxForm({
                      ...txForm,
                      item_id: e.target.value,
                      unit_price: String(sel?.unit_buying_price || 0)
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                >
                  <option value="">Select stock item</option>
                  {itemsData.items.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Available: {i.quantity_in_stock} {i.unit_of_measure})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Recipient Department *</label>
                  <select
                    value={txForm.recipient_department}
                    onChange={(e) => setTxForm({ ...txForm, recipient_department: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option>Kitchen / Catering</option>
                    <option>Examination Office</option>
                    <option>Science Department</option>
                    <option>Administration / Accounts</option>
                    <option>Boarding / Sanitation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Person Receiving *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Head Cook / Teacher"
                    value={txForm.issued_to}
                    onChange={(e) => setTxForm({ ...txForm, issued_to: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Quantity to Disburse *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={txForm.quantity}
                  onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Requisition Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly boarding food ration requisition"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowInternalIssueModal(false)} className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-sm cursor-pointer">Disburse Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Wastage */}
      {showWastageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-rose-900">Record Stock Wastage &amp; Damage</h3>
              <button onClick={() => setShowWastageModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleRecordTransaction('WASTAGE_DAMAGED'); }} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Damaged Item *</label>
                <select
                  required
                  value={txForm.item_id}
                  onChange={(e) => {
                    const sel = itemsData.items.find(i => i.id === e.target.value);
                    setTxForm({
                      ...txForm,
                      item_id: e.target.value,
                      unit_price: String(sel?.unit_buying_price || 0),
                      total_amount: String((parseFloat(txForm.quantity) || 1) * Number(sel?.unit_buying_price || 0))
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                >
                  <option value="">Select stock item</option>
                  {itemsData.items.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Stock: {i.quantity_in_stock} {i.unit_of_measure})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Quantity Lost / Damaged *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={txForm.quantity}
                    onChange={(e) => {
                      const q = parseFloat(e.target.value) || 0;
                      const u = parseFloat(txForm.unit_price) || 0;
                      setTxForm({ ...txForm, quantity: e.target.value, total_amount: String(q * u) });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Estimated Loss Value</label>
                  <input
                    type="number"
                    readOnly
                    value={txForm.total_amount}
                    className="w-full p-2 bg-rose-50 border border-rose-200 rounded-lg font-mono font-bold text-rose-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Reason for Write-off *</label>
                <select
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="Perishable Spoilage / Rotten">Perishable Spoilage / Rotten</option>
                  <option value="Expired Chemicals / Consumables">Expired Chemicals / Consumables</option>
                  <option value="Broken Glassware / Laboratory Damage">Broken Glassware / Laboratory Damage</option>
                  <option value="Pest / Rodent Infestation">Pest / Rodent Infestation</option>
                  <option value="Water Damage / Rain Seepage">Water Damage / Rain Seepage</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowWastageModal(false)} className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm cursor-pointer">Write-off Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Direct Stock Adjustment */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Physical Stock Count Adjustment</h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleRecordTransaction('STOCK_ADJUSTMENT'); }} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Item to Adjust *</label>
                <select
                  required
                  value={txForm.item_id}
                  onChange={(e) => {
                    const sel = itemsData.items.find(i => i.id === e.target.value);
                    setTxForm({
                      ...txForm,
                      item_id: e.target.value,
                      quantity: String(sel?.quantity_in_stock || 0)
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                >
                  <option value="">Select stock item</option>
                  {itemsData.items.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Current: {i.quantity_in_stock} {i.unit_of_measure})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Verified Physical Count (New Stock) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={txForm.quantity}
                  onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Auditor / Reason for Variance</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Term 3 physical stock audit verification"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdjustmentModal(false)} className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-sm cursor-pointer">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};