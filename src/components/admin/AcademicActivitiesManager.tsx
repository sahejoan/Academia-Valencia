import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  Tag,
  Share2,
  Download,
  AlertTriangle,
  X,
  ExternalLink,
  BookOpen,
  SlidersHorizontal,
  BookmarkPlus,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AcademicActivity } from '../../types';

const PRESET_IMAGES = [
  { label: 'Inteligencia Artificial', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80' },
  { label: 'Desarrollo & Cloud', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80' },
  { label: 'Ciberseguridad', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80' },
  { label: 'Diseño UI/UX', url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&auto=format&fit=crop&q=80' },
  { label: 'Robótica e IoT', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80' },
  { label: 'Gestión & Liderazgo', url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop&q=80' }
];

export const AcademicActivitiesManager: React.FC = () => {
  const {
    activities,
    currentUser,
    saveActivity,
    deleteActivity,
    enrollActivity,
    dropActivityEnrollment,
    hasPermission
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Partial<AcademicActivity> | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [activityToDelete, setActivityToDelete] = useState<AcademicActivity | null>(null);
  const [enrolledMap, setEnrolledMap] = useState<Record<string, boolean>>({});

  const canCreate = currentUser.role === 'admin' && hasPermission('activities.create');
  const canEdit = currentUser.role === 'admin' && hasPermission('activities.edit');
  const canDelete = currentUser.role === 'admin' && hasPermission('activities.delete');
  const canEnroll = hasPermission('activities.enroll');

  const categories = ['all', 'Hackathon', 'Diplomado', 'Conferencia', 'Taller', 'Seminario'];
  const modalities = ['all', 'Presencial', 'Virtual', 'Híbrida'];

  // Filter activities
  const filteredActivities = activities.filter(act => {
    const matchesSearch =
      act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || act.category === selectedCategory;
    const matchesModality = selectedModality === 'all' || act.modality === selectedModality;

    return matchesSearch && matchesCategory && matchesModality;
  });

  const totalActivities = activities.length;
  const totalEnrolledSpots = activities.reduce((acc, a) => acc + a.enrolledCount, 0);
  const totalCapacity = activities.reduce((acc, a) => acc + a.capacity, 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalEnrolledSpots / totalCapacity) * 100) : 0;

  const handleOpenCreateModal = () => {
    setEditingActivity({
      id: `act-${Date.now()}`,
      title: '',
      category: 'Taller',
      date: '20 de Septiembre, 2026',
      time: '04:00 PM - 06:00 PM',
      location: 'Auditorio Central / Aula Virtual',
      speaker: currentUser.name || 'Docente Invitado',
      capacity: 40,
      enrolledCount: 0,
      image: PRESET_IMAGES[0].url,
      description: '',
      modality: 'Presencial',
      tags: ['Académico', 'Valencia']
    });
    setTagsInput('Académico, Valencia');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (activity: AcademicActivity) => {
    setEditingActivity({ ...activity });
    setTagsInput(activity.tags.join(', '));
    setIsModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity?.title || !editingActivity?.speaker) return;

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const activityToSave: AcademicActivity = {
      id: editingActivity.id || `act-${Date.now()}`,
      title: editingActivity.title.trim(),
      category: (editingActivity.category as any) || 'Taller',
      date: editingActivity.date || 'Por Definir',
      time: editingActivity.time || '10:00 AM - 12:00 PM',
      location: editingActivity.location || 'Campus Valencia',
      speaker: editingActivity.speaker.trim(),
      capacity: Number(editingActivity.capacity) || 30,
      enrolledCount: Number(editingActivity.enrolledCount) || 0,
      image: editingActivity.image || PRESET_IMAGES[0].url,
      description: editingActivity.description || '',
      modality: (editingActivity.modality as any) || 'Presencial',
      tags: parsedTags.length > 0 ? parsedTags : ['Académico']
    };

    saveActivity(activityToSave);
    setIsModalOpen(false);
    setEditingActivity(null);
  };

  const handleConfirmDelete = () => {
    if (activityToDelete) {
      deleteActivity(activityToDelete.id);
      setActivityToDelete(null);
    }
  };

  const handleToggleEnrollment = (activityId: string) => {
    if (enrolledMap[activityId]) {
      dropActivityEnrollment(activityId);
      setEnrolledMap(prev => ({ ...prev, [activityId]: false }));
    } else {
      const res = enrollActivity(activityId);
      if (res.success) {
        setEnrolledMap(prev => ({ ...prev, [activityId]: true }));
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-100">
              <Sparkles className="w-3.5 h-3.5 text-sky-200" /> Módulo de Gestión Académica
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Actividades Extracurriculares & Eventos
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
              Programación, control de aforo y registro de conferencias, talleres y actividades extracurriculares institucionales (creación exclusiva por Administración).
            </p>
          </div>

          {canCreate && (
            <button
              id="btn-create-academic-activity"
              onClick={handleOpenCreateModal}
              className="px-5 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Plus className="w-4 h-4 text-sky-400" />
              <span>Nueva Actividad Extracurricular</span>
            </button>
          )}
        </div>

        {/* Metrics Row */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <span className="text-xs text-sky-100 font-medium">Actividades Totales</span>
            <p className="text-xl font-extrabold text-white mt-0.5">{totalActivities}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <span className="text-xs text-sky-100 font-medium">Inscritos Totales</span>
            <p className="text-xl font-extrabold text-sky-200 mt-0.5">{totalEnrolledSpots}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <span className="text-xs text-sky-100 font-medium">Aforo Global</span>
            <p className="text-xl font-extrabold text-emerald-300 mt-0.5">{totalCapacity} cupos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <span className="text-xs text-sky-100 font-medium">Ocupación Media</span>
            <p className="text-xl font-extrabold text-amber-300 mt-0.5">{occupancyPercent}%</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, ponente o tag..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Category selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'Todas las Categorías' : cat}
                </button>
              ))}
            </div>

            {/* Modality selector */}
            <select
              value={selectedModality}
              onChange={e => setSelectedModality(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Modalidad: Todas</option>
              <option value="Presencial">Presencial</option>
              <option value="Virtual">Virtual</option>
              <option value="Híbrida">Híbrida</option>
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-500'
                }`}
                title="Vista Cuadrícula"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-500'
                }`}
                title="Vista Tabla"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Display */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No se encontraron actividades con los filtros actuales
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Intenta cambiar los términos de búsqueda o crear una nueva actividad académica para el período actual.
          </p>
          {canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow hover:bg-indigo-500 cursor-pointer"
            >
              + Crear Nueva Actividad
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredActivities.map(activity => {
            const isFull = activity.enrolledCount >= activity.capacity;
            const percent = Math.min(100, Math.round((activity.enrolledCount / activity.capacity) * 100));
            const isEnrolled = enrolledMap[activity.id];

            return (
              <div
                key={activity.id}
                id={`activity-card-${activity.id}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
              >
                {/* Cover Image & Category Badge */}
                <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                  <img
                    src={activity.image}
                    alt={activity.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                  
                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-indigo-600 text-white shadow-md">
                      {activity.category}
                    </span>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900/80 backdrop-blur text-white border border-slate-700">
                      {activity.modality}
                    </span>
                  </div>

                  {/* Actions for Admin / Teachers */}
                  {(canEdit || canDelete) && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/90 backdrop-blur p-1 rounded-xl border border-slate-700 shadow-lg">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEditModal(activity)}
                          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Editar actividad"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setActivityToDelete(activity)}
                          className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar actividad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Date Badge Bottom */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="flex items-center gap-1 font-semibold text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      {activity.date}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-300 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {activity.time}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-2">
                      {activity.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                      {activity.description}
                    </p>
                  </div>

                  {/* Speaker and Location */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                      <UserIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{activity.speaker}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{activity.location}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {activity.tags && activity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {activity.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Enrollment Progress & Action */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Cupos Ocupados
                      </span>
                      <span className={`font-bold ${isFull ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                        {activity.enrolledCount} / {activity.capacity} ({percent}%)
                      </span>
                    </div>
                    
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull
                            ? 'bg-rose-500'
                            : percent > 75
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Action Button for User */}
                    {canEnroll && (
                      <button
                        onClick={() => handleToggleEnrollment(activity.id)}
                        disabled={isFull && !isEnrolled}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1 ${
                          isEnrolled
                            ? 'bg-emerald-100 hover:bg-rose-100 text-emerald-800 hover:text-rose-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : isFull
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        }`}
                      >
                        {isEnrolled ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cupo Reservado (Click para Cancelar)
                          </>
                        ) : isFull ? (
                          'Agotado (Sin Cupos)'
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" /> Inscribirme / Reservar Cupo
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Actividad Académica</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Modalidad</th>
                  <th className="py-3 px-3">Ponente / Responsable</th>
                  <th className="py-3 px-3">Fecha y Hora</th>
                  <th className="py-3 px-3">Aforo & Cupos</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredActivities.map(activity => {
                  const isFull = activity.enrolledCount >= activity.capacity;
                  return (
                    <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={activity.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{activity.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{activity.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {activity.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{activity.modality}</span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {activity.speaker}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{activity.date}</p>
                        <p className="text-[11px] text-slate-500">{activity.time}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`font-bold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {activity.enrolledCount} / {activity.capacity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEditModal(activity)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setActivityToDelete(activity)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ACTIVITY MODAL */}
      {isModalOpen && editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingActivity.id?.startsWith('act-') && !activities.some(a => a.id === editingActivity.id)
                    ? 'Crear Nueva Actividad Académica'
                    : 'Editar Actividad Académica'}
                </h3>
                <p className="text-xs text-slate-500">
                  Completa los detalles de la actividad, ponente, cupos y programación.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Título de la Actividad *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Hackathon Nacional de IA & Microservicios"
                  value={editingActivity.title || ''}
                  onChange={e => setEditingActivity({ ...editingActivity, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              {/* Category & Modality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Tipo / Categoría *
                  </label>
                  <select
                    value={editingActivity.category || 'Taller'}
                    onChange={e => setEditingActivity({ ...editingActivity, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold dark:text-white focus:outline-none"
                  >
                    <option value="Conferencia">Conferencia Magistral</option>
                    <option value="Taller">Taller Práctico / Workshop</option>
                    <option value="Diplomado">Diplomado Especializado</option>
                    <option value="Hackathon">Hackathon & Concurso</option>
                    <option value="Seminario">Seminario Académico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Modalidad *
                  </label>
                  <select
                    value={editingActivity.modality || 'Presencial'}
                    onChange={e => setEditingActivity({ ...editingActivity, modality: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold dark:text-white focus:outline-none"
                  >
                    <option value="Presencial">Presencial (Campus)</option>
                    <option value="Virtual">Virtual (En Línea / Teams)</option>
                    <option value="Híbrida">Híbrida (Presencial + Streaming)</option>
                  </select>
                </div>
              </div>

              {/* Speaker & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ponente / Docente Responsable *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Dra. María Fernanda Alarcón"
                    value={editingActivity.speaker || ''}
                    onChange={e => setEditingActivity({ ...editingActivity, speaker: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ubicación / Plataforma *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Auditorio Edificio B / Sala Teams 101"
                    value={editingActivity.location || ''}
                    onChange={e => setEditingActivity({ ...editingActivity, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Fecha del Evento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. 25 de Septiembre, 2026"
                    value={editingActivity.date || ''}
                    onChange={e => setEditingActivity({ ...editingActivity, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Horario *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. 09:00 AM - 01:00 PM"
                    value={editingActivity.time || ''}
                    onChange={e => setEditingActivity({ ...editingActivity, time: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Aforo / Capacidad *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    required
                    value={editingActivity.capacity || 30}
                    onChange={e => setEditingActivity({ ...editingActivity, capacity: parseInt(e.target.value) || 30 })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-indigo-600 focus:outline-none dark:text-indigo-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Descripción del Programa y Objetivos
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre el contenido, requisitos previos y competencias a desarrollar..."
                  value={editingActivity.description || ''}
                  onChange={e => setEditingActivity({ ...editingActivity, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white"
                />
              </div>

              {/* Cover Image Preset Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Imagen de Portada (Temas Predefinidos)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                  {PRESET_IMAGES.map((img, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setEditingActivity({ ...editingActivity, image: img.url })}
                      className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        editingActivity.image === img.url
                          ? 'border-indigo-600 ring-2 ring-indigo-500/40'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/80 text-[8px] font-bold text-white text-center py-0.5 truncate px-1">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="O pega una URL de imagen personalizada..."
                  value={editingActivity.image || ''}
                  onChange={e => setEditingActivity({ ...editingActivity, image: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Etiquetas / Tags (Separadas por comas)
                </label>
                <input
                  type="text"
                  placeholder="ej. AI, Cloud, Python, Certificado"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Guardar y Publicar Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {activityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Eliminar Actividad Académica?
                </h4>
                <p className="text-xs text-slate-500">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              Se eliminará permanentemente la actividad <strong>"{activityToDelete.title}"</strong> y se cancelarán los {activityToDelete.enrolledCount} cupos reservados.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActivityToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30"
              >
                Sí, Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
