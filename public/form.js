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
    { id: 1, title: '1. FLIGHT PREPARATION BRIEFING', groups: [
      { title: '1.1 Route Briefing Contents:', num: '', items: [
        { t: 'TAFS & METARS for destination, alternates & ERAs', n: 'a' },
        { t: 'NOTAMS for destination, Alternates and ERAs and route', n: 'b' },
        { t: 'SIG WX & Upper Wind Charts', n: 'c' },
        { t: 'SIGMETS', n: 'd' }
      ]},
      { title: '1.2 Flight Plan:', num: '', items: [
        { t: 'Check Flt No. Date, Route & A/C Registration', n: 'a' },
        { t: 'Note - Max FL, average W/C and Max Shear', n: 'b' },
        { t: 'Note - Trip fuel and flight time', n: 'c' },
        { t: 'Note - Critical Fuel - Calculate diversion fuel', n: 'd' },
        { t: 'Note - TOTAL FUEL', n: 'e' }
      ]},
      { title: '1.3 FD Pro Route/Waypoints:', num: '', items: [
        { t: 'Insert OFP Route', n: 'a' },
        { t: 'Create and insert ENTRY and EXIT waypoints', n: 'b' },
        { t: 'Verify EDTO waypoints (incl. EDTO Entry and Exit points)', n: 'c' },
        { t: 'Create and insert ETPs (as required)', n: 'd' },
        { t: 'No-Go Areas', n: 'e' }
      ]}
    ]},
    { id: 3, title: '2. PRE-FLIGHT', groups: null, items: [
      { t: 'Aircraft Status', n: '2.1', sub: [
        { t: 'Consult MEL', n: '1', sub: [
          { t: 'RVSM Requirements', n: 'a' },
          { t: 'EDTO Requirements', n: 'b' }
        ]}
      ]},
      { t: 'Fuel Crossfeed Valve - i.a.w. FCOM Fuel Crossfeed Valve Check', n: '2.2' },
      { t: 'Aircraft Clocks - UTC set', n: '2.3' },
      { t: 'Flight Plan Route - Enter FPL into FMC', n: '2.4' },
      { t: 'Route Leg Winds - Insert winds', n: '2.5' },
      { t: 'EDTO Tracks and Distances - Verified and Checked', n: '2.6' }
    ]},
    { id: 4, title: '3. ENROUTE - PRIOR TO EDTO ENTRY POINT', groups: null, items: [
      { t: 'EDTO Clearance (40 Minutes before)', n: '3.1' },
      { t: 'Weather from OCC - SATPHONE 30 minutes before', n: '3.2' },
      { t: 'APU 15 minutes before ENTRY point', n: '3.3' },
      { t: 'EDTO Significant Systems Operation', n: '3.4' },
      { t: 'FMC Position - Check', n: '3.5' },
      { t: 'FMC Route - If changed then confirm modification (CPDLC)', n: '3.6' },
      { t: 'CDU FIX page - adequate AD 428nm ARCs', n: '3.7' },
      { t: 'Flight Level and Mach Number - as cleared', n: '3.8' },
      { t: 'HF and SELCAL - Checked', n: '3.9' },
      { t: 'Radios and Transponder', n: '3.10' },
      { t: 'Approaching Waypoints TRK and DIST', n: '3.11' },
      { t: 'Passing Each Waypoint Actual Track', n: '3.12' },
      { t: 'Position Report', n: '3.13' },
      { t: '10 Minute after passing waypoint', n: '3.14' },
      { t: 'Midpoint Check winds and times', n: '3.15' },
      { t: 'ETP CDU FIX page - updated', n: '3.16' }
    ]},
    { id: 5, title: '4. ENROUTE - AFTER EDTO EXIT POINT', groups: null, items: [
      { t: 'Mach Number', n: '4.1' },
      { t: 'CDU Offset (If applied during EDTO)', n: '4.2' },
      { t: 'Cruise FL - Review', n: '4.3' },
      { t: 'FMC Position - Checked', n: '4.4' },
      { t: 'Fuel Crossfeed Valve', n: '4.5' },
      { t: 'ETL Entry - after shutdown', n: '4.6' }
    ]},
    { id: 6, title: '5. NON-NORMALS', groups: null, items: [
      { t: 'Re-Routing', n: '5.1', check: true },
      { t: 'Diversion Planning', n: '5.2', check: true },
      { t: 'MEL - APU Fault', n: '5.3', check: true },
      { t: 'Engine Non-Normal requiring diversion', n: '5.4', check: true },
      { t: 'Pressurisation Non-Normal requiring diversion', n: '5.5', check: true },
      { t: 'Navigation Non-Normal', n: '5.6', check: true },
      { t: 'Weather Contingency', n: '5.7', check: true },
      { t: 'Non-Comms Contingency', n: '5.8', check: true },
      { t: 'Other Non-Normal', n: '5.9', check: true }
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
      if (!container) return;
      
      // FLAT sections with individual checkboxes per item (NON-NORMALS)
      if (sec.items && sec.items[0] && sec.items[0].check) {
        sec.items.forEach((item, iIdx) => {
          const key = `s${sec.id}-i${iIdx}`;
          if (!checklistState[key]) checklistState[key] = '';
          const row = document.createElement('div');
          row.style.borderBottom = '1px solid #1a3a5f';
          row.innerHTML = `
            <div class="checklist-item">
              <span class="checklist-text">${item.n}. ${escapeHtml(item.t)}</span>
              <div class="checklist-actions">
                <button class="btn-check pass ${checklistState[key]==='pass'?'active':''}" onclick="setCheck('${key}','pass')">✅ Completed</button>
                <button class="btn-check fail ${checklistState[key]==='fail'?'active':''}" onclick="setCheck('${key}','fail')">❌ Redo</button>
              </div>
            </div>
          `;
          container.appendChild(row);
        });
        return;
      }
      
      // FLAT sections with ONE checkbox (PRE-FLIGHT, ENROUTE)
      if (sec.items && !sec.groups) {
        const key = `s${sec.id}-all`;
        if (!checklistState[key]) checklistState[key] = '';
        const row = document.createElement('div');
        row.style.borderBottom = '1px solid #1a3a5f';
        let itemsHtml = '';
        function renderItem(item, depth) {
          const num = item.n || '';
          const text = item.t || item;
          const indent = depth > 0 ? 'padding-left: ' + (depth * 20) + 'px;' : '';
          itemsHtml += `<div class="sub-item" style="${indent}">${num ? num + ' ' : '\u25B8 '}${escapeHtml(text)}</div>`;
          if (item.sub) item.sub.forEach(sub => renderItem(sub, depth + 1));
        }
        sec.items.forEach(item => renderItem(item, 0));
        row.innerHTML = `
          <div class="checklist-item">
            <span class="checklist-text"><strong>${escapeHtml(sec.title)}</strong></span>
            <div class="checklist-actions">
              <button class="btn-check pass ${checklistState[key]==='pass'?'active':''}" onclick="setCheck('${key}','pass')">✅ Completed</button>
              <button class="btn-check fail ${checklistState[key]==='fail'?'active':''}" onclick="setCheck('${key}','fail')">❌ Redo</button>
            </div>
          </div>
          <div class="group-items">${itemsHtml}</div>
        `;
        container.appendChild(row);
        return;
      }
      
      // GROUP sections (FLIGHT PREP)
      if (!sec.groups) return;
      sec.groups.forEach((group, gIdx) => {
        const key = `s${sec.id}-g${gIdx}`;
        if (!checklistState[key]) checklistState[key] = '';
        const row = document.createElement('div');
        row.style.borderBottom = '1px solid #1a3a5f';
        let itemsHtml = '';
        if (group.items && group.items[0] && typeof group.items[0] === 'object') {
          // Numbered items
          const secNum = sec.id === 1 ? '1' : String(sec.id - 1);
          group.items.forEach(item => {
            itemsHtml += `<div class="sub-item">${item.n} ${escapeHtml(item.t)}</div>`;
          });
        } else {
          // Legacy string items
          group.items.forEach(i => {
            itemsHtml += `<div class="sub-item">\u25B8 ${escapeHtml(i)}</div>`;
          });
        }
        row.innerHTML = `
          <div class="checklist-item">
            <span class="checklist-text"><strong>${group.num ? group.num + ' ' : ''}${escapeHtml(group.title)}</strong></span>
            <div class="checklist-actions">
              <button class="btn-check pass ${checklistState[key]==='pass'?'active':''}" onclick="setCheck('${key}','pass')">✅ Completed</button>
              <button class="btn-check fail ${checklistState[key]==='fail'?'active':''}" onclick="setCheck('${key}','fail')">❌ Redo</button>
            </div>
          </div>
          <div class="group-items">${itemsHtml}</div>
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
      const el = document.getElementById(`progress-${sec.id}`);
      if (!el) return;
      let total = 0, done = 0;
      if (sec.groups) {
        total = sec.groups.length;
        sec.groups.forEach((_, gIdx) => { if (checklistState[`s${sec.id}-g${gIdx}`]) done++; });
      } else if (sec.items && sec.items[0] && sec.items[0].check) {
        total = sec.items.length;
        sec.items.forEach((_, iIdx) => { if (checklistState[`s${sec.id}-i${iIdx}`]) done++; });
      } else if (sec.items) {
        total = 1;
        if (checklistState[`s${sec.id}-all`]) done = 1;
      }
      el.textContent = `${done}/${total}`;
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
      const btn = document.querySelector('.btn-draft');
      btn.classList.add('saving');
      btn.textContent = '✓ Saved!';
      const draft = collectFormData(false);
      await dbPut(DRAFT_KEY, draft);
      const ind = document.getElementById('draftIndicator');
      ind.classList.add('visible');
      setTimeout(() => {
        ind.classList.remove('visible');
        btn.classList.remove('saving');
        btn.textContent = 'Save Draft';
      }, 2000);
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
  }}

  // ── Preview & Submit ───────────────────────────────────────────────
  let currentPDFData = null;

  window.previewPDF = async function() { console.log("previewPDF called");
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
        await loadScript('/vendor/jspdf.umd.min.js'); console.log('jsPDF loaded:', typeof window.jspdf);
      }
      const pdfBase64 = await generatePDF(data); console.log("PDF generated, length:", (pdfBase64||"").length);
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
      alert('PDF error: ' + e.message + ' | Stack: ' + (e.stack || '').substring(0, 200));
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
