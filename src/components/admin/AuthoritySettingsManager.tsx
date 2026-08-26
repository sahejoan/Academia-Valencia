import React, { useState, useEffect } from 'react';
import {
  FileSignature,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building,
  UserCheck,
  Award,
  Shield,
  FileText,
  Printer,
  Sparkles,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InstitutionalAuthoritySettings } from '../../types';
import { INITIAL_AUTHORITY_SETTINGS } from '../../data/initialData';
import { generateCourseGradeActPDF } from '../../utils/pdfExport';

export const AuthoritySettingsManager: React.FC = () => {
  const { authoritySettings, saveAuthoritySettings, courses, grades } = useApp();

  const [formData, setFormData] = useState<InstitutionalAuthoritySettings>(authoritySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize if authoritySettings change in context
  useEffect(() => {
    if (authoritySettings) {
      setFormData(authoritySettings);
    }
  }, [authoritySettings]);

  const handleChange = (field: keyof InstitutionalAuthoritySettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveSuccess(false);
    setErrorMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const result = await saveAuthoritySettings(formData);
    setIsSaving(false);

    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('¿Desea restaurar los datos de autoridades a los valores predeterminados institucionales?')) {
      setFormData(INITIAL_AUTHORITY_SETTINGS);
      await saveAuthoritySettings(INITIAL_AUTHORITY_SETTINGS);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const handleTestActaPDF = () => {
    const sampleCourse = courses[0] || {
      id: 'course-sample',
      code: 'COM-01',
      name: 'Programación I (Algoritmos y Estructuras)',
      term: '2026-1',
      credits: 4,
      capacity: 30,
      enrolledCount: 15,
      teacherId: 'prof-sample',
      teacherName: 'Ing. Carlos Mendoza',
      department: 'Computación e Informática',
      color: 'blue',
      modality: 'Presencial',
      status: 'Activo',
      schedules: [
        {
          id: 'sch-1',
          dayOfWeek: 'Lunes',
          startTime: '08:00',
          endTime: '10:00',
          classroomId: 'aula-1',
          classroomName: 'Aula 101'
        }
      ]
    };

    const courseGrades = grades.filter(g => g.courseId === sampleCourse.id);
    generateCourseGradeActPDF(sampleCourse, courseGrades, formData);
  };

  return (
    <div id="authority-settings-container" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FileSignature className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider">
              <FileSignature className="w-3.5 h-3.5" />
              Configuración de Actas y Documentos Oficiales
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Registro de Firmantes y Autoridades Institucionales
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Configura los datos del Director, Coordinador o Encargado que firma las actas de notas junto al docente titular. Los sellos de agua digitales han sido removidos para que el sello institucional húmedo se coloque físicamente tras la impresión.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestActaPDF}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              title="Descargar Acta de Notas en PDF con la configuración actual"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              Probar Acta PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Live Signature Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                2° Firmante Oficial: Director / Coordinador / Encargado
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Esta autoridad aparecerá en la firma derecha de las actas de calificaciones y reportes oficiales.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            {saveSuccess && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                ¡Datos de autoridades guardados y sincronizados exitosamente con Firestore!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Nombre Completo del Firmante (Director / Coordinador) *
                </label>
                <input
                  id="director-name-input"
                  type="text"
                  required
                  value={formData.directorName}
                  onChange={e => handleChange('directorName', e.target.value)}
                  placeholder="Ej: Laura Coromoto Garcías de Rodríguez"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Cargo / Título Institucional *
                </label>
                <input
                  id="director-title-input"
                  type="text"
                  required
                  value={formData.directorTitle}
                  onChange={e => handleChange('directorTitle', e.target.value)}
                  placeholder="Ej: Directora General / Coordinación Académica"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Cédula de Identidad (Opcional)
                </label>
                <input
                  id="director-cedula-input"
                  type="text"
                  value={formData.directorCedula || ''}
                  onChange={e => handleChange('directorCedula', e.target.value)}
                  placeholder="Ej: V-12.345.678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Departamento / Dependencia
                </label>
                <input
                  id="institution-dept-input"
                  type="text"
                  value={formData.institutionDepartment || ''}
                  onChange={e => handleChange('institutionDepartment', e.target.value)}
                  placeholder="Ej: Dirección Académica • Academia Valencia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* General Institution & Control Estudios */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Institución y Secretaría General
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Nombre de la Institución
                  </label>
                  <input
                    id="institution-name-input"
                    type="text"
                    value={formData.institutionName || ''}
                    onChange={e => handleChange('institutionName', e.target.value)}
                    placeholder="Ej: Academia Valencia"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Control de Estudios / Secretaría
                  </label>
                  <input
                    id="control-estudios-name-input"
                    type="text"
                    value={formData.controlEstudiosName || ''}
                    onChange={e => handleChange('controlEstudiosName', e.target.value)}
                    placeholder="Ej: Lcda. Valentina Sánchez M."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Predeterminados
              </button>

              <button
                id="save-authority-btn"
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Vista Previa de Firmas en Actas
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                En Tiempo Real
              </span>
            </div>

            {/* Visual simulation of the PDF bottom section */}
            <div className="bg-slate-50 dark:bg-slate-950/80 rounded-xl p-5 border border-dashed border-slate-300 dark:border-slate-700 space-y-6">
              <div className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Pie Oficial de Acta de Calificaciones
              </div>

              {/* Two Signature Blocks */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {/* Signatory 1: Docente */}
                <div className="text-center space-y-1">
                  <div className="w-full h-0.5 bg-slate-400 dark:bg-slate-600 mb-2"></div>
                  <p className="text-[11px] font-black text-slate-900 dark:text-slate-100 leading-tight uppercase">
                    PROF. DOCENTE TITULAR
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Docente Titular / Facilitador
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500">
                    Asignatura Oficial
                  </p>
                </div>

                {/* Signatory 2: Director / Coordinador */}
                <div className="text-center space-y-1">
                  <div className="w-full h-0.5 bg-slate-400 dark:bg-slate-600 mb-2"></div>
                  <p className="text-[11px] font-black text-slate-900 dark:text-slate-100 leading-tight uppercase">
                    {formData.directorName || 'NOMBRE DE LA AUTORIDAD'}
                  </p>
                  {formData.directorCedula && (
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                      C.I. {formData.directorCedula}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {formData.directorTitle || 'Cargo Institucional'}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500">
                    {formData.institutionDepartment || formData.institutionName || 'Academia Valencia'}
                  </p>
                </div>
              </div>

              {/* Notice regarding stamp */}
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-lg p-3 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Sin sello de agua digital:</strong> De acuerdo a las normativas de registro académico, el documento se imprime limpio para la colocación física del sello húmedo institucional.
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Documentos afectados por esta configuración:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Actas Oficiales de Calificaciones por Asignatura (Docentes)</li>
                <li>Certificados y Récords Académicos de Estudiantes</li>
                <li>Comprobantes Oficiales de Inscripción y Horarios</li>
                <li>Reportes Globales de Calificaciones</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
