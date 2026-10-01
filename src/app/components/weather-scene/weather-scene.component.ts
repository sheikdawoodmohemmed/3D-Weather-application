import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { weatherMood, SceneMood } from '../../utils/weather-code.util';
@Component({
  selector: 'app-weather-scene',
  standalone: true,
  templateUrl: './weather-scene.component.html',
  styleUrl: './weather-scene.component.scss',
})
export class WeatherSceneComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvasEl', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hostEl', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  @Input() weatherCode = 0;
  @Input() isDay = true;
  @Input() windSpeed = 5;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private clock = new THREE.Clock();
  private frameId = 0;
  private ready = false;

  private sunMoon!: THREE.Group;
  private cloudGroups: THREE.Group[] = [];
  private precipitation?: THREE.Points;
  private ground!: THREE.Mesh;
  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private lightningFlash?: THREE.PointLight;
  private nextLightningAt = 0;

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.initScene();
    this.rebuildForWeather();
    this.ready = true;
    this.animate();

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.hostRef.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready) return;
    if (changes['weatherCode'] || changes['isDay']) {
      this.rebuildForWeather();
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.renderer?.dispose();
  }

  // ---------- Setup ----------

  private initScene() {
    const host = this.hostRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const width = host.clientWidth;
    const height = host.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    this.camera.position.set(0, 2.2, 9);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.minPolarAngle = Math.PI / 3.2;
    this.controls.maxPolarAngle = Math.PI / 1.9;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.7;
    this.controls.target.set(0, 1, 0);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    this.dirLight.position.set(4, 6, 3);
    this.scene.add(this.dirLight);

    this.ground = this.buildGround();
    this.scene.add(this.ground);

    this.sunMoon = this.buildSunMoon();
    this.scene.add(this.sunMoon);
  }

  private buildGround(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(40, 40, 48, 48);
    const pos = geo.attributes['position'];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const h = Math.sin(x * 0.3) * 0.25 + Math.cos(y * 0.25) * 0.25;
      pos.setZ(i, h);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x1b3a6b, flatShading: true, roughness: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -3;
    return mesh;
  }

  private buildSunMoon(): THREE.Group {
    const group = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(0.8, 24, 24);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0xffd36e });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    const glowTexture = this.makeGlowTexture();
    const glowMat = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffd36e,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(5, 5, 1);
    group.add(glow);

    group.position.set(2.8, 3.4, -4);
    group.name = 'sunMoon';
    return group;
  }

  private makeGlowTexture(): THREE.Texture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  private buildCloudGroup(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 });
    const puffCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < puffCount; i++) {
      const radius = 0.5 + Math.random() * 0.5;
      const geo = new THREE.IcosahedronGeometry(radius, 0);
      const puff = new THREE.Mesh(geo, mat);
      puff.position.set((Math.random() - 0.5) * 2.2, (Math.random() - 0.3) * 0.5, (Math.random() - 0.5) * 1.2);
      group.add(puff);
    }
    return group;
  }

  // ---------- Weather-reactive build ----------

  private rebuildForWeather() {
    const mood = weatherMood(this.weatherCode);

    this.clearClouds();
    this.clearPrecipitation();

    this.applySkyAndLight(mood);
    this.applyClouds(mood);
    this.applyPrecipitation(mood);
    this.applyGroundTone(mood);

    this.sunMoon.visible = mood !== 'storm';
    const sunBody = this.sunMoon.children[0] as THREE.Mesh;
    const mat = sunBody.material as THREE.MeshBasicMaterial;
    mat.color.set(this.isDay ? 0xffd36e : 0xcbd5e1);
  }

  private clearClouds() {
    for (const g of this.cloudGroups) {
      this.scene.remove(g);
      g.traverse((obj:any) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });
    }
    this.cloudGroups = [];
  }

  private clearPrecipitation() {
    if (this.precipitation) {
      this.scene.remove(this.precipitation);
      this.precipitation.geometry.dispose();
      (this.precipitation.material as THREE.Material).dispose();
      this.precipitation = undefined;
    }
  }

  private applySkyAndLight(mood: SceneMood) {
    const topColor = this.isDay ? new THREE.Color(0x3b82f6) : new THREE.Color(0x0b1220);
    const bottomColor = this.isDay ? new THREE.Color(0xdbeafe) : new THREE.Color(0x1e293b);

    const dimFactor = mood === 'storm' ? 0.5 : mood === 'cloudy' || mood === 'rain' ? 0.75 : 1;
    const bg = topColor.clone().lerp(bottomColor, 0.4).multiplyScalar(dimFactor);
    this.scene.background = bg;

    const fogNeeded = mood === 'fog' || mood === 'snow' || mood === 'storm';
    this.scene.fog = fogNeeded ? new THREE.Fog(bg.getHex(), 4, mood === 'fog' ? 9 : 16) : null;

    this.ambientLight.intensity = this.isDay ? (mood === 'storm' ? 0.4 : 0.65) : 0.25;
    this.dirLight.intensity = this.isDay ? (mood === 'storm' ? 0.5 : 1.1) : 0.3;
    this.dirLight.color.set(this.isDay ? 0xffffff : 0x8fb3ff);
  }

  private applyClouds(mood: SceneMood) {
    let count = 0;
    let opacity = 1;
    switch (mood) {
      case 'clear':
        count = 0;
        break;
      case 'partly-cloudy':
        count = 2;
        break;
      case 'cloudy':
      case 'fog':
        count = 4;
        opacity = 0.9;
        break;
      case 'drizzle':
      case 'rain':
        count = 5;
        opacity = 0.75;
        break;
      case 'snow':
        count = 4;
        opacity = 0.95;
        break;
      case 'storm':
        count = 6;
        opacity = 0.55;
        break;
    }

    for (let i = 0; i < count; i++) {
      const group = this.buildCloudGroup();
      group.position.set((Math.random() - 0.5) * 14, 2.6 + Math.random() * 1.6, -2 - Math.random() * 6);
      group.scale.setScalar(0.7 + Math.random() * 0.6);
      group.traverse((obj :any) =>  {
        if (obj instanceof THREE.Mesh) {
          const m = obj.material as THREE.MeshStandardMaterial;
          m.transparent = true;
          m.opacity = opacity;
          m.color.set(mood === 'storm' ? 0x4b5563 : 0xffffff);
        }
      });
      this.cloudGroups.push(group);
      this.scene.add(group);
    }
  }

  private applyPrecipitation(mood: SceneMood) {
    if (mood !== 'rain' && mood !== 'drizzle' && mood !== 'snow' && mood !== 'storm') {
      return;
    }
    const isSnow = mood === 'snow';
    const count = mood === 'storm' ? 1400 : isSnow ? 700 : mood === 'drizzle' ? 500 : 1000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 10 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: isSnow ? 0xffffff : 0x9fd3ff,
      size: isSnow ? 0.09 : 0.045,
      transparent: true,
      opacity: isSnow ? 0.9 : 0.7,
      depthWrite: false,
    });

    this.precipitation = new THREE.Points(geo, mat);
    this.precipitation.userData['isSnow'] = isSnow;
    this.precipitation.userData['speed'] = isSnow ? 0.8 : mood === 'storm' ? 6.5 : 4.2;
    this.scene.add(this.precipitation);
  }

  private applyGroundTone(mood: SceneMood) {
    const mat = this.ground.material as THREE.MeshStandardMaterial;
    const toneMap: Record<SceneMood, number> = {
      clear: 0x1b5e3a,
      'partly-cloudy': 0x1b5e3a,
      cloudy: 0x33455f,
      fog: 0x2d3b4e,
      drizzle: 0x263a52,
      rain: 0x203349,
      snow: 0xd7e3f0,
      storm: 0x1c2534,
    };
    mat.color.set(toneMap[mood]);
  }

  // ---------- Animation loop ----------

  private animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.getElapsedTime();

    this.sunMoon.position.y = 3.4 + Math.sin(elapsed * 0.3) * 0.15;

    const windFactor = 0.02 + this.windSpeed * 0.002;
    for (const group of this.cloudGroups) {
      group.position.x += dt * windFactor * 6;
      if (group.position.x > 9) group.position.x = -9;
    }

    if (this.precipitation) {
      const positions = this.precipitation.geometry.attributes['position'] as THREE.BufferAttribute;
      const speed = this.precipitation.userData['speed'] as number;
      const isSnow = this.precipitation.userData['isSnow'] as boolean;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i) - dt * speed;
        let x = positions.getX(i);
        if (isSnow) {
          x += Math.sin(elapsed + i) * dt * 0.3;
        }
        if (y < -3) {
          y = 9;
          x = (Math.random() - 0.5) * 16;
        }
        positions.setY(i, y);
        positions.setX(i, x);
      }
      positions.needsUpdate = true;
    }

    const mood = weatherMood(this.weatherCode);
    if (mood === 'storm') {
      if (elapsed > this.nextLightningAt) {
        this.triggerLightning();
        this.nextLightningAt = elapsed + 2 + Math.random() * 4;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private triggerLightning() {
    if (!this.lightningFlash) {
      this.lightningFlash = new THREE.PointLight(0xe0e7ff, 0, 30);
      this.lightningFlash.position.set(0, 5, -3);
      this.scene.add(this.lightningFlash);
    }
    const light = this.lightningFlash;
    light.intensity = 6;
    setTimeout(() => (light.intensity = 0), 120);
    setTimeout(() => (light.intensity = 3), 220);
    setTimeout(() => (light.intensity = 0), 320);
  }

  private onResize() {
    const host = this.hostRef.nativeElement;
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
