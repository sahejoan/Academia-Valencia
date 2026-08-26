import { Course } from '../types';

export type AcademicAreaKey = 'COMERCIAL' | 'INDUSTRIAL' | 'GERENCIAL' | 'ARTESANAL';

export interface AreaInfo {
  key: AcademicAreaKey;
  name: string;
  codePrefix: string;
  costWeekly: number;
  costText: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const ACADEMIC_AREAS: Record<AcademicAreaKey, AreaInfo> = {
  COMERCIAL: {
    key: 'COMERCIAL',
    name: 'Área Comercial',
    codePrefix: 'COM-',
    costWeekly: 12,
    costText: '12$ Semanal',
    color: 'blue',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/70',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-900'
  },
  INDUSTRIAL: {
    key: 'INDUSTRIAL',
    name: 'Área Industrial',
    codePrefix: 'IND-',
    costWeekly: 12,
    costText: '12$ Semanal',
    color: 'amber',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/70',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-900'
  },
  GERENCIAL: {
    key: 'GERENCIAL',
    name: 'Área Gerencial',
    codePrefix: 'GER-',
    costWeekly: 12,
    costText: '12$ Semanal',
    color: 'purple',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/70',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-900'
  },
  ARTESANAL: {
    key: 'ARTESANAL',
    name: 'Área Artesanal',
    codePrefix: 'ART-',
    costWeekly: 10,
    costText: '10$ Semanal',
    color: 'rose',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/70',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-900'
  }
};

/**
 * Normalizes any course into its corresponding academic area key ('COMERCIAL' | 'INDUSTRIAL' | 'GERENCIAL' | 'ARTESANAL')
 */
export function getCourseAreaKey(course: Partial<Course>): AcademicAreaKey {
  if (course.categoria) {
    const cat = course.categoria.toUpperCase();
    if (cat.includes('COMERCIAL')) return 'COMERCIAL';
    if (cat.includes('INDUSTRIAL')) return 'INDUSTRIAL';
    if (cat.includes('GERENCIAL')) return 'GERENCIAL';
    if (cat.includes('ARTESANAL')) return 'ARTESANAL';
  }

  const code = (course.code || '').toUpperCase();
  if (code.startsWith('COM-')) return 'COMERCIAL';
  if (code.startsWith('IND-')) return 'INDUSTRIAL';
  if (code.startsWith('GER-')) return 'GERENCIAL';
  if (code.startsWith('ART-')) return 'ARTESANAL';

  const dept = (course.department || '').toUpperCase();
  if (dept.includes('COMERCIAL')) return 'COMERCIAL';
  if (dept.includes('INDUSTRIAL')) return 'INDUSTRIAL';
  if (dept.includes('GERENCIAL')) return 'GERENCIAL';
  if (dept.includes('ARTESANAL')) return 'ARTESANAL';

  const career = (course.career || '').toUpperCase();
  if (career.includes('COMERCIAL')) return 'COMERCIAL';
  if (career.includes('INDUSTRIAL')) return 'INDUSTRIAL';
  if (career.includes('GERENCIAL')) return 'GERENCIAL';
  if (career.includes('ARTESANAL')) return 'ARTESANAL';

  return 'COMERCIAL';
}

/**
 * Returns the human-readable area name (e.g., 'Área Comercial')
 */
export function getCourseAreaName(course: Partial<Course>): string {
  const areaKey = getCourseAreaKey(course);
  return ACADEMIC_AREAS[areaKey].name;
}

/**
 * Returns the CSS styling classes for displaying an area badge
 */
export function getCourseAreaBadgeClasses(course: Partial<Course>): string {
  const areaKey = getCourseAreaKey(course);
  const area = ACADEMIC_AREAS[areaKey];
  return `${area.badgeBg} ${area.badgeText} ${area.badgeBorder} border font-bold`;
}

/**
 * Determines whether a course matches a given area filter string
 */
export function courseMatchesAreaFilter(course: Partial<Course>, filter: string): boolean {
  if (!filter || filter === 'all') return true;
  const targetArea = filter.toUpperCase();
  const courseArea = getCourseAreaKey(course);

  if (targetArea === courseArea) return true;
  if (targetArea.includes(courseArea)) return true;
  if (courseArea.includes(targetArea)) return true;

  return false;
}
