// --- LÓGICA DE BENEATH CON NUBE EN TIEMPO REAL (PESA) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    databaseURL: "https://beneath-pesa-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Recuperamos dinámicamente el identificador del grupo o usamos uno institucional por defecto
const idGrupoActual = localStorage.getItem("beneath_grupo_activo") || "instituto_general";
const mensajesRef = ref(db, `mensajes_${idGrupoActual}`);
document.addEventListener("DOMContentLoaded", () => {
    limpiarContenidoExpiradoNube();
    checarEstadoIdentidad();
    inicializarEventosTecladoGlobales();
});

function limpiarContenidoExpiradoNube() {
    onValue(mensajesRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
       
        const ahora = Date.now();
        const tiempoLimite = 72 * 60 * 60 * 1000;

        Object.keys(data).forEach(key => {
            const item = data[key];
            if ((ahora - item.timestamp) >= tiempoLimite) {
                remove(ref(db, `mensajes_pesa/${key}`));
            }
        });
    }, { onlyOnce: true });
}

function checarEstadoIdentidad() {
    const identidadGuardada = localStorage.getItem("beneath_identity");
   
    if (identidadGuardada) {
        const expulsados = JSON.parse(localStorage.getItem("beneath_expulsados")) || [];
        if (expulsados.includes(identidadGuardada)) {
            const langActual = localStorage.getItem('sipv_lang') || 'es';
            const msgRevocado = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].alert_revoked)
                || "Tu acceso ha sido revocado por el administrador.";
           
            alert(msgRevocado);
            localStorage.removeItem("beneath_identity");
            localStorage.removeItem("beneath_pin");
            location.reload();
            return;
        }

        document.getElementById("setup-view").classList.add("hidden");
        document.getElementById("login-view").classList.remove("hidden");
        document.getElementById("display-identity").innerText = identidadGuardada;
       
        const loginPin = document.getElementById("login-pin");
        if (loginPin) loginPin.focus();
    } else {
        document.getElementById("setup-view").classList.remove("hidden");
        document.getElementById("login-view").classList.add("hidden");
       
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

    if (!nombre || pin.length !== 4) {
        const langActual = localStorage.getItem('sipv_lang') || 'es';
        const msgAlerta = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].alert_invalid_identity)
            || "Por favor escribe una identidad válida y un PIN exacto de 4 dígitos.";
       
        alert(msgAlerta);
        return;
    }

    if (!localStorage.getItem("beneath_admin_creator")) {
        localStorage.setItem("beneath_admin_creator", nombre);
    }

    const palabrasBase = ["ALPHA", "OMEGA", "CLOUD", "SECURE", "CORE", "NODE", "ZENITH", "AUDIT"];
    let fraseRescate = "";
    for (let i = 0; i < 4; i++) {
        fraseRescate += palabrasBase[Math.floor(Math.random() * palabrasBase.length)] + " ";
    }
    fraseRescate = fraseRescate.trim();

    localStorage.setItem("beneath_identity", nombre);
    localStorage.setItem("beneath_pin", pin);
    localStorage.setItem("beneath_recovery", fraseRescate);

    let miembros = JSON.parse(localStorage.getItem("beneath_miembros")) || [nombre];
    if (!miembros.includes(nombre)) {
        miembros.push(nombre);
        localStorage.setItem("beneath_miembros", JSON.stringify(miembros));
    }

    const langActual = localStorage.getItem('sipv_lang') || 'es';
    const msgExito = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].alert_identity_created)
        || "¡Identidad creada con éxito!\n\n[ FRASE DE RESCATE DE EMERGENCIA ]\nAnota estas 4 palabras:\n\n--> ${frase} <--";
   
    alert(msgExito.replace("${frase}", fraseRescate));
    location.reload();
}

window.verificarPin = function() {
    const pinIngresado = document.getElementById("login-pin").value.trim();
    const pinReal = localStorage.getItem("beneath_pin");

    if (pinIngresado === pinReal) {
        otorgarAccesoExitoso();
    } else {
        const langActual = localStorage.getItem('sipv_lang') || 'es';
        const msgPinError = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].alert_wrong_pin)
            || "PIN incorrecto.";
       
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
        const msgVerificada = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].alert_phrase_verified)
            || "¡Frase verificada! Establece un nuevo PIN.";
        const promptNuevoPin = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].prompt_new_pin)
            || "Introduce tu nuevo PIN de 4 dígitos:";
        const msgActualizado = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].alert_pin_updated)
            || "PIN actualizado. Entrando...";
        const msgPinInv = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].alert_invalid_pin)
            || "PIN no válido.";

        alert(msgVerificada);
        const nuevoPin = prompt(promptNuevoPin);
        if (nuevoPin && nuevoPin.length === 4) {
            localStorage.setItem("beneath_pin", nuevoPin);
            alert(msgActualizado);
            otorgarAccesoExitoso();
        } else {
            alert(msgPinInv);
        }
    } else {
        const msgFraseError = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].alert_wrong_phrase)
            || "Frase incorrecta.";
        alert(msgFraseError);
    }
}

