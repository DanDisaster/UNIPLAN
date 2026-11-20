/**
 * ============================================================================
 * PROYECTO UNIPLAN - LÓGICA ALGORÍTMICA, PERSISTENCIA POR CUENTA,
 * INTEGRACIÓN GOOGLE CALENDAR Y NOTIFICACIONES PUSH / CORREO ELECTRÓNICO
 * ============================================================================
 */

// 1. MODELO DE DATOS: CLASE TAREA
class Tarea {
  constructor(id, titulo, curso, fecha, hora = '23:59', prioridad = 'Media', descripcion = '', estado = 'PENDIENTE', alertada = false) {
    this.id = id;
    this.titulo = titulo;
    this.curso = curso;
    this.fecha = fecha; // YYYY-MM-DD
    this.hora = hora;   // HH:MM
    this.prioridad = prioridad; // 'Alta' | 'Media' | 'Baja'
    this.descripcion = descripcion;
    this.estado = estado; // 'PENDIENTE' | 'COMPLETADA'
    this.alertada = alertada;
    this.creadaEn = new Date().toISOString();
  }

  // Evalúa dinámicamente si la tarea está vencida según fecha y hora actuales
  obtenerEstadoReal() {
    if (this.estado === 'COMPLETADA') return 'COMPLETADA';
    const limite = new Date(`${this.fecha}T${this.hora || '23:59'}:00`);
    return new Date() > limite ? 'VENCIDA' : 'PENDIENTE';
  }

  // Horas restantes hasta el vencimiento
  horasRestantes() {
    const limite = new Date(`${this.fecha}T${this.hora || '23:59'}:00`);
    return (limite - new Date()) / (1000 * 60 * 60);
  }

  // Genera URL oficial de Google Calendar con todos los datos de la tarea
  generarUrlGoogleCalendar() {
    const inicio = new Date(`${this.fecha}T${this.hora || '23:59'}:00`);
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000); // Duración 1 hora

    const formatearFechaGCal = (dateObj) =>
      dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `[UniPlan - ${this.prioridad}] ${this.titulo} (${this.curso})`,
      dates: `${formatearFechaGCal(inicio)}/${formatearFechaGCal(fin)}`,
      details: `Curso: ${this.curso}\nPrioridad: ${this.prioridad}\nNotas: ${this.descripcion || 'Registrado desde UniPlan'}`,
      sf: 'true',
      output: 'xml'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
}

// 2. GESTOR DE CUENTAS Y PERSISTENCIA SIN ARCHIVOS EXPORTABLES
class GestorCuentas {
  constructor() {
    this.CLAVE_DB = 'uniplan_usuarios_registrados_v3';
    this.CLAVE_SESION = 'uniplan_usuario_activo_email';
  }

  obtenerBaseUsuarios() {
    return JSON.parse(localStorage.getItem(this.CLAVE_DB) || '{}');
  }

  guardarBaseUsuarios(db) {
    localStorage.setItem(this.CLAVE_DB, JSON.stringify(db));
  }

  registrarCuenta(nombre, email, password) {
    const db = this.obtenerBaseUsuarios();
    const correoNorm = email.trim().toLowerCase();

    if (db[correoNorm]) {
      throw new Error('Este correo electrónico ya está registrado. Inicia sesión.');
    }

    db[correoNorm] = {
      email: correoNorm,
      nombre: nombre.trim() || correoNorm.split('@')[0],
      passwordHash: btoa(password),
      tareas: [],
      historialAlertas: [],
      config: {
        horasAnticipo: 24,
        emailjsService: '',
        emailjsTemplate: '',
        emailjsPubKey: ''
      }
    };

    this.guardarBaseUsuarios(db);
    localStorage.setItem(this.CLAVE_SESION, correoNorm);
    return db[correoNorm];
  }

  iniciarSesion(email, password) {
    const db = this.obtenerBaseUsuarios();
    const correoNorm = email.trim().toLowerCase();
    const usuario = db[correoNorm];

    if (!usuario || usuario.passwordHash !== btoa(password)) {
      throw new Error('Correo o contraseña incorrectos. Verifica tus datos.');
    }

    localStorage.setItem(this.CLAVE_SESION, correoNorm);
    return usuario;
  }

  obtenerUsuarioActivo() {
    const correo = localStorage.getItem(this.CLAVE_SESION);
    if (!correo) return null;
    const db = this.obtenerBaseUsuarios();
    return db[correo] || null;
  }

