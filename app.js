
   document.addEventListener('DOMContentLoaded', () => {
   const dateInput = document.getElementById('selectedDate');
   const today = new Date();
   const yyyy = today.getFullYear();
   const mm = String(today.getMonth() + 1).padStart(2, '0');
   const dd = String(today.getDate()).padStart(2, '0');
   dateInput.value = `${yyyy}-${mm}-${dd}`;

   // Actualizamos la variable global
   selectedDate = dateInput.value;
updateRoutineSelects(); // Llena el selector de rutinas al iniciar
    renderHabits();         // Dibuja la vista inicial
});

const addBtn = document.getElementById('addHabitBtn');
const sheet = document.querySelector('.sheetContent');

addBtn.addEventListener('click', () => {
  addBtn.classList.add('clickAnim');

  setTimeout(() => {
    sheet.classList.add('active'); // abre la sheet después de 400ms
    addBtn.classList.remove('clickAnim');
  }, 400); // delay mayor que la animación para que el feedback termine antes
});


function genId(){
    return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}
let routines = JSON.parse(localStorage.getItem('routines') || '[]');
let habits = JSON.parse(localStorage.getItem('habits') || '[]');
habits.forEach(h => { if(!h.id) h.id = genId(); });
localStorage.setItem('habits', JSON.stringify(habits));

let currentHabitIdx = null;
let calDate = new Date();
const dateInput = document.getElementById('selectedDate');
dateInput.value = new Date().toISOString().split('T')[0];
let selectedDate = dateInput.value;

let isNavigatingFromRoutine = false;
let activeSheet = null;
let previousSheet = null;

function resetCreateForm() {
    document.getElementById('hName').value = '';
    document.getElementById('uSing').value = '';
    document.getElementById('uPlur').value = '';
    document.getElementById('hGoal').value = '';
    document.getElementById('hStep').value = '';

    selectedIcon = '􀓔';
    selectedColor = '#0076ff';
    iconTrigger.textContent = selectedIcon;
    iconTrigger.style.color = selectedColor;

    colorPicker.value = selectedColor;
    preview.style.background = selectedColor;
    wrap.classList.remove('active');
    presetRadios.forEach(r => r.checked = false);
}

let zCounter = 1000;
let ignoreNextClick = false;

function openSheet(id) {
    if (activeSheet === id) return;
    ignoreNextClick = true;

    const content = document.getElementById(id);
    
    // Al abrir una nueva hoja, SIEMPRE cerramos la anterior (limpieza total)
    if (activeSheet) {
        const old = document.getElementById(activeSheet);
        old.classList.remove('active');
        // Usamos un pequeño delay para el display none para que no desaparezca de golpe 
        // si hay efectos visuales, pero para la lógica de "hijas", esto asegura orden.
        setTimeout(() => {
            if (activeSheet !== id) old.style.display = 'none';
        }, 400);
    }

    previousSheet = activeSheet;
    activeSheet = id;
    zCounter++;
    
    content.style.zIndex = zCounter;

    // Ejecutamos la subida en el siguiente frame para asegurar la animación
    requestAnimationFrame(() => {
        content.classList.add('active');
    });
}

function closeSheet(id = activeSheet, cb = null) {
    const content = document.getElementById(id);
    if (!content || content.classList.contains('closing')) return;

    ignoreNextClick = true;
    content.classList.remove('active');
    content.classList.add('closing');

    // ¿Debemos volver a la rutina?
    const shouldReturnToRoutine = (id !== 'routineViewSheet' && isNavigatingFromRoutine);

    content.addEventListener('transitionend', function handler() {
        content.style.display = 'none';
        content.classList.remove('closing');
        
        if (shouldReturnToRoutine) {
            // Re-abrimos la rutina con su animación normal
            // El activeSheet se actualiza dentro de openSheet
            openSheet('routineViewSheet');
        } else {
            // Si cerramos la rutina o un hábito del home
            if (activeSheet === id) activeSheet = null;
            if (id === 'routineViewSheet') isNavigatingFromRoutine = false;
        }

        if (cb) cb();
        setTimeout(() => { ignoreNextClick = false; }, 100);
        content.removeEventListener('transitionend', handler);
    }, { once: true });
}
function closeSheet(id = activeSheet, cb = null) {
    const content = document.getElementById(id);
    if (!content || content.classList.contains('closing')) return;

    ignoreNextClick = true;
    content.classList.remove('active');
    content.classList.add('closing');

    // Detectamos si es una hija regresando a su madre (rutina)
    const returningToRoutine = (id !== 'routineViewSheet') && isNavigatingFromRoutine;

    content.addEventListener('transitionend', function handler() {
        content.style.display = 'none';
        content.classList.remove('closing');

        if (returningToRoutine) {
            // IMPORTANTE: La rutina YA está en display: block, 
            // solo le devolvemos la clase active para que suba (si bajó un poco)
            // y reactivamos sus clicks.
            activeSheet = 'routineViewSheet';
            const rtSheet = document.getElementById('routineViewSheet');
            rtSheet.style.pointerEvents = 'auto';
                openSheet('routineViewSheet');  // Add this line
        } else {
            // Si no hay rastro, limpiamos todo
            if (id === activeSheet) activeSheet = null;
            if (id === 'routineViewSheet') isNavigatingFromRoutine = false;
        }

        if (cb) cb();
        setTimeout(() => { ignoreNextClick = false; }, 100);
        content.removeEventListener('transitionend', handler);
    }, { once: true });
}
document.addEventListener('click', (e) => {
    if (document.getElementById('customPrompt').style.display === 'flex') return;
    if (ignoreNextClick || !activeSheet) return;

    const currentSheetEl = document.getElementById(activeSheet);
    if (currentSheetEl.classList.contains('closing')) return;

    if (!currentSheetEl.contains(e.target)) {
        closeSheet(activeSheet);
    }
});

