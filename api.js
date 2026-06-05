const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
    // ==================== USUARIOS (Sprint 1) ====================
    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en el inicio de sesión');
        }
        return await response.json();
    },
    
    async getUsuarios() {
        const response = await fetch(`${API_BASE_URL}/usuarios`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener usuarios');
        }
        return await response.json();
    },
    
    async getUsuario(id) {
        const response = await fetch(`${API_BASE_URL}/usuarios/${id}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener usuario');
        }
        return await response.json();
    },
    
    async createUsuario(usuarioData) {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuarioData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear usuario');
        }
        return await response.json();
    },
    
    async updateUsuario(id, usuarioData) {
        const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuarioData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar usuario');
        }
        return await response.json();
    },
    
    async deleteUsuario(id) {
        const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar usuario');
        }
        return await response.json();
    },
    
    // ==================== PRODUCTOS/SERVICIOS (Sprint 2) ====================
    
    // HU-01: Crear producto/servicio
    async createProducto(data) {
        const response = await fetch(`${API_BASE_URL}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear producto');
        }
        return await response.json();
    },
    
    // Obtener todos los productos (con filtros opcionales)
    async getProductos(estado = null, ofertanteId = null) {
        let url = `${API_BASE_URL}/productos?`;
        if (estado) url += `estado=${estado}&`;
        if (ofertanteId) url += `ofertante_id=${ofertanteId}&`;
        
        const response = await fetch(url);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener productos');
        }
        return await response.json();
    },
    
    // Obtener producto por ID
    async getProducto(id) {
        const response = await fetch(`${API_BASE_URL}/productos/${id}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener producto');
        }
        return await response.json();
    },
    
    // HU-02: Actualizar producto
    async updateProducto(id, data) {
        const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar producto');
        }
        return await response.json();
    },
    
    // HU-02: Eliminar producto
    async deleteProducto(id) {
        const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar producto');
        }
        return await response.json();
    },
    
    // HU-03: Validar producto (aprobar/rechazar)
    async validarProducto(id, estado, motivoRechazo = null) {
        const response = await fetch(`${API_BASE_URL}/productos/${id}/validar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado, motivo_rechazo: motivoRechazo })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al validar producto');
        }
        return await response.json();
    },
    
    // Obtener productos pendientes (para admin)
    async getProductosPendientes() {
        const response = await fetch(`${API_BASE_URL}/productos/pendientes`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener productos pendientes');
        }
        return await response.json();
    },
    
    // Obtener mis productos (ofertante)
    async getMisProductos(ofertanteId) {
        const response = await fetch(`${API_BASE_URL}/mis-productos/${ofertanteId}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener mis productos');
        }
        return await response.json();
    },
    
    // Obtener productos aprobados (visibles para demandantes)
    async getProductosAprobados() {
        const response = await fetch(`${API_BASE_URL}/productos/aprobados`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener productos aprobados');
        }
        return await response.json();
    },

    // ==================== SPRINT 3: SOLICITUDES ====================
    
    async crearSolicitud(data) {
        const response = await fetch(`${API_BASE_URL}/solicitudes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error al crear la solicitud');
        return await response.json();
    },

    async getSolicitudesOfertante(ofertanteId) {
        const response = await fetch(`${API_BASE_URL}/solicitudes/ofertante/${ofertanteId}`);
        if (!response.ok) throw new Error('Error al obtener solicitudes');
        return await response.json();
    },

    async actualizarEstadoSolicitud(id, estado) {
        const response = await fetch(`${API_BASE_URL}/solicitudes/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado })
        });
        if (!response.ok) throw new Error('Error al actualizar estado');
        return await response.json();
    }
};