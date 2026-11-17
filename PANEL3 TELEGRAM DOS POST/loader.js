/* CQ3_GATE_ACTIVACION_V1 */
(async () => {
  async function exigirClave() {
    await chrome.storage.local.set({loboActivo:false});
    await chrome.runtime.sendMessage({
      tipo:"CQ3_EXIGIR_ACTIVACION"
    });
  }

  try {
    const datos=await chrome.storage.local.get({
      loboActivo:false,
      cqClave:""
    });

    if(!String(datos.cqClave||"").trim()){
      await exigirClave();
      return;
    }

    const permiso=await chrome.runtime.sendMessage({
      tipo:"CQ_VERIFICAR_PANEL3_2"
    });

    if(permiso?.autorizada!==true){
      await exigirClave();
      return;
    }

    if(!datos.loboActivo)return;

    await chrome.runtime.sendMessage({
      tipo:"LOBO_CARGAR_MOTOR"
    });
  }catch(error){
    console.warn("CQ CONTROL: sin autorizacion",error);
    try {
      await chrome.storage.local.set({loboActivo:false});
    }catch(e){}
  }
})();