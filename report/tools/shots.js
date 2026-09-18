// Cut screens out of preview.html and screenshot them in rows with headless Edge.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
// preview.html comes from the Figma plugin mock renderer (see figma-plugin/README.md).
const html = fs.readFileSync(process.argv[3] || path.join(__dirname, "preview.html"), "utf8");
const head = html.slice(0, html.indexOf("<section"));
const OUT = process.argv[2];
const EDGE = "C:/Program Files/Google/Chrome/Application/chrome.exe";

function shot(id) {
  const start = html.indexOf(`<div class="shot" id="${id}">`);
  if (start < 0) throw new Error("missing " + id);
  // Walk balanced <div> tags.
  let depth = 0, i = start;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0] === "</div>" ? -1 : 1;
    if (depth === 0) { i = re.lastIndex; break; }
  }
  return html.slice(start, i).replace(/<b>[^<]*<\/b>/, "");
}

const FIGS = {
  "wf-reporter": { ids: ["Wireframe-R03", "Wireframe-R04", "Wireframe-R05", "Wireframe-R06"], w: 390, h: 844 },
  "ui-reporter": { ids: ["UI-R03", "UI-R04", "UI-R05b", "UI-R08"], w: 390, h: 844 },
  "ui-track": { ids: ["UI-R09", "UI-R10", "UI-R11", "UI-R13"], w: 390, h: 844 },
  "wf-tech": { ids: ["Wireframe-T01", "Wireframe-T02b", "Wireframe-T03"], w: 390, h: 844 },
  "ui-tech": { ids: ["UI-T01", "UI-T02b", "UI-T02c", "UI-T03"], w: 390, h: 844 },
  "ui-admin-dash": { ids: ["UI-A01d"], w: 1440, h: 900 },
  "ui-admin-assign": { ids: ["UI-A03bd"], w: 1440, h: 900 },
  "wf-admin": { ids: ["Wireframe-A02d"], w: 1440, h: 900 },
  "ui-reporter-desktop": { ids: ["UI-R09d"], w: 1440, h: 900 },
  "slide-reporter": { ids: ["Wireframe-R03", "UI-R03", "Wireframe-R05", "UI-R05b"], w: 390, h: 844 },
  "slide-tech": { ids: ["UI-T01", "UI-T02b", "UI-T03"], w: 390, h: 844 },
};

fs.mkdirSync(OUT, { recursive: true });
for (const [name, f] of Object.entries(FIGS)) {
  const gap = 40, pad = 30;
  const W = f.ids.length * f.w + (f.ids.length - 1) * gap + pad * 2;
  const H = f.h + pad * 2;
  const page = `${head}<style>body{background:#fff}.row{display:flex;gap:${gap}px;padding:${pad}px;align-items:flex-start}
.shot>div{max-height:${f.h}px;overflow:hidden;box-shadow:0 0 0 1px #d4d4d8;border-radius:${f.w < 500 ? 24 : 8}px}</style>
<div class="row">${f.ids.map(shot).join("")}</div>`;
  const file = `C:/tmp_shots/shot-${name}.html`;
  fs.writeFileSync(file, page);
  const png = path.join(OUT, `${name}.png`);
  execFileSync(EDGE, ["--headless=new", "--user-data-dir=C:/tmp_shots/chrome", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2", `--window-size=${W},${H}`, "--virtual-time-budget=8000", `--screenshot=${png}`, "file:///" + file.replace(/\\/g, "/")], { stdio: "ignore" });
  for (let t = 0; t < 60 && !fs.existsSync(png); t++) execFileSync("powershell", ["-c", "Start-Sleep -Milliseconds 500"]);
  console.log(name, W, H, fs.existsSync(png) ? fs.statSync(png).size : "MISSING");
}
