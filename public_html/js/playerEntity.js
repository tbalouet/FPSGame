var PlayerEntity = function(pos) {
  this.pos = {
    x: pos.x,
    y: pos.y,
    z: pos.z
  };
  this.mass = 80000;
  this.shapeRadius = 1.3;
  this.height = 2;
  
  this.shooting = false;
  this.fireTime = 0;
  
  this.projector = new THREE.Projector();

  this.shape = new CANNON.Sphere(this.shapeRadius);
  this.body = new CANNON.RigidBody(this.mass, this.shape, physicsMaterial);
  this.body.position.set(this.pos.x, this.pos.y, this.pos.z);
  this.body.linearDamping = 0.9;
  worldPhy.add(this.body);
};

PlayerEntity.prototype.getShootDir = function(targetVec) {
  var vector = targetVec;
  targetVec.set(0, 0, 1);
  this.projector.unprojectVector(vector, camera);
  var ray = new THREE.Ray(this.body.position, vector.sub(this.body.position).normalize());
  targetVec.x = ray.direction.x;
  targetVec.y = ray.direction.y;
  targetVec.z = ray.direction.z;
};

PlayerEntity.prototype.shoot = function() {
  var x = this.body.position.x;
  var y = this.body.position.y;
  var z = this.body.position.z;

  var dirShoot = new THREE.Vector3();
  this.getShootDir(dirShoot);

  // Move the ball outside the player sphere
//  x += dirShoot.x * (this.shape.radius * 1.02 + BULLET_DATAS.shape.radius);
//  y += dirShoot.y * (this.shape.radius * 1.02 + BULLET_DATAS.shape.radius);
//  z += dirShoot.z * (this.shape.radius * 1.02 + BULLET_DATAS.shape.radius);

  var posShoot = {x: x, y: y, z: z};
  var newBullet = new BulletEntity(dirShoot, posShoot);
};

PlayerEntity.prototype.openFire = function(){
  this.shooting = true;
  this.fireTime = Date.now();
}

PlayerEntity.prototype.ceaseFire = function(){
  this.shooting = false;
}

PlayerEntity.prototype.update = function(delta) {
  controls.update(delta);
  if(this.shooting){
    this.fireTime = (Date.now() - this.fireTime);
    if(this.fireTime >= BULLET_DATAS.fireRate){
      this.shoot();
      this.fireTime = Date.now();
    }
  }
};