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
    
    // Column positions - shifted left so all columns fit
    const colCheckX = 132;   // Satisfactorily Completed checkbox
    const colRedoX = 155;    // Incomplete or Redo Required checkbox
    const colSigX = 175;     // Trainer Signature
    const col3lcX = 193;     // Trainer Texel 3LC (rightmost)
    
    function checkPage(needed = 25) {
      if (y > pageH - needed) {
        doc.addPage();
        y = 18;
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
      
      // Vertical separator lines between columns
      doc.line(colCheckX - 2, y - 4, colCheckX - 2, y + 6);
      doc.line(colRedoX - 2, y - 4, colRedoX - 2, y + 6);
      doc.line(colSigX - 2, y - 4, colSigX - 2, y + 6);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(0);
      doc.text('Satisfactorily', colCheckX, y - 1);
      doc.text('Completed', colCheckX, y + 2);
      doc.text('Incomplete', colRedoX, y - 1);
      doc.text('or Redo', colRedoX, y + 1);
      doc.text('Required', colRedoX, y + 2);
      doc.text('Trainer', colSigX + 2, y - 1);
      doc.text('Trainer', col3lcX, y - 1);
      doc.text('Signature', colSigX + 2, y + 2);
      doc.text('Texel 3LC', col3lcX, y + 2);
      
      y += 8;
    }
    
    function drawCheckbox(x, checked) {
      doc.rect(x, y - 2.5, 3.5, 3.5);
      if (checked) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('X', x + 0.6, y + 0.3);
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
    
    // Row 1: Trainee Name + Rank
    doc.text('Trainee Name:', margin + 2, rowY);
    if (data.traineeName) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.traineeName, margin + 28, rowY);
      doc.setFont('helvetica', 'normal');
    }
    doc.line(margin + 26, rowY + 1, 95, rowY + 1);
    doc.text('Rank', 100, rowY);
    doc.line(108, rowY + 1, 135, rowY + 1);
    if (data.traineeRank) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.traineeRank, 109, rowY);
      doc.setFont('helvetica', 'normal');
    }
    
    // Row 2: Sim Registration + Licence No
    rowY += 7;
    doc.text('Sim Registration:', margin + 2, rowY);
    doc.line(margin + 32, rowY + 1, 75, rowY + 1);
    if (data.simRegistration) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.simRegistration, margin + 33, rowY);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('Licence No.:', 80, rowY);
    doc.line(95, rowY + 1, 135, rowY + 1);
    if (data.licenceNo) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.licenceNo, 96, rowY);
      doc.setFont('helvetica', 'normal');
    }
    
    // Row 3: Type of session + Date + EDTO Validity Expiry (moved to right)
    rowY += 7;
    doc.text('Type of session:', margin + 2, rowY);
    doc.line(margin + 32, rowY + 1, 55, rowY + 1);
    if (data.sessionType) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.sessionType, margin + 33, rowY);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('Date:', 60, rowY);
    doc.line(67, rowY + 1, 95, rowY + 1);
    if (data.date) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.date, 68, rowY);
      doc.setFont('helvetica', 'normal');
    }
    // EDTO Validity Expiry on the far right
    doc.text('EDTO Validity Expiry:', 115, rowY);
    doc.line(138, rowY + 1, rightEdge - 2, rowY + 1);
    if (data.edtoExpiry) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.edtoExpiry, 139, rowY);
      doc.setFont('helvetica', 'normal');
    }
    
    // Row 4: Location
    rowY += 7;
    doc.text('Location:', margin + 2, rowY);
    doc.line(margin + 22, rowY + 1, 55, rowY + 1);
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
        
        // Signature placeholder lines (faint)
        doc.setDrawColor(200, 200, 200);
        doc.line(colSigX, y + 1, colSigX + 15, y + 1);
        doc.line(col3lcX, y + 1, col3lcX + 12, y + 1);
        doc.setDrawColor(0);
        
        // Draw item text
        doc.setFontSize(7);
        const textX = margin + 4;
        doc.text(item, textX, y + 1);
        
        y += 5;
      });
      
      y += 2;
    }
    
    // ═══ ALL SECTIONS ═══
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
    
    drawSection('ENROUTE - AFTER EDTO EXIT POINT', [
      'Mach Number',
      'CDU Offset (If applied during EDTO)',
      'Cruise FL - Review',
      'FMC Position - Checked',
      'Fuel Crossfeed Valve',
      'ETL Entry - after shutdown'
    ], 's5');
    
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
    
    doc.setDrawColor(0);
    const commentsH = 25;
    doc.rect(margin, y, contentW, commentsH);
    
    if (data.instructorComments) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(data.instructorComments, contentW - 6);
      lines.forEach((line, i) => {
        if (i < 6) doc.text(line, margin + 3, y + 5 + (i * 4));
      });
    }
    y += commentsH + 10;
    
    // ═══ Signatures ═══
    checkPage(25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Trainer Name + Signature
    doc.text('Trainer Name:', margin + 2, y);
    doc.line(margin + 28, y + 1, 85, y + 1);
    if (data.trainerName) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.trainerName, margin + 29, y);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('Trainer Signature:', 90, y);
    // No underline for signature - just space for signature
    
    // Trainer signature image if available
    if (data.trainerSignature && data.trainerSignature.startsWith('data:')) {
      try {
        doc.addImage(data.trainerSignature, 'PNG', 115, y - 5, 40, 8);
      } catch(e) {}
    }
    y += 12;
    
    // Trainee Name + Signature
    doc.text('Trainee Name:', margin + 2, y);
    doc.line(margin + 28, y + 1, 85, y + 1);
    if (data.footerTraineeName || data.traineeName) {
      doc.setFont('helvetica', 'bold');
      doc.text(data.footerTraineeName || data.traineeName, margin + 29, y);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('Trainee Signature:', 90, y);
    
    // Trainee signature image if available
    if (data.traineeSignature && data.traineeSignature.startsWith('data:')) {
      try {
        doc.addImage(data.traineeSignature, 'PNG', 115, y - 5, 40, 8);
      } catch(e) {}
    }
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
        if (i < 5) doc.text(line, margin + 3, y + 5 + (i * 4));
      });
    }
    y += genH + 10;
    
    // ═══ Prepared by Section ═══
    checkPage(20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Signature / Stamp', 55, y + 3);
    doc.text('Date', rightEdge - 35, y + 3);
    y += 6;
    doc.line(30, y, 100, y);
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
