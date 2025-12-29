**Modelo de datos (diagrama ER)**

```
+---------------+
|  Módulo de  |
|  Contenido   |
|  Digital     |
+---------------+
       |
       |
       v
+---------------+
|  Fotos de    |
|  Producto    |
+---------------+
       |
       |
       v
+---------------+
|  API de      |
|  Contenido   |
|  Digital     |
+---------------+
       |
       |
       v
+---------------+
|  Inventario  |
|  (Microservicio)|
+---------------+
       |
       |
       v
+---------------+
|  Productos   |
+---------------+
       |
       |
       v
+---------------+
|  API de      |
|  Inventario  |
+---------------+
       |
       |
       v
+---------------+
|  Recetas     |
|  (Microservicio)|
+---------------+
       |
       |
       v
+---------------+
|  Recetas     |
+---------------+
       |
       |
       v
+---------------+
|  Ingredientes|
+---------------+
       |
       |
       v
+---------------+
|  Ventas      |
|  (Microservicio)|
+---------------+
       |
       |
       v
+---------------+
|  Ventas      |
+---------------+
       |
       |
       v
+---------------+
|  API de      |
|  Sistema     |
+---------------+
```

**Definición de todas las tablas**

### Tabla: Fotos de Producto

**Propósito**: Almacenar información de las fotos de los productos

**Relaciones**:
- Una foto de producto pertenece a un producto (1:N)

**Columnas**:
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único |
| producto_id | BIGINT UNSIGNED | FK | Identificador del producto |
| imagen | BLOB | | Imagen de la foto |
| created_at | DATETIME | | Fecha de creación |
| updated_at | DATETIME | | Fecha de actualización |

### Tabla: Productos

**Propósito**: Almacenar información de los productos

**Relaciones**:
- Un producto tiene varias fotos (1:N)
- Un producto pertenece a un inventario (1:N)

**Columnas**:
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único |
| nombre | VARCHAR(255) | | Nombre del producto |
| descripcion | TEXT | | Descripción del producto |
| precio | DECIMAL(10, 2) | | Precio del producto |
| inventario_id | BIGINT UNSIGNED | FK | Identificador del inventario |
| created_at | DATETIME | | Fecha de creación |
| updated_at | DATETIME | | Fecha de actualización |

### Tabla: Inventario

**Propósito**: Almacenar información del inventario

**Relaciones**:
- Un inventario tiene varios productos (1:N)

**Columnas**:
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único |
| nombre | VARCHAR(255) | | Nombre del inventario |
| descripcion | TEXT | | Descripción del inventario |
| created_at | DATETIME | | Fecha de creación |
| updated_at | DATETIME | | Fecha de actualización |

### Tabla: Recetas

**Propósito**: Almacenar información de las recetas

**Relaciones**:
- Una receta tiene varios ingredientes (1:N)

**Columnas**:
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único |
| nombre | VARCHAR(255) | | Nombre de la receta |
| descripcion | TEXT | | Descripción de la receta |
| created_at | DATETIME | | Fecha de creación |
| updated_at | DATETIME | | Fecha de actualización |

### Tabla: Ingredientes

**Propósito**: Almacenar información de los ingredientes

**Relaciones**:
- Un ingrediente pertenece a una receta (1:N)

**Columnas**:
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único |
| nombre | VARCHAR(255) | | Nombre del ingrediente |
| cantidad | DECIMAL(10, 2) | | Cantidad del ingrediente |
| receta_id | BIGINT UNSIGNED | FK | Identificador de la receta |
| created_at | DATETIME | | Fecha de creación |
| updated_at | DATETIME | | Fecha de actualización |

### Tabla: Ventas

**Propósito**: Almacenar información de las ventas

**Relaciones**:
- Una venta pertenece a un producto (1:N)

**Columnas**:
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único |
| producto_id | BIGINT UNSIGNED | FK | Identificador del producto |
| cantidad | DECIMAL(10, 2) | | Cantidad vendida |
| fecha | DATE | | Fecha de la venta |
| created_at | DATETIME | | Fecha de creación |
| updated_at | DATETIME | | Fecha de actualización |

### Tabla: API de Contenido Digital

**Propósito**: Almacenar información de la API de contenido digital

**Relaciones**:
- Una foto de producto pertenece a la API de contenido digital (1:N)

**Columnas**:
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único |
| foto_id | BIGINT UNSIGNED | FK | Identificador de la foto de producto |
| created_at | DATETIME | | Fecha de creación |
| updated_at | DATETIME | | Fecha de actualización |

### Tabla: API de Inventario

**Propósito**: Almacenar información de la API de inventario

**Relaciones**:
- Un producto pertenece a la API de inventario (1:N)

**Columnas**:
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único |
| producto_id | BIGINT UNSIGNED | FK | Identificador del producto |
| created_at | DATETIME | | Fecha de creación |
| updated_at | DATETIME | | Fecha de actualización |

### Tabla: API de Recetas

**Propósito**: Almacenar información de la API de recetas

**Relaciones**:
- Una receta pertenece a la API de recetas (1:N)

**Columnas**:
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único |
| receta_id | BIGINT UNSIGNED | FK | Identificador de la receta |
| created_at | DATETIME | | Fecha de creación |
| updated_at | DATETIME | | Fecha de actualización |

### Tabla: API de Ventas

**Propósito**: Almacenar información de la API de ventas

