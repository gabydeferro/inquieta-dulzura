-- MIGRACIÓN: Agregar soporte para Cloudinary a tabla existente
-- Ejecutar este script si ya tienes la tabla fotos_producto creada

-- Agregar campo cloudinary_public_id
ALTER TABLE fotos_producto 
ADD COLUMN cloudinary_public_id VARCHAR(255) NULL 
COMMENT 'ID público de Cloudinary para gestión de imágenes'
AFTER url_publica;

-- Agregar índice para búsquedas por cloudinary_public_id
ALTER TABLE fotos_producto 
ADD INDEX idx_cloudinary (cloudinary_public_id);

-- Actualizar comentario de la tabla
ALTER TABLE fotos_producto 
COMMENT='Fotos de productos - Soporta almacenamiento local y Cloudinary';

-- Actualizar comentarios de columnas existentes
ALTER TABLE fotos_producto 
MODIFY COLUMN ruta_relativa VARCHAR(500) NOT NULL 
COMMENT 'Ruta relativa o public_id de Cloudinary';

ALTER TABLE fotos_producto 
MODIFY COLUMN ruta_completa VARCHAR(500) NOT NULL 
COMMENT 'Ruta completa local o URL de Cloudinary';

-- Verificar cambios
SHOW CREATE TABLE fotos_producto;
