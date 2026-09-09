# Florencia Carballo - Website con CMS

Este sitio web está configurado con Netlify CMS para que puedas editar el contenido sin tocar código.

## 🚀 Deployment en Netlify

1. Arrastra toda esta carpeta a https://app.netlify.com/drop
2. Una vez publicado, sigue la guía en `Guia_Setup_Netlify_CMS.docx`

## 📝 Cómo Editar Contenido

Una vez configurado, accede a `tudominio.netlify.app/admin` para:

- Agregar/editar/eliminar obras de arte
- Cambiar estados (Available → Sold)
- Actualizar precios y Stripe links
- Modificar información de contacto

## 🏗️ Estructura del Proyecto

```
├── admin/              # Panel de administración CMS
├── content/            # Contenido editable (obras, configuración)
├── imagenes/           # Imágenes de las obras
├── *.html              # Páginas del sitio
├── i18n.js             # Traducciones (EN/IT/ES)
├── build.js            # Script que genera la galería
└── netlify.toml        # Configuración de Netlify
```

## ⚙️ Build Process

Cuando hagas cambios en el CMS:
1. Netlify detecta el cambio automáticamente
2. Ejecuta `npm run build` (genera galeria.html desde los archivos .md)
3. Publica el sitio actualizado

No necesitas hacer nada manualmente — todo es automático.

## 📚 Documentación Completa

Ver `Guia_Setup_Netlify_CMS.docx` para instrucciones detalladas paso a paso.
