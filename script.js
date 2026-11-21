// Onyx & Fog: concept restaurant site.
// Sections: 1 Setup, 2 Courses, 3 Pairing toggle, 4 Smooth scroll & nav, 5 Intro,
// 6 Scroll choreography, 7 Cursor, 8 Reservations.
// All text is inserted with textContent. Nothing is sent anywhere: this is a concept site.

/* 1. Setup */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
if (hasGsap) window.gsap.registerPlugin(window.ScrollTrigger);

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

// Roving-tabindex radio group: click or arrow keys select an item.
function radioGroup(container, onSelect) {
  const items = () => [...container.querySelectorAll('[role="radio"]:not(:disabled)')];
  const select = (item, focus) => {
    container.querySelectorAll('[role="radio"]').forEach((b) => {
      b.setAttribute('aria-checked', String(b === item));
      b.tabIndex = b === item ? 0 : -1;
    });
    if (focus) item.focus();
    onSelect(item);
  };
  container.addEventListener('click', (e) => {
    const item = e.target.closest('[role="radio"]');
    if (item && !item.disabled) select(item, false);
  });
  container.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const list = items();
    const i = list.indexOf(document.activeElement);
    select(list[(i + keys[e.key] + list.length) % list.length], true);
  });
  return { refresh: () => {
    const list = items();
    const checked = list.find((b) => b.getAttribute('aria-checked') === 'true');
    list.forEach((b) => (b.tabIndex = b === (checked ?? list[0]) ? 0 : -1));
  } };
}

/* 2. Courses */
const COURSES = [
  ['Tomales Bay oyster', 'Smoked kelp mignonette, finger lime, sea fennel.', 'oyster', 'Oysters on crushed ice', 'Grower Champagne, Blanc de Blancs', 'Sea buckthorn and green tea sparkle'],
  ['Bluefin crudo', 'Charred scallion oil, shiso, pickled chili, borage flowers.', 'crudo', 'Thin slices of raw tuna with green oil and purple flowers', 'Junmai ginjo sake, Niigata', 'Cold-brewed sencha and yuzu'],
  ['Ember king salmon', 'Morels, brown-butter dashi, smoked trout roe.', 'salmon', 'Salmon with morel mushrooms in a dark ceramic bowl', 'Sonoma Coast Chardonnay', 'Verjus, chamomile and honey'],
  ['Scallop over oak', 'Grilled in the shell, yuzu kosho butter, burnt lemon.', 'scallop', 'Scallops grilling in their shells over a grate', 'Txakoli, Getaria', 'Smoked lemonade with a salted rim'],
  ['A5 Miyazaki wagyu', 'Seared over binchotan, fresh wasabi, smoked salt.', 'wagyu', 'Seared wagyu slices with wasabi and salt', 'Napa Valley Cabernet Franc', 'Black tea, cherry and clove'],
  ['Garden', 'Pistachio moss, elderflower cream, gold leaf.', 'garden', 'A green dessert with edible flowers and gold leaf', 'Moscato d’Asti', 'Elderflower and cucumber tonic'],
  ['Meyer lemon, brown butter', 'Toasted almond, vanilla ice cream, candied orange.', 'citrus', 'A dessert with ice cream, nuts and an orange crisp', 'Sauternes, Bordeaux', 'Toasted rice milk and vanilla'],
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const track = document.getElementById('coursesTrack');

if (track) {
  COURSES.forEach(([name, notes, img, alt, wine, zero], i) => {
    const card = el('article', 'course');
    const media = el('figure', 'course-media');
    const pic = el('img');
    Object.assign(pic, { src: `img/${img}.webp`, alt, width: 1400, height: 933, loading: 'lazy', decoding: 'async' });
    media.append(pic, el('span', 'course-no', ROMAN[i]));
    const body = el('div', 'course-body');
    const pair = el('p', 'course-pair');
    pair.dataset.wine = wine;
    pair.dataset.zero = zero;
    pair.append(el('span', null, 'Wine'), el('em', null, wine));
    body.append(el('h3', null, name), el('p', 'course-notes', notes), pair);
    card.append(media, body);
    track.append(card);
  });
}

/* 3. Pairing toggle (menu and booking stay in sync) */
const pairing = document.querySelector('.pairing');
const pairSelect = document.getElementById('pairSelect');
let setBookingPair = () => {};

function showPairing(kind) {
  document.querySelectorAll('.course-pair').forEach((p) => {
    p.classList.toggle('is-off', kind === 'none');
    p.setAttribute('aria-hidden', String(kind === 'none'));
    if (kind === 'none') return;
    p.querySelector('span').textContent = kind === 'wine' ? 'Wine' : 'Zero-proof';
    p.querySelector('em').textContent = p.dataset[kind];
  });
}

let pairingGroup = null;
if (pairing) {
  pairingGroup = radioGroup(pairing, (btn) => {
    showPairing(btn.dataset.pair);
    if (pairSelect && pairSelect.value !== btn.dataset.pair) {
      pairSelect.value = btn.dataset.pair;
      setBookingPair(btn.dataset.pair);
    }
  });
  pairingGroup.refresh();
}

/* 4. Smooth scroll & nav */
let lenis = null;
if (!reduced && typeof window.Lenis !== 'undefined') {
  lenis = new window.Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
  if (hasGsap) {
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add((t) => lenis.raf(t * 1000));
    window.gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => {
      lenis.raf(t);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]:not(.skip)');
  if (!link) return;
  const id = link.getAttribute('href');
  const target = id === '#top' ? document.getElementById('top') : document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -72 });
  else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});

