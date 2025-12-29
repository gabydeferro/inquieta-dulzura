# Documentación del Sistema "Inquieta Dulzura"

Este documento describe el estado actual de la aplicación y el procedimiento correcto para poblar la base de datos inicial.

## 1. Cómo Funciona la Página Actualmente

La aplicación se encuentra en una fase de **prototipo de alta fidelidad**. Esto significa que la interfaz de usuario está desarrollada y es navegable, pero **no está conectada a la base de datos** para la mayoría de sus funciones.

### Frontend (Cliente)
- **Tecnología:** React con TypeScript.
- **Funcionalidad:** La interfaz de usuario simula la experiencia final. Se pueden ver secciones como "Catálogo", "Inventario", "Recetas" y "Ventas".
- **Datos:** **Todos los datos que se muestran son de prueba (mock) y están incrustados directamente en el código del frontend.** Por ejemplo, la lista de pasteles en el catálogo no proviene de la base de datos, sino de un arreglo definido en el archivo `client/src/Catalogo.tsx`.
- **Interacciones:** Las acciones como "guardar", "editar" o "eliminar" en los formularios (ej. en Inventario) no envían información al servidor. Su funcionalidad está simulada y, por lo general, solo muestran mensajes en la consola del navegador.
- **Autenticación:** El flujo de login y registro sí está conectado al backend, permitiendo crear usuarios y obtener un token de autenticación. Las rutas protegidas (como `/dashboard` o `/inventario`) validan si el usuario ha iniciado sesión.

### Backend (Servidor)
- **Tecnología:** Node.js con Express y TypeScript.
- **Funcionalidad:** El desarrollo del backend es parcial. Actualmente, solo están implementados los siguientes servicios:
    - **Autenticación (`/api/auth`):** Permite el registro e inicio de sesión de usuarios.
    - **Gestión de Fotos (`/api/fotos`):** Provee la lógica para subir imágenes a Cloudinary.
- **Servicios Faltantes:** Aún no se han desarrollado los endpoints de la API para gestionar el inventario, las recetas, el catálogo de productos o las ventas.

## 2. Orden Correcto de Carga de la Base de Datos

Para poblar la base de datos sin violar las restricciones de integridad (errores de clave externa o `FOREIGN KEY`), se debe seguir un orden específico. Las tablas que no dependen de ninguna otra deben llenarse primero.

A continuación se detalla el orden lógico agrupado por funcionalidad:

### Paso 1: Catálogos Base (Entidades sin dependencias externas)
Son las tablas principales que no requieren información de otras.
1.  **`usuarios`**: Registros de los usuarios que administrarán el sistema (roles 'admin', 'usuario').
2.  **`clientes`**: Información de los clientes que realizan compras (opcional para una venta).
3.  **`categorias`**: Las categorías de los productos (ej: 'Tortas', 'Panes', 'Galletas').
4.  **`ingredientes`**: El catálogo de materias primas (ej: 'Harina', 'Azúcar', 'Chocolate').
5.  **`recetas`**: Las recetas base para preparar productos (aún sin asignar ingredientes).

### Paso 2: Productos
Esta tabla depende de las categorías.
6.  **`productos`**: El corazón del sistema. Cada producto debe estar asociado a una `categoria_id` del paso anterior.

### Paso 3: Detalles y Stock de Productos
Estas tablas dependen directamente de `productos`.
7.  **`stock`**: Define la cantidad disponible de cada producto. Cada registro se asocia a un `producto_id`.
8.  **`fotos_productos`**: Almacena las imágenes de cada producto, asociadas a un `producto_id`.

### Paso 4: Composición de Recetas y Productos (Tablas de Unión)
Estas tablas conectan las entidades base.
9.  **`receta_ingrediente`**: Define qué `ingrediente_id` y en qué cantidad se necesita para una `receta_id`.
10. **`producto_receta`**: Opcional, para indicar qué `receta_id` se usa para fabricar un `producto_id`.

### Paso 5: Transacciones (Ventas)
El flujo de una venta.
11. **`ventas`**: La cabecera de una transacción. Se asocia a un `cliente_id` (o puede ser nulo).
12. **`venta_detalle`**: Las líneas de una venta. Cada línea conecta una `venta_id` con un `producto_id` y especifica la cantidad vendida. El sistema está preparado con un *trigger* para descontar automáticamente el stock del producto vendido.

### Paso 6: Tablas del Sistema
Relacionada con la autenticación.
13. **`refresh_tokens`**: Esta tabla es gestionada automáticamente por el sistema de autenticación para mantener la sesión del usuario activa. No requiere inserción manual.
