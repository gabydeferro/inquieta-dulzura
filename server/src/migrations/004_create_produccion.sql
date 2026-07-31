-- MIGRATION 004: Add stock column to ingredientes + create producciones table
--
-- REASON: Production tracking requires per-ingredient stock and a production
-- log to trace ingredient consumption and finished-good accreditation.
--
-- ROLLBACK:
--   ALTER TABLE ingredientes DROP COLUMN cantidad_disponible;
--   DROP TABLE IF EXISTS producciones;

START TRANSACTION;

ALTER TABLE ingredientes
  ADD COLUMN cantidad_disponible DECIMAL(10,3) NOT NULL DEFAULT 0
  AFTER costo_unitario;

CREATE TABLE producciones (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  receta_id BIGINT UNSIGNED NOT NULL,
  producto_id BIGINT UNSIGNED NOT NULL,
  cantidad_producida DECIMAL(10,2) NOT NULL,
  tandas_ejecutadas DECIMAL(10,2) NOT NULL,
  ingredientes_consumidos JSON DEFAULT NULL,
  created_by BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE RESTRICT,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_receta (receta_id),
  INDEX idx_producto (producto_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
