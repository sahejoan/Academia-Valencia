import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  Award,
  Save,
  Download,
  Send,
  Building,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  Sparkles,
  Search,
  Check,
  TrendingUp,
  UserCheck,
  Percent
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Course, GradeItem } from '../../types';
import { generateCourseGradeActPDF } from '../../utils/pdfExport';
import { exportGradesToExcel } from '../../utils/excelExport';

interface TeacherDashboardProps {
  activeTab: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = () => {
  const {
    currentUser,
    courses,
    grades,
    updateGrade,
    sendBroadcastNotification,
    getTeacherCourses
  } = useApp();

  const teacherCourses = getTeacherCourses(currentUser.id);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    teacherCourses[0]?.id || ''
  );
  const [studentSearch, setStudentSearch] = useState('');

  // Notice broadcast form state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeSuccess, setNoticeSuccess] = useState(false);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || teacherCourses[0];
  const courseGrades = grades.filter(g => g.courseId === selectedCourse?.id);

  // Filtered student grades by search
  const filteredGrades = courseGrades.filter(g =>
    g.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    g.studentCode.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Local state for grade & attendance editing
  const [editingGrades, setEditingGrades] = useState<Record<string, GradeItem>>({});

  const handleGradeChange = (gradeId: string, field: keyof GradeItem, value: any) => {
    const existing = editingGrades[gradeId] || courseGrades.find(g => g.id === gradeId);
    if (!existing) return;

    const updated = { ...existing, [field]: value };
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
      const current = editingGrades[g.id] || g;
      handleGradeChange(g.id, 'asistencia', percentage);
    });
  };

  const handleSendNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMessage.trim() || !selectedCourse) return;

    sendBroadcastNotification(
      `📢 Aviso del Docente: ${noticeTitle}`,
      `${noticeMessage} (Asignatura: ${selectedCourse.name})`,
      'student',
      'announcement',
      selectedCourse.code
    );

    setNoticeTitle('');
    setNoticeMessage('');
    setNoticeSuccess(true);
    setTimeout(() => setNoticeSuccess(false), 4000);
  };

  // Course statistics
  const totalEnrolled = courseGrades.length;
  const approvedCount = courseGrades.filter(g => g.status === 'Aprobado').length;
  const averageGrade = totalEnrolled > 0
    ? (courseGrades.reduce((sum, g) => sum + g.finalGrade, 0) / totalEnrolled).toFixed(1)
    : '0.0';
  const averageAttendance = totalEnrolled > 0
    ? Math.round(courseGrades.reduce((sum, g) => sum + g.asistencia, 0) / totalEnrolled)
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> Especialidad: {currentUser.specialty || 'Ingeniería de Sistemas y Software'}
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Panel de Gestión Docente
            </h2>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1">
              Profesor: <strong className="text-white">{currentUser.name}</strong> • {currentUser.department} • Código ID: {currentUser.code}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
            <div className="text-right">
              <div className="text-[11px] text-indigo-200 uppercase font-semibold">Cursos a Cargo</div>
              <div className="text-xl font-black text-white">{teacherCourses.length} Activos</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-right">
              <div className="text-[11px] text-indigo-200 uppercase font-semibold">Total Alumnos</div>
              <div className="text-xl font-black text-emerald-400">
                {teacherCourses.reduce((acc, c) => acc + c.enrolledCount, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Selection Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" /> Asignaturas Asignadas según Especialidad
          </h3>
          <span className="text-xs text-slate-400">Selecciona un curso para gestionar alumnos, fechas, notas y asistencia</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teacherCourses.map(course => {
            const isSelected = selectedCourse?.id === course.id;
            const progressPercent = Math.min(100, Math.round(((course.currentWeek || 8) / (course.syllabusWeeks || 16)) * 100));

            return (
              <div
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`cursor-pointer rounded-2xl p-5 border transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}>
                    {course.code}
                  </span>
                  <span className={`text-xs font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <Users className="w-3.5 h-3.5" /> {course.enrolledCount} / {course.capacity} inscritos
                  </span>
                </div>

                <h3 className="text-base font-bold leading-tight mt-1">{course.name}</h3>

                {course.specialty && (
                  <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-md mt-1.5 ${
                    isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    Área: {course.specialty}
                  </span>
                )}

                {/* Dates & Syllabus Progress */}
                <div className={`mt-3 pt-3 border-t text-xs space-y-1.5 ${
                  isSelected ? 'border-indigo-500/40 text-indigo-100' : 'border-slate-100 dark:border-slate-800 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" /> {course.startDate || '01/09/2026'} al {course.endDate || '18/12/2026'}
                    </span>
                    <span className="font-bold">Semana {course.currentWeek || 8}/{course.syllabusWeeks || 16}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-indigo-800' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div
                      className={`h-full ${isSelected ? 'bg-emerald-300' : 'bg-indigo-600'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className={`mt-2.5 text-[11px] space-y-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-600 dark:text-slate-400'}`}>
                  {course.schedules.map(sch => (
                    <div key={sch.id} className="flex items-center justify-between">
                      <span>{sch.dayOfWeek} {sch.startTime}-{sch.endTime}</span>
                      <span className="font-semibold">{sch.classroomName}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grade & Attendance Sheet Section */}
      {selectedCourse ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Header & Course Info */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                  {selectedCourse.code} • {selectedCourse.department}
                </span>
                <span className="text-xs text-slate-400">
                  {selectedCourse.modality} • {selectedCourse.duracion || 'Período 2026-1'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {selectedCourse.name}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <strong>Inicio:</strong> {selectedCourse.startDate || '01/09/2026'} • <strong>Culminación:</strong> {selectedCourse.endDate || '18/12/2026'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <strong>Inscritos:</strong> {selectedCourse.enrolledCount} de {selectedCourse.capacity} cupos
                </span>
                <span>•</span>
                <span><strong>Especialidad:</strong> {selectedCourse.specialty || currentUser.specialty}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {Object.keys(editingGrades).length > 0 && (
                <button
                  onClick={handleSaveAllGrades}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Guardar Todo ({Object.keys(editingGrades).length})
                </button>
              )}

              <button
                onClick={() => handleSetAllAttendance(100)}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
                title="Poner 100% de asistencia a todos los alumnos del curso"
              >
                <UserCheck className="w-4 h-4 text-emerald-600" /> 100% Asistencia
              </button>

              <button
                onClick={() => generateCourseGradeActPDF(selectedCourse, courseGrades)}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Acta Oficial PDF
              </button>

              <button
                onClick={() => exportGradesToExcel(courseGrades, `Planilla_Notas_${selectedCourse.code}.xlsx`)}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Quick Metrics of Course */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" /> Alumnos Matriculados
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
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Fórmula: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 font-mono">P1(25%) + P2(25%) + PRAC(20%) + EF(30%)</code>
            </div>
          </div>

          {/* Grades & Attendance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-3 py-3 rounded-l-xl">Estudiante Matriculado</th>
                  <th className="px-2 py-3 text-center">P1 (25%)</th>
                  <th className="px-2 py-3 text-center">P2 (25%)</th>
                  <th className="px-2 py-3 text-center">Prácticas (20%)</th>
                  <th className="px-2 py-3 text-center">Ex. Final (30%)</th>
                  <th className="px-3 py-3 text-center">Control Asistencia %</th>
                  <th className="px-3 py-3 text-center font-bold">Nota Final</th>
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
                        Los estudiantes que se matriculen según la especialidad aparecerán automáticamente aquí.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map(grade => {
                    const currentGrade = editingGrades[grade.id] || grade;
                    const isDirty = !!editingGrades[grade.id];

                    return (
                      <tr key={grade.id} className={isDirty ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{grade.studentName}</div>
                          <span className="text-[10px] font-mono text-slate-400">{grade.studentCode}</span>
                        </td>

                        {/* Parcial 1 */}
                        <td className="px-2 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={currentGrade.parcial1}
                            onChange={e => handleGradeChange(grade.id, 'parcial1', Number(e.target.value))}
                            className="w-14 text-center font-mono py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                          />
                        </td>

                        {/* Parcial 2 */}
                        <td className="px-2 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={currentGrade.parcial2}
                            onChange={e => handleGradeChange(grade.id, 'parcial2', Number(e.target.value))}
                            className="w-14 text-center font-mono py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                          />
                        </td>

                        {/* Prácticas */}
                        <td className="px-2 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={currentGrade.practicas}
                            onChange={e => handleGradeChange(grade.id, 'practicas', Number(e.target.value))}
                            className="w-14 text-center font-mono py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                          />
                        </td>

                        {/* Examen Final */}
                        <td className="px-2 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={currentGrade.examenFinal}
                            onChange={e => handleGradeChange(grade.id, 'examenFinal', Number(e.target.value))}
                            className="w-14 text-center font-mono py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                          />
                        </td>

                        {/* Asistencia con controles rápidos */}
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleGradeChange(grade.id, 'asistencia', Math.max(0, currentGrade.asistencia - 5))}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold"
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
                              className="w-14 text-center font-mono py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleGradeChange(grade.id, 'asistencia', Math.min(100, currentGrade.asistencia + 5))}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold"
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
                        <td className="px-3 py-3 text-center font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                          {currentGrade.finalGrade}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            currentGrade.status === 'Aprobado'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : currentGrade.status === 'Recuperación'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}>
                            {currentGrade.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleSaveGrades(grade.id)}
                            disabled={!isDirty}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              isDirty
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer'
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

      {/* Broadcast Announcement Section */}
      {selectedCourse && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-indigo-600" /> Enviar Aviso en Tiempo Real al Curso
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Envía una notificación instantánea que aparecerá a los alumnos inscritos en {selectedCourse.name} ({selectedCourse.code}).
          </p>

          <form onSubmit={handleSendNotice} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Título del Aviso
              </label>
              <input
                type="text"
                placeholder="Ej. Publicación de pautas para el examen final o entrega de proyecto..."
                value={noticeTitle}
                onChange={e => setNoticeTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Mensaje Detallado
              </label>
              <textarea
                rows={3}
                placeholder="Escribe el mensaje formal para los alumnos..."
                value={noticeMessage}
                onChange={e => setNoticeMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {noticeSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Notificación emitida en tiempo real con éxito a todos los estudiantes inscritos.</span>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" /> Emitir Notificación
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
