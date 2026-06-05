import { api } from './api.js';

let currentUser = null;
let usuarios = [];
let currentView = 'dashboard';

const app = document.getElementById('app');

function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `<span>${type === 'success' ? '✅' : '❌'} ${message}</span>`;
    
    const existingMessage = document.querySelector('.message');
    if (existingMessage) existingMessage.remove();
    
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
}

function saveSession(user) {
    currentUser = user;
    localStorage.setItem('petcare_user', JSON.stringify(user));
}

function clearSession() {
    currentUser = null;
    localStorage.removeItem('petcare_user');
}

function loadSession() {
    const savedUser = localStorage.getItem('petcare_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        return true;
    }
    return false;
}

async function loadUsuarios() {
    try {
        usuarios = await api.getUsuarios();
        return usuarios;
    } catch (error) {
        console.error('Error loading usuarios:', error);
        return [];
    }
}

function renderNavBar() {
    if (!currentUser) return '';
    
    let navLinks = '';
    
    if (currentUser.rol === 'cuidador') {
        navLinks = `
            <button class="nav-btn" data-view="mis-productos">📦 Mis Productos</button>
            <button class="nav-btn" data-view="mis-solicitudes">📬 Solicitudes</button>
            <button class="nav-btn" data-view="dashboard">📊 Dashboard</button>
        `;
    } else if (currentUser.rol === 'administrador') {
        navLinks = `
            <button class="nav-btn" data-view="validar-productos">✅ Validar Productos</button>
            <button class="nav-btn" data-view="todos-productos">📋 Todos los Productos</button>
            <button class="nav-btn" data-view="dashboard">📊 Dashboard</button>
            <button class="nav-btn" data-view="usuarios">👥 Usuarios</button>
        `;
    } else {
        // Dueño
        navLinks = `
            <button class="nav-btn" data-view="productos-aprobados">🔍 Buscar Servicios</button>
            <button class="nav-btn" data-view="dashboard">📊 Dashboard</button>
        `;
    }
    
    return `
        <div class="nav-bar">
            <div class="nav-brand">🐾 PetCare Connect</div>
            <div class="nav-links">
                ${navLinks}
                <button class="nav-btn btn-logout" id="logoutBtn">🚪 Salir</button>
            </div>
        </div>
    `;
}

function renderLogin() {
    app.innerHTML = `
        <div class="container">
            <div class="auth-container">
                <div class="auth-card">
                    <div class="logo">
                        <h1>🐾 PetCare Connect</h1>
                        <p>Conectando dueños con cuidadores confiables</p>
                    </div>
                    <h2>Iniciar Sesión</h2>
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" placeholder="admin@petcare.com" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Contraseña</label>
                            <input type="password" id="password" name="password" placeholder="••••••" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Ingresar</button>
                    </form>
                    <p class="auth-link">¿No tienes cuenta? <a href="#" id="showRegisterLink">Regístrate aquí</a></p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const user = await api.login(email, password);
            saveSession(user);
            showMessage(`¡Bienvenido ${user.nombre}!`, 'success');
            await loadUsuarios();
            renderDashboard();
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });
    
    document.getElementById('showRegisterLink').addEventListener('click', (e) => {
        e.preventDefault();
        renderRegister();
    });
}

function renderRegister() {
    app.innerHTML = `
        <div class="container">
            <div class="auth-container">
                <div class="auth-card">
                    <div class="logo">
                        <h1>🐾 PetCare Connect</h1>
                        <p>Registro de Usuario</p>
                    </div>
                    <h2>Crear Cuenta</h2>
                    <form id="registerForm">
                        <div class="form-group">
                            <label for="nombre">Nombre *</label>
                            <input type="text" id="nombre" name="nombre" required>
                        </div>
                        <div class="form-group">
                            <label for="apellido">Apellido *</label>
                            <input type="text" id="apellido" name="apellido" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email *</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Contraseña * (mínimo 6 caracteres)</label>
                            <input type="password" id="password" name="password" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="telefono">Teléfono</label>
                            <input type="tel" id="telefono" name="telefono">
                        </div>
                        <div class="form-group">
                            <label for="rol">Rol *</label>
                            <select id="rol" name="rol" required>
                                <option value="dueño">Dueño (busco servicios)</option>
                                <option value="cuidador">Cuidador (ofrezco servicios)</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Registrarse</button>
                        <button type="button" id="backToLoginBtn" class="btn btn-secondary" style="margin-top: 10px;">Volver al Login</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        if (password.length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        const usuarioData = {
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            email: document.getElementById('email').value,
            password: password,
            telefono: document.getElementById('telefono').value,
            rol: document.getElementById('rol').value,
            activo: 1
        };
        
        try {
            await api.createUsuario(usuarioData);
            showMessage('¡Registro exitoso! Ahora puedes iniciar sesión', 'success');
            renderLogin();
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });
    
    document.getElementById('backToLoginBtn').addEventListener('click', () => {
        renderLogin();
    });
}

