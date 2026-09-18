// Render every diagrams/*.puml to PNG + SVG, then wrap each SVG in a .drawio file.
// The .drawio keeps the PlantUML source (plantUmlData), so in draw.io you can
// double-click the diagram → Edit → change the code → it re-renders.
// Run: npm run diagrams   (needs Java 17+ and tools/plantuml.jar)
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "diagrams");
const JAR = path.join(__dirname, "tools", "plantuml.jar");
const OUT = path.join(__dirname, "out", "diagrams");
fs.mkdirSync(OUT, { recursive: true });

const sources = fs.readdirSync(DIR).filter((f) => f.endsWith(".puml")).sort();
for (const fmt of ["png", "svg"]) {
  execFileSync("java", ["-jar", JAR, "-charset", "UTF-8", `-t${fmt}`, "-o", OUT, ...sources.map((f) => path.join(DIR, f))], { stdio: "inherit" });
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "&#10;");
// draw.io's PlantUML server cannot see _style.iuml, so inline it.
const inline = (src) => src.replace(/^!include\s+(\S+)\s*$/gm, (_, f) => fs.readFileSync(path.join(DIR, f), "utf8").trim());

for (const f of sources) {
  const src = inline(fs.readFileSync(path.join(DIR, f), "utf8"));
  const name = src.match(/^@start\w+\s+(\S+)/m)[1];
  const svg = fs.readFileSync(path.join(OUT, `${name}.svg`), "utf8");
  const w = Math.ceil(parseFloat(svg.match(/width="([\d.]+)px"/)[1]));
  const h = Math.ceil(parseFloat(svg.match(/height="([\d.]+)px"/)[1]));
  const img = Buffer.from(svg).toString("base64");
  const data = esc(JSON.stringify({ data: src, format: "svg" }));
  const xml = `<mxfile host="app.diagrams.net"><diagram id="${name}" name="${name}"><mxGraphModel dx="${w}" dy="${h}" grid="1" gridSize="10" guides="1" page="1" pageWidth="${w + 40}" pageHeight="${h + 40}"><root><mxCell id="0"/><mxCell id="1" parent="0"/><UserObject label="" plantUmlData="${data}" id="2"><mxCell style="shape=image;noLabel=1;verticalAlign=top;aspect=fixed;imageAspect=0;image=data:image/svg+xml,${img};" vertex="1" parent="1"><mxGeometry x="20" y="20" width="${w}" height="${h}" as="geometry"/></mxCell></UserObject></root></mxGraphModel></diagram></mxfile>`;
  fs.writeFileSync(path.join(OUT, `${name}.drawio`), xml);
  console.log(`✓ ${name}: png, svg, drawio (${w}×${h})`);
}
