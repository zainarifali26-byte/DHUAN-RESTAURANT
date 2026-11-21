// DHUAN: menu tabs, order basket with a WhatsApp message, booking form, ember canvas.
// All text is inserted with textContent. Nothing is sent anywhere: this is a concept site.

const WHATSAPP_NUMBER = ''; // e.g. '923001234567'. Empty = demo mode (shows the message instead).
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MENU = {
  bbq: {
    label: 'BBQ',
    items: [
      ['Reshmi seekh', 'Chicken, cream and green chilli. Four skewers.', 1150],
      ['Beef seekh', 'Coarse-minced beef, onion and coriander. Four skewers.', 1250],
      ['Chicken tikka', 'Leg and breast, yoghurt and red chilli, on the bone.', 950],
      ['Malai boti', 'Boneless chicken in cream, cheese and white pepper.', 1300],
      ['Mutton chops', 'Lamb chops marinated overnight in raw papaya.', 2600],
      ['Fish tikka', 'Seasonal fish in ajwain and lemon, off the coal.', 1800],
    ],
  },
  karahi: {
    label: 'Karahi',
    items: [
      ['Smoked mutton karahi', 'Half kilo, tomato and ginger, smoked under the lid.', 3400],
      ['Chicken karahi', 'Half kilo, green chilli and black pepper.', 2100],
      ['Namkeen gosht', 'Peshawari style: salt, pepper and lamb fat. Half kilo.', 3200],
      ['Daal makhani', 'Black lentils simmered overnight, finished with butter.', 850],
    ],
  },
  breads: {
    label: 'Breads and rice',
    items: [
      ['Tandoori naan', 'Straight from the clay oven.', 80],
      ['Roghni naan', 'Brushed with egg and sesame.', 150],
      ['Garlic naan', 'Butter, garlic and coriander.', 180],
      ['Kabuli pulao', 'Rice with lamb, carrots and raisins.', 1400],
    ],
  },
  chai: {
    label: 'Chai and sweets',
    items: [
      ['Kulhar doodh patti', 'Strong tea in full-cream milk, in a clay cup.', 220],
      ['Kashmiri chai', 'Pink tea with pistachio and almond.', 380],
      ['Gajar halwa', 'Slow-cooked carrot, khoya and nuts. Winter only.', 650],
      ['Kheer', 'Rice pudding in a clay bowl, set overnight.', 450],
    ],
  },
};

const rupees = (n) => `Rs ${n.toLocaleString('en-PK')}`;
const basket = new Map(); // name -> { price, qty }

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

/* Menu tabs */
const tabs = document.getElementById('tabs');
const list = document.getElementById('menuList');
const cartStatus = document.getElementById('cartStatus');

function renderMenu(key) {
  list.replaceChildren();
  list.setAttribute('aria-labelledby', `tab-${key}`);
  MENU[key].items.forEach(([name, desc, price], i) => {
    const row = el('div', 'dish');
    row.style.animationDelay = `${i * 40}ms`;
    const h = el('h3', null, name);
    h.append(el('span', 'price', rupees(price)));
    const btn = el('button', 'add');
    btn.type = 'button';
    btn.dataset.name = name;
    btn.dataset.price = price;
    syncAddButton(btn);
    row.append(h, el('p', null, desc), btn);
    list.append(row);
  });
}

function syncAddButton(btn) {
  const qty = basket.get(btn.dataset.name)?.qty ?? 0;
  btn.classList.toggle('in', qty > 0);
  btn.textContent = qty > 0 ? `Added · ${qty}` : 'Add';
  btn.setAttribute('aria-label', qty > 0 ? `Add another ${btn.dataset.name}, ${qty} in order` : `Add ${btn.dataset.name} to order`);
}

if (tabs && list) {
  const keys = Object.keys(MENU);
  keys.forEach((key, i) => {
    const t = el('button', 'tab', MENU[key].label);
    t.type = 'button';
    t.id = `tab-${key}`;
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-selected', String(i === 0));
    t.tabIndex = i === 0 ? 0 : -1;
    t.dataset.key = key;
    tabs.append(t);
  });
  const select = (t) => {
    tabs.querySelectorAll('.tab').forEach((b) => {
      b.setAttribute('aria-selected', String(b === t));
      b.tabIndex = b === t ? 0 : -1;
    });
    renderMenu(t.dataset.key);
  };
  tabs.addEventListener('click', (e) => {
    const t = e.target.closest('.tab');
    if (t) select(t);
  });
  tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const all = [...tabs.querySelectorAll('.tab')];
    const i = all.indexOf(document.activeElement);
    const next = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
    next.focus();
    select(next);
  });
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.add');
    if (!btn) return;
    changeQty(btn.dataset.name, Number(btn.dataset.price), 1);
    syncAddButton(btn);
  });
  renderMenu(keys[0]);
}

/* Basket */
const bar = document.getElementById('orderBar');
const dialog = document.getElementById('orderDialog');
const orderList = document.getElementById('orderList');
const preview = document.getElementById('preview');

function totals() {
  let count = 0;
  let sum = 0;
  basket.forEach(({ price, qty }) => {
    count += qty;
    sum += price * qty;
  });
  return { count, sum };
}

