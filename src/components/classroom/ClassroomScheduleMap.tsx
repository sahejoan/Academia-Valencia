import React, { useState } from 'react';
import { Building2, Cpu, CheckCircle2, Wrench, AlertTriangle, Clock, Plus, Filter, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ClassroomScheduleMap: React.FC = () => {
  const { classrooms, courses, conflicts } = useApp();
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');

  const buildings = Array.from(new Set(classrooms.map(c => c.building)));

  const filteredClassrooms = selectedBuilding === 'all'
    ? classrooms
    : classrooms.filter(c => c.building === selectedBuilding);

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
            <Building2 className="w-3.5 h-3.5 text-sky-200" /> Infraestructura & Espacios
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Disponibilidad de Aulas e Infraestructura
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
            Visualización de aforos, equipamiento tecnológico y cuadrícula de ocupación de recintos académicos.
          </p>
        </div>
      </div>

      {/* Building Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Filtrar por Edificio:</span>
          <button
            onClick={() => setSelectedBuilding('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedBuilding === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos ({classrooms.length})
          </button>
          {buildings.map(b => (
            <button
              key={b}
              onClick={() => setSelectedBuilding(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBuilding === b
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Classroom Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClassrooms.map(cls => {
          // Find courses assigned to this classroom
          const assignedCourses = courses.flatMap(c =>
            c.schedules
              .filter(s => s.classroomId === cls.id)
              .map(s => ({ ...s, courseName: c.name, courseCode: c.code, teacher: c.teacherName }))
          );

          const hasConflict = conflicts.some(conf => conf.locationOrPerson === cls.name);

          return (
            <div
              key={cls.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all ${
                hasConflict
                  ? 'border-amber-400 dark:border-amber-700 bg-amber-50/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                    {cls.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {cls.name}
                  </h3>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                  cls.status === 'Disponible'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {cls.status === 'Disponible' ? <CheckCircle2 className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}
                  {cls.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                {cls.building} • Piso {cls.floor}
              </p>

              <div className="mt-3 flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                <span className="font-semibold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-500" /> Aforo Máximo:
                </span>
                <span className="font-bold">{cls.capacity} Personas</span>
              </div>

              {/* Equipment Tags */}
              <div className="mt-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Recursos Disponibles
                </span>
                <div className="flex flex-wrap gap-1">
                  {cls.resources.map((r, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assigned Schedule Summary */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Ocupación Académica Semanal ({assignedCourses.length} Clases)
                </span>

                {assignedCourses.length === 0 ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 italic">
                    Sin clases programadas (Recinto Libre).
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {assignedCourses.map(ac => (
                      <div
                        key={ac.id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs border border-slate-100 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                          <span>{ac.courseCode} - {ac.courseName}</span>
                          <span className="text-[10px] text-indigo-600">{ac.dayOfWeek}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                          <span>{ac.startTime} - {ac.endTime}</span>
                          <span className="italic">{ac.teacher}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
