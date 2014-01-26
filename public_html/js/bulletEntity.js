var bullets = Array();

function BulletDatas() {
  if (arguments.callee._singletonInstance)
    return arguments.callee._singletonInstance;
  arguments.callee._singletonInstance = this;

  this.velocity = 20;
  this.shape = new CANNON.Sphere(0.1);
  this.geometry = new THREE.SphereGeometry(this.shape.radius);
  this.mass = 1;
}

function BulletManager(){
  if (arguments.callee._singletonInstance)
    return arguments.callee._singletonInstance;
  arguments.callee._singletonInstance = this;
  
  this.maxLifeBullet = 2;//Life time of a bullet
  
  this.update = function(){
    // Update ball positions    
    for (var i = 0; i < bullets.length; i++) {
      bullets[i].update();      
    }
  }
  
  this.dropDeads = function(){
    for (var i = 0; i < bullets.length; i++) {
      var bullet = bullets[i];
      var timeElapsed = (Date.now() - bullet.timeLaunched) / 1000;
      if (timeElapsed > this.maxLifeBullet) {
        var oldBullet = bullets.splice(i, 1)[0];
        worldPhy.remove(oldBullet.body);
        scene.remove(oldBullet.mesh);
        delete oldBullet;
      }
    }
  }
}

var BulletEntity = function(dirShoot, posShoot){
  this.timeLaunched = new Date();
  
  this.direction = new THREE.Vector3();
  this.projector = new THREE.Projector();
  
  this.body = new CANNON.RigidBody(BULLET_DATAS.mass, BULLET_DATAS.shape);
  this.mesh = new THREE.Mesh(BULLET_DATAS.geometry, material);
  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;

  worldPhy.add(this.body);
  scene.add(this.mesh);
  
  bullets.push(this);
  
  this.body.velocity.set(dirShoot.x * BULLET_DATAS.velocity,
          dirShoot.y * BULLET_DATAS.velocity,
          dirShoot.z * BULLET_DATAS.velocity);

  this.body.position.set(posShoot.x, posShoot.y, posShoot.z);
  this.mesh.position.set(posShoot.x, posShoot.y, posShoot.z);
  this.mesh.useQuaternion = true;
};

BulletEntity.prototype.update = function(){
  this.body.position.copy(this.mesh.position);
  this.body.quaternion.copy(this.mesh.quaternion);
}
