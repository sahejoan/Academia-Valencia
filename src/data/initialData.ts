import {
  User,
  Course,
  Classroom,
  Enrollment,
  GradeItem,
  NotificationItem,
  AcademicActivity,
  PermissionDefinition,
  RolePermissionsMap,
  AcademicPeriod
} from '../types';
import { OFFICIAL_COURSES, INSTITUTION_INFO } from './officialCourses';

export { INSTITUTION_INFO, OFFICIAL_COURSES };

// Periodos Académicos de la Base de Datos MySQL
export const INITIAL_PERIODS: AcademicPeriod[] = [
  {
    id_periodo: 1,
    nombre_periodo: '2026-I',
    fecha_inicio: '2026-01-15',
    fecha_fin: '2026-07-30'
  }
];

// Usuarios adaptados de las tablas `usuario`, `panel_profesor` y `alumno` de MySQL
// Estado base inicial: Únicamente el Administrador General (los docentes y estudiantes se registran limpiamente)
export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Laura Coromoto Garcías de Rodríguez',
    nombre: 'Laura Coromoto',
    apellido: 'Garcías de Rodríguez',
    cedula: '17374695',
    usuario: '17374695',
    email: 'laura.garcias@academiavalencia.edu',
    password: 'admin123',
    role: 'admin',
    id_rol: 1,
    code: 'ADM-17374695',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Dirección General & Rectoría',
    phone: '04123179002'
  }
];

// Aulas de la Base de Datos MySQL (tabla `aula`)
export const INITIAL_CLASSROOMS: Classroom[] = [
  {
    id: 'aula-1',
    id_aula: 1,
    nombre_aula: 'Aula 01 - Informática',
    code: 'AULA-01',
    name: 'Aula 01 - Informática',
    building: 'Edificio Central - Nivel 1',
    floor: 1,
    capacity: 35,
    type: 'Laboratorio de Cómputo',
    resources: ['30 Computadoras Core i7', 'Proyector HD', 'Aire Acondicionado', 'Pizarra Acrílica', 'Internet Fibra Óptica'],
    status: 'Disponible'
  },
  {
    id: 'aula-2',
    id_aula: 2,
    nombre_aula: 'Laboratorio 2 - Redes y Hardware',
    code: 'LAB-02',
    name: 'Laboratorio 2 - Redes y Hardware',
    building: 'Módulo Tecnológico - Nivel 2',
    floor: 2,
    capacity: 30,
    type: 'Laboratorio de Cómputo',
    resources: ['28 Estaciones de Trabajo', 'Servidor Local', 'Pantalla Smart 75"', 'Aire Acondicionado'],
    status: 'Disponible'
  },
  {
    id: 'aula-3',
    id_aula: 3,
    nombre_aula: 'Taller 01 - Mecánica y Automotriz',
    code: 'TAL-IND1',
    name: 'Taller 01 - Mecánica y Automotriz',
    building: 'Hangar Industrial',
    floor: 1,
    capacity: 25,
    type: 'Taller Técnico / Industrial',
    resources: ['Bancos de Prueba Eléctricos', 'Motores Didácticos', 'Herramientas Scanner', 'Elevador Hidráulico'],
    status: 'Disponible'
  },
  {
    id: 'aula-4',
    id_aula: 4,
    nombre_aula: 'Taller 02 - Electricidad y Refrigeración',
    code: 'TAL-IND2',
    name: 'Taller 02 - Electricidad y Refrigeración',
    building: 'Módulo Técnico',
    floor: 1,
    capacity: 25,
    type: 'Taller Técnico / Industrial',
    resources: ['Bancos de Climatización', 'Manómetros y Bombas de Vacío', 'Tableros Trifásicos'],
    status: 'Disponible'
  },
  {
    id: 'aula-5',
    id_aula: 5,
    nombre_aula: 'Taller 03 - Belleza, Estética & Textil',
    code: 'TAL-ART1',
    name: 'Taller 03 - Belleza, Estética & Textil',
    building: 'Módulo Artesanal',
    floor: 1,
    capacity: 25,
    type: 'Taller de Diseño',
    resources: ['Estaciones de Estilismo y Espejos', 'Máquinas de Coser Industriales', 'Lámparas UV y Mesas de Manicura'],
    status: 'Disponible'
  },
  {
    id: 'aula-6',
    id_aula: 6,
    nombre_aula: 'Aula 02 - Ciencias Comerciales y Jurídicas',
    code: 'AULA-02',
    name: 'Aula 02 - Ciencias Comerciales y Jurídicas',
    building: 'Edificio Administrativo - Nivel 1',
    floor: 1,
    capacity: 35,
    type: 'Teórica',
    resources: ['Pantalla Interactiva', 'Aire Acondicionado', 'Sonido Integrado'],
    status: 'Disponible'
  },
  {
    id: 'aula-7',
    id_aula: 7,
    nombre_aula: 'Aula 03 - Idiomas y Formación Empresarial',
    code: 'AULA-03',
    name: 'Aula 03 - Idiomas y Formación Empresarial',
    building: 'Edificio Central - Nivel 2',
    floor: 2,
    capacity: 30,
    type: 'Teórica',
    resources: ['Sistema Multimedia Audio-Visual', 'Aire Acondicionado', 'Mesas Modulares'],
    status: 'Disponible'
  },
  {
    id: 'aula-8',
    id_aula: 8,
    nombre_aula: 'Auditorio Central',
    code: 'AUD-01',
    name: 'Auditorio Central',
    building: 'Edificio Administrativo - Nivel 2',
    floor: 2,
    capacity: 120,
    type: 'Auditorio',
    resources: ['Sistema de Audio Envolvente', 'Proyector 4K Laser', 'Micrófonos Inalámbricos', 'Climatización Integral'],
    status: 'Disponible'
  }
];

