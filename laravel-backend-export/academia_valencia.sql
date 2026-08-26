-- ==============================================================================
-- Base de Datos MySQL: academia_valencia
-- Compatible con MySQL 5.7+, MySQL 8.x, MariaDB, XAMPP, WampServer, Laragon
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `academia_valencia` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `academia_valencia`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Tabla: roles
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id_rol` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_rol` VARCHAR(50) NOT NULL UNIQUE,
  `slug` VARCHAR(50) NOT NULL UNIQUE,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id_rol`, `nombre_rol`, `slug`, `descripcion`) VALUES
(1, 'Administrador del Sistema', 'admin', 'Acceso total a configuración, usuarios, cursos y reportes'),
(2, 'Personal Subordinado / Coordinador', 'subordinado', 'Acceso de gestión académica, consulta y supervisión'),
(3, 'Profesor / Facilitador', 'teacher', 'Gestión de calificaciones, asistencia y actas de curso'),
(4, 'Estudiante / Participante', 'student', 'Consulta de notas, constancias, récord e inscripción');

-- ------------------------------------------------------------------------------
-- 2. Tabla: usuarios
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` VARCHAR(64) PRIMARY KEY,
  `id_rol` INT NOT NULL,
  `cedula` VARCHAR(30) NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `codigo` VARCHAR(50) DEFAULT NULL,
  `telefono` VARCHAR(50) DEFAULT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `carrera` VARCHAR(150) DEFAULT NULL,
  `departamento` VARCHAR(150) DEFAULT NULL,
  `especialidad` VARCHAR(150) DEFAULT NULL,
  `semestre` INT DEFAULT 1,
  `estado` ENUM('Activo', 'Inactivo', 'Suspendido') DEFAULT 'Activo',
  `remember_token` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuarios de prueba iniciales (Clave por defecto: '123456' o hash bcrypt)