function renderDashboard() {
    if (!currentUser) {
        renderLogin();
        return;
    }
    
    app.innerHTML = `
        ${renderNavBar()}
        <div class="dashboard">
            <div class="header">
                <div class="user-info">
                    <h1>🐾 PetCare Connect</h1>
                    <p>Bienvenido, ${currentUser.nombre} ${currentUser.apellido} 
                    <span class="role-badge role-${currentUser.rol}">${currentUser.rol}</span></p>
                </div>
            </div>
            
            <div class="stats-container">
                <div class="stat-card">
                    <h3>📊 Total Usuarios</h3>
                    <p class="stat-number">${usuarios.length}</p>
                </div>
                <div class="stat-card">
                    <h3>🐕 Dueños</h3>
                    <p class="stat-number">${usuarios.filter(u => u.rol === 'dueño').length}</p>
                </div>
                <div class="stat-card">
                    <h3>🐈 Cuidadores</h3>
                    <p class="stat-number">${usuarios.filter(u => u.rol === 'cuidador').length}</p>
                </div>
                <div class="stat-card">
                    <h3>⭐ Administradores</h3>
                    <p class="stat-number">${usuarios.filter(u => u.rol === 'administrador').length}</p>
                </div>
            </div>
            
            <div style="text-align: center; padding: 50px; background: white; border-radius: 15px;">
                <h2>🎉 Bienvenido al Sprint 2</h2>
                <p>Se ha implementado la Gestión de Productos/Servicios</p>
                <p>Usa el menú de navegación para acceder a las nuevas funcionalidades</p>
                <br>
                <div class="info-box">
                    <strong>📌 Novedades:</strong>
                    <ul style="text-align: left; margin-top: 15px;">
                        <li>✅ Los cuidadores pueden registrar sus servicios (paseo, guardería, alojamiento)</li>
                        <li>✅ Los administradores pueden validar y aprobar servicios</li>
                        <li>✅ Los dueños pueden ver solo los servicios aprobados</li>
                        <li>✅ Edición de productos con cambio automático de estado</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    attachNavEvents();
}

// ==================== VISTAS DE PRODUCTOS (Sprint 2) ====================

async function renderMisProductos() {
    // Mostrar loading
    app.innerHTML = `${renderNavBar()}<div class="container"><div class="loading">Cargando...</div></div>`;
    
    try {
        const productos = await api.getMisProductos(currentUser.id);
        
        app.innerHTML = `
            ${renderNavBar()}
            <div class="container">
                <div class="form-container" style="max-width: 1200px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2>📦 Mis Productos/Servicios</h2>
                        <button class="btn btn-primary" id="crearProductoBtnHeader">➕ Nuevo Servicio</button>
                    </div>
                    
                    ${productos.length === 0 ? `
                        <div class="empty-state">
                            <p>No tienes productos registrados aún.</p>
                            <button class="btn btn-primary" id="crearPrimerProductoBtn">➕ Crear mi primer servicio</button>
                        </div>
                    ` : `
                        <div class="table-container">
                            <table class="users-table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Categoría</th>
                                        <th>Precio (Bs.)</th>
                                        <th>Estado</th>
                                        <th>Motivo</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${productos.map(p => `
                                        <tr>
                                            <td><strong>${escapeHtml(p.titulo)}</strong><br><small>${escapeHtml(p.descripcion.substring(0, 50))}...</small></small></td>
                                            <td><span class="role-badge">${p.categoria}</span></small></small></small></small></small></small></small></small></td>
                                            <td>Bs. ${parseFloat(p.precio).toFixed(2)}</small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></td>
                                            <td>${getEstadoBadge(p.estado)}</small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small></small>ROS
                                            <td>${p.motivo_rechazo ? `<small style="color: red;">${escapeHtml(p.motivo_rechazo)}</small>` : '-'}</small></small></small></small></small></small></small></small></small></small></small>ROS
                                            <td class="actions">
                                                <button class="btn-icon btn-edit" data-id="${p.id}" title="Editar">✏️</button>
                                                <button class="btn-icon btn-delete" data-id="${p.id}" title="Eliminar">🗑️</button>
                                            </small>ROS
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        // ✅ Adjuntar eventos de navegación DESPUÉS de renderizar
        attachNavEvents();
        
        // ✅ Botones de crear producto (dentro de la vista)
        document.getElementById('crearProductoBtnHeader')?.addEventListener('click', () => renderCrearProducto());
        document.getElementById('crearPrimerProductoBtn')?.addEventListener('click', () => renderCrearProducto());
        
        // ✅ Botones de editar y eliminar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                renderEditarProducto(id);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                renderDeleteProductoModal(id);
            });
        });
        
    } catch (error) {
        showMessage(error.message, 'error');
        renderDashboard();
    }
}

