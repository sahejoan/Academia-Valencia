import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  Award,
  Building2,
  Plus,
  Trash2,
  Edit,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Search,
  X,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  ShieldCheck,
  Sparkles,
  Clock,
  MapPin
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
import { exportGradesToExcel, exportCoursesToExcel, exportClassroomsToExcel, exportAnalyticsToExcel } from '../../utils/excelExport';

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

  // Colors for Recharts Pie & Grades Distribution
  const GRADE_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
    '90 - 100 (Excelente)': { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', hex: '#10B981' },
    '80 - 89 (Bueno)': { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', hex: '#3B82F6' },
    '60 - 79 (Aprobado)': { bg: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-400', hex: '#06B6D4' },
    '40 - 59 (Recuperación)': { bg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', hex: '#F59E0B' },
    '0 - 39 (Reprobado)': { bg: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', hex: '#EF4444' }
  };
  const FALLBACK_COLORS = ['#10B981', '#3B82F6', '#06B6D4', '#F59E0B', '#EF4444'];

  const totalGradesCount = analytics.gradesDistribution.reduce((acc, curr) => acc + curr.count, 0);
  const activeGradesDistribution = analytics.gradesDistribution.filter(item => item.count > 0);

  const filteredCourses = courses.filter(c => {
    const matchesSearch =
      c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
      (c.specialty && c.specialty.toLowerCase().includes(courseSearch.toLowerCase())) ||
      c.teacherName.toLowerCase().includes(courseSearch.toLowerCase());
    const matchesDept = selectedDept === 'all' || c.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const departments = ['all', ...Array.from(new Set(courses.map(c => c.department)))];

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

    saveCourse(editingCourse as Course);
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
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-purple-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Super Usuario del Sistema
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight mt-1">
              Panel de Administración y Analítica Global
            </h2>
            <p className="text-purple-200 text-sm mt-1">
              Vicerrectoría Académica • Gestión de Oferta, Actividades Académicas, Aulas, Matriz de Permisos y Reportes Oficiales
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canCreateCourse && (
              <button
                onClick={handleOpenNewCourse}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + Curso
              </button>
            )}
          </div>
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
                  Existen cruces de aula o docente asignados a la misma hora en dos asignaturas distintas.
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

      {/* KPIs Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Estudiantes</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{analytics.totalStudents}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">100% Matriculados</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Docentes Titulares</span>
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
          <span className="text-[10px] text-slate-400">Prom: {analytics.averageGrade}/100</span>
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
                      {analytics.averageGrade.toFixed(0)}
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
                Alta, edición de fechas, cupos, especialidad docente, horarios y baja definitiva de asignaturas institucionales.
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
                placeholder="Buscar por código, asignatura, especialidad o docente..."
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none dark:text-white"
              />
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
                  <th className="px-3 py-3">Período (Inicio - Fin)</th>
                  <th className="px-3 py-3">Docente Titular</th>
                  <th className="px-3 py-3 text-center">Cupo (Inscritos/Max)</th>
                  <th className="px-3 py-3">Horario y Recinto</th>
                  <th className="px-3 py-3 text-center rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
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
                  filteredCourses.map(c => (
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
                      <td className="px-3 py-3">
                        <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          {c.startDate || '01/09/2026'} - {c.endDate || '18/12/2026'}
                        </div>
                        <span className="text-[10px] text-slate-400">Semana {c.currentWeek || 8} de {c.syllabusWeeks || 16}</span>
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
                              title="Editar Asignatura"
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
                  ))
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Centro de Descarga de Reportes Institucionales
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Genera documentos ejecutivos y tablas de datos completas en formatos oficiales Excel (.xlsx) y PDF.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Reporte de Calificaciones Global
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Sábana de notas de todos los estudiantes, evaluaciones parciales y estado de aprobación.
              </p>
              <button
                onClick={() => exportGradesToExcel(grades, 'Sábana_Calificaciones_2026-1.xlsx')}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" /> Exportar a Excel (.xlsx)
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Catálogo de Oferta Académica
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Lista detallada de asignaturas, cupos máximos, inscriptos actuales y asignación de aulas.
              </p>
              <button
                onClick={() => exportCoursesToExcel(courses, 'Oferta_Academica_2026-1.xlsx')}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" /> Exportar a Excel (.xlsx)
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Aulas e Infraestructura
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Inventario de recintos, capacidades de aforo, equipamiento tecnológico y disponibilidad.
              </p>
              <button
                onClick={() => exportClassroomsToExcel(classrooms, 'Infraestructura_Aulas.xlsx')}
                className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" /> Exportar a Excel (.xlsx)
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

                <div>
                  <label className="font-semibold block mb-1">Duración Estimada</label>
                  <input
                    type="text"
                    placeholder="Ej. 120 Horas / 16 Semanas"
                    value={editingCourse.duracion || ''}
                    onChange={e => setEditingCourse({ ...editingCourse, duracion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
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
                  <label className="font-semibold block mb-1">Departamento / Facultad</label>
                  <input
                    type="text"
                    required
                    value={editingCourse.department || 'Ingeniería de Sistemas'}
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
                <label className="font-semibold block mb-1">Docente Asignado</label>
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
    </div>
  );
};
