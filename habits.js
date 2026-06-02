// --- ESTADO GLOBAL Y CARGA DE DATOS ---
let habits = JSON.parse(localStorage.getItem('habits') || '[]');
let currentHabitId = null;        // en lugar de índice, guardamos id
let selectedDate = new Date().toISOString().split('T')[0];
let activeSheet = null;
let previousSheet = null;
let zCounter = 1000;
let ignoreNextClick = false;
let isEditing = false;
let hourEnabled = false;

function genId() {
    return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Asegurar IDs y persistencia inicial
habits.forEach(h => { if (!h.id) h.id = genId(); });
habits.forEach(h => { if (!h.dias) h.dias = [0,1,2,3,4,5,6]; });
localStorage.setItem('habits', JSON.stringify(habits));

// --- OVERLAY ---
function updateOverlay() {
    const overlay = document.getElementById('overlay');
    if (activeSheet) overlay.classList.add('active');
    else overlay.classList.remove('active');
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('selectedDate');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
        selectedDate = dateInput.value;
        dateInput.onchange = (e) => { selectedDate = e.target.value; renderHabits(); };
    }

    const iconSearch = document.getElementById('iconSearch');
    if (iconSearch) {
        iconSearch.addEventListener('input', (e) => initIcons(e.target.value));
    }

    initDiasSelector();
    initIcons();
    renderHabits();

    const toggleDiv = document.getElementById('hourToggle');
    if (toggleDiv) toggleDiv.addEventListener('click', (e) => { e.stopPropagation(); toggleHourEnabled(); });
});

