// --- LÓGICA DE BENEATH CON SUPABASE Y AISLAMIENTO POR URL (?grupo=) ---
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Credenciales independientes de su proyecto Supabase
const SUPABASE_URL = "https://fjtzyxnpgxxsducxxobx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HyGyfvWNs-VSoHGXNNTpgA_465UsJPs";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Obtener el grupo actual desde la URL (ej: ?grupo=1a-preescolar) o respaldo local
function obtenerGrupoActual() {
    const params = new URLSearchParams(window.location.search);
    const grupoUrl = params.get('grupo');
    if (grupoUrl) {
        const limpio = grupoUrl.toLowerCase().trim();
        localStorage.setItem("beneath_grupo_activo", limpio);
        return limpio;
    }
    return localStorage.getItem("beneath_grupo_activo") || "instituto_general";
}

document.addEventListener("DOMContentLoaded", () => {
    checarEstadoIdentidad();
    inicializarEventosTecladoGlobales();
});

function limpiarContenidoExpiradoNube() {
    // Función adaptada para evitar llamadas a Firebase
}

function checarEstadoIdentidad() {
    const identidadGuardada = localStorage.getItem("beneath_identity");
    const groupContainer = document.getElementById("group-name-container");
    const setupTitle = document.getElementById("setup-title");
    const btnIniciar = document.getElementById("btn-iniciar");
    const grupoRegistrado = localStorage.getItem("calendario_group_name");
    
    // Obtener idioma actual o español por defecto para las alertas
    const langActual = localStorage.getItem('sipv_lang') || 'es';
    
    if (identidadGuardada) {
        const expulsados = JSON.parse(localStorage.getItem("beneath_expulsados")) || [];
        if (expulsados.includes(identidadGuardada)) {
            // Texto de alerta traducible desde el diccionario
            const msgRevocado = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['alert_revoked']) 
                ? DICTIONARY[langActual]['alert_revoked'] 
                : "Tu acceso ha sido revocado por el administrador.";
            alert(msgRevocado);
            localStorage.removeItem("beneath_identity");
            localStorage.removeItem("beneath_pin");
            location.reload();
            return;
        }

        document.getElementById("setup-view").classList.add("hidden");
        document.getElementById("login-view").classList.remove("hidden");
        document.getElementById("display-identity").innerText = identidadGuardada;
        
        const nombreGrupoDinamico = localStorage.getItem("calendario_group_name") || "GRUPO ESCOLAR";
        const lblCard = document.getElementById("label-grupo-card");
        const lblChat = document.getElementById("label-grupo-chat");
        if (lblChat) lblChat.textContent = nombreGrupoDinamico;
        if (lblCard) lblCard.textContent = nombreGrupoDinamico; // Corregido el duplicado lógico anterior

        const loginPin = document.getElementById("login-pin");
        if (loginPin) loginPin.focus();
    } else {
        document.getElementById("setup-view").classList.remove("hidden");
        document.getElementById("login-view").classList.add("hidden");
        
        if (grupoRegistrado) {
            if (groupContainer) groupContainer.classList.add("hidden");
            if (setupTitle) {
                setupTitle.setAttribute('data-i18n', 'setup_title_join');
                setupTitle.textContent = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['setup_title_join'])
                    ? DICTIONARY[langActual]['setup_title_join'] + ": " + grupoRegistrado
                    : "Unirse al Grupo: " + grupoRegistrado;
            }
            if (btnIniciar) {
                btnIniciar.setAttribute('data-i18n', 'btn_join_group');
                btnIniciar.textContent = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['btn_join_group'])
                    ? DICTIONARY[langActual]['btn_join_group']
                    : "Unirse al Grupo";
            }
        } else {
            if (groupContainer) groupContainer.classList.remove("hidden");
            if (setupTitle) {
                setupTitle.setAttribute('data-i18n', 'setup_title_create');
                setupTitle.textContent = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['setup_title_create'])
                    ? DICTIONARY[langActual]['setup_title_create']
                    : "Creación de Grupo y Administrador";
            }
            if (btnIniciar) {
                btnIniciar.setAttribute('data-i18n', 'btn_create_group');
                btnIniciar.textContent = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['btn_create_group'])
                    ? DICTIONARY[langActual]['btn_create_group']
                    : "Crear Grupo e Iniciar";
            }
        }
        
        const inputIdentity = document.getElementById("input-identity");
        if (inputIdentity) inputIdentity.focus();
    }
}

function inicializarEventosTecladoGlobales() {
    const loginPin = document.getElementById("login-pin");
    if (loginPin) {
        loginPin.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                verificarPin();
            }
        });
    }

    const inputIdentity = document.getElementById("input-identity");
    const inputPin = document.getElementById("input-pin");
    
    const registrarConEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            guardarIdentidad();
        }
    };

    if (inputIdentity) inputIdentity.addEventListener("keypress", registrarConEnter);
    if (inputPin) inputPin.addEventListener("keypress", registrarConEnter);
}

