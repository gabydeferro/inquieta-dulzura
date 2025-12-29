# 📸 Configuración de Cloudinary para Inquieta Dulzura

## Paso 1: Crear cuenta en Cloudinary

1. Ve a [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Regístrate con tu email
3. Verifica tu cuenta

## Paso 2: Obtener credenciales

1. Una vez logueado, ve al **Dashboard**
2. Encontrarás tus credenciales:
   - **Cloud Name**: `dxxxxxxxx`
   - **API Key**: `123456789012345`
   - **API Secret**: `xxxxxxxxxxxxxxxxxxxxxx`

## Paso 3: Configurar variables de entorno

Agrega estas líneas a tu archivo `.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
CLOUDINARY_API_KEY=tu_api_key_aqui
CLOUDINARY_API_SECRET=tu_api_secret_aqui
CLOUDINARY_FOLDER=inquieta-dulzura/productos
```

## Paso 4: Actualizar schema SQL

Ejecuta esta migración para agregar el campo `cloudinary_public_id`:

```sql
ALTER TABLE fotos_productos 
ADD COLUMN cloudinary_public_id VARCHAR(255) NULL 
AFTER url_publica;
```

## Paso 5: Reiniciar servidor

```bash
npm run dev:server
```

## ✅ Verificación

Si todo está configurado correctamente, verás en la consola:
```
✅ Cloudinary configurado correctamente
```

Si no está configurado, verás:
```
⚠️  Cloudinary no está configurado. Las fotos se guardarán localmente.
```

## 🎯 Características implementadas

### Cloudinary (cuando está configurado):
- ✅ Subida automática a la nube
- ✅ Optimización automática de imágenes
- ✅ Conversión a WebP automática
- ✅ Redimensionamiento inteligente (máx 1200x1200)
- ✅ CDN global para carga rápida
- ✅ Eliminación automática al borrar foto

### Almacenamiento Local (fallback):
- ✅ Guarda en carpeta `uploads/productos/`
- ✅ Funciona sin configuración adicional
- ✅ Ideal para desarrollo local

## 📊 Límites del tier gratuito

- **Almacenamiento**: 25 GB
- **Bandwidth**: 25 GB/mes
- **Transformaciones**: 25,000/mes
- **Imágenes**: Ilimitadas

## 🔧 Transformaciones aplicadas

Cada imagen subida se procesa automáticamente:

1. **Redimensionamiento**: Máximo 1200x1200px (mantiene proporción)
2. **Calidad**: Optimización automática (auto:good)
3. **Formato**: Conversión automática a WebP si el navegador lo soporta
4. **Compresión**: Reducción de tamaño sin pérdida visible de calidad

## 🚀 URLs generadas

Ejemplo de URL de Cloudinary:
```
https://res.cloudinary.com/tu-cloud-name/image/upload/v1234567890/inquieta-dulzura/productos/abc123.jpg
```

Con transformaciones:
```
https://res.cloudinary.com/tu-cloud-name/image/upload/w_400,h_400,c_fill,q_auto,f_auto/inquieta-dulzura/productos/abc123.jpg
```

## 🔄 Migración de fotos existentes

Si ya tienes fotos locales y quieres migrarlas a Cloudinary:

```bash
# Crear script de migración (próximamente)
npm run migrate:cloudinary
```

## 🛠️ Troubleshooting

### Error: "Invalid API credentials"
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de no tener espacios extra

### Error: "Folder not found"
- El folder se crea automáticamente en la primera subida
- No necesitas crearlo manualmente en Cloudinary

### Las fotos no se suben
- Revisa la consola del servidor para ver errores
- Verifica que el archivo sea JPG, PNG, WebP o GIF
- Verifica que el tamaño sea menor a 5MB

## 📝 Notas importantes

1. **Desarrollo local**: Puedes trabajar sin Cloudinary, las fotos se guardarán localmente
2. **Producción**: Configura Cloudinary para mejor rendimiento y escalabilidad
3. **Backup**: Cloudinary mantiene tus imágenes seguras con backup automático
4. **CDN**: Las imágenes se sirven desde el servidor más cercano al usuario
