// --- ESTADO GLOBAL Y CARGA DE DATOS ---
let habits = JSON.parse(localStorage.getItem('habits') || '[]');
let routines = JSON.parse(localStorage.getItem('routines') || '[]');
let currentHabitIdx = null;
let selectedDate = new Date().toISOString().split('T')[0];
let activeSheet = null;
let previousSheet = null;
let isNavigatingFromRoutine = false;
let zCounter = 1000;
let ignoreNextClick = false;
let currentView = 'habits';

function genId() {
    return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Asegurar IDs y persistencia inicial
habits.forEach(h => { if (!h.id) h.id = genId(); });
localStorage.setItem('habits', JSON.stringify(habits));

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

    // Listener para el buscador de iconos
    const iconSearch = document.getElementById('iconSearch');
    if (iconSearch) {
        iconSearch.addEventListener('input', (e) => initIcons(e.target.value));
    }

    if (typeof updateRoutineSelects === 'function') updateRoutineSelects();
    initIcons();
    renderHabits();
});

// --- LÓGICA DE SHEETS (MODALES) ---
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
}

function closeSheet(id = activeSheet, cb = null) {
    const content = document.getElementById(id);
    if (!content || content.classList.contains('closing')) return;

    ignoreNextClick = true;
    content.classList.remove('active');
    content.classList.add('closing');

    const returningToRoutine = (id !== 'routineViewSheet') && isNavigatingFromRoutine;

    content.addEventListener('transitionend', function handler() {
        content.style.display = 'none';
        content.classList.remove('closing');

        if (returningToRoutine) {
            activeSheet = 'routineViewSheet';
            openSheet('routineViewSheet');
        } else {
            if (id === activeSheet) activeSheet = null;
        }

        if (cb) cb();
        setTimeout(() => { ignoreNextClick = false; }, 100);
        content.removeEventListener('transitionend', handler);
    }, { once: true });
}

// Cerrar al clickear fuera
document.addEventListener('click', (e) => {
    const prompt = document.getElementById('customPrompt');
    if (prompt && prompt.style.display === 'flex') return;
    if (ignoreNextClick || !activeSheet) return;
    const currentSheetEl = document.getElementById(activeSheet);
    if (!currentSheetEl || currentSheetEl.classList.contains('closing')) return;
    if (!currentSheetEl.contains(e.target) && !e.target.closest('#addHabitBtn') && !e.target.closest('.botoncito')) {
        closeSheet(activeSheet);
    }
});

// --- SISTEMA DE ICONOS (USA icons.js) ---
let selectedIcon = '􀓔';
let selectedColor = '#0076ff';
const iconTrigger = document.getElementById('iconPickerTrigger');
const colorPicker = document.getElementById('iconColorPicker');
const preview = document.getElementById('colorPreview');

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
                div.className = 'iconItem' + (icon.char === selectedIcon ? ' selected' : '');
                if (icon.char === selectedIcon) div.style.color = selectedColor;
                div.textContent = icon.char;
                div.onclick = () => {
                    selectedIcon = icon.char;
                    if (iconTrigger) iconTrigger.textContent = selectedIcon;
                    initIcons(filter);
                };
                subGrid.appendChild(div);
            });
            catWrap.appendChild(subGrid);
            grid.appendChild(catWrap);
        }
    }
}

