// PDF Generation - Exact match to original TA-TD-20 Rev 04 form

function generatePDFCode() {
  return `
  async function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    const pageW = 210;
    const pageH = 297;
    const margin = 10;
    const contentW = pageW - margin * 2;
    const rightEdge = pageW - margin;
    let y = 8;
    
    // Column positions
    const colCheckX = 148;   // Checkbox X position for Completed
    const colRedoX = 172;    // Checkbox X position for Redo
    const colSigX = 185;     // Signature column
    
    function checkPage(needed = 25) {
      if (y > pageH - needed) {
        doc.addPage();
        y = 18;
        // Page header for page 2+
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        doc.text('Form:TA-TD-20', margin, 10);
        doc.text('Revision: 04', rightEdge - 20, 10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('B737 - EDTO/ETOPS TRAINING FORM', 105, 10, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Date: 11-12-2025', rightEdge - 20, 14);
        // Column headers
        drawColumnHeaders();
        return true;
      }
      return false;
    }
    
    function drawColumnHeaders() {
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, y - 4, contentW, 10, 'F');
      doc.setDrawColor(0);
      doc.rect(margin, y - 4, contentW, 10);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(0);
      doc.text('Satisfactorily', colCheckX, y - 1);
      doc.text('Completed', colCheckX, y + 2.5);
      doc.text('Incomplete', colRedoX, y - 1);
      doc.text('or Redo', colRedoX, y + 1);
      doc.text('Required', colRedoX, y + 2.5);
      doc.text('Trainer', colSigX, y - 1);
      doc.text('Signature', colSigX, y + 2.5);
      
      y += 8;
    }
    
    function drawCheckbox(x, checked) {
      doc.rect(x, y - 2, 3, 3);
      if (checked) {
        doc.setFontSize(8);
        doc.text('X', x + 0.4, y + 0.7);
      }
    }
    
    // ═══ PAGE 1 HEADER ═══
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Form:TA-TD-20', margin, 10);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('B737 - EDTO/ETOPS', 105, 9, { align: 'center' });
    doc.setFontSize(10);
    doc.text('TRAINING FORM', 105, 14, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Revision: 04', rightEdge - 20, 10);
    doc.text('Date: 11-12-2025', rightEdge - 20, 14);
    
    y = 20;
    
    // ═══ Trainee and Simulator Details Box ═══
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentW, 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Trainee and Simulator Details', 105, y + 5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let rowY = y + 12;
    
    // Row 1
    doc.text('Trainee Name:', margin + 2, rowY);
    if (data.traineeName) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.traineeName, margin + 28, rowY);
      doc.setFont('helvetica', 'normal');
    }
    doc.line(margin + 26, rowY + 1, 105, rowY + 1);
    doc.text('Rank', 110, rowY);
    doc.line(118, rowY + 1, 140, rowY + 1);
    if (data.traineeRank) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.traineeRank, 119, rowY);
      doc.setFont('helvetica', 'normal');
    }
    
    // Row 2
    rowY += 7;
    doc.text('Sim Registration:', margin + 2, rowY);
    doc.line(margin + 32, rowY + 1, 80, rowY + 1);
    if (data.simRegistration) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.simRegistration, margin + 33, rowY);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('Licence No.:', 85, rowY);
    doc.line(100, rowY + 1, 140, rowY + 1);
    if (data.licenceNo) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.licenceNo, 101, rowY);
      doc.setFont('helvetica', 'normal');
    }
    
    // Row 3
    rowY += 7;
    doc.text('Type of session:', margin + 2, rowY);
    doc.line(margin + 32, rowY + 1, 70, rowY + 1);
    if (data.sessionType) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.sessionType, margin + 33, rowY);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('Date:', 75, rowY);
    doc.line(82, rowY + 1, 110, rowY + 1);
    if (data.date) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.date, 83, rowY);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('EDTO Validity Expiry:', 115, rowY);
    doc.line(138, rowY + 1, rightEdge - 2, rowY + 1);
    if (data.edtoExpiry) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.edtoExpiry, 139, rowY);
      doc.setFont('helvetica', 'normal');
    }
    
    // Row 4
    rowY += 7;
    doc.text('Location:', margin + 2, rowY);
    doc.line(margin + 22, rowY + 1, 70, rowY + 1);
    if (data.location) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.location, margin + 23, rowY);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('Aircraft', rightEdge - 20, rowY);
    
    y = 55;
    
    // ═══ EDTO/ETOPS Procedures header ═══
    drawColumnHeaders();
    
    // ═══ Section Helper ═══
    function drawSection(title, items, sectionKey) {
      checkPage(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text(title, margin + 2, y);
      y += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      
      items.forEach((item, idx) => {
        checkPage(5);
        const key = sectionKey + '-' + idx;
        const status = data.checklist ? data.checklist[key] : '';
        
        // Draw checkboxes
        drawCheckbox(colCheckX, status === 'pass');
        drawCheckbox(colRedoX, status === 'fail');
        
        // Draw horizontal line for signature
        doc.setDrawColor(180, 180, 180);
        doc.line(colSigX, y + 1, rightEdge - 2, y + 1);
        doc.setDrawColor(0);
        
        // Draw item text
        doc.setFontSize(7);
        const textX = margin + 4;
        doc.text(item, textX, y + 1);
        
        y += 5;
      });
      
      y += 2;
    }
    
    // ═══ SECTION 1: FLIGHT PREPARATION BRIEFING ═══
    drawSection('FLIGHT PREPARATION BRIEFING', [
      'Route Briefing Contents:',
      '  - TAFS & METARS for destination, alternates & ERAs',
      '  - NOTAMS for destination, Alternates and ERAs and route',
      '  - SIG WX & Upper Wind Charts',
      '  - SIGMETS',
      'Flight Plan: Check Flt No. Date, Route & A/C Registration',
      '  - Note - Max FL, average W/C and Max Shear',
      '  - Note - Trip fuel and flight time',
      '  - Note - Critical Fuel - Calculate diversion fuel',
      '  - Note - TOTAL FUEL',
      'FD Pro Route/Waypoints:',
      '  - Insert OFP Route',
      '  - Create and insert ENTRY and EXIT waypoints',
      '  - Verify EDTO waypoints',
      '  - Create and insert ETPs (as required)',
      '  - No-Go Areas'
    ], 's1');
    
    // ═══ SECTION 2: PRE-FLIGHT ═══
    drawSection('PRE-FLIGHT', [
      'Aircraft Status - Consult MEL',
      '  - RVSM Requirements',
      '  - EDTO Requirements',
      'Fuel Crossfeed Valve - i.a.w. FCOM',
      'Aircraft Clocks - UTC set',
      'Flight Plan Route - Enter FPL into FMC',
      'Route Leg Winds - Insert winds',
      'EDTO Tracks and Distances - Verified'
    ], 's3');
    
    // ═══ SECTION 3: ENROUTE - PRIOR TO EDTO ENTRY POINT ═══
    drawSection('ENROUTE - PRIOR TO EDTO ENTRY POINT', [
      'EDTO Clearance (40 Minutes before)',
      'Weather from OCC - SATPHONE 30 minutes before',
      'APU 15 minutes before ENTRY point',
      'EDTO Significant Systems Operation',
      'FMC Position - Check',
      'FMC Route - confirm modification (CPDLC)',
      'CDU FIX page - adequate AD 428nm ARCs',
      'Flight Level and Mach Number - as cleared',
      'HF and SELCAL - Checked',
      'Radios and Transponder',
      'Approaching Waypoints TRK and DIST',
      'Passing Each Waypoint Actual Track',
      'Position Report',
      '10 Minute after passing waypoint',
      'Midpoint Check winds and times',
      'ETP CDU FIX page - updated'
    ], 's4');
    
    // ═══ PAGE 2 ═══
    checkPage(80);
    
    // ═══ SECTION 4: ENROUTE - AFTER EDTO EXIT POINT ═══
    drawSection('ENROUTE - AFTER EDTO EXIT POINT', [
      'Mach Number',
      'CDU Offset (If applied during EDTO)',
      'Cruise FL - Review',
      'FMC Position - Checked',
      'Fuel Crossfeed Valve',
      'ETL Entry - after shutdown'
    ], 's5');
    
    // ═══ SECTION 5: NON-NORMALS ═══
    drawSection('NON-NORMALS', [
      'Re-Routing',
      'Diversion Planning',
      'MEL - APU Fault',
      'Engine Non-Normal requiring diversion',
      'Pressurisation Non-Normal requiring diversion',
      'Navigation Non-Normal',
      'Weather Contingency',
      'Non-Comms Contingency',
      'Other Non-Normal'
    ], 's6');
    
    // ═══ Trainer Comments ═══
    checkPage(35);
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Trainer Comments', margin + 2, y);
    y += 6;
    
    // Comments box
    doc.setDrawColor(0);
    const commentsH = 25;
    doc.rect(margin, y, contentW, commentsH);
    
    if (data.instructorComments) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(data.instructorComments, contentW - 6);
      lines.forEach((line, i) => {
        if (i < 6 && y + 4 + (i * 4) < y + commentsH) {
          doc.text(line, margin + 3, y + 4 + (i * 4));
        }
      });
    }
    y += commentsH + 10;
    
    // ═══ Signatures ═══
    checkPage(25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Trainer
    doc.text('Trainer Name:', margin + 2, y);
    doc.line(margin + 28, y + 1, 90, y + 1);
    if (data.trainerName) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.trainerName, margin + 29, y);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('Trainer Signature:', 95, y);
    doc.line(118, y + 1, rightEdge - 2, y + 1);
    y += 12;
    
    // Trainee
    doc.text('Trainee Name:', margin + 2, y);
    doc.line(margin + 28, y + 1, 90, y + 1);
    if (data.footerTraineeName || data.traineeName) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.footerTraineeName || data.traineeName, margin + 29, y);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('Trainee Signature:', 95, y);
    doc.line(118, y + 1, rightEdge - 2, y + 1);
    y += 15;
    
    // ═══ General Comments ═══
    checkPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('General Comments or Recommendations', 105, y, { align: 'center' });
    y += 6;
    
    const genH = 20;
    doc.setDrawColor(0);
    doc.rect(margin, y, contentW, genH);
    
    if (data.generalComments) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(data.generalComments, contentW - 6);
      lines.forEach((line, i) => {
        if (i < 5) doc.text(line, margin + 3, y + 4 + (i * 4));
      });
    }
    y += genH + 10;
    
    // ═══ Prepared by Section ═══
    checkPage(20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Signature / Stamp', 60, y + 3);
    doc.text('Date', rightEdge - 35, y + 3);
    y += 6;
    doc.line(30, y, 110, y);
    doc.line(rightEdge - 55, y, rightEdge - 5, y);
    
    if (data.preparedBy) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(data.preparedBy, 35, y - 2);
    }
    if (data.preparedDate) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.preparedDate, rightEdge - 52, y - 2);
    }
    
    // Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('Page 2 of 2', 105, pageH - 5, { align: 'center' });
    
    return doc.output('datauristring');
  }
  `;
}

module.exports = { generatePDFCode };
