import React, { useState } from 'react';
import { Bell, Menu, Radio, UserCheck, ShieldCheck, User as UserIcon, Globe, LogOut, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { NotificationDrawer } from '../common/NotificationToast';
import { AcademiaValenciaLogo } from '../common/AcademiaValenciaLogo';

interface NavbarProps {
  onToggleSidebar: () => void;
  onGoToPublicSite: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onGoToPublicSite }) => {
  const {
    currentUser,
    switchRole,
    activeTerm,
    setActiveTerm,
    getUnreadNotificationsCount,
    triggerSimulatedRealTimeEvent,
    logout
  } = useApp();

  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const unreadCount = getUnreadNotificationsCount();

  const roleLabels: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
    student: { label: 'Estudiante', icon: <UserIcon className="w-3.5 h-3.5" />, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' },
    teacher: { label: 'Docente', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300' },
    subordinado: { label: 'Subordinado', icon: <FileSpreadsheet className="w-3.5 h-3.5" />, color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' },
    admin: { label: 'Administrador', icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300' }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>

            <AcademiaValenciaLogo size="sm" showSubtitle={true} />

            {/* Switch to Public Site Button */}
            <button
              onClick={onGoToPublicSite}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" /> Sitio Público / Oferta
            </button>
          </div>

          {/* Center: Role Switcher & Academic Term */}
          <div className="hidden md:flex items-center gap-3">
            {/* Academic Term */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Período:</span>
              <select
                value={activeTerm}
                onChange={e => setActiveTerm(e.target.value)}
                className="bg-transparent font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
              >
                <option value="2026-1">2026-1 (Semestre Activo)</option>
                <option value="2026-2">2026-2 (Planificación)</option>
                <option value="2025-2">2025-2 (Histórico)</option>
              </select>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Real-time simulation trigger */}
            <button
              onClick={triggerSimulatedRealTimeEvent}
              className="hidden xl:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
              title="Simular envío de evento en tiempo real"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>Simular Notificación</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Abrir notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-slate-900 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500/30"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                  {currentUser.name}
                </p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded border ${roleLabels[currentUser.role]?.color || ''}`}>
                  {roleLabels[currentUser.role]?.label || currentUser.role}
                </span>
              </div>

              <button
                onClick={logout}
                title="Cerrar Sesión"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Real-Time Notification Drawer */}
      <NotificationDrawer isOpen={isNotifDrawerOpen} onClose={() => setIsNotifDrawerOpen(false)} />
    </>
  );
};

