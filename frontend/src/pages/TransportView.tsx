import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ApiService } from '../services/api';
import {
  Bus,
  Plus,
  MapPin,
  Users,
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  FileSpreadsheet,
  Printer,
  X,
  ChevronDown,
  AlertCircle,
  Calendar,
  DollarSign,
  Fuel,
  Wrench,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface TransportViewProps {
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

export const TransportView: React.FC<TransportViewProps> = ({ currentRole }) => {
  const [activeTab, setActiveTab] = useState<'Vehicles' | 'Routes' | 'Student Routes' | 'Transport Logs'>('Vehicles');

  // Modal States
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Data States
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [studentRoutes, setStudentRoutes] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Forms
  const [newVehicle, setNewVehicle] = useState({
    reg_no: '',
    model: 'Isuzu NPR 51 Seater',
    capacity: 51,
    driver_name: '',
    driver_phone: '',
    status: 'Active',
    mileage: 0,
    insurance_expiry: ''
  });

  const [newRoute, setNewRoute] = useState({
    name: '',
    pickup_points: '',
    term_fee: 12000,
    vehicle_id: '',
    return_trip_type: 'TWO_WAY'
  });

  const [assignForm, setAssignForm] = useState({
    student_id: '',
    route_id: '',
    pickup_point: '',
    term_fee: 0
  });

  const [logForm, setLogForm] = useState({
    vehicle_id: '',
    log_type: 'FUEL',
    amount: 5000,
    odometer_reading: 0,
    vendor: 'TotalEnergies',
    notes: '',
    log_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [vRes, rRes, sRes, lRes, allStudentsRes] = await Promise.all([
        ApiService.getTransportVehicles(),
        ApiService.getTransportRoutes(),
        ApiService.getTransportStudents(),
        ApiService.getTransportLogs(),
        ApiService.getStudents()
      ]);
      if (vRes?.data) setVehicles(vRes.data);
      if (rRes?.data) setRoutes(rRes.data);
      if (sRes?.data) setStudentRoutes(sRes.data);
      if (lRes?.data) setLogs(lRes.data);
      if (allStudentsRes?.data) setStudentsList(allStudentsRes.data);
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

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.createTransportVehicle(newVehicle);
      showToast(res.message || 'Vehicle added successfully');
      setShowAddVehicleModal(false);
      setNewVehicle({ reg_no: '', model: 'Isuzu Bus', capacity: 51, driver_name: '', driver_phone: '', status: 'Active', mileage: 0, insurance_expiry: '' });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error creating vehicle');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await ApiService.deleteTransportVehicle(id);
      showToast('Vehicle deleted');
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.createTransportRoute(newRoute);
      showToast(res.message || 'Route added successfully');
      setShowAddRouteModal(false);
      setNewRoute({ name: '', pickup_points: '', term_fee: 12000, vehicle_id: '', return_trip_type: 'TWO_WAY' });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error creating route');
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    try {
      await ApiService.deleteTransportRoute(id);
      showToast('Route deleted');
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.assignTransportStudent(assignForm);
      showToast(res.message || 'Student assigned to route');
      setShowAssignStudentModal(false);
      setAssignForm({ student_id: '', route_id: '', pickup_point: '', term_fee: 0 });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error assigning student');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Remove student from this transport route?')) return;
    try {
      await ApiService.deleteTransportStudent(id);
      showToast('Student removed from route');
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.createTransportLog(logForm);
      showToast(res.message || 'Log recorded successfully');
      setShowLogModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording log');
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
              <Bus className="w-5 h-5" />
            </div>
            Transport Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage school buses, transport zones, student route allocations, and fuel maintenance logs
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
          {activeTab === 'Vehicles' && (
            <button
              onClick={() => setShowAddVehicleModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          )}
          {activeTab === 'Routes' && (
            <button
              onClick={() => setShowAddRouteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Route
            </button>
          )}
          {activeTab === 'Student Routes' && (
            <button
              onClick={() => setShowAssignStudentModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
            >
              <Users className="w-4 h-4" /> Assign Student
            </button>
          )}
          {activeTab === 'Transport Logs' && (
            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
            >
              <Fuel className="w-4 h-4" /> Record Log
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-8">
        {(['Vehicles', 'Routes', 'Student Routes', 'Transport Logs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 1. Vehicles Tab */}
      {activeTab === 'Vehicles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {vehicles.length === 0 ? (
            <ClipboardIllustration label="No vehicles added yet. Click 'Add Vehicle' to register school buses." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Reg No</th>
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4">Capacity</th>
                    <th className="px-6 py-4">Driver Details</th>
                    <th className="px-6 py-4">Routes</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-black text-slate-800">{v.reg_no}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{v.model}</td>
                      <td className="px-6 py-4 text-slate-600">{v.capacity} Seats</td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="font-semibold text-slate-800">{v.driver_name || 'Unassigned'}</div>
                        <div className="text-xs text-slate-400">{v.driver_phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{v.routes_count || 0} Routes</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          v.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Vehicle"
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

      {/* 2. Routes Tab */}
      {activeTab === 'Routes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {routes.length === 0 ? (
            <ClipboardIllustration label="No transport routes created yet. Click 'Add Route' to define zones & term fees." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Route Name</th>
                    <th className="px-6 py-4">Pickup / Dropoff Stages</th>
                    <th className="px-6 py-4">Term Fee</th>
                    <th className="px-6 py-4">Assigned Vehicle</th>
                    <th className="px-6 py-4">Subscribed Students</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routes.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        {r.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{r.pickup_points || '-'}</td>
                      <td className="px-6 py-4 font-black text-slate-800">KES {Number(r.term_fee).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{r.vehicle_reg || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-slate-600">{r.student_count || 0} Students</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteRoute(r.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Route"
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

      {/* 3. Student Routes Tab */}
      {activeTab === 'Student Routes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {studentRoutes.length === 0 ? (
            <ClipboardIllustration label="No students assigned to transport routes yet. Click 'Assign Student' to subscribe learners." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Route Zone</th>
                    <th className="px-6 py-4">Pickup Point</th>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Term Fee</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentRoutes.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{s.student_name}</div>
                        <div className="text-xs text-slate-400">Adm: {s.adm_no}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{s.class_name || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-700">{s.route_name}</td>
                      <td className="px-6 py-4 text-slate-600">{s.pickup_point || '-'}</td>
                      <td className="px-6 py-4 text-slate-700">{s.vehicle_reg || '-'}</td>
                      <td className="px-6 py-4 font-black text-slate-800">KES {Number(s.term_fee).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteStudent(s.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Remove Subscription"
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

      {/* 4. Transport Logs Tab */}
      {activeTab === 'Transport Logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {logs.length === 0 ? (
            <ClipboardIllustration label="No transport fuel or maintenance logs recorded yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Odometer</th>
                    <th className="px-6 py-4">Vendor / Station</th>
                    <th className="px-6 py-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 text-slate-600 font-medium">{l.log_date}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{l.vehicle_reg}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          l.log_type === 'FUEL' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {l.log_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800">KES {Number(l.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">{Number(l.odometer_reading || 0).toLocaleString()} KM</td>
                      <td className="px-6 py-4 text-slate-700">{l.vendor || '-'}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{l.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Vehicle */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Bus className="w-5 h-5 text-emerald-600" /> Add School Vehicle
              </h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Registration Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KDA 123X"
                  value={newVehicle.reg_no}
                  onChange={e => setNewVehicle({ ...newVehicle, reg_no: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Make & Model</label>
                  <input
                    type="text"
                    value={newVehicle.model}
                    onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={newVehicle.capacity}
                    onChange={e => setNewVehicle({ ...newVehicle, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Driver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Peter Otieno"
                    value={newVehicle.driver_name}
                    onChange={e => setNewVehicle({ ...newVehicle, driver_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Driver Phone</label>
                  <input
                    type="text"
                    placeholder="0712345678"
                    value={newVehicle.driver_phone}
                    onChange={e => setNewVehicle({ ...newVehicle, driver_phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Route */}
      {showAddRouteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" /> Add Transport Route
              </h3>
              <button onClick={() => setShowAddRouteModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Route Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Route A - Westlands / Parklands"
                  value={newRoute.name}
                  onChange={e => setNewRoute({ ...newRoute, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Pickup Points / Stages</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sarit Centre, Mpaka Rd, Aga Khan, Highridge"
                  value={newRoute.pickup_points}
                  onChange={e => setNewRoute({ ...newRoute, pickup_points: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Term Fee (KES) *</label>
                  <input
                    type="number"
                    required
                    value={newRoute.term_fee}
                    onChange={e => setNewRoute({ ...newRoute, term_fee: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Assigned Vehicle</label>
                  <select
                    value={newRoute.vehicle_id}
                    onChange={e => setNewRoute({ ...newRoute, vehicle_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Bus --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.reg_no} ({v.model})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Student */}
      {showAssignStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" /> Assign Student to Transport Route
              </h3>
              <button onClick={() => setShowAssignStudentModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Student *</label>
                <select
                  required
                  value={assignForm.student_id}
                  onChange={e => setAssignForm({ ...assignForm, student_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select Student --</option>
                  {studentsList.map((st: any) => (
                    <option key={st.id} value={st.id}>{st.first_name} {st.last_name} ({st.admission_number}) - {st.class_name || ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Route *</label>
                <select
                  required
                  value={assignForm.route_id}
                  onChange={e => {
                    const r = routes.find(rt => rt.id === e.target.value);
                    setAssignForm({
                      ...assignForm,
                      route_id: e.target.value,
                      term_fee: r ? Number(r.term_fee) : 0
                    });
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select Route --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} (KES {Number(r.term_fee).toLocaleString()})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Pickup Point</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarit Roundabout"
                    value={assignForm.pickup_point}
                    onChange={e => setAssignForm({ ...assignForm, pickup_point: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Term Fee (KES)</label>
                  <input
                    type="number"
                    value={assignForm.term_fee}
                    onChange={e => setAssignForm({ ...assignForm, term_fee: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignStudentModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Assign Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Log */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Fuel className="w-5 h-5 text-emerald-600" /> Record Fuel / Maintenance Log
              </h3>
              <button onClick={() => setShowLogModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vehicle *</label>
                <select
                  required
                  value={logForm.vehicle_id}
                  onChange={e => setLogForm({ ...logForm, vehicle_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select Bus --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.reg_no} ({v.model})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Log Type</label>
                  <select
                    value={logForm.log_type}
                    onChange={e => setLogForm({ ...logForm, log_type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="FUEL">Fuel / Diesel</option>
                    <option value="SERVICE">Scheduled Service</option>
                    <option value="REPAIR">Emergency Repair</option>
                    <option value="INSPECTION">NTSA / Speed Governor Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    required
                    value={logForm.amount}
                    onChange={e => setLogForm({ ...logForm, amount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Odometer Reading (KM)</label>
                  <input
                    type="number"
                    value={logForm.odometer_reading}
                    onChange={e => setLogForm({ ...logForm, odometer_reading: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vendor / Petrol Station</label>
                  <input
                    type="text"
                    value={logForm.vendor}
                    onChange={e => setLogForm({ ...logForm, vendor: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notes / Invoice Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Receipt #9841 - 40 Litres Diesel"
                  value={logForm.notes}
                  onChange={e => setLogForm({ ...logForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};