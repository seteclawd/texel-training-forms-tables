(function() {
  'use strict';

  // ── Data ────────────────────────────────────────────────────────────
  const crewMembers = [];
  let checklistState = {};
  let itemSignatures = {}; // { key: { trainer: '', trainee: '' } }
  const DB_NAME = 'TexelFormsDB';
  const STORE_NAME = 'drafts';
  const DRAFT_KEY = 'edto-draft';

  const SECTIONS = [
    { id: 1, title: 'FLIGHT PREPARATION BRIEFING', items: [
      'Route Briefing Contents (TAFS, METARs, NOTAMS, SIG WX, Flight Plan, Waypoints, No-Go Areas)'
    ]},
    { id: 2, title: 'ROUTE BRIEFING', items: [
      'TAFS \u0026 METARs for destination, alternates \u0026 ERAs',
      'NOTAMS for destination, Alternates and ERAs and route',
      'SIG WX \u0026 Upper Wind Charts',
      'SIGMETS',
      'Flight Plan: Check Flt No, Date, Route \u0026 A/C Registration',
      'Note Max FL, average W/C and Max Shear',
      'Note Trip fuel and flight time',
      'Note Critical Fuel - Calculate diversion fuel from critical point to diversion airfield',
      'Note TOTAL FUEL FD Pro',
      'Route/Waypoints: Insert OFP Route',
      'Create and insert ENTRY and EXIT waypoints on FD Pro',
      'Verify EDTO waypoints (incl. EDTO Entry and Exit points)',
      'Create and insert ETPs on FD Pro',
      'No-Go Areas'
    ]},
    { id: 3, title: 'PRE-FLIGHT', items: [
      'Aircraft Status / MEL / RVSM Requirements / EDTO Requirements',
      'Fuel Crossfeed Valve (FCOM check)',
      'Aircraft Clocks - UTC set',
      'Flight Plan Route - Enter FPL into FMC',
      'Route Leg Winds - Insert winds',
      'EDTO Tracks and Distances - Verified and Checked'
    ]},
    { id: 4, title: 'ENROUTE - PRIOR TO EDTO ENTRY POINT', items: [
      'EDTO Clearance (40 Minutes before)',
      'Weather from OCC - SATPHONE 30 minutes before',
      'APU 15 minutes before ENTRY point',
      'EDTO Significant Systems Operation',
      'FMC Position - Check',
      'FMC Route - If changed confirm modification (CPDLC)',
      'CDU FIX page - adequate AD 428nm ARCs',
      'Flight Level and Mach Number - as cleared',
      'HF and SELCAL - Checked',
      'Radios and Transponder',
      'Approaching Waypoints TRK and DIST',
      'Passing Each Waypoint Actual Track',
      'Position Report - 10 Minutes after passing waypoint',
      'Midpoint Check winds and times',
      'ETP CDU FIX page - updated'
    ]},
    { id: 5, title: 'ENROUTE - AFTER EDTO EXIT POINT', items: [
      'Mach Number',
      'CDU Offset (If applied during EDTO)',
      'Cruise FL - Review',
      'FMC Position - Checked',
      'Fuel Crossfeed Valve',
      'ETL Entry - after shutdown'
    ]},
    { id: 6, title: 'NON-NORMALS', items: [
      'Re-Routing',
      'Diversion Planning',
      'MEL - APU Fault',
      'Engine Non-Normal requiring diversion',
      'Pressurisation Non-Normal requiring diversion',
      'Navigation Non-Normal',
      'Weather Contingency',
      'Non-Comms Contingency',
      'Other Non-Normal'
    ]}
  ];

  // ── Init ────────────────────────────────────────────────────────────
  async function init() {
    await loadCrew();
    await initIndexedDB();
    renderChecklist();
    initSignatures();
    initAllItemSigs();
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
      crewMembers.sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = `${c.name} (${c.code})`;
        opt.dataset.rank = c.position;
        opt.dataset.licence = c.licence || '';
        sel.appendChild(opt);
      });
    } catch (e) {
      console.warn('Failed to load crew, using offline cache if available');
    }
  }

  window.onTraineeChange = function() {
    const sel = document.getElementById('traineeName');
    const opt = sel.options[sel.selectedIndex];
    document.getElementById('traineeRank').value = opt.dataset.rank || '';
    document.getElementById('licenceNo').value = opt.dataset.licence || '';
    document.getElementById('footerTraineeName').value = opt.textContent.split(' (')[0] || '';
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
      sec.items.forEach((item, idx) => {
        const key = `s${sec.id}-i${idx}`;
        if (!checklistState[key]) checklistState[key] = '';
        if (!itemSignatures[key]) itemSignatures[key] = { trainer: '', trainee: '' };

        const row = document.createElement('div');
        row.style.borderBottom = '1px solid #1a3a5f';
        row.innerHTML = `
          <div class="checklist-item">
            <span class="checklist-text">${escapeHtml(item)}</span>
            <div class="checklist-actions">
              <button class="btn-check pass ${checklistState[key]==='pass'?'active':''}" onclick="setCheck('${key}','pass')">✅ Completed</button>
              <button class="btn-check fail ${checklistState[key]==='fail'?'active':''}" onclick="setCheck('${key}','fail')">❌ Redo</button>
              <button class="btn-toggle-sigs ${itemSignatures[key].trainer || itemSignatures[key].trainee ? 'active' : ''}" id="btn-sig-${key}" onclick="toggleItemSigs('${key}')">✍️ Sigs</button>
            </div>
          </div>
          <div class="item-sigs" id="sigs-${key}">
            <div class="sig-pair">
              <div class="sig-mini-wrap">
                <label>Trainer</label>
                <canvas id="sig-tr-${key}" class="sig-mini" width="200" height="60"></canvas>
                <button class="btn-clear-mini" onclick="clearSig('sig-tr-${key}')">Clear</button>
              </div>
              <div class="sig-mini-wrap">
                <label>Trainee</label>
                <canvas id="sig-tt-${key}" class="sig-mini" width="200" height="60"></canvas>
                <button class="btn-clear-mini" onclick="clearSig('sig-tt-${key}')">Clear</button>
              </div>
            </div>
          </div>
        `;
        container.appendChild(row);
      });
    });
    updateProgressAll();
  }

  window.toggleItemSigs = function(key) {
    const el = document.getElementById(`sigs-${key}`);
    const btn = document.getElementById(`btn-sig-${key}`);
    if (el.classList.contains('visible')) {
      el.classList.remove('visible');
      btn.classList.remove('active');
    } else {
      el.classList.add('visible');
      btn.classList.add('active');
      // Ensure canvases are initialized
      initItemCanvas(`sig-tr-${key}`);
      initItemCanvas(`sig-tt-${key}`);
    }
  };

  function initAllItemSigs() {
    // Canvases are initialized lazily on toggle
  }

  function initItemCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas || canvas.dataset.inited) return;
    canvas.dataset.inited = '1';
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
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
      let done = 0;
      sec.items.forEach((_, idx) => {
        if (checklistState[`s${sec.id}-i${idx}`]) done++;
      });
      const el = document.getElementById(`progress-${sec.id}`);
      if (el) el.textContent = `${done}/${sec.items.length}`;
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
    const draft = collectFormData(false);
    await dbPut(DRAFT_KEY, draft);
    const ind = document.getElementById('draftIndicator');
    ind.classList.add('visible');
    setTimeout(() => ind.classList.remove('visible'), 2000);
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
    // Collect per-item signatures
    const itemSigs = {};
    if (includeSigs) {
      Object.keys(itemSignatures).forEach(key => {
        const tr = getSignatureData(`sig-tr-${key}`);
        const tt = getSignatureData(`sig-tt-${key}`);
        itemSigs[key] = { trainer: tr, trainee: tt };
      });
    } else {
      Object.keys(itemSignatures).forEach(key => {
        itemSigs[key] = { ...itemSignatures[key] };
      });
    }
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
      itemSignatures: itemSigs,
      trainerName: document.getElementById('trainerName').value,
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
