import React from 'react';
import {
  LayoutDashboard,
  BookOpenCheck,
  Award,
  CalendarDays,
  Building2,
  Users,
  FileText,
  Bot,
  BellRing,
  X,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type ActiveTab =
  | 'dashboard'
  | 'enrollment'
  | 'activities'
  | 'grades'
  | 'schedule'
  | 'classrooms'
  | 'students_admin'
  | 'teachers_admin'
  | 'users_admin'
  | 'offer_admin'
  | 'course_admin'
  | 'permissions'
  | 'reports'
  | 'ai_assistant';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const { currentUser, conflicts, hasPermission } = useApp();

  const getMenuItems = () => {
    switch (currentUser.role) {
      case 'student':
        return [
          { id: 'dashboard' as ActiveTab, label: 'Resumen Principal', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'enrollment' as ActiveTab, label: 'Inscripción Cursos', icon: <BookOpenCheck className="w-5 h-5" /> },
          { id: 'activities' as ActiveTab, label: 'Actividades Extracurriculares', icon: <Calendar className="w-5 h-5" /> },
          { id: 'grades' as ActiveTab, label: 'Mis Calificaciones', icon: <Award className="w-5 h-5" /> },
          { id: 'schedule' as ActiveTab, label: 'Mi Horario Semanal', icon: <CalendarDays className="w-5 h-5" /> },
          { id: 'ai_assistant' as ActiveTab, label: 'AVI (Asistente Integrado)', icon: <Bot className="w-5 h-5 text-indigo-400" /> }
        ];

      case 'teacher':
        return [
          { id: 'dashboard' as ActiveTab, label: 'Mis Cursos Asignados', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'activities' as ActiveTab, label: 'Actividades Extracurriculares', icon: <Calendar className="w-5 h-5" /> },
          { id: 'grades' as ActiveTab, label: 'Registro de Notas', icon: <Award className="w-5 h-5" /> },
          { id: 'classrooms' as ActiveTab, label: 'Disponibilidad de Aulas', icon: <Building2 className="w-5 h-5" /> },
          { id: 'schedule' as ActiveTab, label: 'Horario e Infraestructura', icon: <CalendarDays className="w-5 h-5" /> },
          { id: 'ai_assistant' as ActiveTab, label: 'AVI (Asistente Integrado)', icon: <Bot className="w-5 h-5 text-indigo-400" /> }
        ];

      case 'subordinado':
        return [
          { id: 'dashboard' as ActiveTab, label: 'Consultas & Monitoreo', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'students_admin' as ActiveTab, label: 'Gestión de Alumnos', icon: <GraduationCap className="w-5 h-5 text-sky-400" /> },
          { id: 'teachers_admin' as ActiveTab, label: 'Gestión de Profesores', icon: <Briefcase className="w-5 h-5 text-blue-400" /> },
          { id: 'offer_admin' as ActiveTab, label: 'Planificador de Oferta', icon: <Layers className="w-5 h-5 text-indigo-400" /> },
          { id: 'users_admin' as ActiveTab, label: 'Directorio General', icon: <Users className="w-5 h-5 text-slate-400" /> },
          { id: 'enrollment' as ActiveTab, label: 'Consulta Oferta & Cupos', icon: <BookOpenCheck className="w-5 h-5" /> },
          { id: 'activities' as ActiveTab, label: 'Consulta de Actividades', icon: <Calendar className="w-5 h-5" /> },
          { id: 'grades' as ActiveTab, label: 'Consulta de Calificaciones', icon: <Award className="w-5 h-5" /> },
          { id: 'reports' as ActiveTab, label: 'Centro de Reportes Oficiales (PDF)', icon: <FileText className="w-5 h-5 text-sky-400" /> },
          { id: 'ai_assistant' as ActiveTab, label: 'AVI (Asistente Integrado)', icon: <Bot className="w-5 h-5 text-indigo-400" /> }
        ];

      case 'admin':
        return [
          { id: 'dashboard' as ActiveTab, label: 'Panel & Analíticas Globales', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'students_admin' as ActiveTab, label: 'Gestión de Alumnos', icon: <GraduationCap className="w-5 h-5 text-sky-400" /> },
          { id: 'teachers_admin' as ActiveTab, label: 'Gestión de Profesores', icon: <Briefcase className="w-5 h-5 text-blue-400" /> },
          { id: 'offer_admin' as ActiveTab, label: 'Planificador de Oferta', icon: <Layers className="w-5 h-5 text-indigo-400" /> },
          { id: 'course_admin' as ActiveTab, label: 'Catálogo de Cursos', icon: <BookOpenCheck className="w-5 h-5" /> },
          { id: 'users_admin' as ActiveTab, label: 'Directorio General', icon: <Users className="w-5 h-5 text-slate-400" /> },
          { id: 'activities' as ActiveTab, label: 'Actividades Extracurriculares', icon: <Calendar className="w-5 h-5" /> },
          { id: 'permissions' as ActiveTab, label: 'Permisos & Roles', icon: <ShieldCheck className="w-5 h-5 text-purple-400" /> },
          { id: 'classrooms' as ActiveTab, label: 'Disponibilidad de Aulas', icon: <Building2 className="w-5 h-5" />, badge: conflicts.length > 0 ? conflicts.length : undefined },
          { id: 'reports' as ActiveTab, label: 'Centro de Reportes Oficiales (PDF)', icon: <FileText className="w-5 h-5 text-sky-400" /> },
          { id: 'ai_assistant' as ActiveTab, label: 'AVI (Asistente Integrado)', icon: <Bot className="w-5 h-5 text-indigo-400" /> }
        ];
    }
  };

  const menuItems = getMenuItems();

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 w-64 p-4 border-r border-slate-800">
      {/* Mobile Close Button */}
      <div className="flex items-center justify-between lg:hidden mb-4 pb-2 border-b border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Menú Académico</span>
        <button
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Banner */}
      <div className="mb-6 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Perfil Conectado
        </p>
        <p className="text-sm font-bold text-white truncate mt-0.5">{currentUser.name}</p>
        <p className="text-xs text-indigo-400 font-mono mt-0.5">{currentUser.code}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5">
        {menuItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-slate-900 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="pt-4 mt-auto border-t border-slate-800 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <BellRing className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Servidor Activo 2026-1</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-64 max-w-xs h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
