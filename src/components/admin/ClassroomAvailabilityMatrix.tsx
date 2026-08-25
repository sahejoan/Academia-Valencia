import React, { useState, useMemo } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  Sparkles,
  Users,
  Eye,
  Info
} from 'lucide-react';
import { Classroom, Course, CourseSchedule } from '../../types';
import { isTimeOverlap } from '../../utils/conflictDetector';

interface ClassroomAvailabilityMatrixProps {
  classrooms: Classroom[];
  courses: Course[];
  onOpenSectionForClassroom?: (classroom: Classroom, day: string, startTime: string, endTime: string) => void;
}

export const ClassroomAvailabilityMatrix: React.FC<ClassroomAvailabilityMatrixProps> = ({
  classrooms,
  courses,
  onOpenSectionForClassroom
}) => {
  const days = ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
  const timeSlots = [
    { label: '08:00 AM - 10:00 AM', start: '08:00', end: '10:00', shift: 'Mañana 1' },
    { label: '10:00 AM - 12:00 PM', start: '10:00', end: '12:00', shift: 'Mañana 2' },
    { label: '02:00 PM - 04:00 PM', start: '14:00', end: '16:00', shift: 'Tarde' }
  ];

  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const types = useMemo(() => {
    const set = new Set(classrooms.map(c => c.type));
    return ['all', ...Array.from(set)];
  }, [classrooms]);

  const filteredClassrooms = useMemo(() => {
    return classrooms.filter(c => {
      const matchesType = selectedType === 'all' || c.type === selectedType;
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.building.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [classrooms, selectedType, searchQuery]);

  // Find course occupying a classroom on a day and time slot
  const findOccupantCourse = (classroomId: string, day: string, start: string, end: string): { course?: Course; schedule?: CourseSchedule } => {
    for (const course of courses) {
      for (const sch of (course.schedules || [])) {
        if (sch.classroomId === classroomId && isTimeOverlap(sch.dayOfWeek, sch.startTime, sch.endTime, day, start, end)) {
          return { course, schedule: sch };
        }
      }
    }
    return {};
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Día:
          </span>
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDay === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Todos los Días
          </button>
          {days.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDay === d
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">Todos los Tipos ({classrooms.length})</option>
            {types.filter(t => t !== 'all').map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar aula..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong>Auditoría & Mapa de Disponibilidad de Espacios Físicos:</strong> Esta matriz permite verificar con exactitud qué aulas, talleres o laboratorios están 100% libres u ocupados en cada franja horaria institucional. Útil para ubicar y aperturar nuevas secciones sin generar solapamientos.
        </div>
      </div>

      {/* Matrix Table / Grid */}
      <div className="space-y-6">
        {filteredClassrooms.map(classroom => {
          const displayedDays = selectedDay === 'all' ? days : [selectedDay as any];

          return (
            <div
              key={classroom.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
            >
              {/* Classroom Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-bold text-xs border border-indigo-200/50">
                    {classroom.code}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {classroom.name}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {classroom.type}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      {classroom.building} • Piso {classroom.floor} • Capacidad: <strong>{classroom.capacity} alumnos</strong>
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  <strong>Equipamiento:</strong> {classroom.resources.slice(0, 3).join(', ')}
                </div>
              </div>

              {/* Weekly Time Slot Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {displayedDays.map(day => (
                  <div key={day} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 text-center border-b border-slate-200 dark:border-slate-700">
                      {day}
                    </div>

                    <div className="p-2 space-y-2">
                      {timeSlots.map(slot => {
                        const { course, schedule } = findOccupantCourse(classroom.id, day, slot.start, slot.end);
                        const isOccupied = !!course;

                        return (
                          <div
                            key={slot.label}
                            className={`p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between min-h-[90px] ${
                              isOccupied
                                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                                : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono text-[10px] font-bold">
                                  {slot.start} - {slot.end}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                  isOccupied
                                    ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                                    : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                                }`}>
                                  {isOccupied ? 'Ocupada' : 'Libre'}
                                </span>
                              </div>

                              {isOccupied ? (
                                <div className="space-y-0.5">
                                  <p className="font-bold text-[11px] line-clamp-1 text-slate-900 dark:text-slate-100">
                                    {course?.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 line-clamp-1">
                                    Prof: {course?.teacherName}
                                  </p>
                                  <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium">
                                    {course?.enrolledCount}/{course?.capacity} inscritos
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                                  Recinto disponible para asignación
                                </p>
                              )}
                            </div>

                            {!isOccupied && onOpenSectionForClassroom && (
                              <button
                                onClick={() => onOpenSectionForClassroom(classroom, day, slot.start, slot.end)}
                                className="mt-2 w-full py-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                              >
                                <Sparkles className="w-2.5 h-2.5" /> Asignar Sección
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
