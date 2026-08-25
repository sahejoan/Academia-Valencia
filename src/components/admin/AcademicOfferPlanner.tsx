import React, { useState, useMemo } from 'react';
import {
  Layers,
  Building2,
  BookOpen,
  Clock,
  Users,
  GraduationCap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Eye,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  ChevronRight,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Course, Classroom, CourseSchedule, User, Enrollment } from '../../types';
import { generateAcademicOfferPDF } from '../../utils/pdfExport';
import {
  checkTeacherScheduleConflict,
  checkStudentScheduleConflict,
  checkSectionOpeningEligibility
} from '../../utils/conflictDetector';
import { SectionOpeningModal } from './SectionOpeningModal';
import { ClassroomAvailabilityMatrix } from './ClassroomAvailabilityMatrix';

export const AcademicOfferPlanner: React.FC = () => {
  const {
    courses,
    classrooms,
    users,
    enrollments,
    saveCourse,
    deleteCourse,
    saveClassroom,
    enrollCourse,
    dropEnrollment,
    conflicts,
    hasPermission
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'new-sections' | 'wizard' | 'classrooms'>('matrix');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClassroomFilter, setSelectedClassroomFilter] = useState<string>('all');
  const [classroomViewMode, setClassroomViewMode] = useState<'cards' | 'matrix'>('cards');
  
  // Modal states
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<Course | null>(null);
  const [selectedCourseForNewSection, setSelectedCourseForNewSection] = useState<Course | null>(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState<boolean>(false);
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState<boolean>(false);
  const [editingClassroom, setEditingClassroom] = useState<Partial<Classroom> | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  // Wizard State for Step-by-Step Course Offering
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardData, setWizardData] = useState<{
    // Step 1: Classroom
    classroomId: string;
    classroomName: string;
    // Step 2: Course
    courseMode: 'existing' | 'new';
    existingCourseId: string;
    code: string;
    name: string;
    categoria: 'COMERCIAL' | 'INDUSTRIAL' | 'GERENCIAL' | 'ARTESANAL';
    department: string;
    career: string;
    duracion: string;
    horasAcademicas: number;
    horasPorSemana: number;
    tamanoContenido: 'Corto (3-4 módulos)' | 'Medio (6-8 módulos)' | 'Extenso (10-14 módulos)';
    description: string;
    // Step 3: Schedules
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    modality: 'Presencial' | 'Virtual' | 'Híbrida';
    capacity: number;
    // Step 4: Teacher
    teacherId: string;
    teacherName: string;
    cedula_profesor: string;
    // Step 5: Initial Students (optional)
    initialStudentIds: string[];
  }>({
    classroomId: classrooms[0]?.id || '',
    classroomName: classrooms[0]?.name || '',
    courseMode: 'existing',
    existingCourseId: courses[0]?.id || '',
    code: '',
    name: '',
    categoria: 'COMERCIAL',
    department: 'Área Comercial & Mercadeo',
    career: 'Mercadotecnia y Publicidad',
    duracion: '80 Horas / 10 Semanas',
    horasAcademicas: 80,
    horasPorSemana: 8,
    tamanoContenido: 'Medio (6-8 módulos)',
    description: '',
    dayOfWeek: 'Sábado',
    startTime: '08:00',
    endTime: '12:00',
    modality: 'Presencial',
    capacity: 20,
    teacherId: '',
    teacherName: '',
    cedula_profesor: '',
    initialStudentIds: []
  });

  const teachers = useMemo(() => users.filter(u => u.role === 'teacher'), [users]);
  const students = useMemo(() => users.filter(u => u.role === 'student'), [users]);

  // Categories list
  const categories: Array<'all' | 'COMERCIAL' | 'INDUSTRIAL' | 'GERENCIAL' | 'ARTESANAL'> = [
    'all',
    'COMERCIAL',
    'INDUSTRIAL',
    'GERENCIAL',
    'ARTESANAL'
  ];

  // Filtered Course Offerings
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesCategory = selectedCategory === 'all' || c.categoria === selectedCategory;
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.schedules.some(s => s.classroomName.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesClassroom = selectedClassroomFilter === 'all' ||
        c.schedules.some(s => s.classroomId === selectedClassroomFilter);

      return matchesCategory && matchesSearch && matchesClassroom;
    });
  }, [courses, selectedCategory, searchTerm, selectedClassroomFilter]);

  // Handle Wizard Submission
  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCls = classrooms.find(c => c.id === wizardData.classroomId);
    const selectedTch = teachers.find(t => t.id === wizardData.teacherId);

    let finalCourse: Course;

    if (wizardData.courseMode === 'existing' && wizardData.existingCourseId) {
      const existing = courses.find(c => c.id === wizardData.existingCourseId);
      if (!existing) return;

      finalCourse = {
        ...existing,
        teacherId: selectedTch?.id || existing.teacherId,
        teacherName: selectedTch?.name || existing.teacherName,
        cedula_profesor: selectedTch?.cedula || existing.cedula_profesor || '',
        duracion: wizardData.duracion || existing.duracion,
        horasAcademicas: wizardData.horasAcademicas || existing.horasAcademicas,
        horasPorSemana: wizardData.horasPorSemana || existing.horasPorSemana,
        tamanoContenido: wizardData.tamanoContenido || existing.tamanoContenido,
        capacity: wizardData.capacity,
        modality: wizardData.modality,
        schedules: [
          {
            id: `sch-${Date.now()}`,
            dayOfWeek: wizardData.dayOfWeek,
            startTime: wizardData.startTime,
            endTime: wizardData.endTime,
            classroomId: selectedCls?.id || 'aula-1',
            classroomName: selectedCls?.name || 'Aula General'
          }
        ]
      };
    } else {
      // Create Brand New Course Offering
      finalCourse = {
        id: `curso-${Date.now()}`,
        id_curso: Math.floor(100 + Math.random() * 900),
        code: wizardData.code || `OFR-${Math.floor(10 + Math.random() * 89)}`,
        name: wizardData.name,
        categoria: wizardData.categoria,
        department: wizardData.department,
        career: wizardData.career,
        duracion: wizardData.duracion,
        horasAcademicas: wizardData.horasAcademicas || 80,
        horasPorSemana: wizardData.horasPorSemana || 8,
        tamanoContenido: wizardData.tamanoContenido || 'Medio (6-8 módulos)',
        credits: 3,
        capacity: wizardData.capacity,
        enrolledCount: 0,
        teacherId: selectedTch?.id || teachers[0]?.id || '',
        teacherName: selectedTch?.name || teachers[0]?.name || 'Por definir',
        cedula_profesor: selectedTch?.cedula || '',
        specialty: selectedTch?.specialty || 'Especialista del Área',
        startDate: '2026-01-15',
        endDate: '2026-07-30',
        syllabusWeeks: 12,
        currentWeek: 1,
        prerequisites: [],
        imagen: `img/cursos/${Math.floor(1 + Math.random() * 47)}.jpg`,
        modality: wizardData.modality,
        status: 'Activo',
        description: wizardData.description || 'Contenido curricular y práctico.',
        term: '2026-I',
        schedules: [
          {
            id: `sch-${Date.now()}`,
            dayOfWeek: wizardData.dayOfWeek,
            startTime: wizardData.startTime,
            endTime: wizardData.endTime,
            classroomId: selectedCls?.id || 'aula-1',
            classroomName: selectedCls?.name || 'Aula 01'
          }
        ]
      };
    }

    const res = saveCourse(finalCourse);
    if (!res.success) {
      alert(res.message);
      return;
    }

    // Enroll initial students if selected
    if (wizardData.initialStudentIds.length > 0) {
      wizardData.initialStudentIds.forEach(stId => {
        const studentObj = students.find(s => s.id === stId);
        if (studentObj) {
          enrollCourse(finalCourse.id, studentObj);
        }
      });
    }

    // Reset Wizard
    setWizardStep(1);
    setActiveSubTab('matrix');
  };

  // Count eligible courses for new section opening by demand
  const eligibleCourses = useMemo(() => {
    return courses.map(c => ({
      course: c,
      eligibility: checkSectionOpeningEligibility(c, courses)
    }));
  }, [courses]);

  const eligibleCount = useMemo(() => {
    return eligibleCourses.filter(item => item.eligibility.isEligible).length;
  }, [eligibleCourses]);

  // Get enrolled students for a specific course
  const getEnrolledStudentsForCourse = (courseId: string) => {
    return enrollments.filter(e => e.courseId === courseId && e.status === 'Inscrito');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
              <Layers className="w-3.5 h-3.5" /> Planificación Académica
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 backdrop-blur-md text-white">
              Ciclo 2026-I
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Apertura & Planificador de Oferta Académica
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
            Flujo unificado para estructurar y ofertar asignaturas: <strong>Espacio Físico (Aula) ➔ Curso a Dictar ➔ Horarios ➔ Facilitador/Profesor ➔ Matrícula de Alumnos</strong>.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveSubTab('new-sections')}
            className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Aperturar nuevas secciones de cursos en marcha por demanda"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Aperturar Sección por Demanda</span>
            {eligibleCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white text-amber-600 font-extrabold text-[10px]">
                {eligibleCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('wizard')}
            className="px-4 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Aperturar Nueva Oferta</span>
          </button>
          <button
            onClick={() => generateAcademicOfferPDF(courses, '2026-I')}
            className="px-4 py-3 bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-2xl text-xs sm:text-sm font-bold backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            title="Descargar Catálogo Oficial en PDF con membrete y sello"
          >
            <FileText className="w-4 h-4" /> Catálogo Oficial (PDF)
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Matriz Consolidada
          <span className="px-1.5 py-0.2 bg-indigo-800/60 text-white rounded-full text-[10px]">
            {courses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('new-sections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'new-sections'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" /> ⚡ Apertura de Secciones por Demanda
          {eligibleCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
              {eligibleCount} sugerencias
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveSubTab('wizard');
            setWizardStep(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'wizard'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Plus className="w-4 h-4 text-sky-400" /> Asistente de Oferta (Paso a Paso)
        </button>

        <button
          onClick={() => setActiveSubTab('classrooms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'classrooms'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Espacios Físicos & Matriz de Aulas
          <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-[10px]">
            {classrooms.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: MATRIZ CONSOLIDADA (360° VIEW)                */}
      {/* ======================================================== */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'all' ? 'Todas las Áreas' : cat}
                  </button>
                ))}
              </div>

              {/* Classroom Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedClassroomFilter}
                  onChange={(e) => setSelectedClassroomFilter(e.target.value)}
                  className="w-full sm:w-48 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Todas las Aulas ({classrooms.length})</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre de curso, código, profesor asignado o aula..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCourses.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No se encontraron ofertas académicas</h3>
                <p className="text-xs text-slate-500 mt-1">Prueba cambiando los filtros o utiliza el Asistente de Apertura para crear una nueva oferta.</p>
              </div>
            ) : (
              filteredCourses.map(course => {
                const enrolledList = getEnrolledStudentsForCourse(course.id);
                const firstSchedule = course.schedules[0];
                const occupancyPercent = Math.min(100, Math.round((course.enrolledCount / course.capacity) * 100));
                const eligibility = checkSectionOpeningEligibility(course, courses);

                const categoryColors: Record<string, { badge: string; border: string }> = {
                  COMERCIAL: { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800', border: 'border-l-blue-600' },
                  INDUSTRIAL: { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800', border: 'border-l-amber-600' },
                  GERENCIAL: { badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800', border: 'border-l-purple-600' },
                  ARTESANAL: { badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800', border: 'border-l-rose-600' }
                };

                const catStyle = categoryColors[course.categoria || 'COMERCIAL'] || categoryColors.COMERCIAL;

                return (
                  <div
                    key={course.id}
                    className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-l-4 ${catStyle.border}`}
                  >
                    <div>
                      {/* Top Bar: Code, Category, Actions */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                            {course.code}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${catStyle.badge}`}>
                            {course.categoria || 'COMERCIAL'}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {course.modality} • {course.duracion || '40 Horas'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCourseToDelete(course)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                            title="Eliminar Oferta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Course Title */}
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
                        {course.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Section Opening Suggestion Alert */}
                      {eligibility.isEligible && (
                        <div className="mb-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="text-[11px] font-semibold">
                              <strong>Apertura Sugerida:</strong> Semana {eligibility.weeksElapsed} • {course.enrolledCount} inscritos
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCourseForNewSection(course);
                              setIsSectionModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer shadow-sm"
                          >
                            Abrir Sección
                          </button>
                        </div>
                      )}

                      {/* The Core 4 Elements Grid: Aula, Horario, Profesor, Alumnos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 mb-4">
                        {/* 1. Aula / Espacio Físico */}
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Espacio Físico / Aula</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                              {firstSchedule?.classroomName || 'Aula por Definir'}
                            </span>
                          </div>
                        </div>

                        {/* 2. Horario */}
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Horario Semanal</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {firstSchedule ? `${firstSchedule.dayOfWeek} (${firstSchedule.startTime} - ${firstSchedule.endTime})` : 'Por programar'}
                            </span>
                          </div>
                        </div>

                        {/* 3. Profesor / Facilitador */}
                        <div className="flex items-start gap-2">
                          <GraduationCap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Profesor Asignado</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                              {course.teacherName}
                            </span>
                            {course.cedula_profesor && (
                              <span className="text-[10px] font-mono text-slate-400">C.I: {course.cedula_profesor}</span>
                            )}
                          </div>
                        </div>

                        {/* 4. Matrícula y Aforo */}
                        <div className="flex items-start gap-2">
                          <Users className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Matrícula / Cupos</span>
                            <div className="flex items-center justify-between gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                              <span>{course.enrolledCount} / {course.capacity} alumnos</span>
                              <span className="text-[10px] text-indigo-500 font-semibold">{occupancyPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full ${course.enrolledCount >= course.capacity ? 'bg-rose-500' : 'bg-indigo-600'}`}
                                style={{ width: `${occupancyPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCourseForEnrollment(course)}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          Alumnos ({course.enrolledCount})
                        </button>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        course.enrolledCount >= course.capacity
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {course.enrolledCount >= course.capacity ? 'Cupos Agotados' : `${course.capacity - course.enrolledCount} Cupos Libres`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB: APERTURA DE SECCIONES POR DEMANDA               */}
      {/* ======================================================== */}
      {activeSubTab === 'new-sections' && (
        <div className="space-y-6">
          {/* Policy Info Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white p-6 rounded-3xl border border-indigo-700/40 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border border-amber-400/30">
                  <Sparkles className="w-3.5 h-3.5" /> Protocolo Institucional de Apertura de Secciones
                </span>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold">
                  Regla: ≥ 2 Semanas de Inicio + Quórum ≥ 3 Estudiantes
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                Apertura y Desdoble de Nuevas Secciones del Mismo Programa
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                El <strong>quórum mínimo institucional para dar inicio a cualquier curso es de 3 alumnos matriculados</strong>. Si un curso ya inició según cronograma y han transcurrido <strong>un mínimo de dos semanas</strong> con alumnos activos, el sistema autoriza y facilita abrir una <strong>nueva sección paralela</strong> con el mismo programa académico para absorber la demanda de nuevos matriculados, evaluando la <strong>disponibilidad de aulas físicas</strong> y garantizando que no existan choques de horario con profesores ni alumnos.
              </p>

              {/* 4 Pillars Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                  <div className="text-amber-400 text-xs font-bold mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> 1. Quórum Mínimo
                  </div>
                  <div className="text-xs text-slate-200">Al menos 3 alumnos matriculados para confirmar el inicio de clases.</div>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                  <div className="text-emerald-400 text-xs font-bold mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 2. Tiempo Transcurrido
                  </div>
                  <div className="text-xs text-slate-200">Mínimo 2 semanas desde la fecha de inicio del cronograma.</div>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                  <div className="text-sky-400 text-xs font-bold mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> 3. Aula Disponible
                  </div>
                  <div className="text-xs text-slate-200">Verificación de espacio físico libre sin solapamiento de horario.</div>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                  <div className="text-purple-400 text-xs font-bold mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 4. Sin Choques
                  </div>
                  <div className="text-xs text-slate-200">Profesor y alumnos sin otros cursos en el mismo horario.</div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Cursos con Sugerencia de Apertura</span>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">{eligibleCount}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Secciones Ofertadas</span>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">{courses.length}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Espacios Físicos Registrados</span>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">{classrooms.length} aulas/talleres</p>
              </div>
            </div>
          </div>

          {/* List of Courses for Section Duplication / Opening */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Evaluación de Asignaturas & Apertura Rápida de Secciones
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map(course => {
                const eligibility = checkSectionOpeningEligibility(course, courses);
                const firstSchedule = course.schedules[0];

                return (
                  <div
                    key={course.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      eligibility.isEligible
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                            {course.code}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {course.categoria}
                          </span>
                        </div>

                        {eligibility.isEligible ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3" /> Apertura Sugerida
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-medium">
                            En Curso Regular
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                        {course.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
                        {course.department} • {course.duracion}
                      </p>

                      {/* Criteria Indicators */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs mb-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Población Inscrita:</span>
                          <span className={`font-bold ${course.enrolledCount >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {course.enrolledCount} / {course.capacity} alumnos {course.enrolledCount >= 3 ? '(Quórum ≥ 3 ✓)' : '(Falta Quórum ✗)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Tiempo Transcurrido:</span>
                          <span className={`font-bold ${eligibility.weeksElapsed >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {!course.startDateSetByAdmin || !course.startDate
                              ? 'Sin fecha de inicio fijada'
                              : eligibility.weeksElapsed === 0
                              ? `Inicia el ${course.startDate} (0 sem)`
                              : `Semana ${eligibility.weeksElapsed} (${eligibility.weeksElapsed >= 2 ? '≥ 2 sem ✓' : '< 2 sem ✗'})`}
                          </span>
                        </div>
                      </div>

                      {/* Details of current allocation */}
                      <p className="text-[11px] text-slate-500 mb-2">
                        <strong>Horario actual:</strong> {firstSchedule ? `${firstSchedule.dayOfWeek} ${firstSchedule.startTime}-${firstSchedule.endTime} (${firstSchedule.classroomName})` : 'Sin horario'} • <strong>Prof:</strong> {course.teacherName}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        {eligibility.existingSectionsCount} sección(es) activa(s)
                      </span>

                      {eligibility.isEligible ? (
                        <button
                          onClick={() => {
                            setSelectedCourseForNewSection(course);
                            setIsSectionModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Aperturar Sección 0{eligibility.suggestedSectionNumber}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                          <span>🔒 Sección Abierta (No requiere desdoble)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: WIZARD PASO A PASO                            */}
      {/* ======================================================== */}
      {activeSubTab === 'wizard' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {/* Stepper Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[
                { step: 1, label: '1. Espacio Físico (Aula)', icon: Building2 },
                { step: 2, label: '2. Curso a Dictar', icon: BookOpen },
                { step: 3, label: '3. Horarios & Aforo', icon: Clock },
                { step: 4, label: '4. Profesor Responsable', icon: GraduationCap },
                { step: 5, label: '5. Matrícula Inicial', icon: Users }
              ].map(({ step, label, icon: Icon }) => (
                <button
                  key={step}
                  onClick={() => setWizardStep(step)}
                  className={`flex flex-col sm:flex-row items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    wizardStep === step
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : wizardStep > step
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      wizardStep === step
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : wizardStep > step
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {wizardStep > step ? <Check className="w-3.5 h-3.5" /> : step}
                  </div>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${(wizardStep / 5) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleWizardSubmit}>
            {/* STEP 1: ESPACIO FÍSICO / AULA */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" /> Paso 1: Selecciona el Espacio Físico (Aula o Taller)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Determina en qué salón, laboratorio o taller especializado se impartirá el curso.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classrooms.map(cls => {
                    const isSelected = wizardData.classroomId === cls.id;
                    return (
                      <div
                        key={cls.id}
                        onClick={() => {
                          setWizardData(prev => ({
                            ...prev,
                            classroomId: cls.id,
                            classroomName: cls.name,
                            capacity: Math.min(prev.capacity, cls.capacity)
                          }));
                        }}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {cls.code}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Aforo: {cls.capacity} pers.
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">{cls.name}</h4>
                        <p className="text-[10px] text-slate-500">{cls.building} • Piso {cls.floor}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded">
                            {cls.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    disabled={!wizardData.classroomId}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    Siguiente: Seleccionar Curso <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CURSO A DICTAR */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" /> Paso 2: Selecciona el Curso del Catálogo Oficial
                  </h3>
                  <p className="text-xs text-slate-500">
                    Elige uno de los 47 cursos estructurados o redacta un curso personalizado.
                  </p>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setWizardData(prev => ({ ...prev, courseMode: 'existing' }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      wizardData.courseMode === 'existing'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Del Catálogo Oficial ({courses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardData(prev => ({ ...prev, courseMode: 'new' }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      wizardData.courseMode === 'new'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Crear Nuevo Curso / Taller
                  </button>
                </div>

                {wizardData.courseMode === 'existing' ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Selecciona la asignatura a aperturar:
                    </label>
                    <select
                      value={wizardData.existingCourseId}
                      onChange={(e) => {
                        const sel = courses.find(c => c.id === e.target.value);
                        if (sel) {
                          setWizardData(prev => ({
                            ...prev,
                            existingCourseId: sel.id,
                            name: sel.name,
                            code: sel.code,
                            categoria: sel.categoria || 'COMERCIAL',
                            duracion: sel.duracion || prev.duracion,
                            horasAcademicas: sel.horasAcademicas || prev.horasAcademicas,
                            horasPorSemana: sel.horasPorSemana || prev.horasPorSemana,
                            tamanoContenido: sel.tamanoContenido || prev.tamanoContenido,
                            teacherId: sel.teacherId || prev.teacherId,
                            teacherName: sel.teacherName || prev.teacherName,
                            cedula_profesor: sel.cedula_profesor || prev.cedula_profesor
                          }));
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>
                          [{c.categoria || 'GENERAL'}] {c.code} — {c.name} ({c.duracion || `${c.horasAcademicas || 40} Horas`})
                        </option>
                      ))}
                    </select>

                    {/* Preview & Customization Box */}
                    {courses.find(c => c.id === wizardData.existingCourseId) && (
                      <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs space-y-2">
                        <div>
                          <strong className="text-indigo-700 dark:text-indigo-300">Descripción del curso:</strong>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                            {courses.find(c => c.id === wizardData.existingCourseId)?.description}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Horas Académicas</label>
                            <input
                              type="number"
                              min="10"
                              max="240"
                              value={wizardData.horasAcademicas}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setWizardData(prev => ({
                                  ...prev,
                                  horasAcademicas: val,
                                  duracion: `${val} Horas Académicas`
                                }));
                              }}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Horas / Semana</label>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={wizardData.horasPorSemana}
                              onChange={(e) => setWizardData(prev => ({ ...prev, horasPorSemana: Number(e.target.value) }))}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tamaño de Contenido</label>
                            <select
                              value={wizardData.tamanoContenido}
                              onChange={(e) => setWizardData(prev => ({ ...prev, tamanoContenido: e.target.value as any }))}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs"
                            >
                              <option value="Corto (3-4 módulos)">Corto (3-4 módulos)</option>
                              <option value="Medio (6-8 módulos)">Medio (6-8 módulos)</option>
                              <option value="Extenso (10-14 módulos)">Extenso (10-14 módulos)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Curso</label>
                      <input
                        type="text"
                        required
                        value={wizardData.name}
                        onChange={(e) => setWizardData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ej. Taller Intensivo de Soldadura TIG"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Código</label>
                      <input
                        type="text"
                        value={wizardData.code}
                        onChange={(e) => setWizardData(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="Ej. IND-50"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Área / Categoría</label>
                      <select
                        value={wizardData.categoria}
                        onChange={(e) => setWizardData(prev => ({ ...prev, categoria: e.target.value as any }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                      >
                        <option value="COMERCIAL">COMERCIAL</option>
                        <option value="INDUSTRIAL">INDUSTRIAL</option>
                        <option value="GERENCIAL">GERENCIAL</option>
                        <option value="ARTESANAL">ARTESANAL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Duración (Etiqueta)</label>
                      <input
                        type="text"
                        value={wizardData.duracion}
                        onChange={(e) => setWizardData(prev => ({ ...prev, duracion: e.target.value }))}
                        placeholder="Ej. 60 Horas / 8 Semanas"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Horas Académicas</label>
                      <input
                        type="number"
                        min="10"
                        max="240"
                        value={wizardData.horasAcademicas}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setWizardData(prev => ({
                            ...prev,
                            horasAcademicas: val,
                            duracion: `${val} Horas Académicas`
                          }));
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tamaño de Contenido</label>
                      <select
                        value={wizardData.tamanoContenido}
                        onChange={(e) => setWizardData(prev => ({ ...prev, tamanoContenido: e.target.value as any }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                      >
                        <option value="Corto (3-4 módulos)">Corto (3-4 módulos)</option>
                        <option value="Medio (6-8 módulos)">Medio (6-8 módulos)</option>
                        <option value="Extenso (10-14 módulos)">Extenso (10-14 módulos)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer"
                  >
                    Regresar
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    Siguiente: Definir Horarios <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: HORARIOS Y AFORO */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" /> Paso 3: Define los Horarios y Cupos Máximos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Establece el día de la semana, las horas de clase y el límite de estudiantes para este curso.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Día de la Semana</label>
                    <select
                      value={wizardData.dayOfWeek}
                      onChange={(e) => setWizardData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-semibold"
                    >
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hora Inicio</label>
                    <input
                      type="time"
                      value={wizardData.startTime}
                      onChange={(e) => setWizardData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hora Fin</label>
                    <input
                      type="time"
                      value={wizardData.endTime}
                      onChange={(e) => setWizardData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cupo Máximo (Aforo)</label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={wizardData.capacity}
                      onChange={(e) => setWizardData(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer"
                  >
                    Regresar
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(4)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    Siguiente: Asignar Profesor <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PROFESOR RESPONSABLE */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" /> Paso 4: Asigna el Facilitador / Profesor Responsable
                  </h3>
                  <p className="text-xs text-slate-500">
                    Asocia al profesor especialista que dictará el contenido y registrará las calificaciones. Se valida automáticamente la no superposición de horarios.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teachers.map(tch => {
                    const isSelected = wizardData.teacherId === tch.id;
                    const candidateCourseForTch: Course = {
                      id: 'temp-wizard-course',
                      code: wizardData.courseCode || 'TEMP',
                      name: wizardData.courseName || 'Nuevo Curso',
                      schedules: [{
                        id: 'temp-sch',
                        dayOfWeek: wizardData.dayOfWeek,
                        startTime: wizardData.startTime,
                        endTime: wizardData.endTime,
                        classroomId: wizardData.classroomId,
                        classroomName: wizardData.classroomName
                      }]
                    } as Course;
                    const tchAssigned = courses.filter(c => c.teacherId === tch.id || (c.teacherName && c.teacherName.toLowerCase().includes(tch.name.toLowerCase()) && c.teacherName !== 'Sin asignar'));
                    const conflict = checkTeacherScheduleConflict(candidateCourseForTch, tchAssigned);

                    return (
                      <div
                        key={tch.id}
                        onClick={() => {
                          if (conflict.hasConflict) {
                            alert(`No es posible seleccionar a este profesor debido a un choque de horario:\n\n${conflict.reason}`);
                            return;
                          }
                          setWizardData(prev => ({
                            ...prev,
                            teacherId: tch.id,
                            teacherName: tch.name,
                            cedula_profesor: tch.cedula || ''
                          }));
                        }}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                          conflict.hasConflict
                            ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 opacity-80'
                            : isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={tch.avatar}
                            alt={tch.name}
                            className="w-10 h-10 rounded-full object-cover border border-indigo-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{tch.name}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{tch.specialty || tch.department}</p>
                            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">C.I: {tch.cedula || 'N/A'}</span>
                          </div>
                        </div>

                        {conflict.hasConflict && (
                          <div className="p-1.5 bg-rose-100 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 rounded-lg text-[10px] text-rose-800 dark:text-rose-200 flex items-start gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>Choque de horario con <strong>{conflict.conflictingCourse?.name}</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer"
                  >
                    Regresar
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(5)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    Siguiente: Matrícula Inicial <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: MATRÍCULA INICIAL (OPCIONAL) */}
            {wizardStep === 5 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Paso 5: Matrícula Inicial de Estudiantes (Opcional)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Puedes pre-matricular participantes ahora mismo. El sistema bloquea automáticamente a estudiantes con choque de horario.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Alumnos seleccionados: <strong className="text-indigo-600">{wizardData.initialStudentIds.length}</strong> / {wizardData.capacity} cupos</span>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map(st => {
                    const isChecked = wizardData.initialStudentIds.includes(st.id);
                    const candidateCourseForSt: Course = {
                      id: 'temp-wizard-course',
                      code: wizardData.courseCode || 'TEMP',
                      name: wizardData.courseName || 'Nuevo Curso',
                      schedules: [{
                        id: 'temp-sch',
                        dayOfWeek: wizardData.dayOfWeek,
                        startTime: wizardData.startTime,
                        endTime: wizardData.endTime,
                        classroomId: wizardData.classroomId,
                        classroomName: wizardData.classroomName
                      }]
                    } as Course;

                    const stEnrollments = enrollments.filter(e => (e.studentId === st.id || (st.cedula && e.studentCode === st.cedula)) && e.status === 'Inscrito');
                    const stCourses = courses.filter(c => stEnrollments.some(e => e.courseId === c.id));
                    const conflict = checkStudentScheduleConflict(candidateCourseForSt, stCourses);

                    return (
                      <label
                        key={st.id}
                        className={`flex items-center justify-between p-2.5 text-xs transition-colors ${
                          conflict.hasConflict
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 text-slate-400 cursor-not-allowed'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={conflict.hasConflict}
                            onChange={() => {
                              if (conflict.hasConflict) {
                                alert(`No es posible matricular al estudiante:\n\n${conflict.reason}`);
                                return;
                              }
                              setWizardData(prev => {
                                const exists = prev.initialStudentIds.includes(st.id);
                                if (exists) {
                                  return { ...prev, initialStudentIds: prev.initialStudentIds.filter(id => id !== st.id) };
                                } else {
                                  if (prev.initialStudentIds.length >= prev.capacity) return prev;
                                  return { ...prev, initialStudentIds: [...prev.initialStudentIds, st.id] };
                                }
                              });
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
                          />
                          <div>
                            <span className={`font-bold ${conflict.hasConflict ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                              {st.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">C.I: {st.cedula || 'N/A'} • {st.code}</span>
                            {conflict.hasConflict && (
                              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                                ⚠️ Choque de horario con {conflict.conflictingCourse?.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500">{st.email}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Resumen Final Card */}
                <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-1">
                  <h4 className="font-bold text-indigo-300 text-sm mb-1">Resumen de la Oferta a Publicar:</h4>
                  <p><strong>Aula:</strong> {wizardData.classroomName}</p>
                  <p><strong>Horario:</strong> {wizardData.dayOfWeek} de {wizardData.startTime} a {wizardData.endTime}</p>
                  <p><strong>Profesor:</strong> {wizardData.teacherName || 'Por asignar'}</p>
                  <p><strong>Cupos Ofertados:</strong> {wizardData.capacity} estudiantes</p>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(4)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer"
                  >
                    Regresar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirmar y Aperturar Oferta Académica
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: GESTIÓN DE ESPACIOS FÍSICOS (AULAS CRUD)      */}
      {/* ======================================================== */}
      {activeSubTab === 'classrooms' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" /> Directorio de Aulas, Talleres y Laboratorios
              </h3>
              <p className="text-xs text-slate-500">
                Administra los espacios físicos de la institución, su aforo máximo, equipamiento y mapa de ocupación semanal.
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setClassroomViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    classroomViewMode === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Directorio (Tarjetas)
                </button>
                <button
                  onClick={() => setClassroomViewMode('matrix')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    classroomViewMode === 'matrix'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Matriz Semanal de Disponibilidad
                </button>
              </div>

              <button
                onClick={() => {
                  setEditingClassroom({
                    id: `aula-${Date.now()}`,
                    code: `AUL-${Math.floor(10 + Math.random() * 89)}`,
                    name: '',
                    building: 'Edificio Central',
                    floor: 1,
                    capacity: 25,
                    type: 'Teórica',
                    resources: ['Pizarra Acrílica', 'Aire Acondicionado'],
                    status: 'Disponible'
                  });
                  setIsClassroomModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Registrar Nueva Aula
              </button>
            </div>
          </div>

          {classroomViewMode === 'matrix' ? (
            <ClassroomAvailabilityMatrix
              classrooms={classrooms}
              courses={courses}
              onOpenSectionForClassroom={(classroom, day, startTime, endTime) => {
                // If a course is available to branch out, pick the first eligible or first existing course
                const targetCourse = eligibleCourses.find(c => c.eligibility.isEligible)?.course || courses[0];
                if (targetCourse) {
                  setSelectedCourseForNewSection(targetCourse);
                  setIsSectionModalOpen(true);
                }
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classrooms.map(cls => (
                <div
                  key={cls.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                        {cls.code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cls.status === 'Disponible'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {cls.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{cls.name}</h4>
                    <p className="text-xs text-slate-500 mb-3">{cls.building} • Piso {cls.floor}</p>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Capacidad Máxima:</span>
                        <strong className="text-slate-900 dark:text-slate-100">{cls.capacity} personas</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tipo de Espacio:</span>
                        <strong className="text-indigo-600 dark:text-indigo-400">{cls.type}</strong>
                      </div>
                      <div className="pt-1">
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Equipamiento:</span>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                          {cls.resources.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setEditingClassroom(cls);
                        setIsClassroomModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-all"
                      title="Editar Aula"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: GESTIONAR ALUMNOS MATRICULADOS EN EL CURSO        */}
      {/* ======================================================== */}
      {selectedCourseForEnrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                  {selectedCourseForEnrollment.code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Matrícula: {selectedCourseForEnrollment.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Profesor: <strong>{selectedCourseForEnrollment.teacherName}</strong> • Aula: <strong>{selectedCourseForEnrollment.schedules[0]?.classroomName}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedCourseForEnrollment(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: List of Enrolled Students + Quick Add */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Enrolled Students Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Alumnos Matriculados ({getEnrolledStudentsForCourse(selectedCourseForEnrollment.id).length} de {selectedCourseForEnrollment.capacity} cupos)
                  </h4>
                </div>

                {getEnrolledStudentsForCourse(selectedCourseForEnrollment.id).length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Aún no hay alumnos matriculados en esta sección.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {getEnrolledStudentsForCourse(selectedCourseForEnrollment.id).map(enr => {
                      const stObj = users.find(u => u.id === enr.studentId);
                      return (
                        <div key={enr.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                              {enr.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{enr.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">C.I: {stObj?.cedula || 'N/A'} • Código: {enr.studentCode}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => dropEnrollment(enr.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold flex items-center gap-1"
                            title="Dar de baja alumno"
                          >
                            <UserMinus className="w-3.5 h-3.5" /> Retirar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add New Student Section */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-600" /> Inscribir Nuevo Estudiante
                </h4>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="Buscar estudiante por nombre o cédula..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                  />

                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                    {students
                      .filter(st => {
                        const isAlreadyEnrolled = enrollments.some(e => e.courseId === selectedCourseForEnrollment.id && e.studentId === st.id && e.status === 'Inscrito');
                        const matches = st.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                          (st.cedula && st.cedula.includes(studentSearchTerm));
                        return !isAlreadyEnrolled && matches;
                      })
                      .slice(0, 10)
                      .map(st => {
                        const stEnrollments = enrollments.filter(e => (e.studentId === st.id || (st.cedula && e.studentCode === st.cedula)) && e.status === 'Inscrito');
                        const stCourses = courses.filter(c => stEnrollments.some(e => e.courseId === c.id));
                        const conflict = checkStudentScheduleConflict(selectedCourseForEnrollment, stCourses);

                        return (
                          <div key={st.id} className={`flex items-center justify-between p-2 text-xs ${conflict.hasConflict ? 'bg-rose-50/40 dark:bg-rose-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                            <div>
                              <span className={`font-bold ${conflict.hasConflict ? 'text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{st.name}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">C.I: {st.cedula || 'N/A'}</span>
                              {conflict.hasConflict && (
                                <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                                  ⚠️ Choque de horario ({conflict.conflictingCourse?.name})
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                const res = enrollCourse(selectedCourseForEnrollment.id, st);
                                if (!res.success) {
                                  alert(res.message);
                                }
                              }}
                              disabled={conflict.hasConflict}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                conflict.hasConflict
                                  ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                              }`}
                            >
                              <Plus className="w-3 h-3" /> Matricular
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCourseForEnrollment(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR / CREAR AULA                               */}
      {/* ======================================================== */}
      {isClassroomModalOpen && editingClassroom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              {editingClassroom.name ? 'Editar Espacio Físico' : 'Registrar Nuevo Espacio Físico'}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveClassroom(editingClassroom as Classroom);
                setIsClassroomModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Aula / Taller</label>
                <input
                  type="text"
                  required
                  value={editingClassroom.name || ''}
                  onChange={(e) => setEditingClassroom(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej. Taller 04 - Climatización y Motores"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={editingClassroom.code || ''}
                    onChange={(e) => setEditingClassroom(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Capacidad Máxima</label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={100}
                    value={editingClassroom.capacity || 20}
                    onChange={(e) => setEditingClassroom(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Espacio</label>
                <select
                  value={editingClassroom.type || 'Teórica'}
                  onChange={(e) => setEditingClassroom(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                >
                  <option value="Teórica">Teórica</option>
                  <option value="Laboratorio de Cómputo">Laboratorio de Cómputo</option>
                  <option value="Taller Técnico / Industrial">Taller Técnico / Industrial</option>
                  <option value="Taller de Diseño">Taller de Diseño / Estética</option>
                  <option value="Auditorio">Auditorio</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsClassroomModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Guardar Espacio Físico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN DE OFERTA             */}
      {/* ======================================================== */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ¿Eliminar / Dar de Baja Oferta?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Estás a punto de dar de baja la oferta del curso <strong className="text-slate-900 dark:text-slate-100">{courseToDelete.name} ({courseToDelete.code})</strong>. 
              Esto cancelará la asignación de aula, horario y matrículas activas.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCourse(courseToDelete.id);
                  setCourseToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MODAL: APERTURA DE NUEVA SECCIÓN POR DEMANDA             */}
      {/* ======================================================== */}
      {isSectionModalOpen && selectedCourseForNewSection && (
        <SectionOpeningModal
          baseCourse={selectedCourseForNewSection}
          courses={courses}
          classrooms={classrooms}
          users={users}
          isOpen={isSectionModalOpen}
          onClose={() => {
            setIsSectionModalOpen(false);
            setSelectedCourseForNewSection(null);
          }}
          onSaveSection={(newCourse, initialStudentIds) => {
            // Save the newly created section course
            saveCourse(newCourse);

            // Enroll initial students into the newly created course
            initialStudentIds.forEach(studentId => {
              enrollCourse(studentId, newCourse.id);
            });

            setIsSectionModalOpen(false);
            setSelectedCourseForNewSection(null);
            setActiveSubTab('matrix');
          }}
        />
      )}
    </div>
  );
};
