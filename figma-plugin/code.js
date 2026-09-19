// Smart CMU Maintenance — Figma screen generator.
// Builds every screen of the web app for mobile and desktop, as UI and as wireframe, and wires prototype interactions.
// Plain ES2017: the Figma plugin sandbox does not need a build step for this file.

figma.showUI(__html__, { width: 360, height: 600 });

figma.ui.onmessage = async function (msg) {
  if (!msg || msg.type !== "build") return;
  try {
    await run(msg);
  } catch (err) {
    console.error(err);
    figma.ui.postMessage({ type: "error", message: err && err.message ? err.message : String(err) });
    figma.notify("สร้างไม่สำเร็จ: " + (err && err.message ? err.message : err), { error: true });
  }
};

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

let MODE = "ui"; // "ui" | "wf"

const PALETTE = {
  ui: {
    brand: "#5B2C83", brandSoft: "#EFE8F5", onBrand: "#FFFFFF",
    ink: "#111111", muted: "#6B6B6B", placeholder: "#8A8A90",
    page: "#F5F5F7", surface: "#FFFFFF", fill: "#EBEBEE", fillStrong: "#DEDEE3", line: "#E8E8EC",
    grayT: "#EEEEF0", grayI: "#4A4A50", blueT: "#E6F0FF", blueI: "#0A58CA",
    orangeT: "#FFF1E0", orangeI: "#9A4A00", greenT: "#E5F6EA", greenI: "#17693A",
    redT: "#FDEAEA", redI: "#B42318", purpleT: "#EFE8F5", purpleI: "#5B2C83",
    star: "#F5A524", photo: "#DDD6CC", photoIcon: "#9C948B", backdrop: "#000000",
    c1: "#5B2C83", c2: "#0A58CA", c3: "#17693A", c4: "#9A4A00", c5: "#B42318", grid: "#E8E8EC",
  },
  wf: {
    brand: "#3F3F3F", brandSoft: "#E3E3E3", onBrand: "#FFFFFF",
    ink: "#1E1E1E", muted: "#7A7A7A", placeholder: "#9A9A9A",
    page: "#F3F3F3", surface: "#FFFFFF", fill: "#E6E6E6", fillStrong: "#CFCFCF", line: "#D4D4D4",
    grayT: "#ECECEC", grayI: "#555555", blueT: "#ECECEC", blueI: "#555555",
    orangeT: "#ECECEC", orangeI: "#555555", greenT: "#ECECEC", greenI: "#555555",
    redT: "#ECECEC", redI: "#555555", purpleT: "#ECECEC", purpleI: "#555555",
    star: "#9A9A9A", photo: "#EDEDED", photoIcon: "#B5B5B5", backdrop: "#000000",
    c1: "#7A7A7A", c2: "#A5A5A5", c3: "#8F8F8F", c4: "#BDBDBD", c5: "#6A6A6A", grid: "#E3E3E3",
  },
};

const CATEGORY = {
  Zap: { name: "ไฟฟ้า", bg: "#FFF4D6", fg: "#8A5A00" },
  Droplets: { name: "ประปา", bg: "#E3F1FB", fg: "#0B5E8E" },
  AirVent: { name: "เครื่องปรับอากาศ", bg: "#E4F4F3", fg: "#0F6B66" },
  Monitor: { name: "อุปกรณ์ IT", bg: "#ECEBFB", fg: "#4338A8" },
  Armchair: { name: "เฟอร์นิเจอร์", bg: "#F7ECE3", fg: "#8A4B1C" },
  Building2: { name: "อาคารและสถานที่", bg: "#EEEEF0", fg: "#4A4A50" },
  Ellipsis: { name: "อื่น ๆ", bg: "#EFE8F5", fg: "#5B2C83" },
};

const TONE = {
  gray: ["grayT", "grayI"], blue: ["blueT", "blueI"], orange: ["orangeT", "orangeI"],
  green: ["greenT", "greenI"], red: ["redT", "redI"], purple: ["purpleT", "purpleI"],
};

function hex(key) {
  if (key.charAt(0) === "#") return key;
  const v = PALETTE[MODE][key];
  if (!v) throw new Error("Unknown color " + key);
  return v;
}
function rgb(h) {
  const n = parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function paint(key, opacity) {
  return [{ type: "SOLID", color: rgb(hex(key)), opacity: opacity == null ? 1 : opacity }];
}
function wf() {
  return MODE === "wf";
}
function radius(n) {
  return wf() ? Math.min(n, 6) : n;
}

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const WEIGHTS = { r: ["Regular"], m: ["Medium", "Regular"], sb: ["SemiBold", "Semi Bold", "Bold", "Medium"], b: ["Bold", "SemiBold", "ExtraBold"] };
const FONT = {};
let FONT_FAMILY = "";

async function loadFonts() {
  const available = await figma.listAvailableFontsAsync();
  const byFamily = {};
  for (const f of available) {
    (byFamily[f.fontName.family] = byFamily[f.fontName.family] || []).push(f.fontName.style);
  }
  const candidates = ["LINE Seed Sans TH", "IBM Plex Sans Thai", "Noto Sans Thai", "Noto Sans Thai Looped", "Prompt", "Inter"];
  FONT_FAMILY = "";
  for (const c of candidates) {
    if (byFamily[c]) {
      FONT_FAMILY = c;
      break;
    }
  }
  if (!FONT_FAMILY) FONT_FAMILY = "Inter";
  const styles = byFamily[FONT_FAMILY] || ["Regular"];
  for (const w of Object.keys(WEIGHTS)) {
    let style = WEIGHTS[w].find(function (s) { return styles.indexOf(s) >= 0; });
    if (!style) style = styles.indexOf("Regular") >= 0 ? "Regular" : styles[0];
    FONT[w] = { family: FONT_FAMILY, style: style };
    await figma.loadFontAsync(FONT[w]);
  }
}

// ---------------------------------------------------------------------------
// Icons (lucide, 24×24 stroke)
// ---------------------------------------------------------------------------

const ICONS = {
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  Zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  Droplets: '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
  AirVent: '<path d="M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 8h12"/><path d="M18.3 17.7a2.5 2.5 0 0 1-3.16 3.83 2.53 2.53 0 0 1-1.14-2V12"/><path d="M6.6 15.6A2 2 0 1 0 10 17v-5"/>',
  Monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  Armchair: '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/>',
  Building2: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  Ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  "map-pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  "image-plus": '<path d="M16 5h6"/><path d="M19 2v6"/><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><circle cx="9" cy="9" r="2"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  sheet: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  question: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/>',
  "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  "x-circle": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
};

let ICON_CACHE = {};
let ICON_HOLDER = null;

function icon(parent, name, size, colorKey, opts) {
  opts = opts || {};
  const stroke = hex(colorKey || "ink");
  const fill = opts.fill ? hex(opts.fill) : "none";
  const key = [name, size, stroke, fill, opts.sw || 2].join("|");
  let master = ICON_CACHE[key];
  if (!master) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="' + fill +
      '" stroke="' + stroke + '" stroke-width="' + (opts.sw || 2) + '" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[name] || ICONS.info) + "</svg>";
    master = figma.createNodeFromSvg(svg);
    master.fills = [];
    master.clipsContent = false;
    if (size !== 24) master.rescale(size / 24);
    master.name = "icon/" + name;
    ICON_HOLDER.appendChild(master);
    ICON_CACHE[key] = master;
  }
  const n = master.clone();
  parent.appendChild(n);
  return n;
}

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

function pad(p) {
  if (p == null) return [0, 0, 0, 0];
  if (typeof p === "number") return [p, p, p, p];
  if (p.length === 2) return [p[0], p[1], p[0], p[1]];
  return p;
}

// Auto-layout frame. dir: "v" | "h".
function box(o) {
  o = o || {};
  const f = figma.createFrame();
  f.name = o.name || (o.dir === "h" ? "Row" : "Stack");
  f.layoutMode = o.dir === "h" ? "HORIZONTAL" : "VERTICAL";
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = o.gap || 0;
  const p = pad(o.p);
  f.paddingTop = p[0];
  f.paddingRight = p[1];
  f.paddingBottom = p[2];
  f.paddingLeft = p[3];
  f.fills = o.fill ? paint(o.fill, o.op) : [];
  if (o.r) f.cornerRadius = radius(o.r);
  if (o.stroke) {
    f.strokes = paint(o.stroke);
    f.strokeWeight = o.sw || 1;
    f.strokeAlign = "INSIDE";
  }
  f.primaryAxisAlignItems = o.main || "MIN";
  f.counterAxisAlignItems = o.cross || (o.dir === "h" ? "CENTER" : "MIN");
  f.clipsContent = !!o.clip;
  if (o.w) {
    f.layoutSizingHorizontal = "FIXED";
    f.resize(o.w, f.height);
  }
  if (o.h) {
    f.layoutSizingVertical = "FIXED";
    f.resize(f.width, o.h);
  }
  return f;
}

// Append child to an auto-layout parent and set its sizing.
function put(parent, child, o) {
  parent.appendChild(child);
  o = o || {};
  if (o.fillW) child.layoutSizingHorizontal = "FILL";
  if (o.fillH) child.layoutSizingVertical = "FILL";
  if (o.grow) child.layoutGrow = 1;
  return child;
}

function text(parent, s, o) {
  o = o || {};
  const t = figma.createText();
  t.fontName = FONT[o.w || "r"];
  t.fontSize = o.size || 15;
  t.characters = String(s);
  t.fills = paint(o.c || "ink");
  t.lineHeight = { unit: "PERCENT", value: o.lh || 150 };
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.strike) t.textDecoration = "STRIKETHROUGH";
  parent.appendChild(t);
  if (o.fillW) {
    t.layoutSizingHorizontal = "FILL";
    t.textAutoResize = "HEIGHT";
  } else if (o.grow) {
    t.layoutGrow = 1;
    t.textAutoResize = "HEIGHT";
  }
  return t;
}

function rect(parent, w, h, colorKey, r) {
  const n = figma.createRectangle();
  n.resize(w, h);
  n.fills = paint(colorKey);
  if (r) n.cornerRadius = r;
  parent.appendChild(n);
  return n;
}

function circle(parent, size, colorKey, o) {
  o = o || {};
  const f = box({ name: o.name || "Circle", main: "CENTER", cross: "CENTER", fill: colorKey, w: size, h: size });
  f.cornerRadius = size / 2;
  if (o.stroke) {
    f.strokes = paint(o.stroke);
    f.strokeWeight = o.sw || 2;
    f.strokeAlign = "INSIDE";
  }
  parent.appendChild(f);
  return f;
}

function spacer(parent, h) {
  const f = box({ name: "Spacer", h: h });
  put(parent, f, { fillW: true });
  return f;
}

function shadow(node, y, blur, opacity) {
  if (wf()) return;
  node.effects = [{ type: "DROP_SHADOW", color: { r: 0.07, g: 0.07, b: 0.07, a: opacity }, offset: { x: 0, y: y }, radius: blur, spread: 0, visible: true, blendMode: "NORMAL" }];
}

// ---------------------------------------------------------------------------
// Prototype links
// ---------------------------------------------------------------------------

let LINKS = [];
let SCREENS = {};
let WIRE_FAILED = [];

// Links name a screen by its base key ("R10"); the current device picks the frame ("R10" or "R10d").
function link(node, to) {
  if (to) LINKS.push({ node: node, to: K(to) });
  return node;
}

// The screen frame a node belongs to (the frame whose parent is the page or a section).
function screenOf(node) {
  let n = node;
  while (n.parent && n.parent.type !== "PAGE" && n.parent.type !== "SECTION") n = n.parent;
  return n;
}
function sectionOf(node) {
  let n = node.parent;
  while (n && n.type !== "SECTION" && n.type !== "PAGE") n = n.parent;
  return n;
}

async function wire(page, flows) {
  let count = 0;
  const failed = [];
  const byNode = new Map();
  for (const l of LINKS) {
    const dest = SCREENS[l.to];
    if (!dest || l.node.removed) continue;
    // Figma rejects NAVIGATE to the frame the click starts in (e.g. the active tab on its own screen).
    if (screenOf(l.node) === dest) continue;
    // Each section is a self-contained flow; a link that leaves it may not be clickable when presenting.
    if (sectionOf(l.node) !== sectionOf(dest)) {
      failed.push(screenOf(l.node).name.split(" · ")[0] + " → " + l.to + " (ข้ามกลุ่ม)");
      continue;
    }
    byNode.set(l.node, l.to); // last link wins for a node
  }
  for (const entry of byNode) {
    const node = entry[0];
    const dest = SCREENS[entry[1]];
    const reactions = [
      {
        trigger: { type: "ON_CLICK" },
        actions: [
          {
            type: "NODE",
            destinationId: dest.id,
            navigation: "NAVIGATE",
            transition: { type: "DISSOLVE", easing: { type: "EASE_OUT" }, duration: 0.25 },
          },
        ],
      },
    ];
    // One rejected link must not abort the whole build: skip it and report it at the end.
    try {
      if (typeof node.setReactionsAsync === "function") await node.setReactionsAsync(reactions);
      else node.reactions = reactions;
      count++;
    } catch (err) {
      console.warn("Skipped interaction", node.name, "→", entry[1], err);
      failed.push(screenOf(node).name.split(" · ")[0] + " " + node.name + " → " + entry[1]);
    }
  }
  WIRE_FAILED = failed;
  try {
    page.flowStartingPoints = flows
      .filter(function (f) { return SCREENS[f[0]]; })
      .map(function (f) { return { nodeId: SCREENS[f[0]].id, name: f[1] }; });
  } catch (e) {
    console.warn("flowStartingPoints", e);
  }
  return count;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function card(parent, o) {
  o = o || {};
  const f = box({ name: o.name || "Card", dir: o.dir, gap: o.gap == null ? 12 : o.gap, p: o.p == null ? 16 : o.p, fill: o.fill || "surface", r: o.r || 16, stroke: wf() ? "line" : null, cross: o.cross, main: o.main });
  put(parent, f, { fillW: o.hug ? false : true });
  return f;
}

function sectionTitle(parent, s) {
  const t = text(parent, s, { size: 13, w: "m", c: "muted" });
  return t;
}

// variant: primary | secondary | danger | soft | ghost; size: sm | md | lg
function button(parent, label, o) {
  o = o || {};
  const v = o.v || "primary";
  const h = o.size === "lg" ? 56 : o.size === "sm" ? 40 : 48;
  const styles = {
    primary: ["brand", "onBrand"],
    secondary: ["fill", "ink"],
    danger: ["redT", "redI"],
    soft: ["brandSoft", "brand"],
    ghost: [null, "brand"],
    green: ["greenT", "greenI"],
  };
  const s = styles[v];
  const b = box({ name: "Button/" + label, dir: "h", gap: 8, p: [0, o.size === "sm" ? 14 : 20], main: "CENTER", cross: "CENTER", fill: s[0], r: o.size === "lg" ? 14 : 12, h: h });
  if (wf() && v !== "primary") {
    b.strokes = paint("fillStrong");
    b.strokeWeight = 1;
  }
  if (o.icon) icon(b, o.icon, o.size === "sm" ? 16 : 18, s[1]);
  text(b, label, { size: o.size === "lg" ? 16 : o.size === "sm" ? 14 : 15, w: "sb", c: s[1] });
  put(parent, b, { fillW: !!o.block, grow: !!o.grow });
  if (o.to) link(b, o.to);
  return b;
}

function linkText(parent, label, to, o) {
  o = o || {};
  const f = box({ name: "Link/" + label, dir: "h", gap: 4, p: [10, 4], cross: "CENTER" });
  if (o.icon) icon(f, o.icon, o.iconSize || 18, o.c || "brand");
  text(f, label, { size: o.size || 15, w: "sb", c: o.c || "brand" });
  parent.appendChild(f);
  if (to) link(f, to);
  return f;
}

function pill(parent, label, tone) {
  const t = TONE[tone || "gray"];
  const f = box({ name: "Pill/" + label, dir: "h", p: [2, 10], fill: t[0], r: 999, cross: "CENTER" });
  f.cornerRadius = 999;
  text(f, label, { size: 12, w: "sb", c: t[1], lh: 160 });
  parent.appendChild(f);
  return f;
}

const STATUS = {
  pending: ["รอรับเรื่อง", "gray"],
  accepted: ["รับเรื่องแล้ว", "blue"],
  assigned: ["มอบหมายช่างแล้ว", "blue"],
  in_progress: ["กำลังซ่อม", "blue"],
  waiting_parts: ["รออะไหล่", "orange"],
  need_info: ["ขอข้อมูลเพิ่มเติม", "orange"],
  completed: ["ซ่อมเสร็จ รอยืนยัน", "green"],
  closed: ["ปิดงาน", "green"],
  cancelled: ["ยกเลิก", "red"],
  rejected: ["ปฏิเสธ", "red"],
};
function statusPill(parent, status) {
  return pill(parent, STATUS[status][0], STATUS[status][1]);
}
function urgencyPill(parent, u) {
  if (u === "urgent") return pill(parent, "ด่วนมาก", "red");
  if (u === "low") return pill(parent, "ไม่ด่วน", "gray");
  return pill(parent, "ปกติ", "purple");
}

function catIcon(parent, name, size) {
  const px = size === "sm" ? 32 : size === "lg" ? 48 : 40;
  const c = CATEGORY[name];
  const f = box({ name: "CategoryIcon/" + name, main: "CENTER", cross: "CENTER", w: px, h: px });
  f.fills = wf() ? paint("fill") : paint(c.bg);
  f.cornerRadius = radius(px === 48 ? 14 : px === 32 ? 9 : 11);
  icon(f, name, px === 32 ? 16 : px === 48 ? 24 : 20, wf() ? "muted" : c.fg);
  parent.appendChild(f);
  return f;
}

function photo(parent, size, o) {
  o = o || {};
  const f = box({ name: "Photo", main: "CENTER", cross: "CENTER", fill: "photo", w: size, h: size, r: 12 });
  if (wf()) {
    f.strokes = paint("fillStrong");
    f.strokeWeight = 1;
    const x = figma.createNodeFromSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '"><line x1="0" y1="0" x2="' + size + '" y2="' + size + '" stroke="#C4C4C4"/><line x1="' + size + '" y1="0" x2="0" y2="' + size + '" stroke="#C4C4C4"/></svg>',
    );
    x.fills = [];
    put(f, x);
    x.layoutPositioning = "ABSOLUTE";
    x.x = 0;
    x.y = 0;
  } else {
    icon(f, "image", Math.round(size / 3.2), "photoIcon");
  }
  if (o.overlay) {
    const ov = box({ name: "Uploading", main: "CENTER", cross: "CENTER", fill: "#000000", op: 0.45, gap: 4, w: size, h: size, r: 12 });
    put(f, ov);
    ov.layoutPositioning = "ABSOLUTE";
    ov.x = 0;
    ov.y = 0;
    const ring = circle(ov, 36, "#FFFFFF", {});
    ring.fills = [];
    ring.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.9 }];
    ring.strokeWeight = 4;
    text(ov, o.overlay, { size: 11, w: "sb", c: "#FFFFFF" });
  }
  parent.appendChild(f);
  return f;
}

