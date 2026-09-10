const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');

// Read all artwork files
const artworksDir = path.join(__dirname, 'content/artworks');
const artworkFiles = fs.readdirSync(artworksDir).filter(f => f.endsWith('.md'));

// Parse artworks
const artworks = artworkFiles.map(file => {
  const content = fs.readFileSync(path.join(artworksDir, file), 'utf8');
  const { data } = matter(content);
  return data;
}).sort((a, b) => (a.order || 999) - (b.order || 999));

// Read contact settings
const contactFile = path.join(__dirname, 'content/pages/contact.yml');
const contactData = yaml.load(fs.readFileSync(contactFile, 'utf8'));

// Read homepage image settings
const homepageFile = path.join(__dirname, 'content/pages/homepage.yml');
const homepageData = fs.existsSync(homepageFile)
  ? yaml.load(fs.readFileSync(homepageFile, 'utf8'))
  : {};

// Read SEO settings
const seoFile = path.join(__dirname, 'content/pages/seo.yml');
const seoData = fs.existsSync(seoFile) ? yaml.load(fs.readFileSync(seoFile, 'utf8')) : {};

// Read testimonials
const testimonialsFile = path.join(__dirname, 'content/pages/testimonials.yml');
const testimonialsData = fs.existsSync(testimonialsFile)
  ? (yaml.load(fs.readFileSync(testimonialsFile, 'utf8')) || {})
  : {};
const testimonials = testimonialsData.items || [];

// Read Gallery page image settings
const galleryImagesFile = path.join(__dirname, 'content/pages/gallery.yml');
const galleryImagesData = fs.existsSync(galleryImagesFile)
  ? yaml.load(fs.readFileSync(galleryImagesFile, 'utf8'))
  : {};

