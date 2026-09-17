// Globales para Chart.js
let chartProdInstance = null;
let chartPersInstance = null;

// Base de datos de catálogo predeterminada
const CATALOGO_INICIAL = {
  "100206": "12Sidral + 6Fresca + 6Fanta BU 500 ML VR",
  "100308": "Mzc BU 500ml VR 12Sid,6VF,6Fresca-24pk",
  "101022": "MZC 18 VMFNGO+6 VF GUYB 350ML VR BU 24P",
  "101020": "MZC 12 SID+6 VFMNGO+6 DLW 12OZ VR BU24PK",
  "3201":   "MZC 18 CCO+6CCSA 12OZ VR 24PK",
  "3281":   "COCA COLA 1.75 ML 8 PK PET-Preciada",
  "99212":  "MONSTER LO CARB 473ML 4PK",
  "99365":  "ADES SOYA FRUTAL MANZANA 946 ml 3 G",
  "84100":  "AGUA CIEL 1.5 LT NR 12 PK",
  "356":    "COCA COLA 0.5 LT VIDRIO R 24 G"
};

// Carga inicial segura del catálogo
function obtenerCatalogo() {
  const guardado = localStorage.getItem('catalogoSKU');
  if (!guardado) {
    localStorage.setItem('catalogoSKU', JSON.stringify(CATALOGO_INICIAL));
    return CATALOGO_INICIAL;
  }
  return JSON.parse(guardado);
}

let CATALOGO = obtenerCatalogo();

document.addEventListener("DOMContentLoaded", () => {
  const hoy = new Date().toISOString().split('T')[0];
  if (document.getElementById('m-fecha')) document.getElementById('m-fecha').value = hoy;
  if (document.getElementById('mg-fecha')) document.getElementById('mg-fecha').value = hoy;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error:', err));
  }

  actualizarDatalist();
});

// Control de Pestañas
function cambiarTab(tabId) {
  const pestañas = ['tab-montacargas', 'tab-maniobras', 'tab-catalogo', 'tab-dashboard'];
  const botones = ['btn-montacargas', 'btn-maniobras', 'btn-catalogo', 'btn-dashboard'];

  pestañas.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  const tabActiva = document.getElementById(tabId);
  if (tabActiva) tabActiva.classList.remove('hidden');

  botones.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('text-red-700', 'border-red-700');
      btn.classList.add('text-gray-500', 'border-transparent');
    }
  });

  const activeBtn = document.getElementById('btn-' + tabId.replace('tab-', ''));
  if (activeBtn) {
    activeBtn.classList.remove('text-gray-500', 'border-transparent');
    activeBtn.classList.add('text-red-700', 'border-red-700');
  }

  if (tabId === 'tab-dashboard') actualizardashboard();
  if (tabId === 'tab-catalogo') renderizarTablaCatalogo();
}

// Autocompletado de Producto en Capturas
function autocompletarSKU(prefix) {
  const inputSku = document.getElementById(`${prefix}-producto`).value.trim();
  const inputDesc = document.getElementById(`${prefix}-presentacion`);
  
  CATALOGO = obtenerCatalogo();
  if (CATALOGO[inputSku]) {
    inputDesc.value = CATALOGO[inputSku];
  }
}

function actualizarDatalist() {
  const datalist = document.getElementById('lista-skus');
  if (!datalist) return;
  
  CATALOGO = obtenerCatalogo();
  datalist.innerHTML = '';
  Object.keys(CATALOGO).forEach(sku => {
    const opt = document.createElement('option');
    opt.value = sku;
    opt.label = CATALOGO[sku];
    datalist.appendChild(opt);
  });
}

// Guardar nuevo SKU en Catálogo (Fix para persistencia)
function guardarSKUCatalogo(event) {
  if (event) event.preventDefault(); // Evita recarga si está dentro de un form

  const skuInput = document.getElementById('cat-sku');
  const descInput = document.getElementById('cat-desc');

  const sku = skuInput.value.trim();
  const desc = descInput.value.trim();

  if (!sku || !desc) {
    alert("Por favor ingresa tanto el SKU como su descripción.");
    return;
  }

  // 1. Obtener datos frescos de localStorage
  CATALOGO = obtenerCatalogo();

  // 2. Insertar o reemplazar
  CATALOGO[sku] = desc;

  // 3. Guardar en localStorage
  localStorage.setItem('catalogoSKU', JSON.stringify(CATALOGO));

  // 4. Limpiar campos
  skuInput.value = '';
  descInput.value = '';

  // 5. Actualizar interfaz
  renderizarTablaCatalogo();
  actualizarDatalist();

  alert(`✅ SKU ${sku} guardado correctamente en el catálogo.`);
}

function borrarSKUCatalogo(sku) {
  if (confirm(`¿Deseas eliminar el SKU ${sku} del catálogo?`)) {
    CATALOGO = obtenerCatalogo();
    delete CATALOGO[sku];
    localStorage.setItem('catalogoSKU', JSON.stringify(CATALOGO));
    renderizarTablaCatalogo();
    actualizarDatalist();
  }
}

function editarSKUCatalogo(sku) {
  document.getElementById('cat-sku').value = sku;
  document.getElementById('cat-desc').value = CATALOGO[sku];
}

