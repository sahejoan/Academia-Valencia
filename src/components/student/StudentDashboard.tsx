import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Search,
  UserCheck,
  Building,
  Check,
  Sparkles,
  Compass,
  GraduationCap,
  CalendarDays,
  ListFilter,
  Layers,
  FileText,
  HelpCircle,
  MapPin
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateStudentTranscriptPDF, generateSchedulePDF } from '../../utils/pdfExport';
import { checkStudentScheduleConflict } from '../../utils/conflictDetector';
import {
  getCourseAreaName,
  getCourseAreaBadgeClasses,
  courseMatchesAreaFilter
} from '../../utils/areaHelpers';
import { formatDecimal, formatGrade } from '../../utils/gradeHelpers';

interface StudentDashboardProps {
  activeTab: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab }) => {
  const {
    currentUser,
    courses,
    enrollCourse,
    dropEnrollment,
    getStudentEnrollments,
    getStudentGrades,
    getStudentCourses
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState<'all' | 'passing' | 'risk'>('all');
  const [scheduleViewMode, setScheduleViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');

  const studentEnrollments = getStudentEnrollments(currentUser.id);
  const studentGrades = getStudentGrades(currentUser.id);
  const studentCourses = getStudentCourses(currentUser.id);

  // Compute student summary metrics
  const totalCredits = studentCourses.reduce((acc, c) => acc + (c.credits || 0), 0);
  const validGrades = studentGrades.filter(g => g.finalGrade > 0);
  const gpa = validGrades.length > 0
    ? formatDecimal(validGrades.reduce((acc, g) => acc + g.finalGrade, 0) / validGrades.length, 1, false)
    : 'N/A';
  
  const avgAttendance = studentGrades.length > 0
    ? (studentGrades.reduce((acc, g) => acc + (g.asistencia || 100), 0) / studentGrades.length).toFixed(0)
    : '100';

  const approvedCoursesCount = studentGrades.filter(g => g.finalGrade >= 10 || g.status === 'Aprobado').length;
  const inProgressCoursesCount = studentCourses.length;

  // Filter offered courses for enrollment
  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.specialty && course.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.department && course.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      course.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = courseMatchesAreaFilter(course, departmentFilter);
    return matchesSearch && matchesDept;
  });

  const areaFilterOptions = [
    { key: 'all', label: `Todas las Áreas (${courses.length})` },
    { key: 'COMERCIAL', label: `Área Comercial (${courses.filter(c => courseMatchesAreaFilter(c, 'COMERCIAL')).length})` },
    { key: 'INDUSTRIAL', label: `Área Industrial (${courses.filter(c => courseMatchesAreaFilter(c, 'INDUSTRIAL')).length})` },
    { key: 'GERENCIAL', label: `Área Gerencial (${courses.filter(c => courseMatchesAreaFilter(c, 'GERENCIAL')).length})` },
    { key: 'ARTESANAL', label: `Área Artesanal (${courses.filter(c => courseMatchesAreaFilter(c, 'ARTESANAL')).length})` }
  ];

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // All student class sessions
  const allStudentClasses = studentCourses.flatMap(c =>
    (c.schedules || []).map(s => ({
      ...s,
      courseId: c.id,
      courseName: c.name,
      courseCode: c.code,
      teacher: c.teacherName,
      modality: c.modality,
      credits: c.credits,
      classroom: s.classroomName
    }))
  );

  // Total weekly hours
  const totalWeeklyHours = studentCourses.reduce((acc, c) => acc + (c.horasPorSemana || 4), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* VISTA 1: RESUMEN PRINCIPAL (DASHBOARD)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <>
          {/* Welcome Hero Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
                  <Sparkles className="w-3.5 h-3.5 text-sky-200" /> Portal del Estudiante • Período 2026-I
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  ¡Hola, {currentUser.name}!
                </h2>
                <p className="text-xs sm:text-sm text-sky-100 max-w-xl leading-relaxed">
                  {currentUser.career} • {currentUser.semester}° Semestre • Matrícula: <strong className="text-white font-mono">{currentUser.code}</strong>
                </p>
              </div>

              <div className="relative z-10 flex flex-wrap gap-3">
                <button
                  onClick={() => generateStudentTranscriptPDF(currentUser, studentGrades)}
                  className="px-5 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Certificado de Notas PDF</span>
                </button>
                <button
                  onClick={() => generateSchedulePDF(currentUser, studentEnrollments, courses)}
                  className="px-4 py-3 bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-2xl text-xs sm:text-sm font-bold backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Calendar className="w-4 h-4" /> Mi Horario PDF
                </button>
              </div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Promedio Ponderado</span>
                <Award className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{gpa} <span className="text-xs text-slate-400 font-normal">/20 pts</span></div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {gpa !== 'N/A' && Number(gpa.replace(',', '.')) >= 10 ? 'Rendimiento Aprobatorio (≥ 10)' : 'Seguimiento Académico'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Asignaturas en Curso</span>
                <BookOpen className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{studentCourses.length}</div>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                {studentCourses.length === 1 ? '1 Curso Activo' : `${studentCourses.length} Cursos Activos`}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Asistencia Promedio</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{avgAttendance}%</div>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                {Number(avgAttendance) >= 75 ? 'Cumplimiento Oficial' : 'Riesgo por Inasistencia'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Créditos Inscritos</span>
                <GraduationCap className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalCredits} UC</div>
              <p className="text-[11px] text-slate-400 mt-1">Semestre 2026-I al día</p>
            </div>
          </div>

          {/* DETAILED PROGRESS OF ENROLLED COURSES */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    {studentCourses.length} Asignaturas
                  </span>
                  <span className="text-xs text-slate-400">• Fechas, Avance de Syllabus y Rendimiento</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
                  <Compass className="w-5 h-5 text-indigo-600" /> Progreso de Cursos en Realización
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Seguimiento del cronograma académico, avance semanal de contenidos y registro de asistencia.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">Filtrar:</span>
                <button
                  onClick={() => setProgressFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    progressFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Todos ({studentCourses.length})
                </button>
                <button
                  onClick={() => setProgressFilter('passing')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    progressFilter === 'passing'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Aprobando
                </button>
                <button
                  onClick={() => setProgressFilter('risk')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    progressFilter === 'risk'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  En Riesgo
                </button>
              </div>
            </div>

            {studentCourses.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No tienes asignaturas inscritas en este período.</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Accede a la pestaña de "Inscripción Cursos" en el menú lateral para matricularte en las asignaturas disponibles.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentCourses
                  .filter(course => {
                    const grade = studentGrades.find(g => g.courseId === course.id);
                    if (progressFilter === 'passing') return grade && (grade.finalGrade >= 10 || grade.status === 'Aprobado');
                    if (progressFilter === 'risk') return grade && ((grade.finalGrade > 0 && grade.finalGrade < 10) || grade.asistencia < 75);
                    return true;
                  })
                  .map(course => {
                    const grade = studentGrades.find(g => g.courseId === course.id);
                    const currentWk = course.currentWeek || 9;
                    const totalWk = course.syllabusWeeks || 16;
                    const progressPct = Math.min(100, Math.round((currentWk / totalWk) * 100));
                    const attendancePct = grade ? grade.asistencia : 100;

                    return (
                      <div
                        key={course.id}
                        className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900/90 shadow-sm flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {course.code}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              grade?.status === 'Aprobado' || (grade && grade.finalGrade >= 10)
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : (grade && grade.finalGrade > 0 && grade.finalGrade < 10)
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {grade ? (grade.finalGrade >= 10 ? 'Aprobado' : (grade.finalGrade > 0 ? 'Reprobado' : 'En Curso')) : 'En Curso'}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {course.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Docente: {course.teacherName}
                          </p>

                          {/* Progress bar */}
                          <div className="mt-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                              <span className="flex items-center gap-1 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Inicio: {course.startDate || '02/03/2026'}
                              </span>
                              <span className="font-medium text-slate-500">
                                Fin: {course.endDate || '26/06/2026'}
                              </span>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] mb-1 font-semibold">
                                <span className="text-slate-600 dark:text-slate-400">
                                  Avance del Syllabus (Semana {currentWk} de {totalWk})
                                </span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progressPct}%</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-600 rounded-full transition-all"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Schedule info footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            {course.schedules?.map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join(', ') || 'Horario por asignar'}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {course.schedules?.[0]?.classroomName || 'Aula Virtual'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        </>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: MIS CALIFICACIONES (GRADES)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'grades' && (
        <section className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-600/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-emerald-100 mb-2">
                <Award className="w-3.5 h-3.5 text-emerald-200" /> Registro y Récord Académico
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">Mis Calificaciones Oficiales</h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl leading-relaxed">
                Evaluaciones parciales correspondientes a los 4 cortes del 25% c/u, nota final sobre escala vigesimal (1 al 20) y cálculo de promedio.
              </p>
            </div>

            <button
              onClick={() => generateStudentTranscriptPDF(currentUser, studentGrades)}
              className="px-5 py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Descargar Certificado PDF</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Promedio Ponderado</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{gpa} <span className="text-xs text-slate-400 font-normal">/20</span></div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Asignaturas Aprobadas</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{approvedCoursesCount}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Asignaturas en Curso</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{inProgressCoursesCount}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Créditos Acumulados</span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{totalCredits} UC</div>
            </div>
          </div>

          {/* Detailed Grades Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> Detalle de Evaluaciones por Asignatura
              </h3>
              <span className="text-xs text-slate-500 font-mono">Escala Vigesimal 0 - 20 pts (Mínimo Aprobatorio: 10 pts)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">Código</th>
                    <th className="px-4 py-3">Asignatura y Docente</th>
                    <th className="px-3 py-3 text-center">Corte 1 (25%)</th>
                    <th className="px-3 py-3 text-center">Corte 2 (25%)</th>
                    <th className="px-3 py-3 text-center">Corte 3 (25%)</th>
                    <th className="px-3 py-3 text-center">Corte 4 (25%)</th>
                    <th className="px-3 py-3 text-center">Asistencia</th>
                    <th className="px-4 py-3 text-center font-bold">Nota Final</th>
                    <th className="px-4 py-3 text-center rounded-r-xl">Condición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentGrades.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        No hay registro de calificaciones disponible para el período actual.
                      </td>
                    </tr>
                  ) : (
                    studentGrades.map(grade => {
                      const finalScore = grade.finalGrade || grade.notaFinal || 0;
                      const isPassing = finalScore >= 10;

                      return (
                        <tr key={grade.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {grade.courseCode}
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{grade.courseName}</div>
                            {grade.feedback && (
                              <p className="text-[11px] text-slate-500 italic mt-0.5">
                                Observación: "{grade.feedback}"
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-4 text-center font-mono font-semibold">
                            {formatGrade(grade.evaluacion1 ?? grade.parcial1)}
                          </td>
                          <td className="px-3 py-4 text-center font-mono font-semibold">
                            {formatGrade(grade.evaluacion2 ?? grade.parcial2)}
                          </td>
                          <td className="px-3 py-4 text-center font-mono font-semibold">
                            {formatGrade(grade.evaluacion3 ?? grade.practicas)}
                          </td>
                          <td className="px-3 py-4 text-center font-mono font-semibold">
                            {formatGrade(grade.evaluacion4 ?? grade.examenFinal)}
                          </td>
                          <td className="px-3 py-4 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              (grade.asistencia || 100) >= 75
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}>
                              {grade.asistencia || 100}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg ${
                              isPassing
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : finalScore > 0
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {formatGrade(finalScore)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isPassing
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : finalScore > 0
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {isPassing ? 'Aprobado' : (finalScore > 0 ? 'Reprobado' : 'En Curso')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: MI HORARIO SEMANAL (SCHEDULE)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <section className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-blue-100 mb-2">
                <CalendarDays className="w-3.5 h-3.5 text-blue-200" /> Planificación Semanal
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">Mi Horario Semanal de Clases</h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl leading-relaxed">
                Distribución de tus asignaturas inscritas por día, franja horaria, aulas físicas y laboratorios correspondientes al período 2026-I.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => generateSchedulePDF(currentUser, studentEnrollments, courses)}
                className="px-5 py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Descargar Horario PDF</span>
              </button>
            </div>
          </div>

          {/* Quick Schedule Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Asignaturas con Horario</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{studentCourses.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Carga Horaria Semanal</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{totalWeeklyHours} Horas</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Sesiones Semanales</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{allStudentClasses.length} Bloques</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Modalidad Principal</span>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">Presencial / Híbrida</div>
            </div>
          </div>

          {/* Schedule Controls & Filters */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Vista:</span>
              <button
                onClick={() => setScheduleViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  scheduleViewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Parrilla Semanal
              </button>
              <button
                onClick={() => setScheduleViewMode('list')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  scheduleViewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Agenda por Día
              </button>
            </div>

            {scheduleViewMode === 'list' && (
              <select
                value={selectedDayFilter}
                onChange={e => setSelectedDayFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los Días</option>
                {daysOfWeek.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>

          {/* GRID VIEW (Lunes a Sábado) */}
          {scheduleViewMode === 'grid' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                {daysOfWeek.map(day => {
                  const dayClasses = allStudentClasses.filter(s => s.dayOfWeek === day);

                  return (
                    <div
                      key={day}
                      className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            {day}
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                            {dayClasses.length} {dayClasses.length === 1 ? 'clase' : 'clases'}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {dayClasses.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-[11px] text-slate-400 italic">Libre de clases</p>
                            </div>
                          ) : (
                            dayClasses.map(cls => (
                              <div
                                key={cls.id}
                                className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs hover:border-indigo-400 transition-all space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                    {cls.courseCode}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {cls.modality}
                                  </span>
                                </div>

                                <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                  {cls.courseName}
                                </h5>

                                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {cls.startTime} - {cls.endTime}
                                </p>

                                <div className="pt-1 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-500 space-y-0.5">
                                  <p className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                    <MapPin className="w-3 h-3" /> {cls.classroom || 'Aula por asignar'}
                                  </p>
                                  <p className="flex items-center gap-1 text-slate-500 truncate">
                                    <UserCheck className="w-3 h-3" /> {cls.teacher}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIST VIEW (Agenda Detallada) */}
          {scheduleViewMode === 'list' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              {daysOfWeek
                .filter(d => selectedDayFilter === 'all' || selectedDayFilter === d)
                .map(day => {
                  const dayClasses = allStudentClasses.filter(s => s.dayOfWeek === day);

                  return (
                    <div key={day} className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase">{day}</h4>
                        <span className="text-xs text-slate-400">({dayClasses.length} sesiones)</span>
                      </div>

                      {dayClasses.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">No tienes sesiones de clase programadas para este día.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {dayClasses.map(cls => (
                            <div
                              key={cls.id}
                              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                                    {cls.courseCode}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-500">{cls.modality}</span>
                                </div>
                                <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cls.courseName}</h5>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Docente: {cls.teacher}
                                </p>
                              </div>

                              <div className="text-right shrink-0 space-y-1">
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold font-mono">
                                  <Clock className="w-3.5 h-3.5" /> {cls.startTime} - {cls.endTime}
                                </div>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                                  <MapPin className="w-3.5 h-3.5" /> {cls.classroom || 'Aula Virtual'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: OFERTA ACADÉMICA E INSCRIPCIÓN (ENROLLMENT)                      */}
      {/* ========================================================================= */}
      {activeTab === 'enrollment' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Oferta Académica e Inscripción de Cursos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona cursos para matricularte. El sistema verifica disponibilidad de cupo y evita cruces de horario.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar asignatura o docente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {areaFilterOptions.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Courses Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map(course => {
              const isEnrolled = studentCourses.some(c => c.id === course.id);
              const enrollmentObj = studentEnrollments.find(e => e.courseId === course.id);
              const conflictCheck = checkStudentScheduleConflict(course, studentCourses);
              const isFull = course.enrolledCount >= course.capacity;

              return (
                <div
                  key={course.id}
                  className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                    isEnrolled
                      ? 'border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                          {course.code}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getCourseAreaBadgeClasses(course)}`}>
                          {getCourseAreaName(course)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        course.modality === 'Presencial'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}>
                        {course.modality}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {course.name}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" /> {course.teacherName}
                    </p>

                    {course.specialty && (
                      <span className="inline-block text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Especialidad: {course.specialty}
                      </span>
                    )}

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Schedule List */}
                    <div className="mt-3 space-y-1 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Horarios y Aula
                      </span>
                      {course.schedules?.map(sch => (
                        <div key={sch.id} className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span className="font-medium">{sch.dayOfWeek} {sch.startTime}-{sch.endTime}</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Building className="w-3 h-3" /> {sch.classroomName}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Capacity Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Cupo Ocupado</span>
                        <span className="font-bold">{course.enrolledCount} / {course.capacity}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isFull ? 'bg-red-500' : course.enrolledCount > course.capacity * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (course.enrolledCount / course.capacity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions & Alerts */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {isEnrolled ? (
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-4 h-4" /> Matriculado
                        </span>
                        {enrollmentObj && (
                          <button
                            onClick={() => dropEnrollment(enrollmentObj.id)}
                            className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 font-medium underline cursor-pointer"
                          >
                            Retirar curso
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        {conflictCheck.hasConflict && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {conflictCheck.reason}
                          </p>
                        )}

                        <button
                          onClick={() => enrollCourse(course.id)}
                          disabled={isFull || conflictCheck.hasConflict}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isFull
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                              : conflictCheck.hasConflict
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 opacity-80 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                          }`}
                        >
                          {isFull ? (
                            <>Sin Cupo Disponible</>
                          ) : (
                            <>Inscribirme en Curso</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
