/* Le Grillon — interactions */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  /* Intro du logo (une fois par visite) : durée à décaler pour le héro */
  const intro = $(".intro");
  const INTRO = document.documentElement.classList.contains("no-intro") ? 0 : 1.9;
  if (INTRO) {
    try { sessionStorage.setItem("grillon-intro", "1"); } catch (e) { /* stockage indisponible */ }
    intro.addEventListener("click", () => intro.remove()); // un clic passe l'intro
    setTimeout(() => intro.remove(), (INTRO + 0.9) * 1000);
  } else intro.remove();

  /* ------------------------------------------------------------
     Données : la carte (reprise de la carte PDF du restaurant)
     ------------------------------------------------------------ */
  const MENU = [
    { id: "pizzas", label: "Pizzas", items: [
      ["Romaine", 9.4, "Tomate, épaule, fromage, origan, olives"],
      ["Napolitaine", 9.9, "Tomate, anchois, câpres, fromage, origan, olives"],
      ["Reine", 9.9, "Tomate, champignons de Paris, épaule, fromage, origan, olives"],
      ["Thon", 10.5, "Tomate, thon, oignons rouges, crème, fromage, origan, olives"],
      ["Bolognaise", 10.9, "Sauce bolognaise, oignons rouges, crème, fromage, origan, olives"],
      ["Normande", 10.5, "Crème, lardons, champignons de Paris, fromage, origan, olives"],
      ["Savoyarde", 12.5, "Tomate, lardons, pommes de terre, oignons, Reblochon, crème, fromage, origan, olives"],
      ["Provençale", 10.5, "Tomate, épaule, œuf dur, persillade, fromage, origan, olives"],
      ["Grillon", 13, "Crème, champignons de Paris, épaule, Roquefort, fromage, origan, olives", "star"],
      ["Campagnarde", 12.9, "Tomate, crème, champignons de Paris, jambon cru, chèvre, fromage, origan, olives"],
      ["Royale", 12.9, "Tomate, saumon fumé, crème, fromage, origan, olives"],
      ["Orientale", 10.9, "Tomate, merguez, fromage, origan, olives"],
      ["Pescatore", 11.9, "Tomate, cocktail de fruits de mer, persillade, fromage, origan, olives"],
      ["Toscane", 10.5, "Tomate, chorizo, poivrons, oignons, fromage, origan, olives"],
      ["Campione", 11.5, "Tomate, viande hachée, champignons de Paris, oignons, poivrons, crème, fromage, origan, olives"],
      ["Kébab", 11.5, "Sauce kébab, viande kébab, oignons rouges, roquette, tomates cerises, fromage, origan, olives"],
      ["Roquette", 11.5, "Tomate, jambon cru, parmesan, tomates cerises, roquette"],
      ["Indienne", 12, "Tomate, poulet, champignons de Paris, poivrons, crème, curry, fromage, origan, olives"],
      ["Calzone", 13.5, "En chausson : toutes les pizzas sauf la Grillon et la Roquette"],
    ]},
    { id: "vege", label: "Pizzas végétariennes", items: [
      ["Marguerita", 8.5, "Tomate, mozzarella, fromage, origan, olives", "veg"],
      ["Royannaise", 12.2, "Crème, ravioles, persil, fromage, origan, olives", "veg"],
      ["Végétarienne", 10.2, "Tomate, champignons de Paris, oignons rouges, poivrons, fromage, origan, olives", "veg"],
      ["4 fromages", 10.9, "Tomate, mozzarella, Roquefort, chèvre, fromage, origan, olives", "veg"],
      ["Morilles", 12.9, "Sauce morilles, ravioles, persil, fromage, origan, olives", "veg"],
      ["Grenobloise", 12.9, "Tomate, chèvre, St Marcellin, noix, fromage, origan, olives", "veg"],
      ["Aubergine", 12.5, "Tomate, aubergines fraîches, oignons rouges, fromage, origan, olives", "veg"],
    ]},
    { id: "ravioles", label: "Ravioles", items: [
      ["Ravioles sauce Roquefort", [12.9, 13.9], "Ravioles, crème, Roquefort", "veg"],
      ["Ravioles sauce morilles", [13.9, 14.9], "Ravioles, crème, morilles", "veg"],
      ["Ravioles gratinées", 13, "Ravioles, crème, gruyère, le tout gratiné au four", "veg"],
    ]},
    { id: "burgers", label: "Burgers", items: [
      ["Classique", 13.5, "Salade, tomates, oignons, ketchup, mayonnaise, viande hachée façon bouchère, pain"],
      ["Bacon", 14.9, "Salade, tomates, oignons, bacon, sauce barbecue, viande hachée façon bouchère, pain"],
      ["Grillon", 15.9, "Galettes de pommes de terre, salade, tomates, oignons, sauce américaine, viande hachée façon bouchère, œuf au plat", "star"],
    ]},
    { id: "salades", label: "Salades & carpaccio", items: [
      ["Salade du Royans", 12.9, "Salade verte, ravioles frites, pommes de terre sautées, St Marcellin, œuf poché, tomates", "veg"],
      ["Salade campagnarde", 8.9, "Salade verte, tomates, lardons, pommes de terre sautées, œuf dur"],
      ["Salade de chèvre chaud", 8.9, "Salade verte, toasts au chèvre, tomates", "veg"],
      ["Carpaccio de bœuf XL", 16.5, "Sauce basilic maison à l'huile d'olive, au choix : parmesan, chèvre ou mozzarella"],
    ]},
  ];

  const euro = (n) => n.toFixed(2).replace(".", ",") + " €";
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  /* ------------------------------------------------------------
     Carte interactive : onglets + recherche + filtre végé
     ------------------------------------------------------------ */
  const phone = matchMedia("(max-width: 600px)");
  const tabsEl = $(".tabs"), listEl = $(".menu__list"), emptyEl = $(".menu__empty");
  const search = $(".search input"), veg = $("[data-veg]");
  let current = "pizzas";

  const pill = document.createElement("span");
  pill.className = "tabs__pill";
  tabsEl.append(pill);
  MENU.forEach((cat) => {
    const b = document.createElement("button");
    b.className = "tab"; b.type = "button"; b.role = "tab"; b.dataset.id = cat.id;
    b.id = "tab-" + cat.id;
    b.setAttribute("aria-controls", "menu-panel");
    b.setAttribute("aria-selected", cat.id === current);
    b.innerHTML = `${cat.label}<sup>${cat.items.length}</sup>`;
    b.addEventListener("click", () => select(cat.id));
    tabsEl.append(b);
  });
  function select(id, focus) {
    current = id; search.value = ""; render();
    const b = $(`.tab[data-id="${id}"]`, tabsEl);
    if (focus) b.focus();
    // défile seulement la rangée d'onglets, pas la page
    tabsEl.scrollTo({ left: b.offsetLeft - (tabsEl.clientWidth - b.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" });
    // téléphone : si on était descendu dans la liste, on remonte en haut de la nouvelle catégorie
    if (phone.matches) {
      // en remontant, l'en-tête réapparaît : on garde sa place + celle des onglets
      const f = $(".menu__filters").getBoundingClientRect();
      const room = tabsEl.offsetHeight + $(".header").offsetHeight + 8;
      if (f.top < room) scrollTo({ top: scrollY + f.top - room, behavior: reduced ? "auto" : "smooth" });
    }
  }
  // clavier : flèches, Début, Fin (motif ARIA « tabs »)
  tabsEl.addEventListener("keydown", (e) => {
    const ids = MENU.map((c) => c.id), i = ids.indexOf(current);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(ids[(next + ids.length) % ids.length], true);
  });

  function movePill() {
    const active = $(`.tab[data-id="${current}"]`, tabsEl);
    pill.style.width = active.offsetWidth + "px";
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
    pill.style.opacity = search.value.trim() ? .35 : 1;
  }

  function highlight(text, q) {
    if (!q) return esc(text);
    const n = norm(text), i = n.indexOf(q);
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
  }

  function render() {
    const q = norm(search.value.trim());
    const onlyVeg = veg.checked;
    // une recherche parcourt toute la carte, sinon on affiche l'onglet actif
    const pool = MENU.filter((c) => q || c.id === current)
      .flatMap((c) => c.items.map(([n, p, d, f]) => [n, p, d, f, q ? c.label : "", c.id]));
    const items = pool.filter(([name, , desc, flag]) =>
      (!onlyVeg || flag === "veg") && (!q || norm(name + " " + desc).includes(q)));

    $$(".tab", tabsEl).forEach((t) => {
      const on = t.dataset.id === current;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
    });
    $("#menu-panel").setAttribute("aria-labelledby", q ? "carte-title" : "tab-" + current);
    listEl.innerHTML = items.map(([name, price, desc, flag, cat, catId], i) => {
      const p = Array.isArray(price)
        ? `<span><small>sauce</small>${euro(price[0])}</span><span><small>gratinées</small>${euro(price[1])}</span>`
        : euro(price);
      const multi = Array.isArray(price) ? " dish__price--multi" : "";
      const tag = flag === "veg" ? '<span class="tag tag--veg">végé</span>' : flag === "star" ? '<span class="tag tag--star">signature</span>' : "";
      return `<article class="dish" style="--i:${i}" data-cat="${catId}" data-n="${i}">
        <div class="dish__top"><h3 class="dish__name">${highlight(name, q)}${tag}</h3><span class="dish__dots"></span><span class="dish__price${multi}">${p}</span></div>
        <p class="dish__desc">${highlight(desc, q)}${q && cat ? ` · <em>${esc(cat)}</em>` : ""}</p>
      </article>`;
    }).join("");
    emptyEl.hidden = items.length > 0;
    movePill();
  }
  search.addEventListener("input", render);
  veg.addEventListener("change", render);
  addEventListener("resize", movePill);
  render();
  document.fonts?.ready.then(movePill);

  /* Aperçu photo qui suit la souris au survol d'un plat (souris uniquement) */
  const PEEK = {
    pizzas: ["pizza-tranches", "pizza-margherita", "pizza-partage"],
    vege: ["pizza-dessus", "pizza-margherita"],
    ravioles: ["pates"], burgers: ["burger"], salades: ["salade"],
  };
  const peek = $(".peek"), peekImg = $(".peek img");
  if (fine && !reduced) {
    let px = 0, py = 0, tx = 0, ty = 0, raf = 0;
    const follow = () => {
      px += (tx - px) * 0.18; py += (ty - py) * 0.18;
      peek.style.setProperty("--x", px + "px"); peek.style.setProperty("--y", py + "px");
      raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.5 ? requestAnimationFrame(follow) : 0;
    };
    listEl.addEventListener("pointermove", (e) => {
      const d = e.target.closest(".dish");
      if (!d) { peek.classList.remove("is-on"); return; }
      const list = PEEK[d.dataset.cat], src = `images/${list[d.dataset.n % list.length]}-480.webp`;
      if (!peekImg.src.endsWith(src)) peekImg.src = src;
      tx = e.clientX + 24; ty = e.clientY - 170;
      if (!peek.classList.contains("is-on")) { px = tx; py = ty; peek.classList.add("is-on"); }
      if (!raf) raf = requestAnimationFrame(follow);
    });
    listEl.addEventListener("pointerleave", () => peek.classList.remove("is-on"));
    addEventListener("scroll", () => peek.classList.remove("is-on"), { passive: true });
  }

  /* ------------------------------------------------------------
     Horaires + badge « ouvert maintenant » (heure de Paris)
     ------------------------------------------------------------ */
  // index 0 = dimanche (comme Date.getDay)
  const HOURS = [
    [["12:00", "14:00"], ["19:00", "21:30"]], // dimanche
    [],                                       // lundi
    [["12:00", "14:00"], ["19:00", "21:30"]],
    [["12:00", "14:00"], ["19:00", "21:30"]],
    [["12:00", "14:00"], ["19:00", "21:30"]],
    [["12:00", "14:00"], ["19:00", "22:30"]],
    [["12:00", "14:00"], ["19:00", "22:30"]],
  ];
  const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const toMin = (h) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const fmt = (h) => h.replace(":00", "h").replace(":", "h");

  function parisNow() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, min: +get("hour") * 60 + +get("minute") };
  }

  function statusText() {
    const { day, min } = parisNow();
    const slot = HOURS[day].find(([o, c]) => min >= toMin(o) && min < toMin(c));
    if (slot) {
      const left = toMin(slot[1]) - min;
      return { open: true, text: left <= 30 ? `Ouvert · ferme bientôt (${fmt(slot[1])})` : `Ouvert · jusqu'à ${fmt(slot[1])}` };
    }
    const later = HOURS[day].find(([o]) => toMin(o) > min);
    if (later) return { open: false, text: `Fermé · ouvre à ${fmt(later[0])}` };
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (HOURS[d].length) return { open: false, text: `Fermé · ouvre ${i === 1 ? "demain" : DAYS[d].toLowerCase()} à ${fmt(HOURS[d][0][0])}` };
    }
  }
  function updateStatus() {
    const s = statusText();
    $$("[data-status]").forEach((el) => {
      el.classList.toggle("is-open", s.open);
      el.classList.toggle("is-closed", !s.open);
      el.querySelector("span").textContent = s.text;
    });
  }
  const rows = $(".hours__rows");
  const today = parisNow().day;
  [1, 2, 3, 4, 5, 6, 0].forEach((d) => {
    const tr = document.createElement("tr");
    if (d === today) tr.className = "is-today";
    if (!HOURS[d].length) tr.classList.add("is-off");
    tr.innerHTML = `<td>${DAYS[d]}</td><td>${HOURS[d].length ? HOURS[d].map(([o, c]) => `${fmt(o)} – ${fmt(c)}`).map((s) => `<span>${s}</span>`).join("") : "Fermé"}</td>`;
    rows.append(tr);
  });
  updateStatus();
  setInterval(updateStatus, 60_000);

  /* ------------------------------------------------------------
     Titre du héro : découpe mot par mot
     ------------------------------------------------------------ */
  const title = $("[data-split]");
  if (title && !reduced) {
    let i = 0;
    const wrap = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(" "); return; }
            const w = document.createElement("span"); w.className = "w";
            const s = document.createElement("span"); s.textContent = part;
            s.style.animationDelay = (INTRO + 0.35 + i++ * 0.07) + "s";
            w.append(s); frag.append(w);
          });
          n.replaceWith(frag);
        } else wrap(n);
      });
    };
    wrap(title);
  }

  /* ------------------------------------------------------------
     Braises qui montent dans le héro (canvas)
     ------------------------------------------------------------ */
  const cv = $(".embers");
  if (cv && !reduced) {
    const ctx = cv.getContext("2d");
    let W, H, dpr, parts = [], running = true;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (init) => ({
      x: W * (0.35 + Math.random() * 0.65), y: init ? Math.random() * H : H + 10,
      r: Math.random() * 2.2 + 0.6, vy: Math.random() * 0.9 + 0.35, vx: (Math.random() - 0.5) * 0.4,
      life: 0, max: 260 + Math.random() * 360, ph: Math.random() * 6.28, hue: 18 + Math.random() * 22,
    });
    resize(); addEventListener("resize", resize);
    const N = innerWidth < 700 ? 35 : 80;
    for (let i = 0; i < N; i++) parts.push(spawn(true));
    new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) loop(); }).observe(cv);
    function loop() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.life++; p.y -= p.vy; p.ph += 0.03; p.x += p.vx + Math.sin(p.ph) * 0.35;
        const a = Math.sin((p.life / p.max) * Math.PI);
        if (p.life > p.max || p.y < -10) Object.assign(p, spawn(false));
        ctx.beginPath();
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue},100%,70%,${a})`);
        g.addColorStop(1, `hsla(${p.hue},100%,50%,0)`);
        ctx.fillStyle = g; ctx.arc(p.x, p.y, p.r * 4, 0, 6.28); ctx.fill();
      }
      requestAnimationFrame(loop);
    }
  }

  /* ------------------------------------------------------------
     Défilement : en-tête, barre de progression, parallaxe, nav active
     ------------------------------------------------------------ */
  const header = $(".header"), bar = $(".progress span"), mobilebar = $(".mobilebar");
  const heroImg = $(".hero__bg img"), parallax = $$("[data-parallax]");
  let lastY = scrollY, ticking = false;
  function onScroll() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("is-scrolled", y > 40);
    header.classList.toggle("is-hidden", y > lastY && y > 500 && !$(".nav").classList.contains("is-open"));
    mobilebar.classList.toggle("is-visible", y > innerHeight * 0.6);
    // onglets de la carte collés sous l'en-tête (téléphone)
    document.documentElement.style.setProperty("--hdr", header.classList.contains("is-hidden") ? "0px" : header.offsetHeight + "px");
    tabsEl.classList.toggle("is-stuck", phone.matches && tabsEl.getBoundingClientRect().top <= header.offsetHeight + 1 && $("#carte").getBoundingClientRect().top < 0);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (!reduced) {
      if (y < innerHeight) heroImg.style.translate = `0 ${y * 0.25}px`;
      parallax.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const off = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.parallax);
        el.style.translate = `0 ${off}px`;
      });
    }
    lastY = y; ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  const navLinks = $$(".nav a");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((a) => { const s = $(a.getAttribute("href")); if (s) spy.observe(s); });

  /* Révélations */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* Compteurs du héro */
  if (!reduced) $$("[data-count]").forEach((el) => {
    const end = +el.dataset.count, t0 = performance.now() + 1400 + INTRO * 1000, dur = 1400;
    el.textContent = "0";
    const step = (t) => {
      const k = Math.min(Math.max((t - t0) / dur, 0), 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  /* ------------------------------------------------------------
     Menu mobile
     ------------------------------------------------------------ */
  const burger = $(".burger"), nav = $(".nav");
  const setNav = (open) => {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
  navLinks.forEach((a) => a.addEventListener("click", () => setNav(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });

  /* ------------------------------------------------------------
     Micro-interactions (souris uniquement)
     ------------------------------------------------------------ */
  if (fine && !reduced) {
    $$(".btn--magnet").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
    $$("[data-tilt]").forEach((c) => {
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-6px)`;
      });
      c.addEventListener("pointerleave", () => { c.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------
     Carte Google : chargée seulement au clic (vie privée)
     ------------------------------------------------------------ */
  $(".map__load").addEventListener("click", function () {
    const f = document.createElement("iframe");
    f.title = "Plan d'accès au restaurant Le Grillon";
    f.loading = "lazy";
    f.referrerPolicy = "no-referrer-when-downgrade";
    f.src = "https://www.google.com/maps?q=" + encodeURIComponent("Le Grillon, Route de l'Aéroport, 38590 Saint-Étienne-de-Saint-Geoirs") + "&output=embed";
    this.replaceWith(f);
  });

  /* ------------------------------------------------------------
     Formulaire : validation, puis ouverture de la messagerie
     (le site d'origine n'a pas de serveur d'envoi ici)
     ------------------------------------------------------------ */
  const form = $(".form"), msg = $(".form__msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    $$("[required]", form).forEach((f) => {
      const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
      f.closest(".field").classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) { msg.style.color = "var(--red-2)"; msg.textContent = "Merci de remplir votre nom, un e-mail valide et votre message."; return; }
    const d = Object.fromEntries(new FormData(form));
    const body = `${d.message}\n\n— ${d.nom}${d.tel ? "\nTél. : " + d.tel : ""}${d.couverts ? "\nNombre de personnes : " + d.couverts : ""}\nE-mail : ${d.email}`;
    location.href = `mailto:legrillon38@orange.fr?subject=${encodeURIComponent(d.objet + " — " + d.nom)}&body=${encodeURIComponent(body)}`;
    msg.style.color = ""; msg.textContent = "Votre messagerie s'ouvre avec le message prêt à partir. Merci !";
  });

  /* Onglets : fondu sur le bord tant qu'il reste des onglets cachés */
  function tabsEdges() {
    const max = tabsEl.scrollWidth - tabsEl.clientWidth;
    tabsEl.classList.toggle("has-more-l", tabsEl.scrollLeft > 4);
    tabsEl.classList.toggle("has-more-r", tabsEl.scrollLeft < max - 4);
  }
  tabsEl.addEventListener("scroll", tabsEdges, { passive: true });
  addEventListener("resize", tabsEdges);
  document.fonts?.ready.then(tabsEdges);
  tabsEdges();

  /* Incontournables : points de pagination du carrousel (téléphone) */
  const sigGrid = $(".sig-grid");
  if (sigGrid) {
    const cards = $$(".sig", sigGrid);
    const dots = document.createElement("div");
    dots.className = "sig-dots"; dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = cards.map(() => "<i></i>").join("");
    sigGrid.after(dots);
    const syncDots = () => {
      const w = cards[0].offsetWidth + (parseFloat(getComputedStyle(sigGrid).columnGap) || 0);
      const n = Math.min(cards.length - 1, Math.round(sigGrid.scrollLeft / w));
      $$("i", dots).forEach((d, i) => d.classList.toggle("is-on", i === n));
    };
    sigGrid.addEventListener("scroll", syncDots, { passive: true });
    syncDots();
  }

  /* Mentions légales + année */
  $$("[data-open='legal']").forEach((b) => b.addEventListener("click", () => $("#legal").showModal()));
  $("[data-year]").textContent = new Date().getFullYear();
})();
