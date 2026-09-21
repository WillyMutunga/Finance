import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { Search, ChevronDown, Bell, School, LogOut, User, ShieldCheck, Sparkles, Building2, Menu, PanelLeftClose, PanelLeft, Check, Plus, Mail, Phone, Lock, CheckCircle2, X } from 'lucide-react';
import { ApiService } from '../services/api';

interface NavbarProps {
  currentRole: UserRole;
  schoolName: string;
  schoolCode: string;
  currentUser?: any;
  onLogout?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onNavigate?: (tab: string) => void;
  onSwitchSchool?: (schoolId: string, name: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  schoolName,
  schoolCode,
  currentUser,
  onLogout,
  isSidebarCollapsed = false,
  onToggleSidebar,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  onNavigate,
  onSwitchSchool
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [availableSchools, setAvailableSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileEmail(currentUser.email || '');
      setProfilePhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const handleOpenProfileModal = () => {
    setShowProfileMenu(false);
    setProfileName(currentUser?.name || '');
    setProfileEmail(currentUser?.email || '');
    setProfilePhone(currentUser?.phone || '');
    setProfilePassword('');
    setProfileConfirmPassword('');
    setProfileMsg(null);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!profileName.trim()) {
      setProfileMsg({ type: 'error', text: 'Full Name is required.' });
      return;
    }

    if (!profileEmail.trim()) {
      setProfileMsg({ type: 'error', text: 'Email address is required for 2FA OTP delivery.' });
      return;
    }

    if (profilePassword && profilePassword !== profileConfirmPassword) {
      setProfileMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (profilePassword && profilePassword.length < 6) {
      setProfileMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setSavingProfile(true);
    try {
      const res = await ApiService.updateProfile({
        id: currentUser?.id,
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        password: profilePassword ? profilePassword.trim() : undefined
      });

      if (res && res.status === 'success') {
        setProfileMsg({
          type: 'success',
          text: res.message || 'Profile updated successfully! 2FA OTPs will be sent to ' + profileEmail
        });
        // Update local session
        try {
          const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
          const updated = { ...authUser, name: profileName, email: profileEmail, phone: profilePhone };
          localStorage.setItem('auth_user', JSON.stringify(updated));
        } catch (e) {}

        setTimeout(() => {
          setShowProfileModal(false);
        }, 1500);
      } else {
        setProfileMsg({ type: 'error', text: res.message || 'Failed to update profile.' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Error updating profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchSchoolsForDropdown = async () => {
    if (currentRole !== 'super_admin') return;
    setLoadingSchools(true);
    try {
      const res = await ApiService.getSchools();
      if (res && res.data) {
        setAvailableSchools(res.data);
      }
    } catch (e) {
      console.error('Failed to load schools in navbar', e);
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleToggleSchoolDropdown = () => {
    if (currentRole === 'super_admin') {
      const nextState = !showSchoolDropdown;
      setShowSchoolDropdown(nextState);
      if (nextState) {
        fetchSchoolsForDropdown();
      }
    }
  };

  // Derive display initials & name
  const userName = currentUser?.name || 'Willy';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'W';

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'school_admin':
        return 'School Administrator';
      case 'head_teacher':
        return 'Principal / Head';
      case 'auditor':
        return 'Internal Auditor';
      case 'parent':
        return 'Parent / Guardian';
      case 'bursar':
      default:
        return 'School Bursar';
    }
  };

  const roleTitle = getRoleDisplay(currentRole || currentUser?.role || 'bursar');
  const currentTenantId = ApiService.getTenantId();

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-3 sm:px-4 md:px-5 flex items-center justify-between sticky top-0 z-40 shadow-[0_1px_4px_rgba(0,0,0,0.03)] select-none flex-shrink-0">
      {/* Left: Sidebar Toggle + Skysoft Finance Brand + School Tenant Pill */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Mobile Hamburger Drawer Toggle (Visible on < lg screens) */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none lg:hidden"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        )}

        {/* Desktop Sidebar Collapse Toggle Button (Visible on >= lg screens) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
            title={isSidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-5 h-5 text-emerald-600" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-slate-600" />
            )}
          </button>
        )}

        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-700 via-sky-600 to-emerald-500 flex items-center justify-center text-white font-black text-base sm:text-lg shadow-md shadow-sky-600/20">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm tracking-tight text-slate-900">SKYSOFT</span>
              <span className="font-extrabold text-xs tracking-wider bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">FINANCE</span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Institutional ERP</div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden md:block" />

        {/* Mobile Compact School Switcher Pill (Visible on < sm screens) */}
        <div className="relative sm:hidden">
          <button
            onClick={handleToggleSchoolDropdown}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold text-slate-800 transition-colors ${
              currentRole === 'super_admin' ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <Building2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            <span className="truncate max-w-[90px]">{schoolName.split(' ')[0]}</span>
            {currentRole === 'super_admin' && <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />}
          </button>
        </div>

        {/* Executive School Tenant Switcher (Visible on sm+ screens) */}
        <div className="relative">
          <div
            onClick={handleToggleSchoolDropdown}
            className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs text-slate-800 transition-all shadow-2xs group select-none ${
              currentRole === 'super_admin'
                ? 'bg-slate-50 hover:bg-slate-100 cursor-pointer border-slate-200/80'
                : 'bg-slate-50/70 border-slate-200/60 cursor-default'
            }`}
            title={currentRole === 'super_admin' ? 'Click to switch active school tenant' : 'Active School Workspace'}
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-xs leading-tight tracking-tight">
                  {schoolName ? schoolName.toUpperCase() : 'NDUUNDUNE SECONDARY SCHOOL'}
                </span>
                {currentRole === 'super_admin' && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                    Switch
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                Code: {schoolCode || 'NDU001'} • 2026 Term 1
              </span>
            </div>
            {currentRole === 'super_admin' && (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 ml-1 transition-colors" />
            )}
          </div>

          {/* Super Admin School Switcher Dropdown */}
          {showSchoolDropdown && currentRole === 'super_admin' && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-fadeIn text-xs">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Switch Active School</span>
                  <p className="text-[10px] text-slate-400">All financial reports & records will adjust instantly.</p>
                </div>
                <button
                  onClick={() => setShowSchoolDropdown(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="py-2 px-2 max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                {loadingSchools ? (
                  <div className="p-4 text-center text-slate-400 text-xs">Loading registered schools...</div>
                ) : availableSchools.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">No other schools found.</div>
                ) : (
                  availableSchools.map((s) => {
                    const isActive = s.id === currentTenantId || s.name.toUpperCase() === schoolName.toUpperCase();
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setShowSchoolDropdown(false);
                          if (onSwitchSchool) onSwitchSchool(s.id, s.name);
                        }}
                        className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-colors ${
                          isActive
                            ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 line-clamp-1">{s.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                              <span>@{s.slug || s.subdomain}</span>
                              <span>•</span>
                              <span>{s.county || 'Kenya'}</span>
                            </div>
                          </div>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="pt-2 px-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowSchoolDropdown(false);
                    if (onNavigate) onNavigate('schools-directory');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Open Schools Directory & Onboarding</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Search, Notification Bell, Role Pill & Profile */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        {currentRole !== 'parent' && (
          <div className="relative hidden lg:block w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students, invoices, M-Pesa..."
              className="w-full pl-8 pr-12 py-1.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
              ⌘K
            </span>
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Recent Alerts & Webhooks"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-fadeIn text-xs">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-900">System Notifications</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Live Feed</span>
              </div>
              <div className="py-2 px-3 space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">M-Pesa IPN Gateway Active</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Paybill 400222 listening for real-time fee settlements.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-sky-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">Ledger In Sync</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">88 database tables balanced & cryptographically verified.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Role Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-[11px] font-bold text-slate-700 shadow-2xs">
          <span className={`w-2 h-2 rounded-full ${
            currentRole === 'super_admin' ? 'bg-amber-500' :
            currentRole === 'auditor' ? 'bg-indigo-500' :
            currentRole === 'head_teacher' ? 'bg-purple-500' :
            currentRole === 'parent' ? 'bg-teal-500' : 'bg-emerald-500'
          }`}></span>
          <span>{roleTitle}</span>
        </div>

        {/* User Profile Avatar with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200 text-left focus:outline-none hover:opacity-90"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">{userName}</div>
              <div className="text-[10px] text-slate-400 font-medium">{roleTitle}</div>
            </div>
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {userInitials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn text-xs">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="font-bold text-slate-900">{userName}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{currentUser?.email || `${currentRole}@nduundune.ac.ke`}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[10px] border border-emerald-200/60">
                    {roleTitle}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Active Session</span>
                </div>
              </div>

              <div className="py-1 border-b border-slate-100">
                <button
                  onClick={handleOpenProfileModal}
                  className="w-full px-4 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold transition-colors text-left hover:text-emerald-700"
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>My Profile & 2FA Email</span>
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full px-4 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile & 2FA Email Configuration Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 px-6 py-5 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md text-emerald-400 border border-white/10 shadow-inner">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                    My Profile & 2FA Settings
                  </h2>
                  <p className="text-xs text-slate-300">
                    Configure your official name and 2FA OTP delivery email
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Institution & Role Banner */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="font-bold">{schoolName}</span>
                {schoolCode && <span className="text-[10px] text-slate-400 font-mono">({schoolCode})</span>}
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border bg-emerald-100 text-emerald-900 border-emerald-300">
                {roleTitle}
              </span>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {profileMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {profileMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Official Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Loki Kyuvi"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                    required
                  />
                </div>
              </div>

              {/* 2FA Delivery Email Address */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>2FA OTP Delivery Email</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-black px-2 py-0.5 rounded-md">
                    OTP Verification Inbox
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com or principal@ndwaani.ac.ke"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                    required
                  />
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  💡 <strong>Important:</strong> When you log in, your 6-digit One-Time Password (OTP) will be sent to this email address.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Phone Number (for SMS Alerts)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. 0712 345 678"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium font-mono"
                  />
                </div>
              </div>

              {/* Change Password (Optional) */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Change Password (Optional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoComplete="new-password"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={profileConfirmPassword}
                      onChange={(e) => setProfileConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold hover:from-emerald-700 hover:to-teal-800 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

