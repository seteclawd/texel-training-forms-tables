(function() {
  'use strict';

  // ── Data ────────────────────────────────────────────────────────────
  const crewMembers = [];
  let checklistState = {};
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
        const row = document.createElement('div');
        row.className = 'checklist-item';
        row.innerHTML = `
          <span class="checklist-text">${escapeHtml(item)}</span>
          <div class="checklist-actions">
            <button class="btn-check pass ${checklistState[key]==='pass'?'active':''}" onclick="setCheck('${key}','pass')">✅ Completed</button>
            <button class="btn-check fail ${checklistState[key]==='fail'?'active':''}" onclick="setCheck('${key}','fail')">❌ Redo</button>
          </div>
        `;
        container.appendChild(row);
      });
    });
    updateProgressAll();
  }

  window.setCheck = function(key, val) {
    checklistState[key] = checklistState[key] === val ? '' : val;
    document.querySelectorAll(`button[onclick*="'${key}'"]`).forEach(btn => {
      btn.classList.remove('active');
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
      if (draft.checklist) {
        checklistState = { ...draft.checklist };
        Object.keys(checklistState).forEach(key => {
          if (checklistState[key]) {
            document.querySelectorAll(`button[onclick*="'${key}'"]`).forEach(btn => btn.classList.remove('active'));
            const btn = document.querySelector(`button[onclick="setCheck('${key}','${checklistState[key]}')"]`);
            if (btn) btn.classList.add('active');
          }
        });
        updateProgressAll();
      }
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
      trainerName: document.getElementById('trainerName').value,
      trainerSignature: includeSigs ? getSignatureData('trainerSig') : '',
      traineeSignature: includeSigs ? getSignatureData('traineeSig') : '',
      footerTraineeName: document.getElementById('footerTraineeName').value,
      generalComments: document.getElementById('generalComments').value
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
    let y = 10;
    const lineH = 6;
    function addLine(text, opts = {}) {
      doc.setFontSize(opts.size || 10);
      doc.setFont(opts.bold ? 'helvetica' : 'helvetica', opts.bold ? 'bold' : 'normal');
      doc.text(text, opts.indent ? 20 : 10, y);
      y += lineH;
      if (y > 280) { doc.addPage(); y = 10; }
    }
    function addH(text) {
      doc.setFillColor(200,220,240);
      doc.rect(8, y-4, 194, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(text, 10, y);
      y += 8;
    }

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('B737 – EDTO/ETOPS TRAINING FORM', 105, y, { align: 'center' });
    y += 10;
    doc.setFontSize(9);
    doc.text('Form: TA-TD-20 | Rev: 04 | Date: 11-12-2025', 105, y, { align: 'center' });
    y += 12;

    // Details
    addH('Trainee and Simulator Details');
    addLine(`Trainee: ${data.traineeName} (${data.traineeCode})`);
    addLine(`Rank: ${data.traineeRank}`);
    addLine(`Licence No: ${data.licenceNo}`);
    addLine(`Sim Registration: ${data.simRegistration}`);
    addLine(`Session Type: ${data.sessionType}`);
    addLine(`Date: ${data.date}`);
    addLine(`EDTO Validity Expiry: ${data.edtoExpiry}`);
    addLine(`Location: ${data.location}`);
    y += 4;

    // Checklist sections
    SECTIONS.forEach(sec => {
      addH(`${sec.id}. ${sec.title}`);
      sec.items.forEach((item, idx) => {
        const key = `s${sec.id}-i${idx}`;
        const val = data.checklist[key];
        const mark = val === 'pass' ? '✓' : val === 'fail' ? '✗' : '○';
        addLine(`${mark} ${item}`, { indent: true });
      });
      y += 2;
    });

    // Comments
    addH('General Comments');
    const comments = data.generalComments || 'None';
    const lines = doc.splitTextToSize(comments, 180);
    lines.forEach(l => addLine(l));
    y += 4;

    // Signatures
    addH('Signatures');
    if (data.trainerSignature) {
      doc.addImage(data.trainerSignature, 'PNG', 10, y, 60, 20);
    }
    doc.text(`Trainer: ${data.trainerName}`, 80, y+10);
    y += 24;
    if (data.traineeSignature) {
      doc.addImage(data.traineeSignature, 'PNG', 10, y, 60, 20);
    }
    doc.text(`Trainee: ${data.footerTraineeName || data.traineeName}`, 80, y+10);
    y += 24;
    doc.text(`Date: ${data.date}`, 10, y);

    return doc.output('datauristring');
  }

  // ── Submit ───────────────────────────────────────────────────────────
  window.submitForm = async function() {
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
    btn.textContent = 'Submitting...';

    try {
      // Load jsPDF from CDN dynamically if not loaded
      if (!window.jspdf) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      }
      const pdfBase64 = await generatePDF(data);
      data.pdfBase64 = pdfBase64;

      const res = await fetch('/api/forms/edto/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        document.getElementById('successModal').classList.add('visible');
        // Clear draft
        await dbPut(DRAFT_KEY, null);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (e) {
      alert('Submit failed: ' + e.message);
      console.error(e);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit Form';
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
