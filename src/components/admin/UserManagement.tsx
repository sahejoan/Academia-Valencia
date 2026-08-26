import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit3,
  Key,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  UserCheck,
  Mail,
  Phone,
  Building2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  FileText,
  Layers,
  Sparkles,
  Fingerprint
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { generateUsersDirectoryPDF } from '../../utils/pdfExport';
import { formatDecimal } from '../../utils/gradeHelpers';

export const UserManagement: React.FC = () => {
  const {
    users,
    currentUser,
    courses,
    enrollments,
    grades,
    saveUser,
    deleteUser,
    resetUsersToDefault,
    hasPermission
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'cedula' | 'role' | 'code'>('name');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canManageUsers = hasPermission('users.manage') || currentUser.role === 'admin';

  // Role Badges Config
  const ROLE_CONFIG: Record<
    UserRole,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    admin: {
      label: 'Administrador (Rectoría)',
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
      icon: <ShieldCheck className="w-3.5 h-3.5" />
    },
    teacher: {
      label: 'Profesor (Docente)',
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/30',
      icon: <GraduationCap className="w-3.5 h-3.5" />
    },
    subordinado: {
      label: 'Subordinado (Gestor)',
      bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/30',
      icon: <Briefcase className="w-3.5 h-3.5" />
    },
    student: {
      label: 'Estudiante (Alumno)',
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      icon: <UserCheck className="w-3.5 h-3.5" />
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = users.length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    const students = users.filter(u => u.role === 'student').length;
    const subordinados = users.filter(u => u.role === 'subordinado').length;
    const admins = users.filter(u => u.role === 'admin').length;
    return { total, teachers, students, subordinados, admins };
  }, [users]);

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !q ||
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          (user.cedula && user.cedula.toLowerCase().includes(q)) ||
          (user.code && user.code.toLowerCase().includes(q)) ||
          (user.career && user.career.toLowerCase().includes(q)) ||
          (user.department && user.department.toLowerCase().includes(q));
        return matchesRole && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'cedula') return (a.cedula || '').localeCompare(b.cedula || '');
        if (sortBy === 'role') return a.role.localeCompare(b.role);
        if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
        return 0;
      });
  }, [users, roleFilter, searchTerm, sortBy]);

  // User Stats Helpers
  const getUserAcademicInfo = (user: User) => {
    if (user.role === 'teacher') {
      const taughtCourses = courses.filter(c => c.teacherId === user.id || c.teacherName === user.name);
      return {
        label: 'Cursos Asignados',
        count: taughtCourses.length,
        items: taughtCourses.map(c => c.name)
      };
    }
    if (user.role === 'student') {
      const studentEnrolls = enrollments.filter(e => e.studentId === user.id);
      const studentGrades = grades.filter(g => g.studentId === user.id);
      const avg =
        studentGrades.length > 0
          ? formatDecimal(studentGrades.reduce((sum, g) => sum + g.finalGrade, 0) / studentGrades.length, 1, false)
          : null;
      return {
        label: 'Cursos Inscritos',
        count: studentEnrolls.length,
        avgGrade: avg
      };
    }
    return null;
  };

  const handleOpenCreate = () => {
    setEditingUser({
      role: 'student',
      name: '',
      email: '',
      cedula: '',
      password: 'Valencia' + Math.floor(1000 + Math.random() * 9000),
      phone: '',
      career: 'Desarrollo de Software e IA',
      department: 'Área Tecnológica e Informática'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser({ ...user });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editingUser.name || editingUser.name.trim().length < 3) {
      setFormError('El nombre completo es obligatorio y debe tener al menos 3 caracteres.');
      return;
    }
    if (!editingUser.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingUser.email.trim())) {
      setFormError('Introduce un correo electrónico válido (ejemplo: usuario@valencia.edu).');
      return;
    }
    if (!editingUser.cedula || editingUser.cedula.trim().length < 5) {
      setFormError('La cédula de identidad es obligatoria (mínimo 5 dígitos).');
      return;
    }

    const result = saveUser(editingUser as User);
    if (!result.success) {
      setFormError(result.message);
      return;
    }

    setIsModalOpen(false);
    setEditingUser(null);
    setFormError(null);
  };

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    const res = deleteUser(userToDelete.id);
    if (res.success) {
      setUserToDelete(null);
    }
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser || !newPassword || newPassword.length < 4) {
      return;
    }
    const updated: User = {
      ...passwordResetUser,
      password: newPassword
    };
    saveUser(updated);
    setPasswordResetUser(null);
    setNewPassword('');
    setCopiedPass(false);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let pass = 'Val';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Gestión de Usuarios del Sistema
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Directorio Integral
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Crea, edita, audita cédulas y gestiona credenciales para docentes, alumnos, gestores y administradores.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => generateUsersDirectoryPDF(filteredUsers)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#FF6600] bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-900/50 rounded-xl transition cursor-pointer"
              title="Descargar directorio oficial en PDF"
            >
              <FileText className="w-4 h-4 text-[#FF6600]" />
              <span>Directorio Oficial (PDF)</span>
            </button>

            {canManageUsers && (
              <>
                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 rounded-xl transition"
                  title="Restaurar a usuarios por defecto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restaurar Datos</span>
                </button>

                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md shadow-indigo-600/25 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Usuario</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Usuarios</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</div>
          </div>
          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" /> Profesores
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.teachers}</div>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Estudiantes
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{stats.students}</div>
          </div>
          <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
            <div className="text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Subordinados
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{stats.subordinados}</div>
          </div>
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 col-span-2 sm:col-span-1">
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Admins
            </div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{stats.admins}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, cédula, correo o código..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full lg:w-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              roleFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            onClick={() => setRoleFilter('teacher')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'teacher'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Profesores ({stats.teachers})
          </button>
          <button
            onClick={() => setRoleFilter('student')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'student'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Alumnos ({stats.students})
          </button>
          <button
            onClick={() => setRoleFilter('subordinado')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'subordinado'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Subordinados ({stats.subordinados})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'admin'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admins ({stats.admins})
          </button>
        </div>

        {/* Sort and View Mode */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="name">Ordenar: Nombre (A-Z)</option>
            <option value="cedula">Ordenar: Cédula</option>
            <option value="role">Ordenar: Rol</option>
            <option value="code">Ordenar: Código</option>
          </select>
        </div>
      </div>

      {/* Users List / Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No se encontraron usuarios</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            No hay ningún usuario que coincida con el criterio de búsqueda "{searchTerm}" o el filtro seleccionado.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl hover:bg-indigo-100 transition"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Usuario / Identidad</th>
                  <th className="py-3.5 px-4">Cédula</th>
                  <th className="py-3.5 px-4">Rol & Permisos</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4">Programa / Área</th>
                  <th className="py-3.5 px-4">Datos Académicos</th>
                  {canManageUsers && <th className="py-3.5 px-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredUsers.map(user => {
                  const roleConfig = ROLE_CONFIG[user.role];
                  const academic = getUserAcademicInfo(user);
                  const isCurrent = currentUser.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                        isCurrent ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {user.name}
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-indigo-500 text-white rounded">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                              {user.code || user.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cédula */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold border border-slate-200 dark:border-slate-700">
                          <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.cedula || 'Sin Cédula'}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleConfig.bg} ${roleConfig.border}`}
                        >
                          {roleConfig.icon}
                          {roleConfig.label}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs">
                          <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[160px]">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Area / Career */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          <div className="font-medium text-slate-700 dark:text-slate-300">
                            {user.career || user.specialty || 'Área General'}
                          </div>
                          <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                            {user.department || 'Academia Valencia'}
                          </div>
                        </div>
                      </td>

                      {/* Academic Data */}
                      <td className="py-3.5 px-4">
                        {academic ? (
                          <div className="text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {academic.count} {academic.label}
                            </span>
                            {academic.avgGrade && (
                              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                Promedio: {academic.avgGrade} pts
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Personal Administrativo</span>
                        )}
                      </td>

                      {/* Actions */}
                      {canManageUsers && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setPasswordResetUser(user);
                                setNewPassword('');
                                setCopiedPass(false);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition"
                              title="Resetear o asignar contraseña"
                            >
                              <Key className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                              title="Editar datos del usuario"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setUserToDelete(user)}
                              disabled={isCurrent}
                              className={`p-1.5 rounded-lg transition ${
                                isCurrent
                                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                              }`}
                              title={isCurrent ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingUser.id ? 'Editar Información del Usuario' : 'Registrar Nuevo Usuario'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingUser.id
                      ? `Modificando registro institucional de ${editingUser.name}`
                      : 'Ingresa los datos para dar de alta una nueva cuenta en el sistema'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingUser(null);
                  setFormError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rol en el Sistema *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['student', 'teacher', 'subordinado', 'admin'] as UserRole[]).map(roleOption => {
                    const isSelected = editingUser.role === roleOption;
                    const conf = ROLE_CONFIG[roleOption];
                    return (
                      <button
                        type="button"
                        key={roleOption}
                        onClick={() => setEditingUser({ ...editingUser, role: roleOption })}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                          isSelected
                            ? `${conf.bg} ${conf.border} ring-2 ring-indigo-500`
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {conf.icon}
                        <span className="text-center">
                          {roleOption === 'student'
                            ? 'Estudiante'
                            : roleOption === 'teacher'
                            ? 'Profesor'
                            : roleOption === 'subordinado'
                            ? 'Subordinado'
                            : 'Admin'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={editingUser.name || ''}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    placeholder="Ej. Prof. María Rodríguez"
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cédula de Identidad * (No repetible)
                  </label>
                  <input
                    type="text"
                    value={editingUser.cedula || ''}
                    onChange={e => setEditingUser({ ...editingUser, cedula: e.target.value })}
                    placeholder="Ej. V-20.123.456 o 20123456"
                    required
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico * (Login)
                  </label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    placeholder="usuario@valencia.edu"
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                    placeholder="+58 412 1234567"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Initial Password (if new user) */}
              {!editingUser.id && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña Inicial *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editingUser.password || ''}
                      onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                      placeholder="Mínimo 4 caracteres"
                      required
                      className="w-full px-3 py-2 pr-10 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Area & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Programa / Área
                  </label>
                  <input
                    type="text"
                    value={editingUser.career || editingUser.specialty || ''}
                    onChange={e =>
                      setEditingUser({
                        ...editingUser,
                        career: e.target.value,
                        specialty: e.target.value
                      })
                    }
                    placeholder="Ej. Desarrollo de Software e IA"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento / Área
                  </label>
                  <input
                    type="text"
                    value={editingUser.department || ''}
                    onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                    placeholder="Ej. Área de Tecnología e Informática"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Avatar URL (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL de Fotografía / Avatar (Opcional)
                </label>
                <input
                  type="text"
                  value={editingUser.avatar || ''}
                  onChange={e => setEditingUser({ ...editingUser, avatar: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                    setFormError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md shadow-indigo-600/25 transition"
                >
                  {editingUser.id ? 'Guardar Cambios' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PASSWORD RESET MODAL */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Resetear Contraseña
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {passwordResetUser.name} ({passwordResetUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPasswordResetUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nueva Contraseña de Acceso
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Escribe la nueva contraseña..."
                    required
                    minLength={4}
                    className="w-full px-3 py-2 pr-10 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar Clave Aleatoria</span>
                </button>

                {newPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newPassword);
                      setCopiedPass(true);
                      setTimeout(() => setCopiedPass(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPass ? 'Copiado' : 'Copiar clave'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPassword || newPassword.length < 4}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 active:scale-98 rounded-xl shadow-md shadow-indigo-600/25 transition"
                >
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-3 bg-red-100 dark:bg-red-950/50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Eliminar Usuario?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta acción es irreversible y removerá el acceso al portal.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <img
                src={userToDelete.avatar}
                alt={userToDelete.name}
                className="w-10 h-10 rounded-full object-cover border"
              />
              <div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white">
                  {userToDelete.name}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {userToDelete.cedula || userToDelete.email}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Se desvincularán las matrículas, actas asociadas y credenciales de acceso de este usuario en Academia Valencia.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/25 transition"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE TO INITIAL DATA CONFIRMATION */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/50 rounded-xl">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Restaurar Directorio
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Volver al listado institucional de usuarios por defecto
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              ¿Deseas restaurar la lista de usuarios a los valores de demostración iniciales de Academia Valencia?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetUsersToDefault();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/25 transition"
              >
                Restaurar Usuarios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
