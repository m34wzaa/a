import * as THREE from './node_modules/three/build/three.module.js'
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0x222222);
const lights = [new THREE.DirectionalLight(0xffffff, 1), new THREE.DirectionalLight(0xffffff, 1), new THREE.AmbientLight(0x404040)];
lights[0].position.set(1, 1, 1).normalize();
lights[1].position.set(-1, -1, -1).normalize();
scene.add(lights[0]);
scene.add(lights[1]);
scene.add(lights[2]);
const potLights = [new THREE.CylinderGeometry(0.1, 0.1, 0.5, 32), new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 1, roughness: 0.5 })];   
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.5 });
const cube = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.5 }));
const objects = [];
objects.push(cube);
scene.add(cube);
let keys = []
objects.addEventListener('push', (e) => {
    scene.add(e.detail);
});
document.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
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
let sens = 5;
function animate() {
    requestAnimationFrame(animate);
    //make the w and s keys move the camera on the x and z axes only at a fixed speed
    if(keys['w']) {
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        direction.y = 0;
        direction.normalize();
        camera.position.add(direction.multiplyScalar(0.1));
    }
    if(keys['s']) {
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion);
        direction.y = 0;
        direction.normalize();
        camera.position.add(direction.multiplyScalar(0.1));
    }
    if(keys['a']) {
        camera.position.add(new THREE.Vector3(-0.1, 0, 0).applyQuaternion(camera.quaternion));
    }
    if(keys['d']) {
        camera.position.add(new THREE.Vector3(0.1, 0, 0).applyQuaternion(camera.quaternion));
    }
    camera.position.y = 1.6;
    renderer.render(scene, camera);
}
animate();