import * as XLSX from 'xlsx';
import { Course, GradeItem, Classroom, Enrollment, SystemAnalytics } from '../types';

/**
 * Export Grade Records to Excel (.xlsx)
 */
export function exportGradesToExcel(grades: GradeItem[], fileName = 'Reporte_Calificaciones.xlsx') {
  const data = grades.map(g => ({
    'Código Estudiante': g.studentCode,
    'Nombre Estudiante': g.studentName,
    'Código Curso': g.courseCode,
    'Nombre Asignatura': g.courseName,
    'Evaluación 1 (25%)': g.evaluacion1 ?? g.parcial1 ?? 0,
    'Evaluación 2 (25%)': g.evaluacion2 ?? g.parcial2 ?? 0,
    'Evaluación 3 (25%)': g.evaluacion3 ?? g.practicas ?? 0,
    'Evaluación 4 (25%)': g.evaluacion4 ?? g.examenFinal ?? 0,
    'Asistencia (%)': g.asistencia,
    'Nota Final (1-20)': g.finalGrade,
    'Estado': g.finalGrade >= 10 ? 'Aprobado' : (g.finalGrade > 0 ? 'Reprobado' : 'En Cursado'),
    'Última Actualización': new Date(g.updatedAt).toLocaleDateString('es-ES')
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Calificaciones');

  // Auto-width adjustment
  const max_width = data.reduce((w, r) => Math.max(w, r['Nombre Estudiante'].length), 10);
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: Math.max(max_width, 22) },
    { wch: 15 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 }
  ];

  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Courses Catalog & Capacity Report to Excel
 */
export function exportCoursesToExcel(courses: Course[], fileName = 'Oferta_Academica.xlsx') {
  const data = courses.map(c => ({
    'Código': c.code,
    'Nombre Asignatura': c.name,
    'Departamento / Área': c.department,
    'Especialidad': c.specialty || 'General',
    'Carrera': c.career,
    'Horas Académicas': c.horasAcademicas || 40,
    'Horas por Semana': c.horasPorSemana || 4,
    'Tamaño Contenido': c.tamanoContenido || 'Medio (6-8 módulos)',
    'Duración': c.duracion || `${c.horasAcademicas || 40} Horas`,
    'Docente Titular': c.teacherName,
    'Cupo Máximo': c.capacity,
    'Inscritos Actuales': c.enrolledCount,
    'Cupos Disponibles': c.capacity - c.enrolledCount,
    'Modalidad': c.modality,
    'Estado': c.status,
    'Horarios': c.schedules.map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime} (${s.classroomName})`).join(' | ')
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Oferta Académica');

  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 25 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 45 }
  ];

  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Classroom Availability & Occupancy Report to Excel
 */
export function exportClassroomsToExcel(classrooms: Classroom[], fileName = 'Disponibilidad_Aulas.xlsx') {
  const data = classrooms.map(cls => ({
    'Código': cls.code,
    'Nombre Recinto': cls.name,
    'Edificio': cls.building,
    'Piso': cls.floor,
    'Capacidad Personas': cls.capacity,
    'Tipo Recinto': cls.type,
    'Recursos Disponibles': cls.resources.join(', '),
    'Estado Operativo': cls.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Aulas e Infraestructura');

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 26 },
    { wch: 24 },
    { wch: 8 },
    { wch: 18 },
    { wch: 22 },
    { wch: 45 },
    { wch: 14 }
  ];

  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Complete Analytics Summary to Excel
 */
export function exportAnalyticsToExcel(analytics: SystemAnalytics, fileName = 'Resumen_Analiticas_Academicas.xlsx') {
  const summarySheetData = [
    { 'Métrica': 'Total Estudiantes Registrados', 'Valor': analytics.totalStudents },
    { 'Métrica': 'Total Docentes Activos', 'Valor': analytics.totalTeachers },
    { 'Métrica': 'Total Asignaturas Ofertadas', 'Valor': analytics.totalCourses },
    { 'Métrica': 'Inscripciones Totales', 'Valor': analytics.totalEnrollments },
    { 'Métrica': 'Promedio General de Notas', 'Valor': `${analytics.averageGrade} / 20 pts` },
    { 'Métrica': 'Tasa General de Aprobación', 'Valor': `${analytics.passRate}%` },
    { 'Métrica': 'Tasa de Ocupación de Aulas', 'Valor': `${analytics.classroomOccupancyRate}%` }
  ];

  const distributionSheetData = analytics.courseEnrollmentDistribution.map(item => ({
    'Asignatura': item.courseName,
    'Estudiantes Inscritos': item.enrolled,
    'Capacidad Máxima': item.capacity,
    'Porcentaje de Ocupación': `${((item.enrolled / item.capacity) * 100).toFixed(1)}%`
  }));

  const workbook = XLSX.utils.book_new();
  
  const ws1 = XLSX.utils.json_to_sheet(summarySheetData);
  const ws2 = XLSX.utils.json_to_sheet(distributionSheetData);

  XLSX.utils.book_append_sheet(workbook, ws1, 'Resumen Ejecutivo');
  XLSX.utils.book_append_sheet(workbook, ws2, 'Distribución de Cursos');

  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Users Directory to Excel (.xlsx)
 */
export function exportUsersToExcel(users: any[], fileName = 'Directorio_Usuarios_Academia_Valencia.xlsx') {
  const data = users.map(u => ({
    'Código': u.code || 'N/A',
    'Cédula de Identidad': u.cedula || 'N/A',
    'Nombre Completo': u.name,
    'Rol': u.role === 'admin' ? 'Administrador' : u.role === 'teacher' ? 'Docente' : u.role === 'subordinado' ? 'Subordinado / Gestor' : 'Estudiante',
    'Correo Electrónico': u.email,
    'Teléfono': u.phone || 'N/A',
    'Carrera / Especialidad': u.career || u.specialty || 'General',
    'Departamento': u.department || 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 30 },
    { wch: 20 },
    { wch: 32 },
    { wch: 18 },
    { wch: 28 },
    { wch: 28 }
  ];

  XLSX.writeFile(workbook, fileName);
}
