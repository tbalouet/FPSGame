var player, worldPhy, physicsMaterial, walls = [], boxes = [], boxMeshes = [];

var camera, scene, renderer;
var geometry, material, mesh;
var controls, time = Date.now();

var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

var dt = 1 / 60;

var BULLET_DATAS = new BulletDatas();
var BULLET_MANAGER = new BulletManager();

$(document).ready(function() {
  if (havePointerLock) {
    initPointerLock();
  } else {
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
  }

  initCannon();
  init();
  animate();
});

function initPointerLock() {
  var element = document.body;

  var pointerlockchange = function(event) {
    if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
      controls.enabled = true;
      blocker.style.display = 'none';
    } else {
      controls.enabled = false;

      blocker.style.display = '-webkit-box';
      blocker.style.display = '-moz-box';
      blocker.style.display = 'box';

      instructions.style.display = '';
    }
  }

  var pointerlockerror = function(event) {
    instructions.style.display = '';
  }

  // Hook pointer lock state change events
  document.addEventListener('pointerlockchange', pointerlockchange, false);
  document.addEventListener('mozpointerlockchange', pointerlockchange, false);
  document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

  document.addEventListener('pointerlockerror', pointerlockerror, false);
  document.addEventListener('mozpointerlockerror', pointerlockerror, false);
  document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

  instructions.addEventListener('click', function(event) {
    instructions.style.display = 'none';

    // Ask the browser to lock the pointer
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

//UNCOMMENT TO ALLOW FULLSCREEN
//    if (/Firefox/i.test(navigator.userAgent)) {
//      var fullscreenchange = function(event) {
//        if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
//          document.removeEventListener('fullscreenchange', fullscreenchange);
//          document.removeEventListener('mozfullscreenchange', fullscreenchange);
//
//          element.requestPointerLock();
//        }
//      }
//
//      document.addEventListener('fullscreenchange', fullscreenchange, false);
//      document.addEventListener('mozfullscreenchange', fullscreenchange, false);
//
//      element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
//
//      element.requestFullscreen();
//    } else {
      element.requestPointerLock();
//    }
  }, false);
}

function initCannon() {
  // Setup our world
  worldPhy = new CANNON.World();
  worldPhy.quatNormalizeSkip = 0;
  worldPhy.quatNormalizeFast = false;

  worldPhy.defaultContactMaterial.contactEquationStiffness = 1e9;
  worldPhy.defaultContactMaterial.contactEquationRegularizationTime = 4;

  var solver = new CANNON.GSSolver();
  solver.iterations = 7;
  solver.tolerance = 0.1;

  worldPhy.solver = new CANNON.GSSolver(solver);

  worldPhy.gravity.set(0, -9.78, 0);
  //Broadphase compute an conservative approximate list of colliding pairs
  worldPhy.broadphase = new CANNON.NaiveBroadphase();

  // Create a slippery material (friction coefficient = 0.0)
  physicsMaterial = new CANNON.Material("slipperyMaterial");
  var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
          physicsMaterial,
          0.0, // friction coefficient
          0.3 // restitution
          );
  // We must add the contact materials to the world
  worldPhy.addContactMaterial(physicsContactMaterial);

  // Create a player
  var pos = {x: 0, y: 5, z: 0};
  player = new PlayerEntity(pos);

  // Create a plane
  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.RigidBody(0, groundShape, physicsMaterial);
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  worldPhy.add(groundBody);
}

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 0, 500);

  var ambient = new THREE.AmbientLight(0x111111);
  scene.add(ambient);

  light = new THREE.SpotLight(0xffffff);
  light.position.set(10, 30, 20);
  light.target.position.set(0, 0, 0);

  light.castShadow = true;

  light.shadowCameraNear = 20;
  light.shadowCameraFar = 50;//camera.far;
  light.shadowCameraFov = 40;

  light.shadowMapBias = 0.1;
  light.shadowMapDarkness = 0.7;
  light.shadowMapWidth = 2 * 512;
  light.shadowMapHeight = 2 * 512;

  scene.add(light);

  controls = new PointerLockControls(camera, player.body);
  scene.add(controls.getObject());

  // floor
  geometry = new THREE.PlaneGeometry(300, 300, 50, 50);
  geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  material = new THREE.MeshLambertMaterial({color: 0xdddddd});

  mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(scene.fog.color, 1);

  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);

  // Add boxes
  var halfExtents = new CANNON.Vec3(1, 1, 1);
  var boxShape = new CANNON.Box(halfExtents);
  var boxGeometry = new THREE.CubeGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);
  var redMaterial = new THREE.MeshLambertMaterial({color: 0xff0000});
  for (var i = 0; i < 7; i++) {
    var x = (Math.random() - 0.5) * 20;
    var y = 1 + (Math.random() - 0.5) * 1;
    var z = (Math.random() - 0.5) * 20;
    var boxBody = new CANNON.RigidBody(5, boxShape);
    var boxMesh = new THREE.Mesh(boxGeometry, redMaterial);
    worldPhy.add(boxBody);
    scene.add(boxMesh);
    boxBody.position.set(x, y, z);
    boxMesh.position.set(x, y, z);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxMesh.useQuaternion = true;
    boxes.push(boxBody);
    boxMeshes.push(boxMesh);
  }


  // Add linked boxes
  var size = 0.5;
  var he = new CANNON.Vec3(size, size, size * 0.1);
  var boxShape = new CANNON.Box(he);
  var mass = 0;
  var space = 0.1 * size;
  var N = 5, last;
  var boxGeometry = new THREE.CubeGeometry(he.x * 2, he.y * 2, he.z * 2);
  for (var i = 0; i < N; i++) {
    var boxbody = new CANNON.RigidBody(mass, boxShape);
    var boxMesh = new THREE.Mesh(boxGeometry, material);
    boxbody.position.set(5, (N - i) * (size * 2 + 2 * space) + size * 2 + space, 0);
    boxbody.linearDamping = 0.01;
    boxbody.angularDamping = 0.01;
    boxMesh.useQuaternion = true;
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    worldPhy.add(boxbody);
    scene.add(boxMesh);
    boxes.push(boxbody);
    boxMeshes.push(boxMesh);

    if (i != 0) {
      // Connect this body to the last one
      var c1 = new CANNON.PointToPointConstraint(boxbody, new CANNON.Vec3(-size, size + space, 0), last, new CANNON.Vec3(-size, -size - space, 0));
      var c2 = new CANNON.PointToPointConstraint(boxbody, new CANNON.Vec3(size, size + space, 0), last, new CANNON.Vec3(size, -size - space, 0));
      worldPhy.addConstraint(c1);
      worldPhy.addConstraint(c2);
    } else {
      mass = 0.3;
    }
    last = boxbody;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls.enabled) {
    BULLET_MANAGER.dropDeads();
    worldPhy.step(dt);    
    BULLET_MANAGER.update();

    // Update box positions
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].position.copy(boxMeshes[i].position);
      boxes[i].quaternion.copy(boxMeshes[i].quaternion);
    }
  }

  player.update(Date.now() - time);
  renderer.render(scene, camera);
  time = Date.now();
}

window.addEventListener("mousedown", function(e) {
  player.openFire();
});

window.addEventListener("mouseup", function(e) {
  player.ceaseFire();
});
