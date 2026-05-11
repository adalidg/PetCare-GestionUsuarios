from flask import Flask, request, jsonify, make_response
import sqlite3
import hashlib
import os
import re
from datetime import datetime

app = Flask(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'petcare.db')

# ── CORS manual ──────────────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin']  = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response

@app.route('/api/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return make_response('', 204)

# ── DB ───────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre      TEXT    NOT NULL,
            apellido    TEXT    NOT NULL,
            email       TEXT    UNIQUE NOT NULL,
            password    TEXT    NOT NULL,
            telefono    TEXT,
            rol         TEXT    NOT NULL DEFAULT 'dueño',
            foto_url    TEXT,
            activo      INTEGER NOT NULL DEFAULT 1,
            created_at  TEXT    NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# ── HELPERS ──────────────────────────────────────────────────
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def row_to_dict(row, hide_password=True):
    d = dict(row)
    if hide_password:
        d.pop('password', None)
    return d

def validate_email(email):
    return re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email)

# ── AUTH ─────────────────────────────────────────────────────
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email y contraseña son requeridos'}), 400
    conn = get_db()
    user = conn.execute(
        'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
        (data['email'].lower().strip(),)
    ).fetchone()
    conn.close()
    if not user or user['password'] != hash_password(data['password']):
        return jsonify({'error': 'Credenciales incorrectas'}), 401
    return jsonify({'message': 'Login exitoso', 'usuario': row_to_dict(user)}), 200

# ── CRUD ─────────────────────────────────────────────────────
@app.route('/api/usuarios', methods=['POST'])
def crear_usuario():
    data = request.get_json()
    for field in ['nombre', 'apellido', 'email', 'password']:
        if not data.get(field):
            return jsonify({'error': f'El campo {field} es requerido'}), 400
    if not validate_email(data['email']):
        return jsonify({'error': 'Email inválido'}), 400
    if len(data['password']) < 6:
        return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400
    rol = data.get('rol', 'dueño')
    if rol not in ('dueño', 'cuidador', 'administrador'):
        return jsonify({'error': 'Rol inválido'}), 400
    conn = get_db()
    if conn.execute('SELECT id FROM usuarios WHERE email = ?', (data['email'].lower().strip(),)).fetchone():
        conn.close()
        return jsonify({'error': 'El email ya está registrado'}), 409
    conn.execute('''
        INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol, foto_url, activo, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    ''', (data['nombre'].strip(), data['apellido'].strip(), data['email'].lower().strip(),
          hash_password(data['password']), data.get('telefono','').strip(), rol,
          data.get('foto_url',''), datetime.now().isoformat()))
    conn.commit()
    user = conn.execute('SELECT * FROM usuarios WHERE email = ?', (data['email'].lower().strip(),)).fetchone()
    conn.close()
    return jsonify({'message': 'Usuario creado exitosamente', 'usuario': row_to_dict(user)}), 201

@app.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    conn = get_db()
    rows = conn.execute('SELECT * FROM usuarios ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows]), 200

@app.route('/api/usuarios/<int:user_id>', methods=['GET'])
def obtener_usuario(user_id):
    conn = get_db()
    user = conn.execute('SELECT * FROM usuarios WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    return jsonify(row_to_dict(user)), 200

@app.route('/api/usuarios/<int:user_id>', methods=['PUT'])
def actualizar_usuario(user_id):
    data = request.get_json()
    conn = get_db()
    user = conn.execute('SELECT * FROM usuarios WHERE id = ?', (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'Usuario no encontrado'}), 404
    rol = data.get('rol', user['rol'])
    if rol not in ('dueño', 'cuidador', 'administrador'):
        conn.close()
        return jsonify({'error': 'Rol inválido'}), 400
    password = user['password']
    if data.get('password'):
        if len(data['password']) < 6:
            conn.close()
            return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400
        password = hash_password(data['password'])
    conn.execute('''
        UPDATE usuarios SET nombre=?, apellido=?, telefono=?, rol=?, foto_url=?, activo=?, password=?
        WHERE id=?
    ''', (data.get('nombre', user['nombre']).strip(),
          data.get('apellido', user['apellido']).strip(),
          data.get('telefono', user['telefono'] or '').strip(),
          rol, data.get('foto_url', user['foto_url'] or ''),
          data.get('activo', user['activo']), password, user_id))
    conn.commit()
    updated = conn.execute('SELECT * FROM usuarios WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return jsonify({'message': 'Usuario actualizado', 'usuario': row_to_dict(updated)}), 200

@app.route('/api/usuarios/<int:user_id>', methods=['DELETE'])
def eliminar_usuario(user_id):
    conn = get_db()
    if not conn.execute('SELECT id FROM usuarios WHERE id = ?', (user_id,)).fetchone():
        conn.close()
        return jsonify({'error': 'Usuario no encontrado'}), 404
    conn.execute('DELETE FROM usuarios WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Usuario eliminado correctamente'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
