import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Minus,
  Maximize2,
  Minimize2,
  RefreshCw,
  BookOpen,
  Building2,
  GraduationCap,
  Users,
  Award,
  ShieldCheck,
  Calendar,
  Layers,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateAviSmartResponse } from './aviKnowledgeBase';

export const AviFloatingChat: React.FC = () => {
  const { currentUser, courses, classrooms, conflicts, enrollments, users } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `¡Hola **${currentUser.name}**! 👋 Soy **AVI** (*Asistente Virtual Integrado*), tu agente asesor institucional de **Academia Valencia**.

Estoy plenamente entrenado en todas las funciones y procesos del sistema:
- 🏛️ **Planificación de Oferta** (Aulas ➔ Cursos ➔ Horarios ➔ Profesores ➔ Matrícula)
- 📚 **Catálogo de 47 Cursos** (*Comercial, Industrial, Gerencial, Artesanal*)
- 🎓 **Matrícula y Control por Cédula** (Prevención de duplicados y cruces)
- 📊 **Calificaciones, Asistencia y Kardex** (Parciales, prácticas y actas)
- 👥 **Gestión de Usuarios y Permisos RBAC**
- 🏢 **Aulas, Talleres y Detección de Conflictos**

¿En qué puedo ayudarte hoy?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const queryText = (customPrompt || input).trim();
    if (!queryText || loading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: queryText, time: currentTime }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/academic-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          userRole: currentUser.role,
          contextData: {
            userName: currentUser.name,
            userRole: currentUser.role,
            career: currentUser.career,
            cedula: currentUser.cedula,
            availableCoursesCount: courses.length,
            classroomsCount: classrooms.length,
            activeConflictsCount: conflicts.length,
            totalUsersCount: users.length,
            totalEnrollmentsCount: enrollments.length
          }
        })
      });

      const data = await response.json();
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (data.error || !data.response) {
        const offlineReply = generateAviSmartResponse(queryText, {
          currentUser,
          courses,
          classrooms,
          conflicts,
          enrollments,
          users
        });
        setMessages(prev => [...prev, { sender: 'ai', text: offlineReply, time: replyTime }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: data.response, time: replyTime }]);
      }
    } catch (err) {
      const offlineReply = generateAviSmartResponse(queryText, {
        currentUser,
        courses,
        classrooms,
        conflicts,
        enrollments,
        users
      });
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { sender: 'ai', text: offlineReply, time: replyTime }]);
    } finally {
      setLoading(false);
      if (!isOpen) {
        setHasUnread(true);
      }
    }
  };

  const quickPrompts = [
    { label: '🏛️ ¿Cómo aperturar una oferta?', query: '¿Cómo funciona el flujo de ofertar un curso con aula, horario, profesor y matrícula de alumnos?' },
    { label: '🎓 ¿Cómo funciona la matrícula?', query: '¿Cómo funciona el proceso de matrícula con cédula de identidad y validación de duplicados?' },
    { label: '📊 ¿Cómo se evalúan las notas?', query: '¿Cuál es la escala de calificaciones y cómo se registran los parciales y asistencia?' },
    { label: '🏢 ¿Cómo detectar solapamientos?', query: '¿Cómo detecta y previene el sistema los cruces de horarios de aulas y profesores?' }
  ];

  return (
    <div id="avi-floating-assistant" className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Floating Action Launcher Button (When closed) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setHasUnread(false);
          }}
          className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white rounded-full shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300 border-2 border-indigo-400/40 cursor-pointer"
          title="Abrir Asistente Virtual Integrado (AVI)"
        >
          {/* Subtle Pulse Ring */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-75 blur-sm group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse pointer-events-none" />

          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <Bot className="w-5 h-5 text-indigo-300 group-hover:rotate-12 transition-transform duration-300" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full ring-2 ring-indigo-900 animate-ping" />
            )}
          </div>

          <div className="relative text-left pr-1 hidden sm:block">
            <span className="text-xs font-black tracking-wide block leading-none text-white flex items-center gap-1">
              AVI <Sparkles className="w-3 h-3 text-amber-300" />
            </span>
            <span className="text-[10px] text-blue-200 font-medium leading-none mt-0.5 block">
              Asistente Virtual Integrado
            </span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal (When Open) */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
            isExpanded
              ? 'fixed inset-4 sm:inset-10 z-50 w-auto h-auto'
              : 'w-[92vw] sm:w-96 md:w-[420px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 flex items-center justify-between border-b border-indigo-800/40 relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/60 border border-indigo-400/40 flex items-center justify-center shadow-inner">
                  <Bot className="w-6 h-6 text-indigo-200" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold text-white">AVI</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-200 font-bold border border-indigo-400/30">
                    Asistente Virtual Integrado
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En línea • Soporte Académico 24/7
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                title={isExpanded ? 'Restaurar tamaño' : 'Maximizar ventana'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                title="Minimizar / Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 p-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp.query)}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer shadow-xs"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/30">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  <div className="whitespace-pre-line prose dark:prose-invert prose-xs max-w-none">
                    {m.text}
                  </div>
                  <span
                    className={`block text-[9px] mt-1.5 font-medium ${
                      m.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-none p-3.5 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                  <span>AVI está procesando tu respuesta...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Footer */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta a AVI sobre cursos, aulas, horarios, notas..."
                className="flex-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
              <span>Academia Valencia • Asistente Virtual Integrado</span>
              <button
                type="button"
                onClick={() => {
                  setMessages([
                    {
                      sender: 'ai',
                      text: `Conversación reiniciada. ¿En qué más puedo orientarte sobre la gestión académica?`,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ]);
                }}
                className="text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Limpiar chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
