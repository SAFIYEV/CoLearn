import jsPDF from 'jspdf';
import type { Course, Lesson, Module } from '../types';

function stripMarkdown(text: string): string {
  return text
    .replace(/### (.*?)\n/g, '$1\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^> /gm, '  ')
    .replace(/^• /gm, '  • ')
    .replace(/\n{3,}/g, '\n\n');
}

function addHeader(doc: jsPDF, title: string, pageW: number) {
  doc.setFillColor(15, 15, 26);
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setFillColor(139, 92, 246);
  doc.rect(0, 37, pageW, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(200, 180, 255);
  doc.text('CoLearn', 14, 16);

  doc.setFontSize(9);
  doc.setTextColor(160, 140, 200);
  doc.text('AI-Powered Learning', 14, 24);

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  const titleTrimmed = title.length > 60 ? title.slice(0, 57) + '...' : title;
  doc.text(titleTrimmed, pageW - 14, 20, { align: 'right' });
}

function addFooter(doc: jsPDF, page: number, total: number, pageW: number, pageH: number) {
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.3);
  doc.line(14, pageH - 14, pageW - 14, pageH - 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 160);
  doc.text(`${page} / ${total}`, pageW / 2, pageH - 8, { align: 'center' });
  doc.text(new Date().toLocaleDateString(), pageW - 14, pageH - 8, { align: 'right' });
  doc.text('colearn.app', 14, pageH - 8);
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

export function downloadLessonPdf(lesson: Lesson, moduleName: string, courseTitle: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const topY = 48;
  const bottomY = pageH - 20;

  addHeader(doc, courseTitle, pageW);

  let y = topY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 60);
  const titleLines = wrapText(doc, lesson.title, contentW);
  titleLines.forEach(line => {
    doc.text(line, margin, y);
    y += 8;
  });

  y += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 150);
  doc.text(`${moduleName}  •  ${lesson.duration} min`, margin, y);
  y += 4;

  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 40, y);
  y += 10;

  const content = stripMarkdown(lesson.content);
  const paragraphs = content.split(/\n\n+/);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 70);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const isHeading = trimmed.length < 80 && !trimmed.includes('.') && !trimmed.startsWith('•') && !trimmed.startsWith(' ');

    if (isHeading && trimmed.length < 60) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(60, 40, 100);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 70);
    }

    const lines = wrapText(doc, trimmed, contentW);
    for (const line of lines) {
      if (y > bottomY) {
        doc.addPage();
        addHeader(doc, courseTitle, pageW);
        y = topY;
      }
      doc.text(line, margin, y);
      y += 5.5;
    }
    y += 3;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages, pageW, pageH);
  }

  const filename = `${courseTitle}_${lesson.title}`.replace(/[^a-zA-Zа-яА-ЯёЁ0-9 _-]/g, '').replace(/\s+/g, '_');
  doc.save(`${filename}.pdf`);
}

export function downloadCoursePdf(course: Course) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const topY = 48;
  const bottomY = pageH - 20;

  // Title page
  doc.setFillColor(15, 15, 26);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(139, 92, 246);
  doc.rect(0, pageH / 2 - 0.75, pageW, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(200, 180, 255);
  const courseTitleLines = wrapText(doc, course.title, contentW - 20);
  let titleY = pageH / 2 - 30 - (courseTitleLines.length - 1) * 14;
  courseTitleLines.forEach(line => {
    doc.text(line, pageW / 2, titleY, { align: 'center' });
    titleY += 14;
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(160, 140, 200);
  doc.text(course.description.length > 90 ? course.description.slice(0, 87) + '...' : course.description, pageW / 2, pageH / 2 + 14, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(139, 92, 246);
  doc.text('CoLearn • AI-Powered Learning', pageW / 2, pageH / 2 + 30, { align: 'center' });

  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  doc.setTextColor(120, 100, 160);
  doc.setFontSize(10);
  doc.text(`${course.modules.length} modules  •  ${totalLessons} lessons  •  ${course.duration} days`, pageW / 2, pageH / 2 + 40, { align: 'center' });

  doc.setTextColor(100, 80, 140);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString(), pageW / 2, pageH - 20, { align: 'center' });

  // TOC page
  doc.addPage();
  addHeader(doc, course.title, pageW);
  let y = topY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 60);
  doc.text('Table of Contents', margin, y);
  y += 12;

  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, y - 4, margin + 30, y - 4);

  course.modules.forEach((mod: Module, mi: number) => {
    if (y > bottomY - 20) {
      doc.addPage();
      addHeader(doc, course.title, pageW);
      y = topY;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(60, 40, 100);
    doc.text(`${mi + 1}. ${mod.title}`, margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 130);
    mod.lessons.forEach((lesson, li) => {
      if (y > bottomY) {
        doc.addPage();
        addHeader(doc, course.title, pageW);
        y = topY;
      }
      doc.text(`    ${mi + 1}.${li + 1}  ${lesson.title}`, margin + 4, y);
      y += 5;
    });
    y += 4;
  });

  // Content pages
  course.modules.forEach((mod: Module, mi: number) => {
    doc.addPage();
    addHeader(doc, course.title, pageW);
    y = topY;

    doc.setFillColor(240, 235, 255);
    doc.roundedRect(margin, y - 6, contentW, 18, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(60, 40, 100);
    doc.text(`Module ${mi + 1}: ${mod.title}`, margin + 4, y + 5);
    y += 18;

    if (mod.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 130);
      const descLines = wrapText(doc, mod.description, contentW);
      descLines.forEach(line => {
        doc.text(line, margin, y);
        y += 5;
      });
      y += 4;
    }

    mod.lessons.forEach((lesson, li) => {
      if (y > bottomY - 30) {
        doc.addPage();
        addHeader(doc, course.title, pageW);
        y = topY;
      }

      doc.setDrawColor(200, 190, 230);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 60);
      const lessonTitleLines = wrapText(doc, `${mi + 1}.${li + 1}  ${lesson.title}`, contentW);
      lessonTitleLines.forEach(line => {
        doc.text(line, margin, y);
        y += 6;
      });
      y += 2;

      const content = stripMarkdown(lesson.content);
      const paragraphs = content.split(/\n\n+/);

      for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed) continue;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 70);

        const lines = wrapText(doc, trimmed, contentW);
        for (const line of lines) {
          if (y > bottomY) {
            doc.addPage();
            addHeader(doc, course.title, pageW);
            y = topY;
          }
          doc.text(line, margin, y);
          y += 4.8;
        }
        y += 2.5;
      }
      y += 4;
    });
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i - 1, totalPages - 1, pageW, pageH);
  }

  const filename = course.title.replace(/[^a-zA-Zа-яА-ЯёЁ0-9 _-]/g, '').replace(/\s+/g, '_');
  doc.save(`${filename}_Full_Course.pdf`);
}
