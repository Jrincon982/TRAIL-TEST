// ===============================
// CONSTANTES
// ===============================
const TOTAL_NUMEROS = 8;
const TOTAL_PARES = 4;
const RADIO = 18;
const MARGEN = 40;
const DISTANCIA_MIN = 60;

// URL DEL APPS SCRIPT (UNA SOLA VEZ)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbySAk8uROw8S6j0j82-YJxNuURFOnZzKUndsMRzb1AaQKH7eG05_VlVFgpcN69b0TINaA/exec";

// ===============================
// ELEMENTOS DOM
// ===============================
const textoPolitica = document.getElementById("textoPolitica");
const btnAceptar = document.getElementById("btnAceptar");
const modal = document.getElementById("modalPolitica");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const timeLabel = document.getElementById("time");
const btnInfo = document.getElementById("btnInfo");
const panelInstrucciones = document.getElementById("panelInstrucciones");
const textoInstrucciones = document.getElementById("textoInstrucciones");

// ===============================
// VARIABLES DE ESTADO
// ===============================
let dibujando = false;
let ultimoX = 0;
let ultimoY = 0;
let indiceActual = 0;
let puntos = [];
let modoTest = "A";
let participante = null;
let puntoActivo = null;
let tiempoA = null;
let tiempoB = null;

// ===============================
// CANVAS RESPONSIVE
// ===============================
function ajustarCanvas() {
  const ancho = Math.min(window.innerWidth - 20, 900);
  const alto = Math.min(window.innerHeight - 220, 500);
  canvas.width = ancho;
  canvas.height = alto;
}
ajustarCanvas();
window.addEventListener("resize", ajustarCanvas);

// ===============================
// CONFIG TRAZO
// ===============================
ctx.lineWidth = 3;
ctx.lineCap = "round";
ctx.strokeStyle = "blue";

// ===============================
// FECHA
// ===============================
function obtenerFechaFormateada() {
  const f = new Date();
  return `${f.getDate().toString().padStart(2,"0")}/${
    (f.getMonth()+1).toString().padStart(2,"0")
  }/${f.getFullYear()} ${f.getHours().toString().padStart(2,"0")}:${
    f.getMinutes().toString().padStart(2,"0")
  }:${f.getSeconds().toString().padStart(2,"0")}`;
}

// ===============================
// GENERAR PUNTOS
// ===============================
function generarPuntos() {
  puntos = [];
  let secuencia = [];

  if (modoTest === "A") {
    for (let i = 1; i <= TOTAL_NUMEROS; i++) secuencia.push(i.toString());
  } else {
    for (let i = 1; i <= TOTAL_PARES; i++) {
      secuencia.push(i.toString());
      secuencia.push(String.fromCharCode(64 + i));
    }
  }

  secuencia.forEach(valor => {
    let valido = false, x, y;
    while (!valido) {
      x = Math.random() * (canvas.width - 2 * MARGEN) + MARGEN;
      y = Math.random() * (canvas.height - 2 * MARGEN) + MARGEN;
      valido = puntos.every(p => Math.hypot(x - p.x, y - p.y) >= DISTANCIA_MIN);
    }
    puntos.push({ valor, x, y });
  });
}

// ===============================
// DIBUJO
// ===============================
function dibujarNumeros() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font = "18px Arial";
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";

  puntos.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, RADIO, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(p.valor, p.x - 6, p.y + 6);
  });

  ctx.strokeStyle = "blue";
}

function resetCanvas() {
  indiceActual = 0;
  puntoActivo = null;
  generarPuntos();
  dibujarNumeros();
}

// ===============================
// POSICIÓN REAL (FIX TÁCTIL)
// ===============================
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if (e.touches) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    };
  } else {
    return {
      x: e.offsetX * scaleX,
      y: e.offsetY * scaleY
    };
  }
}

// ===============================
// CRONÓMETRO
// ===============================
let inicioTiempo = null;
let cronometroActivo = false;