async function renderCrearProducto() {
    app.innerHTML = `
        ${renderNavBar()}
        <div class="container">
            <div class="form-container">
                <h2>➕ Registrar Nuevo Servicio</h2>
                <form id="crearProductoForm">
                    <div class="form-group">
                        <label for="titulo">Título del servicio *</label>
                        <input type="text" id="titulo" name="titulo" required placeholder="Ej: Paseo de mascotas">
                    </div>
                    <div class="form-group">
                        <label for="descripcion">Descripción *</label>
                        <textarea id="descripcion" name="descripcion" rows="4" required placeholder="Describe tu servicio en detalle..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="precio">Precio/Tarifa (Bs.) *</label>
                        <input type="number" id="precio" name="precio" step="0.01" min="0.01" required placeholder="Ej: 50.00">
                    </div>
                    <div class="form-group">
                        <label for="categoria">Categoría *</label>
                        <select id="categoria" name="categoria" required>
                            <option value="paseo">🐕 Paseo</option>
                            <option value="guarderia">🏠 Guardería</option>
                            <option value="alojamiento">🛌 Alojamiento</option>
                        </select>
                    </div>
                    <div class="info-box" style="background: #FFF3E0; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                        <small>📌 Nota: Tu servicio quedará en estado <strong>PENDIENTE</strong> hasta que sea validado por un administrador.</small>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-primary">💾 Guardar Servicio</button>
                        <button type="button" id="cancelBtn" class="btn btn-secondary">❌ Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    attachNavEvents();
    
    document.getElementById('crearProductoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productoData = {
            titulo: document.getElementById('titulo').value,
            descripcion: document.getElementById('descripcion').value,
            precio: parseFloat(document.getElementById('precio').value),
            categoria: document.getElementById('categoria').value,
            ofertante_id: currentUser.id
        };
        
        try {
            await api.createProducto(productoData);
            showMessage('✅ Servicio registrado exitosamente. Quedó en estado PENDIENTE', 'success');
            renderMisProductos();
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });
    
    document.getElementById('cancelBtn').addEventListener('click', () => renderMisProductos());
}

async function renderEditarProducto(id) {
    try {
        const producto = await api.getProducto(id);
        
        app.innerHTML = `
            ${renderNavBar()}
            <div class="container">
                <div class="form-container">
                    <h2>✏️ Editar Servicio</h2>
                    <form id="editarProductoForm">
                        <div class="form-group">
                            <label for="titulo">Título del servicio *</label>
                            <input type="text" id="titulo" name="titulo" value="${escapeHtml(producto.titulo)}" required>
                        </div>
                        <div class="form-group">
                            <label for="descripcion">Descripción *</label>
                            <textarea id="descripcion" name="descripcion" rows="4" required>${escapeHtml(producto.descripcion)}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="precio">Precio/Tarifa (Bs.) *</label>
                            <input type="number" id="precio" name="precio" step="0.01" min="0.01" value="${producto.precio}" required>
                        </div>
                        <div class="form-group">
                            <label for="categoria">Categoría *</label>
                            <select id="categoria" name="categoria" required>
                                <option value="paseo" ${producto.categoria === 'paseo' ? 'selected' : ''}>🐕 Paseo</option>
                                <option value="guarderia" ${producto.categoria === 'guarderia' ? 'selected' : ''}>🏠 Guardería</option>
                                <option value="alojamiento" ${producto.categoria === 'alojamiento' ? 'selected' : ''}>🛌 Alojamiento</option>
                            </select>
                        </div>
                        ${producto.estado === 'aprobado' ? `
                            <div class="info-box" style="background: #FFF3E0; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                                <small>⚠️ <strong>Advertencia:</strong> Si modificas el título, descripción, precio o categoría, tu servicio volverá a estado <strong>PENDIENTE</strong> y necesitará ser validado nuevamente.</small>
                            </div>
                        ` : ''}
                        <div class="form-buttons">
                            <button type="submit" class="btn btn-primary">💾 Actualizar Servicio</button>
                            <button type="button" id="cancelBtn" class="btn btn-secondary">❌ Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        attachNavEvents();
        
        document.getElementById('editarProductoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const productoData = {
                titulo: document.getElementById('titulo').value,
                descripcion: document.getElementById('descripcion').value,
                precio: parseFloat(document.getElementById('precio').value),
                categoria: document.getElementById('categoria').value
            };
            
            try {
                await api.updateProducto(id, productoData);
                showMessage('✅ Servicio actualizado exitosamente', 'success');
                renderMisProductos();
            } catch (error) {
                showMessage(error.message, 'error');
            }
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => renderMisProductos());
        
    } catch (error) {
        showMessage(error.message, 'error');
        renderMisProductos();
    }
}

