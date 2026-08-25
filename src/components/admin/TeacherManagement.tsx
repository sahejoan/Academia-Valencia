import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Briefcase,
  BookOpen,
  Calendar,
  Clock,
  Building,
  FileText,
  Mail,
  Phone,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  X,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  ShieldCheck,
  CalendarDays,
  Info,
  List,
  LayoutGrid
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, Course, GradeItem } from '../../types';
import { generateTeacherWorkloadPDF, generateCourseGradeActPDF } from '../../utils/pdfExport';
import { checkTeacherScheduleConflict } from '../../utils/conflictDetector';

export const TeacherManagement: React.FC = () => {
  const {
    users,
    courses,
    enrollments,
    grades,
    activeTerm,
    saveUser,
    deleteUser,
    saveCourse
  } = useApp();

  // Filter only teachers (profesores)
  const teachers = useMemo(() => {
    return users.filter(u => u.role === 'teacher');
  }, [users]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedLoadStatus, setSelectedLoadStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignCourseModalOpen, setIsAssignCourseModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [selectedCourseToAssign, setSelectedCourseToAssign] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form State with Department & Specialty explicitly editable
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    cedula: string;
    code: string;
    email: string;
    phone: string;
    department: string;
    specialty: string;
    password?: string;
  }>({
    name: '',
    cedula: '',
    code: '',
    email: '',
    phone: '',
    department: 'Área Tecnológica & Computación',
    specialty: '',
    password: 'docente123'
  });

  // Extract unique departments
  const departmentOptions = useMemo(() => {
    const defaultDepts = [
      'Área Tecnológica & Computación',
      'Área Industrial & Automotriz',
      'Área Comercial & Administrativa',
      'Área Artesanal & Belleza',
      'Área Gerencial & Liderazgo',
      'Área de Ciencias & Comunicación'
    ];
    const set = new Set<string>(defaultDepts);
    teachers.forEach(t => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set);
  }, [teachers]);

  // Helper to compute a teacher's workload
  const getTeacherMetrics = (teacher: User) => {
    const teacherCourses = courses.filter(
      c => c.teacherId === teacher.id || (c.teacherName && c.teacherName.toLowerCase().includes(teacher.name.toLowerCase()) && c.teacherName !== 'Sin asignar')
    );
    const totalSections = teacherCourses.length;
    const teacherCourseIds = new Set(teacherCourses.map(c => c.id));
    const teacherEnrollments = enrollments.filter(
      e => teacherCourseIds.has(e.courseId) && e.status !== 'Cancelado'
    );
    const totalStudents = teacherEnrollments.length;
    const uniqueStudents = new Set(teacherEnrollments.map(e => e.studentId || e.studentName)).size;
    const totalHours = teacherCourses.reduce((acc, c) => acc + (c.schedules?.length || 1) * 2, 0);

    return {
      teacherCourses,
      totalSections,
      totalStudents,
      uniqueStudents,
      totalHours
    };
  };

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.cedula && t.cedula.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.code && t.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.department && t.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.specialty && t.specialty.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDept = selectedDept === 'all' || t.department === selectedDept;

      const { totalHours } = getTeacherMetrics(t);
      let matchLoad = true;
      if (selectedLoadStatus === 'high') matchLoad = totalHours >= 16;
      else if (selectedLoadStatus === 'normal') matchLoad = totalHours > 0 && totalHours < 16;
      else if (selectedLoadStatus === 'empty') matchLoad = totalHours === 0;

      return matchSearch && matchDept && matchLoad;
    });
  }, [teachers, searchTerm, selectedDept, selectedLoadStatus, courses]);

  // Global KPIs
  const globalKpis = useMemo(() => {
    const total = teachers.length;
    let sumHours = 0;
    let sumSections = 0;
    let sumStudents = 0;

    teachers.forEach(t => {
      const { totalHours, totalSections, totalStudents } = getTeacherMetrics(t);
      sumHours += totalHours;
      sumSections += totalSections;
      sumStudents += totalStudents;
    });

    const avgSections = total > 0 ? (sumSections / total).toFixed(1) : '0';

    return {
      total,
      sumHours,
      avgSections,
      sumStudents
    };
  }, [teachers, courses]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedTeacher(null);
    setFormData({
      name: '',
      cedula: '',
      code: `PROF-${Math.floor(100 + Math.random() * 900)}`,
      email: '',
      phone: '',
      department: 'Área Tecnológica & Computación',
      specialty: '',
      password: 'docente123'
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (teacher: User) => {
    setSelectedTeacher(teacher);
    setFormData({
      id: teacher.id,
      name: teacher.name,
      cedula: teacher.cedula || '',
      code: teacher.code || '',
      email: teacher.email,
      phone: teacher.phone || '',
      department: teacher.department || 'Área Tecnológica & Computación',
      specialty: teacher.specialty || '',
      password: teacher.password || 'docente123'
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormModalOpen(true);
  };

  // Open Detail Modal (only if courses exist, or to inspect profile)
  const handleOpenDetail = (teacher: User) => {
    setSelectedTeacher(teacher);
    setIsDetailModalOpen(true);
  };

  // Open Assign Course Modal
  const handleOpenAssignModal = (teacher: User) => {
    setSelectedTeacher(teacher);
    setSelectedCourseToAssign('');
    setIsAssignCourseModalOpen(true);
  };

  // Submit Teacher Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('El nombre del profesor es obligatorio.');
      return;
    }

    if (!formData.cedula.trim()) {
      setFormError('La cédula de identidad es obligatoria.');
      return;
    }

    if (!formData.department.trim()) {
      setFormError('Debe seleccionar o indicar el departamento / área académica.');
      return;
    }

    if (!formData.specialty.trim()) {
      setFormError('Debe ingresar la especialidad del profesor.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Debe ingresar un correo electrónico válido.');
      return;
    }

    const cleanCedDigits = formData.cedula.replace(/[^0-9]/g, '');
    const userPayload: User = {
      id: formData.id || `user-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      cedula: formData.cedula.trim(),
      code: formData.code.trim() || `PROF-${cleanCedDigits.slice(-4) || Math.floor(100 + Math.random() * 900)}`,
      department: formData.department.trim(),
      specialty: formData.specialty.trim(),
      phone: formData.phone.trim(),
      role: 'teacher',
      avatar: selectedTeacher?.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      password: formData.password || 'docente123'
    };

    const res = saveUser(userPayload);
    if (!res.success) {
      setFormError(res.message);
    } else {
      setFormSuccess('Profesor guardado exitosamente.');
      setTimeout(() => {
        setIsFormModalOpen(false);
        setFormSuccess(null);
      }, 700);
    }
  };

  // Delete Teacher
  const handleDeleteTeacher = (teacher: User) => {
    if (window.confirm(`¿Está seguro de eliminar al profesor "${teacher.name}" (Cédula: ${teacher.cedula || teacher.code})? Los cursos a su cargo quedarán sin asignar.`)) {
      deleteUser(teacher.id);
      if (selectedTeacher?.id === teacher.id) {
        setIsDetailModalOpen(false);
      }
    }
  };

  // Courses currently assigned to selected teacher
  const teacherAssignedCourses = useMemo(() => {
    if (!selectedTeacher) return [];
    return courses.filter(
      c => c.teacherId === selectedTeacher.id || (c.teacherName && c.teacherName.toLowerCase().includes(selectedTeacher.name.toLowerCase()) && c.teacherName !== 'Sin asignar' && c.teacherName !== 'Por definir')
    );
  }, [selectedTeacher, courses]);

  // Selected candidate course object and conflict status
  const selectedCandidateCourse = useMemo(() => {
    if (!selectedCourseToAssign) return null;
    return courses.find(c => c.id === selectedCourseToAssign) || null;
  }, [selectedCourseToAssign, courses]);

  const teacherScheduleConflict = useMemo(() => {
    if (!selectedCandidateCourse || !selectedTeacher) return { hasConflict: false };
    return checkTeacherScheduleConflict(selectedCandidateCourse, teacherAssignedCourses);
  }, [selectedCandidateCourse, selectedTeacher, teacherAssignedCourses]);

  // Reassign / Assign a course to teacher
  const handleAssignCourseToTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedCourseToAssign || !selectedCandidateCourse) return;

    if (teacherScheduleConflict.hasConflict) {
      alert(`No se puede asignar el curso debido a un choque de horario:\n\n${teacherScheduleConflict.reason}`);
      return;
    }

    const updatedCourse: Course = {
      ...selectedCandidateCourse,
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,
      cedula_profesor: selectedTeacher.cedula || ''
    };

    const res = saveCourse(updatedCourse);
    if (res.success) {
      alert(`Curso "${selectedCandidateCourse.name}" asignado exitosamente al profesor ${selectedTeacher.name}. Ahora las opciones de carga horaria y secciones están habilitadas.`);
      setIsAssignCourseModalOpen(false);
      setSelectedCourseToAssign('');
    } else {
      alert(res.message);
    }
  };

  // Courses not currently assigned to selected teacher
  const otherCourses = useMemo(() => {
    if (!selectedTeacher) return [];
    return courses.filter(c => c.teacherId !== selectedTeacher.id && c.teacherName !== selectedTeacher.name);
  }, [selectedTeacher, courses]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
            <Briefcase className="w-4 h-4" /> Módulo de Gestión de Profesores
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Planta de Profesores & Carga Académica
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
            Administración del cuerpo de profesores y facilitadores, asignación de cursos, cálculo de carga lectiva y emisión de actas oficiales.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="px-5 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-sky-400" />
            <span>Nuevo Profesor</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Profesores</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{globalKpis.total}</h3>
            <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Planta profesoral registrada
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6600] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Horas Semanales Totales</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{globalKpis.sumHours} <span className="text-xs font-normal text-slate-400">h/sem</span></h3>
            <span className="text-[11px] text-orange-600 font-semibold mt-0.5 block">
              Distribución de carga
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Promedio Cursos / Prof.</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{globalKpis.avgSections}</h3>
            <span className="text-[11px] text-purple-600 font-semibold mt-0.5 block">
              Secciones por profesor
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Alumnos Atendidos</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{globalKpis.sumStudents}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Matrícula total en cursos
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, cédula (V-...), código (PROF-...), departamento o especialidad..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Departamento / Área:</span>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las Áreas / Departamentos</option>
                {departmentOptions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Carga Horaria:</span>
              <select
                value={selectedLoadStatus}
                onChange={e => setSelectedLoadStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                <option value="high">Carga Alta (≥ 16 h/sem)</option>
                <option value="normal">Carga Regular (1 - 14 h/sem)</option>
                <option value="empty">Sin Carga (0 h/sem)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Listing */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Cuerpo Profesoral Institucional
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600">
              {filteredTeachers.length} {filteredTeachers.length === 1 ? 'profesor' : 'profesores'}
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Vista en Tabla Compacta"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Vista en Tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Tarjetas</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium hidden md:inline">
              Período: <strong className="text-slate-700 dark:text-slate-300">{activeTerm}</strong>
            </span>
          </div>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No hay profesores registrados</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Presione el botón "Nuevo Profesor" en la parte superior para comenzar a registrar el cuerpo de profesores de la institución.
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer mt-2"
            >
              <UserPlus className="w-4 h-4" /> Registrar Primer Profesor
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="w-full">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3 sm:px-4">Profesor / Identificación</th>
                  <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Área & Especialidad</th>
                  <th className="py-3 px-2 sm:px-3 text-center">Cursos / Carga</th>
                  <th className="py-3 px-2 sm:px-3 text-center hidden md:table-cell">Alumnos</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredTeachers.map(teacher => {
                  const { teacherCourses, totalSections, totalStudents, totalHours } = getTeacherMetrics(teacher);
                  const hasCourses = totalSections > 0;

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      {/* Profesor e Identificación */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <img
                            src={teacher.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`}
                            alt={teacher.name}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                              {teacher.name}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] mt-0.5">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {teacher.cedula || 'S/C'}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                                {teacher.code}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-2.5 h-2.5 shrink-0" /> <span className="truncate">{teacher.email}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 sm:hidden mt-0.5 truncate">
                              {teacher.department || 'Área General'} {teacher.specialty ? `• ${teacher.specialty}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Área y Especialidad (sm+) */}
                      <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[220px]">
                          {teacher.department || 'Área General'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                          {teacher.specialty || 'Sin especialidad'}
                        </p>
                      </td>

                      {/* Cursos / Carga Horaria */}
                      <td className="py-3 px-2 sm:px-3 text-center">
                        {hasCourses ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 font-extrabold text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              {totalSections} {totalSections === 1 ? 'curso' : 'cursos'}
                            </span>
                            <span className="font-black text-slate-800 dark:text-slate-200 text-[10px] sm:text-[11px] mt-0.5 whitespace-nowrap">
                              {totalHours} h/sem
                            </span>
                            <span className="text-[10px] text-slate-400 md:hidden mt-0.5">
                              {totalStudents} alum.
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-medium whitespace-nowrap">
                            0 cursos
                          </span>
                        )}
                      </td>

                      {/* Alumnos (md+) */}
                      <td className="py-3 px-2 sm:px-3 text-center hidden md:table-cell">
                        {hasCourses ? (
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                            {totalStudents}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
                          {/* Ficha */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(teacher)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 rounded-lg transition cursor-pointer"
                            title={hasCourses ? 'Ver Carga Horaria y Secciones' : 'Ver Ficha del Profesor'}
                          >
                            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>

                          {/* Asignar */}
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(teacher)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 rounded-lg transition cursor-pointer"
                            title="Asignar Cursos del Catálogo"
                          >
                            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>

                          {/* PDF */}
                          <button
                            type="button"
                            disabled={!hasCourses}
                            onClick={() => {
                              if (!hasCourses) return;
                              const tCourses = courses.filter(
                                c => c.teacherId === teacher.id || (c.teacherName && c.teacherName.toLowerCase().includes(teacher.name.toLowerCase()) && c.teacherName !== 'Sin asignar')
                              );
                              generateTeacherWorkloadPDF(teacher, tCourses, activeTerm);
                            }}
                            className={`p-1.5 rounded-lg transition ${
                              hasCourses
                                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer'
                                : 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed'
                            }`}
                            title={hasCourses ? 'Descargar Horario y Carga del Profesor (PDF)' : 'Requiere al menos 1 curso asignado para generar el horario'}
                          >
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF6600]" />
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(teacher)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer"
                            title="Editar Datos del Profesor"
                          >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(teacher)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 rounded-lg transition cursor-pointer"
                            title="Eliminar Profesor"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards View */
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTeachers.map(teacher => {
              const { teacherCourses, totalSections, totalStudents, totalHours } = getTeacherMetrics(teacher);
              const hasCourses = totalSections > 0;

              return (
                <div
                  key={teacher.id}
                  className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={teacher.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`}
                        alt={teacher.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                          {teacher.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{teacher.cedula || 'S/C'}</span>
                          <span>•</span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">{teacher.code}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" /> {teacher.email}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Área & Especialidad</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{teacher.department || 'Área General'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{teacher.specialty || 'Sin especialidad'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">Cursos</span>
                        <span className="font-black text-slate-900 dark:text-white">{totalSections}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/50">
                        <span className="text-[10px] text-[#FF6600] font-bold block">Horas/Sem</span>
                        <span className="font-black text-slate-900 dark:text-white">{totalHours}h</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">Alumnos</span>
                        <span className="font-black text-slate-900 dark:text-white">{totalStudents}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(teacher)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Ver Ficha y Carga"
                      >
                        <Layers className="w-3.5 h-3.5" /> Ficha
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(teacher)}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Asignar Curso"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Asignar
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!hasCourses}
                        onClick={() => {
                          if (!hasCourses) return;
                          const tCourses = courses.filter(
                            c => c.teacherId === teacher.id || (c.teacherName && c.teacherName.toLowerCase().includes(teacher.name.toLowerCase()) && c.teacherName !== 'Sin asignar')
                          );
                          generateTeacherWorkloadPDF(teacher, tCourses, activeTerm);
                        }}
                        className={`p-1.5 rounded-lg transition ${
                          hasCourses
                            ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer'
                            : 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed'
                        }`}
                        title="Horario PDF"
                      >
                        <FileText className="w-4 h-4 text-[#FF6600]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeacher(teacher)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 rounded-lg transition cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: FICHA PROFESIONAL Y CARGA DEL PROFESOR */}
      {isDetailModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={selectedTeacher.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`}
                  alt={selectedTeacher.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/50 shadow-md"
                />
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                    <Briefcase className="w-3 h-3" /> Ficha del Profesor
                  </div>
                  <h3 className="text-xl font-black text-white">{selectedTeacher.name}</h3>
                  <p className="text-xs text-slate-300 font-mono">
                    Cédula: <strong>{selectedTeacher.cedula || 'S/C'}</strong> • Código: <strong>{selectedTeacher.code}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Teacher Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Departamento / Área</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedTeacher.department || 'Área General'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Especialidad</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedTeacher.specialty || 'Sin especialidad'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Contacto</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{selectedTeacher.email}</p>
                </div>
              </div>

              {/* Workload Status & Actions */}
              {(() => {
                const tCourses = courses.filter(
                  c => c.teacherId === selectedTeacher.id || (c.teacherName && c.teacherName.toLowerCase().includes(selectedTeacher.name.toLowerCase()) && c.teacherName !== 'Sin asignar')
                );
                const hasCourses = tCourses.length > 0;

                return (
                  <div className="space-y-4">
                    {!hasCourses ? (
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Opciones de Carga Horaria y Secciones no habilitadas</p>
                          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                            El profesor aún no tiene cursos asignados. Asigne al menos un curso desde el botón inferior para activar el horario lectivo semanal, secciones y descarga de actas.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          onClick={() => {
                            generateTeacherWorkloadPDF(selectedTeacher, tCourses, activeTerm);
                          }}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                        >
                          <FileText className="w-4 h-4" /> Descargar Horario y Carga en PDF
                        </button>
                      </div>
                    )}

                    {/* Assigned Courses Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          Cursos y Secciones a su Cargo ({tCourses.length})
                        </h4>
                        <button
                          onClick={() => {
                            setIsDetailModalOpen(false);
                            handleOpenAssignModal(selectedTeacher);
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Asignar Curso
                        </button>
                      </div>

                      {tCourses.length === 0 ? (
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">El profesor no tiene cursos asignados actualmente.</p>
                          <button
                            onClick={() => {
                              setIsDetailModalOpen(false);
                              handleOpenAssignModal(selectedTeacher);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xs transition"
                          >
                            <Plus className="w-3.5 h-3.5" /> Asignar Primer Curso
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {tCourses.map(course => {
                            const courseGrades = grades.filter(g => g.courseId === course.id);
                            const courseEnrolledStudents = enrollments.filter(
                              e => e.courseId === course.id && e.status !== 'Cancelado'
                            );

                            return (
                              <div
                                key={course.id}
                                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col gap-2 text-xs"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{course.code}</span>
                                      <span className="font-extrabold text-slate-900 dark:text-white">{course.name}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      Horario: {course.schedules.map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime} (${s.classroomName})`).join(' | ')}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 self-end sm:self-center">
                                    <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                      courseEnrolledStudents.length > 0
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}>
                                      {courseEnrolledStudents.length} / {course.capacity} alumnos
                                    </span>

                                    <button
                                      onClick={() => generateCourseGradeActPDF(course, courseGrades)}
                                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition"
                                      title="Descargar Acta Oficial de Calificaciones"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-[#FF6600]" /> Acta PDF
                                    </button>
                                  </div>
                                </div>

                                {courseEnrolledStudents.length > 0 && (
                                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estudiantes matriculados:</span>
                                    {courseEnrolledStudents.map(enr => (
                                      <span key={enr.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200 dark:border-blue-800">
                                        {enr.studentName} ({enr.studentCode})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASIGNAR CURSO AL PROFESOR */}
      {isAssignCourseModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Asignar Curso al Profesor
                </h3>
                <p className="text-xs text-slate-500">
                  Profesor: <strong className="text-slate-800 dark:text-slate-200">{selectedTeacher.name}</strong> ({selectedTeacher.code})
                </p>
              </div>
              <button
                onClick={() => setIsAssignCourseModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clarification banner */}
            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs flex items-start gap-2.5 text-blue-800 dark:text-blue-200">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Al asignar un curso, se habilitará automáticamente la carga horaria semanal, las secciones y los reportes oficiales para este profesor.
              </p>
            </div>

            <form onSubmit={handleAssignCourseToTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Seleccionar Curso del Catálogo ({otherCourses.length} disponibles)
                </label>
                <select
                  value={selectedCourseToAssign}
                  onChange={e => setSelectedCourseToAssign(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccionar Curso --</option>
                  {otherCourses.map(c => {
                    const hasConflictWithTch = checkTeacherScheduleConflict(c, teacherAssignedCourses).hasConflict;
                    return (
                      <option key={c.id} value={c.id}>
                        {hasConflictWithTch ? '⚠️ [Choque de Horario] ' : ''}{c.code} - {c.name} ({c.schedules.map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join(', ')})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedCourseToAssign && selectedCandidateCourse && (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">Detalles del Curso a Asignar:</p>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                      <p>• <strong>Horario:</strong> {selectedCandidateCourse.schedules.map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join(', ')}</p>
                      <p>• <strong>Aula:</strong> {selectedCandidateCourse.schedules.map(s => s.classroomName).join(', ')}</p>
                      <p>• <strong>Matriculados:</strong> {selectedCandidateCourse.enrolledCount} / {selectedCandidateCourse.capacity} alumnos</p>
                    </div>
                  </div>

                  {teacherScheduleConflict.hasConflict && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs flex items-start gap-2.5 text-rose-800 dark:text-rose-200">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-rose-900 dark:text-rose-100">Solapamiento de Horarios Detectado</p>
                        <p className="text-[11px] mt-0.5 leading-relaxed">{teacherScheduleConflict.reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignCourseModalOpen(false);
                    setSelectedCourseToAssign('');
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedCourseToAssign || teacherScheduleConflict.hasConflict}
                  className={`px-5 py-2 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 ${
                    !selectedCourseToAssign || teacherScheduleConflict.hasConflict
                      ? 'bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREAR O EDITAR PROFESOR */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedTeacher ? 'Editar Expediente del Profesor' : 'Registrar Nuevo Profesor'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ingrese los datos académicos del profesor para el período {activeTerm}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombres y Apellidos del Profesor *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej. Ing. Jhonny Rodríguez Valera"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cédula / DNI *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cedula}
                    onChange={e => setFormData(prev => ({ ...prev, cedula: e.target.value }))}
                    placeholder="V-18491022"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Código de Profesor
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="PROF-204"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Departamento y Especialidad explícitamente en el Formulario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento / Área Académica *
                  </label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Área Tecnológica & Computación">Área Tecnológica & Computación</option>
                    <option value="Área Industrial & Automotriz">Área Industrial & Automotriz</option>
                    <option value="Área Comercial & Administrativa">Área Comercial & Administrativa</option>
                    <option value="Área Artesanal & Belleza">Área Artesanal & Belleza</option>
                    <option value="Área Gerencial & Liderazgo">Área Gerencial & Liderazgo</option>
                    <option value="Área de Ciencias & Comunicación">Área de Ciencias & Comunicación</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Especialidad del Profesor *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.specialty}
                    onChange={e => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                    placeholder="Ej. Redes, Reparación de Computadoras, Electrónica"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="profesor@academiavalencia.edu"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0414-1234567"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña de Acceso Portal
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="docente123"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {selectedTeacher ? 'Guardar Cambios' : 'Registrar Profesor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
