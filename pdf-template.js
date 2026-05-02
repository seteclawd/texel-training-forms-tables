// PDF Generation - TA-TD-20 Rev 04 - exact group-based layout

function generatePDFCode() {
  return `
  async function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    const PAGE_W = 210;
    const PAGE_H = 297;
    const M = 10;
    const CW = PAGE_W - M * 2;
    let y = 8;
    
    // Column positions - checkboxes centered per group
    const COL_TEXT = 110;     // Text column ends
    const COL_CHK = 113;      // Satisfactorily Completed
    const COL_REDO = 138;     // Incomplete or Redo
    const COL_SIG = 163;      // Trainer Signature
    const COL_3LC = 182;      // Trainer Texel 3LC
    const BOX = 5;            // Checkbox size (bigger for groups)
    
    function checkPage(needed) {
      if (y > PAGE_H - (needed || 25)) {
        doc.addPage();
        y = 22;
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
      doc.rect(x, y - 3, BOX, BOX);
      if (checked) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('X', x + 1, y + 0.5);
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
    
    doc.text('Trainee Name:', M + 2, ry);
    if (data.traineeName) { doc.setFont('helvetica', 'bold'); doc.text(data.traineeName, M + 28, ry); doc.setFont('helvetica', 'normal'); }
    doc.line(M + 26, ry + 1, 95, ry + 1);
    doc.text('Rank', 100, ry);
    doc.line(108, ry + 1, 135, ry + 1);
    if (data.traineeRank) { doc.setFont('helvetica', 'bold'); doc.text(data.traineeRank, 109, ry); doc.setFont('helvetica', 'normal'); }
    
    ry += 7;
    doc.text('Sim Registration:', M + 2, ry);
    doc.line(M + 32, ry + 1, 70, ry + 1);
    if (data.simRegistration) { doc.setFont('helvetica', 'bold'); doc.text(data.simRegistration, M + 33, ry); doc.setFont('helvetica', 'normal'); }
    doc.text('Licence No.:', 75, ry);
    doc.line(90, ry + 1, 135, ry + 1);
    if (data.licenceNo) { doc.setFont('helvetica', 'bold'); doc.text(data.licenceNo, 91, ry); doc.setFont('helvetica', 'normal'); }
    
    ry += 7;
    doc.text('Type of session:', M + 2, ry);
    doc.line(M + 32, ry + 1, 45, ry + 1);
    if (data.sessionType) { doc.setFont('helvetica', 'bold'); doc.text(data.sessionType, M + 33, ry); doc.setFont('helvetica', 'normal'); }
    doc.text('Date:', 65, ry);
    doc.line(72, ry + 1, 100, ry + 1);
    if (data.date) { doc.setFont('helvetica', 'bold'); doc.text(data.date, 73, ry); doc.setFont('helvetica', 'normal'); }
    doc.text('EDTO Validity Expiry:', 110, ry);
    doc.line(135, ry + 1, PAGE_W - M - 2, ry + 1);
    if (data.edtoExpiry) { doc.setFont('helvetica', 'bold'); doc.text(data.edtoExpiry, 136, ry); doc.setFont('helvetica', 'normal'); }
    
    ry += 7;
    doc.text('Location:', M + 2, ry);
    doc.line(M + 22, ry + 1, 55, ry + 1);
    if (data.location) { doc.setFont('helvetica', 'bold'); doc.text(data.location, M + 23, ry); doc.setFont('helvetica', 'normal'); }
    doc.text('Aircraft', PAGE_W - M - 20, ry);
    
    y = 55;
    
    // ═══ COLUMN HEADERS ═══
    doc.setFillColor(200, 220, 240);
    doc.rect(M, y - 4, CW, 10, 'F');
    doc.setDrawColor(0);
    doc.rect(M, y - 4, CW, 10);
    doc.line(COL_CHK - 1, y - 4, COL_CHK - 1, y + 6);
    doc.line(COL_REDO - 1, y - 4, COL_REDO - 1, y + 6);
    doc.line(COL_SIG - 1, y - 4, COL_SIG - 1, y + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text('Satisfactorily', COL_CHK, y);
    doc.text('Completed', COL_CHK, y + 3);
    doc.text('Incomplete', COL_REDO, y);
    doc.text('or Redo', COL_REDO, y + 2);
    doc.text('Required', COL_REDO, y + 4);
    doc.text('Trainer', COL_SIG + 2, y);
    doc.text('Trainer', COL_3LC, y);
    doc.text('Signature', COL_SIG + 2, y + 3);
    doc.text('Texel 3LC', COL_3LC, y + 3);
    y += 8;
    
    // ═══ DRAW SECTION WITH GROUPS ═══
    // Groups have checkboxes, sub-items don't
    function drawSection(title, groups, secId) {
      checkPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(title, M + 2, y);
      y += 6;
      
      groups.forEach((group, gIdx) => {
        checkPage(8);
        const gKey = 's' + secId + '-g' + gIdx;  // Group key: s1-g0, s1-g1, etc.
        const gStatus = data.checklist ? data.checklist[gKey] : '';
        
        // Group title (bold) with checkboxes
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(group.title, M + 2, y + 1);
        
        // Checkboxes for group
        drawCheckbox(COL_CHK, gStatus === 'pass');
        drawCheckbox(COL_REDO, gStatus === 'fail');
        
        // Signature line for group
        doc.setDrawColor(180, 180, 180);
        doc.line(COL_SIG, y + 2, COL_SIG + 16, y + 2);
        doc.line(COL_3LC, y + 2, COL_3LC + 10, y + 2);
        doc.setDrawColor(0);
        
        // Draw trainer signature if available
        if (data.itemSignatures && data.itemSignatures[gKey]) {
          const sigs = data.itemSignatures[gKey];
          if (sigs.trainer && sigs.trainer.startsWith('data:')) {
            try { doc.addImage(sigs.trainer, 'PNG', COL_SIG, y - 2, 16, 6); } catch(e) {}
          }
        }
        
        y += 6;
        
        // Sub-items (indented, no checkboxes)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        group.items.forEach(item => {
          checkPage(4);
          const bullet = item.startsWith('  ') ? '\\u25B8 ' : '';  // Triangle bullet
          doc.text(bullet + item.trim(), M + 6, y + 1);
          y += 4;
        });
        
        y += 2;
      });
    }
    
    // ═══ ALL SECTIONS ═══
    drawSection('FLIGHT PREPARATION BRIEFING', [
      { title: 'Route Briefing Contents:', items: [
        'TAFS & METARS for destination, alternates & ERAs',
        'NOTAMS for destination, Alternates and ERAs and route',
        'SIG WX & Upper Wind Charts',
        'SIGMETS'
      ]},
      { title: 'Flight Plan:', items: [
        'Check Flt No. Date, Route & A/C Registration',
        'Note - Max FL, average W/C and Max Shear',
        'Note - Trip fuel and flight time',
        'Note - Critical Fuel - Calculate diversion fuel',
        'Note - TOTAL FUEL'
      ]},
      { title: 'FD Pro Route/Waypoints:', items: [
        'Insert OFP Route',
        'Create and insert ENTRY and EXIT waypoints',
        'Verify EDTO waypoints (incl. EDTO Entry and Exit points)',
        'Create and insert ETPs (as required)',
        'No-Go Areas'
      ]}
    ], 1);
    
    drawSection('PRE-FLIGHT', [
      { title: 'Aircraft Status:', items: [
        'Consult MEL - RVSM Requirements',
        'Consult MEL - EDTO Requirements'
      ]},
      { title: 'Fuel Crossfeed Valve:', items: [
        'i.a.w. FCOM Fuel Crossfeed Valve Check'
      ]},
      { title: 'Aircraft Clocks:', items: [
        'UTC set'
      ]},
      { title: 'Flight Plan Route:', items: [
        'Enter FPL into FMC'
      ]},
      { title: 'Route Leg Winds:', items: [
        'Insert winds'
      ]},
      { title: 'EDTO Tracks and Distances:', items: [
        'Verified and Checked'
      ]}
    ], 3);
    
    drawSection('ENROUTE - PRIOR TO EDTO ENTRY POINT', [
      { title: 'EDTO Clearance:', items: ['40 Minutes before'] },
      { title: 'Weather from OCC:', items: ['SATPHONE 30 minutes before'] },
      { title: 'APU:', items: ['15 minutes before ENTRY point'] },
      { title: 'EDTO Significant Systems Operation:', items: ['Check'] },
      { title: 'FMC Position:', items: ['Check'] },
      { title: 'FMC Route:', items: ['If changed then confirm modification (CPDLC)'] },
      { title: 'CDU FIX page:', items: ['adequate AD 428nm ARCs'] },
      { title: 'Flight Level and Mach Number:', items: ['as cleared'] },
      { title: 'HF and SELCAL:', items: ['Checked'] },
      { title: 'Radios and Transponder:', items: ['Check'] },
      { title: 'Approaching Waypoints:', items: ['TRK and DIST'] },
      { title: 'Passing Each Waypoint:', items: ['Actual Track'] },
      { title: 'Position Report:', items: ['Check'] },
      { title: '10 Minute after passing waypoint:', items: ['Check'] },
      { title: 'Midpoint Check:', items: ['winds and times'] },
      { title: 'ETP CDU FIX page:', items: ['updated'] }
    ], 4);
    
    // ═══ PAGE 2 ═══
    checkPage(120);
    
    drawSection('ENROUTE - AFTER EDTO EXIT POINT', [
      { title: 'Mach Number:', items: ['Check'] },
      { title: 'CDU Offset:', items: ['If applied during EDTO'] },
      { title: 'Cruise FL:', items: ['Review'] },
      { title: 'FMC Position:', items: ['Checked'] },
      { title: 'Fuel Crossfeed Valve:', items: ['Check'] },
      { title: 'ETL Entry:', items: ['after shutdown'] }
    ], 5);
    
    drawSection('NON-NORMALS', [
      { title: 'Re-Routing:', items: ['Check'] },
      { title: 'Diversion Planning:', items: ['Check'] },
      { title: 'MEL - APU Fault:', items: ['Check'] },
      { title: 'Engine Non-Normal requiring diversion:', items: ['Check'] },
      { title: 'Pressurisation Non-Normal requiring diversion:', items: ['Check'] },
      { title: 'Navigation Non-Normal:', items: ['Check'] },
      { title: 'Weather Contingency:', items: ['Check'] },
      { title: 'Non-Comms Contingency:', items: ['Check'] },
      { title: 'Other Non-Normal:', items: ['Check'] }
    ], 6);
    
    // ═══ TRAINER COMMENTS ═══
    checkPage(40);
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Trainer Comments', M + 2, y);
    y += 6;
    doc.setDrawColor(0);
    doc.rect(M, y, CW, 25);
    if (data.instructorComments) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(data.instructorComments, CW - 6);
      lines.forEach((line, i) => { if (i < 6) doc.text(line, M + 3, y + 5 + i * 3.5); });
    }
    y += 30;
    
    // ═══ SIGNATURES ═══
    checkPage(25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    doc.text('Trainer Name:', M + 2, y);
    doc.line(M + 28, y + 1, 80, y + 1);
    if (data.trainerName) { doc.setFont('helvetica', 'bold'); doc.text(data.trainerName, M + 29, y); doc.setFont('helvetica', 'normal'); }
    doc.text('Trainer Signature:', 85, y);
    if (data.trainerSignature && data.trainerSignature.startsWith('data:')) {
      try { doc.addImage(data.trainerSignature, 'PNG', 110, y - 6, 45, 10); } catch(e) {}
    }
    y += 12;
    
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
    y += 10;
    doc.setFontSize(9);
    doc.text('Signature / Stamp', 30, y);
    doc.text('Date', 140, y);
    y += 6;
    doc.line(30, y, 100, y);
    doc.line(140, y, 180, y);
    if (data.preparedBy) { doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(data.preparedBy, 30, y + 5); }
    if (data.preparedDate) { doc.setFont('helvetica', 'bold'); doc.text(data.preparedDate, 160, y - 2); }
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('Page 2 of 2', 105, PAGE_H - 5, { align: 'center' });
    
    return doc.output('datauristring');
  }
  `;
}

module.exports = { generatePDFCode };
