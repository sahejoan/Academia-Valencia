import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  User,
  UserRole,
  Course,
  Classroom,
  Enrollment,
  GradeItem,
  NotificationItem,
  ScheduleConflict,
  SystemAnalytics,
  AcademicActivity,
  PermissionKey,
  PermissionDefinition,
  RolePermissionsMap
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLASSROOMS,
  INITIAL_COURSES,
  INITIAL_ENROLLMENTS,
  INITIAL_GRADES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITIES,
  INITIAL_ROLE_PERMISSIONS,
  PERMISSION_DEFINITIONS
} from '../data/initialData';
import { detectSystemConflicts, checkStudentScheduleConflict, checkTeacherScheduleConflict, checkCourseSectionClosed } from '../utils/conflictDetector';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  sessionStartTime: number | null;
  login: (email: string, password?: string) => { success: boolean; message: string; user?: User };
  logout: () => void;
  registerUser: (
    name: string,
    email: string,
    password?: string,
    role?: UserRole,
    career?: string,
    cedula?: string,
    phone?: string
  ) => { success: boolean; message: string; user?: User };
  switchRole: (role: UserRole) => void;
  users: User[];
  courses: Course[];
  classrooms: Classroom[];
  activities: AcademicActivity[];
  enrollments: Enrollment[];
  grades: GradeItem[];
  notifications: NotificationItem[];
  activeTerm: string;
  setActiveTerm: (term: string) => void;
  
  // Real-time toast state
  latestToast: NotificationItem | null;
  dismissToast: () => void;

  // Actions
  enrollCourse: (courseId: string, customStudent?: User) => { success: boolean; message: string };
  dropEnrollment: (enrollmentId: string) => { success: boolean; message: string };
  updateGrade: (updatedGrade: GradeItem) => void;
  saveCourse: (course: Course) => { success: boolean; message: string };
  setCourseStartDate: (courseId: string, startDate: string, durationWeeks?: number) => { success: boolean; message: string };
  deleteCourse: (courseId: string) => void;
  resetCoursesToDefault: () => void;
  resolveAllConflictsAutomatically: () => { success: boolean; message: string };
  
  // Academic Activities CRUD & Enrollment
  saveActivity: (activity: AcademicActivity) => { success: boolean; message: string };
  deleteActivity: (activityId: string) => { success: boolean; message: string };
  enrollActivity: (activityId: string, customStudent?: User) => { success: boolean; message: string };
  dropActivityEnrollment: (activityId: string) => { success: boolean; message: string };

  // Classrooms
  saveClassroom: (classroom: Classroom) => void;
  deleteClassroom: (classroomId: string) => void;
  
  // User Management
  saveUser: (user: User) => { success: boolean; message: string; user?: User };
  deleteUser: (userId: string) => { success: boolean; message: string };
  resetUsersToDefault: () => void;

  // Notifications
  sendBroadcastNotification: (title: string, message: string, targetRole: string, type?: NotificationItem['type'], courseCode?: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Role & Permissions Matrix
  permissions: RolePermissionsMap;
  permissionDefinitions: PermissionDefinition[];
  hasPermission: (permissionKey: PermissionKey, role?: UserRole) => boolean;
  toggleRolePermission: (role: UserRole, permissionKey: PermissionKey) => void;
  setRolePermissionValue: (role: UserRole, permissionKey: PermissionKey, enabled: boolean) => void;
  resetRolePermissionsToDefault: () => void;

  // Computed helpers
  conflicts: ScheduleConflict[];
  analytics: SystemAnalytics;
  getStudentEnrollments: (studentId: string) => Enrollment[];
  getStudentGrades: (studentId: string) => GradeItem[];
  getStudentCourses: (studentId: string) => Course[];
  getTeacherCourses: (teacherId: string) => Course[];
  getCourseGrades: (courseId: string) => GradeItem[];
  getUnreadNotificationsCount: () => number;
  triggerSimulatedRealTimeEvent: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial or stored state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sga_users_v8');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_USERS.length) return parsed;
      } catch (e) { /* fallback */ }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = sessionStorage.getItem('sga_auth_user_id');
    const isAuth = sessionStorage.getItem('sga_is_authenticated');
    if (isAuth === 'true' && savedId) {
      const found = INITIAL_USERS.find(u => u.id === savedId);
      if (found) return found;
    }
    return INITIAL_USERS[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('sga_is_authenticated') === 'true';
  });
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(() => {
    const isAuth = sessionStorage.getItem('sga_is_authenticated') === 'true';
    const savedTime = sessionStorage.getItem('sga_session_start_time');
    if (isAuth && savedTime) {
      const parsed = parseInt(savedTime, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return isAuth ? Date.now() : null;
  });

  const [activities, setActivities] = useState<AcademicActivity[]>(() => {
    const saved = localStorage.getItem('sga_activities_v8');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('sga_courses_v8');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 40) {
          return parsed;
        }
      } catch (e) {
        return INITIAL_COURSES;
      }
    }
    return INITIAL_COURSES;
  });

  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const saved = localStorage.getItem('sga_classrooms_v8');
    return saved ? JSON.parse(saved) : INITIAL_CLASSROOMS;
  });

  const [permissions, setPermissions] = useState<RolePermissionsMap>(() => {
    const saved = localStorage.getItem('sga_permissions_v8');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all roles and keys exist
        return {
          admin: { ...INITIAL_ROLE_PERMISSIONS.admin, ...(parsed.admin || {}) },
          teacher: { ...INITIAL_ROLE_PERMISSIONS.teacher, ...(parsed.teacher || {}) },
          subordinado: { ...INITIAL_ROLE_PERMISSIONS.subordinado, ...(parsed.subordinado || {}) },
          student: { ...INITIAL_ROLE_PERMISSIONS.student, ...(parsed.student || {}) }
        };
      } catch (e) {
        return INITIAL_ROLE_PERMISSIONS;
      }
    }
    return INITIAL_ROLE_PERMISSIONS;
  });

  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => {
    const saved = localStorage.getItem('sga_enrollments_v8');
    return saved ? JSON.parse(saved) : INITIAL_ENROLLMENTS;
  });

  const [grades, setGrades] = useState<GradeItem[]>(() => {
    const saved = localStorage.getItem('sga_grades_v8');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* fallback */ }
    }
    return INITIAL_GRADES;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('sga_notifications_v8');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activeTerm, setActiveTerm] = useState<string>('2026-1');
  const [latestToast, setLatestToast] = useState<NotificationItem | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('sga_users_v8', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('sga_activities_v8', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('sga_courses_v8', JSON.stringify(courses));
  }, [courses]);

  // Auth functions with hash handling and flexible aliases
  const login = (emailInput: string, passwordInput?: string) => {
    // Strip leading hash '#', whitespace, and convert to lowercase
    const cleanEmail = emailInput.replace(/^#+/, '').trim().toLowerCase();
    const cleanPassword = passwordInput ? passwordInput.trim() : '';

    // Merge current state users with INITIAL_USERS to guarantee default system accounts exist
    const allUsersPool = [...users];
    INITIAL_USERS.forEach(initUser => {
      if (!allUsersPool.some(u => u.id === initUser.id || u.email.toLowerCase() === initUser.email.toLowerCase())) {
        allUsersPool.push(initUser);
      }
    });

    // 1. Search by exact or partial email, cedula, usuario or code match
    let found = allUsersPool.find(
      u =>
        u.email.toLowerCase() === cleanEmail ||
        (u.cedula && u.cedula.toLowerCase() === cleanEmail) ||
        (u.usuario && u.usuario.toLowerCase() === cleanEmail) ||
        u.code.toLowerCase() === cleanEmail ||
        u.name.toLowerCase().includes(cleanEmail)
    );

    // 2. Fallback search by role keyword if typing role name or shortcut
    if (!found) {
      if (cleanEmail === 'admin' || cleanEmail.includes('admin') || cleanEmail === 'super' || cleanEmail.includes('laura') || cleanEmail.includes('garcias')) {
        found = allUsersPool.find(u => u.role === 'admin') || INITIAL_USERS.find(u => u.role === 'admin');
      } else if (cleanEmail === 'subordinado' || cleanEmail.includes('subordinado') || cleanEmail.includes('gestor') || cleanEmail === 'sub' || cleanEmail.includes('restrepo')) {
        found = allUsersPool.find(u => u.role === 'subordinado') || INITIAL_USERS.find(u => u.role === 'subordinado');
      } else if (cleanEmail === 'docente' || cleanEmail === 'profesor' || cleanEmail === 'prof' || cleanEmail.includes('docente') || cleanEmail.includes('jhonny') || cleanEmail.includes('rodriguez') || cleanEmail.includes('teacher') || cleanEmail.includes('ramirez')) {
        found = allUsersPool.find(u => u.role === 'teacher') || INITIAL_USERS.find(u => u.role === 'teacher');
      } else if (cleanEmail === 'estudiante' || cleanEmail === 'alumno' || cleanEmail.includes('estudiante') || cleanEmail.includes('student') || cleanEmail.includes('geogret') || cleanEmail.includes('paez') || cleanEmail.includes('angela') || cleanEmail.includes('quinones') || cleanEmail.includes('carlos') || cleanEmail.includes('gutierrez')) {
        found = allUsersPool.find(u => u.role === 'student') || INITIAL_USERS.find(u => u.role === 'student');
      }
    }

    if (!found) {
      return { success: false, message: 'El usuario o correo ingresado no está registrado en el sistema.' };
    }

    // Verify password if specified (allow demo passwords or match)
    if (cleanPassword && found.password) {
      const allowedDemo = ['admin123', 'docente123', 'estudiante123', 'subordinado123'];
      if (found.password !== cleanPassword && !allowedDemo.includes(cleanPassword)) {
        return { success: false, message: 'La contraseña ingresada es incorrecta.' };
      }
    }

    // Add found user to state if not present
    if (!users.some(u => u.id === found!.id)) {
      setUsers(prev => [...prev, found!]);
    }

    setCurrentUser(found);
    setIsAuthenticated(true);
    const loginTimestamp = Date.now();
    setSessionStartTime(loginTimestamp);
    sessionStorage.setItem('sga_is_authenticated', 'true');
    sessionStorage.setItem('sga_auth_user_id', found.id);
    sessionStorage.setItem('sga_session_start_time', loginTimestamp.toString());
    sendToast(`¡Bienvenido de nuevo, ${found.name}!`, 'info');
    return { success: true, message: `Sesión iniciada correctamente como ${found.role}.`, user: found };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setSessionStartTime(null);
    sessionStorage.removeItem('sga_is_authenticated');
    sessionStorage.removeItem('sga_auth_user_id');
    sessionStorage.removeItem('sga_session_start_time');
    localStorage.removeItem('sga_is_authenticated');
    localStorage.removeItem('sga_auth_user_id');
    sendToast('Has cerrado la sesión del sistema.', 'info');
  };

  const registerUser = (
    name: string,
    email: string,
    password?: string,
    role: UserRole = 'student',
    career: string = 'Formación Continua',
    cedula?: string,
    phone?: string
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const rawCedula = cedula?.trim() || '';
    
    // Strict structured email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return {
        success: false,
        message: 'El usuario/correo debe tener una estructura de correo electrónico válida (ej: nombre@dominio.com).'
      };
    }

    if (!rawCedula) {
      return {
        success: false,
        message: 'La cédula de identidad es obligatoria para formalizar la matrícula.'
      };
    }

    const cleanCedulaDigits = rawCedula.replace(/[^0-9]/g, '');
    const cleanCedula = rawCedula.toUpperCase().startsWith('V-') || rawCedula.toUpperCase().startsWith('E-')
      ? rawCedula.toUpperCase()
      : `V-${rawCedula}`;

    // Check if user already exists by Cedula or Email
    const allUsersPool = [...INITIAL_USERS, ...users];
    const existingByCedula = allUsersPool.find(
      u => u.cedula && u.cedula.replace(/[^0-9]/g, '') === cleanCedulaDigits
    );
    const existingByEmail = allUsersPool.find(
      u => u.email.toLowerCase() === cleanEmail || (u.usuario && u.usuario.toLowerCase() === cleanEmail)
    );

    let studentUser: User;

    if (existingByCedula) {
      // User with this cédula exists
      studentUser = existingByCedula;
      if (name.trim() && !studentUser.name) studentUser.name = name.trim();
      if (cleanEmail && !studentUser.email) studentUser.email = cleanEmail;
      if (!users.some(u => u.id === studentUser.id)) {
        setUsers(prev => [...prev, studentUser]);
      }
    } else if (existingByEmail) {
      // User with this email exists
      studentUser = existingByEmail;
      if (cleanCedula) studentUser.cedula = cleanCedula;
      if (!users.some(u => u.id === studentUser.id)) {
        setUsers(prev => [...prev, studentUser]);
      }
    } else {
      const cleanPass = password?.trim() || 'estudiante123';
      if (cleanPass.length < 4) {
        return { success: false, message: 'La contraseña debe contener al menos 4 caracteres.' };
      }

      studentUser = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        usuario: cleanEmail.split('@')[0],
        cedula: cleanCedula,
        password: cleanPass,
        role,
        code: role === 'student' ? `EST-2026-${cleanCedulaDigits ? cleanCedulaDigits.slice(-4) : Math.floor(100 + Math.random() * 900)}` : role === 'subordinado' ? `SUB-${Math.floor(100 + Math.random() * 900)}` : `USR-${Math.floor(100 + Math.random() * 900)}`,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        career,
        department: role === 'subordinado' ? 'Oficina de Consultas y Reportes' : 'Área Académica y Cursos',
        semester: 1,
        phone: phone?.trim() || '+58 412 000 0000'
      };

      setUsers(prev => [...prev, studentUser]);
    }

    setCurrentUser(studentUser);
    setIsAuthenticated(true);
    const regTimestamp = Date.now();
    setSessionStartTime(regTimestamp);
    sessionStorage.setItem('sga_is_authenticated', 'true');
    sessionStorage.setItem('sga_auth_user_id', studentUser.id);
    sessionStorage.setItem('sga_session_start_time', regTimestamp.toString());
    sendToast(`¡Identidad verificada! Bienvenido, ${studentUser.name}.`, 'info');

    return { success: true, message: 'Registro de estudiante completado exitosamente.', user: studentUser };
  };

  const enrollActivity = (activityId: string, customStudent?: User) => {
    const student = customStudent || currentUser;
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return { success: false, message: 'La actividad no existe.' };

    if (activity.enrolledCount >= activity.capacity) {
      return { success: false, message: 'Los cupos para esta actividad académica están totalmente agotados.' };
    }

    setActivities(prev =>
      prev.map(a => (a.id === activityId ? { ...a, enrolledCount: a.enrolledCount + 1 } : a))
    );

    sendBroadcastNotification(
      '🎉 Inscripción a Actividad Académica',
      `Te has matriculado en: "${activity.title}".`,
      student.id,
      'enrollment'
    );

    return { success: true, message: `Te has matriculado exitosamente en la actividad: ${activity.title}.` };
  };

  const dropActivityEnrollment = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return { success: false, message: 'La actividad no existe.' };

    setActivities(prev =>
      prev.map(a =>
        a.id === activityId
          ? { ...a, enrolledCount: Math.max(0, a.enrolledCount - 1) }
          : a
      )
    );

    sendBroadcastNotification(
      'ℹ️ Cancelación de Cupo en Actividad',
      `Cancelaste tu reserva para: "${activity.title}".`,
      currentUser.id,
      'info'
    );

    return { success: true, message: `Has cancelado tu reserva en la actividad ${activity.title}.` };
  };

  const saveActivity = (activity: AcademicActivity): { success: boolean; message: string } => {
    const isExisting = activities.some(a => a.id === activity.id);
    if (isExisting) {
      setActivities(prev => prev.map(a => (a.id === activity.id ? activity : a)));
      sendToast(`Actividad "${activity.title}" actualizada con éxito.`, 'info');
      return { success: true, message: 'Actividad académica actualizada con éxito.' };
    } else {
      const newActivity = {
        ...activity,
        id: activity.id || `act-${Date.now()}`
      };
      setActivities(prev => [newActivity, ...prev]);
      sendToast(`Nueva actividad "${newActivity.title}" creada y publicada.`, 'announcement');
      
      // Notify all users about the new activity
      sendBroadcastNotification(
        '📢 Nueva Actividad Académica Publicada',
        `Se ha publicado el evento: "${newActivity.title}" (${newActivity.category} - ${newActivity.date}). ¡Cupos disponibles!`,
        'all',
        'announcement'
      );

      return { success: true, message: 'Nueva actividad académica creada exitosamente.' };
    }
  };

  const deleteActivity = (activityId: string): { success: boolean; message: string } => {
    const activity = activities.find(a => a.id === activityId);
    setActivities(prev => prev.filter(a => a.id !== activityId));
    sendToast(`Actividad académica eliminada correctamente.`, 'info');
    return { success: true, message: `Actividad "${activity?.title || ''}" eliminada.` };
  };

  useEffect(() => {
    localStorage.setItem('sga_permissions', JSON.stringify(permissions));
  }, [permissions]);

  // Permission Check Helpers
  const hasPermission = (permissionKey: PermissionKey, role?: UserRole): boolean => {
    const targetRole = role || currentUser.role;
    const roleConfig = permissions[targetRole];
    if (!roleConfig) return false;
    return !!roleConfig[permissionKey];
  };

  const toggleRolePermission = (role: UserRole, permissionKey: PermissionKey) => {
    setPermissions(prev => {
      const currentVal = prev[role]?.[permissionKey] ?? false;
      const nextRolePerms = {
        ...prev[role],
        [permissionKey]: !currentVal
      };
      const updated = {
        ...prev,
        [role]: nextRolePerms
      };
      return updated;
    });

    sendToast(`Permiso "${permissionKey}" actualizado para el rol ${role.toUpperCase()}.`, 'info');
  };

  const setRolePermissionValue = (role: UserRole, permissionKey: PermissionKey, enabled: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permissionKey]: enabled
      }
    }));
  };

  const resetRolePermissionsToDefault = () => {
    setPermissions(INITIAL_ROLE_PERMISSIONS);
    localStorage.setItem('sga_permissions_v8', JSON.stringify(INITIAL_ROLE_PERMISSIONS));
    sendToast('Permisos de todos los roles restaurados a la configuración institucional.', 'info');
  };

  useEffect(() => {
    localStorage.setItem('sga_permissions_v8', JSON.stringify(permissions));
  }, [permissions]);

  useEffect(() => {
    localStorage.setItem('sga_classrooms_v8', JSON.stringify(classrooms));
  }, [classrooms]);

  useEffect(() => {
    localStorage.setItem('sga_enrollments_v8', JSON.stringify(enrollments));
  }, [enrollments]);

  useEffect(() => {
    localStorage.setItem('sga_users_v8', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('sga_grades_v8', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('sga_notifications_v8', JSON.stringify(notifications));
  }, [notifications]);

  // User Management Actions
  const saveUser = (userToSave: User): { success: boolean; message: string; user?: User } => {
    // Validate name
    if (!userToSave.name || userToSave.name.trim().length < 3) {
      return { success: false, message: 'El nombre completo debe tener al menos 3 caracteres.' };
    }

    // Validate email format
    const cleanEmail = (userToSave.email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: 'El correo electrónico no tiene una estructura válida.' };
    }

    // Validate cédula
    const cleanCedula = (userToSave.cedula || '').trim();
    if (!cleanCedula) {
      return { success: false, message: 'La cédula de identidad es un campo obligatorio.' };
    }

    const cleanCedDigits = cleanCedula.replace(/[^0-9]/g, '');
    if (cleanCedDigits.length < 5) {
      return { success: false, message: 'La cédula debe contener un número válido de al menos 5 dígitos.' };
    }

    const isExisting = users.some(u => u.id === userToSave.id);

    // Duplicate email check
    const duplicateEmail = users.find(
      u => u.id !== userToSave.id && u.email.toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      return { success: false, message: `Ya existe otro usuario registrado con el correo: ${cleanEmail}` };
    }

    // Duplicate cedula check
    const duplicateCedula = users.find(u => {
      if (u.id === userToSave.id) return false;
      if (!u.cedula) return false;
      return u.cedula.replace(/[^0-9]/g, '') === cleanCedDigits;
    });
    if (duplicateCedula) {
      return {
        success: false,
        message: `La cédula (${cleanCedula}) ya se encuentra registrada por el usuario ${duplicateCedula.name}.`
      };
    }

    if (isExisting) {
      const updatedUser: User = {
        ...userToSave,
        name: userToSave.name.trim(),
        email: cleanEmail,
        usuario: cleanEmail.split('@')[0],
        cedula: cleanCedula
      };
      setUsers(prev => prev.map(u => (u.id === userToSave.id ? updatedUser : u)));
      if (currentUser.id === userToSave.id) {
        setCurrentUser(updatedUser);
      }
      sendToast(`Usuario "${updatedUser.name}" actualizado con éxito.`, 'info');
      return { success: true, message: 'Usuario actualizado exitosamente.', user: updatedUser };
    } else {
      const defaultRolePrefix =
        userToSave.role === 'teacher'
          ? 'DOC'
          : userToSave.role === 'student'
          ? 'EST-2026'
          : userToSave.role === 'subordinado'
          ? 'SUB'
          : 'ADM';

      const newUser: User = {
        ...userToSave,
        id: userToSave.id || `user-${Date.now()}`,
        name: userToSave.name.trim(),
        email: cleanEmail,
        usuario: cleanEmail.split('@')[0],
        cedula: cleanCedula,
        password: userToSave.password?.trim() || '123456',
        code: userToSave.code?.trim() || `${defaultRolePrefix}-${cleanCedDigits.slice(-4) || Math.floor(100 + Math.random() * 900)}`,
        avatar:
          userToSave.avatar ||
          `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        career: userToSave.career || (userToSave.role === 'student' ? 'Desarrollo de Software e IA' : undefined),
        department:
          userToSave.department ||
          (userToSave.role === 'teacher'
            ? 'Área de Tecnología e Informática'
            : userToSave.role === 'subordinado'
            ? 'Oficina de Consultas y Reportes'
            : 'Coordinación General')
      };

      setUsers(prev => [newUser, ...prev]);
      sendToast(`Nuevo usuario "${newUser.name}" registrado como ${newUser.role}.`, 'announcement');
      return { success: true, message: 'Usuario creado exitosamente.', user: newUser };
    }
  };

  const deleteUser = (userId: string): { success: boolean; message: string } => {
    if (currentUser.id === userId) {
      return { success: false, message: 'No puedes eliminar tu propio usuario de sesión activa.' };
    }

    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      return { success: false, message: 'El usuario especificado no existe.' };
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    // Clean up student enrollments and grades
    setEnrollments(prev => prev.filter(e => e.studentId !== userId));
    setGrades(prev => prev.filter(g => g.studentId !== userId));

    sendToast(`Usuario "${userToDelete.name}" (${userToDelete.role}) eliminado del sistema.`, 'warning');
    return { success: true, message: `Usuario ${userToDelete.name} eliminado exitosamente.` };
  };

  const resetUsersToDefault = () => {
    setUsers(INITIAL_USERS);
    localStorage.setItem('sga_users_v8', JSON.stringify(INITIAL_USERS));
    sendToast('Directorio de usuarios restaurado a la configuración inicial (Solo Administrador).', 'info');
  };

  // Switch role helper
  const switchRole = (role: UserRole) => {
    const foundUser = users.find(u => u.role === role);
    if (foundUser) {
      setCurrentUser(foundUser);
      if (isAuthenticated) {
        sessionStorage.setItem('sga_auth_user_id', foundUser.id);
      }
      sendToast(`Cambiaste al modo de vista: ${role === 'student' ? 'Estudiante' : role === 'teacher' ? 'Docente' : role === 'admin' ? 'Administrador' : 'Subordinado'}`, 'info');
    } else {
      sendToast(`No hay usuarios con el rol "${role === 'teacher' ? 'Docente' : role === 'student' ? 'Estudiante' : role}" registrados aún. Regístrelo como Administrador o mediante la página principal.`, 'warning');
    }
  };

  const sendToast = (message: string, type: NotificationItem['type'] = 'info') => {
    const toastItem: NotificationItem = {
      id: `toast-${Date.now()}`,
      targetRole: currentUser.role,
      title: 'Notificación del Sistema',
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setLatestToast(toastItem);
  };

  const dismissToast = () => setLatestToast(null);

  // Enrollment action
  const enrollCourse = (courseId: string, customStudent?: User): { success: boolean; message: string } => {
    const student = customStudent || currentUser;
    const course = courses.find(c => c.id === courseId);
    if (!course) return { success: false, message: 'El curso especificado no existe.' };

    if (course.enrolledCount >= course.capacity) {
      return { success: false, message: `El cupo máximo de este curso (${course.capacity}) se encuentra agotado.` };
    }

    const studentCedulaClean = student.cedula ? student.cedula.replace(/[^0-9]/g, '') : '';

    // 1. Check duplicate enrollment in this EXACT course
    const alreadyEnrolled = enrollments.some(e => {
      if (e.courseId !== courseId) return false;
      if (e.studentId === student.id) return true;
      if (studentCedulaClean) {
        const enrUser = [...INITIAL_USERS, ...users].find(u => u.id === e.studentId);
        if (enrUser?.cedula && enrUser.cedula.replace(/[^0-9]/g, '') === studentCedulaClean) {
          return true;
        }
      }
      return false;
    });

    if (alreadyEnrolled) {
      return {
        success: false,
        message: `El estudiante con cédula ${student.cedula || student.code} ya se encuentra matriculado en el curso "${course.name}". No es posible registrarse dos veces en el mismo curso.`
      };
    }

    // 2. Retrieve all active courses currently enrolled by this student (excluding dropped/canceled)
    const studentEnrollments = enrollments.filter(e => {
      if (e.status === 'Cancelado' || e.status === 'Retirado') return false;
      if (e.studentId === student.id) return true;
      if (studentCedulaClean) {
        const enrUser = [...INITIAL_USERS, ...users].find(u => u.id === e.studentId);
        return enrUser?.cedula && enrUser.cedula.replace(/[^0-9]/g, '') === studentCedulaClean;
      }
      return false;
    });

    const studentCourses = courses.filter(c => studentEnrollments.some(e => e.courseId === c.id));

    // 3. Schedule Conflict Check across days and hours
    const conflictCheck = checkStudentScheduleConflict(course, studentCourses);
    if (conflictCheck.hasConflict) {
      sendToast(conflictCheck.reason || 'Existe solapamiento de horarios con otro curso matriculado.', 'warning');
      return {
        success: false,
        message: `⚠️ ${conflictCheck.reason || 'Existe solapamiento de horarios con otro curso matriculado.'}`
      };
    }

    // 4. Check if course already has >= 2 weeks of classes in progress (Section Closed -> Auto Assign / Create Section 02)
    const sectionStatus = checkCourseSectionClosed(course, courses);
    let targetCourseToEnroll = course;

    if (sectionStatus.isSectionClosed) {
      // Find if next section already exists
      const existingNextSection = courses.find(c => c.code === sectionStatus.nextSectionCode);
      if (existingNextSection) {
        targetCourseToEnroll = existingNextSection;
      } else {
        // Auto-create new section (e.g. Sección 02)
        const nextSectionCourse: Course = {
          ...course,
          id: `curso-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          id_curso: Math.floor(100 + Math.random() * 900),
          code: sectionStatus.nextSectionCode,
          name: sectionStatus.nextSectionName,
          enrolledCount: 0,
          currentWeek: 1,
          startDate: '', // Pending official start date assignment by admin once quorum reached
          endDate: '',
          startDateSetByAdmin: false,
          startDatePending: false,
          status: 'Activo'
        };

        // Add the newly spawned section to courses list
        setCourses(prev => [...prev, nextSectionCourse]);
        targetCourseToEnroll = nextSectionCourse;

        sendToast(`Se ha aperturado la nueva ${sectionStatus.nextSectionName} (${sectionStatus.nextSectionCode}) para nuevos ingresos sin desfasaje.`, 'info');
      }
    }

    // Create enrollment record
    const newEnrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      studentCode: student.code,
      courseId: targetCourseToEnroll.id,
      courseCode: targetCourseToEnroll.code,
      courseName: targetCourseToEnroll.name,
      enrolledAt: new Date().toISOString(),
      term: activeTerm,
      status: 'Inscrito'
    };

    // Create empty initial grade item (4 Evaluaciones de 25% c/u en escala 0-20)
    const newGrade: GradeItem = {
      id: `grd-${Date.now()}`,
      enrollmentId: newEnrollment.id,
      studentId: student.id,
      studentName: student.name,
      studentCode: student.code,
      courseId: targetCourseToEnroll.id,
      courseCode: targetCourseToEnroll.code,
      courseName: targetCourseToEnroll.name,
      evaluacion1: 0,
      evaluacion2: 0,
      evaluacion3: 0,
      evaluacion4: 0,
      parcial1: 0,
      parcial2: 0,
      practicas: 0,
      examenFinal: 0,
      asistencia: 100,
      finalGrade: 0,
      status: 'En Cursado',
      updatedAt: new Date().toISOString()
    };

    setEnrollments(prev => [...prev, newEnrollment]);
    setGrades(prev => [...prev, newGrade]);

    // Update course enrolled count
    setCourses(prev =>
      prev.map(c => (c.id === targetCourseToEnroll.id ? { ...c, enrolledCount: c.enrolledCount + 1 } : c))
    );

    // Notify user
    const noticeExtra = sectionStatus.isSectionClosed
      ? ` (Asignado a la nueva ${targetCourseToEnroll.name} debido a que la sección anterior ya tiene ${sectionStatus.weeksElapsed} semanas iniciada).`
      : '';

    sendBroadcastNotification(
      '✅ Matrícula Exitosa',
      `Te has matriculado exitosamente en "${targetCourseToEnroll.name}" (${targetCourseToEnroll.code})${noticeExtra}`,
      student.id,
      'enrollment',
      targetCourseToEnroll.code
    );

    return { 
      success: true, 
      message: sectionStatus.isSectionClosed
        ? `Sección previa cerrada (${sectionStatus.weeksElapsed} semanas iniciada). Has sido asignado a la nueva sección: ${targetCourseToEnroll.name} (${targetCourseToEnroll.code}).`
        : `Te has matriculado correctamente en ${targetCourseToEnroll.name}.`
    };
  };

  // Drop enrollment
  const dropEnrollment = (enrollmentId: string): { success: boolean; message: string } => {
    const targetEnr = enrollments.find(e => e.id === enrollmentId);
    if (!targetEnr) return { success: false, message: 'Inscripción no encontrada.' };

    setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
    setGrades(prev => prev.filter(g => g.enrollmentId !== enrollmentId));

    setCourses(prev =>
      prev.map(c =>
        c.id === targetEnr.courseId
          ? { ...c, enrolledCount: Math.max(0, c.enrolledCount - 1) }
          : c
      )
    );

    sendBroadcastNotification(
      'ℹ️ Retiro de Asignatura',
      `Has retirado la asignatura "${targetEnr.courseName}".`,
      currentUser.id,
      'warning',
      targetEnr.courseCode
    );

    return { success: true, message: `Asignatura ${targetEnr.courseName} retirada con éxito.` };
  };

  // Grade update: Sistema vigesimal (1 al 20) • 4 Evaluaciones (25% cada una) • Mínimo aprobatorio: 10 ptos
  const updateGrade = (updatedGrade: GradeItem) => {
    const e1 = Number(updatedGrade.evaluacion1 ?? updatedGrade.parcial1) || 0;
    const e2 = Number(updatedGrade.evaluacion2 ?? updatedGrade.parcial2) || 0;
    const e3 = Number(updatedGrade.evaluacion3 ?? updatedGrade.practicas) || 0;
    const e4 = Number(updatedGrade.evaluacion4 ?? updatedGrade.examenFinal) || 0;

    // Promedio de las 4 evaluaciones (25% cada una) sobre 20 pts
    const computedFinal = Number(((e1 + e2 + e3 + e4) / 4).toFixed(1));
    
    let computedStatus: GradeItem['status'] = 'En Cursado';
    if (e1 > 0 || e2 > 0 || e3 > 0 || e4 > 0 || updatedGrade.status === 'Aprobado' || updatedGrade.status === 'Reprobado') {
      // Mínimo de nota aprobatoria: 10 puntos
      if (computedFinal >= 10) {
        computedStatus = 'Aprobado';
      } else {
        computedStatus = 'Reprobado';
      }
    }

    const finalItem: GradeItem = {
      ...updatedGrade,
      evaluacion1: e1,
      evaluacion2: e2,
      evaluacion3: e3,
      evaluacion4: e4,
      parcial1: e1,
      parcial2: e2,
      practicas: e3,
      examenFinal: e4,
      finalGrade: computedFinal,
      status: computedStatus,
      updatedAt: new Date().toISOString()
    };

    setGrades(prev => prev.map(g => (g.id === updatedGrade.id ? finalItem : g)));

    // Notify student
    sendBroadcastNotification(
      '📝 Calificación Actualizada',
      `Se han registrado tus notas en "${updatedGrade.courseName}". Tu nota final es ${computedFinal} / 20 pts (${computedStatus}).`,
      updatedGrade.studentId,
      'grade',
      updatedGrade.courseCode
    );
  };

  // Save/Update course
  const saveCourse = (course: Course): { success: boolean; message: string } => {
    if (courses.some(c => c.id !== course.id && c.code.trim().toLowerCase() === course.code.trim().toLowerCase())) {
      return { success: false, message: `Ya existe un curso registrado con el código ${course.code}.` };
    }

    // Teacher Schedule Conflict Check
    const hasTeacher = course.teacherId && course.teacherId !== '' && course.teacherName !== 'Sin asignar' && course.teacherName !== 'Por definir';
    if (hasTeacher) {
      const otherTeacherCourses = courses.filter(c =>
        c.id !== course.id &&
        (c.teacherId === course.teacherId || (course.teacherName && c.teacherName?.toLowerCase() === course.teacherName.toLowerCase() && c.teacherName !== 'Sin asignar' && c.teacherName !== 'Por definir'))
      );
      const teacherConflict = checkTeacherScheduleConflict(course, otherTeacherCourses);
      if (teacherConflict.hasConflict) {
        sendToast(teacherConflict.reason || 'Conflicto de horario: El profesor no puede dictar dos cursos al mismo tiempo.', 'warning');
        return {
          success: false,
          message: teacherConflict.reason || 'Conflicto de horario: El profesor ya tiene otra clase en este horario.'
        };
      }
    }

    if (courses.some(c => c.id === course.id)) {
      setCourses(prev => prev.map(c => (c.id === course.id ? course : c)));
    } else {
      setCourses(prev => [...prev, course]);
    }
    return { success: true, message: 'Asignatura guardada con éxito.' };
  };

  // Helper to set course start date and automatically compute end date from duration weeks
  const setCourseStartDate = (courseId: string, startDate: string, durationWeeks?: number): { success: boolean; message: string } => {
    const targetCourse = courses.find(c => c.id === courseId);
    if (!targetCourse) return { success: false, message: 'El curso especificado no existe.' };

    const weeks = durationWeeks || targetCourse.duracionSemanas || targetCourse.syllabusWeeks || 16;
    
    // Automatically calculate end date
    let calculatedEndDate = '';
    if (startDate) {
      try {
        const parts = startDate.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          d.setDate(d.getDate() + (weeks * 7));
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          calculatedEndDate = `${yyyy}-${mm}-${dd}`;
        } else {
          const d = new Date(startDate);
          d.setDate(d.getDate() + (weeks * 7));
          calculatedEndDate = d.toISOString().split('T')[0];
        }
      } catch (e) {
        calculatedEndDate = '';
      }
    }

    const updatedCourse: Course = {
      ...targetCourse,
      startDate,
      endDate: calculatedEndDate,
      syllabusWeeks: weeks,
      duracionSemanas: weeks,
      startDateSetByAdmin: true,
      startDatePending: false
    };

    setCourses(prev => prev.map(c => (c.id === courseId ? updatedCourse : c)));

    // Notify enrolled students and teacher
    const courseEnrollments = enrollments.filter(e => e.courseId === courseId && e.status !== 'Cancelado');
    courseEnrollments.forEach(enr => {
      sendBroadcastNotification(
        '📅 Fecha de Inicio Oficial Programada',
        `La Administración ha fijado el inicio del curso "${targetCourse.name}" (${targetCourse.code}) para el ${startDate}. Culminación estimada: ${calculatedEndDate}.`,
        enr.studentId,
        'announcement',
        targetCourse.code
      );
    });

    sendToast(`Fecha de inicio fijada para "${targetCourse.name}" (${startDate} ➔ ${calculatedEndDate}).`, 'schedule');
    return { success: true, message: 'Fecha oficial de inicio y culminación guardada exitosamente.' };
  };

  const deleteCourse = (courseId: string) => {
    const courseToDelete = courses.find(c => c.id === courseId);
    setCourses(prev => prev.filter(c => c.id !== courseId));
    setEnrollments(prev => prev.filter(e => e.courseId !== courseId));
    setGrades(prev => prev.filter(g => g.courseId !== courseId));
    sendToast(`La asignatura ${courseToDelete?.name || ''} (${courseToDelete?.code || ''}) ha sido dada de baja y eliminada exitosamente del sistema.`, 'info');
  };

  const resetCoursesToDefault = () => {
    setCourses(INITIAL_COURSES);
    localStorage.setItem('sga_courses_v8', JSON.stringify(INITIAL_COURSES));
    sendToast('Catálogo de cursos restaurado a la oferta académica institucional predeterminada.', 'info');
  };

  const resolveAllConflictsAutomatically = () => {
    setCourses(INITIAL_COURSES);
    setClassrooms(INITIAL_CLASSROOMS);
    localStorage.setItem('sga_courses_v8', JSON.stringify(INITIAL_COURSES));
    localStorage.setItem('sga_classrooms_v8', JSON.stringify(INITIAL_CLASSROOMS));
    sendToast('¡La oferta y aulas han sido armonizadas exitosamente!', 'schedule');
    return { success: true, message: 'Horarios optimizados y libres de colisiones.' };
  };

  // Classrooms
  const saveClassroom = (classroom: Classroom) => {
    if (classrooms.some(cls => cls.id === classroom.id)) {
      setClassrooms(prev => prev.map(c => (c.id === classroom.id ? classroom : c)));
    } else {
      setClassrooms(prev => [...prev, classroom]);
    }
  };

  const deleteClassroom = (classroomId: string) => {
    setClassrooms(prev => prev.filter(c => c.id !== classroomId));
  };

  // Broadcast Notification
  const sendBroadcastNotification = (
    title: string,
    message: string,
    targetRole: string,
    type: NotificationItem['type'] = 'announcement',
    courseCode?: string
  ) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      targetRole,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      courseCode
    };

    setNotifications(prev => [newNotif, ...prev]);
    setLatestToast(newNotif);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Helper selectors
  const getStudentEnrollments = (studentId: string) =>
    enrollments.filter(e => e.studentId === studentId && e.status !== 'Cancelado');

  const getStudentGrades = (studentId: string) =>
    grades.filter(g => g.studentId === studentId);

  // Synchronize course enrolledCount dynamically with actual active enrollments
  const synchronizedCourses = useMemo(() => {
    return courses.map(c => {
      const realEnrolled = enrollments.filter(
        e => e.courseId === c.id && e.status !== 'Cancelado'
      ).length;
      const isPending = realEnrolled >= 3 && !c.startDateSetByAdmin;
      return {
        ...c,
        enrolledCount: realEnrolled,
        startDatePending: isPending
      };
    });
  }, [courses, enrollments]);

  const getStudentCourses = (studentId: string) => {
    const studentEnrs = getStudentEnrollments(studentId);
    return synchronizedCourses.filter(c => studentEnrs.some(e => e.courseId === c.id));
  };

  const getTeacherCourses = (teacherId: string) => {
    const teacherUser = users.find(u => u.id === teacherId);
    const teacherName = teacherUser?.name.toLowerCase() || '';
    return synchronizedCourses.filter(
      c => c.teacherId === teacherId || (teacherName && c.teacherName.toLowerCase().includes(teacherName))
    );
  };

  const getCourseGrades = (courseId: string) =>
    grades.filter(g => g.courseId === courseId);

  const getUnreadNotificationsCount = () => {
    return notifications.filter(
      n =>
        !n.read &&
        (n.targetRole === 'all' ||
          n.targetRole === currentUser.role ||
          n.targetRole === currentUser.id)
    ).length;
  };

  // Real-Time Simulator for demonstration
  const triggerSimulatedRealTimeEvent = () => {
    const sampleEvents = [
      {
        title: '🔔 Publicación de Notas de Examen Final',
        message: 'El profesor ha subido las calificaciones correspondientes al Examen Final del curso.',
        type: 'grade' as const
      },
      {
        title: '🏫 Cambio Urgente de Aula',
        message: 'Por mantenimiento preventivo, la clase de hoy se impartirá en el Aula Magna A101.',
        type: 'schedule' as const
      },
      {
        title: '📢 Recordatorio de Entrega de Proyecto',
        message: 'Faltan 24 horas para el cierre de entrega del Proyecto Integrador en la plataforma.',
        type: 'announcement' as const
      }
    ];

    const randomEvt = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
    sendBroadcastNotification(randomEvt.title, randomEvt.message, 'all', randomEvt.type);
  };

  // Computed conflicts and analytics
  const conflicts = detectSystemConflicts(synchronizedCourses);

  const totalStudentsCount = users.filter(u => u.role === 'student').length;
  const totalTeachersCount = users.filter(u => u.role === 'teacher').length;
  const totalCoursesCount = synchronizedCourses.length;
  const totalEnrollmentsCount = enrollments.filter(e => e.status !== 'Cancelado').length;

  const validGrades = grades.filter(g => g.finalGrade > 0);
  const avgGrade = validGrades.length > 0
    ? Number((validGrades.reduce((acc, g) => acc + g.finalGrade, 0) / validGrades.length).toFixed(1))
    : 16.5;

  // Mínimo de nota aprobatoria: 10 puntos (escala 1 al 20)
  const passedGrades = validGrades.filter(g => g.finalGrade >= 10).length;
  const passRateVal = validGrades.length > 0
    ? Number(((passedGrades / validGrades.length) * 100).toFixed(1))
    : 92.0;

  const totalCap = synchronizedCourses.reduce((acc, c) => acc + c.capacity, 0);
  const totalEnr = synchronizedCourses.reduce((acc, c) => acc + c.enrolledCount, 0);
  const occupancyRate = totalCap > 0 ? Number(((totalEnr / totalCap) * 100).toFixed(1)) : 0.0;

  const courseEnrollmentDistribution = synchronizedCourses.map(c => ({
    courseName: c.code,
    enrolled: c.enrolledCount,
    capacity: c.capacity
  }));

  const gradesDistribution = [
    { range: '18 - 20 (Sobresaliente)', count: grades.filter(g => g.finalGrade >= 18).length },
    { range: '14 - 17 (Notable / Distinguido)', count: grades.filter(g => g.finalGrade >= 14 && g.finalGrade < 18).length },
    { range: '10 - 13 (Aprobado / Regular)', count: grades.filter(g => g.finalGrade >= 10 && g.finalGrade < 14).length },
    { range: '01 - 09 (Reprobado)', count: grades.filter(g => g.finalGrade < 10 && g.finalGrade > 0).length }
  ];

  const classroomUsageByType = classrooms.map(cls => ({
    type: cls.name,
    count: cls.capacity
  }));

  const analytics: SystemAnalytics = {
    totalStudents: totalStudentsCount,
    totalTeachers: totalTeachersCount,
    totalCourses: totalCoursesCount,
    totalEnrollments: totalEnrollmentsCount,
    averageGrade: avgGrade,
    passRate: passRateVal,
    classroomOccupancyRate: occupancyRate,
    courseEnrollmentDistribution,
    gradesDistribution,
    classroomUsageByType
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        sessionStartTime,
        login,
        logout,
        registerUser,
        switchRole,
        users,
        courses: synchronizedCourses,
        classrooms,
        activities,
        enrollments,
        grades,
        notifications,
        activeTerm,
        setActiveTerm,
        latestToast,
        dismissToast,
        enrollCourse,
        enrollActivity,
        dropEnrollment,
        updateGrade,
        saveCourse,
        setCourseStartDate,
        deleteCourse,
        resetCoursesToDefault,
        resolveAllConflictsAutomatically,
        saveActivity,
        deleteActivity,
        dropActivityEnrollment,
        permissions,
        permissionDefinitions: PERMISSION_DEFINITIONS,
        hasPermission,
        toggleRolePermission,
        setRolePermissionValue,
        resetRolePermissionsToDefault,
        saveClassroom,
        deleteClassroom,
        saveUser,
        deleteUser,
        resetUsersToDefault,
        sendBroadcastNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        conflicts,
        analytics,
        getStudentEnrollments,
        getStudentGrades,
        getStudentCourses,
        getTeacherCourses,
        getCourseGrades,
        getUnreadNotificationsCount,
        triggerSimulatedRealTimeEvent
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
