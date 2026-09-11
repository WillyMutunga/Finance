import React, { useState } from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Receipt,
  Coins,
  Cpu,
  BookOpen,
  UserCheck,
  BarChart3,
  Package,
  Bus,
  Wallet,
  MessageSquare,
  Building2,
  Sliders,
  Trash2,
  ChevronRight,
  Landmark,
  GraduationCap,
  HeartHandshake,
  FileCheck2,
  Utensils,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentRole: UserRole;
  unreconciledCount: number;
  isCollapsed?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
  hasSubmenu?: boolean;
  group: 'CORE FINANCE' | 'ACCOUNTING & AUDIT' | 'STUDENTS & OPS' | 'ADMINISTRATION';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentRole,
  unreconciledCount,
  isCollapsed = false
}) => {
  const [showStaffFlyout, setShowStaffFlyout] = useState(false);
  const [showReportsFlyout, setShowReportsFlyout] = useState(false);
  const [showInventoryFlyout, setShowInventoryFlyout] = useState(false);
  const [showAccountingFlyout, setShowAccountingFlyout] = useState(false);

  // Sticky accordion expand states
  const [expandedStaff, setExpandedStaff] = useState(activeTab.startsWith('staff') || activeTab === 'payroll-management' || activeTab === 'setup-configs');
  const [expandedReports, setExpandedReports] = useState(activeTab.startsWith('reports-'));
  const [expandedInventory, setExpandedInventory] = useState(activeTab.startsWith('inventory'));
  const [expandedAccounting, setExpandedAccounting] = useState(activeTab === 'accounting' || activeTab.startsWith('accounting-'));

  const rawMenuItems: MenuItem[] = [
    // Group 1: Core Finance
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'CORE FINANCE' },
    { id: 'students', label: 'Students', icon: Users, group: 'CORE FINANCE' },
    { id: 'invoicing', label: 'Invoicing', icon: FileText, group: 'CORE FINANCE' },
    { id: 'collections', label: 'Collections', icon: CreditCard, group: 'CORE FINANCE' },
    { id: 'bank-recon', label: 'Bank Statements', icon: Landmark, group: 'CORE FINANCE' },
    { id: 'expenses', label: 'Expenses', icon: Receipt, group: 'CORE FINANCE' },
    { id: 'other-income', label: 'Other Income', icon: Coins, group: 'CORE FINANCE' },

    // Group 2: Accounting & Audit
    { id: 'accounting', label: 'Accounting', icon: BookOpen, hasSubmenu: true, group: 'ACCOUNTING & AUDIT' },
    { id: 'reconciliation', label: 'Integrations', icon: Cpu, badge: unreconciledCount > 0 ? unreconciledCount : undefined, group: 'ACCOUNTING & AUDIT' },
    { id: 'audit', label: 'Deletion Logs / Audit', icon: Trash2, group: 'ACCOUNTING & AUDIT' },

    // Group 3: Students & Operations
    { id: 'promotions', label: 'Promotion Wizard', icon: GraduationCap, group: 'STUDENTS & OPS' },
    { id: 'sponsors', label: 'Siblings & Sponsors', icon: HeartHandshake, group: 'STUDENTS & OPS' },
    { id: 'clearance', label: 'Student Clearance', icon: FileCheck2, group: 'STUDENTS & OPS' },
    { id: 'pocket-money', label: 'Pocket Money', icon: Wallet, group: 'STUDENTS & OPS' },
    { id: 'transport', label: 'Transport', icon: Bus, group: 'STUDENTS & OPS' },

    // Group 4: Administration & Services
    { id: 'staff', label: 'Staff & Payroll', icon: UserCheck, hasSubmenu: true, group: 'ADMINISTRATION' },
    { id: 'reports-center', label: 'Reports', icon: BarChart3, hasSubmenu: true, group: 'ADMINISTRATION' },
    { id: 'inventory', label: 'Stores & Inventory', icon: Package, hasSubmenu: true, group: 'ADMINISTRATION' },
    { id: 'kitchen-rations', label: 'Kitchen Rations', icon: Utensils, group: 'ADMINISTRATION' },
    { id: 'messaging', label: 'Messaging', icon: MessageSquare, group: 'ADMINISTRATION' },
    { id: 'assets', label: 'Assets Register', icon: Building2, group: 'ADMINISTRATION' },
    { id: 'configurations', label: 'Configurations', icon: Sliders, group: 'ADMINISTRATION' },
  ];

  const menuItems = (() => {
    switch (currentRole) {
      case 'super_admin':
      case 'school_admin':
        return rawMenuItems;
      case 'bursar':
        return rawMenuItems.filter((item) => item.id !== 'configurations' && item.id !== 'audit');
      case 'head_teacher':
        return rawMenuItems.filter((item) =>
          ['dashboard', 'students', 'invoicing', 'expenses', 'staff', 'reports-center', 'messaging', 'audit'].includes(item.id)
        );
      case 'auditor':
        return rawMenuItems.filter((item) =>
          ['dashboard', 'collections', 'expenses', 'reconciliation', 'accounting', 'reports-center', 'audit'].includes(item.id)
        );
      case 'parent':
        return [];
      default:
        return rawMenuItems;
    }
  })();

  const groups: Array<'CORE FINANCE' | 'ACCOUNTING & AUDIT' | 'STUDENTS & OPS' | 'ADMINISTRATION'> = [
    'CORE FINANCE',
    'ACCOUNTING & AUDIT',
    'STUDENTS & OPS',
    'ADMINISTRATION'
  ];

  return (
    <aside className={`bg-white border-r border-slate-200/90 flex flex-col flex-shrink-0 select-none shadow-[1px_0_3px_rgba(0,0,0,0.02)] relative z-30 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className={`py-3 flex-1 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar ${
        isCollapsed ? 'px-1.5' : 'px-3'
      }`}>
        {groups.map((grp) => {
          const itemsInGrp = menuItems.filter((i) => i.group === grp);
          if (itemsInGrp.length === 0) return null;

          return (
            <div key={grp} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 pt-1 pb-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  {grp}
                </div>
              ) : (
                <div className="h-px bg-slate-100 my-2 mx-2" />
              )}

              <div className="space-y-0.5">
                {itemsInGrp.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.id ||
                    (item.id === 'accounting' && (activeTab === 'accounting' || activeTab.startsWith('accounting-'))) ||
                    (item.id === 'invoicing' && activeTab === 'fees') ||
                    (item.id === 'collections' && activeTab === 'payments') ||
                    (item.id === 'messaging' && activeTab === 'pledges') ||
                    (item.id === 'reports-center' && activeTab.startsWith('reports-')) ||
                    (item.id === 'staff' && (activeTab.startsWith('staff') || activeTab === 'payroll-management' || activeTab === 'setup-configs')) ||
                    (item.id === 'inventory' && activeTab.startsWith('inventory'));

                  const isStaff = item.id === 'staff';
                  const isReports = item.id === 'reports-center';
                  const isInventory = item.id === 'inventory';
                  const isAccounting = item.id === 'accounting';

                  const isExpanded =
                    (isStaff && expandedStaff) ||
                    (isReports && expandedReports) ||
                    (isInventory && expandedInventory) ||
                    (isAccounting && expandedAccounting);

                  return (
                    <div
                      key={item.id}
                      className="relative group"
                      onMouseEnter={() => {
                        if (isStaff) setShowStaffFlyout(true);
                        if (isReports) setShowReportsFlyout(true);
                        if (isInventory) setShowInventoryFlyout(true);
                        if (isAccounting) setShowAccountingFlyout(true);
                      }}
                      onMouseLeave={() => {
                        if (isStaff) setShowStaffFlyout(false);
                        if (isReports) setShowReportsFlyout(false);
                        if (isInventory) setShowInventoryFlyout(false);
                        if (isAccounting) setShowAccountingFlyout(false);
                      }}
                    >
                      <button
                        onClick={() => {
                          if (item.id === 'invoicing') onTabChange('fees');
                          else if (item.id === 'collections') onTabChange('payments');
                          else if (item.id === 'accounting') {
                            setExpandedAccounting(!expandedAccounting);
                            onTabChange('accounting-account-types');
                          } else if (item.id === 'reports-center') {
                            setExpandedReports(!expandedReports);
                            onTabChange('reports-student');
                          } else if (item.id === 'staff') {
                            setExpandedStaff(!expandedStaff);
                            onTabChange('staff-management');
                          } else if (item.id === 'inventory') {
                            setExpandedInventory(!expandedInventory);
                            onTabChange('inventory-register');
                          } else onTabChange(item.id);
                        }}
                        className={`w-full flex items-center ${
                          isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                        } rounded-xl text-xs transition-all duration-150 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/60'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                          <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && (
                          <div className="flex items-center gap-1">
                            {item.badge !== undefined && (
                              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                                {item.badge}
                              </span>
                            )}
                            {item.hasSubmenu && (
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-emerald-600' : 'text-slate-400'}`} />
                            )}
                          </div>
                        )}
                      </button>

                      {/* Floating Tooltip in Collapsed Mode */}
                      {isCollapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none animate-fadeIn">
                          <span>{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Sticky Inline Submenu (only in Expanded Mode) */}
                      {!isCollapsed && isStaff && expandedStaff && (
                        <div className="pl-6 pr-1 py-1 space-y-0.5 animate-fadeIn">
                          <button
                            onClick={() => onTabChange('setup-configs')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'setup-configs' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Setup & Configs
                          </button>
                          <button
                            onClick={() => onTabChange('staff-management')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'staff' || activeTab === 'staff-management' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Staff Management
                          </button>
                          <button
                            onClick={() => onTabChange('payroll-management')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'payroll-management' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Payroll Management
                          </button>
                        </div>
                      )}

                      {!isCollapsed && isReports && expandedReports && (
                        <div className="pl-6 pr-1 py-1 space-y-0.5 animate-fadeIn">
                          <button
                            onClick={() => onTabChange('reports-student')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'reports-student' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Student Reports
                          </button>
                          <button
                            onClick={() => onTabChange('reports-summary')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'reports-summary' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Summary Reports
                          </button>
                          <button
                            onClick={() => onTabChange('reports-financial')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'reports-financial' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Financial Reports
                          </button>
                          <button
                            onClick={() => onTabChange('reports-ipsas')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'reports-ipsas' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            IPSAS Reports
                          </button>
                          <button
                            onClick={() => onTabChange('reports-aging')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'reports-aging' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Aging Reports
                          </button>
                        </div>
                      )}

                      {!isCollapsed && isInventory && expandedInventory && (
                        <div className="pl-6 pr-1 py-1 space-y-0.5 animate-fadeIn">
                          <button
                            onClick={() => onTabChange('inventory-setup')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'inventory-setup' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Setup & Configs
                          </button>
                          <button
                            onClick={() => onTabChange('inventory-register')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'inventory' || activeTab === 'inventory-register' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Inventory Register
                          </button>
                          <button
                            onClick={() => onTabChange('inventory-issuance')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'inventory-issuance' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Item Issuance
                          </button>
                          <button
                            onClick={() => onTabChange('inventory-reports')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'inventory-reports' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Inventory Reports
                          </button>
                        </div>
                      )}

                      {!isCollapsed && isAccounting && expandedAccounting && (
                        <div className="pl-6 pr-1 py-1 space-y-0.5 animate-fadeIn">
                          <button
                            onClick={() => onTabChange('accounting-account-types')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'accounting-account-types' || activeTab === 'accounting' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Account Types
                          </button>
                          <button
                            onClick={() => onTabChange('accounting-vote-heads')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'accounting-vote-heads' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Vote Heads
                          </button>
                          <button
                            onClick={() => onTabChange('accounting-accounts')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'accounting-accounts' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Accounts
                          </button>
                          <button
                            onClick={() => onTabChange('accounting-take-ons')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'accounting-take-ons' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Take Ons
                          </button>
                          <button
                            onClick={() => onTabChange('accounting-transfers')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'accounting-transfers' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Transfers
                          </button>
                          <button
                            onClick={() => onTabChange('accounting-budgets')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'accounting-budgets' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Budgets
                          </button>
                          <button
                            onClick={() => onTabChange('accounting-journal')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'accounting-journal' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            Journal
                          </button>
                          <button
                            onClick={() => onTabChange('accounting-general-ledger')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              activeTab === 'accounting-general-ledger' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            General Ledger
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Status Card */}
      <div className={`p-2.5 border-t border-slate-100 bg-slate-50/70 transition-all ${
        isCollapsed ? 'flex items-center justify-center p-2' : 'p-3'
      }`}>
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="font-bold text-[11px] text-slate-800">Skysoft Cloud</span>
                <span className="text-[9px] text-slate-400 font-medium">PostgreSQL v16 • Online</span>
              </div>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-2xs" title="Skysoft Cloud Online">
            <ShieldCheck className="w-4 h-4" />
          </div>
        )}
      </div>
    </aside>
  );
};


