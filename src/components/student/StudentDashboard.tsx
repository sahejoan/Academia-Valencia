import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Search,
  UserCheck,
  Building,
  Check,
  XCircle,
  Sparkles,
  TrendingUp,
  Percent,
  Compass,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import { generateStudentTranscriptPDF, generateSchedulePDF } from '../../utils/pdfExport';
import { checkStudentScheduleConflict } from '../../utils/conflictDetector';

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

  const studentEnrollments = getStudentEnrollments(currentUser.id);
  const studentGrades = getStudentGrades(currentUser.id);
  const studentCourses = getStudentCourses(currentUser.id);

  // Compute student summary metrics
  const totalCredits = studentCourses.reduce((acc, c) => acc + c.credits, 0);
  const validGrades = studentGrades.filter(g => g.finalGrade > 0);
  const gpa = validGrades.length > 0
    ? (validGrades.reduce((acc, g) => acc + g.finalGrade, 0) / validGrades.length).toFixed(1)
    : 'N/A';
  
  const avgAttendance = studentGrades.length > 0
    ? (studentGrades.reduce((acc, g) => acc + g.asistencia, 0) / studentGrades.length).toFixed(0)
    : '100';

  // Filter offered courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.specialty && course.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
      course.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = departmentFilter === 'all' || course.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(courses.map(c => c.department)));

  return (
    <div className="space-y-6 pb-12">
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
            {gpa !== 'N/A' && Number(gpa) >= 10 ? 'Rendimiento Aprobatorio (≥ 10)' : 'Seguimiento Académico'}
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
            <span className="text-xs font-medium">Estado Académico</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Regular / Activo</div>
          <p className="text-[11px] text-slate-400 mt-1">Semestre 2026-1 al día</p>
        </div>
      </div>

      {/* DETAILED PROGRESS OF ENROLLED COURSES (El progreso del curso que esté realizando) */}
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
              <Compass className="w-5 h-5 text-indigo-600" /> Progreso de Cursos en Realización y Notas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seguimiento del cronograma académico, avance semanal de contenidos, registro de calificaciones y asistencia.
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
              En Riesgo / Recuperación
            </button>
          </div>
        </div>

        {studentCourses.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No tienes asignaturas inscritas en este período.</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Revisa la sección de oferta académica a continuación para matricularte en los cursos correspondientes a tu especialidad.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentCourses
              .filter(course => {
                const grade = studentGrades.find(g => g.courseId === course.id);
                if (progressFilter === 'passing') return grade && grade.finalGrade >= 70;
                if (progressFilter === 'risk') return grade && (grade.finalGrade < 70 || grade.asistencia < 75);
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
                      {/* Top Badges */}
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

                      {/* Course Title & Teacher */}
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {course.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Docente: {course.teacherName}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {course.specialty && (
                          <span className="inline-block text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                            {course.specialty}
                          </span>
                        )}
                        {course.horasAcademicas && (
                          <span className="inline-block text-[10px] font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded">
                            ⏳ {course.horasAcademicas}h Académicas
                          </span>
                        )}
                        {course.tamanoContenido && (
                          <span className="inline-block text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                            📚 Contenido {course.tamanoContenido}
                          </span>
                        )}
                      </div>

                      {/* Dates & Timeline Info */}
                      <div className="mt-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Inicio: {course.startDate || '01/09/2026'}
                          </span>
                          <span className="font-medium text-slate-500">
                            Culminación: {course.endDate || '18/12/2026'}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1 font-semibold">
                            <span className="text-slate-600 dark:text-slate-400">
                              Avance del Cronograma (Semana {currentWk} de {totalWk})
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

                      {/* Grades Breakdown Box (4 Evaluaciones 0-20 pts) */}
                      {grade && (
                        <div className="mt-3 grid grid-cols-5 gap-1.5 text-center text-[10px] bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="p-1 rounded bg-white dark:bg-slate-800 shadow-2xs">
                            <div className="text-slate-400 font-semibold">Ev 1 (25%)</div>
                            <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">
                              {grade.evaluacion1 ?? grade.parcial1 ?? 0}
                            </div>
                          </div>
                          <div className="p-1 rounded bg-white dark:bg-slate-800 shadow-2xs">
                            <div className="text-slate-400 font-semibold">Ev 2 (25%)</div>
                            <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">
                              {grade.evaluacion2 ?? grade.parcial2 ?? 0}
                            </div>
                          </div>
                          <div className="p-1 rounded bg-white dark:bg-slate-800 shadow-2xs">
                            <div className="text-slate-400 font-semibold">Ev 3 (25%)</div>
                            <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">
                              {grade.evaluacion3 ?? grade.practicas ?? 0}
                            </div>
                          </div>
                          <div className="p-1 rounded bg-white dark:bg-slate-800 shadow-2xs">
                            <div className="text-slate-400 font-semibold">Ev 4 (25%)</div>
                            <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">
                              {grade.evaluacion4 ?? grade.examenFinal ?? 0}
                            </div>
                          </div>
                          <div className={`p-1 rounded border ${
                            grade.finalGrade >= 10
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                          }`}>
                            <div className="font-bold">Final</div>
                            <div className="font-mono font-black text-xs mt-0.5">
                              {grade.finalGrade} <span className="text-[8px] font-normal">/20</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Attendance indicator */}
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Asistencia Acumulada:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${attendancePct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {attendancePct}%
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            attendancePct >= 75 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {attendancePct >= 75 ? 'Regular' : 'En Riesgo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule info footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {course.schedules.map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join(', ')}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {course.schedules[0]?.classroomName}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* TAB SECTION: "enrollment" or Default overview */}
      {(activeTab === 'enrollment' || activeTab === 'dashboard') && (
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
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="all">Todas las Áreas</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
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
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                        {course.code}
                      </span>
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
                      <span className="inline-block text-[10px] font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                        Área: {course.specialty}
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
                      {course.schedules.map(sch => (
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

      {/* TAB SECTION: "grades" */}
      {(activeTab === 'grades' || activeTab === 'dashboard') && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" /> Registro de Calificaciones
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulta el detalle de notas por evaluaciones parciales, trabajos prácticos y examen final.
              </p>
            </div>
            <button
              onClick={() => generateStudentTranscriptPDF(currentUser, studentGrades)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Descargar Certificado
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Código</th>
                  <th className="px-4 py-3">Asignatura</th>
                  <th className="px-4 py-3 text-center">P1 (25%)</th>
                  <th className="px-4 py-3 text-center">P2 (25%)</th>
                  <th className="px-4 py-3 text-center">Prácticas (20%)</th>
                  <th className="px-4 py-3 text-center">Ex. Final (30%)</th>
                  <th className="px-4 py-3 text-center">Asistencia</th>
                  <th className="px-4 py-3 text-center font-bold">Nota Final</th>
                  <th className="px-4 py-3 text-center rounded-r-xl">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentGrades.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      No estás inscrito en ninguna asignatura actualmente.
                    </td>
                  </tr>
                ) : (
                  studentGrades.map(grade => (
                    <tr key={grade.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {grade.courseCode}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        {grade.courseName}
                        {grade.feedback && (
                          <p className="text-[11px] font-normal text-slate-500 italic mt-0.5">
                            Nota del profesor: "{grade.feedback}"
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono">{grade.parcial1}</td>
                      <td className="px-4 py-3.5 text-center font-mono">{grade.parcial2}</td>
                      <td className="px-4 py-3.5 text-center font-mono">{grade.practicas}</td>
                      <td className="px-4 py-3.5 text-center font-mono">{grade.examenFinal}</td>
                      <td className="px-4 py-3.5 text-center font-mono">{grade.asistencia}%</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        {grade.finalGrade}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          grade.status === 'Aprobado'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : grade.status === 'Recuperación'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : grade.status === 'Reprobado'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {grade.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB SECTION: "schedule" */}
      {(activeTab === 'schedule' || activeTab === 'dashboard') && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Mi Horario Semanal de Clases
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribución semanal de asignaturas, horas y aulas asignadas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => {
              const dayClasses = studentCourses.flatMap(c =>
                c.schedules
                  .filter(s => s.dayOfWeek === day)
                  .map(s => ({ ...s, courseName: c.name, courseCode: c.code, teacher: c.teacherName }))
              );

              return (
                <div key={day} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
                    {day}
                  </h4>

                  <div className="space-y-2.5">
                    {dayClasses.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic text-center py-4">Sin clases</p>
                    ) : (
                      dayClasses.map(cls => (
                        <div
                          key={cls.id}
                          className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 shadow-sm"
                        >
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {cls.courseCode}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                            {cls.courseName}
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" /> {cls.startTime} - {cls.endTime}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            📍 {cls.classroomName}
                          </p>
                        </div>
                      ))
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
