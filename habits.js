// --- ESTADO GLOBAL Y CARGA DE DATOS ---
let habits = JSON.parse(localStorage.getItem('habits') || '[]');
let currentHabitIdx = null;
let selectedDate = new Date().toISOString().split('T')[0];
let activeSheet = null;
let previousSheet = null;
let zCounter = 1000;
let ignoreNextClick = false;

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

    // IMPORTANTE: Si estamos cerrando la que está activa, 
    // la marcamos como null de inmediato para que no pise a la siguiente
    if (id === activeSheet) activeSheet = null; 

    setTimeout(() => {
        content.style.display = 'none';
        content.classList.remove('closing');
        if (cb) cb();
    }, 400);
}
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
document.addEventListener('click', () => {
    ignoreNextClick = false;
}, true);

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

    document.querySelectorAll('input[name="presetColor"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedColor = e.target.value;
            preview.style.background = selectedColor;
            iconTrigger.style.color = selectedColor;
            if (colorPicker) colorPicker.value = selectedColor;
            initIcons();
        });
    });
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
                    div.style.color = '#8e8e93'; // color base
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

function renderHabits(updatedId = null) {
    const container = document.getElementById('habitsContainer');
    if (!container) return;

    const firstPositions = {};
    [...container.children].forEach(el => { 
        if (el.dataset.id) firstPositions[el.dataset.id] = el.getBoundingClientRect(); 
    });

    // Filtro simple sin rutinas
    const activeHabits = habits.filter(h => {
        const date = new Date(selectedDate + "T00:00:00");
        if (h.frequency === 'weekly') return date.getDay() === 1;
        if (h.frequency === 'monthly') return date.getDate() === 1;
        return true;
    });

    const sorted = [...activeHabits].sort((a, b) => {
        const ca = (a.history[selectedDate] || 0) >= a.goal;
        const cb = (b.history[selectedDate] || 0) >= b.goal;
        if (ca !== cb) return ca ? 1 : -1;
        return (a.time || "99:99").localeCompare(b.time || "99:99");
    });

    container.innerHTML = sorted.length > 0 
        ? sorted.map(h => getHabitCardHTML(h, updatedId)).join('')
        : `<div style="text-align:center; color:#8e8e93; margin-top:40px;">
            No hay hábitos para hoy
          </div>`;

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
        <div class="habitCard ${isComplete ? 'completed' : ''}" data-id="${h.id}" style="background-color: ${h.iconColor}12" onclick="openView(${i})">
            <div class="supcard">
                <div class="habitIconCircle" style="color: ${h.iconColor}">${h.icon}</div>
                <div class="habitInfo">
                    <div class="details">
                        <div class="dup">
                            <div class="habitName">${h.name}</div>
                        </div>
                        ${h.time ? `<div class="habitTime">${h.time}</div>` : ''}
                    </div>
                </div>
                
                ${streak > 0 ? `<span class="streak">􀙭 <div class="streaknum">${streak}</div></span>` : ''}
            
                <button class="botoncito" style="background-color: ${isComplete ? h.iconColor + '70' : h.iconColor}"
                        onclick="event.stopPropagation(); ${isComplete ? 'openStreak()' : `updateQty(1, ${i})`}">
                    ${isComplete ? '􀆅' : '􀅼'}
                </button>
            </div>
    
            
            ${h.goal > 1 ? `
            <div class="progress">
                <div class="habitProgressBar">
                    <div class="habitProgressBarInner" data-w="${progress}%" style="width: ${startWidth}%; background: ${h.iconColor};">
                    </div>
                </div>` : ''}
                ${h.goal > 1 ? `
                <div class="habitProgressBadge" style="color: ${h.iconColor}">
                    ${(qty != 0 && qty != h.goal) ? `
                    <div class="cantidad">
                        <div class="hecho">${qty} ${qty != 1 ? h.uPlur : h.uSing}</div>
                        <div class="meta">${h.goal} ${h.uPlur}</div>
                    </div>` : ''}
                </div>` : ''}
            </div>
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
        icon: selectedIcon,
        iconColor: selectedColor,
        history: currentHabitIdx !== null ? habits[currentHabitIdx].history : {}
    };

    if (currentHabitIdx !== null) habits[currentHabitIdx] = h;
    else habits.push(h);

    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
    closeSheet('createSheet');
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
// --- FUNCIONES PARA VIEW SHEET ---

