-- MIGRATION: Create contenido_digital table for digital content (images/videos)
-- This replaces the in-memory storage with MySQL-backed persistence.

CREATE TABLE IF NOT EXISTS contenido_digital (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(255) DEFAULT NULL COMMENT 'Cloudinary public ID for resource management (destroy on delete)',
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  etiquetas JSON DEFAULT '[]' COMMENT 'Array of tag strings stored as JSON',
  fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo ENUM('imagen', 'video') NOT NULL,
  tamaño INT COMMENT 'File size in bytes',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  INDEX idx_producto_id (producto_id),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
