# Guía de Ejecución Local: Academia Valencia (Apache, MySQL y Node.js / Laravel)

Este repositorio contiene toda la estructura lista para que puedas ejecutar el sistema en tu computadora local de dos formas sencillas.

---

## Opción 1: Ejecutar Directamente con Node.js (Más Rápida, 100% Idéntica al Entorno de Google AI Studio)

Si deseas tener exactamente el mismo sistema funcionando en tu computadora local (con React 18, Vite, Tailwind CSS y el servidor Express/Node), solo necesitas:

### Pasos:
1. **Descarga el proyecto:**
   - En Google AI Studio, haz clic en el menú de opciones superior y selecciona **Export to ZIP** o **Export to GitHub**.
2. **Descomprime la carpeta** en tu computadora (ej. `C:/proyectos/academia-valencia`).
3. **Abre una terminal** en esa carpeta y ejecuta:
   ```bash
   npm install
   npm run dev
   ```
4. **Listo:** Tu aplicación estará corriendo en `http://localhost:3000` con todas sus funcionalidades, diseño, gráficos de Recharts, exportación de actas en PDF y gestión de notas.

---

## Opción 2: Ejecutar con Backend Laravel (PHP) y Base de Datos MySQL (Apache / XAMPP / WampServer)

Si deseas que la base de datos se almacene en **MySQL** gestionada por **Apache / PHP / Laravel**, hemos incluido en la carpeta `/laravel-backend-export/` todos los archivos necesarios:

### 1. Importar la Base de Datos MySQL
1. Abre **phpMyAdmin** (`http://localhost/phpmyadmin`) o tu cliente MySQL favorito (Workbench, DBeaver, HeidiSQL).
2. Crea una nueva base de datos llamada `academia_valencia`.
3. Importa el archivo `/laravel-backend-export/academia_valencia.sql`.
   - Este script ya contiene todas las tablas (`roles`, `usuarios`, `cursos`, `aulas`, `inscripciones`, `calificaciones`, `autoridades_institucionales`, `auditorias`) y los usuarios de prueba con contraseñas y roles configurados.

### 2. Configurar Laravel
1. Dentro de tu proyecto Laravel en `C:/xampp/htdocs/academia-backend` o donde tengas instalado Laravel:
2. En tu archivo `.env` de Laravel, configura la conexión a MySQL:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=academia_valencia
   DB_USERNAME=root
   DB_PASSWORD=
   ```
3. Copia las rutas de `/laravel-backend-export/routes/api.php` a tu archivo `routes/api.php` de Laravel.
4. Copia los controladores de `/laravel-backend-export/app/Http/Controllers/` a `app/Http/Controllers/` en tu Laravel.

### 3. Conectar el Frontend React con el Backend de Laravel
1. En tu frontend de React, las llamadas API apuntarán a `http://localhost/api` o `http://localhost:8000/api`.
2. Para compilar el frontend para producción y servirlo desde Apache:
   ```bash
   npm run build
   ```
3. Copia el contenido de la carpeta `dist/` a la carpeta pública de tu servidor web Apache (`C:/xampp/htdocs/academia/`).

---

## Resumen de Credenciales de Prueba (MySQL & Local)
- **Administrador:** `admin@valencia.edu.ve` (Clave: `123456`)
- **Coordinador Subordinado:** `subordinado@valencia.edu.ve` (Clave: `123456`)
- **Profesor:** `carlos.mendoza@valencia.edu.ve` (Clave: `123456`)
- **Estudiante:** `estudiante@valencia.edu.ve` (Clave: `123456`)