// --- SELECTOR DE DÍAS ---
let diasSeleccionados = [0,1,2,3,4,5,6];
const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function initDiasSelector() {
    const container = document.getElementById('diasTable');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const row = document.createElement('div');
        row.className = 'row diasRow';
        row.dataset.dia = i;
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <span>${nombresDias[i]}</span>
            <span class="diaCheck">${diasSeleccionados.includes(i) ? '􀆅' : ''}</span>
        `;
        row.addEventListener('click', (e) => { e.preventDefault(); toggleDia(i); });
        container.appendChild(row);
    }
}

function toggleDia(dia) {
    if (diasSeleccionados.includes(dia)) {
        diasSeleccionados = diasSeleccionados.filter(d => d !== dia);
    } else {
        diasSeleccionados.push(dia);
        diasSeleccionados.sort((a,b)=>a-b);
    }
    actualizarUIDias();
}

function actualizarUIDias() {
    const rows = document.querySelectorAll('#diasTable .diasRow');
    rows.forEach(row => {
        const dia = parseInt(row.dataset.dia);
        const checkSpan = row.querySelector('.diaCheck');
        if (diasSeleccionados.includes(dia)) {
            checkSpan.textContent = '􀆅';
        } else {
            checkSpan.textContent = '';
        }
    });
}

// --- EXPORTAR/IMPORTAR ---
function exportData() {
    const data = {
        habits: JSON.parse(localStorage.getItem('habits') || '[]'),
        routines: JSON.parse(localStorage.getItem('routines') || '[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitos_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (confirm('¿Estás seguro? Esto reemplazará todos tus hábitos y rutinas actuales.')) {
                if (importedData.habits) localStorage.setItem('habits', JSON.stringify(importedData.habits));
                if (importedData.routines) localStorage.setItem('routines', JSON.stringify(importedData.routines));
                alert('Datos importados correctamente. La página se recargará.');
                window.location.reload();
            }
        } catch (err) {
            alert('Error al leer el archivo. Asegúrate de que sea un JSON válido.');
        }
    };
    reader.readAsText(file);
}

// --- SHEETS CON OVERLAY ---
function openSheet(id) {
    if (activeSheet === id) return;
    ignoreNextClick = true;
    const content = document.getElementById(id);
    if (!content) return;

    if (activeSheet) {
        const old = document.getElementById(activeSheet);
        old.classList.remove('active');
        setTimeout(() => { if (activeSheet !== id) old.style.display = 'none'; }, 400);
    }

    previousSheet = activeSheet;
    activeSheet = id;
    zCounter++;
    content.style.display = 'block';
    content.style.zIndex = zCounter;
    requestAnimationFrame(() => { content.classList.add('active'); });
    updateOverlay();
}

function closeSheet(id = activeSheet, cb = null) {
    const content = document.getElementById(id);
    if (!content || content.classList.contains('closing')) return;

    ignoreNextClick = true;
    content.classList.remove('active');
    content.classList.add('closing');

    if (id === activeSheet) activeSheet = null;

    setTimeout(() => {
        content.style.display = 'none';
        content.classList.remove('closing');
        if (cb) cb();
        updateOverlay();
    }, 400);
}

document.addEventListener('click', (e) => {
    if (ignoreNextClick || !activeSheet) return;
    const currentSheetEl = document.getElementById(activeSheet);
    if (!currentSheetEl || currentSheetEl.classList.contains('closing')) return;
    if (!currentSheetEl.contains(e.target) && !e.target.closest('#addHabitBtn') && !e.target.closest('.botoncito')) {
        closeSheet(activeSheet);
    }
});

document.addEventListener('click', () => {
    ignoreNextClick = false;
}, true);

// --- TOGGLE HORA ---
function toggleHourEnabled() {
    hourEnabled = !hourEnabled;
    const toggle = document.getElementById('hourToggle');
    const timeRow = document.getElementById('timeRowContainer');
    const timeInput = document.getElementById('hTime');
    if (hourEnabled) {
        toggle.classList.add('active');
        timeRow.style.display = 'flex';
        if (!timeInput.value) {
            const now = new Date();
            timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
    } else {
        toggle.classList.remove('active');
        timeRow.style.display = 'none';
        timeInput.value = '';
    }
}

function setHourToggleState(enabled, timeValue) {
    hourEnabled = enabled;
    const toggle = document.getElementById('hourToggle');
    const timeRow = document.getElementById('timeRowContainer');
    const timeInput = document.getElementById('hTime');
    if (enabled) {
        toggle.classList.add('active');
        timeRow.style.display = 'flex';
        timeInput.value = timeValue || (() => {
            const now = new Date();
            return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        })();
    } else {
        toggle.classList.remove('active');
        timeRow.style.display = 'none';
        timeInput.value = '';
    }
}

// --- ICONOS (usa iconData de icons.js) ---
let selectedIcon = '􀓔';
let selectedColor = '#0076ff';

const colorPicker = document.getElementById('iconColorPicker');
const preview = document.getElementById('colorPreview');
const iconTrigger = document.getElementById('iconPickerTrigger');

if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
        selectedColor = e.target.value;
        preview.style.background = selectedColor;
        iconTrigger.style.color = selectedColor;
        initIcons();
    });
}

function initIcons(filter = "") {
    const grid = document.getElementById('iconGrid');
    if (!grid || typeof iconData === 'undefined') return;
    grid.innerHTML = "";
    const searchLower = filter.toLowerCase();

    for (const [category, icons] of Object.entries(iconData)) {
        const filteredIcons = icons.filter(icon => icon.name.toLowerCase().includes(searchLower));
        if (filteredIcons.length > 0) {
            const catWrap = document.createElement('div');
            catWrap.className = 'iconCategory';
            catWrap.innerHTML = `<div class="categoryTitle">${category}</div>`;
            const subGrid = document.createElement('div');
            subGrid.className = 'iconGridSub';

            filteredIcons.forEach(icon => {
                const div = document.createElement('div');
                div.className = 'iconItem';
                div.textContent = icon.char;
                if (icon.char === selectedIcon) {
                    div.classList.add('selected');
                    div.style.color = selectedColor;
                } else {
                    div.style.color = '#8e8e93';
                }
                div.onclick = () => {
                    selectedIcon = icon.char;
                    if (iconTrigger) {
                        iconTrigger.textContent = selectedIcon;
                        iconTrigger.style.color = selectedColor;
                    }
                    closeSheet('iconPickerSheet', () => {
                        openSheet('createSheet');
                    });
                };
                subGrid.appendChild(div);
            });
            catWrap.appendChild(subGrid);
            grid.appendChild(catWrap);
        }
    }
}

// --- RENDER HÁBITOS CON ANIMACIÓN FLIP SUAVE ---
function renderHabits(updatedId = null, animate = false, wasComplete = null, isComplete = null) {
    const container = document.getElementById('habitsContainer');
    if (!container) return;

    // Guardar posiciones de la card que se va a actualizar (para FLIP)
    let oldRect = null;
    if (animate && updatedId) {
        const oldCard = document.querySelector(`.habitCard[data-id="${updatedId}"]`);
        if (oldCard) oldRect = oldCard.getBoundingClientRect();
    }

    // Calcular hábitos activos y ordenarlos
    const selectedDateObj = new Date(selectedDate + "T00:00:00");
    let wd = (selectedDateObj.getDay() === 0) ? 6 : selectedDateObj.getDay() - 1;
    const activeHabits = habits.filter(h => {
        if (h.frequency === 'weekly' && selectedDateObj.getDay() !== 1) return false;
        if (h.frequency === 'monthly' && selectedDateObj.getDate() !== 1) return false;
        if (h.dias && !h.dias.includes(wd)) return false;
        return true;
    });

    const sorted = [...activeHabits].sort((a, b) => {
        const ca = (a.history[selectedDate] || 0) >= a.goal;
        const cb = (b.history[selectedDate] || 0) >= b.goal;
        if (ca !== cb) return ca ? 1 : -1;
        return (a.time || "99:99").localeCompare(b.time || "99:99");
    });

    // Renderizar nuevo HTML
    container.innerHTML = sorted.length > 0 
        ? sorted.map(h => getHabitCardHTML(h)).join('')
        : `<div style="text-align:center; color:#8e8e93; margin-top:40px;">No hay hábitos para hoy</div>`;

    // FLIP: animar si la card cambió de posición
    if (animate && updatedId && oldRect) {
        const newCard = document.querySelector(`.habitCard[data-id="${updatedId}"]`);
        if (newCard) {
            const newRect = newCard.getBoundingClientRect();
            const deltaX = oldRect.left - newRect.left;
            const deltaY = oldRect.top - newRect.top;
            if (deltaX !== 0 || deltaY !== 0) {
                newCard.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                newCard.style.transition = 'none';
                requestAnimationFrame(() => {
                    newCard.style.transform = '';
                    newCard.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
                    newCard.addEventListener('transitionend', () => {
                        newCard.style.transition = '';
                    }, { once: true });
                });
            }
        }
        // Si cambió el estado de completado, añadir fade/desliz adicional
        if (wasComplete !== null && isComplete !== null && wasComplete !== isComplete) {
            const card = document.querySelector(`.habitCard[data-id="${updatedId}"]`);
            if (card) {
                card.classList.add(isComplete ? 'flip-move-down' : 'flip-move-up');
                setTimeout(() => card.classList.remove('flip-move-down', 'flip-move-up'), 400);
            }
        }
    }

    // Animar barras de progreso
    requestAnimationFrame(() => {
        document.querySelectorAll('.habitProgressBarInner').forEach(bar => {
            bar.style.transition = 'width 0.4s ease';
            bar.style.width = bar.dataset.w;
        });
    });
}

function getHabitCardHTML(h) {
    const qty = h.history[selectedDate] || 0;
    const isComplete = qty >= h.goal;
    const progress = Math.min(100, (qty / h.goal) * 100);
    return `
        <div class="habitCard ${isComplete ? 'completed' : ''}" data-id="${h.id}" onclick="openViewById('${h.id}')">
            <div class="supcard">
                <div class="habitIconCircle" style="color: ${h.iconColor}">${h.icon}</div>
                <div class="habitInfo">
                    <div class="details">
                        <div class="dup">
                            <div class="habitName">${h.name}</div>
                        </div>
                        ${h.time ? `<div class="habitTime">${h.time}</div>` : ''}
                        ${h.goal > 1 ? `
                        <div class="progress">
                            <div class="habitProgressBar">
                                <div class="habitProgressBarInner" data-w="${progress}%" style="width: ${progress}%; background: ${h.iconColor};"></div>
                            </div>
                        </div>` : ''}
                        ${h.goal > 1 ? `
                        <div class="habitProgressBadge" style="color: ${h.iconColor}">
                            ${(qty !== 0 && qty !== h.goal) ? `
                            <div class="cantidad">
                                <div class="hecho">${qty} ${qty !== 1 ? h.uPlur : h.uSing}</div>
                                <div class="meta">${h.goal} ${h.uPlur}</div>
                            </div>` : ''}
                        </div>` : ''}
                    </div>
                </div>
                <button class="botoncito" style="background-color: ${isComplete ? h.iconColor + '70' : h.iconColor}"
                        onclick="event.stopPropagation(); ${isComplete ? 'openStreak()' : `updateQtyById('${h.id}', 1)`}">
                    ${isComplete ? '􀆅' : '􀅼'}
                </button>
            </div>
        </div>`;
}

// --- CRUD con IDs en lugar de índices ---
function openViewById(id) {
    const idx = habits.findIndex(h => h.id === id);
    if (idx !== -1) openView(idx);
}

function openView(i) {
    currentHabitId = habits[i].id;
    const h = habits[i];
    document.getElementById('vName').textContent = h.name;
    document.getElementById('vIcon').textContent = h.icon;
    document.getElementById('vIcon').style.color = h.iconColor;
    document.getElementById('vQtyManual').value = h.history[selectedDate] || 0;
    document.getElementById('vUnitLabel').textContent = `Objetivo: ${h.goal} ${h.uPlur}`;
    const racha = getStreak(h);
    document.getElementById('streakNumberInView').textContent = `${racha} ${racha === 1 ? 'día' : 'días'}`;
    openSheet('viewSheet');
}

function saveHabit() {
    const name = document.getElementById('hName').value.trim();
    const goal = parseInt(document.getElementById('hGoal').value) || 1;
    if (!name) return alert('Nombre obligatorio');
    
    const id = currentHabitId || genId();
    const existingIndex = habits.findIndex(h => h.id === id);
    const history = (existingIndex !== -1) ? habits[existingIndex].history : {};
    
    const h = {
        id: id,
        name,
        uSing: document.getElementById('uSing').value || 'vez',
        uPlur: document.getElementById('uPlur').value || 'veces',
        goal,
        step: parseInt(document.getElementById('hStep').value) || 1,
        time: hourEnabled ? document.getElementById('hTime').value : null,
        icon: selectedIcon,
        iconColor: selectedColor,
        history: history,
        dias: [...diasSeleccionados]
    };

    if (existingIndex !== -1) habits[existingIndex] = h;
    else habits.push(h);

    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
    closeSheet('createSheet');
    currentHabitId = null;
}

function deleteHabit() {
    if(confirm('¿Borrar hábito?')) {
        const idx = habits.findIndex(h => h.id === currentHabitId);
        if (idx !== -1) habits.splice(idx, 1);
        localStorage.setItem('habits', JSON.stringify(habits));
        renderHabits();
        closeSheet('createSheet');
        currentHabitId = null;
    }
}

function updateQtyById(id, dir) {
    const idx = habits.findIndex(h => h.id === id);
    if (idx === -1) return;
    const h = habits[idx];
    const oldQty = h.history[selectedDate] || 0;
    const newQty = Math.max(0, oldQty + (dir * h.step));
    const wasComplete = oldQty >= h.goal;
    const isComplete = newQty >= h.goal;
    h.history[selectedDate] = newQty;
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits(h.id, true, wasComplete, isComplete);
    if (activeSheet === 'viewSheet' && currentHabitId === h.id) {
        document.getElementById('vQtyManual').value = newQty;
        const racha = getStreak(h);
        document.getElementById('streakNumberInView').textContent = `${racha} ${racha === 1 ? 'día' : 'días'}`;
    }
}

function updateQty(dir, idx = null) {
    if (idx !== null) {
        const h = habits[idx];
        updateQtyById(h.id, dir);
    } else if (currentHabitId) {
        updateQtyById(currentHabitId, dir);
    }
}

function clearQty() {
    if (!currentHabitId) return;
    const idx = habits.findIndex(h => h.id === currentHabitId);
    if (idx === -1) return;
    const h = habits[idx];
    const oldQty = h.history[selectedDate] || 0;
    const wasComplete = oldQty >= h.goal;
    h.history[selectedDate] = 0;
    localStorage.setItem('habits', JSON.stringify(habits));
    document.getElementById('vQtyManual').value = 0;
    renderHabits(h.id, true, wasComplete, false);
    const racha = getStreak(h);
    document.getElementById('streakNumberInView').textContent = `${racha} ${racha === 1 ? 'día' : 'días'}`;
}

function setComplete() {
    if (!currentHabitId) return;
    const idx = habits.findIndex(h => h.id === currentHabitId);
    if (idx === -1) return;
    const h = habits[idx];
    const oldQty = h.history[selectedDate] || 0;
    const wasComplete = oldQty >= h.goal;
    h.history[selectedDate] = h.goal;
    localStorage.setItem('habits', JSON.stringify(habits));
    document.getElementById('vQtyManual').value = h.goal;
    renderHabits(h.id, true, wasComplete, true);
    const racha = getStreak(h);
    document.getElementById('streakNumberInView').textContent = `${racha} ${racha === 1 ? 'día' : 'días'}`;
}

function openAddQuantitySheet() {
    document.getElementById('addQtyInput').value = '0';
    openSheet('addQuantitySheet');
}

function confirmAddQuantity() {
    let addValue = parseInt(document.getElementById('addQtyInput').value);
    if (isNaN(addValue) || addValue <= 0) {
        closeSheet('addQuantitySheet');
        return;
    }
    if (!currentHabitId) return;
    const idx = habits.findIndex(h => h.id === currentHabitId);
    if (idx === -1) return;
    const h = habits[idx];
    const oldQty = h.history[selectedDate] || 0;
    const wasComplete = oldQty >= h.goal;
    const newQty = oldQty + addValue;
    h.history[selectedDate] = newQty;
    localStorage.setItem('habits', JSON.stringify(habits));
    document.getElementById('vQtyManual').value = newQty;
    renderHabits(h.id, true, wasComplete, newQty >= h.goal);
    const racha = getStreak(h);
    document.getElementById('streakNumberInView').textContent = `${racha} ${racha === 1 ? 'día' : 'días'}`;
    closeSheet('addQuantitySheet');
}

// --- RACHA Y GRÁFICOS ---
function getStreak(h) {
    let streak = 0;
    let curr = new Date();
    curr.setHours(0, 0, 0, 0);
    while (true) {
        let key = curr.toISOString().split('T')[0];
        if (h.history && h.history[key] >= h.goal) {
            streak++;
        } else {
            let todayStr = new Date().toISOString().split('T')[0];
            if (key !== todayStr) break;
        }
        curr.setDate(curr.getDate() - 1);
    }
    return streak;
}

let calDate = new Date();

function openStreak() {
    const idx = habits.findIndex(h => h.id === currentHabitId);
    if (idx === -1) return;
    const h = habits[idx];
    const racha = getStreak(h);
    document.getElementById('streakValue').textContent = racha;
    document.getElementById('streakText').textContent = racha === 1 ? 'Día de racha' : 'Días de racha';
    const fire = document.querySelector(".fire");
    if (racha === 0) {
        fire.style.filter = "grayscale(100%)";
        fire.style.opacity = "0.5";
    } else {
        fire.style.filter = "grayscale(0%)";
        fire.style.opacity = "1";
        fire.style.color = h.iconColor;
    }
    calDate = new Date(selectedDate);
    renderCalendar();
    drawLineChartSVG();
    openSheet('streakSheet');
}

function renderCalendar() {
    const idx = habits.findIndex(h => h.id === currentHabitId);
    if (idx === -1) return;
    const h = habits[idx];
    const grid = document.getElementById('calGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const month = calDate.getMonth(), year = calDate.getFullYear();
    document.getElementById('calTitle').textContent = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(calDate);
    const diasLabels = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
    diasLabels.forEach(d => {
        const div = document.createElement('div');
        div.style.color = '#8E8E93';
        div.textContent = d;
        grid.appendChild(div);
    });
    const firstDayRaw = new Date(year, month, 1).getDay();
    const firstDay = (firstDayRaw === 0) ? 6 : firstDayRaw - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));
    for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const qty = h.history[key] || 0;
        const progress = Math.min(1, qty / h.goal);
        const radius = 18;
        const circ = 2 * Math.PI * radius;
        const offset = circ - (progress * circ);
        const cell = document.createElement('div');
        cell.className = 'dayCell';
        cell.innerHTML = `
            <svg class="ring" viewBox="0 0 44 44">
                <circle class="ring-bg" cx="22" cy="22" r="${radius}"></circle>
                <circle class="ring-fg" cx="22" cy="22" r="${radius}" 
                    style="stroke-dasharray: ${circ}; stroke-dashoffset: ${offset}; color: ${h.iconColor}; opacity: ${qty > 0 ? 1 : 0}">
                </circle>
            </svg>
            <span class="dayNum">${d}</span>
        `;
        if (qty >= h.goal) {
            cell.querySelector('.dayNum').style.color = h.iconColor;
            cell.querySelector('.dayNum').style.fontWeight = '700';
        }
        grid.appendChild(cell);
    }
}

function changeMonth(dir) {
    calDate.setMonth(calDate.getMonth() + dir);
    renderCalendar();
}

function drawLineChartSVG() {
    const idx = habits.findIndex(h => h.id === currentHabitId);
    if (idx === -1) return;
    const h = habits[idx];
    const svg = document.getElementById('weeklyLineSvg');
    if (!svg) return;
    let values = [];
    let today = new Date();
    today.setHours(0,0,0,0);
    for (let i = 6; i >= 0; i--) {
        let d = new Date(today);
        d.setDate(today.getDate() - i);
        let key = d.toISOString().split('T')[0];
        let qty = h.history[key] || 0;
        values.push(Math.min(100, (qty / h.goal) * 100));
    }
    const w = 400, hh = 200;
    const padding = 30;
    const stepX = (w - 2 * padding) / 6;
    const scaleY = (hh - 2 * padding) / 100;
    const points = values.map((v, i) => ({ x: padding + i * stepX, y: hh - padding - v * scaleY }));
    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const circles = points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${h.iconColor}" stroke="white" stroke-width="2"/>`).join('');
    const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => `<text x="${padding + i * stepX - 5}" y="${hh - padding + 18}" font-size="10" fill="#666">${d}</text>`).join('');
    svg.innerHTML = `
        <line x1="${padding}" y1="${hh - padding}" x2="${w - padding}" y2="${hh - padding}" stroke="#ccc" stroke-width="1"/>
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${hh - padding}" stroke="#ccc" stroke-width="1"/>
        <path d="${pathD}" fill="none" stroke="${h.iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${circles}
        ${labels}
    `;
}