function renderDeleteProductoModal(id) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>⚠️ Confirmar Eliminación</h3>
            <p>¿Estás seguro de que deseas eliminar este servicio?</p>
            <p style="color: var(--danger-color); font-size: 12px;">Esta acción no se puede deshacer.</p>
            <div class="modal-buttons">
                <button id="confirmDeleteBtn" class="btn btn-danger">🗑️ Eliminar</button>
                <button id="cancelDeleteBtn" class="btn btn-secondary">❌ Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        try {
            await api.deleteProducto(id);
            showMessage('✅ Servicio eliminado exitosamente', 'success');
            renderMisProductos();
            modal.remove();
        } catch (error) {
            showMessage(error.message, 'error');
            modal.remove();
        }
    });
    
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        modal.remove();
    });
}

async function renderValidarProductos() {
    app.innerHTML = `${renderNavBar()}<div class="container"><div class="loading">Cargando...</div></div>`;
    attachNavEvents();
    
    try {
        const productos = await api.getProductosPendientes();
        
        app.innerHTML = `
            ${renderNavBar()}
            <div class="container">
                <div class="form-container" style="max-width: 1200px;">
                    <h2>✅ Validar Productos/Servicios</h2>
                    <p>Revisa los servicios pendientes y aprueba o rechaza según corresponda.</p>
                    ${productos.length === 0 ? `
                        <div class="empty-state">
                            <p>No hay productos pendientes de validación.</p>
                        </div>
                    ` : `
                        <div class="table-container">
                            <table class="users-table">
                                <thead>
                                    <tr><th>Ofertante</th><th>Título</th><th>Categoría</th><th>Precio</th><th>Descripción</th><th>Acciones</th></tr>
                                </thead>
                                <tbody>
                                    ${productos.map(p => `
                                        <tr>
                                            <td><strong>${escapeHtml(p.nombre)} ${escapeHtml(p.apellido)}</strong><br><small>${escapeHtml(p.email)}</small></td>
                                            <td><strong>${escapeHtml(p.titulo)}</strong></td>
                                            <td><span class="role-badge">${p.categoria}</span></td>
                                            <td>Bs. ${parseFloat(p.precio).toFixed(2)}</td>
                                            <td><small>${escapeHtml(p.descripcion.substring(0, 100))}...</small></td>
                                            <td class="actions">
                                                <button class="btn btn-success btn-sm" data-id="${p.id}" data-action="aprobar">✅ Aprobar</button>
                                                <button class="btn btn-danger btn-sm" data-id="${p.id}" data-action="rechazar">❌ Rechazar</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;
        attachNavEvents();
        
        document.querySelectorAll('[data-action="aprobar"]').forEach(btn => {
            btn.addEventListener('click', () => aprobarProducto(parseInt(btn.dataset.id)));
        });
        
        document.querySelectorAll('[data-action="rechazar"]').forEach(btn => {
            btn.addEventListener('click', () => mostrarModalRechazo(parseInt(btn.dataset.id)));
        });
        
    } catch (error) {
        showMessage(error.message, 'error');
        renderDashboard();
    }
}

async function aprobarProducto(id) {
    try {
        await api.validarProducto(id, 'aprobado');
        showMessage('✅ Producto aprobado exitosamente', 'success');
        renderValidarProductos();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function mostrarModalRechazo(id) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h3>❌ Rechazar Producto</h3>
            <p>Por favor, indica el motivo del rechazo:</p>
            <textarea id="motivoRechazo" rows="3" style="width: 100%; padding: 10px; margin: 10px 0;" placeholder="Ej: El precio no corresponde al mercado..."></textarea>
            <div class="modal-buttons">
                <button id="confirmRechazarBtn" class="btn btn-danger">Confirmar Rechazo</button>
                <button id="cancelRechazarBtn" class="btn btn-secondary">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('confirmRechazarBtn').addEventListener('click', async () => {
        const motivo = document.getElementById('motivoRechazo').value;
        if (!motivo) {
            showMessage('Debes proporcionar un motivo de rechazo', 'error');
            return;
        }
        
        try {
            await api.validarProducto(id, 'rechazado', motivo);
            showMessage('❌ Producto rechazado', 'success');
            renderValidarProductos();
            modal.remove();
        } catch (error) {
            showMessage(error.message, 'error');
            modal.remove();
        }
    });
    
    document.getElementById('cancelRechazarBtn').addEventListener('click', () => {
        modal.remove();
    });
}

async function renderTodosProductos() {
    app.innerHTML = `${renderNavBar()}<div class="container"><div class="loading">Cargando...</div></div>`;
    attachNavEvents();
    
    try {
        const productos = await api.getProductos();
        
        app.innerHTML = `
            ${renderNavBar()}
            <div class="container">
                <div class="form-container" style="max-width: 1200px;">
                    <h2>📋 Todos los Productos/Servicios</h2>
                    <div class="table-container">
                        <table class="users-table">
                            <thead>
                                <tr><th>ID</th><th>Ofertante</th><th>Título</th><th>Precio</th><th>Estado</th><th>Creado</th></tr>
                            </thead>
                            <tbody>
                                ${productos.map(p => `
                                    <tr>
                                        <td>${p.id}</td>
                                        <td>${escapeHtml(p.nombre)} ${escapeHtml(p.apellido)}</td>
                                        <td><strong>${escapeHtml(p.titulo)}</strong></td>
                                        <td>Bs. ${parseFloat(p.precio).toFixed(2)}</td>
                                        <td>${getEstadoBadge(p.estado)}</td>
                                        <td><small>${new Date(p.fecha_creacion).toLocaleDateString()}</small></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        attachNavEvents();
        
    } catch (error) {
        showMessage(error.message, 'error');
        renderDashboard();
    }
}

// ==================== SPRINT 3: FILTROS Y SOLICITUDES ====================

let todosLosProductosAprobados = [];

async function renderProductosAprobados() {
    app.innerHTML = `${renderNavBar()}<div class="container"><div class="loading">Cargando...</div></div>`;
    attachNavEvents();
    
    try {
        todosLosProductosAprobados = await api.getProductosAprobados();
        renderListaFiltrada(todosLosProductosAprobados);
    } catch (error) {
        showMessage(error.message, 'error');
        renderDashboard();
    }
}

function renderListaFiltrada(productos) {
    app.innerHTML = `
        ${renderNavBar()}
        <div class="container">
            <div class="form-container" style="max-width: 1200px;">
                <h2>🔍 Buscar Servicios</h2>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <input type="text" id="searchInput" placeholder="Buscar por palabra clave..." style="flex: 1; padding: 8px;">
                    <select id="filterCategoria" style="padding: 8px;">
                        <option value="todas">Todas las categorías</option>
                        <option value="paseo">🐕 Paseo</option>
                        <option value="guarderia">🏠 Guardería</option>
                        <option value="alojamiento">🛌 Alojamiento</option>
                    </select>
                    <button id="btnBuscar" class="btn btn-primary">Buscar</button>
                </div>
                
                ${productos.length === 0 ? `
                    <div class="empty-state">
                        <p>No se encontraron servicios que coincidan con tu búsqueda.</p>
                    </div>
                ` : `
                    <div class="productos-grid">
                        ${productos.map(p => `
                            <div class="producto-card">
                                <h3>${escapeHtml(p.titulo)}</h3>
                                <span class="categoria-badge">${p.categoria}</span>
                                <p class="precio">Bs. ${parseFloat(p.precio).toFixed(2)}</p>
                                <p class="descripcion">${escapeHtml(p.descripcion.substring(0, 150))}...</p>
                                <div class="ofertante">
                                    <small>👤 ${escapeHtml(p.nombre)} ${escapeHtml(p.apellido)}</small>
                                </div>
                                <button class="btn btn-primary btn-sm btn-solicitar" data-id="${p.id}" data-titulo="${escapeHtml(p.titulo)}" style="margin-top: 10px; width:100%;">📨 Solicitar Servicio</button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
    attachNavEvents();
    
    document.getElementById('btnBuscar').addEventListener('click', () => {
        const text = document.getElementById('searchInput').value.toLowerCase();
        const cat = document.getElementById('filterCategoria').value;
        
        const filtrados = todosLosProductosAprobados.filter(p => {
            const matchText = p.titulo.toLowerCase().includes(text) || p.descripcion.toLowerCase().includes(text);
            const matchCat = cat === 'todas' || p.categoria === cat;
            return matchText && matchCat;
        });
        renderListaFiltrada(filtrados);
    });
    
    document.querySelectorAll('.btn-solicitar').forEach(btn => {
        btn.addEventListener('click', () => {
            abrirModalSolicitud(btn.dataset.id, btn.dataset.titulo);
        });
    });
}

function abrirModalSolicitud(productoId, tituloProducto) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h3>📨 Solicitar: ${tituloProducto}</h3>
            <p>Escribe los detalles que el cuidador debe conocer (ej: raza del perro, horarios...)</p>
            <textarea id="detallesSolicitud" rows="4" style="width: 100%; padding: 10px; margin: 10px 0;" placeholder="Tengo un Husky..."></textarea>
            <div class="modal-buttons">
                <button id="enviarSolicitudBtn" class="btn btn-primary">Enviar Solicitud</button>
                <button id="cancelarSolicitudBtn" class="btn btn-secondary">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('enviarSolicitudBtn').addEventListener('click', async () => {
        const detalles = document.getElementById('detallesSolicitud').value;
        if (!detalles) {
            showMessage('Debes proporcionar detalles para tu solicitud', 'error');
            return;
        }
        
        try {
            await api.crearSolicitud({
                producto_id: productoId,
                demandante_id: currentUser.id,
                detalles: detalles
            });
            showMessage('✅ Solicitud enviada con éxito.', 'success');
            modal.remove();
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });
    
    document.getElementById('cancelarSolicitudBtn').addEventListener('click', () => modal.remove());
}

async function renderSolicitudesOfertante() {
    app.innerHTML = `${renderNavBar()}<div class="container"><div class="loading">Cargando...</div></div>`;
    attachNavEvents();
    
    try {
        const solicitudes = await api.getSolicitudesOfertante(currentUser.id);
        
        app.innerHTML = `
            ${renderNavBar()}
            <div class="container">
                <div class="form-container" style="max-width: 1200px;">
                    <h2>📬 Solicitudes de Mis Servicios</h2>
                    
                    ${solicitudes.length === 0 ? `
                        <div class="empty-state"><p>No tienes solicitudes entrantes por ahora.</p></div>
                    ` : `
                        <div class="table-container">
                            <table class="users-table">
                                <thead>
                                    <tr><th>Servicio</th><th>Dueño (Demandante)</th><th>Detalles</th><th>Estado</th><th>Acciones</th></tr>
                                </thead>
                                <tbody>
                                    ${solicitudes.map(s => `
                                        <tr>
                                            <td><strong>${escapeHtml(s.titulo)}</strong></td>
                                            <td>👤 ${escapeHtml(s.demandante)}</td>
                                            <td><small>${escapeHtml(s.detalles)}</small></td>
                                            <td>${s.estado === 'Pendiente' ? '⏳ Pendiente' : (s.estado === 'Aceptada' ? '✅ Aceptada' : '❌ Rechazada')}</td>
                                            <td class="actions">
                                                ${s.estado === 'Pendiente' ? `
                                                    <button class="btn btn-success btn-sm btn-responder-solicitud" data-id="${s.id}" data-estado="Aceptada">Aceptar</button>
                                                    <button class="btn btn-danger btn-sm btn-responder-solicitud" data-id="${s.id}" data-estado="Rechazada">Rechazar</button>
                                                ` : `<em>Finalizada</em>`}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;
        attachNavEvents();
        
        document.querySelectorAll('.btn-responder-solicitud').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await api.actualizarEstadoSolicitud(btn.dataset.id, btn.dataset.estado);
                    showMessage(`Solicitud ${btn.dataset.estado} con éxito`, 'success');
                    renderSolicitudesOfertante();
                } catch(e) {
                    showMessage(e.message, 'error');
                }
            });
        });
        
    } catch (error) {
        showMessage(error.message, 'error');
        renderDashboard();
    }
}
async function renderUsuarios() {
    app.innerHTML = `
        ${renderNavBar()}
        <div class="container">
            <div class="form-container" style="max-width: 1200px;">
                <h2>👥 Gestión de Usuarios</h2>
                <p>Administra los usuarios de la plataforma: edita sus datos, cambia roles o desactívalos.</p>
                
                <div class="table-container">
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre Completo</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usuarios.map(u => `
                                <tr>
                                    <td>${u.id}</td>
                                    <td><strong>${escapeHtml(u.nombre)} ${escapeHtml(u.apellido)}</strong></td>
                                    <td>${escapeHtml(u.email)}</td>
                                    <td>${u.telefono || '-'}</td>
                                    <td>
                                        <select class="rol-select" data-id="${u.id}" data-rol="${u.rol}" ${u.email === 'admin@petcare.com' ? 'disabled' : ''}>
                                            <option value="dueño" ${u.rol === 'dueño' ? 'selected' : ''}>🐕 Dueño</option>
                                            <option value="cuidador" ${u.rol === 'cuidador' ? 'selected' : ''}>🐈 Cuidador</option>
                                            <option value="administrador" ${u.rol === 'administrador' ? 'selected' : ''}>👑 Administrador</option>
                                        </select>
                                    </td>
                                    <td>
                                        <select class="estado-select" data-id="${u.id}" data-estado="${u.activo}" ${u.email === 'admin@petcare.com' ? 'disabled' : ''}>
                                            <option value="1" ${u.activo === 1 ? 'selected' : ''}>✅ Activo</option>
                                            <option value="0" ${u.activo === 0 ? 'selected' : ''}>❌ Inactivo</option>
                                        </select>
                                    </td>
                                    <td class="actions">
                                        <button class="btn-icon btn-edit-user" data-id="${u.id}" title="Editar usuario" ${u.email === 'admin@petcare.com' ? 'disabled' : ''}>✏️</button>
                                        <button class="btn-icon btn-delete-user" data-id="${u.id}" title="Eliminar usuario" ${u.email === 'admin@petcare.com' ? 'disabled' : ''}>🗑️</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="info-box" style="margin-top: 20px;">
                    <small>📌 Nota: El usuario administrador principal (admin@petcare.com) no puede ser editado ni eliminado por seguridad.</small>
                </div>
            </div>
        </div>
    `;
    attachNavEvents();
    
    // Evento: Cambiar rol desde el select
    document.querySelectorAll('.rol-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const userId = parseInt(select.dataset.id);
            const nuevoRol = select.value;
            await cambiarRolUsuario(userId, nuevoRol, select);
        });
    });
    
    // Evento: Cambiar estado (activo/inactivo)
    document.querySelectorAll('.estado-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const userId = parseInt(select.dataset.id);
            const nuevoEstado = parseInt(select.value);
            await cambiarEstadoUsuario(userId, nuevoEstado, select);
        });
    });
    
    // Evento: Botón editar (abre modal con datos completos)
    document.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = parseInt(btn.dataset.id);
            await renderEditarUsuarioModal(userId);
        });
    });
    
    // Evento: Botón eliminar
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = parseInt(btn.dataset.id);
            renderDeleteUserModal(userId);
        });
    });
}

