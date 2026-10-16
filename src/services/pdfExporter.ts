import jsPDF from 'jspdf';
import { LectureItem } from '../types.ts';

export interface SubjectPdfExportData {
  subjectName: string;
  totalTopics: number;
  completedTopics: number;
  lectures: Array<{
    id: string;
    session: number;
    title: string;
    videoUrl?: string;
    completed: boolean;
    notes?: string;
  }>;
}

export interface PdfExportResult {
  success: boolean;
  notesCount: number;
  message?: string;
}

/**
 * Generates and downloads a clean, professional, publication-grade PDF of lecture study notes.
 * Styled to look like a modern, executive study guide exported from an elite learning platform.
 * 
 * Verification:
 * Strictly checks that notes exist; if no lectures have study notes, returns { success: false }.
 * Only lectures with recorded notes are rendered in the PDF.
 */
export function exportSubjectNotesToPdf(data: SubjectPdfExportData): PdfExportResult {
  const { subjectName, totalTopics, completedTopics, lectures } = data;

  // Filter to strictly lectures that have non-empty recorded study notes
  const lecturesWithNotes = lectures
    .filter((l) => Boolean(l.notes && l.notes.trim().length > 0))
    .sort((a, b) => a.session - b.session);

  // Verification: If user hasn't written any notes, do not generate PDF
  if (lecturesWithNotes.length === 0) {
    return {
      success: false,
      notesCount: 0,
      message: 'No study notes recorded in this subject yet.',
    };
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  const bottomMargin = 16;

  const notesCount = lecturesWithNotes.length;
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Function to draw the slim top header on Page 1
  const drawMainHeader = () => {
    const startY = 10;
    const headerHeight = 18.5;

    // Slim background container (light subtle slate-50 tint with crisp border)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, startY, contentWidth, headerHeight, 2, 2, 'FD');

    // App Logo Vector Icon (Indigo rounded badge with "PP")
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.roundedRect(marginX + 3.5, startY + 3.2, 5.8, 5.8, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('PP', marginX + 4.2, startY + 7.4);

    // App Brand: "Progress Path"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Progress Path', marginX + 11.5, startY + 7.4);

    // Subtle Pipe Separator
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('|', marginX + 37, startY + 7.4);

    // Subject Title (Dynamic truncated wrap)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // slate-900
    const dateTextWidth = doc.getTextWidth(dateStr);
    const maxTitleWidth = contentWidth - 42 - dateTextWidth - 10;
    const splitTitle = doc.splitTextToSize(subjectName, maxTitleWidth);
    doc.text(splitTitle[0], marginX + 40, startY + 7.4);

    // Export Date on top right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(dateStr, pageWidth - marginX - 4, startY + 7.4, { align: 'right' });

    // Thin horizontal divider inside header
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX + 3.5, startY + 10.8, pageWidth - marginX - 3.5, startY + 10.8);

    // Stats Strip: Dynamically spaced items
    const statY = startY + 15.2;
    doc.setFontSize(7.8);

    let curStatX = marginX + 4;

    // Stat 1: Total Lectures
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Total Lectures:', curStatX, statY);
    curStatX += doc.getTextWidth('Total Lectures: ') + 0.5;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${totalTopics}`, curStatX, statY);
    curStatX += doc.getTextWidth(`${totalTopics}`) + 3;

    // Bullet Dot
    doc.setTextColor(203, 213, 225);
    doc.text('•', curStatX, statY);
    curStatX += 3.5;

    // Stat 2: Completed Lectures
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Completed:', curStatX, statY);
    curStatX += doc.getTextWidth('Completed: ') + 0.5;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`${completedTopics}`, curStatX, statY);
    curStatX += doc.getTextWidth(`${completedTopics}`) + 3;

    // Bullet Dot
    doc.setTextColor(203, 213, 225);
    doc.text('•', curStatX, statY);
    curStatX += 3.5;

    // Stat 3: Number of Lecture Notes
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Lecture Notes:', curStatX, statY);
    curStatX += doc.getTextWidth('Lecture Notes: ') + 0.5;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text(`${notesCount}`, curStatX, statY);
  };

  // Running slim header for Page 2 and beyond
  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Progress Path  |  ${subjectName}  •  Study Notes`, marginX, 10);
    doc.text(dateStr, pageWidth - marginX, 10, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, 12, pageWidth - marginX, 12);
  };

  // Draw initial header on page 1
  drawMainHeader();
  let currentY = 35; // Start cleanly below the slim header bar

  // Helper to ensure vertical space, triggering clean page break if needed
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      drawRunningHeader();
      currentY = 16;
    }
  };

  // Only render lectures that actually have study notes
  lecturesWithNotes.forEach((lec, index) => {
    const rawNotes = (lec.notes as string).trim();

    // Pre-process notes text: preserve line breaks, paragraphs, and wrap cleanly
    const noteParagraphs = rawNotes.split(/\r?\n/);
    const wrappedLines: string[] = [];
    const innerTextWidth = contentWidth - 14; // padding inside the block

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    for (let p = 0; p < noteParagraphs.length; p++) {
      const para = noteParagraphs[p];
      if (para.trim().length === 0) {
        wrappedLines.push('');
      } else {
        const lines = doc.splitTextToSize(para, innerTextWidth);
        wrappedLines.push(...lines);
      }
    }

    const lineHeight = 4.3;
    const notesBoxPaddingY = 7;
    const totalNotesBoxHeight = wrappedLines.length * lineHeight + notesBoxPaddingY;

    // Minimum space needed to render lecture title + video link + top of notes block
    const minHeaderHeight = 22;
    ensureSpace(Math.min(minHeaderHeight + totalNotesBoxHeight, 45));

    // 1. VIDEO / LECTURE TITLE
    // Lecture session pill badge
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.2);
    doc.roundedRect(marginX, currentY, 13, 5.2, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`#${lec.session}`, marginX + 2.5, currentY + 3.7);

    // Title Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // slate-900
    const titleMaxWidth = contentWidth - 45;
    const titleLines = doc.splitTextToSize(lec.title, titleMaxWidth);
    doc.text(titleLines[0], marginX + 15, currentY + 3.8);

    // Completed / Pending Status Badge
    const badgeX = pageWidth - marginX - 18;
    if (lec.completed) {
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.setDrawColor(167, 243, 208); // emerald-200
      doc.roundedRect(badgeX, currentY, 18, 5, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text('COMPLETED', badgeX + 2, currentY + 3.6);
    } else {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(badgeX, currentY, 18, 5, 1, 1, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('PENDING', badgeX + 4, currentY + 3.6);
    }

    currentY += 7.5;

    // 2. VIDEO LINK
    if (lec.videoUrl && lec.videoUrl.trim().length > 0) {
      const cleanUrl = lec.videoUrl.trim();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('Video Link: ', marginX + 1, currentY);

      const prefixWidth = doc.getTextWidth('Video Link: ');
      const urlX = marginX + 1 + prefixWidth;
      const maxUrlWidth = contentWidth - prefixWidth - 4;

      let displayUrl = cleanUrl;
      if (doc.getTextWidth(displayUrl) > maxUrlWidth) {
        while (doc.getTextWidth(displayUrl + '...') > maxUrlWidth && displayUrl.length > 10) {
          displayUrl = displayUrl.slice(0, -1);
        }
        displayUrl = displayUrl + '...';
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(79, 70, 229); // indigo-600 (casual and professional)
      doc.text(displayUrl, urlX, currentY);

      // Underline effect
      const textWidth = doc.getTextWidth(displayUrl);
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.15);
      doc.line(urlX, currentY + 0.6, urlX + textWidth, currentY + 0.6);

      // Clickable PDF Link
      doc.link(urlX, currentY - 2.5, textWidth, 3.5, { url: cleanUrl });
      currentY += 4.5;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Video Link: None', marginX + 1, currentY);
      currentY += 4.5;
    }

    // 3. PROPER WELL-FITTED BLOCK WITH CONTENT
    let lineIdx = 0;

    while (lineIdx < wrappedLines.length) {
      const availableHeight = pageHeight - bottomMargin - currentY - notesBoxPaddingY;
      const linesCanFit = Math.max(1, Math.floor(availableHeight / lineHeight));
      const chunkCount = Math.min(wrappedLines.length - lineIdx, linesCanFit);

      if (chunkCount <= 0 || availableHeight < lineHeight * 2) {
        doc.addPage();
        drawRunningHeader();
        currentY = 16;
        continue;
      }

      const chunkLines = wrappedLines.slice(lineIdx, lineIdx + chunkCount);
      const chunkBoxHeight = chunkLines.length * lineHeight + notesBoxPaddingY;

      // Draw well-fitted block container with soft subtle shading
      doc.setFillColor(248, 250, 252); // soft clean slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.25);
      doc.roundedRect(marginX, currentY, contentWidth, chunkBoxHeight, 1.5, 1.5, 'FD');

      // Professional left accent bar
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.roundedRect(marginX, currentY, 1.2, chunkBoxHeight, 0.5, 0.5, 'F');

      // Render notes content lines inside the fitted block
      let textLineY = currentY + 4.8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); // slate-700

      for (let cl = 0; cl < chunkLines.length; cl++) {
        const lText = chunkLines[cl];
        if (lText.length > 0) {
          doc.text(lText, marginX + 5, textLineY);
        }
        textLineY += lineHeight;
      }

      currentY += chunkBoxHeight + 2;
      lineIdx += chunkCount;

      if (lineIdx < wrappedLines.length) {
        doc.addPage();
        drawRunningHeader();
        currentY = 16;
      }
    }

    currentY += 3.5;

    // Clean divider between lectures
    if (index < lecturesWithNotes.length - 1) {
      ensureSpace(10);
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setLineWidth(0.25);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);
      currentY += 4.5;
    }
  });

  // Running Footer & Page Numbering on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    // Left label & Right page numbers
    doc.text('Progress Path  •  Curriculum Lecture Study Notes', marginX, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 7, { align: 'right' });
  }

  // Clean sanitized filename
  const safeName = subjectName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);

  const filename = `${safeName || 'Subject'}_Lecture_Notes.pdf`;
  doc.save(filename);

  return {
    success: true,
    notesCount: lecturesWithNotes.length,
  };
}
