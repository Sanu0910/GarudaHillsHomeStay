/* Garuda Hills Homestay — interactions
   Scroll-driven scenes run off one requestAnimationFrame loop with an eased
   (lerped) scroll position, so every transition glides instead of stepping. */

const CONFIG = {
  // Host's WhatsApp number in international format, digits only, e.g. "919876543210".
  // Leave empty and WhatsApp will open with the message ready to forward to a contact.
  whatsapp: '',
  mapsUrl: 'https://maps.app.goo.gl/QvYUcjF24jxdhzGr8',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => 1 - Math.pow(1 - t, 3);

/* ───────── WhatsApp links ───────── */
const waLink = text => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
$$('[data-whatsapp]').forEach(a => {
  a.href = waLink('Hi Garuda Hills! I would like to know about room availability and scooty rental.');
  a.target = '_blank';
  a.rel = 'noopener';
});

$('#enquiry').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  if (f.get('checkout') <= f.get('checkin')) {
    e.target.checkout.setCustomValidity('Check-out must be after check-in');
    e.target.checkout.reportValidity();
    return;
  }
  const msg = [
    'Hi Garuda Hills! Booking enquiry:',
    `Name: ${f.get('name')}`,
    `Check-in: ${fmt(f.get('checkin'))}`,
    `Check-out: ${fmt(f.get('checkout'))}`,
    `Guests: ${f.get('guests')} · Rooms: ${f.get('rooms')}`,
    `Scooty rental: ${f.get('scooty')}`,
  ].join('\n');
  window.open(waLink(msg), '_blank', 'noopener');
});
$('#enquiry').checkout.addEventListener('input', e => e.target.setCustomValidity(''));

// Sensible date defaults: tonight → +2 nights
(() => {
  const iso = d => d.toISOString().slice(0, 10);
  const t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
  const form = $('#enquiry');
  form.checkin.min = form.checkout.min = iso(t);
  form.checkin.value = iso(t);
  const out = new Date(t); out.setDate(out.getDate() + 2);
  form.checkout.value = iso(out);
})();

// "Reserve a scooty" pre-selects the scooty option
$$('[data-scooty]').forEach(b => b.addEventListener('click', () => {
  $('#enquiry input[name="scooty"][value="1 scooty"]').checked = true;
}));

/* ───────── Nav ───────── */
const nav = $('#nav');
const toggle = $('#navToggle');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
});
$$('#navLinks a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
}));

/* ───────── Reveal on scroll (staggered) ───────── */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    io.unobserve(en.target);
  });
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

$$('.reveal').forEach(el => {
  const sibs = $$(':scope > .reveal', el.parentElement);
  el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 6) * 0.08}s`);
  io.observe(el);
});

/* ───────── Count-up numbers ───────── */
const countIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    countIO.unobserve(en.target);
    const el = en.target;
    const end = parseFloat(el.dataset.count);
    const dp = (el.dataset.count.split('.')[1] || '').length;
    if (reduceMotion) return;
    const t0 = performance.now(), dur = 1400;
    const tick = now => {
      const t = clamp((now - t0) / dur);
      el.textContent = (end * ease(t)).toFixed(dp);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach(el => countIO.observe(el));

/* ───────── Manifesto: split into words ───────── */
const manifesto = $('[data-words]');
const words = manifesto.textContent.trim().split(/\s+/).map(w => {
  const s = document.createElement('span');
  s.className = 'w';
  s.textContent = w;
  return s;
});
manifesto.textContent = '';
words.forEach((s, i) => { manifesto.append(s); if (i < words.length - 1) manifesto.append(' '); });

/* ───────── Rooms rail ───────── */
const rail = $('#roomRail');
$$('[data-rail]').forEach(b => b.addEventListener('click', () => {
  const card = rail.querySelector('.room');
  rail.scrollBy({ left: (card.offsetWidth + 20) * Number(b.dataset.rail), behavior: 'smooth' });
}));

/* ───────── Lightbox ───────── */
const lb = $('#lightbox');
$$('.tile').forEach(t => t.addEventListener('click', () => {
  const img = $('img', lb);
  img.src = t.dataset.full;
  img.alt = $('img', t).alt;
  lb.showModal();
}));
lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lightbox__close')) lb.close(); });

/* ───────── Ride path setup ───────── */
const roadPath = $('#roadPath');
const trail = $('.ride__trail');
const scooty = $('#scooty');
const odo = $('#odo');
const pathLen = roadPath.getTotalLength();
trail.style.setProperty('--len', pathLen);
const RIDE_KM = 12.4; // to Mattupetty and back-ish — purely decorative odometer

function placeScooty(p) {
  const at = clamp(p) * pathLen;
  const a = roadPath.getPointAtLength(Math.max(0, at - 1));
  const b = roadPath.getPointAtLength(Math.min(pathLen, at + 1));
  const pt = roadPath.getPointAtLength(at);
  let ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  const flip = Math.abs(ang) > 90; // keep the scooty upright when heading left
  if (flip) ang += 180;
  scooty.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${ang}) scale(${flip ? -1 : 1} 1)`);
  trail.style.setProperty('--p', clamp(p));
  odo.textContent = (clamp(p) * RIDE_KM).toFixed(1);
}

