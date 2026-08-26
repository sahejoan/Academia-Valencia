import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  GraduationCap,
  FileText,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  X,
  Plus,
  ChevronRight,
  Sparkles,
  Fingerprint,
  Building,
  Clock,
  UserCheck,
  RefreshCw,
  ExternalLink,
  Check,
  CheckSquare,
  Square,
  Filter,
  Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, Course, GradeItem, Enrollment } from '../../types';
import { generateStudyCertificatePDF, generateStudentTranscriptPDF } from '../../utils/pdfExport';
import { checkStudentScheduleConflict, checkCourseSectionClosed } from '../../utils/conflictDetector';
import { formatDecimal, formatGrade } from '../../utils/gradeHelpers';

export const OFFICIAL_AREAS = [
  {
    key: 'COMERCIAL',
    label: 'Área Comercial',
    costWeekly: 12,
    costText: '12$ Semanal',
    prefix: 'COM-',
    color: 'blue',
    desc: '15 Cursos técnicos, informática y administración',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200'
  },
  {
    key: 'INDUSTRIAL',
    label: 'Área Industrial',
    costWeekly: 12,
    costText: '12$ Semanal',
    prefix: 'IND-',
    color: 'amber',
    desc: '14 Cursos técnicos, automotriz e instalaciones',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
  },
  {
    key: 'GERENCIAL',
    label: 'Área Gerencial',
    costWeekly: 12,
    costText: '12$ Semanal',
    prefix: 'GER-',
    color: 'purple',
    desc: '7 Cursos de alta dirección, finanzas y ventas',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200'
  },
  {
    key: 'ARTESANAL',
    label: 'Área Artesanal',
    costWeekly: 10,
    costText: '10$ Semanal',
    prefix: 'ART-',
    color: 'rose',
    desc: '11 Cursos de estética, barbería y confección textil',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200'
  }
];

export const getNormalizedArea = (areaString?: string): string => {
  const s = (areaString || '').toUpperCase();
  if (s.includes('COMERCIAL') || s.includes('SOFTWARE') || s.includes('COMPUTAC') || s.includes('TECNOL') || s.includes('VENTAS')) return 'COMERCIAL';
  if (s.includes('INDUSTRIAL') || s.includes('MECANIC') || s.includes('AUTOMOTRIZ') || s.includes('ELECTRIC') || s.includes('REFRIGERAC')) return 'INDUSTRIAL';
  if (s.includes('GERENCIAL') || s.includes('ADMINISTRA') || s.includes('FINANZAS') || s.includes('LIDERAZGO') || s.includes('NEGOCIOS') || s.includes('DIRECCION')) return 'GERENCIAL';
  if (s.includes('ARTESANAL') || s.includes('ESTETICA') || s.includes('TEXTIL') || s.includes('BELLEZA') || s.includes('MANUAL') || s.includes('BARBER')) return 'ARTESANAL';
  return 'COMERCIAL';
};

