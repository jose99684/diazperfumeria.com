DÍAZ PERFUMERÍA - CAMBIOS REALIZADOS
=====================================

Archivos principales modificados:
- index.html
- diazperfumeria/pagina.html
- diazperfumeria/assets/diaz-modern.css
- diazperfumeria/assets/diaz-modern.js

Qué se reajustó:
1. Portada / slider principal
   - Se dejó una portada tipo página principal, con header blanco, logo centrado, menú, buscador, usuario/WhatsApp y carrito.
   - El slider tiene 3 piezas: imagen principal, video principal y slide de envases.
   - Para cambiar la imagen principal busca en index.html o diazperfumeria/pagina.html:
     SECCIÓN: PORTADA / SLIDER PRINCIPAL
     Línea/parte: style="--hero-img:url('...')"

2. Video principal
   - Se mantuvo el video de la página principal en el slider y en la sección destacada de fondo.
   - Para reemplazarlo cambia el src del <source> dentro del segundo slide y dentro de la sección VIDEO PRINCIPAL DESTACADO.

3. Videos de experiencias
   - Se mantuvo la parte de tus videos locales:
     VIDEOS/experiencias_memorables/experiencias_1.mp4
     VIDEOS/experiencias_memorables/experiencias_2.mp4
     VIDEOS/experiencias_memorables/IMG_0258.MP4
     VIDEOS/experiencias_memorables/descarga.mp4
   - Para agregar más videos, copia un bloque <article class="video-card"> dentro de la sección VIDEOS DE EXPERIENCIAS.

4. Más secciones de la página principal
   - Más vendidos.
   - Test de personalidad.
   - Categorías.
   - Beneficios / diferencial.
   - Comparativa.
   - Contacto por WhatsApp.

5. Comentarios en el código
   - index.html y diazperfumeria/pagina.html tienen comentarios grandes antes de cada sección.
   - diaz-modern.css tiene un bloque al final llamado PERSONALIZACIÓN RÁPIDA con notas para colores, portada y beneficios.
   - diaz-modern.js tiene comentarios sobre slider, productos, videos y modal.

Dónde cambiar colores:
- Archivo: diazperfumeria/assets/diaz-modern.css
- Busca el bloque :root al inicio del archivo.
- Variables más importantes:
  --bg: fondo general
  --panel: paneles oscuros
  --gold: dorado principal
  --gold-soft: dorado suave
  --text: texto claro

Dónde cambiar productos destacados:
- index.html y diazperfumeria/pagina.html
- Busca: window.DIAZ_FEATURED_NAMES
- Cambia los nombres dentro del arreglo por productos que existan en diaz-data.js.

Dónde cambiar el número de WhatsApp:
- index.html, diazperfumeria/pagina.html y diazperfumeria/assets/diaz-modern.js
- Busca: 573145016713
- Reemplázalo por el nuevo número con código de país, sin + ni espacios.

============================================
ACTUALIZACIÓN V7 - PORTADA DINÁMICA API
============================================
Se cambió la portada principal para que las promociones se carguen desde Google Sheets / Google Drive, usando el código HTML que compartiste.

Archivos modificados:
- index.html
- diazperfumeria/pagina.html
- diazperfumeria/assets/diaz-modern.js
- diazperfumeria/assets/diaz-modern.css

Dónde cambiar la conexión:
1. Abre index.html o diazperfumeria/pagina.html.
2. Busca: window.DIAZ_PROMO_CONFIG.
3. Cambia SHEET_ID, API_KEY, SHEET_NAME o WHATSAPP_NUMBER.

Dónde cambiar las imágenes:
- Edita tu Google Sheet, pestaña PROMOCIONES.
- Usa una columna llamada Imagen, Foto, URL o Link.
- Puedes poner enlace de Google Drive, enlace directo https o ID de Drive.

Dónde cambiar colores y diseño:
- Abre diazperfumeria/assets/diaz-modern.css.
- Busca: PORTADA DINÁMICA - PROMOCIONES DESDE GOOGLE SHEETS.
- Ahí puedes cambiar altura, flechas, puntos, modal y colores.

Dónde cambiar la lógica API:
- Abre diazperfumeria/assets/diaz-modern.js.
- Busca: PORTADA / PROMOCIONES DINÁMICAS.
- Ahí está la carga desde Google Sheets, conversión de enlaces Drive, slider, modal, zoom y WhatsApp.

Nota importante:
La hoja de Google debe estar accesible para la API y las imágenes de Drive deben tener permisos de visualización adecuados; si la API falla, se muestran imágenes de respaldo.

============================================================
ACTUALIZACIÓN V8 - PORTADA CON CONEXIÓN EXACTA A PROMOCIONES
============================================================

Se reemplazó la portada por la estructura del código que compartiste:

  .promo-section
    .slider-container
      .slider-wrapper
        #slides-container
      #prevBtn / #nextBtn
      #dots-container

La portada se carga automáticamente desde Google Sheets / Google Drive usando:

  window.DIAZ_PROMO_CONFIG

Ese bloque está en:

  - index.html
  - diazperfumeria/pagina.html

Para cambiar la conexión:

  1. Abre index.html o diazperfumeria/pagina.html.
  2. Busca: PORTADA DINÁMICA / PROMOCIONES DESDE GOOGLE SHEETS.
  3. Cambia estos valores:
     - SHEET_ID
     - API_KEY
     - SHEET_NAME
     - WHATSAPP_NUMBER
     - AUTO_SLIDE_MS

La hoja debe tener una pestaña llamada PROMOCIONES, o el nombre que pongas en SHEET_NAME.
La columna de imágenes puede llamarse Imagen, Foto, URL, Link o Image.
Puedes pegar enlaces de Google Drive, enlaces directos https o IDs de Drive.

Para cambiar el estilo visual de la portada:

  Archivo:
  diazperfumeria/assets/diaz-modern.css

  Busca:
  PORTADA EXACTA TIPO REFERENCIA + CONEXIÓN GOOGLE SHEETS

  Ahí puedes modificar:
  - Altura: .promo-section .slider-container { height: 600px; }
  - Recorte de imagen: object-fit: cover;
    Si quieres ver la imagen completa, cambia cover por contain.
  - Posición: object-position: center center;
  - Flechas: .promo-section .nav-arrow
  - Puntos: .promo-section .dot
  - Modal: .image-modal
  - WhatsApp modal: .whatsapp-modal

Para modificar la lógica de conexión API:

  Archivo:
  diazperfumeria/assets/diaz-modern.js

  Busca:
  PORTADA / PROMOCIONES DINÁMICAS

Ahí están las funciones:
  - loadPromotions()
  - processUniversalImage()
  - renderPromotions()
  - openPromoModal()

También se corrigió el botón de WhatsApp del modal para conservar el ícono SVG, sin convertirlo en texto.

V9 - Ajuste responsive móvil para Experiencias
- La sección “Videos de experiencias” ahora se adapta mejor a celulares.
- En móvil cada video ocupa el ancho completo disponible para evitar cortes laterales y desbordes.
- Se corrigió el comportamiento del carrusel para avanzar por tarjeta completa con las flechas.
- Se mantuvo la navegación horizontal táctil con scroll snap.
- Se reforzó overflow-x:hidden para evitar desplazamiento lateral indeseado en pantallas pequeñas.
