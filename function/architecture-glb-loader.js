import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const stage = document.getElementById("architecture-model-stage");
const status = document.getElementById("architecture-model-status");
let currentStatusText = "";

if (stage && status) {
  initFactoryGlbLoader();
}

function setStatus(message) {
  if (message === currentStatusText) {
    return;
  }

  currentStatusText = message;
  status.textContent = message;
  status.classList.remove("is-hidden");
}

function initFactoryGlbLoader() {
  window.__architectureGlbCleanup?.();

  if (window.location.protocol === "file:") {
    setStatus("Use Live Server: GLB cannot load from file://");
    return;
  }

  stage.dataset.loader = "glb-module";
  stage.querySelectorAll("canvas").forEach(canvas => canvas.remove());
  setStatus("Loading factory.glb");

  const scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog(0x080909, 34, 92);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 5000);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  stage.appendChild(renderer.domElement);

  renderer.domElement.setAttribute("aria-label", "Fixed 45 degree isometric factory model");
  renderer.domElement.style.pointerEvents = "auto";

  scene.add(new THREE.HemisphereLight(0xffffff, 0x151515, 1.8));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xb8c7ff, 0.9);
  fillLight.position.set(-5, 4, -4);
  scene.add(fillLight);

  const modelRoot = new THREE.Group();
  scene.add(modelRoot);

  const modelParts = [
    { key: "factory", label: "Factory", file: "../model/factory.glb", order: 0 },
    { key: "structure", label: "Structure", file: "../model/structure1.glb", order: 1 },
    { key: "core", label: "Core", file: "../model/core.glb", order: 2 },
    { key: "slab", label: "Slab", file: "../model/slab.glb", order: 3 },
    { key: "deck", label: "Deck", file: "../model/deck.glb", order: 4 },
    { key: "rail", label: "Rail", file: "../model/rail.glb", order: 5 }
  ];
  const overlaySteps = Array.from(stage.querySelectorAll("[data-assembly-step]"));
  const overlayProgress = stage.querySelector("[data-assembly-progress]");
  const stepKeyByPart = {
    factory: "factory",
    structure: "structure",
    core: "core",
    slab: "slab",
    deck: "deck-rail",
    rail: "deck-rail"
  };
  const scrollProgressByStep = {
    factory: 0,
    structure: 0.16,
    core: 0.35,
    slab: 0.54,
    "deck-rail": 0.82
  };
  let activeStepKey = "factory";
  const partStyles = {
    factory: { fill: 0xd8d9d4, edge: 0xffffff, fillOpacity: 1, edgeOpacity: 0.72 },
    structure: { fill: 0xf2f2ea, edge: 0xffffff, fillOpacity: 1, edgeOpacity: 0.92 },
    core: { fill: 0x777a76, edge: 0xdfe2dc, fillOpacity: 1, edgeOpacity: 0.58 },
    slab: { fill: 0xf5f5ee, edge: 0xffffff, fillOpacity: 1, edgeOpacity: 0.78 },
    deck: { fill: 0xbec0bb, edge: 0xf4f6ef, fillOpacity: 1, edgeOpacity: 0.64 },
    rail: { fill: 0xe8e9e2, edge: 0xffffff, fillOpacity: 1, edgeOpacity: 0.95 }
  };
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://unpkg.com/three@0.165.0/examples/jsm/libs/draco/");
  loader.setDRACOLoader(dracoLoader);
  const loadedParts = new Map();
  let finalAssemblyBox = null;
  let finalAssemblySphere = null;
  let cachedFactoryCenter = null;
  let cachedFinalBox = null;
  let assemblyMaxAxis = 1;
  let scrollProgress = 0;
  let lastRenderedScrollProgress = -1;
  let scrollFrame = null;
  let dragRotationFrame = null;
  let modelRotationY = -80;
  let pendingDragRotationY = modelRotationY;
  let isRightDraggingModel = false;
  let dragStartX = 0;
  let dragStartRotationY = modelRotationY;
  // Model view controls: increase zoom to enlarge, adjust rotationY for model angle.
  const modelViewZoom = 0.8;
  const modelScreenOffsetX = 0;
  const modelScreenOffsetY = 1;
  const rightDragRotationSpeed = 0.35;

  function resizeRenderer() {
    const width = stage.clientWidth || 1;
    const height = stage.clientHeight || 1;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    if (finalAssemblySphere) {
      frameCamera(finalAssemblySphere);
    }

    renderScene();
  }

  function renderScene() {
    renderer.render(scene, camera);
  }

  function applyCachedFactoryCenter() {
    if (!cachedFactoryCenter) {
      return;
    }

    const transformedCenter = cachedFactoryCenter.clone()
      .multiplyScalar(modelRoot.scale.x)
      .applyEuler(modelRoot.rotation);
    modelRoot.position.copy(transformedCenter).multiplyScalar(-1);
    modelRoot.updateMatrixWorld(true);
  }

  function setModelRotationY(nextRotationY) {
    modelRotationY = nextRotationY;
    modelRoot.rotation.y = THREE.MathUtils.degToRad(modelRotationY);
    applyCachedFactoryCenter();
    renderScene();
  }

  function requestModelRotationY(nextRotationY) {
    pendingDragRotationY = nextRotationY;

    if (dragRotationFrame) {
      return;
    }

    dragRotationFrame = window.requestAnimationFrame(() => {
      dragRotationFrame = null;
      setModelRotationY(pendingDragRotationY);
    });
  }

  function initRightDragRotation() {
    renderer.domElement.addEventListener("contextmenu", event => {
      event.preventDefault();
    });

    renderer.domElement.addEventListener("pointerdown", event => {
      if (event.button !== 2 || !finalAssemblySphere) {
        return;
      }

      event.preventDefault();
      isRightDraggingModel = true;
      dragStartX = event.clientX;
      dragStartRotationY = modelRotationY;
      renderer.domElement.setPointerCapture(event.pointerId);
    });

    renderer.domElement.addEventListener("pointermove", event => {
      if (!isRightDraggingModel) {
        return;
      }

      event.preventDefault();
      const deltaX = event.clientX - dragStartX;
      requestModelRotationY(dragStartRotationY + (deltaX * rightDragRotationSpeed));
    });

    function stopRightDrag(event) {
      if (!isRightDraggingModel) {
        return;
      }

      isRightDraggingModel = false;

      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    }

    renderer.domElement.addEventListener("pointerup", stopRightDrag);
    renderer.domElement.addEventListener("pointercancel", stopRightDrag);
    renderer.domElement.addEventListener("pointerleave", stopRightDrag);
  }

  function getVisualBox(object) {
    const box = new THREE.Box3();

    object.updateMatrixWorld(true);
    object.traverse(child => {
      if (!child.isMesh || !child.geometry) {
        return;
      }

      if (!child.geometry.boundingBox) {
        child.geometry.computeBoundingBox();
      }

      const childBox = child.geometry.boundingBox.clone();
      childBox.applyMatrix4(child.matrixWorld);
      box.union(childBox);
    });

    return box;
  }

  function frameAssembly(parts) {
    parts.forEach(part => {
      part.object.position.copy(part.finalPosition);
    });

    const factoryPart = parts.find(part => part.key === "factory") || parts[0];
    modelRoot.position.set(0, 0, 0);
    modelRoot.scale.setScalar(1);
    modelRoot.rotation.set(0, 0, 0);
    modelRoot.updateMatrixWorld(true);

    const alignedFactoryBox = getVisualBox(factoryPart.object);
    cachedFactoryCenter = alignedFactoryBox.getCenter(new THREE.Vector3());
    const factorySize = alignedFactoryBox.getSize(new THREE.Vector3());
    assemblyMaxAxis = Math.max(factorySize.x, factorySize.y, factorySize.z) || 1;
    const scale = 7 / assemblyMaxAxis;

    modelRoot.scale.setScalar(scale);
    modelRoot.rotation.set(
      0,
      THREE.MathUtils.degToRad(modelRotationY),
      0
    );
    applyCachedFactoryCenter();

    parts.forEach(part => {
      part.dropHeight = Math.max(assemblyMaxAxis * 1.35, 12);
    });

    const finalBox = getVisualBox(factoryPart.object);
    cachedFinalBox = finalBox.clone();
    finalAssemblyBox = cachedFinalBox.clone();
    finalAssemblySphere = cachedFinalBox.getBoundingSphere(new THREE.Sphere());
    frameCamera(finalAssemblySphere);
    updateScrollAssembly();
  }

  function frameCamera(sphere) {
    const finalBox = finalAssemblyBox || new THREE.Box3().setFromObject(modelRoot);
    const width = stage.clientWidth || 1;
    const height = stage.clientHeight || 1;
    const aspect = width / height;
    const padding = aspect < 0.8 ? 1.16 : 0.98;
    const radius = sphere.radius || 1;
    const distance = Math.max(radius * 8, 20);
    const isometricDirection = new THREE.Vector3(-1, 0.6, 1).normalize();
    const target = sphere.center.clone().add(new THREE.Vector3(modelScreenOffsetX, modelScreenOffsetY, 0));

    camera.position.set(
      target.x + isometricDirection.x * distance,
      target.y + isometricDirection.y * distance,
      target.z + isometricDirection.z * distance
    );
    camera.near = Math.max(0.01, distance / 150);
    camera.far = distance * 160;
    camera.lookAt(target);
    camera.updateMatrixWorld(true);

    const corners = [
      new THREE.Vector3(finalBox.min.x, finalBox.min.y, finalBox.min.z),
      new THREE.Vector3(finalBox.min.x, finalBox.min.y, finalBox.max.z),
      new THREE.Vector3(finalBox.min.x, finalBox.max.y, finalBox.min.z),
      new THREE.Vector3(finalBox.min.x, finalBox.max.y, finalBox.max.z),
      new THREE.Vector3(finalBox.max.x, finalBox.min.y, finalBox.min.z),
      new THREE.Vector3(finalBox.max.x, finalBox.min.y, finalBox.max.z),
      new THREE.Vector3(finalBox.max.x, finalBox.max.y, finalBox.min.z),
      new THREE.Vector3(finalBox.max.x, finalBox.max.y, finalBox.max.z)
    ];
    const viewRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const viewUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    corners.forEach(corner => {
      const relative = corner.sub(target);
      const projectedX = relative.dot(viewRight);
      const projectedY = relative.dot(viewUp);
      minX = Math.min(minX, projectedX);
      maxX = Math.max(maxX, projectedX);
      minY = Math.min(minY, projectedY);
      maxY = Math.max(maxY, projectedY);
    });

    const projectedWidth = Math.max(maxX - minX, 1);
    const projectedHeight = Math.max(maxY - minY, 1);
    const boxAspect = projectedWidth / projectedHeight;
    const frustumHeight = boxAspect > aspect
      ? (projectedWidth / aspect) * padding
      : projectedHeight * padding;
    const frustumWidth = frustumHeight * aspect;
    camera.zoom = modelViewZoom;

    camera.left = -frustumWidth / 2;
    camera.right = frustumWidth / 2;
    camera.top = frustumHeight / 2;
    camera.bottom = -frustumHeight / 2;
    camera.updateProjectionMatrix();
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - clamp(value, 0, 1), 3);
  }

  function getPartScrollProgress(part) {
    if (part.order === 0) {
      return 1;
    }

    const start = 0.04 + (part.order - 1) * 0.19;
    const end = start + 0.15;
    return easeOutCubic((scrollProgress - start) / (end - start));
  }

  function updateScrollProgress() {
    const viewer = stage.closest(".architecture-model-viewer") || stage;
    const scrollScene = stage.closest(".architecture-model-scroll") || viewer;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const sceneTop = scrollScene.getBoundingClientRect().top + window.scrollY;
    const animationStartY = sceneTop;
    const animationDistance = Math.max(scrollScene.offsetHeight - viewportHeight, viewportHeight);

    scrollProgress = clamp((window.scrollY - animationStartY) / animationDistance, 0, 1);

    if (Math.abs(scrollProgress - lastRenderedScrollProgress) < 0.001) {
      return;
    }

    lastRenderedScrollProgress = scrollProgress;
    updateScrollAssembly();
  }

  function requestScrollUpdate() {
    if (scrollFrame) {
      return;
    }

    scrollFrame = window.requestAnimationFrame(() => {
      updateScrollProgress();
      scrollFrame = null;
    });
  }

  function scrollToAssemblyStep(stepKey) {
    const viewer = stage.closest(".architecture-model-viewer") || stage;
    const scrollScene = stage.closest(".architecture-model-scroll") || viewer;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const sceneTop = scrollScene.getBoundingClientRect().top + window.scrollY;
    const animationDistance = Math.max(scrollScene.offsetHeight - viewportHeight, viewportHeight);
    const targetProgress = scrollProgressByStep[stepKey] ?? 0;
    const targetY = sceneTop + (animationDistance * targetProgress);

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: "smooth"
    });
  }

  function initAssemblyStepNavigation() {
    overlaySteps.forEach(step => {
      step.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        scrollToAssemblyStep(step.dataset.assemblyStep);
      });
    });
  }

  function updateScrollAssembly() {
    if (loadedParts.size === 0) {
      return;
    }

    let activeLabel = "Factory";
    let nextActiveStepKey = "factory";

    modelParts.forEach(partDefinition => {
      const part = loadedParts.get(partDefinition.key);

      if (!part) {
        return;
      }

      const progress = getPartScrollProgress(part);
      part.object.position.y = part.finalPosition.y + ((1 - progress) * part.dropHeight);
      part.object.visible = part.order === 0 || progress > 0.01;

      if (part.order > 0) {
        part.meshMaterials.forEach(material => {
          material.transparent = false;
          material.opacity = 1;
          material.depthWrite = true;
        });

        part.edgeMaterials.forEach(material => {
          const baseOpacity = material.userData?.baseOpacity ?? 0.82;
          material.opacity = baseOpacity;
        });
      }

      if (progress > 0.55) {
        activeLabel = part.label;
        nextActiveStepKey = stepKeyByPart[part.key] || "factory";
      }
    });

    updateOverlay(nextActiveStepKey);
    setStatus(`${activeLabel}.glb loaded`);
    renderScene();
  }

  function updateOverlay(nextActiveStepKey) {
    if (overlayProgress) {
      overlayProgress.style.width = `${Math.round(scrollProgress * 1000) / 10}%`;
    }

    if (nextActiveStepKey === activeStepKey) {
      return;
    }

    activeStepKey = nextActiveStepKey;
    overlaySteps.forEach(step => {
      step.classList.toggle("is-active", step.dataset.assemblyStep === activeStepKey);
    });
  }

  function prepareModel(object, part) {
    const style = partStyles[part.key] || partStyles.factory;
    const meshMaterials = [];
    const edgeMaterials = [];

    object.traverse(child => {
      if (!child.isMesh) {
        return;
      }

      child.castShadow = true;
      child.receiveShadow = true;
      child.material = new THREE.MeshStandardMaterial({
        color: style.fill,
        roughness: 0.82,
        metalness: 0.04,
        transparent: style.fillOpacity < 1,
        opacity: style.fillOpacity,
        depthWrite: style.fillOpacity >= 0.96,
        side: THREE.DoubleSide
      });
      meshMaterials.push(child.material);

      const edgeMaterial = new THREE.LineBasicMaterial({
        color: style.edge,
        transparent: true,
        opacity: style.edgeOpacity,
        depthTest: true
      });
      edgeMaterial.userData.baseOpacity = style.edgeOpacity;
      edgeMaterials.push(edgeMaterial);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(child.geometry, 35),
        edgeMaterial
      );
      edges.name = `${child.name || "mesh"}-architectural-edge`;
      edges.matrixAutoUpdate = false;
      child.add(edges);
    });

    return {
      meshMaterials,
      edgeMaterials
    };
  }

  function disposeMaterial(material, disposedTextures) {
    Object.keys(material).forEach(key => {
      const value = material[key];

      if (value?.isTexture && !disposedTextures.has(value)) {
        value.dispose();
        disposedTextures.add(value);
      }
    });

    material.dispose();
  }

  function disposeObject(object, disposedGeometries, disposedMaterials, disposedTextures) {
    object.traverse(child => {
      if (child.geometry && !disposedGeometries.has(child.geometry)) {
        child.geometry.dispose();
        disposedGeometries.add(child.geometry);
      }

      const materials = Array.isArray(child.material)
        ? child.material
        : child.material ? [child.material] : [];

      materials.forEach(material => {
        if (disposedMaterials.has(material)) {
          return;
        }

        disposeMaterial(material, disposedTextures);
        disposedMaterials.add(material);
      });
    });
  }

  let isDisposed = false;

  function cleanup() {
    if (isDisposed) {
      return;
    }

    isDisposed = true;
    window.cancelAnimationFrame(scrollFrame);
    window.cancelAnimationFrame(dragRotationFrame);
    window.removeEventListener("scroll", requestScrollUpdate);
    window.removeEventListener("resize", resizeRenderer);

    const disposedGeometries = new Set();
    const disposedMaterials = new Set();
    const disposedTextures = new Set();
    disposeObject(modelRoot, disposedGeometries, disposedMaterials, disposedTextures);
    modelRoot.clear();
    scene.clear();
    dracoLoader.dispose();
    renderer.dispose();
    renderer.domElement.remove();

    if (window.__architectureGlbCleanup === cleanup) {
      window.__architectureGlbCleanup = null;
    }
  }

  window.__architectureGlbCleanup = cleanup;
  window.addEventListener("pagehide", cleanup, { once: true });

  function loadPart(part) {
    const modelUrl = new URL(part.file, import.meta.url).href;

    return new Promise((resolve, reject) => {
      loader.load(
        modelUrl,
        gltf => {
          if (isDisposed) {
            const disposedGeometries = new Set();
            const disposedMaterials = new Set();
            const disposedTextures = new Set();
            disposeObject(gltf.scene, disposedGeometries, disposedMaterials, disposedTextures);
            resolve(null);
            return;
          }

          const object = gltf.scene;
          object.name = part.key;
          const materialCache = prepareModel(object, part);
          modelRoot.add(object);
          resolve({
            ...part,
            object,
            meshMaterials: materialCache.meshMaterials,
            edgeMaterials: materialCache.edgeMaterials,
            finalPosition: object.position.clone(),
            dropHeight: 0
          });
        },
        progress => {
          if (!progress.total) {
            setStatus(`Loading ${part.label}.glb`);
            return;
          }

          const percent = Math.round((progress.loaded / progress.total) * 100);
          setStatus(`Loading ${part.label}.glb ${percent}%`);
        },
        error => {
          reject(new Error(`${part.label}.glb failed: ${error?.message || "check path/server"}`));
        }
      );
    });
  }

  Promise.all(modelParts.map(loadPart))
    .then(parts => {
      if (isDisposed) {
        return;
      }

      const availableParts = parts.filter(Boolean);

      if (availableParts.length === 0) {
        return;
      }

      availableParts.forEach(part => {
        loadedParts.set(part.key, part);
      });

      frameAssembly(availableParts);
      resizeRenderer();
      updateScrollProgress();
      window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    })
    .catch(error => {
      console.error("Architecture GLB assembly failed:", error);
      setStatus(error.message || "Assembly GLB failed");
    });

  window.addEventListener("resize", resizeRenderer);
  resizeRenderer();
  initRightDragRotation();
  initAssemblyStepNavigation();
}
