import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './pages/DashboardView';
import { StudentsView } from './pages/StudentsView';
import { FeesView } from './pages/FeesView';
import { PaymentsView } from './pages/PaymentsView';
import { ExpensesView } from './pages/ExpensesView';
import { OtherIncomeView } from './pages/OtherIncomeView';
import { IntegrationsView } from './pages/IntegrationsView';
import { AccountingView } from './pages/AccountingView';
import { StaffPayrollView } from './pages/StaffPayrollView';
import { StoresInventoryView } from './pages/StoresInventoryView';
import { PocketMoneyView } from './pages/PocketMoneyView';
import { ReportsView } from './pages/ReportsView';
import { TransportView } from './pages/TransportView';
import { MessagingView } from './pages/MessagingView';
import { AssetsRegisterView } from './pages/AssetsRegisterView';
import { ConfigurationsView } from './pages/ConfigurationsView';
import { AuditView } from './pages/AuditView';
import { ParentPortalView } from './pages/ParentPortalView';
import { LoginView } from './pages/LoginView';
import { BankReconciliationView } from './pages/BankReconciliationView';
import { PromotionWizardView } from './pages/PromotionWizardView';
import { SponsorsAndDiscountsView } from './pages/SponsorsAndDiscountsView';
import { ClearanceManagementView } from './pages/ClearanceManagementView';
import { KitchenRationsView } from './pages/KitchenRationsView';
import { PublicDocumentVerificationView } from './pages/PublicDocumentVerificationView';
import { SchoolsManagementView } from './pages/SchoolsManagementView';
import { ApiService } from './services/api';
import { MessageCircle } from 'lucide-react';

