/**
 * Utilidades para el Sistema de Calificaciones de la Academia Valencia
 * - Regla de Redondeo Oficial (Estándar Académico):
 *   Si el decimal es igual o mayor a 0,5 se redondea a un punto más arriba (ej: 15,5 -> 16; 09,5 -> 10).
 *   Si el decimal es menor a 0,5 se redondea dejando solo la parte entera (ej: 15,4 -> 15; 09,4 -> 09).
 * - Separador de decimales: Uso de la Coma (,) en todas las vistas, reportes, actas y entradas numéricas.
 */

/**
 * Redondea una calificación según la regla oficial:
 * >= 0.5 redondea hacia arriba al entero superior, < 0.5 redondea a la parte entera.
 */
export function roundGrade(rawScore: number): number {
  if (isNaN(rawScore) || rawScore <= 0) return 0;
  const clamped = Math.min(20, Math.max(0, rawScore));
  return Math.round(clamped);
}

/**
 * Parsea una entrada de texto o número que puede contener coma (,) o punto (.) como separador decimal
 * ej: "15,5" -> 15.5, "15.4" -> 15.4, "16" -> 16
 */
export function parseGradeInput(input: string | number | undefined | null): number {
  if (input === undefined || input === null || input === '') return 0;
  if (typeof input === 'number') {
    if (isNaN(input)) return 0;
    return Math.min(20, Math.max(0, Number(input.toFixed(2))));
  }
  const str = String(input).trim().replace(',', '.');
  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  return Math.min(20, Math.max(0, Number(parsed.toFixed(2))));
}

/**
 * Formatea un número o calificación utilizando la coma (,) como separador de decimales.
 * Si es un número entero exacto, puede omitir decimales según el parámetro omitZeroDecimals.
 * ej: 15.5 -> "15,5", 15 -> "15", 15.0 con omitZeroDecimals=false -> "15,0"
 */
export function formatDecimal(
  val: number | string | undefined | null,
  decimals = 1,
  omitZeroDecimals = true
): string {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num)) return '0';

  if (omitZeroDecimals && Number.isInteger(num)) {
    return num.toString();
  }

  return num.toFixed(decimals).replace('.', ',');
}

/**
 * Formatea una nota para visualización con coma decimal.
 */
export function formatGrade(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'number' ? val : parseGradeInput(val);
  if (Number.isInteger(num)) {
    return num.toString();
  }
  return formatDecimal(num, 1, true);
}

/**
 * Calcula la calificación final a partir de 4 evaluaciones ponderadas (25% c/u)
 * Aplicando la regla de redondeo oficial (decimal >= 0,5 sube a entero; < 0,5 queda en entero).
 */
export function computeFinalGrade(e1 = 0, e2 = 0, e3 = 0, e4 = 0): {
  rawAverage: number;
  finalGrade: number;
  status: 'Aprobado' | 'Reprobado' | 'En Cursado';
} {
  const numE1 = parseGradeInput(e1);
  const numE2 = parseGradeInput(e2);
  const numE3 = parseGradeInput(e3);
  const numE4 = parseGradeInput(e4);

  const rawAverage = Number(((numE1 + numE2 + numE3 + numE4) / 4).toFixed(2));
  const finalGrade = roundGrade(rawAverage);

  let status: 'Aprobado' | 'Reprobado' | 'En Cursado' = 'En Cursado';
  if (numE1 > 0 || numE2 > 0 || numE3 > 0 || numE4 > 0) {
    status = finalGrade >= 10 ? 'Aprobado' : 'Reprobado';
  }

  return {
    rawAverage,
    finalGrade,
    status
  };
}