const iconData = {
  "Naturaleza": [
    { "char": "􁔑", "name": "naturaleza viaje acampar campamento camp campañas" },
    { "char": "􁋩", "name": "naturaleza viaje tienda acampar campamento" },
    { "char": "􁗞", "name": "naturaleza paisaje montañas horiente" },
    { "char": "􁝰", "name": "naturaleza nature arbol tree bio bosque campo parque paseo"},
    { "char": "􀙖", "name": "naturaleza hogar paraguas sombrilla lluvia preparar" },
    { "char": "􁖏", "name": "naturaleza comida carrot verdura zanahoria vegetal vegetable nature" },
    { "char": "􁋻", "name": "naturaleza sombrilla playa salida paraguas lluvia sol relajacion" },
    { "char": "􁋺", "name": "naturaleza aire libre" },
    { "char": "􁂙", "name": "naturaleza plantas leaves hojas maceta" },
    { "char": "􁂂", "name": "naturaleza plantas flores jardin flowers" },
    { "char": "􀥳", "name": "naturaleza hojas de arbol leaves ecology plantas leaf" },
    { "char": "􀠒", "name": "naturaleza agua tomar water drink drops" },
    { "char": "􀙭", "name": "naturaleza fuego fire racha lumbre" },
    { "char": "􀆺", "name": "naturaleza tiempo moon cycle dormir sleep noche night luna" },
    { "char": "􀇁", "name": "naturaleza luna sparkles brillito brillos noche dormir cielo" },
    { "char": "􀆮", "name": "naturaleza tiempo sol sun brillo brightness protector dia day sky cielo" },
    { "char": "􀆲", "name": "naturaleza tiempo amanecer puesta de sol" },
    { "char": "􀆴", "name": "naturaleza tiempo atardecer puesta de sol" },
    { "char": "􀇣", "name": "naturaleza nubes clouds sky cielo nublado" },
    { "char": "􀓑", "name": "animales fauna tortuga animal lento" },
    { "char": "􀓏", "name": "animales fauna conejo bunny liebre saltar" },
    { "char": "􀌛", "name": "animales fauna hormiga insecto" },
    { "char": "􁗠", "name": "animales fauna ave pajaro paloma libre volar" },
    { "char": "􂁿", "name": "animales fauna gato cat misifus" },
    { "char": "􂀇", "name": "animales fauna perro cachorro doggy paseo" },
    { "char": "􁖑", "name": "animales fauna pez fish nadar atun comida" },
    { "char": "􀯕", "name": "animales fauna insecto catarina ladybug mariquita" },
    { "char": "􀾟", "name": "animales fauna paw patita pata perro gato huellas" },
    { "char": "􀆿", "name": "tecnologia ai inteligencia artificial estrellas brillos brillitos sparkles" },
    { "char": "􀫸", "name": "tecnologia sparkles ai inteligencia artificial" },
  ],

  "Deportes": [
    { "char": "􀛯", "name": "deportes medalla premio" },
    { "char": "􂎺", "name": "deportes pelota sports rugby entrenar juego" },
    { "char": "􀦥", "name": "deportes sports ball soccer entrenamiento gol partido futbol pelota balon" },
    { "char": "􁜧", "name": "deportes ball bola pelota tenis" },
    { "char": "􁜫", "name": "deportes ball bola pelota sports voli entrenamiento volley" },
    { "char": "􀠐", "name": "deportes ganar trofeo ganar obtener copa" },
    { "char": "􁏌", "name": "deportes medalla ganar" },
    { "char": "􁖍", "name": "deportes ejercicio workout entrenar entrenamiento pesas gym mancuernas" },
    { "char": "􂂲", "name": "deportes" },
    { "char": "􁗊", "name": "deportes ball baloncesto basquet etrenamiento pelota" },
    { "char": "􁗌", "name": "deportes americano soccer pelota entrenamiento futbol" },
    { "char": "􁔬", "name": "deportes entrenamiento win volibol volleyball" },
    { "char": "􁌋", "name": "deportes lagartijas entrenamiento yoga ejercicio crunch" },
    { "char": "􁔰", "name": "deportes juego saltar la cuerda lazo patio aire libre entrenamiento" },
    { "char": "􁌉", "name": "deportes bicicleta andar ir gym" },
    { "char": "􁌆", "name": "deportes nadar natacion mar salvavidas pool" },
    { "char": "􀝢", "name": "deportes walk caminar caminata paseo salir" }
  ],

  "Hogar y Limpieza": [
    { "char": "􁐟", "name": "electrodomesticos hogar refrigerador nevera heladera" },
    { "char": "􀐛", "name": "hogar oficina caja paquete box entrega" },
    { "char": "􁓃", "name": "limpieza hogar bañar bañarme bañarse ducha regadera" },
    { "char": "􁐫", "name": "limpieza hogar quehacer fregadero lavar llave grifo" },
    { "char": "􁐳", "name": "hogar muebles sofa sillon hueva descanso" },
    { "char": "􁐧", "name": "hogar electrodomesticos cocina" },
    { "char": "􁐿", "name": "limpieza hogar retrete inodoro escuzado baño caca popo" },
    { "char": "􀈒", "name": "limpieza hogar trash bin basura papelera" },
    { "char": "􁐡", "name": "limpieza hogar quehacer lavanderia laundry lavar lavadora ropa" },
    { "char": "􁐥", "name": "hogar electrodomesticos horno estufa cocinar" },
    { "char": "􀎡", "name": "hogar seguridad lock candado seguro" },
    { "char": "􁌝", "name": "hogar tecnologia foco lampara luz led" },
    { "char": "􀞄", "name": "hogar tecnologia slash tachado foco sin luz" },
    { "char": "􀟖", "name": "hogar seguridad key llaves llavero" },
    { "char": "􀠖", "name": "hogar gancho ropa guardar" },
    { "char": "􀑊", "name": "hogar regalo obsequio gift gratitud caja" },
    { "char": "􁎹", "name": "hogar electrodomesticos ventilador luz viento aire refrescar" },
    { "char": "􁐵", "name": "hogar muebles sofa sillon recreativo comoda relajar" },
    { "char": "􁖋", "name": "hogar limpieza laundry cesto campo picnic" },
    { "char": "􁐯", "name": "hogar quehacer ordenar mueble ropa ropero closet" },
    { "char": "􀙪", "name": "hogar descanso bed dormir sleep cama dormitorio" },
    { "char": "􀎟", "name": "hogar casa hogar house cabaña" }
  ],

  "Tecnologia y Comunicacion": [
    { "char": "􀌟", "name": " tecnologia camara fotografia tomar" },
    { "char": "􀡸", "name": "tecnología hogar enchufe cable conectar" },
    { "char": "􀪕", "name": "entretenimiento tecnología radio" },
    { "char": "􀜎", "name": "herramientas tecnologia varita magia ajustar reparar personalizar ai" },
    { "char": "􀬳", "name": "comunicacion megafono noticia avisar gritar" },
    { "char": "􀩯", "name": "tecnologia wifi modem internet" },
    { "char": "􀸸", "name": "tecnologia dispositivos devices airpods audifonos escuchar musica poner play" },
    { "char": "􀋞", "name": "tecnologia campana notificaciones alertas phone disturb" },
    { "char": "􀝗", "name": "tecnologia bell campana notificacion alerta phone" },
    { "char": "􀢋", "name": "tecnologia cargar bateria pila energia" },
    { "char": "􀟞", "name": "tecnologia dispositivos devices screentime tiempo en pantalla phone iphone celular telefono apps homescreen" },
    { "char": "􀙈", "name": "tecnologia wifi internet desconectar" },
    { "char": "􀙇", "name": "tecnologia wifi internet" },
    { "char": "􀊚", "name": "entretenimiento tecnologia video youtube" },
    { "char": "􀊄", "name": "entretenimiento tecnologia play reproducir video pelicula musica" },
    { "char": "􀌥", "name": "comunicacion burbuja mensaje bubble chat whatsapp imessage" },
    { "char": "􀍇", "name": "comunicacion tecnologia phone telefono call llamada decline rechazar colgar" },
    { "char": "􀌿", "name": "comunicacion tecnologia call phone llamada telefono" },
    { "char": "􀆿", "name": "tecnologia ai brillos brillitos sparkles" },
    { "char": "􀫸", "name": "tecnologia sparkles ai" },
    { "char": "􂤄", "name": "comunicacion manos hand saludo" },
    { "char": "􀉼", "name": "comunicacion no stop mano hand prohibido" },
    { "char": "􂤂", "name": "comunicacion hand mano saludo señal" },
    { "char": "􀆼", "name": "no molestar dnd do not disturb" },
  ],

  "Oficina y Educacion": [
    { "char": "􀎛", "name": "oficina archivos tecnología papeles imprimir impresora papel" },
    { "char": "􀤐", "name": "oficina trabajo papeles contrato negocio" },
    { "char": "􀈎", "name": "oficina redes editar escribir publicar post" },
    { "char": "􀋢", "name": "oficina etiqueta tag" },
    { "char": "􀉀", "name": "oficina archivos papeles documento imprimir hoja file pdf" },
    { "char": "􀥅", "name": "oficina news noticias periodico paper" },
    { "char": "􀢠", "name": "oficina maletero cv" },
    { "char": "􀫔", "name": "educacion escuela birrete" },
    { "char": "􀖆", "name": "educacion lectura leer anteojos lentes gafas" },
    { "char": "􀈖", "name": "oficina files papeles documentos archivos folder carpeta workspace" },
    { "char": "􁰎", "name": "educacion experimento ciencia quimica" },
    { "char": "􁙢", "name": "oficina tecnologia subir archivo actualizar documento backup" },
    { "char": "􀐙", "name": "educacion cube cubo conocimiento aprendizaje campo" },
    { "char": "􀬓", "name": "educacion estante libreria biblioteca libros lectura ordenar" },
    { "char": "􁂥", "name": "oficina analiticas matematicas tracking estadisticas grafica tarea seguimiento tracker" },
    { "char": "􀫖", "name": "educacion test texto libro book escuela aprender" },
    { "char": "􁻧", "name": "oficina pendientes calendario tarea evento check" },
    { "char": "􀉉", "name": "oficina calendar caledario planear planeacion agenda" },
    { "char": "􀉛", "name": "educacion lectura libro leer book reading" },
    { "char": "􀤟", "name": "educacion lectura libro book diario journal" },
    { "char": "􀫘", "name": "educacion lectura diario journal libro" }
  ],

  "Entretenimiento y juego": [
    { "char": "􁐈", "name": "entretenimiento cine pelicula palomitas" },
    { "char": "􀥮", "name": "juego entretenimiento rompecabezas extension" },
    { "char": "􀲭", "name": "juego hogar teddy teddybear osito oso peluche" },
    { "char": "􀺨", "name": "entretenimiento chiste gracioso teatro caras burla" },
    { "char": "􀪄", "name": "entretenimiento boleto ticket" },
    { "char": "􀈠", "name": "juego avion papel manualidad" },
    { "char": "􀑫", "name": "entretenimiento cantar practica entrenamiento karaoke microfono" },
    { "char": "􁶺", "name": "entretenimiento pelicula cinematografia" },
    { "char": "􀑈", "name": "entretenimiento escuchar musica audifonos" },
    { "char": "􀛹", "name": "juego tecnologia juegos jugar consola xbox ps videojuegos game" },
    { "char": "􁖪", "name": "entretenimiento birthday cumpleaños fiesta pastel torta" },
    { "char": "􀙌", "name": "entretenimiento feliz happy face emoji mood" },
  ],

  "Salud y cuidado": [
    { "char": "􁌋", "name": "deportes lagartijas entrenamiento yoga ejercicio crunch" },
    { "char": "􁌓", "name": "deportes estiramiento entrenamiento gym ejercicio" },
    { "char": "􁐃", "name": "deportes pesas mancuernas repeticiones entrenamiento gym" },
    { "char": "􁖍", "name": "deportes ejercicio workout entrenar entrenamiento pesas gym mancuernas" },
    { "char": "􂂲", "name": "bolso equipaje gym"},
    { "char": "􀝾", "name": "salud doctor chequeo ritmo cardiaco hospital" },
    { "char": "􁻈", "name": "salud accesorios anteojos lentes gafas vista ver" },
    { "char": "􁚮", "name": "salud medicina medicamento pastilla capsula pildora" },
    { "char": "􀠲", "name": "salud capsulas medicamento medicina botiquin pastillas" },
    { "char": "􀦉", "name": "salud limpieza peinar peine pelo cabello estetica cepillo cepillar" },
    { "char": "􂃈", "name": "salud mente cerebro cabeza pensamiento" },
    { "char": "􂂇", "name": "salud cerebro brain" },
    { "char": "􀲯", "name": "limpieza salud lavar manos wash hands sparkles" },
    { "char": "􀦛", "name": "salud pulmones respirar respiracion lungs" },
    { "char": "􀦪", "name": "salud lips boca dientes lavar exfoliacion labios" },
    { "char": "􁔴", "name": "salud meditacion chi relajacion meditate maditation meditar" },
    { "char": "􀠒", "name": "salud naturaleza agua tomar water drink drop sangre menstruacion" }
  ],

  "Herramientas y arte": [
    { "char": "􀤉", "name": "herramientas tools destornillador reparar" },
    { "char": "􀎖", "name": "herramientas tools perico llave" },
    { "char": "􀎒", "name": "herramientas arte pintar pintura brocha personalizar brush" },
    { "char": "􀣷", "name": "herramientas arte brush pincel pintar pintura" },
    { "char": "􀙅", "name": "herramientas tools martillo reparar" }
  ],

  "Alimentos y bebidas": [
    { "char": "􀻑", "name": "comida bebida rapida compra" },
    { "char": "􁎥", "name": "comida copa beber wine vino lujo" },
    { "char": "􁞵", "name": "comida taza cup vaso cafe" },
    { "char": "􀻓", "name": "comida menu papel restaurante leer" },
    { "char": "􁐆", "name": "comida hogar huevo sarten desayuno morning oven pan" },
    { "char": "􀸙", "name": "comida taza de cafe cup te coffee" },
    { "char": "􂊭", "name": "comida cafe te caliente coffe tea cup" }
  ],

  "Ropa y accesorios": [
    { "char": "􁣲", "name": "ropa outfit zapatos tenis tennis" },
    { "char": "􀾡", "name": "ropa outfit playera camiseta blusa clothing shirt vestir" },
    { "char": "􂏱", "name": "finanzas cartera dinero monedero gastos billetera" },
    { "char": "􂏭", "name": "ropa outfit abrigo camisa formal vestimenta clothing" },
    { "char": "􂏧", "name": "ropa outfit sombrero clothing hat sol" },
    { "char": "􂏩", "name": "ropa outfit sobrero hat gorra clothing sol" },
    { "char": "􁞹", "name": "ropa bolso bolsa compras cartera girl" },
    { "char": "􂏤", "name": "ropa outfit abrigo chaqueta vestimenta vestir clothing" }
  ],

  "Transporte y viajes": [
    { "char": "􀰰", "name": "transporte letrero camino señal" },
    { "char": "􀶊", "name": "viaje maleta equipaje documentos archivos prepara" },
    { "char": "􀙋", "name": "viaje mapa location ubicacion ubicar maps" },
    { "char": "􀵟", "name": "transporte gasolina rellenar fuel" },
    { "char": "􀎝", "name": "viaje equipaje maleta purse man" },
    { "char": "􀙙", "name": "transporte carro conducir carretera trafico salir coche automovil" },
    { "char": "􀡥", "name": "transporte deportes bicicleta andar salir pasear" },
    { "char": "􀑓", "name": "transporte airplane airplane mode avion aeropuerto viaje" },
    { "char": "􁝍", "name": "transporte stop alto signal señal" }
  ],

  "Animales": [
    { "char": "􀓑", "name": "animales fauna tortuga animal lento" },
    { "char": "􀓏", "name": "animales fauna conejo bunny liebre saltar" },
    { "char": "􀌛", "name": "animales fauna hormiga insecto" },
    { "char": "􁗠", "name": "animales fauna ave pajaro paloma libre volar" },
    { "char": "􂁿", "name": "animales fauna gato cat misifus" },
    { "char": "􂀇", "name": "animales fauna perro cachorro doggy paseo" },
    { "char": "􁖑", "name": "animales fauna pez fish nadar atun comida" },
    { "char": "􀯕", "name": "animales fauna insecto catarina ladybug mariquita" },
    { "char": "􀾟", "name": "animales fauna paw patita pata perro gato huellas" }
  ],

  "Tiempo y productividad": [
    { "char": "􀖇", "name": "tiempo tecnologia temporizador reloj hora" },
    { "char": "􀐫", "name": "tiempo reloj clock" },
    { "char": "􀐮", "name": "tiempo tecnologia alarma despertador reloj" },
    { "char": "􁻧", "name": "oficina pendientes calendario tarea evento check" },
    { "char": "􀉉", "name": "oficina calendar caledario planear planeacion agenda" },
  ],
}
let selectedIcon = '􀓔';
const iconTrigger = document.getElementById('iconPickerTrigger');
const colorPicker = document.getElementById('iconColorPicker');

