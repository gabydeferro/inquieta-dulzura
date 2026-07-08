-- MIGRACIÓN: Crear tabla instagram_posts
-- Fecha: 2026-07-06

CREATE TABLE IF NOT EXISTS instagram_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  instagram_post_id VARCHAR(100) DEFAULT NULL,
  status ENUM('draft', 'publishing', 'published', 'failed') NOT NULL DEFAULT 'draft',
  caption TEXT,
  media_url VARCHAR(500) DEFAULT NULL,
  published_at DATETIME DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES productos(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar cambios
SHOW CREATE TABLE instagram_posts;