// --- RENDERIZADO ---
function renderHabits(updatedId = null) {
    const container = document.getElementById('habitsContainer');
    if (!container) return;

    const firstPositions = {};
    [...container.children].forEach(el => { if (el.dataset.id) firstPositions[el.dataset.id] = el.getBoundingClientRect(); });

    const activeHabits = habits.filter(h => {
        const date = new Date(selectedDate + "T00:00:00");
        if (currentView === 'habits' && h.routineId && h.time && h.frequency === 'daily') return false;
        if (h.frequency === 'weekly') return date.getDay() === 1;
        if (h.frequency === 'monthly') return date.getDate() === 1;
        return true;
    });

    if (currentView === 'habits') {
        const sorted = [...activeHabits].sort((a, b) => {
            const ca = (a.history[selectedDate] || 0) >= a.goal;
            const cb = (b.history[selectedDate] || 0) >= b.goal;
            if (ca !== cb) return ca ? 1 : -1;
            return (a.time || "99:99").localeCompare(b.time || "99:99");
        });
        container.innerHTML = sorted.length > 0 
            ? sorted.map(h => getHabitCardHTML(h, updatedId)).join('')
            : `<div style="text-align:center; color:#8e8e93; margin-top:40px;">No hay hábitos para hoy</div>`;
    } else if (typeof renderRoutinesView === 'function') {
        renderRoutinesView(container, activeHabits);
    }

    applyAnimations(container, firstPositions);
}
function getHabitCardHTML(h, updatedId) {
    const i = habits.findIndex(x => x.id === h.id);
    const qty = h.history[selectedDate] || 0;
    const isComplete = qty >= h.goal;
    const progress = Math.min(100, (qty / h.goal) * 100);
    const streak = getStreak(h);
    const startWidth = (h.id === updatedId) ? 0 : progress;

    return `
        <div class="habitCard ${isComplete ? 'completed' : ''}" data-id="${h.id}" 
             style="background-color: ${h.iconColor}12" onclick="openView(${i})">
            <div class="habitIconCircle" style="color: ${h.iconColor}">${h.icon}</div>
            <div class="habitInfo">
                <div class="cont">
                    <div class="details">
                        <div class="dup">
                            <div class="habitName">${h.name}</div>
                            ${streak > 0 ? `<span class="streak">􀙭 <div class="streaknum">${streak}</div></span>` : ''}
                        </div>
                        ${h.time ? `<div class="habitTime">􀐫 ${h.time}</div>` : ''}
                    </div>
                </div>
                ${h.goal > 1 ? `
                <div class="habitProgressBar">
                    <div class="habitProgressBarInner" 
                         data-w="${progress}%" 
                         style="width: ${startWidth}%; background: ${h.iconColor};">
                    </div>
                </div>` : ''}
                ${h.goal > 1 ? `<div class="habitProgressBadge" style="color: ${h.iconColor}">
                    ${(qty != 0 && qty != h.goal) ? `
                    <div class="cantidad">
                        <div class="hecho">${qty} ${qty != 1 ? h.uPlur : h.uSing}</div>
                        <div class="meta">${h.goal} ${h.uPlur}</div>
                    </div>` : ''}
                </div>` : ''}
            </div>
            <button class="botoncito" style="background-color: ${isComplete ? h.iconColor + '70' : h.iconColor}"
                    onclick="event.stopPropagation(); ${isComplete ? 'openStreak()' : `updateQty(1, ${i})`}">
                ${isComplete ? '􀆅' : '􀅼'}
            </button>
        </div>`;
}

// --- CRUD Y VISTAS ---
function openView(i) {
    currentHabitIdx = i;
    const h = habits[i];
    document.getElementById('vName').textContent = h.name;
    document.getElementById('vIcon').textContent = h.icon;
    document.getElementById('vIcon').style.color = h.iconColor;
    document.getElementById('vQtyManual').value = h.history[selectedDate] || 0;
    document.getElementById('vUnitLabel').textContent = `Meta: ${h.goal} ${h.uPlur}`;
    openSheet('viewSheet');
}

function saveHabit() {
    const name = document.getElementById('hName').value.trim();
    const goal = parseInt(document.getElementById('hGoal').value) || 1;
    if (!name) return alert('Nombre obligatorio');
    
    const h = {
        id: currentHabitIdx !== null ? habits[currentHabitIdx].id : genId(),
        name,
        uSing: document.getElementById('uSing').value || 'vez',
        uPlur: document.getElementById('uPlur').value || 'veces',
        goal,
        step: parseInt(document.getElementById('hStep').value) || 1,
        time: document.getElementById('hTime').value || null,
        frequency: document.getElementById('hFreq').value,
        routineId: document.getElementById('hRoutine').value || null,
        icon: selectedIcon,
        iconColor: selectedColor,
        history: currentHabitIdx !== null ? habits[currentHabitIdx].history : {}
    };

    if (currentHabitIdx !== null) habits[currentHabitIdx] = h;
    else habits.push(h);

    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
    closeSheet('createSheet');
    if (typeof updateRoutineSelects === 'function') updateRoutineSelects();
}

function deleteHabit() {
    if(confirm('¿Borrar hábito?')) {
        habits.splice(currentHabitIdx, 1);
        localStorage.setItem('habits', JSON.stringify(habits));
        renderHabits(); 
        closeSheet('viewSheet');
    }
}

function updateQty(dir, idx = null) {
    const i = (idx !== null) ? idx : currentHabitIdx;
    const h = habits[i];
    h.history[selectedDate] = Math.max(0, (h.history[selectedDate] || 0) + (dir * h.step));
    localStorage.setItem('habits', JSON.stringify(habits));
    if (idx === null) document.getElementById('vQtyManual').value = h.history[selectedDate];
    renderHabits(h.id);
}

// --- UTILIDADES ---
function getStreak(h) {
    let streak = 0; let curr = new Date(); curr.setHours(0,0,0,0);
    const todayStr = curr.toISOString().split('T')[0];
    while (true) {
        let key = curr.toISOString().split('T')[0];
        if (h.history[key] >= h.goal) streak++;
        else if (key === todayStr) { /* racha sigue viva hoy */ }
        else break;
        curr.setDate(curr.getDate() - 1);
    }
    return streak;
}

