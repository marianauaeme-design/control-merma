let chartProdInstance = null;
let chartPersInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  const hoy = new Date().toISOString().split('T')[0];
  if (document.getElementById('m-fecha')) document.getElementById('m-fecha').value = hoy;
  if (document.getElementById('mg-fecha')) document.getElementById('mg-fecha').value = hoy;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error:', err));
  }
});

function cambiarTab(tabId) {
  ['tab-montacargas', 'tab-maniobras', 'tab-dashboard'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(tabId).classList.remove('hidden');

  ['btn-montacargas', 'btn-maniobras', 'btn-dashboard'].forEach(btnId => {
    const btn = document.getElementById(btnId);
    btn.classList.remove('text-red-700', 'border-red-700');
    btn.classList.add('text-gray-500', 'border-transparent');
  });

  const activeBtn = document.getElementById('btn-' + tabId.replace('tab-', ''));
  activeBtn.classList.remove('text-gray-500', 'border-transparent');
  activeBtn.classList.add('text-red-700', 'border-red-700');

  if (tabId === 'tab-dashboard') actualizardashboard();
}

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