function changeQty(name, price, delta) {
  const item = basket.get(name) ?? { price, qty: 0 };
  item.qty += delta;
  if (item.qty <= 0) basket.delete(name);
  else basket.set(name, item);
  const { count, sum } = totals();
  bar.hidden = count === 0;
  document.getElementById('barCount').textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  document.getElementById('barTotal').textContent = rupees(sum);
  document.getElementById('orderTotal').textContent = rupees(sum);
  cartStatus.textContent = delta > 0 ? `${name} added. ${count} in order.` : `${name} updated. ${count} in order.`;
  if (dialog.open) renderOrder();
  if (count === 0 && dialog.open) dialog.close();
}

function renderOrder() {
  orderList.replaceChildren();
  basket.forEach(({ price, qty }, name) => {
    const li = el('li');
    const q = el('div', 'qty');
    const minus = el('button', null, '−');
    minus.type = 'button';
    minus.setAttribute('aria-label', `One less ${name}`);
    minus.addEventListener('click', () => changeQty(name, price, -1));
    const plus = el('button', null, '+');
    plus.type = 'button';
    plus.setAttribute('aria-label', `One more ${name}`);
    plus.addEventListener('click', () => changeQty(name, price, 1));
    q.append(minus, el('span', null, String(qty)), plus);
    li.append(el('span', null, name), q, el('span', 'line-price', rupees(price * qty)));
    orderList.append(li);
  });
  preview.hidden = true;
}

function orderMessage() {
  const lines = ['Assalam o alaikum DHUAN, I would like to order:'];
  basket.forEach(({ price, qty }, name) => lines.push(`• ${qty} × ${name} (${rupees(price * qty)})`));
  lines.push(`Total: ${rupees(totals().sum)}`);
  const note = document.getElementById('orderNote').value.trim();
  if (note) lines.push(`Note: ${note}`);
  return lines.join('\n');
}

if (bar && dialog) {
  document.getElementById('openOrder').addEventListener('click', () => {
    renderOrder();
    dialog.showModal();
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    list.querySelectorAll('.add').forEach(syncAddButton);
    document.getElementById('openOrder').focus();
  });
  document.getElementById('sendOrder').addEventListener('click', () => {
    const text = orderMessage();
    if (WHATSAPP_NUMBER) {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      return;
    }
    document.getElementById('previewText').textContent = text;
    preview.hidden = false;
    preview.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
  });
}

/* Booking form */
const form = document.getElementById('bookForm');
if (form) {
  const date = form.elements.date;
  const today = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  date.min = iso(today);

  const rules = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
    phone: (v) => (/^(\+92|0)3\d{2}[\s-]?\d{7}$/.test(v.trim()) ? '' : 'Enter a Pakistani mobile number, like 0300 1234567.'),
    date: (v) => (!v ? 'Pick a date.' : v < iso(today) ? 'Pick today or a later date.' : ''),
  };
  const check = (input) => {
    const msg = rules[input.name](input.value);
    input.setAttribute('aria-invalid', String(Boolean(msg)));
    document.getElementById(`${input.id}-err`).textContent = msg;
    return !msg;
  };
  Object.keys(rules).forEach((n) => form.elements[n].addEventListener('input', (e) => e.target.getAttribute('aria-invalid') === 'true' && check(e.target)));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = document.getElementById('bookStatus');
    const bad = Object.keys(rules).map((n) => form.elements[n]).filter((i) => !check(i));
    if (bad.length) {
      status.className = 'form-status bad';
      status.textContent = `Please fix ${bad.length} ${bad.length === 1 ? 'field' : 'fields'}.`;
      bad[0].focus();
      return;
    }
    const f = form.elements;
    status.className = 'form-status';
    status.textContent = `Thanks, ${f.name.value.trim()}. ${f.guests.value} guests, ${f.seat.value.toLowerCase()}, ${f.time.value} on ${new Date(`${f.date.value}T00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}. This is a concept site, so nothing was sent; a live site would confirm by phone.`;
  });
}

/* Ember canvas */
const canvas = document.getElementById('embers');
if (canvas && !reducedMotion) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let running = true;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const sparks = [];
  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const spawn = () => ({
    x: w * (0.35 + Math.random() * 0.65),
    y: h + 10,
    r: 0.6 + Math.random() * 1.8,
    vy: 0.4 + Math.random() * 1.1,
    vx: (Math.random() - 0.5) * 0.4,
    life: 0,
    max: 260 + Math.random() * 260,
    hue: 18 + Math.random() * 22,
  });
  const count = () => (w < 600 ? 40 : 90);
  const tick = () => {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    while (sparks.length < count()) sparks.push(spawn());
    sparks.forEach((s, i) => {
      s.life += 1;
      s.y -= s.vy;
      s.x += s.vx + Math.sin((s.life + i) / 30) * 0.3;
      const a = Math.max(0, 1 - s.life / s.max);
      ctx.beginPath();
      ctx.fillStyle = `hsl(${s.hue} 100% 60% / ${a * 0.9})`;
      ctx.shadowColor = `hsl(${s.hue} 100% 55%)`;
      ctx.shadowBlur = 8;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (a <= 0 || s.y < -10) sparks[i] = spawn();
    });
    requestAnimationFrame(tick);
  };
  resize();
  window.addEventListener('resize', resize);
  new IntersectionObserver(([entry]) => {
    const was = running;
    running = entry.isIntersecting;
    if (running && !was) requestAnimationFrame(tick);
  }).observe(canvas);
  requestAnimationFrame(tick);
}
