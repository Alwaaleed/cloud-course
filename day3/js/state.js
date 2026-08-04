/* ==========================================================================
   Majal — deck engine: DOM helpers, widget registry, brand chrome, Reveal boot.
   One copy per day (dayN/js/state.js); only the day flag differs.
   ========================================================================== */
window.MAJAL = window.MAJAL || {};

/* ---- tiny DOM helpers --------------------------------------------------- */
MAJAL.el = function (tag, attrs, kids) {
  var e = document.createElement(tag);
  attrs = attrs || {};
  for (var k in attrs) {
    if (k === "class") e.className = attrs[k];
    else if (k === "html") e.innerHTML = attrs[k];
    else if (k === "text") e.textContent = attrs[k];
    else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return e;
};
MAJAL.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) {
  return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

/* ---- widget registry: run a slide's init exactly once when first shown ---
   Only for in-page DOM widgets (<section data-w="id"> + a #id-mount div).
   Prefer the iframe pattern for anything new — see references/widgets.md. */
MAJAL._widgets = {};
MAJAL._inited = {};
MAJAL.widget = function (id, fn) { MAJAL._widgets[id] = fn; };
MAJAL._runSlide = function (section) {
  if (!section) return;
  var id = section.getAttribute("data-w");
  if (!id || MAJAL._inited[id] || !MAJAL._widgets[id]) return;
  MAJAL._inited[id] = true;
  try { MAJAL._widgets[id](section); } catch (e) { console.error("widget " + id + " failed:", e); }
};

/* ---- persistent brand chrome (logo lockup + day flag) ------------------- */
MAJAL.logoIMG = function () {
  return '<img class="logo" src="../MajalLogo.jpg" alt="Majal — Unlocking your tech horizons">' +
         '<a class="backlink" href="../index.html" title="Back to the course">&#8592; Course</a>';
};
MAJAL.mountChrome = function () {
  var b = MAJAL.el("div", { class: "brandmark", html: MAJAL.logoIMG() });
  var d = MAJAL.el("div", { class: "dayflag", text: "DAY 3 · ADDRESSING & PROTECTION" });
  document.body.appendChild(b);
  document.body.appendChild(d);
};

/* ---- boot -------------------------------------------------------------- */
MAJAL.boot = function () {
  MAJAL.mountChrome();

  var deck = new Reveal({
    hash: true,
    slideNumber: "c/t",
    controls: true,
    progress: true,
    center: false,            /* top-aligned slides — the PDF's editorial layout */
    transition: "slide",
    transitionSpeed: "fast",
    width: 1280, height: 720, /* the design canvas every widget is sized against */
    margin: 0.06,
    minScale: 0.2, maxScale: 1.6,
    plugins: [ RevealNotes ]
  });

  /* Stop keydown/keypress from bubbling to Reveal whenever an editable element
     is focused, so typing in an input never jumps slides. */
  ["keydown", "keypress", "keyup"].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        e.stopPropagation();
      }
    }, true);
  });

  deck.on("ready", function (e) { MAJAL._runSlide(e.currentSlide); });
  deck.on("slidechanged", function (e) { MAJAL._runSlide(e.currentSlide); });
  MAJAL.deck = deck;
  deck.initialize();
};

document.addEventListener("DOMContentLoaded", MAJAL.boot);
