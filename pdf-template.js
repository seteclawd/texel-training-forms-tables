// PDF Generation - TA-TD-20 Rev 04 - exact layout match

function generatePDFCode() {
  return `
  async function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    const PAGE_W = 210;
    const PAGE_H = 297;
    const M = 10; // margin
    const CW = PAGE_W - M * 2; // content width = 190mm
    let y = 8;
    
    // ═══ COLUMN LAYOUT ═══
    // Text takes 60%, columns take 40% of content width
    const TEXT_END = 115;    // Item text ends here
    const COL1_X = 118;     // Satisfactorily Completed checkbox
    const COL2_X = 142;     // Incomplete or Redo checkbox
    const COL3_X = 168;     // Trainer Signature (placeholder)
    const COL4_X = 188;     // Trainer Texel 3LC (placeholder)
    const BOX_SIZE = 3.5;
    
    function checkPage(needed) {
      if (y > PAGE_H - (needed || 20)) {
        doc.addPage();
        y = 22;
        // Page 2+ header
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Form:TA-TD-20', M, 10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('B737 - EDTO/ETOPS TRAINING FORM', 105, 10, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Revision: 04', PAGE_W - M - 20, 10);
        doc.text('Date: 11-12-2025', PAGE_W - M - 20, 14);
        return true;
      }
      return false;
    }
    
    function drawCheckbox(x, checked) {
      doc.rect(x, y - 2.5, BOX_SIZE, BOX_SIZE);
      if (checked) {
        doc.setFontSize(8);
        doc.text('X', x + 0.7, y + 0.3);
      }
    }
    
    // ═══ PAGE 1 HEADER ═══
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Form:TA-TD-20', M, 10);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('B737 - EDTO/ETOPS', 105, 9, { align: 'center' });
    doc.setFontSize(10);
    doc.text('TRAINING FORM', 105, 14, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Revision: 04', PAGE_W - M - 20, 10);
    doc.text('Date: 11-12-2025', PAGE_W - M - 20, 14);
    y = 20;
    
    // ═══ TRAINEE DETAILS BOX ═══
    doc.setLineWidth(0.3);
    doc.rect(M, y, CW, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Trainee and Simulator Details', 105, y + 5, { align: 'center' });
    
    let ry = y + 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Row 1
    doc.text('Trainee Name:', M + 2, ry);
    if (data.traineeName) { doc.setFont('helvetica', 'bold'); doc.text(data.traineeName, M + 28, ry); doc.setFont('helvetica', 'normal'); }
    doc.line(M + 26, ry + 1, 95, ry + 1);
    doc.text('Rank', 100, ry);
    doc.line(108, ry + 1, 135, ry + 1);
    if (data.traineeRank) { doc.setFont('helvetica', 'bold'); doc.text(data.traineeRank, 109, ry); doc.setFont('helvetica', 'normal'); }
    
    // Row 2
    ry += 7;
    doc.text('Sim Registration:', M + 2, ry);
    doc.line(M + 32, ry + 1, 70, ry + 1);
    if (data.simRegistration) { doc.setFont('helvetica', 'bold'); doc.text(data.simRegistration, M + 33, ry); doc.setFont('helvetica', 'normal'); }
    doc.text('Licence No.:', 75, ry);
    doc.line(90, ry + 1, 135, ry + 1);
    if (data.licenceNo) { doc.setFont('helvetica', 'bold'); doc.text(data.licenceNo, 91, ry); doc.setFont('helvetica', 'normal'); }
    
    // Row 3
    ry += 7;
    doc.text('Type of session:', M + 2, ry);
    doc.line(M + 32, ry + 1, 45, ry + 1);
    if (data.sessionType) { doc.setFont('helvetica', 'bold'); doc.text(data.sessionType, M + 33, ry); doc.setFont('helvetica', 'normal'); }
    doc.text('Date:', 65, ry);
    doc.line(72, ry + 1, 100, ry + 1);
    if (data.date) { doc.setFont('helvetica', 'bold'); doc.text(data.date, 73, ry); doc.setFont('helvetica', 'normal'); }
    // EDTO Validity Expiry - moved 20px left
    doc.text('EDTO Validity Expiry:', 95, ry);
    doc.line(120, ry + 1, PAGE_W - M - 2, ry + 1);
    if (data.edtoExpiry) { doc.setFont('helvetica', 'bold'); doc.text(data.edtoExpiry, 121, ry); doc.setFont('helvetica', 'normal'); }
    
    // Row 4
    ry += 7;
    doc.text('Location:', M + 2, ry);
    doc.line(M + 22, ry + 1, 55, ry + 1);
    if (data.location) { doc.setFont('helvetica', 'bold'); doc.text(data.location, M + 23, ry); doc.setFont('helvetica', 'normal'); }
    doc.text('Aircraft', PAGE_W - M - 20, ry);
    
    y = 55;
    
    // ═══ COLUMN HEADERS ═══
    doc.setFillColor(220, 220, 220);
    doc.rect(M, y - 4, CW, 10, 'F');
    doc.setDrawColor(0);
    doc.rect(M, y - 4, CW, 10);
    // Vertical separators
    doc.line(COL1_X - 2, y - 4, COL1_X - 2, y + 6);
    doc.line(COL2_X - 2, y - 4, COL2_X - 2, y + 6);
    doc.line(COL3_X - 2, y - 4, COL3_X - 2, y + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text('Satisfactorily', COL1_X, y);
    doc.text('Completed', COL1_X, y + 3);
    doc.text('Incomplete', COL2_X, y);
    doc.text('or Redo', COL2_X, y + 2);
    doc.text('Required', COL2_X, y + 4);
    doc.text('Trainer', COL3_X + 3, y);
    doc.text('Trainer', COL4_X, y);
    doc.text('Signature', COL3_X + 3, y + 3);
    doc.text('Texel 3LC', COL4_X, y + 3);
    y += 8;
    
    // ═══ DRAW SECTION ═══
    function drawSection(title, items, secId) {
      checkPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(title, M + 2, y);
      y += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      
      items.forEach((item, idx) => {
        checkPage(5);
        const key = 's' + secId + '-i' + idx;
        const status = data.checklist ? data.checklist[key] : '';
        
        // Checkboxes
        drawCheckbox(COL1_X, status === 'pass');
        drawCheckbox(COL2_X, status === 'fail');
        
        // Trainer signature from itemSignatures
        const sigs = data.itemSignatures ? data.itemSignatures[key] : null;
        if (sigs && sigs.trainer && sigs.trainer.startsWith('data:')) {
          try {
            doc.addImage(sigs.trainer, 'PNG', COL3_X, y - 3, 16, 6);
          } catch(e) {}
        } else {
          doc.setDrawColor(200, 200, 200);
          doc.line(COL3_X, y + 1, COL3_X + 16, y + 1);
          doc.setDrawColor(0);
        }
        
        // Texel 3LC line
        doc.setDrawColor(200, 200, 200);
        doc.line(COL4_X, y + 1, COL4_X + 12, y + 1);
        doc.setDrawColor(0);
        
        // Item text
        doc.text(item, M + 4, y + 1);
        y += 4.5;
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
    ], 1);
    
    drawSection('PRE-FLIGHT', [
      'Aircraft Status - Consult MEL',
      '  - RVSM Requirements',
      '  - EDTO Requirements',
      'Fuel Crossfeed Valve - i.a.w. FCOM',
      'Aircraft Clocks - UTC set',
      'Flight Plan Route - Enter FPL into FMC',
      'Route Leg Winds - Insert winds',
      'EDTO Tracks and Distances - Verified'
    ], 3);
    
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
    ], 4);
    
    // ═══ PAGE 2 ═══
    checkPage(100);
    
    drawSection('ENROUTE - AFTER EDTO EXIT POINT', [
      'Mach Number',
      'CDU Offset (If applied during EDTO)',
      'Cruise FL - Review',
      'FMC Position - Checked',
      'Fuel Crossfeed Valve',
      'ETL Entry - after shutdown'
    ], 5);
    
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
    ], 6);
    
    // ═══ TRAINER COMMENTS ═══
    checkPage(35);
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Trainer Comments', M + 2, y);
    y += 6;
    doc.setDrawColor(0);
    doc.rect(M, y, CW, 22);
    if (data.instructorComments) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(data.instructorComments, CW - 6);
      lines.forEach((line, i) => { if (i < 5) doc.text(line, M + 3, y + 5 + i * 4); });
    }
    y += 28;
    
    // ═══ SIGNATURES ═══
    checkPage(25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Trainer
    doc.text('Trainer Name:', M + 2, y);
    doc.line(M + 28, y + 1, 80, y + 1);
    if (data.trainerName) { doc.setFont('helvetica', 'bold'); doc.text(data.trainerName, M + 29, y); doc.setFont('helvetica', 'normal'); }
    doc.text('Trainer Signature:', 85, y);
    if (data.trainerSignature && data.trainerSignature.startsWith('data:')) {
      try { doc.addImage(data.trainerSignature, 'PNG', 110, y - 6, 45, 10); } catch(e) {}
    }
    y += 12;
    
    // Trainee
    doc.text('Trainee Name:', M + 2, y);
    doc.line(M + 28, y + 1, 80, y + 1);
    if (data.footerTraineeName || data.traineeName) { doc.setFont('helvetica', 'bold'); doc.text(data.footerTraineeName || data.traineeName, M + 29, y); doc.setFont('helvetica', 'normal'); }
    doc.text('Trainee Signature:', 85, y);
    if (data.traineeSignature && data.traineeSignature.startsWith('data:')) {
      try { doc.addImage(data.traineeSignature, 'PNG', 110, y - 6, 45, 10); } catch(e) {}
    }
    y += 15;
    
    // ═══ GENERAL COMMENTS ═══
    checkPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('General Comments or Recommendations', 105, y, { align: 'center' });
    y += 6;
    doc.setDrawColor(0);
    doc.rect(M, y, CW, 20);
    if (data.generalComments) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(data.generalComments, CW - 6);
      lines.forEach((line, i) => { if (i < 5) doc.text(line, M + 3, y + 5 + i * 4); });
    }
    y += 26;
    
    // ═══ PREPARED BY ═══
    checkPage(20);
    y += 15;  // Move section down 40px from previous content
    doc.setFontSize(9);
    doc.text('Signature / Stamp', 30, y);
    doc.text('Date', 140, y);  // Date label moved left
    y += 6;
    doc.line(30, y, 100, y);  // Signature line
    doc.line(140, y, 180, y);  // Date line
    if (data.preparedBy) { doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(data.preparedBy, 30, y + 5); }
    if (data.preparedDate) { doc.setFont('helvetica', 'bold'); doc.text(data.preparedDate, 160, y - 2); }  // Date value moved right
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('Page 2 of 2', 105, PAGE_H - 5, { align: 'center' });
    
    return doc.output('datauristring');
  }
  `;
}

module.exports = { generatePDFCode };
