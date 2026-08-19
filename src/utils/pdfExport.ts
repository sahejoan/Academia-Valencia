import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, Course, GradeItem, Classroom, Enrollment } from '../types';

/**
 * Generate Student Academic Transcript / Certificate (Kardex / Certificado de Calificaciones)
 */
export function generateStudentTranscriptPDF(student: User, grades: GradeItem[]) {
  const doc = new jsPDF();
  
  // Header Banner
  doc.setFillColor(30, 58, 138); // Deep Navy
  doc.rect(0, 0, 210, 32, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ACADEMIA VALENCIA', 14, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Certificado de Calificaciones - Kardex Académico Oficial', 14, 24);

  // Student Meta Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL ESTUDIANTE', 14, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 45, 182, 30, 2, 2, 'F');
  
  doc.text(`Nombre: ${student.name}`, 18, 52);
  doc.text(`Código ID: ${student.code}`, 18, 59);
  doc.text(`Carrera: ${student.career || 'N/A'}`, 18, 66);
  doc.text(`Correo: ${student.email}`, 110, 52);
  doc.text(`Semestre: ${student.semester || 1}° Semestre`, 110, 59);
  doc.text(`Fecha Emisión: ${new Date().toLocaleDateString('es-ES')}`, 110, 66);

  // Calculate Average
  const totalCourses = grades.length;
  const approvedCount = grades.filter(g => g.status === 'Aprobado').length;
  const gpa = totalCourses > 0 
    ? (grades.reduce((acc, g) => acc + g.finalGrade, 0) / totalCourses).toFixed(1)
    : '0.0';

  // Table Data
  const tableRows = grades.map(g => [
    g.courseCode,
    g.courseName,
    g.parcial1.toString(),
    g.parcial2.toString(),
    g.practicas.toString(),
    g.examenFinal.toString(),
    `${g.asistencia}%`,
    g.finalGrade.toFixed(1),
    g.status
  ]);

  autoTable(doc, {
    startY: 82,
    head: [['Código', 'Asignatura', 'P1 (25%)', 'P2 (25%)', 'Prác (20%)', 'Ex. Fin (30%)', 'Asist.', 'Nota Fin.', 'Estado']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 50 },
      7: { fontStyle: 'bold' }
    }
  });

  // Summary footer
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, finalY + 10, 182, 22, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`Promedio Acumulado: ${gpa} / 100`, 20, finalY + 20);
  doc.text(`Asignaturas Registradas: ${totalCourses}`, 85, finalY + 20);
  doc.text(`Aprobadas: ${approvedCount}`, 150, finalY + 20);

  // Digital Stamp / Signature placeholder
  doc.setDrawColor(203, 213, 225);
  doc.line(130, finalY + 50, 190, finalY + 50);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('Firma Autorizada - Secretaría Académica', 130, finalY + 55);

  doc.save(`Kardex_${student.code}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate Official Course Grades Act (Acta de Calificaciones para Docentes / Admin)
 */
export function generateCourseGradeActPDF(course: Course, grades: GradeItem[]) {
  const doc = new jsPDF();
  
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 32, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ACADEMIA VALENCIA - ACTA DE NOTAS', 14, 16);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período Académico: ${course.term} | Facultad: ${course.department}`, 14, 25);

  // Course Details
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA ASIGNATURA', 14, 42);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 45, 182, 25, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.text(`Asignatura: ${course.name} (${course.code})`, 18, 52);
  doc.text(`Docente: ${course.teacherName}`, 18, 60);
  doc.text(`Modalidad: ${course.modality}`, 120, 52);
  doc.text(`Inscritos: ${grades.length} / ${course.capacity}`, 120, 60);

  const tableRows = grades.map((g, idx) => [
    (idx + 1).toString(),
    g.studentCode,
    g.studentName,
    g.parcial1.toString(),
    g.parcial2.toString(),
    g.practicas.toString(),
    g.examenFinal.toString(),
    `${g.asistencia}%`,
    g.finalGrade.toFixed(1),
    g.status
  ]);

  autoTable(doc, {
    startY: 78,
    head: [['N°', 'Código', 'Estudiante', 'P1', 'P2', 'Prác.', 'Ex.Fin', 'Asist.', 'Nota', 'Estado']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 160;

  // Signatures
  doc.setDrawColor(148, 163, 184);
  doc.line(30, finalY + 35, 90, finalY + 35);
  doc.line(120, finalY + 35, 180, finalY + 35);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Firma del Docente Titular', 40, finalY + 41);
  doc.text('Firma Decano de Facultad', 132, finalY + 41);

  doc.save(`Acta_Notas_${course.code}_${course.term}.pdf`);
}

/**
 * Generate Student Schedule & Enrollment Proof PDF
 */
export function generateSchedulePDF(student: User, enrollments: Enrollment[], courses: Course[]) {
  const doc = new jsPDF();
  
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(0, 0, 210, 32, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROBANTE DE INSCRIPCIÓN Y HORARIO', 14, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Estudiante: ${student.name} | Código: ${student.code}`, 14, 25);

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
    startY: 42,
    head: [['Código', 'Asignatura', 'Día', 'Horario', 'Aula / Recinto', 'Docente', 'Modalidad']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [13, 148, 136],
      textColor: [255, 255, 255]
    },
    bodyStyles: {
      fontSize: 8.5
    }
  });

  doc.save(`Horario_${student.code}_2026.pdf`);
}
