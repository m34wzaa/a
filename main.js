import * as THREE from './node_modules/three/build/three.module.js'
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.sortObjects = true;
function resizeRenderer() {
    const width2 = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width2 / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width2, height, false);
}
resizeRenderer();
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0x000000);
const lights = [new THREE.AmbientLight(0x404040)];
scene.add(lights[0]);
const potLights = [];
const objects = [];
const ghosts = [];
let width = 2
const g = new THREE.BoxGeometry(0.5,3,width + 0.5);
const g2 = new THREE.BoxGeometry(width + 0.5,3,0.5);
let colour2 = 0x00ff00;
let obj = 'wall';

function createWallMesh() {
    const material = new THREE.MeshStandardMaterial({ color: colour2, metalness: 0.5, roughness: 1 });
    material.depthWrite = true;
    material.depthTest = true;
    const geometry = rot ? g : g2;
    const wall = new THREE.Mesh(geometry, material);
    wall.renderOrder = objects.length;
    wall.userData.deletePreview = false;
    wall.userData.baseColor = colour2;
    return wall;
}
function getPlacementPosition(targetObj = obj) {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();

    const distance = 3 * Math.cos(camera.rotation.x);
    const position = camera.position.clone().addScaledVector(forward, distance);
    const y = targetObj === 'light' ? 2.99 : camera.position.y - 0.1;

    return new THREE.Vector3(
        Math.round(position.x),
        y,
        Math.round(position.z)
    );
}

function objectExistsAt(position) {
    return objects.some((object) => (
        Math.abs(object.position.x - position.x) < 0.001 &&
        Math.abs(object.position.y - position.y) < 0.001 &&
        Math.abs(object.position.z - position.z) < 0.001
    ));
}

function findObjectAt(position) {
    return objects.find((object) => (
        Math.abs(object.position.x - position.x) < 0.001 &&
        Math.abs(object.position.y - position.y) < 0.001 &&
        Math.abs(object.position.z - position.z) < 0.001
    ));
}

function setWallColour(object, hex) {
    if (object && object.material && object.material.color) {
        object.material.color.setHex(hex);
    }
}

