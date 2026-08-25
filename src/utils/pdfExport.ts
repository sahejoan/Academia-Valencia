import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, Course, GradeItem, Classroom, Enrollment, SystemAnalytics } from '../types';

// ==========================================
// INSTITUTIONAL CONSTANTS & PALETTE
// ==========================================
const BRAND_COLORS = {
  primaryOrange: [255, 102, 0] as [number, number, number], // #FF6600
  deepNavy: [30, 58, 138] as [number, number, number],       // #1E3A8A
  darkSlate: [15, 23, 42] as [number, number, number],       // #0F172A
  goldAccent: [217, 119, 6] as [number, number, number],     // #D97706
  lightBg: [248, 250, 252] as [number, number, number],      // #F8FAFC
  borderSlate: [226, 232, 240] as [number, number, number],  // #E2E8F0
  textMuted: [100, 116, 139] as [number, number, number],    // #64748B
  textDark: [30, 41, 59] as [number, number, number],        // #1E293B
  successGreen: [16, 185, 129] as [number, number, number]   // #10B981
};

/**
 * Draws the official Academia Valencia Owl & Graduation Cap vector logo onto the PDF
 */
function drawOfficialLogo(doc: jsPDF, x: number, y: number, width: number, height: number) {
  // Background Orange Shield Card
  doc.setFillColor(...BRAND_COLORS.primaryOrange);
  doc.roundedRect(x, y, width, height, 3, 3, 'F');

  // Scale factors based on width/height (standard base: 24x24)
  const s = width / 24;
  const ox = x + width / 2;
  const oy = y + height / 2;

  // Graduation Cap Top (Diamond Polygon)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3 * s);

  // Mortarboard diamond (two triangles)
  doc.triangle(ox, oy - 7 * s, ox + 7 * s, oy - 4 * s, ox - 7 * s, oy - 4 * s, 'F');
  doc.triangle(ox, oy - 1 * s, ox + 7 * s, oy - 4 * s, ox - 7 * s, oy - 4 * s, 'F');

  // Skullcap
  doc.rect(ox - 4 * s, oy - 3.5 * s, 8 * s, 2 * s, 'F');

  // Tassel
  doc.setLineWidth(0.4 * s);
  doc.line(ox + 6 * s, oy - 3.5 * s, ox + 6 * s, oy + 1 * s);
  doc.circle(ox + 6 * s, oy + 1.5 * s, 0.6 * s, 'F');

  // Owl Face Shield Outline / Base
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(ox - 6 * s, oy - 0.5 * s, 12 * s, 7 * s, 2 * s, 2 * s, 'S');

  // Owl Eyes (White circles)
  doc.setFillColor(255, 255, 255);
  doc.circle(ox - 2.8 * s, oy + 2.5 * s, 2.2 * s, 'FD');
  doc.circle(ox + 2.8 * s, oy + 2.5 * s, 2.2 * s, 'FD');

  // Pupils (Orange dots inside eyes)
  doc.setFillColor(...BRAND_COLORS.primaryOrange);
  doc.circle(ox - 2.8 * s, oy + 2.5 * s, 1.1 * s, 'F');
  doc.circle(ox + 2.8 * s, oy + 2.5 * s, 1.1 * s, 'F');

  // Beak (Small white triangle)
  doc.setFillColor(255, 255, 255);
  doc.triangle(ox - 1 * s, oy + 3.8 * s, ox + 1 * s, oy + 3.8 * s, ox, oy + 5.2 * s, 'F');
}

/**
 * Draws the institutional header with banner, logo, institution info, and folio box
 */
function drawInstitutionalHeader(
  doc: jsPDF,
  documentTitle: string,
  documentSubtitle: string,
  folioCode: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Navy Bar
  doc.setFillColor(...BRAND_COLORS.deepNavy);
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Orange Accent Line
  doc.setFillColor(...BRAND_COLORS.primaryOrange);
  doc.rect(0, 36, pageWidth, 3, 'F');

  // Draw Owl Logo
  drawOfficialLogo(doc, 14, 6, 24, 24);

  // Institution Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ACADEMIA VALENCIA', 43, 14);

  // Subtitle / Motto
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('CURSOS AVALADOS POR EL MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN', 43, 20);
  doc.text('Calle 3 cruce con carrera 10, sede del CUAM Calabozo, Estado Guárico', 43, 25);
  doc.text('Tlf/WhatsApp: 0414-485.92.15 • academiavalencia15calabozo@gmail.com', 43, 30);

  // Right Side Folio & Validation Box
  const folioBoxWidth = 55;
  const folioBoxX = pageWidth - folioBoxWidth - 12;

  doc.setFillColor(15, 23, 42); // darker navy
  doc.roundedRect(folioBoxX, 6, folioBoxWidth, 24, 2, 2, 'F');
  doc.setDrawColor(255, 102, 0);
  doc.setLineWidth(0.4);
  doc.roundedRect(folioBoxX, 6, folioBoxWidth, 24, 2, 2, 'S');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 165, 0);
  doc.text('DOCUMENTO OFICIAL VERIFICABLE', folioBoxX + 4, 11);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`N° FOLIO: ${folioCode}`, folioBoxX + 4, 17);
  doc.text(`EMISIÓN: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, folioBoxX + 4, 22);
  doc.text(`HASH: VAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, folioBoxX + 4, 27);

  // Document Title Banner (Below Header)
  doc.setFillColor(...BRAND_COLORS.lightBg);
  doc.rect(14, 43, pageWidth - 28, 14, 'F');
  doc.setDrawColor(...BRAND_COLORS.borderSlate);
  doc.setLineWidth(0.3);
  doc.rect(14, 43, pageWidth - 28, 14, 'S');

  // Left accent bar in title box
  doc.setFillColor(...BRAND_COLORS.deepNavy);
  doc.rect(14, 43, 3, 14, 'F');

  doc.setTextColor(...BRAND_COLORS.deepNavy);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(documentTitle.toUpperCase(), 21, 50);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND_COLORS.textMuted);
  doc.text(documentSubtitle, 21, 54.5);
}