function clearQty() {
    if (currentHabitIdx === null) return;
    const h = habits[currentHabitIdx];
    h.history[selectedDate] = 0; // Ponemos a cero
    
    localStorage.setItem('habits', JSON.stringify(habits));
    document.getElementById('vQtyManual').value = 0; // Actualizamos el input
    renderHabits(h.id); // Refrescamos la lista del fondo
}

function setComplete() {
    if (currentHabitIdx === null) return;
    const h = habits[currentHabitIdx];
    h.history[selectedDate] = h.goal; // Igualamos a la meta
    
    localStorage.setItem('habits', JSON.stringify(habits));
    document.getElementById('vQtyManual').value = h.goal; // Actualizamos input
    renderHabits(h.id); // Refrescamos lista
    
    // Opcional: Cerrar la hoja al completar
    // handleCloseHabit(); 
}
document.getElementById('vQtyManual').oninput = (e) => {
    if (currentHabitIdx === null) return;
    const val = parseInt(e.target.value) || 0;
    const h = habits[currentHabitIdx];
    h.history[selectedDate] = Math.max(0, val);
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits(h.id);
};
// --- UTILIDADES ---

function getStreak(h) {
    let streak = 0;
    let curr = new Date(); // Hoy
    curr.setHours(0, 0, 0, 0);

    while (true) {
        // Formato YYYY-MM-DD local
        let key = curr.getFullYear() + '-' + 
                  String(curr.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(curr.getDate()).padStart(2, '0');
        
        if (h.history && h.history[key] >= h.goal) {
            streak++;
        } else {
            // Si es hoy y no está completo, la racha sigue viva por ayer
            let todayStr = new Date().getFullYear() + '-' + 
                           String(new Date().getMonth() + 1).padStart(2, '0') + '-' + 
                           String(new Date().getDate()).padStart(2, '0');
            if (key === todayStr) {
                // No sumamos pero seguimos buscando
            } else {
                break; 
            }
        }
        curr.setDate(curr.getDate() - 1);
    }
    return streak;
}

function openStreak() {
    const h = habits[currentHabitIdx];
    
    // 1. Calcular racha con la función unificada
    const racha = getStreak(h);
    
    // 2. Actualizar el UI de la racha (el badge que creamos)
    document.getElementById('streakValue').textContent = racha;
    document.getElementById('streakText').textContent = racha === 1 ? 'Día de racha' : 'Días de racha';
    
const streakValue = document.getElementById("streakValue");
const fire = document.querySelector(".fire");

// Aplicar grayscale si racha = 0
if (racha === 0) {
    fire.style.filter = "grayscale(100%)";
    fire.style.opacity = "0.5";
} else {
    fire.style.filter = "grayscale(0%)";
    fire.style.opacity = "1";
}

    // 3. El resto de tu lógica de calendario y gráficas
    weekOffset = getWeekOffset(selectedDate); 
    calDate = new Date(selectedDate);
    renderCalendar();
    updateChart();
    openSheet('streakSheet');
}
function renderCalendar() {
    const h = habits[currentHabitIdx];
    const grid = document.getElementById('calGrid');
    grid.innerHTML = '';
    const month = calDate.getMonth(), year = calDate.getFullYear();
    document.getElementById('calTitle').textContent = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(calDate);
    // 1. Cambiamos el orden de las etiquetas
    const diasLabels = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];
    diasLabels.forEach(d => {
        const div = document.createElement('div'); 
        div.style.color='#8E8E93'; 
        div.textContent = d; 
        grid.appendChild(div);
    });

    const firstDayRaw = new Date(year, month, 1).getDay();
    // 2. Ajuste para que Lunes sea 0 y Domingo sea 6
    const firstDay = (firstDayRaw === 0) ? 6 : firstDayRaw - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));
    for(let d=1; d<=daysInMonth; d++) {
        const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const qty = h.history[key] || 0;
        const goal = h.goal;
        const progress = Math.min(1, qty / goal);
        
        // El perímetro de un círculo con radio 18 es ~113
        const radius = 18;
        const circ = 2 * Math.PI * radius;
        const offset = circ - (progress * circ);

        const cell = document.createElement('div');
        cell.className = 'dayCell';
        
        // Insertamos el SVG del Ring
        cell.innerHTML = `
            <svg class="ring" viewBox="0 0 44 44">
                <circle class="ring-bg" cx="22" cy="22" r="${radius}"></circle>
                <circle class="ring-fg" cx="22" cy="22" r="${radius}" 
                    style="stroke-dasharray: ${circ}; stroke-dashoffset: ${offset}; color: ${h.iconColor}; opacity: ${qty > 0 ? 1 : 0}">
                </circle>
            </svg>
            <span class="dayNum">${d}</span>
        `;

        // Si está completado, podemos resaltar el número o el fondo opcionalmente
        if(qty >= goal) {
            cell.querySelector('.dayNum').style.color = h.iconColor;
            cell.querySelector('.dayNum').style.fontWeight = '700';
        }

        grid.appendChild(cell);
    }
}
function changeMonth(dir) { calDate.setMonth(calDate.getMonth()+dir); renderCalendar(); }
// Variable global para controlar qué semana vemos (0 = actual, -1 = anterior, etc.)
let weekOffset = 0;
function updateChart() {
    const h = habits[currentHabitIdx];
    if (!h) return;

    const bars = document.querySelectorAll('.day .fill');
    const daysContainer = document.querySelectorAll('.day');
    const weekLabel = document.getElementById('weekLabel');
    
    let now = new Date();
    now.setHours(0, 0, 0, 0);

    let dayOfWeek = now.getDay(); 
    let diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    
    let startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday + (weekOffset * 7));

    // --- NUEVA LÓGICA DE ESCALA ---
    // Calculamos el valor máximo de la semana para que las barras se ajusten
    let weeklyValues = [];
    for (let i = 0; i < 7; i++) {
        let d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        let key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        weeklyValues.push(h.history[key] || 0);
    }
    
    // El máximo será el valor más alto registrado o la meta (lo que sea mayor)
    let maxInChart = Math.max(...weeklyValues, h.goal);

    // Etiqueta de la semana
    let endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    weekLabel.textContent = `${startOfWeek.getDate()} ${startOfWeek.toLocaleString('es-ES', {month:'short'})} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleString('es-ES', {month:'short'})}`;

    for (let i = 0; i < 7; i++) {
        let d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        let key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        
        let qty = h.history[key] || 0;
        let isToday = d.toDateString() === new Date().toDateString();
        let isComplete = qty >= h.goal;

        // Calculamos la altura relativa al máximo de la semana
        let heightPercentage = (qty / maxInChart) * 100;

        if (bars[i]) {
            // 1. Ajuste de altura y color
            bars[i].style.height = `${heightPercentage}%`;
            bars[i].style.backgroundColor = isToday ? h.iconColor : "#D1D1D6"; // Color solo si es hoy
            
            // 2. Gestionar el Check (si qty >= goal)
            // Eliminamos check anterior si existe
            const existingCheck = daysContainer[i].querySelector('.check-mark');
            if (existingCheck) existingCheck.remove();

            if (isComplete) {
                const check = document.createElement('div');
                check.className = 'check-mark';
                check.textContent = '􀁣'; // Icono de check (SF Pro)
                check.style.cssText = `color: ${h.iconColor};`;
                daysContainer[i].appendChild(check);
            }

            // 3. Estilo del texto inferior
            const dayLabel = daysContainer[i].querySelector('.dayLabel');
            dayLabel.style.color = isToday ? h.iconColor : "#8E8E93";
            dayLabel.style.fontWeight = isToday ? 'bold' : '500';
        } 
    }
}

document.getElementById('prevWeek').onclick = () => {
    weekOffset--;
    updateChart();
};

document.getElementById('nextWeek').onclick = () => {
    weekOffset++;
    updateChart();
};

updateChart();

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

document.getElementById('confirmIconBtn').onclick = () => {
    // 1. Guardar el icono seleccionado (suponiendo que guardas la clase o el texto)
    const activeIcon = document.querySelector('.icon-item.selected');
    if (activeIcon) {
        selectedIcon = activeIcon.innerText;
        // 2. Actualizar el trigger en el formulario de creación
        document.getElementById('iconPickerTrigger').innerText = selectedIcon;
    }
    
    // 3. El flujo de cierre/apertura
    closeSheet('iconPickerSheet');
    openSheet('createSheet'); 
};

// Editar desde la vista de detalle
function editHabit() {
    const h = habits[currentHabitIdx];
    document.getElementById('hName').value = h.name;
    document.getElementById('uSing').value = h.uSing;
    document.getElementById('uPlur').value = h.uPlur;
    document.getElementById('hGoal').value = h.goal;
    document.getElementById('hStep').value = h.step;
    document.getElementById('hTime').value = h.time || '';
    
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