  guardarDatosUsuario(email, tareas, historialAlertas, config) {
    const db = this.obtenerBaseUsuarios();
    if (!db[email]) return;
    db[email].tareas = tareas;
    db[email].historialAlertas = historialAlertas;
    if (config) db[email].config = config;
    this.guardarBaseUsuarios(db);
  }

  cerrarSesion() {
    localStorage.removeItem(this.CLAVE_SESION);
  }
}

// 3. SISTEMA PRINCIPAL UNIPLAN (LÓGICA ALGORÍTMICA + NOTIFICACIONES)
class SistemaUniPlan {
  constructor(usuario, gestorCuentas) {
    this.usuario = usuario;
    this.gestorCuentas = gestorCuentas;
    this.listaTareas = (usuario.tareas || []).map(
      (t) => new Tarea(t.id, t.titulo, t.curso, t.fecha, t.hora, t.prioridad, t.descripcion, t.estado, t.alertada)
    );
    this.historialAlertas = usuario.historialAlertas || [];
    this.config = usuario.config || { horasAnticipo: 24 };
  }

  persistirEnCuenta() {
    this.gestorCuentas.guardarDatosUsuario(
      this.usuario.email,
      this.listaTareas,
      this.historialAlertas,
      this.config
    );
  }

  registrarTarea(titulo, curso, fecha, hora, prioridad, descripcion) {
    if (!titulo.trim() || !curso.trim() || !fecha) return null;
    const nueva = new Tarea(
      Date.now(),
      titulo.trim(),
      curso.trim(),
      fecha,
      hora || '23:59',
      prioridad,
      descripcion.trim()
    );
    this.listaTareas.unshift(nueva);
    this.persistirEnCuenta();
    return nueva;
  }

  filtrarTareas(criterioPrioridad, criterioEstado, textoBusqueda = '') {
    const q = textoBusqueda.trim().toLowerCase();
    return this.listaTareas.filter((t) => {
      const estadoReal = t.obtenerEstadoReal();
      const cumplePrio = criterioPrioridad === 'TODAS' || t.prioridad === criterioPrioridad;
      const cumpleEstado = criterioEstado === 'TODOS' || estadoReal === criterioEstado;
      const cumpleTexto =
        !q || t.titulo.toLowerCase().includes(q) || t.curso.toLowerCase().includes(q);
      return cumplePrio && cumpleEstado && cumpleTexto;
    });
  }

  actualizarEstadisticas() {
    const total = this.listaTareas.length;
    let completadas = 0;
    let pendientes = 0;
    let vencidas = 0;

    for (const t of this.listaTareas) {
      const est = t.obtenerEstadoReal();
      if (est === 'COMPLETADA') completadas++;
      else if (est === 'VENCIDA') vencidas++;
      else pendientes++;
    }

    const porcentajeAvance = total > 0 ? ((completadas / total) * 100).toFixed(1) : '0';
    return { total, pendientes, completadas, vencidas, porcentajeAvance };
  }

  alternarEstadoTarea(id) {
    const tarea = this.listaTareas.find((t) => t.id === id);
    if (!tarea) return false;
    tarea.estado = tarea.estado === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA';
    this.persistirEnCuenta();
    return true;
  }

  editarTarea(id, datos) {
    const tarea = this.listaTareas.find((t) => t.id === id);
    if (!tarea) return false;
    tarea.titulo = datos.titulo.trim();
    tarea.curso = datos.curso.trim();
    tarea.fecha = datos.fecha;
    tarea.hora = datos.hora;
    tarea.prioridad = datos.prioridad;
    tarea.descripcion = datos.descripcion.trim();
    tarea.alertada = false;
    this.persistirEnCuenta();
    return true;
  }

  eliminarTarea(id) {
    this.listaTareas = this.listaTareas.filter((t) => t.id !== id);
    this.persistirEnCuenta();
  }

  // Envío de notificación Push nativa + Correo electrónico a la cuenta registrada
  async despacharNotificacion(asunto, mensaje, enviarCorreo = true) {
    // 1. Notificación Push del Navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`UniPlan 🎓: ${asunto}`, { body: mensaje });
    }

