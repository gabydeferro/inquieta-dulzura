-- ============================================
-- SCHEMA PARA FOTOS EN SISTEMA DE ARCHIVOS
-- Sistema: Inquieta Dulzura
-- Estrategia: Archivos locales + Referencias en BD
-- ============================================

START TRANSACTION;

-- Tabla de productos (simplificada para el ejemplo)
CREATE TABLE IF NOT EXISTS productos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de fotos (referencias a archivos)
CREATE TABLE IF NOT EXISTS fotos_producto (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id BIGINT UNSIGNED NOT NULL,
  
  -- Información del archivo
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_relativa VARCHAR(500) NOT NULL COMMENT 'Relativa al proyecto',
  ruta_completa VARCHAR(500) NOT NULL COMMENT 'Ruta absoluta en el servidor',
  url_publica VARCHAR(500) COMMENT 'URL para acceder desde el navegador',
  
  -- Metadatos
  tamano_bytes INT NOT NULL,
  tipo_mime VARCHAR(50) NOT NULL,
  ancho_px INT COMMENT 'Ancho de la imagen en píxeles',
  alto_px INT COMMENT 'Alto de la imagen en píxeles',
  
  -- Organización
  es_principal BOOLEAN DEFAULT FALSE,
  orden TINYINT UNSIGNED DEFAULT 0,
  
  -- Auditoría
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Relaciones
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  
  -- Índices
  INDEX idx_producto (producto_id),
  INDEX idx_principal (producto_id, es_principal),
  INDEX idx_ruta (ruta_relativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Referencias a fotos almacenadas en el sistema de archivos';

-- Tabla de log de archivos eliminados (para limpieza)
CREATE TABLE IF NOT EXISTS fotos_eliminadas_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  foto_id BIGINT UNSIGNED,
  producto_id BIGINT UNSIGNED,
  ruta_completa VARCHAR(500),
  eliminado_fisicamente BOOLEAN DEFAULT FALSE,
  fecha_eliminacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_pendientes (eliminado_fisicamente)
) ENGINE=InnoDB;

COMMIT;

-- ============================================
-- TRIGGER: Registrar archivos eliminados
-- ============================================

DELIMITER $$

CREATE TRIGGER before_foto_delete
BEFORE DELETE ON fotos_producto
FOR EACH ROW
BEGIN
  -- Guardar info del archivo a eliminar
  INSERT INTO fotos_eliminadas_log 
    (foto_id, producto_id, ruta_completa, eliminado_fisicamente)
  VALUES 
    (OLD.id, OLD.producto_id, OLD.ruta_completa, FALSE);
END$$

DELIMITER ;

-- ============================================
-- PROCEDIMIENTO: Obtener foto principal
-- ============================================

DELIMITER $$

CREATE PROCEDURE sp_obtener_foto_principal(IN p_producto_id BIGINT)
BEGIN
  SELECT 
    id,
    nombre_archivo,
    ruta_relativa,
    url_publica,
    tipo_mime,
    ancho_px,
    alto_px
  FROM fotos_producto
  WHERE producto_id = p_producto_id
    AND es_principal = TRUE
  LIMIT 1;
  
  -- Si no hay principal, devolver la primera
  IF ROW_COUNT() = 0 THEN
    SELECT 
      id,
      nombre_archivo,
      ruta_relativa,
      url_publica,
      tipo_mime,
      ancho_px,
      alto_px
    FROM fotos_producto
    WHERE producto_id = p_producto_id
    ORDER BY orden ASC, created_at ASC
    LIMIT 1;
  END IF;
END$$

DELIMITER ;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de productos con su foto principal
CREATE OR REPLACE VIEW v_productos_con_foto AS
SELECT 
  p.id AS producto_id,
  p.nombre AS producto_nombre,
  p.precio,
  f.id AS foto_id,
  f.nombre_archivo,
  f.url_publica,
  f.tipo_mime
FROM productos p
LEFT JOIN (
  SELECT 
    producto_id,
    id,
    nombre_archivo,
    url_publica,
    tipo_mime,
    ROW_NUMBER() OVER (
      PARTITION BY producto_id 
      ORDER BY es_principal DESC, orden ASC, created_at ASC
    ) AS rn
  FROM fotos_producto
) f ON p.id = f.producto_id AND f.rn = 1;

-- Vista de estadísticas de almacenamiento
CREATE OR REPLACE VIEW v_estadisticas_fotos AS
SELECT 
  COUNT(*) AS total_fotos,
  SUM(tamano_bytes) AS tamano_total_bytes,
  ROUND(SUM(tamano_bytes) / 1024 / 1024, 2) AS tamano_total_mb,
  ROUND(AVG(tamano_bytes) / 1024, 2) AS promedio_kb,
  MAX(tamano_bytes) AS foto_mas_grande_bytes,
  MIN(tamano_bytes) AS foto_mas_pequena_bytes
FROM fotos_producto;

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Insertar producto de ejemplo
INSERT INTO productos (nombre, precio) VALUES
('Torta de Chocolate', 25.00),
('Pan Integral', 3.50),
('Galletas de Avena', 5.00);

-- Insertar fotos de ejemplo (simulando que ya existen los archivos)
INSERT INTO fotos_producto 
  (producto_id, nombre_archivo, ruta_relativa, ruta_completa, url_publica, tamano_bytes, tipo_mime, ancho_px, alto_px, es_principal, orden)
VALUES
  (1, 'torta-chocolate-principal.jpg', 
   'uploads/productos/1/torta-chocolate-principal.jpg',
   'c:/wamp64/www/inquieta-dulzura/uploads/productos/1/torta-chocolate-principal.jpg',
   'http://localhost/inquieta-dulzura/uploads/productos/1/torta-chocolate-principal.jpg',
   245678, 'image/jpeg', 1200, 800, TRUE, 0),
  
  (1, 'torta-chocolate-detalle-1.jpg',
   'uploads/productos/1/torta-chocolate-detalle-1.jpg',
   'c:/wamp64/www/inquieta-dulzura/uploads/productos/1/torta-chocolate-detalle-1.jpg',
   'http://localhost/inquieta-dulzura/uploads/productos/1/torta-chocolate-detalle-1.jpg',
   189234, 'image/jpeg', 800, 600, FALSE, 1),
  
  (2, 'pan-integral-principal.jpg',
   'uploads/productos/2/pan-integral-principal.jpg',
   'c:/wamp64/www/inquieta-dulzura/uploads/productos/2/pan-integral-principal.jpg',
   'http://localhost/inquieta-dulzura/uploads/productos/2/pan-integral-principal.jpg',
   156789, 'image/jpeg', 800, 600, TRUE, 0);

-- ============================================
-- QUERIES DE EJEMPLO
-- ============================================

-- Obtener todas las fotos de un producto
-- SELECT * FROM fotos_producto WHERE producto_id = 1 ORDER BY orden ASC;

-- Obtener solo la foto principal
-- SELECT * FROM fotos_producto WHERE producto_id = 1 AND es_principal = TRUE;

-- Listar productos con sus fotos principales
-- SELECT * FROM v_productos_con_foto;

-- Ver estadísticas de almacenamiento
-- SELECT * FROM v_estadisticas_fotos;

-- Obtener archivos pendientes de eliminar físicamente
-- SELECT * FROM fotos_eliminadas_log WHERE eliminado_fisicamente = FALSE;

-- ============================================
-- MANTENIMIENTO
-- ============================================

-- Script para limpiar archivos huérfanos (ejecutar periódicamente)
-- Este query muestra las fotos que ya no tienen registro en BD
/*
SELECT 
  fel.ruta_completa,
  fel.fecha_eliminacion
FROM fotos_eliminadas_log fel
WHERE fel.eliminado_fisicamente = FALSE
ORDER BY fel.fecha_eliminacion DESC;
*/

-- Después de eliminar físicamente los archivos, marcarlos como eliminados:
-- UPDATE fotos_eliminadas_log SET eliminado_fisicamente = TRUE WHERE id = ?;