// --- REORDENAR HÁBITOS CON FLECHAS (sin drag & drop) ---
let reorderList = [];

function openReorderSheet() {
    reorderList = [...habits];
    const container = document.getElementById('reorderList');
    container.innerHTML = '';
    reorderList.forEach((habit, idx) => {
        const div = document.createElement('div');
        div.className = 'reorderItem';
        div.setAttribute('data-index', idx);
        div.innerHTML = `
            <div class="reorderIcon" style="color: ${habit.iconColor}">${habit.icon}</div>
            <div class="reorderName">${habit.name}</div>
            <div class="reorderArrows">
                <button class="reorderArrow up" data-idx="${idx}">▲</button>
                <button class="reorderArrow down" data-idx="${idx}">▼</button>
            </div>
        `;
        container.appendChild(div);
    });
    // Asignar eventos a los botones
    document.querySelectorAll('.reorderArrow.up').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.idx);
            if (idx > 0) {
                [reorderList[idx-1], reorderList[idx]] = [reorderList[idx], reorderList[idx-1]];
                openReorderSheet(); // refrescar
            }
        });
    });
    document.querySelectorAll('.reorderArrow.down').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.idx);
            if (idx < reorderList.length - 1) {
                [reorderList[idx], reorderList[idx+1]] = [reorderList[idx+1], reorderList[idx]];
                openReorderSheet();
            }
        });
    });
    openSheet('reorderSheet');
}