// Catálogo Oficial de los 47 Cursos de la Academia Valencia
export const INITIAL_COURSES: Course[] = OFFICIAL_COURSES;

// Matrículas iniciales (vacías para comenzar desde cero)
export const INITIAL_ENROLLMENTS: Enrollment[] = [];

// Calificaciones iniciales (vacías para comenzar desde cero)
export const INITIAL_GRADES: GradeItem[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    targetRole: 'all',
    title: '🏛️ Sistema de Gestión Académica Inicializado',
    message: 'Bienvenido al panel central de Academia Valencia. Puede comenzar a registrar la planta docente y gestionar las matrículas estudiantiles.',
    type: 'announcement',
    timestamp: '2026-08-24T08:00:00Z',
    read: false
  }
];

export const INITIAL_ACTIVITIES: AcademicActivity[] = [
  {
    id: 'act-1',
    title: 'Seminario Internacional: Nuevas Tecnologías & Transformación Digital',
    category: 'Seminario',
    date: '28 de Agosto, 2026',
    time: '08:00 AM - 01:00 PM',
    location: 'Auditorio Central & Transmisión Online',
    speaker: 'Prof. Jhonny Rafael Rodriguez & Ponentes Invitados',
    capacity: 100,
    enrolledCount: 45,
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80',
    description: 'Encuentro académico sobre innovación tecnológica, computación en la nube y herramientas digitales para el sector productivo.',
    modality: 'Híbrida',
    tags: ['Tecnología', 'Innovación', 'Certificado']
  },
  {
    id: 'act-2',
    title: 'Taller Práctico: Excel Financiero y Tableros de Control',
    category: 'Taller',
    date: '15 de Septiembre, 2026',
    time: 'Sábados 09:00 AM - 01:00 PM',
    location: 'Laboratorio 2',
    speaker: 'Prof. Jhonny Rafael Rodriguez',
    capacity: 30,
    enrolledCount: 22,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
    description: 'Aprende a formular matrices, tablas dinámicas y dashboards ejecutivos en Excel para la toma de decisiones empresariales.',
    modality: 'Presencial',
    tags: ['Excel', 'Finanzas', 'Certificación']
  },
  {
    id: 'act-3',
    title: 'Conferencia Magistral: Emprendimiento y Gestión en el Sector Artesanal',
    category: 'Conferencia',
    date: '05 de Septiembre, 2026',
    time: '04:00 PM - 06:00 PM',
    location: 'Auditorio Central',
    speaker: 'Laura Coromoto Garcías de Rodríguez',
    capacity: 120,
    enrolledCount: 88,
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop&q=80',
    description: 'Estrategias de comercialización, costeo y posicionamiento de productos artesanales en mercados nacionales e internacionales.',
    modality: 'Presencial',
    tags: ['Emprendimiento', 'Artesanal', 'Gestión']
  },
  {
    id: 'act-4',
    title: 'Masterclass: Diagnóstico Electrónico Automotriz con Scanner OBD-II',
    category: 'Taller',
    date: '12 de Septiembre, 2026',
    time: '02:00 PM - 06:00 PM',
    location: 'Taller 01 - Industrial & Mecánica',
    speaker: 'Prof. Marco Tulio Valero',
    capacity: 25,
    enrolledCount: 19,
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
    description: 'Protocolos de comunicación automotriz, lectura de códigos DTC en vivo, prueba de actuadores y análisis de flujo de datos.',
    modality: 'Presencial',
    tags: ['Automotriz', 'Scanner', 'Tecnología']
  }
];

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Cursos y Oferta Académica
  {
    key: 'courses.view',
    label: 'Ver Catálogo y Oferta Académica',
    description: 'Permite consultar los cursos, créditos, docentes y horarios disponibles',
    category: 'courses'
  },
  {
    key: 'courses.create',
    label: 'Crear Nuevos Cursos',
    description: 'Permiso y atribución para aperturar nuevos cursos y secciones en el catálogo institucional',
    category: 'courses'
  },
  {
    key: 'courses.edit',
    label: 'Editar Cursos y Horarios',
    description: 'Modificar cupos, docentes asignados, horarios y contenido programático',
    category: 'courses'
  },
  {
    key: 'courses.delete',
    label: 'Eliminar / Dar de Baja Cursos',
    description: 'Dar de baja cursos y secciones del período académico',
    category: 'courses'
  },
  {
    key: 'courses.enroll',
    label: 'Inscribir y Retirar Estudiantes',
    description: 'Procesar matrículas o retiros de cursos en el sistema',
    category: 'courses'
  },

  // Actividades Académicas
  {
    key: 'activities.view',
    label: 'Ver Actividades y Eventos',
    description: 'Consultar seminarios, conferencias, talleres y masterclasses',
    category: 'activities'
  },
  {
    key: 'activities.create',
    label: 'Crear Nuevas Actividades',
    description: 'Publicar seminarios, talleres y conferencias en la agenda institucional',
    category: 'activities'
  },
  {
    key: 'activities.edit',
    label: 'Editar Actividades Académicas',
    description: 'Modificar fechas, ponentes, cupos y detalles de eventos',
    category: 'activities'
  },
  {
    key: 'activities.delete',
    label: 'Eliminar Actividades',
    description: 'Cancelar o remover eventos y actividades extracurriculares',
    category: 'activities'
  },
  {
    key: 'activities.enroll',
    label: 'Inscribirse en Actividades',
    description: 'Permite a los usuarios reservar cupos en seminarios y eventos',
    category: 'activities'
  },

  // Calificaciones y Evaluación
  {
    key: 'grades.view_own',
    label: 'Ver Calificaciones Propias',
    description: 'Permite a los estudiantes revisar su récord de notas individuales',
    category: 'grades'
  },
  {
    key: 'grades.view_all',
    label: 'Ver Calificaciones Globales',
    description: 'Consultar el libro de calificaciones de todos los estudiantes y cursos',
    category: 'grades'
  },
  {
    key: 'grades.edit',
    label: 'Cargar y Modificar Calificaciones',
    description: 'Ingresar notas de parciales, prácticas, asistencias y exámenes finales',
    category: 'grades'
  },
  {
    key: 'grades.export_actas',
    label: 'Descargar Actas y Boletas de Notas (PDF)',
    description: 'Generar actas y certificados oficiales en PDF con membrete institucional',
    category: 'grades'
  },

  // Aulas e Infraestructura
  {
    key: 'classrooms.view',
    label: 'Consultar Aulas y Laboratorios',
    description: 'Verificar la disponibilidad de espacios físicos y recursos tecnológicos',
    category: 'classrooms'
  },
  {
    key: 'classrooms.manage',
    label: 'Administrar Disponibilidad de Aulas',
    description: 'Crear aulas, asignar capacidades y gestionar disponibilidad de horarios',
    category: 'classrooms'
  },

  // Reportes y Analíticas
  {
    key: 'reports.view',
    label: 'Visualizar Métricas y Dashboard',
    description: 'Monitorear indicadores de rendimiento, aprobación y ocupación',
    category: 'reports'
  },
  {
    key: 'reports.export',
    label: 'Exportar Reportes Oficiales en PDF',
    description: 'Descargar sábanas, ofertas académicas y reportes institucionales en PDF',
    category: 'reports'
  },

  // Gestión de Usuarios
  {
    key: 'users.view',
    label: 'Consultar Directorio de Usuarios',
    description: 'Visualizar lista completa de estudiantes, docentes y administradores con sus datos',
    category: 'security'
  },
  {
    key: 'users.manage',
    label: 'Administrar Usuarios (Crear, Editar, Eliminar)',
    description: 'Crear nuevas cuentas, editar información, resetear claves y eliminar o inactivar usuarios',
    category: 'security'
  },

  // Seguridad y Permisos
  {
    key: 'permissions.manage',
    label: 'Administrar Permisos y Roles',
    description: 'Gestionar la matriz de accesos, permisos y atribuciones de los 4 roles del sistema',
    category: 'security'
  },

  // Asistente AI
  {
    key: 'ai.assistant',
    label: 'Acceso a Asistente Virtual Inteligente (AVI)',
    description: 'Utilizar el agente integral de asistencia académica y operativa AVI impulsado por IA',
    category: 'ai'
  }
];