// Función para cambiar rol de usuario
async function cambiarRolUsuario(userId, nuevoRol, selectElement) {
    try {
        const usuarioActual = usuarios.find(u => u.id === userId);
        if (!usuarioActual) return;
        
        const data = { rol: nuevoRol };
        await api.updateUsuario(userId, data);
        
        // Actualizar array local
        usuarioActual.rol = nuevoRol;
        
        showMessage(`✅ Rol cambiado a "${nuevoRol}" correctamente`, 'success');
        
        // Recargar lista de usuarios (opcional, para mantener consistencia)
        await loadUsuarios();
        renderUsuarios();
        
    } catch (error) {
        showMessage(error.message, 'error');
        // Restaurar valor anterior
        selectElement.value = selectElement.dataset.rol;
    }
}

// Función para cambiar estado (activo/inactivo)
async function cambiarEstadoUsuario(userId, nuevoEstado, selectElement) {
    try {
        const usuarioActual = usuarios.find(u => u.id === userId);
        if (!usuarioActual) return;
        
        const data = { activo: nuevoEstado };
        await api.updateUsuario(userId, data);
        
        // Actualizar array local
        usuarioActual.activo = nuevoEstado;
        
        const estadoTexto = nuevoEstado === 1 ? 'activado' : 'desactivado';
        showMessage(`✅ Usuario ${estadoTexto} correctamente`, 'success');
        
        // Recargar lista de usuarios
        await loadUsuarios();
        renderUsuarios();
        
    } catch (error) {
        showMessage(error.message, 'error');
        selectElement.value = selectElement.dataset.estado;
    }
}

