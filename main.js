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
scene.background = new THREE.Color(0x222222);
const lights = [new THREE.AmbientLight(0x404040), new THREE.DirectionalLight(0xffffff, 1)];
lights.forEach(element => {
    scene.add(element)
});
const potLights = [];
const objects = [];
const ghosts = [];
let width = 2;
let colour2 = 0x00ff00;
let obj = 'wall';

function getWallGeometry() {
    const length = width + 0.5;
    const geometry = rot
        ? new THREE.BoxGeometry(0.5, 3, 1)
        : new THREE.BoxGeometry(1, 3, 0.5);

    if (rot) {
        geometry.scale(1, 1, length);
    } else {
        geometry.scale(length, 1, 1);
    }
    return geometry;
}
function getFloorGeometry() {
    const geometry = new THREE.BoxGeometry(1, 0.5, 1);
    geometry.scale(width + 0.5, 1, width + 0.5);
    return geometry;
}
function getCeilingGeometry() {
    const geometry = new THREE.BoxGeometry(1, 0.5, 1);
    geometry.scale(width + 0.5, 1, width + 0.5);
    return geometry;
}
function createDoorMesh(material) {
    const door = new THREE.Group();
    const sideDepth = (width - 0.5) / 2;
    const sideY = camera.position.y - 1.6;
    const topY = camera.position.y - 0.6;
    const frameGeo = new THREE.Mesh(rot ? new THREE.BoxGeometry(0.5, 3, sideDepth) : new THREE.BoxGeometry(sideDepth, 3, 0.5), material);
    const leftFrame = frameGeo.clone();
    leftFrame.position.set(rot ? 0 : -(width + 1.5) / 4, sideY, rot ? -(width + 1.5) / 4 : 0);

    const rightFrame = frameGeo.clone();
    rightFrame.position.set(rot ? 0 : (width + 1.5) / 4, sideY, rot ? (width + 1.5) / 4 : 0);

    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(!rot ? 1 : 0.5, 1, !rot ? 0.5 : 1), material);
    topBeam.position.set(0, topY, 0);

    door.add(leftFrame, rightFrame, topBeam);
    door.userData.deletePreview = false;
    door.userData.baseColor = material && material.color ? material.color.getHex() : colour2;
    return door;
}
function getPlacementPosition(targetObj = obj) {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();

    const distance = 3 * Math.cos(camera.rotation.x);
    const position = camera.position.clone().addScaledVector(forward, distance);
    const y = targetObj === 'light' ? camera.position.y + 1.29 : targetObj === 'floor' ? camera.position.y - 1.6 : targetObj === 'ceiling' ? camera.position.y + 1.6 : targetObj === 'door' ? camera.position.y - 0.1 : targetObj === 'window' ? camera.position.y - 0.1 : targetObj === 'furniture' ? camera.position.y - 1.1 : targetObj === 'decoration' ? (camera.position.y - 1.1/*needs to be dependent on the furniture */) : camera.position.y - 0.1;

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
    if (!object) return;

    if (object.isGroup) {
        object.children.forEach((child) => setWallColour(child, hex));
        return;
    }

    if (Array.isArray(object.material)) {
        object.material.forEach((material) => {
            if (material && material.color) material.color.setHex(hex);
        });
        return;
    }

    if (object.material && object.material.color) {
        object.material.color.setHex(hex);
    }
}

