export type UserRole = 'student' | 'teacher' | 'subordinado' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  code: string;
  avatar: string;
  career?: string;
  department?: string;
  specialty?: string;
  semester?: number;
  phone?: string;
  // Campos adaptados de la base de datos MySQL (academia_valencia)
  cedula?: string;
  usuario?: string;
  nombre?: string;
  apellido?: string;
  id_rol?: number; // 1: Administrador, 2: Profesor, 3: Participante (Alumno)
}

export interface AcademicPeriod {
  id_periodo: number;
  nombre_periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface EvaluationPlanItem {
  id_eval: number;
  id_seccion: number;
  nombre_eval: string;
  porcentaje: number;
}

export interface GradeRecordItem {
  id_nota: number;
  id_eval: number;
  id_seccion: number;
  cedula_alumno: string;
  nota: number;
}

export interface AcademicActivity {
  id: string;
  title: string;
  category: 'Conferencia' | 'Taller' | 'Diplomado' | 'Hackathon' | 'Seminario';
  date: string;
  time: string;
  location: string;
  speaker: string;
  capacity: number;
  enrolledCount: number;
  image: string;
  description: string;
  modality: 'Presencial' | 'Virtual' | 'Híbrida';
  tags: string[];
}

export interface CourseSchedule {
  id: string;
  dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "10:00"
  classroomId: string;
  classroomName: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  career: string;
  credits: number;
  capacity: number;
  enrolledCount: number;
  teacherId: string;
  teacherName: string;
  specialty?: string;
  startDate: string; // e.g. "2026-09-01"
  endDate: string;   // e.g. "2026-12-18"
  startDateSetByAdmin?: boolean; // True when the administrator has officially scheduled the start date
  startDatePending?: boolean;    // True when course reaches min quorum (3 students) and awaits admin date assignment
  syllabusWeeks?: number; // e.g. 16
  currentWeek?: number;   // e.g. 10
  prerequisites: string[]; // e.g. ["INF-100"]
  schedules: CourseSchedule[];
  modality: 'Presencial' | 'Virtual' | 'Híbrida';
  status: 'Activo' | 'Cerrado' | 'Planificado';
  description: string;
  term: string;
  // Campos adaptados de la tabla `curso` y `seccion` en MySQL
  id_curso?: number;
  categoria?: 'COMERCIAL' | 'INDUSTRIAL' | 'GERENCIAL' | 'ARTESANAL';
  duracion?: string; // e.g. "16 Semanas", "8 Semanas (32 Horas)", "40 Horas Académicas"
  duracionSemanas?: number;
  horasAcademicas?: number;
  horasPorSemana?: number;
  tamanoContenido?: 'Corto / Intensivo' | 'Estándar' | 'Extenso / Diplomado';
  costoSemanal?: number; // Costo semanal en USD ($12 o $10)
  imagen?: string;
  id_seccion?: number;
  codigo_seccion?: string;
  id_periodo?: number;
  id_aula?: number;
  cedula_profesor?: string;
}

export interface Classroom {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: 'Teórica' | 'Laboratorio de Cómputo' | 'Auditorio' | 'Taller de Diseño' | 'Laboratorio de Física' | 'Taller Técnico / Industrial';
  resources: string[];
  status: 'Disponible' | 'Mantenimiento' | 'Inhabilitada';
  // Campos adaptados de la tabla `aula` en MySQL
  id_aula?: number;
  nombre_aula?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  enrolledAt: string;
  term: string;
  status: 'Inscrito' | 'Retirado' | 'Completado';
}

export interface GradeItem {
  id: string;
  enrollmentId?: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  // Sistema de Evaluación Vigesimal (1 al 20) • 4 Evaluaciones (25% c/u) • Mínimo Aprobatorio: 10 pts
  evaluacion1?: number;  // 0-20 (25%)
  evaluacion2?: number;  // 0-20 (25%)
  evaluacion3?: number;  // 0-20 (25%)
  evaluacion4?: number;  // 0-20 (25%)
  parcial1: number;      // Alias Evaluación 1 (0-20, 25%)
  parcial2: number;      // Alias Evaluación 2 (0-20, 25%)
  practicas: number;     // Alias Evaluación 3 (0-20, 25%)
  examenFinal: number;   // Alias Evaluación 4 (0-20, 25%)
  asistencia: number;    // 0-100 %
  finalGrade: number;    // 0-20 (Mínimo aprobatorio: 10 pts)
  status: 'Aprobado' | 'Reprobado' | 'En Cursado' | 'Recuperación';
  updatedAt: string;
  feedback?: string;
}

export interface NotificationItem {
  id: string;
  targetRole: 'all' | 'student' | 'teacher' | 'admin' | string; // userId or role
  userId?: string;
  title: string;
  message: string;
  type: 'grade' | 'schedule' | 'enrollment' | 'announcement' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
  courseCode?: string;
}

export interface ScheduleConflict {
  type: 'classroom_overlap' | 'teacher_overlap' | 'student_overlap';
  description: string;
  course1: string;
  course2: string;
  locationOrPerson: string;
  day: string;
  timeSlot: string;
}

export interface SystemAnalytics {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEnrollments: number;
  averageGrade: number;
  passRate: number; // percentage
  classroomOccupancyRate: number;
  courseEnrollmentDistribution: { courseName: string; enrolled: number; capacity: number }[];
  gradesDistribution: { range: string; count: number }[];
  classroomUsageByType: { type: string; count: number }[];
}

export type PermissionKey =
  | 'courses.view'
  | 'courses.create'
  | 'courses.edit'
  | 'courses.delete'
  | 'courses.enroll'
  | 'activities.view'
  | 'activities.create'
  | 'activities.edit'
  | 'activities.delete'
  | 'activities.enroll'
  | 'grades.view_own'
  | 'grades.view_all'
  | 'grades.edit'
  | 'grades.export_actas'
  | 'classrooms.view'
  | 'classrooms.manage'
  | 'reports.view'
  | 'reports.export'
  | 'users.view'
  | 'users.manage'
  | 'permissions.manage'
  | 'ai.assistant';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  category: 'courses' | 'activities' | 'grades' | 'classrooms' | 'reports' | 'security' | 'ai';
}

export type RolePermissionsMap = Record<UserRole, Record<PermissionKey, boolean>>;

