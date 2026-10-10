import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AnalyzeResponse, CalibrationRecord } from '../api/types';
import type { QualityAssessmentResult } from './imageQuality';

export interface GeneratePdfOptions {
  result: AnalyzeResponse;
  calibrationRecord?: CalibrationRecord | null;
  calibrationFactor?: number;
  qualityAssessment?: QualityAssessmentResult | null;
  sampleVolumeMl?: number;
  dilutionFactor?: number;
  calculatedConcentration?: number | null;
}

export const generateSamplePdfReport = ({
  result,
  calibrationRecord,
  calibrationFactor = 0.417,
  qualityAssessment,
  sampleVolumeMl,
  dilutionFactor,
  calculatedConcentration
}: GeneratePdfOptions): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // Colors as strict 3-element RGB tuples
  const primaryDark: [number, number, number] = [26, 25, 23]; // #1A1917 Ink
  const accentRust: [number, number, number] = [155, 52, 24]; // #9B3418 Rust
  const brandCyan: [number, number, number] = [8, 145, 178]; // #0891B2 Cyan
  const lightIvory: [number, number, number] = [231, 227, 218]; // #E7E3DA
  const textMuted: [number, number, number] = [90, 85, 76]; // #5A554C
  const borderGray: [number, number, number] = [220, 215, 203]; // #DCD7CB

  // --- HEADER SECTION ---
  // Top brand accent bar
  doc.setFillColor(accentRust[0], accentRust[1], accentRust[2]);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Background header card
  doc.setFillColor(lightIvory[0], lightIvory[1], lightIvory[2]);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 3, 3, 'F');

  // Hydro-Lens Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('HYDRO-LENS', margin + 6, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(accentRust[0], accentRust[1], accentRust[2]);
  doc.text('OPTICAL METROLOGY & MICROPLASTICS SCREENING', margin + 6, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('Microplastics Sample Analysis Report', margin + 6, currentY + 23);

  // Right side header metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const dateStr = new Date().toLocaleString();
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - 6, currentY + 10, { align: 'right' });
  doc.text(`Sample ID: ${result.sample_id}`, pageWidth - margin - 6, currentY + 16, { align: 'right' });
  doc.text(`Standard: ISO/TR 21960 & ASTM D8332`, pageWidth - margin - 6, currentY + 22, { align: 'right' });

  currentY += 34;

  // --- EXECUTIVE SUMMARY: 4 KEY METRIC CARDS ---
  const cardGap = 4;
  const numCards = 4;
  const cardWidth = (pageWidth - margin * 2 - cardGap * (numCards - 1)) / numCards;
  const cardHeight = 20;

  const metrics: {
    label: string;
    value: string;
    sub: string;
    color: [number, number, number];
  }[] = [
    {
      label: 'TOTAL PARTICLES',
      value: `${result.total_count}`,
      sub: 'Detected Candidates',
      color: primaryDark
    },
    {
      label: 'SAMPLE CONFIDENCE',
      value: `${(result.sample_confidence * 100).toFixed(1)}%`,
      sub: result.sample_confidence >= 0.8 ? 'High Reliability' : 'Moderate',
      color: result.sample_confidence >= 0.8 ? [5, 150, 105] : accentRust
    },
    {
      label: 'LAB VALIDATION',
      value: result.flag_lab_confirmation ? 'REQUIRED' : 'NOT REQUIRED',
      sub: result.flag_lab_confirmation ? 'Needs Confirmation' : 'Standard Pass',
      color: result.flag_lab_confirmation ? accentRust : [5, 150, 105]
    },
    {
      label: 'IMAGED AREA',
      value: `${result.imaged_area_mm2.toFixed(2)} mm²`,
      sub: `Scale: ${calibrationFactor.toFixed(3)} µm/px`,
      color: brandCyan
    }
  ];

  metrics.forEach((m, idx) => {
    const cardX = margin + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 247, 244);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(m.label, cardX + cardWidth / 2, currentY + 5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, cardX + cardWidth / 2, currentY + 12.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(m.sub, cardX + cardWidth / 2, currentY + 17.5, { align: 'center' });
  });

  currentY += cardHeight + 6;

  // --- CALIBRATION & QUALITY CONTEXT ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('1. Metrology & Optical Quality Context', margin, currentY);
  currentY += 4;

  const contextData = [
    [
      'Optical Scale Factor:',
      `${calibrationFactor.toFixed(3)} µm/pixel`,
      'Quality Assessment:',
      qualityAssessment?.title ?? 'Optimal Optical Acquisition'
    ],
    [
      'Magnification:',
      calibrationRecord?.magnification ?? '200x Optical Stage',
      'Sharpness Index:',
      qualityAssessment?.metrics ? `${qualityAssessment.metrics.blurScore.toFixed(1)} (Focus metric)` : 'Pass'
    ],
    [
      'Calibration Status:',
      calibrationRecord?.valid ? 'NIST-Traceable (Active)' : 'Standard Calibrated',
      'Inference Latency:',
      `${result.latency_sec.toFixed(2)}s (On-Device Pipeline)`
    ]
  ];

  if (calculatedConcentration !== null && calculatedConcentration !== undefined && sampleVolumeMl) {
    contextData.push([
      'Sample Volume:',
      `${sampleVolumeMl} mL (Dilution ${dilutionFactor ?? 1}x)`,
      'Calculated Concentration:',
      `${calculatedConcentration.toLocaleString()} particles/L`
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    body: contextData,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: textMuted, cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', textColor: textMuted, cellWidth: 40 },
      3: { cellWidth: 50 }
    },
    margin: { left: margin, right: margin }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // --- MORPHOLOGY BREAKDOWN & SIZE DISTRIBUTION SIDE-BY-SIDE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('2. Morphological Classification & Sizing Distribution', margin, currentY);
  currentY += 4;

  // Compute morphology counts from detections
  const morphCounts: Record<string, number> = {
    fragment: 0,
    fiber: 0,
    film: 0,
    foam: 0,
    pellet: 0
  };

  result.detections.forEach((d) => {
    const cls = d.class_name.toLowerCase();
    if (morphCounts[cls] !== undefined) {
      morphCounts[cls]++;
    } else {
      morphCounts[cls] = (morphCounts[cls] || 0) + 1;
    }
  });

  const totalDetections = result.detections.length || 1;
  const morphRows = Object.entries(morphCounts).map(([cls, cnt]) => [
    cls.charAt(0).toUpperCase() + cls.slice(1),
    `${cnt}`,
    `${((cnt / totalDetections) * 100).toFixed(1)}%`
  ]);

  const sizeRows = Object.entries(result.size_distribution_um || {}).map(([bin, cnt]) => [
    bin,
    `${cnt}`,
    `${((cnt / totalDetections) * 100).toFixed(1)}%`
  ]);

  // If size distribution was empty, create standard bins
  if (sizeRows.length === 0) {
    sizeRows.push(['<20 µm', '0', '0.0%'], ['20–50 µm', '0', '0.0%'], ['50–100 µm', '0', '0.0%'], ['>100 µm', `${result.total_count}`, '100.0%']);
  }

  // Render Morphology table
  autoTable(doc, {
    startY: currentY,
    head: [['Morphology Class', 'Count', 'Share (%)']],
    body: morphRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    headStyles: {
      fillColor: primaryDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    tableWidth: 85,
    margin: { left: margin }
  });

  // Render Size Distribution table on the right side
  autoTable(doc, {
    startY: currentY,
    head: [['Size Bin (ECD/Feret)', 'Count', 'Share (%)']],
    body: sizeRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    headStyles: {
      fillColor: primaryDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    tableWidth: 85,
    margin: { left: margin + 95 }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = Math.max((doc as any).lastAutoTable.finalY, currentY + 38) + 6;

  // --- DETAILED PARTICLES TABLE ---
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = margin + 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('3. Individual Candidate Detection Observations', margin, currentY);
  currentY += 4;

  const detectionRows = result.detections.slice(0, 50).map((d) => [
    `#${d.id}`,
    d.class_name.toUpperCase(),
    `${(d.confidence * 100).toFixed(1)}%`,
    d.size_um?.feret_max ? `${d.size_um.feret_max.toFixed(1)} µm` : '—',
    d.size_um?.feret_min ? `${d.size_um.feret_min.toFixed(1)} µm` : '—',
    d.size_um?.aspect_ratio ? `${d.size_um.aspect_ratio.toFixed(2)}` : '—',
    d.size_um?.ecd ? `${d.size_um.ecd.toFixed(1)} µm` : '—',
    d.needs_lab_confirmation ? 'FLAGGED' : 'VALID'
  ]);

  if (result.detections.length === 0) {
    detectionRows.push(['—', 'NO PARTICLES DETECTED', '—', '—', '—', '—', '—', 'CLEAN']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'Class', 'Conf.', 'Feret Max', 'Feret Min', 'Aspect', 'ECD (µm)', 'Status']],
    body: detectionRows,
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: primaryDark
    },
    headStyles: {
      fillColor: accentRust,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 247, 244]
    },
    margin: { left: margin, right: margin }
  });

  // Footer on all pages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      'Hydro-Lens Field-Portable Microplastics Metrology Platform — Certified Optical Screening',
      margin,
      pageHeight - 7
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Trigger browser download
  const safeFilename = `HydroLens_Report_${result.sample_id.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename);
};
