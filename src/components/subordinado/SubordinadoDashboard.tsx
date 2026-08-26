import React, { useState } from 'react';
import {
  Search,
  Download,
  Users,
  BookOpen,
  Award,
  Building2,
  CheckCircle2,
  Filter,
  BarChart3,
  PieChart,
  Eye,
  FileText,
  Clock,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  generateStudentTranscriptPDF,
  generateCourseGradeActPDF,
  generateAcademicOfferPDF,
  generateClassroomsReportPDF,
  generateGlobalGradesReportPDF,
  generateAnalyticsReportPDF
} from '../../utils/pdfExport';
import {
  getCourseAreaName,
  getCourseAreaBadgeClasses,
  courseMatchesAreaFilter
} from '../../utils/areaHelpers';
import { formatDecimal, formatGrade } from '../../utils/gradeHelpers';

interface SubordinadoDashboardProps {
  activeTab: string;
}

export const SubordinadoDashboard: React.FC<SubordinadoDashboardProps> = ({ activeTab }) => {
  const {
    courses,
    classrooms,
    users,
    grades,
    enrollments,
    analytics,
    currentAcademicTerm
  } = useApp();

  // Search & filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedCourseForReport, setSelectedCourseForReport] = useState<string>(courses[0]?.id || '');

  const students = users.filter(u => u.role === 'student');
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.career && s.career.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const filteredCourses = courses.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
      (c.specialty && c.specialty.toLowerCase().includes(courseSearch.toLowerCase())) ||
      (c.department && c.department.toLowerCase().includes(courseSearch.toLowerCase())) ||
      c.teacherName.toLowerCase().includes(courseSearch.toLowerCase());
    const matchesDept = courseMatchesAreaFilter(c, selectedDeptFilter);
    return matchesSearch && matchesDept;
  });

  const areaFilterOptions = [
    { key: 'all', label: `Todas las Áreas (${courses.length})` },
    { key: 'COMERCIAL', label: `Área Comercial (${courses.filter(c => courseMatchesAreaFilter(c, 'COMERCIAL')).length})` },
    { key: 'INDUSTRIAL', label: `Área Industrial (${courses.filter(c => courseMatchesAreaFilter(c, 'INDUSTRIAL')).length})` },
    { key: 'GERENCIAL', label: `Área Gerencial (${courses.filter(c => courseMatchesAreaFilter(c, 'GERENCIAL')).length})` },
    { key: 'ARTESANAL', label: `Área Artesanal (${courses.filter(c => courseMatchesAreaFilter(c, 'ARTESANAL')).length})` }
  ];

  // Selected course details for grade viewing
  const currentReportCourse = courses.find(c => c.id === selectedCourseForReport) || courses[0];
  const courseGrades = grades.filter(g => g.courseId === currentReportCourse?.id);

  // Selected student for detailed view
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(students[0]?.id || null);
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedStudentGrades = grades.filter(g => g.studentId === selectedStudentId);

  const handleExportKardexPDF = (student: any) => {
    const studentGradesList = grades.filter(g => g.studentId === student.id);
    generateStudentTranscriptPDF(student, studentGradesList);
  };

  const handleExportActaPDF = () => {
    if (currentReportCourse) {
      generateCourseGradeActPDF(currentReportCourse, courseGrades);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
            <FileText className="w-3.5 h-3.5 text-sky-200" /> Rol Subordinado • Consultas & Reportes
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Módulo de Monitoreo e Informes Académicos
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-xl leading-relaxed">
            Acceso de consulta para expedientes de estudiantes, estado de matrículas, actas de calificaciones y generación de reportes ejecutivos en PDF oficial.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => generateAnalyticsReportPDF(analytics, currentAcademicTerm)}
            className="px-5 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Descargar Informe Ejecutivo de Analíticas en PDF"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Informe Analítica (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Estudiantes Registrados</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{analytics.totalStudents}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Expedientes en regla</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Asignaturas Activas</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{analytics.totalCourses}</p>
            <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{analytics.totalEnrollments} Inscripciones</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tasa de Aprobación</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{analytics.passRate}%</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Promedio: {analytics.averageGrade} / 20 pts</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Ocupación de Aulas</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{analytics.classroomOccupancyRate}%</p>
            <p className="text-[10px] text-purple-600 font-bold mt-0.5">{classrooms.length} Aulas habilitadas</p>
          </div>
        </div>
      </div>

      {/* Direct Report Generation Hub Section */}
      <div id="reports-hub" className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              Centro de Descarga Masiva
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              Generación de Reportes Oficiales en PDF
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Período: {currentAcademicTerm}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Oferta Academica Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FF6600]/10 text-[#FF6600] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#FF6600]">
                47 Cursos
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Catálogo de Oferta Académica</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Asignaturas, aulas, horarios y facilitadores.</p>
            </div>
            <div className="pt-1">
              <button
                onClick={() => generateAcademicOfferPDF(courses, currentAcademicTerm)}
                className="w-full py-2 px-3 bg-[#FF6600] hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Descargar PDF con membrete oficial"
              >
                <FileText className="w-3.5 h-3.5" /> Generar PDF Oficial
              </button>
            </div>
          </div>

          {/* Consolidado General de Notas Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                Calificaciones
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Consolidado General de Notas</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Sábana completa de evaluaciones parciales.</p>
            </div>
            <div className="pt-1">
              <button
                onClick={() => generateGlobalGradesReportPDF(grades, currentAcademicTerm)}
                className="w-full py-2 px-3 bg-[#FF6600] hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Descargar Sábana Oficial en PDF"
              >
                <FileText className="w-3.5 h-3.5" /> Generar Sábana PDF
              </button>
            </div>
          </div>

          {/* Ocupacion de Infraestructura Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600">
                Aulas
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Ocupación de Infraestructura</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Aforo, tipo de recinto y equipamiento.</p>
            </div>
            <div className="pt-1">
              <button
                onClick={() => generateClassroomsReportPDF(classrooms)}
                className="w-full py-2 px-3 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Descargar Informe Técnico PDF"
              >
                <FileText className="w-3.5 h-3.5" /> Informe Técnico PDF
              </button>
            </div>
          </div>

          {/* Acta Oficial Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600">
                Acta
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Acta Oficial por Asignatura</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Membretado con firmas y sello institucional.</p>
            </div>
            <div className="pt-1">
              <button
                onClick={handleExportActaPDF}
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Generar Acta Oficial PDF
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Student Consultation & Kardex Search Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Student Directory */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-500" /> Consulta de Estudiantes
            </h3>
            <span className="text-xs font-bold text-slate-400">{filteredStudents.length} hallados</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar estudiante por nombre o código..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredStudents.map(student => {
              const isSelected = student.id === selectedStudentId;
              const studentGradesList = grades.filter(g => g.studentId === student.id);
              const avg = studentGradesList.length > 0
                ? formatDecimal(studentGradesList.reduce((acc, curr) => acc + curr.finalGrade, 0) / studentGradesList.length, 1, false)
                : 'N/A';

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{student.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{student.code} • {student.career || 'Ingeniería'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">{avg} pts</span>
                    <span className="text-[9px] text-slate-400 font-medium">Promedio</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Student Kardex Summary */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          {selectedStudent ? (
            <div className="space-y-5">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStudent.avatar}
                    alt={selectedStudent.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                  />
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{selectedStudent.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Código: {selectedStudent.code} • {selectedStudent.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleExportKardexPDF(selectedStudent)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  <FileText className="w-4 h-4" /> Exportar Kardex (PDF)
                </button>
              </div>

              {/* Subject Grades Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Asignaturas Cursadas & Registro de Notas
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Código & Asignatura</th>
                        <th className="p-3 text-center">Parciales</th>
                        <th className="p-3 text-center">Examen Final</th>
                        <th className="p-3 text-center">Nota Final</th>
                        <th className="p-3 text-center">Estatus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedStudentGrades.length > 0 ? (
                        selectedStudentGrades.map(g => (
                          <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                              <span className="font-mono text-indigo-600 font-bold block">{g.courseCode}</span>
                              {g.courseName}
                            </td>
                            <td className="p-3 text-center text-slate-600 dark:text-slate-400 font-mono">
                              Ev1: {formatGrade(g.evaluacion1 ?? g.parcial1)} | Ev2: {formatGrade(g.evaluacion2 ?? g.parcial2)} | Ev3: {formatGrade(g.evaluacion3 ?? g.practicas)}
                            </td>
                            <td className="p-3 text-center text-slate-600 dark:text-slate-400 font-medium font-mono">
                              {formatGrade(g.evaluacion4 ?? g.examenFinal)} pts
                            </td>
                            <td className="p-3 text-center font-black text-indigo-600 dark:text-indigo-400 text-sm">
                              {g.finalGrade}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                g.status === 'Aprobado'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              }`}>
                                {g.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                            No hay notas registradas aún para este estudiante en el período activo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 my-auto">
              Selecciona un estudiante de la lista para inspeccionar su historial académico.
            </div>
          )}
        </div>

      </div>

      {/* Course Catalogue Consultation Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Consulta de Oferta Académica y Disponibilidad de Cupos
            </h3>
            <p className="text-xs text-slate-500">
              Visualización de cupos reservados, docentes a cargo y horarios de cursado sin permisos de edición.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filtrar curso o profesor..."
              value={courseSearch}
              onChange={e => setCourseSearch(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <select
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              {areaFilterOptions.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Nombre del Curso</th>
                <th className="p-3 text-center">Área Académica</th>
                <th className="p-3">Docente Titular</th>
                <th className="p-3">Modalidad</th>
                <th className="p-3 text-center">Inscritos / Capacidad</th>
                <th className="p-3 text-center">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCourses.map(course => {
                const isFull = course.enrolledCount >= course.capacity;

                return (
                  <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-indigo-600">{course.code}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">{course.name}</span>
                      {course.specialty && (
                        <span className="text-[10px] text-slate-500">{course.specialty}</span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${getCourseAreaBadgeClasses(course)}`}>
                        {getCourseAreaName(course)}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{course.teacherName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                        {course.modality}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">
                      <span className={isFull ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}>
                        {course.enrolledCount} / {course.capacity}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isFull
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {isFull ? 'Cupos Agotados' : 'Cupos Disponibles'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
