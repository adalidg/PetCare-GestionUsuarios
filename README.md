# 🐾 PetCare – Plataforma de Cuidado de Mascotas

> **Práctica N°1 · Sprint 1 · Gestión de Usuarios**  
> Materia: SIS324 Ingeniería de Software  
> Docente: Ing. Duran Quiroga Ramiro  
> Universidad Real y Pontificia de San Francisco Xavier de Chuquisaca

**Integrantes:**
- Jose Luis Maldonado Olmos (CIC)
- Gutiérrez Torricos Adalid (SIS)

**Grupo:** 16-Python

---

## 📋 Descripción del Sprint 1

Implementación del módulo de **Gestión de Usuarios** con CRUD completo y autenticación mediante login, como primera entrega del prototipo de la Plataforma de Cuidado de Mascotas.

---

## 🏗️ Stack Tecnológico

| Capa      | Tecnología          |
|-----------|---------------------|
| Backend   | Python 3 + Flask    |
| Base de datos | SQLite 3        |
| Frontend  | JavaScript (Vanilla) + HTML5 + CSS3 |

---

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/Jose-Maldonado16/Prototipo_SIS324.git
cd Prototipo_SIS324
```

### 2. Backend (Flask + SQLite)

```bash
cd backend

# Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
python app.py
```
El servidor correrá en: `http://localhost:5000`

### 3. Frontend

Abrir `frontend/index.html` directamente en el navegador, **o** usar un servidor estático:
```bash
cd frontend
python -m http.server 3000
```
Luego visitar: `http://localhost:3000`

---

## 📡 API REST – Endpoints

### Autenticación
| Método | Endpoint          | Descripción          |
|--------|-------------------|----------------------|
| POST   | `/api/auth/login` | Iniciar sesión       |

### Usuarios (CRUD)
| Método | Endpoint               | Descripción              |
|--------|------------------------|--------------------------|
| GET    | `/api/usuarios`        | Listar todos los usuarios |
| GET    | `/api/usuarios/:id`    | Obtener un usuario       |
| POST   | `/api/usuarios`        | Crear nuevo usuario      |
| PUT    | `/api/usuarios/:id`    | Actualizar usuario       |
| DELETE | `/api/usuarios/:id`    | Eliminar usuario         |

---

## 📌 Funcionalidades Implementadas

- ✅ **Login** con validación de credenciales (email + contraseña)
- ✅ **Registro** de nuevos usuarios desde la pantalla de login
- ✅ **Listar** todos los usuarios con estadísticas (total, dueños, cuidadores, activos)
- ✅ **Crear** usuario con campos: nombre, apellido, email, contraseña, teléfono, rol
- ✅ **Editar** usuario (todos los campos, cambio opcional de contraseña, estado activo/inactivo)
- ✅ **Eliminar** usuario con confirmación
- ✅ **Buscar/Filtrar** usuarios en tiempo real por nombre, email o rol
- ✅ Contraseñas almacenadas con **hash SHA-256**
- ✅ Roles: `dueño`, `cuidador`, `administrador`
- ✅ Sesión persistida en `localStorage`

---

## 🗂️ Estructura del Proyecto

```
Prototipo_SIS324/
├── backend/
│   ├── app.py              # API Flask (endpoints CRUD + Auth)
│   ├── requirements.txt    # Dependencias Python
│   └── petcare.db          # Base de datos SQLite (se genera automáticamente)
├── frontend/
│   ├── index.html          # SPA principal
│   ├── css/
│   │   └── style.css       # Estilos
│   └── js/
│       ├── api.js          # Módulo de llamadas HTTP
│       └── app.js          # Lógica de la aplicación
└── README.md
```

---

## 🗃️ Modelo de Datos – Tabla `usuarios`

| Campo       | Tipo    | Descripción                              |
|-------------|---------|------------------------------------------|
| id          | INTEGER | PK autoincremental                       |
| nombre      | TEXT    | Nombre del usuario                       |
| apellido    | TEXT    | Apellido del usuario                     |
| email       | TEXT    | Email único (usado para login)           |
| password    | TEXT    | Hash SHA-256 de la contraseña            |
| telefono    | TEXT    | Teléfono opcional                        |
| rol         | TEXT    | `dueño` / `cuidador` / `administrador`   |
| foto_url    | TEXT    | URL de foto de perfil (opcional)         |
| activo      | INTEGER | 1 = activo, 0 = inactivo                 |
| created_at  | TEXT    | Fecha/hora de creación (ISO 8601)        |

---

## 📋 Sprint 1 – Scrum Backlog

| ID  | Historia de Usuario | Estado |
|-----|---------------------|--------|
| US-01 | Como usuario quiero iniciar sesión con email y contraseña | ✅ Done |
| US-02 | Como administrador quiero crear nuevos usuarios | ✅ Done |
| US-03 | Como administrador quiero ver la lista de todos los usuarios | ✅ Done |
| US-04 | Como administrador quiero editar los datos de un usuario | ✅ Done |
| US-05 | Como administrador quiero eliminar un usuario del sistema | ✅ Done |
| US-06 | Como usuario quiero registrarme en la plataforma | ✅ Done |
| US-07 | Como administrador quiero buscar usuarios por nombre/email/rol | ✅ Done |