// Modal para editar usuario completo
async function renderEditarUsuarioModal(userId) {
    try {
        const user = await api.getUsuario(userId);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h3>✏️ Editar Usuario</h3>
                <form id="editarUsuarioForm">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="edit_nombre" value="${escapeHtml(user.nombre)}" required>
                    </div>
                    <div class="form-group">
                        <label>Apellido</label>
                        <input type="text" id="edit_apellido" value="${escapeHtml(user.apellido)}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="edit_email" value="${escapeHtml(user.email)}" required>
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="text" id="edit_telefono" value="${user.telefono || ''}">
                    </div>
                    <div class="form-group">
                        <label>Nueva Contraseña (dejar vacío para no cambiar)</label>
                        <input type="password" id="edit_password" placeholder="Mínimo 6 caracteres">
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-primary">💾 Guardar Cambios</button>
                        <button type="button" id="closeModalBtn" class="btn btn-secondary">❌ Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('editarUsuarioForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updateData = {
                nombre: document.getElementById('edit_nombre').value,
                apellido: document.getElementById('edit_apellido').value,
                email: document.getElementById('edit_email').value,
                telefono: document.getElementById('edit_telefono').value
            };
            
            const newPassword = document.getElementById('edit_password').value;
            if (newPassword) {
                if (newPassword.length < 6) {
                    showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
                    return;
                }
                updateData.password = newPassword;
            }
            
            try {
                await api.updateUsuario(userId, updateData);
                showMessage('✅ Usuario actualizado correctamente', 'success');
                await loadUsuarios();
                renderUsuarios();
                modal.remove();
            } catch (error) {
                showMessage(error.message, 'error');
            }
        });
        
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            modal.remove();
        });
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Modal para confirmar eliminación de usuario
function renderDeleteUserModal(userId) {
    const user = usuarios.find(u => u.id === userId);
    if (!user) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>⚠️ Confirmar Eliminación</h3>
            <p>¿Estás seguro de que deseas eliminar al usuario?</p>
            <p><strong>${escapeHtml(user.nombre)} ${escapeHtml(user.apellido)}</strong><br>
            <small>${escapeHtml(user.email)}</small></p>
            <p style="color: var(--danger-color); font-size: 12px;">Esta acción no se puede deshacer.</p>
            <div class="modal-buttons">
                <button id="confirmDeleteUserBtn" class="btn btn-danger">🗑️ Eliminar</button>
                <button id="cancelDeleteUserBtn" class="btn btn-secondary">❌ Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('confirmDeleteUserBtn').addEventListener('click', async () => {
        try {
            await api.deleteUsuario(userId);
            showMessage('✅ Usuario eliminado correctamente', 'success');
            await loadUsuarios();
            renderUsuarios();
            modal.remove();
        } catch (error) {
            showMessage(error.message, 'error');
            modal.remove();
        }
    });
    
    document.getElementById('cancelDeleteUserBtn').addEventListener('click', () => {
        modal.remove();
    });
}

