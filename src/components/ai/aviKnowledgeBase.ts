import { User, Course, Classroom, ScheduleConflict, Enrollment } from '../../types';

interface AviContext {
  currentUser: User;
  courses: Course[];
  classrooms: Classroom[];
  conflicts: ScheduleConflict[];
  enrollments: Enrollment[];
  users: User[];
}

export const generateAviSmartResponse = (query: string, ctx: AviContext): string => {
  const q = query.toLowerCase().trim();
  const { currentUser, courses, classrooms, conflicts, enrollments, users } = ctx;

  // 1. PLANIFICADOR DE OFERTA ACADÉMICA 360° (Aula ➔ Curso ➔ Horarios ➔ Profesor ➔ Matrícula)
  if (
    q.includes('ofertar') ||
    q.includes('oferta') ||
    q.includes('planificador') ||
    q.includes('aperturar') ||
    q.includes('seccion') ||
    q.includes('sección') ||
    q.includes('flujo') ||
    (q.includes('aula') && q.includes('profesor') && q.includes('horario'))
  ) {
    return `### 🏛️ Planificador y Apertura de Oferta Académica 360° (AVI)

El sistema de **Academia Valencia** implementa el flujo estándar de planificación académica en **5 fases ordenadas e integradas**:

1. **Paso 1: Espacio Físico (Aulas & Talleres)**:
   - Se selecciona el recinto idóneo (Laboratorios de Cómputo, Talleres Industriales, Taller de Estética, Aulas Teóricas o Auditorio).
   - Se valida el **aforo físico máximo** y equipamiento técnico.
2. **Paso 2: Curso a Dictar**:
   - Se escoge la materia del banco oficial de **47 cursos** (*Comercial, Industrial, Gerencial, Artesanal*) o se apertura un nuevo taller especializado.
3. **Paso 3: Definición de Horarios & Cupos**:
   - Se programan los días (Lunes a Sábado), rango de horas (inicio y fin) y la modalidad (*Presencial, Virtual o Híbrida*).
   - El sistema audita que no exceda la capacidad del aula.
4. **Paso 4: Asignación del Facilitador/Profesor**:
   - Se vincula al docente especialista con su Cédula de Identidad y perfil técnico.
   - Se verifica que el profesor no tenga otra clase programada a la misma hora.
5. **Paso 5: Matrícula & Control de Alumnos**:
   - Se abre el proceso de inscripción donde se pueden pre-matricular participantes o dejar la materia disponible para que los estudiantes se inscriban.

💡 *Puedes acceder a este flujo completo desde la pestaña **"Planificador de Oferta 360°"** en el menú lateral.*`;
  }

  // 2. CATÁLOGO DE LOS 47 CURSOS POR ÁREAS
  if (
    q.includes('catalogo') ||
    q.includes('catálogo') ||
    q.includes('47') ||
    q.includes('cuantos cursos') ||
    q.includes('comercial') ||
    q.includes('industrial') ||
    q.includes('gerencial') ||
    q.includes('artesanal') ||
    q.includes('cursos disponibles')
  ) {
    const commercialCount = courses.filter(c => c.categoria === 'COMERCIAL').length;
    const industrialCount = courses.filter(c => c.categoria === 'INDUSTRIAL').length;
    const gerencialCount = courses.filter(c => c.categoria === 'GERENCIAL').length;
    const artesanalCount = courses.filter(c => c.categoria === 'ARTESANAL').length;

    return `### 📚 Catálogo Oficial de 47 Asignaturas y Talleres (AVI)

**Academia Valencia** cuenta con **47 cursos y talleres técnicos** distribuidos en 4 áreas estratégicas:

1. 💼 **Área Comercial & Tecnología (${commercialCount} cursos)**:
   - Programación, Marketing Digital, Computación (Básico-Avanzado), Excel Avanzado, Creación de Contenido, Inglés, Matemática/Física/Química, Asistente Jurídico, Diseño Gráfico, Relaciones Públicas, Comercio Exterior, Fotografía Digital, Community Manager, Inteligencia Artificial aplicada.
2. ⚙️ **Área Industrial & Técnica (${industrialCount} cursos)**:
   - Soldadura Eléctrica y TIG/MIG, Mecánica Automotriz y Motores Diesel, Mecánica de Motos, Refrigeración y Aire Acondicionado, Electricidad Residencial/Industrial, Electrónica, PLC, Tornería y Mecanizado, Inyección Electrónica.
3. 📈 **Área Gerencial & Administrativa (${gerencialCount} cursos)**:
   - Administración de Empresas, Gestión de Talento Humano, Contabilidad Financiera y Tributaria, Oratoria y Comunicación Efectiva, Gestión de Proyectos (PMI/Scrum), Liderazgo e Inteligencia Emocional, Finanzas Personales y Corporativas.
4. ✂️ **Área Artesanal & Estética (${artesanalCount} cursos)**:
   - Peluquería y Estilismo Integral, Barbería Profesional, Maquillaje Profesional, Manicura y Uñas Acrílicas, Panadería y Pastelería Artesanal, Corte y Confección / Patronaje, Estética Facial y Corporal.

Cada curso incluye código único, aforo, profesor asignado, aula y control de asistencia.`;
  }

  // 3. MATRÍCULA, CÉDULA Y PREVENCIÓN DE DUPLICADOS
  if (
    q.includes('cedula') ||
    q.includes('cédula') ||
    q.includes('duplicad') ||
    q.includes('matricular') ||
    q.includes('inscribir') ||
    q.includes('matricula') ||
    q.includes('inscripción') ||
    q.includes('inscripcion')
  ) {
    return `### 🎓 Proceso de Matrícula y Control por Cédula (AVI)

El módulo de matrícula de **Academia Valencia** cuenta con validaciones de alta seguridad:

1. **Cédula de Identidad Obligatoria**:
   - Cada participante debe contar con su Cédula registrada (ej. \`V-28456123\`) para formalizar su inscripción.
2. **Bloqueo Estricto de Matrícula Duplicada**:
   - Si un estudiante intenta matricularse dos veces en la misma sección o curso con la misma cédula, el sistema bloquea automáticamente la acción e informa su estatus activo.
3. **Control de Capacidad en Tiempo Real**:
   - Cada sección posee un límite de cupos vinculado al aforo del aula física. Si se agotan los cupos, el sistema impide sobrecupos no autorizados.
4. **Validación de Cruces de Horario**:
   - Si un estudiante ya está inscrito en un curso los Sábados de 08:00 a 12:00, no podrá inscribirse en otra materia en ese mismo rango horario.`;
  }

  // 4. CALIFICACIONES, NOTAS, EVALUACIONES Y KARDEX
  if (
    q.includes('nota') ||
    q.includes('calificaci') ||
    q.includes('kardex') ||
    q.includes('evalua') ||
    q.includes('parcial') ||
    q.includes('asistencia') ||
    q.includes('acta')
  ) {
    return `### 📊 Sistema de Calificaciones, Asistencia y Kardex (AVI)

El modelo de evaluación institucional está estructurado de la siguiente forma:

1. **Ponderación de Cortes**:
   - **Parcial 1 (Corte 1)**: 25%
   - **Parcial 2 (Corte 2)**: 25%
   - **Prácticas / Talleres Continuos**: 20%
   - **Examen Final**: 30%
   - **Control de Asistencia**: Registro porcentual obligatorio (%)
2. **Cálculo Automatizado de Nota Final**:
   - $\\text{Nota Final} = (P_1 \\times 0.25) + (P_2 \\times 0.25) + (Pr \\times 0.20) + (EF \\times 0.30)$
3. **Estados Académicos**:
   - **Aprobado**: Calificación $\\ge 60/100$ (o $\\ge 10/20$).
   - **Recuperación**: Calificación entre 40 y 59 pts.
   - **Reprobado**: Calificación $< 40$ pts.
   - **En Cursado**: Materia activa durante el semestre/periodo.
4. **Descarga de Actas Oficiales**:
   - Los docentes y directivos pueden descargar las sábanas de notas completas en formato **Excel (.xlsx)** y **PDF con membrete**.`;
  }

  // 5. INFRAESTRUCTURA DE AULAS, TALLERES Y DETECCIÓN DE CONFLICTOS
  if (
    q.includes('aula') ||
    q.includes('taller') ||
    q.includes('laboratorio') ||
    q.includes('conflicto') ||
    q.includes('cruce') ||
    q.includes('solapamiento') ||
    q.includes('double booking')
  ) {
    return `### 🏢 Gestión de Aulas y Prevención de Solapamientos (AVI)

El sistema audita continuamente la asignación de espacios físicos:

1. **Directorio de Espacios (${classrooms.length} recintos)**:
   - Laboratorios de Computación, Talleres Industriales, Talleres de Diseño/Estética, Aulas Teóricas y Auditorio.
2. **Detección Automática de Conflictos**:
   - **Cruce de Aula (Double Booking)**: Alerta si dos materias distintas intentan usar el mismo salón a la misma hora.
   - **Cruce Docente**: Alerta si un profesor está asignado a dos materias simultáneas en diferentes aulas.
   - **Cruce Estudiantil**: Previene que un alumno se inscriba en dos clases el mismo día y hora.
3. **Resolución en 1-Clic**:
   - En la pestaña *"Aulas & Solapamientos"*, el administrador dispone del botón **"Resolver Conflictos Automáticamente"**, que reubica las secciones en aulas libres.`;
  }

  // 6. USUARIOS, ROLES Y MATRIZ DE PERMISOS RBAC
  if (
    q.includes('usuario') ||
    q.includes('rol') ||
    q.includes('permiso') ||
    q.includes('rbac') ||
    q.includes('administrador') ||
    q.includes('docente') ||
    q.includes('subordinado') ||
    q.includes('estudiante')
  ) {
    return `### 🛡️ Matriz de Usuarios y Permisos RBAC (AVI)

El sistema maneja **4 roles con permisos diferenciados**:

1. 👑 **Administrador (Dirección General)**:
   - Control total: apertura de ofertas, creación de usuarios, gestión de permisos RBAC, auditoría de infraestructura y reportes.
2. 📋 **Subordinado (Control de Estudios / Coordinación)**:
   - Consulta de expedientes, verificación de cupos, monitoreo de listas de inscritos y emisión de reportes.
3. 👨‍🏫 **Docente (Profesor Facilitador)**:
   - Gestión de cursos asignados, carga de notas por parcial, registro de asistencia y consulta de aulas.
4. 🎓 **Estudiante (Participante)**:
   - Inscripción de cursos con cédula, consulta de horarios semanales, kardex de calificaciones y constancias.`;
  }

  // 7. REPORTES Y EXPORTACIÓN EXCEL / PDF
  if (
    q.includes('reporte') ||
    q.includes('pdf') ||
    q.includes('excel') ||
    q.includes('descarg') ||
    q.includes('exportar') ||
    q.includes('sabana') ||
    q.includes('sábana')
  ) {
    return `### 📑 Centro de Reportes Oficiales en Excel y PDF (AVI)

Desde el **Centro de Reportes**, se pueden generar y descargar al instante:

- 📊 **Sábana de Calificaciones Global**: Notas detalladas por parcial, examen final, asistencia y estado de todos los alumnos.
- 🏛️ **Catálogo Consolidado de Oferta Académica**: Lista de los 47 cursos con aforo, cupos ocupados, profesor asignado y aula física.
- 👥 **Directorio Institucional de Usuarios**: Padrón con cédulas, roles, especialidades y datos de contacto.
- 🏢 **Mapa de Ocupación de Aulas**: Reporte de eficiencia espacial y disponibilidad horaria.`;
  }

  // DEFAULT CONTEXTUAL RESPONSE
  return `### 💡 Guía Operativa de AVI (Asistente Virtual Integrado)

He analizado tu consulta sobre **"${query}"**.

Estado del sistema en tiempo real:
- **${courses.length} Cursos Registrados** (*Comercial, Industrial, Gerencial, Artesanal*).
- **${classrooms.length} Espacios Físicos (Aulas y Talleres)**.
- **${users.length} Usuarios Registrados** en el directorio institucional.
- **${conflicts.length === 0 ? 'Sin conflictos de horario activos' : `${conflicts.length} alertas de cruce detectadas`}.**

¿Te gustaría que te guíe con el **Planificador de Oferta 360°**, la **Matrícula de Alumnos**, la **Carga de Calificaciones** o la **Gestión de Permisos**?`;
};
