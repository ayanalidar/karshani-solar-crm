// Generate PWA icons (PNG, multiple sizes) from the source logo.
// Sharp is already installed (used by Next.js for image optimization).
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "public", "logo.jpeg");
const OUT_DIR = path.join(__dirname, "..", "public");

const SIZES = [
  { name: "icon-192.png", size: 192, purpose: "any" },
  { name: "icon-512.png", size: 512, purpose: "any" },
  { name: "icon-192-maskable.png", size: 192, purpose: "maskable" },
  { name: "icon-512-maskable.png", size: 512, purpose: "maskable" },
  { name: "apple-touch-icon.png", size: 180, purpose: "apple" },
  { name: "favicon-32.png", size: 32, purpose: "favicon" },
  { name: "favicon-16.png", size: 16, purpose: "favicon" },
];

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error("Source logo not found:", SRC);
    process.exit(1);
  }

  console.log("Generating PWA icons from", SRC, "...");
  for (const { name, size, purpose } of SIZES) {
    const outPath = path.join(OUT_DIR, name);
    let pipeline = sharp(SRC).resize(size, size, { fit: "cover", position: "center" });

    // Maskable icons need safe padding (20% on each side) so the OS
    // can crop to circle/squircle without cutting the logo.
    if (purpose === "maskable") {
      const padding = Math.floor(size * 0.1);
      const innerSize = size - padding * 2;
      const inner = await sharp(SRC)
        .resize(innerSize, innerSize, { fit: "cover", position: "center" })
        .toBuffer();
      pipeline = sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 250, g: 246, b: 240, alpha: 1 }, // #faf6f0 cream
        },
      }).composite([{ input: inner, gravity: "center" }]);
    }

    await pipeline.png({ quality: 90 }).toFile(outPath);
    console.log(`✓ ${name} (${size}x${size}${purpose === "maskable" ? " maskable" : ""})`);
  }

  // Also generate favicon.ico (multi-size ICO)
  const ico32 = await sharp(SRC).resize(32, 32).png().toBuffer();
  const icoPath = path.join(OUT_DIR, "favicon.ico");
  await sharp(ico32).toFile(icoPath);
  console.log("✓ favicon.ico");

  console.log("\nAll PWA icons generated.");
}

main().catch((e) => { console.error(e); process.exit(1); });
