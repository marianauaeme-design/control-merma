// Catálogo inicial con la base de datos recopilada
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

let CATALOGO = JSON.parse(localStorage.getItem('catalogoSKU')) || CATALOGO_INICIAL;
if (!localStorage.getItem('catalogoSKU')) {
  localStorage.setItem('catalogoSKU', JSON.stringify(CATALOGO));
}

// Autocompletado al ingresar el SKU en los formularios
function autocompletarSKU(prefix) {
  const inputSku = document.getElementById(`${prefix}-producto`).value.trim();
  const inputDesc = document.getElementById(`${prefix}-presentacion`);
  if (CATALOGO[inputSku]) {
    inputDesc.value = CATALOGO[inputSku];
  }
}

// Carga de opciones en el selector de autocompletado
function actualizarDatalist() {
  const datalist = document.getElementById('lista-skus');
  if (!datalist) return;
  datalist.innerHTML = '';
  Object.keys(CATALOGO).forEach(sku => {
    const opt = document.createElement('option');
    opt.value = sku;
    opt.label = CATALOGO[sku];
    datalist.appendChild(opt);
  });
}

// Gestión del Catálogo (Agregar/Modificar/Eliminar)
function guardarSKUCatalogo() {
  const sku = document.getElementById('cat-sku').value.trim();
  const desc = document.getElementById('cat-desc').value.trim();
  if (!sku || !desc) return alert("Ingresa el SKU y su descripción");

  CATALOGO[sku] = desc;
  localStorage.setItem('catalogoSKU', JSON.stringify(CATALOGO));
  document.getElementById('cat-sku').value = '';
  document.getElementById('cat-desc').value = '';
  renderizarTablaCatalogo();
  actualizarDatalist();
}

function borrarSKUCatalogo(sku) {
  if (confirm(`¿Eliminar SKU ${sku}?`)) {
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

function renderizarTablaCatalogo() {
  const tbody = document.getElementById('tabla-catalogo-cuerpo');
  if (!tbody) return;
  const filtro = (document.getElementById('filtro-catalogo')?.value || '').toLowerCase();
  tbody.innerHTML = '';
  
  const skus = Object.keys(CATALOGO).filter(k => 
    k.toLowerCase().includes(filtro) || CATALOGO[k].toLowerCase().includes(filtro)
  );

  document.getElementById('total-skus-cat').innerText = skus.length;

  skus.forEach(sku => {
    const tr = document.createElement('tr');
    tr.className = "border-b hover:bg-gray-50";
    tr.innerHTML = `
      <td class="p-2 border font-mono font-bold">${sku}</td>
      <td class="p-2 border">${CATALOGO[sku]}</td>
      <td class="p-2 border text-center">
        <button onclick="editarSKUCatalogo('${sku}')" class="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-1">Editar</button>
        <button onclick="borrarSKUCatalogo('${sku}')" class="bg-red-600 text-white px-2 py-1 rounded text-xs">Borrar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Ejecutar al iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  actualizarDatalist();
  renderizarTablaCatalogo();
});