function getEstadoBadge(estado) {
    const estados = {
        'pendiente': '<span class="status-badge" style="background: #FFF3E0; color: #F57C00;">⏳ Pendiente</span>',
        'aprobado': '<span class="status-badge status-active">✅ Aprobado</span>',
        'rechazado': '<span class="status-badge status-inactive">❌ Rechazado</span>'
    };
    return estados[estado] || estado;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function attachNavEvents() {
    const oldButtons = document.querySelectorAll('.nav-btn[data-view]');
    oldButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const view = btn.dataset.view;
            
            switch(view) {
                case 'mis-productos': renderMisProductos(); break;
                case 'mis-solicitudes': renderSolicitudesOfertante(); break;
                case 'crear-producto': renderCrearProducto(); break;
                case 'validar-productos': renderValidarProductos(); break;
                case 'todos-productos': renderTodosProductos(); break;
                case 'productos-aprobados': renderProductosAprobados(); break;
                case 'usuarios': renderUsuarios(); break;
                case 'dashboard': renderDashboard(); break;
                default: renderDashboard();
            }
        });
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        newLogoutBtn.addEventListener('click', () => {
            clearSession();
            showMessage('Sesión cerrada exitosamente', 'success');
            renderLogin();
        });
    }
}
async function init() {
    await loadUsuarios();
    if (loadSession()) {
        renderDashboard();
    } else {
        renderLogin();
    }
}

init();
 