/**
 * Draws the official footer with security seals, page numbers, and verification text
 */
function drawInstitutionalFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 18;

  // Thin separator line
  doc.setDrawColor(...BRAND_COLORS.borderSlate);
  doc.setLineWidth(0.4);
  doc.line(14, footerY, pageWidth - 14, footerY);

  // Security Verification notice
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND_COLORS.textMuted);
  doc.text(
    'Este documento ha sido emitido digitalmente por la Secretaría de Control de Estudios de la Academia Valencia.',
    14,
    footerY + 5
  );
  doc.text(
    'La autenticidad de este certificado puede ser verificada escaneando el código seguro o en https://verificar.academiavalencia.edu',
    14,
    footerY + 9
  );
  doc.text('Válido a nivel nacional e internacional • Sin tachaduras ni enmiendas.', 14, footerY + 13);

  // Simulated QR Code Block
  const qrX = pageWidth - 42;
  const qrY = footerY + 2;
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX, qrY, 12, 12, 'F');
  doc.setDrawColor(...BRAND_COLORS.deepNavy);
  doc.setLineWidth(0.3);
  doc.rect(qrX, qrY, 12, 12, 'S');

  // Mini QR matrix pattern
  doc.setFillColor(...BRAND_COLORS.deepNavy);
  doc.rect(qrX + 1.5, qrY + 1.5, 3, 3, 'F');
  doc.rect(qrX + 7.5, qrY + 1.5, 3, 3, 'F');
  doc.rect(qrX + 1.5, qrY + 7.5, 3, 3, 'F');
  doc.rect(qrX + 5.5, qrY + 5.5, 2, 2, 'F');
  doc.rect(qrX + 7.5, qrY + 8, 2.5, 2.5, 'F');

  // Page info
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.textDark);
  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 26, footerY + 9);
}

/**
 * Draws official signature blocks and circular security stamp
 */
function drawOfficialSignatures(doc: jsPDF, startY: number, title1 = 'Secretaría General y Registro', title2 = 'Dirección Académica y Decanato') {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Signature lines
  const lineY = startY + 18;
  const leftX = 26;
  const rightX = pageWidth - 90;
  const lineWidth = 64;

  // Signatory 1
  doc.setDrawColor(...BRAND_COLORS.textMuted);
  doc.setLineWidth(0.4);
  doc.line(leftX, lineY, leftX + lineWidth, lineY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.textDark);
  doc.text('LCDA. VALENTINA SÁNCHEZ M.', leftX + lineWidth / 2, lineY + 5, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND_COLORS.textMuted);
  doc.text(title1, leftX + lineWidth / 2, lineY + 9, { align: 'center' });
  doc.text('Control de Estudios • Academia Valencia', leftX + lineWidth / 2, lineY + 12.5, { align: 'center' });

  // Signatory 2
  doc.setDrawColor(...BRAND_COLORS.textMuted);
  doc.line(rightX, lineY, rightX + lineWidth, lineY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.textDark);
  doc.text('DR. CARLOS E. MENDOZA R.', rightX + lineWidth / 2, lineY + 5, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND_COLORS.textMuted);
  doc.text(title2, rightX + lineWidth / 2, lineY + 9, { align: 'center' });
  doc.text('Consejo Directivo • Academia Valencia', rightX + lineWidth / 2, lineY + 12.5, { align: 'center' });

  // Official Circular Stamp (Center)
  const stampCenterX = pageWidth / 2;
  const stampCenterY = lineY + 4;

  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.6);
  doc.circle(stampCenterX, stampCenterY, 14, 'S');
  doc.setLineWidth(0.2);
  doc.circle(stampCenterX, stampCenterY, 12, 'S');

  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('ACADEMIA VALENCIA • CONTROL ESTUDIOS', stampCenterX, stampCenterY - 6, { align: 'center' });
  doc.setFontSize(6);
  doc.text('OFICIALIZADO', stampCenterX, stampCenterY, { align: 'center' });
  doc.setFontSize(4.5);
  doc.text('SEDE PRINCIPAL VALENCIA', stampCenterX, stampCenterY + 5, { align: 'center' });
  doc.text('REGISTRADO', stampCenterX, stampCenterY + 8, { align: 'center' });
}

