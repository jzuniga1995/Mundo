const fs   = require('fs');
const path = require('path');

const ROOT    = __dirname;
const OUT_DIR = path.join(ROOT, 'articulos');
const DOMAIN  = 'https://cronicascosmicas.com';

const JSON_FILES = [
  'data/universo.json',
  'data/tierra.json',
  'data/evolucion.json',
  'data/civilizaciones.json',
  'data/historia.json',
  'data/ciencia.json'
];

// ── Leer plantilla ────────────────────────────────────────────────────────────
const templatePath = path.join(ROOT, 'articulo.html');
if (!fs.existsSync(templatePath)) {
  console.error('❌ No se encontró articulo.html');
  process.exit(1);
}
const template = fs.readFileSync(templatePath, 'utf8');

// ── Crear carpeta de salida (recursive por si no existe el padre) ─────────────
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Contadores y colecciones ──────────────────────────────────────────────────
const startTime         = Date.now();
let   total             = 0;
let   errores           = 0;
const todosLosArticulos = [];
const slugsVistos       = new Set(); // MEJORA: detectar slugs duplicados

// ═════════════════════════════════════════════════════════════════════════════
//  GENERAR ARTÍCULOS
// ═════════════════════════════════════════════════════════════════════════════

for (const file of JSON_FILES) {
  const filePath = path.join(ROOT, file);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  No encontrado: ${file}`);
    continue;
  }

  let articulos = [];
  try {
    articulos = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`❌ Error leyendo ${file}:`, e.message);
    errores++;
    continue;
  }

  if (!Array.isArray(articulos)) {
    console.error(`❌ ${file} no contiene un array`);
    errores++;
    continue;
  }

  for (const a of articulos) {
    if (!a.slug) {
      console.warn(`⚠️  Sin slug en ${file} — artículo omitido`);
      continue;
    }

    // MEJORA: detectar slugs duplicados
    if (slugsVistos.has(a.slug)) {
      console.warn(`⚠️  Slug duplicado: "${a.slug}" (${file}) — artículo omitido`);
      continue;
    }
    slugsVistos.add(a.slug);
    todosLosArticulos.push(a);

    // ── Datos del artículo ──────────────────────────────────────────────────
    const slug      = a.slug;
    const tituloRaw = a.titulo    || '';
    const descRaw   = a.descripcion || '';
    const imagen    = a.imagen    || '';
    const fecha     = a.fecha     || new Date().toISOString().split('T')[0];
    const cat       = a.categoria || '';

    const titulo      = tituloRaw.replace(/"/g, '&quot;');
    const fullUrl     = `${DOMAIN}/articulos/${slug}`;
    const titleSeo    = `${tituloRaw} | Crónicas Cósmicas`;
    const descSeo     = descRaw.length > 150 ? descRaw.substring(0, 147) + '...' : descRaw;
    const descSeoEsc  = descSeo.replace(/"/g, '&quot;');

    const keywords  = [tituloRaw, cat, 'historia del universo', 'ciencia', 'enciclopedia español', 'cronicas cosmicas']
      .filter(Boolean).join(', ');

    const wordCount = (a.contenido || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
    const readTime  = Math.max(1, Math.ceil(wordCount / 200));

    // ── Schemas ─────────────────────────────────────────────────────────────
    const schemaArticle = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: tituloRaw,
      description: descRaw,
      image: { '@type': 'ImageObject', url: imagen, width: 1200, height: 630 },
      datePublished: fecha,
      dateModified: fecha,
      inLanguage: 'es',
      url: fullUrl,
      mainEntityOfPage: { '@type': 'WebPage', '@id': fullUrl },
      timeRequired: `PT${readTime}M`,
      wordCount,
      articleSection: cat,
      keywords: `${tituloRaw}, ${cat}, historia del universo`,
      author:    { '@type': 'Organization', name: 'Crónicas Cósmicas', url: DOMAIN },
      publisher: {
        '@type': 'Organization',
        name: 'Crónicas Cósmicas',
        url: DOMAIN,
        logo: { '@type': 'ImageObject', url: `${DOMAIN}/img/logo.png`, width: 600, height: 60 }
      }
    });

    const schemaBreadcrumb = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: DOMAIN },
        { '@type': 'ListItem', position: 2, name: cat,      item: `${DOMAIN}/#articulos` },
        { '@type': 'ListItem', position: 3, name: tituloRaw, item: fullUrl }
      ]
    });

    const schemaWebPage = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': fullUrl,
      url: fullUrl,
      name: titleSeo,
      description: descRaw,
      inLanguage: 'es',
      datePublished: fecha,
      dateModified: fecha,
      isPartOf: { '@type': 'WebSite', '@id': DOMAIN, name: 'Crónicas Cósmicas' }
    });

    // ── Bloque <head> SEO ────────────────────────────────────────────────────
    const seoHead = `
  <!-- Favicon -->
  <link rel="icon" href="/favicon_tierra.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon_tierra.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon_tierra.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/favicon_tierra.png">
  <meta name="description" content="${descSeoEsc}">
  <meta name="keywords" content="${keywords}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="author" content="Crónicas Cósmicas">
  <meta name="language" content="es">
  <meta name="revisit-after" content="7 days">
  <meta name="reading-time" content="${readTime} min">
  <link rel="canonical" href="${fullUrl}">
  <link rel="alternate" hreflang="es" href="${fullUrl}">
  <link rel="alternate" hreflang="x-default" href="${fullUrl}">
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Crónicas Cósmicas">
  <meta property="og:title" content="${titulo}">
  <meta property="og:description" content="${descSeoEsc}">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:image" content="${imagen}">
  <meta property="og:image:secure_url" content="${imagen}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${titulo}">
  <meta property="og:locale" content="es_ES">
  <meta property="article:published_time" content="${fecha}T00:00:00+00:00">
  <meta property="article:modified_time" content="${fecha}T00:00:00+00:00">
  <meta property="article:section" content="${cat}">
  <meta property="article:author" content="Crónicas Cósmicas">
  <meta property="article:tag" content="${cat}">
  <meta property="article:tag" content="historia del universo">
  <meta property="article:tag" content="ciencia">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@cronicascosmicas">
  <meta name="twitter:creator" content="@cronicascosmicas">
  <meta name="twitter:title" content="${titulo}">
  <meta name="twitter:description" content="${descSeoEsc}">
  <meta name="twitter:image" content="${imagen}">
  <meta name="twitter:image:alt" content="${titulo}">
  <meta name="twitter:label1" content="Tiempo de lectura">
  <meta name="twitter:data1" content="${readTime} min">
  <meta name="twitter:label2" content="Categoría">
  <meta name="twitter:data2" content="${cat}">
  <!-- Schema.org -->
  <script type="application/ld+json">${schemaArticle}<\/script>
  <script type="application/ld+json">${schemaBreadcrumb}<\/script>
  <script type="application/ld+json">${schemaWebPage}<\/script>
</head>`;

    // ── Transformar plantilla ────────────────────────────────────────────────
    let html = template
      // Head estático → head SEO
      .replace(/<title id="pageTitle">.*?<\/title>/, `<title>${titleSeo}</title>`)
      .replace(/<meta id="metaDesc"[^>]*>/,  '')
      .replace(/<meta id="ogTitle"[^>]*>/,   '')
      .replace(/<meta id="ogDesc"[^>]*>/,    '')
      .replace(/<meta id="ogImage"[^>]*>/,   '')
      .replace(/<meta property="og:type"[^>]*>/,   '')
      .replace(/<meta property="og:locale"[^>]*>/,  '')
      .replace(/<link rel="canonical"[^>]*>/, '')
      .replace('</head>', seoHead);

    // Rutas relativas → desde /articulos/
    html = html
      .replace(/href="css\//g,      'href="../css/')
      .replace(/src="css\//g,       'src="../css/')
      .replace(/'data\//g,          "'../data/")
      .replace(/href="index\.html"/g, 'href="../index.html"')
      .replace(/location\.href='index\.html'/g, "location.href='../index.html'");

    // Inyectar slug estático
    html = html
      .replace(
        "const slug = new URLSearchParams(window.location.search).get('slug');",
        `const slug = '${slug}';`
      )
      .replace("if (!slug) location.href = 'index.html';",     '')
      .replace("if (!slug) location.href = '../index.html';",   '');

    // Eliminar código JS que el SEO ya maneja estáticamente
    html = html
      .replace(/\/\/ Title\s*\n\s*document\.getElementById\('pageTitle'\)\.textContent[^;]+;/g, '')
      .replace(/\/\/ Meta description\s*\n\s*document\.getElementById\('metaDesc'\)\.content[^;]+;/g, '')
      .replace(/\/\/ Open Graph\s*\n\s*document\.getElementById\('ogTitle'\)\.content[^;]+;\s*\n\s*document\.getElementById\('ogDesc'\)\.content[^;]+;\s*\n\s*document\.getElementById\('ogImage'\)\.content[^;]+;/g, '')
      .replace(/\/\/ Canonical[^\n]*\n\s*document\.getElementById\('canonicalTag'\)\.href[^;]+;/g, '')
      .replace(/\/\/ Schema\.org Article[\s\S]*?document\.head\.appendChild\(s\);/g, '');

    // MEJORA: verificar que los reemplazos críticos ocurrieron
    if (html.includes("new URLSearchParams(window.location.search).get('slug')")) {
      console.warn(`⚠️  El slug no fue inyectado en: ${slug}.html — revisa la plantilla`);
    }

    // ── Escribir archivo ─────────────────────────────────────────────────────
    try {
      fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), html, 'utf8');
      total++;
      console.log(`✓  ${slug}.html  (${readTime} min, ${wordCount} palabras)`);
    } catch (e) {
      console.error(`❌ Error escribiendo ${slug}.html:`, e.message);
      errores++;
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  data/total.json  (para el contador del index.html sin cargar todos los JSON)
// ═════════════════════════════════════════════════════════════════════════════
try {
  fs.writeFileSync(
    path.join(ROOT, 'data', 'total.json'),
    JSON.stringify({ total: todosLosArticulos.length }),
    'utf8'
  );
  console.log(`\n✅ data/total.json → ${todosLosArticulos.length} artículos`);
} catch (e) {
  console.warn('⚠️  No se pudo escribir data/total.json:', e.message);
}

// ═════════════════════════════════════════════════════════════════════════════
//  SITEMAP
// ═════════════════════════════════════════════════════════════════════════════
const today = new Date().toISOString().split('T')[0];

const staticUrls = [
  { loc: `${DOMAIN}/`,                      lastmod: today, changefreq: 'daily',   priority: '1.0' },
  { loc: `${DOMAIN}/politica-privacidad.html`, lastmod: today, changefreq: 'yearly',  priority: '0.3' },
  { loc: `${DOMAIN}/terminos-de-uso.html`,  lastmod: today, changefreq: 'yearly',  priority: '0.3' },
  { loc: `${DOMAIN}/acerca-de.html`,        lastmod: today, changefreq: 'monthly', priority: '0.5' }
];

// Escapa los caracteres especiales XML
function xmlEscape(str) {
  return (str || '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function buildUrlTag({ loc, lastmod, changefreq, priority, imagen, tituloImg }) {
  let tag = `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>`;
  // Incluir imagen para indexación de Google Images
  if (imagen) {
    tag += `\n    <image:image>\n      <image:loc>${xmlEscape(imagen)}</image:loc>`;
    if (tituloImg) tag += `\n      <image:title>${xmlEscape(tituloImg)}</image:title>`;
    tag += `\n    </image:image>`;
  }
  tag += `\n  </url>`;
  return tag;
}

const sitemapUrls = [
  ...staticUrls.map(buildUrlTag),
  ...todosLosArticulos.map(a => buildUrlTag({
    loc:        `${DOMAIN}/articulos/${a.slug}`,
    lastmod:    a.fecha || today,
    changefreq: 'monthly',
    priority:   '0.8',
    imagen:     a.imagen   || '',
    tituloImg:  a.titulo   || ''
  }))
].join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemapUrls}
</urlset>`;

try {
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`✅ sitemap.xml → ${todosLosArticulos.length + staticUrls.length} URLs`);
} catch (e) {
  console.error('❌ Error escribiendo sitemap.xml:', e.message);
}

// ═════════════════════════════════════════════════════════════════════════════
//  ROBOTS.TXT
// ═════════════════════════════════════════════════════════════════════════════
const robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml\n`;

try {
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), robotsTxt, 'utf8');
  console.log(`✅ robots.txt generado`);
} catch (e) {
  console.error('❌ Error escribiendo robots.txt:', e.message);
}

// ═════════════════════════════════════════════════════════════════════════════
//  RESUMEN FINAL
// ═════════════════════════════════════════════════════════════════════════════
const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\n✅ ${total} artículos generados en /articulos/  (${elapsed}s)`);
if (errores > 0) console.log(`⚠️  ${errores} error(es) durante la generación`);
