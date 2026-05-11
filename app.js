// ─── STATE ────────────────────────────────────────────────────
let currentUser = null;
let allUsers    = [];
let deleteTarget = null;
let editMode    = false;

// ─── DOM SHORTCUTS ────────────────────────────────────────────
const $ = id => document.getElementById(id);
const showScreen = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
};

// ─── SESSION ─────────────────────────────────────────────────
const saveSession = user => {
  localStorage.setItem('petcare_user', JSON.stringify(user));
  currentUser = user;
};
const loadSession = () => {
  const raw = localStorage.getItem('petcare_user');
  if (raw) { currentUser = JSON.parse(raw); return true; }
  return false;
};
const clearSession = () => {
  localStorage.removeItem('petcare_user');
  currentUser = null;
};

// ─── ALERTS ──────────────────────────────────────────────────
const showAlert = (el, msg, type = 'error') => {
  el.textContent = msg;
  el.className = `alert alert-${type}`;
};
const hideAlert = el => { el.className = 'alert hidden'; el.textContent = ''; };

// ─── LOGIN ────────────────────────────────────────────────────
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email    = $('login-email').value.trim();
  const password = $('login-password').value;
  const errEl    = $('login-error');
  hideAlert(errEl);

  if (!email || !password) { showAlert(errEl, 'Por favor completa todos los campos.'); return; }

  $('login-btn').disabled = true;
  try {
    const res = await api.login(email, password);
    saveSession(res.usuario);
    initDashboard();
    showScreen('dashboard-screen');
  } catch (err) {
    showAlert(errEl, err.message);
  } finally {
    $('login-btn').disabled = false;
  }
});

// ─── REGISTER ────────────────────────────────────────────────
$('go-register').addEventListener('click', e => { e.preventDefault(); showScreen('register-screen'); });
$('go-login').addEventListener('click',    e => { e.preventDefault(); showScreen('login-screen'); });

$('register-form').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl  = $('register-error');
  const sucEl  = $('register-success');
  hideAlert(errEl); hideAlert(sucEl);

  const payload = {
    nombre:   $('reg-nombre').value.trim(),
    apellido: $('reg-apellido').value.trim(),
    email:    $('reg-email').value.trim(),
    password: $('reg-password').value,
    telefono: $('reg-telefono').value.trim(),
    rol:      $('reg-rol').value,
  };

  if (!payload.nombre || !payload.apellido || !payload.email || !payload.password) {
    showAlert(errEl, 'Completa todos los campos obligatorios.'); return;
  }

  try {
    await api.create(payload);
    showAlert(sucEl, '¡Cuenta creada! Redirigiendo al login…', 'success');
    setTimeout(() => showScreen('login-screen'), 1800);
  } catch (err) {
    showAlert(errEl, err.message);
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────
$('logout-btn').addEventListener('click', () => {
  clearSession();
  showScreen('login-screen');
});

// ─── DASHBOARD ───────────────────────────────────────────────
function initDashboard() {
  const u = currentUser;
  $('sidebar-user-info').innerHTML = `
    <strong>${u.nombre} ${u.apellido}</strong>
    ${u.email}<br/>
    <span style="color:var(--accent);font-size:0.75rem">${u.rol}</span>
  `;
  loadUsers();
}

// ─── LOAD USERS ──────────────────────────────────────────────
async function loadUsers() {
  try {
    allUsers = await api.getAll();
    renderStats();
    renderTable(allUsers);
  } catch (err) {
    $('user-tbody').innerHTML = `<tr><td colspan="7" class="loading-row" style="color:var(--danger)">Error al cargar usuarios: ${err.message}</td></tr>`;
  }
}

function renderStats() {
  $('stat-total').textContent      = allUsers.length;
  $('stat-duenos').textContent     = allUsers.filter(u => u.rol === 'dueño').length;
  $('stat-cuidadores').textContent = allUsers.filter(u => u.rol === 'cuidador').length;
  $('stat-activos').textContent    = allUsers.filter(u => u.activo === 1).length;
}

function rolBadge(rol) {
  const map = { 'dueño': 'badge-dueno', 'cuidador': 'badge-cuidador', 'administrador': 'badge-admin' };
  return `<span class="badge ${map[rol] || ''}">${rol}</span>`;
}
function estadoBadge(activo) {
  return activo
    ? `<span class="badge badge-activo">Activo</span>`
    : `<span class="badge badge-inactivo">Inactivo</span>`;
}

function renderTable(users) {
  if (!users.length) {
    $('user-tbody').innerHTML = `<tr><td colspan="7" class="loading-row">No hay usuarios registrados.</td></tr>`;
    return;
  }
  $('user-tbody').innerHTML = users.map(u => `
    <tr>
      <td>#${u.id}</td>
      <td>${u.nombre} ${u.apellido}</td>
      <td>${u.email}</td>
      <td>${u.telefono || '–'}</td>
      <td>${rolBadge(u.rol)}</td>
      <td>${estadoBadge(u.activo)}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="openEdit(${u.id})" title="Editar">✏️</button>
          <button class="btn-icon danger" onclick="openDelete(${u.id}, '${u.nombre} ${u.apellido}')" title="Eliminar">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── SEARCH ──────────────────────────────────────────────────
$('search-input').addEventListener('input', function() {
  const q = this.value.toLowerCase();
  const filtered = allUsers.filter(u =>
    `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.rol.toLowerCase().includes(q)
  );
  renderTable(filtered);
});

