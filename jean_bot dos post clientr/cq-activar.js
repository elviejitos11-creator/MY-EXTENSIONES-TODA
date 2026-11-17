const estado=document.getElementById("estado");

chrome.storage.local.get(["cqCliente"],v=>{
 if(v.cqCliente)estado.textContent="Cliente actual: "+v.cqCliente;
});

document.getElementById("activar").addEventListener("click",async()=>{
 estado.textContent="Consultando CQ CONTROL...";
 try{
  const clave=document.getElementById("clave").value.trim();
  const r=await chrome.runtime.sendMessage({tipo:"CQ_ACTIVAR_LOBO_2",clave});
  estado.textContent=r?.autorizada
   ?"ACTIVADA PARA: "+r.cliente+"\nVence: "+r.vence_en
   :"NO AUTORIZADA: "+(r?.motivo||"error");
 }catch(e){
  estado.textContent="Error: "+e.message;
 }
});