export function App() {
  // Always default to false so the user must log in first when the app loads
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('bursar');

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [unreconciledCount, setUnreconciledCount] = useState<number>(1);
  const [schoolName, setSchoolName] = useState('NDUUNDUNE SECONDARY SCHOOL');
  const [schoolCode, setSchoolCode] = useState('NDU001');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    // Restore session if active
    const token = sessionStorage.getItem('skysoft_auth_token') || localStorage.getItem('skysoft_auth_token');
    const userStr = sessionStorage.getItem('skysoft_auth_user') || localStorage.getItem('skysoft_auth_user');
    const schoolStr = sessionStorage.getItem('skysoft_school') || localStorage.getItem('skysoft_school');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setCurrentRole(user.role || 'bursar');
        ApiService.setToken(token);
        if (schoolStr) {
          const school = JSON.parse(schoolStr);
          if (school.name) setSchoolName(school.name);
          if (school.code) setSchoolCode(school.code);
          if (school.id) ApiService.setTenantId(school.id);
        }
      } catch (e) {
        console.error('Failed to restore session', e);
      }
    }
  }, []);

  useEffect(() => {
    // If role changed to parent, auto switch to parent-view
    if (currentRole === 'parent') {
      setActiveTab('parent-view');
    } else if (activeTab === 'parent-view') {
      setActiveTab('dashboard');
    }
  }, [currentRole]);

  const handleLoginSuccess = (user: any, token: string, school: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentRole(user.role || 'bursar');
    if (school?.name) setSchoolName(school.name);
    if (school?.code) setSchoolCode(school.code);
    if (school?.id) ApiService.setTenantId(school.id);

    ApiService.setToken(token);
    sessionStorage.setItem('skysoft_auth_token', token);
    sessionStorage.setItem('skysoft_auth_user', JSON.stringify(user));
    if (school) sessionStorage.setItem('skysoft_school', JSON.stringify(school));

    if (user.role === 'parent') {
      setActiveTab('parent-view');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSwitchSchool = (schoolId: string, name: string) => {
    ApiService.setTenantId(schoolId);
    setSchoolName(name);
    const stored = sessionStorage.getItem('skysoft_school') || localStorage.getItem('skysoft_school');
    if (stored) {
      try {
        const s = JSON.parse(stored);
        s.id = schoolId;
        s.name = name;
        sessionStorage.setItem('skysoft_school', JSON.stringify(s));
        localStorage.setItem('skysoft_school', JSON.stringify(s));
      } catch (e) {}
    }
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('skysoft_auth_token');
    sessionStorage.removeItem('skysoft_auth_user');
    sessionStorage.removeItem('skysoft_school');
    localStorage.removeItem('skysoft_auth_token');
    localStorage.removeItem('skysoft_auth_user');
    localStorage.removeItem('skysoft_school');
    ApiService.clearSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Public document verification route (accessible by any QR code scanner)
  if (window.location.pathname.startsWith('/verify')) {
    return <PublicDocumentVerificationView />;
  }

  // If user is not authenticated, present the professional Skysoft Finance login page
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#f4f6f8] font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 overflow-hidden">
      {/* Top Navbar with Sidebar Toggle */}
      <Navbar
        currentRole={currentRole}
        schoolName={schoolName}
        schoolCode={schoolCode}
        currentUser={currentUser}
        onLogout={handleLogout}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNavigate={(tab) => setActiveTab(tab)}
        onSwitchSchool={handleSwitchSchool}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Skysoft Collapsible Left Sidebar (hidden in dedicated parent mobile mode) */}
        {currentRole !== 'parent' ? (
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            currentRole={currentRole}
            unreconciledCount={unreconciledCount}
            isCollapsed={isSidebarCollapsed}
          />
        ) : null}

        {/* Main Workspace Area (Scrolls independently) */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0 custom-scrollbar">

          {activeTab === 'schools-directory' && (
            <SchoolsManagementView
              onSwitchSchool={(schoolId, name) => handleSwitchSchool(schoolId, name)}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              currentRole={currentRole}
              currentUser={currentUser}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              currentRole={currentRole}
              onRecordPaymentForStudent={() => setActiveTab('collections')}
            />
          )}

          {(activeTab === 'fees' || activeTab === 'invoicing') && <FeesView />}

          {(activeTab === 'payments' || activeTab === 'collections') && (
            <PaymentsView currentRole={currentRole} />
          )}

          {activeTab === 'expenses' && <ExpensesView currentRole={currentRole} />}

          {activeTab === 'other-income' && <OtherIncomeView />}

          {(activeTab === 'reconciliation' || activeTab === 'integrations') && (
            <IntegrationsView />
          )}

          {(activeTab === 'accounting' || activeTab.startsWith('accounting-')) && (
            <AccountingView
              initialSubTab={
                activeTab === 'accounting-vote-heads'
                  ? 'vote-heads'
                  : activeTab === 'accounting-accounts'
                  ? 'accounts'
                  : activeTab === 'accounting-take-ons'
                  ? 'take-ons'
                  : activeTab === 'accounting-transfers'
                  ? 'transfers'
                  : activeTab === 'accounting-budgets'
                  ? 'budgets'
                  : activeTab === 'accounting-journal'
                  ? 'journal'
                  : activeTab === 'accounting-general-ledger'
                  ? 'general-ledger'
                  : 'account-types'
              }
            />
          )}

          {(activeTab === 'staff' || activeTab === 'staff-management') && (
            <StaffPayrollView initialSubTab="staff-management" currentRole={currentRole} />
          )}

          {activeTab === 'payroll-management' && (
            <StaffPayrollView initialSubTab="payroll-management" currentRole={currentRole} />
          )}

          {activeTab === 'setup-configs' && (
            <StaffPayrollView initialSubTab="setup-configs" currentRole={currentRole} />
          )}

          {(activeTab === 'pocket-money' || activeTab === 'pledges') && (
            <PocketMoneyView currentRole={currentRole} />
          )}

          {(activeTab === 'reports' || activeTab.startsWith('reports-')) && (
            <ReportsView
              initialSubTab={
                activeTab === 'reports-summary'
                  ? 'summary-reports'
                  : activeTab === 'reports-financial'
                  ? 'financial-reports'
                  : activeTab === 'reports-ipsas'
                  ? 'ipsas-reports'
                  : activeTab === 'reports-aging'
                  ? 'aging-reports'
                  : 'student-reports'
              }
              currentRole={currentRole}
            />
          )}

          {activeTab.startsWith('inventory') && (
            <StoresInventoryView
              initialSubTab={
                activeTab === 'inventory-setup'
                  ? 'inventory-setup'
                  : activeTab === 'inventory-issuance'
                  ? 'inventory-issuance'
                  : activeTab === 'inventory-reports'
                  ? 'inventory-reports'
                  : 'inventory-register'
              }
              currentRole={currentRole}
            />
          )}

          {activeTab === 'bank-recon' && <BankReconciliationView onNavigate={setActiveTab} />}

          {activeTab === 'promotions' && <PromotionWizardView />}

          {activeTab === 'sponsors' && <SponsorsAndDiscountsView />}

          {activeTab === 'clearance' && <ClearanceManagementView />}

          {activeTab === 'kitchen-rations' && <KitchenRationsView />}

          {activeTab === 'transport' && <TransportView currentRole={currentRole} />}

          {activeTab === 'messaging' && <MessagingView currentRole={currentRole} />}

          {activeTab === 'assets' && <AssetsRegisterView currentRole={currentRole} />}

          {activeTab === 'configurations' && <ConfigurationsView currentRole={currentRole} />}

          {activeTab === 'audit' && <AuditView currentRole={currentRole} />}

          {activeTab === 'parent-view' && <ParentPortalView />}
        </main>
      </div>

      {/* Main System Footer - Always Sticky at Bottom */}
      <footer className="flex-shrink-0 border-t border-slate-200/90 bg-white px-6 py-3 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2.5 z-40 select-none shadow-[0_-1px_4px_rgba(0,0,0,0.03)]">
        {/* Far Left: Developed by Willy Mutunga */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Developed by <strong className="text-slate-900 font-extrabold">Willy Mutunga</strong></span>
        </div>

        {/* Center: System & Compliance Note */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <span>Skysoft Finance ERP</span>
          <span>•</span>
          <span>Republic of Kenya MoE Standard</span>
        </div>

        {/* Far Right: Powered by SkySoft Systems */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span>Powered by</span>
          <a
            href="https://skysoftsystems.co.ke"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline transition-colors"
          >
            SkySoft Systems
          </a>
        </div>
      </footer>

      {/* Floating WhatsApp / Support Icon */}
      <div className="fixed bottom-14 right-4 z-50">
        <button
          onClick={() => alert('Skysoft Support & Help Center: Available 24/7')}
          className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
          title="Skysoft Support Chat"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default App;