INSERT INTO `usuarios` (`id`, `id_rol`, `cedula`, `nombre`, `apellido`, `email`, `password`, `codigo`, `telefono`, `avatar`, `carrera`, `departamento`) VALUES
('usr-admin-1', 1, 'V-10293847', 'Administrador', 'Principal', 'admin@valencia.edu.ve', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADM-001', '0414-1234567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Administración', 'Dirección General'),
('usr-sub-1', 2, 'V-14556677', 'Coordinador', 'Académico', 'subordinado@valencia.edu.ve', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SUB-001', '0412-7654321', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Ingeniería', 'Coordinación Docente'),
('usr-prof-1', 3, 'V-12345678', 'Prof. Carlos', 'Mendoza', 'carlos.mendoza@valencia.edu.ve', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'DOC-101', '0424-9876543', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Ingeniería de Sistemas', 'Informática'),
('usr-prof-2', 3, 'V-13456789', 'Prof. Elena', 'Rivas', 'elena.rivas@valencia.edu.ve', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'DOC-102', '0416-5554433', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'Gestión y Finanzas', 'Administración'),
('usr-est-1', 4, 'V-28112233', 'Alejandro', 'Pérez', 'estudiante@valencia.edu.ve', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'EST-2026-001', '0414-9988776', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 'Ingeniería de Software', 'Informática');

-- ------------------------------------------------------------------------------
-- 3. Tabla: periodos_academicos
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `periodos_academicos`;
CREATE TABLE `periodos_academicos` (
  `id_periodo` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_periodo` VARCHAR(50) NOT NULL UNIQUE,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `activo` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `periodos_academicos` (`id_periodo`, `nombre_periodo`, `fecha_inicio`, `fecha_fin`, `activo`) VALUES
(1, '2026-I', '2026-02-01', '2026-07-31', TRUE),
(2, '2026-II', '2026-08-01', '2026-12-20', FALSE);

-- ------------------------------------------------------------------------------
-- 4. Tabla: aulas
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `aulas`;
CREATE TABLE `aulas` (
  `id_aula` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(30) NOT NULL UNIQUE,
  `nombre_aula` VARCHAR(100) NOT NULL,
  `edificio` VARCHAR(100) NOT NULL,
  `piso` INT DEFAULT 1,
  `capacidad` INT NOT NULL DEFAULT 30,
  `tipo` ENUM('Teórica', 'Laboratorio de Cómputo', 'Auditorio', 'Taller de Diseño', 'Laboratorio de Física', 'Taller Técnico / Industrial') DEFAULT 'Teórica',
  `recursos` TEXT DEFAULT NULL,
  `estado` ENUM('Disponible', 'Mantenimiento', 'Inhabilitada') DEFAULT 'Disponible',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `aulas` (`id_aula`, `codigo`, `nombre_aula`, `edificio`, `piso`, `capacidad`, `tipo`, `recursos`, `estado`) VALUES
(1, 'LAB-101', 'Laboratorio de Software y Redes', 'Edificio de Ingeniería', 1, 25, 'Laboratorio de Cómputo', '["25 PCs Intel i7", "Fibra Óptica", "Proyector 4K", "Aire Acondicionado"]', 'Disponible'),
(2, 'AULA-204', 'Aula Magistral Simón Bolívar', 'Edificio Central', 2, 45, 'Teórica', '["Pizarra Smart", "Sistema de Sonido", "Proyector"]', 'Disponible'),
(3, 'AUD-PAL', 'Auditorio Mayor Valencia', 'Edificio Cultural', 1, 150, 'Auditorio', '["Tarima", "Audio Pro", "Streaming HD", "Iluminación Escénica"]', 'Disponible');

-- ------------------------------------------------------------------------------
-- 5. Tabla: cursos
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `cursos`;
CREATE TABLE `cursos` (
  `id` VARCHAR(64) PRIMARY KEY,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `departamento` VARCHAR(100) NOT NULL,
  `carrera` VARCHAR(150) NOT NULL,
  `creditos` INT DEFAULT 3,
  `capacidad` INT NOT NULL DEFAULT 30,
  `inscritos_count` INT DEFAULT 0,
  `profesor_id` VARCHAR(64) DEFAULT NULL,
  `categoria` ENUM('COMERCIAL', 'INDUSTRIAL', 'GERENCIAL', 'ARTESANAL') DEFAULT 'COMERCIAL',
  `duracion` VARCHAR(100) DEFAULT '16 Semanas',
  `duracion_semanas` INT DEFAULT 16,
  `horas_academicas` INT DEFAULT 64,
  `horas_por_semana` INT DEFAULT 4,
  `tamano_contenido` ENUM('Corto / Intensivo', 'Estándar', 'Extenso / Diplomado') DEFAULT 'Estándar',
  `costo_semanal` DECIMAL(10,2) DEFAULT 12.00,
  `fecha_inicio` DATE DEFAULT NULL,
  `fecha_fin` DATE DEFAULT NULL,
  `fecha_inicio_programada_admin` BOOLEAN DEFAULT FALSE,
  `modalidad` ENUM('Presencial', 'Virtual', 'Híbrida') DEFAULT 'Presencial',
  `estado` ENUM('Activo', 'Cerrado', 'Planificado') DEFAULT 'Activo',
  `periodo` VARCHAR(50) DEFAULT '2026-I',
  `descripcion` TEXT DEFAULT NULL,
  `imagen` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cursos_profesor` FOREIGN KEY (`profesor_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `cursos` (`id`, `codigo`, `nombre`, `departamento`, `carrera`, `creditos`, `capacidad`, `inscritos_count`, `profesor_id`, `categoria`, `duracion`, `costo_semanal`, `fecha_inicio`, `fecha_fin`, `modalidad`, `estado`, `periodo`, `descripcion`) VALUES
('crs-prog-web', 'INF-301', 'Desarrollo Web Full Stack Moderno', 'Informática', 'Ingeniería de Software', 4, 25, 1, 'usr-prof-1', 'COMERCIAL', '16 Semanas (64 Horas)', 12.00, '2026-03-02', '2026-06-26', 'Híbrida', 'Activo', '2026-I', 'Dominio integral de React, TypeScript, APIs RESTful y bases de datos relacionales y documentales.'),
('crs-finanzas', 'ADM-204', 'Gestión Financiera y Presupuesto Corporativo', 'Administración', 'Gestión de Empresas', 3, 30, 0, 'usr-prof-2', 'GERENCIAL', '12 Semanas (48 Horas)', 10.00, '2026-03-09', '2026-05-29', 'Presencial', 'Activo', '2026-I', 'Análisis de estados financieros, planificación presupuestaria, indicadores de liquidez y rentabilidad.');

-- ------------------------------------------------------------------------------
-- 6. Tabla: inscripciones (Enrollments)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `inscripciones`;
CREATE TABLE `inscripciones` (
  `id` VARCHAR(64) PRIMARY KEY,
  `estudiante_id` VARCHAR(64) NOT NULL,
  `curso_id` VARCHAR(64) NOT NULL,
  `periodo` VARCHAR(50) NOT NULL DEFAULT '2026-I',
  `estado` ENUM('Inscrito', 'Retirado', 'Completado') DEFAULT 'Inscrito',
  `fecha_inscripcion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_inscrip_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inscrip_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_estudiante_curso` (`estudiante_id`, `curso_id`, `periodo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `inscripciones` (`id`, `estudiante_id`, `curso_id`, `periodo`, `estado`) VALUES
('enr-001', 'usr-est-1', 'crs-prog-web', '2026-I', 'Inscrito');

-- ------------------------------------------------------------------------------
-- 7. Tabla: calificaciones (Sistema Vigesimal 1 al 20, 4 Cortes de 25%)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `calificaciones`;
CREATE TABLE `calificaciones` (
  `id` VARCHAR(64) PRIMARY KEY,
  `inscripcion_id` VARCHAR(64) DEFAULT NULL,
  `estudiante_id` VARCHAR(64) NOT NULL,
  `curso_id` VARCHAR(64) NOT NULL,
  `evaluacion1` DECIMAL(4,2) DEFAULT NULL COMMENT 'Corte 1 (25%) - Escala 0 a 20',
  `evaluacion2` DECIMAL(4,2) DEFAULT NULL COMMENT 'Corte 2 (25%) - Escala 0 a 20',
  `evaluacion3` DECIMAL(4,2) DEFAULT NULL COMMENT 'Corte 3 (25%) - Escala 0 a 20',
  `evaluacion4` DECIMAL(4,2) DEFAULT NULL COMMENT 'Corte 4 (25%) - Escala 0 a 20',
  `nota_final` DECIMAL(4,2) DEFAULT NULL COMMENT 'Promedio ponderado 1-20',
  `acumulado` DECIMAL(4,2) DEFAULT NULL COMMENT 'Puntos acumulados de 20',
  `estado` ENUM('En curso', 'Aprobado', 'Reprobado') DEFAULT 'En curso',
  `observaciones` TEXT DEFAULT NULL,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_calif_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_calif_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_calif_estudiante_curso` (`estudiante_id`, `curso_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `calificaciones` (`id`, `inscripcion_id`, `estudiante_id`, `curso_id`, `evaluacion1`, `evaluacion2`, `evaluacion3`, `evaluacion4`, `nota_final`, `acumulado`, `estado`) VALUES
('grd-001', 'enr-001', 'usr-est-1', 'crs-prog-web', 18.00, 19.00, 17.50, 18.50, 18.25, 18.25, 'Aprobado');

-- ------------------------------------------------------------------------------
-- 8. Tabla: autoridades_institucionales (Configuración de firmas oficiales)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `autoridades_institucionales`;
CREATE TABLE `autoridades_institucionales` (
  `id` VARCHAR(64) PRIMARY KEY,
  `nombre_autoridad` VARCHAR(150) NOT NULL,
  `cargo_autoridad` VARCHAR(150) NOT NULL,
  `cedula_autoridad` VARCHAR(50) NOT NULL,
  `departamento_autoridad` VARCHAR(150) NOT NULL,
  `resolucion_acta` VARCHAR(100) DEFAULT 'RES-DIR-ACAD-2026-004',
  `telefono_contacto` VARCHAR(50) DEFAULT NULL,
  `email_institucional` VARCHAR(150) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `autoridades_institucionales` (`id`, `nombre_autoridad`, `cargo_autoridad`, `cedula_autoridad`, `departamento_autoridad`, `resolucion_acta`, `telefono_contacto`, `email_institucional`) VALUES
('default-authority', 'Dra. Carmen Rodríguez', 'Directora de Control de Estudios y Evaluación', 'V-11.234.567', 'Dirección de Control Académico y Secretaría General', 'RES-DIR-ACAD-2026-004', '+58 (241) 824-5500', 'control.estudios@valencia.edu.ve');

-- ------------------------------------------------------------------------------
-- 9. Tabla: auditorias (Bitácora de seguridad y eventos)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `auditorias`;
CREATE TABLE `auditorias` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` VARCHAR(64) DEFAULT NULL,
  `usuario_nombre` VARCHAR(100) DEFAULT NULL,
  `accion` VARCHAR(100) NOT NULL,
  `detalles` TEXT DEFAULT NULL,
  `direccion_ip` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `auditorias` (`usuario_id`, `usuario_nombre`, `accion`, `detalles`, `direccion_ip`) VALUES
('usr-admin-1', 'Administrador Principal', 'INICIALIZACION_SISTEMA', 'Estructura de base de datos MySQL inicializada satisfactoriamente', '127.0.0.1');

SET FOREIGN_KEY_CHECKS = 1;