    // 2. Registro en el historial vinculado al correo del usuario
    const registro = {
      id: Date.now() + Math.random(),
      fecha: new Date().toLocaleString('es-PE'),
      destinatario: this.usuario.email,
      asunto,
      mensaje,
      estadoEnvio: 'Enviado a bandeja de cuenta'
    };

    // 3. Si el usuario configuró EmailJS, dispara correo real SMTP desde el navegador
    if (
      enviarCorreo &&
      typeof emailjs !== 'undefined' &&
      this.config.emailjsService &&
      this.config.emailjsTemplate &&
      this.config.emailjsPubKey
    ) {
      try {
        emailjs.init(this.config.emailjsPubKey);
        await emailjs.send(this.config.emailjsService, this.config.emailjsTemplate, {
          to_email: this.usuario.email,
          to_name: this.usuario.nombre,
          subject: asunto,
          message: mensaje
        });
        registro.estadoEnvio = 'Correo SMTP entregado vía EmailJS ✅';
      } catch (err) {
        registro.estadoEnvio = 'Notificación Push + Registro en cuenta (EmailJS pendiente)';
      }
    }

    this.historialAlertas.unshift(registro);
    if (this.historialAlertas.length > 40) this.historialAlertas.pop();
    this.persistirEnCuenta();
    renderizarHistorialAlertas();
  }

  comprobarVencimientosAutomaticos() {
    const limiteHoras = Number(this.config.horasAnticipo || 24);
    let nuevasAlertas = 0;

    for (const t of this.listaTareas) {
      if (t.estado === 'COMPLETADA' || t.alertada) continue;
      const hrs = t.horasRestantes();

      if (hrs <= limiteHoras) {
        const estadoTexto = hrs < 0 ? 'VENCIDA' : `vence en ${Math.max(1, Math.round(hrs))}h`;
        this.despacharNotificacion(
          `Recordatorio: ${t.titulo} (${estadoTexto})`,
          `Curso: ${t.curso} | Fecha límite: ${t.fecha} ${t.hora} | Prioridad: ${t.prioridad}`,
          true
        );
        t.alertada = true;
        nuevasAlertas++;
      }
    }

    if (nuevasAlertas > 0) {
      this.persistirEnCuenta();
      mostrarToast(`🔔 Se generaron ${nuevasAlertas} alerta(s) Push y por correo.`);
    }
    return nuevasAlertas;
  }
}

// ============================================================================
// CONTROLADOR DE INTERFAZ DE USUARIO (DOM)
// ============================================================================
const gestorCuentas = new GestorCuentas();
let sistema = null;
let modoAuthActual = 'login';
let fechaCalendarioActual = new Date();
let intervaloMonitor = null;

window.addEventListener('DOMContentLoaded', () => {
  const hoyISO = new Date().toISOString().split('T')[0];
  const inputFecha = document.getElementById('tarea-fecha');
  if (inputFecha) inputFecha.value = hoyISO;

  const usuarioActivo = gestorCuentas.obtenerUsuarioActivo();
  if (usuarioActivo) {
    inicializarAppConUsuario(usuarioActivo);
  }
});

function cambiarModoAuth(modo) {
  modoAuthActual = modo;
  document.getElementById('tab-login').classList.toggle('active', modo === 'login');
  document.getElementById('tab-register').classList.toggle('active', modo === 'registro');
  document.getElementById('grupo-nombre').classList.toggle('hidden', modo === 'login');
  document.getElementById('btn-auth-submit').textContent =
    modo === 'login' ? 'Ingresar a UniPlan' : 'Crear Cuenta y Guardar Datos';
  document.getElementById('auth-error').classList.add('hidden');
}

function manejarAutenticacion(e) {
  e.preventDefault();
  const nombre = document.getElementById('auth-nombre').value;
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const errorBox = document.getElementById('auth-error');

  try {
    const usuario =
      modoAuthActual === 'registro'
        ? gestorCuentas.registrarCuenta(nombre, email, password)
        : gestorCuentas.iniciarSesion(email, password);

    errorBox.classList.add('hidden');
    inicializarAppConUsuario(usuario);
    mostrarToast(`👋 Bienvenido(a), ${usuario.nombre}`);
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');
  }
}

