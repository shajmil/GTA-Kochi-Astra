import * as T from "three";
const cache = new Map();
export function mat(color, roughness = 0.8, metalness = 0) {
  const key = color + "|" + roughness + "|" + metalness;
  if (!cache.has(key))
    cache.set(key, new T.MeshStandardMaterial({ color, roughness, metalness }));
  return cache.get(key);
}
const loader = new T.TextureLoader();
function tex(name, color = true) {
  const t = loader.load("/assets/" + name + ".jpg");
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.colorSpace = color ? T.SRGBColorSpace : T.NoColorSpace;
  t.anisotropy = 8;
  return t;
}
export const M = {
  concrete: new T.MeshStandardMaterial({
    color: "#d1cab8",
    map: tex("concrete-Diffuse"),
    normalMap: tex("concrete-nor_gl", false),
    normalScale: new T.Vector2(0.28, 0.28),
    roughness: 0.94,
  }),
  road: new T.MeshStandardMaterial({
    color: "#8e9393",
    map: tex("asphalt-Diffuse"),
    normalMap: tex("asphalt-nor_gl", false),
    normalScale: new T.Vector2(0.4, 0.4),
    roughness: 0.88,
  }),
  ground: new T.MeshStandardMaterial({
    color: "#88a26e",
    map: tex("grass-Diffuse"),
    normalMap: tex("grass-nor_gl", false),
    roughness: 1,
  }),
  glass: mat("#405e64", 0.21, 0.58),
  glassLight: mat("#72948e", 0.22, 0.45),
  white: mat("#e9e5d6"),
  paint: mat("#dedacd"),
  dark: mat("#283936"),
  steel: mat("#788582", 0.5, 0.55),
  teal: mat("#398a86", 0.6, 0.2),
  yellow: mat("#eac853"),
  red: mat("#a63d30"),
  rubber: mat("#202525"),
  bark: mat("#81715c"),
  leaf: mat("#426847"),
  leafLight: mat("#617d43"),
  soil: mat("#8f8168"),
  tile: mat("#a06348"),
  cream: mat("#d4c2a1"),
};
M.ground.map.repeat.set(160, 160);
M.ground.normalMap.repeat.set(160, 160);
export function signMaterial(
  text,
  {
    bg = "#173d39",
    fg = "#f5f2df",
    sub = "",
    size = 64,
    font = "sans-serif",
  } = {},
) {
  const key = [text, bg, fg, sub, size, font].join("|");
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(14, 14, 996, 228);
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = fg;
  ctx.font = `600 ${size}px ${font}`;
  ctx.fillText(text, 512, sub ? 98 : 128, 960);
  if (sub) {
    ctx.font = "400 32px sans-serif";
    ctx.fillText(sub, 512, 179, 940);
  }
  const texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  const m = new T.MeshStandardMaterial({
    map: texture,
    roughness: 0.65,
    emissive: "#ffffff",
    emissiveMap: texture,
    emissiveIntensity: 0.1,
  });
  cache.set(key, m);
  return m;
}
// Alpha-tested leaf clusters add fine silhouettes without high-poly foliage.
function foliageTexture(palm = false) {
  let c = document.createElement("canvas");
  c.width = palm ? 512 : 256;
  c.height = palm ? 128 : 256;
  const ctx = c.getContext("2d");
  let seed = 47;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  if (palm) {
    ctx.strokeStyle = "#607a40";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 64);
    ctx.lineTo(512, 64);
    ctx.stroke();
    for (let i = 0; i < 39; i++) {
      let u = 12 + i * 12.5,
        l = Math.sin((i / 39) * Math.PI) * 60;
      for (let s of [-1, 1]) {
        ctx.fillStyle = i % 3 ? "#668b42" : "#91a55b";
        ctx.beginPath();
        ctx.moveTo(u, 64);
        ctx.quadraticCurveTo(u + 13, 64 + s * l * 0.75, u + 22, 64 + s * l);
        ctx.quadraticCurveTo(u + 8, 64 + s * l * 0.7, u - 1, 64);
        ctx.fill();
      }
    }
  } else {
    for (let i = 0; i < 155; i++) {
      let a = random() * Math.PI * 2,
        r = Math.sqrt(random()) * 103,
        x = 128 + Math.cos(a) * r,
        y = 128 + Math.sin(a) * r;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = ["#527043", "#6f8a4c", "#789558", "#4c6840", "#8d9f5e"][
        Math.floor(random() * 5)
      ];
      ctx.beginPath();
      ctx.ellipse(0, 0, 3 + random() * 4, 7 + random() * 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  let t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
M.foliage = new T.MeshStandardMaterial({
  map: foliageTexture(),
  alphaTest: 0.45,
  side: T.DoubleSide,
  roughness: 1,
  color: "#b4c794",
});
M.frond = new T.MeshStandardMaterial({
  map: foliageTexture(true),
  alphaTest: 0.4,
  side: T.DoubleSide,
  roughness: 0.87,
  color: "#9aa975",
});