function actualizarTiempo() {
  if (!cronometroActivo) return;
  timeLabel.textContent = ((performance.now() - inicioTiempo)/1000).toFixed(2);
  requestAnimationFrame(actualizarTiempo);
}

// ===============================
// VALIDACIÓN
// ===============================
function validarNumero(x, y) {
  if (!cronometroActivo && indiceActual !== 0) return;

  const p = puntos[indiceActual];
  if (!p) return;

  if (Math.hypot(x - p.x, y - p.y) < RADIO && puntoActivo !== indiceActual) {
    puntoActivo = indiceActual;

    if (indiceActual === 0) {
      inicioTiempo = performance.now();
      cronometroActivo = true;
      actualizarTiempo();
    }

    indiceActual++;

    if (indiceActual === puntos.length) {
      cronometroActivo = false;
      const tiempoFinal = parseFloat(timeLabel.textContent);

      if (modoTest === "A") {
        tiempoA = tiempoFinal;
        capturarResultado("A");
        modoTest = "B";
        actualizarInstrucciones();
        alert("Test A finalizado. Inicia el Test B");
        resetCanvas();
      } else {
        tiempoB = tiempoFinal;
        capturarResultado("B");
        guardarResultadoFinal();
        alert(`Prueba finalizada\nA: ${tiempoA}s\nB: ${tiempoB}s`);
      }
    }
  }
}

// ===============================
// GUARDAR DATOS
// ===============================
function guardarResultadoFinal() {
  fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: participante.nombre,
      apellido: participante.apellido,
      edad: participante.edad,
      tiempoA,
      tiempoB,
      fecha: obtenerFechaFormateada()
    })
  });
}

// ===============================
// CAPTURA IMAGEN
// ===============================
function capturarResultado(test) {
  const temp = document.createElement("canvas");
  temp.width = canvas.width;
  temp.height = canvas.height;
  const tctx = temp.getContext("2d");

  tctx.fillStyle = "#fff";
  tctx.fillRect(0,0,temp.width,temp.height);
  tctx.drawImage(canvas,0,0);

  fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "imagen",
      test,
      nombre: participante.nombre,
      apellido: participante.apellido,
      edad: participante.edad,
      fecha: obtenerFechaFormateada(),
      imagen: temp.toDataURL("image/png")
    })
  });
}

// ===============================
// INSTRUCCIONES
// ===============================
function actualizarInstrucciones() {
  textoInstrucciones.innerHTML =
    modoTest === "A"
      ? "<b>Parte A</b><br>Conecte números en orden ascendente."
      : "<b>Parte B</b><br>Alterne número y letra.";
}

// ===============================
// EVENTOS CANVAS
// ===============================
canvas.addEventListener("mousedown", e => {
  dibujando = true;
  const p = getPos(e);
  ultimoX = p.x; ultimoY = p.y;
  validarNumero(p.x,p.y);
});

canvas.addEventListener("mousemove", e => {
  if (!dibujando) return;
  const p = getPos(e);
  ctx.beginPath();
  ctx.moveTo(ultimoX,ultimoY);
  ctx.lineTo(p.x,p.y);
  ctx.stroke();
  ultimoX=p.x; ultimoY=p.y;
  validarNumero(p.x,p.y);
});

canvas.addEventListener("mouseup", ()=>dibujando=false);
canvas.addEventListener("mouseleave", ()=>dibujando=false);

canvas.addEventListener("touchstart", e=>{
  e.preventDefault();
  dibujando=true;
  const p=getPos(e);
  ultimoX=p.x; ultimoY=p.y;
  validarNumero(p.x,p.y);
});

canvas.addEventListener("touchmove", e=>{
  e.preventDefault();
  if(!dibujando) return;
  const p=getPos(e);
  ctx.beginPath();
  ctx.moveTo(ultimoX,ultimoY);
  ctx.lineTo(p.x,p.y);
  ctx.stroke();
  ultimoX=p.x; ultimoY=p.y;
  validarNumero(p.x,p.y);
});

canvas.addEventListener("touchend", ()=>dibujando=false);

// ===============================
// INICIO
// ===============================
resetCanvas();
