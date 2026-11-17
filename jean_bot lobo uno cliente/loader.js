(async()=>{
 try{
  const {loboActivo}=await chrome.storage.local.get({loboActivo:false});
  if(!loboActivo)return;

  const r=await chrome.runtime.sendMessage({tipo:"CQ_VERIFICAR_LOBO_1"});

  if(!r?.autorizada){
   console.warn("CQ CONTROL: licencia no autorizada",r?.motivo);
   return;
  }

  chrome.runtime.sendMessage({tipo:"LOBO_CARGAR_MOTOR"});
 }catch(e){
  console.error("CQ CONTROL",e);
 }
})();