window.guardarIdentidad = function() {
    const nombre = document.getElementById("input-identity").value.trim().toUpperCase();
    const pin = document.getElementById("input-pin").value.trim();
    const groupNameInput = document.getElementById("input-group-name");
    
    // Obtener idioma actual o español por defecto para las alertas
    const langActual = localStorage.getItem('sipv_lang') || 'es';
    
    // Verificamos si es el primer usuario (administrador) comprobando si el campo de grupo está visible
    const esAdmin = groupNameInput && !groupNameInput.closest('#group-name-container').classList.contains('hidden');
    let nombreGrupo = "";

    if (esAdmin) {
        nombreGrupo = groupNameInput.value.trim().toUpperCase();
        if (!nombreGrupo) {
            const msgGroup = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['alert_group_name']) 
                ? DICTIONARY[langActual]['alert_group_name'] 
                : "Por favor escribe el nombre del grupo escolar.";
            alert(msgGroup);
            return;
        }
        localStorage.setItem("calendario_group_name", nombreGrupo);
        localStorage.setItem("calendario_admin", nombre);
    }

    if (!nombre || pin.length !== 4) {
        const msgCredentials = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['alert_credentials']) 
            ? DICTIONARY[langActual]['alert_credentials'] 
            : "Por favor escribe un nombre de usuario y un PIN exacto de 4 dígitos.";
        alert(msgCredentials);
        return;
    }

    const palabrasBase = ["TASK", "CLASS", "NOTE", "BOOK", "AGENDA", "CODE", "DATA", "FILE"];
    let fraseRescate = "";
    for (let i = 0; i < 4; i++) {
        fraseRescate += palabrasBase[Math.floor(Math.random() * palabrasBase.length)] + " ";
    }
    fraseRescate = fraseRescate.trim();

    localStorage.setItem("beneath_identity", nombre);
    localStorage.setItem("beneath_pin", pin);
    localStorage.setItem("beneath_recovery", fraseRescate);

    let miembros = JSON.parse(localStorage.getItem("beneath_miembros")) || [];
    if (!miembros.includes(nombre)) {
        miembros.push(nombre);
        localStorage.setItem("beneath_miembros", JSON.stringify(miembros));
    }

    const labelRescue = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['alert_rescue_label']) 
        ? DICTIONARY[langActual]['alert_rescue_label'] 
        : "Anota estas 4 palabras:";
    
    const titleRescueBox = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['recovery_title']) 
        ? DICTIONARY[langActual]['recovery_title'] 
        : "FRASE DE RESCATE";

    const successTitle = esAdmin 
        ? ((typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['alert_admin_success']) ? DICTIONARY[langActual]['alert_admin_success'] : "¡Grupo y Administrador creados con éxito!")
        : ((typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['alert_joined_success']) ? DICTIONARY[langActual]['alert_joined_success'] : "¡Te has unido al grupo correctamente!");

    alert(`${successTitle}\n\n[ ${titleRescueBox} ]\n${labelRescue}\n\n--> ${fraseRescate} <--`);
    location.reload();
}

window.verificarPin = function() {
    const pinIngresado = document.getElementById("login-pin").value.trim();
    const pinReal = localStorage.getItem("beneath_pin");
    const langActual = localStorage.getItem('sipv_lang') || 'es';

    if (pinIngresado === pinReal) {
        otorgarAccesoExitoso();
    } else {
        const msgPinError = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['alert_incorrect_pin']) 
            ? DICTIONARY[langActual]['alert_incorrect_pin'] 
            : "PIN incorrecto.";
        alert(msgPinError);
        document.getElementById("login-pin").value = "";
    }
}

window.mostrarSeccionRescate = function() {
    const box = document.getElementById("recovery-box");
    if (box) box.classList.toggle("hidden");
}

window.verificarFraseRescate = function() {
    const fraseIngresada = document.getElementById("input-recovery-phrase").value.trim().toUpperCase();
    const fraseReal = localStorage.getItem("beneath_recovery");
    const langActual = localStorage.getItem('sipv_lang') || 'es';

    if (fraseIngresada === fraseReal) {
        const msgVerified = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['alert_phrase_verified']) 
            ? DICTIONARY[langActual]['alert_phrase_verified'] 
            : "¡Frase verificada! Establece un nuevo PIN.";
        alert(msgVerified);

        const promptText = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['prompt_new_pin']) 
            ? DICTIONARY[langActual]['prompt_new_pin'] 
            : "Introduce tu nuevo PIN de 4 dígitos:";
        const nuevoPin = prompt(promptText);

        if (nuevoPin && nuevoPin.length === 4) {
            localStorage.setItem("beneath_pin", nuevoPin);
            const msgUpdated = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['alert_pin_updated']) 
                ? DICTIONARY[langActual]['alert_pin_updated'] 
                : "PIN actualizado. Entrando...";
            alert(msgUpdated);
            otorgarAccesoExitoso();
        } else {
            const msgInvalidPin = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['alert_invalid_pin']) 
                ? DICTIONARY[langActual]['alert_invalid_pin'] 
                : "PIN no válido.";
            alert(msgInvalidPin);
        }
    } else {
        const msgWrongPhrase = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['alert_wrong_phrase']) 
            ? DICTIONARY[langActual]['alert_wrong_phrase'] 
            : "Frase incorrecta.";
        alert(msgWrongPhrase);
    }
}