function ghostObject() {
    if (obj === 'wall') {
        const pos = getPlacementPosition('wall');
        if (objectExistsAt(pos)) return;

        const ghostMaterial = new THREE.MeshStandardMaterial({ color: colour2, metalness: 0.5, roughness: 1, transparent: true, opacity: 0.8, emissive: colour2, emissiveIntensity: 0.02 });
        ghostMaterial.depthWrite = false;
        const ghost = new THREE.Mesh(getWallGeometry(), ghostMaterial);
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
    if(obj === 'floor') {
        const pos = getPlacementPosition('floor');
        if (objectExistsAt(pos)) return;

        const ghostMaterial = new THREE.MeshStandardMaterial({ color: colour2, metalness: 0.5, roughness: 1, transparent: true, opacity: 0.8, emissive: colour2, emissiveIntensity: 0.02 });
        ghostMaterial.depthWrite = false;
        const ghost = new THREE.Mesh(getFloorGeometry(), ghostMaterial);
        ghost.position.copy(pos);
        ghosts.push(ghost);
        ghost.renderOrder = objects.length + 1;
        scene.add(ghost);
    }
    if (obj === 'ceiling') {
        const pos = getPlacementPosition('ceiling');
        if (objectExistsAt(pos)) return;

        const ghostMaterial = new THREE.MeshStandardMaterial({ color: colour2, metalness: 0.5, roughness: 1, transparent: true, opacity: 0.8, emissive: colour2, emissiveIntensity: 0.02 });
        ghostMaterial.depthWrite = false;
        const ghost = new THREE.Mesh(getCeilingGeometry(), ghostMaterial);
        ghost.position.copy(pos);
        ghosts.push(ghost);
        ghost.renderOrder = objects.length + 1;
        scene.add(ghost);
    }
    if (obj === 'door') {
        const pos = getPlacementPosition('door');
        if (objectExistsAt(pos)) return;

        const ghostMaterial = new THREE.MeshStandardMaterial({ color: colour2, metalness: 0.5, roughness: 1, transparent: true, opacity: 0.8, emissive: colour2, emissiveIntensity: 0.02 });
        ghostMaterial.depthWrite = false;
        const ghost = createDoorMesh(ghostMaterial);
        ghost.position.copy(pos);
        ghosts.push(ghost);
        ghost.renderOrder = objects.length + 1;
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
let hue = 1
let furnituret = 0
let decorationt = 0
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
    if (e.key === '3') {
        obj = 'floor';
    }
    if (e.key === '4') {
        obj = 'ceiling';
    }
    if (e.key === '5') {
        obj = 'door';
    }
    if (e.key === '6') {
        obj = 'window';
    }
    if (e.key === '7') {
        obj = 'furniture';
    }
    if (e.key === '8') {
        obj = 'decoration';
    }
    if (e.key === '9') {
        obj = 'delete';
    }
    if(e.key === ']') {
        if(obj == 'furniture') {
            furnituret = (furnituret + 1) % furnitures.length;
        }
        if(obj == 'decoration') {
            decorationt = (decorationt + 1) % decorations.length;
        }
    }
    if(e.key == '[') {
        if(obj == 'furniture') {
            furnituret = (furnituret - 1 + furnitures.length) % furnitures.length;
        }
        if(obj == 'decoration') {
            decorationt = (decorationt - 1 + decorations.length) % decorations.length;
        }
    }
    if(e.key === 'q') {
        width += 0.5;
    }
    if(e.key === 'e') {
        if(width > 0.5) {
            width -= 0.5;
        }
    }
    if(e.key == 'l') {
        if (hue == 1) {
            const [h, s, v] = hexToHsl(colour2);
            hue = 0;
            colour2 = hslToHex(h, 0, v);
        } else {
            const [h,s,v] = hexToHsl(colour2)
            hue = 1
            colour2 = hslToHex(h, 100, v)
        }
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});
let colour3 = 0xffffff;
function createSolid(x, y, z, xsize, ysize, zsize, hex, geometry = new THREE.BoxGeometry(xsize, ysize, zsize)) {
    const material = new THREE.MeshStandardMaterial({ color: hex, metalness: 0.5, roughness: 1 });
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.userData.deletePreview = false;
    object.userData.baseColor = hex;
    objects.push(object);
    scene.add(object);
    return object;
}
document.addEventListener('click', () => {
    document.body.requestPointerLock();
    if (toggle) {
        if (obj === modes[1]) {
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
        } else if (obj === modes[0]) {
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

            const wallGeometry = rot
                ? new THREE.BoxGeometry(0.5, 3, width + 0.5)
                : new THREE.BoxGeometry(width + 0.5, 3, 0.5);
            const wall = createSolid(pos.x, pos.y, pos.z, wallGeometry.parameters.width, wallGeometry.parameters.height, wallGeometry.parameters.depth, colour2, wallGeometry);
            wall.userData.baseColor = colour2;
        } else if (obj === modes[2]/* floor */) {
            const pos = getPlacementPosition('floor');
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

            const floorGeometry = new THREE.BoxGeometry(width + 0.5, 0.5, width + 0.5);
            const floor = createSolid(pos.x, pos.y, pos.z, floorGeometry.parameters.width, floorGeometry.parameters.height, floorGeometry.parameters.depth, colour2, floorGeometry);
            floor.userData.baseColor = colour2;
        } else if (obj === modes[3]/* ceiling */) {
            const pos = getPlacementPosition('ceiling');
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

            const ceilingGeometry = new THREE.BoxGeometry(width + 0.5, 0.5, width + 0.5);
            const ceiling = createSolid(pos.x, pos.y, pos.z, ceilingGeometry.parameters.width, ceilingGeometry.parameters.height, ceilingGeometry.parameters.depth, colour2, ceilingGeometry);
            ceiling.userData.baseColor = colour2;
        } else if (obj === modes[4]/* door */) {
            const pos = getPlacementPosition('door');
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

            const door = createDoorMesh(new THREE.MeshStandardMaterial({ color: colour2, metalness: 0.5, roughness: 1 }));
            door.position.copy(pos);
            door.userData.baseColor = colour2;
            objects.push(door);
            scene.add(door);
        } else if (obj === modes[5]/* window */) {} else if (obj === modes[6]/* furniture */) {} else if (obj === modes[7]/* decoration */) {} else if (obj === modes[8]/* delete */) {}
    }
});
let modes = ['wall', 'light', 'floor', 'ceiling', 'door', 'window', 'furniture', 'decoration', 'delete'];
let furnitures = ['chair', 'table', 'sofa', 'bed', 'cabinet', 'shelf', 'desk', 'lamp', 'rug'];
let decorations = ['painting', 'poster', 'clock', 'plant', 'vase', 'statue', 'candle', 'curtain'];
let time = Date.now();
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    console.log('Right click detected');
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
    if (hue == 1) {
        const step = 3;
        const newHue = (h + (e.deltaY < 0 ? step : -step) + 360) % 360;
        colour2 = hslToHex(newHue, s, l);
    } else {
        const step = 3;
        const newLevel = (l + (e.deltaY < 0 ? step : -step) + 100) % 100;
        colour2 = hslToHex(h, 0, newLevel);
    }
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
    camera.position.y = 1.6;
    renderer.render(scene, camera);
}
animate();