const nav = document.getElementById('nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* 5. Intro */
const curtain = document.getElementById('curtain');
if (curtain) {
  if (!hasGsap || reduced) {
    curtain.remove();
  } else {
    const { gsap } = window;
    document.body.classList.add('is-loading');
    const done = () => {
      curtain.remove();
      document.body.classList.remove('is-loading');
    };
    gsap
      .timeline({ defaults: { ease: 'expo.out' }, onComplete: done })
      .from('.curtain-mark > *', { yPercent: 120, opacity: 0, duration: 1, stagger: 0.09 })
      .to('.curtain-mark', { opacity: 0, y: -20, duration: 0.45, ease: 'power2.in' }, '+=0.2')
      .to(curtain, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.15')
      .from('.hero-media img', { scale: 1.22, duration: 2.4 }, '-=0.85')
      .from('.hero-title .line > span', { yPercent: 108, duration: 1.3, stagger: 0.12 }, '<0.1')
      .from('.reveal-up', { y: 24, opacity: 0, duration: 1.1, stagger: 0.08 }, '<0.35');
  }
}

/* 6. Scroll choreography */
const manifesto = document.getElementById('manifesto');
if (manifesto) {
  const words = manifesto.textContent.trim().split(/\s+/);
  manifesto.textContent = '';
  words.forEach((w) => manifesto.append(el('span', 'w', w), ' '));
}

if (hasGsap && !reduced) {
  const { gsap, ScrollTrigger } = window;

  if (manifesto) {
    gsap.to('.manifesto-text .w', {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: manifesto, start: 'top 78%', end: 'bottom 42%', scrub: true },
    });
  }

  // Hero image drifts as the page scrolls away
  gsap.to('.hero-media img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Parallax photos in the room section
  gsap.utils.toArray('.parallax img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -15 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Headings and copy rise in once
  gsap.utils.toArray('.menu-head, .room-copy > *, .reserve-head > *, .visit-grid > *').forEach((node) => {
    gsap.from(node, { y: 36, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: node, start: 'top 88%', once: true } });
  });

  const courses = document.getElementById('courses');
  const mm = gsap.matchMedia();

  // Desktop: the courses scroll sideways while the section is pinned
  mm.add('(min-width: 1101px)', () => {
    if (!courses || !track) return undefined;
    courses.classList.add('is-horizontal');
    const bar = document.getElementById('courseBar');
    const index = document.getElementById('courseIndex');
    const distance = () => track.scrollWidth - window.innerWidth;
    const slide = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: courses,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          bar.style.transform = `scaleX(${self.progress})`;
          index.textContent = String(Math.min(COURSES.length, Math.floor(self.progress * COURSES.length) + 1)).padStart(2, '0');
        },
      },
    });
    track.querySelectorAll('.course-media img').forEach((img) => {
      gsap.fromTo(img, { xPercent: -5, scale: 1.14 }, { xPercent: 5, scale: 1.14, ease: 'none', scrollTrigger: { trigger: img.parentElement, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true } });
    });
    return () => courses.classList.remove('is-horizontal');
  });

  // Smaller screens: course cards rise in as they arrive
  mm.add('(max-width: 1100px)', () => {
    ScrollTrigger.batch('.course', {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.from(batch, { y: 48, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 }),
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* 7. Cursor (fine pointers only) */
const cursor = document.getElementById('cursor');
if (cursor && hasGsap && !reduced && window.matchMedia('(pointer: fine)').matches) {
  const { gsap } = window;
  const x = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const y = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => {
    cursor.classList.add('is-on');
    x(e.clientX);
    y(e.clientY);
  }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('is-big', Boolean(e.target.closest('a, button, label, select, .course-media')));
  });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
}

/* 8. Reservations */
const booker = document.getElementById('booker');
if (booker) {
  const PRICE = { counter: 295, table: 395 };
  const EXP_LABEL = { counter: 'Counter tasting', table: "Chef's table" };
  const PAIR = { wine: 165, zero: 95, none: 0 };
  const PAIR_LABEL = { wine: 'Wine pairing', zero: 'Zero-proof pairing', none: 'No pairing' };
  const SLOTS = ['5:30 pm', '8:45 pm'];
  const SERVICE = 0.2;
  const TAX = 0.08625;
  const DEPOSIT = 100;
  const state = { exp: 'counter', guests: 2, pair: 'wine', date: null, time: null };

  const $ = (id) => document.getElementById(id);
  const usd = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const longDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const maxGuests = () => 6;
  const minGuests = () => (state.exp === 'table' ? 2 : 1);

  // Sample availability: a stable pseudo-random number of seats per date and seating.
  function seatsLeft(d, slot) {
    let h = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate() * 7 + slot * 13;
    h = (h * 2654435761) % 4294967296;
    return [0, 2, 3, 5, 6, 8, 10, 12][h % 8];
  }

  // Dates: the next three weeks, closed Monday and Tuesday
  const datesBox = $('dates');
  const timesBox = $('times');
  const days = [];
  for (let i = 1; i <= 21; i++) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  days.forEach((d, i) => {
    const closed = d.getDay() === 1 || d.getDay() === 2;
    const b = el('button', 'date');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    b.dataset.i = i;
    b.disabled = closed;
    b.setAttribute('aria-label', `${longDate(d)}${closed ? ', closed' : ''}`);
    b.append(el('span', null, d.toLocaleDateString('en-US', { weekday: 'short' })), el('b', null, String(d.getDate())), el('span', null, d.toLocaleDateString('en-US', { month: 'short' })));
    datesBox.append(b);
  });

  function renderTimes() {
    timesBox.replaceChildren();
    if (!state.date) return;
    SLOTS.forEach((slot, s) => {
      const left = seatsLeft(state.date, s);
      const fits = left >= state.guests;
      const b = el('button', `time${left > 0 && left <= 3 ? ' is-low' : ''}`);
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(state.time === slot && fits));
      b.dataset.slot = slot;
      b.disabled = !fits;
      const note = left === 0 ? 'Fully booked' : !fits ? `Only ${left} seats` : left <= 3 ? `Only ${left} left` : `${left} seats left`;
      b.append(document.createTextNode(slot), el('small', null, note));
      timesBox.append(b);
    });
    if (state.time && timesBox.querySelector(`[data-slot="${state.time}"]:disabled`)) state.time = null;
    if (!state.time) {
      const first = timesBox.querySelector('.time:not(:disabled)');
      if (first) {
        state.time = first.dataset.slot;
        first.setAttribute('aria-checked', 'true');
      }
    }
    timesGroup.refresh();
  }

  const datesGroup = radioGroup(datesBox, (b) => {
    state.date = days[Number(b.dataset.i)];
    renderTimes();
    renderSummary();
  });
  const timesGroup = radioGroup(timesBox, (b) => {
    state.time = b.dataset.slot;
    renderSummary();
  });

  // Experience, guests, pairing
  booker.querySelectorAll('input[name="exp"]').forEach((r) =>
    r.addEventListener('change', () => {
      state.exp = r.value;
      state.guests = Math.min(maxGuests(), Math.max(minGuests(), state.guests));
      syncGuests();
    }),
  );
  function syncGuests() {
    $('guestCount').textContent = String(state.guests);
    $('guestMinus').disabled = state.guests <= minGuests();
    $('guestPlus').disabled = state.guests >= maxGuests();
    renderTimes();
    renderSummary();
  }
  $('guestMinus').addEventListener('click', () => {
    state.guests = Math.max(minGuests(), state.guests - 1);
    syncGuests();
  });
  $('guestPlus').addEventListener('click', () => {
    state.guests = Math.min(maxGuests(), state.guests + 1);
    syncGuests();
  });
  setBookingPair = (kind) => {
    state.pair = kind;
    renderSummary();
  };
  pairSelect.addEventListener('change', () => {
    setBookingPair(pairSelect.value);
    const btn = pairing?.querySelector(`[data-pair="${pairSelect.value}"]`);
    if (btn && btn.getAttribute('aria-checked') !== 'true') btn.click();
  });

  // Summary
  function line(dl, label, value, cls) {
    const row = el('div', cls);
    row.append(el('dt', null, label), el('dd', null, value));
    dl.append(row);
  }
  function money() {
    const food = PRICE[state.exp] * state.guests;
    const drinks = PAIR[state.pair] * state.guests;
    const service = (food + drinks) * SERVICE;
    const tax = (food + drinks) * TAX;
    return { food, drinks, service, tax, total: Math.round((food + drinks + service + tax) * 100) / 100 };
  }
  function renderSummary() {
    const lines = $('sumLines');
    const cash = $('sumMoney');
    lines.replaceChildren();
    cash.replaceChildren();
    line(lines, 'Experience', EXP_LABEL[state.exp]);
    line(lines, 'Date', state.date ? longDate(state.date) : 'Choose a date');
    line(lines, 'Seating', state.time ?? 'Choose a seating');
    line(lines, 'Guests', String(state.guests));
    line(lines, 'Pairing', PAIR_LABEL[state.pair]);
    const m = money();
    line(cash, `${EXP_LABEL[state.exp]} × ${state.guests}`, usd(m.food));
    if (m.drinks) line(cash, `${PAIR_LABEL[state.pair]} × ${state.guests}`, usd(m.drinks));
    line(cash, 'Service (20%)', usd(Math.round(m.service * 100) / 100));
    line(cash, 'Estimated tax (8.625%)', usd(Math.round(m.tax * 100) / 100));
    line(cash, 'Estimated total', usd(m.total), 'total');
    line(cash, 'Deposit today', usd(DEPOSIT * state.guests));
  }

  // Steps
  const show = (n) => {
    [1, 2, 3].forEach((k) => ($(`step${k}`).hidden = k !== n));
  };
  $('toDetails').addEventListener('click', () => {
    const err = $('step1Error');
    if (!state.date || !state.time) {
      err.textContent = !state.date ? 'Choose a date first.' : 'Choose a seating.';
      return;
    }
    err.textContent = '';
    show(2);
    $('r-name').focus();
  });
  $('backTo1').addEventListener('click', () => {
    show(1);
    $('toDetails').focus();
  });

  const rules = {
    'r-name': (v) => (v.trim().length >= 2 ? '' : 'Please enter your full name.'),
    'r-email': (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email, like name@example.com.'),
  };
  const check = (id) => {
    const input = $(id);
    const msg = rules[id](input.value);
    input.setAttribute('aria-invalid', String(Boolean(msg)));
    $(`${id}-err`).textContent = msg;
    return !msg;
  };
  Object.keys(rules).forEach((id) => $(id).addEventListener('input', () => $(id).getAttribute('aria-invalid') === 'true' && check(id)));

  let booking = null;
  booker.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = Object.keys(rules).filter((id) => !check(id));
    if (bad.length) {
      $('step2Error').textContent = `Please fix ${bad.length} ${bad.length === 1 ? 'field' : 'fields'}.`;
      $(bad[0]).focus();
      return;
    }
    $('step2Error').textContent = '';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const rnd = crypto.getRandomValues(new Uint8Array(4));
    const code = `OF-${[...rnd].map((n) => chars[n % chars.length]).join('')}`;
    const name = $('r-name').value.trim();
    booking = { ...state, code, name, email: $('r-email').value.trim() };
    $('confirmCode').textContent = code;
    $('confirmTitle').textContent = `See you soon, ${name.split(' ')[0]}.`;
    $('confirmText').textContent = `${EXP_LABEL[state.exp]} for ${state.guests} on ${longDate(state.date)} at ${state.time}. On a live site, details would go to ${booking.email}.`;
    show(3);
    $('step3').focus();
  });

  // Calendar file (.ics)
  const icsEscape = (s) => s.replace(/([,;\\])/g, '\\$1');
  $('addCal').addEventListener('click', () => {
    if (!booking) return;
    const d = booking.date;
    const [hm, ampm] = booking.time.split(' ');
    let [h, min] = hm.split(':').map(Number);
    if (ampm === 'pm' && h < 12) h += 12;
    const pad = (n) => String(n).padStart(2, '0');
    const start = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(min)}00`;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Onyx and Fog//Concept//EN',
      'BEGIN:VEVENT',
      `UID:${booking.code}@onyxandfog.example`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=America/Los_Angeles:${start}`,
      'DURATION:PT3H',
      `SUMMARY:${icsEscape(`Onyx & Fog · ${EXP_LABEL[booking.exp]} (concept)`)}`,
      `LOCATION:${icsEscape('Dogpatch, San Francisco')}`,
      `DESCRIPTION:${icsEscape(`Concept reservation ${booking.code} for ${booking.guests}. No real booking was made.`)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = el('a');
    a.href = url;
    a.download = `onyx-and-fog-${booking.code}.ics`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $('newBooking').addEventListener('click', () => {
    booker.reset();
    Object.keys(rules).forEach((id) => {
      $(id).removeAttribute('aria-invalid');
      $(`${id}-err`).textContent = '';
    });
    Object.assign(state, { exp: 'counter', guests: 2, pair: pairSelect.value });
    booking = null;
    syncGuests();
    show(1);
    datesBox.querySelector('[aria-checked="true"]')?.focus();
  });

  // Start on the first open date
  const firstOpen = datesBox.querySelector('.date:not(:disabled)');
  if (firstOpen) firstOpen.click();
  datesGroup.refresh();
  syncGuests();
}