// Mostrar tabla SOLO en la vista de Catálogo
function renderizarTablaCatalogo() {
  const tbody = document.getElementById('tabla-catalogo-cuerpo');
  if (!tbody) return;

  CATALOGO = obtenerCatalogo();
  const filtroInput = document.getElementById('filtro-catalogo');
  const filtro = (filtroInput ? filtroInput.value : '').toLowerCase().trim();

  tbody.innerHTML = '';

  const skus = Object.keys(CATALOGO).filter(k => 
    k.toLowerCase().includes(filtro) || CATALOGO[k].toLowerCase().includes(filtro)
  );

  const spanTotal = document.getElementById('total-skus-cat');
  if (spanTotal) spanTotal.innerText = skus.length;

  skus.forEach(sku => {
    const tr = document.createElement('tr');
    tr.className = "border-b hover:bg-gray-50";
    tr.innerHTML = `
      <td class="p-2 border font-mono font-bold text-gray-800">${sku}</td>
      <td class="p-2 border text-gray-700">${CATALOGO[sku]}</td>
      <td class="p-2 border text-center">
        <button type="button" onclick="editarSKUCatalogo('${sku}')" class="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-1 hover:bg-blue-700 transition">Editar</button>
        <button type="button" onclick="borrarSKUCatalogo('${sku}')" class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition">Borrar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Guardar Registro de Incidencias (Montacargas / Maniobras)
function guardarRegistro(event, tipo) {
  event.preventDefault();
  const esMC = tipo === 'Montacargas';
  const pfx = esMC ? 'm-' : 'mg-';

  const cantidad = parseInt(document.getElementById(pfx + 'cantidad').value) || 0;
  const tipoUnidad = document.getElementById(pfx + 'tipo-unidad').value;

  const registro = {
    id: Date.now(),
    tipo: tipo,
    fecha: document.getElementById(pfx + 'fecha').value,
    turno: document.getElementById(pfx + 'turno').value,
    nombre: document.getElementById(pfx + 'nombre').value,
    clave: document.getElementById(pfx + 'clave').value,
    cajas: cantidad,
    unidad: tipoUnidad,
    producto: document.getElementById(pfx + 'producto').value,
    presentacion: document.getElementById(pfx + 'presentacion').value,
    causa: document.querySelector(`input[name="${pfx}causa"]:checked`)?.value || 'N/A',
    descripcion: document.getElementById(pfx + 'descripcion').value
  };

  const registros = JSON.parse(localStorage.getItem('merma_registros') || '[]');
  registros.push(registro);
  localStorage.setItem('merma_registros', JSON.stringify(registros));

  alert('¡Reporte guardado exitosamente!');
  event.target.reset();
  
  document.getElementById(pfx + 'fecha').value = new Date().toISOString().split('T')[0];
}

// Dashboard
function actualizardashboard() {
  const registros = JSON.parse(localStorage.getItem('merma_registros') || '[]');
  
  let totalCantidad = 0, incMC = 0, incMG = 0;
  const prodMap = {};
  const persMap = {};

  registros.forEach(r => {
    totalCantidad += r.cajas;
    if (r.tipo === 'Montacargas') incMC++;
    else incMG++;

    prodMap[r.producto] = (prodMap[r.producto] || 0) + r.cajas;
    const keyPers = `${r.nombre} (${r.clave})`;
    persMap[keyPers] = (persMap[keyPers] || 0) + r.cajas;
  });

  document.getElementById('stat-total-cajas').innerText = totalCantidad;
  document.getElementById('stat-incidencias-mc').innerText = incMC;
  document.getElementById('stat-incidencias-mg').innerText = incMG;

  const tbody = document.getElementById('tabla-registros');
  tbody.innerHTML = '';
  [...registros].reverse().forEach(r => {
    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50">
        <td class="p-2 border">${r.fecha}</td>
        <td class="p-2 border font-semibold">${r.tipo}</td>
        <td class="p-2 border">${r.nombre} <span class="text-xs text-gray-500">(${r.clave})</span></td>
        <td class="p-2 border">${r.producto}</td>
        <td class="p-2 border font-bold text-red-600">${r.cajas}</td>
        <td class="p-2 border text-xs font-semibold text-gray-600">${r.unidad || 'Caja'}</td>
        <td class="p-2 border">${r.causa}</td>
      </tr>
    `;
  });

  renderGraficas(prodMap, persMap);
}

function renderGraficas(prodMap, persMap) {
  const ctxProd = document.getElementById('chartProductos').getContext('2d');
  const ctxPers = document.getElementById('chartPersonal').getContext('2d');

  if (chartProdInstance) chartProdInstance.destroy();
  if (chartPersInstance) chartPersInstance.destroy();

  chartProdInstance = new Chart(ctxProd, {
    type: 'bar',
    data: {
      labels: Object.keys(prodMap),
      datasets: [{ label: 'Cantidad Mermada', data: Object.values(prodMap), backgroundColor: '#b91c1c' }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  chartPersInstance = new Chart(ctxPers, {
    type: 'bar',
    data: {
      labels: Object.keys(persMap),
      datasets: [{ label: 'Cantidad Mermada', data: Object.values(persMap), backgroundColor: '#1e40af' }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

function exportarCSV() {
  const registros = JSON.parse(localStorage.getItem('merma_registros') || '[]');
  if (!registros.length) return alert('No hay registros guardados para exportar.');

  let csv = 'Fecha,Tipo,Nombre,Clave,Turno,Producto,Presentación,Cantidad,Unidad,Causa,Descripción\n';
  registros.forEach(r => {
    csv += `"${r.fecha}","${r.tipo}","${r.nombre}","${r.clave}","${r.turno}","${r.producto}","${r.presentacion}","${r.cajas}","${r.unidad || 'Caja'}","${r.causa}","${r.descripcion}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `reporte_merma_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function limpiarDatos() {
  if (confirm('¿Estás seguro de que deseas eliminar TODOS los registros locales de este dispositivo?')) {
    localStorage.removeItem('merma_registros');
    actualizardashboard();
  }
}
