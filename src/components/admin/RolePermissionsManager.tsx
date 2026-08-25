import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  UserCheck,
  GraduationCap,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
  Unlock,
  Sparkles,
  BookOpen,
  Calendar,
  Award,
  Building2,
  FileText,
  Bot,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, PermissionKey, PermissionDefinition } from '../../types';

export const RolePermissionsManager: React.FC = () => {
  const {
    permissions,
    permissionDefinitions,
    toggleRolePermission,
    setRolePermissionValue,
    resetRolePermissionsToDefault,
    currentUser,
    hasPermission
  } = useApp();

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const canManage = hasPermission('permissions.manage') || currentUser.role === 'admin';

  const roles: { role: UserRole; name: string; subtitle: string; icon: React.ReactNode; color: string; badgeBg: string }[] = [
    {
      role: 'admin',
      name: 'Administrador',
      subtitle: 'Super Usuario (Control Total)',
      icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/40 text-purple-300',
      badgeBg: 'bg-purple-950/60 text-purple-300 border-purple-800'
    },
    {
      role: 'teacher',
      name: 'Docente',
      subtitle: 'Gestión Pedagógica y Notas',
      icon: <UserCheck className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/40 text-blue-300',
      badgeBg: 'bg-blue-950/60 text-blue-300 border-blue-800'
    },
    {
      role: 'subordinado',
      name: 'Subordinado',
      subtitle: 'Consultas, Auditoría y Reportes',
      icon: <Shield className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 text-amber-300',
      badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-800'
    },
    {
      role: 'student',
      name: 'Estudiante',
      subtitle: 'Matrícula y Seguimiento',
      icon: <GraduationCap className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/40 text-emerald-300',
      badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
    }
  ];

  const categories = [
    { key: 'all', label: 'Todas las Categorías', icon: <Sliders className="w-4 h-4" /> },
    { key: 'courses', label: 'Cursos y Asignaturas', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'activities', label: 'Actividades Académicas', icon: <Calendar className="w-4 h-4" /> },
    { key: 'grades', label: 'Calificaciones y Actas', icon: <Award className="w-4 h-4" /> },
    { key: 'classrooms', label: 'Infraestructura y Aulas', icon: <Building2 className="w-4 h-4" /> },
    { key: 'reports', label: 'Reportes y Constancias (PDF)', icon: <FileText className="w-4 h-4" /> },
    { key: 'security', label: 'Seguridad y Permisos', icon: <Lock className="w-4 h-4" /> },
    { key: 'ai', label: 'Asistente AVI (IA)', icon: <Bot className="w-4 h-4" /> }
  ];

  const filteredDefinitions = permissionDefinitions.filter(def => {
    if (selectedCategoryFilter === 'all') return true;
    return def.category === selectedCategoryFilter;
  });

  const getRolePermissionCount = (role: UserRole) => {
    const roleMap = permissions[role];
    if (!roleMap) return 0;
    return Object.values(roleMap).filter(Boolean).length;
  };

  const handleToggleAllForRole = (role: UserRole, enable: boolean) => {
    permissionDefinitions.forEach(def => {
      setRolePermissionValue(role, def.key, enable);
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-200" /> Control de Acceso Granular
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Administración de Permisos y Roles Institucionales
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
              Configura de manera dinámica los privilegios, atribuciones y restricciones de cada uno de los 4 roles del sistema.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-5 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <RotateCcw className="w-4 h-4 text-sky-400" />
              <span>Restablecer Valores de Fábrica</span>
            </button>
          )}
        </div>

        {/* Roles Metric Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20">
          {roles.map(r => {
            const count = getRolePermissionCount(r.role);
            const total = permissionDefinitions.length;
            const percentage = Math.round((count / total) * 100);

            return (
              <div
                key={r.role}
                className={`rounded-2xl p-3.5 border transition-all ${
                  selectedRoleFilter === r.role ? 'bg-white/25 border-white/40 ring-2 ring-white/60' : 'bg-white/10 backdrop-blur-md border-white/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {r.icon}
                    <div>
                      <p className="text-xs font-bold text-white">{r.name}</p>
                      <p className="text-[10px] text-sky-100">{r.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-sky-100">Privilegios Activos:</span>
                  <span className="font-mono font-bold text-white">
                    {count} / {total} ({percentage}%)
                  </span>
                </div>

                <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Bar: Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Category tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategoryFilter(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === cat.key
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Role Filter Selector */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Filtrar Rol:</span>
            <select
              value={selectedRoleFilter}
              onChange={e => setSelectedRoleFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Ver los 4 Roles (Matriz Completa)</option>
              <option value="admin">Solo Administrador (Super Usuario)</option>
              <option value="teacher">Solo Docente</option>
              <option value="subordinado">Solo Subordinado (Consultas)</option>
              <option value="student">Solo Estudiante</option>
            </select>
          </div>
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <th className="py-4 px-5 text-xs font-extrabold uppercase tracking-wider min-w-[280px]">
                  Módulo / Privilegio del Sistema
                </th>
                
                {(selectedRoleFilter === 'all' || selectedRoleFilter === 'admin') && (
                  <th className="py-4 px-4 text-center min-w-[140px]">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-purple-600" /> Administrador
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Super Usuario</span>
                      {canManage && (
                        <div className="flex gap-1 mt-1 text-[9px]">
                          <button
                            onClick={() => handleToggleAllForRole('admin', true)}
                            className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                          >
                            +Todos
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                )}

                {(selectedRoleFilter === 'all' || selectedRoleFilter === 'teacher') && (
                  <th className="py-4 px-4 text-center min-w-[140px]">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-extrabold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                        <UserCheck className="w-4 h-4 text-blue-600" /> Docente
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Profesor</span>
                      {canManage && (
                        <div className="flex gap-1 mt-1 text-[9px]">
                          <button
                            onClick={() => handleToggleAllForRole('teacher', true)}
                            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                          >
                            +Todos
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                )}

                {(selectedRoleFilter === 'all' || selectedRoleFilter === 'subordinado') && (
                  <th className="py-4 px-4 text-center min-w-[140px]">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                        <Shield className="w-4 h-4 text-amber-600" /> Subordinado
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Consultas & Reportes</span>
                      {canManage && (
                        <div className="flex gap-1 mt-1 text-[9px]">
                          <button
                            onClick={() => handleToggleAllForRole('subordinado', true)}
                            className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                          >
                            +Todos
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                )}

                {(selectedRoleFilter === 'all' || selectedRoleFilter === 'student') && (
                  <th className="py-4 px-4 text-center min-w-[140px]">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                        <GraduationCap className="w-4 h-4 text-emerald-600" /> Estudiante
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Alumno</span>
                      {canManage && (
                        <div className="flex gap-1 mt-1 text-[9px]">
                          <button
                            onClick={() => handleToggleAllForRole('student', true)}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                          >
                            +Todos
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredDefinitions.map(def => {
                return (
                  <tr key={def.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Permission Info */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 mt-0.5">
                          {def.category === 'courses' && <BookOpen className="w-3.5 h-3.5 text-indigo-500" />}
                          {def.category === 'activities' && <Calendar className="w-3.5 h-3.5 text-purple-500" />}
                          {def.category === 'grades' && <Award className="w-3.5 h-3.5 text-amber-500" />}
                          {def.category === 'classrooms' && <Building2 className="w-3.5 h-3.5 text-blue-500" />}
                          {def.category === 'reports' && <FileText className="w-3.5 h-3.5 text-[#FF6600]" />}
                          {def.category === 'security' && <Lock className="w-3.5 h-3.5 text-rose-500" />}
                          {def.category === 'ai' && <Bot className="w-3.5 h-3.5 text-teal-500" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{def.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {def.description}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {def.key}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Admin Switch */}
                    {(selectedRoleFilter === 'all' || selectedRoleFilter === 'admin') && (
                      <td className="py-3.5 px-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!permissions.admin?.[def.key]}
                            onChange={() => toggleRolePermission('admin', def.key)}
                            disabled={!canManage}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 relative"></div>
                        </label>
                      </td>
                    )}

                    {/* Teacher Switch */}
                    {(selectedRoleFilter === 'all' || selectedRoleFilter === 'teacher') && (
                      <td className="py-3.5 px-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!permissions.teacher?.[def.key]}
                            onChange={() => toggleRolePermission('teacher', def.key)}
                            disabled={!canManage}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 relative"></div>
                        </label>
                      </td>
                    )}

                    {/* Subordinado Switch */}
                    {(selectedRoleFilter === 'all' || selectedRoleFilter === 'subordinado') && (
                      <td className="py-3.5 px-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!permissions.subordinado?.[def.key]}
                            onChange={() => toggleRolePermission('subordinado', def.key)}
                            disabled={!canManage}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 relative"></div>
                        </label>
                      </td>
                    )}

                    {/* Student Switch */}
                    {(selectedRoleFilter === 'all' || selectedRoleFilter === 'student') && (
                      <td className="py-3.5 px-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!permissions.student?.[def.key]}
                            onChange={() => toggleRolePermission('student', def.key)}
                            disabled={!canManage}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                        </label>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Institutional Security Notice */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-bold text-slate-900 dark:text-slate-200">
            Sincronización en Tiempo Real de Políticas de Seguridad
          </p>
          <p>
            Cualquier cambio realizado en esta matriz se persiste de forma inmediata y condiciona la visibilidad de botones, formularios de creación/edición, descargas y navegación de los 4 roles en toda la plataforma.
          </p>
        </div>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Restablecer Permisos Institucionales?
                </h4>
                <p className="text-xs text-slate-500">
                  Se restaurarán las políticas recomendadas para los 4 roles.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              Esta acción revertirá las asignaciones manuales a las reglas por defecto (Admin: total, Docente: notas/actas/cursos, Subordinado: consultas/reportes, Estudiante: matrícula/notas).
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetRolePermissionsToDefault();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30"
              >
                Confirmar Restauración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
