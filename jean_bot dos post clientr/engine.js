
 // ==UserScript==
 // @name         LOBO PRO - DOS POSTS - LIMPIO
 // @namespace    http://tampermonkey.net/
 // @version      7.0
 // @match        *://megapersonals.eu/*
 // @match        *://*.megapersonals.eu/*
 // @grant        none
 // @run-at       document-start
 // ==/UserScript==

(function () {
  'use strict';

  // =========================================
  // LOBO PRO - DOS POSTS
  // SIN TELEGRAM
  // SIN PANEL REMOTO
  // SIN CLAVES NI REPORTES
  // =========================================

  const CICLO_MINUTOS = 16;
  const DELAY_CONFIRMACION = 15;
  const DELAY_SEGUNDO_TOQUE = 10;

  const MINUTO_FOTO_INFERIOR = 15;

  const PREFIX = 'LOBO_LIMPIO_DOS_POSTS';

  const KEY_ESTADO = PREFIX + '_ESTADO';
  const KEY_FASE = PREFIX + '_FASE';
  const KEY_NEXT = PREFIX + '_NEXT';
  const KEY_FOTO = PREFIX + '_FOTO';

  const UI_ID = 'lobo-limpio-dos-posts';

  let activo =
    localStorage.getItem(KEY_ESTADO) === 'ACTIVA';

  let fase = Number(
    localStorage.getItem(KEY_FASE) || 0
  );

  let nextTime = Number(
    localStorage.getItem(KEY_NEXT) || 0
  );

  let ocupado = false;
  let toqueEnProceso = false;

  if (![0, 1, 2].includes(fase)) {
    fase = 0;
  }

  if (!nextTime) {
    nextTime =
      Date.now() + CICLO_MINUTOS * 60000;

    guardarMemoria(0, nextTime);
  }

  function guardarMemoria(nuevaFase, tiempo) {
    fase = nuevaFase;
    nextTime = tiempo;

    localStorage.setItem(
      KEY_FASE,
      String(fase)
    );

    localStorage.setItem(
      KEY_NEXT,
      String(nextTime)
    );
  }

  function cambiarEstado() {
    activo = !activo;

    localStorage.setItem(
      KEY_ESTADO,
      activo ? 'ACTIVA' : 'PAUSADA'
    );

    localStorage.removeItem(KEY_FOTO);

    guardarMemoria(
      0,
      Date.now() +
        CICLO_MINUTOS * 60000
    );

    renderBoton();
  }

  function detectarExito() {
    const texto =
      (document.body?.innerText || '')
      .toLowerCase();

    const url =
      location.href.toLowerCase();

    return (
      url.includes('success_publish') ||
      texto.includes('sweet!') ||
      texto.includes(
        'your post has been published'
      )
    );
  }

  function hayVerificacion() {
    const texto =
      (document.body?.innerText || '')
      .toLowerCase();

    const url = location.href.toLowerCase();

    return (
      url.includes('/login') ||
      texto.includes('verify you are human') ||
      texto.includes('verification required') ||
      texto.includes('account blocked') ||
      texto.includes('account suspended') ||
      Boolean(
        document.querySelector(
          'iframe[src*="recaptcha"], .g-recaptcha'
        )
      )
    );
  }

  function pausarPorVerificacion() {
    activo = false;

    localStorage.setItem(
      KEY_ESTADO,
      'PAUSADA'
    );

    localStorage.removeItem(KEY_FOTO);

    guardarMemoria(
      0,
      Date.now() +
        CICLO_MINUTOS * 60000
    );

    console.warn(
      'LOBO PRO DOS POSTS: pausado por verificación o bloqueo.'
    );

    renderBoton();
  }

  function tocarFotoInferior(cicloActual) {
    const fotos = Array.from(
      document.querySelectorAll(
        'a[href*="/users/posts/select/"] img'
      )
    )
      .filter(img => {
        const rect =
          img.getBoundingClientRect();

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          img.offsetParent !== null
        );
      })
      .sort((a, b) => {
        const aY =
          a.getBoundingClientRect().top +
          window.scrollY;

        const bY =
          b.getBoundingClientRect().top +
          window.scrollY;

        return aY - bY;
      });

    const fotoAbajo =
      fotos[fotos.length - 1];

    if (!fotoAbajo) return false;

    localStorage.setItem(
      KEY_FOTO,
      cicloActual
    );

    fotoAbajo.scrollIntoView({
      behavior: 'auto',
      block: 'center'
    });

    fotoAbajo.click();

    console.log(
      '[DOS POSTS 🐺🐺] Foto inferior seleccionada'
    );

    return true;
  }

  function revisarFotoInferior() {
    if (!activo || toqueEnProceso) return;
    if (fase !== 0) return;

    const faltan =
      nextTime - Date.now();

    if (
      faltan <= 0 ||
      faltan >
        MINUTO_FOTO_INFERIOR * 60000
    ) {
      return;
    }

    const cicloActual =
      String(nextTime);

    if (
      localStorage.getItem(KEY_FOTO) ===
      cicloActual
    ) {
      return;
    }

    toqueEnProceso = true;

    try {
      tocarFotoInferior(cicloActual);
    } catch (error) {
      console.error(
        '[LOBO PRO DOS POSTS]',
        error
      );
    } finally {
      toqueEnProceso = false;
    }
  }

  function ejecutarPasoPrincipal() {
    const boton =
      document.querySelector(
        '#managePublishAd'
      );

    if (!boton) return false;

    boton.click();

    console.log(
      '[DOS POSTS 🐺🐺] Publicación principal solicitada'
    );

    return true;
  }

  function ejecutarPasoConfirmacion() {
    if (!detectarExito()) return false;

    const elementos = Array.from(
      document.querySelectorAll(
        'a, button, input[type="button"], input[type="submit"]'
      )
    );

    const boton = elementos.find(el => {
      const texto = String(
        el.innerText ||
        el.value ||
        el.textContent ||
        ''
      ).trim().toLowerCase();

      return texto.includes('my posts');
    });

    if (boton) {
      boton.click();
      return true;
    }

    if (history.length > 1) {
      history.back();
      return true;
    }

    return false;
  }

  function renderBoton() {
    if (!document.body) return;

    let box =
      document.getElementById(UI_ID);

    if (!box) {
      box = document.createElement('div');
      box.id = UI_ID;

      box.style.cssText = `
        position:fixed;
        bottom:70px;
        right:15px;
        width:180px;
        height:50px;
        border-radius:25px;
        border:1px solid #777;
        z-index:2147483647;
        display:flex;
        align-items:center;
        justify-content:space-evenly;
        cursor:pointer;
        font-family:monospace;
        font-weight:bold;
        background:rgba(0,0,0,0.9);
        box-shadow:0 2px 10px rgba(0,0,0,.35);
      `;

      box.innerHTML = `
        <span style="font-size:30px">🐺</span>

        <span
          class="lobo-led"
          style="
            width:13px;
            height:13px;
            border-radius:50%;
          "
        ></span>

        <span
          class="lobo-time"
          style="
            color:#fff;
            font-size:16px;
            min-width:48px;
            text-align:center;
          "
        >OFF</span>

        <span style="font-size:30px">🐺</span>
      `;

      box.addEventListener(
        'pointerdown',
        e => {
          e.preventDefault();
          e.stopPropagation();
          cambiarEstado();
        }
      );

      document.body.appendChild(box);
    }

    const led =
      box.querySelector('.lobo-led');

    const reloj =
      box.querySelector('.lobo-time');

    const faltan = Math.max(
      0,
      Math.ceil(
        (nextTime - Date.now()) / 1000
      )
    );

    const minutos =
      Math.floor(faltan / 60);

    const segundos =
      String(faltan % 60).padStart(2, '0');

    led.style.background =
      activo ? '#00ff00' : '#ff0000';

    led.style.boxShadow =
      activo
        ? '0 0 8px #00ff00'
        : '0 0 8px #ff0000';

    reloj.textContent =
      activo
        ? `${minutos}:${segundos}`
        : 'OFF';
  }

  function motor() {
    if (!activo || ocupado) return;
    if (!document.body) return;

    if (hayVerificacion()) {
      pausarPorVerificacion();
      return;
    }

    const ahora = Date.now();

    if (ahora < nextTime) return;

    ocupado = true;

    try {
      if (fase === 0) {
        const ok =
          ejecutarPasoPrincipal();

        if (ok) {
          guardarMemoria(
            1,
            Date.now() +
              DELAY_CONFIRMACION * 1000
          );
        } else {
          guardarMemoria(
            0,
            Date.now() + 1000
          );
        }

        return;
      }

      if (fase === 1) {
        if (detectarExito()) {
          guardarMemoria(
            2,
            Date.now() +
              DELAY_SEGUNDO_TOQUE * 1000
          );
        } else {
          guardarMemoria(
            1,
            Date.now() + 1000
          );
        }

        return;
      }

      if (fase === 2) {
        const ok =
          ejecutarPasoConfirmacion();

        if (ok) {
          guardarMemoria(
            0,
            Date.now() +
              CICLO_MINUTOS * 60000
          );
        } else {
          guardarMemoria(
            2,
            Date.now() + 1000
          );
        }
      }

    } catch (error) {
      console.error(
        '[LOBO PRO DOS POSTS]',
        error
      );
    } finally {
      ocupado = false;
    }
  }

  setInterval(() => {
    renderBoton();

    if (!activo || !document.body) return;

    if (hayVerificacion()) {
      pausarPorVerificacion();
      return;
    }

    motor();
    revisarFotoInferior();
  }, 1000);

})();
