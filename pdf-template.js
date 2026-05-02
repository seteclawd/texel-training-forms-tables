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
    
    // Format date: dd/mmm/yyyy
    function formatDate(dateStr) {
      if (!dateStr) return '';
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const d = new Date(dateStr + 'T00:00:00');
      const dd = String(d.getDate()).padStart(2, '0');
      const mmm = months[d.getMonth()];
      const yyyy = d.getFullYear();
      return dd + '/' + mmm + '/' + yyyy;
    }
    
    // Column positions
    const COL_TEXT = 110;
    const COL_CHK = 113;
    const COL_REDO = 138;
    const COL_SIG = 163;
    const COL_3LC = 182;
    const BOX = 5;
    
    function checkPage(needed) {
      if (y > PAGE_H - (needed || 25)) {
        doc.addPage();
        y = 15;
      }
    }
    
    function drawCheckbox(x, checked) {
      doc.rect(x, y - 2, BOX, BOX);
      if (checked) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('X', x + 1, y + 1.5);
        doc.setFont('helvetica');
        doc.setFontSize(8);
      }
    }
    
    // ═══ HEADER ═══
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('B737 – EDTO/ETOPS TRAINING FORM', 105, 12, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Revision: 04', PAGE_W - M - 20, 10);
    doc.text('Date: 11-12-2025', PAGE_W - M - 20, 14);
    y = 20;
    
        // ═══ TRAINEE DETAILS BOX ═══
    doc.setLineWidth(0.3);
    doc.rect(M, y, CW, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Trainee and Simulator Details', 105, y + 5, { align: 'center' });
    
    let ry = y + 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Row 1: Trainee Name | Rank | Licence No.
    doc.text('Trainee Name:', M + 2, ry);
    const traineeNameX = M + 28;
    const traineeNameEndX = 88;
    doc.line(traineeNameX, ry + 1, traineeNameEndX, ry + 1);
    if (data.traineeName) { doc.setFont('helvetica', 'bold'); doc.text(data.traineeName, traineeNameX, ry); doc.setFont('helvetica', 'normal'); }
    
    doc.text('Rank:', 92, ry);
    const rankEndX = 112;
    doc.line(104, ry + 1, rankEndX, ry + 1);
    if (data.traineeRank) { doc.setFont('helvetica', 'bold'); doc.text(data.traineeRank, 105, ry); doc.setFont('helvetica', 'normal'); }
    
    doc.text('Licence No.:', 116, ry);
    doc.line(138, ry + 1, PAGE_W - M - 2, ry + 1);
    if (data.licenceNo) { doc.setFont('helvetica', 'bold'); doc.text(data.licenceNo, 139, ry); doc.setFont('helvetica', 'normal'); }
    
    // Row 2: Type of session | Simulator/Aircraft | Location
    ry += 8;
    doc.text('Type of session:', M + 2, ry);
    if (data.sessionType) { doc.setFont('helvetica', 'bold'); doc.text(data.sessionType, M + 33, ry); doc.setFont('helvetica', 'normal'); }
    
    // Simulator/Aircraft checkboxes
    doc.setFont('helvetica', 'normal');
    doc.text('[ ] Simulator', 65, ry);
    doc.text('[ ] Aircraft', 98, ry);
    if (data.sessionType === 'Simulator') { doc.setFont('helvetica', 'bold'); doc.text('[X]', 65, ry); }
    if (data.sessionType === 'Aircraft') { doc.setFont('helvetica', 'bold'); doc.text('[X]', 98, ry); }
    doc.setFont('helvetica', 'normal');
    
    doc.text('Location:', 125, ry);
    doc.line(143, ry + 1, PAGE_W - M - 2, ry + 1);
    if (data.location) { doc.setFont('helvetica', 'bold'); doc.text(data.location, 144, ry); doc.setFont('helvetica', 'normal'); }
    
    // Row 3: Date | EDTO Validity Expiry | Sim Registration
    ry += 8;
    doc.text('Date:', M + 2, ry);
    doc.line(M + 14, ry + 1, 65, ry + 1);
    if (data.date) { doc.setFont('helvetica', 'bold'); doc.text(formatDate(data.date), M + 15, ry); doc.setFont('helvetica', 'normal'); }
    
    doc.text('EDTO Validity Expiry:', 70, ry);
    doc.line(108, ry + 1, 150, ry + 1);
    if (data.edtoExpiry) { doc.setFont('helvetica', 'bold'); doc.text(formatDate(data.edtoExpiry), 109, ry); doc.setFont('helvetica', 'normal'); }
    
    doc.text('Sim Registration:', 155, ry);
    doc.line(180, ry + 1, PAGE_W - M - 2, ry + 1);
    if (data.simRegistration) { doc.setFont('helvetica', 'bold'); doc.text(data.simRegistration, 181, ry); doc.setFont('helvetica', 'normal'); }
    
    y = 72;
    
    // Footer page 1
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('TA-TD-20', M + 2, PAGE_H - 5);
    doc.text(data.footerTraineeName || data.traineeName || '', 105, PAGE_H - 5, { align: 'center' });
    
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
    
    // ═══ DRAW SECTION WITH GROUPS (FLIGHT PREP) ═══
    function drawSection(title, groups, secId) {
      if (!groups || groups.length === 0) return;
      checkPage(10);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(title, M + 2, y);
      y += 4;
      
      groups.forEach((group, gIdx) => {
        checkPage(8);
        const gKey = 's' + secId + '-g' + gIdx;
        const gStatus = data.checklist ? data.checklist[gKey] : '';
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text((group.num ? group.num + ' ' : '') + group.title, M + 4, y + 1);
        
        drawCheckbox(COL_CHK - 1, gStatus === "pass");
        drawCheckbox(COL_REDO - 1, gStatus === "fail");
        
        if (gStatus && (data.trainerSignature || data.trainerCode)) {
          if (data.trainerSignature && data.trainerSignature.startsWith('data:')) {
            try { doc.addImage(data.trainerSignature, 'PNG', COL_SIG, y - 4, 16, 7); } catch(e) {}
          }
          if (data.trainerCode) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text(data.trainerCode, COL_3LC, y);
          }
        }
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        
        if (group.items && group.items[0] && typeof group.items[0] === 'object') {
          group.items.forEach(item => {
            checkPage(3);
            doc.text(item.n + ' ' + item.t, M + 8, y + 1);
            y += 3.5;
          });
        } else {
          group.items.forEach(item => {
            checkPage(3);
            doc.text('▸ ' + (typeof item === 'string' ? item : item.t || ''), M + 8, y + 1);
            y += 3.5;
          });
        }
        y += 1;
        
      });
    }
    
    // ═══ FLAT SECTION (ONE checkbox for entire section) ═══
    function drawFlatSection(title, items, secId) {
      if (!items || items.length === 0) return;
      checkPage(15);
      
      const sKey = 's' + secId + '-all';
      const sStatus = data.checklist ? data.checklist[sKey] : '';
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(title, M + 2, y);
      y += 3;
      
      drawCheckbox(COL_CHK, sStatus === 'pass');
      drawCheckbox(COL_REDO, sStatus === 'fail');
      
      if (sStatus && (data.trainerSignature || data.trainerCode)) {
        if (data.trainerSignature && data.trainerSignature.startsWith('data:')) {
          try { doc.addImage(data.trainerSignature, 'PNG', COL_SIG, y - 4, 16, 7); } catch(e) {}
        }
        if (data.trainerCode) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.text(data.trainerCode, COL_3LC, y);
        }
      }
      y += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      
      function drawItem(item, depth) {
        checkPage(3);
        const indent = M + 4 + (depth * 8);
        const num = item.n ? item.n + ' ' : '';
        const text = item.t || item;
        doc.text(num + text, indent, y + 1);
        y += 3.5;
        if (item.sub) {
          item.sub.forEach(sub => drawItem(sub, depth + 1));
        }
      }
      items.forEach(item => drawItem(item, 0));
      y += 2;
    }
    
    // ═══ DRAW CHECKBOX PER ITEM (NON-NORMALS) ═══
    function drawSectionWithItemChecks(title, items, secId) {
      if (!items || items.length === 0) return;
      checkPage(10);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(title, M + 2, y);
      y += 6;
      
      items.forEach((item, iIdx) => {
        checkPage(6);
        const iKey = 's' + secId + '-i' + iIdx;
        const iStatus = data.checklist ? data.checklist[iKey] : '';
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(item.n + '. ' + item.t, M + 4, y + 1);
        y += 6;
      });
      
      // Section separator line
      doc.setDrawColor(180, 180, 180);
      doc.line(M, y, M + CW, y);
      y += 2;
    }
    
    // ═══ DRAW ALL SECTIONS ═══
    drawSection('FLIGHT PREPARATION BRIEFING', [
      { title: 'Route Briefing Contents:', num: '1.1', items: [
        { n: 'a', t: 'TAFS & METARS for destination, alternates & ERAs' },
        { n: 'b', t: 'NOTAMS for destination, Alternates and ERAs and route' },
        { n: 'c', t: 'SIG WX & Upper Wind Charts' },
        { n: 'd', t: 'SIGMETS' }
      ]},
      { title: 'Flight Plan:', num: '1.2', items: [
        { n: 'a', t: 'Check Flt No. Date, Route & A/C Registration' },
        { n: 'b', t: 'Note - Max FL, average W/C and Max Shear' },
        { n: 'c', t: 'Note - Trip fuel and flight time' },
        { n: 'd', t: 'Note - Critical Fuel - Calculate diversion fuel' },
        { n: 'e', t: 'Note - TOTAL FUEL' }
      ]},
      { title: 'FD Pro Route/Waypoints:', num: '1.3', items: [
        { n: 'a', t: 'Insert OFP Route' },
        { n: 'b', t: 'Create and insert ENTRY and EXIT waypoints' },
        { n: 'c', t: 'Verify EDTO waypoints (incl. EDTO Entry and Exit points)' },
        { n: 'd', t: 'Create and insert ETPs (as required)' },
        { n: 'e', t: 'No-Go Areas' }
      ]}
    ], 1);
    
    drawFlatSection('PRE-FLIGHT', [
      { t: 'Aircraft Status', n: '1', sub: [
        { t: 'Consult MEL', n: '2', sub: [
          { t: 'RVSM Requirements', n: '3' },
          { t: 'EDTO Requirements', n: '4' }
        ]}
      ]},
      { t: 'Fuel Crossfeed Valve - i.a.w. FCOM Fuel Crossfeed Valve Check', n: '5' },
      { t: 'Aircraft Clocks - UTC set', n: '6' },
      { t: 'Flight Plan Route - Enter FPL into FMC', n: '7' },
      { t: 'Route Leg Winds - Insert winds', n: '8' },
      { t: 'EDTO Tracks and Distances - Verified and Checked', n: '9' }
    ], 2);
    
    drawFlatSection('ENROUTE - PRIOR TO EDTO ENTRY POINT', [
      { t: 'EDTO Clearance (40 Minutes before)', n: '1' },
      { t: 'Weather from OCC - SATPHONE 30 minutes before', n: '2' },
      { t: 'APU 15 minutes before ENTRY point', n: '3' },
      { t: 'EDTO Significant Systems Operation', n: '4' },
      { t: 'FMC Position - Check', n: '5' },
      { t: 'FMC Route - If changed then confirm modification (CPDLC)', n: '6' },
      { t: 'CDU FIX page - adequate AD 428nm ARCs', n: '7' },
      { t: 'Flight Level and Mach Number - as cleared', n: '8' },
      { t: 'HF and SELCAL - Checked', n: '9' },
      { t: 'Radios and Transponder', n: '10' },
      { t: 'Approaching Waypoints TRK and DIST', n: '11' },
      { t: 'Passing Each Waypoint Actual Track', n: '12' },
      { t: 'Position Report', n: '13' },
      { t: '10 Minute after passing waypoint', n: '14' },
      { t: 'Midpoint Check winds and times', n: '15' },
      { t: 'ETP CDU FIX page - updated', n: '16' }
    ], 3);
    
    drawFlatSection('ENROUTE - AFTER EDTO EXIT POINT', [
      { t: 'Mach Number', n: '1' },
      { t: 'CDU Offset (If applied during EDTO)', n: '2' },
      { t: 'Cruise FL - Review', n: '3' },
      { t: 'FMC Position - Checked', n: '4' },
      { t: 'Fuel Crossfeed Valve', n: '5' },
      { t: 'ETL Entry - after shutdown', n: '6' }
    ], 4);
    
    drawSectionWithItemChecks('NON-NORMALS', [
      { t: 'Re-Routing', n: '1' },
      { t: 'Diversion Planning', n: '2' },
      { t: 'MEL - APU Fault', n: '3' },
      { t: 'Engine Non-Normal requiring diversion', n: '4' },
      { t: 'Pressurisation Non-Normal requiring diversion', n: '5' },
      { t: 'Navigation Non-Normal', n: '6' },
      { t: 'Weather Contingency', n: '7' },
      { t: 'Non-Comms Contingency', n: '8' },
      { t: 'Other Non-Normal', n: '9' }
    ], 5);
    
    // ═══ TRAINER COMMENTS ═══
    checkPage(40);
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Trainer Comments', M + 2, y);
    y += 6;
    doc.setDrawColor(0);
    doc.rect(M, y, CW, 25);
    if (data.trainerComments) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(data.trainerComments, CW - 6);
      lines.forEach((line, i) => { if (i < 5) doc.text(line, M + 3, y + 5 + i * 4); });
    }
    y += 31;
    
    // ═══ SIGNATURES ═══
    checkPage(40);
    doc.text('Trainer Name:', M + 2, y);
    doc.line(M + 29, y + 1, 80, y + 1);
    if (data.trainerName) { doc.setFont('helvetica', 'normal'); doc.text(data.trainerName, M + 29, y); }
    doc.text('Trainer Name:', M + 2, y);
    doc.line(M + 29, y + 1, 80, y + 1);
    if (data.trainerName) { doc.setFont('helvetica', 'normal'); doc.text(data.trainerName, M + 29, y); }
    doc.text('Trainer Signature:', 120, y);
    if (data.trainerSignature && data.trainerSignature.startsWith('data:')) {
      try { doc.addImage(data.trainerSignature, 'PNG', 145, y - 6, 45, 10); } catch(e) {}
    }
    y += 12;
    
    doc.text('Trainee Name:', M + 2, y);
    doc.line(M + 28, y + 1, 80, y + 1);
    if (data.footerTraineeName || data.traineeName) { doc.setFont('helvetica', 'normal'); doc.text(data.footerTraineeName || data.traineeName, M + 29, y); }
    doc.text('Trainee Signature:', 125, y);
    if (data.traineeSignature && data.traineeSignature.startsWith('data:')) {
      try { doc.addImage(data.traineeSignature, 'PNG', 150, y - 6, 45, 10); } catch(e) {}
    }
    y += 15;
    
    // ═══ GENERAL COMMENTS ═══
    checkPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    if (data.preparedBy) { doc.setFont('helvetica', 'bold'); doc.text(data.preparedBy, M + 2, y); }
    doc.text('General Comments or Recommendations', M + 2, y);
    y += 5;
    y += 11;
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
    if (data.preparedBy) { doc.setFont('helvetica', 'bold'); doc.setFontSize(8); const pw = doc.getTextWidth(data.preparedBy); doc.text(data.preparedBy, 100 - pw, y - 2); }
    if (data.preparedDate) { doc.setFont('helvetica', 'bold'); doc.text(formatDate(data.preparedDate), 160, y - 2); }
    
    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('TA-TD-20', M + 2, PAGE_H - 5);
    doc.text(data.footerTraineeName || data.traineeName || '', 105, PAGE_H - 5, { align: 'center' });
    doc.text('Page 2 of 2', PAGE_W - M - 2, PAGE_H - 5, { align: 'right' });
    
    return doc.output('datauristring');
  }
  `;
}

module.exports = { generatePDFCode };