**Relaciones**:
- Una venta pertenece a la API de ventas (1:N)

**Columnas**:
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único |
| venta_id | BIGINT UNSIGNED | FK | Identificador de la venta |
| created_at | DATETIME | | Fecha de creación |
| updated_at | DATETIME | | Fecha de actualización |

### Tabla: API de Sistema

**Propósito**: Almacenar información de la API de sistema

**Relaciones**:
- Una foto de producto pertenece a la API de sistema (1:N)

**Columnas**:
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único |
| foto_id | BIGINT UNSIGNED | FK | Identificador de la foto de producto |
| created_at | DATETIME | | Fecha de creación |
| updated_at | DATETIME | | Fecha de actualización |

**Migraciones SQL (UP y DOWN)**

### Migración UP (Crear tablas)

```sql
-- ============================================
-- Migración: Crear tablas
-- Fecha: 2023-03-01
-- Descripción: Crear tablas para el sistema
-- ============================================

START TRANSACTION;

-- Crear tabla Fotos de Producto
CREATE TABLE IF NOT EXISTS fotos_de_producto (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id BIGINT UNSIGNED NOT NULL,
  imagen BLOB NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla Productos
CREATE TABLE IF NOT EXISTS productos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  inventario_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (inventario_id) REFERENCES inventario(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla Inventario
CREATE TABLE IF NOT EXISTS inventario (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla Recetas
CREATE TABLE IF NOT EXISTS recetas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla Ingredientes
CREATE TABLE IF NOT EXISTS ingredientes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  receta_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla Ventas
CREATE TABLE IF NOT EXISTS ventas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id BIGINT UNSIGNED NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  fecha DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla API de Contenido Digital
CREATE TABLE IF NOT EXISTS api_de_contenido_digital (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  foto_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (foto_id) REFERENCES fotos_de_producto(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla API de Inventario
CREATE TABLE IF NOT EXISTS api_de_inventario (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla API de Recetas
CREATE TABLE IF NOT EXISTS api_de_recetas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  receta_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla API de Ventas
CREATE TABLE IF NOT EXISTS api_de_ventas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla API de Sistema
CREATE TABLE IF NOT EXISTS api_de_sistema (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  foto_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (foto_id) REFERENCES fotos_de_producto(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
```

### Migración DOWN (Rollback)

```sql
-- Rollback de la migración
START TRANSACTION;

-- Eliminar tabla API de Sistema
DROP TABLE IF EXISTS api_de_sistema;

-- Eliminar tabla API de Ventas
DROP TABLE IF EXISTS api_de_ventas;

-- Eliminar tabla API de Recetas
DROP TABLE IF EXISTS api_de_recetas;

-- Eliminar tabla API de Inventario
DROP TABLE IF EXISTS api_de_inventario;

-- Eliminar tabla API de Contenido Digital
DROP TABLE IF EXISTS api_de_contenido_digital;

-- Eliminar tabla Ventas
DROP TABLE IF EXISTS ventas;

-- Eliminar tabla Ingredientes
DROP TABLE IF EXISTS ingredientes;

-- Eliminar tabla Recetas
DROP TABLE IF EXISTS recetas;

-- Eliminar tabla Inventario
DROP TABLE IF EXISTS inventario;

-- Eliminar tabla Productos
DROP TABLE IF EXISTS productos;

-- Eliminar tabla Fotos de Producto
DROP TABLE IF EXISTS fotos_de_producto;

COMMIT;
```

**Índices optimizados**

### Índice en la tabla Fotos de Producto

```sql
CREATE INDEX idx_foto_id ON fotos_de_producto (foto_id);
```

### Índice en la tabla Productos

```sql
CREATE INDEX idx_inventario_id ON productos (inventario_id);
```

### Índice en la tabla Inventario

```sql
CREATE INDEX idx_nombre ON inventario (nombre);
```

### Índice en la tabla Recetas

```sql
CREATE INDEX idx_nombre ON recetas (nombre);
```

### Índice en la tabla Ingredientes

```sql
CREATE INDEX idx_receta_id ON ingredientes (receta_id);
```

### Índice en la tabla Ventas

```sql
CREATE INDEX idx_producto_id ON ventas (producto_id);
```

**Queries de ejemplo**

### Consultar fotos de un producto

```sql
SELECT * FROM fotos_de_producto WHERE producto_id = 1;
```

### Consultar productos de un inventario

```sql
SELECT * FROM productos WHERE inventario_id = 1;
```

### Consultar recetas de un ingrediente

```sql
SELECT * FROM recetas WHERE id IN (SELECT receta_id FROM ingredientes WHERE id = 1);
```

### Consultar ventas de un producto

```sql
SELECT * FROM ventas WHERE producto_id = 1;
```

**Consideraciones de seguridad**

### Proteger contra SQL Injection

```sql
PREPARE stmt FROM 'SELECT * FROM fotos_de_producto WHERE producto_id = ?';
SET @producto_id = 1;
EXECUTE stmt USING @producto_id;
```

### Proteger contra acceso no autorizado

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON fotos_de_producto TO 'usuario'@'%' IDENTIFIED BY 'contraseña';
```

### Proteger contra pérdida de datos

```sql
CREATE EVENT backup_fotos_de_producto ON SCHEDULE EVERY 1 DAY DO
  BACKUP TABLE fotos_de_producto TO '/ruta/backup/fotos_de_producto.sql';
```