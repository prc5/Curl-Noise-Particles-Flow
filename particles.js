var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 3, 1000);

var renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth - 25, window.innerHeight - 20);
//scene.background = new THREE.Color( 0xffffff );
document.body.appendChild(renderer.domElement);

// Controll

var particleCount = 20000,
    speed = 100, // How fast animation plays
    opacityControll = 0.3, // Opacity of particles
    sizeControll = 0.02, // Size of particles
    fps = 25; // Fps controll 
//texture = new THREE.TextureLoader().load('particle.png')
camera.position.z = 6; // Camera position


// Particle
var particles = new THREE.Geometry(),
    pMaterial = new THREE.PointsMaterial({
        vertexColors: THREE.VertexColors,
        //color: 0xffffff,
        size: sizeControll,
        //map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: opacityControll,
        //alphaTest: 0.5,
        //lights: true
    });

var colors = [];

function setColors() {
    for (var i = 0; i < particleCount; i++) {
        var end = new THREE.Vector3(0, 0, 0);
        white = 1;
        distance = new THREE.Line3(particles.vertices[i], end).distance();
        if (distance < 0.75) {
            white = 0.8;
        } else if (distance < 1.5) {
            white = 0.77;
        } else if (distance < 2) {
            white = 0.73;
        } else if (distance < 2.5) {
            white = 0.68;
        } else if (distance < 3) {
            white = 0.66;
        } else {
            white = 0.62;
        }
        // random color
        colors[i] = new THREE.Color();
        colors[i].setHSL(0.08, 1, white);
    }

    particles.colors = colors;
}


// Create the individual particles
for (var p = 0; p < particleCount; p++) {
    // Create a particle with random
    // Position values, -250 -> 250
    var pX = Math.random() * 2 - 1,
        pY = Math.random() * 2 - 1,
        pZ = Math.random() * 2 - 1,
        particle = new THREE.Vector3(pX, pY, pZ);
    // Add it to the geometry
    particles.vertices.push(particle);
}

// Create the particle system
var particleSystem = new THREE.Points(
    particles,
    pMaterial);
// Add it to the scene
scene.add(particleSystem);

// Max function
function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

// Curl noise calculations 
var max = 0.2;

function curl(x, y, z, index) {
    var eps = 0.8;

    var a1 = map_range(noise(x, y + eps, z), 0, 1, -max, max),
        a2 = map_range(noise(x, y - eps, z), 0, 1, -max, max),
        a = (a1 - a2) / (2 * eps),
        b1 = map_range(noise(x, y, z + eps), 0, 1, -max, max),
        b2 = map_range(noise(x, y, z - eps), 0, 1, -max, max),
        b = (b1 - b2) / (2 * eps);

    a - b > 0.01 ? particles.vertices[index].x += a - b : particles.vertices[index].x += a - b + Math.random() * 0.1 - 0.05;

    var a1 = map_range(noise(x, y, z + eps), 0, 1, -max, max),
        a2 = map_range(noise(x, y, z + eps), 0, 1, -max, max),
        a = (a1 - a2) / (2 * eps),
        b1 = map_range(noise(x + eps, y, z), 0, 1, -max, max),
        b2 = map_range(noise(x - eps, y, z), 0, 1, -max, max),
        b = (b1 - b2) / (2 * eps);

    a - b > 0.01 ? particles.vertices[index].y += a - b : particles.vertices[index].y += a - b + Math.random() * 0.1 - 0.05;

    var a1 = map_range(noise(x + eps, y, z), 0, 1, -max, max),
        a2 = map_range(noise(x - eps, y, z), 0, 1, -max, max),
        a = (a1 - a2) / (2 * eps),
        b1 = map_range(noise(x, y + eps, z), 0, 1, -max, max),
        b2 = map_range(noise(x, y - eps, z), 0, 1, -max, max),
        b = (b1 - b2) / (2 * eps);

    a - b > 0.01 ? particles.vertices[index].z += a - b : particles.vertices[index].z += a - b + Math.random() * 0.1 - 0.05;
}


var size = 5;

function animateShape() {
    for (var g = 0; g < particles.vertices.length; g++) {
        if (particles.vertices[g].x > size || particles.vertices[g].y > size || particles.vertices[g].z > 2 || particles.vertices[g].x < -size || particles.vertices[g].y < -size || particles.vertices[g].z < -size) {
            particles.vertices[g].x = 0;
            particles.vertices[g].y = 0;
            particles.vertices[g].z = 0;
        } else {
            curl(particles.vertices[g].x, particles.vertices[g].y, particles.vertices[g].z, g);
        }
    }

    particles.dynamic = true;
    particles.verticesNeedUpdate = true;
    // Allow to change position
    particleSystem.sortParticles = true;
};


// Postprocessing	
var bloomStrength = 0.6;
var bloomRadius = 0.8;
var bloomThreshold = 0.3;

var composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));

var vignette = new THREE.ShaderPass(THREE.VignetteShader);
vignette.uniforms['darkness'].value = 0.996;
composer.addPass(vignette);

var effectFilm = new THREE.FilmPass(0.45, 0.025, 648, false);
composer.addPass(effectFilm);

var copyShader = new THREE.ShaderPass(THREE.CopyShader);
copyShader.renderToScreen = true;


var bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), bloomStrength, bloomRadius, bloomThreshold);

composer.setSize(window.innerWidth, window.innerHeight);

composer.addPass(bloomPass);
composer.addPass(copyShader);

// Animate 
var now;
var then = Date.now();
var interval = 1000 / fps;
var delta;

function animate() {
    requestAnimationFrame(animate);
    now = Date.now();
    delta = now - then;
    if (delta > interval) {
        then = now - (delta % interval);
        animateShape();
        setColors();
        particles.colorsNeedUpdate = true;
        //        particleSystem.rotation.x += 0.01;
        //        particleSystem.rotation.y += 0.01;
        //        particleSystem.rotation.z += 0.01;
        renderer.render(scene, camera);
        composer.render();
    }
}

animate();