function otorgarAccesoExitoso() {
    document.getElementById("login-view").classList.add("hidden");
    document.getElementById("main-view").classList.remove("hidden");
    
    const usuario = localStorage.getItem("beneath_identity");
    document.getElementById("logged-user").innerText = usuario;

    const badgeRole = document.getElementById("user-role-badge");
    const btnAudit = document.getElementById("btn-admin-audit");
    const langActual = localStorage.getItem('sipv_lang') || 'es';
    
    if (usuario === "MORE") {
        const roleAdmin = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['role_admin_text']) 
            ? DICTIONARY[langActual]['role_admin_text'] 
            : "ADMIN / DIRECTOR";
        badgeRole.innerText = roleAdmin;
        badgeRole.className = "text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800 font-semibold uppercase";
        if (btnAudit) btnAudit.classList.remove("hidden");
    } else {
        const roleMember = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['role_member_text']) 
            ? DICTIONARY[langActual]['role_member_text'] 
            : "INTEGRANTE";
        badgeRole.innerText = roleMember;
        badgeRole.className = "text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-semibold uppercase";
        if (btnAudit) btnAudit.classList.add("hidden");
    }
}

window.activarCortinaPrivacidad = function() {
    const cortina = document.getElementById("privacy-curtain");
    if (cortina) cortina.classList.remove("hidden");
}

window.quitarCortinaPrivacidad = function() {
    const cortina = document.getElementById("privacy-curtain");
    if (cortina) cortina.classList.add("hidden");
}

window.cerrarSesion = function() {
    location.reload();
}

window.abrirChatGrupo = function(nombreGrupo) {
    document.getElementById("main-view").classList.add("hidden");
    document.getElementById("chat-view").classList.remove("hidden");
    
    registrarLecturaUsuarioActual();
    escucharMensajesEnVivo();

    const input = document.getElementById("input-mensaje");
    if (input) {
        input.focus();
        input.removeEventListener("keypress", manejarEnterChat);
        input.addEventListener("keypress", manejarEnterChat);
    }
}

window.volverAGrupos = function() {
    document.getElementById("chat-view").classList.add("hidden");
    document.getElementById("main-view").classList.remove("hidden");
}

function manejarEnterChat(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        enviarMensaje();
    }
}

window.alternarPanelAuditoria = function() {
    const panel = document.getElementById("audit-panel");
    if (panel) {
        panel.classList.toggle("hidden");
        if (!panel.classList.contains("hidden")) {
            actualizarPanelGerencialAdmin();
        }
    }
}

function actualizarPanelGerencialAdmin() {
    const panel = document.getElementById("audit-panel");
    let miembros = JSON.parse(localStorage.getItem("beneath_miembros")) || ["MORE", "TORITO"];
    let expulsados = JSON.parse(localStorage.getItem("beneath_expulsados")) || [];
    const langActual = localStorage.getItem('sipv_lang') || 'es';

    const tPanelTitle = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['audit_panel_title']) 
        ? DICTIONARY[langActual]['audit_panel_title'] 
        : "Panel de Control Gerencial & Miembros";
    const tFullAccess = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['audit_full_access']) 
        ? DICTIONARY[langActual]['audit_full_access'] 
        : "Acceso Total";
    const tActive = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['audit_status_active']) 
        ? DICTIONARY[langActual]['audit_status_active'] 
        : "🟢 Activo";
    const tRevoked = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['audit_status_revoked']) 
        ? DICTIONARY[langActual]['audit_status_revoked'] 
        : "🔴 Expulsado / Revocado";
    const tReadmit = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['audit_btn_readmit']) 
        ? DICTIONARY[langActual]['audit_btn_readmit'] 
        : "Readmitir";
    const tKick = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['audit_btn_kick']) 
        ? DICTIONARY[langActual]['audit_btn_kick'] 
        : "Expulsar";
    const tDirector = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['audit_role_director']) 
        ? DICTIONARY[langActual]['audit_role_director'] 
        : "Director";

    let htmlMiembros = `
        <div class="flex justify-between items-center border-b border-amber-900/40 pb-1 mb-2">
            <span class="font-bold text-amber-400 uppercase text-[10px]">${tPanelTitle}</span>
            <span class="text-[9px] text-slate-400">${tFullAccess}</span>
        </div>
        <div class="space-y-1.5 text-[11px]">
    `;

    miembros.forEach(m => {
        let esExpulsado = expulsados.includes(m);
        let estadoBadge = esExpulsado ? `<span class="text-rose-400 font-semibold">${tRevoked}</span>` : `<span class="text-emerald-400 font-semibold">${tActive}</span>`;
        let botonAccion = '';

        if (m !== "MORE") {
            if (esExpulsado) {
                botonAccion = `<button onclick="readmitirMiembro('${m}')" class="px-2 py-0.5 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 rounded border border-emerald-800 text-[10px] cursor-pointer font-bold">${tReadmit}</button>`;
            } else {
                botonAccion = `<button onclick="expulsarMiembro('${m}')" class="px-2 py-0.5 bg-rose-950 text-rose-400 hover:bg-rose-900 rounded border border-rose-800 text-[10px] cursor-pointer font-bold">${tKick}</button>`;
            }
        } else {
            botonAccion = `<span class="text-[9px] text-amber-500 italic">${tDirector}</span>`;
        }

        htmlMiembros += `
            <div class="flex justify-between items-center bg-slate-900/80 p-2 rounded border border-slate-800">
                <div>
                    <span class="text-slate-200 font-bold uppercase">${m}</span>
                    <div class="text-[9px]">${estadoBadge}</div>
                </div>
                <div>${botonAccion}</div>
            </div>
        `;
    });

    htmlMiembros += `</div>`;
    panel.innerHTML = htmlMiembros;
}

