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
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Briefcase,
  Wrench,
  TrendingUp,
  Palette
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Course, AcademicActivity } from '../../types';
import { LoginModal } from '../auth/LoginModal';
import { AcademiaValenciaLogo } from '../common/AcademiaValenciaLogo';
import { INSTITUTION_INFO, AREA_INFO } from '../../data/officialCourses';
import { checkCourseSectionClosed } from '../../utils/conflictDetector';

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
            <a href="#oferta" className="hover:text-indigo-600 transition-colors">Cursos & Talleres</a>
            <a href="#areas" className="hover:text-indigo-600 transition-colors">Áreas de Formación</a>
            <a href="#infraestructura" className="hover:text-indigo-600 transition-colors">Instalaciones</a>
            <a href="#contacto" className="hover:text-indigo-600 transition-colors">Contacto & Horarios</a>
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
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
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
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white py-16 sm:py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.18),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
              <Award className="w-4 h-4 text-amber-400" /> Cursos Avalados por el Ministerio del Poder Popular para la Educación
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
              ¡Conoce Nuestros <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-indigo-300 to-pink-400">Cursos y Talleres!</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Formación técnica, comercial, gerencial y artesanal en Calabozo, Estado Guárico. Capacítate con docentes certificados en 4 áreas de alta demanda laboral.
            </p>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#oferta"
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                Explorar los 47 Cursos <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#contacto"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-amber-400" /> Sede CUAM Calabozo
              </a>
            </div>

            {/* Key Feature Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Aval Ministerial Oficial</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Horarios 100% Prácticos</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Certificado con Validez Nacional</span>
              </div>
            </div>
          </div>

          {/* Right Area Summary Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Costos y Áreas Formativas
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                  Inscripciones Abiertas
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-400/20">
                  <div className="flex items-center gap-1.5 text-blue-300 font-bold mb-1">
                    <Briefcase className="w-4 h-4" /> Área Comercial
                  </div>
                  <p className="text-white font-extrabold text-base">12$ <span className="text-[10px] font-normal text-slate-300">Semanal</span></p>
                  <p className="text-[10px] text-slate-400 mt-1">15 Cursos (8 a 16 Sem.)</p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/20">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                    <Wrench className="w-4 h-4" /> Área Industrial
                  </div>
                  <p className="text-white font-extrabold text-base">12$ <span className="text-[10px] font-normal text-slate-300">Semanal</span></p>
                  <p className="text-[10px] text-slate-400 mt-1">14 Cursos (8 a 12 Sem.)</p>
                </div>

                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-400/20">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold mb-1">
                    <TrendingUp className="w-4 h-4" /> Área Gerencial
                  </div>
                  <p className="text-white font-extrabold text-base">12$ <span className="text-[10px] font-normal text-slate-300">Semanal</span></p>
                  <p className="text-[10px] text-slate-400 mt-1">7 Cursos (6 a 8 Sem.)</p>
                </div>

                <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-400/20">
                  <div className="flex items-center gap-1.5 text-pink-300 font-bold mb-1">
                    <Palette className="w-4 h-4" /> Área Artesanal
                  </div>
                  <p className="text-white font-extrabold text-base">10$ <span className="text-[10px] font-normal text-slate-300">Semanal</span></p>
                  <p className="text-[10px] text-slate-400 mt-1">11 Cursos (8 a 12 Sem.)</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{INSTITUTION_INFO.address}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>WhatsApp: {INSTITUTION_INFO.phone}</span>
                </div>
              </div>

              <button
                onClick={() => handleEnrollClick(courses[0])}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Inscribirme / Reservar Cupo
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Areas of Training Section */}
      <section id="areas" className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Especialidades Disponibles
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Nuestras 4 Grandes Áreas de Formación
            </h2>
            <p className="text-xs text-slate-500">
              Todos nuestros cursos cuentan con aval ministerial oficial y alta inserción en el campo laboral.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Comercial */}
            <div 
              onClick={() => setSelectedCategory('COMERCIAL')}
              className="p-6 rounded-3xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-blue-950 dark:text-blue-100">Área Comercial</h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-extrabold mt-1">Costo: 12$ Semanal</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Programación, Marketing, Excel, Inglés, Asistentes Jurídico, Aduana, Farmacia, Administrativo, Contabilidad y más.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 mt-4">
                Ver 15 cursos <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            {/* Industrial */}
            <div 
              onClick={() => setSelectedCategory('INDUSTRIAL')}
              className="p-6 rounded-3xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100">Área Industrial</h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-extrabold mt-1">Costo: 12$ Semanal</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Robótica, Electro-Auto, Mecánica Motos/Diesel/Autos, Electrónica, Celulares, Electricidad, Refrigeración y PCs.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 mt-4">
                Ver 14 cursos <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            {/* Gerencial */}
            <div 
              onClick={() => setSelectedCategory('GERENCIAL')}
              className="p-6 rounded-3xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-purple-950 dark:text-purple-100">Área Gerencial</h3>
              <p className="text-xs text-purple-700 dark:text-purple-300 font-extrabold mt-1">Costo: 12$ Semanal</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Planificación Estratégica, Indicadores de Gestión, Liderazgo, Oratoria, Trabajo en Equipo y Resolución de Conflictos.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 mt-4">
                Ver 7 cursos <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            {/* Artesanal */}
            <div 
              onClick={() => setSelectedCategory('ARTESANAL')}
              className="p-6 rounded-3xl bg-pink-50/60 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/60 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-pink-950 dark:text-pink-100">Área Artesanal</h3>
              <p className="text-xs text-pink-700 dark:text-pink-300 font-extrabold mt-1">Costo: 10$ Semanal</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Ajedrez, Bisutería, Manualidades, Cejas/Pestañas, Uñas, Barbería, Peluquería, Maquillaje, Corte y Confección.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 dark:text-pink-400 mt-4">
                Ver 11 cursos <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Courses Catalogue Section */}
      <section id="oferta" className="max-w-7xl mx-auto px-4 py-16 w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Catálogo Oficial de 47 Cursos
          </span>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Oferta Académica Vigente 2026-I
          </h2>
          <p className="text-xs text-slate-500">
            Haz clic en "Matricularme" en el curso de tu preferencia para registrarte en el sistema y asegurar tu cupo de inmediato.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar curso o docente..."
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
                  {cat === 'all' ? 'Todas las Áreas (47)' : `Área ${cat}`}
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
            const hasQuorum = (course.enrolledCount || 0) >= 3;
            const neededForQuorum = Math.max(0, 3 - (course.enrolledCount || 0));

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

            const getCostBadge = (cat?: string) => {
              if (cat === 'ARTESANAL') return '10$ Semanal';
              return '12$ Semanal';
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
                        Área {course.categoria}
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {getCostBadge(course.categoria)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                    {course.name}
                  </h3>
                  
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Quorum & Start Date Status Highlight Box */}
                  <div className="mt-4">
                    {(() => {
                      const sectionStatus = checkCourseSectionClosed(course, courses);
                      if (sectionStatus.isSectionClosed) {
                        return (
                          <div className="p-3 bg-purple-50/90 dark:bg-purple-950/50 border-2 border-purple-300 dark:border-purple-800 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                                🔒 Sección Cerrada ({sectionStatus.weeksElapsed} semanas iniciada)
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                                Sección 02
                              </span>
                            </div>
                            <p className="text-[11px] text-purple-800/90 dark:text-purple-300 leading-relaxed font-medium">
                              ⚠️ Esta sección ya inició clases. Los nuevos inscritos serán asignados automáticamente a una <strong>nueva sección ({sectionStatus.nextSectionName})</strong> para cursar desde la semana 01.
                            </p>
                          </div>
                        );
                      }

                      if (hasQuorum) {
                        return (
                          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                Quórum Confirmado
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                                Listo para Iniciar
                              </span>
                            </div>

                            {course.startDateSetByAdmin && course.startDate ? (
                              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 space-y-1">
                                <div className="text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 
                                    Fecha de Inicio Oficial:
                                  </span>
                                  <strong className="text-emerald-950 dark:text-emerald-50 font-extrabold bg-emerald-100/90 dark:bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-300/60 dark:border-emerald-700/60">
                                    {course.startDate}
                                  </strong>
                                </div>
                                {course.endDate && (
                                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Culminación calculada:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{course.endDate}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="pt-1.5 border-t border-emerald-200/50 dark:border-emerald-900/50 flex items-center justify-between text-[11px]">
                                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Fecha de Inicio:
                                </span>
                                <span className="font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300/50 text-[10px]">
                                  Por asignar por Administración
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-2xl space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              Pre-Matrícula Abierta
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                              Mínimo: 3
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-amber-200 dark:bg-amber-900/60 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full transition-all" 
                              style={{ width: `${Math.min(100, ((course.enrolledCount || 0) / 3) * 100)}%` }} 
                            />
                          </div>
                          <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                            ¡Falta{neededForQuorum === 1 ? ' sólo 1 alumno' : `n sólo ${neededForQuorum} alumnos`} para que el Administrador fije fecha de inicio!
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    {course.duracion && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-500" /> Duración:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{course.duracion}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Docente a cargo:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{course.teacherName}</span>
                    </div>
                    {course.schedules && course.schedules.length > 0 && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Horario:</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {course.schedules[0].dayOfWeek} {course.schedules[0].startTime} - {course.schedules[0].endTime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enrollment Action Button */}
                <button
                  onClick={() => handleEnrollClick(course)}
                  disabled={isFull}
                  className={`mt-5 w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isFull
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {isFull ? 'Sin Cupos Disponibles' : 'Matricularme en este Curso'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Infrastructure Spotlight Section */}
      <section id="infraestructura" className="max-w-7xl mx-auto px-4 py-16 w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Instalaciones & Talleres
          </span>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Sede CUAM Calabozo: Espacios 100% Equipados
          </h2>
          <p className="text-xs text-slate-500">
            Laboratorios informáticos, talleres mecánicos y eléctricos, aulas climatizadas y espacios de diseño artesanal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Laboratorio de Cómputo & Redes</h3>
            <p className="text-xs text-slate-500">
              30 equipos Core i7 con conexión de fibra óptica, software de desarrollo, diseño y simuladores técnicos.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Talleres Industriales & Automotrices</h3>
            <p className="text-xs text-slate-500">
              Bancos de prueba para electro-auto, motores diesel y gasolina, refrigeración, tableros eléctricos y microelectrónica.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Talleres de Estética & Confección Textil</h3>
            <p className="text-xs text-slate-500">
              Estaciones de peluquería, barbería, mesas de manicura profesional y máquinas de coser industriales overlock.
            </p>
          </div>
        </div>
      </section>

      {/* Footer & Official Institutional Info */}
      <footer id="contacto" className="bg-slate-950 text-slate-400 text-xs py-14 px-4 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-1">
            <AcademiaValenciaLogo size="sm" showSubtitle={false} className="text-white" />
            <p className="text-slate-400 leading-relaxed text-xs">
              <strong>"¡Capacítate para el Éxito con Academia Valencia!"</strong>. Formación avalada por el Ministerio del Poder Popular para la Educación.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded-lg text-[11px] font-semibold">
                Sede Calabozo, Edo. Guárico
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Navegación</h4>
            <ul className="space-y-2">
              <li><a href="#oferta" className="hover:text-white transition-colors">Catálogo de Cursos</a></li>
              <li><a href="#areas" className="hover:text-white transition-colors">Áreas & Costos</a></li>
              <li><a href="#infraestructura" className="hover:text-white transition-colors">Instalaciones & Talleres</a></li>
              <li><a href="#contacto" className="hover:text-white transition-colors">Contacto & Dirección</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Ubicación & Contacto</h4>
            <div className="space-y-2 text-slate-300">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{INSTITUTION_INFO.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{INSTITUTION_INFO.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="break-all">{INSTITUTION_INFO.email}</span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Horario de Atención</h4>
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5 text-[11px] text-slate-300 mb-3">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Clock className="w-3.5 h-3.5" /> {INSTITUTION_INFO.scheduleSummary}
              </div>
              <p className="text-slate-400">{INSTITUTION_INFO.scheduleHours}</p>
              <p className="text-red-400 font-semibold">{INSTITUTION_INFO.closedDays}</p>
            </div>

            <button
              onClick={openGeneralLogin}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
            >
              <LogIn className="w-4 h-4 text-indigo-400" /> Ingresar al Sistema
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
          <p>© 2026 Academia Valencia • Cursos Avalados por el Ministerio del Poder Popular para la Educación.</p>
          <div className="flex gap-4">
            <span className="text-slate-400">Calabozo, Estado Guárico, Venezuela</span>
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
