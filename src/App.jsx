import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';

// Import otomatis semua gambar JPG, PNG, dll dari folder photo
const rawPhotos = import.meta.glob('/src/assets/photo/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { eager: true });
const textureUrls = Object.values(rawPhotos).map((mod) => mod.default);

// Import music snowfall
const rawMusic = import.meta.glob('/src/assets/music/snowfall.*', { eager: true });
const musicUrls = Object.values(rawMusic).map(mod => mod.default || mod);

function App() {
  const mountRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  // Fitur kecepatan
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const speedRef = useRef(speedMultiplier);

  // Fitur Musik
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const musicBtnRef = useRef(null);
  const musicTweenRef = useRef(null);

  // Refs untuk menyimpan object 3D agar bisa diakses di handler & loop
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const isStartedRef = useRef(isStarted);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    isStartedRef.current = isStarted;
  }, [isStarted]);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    // Autoplay music jika file ditemukan
    if (musicUrls.length > 0 && !window.bgMusic) {
      const audio = new Audio(musicUrls[0]);
      audio.volume = 1.0;
      audio.loop = true;
      audio.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(e => {
        setIsPlayingMusic(false);
        console.warn("Autoplay dicegah browser, harus menunggu klik user", e);
      });
      window.bgMusic = audio;
    } else if (window.bgMusic) {
      setIsPlayingMusic(!window.bgMusic.paused);
    }
  }, []);

  // Animasi GSAP untuk tombol musik
  useEffect(() => {
    if (musicBtnRef.current) {
      if (isPlayingMusic) {
        if (!musicTweenRef.current) {
          musicTweenRef.current = gsap.to(musicBtnRef.current, {
            scale: 1.05,
            boxShadow: "0 0 15px rgba(217,70,239,0.8)",
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        } else {
          musicTweenRef.current.play();
        }
      } else {
        if (musicTweenRef.current) {
          musicTweenRef.current.pause();
          gsap.to(musicBtnRef.current, { scale: 1, boxShadow: "0 0 0px rgba(217,70,239,0)", duration: 0.3 });
        }
      }
    }
  }, [isPlayingMusic]);

  const toggleMusic = () => {
    if (window.bgMusic) {
      if (isPlayingMusic) {
        window.bgMusic.pause();
        setIsPlayingMusic(false);
      } else {
        window.bgMusic.play();
        setIsPlayingMusic(true);
      }
    }
  };

  useEffect(() => {
    let scene, camera, renderer, controls, composer;
    let galaxyPoints, starField, photoGalaxyGroup, galacticCore;
    let textGroup, nebulaGroup;
    let shootingStars = [];
    let animationFrameId;
    const clock = new THREE.Clock();
    let previousTime = 0;

    const photoMeshes = [];

    const init = async () => {
      scene = new THREE.Scene();
      sceneRef.current = scene;

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 150, 400);
      cameraRef.current = camera;

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x010103);

      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement);
      }

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.02;
      controls.autoRotate = false; // Matikan autoRotate karena kita pakai parametric roaming
      controls.maxDistance = 500;
      controls.minDistance = 5;
      controlsRef.current = controls;

      // Event listener agar auto-camera berhenti saat user berinteraksi
      controls.addEventListener('start', () => {
        if (window.cameraTweenY) window.cameraTweenY.kill();
        userInteractedRef.current = true;
      });

      createGalacticCore();
      generateGalaxyParticles();
      createStarField();
      createShootingStars();
      createAestheticText();
      nebulaGroup = createNebulaClouds();

      await createPhotoGalaxyOptimized();

      const renderScene = new RenderPass(scene, camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.8,
        0.5,
        1.5
      );
      composer = new EffectComposer(renderer);
      composer.addPass(renderScene);
      composer.addPass(bloomPass);

      window.addEventListener('resize', onWindowResize);

      setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      animate();
    };

    function createNebulaClouds() {
      // Buat tekstur gradien abstrak (awan yang tidak bulat sempurna/beraturan)
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');

      // Menggambar beberapa gumpalan acak agar teksturnya berbentuk awan abstrak
      const numBlobs = 5;
      for (let j = 0; j < numBlobs; j++) {
        const cx = 128 + (Math.random() - 0.5) * 80;
        const cy = 128 + (Math.random() - 0.5) * 80;
        const r = 40 + Math.random() * 60;
        const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 256);
      }

      const texture = new THREE.CanvasTexture(canvas);

      const group = new THREE.Group();

      // Tambahkan lebih banyak awan (~40 awan)
      for (let i = 0; i < 40; i++) {
        const mat = new THREE.SpriteMaterial({
          map: texture,
          color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6), // Warna-warni
          transparent: true,
          opacity: 0.04, // Dipertipis lagi karena jumlahnya bertambah banyak
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          rotation: Math.random() * Math.PI * 2 // Rotasi acak agar bentuk abstraknya semakin acak
        });
        const sprite = new THREE.Sprite(mat);

        // Tersebar di seluruh galaxy
        const r = 10 + Math.random() * 80;
        const theta = Math.random() * Math.PI * 2;
        const yOffset = (Math.random() - 0.5) * 20;

        sprite.position.set(
          r * Math.cos(theta),
          yOffset,
          r * Math.sin(theta)
        );

        // Skala asimetris agar tidak terlihat bulat
        const scaleX = 20 + Math.random() * 40;
        const scaleY = 20 + Math.random() * 40;
        sprite.scale.set(scaleX, scaleY, 1);

        group.add(sprite);
      }
      scene.add(group);

      return group;
    }

    function createAestheticText() {
      textGroup = new THREE.Group();
      scene.add(textGroup);

      const fontLoader = new FontLoader();
      fontLoader.load('/fonts/optimer_italic.typeface.json', (font) => {
        const textMatFront = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xff0066, // Warna seirama dengan inti galaksi (merah muda terang)
          emissiveIntensity: 2.0,
          roughness: 0.2,
          metalness: 0.8
        });

        const textMatSide = new THREE.MeshStandardMaterial({
          color: 0x3300ff,
          emissive: 0x3300ff, // Biru galaksi untuk bagian samping/ketebalan
          emissiveIntensity: 1.0,
          roughness: 0.4,
          metalness: 1.0
        });

        const textGeoMain = new TextGeometry('Awen universe is mine', {
          font: font,
          size: 1.0, // Disesuaikan agar panjang keseluruhannya kira-kira sama dengan diameter inti galaksi (12)
          height: 0.05, // Dibuat sangat tipis (3d tipis)
          curveSegments: 32,
          bevelEnabled: true,
          bevelThickness: 0.02,
          bevelSize: 0.01,
          bevelOffset: 0,
          bevelSegments: 4
        });
        textGeoMain.center();
        const mainText = new THREE.Mesh(textGeoMain, [textMatFront, textMatSide]);
        mainText.position.y = 8.0; // Tepat melayang di atas batas inti galaksi
        textGroup.add(mainText);
      });
    }

    function createGalacticCore() {
      galacticCore = new THREE.Group();
      const hdrColor = new THREE.Color(4.0, 2.0, 5.0);
      const coreGeo = new THREE.SphereGeometry(4, 32, 32);
      const coreMat = new THREE.MeshBasicMaterial({ color: hdrColor });
      const core = new THREE.Mesh(coreGeo, coreMat);

      const auraGeo = new THREE.SphereGeometry(6, 32, 32);
      const auraMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(1.5, 0.5, 2.0),
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);

      const light = new THREE.PointLight(0xdd88ff, 3, 200);

      galacticCore.add(core);
      galacticCore.add(aura);
      galacticCore.add(light);
      scene.add(galacticCore);
    }

    function createShootingStars() {
      const geometry = new THREE.PlaneGeometry(0.15, 6);
      const baseMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });

      for (let i = 0; i < 20; i++) {
        const mat = baseMaterial.clone();
        mat.color.setHSL(Math.random(), 1.0, 0.7); // Warna-warni
        const mesh = new THREE.Mesh(geometry, mat);
        resetShootingStar(mesh);
        mesh.userData.delay = Math.random() * 500;
        scene.add(mesh);
        shootingStars.push(mesh);
      }
    }

    function resetShootingStar(mesh) {
      const r = 150 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      // Target pusat galaksi namun sedikit meleset agar natural
      const target = new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 50
      );

      mesh.lookAt(target);
      // Putar agar panjang plane searah dengan target
      mesh.rotateX(Math.PI / 2);

      const speed = 1 + Math.random() * 2; // Diperlambat drastis
      const direction = new THREE.Vector3().subVectors(target, mesh.position).normalize();
      mesh.userData.velocity = direction.multiplyScalar(speed);
      mesh.userData.life = 0;
      mesh.userData.maxLife = 50 + Math.random() * 50;
      mesh.userData.delay = 0;
      mesh.material.opacity = 0.8;
    }

    function loadTextureOptimized(url) {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          const aspect = img.width / img.height;
          const MAX_SIZE = 512;

          let finalImg = img;
          if (img.width > MAX_SIZE || img.height > MAX_SIZE) {
            const canvas = document.createElement('canvas');
            if (img.width > img.height) {
              canvas.width = MAX_SIZE;
              canvas.height = MAX_SIZE / aspect;
            } else {
              canvas.height = MAX_SIZE;
              canvas.width = MAX_SIZE * aspect;
            }
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            finalImg = canvas;
          }

          const texture = new THREE.CanvasTexture(finalImg);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.generateMipmaps = false;
          texture.minFilter = THREE.LinearFilter;

          resolve({ texture, aspect });
        };
        img.onerror = () => resolve(null);
      });
    }

    async function createPhotoGalaxyOptimized() {
      photoGalaxyGroup = new THREE.Group();

      const chunkSize = 20;
      let currentLoaded = 0;

      for (let i = 0; i < textureUrls.length; i += chunkSize) {
        const chunk = textureUrls.slice(i, i + chunkSize);

        const results = await Promise.all(chunk.map(url => loadTextureOptimized(url)));

        results.forEach((res) => {
          if (!res) return;
          const { texture, aspect } = res;

          const targetHeight = 1.75;
          const targetWidth = targetHeight * aspect;

          const geometry = new THREE.PlaneGeometry(targetWidth, targetHeight);

          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: false
          });

          const mesh = new THREE.Mesh(geometry, material);

          // Border garis putih pada image
          const edges = new THREE.EdgesGeometry(geometry);
          const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
          mesh.add(line);

          mesh.scale.setScalar(0.01);

          const r = 15 + Math.random() * 85;
          const theta = Math.random() * Math.PI * 2;
          const yOffset = (Math.random() - 0.5) * 5; // Jangan berjauhan atas bawah (sangat pipih)

          const x = r * Math.cos(theta);
          const y = yOffset;
          const z = r * Math.sin(theta);

          mesh.position.set(x, y, z);
          mesh.lookAt(0, y, 0);

          mesh.userData = {
            baseY: y,
            floatSpeed: 0.5 + Math.random() * 1.5,
            floatOffset: Math.random() * Math.PI * 2,
            targetScale: 1.0
          };

          photoMeshes.push(mesh);
          photoGalaxyGroup.add(mesh);
        });

        currentLoaded += chunk.length;
        setLoadedCount(currentLoaded);
      }

      scene.add(photoGalaxyGroup);
    }

    function generateGalaxyParticles() {
      const params = { count: 60000, size: 0.015, radius: 95, branches: 4, spin: 1, randomness: 0.4, randomnessPower: 3 };
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(params.count * 3);
      const colors = new Float32Array(params.count * 3);
      const colorInside = new THREE.Color('#ff0066');
      const colorOutside = new THREE.Color('#3300ff');

      for (let i = 0; i < params.count; i++) {
        const i3 = i * 3;
        const radius = Math.random() * params.radius;
        const spinAngle = radius * params.spin;
        const branchAngle = (i % params.branches) / params.branches * Math.PI * 2;

        const randomX = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;
        const randomY = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * (radius * 0.15);
        const randomZ = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        const mixedColor = colorInside.clone().lerp(colorOutside, radius / params.radius);
        colors[i3] = mixedColor.r; colors[i3 + 1] = mixedColor.g; colors[i3 + 2] = mixedColor.b;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({ size: params.size, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true });
      galaxyPoints = new THREE.Points(geometry, material);
      scene.add(galaxyPoints);
    }

    function createStarField() {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(5000 * 3);
      for (let i = 0; i < 5000; i++) {
        const i3 = i * 3;
        const r = 150 + Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        pos[i3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i3 + 2] = r * Math.cos(phi);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      starField = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.15, color: 0xffffff, transparent: true, opacity: 0.4 }));
      scene.add(starField);
    }

    function onWindowResize() {
      if (camera && renderer && composer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
      }
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      if (!composer) return;

      const time = clock.getElapsedTime();
      const deltaTime = time - previousTime;
      previousTime = time;

      const spd = speedRef.current; // Menggunakan pengali kecepatan

      if (galaxyPoints) galaxyPoints.rotation.y += 0.001 * spd; // Sangat pelan
      if (starField) starField.rotation.y += 0.0005 * spd;
      if (photoGalaxyGroup) photoGalaxyGroup.rotation.y += 0.0015 * spd;
      if (nebulaGroup) nebulaGroup.rotation.y += 0.0008 * spd;

      if (galacticCore) {
        const scale = 1 + Math.sin(time * 2 * spd) * 0.08;
        galacticCore.scale.set(scale, scale, scale);
      }

      if (textGroup) {
        textGroup.position.y = Math.sin(time * 1.5 * spd) * 1.0; // Ayunan naik turun saja
        // lookAt dihapus agar teks 3D bisa diputar oleh kursor bersama objek lain
      }

      // Animasi pergerakan foto
      photoMeshes.forEach(mesh => {
        if (mesh.scale.x < mesh.userData.targetScale) {
          mesh.scale.setScalar(mesh.scale.x + (mesh.userData.targetScale - mesh.scale.x) * 0.05 * spd);
        }
        mesh.position.y = mesh.userData.baseY + Math.sin(time * mesh.userData.floatSpeed * spd + mesh.userData.floatOffset) * 1.5;
      });

      // Animasi Bintang Jatuh
      shootingStars.forEach(star => {
        if (star.userData.delay > 0) {
          star.userData.delay -= spd;
          star.visible = false;
          return;
        }
        star.visible = true;
        // Bergerak sesuai velocity * pengali kecepatan
        star.position.addScaledVector(star.userData.velocity, spd);
        star.userData.life += spd;

        // Memudar perlahan saat mendekati batas akhir
        star.material.opacity = Math.max(0, 0.8 * (1 - (star.userData.life / star.userData.maxLife)));

        // Reset jika melebihi umur
        if (star.userData.life >= star.userData.maxLife) {
          resetShootingStar(star);
        }
      });

      if (controls && isStartedRef.current && !userInteractedRef.current && window.startParametricRoaming) {
        const t = time * 0.15 * spd; // Sedang (tidak terlalu cepat, tidak terlalu lambat)

        // Memutari seluruh galaxy dengan pola yang terlihat random (Lissajous/Sine wave combination)
        const radius = 45 + Math.sin(t * 1.3) * 15 + Math.cos(t * 0.8) * 10; // Maju mundur (zoom)
        const angle = t * 1.5 + Math.sin(t * 0.5) * 1.0; // Berputar dengan ritme dinamis
        const height = Math.sin(t * 0.9) * 20 + Math.cos(t * 0.4) * 15; // Naik turun secara halus

        const targetX = Math.cos(angle) * radius;
        const targetY = height;
        const targetZ = Math.sin(angle) * radius;

        // Kamera mendekat mulus ke titik roaming
        camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.02 * spd);
        // Target kamera bergeser sedikit agar terasa sangat organik (handheld feeling)
        controls.target.lerp(new THREE.Vector3(Math.sin(t) * 5, Math.cos(t) * 5, 0), 0.02 * spd);
      } else if (controls && !isStartedRef.current) {
        controls.target.y = Math.sin(time * 0.6) * 1.8;
        controls.target.x = Math.cos(time * 0.4) * 0.8;
      }

      // Pastikan OrbitControls tidak melakukan override saat kita menjalankan animasi masuk (GSAP) atau roaming (lerp)
      if (controls) {
        if (isStartedRef.current && !userInteractedRef.current) {
          // Jangan panggil controls.update(), agar kamera tidak di-reset paksa ke posisi lama
          camera.lookAt(controls.target); // Manual lookAt agar target tetap menjadi fokus
        } else {
          // Panggil update() hanya jika user berinteraksi, atau sebelum dimulai
          controls.update();
        }
      }

      composer.render();
    }

    init();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (renderer && mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, []);

  const handleStart = () => {
    setIsStarted(true);
    userInteractedRef.current = false; // Reset agar auto-roaming jalan
    window.startParametricRoaming = false;

    if (window.bgMusic && window.bgMusic.paused) {
      window.bgMusic.play().then(() => setIsPlayingMusic(true)).catch(e => console.warn(e));
    }

    if (cameraRef.current && controlsRef.current) {
      // Matikan autorotate bawaan OrbitControls karena kita ganti dengan sistem parametric kita
      controlsRef.current.autoRotate = false;

      // Animasi masuk (Zoom In Cepat dari kejauhan menuju galaksi)
      window.cameraTweenY = gsap.to(cameraRef.current.position, {
        duration: 2.5,
        x: 0,
        y: 10,
        z: 60,
        ease: "power2.inOut",
        onComplete: () => {
          // Setelah sampai di depan galaksi, nyalakan sistem roaming memutar yang halus dan random
          window.startParametricRoaming = true;
        }
      });
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden relative text-white font-sans bg-[#010103]">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Loading Screen */}
      <div
        className={`loading-screen ${!isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="w-20 h-20 border-b-4 border-fuchsia-500 rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-light tracking-[0.3em] uppercase glow-text">Assembling Memory Belt</h1>
        <p className="text-xs text-slate-400 mt-2">Unlocking Memory Fragments...</p>

        <div className="w-64 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
            style={{ width: `${(loadedCount / textureUrls.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* UI Overlay */}
      <div
        className={`fixed inset-0 z-10 flex flex-col justify-between p-8 transition-opacity duration-1500 ease-in-out pointer-events-none ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="glass-panel px-8 py-4">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">Awen Universe</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.4em]">All of Awen’s beauty was written into this galaxy</p>
          </div>
        </header>

        <main className="flex flex-col items-center text-center max-w-xl mx-auto pointer-events-none">
          <div
            className={`glass-panel p-10 pointer-events-auto transition-all duration-1000 transform ${isStarted ? 'opacity-0 translate-y-8 scale-95 hidden' : 'opacity-100 translate-y-0 scale-100'}`}
          >
            <h3 className="text-4xl font-light mb-4 tracking-tight">Memory Galaxy</h3>
            <p className="text-slate-300 mb-8 leading-relaxed font-light">"A universe built from quiet memories and the kind of beauty that lingers like starlight.
              Every heart, every feeling, every fleeting moment continues to orbit around Awen as if gravity itself was created by her existence.
              Enjoy your journey through the endless wonder of the ‘Awen Universe"</p>
            <button
              onClick={handleStart}
              className="px-10 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-full font-bold transition-all hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(167,139,250,0.5)]"
            >
              Explore Orbit
            </button>
          </div>
        </main>

        <footer className="flex justify-between items-end text-[10px] text-slate-400 tracking-widest uppercase pointer-events-auto">
          <div className="glass-panel px-6 py-3 flex gap-4 items-center">
            <div className="flex gap-4 border-r border-slate-700 pr-4 mr-2">
              <button
                ref={musicBtnRef}
                onClick={toggleMusic}
                className={`px-4 py-1.5 rounded-full border transition-all font-bold tracking-widest ${isPlayingMusic ? 'border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-200 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'border-slate-500 bg-transparent text-slate-400 hover:border-slate-400'}`}
              >
                {isPlayingMusic ? '♪ PLAYING' : '♪ PAUSED'}
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <span className="mr-2">Speed:</span>
              {[0.5, 1, 2].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeedMultiplier(s)}
                  className={`px-3 py-1 rounded-md border border-fuchsia-500/30 transition-all ${speedMultiplier === s ? 'bg-fuchsia-500/50 text-white shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'hover:bg-fuchsia-500/20'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
