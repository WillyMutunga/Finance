import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import {
  School,
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  CreditCard,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  RefreshCw,
  ExternalLink,
  Edit,
  X,
  Lock,
  Trash2
} from 'lucide-react';

interface SchoolsManagementViewProps {
  onSwitchSchool?: (schoolId: string, schoolName: string) => void;
}

export const SchoolsManagementView: React.FC<SchoolsManagementViewProps> = ({ onSwitchSchool }) => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);

  // New School Form State
  const [newSchool, setNewSchool] = useState({
    name: '',
    slug: '',
    county: '',
    code: '',
    motto: 'Excellence and Integrity',
    currency: 'KES',
    mpesa_paybill: '',
    email: '',
    phone: '',
    address: '',
    admin_name: '',
    admin_username: 'admin',
    admin_email: '',
    admin_password: 'Admin@2026!',
    admin_phone: ''
  });

  const currentTenantId = ApiService.getTenantId();

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getSchools();
      if (res?.data) {
        setSchools(res.data);
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Failed to load schools directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleNameChange = (name: string) => {
    const words = name.trim().split(/\s+/);
    const suggestedSlug = words[0] ? words[0].toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    setNewSchool(prev => ({
      ...prev,
      name,
      slug: prev.slug && prev.slug !== suggestedSlug ? prev.slug : suggestedSlug
    }));
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name.trim()) {
      showToast('School Name is required', 'error');
      return;
    }
    setOnboarding(true);
    try {
      const res = await ApiService.createSchool(newSchool);
      showToast(res.message || 'School onboarded successfully!', 'success');
      setShowOnboardModal(false);
      setNewSchool({
        name: '',
        slug: '',
        county: '',
        code: '',
        motto: 'Excellence and Integrity',
        currency: 'KES',
        mpesa_paybill: '',
        email: '',
        phone: '',
        address: '',
        admin_name: '',
        admin_username: 'admin',
        admin_email: '',
        admin_password: 'Admin@2026!',
        admin_phone: ''
      });
      loadSchools();
    } catch (err: any) {
      showToast(err.message || 'Failed to onboard school', 'error');
    } finally {
      setOnboarding(false);
    }
  };

  const [schoolToDelete, setSchoolToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteSchool = async () => {
    if (!schoolToDelete) return;
    setDeleting(true);
    try {
      const res = await ApiService.deleteSchool(schoolToDelete.id);
      showToast(res.message || `School '${schoolToDelete.name}' deleted successfully!`, 'success');
      setSchoolToDelete(null);
      loadSchools();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete school', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSwitchContext = (school: any) => {
    ApiService.setTenantId(school.id);
    showToast(`Switched active workspace to ${school.name}!`, 'success');
    if (onSwitchSchool) {
      onSwitchSchool(school.id, school.name);
    } else {
      window.location.reload();
    }
  };

  const filteredSchools = schools.filter(s =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.slug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.county || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.mpesa_paybill || '').includes(searchQuery)
  );

  const totalStudents = schools.reduce((acc, s) => acc + parseInt(s.student_count || 0), 0);
  const totalUsers = schools.reduce((acc, s) => acc + parseInt(s.user_count || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-slideUp border ${
            toastMsg.type === 'error' ? 'bg-rose-700 border-rose-500' : 'bg-emerald-700 border-emerald-500'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-200" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          )}
          <span className="text-sm font-semibold">{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Multi-Tenant Institutional Platform
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            School Directory & Onboarding Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Onboard new schools, provision automated votehead charts, and manage institutional tenant accounts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSchools}
            className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Onboard New School
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Schools</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{schools.length}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">100% Active Tenants</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <School className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enrolled Students</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalStudents.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all institutions</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Staff Users</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalUsers}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Bursars, Admins, Auditors</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Workspace</div>
            <div className="text-sm font-black text-emerald-800 mt-1 truncate max-w-[150px]">
              {schools.find(s => s.id === currentTenantId)?.name || 'Nduundune Secondary'}
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
              @{schools.find(s => s.id === currentTenantId)?.slug || 'nduundune'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by school name, username slug (@slug), county, or Paybill number..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
          />
        </div>
      </div>

      {/* Schools Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map(school => {
          const isCurrentActive = school.id === currentTenantId;

          return (
            <div
              key={school.id}
              className={`bg-white rounded-3xl border transition-all duration-200 p-6 flex flex-col justify-between space-y-5 shadow-sm hover:shadow-md ${
                isCurrentActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-emerald-700 flex items-center justify-center font-black text-lg border border-slate-200">
                      {school.name ? school.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-base leading-snug">{school.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold rounded-md border border-emerald-200">
                          @{school.slug || school.subdomain}
                        </span>
                        {isCurrentActive && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-full">
                            Active Workspace
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {school.motto && (
                  <p className="text-xs text-slate-500 italic mt-3 line-clamp-1">"{school.motto}"</p>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">County</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" /> {school.county || 'Not Specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">M-Pesa Paybill</span>
                    <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                      {school.mpesa_paybill || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Students</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      {school.student_count || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Staff Users</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      {school.user_count || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2.5">
                <button
                  onClick={() => handleSwitchContext(school)}
                  disabled={isCurrentActive}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isCurrentActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer shadow-sm'
                  }`}
                >
                  {isCurrentActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Current School
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5" /> Switch to School
                    </>
                  )}
                </button>

                {school.id !== 'a0000000-0000-0000-0000-000000000001' && (
                  <button
                    onClick={() => setSchoolToDelete(school)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-colors"
                    title={`Delete '${school.name}'`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {schoolToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Delete School Workspace?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong className="text-slate-800">{schoolToDelete.name}</strong> (@{schoolToDelete.slug || schoolToDelete.subdomain})? All associated users, terms, vote heads, and records for this school will be removed.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setSchoolToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSchool}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete School'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONBOARD NEW SCHOOL MODAL */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Onboard New Educational Institution</h3>
                  <p className="text-xs text-slate-500">Auto-seeds standard MoE votehead charts & provisions initial School Admin</p>
                </div>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleOnboardSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Step 1: School Identity */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <School className="w-4 h-4" /> 1. Institution Identity & Registration
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">School Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Machakos Boys High School"
                      value={newSchool.name}
                      onChange={e => handleNameChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      School Slug / Username Suffix *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold">@</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. machakos"
                        value={newSchool.slug}
                        onChange={e => setNewSchool({ ...newSchool, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-mono font-bold"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">Staff logins will end with: <code className="text-emerald-700 font-bold">@{newSchool.slug || 'slug'}</code></span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">County / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Machakos"
                      value={newSchool.county}
                      onChange={e => setNewSchool({ ...newSchool, county: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">M-Pesa Paybill / Till Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 522123"
                      value={newSchool.mpesa_paybill}
                      onChange={e => setNewSchool({ ...newSchool, mpesa_paybill: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">School Motto</label>
                    <input
                      type="text"
                      placeholder="e.g. Strive for Academic Excellence"
                      value={newSchool.motto}
                      onChange={e => setNewSchool({ ...newSchool, motto: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Initial School Admin User */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> 2. Initial School Administrator Account
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Admin Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Peter Musyoka"
                      value={newSchool.admin_name}
                      onChange={e => setNewSchool({ ...newSchool, admin_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Admin Username *</label>
                    <div className="flex">
                      <input
                        type="text"
                        required
                        placeholder="admin"
                        value={newSchool.admin_username}
                        onChange={e => setNewSchool({ ...newSchool, admin_username: e.target.value })}
                        className="w-full px-4 py-2.5 border border-r-0 border-slate-200 rounded-l-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm font-bold"
                      />
                      <span className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-r-xl text-xs font-mono font-bold text-slate-600 flex items-center whitespace-nowrap">
                        @{newSchool.slug || 'slug'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Password *</label>
                    <input
                      type="text"
                      required
                      value={newSchool.admin_password}
                      onChange={e => setNewSchool({ ...newSchool, admin_password: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Admin Contact Phone</label>
                    <input
                      type="text"
                      placeholder="0712345678"
                      value={newSchool.admin_phone}
                      onChange={e => setNewSchool({ ...newSchool, admin_phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-Seeding Notice Banner */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automated Institutional Seeding
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Upon creation, the system will automatically configure default MoE votehead charts (Tuition, Operations, Boarding, RMI, Activity, Transport) and Academic Year 2026 for this school.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboarding}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition cursor-pointer"
                >
                  {onboarding ? 'Provisioning School...' : 'Provision & Onboard School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};