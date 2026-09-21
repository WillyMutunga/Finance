import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ApiService } from '../services/api';
import {
  Calendar,
  LayoutGrid,
  Shield,
  Hash,
  Users,
  CreditCard,
  Plus,
  CheckCircle2,
  X,
  ChevronRight,
  ArrowLeft,
  Clock,
  Search,
  MoreVertical,
  Save,
  Building,
  Bus,
  BookOpen,
  Sliders,
  Info,
  Check,
  Wrench,
  Sparkles,
  School,
  Phone,
  Mail,
  MapPin,
  Landmark,
  FileCheck
} from 'lucide-react';

interface ConfigurationsViewProps {
  currentRole: UserRole;
}

export const ConfigurationsView: React.FC<ConfigurationsViewProps> = ({ currentRole }) => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Configuration cards matching Screenshot: media_1788703850793.png
  const configCards = [
    {
      id: 'school-profile',
      title: 'School Profile & Letterhead',
      description: 'Configure official institution details, letterhead, MOE code, and bank accounts',
      icon: (
        <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-center text-emerald-600">
          <Building className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'academic-years',
      title: 'Academic years & Terms',
      description: 'Set-up and configure academic years and terms',
      icon: (
        <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-center text-emerald-600">
          <Calendar className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'classes',
      title: 'Classes & Streams',
      description: 'Add and manage active classes, streams, and graduated classes',
      icon: (
        <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-center text-emerald-600">
          <LayoutGrid className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'financial-years',
      title: 'Financial Years',
      description: 'Set-up and configure financial years',
      icon: (
        <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-center text-emerald-600">
          <Clock className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'role-management',
      title: 'Role Management',
      description: 'Set-up and configure permissions for users',
      icon: (
        <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-center text-emerald-600">
          <Shield className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'receipt-numbering',
      title: 'Receipt Numbering',
      description: 'Set-up and configure receipt numbers',
      icon: (
        <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-center text-emerald-600">
          <Hash className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'staff',
      title: 'Staff',
      description: 'Set-up and configure leave types and exit reasons',
      icon: (
        <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-center text-emerald-600">
          <Users className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'overpayment',
      title: 'Overpayment',
      description: 'Set-up and configure overpayment vote heads',
      icon: (
        <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-center text-emerald-600">
          <CreditCard className="w-5 h-5" />
        </div>
      ),
    },
  ];


  // 0. School Profile Data
  const [schoolProfile, setSchoolProfile] = useState<any>({
    name: 'NDUUNDUNE SECONDARY SCHOOL',
    code: 'NDU001',
    registration_number: '2040123',
    motto: 'Strive for Academic Excellence & Integrity',
    address: 'P.O. Box 100 - 90100, Machakos, Kenya',
    postal_address: 'P.O. Box 100 - 90100',
    county: 'Machakos County',
    phone: '+254 712 345 678',
    email: 'accounts@nduundune.ac.ke',
    currency: 'KES',
    mpesa_paybill: '522123',
    bank_name: 'Co-operative Bank of Kenya',
    bank_account_name: 'Nduundune Secondary School Fee Collection',
    bank_account_number: '01129000000000',
    bank_branch: 'Machakos Branch',
    sms_sender_id: 'NDUUNDUNE',
    logo_url: ''
  });
  const [loadingSchoolProfile, setLoadingSchoolProfile] = useState(false);
  const [savingSchoolProfile, setSavingSchoolProfile] = useState(false);

  const loadSchoolProfile = async () => {
    setLoadingSchoolProfile(true);
    try {
      const res = await ApiService.getSchoolProfile();
      if (res && res.data) {
        setSchoolProfile((prev: any) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Error loading school profile:', err);
    } finally {
      setLoadingSchoolProfile(false);
    }
  };

  // 1. Academic Years & Terms Data
  const [acadSubTab, setAcadSubTab] = useState<'years' | 'terms'>('years');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [newAcadName, setNewAcadName] = useState('');
  const [newAcadStart, setNewAcadStart] = useState('');
  const [newAcadEnd, setNewAcadEnd] = useState('');
  
  // Term Form Data
  const [newTermName, setNewTermName] = useState('Term 1');
  const [newTermAcadYearId, setNewTermAcadYearId] = useState('');
  const [newTermStart, setNewTermStart] = useState('');
  const [newTermEnd, setNewTermEnd] = useState('');
  const [newTermIsCurrent, setNewTermIsCurrent] = useState(false);
  const [savingAcad, setSavingAcad] = useState(false);
  const [savingTerm, setSavingTerm] = useState(false);

  // 2. Classes & Streams Data
  const [classesSubTab, setClassesSubTab] = useState<'active' | 'graduated'>('active');
  const [activeClasses, setActiveClasses] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<Array<{ id: number; name: string; gradYear: string }>>([]);
  const [newClassGradYear, setNewClassGradYear] = useState('');
  const [newClassGradMonth, setNewClassGradMonth] = useState('DECEMBER');
  
  // Class & Stream Form / Modals
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState(1);
  const [newClassDefaultStream, setNewClassDefaultStream] = useState('East');
  const [savingClass, setSavingClass] = useState(false);

  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [selectedClassForStream, setSelectedClassForStream] = useState<any>(null);
  const [newStreamName, setNewStreamName] = useState('');
  const [savingStream, setSavingStream] = useState(false);

  // General Notification Banner
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const loadAcademicData = async () => {
    try {
      const [yearsRes, termsRes] = await Promise.all([
        ApiService.getAcademicYears(),
        ApiService.getTerms()
      ]);
      if (yearsRes && yearsRes.data) {
        setAcademicYears(yearsRes.data);
        if (yearsRes.data.length > 0 && !newTermAcadYearId) {
          setNewTermAcadYearId(yearsRes.data[0].id);
        }
      }
      if (termsRes && termsRes.data) {
        setTerms(termsRes.data);
      }
    } catch (err) {
      console.error('Error loading academic data:', err);
    }
  };

  const loadClassesData = async () => {
    try {
      const res = await ApiService.getClasses();
      if (res && res.data) {
        setActiveClasses(res.data);
      }
    } catch (err) {
      console.error('Error loading classes data:', err);
    }
  };

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null);
  const [newResetPassword, setNewResetPassword] = useState('');

  const loadUsersData = async () => {
    setLoadingUsers(true);
    try {
      const res = await ApiService.getUsers();
      if (res && res.data) {
        setUsersList(res.data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (selectedSection === 'school-profile' || !selectedSection) {
      loadSchoolProfile();
    }
    if (selectedSection === 'academic-years') {
      loadAcademicData();
    } else if (selectedSection === 'classes') {
      loadClassesData();
    } else if (selectedSection === 'role-management') {
      loadUsersData();
    }
  }, [selectedSection]);

  // 3. Financial Years Data
  const [financialYears, setFinancialYears] = useState<Array<{ id: number; name: string; startDate: string; endDate: string; status: string }>>([]);
  const [newFyStart, setNewFyStart] = useState('');
  const [newFyEnd, setNewFyEnd] = useState('');

  // 4. Users / Role Management
  const [usersTab, setUsersTab] = useState<'Active' | 'Deactivated'>('Active');
  const [userSearch, setUserSearch] = useState('');
  const [usersList, setUsersList] = useState<Array<{ id: number; addedOn: string; username: string; name: string; phone: string; email: string; role: string }>>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', email: '', phone: '', password: '', role: 'bursar' });

  // 5. Receipt Numbering (media_1788704302681.png & media_1788704726925.png)
  const [collectionReceiptType, setCollectionReceiptType] = useState<'common' | 'different'>('common');
  const [nextReceiptNumber, setNextReceiptNumber] = useState('68297');
  const [voucherNumberType, setVoucherNumberType] = useState<'common' | 'different'>('different');
  const [voucherReceipts, setVoucherReceipts] = useState({
    schoolFund: '1',
    infrastructure: '1',
    tuition: '1',
    operations: '1',
  });
  const [bursaryReceiptType, setBursaryReceiptType] = useState<'common' | 'different'>('common');
  const [nextBursaryReceiptNumber, setNextBursaryReceiptNumber] = useState('68297');
  const [refundReceiptType, setRefundReceiptType] = useState<'common' | 'different'>('different');
  const [feeReversalsReceiptNumber, setFeeReversalsReceiptNumber] = useState('');
  const [feeRefundsReceiptNumber, setFeeRefundsReceiptNumber] = useState('');

  // 6. Staff Configurations (Screenshot 6: media_1788704412789.png)
  const [staffConfigTab, setStaffConfigTab] = useState<'leave-types' | 'exit-reasons'>('leave-types');
  const [leaveTypes, setLeaveTypes] = useState([
    { id: 1, name: 'Annual Leave', maxAccrual: '-', paid: 'YES', maxBalance: '21', maxCarryOver: '-', excludeSaturdays: 'YES', excludeSundays: 'YES', notes: 'Annual Leave' },
    { id: 2, name: 'Paternity Leave', maxAccrual: '-', paid: 'YES', maxBalance: '14', maxCarryOver: '-', excludeSaturdays: 'YES', excludeSundays: 'YES', notes: 'Paternity Leave' },
    { id: 3, name: 'Sick Leave', maxAccrual: '-', paid: 'YES', maxBalance: '30', maxCarryOver: '-', excludeSaturdays: 'YES', excludeSundays: 'YES', notes: 'Sick Leave' },
    { id: 4, name: 'Maternity Leave', maxAccrual: '-', paid: 'YES', maxBalance: '90', maxCarryOver: '-', excludeSaturdays: 'YES', excludeSundays: 'YES', notes: 'Maternity Leave' },
  ]);
  const [exitReasons, setExitReasons] = useState([
    { id: 1, name: 'Voluntary Resignation', notes: 'Standard resignation letter provided' },
    { id: 2, name: 'End of Contract Term', notes: 'Contract expired without renewal' },
    { id: 3, name: 'Retirement', notes: 'Attained mandatory retirement age' },
    { id: 4, name: 'Disciplinary Termination', notes: 'Board of Management decision' },
  ]);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState({
    name: '',
    paid: 'YES',
    maxBalance: '21',
    excludeSaturdays: 'YES',
    excludeSundays: 'YES',
    notes: '',
  });

  // 7. Overpayments Configuration (Screenshot 7: media_1788704451514.png)
  const [overpaymentVoteHeads, setOverpaymentVoteHeads] = useState<Array<{ id: number; name: string; type: string }>>([]);
  const [showOverpaymentConfigModal, setShowOverpaymentConfigModal] = useState(false);
  const [selectedOverpaymentVH, setSelectedOverpaymentVH] = useState('Fee Prepayment Reserve Account');

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 text-xs font-sans">
      {!selectedSection ? (
        /* 1. Main Grid Cards Layout (media_1788703850793.png) */
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-emerald-700 tracking-tight">Configurations</h1>
            <p className="text-xs text-slate-500 mt-0.5">Set-up and configure Skysoft Finance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
            {configCards.map((card) => (
              <div
                key={card.id}
                onClick={() => setSelectedSection(card.id)}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-emerald-500/60 transition-all cursor-pointer flex items-center gap-4 group"
              >
                {card.icon}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 2. Sub-Manager Views with Back Button */
        <div className="space-y-4 animate-fadeIn">
          {/* Back Navigation Bar */}
          <div>
            <button
              onClick={() => setSelectedSection(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition-colors"
            >
              <span>&lt;</span>
              <span>Back</span>
            </button>
          </div>

                    {/* SUB-VIEW 0: School Profile & Letterhead */}
          {selectedSection === 'school-profile' && (
            <div className="space-y-6">
              {/* Top Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Building className="w-5 h-5 text-emerald-600" />
                    <span>School Profile & Official Letterhead</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure institutional details, Ministry registration code, contact information, and bank accounts used across all printable documents and financial statements.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={savingSchoolProfile || loadingSchoolProfile}
                    onClick={async () => {
                      if (!schoolProfile.name?.trim()) {
                        alert('School Name is required.');
                        return;
                      }
                      setSavingSchoolProfile(true);
                      try {
                        const res = await ApiService.updateSchoolProfile(schoolProfile);
                        if (res && res.status === 'success') {
                          showNotification(res.message || 'School profile updated successfully!');
                          setSchoolProfile(res.data);
                        } else {
                          alert('Failed to update school profile.');
                        }
                      } catch (err: any) {
                        alert(err.message || 'Error saving school profile');
                      } finally {
                        setSavingSchoolProfile(false);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingSchoolProfile ? 'Saving Changes...' : 'Save Profile Details'}</span>
                  </button>
                </div>
              </div>

              {/* Notification Banner */}
              {feedbackMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    feedbackMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{feedbackMessage.text}</span>
                  </div>
                  <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Two Column Layout: Editor & Live Letterhead Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Editor Columns */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Card 1: School Identity */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <School className="w-4 h-4 text-emerald-600" />
                      <h2 className="text-sm font-bold text-slate-900">Institution Identity & Registration</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Official School Name *
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.name || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, name: e.target.value })}
                          placeholder="e.g. NDUUNDUNE SECONDARY SCHOOL"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          MOE / Registration Code
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.registration_number || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, registration_number: e.target.value })}
                          placeholder="e.g. 2040123"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          School System Code
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.code || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, code: e.target.value })}
                          placeholder="e.g. NDU001"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          School Motto / Mission Tagline
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.motto || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, motto: e.target.value })}
                          placeholder="e.g. Strive for Academic Excellence & Integrity"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Contact & Location */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <h2 className="text-sm font-bold text-slate-900">Postal, Location & Contact Details</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Postal Address (P.O. Box)
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.postal_address || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, postal_address: e.target.value })}
                          placeholder="e.g. P.O. Box 100 - 90100"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Town / County
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.county || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, county: e.target.value })}
                          placeholder="e.g. Machakos County, Kenya"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Formatted Letterhead Address
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.address || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, address: e.target.value })}
                          placeholder="e.g. P.O. Box 100 - 90100, Machakos, Kenya"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Official Phone Number
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.phone || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, phone: e.target.value })}
                          placeholder="e.g. +254 712 345 678"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Official Accounts / Finance Email
                        </label>
                        <input
                          type="email"
                          value={schoolProfile.email || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, email: e.target.value })}
                          placeholder="e.g. accounts@nduundune.ac.ke"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Bank & Fee Collection Channels */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Landmark className="w-4 h-4 text-emerald-600" />
                      <h2 className="text-sm font-bold text-slate-900">Official Banking & M-Pesa Channels</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Primary Bank Name
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.bank_name || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, bank_name: e.target.value })}
                          placeholder="e.g. Co-operative Bank of Kenya"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Bank Branch
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.bank_branch || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, bank_branch: e.target.value })}
                          placeholder="e.g. Machakos Branch"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Account Name
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.bank_account_name || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, bank_account_name: e.target.value })}
                          placeholder="e.g. Nduundune Secondary School Fee Collection"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.bank_account_number || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, bank_account_number: e.target.value })}
                          placeholder="e.g. 01129000000000"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          M-Pesa Paybill / Till Number
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.mpesa_paybill || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, mpesa_paybill: e.target.value })}
                          placeholder="e.g. 522123"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          SMS Sender ID (Branded SMS)
                        </label>
                        <input
                          type="text"
                          value={schoolProfile.sms_sender_id || ''}
                          onChange={(e) => setSchoolProfile({ ...schoolProfile, sms_sender_id: e.target.value })}
                          placeholder="e.g. NDUUNDUNE"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Letterhead & Document Preview */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Live Letterhead Preview */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-sm sticky top-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <h2 className="text-sm font-bold text-slate-900">Live Letterhead Preview</h2>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                        Real-time
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      This is how your school header appears on all generated Payment Vouchers, Fee Schedules, Official Receipts, and Financial Statements:
                    </p>

                    {/* Paper Mockup */}
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 text-slate-900 shadow-inner">
                      <div className="w-12 h-12 mx-auto bg-emerald-700 text-white rounded-full flex items-center justify-center font-black text-sm uppercase shadow-sm">
                        {(schoolProfile.name || 'SC').slice(0, 2)}
                      </div>
                      <h3 className="font-extrabold text-base tracking-tight text-slate-900 uppercase">
                        {schoolProfile.name || 'NDUUNDUNE SECONDARY SCHOOL'}
                      </h3>
                      {schoolProfile.motto && (
                        <p className="text-[11px] italic text-emerald-700 font-medium">
                          &ldquo;{schoolProfile.motto}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-slate-600 font-medium">
                        {schoolProfile.address || `${schoolProfile.postal_address || 'P.O. Box 100 - 90100'}, ${schoolProfile.county || 'Machakos, Kenya'}`} &bull; Tel: {schoolProfile.phone || '+254 712 345 678'}
                      </p>
                      <p className="text-xs font-semibold text-slate-700">
                        Email: {schoolProfile.email || 'accounts@nduundune.ac.ke'}
                        {schoolProfile.registration_number ? ` • MOE Reg: ${schoolProfile.registration_number}` : ''}
                      </p>
                      {schoolProfile.mpesa_paybill && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-200/80 px-2.5 py-1 rounded">
                            M-PESA PAYBILL: {schoolProfile.mpesa_paybill} &bull; {schoolProfile.bank_name || 'Bank'}: {schoolProfile.bank_account_number || 'A/C'}
                          </span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-300">
                        <span className="px-3 py-1 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-widest">
                          OFFICIAL DOCUMENT SAMPLE
                        </span>
                      </div>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                        <Info className="w-4 h-4" />
                        <span>System-wide Automatic Sync</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-emerald-800/90">
                        Editing these values dynamically updates all Ministry voucher forms, fee schedules, receipts, invoices, and bulk SMS sender headers across Skysoft Finance for all administrators, principals, and accountants.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        disabled={savingSchoolProfile || loadingSchoolProfile}
                        onClick={async () => {
                          if (!schoolProfile.name?.trim()) {
                            alert('School Name is required.');
                            return;
                          }
                          setSavingSchoolProfile(true);
                          try {
                            const res = await ApiService.updateSchoolProfile(schoolProfile);
                            if (res && res.status === 'success') {
                              showNotification(res.message || 'School profile updated successfully!');
                              setSchoolProfile(res.data);
                            } else {
                              alert('Failed to update school profile.');
                            }
                          } catch (err: any) {
                            alert(err.message || 'Error saving school profile');
                          } finally {
                            setSavingSchoolProfile(false);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{savingSchoolProfile ? 'Saving Changes...' : 'Save Profile & Letterhead Details'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 1: Academic years & Terms */}
          {selectedSection === 'academic-years' && (
            <div className="space-y-6">
              {/* Top Section Header with Sub-tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <span>Academic Years & Terms Configuration</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define active school years, term periods, and select which term is currently open for fee invoicing.
                  </p>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-semibold">
                  <button
                    onClick={() => setAcadSubTab('years')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      acadSubTab === 'years'
                        ? 'bg-white text-emerald-700 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Academic Years ({academicYears.length})
                  </button>
                  <button
                    onClick={() => setAcadSubTab('terms')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      acadSubTab === 'terms'
                        ? 'bg-white text-emerald-700 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Terms & Semesters ({terms.length})
                  </button>
                </div>
              </div>

              {/* Notification Banner */}
              {feedbackMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    feedbackMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{feedbackMessage.text}</span>
                  </div>
                  <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Tab 1: Academic Years */}
              {acadSubTab === 'years' && (
                <div className="space-y-6">
                  {/* Add Academic Year Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>Add New Academic Year</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Year Label (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 2026 or 2026/2027"
                          value={newAcadName}
                          onChange={(e) => setNewAcadName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                        <input
                          type="date"
                          value={newAcadStart}
                          onChange={(e) => {
                            setNewAcadStart(e.target.value);
                            if (!newAcadName && e.target.value) {
                              setNewAcadName(new Date(e.target.value).getFullYear().toString());
                            }
                          }}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
                        <input
                          type="date"
                          value={newAcadEnd}
                          onChange={(e) => setNewAcadEnd(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        disabled={savingAcad}
                        onClick={async () => {
                          if (!newAcadStart || !newAcadEnd) {
                            alert('Please select start and end dates.');
                            return;
                          }
                          setSavingAcad(true);
                          try {
                            const res = await ApiService.createAcademicYear({
                              name: newAcadName || new Date(newAcadStart).getFullYear().toString(),
                              start_date: newAcadStart,
                              end_date: newAcadEnd
                            });
                            if (res && res.status === 'success') {
                              showNotification(res.message || 'Academic Year saved successfully!');
                              setNewAcadName('');
                              setNewAcadStart('');
                              setNewAcadEnd('');
                              await loadAcademicData();
                            } else {
                              alert('Error saving academic year');
                            }
                          } catch (e: any) {
                            alert(e.message || 'Failed to create academic year');
                          } finally {
                            setSavingAcad(false);
                          }
                        }}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingAcad ? 'Saving...' : 'Save Academic Year'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Academic Years Table Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Configured Academic Years</h3>
                      <span className="text-xs text-slate-500 font-medium">{academicYears.length} Total Years</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 w-12 text-slate-500">#</th>
                            <th className="py-3 px-4">Academic Year</th>
                            <th className="py-3 px-4">Start Date</th>
                            <th className="py-3 px-4">End Date</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {academicYears.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                                No academic years found. Add your first academic year above.
                              </td>
                            </tr>
                          ) : (
                            academicYears.map((ay, index) => {
                              const isCurrent = ay.is_current === true || ay.is_current === 't' || ay.is_current === 1;
                              return (
                                <tr key={ay.id} className="hover:bg-slate-50">
                                  <td className="py-3.5 px-4 text-slate-500">{index + 1}.</td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                    <span>{ay.name || ay.year}</span>
                                    {isCurrent && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                        Current Year
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 font-mono text-slate-600">{ay.start_date || ay.startDate}</td>
                                  <td className="py-3.5 px-4 font-mono text-slate-600">{ay.end_date || ay.endDate}</td>
                                  <td className="py-3.5 px-4 text-center">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        isCurrent ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {isCurrent ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <button
                                      onClick={() => setAcadSubTab('terms')}
                                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold"
                                    >
                                      Manage Terms
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Terms & Semesters */}
              {acadSubTab === 'terms' && (
                <div className="space-y-6">
                  {/* Add Term Form Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>Add New Term / Semester</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Term Name *</label>
                        <select
                          value={newTermName}
                          onChange={(e) => setNewTermName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Term 1">Term 1</option>
                          <option value="Term 2">Term 2</option>
                          <option value="Term 3">Term 3</option>
                          <option value="Semester 1">Semester 1</option>
                          <option value="Semester 2">Semester 2</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year *</label>
                        <select
                          value={newTermAcadYearId}
                          onChange={(e) => setNewTermAcadYearId(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        >
                          {academicYears.map((ay) => (
                            <option key={ay.id} value={ay.id}>
                              {ay.name || ay.year}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                        <input
                          type="date"
                          value={newTermStart}
                          onChange={(e) => setNewTermStart(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
                        <input
                          type="date"
                          value={newTermEnd}
                          onChange={(e) => setNewTermEnd(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={newTermIsCurrent}
                          onChange={(e) => setNewTermIsCurrent(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span>Set as Current Active Term (Used for Fee Billing & Reporting)</span>
                      </label>

                      <button
                        disabled={savingTerm}
                        onClick={async () => {
                          if (!newTermName || !newTermStart || !newTermEnd) {
                            alert('Please fill all required fields: Term Name, Start Date, and End Date.');
                            return;
                          }
                          setSavingTerm(true);
                          try {
                            const res = await ApiService.createTerm({
                              name: newTermName,
                              academic_year_id: newTermAcadYearId,
                              start_date: newTermStart,
                              end_date: newTermEnd,
                              is_current: newTermIsCurrent
                            });
                            if (res && res.status === 'success') {
                              showNotification(res.message || `${newTermName} created successfully!`);
                              setNewTermStart('');
                              setNewTermEnd('');
                              setNewTermIsCurrent(false);
                              await loadAcademicData();
                            } else {
                              alert('Error saving term');
                            }
                          } catch (e: any) {
                            alert(e.message || 'Failed to create term');
                          } finally {
                            setSavingTerm(false);
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingTerm ? 'Saving...' : 'Save Term'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Terms Table Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">All Terms & Semesters</h3>
                      <span className="text-xs text-slate-500 font-medium">{terms.length} Total Terms</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 w-12 text-slate-500">#</th>
                            <th className="py-3 px-4">Term</th>
                            <th className="py-3 px-4">Academic Year</th>
                            <th className="py-3 px-4">Start Date</th>
                            <th className="py-3 px-4">End Date</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {terms.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                                No terms created yet. Add Term 1, Term 2, or Term 3 above.
                              </td>
                            </tr>
                          ) : (
                            terms.map((t, index) => {
                              const isCurrent = t.is_current === true || t.is_current === 't' || t.is_current === 1;
                              return (
                                <tr key={t.id} className="hover:bg-slate-50">
                                  <td className="py-3.5 px-4 text-slate-500">{index + 1}.</td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                    <span>{t.name}</span>
                                    {isCurrent && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        <span>ACTIVE TERM</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 font-semibold text-slate-700">{t.academic_year_name || 'Academic Year'}</td>
                                  <td className="py-3.5 px-4 font-mono text-slate-600">{t.start_date}</td>
                                  <td className="py-3.5 px-4 font-mono text-slate-600">{t.end_date}</td>
                                  <td className="py-3.5 px-4 text-center">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        isCurrent
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {isCurrent ? 'ACTIVE' : 'UPCOMING / CLOSED'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    {!isCurrent ? (
                                      <button
                                        onClick={async () => {
                                          try {
                                            const res = await ApiService.setActiveTerm(t.id);
                                            if (res && res.status === 'success') {
                                              showNotification(`Set ${t.name} as active term!`);
                                              await loadAcademicData();
                                            }
                                          } catch (e: any) {
                                            alert(e.message || 'Failed to activate term');
                                          }
                                        }}
                                        className="px-3 py-1 border border-emerald-600 hover:bg-emerald-50 text-emerald-700 rounded text-xs font-semibold shadow-xs"
                                      >
                                        Set as Active
                                      </button>
                                    ) : (
                                      <span className="text-emerald-700 font-bold text-xs">Currently Active</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 2: Classes & Streams */}
          {selectedSection === 'classes' && (
            <div className="space-y-6">
              {/* Header & Sub-tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-emerald-600" />
                    <span>Classes & Streams Management</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure school classes (e.g. Form 1 to Form 4, Grade 1 to 9), assign streams (East, West, North), and view enrolled students.
                  </p>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-semibold">
                    <button
                      onClick={() => setClassesSubTab('active')}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        classesSubTab === 'active'
                          ? 'bg-white text-emerald-700 font-bold shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Active Classes & Streams ({activeClasses.length})
                    </button>
                    <button
                      onClick={() => setClassesSubTab('graduated')}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        classesSubTab === 'graduated'
                          ? 'bg-white text-emerald-700 font-bold shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Graduated Classes ({classesList.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Banner */}
              {feedbackMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    feedbackMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{feedbackMessage.text}</span>
                  </div>
                  <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Tab 1: Active Classes & Streams */}
              {classesSubTab === 'active' && (
                <div className="space-y-6">
                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Class Structure</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {activeClasses.reduce((sum, c) => sum + (c.streams?.length || 0), 0)} Streams Configured
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (activeClasses.length === 0) {
                            alert('Please add a class first before adding a stream.');
                            return;
                          }
                          setSelectedClassForStream(activeClasses[0]);
                          setShowAddStreamModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg border border-slate-200 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Stream</span>
                      </button>

                      <button
                        onClick={() => setShowAddClassModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add Class</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Classes Grid */}
                  {activeClasses.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-4 shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                        <School className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900">No Active Classes Created Yet</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Get started by adding your school's classes (such as Form 1, Form 2, Form 3, Form 4) and their respective streams (East, West, etc.).
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAddClassModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Class</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      {activeClasses.map((cls, index) => {
                        const streamsList = cls.streams || [];
                        return (
                          <div
                            key={cls.id}
                            className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 text-sm">
                                  L{cls.level_order || index + 1}
                                </div>
                                <div>
                                  <h3 className="text-base font-bold text-slate-900">{cls.name}</h3>
                                  <p className="text-xs text-slate-500 font-medium">
                                    {cls.student_count || 0} Enrolled Students
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedClassForStream(cls);
                                  setShowAddStreamModal(true);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Stream</span>
                              </button>
                            </div>

                            <div className="space-y-2 pt-1">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Assigned Streams ({streamsList.length})
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {streamsList.length === 0 ? (
                                  <span className="text-xs text-slate-400 italic">
                                    No streams added yet. Click "+ Add Stream" to create one.
                                  </span>
                                ) : (
                                  streamsList.map((st: any) => (
                                    <span
                                      key={st.id || st.name}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5 group-hover:border-emerald-200"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      <span>{st.name}</span>
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Classes Table Overview */}
                  {activeClasses.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900">Summary Class Register</h3>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4 w-12 text-slate-500">#</th>
                              <th className="py-3 px-4">Class</th>
                              <th className="py-3 px-4">Level Order</th>
                              <th className="py-3 px-4">Streams</th>
                              <th className="py-3 px-4 text-center">Enrolled Students</th>
                              <th className="py-3 px-4 text-right">Quick Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {activeClasses.map((c, index) => (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="py-3.5 px-4 text-slate-500">{index + 1}.</td>
                                <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                                <td className="py-3.5 px-4 font-mono text-slate-600">Level {c.level_order || index + 1}</td>
                                <td className="py-3.5 px-4 text-slate-700">
                                  {(c.streams || []).map((s: any) => s.name).join(', ') || 'No streams'}
                                </td>
                                <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                                  {c.student_count || 0}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedClassForStream(c);
                                      setShowAddStreamModal(true);
                                    }}
                                    className="px-2.5 py-1 border border-emerald-600 hover:bg-emerald-50 text-emerald-700 rounded text-xs font-semibold"
                                  >
                                    + Add Stream
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

              {/* Tab 2: Graduated Classes */}
              {classesSubTab === 'graduated' && (
                <div className="space-y-6">
                  {/* Add Graduated Class Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-900">Add Graduated Class</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Year*</label>
                        <select
                          value={newClassGradYear}
                          onChange={(e) => setNewClassGradYear(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="">Select graduation year</option>
                          <option value="2029">2029</option>
                          <option value="2028">2028</option>
                          <option value="2027">2027</option>
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Month*</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={newClassGradMonth}
                            onChange={(e) => setNewClassGradMonth(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          if (!newClassGradYear) {
                            alert('Please select a graduation year.');
                            return;
                          }
                          setClassesList([
                            { id: Date.now(), name: `Class of ${newClassGradYear}`, gradYear: newClassGradYear },
                            ...classesList,
                          ]);
                          setNewClassGradYear('');
                        }}
                        className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Graduated Class</span>
                      </button>
                    </div>
                  </div>

                  {/* Table Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 w-12 text-slate-500">#</th>
                            <th className="py-3 px-4">Class</th>
                            <th className="py-3 px-4">Graduation Year</th>
                            <th className="py-3 px-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {classesList.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                                No graduated classes added yet.
                              </td>
                            </tr>
                          ) : (
                            classesList.map((c, index) => (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="py-3.5 px-4 text-slate-500">{index + 1}.</td>
                                <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                                <td className="py-3.5 px-4 font-mono text-slate-600">{c.gradYear}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    onClick={() => alert(`Showing historical records for ${c.name}`)}
                                    className="px-3 py-1 border border-emerald-600 hover:bg-emerald-50 text-emerald-700 rounded text-xs font-semibold"
                                  >
                                    View Archives
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal 1: Add New Class */}
              {showAddClassModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <School className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-base font-bold text-slate-900">Add New Class</h3>
                      </div>
                      <button
                        onClick={() => setShowAddClassModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Class Name * (e.g. Form 1, Form 2, Grade 7)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Form 1"
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Level Order</label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={newClassLevel}
                            onChange={(e) => setNewClassLevel(Number(e.target.value))}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Default Stream</label>
                          <input
                            type="text"
                            placeholder="e.g. East"
                            value={newClassDefaultStream}
                            onChange={(e) => setNewClassDefaultStream(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setShowAddClassModal(false)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={savingClass}
                        onClick={async () => {
                          if (!newClassName.trim()) {
                            alert('Please enter a class name.');
                            return;
                          }
                          setSavingClass(true);
                          try {
                            const res = await ApiService.createClass({
                              name: newClassName.trim(),
                              level_order: newClassLevel,
                              default_stream: newClassDefaultStream.trim() || undefined
                            });
                            if (res && res.status === 'success') {
                              showNotification(res.message || `Class ${newClassName} created successfully!`);
                              setShowAddClassModal(false);
                              setNewClassName('');
                              await loadClassesData();
                            } else {
                              alert('Error creating class');
                            }
                          } catch (e: any) {
                            alert(e.message || 'Failed to create class');
                          } finally {
                            setSavingClass(false);
                          }
                        }}
                        className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingClass ? 'Creating...' : 'Create Class'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal 2: Add Stream to Class */}
              {showAddStreamModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-base font-bold text-slate-900">Add Stream to Class</h3>
                      </div>
                      <button
                        onClick={() => setShowAddStreamModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class *</label>
                        <select
                          value={selectedClassForStream?.id || ''}
                          onChange={(e) => {
                            const found = activeClasses.find((c) => c.id === e.target.value);
                            setSelectedClassForStream(found || null);
                          }}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                        >
                          {activeClasses.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Stream Name * (e.g. West, North, South, Blue, Red)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. West"
                          value={newStreamName}
                          onChange={(e) => setNewStreamName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setShowAddStreamModal(false)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={savingStream}
                        onClick={async () => {
                          if (!selectedClassForStream || !newStreamName.trim()) {
                            alert('Please select a class and enter stream name.');
                            return;
                          }
                          setSavingStream(true);
                          try {
                            const res = await ApiService.createStream({
                              class_id: selectedClassForStream.id,
                              name: newStreamName.trim()
                            });
                            if (res && res.status === 'success') {
                              showNotification(res.message || `Stream ${newStreamName} added to ${selectedClassForStream.name}!`);
                              setShowAddStreamModal(false);
                              setNewStreamName('');
                              await loadClassesData();
                            } else {
                              alert('Error creating stream');
                            }
                          } catch (e: any) {
                            alert(e.message || 'Failed to create stream');
                          } finally {
                            setSavingStream(false);
                          }
                        }}
                        className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingStream ? 'Adding...' : 'Add Stream'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 3: Financial Years (media_1788704248571.png) */}
          {selectedSection === 'financial-years' && (
            <div className="space-y-6">
              {/* Add Financial Year Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900">Add Financial Year</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={newFyStart}
                      onChange={(e) => setNewFyStart(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={newFyEnd}
                      onChange={(e) => setNewFyEnd(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      if (!newFyStart || !newFyEnd) {
                        alert('Please select start and end dates.');
                        return;
                      }
                      setFinancialYears([
                        { id: Date.now(), name: '2027/2028', startDate: newFyStart, endDate: newFyEnd, status: 'OPEN' },
                        ...financialYears,
                      ]);
                      setNewFyStart('');
                      setNewFyEnd('');
                    }}
                    className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Financial Years Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Financial Year</th>
                        <th className="py-3 px-4">Start Date</th>
                        <th className="py-3 px-4">End Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {financialYears.map((fy) => (
                        <tr key={fy.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{fy.name}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{fy.startDate}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{fy.endDate}</td>
                          <td className="py-3.5 px-4 font-bold text-xs text-slate-800 uppercase">{fy.status}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button className="p-1 hover:bg-slate-100 rounded text-slate-500">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                  <span>Showing 1 to {financialYears.length} of {financialYears.length} entries</span>
                  <div className="flex items-center gap-3">
                    <span>Items per page:</span>
                    <select className="px-2 py-1 bg-white border border-slate-200 rounded font-bold">
                      <option>50</option>
                    </select>
                    <div className="flex items-center gap-2 font-semibold">
                      <button disabled className="opacity-40">Previous</button>
                      <span className="w-6 h-6 flex items-center justify-center rounded bg-emerald-600 text-white font-bold text-xs">1</span>
                      <button disabled className="opacity-40">Next</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: Role Management / Users & Access Control */}
          {selectedSection === 'role-management' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-6 shadow-sm">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Shield className="w-6 h-6 text-emerald-600" />
                      <span>User & Role Management</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Create system accounts, assign designated roles (Bursar, Principal, Auditor, Parent), and manage security privileges.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewUser({ name: '', username: '', email: '', phone: '', password: '', role: 'bursar' });
                      setShowAddUserModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add User</span>
                  </button>
                </div>

                {/* Role Privilege Matrix Overview Card */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="font-bold text-slate-900">Super Admin</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Unrestricted full control, configurations, ledger, and user management.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="font-bold text-slate-900">School Bursar</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Daily invoicing, fee collection, payment receipts, vouchers, and reconciliations.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span className="font-bold text-slate-900">Head Teacher</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Executive approvals (vouchers & fee waivers), analytics, SMS broadcasts & audit overview.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span className="font-bold text-slate-900">Internal Auditor</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Strictly read-only access to General Ledger, Trial Balance, Vouchers & compliance audit.</p>
                  </div>
                </div>

                {/* Sub-tabs: Active Users / Deactivated users */}
                <div className="border-b border-slate-200 flex items-center gap-8 text-xs font-semibold text-slate-600">
                  <button
                    onClick={() => setUsersTab('Active')}
                    className={`pb-3 transition-colors ${
                      usersTab === 'Active' ? 'text-emerald-700 font-bold border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Active Users ({usersList.filter((u: any) => u.is_active !== false).length})
                  </button>
                  <button
                    onClick={() => setUsersTab('Deactivated')}
                    className={`pb-3 transition-colors ${
                      usersTab === 'Deactivated' ? 'text-emerald-700 font-bold border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Deactivated Users ({usersList.filter((u: any) => u.is_active === false).length})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-xl">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or username..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Users Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 w-12 text-slate-500">#</th>
                        <th className="py-3 px-4">Added On</th>
                        <th className="py-3 px-4">Username / Email</th>
                        <th className="py-3 px-4">Full Name</th>
                        <th className="py-3 px-4">Contact Phone</th>
                        <th className="py-3 px-4 text-center">Assigned Role & Privilege</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {loadingUsers ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                            Loading system users...
                          </td>
                        </tr>
                      ) : usersList
                          .filter((u: any) => (usersTab === 'Active' ? u.is_active !== false : u.is_active === false))
                          .filter(
                            (u: any) =>
                              (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                              (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                              (u.username || '').toLowerCase().includes(userSearch.toLowerCase())
                          ).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                            {usersTab === 'Active'
                              ? 'No active users found. Click "+ Add User" above to onboard a user.'
                              : 'No deactivated users in the system.'}
                          </td>
                        </tr>
                      ) : (
                        usersList
                          .filter((u: any) => (usersTab === 'Active' ? u.is_active !== false : u.is_active === false))
                          .filter(
                            (u: any) =>
                              (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                              (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                              (u.username || '').toLowerCase().includes(userSearch.toLowerCase())
                          )
                          .map((u: any, index: number) => {
                            const getBadgeStyle = (role: string) => {
                              switch (role) {
                                case 'super_admin':
                                  return 'bg-amber-50 text-amber-800 border-amber-200';
                                case 'head_teacher':
                                  return 'bg-purple-50 text-purple-800 border-purple-200';
                                case 'auditor':
                                  return 'bg-indigo-50 text-indigo-800 border-indigo-200';
                                case 'parent':
                                  return 'bg-teal-50 text-teal-800 border-teal-200';
                                case 'school_admin':
                                  return 'bg-blue-50 text-blue-800 border-blue-200';
                                case 'bursar':
                                default:
                                  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                              }
                            };

                            const getRoleLabel = (role: string) => {
                              switch (role) {
                                case 'super_admin':
                                  return 'Super Admin';
                                case 'school_admin':
                                  return 'School Admin';
                                case 'head_teacher':
                                  return 'Head Teacher';
                                case 'auditor':
                                  return 'Auditor';
                                case 'parent':
                                  return 'Parent';
                                case 'bursar':
                                default:
                                  return 'Bursar';
                              }
                            };

                            return (
                              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3.5 px-4 text-slate-500">{index + 1}</td>
                                <td className="py-3.5 px-4 font-mono text-slate-600">{u.addedOn}</td>
                                <td className="py-3.5 px-4 text-slate-700 font-medium">
                                  <div className="font-bold text-slate-900">{u.username || u.email}</div>
                                  <div className="text-[11px] text-slate-400 lowercase">{u.email}</div>
                                </td>
                                <td className="py-3.5 px-4 font-bold text-slate-900 uppercase">{u.name}</td>
                                <td className="py-3.5 px-4 text-slate-600 font-mono">{u.phone || '-'}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${getBadgeStyle(u.role)}`}>
                                    <span>{getRoleLabel(u.role)}</span>
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                    {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      title="Reset Password"
                                      onClick={() => {
                                        setSelectedUserForReset(u);
                                        setNewResetPassword('');
                                        setShowResetPasswordModal(true);
                                      }}
                                      className="px-2 py-1 text-[11px] font-semibold border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
                                    >
                                      Reset Key
                                    </button>
                                    <button
                                      title={u.is_active ? 'Deactivate User' : 'Activate User'}
                                      onClick={async () => {
                                        const confirmMsg = u.is_active
                                          ? `Deactivate ${u.name}? They will not be able to log in.`
                                          : `Reactivate ${u.name}?`;
                                        if (confirm(confirmMsg)) {
                                          try {
                                            const res = await ApiService.updateUserStatus(u.id, !u.is_active);
                                            showNotification(res.message || 'User status updated.');
                                            await loadUsersData();
                                          } catch (e: any) {
                                            alert(e.message || 'Failed to update status');
                                          }
                                        }
                                      }}
                                      className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                                        u.is_active
                                          ? 'border border-amber-300 text-amber-700 hover:bg-amber-50'
                                          : 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                      }`}
                                    >
                                      {u.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    {u.role !== 'super_admin' && (
                                      <button
                                        title="Delete User"
                                        onClick={async () => {
                                          if (confirm(`Permanently delete user ${u.name}?`)) {
                                            try {
                                              const res = await ApiService.deleteUser(u.id);
                                              showNotification(res.message || 'User removed.');
                                              await loadUsersData();
                                            } catch (e: any) {
                                              alert(e.message || 'Failed to delete user');
                                            }
                                          }
                                        }}
                                        className="px-2 py-1 text-[11px] font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                  <span>Showing {usersList.filter((u: any) => (usersTab === 'Active' ? u.is_active !== false : u.is_active === false)).length} users</span>
                </div>
              </div>

              {/* Modal 1: Add New User with Specific Role */}
              {showAddUserModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Create New System User</h3>
                          <p className="text-[11px] text-slate-400">Specify user credentials and assign their system access role.</p>
                        </div>
                      </div>
                      <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newUser.name.trim() || !newUser.username.trim() || !newUser.password.trim()) {
                          alert('Please enter Full Name, Username, and Password.');
                          return;
                        }
                        setSavingUser(true);
                        try {
                          const activeSchoolObj = (() => {
                            try {
                              const s = sessionStorage.getItem('skysoft_school') || localStorage.getItem('skysoft_school');
                              return s ? JSON.parse(s) : null;
                            } catch (err) {
                              return null;
                            }
                          })();
                          const schoolSlug = activeSchoolObj?.slug || schoolProfile?.slug || (schoolProfile?.name ? schoolProfile.name.split(' ')[0].toLowerCase() : 'nduundune');
                          const cleanUserHandle = newUser.username.trim();
                          const fullUsername = cleanUserHandle.includes('@') ? cleanUserHandle : `${cleanUserHandle}@${schoolSlug}`;
                          const userEmail = newUser.email.trim() || fullUsername;

                          const res = await ApiService.createUser({
                            name: newUser.name.trim(),
                            username: fullUsername,
                            email: userEmail,
                            password: newUser.password.trim(),
                            phone: newUser.phone.trim(),
                            role: newUser.role
                          });
                          if (res && res.status === 'success') {
                            showNotification(res.message || 'User created successfully!');
                            setShowAddUserModal(false);
                            setNewUser({ name: '', username: '', email: '', phone: '', password: '', role: 'bursar' });
                            await loadUsersData();
                          } else {
                            alert(res?.message || 'Error creating user');
                          }
                        } catch (err: any) {
                          alert(err.message || 'Failed to create user');
                        } finally {
                          setSavingUser(false);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Full Official Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Jane Mary Kilonzo"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">User Handle / Username *</label>
                          {(() => {
                            const activeSchoolObj = (() => {
                              try {
                                const s = sessionStorage.getItem('skysoft_school') || localStorage.getItem('skysoft_school');
                                return s ? JSON.parse(s) : null;
                              } catch (err) {
                                return null;
                              }
                            })();
                            const currentSlug = activeSchoolObj?.slug || schoolProfile?.slug || (schoolProfile?.name ? schoolProfile.name.split(' ')[0].toLowerCase() : 'nduundune');

                            return (
                              <div>
                                <div className="flex items-center">
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. kioko"
                                    value={newUser.username}
                                    onChange={(e) => {
                                      let val = e.target.value.toLowerCase().replace(/\s+/g, '');
                                      if (val.includes('@')) {
                                        val = val.split('@')[0];
                                      }
                                      setNewUser({ ...newUser, username: val });
                                    }}
                                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-l-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                                  />
                                  <div className="bg-slate-100 border border-l-0 border-slate-200 px-3 py-2.5 rounded-r-lg text-xs font-mono font-bold text-slate-600 select-none">
                                    @{currentSlug}
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Login username: <span className="font-mono font-bold text-emerald-700">{newUser.username ? `${newUser.username}@${currentSlug}` : `[username]@${currentSlug}`}</span>
                                </p>
                              </div>
                            );
                          })()}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            2FA OTP Delivery Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. user@gmail.com (for receiving 2FA OTP codes)"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                          />
                          <p className="text-[10px] text-emerald-700 font-medium mt-1">
                            📬 Login 2FA verification codes (OTPs) will be emailed to this address.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone Number</label>
                          <input
                            type="text"
                            placeholder="+254712345678"
                            value={newUser.phone}
                            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Role Selector with Clear Explanations */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assign User Role & Privileges *</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="bursar">School Bursar — (Invoicing, Payments, Vouchers & Cashbook)</option>
                          <option value="head_teacher">Head Teacher / Principal — (Executive Approvals, SMS & Analytics)</option>
                          <option value="auditor">Internal Auditor — (Read-Only Ledger & Financial Audit)</option>
                          <option value="school_admin">School Administrator — (Full Operational & Configurations)</option>
                          <option value="super_admin">Super Administrator — (Full Unrestricted Access)</option>
                          <option value="parent">Parent / Guardian — (Parent Portal Fee Statement)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">Initial Password *</label>
                          <button
                            type="button"
                            onClick={() => {
                              const randomPwd = 'Pass#' + Math.floor(100000 + Math.random() * 900000);
                              setNewUser({ ...newUser, password: randomPwd });
                            }}
                            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold"
                          >
                            Generate Secure Password
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Enter initial password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowAddUserModal(false)}
                          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingUser}
                          className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingUser ? 'Creating...' : 'Save & Create User'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal 2: Reset Password Modal */}
              {showResetPasswordModal && selectedUserForReset && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="text-sm font-bold text-slate-900">Reset Password for {selectedUserForReset.name}</h3>
                      <button onClick={() => setShowResetPasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">New Password *</label>
                        <input
                          type="text"
                          placeholder="Enter new password"
                          value={newResetPassword}
                          onChange={(e) => setNewResetPassword(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const randomPwd = 'Pass#' + Math.floor(100000 + Math.random() * 900000);
                          setNewResetPassword(randomPwd);
                        }}
                        className="text-[11px] text-emerald-600 font-bold hover:underline"
                      >
                        Generate Random Password
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setShowResetPasswordModal(false)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!newResetPassword.trim()) {
                            alert('Please enter a new password.');
                            return;
                          }
                          try {
                            const res = await ApiService.resetUserPassword(selectedUserForReset.id, newResetPassword.trim());
                            showNotification(res.message || 'Password reset successfully!');
                            setShowResetPasswordModal(false);
                          } catch (e: any) {
                            alert(e.message || 'Failed to reset password');
                          }
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm cursor-pointer"
                      >
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 5: Receipt Numbering (media_1788704302681.png) */}
          {selectedSection === 'receipt-numbering' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-8 shadow-sm">
              {/* Header & Reset Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Receipt Numbering</h1>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-600" />
                    <span>To ensure continuity with your receipt books, set receipt numbers</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Reset document numbering sequences to default?')) {
                      setNextReceiptNumber('1');
                      alert('Receipt numbering reset.');
                    }
                  }}
                  className="px-4 py-2 border border-rose-400 text-rose-600 hover:bg-rose-50 font-bold rounded-lg text-xs"
                >
                  Reset Document Numbers
                </button>
              </div>

              {/* Section 1: Collections */}
              <div className="space-y-4">
                <span className="block font-bold text-slate-800 text-xs">
                  Please select what applies to your school for collections
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    onClick={() => setCollectionReceiptType('common')}
                    className="flex items-center gap-2 cursor-pointer text-xs text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={collectionReceiptType === 'common'}
                      onChange={() => setCollectionReceiptType('common')}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>There is a common receipt book for fee collections and other income</span>
                  </label>

                  <label
                    onClick={() => setCollectionReceiptType('different')}
                    className="flex items-center gap-2 cursor-pointer text-xs text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={collectionReceiptType === 'different'}
                      onChange={() => setCollectionReceiptType('different')}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>There are different receipt books for fee collections and other income</span>
                  </label>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enter next receipt No.</label>
                  <input
                    type="text"
                    value={nextReceiptNumber}
                    onChange={(e) => setNextReceiptNumber(e.target.value)}
                    className="w-full max-w-4xl p-2.5 bg-white border border-emerald-500 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Section 2: Payment Vouchers */}
              <div className="space-y-4">
                <span className="block font-bold text-slate-800 text-xs">
                  Please select what applies to your school for payment vouchers
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    onClick={() => setVoucherNumberType('common')}
                    className="flex items-center gap-2 cursor-pointer text-xs text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={voucherNumberType === 'common'}
                      onChange={() => setVoucherNumberType('common')}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>There is a common voucher number for all account types</span>
                  </label>

                  <label
                    onClick={() => setVoucherNumberType('different')}
                    className="flex items-center gap-2 cursor-pointer text-xs text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={voucherNumberType === 'different'}
                      onChange={() => setVoucherNumberType('different')}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>There are different voucher numbers for each account type</span>
                  </label>
                </div>

                {/* 4 Cards for Account Types matching Screenshot 5 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Building className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide">SCHOOL FUND</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Receipt No:</span>
                      <input
                        type="text"
                        value={voucherReceipts.schoolFund}
                        onChange={(e) => setVoucherReceipts({ ...voucherReceipts, schoolFund: e.target.value })}
                        className="w-12 p-1 bg-white border border-slate-200 rounded text-center font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Bus className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide">INFRASTRUCTURE</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Receipt No:</span>
                      <input
                        type="text"
                        value={voucherReceipts.infrastructure}
                        onChange={(e) => setVoucherReceipts({ ...voucherReceipts, infrastructure: e.target.value })}
                        className="w-12 p-1 bg-white border border-slate-200 rounded text-center font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide">TUITION</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Receipt No:</span>
                      <input
                        type="text"
                        value={voucherReceipts.tuition}
                        onChange={(e) => setVoucherReceipts({ ...voucherReceipts, tuition: e.target.value })}
                        className="w-12 p-1 bg-white border border-slate-200 rounded text-center font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide">OPERATIONS</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Receipt No:</span>
                      <input
                        type="text"
                        value={voucherReceipts.operations}
                        onChange={(e) => setVoucherReceipts({ ...voucherReceipts, operations: e.target.value })}
                        className="w-12 p-1 bg-white border border-slate-200 rounded text-center font-bold text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Section 3: Bursaries and Grants (media_1788704726925.png) */}
              <div className="space-y-4">
                <span className="block font-bold text-slate-800 text-xs">
                  Please select what applies to your school for bursaries and grants
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    onClick={() => setBursaryReceiptType('common')}
                    className="flex items-center gap-2 cursor-pointer text-xs text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={bursaryReceiptType === 'common'}
                      onChange={() => setBursaryReceiptType('common')}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>There is a common receipt book for bursaries and grants</span>
                  </label>

                  <label
                    onClick={() => setBursaryReceiptType('different')}
                    className="flex items-center gap-2 cursor-pointer text-xs text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={bursaryReceiptType === 'different'}
                      onChange={() => setBursaryReceiptType('different')}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>There are different receipt book for bursaries and grants</span>
                  </label>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enter grant/bursary receipt No.</label>
                  <input
                    type="text"
                    value={nextBursaryReceiptNumber}
                    onChange={(e) => setNextBursaryReceiptNumber(e.target.value)}
                    className="w-full max-w-4xl p-2.5 bg-white border border-emerald-500 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Section 4: Fee Reversals and Fee Refunds (media_1788704726925.png) */}
              <div className="space-y-4">
                <span className="block font-bold text-slate-800 text-xs">
                  Please select what applies to your school for fee reversals and fee refunds
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    onClick={() => setRefundReceiptType('common')}
                    className="flex items-center gap-2 cursor-pointer text-xs text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={refundReceiptType === 'common'}
                      onChange={() => setRefundReceiptType('common')}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>There is a common receipt book for fee reversals and fee refunds</span>
                  </label>

                  <label
                    onClick={() => setRefundReceiptType('different')}
                    className="flex items-center gap-2 cursor-pointer text-xs text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={refundReceiptType === 'different'}
                      onChange={() => setRefundReceiptType('different')}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>There are different receipt book for fee reversals and fee refunds</span>
                  </label>
                </div>

                <div className="pt-2 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Enter fee reversals receipt No.</label>
                    <input
                      type="text"
                      placeholder="e.g. 91"
                      value={feeReversalsReceiptNumber}
                      onChange={(e) => setFeeReversalsReceiptNumber(e.target.value)}
                      className="w-full max-w-4xl p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Enter fee refunds receipt No.</label>
                    <input
                      type="text"
                      placeholder="e.g. 91"
                      value={feeRefundsReceiptNumber}
                      onChange={(e) => setFeeRefundsReceiptNumber(e.target.value)}
                      className="w-full max-w-4xl p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Save Action Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => alert('Receipt Numbering configurations saved successfully!')}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* SUB-VIEW 6: Staff Configurations (media_1788704412789.png) */}
          {selectedSection === 'staff' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Staff Configurations</h1>
                {/* Tabs: Leave Types vs Exit Reasons */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setStaffConfigTab('leave-types')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      staffConfigTab === 'leave-types'
                        ? 'bg-sky-100 text-sky-700 border border-sky-200'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {staffConfigTab === 'leave-types' && <Check className="w-3.5 h-3.5" />}
                    <span>Leave Types</span>
                  </button>
                  <button
                    onClick={() => setStaffConfigTab('exit-reasons')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      staffConfigTab === 'exit-reasons'
                        ? 'bg-sky-100 text-sky-700 border border-sky-200'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {staffConfigTab === 'exit-reasons' && <Check className="w-3.5 h-3.5" />}
                    <span>Exit Reasons</span>
                  </button>
                </div>
              </div>

              {staffConfigTab === 'leave-types' ? (
                /* Leave Types Table Card matching Screenshot 6 */
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Leave Types</h2>
                    <button
                      onClick={() => setShowAddLeaveModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Leave Type</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4 w-12 text-slate-500">#</th>
                          <th className="py-3 px-4">Leave Type Name</th>
                          <th className="py-3 px-4">Max Accrual</th>
                          <th className="py-3 px-4">Paid</th>
                          <th className="py-3 px-4">Max Balance</th>
                          <th className="py-3 px-4">Max Carry Over Days</th>
                          <th className="py-3 px-4">Exclude Saturdays</th>
                          <th className="py-3 px-4">Exclude Sundays</th>
                          <th className="py-3 px-4">Notes</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {leaveTypes.map((lt, idx) => (
                          <tr key={lt.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 text-slate-500">{idx + 1}.</td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">{lt.name}</td>
                            <td className="py-3.5 px-4 text-slate-500">{lt.maxAccrual}</td>
                            <td className="py-3.5 px-4 text-slate-700 font-semibold">{lt.paid}</td>
                            <td className="py-3.5 px-4 text-slate-800 font-semibold">{lt.maxBalance}</td>
                            <td className="py-3.5 px-4 text-slate-500">{lt.maxCarryOver}</td>
                            <td className="py-3.5 px-4 text-slate-700">{lt.excludeSaturdays}</td>
                            <td className="py-3.5 px-4 text-slate-700">{lt.excludeSundays}</td>
                            <td className="py-3.5 px-4 text-slate-600">{lt.notes}</td>
                            <td className="py-3.5 px-4 text-right">
                              <button className="p-1 hover:bg-slate-100 rounded text-slate-500">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                    <div>Showing 1 to {leaveTypes.length} of {leaveTypes.length} entries</div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span>Items per page:</span>
                        <select className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-700">
                          <option>50</option>
                          <option>25</option>
                          <option>10</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <button disabled className="px-2 py-1 rounded text-slate-400">Previous</button>
                        <span className="w-6 h-6 flex items-center justify-center rounded bg-emerald-600 text-white font-bold text-xs">1</span>
                        <button disabled className="px-2 py-1 rounded text-slate-400">Next</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Exit Reasons View */
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Exit Reasons</h2>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter new exit reason name:');
                        if (reason) {
                          setExitReasons([...exitReasons, { id: Date.now(), name: reason, notes: 'Standard exit protocol' }]);
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Exit Reason</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4 w-12 text-slate-500">#</th>
                          <th className="py-3 px-4">Reason Name</th>
                          <th className="py-3 px-4">Notes</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {exitReasons.map((er, idx) => (
                          <tr key={er.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 text-slate-500">{idx + 1}.</td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">{er.name}</td>
                            <td className="py-3.5 px-4 text-slate-600">{er.notes}</td>
                            <td className="py-3.5 px-4 text-right">
                              <button className="p-1 hover:bg-slate-100 rounded text-slate-500">
                                <MoreVertical className="w-4 h-4" />
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

          {/* SUB-VIEW 7: Overpayments Configuration (media_1788704451514.png) */}
          {selectedSection === 'overpayment' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Overpayments Configuration</h1>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Configure the vote heads to which overpayments will be allocated to.</span>
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowOverpaymentConfigModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-700 font-bold rounded-lg text-xs transition-colors shadow-sm"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Configure Vote Heads</span>
                </button>
              </div>

              {overpaymentVoteHeads.length === 0 ? (
                <div className="pt-4 text-slate-400 text-xs font-medium">
                  No configuration set
                </div>
              ) : (
                <div className="pt-2 border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 w-12 text-slate-500">#</th>
                        <th className="py-3 px-4">Configured Vote Head</th>
                        <th className="py-3 px-4">Allocation Type</th>
                        <th className="py-3 px-4">Priority Order</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {overpaymentVoteHeads.map((vh, idx) => (
                        <tr key={vh.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 text-slate-500">{idx + 1}.</td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">{vh.name}</td>
                          <td className="py-3.5 px-4 text-slate-600">{vh.type}</td>
                          <td className="py-3.5 px-4 text-slate-600">Priority {idx + 1}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setOverpaymentVoteHeads(overpaymentVoteHeads.filter((x) => x.id !== vh.id))}
                              className="p-1 hover:bg-rose-50 text-rose-500 rounded font-bold"
                            >
                              Remove
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
        </div>
      )}



      {/* Modal: Add Leave Type */}
      {showAddLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add New Leave Type</h3>
              <button onClick={() => setShowAddLeaveModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newLeaveType.name) {
                  setLeaveTypes([
                    ...leaveTypes,
                    {
                      id: Date.now(),
                      name: newLeaveType.name,
                      maxAccrual: '-',
                      paid: newLeaveType.paid,
                      maxBalance: newLeaveType.maxBalance || '21',
                      maxCarryOver: '-',
                      excludeSaturdays: newLeaveType.excludeSaturdays,
                      excludeSundays: newLeaveType.excludeSundays,
                      notes: newLeaveType.notes || newLeaveType.name,
                    },
                  ]);
                  setNewLeaveType({ name: '', paid: 'YES', maxBalance: '21', excludeSaturdays: 'YES', excludeSundays: 'YES', notes: '' });
                  setShowAddLeaveModal(false);
                }
              }}
              className="space-y-3 mt-3 text-xs"
            >
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Leave Type Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Study Leave"
                  value={newLeaveType.name}
                  onChange={(e) => setNewLeaveType({ ...newLeaveType, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Paid Leave?</label>
                  <select
                    value={newLeaveType.paid}
                    onChange={(e) => setNewLeaveType({ ...newLeaveType, paid: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Balance (Days)</label>
                  <input
                    type="number"
                    value={newLeaveType.maxBalance}
                    onChange={(e) => setNewLeaveType({ ...newLeaveType, maxBalance: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Exclude Saturdays?</label>
                  <select
                    value={newLeaveType.excludeSaturdays}
                    onChange={(e) => setNewLeaveType({ ...newLeaveType, excludeSaturdays: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Exclude Sundays?</label>
                  <select
                    value={newLeaveType.excludeSundays}
                    onChange={(e) => setNewLeaveType({ ...newLeaveType, excludeSundays: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={newLeaveType.notes}
                  onChange={(e) => setNewLeaveType({ ...newLeaveType, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeaveModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Leave Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configure Overpayments Vote Heads */}
      {showOverpaymentConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Configure Overpayment Allocation</h3>
              <button onClick={() => setShowOverpaymentConfigModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 mt-3 text-xs">
              <p className="text-slate-600">
                Select the vote head to which student overpayments should be credited when payments exceed invoices.
              </p>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Vote Head</label>
                <select
                  value={selectedOverpaymentVH}
                  onChange={(e) => setSelectedOverpaymentVH(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                >
                  <option value="Fee Prepayment Reserve Account">Fee Prepayment Reserve Account</option>
                  <option value="School Development Fund">School Development Fund</option>
                  <option value="Tuition Buffer Account">Tuition Buffer Account</option>
                  <option value="PTA Operations Holding">PTA Operations Holding</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOverpaymentConfigModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!overpaymentVoteHeads.some((x) => x.name === selectedOverpaymentVH)) {
                      setOverpaymentVoteHeads([
                        ...overpaymentVoteHeads,
                        { id: Date.now(), name: selectedOverpaymentVH, type: 'Prepayment / Buffer' },
                      ]);
                    }
                    setShowOverpaymentConfigModal(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
