import * as T from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
export async function createRenderer(canvas) {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  scene.background = new T.Color("#b5cacc");
  scene.fog = new T.FogExp2("#d0cebb", 0.0018);
  const camera = new T.PerspectiveCamera(
    58,
    innerWidth / innerHeight,
    0.15,
    900,
  );
  const hemi = new T.HemisphereLight("#dce9ed", "#88744d", 1.15);
  scene.add(hemi);
  const sun = new T.DirectionalLight("#ffe1ad", 3.6);
  sun.position.set(-130, 170, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 460;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.035;
  scene.add(sun, sun.target);
  try {
    const hdr = await new HDRLoader().loadAsync("/assets/kochi-sky.hdr");
    hdr.mapping = T.EquirectangularReflectionMapping;
    scene.background = hdr;
    scene.backgroundIntensity = 0.72;
    scene.backgroundRotation.y = 1.6;
    const pmrem = new T.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    scene.environmentIntensity = 0.4;
    pmrem.dispose();
  } catch (e) {
    console.warn("Sky fallback:", e.message);
  }
  addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });
  return { renderer, scene, camera, sun };
}
