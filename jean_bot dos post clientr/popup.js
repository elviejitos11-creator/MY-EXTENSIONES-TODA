const estado = document.getElementById("status");
const conectar = document.getElementById("conectar");
const desconectar = document.getElementById("desconectar");

function actualizar(activo) {
  estado.textContent = activo ? "CONECTADO" : "DESCONECTADO";
  estado.style.color = activo ? "#4ade80" : "#fb7185";
  conectar.disabled = activo;
  desconectar.disabled = !activo;
}

chrome.storage.local.get({ loboActivo: false }, (datos) => {
  actualizar(datos.loboActivo);
});

conectar.addEventListener("click", () => {
  chrome.storage.local.set({ loboActivo: true }, () => {
    actualizar(true);
  });
});

desconectar.addEventListener("click", () => {
  chrome.storage.local.set({ loboActivo: false }, () => {
    actualizar(false);
  });
});