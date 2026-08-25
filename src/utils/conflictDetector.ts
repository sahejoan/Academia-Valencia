import { Course, CourseSchedule, ScheduleConflict } from '../types';

/**
 * Check if two time slots overlap on the same day
 * Handles accents, uppercase/lowercase and whitespace differences in day names
 * Format of hours: "08:00" - "10:00"
 */
export function isTimeOverlap(
  day1: string, start1: string, end1: string,
  day2: string, start2: string, end2: string
): boolean {
  if (!day1 || !day2 || !start1 || !end1 || !start2 || !end2) return false;

  const normalizeDay = (d: string) =>
    d.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (normalizeDay(day1) !== normalizeDay(day2)) return false;

  const toMinutes = (timeStr: string) => {
    const parts = timeStr.trim().split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return Math.max(s1, s2) < Math.min(e1, e2);
}

/**
 * Detect all conflicts in the active course catalog:
 * - Classroom double-booking
 * - Teacher double-booking
 */
export function detectSystemConflicts(courses: Course[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const c1 = courses[i];
      const c2 = courses[j];

      for (const s1 of (c1.schedules || [])) {
        for (const s2 of (c2.schedules || [])) {
          if (isTimeOverlap(s1.dayOfWeek, s1.startTime, s1.endTime, s2.dayOfWeek, s2.startTime, s2.endTime)) {
            // Check Classroom conflict
            if (s1.classroomId && s2.classroomId && s1.classroomId === s2.classroomId) {
              conflicts.push({
                type: 'classroom_overlap',
                description: `El recinto "${s1.classroomName || 'Aula'}" está ocupado simultáneamente por dos asignaturas.`,
                course1: `${c1.code} - ${c1.name}`,
                course2: `${c2.code} - ${c2.name}`,
                locationOrPerson: s1.classroomName || 'Aula',
                day: s1.dayOfWeek,
                timeSlot: `${s1.startTime} - ${s1.endTime}`
              });
            }

            // Check Teacher conflict
            const hasValidTeacher1 = c1.teacherId && c1.teacherId !== '' && c1.teacherName !== 'Sin asignar' && c1.teacherName !== 'Por definir';
            const hasValidTeacher2 = c2.teacherId && c2.teacherId !== '' && c2.teacherName !== 'Sin asignar' && c2.teacherName !== 'Por definir';

            const sameTeacher = (hasValidTeacher1 && hasValidTeacher2 && c1.teacherId === c2.teacherId) ||
              (c1.teacherName && c2.teacherName && c1.teacherName.toLowerCase() === c2.teacherName.toLowerCase() && c1.teacherName !== 'Sin asignar' && c1.teacherName !== 'Por definir');

            if (sameTeacher) {
              conflicts.push({
                type: 'teacher_overlap',
                description: `El profesor "${c1.teacherName}" tiene doble clase asignada simultáneamente en el mismo horario.`,
                course1: `${c1.code} - ${c1.name}`,
                course2: `${c2.code} - ${c2.name}`,
                locationOrPerson: c1.teacherName,
                day: s1.dayOfWeek,
                timeSlot: `${s1.startTime} - ${s1.endTime}`
              });
            }
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Check if a candidate course conflicts with a student's existing enrolled courses
 */
export function checkStudentScheduleConflict(
  candidateCourse: Course,
  studentCourses: Course[]
): { hasConflict: boolean; conflictingCourse?: Course; reason?: string } {
  for (const existing of studentCourses) {
    if (existing.id === candidateCourse.id || existing.code === candidateCourse.code) {
      return {
        hasConflict: true,
        conflictingCourse: existing,
        reason: `Ya te encuentras matriculado en el curso "${existing.name}" (${existing.code}). No es posible registrarse dos veces en el mismo curso.`
      };
    }

    for (const s1 of (candidateCourse.schedules || [])) {
      for (const s2 of (existing.schedules || [])) {
        if (isTimeOverlap(s1.dayOfWeek, s1.startTime, s1.endTime, s2.dayOfWeek, s2.startTime, s2.endTime)) {
          return {
            hasConflict: true,
            conflictingCourse: existing,
            reason: `Conflicto de horario: Este curso coincide el día ${s1.dayOfWeek} de ${s1.startTime} a ${s1.endTime} con tu curso ya matriculado "${existing.name}" (${existing.code}) que se dicta de ${s2.startTime} a ${s2.endTime}. Un alumno no puede estar en dos cursos a la misma hora.`
          };
        }
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Check if assigning a candidate course to a teacher conflicts with the teacher's other assigned courses
 */
export function checkTeacherScheduleConflict(
  candidateCourse: Course,
  teacherCourses: Course[]
): { hasConflict: boolean; conflictingCourse?: Course; reason?: string } {
  for (const existing of teacherCourses) {
    if (existing.id === candidateCourse.id) continue;

    for (const s1 of (candidateCourse.schedules || [])) {
      for (const s2 of (existing.schedules || [])) {
        if (isTimeOverlap(s1.dayOfWeek, s1.startTime, s1.endTime, s2.dayOfWeek, s2.startTime, s2.endTime)) {
          return {
            hasConflict: true,
            conflictingCourse: existing,
            reason: `Conflicto de horario: El profesor ya tiene asignado el curso "${existing.name}" (${existing.code}) el día ${s2.dayOfWeek} de ${s2.startTime} a ${s2.endTime}, el cual choca con el horario de "${candidateCourse.name}" (${s1.startTime} - ${s1.endTime}). Un profesor no puede dictar dos cursos al mismo tiempo.`
          };
        }
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Check if a specific classroom is available at a given day and time slot
 */
export function checkClassroomAvailability(
  classroomId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  courses: Course[],
  excludeCourseId?: string
): { isAvailable: boolean; conflictingCourse?: Course; timeSlot?: string; reason?: string } {
  for (const course of courses) {
    if (excludeCourseId && course.id === excludeCourseId) continue;

    for (const sch of (course.schedules || [])) {
      if (sch.classroomId === classroomId && isTimeOverlap(sch.dayOfWeek, sch.startTime, sch.endTime, dayOfWeek, startTime, endTime)) {
        return {
          isAvailable: false,
          conflictingCourse: course,
          timeSlot: `${sch.dayOfWeek} ${sch.startTime} - ${sch.endTime}`,
          reason: `El recinto ya se encuentra ocupado por "${course.name}" (${course.code}) el día ${sch.dayOfWeek} de ${sch.startTime} a ${sch.endTime}.`
        };
      }
    }
  }

  return { isAvailable: true };
}

/**
 * Business Rule for Opening New Course Sections:
 * - Minimum student population registered (e.g. >= 10 students or high demand/capacity filled)
 * - The course has started according to the calendar
 * - A minimum of two (2) weeks have elapsed since course start
 * In this scenario, opening a new section of the same course is required for new students.
 */
export interface SectionOpeningEligibility {
  isEligible: boolean;
  weeksElapsed: number;
  enrolledCount: number;
  hasMinPopulation: boolean;
  hasElapsedTwoWeeks: boolean;
  reason: string;
  suggestedSectionNumber: number;
  suggestedCode: string;
  suggestedName: string;
  existingSectionsCount: number;
}

export function checkSectionOpeningEligibility(
  course: Course,
  allCourses: Course[] = []
): SectionOpeningEligibility {
  const enrolledCount = course.enrolledCount || 0;
  // Criterio institucional: Quórum mínimo de 3 alumnos matriculados para inicio/desdoble
  const hasMinPopulation = enrolledCount >= 3 || (course.capacity > 0 && (enrolledCount / course.capacity) >= 0.5);

  // Semanas transcurridas estrictamente calculadas desde la fecha de inicio fijada por administración
  const weeksElapsed = getCourseElapsedWeeks(course);
  const hasElapsedTwoWeeks = weeksElapsed >= 2;
  const isEligible = hasMinPopulation && hasElapsedTwoWeeks;

  // Determinar siguiente número de sección
  const baseCode = course.code.replace(/-S\d+$/, '').trim();
  const relatedSections = allCourses.filter(c => 
    c.code.startsWith(baseCode) || 
    c.name.toLowerCase().includes(course.name.toLowerCase().replace(/\(secci[oó]n \d+\)/i, '').trim())
  );
  const existingSectionsCount = Math.max(1, relatedSections.length);
  const nextSectionNumber = existingSectionsCount + 1;
  const suggestedCode = `${baseCode}-S${nextSectionNumber}`;
  const cleanName = course.name.replace(/\s*\(Secci[oó]n \d+\)/i, '').trim();
  const suggestedName = `${cleanName} (Sección 0${nextSectionNumber})`;

  let reason = '';
  if (isEligible) {
    reason = `Este curso cuenta con ${enrolledCount} alumnos matriculados (supera el quórum mínimo de 3) y ya han transcurrido ${weeksElapsed} semanas desde su inicio oficial (${course.startDate}). Por política institucional, los nuevos aspirantes no deben ingresar desfasados; se autoriza la apertura de la Sección 0${nextSectionNumber}.`;
  } else if (!course.startDateSetByAdmin || !course.startDate) {
    reason = `El curso cuenta con ${enrolledCount} alumnos matriculados, pero aún no tiene fecha oficial de inicio asignada por el Administrador. La sección permanece abierta.`;
  } else if (weeksElapsed === 0) {
    reason = `El curso tiene fecha de inicio programada para el ${course.startDate} (aún no ha iniciado clases). La sección permanece abierta.`;
  } else if (!hasElapsedTwoWeeks) {
    reason = `El curso inició el ${course.startDate} y sólo lleva ${weeksElapsed} semana(s) de clases transcurridas. Requiere mínimo 2 semanas completas para cierre de sección por desfasaje.`;
  } else if (!hasMinPopulation) {
    reason = `Tiene ${weeksElapsed} semanas en curso pero la matrícula actual es de ${enrolledCount} alumnos (quórum mínimo requerido: 3 alumnos).`;
  } else {
    reason = `La sección permanece abierta para inscripciones regulares.`;
  }

  return {
    isEligible,
    weeksElapsed,
    enrolledCount,
    hasMinPopulation,
    hasElapsedTwoWeeks,
    reason,
    suggestedSectionNumber: nextSectionNumber,
    suggestedCode,
    suggestedName,
    existingSectionsCount
  };
}

/**
 * Calculates the number of elapsed weeks since the course officially started.
 * Returns 0 if:
 * 1. The administrator has NOT set the official start date (`!course.startDateSetByAdmin` or `!course.startDate`).
 * 2. The course start date is in the future (classes haven't started yet).
 */
export function getCourseElapsedWeeks(course: Course): number {
  // Only evaluate elapsed weeks if the administrator has officially scheduled the start date
  if (!course.startDateSetByAdmin || !course.startDate) {
    return 0;
  }

  try {
    const parts = course.startDate.split('-');
    let startMs: number;
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      // Construct date at 00:00:00 local time
      startMs = new Date(year, month, day).getTime();
    } else {
      startMs = new Date(course.startDate).getTime();
    }

    if (isNaN(startMs)) return 0;

    const now = new Date();
    // Normalize to today's date timestamp
    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffMs = todayMs - startMs;

    // If the start date is today or in the future, 0 weeks have elapsed (classes haven't been in progress for >= 1 week)
    if (diffMs <= 0) return 0;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
  } catch (e) {
    return 0;
  }
}

export interface CourseSectionClosedStatus {
  isSectionClosed: boolean;
  weeksElapsed: number;
  noticeMessage: string;
  nextSectionCode: string;
  nextSectionName: string;
}

/**
 * Evaluates whether a course's current section is closed for new enrollments.
 * RULE: A section is ONLY closed if:
 * 1. The administrator has set the official start date (startDateSetByAdmin === true).
 * 2. The course has already started.
 * 3. At least 2 FULL weeks (>= 14 days) have elapsed since that official start date.
 * If the course has not started or has no start date assigned by the admin, it CANNOT be closed.
 */
export function checkCourseSectionClosed(course: Course, allCourses: Course[] = []): CourseSectionClosedStatus {
  // If the admin hasn't set the start date or start date is not yet reached, it cannot be closed
  if (!course.startDateSetByAdmin || !course.startDate) {
    return {
      isSectionClosed: false,
      weeksElapsed: 0,
      noticeMessage: '',
      nextSectionCode: '',
      nextSectionName: ''
    };
  }

  const weeksElapsed = getCourseElapsedWeeks(course);
  const isSectionClosed = weeksElapsed >= 2;

  // Determine section code & name (e.g. Sección 02)
  const baseCode = course.code.replace(/-S\d+$/, '').trim();
  const relatedSections = allCourses.filter(c => 
    c.code.startsWith(baseCode) || 
    c.name.toLowerCase().includes(course.name.toLowerCase().replace(/\(secci[oó]n \d+\)/i, '').trim())
  );
  const nextSectionNum = Math.max(1, relatedSections.length) + 1;
  const nextSectionCode = `${baseCode}-S${nextSectionNum}`;
  const cleanName = course.name.replace(/\s*\(Secci[oó]n \d+\)/i, '').trim();
  const nextSectionName = `${cleanName} (Sección 0${nextSectionNum})`;

  const noticeMessage = isSectionClosed
    ? `Esta sección se encuentra cerrada para nuevas matrículas debido a que inició el ${course.startDate} y ya han transcurrido ${weeksElapsed} semanas de clases. Para evitar desfasaje académico, su inscripción será asignada automáticamente a una nueva sección (${cleanName} - Sección 0${nextSectionNum}).`
    : '';

  return {
    isSectionClosed,
    weeksElapsed,
    noticeMessage,
    nextSectionCode,
    nextSectionName
  };
}