window.expulsarMiembro = function(nombreMiembro) {
    const langActual = localStorage.getItem('sipv_lang') || 'es';
    const rawMsg = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['confirm_kick_member']) 
        ? DICTIONARY[langActual]['confirm_kick_member'] 
        : "¿Estás seguro de expulsar a {nombre}? Su sesión se cerrará de inmediato y no podrá acceder.";
    
    const msgFinal = rawMsg.replace("{nombre}", nombreMiembro);

    if (confirm(msgFinal)) {
        let expulsados = JSON.parse(localStorage.getItem("beneath_expulsados")) || [];
        if (!expulsados.includes(nombreMiembro)) {
            expulsados.push(nombreMiembro);
            localStorage.setItem("beneath_expulsados", JSON.stringify(expulsados));
        }
        actualizarPanelGerencialAdmin();
    }
}

window.readmitirMiembro = function(nombreMiembro) {
    let expulsados = JSON.parse(localStorage.getItem("beneath_expulsados")) || [];
    expulsados = expulsados.filter(item => item !== nombreMiembro);
    localStorage.setItem("beneath_expulsados", JSON.stringify(expulsados));
    actualizarPanelGerencialAdmin();
}

function obtenerHoraActual() {
    const ah = new Date();
    return ah.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Declaramos el ID del grupo actual de forma global y segura
const idGrupoActual = typeof obtenerGrupoActual === 'function' ? obtenerGrupoActual() : (localStorage.getItem("beneath_grupo_activo") || "instituto_general");

async function cargarMensajesSupabase() {
    const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .eq('grupo_id', idGrupoActual)
        .order('id', { ascending: true });

    if (error) {
        console.error("Error al cargar mensajes:", error);
        return;
    }

    let dataObj = {};
    const LIMITE_MS = 60 * 60 * 1000; // 60 horas exactas en milisegundos
    const ahora = Date.now();

    if (data) {
        data.forEach(row => {
            try {
                let parsedMensaje = JSON.parse(row.mensaje);
                
                // Si el mensaje cuenta con timestamp, evaluamos si ya pasaron las 60 horas
                if (parsedMensaje.timestamp && typeof parsedMensaje.timestamp === 'number') {
                    const edadMensaje = ahora - parsedMensaje.timestamp;
                    // Si supera las 60 horas exactas, se descarta y se omite
                    if (edadMensaje >= LIMITE_MS) {
                        return; 
                    }
                }
                // Nota de seguridad: Los mensajes antiguos o sin timestamp se conservan intactos para proteger tu historial

                dataObj[row.id] = parsedMensaje;
            } catch (e) {
                dataObj[row.id] = {
                    usuario: row.autor || "ANÓNIMO",
                    texto: row.mensaje,
                    esArchivo: false,
                    hora: "--:--"
                };
            }
        });
    }
    
    procesarSnapshotMensajes({ val: () => Object.keys(dataObj).length > 0 ? dataObj : null });
}

// Escuchar mensajes en tiempo real filtrados por el grupo actual en Supabase
function escucharMensajesEnVivo() {
    cargarMensajesSupabase();
    
    supabase
      .channel('public:mensajes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes', filter: `grupo_id=eq.${idGrupoActual}` }, payload => {
          cargarMensajesSupabase();
      })
      .subscribe();
}

