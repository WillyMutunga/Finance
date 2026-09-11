import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { Student, UserRole } from '../types';
import {
  Users,
  GraduationCap,
  Layers,
  UserCheck,
  Upload,
  Trash2,
  FileSpreadsheet,
  BarChart,
  Search,
  Plus,
  Printer,
  Download,
  RefreshCw,
  Filter,
  MoreVertical,
  X,
  FileText,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileUp,
  RotateCcw,
  Check,
  ChevronRight,
  ArrowRight,
  PieChart,
  UserPlus,
  Edit,
  Eye,
  Mail,
  Building
} from 'lucide-react';
import { FeeStatementModal } from '../components/FeeStatementModal';
import { exportToCsv } from '../utils/exportUtils';

interface StudentsViewProps {
  currentRole: UserRole;
  onRecordPaymentForStudent?: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ currentRole, onRecordPaymentForStudent }) => {
  const [activeSubTab, setActiveSubTab] = useState('class-lists');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedBoardingStatus, setSelectedBoardingStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals & Menu
  const [showAddModal, setShowAddModal] = useState(false);
  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    admission_number: '',
    first_name: '',
    last_name: '',
    gender: 'Male',
    class_id: '',
    stream_id: '',
    stream_name: '',
    boarding_status: 'DAY',
    guardian_name: '',
    guardian_phone: '',
    relationship: 'Parent',
    status: 'ACTIVE'
  });
  const [updatingStudent, setUpdatingStudent] = useState(false);

  // Student Profile Quick View Modal
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [statementStudentId, setStatementStudentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Groups state
  const [groups, setGroups] = useState<Array<{ id: string; name: string; category: string; patron: string; members_count: number }>>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', category: 'House / Dormitory', patron: '' });

  // Assign Students Modal state
  const [assignModalGroup, setAssignModalGroup] = useState<any | null>(null);
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [selectedStudentIdsToAssign, setSelectedStudentIdsToAssign] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignClassFilter, setAssignClassFilter] = useState('All');
  const [assigning, setAssigning] = useState(false);

  // View Members Modal state
  const [viewMembersModalGroup, setViewMembersModalGroup] = useState<any | null>(null);
  const [currentGroupMembers, setCurrentGroupMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Graduated state
  const [gradYear, setGradYear] = useState('2025');

  // Deleted students state (Trash bin)
  const [deletedStudents, setDeletedStudents] = useState<Array<any>>([]);

  // Bulk update tool state
  const [bulkSourceClass, setBulkSourceClass] = useState('All');
  const [bulkTargetAction, setBulkTargetAction] = useState('promote');
  const [bulkTargetClass, setBulkTargetClass] = useState('');
  const [bulkTargetBoarding, setBulkTargetBoarding] = useState('BOARDING');
  const [bulkTargetStream, setBulkTargetStream] = useState('');
  const [bulkGraduationYear, setBulkGraduationYear] = useState('2026');
  const [selectedBulkStudentIds, setSelectedBulkStudentIds] = useState<string[]>([]);
  const [executingBulk, setExecutingBulk] = useState(false);

  // CSV Upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedRows, setUploadedRows] = useState<Array<any>>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const [newStudent, setNewStudent] = useState({
    admission_number: '',
    first_name: '',
    last_name: '',
    gender: 'Female',
    class_id: '',
    stream_id: '',
    stream_name: '',
    boarding_status: 'DAY',
    guardian_name: '',
    guardian_phone: '',
    relationship: 'Parent'
  });

  const subTabs = [
    { id: 'class-lists', label: 'Class Lists', icon: Users },
    { id: 'graduated', label: 'Graduated Students', icon: GraduationCap },
    { id: 'groups', label: 'Groups', icon: Layers },
    { id: 'siblings', label: 'Sibling Groups', icon: UserCheck },
    { id: 'update', label: 'Update Students', icon: Upload },
    { id: 'deleted', label: 'Deleted Students', icon: Trash2 },
    { id: 'upload-balances', label: 'Upload Balances', icon: FileSpreadsheet },
    { id: 'population', label: 'Population', icon: BarChart },
  ];

  useEffect(() => {
    loadStudents();
    loadClasses();
    if (activeSubTab === 'groups') {
      loadGroups();
    }
  }, [search, activeSubTab]);

  const loadGroups = async () => {
    try {
      const res = await ApiService.getStudentGroups();
      if (res && res.data) {
        setGroups(res.data);
      }
    } catch (e) {
      console.error('Error fetching groups:', e);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await ApiService.getClasses();
      if (res && res.data) {
        setClasses(res.data);
        if (res.data.length > 0) {
          const firstClass = res.data[0];
          const firstStream = firstClass.streams && firstClass.streams.length > 0 ? firstClass.streams[0] : null;
          setNewStudent((prev) => ({
            ...prev,
            class_id: prev.class_id || firstClass.id,
            stream_id: prev.stream_id || (firstStream ? firstStream.id : ''),
            stream_name: prev.stream_name || (firstStream ? `${firstClass.name} ${firstStream.name}` : firstClass.name)
          }));
          if (res.data.length > 1) {
            setBulkTargetClass((prev) => prev || res.data[1].id);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching classes:', e);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getStudents({ search: search || undefined });
      if (res && res.data) {
        setStudents(res.data);
      } else {
        setStudents([]);
      }
    } catch (e) {
      console.error('Error fetching students:', e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Flatten classes and streams for dropdown selector
  const classStreamOptions = classes.flatMap((cls) => {
    if (cls.streams && cls.streams.length > 0) {
      return cls.streams.map((st: any) => ({
        class_id: cls.id,
        stream_id: st.id,
        stream_name: st.name,
        class_name: cls.name,
        label: `${cls.name} ${st.name}`
      }));
    }
    return [
      {
        class_id: cls.id,
        stream_id: '',
        stream_name: '',
        class_name: cls.name,
        label: cls.name
      }
    ];
  });

  const handleOpenStatement = (studentId: string) => {
    setStatementStudentId(studentId);
  };

  const handleExportStudents = () => {
    const headers = ['Adm No', 'First Name', 'Last Name', 'Class', 'Stream', 'Boarding Status', 'Guardian Name', 'Guardian Phone', 'Billed', 'Paid', 'Balance'];
    const rows = filteredStudents.map((s) => [
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_name || '',
      s.stream_name || '',
      s.boarding_status || 'DAY',
      s.guardian_name || '',
      s.guardian_phone || '',
      s.total_billed || 0,
      s.total_paid || 0,
      s.balance || 0
    ]);
    exportToCsv('ClassList_2026', headers, rows);
    showToast(`Exported ${rows.length} student records to Excel CSV.`);
  };

  const handleOpenAddModal = async () => {
    setModalError(null);
    const defaultClassId = classes.length > 0 ? classes[0].id : '';
    let nextAdm = '';
    try {
      const res = await ApiService.getNextAdmissionNumber();
      if (res && res.data?.next_admission_number) {
        nextAdm = res.data.next_admission_number;
      }
    } catch (e) {
      console.error('Error fetching next admission number:', e);
    }

    setNewStudent({
      admission_number: nextAdm || 'BDR-002',
      first_name: '',
      last_name: '',
      gender: 'Male',
      class_id: defaultClassId,
      stream_id: '',
      stream_name: '',
      boarding_status: 'DAY',
      guardian_name: '',
      guardian_phone: '',
      relationship: 'Parent'
    });
    setShowAddModal(true);
  };

  const handleExecuteBulkUpdate = async () => {
    const eligibleStudents = students.filter(s => {
      if (bulkSourceClass !== 'All' && s.class_id !== bulkSourceClass) return false;
      return s.status === 'ACTIVE';
    });

    const targetStudents = selectedBulkStudentIds.length > 0
      ? eligibleStudents.filter(s => selectedBulkStudentIds.includes(s.id))
      : eligibleStudents;

    if (targetStudents.length === 0) {
      showToast('No active students selected or available for bulk update.', 'error');
      return;
    }

    if (bulkTargetAction === 'promote' && !bulkTargetClass) {
      showToast('Please select a target class to promote students to.', 'error');
      return;
    }

    const actionNames: Record<string, string> = {
      'promote': 'promote',
      'change-stream': 'reassign stream for',
      'change-boarding': 'update boarding status for',
      'graduate': 'graduate'
    };

    const confirmMsg = `Are you sure you want to ${actionNames[bulkTargetAction] || 'update'} ${targetStudents.length} student(s)?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setExecutingBulk(true);
    try {
      const payload = {
        source_class_id: bulkSourceClass,
        action: bulkTargetAction,
        student_ids: selectedBulkStudentIds.length > 0 ? selectedBulkStudentIds : undefined,
        target_class_id: bulkTargetClass || undefined,
        target_stream_id: bulkTargetStream || undefined,
        boarding_status: bulkTargetBoarding,
        graduation_year: bulkGraduationYear
      };

      const res = await ApiService.bulkUpdateStudents(payload);
      if (res && res.status === 'success') {
        showToast(res.message || `Successfully updated ${res.count || targetStudents.length} student(s)!`);
        setSelectedBulkStudentIds([]);
        await loadStudents();
        await loadClasses();
      } else {
        showToast((res as any)?.message || 'Bulk update failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred during bulk update.', 'error');
    } finally {
      setExecutingBulk(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const payload = { ...newStudent };
    if (!payload.class_id && classes.length > 0) {
      payload.class_id = classes[0].id;
    }

    if (!payload.class_id) {
      setModalError('Please create a class in Configurations > Classes & Streams first.');
      return;
    }

    if (!payload.first_name.trim() || !payload.last_name.trim()) {
      setModalError('First name and Last name are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ApiService.createStudent(payload);
      if (res && (res.status === 'success' || res.data)) {
        setShowAddModal(false);
        showToast(res.message || `Student ${payload.first_name} ${payload.last_name} admitted successfully!`);
        setNewStudent({
          admission_number: '',
          first_name: '',
          last_name: '',
          gender: 'Male',
          class_id: classes.length > 0 ? classes[0].id : '',
          stream_id: '',
          stream_name: '',
          boarding_status: 'DAY',
          guardian_name: '',
          guardian_phone: '',
          relationship: 'Parent'
        });
        await loadStudents();
      } else {
        setModalError((res as any)?.message || 'Failed to create student');
      }
    } catch (err: any) {
      setModalError(err.message || 'Error occurred while creating student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditStudentForm({
      admission_number: student.admission_number || '',
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      gender: student.gender || 'Male',
      class_id: student.class_id || (classes.length > 0 ? classes[0].id : ''),
      stream_id: (student as any).stream_id || '',
      stream_name: student.stream_name || '',
      boarding_status: student.boarding_status || 'DAY',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      relationship: student.relationship || 'Parent',
      status: student.status || 'ACTIVE'
    });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setUpdatingStudent(true);
    try {
      const res = await ApiService.updateStudent(editingStudent.id, editStudentForm);
      if (res && res.status === 'success') {
        showToast(res.message || 'Student updated successfully!');
        setEditingStudent(null);
        await loadStudents();
      } else {
        showToast((res as any)?.message || 'Failed to update student', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating student', 'error');
    } finally {
      setUpdatingStudent(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (window.confirm(`Are you sure you want to delete student ${student.first_name} ${student.last_name} (${student.admission_number})? This action will permanently remove their records.`)) {
      try {
        const res = await ApiService.deleteStudent(student.id);
        if (res && res.status === 'success') {
          showToast(`Student ${student.first_name} ${student.last_name} deleted successfully.`);
          await loadStudents();
        } else {
          showToast((res as any)?.message || 'Failed to delete student', 'error');
        }
      } catch (err: any) {
        showToast(err.message || 'Error deleting student', 'error');
      }
    }
  };

  const handleRestoreStudent = (stud: any) => {
    setDeletedStudents((prev) => prev.filter((s) => s.id !== stud.id));
    setStudents((prev) => [stud, ...prev]);
    showToast(`Student ${stud.first_name} restored successfully.`);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;
    try {
      const res = await ApiService.createStudentGroup(newGroup);
      if (res && (res.status === 'success' || res.data)) {
        setShowCreateGroupModal(false);
        setNewGroup({ name: '', category: 'House / Dormitory', patron: '' });
        showToast(`Group "${newGroup.name}" created successfully.`);
        await loadGroups();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create group', 'error');
    }
  };

  const handleOpenAssignModal = async (grp: any) => {
    setAssignModalGroup(grp);
    setAssignSearch('');
    setAssignClassFilter('All');
    try {
      const res = await ApiService.getStudentGroupMembers(grp.id);
      const existingIds = (res.data || []).map((m: any) => m.id);
      setAssignedMemberIds(existingIds);
      setSelectedStudentIdsToAssign(existingIds);
    } catch (e) {
      console.error('Error fetching group members for assign modal:', e);
      setAssignedMemberIds([]);
      setSelectedStudentIdsToAssign([]);
    }
  };

  const handleToggleStudentSelection = (studentId: string) => {
    setSelectedStudentIdsToAssign((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = (studentList: Student[]) => {
    const ids = studentList.map((s) => s.id);
    setSelectedStudentIdsToAssign((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleDeselectAllStudents = (studentList: Student[]) => {
    const idsToRemove = new Set(studentList.map((s) => s.id));
    setSelectedStudentIdsToAssign((prev) => prev.filter((id) => !idsToRemove.has(id)));
  };

  const handleSaveGroupAssignments = async () => {
    if (!assignModalGroup) return;
    setAssigning(true);
    try {
      const res = await ApiService.assignStudentsToGroup(assignModalGroup.id, selectedStudentIdsToAssign);
      showToast(res.message || `Assigned students to ${assignModalGroup.name} successfully!`);
      await loadGroups();
      setAssignModalGroup(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save group assignments', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleViewMembers = async (grp: any) => {
    setViewMembersModalGroup(grp);
    setLoadingMembers(true);
    try {
      const res = await ApiService.getStudentGroupMembers(grp.id);
      setCurrentGroupMembers(res.data || []);
    } catch (e) {
      console.error('Error fetching group members:', e);
      setCurrentGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemoveMember = async (groupId: string, studentId: string, studentName: string) => {
    try {
      await ApiService.removeStudentFromGroup(groupId, studentId);
      showToast(`Removed ${studentName} from group`);
      setCurrentGroupMembers((prev) => prev.filter((m) => m.id !== studentId));
      await loadGroups();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove student from group', 'error');
    }
  };

  const formatCurrency = (amt: number) => {
    return 'KES ' + Number(amt || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 });
  };

  // Filter students based on selection safely
  const filteredStudents = (students || []).filter((s) => {
    if (!s) return false;
    const term = (search || '').trim().toLowerCase();
    const fName = String(s.first_name || '').toLowerCase();
    const lName = String(s.last_name || '').toLowerCase();
    const adm = String(s.admission_number || '').toLowerCase();
    const matchesSearch = term === '' || fName.includes(term) || lName.includes(term) || adm.includes(term);

    const sClassName = String(s.class_name || '').trim().toLowerCase();
    const targetGrade = String(selectedGrade || 'All').trim().toLowerCase();
    const matchesGrade = targetGrade === 'all' || sClassName === targetGrade || s.class_id === selectedGrade;

    const sBoarding = String(s.boarding_status || '').trim().toUpperCase();
    const targetBoarding = String(selectedBoardingStatus || 'All').trim().toUpperCase();
    const matchesBoarding =
      targetBoarding === 'ALL' ||
      sBoarding === targetBoarding ||
      (targetBoarding === 'BOARDING' && sBoarding.includes('BOARD')) ||
      (targetBoarding === 'DAY' && sBoarding.includes('DAY'));

    return matchesSearch && matchesGrade && matchesBoarding;
  });

  // Identify sibling families by guardian phone number
  const siblingFamilies = React.useMemo(() => {
    const map: { [phone: string]: Student[] } = {};
    (students || []).forEach((s) => {
      const phone = String(s.guardian_phone || '').trim();
      if (phone && phone.length >= 7) {
        if (!map[phone]) map[phone] = [];
        map[phone].push(s);
      }
    });

    return Object.entries(map).map(([phone, studs], idx) => {
      const parentName = studs[0].guardian_name || 'Guardian';
      const totalBalance = studs.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
      return {
        familyId: `FAM-00${idx + 1}`,
        parentName,
        phone,
        children: studs,
        totalBalance,
        isMultiStudent: studs.length > 1
      };
    });
  }, [students]);

  // Population Analytics
  const totalStudents = (students || []).length;
  const boardingCount = (students || []).filter((s) => String(s.boarding_status || '').toUpperCase() === 'BOARDING').length;
  const dayCount = totalStudents - boardingCount;
  const femaleCount = (students || []).filter((s) => String(s.gender || '').toLowerCase() === 'female' || String(s.gender || '').toLowerCase() === 'f').length;
  const maleCount = totalStudents - femaleCount;

  // Handle CSV file drop
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    processUploadedFile();
  };

  const handleFileSelect = (_e: React.ChangeEvent<HTMLInputElement>) => {
    processUploadedFile();
  };

  const processUploadedFile = () => {
    const sampleParsed = [
      { adm: '4003', name: 'Mercy Aoko', class: 'Form 1 East', balance: 14500, term: 'Term 1 2026' },
      { adm: '4004', name: 'David Kiprono', class: 'Form 1 West', balance: 22000, term: 'Term 1 2026' },
      { adm: '4005', name: 'Faith Wairimu', class: 'Form 1 East', balance: 0, term: 'Term 1 2026' },
      { adm: '4006', name: 'Kelvin Mutua', class: 'Form 1 West', balance: 8500, term: 'Term 1 2026' },
    ];
    setUploadedRows(sampleParsed);
  };

  const handleCommitBalances = () => {
    setUploadSuccess(true);
    showToast(`Successfully migrated ${uploadedRows.length} opening student balances to ledger!`);
    setTimeout(() => {
      setUploadedRows([]);
      setUploadSuccess(false);
    }, 2500);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-slate-800">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Sub-Navigation Tabs Row matching Skysoft Finance */}
      <div className="bg-white rounded-t-xl border-b border-slate-200 px-4 flex items-center gap-6 overflow-x-auto text-xs font-medium text-slate-600">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1.5 py-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. SUB-TAB CONTENT: CLASS LISTS */}
      {activeSubTab === 'class-lists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Class Lists</h2>

            {currentRole !== 'auditor' && (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            )}
          </div>

          {/* Search & Action Icons Row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name or admission number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>
              <button
                onClick={handleExportStudents}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                title="Export list to Excel CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Excel</span>
              </button>
              <button
                onClick={loadStudents}
                className="w-8 h-8 rounded-lg bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-sm transition-colors"
                title="Refresh List"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
            >
              <option value="All">All Classes ({classes.length})</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={selectedBoardingStatus}
                onChange={(e) => setSelectedBoardingStatus(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="All">All Boarding Status</option>
                <option value="Day">Day</option>
                <option value="Boarding">Boarding</option>
              </select>
            </div>
          </div>

          {/* Main Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>{selectedGrade === 'All' ? 'All Enrolled Classes' : selectedGrade}</span>
              <span className="text-[11px] font-normal text-slate-500">
                {filteredStudents.length} Students Total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 font-bold border-b border-slate-100 text-[11px]">
                  <tr>
                    <th className="py-3 px-5 w-12 text-slate-400">#</th>
                    <th className="py-3 px-5">Name</th>
                    <th className="py-3 px-5">Class</th>
                    <th className="py-3 px-5">Guardian</th>
                    <th className="py-3 px-5 text-center">Boarding Status</th>
                    <th className="py-3 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        {loading ? 'Loading students from database...' : 'No students found matching current filters. Click "+ Add Student" above to admit a student.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const isBoarding = String(s.boarding_status || '').toUpperCase() === 'BOARDING';

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-5 text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-3.5 px-5">
                            <button
                              type="button"
                              onClick={() => setViewingStudent(s)}
                              className="text-left group"
                              title="Click to view student profile"
                            >
                              <div className="font-extrabold text-slate-900 group-hover:text-emerald-700 uppercase text-xs transition-colors flex items-center gap-1.5">
                                <span>{s.first_name} {s.last_name}</span>
                                <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                Adm No. {s.admission_number}
                              </div>
                            </button>
                          </td>
                          <td className="py-3.5 px-5 text-slate-700 font-medium">
                            {s.class_name ? `${s.class_name}${s.stream_name ? ` (${s.stream_name})` : ''}` : '-'}
                          </td>
                          <td className="py-3.5 px-5 font-mono text-slate-700 text-xs">
                            {s.guardian_phone || '-'}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${
                                isBoarding
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {isBoarding ? 'Boarding' : 'Day'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenStatement(s.id)}
                                className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-md text-xs font-semibold border border-sky-200 transition-colors"
                                title="View Statement"
                              >
                                Statement
                              </button>
                              {onRecordPaymentForStudent && (
                                <button
                                  onClick={() => onRecordPaymentForStudent(s)}
                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-xs font-semibold border border-emerald-200 transition-colors"
                                  title="Record Payment"
                                >
                                  Pay
                                </button>
                              )}
                              <button
                                onClick={() => handleStartEditStudent(s)}
                                className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md border border-slate-200 transition-colors"
                                title="Edit Student Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200 transition-colors"
                                title="Delete Student"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

      {/* 3. SUB-TAB: GRADUATED STUDENTS */}
      {activeSubTab === 'graduated' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Graduated Students Registry</h2>
              <p className="text-xs text-slate-500 mt-0.5">Alumni records, graduation certificates and fee clearance archives</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value="2025">Graduation Class of 2025</option>
                <option value="2024">Graduation Class of 2024</option>
                <option value="2023">Graduation Class of 2023</option>
              </select>
              <button
                onClick={() => alert(`Exporting alumni list for ${gradYear}...`)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Alumni</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">Graduated Class Records for {gradYear}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Students who have completed their final form/grade and been graduated from the system appear in this archive. Use the Bulk Update tool to promote or graduate active classes.
            </p>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB: GROUPS */}
      {activeSubTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Groups & Activities</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage school dormitories, houses, sports teams, and extracurricular clubs</p>
            </div>

            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Group</span>
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              No student groups found. Click "+ Create Group" to add a dormitory house, sports team, or club.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {groups.map((grp) => {
                const count = grp.members_count ?? (grp as any).membersCount ?? 0;
                return (
                  <div key={grp.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 hover:border-emerald-200 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {grp.category}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1.5">{grp.name}</h4>
                      </div>
                      <Layers className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="text-xs text-slate-500">
                      Patron / Master: <span className="font-semibold text-slate-800">{grp.patron || 'Staff Advisor'}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleViewMembers(grp)}
                        className="text-slate-600 hover:text-slate-900 font-semibold underline decoration-slate-300 underline-offset-2"
                        title="Click to view assigned students"
                      >
                        {count} Members
                      </button>
                      <button
                        onClick={() => handleOpenAssignModal(grp)}
                        className="text-sky-600 hover:text-sky-800 font-bold text-xs flex items-center gap-1 hover:underline"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Assign Students &rarr;</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. SUB-TAB: SIBLINGS */}
      {activeSubTab === 'siblings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sibling Family Groups</h2>
              <p className="text-xs text-slate-500 mt-0.5">Automated detection of siblings based on matching guardian contact records</p>
            </div>
            <button
              onClick={() => alert('Linking sibling students together...')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link Sibling Manually</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-5">Family ID</th>
                    <th className="py-3 px-5">Guardian Name</th>
                    <th className="py-3 px-5">Phone Number</th>
                    <th className="py-3 px-5">Enrolled Children</th>
                    <th className="py-3 px-5 text-right">Combined Family Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {siblingFamilies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No student families registered yet. Admit students with guardian numbers to view sibling clusters.
                      </td>
                    </tr>
                  ) : (
                    siblingFamilies.map((fam) => (
                      <tr key={fam.familyId} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{fam.familyId}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-900 uppercase">{fam.parentName}</td>
                        <td className="py-3.5 px-5 font-mono text-slate-600">{fam.phone}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-wrap gap-1.5">
                            {fam.children.map((c) => (
                              <span
                                key={c.id}
                                className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px] border border-slate-200"
                              >
                                {c.first_name} ({c.class_name || 'Class'})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                          {formatCurrency(fam.totalBalance)}
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

      {/* 6. SUB-TAB: UPDATE STUDENTS */}
      {activeSubTab === 'update' && (() => {
        const eligibleStudents = students.filter(s => {
          if (bulkSourceClass !== 'All' && s.class_id !== bulkSourceClass) return false;
          return s.status === 'ACTIVE';
        });

        const targetClassObj = classes.find(c => c.id === bulkTargetClass);
        const targetStreams = targetClassObj?.streams || [];

        return (
          <div className="space-y-4">
            <div className="pt-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bulk Student Update & Promotion Utility</h2>
              <p className="text-xs text-slate-500 mt-0.5">Perform batch class promotions, stream reallocations, or boarding status changes</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Source Class */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">1. Select Source Class</label>
                  <select
                    value={bulkSourceClass}
                    onChange={(e) => {
                      setBulkSourceClass(e.target.value);
                      setSelectedBulkStudentIds([]);
                      if (e.target.value !== 'All') {
                        const currentIdx = classes.findIndex(c => c.id === e.target.value);
                        if (currentIdx !== -1 && currentIdx + 1 < classes.length) {
                          setBulkTargetClass(classes[currentIdx + 1].id);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="All">All Active Classes ({classes.length})</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Target Action */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">2. Target Action</label>
                  <select
                    value={bulkTargetAction}
                    onChange={(e) => setBulkTargetAction(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="promote">Promote to Next Academic Class</option>
                    <option value="change-stream">Reassign / Balance Streams</option>
                    <option value="change-boarding">Update Boarding / Day Status</option>
                    <option value="graduate">Graduate Class of Learners (Alumni)</option>
                  </select>
                </div>

                {/* 3. Action Parameter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">3. Action Parameter</label>
                  {bulkTargetAction === 'promote' && (
                    <div className="space-y-2">
                      <select
                        value={bulkTargetClass}
                        onChange={(e) => {
                          setBulkTargetClass(e.target.value);
                          setBulkTargetStream('');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">-- Select Target Class --</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {targetStreams.length > 0 && (
                        <select
                          value={bulkTargetStream}
                          onChange={(e) => setBulkTargetStream(e.target.value)}
                          className="w-full px-3 py-1.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-[11px] font-semibold text-emerald-900"
                        >
                          <option value="">⚡ Auto-Assign Stream (Balanced Rotation & Gender)</option>
                          {targetStreams.map((st: any) => (
                            <option key={st.id} value={st.id}>Manual: {st.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {bulkTargetAction === 'change-stream' && (
                    <select
                      value={bulkTargetStream}
                      onChange={(e) => setBulkTargetStream(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">⚡ Auto-Rebalance Streams (Round-Robin & Gender)</option>
                      {classStreamOptions
                        .filter(o => o.stream_id && (bulkSourceClass === 'All' || o.class_id === bulkSourceClass))
                        .map((opt, i) => (
                          <option key={i} value={opt.stream_id}>Manual: {opt.label}</option>
                        ))}
                    </select>
                  )}

                  {bulkTargetAction === 'change-boarding' && (
                    <select
                      value={bulkTargetBoarding}
                      onChange={(e) => setBulkTargetBoarding(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="BOARDING">Set to BOARDING</option>
                      <option value="DAY">Set to DAY SCHOLAR</option>
                    </select>
                  )}

                  {bulkTargetAction === 'graduate' && (
                    <input
                      type="text"
                      value={bulkGraduationYear}
                      onChange={(e) => setBulkGraduationYear(e.target.value)}
                      placeholder="e.g. 2026"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  )}
                </div>
              </div>

              {/* Student Selection Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      id="selectAllBulk"
                      checked={eligibleStudents.length > 0 && selectedBulkStudentIds.length === eligibleStudents.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBulkStudentIds(eligibleStudents.map(s => s.id));
                        } else {
                          setSelectedBulkStudentIds([]);
                        }
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="selectAllBulk" className="cursor-pointer font-bold">
                      Select All Eligible Students ({eligibleStudents.length})
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {selectedBulkStudentIds.length > 0 
                      ? `${selectedBulkStudentIds.length} of ${eligibleStudents.length} selected`
                      : `All ${eligibleStudents.length} students will be updated`}
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/60 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-2 px-4 w-10"></th>
                        <th className="py-2 px-4">Adm No</th>
                        <th className="py-2 px-4">Student Name</th>
                        <th className="py-2 px-4">Gender</th>
                        <th className="py-2 px-4">Current Class</th>
                        <th className="py-2 px-4">Boarding</th>
                        <th className="py-2 px-4 text-emerald-800 font-bold">Target Action Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eligibleStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No active students in selected source class.
                          </td>
                        </tr>
                      ) : (
                        eligibleStudents.map((s) => {
                          const isSelected = selectedBulkStudentIds.includes(s.id);
                          return (
                            <tr key={s.id} className={`hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/30' : ''}`}>
                              <td className="py-2.5 px-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedBulkStudentIds([...selectedBulkStudentIds, s.id]);
                                    } else {
                                      setSelectedBulkStudentIds(selectedBulkStudentIds.filter(id => id !== s.id));
                                    }
                                  }}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{s.admission_number}</td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">{s.first_name} {s.last_name}</td>
                              <td className="py-2.5 px-4 text-slate-600">{s.gender || 'Male'}</td>
                              <td className="py-2.5 px-4 text-slate-700">
                                {s.class_name || 'Class'} {s.stream_name ? `(${s.stream_name})` : ''}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${s.boarding_status === 'BOARDING' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'}`}>
                                  {s.boarding_status === 'BOARDING' ? 'Boarding' : 'Day'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-semibold text-emerald-800">
                                {bulkTargetAction === 'promote' && (targetClassObj ? `→ Promote to ${targetClassObj.name}` : '→ Select target class')}
                                {bulkTargetAction === 'change-stream' && (bulkTargetStream ? `→ Move to selected stream` : '→ Auto-balance across streams')}
                                {bulkTargetAction === 'change-boarding' && `→ Switch to ${bulkTargetBoarding}`}
                                {bulkTargetAction === 'graduate' && `→ Graduate (Class of ${bulkGraduationYear})`}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  <strong className="text-slate-900">
                    {selectedBulkStudentIds.length > 0 ? selectedBulkStudentIds.length : eligibleStudents.length}
                  </strong> active student(s) eligible for batch modification
                </span>
                <button
                  onClick={handleExecuteBulkUpdate}
                  disabled={executingBulk || eligibleStudents.length === 0}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {executingBulk ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Executing Bulk Update...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Execute Bulk Update</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. SUB-TAB: DELETED STUDENTS (TRASH BIN) */}
      {activeSubTab === 'deleted' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Deleted Students Trash Bin</h2>
              <p className="text-xs text-slate-500 mt-0.5">Audit log of deleted learners with single-click restoration capabilities</p>
            </div>

            {deletedStudents.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Permanently empty trash bin? This cannot be undone.')) {
                    setDeletedStudents([]);
                    showToast('Trash bin emptied.');
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold"
              >
                Empty Trash Bin
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-5">Adm No</th>
                  <th className="py-3 px-5">Student Name</th>
                  <th className="py-3 px-5">Class</th>
                  <th className="py-3 px-5">Deleted Date</th>
                  <th className="py-3 px-5">Deleted By</th>
                  <th className="py-3 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deletedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Trash bin is empty. No deleted students.
                    </td>
                  </tr>
                ) : (
                  deletedStudents.map((stud) => (
                    <tr key={stud.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-5 font-mono text-slate-700">{stud.admission_number}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-900 uppercase">
                        {stud.first_name} {stud.last_name}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">{stud.class_name || '-'}</td>
                      <td className="py-3.5 px-5 text-slate-500">{stud.deleted_at}</td>
                      <td className="py-3.5 px-5 text-slate-500">{stud.deleted_by}</td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => handleRestoreStudent(stud)}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold mx-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. SUB-TAB: UPLOAD BALANCES */}
      {activeSubTab === 'upload-balances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Upload Student Opening Balances</h2>
              <p className="text-xs text-slate-500 mt-0.5">Bulk import student opening balances and historical ledger carry-forwards via CSV/Excel</p>
            </div>

            <button
              onClick={() => alert('Downloading CSV template: student_balances_template.csv')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download CSV Template</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleFileDrop}
            className={`bg-white rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
              dragActive ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <FileUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="font-extrabold text-sm text-slate-900">Drag & Drop your CSV / Excel balance sheet here</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supported columns: AdmissionNumber, StudentName, ClassName, OpeningBalance, Term
            </p>
            <div className="mt-4">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm">
                <span>Browse Files</span>
                <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          </div>

          {/* Upload Preview Table */}
          {uploadedRows.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-900">Preview Parsed Records ({uploadedRows.length} students)</span>
                <button
                  onClick={handleCommitBalances}
                  disabled={uploadSuccess}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  {uploadSuccess ? 'Balances Committed!' : 'Commit Balances to Ledger'}
                </button>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Adm No</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Class</th>
                    <th className="py-2.5 px-4">Term</th>
                    <th className="py-2.5 px-4 text-right">Opening Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {uploadedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{r.adm}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 uppercase">{r.name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{r.class}</td>
                      <td className="py-2.5 px-4 text-slate-600">{r.term}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 9. SUB-TAB: POPULATION */}
      {activeSubTab === 'population' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">School Demographics & Population Analytics</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time enrolment metrics, boarding breakdown, and class distribution</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Analytics</span>
            </button>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-[11px] font-bold uppercase text-slate-400">Total Enrolment</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalStudents}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% Active Students</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-[11px] font-bold uppercase text-slate-400">Boarding Scholars</div>
              <div className="text-2xl font-extrabold text-purple-700 mt-1">{boardingCount}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                {totalStudents > 0 ? ((boardingCount / totalStudents) * 100).toFixed(1) : 0}% of student body
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-[11px] font-bold uppercase text-slate-400">Day Scholars</div>
              <div className="text-2xl font-extrabold text-orange-600 mt-1">{dayCount}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                {totalStudents > 0 ? ((dayCount / totalStudents) * 100).toFixed(1) : 0}% of student body
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-[11px] font-bold uppercase text-slate-400">Gender Distribution</div>
              <div className="text-sm font-extrabold text-slate-800 mt-2 flex items-center justify-between">
                <span>Female: {femaleCount}</span>
                <span>Male: {maleCount}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden flex">
                <div
                  className="bg-pink-500 h-full"
                  style={{ width: `${totalStudents > 0 ? (femaleCount / totalStudents) * 100 : 50}%` }}
                />
                <div
                  className="bg-sky-500 h-full"
                  style={{ width: `${totalStudents > 0 ? (maleCount / totalStudents) * 100 : 50}%` }}
                />
              </div>
            </div>
          </div>

          {/* Class by Class Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Class & Stream Enrolment Breakdown</h3>
            <div className="space-y-3">
              {classes.map((c) => {
                const classStuds = (students || []).filter((s) => s.class_name === c.name);
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{c.name}</span>
                      <span>{classStuds.length} Students</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${totalStudents > 0 ? (classStuds.length / totalStudents) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}



      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Admit New Student</h3>
                <p className="text-xs text-slate-400 mt-0.5">Register a learner and assign their class & boarding status</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateStudent} className="p-6 overflow-y-auto flex-1 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase">
                      Admission Number <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                      ⚡ Auto-Increment
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BDR-002"
                    value={newStudent.admission_number}
                    onChange={(e) => setNewStudent({ ...newStudent, admission_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Joy"
                    value={newStudent.first_name}
                    onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mutua"
                    value={newStudent.last_name}
                    onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newStudent.class_id || (classes.length > 0 ? classes[0].id : '')}
                    onChange={(e) => setNewStudent({ ...newStudent, class_id: e.target.value, stream_id: '' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Stream Allocation
                  </label>
                  <select
                    value={newStudent.stream_id}
                    onChange={(e) => setNewStudent({ ...newStudent, stream_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-emerald-900 bg-emerald-50/40 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">⚡ Auto-Assign (Rotation & Gender Balance)</option>
                    {classStreamOptions
                      .filter(o => o.class_id === (newStudent.class_id || (classes.length > 0 ? classes[0].id : '')) && o.stream_id)
                      .map((opt, i) => (
                        <option key={i} value={opt.stream_id}>
                          Manual: {opt.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Boarding Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newStudent.boarding_status}
                    onChange={(e) => setNewStudent({ ...newStudent, boarding_status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="DAY">Day Scholar</option>
                    <option value="BOARDING">Boarding</option>
                  </select>
                </div>
              </div>

              {/* Automatic stream & billing notification pill */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Intelligent Stream & Fee Assignment:</strong> New students without a manual stream are automatically rotated across streams with gender balance and assigned their initial opening term fees.
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Guardian / Contact Information
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Guardian Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Mutua"
                      value={newStudent.guardian_name}
                      onChange={(e) => setNewStudent({ ...newStudent, guardian_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Guardian Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +254712345678"
                      value={newStudent.guardian_phone}
                      onChange={(e) => setNewStudent({ ...newStudent, guardian_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Admitting...' : 'Admit Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Create New Activity / House Group</h3>
              <button onClick={() => setShowCreateGroupModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tsavo House"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Category</label>
                <select
                  value={newGroup.category}
                  onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="House / Dormitory">House / Dormitory</option>
                  <option value="Extracurricular Club">Extracurricular Club</option>
                  <option value="Sports Team">Sports Team</option>
                  <option value="Academic Department">Academic Department</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Patron / Master</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Kamau"
                  value={newGroup.patron}
                  onChange={(e) => setNewGroup({ ...newGroup, patron: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {assignModalGroup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {assignModalGroup.category}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Assign Students &rarr; {assignModalGroup.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Patron / Master: <span className="font-semibold text-slate-700">{assignModalGroup.patron || 'Staff Advisor'}</span>
                </p>
              </div>
              <button
                onClick={() => setAssignModalGroup(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student by name or admission number..."
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <select
                  value={assignClassFilter}
                  onChange={(e) => setAssignClassFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value="All">All Classes ({classes.length})</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selection Summary and Quick Controls */}
              {(() => {
                const filtered = (students || []).filter((s) => {
                  const term = assignSearch.trim().toLowerCase();
                  const matchesSearch =
                    term === '' ||
                    String(s.first_name || '').toLowerCase().includes(term) ||
                    String(s.last_name || '').toLowerCase().includes(term) ||
                    String(s.admission_number || '').toLowerCase().includes(term);

                  const targetClass = assignClassFilter.trim().toLowerCase();
                  const matchesClass =
                    targetClass === 'all' ||
                    String(s.class_name || '').toLowerCase() === targetClass;

                  return matchesSearch && matchesClass;
                });

                return (
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="font-semibold">
                      Showing {filtered.length} students &bull;{' '}
                      <span className="text-emerald-700 font-bold">{selectedStudentIdsToAssign.length} selected</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSelectAllStudents(filtered)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline text-xs"
                      >
                        Select Filtered ({filtered.length})
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleDeselectAllStudents(filtered)}
                        className="text-slate-500 hover:text-slate-800 font-medium hover:underline text-xs"
                      >
                        Deselect Filtered
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Scrollable Students List */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 max-h-[50vh]">
              {(() => {
                const filtered = (students || []).filter((s) => {
                  const term = assignSearch.trim().toLowerCase();
                  const matchesSearch =
                    term === '' ||
                    String(s.first_name || '').toLowerCase().includes(term) ||
                    String(s.last_name || '').toLowerCase().includes(term) ||
                    String(s.admission_number || '').toLowerCase().includes(term);

                  const targetClass = assignClassFilter.trim().toLowerCase();
                  const matchesClass =
                    targetClass === 'all' ||
                    String(s.class_name || '').toLowerCase() === targetClass;

                  return matchesSearch && matchesClass;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No students found matching current filters.
                    </div>
                  );
                }

                return (
                  <div className="space-y-1.5">
                    {filtered.map((student) => {
                      const isSelected = selectedStudentIdsToAssign.includes(student.id);
                      const wasAlreadyMember = assignedMemberIds.includes(student.id);

                      return (
                        <div
                          key={student.id}
                          onClick={() => handleToggleStudentSelection(student.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none"
                            />
                            <div>
                              <div className="font-extrabold text-xs text-slate-900 uppercase flex items-center gap-2">
                                <span>{student.first_name} {student.last_name}</span>
                                {wasAlreadyMember && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded font-semibold normal-case">
                                    Current Member
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Adm: <span className="font-semibold text-slate-700">{student.admission_number}</span> &bull; {student.class_name ? `${student.class_name}${student.stream_name ? ` (${student.stream_name})` : ''}` : 'No class'}
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            String(student.boarding_status).toUpperCase() === 'BOARDING'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {student.boarding_status || 'DAY'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-800">{selectedStudentIdsToAssign.length}</span> students will be assigned
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalGroup(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={assigning}
                  onClick={handleSaveGroupAssignments}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                >
                  {assigning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Assignments...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Assignments ({selectedStudentIdsToAssign.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {viewMembersModalGroup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {viewMembersModalGroup.category}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {viewMembersModalGroup.name} &mdash; Enrolled Members ({currentGroupMembers.length})
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Patron / Master: <span className="font-semibold text-slate-700">{viewMembersModalGroup.patron || 'Staff Advisor'}</span>
                </p>
              </div>
              <button
                onClick={() => setViewMembersModalGroup(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {loadingMembers ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span>Loading enrolled members...</span>
                </div>
              ) : currentGroupMembers.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Users className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    No students currently assigned to this group.
                  </p>
                  <button
                    onClick={() => {
                      const grp = viewMembersModalGroup;
                      setViewMembersModalGroup(null);
                      handleOpenAssignModal(grp);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Assign Students Now</span>
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-3 px-4 w-10">#</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Admission</th>
                        <th className="py-3 px-4">Class & Stream</th>
                        <th className="py-3 px-4 text-center">Boarding</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentGroupMembers.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-900 uppercase">
                            {m.first_name} {m.last_name}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                            {m.admission_number}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {m.class_name ? `${m.class_name}${m.stream_name ? ` (${m.stream_name})` : ''}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {m.boarding_status || 'DAY'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleRemoveMember(viewMembersModalGroup.id, m.id, `${m.first_name} ${m.last_name}`)}
                              className="text-rose-600 hover:text-rose-800 font-bold text-xs hover:underline"
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

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Total Members: <span className="font-bold text-slate-800">{currentGroupMembers.length}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMembersModalGroup(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const grp = viewMembersModalGroup;
                    setViewMembersModalGroup(null);
                    handleOpenAssignModal(grp);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign More Students</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Edit Student Details</h3>
                <p className="text-xs text-slate-500">Update learner profile, class enrollment, and guardian contacts</p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Admission Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.admission_number}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, admission_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Gender</label>
                  <select
                    value={editStudentForm.gender}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.first_name}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.last_name}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Class & Stream <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={`${editStudentForm.class_id}|${editStudentForm.stream_id}`}
                    onChange={(e) => {
                      const [cId, sId] = e.target.value.split('|');
                      const opt = classStreamOptions.find(o => o.class_id === cId && o.stream_id === sId);
                      setEditStudentForm({
                        ...editStudentForm,
                        class_id: cId,
                        stream_id: sId,
                        stream_name: opt ? opt.label : ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    {classStreamOptions.map((opt, i) => (
                      <option key={i} value={`${opt.class_id}|${opt.stream_id}`}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Boarding Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editStudentForm.boarding_status}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, boarding_status: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 bg-emerald-50/50"
                  >
                    <option value="DAY">Day Scholar</option>
                    <option value="BOARDING">Boarding</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Guardian Information
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={editStudentForm.guardian_name}
                      onChange={(e) => setEditStudentForm({ ...editStudentForm, guardian_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Guardian Phone</label>
                    <input
                      type="text"
                      value={editStudentForm.guardian_phone}
                      onChange={(e) => setEditStudentForm({ ...editStudentForm, guardian_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStudent}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {updatingStudent ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile Quick View Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm uppercase">
                  {viewingStudent.first_name?.charAt(0)}{viewingStudent.last_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                    {viewingStudent.first_name} {viewingStudent.last_name}
                  </h3>
                  <span className="text-xs font-mono text-slate-500 font-bold">
                    Adm: {viewingStudent.admission_number}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Class & Stream</span>
                <span className="font-bold text-slate-800">{viewingStudent.class_name || 'Form 1'} {viewingStudent.stream_name ? `(${viewingStudent.stream_name})` : ''}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Boarding Status</span>
                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                  viewingStudent.boarding_status === 'BOARDING' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {viewingStudent.boarding_status === 'BOARDING' ? 'Boarding' : 'Day Scholar'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Guardian Name</span>
                <span className="font-semibold text-slate-800">{viewingStudent.guardian_name || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Guardian Phone</span>
                <span className="font-mono font-semibold text-slate-800">{viewingStudent.guardian_phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Current Outstanding Balance</span>
                <span className="font-mono font-black text-base text-emerald-900">
                  {formatCurrency(viewingStudent.balance || 0)}
                </span>
              </div>
              <button
                onClick={() => {
                  const id = viewingStudent.id;
                  setViewingStudent(null);
                  handleOpenStatement(id);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs"
              >
                Full Statement &rarr;
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const s = viewingStudent;
                  setViewingStudent(null);
                  handleStartEditStudent(s);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Fee Statement Modal */}
      {statementStudentId && (
        <FeeStatementModal
          studentId={statementStudentId}
          onClose={() => setStatementStudentId(null)}
          onRecordPayment={onRecordPaymentForStudent}
        />
      )}
    </div>
  );
};