function inicializarAppConUsuario(usuario) {
  sistema = new SistemaUniPlan(usuario, gestorCuentas);

  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');

  document.getElementById('user-display-name').textContent = usuario.nombre;
  document.getElementById('user-display-email').textContent = usuario.email;
  document.getElementById('alerta-correo-destino').textContent = usuario.email;

  actualizarBotonPush();
  actualizarUI();
  sistema.comprobarVencimientosAutomaticos();

  if (intervaloMonitor) clearInterval(intervaloMonitor);
  intervaloMonitor = setInterval(() => {
    if (sistema) {
      sistema.comprobarVencimientosAutomaticos();
      actualizarUI();
    }
  }, 60000);
}

function cerrarSesion() {
  gestorCuentas.cerrarSesion();
  sistema = null;
  if (intervaloMonitor) clearInterval(intervaloMonitor);
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('auth-form').reset();
}

function cambiarVista(nombreVista, btn) {
  document.querySelectorAll('.nav-pill').forEach((el) => el.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('vista-dashboard').classList.toggle('hidden', nombreVista !== 'dashboard');
  document.getElementById('vista-calendario').classList.toggle('hidden', nombreVista !== 'calendario');
  document.getElementById('vista-alertas').classList.toggle('hidden', nombreVista !== 'alertas');

  if (nombreVista === 'calendario') renderizarCalendario();
  if (nombreVista === 'alertas') renderizarHistorialAlertas();
}

function registrarNuevaTareaUI(e) {
  e.preventDefault();
  const titulo = document.getElementById('tarea-titulo').value;
  const curso = document.getElementById('tarea-curso').value;
  const fecha = document.getElementById('tarea-fecha').value;
  const hora = document.getElementById('tarea-hora').value;
  const prioridad = document.getElementById('tarea-prioridad').value;
  const descripcion = document.getElementById('tarea-descripcion').value;
  const abrirGCal = document.getElementById('tarea-sync-gcal').checked;
  const enviarAlerta = document.getElementById('tarea-notificar-correo').checked;

  const nueva = sistema.registrarTarea(titulo, curso, fecha, hora, prioridad, descripcion);
  if (!nueva) return;

  if (enviarAlerta) {
    sistema.despacharNotificacion(
      `Nueva tarea registrada: ${nueva.titulo}`,
      `Asignatura: ${nueva.curso} | Entrega: ${nueva.fecha} a las ${nueva.hora}`,
      true
    );
  }

  if (abrirGCal) {
    window.open(nueva.generarUrlGoogleCalendar(), '_blank', 'noopener');
  }

  e.target.reset();
  document.getElementById('tarea-fecha').value = fecha;
  document.getElementById('tarea-hora').value = '23:59';
  document.getElementById('tarea-sync-gcal').checked = true;
  document.getElementById('tarea-notificar-correo').checked = true;

  actualizarUI();
  mostrarToast('✅ Tarea guardada en tu cuenta.');
}

function actualizarUI() {
  if (!sistema) return;
  const stats = sistema.actualizarEstadisticas();
  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-pendientes').textContent = stats.pendientes;
  document.getElementById('stat-completadas').textContent = stats.completadas;
  document.getElementById('stat-vencidas').textContent = stats.vencidas;
  document.getElementById('stat-porcentaje').textContent = `${stats.porcentajeAvance}%`;
  document.getElementById('progress-bar-fill').style.width = `${stats.porcentajeAvance}%`;

  renderizarTareas();
  renderizarHistorialAlertas();
}

function renderizarTareas() {
  const contenedor = document.getElementById('lista-tareas-contenedor');
  const prio = document.getElementById('filtro-prioridad').value;
  const estado = document.getElementById('filtro-estado').value;
  const busqueda = document.getElementById('filtro-busqueda').value;

  const filtradas = sistema.filtrarTareas(prio, estado, busqueda);

  if (filtradas.length === 0) {
    contenedor.innerHTML = `<p class="empty-state">No se encontraron tareas con los filtros seleccionados.</p>`;
    return;
  }

  contenedor.innerHTML = filtradas
    .map((t) => {
      const estadoReal = t.obtenerEstadoReal();
      const esCompletada = estadoReal === 'COMPLETADA';
      return `
        <article class="task-item prio-${t.prioridad} ${esCompletada ? 'is-completed' : ''}">
          <div>
            <div class="task-badges">
              <span class="pill pill-course">📘 ${escaparHTML(t.curso)}</span>
              <span class="pill pill-${t.prioridad}">Prioridad ${t.prioridad}</span>
              <span class="pill pill-${estadoReal}">${estadoReal}</span>
            </div>
            <h3 class="task-title">${escaparHTML(t.titulo)}</h3>
            <p class="task-meta">📅 Entrega: <strong>${t.fecha}</strong> • ⏰ <strong>${t.hora}</strong></p>
            ${t.descripcion ? `<p class="task-desc">${escaparHTML(t.descripcion)}</p>` : ''}
          </div>
          <div class="task-actions">
            <a href="${t.generarUrlGoogleCalendar()}" target="_blank" rel="noopener" class="btn-icon gcal" title="Agendar en Google Calendar">
              📅 Calendar
            </a>
            <button type="button" class="btn-icon done" onclick="toggleCompletar(${t.id})">
              ${esCompletada ? '↩ Reabrir' : '✔ Completar'}
            </button>
            <button type="button" class="btn-icon" onclick="abrirModalEditar(${t.id})">✏️</button>
            <button type="button" class="btn-icon del" onclick="eliminarTareaUI(${t.id})">🗑️</button>
          </div>
        </article>
      `;
    })
    .join('');
}

function toggleCompletar(id) {
  sistema.alternarEstadoTarea(id);
  actualizarUI();
}

function eliminarTareaUI(id) {
  sistema.eliminarTarea(id);
  actualizarUI();
  mostrarToast('🗑️ Tarea eliminada.');
}

// ==================== EDICIÓN ====================
function abrirModalEditar(id) {
  const t = sistema.listaTareas.find((item) => item.id === id);
  if (!t) return;
  document.getElementById('edit-id').value = t.id;
  document.getElementById('edit-titulo').value = t.titulo;
  document.getElementById('edit-curso').value = t.curso;
  document.getElementById('edit-fecha').value = t.fecha;
  document.getElementById('edit-hora').value = t.hora;
  document.getElementById('edit-prioridad').value = t.prioridad;
  document.getElementById('edit-descripcion').value = t.descripcion;
  document.getElementById('modal-editar').classList.remove('hidden');
}

function cerrarModalEditar() {
  document.getElementById('modal-editar').classList.add('hidden');
}

function guardarEdicionTarea(e) {
  e.preventDefault();
  const id = Number(document.getElementById('edit-id').value);
  sistema.editarTarea(id, {
    titulo: document.getElementById('edit-titulo').value,
    curso: document.getElementById('edit-curso').value,
    fecha: document.getElementById('edit-fecha').value,
    hora: document.getElementById('edit-hora').value,
    prioridad: document.getElementById('edit-prioridad').value,
    descripcion: document.getElementById('edit-descripcion').value
  });
  cerrarModalEditar();
  actualizarUI();
  mostrarToast('✏️ Tarea actualizada.');
}

// ==================== CALENDARIO INTERACTIVO ====================
function cambiarMesCalendario(delta) {
  fechaCalendarioActual.setMonth(fechaCalendarioActual.getMonth() + delta);
  renderizarCalendario();
}

function renderizarCalendario() {
  const grid = document.getElementById('calendario-grid');
  const anio = fechaCalendarioActual.getFullYear();
  const mes = fechaCalendarioActual.getMonth();

  const nombreMes = fechaCalendarioActual.toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric'
  });
  document.getElementById('cal-mes-titulo').textContent = nombreMes;

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  let html = diasSemana.map((d) => `<div class="cal-day-name">${d}</div>`).join('');

  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const hoyStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < primerDia; i++) {
    html += `<div class="cal-cell empty"></div>`;
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaISO = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const tareasDia = sistema.listaTareas.filter((t) => t.fecha === fechaISO);
    const esHoy = fechaISO === hoyStr;

    const eventosHTML = tareasDia
      .map((t) => {
        const vencida = t.obtenerEstadoReal() === 'VENCIDA';
        return `<a href="${t.generarUrlGoogleCalendar()}" target="_blank" rel="noopener" class="cal-event-chip ${vencida ? 'vencida' : ''}" title="Clic para abrir en Google Calendar">
          ${t.hora} ${escaparHTML(t.titulo)}
        </a>`;
      })
      .join('');

    html += `
      <div class="cal-cell ${esHoy ? 'today' : ''}">
        <span class="cal-date-num">${dia}</span>
        ${eventosHTML}
      </div>
    `;
  }

  grid.innerHTML = html;
}