export const INITIAL_ROLE_PERMISSIONS: RolePermissionsMap = {
  admin: {
    'courses.view': true,
    'courses.create': true,
    'courses.edit': true,
    'courses.delete': true,
    'courses.enroll': true,
    'activities.view': true,
    'activities.create': true,
    'activities.edit': true,
    'activities.delete': true,
    'activities.enroll': true,
    'grades.view_own': true,
    'grades.view_all': true,
    'grades.edit': true,
    'grades.export_actas': true,
    'classrooms.view': true,
    'classrooms.manage': true,
    'reports.view': true,
    'reports.export': true,
    'users.view': true,
    'users.manage': true,
    'permissions.manage': true,
    'ai.assistant': true
  },
  teacher: {
    'courses.view': true,
    'courses.create': false,
    'courses.edit': true,
    'courses.delete': false,
    'courses.enroll': false,
    'activities.view': true,
    'activities.create': false,
    'activities.edit': false,
    'activities.delete': false,
    'activities.enroll': true,
    'grades.view_own': true,
    'grades.view_all': true,
    'grades.edit': true,
    'grades.export_actas': true,
    'classrooms.view': true,
    'classrooms.manage': false,
    'reports.view': true,
    'reports.export': true,
    'users.view': false,
    'users.manage': false,
    'permissions.manage': false,
    'ai.assistant': true
  },
  subordinado: {
    'courses.view': true,
    'courses.create': false,
    'courses.edit': false,
    'courses.delete': false,
    'courses.enroll': false,
    'activities.view': true,
    'activities.create': false,
    'activities.edit': false,
    'activities.delete': false,
    'activities.enroll': false,
    'grades.view_own': false,
    'grades.view_all': true,
    'grades.edit': false,
    'grades.export_actas': true,
    'classrooms.view': true,
    'classrooms.manage': false,
    'reports.view': true,
    'reports.export': true,
    'users.view': true,
    'users.manage': false,
    'permissions.manage': false,
    'ai.assistant': true
  },
  student: {
    'courses.view': true,
    'courses.create': false,
    'courses.edit': false,
    'courses.delete': false,
    'courses.enroll': true,
    'activities.view': true,
    'activities.create': false,
    'activities.edit': false,
    'activities.delete': false,
    'activities.enroll': true,
    'grades.view_own': true,
    'grades.view_all': false,
    'grades.edit': false,
    'grades.export_actas': true,
    'classrooms.view': true,
    'classrooms.manage': false,
    'reports.view': false,
    'reports.export': false,
    'users.view': false,
    'users.manage': false,
    'permissions.manage': false,
    'ai.assistant': true
  }
};
