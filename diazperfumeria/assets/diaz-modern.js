(()=>{
// Ruta base para imágenes y videos. Se respeta incluso cuando DIAZ_ROOT es cadena vacía en index.html.
const ROOT = (typeof window.DIAZ_ROOT === 'string') ? window.DIAZ_ROOT : '../';
const WA_PHONE = '573145016713';
const q=(s,c=document)=>c.querySelector(s), qa=(s,c=document)=>Array.from(c.querySelectorAll(s));
const money=n=>Number(n||0) ? '$ '+Number(n||0).toLocaleString('es-CO') : 'Consultar precio';
const safe=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const normalizeKey=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
function encodeLocal(path){return String(path).split('/').map(seg=>encodeURIComponent(seg)).join('/');}
function asset(path){
 path=String(path||'').trim();
 if(!path) path='envases_imagenes/envases_1.png';
 if(/^(https?:|data:|blob:)/i.test(path)) return path;
 path=path.replace(/^\.\//,'').replace(/^\//,'');
 return ROOT + encodeLocal(path);
}
function initMenu(){
 qa('[data-menu-open]').forEach(b=>b.addEventListener('click',()=>document.body.classList.add('menu-open')));
 qa('[data-menu-close]').forEach(b=>b.addEventListener('click',()=>document.body.classList.remove('menu-open')));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open','search-open'); closeModal();}});
}
function initSearch(){
 const input=q('[data-site-search]'), results=q('[data-search-results]');
 qa('[data-search-open]').forEach(b=>b.addEventListener('click',()=>{document.body.classList.add('search-open'); setTimeout(()=>input?.focus(),50);}));
 qa('[data-search-close]').forEach(b=>b.addEventListener('click',()=>document.body.classList.remove('search-open')));
 function render(){
  if(!input||!results) return; const term=input.value.trim().toLowerCase();
  if(!term){results.innerHTML='<p class="notice">Busca por perfume, marca o familia olfativa.</p>';return;}
  const items=(window.DIAZ_PRODUCTS||[]).filter(p=>(p.name+' '+(p.brand||'')+' '+(p.family||'')+' '+(p.category||'')).toLowerCase().includes(term)).slice(0,9);
  results.innerHTML=items.map(p=>`<button class="search-result" type="button" data-search-product="${safe(p.name)}"><img src="${safe(asset(p.image))}" alt=""><span><strong>${safe(p.name)}</strong><span>${safe(p.brand||p.category)} · ${money(minVariantPrice(p))}</span></span></button>`).join('') || '<p class="notice">No encontré resultados con esa búsqueda.</p>';
  qa('[data-search-product]',results).forEach(btn=>btn.addEventListener('click',()=>{const p=(window.DIAZ_PRODUCTS||[]).find(x=>x.name===btn.dataset.searchProduct);document.body.classList.remove('search-open');openProductModal(p,false);}));
 }
 input?.addEventListener('input',render); render();
}
// PORTADA / PROMOCIONES DINÁMICAS:
// Carga imágenes desde Google Sheets usando la configuración window.DIAZ_PROMO_CONFIG.
// Edita esa configuración en index.html o diazperfumeria/pagina.html para cambiar Sheet ID, API Key,
// pestaña, número de WhatsApp, tiempo de autoplay o imágenes de respaldo.
function initHero(){
 const hero=q('[data-promo-hero]');
 if(!hero) return;
 const cfg=Object.assign({
  SHEET_ID:'',
  API_KEY:'',
  SHEET_NAME:'PROMOCIONES',
  WHATSAPP_NUMBER:WA_PHONE,
  AUTO_SLIDE_MS:5000,
  FALLBACK_IMAGES:['cdn.shopify.com/s/files/1/0575/1622/8680/files/banner_gratis_decants_v2_1920X600-1003c02.jpg','envases_imagenes/envases_2.png']
 }, window.DIAZ_PROMO_CONFIG||{});
 const slidesBox=q('[data-promo-slides]',hero);
 const dotsBox=q('[data-promo-dots]',hero);
 const loading=q('[data-promo-loading]',hero);
 const prevBtn=q('[data-promo-prev]',hero);
 const nextBtn=q('[data-promo-next]',hero);
 const modal=q('#imageModal');
 const modalImg=q('#modalImage');
 const whatsappBtn=q('#whatsapp-modal');
 const zoomControls=q('#zoomControls');
 let promos=[];
 let currentIndex=0;
 let autoSlideInterval=null;
 let currentZoom=1;

 // Convierte enlaces de Google Drive, IDs de Drive, enlaces directos o data:image en una URL visible para <img>.
 function processUniversalImage(rawUrl){
  if(!rawUrl || String(rawUrl).trim()==='' || rawUrl==='undefined' || rawUrl==='null') return asset('envases_imagenes/envases_1.png');
  const url=String(rawUrl).trim();
  if(/^\d+$/.test(url) || url.length<10) return asset('envases_imagenes/envases_1.png');
  if(url.startsWith('data:image/')) return url;
  let fileId=null;
  let match=null;
  if(url.includes('/file/d/')){match=url.match(/\/file\/d\/([a-zA-Z0-9-_]{20,})/); if(match) fileId=match[1];}
  else if(url.includes('open?id=')){match=url.match(/open\?id=([a-zA-Z0-9-_]{20,})/); if(match) fileId=match[1];}
  else if(url.includes('drive.google.com/uc?')){match=url.match(/id=([a-zA-Z0-9-_]{20,})/); if(match) fileId=match[1]; else return url;}
  else if(/^[a-zA-Z0-9-_]{20,}$/.test(url)){fileId=url;}
  if(fileId && fileId.length>=20) return `https://lh3.googleusercontent.com/d/${fileId}=s0`;
  if(url.startsWith('http')) return url;
  return asset(url);
 }

 // Detecta columnas de la hoja aunque cambies el nombre a Imagen, Foto, URL, Link, Título, Texto, Botón, etc.
 function headerIndex(headers, names, fallback=-1){
  const normalized=headers.map(h=>normalizeKey(h));
  for(const name of names){
   const idx=normalized.findIndex(h=>h.includes(normalizeKey(name)));
   if(idx>=0) return idx;
  }
  return fallback;
 }

 function buildFallbackPromotions(){
  return (cfg.FALLBACK_IMAGES||[]).map((img,index)=>({
   image:processUniversalImage(img),
   originalUrl:img,
   title:`Promoción ${index+1}`,
   subtitle:'Díaz Perfumería',
   button:'Consultar por WhatsApp'
  }));
 }

 async function loadPromotions(){
  try{
   if(!cfg.SHEET_ID || !cfg.API_KEY) throw new Error('Falta SHEET_ID o API_KEY en DIAZ_PROMO_CONFIG');
   const url=`https://sheets.googleapis.com/v4/spreadsheets/${cfg.SHEET_ID}/values/${encodeURIComponent(cfg.SHEET_NAME)}?key=${cfg.API_KEY}`;
   const response=await fetch(url,{method:'GET',headers:{Accept:'application/json'},cache:'no-store'});
   if(!response.ok) throw new Error(`HTTP error ${response.status}`);
   const data=await response.json();
   if(!data.values || data.values.length<2) throw new Error('La hoja está vacía o no tiene filas de promociones');
   const headers=data.values[0].map(h=>String(h||''));
   const imageCol=headerIndex(headers,['imagen','image','foto','url','link'],0);
   const titleCol=headerIndex(headers,['titulo','título','nombre','promocion','promoción'],-1);
   const subtitleCol=headerIndex(headers,['subtitulo','subtítulo','descripcion','descripción','texto'],-1);
   const buttonCol=headerIndex(headers,['boton','botón','cta','llamado'],-1);
   const linkCol=headerIndex(headers,['destino','enlace','whatsapp','comprar'],-1);
   promos=data.values.slice(1).map((row,index)=>{
    const raw=row[imageCol] ? String(row[imageCol]).trim() : '';
    if(!raw) return null;
    return {
     image:processUniversalImage(raw),
     originalUrl:raw,
     title:titleCol>=0 && row[titleCol] ? String(row[titleCol]).trim() : `Promoción ${index+1}`,
     subtitle:subtitleCol>=0 && row[subtitleCol] ? String(row[subtitleCol]).trim() : '',
     button:buttonCol>=0 && row[buttonCol] ? String(row[buttonCol]).trim() : 'Consultar por WhatsApp',
     href:linkCol>=0 && row[linkCol] ? String(row[linkCol]).trim() : ''
    };
   }).filter(Boolean);
   if(!promos.length) throw new Error('No se encontraron imágenes válidas en la hoja');
   renderPromotions(promos);
  }catch(error){
   console.warn('No se pudieron cargar promociones desde Google Sheets. Se usan imágenes de respaldo.', error);
   promos=buildFallbackPromotions();
   renderPromotions(promos);
  }
 }

 function renderPromotions(items){
  if(!slidesBox) return;
  if(loading) loading.style.display='none';
  slidesBox.innerHTML=items.map((promo,index)=>`
   <article class="slide promo-slide ${index===0?'active':''}" data-index="${index}" tabindex="0" aria-label="Abrir ${safe(promo.title||'promoción')}">
    <img src="${safe(promo.image)}" alt="${safe(promo.title||'Promoción Díaz Perfumería')}" data-error-handled="false">
   </article>
  `).join('');
  if(dotsBox){
   dotsBox.innerHTML=items.map((_,index)=>`<button type="button" class="dot ${index===0?'active':''}" data-index="${index}" aria-label="Ver promoción ${index+1}"></button>`).join('');
  }
  qa('.slide',hero).forEach((slide,index)=>{
   const open=()=>openPromoModal(index);
   slide.addEventListener('click',open);
   slide.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
  qa('.slide img',hero).forEach(img=>img.addEventListener('error',function(){handleImageError(this);}));
  qa('.dot',hero).forEach(dot=>dot.addEventListener('click',()=>goToSlide(Number(dot.dataset.index)||0)));
  if(items.length<=1){prevBtn?.classList.add('hidden');nextBtn?.classList.add('hidden'); if(dotsBox) dotsBox.style.display='none';}
  updateSlide();
  startAutoSlide();
 }

 function updateSlide(){
  if(!slidesBox || !promos.length) return;
  slidesBox.style.transform=`translateX(-${currentIndex*100}%)`;
  qa('.dot',hero).forEach((dot,index)=>dot.classList.toggle('active',index===currentIndex));
  qa('.slide',hero).forEach((slide,index)=>slide.classList.toggle('active',index===currentIndex));
 }
 function nextSlide(){currentIndex=currentIndex<promos.length-1?currentIndex+1:0; updateSlide(); resetAutoSlide();}
 function previousSlide(){currentIndex=currentIndex>0?currentIndex-1:promos.length-1; updateSlide(); resetAutoSlide();}
 function goToSlide(index){currentIndex=Math.max(0,Math.min(index,promos.length-1)); updateSlide(); resetAutoSlide();}
 function startAutoSlide(){clearInterval(autoSlideInterval); if(promos.length>1) autoSlideInterval=setInterval(()=>nextSlide(), Number(cfg.AUTO_SLIDE_MS)||5000);}
 function resetAutoSlide(){startAutoSlide();}

 function handleImageError(img){
  if(img.dataset.errorHandled==='true') return;
  img.dataset.errorHandled='true';
  img.src=asset('envases_imagenes/envases_1.png');
  img.alt='Imagen de promoción no disponible';
 }

 function openPromoModal(index){
  if(!modal || !modalImg || !promos[index]) return;
  const promo=promos[index];
  modal.classList.add('active');
  modal.setAttribute('aria-hidden','false');
  modalImg.src=promo.image;
  modalImg.alt=promo.title||`Promoción ${index+1}`;
  currentZoom=1;
  modalImg.style.transform='scale(1)';
  modalImg.classList.remove('zoomed');
  if(whatsappBtn){
   const message=`Hola! Me interesa información sobre la promoción ${index+1}${promo.title?': '+promo.title:''}`;
   whatsappBtn.href=promo.href && promo.href.startsWith('http') ? promo.href : `https://wa.me/${cfg.WHATSAPP_NUMBER||WA_PHONE}?text=${encodeURIComponent(message)}`;
   // Si el botón tiene SVG (data-icon-only), conserva el icono de WhatsApp.
   // Si quieres un botón con texto, quita data-icon-only en el HTML.
   if(whatsappBtn.dataset.iconOnly!=='true') whatsappBtn.textContent=promo.button||'Consultar por WhatsApp';
   whatsappBtn.setAttribute('aria-label', promo.button||'Consultar por WhatsApp');
   whatsappBtn.classList.add('active');
  }
  zoomControls?.classList.add('active');
 }
 function closePromoModal(){
  if(!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden','true');
  whatsappBtn?.classList.remove('active');
  zoomControls?.classList.remove('active');
 }
 function zoomIn(){if(!modalImg) return; currentZoom=Math.min(currentZoom+.25,3); modalImg.style.transform=`scale(${currentZoom})`; modalImg.classList.toggle('zoomed',currentZoom>1);}
 function zoomOut(){if(!modalImg) return; currentZoom=Math.max(currentZoom-.25,.5); modalImg.style.transform=`scale(${currentZoom})`; modalImg.classList.toggle('zoomed',currentZoom>1);}
 function resetZoom(){if(!modalImg) return; currentZoom=1; modalImg.style.transform='scale(1)'; modalImg.classList.remove('zoomed');}

 prevBtn?.addEventListener('click',previousSlide);
 nextBtn?.addEventListener('click',nextSlide);
 hero.addEventListener('mouseenter',()=>clearInterval(autoSlideInterval));
 hero.addEventListener('mouseleave',startAutoSlide);
 q('#modalCloseBtn')?.addEventListener('click',closePromoModal);
 q('#modalCloseBtn')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();closePromoModal();}});
 q('#zoomInBtn')?.addEventListener('click',zoomIn);
 q('#zoomOutBtn')?.addEventListener('click',zoomOut);
 q('#resetZoomBtn')?.addEventListener('click',resetZoom);
 modal?.addEventListener('click',e=>{if(e.target===modal) closePromoModal();});
 document.addEventListener('keydown',e=>{
  if(modal?.classList.contains('active')){
   if(e.key==='Escape') closePromoModal();
   if(e.key==='+'||e.key==='=') zoomIn();
   if(e.key==='-') zoomOut();
   if(e.key==='0') resetZoom();
  }else{
   if(e.key==='ArrowLeft') previousSlide();
   if(e.key==='ArrowRight') nextSlide();
  }
 });
 loadPromotions();
}
function parseCSV(text){
 const rows=[]; let row=[], cur='', inQ=false;
 for(let i=0;i<text.length;i++){
  const c=text[i], n=text[i+1];
  if(c==='"'&&inQ&&n==='"'){cur+='"';i++;}
  else if(c==='"'){inQ=!inQ;}
  else if(c===','&&!inQ){row.push(cur);cur='';}
  else if((c==='\n'||c==='\r')&&!inQ){ if(cur||row.length){row.push(cur); rows.push(row); row=[]; cur='';} if(c==='\r'&&n==='\n') i++; }
  else cur+=c;
 }
 if(cur||row.length){row.push(cur); rows.push(row);} if(rows.length<2) return [];
 const headers=rows.shift().map(h=>h.trim());
 return rows.map(r=>{const o={}; headers.forEach((h,i)=>o[h]=String(r[i]||'').trim()); return normalizeProduct(o);}).filter(p=>p.name);
}
function pick(obj,names){
 for(const n of names){
  if(obj[n]) return obj[n];
  const target=normalizeKey(n);
  const key=Object.keys(obj).find(k=>normalizeKey(k)===target);
  if(key&&obj[key]) return obj[key];
 }
 return '';
}
function extractPrice(v){if(typeof v==='number') return v; const s=String(v||'').replace(/[^0-9]/g,''); return s?parseInt(s,10):0;}
function driveImage(url){
 url=String(url||'').trim(); if(!url) return '';
 if(/^data:image\//.test(url)) return url;
 let id=''; let m=url.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/); if(m) id=m[1];
 if(!id){m=url.match(/[?&]id=([a-zA-Z0-9_-]{20,})/); if(m) id=m[1];}
 if(!id && /^[a-zA-Z0-9_-]{20,}$/.test(url)) id=url;
 if(id) return `https://lh3.googleusercontent.com/d/${id}=s900`;
 return url;
}
function familyFor(text){
 text=String(text||'').toLowerCase();
 if(/oud|santal|sauvage|boss|le male|fahrenheit|invictus|cedro|madera|bleecker|ombre/.test(text)) return 'Amaderado';
 if(/rose|amor|girl|roma|carolina|paris|floral|jazm|sofia|olymp/.test(text)) return 'Floral';
 if(/blue|fresh|light|voyage|lacoste|aqua|happy|silver|mandarin|citr|bergamota/.test(text)) return 'Fresco';
 if(/yara|fantasy|coconut|vainilla|vanille|tonka|amber|khamrah|sweet|dulce|bombshell/.test(text)) return 'Dulce';
 if(/lattafa|armaf|afnan|haramain|arab/.test(text)) return 'Árabe';
 return 'Premium';
}
function variantPriceFrom(o, size, base){
 const explicit=extractPrice(pick(o,[`Precio ${size}ml`,`Precio ${size} ml`,`Precio ${size}ML`,`Precio ${size} ML`,`${size}ml`,`${size} ml`,`${size}ML`,`${size} ML`,`P${size}`,`Precio${size}`]));
 if(explicit) return explicit;
 if(size==='50') return base || 60000;
 if(size==='30') return base ? Math.round(base*0.64866/100)*100 : 60000;
 if(size==='100') return base ? Math.round(base*1.86486/100)*100 : 129900;
 return base || 0;
}
function variantImageFrom(o, size){
 const explicit=driveImage(pick(o,[`Imagen ${size}ml`,`Imagen ${size} ml`,`Imagen ${size}ML`,`Imagen ${size} ML`,`Foto ${size}ml`,`Envase ${size}ml`,`URL imagen ${size}ml`,`Link imagen ${size}ml`]));
 if(explicit) return explicit;
 if(size==='30') return 'envases_imagenes/envase_30ml_2.png';
 if(size==='50') return 'envases_imagenes/envase_50ml_2.png';
 if(size==='100') return 'envases_imagenes/envase_100ml.png';
 return 'envases_imagenes/envases_1.png';
}
function normalizeProduct(o){
 const name=pick(o,['Nombre','Producto','Perfume','name','Title','Fragancia']);
 const brand=pick(o,['Marca','Casa','Casa del perfume','brand']);
 const desc=pick(o,['Descripción','Descripcion','Detalle','Detalles','description','Notas','Acordes']);
 const image=driveImage(pick(o,['Imagen','Image','Foto','URL imagen','Link imagen','imagen','Url']));
 const base=extractPrice(pick(o,['Precio','Precio 50ml','Precio 50 ml','50ml','50ML','price']));
 const original=extractPrice(pick(o,['Original','Precio Original','Antes','Comparativo']));
 const category=pick(o,['Categoría','Categoria','Genero','Sexo objetivo','category']) || (window.DIAZ_COLLECTION?.label || 'Perfume');
 const family=pick(o,['Familia','Aroma','familia']) || familyFor(name+' '+brand+' '+desc);
 const notes={
  salida: pick(o,['Notas de Salida','Notas Salida','NotasSalida','Salida']),
  corazon: pick(o,['Notas de Corazón','Notas de Corazon','Notas Corazón','NotasCorazon','Corazón','Corazon']),
  fondo: pick(o,['Notas de Fondo','Notas Fondo','NotasFondo','Fondo'])
 };
 const variants=['30','50','100'].map(size=>({
  size:`${size}ML`, ml:size,
  price: variantPriceFrom(o,size,base),
  originalPrice: original ? (size==='50'?original:(size==='30'?Math.round(original*0.64866/100)*100:Math.round(original*1.86486/100)*100)) : 0,
  image: variantImageFrom(o,size)
 }));
 return {name,brand,description:desc||`Extracto de perfume de alta concentración con presencia elegante, buena fijación y una estela pensada para destacar.`,image,price:base||variants[0].price||60000,originalPrice:original,category,family,variants,notes};
}
function productsForCategory(label){return (window.DIAZ_PRODUCTS||[]).filter(p=>p.category===label);}
function homeProducts(){const names=window.DIAZ_FEATURED_NAMES||[]; let list=[]; names.forEach(n=>{const found=(window.DIAZ_PRODUCTS||[]).find(p=>p.name.toLowerCase().includes(n.toLowerCase())); if(found&&!list.includes(found)) list.push(found);}); if(list.length<9) list=list.concat((window.DIAZ_PRODUCTS||[]).filter(p=>!list.includes(p))).slice(0,9); return list.slice(0,9);}
function variantsFor(p){
 if(p?.variants?.length) return p.variants.map(v=>({...v, size:String(v.size||v.ml+'ML').toUpperCase(), ml:String(v.ml||String(v.size||'').replace(/\D/g,'')), price:Number(v.price||0), originalPrice:Number(v.originalPrice||0), image:v.image||p.image}));
 const base=p?.price||60000, original=p?.originalPrice||0;
 return [
  {size:'30ML', ml:'30', price:Math.round(base*0.64866/100)*100, originalPrice:original?Math.round(original*0.64866/100)*100:0, image:'envases_imagenes/envase_30ml_2.png'},
  {size:'50ML', ml:'50', price:base, originalPrice:original, image:'envases_imagenes/envase_50ml_2.png'},
  {size:'100ML', ml:'100', price:Math.round(base*1.86486/100)*100, originalPrice:original?Math.round(original*1.86486/100)*100:0, image:'envases_imagenes/envase_100ml.png'}
 ];
}
function minVariantPrice(p){const prices=variantsFor(p).map(v=>v.price).filter(Boolean); return prices.length?Math.min(...prices):(p?.price||60000);}
// TARJETA DE PRODUCTO: cambia aquí el texto del botón, badge o estructura de cada perfume.
function cardHTML(p,idx){const price=minVariantPrice(p); const original=p.originalPrice||Math.round(price*1.12/1000)*1000; return `<article class="product-card" data-product-index="${idx}" tabindex="0"><div class="product-media"><span class="product-badge">AHORRA 10%</span><img src="${safe(asset(p.image))}" alt="${safe(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='${safe(asset('envases_imagenes/envases_1.png'))}'"></div><div class="product-info"><h3 class="product-title">${safe(p.name)}</h3><div class="product-brand">${safe(p.brand||p.category||'Díaz Perfumería')}</div><div class="product-price">A partir de ${money(price)} ${original&&original>price?`<del>${money(original)}</del>`:''}</div><button class="select-button" type="button">Seleccionar opciones</button></div></article>`;}
function bindProductCards(products, scope=document){qa('[data-product-index]',scope).forEach(card=>{const open=()=>openProductModal(products[Number(card.dataset.productIndex)],true); card.addEventListener('click',open); card.addEventListener('keydown',e=>{if(e.key==='Enter') open();});});}
// LOS MÁS VENDIDOS: genera las tarjetas usando DIAZ_FEATURED_NAMES y los datos de diaz-data.js.
function initHomeProducts(){const track=q('[data-featured-products]'); if(!track) return; const products=homeProducts(); let page=0; const per=3; const pages=Math.max(1,Math.ceil(products.length/per)); track.innerHTML=products.map(cardHTML).join(''); bindProductCards(products,track); const status=q('[data-carousel-status]'); function update(){track.style.transform=`translateX(${-page*100}%)`; if(status) status.textContent=(page+1)+'/'+pages;} qa('[data-carousel-prev]').forEach(b=>b.addEventListener('click',()=>{page=(page-1+pages)%pages; update();})); qa('[data-carousel-next]').forEach(b=>b.addEventListener('click',()=>{page=(page+1)%pages; update();})); update();}
async function initCollection(){
 const cfg=window.DIAZ_COLLECTION; if(!cfg) return; const grid=q('[data-products-grid]'), count=q('[data-count]'), loader=q('[data-loader]'); let products=[];
 try{if(cfg.csvUrl){const res=await fetch(cfg.csvUrl,{cache:'no-store'}); if(!res.ok) throw new Error('CSV no disponible'); products=parseCSV(await res.text()).map(p=>({...p,category:cfg.label}));}}
 catch(e){products=[]; console.warn('No se pudo cargar la fuente compartida. Se usa respaldo local.',e);}
 if(!products.length) products=productsForCategory(cfg.label);
 if(!products.length && cfg.fallbackLabel) products=productsForCategory(cfg.fallbackLabel);
 let pager=q('[data-collection-pagination]');
 if(!pager&&grid){pager=document.createElement('div'); pager.className='collection-pagination'; pager.setAttribute('data-collection-pagination',''); grid.insertAdjacentElement('afterend',pager);}
 let state={products,search:'',family:'Todos',sort:'featured',page:1,perPage:18};
 function filteredList(){let list=state.products.filter(p=>{const txt=(p.name+' '+(p.brand||'')+' '+(p.family||'')+' '+(p.description||'')).toLowerCase(); return (!state.search||txt.includes(state.search))&&(state.family==='Todos'||p.family===state.family);}); if(state.sort==='az') list.sort((a,b)=>a.name.localeCompare(b.name)); if(state.sort==='price-asc') list.sort((a,b)=>minVariantPrice(a)-minVariantPrice(b)); if(state.sort==='price-desc') list.sort((a,b)=>minVariantPrice(b)-minVariantPrice(a)); return list;}
 function renderPagination(total){if(!pager) return; const pages=Math.max(1,Math.ceil(total/state.perPage)); if(state.page>pages) state.page=pages; if(pages<=1){pager.innerHTML='';return;} let html=''; for(let i=1;i<=pages;i++){html+=`<button type="button" class="${i===state.page?'active':''}" data-page="${i}">${i}</button>`;} html+=`<button type="button" class="next" data-page="${state.page<pages?state.page+1:pages}">Siguiente ›</button>`; pager.innerHTML=html; qa('[data-page]',pager).forEach(b=>b.addEventListener('click',()=>{state.page=Number(b.dataset.page)||1; render(); const top=q('.collection-toolbar')?.offsetTop || 0; window.scrollTo({top:top,behavior:'smooth'});}));}
 function render(){let list=filteredList(); const total=list.length; const pages=Math.max(1,Math.ceil(total/state.perPage)); if(state.page>pages) state.page=pages; const start=(state.page-1)*state.perPage; const shown=list.slice(start,start+state.perPage); grid.innerHTML=shown.map(cardHTML).join('') || `<div class="loader">No se encontraron perfumes con esos filtros.</div>`; if(count) count.textContent=`${total} productos · página ${state.page} de ${pages}`; bindProductCards(shown,grid); renderPagination(total); if(loader) loader.style.display='none';}
 q('[data-search]')?.addEventListener('input',e=>{state.search=e.target.value.toLowerCase().trim(); state.page=1; render();}); q('[data-sort]')?.addEventListener('change',e=>{state.sort=e.target.value; state.page=1; render();}); qa('[data-family]').forEach(c=>c.addEventListener('click',()=>{qa('[data-family]').forEach(x=>x.classList.remove('active')); c.classList.add('active'); state.family=c.dataset.family; state.page=1; render();})); q('[data-filter-toggle]')?.addEventListener('click',()=>q('[data-filter-panel]')?.classList.toggle('open')); render(); openProductFromHash(products);
}
function notesHTML(p){const n=p.notes||{}; const items=[['Notas de salida',n.salida],['Notas de corazón',n.corazon],['Notas de fondo',n.fondo]].filter(x=>x[1]); if(!items.length) return ''; return `<div class="notes-block">${items.map(([k,v])=>`<div><strong>${safe(k)}</strong><span>${safe(v)}</span></div>`).join('')}</div>`;}
function openProductModal(p, pushHash=false){
 if(!p) return; const modal=q('#productModal'); if(!modal) return;
 const variants=variantsFor(p).filter(v=>v.price); const selected=variants[0] || {size:'30ML',ml:'30',price:p.price||60000,image:p.image};
 const gallery=[p.image,...variants.map(v=>v.image)].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);
 const variantButtons=variants.map((v,i)=>`<button class="size-btn ${i===0?'active':''}" data-size-price="${v.price}" data-size-label="${safe(v.size)}" data-size-image="${safe(v.image)}" data-size-original="${v.originalPrice||0}">${safe(v.size)}<small>${money(v.price)}</small></button>`).join('');
 q('[data-modal-content]',modal).innerHTML=`<div class="product-detail"><div class="detail-gallery"><div class="detail-main"><img data-main-img src="${safe(asset(selected.image||p.image))}" alt="${safe(p.name)}"></div><div class="thumbs">${gallery.map((g,i)=>`<button class="thumb ${i===1?'active':''}" data-thumb="${safe(g)}" aria-label="Imagen ${i+1}"><img src="${safe(asset(g))}" alt=""></button>`).join('')}</div></div><div class="detail-info"><span class="eyebrow">Especialistas en extractos</span><h2>${safe(p.name)}</h2><p class="product-brand">${safe(p.brand||'Díaz Perfumería')} · Misma esencia a una fracción del precio</p><div class="review-line">★★★★★ <span>(1.355 Reviews)</span></div><div class="product-price" data-modal-price>${money(selected.price)} ${selected.originalPrice&&selected.originalPrice>selected.price?`<del>${money(selected.originalPrice)}</del>`:''}</div><p>${safe(p.description||'Fragancia de alta concentración para quienes buscan presencia elegante y duradera.')}</p><div class="pill-row"><span class="pill">+8 horas</span><span class="pill">Alta concentración</span><span class="pill">Compra asistida</span></div><h3>Elige el envase</h3><div class="size-options">${variantButtons}</div>${notesHTML(p)}<div class="modal-actions"><button class="add-cart" type="button" data-add-cart>AGREGAR AL CARRITO</button><a class="buy-now" target="_blank" rel="noopener" data-buy-now href="#">COMPRAR AHORA</a></div><div class="detail-list"><div>Al seleccionar 30ML, 50ML o 100ML cambia la imagen del envase y el precio correspondiente tomado de la fuente compartida cuando está disponible.</div><div>Compra asistida por WhatsApp para confirmar disponibilidad, envío y forma de pago.</div></div></div></div>`;
 function currentSelection(){const active=q('.size-btn.active',modal); return {label:active?.dataset.sizeLabel||selected.size, price:Number(active?.dataset.sizePrice||selected.price), original:Number(active?.dataset.sizeOriginal||0), image:active?.dataset.sizeImage||selected.image};}
 function refreshBuyLink(){const s=currentSelection(); const msg=`Hola, quiero comprar ${p.name}\nTamaño: ${s.label}\nPrecio: ${money(s.price)}\nEn Díaz Perfumería.`; q('[data-buy-now]',modal).href=`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;}
 modal.classList.add('open'); document.body.classList.add('modal-open'); modal.setAttribute('aria-hidden','false');
 qa('[data-thumb]',modal).forEach(b=>b.addEventListener('click',()=>{q('[data-main-img]',modal).src=asset(b.dataset.thumb); qa('[data-thumb]',modal).forEach(x=>x.classList.remove('active')); b.classList.add('active');}));
 qa('[data-size-price]',modal).forEach(b=>b.addEventListener('click',()=>{qa('[data-size-price]',modal).forEach(x=>x.classList.remove('active')); b.classList.add('active'); q('[data-main-img]',modal).src=asset(b.dataset.sizeImage); q('[data-modal-price]',modal).innerHTML=`${money(b.dataset.sizePrice)} ${Number(b.dataset.sizeOriginal)>Number(b.dataset.sizePrice)?`<del>${money(b.dataset.sizeOriginal)}</del>`:''}`; qa('[data-thumb]',modal).forEach(t=>t.classList.toggle('active',t.dataset.thumb===b.dataset.sizeImage)); refreshBuyLink();}));
 q('[data-add-cart]',modal)?.addEventListener('click',()=>{const s=currentSelection(); addCartItem({id:`${p.name}_${s.label}`, name:p.name, brand:p.brand||'', size:s.label, price:s.price, image:s.image, qty:1}); showToast(`${p.name} ${s.label} agregado al carrito`);});
 refreshBuyLink();
 if(pushHash){try{history.replaceState(null,'','#'+encodeURIComponent(p.name));}catch(e){}}
}
function closeModal(){const modal=q('#productModal'); if(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');}}
function initModal(){const modal=q('#productModal'); if(!modal) return; q('[data-modal-close]',modal)?.addEventListener('click',closeModal); q('.modal-backdrop',modal)?.addEventListener('click',closeModal);}
function openProductFromHash(products){
 const raw=decodeURIComponent((location.hash||'').replace(/^#/, '')).trim().toLowerCase(); if(!raw) return;
 const found=products.find(p=>p.name.toLowerCase()===raw) || products.find(p=>p.name.toLowerCase().includes(raw));
 if(found) setTimeout(()=>openProductModal(found,false),250);
}
function initVideoFallback(){qa('[data-video-fallback]').forEach(v=>v.addEventListener('error',()=>{v.closest('.video-card')?.classList.add('video-error')}));}
// VIDEOS DE EXPERIENCIAS: permite flechas, arrastre horizontal y scroll con rueda del mouse.
function initExperienceSlider(){qa('[data-video-slider]').forEach(slider=>{const track=q('[data-video-track]',slider); if(!track) return; const amount=()=>{const card=q('.video-card',track); if(card){const styles=getComputedStyle(track); const gap=parseFloat(styles.columnGap||styles.gap||'0')||0; return Math.max(240,Math.round(card.getBoundingClientRect().width+gap));} return Math.max(260,Math.round(track.clientWidth*.86));}; qa('[data-video-prev]',slider).forEach(b=>b.addEventListener('click',()=>track.scrollBy({left:-amount(),behavior:'smooth'}))); qa('[data-video-next]',slider).forEach(b=>b.addEventListener('click',()=>track.scrollBy({left:amount(),behavior:'smooth'}))); track.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault(); track.scrollBy({left:e.deltaY,behavior:'smooth'});}}, {passive:false}); let down=false,startX=0,startLeft=0; track.addEventListener('pointerdown',e=>{down=true;startX=e.clientX;startLeft=track.scrollLeft;track.setPointerCapture?.(e.pointerId);}); track.addEventListener('pointermove',e=>{if(!down)return; track.scrollLeft=startLeft-(e.clientX-startX);}); ['pointerup','pointercancel','pointerleave'].forEach(ev=>track.addEventListener(ev,()=>down=false));});}
function readCart(){try{const raw=JSON.parse(localStorage.getItem('diazCart')||localStorage.getItem('cart')||'[]')||[];return raw.map(i=>({id:i.id||`${i.nombre||i.name}_${i.tamaño||i.size||'30ML'}`,name:i.name||i.nombre||'Perfume Díaz',brand:i.brand||'',size:i.size||i.tamaño||'30ML',price:Number(i.price||i.precio||0),image:i.image||i.imagen||'envases_imagenes/envases_1.png',qty:Number(i.qty||i.cantidad||1)}));}catch(e){return []}}
function writeCart(cart){localStorage.setItem('diazCart',JSON.stringify(cart)); updateCartBadge();}
function addCartItem(item){let cart=readCart(); const existing=cart.find(x=>x.id===item.id); if(existing) existing.qty=(existing.qty||1)+(item.qty||1); else cart.push(item); writeCart(cart); renderCartPage(); renderCartDrawer();}
function updateCartBadge(){const count=readCart().reduce((s,i)=>s+Number(i.qty||1),0); qa('a[aria-label="Carrito"], a[href$="cart.html"], [data-cart-drawer-open]').forEach(a=>{let b=q('.cart-count-badge',a); if(!b){b=document.createElement('span'); b.className='cart-count-badge'; a.appendChild(b);} b.textContent=count; b.style.display=count?'grid':'none';});}
function showToast(text){let t=q('.diaz-toast'); if(!t){t=document.createElement('div'); t.className='diaz-toast'; document.body.appendChild(t);} t.textContent=text; t.classList.add('show'); clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),2400);}
function cartWhatsAppUrl(){const cart=readCart(); let msg='Hola, quiero finalizar la compra de estos productos:\n\n'; let total=0; cart.forEach(i=>{const lineTotal=Number(i.price||0)*Number(i.qty||1); total+=lineTotal; msg+=`• ${i.name} (${i.size}) x${i.qty||1}: ${money(lineTotal)}\n`;}); msg+=`\nTotal: ${money(total)}\n\n¿Me confirmas disponibilidad y envío?`; return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;}

function ensureCartDrawer(){
 if(!q('[data-cart-drawer-open]')){
  const btn=document.createElement('button');
  btn.type='button'; btn.className='cart-float'; btn.setAttribute('data-cart-drawer-open',''); btn.setAttribute('aria-label','Abrir carrito de compras');
  btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h15l-2 9H8L6 3H3"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg><span class="cart-count-badge" style="display:none"></span>';
  document.body.appendChild(btn);
 }
 if(!q('[data-cart-drawer]')){
  const overlay=document.createElement('div'); overlay.className='cart-overlay'; overlay.setAttribute('data-cart-drawer-close','');
  const drawer=document.createElement('aside'); drawer.className='cart-drawer'; drawer.setAttribute('data-cart-drawer',''); drawer.setAttribute('aria-label','Carrito de compras');
  drawer.innerHTML='<div class="cart-drawer-head"><h2>Carrito</h2><button class="cart-drawer-close" type="button" data-cart-drawer-close aria-label="Cerrar carrito"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg></button></div><div class="cart-drawer-body" data-cart-drawer-body></div><div class="cart-drawer-foot" data-cart-drawer-foot></div>';
  document.body.appendChild(overlay); document.body.appendChild(drawer);
 }
}
function shopCollectionHref(){return window.DIAZ_COLLECTION ? 'hombres2.html' : (location.pathname.includes('/diazperfumeria/') ? 'collections/hombres2.html' : 'diazperfumeria/collections/hombres2.html');}
function openCartDrawer(){ensureCartDrawer(); renderCartDrawer(); q('[data-cart-drawer]')?.classList.add('open'); q('.cart-overlay')?.classList.add('open');}
function closeCartDrawer(){q('[data-cart-drawer]')?.classList.remove('open'); q('.cart-overlay')?.classList.remove('open');}
function renderCartDrawer(){
 const body=q('[data-cart-drawer-body]'), foot=q('[data-cart-drawer-foot]'); if(!body||!foot) return;
 const cart=readCart(); let total=0;
 if(!cart.length){body.innerHTML='<div class="cart-drawer-empty"><div><h3>Tu carrito está vacío</h3><p>Selecciona un perfume, elige el envase y agrégalo al carrito.</p></div></div>'; foot.innerHTML='<a class="btn btn-white" href="'+shopCollectionHref()+'">Ver perfumes</a>'; return;}
 body.innerHTML='<div class="cart-drawer-list">'+cart.map((i,idx)=>{const line=Number(i.price||0)*Number(i.qty||1); total+=line; return `<article class="cart-drawer-row"><img src="${safe(asset(i.image))}" alt="${safe(i.name)}"><div><h3>${safe(i.name)}</h3><p>${safe(i.brand||'Díaz Perfumería')} · ${safe(i.size)}</p><strong>${money(line)}</strong><div class="cart-drawer-row-actions"><button type="button" data-drawer-minus="${idx}">−</button><span>${i.qty||1}</span><button type="button" data-drawer-plus="${idx}">+</button><button type="button" class="drawer-remove" data-drawer-remove="${idx}">Eliminar</button></div></div></article>`}).join('')+'</div>';
 foot.innerHTML='<div class="cart-drawer-total"><span>Total</span><strong>'+money(total)+'</strong></div><a class="btn btn-white" target="_blank" rel="noopener" href="'+cartWhatsAppUrl()+'">Finalizar compra por WhatsApp</a><button class="btn btn-outline" type="button" data-drawer-clear>Vaciar carrito</button>';
 qa('[data-drawer-plus]',body).forEach(b=>b.addEventListener('click',()=>{let c=readCart(); const idx=Number(b.dataset.drawerPlus); c[idx].qty=(c[idx].qty||1)+1; writeCart(c); renderCartPage(); renderCartDrawer();}));
 qa('[data-drawer-minus]',body).forEach(b=>b.addEventListener('click',()=>{let c=readCart(); const idx=Number(b.dataset.drawerMinus); c[idx].qty=(c[idx].qty||1)-1; if(c[idx].qty<=0)c.splice(idx,1); writeCart(c); renderCartPage(); renderCartDrawer();}));
 qa('[data-drawer-remove]',body).forEach(b=>b.addEventListener('click',()=>{let c=readCart(); c.splice(Number(b.dataset.drawerRemove),1); writeCart(c); renderCartPage(); renderCartDrawer();}));
 q('[data-drawer-clear]',foot)?.addEventListener('click',()=>{writeCart([]); renderCartPage(); renderCartDrawer();});
}
function initFloatingCart(){
 ensureCartDrawer(); renderCartDrawer(); updateCartBadge();
 qa('a[aria-label="Carrito"], a[href$="cart.html"], [data-cart-drawer-open]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault(); openCartDrawer();}));
 qa('[data-cart-drawer-close]').forEach(el=>el.addEventListener('click',closeCartDrawer));
 document.addEventListener('keydown',e=>{if(e.key==='Escape') closeCartDrawer();});
}

function renderCartPage(){const box=q('[data-cart-page]'); if(!box) return; const cart=readCart(); if(!cart.length){box.innerHTML=`<div class="cart-empty"><h2>Tu carrito está vacío</h2><p>Abre una categoría, selecciona un perfume y elige el envase para agregarlo aquí.</p><a class="btn btn-white" href="pagina.html#mas-vendidos">Ver perfumes</a></div>`; return;} let total=0; box.innerHTML=`<div class="cart-list">${cart.map((i,idx)=>{const line=Number(i.price||0)*Number(i.qty||1); total+=line; return `<article class="cart-row"><img src="${safe(asset(i.image))}" alt="${safe(i.name)}"><div><h3>${safe(i.name)}</h3><p>${safe(i.brand||'Díaz Perfumería')} · ${safe(i.size)}</p><strong>${money(i.price)}</strong></div><div class="cart-qty"><button data-cart-minus="${idx}">−</button><span>${i.qty||1}</span><button data-cart-plus="${idx}">+</button></div><button class="cart-remove" data-cart-remove="${idx}">Eliminar</button></article>`}).join('')}</div><div class="cart-summary"><span>Total</span><strong>${money(total)}</strong><a class="btn btn-white" target="_blank" rel="noopener" href="${cartWhatsAppUrl()}">Finalizar compra por WhatsApp</a><button class="btn btn-outline" type="button" data-cart-clear>Vaciar carrito</button></div>`;
 qa('[data-cart-plus]',box).forEach(b=>b.addEventListener('click',()=>{let c=readCart(); c[Number(b.dataset.cartPlus)].qty=(c[Number(b.dataset.cartPlus)].qty||1)+1; writeCart(c); renderCartPage();}));
 qa('[data-cart-minus]',box).forEach(b=>b.addEventListener('click',()=>{let c=readCart(); const i=Number(b.dataset.cartMinus); c[i].qty=(c[i].qty||1)-1; if(c[i].qty<=0)c.splice(i,1); writeCart(c); renderCartPage();}));
 qa('[data-cart-remove]',box).forEach(b=>b.addEventListener('click',()=>{let c=readCart(); c.splice(Number(b.dataset.cartRemove),1); writeCart(c); renderCartPage();}));
 q('[data-cart-clear]',box)?.addEventListener('click',()=>{writeCart([]); renderCartPage();});
}
function initCart(){initFloatingCart(); updateCartBadge(); renderCartPage(); renderCartDrawer(); window.addEventListener('storage',()=>{updateCartBadge(); renderCartPage(); renderCartDrawer();});}
document.addEventListener('DOMContentLoaded',()=>{initMenu();initSearch();initHero();initHomeProducts();initCollection();initModal();initVideoFallback();initExperienceSlider();initCart();});
})();