// ==================== NOTIFICACIONES PUSH Y CORREO ====================
async function activarNotificacionesPush() {
  if (!('Notification' in window)) {
    mostrarToast('Tu navegador no soporta notificaciones Push nativas.');
    return;
  }
  const permiso = await Notification.requestPermission();
  actualizarBotonPush();
  if (permiso === 'granted') {
    new Notification('UniPlan 🎓', {
      body: `Notificaciones Push activadas para ${sistema.usuario.email}`
    });
    mostrarToast('🔔 Notificaciones Push activadas.');
  } else {
    mostrarToast('Permiso de notificaciones denegado en el navegador.');
  }
}

function actualizarBotonPush() {
  const span = document.getElementById('estado-push-texto');
  if (!('Notification' in window)) {
    span.textContent = 'Push no soportado';
    return;
  }
  span.textContent = Notification.permission === 'granted' ? 'Push Activo ✅' : 'Activar Push';
}

function verificarAlertasAhora() {
  const n = sistema.comprobarVencimientosAutomaticos();
  if (n === 0) mostrarToast('✅ No hay tareas nuevas próximas a vencer.');
}

function enviarResumenCorreoAhora() {
  const stats = sistema.actualizarEstadisticas();
  const pendientes = sistema.listaTareas.filter((t) => t.obtenerEstadoReal() !== 'COMPLETADA');
  const detalle =
    pendientes.length > 0
      ? pendientes.slice(0, 5).map((t) => `• ${t.titulo} (${t.curso}) - ${t.fecha} ${t.hora}`).join('\n')
      : 'No tienes tareas pendientes.';

  sistema.despacharNotificacion(
    `Resumen Académico UniPlan (${stats.porcentajeAvance}% completado)`,
    `Total: ${stats.total} | Pendientes: ${stats.pendientes} | Vencidas: ${stats.vencidas}\n${detalle}`,
    true
  );
  mostrarToast(`📧 Resumen enviado al correo: ${sistema.usuario.email}`);
}