// ─── MODAL HELPERS ───────────────────────────────────────────
const modalOverlay = $('modal-overlay');
const closeModal   = () => { modalOverlay.classList.add('hidden'); };

$('modal-close').addEventListener('click',  closeModal);
$('modal-cancel').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

function openCreate() {
  editMode = false;
  $('modal-title').textContent    = 'Nuevo usuario';
  $('form-id').value              = '';
  $('user-form').reset();
  $('password-hint').textContent  = '(mínimo 6 caracteres)';
  $('field-activo').style.display = 'none';
  hideAlert($('form-error'));
  hideAlert($('form-success'));
  modalOverlay.classList.remove('hidden');
  $('form-nombre').focus();
}

function openEdit(id) {
  const u = allUsers.find(x => x.id === id);
  if (!u) return;
  editMode = true;

  $('modal-title').textContent    = 'Editar usuario';
  $('form-id').value              = u.id;
  $('form-nombre').value          = u.nombre;
  $('form-apellido').value        = u.apellido;
  $('form-email').value           = u.email;
  $('form-password').value        = '';
  $('form-telefono').value        = u.telefono || '';
  $('form-rol').value             = u.rol;
  $('form-activo').value          = u.activo;
  $('password-hint').textContent  = '(dejar vacío para no cambiar)';
  $('field-activo').style.display = '';
  hideAlert($('form-error'));
  hideAlert($('form-success'));
  modalOverlay.classList.remove('hidden');
  $('form-nombre').focus();
}

$('btn-nuevo-usuario').addEventListener('click', openCreate);

// ─── SUBMIT FORM ─────────────────────────────────────────────
$('user-form').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = $('form-error');
  const sucEl = $('form-success');
  hideAlert(errEl); hideAlert(sucEl);

  const payload = {
    nombre:   $('form-nombre').value.trim(),
    apellido: $('form-apellido').value.trim(),
    email:    $('form-email').value.trim(),
    telefono: $('form-telefono').value.trim(),
    rol:      $('form-rol').value,
  };

  if ($('form-password').value) payload.password = $('form-password').value;
  if (editMode) payload.activo = parseInt($('form-activo').value);

  if (!payload.nombre || !payload.apellido || !payload.email) {
    showAlert(errEl, 'Nombre, apellido y email son obligatorios.'); return;
  }
  if (!editMode && !payload.password) {
    showAlert(errEl, 'La contraseña es obligatoria al crear un usuario.'); return;
  }

  $('form-submit').disabled = true;
  try {
    if (editMode) {
      await api.update($('form-id').value, payload);
      showAlert(sucEl, 'Usuario actualizado correctamente.', 'success');
    } else {
      await api.create(payload);
      showAlert(sucEl, 'Usuario creado correctamente.', 'success');
    }
    await loadUsers();
    setTimeout(closeModal, 1200);
  } catch (err) {
    showAlert(errEl, err.message);
  } finally {
    $('form-submit').disabled = false;
  }
});

// ─── DELETE ──────────────────────────────────────────────────
const confirmOverlay = $('confirm-overlay');

function openDelete(id, name) {
  deleteTarget = id;
  $('confirm-text').textContent = `¿Estás seguro de eliminar a "${name}"? Esta acción no se puede deshacer.`;
  confirmOverlay.classList.remove('hidden');
}

$('confirm-cancel').addEventListener('click', () => { confirmOverlay.classList.add('hidden'); deleteTarget = null; });
confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) { confirmOverlay.classList.add('hidden'); deleteTarget = null; } });

$('confirm-delete').addEventListener('click', async () => {
  if (!deleteTarget) return;
  try {
    await api.delete(deleteTarget);
    confirmOverlay.classList.add('hidden');
    deleteTarget = null;
    await loadUsers();
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
});

// ─── INIT ─────────────────────────────────────────────────────
(function init() {
  if (loadSession()) {
    initDashboard();
    showScreen('dashboard-screen');
  } else {
    showScreen('login-screen');
  }
})();
