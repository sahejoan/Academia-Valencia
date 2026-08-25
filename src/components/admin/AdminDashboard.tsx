import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Award,
  Building2,
  Plus,
  Trash2,
  Edit,
  Download,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  ShieldCheck,
  Sparkles,
  Clock,
  MapPin,
  BookOpenCheck,
  Activity,
  Bell,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { Course, Classroom, CourseSchedule } from '../../types';
import {
  generateAcademicOfferPDF,
  generateClassroomsReportPDF,
  generateGlobalGradesReportPDF,
  generateAnalyticsReportPDF
} from '../../utils/pdfExport';
import { checkCourseSectionClosed } from '../../utils/conflictDetector';

interface AdminDashboardProps {
  activeTab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab }) => {
  const {
    courses,
    classrooms,
    users,
    grades,
    saveCourse,
    setCourseStartDate,
    deleteCourse,
    resetCoursesToDefault,
    resolveAllConflictsAutomatically,
    saveClassroom,
    deleteClassroom,
    conflicts,
    analytics,
    hasPermission
  } = useApp();

  const [courseSearch, setCourseSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Partial<Classroom> | null>(null);

  const teachers = users.filter(u => u.role === 'teacher');

  const canCreateCourse = hasPermission('courses.create');
  const canEditCourse = hasPermission('courses.edit');
  const canDeleteCourse = hasPermission('courses.delete');
  const canManageClassrooms = hasPermission('classrooms.manage');
  const canExportReports = hasPermission('reports.export');

  // Colors for Recharts Pie & Grades Distribution (Escala Vigesimal Institucional 1 a 20 pts)
  const GRADE_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
    '18 - 20 (Sobresaliente)': { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', hex: '#10B981' },
    '14 - 17 (Notable / Distinguido)': { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', hex: '#3B82F6' },
    '10 - 13 (Aprobado / Regular)': { bg: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-400', hex: '#06B6D4' },
    '01 - 09 (Reprobado)': { bg: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', hex: '#EF4444' }
  };
  const FALLBACK_COLORS = ['#10B981', '#3B82F6', '#06B6D4', '#EF4444'];

  const totalGradesCount = analytics.gradesDistribution.reduce((acc, curr) => acc + curr.count, 0);
  const activeGradesDistribution = analytics.gradesDistribution.filter(item => item.count > 0);

  const [courseQuorumFilter, setCourseQuorumFilter] = useState<'all' | 'pending_date' | 'ready' | 'waiting'>('all');
  const [quickDateCourse, setQuickDateCourse] = useState<Course | null>(null);
  const [quickStartDate, setQuickStartDate] = useState('');
  const [quickEndDate, setQuickEndDate] = useState('');
  const [quickTotalWeeks, setQuickTotalWeeks] = useState(16);

  // Modal alert on login for courses with quorum pending start date
  const [isPendingStartDateReminderOpen, setIsPendingStartDateReminderOpen] = useState(false);
  const [hasPromptedLoginReminder, setHasPromptedLoginReminder] = useState(false);

  const totalEnrolledAcrossCourses = courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
  const coursesWithQuorum = courses.filter(c => (c.enrolledCount || 0) >= 3);
  const coursesWaitingQuorum = courses.filter(c => (c.enrolledCount || 0) < 3);
  const coursesPendingStartDate = courses.filter(c => (c.enrolledCount || 0) >= 3 && !c.startDateSetByAdmin);

  // Check on component mount / login if there are pending courses
  useEffect(() => {
    if (!hasPromptedLoginReminder && coursesPendingStartDate.length > 0) {
      setIsPendingStartDateReminderOpen(true);
      setHasPromptedLoginReminder(true);
    }
  }, [coursesPendingStartDate.length, hasPromptedLoginReminder]);

  const calculateEndDateHelper = (startDateStr: string, totalWeeks: number) => {
    if (!startDateStr) return '';
    try {
      const parts = startDateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        d.setDate(d.getDate() + (totalWeeks * 7));
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch (e) {}
    return '';
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch =
      c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
      (c.specialty && c.specialty.toLowerCase().includes(courseSearch.toLowerCase())) ||
      c.teacherName.toLowerCase().includes(courseSearch.toLowerCase());
    const matchesDept = selectedDept === 'all' || c.department === selectedDept;
    
    const count = c.enrolledCount || 0;
    const matchesQuorum =
      courseQuorumFilter === 'all' ||
      (courseQuorumFilter === 'pending_date' && count >= 3 && !c.startDateSetByAdmin) ||
      (courseQuorumFilter === 'ready' && count >= 3 && c.startDateSetByAdmin) ||
      (courseQuorumFilter === 'waiting' && count < 3);

    return matchesSearch && matchesDept && matchesQuorum;
  });

  const departments = ['all', ...Array.from(new Set(courses.map(c => c.department)))];

  const handleOpenQuickDateModal = (course: Course) => {
    setQuickDateCourse(course);
    const weeks = course.duracionSemanas || course.syllabusWeeks || 16;
    const initialStart = course.startDateSetByAdmin && course.startDate 
      ? course.startDate 
      : new Date().toISOString().split('T')[0];
    setQuickStartDate(initialStart);
    setQuickTotalWeeks(weeks);
    setQuickEndDate(calculateEndDateHelper(initialStart, weeks));
  };

  const handleStartDateChange = (newStart: string) => {
    setQuickStartDate(newStart);
    setQuickEndDate(calculateEndDateHelper(newStart, quickTotalWeeks));
  };

  const handleSaveQuickDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDateCourse || !quickStartDate) return;
    const res = setCourseStartDate(quickDateCourse.id, quickStartDate, quickTotalWeeks);
    if (res.success) {
      setQuickDateCourse(null);
    } else {
      alert(res.message);
    }
  };

  const handleOpenNewCourse = () => {
    setEditingCourse({
      id: `course-${Date.now()}`,
      code: `INF-${Math.floor(400 + Math.random() * 90)}`,
      name: '',
      department: 'Ingeniería de Sistemas',
      career: 'Ingeniería de Sistemas',
      specialty: 'Desarrollo de Software & Arquitectura Cloud',
      credits: 4,
      capacity: 35,
      enrolledCount: 0,
      teacherId: teachers[0]?.id || '',
      teacherName: teachers[0]?.name || '',
      startDate: '2026-09-01',
      endDate: '2026-12-18',
      syllabusWeeks: 16,
      currentWeek: 1,
      prerequisites: [],
      schedules: [
        {
          id: `sch-${Date.now()}`,
          dayOfWeek: 'Lunes',
          startTime: '08:00',
          endTime: '10:00',
          classroomId: classrooms[0]?.id || '',
          classroomName: classrooms[0]?.name || ''
        }
      ],
      modality: 'Presencial',
      status: 'Activo',
      description: '',
      term: '2026-1'
    });
    setIsCourseModalOpen(true);
  };

  const handleSaveCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse?.name || !editingCourse?.code) return;

    const res = saveCourse(editingCourse as Course);
    if (!res.success) {
      alert(res.message);
      return;
    }
    setIsCourseModalOpen(false);
    setEditingCourse(null);
  };

  const handleAddScheduleSlot = () => {
    if (!editingCourse) return;
    const newSlot: CourseSchedule = {
      id: `sch-${Date.now()}`,
      dayOfWeek: 'Miércoles',
      startTime: '10:00',
      endTime: '12:00',
      classroomId: classrooms[0]?.id || '',
      classroomName: classrooms[0]?.name || ''
    };
    setEditingCourse({
      ...editingCourse,
      schedules: [...(editingCourse.schedules || []), newSlot]
    });
  };

  const handleRemoveScheduleSlot = (index: number) => {
    if (!editingCourse?.schedules) return;
    setEditingCourse({
      ...editingCourse,
      schedules: editingCourse.schedules.filter((_, i) => i !== index)
    });
  };

  const handleUpdateScheduleSlot = (index: number, field: keyof CourseSchedule, value: any) => {
    if (!editingCourse?.schedules) return;
    const updated = [...editingCourse.schedules];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'classroomId') {
      const cls = classrooms.find(c => c.id === value);
      if (cls) updated[index].classroomName = cls.name;
    }
    setEditingCourse({
      ...editingCourse,
      schedules: updated
    });
  };

  const handleOpenNewClassroom = () => {
    setEditingClassroom({
      id: `aula-${Date.now()}`,
      code: 'A302',
      name: 'Aula 302',
      building: 'Edificio A',
      floor: 3,
      capacity: 35,
      type: 'Teórica',
      resources: ['Proyector HD', 'Aire Acondicionado'],
      status: 'Disponible'
    });
    setIsClassroomModalOpen(true);
  };

  const handleSaveClassroomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassroom?.name || !editingClassroom?.code) return;

    saveClassroom(editingClassroom as Classroom);
    setIsClassroomModalOpen(false);
    setEditingClassroom(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
            <Sparkles className="w-3.5 h-3.5 text-sky-200" /> Super Usuario del Sistema
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Panel de Administración y Analítica Global
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
            Vicerrectoría Académica • Gestión de Oferta, Actividades Académicas, Aulas, Matriz de Permisos y Reportes Oficiales
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          {canCreateCourse && (
            <button
              onClick={handleOpenNewCourse}
              className="px-5 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-sky-400" />
              <span>Nuevo Curso</span>
            </button>
          )}
        </div>
      </div>

      {/* Conflict Alert Banner if any */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  ¡Atención! Se han detectado {conflicts.length} conflicto(s) de solapamiento de horario
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Existen cruces de aula o profesor asignados a la misma hora en dos asignaturas distintas.
                </p>
                <div className="mt-2 space-y-1">
                  {conflicts.map((conf, idx) => (
                    <div key={idx} className="text-xs bg-amber-100/80 dark:bg-amber-900/40 p-2 rounded-lg text-amber-900 dark:text-amber-200">
                      • <strong>{conf.locationOrPerson}</strong> ({conf.day} {conf.timeSlot}): {conf.course1} vs {conf.course2}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => resolveAllConflictsAutomatically()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Resolver Conflictos
            </button>
          </div>
        </div>
      )}

      {/* Institutional Alert: Courses with Quorum (>= 3 students) Pending Start Date Assignment */}
      {coursesPendingStartDate.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-amber-950/40 border-2 border-amber-400 dark:border-amber-600/70 rounded-2xl p-5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-extrabold text-amber-950 dark:text-amber-100 tracking-tight">
                    ⚠️ Alerta de Programación Académica: {coursesPendingStartDate.length} {coursesPendingStartDate.length === 1 ? 'curso tiene' : 'cursos tienen'} quórum alcanzado y está{coursesPendingStartDate.length === 1 ? '' : 'n'} pendiente{coursesPendingStartDate.length === 1 ? '' : 's'} por asignar Fecha de Inicio
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                    Acción Requerida
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 dark:text-amber-200/90 leading-relaxed max-w-3xl">
                  El sistema no inicia los cursos automáticamente tras completar el quórum mínimo (3 estudiantes). Es responsabilidad del Administrador asignar la fecha oficial de inicio. Al indicar la fecha de inicio, el sistema calculará automáticamente la fecha de culminación según la cantidad de semanas del curso.
                </p>

                {/* Quick list of pending courses */}
                <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                  {coursesPendingStartDate.map(pc => (
                    <div
                      key={pc.id}
                      className="bg-white/90 dark:bg-slate-900/90 border border-amber-300/80 dark:border-amber-700/60 p-3 rounded-xl flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">
                            {pc.code}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {pc.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            ✓ {pc.enrolledCount} alumnos matriculados
                          </span>
                          <span>•</span>
                          <span>{pc.duracionSemanas || pc.syllabusWeeks || 16} semanas de duración</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenQuickDateModal(pc)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all cursor-pointer hover:scale-102"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Fijar Fecha</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Estudiantes</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{analytics.totalStudents}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">100% Matriculados</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Profesores Titulares</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{analytics.totalTeachers}</div>
          <span className="text-[10px] text-blue-600 font-semibold">Carga Asignada</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Cursos Ofertados</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{analytics.totalCourses}</div>
          <span className="text-[10px] text-indigo-600 font-semibold">Semestre 2026-1</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Tasa de Aprobación</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{analytics.passRate}%</div>
          <span className="text-[10px] text-slate-400">Prom: {analytics.averageGrade} / 20 pts</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Ocupación de Aulas</span>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{analytics.classroomOccupancyRate}%</div>
          <span className="text-[10px] text-purple-500 font-semibold">Eficiencia Espacial</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Capacity Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" /> Ocupación y Capacidad por Asignatura
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50">
                {analytics.classroomOccupancyRate}% Promedio
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Relación de estudiantes matriculados respecto al cupo disponible.</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.courseEnrollmentDistribution.slice(0, 10)}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="courseName" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-800 backdrop-blur-sm z-50">
                          <p className="font-bold text-slate-100 mb-1">Código: {label}</p>
                          <p className="text-indigo-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Inscritos: <strong className="text-white">{payload[0]?.value}</strong>
                          </p>
                          <p className="text-slate-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Capacidad: <strong className="text-white">{payload[1]?.value}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="enrolled" name="Inscritos" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="capacity" name="Capacidad" fill="#CBD5E1" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grades Donut Chart & Detailed Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-emerald-600" /> Distribución General de Rendimiento y Notas
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50">
                {totalGradesCount} Evaluaciones
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Mapeo de calificaciones finales de los estudiantes registrados.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mt-2">
            {/* Donut Chart Visual */}
            <div className="sm:col-span-5 h-52 relative flex items-center justify-center">
              {totalGradesCount > 0 && activeGradesDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeGradesDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={72}
                        paddingAngle={activeGradesDistribution.length > 1 ? 3 : 0}
                        dataKey="count"
                        nameKey="range"
                      >
                        {activeGradesDistribution.map((entry, idx) => (
                          <Cell
                            key={entry.range || `slice-${idx}`}
                            fill={GRADE_COLORS[entry.range]?.hex || FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const percentage = totalGradesCount > 0 ? ((data.count / totalGradesCount) * 100).toFixed(1) : 0;
                            return (
                              <div className="bg-slate-900/95 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-800 backdrop-blur-sm z-50">
                                <p className="font-bold text-slate-100">{data.range}</p>
                                <p className="text-slate-300 mt-1">
                                  <span className="font-bold text-emerald-400">{data.count}</span> estudiante{data.count !== 1 ? 's' : ''} ({percentage}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Metric */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {analytics.averageGrade.toFixed(1)}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                      Promedio
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
                  <PieIcon className="w-8 h-8 opacity-30 mb-2" />
                  Sin registros
                </div>
              )}
            </div>

            {/* Breakdown Legend List */}
            <div className="sm:col-span-7 space-y-1.5">
              {analytics.gradesDistribution.map((item) => {
                const percentage = totalGradesCount > 0 ? ((item.count / totalGradesCount) * 100).toFixed(0) : 0;
                const tier = GRADE_COLORS[item.range] || { bg: 'bg-emerald-500', text: 'text-slate-700', hex: '#10B981' };
                return (
                  <div
                    key={item.range}
                    className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: tier.hex }}
                      />
                      <span className="text-slate-700 dark:text-slate-200 truncate font-medium">
                        {item.range}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {item.count}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold min-w-8 text-right">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Course Catalog Management */}
      {(activeTab === 'course_admin' || activeTab === 'dashboard') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {filteredCourses.length} Asignaturas Activas
                </span>
                <span className="text-xs text-slate-400">• Período Académico 2026-1</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Gestión de Oferta Académica de Cursos
              </h3>
              <p className="text-xs text-slate-500">
                Alta, edición de fechas, cupos, especialidad del profesor, horarios y baja definitiva de asignaturas institucionales.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetCoursesToDefault}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title="Recargar catálogo oficial predeterminado"
              >
                🔄 Restaurar Catálogo
              </button>

              {canCreateCourse && (
                <button
                  id="btn-create-new-course"
                  onClick={handleOpenNewCourse}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Crear Nueva Asignatura
                </button>
              )}
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código, asignatura, especialidad o profesor..."
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none dark:text-white"
              />
            </div>

            {/* Quorum and Date Filter Pill Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setCourseQuorumFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  courseQuorumFilter === 'all'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Todos ({courses.length})
              </button>
              <button
                type="button"
                onClick={() => setCourseQuorumFilter('pending_date')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  courseQuorumFilter === 'pending_date'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-300/50'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                ⚠️ Pendientes de Fecha ({coursesPendingStartDate.length})
              </button>
              <button
                type="button"
                onClick={() => setCourseQuorumFilter('ready')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  courseQuorumFilter === 'ready'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Con Fecha Fijada ({courses.filter(c => (c.enrolledCount || 0) >= 3 && c.startDateSetByAdmin).length})
              </button>
              <button
                type="button"
                onClick={() => setCourseQuorumFilter('waiting')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  courseQuorumFilter === 'waiting'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pre-Matrícula &lt; 3 ({coursesWaitingQuorum.length})
              </button>
            </div>

            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d === 'all' ? 'Todos los Departamentos' : d}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-3 py-3 rounded-l-xl">Código</th>
                  <th className="px-3 py-3">Nombre Asignatura / Especialidad</th>
                  <th className="px-3 py-3 text-center">Estado de Quórum</th>
                  <th className="px-3 py-3">Fecha de Inicio & Culminación</th>
                  <th className="px-3 py-3">Profesor Titular</th>
                  <th className="px-3 py-3 text-center">Matrícula (Inscritos/Cupo)</th>
                  <th className="px-3 py-3">Horario y Recinto</th>
                  <th className="px-3 py-3 text-center rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      <p className="font-semibold text-sm">No se encontraron asignaturas registradas.</p>
                      <p className="text-xs mt-1 text-slate-500">Puedes crear una nueva o restaurar el catálogo oficial de la institución.</p>
                      <button
                        onClick={resetCoursesToDefault}
                        className="mt-3 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                      >
                        Restaurar Asignaturas Oficiales
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map(c => {
                    const hasQuorum = (c.enrolledCount || 0) >= 3;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {c.code}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{c.name}</div>
                          <span className="inline-block text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded mt-0.5">
                            {c.specialty || c.department}
                          </span>
                          <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{c.modality} • {c.duracion || '40 Horas'}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {hasQuorum ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Quórum OK ({c.enrolledCount} alumnos)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pre-Matrícula ({c.enrolledCount}/3)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {hasQuorum && !c.startDateSetByAdmin ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 animate-pulse">
                                ⚠️ Pendiente de Asignar Fecha
                              </span>
                              {canEditCourse && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickDateModal(c)}
                                  className="mt-1 w-full py-1 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <Calendar className="w-3 h-3" />
                                  Asignar Fecha de Inicio
                                </button>
                              )}
                            </div>
                          ) : c.startDateSetByAdmin && c.startDate ? (
                            <div>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                <span>Inicio: {c.startDate}</span>
                              </div>
                              {c.endDate && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Fin: {c.endDate} ({c.duracionSemanas || c.syllabusWeeks || 16} sem)
                                </div>
                              )}
                              {(() => {
                                const sectionStatus = checkCourseSectionClosed(c, courses);
                                if (sectionStatus.isSectionClosed) {
                                  return (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800">
                                        🔒 Sección Cerrada ({sectionStatus.weeksElapsed} sem)
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              {canEditCourse && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickDateModal(c)}
                                  className="mt-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                >
                                  Reprogramar Fecha
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="text-[11px] text-slate-400 italic">
                                Esperando quórum (mín. 3)
                              </span>
                              {canEditCourse && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickDateModal(c)}
                                  className="block mt-1 text-[10px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                >
                                  Fijar Fecha Tentativa
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{c.teacherName}</td>
                        <td className="px-3 py-3 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${c.enrolledCount >= c.capacity ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'}`}>
                            {c.enrolledCount} / {c.capacity}
                          </span>
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mx-auto mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${c.enrolledCount >= c.capacity ? 'bg-red-500' : 'bg-indigo-600'}`}
                              style={{ width: `${Math.min(100, (c.enrolledCount / c.capacity) * 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                          {c.schedules.map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime} (${s.classroomName})`).join(', ')}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {canEditCourse && (
                              <button
                                onClick={() => {
                                  setEditingCourse(c);
                                  setIsCourseModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-all"
                                title="Editar Asignatura Completa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteCourse && (
                              <button
                                onClick={() => setCourseToDelete(c)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all"
                                title="Eliminar Asignatura"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      {/* Confirmation Modal to Delete Course */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ¿Eliminar / Dar de Baja Asignatura?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Estás a punto de dar de baja la asignatura <strong className="text-slate-900 dark:text-slate-100">{courseToDelete.name} ({courseToDelete.code})</strong>. 
              Si ya no se va a impartir más en la institución, se eliminarán sus registros de matrícula y notas asociadas.
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
                <Trash2 className="w-3.5 h-3.5" /> Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Export Hub */}
      {(activeTab === 'reports' || activeTab === 'dashboard') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF6600]" /> Centro de Reportes Oficiales en PDF
            </h3>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF6600] border border-orange-200 dark:border-orange-900/50">
              Formato Membretado Oficial
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Genera documentos ejecutivos, sábanas de notas, catálogos y constancias en formato oficial PDF con membrete institucional, firmas y código QR de verificación.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Calificaciones Global */}
            <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Sábana Global de Calificaciones
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Sábana consolidada de notas, evaluaciones parciales y tasas de aprobación de todos los alumnos.
                </p>
              </div>
              <button
                onClick={() => generateGlobalGradesReportPDF(grades, '2026-I')}
                className="w-full py-2.5 px-3 bg-[#FF6600] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                title="Descargar Sábana Oficial en PDF con membrete y logo de Academia Valencia"
              >
                <FileText className="w-4 h-4" /> Generar Sábana (PDF)
              </button>
            </div>

            {/* Card 2: Oferta Académica */}
            <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-[#FF6600] flex items-center justify-center mb-3">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Catálogo de Oferta Académica
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Programación de 47 asignaturas, cupos, profesores facilitadores y distribución horaria.
                </p>
              </div>
              <button
                onClick={() => generateAcademicOfferPDF(courses, '2026-I')}
                className="w-full py-2.5 px-3 bg-[#FF6600] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                title="Descargar Catálogo Oficial en PDF con membrete de Academia Valencia"
              >
                <FileText className="w-4 h-4" /> Generar Catálogo (PDF)
              </button>
            </div>

            {/* Card 3: Infraestructura y Aulas */}
            <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Informe de Infraestructura & Aulas
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Auditoría técnica de recintos físicos, aforo, equipamiento tecnológico y estado.
                </p>
              </div>
              <button
                onClick={() => generateClassroomsReportPDF(classrooms)}
                className="w-full py-2.5 px-3 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                title="Descargar Informe Técnico PDF con membrete de Academia Valencia"
              >
                <FileText className="w-4 h-4" /> Informe Técnico (PDF)
              </button>
            </div>

            {/* Card 4: Analíticas y KPIs */}
            <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Informe Ejecutivo de Analíticas
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Resumen de KPIs institucionales, distribución por áreas académicas y rendimiento.
                </p>
              </div>
              <button
                onClick={() => generateAnalyticsReportPDF(analytics, '2026-I')}
                className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                title="Descargar Informe Ejecutivo de Analíticas en PDF"
              >
                <FileText className="w-4 h-4" /> Informe KPIs (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit/Create Course */}
      {isCourseModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingCourse.id && courses.some(c => c.id === editingCourse.id) ? 'Editar Asignatura Institucional' : 'Crear Nueva Asignatura Institucional'}
              </h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourseSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Código Asignatura</label>
                  <input
                    type="text"
                    required
                    value={editingCourse.code || ''}
                    onChange={e => setEditingCourse({ ...editingCourse, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Nombre de Asignatura</label>
                  <input
                    type="text"
                    required
                    value={editingCourse.name || ''}
                    onChange={e => setEditingCourse({ ...editingCourse, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Área / Categoría Institucional</label>
                  <select
                    value={editingCourse.categoria || 'COMERCIAL'}
                    onChange={e => setEditingCourse({ ...editingCourse, categoria: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    <option value="COMERCIAL">Área COMERCIAL</option>
                    <option value="INDUSTRIAL">Área INDUSTRIAL</option>
                    <option value="GERENCIAL">Área GERENCIAL</option>
                    <option value="ARTESANAL">Área ARTESANAL</option>
                  </select>
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Horas Académicas</label>
                  <input
                    type="number"
                    min="10"
                    max="240"
                    placeholder="40"
                    value={editingCourse.horasAcademicas || 40}
                    onChange={e => {
                      const h = Number(e.target.value);
                      setEditingCourse({
                        ...editingCourse,
                        horasAcademicas: h,
                        duracion: `${h} Horas Académicas`
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Horas por Semana</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    placeholder="4"
                    value={editingCourse.horasPorSemana || 4}
                    onChange={e => setEditingCourse({ ...editingCourse, horasPorSemana: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Tamaño del Contenido</label>
                  <select
                    value={editingCourse.tamanoContenido || 'Medio (6-8 módulos)'}
                    onChange={e => setEditingCourse({ ...editingCourse, tamanoContenido: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="Corto (3-4 módulos)">Corto (3-4 módulos)</option>
                    <option value="Medio (6-8 módulos)">Medio (6-8 módulos)</option>
                    <option value="Extenso (10-14 módulos)">Extenso (10-14 módulos)</option>
                  </select>
                </div>
              </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Especialidad / Área Temática</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Desarrollo de Software, Redes, Inteligencia Artificial"
                    value={editingCourse.specialty || ''}
                    onChange={e => setEditingCourse({ ...editingCourse, specialty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Departamento / Área</label>
                  <input
                    type="text"
                    required
                    value={editingCourse.department || 'Área Comercial & Tecnológica'}
                    onChange={e => setEditingCourse({ ...editingCourse, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Dates & Syllabus info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="font-semibold block mb-1 text-[11px]">Fecha de Inicio</label>
                  <input
                    type="date"
                    required
                    value={editingCourse.startDate || '2026-09-01'}
                    onChange={e => setEditingCourse({ ...editingCourse, startDate: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[11px]">Fecha Culminación</label>
                  <input
                    type="date"
                    required
                    value={editingCourse.endDate || '2026-12-18'}
                    onChange={e => setEditingCourse({ ...editingCourse, endDate: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[11px]">Total Semanas</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={editingCourse.syllabusWeeks || 16}
                    onChange={e => setEditingCourse({ ...editingCourse, syllabusWeeks: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[11px]">Semana Actual</label>
                  <input
                    type="number"
                    min="1"
                    max={editingCourse.syllabusWeeks || 16}
                    value={editingCourse.currentWeek || 1}
                    onChange={e => setEditingCourse({ ...editingCourse, currentWeek: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Carga Horaria / Nivel</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingCourse.credits || 4}
                    onChange={e => setEditingCourse({ ...editingCourse, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Cupo Máximo</label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={editingCourse.capacity || 30}
                    onChange={e => setEditingCourse({ ...editingCourse, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Modalidad</label>
                  <select
                    value={editingCourse.modality || 'Presencial'}
                    onChange={e => setEditingCourse({ ...editingCourse, modality: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Híbrida">Híbrida</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Profesor Asignado</label>
                <select
                  value={editingCourse.teacherId || ''}
                  onChange={e => {
                    const selTeacher = teachers.find(t => t.id === e.target.value);
                    setEditingCourse({
                      ...editingCourse,
                      teacherId: e.target.value,
                      teacherName: selTeacher?.name || '',
                      specialty: selTeacher?.specialty || editingCourse.specialty || ''
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.specialty || t.department})</option>
                  ))}
                </select>
              </div>

              {/* Schedules Builder */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Horarios de Clase y Aulas Asignadas
                  </span>
                  <button
                    type="button"
                    onClick={handleAddScheduleSlot}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-all"
                  >
                    + Agregar Bloque
                  </button>
                </div>

                {editingCourse.schedules && editingCourse.schedules.length > 0 ? (
                  <div className="space-y-2">
                    {editingCourse.schedules.map((sch, idx) => (
                      <div key={sch.id || idx} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                        <div className="col-span-3">
                          <select
                            value={sch.dayOfWeek}
                            onChange={e => handleUpdateScheduleSlot(idx, 'dayOfWeek', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-semibold"
                          >
                            <option value="Lunes">Lunes</option>
                            <option value="Martes">Martes</option>
                            <option value="Miércoles">Miércoles</option>
                            <option value="Jueves">Jueves</option>
                            <option value="Viernes">Viernes</option>
                            <option value="Sábado">Sábado</option>
                          </select>
                        </div>

                        <div className="col-span-2">
                          <input
                            type="time"
                            value={sch.startTime}
                            onChange={e => handleUpdateScheduleSlot(idx, 'startTime', e.target.value)}
                            className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px]"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="time"
                            value={sch.endTime}
                            onChange={e => handleUpdateScheduleSlot(idx, 'endTime', e.target.value)}
                            className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px]"
                          />
                        </div>

                        <div className="col-span-4">
                          <select
                            value={sch.classroomId}
                            onChange={e => handleUpdateScheduleSlot(idx, 'classroomId', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px]"
                          >
                            {classrooms.map(cls => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name} ({cls.type} - {cls.capacity} cap)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveScheduleSlot(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                            title="Quitar bloque"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-2">
                    No hay bloques de horario asignados. Presiona "+ Agregar Bloque".
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1">Descripción de Syllabus</label>
                <textarea
                  rows={2}
                  value={editingCourse.description || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Guardar Asignatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Date Modal for Administrator to Set Course Start Date based on Quorum (Min 3 Students) */}
      {quickDateCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Establecer Fecha de Inicio del Curso
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {quickDateCourse.code} • {quickDateCourse.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickDateCourse(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quorum status banner */}
            <div className="mt-4 p-3 rounded-xl border text-xs leading-relaxed space-y-1.5 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Estado de Matrícula:
                </span>
                <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-[11px] ${
                  (quickDateCourse.enrolledCount || 0) >= 3
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}>
                  {(quickDateCourse.enrolledCount || 0) >= 3
                    ? `✓ Quórum Alcanzado (${quickDateCourse.enrolledCount} Alumnos)`
                    : `⏳ Pre-Matrícula (${quickDateCourse.enrolledCount}/3 Alumnos)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {(quickDateCourse.enrolledCount || 0) >= 3
                  ? '✨ El curso cuenta con el quórum mínimo requerido (mínimo 3 estudiantes). El Administrador puede programar y oficializar la fecha de inicio inmediata.'
                  : 'ℹ️ El curso tiene menos de 3 estudiantes inscritos. Puedes fijar una fecha tentativa de inicio o esperar a que se complete el quórum mínimo.'}
              </p>
            </div>

            <form onSubmit={handleSaveQuickDate} className="mt-4 space-y-4 text-xs">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-3 rounded-xl">
                <p className="text-[11px] text-indigo-900 dark:text-indigo-200">
                  💡 <strong>Programación Inteligente:</strong> Ingrese únicamente la fecha de inicio. El sistema calculará la fecha de culminación automáticamente a partir de la duración del programa ({quickTotalWeeks} semanas).
                </p>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">
                  Fecha Oficial de Inicio de Clases *
                </label>
                <input
                  type="date"
                  required
                  value={quickStartDate}
                  onChange={e => handleStartDateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Duración del Curso (Semanas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={quickTotalWeeks}
                    onChange={e => {
                      const weeks = Number(e.target.value);
                      setQuickTotalWeeks(weeks);
                      setQuickEndDate(calculateEndDateHelper(quickStartDate, weeks));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Fecha de Culminación (Automática)
                  </label>
                  <div className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 font-bold flex items-center justify-between text-xs min-h-[38px]">
                    <span>{quickEndDate || 'Selecciona fecha de inicio'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickDateCourse(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold flex items-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Guardar y Oficializar Fecha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGIN POPUP MODAL: Reminder for Pending Start Dates (Quorum >= 3) */}
      {isPendingStartDateReminderOpen && coursesPendingStartDate.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border-2 border-amber-400 dark:border-amber-600 relative overflow-hidden">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600" />

            <div className="flex items-start justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 border border-amber-300 dark:border-amber-700 shadow-inner">
                  <Bell className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">
                      Acción Prioritaria al Iniciar Sesión
                    </span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {coursesPendingStartDate.length} {coursesPendingStartDate.length === 1 ? 'curso listo' : 'cursos listos'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                    Cursos con Quórum Pendientes por Fecha de Inicio
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsPendingStartDateReminderOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50/80 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-800/60">
              📌 <strong>Recordatorio del Sistema:</strong> Los siguientes cursos han alcanzado o superado la matrícula mínima requerida (mínimo 3 estudiantes). Debe asignarles la fecha oficial de inicio para que los estudiantes y la página pública conozcan el calendario.
            </p>

            <div className="mt-4 max-h-60 overflow-y-auto space-y-2.5 pr-1">
              {coursesPendingStartDate.map(course => (
                <div
                  key={course.id}
                  className="p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {course.code}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                        {course.name}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        👥 {course.enrolledCount} Matriculados (Quórum OK)
                      </span>
                      <span>•</span>
                      <span>👤 Prof. {course.teacherName}</span>
                      <span>•</span>
                      <span>⏱️ {course.duracion || `${course.syllabusWeeks || 16} semanas`}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsPendingStartDateReminderOpen(false);
                      handleOpenQuickDateModal(course);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Fijar Fecha Ahora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Esta ventana recuerda las tareas pendientes más prioritarias.
              </span>
              <button
                onClick={() => setIsPendingStartDateReminderOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
