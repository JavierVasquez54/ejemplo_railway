// Importar los módulos necesarios
const express = require('express');
const mysql = require('mysql2/promise');

// Crear una instancia de la aplicación Express
const app = express();

// Definir el puerto en el que se ejecutará el servidor
const PORT = process.env.PORT || 3000;

// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Middleware para procesar JSON
app.use(express.json());

// Middleware para procesar datos de formularios
app.use(express.urlencoded({ extended: true }));

// Crear un pool de conexiones MySQL
let pool;
async function initializeDbPool() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Conexión a MySQL establecida correctamente');
    
    // Verificar la conexión a la base de datos
    const connection = await pool.getConnection();
    connection.release();
    console.log('Base de datos conectada correctamente');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
}

// Inicializar la conexión a la base de datos
initializeDbPool();

// Ruta principal
app.get('/', (req, res) => {
  res.send('¡Hola Mundo! Servidor Express con MySQL funcionando correctamente.');
});

// Ruta para verificar la conexión a la base de datos
app.get('/db-status', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ status: 'ok', message: 'Conexión a la base de datos exitosa' });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al conectar con la base de datos',
      error: error.message
    });
  }
});

// Ejemplo de una ruta para obtener datos de una tabla
app.get('/api/users', async (req, res) => {
  try {
    // Suponiendo que tienes una tabla 'users'
    const [rows] = await pool.query('SELECT * FROM users LIMIT 10');
    res.json({
      message: 'Datos obtenidos correctamente',
      data: rows
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al obtener datos',
      error: error.message
    });
  }
});

// Ejemplo de ruta para insertar datos
app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Se requieren los campos name y email' 
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Usuario creado correctamente',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al crear usuario',
      error: error.message
    });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`Variables de entorno de base de datos:
    DB_HOST: ${process.env.DB_HOST || 'no definido (usando default)'}
    DB_USER: ${process.env.DB_USER || 'no definido (usando default)'}
    DB_NAME: ${process.env.DB_NAME || 'no definido (usando default)'}
    DB_PORT: ${process.env.DB_PORT || 'no definido (usando default)'}
  `);
});