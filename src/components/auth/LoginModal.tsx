import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  UserPlus,
  LogIn,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Phone,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Course, AcademicActivity, UserRole } from '../../types';
import { AcademiaValenciaLogo } from '../common/AcademiaValenciaLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: () => void;
  selectedCourse?: Course | null;
  selectedActivity?: AcademicActivity | null;
  initialTab?: 'login' | 'register';
  // Backward compatibility props
  selectedCourseId?: string;
  selectedCourseName?: string;
  selectedActivityId?: string;
  selectedActivityTitle?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  selectedCourse,
  selectedActivity,
  initialTab = 'login',
  selectedCourseId,
  selectedCourseName,
  selectedActivityId,
  selectedActivityTitle
}) => {
  const { login, registerUser, enrollCourse, enrollActivity, courses, activities } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regRole] = useState<UserRole>('student');

  // Resolve target course or activity
  const activeCourse = selectedCourse || (selectedCourseId ? courses.find(c => c.id === selectedCourseId) : null);
  const courseDisplayName = activeCourse?.name || selectedCourseName;
  
  const activeActivity = selectedActivity || (selectedActivityId ? activities.find(a => a.id === selectedActivityId) : null);
  const activityDisplayName = activeActivity?.title || selectedActivityTitle;

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsLoading(false);
    }
  }, [isOpen, initialTab, activeCourse, activeActivity]);

  if (!isOpen) return null;

  // Email format validation helper
  const isEmailValid = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleQuickDemoLogin = (demoEmail: string, demoPass: string) => {
    setErrorMsg(null);
    setEmail(demoEmail);
    setPassword(demoPass);
    processLogin(demoEmail, demoPass);
  };

  const processLogin = (userEmail: string, userPass: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const result = login(userEmail, userPass);
      if (!result.success) {
        setErrorMsg(result.message);
        setIsLoading(false);
      } else {
        handlePostAuthEnrollment(result.user);
      }
    }, 250);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Por favor ingresa tu usuario, cédula o correo electrónico.');
      return;
    }
    if (!password) {
      setErrorMsg('Por favor ingresa tu contraseña de acceso.');
      return;
    }

    processLogin(email, password);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!regName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre y apellido completo.');
      return;
    }

    if (!regCedula.trim()) {
      setErrorMsg('La cédula de identidad es obligatoria para validar tu matrícula estudiantil.');
      return;
    }

    if (!regEmail.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico para el usuario.');
      return;
    }

    if (!isEmailValid(regEmail)) {
      setErrorMsg('El usuario/correo no tiene una estructura válida (debe ser: ejemplo@dominio.com).');
      return;
    }

    if (!regPassword) {
      setErrorMsg('Por favor crea una contraseña para tu cuenta.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Las contraseñas ingresadas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsLoading(true);

    const inferredCareer =
      activeCourse?.categoria ||
      activeCourse?.specialty ||
      activeCourse?.department ||
      activeActivity?.department ||
      'Capacitación Profesional';

    setTimeout(() => {
      const result = registerUser(
        regName,
        regEmail,
        regPassword,
        regRole,
        inferredCareer,
        regCedula,
        regPhone
      );

      if (!result.success) {
        setErrorMsg(result.message);
        setIsLoading(false);
      } else {
        handlePostAuthEnrollment(result.user);
      }
    }, 300);
  };

  const handlePostAuthEnrollment = (authenticatedUser?: any) => {
    const courseTargetId = activeCourse?.id || selectedCourseId;
    const activityTargetId = activeActivity?.id || selectedActivityId;

    if (courseTargetId) {
      const enrRes = enrollCourse(courseTargetId, authenticatedUser);
      if (!enrRes.success) {
        // Stop and display the exact conflict warning or duplicate message
        setErrorMsg(enrRes.message);
        setIsLoading(false);
        return;
      }
      setSuccessMsg(`¡Matrícula exitosa en "${courseDisplayName || 'el curso'}"! Redirigiendo a tu panel...`);
    } else if (activityTargetId) {
      const actRes = enrollActivity(activityTargetId, authenticatedUser);
      if (!actRes.success) {
        setErrorMsg(actRes.message);
        setIsLoading(false);
        return;
      }
      setSuccessMsg(`¡Inscripción exitosa en "${activityDisplayName || 'la actividad'}"!`);
    } else {
      setSuccessMsg('¡Bienvenido al sistema académico!');
    }

    setTimeout(() => {
      setIsLoading(false);
      onSuccessLogin?.();
      onClose();
    }, 1200);
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn"
    >
      <div
        id="auth-modal-container"
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative my-6"
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 text-white relative">
          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <AcademiaValenciaLogo
            size="lg"
            showSubtitle={true}
            subtitleText="Gestión Académica y Matrícula Estudiantil"
            className="text-white [&_h1]:text-white [&_p]:text-indigo-200"
          />

          {/* Selected Course / Activity Banner */}
          {(courseDisplayName || activityDisplayName) && (
            <div
              id="selected-course-banner"
              className="mt-4 p-3.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-xs space-y-1.5 shadow-inner"
            >
              <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-wider text-[10px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Curso Seleccionado para Matrícula</span>
              </div>
              <h4 className="text-sm font-bold text-white leading-snug">
                {courseDisplayName || activityDisplayName}
              </h4>
              {activeCourse && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-indigo-200/90 pt-0.5">
                  <span className="font-mono bg-indigo-900/60 px-1.5 py-0.5 rounded border border-indigo-400/20">
                    {activeCourse.code}
                  </span>
                  <span>•</span>
                  <span>{activeCourse.modality}</span>
                  <span>•</span>
                  <span>Prof. {activeCourse.teacherName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-1.5">
          <button
            id="tab-register"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Matricularme (Registro)</span>
          </button>
          
          <button
            id="tab-login"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Ya Tengo Cuenta</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          
          {/* Notifications */}
          {errorMsg && (
            <div
              id="auth-error-alert"
              className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div
              id="auth-success-alert"
              className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* ================= REGISTER FORM ================= */}
          {activeTab === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5" id="form-register-student">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Completa tus datos personales para crear tu acceso y registrar tu matrícula oficial en la plataforma:
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre y Apellido <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    id="input-reg-name"
                    type="text"
                    required
                    placeholder="Ej: Carlos Mendoza"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email / User */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Usuario / Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  {regEmail && (
                    <span
                      className={`text-[10px] font-semibold flex items-center gap-1 ${
                        isEmailValid(regEmail) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                      }`}
                    >
                      {isEmailValid(regEmail) ? '✓ Correo válido' : 'Formato: usuario@dominio.com'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    id="input-reg-email"
                    type="email"
                    required
                    placeholder="estudiante@correo.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border ${
                      regEmail && !isEmailValid(regEmail)
                        ? 'border-amber-400 focus:ring-amber-400'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                    } bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:outline-none transition-all`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Este correo estructurado será tu identificador de usuario para acceder al sistema.
                </p>
              </div>

              {/* Identification (Mandatory) and Phone (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cédula de Identidad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      id="input-reg-cedula"
                      type="text"
                      required
                      placeholder="Ej: 28456123 o V-28456123"
                      value={regCedula}
                      onChange={e => setRegCedula(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Identificador único para tu expediente y control de cursos.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp (Opcional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      id="input-reg-phone"
                      type="tel"
                      placeholder="Ej: +58 412 1234567"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Para avisos académicos y notificaciones.
                  </p>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña de Acceso <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    id="input-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    id="input-reg-confirm-password"
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Repite la contraseña creada"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border ${
                      regConfirmPassword && regConfirmPassword !== regPassword
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                    } bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regConfirmPassword && regConfirmPassword !== regPassword && (
                  <p className="text-[10px] text-red-500 mt-1">Las contraseñas no coinciden.</p>
                )}
              </div>

              {/* Submit Register & Enroll Button */}
              <button
                id="btn-submit-registration"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {courseDisplayName ? 'Completar Registro y Matricularme' : 'Crear Cuenta y Acceder'}
                    </span>
                  </>
                )}
              </button>

              {/* Switch to Login Link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  ¿Ya tienes una cuenta registrada? Inicia sesión aquí
                </button>
              </div>
            </form>
          ) : (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-4" id="form-login-user">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Usuario, Cédula o Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    id="input-login-email"
                    type="text"
                    required
                    placeholder="Ej: admin, estudiante@correo.com o cédula"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Puedes ingresar con tu correo registrado, cédula o alias asignado.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña de Acceso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    id="input-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>
                      {courseDisplayName ? 'Iniciar Sesión y Matricularme' : 'Iniciar Sesión'}
                    </span>
                  </>
                )}
              </button>

              {/* Switch to Register Link */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  ¿Eres estudiante nuevo? Regístrate y matricúlate aquí
                </button>
              </div>

              {/* Demo Credentials Box */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                  Credenciales Rápidas de Prueba
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => handleQuickDemoLogin('25684509', 'estudiante123')}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                  >
                    <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-300 block flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> Geogret Paez
                    </span>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      Cédula: 25684509 | Clave: estudiante123
                    </p>
                  </div>

                  <div
                    onClick={() => handleQuickDemoLogin('17374695', 'admin123')}
                    className="p-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 transition-all cursor-pointer"
                  >
                    <span className="text-[11px] font-extrabold text-purple-900 dark:text-purple-300 block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Laura Garcías (Admin)
                    </span>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      Cédula: 17374695 | Clave: admin123
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