function otorgarAccesoExitoso() {
    document.getElementById("login-view").classList.add("hidden");
    document.getElementById("main-view").classList.remove("hidden");
   
    const usuario = localStorage.getItem("beneath_identity");
    const adminCreador = localStorage.getItem("beneath_admin_creator") || usuario;
   
    document.getElementById("logged-user").innerText = usuario;

    // Pintar dinámicamente el nombre personalizado del colegio en la interfaz
    const nombreGrupoCustom = localStorage.getItem("beneath_nombre_grupo_visible");
    const labelGrupoUI = document.getElementById("label-nombre-grupo-ui");
    if (nombreGrupoCustom && labelGrupoUI) {
        labelGrupoUI.innerText = `🔒 ${nombreGrupoCustom}`;
    }

    const badgeRole = document.getElementById("user-role-badge");
    const btnAudit = document.getElementById("btn-admin-audit");
   
    const langActual = localStorage.getItem('sipv_lang') || 'es';
    const txtAdmin = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].role_admin) || "ADMIN / DIRECTOR";
    const txtMember = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].role_member) || "INTEGRANTE";
    const rolePrefix = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].role_prefix) || "ROL:";

    if (usuario === adminCreador) {
        badgeRole.innerText = `${rolePrefix} ${txtAdmin}`;
        badgeRole.className = "text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800 font-semibold uppercase";
        if (btnAudit) btnAudit.classList.remove("hidden");
    } else {
        badgeRole.innerText = `${rolePrefix} ${txtMember}`;
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
   
    // Guardamos y actualizamos el grupo activo de forma dinámica
    localStorage.setItem("beneath_grupo_activo", nombreGrupo);
    
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
    const adminCreador = localStorage.getItem("beneath_admin_creator") || localStorage.getItem("beneath_identity");
    let miembros = JSON.parse(localStorage.getItem("beneath_miembros")) || [adminCreador];
    let expulsados = JSON.parse(localStorage.getItem("beneath_expulsados")) || [];
   
    const langActual = localStorage.getItem('sipv_lang') || 'es';
    const tPanelTitle = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].audit_panel_title) || "Panel de Control Gerencial & Miembros";
    const tFullAccess = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].audit_full_access) || "Acceso Total";
    const tStatusExpelled = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].audit_status_expelled) || "Expulsado / Revocado";
    const tStatusActive = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].audit_status_active) || "Activo";
    const tBtnReadmit = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].audit_btn_readmit) || "Readmitir";
    const tBtnExpel = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].audit_btn_expel) || "Expulsar";
    const tDirector = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].audit_director) || "Director";

    let htmlMiembros = `
        <div class="flex justify-between items-center border-b border-amber-900/40 pb-1 mb-2">
            <span class="font-bold text-amber-400 uppercase text-[10px]">${tPanelTitle}</span>
            <span class="text-[9px] text-slate-400">${tFullAccess}</span>
        </div>
        <div class="space-y-1.5 text-[11px]">
    `;

    miembros.forEach(m => {
        let esExpulsado = expulsados.includes(m);
        let estadoBadge = esExpulsado ? `<span class="text-rose-400 font-semibold">🔴 ${tStatusExpelled}</span>` : `<span class="text-emerald-400 font-semibold">🟢 ${tStatusActive}</span>`;
        let botonAccion = '';

        if (m !== adminCreador) {
            if (esExpulsado) {
                botonAccion = `<button onclick="readmitirMiembro('${m}')" class="px-2 py-0.5 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 rounded border border-emerald-800 text-[10px] cursor-pointer font-bold">${tBtnReadmit}</button>`;
            } else {
                botonAccion = `<button onclick="expulsarMiembro('${m}')" class="px-2 py-0.5 bg-rose-950 text-rose-400 hover:bg-rose-900 rounded border border-rose-800 text-[10px] cursor-pointer font-bold">${tBtnExpel}</button>`;
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
    const msgConfirm = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].audit_confirm_expel)
        || "¿Estás seguro de expulsar a ${nombreMiembro}? Su sesión se cerrará de inmediato y no podrá acceder.";
   
    const textoFinal = msgConfirm.replace("${nombreMiembro}", nombreMiembro);

    if (confirm(textoFinal)) {
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

function escucharMensajesEnVivo() {
    onValue(mensajesRef, (snapshot) => {
        procesarSnapshotMensajes(snapshot);
    });
}

function registrarLecturaUsuarioActual() {
    const usuarioActivo = localStorage.getItem("beneath_identity");
    if (!usuarioActivo) return;

    onValue(mensajesRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const horaLectura = obtenerHoraActual();
        Object.keys(data).forEach(idMensaje => {
            let item = data[idMensaje];
            if (!item.vistos) item.vistos = {};
           
            if (!item.vistos[usuarioActivo]) {
                item.vistos[usuarioActivo] = horaLectura;
                set(ref(db, `mensajes_pesa/${idMensaje}`), item);
            }
        });
    }, { onlyOnce: true });
}

function guardarMensajeEnNube(nuevoItem) {
    nuevoItem.vistos = {};
    nuevoItem.vistos[nuevoItem.usuario] = nuevoItem.hora;

    const nuevoMensajeRef = push(mensajesRef);
    set(nuevoMensajeRef, nuevoItem);
}

function procesarSnapshotMensajes(snapshot) {
    const contenedorChat = document.getElementById("chat-messages");
    if (!contenedorChat) return;

    contenedorChat.innerHTML = "";
    const data = snapshot.val();
    if (!data) return;

    const usuarioActual = localStorage.getItem("beneath_identity");
    const adminCreador = localStorage.getItem("beneath_admin_creator");

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
                        <button type="button" onclick="window.abrirVisorSeguro('${item.dataUrl}', '${nombreLimpio}', '${item.tipoMime || ''}')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded font-bold text-[10px] transition-colors flex items-center gap-1 shadow cursor-pointer" data-i18n="btn_view">
                            🔍 Ver
                        </button>
                        <a href="${item.dataUrl}" download="${nombreLimpio}" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded font-bold text-[10px] transition-colors flex items-center gap-1 shadow cursor-pointer border border-emerald-900/50" data-i18n="btn_download">
                            💾 Descargar
                        </a>
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
        if (usuarioActual === adminCreador) {
            let vistosObj = item.vistos || {};
            let listaVistosTextos = [];
            for (let miembro in vistosObj) {
                listaVistosTextos.push(`${miembro} (${vistosObj[miembro]})`);
            }
           
            const langActual = localStorage.getItem('sipv_lang') || 'es';
            const tNoneYet = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].chat_none_yet) || "Ninguno aún";
            const tAuditSeenBy = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].chat_audit_seen_by) || "Auditoría Gerencial - Visto por:";

            let resumenLectura = listaVistosTextos.length > 0 ? listaVistosTextos.join(", ") : tNoneYet;
           
            htmlAuditoriaLectura = `
                <div class="pt-1.5 mt-1 border-t border-amber-900/30 text-[9px] text-amber-400/90 flex items-center gap-1">
                    <span>👁️ ${tAuditSeenBy}</span>
                    <span class="font-semibold text-slate-300">${resumenLectura}</span>
                </div>
            `;
        }

        const langActual = localStorage.getItem('sipv_lang') || 'es';
        const tDeleteTitle = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].chat_delete_title) || "Eliminar contenido";
        const tExpiresIn = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].chat_expires_in) || "Expira en 72h (Autodestrucción)";
        const tSecureFile = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].chat_secure_file) || "Archivo Seguro";
        const tTransmitted = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].chat_transmitted) || "Transmitido";

        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-[10px] font-bold text-emerald-400 uppercase">${item.usuario}</span>
                <div class="flex items-center gap-2">
                    <span class="text-[9px] text-slate-500">${item.hora}</span>
                    <button onclick="eliminarMensajePorFirebaseId('${idMensaje}')" class="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer font-bold px-1" title="${tDeleteTitle}">🗑️</button>
                </div>
            </div>
            ${contenidoHtml}
            ${htmlAuditoriaLectura}
            <div class="flex justify-between items-center pt-1 border-t border-slate-800/60 text-[9px]">
                <span class="text-amber-400/90">⏳ ${tExpiresIn}</span>
                <span class="text-slate-500">${item.esArchivo ? tSecureFile : tTransmitted}</span>
            </div>
        `;

        contenedorChat.appendChild(div);
    });

    contenedorChat.scrollTop = contenedorChat.scrollHeight;
}

window.eliminarMensajePorFirebaseId = function(idMensaje) {
    remove(ref(db, `mensajes_pesa/${idMensaje}`));
}

window.enviarMensaje = function() {
    const input = document.getElementById("input-mensaje");
    if (!input) return;

    let texto = input.value.trim();
    const usuarioActivo = localStorage.getItem("beneath_identity") || "USUARIO";

    if (!texto) return;

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

    const lector = new FileReader();
    lector.onload = function(e) {
        const base64Data = e.target.result;
        const usuarioActivo = localStorage.getItem("beneath_identity") || "USUARIO";

        const tamanoKB = (archivo.size / 1024).toFixed(1);
        const tamanoLegible = tamanoKB > 1024 ? (tamanoKB / 1024).toFixed(1) + " MB" : tamanoKB + " KB";

        let icono = "📄";
        if (archivo.type.includes("image")) icono = "🖼️";
        else if (archivo.type.includes("pdf")) icono = "📕";
        else if (archivo.type.includes("word") || archivo.name.endsWith(".docx")) icono = "📝";

        const nuevoItem = {
            usuario: usuarioActivo,
            esArchivo: true,
            nombreArchivo: archivo.name,
            tamanoLegible: tamanoLegible,
            icono: icono,
            dataUrl: base64Data,
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

    const langActual = localStorage.getItem('sipv_lang') || 'es';
    const tZeroTraceImg = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].viewer_zero_trace_img) || "🛡️ Modo Zero-Trace Activo: Imagen protegida contra descarga directa.";
    const tZeroTracePdf = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].viewer_zero_trace_pdf) || "🛡️ Modo Zero-Trace Activo: Visualización de documento restringida a memoria.";
    const tRestrictedFmt = (typeof DICTIONARY !== 'undefined' && DICTIONARY[langActual] && DICTIONARY[langActual].viewer_restricted_format) || "Este formato se visualiza de forma restringida.";

    if (tipoMime && tipoMime.includes("image")) {
        contenedorContenido.innerHTML = `
            <img src="${dataUrl}" alt="${nombreArchivo}" class="max-h-[75vh] max-w-full rounded shadow-lg object-contain mx-auto select-none pointer-events-none" />
            <p class="text-[10px] text-amber-400 text-center mt-2">${tZeroTraceImg}</p>
        `;
    } else if (tipoMime && tipoMime.includes("pdf")) {
        contenedorContenido.innerHTML = `
            <iframe src="${dataUrl}" class="w-full h-[70vh] rounded border border-slate-700 bg-slate-950" title="${nombreArchivo}"></iframe>
            <p class="text-[10px] text-amber-400 text-center mt-2">${tZeroTracePdf}</p>
        `;
    } else {
        contenedorContenido.innerHTML = `
            <div class="text-center p-6 space-y-3">
                <p class="text-3xl">📄</p>
                <p class="text-xs text-slate-300 font-semibold">${nombreArchivo}</p>
                <p class="text-[11px] text-slate-400">${tRestrictedFmt}</p>
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

// --- PUENTE DE TRADUCCIÓN AUTOMÁTICA ---
window.cambiarIdiomaUI = function(lang) {
    if (typeof DICTIONARY === 'undefined' || !DICTIONARY[lang]) return;
    localStorage.setItem('sipv_lang', lang);
    const dict = DICTIONARY[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.innerText = dict[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.placeholder = dict[key];
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (dict[key]) el.title = dict[key];
    });
};

document.addEventListener("DOMContentLoaded", () => {
    const selectorIdioma = document.getElementById("cambiador-idioma");
    if (selectorIdioma) {
        const langGuardado = localStorage.getItem('sipv_lang') || 'es';
        selectorIdioma.value = langGuardado;
        window.cambiarIdiomaUI(langGuardado);

        selectorIdioma.addEventListener("change", (e) => {
            window.cambiarIdiomaUI(e.target.value);
            if (typeof actualizarPanelGerencialAdmin === 'function') {
                const panel = document.getElementById("audit-panel");
                if (panel && !panel.classList.contains("hidden")) {
                    actualizarPanelGerencialAdmin();
                }
            }
        });
    }
});