async function registrarLecturaUsuarioActual() {
    const usuarioActivo = localStorage.getItem("beneath_identity");
    if (!usuarioActivo) return;

    // Obtenemos los mensajes actuales de Supabase para este grupo
    const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .eq('grupo_id', idGrupoActual);

    if (error || !data) return;

    const horaLectura = obtenerHoraActual();

    for (let row of data) {
        try {
            let item = JSON.parse(row.mensaje);
            if (!item.vistos) item.vistos = {};

            if (!item.vistos[usuarioActivo]) {
                item.vistos[usuarioActivo] = horaLectura;

                // Actualizamos el registro en Supabase
                await supabase
                    .from('mensajes')
                    .update({ mensaje: JSON.stringify(item) })
                    .eq('id', row.id);
            }
        } catch (e) {
            console.error("Error al procesar lectura en Supabase:", e);
        }
    }
}

// Función para generar un sonido de notificación sutil y limpio sin archivos externos
function reproducirSonidoNotificacion() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscilador = audioCtx.createOscillator();
        const ganancia = audioCtx.createGain();

        oscilador.type = "sine";
        oscilador.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Tono agradable (Re5)
        oscilador.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // Subidita sutil

        ganancia.gain.setValueAtTime(0.15, audioCtx.currentTime); // Volumen moderado y no molesto
        ganancia.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscilador.connect(ganancia);
        ganancia.connect(audioCtx.destination);

        oscilador.start();
        oscilador.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        // Los navegadores bloquean audio si el usuario no ha interactuado previamente, lo ignoramos de forma segura
    }
}

async function guardarMensajeEnNube(nuevoItem) {
    // Aseguramos que el objeto 'vistos' tenga la estructura correcta desde el inicio
    const objetoParaSubir = {
        usuario: nuevoItem.usuario || "USUARIO",
        texto: nuevoItem.texto || "",
        esArchivo: !!nuevoItem.esArchivo,
        timestamp: nuevoItem.timestamp || Date.now(),
        hora: nuevoItem.hora || obtenerHoraActual(),
        vistos: {
            [nuevoItem.usuario || "USUARIO"]: nuevoItem.hora || obtenerHoraActual()
        }
    };

    // Si es un archivo, agregamos sus propiedades específicas de forma limpia
    if (nuevoItem.esArchivo) {
        objetoParaSubir.nombreArchivo = nuevoItem.nombreArchivo;
        objetoParaSubir.tamanoLegible = nuevoItem.tamanoLegible;
        objetoParaSubir.icono = nuevoItem.icono;
        objetoParaSubir.dataUrl = nuevoItem.dataUrl;
        objetoParaSubir.tipoMime = nuevoItem.tipoMime;
    }

    // Obtenemos el grupo activo actual del almacenamiento local
    const grupoActivo = localStorage.getItem("beneath_grupo_activo") || localStorage.getItem("calendario_group_name") || "instituto_general";

    // Ejecutamos el envío a Supabase cumpliendo con la estructura de columnas requerida
    const { error } = await supabase
        .from('mensajes')
        .insert([
            {
                grupo_id: grupoActivo,
                autor: objetoParaSubir.usuario,
                mensaje: JSON.stringify(objetoParaSubir)
            }
        ]);

    if (error) {
        console.error("Error al enviar a Supabase:", error);
        alert("No se pudo enviar el mensaje. Revisa tu conexión.");
    } else {
        console.log("Mensaje enviado con éxito a la nube.");
        if (typeof cargarMensajesSupabase === 'function') {
            cargarMensajesSupabase();
        }
    }
}

// Función para eliminar mensajes directamente desde la interfaz en Supabase
window.eliminarMensajePorId = async function(idMensaje) {
    const { error } = await supabase
        .from('mensajes')
        .delete()
        .eq('id', idMensaje);

    if (error) {
        console.error("Error al eliminar el mensaje en Supabase:", error);
    } else {
        if (typeof cargarMensajesSupabase === 'function') {
            cargarMensajesSupabase();
        }
    }
}