function saveReorder() {
    habits = reorderList;
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
    closeSheet('reorderSheet');
}

// --- RESET FORM Y EDICIÓN ---
function resetCreateForm() {
    currentHabitId = null;
    isEditing = false;
    document.getElementById('deleteHabitRow').style.display = 'none';
    document.getElementById('hName').value = '';
    document.getElementById('uSing').value = '';
    document.getElementById('uPlur').value = '';
    document.getElementById('hGoal').value = '';
    document.getElementById('hStep').value = '';
    setHourToggleState(false, '');
    selectedIcon = '􀓔';
    selectedColor = '#0076ff';
    diasSeleccionados = [0,1,2,3,4,5,6];
    actualizarUIDias();
    if (iconTrigger) {
        iconTrigger.textContent = selectedIcon;
        iconTrigger.style.color = selectedColor;
    }
    if (preview) preview.style.background = selectedColor;
}

function editHabit() {
    const idx = habits.findIndex(h => h.id === currentHabitId);
    if (idx === -1) return;
    const h = habits[idx];
    isEditing = true;
    document.getElementById('deleteHabitRow').style.display = 'block';
    document.getElementById('hName').value = h.name;
    document.getElementById('uSing').value = h.uSing;
    document.getElementById('uPlur').value = h.uPlur;
    document.getElementById('hGoal').value = h.goal;
    document.getElementById('hStep').value = h.step;
    setHourToggleState(!!h.time, h.time || '');
    selectedIcon = h.icon;
    selectedColor = h.iconColor;
    iconTrigger.textContent = h.icon;
    iconTrigger.style.color = h.iconColor;
    if (preview) preview.style.background = h.iconColor;
    diasSeleccionados = h.dias ? [...h.dias] : [0,1,2,3,4,5,6];
    actualizarUIDias();
    closeSheet('viewSheet', () => {
        openSheet('createSheet');
    });
}

