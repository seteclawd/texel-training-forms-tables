(function() {
  'use strict';

  // ── Data ────────────────────────────────────────────────────────────
  const crewMembers = [];
  let checklistState = {};
  const DB_NAME = 'TexelFormsDB';
  const STORE_NAME = 'drafts';
  const DRAFT_KEY = 'edto-draft';

  // Groups-based structure: each group has one checkbox pair
  const SECTIONS = [
    { id: 1, title: 'FLIGHT PREPARATION BRIEFING', groups: [
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
    ]},
    { id: 3, title: 'PRE-FLIGHT', groups: [
      { title: 'PRE-FLIGHT', items: [
        'Aircraft Status - Consult MEL',
        '  - RVSM Requirements',
        '  - EDTO Requirements',
        'Fuel Crossfeed Valve - i.a.w. FCOM Fuel Crossfeed Valve Check',
        'Aircraft Clocks - UTC set',
        'Flight Plan Route - Enter FPL into FMC',
        'Route Leg Winds - Insert winds',
        'EDTO Tracks and Distances - Verified and Checked'
      ]}
    ]},
    { id: 4, title: 'ENROUTE - PRIOR TO EDTO ENTRY POINT', groups: [
      { title: 'ENROUTE - PRIOR TO EDTO ENTRY POINT', items: [
        'EDTO Clearance (40 Minutes before)',
        'Weather from OCC - SATPHONE 30 minutes before',
        'APU 15 minutes before ENTRY point',
        'EDTO Significant Systems Operation',
        'FMC Position - Check',
        'FMC Route - If changed then confirm modification (CPDLC)',
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
      ]}
    ]},
    { id: 5, title: 'ENROUTE - AFTER EDTO EXIT POINT', groups: [
      { title: 'ENROUTE - AFTER EDTO EXIT POINT', items: [
        'Mach Number',
        'CDU Offset (If applied during EDTO)',
        'Cruise FL - Review',
        'FMC Position - Checked',
        'Fuel Crossfeed Valve',
        'ETL Entry - after shutdown'
      ]}
    ]},
    { id: 6, title: 'NON-NORMALS', groups: [
      { title: 'Re-Routing:', items: ['Check'] },
      { title: 'Diversion Planning:', items: ['Check'] },
      { title: 'MEL - APU Fault:', items: ['Check'] },
      { title: 'Engine Non-Normal requiring diversion:', items: ['Check'] },
      { title: 'Pressurisation Non-Normal requiring diversion:', items: ['Check'] },
      { title: 'Navigation Non-Normal:', items: ['Check'] },
      { title: 'Weather Contingency:', items: ['Check'] },
      { title: 'Non-Comms Contingency:', items: ['Check'] },
      { title: 'Other Non-Normal:', items: ['Check'] }
    ]}
  ];

  // ── Init ────────────────────────────────────────────────────────────
  async function init() {
    await loadCrew();
    await initIndexedDB();
    renderChecklist();
    initSignatures();
    initAutoSave();
    setupDateDefaults();
    await loadDraft();
  }

  // ── Crew ─────────────────────────────────────────────────────────────
  async function loadCrew() {
    try {
      const res = await fetch('/api/crew');
      const data = await res.json();
      crewMembers.length = 0;
      crewMembers.push(...data);
      const sel = document.getElementById('traineeName');
      const trainerSel = document.getElementById('trainerName');
      crewMembers.sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = `${c.name} (${c.code})`;
        opt.dataset.rank = c.position;
        opt.dataset.licence = c.licence || '';
        sel.appendChild(opt);
        // Trainer select: only SFI/SFE/TRI/TRE
        if (c.is_sfi || c.is_sfe || c.is_tri || c.is_tre) {
          const quals = [];
          if (c.is_sfi) quals.push('SFI');
          if (c.is_sfe) quals.push('SFE');
          if (c.is_tri) quals.push('TRI');
          if (c.is_tre) quals.push('TRE');
          const topt = document.createElement('option');
          topt.value = c.code;
          topt.textContent = `${c.name} (${c.code})`;
          topt.dataset.name = c.name;
          topt.dataset.quals = quals.join(',');
          trainerSel.appendChild(topt);
        }
      });
    } catch (e) {
      console.warn('Failed to load crew, using offline cache if available');
    }
  }

  window.onTraineeChange = function() {
    const sel = document.getElementById('traineeName');
    const opt = sel.options[sel.selectedIndex];
    const name = opt.textContent.split(' (')[0] || '';
    const rank = opt.dataset.rank || '';
    document.getElementById('traineeRank').value = rank;
    document.getElementById('licenceNo').value = opt.dataset.licence || '';
    document.getElementById('footerTraineeName').value = name;
    document.getElementById('footerTraineeRank').value = rank;
  };

  window.onTrainerChange = function() {
    const sel = document.getElementById('trainerName');
    const opt = sel.options[sel.selectedIndex];
    window._trainerCode = opt ? opt.value : '';
    window._trainerFullName = opt && opt.dataset.name ? opt.dataset.name : '';
  };

  window.getTrainerCode = function() {
    return window._trainerCode || '';
  };

  // ── IndexedDB ────────────────────────────────────────────────────────
  let db;
  function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        e.target.result.createObjectStore(STORE_NAME);
      };
      req.onsuccess = (e) => { db = e.target.result; resolve(); };
      req.onerror = (e) => reject(e);
    });
  }

  function dbPut(key, value) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e);
    });
  }

  function dbGet(key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e);
    });
  }

  // ── Render Checklist ────────────────────────────────────────────────
  function renderChecklist() {
    SECTIONS.forEach(sec => {
      const container = document.getElementById(`section-${sec.id}`);
      if (!sec.groups) return;
      sec.groups.forEach((group, gIdx) => {
        const key = `s${sec.id}-g${gIdx}`;  // Group key: s1-g0, s1-g1, etc.
        if (!checklistState[key]) checklistState[key] = '';

        const row = document.createElement('div');
        row.style.borderBottom = '1px solid #1a3a5f';
        row.innerHTML = `
          <div class="checklist-item">
            <span class="checklist-text"><strong>${escapeHtml(group.title)}</strong></span>
            <div class="checklist-actions">
              <button class="btn-check pass ${checklistState[key]==='pass'?'active':''}" onclick="setCheck('${key}','pass')">✅ Completed</button>
              <button class="btn-check fail ${checklistState[key]==='fail'?'active':''}" onclick="setCheck('${key}','fail')">❌ Redo</button>
            </div>
          </div>
          <div class="group-items">${group.items.map(i => `<div class="sub-item">\u25B8 ${escapeHtml(i)}</div>`).join('')}</div>
        `;
        container.appendChild(row);
      });
    });
    updateProgressAll();
  }

  window.setCheck = function(key, val) {
    checklistState[key] = checklistState[key] === val ? '' : val;
    document.querySelectorAll(`button[onclick*="'${key}'"]`).forEach(btn => {
      if (btn.classList.contains('pass') || btn.classList.contains('fail')) {
        btn.classList.remove('active');
      }
    });
    if (checklistState[key]) {
      const btn = document.querySelector(`button[onclick="setCheck('${key}','${val}')"]`);
      if (btn) btn.classList.add('active');
    }
    updateProgressAll();
  };

  function updateProgressAll() {
    SECTIONS.forEach(sec => {
      if (!sec.groups) return;
      let done = 0;
      sec.groups.forEach((_, gIdx) => {
        if (checklistState[`s${sec.id}-g${gIdx}`]) done++;
      });
      const el = document.getElementById(`progress-${sec.id}`);
      if (el) el.textContent = `${done}/${sec.groups.length}`;
    });
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ── Signatures ─────────────────────────────────────────────────────
  function initSignatures() {
    ['trainerSig','traineeSig'].forEach(id => initCanvas(id));
  }

  function initCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    let drawing = false;
    let last = null;

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    }

    function start(e) {
      e.preventDefault();
      drawing = true;
      last = getPos(e);
    }
    function move(e) {
      e.preventDefault();
      if (!drawing) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      last = pos;
    }
    function end() { drawing = false; }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, {passive:false});
    canvas.addEventListener('touchmove', move, {passive:false});
    canvas.addEventListener('touchend', end);
  }

  window.clearSig = function(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  function getSignatureData(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return '';
    // Check if empty
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let empty = true;
    for (let i = 3; i < imgData.data.length; i += 4) {
      if (imgData.data[i] > 0) { empty = false; break; }
    }
    return empty ? '' : canvas.toDataURL('image/png');
  }

  // ── Auto-save / Draft ───────────────────────────────────────────────
  function initAutoSave() {
    setInterval(saveDraft, 30000);
  }

  async function saveDraft() {
    try {
      if (!db) { alert('Database not ready. Please try again.'); return; }
      const draft = collectFormData(false);
      await dbPut(DRAFT_KEY, draft);
      const ind = document.getElementById('draftIndicator');
      ind.classList.add('visible');
      setTimeout(() => ind.classList.remove('visible'), 2000);
    } catch(e) {
      console.error('Save draft error:', e);
      alert('Could not save draft: ' + e.message);
    }
  }

  window.saveDraft = saveDraft;

  async function loadDraft() {
    try {
      const draft = await dbGet(DRAFT_KEY);
      if (!draft) return;
      if (draft.traineeCode) {
        document.getElementById('traineeName').value = draft.traineeCode;
        onTraineeChange();
      }
      if (draft.simRegistration) document.getElementById('simRegistration').value = draft.simRegistration;
      if (draft.sessionType) document.getElementById('sessionType').value = draft.sessionType;
      if (draft.date) document.getElementById('formDate').value = draft.date;
      if (draft.edtoExpiry) document.getElementById('edtoExpiry').value = draft.edtoExpiry;
      if (draft.location) document.getElementById('location').value = draft.location;
      if (draft.licenceNo) document.getElementById('licenceNo').value = draft.licenceNo;
      if (draft.trainerName) document.getElementById('trainerName').value = draft.trainerName;
      if (draft.footerTraineeName) document.getElementById('footerTraineeName').value = draft.footerTraineeName;
      if (draft.generalComments) document.getElementById('generalComments').value = draft.generalComments;
      if (draft.instructorComments) document.getElementById('instructorComments').value = draft.instructorComments;
      if (draft.preparedDate) document.getElementById('preparedDate').value = draft.preparedDate;
      if (draft.checklist) {
        checklistState = { ...draft.checklist };
        Object.keys(checklistState).forEach(key => {
          if (checklistState[key]) {
            document.querySelectorAll(`button[onclick*="'${key}'"]`).forEach(btn => {
              if (btn.classList.contains('pass') || btn.classList.contains('fail')) {
                btn.classList.remove('active');
              }
            });
            const btn = document.querySelector(`button[onclick="setCheck('${key}','${checklistState[key]}')"]`);
            if (btn) btn.classList.add('active');
          }
        });
        updateProgressAll();
      }
      if (draft.itemSignatures) {
        itemSignatures = { ...draft.itemSignatures };
        Object.keys(itemSignatures).forEach(key => {
          const sigs = itemSignatures[key];
          if (sigs.trainer || sigs.trainee) {
            const btn = document.getElementById(`btn-sig-${key}`);
            if (btn) btn.classList.add('active');
          }
        });
      }
      if (draft.preparedBy) document.getElementById('preparedBy').value = draft.preparedBy;
    } catch (e) { console.warn('Could not load draft', e); }
  }

  // ── Date defaults ──────────────────────────────────────────────────
  function setupDateDefaults() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('formDate').value = today;
    // EDTO expiry: 6 months from today as a sensible default
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 6);
    document.getElementById('edtoExpiry').value = expiry.toISOString().split('T')[0];
  }

  // ── Collect data ────────────────────────────────────────────────────
  function collectFormData(includeSigs = true) {
    const sel = document.getElementById('traineeName');
    const opt = sel.options[sel.selectedIndex];
    return {
      traineeCode: sel.value,
      traineeName: opt ? opt.textContent.split(' (')[0] : '',
      traineeRank: document.getElementById('traineeRank').value,
      licenceNo: document.getElementById('licenceNo').value,
      simRegistration: document.getElementById('simRegistration').value,
      sessionType: document.getElementById('sessionType').value,
      date: document.getElementById('formDate').value,
      edtoExpiry: document.getElementById('edtoExpiry').value,
      location: document.getElementById('location').value,
      checklist: { ...checklistState },
      trainerName: window._trainerFullName || document.getElementById('trainerName').value,
      trainerCode: window._trainerCode || '',
      trainerSignature: includeSigs ? getSignatureData('trainerSig') : '',
      traineeSignature: includeSigs ? getSignatureData('traineeSig') : '',
      footerTraineeName: document.getElementById('footerTraineeName').value,
      generalComments: document.getElementById('generalComments').value,
      instructorComments: document.getElementById('instructorComments')?.value || '',
      preparedBy: document.getElementById('preparedBy').value,
      preparedDate: document.getElementById('preparedDate')?.value || ''
    };
  }

  // ── Validation ─────────────────────────────────────────────────────
  function validate(data) {
    if (!data.traineeCode) return 'Please select a trainee.';
    if (!data.sessionType) return 'Please select session type.';
    if (!data.date) return 'Please select a date.';
    if (!data.trainerName) return 'Please enter trainer name.';
    if (!data.trainerSignature) return 'Please add trainer signature.';
    if (!data.traineeSignature) return 'Please add trainee signature.';
    // At least one checklist item filled
    const filled = Object.values(data.checklist).filter(v => v).length;
    if (filled === 0) return 'Please complete at least one checklist item.';
    return '';
  }

  // ── PDF Generation ──────────────────────────────────────────────────
  
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
    const COL_3LC = 200;      // Trainer Texel 3LC
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
    doc.text('EDTO Validity Expiry:', 140, ry);
    doc.line(165, ry + 1, PAGE_W - M - 2, ry + 1);
    if (data.edtoExpiry) { doc.setFont('helvetica', 'bold'); doc.text(data.edtoExpiry, 166, ry); doc.setFont('helvetica', 'normal'); }
    
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
    
    // ═══ DRAW SECTION WITH GROUPS (each group has its own checkboxes) ═══
    function drawSection(title, groups, secId) {
      if (!groups || groups.length === 0) return;
      checkPage(10);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(title, M + 2, y);
      y += 6;
      
      groups.forEach((group, gIdx) => {
        checkPage(8);
        const gKey = 's' + secId + '-g' + gIdx;
        const gStatus = data.checklist ? data.checklist[gKey] : '';
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(group.title, M + 4, y + 1);
        
        drawCheckbox(COL_CHK, gStatus === 'pass');
        drawCheckbox(COL_REDO, gStatus === 'fail');
        
        // NON-NORMALS (secId=6): only show sig/3LC on fail; others: always
        const isNonNormal = secId === 6;
        const showSigs = !isNonNormal || gStatus === 'fail';
        if (showSigs && (data.trainerSignature || data.trainerCode)) {
          if (data.trainerSignature && data.trainerSignature.startsWith('data:')) {
            try {
              doc.addImage(data.trainerSignature, 'PNG', COL_SIG, y - 3, 12, 5);
            } catch(e) {}
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
        group.items.forEach(item => {
          checkPage(4);
          const isSub = item.startsWith('  ');
          const indent = isSub ? M + 10 : M + 4;
          doc.text('\u25B8 ' + item.trim(), indent, y + 1);
          y += 4;
        });
        
        y += 2;
      });
    }
    
    // ═══ FLAT SECTION (ONE checkbox pair for entire section) ═══
    function drawFlatSection(title, items, secId) {
      if (!items || items.length === 0) return;
      checkPage(15);
      
      const sKey = 's' + secId;
      const sStatus = data.checklist ? data.checklist[sKey] : '';
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(title, M + 2, y);
      
      drawCheckbox(COL_CHK, sStatus === 'pass');
      drawCheckbox(COL_REDO, sStatus === 'fail');
      
      y += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      items.forEach(item => {
        checkPage(4);
        const isSubSub = item.startsWith('    ');
        const isSub = !isSubSub && item.startsWith('  ');
        const indent = isSubSub ? M + 14 : (isSub ? M + 10 : M + 4);
        const bullet = isSubSub ? '\u25CB ' : '\u25B8 ';
        doc.text(bullet + item.trim(), indent, y + 1);
        y += 4;
      });
      
      y += 3;
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
    
    drawFlatSection('PRE-FLIGHT', [
      'Aircraft Status',
      '  Consult MEL',
      '    RVSM Requirements',
      '    EDTO Requirements',
      'Fuel Crossfeed Valve - i.a.w. FCOM Fuel Crossfeed Valve Check',
      'Aircraft Clocks - UTC set',
      'Flight Plan Route - Enter FPL into FMC',
      'Route Leg Winds - Insert winds',
      'EDTO Tracks and Distances - Verified and Checked'
    ], 3);
    
    drawFlatSection('ENROUTE - PRIOR TO EDTO ENTRY POINT', [
      'EDTO Clearance (40 Minutes before)',
      'Weather from OCC - SATPHONE 30 minutes before',
      'APU 15 minutes before ENTRY point',
      'EDTO Significant Systems Operation',
      'FMC Position - Check',
      'FMC Route - If changed then confirm modification (CPDLC)',
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
    checkPage(120);
    
    drawFlatSection('ENROUTE - AFTER EDTO EXIT POINT', [
      'Mach Number',
      'CDU Offset (If applied during EDTO)',
      'Cruise FL - Review',
      'FMC Position - Checked',
      'Fuel Crossfeed Valve',
      'ETL Entry - after shutdown'
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
    doc.line(M + 28, y + 1, 75, y + 1);
    if (data.footerTraineeName || data.traineeName) { doc.setFont('helvetica', 'bold'); doc.text(data.footerTraineeName || data.traineeName, M + 29, y); doc.setFont('helvetica', 'normal'); }
    doc.setFont('helvetica', 'normal');
    doc.text('RANK:', 85, y);
    doc.line(97, y + 1, 125, y + 1);
    if (data.traineeRank) { doc.setFont('helvetica', 'bold'); doc.text(data.traineeRank, 98, y); doc.setFont('helvetica', 'normal'); }
    doc.text('Trainee Signature:', 85, y);
    if (data.traineeSignature && data.traineeSignature.startsWith('data:')) {
      try { doc.addImage(data.traineeSignature, 'PNG', 110, y - 6, 45, 10); } catch(e) {}
    }
    y += 15;
    
    // ═══ GENERAL COMMENTS ═══
    checkPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    if (data.preparedBy) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(data.preparedBy, M + 2, y); }
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

  // ── Preview & Submit ───────────────────────────────────────────────
  let currentPDFData = null;

  window.previewPDF = async function() {
    const data = collectFormData(true);
    const err = validate(data);
    const valMsg = document.getElementById('validationMsg');
    if (err) {
      valMsg.textContent = err;
      valMsg.classList.add('visible');
      return;
    }
    valMsg.classList.remove('visible');

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
      if (!window.jspdf) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      }
      const pdfBase64 = await generatePDF(data);
      currentPDFData = { ...data, pdfBase64 };

      // Show preview
      if (pdfBase64 && pdfBase64.startsWith('data:')) {
        const byteString = atob(pdfBase64.split(',')[1]);
        const mimeString = 'application/pdf';
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) { ia[i] = byteString.charCodeAt(i); }
        const blob = new Blob([ab], { type: mimeString });
        const url = URL.createObjectURL(blob);
        const container = document.getElementById('previewContainer');
        container.innerHTML = '<embed src="' + url + '" type="application/pdf" width="100%" height="100%">';
        document.getElementById('previewModal').classList.add('visible');
      } else {
        throw new Error('PDF generation failed - empty result');
      }
    } catch (e) {
      console.error('PDF generation failed:', e);
      alert('PDF generation failed: ' + e.message + '. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Preview PDF';
    }
  };

  window.closePreview = function() {
    document.getElementById('previewModal').classList.remove('visible');
    document.getElementById('previewFrame').src = '';
  };

  window.sendForm = async function() {
    if (!currentPDFData) return;
    const btn = document.getElementById('sendBtn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const res = await fetch('/api/forms/edto/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPDFData)
      });
      const result = await res.json();
      if (result.success) {
        document.getElementById('previewModal').classList.remove('visible');
        document.getElementById('successModal').classList.add('visible');
        await dbPut(DRAFT_KEY, null);
        currentPDFData = null;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (e) {
      alert('Submit failed: ' + e.message);
      console.error(e);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Form';
    }
  };

  window.closeModal = function() {
    document.getElementById('successModal').classList.remove('visible');
    window.location.href = '/';
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ── Start ───────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
