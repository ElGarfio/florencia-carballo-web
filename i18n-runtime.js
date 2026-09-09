FC.setLang = function(lang) {
  if (!FC.T[lang]) return;
  FC.LANG = lang;
  localStorage.setItem('fc-lang', lang);
  FC.apply();
};

FC.apply = function() {
  const t = FC.T[FC.LANG];

  // Text content (simple text only)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // HTML content (text with embedded HTML tags)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  // Input placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) el.setAttribute('placeholder', t[key]);
  });

  // Update language button styles
  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    const active = btn.getAttribute('data-lang-btn') === FC.LANG;
    btn.classList.toggle('bg-primary', active);
    btn.classList.toggle('text-white', active);
    btn.classList.toggle('text-slate-500', !active);
  });

  // Update html lang attribute
  const langMap = { en: 'en', it: 'it', es: 'es' };
  document.documentElement.setAttribute('lang', langMap[FC.LANG] || 'en');

  // Highlight active nav link based on data-page attribute on <html>
  const page = document.documentElement.getAttribute('data-page');
  document.querySelectorAll('[data-nav]').forEach(link => {
    const active = link.getAttribute('data-nav') === page;
    link.classList.toggle('text-primary', active);
    link.classList.toggle('font-bold', active);
    link.classList.toggle('border-b-2', active);
    link.classList.toggle('border-primary', active);
    link.classList.toggle('text-slate-500', !active);
    link.classList.toggle('hover:text-slate-800', !active);
  });
};

FC.init = function() {
  const saved = localStorage.getItem('fc-lang');
  if (saved && FC.T[saved]) FC.LANG = saved;
  FC.apply();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', FC.init);
} else {
  FC.init();
}
