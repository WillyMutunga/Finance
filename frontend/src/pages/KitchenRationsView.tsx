import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { DailyRationLog, KitchenCostAnalysis } from '../types';
import {
  Utensils,
  TrendingDown,
  Calendar,
  DollarSign,
  Plus,
  BarChart3,
  Package,
  X
} from 'lucide-react';

export const KitchenRationsView: React.FC = () => {
  const [rationLogs, setRationLogs] = useState<DailyRationLog[]>([]);
  const [costAnalysis, setCostAnalysis] = useState<KitchenCostAnalysis[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('LUNCH');
  const [boarderCount, setBoarderCount] = useState('250');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantityUsed, setQuantityUsed] = useState('25');
  const [unitCost, setUnitCost] = useState('120');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, analRes, invRes] = await Promise.all([
        ApiService.getKitchenRations(),
        ApiService.getKitchenCostAnalysis(),
        ApiService.getInventoryItems()
      ]);
      if (logsRes.data) setRationLogs(logsRes.data);
      if (analRes.data) setCostAnalysis(analRes.data);
      if (invRes.data) setInventoryItems((invRes.data as any).items || (Array.isArray(invRes.data) ? invRes.data : []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogRation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.logKitchenRation({
        log_date: logDate,
        meal_type: mealType,
        boarder_count: parseInt(boarderCount) || 0,
        inventory_item_id: selectedItemId || null,
        quantity_used: parseFloat(quantityUsed) || 0,
        unit_cost: parseFloat(unitCost) || 0
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to log kitchen ration');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-emerald-600" />
            Kitchen Rations & Boarding Cost Calculator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track daily meal ingredient usage, auto-deduct stock from the Kitchen Store, and compute exact per-boarder meal costs.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Log Meal Ingredients
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Average Cost Per Boarder / Day</span>
          <div className="text-xl font-black text-emerald-700 mt-1">
            KES {costAnalysis.length > 0 ? (costAnalysis.reduce((a, b) => a + Number(b.cost_per_boarder), 0) / costAnalysis.length).toFixed(2) : '0.00'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Across active dining hall meal logs</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Food Consumption (Month)</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            KES {costAnalysis.reduce((a, b) => a + Number(b.daily_total_cost), 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Auto-deducted from Kitchen Inventory</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Active Boarder Count</span>
          <div className="text-xl font-black text-sky-700 mt-1">
            {costAnalysis.length > 0 ? costAnalysis[0].total_boarders : 250} Students
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Breakfast, Lunch, Dinner, Snack</span>
        </div>
      </div>

      {/* Daily Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Kitchen Ration Usage Log</h3>
        {rationLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No meal ration logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Meal</th>
                  <th className="py-2.5 px-3">Ingredient / Item</th>
                  <th className="py-2.5 px-3">Qty Used</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-3">Total Cost</th>
                  <th className="py-2.5 px-3">Boarders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rationLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{l.log_date}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
                        {l.meal_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{l.item_name || 'General Ration'}</td>
                    <td className="py-2.5 px-3">{l.quantity_used} {l.unit_of_measure || 'Kg'}</td>
                    <td className="py-2.5 px-3">KES {Number(l.unit_cost).toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-black text-emerald-800">KES {Number(l.total_cost).toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold text-sky-800">{l.boarder_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Ration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-600" />
                Log Daily Meal Ingredients
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogRation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Meal Type</label>
                  <select
                    value={mealType}
                    onChange={e => setMealType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                    <option value="SNACK">Snack</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Inventory Ingredient</label>
                <select
                  value={selectedItemId}
                  onChange={e => {
                    setSelectedItemId(e.target.value);
                    const itm = inventoryItems.find(i => i.id === e.target.value);
                    if (itm) setUnitCost(itm.unit_buying_price || '100');
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Select Store Item --</option>
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.quantity_in_stock} {i.unit_of_measure} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity Used</label>
                  <input
                    type="number"
                    value={quantityUsed}
                    onChange={e => setQuantityUsed(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Cost</label>
                  <input
                    type="number"
                    value={unitCost}
                    onChange={e => setUnitCost(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Boarder Count</label>
                  <input
                    type="number"
                    value={boarderCount}
                    onChange={e => setBoarderCount(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Log & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};