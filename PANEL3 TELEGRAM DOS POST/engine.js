
/*
 * LOBO PRO - DOS POSTS - PAMAEL3 TELEGRAM 
 * Version 6.9.1 - Extension Dolphin Anty
 * Ejecucion: MAIN world, document_start
 * ON/OFF autenticado y confirmado por Railway
 * Requiere html2canvas.min.js precargado
 */

(function () {
  'use strict';

  const KEY_PERFIL_GLOBAL = 'PANEL_PERFIL_ID';

  function obtenerPerfilId() {
    let id = localStorage.getItem(KEY_PERFIL_GLOBAL);

    if (!id || !String(id).trim()) {
      id = prompt('Escribe el ID del perfil del panel:');

      if (!id || !String(id).trim()) {
        alert('Falta ID del perfil. El motor no va a trabajar.');
        return '';
      }

      id = String(id).trim();
      localStorage.setItem(KEY_PERFIL_GLOBAL, id);
    }

    return String(id).trim();
  }

  const PERFIL_ID = obtenerPerfilId();
  if (!PERFIL_ID) return;

  const KEY_TOKEN_GLOBAL = `PANEL_CLIENTE_TOKEN_${PERFIL_ID}`;

  function obtenerClienteToken() {
    let token = localStorage.getItem(KEY_TOKEN_GLOBAL);

    if (!token || !String(token).trim()) {
      token = prompt(
        `Escribe la clave de acceso del perfil ${PERFIL_ID}:`
      );

      if (!token || !String(token).trim()) {
        alert('Falta clave de acceso. El motor no va a trabajar.');
        return '';
      }

      token = String(token).trim();
      localStorage.setItem(KEY_TOKEN_GLOBAL, token);
    }

    return String(token).trim();
  }

  let CLIENTE_TOKEN = obtenerClienteToken();
  if (!CLIENTE_TOKEN) return;

  // TELEGRAM NORMAL - URL ORIGINALES
  const PANEL_LOCAL = "http://127.0.0.1:3003";
  const PANEL_NUBE = "https://jean-carlos-bot-production.up.railway.app";

  const CICLO_MINUTOS = 16;
  const DELAY_CONFIRMACION = 15;
  const DELAY_SEGUNDO_TOQUE = 10;

  // DOS POSTS: utiliza el mismo ciclo principal.
  // Cuando faltan 15 minutos toca la foto inferior una vez.
  const MINUTO_FOTO_INFERIOR = 15;

  const KEY_CICLO_FOTO_INFERIOR =
    `ciclo_foto_inferior_${PERFIL_ID}`;

  let toqueFotoInferiorEnProceso = false;

  // MODO GUARDIA ORIGINAL
  const MODO_GUARDIA_ACTIVO = true;
  const MAX_FALLOS_BOTON = 120;
  const MAX_ESPERA_EXITO = 120;
  const MAX_FALLOS_MY_POSTS = 60;

  const KEY_ESTADO = `estado_${PERFIL_ID}`;
  const KEY_FASE = `fase_${PERFIL_ID}`;
  const KEY_NEXT = `next_${PERFIL_ID}`;
  const KEY_DATOS = `datos_mega_${PERFIL_ID}`;
  const KEY_ULTIMO_REPORTE = `ultimo_reporte_publicado_${PERFIL_ID}`;

  const KEY_ALERTA_ENVIADA = `alerta_enviada_${PERFIL_ID}`;
  const KEY_FALLOS_BOTON = `fallos_boton_${PERFIL_ID}`;
  const KEY_FALLOS_EXITO = `fallos_exito_${PERFIL_ID}`;
  const KEY_FALLOS_MYPOSTS = `fallos_myposts_${PERFIL_ID}`;

  let estadoLocal = localStorage.getItem(KEY_ESTADO) || 'PAUSADA';
  let lockoutReporte = false;
  let lockoutDatos = false;
  let avisoTokenInvalido = false;
  let alertaEnProceso = false;

  let fase = parseInt(localStorage.getItem(KEY_FASE), 10);
  let nextTime = parseInt(localStorage.getItem(KEY_NEXT), 10);

  if (Number.isNaN(fase)) fase = 0;

  if (!nextTime || Number.isNaN(nextTime)) {
    nextTime = Date.now() + (CICLO_MINUTOS * 60 * 1000);
    guardarMemoria(fase, nextTime);
  }

  function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function guardarEstado(estado) {
    estadoLocal = estado;
    localStorage.setItem(KEY_ESTADO, estado);
  }

  function guardarMemoria(f, t) {
    fase = f;
    nextTime = t;
    localStorage.setItem(KEY_FASE, String(f));
    localStorage.setItem(KEY_NEXT, String(t));
  }

  function limpiarContadoresGuardia() {
    localStorage.removeItem(KEY_FALLOS_BOTON);
    localStorage.removeItem(KEY_FALLOS_EXITO);
    localStorage.removeItem(KEY_FALLOS_MYPOSTS);
  }

  function limpiarBloqueoAlertaLocal() {
    localStorage.removeItem(KEY_ALERTA_ENVIADA);
  }

  // =====================================================
  // SEGUNDO POST - RELOJ DEL CICLO PRINCIPAL
  // =====================================================

  function iniciarRelojFotoInferior() {
    localStorage.removeItem(KEY_CICLO_FOTO_INFERIOR);

    console.log(
      '[DOS POSTS 🐺🐺] Sincronizado con el ciclo principal'
    );
  }

  function detenerRelojFotoInferior() {
    localStorage.removeItem(KEY_CICLO_FOTO_INFERIOR);
  }

  function asegurarRelojFotoInferior() {
    // No existe reloj separado.
    // Utiliza nextTime del motor principal.
  }

  function tocarFotoInferior(cicloActual) {
    const fotos = [
      ...document.querySelectorAll(
        'a[href*="/users/posts/select/"] img'
      )
    ]
    .filter(img => {
      const r = img.getBoundingClientRect();

      return (
        r.width > 0 &&
        r.height > 0 &&
        img.offsetParent !== null
      );
    })
    .sort((a, b) =>
      (a.getBoundingClientRect().top + window.scrollY) -
      (b.getBoundingClientRect().top + window.scrollY)
    );

    const fotoAbajo = fotos[fotos.length - 1];

    if (fotoAbajo) {
      localStorage.setItem(
        KEY_CICLO_FOTO_INFERIOR,
        cicloActual
      );

      fotoAbajo.scrollIntoView({
        behavior: 'auto',
        block: 'center'
      });

      fotoAbajo.click();

      console.log(
        '[DOS POSTS 🐺🐺] TOQUE A LA FOTO DE ABAJO EN 15:00'
      );

      return true;
    }

    console.log(
      '[DOS POSTS 🐺🐺] No encontré la foto de abajo todavía'
    );

    return false;
  }

  function revisarFotoInferior() {
    if (toqueFotoInferiorEnProceso) return;
    if (estadoLocal !== 'ACTIVA') return;
    if (fase !== 0) return;
    if (!nextTime || Number.isNaN(nextTime)) return;

    const ahora = Date.now();
    const faltan = nextTime - ahora;

    if (faltan <= 0) return;

    if (faltan > (MINUTO_FOTO_INFERIOR * 60 * 1000)) {
      return;
    }

    const cicloActual = String(nextTime);

    if (
      localStorage.getItem(KEY_CICLO_FOTO_INFERIOR) === cicloActual
    ) {
      return;
    }

    toqueFotoInferiorEnProceso = true;

    try {
      tocarFotoInferior(cicloActual);
    } catch (e) {
      console.log(
        '[DOS POSTS 🐺🐺] Error tocando foto inferior:',
        e
      );
    } finally {
      toqueFotoInferiorEnProceso = false;
    }
  }

  // =====================================================
  // ACCESO Y LICENCIA
  // =====================================================

  function limpiarMemoriaAcceso() {
    localStorage.removeItem(KEY_PERFIL_GLOBAL);
    localStorage.removeItem(KEY_TOKEN_GLOBAL);
    localStorage.removeItem(KEY_ESTADO);
    localStorage.removeItem(KEY_FASE);
    localStorage.removeItem(KEY_NEXT);
    localStorage.removeItem(KEY_DATOS);
    localStorage.removeItem(KEY_ULTIMO_REPORTE);
    localStorage.removeItem(KEY_ALERTA_ENVIADA);
    localStorage.removeItem(KEY_FALLOS_BOTON);
    localStorage.removeItem(KEY_FALLOS_EXITO);
    localStorage.removeItem(KEY_FALLOS_MYPOSTS);
    localStorage.removeItem(KEY_CICLO_FOTO_INFERIOR);
    localStorage.removeItem(`next_foto_inferior_${PERFIL_ID}`);
  }

  function bloquearPorClave(motivo) {
    if (avisoTokenInvalido) return;

    avisoTokenInvalido = true;
    guardarEstado('PAUSADA');
    detenerRelojFotoInferior();
    limpiarMemoriaAcceso();

    alert(
      `${motivo || 'Acceso inválido'}. Se borró el acceso viejo. El script pedirá ID y clave otra vez.`
    );

    setTimeout(() => {
      try {
        window.location.reload();
      } catch (e) {}
    }, 1000);
  }

  async function fetchPanel(path, options = {}) {
    try {
      return await fetch(`${PANEL_LOCAL}${path}`, {
        ...options,
        cache: 'no-store'
      });
    } catch (e) {
      return await fetch(`${PANEL_NUBE}${path}`, {
        ...options,
        cache: 'no-store'
      });
    }
  }

  async function fetchJSONBase(base, path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(`${base}${path}`, {
        ...options,
        cache: 'no-store',
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();

    } finally {
      clearTimeout(timer);
    }
  }

  async function consultarFuente(base, id) {
    const resultado = {
      base,
      estadoPanel: '',
      estadoLicencia: '',
      licenciaOk: false,
      motivoLicencia: ''
    };

    try {
      const dataEstado = await fetchJSONBase(
        base,
        `/api/estado/${encodeURIComponent(id)}?t=${Date.now()}`
      );

      resultado.estadoPanel =
        String(dataEstado?.estado || '').toUpperCase();

    } catch (e) {
      console.log(
        'No se pudo consultar estado en:',
        base,
        e.message
      );
    }

    try {
      const tokenSeguro = encodeURIComponent(CLIENTE_TOKEN);

      const dataLicencia = await fetchJSONBase(
        base,
        `/api/licencia/${encodeURIComponent(id)}?token=${tokenSeguro}&t=${Date.now()}`
      );

      resultado.estadoLicencia =
        String(dataLicencia?.estado || '').toUpperCase();

      resultado.licenciaOk =
        dataLicencia?.ok === true;

      resultado.motivoLicencia =
        String(dataLicencia?.motivo || '');

    } catch (e) {
      console.log(
        'No se pudo consultar licencia en:',
        base,
        e.message
      );
    }

    return resultado;
  }

  // =====================================================
  // DATOS Y FOTOS
  // =====================================================

  function limpiarTexto(v) {
    return String(v || '').replace(/\s+/g, ' ').trim();
  }

  function sacarLinea(texto, etiqueta) {
    const regex =
      new RegExp(`${etiqueta}\\s*:\\s*([^\\n\\r]+)`, 'i');

    const match = texto.match(regex);

    return match ? limpiarTexto(match[1]) : '';
  }

  function normalizarUrlImagen(src) {
    try {
      if (!src || src.startsWith('data:')) return '';
      return new URL(src, window.location.href).href;
    } catch (e) {
      return '';
    }
  }

  function detectarFotosMega() {
    const fotos = [];
    const imgs = Array.from(document.querySelectorAll('img'));

    for (const img of imgs) {
      const src = normalizarUrlImagen(
        img.currentSrc ||
        img.getAttribute('data-original') ||
        ''
      );

      if (!src) continue;

      const rect = img.getBoundingClientRect();
      const ancho = rect.width || img.naturalWidth || 0;
      const alto = rect.height || img.naturalHeight || 0;

      if (ancho < 250 || alto < 250) continue;

      const proporcion = ancho / alto;

      if (proporcion > 1.7 || proporcion < 0.5) continue;

      const area = ancho * alto;
      if (area < 90000) continue;

      fotos.push({
        src,
        y: rect.top + window.scrollY,
        area
      });
    }

    fotos.sort((a, b) => {
      if (a.y !== b.y) return b.y - a.y;
      return b.area - a.area;
    });

    return [...new Set(fotos.map(f => f.src))].slice(0, 10);
  }

  function leerDatosMega() {
    const textoPagina = document.body?.innerText || '';

    const telefono = sacarLinea(textoPagina, 'Phone');
    const city = sacarLinea(textoPagina, 'City');
    const location = sacarLinea(textoPagina, 'Location');
    const fotos = detectarFotosMega();

    let textoPost = '';

    const lineas = textoPagina
      .split('\n')
      .map(limpiarTexto)
      .filter(Boolean);

    const idxLocation =
      lineas.findIndex(l => /^Location\s*:/i.test(l));

    if (idxLocation >= 0) {
      textoPost = lineas
        .slice(idxLocation + 1, idxLocation + 10)
        .filter(l =>
          !/^Age\s*:/i.test(l) &&
          !/^Tokens/i.test(l) &&
          !/^CURRENT POST/i.test(l)
        )
        .join(' ')
        .slice(0, 1000);
    }

    return {
      telefono,
      ubicacion: limpiarTexto(
        [city, location].filter(Boolean).join(' - ')
      ),
      texto: limpiarTexto(textoPost),
      foto_pagina: fotos[0] || '',
      fotos_pagina: fotos
    };
  }

  // =====================================================
  // EVENTOS Y ALERTAS - TELEGRAM NORMAL
  // =====================================================

  async function registrarEventoEnPanel(payload) {
    const payloadSeguro = {
      ...payload,
      token: CLIENTE_TOKEN
    };

    const opciones = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cliente-Token': CLIENTE_TOKEN
      },
      body: JSON.stringify(payloadSeguro),
      cache: 'no-store'
    };

    try {
      const resLocal =
        await fetch(`${PANEL_LOCAL}/registrar-evento`, opciones);

      if (resLocal && resLocal.status === 403) {
        bloquearPorClave('Clave inválida o acceso reseteado');
        return;
      }

    } catch (e) {
      console.log(
        'No se pudo mandar al panel local:',
        e
      );
    }

    try {
      const resNube =
        await fetch(`${PANEL_NUBE}/registrar-evento`, opciones);

      if (resNube && resNube.status === 403) {
        bloquearPorClave('Clave inválida o acceso reseteado');
        return;
      }

    } catch (e) {
      console.log(
        'No se pudo mandar al panel nube:',
        e
      );
    }
  }

  async function registrarAlertaEnPanel(payload) {
    if (alertaEnProceso) return;

    const yaEnviada =
      localStorage.getItem(KEY_ALERTA_ENVIADA) === '1';

    if (yaEnviada) return;

    alertaEnProceso = true;

    localStorage.setItem(
      KEY_ALERTA_ENVIADA,
      '1'
    );

    const payloadSeguro = {
      ...payload,
      token: CLIENTE_TOKEN
    };

    const opciones = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cliente-Token': CLIENTE_TOKEN
      },
      body: JSON.stringify(payloadSeguro),
      cache: 'no-store'
    };

    let enviada = false;

    try {
      const resLocal =
        await fetch(`${PANEL_LOCAL}/registrar-alerta`, opciones);

      if (resLocal && resLocal.status === 403) {
        bloquearPorClave('Clave inválida o acceso reseteado');
        return;
      }

      if (resLocal && resLocal.ok) {
        enviada = true;
      }

    } catch (e) {
      console.log(
        'No se pudo mandar alerta al panel local:',
        e
      );
    }

    try {
      const resNube =
        await fetch(`${PANEL_NUBE}/registrar-alerta`, opciones);

      if (resNube && resNube.status === 403) {
        bloquearPorClave('Clave inválida o acceso reseteado');
        return;
      }

      if (resNube && resNube.ok) {
        enviada = true;
      }

    } catch (e) {
      console.log(
        'No se pudo mandar alerta al panel nube:',
        e
      );
    }

    if (enviada) {
      guardarEstado('PAUSADA');
      detenerRelojFotoInferior();

      guardarMemoria(
        0,
        Date.now() + (CICLO_MINUTOS * 60 * 1000)
      );

      limpiarContadoresGuardia();
    } else {
      localStorage.removeItem(KEY_ALERTA_ENVIADA);
    }

    alertaEnProceso = false;
  }

  async function sincronizarDatosMega() {
    if (lockoutDatos || !document.body) return;
    if (detectarExito()) return;

    const datos = leerDatosMega();

    if (
      !datos.telefono &&
      !datos.ubicacion &&
      !datos.texto &&
      !datos.foto_pagina &&
      (!datos.fotos_pagina || datos.fotos_pagina.length === 0)
    ) return;

    const firma = JSON.stringify(datos);
    const anterior = localStorage.getItem(KEY_DATOS);

    if (firma === anterior) return;

    lockoutDatos = true;
    localStorage.setItem(KEY_DATOS, firma);

    await registrarEventoEnPanel({
      id: PERFIL_ID,
      tipo: 'silencioso',
      telefono: datos.telefono,
      ubicacion: datos.ubicacion,
      texto: datos.texto,
      foto_pagina: datos.foto_pagina,
      foto_modelo: datos.foto_pagina,
      fotos_pagina: datos.fotos_pagina,
      ultima_accion:
        'Datos y fotos actualizados automáticamente desde Mega',
      ultima_hora: new Date().toLocaleString()
    });

    setTimeout(() => {
      lockoutDatos = false;
    }, 30000);
  }

  // =====================================================
  // ESTADO - RAILWAY COMO FUENTE PRINCIPAL
  // =====================================================

  async function consultarEstadoPerfil(id) {
    try {
      const fuentes = [
        await consultarFuente(PANEL_NUBE, id)
      ];

      const tokenInvalido =
        fuentes.some(f =>
          f.estadoLicencia === 'TOKEN_INVALIDO'
        );

      if (tokenInvalido) {
        bloquearPorClave(
          'Clave de acceso incorrecta o acceso reseteado'
        );
        return 'PAUSADA';
      }

      const perfilNoExiste =
        fuentes.some(f =>
          f.estadoLicencia === 'NO_EXISTE' ||
          f.estadoPanel === 'NO_EXISTE'
        );

      if (perfilNoExiste) {
        bloquearPorClave(
          'El perfil ya no existe o fue cambiado'
        );
        return 'PAUSADA';
      }

      const algunPanelPausado =
        fuentes.some(f =>
          f.estadoPanel === 'PAUSADA'
        );

      const algunaLicenciaBloqueada =
        fuentes.some(f =>
          f.estadoLicencia === 'PAUSADA' ||
          f.estadoLicencia === 'VENCIDA'
        );

      if (
        algunPanelPausado ||
        algunaLicenciaBloqueada
      ) {
        guardarEstado('PAUSADA');
        detenerRelojFotoInferior();
        return 'PAUSADA';
      }

      const algunPanelActivo =
        fuentes.some(f =>
          f.estadoPanel === 'ACTIVA'
        );

      const algunaLicenciaActiva =
        fuentes.some(f =>
          f.licenciaOk === true &&
          f.estadoLicencia === 'ACTIVA'
        );

      if (
        algunPanelActivo &&
        algunaLicenciaActiva
      ) {
        guardarEstado('ACTIVA');
        limpiarBloqueoAlertaLocal();
        asegurarRelojFotoInferior();
        return 'ACTIVA';
      }

      console.log(
        'Sin confirmación clara. Mantiene estado actual:',
        estadoLocal
      );

      return estadoLocal;

    } catch (e) {
      console.log(
        'Error consultando panel/licencia. Mantiene estado:',
        estadoLocal
      );

      return estadoLocal;
    }
  }

  // =====================================================
  // ON/OFF AUTENTICADO Y CONFIRMADO
  // =====================================================

  async function cambiarEstadoEnPanel(id, accion) {
    const controller = new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      10000
    );

    try {
      const respuesta = await fetch(
        `${PANEL_NUBE}/accion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Cliente-Token': CLIENTE_TOKEN
          },
          body: JSON.stringify({
            id,
            accion,
            token: CLIENTE_TOKEN
          }),
          cache: 'no-store',
          signal: controller.signal
        }
      );

      if (
        respuesta.redirected ||
        new URL(respuesta.url).pathname === '/login'
      ) {
        throw new Error(
          'El servidor redirigió la orden al login'
        );
      }

      if (!respuesta.ok) {
        throw new Error(
          `Servidor respondió HTTP ${respuesta.status}`
        );
      }

      const resultado = await respuesta.json();

      const esperado =
        accion === 'pausar' ? 'PAUSADA' : 'ACTIVA';

      if (
        resultado.ok !== true ||
        String(resultado.estado || '').toUpperCase() !== esperado
      ) {
        throw new Error(
          'El servidor no confirmó el cambio de estado'
        );
      }

      return esperado;

    } finally {
      clearTimeout(timer);
    }
  }

  // =====================================================
  // BOTON DOS LOBOS - ON/OFF SEGURO
  // =====================================================

  function renderBoton() {
    const idUI = `motor-panel-${PERFIL_ID}`;

    const faltan = Math.max(
      0,
      Math.round((nextTime - Date.now()) / 1000)
    );

    const m = Math.floor(faltan / 60);
    const s = faltan % 60;

    let box = document.getElementById(idUI);

    if (!box) {
      box = document.createElement('div');
      box.id = idUI;

      box.style = `
        position:fixed;
        bottom:70px;
        right:15px;
        width:180px;
        height:50px;
        border-radius:25px;
        border:1px solid #777;
        z-index:999999;
        display:flex;
        align-items:center;
        justify-content:space-evenly;
        cursor:pointer;
        font-family:monospace;
        font-weight:bold;
        background:rgba(0,0,0,0.9);
      `;

      box.innerHTML = `
        <span style="
          font-size:30px;
          line-height:1;
          flex:none;
        ">🐺</span>

        <div id="led-${PERFIL_ID}" style="
          width:13px;
          height:13px;
          border-radius:50%;
          flex:none;
        "></div>

        <span id="time-${PERFIL_ID}" style="
          color:#fff;
          font-size:16px;
          min-width:48px;
          text-align:center;
        ">0:00</span>

        <span style="
          font-size:30px;
          line-height:1;
          flex:none;
        ">🐺</span>
      `;

      box.onpointerdown = async e => {
        e.preventDefault();
        e.stopPropagation();

        if (box.dataset.enviando === '1') return;
        box.dataset.enviando = '1';

        try {
          const accion =
            estadoLocal === 'ACTIVA'
              ? 'pausar'
              : 'reanudar';

          const nuevoEstado = await cambiarEstadoEnPanel(
            PERFIL_ID,
            accion
          );

          guardarEstado(nuevoEstado);

          if (nuevoEstado === 'ACTIVA') {
            limpiarBloqueoAlertaLocal();
            limpiarContadoresGuardia();
            iniciarRelojFotoInferior();
          } else {
            detenerRelojFotoInferior();
          }

          renderBoton();

          console.log(
            '[DOS POSTS 🐺🐺] ON/OFF confirmado:',
            nuevoEstado
          );

        } catch (error) {
          console.error(
            '[DOS POSTS 🐺🐺] Error ON/OFF:',
            error
          );

          alert(
            'No se pudo cambiar el estado: ' +
            error.message
          );

        } finally {
          box.dataset.enviando = '0';
        }
      };

      document.body.appendChild(box);
    }

    const led =
      document.getElementById(`led-${PERFIL_ID}`);

    const time =
      document.getElementById(`time-${PERFIL_ID}`);

    const activa = estadoLocal === 'ACTIVA';

    led.style.background = activa ? '#0f0' : '#f00';

    led.style.boxShadow = activa
      ? '0 0 8px #0f0'
      : '0 0 8px #f00';

    time.textContent = activa
      ? `${m}:${s < 10 ? '0' : ''}${s}`
      : 'OFF';
  }

  // =====================================================
  // DETECCION Y CAPTURAS
  // =====================================================

  function detectarExito() {
    const txt =
      (document.body?.innerText || '').toLowerCase();

    const url =
      window.location.href.toLowerCase();

    return (
      url.includes('success_publish') ||
      txt.includes('sweet!') ||
      txt.includes('your post has been published')
    );
  }

  async function capturarPantallaCompleta() {
    try {
      if (!document.body) return '';

      await esperar(800);

      if (typeof window.html2canvas !== 'function') {
        console.log('html2canvas no está disponible');
        return '';
      }

      const html = document.documentElement;
      const body = document.body;

      const ancho = Math.max(
        html.scrollWidth || 0,
        body.scrollWidth || 0,
        html.clientWidth || 0,
        window.innerWidth || 0
      );

      const alto = Math.max(
        html.scrollHeight || 0,
        body.scrollHeight || 0,
        html.clientHeight || 0,
        window.innerHeight || 0
      );

      const canvas = await window.html2canvas(html, {
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        logging: false,
        scale: 1,
        width: ancho,
        height: alto,
        windowWidth: ancho,
        windowHeight: alto,
        scrollX: 0,
        scrollY: 0
      });

      return canvas.toDataURL('image/jpeg', 0.78);

    } catch (e) {
      console.log(
        'No se pudo capturar pantalla completa:',
        e
      );
      return '';
    }
  }

  async function capturarPruebaBumpCompleta() {
    try {
      if (!detectarExito() || !document.body) return '';

      await esperar(1200);

      if (typeof window.html2canvas !== 'function') {
        console.log('html2canvas no está disponible');
        return '';
      }

      const html = document.documentElement;
      const body = document.body;

      const ancho = Math.max(
        html.scrollWidth || 0,
        body.scrollWidth || 0,
        html.clientWidth || 0,
        window.innerWidth || 0
      );

      const alto = Math.max(
        html.scrollHeight || 0,
        body.scrollHeight || 0,
        html.clientHeight || 0,
        window.innerHeight || 0
      );

      const canvas = await window.html2canvas(html, {
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        logging: false,
        scale: 1,
        width: ancho,
        height: alto,
        windowWidth: ancho,
        windowHeight: alto,
        scrollX: 0,
        scrollY: 0
      });

      return canvas.toDataURL('image/jpeg', 0.82);

    } catch (e) {
      console.log(
        'No se pudo capturar prueba completa del bump:',
        e
      );
      return '';
    }
  }

  // =====================================================
  // MODO GUARDIA ORIGINAL
  // =====================================================

  function detectarProblemaPagina() {
    if (!MODO_GUARDIA_ACTIVO || !document.body) return null;
    if (detectarExito()) return null;

    const txt =
      (document.body.innerText || '').toLowerCase();

    const url =
      window.location.href.toLowerCase();

    const reglas = [
      {
        tipo: 'cuenta_bloqueada',
        motivo: 'Cuenta bloqueada o suspendida',
        patrones: [
          'account locked',
          'account suspended',
          'account disabled',
          'account blocked',
          'your account has been blocked',
          'your account has been suspended',
          'profile suspended',
          'posting disabled'
        ]
      },
      {
        tipo: 'verificacion',
        motivo: 'La página está pidiendo verificación',
        patrones: [
          'verification required',
          'verify your account',
          'phone verification',
          'verify phone',
          'verification code',
          'confirm your account',
          'verify your identity'
        ]
      },
      {
        tipo: 'captcha',
        motivo: 'Captcha o verificación anti-robot detectada',
        patrones: [
          'captcha',
          'recaptcha',
          'verify you are human',
          'are you human',
          'robot check',
          'security check'
        ]
      },
      {
        tipo: 'login_requerido',
        motivo: 'La sesión parece cerrada o pide login',
        patrones: [
          'please log in',
          'log in to your account',
          'login to your account',
          'sign in to your account',
          'session expired',
          'your session has expired'
        ]
      },
      {
        tipo: 'error_publicando',
        motivo: 'Error publicando o intentando publicar',
        patrones: [
          'error publishing',
          'unable to publish',
          'could not publish',
          'something went wrong',
          'try again later',
          'too many attempts',
          'temporarily unavailable',
          'service unavailable'
        ]
      },
      {
        tipo: 'post_removido',
        motivo: 'Publicación removida, rechazada o no disponible',
        patrones: [
          'post removed',
          'ad removed',
          'posting removed',
          'post rejected',
          'ad rejected',
          'not approved'
        ]
      },
      {
        tipo: 'acceso_denegado',
        motivo: 'Acceso denegado o pantalla no permitida',
        patrones: [
          'access denied',
          'forbidden',
          'not authorized',
          'unauthorized'
        ]
      }
    ];

    if (
      url.includes('/login') ||
      url.includes('/signin') ||
      url.includes('/sign-in')
    ) {
      return {
        tipo: 'login_requerido',
        motivo: 'La URL parece estar en login',
        detalle: `URL: ${window.location.href}`
      };
    }

    for (const regla of reglas) {
      for (const patron of regla.patrones) {
        if (
          txt.includes(patron) ||
          url.includes(patron.replace(/\s+/g, '-'))
        ) {
          return {
            tipo: regla.tipo,
            motivo: regla.motivo,
            detalle:
              `Detectado: ${patron}\nURL: ${window.location.href}`
          };
        }
      }
    }

    return null;
  }

  async function activarModoGuardia(
    tipo,
    motivo,
    detalle = ''
  ) {
    if (alertaEnProceso) return true;

    console.log('MODO GUARDIA:', tipo, motivo, detalle);

    guardarEstado('PAUSADA');
    detenerRelojFotoInferior();

    guardarMemoria(
      0,
      Date.now() + (CICLO_MINUTOS * 60 * 1000)
    );

    const foto = await capturarPantallaCompleta();

    await registrarAlertaEnPanel({
      id: PERFIL_ID,
      tipo,
      motivo,
      detalle,
      foto_alerta_base64: foto,
      ultima_hora: new Date().toLocaleString()
    });

    renderBoton();
    return true;
  }

  async function revisarModoGuardia() {
    if (!MODO_GUARDIA_ACTIVO || !document.body) return false;

    const problema = detectarProblemaPagina();

    if (problema) {
      await activarModoGuardia(
        problema.tipo,
        problema.motivo,
        problema.detalle
      );

      return true;
    }

    return false;
  }

  // =====================================================
  // MOTOR PRINCIPAL - DOS POSTS
  // =====================================================

  function ejecutarPasoPrincipal() {
    const btn = document.querySelector('#managePublishAd');

    console.log('btn existe:', !!btn);

    if (btn) {
      btn.click();
      console.log('BUMP CLICK REAL');
      return true;
    }

    return false;
  }

  function buscarBotonMyPosts() {
    const botones = Array.from(
      document.querySelectorAll(
        'a, button, input[type="button"], input[type="submit"]'
      )
    );

    for (const el of botones) {
      const texto = (
        el.innerText ||
        el.value ||
        el.textContent ||
        ''
      ).trim().toLowerCase();

      if (texto.includes('my posts')) {
        return el;
      }
    }

    return null;
  }

  function ejecutarPasoConfirmacion() {
    const enExito = detectarExito();
    if (!enExito) return false;

    console.log('FASE 2 intentando segundo toque real');

    const btnMyPosts = buscarBotonMyPosts();

    if (btnMyPosts) {
      btnMyPosts.click();
      console.log('Segundo toque en MY POSTS');
      return true;
    }

    if (window.history.length > 1) {
      try {
        window.history.back();
        console.log('Segundo toque usando history.back()');
        return true;
      } catch (e) {
        console.log('Falló history.back()');
      }
    }

    console.log('No se pudo hacer segundo toque');
    return false;
  }

  function aumentarContador(key) {
    const actual = parseInt(
      localStorage.getItem(key) || '0',
      10
    );

    const nuevo = Number.isNaN(actual)
      ? 1
      : actual + 1;

    localStorage.setItem(key, String(nuevo));
    return nuevo;
  }

  function resetContador(key) {
    localStorage.removeItem(key);
  }

  async function motor() {
    const estado = await consultarEstadoPerfil(PERFIL_ID);

    if (estado !== 'ACTIVA') {
      detenerRelojFotoInferior();

      guardarMemoria(
        0,
        Date.now() + (CICLO_MINUTOS * 60 * 1000)
      );

      renderBoton();
      return;
    }

    asegurarRelojFotoInferior();

    const guardiaActivo = await revisarModoGuardia();
    if (guardiaActivo) return;

    await sincronizarDatosMega();

    const ahora = Date.now();

    if (detectarExito() && !lockoutReporte) {
      lockoutReporte = true;

      limpiarContadoresGuardia();

      const fotoBumpBase64 =
        await capturarPruebaBumpCompleta();

      await registrarEventoEnPanel({
        id: PERFIL_ID,
        tipo: 'publicado',
        foto_bump_base64: fotoBumpBase64,
        ultima_accion: 'Publicado con éxito',
        ultima_hora: new Date().toLocaleString()
      });

      setTimeout(() => {
        lockoutReporte = false;
      }, 40000);
    }

    if (ahora < nextTime) {
      renderBoton();
      return;
    }

    if (fase === 0) {
      console.log('FASE 0 intentando BUMP');

      const ok = ejecutarPasoPrincipal();

      if (ok) {
        console.log('BUMP OK pasa a 15s');

        resetContador(KEY_FALLOS_BOTON);
        resetContador(KEY_FALLOS_EXITO);
        resetContador(KEY_FALLOS_MYPOSTS);

        guardarMemoria(
          1,
          Date.now() + (DELAY_CONFIRMACION * 1000)
        );

      } else {
        const fallos = aumentarContador(KEY_FALLOS_BOTON);

        console.log(
          'FALLÓ reintento 1s. Fallos botón:',
          fallos
        );

        if (fallos >= MAX_FALLOS_BOTON) {
          await activarModoGuardia(
            'boton_no_aparece',
            'No aparece el botón de bump después de varios intentos',
            `Fallos seguidos: ${fallos}\nFase: 0\nURL: ${window.location.href}`
          );

          return;
        }

        guardarMemoria(
          0,
          Date.now() + 1000
        );
      }

      renderBoton();
      return;
    }

    if (fase === 1) {
      if (detectarExito()) {
        console.log(
          `Pantalla rosada detectada esperando ${DELAY_SEGUNDO_TOQUE}s`
        );

        resetContador(KEY_FALLOS_EXITO);

        guardarMemoria(
          2,
          Date.now() + (DELAY_SEGUNDO_TOQUE * 1000)
        );

      } else {
        const fallos = aumentarContador(KEY_FALLOS_EXITO);

        console.log(
          'FASE 1 esperando pantalla de éxito. Espera:',
          fallos
        );

        if (fallos >= MAX_ESPERA_EXITO) {
          await activarModoGuardia(
            'no_llego_success',
            'Después del bump no llegó la pantalla Sweet / success',
            `Segundos esperando: ${fallos}\nFase: 1\nURL: ${window.location.href}`
          );

          return;
        }

        guardarMemoria(
          1,
          Date.now() + 1000
        );
      }

      renderBoton();
      return;
    }

    if (fase === 2) {
      const ok = ejecutarPasoConfirmacion();

      if (ok) {
        console.log('SEGUNDO TOQUE OK vuelve a 16 min');

        limpiarContadoresGuardia();

        guardarMemoria(
          0,
          Date.now() + (CICLO_MINUTOS * 60 * 1000)
        );

      } else {
        const fallos = aumentarContador(KEY_FALLOS_MYPOSTS);

        console.log(
          'FASE 2 no pudo hacer segundo toque. Fallos:',
          fallos
        );

        if (fallos >= MAX_FALLOS_MY_POSTS) {
          await activarModoGuardia(
            'my_posts_no_aparece',
            'No se pudo volver a My Posts después del success',
            `Fallos seguidos: ${fallos}\nFase: 2\nURL: ${window.location.href}`
          );

          return;
        }

        guardarMemoria(
          2,
          Date.now() + 1000
        );
      }

      renderBoton();
      return;
    }
  }

  setInterval(() => {
    try {
      if (document.body) {
        renderBoton();
        motor();
        revisarFotoInferior();
      }
    } catch (e) {
      console.log('Error:', e);
    }
  }, 1000);

})();
