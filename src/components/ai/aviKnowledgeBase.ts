import { User, Course, Classroom, ScheduleConflict, Enrollment } from '../../types';

interface AviContext {
  currentUser: User;
  courses: Course[];
  classrooms: Classroom[];
  conflicts: ScheduleConflict[];
  enrollments: Enrollment[];
  users: User[];
  activeTerm?: string;
}

export const generateAviSmartResponse = (query: string, ctx: AviContext): string => {
  const q = query.toLowerCase().trim();
  const { currentUser, courses, classrooms, conflicts, enrollments, users, activeTerm = '2026-I' } = ctx;

  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');
  const admins = users.filter(u => u.role === 'admin');
  const subordinados = users.filter(u => u.role === 'subordinado');

  // =========================================================================
  // 1. PLANIFICADOR DE OFERTA ACADÉMICA 360° (5 PASOS INSTITUCIONALES)
  // =========================================================================
  if (
    q.includes('ofertar') ||
    q.includes('oferta') ||
    q.includes('planificador') ||
    q.includes('aperturar') ||
    q.includes('seccion') ||
    q.includes('sección') ||
    q.includes('flujo') ||
    q.includes('crear curso') ||
    (q.includes('aula') && q.includes('profesor') && q.includes('horario'))
  ) {
    return `### 🏛️ Planificador y Apertura de Oferta Académica 360° (AVI)

El sistema de **Academia Valencia** implementa el flujo estándar de apertura y programación de secciones académicas mediante un asistente guiado de **5 pasos continuos e integrados**:

---

#### 📌 Flujo Paso a Paso para Aperturar una Sección:
1. **Paso 1: Selección de Espacio Físico (Aulas & Talleres)**:
   - Se selecciona el recinto adecuado entre los **${classrooms.length} espacios institucionales** (Laboratorios de Cómputo con PCs, Talleres Industriales de Soldadura/Mecánica/Electricidad, Taller de Estética, Aulas Teóricas o Auditorio Principal).
   - Se valida el **aforo físico máximo** y el equipamiento técnico requerido.
2. **Paso 2: Selección del Curso a Dictar**:
   - Se escoge una asignatura del **Catálogo Oficial de 47 Cursos** (*Áreas: Comercial & Tecnología, Industrial & Técnica, Gerencial & Administrativa, Artesanal & Estética*) o se crea un nuevo curso/taller especializado.
3. **Paso 3: Definición de Horarios, Modalidad & Cupos**:
   - Se configuran los días de clase (**Martes a Sábado**, domingos y lunes cerrado), bloques horarios (**07:00 a 20:30**), duración en semanas (generalmente 16 semanas) y modalidad (**Presencial, Virtual o Híbrida**).
   - El sistema valida automáticamente que el aforo del curso no exceda la capacidad del aula física.
4. **Paso 4: Asignación del Facilitador/Profesor**:
   - Se vincula al docente especialista con su **Cédula de Identidad** y especialidad.
   - El motor de auditoría verifica en tiempo real que el profesor no tenga otra clase asignada en el mismo horario (anti-solapamiento).
5. **Paso 5: Matrícula & Control de Quórum**:
   - Se habilita la inscripción formal de estudiantes.
   - **Regla de Quórum:** Cada sección requiere un mínimo de **3 alumnos inscritos** para considerarse con quórum activo y garantizar la apertura del curso.

---

💡 **¿Cómo acceder?** Desde el menú lateral en la sesión de Administrador o Coordinador, haz clic en **"Planificador de Oferta"**.`;
  }

  // =========================================================================
  // 2. GESTIÓN Y ASIGNACIÓN DE PROFESORES (ADMIN Y COORDINACIÓN)
  // =========================================================================
  if (
    q.includes('gestion de profesores') ||
    q.includes('gestión de profesores') ||
    q.includes('asignar profesor') ||
    q.includes('asignar docente') ||
    q.includes('carga horaria') ||
    q.includes('cuerpo profesoral') ||
    (q.includes('profesor') && (q.includes('registrar') || q.includes('eliminar') || q.includes('editar') || q.includes('pdf')))
  ) {
    return `### 👨‍🏫 Módulo de Gestión de Profesores (AVI)

El módulo **"Gestión de Profesores"** permite la administración integral del cuerpo docente institucional:

---

#### 🛠️ Operaciones y Funcionalidades Disponibles:
1. **Registro de Nuevos Docentes**:
   - Clic en **"+ Registrar Profesor"**.
   - Se completan los datos: Nombre completo, Cédula de Identidad (ej. \`V-14567890\`), Código Docente automático (\`DOC-001\`), Especialidad técnica, Departamento académico, Correo institucional, Teléfono y Contraseña de acceso.
2. **Conmutador de Visualización**:
   - **Vista en Tabla Compacta**: Organizada con perfil docente, identificación, área/especialidad, cursos asignados, carga horaria semanal (h/sem), total de alumnos y columna de acciones directas fijas.
   - **Vista en Tarjetas**: Fichas individuales con métricas de cursos, horas y alumnos.
3. **Acciones Directas por Profesor**:
   - 📑 **Ficha y Carga**: Consulta el expediente del docente, listado de secciones a cargo, horarios detallados y alumnos inscritos.
   - 📖 **Asignar Cursos**: Permite asignar cursos del catálogo institucional con validación automática de solapamientos horarios.
   - 📄 **Descargar Horario (PDF)**: Genera el reporte formal con membrete de Academia Valencia con la carga docente semanal y distribución de aulas.
   - ✏️ **Editar Datos**: Modifica departamento, especialidad, correo o datos personales.
   - 🗑️ **Eliminar Profesor**: Da de baja al docente con confirmación de seguridad.

---

💡 **Acceso:** Menú lateral ➔ **"Gestión de Profesores"** (disponible para Administradores y Subordinados).`;
  }

  // =========================================================================
  // 3. SESIÓN DEL PROFESOR / DOCENTE (3 SUB-MÓDULOS DIFERENCIADOS)
  // =========================================================================
  if (
    q.includes('sesion de profesor') ||
    q.includes('sesión del profesor') ||
    q.includes('rol docente') ||
    q.includes('mis cursos asignados') ||
    q.includes('cargar nota') ||
    q.includes('registrar nota') ||
    q.includes('horario e infraestructura') ||
    q.includes('evaluacion') ||
    q.includes('evaluaciones') ||
    (q.includes('docente') && (q.includes('nota') || q.includes('curso') || q.includes('asistencia')))
  ) {
    return `### 👨‍🏫 Sesión del Profesor / Docente (AVI)

El panel del Docente cuenta con **3 vistas especializadas y diferenciadas**:

---

#### 1. 📚 Mis Cursos Asignados (\`dashboard\`):
- **Catálogo de Cursos a Cargo**: Tarjetas informativas con código de curso, sección, departamento, modalidad y fechas de inicio/culminación.
- **Auditoría de Quórum**: Indicador de alumnos inscritos vs. capacidad máxima y estatus de quórum ($\ge 3$ alumnos).
- **Barra de Progreso Programático**: Avance por semanas del syllabus (ej. Semana 1 de 16).
- **Acciones por Curso**:
  - 👁️ **Ver Alumnos**: Modal con la lista oficial de estudiantes matriculados (código, nombre, asistencia y nota final).
  - 🏅 **Registrar Notas**: Acceso directo que abre la cuadrícula de calificaciones con el curso seleccionado.
  - 📄 **Acta Oficial (PDF)**: Descarga del acta de notas con membrete.
- **Emisión de Avisos**: Formulario para enviar notificaciones en tiempo real a los estudiantes de un curso o de todas sus asignaturas.

---

#### 2. 🏅 Registro de Notas (\`grades\`):
- **Selector de Cursos Asignados**: Barra interactiva superior para alternar rápidamente entre cualquiera de los cursos asignados.
- **Cuadrícula Vigesimal (Escala 1 a 20 pts)**:
  - **4 Evaluaciones Continuas (25% cada una)**:
    - *Eval 1 (25%)* | *Eval 2 (25%)* | *Eval 3 (25%)* | *Eval 4 (25%)*
  - **Control de Asistencia (%)**: Con botones rápidos de ajuste ($-5\%$, $+5\%$) y botón de **100% Asistencia** masivo.
  - **Cálculo Automático**: $\\text{Nota Final} = \\frac{E_1 + E_2 + E_3 + E_4}{4}$.
  - **Estatus Académico**: $\\ge 10\\text{ pts}$ **Aprobado**, $< 10\\text{ pts}$ **Reprobado**.
  - **Guardado**: Botón individual por alumno y botón global **"Guardar Todo"**.
  - **Acta Oficial (PDF)**: Botón para generar el acta formal con firma del docente.

---

#### 3. 🗓️ Horario e Infraestructura (\`schedule\`):
- **Matriz Semanal**: Cuadrícula de **Lunes a Sábado** con bloques de 07:00 a 20:30, materias y aulas asignadas.
- **Fichas de Espacios Asignados**: Detalle de laboratorios y salones con aforo, piso, equipamiento (proyector, PCs, aire acondicionado) y horario de uso.
- **Descarga PDF**: Botón de **"Descargar Horario y Carga Docente (PDF)"**.`;
  }

  // =========================================================================
  // 4. SESIÓN DEL ESTUDIANTE / MATRÍCULA CON CÉDULA Y CRUCES DE HORARIO
  // =========================================================================
  if (
    q.includes('estudiante') ||
    q.includes('alumno') ||
    q.includes('matricular') ||
    q.includes('inscribir') ||
    q.includes('matricula') ||
    q.includes('inscripción') ||
    q.includes('duplicad') ||
    q.includes('cédula') ||
    q.includes('cedula') ||
    q.includes('cruce de horario') ||
    q.includes('solapamiento estudiante') ||
    q.includes('kardex')
  ) {
    return `### 🎓 Sesión del Estudiante y Procedimiento de Matrícula (AVI)

El módulo del **Estudiante** garantiza una experiencia académica fluida y segura:

---

#### 📋 1. Proceso de Inscripción & Matrícula (\`enrollment\`):
- **Cédula de Identidad Obligatoria**: Cada estudiante debe tener su Cédula registrada para validar su expediente.
- **Bloqueo Estricto de Duplicados**: El sistema impide que un alumno se inscriba dos veces en el mismo curso o sección.
- **Validación Automática de Solapamiento Horario**: Si el estudiante intenta matricularse en dos cursos que coinciden en el **mismo día y rango de horas** (ej. Sábado de 08:00 a 11:30), el sistema emite una alerta roja y bloquea la inscripción para evitar choques.
- **Control de Cupos**: Si la sección alcanza su aforo máximo, se bloquea la inscripción para respetar la capacidad física del aula.

---

#### 📊 2. Kardex Digital & Calificaciones (\`grades\`):
- Visualización detallada de las 4 evaluaciones continuas (Eval 1, 2, 3, 4), porcentaje de asistencia y promedio final vigesimal (1-20 pts).
- Indicadores visuales de estatus: **Aprobado** (verde, $\ge 10$), **Reprobado** (rojo, $< 10$) o **En Cursado** (azul).
- Botón para descargar la **Boleta y Récord de Notas en PDF**.

---

#### 🗓️ 3. Horario Semanal Interactivo (\`schedule\`):
- Matriz interactiva de clases de Lunes a Sábado con identificación de asignatura, profesor, aula física y modalidad.

---

#### 🎖️ 4. Actividades Extracurriculares & Constancias:
- Inscripción en talleres complementarios y emisión inmediata de **Constancias de Estudio Oficiales en PDF**.`;
  }

  // =========================================================================
  // 5. CATÁLOGO COMPLETO DE LOS 47 CURSOS POR ÁREAS
  // =========================================================================
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

**Academia Valencia** cuenta con **47 cursos y talleres técnicos** organizados en 4 áreas estratégicas:

---

1. 💼 **Área Comercial & Tecnología (${commercialCount} cursos)**:
   - Programación Web / Software, Marketing Digital & Redes Sociales, Computación Básica a Avanzada, Excel Avanzado & Business Intelligence, Creación de Contenido Multimedia, Inglés Técnico y Conversacional, Matemática/Física/Química para Bachillerato y Universidad, Asistente Jurídico y Notarial, Diseño Gráfico Publicitario, Relaciones Públicas & Protocolo, Comercio Exterior y Aduanas, Fotografía Digital, Community Manager, Inteligencia Artificial aplicada.

2. ⚙️ **Área Industrial & Técnica (${industrialCount} cursos)**:
   - Soldadura Eléctrica y Procesos TIG/MIG, Mecánica Automotriz y Motores Diesel, Mecánica y Mantenimiento de Motos, Refrigeración Comercial y Aire Acondicionado, Electricidad Residencial e Industrial, Electrónica Básica y Digital, Automatización con PLC, Tornería y Mecanizado de Precisión, Inyección Electrónica Automotriz.

3. 📈 **Área Gerencial & Administrativa (${gerencialCount} cursos)**:
   - Administración de Empresas, Gestión Estratégica de Talento Humano, Contabilidad Financiera y Tributaria, Oratoria y Comunicación Efectiva, Gestión de Proyectos (PMI / Scrum), Liderazgo e Inteligencia Emocional, Finanzas Personales y Corporativas.

4. ✂️ **Área Artesanal & Estética (${artesanalCount} cursos)**:
   - Peluquería y Estilismo Integral, Barbería Profesional & Diseños, Maquillaje Profesional, Manicura Integral y Uñas Acrílicas, Panadería y Pastelería Artesanal, Corte y Confección / Patronaje Industrial, Estética Facial y Corporal.

---

📌 *Todos los cursos cuentan con código único (\`ADM-001\`, \`MEC-001\`, etc.), profesor asignado, cupos auditados, aforo de aula y control de asistencia.*`;
  }

  // =========================================================================
  // 6. GESTIÓN DE AULAS, INFRAESTRUCTURA Y DETECCIÓN DE CONFLICTOS
  // =========================================================================
  if (
    q.includes('aula') ||
    q.includes('taller') ||
    q.includes('laboratorio') ||
    q.includes('conflicto') ||
    q.includes('cruce') ||
    q.includes('solapamiento') ||
    q.includes('double booking') ||
    q.includes('capacidad') ||
    q.includes('aforo')
  ) {
    return `### 🏢 Infraestructura de Aulas y Prevención de Conflictos (AVI)

El sistema de **Academia Valencia** audita permanentemente la ocupación de espacios físicos:

---

#### 🏫 Directorio de Recintos (${classrooms.length} Aulas y Talleres):
- **Laboratorios de Computación** (Aforo 20-30 alumnos, equipados con PCs de alto rendimiento y proyector).
- **Talleres Industriales** (Mecánica, Soldadura, Electricidad, Refrigeración con equipamiento de seguridad).
- **Taller de Estética y Artesanal** (Espejos, estaciones de peluquería, camillas, hornos de pastelería).
- **Aulas Teóricas Multipropósito** (Aforo 25-40 participantes con aire acondicionado y pizarra acrílica).
- **Auditorio Principal** (Aforo para 80-120 personas para eventos y conferencias).

---

#### 🚨 Motor de Detección de Conflictos:
1. **Double Booking de Aulas**: Detecta si dos materias diferentes intentan ocupar la misma aula en el mismo bloque horario.
2. **Cruce Docente**: Alerta si un profesor está programado para dictar dos clases a la misma hora en distintos recintos.
3. **Cruce Estudiantil**: Bloquea la matrícula si un alumno intenta registrarse en dos cursos con el mismo horario.

---

⚡ **Resolución Automática en 1-Clic**: En la pestaña *"Aulas & Solapamientos"*, el Administrador puede presionar **"Resolver Conflictos Automáticamente"**, y el sistema reasigna los horarios a aulas libres compatibles.`;
  }

  // =========================================================================
  // 7. MATRIZ DE ROLES, PERMISOS RBAC Y USUARIOS
  // =========================================================================
  if (
    q.includes('usuario') ||
    q.includes('rol') ||
    q.includes('permiso') ||
    q.includes('rbac') ||
    q.includes('administrador') ||
    q.includes('docente') ||
    q.includes('subordinado') ||
    q.includes('estudiante') ||
    q.includes('crear usuario') ||
    q.includes('password') ||
    q.includes('contraseña')
  ) {
    return `### 🛡️ Matriz de Usuarios y Permisos RBAC (AVI)

El sistema opera con **4 roles jerárquicos** con permisos diferenciados:

---

| Rol | Cantidad | Permisos y Alcance Operativo |
| :--- | :---: | :--- |
| 👑 **Administrador** | ${admins.length} | Acceso total: Planificador de oferta, gestión de usuarios, RBAC, auditoría de infraestructura, resolución de conflictos y reportes ejecutivos. |
| 📋 **Subordinado** | ${subordinados.length} | Coordinación y Control de Estudios: Monitoreo de matrículas, consulta de expedientes, verificación de cupos y emisión de reportes. |
| 👨‍🏫 **Docente** | ${teachers.length} | Cursos a cargo, registro de 4 evaluaciones vigesimales (1-20), control de asistencia, actas de notas y consulta de aulas. |
| 🎓 **Estudiante** | ${students.length} | Inscripción de materias con cédula (anti-cruces), consulta de notas, horario semanal interactivo y constancias de estudio en PDF. |

---

#### 👥 Gestión de Usuarios en el Sistema:
- El Administrador puede **crear, editar, activar/inactivar y resetear contraseñas** de cualquier usuario con su Cédula de Identidad como identificador institucional único.`;
  }

  // =========================================================================
  // 8. CENTRO DE REPORTES Y EXPORTACIÓN EXCEL / PDF
  // =========================================================================
  if (
    q.includes('reporte') ||
    q.includes('pdf') ||
    q.includes('excel') ||
    q.includes('descarg') ||
    q.includes('exportar') ||
    q.includes('sabana') ||
    q.includes('sábana') ||
    q.includes('acta') ||
    q.includes('constancia')
  ) {
    return `### 📑 Centro de Reportes Oficiales en Excel y PDF (AVI)

El sistema genera documentos oficiales con formato profesional y membrete de **Academia Valencia**:

---

#### 📄 Reportes Disponibles:
1. 📊 **Sábana Global de Calificaciones (Excel & PDF)**:
   - Resumen consolidado con código de curso, estudiante, cédula, 4 evaluaciones continuas, asistencia porcentual, nota final y estatus (Aprobado/Reprobado).
2. 🏛️ **Catálogo Consolidado de Oferta Académica (Excel & PDF)**:
   - Registro de los 47 cursos con aforo físico, cupos ocupados, profesor asignado, aula y horario.
3. 👥 **Directorio Institucional de Usuarios (Excel & PDF)**:
   - Padrón completo de estudiantes, profesores, coordinadores y administradores con cédulas, correos y roles.
4. 🏢 **Mapa de Ocupación de Infraestructura (PDF)**:
   - Reporte de ocupación y disponibilidad horaria por cada aula y laboratorio.
5. 👨‍🏫 **Horario y Carga Docente (PDF)**:
   - Carga horaria individual por profesor con materias, días, horas y salones.
6. 🎓 **Boletas de Notas y Constancias de Estudio (PDF)**:
   - Descarga directa para el estudiante desde su panel personal.`;
  }

  // =========================================================================
  // 9. HORARIOS DE ATENCIÓN Y REGLAS INSTITUCIONALES
  // =========================================================================
  if (
    q.includes('horario de atencion') ||
    q.includes('horario de atención') ||
    q.includes('dias de atencion') ||
    q.includes('días de atención') ||
    q.includes('apertura') ||
    q.includes('cerrado') ||
    q.includes('lunes') ||
    q.includes('domingo')
  ) {
    return `### ⏰ Horarios Institucionales de Academia Valencia (AVI)

- 📅 **Días de Actividad Académica:** De **Martes a Sábado** de 07:00 a 20:30.
- 🚫 **Días de Cierre Institucional:** **Domingos y Lunes cerrado** para mantenimiento técnico y planificación docente.
- 🕒 **Bloques Horarios Disponibles:**
  - Turno Mañana: 07:00 - 08:30 | 08:30 - 10:00 | 10:00 - 11:30 | 11:30 - 13:00
  - Turno Tarde: 13:00 - 14:30 | 14:30 - 16:00 | 16:00 - 17:30
  - Turno Noche: 17:30 - 19:00 | 19:00 - 20:30`;
  }

  // =========================================================================
  // DEFAULT CONTEXTUAL RESPONSE
  // =========================================================================
  return `### 💡 Asistente Virtual Integrado (AVI) • Academia Valencia

He procesado tu consulta sobre: **"${query}"**.

---

#### 📊 Estado del Sistema en Tiempo Real (${activeTerm}):
- 📚 **${courses.length} Cursos Registrados** en el catálogo oficial (*Comercial, Industrial, Gerencial, Artesanal*).
- 👨‍🏫 **${teachers.length} Profesores Activos** en el cuerpo docente institucional.
- 🎓 **${students.length} Estudiantes Matriculados** con Cédula de Identidad validada.
- 🏢 **${classrooms.length} Espacios Físicos (Aulas y Talleres)** auditados.
- 🛡️ **${conflicts.length === 0 ? '0 Conflictos de Horario (Sistema Optimizado ✓)' : `${conflicts.length} alertas de solapamiento detectadas`}.**

---

#### 🔍 ¿En qué procedimiento te puedo orientar?
1. **Planificador de Oferta Académica 360°** (Ciclo de 5 pasos: Aula ➔ Curso ➔ Horarios ➔ Profesor ➔ Matrícula).
2. **Gestión de Profesores** (Registro, Asignación de Cursos y Horarios PDF).
3. **Sesión del Profesor** (Mis Cursos Asignados, Registro Vigesimal de Notas 1-20 y Horarios).
4. **Matrícula Estudiantil** (Validación por Cédula, Bloqueo de Duplicados y Anti-Cruces de Horario).
5. **Auditoría de Aulas y Resolución de Conflictos**.
6. **Emisión de Reportes y Actas Oficiales en Excel/PDF**.`;
};