function photoGrid(parent, count, size, o) {
  o = o || {};
  const g = box({ name: "Photos", dir: "h", gap: 10 });
  for (let i = 0; i < count; i++) photo(g, size, { overlay: o.uploadingIndex === i ? "กำลังอัปโหลด" : null });
  if (o.addTile) {
    const a = box({ name: "AddPhoto", main: "CENTER", cross: "CENTER", gap: 2, fill: "surface", w: size, h: size, r: 12 });
    if (wf()) {
      a.strokes = paint("fillStrong");
      a.dashPattern = [4, 4];
    }
    icon(a, "image-plus", 24, "brand");
    text(a, "เลือกรูป", { size: 13, w: "sb", c: "brand" });
    text(a, o.addTile, { size: 11, c: "muted" });
    g.appendChild(a);
  }
  put(parent, g, { fillW: true });
  return g;
}

function progressBar(parent, fraction, width, colorKey) {
  const track = box({ name: "Progress", dir: "h", fill: "fill", h: 6, r: 3 });
  track.cornerRadius = 3;
  put(parent, track, { fillW: true });
  rect(track, Math.max(6, Math.round(width * fraction)), 6, colorKey || "brand", 3);
  return track;
}

function input(parent, o) {
  const wrap = box({ name: "Field/" + (o.label || o.placeholder || "input"), gap: 6 });
  put(parent, wrap, { fillW: true });
  if (o.label) {
    const l = box({ name: "Label", dir: "h", gap: 4 });
    text(l, o.label, { size: 14, w: "sb" });
    if (o.optional) text(l, "(ไม่บังคับ)", { size: 14, c: "muted" });
    wrap.appendChild(l);
  }
  const multi = !!o.multiline;
  const field = box({ name: "Input", dir: multi ? "v" : "h", gap: 8, p: multi ? [12, 14] : [0, 14], fill: "surface", r: 12, cross: multi ? "MIN" : "CENTER" });
  if (wf()) {
    field.strokes = paint("fillStrong");
    field.strokeWeight = 1;
  }
  if (o.focus && !wf()) {
    field.strokes = paint("brand");
    field.strokeWeight = 2;
  }
  put(wrap, field, { fillW: true });
  if (!multi) {
    field.layoutSizingVertical = "FIXED";
    field.resize(field.width, 48);
  }
  if (o.leading) icon(field, o.leading, 18, "muted");
  const t = text(field, o.value || o.placeholder || "", { size: 16, c: o.value ? "ink" : "placeholder" });
  if (multi) {
    t.layoutSizingHorizontal = "FILL";
    t.textAutoResize = "HEIGHT";
    field.minHeight = o.minHeight || 104;
  } else {
    t.layoutGrow = 1;
  }
  if (o.suffix) text(field, o.suffix, { size: 16, c: "muted" });
  if (o.trailing) icon(field, o.trailing, 18, "muted");
  if (o.hint) text(wrap, o.hint, { size: 13, c: "muted", fillW: true });
  if (o.error) text(wrap, o.error, { size: 13, c: "redI", fillW: true });
  return wrap;
}

function segmented(parent, options, active, o) {
  o = o || {};
  const s = box({ name: "Segmented", dir: "h", gap: 4, p: 4, fill: "fill", r: 12 });
  put(parent, s, { fillW: o.hug ? false : true });
  options.forEach(function (label, i) {
    const on = i === active;
    const it = box({ name: "Segment/" + label, dir: "h", main: "CENTER", cross: "CENTER", p: [0, o.hug ? 16 : 12], r: 9, h: 40, fill: on ? "surface" : null, gap: 4 });
    if (on) shadow(it, 1, 3, 0.08);
    const parts = String(label).split("|");
    text(it, parts[0], { size: 14, w: "sb", c: on ? "ink" : "muted" });
    if (parts[1]) text(it, parts[1], { size: 12, w: "m", c: "muted" });
    put(s, it, { grow: !o.hug });
    if (o.links && o.links[i]) link(it, o.links[i]);
  });
  return s;
}

function groupList(parent, title) {
  const wrap = box({ name: "GroupedList" + (title ? "/" + title : ""), gap: 6 });
  put(parent, wrap, { fillW: true });
  if (title) {
    const h = box({ name: "Title", p: [0, 16] });
    text(h, title, { size: 13, w: "m", c: "muted" });
    put(wrap, h, { fillW: true });
  }
  const list = box({ name: "Rows", fill: "surface", r: 16, clip: true, stroke: wf() ? "line" : null });
  put(wrap, list, { fillW: true });
  return list;
}

// row options: cat, iconName, label, detail, check, chevron, trailing(fn), to, labelColor
function listRow(list, o) {
  const r = box({ name: "Row/" + o.label, dir: "h", gap: 12, p: [12, 16], cross: "CENTER" });
  r.strokes = paint("line");
  r.strokeAlign = "INSIDE";
  r.strokeTopWeight = 0;
  r.strokeLeftWeight = 0;
  r.strokeRightWeight = 0;
  r.strokeBottomWeight = o.last ? 0 : 1;
  put(list, r, { fillW: true });
  r.minHeight = 52;
  if (o.cat) catIcon(r, o.cat, o.catSize || "sm");
  if (o.iconName) icon(r, o.iconName, 20, o.iconColor || "muted");
  const t = box({ name: "Text", gap: 2 });
  put(r, t, { grow: true });
  text(t, o.label, { size: 15, w: o.bold ? "sb" : "r", c: o.labelColor || "ink", fillW: true });
  if (o.detail) text(t, o.detail, { size: 13, c: "muted", fillW: true });
  if (o.trailing) o.trailing(r);
  if (o.check) icon(r, "check", 20, "brand", { sw: 2.5 });
  if (o.chevron) icon(r, "chevron-right", 18, "placeholder");
  if (o.to) link(r, o.to);
  return r;
}

function checkbox(parent, checked) {
  const f = box({ name: "Checkbox", main: "CENTER", cross: "CENTER", w: 20, h: 20, r: 5, fill: checked ? "brand" : "surface" });
  if (!checked) {
    f.strokes = paint("fillStrong");
    f.strokeWeight = 2;
  } else {
    icon(f, "check", 14, "onBrand", { sw: 3 });
  }
  parent.appendChild(f);
  return f;
}

// ---------------------------------------------------------------------------
// Screen scaffolding: every screen is built for mobile (390 × 844) and desktop (1440 × 900)
// ---------------------------------------------------------------------------

const MW = 390;
const MH = 844;
const DW = 1440;
const DH = 900;
const SIDEBAR_W = 248;
const DESK_W = DW - SIDEBAR_W - 64; // content width next to the sidebar

let DEVICE = "m"; // "m" | "d"
let CUR_W = MW - 40; // width of the current content column

function isD() {
  return DEVICE === "d";
}
function K(key) {
  return isD() ? key + "d" : key;
}
// Desktop columns carry no side padding of their own.
function hp(p) {
  const q = pad(p).slice();
  if (isD()) {
    q[1] = 0;
    q[3] = 0;
  }
  return q;
}

const NAV = {
  reporter: {
    sub: "นักศึกษา",
    person: "อนันต์ ศรีวงศ์",
    logout: "R01",
    cta: ["แจ้งซ่อม", "R04"],
    items: [["home", "house", "หน้าแรก", "R03"], ["history", "history", "ประวัติการแจ้งซ่อม", "R13"], ["notif", "bell", "แจ้งเตือน", "R14", 2], ["profile", "user", "โปรไฟล์", "R15"]],
  },
  tech: {
    sub: "ช่างซ่อมบำรุง",
    person: "ช่างสมศักดิ์ ใจดี",
    logout: "T00",
    items: [["jobs", "briefcase", "งานของฉัน", "T01"], ["notif", "bell", "แจ้งเตือน", "T04", 1], ["profile", "user", "โปรไฟล์", "T05"]],
  },
  admin: {
    sub: "เมนูผู้ดูแลระบบ",
    person: "พรทิพย์ วงศ์ใหญ่",
    logout: "A00",
    items: [["dash", "grid", "แดชบอร์ด", "A01"], ["requests", "clipboard", "คำร้องทั้งหมด", "A02", 6], ["settings", "database", "ข้อมูลพื้นฐาน", "A04"]],
  },
};

// o: { role, nav, tabs, colW, center, action: [label, to] }
function screen(key, title, o) {
  o = o || {};
  const name = K(key) + " · " + title;
  if (!isD()) {
    const f = box({ name: name, fill: "page", clip: true, w: MW });
    statusBar(f);
    if (o.role === "admin") adminTopBar(f, o.nav);
    SCREENS[K(key)] = f;
    CUR_W = MW - 40;
    return { frame: f, col: f, o: o };
  }
  const f = box({ name: name, dir: "h", fill: "page", clip: true, cross: "MIN", w: DW });
  SCREENS[K(key)] = f;
  if (o.role) sidebar(f, o.role, o.nav);
  const main = box({ name: "Main", p: [28, 32, 40, 32], cross: o.center ? "CENTER" : "MIN" });
  put(f, main, { grow: true });
  const w = o.colW || 820;
  const col = box({ name: "Column", w: w });
  main.appendChild(col);
  CUR_W = w;
  return { frame: f, col: col, o: o };
}

// Short screens fill the device; tall ones scroll vertically in the prototype.
function finish(s) {
  const f = s.frame;
  const o = s.o || {};
  let bar = null;
  if (isD() && o.action) {
    spacer(s.col, 8);
    button(s.col, o.action[0], { size: "lg", block: true, to: o.action[1] });
  }
  if (!isD() && o.action) bar = formActionBar(f, o.action[0], o.action[1]);
  if (!isD() && o.tabs) bar = tabBar(f, o.role, o.nav);
  const H = isD() ? DH : MH;
  if (f.height < H) {
    if (!isD()) {
      const sp = box({ name: "Fill" });
      f.insertChild(bar ? f.children.length - 1 : f.children.length, sp);
      sp.layoutSizingHorizontal = "FILL";
      f.primaryAxisSizingMode = "FIXED";
      f.resize(MW, MH);
      sp.layoutGrow = 1;
    } else {
      f.counterAxisSizingMode = "FIXED";
      f.resize(DW, DH);
    }
  } else {
    f.overflowDirection = "VERTICAL";
  }
  return f;
}

