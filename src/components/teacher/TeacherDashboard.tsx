import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  Award,
  Save,
  Download,
  Send,
  Building,
  Building2,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  Calendar,
  CalendarDays,
  Sparkles,
  Search,
  Check,
  TrendingUp,
  UserCheck,
  Percent,
  Layers,
  MapPin,
  Eye,
  Filter,
  ArrowRight,
  X,
  Cpu,
  GraduationCap,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Course, GradeItem, User, Classroom } from '../../types';
import { generateTeacherWorkloadPDF, generateCourseGradeActPDF } from '../../utils/pdfExport';

interface TeacherDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  activeTab = 'dashboard',
  onTabChange
}) => {
  const {
    currentUser,
    courses,
    grades,
    classrooms,
    updateGrade,
    sendBroadcastNotification,
    getTeacherCourses,
    activeTerm
  } = useApp();

  const teacherCourses = getTeacherCourses(currentUser.id);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    teacherCourses[0]?.id || ''
  );

  // Filters & searches
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedModalityFilter, setSelectedModalityFilter] = useState<string>('all');

  // Roster modal state
  const [rosterModalCourse, setRosterModalCourse] = useState<Course | null>(null);

  // Notice broadcast form state
  const [noticeTargetCourseId, setNoticeTargetCourseId] = useState<string>(
    teacherCourses[0]?.id || 'all'
  );
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeSuccess, setNoticeSuccess] = useState(false);

  // Local state for grade & attendance editing
  const [editingGrades, setEditingGrades] = useState<Record<string, GradeItem>>({});

  // Active course selected for grading
  const selectedCourse = courses.find(c => c.id === selectedCourseId) || teacherCourses[0];
  const courseGrades = grades.filter(g => g.courseId === selectedCourse?.id);

  // Filtered student grades by search
  const filteredGrades = courseGrades.filter(g =>
    g.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    g.studentCode.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Total teaching hours calculation
  const totalWeeklyHours = teacherCourses.reduce((acc, c) => {
    return acc + (c.horasPorSemana || c.schedules.length * 2 || 4);
  }, 0);

  const totalEnrolledStudents = teacherCourses.reduce((acc, c) => acc + c.enrolledCount, 0);

  // Filtered teacher courses for "Mis Cursos Asignados" view
  const filteredTeacherCourses = teacherCourses.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
      (c.specialty && c.specialty.toLowerCase().includes(courseSearchTerm.toLowerCase())) ||
      c.department.toLowerCase().includes(courseSearchTerm.toLowerCase());

    const matchesModality = selectedModalityFilter === 'all' || c.modality === selectedModalityFilter;
    return matchesSearch && matchesModality;
  });

  // Handle grade changes
  const handleGradeChange = (gradeId: string, field: keyof GradeItem, value: any) => {
    const existing = editingGrades[gradeId] || courseGrades.find(g => g.id === gradeId);
    if (!existing) return;

    let numVal = typeof value === 'number' ? value : Number(value);
    if (field !== 'asistencia' && (field.toString().startsWith('evaluacion') || field === 'parcial1' || field === 'parcial2' || field === 'practicas' || field === 'examenFinal')) {
      if (numVal < 0) numVal = 0;
      if (numVal > 20) numVal = 20;
    }

    const updated = { ...existing, [field]: numVal };

    // Synchronize evaluacion1..4 with legacy fields
    if (field === 'evaluacion1' || field === 'parcial1') {
      updated.evaluacion1 = numVal;
      updated.parcial1 = numVal;
    }
    if (field === 'evaluacion2' || field === 'parcial2') {
      updated.evaluacion2 = numVal;
      updated.parcial2 = numVal;
    }
    if (field === 'evaluacion3' || field === 'practicas') {
      updated.evaluacion3 = numVal;
      updated.practicas = numVal;
    }
    if (field === 'evaluacion4' || field === 'examenFinal') {
      updated.evaluacion4 = numVal;
      updated.examenFinal = numVal;
    }

    const e1 = Number(updated.evaluacion1 ?? updated.parcial1) || 0;
    const e2 = Number(updated.evaluacion2 ?? updated.parcial2) || 0;
    const e3 = Number(updated.evaluacion3 ?? updated.practicas) || 0;
    const e4 = Number(updated.evaluacion4 ?? updated.examenFinal) || 0;

    const computedFinal = Number(((e1 + e2 + e3 + e4) / 4).toFixed(1));
    updated.finalGrade = computedFinal;
    if (e1 > 0 || e2 > 0 || e3 > 0 || e4 > 0) {
      updated.status = computedFinal >= 10 ? 'Aprobado' : 'Reprobado';
    }

    setEditingGrades(prev => ({ ...prev, [gradeId]: updated }));
  };

  const handleSaveGrades = (gradeId: string) => {
    const itemToSave = editingGrades[gradeId];
    if (itemToSave) {
      updateGrade(itemToSave);
      setEditingGrades(prev => {
        const copy = { ...prev };
        delete copy[gradeId];
        return copy;
      });
    }
  };

  const handleSaveAllGrades = () => {
    Object.values(editingGrades).forEach(item => {
      updateGrade(item);
    });
    setEditingGrades({});
  };

  const handleSetAllAttendance = (percentage: number) => {
    courseGrades.forEach(g => {
      handleGradeChange(g.id, 'asistencia', percentage);
    });
  };

  const handleSendNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMessage.trim()) return;

    const targetCourse = courses.find(c => c.id === noticeTargetCourseId);
    const scopeCode = targetCourse ? targetCourse.code : 'DOCENCIA';

    sendBroadcastNotification(
      `📢 Aviso del Docente: ${noticeTitle}`,
      `${noticeMessage} ${targetCourse ? `(Curso: ${targetCourse.name})` : ''}`,
      'student',
      'announcement',
      scopeCode
    );

    setNoticeTitle('');
    setNoticeMessage('');
    setNoticeSuccess(true);
    setTimeout(() => setNoticeSuccess(false), 4000);
  };

  const navigateToGradesForCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (onTabChange) {
      onTabChange('grades');
    }
  };

  // Metrics for selected course
  const totalEnrolled = courseGrades.length;
  const approvedCount = courseGrades.filter(g => g.finalGrade >= 10 || g.status === 'Aprobado').length;
  const averageGrade = totalEnrolled > 0
    ? (courseGrades.reduce((sum, g) => sum + g.finalGrade, 0) / totalEnrolled).toFixed(1)
    : '0.0';
  const averageAttendance = totalEnrolled > 0
    ? Math.round(courseGrades.reduce((sum, g) => sum + g.asistencia, 0) / totalEnrolled)
    : 0;

  // Infrastructure & Classrooms assigned to this teacher
  const assignedClassrooms = classrooms.filter(cls =>
    teacherCourses.some(c => c.schedules.some(s => s.classroomId === cls.id || s.classroomName === cls.name))
  );

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const timeSlots = [
    { start: '07:00', end: '08:30', label: '07:00 - 08:30' },
    { start: '08:30', end: '10:00', label: '08:30 - 10:00' },
    { start: '10:00', end: '11:30', label: '10:00 - 11:30' },
    { start: '11:30', end: '13:00', label: '11:30 - 13:00' },
    { start: '13:00', end: '14:30', label: '13:00 - 14:30' },
    { start: '14:30', end: '16:00', label: '14:30 - 16:00' },
    { start: '16:00', end: '17:30', label: '16:00 - 17:30' },
    { start: '17:30', end: '19:00', label: '17:30 - 19:00' },
    { start: '19:00', end: '20:30', label: '19:00 - 20:30' },
  ];

  /* -------------------------------------------------------------
     VIEW 1: MIS CURSOS ASIGNADOS (activeTab === 'dashboard')
  ------------------------------------------------------------- */
  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
                <Sparkles className="w-3.5 h-3.5 text-sky-200" /> Cursos a Cargo • Especialidad: {currentUser.specialty || 'Ingeniería de Sistemas y Software'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Mis Cursos Asignados
              </h2>
              <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
                Profesor: <strong className="text-white">{currentUser.name}</strong> • Cédula: <strong className="text-white font-mono">{currentUser.cedula || currentUser.code}</strong> • {currentUser.department}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
              <div className="text-right">
                <div className="text-[11px] text-sky-100 uppercase font-bold tracking-wider">Cursos Asignados</div>
                <div className="text-xl font-black text-white">{teacherCourses.length} Secciones</div>
              </div>
              <div className="h-8 w-px bg-white/25" />
              <div className="text-right">
                <div className="text-[11px] text-sky-100 uppercase font-bold tracking-wider">Total Alumnos</div>
                <div className="text-xl font-black text-emerald-300">{totalEnrolledStudents} Matriculados</div>
              </div>
              <div className="h-8 w-px bg-white/25" />
              <div className="text-right">
                <div className="text-[11px] text-sky-100 uppercase font-bold tracking-wider">Carga Horaria</div>
                <div className="text-xl font-black text-amber-300">{totalWeeklyHours} h/sem</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar for Assigned Courses */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, nombre del curso, área o especialidad..."
              value={courseSearchTerm}
              onChange={e => setCourseSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modalidad:</span>
            {['all', 'Presencial', 'Virtual', 'Híbrida'].map(mod => (
              <button
                key={mod}
                onClick={() => setSelectedModalityFilter(mod)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedModalityFilter === mod
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {mod === 'all' ? 'Todas' : mod}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {filteredTeacherCourses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No se encontraron cursos asignados</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No hay cursos que coincidan con la búsqueda o aún no tienes asignaturas registradas para este período académico.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTeacherCourses.map(course => {
              const enrolled = course.enrolledCount;
              const hasQuorum = enrolled >= 3;
              const progressPercent = Math.min(
                100,
                Math.round(((course.currentWeek || 1) / (course.syllabusWeeks || 16)) * 100)
              );
              const cGrades = grades.filter(g => g.courseId === course.id);

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    {/* Header: Code, Section & Modality */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-extrabold text-xs">
                          {course.code}
                        </span>
                        {course.codigo_seccion && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                            {course.codigo_seccion}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        course.modality === 'Virtual'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : course.modality === 'Híbrida'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {course.modality}
                      </span>
                    </div>

                    {/* Course Title */}
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {course.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {course.department} {course.specialty ? `• ${course.specialty}` : ''}
                      </p>
                    </div>

                    {/* Quorum & Enrolled Stats */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-600" /> Matrícula Actual:
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {enrolled} / {course.capacity} alumnos
                        </span>
                      </div>

                      {/* Quorum Pill */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                        <span className="text-slate-400">Estado de Quórum:</span>
                        <span className={`font-bold ${hasQuorum ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {hasQuorum ? 'Quórum Activo (≥3 ✓)' : 'En Espera de Quórum'}
                        </span>
                      </div>
                    </div>

                    {/* Dates & Syllabus Progress */}
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{course.startDate || '01/09/2026'} - {course.endDate || '18/12/2026'}</span>
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Semana {course.currentWeek || 1}/{course.syllabusWeeks || 16}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Schedule & Classrooms */}
                    <div className="text-xs space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horario & Aula:</span>
                      {course.schedules.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">Sin horario programado</span>
                      ) : (
                        course.schedules.map(sch => (
                          <div key={sch.id} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">{sch.dayOfWeek} {sch.startTime} - {sch.endTime}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                              {sch.classroomName}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRosterModalCourse(course)}
                        className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" /> Ver Alumnos ({enrolled})
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateToGradesForCourse(course.id)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Award className="w-3.5 h-3.5" /> Registrar Notas
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => generateCourseGradeActPDF(course, cGrades)}
                      className="w-full px-3 py-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-[#FF6600] border border-orange-200/60 dark:border-orange-800/60 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> Descargar Acta Oficial (PDF)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Broadcast Announcement Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Emitir Aviso en Tiempo Real a Alumnos
              </h3>
              <p className="text-xs text-slate-500">
                Envía una notificación instantánea que aparecerá de inmediato a los estudiantes inscritos.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendNotice} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Curso Destinatario
                </label>
                <select
                  value={noticeTargetCourseId}
                  onChange={e => setNoticeTargetCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">📢 Todos mis cursos asignados</option>
                  {teacherCourses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name} ({c.enrolledCount} alum.)
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Título del Comunicado
                </label>
                <input
                  type="text"
                  placeholder="Ej. Publicación de pautas para el examen final o entrega de proyecto..."
                  value={noticeTitle}
                  onChange={e => setNoticeTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Mensaje Detallado
              </label>
              <textarea
                rows={3}
                placeholder="Escribe el mensaje formal para los alumnos..."
                value={noticeMessage}
                onChange={e => setNoticeMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {noticeSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Notificación emitida en tiempo real con éxito a todos los estudiantes destinatarios.</span>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" /> Emitir Notificación
            </button>
          </form>
        </div>

        {/* Modal: Ver Alumnos Matriculados en Curso */}
        {rosterModalCourse && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold">
                      {rosterModalCourse.code}
                    </span>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {rosterModalCourse.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lista Oficial de Estudiantes Matriculados ({grades.filter(g => g.courseId === rosterModalCourse.id).length} alumnos)
                  </p>
                </div>
                <button
                  onClick={() => setRosterModalCourse(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                {grades.filter(g => g.courseId === rosterModalCourse.id).length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No hay alumnos inscritos aún en este curso.</p>
                    <p className="text-xs text-slate-500 mt-1">Aparecerán automáticamente una vez se formalice la matrícula.</p>
                  </div>
                ) : (
                  grades
                    .filter(g => g.courseId === rosterModalCourse.id)
                    .map((item, idx) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{item.studentName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">Código: {item.studentCode}</p>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Asistencia:</span>
                            <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{item.asistencia}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Nota Final:</span>
                            <span className={`font-mono font-black text-xs ${item.finalGrade >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.finalGrade} / 20
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Aprobado'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : item.status === 'Reprobado'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {item.status || 'En Cursado'}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const c = rosterModalCourse;
                    setRosterModalCourse(null);
                    navigateToGradesForCourse(c.id);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Award className="w-4 h-4" /> Ir a Registrar Notas de este Curso
                </button>
                <button
                  type="button"
                  onClick={() => setRosterModalCourse(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* -------------------------------------------------------------
     VIEW 2: REGISTRO DE NOTAS (activeTab === 'grades')
  ------------------------------------------------------------- */
  if (activeTab === 'grades') {
    return (
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
                <Award className="w-3.5 h-3.5 text-sky-200" /> Sistema Vigesimal (1 a 20 pts) • Período: {activeTerm}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Registro y Carga de Notas
              </h2>
              <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
                Selecciona uno de tus cursos asignados para visualizar y registrar las calificaciones continuas y el porcentaje de asistencia de los estudiantes matriculados.
              </p>
            </div>

            {selectedCourse && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateCourseGradeActPDF(selectedCourse, courseGrades)}
                  className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition shadow-lg cursor-pointer"
                  title="Descargar Acta Oficial de Calificaciones en PDF"
                >
                  <FileText className="w-4 h-4" /> Generar Acta Oficial (PDF)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Course Selector Tabs / Strip */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" /> Selecciona el Curso Asignado para Cargar Notas:
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {teacherCourses.length} {teacherCourses.length === 1 ? 'curso disponible' : 'cursos disponibles'}
            </span>
          </div>

          {teacherCourses.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 text-center text-xs">
              No tienes asignaturas a cargo en este período para cargar calificaciones.
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {teacherCourses.map(course => {
                const isSelected = selectedCourse?.id === course.id;
                const cGrades = grades.filter(g => g.courseId === course.id);

                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`p-3 rounded-2xl border text-left transition-all shrink-0 cursor-pointer min-w-[220px] max-w-[320px] ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-400'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`px-2 py-0.5 rounded font-mono font-extrabold text-[11px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}>
                        {course.code}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
                      }`}>
                        {cGrades.length} alumnos
                      </span>
                    </div>
                    <p className="font-bold text-xs line-clamp-1 leading-snug">{course.name}</p>
                    <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {course.specialty || course.department}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Course Grading Workspace */}
        {selectedCourse ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            {/* Header & Course Info */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                    {selectedCourse.code} • {selectedCourse.department}
                  </span>
                  <span className="text-xs text-slate-400">
                    {selectedCourse.modality} • {selectedCourse.duracion || activeTerm}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedCourse.name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <strong>Período:</strong> {selectedCourse.startDate || '01/09/2026'} al {selectedCourse.endDate || '18/12/2026'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>Inscritos:</strong> {totalEnrolled} de {selectedCourse.capacity} cupos
                  </span>
                  <span>•</span>
                  <span><strong>Especialidad:</strong> {selectedCourse.specialty || currentUser.specialty}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {Object.keys(editingGrades).length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveAllGrades}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Guardar Todo ({Object.keys(editingGrades).length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSetAllAttendance(100)}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
                  title="Poner 100% de asistencia a todos los alumnos del curso"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" /> 100% Asistencia
                </button>
              </div>
            </div>

            {/* Quick Metrics of Course */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-600" /> Alumnos Matriculados
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {totalEnrolled} <span className="text-xs font-normal text-slate-400">/ {selectedCourse.capacity} max</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Promedio del Curso
                </div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {averageGrade} <span className="text-xs font-normal text-slate-400">pts</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-blue-600" /> Asistencia Promedio
                </div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {averageAttendance}%
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-purple-600" /> Tasa de Aprobación
                </div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {totalEnrolled > 0 ? `${Math.round((approvedCount / totalEnrolled) * 100)}%` : '0%'}
                  <span className="text-xs font-normal text-slate-400 ml-1">({approvedCount}/{totalEnrolled})</span>
                </div>
              </div>
            </div>

            {/* Search bar inside course */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar alumno por nombre o código..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-xl border border-sky-100 dark:border-sky-900/50 flex items-center gap-2">
                <span className="font-bold text-sky-700 dark:text-sky-300">Escala 1 al 20:</span>
                <code className="text-sky-800 dark:text-sky-200 font-mono font-bold">4 Evaluaciones (25% c/u) • Mínimo Aprobatorio: 10 pts</code>
              </div>
            </div>

            {/* Grades & Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-3 py-3 rounded-l-xl">Estudiante Matriculado</th>
                    <th className="px-2 py-3 text-center">Eval 1 (25%)</th>
                    <th className="px-2 py-3 text-center">Eval 2 (25%)</th>
                    <th className="px-2 py-3 text-center">Eval 3 (25%)</th>
                    <th className="px-2 py-3 text-center">Eval 4 (25%)</th>
                    <th className="px-3 py-3 text-center">Asistencia %</th>
                    <th className="px-3 py-3 text-center font-bold">Nota Final (1-20)</th>
                    <th className="px-3 py-3 text-center">Estado</th>
                    <th className="px-3 py-3 text-center rounded-r-xl">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredGrades.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-400">
                        <p className="font-semibold text-sm">No se encontraron estudiantes en este curso.</p>
                        <p className="text-xs mt-1 text-slate-500">
                          Los estudiantes que se matriculen en este curso aparecerán automáticamente aquí.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredGrades.map(grade => {
                      const currentGrade = editingGrades[grade.id] || grade;
                      const isDirty = !!editingGrades[grade.id];
                      const e1 = currentGrade.evaluacion1 ?? currentGrade.parcial1 ?? 0;
                      const e2 = currentGrade.evaluacion2 ?? currentGrade.parcial2 ?? 0;
                      const e3 = currentGrade.evaluacion3 ?? currentGrade.practicas ?? 0;
                      const e4 = currentGrade.evaluacion4 ?? currentGrade.examenFinal ?? 0;

                      return (
                        <tr key={grade.id} className={isDirty ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}>
                          <td className="px-3 py-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{grade.studentName}</div>
                            <span className="text-[10px] font-mono text-slate-400">{grade.studentCode}</span>
                          </td>

                          {/* Evaluación 1 */}
                          <td className="px-2 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={e1}
                              onChange={e => handleGradeChange(grade.id, 'evaluacion1', Number(e.target.value))}
                              className="w-14 text-center font-mono py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                              placeholder="0-20"
                            />
                          </td>

                          {/* Evaluación 2 */}
                          <td className="px-2 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={e2}
                              onChange={e => handleGradeChange(grade.id, 'evaluacion2', Number(e.target.value))}
                              className="w-14 text-center font-mono py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                              placeholder="0-20"
                            />
                          </td>

                          {/* Evaluación 3 */}
                          <td className="px-2 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={e3}
                              onChange={e => handleGradeChange(grade.id, 'evaluacion3', Number(e.target.value))}
                              className="w-14 text-center font-mono py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                              placeholder="0-20"
                            />
                          </td>

                          {/* Evaluación 4 */}
                          <td className="px-2 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={e4}
                              onChange={e => handleGradeChange(grade.id, 'evaluacion4', Number(e.target.value))}
                              className="w-14 text-center font-mono py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                              placeholder="0-20"
                            />
                          </td>

                          {/* Asistencia con controles rápidos */}
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleGradeChange(grade.id, 'asistencia', Math.max(0, currentGrade.asistencia - 5))}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold cursor-pointer"
                                title="Restar 5%"
                              >
                                -5
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={currentGrade.asistencia}
                                onChange={e => handleGradeChange(grade.id, 'asistencia', Number(e.target.value))}
                                className="w-14 text-center font-mono py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                              />
                              <button
                                type="button"
                                onClick={() => handleGradeChange(grade.id, 'asistencia', Math.min(100, currentGrade.asistencia + 5))}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold cursor-pointer"
                                title="Sumar 5%"
                              >
                                +5
                              </button>
                            </div>
                            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 ${
                              currentGrade.asistencia >= 85
                                ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : currentGrade.asistencia >= 75
                                ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}>
                              {currentGrade.asistencia >= 75 ? 'Asistencia Regular' : 'Riesgo Inasistencia'}
                            </span>
                          </td>

                          {/* Computed Final */}
                          <td className="px-3 py-3 text-center font-mono font-black text-sm">
                            <span className={currentGrade.finalGrade >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {currentGrade.finalGrade} <span className="text-[10px] text-slate-400 font-normal">/ 20</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              currentGrade.status === 'Aprobado' || currentGrade.finalGrade >= 10
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : currentGrade.status === 'Reprobado' || (currentGrade.finalGrade > 0 && currentGrade.finalGrade < 10)
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {currentGrade.finalGrade >= 10 ? 'Aprobado' : (currentGrade.finalGrade > 0 ? 'Reprobado' : 'En Cursado')}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleSaveGrades(grade.id)}
                              disabled={!isDirty}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                isDirty
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 cursor-not-allowed'
                              }`}
                            >
                              {isDirty ? 'Guardar' : 'Al día'}
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
        ) : null}
      </div>
    );
  }

  /* -------------------------------------------------------------
     VIEW 3: HORARIO E INFRAESTRUCTURA (activeTab === 'schedule')
  ------------------------------------------------------------- */
  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
              <CalendarDays className="w-3.5 h-3.5 text-sky-200" /> Distribución Horaria & Espacios Académicos
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Horario Semanal e Infraestructura
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
              Consulta la programación semanal de tus clases, las aulas y laboratorios asignados con su equipamiento técnico institucional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => generateTeacherWorkloadPDF(currentUser, teacherCourses, activeTerm)}
              className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition shadow-lg cursor-pointer"
              title="Descargar Horario y Carga Docente Oficial en PDF"
            >
              <Download className="w-4 h-4" /> Horario y Carga Docente (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Carga Semanal</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalWeeklyHours} h</p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">Horas de Cátedra</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cursos / Secciones</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{teacherCourses.length}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Activas en Dictado</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Espacios Asignados</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{assignedClassrooms.length}</p>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">Aulas y Laboratorios</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Alumnos a Cargo</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalEnrolledStudents}</p>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">Matriculados Totales</p>
        </div>
      </div>

      {/* Weekly Visual Timetable Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" /> Matriz Semanal de Cátedras
          </h3>
          <span className="text-xs text-slate-400">Días: Lunes a Sábado</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {daysOfWeek.map(day => {
            // Find all classes assigned on this day for this teacher
            const dayClasses = teacherCourses.flatMap(c =>
              c.schedules
                .filter(s => s.dayOfWeek === day)
                .map(s => ({ course: c, schedule: s }))
            );

            return (
              <div
                key={day}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/80 flex flex-col space-y-2.5 min-h-[180px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">{day}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    dayClasses.length > 0
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    {dayClasses.length} {dayClasses.length === 1 ? 'clase' : 'clases'}
                  </span>
                </div>

                {dayClasses.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center py-6 text-slate-300 dark:text-slate-600 text-xs italic">
                    Sin clases programadas
                  </div>
                ) : (
                  <div className="space-y-2 flex-1">
                    {dayClasses.map(({ course, schedule }) => (
                      <div
                        key={`${course.id}-${schedule.id}`}
                        className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-blue-200/80 dark:border-blue-900/60 shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                          <span className="font-bold text-slate-500 font-mono">{course.code}</span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs leading-tight line-clamp-2">
                          {course.name}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
                          <span className="flex items-center gap-1 truncate">
                            <Building2 className="w-2.5 h-2.5 text-slate-400" /> {schedule.classroomName}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{course.modality}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Assigned Physical Infrastructure & Classrooms */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Infraestructura y Aulas Físicas Asignadas
              </h3>
              <p className="text-xs text-slate-500">
                Recintos, laboratorios y recursos tecnológicos donde impartes tus materias
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-xl">
            {assignedClassrooms.length} recintos activos
          </span>
        </div>

        {assignedClassrooms.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No hay aulas físicas asignadas para tus materias aún.</p>
            <p className="text-xs text-slate-500 mt-1">Si tus cursos son de modalidad virtual o están pendientes de asignación de aula física por el administrador, aparecerán aquí una vez programados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedClassrooms.map(cls => {
              // Scheds of this teacher in this classroom
              const matchedSchedules = teacherCourses.flatMap(c =>
                c.schedules
                  .filter(s => s.classroomId === cls.id || s.classroomName === cls.name)
                  .map(s => ({ course: c, schedule: s }))
              );

              return (
                <div
                  key={cls.id}
                  className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                        {cls.code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Aforo: {cls.capacity} pers.
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {cls.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {cls.building} • Piso {cls.floor} • Tipo: <strong className="text-slate-700 dark:text-slate-300">{cls.type}</strong>
                      </p>
                    </div>

                    {/* Resources */}
                    {cls.resources && cls.resources.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cls.resources.map(res => (
                          <span
                            key={res}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium border border-slate-200/60 dark:border-slate-700/60"
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Scheduled Classes */}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tus Clases en este Recinto:</span>
                    {matchedSchedules.map(({ course, schedule }) => (
                      <div key={`${course.id}-${schedule.id}`} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="font-bold">{schedule.dayOfWeek} {schedule.startTime}-{schedule.endTime}</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400 truncate max-w-[120px]" title={course.name}>
                          {course.code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