function ghostObject() {
    if (obj === 'wall') {
        const pos = getPlacementPosition('wall');
        if (objectExistsAt(pos)) return;

        const ghostMaterial = new THREE.MeshStandardMaterial({ color: colour2, metalness: 0.5, roughness: 1, transparent: true, opacity: 0.5, luminosity: 0.3 });
        ghostMaterial.depthWrite = false;
        const ghost = new THREE.Mesh((rot ? new THREE.BoxGeometry(0.5,3,width + 0.5) : new THREE.BoxGeometry(width + 0.5,3,0.5)), ghostMaterial);
        ghost.position.copy(pos);
        ghosts.push(ghost);
        ghost.renderOrder = objects.length + 1;
        scene.add(ghost);
    }
    if (obj === 'light') {
        const pos = getPlacementPosition('light');
        if (objectExistsAt(pos)) return;

        const ghostMaterial = new THREE.MeshStandardMaterial({ color: colour3, metalness: 1, roughness: 0, emissive: colour3, emissiveIntensity: 1, transparent: true, opacity: 0.5 });
        ghostMaterial.depthWrite = false;
        const ghost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32), ghostMaterial);
        ghost.position.copy(pos);
        ghosts.push(ghost);
        scene.add(ghost);
    }
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
lights.forEach(light => {
    if (light instanceof THREE.DirectionalLight) {
        const potLight = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32), lightColour(0xffffff));
        potLight.position.copy(light.position);
        scene.add(potLight);
        potLights.push(potLight);
    }
});
window.addEventListener('resize', resizeRenderer);
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
    if(e.key === '1') {
        obj = 'wall';
    }
    if(e.key === '2') {
        obj = 'light';
    }
    if(e.key === 'q') {
        width += 1;
        g.z = width + 0.5;
    }
    if(e.key === 'e') {
        if(width > 1) {
            width -= 1;
            g2.x = width + 0.5;
        }
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});
let colour3 = 0xffffff;
document.addEventListener('click', () => {
    document.body.requestPointerLock();
    if (toggle) {
        if (obj === 'light') {
            const pos = getPlacementPosition('light');
            const existing = findObjectAt(pos);

            if (existing) {
                if (existing.userData.deletePreview) {
                    if (existing.userData.light) scene.remove(existing.userData.light);
                    scene.remove(existing);
                    const index = objects.indexOf(existing);
                    if (index !== -1) objects.splice(index, 1);
                    return;
                }

                setWallColour(existing, 0xff0000);
                existing.userData.deletePreview = true;
                return;
            }

            const light = new THREE.PointLight(colour3, 1.5, 20);
            light.position.copy(pos);
            scene.add(light);

            const potLightMaterial = lightColour(colour3);
            potLightMaterial.depthWrite = false;
            const potLight = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32), potLightMaterial);
            potLight.position.copy(pos);
            potLight.userData.baseColor = colour3;
            scene.add(potLight);
            potLight.userData.light = light;
            light.userData.visual = potLight;
            objects.push(potLight);
            potLights.push(potLight);
        } else if (obj === 'wall') {
            const pos = getPlacementPosition('wall');
            const existing = findObjectAt(pos);

            if (existing) {
                if (existing.userData.deletePreview) {
                    scene.remove(existing);
                    const index = objects.indexOf(existing);
                    if (index !== -1) objects.splice(index, 1);
                    return;
                }

                setWallColour(existing, 0xff0000);
                existing.userData.deletePreview = true;
                return;
            }

            const wall = createWallMesh();
            wall.position.copy(pos);
            wall.userData.baseColor = colour2;
            scene.add(wall);
            objects.push(wall);
        }
    }
});
let modes = ['wall', 'light'];
document.addEventListener('rightclick', () => {
    state = (state + 1) % modes.length;
    obj = modes[state];
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

    if (!toggle) {
        objects.forEach((object) => {
            if (object.userData.baseColor !== undefined) {
                setWallColour(object, object.userData.baseColor);
            }
            object.userData.deletePreview = false;
        });
    } else {
        const targetPosition = getPlacementPosition(obj);
        const targetObject = findObjectAt(targetPosition);

        objects.forEach((object) => {
            if (object.userData.deletePreview && (!targetObject || object !== targetObject)) {
                setWallColour(object, object.userData.baseColor ?? colour2);
                object.userData.deletePreview = false;
            }
        });

        if (targetObject) {
            setWallColour(targetObject, 0xff0000);
            targetObject.userData.deletePreview = true;
        }
    }

    if(keys['w']) {
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        direction.y = 0;
        direction.normalize();
        camera.position.add(((keys['a'] && !keys['d']) || keys['d'] && !keys['a'] ? direction.multiplyScalar(0.0707 / 2) : direction.multiplyScalar(0.05)));
    }
    if(keys['s']) {
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion);
        direction.y = 0;
        direction.normalize();
        camera.position.add(((keys['a'] && !keys['d']) || keys['d'] && !keys['a'] ? direction.multiplyScalar(0.0707 / 2) : direction.multiplyScalar(0.05)));
    }
    if(keys['a']) {
        camera.position.add((keys['w'] && !keys['s'] || keys['s'] && !keys['w'] ? new THREE.Vector3(-0.0707 / 2, 0, 0) : new THREE.Vector3(-0.05, 0, 0)).applyQuaternion(camera.quaternion));
    }
    if(keys['d']) {
        camera.position.add((keys['w'] && !keys['s'] || keys['s'] && !keys['w'] ? new THREE.Vector3(0.0707 / 2, 0, 0) : new THREE.Vector3(0.05, 0, 0)).applyQuaternion(camera.quaternion));
    }
    if(toggle) {
        ghostObject();
    }
    objects.forEach((object, index) => {
        object.renderOrder = index;
    });
    camera.position.y = 1.6;
    renderer.render(scene, camera);
}
animate();