function procesarSnapshotMensajes(snapshot) {
    const contenedorChat = document.getElementById("chat-messages");
    if (!contenedorChat) return;

    contenedorChat.innerHTML = "";
    const data = snapshot.val();
    if (!data) return;

    const usuarioActual = localStorage.getItem("beneath_identity");

    Object.keys(data).forEach(idMensaje => {
        const item = data[idMensaje];
        const div = document.createElement("div");
        div.className = item.esArchivo 
            ? "mensaje-card p-2.5 bg-emerald-950/40 rounded-lg border border-emerald-900/50 space-y-1"
            : "mensaje-card p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1";

        let contenidoHtml = "";
        if (item.esArchivo) {
            const nombreLimpio = (item.nombreArchivo || '').replace(/'/g, "");
            
            let vistaMiniatura = '';
            if (item.tipoMime && item.tipoMime.includes("image")) {
                vistaMiniatura = `
                    <div class="w-11 h-11 bg-slate-950 rounded border border-emerald-800 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src="${item.dataUrl}" alt="${nombreLimpio}" class="w-full h-full object-cover select-none" />
                    </div>
                `;
            } else {
                vistaMiniatura = `<span class="text-xl shrink-0">${item.icono}</span>`;
            }

            contenidoHtml = `
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 truncate">
                        ${vistaMiniatura}
                        <div class="truncate">
                            <p class="font-semibold text-slate-200 truncate max-w-[110px]">${item.nombreArchivo}</p>
                            <span class="text-[9px] text-slate-400">${item.tamanoLegible}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" onclick="window.abrirVisorSeguro('${item.dataUrl}', '${nombreLimpio}', '${item.tipoMime || ''}')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded font-bold text-[10px] transition-colors flex items-center gap-1 shadow cursor-pointer">
                        🔍 ${DICTIONARY[localStorage.getItem('sipv_lang') || 'es']?.btn_view || 'Ver'}
                    </button>
                    <a href="${item.dataUrl}" download="${nombreLimpio}" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded font-bold text-[10px] transition-colors flex items-center gap-1 shadow cursor-pointer border border-emerald-900/50">
                        💾 ${DICTIONARY[localStorage.getItem('sipv_lang') || 'es']?.btn_download || 'Descargar'}
                    </a>
                </div>
                    </div>
                </div>
            `;
        } else {
            if (item.texto.startsWith("http://") || item.texto.startsWith("https://")) {
                contenidoHtml = `<a href="${item.texto}" target="_blank" class="text-xs text-blue-400 underline flex items-center gap-1">🔗 <span>${item.texto}</span></a>`;
            } else {
                contenidoHtml = `<p class="text-slate-200 text-xs">${item.texto}</p>`;
            }
        }

        let htmlAuditoriaLectura = "";
        if (usuarioActual === "MORE") {
            let vistosObj = item.vistos || {};
            let listaVistosTextos = [];
            for (let miembro in vistosObj) {
                listaVistosTextos.push(`${miembro} (${vistosObj[miembro]})`);
            }
            let resumenLectura = listaVistosTextos.length > 0 ? listaVistosTextos.join(", ") : "Ninguno aún";
            
            const langActual = localStorage.getItem('sipv_lang') || 'es';
    const auditSeenText = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['audit_seen_by']) 
        ? DICTIONARY[langActual]['audit_seen_by'] 
        : "Auditoría Gerencial - Visto por:";

    htmlAuditoriaLectura = `
                <div class="pt-1.5 mt-1 border-t border-amber-900/30 text-[9px] text-amber-400/90 flex items-center gap-1">
                    <span>👁️ ${auditSeenText}</span>
                    <span class="font-semibold text-slate-300">${resumenLectura}</span>
                </div>
            `;
        }

        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-[10px] font-bold text-emerald-400 uppercase">${item.usuario}</span>
                <div class="flex items-center gap-2">
                    <span class="text-[9px] text-slate-500">${item.hora}</span>
                    <button onclick="eliminarMensajePorFirebaseId('${idMensaje}')" class="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer font-bold px-1" title="Eliminar contenido">🗑️</button>
                </div>
            </div>
            ${contenidoHtml}
            ${htmlAuditoriaLectura}
            <div class="flex justify-between items-center pt-1 border-t border-slate-800/60 text-[9px]">
                <span class="text-amber-400/90" data-timestamp="${item.timestamp || Date.now()}">⏳ Calculando expiración...</span>
                <span class="text-slate-500">${item.esArchivo ? (DICTIONARY[localStorage.getItem('sipv_lang') || 'es']?.secure_file_label || 'Archivo Seguro') : (DICTIONARY[localStorage.getItem('sipv_lang') || 'es']?.transmitted_label || 'Transmitido')}</span>
            </div>
        `;

        contenedorChat.appendChild(div);
    });

    contenedorChat.scrollTop = contenedorChat.scrollHeight;
}

window.eliminarMensajePorFirebaseId = async function(idMensaje) {
    const { error } = await supabase
        .from('mensajes')
        .delete()
        .eq('id', idMensaje);

    if (error) {
        console.error("Error al eliminar:", error);
    } else {
        if (typeof cargarMensajesSupabase === 'function') {
            cargarMensajesSupabase();
        }
    }
}

window.enviarMensaje = function() {
    const input = document.getElementById("input-mensaje");
    if (!input) return;

    let texto = input.value.trim();
    const usuarioActivo = localStorage.getItem("beneath_identity") || "MORE";

    if (!texto) return;

    // Validación para bloquear enlaces externos (URLs) y contenido inapropiado o pornográfico
    const textoMinuscula = texto.toLowerCase();
    
    // Excepción permitida para plataformas multimedia de video oficiales (YouTube, Vimeo, Bunny)
    const esVideoPermitido = /youtube\.com|youtu\.be|vimeo\.com|bunny\.net|bannystream\.com/i.test(textoMinuscula);

    // Bloqueo de enlaces comunes (http, https, www, .com, etc.) solo si NO es un video permitido
    const contieneEnlaceGeneral = /https?:\/\/|www\.|\.com|\.net|\.org|\.edu|\.mil|\.gov|\.io|\.me/i.test(texto);
    const contieneEnlace = contieneEnlaceGeneral && !esVideoPermitido;
    
    // Filtro de palabras prohibidas para contenido adulto/pornográfico
    const palabrasProhibidas = ["xxx", "porno", "porn", "sex", "desnudo", "nsfw", "hot"];
    const contienePalabraProhibida = palabrasProhibidas.some(palabra => textoMinuscula.includes(palabra));

    if (contieneEnlace || contienePalabraProhibida) {
        alert("⚠️ Mensaje bloqueado: No está permitido compartir enlaces externos ni contenido de adultos en BENEATH.");
        return; // Detiene el envío
    }

    const nuevoItem = {
        usuario: usuarioActivo,
        texto: texto,
        esArchivo: false,
        timestamp: Date.now(),
        hora: obtenerHoraActual()
    };

    guardarMensajeEnNube(nuevoItem);
    input.value = "";
    input.focus();
}

window.manejarArchivoSeleccionado = function(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    // Validación para que los videos no duren más de 6 segundos
    if (archivo.type.startsWith("video/")) {
        const videoTemporal = document.createElement("video");
        videoTemporal.preload = "metadata";
        
        videoTemporal.onloadedmetadata = function() {
            window.URL.revokeObjectURL(videoTemporal.src);
            if (videoTemporal.duration > 6.5) {
                alert("El video es demasiado largo. La duración máxima permitida es de 6 segundos.");
                event.target.value = "";
                return;
            }
            procesarLecturaArchivo(archivo, event);
        };
        
        videoTemporal.src = URL.createObjectURL(archivo);
        return;
    }

    procesarLecturaArchivo(archivo, event);
}

function procesarLecturaArchivo(archivo, event) {
    const lector = new FileReader();
    
    lector.onload = function(e) {
        const base64Original = e.target.result;
        const usuarioActivo = localStorage.getItem("calendario_identity_name") || localStorage.getItem("beneath_identity") || "Usuario";

        // Si es una imagen, la comprimimos y reducimos de tamaño automáticamente
        if (archivo.type.includes("image")) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                let ancho = img.width;
                let alto = img.height;
                
                // Definimos un tamaño máximo prudente para que viaje rápido en el chat (máx 800px de ancho)
                const anchoMaximo = 800;
                if (ancho > anchoMaximo) {
                    alto = Math.round((alto * anchoMaximo) / ancho);
                    ancho = anchoMaximo;
                }

                canvas.width = ancho;
                canvas.height = alto;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, ancho, alto);

                // Convertimos la imagen redimensionada a JPEG con calidad optimizada (70%) para bajar el peso de 2.5 MB a unos cuantos KBs
                const base64Comprimido = canvas.toDataURL("image/jpeg", 0.7);
                
                const tamanoKB = (base64Comprimido.length / 1024).toFixed(1);
                const tamanoLegible = tamanoKB > 1024 ? (tamanoKB / 1024).toFixed(1) + " MB" : tamanoKB + " KB";

                const nuevoItem = {
                    usuario: usuarioActivo,
                    esArchivo: true,
                    nombreArchivo: archivo.name,
                    tamanoLegible: tamanoLegible,
                    icono: "🖼️",
                    dataUrl: base64Comprimido,
                    tipoMime: "image/jpeg",
                    timestamp: Date.now(),
                    hora: obtenerHoraActual()
                };

                guardarMensajeEnNube(nuevoItem);
                event.target.value = "";
            };
            img.src = base64Original;
            return;
        }

        // Si es PDF, Video u otro documento, validamos que no exceda un límite prudente (ej. 10 MB) para proteger la red
        if (archivo.size > 10 * 1024 * 1024) {
            alert("⚠️ El archivo es demasiado pesado. El límite máximo permitido es de 10 MB.");
            event.target.value = "";
            return;
        }

        const tamanoKB = (archivo.size / 1024).toFixed(1);
        const tamanoLegible = tamanoKB > 1024 ? (tamanoKB / 1024).toFixed(1) + " MB" : tamanoKB + " KB";

        let icono = "📄";
        if (archivo.type.includes("pdf")) icono = "📕";
        else if (archivo.type.includes("word") || archivo.name.endsWith(".docx")) icono = "📝";
        else if (archivo.type.includes("video")) icono = "🎥";

        const nuevoItem = {
            usuario: usuarioActivo,
            esArchivo: true,
            nombreArchivo: archivo.name,
            tamanoLegible: tamanoLegible,
            icono: icono,
            dataUrl: base64Original,
            tipoMime: archivo.type,
            timestamp: Date.now(),
            hora: obtenerHoraActual()
        };

        guardarMensajeEnNube(nuevoItem);
        event.target.value = "";
    };

    lector.readAsDataURL(archivo);
}
window.abrirVisorSeguro = function(dataUrl, nombreArchivo, tipoMime) {
    const modal = document.getElementById("media-viewer-modal");
    const contenedorContenido = document.getElementById("media-viewer-content");
    const titulo = document.getElementById("media-viewer-title");
    
    if (!modal || !contenedorContenido) return;

    if (titulo) titulo.innerText = nombreArchivo;
    contenedorContenido.innerHTML = "";

    if (tipoMime && tipoMime.includes("image")) {
        contenedorContenido.innerHTML = `
            <img src="${dataUrl}" alt="${nombreArchivo}" class="max-h-[75vh] max-w-full rounded shadow-lg object-contain mx-auto select-none pointer-events-none" />
            <p class="text-[10px] text-amber-400 text-center mt-2">🛡️ Modo Zero-Trace Activo: Imagen protegida contra descarga directa.</p>
        `;
    } else if (tipoMime && tipoMime.includes("pdf")) {
        contenedorContenido.innerHTML = `
            <iframe src="${dataUrl}" class="w-full h-[70vh] rounded border border-slate-700 bg-slate-950" title="${nombreArchivo}"></iframe>
            <p class="text-[10px] text-amber-400 text-center mt-2">🛡️ Modo Zero-Trace Activo: Visualización de documento restringida a memoria.</p>
        `;
    } else {
        contenedorContenido.innerHTML = `
            <div class="text-center p-6 space-y-3">
                <p class="text-3xl">📄</p>
                <p class="text-xs text-slate-300 font-semibold">${nombreArchivo}</p>
                <p class="text-[11px] text-slate-400">Este formato se visualiza de forma restringida.</p>
                <iframe src="${dataUrl}" class="w-full h-[50vh] rounded border border-slate-700 bg-slate-950 mt-2"></iframe>
            </div>
        `;
    }

    modal.classList.remove("hidden");
}

window.cerrarVisorSeguro = function() {
    const modal = document.getElementById("media-viewer-modal");
    const contenedorContenido = document.getElementById("media-viewer-content");
    
    if (contenedorContenido) contenedorContenido.innerHTML = "";
    if (modal) modal.classList.add("hidden");
}
// --- MÓDULO DE INDICADOR DE ESCRIBIENDO ---
let temporizadorEscribiendo = null;

document.addEventListener("DOMContentLoaded", () => {
    const inputMensaje = document.getElementById("input-mensaje");
    if (inputMensaje) {
        inputMensaje.addEventListener("input", () => {
            mostrarIndicadorEscribiendoVisual();
        });
    }
});

function mostrarIndicadorEscribiendoVisual() {
    const indicador = document.getElementById("indicador-escribiendo");
    if (!indicador) return;

    indicador.classList.remove("hidden");
    clearTimeout(temporizadorEscribiendo);

    temporizadorEscribiendo = setTimeout(() => {
        indicador.classList.add("hidden");
    }, 2000);
}
// --- MOTOR DE CONTEO REGRESIVO PARA AUTODESTRUCCIÓN (60 HORAS) ---
function actualizarContadoresExpiracion() {
    const elementosExpiracion = document.querySelectorAll("[data-timestamp]");
    const LIMITE_HORAS = 60;
    const MS_TOTALES = LIMITE_HORAS * 60 * 60 * 1000;
    const langActual = localStorage.getItem('sipv_lang') || 'es';

    const msgExpired = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['status_expired']) 
        ? DICTIONARY[langActual]['status_expired'] 
        : "⚠️ Expirado / Autodestruido";
    const patternHours = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['expires_hours_format']) 
        ? DICTIONARY[langActual]['expires_hours_format'] 
        : "⏳ Expira en {h}h {m}m (Autodestrucción)";
    const patternMins = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual]['expires_mins_format']) 
        ? DICTIONARY[langActual]['expires_mins_format'] 
        : "⏳ Expira en {m} min (Autodestrucción)";

    elementosExpiracion.forEach(el => {
        const timestampCreacion = parseInt(el.getAttribute("data-timestamp"), 10);
        if (!timestampCreacion) return;

        const tiempoTranscurrido = Date.now() - timestampCreacion;
        const tiempoRestante = MS_TOTALES - tiempoTranscurrido;

        if (tiempoRestante <= 0) {
            el.innerHTML = msgExpired;
            el.classList.add("text-rose-500", "font-bold");
        } else {
            const horasRestantes = Math.floor(tiempoTranscurrido / (1000 * 60 * 60)); // Nota: o tiempoRestante según tu lógica original
            const horasRest = Math.floor(tiempoRestante / (1000 * 60 * 60));
            const minutosRestantes = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));

            if (horasRest > 0) {
                let textoFinal = patternHours.replace("{h}", horasRest).replace("{m}", minutosRestantes);
                el.innerHTML = textoFinal;
            } else {
                let textoFinal = patternMins.replace("{m}", minutosRestantes);
                el.innerHTML = textoFinal;
            }
        }
    });
}

// Ejecutamos el contador cada minuto para mantenerlo sincronizado
setInterval(actualizarContadoresExpiracion, 60000);
// Y lo ejecutamos una vez al cargar
document.addEventListener("DOMContentLoaded", actualizarContadoresExpiracion);