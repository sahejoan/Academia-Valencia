import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  LogIn,
  UserCheck,
  Clock,
  Laptop,
  Award,
  ChevronRight,
  Star,
  MapPin
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Course, AcademicActivity } from '../../types';
import { LoginModal } from '../auth/LoginModal';
import { AcademiaValenciaLogo } from '../common/AcademiaValenciaLogo';

interface PublicLandingPageProps {
  onGoToDashboard: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onGoToDashboard }) => {
  const { courses, activities, isAuthenticated, currentUser, logout } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState<string>('all');

  // Modal Auth & Pre-enrollment state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [targetCourse, setTargetCourse] = useState<Course | null>(null);
  const [targetActivity, setTargetActivity] = useState<AcademicActivity | null>(null);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('register');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'COMERCIAL', 'INDUSTRIAL', 'GERENCIAL', 'ARTESANAL'];

  const filteredCourses = courses.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.categoria && c.categoria.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || c.categoria === selectedCategory;
    const matchesDept = selectedDept === 'all' || c.department === selectedDept;
    const matchesModality = selectedModality === 'all' || c.modality === selectedModality;

    return matchesSearch && matchesCategory && matchesDept && matchesModality;
  });

  const handleEnrollClick = (course: Course) => {
    setTargetCourse(course);
    setTargetActivity(null);
    setAuthInitialTab('register');
    setIsAuthModalOpen(true);
  };

  const handleActivityClick = (act: AcademicActivity) => {
    setTargetActivity(act);
    setTargetCourse(null);
    setAuthInitialTab('register');
    setIsAuthModalOpen(true);
  };

  const openGeneralLogin = () => {
    setTargetCourse(null);
    setTargetActivity(null);
    setAuthInitialTab('login');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <AcademiaValenciaLogo size="sm" showSubtitle={true} />

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a href="#oferta" className="hover:text-indigo-600 transition-colors">Oferta Académica</a>
            <a href="#infraestructura" className="hover:text-indigo-600 transition-colors">Instalaciones</a>
            <a href="#contacto" className="hover:text-indigo-600 transition-colors">Admisiones</a>
          </div>

          {/* Auth Action Button */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onGoToDashboard}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" /> Ir a Mi Panel ({currentUser.name.split(' ')[0]})
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={openGeneralLogin}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-400" /> Admisiones Abiertas 2026-1 • Inscripción en Tiempo Real
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white">
              Transforma tu carrera con nuestra <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">Oferta Académica 2026</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Explora asignaturas de vanguardia en Ingeniería, Inteligencia Artificial, Redes y Gestión. Reserva tu cupo instantáneamente desde nuestro portal digital centralizado.
            </p>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#oferta"
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                Explorar Cursos Disponibles <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#infraestructura"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center gap-2"
              >
                Conoce nuestras instalaciones
              </a>
            </div>

            {/* Key Feature Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Matrícula 100% en Línea</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Validación de Cupos sin Cruces</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Certificación Oficial Acreditada</span>
              </div>
            </div>
          </div>

          {/* Right Showcase Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Asignatura Destacada
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                  Matrícula Disponible
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white mb-2">
                SIS-302 • Arquitectura de Software y Cloud
              </h3>
              <p className="text-xs text-slate-300 mb-4 line-clamp-2">
                Diseño de patrones distribuidos, microservicios, contenedores Docker y despliegues en la nube pública.
              </p>

              <div className="space-y-2 text-xs bg-black/20 p-4 rounded-2xl border border-white/10 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Docente:</span>
                  <span className="font-semibold text-white">Dr. Roberto Carlos Mendoza</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Modalidad:</span>
                  <span className="font-semibold text-indigo-300">Presencial / Lab AI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Horario:</span>
                  <span className="font-semibold text-white">Mar y Jue 08:00 - 10:00</span>
                </div>
              </div>

              <button
                onClick={() => handleEnrollClick(courses[1] || courses[0])}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Matricularme
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">+1,200</p>
            <p className="text-xs text-slate-500 font-medium">Estudiantes Activos</p>
          </div>
          <div>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">45+</p>
            <p className="text-xs text-slate-500 font-medium">Cursos & Talleres</p>
          </div>
          <div>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">98%</p>
            <p className="text-xs text-slate-500 font-medium">Tasa de Inserción Laboral</p>
          </div>
          <div>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">100%</p>
            <p className="text-xs text-slate-500 font-medium">Gestión Digital Acreditada</p>
          </div>
        </div>
      </section>

      {/* Academic Courses Catalogue Section */}
      <section id="oferta" className="max-w-7xl mx-auto px-4 py-16 w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Catálogo Oficial de Asignaturas
          </span>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Oferta Académica Vigente 2026-1
          </h2>
          <p className="text-xs text-slate-500">
            Haz clic en "Matricularme" en la materia de tu interés para registrarte en el sistema y asegurar tu plaza inmediatamente.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar asignatura o profesor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'Todas las Áreas' : `Área ${cat}`}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => {
            const availableSpots = Math.max(0, course.capacity - course.enrolledCount);
            const isFull = availableSpots === 0;

            const getCategoryBadgeClass = (cat?: string) => {
              switch (cat) {
                case 'COMERCIAL':
                  return 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
                case 'INDUSTRIAL':
                  return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                case 'GERENCIAL':
                  return 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
                case 'ARTESANAL':
                  return 'bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800';
                default:
                  return 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
              }
            };

            return (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group hover:border-indigo-500/50"
              >
                <div>
                  {/* Top Tags */}
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                      {course.code}
                    </span>
                    {course.categoria && (
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(course.categoria)}`}>
                        {course.categoria}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {course.modality}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                    {course.name}
                  </h3>
                  
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    {course.duracion && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Duración:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{course.duracion}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Docente a cargo:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{course.teacherName}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Modalidad:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{course.modality}</span>
                    </div>
                  </div>

                  {/* Cupos / Availability Bar */}
                  <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-600 dark:text-slate-300">Disponibilidad de Cupos:</span>
                      <span className={isFull ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}>
                        {isFull ? 'Agotados' : `${availableSpots} de ${course.capacity} libres`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isFull
                            ? 'bg-red-500'
                            : availableSpots < 5
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${(course.enrolledCount / course.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Enrollment Action Button */}
                <button
                  onClick={() => handleEnrollClick(course)}
                  disabled={isFull}
                  className={`mt-6 w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isFull
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {isFull ? 'Sin Cupos Disponibles' : 'Matricularme'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Academic Activities & Workshops Section */}
      <section id="actividades" className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                Talleres, Seminarios & Diplomados
              </span>
              <h2 className="text-3xl font-black tracking-tight text-white mt-1">
                Actividades Extracurriculares
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Participa en nuestras jornadas extracurriculares programadas por la administración institucional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activities.map(act => (
              <div
                key={act.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-3xl overflow-hidden flex flex-col sm:flex-row hover:border-indigo-500/50 transition-all shadow-xl"
              >
                <img
                  src={act.image}
                  alt={act.title}
                  className="sm:w-48 h-48 sm:h-auto object-cover shrink-0"
                />
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        {act.category}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400" /> {act.location}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">
                      {act.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {act.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {act.date}
                      </span>
                      <span className="font-semibold text-emerald-400">
                        {act.capacity - act.enrolledCount} cupos libres
                      </span>
                    </div>

                    <button
                      onClick={() => handleActivityClick(act)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Matricularme
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure Spotlight Section */}
      <section id="infraestructura" className="max-w-7xl mx-auto px-4 py-16 w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Instalaciones & Tecnología
          </span>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Aulas Inteligentes & Laboratorios Cloud
          </h2>
          <p className="text-xs text-slate-500">
            Espacios diseñados para el aprendizaje interactivo con infraestructura de alto rendimiento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Labs de Computación de Alta Gama</h3>
            <p className="text-xs text-slate-500">
              Workstations equipadas con GPUs dedicadas para modelos de Inteligencia Artificial, ciencia de datos y renderizado.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Auditorios & Aulas Climatizadas</h3>
            <p className="text-xs text-slate-500">
              Proyección 4K, microfonía ambiental y capacidad adaptativa para conferencias magistrales e interactivas.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Campus Virtual & Repositorios 24/7</h3>
            <p className="text-xs text-slate-500">
              Acceso remoto ilimitado a bibliotecas digitales, simuladores y grabación de cátedras para repaso.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-slate-950 text-slate-400 text-xs py-12 px-4 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <AcademiaValenciaLogo size="sm" showSubtitle={false} className="text-white" />
            <p className="text-slate-400 leading-relaxed text-xs">
              <strong>"Excelencia Educativa y Conocimiento que Transforma"</strong>. Líderes en formación académica integral, innovación científica e inclusión educativa.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li><a href="#oferta" className="hover:text-white transition-colors">Oferta de Asignaturas</a></li>
              <li><a href="#infraestructura" className="hover:text-white transition-colors">Infraestructura y Aulas</a></li>
              <li><a href="#contacto" className="hover:text-white transition-colors">Admisiones & Atención</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Atención & Admisiones</h4>
            <p>PBX: +57 (601) 800-2026</p>
            <p>Email: admisiones@academiavalencia.edu</p>
            <p>Horario: Lunes a Viernes 08:00 AM - 06:00 PM</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Acceso Administrativo</h4>
            <button
              onClick={openGeneralLogin}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-indigo-400" /> Ingresar como Admin / Gestor
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
          <p>© 2026 Academia Valencia • Excelencia Educativa y Conocimiento que Transforma.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">Política de Privacidad</span>
            <span className="hover:text-white cursor-pointer">Términos del Servicio</span>
          </div>
        </div>
      </footer>

      {/* Auth & Course Reservation Modal */}
      <LoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessLogin={onGoToDashboard}
        selectedCourse={targetCourse}
        selectedActivity={targetActivity}
        initialTab={authInitialTab}
      />

    </div>
  );
};
