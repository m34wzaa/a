import * as THREE from './node_modules/three/build/three.module.js'
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0x222222);
const lights = [new THREE.DirectionalLight(0xffffff, 1), new THREE.DirectionalLight(0xffffff, 1), new THREE.AmbientLight(0x404040)];
lights[0].position.set(3, 3, 3);
lights[1].position.set(-3, 3, -3);
scene.add(lights[0]);
scene.add(lights[1]);
scene.add(lights[2]);
const potLights = [];
const objects = [];
const ghosts = [];
const g = new THREE.Mesh((new THREE.BoxGeometry(0.5,3,3)), new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 0.5, roughness: 1 }));
const g2 = new THREE.Mesh((new THREE.BoxGeometry(3,3,0.5)), new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 0.5, roughness: 1 }));
let colour2 = 0x00ff00;
function ghostObject() {
    const ghost = new THREE.Mesh((rot ? new THREE.BoxGeometry(0.5,3,3) : new THREE.BoxGeometry(3,3,0.5)), new THREE.MeshStandardMaterial({ color: colour2, metalness: 0.5, roughness: 1, transparent: true, opacity: 0.5 }));
    const pos = new THREE.Vector3((camera.position.x + (-Math.cos(camera.rotation.y - 90 * Math.PI / 180) * 3)), camera.position.y - 0.1, (camera.position.z + (Math.sin(camera.rotation.y - 90 * Math.PI / 180) * 3)));
    ghost.position.set(pos.x, pos.y, pos.z);
    ghosts.push(ghost);
    scene.add(ghost);
}
function colour(hex) {
    return new THREE.MeshStandardMaterial({ color: hex, metalness: 0.5, roughness: 1 });
}
//stack overflow my beloved
function hexToHsl(hex) {
    let r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l * 100];
    const d = max - min;
    const s = l > 0.5? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = (g - b) / d + (g < b? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h * 60, s * 100, l * 100];
}
function hslToHex(h, s, l) {
 s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return (Math.round(f(0) * 255) << 16) | (Math.round(f(8) * 255) << 8) | Math.round(f(4) * 255);
}

function lightColour(hex) {
    return new THREE.MeshStandardMaterial({ color: hex, metalness: 1, roughness: 0, emissive: hex, emissiveIntensity: 1 });
}
function addObjects(x, y, z, xsize, ysize, zsize, mat) {
    const object = new THREE.Mesh(new THREE.BoxGeometry(xsize, ysize, zsize), mat);
    object.position.set(x, y, z);
    objects.push(object);
    scene.add(object);
}   
addObjects(0, 0, 0, 1, 1, 1, colour(0x00ff00));
lights.forEach(light => {
    const potLight = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32), lightColour(0xffffff));
    potLight.position.copy(light.position);
    scene.add(potLight);
    potLights.push(potLight);
});
document.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
let keys = []
let rot = false;
let toggle = false;
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if(e.key === 'r') {
        rot = !rot;
    }
    if(e.key === ' ') {
        toggle = !toggle;
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});
document.addEventListener('click', () => {
    document.body.requestPointerLock();
});
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.order = 'YXZ';
        camera.rotation.y -= e.movementX * 0.002 * sens;
        camera.rotation.x -= e.movementY * 0.002 * sens;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
});
let state = 1
document.addEventListener('wheel', (e) => {
    const [h, s, l] = hexToHsl(colour2);
    const step = 3;
    const newHue = (h + (e.deltaY < 0? step : -step) + 360) % 360;
    colour2 = hslToHex(newHue, s, l);
});
let sens = 5;
function animate() {
    requestAnimationFrame(animate);
    scene.remove(...ghosts);
    ghosts.pop();
    if(keys['w']) {
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        direction.y = 0;
        direction.normalize();
        camera.position.add(((keys['a'] && !keys['d']) || keys['d'] && !keys['a'] ? direction.multiplyScalar(0.0707) : direction.multiplyScalar(0.1)));
    }
    if(keys['s']) {
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion);
        direction.y = 0;
        direction.normalize();
        camera.position.add(((keys['a'] && !keys['d']) || keys['d'] && !keys['a'] ? direction.multiplyScalar(0.0707) : direction.multiplyScalar(0.1)));
    }
    if(keys['a']) {
        camera.position.add((keys['w'] && !keys['s'] || keys['s'] && !keys['w'] ? new THREE.Vector3(-0.0707, 0, 0) : new THREE.Vector3(-0.1, 0, 0)).applyQuaternion(camera.quaternion));
    }
    if(keys['d']) {
        camera.position.add((keys['w'] && !keys['s'] || keys['s'] && !keys['w'] ? new THREE.Vector3(0.0707, 0, 0) : new THREE.Vector3(0.1, 0, 0)).applyQuaternion(camera.quaternion));
    }
    if(toggle) {
        ghostObject();
    }
    camera.position.y = 1.6;
    renderer.render(scene, camera);
}
animate();