function applyAnimations(container, firstPositions) {
    requestAnimationFrame(() => {
        container.querySelectorAll('.habitProgressBarInner').forEach(bar => {
            bar.style.transition = 'width 0.4s ease';
            bar.style.width = bar.dataset.w;
        });
    });
}
// --- ANIMACIONES ---
function applyAnimations(container, firstPositions) {
    requestAnimationFrame(() => {
        container.querySelectorAll('.habitProgressBarInner').forEach(bar => {
            bar.style.transition = 'width 0.4s ease';
            bar.style.width = bar.dataset.w;
        });
    });
}

// --- FUNCIONES DE LIMPIEZA Y CIERRE ---
function resetCreateForm() {
    currentHabitIdx = null;
    document.getElementById('hName').value = '';
    document.getElementById('uSing').value = '';
    document.getElementById('uPlur').value = '';
    document.getElementById('hGoal').value = '';
    document.getElementById('hStep').value = '';
    document.getElementById('hTime').value = '';
    document.getElementById('hRoutine').value = '';
    
    selectedIcon = '􀓔';
    selectedColor = '#0076ff';
    if (iconTrigger) {
        iconTrigger.textContent = selectedIcon;
        iconTrigger.style.color = selectedColor;
    }
    if (preview) preview.style.background = selectedColor;
}

function handleCloseHabit() {
    closeSheet(activeSheet);
}

// --- EVENT LISTENERS (LO QUE FALTABA) ---

// Botón principal de agregar (+)
const addBtn = document.getElementById('addHabitBtn');
if (addBtn) {
    addBtn.onclick = () => {
        resetCreateForm();
        openSheet('createSheet');
    };
}

// Trigger del selector de iconos
if (iconTrigger) {
    iconTrigger.onclick = () => openSheet('iconPickerSheet');
}
function backToCreate() {
    if (previousSheet) {
        // Al abrir la anterior, openSheet automáticamente cierra la actual
        // así ambas animaciones ocurren en paralelo.
        openSheet(previousSheet);
    } else {
        // Si por algún error no hay previa, solo cerramos la de iconos
        closeSheet('iconPickerSheet');
    }
}

// Confirmar icono seleccionado
const confirmIconBtn = document.getElementById('confirmIconBtn');
if (confirmIconBtn) {
    confirmIconBtn.onclick = () => {
        if (iconTrigger) {
            iconTrigger.textContent = selectedIcon;
            iconTrigger.style.color = selectedColor;
        }
        backToCreate();
    };
}

// Editar desde la vista de detalle
function editHabit() {
    const h = habits[currentHabitIdx];
    document.getElementById('hName').value = h.name;
    document.getElementById('uSing').value = h.uSing;
    document.getElementById('uPlur').value = h.uPlur;
    document.getElementById('hGoal').value = h.goal;
    document.getElementById('hStep').value = h.step;
    document.getElementById('hTime').value = h.time || '';
    document.getElementById('hRoutine').value = h.routineId || '';
    
    selectedIcon = h.icon;
    selectedColor = h.iconColor;
    iconTrigger.textContent = h.icon;
    iconTrigger.style.color = h.iconColor;
    
    closeSheet('viewSheet', () => {
        openSheet('createSheet');
    });
}
function openStreak() {
    const h = habits[currentHabitIdx];
    if (!h) return;

    const racha = getStreak(h);
    
    // Actualizamos números y texto
    const streakValueEl = document.getElementById('streakValue');
    const streakTextEl = document.getElementById('streakText');
    const fireEl = document.querySelector('.streakBadge .fire');

    streakValueEl.textContent = racha;
    streakTextEl.textContent = racha === 1 ? 'Día de racha' : 'Días de racha';

    // RESET de estilos para evitar el tachado accidental
    streakValueEl.style.textDecoration = "none";
    streakTextEl.style.textDecoration = "none";

    // Lógica del icono de fuego
    if (fireEl) {
        if (racha === 0) {
            fireEl.style.filter = "grayscale(100%)";
            fireEl.style.opacity = "0.5";
        } else {
            fireEl.style.filter = "grayscale(0%)";
            fireEl.style.opacity = "1";
            fireEl.style.color = h.iconColor; // Que brille con su color
        }
    }

    // El resto de la racha (Calendario y Gráfica)
    // Asumiendo que weekOffset y calDate están definidos globalmente
    weekOffset = 0; 
    calDate = new Date(); 
    
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof updateChart === 'function') updateChart();

    openSheet('streakSheet');
}