// Strip any leading "imagenes/" or "/imagenes/" the CMS media widget may have stored,
// since templates already write src="imagenes/{{TOKEN}}"
function cleanImagePath(value, fallback) {
  if (!value) return fallback;
  return String(value).replace(/^\/?imagenes\//, '');
}

// Fill a template file (with {{TOKEN}} placeholders) and write the result
function buildPageFromTemplate(templateFile, outputFile, tokens) {
  const templatePath = path.join(__dirname, templateFile);
  if (!fs.existsSync(templatePath)) {
    console.log(`⚠️  Template not found, skipping: ${templateFile}`);
    return;
  }
  let html = fs.readFileSync(templatePath, 'utf8');
  Object.entries(tokens).forEach(([token, value]) => {
    html = html.split(`{{${token}}}`).join(value);
  });
  fs.writeFileSync(path.join(__dirname, outputFile), html);
  console.log(`✅ Generated ${outputFile}`);
}

// Contact info shared across every page's footer (and the Connect sidebar on Contact page)
const sharedContactTokens = {
  CONTACT_LOCATION: contactData.location || 'Madrid, Spain',
  CONTACT_EMAIL: contactData.email || 'studio@florenciacarballo.com',
};

// Formspree ID and Instagram link only matter on the Contact page
const contactPageTokens = {
  FORMSPREE_ID: contactData.formspree_id || 'YOUR_FORM_ID',
  SOCIAL_LINKS_HTML: buildSocialLinksHtml(contactData),
};

function buildSocialLinksHtml(data) {
  const links = [
    { key: 'instagram', icon: 'photo_camera', label: 'Instagram' },
    { key: 'facebook', icon: 'thumb_up', label: 'Facebook' },
    { key: 'whatsapp', icon: 'chat', label: 'WhatsApp' },
    { key: 'pinterest', icon: 'push_pin', label: 'Pinterest' },
  ];
  return links
    .filter(l => data[l.key])
    .map(l => `<div class="flex items-center gap-4">
            <span class="material-symbols-outlined text-primary">${l.icon}</span>
            <a href="${data[l.key]}" target="_blank" rel="noopener" class="hover:text-primary transition-colors">${l.label}</a>
          </div>`)
    .join('\n          ');
}

// Build index.html from index-template.html + homepage.yml
buildPageFromTemplate('index-template.html', 'index.html', {
  HERO_BACKGROUND: cleanImagePath(homepageData.hero_background, 'obra-hero.jpg'),
  INSET_PHOTO: cleanImagePath(homepageData.inset_photo, 'detalle-obra.jpg'),
  GASTRO_PHOTO: cleanImagePath(homepageData.gastro_photo, 'restaurante.jpg'),
  COLOR_PHOTO: cleanImagePath(homepageData.color_photo, 'estudio-color.jpg'),
  CORPORATE_PHOTO: cleanImagePath(homepageData.corporate_photo, 'proyecto-comercial.jpg'),
  SEO_TITLE: seoData.home_title || 'Florencia Carballo — Art & Advisory',
  SEO_DESCRIPTION: seoData.home_description || '',
  ...sharedContactTokens,
});

// Read studio image settings
const studioFile = path.join(__dirname, 'content/pages/studio.yml');
const studioData = fs.existsSync(studioFile)
  ? yaml.load(fs.readFileSync(studioFile, 'utf8'))
  : {};

// Build contacto.html from contacto-template.html + contact.yml
buildPageFromTemplate('contacto-template.html', 'contacto.html', {
  CONTACT_HERO_PHOTO: cleanImagePath(contactData.hero_photo, 'contacto-hero.jpg'),
  CONTACT_COMMERCIAL_PHOTO: cleanImagePath(contactData.commercial_photo, 'espacio-comercial.jpg'),
  SEO_TITLE: seoData.contact_title || 'Contact — Florencia Carballo',
  SEO_DESCRIPTION: seoData.contact_description || '',
  ...sharedContactTokens,
  ...contactPageTokens,
});

// ---- Testimonials section (Studio page) ----
function generateTestimonialsSection(items) {
  if (!items || items.length === 0) return '';
  const cards = items.map((t, i) => `
        <div class="bg-surface-container-low rounded-2xl p-8 flex flex-col gap-4">
          <span class="material-symbols-outlined text-primary/40" style="font-size:32px">format_quote</span>
          <p class="font-body text-on-surface-variant italic flex-1" data-i18n="testimonial.${i + 1}.quote">${t.quote_en || ''}</p>
          <div>
            <p class="font-label font-bold text-sm text-on-surface">${t.author || ''}</p>
            ${t.role ? `<p class="font-label text-xs text-outline uppercase tracking-widest">${t.role}</p>` : ''}
          </div>
        </div>`).join('\n');

  return `<section class="py-24 px-8 md:px-24 bg-surface-container-low">
    <div class="max-w-6xl mx-auto space-y-12">
      <h2 class="text-4xl serif-headline italic text-center">What clients say</h2>
      <div class="grid grid-cols-1 md:grid-cols-${Math.min(items.length, 3)} gap-6">${cards}
      </div>
    </div>
  </section>`;
}
const testimonialsSectionHtml = generateTestimonialsSection(testimonials);
// ---- end testimonials section ----

// ---- i18n.js generation (text content editable from /admin) ----
const i18nManifestFile = path.join(__dirname, 'i18n-manifest.json');
const i18nManifest = JSON.parse(fs.readFileSync(i18nManifestFile, 'utf8'));
const LANGS = ['en', 'it', 'es'];

// Start with empty dictionaries per language
const dict = { en: {}, it: {}, es: {} };

// Fill from each text-<section>.yml using the manifest (sanitized field -> original dotted key)
Object.entries(i18nManifest).forEach(([section, items]) => {
  const sectionFile = path.join(__dirname, `content/pages/text-${section}.yml`);
  if (!fs.existsSync(sectionFile)) return;
  const sectionData = yaml.load(fs.readFileSync(sectionFile, 'utf8')) || {};
  items.forEach(({ key, field }) => {
    const entry = sectionData[field];
    if (!entry) return;
    LANGS.forEach(lang => {
      if (entry[lang] !== undefined) dict[lang][key] = entry[lang];
    });
  });
});

// Fill art.N.title / art.N.medium directly from artworks (keeps language switch in sync
// with whatever is set in Gallery Artworks, instead of separate hardcoded text)
artworks.forEach((artwork, index) => {
  const n = index + 1;
  LANGS.forEach(lang => {
    const titleKey = `title_${lang}`;
    const mediumKey = `medium_${lang}`;
    dict[lang][`art.${n}.title`] = artwork[titleKey] || artwork.title_en || '';
    dict[lang][`art.${n}.medium`] = `${artwork[mediumKey] || artwork.medium_en || ''} · ${artwork.year || ''}`;
    dict[lang][`art.${n}.description`] = artwork[`description_${lang}`] || artwork.description_en || '';
  });
});

// Fill testimonial.N.quote from Client Testimonials
testimonials.forEach((t, index) => {
  const n = index + 1;
  LANGS.forEach(lang => {
    dict[lang][`testimonial.${n}.quote`] = t[`quote_${lang}`] || t.quote_en || '';
  });
});

const runtimeJs = fs.readFileSync(path.join(__dirname, 'i18n-runtime.js'), 'utf8');
const i18nHeader = `// i18n.js — Florencia Carballo Website\n// AUTO-GENERATED on every build from content/pages/text-*.yml + Gallery Artworks.\n// Do not edit this file directly — edit the text from /admin instead.\n\nconst FC = {};\n\nFC.T = ${JSON.stringify(dict, null, 2)};\n\nFC.LANG = 'en';\n\n`;
fs.writeFileSync(path.join(__dirname, 'i18n.js'), i18nHeader + runtimeJs);
console.log('✅ Generated i18n.js from CMS text content (' + LANGS.map(l => Object.keys(dict[l]).length + ' ' + l).join(', ') + ' keys)');
// ---- end i18n.js generation ----


buildPageFromTemplate('sobre-mi-template.html', 'sobre-mi.html', {
  STUDIO_PORTRAIT: cleanImagePath(studioData.portrait, 'florencia-foto.jpg'),
  STUDIO_PROCESS_1: cleanImagePath(studioData.process_1, 'proceso-1.jpg'),
  STUDIO_PROCESS_2: cleanImagePath(studioData.process_2, 'proceso-2.jpg'),
  STUDIO_GASTRO: cleanImagePath(studioData.gastro_photo, 'gastronomia.jpg'),
  SEO_TITLE: seoData.studio_title || 'Studio — Florencia Carballo',
  SEO_DESCRIPTION: seoData.studio_description || '',
  TESTIMONIALS_SECTION: testimonialsSectionHtml,
  ...sharedContactTokens,
});

// Function to generate artwork card HTML
function generateArtworkCard(artwork, index) {
  const statusBadges = {
    available: { 
      bg: 'tertiary-container',
      text: 'on-tertiary-container', 
      label_en: 'Available',
      label_it: 'Disponibile',
      label_es: 'Disponible'
    },
    sold: { 
      bg: 'secondary-container',
      text: 'on-secondary-container',
      label_en: 'Sold',
      label_it: 'Venduto',
      label_es: 'Vendido'
    },
    commission: {
      bg: 'primary-container',
      text: 'on-primary-container',
      label_en: 'Commission Only',
      label_it: 'Solo Commissione',
      label_es: 'Solo Comisión'
    }
  };

  const badge = statusBadges[artwork.status] || statusBadges.available;
  const marginClass = index % 2 === 1 ? 'md:mt-12' : '';
  const minHeight = 300 + (index % 3) * 50;

  // Get images array - handle both old single image format and new array format
  const images = Array.isArray(artwork.images) ? artwork.images : (artwork.image ? [artwork.image] : ['placeholder.jpg']);
  const mainImage = images[0];
  const hasMultipleImages = images.length > 1;

  // Optional price/dimensions line, only shown when the artist filled them in
  const priceText = (artwork.status === 'available' && artwork.price) ? `€${artwork.price}` : '';
  const dimsText = artwork.dimensions || '';
  const extraDetails = [dimsText, priceText].filter(Boolean).join(' · ');
  const extraDetailsHtml = extraDetails
    ? `<p class="font-label text-white/70 text-[11px] uppercase tracking-widest mb-2">${extraDetails}</p>`
    : '';

  let buttonHtml = '';
  if (artwork.status === 'available' && artwork.stripe_link) {
    buttonHtml = `
        <a href="${artwork.stripe_link}" class="inline-block text-center rounded-full bg-primary px-6 py-2.5 text-on-primary font-label font-bold text-xs tracking-wide hover:bg-primary-dim transition-all">
          <span data-i18n="gallery.purchase">Purchase</span>
        </a>`;
  } else if (artwork.status === 'available' && !artwork.stripe_link) {
    buttonHtml = `
        <a href="contacto.html" class="inline-block text-center rounded-full bg-primary px-6 py-2.5 text-on-primary font-label font-bold text-xs tracking-wide hover:bg-primary-dim transition-all">
          <span data-i18n="gallery.purchase">Purchase</span>
        </a>`;
  } else if (artwork.status === 'sold') {
    buttonHtml = `
        <a href="contacto.html" class="inline-block text-center rounded-full border-2 border-white/80 px-6 py-2.5 text-white font-label font-bold text-xs tracking-wide hover:bg-white/10 transition-all">
          Commission Similar
        </a>`;
  } else if (artwork.status === 'commission') {
    buttonHtml = `
        <a href="contacto.html" class="inline-block text-center rounded-full border-2 border-white/80 px-6 py-2.5 text-white font-label font-bold text-xs tracking-wide hover:bg-white/10 transition-all">
          Request Commission
        </a>`;
  }

  // Generate images data attribute for lightbox
  const imagesDataAttr = JSON.stringify(images.map(img => `/imagenes/${img}`)).replace(/"/g, '&quot;');

  return `
    <!-- ${artwork.title_en} -->
    <div class="masonry-item group relative overflow-hidden rounded-xl bg-surface-container-low hover:-translate-y-1 transition-all duration-500 ${marginClass}" data-category="${artwork.category || 'all'}">
      <div class="ph w-full" style="min-height:${minHeight}px">
        <span class="material-symbols-outlined">image</span><span>${mainImage}</span>
      </div>
      <img src="/imagenes/${mainImage}" alt="${artwork.title_en}" class="absolute inset-0 w-full h-full object-cover cursor-pointer" onerror="this.style.display='none'" onclick="openLightbox(${index}, ${imagesDataAttr})"/>
      <!-- Status badge (top right) -->
      <div class="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-${badge.bg}/90 backdrop-blur-sm">
        <span class="font-label text-${badge.text} text-xs font-bold uppercase tracking-wider" data-i18n="gallery.badge.${artwork.status}">${badge.label_en}</span>
      </div>
      <!-- Multiple images indicator (top left) -->
      ${hasMultipleImages ? `<div class="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-1.5">
        <span class="material-symbols-outlined text-white text-sm">photo_library</span>
        <span class="text-white text-xs font-bold">${images.length}</span>
      </div>` : ''}
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
        <h3 class="font-headline text-white text-xl mb-1 italic">
          <span data-i18n="art.${index + 1}.title" data-i18n-en="${artwork.title_en}" data-i18n-it="${artwork.title_it}" data-i18n-es="${artwork.title_es}">${artwork.title_en}</span>
        </h3>
        <p class="font-label text-white/80 text-xs uppercase tracking-widest mb-3">
          <span data-i18n="art.${index + 1}.medium" data-i18n-en="${artwork.medium_en} · ${artwork.year}" data-i18n-it="${artwork.medium_it} · ${artwork.year}" data-i18n-es="${artwork.medium_es} · ${artwork.year}">${artwork.medium_en} · ${artwork.year}</span>
        </p>${extraDetailsHtml}${buttonHtml}
      </div>
      <div class="p-4 md:hidden">
        <h3 class="font-headline text-on-surface text-lg italic">
          <span data-i18n="art.${index + 1}.title">${artwork.title_en}</span>
        </h3>
        <p class="font-label text-on-surface-variant text-xs uppercase tracking-widest">
          <span data-i18n="art.${index + 1}.medium">${artwork.medium_en}</span>
        </p>
      </div>
    </div>`;
}

// Generate gallery HTML
const galleryCards = artworks.map((artwork, index) => generateArtworkCard(artwork, index)).join('\n');

// Generate dynamic filters based on categories
const categoriesSet = new Set();
artworks.forEach(artwork => {
  if (artwork.category) categoriesSet.add(artwork.category);
});
const categories = Array.from(categoriesSet).sort();

const filterButtons = categories.map(cat => 
  `<button onclick="filterGallery('${cat}')" data-filter="${cat}" class="filter-btn px-6 py-2 rounded-full bg-tertiary-container text-on-tertiary-container text-sm font-medium hover:opacity-80 transition-all" data-i18n="gallery.filter.${cat.toLowerCase().replace(/\s+/g, '')}">${cat}</button>`
).join('\n        ');

// Read the base galeria.html template
const templatePath = path.join(__dirname, 'galeria-template.html');
let template;

if (fs.existsSync(templatePath)) {
  template = fs.readFileSync(templatePath, 'utf8');
} else {
  // If template doesn't exist, copy from outputs
  const outputGaleria = '/mnt/user-data/outputs/galeria.html';
  template = fs.readFileSync(outputGaleria, 'utf8');
  
  // Replace the hardcoded artwork cards with a placeholder
  template = template.replace(
    /<!-- Artwork 1 -->[\s\S]*?<!-- Artwork 6 -->[\s\S]*?<\/div>\s*<\/div>/m,
    '<!-- ARTWORKS_PLACEHOLDER -->'
  );
  
  fs.writeFileSync(templatePath, template);
}

// Replace placeholder with generated cards
let finalHtml = template.replace('<!-- ARTWORKS_PLACEHOLDER -->', galleryCards);

// Replace filter buttons placeholder if it exists
if (finalHtml.includes('<!-- FILTERS_PLACEHOLDER -->')) {
  finalHtml = finalHtml.replace('<!-- FILTERS_PLACEHOLDER -->', filterButtons);
}

// Add filtering JavaScript before closing body tag if not already present
const filterScript = `
<script>
let currentFilter = 'all';

function filterGallery(category) {
  currentFilter = category;
  const items = document.querySelectorAll('.masonry-item');
  const buttons = document.querySelectorAll('.filter-btn');
  const allBtn = document.querySelector('[data-filter="all"]');
  
  // Update button styles
  buttons.forEach(btn => {
    btn.classList.remove('bg-primary', 'text-on-primary');
    btn.classList.add('bg-tertiary-container', 'text-on-tertiary-container');
  });
  
  if (category === 'all') {
    if (allBtn) {
      allBtn.classList.remove('bg-tertiary-container', 'text-on-tertiary-container');
      allBtn.classList.add('bg-primary', 'text-on-primary');
    }
    items.forEach(item => item.style.display = 'block');
  } else {
    const activeBtn = document.querySelector(\`[data-filter="\${category}"]\`);
    if (activeBtn) {
      activeBtn.classList.remove('bg-tertiary-container', 'text-on-tertiary-container');
      activeBtn.classList.add('bg-primary', 'text-on-primary');
    }
    items.forEach(item => {
      if (item.dataset.category === category || item.dataset.category === 'all') {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }
}
</script>`;

if (!finalHtml.includes('function filterGallery')) {
  finalHtml = finalHtml.replace('</body>', filterScript + '\n</body>');
}

// Replace shared contact tokens (footer location/email) here too
const galeriaTokens = {
  ...sharedContactTokens,
  SEO_TITLE: seoData.gallery_title || 'Gallery — Florencia Carballo',
  SEO_DESCRIPTION: seoData.gallery_description || '',
  FORMSPREE_ID: contactData.formspree_id || 'YOUR_FORM_ID',
  GALLERY_INVITE_PHOTO: cleanImagePath(galleryImagesData.invite_photo, 'studio-photo.jpg'),
};
Object.entries(galeriaTokens).forEach(([token, value]) => {
  finalHtml = finalHtml.split(`{{${token}}}`).join(value);
});

// Write the final galeria.html
fs.writeFileSync(path.join(__dirname, 'galeria.html'), finalHtml);

console.log('✅ Generated galeria.html with', artworks.length, 'artworks and', categories.length, 'categories');