function renderizarHistorialAlertas() {
  if (!sistema) return;
  const cont = document.getElementById('historial-alertas-contenedor');
  const badge = document.getElementById('badge-alertas');
  badge.textContent = sistema.historialAlertas.length;

  if (sistema.historialAlertas.length === 0) {
    cont.innerHTML = `<p class="empty-state">Aún no se han generado alertas Push o correos en esta cuenta.</p>`;
    return;
  }

  cont.innerHTML = sistema.historialAlertas
    .map(
      (a) => `
      <div class="alert-entry">
        <div>
          <strong>${escaparHTML(a.asunto)}</strong>
          <span>Para: ${escaparHTML(a.destinatario)} • ${escaparHTML(a.mensaje)}</span>
        </div>
        <div style="text-align:right; min-width:150px;">
          <span class="pill pill-COMPLETADA">${escaparHTML(a.estadoEnvio)}</span>
          <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">${a.fecha}</div>
        </div>
      </div>
    `
    )
    .join('');
}

// ==================== INTEGRACIONES MODAL ====================
function abrirModalConfig() {
  document.getElementById('cfg-anticipo').value = sistema.config.horasAnticipo || 24;
  document.getElementById('cfg-emailjs-service').value = sistema.config.emailjsService || '';
  document.getElementById('cfg-emailjs-template').value = sistema.config.emailjsTemplate || '';
  document.getElementById('cfg-emailjs-pubkey').value = sistema.config.emailjsPubKey || '';
  document.getElementById('modal-config').classList.remove('hidden');
}

function cerrarModalConfig() {
  document.getElementById('modal-config').classList.add('hidden');
}

function guardarConfigIntegraciones(e) {
  e.preventDefault();
  sistema.config = {
    horasAnticipo: Number(document.getElementById('cfg-anticipo').value),
    emailjsService: document.getElementById('cfg-emailjs-service').value.trim(),
    emailjsTemplate: document.getElementById('cfg-emailjs-template').value.trim(),
    emailjsPubKey: document.getElementById('cfg-emailjs-pubkey').value.trim()
  };
  sistema.persistirEnCuenta();
  cerrarModalConfig();
  mostrarToast('⚙️ Preferencias de correo y alertas guardadas.');
}

function mostrarToast(texto) {
  const cont = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = texto;
  cont.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function escaparHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
