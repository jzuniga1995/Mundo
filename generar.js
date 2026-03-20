const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'articulos');
const DOMAIN = 'https://cronicascosmicas.com';

const JSON_FILES = [
  'data/universo.json',
  'data/tierra.json',
  'data/evolucion.json',
  'data/civilizaciones.json',
  'data/historia.json',
  'data/ciencia.json'
];

const template = fs.readFileSync(path.join(ROOT, 'articulo.html'), 'utf8');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

let total = 0;
let errores = 0;
const todosLosArticulos = [];

for (const file of JSON_FILES) {
  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) { console.warn(`⚠️ No encontrado: ${file}`); continue; }

  let articulos = [];
  try {
    articulos = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch(e) {
    console.error(`❌ Error leyendo ${file}:`, e.message);
    errores++;
    continue;
  }

  for (const a of articulos) {
    if (!a.slug) { console.warn(`⚠️ Sin slug en ${file}`); continue; }

    todosLosArticulos.push(a);

    const slug = a.slug;
    const titulo = (a.titulo || '').replace(/"/g, '&quot;');
    const desc = (a.descripcion || '').replace(/"/g, '&quot;');
    const imagen = a.imagen || '';
    const fecha = a.fecha || new Date().toISOString().split('T')[0];
    const cat = a.categoria || '';

    // ✅ FIX: URL sin .html para consistencia con el enrutamiento del sitio
    const fullUrl = `${DOMAIN}/articulos/${slug}`;

    const tituloRaw = (a.titulo || '');
    const titleSeo = `${tituloRaw} | Crónicas Cósmicas`;
    const descRaw = (a.descripcion || '');
    const descSeo = descRaw.length > 150 ? descRaw.substring(0, 147) + '...' : descRaw;
    const descSeoEsc = descSeo.replace(/"/g, '&quot;');

    const keywords = [tituloRaw, cat, 'historia del universo', 'ciencia', 'enciclopedia español', 'cronicas cosmicas']
      .filter(Boolean).join(', ');

    const wordCount = (a.contenido || '').replace(/<[^>]+>/g, '').split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const schemaArticle = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": tituloRaw,
      "description": descRaw,
      "image": { "@type": "ImageObject", "url": imagen, "width": 1200, "height": 630 },
      "datePublished": fecha,
      "dateModified": fecha,
      "inLanguage": "es",
      "url": fullUrl,
      "mainEntityOfPage": { "@type": "WebPage", "@id": fullUrl },
      "timeRequired": `PT${readTime}M`,
      "wordCount": wordCount,
      "articleSection": cat,
      "keywords": `${tituloRaw}, ${cat}, historia del universo`,
      "author": { "@type": "Organization", "name": "Crónicas Cósmicas", "url": DOMAIN },
      "publisher": {
        "@type": "Organization",
        "name": "Crónicas Cósmicas",
        "url": DOMAIN,
        "logo": { "@type": "ImageObject", "url": `${DOMAIN}/img/logo.png`, "width": 600, "height": 60 }
      }
    });

    const schemaBreadcrumb = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": DOMAIN },
        { "@type": "ListItem", "position": 2, "name": cat, "item": `${DOMAIN}/#articulos` },
        { "@type": "ListItem", "position": 3, "name": tituloRaw, "item": fullUrl }
      ]
    });

    const schemaWebPage = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": fullUrl,
      "url": fullUrl,
      "name": titleSeo,
      "description": descRaw,
      "inLanguage": "es",
      "datePublished": fecha,
      "dateModified": fecha,
      "isPartOf": { "@type": "WebSite", "@id": DOMAIN, "name": "Crónicas Cósmicas" }
    });

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
  <!-- Open Graph completo -->
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
  <!-- Schema.org Article -->
  <script type="application/ld+json">${schemaArticle}<\/script>
  <!-- Schema.org BreadcrumbList -->
  <script type="application/ld+json">${schemaBreadcrumb}<\/script>
  <!-- Schema.org WebPage -->
  <script type="application/ld+json">${schemaWebPage}<\/script>
</head>`;

    let html = template
      .replace(/<title id="pageTitle">.*?<\/title>/, `<title>${titleSeo}</title>`)
      .replace(/<meta id="metaDesc"[^>]*>/, '')
      .replace(/<meta id="ogTitle"[^>]*>/, '')
      .replace(/<meta id="ogDesc"[^>]*>/, '')
      .replace(/<meta id="ogImage"[^>]*>/, '')
      .replace(/<meta property="og:type"[^>]*>/, '')
      .replace(/<meta property="og:locale"[^>]*>/, '')
      .replace(/<link rel="canonical"[^>]*>/, '')
      .replace('</head>', seoHead);

    html = html
      .replace(/href="css\//g, 'href="../css/')
      .replace(/src="css\//g, 'src="../css/')
      .replace(/'data\//g, "'../data/")
      .replace(/href="index\.html"/g, 'href="../index.html"')
      .replace(/location\.href='index\.html'/g, "location.href='../index.html'");

    html = html
      .replace(
        "const slug = new URLSearchParams(window.location.search).get('slug');",
        `const slug = '${slug}';`
      )
      .replace("if (!slug) location.href = 'index.html';", "")
      .replace("if (!slug) location.href = '../index.html';", "");

    html = html
      .replace(/\/\/ Title\s*\n\s*document\.getElementById\('pageTitle'\)\.textContent[^;]+;/g, '')
      .replace(/\/\/ Meta description\s*\n\s*document\.getElementById\('metaDesc'\)\.content[^;]+;/g, '')
      .replace(/\/\/ Open Graph\s*\n\s*document\.getElementById\('ogTitle'\)\.content[^;]+;\s*\n\s*document\.getElementById\('ogDesc'\)\.content[^;]+;\s*\n\s*document\.getElementById\('ogImage'\)\.content[^;]+;/g, '')
      .replace(/\/\/ Canonical[^\n]*\n\s*document\.getElementById\('canonicalTag'\)\.href[^;]+;/g, '')
      .replace(/\/\/ Schema\.org Article[\s\S]*?document\.head\.appendChild\(s\);/g, '');

    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), html, 'utf8');
    total++;
    console.log(`✓ ${slug}.html`);
  }
}

// GENERAR sitemap.xml
const today = new Date().toISOString().split('T')[0];

let sitemapUrls = `  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${DOMAIN}/politica-privacidad.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${DOMAIN}/terminos-de-uso.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${DOMAIN}/acerca-de.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>\n`;

for (const a of todosLosArticulos) {
  const fecha = a.fecha || today;
  // ✅ FIX: URLs sin .html en el sitemap
  sitemapUrls += `  <url>
    <loc>${DOMAIN}/articulos/${a.slug}</loc>
    <lastmod>${fecha}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemapUrls}</urlset>`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
console.log(`\n✅ sitemap.xml generado con ${todosLosArticulos.length + 4} URLs`);

// ✅ FIX: robots.txt sin bloquear /data/
const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${DOMAIN}/sitemap.xml
`;

fs.writeFileSync(path.join(ROOT, 'robots.txt'), robotsTxt, 'utf8');
console.log(`✅ robots.txt generado`);

console.log(`\n✅ ${total} artículos generados en /articulos/`);
if (errores > 0) console.log(`⚠️ ${errores} archivos con errores`);
