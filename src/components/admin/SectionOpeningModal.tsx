import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Building2,
  Clock,
  GraduationCap,
  Users,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  Check,
  Calendar,
  Layers,
  Info,
  ShieldAlert,
  Search
} from 'lucide-react';
import { Course, Classroom, User, Enrollment } from '../../types';
import {
  isTimeOverlap,
  checkClassroomAvailability,
  checkTeacherScheduleConflict,
  checkStudentScheduleConflict,
  checkSectionOpeningEligibility
} from '../../utils/conflictDetector';

interface SectionOpeningModalProps {
  isOpen: boolean;
  baseCourse: Course | null;
  onClose: () => void;
  courses: Course[];
  classrooms: Classroom[];
  teachers: User[];
  students: User[];
  enrollments: Enrollment[];
  saveCourse: (course: Course) => { success: boolean; message: string };
  enrollCourse: (courseId: string, student: User) => { success: boolean; message: string };
  onSuccess?: (newCourse: Course) => void;
}

export const SectionOpeningModal: React.FC<SectionOpeningModalProps> = ({
  isOpen,
  baseCourse,
  onClose,
  courses,
  classrooms,
  teachers,
  students,
  enrollments,
  saveCourse,
  enrollCourse,
  onSuccess
}) => {
  if (!isOpen || !baseCourse) return null;

  const eligibility = useMemo(() => {
    return checkSectionOpeningEligibility(baseCourse, courses);
  }, [baseCourse, courses]);

  // Steps: 1 = Config & Cronograma, 2 = Aulas & Horarios, 3 = Profesor, 4 = Matrícula de Alumnos
  const [step, setStep] = useState<number>(1);

  // Form State
  const [newCode, setNewCode] = useState<string>(eligibility.suggestedCode);
  const [newName, setNewName] = useState<string>(eligibility.suggestedName);
  const [newCapacity, setNewCapacity] = useState<number>(baseCourse.capacity || 25);
  const [newStartDate, setNewStartDate] = useState<string>(() => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    return nextDate.toISOString().split('T')[0];
  });
  const [newEndDate, setNewEndDate] = useState<string>(() => {
    const end = new Date();
    end.setDate(end.getDate() + 7 + (baseCourse.duracionSemanas || 16) * 7);
    return end.toISOString().split('T')[0];
  });

  // Schedule & Classroom state
  const [dayOfWeek, setDayOfWeek] = useState<'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'>('Sábado');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(classrooms[0]?.id || '');
  const [modality, setModality] = useState<'Presencial' | 'Virtual' | 'Híbrida'>(baseCourse.modality || 'Presencial');

  // Teacher state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(baseCourse.teacherId || teachers[0]?.id || '');

  // Students to enroll state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Update default names when baseCourse changes
  useEffect(() => {
    if (baseCourse) {
      const el = checkSectionOpeningEligibility(baseCourse, courses);
      setNewCode(el.suggestedCode);
      setNewName(el.suggestedName);
      setNewCapacity(baseCourse.capacity || 25);
      setSelectedTeacherId(baseCourse.teacherId || teachers[0]?.id || '');
      setSelectedClassroomId(classrooms[0]?.id || '');
      setSelectedStudentIds([]);
      setStep(1);
    }
  }, [baseCourse, courses, classrooms, teachers]);

  // Selected Classroom and Teacher objects
  const selectedClassroom = useMemo(() => {
    return classrooms.find(c => c.id === selectedClassroomId);
  }, [classrooms, selectedClassroomId]);

  const selectedTeacher = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId);
  }, [teachers, selectedTeacherId]);

  // Classroom availability audit for selected Day & Time
  const classroomAudit = useMemo(() => {
    return classrooms.map(cls => {
      const check = checkClassroomAvailability(cls.id, dayOfWeek, startTime, endTime, courses);
      return {
        classroom: cls,
        isAvailable: check.isAvailable,
        conflictingCourse: check.conflictingCourse,
        timeSlot: check.timeSlot,
        reason: check.reason
      };
    });
  }, [classrooms, dayOfWeek, startTime, endTime, courses]);

  // Teacher conflict check
  const candidateSchedule = useMemo(() => ({
    id: `temp-sch-${Date.now()}`,
    dayOfWeek,
    startTime,
    endTime,
    classroomId: selectedClassroomId,
    classroomName: selectedClassroom?.name || 'Aula'
  }), [dayOfWeek, startTime, endTime, selectedClassroomId, selectedClassroom]);

  const candidateCourseObject = useMemo<Course>(() => ({
    ...baseCourse,
    id: 'temp-candidate-id',
    code: newCode,
    name: newName,
    capacity: newCapacity,
    startDate: newStartDate,
    endDate: newEndDate,
    currentWeek: 1,
    teacherId: selectedTeacherId,
    teacherName: selectedTeacher?.name || 'Por asignar',
    cedula_profesor: selectedTeacher?.cedula || '',
    schedules: [candidateSchedule]
  }), [baseCourse, newCode, newName, newCapacity, newStartDate, newEndDate, selectedTeacherId, selectedTeacher, candidateSchedule]);

  const teacherAssignedCourses = useMemo(() => {
    if (!selectedTeacherId) return [];
    return courses.filter(c => c.teacherId === selectedTeacherId || (c.teacherName && selectedTeacher?.name && c.teacherName.toLowerCase().includes(selectedTeacher.name.toLowerCase()) && c.teacherName !== 'Sin asignar'));
  }, [courses, selectedTeacherId, selectedTeacher]);

  const teacherConflict = useMemo(() => {
    if (!selectedTeacherId) return { hasConflict: false };
    return checkTeacherScheduleConflict(candidateCourseObject, teacherAssignedCourses);
  }, [candidateCourseObject, teacherAssignedCourses, selectedTeacherId]);

  // Handle Section Creation
  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();

    // Verify classroom is selected and available
    const clsCheck = checkClassroomAvailability(selectedClassroomId, dayOfWeek, startTime, endTime, courses);
    if (!clsCheck.isAvailable) {
      alert(`No es posible aperturar la sección en este recinto:\n\n${clsCheck.reason}`);
      return;
    }

    // Verify teacher conflict
    if (teacherConflict.hasConflict) {
      alert(`No es posible aperturar la sección con este profesor:\n\n${teacherConflict.reason}`);
      return;
    }

    const newSectionCourse: Course = {
      ...baseCourse,
      id: `curso-${Date.now()}`,
      id_curso: Math.floor(200 + Math.random() * 800),
      code: newCode.trim(),
      name: newName.trim(),
      capacity: newCapacity,
      enrolledCount: 0,
      teacherId: selectedTeacher?.id || baseCourse.teacherId,
      teacherName: selectedTeacher?.name || baseCourse.teacherName,
      cedula_profesor: selectedTeacher?.cedula || baseCourse.cedula_profesor || '',
      specialty: selectedTeacher?.specialty || baseCourse.specialty || 'Especialista',
      startDate: newStartDate,
      endDate: newEndDate,
      currentWeek: 1, // Reinicia en semana 1 para los nuevos inscritos
      modality,
      status: 'Activo',
      schedules: [
        {
          id: `sch-${Date.now()}`,
          dayOfWeek,
          startTime,
          endTime,
          classroomId: selectedClassroom?.id || 'aula-1',
          classroomName: selectedClassroom?.name || 'Aula General'
        }
      ]
    };

    const res = saveCourse(newSectionCourse);
    if (!res.success) {
      alert(res.message);
      return;
    }

    // Enroll selected students
    if (selectedStudentIds.length > 0) {
      selectedStudentIds.forEach(stId => {
        const stObj = students.find(s => s.id === stId);
        if (stObj) {
          enrollCourse(newSectionCourse.id, stObj);
        }
      });
    }

    if (onSuccess) {
      onSuccess(newSectionCourse);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/60">
                  Apertura de Nueva Sección
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {baseCourse.code}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                Apertura por Demanda: {baseCourse.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rule Justification Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-200">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap font-bold">
                <span>Condición Académica:</span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300">
                  👥 Población actual: {baseCourse.enrolledCount} alumnos
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300">
                  ⏳ Semanas transcurridas: {eligibility.weeksElapsed} sem.
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-sky-800 dark:text-sky-300">
                {eligibility.reason} La nueva sección heredará el contenido programático oficial, créditos y duración, permitiendo a los nuevos inscritos cursar desde la <strong>Semana 1</strong> con verificación de <strong>aulas libres y disponibilidad de profesor</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between my-4 px-2">
          {[
            { num: 1, label: '1. Cronograma & Código', icon: Layers },
            { num: 2, label: '2. Disponibilidad de Aulas', icon: Building2 },
            { num: 3, label: '3. Asignación de Profesor', icon: GraduationCap },
            { num: 4, label: '4. Matrícula de Alumnos', icon: Users }
          ].map(({ num, label, icon: Icon }) => (
            <button
              key={num}
              type="button"
              onClick={() => setStep(num)}
              className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                step === num
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : step > num
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === num
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : step > num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {step > num ? <Check className="w-3.5 h-3.5" /> : num}
              </div>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreateSection} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* STEP 1: CONFIG & CRONOGRAMA */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Identificación de la Nueva Sección
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Código de la Sección *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="Ej. COM-01-S2"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Sugerido según correlativo de secciones.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre Oficial de la Sección *
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cupos Máximos (Aforo) *
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={100}
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha de Inicio (Semana 1) *
                    </label>
                    <input
                      type="date"
                      required
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Modalidad
                    </label>
                    <select
                      value={modality}
                      onChange={(e) => setModality(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                    >
                      <option value="Presencial">Presencial</option>
                      <option value="Híbrida">Híbrida</option>
                      <option value="Virtual">Virtual</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Inherited curriculum properties */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Contenido Curricular Heredado del Programa Base
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Área / Categoría</span>
                    <strong className="text-slate-800 dark:text-slate-200">{baseCourse.categoria}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Duración</span>
                    <strong className="text-slate-800 dark:text-slate-200">{baseCourse.duracion || `${baseCourse.duracionSemanas || 16} Semanas`}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Costo Semanal</span>
                    <strong className="text-slate-800 dark:text-slate-200">${baseCourse.costoSemanal || 12} USD</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Créditos</span>
                    <strong className="text-slate-800 dark:text-slate-200">{baseCourse.credits} Créditos</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Siguiente: Disponibilidad de Aulas <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DISPONIBILIDAD DE AULAS EN VIVO */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Definir Día y Bloque Horario de la Nueva Sección
                  </h3>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    Auditoría en tiempo real de espacios
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Día de la Semana *
                    </label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                    >
                      <option value="Martes">Martes</option>
                      <option value="Miércoles">Miércoles</option>
                      <option value="Jueves">Jueves</option>
                      <option value="Viernes">Viernes</option>
                      <option value="Sábado">Sábado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hora Inicio *
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        // Auto set 2 hours duration
                        if (e.target.value === '08:00') setEndTime('10:00');
                        if (e.target.value === '10:00') setEndTime('12:00');
                        if (e.target.value === '14:00' || e.target.value === '02:00') setEndTime('16:00');
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold font-mono"
                    >
                      <option value="08:00">08:00 AM (Turno Mañana 1)</option>
                      <option value="10:00">10:00 AM (Turno Mañana 2)</option>
                      <option value="14:00">02:00 PM (Turno Tarde)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hora Fin *
                    </label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold font-mono"
                    >
                      <option value="10:00">10:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                      <option value="18:00">06:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Classroom Audit Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-500" />
                    Selecciona un Recinto Físico (Estado para {dayOfWeek} {startTime} - {endTime})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {classroomAudit.filter(a => a.isAvailable).length} de {classrooms.length} aulas libres
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  {classroomAudit.map(({ classroom, isAvailable, conflictingCourse, timeSlot }) => {
                    const isSelected = selectedClassroomId === classroom.id;

                    return (
                      <div
                        key={classroom.id}
                        onClick={() => {
                          if (!isAvailable) {
                            alert(`Este recinto está ocupado:\n\n${conflictingCourse?.name} (${conflictingCourse?.code}) en el horario ${timeSlot}`);
                            return;
                          }
                          setSelectedClassroomId(classroom.id);
                        }}
                        className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2 ${
                          !isAvailable
                            ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 opacity-70 cursor-not-allowed'
                            : isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/20 cursor-pointer'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 cursor-pointer'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {classroom.code}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {isAvailable ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-rose-600" />}
                              {isAvailable ? 'Disponible' : 'Ocupada'}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {classroom.name}
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {classroom.building} • Capacidad: {classroom.capacity} alumnos
                          </p>
                        </div>

                        {!isAvailable && (
                          <div className="p-2 rounded-xl bg-rose-100/80 dark:bg-rose-950/80 text-[10px] text-rose-900 dark:text-rose-200 leading-tight">
                            <strong>Bloqueada:</strong> Ocupada por {conflictingCourse?.name} ({timeSlot})
                          </div>
                        )}

                        {isAvailable && isSelected && (
                          <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Aula Seleccionada para esta Sección
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const clsCheck = checkClassroomAvailability(selectedClassroomId, dayOfWeek, startTime, endTime, courses);
                    if (!clsCheck.isAvailable) {
                      alert(`Debes seleccionar un aula que esté disponible en el horario ${dayOfWeek} ${startTime} - ${endTime}.`);
                      return;
                    }
                    setStep(3);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Siguiente: Asignar Profesor <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ASIGNACIÓN DE PROFESOR */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Profesor Responsable de la Nueva Sección
                </h3>
                <p className="text-xs text-slate-500">
                  Puedes asignar al mismo profesor ({baseCourse.teacherName}) o seleccionar otro especialista. El sistema valida la no superposición de su horario en <strong>{dayOfWeek} de {startTime} a {endTime}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-2xl">
                {teachers.map(tch => {
                  const isSelected = selectedTeacherId === tch.id;
                  const tchAssigned = courses.filter(c => c.teacherId === tch.id || (c.teacherName && c.teacherName.toLowerCase().includes(tch.name.toLowerCase()) && c.teacherName !== 'Sin asignar'));
                  const conflict = checkTeacherScheduleConflict(candidateCourseObject, tchAssigned);

                  return (
                    <div
                      key={tch.id}
                      onClick={() => {
                        if (conflict.hasConflict) {
                          alert(`No es posible seleccionar a este profesor por choque de horario:\n\n${conflict.reason}`);
                          return;
                        }
                        setSelectedTeacherId(tch.id);
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2.5 ${
                        conflict.hasConflict
                          ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 opacity-70 cursor-not-allowed'
                          : isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/20 cursor-pointer'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={tch.avatar}
                          alt={tch.name}
                          className="w-10 h-10 rounded-full object-cover border border-indigo-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{tch.name}</h4>
                          <p className="text-[10px] text-slate-500 truncate">{tch.specialty || tch.department || 'Especialista'}</p>
                          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">C.I: {tch.cedula || 'N/A'}</span>
                        </div>
                      </div>

                      {conflict.hasConflict ? (
                        <div className="p-1.5 bg-rose-100 dark:bg-rose-950/80 rounded-lg text-[10px] text-rose-800 dark:text-rose-200 flex items-start gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>Choque con <strong>{conflict.conflictingCourse?.name}</strong></span>
                        </div>
                      ) : isSelected ? (
                        <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Profesor Seleccionado
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold">Horario Disponible</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (teacherConflict.hasConflict) {
                      alert(`El profesor seleccionado tiene un conflicto de horario.`);
                      return;
                    }
                    setStep(4);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Siguiente: Matrícula de Alumnos <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: MATRÍCULA DE ALUMNOS (DEMANDA) */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Matricular Aspirantes / Alumnos Nuevos en Demanda
                  </h3>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedStudentIds.length} seleccionados (de {newCapacity} cupos)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Selecciona a los estudiantes que integrarán esta nueva sección. Se valida automáticamente que no tengan choques de horario con sus otras asignaturas.
                </p>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Buscar alumno por nombre, cédula o código..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Student Selection List */}
              <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 p-1">
                {students
                  .filter(st => {
                    const matches = st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      (st.cedula && st.cedula.includes(studentSearch)) ||
                      st.code.toLowerCase().includes(studentSearch.toLowerCase());
                    return matches;
                  })
                  .map(st => {
                    const isChecked = selectedStudentIds.includes(st.id);
                    const stEnrollments = enrollments.filter(e => (e.studentId === st.id || (st.cedula && e.studentCode === st.cedula)) && e.status === 'Inscrito');
                    const stCourses = courses.filter(c => stEnrollments.some(e => e.courseId === c.id));
                    const conflict = checkStudentScheduleConflict(candidateCourseObject, stCourses);

                    return (
                      <label
                        key={st.id}
                        className={`flex items-center justify-between p-2.5 text-xs transition-colors rounded-xl ${
                          conflict.hasConflict
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 text-slate-400 cursor-not-allowed'
                            : isChecked
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={conflict.hasConflict}
                            onChange={() => {
                              if (conflict.hasConflict) {
                                alert(`No es posible matricular al estudiante:\n\n${conflict.reason}`);
                                return;
                              }
                              setSelectedStudentIds(prev => {
                                if (prev.includes(st.id)) {
                                  return prev.filter(id => id !== st.id);
                                } else {
                                  if (prev.length >= newCapacity) {
                                    alert(`La capacidad máxima de la sección es de ${newCapacity} cupos.`);
                                    return prev;
                                  }
                                  return [...prev, st.id];
                                }
                              });
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
                          />
                          <div>
                            <span className={`font-bold ${conflict.hasConflict ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                              {st.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              C.I: {st.cedula || 'N/A'} • {st.code}
                            </span>
                            {conflict.hasConflict && (
                              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                                ⚠️ Choque de horario con {conflict.conflictingCourse?.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-500">{st.email}</span>
                      </label>
                    );
                  })}
              </div>

              {/* Summary of new section */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs space-y-1.5">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Resumen de la Nueva Sección a Aperturar:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-indigo-800 dark:text-indigo-300 pt-1">
                  <div><strong>Código:</strong> {newCode}</div>
                  <div><strong>Aula:</strong> {selectedClassroom?.name}</div>
                  <div><strong>Horario:</strong> {dayOfWeek} ({startTime} - {endTime})</div>
                  <div><strong>Profesor:</strong> {selectedTeacher?.name}</div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Confirmar y Aperturar Sección
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
