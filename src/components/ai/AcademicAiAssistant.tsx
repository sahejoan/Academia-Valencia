import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, RefreshCw, BookOpen, ShieldCheck, GraduationCap, Users, Building2, HelpCircle, CheckCircle2, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateAviSmartResponse } from './aviKnowledgeBase';

export const AcademicAiAssistant: React.FC = () => {
  const { currentUser, courses, grades, classrooms, conflicts, enrollments, users } = useApp();

  const [input, setInput] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin' | 'subordinado'>('all');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `¡Hola **${currentUser.name}**! 👋 Soy **AVI** (*Asistente Virtual Integrado*), tu agente asesor oficial en **Academia Valencia**.

Estoy completamente capacitado en todos los procesos, módulos y reglas operativas del sistema para cada rol:

🔹 **Planificación de Oferta 360°**: Gestión del ciclo completo (Espacio Físico/Aula ➔ Curso ➔ Horarios & Aforo ➔ Facilitador/Profesor ➔ Matrícula de Alumnos).
🔹 **Catálogo de 47 Asignaturas**: Información curricular de las 4 áreas (Comercial, Industrial, Gerencial y Artesanal).
🔹 **Rol Estudiante**: Matrícula con cédula obligatoria, prevención de materias duplicadas, detección de solapamiento de horarios (día y hora), consulta de calificaciones y horarios interactivos.
🔹 **Rol Docente**: Cursos a cargo, registro de notas (Parcial 1, 2, Prácticas, Examen Final, Asistencia), actas de notas y control de aulas.
🔹 **Rol Subordinado / Gestor**: Consultas y monitoreo de expedientes, cupos en tiempo real y descarga de reportes oficiales.
🔹 **Rol Administrador**: Gestión integral de usuarios, matriz de permisos y roles (RBAC), control de infraestructura y auditoría de conflictos.

¿Qué deseas consultar o gestionar hoy?`
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
      users
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
            availableCoursesCount: courses.length,
            classroomsCount: classrooms.length,
            activeConflictsCount: conflicts.length,
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
      role: 'student',
      label: 'Estudiantes',
      prompts: [
        '¿Cómo funciona la matrícula con cédula y prevención de duplicados?',
        '¿Qué pasa si elijo dos cursos que coinciden en día y hora?',
        '¿Cómo consulto mis notas finales y asistencia?'
      ]
    },
    {
      role: 'teacher',
      label: 'Docentes',
      prompts: [
        '¿Cómo registro las calificaciones y parciales de mis estudiantes?',
        '¿Cómo exportar las actas de notas en PDF y Excel?',
        '¿Cómo verificar el aula asignada para mi clase?'
      ]
    },
    {
      role: 'admin',
      label: 'Administradores',
      prompts: [
        '¿Cómo gestionar usuarios (crear docentes, alumnos, editar y resetear contraseñas)?',
        '¿Cómo auditar y resolver solapamientos de aulas y profesores?',
        '¿Cómo configurar la matriz de permisos y roles (RBAC)?',
        '¿Cómo agregar nuevos cursos y definir cupos máximos?'
      ]
    },
    {
      role: 'subordinado',
      label: 'Gestores / Subordinados',
      prompts: [
        '¿Cómo consultar expedientes y listados de alumnos matriculados?',
        '¿Cómo emitir reportes de cupos y oferta académica?'
      ]
    }
  ];

  const visiblePresets = selectedRoleFilter === 'all'
    ? promptPresets
    : promptPresets.filter(p => p.role === selectedRoleFilter);

  return (
    <div id="avi-assistant-container" className="space-y-4 pb-12 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AVI • Asistente Virtual Integrado</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Asistente Virtual Integrado (AVI)
          </h2>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Agente inteligente institucional capacitado en todos los roles del sistema: Estudiante, Docente, Subordinado y Administrador.
          </p>
        </div>
        <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300">
          <Bot className="w-9 h-9" />
        </div>
      </div>

      {/* Role Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
          <HelpCircle className="w-3.5 h-3.5" /> Temas por Rol:
        </span>
        <button
          onClick={() => setSelectedRoleFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedRoleFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Todos los Roles
        </button>
        <button
          onClick={() => setSelectedRoleFilter('student')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedRoleFilter === 'student'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          👨‍🎓 Estudiante
        </button>
        <button
          onClick={() => setSelectedRoleFilter('teacher')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedRoleFilter === 'teacher'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          👨‍🏫 Docente
        </button>
        <button
          onClick={() => setSelectedRoleFilter('subordinado')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedRoleFilter === 'subordinado'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          📋 Subordinado
        </button>
        <button
          onClick={() => setSelectedRoleFilter('admin')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedRoleFilter === 'admin'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          🛡️ Administrador
        </button>
      </div>

      {/* Suggested Prompts Grid */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {visiblePresets.flatMap(group =>
          group.prompts.map((p, idx) => (
            <button
              key={`${group.role}-${idx}`}
              onClick={() => setInput(p)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl whitespace-nowrap hover:border-indigo-500 hover:text-indigo-600 transition-all cursor-pointer shrink-0"
            >
              {p}
            </button>
          ))
        )}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm h-[480px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700/60'
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
            <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium py-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> AVI está analizando tu consulta...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <input
            id="input-avi-query"
            type="text"
            placeholder="Pregúntale a AVI sobre matrículas, cédula, horarios, notas, roles o permisos..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            id="btn-send-avi-query"
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