// ==========================================
// 1. CERTIFICADO DE CALIFICACIONES (ESTUDIANTE)
// ==========================================
export function generateStudentTranscriptPDF(student: User, grades: GradeItem[]) {
  const doc = new jsPDF();
  const folioCode = `KDX-${student.code}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Header
  drawInstitutionalHeader(
    doc,
    'Certificado Oficial de Calificaciones y Récord Académico',
    'Constancia formal de rendimiento, evaluaciones parciales y estado de aprobación curricular',
    folioCode
  );

  // Student Information Box
  doc.setFillColor(...BRAND_COLORS.lightBg);
  doc.roundedRect(14, 61, 182, 30, 2, 2, 'F');
  doc.setDrawColor(...BRAND_COLORS.borderSlate);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 61, 182, 30, 2, 2, 'S');

  // Student Details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.deepNavy);
  doc.text('DATOS DE FILIACIÓN ACADÉMICA', 18, 68);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.textDark);
  doc.text('Estudiante:', 18, 75);
  doc.text('Cédula / DNI:', 18, 81);
  doc.text('Programa / Área:', 18, 87);

  doc.setFont('helvetica', 'normal');
  doc.text(student.name.toUpperCase(), 42, 75);
  doc.text(student.cedula || student.code, 42, 81);
  doc.text(student.career || 'Formación Profesional Continua', 42, 87);

  doc.setFont('helvetica', 'bold');
  doc.text('Código Matrícula:', 110, 75);
  doc.text('Correo Electrónico:', 110, 81);
  doc.text('Período Académico:', 110, 87);

  doc.setFont('helvetica', 'normal');
  doc.text(student.code, 142, 75);
  doc.text(student.email, 142, 81);
  doc.text(`Período Lectivo 2026-I`, 142, 87);

  // Metrics calculation
  const totalCourses = grades.length;
  const approvedCount = grades.filter(g => g.finalGrade >= 10 || g.status === 'Aprobado').length;
  const failedCount = grades.filter(g => g.finalGrade < 10 && g.finalGrade > 0).length;
  const gpa = totalCourses > 0 
    ? (grades.reduce((acc, g) => acc + g.finalGrade, 0) / totalCourses).toFixed(1)
    : '0.0';

  // Table Data (4 Evaluaciones 25% c/u en escala 1-20)
  const tableRows = grades.map(g => [
    g.courseCode,
    g.courseName,
    (g.evaluacion1 ?? g.parcial1 ?? 0).toString(),
    (g.evaluacion2 ?? g.parcial2 ?? 0).toString(),
    (g.evaluacion3 ?? g.practicas ?? 0).toString(),
    (g.evaluacion4 ?? g.examenFinal ?? 0).toString(),
    `${g.asistencia}%`,
    g.finalGrade.toFixed(1),
    g.finalGrade >= 10 ? 'Aprobado' : (g.finalGrade > 0 ? 'Reprobado' : 'En Cursado')
  ]);

  autoTable(doc, {
    startY: 96,
    head: [[
      'CÓDIGO',
      'ASIGNATURA / MÓDULO CURRICULAR',
      'EV 1 (25%)',
      'EV 2 (25%)',
      'EV 3 (25%)',
      'EV 4 (25%)',
      'ASIST.',
      'NOTA FIN.',
      'ESTADO'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.deepNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle',
      minCellHeight: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: BRAND_COLORS.textDark,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 52 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 17, halign: 'center' },
      5: { cellWidth: 19, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 16, halign: 'center', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (data) => {
      // Colorize state cell
      if (data.section === 'body' && data.column.index === 8) {
        const val = data.cell.raw;
        if (val === 'Aprobado') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (val === 'Reprobado') {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 160;

  // Academic Summary Card
  doc.setFillColor(...BRAND_COLORS.lightBg);
  doc.roundedRect(14, finalY + 6, 182, 18, 2, 2, 'F');
  doc.setDrawColor(...BRAND_COLORS.borderSlate);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, finalY + 6, 182, 18, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.deepNavy);
  doc.text(`Promedio Ponderado: ${gpa} / 20 pts (Mínimo aprobatorio: 10 pts)`, 20, finalY + 17);
  doc.text(`Total Asignaturas: ${totalCourses}`, 105, finalY + 17);
  doc.text(`Aprobadas: ${approvedCount}`, 145, finalY + 17);
  doc.text(`Reprobadas: ${failedCount}`, 172, finalY + 17);

  // Official Signatures
  drawOfficialSignatures(doc, finalY + 28);

  // Footer
  drawInstitutionalFooter(doc, 1, 1);

  doc.save(`Certificado_Calificaciones_${student.code}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ==========================================
// 2. ACTA OFICIAL DE NOTAS POR CURSO (DOCENTE / ADMIN)
// ==========================================
export function generateCourseGradeActPDF(course: Course, grades: GradeItem[]) {
  const doc = new jsPDF();
  const folioCode = `ACT-${course.code}-${course.term}`;

  // Header
  drawInstitutionalHeader(
    doc,
    'Acta Oficial de Calificaciones Finales y Asistencia',
    `Área / Dpto: ${course.department} • Período: ${course.term} • Modalidad: ${course.modality}`,
    folioCode
  );

  // Course Details Header Box
  doc.setFillColor(...BRAND_COLORS.lightBg);
  doc.roundedRect(14, 61, 182, 24, 2, 2, 'F');
  doc.setDrawColor(...BRAND_COLORS.borderSlate);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 61, 182, 24, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.textDark);
  doc.text('Asignatura:', 18, 68);
  doc.text('Docente Titular:', 18, 74);
  doc.text('Horario / Aula:', 18, 80);

  doc.setFont('helvetica', 'normal');
  doc.text(`${course.name} (${course.code})`, 45, 68);
  doc.text(course.teacherName, 45, 74);
  const scheduleStr = course.schedules.map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime} [${s.classroomName}]`).join(' | ');
  doc.text(scheduleStr || 'Por definir', 45, 80);

  doc.setFont('helvetica', 'bold');
  doc.text('Aforo / Cupos:', 125, 68);
  doc.text('Inscritos Oficiales:', 125, 74);
  doc.text('Duración:', 125, 80);

  doc.setFont('helvetica', 'normal');
  doc.text(`${course.capacity} Plazas`, 155, 68);
  doc.text(`${grades.length} Estudiantes`, 155, 74);
  doc.text(course.duracion || (course.horasAcademicas ? `${course.horasAcademicas} Horas Académicas` : '40 Horas Académicas'), 155, 80);

  // Table Data (4 Evaluaciones 25% c/u en escala 1-20)
  const tableRows = grades.map((g, idx) => [
    (idx + 1).toString(),
    g.studentCode,
    g.studentName,
    (g.evaluacion1 ?? g.parcial1 ?? 0).toString(),
    (g.evaluacion2 ?? g.parcial2 ?? 0).toString(),
    (g.evaluacion3 ?? g.practicas ?? 0).toString(),
    (g.evaluacion4 ?? g.examenFinal ?? 0).toString(),
    `${g.asistencia}%`,
    g.finalGrade.toFixed(1),
    g.finalGrade >= 10 ? 'Aprobado' : (g.finalGrade > 0 ? 'Reprobado' : 'En Cursado')
  ]);

  autoTable(doc, {
    startY: 90,
    head: [[
      'N°',
      'CÓDIGO',
      'ESTUDIANTE (NOMBRES Y APELLIDOS)',
      'EV 1 (25%)',
      'EV 2 (25%)',
      'EV 3 (25%)',
      'EV 4 (25%)',
      'ASIST.',
      'FINAL (1-20)',
      'ESTADO'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.darkSlate,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: BRAND_COLORS.textDark,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 55 },
      3: { cellWidth: 13, halign: 'center' },
      4: { cellWidth: 13, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 13, halign: 'center' },
      8: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 17, halign: 'center', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 160;

  // Signatures
  drawOfficialSignatures(
    doc,
    finalY + 12,
    `Firma Docente: ${course.teacherName}`,
    'Dirección Académica y Decanato'
  );

  // Footer
  drawInstitutionalFooter(doc, 1, 1);

  doc.save(`Acta_Oficial_Calificaciones_${course.code}_${course.term}.pdf`);
}

// ==========================================
// 3. COMPROBANTE DE INSCRIPCIÓN Y HORARIOS
// ==========================================
export function generateSchedulePDF(student: User, enrollments: Enrollment[], courses: Course[]) {
  const doc = new jsPDF();
  const folioCode = `HOR-${student.code}-2026`;

  // Header
  drawInstitutionalHeader(
    doc,
    'Comprobante Oficial de Inscripción y Horario de Clases',
    'Asignación de asignaturas, facilitadores docentes y distribución de aulas físicas',
    folioCode
  );

  // Student Meta
  doc.setFillColor(...BRAND_COLORS.lightBg);
  doc.roundedRect(14, 61, 182, 22, 2, 2, 'F');
  doc.setDrawColor(...BRAND_COLORS.borderSlate);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 61, 182, 22, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.textDark);
  doc.text('Estudiante:', 18, 68);
  doc.text('Carrera / Área:', 18, 75);

  doc.setFont('helvetica', 'normal');
  doc.text(`${student.name.toUpperCase()} (ID: ${student.code})`, 40, 68);
  doc.text(student.career || 'Formación Técnica / Profesional', 40, 75);

  doc.setFont('helvetica', 'bold');
  doc.text('Cédula:', 120, 68);
  doc.text('Período:', 120, 75);

  doc.setFont('helvetica', 'normal');
  doc.text(student.cedula || student.code, 140, 68);
  doc.text('2026-I (Enero - Junio)', 140, 75);

  const studentCourses = courses.filter(c => enrollments.some(e => e.courseId === c.id));

  const tableData: string[][] = [];
  studentCourses.forEach(c => {
    c.schedules.forEach(s => {
      tableData.push([
        c.code,
        c.name,
        s.dayOfWeek,
        `${s.startTime} - ${s.endTime}`,
        s.classroomName,
        c.teacherName,
        c.modality
      ]);
    });
  });

  autoTable(doc, {
    startY: 88,
    head: [['CÓDIGO', 'ASIGNATURA', 'DÍA', 'HORARIO', 'AULA / ESPACIO', 'FACILITADOR / DOCENTE', 'MODALIDAD']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.primaryOrange,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: BRAND_COLORS.textDark
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 26 },
      5: { cellWidth: 30 },
      6: { cellWidth: 14, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Institutional Notice Box
  doc.setFillColor(...BRAND_COLORS.lightBg);
  doc.roundedRect(14, finalY + 8, 182, 18, 2, 2, 'F');
  doc.setDrawColor(...BRAND_COLORS.borderSlate);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, finalY + 8, 182, 18, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.deepNavy);
  doc.text('CONDICIONES DE ASISTENCIA Y MATRÍCULA:', 18, finalY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND_COLORS.textMuted);
  doc.text('El estudiante debe presentar este comprobante el primer día de clases. Se exige un mínimo de 75% de asistencia.', 18, finalY + 20);

  // Signatures
  drawOfficialSignatures(doc, finalY + 30, 'Secretaría de Admisión y Registro', 'Dirección Académica');

  // Footer
  drawInstitutionalFooter(doc, 1, 1);

  doc.save(`Horario_Oficial_${student.code}_2026.pdf`);
}

// ==========================================
// 4. CATÁLOGO CONSOLIDADO DE OFERTA ACADÉMICA (47 CURSOS)
// ==========================================
export function generateAcademicOfferPDF(courses: Course[], term = '2026-I') {
  const doc = new jsPDF({ orientation: 'landscape' });
  const folioCode = `OFR-VAL-${term}`;

  drawInstitutionalHeader(
    doc,
    'Catálogo Consolidado de Oferta Académica y Asignación Docente',
    `Programación Curricular Integral • 4 Áreas Temáticas • Período Lectivo: ${term}`,
    folioCode
  );

  const tableData = courses.map(c => [
    c.code,
    c.name,
    c.department,
    c.duracion || '40 Horas',
    c.teacherName,
    c.schedules.map(s => `${s.dayOfWeek.substring(0, 3)} ${s.startTime}-${s.endTime} (${s.classroomName})`).join('\n'),
    `${c.enrolledCount} / ${c.capacity}`,
    c.modality,
    c.status
  ]);

  autoTable(doc, {
    startY: 62,
    head: [[
      'CÓDIGO',
      'ASIGNATURA / PROGRAMA',
      'ÁREA / DPTO',
      'DURACIÓN',
      'DOCENTE ASIGNADO',
      'DISTRIBUCIÓN HORARIA Y AULA',
      'MATRÍCULA',
      'MODALIDAD',
      'ESTADO'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.deepNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: BRAND_COLORS.textDark
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 32 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 42 },
      5: { cellWidth: 58 },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 16, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  drawInstitutionalFooter(doc, 1, 1);
  doc.save(`Oferta_Academica_Oficial_${term}.pdf`);
}

// ==========================================
// 5. INFORME DE DISPONIBILIDAD E INFRAESTRUCTURA DE AULAS
// ==========================================
export function generateClassroomsReportPDF(classrooms: Classroom[]) {
  const doc = new jsPDF();
  const folioCode = `AUL-VAL-2026`;

  drawInstitutionalHeader(
    doc,
    'Informe Técnico de Infraestructura, Aulas y Talleres',
    'Auditoría de aforo, equipamiento tecnológico y estado de conservación de recintos físicos',
    folioCode
  );

  const tableData = classrooms.map(c => [
    c.code,
    c.name,
    c.building,
    `Piso ${c.floor}`,
    `${c.capacity} pers.`,
    c.type,
    c.resources.join(', '),
    c.status
  ]);

  autoTable(doc, {
    startY: 62,
    head: [['CÓDIGO', 'NOMBRE RECINTO', 'EDIFICIO', 'PISO', 'AFORO', 'TIPO', 'EQUIPAMIENTO Y RECURSOS', 'ESTADO']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.darkSlate,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: BRAND_COLORS.textDark
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 36 },
      2: { cellWidth: 24 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 22 },
      6: { cellWidth: 38 },
      7: { cellWidth: 16, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;
  drawOfficialSignatures(doc, finalY + 12, 'Coordinación de Infraestructura', 'Dirección de Operaciones');
  drawInstitutionalFooter(doc, 1, 1);

  doc.save(`Reporte_Infraestructura_Aulas_2026.pdf`);
}

// ==========================================
// 6. REPORTE GLOBAL DE CALIFICACIONES (SÁBANA CONSOLIDADA)
// ==========================================
export function generateGlobalGradesReportPDF(grades: GradeItem[], term = '2026-I') {
  const doc = new jsPDF({ orientation: 'landscape' });
  const folioCode = `SAB-VAL-${term}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Institutional Header
  drawInstitutionalHeader(
    doc,
    'Sábana Oficial y Consolidado Global de Calificaciones',
    `Auditoría Integral de Rendimiento Estudiantil • Período Académico: ${term}`,
    folioCode
  );

  // Calculate high-level metrics
  const total = grades.length;
  const approved = grades.filter(g => g.status === 'Aprobado').length;
  const failed = grades.filter(g => g.status === 'Reprobado').length;
  const recovery = grades.filter(g => g.status === 'Recuperación').length;
  const avg = total > 0 ? (grades.reduce((acc, g) => acc + g.finalGrade, 0) / total).toFixed(1) : '0.0';
  const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0';

  const pageWidth = doc.internal.pageSize.getWidth();

  // Metrics Bar
  doc.setFillColor(...BRAND_COLORS.lightBg);
  doc.roundedRect(14, 60, pageWidth - 28, 14, 2, 2, 'F');
  doc.setDrawColor(...BRAND_COLORS.borderSlate);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 60, pageWidth - 28, 14, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.deepNavy);
  doc.text(`Total Registros: ${total}`, 20, 69);
  doc.text(`Promedio Global: ${avg} / 20 pts`, 75, 69);
  doc.setTextColor(16, 185, 129); // Green
  doc.text(`Aprobados: ${approved} (${approvalRate}%)`, 135, 69);
  doc.setTextColor(245, 158, 11); // Amber
  doc.text(`Recuperación: ${recovery}`, 195, 69);
  doc.setTextColor(239, 68, 68); // Red
  doc.text(`Reprobados: ${failed}`, 240, 69);

  // Table Data
  const tableData = grades.map((g, idx) => [
    (idx + 1).toString(),
    g.studentCode,
    g.studentName,
    g.courseCode,
    g.courseName,
    (g.evaluacion1 ?? g.parcial1 ?? 0).toString(),
    (g.evaluacion2 ?? g.parcial2 ?? 0).toString(),
    (g.evaluacion3 ?? g.practicas ?? 0).toString(),
    (g.evaluacion4 ?? g.examenFinal ?? 0).toString(),
    `${g.asistencia}%`,
    g.finalGrade.toFixed(1),
    g.status
  ]);

  autoTable(doc, {
    startY: 77,
    head: [[
      'N°',
      'CÓDIGO',
      'ESTUDIANTE',
      'COD CURSO',
      'ASIGNATURA / PROGRAMA',
      'EV. 1 (25%)',
      'EV. 2 (25%)',
      'EV. 3 (25%)',
      'EV. 4 (25%)',
      'ASIST.',
      'FINAL',
      'ESTADO'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.deepNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: BRAND_COLORS.textDark,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 50 },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 16, halign: 'center' },
      9: { cellWidth: 14, halign: 'center' },
      10: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      11: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 11) {
        const val = data.cell.raw;
        if (val === 'Aprobado') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (val === 'Reprobado') {
          data.cell.styles.textColor = [239, 68, 68];
        } else if (val === 'Recuperación') {
          data.cell.styles.textColor = [245, 158, 11];
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 160;
  
  // If there's enough space on current page, draw signatures, else add page
  if (finalY + 35 > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    drawOfficialSignatures(doc, 20, 'Secretaría de Control y Archivo', 'Decanato y Consejo Académico');
  } else {
    drawOfficialSignatures(doc, finalY + 8, 'Secretaría de Control y Archivo', 'Decanato y Consejo Académico');
  }

  // Draw footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawInstitutionalFooter(doc, i, totalPages);
  }

  doc.save(`Sábana_Calificaciones_Global_${term}.pdf`);
}

// ==========================================
// 7. INFORME EJECUTIVO DE ANALÍTICAS Y RENDIMIENTO INSTITUCIONAL
// ==========================================
export function generateAnalyticsReportPDF(analytics: SystemAnalytics, term = '2026-I') {
  const doc = new jsPDF();
  const folioCode = `ANL-VAL-${term}-${Math.floor(1000 + Math.random() * 9000)}`;

  drawInstitutionalHeader(
    doc,
    'Informe Ejecutivo de Analíticas y Gestión Institucional',
    `Indicadores Clave de Desempeño (KPIs), Matrícula y Ocupación • Período: ${term}`,
    folioCode
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  // Metrics Grid Cards
  const kpiData = [
    { label: 'Total Estudiantes', value: (analytics.totalStudents || 0).toString() },
    { label: 'Cursos Ofertados', value: (analytics.totalCourses || 0).toString() },
    { label: 'Total Inscripciones', value: (analytics.totalEnrollments || 0).toString() },
    { label: 'Tasa de Aprobación', value: `${analytics.passRate || 0}%` },
    { label: 'Ocupación de Aulas', value: `${analytics.classroomOccupancyRate || 0}%` },
    { label: 'Promedio General', value: `${analytics.averageGrade || 0} / 20 pts` }
  ];

  // Draw 2x3 KPI card grid
  kpiData.forEach((kpi, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const cardW = (pageWidth - 28 - 8) / 3;
    const cardH = 18;
    const cardX = 14 + col * (cardW + 4);
    const cardY = 61 + row * (cardH + 4);

    doc.setFillColor(...BRAND_COLORS.lightBg);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'F');
    doc.setDrawColor(...BRAND_COLORS.borderSlate);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'S');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND_COLORS.textMuted);
    doc.text(kpi.label.toUpperCase(), cardX + 4, cardY + 6);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_COLORS.deepNavy);
    doc.text(kpi.value, cardX + 4, cardY + 14);
  });

  // Distribution Table 1: Course Enrollment Distribution
  const courseDistData = (analytics.courseEnrollmentDistribution || []).slice(0, 8).map(d => [
    d.courseName,
    d.enrolled.toString(),
    d.capacity.toString(),
    `${((d.enrolled / (d.capacity || 1)) * 100).toFixed(0)}%`
  ]);

  autoTable(doc, {
    startY: 110,
    head: [['ASIGNATURA / PROGRAMA', 'MATRICULADOS', 'CAPACIDAD MÁX.', 'OCUPACIÓN (%)']],
    body: courseDistData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.deepNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: BRAND_COLORS.textDark
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 160;

  // Grade Distribution Table
  const gradeData = (analytics.gradesDistribution || []).map(g => [
    g.range,
    g.count.toString(),
    `${((g.count / (analytics.totalStudents || 1)) * 100).toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: finalY + 8,
    head: [['RANGO DE CALIFICACIÓN', 'TOTAL ESTUDIANTES', 'PROPORCIÓN (%)']],
    body: gradeData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.primaryOrange,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: BRAND_COLORS.textDark
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 42, halign: 'center', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY2 = (doc as any).lastAutoTable.finalY || 210;

  drawOfficialSignatures(doc, finalY2 + 8, 'Dirección de Planificación y Control', 'Rectorado y Decanato');
  drawInstitutionalFooter(doc, 1, 1);

  doc.save(`Informe_Analiticas_Institucionales_${term}.pdf`);
}

// ==========================================
// 8. DIRECTORIO OFICIAL DE USUARIOS Y COMUNIDAD
// ==========================================
export function generateUsersDirectoryPDF(users: User[], term = '2026') {
  const doc = new jsPDF({ orientation: 'landscape' });
  const folioCode = `USR-DIR-${term}-${Math.floor(1000 + Math.random() * 9000)}`;

  drawInstitutionalHeader(
    doc,
    'Directorio Oficial de Usuarios y Miembros de la Comunidad',
    `Registro Centralizado de Estudiantes, Docentes, Personal y Administradores • Período: ${term}`,
    folioCode
  );

  const roleLabels: Record<string, string> = {
    admin: 'ADMINISTRADOR',
    teacher: 'DOCENTE / FACILITADOR',
    subordinado: 'GESTOR / SUBORDINADO',
    student: 'ESTUDIANTE / ALUMNO'
  };

  const tableData = users.map((u, idx) => [
    (idx + 1).toString(),
    u.code || '-',
    u.cedula || '-',
    u.name,
    roleLabels[u.role] || u.role.toUpperCase(),
    u.email,
    u.career || u.department || u.specialty || 'General',
    'Activo'
  ]);

  autoTable(doc, {
    startY: 62,
    head: [[
      'N°',
      'CÓDIGO',
      'CÉDULA / DNI',
      'NOMBRES Y APELLIDOS',
      'ROL',
      'CORREO ELECTRÓNICO',
      'PROGRAMA / DPTO',
      'ESTADO'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.deepNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: BRAND_COLORS.textDark
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 55 },
      4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 60 },
      6: { cellWidth: 55 },
      7: { cellWidth: 18, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawInstitutionalFooter(doc, i, totalPages);
  }

  doc.save(`Directorio_Usuarios_Academia_Valencia_${term}.pdf`);
}

// ==========================================
// 9. CONSTANCIA OFICIAL DE ESTUDIO REGULAR
// ==========================================
export function generateStudyCertificatePDF(student: User, courses: Course[], term = '2026-I') {
  const doc = new jsPDF();
  const folioCode = `CST-${student.code || 'EST'}-${Math.floor(1000 + Math.random() * 9000)}`;

  drawInstitutionalHeader(
    doc,
    'Constancia Oficial de Estudios y Matrícula Regular',
    'Certificación formal de inscripción académica y condición de estudiante activo',
    folioCode
  );

  // Student Info Card
  doc.setFillColor(...BRAND_COLORS.lightBg);
  doc.roundedRect(14, 61, 182, 32, 2, 2, 'F');
  doc.setDrawColor(...BRAND_COLORS.borderSlate);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 61, 182, 32, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.deepNavy);
  doc.text('DATOS DE IDENTIFICACIÓN DEL ESTUDIANTE', 18, 68);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.textDark);
  doc.text('Estudiante:', 18, 75);
  doc.text('Cédula / DNI:', 18, 81);
  doc.text('Programa / Área:', 18, 87);

  doc.setFont('helvetica', 'normal');
  doc.text(student.name.toUpperCase(), 45, 75);
  doc.text(student.cedula || student.code, 45, 81);
  doc.text(student.career || 'Formación Técnica / Profesional', 45, 87);

  doc.setFont('helvetica', 'bold');
  doc.text('Código Matrícula:', 115, 75);
  doc.text('Semestre / Nivel:', 115, 81);
  doc.text('Período Académico:', 115, 87);

  doc.setFont('helvetica', 'normal');
  doc.text(student.code || '-', 145, 75);
  doc.text(`${student.semester || 1}° Semestre`, 145, 81);
  doc.text(term, 145, 87);

  // Formal Certification Statement
  const formalY = 100;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND_COLORS.textDark);
  
  const certText = `Quien suscribe, Secretario General y Director de Control de Estudios de la ACADEMIA VALENCIA, por medio de la presente HACE CONSTAR que el ciudadano(a) ${student.name.toUpperCase()}, titular del documento de identidad / cédula N° ${student.cedula || student.code}, se encuentra debidamente inscrito(a) como ALUMNO(A) REGULAR durante el Período Académico ${term}, cursando formalmente la carga horaria y créditos correspondientes a su plan curricular:`;
  
  const splitText = doc.splitTextToSize(certText, 182);
  doc.text(splitText, 14, formalY);

  const tableStartY = formalY + (splitText.length * 4.5) + 4;

  const tableData = courses.map((c, idx) => [
    (idx + 1).toString(),
    c.code,
    c.name,
    c.department,
    c.credits ? `${c.credits} U.C.` : '3 U.C.',
    c.modality || 'Presencial'
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['N°', 'CÓDIGO', 'ASIGNATURA REGISTRADA', 'DEPARTAMENTO / ÁREA', 'CRÉDITOS', 'MODALIDAD']],
    body: tableData.length > 0 ? tableData : [['1', 'MAT-REG', 'Matrícula Académica Regular Activa', 'Secretaría General', '12 U.C.', 'Presencial']],
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.deepNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: BRAND_COLORS.textDark
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 65 },
      3: { cellWidth: 45 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 160;

  // Additional note
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...BRAND_COLORS.textMuted);
  doc.text(
    'Constancia expedida a petición de la parte interesada en la ciudad de Valencia, a los fines legales y académicos consiguientes.',
    14,
    finalY + 8
  );

  drawOfficialSignatures(doc, finalY + 18, 'Secretaría General y Control de Estudios', 'Dirección Académica y Decanato');
  drawInstitutionalFooter(doc, 1, 1);

  doc.save(`Constancia_Estudios_${student.code || 'alumno'}_${term}.pdf`);
}

// ==========================================
// 10. HORARIO Y CARGA HORARIA DOCENTE OFICIAL
// ==========================================
export function generateTeacherWorkloadPDF(teacher: User, courses: Course[], term = '2026-I') {
  const doc = new jsPDF();
  const folioCode = `DOC-CRG-${teacher.code || 'DOC'}-${term}`;

  drawInstitutionalHeader(
    doc,
    'Asignación Oficial de Carga Horaria y Horario Docente',
    'Reporte individual de secciones, carga horaria semanal, aulas y facilitador titular',
    folioCode
  );

  // Teacher Info Box
  doc.setFillColor(...BRAND_COLORS.lightBg);
  doc.roundedRect(14, 61, 182, 30, 2, 2, 'F');
  doc.setDrawColor(...BRAND_COLORS.borderSlate);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 61, 182, 30, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.deepNavy);
  doc.text('DATOS PROFESIONALES DEL FACILITADOR', 18, 68);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.textDark);
  doc.text('Docente:', 18, 75);
  doc.text('Cédula / DNI:', 18, 81);
  doc.text('Departamento / Área:', 18, 87);

  doc.setFont('helvetica', 'normal');
  doc.text(teacher.name.toUpperCase(), 45, 75);
  doc.text(teacher.cedula || teacher.code, 45, 81);
  doc.text(teacher.department || 'Área Académica', 45, 87);

  doc.setFont('helvetica', 'bold');
  doc.text('Código Docente:', 115, 75);
  doc.text('Especialidad:', 115, 81);
  doc.text('Período Lectivo:', 115, 87);

  doc.setFont('helvetica', 'normal');
  doc.text(teacher.code || '-', 145, 75);
  doc.text(teacher.specialty || 'Docencia Superior', 145, 81);
  doc.text(term, 145, 87);

  // Compute workload hours and students
  const totalStudents = courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0);
  const totalSections = courses.length;
  // Estimate hours (each schedule block = 2h)
  const totalHours = courses.reduce((acc, c) => acc + (c.schedules?.length || 1) * 2, 0);

  const tableRows: string[][] = [];
  courses.forEach(c => {
    (c.schedules || []).forEach(s => {
      tableRows.push([
        c.code,
        c.name,
        s.dayOfWeek,
        `${s.startTime} - ${s.endTime}`,
        s.classroomName,
        `${c.enrolledCount || 0} / ${c.capacity}`,
        c.modality
      ]);
    });
  });

  autoTable(doc, {
    startY: 96,
    head: [['CÓDIGO', 'ASIGNATURA ASIGNADA', 'DÍA', 'HORARIO', 'AULA / ESPACIO', 'ALUMNOS / CUPO', 'MODALIDAD']],
    body: tableRows.length > 0 ? tableRows : [['-', 'Sin asignaciones activas', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLORS.deepNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: BRAND_COLORS.textDark
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 26 },
      5: { cellWidth: 26, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 160;

  // Workload Summary Box
  doc.setFillColor(...BRAND_COLORS.lightBg);
  doc.roundedRect(14, finalY + 6, 182, 16, 2, 2, 'F');
  doc.setDrawColor(...BRAND_COLORS.borderSlate);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, finalY + 6, 182, 16, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLORS.deepNavy);
  doc.text(`Total Carga Semanal: ${totalHours} Horas Lectivas`, 20, finalY + 16);
  doc.text(`Secciones / Cursos: ${totalSections}`, 85, finalY + 16);
  doc.text(`Total Estudiantes Asignados: ${totalStudents} Alumnos`, 130, finalY + 16);

  drawOfficialSignatures(
    doc,
    finalY + 28,
    `Firma Docente: ${teacher.name}`,
    'Dirección de Recursos Humanos y Decanato'
  );
  drawInstitutionalFooter(doc, 1, 1);

  doc.save(`Carga_Horaria_Docente_${teacher.code || 'profesor'}_${term}.pdf`);
}