const preview = document.getElementById('colorPreview');
const wrap = document.querySelector('.colorPickerWrap');

preview.style.background = colorPicker.value;

colorPicker.addEventListener('input', e => {
    preview.style.background = e.target.value;
    wrap.classList.add('active');
    selectedColor = e.target.value;
    iconTrigger.style.color = selectedColor;
});

const presetRadios = document.querySelectorAll('input[name="presetColor"]');
let selectedColor = colorPicker.value;

function initIcons(filter = "") {
    const grid = document.getElementById('iconGrid');
    grid.innerHTML = "";
    const searchLower = filter.toLowerCase();

    for (const [category, icons] of Object.entries(iconData)) {
        const filteredIcons = icons.filter(icon => 
            icon.name.toLowerCase().includes(searchLower)
        );

        if (filteredIcons.length > 0) {
            // CONTENEDOR DE CATEGORÍA
            const catWrap = document.createElement('div');
            catWrap.className = 'iconCategory';

            const catHeader = document.createElement('div');
            catHeader.className = 'categoryTitle';
            catHeader.textContent = category;

            const subGrid = document.createElement('div');
            subGrid.className = 'iconGridSub';

            filteredIcons.forEach(icon => {
                const div = document.createElement('div');
                div.className = 'iconItem';
                div.textContent = icon.char;

                if (icon.char === selectedIcon) {
                    div.classList.add('selected');
                    div.style.color = selectedColor;
                }

                div.onclick = () => {
                    document.querySelectorAll('.iconItem').forEach(i => {
                        i.classList.remove('selected');
                        i.style.color = '';
                    });
                    selectedIcon = icon.char;
                    div.classList.add('selected');
                    div.style.color = selectedColor;
                };

                subGrid.appendChild(div);
            });

            // ensamblar
            catWrap.appendChild(catHeader);
            catWrap.appendChild(subGrid);
            grid.appendChild(catWrap);
        }
    }
}

