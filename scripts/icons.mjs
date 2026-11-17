// Render icons/icon.svg into the PNG sizes the manifest needs.
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
const svg = readFileSync("icons/icon.svg", "utf8");
const png = (src, size) => new Resvg(src, { fitTo: { mode: "width", value: size } }).render().asPng();
for (const s of [180, 192, 512]) writeFileSync(`icons/icon-${s}.png`, png(svg, s));
const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#2a9d8f"/><g transform="translate(51 51) scale(.8)">${inner}</g></svg>`;
writeFileSync("icons/icon-512-maskable.png", png(maskable, 512));
console.log("icons done");
