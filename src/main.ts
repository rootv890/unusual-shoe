import { animate, inView } from "motion";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { NoiseShader } from "./shader/noise-shader";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  DRACOLoader,
  OutputPass,
  ShaderPass,
} from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// GLTF and DRACO loaders
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setPath("/draco/");
loader.setDRACOLoader(dracoLoader);

// Initialize scene, camera, and renderer
const canvas = document.querySelector("canvas#canvas") as HTMLCanvasElement;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 2;

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 1);
const keyLight = new THREE.DirectionalLight(0xffffff, 1);
keyLight.position.set(-1, 1, 3);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(1, 1, 3);
const backLight = new THREE.DirectionalLight(0xffffff, 1);
backLight.position.set(-1, 3, 1);
camera.add(ambientLight, keyLight, fillLight, backLight);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Postprocessing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera)); // Start
const noiseShader = new ShaderPass(NoiseShader);
composer.addPass(noiseShader);
composer.addPass(new OutputPass()); // End

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 2;

// Main object group
const loadGroup = new THREE.Group();
loadGroup.position.y = -10; // offset from screen
const scrollGroup = new THREE.Group(); // to make it scroll responsve
scrollGroup.add(loadGroup);
scene.add(scrollGroup);

// Animation for content elements
animate("section.content h2, section.content img", { opacity: 0, y: -100 });
inView("section.content", (info) => {
  animate(
    info.target.querySelectorAll("h2, img"),
    { opacity: [0, 1], y: [-100, 0] },
    { duration: 1 }
  );
});

// Preloader and model loading
const preloadTag = document.querySelector(".loader") as HTMLDivElement;

loader.load(
  "/sneaker.glb",
  (gltf) => {
    loadGroup.add(gltf.scene);

    animateSequence([
      {
        target: preloadTag,
        props: { y: "-100%" }, // move it out from screen
        options: { duration: 2.2, delay: 1, ease: "anticipate" },
      },
      {
        target: "header",
        props: { opacity: [0, 1], y: [-100, 0] },
        options: { duration: 1, delay: 2 },
      },
      {
        target: "section.new-drop",
        props: { opacity: [0, 1], y: [-100, 0] },
        options: { duration: 1, delay: 1.2 },
      },
      {
        target: loadGroup.position,
        props: { y: [-10, 0] },
        options: { duration: 2 },
      },
    ]);
  },
  (xhr) => {
    preloadTag.querySelector("span")!.textContent = `${Math.round(
      (xhr.loaded / xhr.total) * 100
    )}%`;
  },
  (err) => console.error(err)
);

// Animation tick function
const clock = new THREE.Clock();
let currentScrollEffect = 0;
let aimScrollEffect = 0;
let timeOutScrollEffect: number;

function tick() {
  const elapsedTime = clock.getElapsedTime();
  noiseShader.uniforms.time.value = elapsedTime;

  const effectDiff = (aimScrollEffect - currentScrollEffect) * 0.05;
  currentScrollEffect += effectDiff;
  noiseShader.uniforms.effect.value = currentScrollEffect;

  scrollGroup.rotation.set(0, window.scrollY * 0.001, 0);
  controls.update();
  composer.render();

  requestAnimationFrame(tick);
}
tick();

// Resizing and scrolling handlers
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("scroll", () => {
  clearTimeout(timeOutScrollEffect);
  aimScrollEffect = 1;
  timeOutScrollEffect = setTimeout(() => (aimScrollEffect = 0), 100);
});

// Utility for animation sequences
function animateSequence(
  animations: { target: any; props: any; options?: any }[]
) {
  animations.forEach(({ target, props, options }) =>
    animate(target, props, options)
  );
}