// Evento para el buscador
document.getElementById('iconSearch').addEventListener('input', (e) => {
    initIcons(e.target.value);
});

function backToCreate() {
    closeSheet(activeSheet, () => {
        if (previousSheet) openSheet(previousSheet);
    });
}

document.getElementById('confirmIconBtn').onclick = () => {
    iconTrigger.textContent = selectedIcon;
    iconTrigger.style.color = selectedColor;
    backToCreate();
};

colorPicker.addEventListener('input', e => {
    preview.style.background = e.target.value;
    wrap.classList.add('active'); // mostrar X del picker
    selectedColor = e.target.value;
    iconTrigger.style.color = selectedColor;

    // desmarcar presets
    presetRadios.forEach(r => r.checked = false);
});
presetRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.checked) {
            selectedColor = radio.value;
            colorPicker.value = radio.value;
            iconTrigger.style.color = selectedColor;
            wrap.classList.remove('active'); 
        }
    });
});
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
let currentView = 'habits'; // Estado global: 'habits' o 'routines'

function switchView(view) {
    currentView = view;
    renderHabits();
}

function renderHabits(updatedId = null) {
    const container = document.getElementById('habitsContainer');
    if (!container) return;

    // 1. Guardar posiciones para animación FLIP
    const firstPositions = {};
    [...container.children].forEach(el => {
        if (el.dataset.id) firstPositions[el.dataset.id] = el.getBoundingClientRect();
    });

    // 2. Filtrar hábitos por frecuencia (solo mostrar los que corresponden a la fecha seleccionada)
    const activeHabits = habits.filter(h => {
        const date = new Date(selectedDate + "T00:00:00");
        
        // --- NUEVA LÓGICA DE EXCLUSIÓN ---
        // Si estamos en la pestaña "Hábitos"
        if (currentView === 'habits') {
            // Si el hábito tiene RUTINA Y HORA Y es DIARIO -> EXCLUIR de esta vista
            if (h.routineId && h.time && h.frequency === 'daily') {
                return false;
            }
        }
        // ---------------------------------

        if (!h.frequency || h.frequency === 'daily') return true;
        if (h.frequency === 'weekly') return date.getDay() === 1; 
        if (h.frequency === 'monthly') return date.getDate() === 1;
        return true;
    });
    // 3. Renderizar según la vista seleccionada
    if (currentView === 'habits') {
        // VISTA INDIVIDUAL: Ordenar por completado y luego por hora
        const sorted = [...activeHabits].sort((a, b) => {
            const ca = (a.history[selectedDate] || 0) >= a.goal;
            const cb = (b.history[selectedDate] || 0) >= b.goal;
            if (ca !== cb) return ca ? 1 : -1;
            return (a.time || "99:99").localeCompare(b.time || "99:99");
        });
        container.innerHTML = sorted.map(h => getHabitCardHTML(h, updatedId)).join('');
    } else {
        // VISTA RUTINAS: Agrupar por routineId
        if (routines.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:#8e8e93; margin-top:40px; font-size:14px;">No hay rutinas creadas</div>`;
        }
        else {
            container.innerHTML = routines.map(rt => {
                const habitsInRt = activeHabits.filter(h => h.routineId === rt.id);
                if (habitsInRt.length === 0) return '';
                
                const done = habitsInRt.filter(h => (h.history[selectedDate] || 0) >= h.goal).length;
                const total = habitsInRt.length;
                const isPerfect = done === total;
                const progress = (done / total) * 100;

                return `
                    <div class="routineCard ${isPerfect ? 'perfect' : ''}" data-id="${rt.id}" onclick="openRoutineView('${rt.id}')">
                        <div class="rtInfo">
                            <div class="rtTitle">${rt.name}</div>
                            <div class="rtStats">${done} de ${total} pasos completados</div>
                        </div>
                        <div class="rtProgressRing">
                            <svg viewBox="0 0 36 36" class="circular-chart">
                                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path class="circle" stroke-dasharray="${progress}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div class="rtIcon">${isPerfect ? '􀆅' : '􀯶'}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // 4. Ejecutar animaciones de barras y posiciones (FLIP)
    applyAnimations(container, firstPositions);
}
function promptNewRoutine(event) {
    // Esto evita que el click en el botón "+" cierre la sheet de atrás
    if (event) event.stopPropagation(); 
    
    const overlay = document.getElementById('customPrompt');
    const input = document.getElementById('routineInput');
    overlay.style.display = 'flex';
    input.value = '';
    setTimeout(() => input.focus(), 50); // Pequeño delay para asegurar el focus
}

function closeCustomPrompt(event) {
    if (event) event.stopPropagation(); // Evita que al cerrar el modal se cierre la sheet
    document.getElementById('customPrompt').style.display = 'none';
}

function confirmCustomPrompt() {
    const name = document.getElementById('routineInput').value.trim();
    
    if (name) {
        const newRoutine = {
            id: 'rt-' + Date.now().toString(36),
            name: name
        };
        
        routines.push(newRoutine);
        localStorage.setItem('routines', JSON.stringify(routines));
        
        updateRoutineSelects();
        document.getElementById('hRoutine').value = newRoutine.id;
        
        closeCustomPrompt();
    } else {
        // Podrías añadir un efecto de vibración si el input está vacío
        document.querySelector('.custom-alert').style.animation = 'shake 0.3s';
        setTimeout(() => document.querySelector('.custom-alert').style.animation = '', 300);
    }
}
// Asegúrate de que esta función esté definida para llenar el select
function updateRoutineSelects() {
    const select = document.getElementById('hRoutine');
    if (!select) return;
    
    const currentValue = select.value; // Guardar selección actual
    select.innerHTML = '<option value="">Ninguna (Hábito suelto)</option>';
    
    routines.forEach(rt => {
        const opt = document.createElement('option');
        opt.value = rt.id;
        opt.textContent = rt.name;
        select.appendChild(opt);
    });
    
    select.value = currentValue; // Restaurar selección
}
// Helper para generar el HTML de la tarjeta (basado en tu código original)
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

// Función para manejar las animaciones visuales
function applyAnimations(container, firstPositions) {
    requestAnimationFrame(() => {
        const bars = container.querySelectorAll('.habitProgressBarInner');
        bars.forEach(bar => {
            if (bar.style.width !== bar.dataset.w) {
                bar.getBoundingClientRect(); 
                bar.style.width = bar.dataset.w;
            }
        });

        [...container.children].forEach(el => {
            if (!el.dataset.id) return;
            const last = el.getBoundingClientRect();
            const first = firstPositions[el.dataset.id];
            if (!first) return;
            const dy = first.top - last.top;
            if (dy === 0) return;
            el.style.transform = `translateY(${dy}px)`;
            el.style.transition = 'none';
            requestAnimationFrame(() => { 
                el.style.transform = ''; 
                el.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'; 
            });
        });
    });
}
// Variable para saber qué rutina estamos viendo
let currentRoutineId = null;

function openRoutineView(routineId) {
    isNavigatingFromRoutine = true; // <--- Marcamos el rastro
    currentRoutineId = routineId;
    const rt = routines.find(r => r.id === routineId);
    if (!rt) return;

    // Título y racha
    document.getElementById('rtViewTitle').textContent = rt.name;
    // Filtramos los hábitos que pertenecen a la rutina
const habitsInRt = habits.filter(h => h.routineId === rt.id);

// Ordenamos: primero por hora, y los que no tienen hora al final
habitsInRt.sort((a, b) => {
    // Si ambos no tienen hora, se quedan igual entre ellos
    if (!a.time && !b.time) return 0;
    
    // Si 'a' no tiene hora, lo mandamos al final (le damos prioridad a 'b')
    if (!a.time) return 1;
    
    // Si 'b' no tiene hora, lo mandamos al final (le damos prioridad a 'a')
    if (!b.time) return -1;
    
    // Si ambos tienen hora, comparamos normalmente (ej: "08:00" vs "14:00")
    return a.time.localeCompare(b.time);
});

    const list = document.getElementById('rtHabitsList');
    list.innerHTML = habitsInRt.map(h => getHabitCardHTML(h)).join('');

    openSheet('routineViewSheet');
}

// Función para renombrar (Usa tu custom modal)
function editRoutineName() {
    const rt = routines.find(r => r.id === currentRoutineId);
    
    // Reutilizamos tu Custom Prompt pero cambiamos el título dinámicamente
    document.querySelector('#customPrompt .alert-title').textContent = "Renombrar Rutina";
    const input = document.getElementById('routineInput');
    input.value = rt.name;
    
    document.getElementById('customPrompt').style.display = 'flex';
    input.focus();

    // Sobreescribimos temporalmente el botón de confirmar del modal
    document.querySelector('#customPrompt .confirm').onclick = () => {
        const newName = input.value.trim();
        if (newName) {
            rt.name = newName;
            localStorage.setItem('routines', JSON.stringify(routines));
            document.getElementById('rtViewTitle').textContent = newName;
            renderHabits();
            closeCustomPrompt();
        }
    };
}

// Función para eliminar
function deleteRoutine() {
    if (confirm('¿Quieres eliminar esta rutina? Los hábitos no se borrarán.')) {
        // Desvincular hábitos
        habits.forEach(h => {
            if (h.routineId === currentRoutineId) h.routineId = null;
        });
        
        // Eliminar rutina
        routines = routines.filter(r => r.id !== currentRoutineId);
        
        localStorage.setItem('routines', JSON.stringify(routines));
        localStorage.setItem('habits', JSON.stringify(habits));
        
        closeSheet('routineViewSheet');
        renderHabits();
    }
}
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
function handleCloseHabit() {
    closeSheet('viewSheet');
}
// 1. Modificamos la función de cierre de rutina
function closeRoutineSheet() {
    // CLAVE: Apagamos el rastro ANTES de llamar al cierre
    isNavigatingFromRoutine = false; 
    activeSheet = null; 
    previousSheet = null;
    
    closeSheet('routineViewSheet');
}

function updateQty(dir, idx = null) {
    const i = (idx !== null) ? idx : currentHabitIdx;
    if (i === null) return;
    const h = habits[i];
    const current = h.history[selectedDate] || 0;
    
    h.history[selectedDate] = Math.max(0, current + (dir * h.step));
    
    if (idx === null) document.getElementById('vQtyManual').value = h.history[selectedDate];
    
    localStorage.setItem('habits', JSON.stringify(habits));
    // Pasamos el ID para que solo este hábito se anime
    renderHabits(h.id); 
}

document.getElementById('vQtyManual').onchange = (e) => {
    habits[currentHabitIdx].history[selectedDate] = parseInt(e.target.value) || 0;
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
};
function setComplete() { 
    const h = habits[currentHabitIdx];
    h.history[selectedDate] = h.goal; 
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits(h.id); 
    
    handleCloseHabit(); // <--- En lugar de closeSheet('viewSheet')
}

function clearQty() { 
    habits[currentHabitIdx].history[selectedDate] = 0; 
    localStorage.setItem('habits', JSON.stringify(habits)); 
    renderHabits(); 
    
    handleCloseHabit(); // <--- En lugar de closeSheet('viewSheet')
}
function saveHabit() {
    const name = document.getElementById('hName').value.trim();
    const goal = parseInt(document.getElementById('hGoal').value, 10);
    const step = parseInt(document.getElementById('hStep').value, 10);

    // Validación básica
    if (!name) { alert('El nombre es obligatorio'); return; }
    if (isNaN(goal) || isNaN(step) || goal <= 0 || step <= 0) {
        alert('Ingresa números válidos en Meta y Paso');
        return;
    }

    // Captura de los nuevos campos
    const time = document.getElementById('hTime').value; // Retorna "HH:MM"
    const frequency = document.getElementById('hFreq').value; // "daily", "weekly", "monthly"
    const routineId = document.getElementById('hRoutine').value; // ID de la rutina o ""

    const h = {
        id: currentHabitIdx !== null ? habits[currentHabitIdx].id : genId(),
        name: name,
        uSing: document.getElementById('uSing').value || 'vez',
        uPlur: document.getElementById('uPlur').value || 'veces',
        goal: goal,
        step: step,
        time: time || null, // Guardamos la hora
        frequency: frequency, // Guardamos frecuencia
        routineId: routineId || null, // Guardamos relación con rutina
        icon: selectedIcon,
        iconColor: selectedColor,
        history: currentHabitIdx !== null ? habits[currentHabitIdx].history : {}
    };

    if (currentHabitIdx !== null) {
        habits[currentHabitIdx] = h;
    } else {
        habits.push(h);
    }

    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
    closeSheet('createSheet');
    resetCreateForm();
}
function editHabit() {
    const h = habits[currentHabitIdx];
    document.getElementById('hName').value = h.name;
    document.getElementById('uSing').value = h.uSing;
    document.getElementById('uPlur').value = h.uPlur;
    document.getElementById('hGoal').value = h.goal;
    document.getElementById('hStep').value = h.step;
    selectedIcon = h.icon;
    selectedColor = h.iconColor;
    iconTrigger.textContent = h.icon;
    iconTrigger.style.color = h.iconColor;
    closeSheet('viewSheet');
    openSheet('createSheet');
}

function deleteHabit() {
    if(confirm('¿Borrar hábito?')) {
        habits.splice(currentHabitIdx, 1);
        localStorage.setItem('habits', JSON.stringify(habits));
        renderHabits(); 
        closeSheet('viewSheet');
    }
}
function getWeekOffset(targetDateStr) {
    let now = new Date();
    now.setHours(0, 0, 0, 0);

    // Lunes de la semana de "hoy"
    let dayNow = now.getDay();
    let diffNow = (dayNow === 0 ? -6 : 1) - dayNow;
    let mondayNow = new Date(now);
    mondayNow.setDate(now.getDate() + diffNow);

    // Lunes de la fecha seleccionada
    let target = new Date(targetDateStr + "T00:00:00"); // Forzamos hora local
    let dayTarget = target.getDay();
    let diffTarget = (dayTarget === 0 ? -6 : 1) - dayTarget;
    let mondayTarget = new Date(target);
    mondayTarget.setDate(target.getDate() + diffTarget);

    const msInWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.round((mondayTarget - mondayNow) / msInWeek);
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

document.getElementById('addHabitBtn').onclick = () => { 
    currentHabitIdx = null; 
    resetCreateForm();
    openSheet('createSheet'); 
};

document.getElementById('iconPickerTrigger').onclick = () => openSheet('iconPickerSheet');
dateInput.onchange = (e) => { selectedDate = e.target.value; renderHabits(); };

initIcons();
renderHabits();