function handleCloseHabit() {
    closeSheet(activeSheet);
}

// --- EVENTOS GLOBALES ---
const addBtn = document.getElementById('addHabitBtn');
if (addBtn) {
    addBtn.onclick = () => {
        resetCreateForm();
        openSheet('createSheet');
    };
}
if (iconTrigger) {
    iconTrigger.onclick = () => openSheet('iconPickerSheet');
}
const confirmIconBtn = document.getElementById('confirmIconBtn');
if (confirmIconBtn) {
    confirmIconBtn.onclick = () => {
        const activeIcon = document.querySelector('.iconItem.selected');
        if (activeIcon) {
            selectedIcon = activeIcon.innerText;
            document.getElementById('iconPickerTrigger').innerText = selectedIcon;
        }
        closeSheet('iconPickerSheet');
        openSheet('createSheet');
    };
}
document.getElementById('reorderBtn').onclick = () => openReorderSheet();

const vQtyManual = document.getElementById('vQtyManual');
if (vQtyManual) {
    vQtyManual.oninput = (e) => {
        if (!currentHabitId) return;
        const idx = habits.findIndex(h => h.id === currentHabitId);
        if (idx === -1) return;
        const val = parseInt(e.target.value) || 0;
        const h = habits[idx];
        const oldQty = h.history[selectedDate] || 0;
        const wasComplete = oldQty >= h.goal;
        h.history[selectedDate] = Math.max(0, val);
        localStorage.setItem('habits', JSON.stringify(habits));
        renderHabits(h.id, true, wasComplete, val >= h.goal);
        const racha = getStreak(h);
        document.getElementById('streakNumberInView').textContent = `${racha} ${racha === 1 ? 'día' : 'días'}`;
    };
}