function statusBar(parent) {
  const s = box({ name: "Status bar", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER", p: [0, 26], h: 44 });
  put(parent, s, { fillW: true });
  text(s, "9:41", { size: 15, w: "sb" });
  const right = box({ name: "Indicators", dir: "h", gap: 5, cross: "CENTER" });
  rect(right, 17, 11, "ink", 2);
  rect(right, 15, 11, "ink", 2);
  const bat = box({ name: "Battery", dir: "h", p: 2, r: 3, w: 25, h: 12 });
  bat.strokes = paint("ink");
  bat.strokeWeight = 1;
  rect(bat, 17, 8, "ink", 1.5);
  right.appendChild(bat);
  s.appendChild(right);
}

function body(parent, o) {
  o = o || {};
  const b = box({ name: "Content", gap: o.gap == null ? 20 : o.gap, p: hp(o.p == null ? [8, 20, 24, 20] : o.p) });
  put(parent, b, { fillW: true });
  return b;
}

// Two columns on desktop; on mobile both return the same stack so call order is the stacking order.
function twoCols(parent, leftW) {
  if (!isD()) return [parent, parent];
  const row = box({ name: "Two columns", dir: "h", gap: 24, cross: "MIN" });
  put(parent, row, { fillW: true });
  const l = box({ name: "Left", gap: 18, w: leftW });
  row.appendChild(l);
  const r = box({ name: "Right", gap: 18 });
  put(row, r, { grow: true });
  return [l, r];
}

function pageHeader(parent, o) {
  const h = box({ name: "Header", gap: 2, p: hp([o.large ? 12 : 8, 20, 4, 20]) });
  put(parent, h, { fillW: true });
  if (o.back) linkText(h, o.back[0], o.back[1], { icon: "chevron-left", iconSize: 22 });
  const row = box({ name: "Title row", dir: "h", gap: 12, cross: "CENTER" });
  put(h, row, { fillW: true });
  const t = box({ name: "Titles", gap: 2 });
  put(row, t, { grow: true });
  text(t, o.title, { size: o.large ? 28 : 22, w: "b", fillW: true, lh: 130 });
  if (o.subtitle) text(t, o.subtitle, { size: 15, c: "muted", fillW: true });
  if (o.bell) bellButton(row, o.bell[0], o.bell[1]);
  return h;
}

function bellButton(parent, unread, to) {
  const b = box({ name: "Bell", main: "CENTER", cross: "CENTER", w: 44, h: 44, fill: "surface" });
  b.cornerRadius = 22;
  icon(b, "bell", 20, "ink");
  if (unread) {
    const badge = box({ name: "Badge", main: "CENTER", cross: "CENTER", fill: "redI", p: [0, 5], h: 18 });
    badge.cornerRadius = 9;
    text(badge, String(unread), { size: 11, w: "b", c: "#FFFFFF", lh: 120 });
    put(b, badge);
    badge.layoutPositioning = "ABSOLUTE";
    badge.x = 24;
    badge.y = 4;
  }
  parent.appendChild(b);
  link(b, to);
  return b;
}

function tabBar(f, role, active) {
  const bar = box({ name: "Tab bar", dir: "h", fill: "surface", p: [6, 8, 22, 8], cross: "CENTER" });
  bar.strokes = paint("line");
  bar.strokeTopWeight = 1;
  bar.strokeBottomWeight = 0;
  bar.strokeLeftWeight = 0;
  bar.strokeRightWeight = 0;
  put(f, bar, { fillW: true });
  const items =
    role === "tech"
      ? [["jobs", "briefcase", "งานของฉัน", "T01"], ["notif", "bell", "แจ้งเตือน", "T04"], ["profile", "user", "โปรไฟล์", "T05"]]
      : [["home", "house", "หน้าแรก", "R03"], ["history", "history", "ประวัติ", "R13"], ["new", "plus", "", "R04"], ["notif", "bell", "แจ้งเตือน", "R14"], ["profile", "user", "โปรไฟล์", "R15"]];
  items.forEach(function (it) {
    const on = it[0] === active;
    const cell = box({ name: "Tab/" + (it[2] || "แจ้งซ่อม"), main: "CENTER", cross: "CENTER", gap: 2, h: 52 });
    put(bar, cell, { grow: true });
    if (it[0] === "new") {
      const plus = circle(cell, 52, "brand");
      icon(plus, "plus", 26, "onBrand", { sw: 2.4 });
      shadow(plus, 6, 16, 0.25);
    } else {
      icon(cell, it[1], 22, on ? "brand" : "muted", { sw: on ? 2.4 : 2 });
      text(cell, it[2], { size: 11, w: "sb", c: on ? "brand" : "muted", lh: 130 });
    }
    link(cell, it[3]);
  });
  return bar;
}

// FastFix CMU brand images, embedded so the plugin works offline. Regenerate from public/brand if the logo changes.
const BRAND = {
  icon: "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",
  word: "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",
  wordWhite: "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",
};
const BRAND_HASH = {};

/** The real logo image in the UI set; the wireframe set keeps a plain grey block of the same size. */
function brandImage(parent, key, w, h, name) {
  if (!BRAND_HASH[key]) BRAND_HASH[key] = figma.createImage(figma.base64Decode(BRAND[key])).hash;
  const r = figma.createRectangle();
  r.name = name;
  r.resize(w, h);
  r.fills = [{ type: "IMAGE", imageHash: BRAND_HASH[key], scaleMode: "FIT" }];
  parent.appendChild(r);
  return r;
}

function brandMark(parent, size) {
  if (!wf()) return brandImage(parent, "icon", size, size, "FastFix CMU icon");
  const tile = box({ name: "Mark", main: "CENTER", cross: "CENTER", w: size, h: size, r: size > 38 ? 11 : 10, fill: "brand" });
  icon(tile, "wrench", Math.round(size / 2), "onBrand");
  parent.appendChild(tile);
  return tile;
}

function navBadge(parent, n) {
  const badge = box({ name: "Badge", main: "CENTER", cross: "CENTER", fill: "redI", p: [0, 7], h: 22 });
  badge.cornerRadius = 11;
  text(badge, String(n), { size: 12, w: "b", c: "#FFFFFF", lh: 120 });
  parent.appendChild(badge);
}

// Desktop left sidebar for any role (matches AppSidebar / AdminSidebar in the web app).
function sidebar(parent, role, active) {
  const nav = NAV[role];
  const s = box({ name: "Sidebar", gap: 4, p: [20, 12, 20, 12], fill: "surface", w: SIDEBAR_W });
  if (wf()) {
    s.strokes = paint("line");
    s.strokeRightWeight = 1;
    s.strokeLeftWeight = 0;
    s.strokeTopWeight = 0;
    s.strokeBottomWeight = 0;
  }
  put(parent, s, { fillH: true });
  const top = box({ name: "Brand", dir: "h", gap: 10, cross: "CENTER", p: [0, 8, 20, 8] });
  put(s, top, { fillW: true });
  brandMark(top, 40);
  const tt = box({ name: "Name" });
  put(top, tt, { grow: true });
  text(tt, "FastFix CMU", { size: 15, w: "b", lh: 130 });
  text(tt, nav.sub, { size: 12, c: "muted", lh: 130 });
  if (nav.cta) {
    button(s, nav.cta[0], { icon: "plus", block: true, to: nav.cta[1] });
    spacer(s, 12);
  }
  nav.items.forEach(function (it) {
    const on = it[0] === active;
    const row = box({ name: "Nav/" + it[2], dir: "h", gap: 12, p: [0, 12], h: 44, r: 12, cross: "CENTER", fill: on ? "brandSoft" : null });
    put(s, row, { fillW: true });
    icon(row, it[1], 20, on ? "brand" : "ink");
    text(row, it[2], { size: 15, w: "sb", c: on ? "brand" : "ink", grow: true });
    if (it[4]) navBadge(row, it[4]);
    link(row, it[3]);
  });
  const fill = box({ name: "Fill" });
  put(s, fill, { fillW: true });
  fill.layoutGrow = 1;
  const foot = box({ name: "Account", gap: 4, p: [12, 8, 0, 8] });
  foot.strokes = paint("line");
  foot.strokeTopWeight = 1;
  foot.strokeBottomWeight = 0;
  foot.strokeLeftWeight = 0;
  foot.strokeRightWeight = 0;
  put(s, foot, { fillW: true });
  text(foot, nav.person, { size: 14, w: "sb" });
  const out = box({ name: "Logout", dir: "h", gap: 10, h: 40, cross: "CENTER" });
  put(foot, out, { fillW: true });
  icon(out, "log-out", 18, "redI");
  text(out, "ออกจากระบบ", { size: 15, w: "sb", c: "redI" });
  link(out, nav.logout);
  return s;
}

// Mobile admin navigation: a top bar (the web app's AdminSidebar collapses to this under 768 px).
function adminTopBar(f, active) {
  const bar = box({ name: "Admin top bar", dir: "h", gap: 4, p: [8, 12], h: 64, fill: "surface", cross: "CENTER", clip: true });
  bar.strokes = paint("line");
  bar.strokeBottomWeight = 1;
  bar.strokeTopWeight = 0;
  bar.strokeLeftWeight = 0;
  bar.strokeRightWeight = 0;
  put(f, bar, { fillW: true });
  brandMark(bar, 36);
  spacer4(bar);
  // Three equal icon-over-label buttons with short labels, so all fit at 360 px (same as the web app).
  const SHORT = { dash: "แดชบอร์ด", requests: "คำร้อง", settings: "ข้อมูล" };
  NAV.admin.items.forEach(function (it) {
    const on = it[0] === active;
    const item = box({ name: "Nav/" + it[2], gap: 2, p: [4, 4], h: 48, r: 12, main: "CENTER", cross: "CENTER", fill: on ? "brandSoft" : null });
    const top = box({ name: "Icon", dir: "h", gap: 2, cross: "CENTER" });
    icon(top, it[1], 18, on ? "brand" : "ink");
    if (it[4]) navBadge(top, it[4]);
    item.appendChild(top);
    text(item, SHORT[it[0]] || it[2], { size: 12, w: "sb", c: on ? "brand" : "ink" });
    put(bar, item, { grow: true });
    link(item, it[3]);
  });
  const out = box({ name: "Logout", main: "CENTER", cross: "CENTER", w: 44, h: 44, r: 12 });
  icon(out, "log-out", 18, "redI");
  bar.appendChild(out);
  link(out, "A00");
  return bar;
}

function spacer4(parent) {
  const f = box({ name: "Gap", w: 4, h: 4 });
  parent.appendChild(f);
}

// Mobile bottom action bar of the request form.
function formActionBar(f, label, to) {
  const a = box({ name: "Action bar", p: [12, 20, 28, 20], fill: "page" });
  put(f, a, { fillW: true });
  button(a, label, { size: "lg", block: true, to: to });
  return a;
}

// Bottom sheet (mobile) or floating dialog (desktop) over a dimmed copy of the base screen.
function sheetScreen(key, title, baseKey, build, o) {
  o = o || {};
  const W = isD() ? DW : MW;
  const H = isD() ? DH : MH;
  const base = SCREENS[K(baseKey)];
  const f = figma.createFrame();
  f.name = K(key) + " · " + title + " (sheet)";
  f.resize(W, H);
  f.fills = paint("page");
  f.clipsContent = true;
  const bg = base.clone();
  f.appendChild(bg);
  bg.x = 0;
  bg.y = 0;
  bg.name = "Background · " + base.name;
  const dim = figma.createRectangle();
  dim.name = "Backdrop";
  dim.resize(W, H);
  dim.fills = paint("backdrop", 0.35);
  f.appendChild(dim);
  const sw = isD() ? (o.wide ? 560 : 440) : MW;
  const sheet = box({ name: "Bottom sheet", gap: 14, p: [isD() ? 20 : 8, 20, isD() ? 24 : 28, 20], fill: "page", w: sw });
  if (isD()) {
    sheet.cornerRadius = radius(20);
    shadow(sheet, 12, 40, 0.18);
  } else {
    sheet.topLeftRadius = radius(20);
    sheet.topRightRadius = radius(20);
  }
  f.appendChild(sheet);
  if (!isD()) {
    const grab = box({ name: "Grabber", dir: "h", main: "CENTER" });
    put(sheet, grab, { fillW: true });
    rect(grab, 36, 4, "fillStrong", 2);
  }
  build(sheet);
  sheet.x = isD() ? Math.round((W - sw) / 2) : 0;
  sheet.y = H - sheet.height - (isD() ? 24 : 0);
  SCREENS[K(key)] = f;
  return f;
}

function sheetHeader(sheet, title, desc, closeTo) {
  const row = box({ name: "Sheet header", dir: "h", gap: 12, cross: "MIN" });
  put(sheet, row, { fillW: true });
  const t = box({ name: "Titles", gap: 4 });
  put(row, t, { grow: true });
  text(t, title, { size: 18, w: "b", fillW: true, lh: 135 });
  if (desc) text(t, desc, { size: 14, c: "muted", fillW: true });
  const x = box({ name: "Close", main: "CENTER", cross: "CENTER", w: 36, h: 36 });
  icon(x, "x", 20, "muted");
  row.appendChild(x);
  if (closeTo) link(x, closeTo);
}

// ---------------------------------------------------------------------------
// Shared request pieces
// ---------------------------------------------------------------------------

function requestRows(parent, rows) {
  const list = box({ name: "Request list", fill: "surface", r: 16, clip: true, stroke: wf() ? "line" : null });
  put(parent, list, { fillW: true });
  rows.forEach(function (r, i) {
    const row = box({ name: "Request/" + r.code, dir: "h", gap: 12, p: [14, 16], cross: "CENTER" });
    row.strokes = paint("line");
    row.strokeTopWeight = 0;
    row.strokeLeftWeight = 0;
    row.strokeRightWeight = 0;
    row.strokeBottomWeight = i === rows.length - 1 ? 0 : 1;
    put(list, row, { fillW: true });
    catIcon(row, r.cat, "md");
    const t = box({ name: "Text", gap: 2 });
    put(row, t, { grow: true });
    const top = box({ name: "Top", dir: "h", gap: 6, cross: "CENTER" });
    put(t, top, { fillW: true });
    if (r.urgency === "urgent") urgencyPill(top, "urgent");
    text(top, CATEGORY[r.cat].name, { size: 15, w: "sb" });
    if (r.follow) pill(top, "ติดตาม", "purple");
    text(t, r.loc, { size: 13, c: "muted", fillW: true });
    const meta = box({ name: "Meta", dir: "h", gap: 8, cross: "CENTER", p: [4, 0, 0, 0] });
    put(t, meta, { fillW: true });
    statusPill(meta, r.status);
    text(meta, r.code + " · " + r.time, { size: 12, c: "muted" });
    if (r.repeat) {
      const chip = box({ name: "Repeat", dir: "h", gap: 4, p: [0, 10], fill: "fill", r: 10, h: 40, cross: "CENTER" });
      text(chip, "แจ้งซ่อมซ้ำ", { size: 13, w: "sb" });
      row.appendChild(chip);
      link(chip, r.repeat);
    } else {
      icon(row, "chevron-right", 18, "placeholder");
    }
    if (r.to) link(row, r.to);
  });
  return list;
}

function requestHeaderCard(parent, o) {
  const c = card(parent, { gap: 12, r: 20 });
  const top = box({ name: "Top", dir: "h", gap: 12, cross: "MIN" });
  put(c, top, { fillW: true });
  catIcon(top, o.cat, "lg");
  const t = box({ name: "Text", gap: 2 });
  put(top, t, { grow: true });
  text(t, o.code, { size: 13, w: "sb", c: "muted" });
  text(t, CATEGORY[o.cat].name, { size: 20, w: "b", fillW: true, lh: 130 });
  const loc = box({ name: "Location", dir: "h", gap: 4, cross: "MIN", p: [4, 0, 0, 0] });
  put(t, loc, { fillW: true });
  icon(loc, "map-pin", 15, "muted");
  const lt = box({ name: "Where", gap: 0 });
  put(loc, lt, { grow: true });
  text(lt, o.loc, { size: 14, c: "muted", fillW: true });
  text(lt, o.campus || "วิทยาเขตสวนสัก", { size: 13, c: "muted", fillW: true });
  const pills = box({ name: "Pills", dir: "h", gap: 8, cross: "CENTER" });
  put(c, pills, { fillW: true });
  statusPill(pills, o.status);
  urgencyPill(pills, o.urgency || "normal");
  return c;
}

function detailSection(parent, title, build) {
  const s = box({ name: "Section/" + title, gap: 6 });
  put(parent, s, { fillW: true });
  const h = box({ name: "Title", p: [0, 4] });
  text(h, title, { size: 13, w: "m", c: "muted" });
  put(s, h, { fillW: true });
  const c = card(s, { gap: 10 });
  build(c);
  return s;
}

// steps: [{label, state, time, actor, events:[{label, note, tone}]}], currentTone
function timeline(parent, steps, currentTone) {
  const list = box({ name: "Timeline", gap: 0 });
  put(parent, list, { fillW: true });
  steps.forEach(function (s, i) {
    const last = i === steps.length - 1;
    const row = box({ name: "Step/" + s.label, dir: "h", gap: 14, cross: "MIN" });
    put(list, row, { fillW: true });
    const rail = box({ name: "Rail", cross: "CENTER", w: 24 });
    put(row, rail, { fillH: true });
    const dotBox = box({ name: "Dot", main: "CENTER", cross: "CENTER", w: 24, h: 24 });
    rail.appendChild(dotBox);
    if (s.state === "done") {
      const d = circle(dotBox, 24, "greenI");
      icon(d, "check", 14, "#FFFFFF", { sw: 3 });
    } else if (s.state === "current") {
      const toneKey = TONE[currentTone][1];
      const d = circle(dotBox, 24, "surface", { stroke: toneKey, sw: 2 });
      circle(d, 12, toneKey);
    } else {
      circle(dotBox, 14, "surface", { stroke: "fillStrong", sw: 2 });
    }
    if (!last) {
      const line = box({ name: "Line", w: 2, fill: s.state === "done" && steps[i + 1].state !== "future" ? "greenI" : "fillStrong" });
      put(rail, line);
      line.layoutGrow = 1;
      line.minHeight = 12;
    }
    const t = box({ name: "Text", gap: 2, p: [0, 0, last ? 0 : 20, 0] });
    put(row, t, { grow: true });
    const toneInk = s.state === "current" ? TONE[currentTone][1] : s.state === "done" ? "ink" : "muted";
    text(t, s.label, { size: 15, w: s.state === "future" ? "r" : s.state === "current" ? "b" : "sb", c: toneInk, fillW: true });
    if (s.time) text(t, s.time, { size: 13, c: "muted", fillW: true });
    if (s.actor) text(t, s.actor, { size: 13, fillW: true });
    (s.events || []).forEach(function (ev) {
      const e = box({ name: "Event/" + ev.label, gap: 2, p: [8, 12], fill: TONE[ev.tone][0], r: 12 });
      put(t, e, { fillW: true });
      e.paddingTop = 8;
      text(e, ev.label, { size: 13, w: "sb", c: TONE[ev.tone][1], fillW: true });
      if (ev.note) text(e, ev.note, { size: 13, fillW: true });
      if (ev.time) text(e, ev.time, { size: 12, c: "muted", fillW: true });
    });
  });
  return list;
}

const CAMT = "CAMT วิทยาลัยศิลปะ สื่อ และเทคโนโลยี";
const LOC = CAMT + " · ชั้น 3 · CAMT301";
const LOC_RB5 = "RB5 อาคารเรียนรวม 5 · ชั้น 2 · RB5202";
const LOC_RB5_1 = "RB5 อาคารเรียนรวม 5 · ชั้น 1 · RB5103";
const LOC_LIB = "สำนักหอสมุด (Main Library) · ชั้น 1 · ห้องน้ำ";
const LOC_ILC = "TLIC ศูนย์นวัตกรรมการเรียนการสอน · ชั้น 2 · ILC-A204";
const LOC_HB7 = "HB7 คณะมนุษยศาสตร์ (8 ชั้น) · ชั้น 4 · HB7402";
const LOC_DORM = "หอพักนักศึกษาหญิง 3 · ชั้น 1 · ห้องน้ำรวม";
const DESC = "แอร์เปิดแล้วไม่เย็น มีน้ำหยดลงโต๊ะแถวที่ 3 เริ่มเป็นตั้งแต่เมื่อวาน";

function problemSection(parent, o) {
  o = o || {};
  detailSection(parent, "รายละเอียดปัญหา", function (c) {
    text(c, DESC, { size: 15, fillW: true, lh: 160 });
    const lm = box({ name: "Landmark", dir: "h", gap: 4 });
    put(c, lm, { fillW: true });
    text(lm, "จุดสังเกต:", { size: 14, c: "muted" });
    text(lm, "เครื่องฝั่งหน้าต่าง", { size: 14 });
    text(c, "แจ้งเมื่อ 17 ก.ย. 69 14:30", { size: 13, c: "muted" });
    photoGrid(c, 2, 96);
  });
}

// ---------------------------------------------------------------------------
// Login (one per section, so every flow starts and ends inside its own section)
// ---------------------------------------------------------------------------

function logo(parent, inverted) {
  if (!wf()) {
    // Wordmark 900 × 174 → 228 × 44.
    const col = box({ name: "Logo", gap: 6 });
    brandImage(col, inverted ? "wordWhite" : "word", 228, 44, "FastFix CMU");
    text(col, "ระบบแจ้งซ่อม มหาวิทยาลัยเชียงใหม่", { size: 13, c: inverted ? "#E9DFF2" : "muted", lh: 130 });
    parent.appendChild(col);
    return col;
  }
  const row = box({ name: "Logo", dir: "h", gap: 12, cross: "CENTER" });
  const tile = box({ name: "Mark", main: "CENTER", cross: "CENTER", w: 44, h: 44, r: 12, fill: inverted ? "surface" : "brand" });
  icon(tile, "wrench", 22, inverted ? "brand" : "onBrand", { sw: 2.2 });
  row.appendChild(tile);
  const t = box({ name: "Name", gap: 0 });
  text(t, "FastFix CMU", { size: 15, w: "b", c: inverted ? "#FFFFFF" : "ink", lh: 130 });
  text(t, "มหาวิทยาลัยเชียงใหม่", { size: 13, c: inverted ? "#E9DFF2" : "muted", lh: 130 });
  row.appendChild(t);
  parent.appendChild(row);
  return row;
}

function loginForm(b, next, forgot, user, withLogo) {
  if (withLogo) {
    logo(b);
    spacer(b, 8);
  }
  text(b, "มีอะไรเสีย บอกเราได้เลย", { size: 28, w: "b", fillW: true, lh: 130 });
  text(b, "เข้าสู่ระบบด้วย CMU Account เพื่อแจ้งซ่อมและติดตามงาน", { size: 15, c: "muted", fillW: true });
  spacer(b, 8);
  input(b, { label: "CMU Account", value: user, suffix: "@cmu.ac.th" });
  input(b, { label: "รหัสผ่าน", value: "••••••••", trailing: "eye" });
  const fr = box({ name: "Forgot", dir: "h", main: "MAX" });
  put(b, fr, { fillW: true });
  linkText(fr, "ลืมรหัสผ่าน?", forgot, { size: 14 });
  button(b, "เข้าสู่ระบบ", { size: "lg", block: true, to: next });
}

function loginScreen(key, next, forgot, user) {
  if (!isD()) {
    const s = screen(key, "เข้าสู่ระบบ", {});
    const b = body(s.col, { p: [32, 20, 32, 20], gap: 16 });
    loginForm(b, next, forgot, user, true);
    return finish(s);
  }
  const f = box({ name: K(key) + " · เข้าสู่ระบบ", dir: "h", fill: "page", clip: true, cross: "MIN", w: DW });
  SCREENS[K(key)] = f;
  const left = box({ name: "Brand panel", gap: 44, p: [56, 56], fill: "brand", main: "CENTER", w: 720 });
  put(f, left, { fillH: true });
  logo(left, true);
  const pitch = box({ name: "Pitch", gap: 24, w: 460 });
  left.appendChild(pitch);
  text(pitch, "เจออะไรเสียในมหาวิทยาลัย แจ้งได้ในไม่ถึง 3 นาที", { size: 36, w: "b", c: "#FFFFFF", fillW: true, lh: 130 });
  [
    ["camera", "ถ่ายรูปจุดที่เสีย", "แนบได้สูงสุด 3 รูป ระบบย่อขนาดให้เอง"],
    ["map-pin", "เลือกอาคารและห้อง", "ช่างรู้ตำแหน่งแน่นอนโดยไม่ต้องโทรถาม"],
    ["bell", "ติดตามได้ทุกขั้นตอน", "แจ้งเตือนทันทีเมื่อรับเรื่อง มอบหมายช่าง และซ่อมเสร็จ"],
  ].forEach(function (st) {
    const r = box({ name: "Step/" + st[1], dir: "h", gap: 16, cross: "MIN" });
    put(pitch, r, { fillW: true });
    const tile = box({ name: "Icon", main: "CENTER", cross: "CENTER", w: 44, h: 44, r: 12, fill: "#FFFFFF", op: 0.15 });
    icon(tile, st[0], 20, "#FFFFFF");
    r.appendChild(tile);
    const t = box({ name: "Text", gap: 2 });
    put(r, t, { grow: true });
    text(t, st[1], { size: 16, w: "sb", c: "#FFFFFF" });
    text(t, st[2], { size: 14, c: "#E9DFF2", fillW: true });
  });
  const right = box({ name: "Form panel", main: "CENTER", cross: "CENTER", p: 40 });
  put(f, right, { grow: true, fillH: true });
  const col = box({ name: "Form", gap: 16, w: 400 });
  right.appendChild(col);
  CUR_W = 400;
  loginForm(col, next, forgot, user, false);
  f.counterAxisSizingMode = "FIXED";
  f.resize(DW, DH);
  return f;
}

// ---------------------------------------------------------------------------
// Reporter screens
// ---------------------------------------------------------------------------

function R01b() {
  return sheetScreen("R01b", "ลืมรหัสผ่าน", "R01", function (s) {
    sheetHeader(s, "ลืมรหัสผ่าน?", null, "R01");
    text(s, "กรุณาติดต่อ ITSC มช. เพื่อรีเซ็ตรหัสผ่าน", { size: 15, fillW: true });
    text(s, "ระบบแจ้งซ่อมใช้ CMU Account เดียวกับบริการอื่นของมหาวิทยาลัย จึงไม่สามารถรีเซ็ตรหัสผ่านจากที่นี่ได้", { size: 14, c: "muted", fillW: true });
    button(s, "เข้าใจแล้ว", { v: "secondary", block: true, to: "R01" });
  });
}

function R02() {
  const s = screen("R02", "ตั้งค่าโปรไฟล์ครั้งแรก", { colW: 640, center: true });
  const b = body(s.col, { p: [24, 20, 32, 20], gap: 18 });
  const h = box({ name: "Intro", gap: 4 });
  put(b, h, { fillW: true });
  text(h, "ขั้นตอนเดียวก่อนเริ่ม", { size: 14, w: "sb", c: "brand" });
  text(h, "บอกเราสักนิดว่าคุณคือใคร", { size: 26, w: "b", fillW: true, lh: 130 });
  text(h, "ข้อมูลนี้ช่วยให้ช่างติดต่อกลับได้ถูกคน กรอกครั้งเดียว แก้ไขภายหลังได้", { size: 15, c: "muted", fillW: true });
  input(b, { label: "ชื่อ-นามสกุล", value: "อนันต์ ศรีวงศ์" });
  const st = box({ name: "Field/สถานะ", gap: 6 });
  put(b, st, { fillW: true });
  text(st, "สถานะ", { size: 14, w: "sb" });
  segmented(st, ["นักศึกษา", "บุคลากร"], 0);
  input(b, { label: "คณะ/หน่วยงาน", value: "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี (CAMT)" });
  input(b, { label: "เบอร์โทร", value: "0891234567", hint: "ช่างจะโทรหาเมื่อต้องการสอบถามหน้างาน เห็นได้เฉพาะช่างที่รับงานและเจ้าหน้าที่" });
  const p = card(b, { gap: 10 });
  const pr = box({ name: "PDPA", dir: "h", gap: 12, cross: "MIN" });
  put(p, pr, { fillW: true });
  icon(pr, "shield", 20, "brand");
  const pt = box({ name: "Text", gap: 4 });
  put(pr, pt, { grow: true });
  text(pt, "การคุ้มครองข้อมูลส่วนบุคคล (PDPA)", { size: 13, w: "sb", fillW: true });
  text(pt, "เราเก็บชื่อ สถานะ คณะ และเบอร์โทรของคุณ เพื่อติดต่อกลับและติดตามงานซ่อมเท่านั้น ข้อมูลจะไม่ถูกเผยแพร่ต่อบุคคลภายนอก และคุณแก้ไขข้อมูลได้ทุกเมื่อในหน้าโปรไฟล์", { size: 13, c: "muted", fillW: true });
  const ck = box({ name: "Consent", dir: "h", gap: 12, cross: "CENTER", p: [6, 0] });
  put(p, ck, { fillW: true });
  checkbox(ck, true);
  text(ck, "ฉันยอมรับการเก็บและใช้ข้อมูลตามที่ระบุ", { size: 15, w: "m", grow: true });
  button(b, "บันทึกและเริ่มใช้งาน", { size: "lg", block: true, to: "R03" });
  return finish(s);
}

function R03() {
  const s = screen("R03", "หน้าแรก", { role: "reporter", nav: "home", tabs: true, colW: DESK_W });
  const head = box({ name: "Header", dir: "h", gap: 12, cross: "CENTER", p: hp([16, 20, 4, 20]) });
  put(s.col, head, { fillW: true });
  const ht = box({ name: "Greeting", gap: 0 });
  put(head, ht, { grow: true });
  text(ht, "สวัสดีตอนบ่าย", { size: 15, c: "muted" });
  text(ht, "คุณอนันต์", { size: 28, w: "b", lh: 130 });
  bellButton(head, 2, "R14");

  const b = body(s.col, { p: [16, 20, 24, 20], gap: 22 });
  const cols = twoCols(b, 552);
  const act = box({ name: "Active request", gap: 8 });
  put(cols[0], act, { fillW: true });
  sectionTitle(act, "งานที่กำลังดำเนินการ");
  const c = card(act, { r: 20, gap: 12 });
  link(c, "R10");
  const top = box({ name: "Top", dir: "h", gap: 12, cross: "CENTER" });
  put(c, top, { fillW: true });
  catIcon(top, "AirVent", "lg");
  const tt = box({ name: "Text", gap: 0 });
  put(top, tt, { grow: true });
  text(tt, "เครื่องปรับอากาศ", { size: 16, w: "b" });
  text(tt, LOC, { size: 13, c: "muted", fillW: true });
  icon(top, "chevron-right", 18, "placeholder");
  const mid = box({ name: "Status", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER" });
  put(c, mid, { fillW: true });
  statusPill(mid, "assigned");
  text(mid, "อัปเดต 12 นาทีที่แล้ว", { size: 12, c: "muted" });
  progressBar(c, 0.5, (isD() ? 552 : CUR_W) - 32, "blueI");
  text(c, "ขั้นที่ 3 จาก 6 · MR-2609-0042", { size: 12, c: "muted" });

  const cta = card(cols[0], { r: 20, p: 20, gap: 4 });
  text(cta, "มีอะไรเสีย บอกเราได้เลย", { size: 17, w: "b" });
  text(cta, "ถ่ายรูป เลือกสถานที่ ส่งเรื่องได้ในไม่ถึง 3 นาที", { size: 14, c: "muted", fillW: true });
  spacer(cta, 12);
  button(cta, "แจ้งซ่อม", { size: "lg", block: true, icon: "plus", to: "R04" });

  const rec = box({ name: "Recent", gap: 8 });
  put(cols[1], rec, { fillW: true });
  const rh = box({ name: "Title", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER" });
  put(rec, rh, { fillW: true });
  text(rh, "คำร้องล่าสุด", { size: 17, w: "b" });
  linkText(rh, "ดูทั้งหมด", "R13");
  requestRows(rec, [
    { cat: "AirVent", loc: LOC, status: "assigned", code: "MR-2609-0042", time: "12 นาทีที่แล้ว", to: "R10" },
    { cat: "Droplets", loc: LOC_RB5, status: "need_info", code: "MR-2609-0039", time: "1 วันที่แล้ว", to: "R10" },
    { cat: "Zap", loc: LOC_LIB, status: "closed", code: "MR-2609-0021", time: "6 วันที่แล้ว", to: "R10" },
  ]);
  return finish(s);
}

function formTop(parent, step, label, backLabel, backTo) {
  const t = box({ name: "Form header", gap: 10, p: hp([8, 20, 12, 20]), fill: "page" });
  put(parent, t, { fillW: true });
  const row = box({ name: "Row", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER" });
  put(t, row, { fillW: true });
  linkText(row, backLabel, backTo, { icon: "chevron-left", iconSize: 22 });
  text(row, "ขั้นที่ " + step + "/4 · " + label, { size: 14, w: "sb", c: "muted" });
  progressBar(t, step / 4, CUR_W, "brand");
  return t;
}

function stepTitle(b, title, sub) {
  const h = box({ name: "Step title", gap: 4 });
  put(b, h, { fillW: true });
  text(h, title, { size: 24, w: "b", fillW: true, lh: 130 });
  text(h, sub, { size: 15, c: "muted", fillW: true });
}

function formScreen(key, title, action) {
  return screen(key, title, { role: "reporter", colW: 720, center: true, action: action });
}

function R04() {
  const s = formScreen("R04", "แจ้งซ่อม ขั้นที่ 1 ปัญหา", ["ถัดไป", "R05a"]);
  formTop(s.col, 1, "ปัญหา", "ยกเลิก", "R03");
  const b = body(s.col, { gap: 20 });
  stepTitle(b, "เกิดปัญหาอะไร", "เลือกประเภทที่ใกล้เคียงที่สุด");
  const list = groupList(b);
  const keys = Object.keys(CATEGORY);
  keys.forEach(function (k, i) {
    listRow(list, { cat: k, label: CATEGORY[k].name, check: k === "AirVent", last: i === keys.length - 1 });
  });
  const u = groupList(b, "ความเร่งด่วน");
  listRow(u, { label: "ไม่ด่วน", detail: "รอได้ ไม่กระทบการใช้งานมาก" });
  listRow(u, { label: "ปกติ", detail: "ใช้งานได้ไม่สะดวก ควรซ่อมในไม่กี่วัน", check: true });
  listRow(u, { label: "ด่วนมาก", detail: "อันตรายหรือกระทบคนจำนวนมาก", labelColor: "redI", bold: true, last: true });
  return finish(s);
}

function crumb(parent, label, active) {
  const c = box({ name: "Crumb/" + label, dir: "h", p: [0, 12], h: 34, r: 999, cross: "CENTER", fill: active ? "brandSoft" : "surface" });
  c.cornerRadius = 999;
  text(c, label, { size: 14, w: "sb", c: active ? "brand" : "ink" });
  parent.appendChild(c);
  return c;
}

// Step 2 starts with the faculty or unit, so a campus with 100+ buildings is a short list.
function R05a() {
  const s = formScreen("R05a", "แจ้งซ่อม ขั้นที่ 2 เลือกคณะ", ["ถัดไป", "R05"]);
  formTop(s.col, 2, "สถานที่", "ย้อนกลับ", "R04");
  const b = body(s.col, { gap: 18 });
  stepTitle(b, "พบปัญหาที่ไหน", "เลือกทีละขั้นจนถึงห้อง");
  const cr = box({ name: "Breadcrumbs", dir: "h", gap: 4, cross: "CENTER", clip: true });
  put(b, cr, { fillW: true });
  crumb(cr, "วิทยาเขต");
  icon(cr, "chevron-right", 14, "muted");
  crumb(cr, "สวนสัก", true);
  input(b, { placeholder: "ค้นหาอาคาร เช่น CAMT, RB5, หอสมุด", leading: "search" });
  const list = groupList(b, "คณะหรือหน่วยงาน");
  listRow(list, { label: "คณะเศรษฐศาสตร์", detail: "3 อาคาร", chevron: true });
  listRow(list, { label: "คณะวิศวกรรมศาสตร์", detail: "27 อาคาร", chevron: true });
  listRow(list, { label: "คณะสังคมศาสตร์", detail: "8 อาคาร", chevron: true });
  listRow(list, { label: "วิทยาลัยนานาชาตินวัตกรรมดิจิทัล (ICDI)", detail: "1 อาคาร", chevron: true });
  listRow(list, { label: "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี (CAMT)", detail: "1 อาคาร · ไปที่ชั้นทันที", chevron: true, to: "R05" });
  listRow(list, { label: "อาคารเรียนรวม (ส่วนกลาง)", detail: "5 อาคาร", chevron: true, last: true });
  return finish(s);
}

function R05() {
  const s = formScreen("R05", "แจ้งซ่อม ขั้นที่ 2 สถานที่", ["ถัดไป", "R06"]);
  formTop(s.col, 2, "สถานที่", "ย้อนกลับ", "R05a");
  const b = body(s.col, { gap: 18 });
  stepTitle(b, "พบปัญหาที่ไหน", "เลือกทีละขั้นจนถึงห้อง");
  const cr = box({ name: "Breadcrumbs", dir: "h", gap: 4, cross: "CENTER", clip: true });
  put(b, cr, { fillW: true });
  crumb(cr, "วิทยาเขต");
  icon(cr, "chevron-right", 14, "muted");
  link(crumb(cr, "สวนสัก"), "R05a");
  icon(cr, "chevron-right", 14, "muted");
  crumb(cr, "CAMT");
  icon(cr, "chevron-right", 14, "muted");
  crumb(cr, "ชั้น 3", true);
  const list = groupList(b, "ห้อง");
  listRow(list, { label: "CAMT301", check: true, to: "R05b" });
  listRow(list, { label: "CAMT302" });
  listRow(list, { label: "Lab Game" });
  listRow(list, { label: "Lab Animation", last: true });
  input(b, { label: "จุดสังเกตเพิ่มเติม", optional: true, value: "เครื่องฝั่งหน้าต่าง" });
  return finish(s);
}

function R05b() {
  return sheetScreen("R05b", "มีคนแจ้งปัญหานี้แล้ว", "R05", function (s) {
    sheetHeader(s, "มีคนแจ้งปัญหานี้แล้ว", "ห้องและประเภทปัญหาเดียวกันยังอยู่ระหว่างดำเนินการ", "R05");
    const c = card(s, { gap: 10 });
    const top = box({ name: "Top", dir: "h", gap: 12, cross: "CENTER" });
    put(c, top, { fillW: true });
    catIcon(top, "AirVent", "md");
    const t = box({ name: "Text", gap: 0 });
    put(top, t, { grow: true });
    text(t, "เครื่องปรับอากาศ", { size: 15, w: "sb" });
    text(t, LOC, { size: 13, c: "muted", fillW: true });
    text(c, "แอร์เปิดแล้วไม่เย็น มีแต่ลมออก นักศึกษานั่งเรียนร้อนมาก", { size: 15, fillW: true });
    const m = box({ name: "Meta", dir: "h", gap: 8, cross: "CENTER" });
    put(c, m, { fillW: true });
    statusPill(m, "accepted");
    text(m, "MR-2609-0038 · แจ้งเมื่อ 2 ชั่วโมงที่แล้ว", { size: 12, c: "muted" });
    text(s, "กดติดตามเพื่อรับแจ้งเตือนเมื่อซ่อมเสร็จ โดยไม่ต้องแจ้งซ้ำ", { size: 14, c: "muted", fillW: true });
    button(s, "ติดตามงานนี้แทน", { size: "lg", block: true, to: "R10" });
    button(s, "แจ้งใหม่อยู่ดี", { size: "lg", v: "secondary", block: true, to: "R06" });
  });
}

function R06() {
  const s = formScreen("R06", "แจ้งซ่อม ขั้นที่ 3 รายละเอียด", ["ถัดไป", "R07"]);
  formTop(s.col, 3, "รายละเอียด", "ย้อนกลับ", "R05");
  const b = body(s.col, { gap: 20 });
  stepTitle(b, "เล่าให้ช่างฟังหน่อย", "รายละเอียดและรูปช่วยให้ช่างเตรียมอุปกรณ์มาถูก");
  const d = input(b, { label: "รายละเอียดปัญหา", value: DESC, multiline: true, focus: true });
  const cnt = box({ name: "Counter", dir: "h", main: "MAX" });
  put(d, cnt, { fillW: true });
  text(cnt, "58/1000", { size: 13, c: "greenI" });
  const ph = box({ name: "Photos field", gap: 8 });
  put(b, ph, { fillW: true });
  text(ph, "รูปภาพ (1–3 รูป)", { size: 14, w: "sb" });
  photoGrid(ph, 2, 110, { addTile: "2/3", uploadingIndex: 1 });
  button(ph, "ถ่ายรูปด้วยกล้อง", { v: "secondary", block: true, icon: "camera" });
  text(ph, "JPG หรือ PNG ไม่เกิน 10 MB ต่อรูป ระบบจะย่อขนาดให้อัตโนมัติ", { size: 13, c: "muted", fillW: true });
  return finish(s);
}

function reviewBlock(parent, title, editTo, build) {
  const s = box({ name: "Review/" + title, gap: 4 });
  put(parent, s, { fillW: true });
  const h = box({ name: "Title", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER", p: [0, 4] });
  put(s, h, { fillW: true });
  text(h, title, { size: 13, w: "m", c: "muted" });
  linkText(h, "แก้ไข", editTo, { size: 14 });
  const c = card(s, { gap: 8 });
  build(c);
}

function R07() {
  const s = formScreen("R07", "แจ้งซ่อม ขั้นที่ 4 ตรวจสอบ", ["ส่งคำร้อง", "R08"]);
  formTop(s.col, 4, "ตรวจสอบ", "ย้อนกลับ", "R06");
  const b = body(s.col, { gap: 16 });
  stepTitle(b, "ตรวจสอบก่อนส่ง", "แตะ “แก้ไข” เพื่อกลับไปเปลี่ยนข้อมูล");
  reviewBlock(b, "ปัญหา", "R04", function (c) {
    const r = box({ name: "Row", dir: "h", gap: 12, cross: "CENTER" });
    put(c, r, { fillW: true });
    catIcon(r, "AirVent", "sm");
    const t = box({ name: "Text" });
    put(r, t, { grow: true });
    text(t, "เครื่องปรับอากาศ", { size: 15, w: "sb" });
    text(t, "ความเร่งด่วน: ปกติ", { size: 14, c: "muted" });
  });
  reviewBlock(b, "สถานที่", "R05", function (c) {
    const r = box({ name: "Row", dir: "h", gap: 12, cross: "MIN" });
    put(c, r, { fillW: true });
    icon(r, "map-pin", 18, "brand");
    const t = box({ name: "Text" });
    put(r, t, { grow: true });
    text(t, LOC, { size: 15, w: "sb", fillW: true });
    text(t, "วิทยาเขตสวนสัก", { size: 14, c: "muted" });
    text(t, "จุดสังเกต: เครื่องฝั่งหน้าต่าง", { size: 14, fillW: true });
  });
  reviewBlock(b, "รายละเอียดและรูปภาพ", "R06", function (c) {
    text(c, DESC, { size: 15, fillW: true, lh: 160 });
    photoGrid(c, 2, 96);
  });
  return finish(s);
}

function R08() {
  const s = screen("R08", "ส่งคำร้องสำเร็จ", { role: "reporter", colW: 480, center: true });
  const b = body(s.col, { p: [isD() ? 80 : 120, 24, 24, 24], gap: 6 });
  b.counterAxisAlignItems = "CENTER";
  const ring = circle(b, 96, "greenT", { stroke: "greenI", sw: 5 });
  icon(ring, "check", 48, "greenI", { sw: 3 });
  spacer(b, 18);
  text(b, "ส่งคำร้องเรียบร้อย", { size: 24, w: "b", align: "CENTER" });
  text(b, "เลขที่คำร้องของคุณ", { size: 15, c: "muted", align: "CENTER" });
  text(b, "MR-2609-0042", { size: 28, w: "b", c: "brand", align: "CENTER" });
  text(b, "เจ้าหน้าที่จะรับเรื่องและมอบหมายช่าง คุณจะได้รับแจ้งเตือนทุกครั้งที่สถานะเปลี่ยน", { size: 14, c: "muted", align: "CENTER", fillW: true });
  spacer(b, 24);
  button(b, "ติดตามสถานะ", { size: "lg", block: true, to: "R09" });
  button(b, "กลับหน้าแรก", { size: "lg", v: "secondary", block: true, to: "R03" });
  return finish(s);
}

const FLOW = ["ส่งคำร้อง · รอรับเรื่อง", "รับเรื่องแล้ว", "มอบหมายช่างแล้ว", "กำลังซ่อม", "ซ่อมเสร็จ รอยืนยัน", "ปิดงาน"];

function trackScreen(key, title) {
  const s = screen(key, title, { role: "reporter", nav: "history", tabs: true, colW: DESK_W });
  pageHeader(s.col, { title: "ติดตามสถานะ", back: ["ประวัติ", "R13"], bell: [2, "R14"] });
  const b = body(s.col, { p: [12, 20, 24, 20], gap: 18 });
  const cols = twoCols(b, DESK_W - 24 - 400);
  return { s: s, L: cols[0], R: cols[1] };
}

function R09() {
  const t = trackScreen("R09", "ติดตามสถานะ รอรับเรื่อง");
  requestHeaderCard(t.L, { cat: "AirVent", code: "MR-2609-0042", loc: LOC, status: "pending" });
  button(t.R, "ยกเลิกคำร้อง", { v: "danger", block: true, to: "R09b" });
  detailSection(t.R, "ความคืบหน้า", function (c) {
    timeline(
      c,
      FLOW.map(function (l, i) {
        return i === 0 ? { label: l, state: "current", time: "17 ก.ย. 69 14:30 · เมื่อสักครู่" } : { label: l, state: "future" };
      }),
      "gray",
    );
  });
  problemSection(t.L);
  return finish(t.s);
}

function R09b() {
  return sheetScreen("R09b", "ยกเลิกคำร้อง", "R09", function (s) {
    sheetHeader(s, "ยกเลิกคำร้องนี้?", "MR-2609-0042 จะไม่ถูกส่งต่อให้ช่าง และยกเลิกแล้วย้อนกลับไม่ได้", "R09");
    button(s, "ยืนยันยกเลิก", { size: "lg", v: "danger", block: true, to: "R13" });
    button(s, "ไม่ยกเลิก", { size: "lg", v: "secondary", block: true, to: "R09" });
  });
}

function R10() {
  const t = trackScreen("R10", "ติดตามสถานะ ซ่อมเสร็จ รอยืนยัน");
  requestHeaderCard(t.L, { cat: "AirVent", code: "MR-2609-0042", loc: LOC, status: "completed" });
  const c = card(t.R, { gap: 6 });
  text(c, "ช่างแจ้งว่าซ่อมเสร็จแล้ว", { size: 17, w: "b" });
  text(c, "ลองตรวจดูหน้างาน แล้วบอกเราว่าใช้งานได้ปกติหรือยัง", { size: 14, c: "muted", fillW: true });
  spacer(c, 8);
  const btns = box({ name: "Buttons", dir: "h", gap: 8 });
  put(c, btns, { fillW: true });
  button(btns, "ยืนยันว่าซ่อมเสร็จ", { size: isD() ? "md" : "lg", grow: true, to: "R11" });
  button(btns, "ยังไม่หาย", { size: isD() ? "md" : "lg", v: "secondary", grow: true, to: "R12" });
  text(c, "ระบบจะปิดงานอัตโนมัติใน 3 วัน", { size: 13, c: "muted", align: "CENTER", fillW: true });
  detailSection(t.R, "ความคืบหน้า", function (cc) {
    timeline(
      cc,
      [
        { label: FLOW[0], state: "done", time: "17 ก.ย. 69 14:30 · 2 วันที่แล้ว" },
        { label: FLOW[1], state: "done", time: "17 ก.ย. 69 15:02 · 2 วันที่แล้ว" },
        { label: FLOW[2], state: "done", time: "17 ก.ย. 69 15:10 · 2 วันที่แล้ว", actor: "ช่างสมศักดิ์ ใจดี" },
        {
          label: FLOW[3],
          state: "done",
          time: "18 ก.ย. 69 09:15 · 1 วันที่แล้ว",
          events: [
            { label: "รออะไหล่", note: "สั่งน้ำยาแอร์แล้ว คาดว่าได้พรุ่งนี้", tone: "orange", time: "1 วันที่แล้ว" },
            { label: "ได้อะไหล่แล้ว กลับมาซ่อมต่อ", tone: "blue", time: "3 ชั่วโมงที่แล้ว" },
          ],
        },
        { label: FLOW[4], state: "current", time: "19 ก.ย. 69 11:40 · 20 นาทีที่แล้ว" },
        { label: FLOW[5], state: "future" },
      ],
      "green",
    );
  });
  problemSection(t.L);
  detailSection(t.L, "ช่างผู้รับผิดชอบ", function (cc) {
    const r = box({ name: "Tech", dir: "h", gap: 12, cross: "CENTER" });
    put(cc, r, { fillW: true });
    const av = circle(r, 40, "blueT");
    icon(av, "wrench", 18, "blueI");
    text(r, "ช่างสมศักดิ์ ใจดี", { size: 15, w: "sb" });
  });
  detailSection(t.L, "ผลการซ่อม", function (cc) {
    text(cc, "สาเหตุ", { size: 13, c: "muted" });
    text(cc, "ท่อน้ำทิ้งแอร์ตัน และน้ำยาแอร์ต่ำ", { size: 15, fillW: true });
    text(cc, "อะไหล่ที่ใช้", { size: 13, c: "muted" });
    text(cc, "น้ำยา R32 1 กก.", { size: 15 });
    text(cc, "รูปหลังซ่อม", { size: 13, c: "muted" });
    photoGrid(cc, 1, 96);
  });
  return finish(t.s);
}

function stars(parent, filled, size) {
  const r = box({ name: "Stars", dir: "h", gap: size > 30 ? 6 : 2, main: "CENTER" });
  for (let i = 1; i <= 5; i++) icon(r, "star", size, i <= filled ? "star" : "fillStrong", { fill: i <= filled ? "star" : null });
  put(parent, r, { fillW: true });
  return r;
}

function R11() {
  return sheetScreen("R11", "ให้คะแนน", "R10", function (s) {
    sheetHeader(s, "ให้คะแนนงานซ่อมครั้งนี้", "คะแนนช่วยให้ทีมช่างปรับปรุงบริการ", "R10");
    stars(s, 5, 40);
    text(s, "พอใจมาก", { size: 15, w: "sb", c: "muted", align: "CENTER", fillW: true });
    input(s, { label: "ความคิดเห็น", optional: true, value: "ช่างมาเร็ว อธิบายสาเหตุชัดเจน", multiline: true, minHeight: 80 });
    button(s, "ยืนยันและปิดงาน", { size: "lg", block: true, to: "R13" });
  });
}

function R12() {
  return sheetScreen("R12", "ยังไม่หาย", "R10", function (s) {
    sheetHeader(s, "ยังพบปัญหาอยู่?", "เราจะส่งเรื่องกลับให้เจ้าหน้าที่มอบหมายช่างอีกครั้ง", "R10");
    input(s, { label: "อาการที่ยังพบ", value: "แอร์เย็นได้ครึ่งชั่วโมงแล้วกลับมามีน้ำหยดอีก", multiline: true });
    button(s, "ส่งเรื่องกลับ", { size: "lg", block: true, to: "R13" });
  });
}

function R13() {
  const s = screen("R13", "ประวัติ", { role: "reporter", nav: "history", tabs: true, colW: 820 });
  pageHeader(s.col, { title: "ประวัติ", subtitle: "คำร้องที่คุณแจ้งและติดตาม", large: true });
  const b = body(s.col, { p: [12, 20, 24, 20], gap: 14 });
  input(b, { placeholder: "ค้นหาเลขคำร้องหรือสถานที่", leading: "search" });
  segmented(b, ["ทั้งหมด|6", "กำลังดำเนินการ|3", "เสร็จสิ้น|2", "ยกเลิก|1"], 0, { hug: !isD() });
  requestRows(b, [
    { cat: "AirVent", loc: LOC, status: "completed", code: "MR-2609-0042", time: "20 นาทีที่แล้ว", to: "R10" },
    { cat: "Droplets", loc: LOC_RB5, status: "need_info", code: "MR-2609-0039", time: "1 วันที่แล้ว", to: "R10" },
    { cat: "Monitor", loc: LOC_ILC, status: "in_progress", code: "MR-2609-0035", time: "2 วันที่แล้ว", to: "R10", follow: true },
    { cat: "Zap", loc: LOC_LIB, status: "closed", code: "MR-2609-0021", time: "6 วันที่แล้ว", to: "R10", repeat: "R04" },
    { cat: "Armchair", loc: LOC_HB7, status: "closed", code: "MR-2608-0118", time: "3 สัปดาห์ที่แล้ว", to: "R10", repeat: "R04" },
    { cat: "Building2", loc: LOC_DORM, status: "cancelled", code: "MR-2608-0102", time: "1 เดือนที่แล้ว", to: "R10" },
  ]);
  return finish(s);
}

const NOTIF_ICON = {
  assigned: ["user", "blue"], accepted: ["check-circle", "blue"], submitted: ["clock", "gray"], completed: ["check-circle", "green"],
  closed: ["check", "green"], job: ["wrench", "purple"], reopened: ["alert", "orange"], waiting: ["package", "orange"],
};

function notifList(parent, items) {
  const list = box({ name: "Notifications", fill: "surface", r: 16, clip: true, stroke: wf() ? "line" : null });
  put(parent, list, { fillW: true });
  items.forEach(function (n, i) {
    const row = box({ name: "Notification/" + n.title, dir: "h", gap: 12, p: [14, 16], cross: "MIN", fill: n.unread && !wf() ? "#FBF9FD" : null });
    row.strokes = paint("line");
    row.strokeTopWeight = 0;
    row.strokeLeftWeight = 0;
    row.strokeRightWeight = 0;
    row.strokeBottomWeight = i === items.length - 1 ? 0 : 1;
    put(list, row, { fillW: true });
    const meta = NOTIF_ICON[n.kind];
    const ic = circle(row, 40, TONE[meta[1]][0]);
    icon(ic, meta[0], 18, TONE[meta[1]][1]);
    const t = box({ name: "Text", gap: 2 });
    put(row, t, { grow: true });
    const top = box({ name: "Top", dir: "h", gap: 8, cross: "CENTER" });
    put(t, top, { fillW: true });
    text(top, n.title, { size: 15, w: n.unread ? "b" : "m", grow: true });
    text(top, n.time, { size: 12, c: "muted" });
    text(t, n.body, { size: 13, c: "muted", fillW: true });
    if (n.unread) {
      const dot = box({ name: "Unread", w: 8, h: 8, fill: "brand" });
      dot.cornerRadius = 4;
      put(row, dot);
    }
    if (n.to) link(row, n.to);
  });
}

function R14() {
  const s = screen("R14", "แจ้งเตือน", { role: "reporter", nav: "notif", tabs: true, colW: 820 });
  pageHeader(s.col, { title: "แจ้งเตือน", large: true });
  const b = body(s.col, { p: [4, 20, 24, 20], gap: 8 });
  const r = box({ name: "Actions", dir: "h", main: "MAX" });
  put(b, r, { fillW: true });
  linkText(r, "อ่านทั้งหมดแล้ว", null, { size: 14 });
  notifList(b, [
    { kind: "completed", title: "ซ่อมเสร็จแล้ว รอคุณยืนยัน", body: "ตรวจสอบงาน MR-2609-0042 แล้วกดยืนยันได้เลย", time: "20 นาที", unread: true, to: "R10" },
    { kind: "assigned", title: "มอบหมายช่างแล้ว", body: "ช่างสมศักดิ์ ใจดี จะเข้าดูแลคำร้อง MR-2609-0042", time: "2 วัน", unread: true, to: "R10" },
    { kind: "accepted", title: "รับเรื่องแล้ว", body: "เจ้าหน้าที่รับเรื่อง MR-2609-0042 แล้ว กำลังจัดหาช่างที่เหมาะสม", time: "2 วัน", to: "R10" },
    { kind: "submitted", title: "ส่งคำร้องแล้ว", body: "เราได้รับคำร้อง MR-2609-0042 แล้ว จะแจ้งให้ทราบเมื่อมีความคืบหน้า", time: "2 วัน", to: "R10" },
    { kind: "closed", title: "ปิดงานแล้ว", body: "คำร้อง MR-2609-0021 ปิดงานเรียบร้อย ขอบคุณที่แจ้งเข้ามา", time: "6 วัน", to: "R10" },
  ]);
  return finish(s);
}

function R15() {
  const s = screen("R15", "โปรไฟล์", { role: "reporter", nav: "profile", tabs: true, colW: 820 });
  pageHeader(s.col, { title: "โปรไฟล์", subtitle: "anan.s@cmu.ac.th", large: true });
  const b = body(s.col, { p: [16, 20, 24, 20], gap: 18 });
  input(b, { label: "ชื่อ-นามสกุล", value: "อนันต์ ศรีวงศ์" });
  const st = box({ name: "Field/สถานะ", gap: 6 });
  put(b, st, { fillW: true });
  text(st, "สถานะ", { size: 14, w: "sb" });
  segmented(st, ["นักศึกษา", "บุคลากร"], 0);
  input(b, { label: "คณะ/หน่วยงาน", value: "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี (CAMT)" });
  input(b, { label: "เบอร์โทร", value: "0891234567" });
  button(b, "บันทึกการแก้ไข", { size: "lg", block: true });
  const pd = box({ name: "PDPA", dir: "h", gap: 8, cross: "CENTER" });
  put(b, pd, { fillW: true });
  icon(pd, "shield", 16, "greenI");
  text(pd, "ยอมรับเงื่อนไข PDPA เมื่อ 17 ก.ย. 69", { size: 13, c: "muted" });
  button(b, "ออกจากระบบ", { v: "danger", block: true, icon: "log-out", to: "R01" });
  return finish(s);
}

// ---------------------------------------------------------------------------
// Technician screens
// ---------------------------------------------------------------------------

function T01() {
  const s = screen("T01", "งานของฉัน", { role: "tech", nav: "jobs", tabs: true, colW: 900 });
  const head = box({ name: "Header", dir: "h", gap: 12, cross: "CENTER", p: hp([16, 20, 4, 20]) });
  put(s.col, head, { fillW: true });
  const ht = box({ name: "Titles", gap: 0 });
  put(head, ht, { grow: true });
  text(ht, "ช่างสมศักดิ์", { size: 15, c: "muted" });
  text(ht, "งานของฉัน", { size: 28, w: "b", lh: 130 });
  text(ht, "มีงานใหม่รอรับ 2 งาน", { size: 14, c: "muted" });
  bellButton(head, 1, "T04");
  const b = body(s.col, { p: [16, 20, 24, 20], gap: 14 });
  segmented(b, JOB_TABS, 0, { hug: !isD(), links: [null, null, null, "T01f"] });
  requestRows(b, [
    { cat: "AirVent", urgency: "normal", loc: LOC, status: "assigned", code: "MR-2609-0042", time: "10 นาทีที่แล้ว", to: "T02" },
    { cat: "Zap", urgency: "urgent", loc: LOC_RB5_1, status: "assigned", code: "MR-2609-0041", time: "35 นาทีที่แล้ว", to: "T02" },
  ]);
  return finish(s);
}

const JOB_TABS = ["งานใหม่|2", "กำลังทำ|1", "รออะไหล่|1", "เสร็จแล้ว|5"];

// "เสร็จแล้ว" tab: jobs waiting for the reporter's confirmation, then closed ones.
function T01f() {
  const s = screen("T01f", "งานของฉัน เสร็จแล้ว", { role: "tech", nav: "jobs", tabs: true, colW: 900 });
  const head = box({ name: "Header", dir: "h", gap: 12, cross: "CENTER", p: hp([16, 20, 4, 20]) });
  put(s.col, head, { fillW: true });
  const ht = box({ name: "Titles", gap: 0 });
  put(head, ht, { grow: true });
  text(ht, "ช่างสมศักดิ์", { size: 15, c: "muted" });
  text(ht, "งานของฉัน", { size: 28, w: "b", lh: 130 });
  text(ht, "เสร็จแล้ว 5 งานในเดือนนี้", { size: 14, c: "muted" });
  bellButton(head, 1, "T04");
  const b = body(s.col, { p: [16, 20, 24, 20], gap: 14 });
  segmented(b, JOB_TABS, 3, { hug: !isD(), links: ["T01", null, null, null] });
  requestRows(b, [
    { cat: "AirVent", urgency: "normal", loc: LOC, status: "completed", code: "MR-2609-0042", time: "20 นาทีที่แล้ว", to: "T02f" },
    { cat: "Droplets", urgency: "normal", loc: LOC_HB7, status: "closed", code: "MR-2609-0012", time: "3 วันที่แล้ว", to: "T02f" },
    { cat: "Zap", urgency: "urgent", loc: LOC_ILC, status: "closed", code: "MR-2609-0009", time: "5 วันที่แล้ว", to: "T02f" },
    { cat: "Zap", urgency: "normal", loc: LOC_RB5, status: "closed", code: "MR-2609-0006", time: "1 สัปดาห์ที่แล้ว", to: "T02f" },
    { cat: "AirVent", urgency: "low", loc: LOC_DORM, status: "closed", code: "MR-2609-0003", time: "2 สัปดาห์ที่แล้ว", to: "T02f" },
  ]);
  return finish(s);
}

function reporterSection(parent) {
  detailSection(parent, "ผู้แจ้ง", function (c) {
    const r = box({ name: "Reporter", dir: "h", gap: 12, cross: "CENTER" });
    put(c, r, { fillW: true });
    const av = circle(r, 40, "fill");
    icon(av, "user", 20, "muted");
    const t = box({ name: "Text" });
    put(r, t, { grow: true });
    text(t, "อนันต์ ศรีวงศ์", { size: 15, w: "sb" });
    text(t, "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี (CAMT)", { size: 13, c: "muted", fillW: true });
    const call = box({ name: "Call", dir: "h", gap: 6, p: [0, 12], fill: "greenT", r: 12, h: 44, cross: "CENTER" });
    icon(call, "phone", 16, "greenI");
    text(call, "089-123-4567", { size: 14, w: "sb", c: "greenI" });
    r.appendChild(call);
  });
}

function jobActions(parent, state) {
  if (state === "assigned") button(parent, "รับงาน", { size: "lg", block: true, to: "T02b" });
  if (state === "in_progress") {
    const row = box({ name: "Buttons", dir: isD() ? "v" : "h", gap: 8 });
    put(parent, row, { fillW: true });
    button(row, "รออะไหล่", { size: "lg", v: "secondary", grow: !isD(), block: isD(), to: "T03w" });
    button(row, "ซ่อมเสร็จแล้ว", { size: "lg", grow: !isD(), block: isD(), to: "T03" });
  }
  if (state === "waiting_parts") button(parent, "ได้อะไหล่แล้ว กลับไปซ่อมต่อ", { size: "lg", block: true, to: "T02b" });
  if (state === "completed") {
    const n = box({ name: "Waiting notice", dir: "h", gap: 10, cross: "CENTER", p: [12, 14], fill: "greenT", r: 12 });
    put(parent, n, { fillW: true });
    icon(n, "check-circle", 20, "greenI");
    const t = box({ name: "Text" });
    put(n, t, { grow: true });
    text(t, "ส่งงานแล้ว รอผู้แจ้งยืนยัน", { size: 15, w: "sb", c: "greenI" });
    text(t, "ระบบจะปิดงานอัตโนมัติใน 3 วัน ถ้าผู้แจ้งไม่ดำเนินการ", { size: 13, c: "muted", fillW: true });
    button(parent, "กลับไปงานของฉัน", { size: "lg", v: "secondary", block: true, to: "T01f" });
  }
}

// state: assigned | in_progress | waiting_parts | completed
function techDetail(key, state) {
  const titles = { assigned: "รายละเอียดงาน มอบหมายแล้ว", in_progress: "รายละเอียดงาน กำลังซ่อม", waiting_parts: "รายละเอียดงาน รออะไหล่", completed: "รายละเอียดงาน ซ่อมเสร็จ" };
  const done = state === "completed";
  const s = screen(key, titles[state], { role: "tech", nav: "jobs", tabs: true, colW: DESK_W });
  pageHeader(s.col, { title: "รายละเอียดงาน", back: ["งานของฉัน", done ? "T01f" : "T01"] });
  const b = body(s.col, { p: [12, 20, 16, 20], gap: 18 });
  const cols = twoCols(b, DESK_W - 24 - 400);
  requestHeaderCard(cols[0], { cat: "AirVent", code: "MR-2609-0042", loc: LOC, status: state });
  if (isD()) {
    const a = card(cols[1], { gap: 8 });
    text(a, "การดำเนินการ", { size: 13, w: "m", c: "muted" });
    jobActions(a, state);
  }
  problemSection(cols[0]);
  reporterSection(cols[0]);
  if (done) {
    detailSection(cols[0], "ผลการซ่อม", function (cc) {
      text(cc, "สาเหตุ", { size: 13, c: "muted" });
      text(cc, "ท่อน้ำทิ้งแอร์ตัน และน้ำยาแอร์ต่ำ", { size: 15, fillW: true });
      text(cc, "อะไหล่ที่ใช้", { size: 13, c: "muted" });
      text(cc, "น้ำยา R32 1 กก.", { size: 15 });
      text(cc, "รูปหลังซ่อม", { size: 13, c: "muted" });
      photoGrid(cc, 1, 96);
    });
  }
  detailSection(cols[1], "ความคืบหน้า", function (c) {
    const steps = [
      { label: FLOW[0], state: "done", time: "17 ก.ย. 69 14:30" },
      { label: FLOW[1], state: "done", time: "17 ก.ย. 69 15:02" },
      { label: FLOW[2], state: state === "assigned" ? "current" : "done", time: "17 ก.ย. 69 15:10", actor: "ช่างสมศักดิ์ ใจดี" },
      { label: FLOW[3], state: state === "assigned" ? "future" : done ? "done" : "current", time: state === "assigned" ? null : "18 ก.ย. 69 09:15", events: state === "waiting_parts" || done ? [{ label: "รออะไหล่", note: "สั่งน้ำยาแอร์แล้ว คาดว่าได้พรุ่งนี้", tone: "orange" }] : [] },
      { label: FLOW[4], state: done ? "current" : "future", time: done ? "19 ก.ย. 69 11:40" : null },
      { label: FLOW[5], state: "future" },
    ];
    timeline(c, steps, state === "waiting_parts" ? "orange" : done ? "green" : "blue");
  });
  if (!isD()) {
    const a = box({ name: "Job actions", gap: 8, p: [12, 20, 16, 20], fill: "page" });
    put(s.frame, a, { fillW: true });
    jobActions(a, state);
  }
  return finish(s);
}

function T03w() {
  return sheetScreen("T03w", "รออะไหล่", "T02b", function (s) {
    sheetHeader(s, "พักงานเพื่อรออะไหล่", "ผู้แจ้งจะเห็นสถานะ “รออะไหล่” พร้อมหมายเหตุนี้", "T02b");
    input(s, { label: "หมายเหตุ", value: "สั่งน้ำยาแอร์แล้ว คาดว่าได้พรุ่งนี้", multiline: true, minHeight: 80 });
    button(s, "ยืนยันรออะไหล่", { size: "lg", block: true, to: "T02c" });
  });
}

function T03() {
  return sheetScreen("T03", "บันทึกงานซ่อมเสร็จ", "T02b", function (s) {
    sheetHeader(s, "บันทึกงานซ่อมเสร็จ", "ผู้แจ้งจะได้รับแจ้งให้ตรวจสอบและยืนยัน", "T02b");
    const ph = box({ name: "Photos field", gap: 8 });
    put(s, ph, { fillW: true });
    text(ph, "รูปหลังซ่อม (1–3 รูป)", { size: 14, w: "sb" });
    photoGrid(ph, 1, 104, { addTile: "1/3" });
    input(s, { label: "สาเหตุ", value: "ท่อน้ำทิ้งแอร์ตัน ทำความสะอาดแล้ว" });
    input(s, { label: "อะไหล่ที่ใช้", optional: true, value: "น้ำยา R32 1 กก." });
    button(s, "ยืนยันซ่อมเสร็จ", { size: "lg", block: true, to: "T02f" });
  });
}

function T04() {
  const s = screen("T04", "แจ้งเตือน ช่าง", { role: "tech", nav: "notif", tabs: true, colW: 820 });
  pageHeader(s.col, { title: "แจ้งเตือน", large: true });
  const b = body(s.col, { p: [12, 20, 24, 20], gap: 8 });
  notifList(b, [
    { kind: "job", title: "งานใหม่เข้ามา", body: "MR-2609-0042 · เครื่องปรับอากาศ · CAMT301", time: "10 นาที", unread: true, to: "T02" },
    { kind: "job", title: "งานใหม่เข้ามา", body: "MR-2609-0041 · ไฟฟ้า · RB5 อาคารเรียนรวม 5 ห้อง RB5103", time: "35 นาที", to: "T02" },
    { kind: "reopened", title: "ผู้แจ้งแจ้งว่ายังไม่หาย", body: "MR-2609-0017 · HB7 ห้อง HB7402 งานถูกส่งกลับให้เจ้าหน้าที่", time: "1 วัน", to: "T02" },
    { kind: "closed", title: "ผู้แจ้งยืนยันงานแล้ว", body: "MR-2609-0012 ปิดงานเรียบร้อย", time: "3 วัน", to: "T01f" },
  ]);
  return finish(s);
}

function T05() {
  const s = screen("T05", "โปรไฟล์ ช่าง", { role: "tech", nav: "profile", tabs: true, colW: 820 });
  pageHeader(s.col, { title: "โปรไฟล์", subtitle: "ช่างสมศักดิ์ ใจดี", large: true });
  const b = body(s.col, { p: [16, 20, 24, 20], gap: 18 });
  const stats = box({ name: "Stats", dir: "h", gap: 10 });
  put(b, stats, { fillW: true });
  [["2", "งานค้าง"], ["14", "เสร็จใน 30 วัน"], ["4.8", "คะแนนเฉลี่ย"]].forEach(function (st) {
    const c = box({ name: "Stat/" + st[1], gap: 2, p: 14, fill: "surface", r: 16, stroke: wf() ? "line" : null });
    put(stats, c, { grow: true });
    text(c, st[0], { size: 22, w: "b" });
    text(c, st[1], { size: 13, c: "muted" });
  });
  detailSection(b, "ความถนัด", function (c) {
    const p = box({ name: "Skills", dir: "h", gap: 8 });
    put(c, p, { fillW: true });
    pill(p, "ไฟฟ้า", "purple");
    pill(p, "เครื่องปรับอากาศ", "purple");
    text(c, "ติดต่อเจ้าหน้าที่หากต้องการเปลี่ยนความถนัด", { size: 13, c: "muted", fillW: true });
  });
  detailSection(b, "ติดต่อ", function (c) {
    const r = box({ name: "Phone", dir: "h", gap: 8, cross: "CENTER" });
    put(c, r, { fillW: true });
    icon(r, "phone", 16, "muted");
    text(r, "089-111-2201", { size: 15 });
  });
  button(b, "ออกจากระบบ", { v: "danger", block: true, icon: "log-out", to: "T00" });
  return finish(s);
}

// ---------------------------------------------------------------------------
// Admin screens
// ---------------------------------------------------------------------------

function adminScreen(key, title, nav) {
  const s = screen(key, title, { role: "admin", nav: nav, colW: DESK_W });
  const m = body(s.col, { p: [isD() ? 0 : 16, 20, 24, 20], gap: 20 });
  return { s: s, m: m };
}

function adminTitle(main, title, subtitle, right) {
  const r = box({ name: "Page title", dir: isD() ? "h" : "v", gap: isD() ? 16 : 12, cross: isD() ? "CENTER" : "MIN" });
  put(main, r, { fillW: true });
  const t = box({ name: "Titles" });
  put(r, t, isD() ? { grow: true } : { fillW: true });
  text(t, title, { size: isD() ? 26 : 24, w: "b", lh: 130 });
  if (subtitle) text(t, subtitle, { size: 14, c: "muted", fillW: true });
  if (right) {
    const ctl = box({ name: "Controls", dir: "h", gap: 8, cross: "CENTER" });
    if (isD()) r.appendChild(ctl);
    else {
      put(r, ctl, { fillW: true });
      ctl.layoutWrap = "WRAP";
      ctl.counterAxisSpacing = 8;
    }
    right(ctl);
  }
  return r;
}

function kpi(parent, label, value, sub, o) {
  o = o || {};
  const c = box({ name: "KPI/" + label, gap: 6, p: isD() ? 18 : 14, fill: "surface", r: 16, stroke: wf() ? "line" : null });
  put(parent, c, { grow: true });
  const h = box({ name: "Head", dir: "h", gap: 8, cross: "CENTER" });
  put(c, h, { fillW: true });
  const ic = box({ name: "Icon", main: "CENTER", cross: "CENTER", w: 32, h: 32, r: 9, fill: o.tone ? TONE[o.tone][0] : "brandSoft" });
  icon(ic, o.icon || "clipboard", 16, o.tone ? TONE[o.tone][1] : "brand");
  h.appendChild(ic);
  text(h, label, { size: 13, w: "m", c: "muted", grow: true });
  const v = box({ name: "Value", dir: "h", gap: 6, cross: "MAX" });
  put(c, v, { fillW: true });
  text(v, value, { size: isD() ? 30 : 26, w: "b", c: o.tone === "red" ? "redI" : "ink", lh: 120 });
  if (o.unit) text(v, o.unit, { size: 14, c: "muted" });
  text(c, sub, { size: 12, c: "muted", fillW: true });
  return c;
}

function kpiGrid(main, items) {
  if (isD()) {
    const k = box({ name: "KPIs", dir: "h", gap: 16, cross: "MIN" });
    put(main, k, { fillW: true });
    items.forEach(function (it) { kpi(k, it[0], it[1], it[2], it[3]); });
    return;
  }
  // Mobile: two per row, the last one full width (grid-cols-2 in the web app).
  const g = box({ name: "KPIs", gap: 12 });
  put(main, g, { fillW: true });
  for (let i = 0; i < items.length; i += 2) {
    const row = box({ name: "KPI row", dir: "h", gap: 12, cross: "MIN" });
    put(g, row, { fillW: true });
    items.slice(i, i + 2).forEach(function (it) { kpi(row, it[0], it[1], it[2], it[3]); });
  }
}

function chartW() {
  return isD() ? (CUR_W - 20) / 2 : CUR_W - 40;
}

function chartRow(main) {
  const r = box({ name: "Charts", dir: isD() ? "h" : "v", gap: isD() ? 20 : 16, cross: "MIN" });
  put(main, r, { fillW: true });
  return r;
}

function chartCard(parent, title, build, o) {
  o = o || {};
  const c = box({ name: "Chart/" + title, gap: 14, p: isD() ? 20 : 16, fill: "surface", r: 16, stroke: wf() ? "line" : null });
  if (isD()) {
    c.layoutSizingHorizontal = "FIXED";
    c.resize(chartW(), c.height);
    parent.appendChild(c);
  } else {
    put(parent, c, { fillW: true });
  }
  const h = box({ name: "Head", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER" });
  put(c, h, { fillW: true });
  text(h, title, { size: 16, w: "b" });
  if (o.aside) text(h, o.aside, { size: 13, c: "muted" });
  build(c, (isD() ? chartW() : CUR_W) - (isD() ? 40 : 32));
  return c;
}

function svgNode(parent, svg) {
  const n = figma.createNodeFromSvg(svg);
  n.fills = [];
  parent.appendChild(n);
  return n;
}

function lineChartSvg(w, h, values) {
  const max = Math.max.apply(null, values) * 1.2;
  const step = w / (values.length - 1);
  const pts = values.map(function (v, i) {
    return (i * step).toFixed(1) + "," + (h - (v / max) * h).toFixed(1);
  });
  let grid = "";
  for (let i = 0; i <= 3; i++) grid += '<line x1="0" x2="' + w + '" y1="' + ((h / 3) * i).toFixed(1) + '" y2="' + ((h / 3) * i).toFixed(1) + '" stroke="' + hex("grid") + '"/>';
  const area = "M0," + h + " L" + pts.join(" L") + " L" + w + "," + h + " Z";
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' + grid +
    '<path d="' + area + '" fill="' + hex("c1") + '" fill-opacity="0.08"/>' +
    '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + hex("c1") + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>'
  );
}

function columnsSvg(w, h, series, colors) {
  const groups = series.length;
  const per = series[0].length;
  const max = Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s); })) * 1.15;
  const gw = w / groups;
  const bw = Math.min(28, (gw * 0.6) / per);
  let out = "";
  for (let i = 0; i <= 3; i++) out += '<line x1="0" x2="' + w + '" y1="' + ((h / 3) * i).toFixed(1) + '" y2="' + ((h / 3) * i).toFixed(1) + '" stroke="' + hex("grid") + '"/>';
  series.forEach(function (s, gi) {
    const x0 = gi * gw + (gw - bw * per - 4 * (per - 1)) / 2;
    s.forEach(function (v, bi) {
      const bh = (v / max) * h;
      out += '<rect x="' + (x0 + bi * (bw + 4)).toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="4" fill="' + hex(colors[bi]) + '"/>';
    });
  });
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' + out + "</svg>";
}

function hBars(parent, rows, width, colorKey) {
  const max = Math.max.apply(null, rows.map(function (r) { return r[1]; }));
  const labelW = isD() ? 150 : 110;
  const barMax = width - labelW - 40;
  rows.forEach(function (r) {
    const row = box({ name: "Bar/" + r[0], dir: "h", gap: 10, cross: "CENTER" });
    put(parent, row, { fillW: true });
    const lab = box({ name: "Label", w: labelW });
    row.appendChild(lab);
    text(lab, r[0], { size: 13, fillW: true });
    rect(row, Math.max(6, Math.round((r[1] / max) * barMax)), 14, r[2] || colorKey, 4);
    text(row, String(r[1]), { size: 13, w: "sb" });
  });
}

function legend(parent, items) {
  const r = box({ name: "Legend", dir: "h", gap: 16, cross: "CENTER" });
  put(parent, r, { fillW: true });
  items.forEach(function (it) {
    const l = box({ name: "Key/" + it[0], dir: "h", gap: 6, cross: "CENTER" });
    rect(l, 10, 10, it[1], 3);
    text(l, it[0], { size: 12, c: "muted" });
    r.appendChild(l);
  });
}

function axisLabels(parent, labels) {
  const row = box({ name: "Labels", dir: "h" });
  put(parent, row, { fillW: true });
  labels.forEach(function (l) {
    const cell = box({ name: l, cross: "CENTER" });
    put(row, cell, { grow: true });
    text(cell, l, { size: 12, c: "muted" });
  });
}

function A01() {
  const a = adminScreen("A01", "แดชบอร์ด", "dash");
  const m = a.m;
  adminTitle(m, "แดชบอร์ด", "ภาพรวมงานซ่อม · 18 ส.ค. – 17 ก.ย. 69", function (r) {
    segmented(r, ["7 วัน", "30 วัน", "เดือนนี้", "กำหนดเอง"], 1, { hug: true });
    button(r, "Excel", { v: "secondary", icon: "sheet", size: "sm" });
    button(r, "PDF", { v: "secondary", icon: "file-text", size: "sm" });
  });
  kpiGrid(m, [
    ["คำร้องทั้งหมด", "43", "แจ้งเข้ามาในช่วงนี้", { icon: "clipboard" }],
    ["ยังไม่ปิดงาน", "14", "33% ของทั้งหมด", { icon: "clock", tone: "blue" }],
    ["ด่วนมากที่ยังเปิด", "3", "ควรจัดการก่อน", { icon: "alert", tone: "red" }],
    ["เวลาปิดงานเฉลี่ย", "38.5", "จาก 22 งานที่ปิด", { icon: "check-circle", tone: "green", unit: "ชม." }],
    ["ความพึงพอใจเฉลี่ย", "4.6", "จาก 19 คะแนน", { icon: "star", tone: "orange", unit: "/ 5" }],
  ]);

  const r1 = chartRow(m);
  chartCard(r1, "จำนวนคำร้องรายวัน", function (c, w) {
    svgNode(c, lineChartSvg(w, 180, [1, 2, 1, 3, 2, 4, 2, 1, 3, 5, 2, 3, 1, 2, 4, 3, 2, 1, 2, 3, 4, 2, 1, 3, 2, 1, 2, 3, 1, 2]));
  }, { aside: "30 วัน" });
  chartCard(r1, "แยกตามสถานะ", function (c, w) {
    hBars(c, [["รอรับเรื่อง", 6, "c5"], ["รับเรื่องแล้ว", 3, "c2"], ["มอบหมายช่างแล้ว", 3, "c2"], ["กำลังซ่อม", 4, "c2"], ["ซ่อมเสร็จ รอยืนยัน", 3, "c3"], ["ปิดงาน", 22, "c3"]], w, "c1");
  });

  const r2 = chartRow(m);
  chartCard(r2, "5 อาคารที่แจ้งมากที่สุด", function (c, w) {
    hBars(c, [["CAMT", 12], ["RB5 อาคารเรียนรวม 5", 9], ["HB7 คณะมนุษยศาสตร์", 6], ["หอพักนักศึกษาหญิง 3", 5], ["TLIC (ILC)", 4]], w, "c1");
  });
  chartCard(r2, "แยกตามประเภทปัญหา", function (c, w) {
    svgNode(c, columnsSvg(w, 160, [[9], [7], [11], [6], [4], [5], [1]], ["c1"]));
    axisLabels(c, ["ไฟฟ้า", "ประปา", "แอร์", "IT", "เฟอร์ฯ", "อาคาร", "อื่น ๆ"]);
  });

  const r3 = chartRow(m);
  chartCard(r3, "ภาระงานช่าง", function (c, w) {
    svgNode(c, columnsSvg(w, 150, [[2, 14], [3, 11], [1, 8]], ["c2", "c3"]));
    axisLabels(c, ["สมศักดิ์", "วิชัย", "พจน์ณิชา"]);
    legend(c, [["งานค้าง", "c2"], ["ปิดงานในช่วงนี้", "c3"]]);
  });
  chartCard(r3, "งานด่วนมากที่ค้างนานที่สุด", function (c) {
    text(c, "แตะเพื่อจัดการ", { size: 13, c: "muted" });
    const list = box({ name: "Urgent list", gap: 0 });
    put(c, list, { fillW: true });
    [["Zap", "MR-2609-0041", LOC_RB5_1, "assigned", "35 นาที"], ["Droplets", "MR-2609-0030", LOC_DORM, "in_progress", "3 วัน"], ["Building2", "MR-2609-0027", LOC_HB7, "waiting_parts", "4 วัน"]].forEach(function (u, i) {
      const r = box({ name: "Urgent/" + u[1], dir: "h", gap: 12, p: [10, 0], cross: "CENTER" });
      r.strokes = paint("line");
      r.strokeTopWeight = i === 0 ? 0 : 1;
      r.strokeBottomWeight = 0;
      r.strokeLeftWeight = 0;
      r.strokeRightWeight = 0;
      put(list, r, { fillW: true });
      catIcon(r, u[0], "sm");
      const t = box({ name: "Text" });
      put(r, t, { grow: true });
      text(t, u[1], { size: 14, w: "sb" });
      text(t, u[2], { size: 12, c: "muted", fillW: true });
      statusPill(r, u[3]);
      if (isD()) text(r, u[4], { size: 12, c: "muted" });
      link(r, "A03");
    });
    linkText(c, "ดูงานด่วนทั้งหมด", "A02", { size: 14 });
  });
  return finish(a.s);
}

const TABLE_COLS = [["เลขที่", 120], ["ประเภท", 170], ["สถานที่", 250], ["ผู้แจ้ง", 150], ["ความเร่งด่วน", 110], ["สถานะ", 150], ["ช่าง", 110]];
const TABLE_MOBILE_W = 1160;

const TABLE_ROWS = [
  ["MR-2609-0042", "AirVent", "CAMT · ชั้น 3 · CAMT301", "อนันต์ ศรีวงศ์", "normal", "pending", "—", "10 นาที"],
  ["MR-2609-0041", "Zap", "RB5 · ชั้น 1 · RB5103", "ศิริพร คำแสน", "urgent", "assigned", "สมศักดิ์", "35 นาที"],
  ["MR-2609-0039", "Droplets", "RB5 · ชั้น 2 · RB5202", "ณัฐวุฒิ ปัญญาดี", "normal", "need_info", "—", "1 วัน"],
  ["MR-2609-0035", "Monitor", "TLIC · ชั้น 2 · ILC-A204", "กมลชนก อินทร์แก้ว", "low", "in_progress", "พจน์ณิชา", "2 วัน"],
  ["MR-2609-0033", "Armchair", "BAB1 · ชั้น 3 · BAB1302", "ภูริภัทร สายสุวรรณ", "normal", "waiting_parts", "วิชัย", "2 วัน"],
  ["MR-2609-0030", "Droplets", "หอพักหญิง 3 · ห้องน้ำรวม", "ภานิชา ศรีกระจ่าง", "urgent", "in_progress", "วิชัย", "3 วัน"],
  ["MR-2609-0028", "AirVent", "HB7 · ชั้น 4 · HB7402", "สุภาวิกา นันทสุวรรณ", "normal", "completed", "สมศักดิ์", "4 วัน"],
  ["MR-2609-0021", "Zap", "สำนักหอสมุด · ห้องน้ำ", "ตรีรัตน์ จอมพันธ์", "normal", "closed", "สมศักดิ์", "6 วัน"],
  ["MR-2609-0019", "Building2", "CAMT · ชั้น 4 · CAMT401", "ธนภัทร มณีวงศ์", "low", "closed", "วิชัย", "8 วัน"],
  ["MR-2609-0015", "Ellipsis", "SCB1 · ชั้น 1 · SCB1100", "พิมพ์ชนก ทองดี", "normal", "rejected", "—", "10 วัน"],
];

function filterChip(parent, label) {
  const c = box({ name: "Filter/" + label, dir: "h", gap: 10, p: [0, 14], h: 40, r: 12, fill: "surface", cross: "CENTER", stroke: wf() ? "fillStrong" : null });
  text(c, label, { size: 14 });
  icon(c, "chevron-down", 16, "muted");
  parent.appendChild(c);
  return c;
}

function requestTable(main, rowTo) {
  adminTitle(main, "คำร้องทั้งหมด", "43 รายการ · แตะแถวเพื่อจัดการ");
  const fbar = box({ name: "Filters", dir: "h", gap: 10, cross: "CENTER" });
  put(main, fbar, { fillW: true });
  if (!isD()) {
    fbar.layoutWrap = "WRAP";
    fbar.counterAxisSpacing = 8;
  }
  const search = input(fbar, { placeholder: "ค้นหาเลขคำร้อง เช่น MR-2609", leading: "search" });
  search.layoutSizingHorizontal = "FIXED";
  search.resize(isD() ? 280 : CUR_W, search.height);
  ["ทุกสถานะ", "ทุกประเภท", "ทุกวิทยาเขต", "ทุกอาคาร", "ทุกความเร่งด่วน"].forEach(function (l) { filterChip(fbar, l); });
  linkText(fbar, "ล้างตัวกรอง", null, { size: 14 });

  // Mobile: the table keeps its width and scrolls sideways inside a clipped container.
  let host = main;
  if (!isD()) {
    host = box({ name: "Table scroller", clip: true });
    put(main, host, { fillW: true });
    host.overflowDirection = "HORIZONTAL";
  }
  const table = box({ name: "Table", fill: "surface", r: 16, clip: true, stroke: wf() ? "line" : null });
  if (isD()) put(host, table, { fillW: true });
  else {
    table.layoutSizingHorizontal = "FIXED";
    table.resize(TABLE_MOBILE_W, table.height);
    host.appendChild(table);
  }
  const head = box({ name: "Header row", dir: "h", p: [0, 8], h: 44, fill: wf() ? "fill" : "#FAFAFB", cross: "CENTER" });
  put(table, head, { fillW: true });
  TABLE_COLS.concat([["แจ้งเมื่อ", 0]]).forEach(function (c) {
    const cell = box({ name: "Col/" + c[0], p: [0, 10], cross: "MIN" });
    if (c[1]) {
      cell.layoutSizingHorizontal = "FIXED";
      cell.resize(c[1], cell.height);
    }
    put(head, cell, { grow: !c[1] });
    text(cell, c[0], { size: 13, w: "sb", c: "muted" });
  });
  TABLE_ROWS.forEach(function (r) {
    const row = box({ name: "Row/" + r[0], dir: "h", p: [0, 8], h: 60, cross: "CENTER" });
    row.strokes = paint("line");
    row.strokeTopWeight = 1;
    row.strokeBottomWeight = 0;
    row.strokeLeftWeight = 0;
    row.strokeRightWeight = 0;
    put(table, row, { fillW: true });
    const cells = [
      function (c) { text(c, r[0], { size: 14, w: "sb" }); },
      function (c) { const x = box({ name: "Cat", dir: "h", gap: 8, cross: "CENTER" }); catIcon(x, r[1], "sm"); text(x, CATEGORY[r[1]].name, { size: 14 }); c.appendChild(x); },
      function (c) { text(c, r[2], { size: 14 }); },
      function (c) { text(c, r[3], { size: 14 }); },
      function (c) { urgencyPill(c, r[4]); },
      function (c) { statusPill(c, r[5]); },
      function (c) { text(c, r[6], { size: 14, c: r[6] === "—" ? "muted" : "ink" }); },
      function (c) { text(c, r[7], { size: 13, c: "muted" }); },
    ];
    cells.forEach(function (build, ci) {
      const w = ci < TABLE_COLS.length ? TABLE_COLS[ci][1] : 0;
      const cell = box({ name: "Cell", dir: "h", p: [0, 10], cross: "CENTER" });
      if (w) {
        cell.layoutSizingHorizontal = "FIXED";
        cell.resize(w, cell.height);
      }
      put(row, cell, { grow: !w });
      build(cell);
    });
    if (rowTo) link(row, rowTo);
  });
  return table;
}

function A02() {
  const a = adminScreen("A02", "คำร้องทั้งหมด", "requests");
  requestTable(a.m, "A03");
  return finish(a.s);
}

// Right side panel (desktop) or full-screen panel (mobile) over a copy of the request table.
function panelScreen(key, title, build) {
  const W = isD() ? DW : MW;
  const H = isD() ? DH : MH;
  const pw = isD() ? 560 : MW;
  const f = figma.createFrame();
  f.name = K(key) + " · " + title;
  f.resize(W, H);
  f.fills = paint("page");
  f.clipsContent = true;
  const base = SCREENS[K("A02")];
  const bg = base.clone();
  f.appendChild(bg);
  bg.x = 0;
  bg.y = 0;
  bg.name = "Background · " + base.name;
  const dim = figma.createRectangle();
  dim.name = "Backdrop";
  dim.resize(W, H);
  dim.fills = paint("backdrop", 0.3);
  f.appendChild(dim);
  const p = box({ name: "Side panel", gap: 16, p: isD() ? [20, 24, 24, 24] : [0, 20, 24, 20], fill: "page", w: pw, clip: true });
  p.layoutSizingVertical = "FIXED";
  p.resize(pw, H);
  shadow(p, 0, 30, 0.15);
  f.appendChild(p);
  p.x = W - pw;
  p.y = 0;
  // Mobile: the panel covers the whole phone, so it carries the status bar itself.
  if (!isD()) statusBar(p);
  build(p);
  SCREENS[K(key)] = f;
  return f;
}

function panelHead(p, closeTo) {
  const h = box({ name: "Panel header", dir: "h", gap: 12, cross: "CENTER" });
  put(p, h, { fillW: true });
  const t = box({ name: "Titles" });
  put(h, t, { grow: true });
  text(t, "MR-2609-0042", { size: 20, w: "b" });
  text(t, "แจ้งโดย อนันต์ ศรีวงศ์ · 17 ก.ย. 69 14:30", { size: 13, c: "muted", fillW: true });
  const x = box({ name: "Close", main: "CENTER", cross: "CENTER", w: 40, h: 40, r: 20, fill: "surface" });
  x.cornerRadius = 20;
  icon(x, "x", 20, "muted");
  h.appendChild(x);
  link(x, closeTo);
}

// state: pending | accepted
function panelDetail(key, state) {
  return panelScreen(key, state === "pending" ? "จัดการคำร้อง รอรับเรื่อง" : "จัดการคำร้อง รับเรื่องแล้ว", function (p) {
    panelHead(p, "A02");
    requestHeaderCard(p, { cat: "AirVent", code: "MR-2609-0042", loc: LOC, status: state });
    const act = box({ name: "Actions", gap: 10 });
    put(p, act, { fillW: true });
    text(act, "การดำเนินการ", { size: 13, w: "m", c: "muted" });
    const u = box({ name: "Urgency", dir: "h", gap: 10, cross: "CENTER" });
    put(act, u, { fillW: true });
    text(u, "ความเร่งด่วน", { size: 14, w: "sb" });
    segmented(u, ["ไม่ด่วน", "ปกติ", "ด่วนมาก"], 1, { hug: true });
    const r1 = box({ name: "Primary actions", dir: "h", gap: 8 });
    put(act, r1, { fillW: true });
    if (state === "pending") button(r1, "รับเรื่อง", { grow: true, to: "A03a" });
    else button(r1, "มอบหมายช่าง", { grow: true, icon: "user", to: "A03b" });
    button(r1, "ขอข้อมูลเพิ่ม", { v: "secondary", grow: true });
    const r2 = box({ name: "Other actions", dir: "h", gap: 8 });
    put(act, r2, { fillW: true });
    button(r2, "รวมคำร้องซ้ำ", { v: "secondary", grow: true });
    button(r2, "ปฏิเสธ", { v: "danger", grow: true });
    const d = card(p, { gap: 8 });
    text(d, DESC, { size: 15, fillW: true, lh: 160 });
    photoGrid(d, 2, 96);
    const rp = card(p, { gap: 8, dir: "h", cross: "CENTER" });
    const av = circle(rp, 36, "fill");
    icon(av, "user", 18, "muted");
    const rt = box({ name: "Text" });
    put(rp, rt, { grow: true });
    text(rt, "อนันต์ ศรีวงศ์", { size: 14, w: "sb" });
    text(rt, "CAMT · 089-123-4567", { size: 13, c: "muted" });
  });
}

function A03b() {
  return panelScreen("A03b", "มอบหมายช่าง", function (p) {
    panelHead(p, "A02");
    const h = box({ name: "Title", gap: 4 });
    put(p, h, { fillW: true });
    text(h, "เลือกช่าง", { size: 18, w: "b" });
    text(h, "เรียงจากความถนัดตรงกับ “เครื่องปรับอากาศ” และงานค้างน้อยที่สุด", { size: 14, c: "muted", fillW: true });
    const list = groupList(p);
    [
      ["สมศักดิ์ ใจดี", "ไฟฟ้า · เครื่องปรับอากาศ", 2, true, true],
      ["พจน์ณิชา ทองย้อย", "อุปกรณ์ IT · อื่น ๆ · ไฟฟ้า", 1, false, false],
      ["วิชัย ศรีสุข", "ประปา · อาคารและสถานที่ · เฟอร์นิเจอร์", 3, false, false],
    ].forEach(function (t, i, arr) {
      listRow(list, {
        iconName: "user",
        label: "ช่าง" + t[0],
        detail: t[1],
        check: t[4],
        last: i === arr.length - 1,
        trailing: function (r) {
          const tags = box({ name: "Tags", dir: isD() ? "h" : "v", gap: 6, cross: isD() ? "CENTER" : "MAX" });
          if (t[3]) pill(tags, "เหมาะสมที่สุด", "green");
          pill(tags, "งานค้าง " + t[2], "gray");
          r.appendChild(tags);
        },
      });
    });
    const row = box({ name: "Buttons", dir: "h", gap: 8 });
    put(p, row, { fillW: true });
    button(row, "ยกเลิก", { v: "secondary", grow: true, to: "A03a" });
    button(row, "ยืนยันมอบหมาย", { grow: true, to: "A02" });
  });
}

function settingsScreen(key, title, tab, build) {
  const a = adminScreen(key, title, "settings");
  adminTitle(a.m, "ข้อมูลพื้นฐาน", "แก้ไขประเภทปัญหา สถานที่ และบัญชีช่าง ได้โดยไม่ต้องแก้โค้ด");
  const seg = segmented(a.m, ["ประเภทปัญหา", "สถานที่", "บัญชีช่าง"], tab, { hug: isD(), links: ["A04", "A04b", "A04c"] });
  seg.name = "Tabs";
  build(a.m);
  return finish(a.s);
}

function columnCard(parent, title, addLabel, width) {
  const c = box({ name: "Column/" + title, fill: "surface", r: 16, clip: true, stroke: wf() ? "line" : null });
  if (isD() && width) {
    c.layoutSizingHorizontal = "FIXED";
    c.resize(width, c.height);
    parent.appendChild(c);
  } else if (isD() && parent.layoutMode === "HORIZONTAL") {
    put(parent, c, { grow: true });
  } else {
    put(parent, c, { fillW: true });
  }
  const h = box({ name: "Head", dir: "h", main: "SPACE_BETWEEN", cross: "CENTER", p: [12, 16, 4, 16] });
  put(c, h, { fillW: true });
  text(h, title, { size: 15, w: "b" });
  if (addLabel) linkText(h, addLabel, null, { icon: "plus", iconSize: 16, size: 14 });
  return c;
}

function settingRow(parent, o) {
  const r = box({ name: "Setting/" + o.label, dir: "h", gap: 12, p: [8, 12, 8, 16], cross: "CENTER", fill: o.selected ? "brandSoft" : null });
  put(parent, r, { fillW: true });
  r.minHeight = 52;
  if (o.cat) catIcon(r, o.cat, "sm");
  const t = box({ name: "Text" });
  put(r, t, { grow: true });
  text(t, o.label, { size: 15, w: o.selected ? "sb" : "r", c: o.selected ? "brand" : "ink", fillW: true });
  if (o.detail) text(t, o.detail, { size: 13, c: "muted", fillW: true });
  if (o.pill) pill(r, o.pill[0], o.pill[1]);
  if (o.chevron) icon(r, "chevron-right", 16, "muted");
  const e = box({ name: "Edit", main: "CENTER", cross: "CENTER", w: 40, h: 40 });
  icon(e, "pencil", 16, "muted");
  r.appendChild(e);
  return r;
}

function A04() {
  return settingsScreen("A04", "ข้อมูลพื้นฐาน ประเภทปัญหา", 0, function (m) {
    const c = columnCard(m, "ประเภทปัญหา (7)", "เพิ่มประเภท", 640);
    Object.keys(CATEGORY).forEach(function (k) {
      settingRow(c, { cat: k, label: CATEGORY[k].name, pill: ["เปิดใช้งาน", "green"] });
    });
    spacer(c, 8);
  });
}

function A04b() {
  return settingsScreen("A04b", "ข้อมูลพื้นฐาน สถานที่", 1, function (m) {
    const row = box({ name: "Columns", dir: isD() ? "h" : "v", gap: 16, cross: "MIN" });
    put(m, row, { fillW: true });
    const c1 = columnCard(row, "วิทยาเขต (3)", "เพิ่ม");
    settingRow(c1, { label: "วิทยาเขตสวนสัก", detail: "71 อาคาร", selected: true, chevron: true });
    settingRow(c1, { label: "วิทยาเขตสวนดอก", detail: "11 อาคาร", chevron: true });
    settingRow(c1, { label: "วิทยาเขตแม่เหียะ", detail: "5 อาคาร", chevron: true });
    spacer(c1, 8);
    const c2 = columnCard(row, "อาคาร", "เพิ่ม");
    ["RB1 อาคารเรียนรวม 1 (ทรงกลม)", "RB5 อาคารเรียนรวม 5", "HB7 คณะมนุษยศาสตร์ (8 ชั้น)", CAMT, "TLIC ศูนย์นวัตกรรมการเรียนการสอน", "สำนักหอสมุด (Main Library)"].forEach(function (b) {
      settingRow(c2, { label: b, selected: b === CAMT, chevron: true });
    });
    spacer(c2, 8);
    const c3 = columnCard(row, "ห้อง", "เพิ่ม");
    [["CAMT101", 1], ["CAMT102", 1], ["CAMT Auditorium", 1], ["CAMT201", 2], ["CAMT301", 3], ["Lab Game", 3], ["CAMT401", 4]].forEach(function (r) {
      settingRow(c3, { label: r[0], detail: "ชั้น " + r[1] });
    });
    spacer(c3, 8);
  });
}

function A04c() {
  return settingsScreen("A04c", "ข้อมูลพื้นฐาน บัญชีช่าง", 2, function (m) {
    const c = columnCard(m, "บัญชีช่าง (3)", "เพิ่มช่าง", 760);
    settingRow(c, { label: "สมศักดิ์ ใจดี", detail: "tech01 · 089-111-2201 · ไฟฟ้า, เครื่องปรับอากาศ", pill: ["เปิดใช้งาน", "green"] });
    settingRow(c, { label: "วิชัย ศรีสุข", detail: "tech02 · 089-111-2202 · ประปา, อาคารและสถานที่, เฟอร์นิเจอร์", pill: ["เปิดใช้งาน", "green"] });
    settingRow(c, { label: "พจน์ณิชา ทองย้อย", detail: "pojnicha.t · ไม่มีเบอร์ · อุปกรณ์ IT, อื่น ๆ, ไฟฟ้า", pill: ["เปิดใช้งาน", "green"] });
    spacer(c, 8);
  });
}

// ---------------------------------------------------------------------------
// Page assembly
// ---------------------------------------------------------------------------

const REPORTER = [
  function () { return loginScreen("R01", "R02", "R01b", "anan.s"); },
  R01b, R02, R03, R04, R05a, R05, R05b, R06, R07, R08, R09, R09b, R10, R11, R12, R13, R14, R15,
];
const TECH = [
  function () { return loginScreen("T00", "T01", null, "tech01"); },
  T01,
  T01f,
  function () { return techDetail("T02", "assigned"); },
  function () { return techDetail("T02b", "in_progress"); },
  function () { return techDetail("T02c", "waiting_parts"); },
  function () { return techDetail("T02f", "completed"); },
  T03w, T03, T04, T05,
];
const ADMIN = [
  function () { return loginScreen("A00", "A01", null, "admin01"); },
  A01, A02,
  function () { return panelDetail("A03", "pending"); },
  function () { return panelDetail("A03a", "accepted"); },
  A03b, A04, A04b, A04c,
];

const GROUPS = [
  { title: "ผู้แจ้ง · มือถือ 390 × 844", device: "m", screens: REPORTER, note: "เข้าสู่ระบบ → ตั้งโปรไฟล์ → แจ้งซ่อม 4 ขั้น → ติดตามสถานะ → ยืนยัน/ให้คะแนน" },
  { title: "ผู้แจ้ง · เดสก์ท็อป 1440 × 900", device: "d", screens: REPORTER, note: "หน้าเดียวกันบนจอคอม: แถบเมนูซ้าย หน้าแรกและหน้าติดตามแบ่ง 2 คอลัมน์" },
  { title: "ช่าง · มือถือ 390 × 844", device: "m", screens: TECH, note: "เข้าสู่ระบบ → งานใหม่ → รับงาน → รออะไหล่ → ซ่อมเสร็จ แนบรูปหลังซ่อม → งานเสร็จแล้ว" },
  { title: "ช่าง · เดสก์ท็อป 1440 × 900", device: "d", screens: TECH, note: "หน้าเดียวกันบนจอคอม: ปุ่มดำเนินการอยู่คอลัมน์ขวาคู่กับไทม์ไลน์" },
  { title: "ผู้ดูแลระบบ · มือถือ 390 × 844", device: "m", screens: ADMIN, note: "เมนูด้านบน · ตารางเลื่อนซ้าย-ขวา · แผงจัดการเต็มจอ" },
  { title: "ผู้ดูแลระบบ · เดสก์ท็อป 1440 × 900", device: "d", screens: ADMIN, note: "แดชบอร์ด → คำร้องทั้งหมด → รับเรื่อง → มอบหมายช่าง · ข้อมูลพื้นฐาน" },
];

const FLOWS = [
  ["R01", "1 · ผู้แจ้ง · มือถือ"],
  ["R01d", "2 · ผู้แจ้ง · เดสก์ท็อป"],
  ["T00", "3 · ช่าง · มือถือ"],
  ["T00d", "4 · ช่าง · เดสก์ท็อป"],
  ["A00", "5 · ผู้ดูแลระบบ · มือถือ"],
  ["A00d", "6 · ผู้ดูแลระบบ · เดสก์ท็อป"],
];

const GAP_X = 96;
const GAP_Y = 160;

function selectedGroups(opts) {
  return GROUPS.filter(function (g) { return (g.device === "m" && opts.mobile !== false) || (g.device === "d" && opts.desktop !== false); });
}

async function buildPage(page, label, groups, done, total) {
  ICON_CACHE = {};
  ICON_HOLDER = figma.createFrame();
  ICON_HOLDER.name = "_icons";
  ICON_HOLDER.fills = [];
  ICON_HOLDER.x = -5000;
  ICON_HOLDER.y = -5000;
  LINKS = [];
  SCREENS = {};

  const titleFrame = box({ name: "Title", gap: 6 });
  text(titleFrame, "FastFix CMU — " + label, { size: 48, w: "b" });
  text(titleFrame, "สร้างจากเว็บจริงด้วยปลั๊กอิน · แต่ละกลุ่มเป็น Flow แยกกัน เปิดแท็บ Prototype เพื่อดูเส้น Interaction · ฟอนต์: " + FONT_FAMILY, { size: 20, c: "muted" });
  titleFrame.x = 0;
  titleFrame.y = -220;

  let y = 0;
  for (const g of groups) {
    DEVICE = g.device;
    const frames = [];
    for (const build of g.screens) {
      frames.push(build());
      done++;
      figma.ui.postMessage({ type: "progress", text: label + ": สร้างหน้า " + done + "/" + total });
      if (done % 4 === 0) await new Promise(function (r) { setTimeout(r, 0); });
    }
    // Lay out in rows (desktop frames wrap every 6 to keep the canvas manageable).
    const perRow = g.device === "m" ? 18 : 6;
    let x = 0;
    let rowTop = y + 120;
    let rowH = 0;
    let maxX = 0;
    frames.forEach(function (fr, i) {
      if (i > 0 && i % perRow === 0) {
        rowTop += rowH + GAP_X;
        x = 0;
        rowH = 0;
      }
      fr.x = x;
      fr.y = rowTop;
      x += fr.width + GAP_X;
      maxX = Math.max(maxX, x);
      rowH = Math.max(rowH, fr.height);
    });
    const bottom = rowTop + rowH;
    let container = null;
    if (typeof figma.createSection === "function") {
      container = figma.createSection();
      container.name = g.title;
      container.x = -80;
      container.y = y - 40;
      page.appendChild(container);
      for (const fr of frames) {
        const ax = fr.x;
        const ay = fr.y;
        container.appendChild(fr);
        fr.x = ax + 80;
        fr.y = ay - y + 40;
      }
      container.resizeWithoutConstraints(maxX - GAP_X + 160, bottom - y + 120);
    }
    const heading = box({ name: "Group heading/" + g.title, gap: 4 });
    text(heading, g.title, { size: 32, w: "b" });
    text(heading, g.note, { size: 18, c: "muted" });
    if (container) {
      container.appendChild(heading);
      heading.x = 80;
      heading.y = 30;
    } else {
      heading.x = 0;
      heading.y = y;
    }
    y = bottom + GAP_Y + 80;
  }
  ICON_HOLDER.remove();
  return done;
}

async function run(opts) {
  figma.ui.postMessage({ type: "progress", text: "กำลังโหลดฟอนต์..." });
  await loadFonts();
  const jobs = [];
  if (opts.ui) jobs.push({ mode: "ui", name: "UI — FastFix CMU", old: "UI — แจ้งซ่อม มช.", label: "UI" });
  if (opts.wf) jobs.push({ mode: "wf", name: "Wireframe — FastFix CMU", old: "Wireframe — แจ้งซ่อม มช.", label: "Wireframe" });
  const groups = selectedGroups(opts);
  const perJob = groups.reduce(function (n, g) { return n + g.screens.length; }, 0);
  const total = perJob * jobs.length;
  let done = 0;
  const summary = [];
  let lastPage = null;
  for (const job of jobs) {
    MODE = job.mode;
    const old = figma.root.children.filter(function (p) { return p.name === job.name || p.name === job.old; });
    const page = figma.createPage();
    page.name = opts.replace || old.length === 0 ? job.name : job.name + " (" + (old.length + 1) + ")";
    await figma.setCurrentPageAsync(page);
    if (opts.replace) old.forEach(function (p) { p.remove(); });
    done = await buildPage(page, job.label, groups, done, total);
    let links = 0;
    if (opts.proto) {
      figma.ui.postMessage({ type: "progress", text: job.label + ": กำลังโยงเส้น Interaction..." });
      links = await wire(page, FLOWS);
    }
    summary.push(job.label + " " + Object.keys(SCREENS).length + " หน้า" + (opts.proto ? " · " + links + " เส้น" : ""));
    if (opts.proto && WIRE_FAILED.length) {
      summary.push(job.label + " ข้าม " + WIRE_FAILED.length + " เส้น (" + WIRE_FAILED.slice(0, 3).join(", ") + ")");
    }
    lastPage = page;
  }
  if (lastPage) {
    await figma.setCurrentPageAsync(lastPage);
    figma.viewport.scrollAndZoomIntoView(lastPage.children);
  }
  const msg = "เสร็จแล้ว: " + summary.join(" | ") + (FONT_FAMILY === "Inter" ? "\nไม่พบฟอนต์ภาษาไทย ข้อความไทยอาจแสดงผิด ติดตั้ง IBM Plex Sans Thai แล้วรันใหม่" : "");
  figma.ui.postMessage({ type: "done", text: msg });
  figma.notify("สร้างเสร็จ " + summary.join(" | "));
}
