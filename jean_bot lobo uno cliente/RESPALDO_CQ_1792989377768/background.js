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