export const StudentManagement: React.FC = () => {
  const {
    users,
    courses,
    enrollments,
    grades,
    activeTerm,
    saveUser,
    deleteUser,
    enrollCourse,
    dropEnrollment,
    currentUser
  } = useApp();

  // Filter only students
  const students = useMemo(() => {
    return users.filter(u => u.role === 'student');
  }, [users]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCareer, setSelectedCareer] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedCourseToEnroll, setSelectedCourseToEnroll] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Full Course Catalog Selection State
  const [courseCatalogSearch, setCourseCatalogSearch] = useState('');
  const [selectedCourseCategory, setSelectedCourseCategory] = useState<string>('all');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [initialCourseIds, setInitialCourseIds] = useState<string[]>([]);
  const [formCourseSearch, setFormCourseSearch] = useState('');
  const [formAreaFilter, setFormAreaFilter] = useState<string>('COMERCIAL');

  // Student Form State
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    cedula: string;
    code: string;
    email: string;
    phone: string;
    career: string;
    semester: number;
    password?: string;
  }>({
    name: '',
    cedula: '',
    code: '',
    email: '',
    phone: '',
    career: 'Área Comercial',
    semester: 1,
    password: 'estudiante123'
  });

  // Extract unique careers / areas
  const careerOptions = useMemo(() => {
    const defaultAreas = ['Área Comercial', 'Área Industrial', 'Área Gerencial', 'Área Artesanal'];
    const set = new Set<string>(defaultAreas);
    students.forEach(s => {
      if (s.career) set.add(s.career);
    });
    return Array.from(set);
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.cedula && s.cedula.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCareer =
        selectedCareer === 'all' ||
        s.career === selectedCareer ||
        getNormalizedArea(s.career) === getNormalizedArea(selectedCareer);

      const matchSemester = selectedSemester === 'all' || (s.semester || 1).toString() === selectedSemester;

      return matchSearch && matchCareer && matchSemester;
    });
  }, [students, searchTerm, selectedCareer, selectedSemester]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    const total = students.length;
    let totalEnrolled = 0;
    let sumGpa = 0;
    let gpaCount = 0;
    let riskCount = 0;

    students.forEach(s => {
      const studentEnrs = enrollments.filter(e => e.studentId === s.id);
      if (studentEnrs.length > 0) totalEnrolled++;

      const studentGrades = grades.filter(g => g.studentId === s.id);
      if (studentGrades.length > 0) {
        const avg = studentGrades.reduce((a, b) => a + b.finalGrade, 0) / studentGrades.length;
        sumGpa += avg;
        gpaCount++;
        if (avg < 10 && avg > 0) riskCount++;
      }
    });

    const averageGpa = gpaCount > 0 ? formatDecimal(sumGpa / gpaCount, 1, false) : '16,5';

    return {
      total,
      totalEnrolled,
      averageGpa,
      riskCount
    };
  }, [students, enrollments, grades]);

  // Category counts calculation across ALL existing courses
  const categoryCounts = useMemo(() => {
    const com = courses.filter(c => (c.categoria && c.categoria.toUpperCase() === 'COMERCIAL') || (c.department && c.department.toLowerCase().includes('comercial')) || c.code.startsWith('COM-')).length;
    const ind = courses.filter(c => (c.categoria && c.categoria.toUpperCase() === 'INDUSTRIAL') || (c.department && c.department.toLowerCase().includes('industrial')) || c.code.startsWith('IND-')).length;
    const ger = courses.filter(c => (c.categoria && c.categoria.toUpperCase() === 'GERENCIAL') || (c.department && c.department.toLowerCase().includes('gerencial')) || c.code.startsWith('GER-')).length;
    const art = courses.filter(c => (c.categoria && c.categoria.toUpperCase() === 'ARTESANAL') || (c.department && c.department.toLowerCase().includes('artesanal')) || c.code.startsWith('ART-')).length;
    return {
      all: courses.length,
      COMERCIAL: com,
      INDUSTRIAL: ind,
      GERENCIAL: ger,
      ARTESANAL: art
    };
  }, [courses]);

  // Filtered courses for the enrollment modal across ALL existing courses
  const filteredCatalogCourses = useMemo(() => {
    return courses.filter(c => {
      const q = courseCatalogSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.department && c.department.toLowerCase().includes(q)) ||
        (c.teacherName && c.teacherName.toLowerCase().includes(q)) ||
        (c.specialty && c.specialty.toLowerCase().includes(q));

      const matchCategory =
        selectedCourseCategory === 'all' ||
        (c.categoria && c.categoria.toUpperCase() === selectedCourseCategory.toUpperCase()) ||
        (c.department && c.department.toUpperCase().includes(selectedCourseCategory.toUpperCase())) ||
        (selectedCourseCategory === 'COMERCIAL' && (c.code.startsWith('COM-') || (c.categoria && c.categoria.toUpperCase().includes('COMERCIAL')))) ||
        (selectedCourseCategory === 'INDUSTRIAL' && (c.code.startsWith('IND-') || (c.categoria && c.categoria.toUpperCase().includes('INDUSTRIAL')))) ||
        (selectedCourseCategory === 'GERENCIAL' && (c.code.startsWith('GER-') || (c.categoria && c.categoria.toUpperCase().includes('GERENCIAL')))) ||
        (selectedCourseCategory === 'ARTESANAL' && (c.code.startsWith('ART-') || (c.categoria && c.categoria.toUpperCase().includes('ARTESANAL'))));

      return matchSearch && matchCategory;
    });
  }, [courses, courseCatalogSearch, selectedCourseCategory]);

  // Courses strictly filtered by Area in the Student Registration / Edit Form
  const formFilteredCourses = useMemo(() => {
    const activeAreaKey = formAreaFilter || getNormalizedArea(formData.career);
    return courses.filter(c => {
      const catUpper = (c.categoria || c.department || '').toUpperCase();
      const codeUpper = (c.code || '').toUpperCase();
      
      const matchesArea =
        activeAreaKey === 'all' ||
        catUpper.includes(activeAreaKey) ||
        (activeAreaKey === 'COMERCIAL' && (catUpper.includes('COMERCIAL') || codeUpper.startsWith('COM-'))) ||
        (activeAreaKey === 'INDUSTRIAL' && (catUpper.includes('INDUSTRIAL') || codeUpper.startsWith('IND-'))) ||
        (activeAreaKey === 'GERENCIAL' && (catUpper.includes('GERENCIAL') || codeUpper.startsWith('GER-'))) ||
        (activeAreaKey === 'ARTESANAL' && (catUpper.includes('ARTESANAL') || codeUpper.startsWith('ART-')));

      const q = formCourseSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.teacherName && c.teacherName.toLowerCase().includes(q)) ||
        (c.department && c.department.toLowerCase().includes(q));

      return matchesArea && matchesSearch;
    });
  }, [courses, formData.career, formAreaFilter, formCourseSearch]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedStudent(null);
    setInitialCourseIds([]);
    setFormCourseSearch('');
    setFormAreaFilter('COMERCIAL');
    setFormData({
      name: '',
      cedula: '',
      code: `EST-2026-${Math.floor(100 + Math.random() * 900)}`,
      email: '',
      phone: '+58 412 ',
      career: 'Área Comercial',
      semester: 1,
      password: 'estudiante123'
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (student: User) => {
    setSelectedStudent(student);
    const curEnr = enrollments.filter(e => e.studentId === student.id).map(e => e.courseId);
    const normArea = getNormalizedArea(student.career);
    setInitialCourseIds(curEnr);
    setFormCourseSearch('');
    setFormAreaFilter(normArea);
    setFormData({
      id: student.id,
      name: student.name,
      cedula: student.cedula || '',
      code: student.code || '',
      email: student.email,
      phone: student.phone || '',
      career: student.career || 'Área Comercial',
      semester: student.semester || 1,
      password: student.password || 'estudiante123'
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormModalOpen(true);
  };

  // Open Detail / Kardex Modal
  const handleOpenDetail = (student: User) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  // Open Enrollment Modal for specific student (defaults to student's registered area)
  const handleOpenEnrollModal = (student: User) => {
    setSelectedStudent(student);
    setSelectedCourseToEnroll('');
    setSelectedCourseIds([]);
    setCourseCatalogSearch('');
    setSelectedCourseCategory(getNormalizedArea(student.career));
    setIsEnrollModalOpen(true);
  };

  // Toggle selection for bulk enrollment in catalog modal
  const handleToggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  // Submit Student Form (with auto-enrollment in chosen initial courses)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('El nombre completo del estudiante es obligatorio.');
      return;
    }

    if (!formData.cedula.trim()) {
      setFormError('La cédula de identidad es obligatoria.');
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
      code: formData.code.trim() || `EST-2026-${cleanCedDigits.slice(-4) || Math.floor(100 + Math.random() * 900)}`,
      career: formData.career,
      semester: Number(formData.semester) || 1,
      phone: formData.phone.trim(),
      role: 'student',
      avatar: selectedStudent?.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      password: formData.password || 'estudiante123'
    };

    const res = saveUser(userPayload);
    if (!res.success) {
      setFormError(res.message);
    } else {
      const activeUserObj = res.user || userPayload;
      // Auto-enroll in any newly selected initial courses
      if (initialCourseIds.length > 0) {
        initialCourseIds.forEach(courseId => {
          enrollCourse(courseId, activeUserObj);
        });
      }

      setFormSuccess('Estudiante guardado exitosamente con sus cursos asignados.');
      setTimeout(() => {
        setIsFormModalOpen(false);
        setFormSuccess(null);
      }, 700);
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = (student: User) => {
    if (window.confirm(`¿Está seguro de eliminar al estudiante "${student.name}" (Cédula: ${student.cedula || student.code})? Esta acción eliminará también sus inscripciones y calificaciones.`)) {
      deleteUser(student.id);
      if (selectedStudent?.id === student.id) {
        setIsDetailModalOpen(false);
      }
    }
  };

  // Handle Multi / Selected Course Enrollment for a Student
  const handleEnrollStudentInSelectedCourses = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStudent) return;

    const targets = selectedCourseIds.length > 0
      ? selectedCourseIds
      : (selectedCourseToEnroll ? [selectedCourseToEnroll] : []);

    if (targets.length === 0) {
      alert('Por favor seleccione al menos un curso de la lista para matricular.');
      return;
    }

    let successCount = 0;
    const warnings: string[] = [];

    targets.forEach(cId => {
      const res = enrollCourse(cId, selectedStudent);
      if (res.success) {
        successCount++;
      } else {
        warnings.push(`• ${res.message}`);
      }
    });

    if (successCount > 0) {
      alert(`¡Éxito! Se matricularon ${successCount} curso(s) para el estudiante ${selectedStudent.name}.`);
      setSelectedCourseIds([]);
      setSelectedCourseToEnroll('');
    }

    if (warnings.length > 0) {
      alert(`Avisos / Conflictos del Sistema:\n${warnings.join('\n')}`);
    }
  };

  // Quick single course enroll helper
  const handleEnrollSingleCourse = (courseId: string) => {
    if (!selectedStudent) return;
    const res = enrollCourse(courseId, selectedStudent);
    if (!res.success) {
      alert(res.message);
    } else {
      alert(`¡Estudiante ${selectedStudent.name} matriculado con éxito en el curso!`);
      setSelectedCourseIds(prev => prev.filter(id => id !== courseId));
    }
  };

  // Get Courses for selected student
  const studentCourses = useMemo(() => {
    if (!selectedStudent) return [];
    const studentEnrs = enrollments.filter(e => e.studentId === selectedStudent.id);
    return courses.filter(c => studentEnrs.some(e => e.courseId === c.id));
  }, [selectedStudent, enrollments, courses]);

  // Get Grades for selected student
  const studentGrades = useMemo(() => {
    if (!selectedStudent) return [];
    return grades.filter(g => g.studentId === selectedStudent.id);
  }, [selectedStudent, grades]);

  // All existing courses for enrollment
  const availableCoursesToEnroll = courses;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
            <GraduationCap className="w-4 h-4" /> Módulo de Gestión de Alumnos
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Control de Estudiantes y Matrículas
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
            Administración centralizada del expediente de alumnos, asignación de cursos, emisión de constancias de estudio y récord de notas oficial en PDF.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="px-5 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-sky-400" />
            <span>Nuevo Estudiante</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Estudiantes</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{metrics.total}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Registrados activos
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Con Matrícula Activa</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{metrics.totalEnrolled}</h3>
            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
              Período {activeTerm}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Promedio General</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{metrics.averageGpa} <span className="text-xs font-normal text-slate-400">/ 20 pts</span></h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Rendimiento institucional
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">En Recuperación</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{metrics.riskCount}</h3>
            <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
              Seguimiento académico
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
              placeholder="Buscar por nombre, cédula (V-...), código (EST-...) o correo..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              <span className="text-xs font-bold text-slate-500">Área:</span>
              <select
                value={selectedCareer}
                onChange={e => setSelectedCareer(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">Todas las Áreas</option>
                {careerOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Semestre:</span>
              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">Todos</option>
                <option value="1">1° Semestre</option>
                <option value="2">2° Semestre</option>
                <option value="3">3° Semestre</option>
                <option value="4">4° Semestre</option>
                <option value="5">5° Semestre</option>
                <option value="6">6° Semestre</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Expediente de Alumnos
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
              {filteredStudents.length} {filteredStudents.length === 1 ? 'estudiante' : 'estudiantes'}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Período Activo: <strong className="text-slate-700 dark:text-slate-300">{activeTerm}</strong>
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No se encontraron estudiantes</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Intente ajustar los filtros de búsqueda o registre un nuevo alumno con el botón superior.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-4">Cédula / Código</th>
                  <th className="py-3 px-4">Programa / Área</th>
                  <th className="py-3 px-4 text-center">Semestre</th>
                  <th className="py-3 px-4 text-center">Cursos</th>
                  <th className="py-3 px-4 text-center">Promedio</th>
                  <th className="py-3 px-4 text-right">Acciones Directas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredStudents.map(student => {
                  const studentEnrs = enrollments.filter(e => e.studentId === student.id);
                  const studentG = grades.filter(g => g.studentId === student.id);
                  const avg = studentG.length > 0
                    ? formatDecimal(studentG.reduce((a, b) => a + b.finalGrade, 0) / studentG.length, 1, false)
                    : 'N/A';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{student.name}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" /> {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                          {student.cedula || 'S/C'}
                        </span>
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-semibold">
                          {student.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{student.career || 'General'}</p>
                        <p className="text-[10px] text-slate-400">{student.phone || 'Sin teléfono'}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[11px] text-slate-700 dark:text-slate-300">
                          {student.semester || 1}° Sem
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 font-extrabold text-[11px] text-blue-600">
                          {studentEnrs.length} cursos
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {avg !== 'N/A' ? (
                          <span className={`px-2.5 py-1 rounded-full font-black text-[11px] ${
                            Number(avg) >= 60
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600'
                          }`}>
                            {avg} pts
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ficha & Matrícula Button */}
                          <button
                            onClick={() => handleOpenDetail(student)}
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-lg transition"
                            title="Ver Ficha Integral y Gestión de Matrícula"
                          >
                            <Layers className="w-4 h-4" />
                          </button>

                          {/* Quick Enroll Button */}
                          <button
                            onClick={() => handleOpenEnrollModal(student)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 rounded-lg transition"
                            title="Inscribir Cursos"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>

                          {/* Constancia de Estudio PDF */}
                          <button
                            onClick={() => {
                              const sCourses = courses.filter(c =>
                                enrollments.filter(e => e.studentId === student.id).some(e => e.courseId === c.id)
                              );
                              generateStudyCertificatePDF(student, sCourses, activeTerm);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                            title="Descargar Constancia Oficial de Estudios (PDF)"
                          >
                            <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                            title="Editar Datos"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 rounded-lg transition"
                            title="Eliminar Estudiante"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: FICHA INTEGRAL Y EXPEDIENTE DEL ESTUDIANTE */}
      {isDetailModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 text-white flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={selectedStudent.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`}
                  alt={selectedStudent.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-400/50 shadow-md"
                />
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-600 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                    <GraduationCap className="w-3 h-3" /> Ficha del Estudiante
                  </div>
                  <h3 className="text-xl font-black text-white">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-300 font-mono">
                    Cédula: <strong>{selectedStudent.cedula || 'S/C'}</strong> • Código: <strong>{selectedStudent.code}</strong>
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
              {/* Contact & Career Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Programa / Área</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedStudent.career || 'General'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Semestre en Curso</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedStudent.semester || 1}° Semestre</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Correo Electrónico</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{selectedStudent.email}</p>
                </div>
              </div>

              {/* Action Buttons for Official Documents */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => generateStudyCertificatePDF(selectedStudent, studentCourses, activeTerm)}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" /> Constancia de Estudio (PDF)
                </button>

                <button
                  onClick={() => generateStudentTranscriptPDF(selectedStudent, studentGrades)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-400" /> Récord Académico (PDF)
                </button>
              </div>

              {/* Enrolled Courses & Grades Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-600" />
                    Cursos Matriculados ({studentCourses.length})
                  </h4>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenEnrollModal(selectedStudent);
                    }}
                    className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Curso
                  </button>
                </div>

                {studentCourses.length === 0 ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-500 font-medium">El estudiante no tiene cursos matriculados actualmente.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentCourses.map(course => {
                      const gradeItem = studentGrades.find(g => g.courseId === course.id);
                      const enr = enrollments.find(e => e.studentId === selectedStudent.id && e.courseId === course.id);

                      return (
                        <div
                          key={course.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{course.code}</span>
                              <span className="font-extrabold text-slate-900 dark:text-white">{course.name}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Docente: <strong>{course.teacherName}</strong> • {course.schedules.map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime} (${s.classroomName})`).join(', ')}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            {gradeItem && (
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 font-semibold block">Nota Final</span>
                                <span className="font-black text-slate-800 dark:text-slate-200">{gradeItem.finalGrade} pts</span>
                              </div>
                            )}

                            {enr && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`¿Retirar el curso "${course.name}" para ${selectedStudent.name}?`)) {
                                    dropEnrollment(enr.id);
                                  }
                                }}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-lg font-bold text-[11px] transition"
                              >
                                Retirar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CATÁLOGO COMPLETO DE CURSOS Y MATRÍCULA */}
      {isEnrollModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-5 my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    Matrícula y Asignación de Cursos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Estudiante: <strong className="text-slate-800 dark:text-slate-200">{selectedStudent.name}</strong> • Cédula: <span className="font-mono">{selectedStudent.cedula || 'S/C'}</span> • Código: <span className="font-mono text-sky-600">{selectedStudent.code}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-3 shrink-0">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={courseCatalogSearch}
                  onChange={e => setCourseCatalogSearch(e.target.value)}
                  placeholder="Buscar entre todos los cursos existentes por código (COM-01, IND-15...), nombre, área o docente..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {courseCatalogSearch && (
                  <button
                    onClick={() => setCourseCatalogSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Area Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCourseCategory('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    selectedCourseCategory === 'all'
                      ? 'bg-slate-900 text-white dark:bg-sky-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>Todos los Cursos</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-white/20">
                    {categoryCounts.all}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCourseCategory('COMERCIAL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    selectedCourseCategory === 'COMERCIAL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
                  }`}
                >
                  <span>Área Comercial</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                    {categoryCounts.COMERCIAL}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCourseCategory('INDUSTRIAL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    selectedCourseCategory === 'INDUSTRIAL'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <span>Área Industrial</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                    {categoryCounts.INDUSTRIAL}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCourseCategory('GERENCIAL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    selectedCourseCategory === 'GERENCIAL'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                  }`}
                >
                  <span>Área Gerencial</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100">
                    {categoryCounts.GERENCIAL}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCourseCategory('ARTESANAL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    selectedCourseCategory === 'ARTESANAL'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                  }`}
                >
                  <span>Área Artesanal</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100">
                    {categoryCounts.ARTESANAL}
                  </span>
                </button>
              </div>

              {/* Selection Summary Bar */}
              <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">
                  Mostrando <strong>{filteredCatalogCourses.length}</strong> cursos existentes • <strong>{selectedCourseIds.length}</strong> seleccionado(s)
                </span>
                <div className="flex items-center gap-2">
                  {selectedCourseIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCourseIds([])}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Deseleccionar todos
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const availableIds = filteredCatalogCourses
                        .filter(c => !studentCourses.some(sc => sc.id === c.id))
                        .map(c => c.id);
                      setSelectedCourseIds(availableIds);
                    }}
                    className="text-xs text-sky-600 hover:underline font-semibold"
                  >
                    Seleccionar disponibles visibles
                  </button>
                </div>
              </div>
            </div>

            {/* Courses List - Scrollable Grid */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[220px]">
              {filteredCatalogCourses.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    No se encontraron cursos con los filtros seleccionados
                  </p>
                  <button
                    onClick={() => {
                      setCourseCatalogSearch('');
                      setSelectedCourseCategory('all');
                    }}
                    className="text-xs text-sky-600 font-bold hover:underline"
                  >
                    Restablecer búsqueda y filtros
                  </button>
                </div>
              ) : (
                filteredCatalogCourses.map(course => {
                  const isEnrolled = studentCourses.some(sc => sc.id === course.id);
                  const isSelected = selectedCourseIds.includes(course.id);
                  const isFull = course.enrolledCount >= course.capacity;
                  const conflictCheck = !isEnrolled ? checkStudentScheduleConflict(course, studentCourses) : { hasConflict: false };

                  // Badge styling by category
                  const catUpper = (course.categoria || course.department || '').toUpperCase();
                  let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  if (catUpper.includes('COMERCIAL')) badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
                  else if (catUpper.includes('INDUSTRIAL')) badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
                  else if (catUpper.includes('GERENCIAL')) badgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200';
                  else if (catUpper.includes('ARTESANAL')) badgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';

                  return (
                    <div
                      key={course.id}
                      onClick={() => {
                        if (isEnrolled) return;
                        if (conflictCheck.hasConflict) {
                          alert(`No es posible seleccionar este curso por choque de horario:\n\n${conflictCheck.reason}`);
                          return;
                        }
                        handleToggleCourseSelection(course.id);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                        isEnrolled
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 opacity-90 cursor-default'
                          : conflictCheck.hasConflict
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 cursor-pointer'
                          : isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 shadow-sm cursor-pointer ring-1 ring-sky-400'
                          : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 hover:bg-slate-50/80 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className="pt-0.5 shrink-0">
                          {isEnrolled ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : conflictCheck.hasConflict ? (
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                          ) : isSelected ? (
                            <CheckSquare className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>

                        {/* Course Info */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md border ${badgeColor}`}>
                              {course.code}
                            </span>
                            <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                              {course.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md font-semibold">
                              {course.department}
                            </span>
                            {(() => {
                              const sectionStatus = checkCourseSectionClosed(course, courses);
                              if (sectionStatus.isSectionClosed) {
                                return (
                                  <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 px-2 py-0.5 rounded-md font-black flex items-center gap-1 border border-purple-300 dark:border-purple-800">
                                    🔒 Sección Cerrada ({sectionStatus.weeksElapsed} sem) ➔ {sectionStatus.nextSectionName}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            {conflictCheck.hasConflict && (
                              <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-600" /> Choque con {conflictCheck.conflictingCourse?.name}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              👤 <strong>Profesor:</strong> {course.teacherName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-sky-500" />
                              {course.schedules.map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join(', ')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              {course.schedules.map(s => s.classroomName).join(', ')}
                            </span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              ⏱️ {course.horasAcademicas ? `${course.horasAcademicas} Horas Académicas` : course.duracion || '40 Horas'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Status & Action */}
                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">Cupos</span>
                          <span className={`font-black text-xs ${isFull ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                            {course.enrolledCount} / {course.capacity}
                          </span>
                        </div>

                        {isEnrolled ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Ya Matriculado
                          </span>
                        ) : conflictCheck.hasConflict ? (
                          <span className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1">
                            ⚠️ Horario Ocupado
                          </span>
                        ) : isSelected ? (
                          <span className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs">
                            <Check className="w-3.5 h-3.5" /> Seleccionado
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnrollSingleCourse(course.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition cursor-pointer"
                          >
                            + Matricular Directo
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Sticky Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {selectedCourseIds.length > 0 ? (
                  <span>
                    <strong className="text-sky-600 dark:text-sky-400 font-black">{selectedCourseIds.length}</strong> curso(s) seleccionado(s) para matricular
                  </span>
                ) : (
                  <span>Haga clic en uno o varios cursos para seleccionarlos y matricularlos juntos</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => handleEnrollStudentInSelectedCourses()}
                  disabled={selectedCourseIds.length === 0}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Confirmar Matrícula ({selectedCourseIds.length})</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: CREAR O EDITAR ESTUDIANTE */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedStudent ? 'Editar Expediente de Alumno' : 'Registrar Nuevo Estudiante'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ingrese los datos del participante para el período {activeTerm}
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
                  Nombres y Apellidos Completos *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej. Angela Paola Quiñones Salazar"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cédula / DNI *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cedula}
                    onChange={e => setFormData(prev => ({ ...prev, cedula: e.target.value }))}
                    placeholder="V-28491023"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Código de Alumno
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="EST-2026-104"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="estudiante@academiavalencia.edu"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Móvil
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+58 412 1234567"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  placeholder="estudiante123"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Course Assignment from Full Existing Catalog Section - Strictly Filtered by Area */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-600" />
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                      Cursos del Área para Matricular ({initialCourseIds.length} seleccionados)
                    </span>
                  </div>
                  {initialCourseIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setInitialCourseIds([])}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Deseleccionar Todos
                    </button>
                  )}
                </div>

                {/* Area Quick Tabs in Form */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {OFFICIAL_AREAS.map(area => {
                    const isCurrent = (formAreaFilter || getNormalizedArea(formData.career)) === area.key;
                    const areaCount = categoryCounts[area.key as keyof typeof categoryCounts] || 0;
                    return (
                      <button
                        key={area.key}
                        type="button"
                        onClick={() => {
                          setFormAreaFilter(area.key);
                          setFormData(prev => ({ ...prev, career: area.label }));
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-300'
                        }`}
                      >
                        <span>{area.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${isCurrent ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          {areaCount}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setFormAreaFilter('all')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      formAreaFilter === 'all'
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    Ver Todas ({courses.length})
                  </button>
                </div>

                {/* Active Area Banner */}
                {(() => {
                  const currentNorm = formAreaFilter === 'all' ? null : (formAreaFilter || getNormalizedArea(formData.career));
                  const currentAreaObj = OFFICIAL_AREAS.find(a => a.key === currentNorm);
                  return (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {currentAreaObj ? `Mostrando cursos de ${currentAreaObj.label}` : 'Mostrando cursos de todas las áreas'}
                        </span>
                        {currentAreaObj && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono text-[11px] font-bold">
                            {currentAreaObj.costText}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 text-[11px]">
                        {formFilteredCourses.length} materias disponibles
                      </span>
                    </div>
                  );
                })()}

                {/* Course Search within Area */}
                <input
                  type="text"
                  value={formCourseSearch}
                  onChange={e => setFormCourseSearch(e.target.value)}
                  placeholder="Buscar materia en esta área por nombre, código o docente..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />

                {/* Course List strictly filtered */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {formFilteredCourses.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      No se encontraron cursos en esta área con los términos de búsqueda.
                    </div>
                  ) : (
                    formFilteredCourses.map(course => {
                      const isChecked = initialCourseIds.includes(course.id);
                      const catUpper = (course.categoria || course.department || '').toUpperCase();
                      const sectionStatus = checkCourseSectionClosed(course, courses);
                      let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                      if (catUpper.includes('COMERCIAL')) badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
                      else if (catUpper.includes('INDUSTRIAL')) badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
                      else if (catUpper.includes('GERENCIAL')) badgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200';
                      else if (catUpper.includes('ARTESANAL')) badgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';

                      return (
                        <div
                          key={course.id}
                          onClick={() => {
                            setInitialCourseIds(prev =>
                              prev.includes(course.id) ? prev.filter(id => id !== course.id) : [...prev, course.id]
                            );
                          }}
                          className={`p-2.5 rounded-xl border flex flex-col gap-1 text-xs cursor-pointer transition ${
                            isChecked
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-900 dark:text-sky-200 font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 shrink-0" />
                              )}
                              <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded border shrink-0 font-black ${badgeColor}`}>
                                {course.code}
                              </span>
                              <span className="truncate font-bold text-slate-800 dark:text-slate-100">
                                {course.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400">
                              <span className="hidden sm:inline">👤 {course.teacherName}</span>
                              <span className="font-semibold text-slate-500">
                                {course.duracion || `${course.horasAcademicas || 40}h`}
                              </span>
                              {isChecked && (
                                <span className="px-2 py-0.5 rounded bg-sky-600 text-white text-[10px] font-bold">
                                  Asignado
                                </span>
                              )}
                            </div>
                          </div>

                          {sectionStatus.isSectionClosed && (
                            <div className="pl-6.5 text-[10px] text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 p-1.5 rounded-lg border border-purple-200 dark:border-purple-800/60 mt-0.5">
                              <span>🔒 <strong>Sección Cerrada</strong> ({sectionStatus.weeksElapsed} semanas iniciada). Al matricular, se asignará a <strong>{sectionStatus.nextSectionName}</strong>.</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {selectedStudent ? 'Guardar Cambios' : 'Registrar Estudiante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
