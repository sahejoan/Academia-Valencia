import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  RefreshCw,
  BookOpen,
  ShieldCheck,
  GraduationCap,
  Users,
  Building2,
  HelpCircle,
  CheckCircle2,
  Layers,
  Award,
  Calendar,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateAviSmartResponse } from './aviKnowledgeBase';

export const AcademicAiAssistant: React.FC = () => {
  const { currentUser, courses, grades, classrooms, conflicts, enrollments, users, activeTerm } = useApp();

  const [input, setInput] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin' | 'subordinado'>('all');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `¡Hola **${currentUser.name}**! 👋 Soy **AVI** (*Asistente Virtual Integrado*), tu agente oficial de inteligencia artificial y asesor integral de **Academia Valencia**.

He sido completamente entrenado con **TODO el funcionamiento operativo y procedimientos del sistema**:

🏛️ **Planificador de Oferta 360°**: Asistente institucional en 5 fases continuas (Espacio Físico/Aula ➔ Curso a Dictar de 47 asignaturas ➔ Horarios & Cupos ➔ Facilitador/Profesor ➔ Matrícula con Quórum $\\ge 3$ alumnos).
👨‍🏫 **Gestión y Sesión Docente**: Administración del cuerpo profesoral con asignación de carga horaria, y para docentes: *Mis Cursos Asignados*, *Registro Vigesimal de Notas (1 a 20 pts)* con 4 evaluaciones continuas ($25\\%$ c/u), control de asistencia y descarga de Actas Oficiales (PDF).
🎓 **Matrícula y Sesión Estudiantil**: Inscripción con Cédula obligatoria, **bloqueo estricto de duplicados**, **prevención de cruces de horario** (día y hora), Kardex Digital interactivo y constancias de estudio.
🏢 **Infraestructura & Solapamientos**: Directorio de aulas y talleres con resolución automática de conflictos en 1-clic.
📊 **Centro de Reportes**: Exportación a Excel (.xlsx) y PDF de Sábanas de Calificaciones, Catálogo de Cursos y Horarios Docentes.

Haz clic en las preguntas sugeridas o escribe cualquier duda para guiarte paso a paso.`
    }
  ]);
  const [loading, setLoading] = useState(false);

  const generateOfflineResponse = (query: string): string => {
    return generateAviSmartResponse(query, {
      currentUser,
      courses,
      classrooms,
      conflicts,
      enrollments,
      users,
      activeTerm
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/academic-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userQuery,
          userRole: currentUser.role,
          contextData: {
            userName: currentUser.name,
            userRole: currentUser.role,
            career: currentUser.career,
            cedula: currentUser.cedula,
            activeTerm,
            availableCoursesCount: courses.length,
            classroomsCount: classrooms.length,
            activeConflictsCount: conflicts.length,
            teachersCount: users.filter(u => u.role === 'teacher').length,
            studentsCount: users.filter(u => u.role === 'student').length,
            coursesSummary: courses.slice(0, 8).map(c => ({
              code: c.code,
              name: c.name,
              teacher: c.teacherName,
              capacity: c.capacity,
              enrolled: c.enrolledCount,
              modality: c.modality
            }))
          }
        })
      });

      const data = await response.json();
      if (data.error || !data.response) {
        // Use smart local fallback knowledge
        const offlineReply = generateOfflineResponse(userQuery);
        setMessages(prev => [
          ...prev,
          { sender: 'ai', text: offlineReply }
        ]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: data.response }]);
      }
    } catch (err) {
      // Offline fallback
      const offlineReply = generateOfflineResponse(userQuery);
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: offlineReply }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const promptPresets = [
    {
      role: 'admin',
      label: 'Administrador / Oferta',
      prompts: [
        '¿Cómo funciona el Planificador de Oferta en 5 pasos?',
        '¿Cómo gestionar profesores, asignar materias y descargar su carga en PDF?',
        '¿Cómo auditar y resolver solapamientos de aulas y profesores?',
        '¿Cómo exportar las sábanas de notas oficiales en Excel y PDF?'
      ]
    },
    {
      role: 'teacher',
      label: 'Docentes / Calificaciones',
      prompts: [
        '¿Cómo registrar las 4 evaluaciones vigesimales (1 a 20 pts) y asistencia?',
        '¿Cómo ver los estudiantes inscritos y quórum en Mis Cursos Asignados?',
        '¿Cómo emitir avisos en tiempo real a mis alumnos?',
        '¿Cómo descargar el Acta Oficial de Notas en PDF?'
      ]
    },
    {
      role: 'student',
      label: 'Estudiantes / Matrícula',
      prompts: [
        '¿Cómo funciona la matrícula con cédula y prevención de duplicados?',
        '¿Qué ocurre si inscribo dos cursos que coinciden en el mismo día y hora?',
        '¿Cómo consultar mis notas por evaluación y kardex académico?',
        '¿Cómo descargar mi constancia de estudio en PDF?'
      ]
    },
    {
      role: 'subordinado',
      label: 'Control de Estudios',
      prompts: [
        '¿Cómo monitorear el quórum y expedientes de estudiantes matriculados?',
        '¿Cuáles son las 4 áreas del catálogo de 47 asignaturas?'
      ]
    }
  ];

  const visiblePresets = selectedRoleFilter === 'all'
    ? promptPresets
    : promptPresets.filter(p => p.role === selectedRoleFilter);

  return (
    <div id="avi-assistant-container" className="space-y-4 pb-12 max-w-4xl mx-auto animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex items-center justify-between relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>AVI • Asistente Virtual Inteligente Institucional</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Asistente Virtual Inteligente (AVI)
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl leading-relaxed">
            Entrenado con todos los procedimientos operativos del sistema: Planificador de Oferta, Gestión de Profesores, Carga Vigesimal de Notas (1-20), Matrícula con Cédula, Aulas y Reportes.
          </p>
        </div>
        <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white relative z-10">
          <Bot className="w-9 h-9 text-sky-200" />
        </div>
      </div>

      {/* Role Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
          <HelpCircle className="w-3.5 h-3.5" /> Temas por Módulo:
        </span>
        <button
          onClick={() => setSelectedRoleFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedRoleFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Todos los Módulos
        </button>
        <button
          onClick={() => setSelectedRoleFilter('admin')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedRoleFilter === 'admin'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          🛡️ Administrador & Oferta
        </button>
        <button
          onClick={() => setSelectedRoleFilter('teacher')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedRoleFilter === 'teacher'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          👨‍🏫 Docente & Notas
        </button>
        <button
          onClick={() => setSelectedRoleFilter('student')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedRoleFilter === 'student'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          👨‍🎓 Estudiante & Matrícula
        </button>
        <button
          onClick={() => setSelectedRoleFilter('subordinado')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedRoleFilter === 'subordinado'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          📋 Control de Estudios
        </button>
      </div>

      {/* Suggested Prompts Grid */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {visiblePresets.flatMap(group =>
          group.prompts.map((p, idx) => (
            <button
              key={`${group.role}-${idx}`}
              onClick={() => setInput(p)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl whitespace-nowrap hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer shrink-0"
            >
              {p}
            </button>
          ))
        )}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm h-[520px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700/60 shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium py-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> AVI está consultando la base de conocimiento del sistema...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <input
            id="input-avi-query"
            type="text"
            placeholder="Pregúntale a AVI sobre oferta académica, profesores, notas vigesimales, matrículas, cédula, aulas..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            id="btn-send-avi-query"
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Consultar
          </button>
        </form>
      </div>
    </div>
  );
};
