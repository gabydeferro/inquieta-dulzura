-- ============================================
-- SCHEMA CORREGIDO PARA PASTELERÍA
-- Sistema: Inquieta Dulzura
-- Fecha: 2025-12-27 (Corregido)
-- ============================================

/*
DIAGRAMA ENTIDAD-RELACION (DER) CORREGIDO:

+-----------------+
|   CATEGORIAS    |
|  (Tortas, Panes,|
|   Galletas)     |
+--------+--------+
         | 1
         |
         | N
+--------v---------+        +-----------------+
|   PRODUCTOS      |<-------+ FOTOS_PRODUCTOS |
|  (Torta Choco,   |   1:N  |  (imagenes)     |
|   Pan Integral)  |        +-----------------+
+----+---+---------+
     |   |
     |   | N                +-----------------+
     |   +------------------+  STOCK          |
     |                  1:1 |  (inventario)   |
     |                      +-----------------+
     | N
     |
     | M:N
+----v-------------+        +-----------------+
| PRODUCTO_RECETA  |        |    RECETAS      |
| (tabla inter.)   |<-------+  (Receta Torta) |
+------------------+   1:N  +--------+--------+
                                     | 1
                                     |
                                     | N
                           +---------v-------+
                           | RECETA_INGRED.  |
                           | (tabla inter.)  |
                           +---------+-------+
                                     | N
                                     |
                                     | 1
                           +---------v-------+
                           |  INGREDIENTES   |
                           | (Harina, Azucar)|
                           +-----------------+

+-----------------+        +-----------------+
|    CLIENTES     |        |     VENTAS      |
|  (opcional)     |<-------+  (cabecera)     |
+-----------------+   1:N  +--------+--------+
                                     | 1
                                     |
                                     | N
                           +---------v-------+
                           | VENTA_DETALLE   |
                           | (lineas venta)  |
                           +---------+-------+
                                     | N
                                     |
                                     | 1
                           +---------v-------+
                           |   PRODUCTOS     |
                           +-----------------+
*/

-- ============================================
-- MIGRACION UP: CREAR TABLAS
-- ============================================

START TRANSACTION;