/* ───────── Scroll scenes ───────── */
const hero = $('#hero');
const heroMedia = $('.hero__media');
const heroCopy = $('.hero__copy');
const expand = $('#expand');
const frame = $('.expand__frame');
const expandCopy = $('.expand__copy');
const ride = $('#ride');
const fab = $('.fab');
const darkSections = [hero, $('.manifesto'), ride, $('#gallery')];

// progress of an element scrolling through a pinned (sticky) section: 0 → 1
const pinProgress = (el, y) => clamp((y - el.offsetTop) / Math.max(1, el.offsetHeight - innerHeight));
// progress of an element passing through the viewport: 0 (enters bottom) → 1 (leaves top)
const viewProgress = (el, y) => clamp((y + innerHeight - el.offsetTop) / (el.offsetHeight + innerHeight));

let smoothY = scrollY;

function frameLoop() {
  const y = scrollY;
  smoothY = reduceMotion ? y : lerp(smoothY, y, 0.14);
  if (Math.abs(smoothY - y) < 0.1) smoothY = y;
  render(smoothY, y);
  requestAnimationFrame(frameLoop);
}

let lastKey = '';
function render(sy, y) {
  // Nav theme: transparent at top, frosted light/dark depending on what's underneath
  const probe = y + 26;
  const overDark = darkSections.some(s => probe >= s.offsetTop && probe < s.offsetTop + s.offsetHeight);
  nav.classList.toggle('is-solid', !overDark);
  nav.classList.toggle('is-darkglass', overDark && y > 40);
  fab.classList.toggle('show', y > innerHeight * 0.8);

  const key = Math.round(sy * 10) + 'x' + innerWidth;
  if (key === lastKey || reduceMotion) return;
  lastKey = key;

  // Hero: slow push-in, dim, copy drifts up and fades
  const hp = pinProgress(hero, sy);
  heroMedia.style.transform = `scale(${1 + hp * 0.18}) translateY(${hp * -3}%)`;
  heroMedia.style.filter = `brightness(${1 - hp * 0.55})`;
  heroCopy.style.transform = `translateY(${hp * -140}px) scale(${1 - hp * 0.08})`;
  heroCopy.style.opacity = clamp(1 - hp * 1.6);

  // Manifesto: light words as the paragraph travels up the screen
  const mp = clamp((viewProgress(manifesto, sy) - 0.18) / 0.5);
  const lit = Math.round(mp * words.length);
  words.forEach((w, i) => w.classList.toggle('on', i < lit));

  // Expand: card grows to full-bleed
  const ep = ease(clamp(pinProgress(expand, sy) / 0.7));
  frame.style.setProperty('--inset-y', `${lerp(22, 0, ep)}%`);
  frame.style.setProperty('--inset-x', `${lerp(innerWidth < 700 ? 8 : 24, 0, ep)}%`);
  frame.style.setProperty('--r', `${lerp(32, 0, ep)}px`);
  frame.style.setProperty('--s', lerp(1.25, 1, ep));
  expandCopy.style.setProperty('--o', clamp((pinProgress(expand, sy) - 0.55) / 0.25));

  // Ride: scooty follows the road
  const pinned = getComputedStyle($('.ride__sticky')).position === 'sticky';
  const rp = pinned ? pinProgress(ride, sy) : clamp((viewProgress(ride, sy) - 0.2) / 0.55);
  placeScooty(ease(clamp(rp / 0.9)));
}

if (reduceMotion) placeScooty(1);
requestAnimationFrame(frameLoop);
addEventListener('resize', () => { lastKey = ''; });

$('#year').textContent = new Date().getFullYear();
