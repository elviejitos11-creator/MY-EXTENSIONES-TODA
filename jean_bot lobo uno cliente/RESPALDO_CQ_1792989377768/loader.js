(async () => {
  try {
    const datos = await chrome.storage.local.get({
      loboActivo: false
    });

    if (!datos.loboActivo) {
      console.log("LOBO PRO: desconectado");
      return;
    }

    chrome.runtime.sendMessage({
      tipo: "LOBO_CARGAR_MOTOR"
    });
  } catch (error) {
    console.error("LOBO PRO:", error);
  }
})();