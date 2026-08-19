import { Course, CourseSchedule, ScheduleConflict } from '../types';

/**
 * Check if two time slots overlap on the same day
 * Format: "08:00" - "10:00"
 */
export function isTimeOverlap(
  day1: string, start1: string, end1: string,
  day2: string, start2: string, end2: string
): boolean {
  if (day1 !== day2) return false;

  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
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

      for (const s1 of c1.schedules) {
        for (const s2 of c2.schedules) {
          if (isTimeOverlap(s1.dayOfWeek, s1.startTime, s1.endTime, s2.dayOfWeek, s2.startTime, s2.endTime)) {
            // Check Classroom conflict
            if (s1.classroomId === s2.classroomId) {
              conflicts.push({
                type: 'classroom_overlap',
                description: `El recinto "${s1.classroomName}" está ocupado simultáneamente por dos asignaturas.`,
                course1: `${c1.code} - ${c1.name}`,
                course2: `${c2.code} - ${c2.name}`,
                locationOrPerson: s1.classroomName,
                day: s1.dayOfWeek,
                timeSlot: `${s1.startTime} - ${s1.endTime}`
              });
            }

            // Check Teacher conflict
            if (c1.teacherId === c2.teacherId && c1.teacherId !== '') {
              conflicts.push({
                type: 'teacher_overlap',
                description: `El docente "${c1.teacherName}" tiene doble clase asignada a la misma hora.`,
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
    if (existing.id === candidateCourse.id) {
      return {
        hasConflict: true,
        conflictingCourse: existing,
        reason: `Ya te encuentras matriculado en este curso ("${existing.name}"). No es posible registrarse dos veces en el mismo curso.`
      };
    }

    for (const s1 of candidateCourse.schedules) {
      for (const s2 of existing.schedules) {
        if (isTimeOverlap(s1.dayOfWeek, s1.startTime, s1.endTime, s2.dayOfWeek, s2.startTime, s2.endTime)) {
          return {
            hasConflict: true,
            conflictingCourse: existing,
            reason: `Conflicto de horario: Este curso coincide el ${s1.dayOfWeek} de ${s1.startTime} a ${s1.endTime} con tu curso ya matriculado "${existing.name}".`
          };
        }
      }
    }
  }

  return { hasConflict: false };
}
