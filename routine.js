// --- LÓGICA DE RUTINAS ---

function renderRoutinesView(container, activeHabits) {
    if (routines.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:#8e8e93; margin-top:40px;">No hay rutinas</div>`;
        return;
    }

    container.innerHTML = routines.map(rt => {
        const habitsInRt = activeHabits.filter(h => h.routineId === rt.id);
        if (habitsInRt.length === 0) return '';
        const done = habitsInRt.filter(h => (h.history[selectedDate] || 0) >= h.goal).length;
        const total = habitsInRt.length;
        const progress = (done / total) * 100;

        return `
            <div class="routineCard ${done === total ? 'perfect' : ''}" onclick="openRoutineView('${rt.id}')">
                <div class="rtInfo">
                    <div class="rtTitle">${rt.name}</div>
                    <div class="rtStats">${done} de ${total} completados</div>
                </div>
                <div class="rtProgressRing">
                    <svg viewBox="0 0 36 36" class="circular-chart">
                        <path class="circle" stroke-dasharray="${progress}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                </div>
            </div>`;
    }).join('');
}

function openRoutineView(routineId) {
    isNavigatingFromRoutine = true;
    currentRoutineId = routineId;
    const rt = routines.find(r => r.id === routineId);
    document.getElementById('rtViewTitle').textContent = rt.name;
    const habitsInRt = habits.filter(h => h.routineId === rt.id);
    document.getElementById('rtHabitsList').innerHTML = habitsInRt.map(h => getHabitCardHTML(h)).join('');
    openSheet('routineViewSheet');
}

function confirmCustomPrompt() {
    const name = document.getElementById('routineInput').value.trim();
    if (name) {
        const newRt = { id: 'rt-' + Date.now().toString(36), name };
        routines.push(newRt);
        localStorage.setItem('routines', JSON.stringify(routines));
        updateRoutineSelects();
        closeCustomPrompt();
        renderHabits();
    }
}

function updateRoutineSelects() {
    const select = document.getElementById('hRoutine');
    if (!select) return;
    select.innerHTML = '<option value="">Ninguna</option>' + 
        routines.map(rt => `<option value="${rt.id}">${rt.name}</option>`).join('');
}

function deleteRoutine() {
    if (confirm('¿Eliminar rutina? (Los hábitos se conservarán)')) {
        habits.forEach(h => { if (h.routineId === currentRoutineId) h.routineId = null; });
        routines = routines.filter(r => r.id !== currentRoutineId);
        localStorage.setItem('routines', JSON.stringify(routines));
        localStorage.setItem('habits', JSON.stringify(habits));
        closeSheet('routineViewSheet');
        renderHabits();
    }
}

function switchView(view) {
    currentView = view;
    renderHabits();
}