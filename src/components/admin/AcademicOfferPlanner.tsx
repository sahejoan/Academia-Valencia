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
  FileSpreadsheet,
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
import { exportCoursesToExcel } from '../../utils/excelExport';

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

  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'wizard' | 'classrooms'>('matrix');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClassroomFilter, setSelectedClassroomFilter] = useState<string>('all');
  
  // Modal states
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<Course | null>(null);
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

    saveCourse(finalCourse);

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

  // Get enrolled students for a specific course
  const getEnrolledStudentsForCourse = (courseId: string) => {
    return enrollments.filter(e => e.courseId === courseId && e.status === 'Inscrito');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                Planificación Académica 360°
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                Ciclo 2026-I
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Layers className="w-8 h-8 text-indigo-400" />
              Apertura & Planificador de Oferta Académica
            </h1>
            <p className="text-blue-200 text-sm mt-1 max-w-2xl">
              Flujo unificado para estructurar y ofertar asignaturas: <strong>Espacio Físico (Aula) ➔ Curso a Dictar ➔ Horarios ➔ Facilitador/Profesor ➔ Matrícula de Alumnos</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('wizard')}
              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Aperturar Nueva Oferta
            </button>
            <button
              onClick={() => exportCoursesToExcel(courses, 'Oferta_Academica_Consolidada.xlsx')}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Descargar Oferta en Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Exportar
            </button>
          </div>
        </div>

        {/* Decorative subtle background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Matriz Consolidada (Aula-Curso-Horario-Profesor-Alumnos)
          <span className="px-1.5 py-0.2 bg-indigo-800/60 text-white rounded-full text-[10px]">
            {courses.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('wizard');
            setWizardStep(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'wizard'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" /> Asistente de Apertura (Paso a Paso)
        </button>

        <button
          onClick={() => setActiveSubTab('classrooms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'classrooms'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Gestión de Espacios Físicos (Aulas & Talleres)
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
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                        {course.description}
                      </p>

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
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setSelectedCourseForEnrollment(course)}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Ver / Gestionar Alumnos ({course.enrolledCount})
                      </button>

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
                    Determina en qué salón, laboratorio o taller especializado se impartirá la materia.
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
                    Elige uno de los 47 cursos estructurados o redacta una materia personalizada.
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
                          [{c.categoria || 'GENERAL'}] {c.code} — {c.name} ({c.duracion || '40 Horas'})
                        </option>
                      ))}
                    </select>

                    {/* Preview Box */}
                    {courses.find(c => c.id === wizardData.existingCourseId) && (
                      <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs">
                        <strong className="text-indigo-700 dark:text-indigo-300">Descripción del curso:</strong>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                          {courses.find(c => c.id === wizardData.existingCourseId)?.description}
                        </p>
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
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Duración</label>
                      <input
                        type="text"
                        value={wizardData.duracion}
                        onChange={(e) => setWizardData(prev => ({ ...prev, duracion: e.target.value }))}
                        placeholder="Ej. 60 Horas / 8 Semanas"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                      />
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
                    Siguiente: Asignar Docente <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PROFESOR RESPONSABLE */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" /> Paso 4: Asigna el Facilitador / Docente Responsable
                  </h3>
                  <p className="text-xs text-slate-500">
                    Asocia al profesor especialista que dictará el contenido y registrará las calificaciones.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teachers.map(tch => {
                    const isSelected = wizardData.teacherId === tch.id;
                    return (
                      <div
                        key={tch.id}
                        onClick={() => {
                          setWizardData(prev => ({
                            ...prev,
                            teacherId: tch.id,
                            teacherName: tch.name,
                            cedula_profesor: tch.cedula || ''
                          }));
                        }}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
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
                    Puedes pre-matricular participantes ahora mismo o dejar el curso disponible para inscripción posterior.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Alumnos seleccionados: <strong className="text-indigo-600">{wizardData.initialStudentIds.length}</strong> / {wizardData.capacity} cupos</span>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map(st => {
                    const isChecked = wizardData.initialStudentIds.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
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
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{st.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">C.I: {st.cedula || 'N/A'} • {st.code}</span>
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
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" /> Directorio de Aulas, Talleres y Laboratorios
              </h3>
              <p className="text-xs text-slate-500">
                Administra los espacios físicos de la institución, su aforo máximo y equipamiento técnico.
              </p>
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

                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                    {students
                      .filter(st => {
                        const isAlreadyEnrolled = enrollments.some(e => e.courseId === selectedCourseForEnrollment.id && e.studentId === st.id && e.status === 'Inscrito');
                        const matches = st.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                          (st.cedula && st.cedula.includes(studentSearchTerm));
                        return !isAlreadyEnrolled && matches;
                      })
                      .slice(0, 10)
                      .map(st => (
                        <div key={st.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{st.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">C.I: {st.cedula || 'N/A'}</span>
                          </div>
                          <button
                            onClick={() => {
                              enrollCourse(selectedCourseForEnrollment.id, st);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Matricular
                          </button>
                        </div>
                      ))}
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
    </div>
  );
};