-- 1. CATEGORIAS (antes llamado "inventario")
CREATE TABLE IF NOT EXISTS categorias (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Categorias de productos (Tortas, Panes, Galletas, etc.)';

-- 2. PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  categoria_id BIGINT UNSIGNED NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  costo DECIMAL(10, 2) COMMENT 'Costo de produccion',
  sku VARCHAR(50) UNIQUE COMMENT 'Codigo unico del producto',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_categoria (categoria_id),
  INDEX idx_nombre (nombre),
  INDEX idx_sku (sku),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. FOTOS_PRODUCTOS
CREATE TABLE IF NOT EXISTS fotos_productos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id BIGINT UNSIGNED NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_relativa VARCHAR(500) NULL,
  ruta_completa VARCHAR(1000) NULL,
  url_publica VARCHAR(1000) NOT NULL,
  cloudinary_public_id VARCHAR(255) NULL,
  tamano_bytes BIGINT UNSIGNED NULL,
  mimetype VARCHAR(100) NULL,
  ancho_px INT NULL,
  alto_px INT NULL,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  orden INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_producto (producto_id),
  INDEX idx_principal (es_principal),
  INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Fotos de los productos (almacenamiento local o Cloudinary)';

-- 3.1 LOG DE FOTOS ELIMINADAS (Para limpieza posterior)
CREATE TABLE IF NOT EXISTS fotos_eliminadas_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  foto_id BIGINT UNSIGNED NOT NULL,
  producto_id BIGINT UNSIGNED NOT NULL,
  nombre_archivo VARCHAR(500) NOT NULL,
  ruta_completa VARCHAR(1000) NOT NULL,
  tamano_bytes BIGINT UNSIGNED NOT NULL,
  eliminado_fisicamente BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_eliminacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_foto_id (foto_id),
  INDEX idx_eliminado_fisicamente (eliminado_fisicamente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log de fotos eliminadas para limpieza posterior';

-- 4. STOCK/INVENTARIO
CREATE TABLE IF NOT EXISTS stock (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id BIGINT UNSIGNED NOT NULL UNIQUE,
  cantidad_disponible DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cantidad_minima DECIMAL(10, 2) DEFAULT 0 COMMENT 'Stock minimo para alertas',
  unidad_medida ENUM('unidades', 'kg', 'litros', 'docenas') NOT NULL DEFAULT 'unidades',
  ultima_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_producto (producto_id),
  INDEX idx_stock_bajo (cantidad_disponible, cantidad_minima)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Control de stock/inventario de productos';

-- 5. RECETAS
CREATE TABLE IF NOT EXISTS recetas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  instrucciones TEXT COMMENT 'Pasos de preparacion',
  tiempo_preparacion INT COMMENT 'Tiempo en minutos',
  porciones DECIMAL(10, 2) COMMENT 'Cantidad que produce la receta',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Recetas de preparacion';

-- 6. INGREDIENTES (catalogo de ingredientes)
CREATE TABLE IF NOT EXISTS ingredientes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  unidad_medida ENUM('kg', 'litros', 'unidades', 'gramos', 'ml') NOT NULL,
  costo_unitario DECIMAL(10, 2) COMMENT 'Costo por unidad de medida',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Catalogo de ingredientes disponibles';

-- 7. RECETA_INGREDIENTE (relacion M:N entre recetas e ingredientes)
CREATE TABLE IF NOT EXISTS receta_ingrediente (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  receta_id BIGINT UNSIGNED NOT NULL,
  ingrediente_id BIGINT UNSIGNED NOT NULL,
  cantidad DECIMAL(10, 3) NOT NULL,
  unidad_medida ENUM('kg', 'litros', 'unidades', 'gramos', 'ml') NOT NULL,
  notas TEXT COMMENT 'Notas especificas sobre este ingrediente en esta receta',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY unique_receta_ingrediente (receta_id, ingrediente_id),
  INDEX idx_receta (receta_id),
  INDEX idx_ingrediente (ingrediente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Ingredientes necesarios para cada receta';

-- 8. PRODUCTO_RECETA (relacion M:N entre productos y recetas)
CREATE TABLE IF NOT EXISTS producto_receta (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id BIGINT UNSIGNED NOT NULL,
  receta_id BIGINT UNSIGNED NOT NULL,
  cantidad_receta DECIMAL(10, 2) DEFAULT 1 COMMENT 'Cuantas veces se aplica la receta',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY unique_producto_receta (producto_id, receta_id),
  INDEX idx_producto (producto_id),
  INDEX idx_receta (receta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Recetas utilizadas para fabricar cada producto';

-- 9. CLIENTES (opcional, pero recomendado)
CREATE TABLE IF NOT EXISTS clientes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  telefono VARCHAR(20),
  direccion TEXT,
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_telefono (telefono),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Clientes de la pasteleria';

-- 10. VENTAS (cabecera de venta)
CREATE TABLE IF NOT EXISTS ventas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id BIGINT UNSIGNED NULL COMMENT 'NULL para ventas sin cliente registrado',
  fecha_venta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(10, 2) NOT NULL,
  descuento DECIMAL(10, 2) DEFAULT 0,
  impuestos DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'otro') NOT NULL,
  estado ENUM('pendiente', 'completada', 'cancelada') NOT NULL DEFAULT 'completada',
  notas TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_cliente (cliente_id),
  INDEX idx_fecha (fecha_venta),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registro de ventas (cabecera)';

-- 11. VENTA_DETALLE (lineas de venta)
CREATE TABLE IF NOT EXISTS venta_detalle (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id BIGINT UNSIGNED NOT NULL,
  producto_id BIGINT UNSIGNED NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  descuento DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_venta (venta_id),
  INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Detalle de productos vendidos en cada venta';

-- 12. USUARIOS (para autenticacion)
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_login DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_rol (rol),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Usuarios del sistema con autenticacion';

-- 13. REFRESH_TOKENS (para JWT)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tokens de refresco para autenticacion JWT';

COMMIT;

-- ============================================
-- TRIGGERS UTILES
-- ============================================

DELIMITER $$

-- Trigger para actualizar stock despues de una venta
DROP TRIGGER IF EXISTS after_venta_detalle_insert$$
CREATE TRIGGER after_venta_detalle_insert
AFTER INSERT ON venta_detalle
FOR EACH ROW
BEGIN
  UPDATE stock 
  SET cantidad_disponible = cantidad_disponible - NEW.cantidad
  WHERE producto_id = NEW.producto_id;
END$$

-- Trigger para registrar fotos eliminadas
DROP TRIGGER IF EXISTS before_foto_delete$$
CREATE TRIGGER before_foto_delete
BEFORE DELETE ON fotos_productos
FOR EACH ROW
BEGIN
  INSERT INTO fotos_eliminadas_log 
    (foto_id, producto_id, nombre_archivo, ruta_completa, tamano_bytes)
  VALUES 
    (OLD.id, OLD.producto_id, OLD.nombre_archivo, OLD.url_publica, COALESCE(OLD.tamano_bytes, 0));
END$$

DELIMITER ;

-- ============================================
-- VISTAS UTILES
-- ============================================

-- Vista de productos con stock bajo
CREATE OR REPLACE VIEW v_productos_stock_bajo AS
SELECT 
  p.id,
  p.nombre,
  p.sku,
  c.nombre AS categoria,
  s.cantidad_disponible,
  s.cantidad_minima,
  s.unidad_medida
FROM productos p
INNER JOIN categorias c ON p.categoria_id = c.id
INNER JOIN stock s ON p.id = s.producto_id
WHERE s.cantidad_disponible <= s.cantidad_minima
  AND p.activo = TRUE;

-- Vista de ventas con detalles
CREATE OR REPLACE VIEW v_ventas_completas AS
SELECT 
  v.id AS venta_id,
  v.fecha_venta,
  COALESCE(cl.nombre, 'Cliente Anonimo') AS cliente,
  v.total AS total_venta,
  v.metodo_pago,
  v.estado,
  vd.id AS detalle_id,
  p.nombre AS producto,
  vd.cantidad,
  vd.precio_unitario,
  vd.total AS total_linea
FROM ventas v
LEFT JOIN clientes cl ON v.cliente_id = cl.id
INNER JOIN venta_detalle vd ON v.id = vd.venta_id
INNER JOIN productos p ON vd.producto_id = p.id;

-- Vista de estadisticas de fotos
CREATE OR REPLACE VIEW v_estadisticas_fotos AS
SELECT 
  COUNT(*) AS total_fotos,
  COALESCE(SUM(tamano_bytes), 0) AS tamano_total_bytes,
  COALESCE(SUM(tamano_bytes) / 1024 / 1024, 0) AS tamano_total_mb,
  COALESCE(AVG(tamano_bytes) / 1024, 0) AS promedio_kb,
  COALESCE(MAX(tamano_bytes), 0) AS foto_mas_grande_bytes,
  COALESCE(MIN(tamano_bytes), 0) AS foto_mas_pequena_bytes
FROM fotos_productos;

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Insertar categorias
INSERT INTO categorias (nombre, descripcion) VALUES
('Tortas', 'Tortas y pasteles'),
('Panes', 'Panes artesanales'),
('Galletas', 'Galletas y cookies'),
('Postres', 'Postres individuales')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Insertar ingredientes
INSERT INTO ingredientes (nombre, unidad_medida, costo_unitario) VALUES
('Harina', 'kg', 1.50),
('Azucar', 'kg', 2.00),
('Huevos', 'unidades', 0.30),
('Mantequilla', 'kg', 8.00),
('Chocolate', 'kg', 12.00),
('Leche', 'litros', 1.20)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Insertar productos
INSERT IGNORE INTO productos (categoria_id, nombre, descripcion, precio, costo, sku) VALUES
(1, 'Torta de Chocolate', 'Deliciosa torta de chocolate con cobertura', 25.00, 12.00, 'TORTA-CHOCO-001'),
(2, 'Pan Integral', 'Pan integral artesanal', 3.50, 1.50, 'PAN-INT-001'),
(3, 'Galletas de Avena', 'Galletas caseras de avena', 5.00, 2.00, 'GALL-AVENA-001');

-- Insertar stock
INSERT IGNORE INTO stock (producto_id, cantidad_disponible, cantidad_minima, unidad_medida) VALUES
(1, 10, 3, 'unidades'),
(2, 50, 10, 'unidades'),
(3, 30, 5, 'docenas');
