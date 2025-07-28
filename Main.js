import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';

window.THREE = THREE; // make THREE global for PointerLockControls
let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false;
const velocity = new THREE.Vector3(), direction = new THREE.Vector3();
const objects = [];
let raycaster;

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 1000);
  camera.position.y = 10;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaaaaaa);
  scene.fog = new THREE.Fog(0xaaaaaa, 0, 750);

  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  controls = new THREE.PointerLockControls(camera, document.body);
  const blocker = document.getElementById('blocker');
  const instructions = document.getElementById('instructions');

  instructions.addEventListener('click', () => { controls.lock(); });
  controls.addEventListener('lock', () => { blocker.style.display = 'none'; });
  controls.addEventListener('unlock', () => { blocker.style.display = 'block'; });

  scene.add(controls.getObject());

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
  floorGeometry.rotateX(-Math.PI / 2);

  const position = floorGeometry.attributes.position;
  const color = new THREE.Color();
  const colors = [];

  for (let i = 0; i < position.count; i++) {
    colors.push(0.5 + Math.random()*0.5, 0.5 + Math.random()*0.5, 0.5 + Math.random()*0.5);
  }
  floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const floor = new THREE.Mesh(
    floorGeometry,
    new THREE.MeshBasicMaterial({ vertexColors: true })
  );
  scene.add(floor);

  // Boxes
  const boxGeometry = new THREE.BoxGeometry(20, 20, 20);
  for (let i = 0; i < 200; i++) {
    const box = new THREE.Mesh(
      boxGeometry,
      new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff })
    );
    box.position.set(
      (Math.random() - 0.5) * 800,
      Math.random() * 50 + 10,
      (Math.random() - 0.5) * 800
    );
    scene.add(box);
    objects.push(box);
  }

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', onWindowResize);
}

function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW': moveForward = true; break;
    case 'KeyA': moveLeft = true; break;
    case 'KeyS': moveBackward = true; break;
    case 'KeyD': moveRight = true; break;
    case 'Space': if (canJump) { velocity.y += 350; canJump = false; } break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW': moveForward = false; break;
    case 'KeyA': moveLeft = false; break;
    case 'KeyS': moveBackward = false; break;
    case 'KeyD': moveRight = false; break;
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (controls.isLocked) {
    const time = performance.now() / 1000;
    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects(objects);
    const onObject = intersections.length > 0;

    // Movement damping
    velocity.x -= velocity.x * 10.0 * (1/60);
    velocity.z -= velocity.z * 10.0 * (1/60);
    velocity.y -= 9.8 * 100 * (1/60);

    direction.z = (moveForward ? 1 : 0) - (moveBackward ? 1 : 0);
    direction.x = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400 * (1/60);
    if (moveLeft || moveRight) velocity.x -= direction.x * 400 * (1/60);

    if (onObject) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }

    controls.moveRight(-velocity.x * (1/60));
    controls.moveForward(-velocity.z * (1/60));

    controls.getObject().position.y += velocity.y * (1/60);
    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;
      canJump = true;
    }
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
