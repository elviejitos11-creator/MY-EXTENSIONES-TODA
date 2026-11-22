chrome.runtime.onMessage.addListener((mensaje, sender) => {
  if (mensaje?.tipo !== "LOBO_CARGAR_MOTOR") {
    return;
  }

  if (!sender.tab?.id || sender.frameId !== 0) {
    return;
  }

  const url = sender.url || "";

  if (!/^https?:\/\/([^.]+\.)?megapersonals\.eu\//i.test(url)) {
    return;
  }

  (async () => {
    const estado = await chrome.storage.local.get({
      loboActivo: false
    });

    if (!estado.loboActivo) return;

    await chrome.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        frameIds: [0]
      },
      files: [
        "html2canvas.min.js",
        "engine.js"
      ],
      world: "MAIN",
      injectImmediately: true
    });
  })().catch(error => {
    console.error("LOBO PRO: error cargando motor", error);
  });
});

chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
 if(msg?.tipo!=="CQ_VERIFICAR_PANEL3_2" &&
    msg?.tipo!=="CQ_ACTIVAR_PANEL3_2")return;

 (async()=>{
  try{
   if(msg.tipo==="CQ_ACTIVAR_PANEL3_2"){
    const clave=String(msg.clave||"").trim();
    const datos=await chrome.storage.local.get(["cqDispositivo"]);
    const dispositivo=datos.cqDispositivo||crypto.randomUUID();

    const r=await fetch("https://cqcontrollicencias-production.up.railway.app/api/licencias/activar-instalacion",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({
      clave,
      producto:"PANAL2_TELEGRAM_DOS_POST",
      dispositivo
     })
    });

    const d=await r.json();

    if(!r.ok||!d.autorizada){
     reply({autorizada:false,motivo:d.motivo||"rechazada"});
     return;
    }

    await chrome.storage.local.set({
     cqClave:clave,
     cqDispositivo:dispositivo,
     cqCliente:d.cliente
    });

    reply({
     autorizada:true,
     cliente:d.cliente,
     vence_en:d.vence_en
    });
    return;
   }

   const v=await chrome.storage.local.get(["cqClave","cqDispositivo"]);

   if(!v.cqClave||!v.cqDispositivo){
    reply({autorizada:false,motivo:"sin_activar"});
    return;
   }

   const r=await fetch("https://cqcontrollicencias-production.up.railway.app/api/licencias/verificar",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     clave:v.cqClave,
     producto:"PANAL2_TELEGRAM_DOS_POST",
     dispositivo:v.cqDispositivo
    })
   });

   const d=await r.json();
   reply({
    autorizada:r.ok&&d.autorizada===true,
    motivo:d.motivo||null
   });

  }catch(e){
   reply({autorizada:false,motivo:"servidor_no_disponible"});
  }
 })();

 return true;
});
