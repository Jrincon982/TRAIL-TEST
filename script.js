
const TOTAL_NUMEROS = 8;
const TOTAL_PARES = 4; 
const RADIO = 18;
const MARGEN = 40;
const DISTANCIA_MIN = 60;
const textoPolitica = document.getElementById("textoPolitica");
const btnAceptar = document.getElementById("btnAceptar");
const modal = document.getElementById("modalPolitica");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const timeLabel = document.getElementById("time");
const btnInfo = document.getElementById("btnInfo");
const panelInstrucciones = document.getElementById("panelInstrucciones");
const textoInstrucciones = document.getElementById("textoInstrucciones");


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



// Tamaño del canvas
function ajustarCanvas() {
  const ancho = Math.min(window.innerWidth - 20, 900);
  const alto = Math.min(window.innerHeight - 220, 500);

  canvas.width = ancho;
  canvas.height = alto;
}

ajustarCanvas();
window.addEventListener("resize", ajustarCanvas);


// Configuración del trazo
ctx.lineWidth = 3;
ctx.lineCap = "round";
ctx.strokeStyle = "blue";

// ===============================
// ARREGLO DE FECHA
// ===============================
function obtenerFechaFormateada() {
  const f = new Date();

  const dia = String(f.getDate()).padStart(2, "0");
  const mes = String(f.getMonth() + 1).padStart(2, "0");
  const anio = f.getFullYear();

  const horas = String(f.getHours()).padStart(2, "0");
  const minutos = String(f.getMinutes()).padStart(2, "0");
  const segundos = String(f.getSeconds()).padStart(2, "0");

  return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
}


// ===============================
// NÚMEROS DEL TEST (1 A 8)/(1A a 4D)
// ===============================
function generarPuntos() {
  puntos = [];

  let secuencia = [];

  if (modoTest === "A") {
    for (let i = 1; i <= 8; i++) {
      secuencia.push(i.toString());
    }
  } else {
    for (let i = 1; i <= TOTAL_PARES; i++) {
      secuencia.push(i.toString());
      secuencia.push(String.fromCharCode(64 + i)); // A, B, C...
    }
  }

  secuencia.forEach(valor => {
    let valido = false;
    let x, y;

    while (!valido) {
      x = Math.random() * (canvas.width - 2 * MARGEN) + MARGEN;
      y = Math.random() * (canvas.height - 2 * MARGEN) + MARGEN;

      valido = true;
      for (let p of puntos) {
        if (Math.hypot(x - p.x, y - p.y) < DISTANCIA_MIN) {
          valido = false;
          break;
        }
      }
    }

    puntos.push({ valor, x, y });
  });
}

// ===============================
// INICIO
// ===============================
function iniciarTest() {
  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const edad = document.getElementById("edad").value;

  if (!nombre || !apellido || !edad) {
    alert("Complete todos los campos");
    return;
  }

  participante = { nombre, apellido, edad };

  modal.style.display = "block";
}


// ===============================
// CRONÓMETRO
// ===============================
let inicioTiempo = null;
let cronometroActivo = false;

function actualizarTiempo() {
  if (!cronometroActivo) return;
  const t = (performance.now() - inicioTiempo) / 1000;
  timeLabel.textContent = t.toFixed(2);
  requestAnimationFrame(actualizarTiempo);
}

// ===============================
// DIBUJAR NÚMEROS
// ===============================
function dibujarNumeros() {
  ctx.font = "18px Arial";
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";

  puntos.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(p.valor, p.x - 6, p.y + 6);
  });

  ctx.strokeStyle = "blue";
}

// ===============================
// LIMPIAR CANVAS
// ===============================
function resetCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  indiceActual = 0;
  puntoActivo = null;
  generarPuntos();
  dibujarNumeros();
}

// ===============================
// GUARDAR RESULTADO
// ===============================
function guardarResultadoFinal() {

  const resultado = {
    nombre: participante.nombre,
    apellido: participante.apellido,
    edad: participante.edad,
    tiempoA: tiempoA,
    tiempoB: tiempoB,
    fecha: obtenerFechaFormateada()
  };

  fetch("https://script.google.com/macros/s/AKfycbySAk8uROw8S6j0j82-YJxNuURFOnZzKUndsMRzb1AaQKH7eG05_VlVFgpcN69b0TINaA/exec", {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(resultado)
  })
  .then(() => {
    alert("Resultados guardados correctamente en Google Sheets");
  })
  .catch(err => {
    console.error("Error al guardar:", err);
    alert("Error al guardar datos");
  });
}


// ===============================
// VALIDAR TOQUE DE NÚMERO
// ===============================
function validarNumero(x, y) {
  const p = puntos[indiceActual];
  const d = Math.hypot(x - p.x, y - p.y);

  // Evitar múltiples activaciones del mismo punto
  if (puntoActivo === indiceActual) return;

  if (d < RADIO) {

    puntoActivo = indiceActual;

    // Iniciar cronómetro
    if (indiceActual === 0 && !cronometroActivo) {
      inicioTiempo = performance.now();
      cronometroActivo = true;
      actualizarTiempo();
    }

    indiceActual++;

    // Prueba finalizada
    if (indiceActual === puntos.length) {
  cronometroActivo = false;

  const tiempoFinal = parseFloat(timeLabel.textContent);

  if (modoTest === "A") {
    // Guardar tiempo A
    tiempoA = tiempoFinal;
    capturarResultado("A");

    // Preparar Test B
    modoTest = "B";
    document.getElementById("tituloTest").textContent = "Trail Making Test B";
    actualizarInstrucciones();
    alert("Test A finalizado.\nInicia el Test B");

    resetCanvas(); // genera letras y números
    return;
  }

  if (modoTest === "B") {
    // Guardar tiempo B
    tiempoB = tiempoFinal;

    capturarResultado("B");
    alert(
      "Trail Test completado\n" +
      `Tiempo A: ${tiempoA} s\n` +
      `Tiempo B: ${tiempoB} s`
    );
    document.getElementById("btnExportar").style.display = "inline";
  }
}

  }
}


// ===============================
// OBTENER POSICIÓN
// ===============================
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: e.offsetX,
      y: e.offsetY
    };
  }
}

// ===============================
// INSTRUCCIONES
// ===============================

function actualizarInstrucciones() {
  if (modoTest === "A") {
    textoInstrucciones.innerHTML = 
    `<strong>Parte A</strong><br><br>
    Conecte los números en orden ascendente:<br>
    1 → 2 → 3 → 4 ...<br><br>
    lo más rápido posible sin soltar el click.`;
  } else {
    textoInstrucciones.innerHTML = 
    `<strong>Parte B</strong><br><br>
    Conecte alternando número y letra:<br>
    1 → A → 2 → B → 3 → C ...<br><br>
    Mantenga el orden correcto y trabaje lo más rápido posible.`;
  }
}

function cerrarInstrucciones() {
  panelInstrucciones.style.display = "none";
}

// ===============================
// TÁCTIL
// ===============================

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  dibujando = true;
  const p = getPos(e);
  ultimoX = p.x;
  ultimoY = p.y;
  validarNumero(p.x, p.y);
});

canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  if (!dibujando) return;

  const p = getPos(e);
  ctx.beginPath();
  ctx.moveTo(ultimoX, ultimoY);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  ultimoX = p.x;
  ultimoY = p.y;

  validarNumero(p.x, p.y);
});

// ===============================
// CAPTURAR RESULTADO - DESCARGA DE IMAGEN
// ===============================

function capturarResultado(tipoTest) {

    const canvasTemp = document.createElement("canvas");
    canvasTemp.width = canvas.width;
    canvasTemp.height = canvas.height;

    const ctxTemp = canvasTemp.getContext("2d");

    // Fondo blanco
    ctxTemp.fillStyle = "#ffffff";
    ctxTemp.fillRect(0, 0, canvasTemp.width, canvasTemp.height);

    // Copiar dibujo original
    ctxTemp.drawImage(canvas, 0, 0);

    const imagenBase64 = canvasTemp.toDataURL("image/png");

    const payload = {
        tipo: "imagen",
        test: tipoTest, // "A" o "B"
        nombre: participante.nombre,
        apellido: participante.apellido,
        edad: participante.edad,
        fecha: obtenerFechaFormateada(),
        imagen: imagenBase64
    };

    fetch("https://script.google.com/macros/s/AKfycbySAk8uROw8S6j0j82-YJxNuURFOnZzKUndsMRzb1AaQKH7eG05_VlVFgpcN69b0TINaA/exec", {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(() => {
        console.log(`Imagen Test ${tipoTest} enviada a Drive`);
    })
    .catch(err => {
        console.error("Error enviando imagen:", err);
    });
}

// ===============================
// EVENTOS
// ===============================
canvas.addEventListener("mousedown", e => {
  dibujando = true;
  const p = getPos(e);
  ultimoX = p.x;
  ultimoY = p.y;
  validarNumero(p.x, p.y);
});

canvas.addEventListener("mousemove", e => {
  if (!dibujando) return;

  const p = getPos(e);
  ctx.beginPath();
  ctx.moveTo(ultimoX, ultimoY);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  ultimoX = p.x;
  ultimoY = p.y;

  validarNumero(p.x, p.y);
});

canvas.addEventListener("mouseup", () => dibujando = false);
canvas.addEventListener("mouseleave", () => dibujando = false);

btnAceptar.addEventListener("click", () => {
  modal.style.display = "none";

  document.getElementById("registro").style.display = "none";
  document.getElementById("test").style.display = "block";

  modoTest = "A";
  document.getElementById("tituloTest").textContent = "Trail Making Test A";

  actualizarInstrucciones();
  resetCanvas();
});



textoPolitica.addEventListener("scroll", () => {
  const alFinal =
    textoPolitica.scrollTop + textoPolitica.clientHeight >=
    textoPolitica.scrollHeight - 5;

  if (alFinal) {
    btnAceptar.disabled = false;
  }
});

function cancelarRegistro() {
  modal.style.display = "none";
}

btnInfo.addEventListener("click", () => {
  panelInstrucciones.style.display = "block";
});

canvas.addEventListener("touchend", () => dibujando = false);

// ===============================
// INICIO
// ===============================
resetCanvas(); 
