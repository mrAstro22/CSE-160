// Camera.js
class Vector {
  constructor(x=0, y=0, z=0){
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(v) {
    return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  subtract(v) {
    return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiply(scalar) {
    return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  length() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }

  normalize() {
    const len = this.length();
    return len > 0 ? new Vector(this.x/len, this.y/len, this.z/len) : new Vector(0,0,0);
  }

  cross(v) {
    return new Vector(
      this.y*v.z - this.z*v.y,
      this.z*v.x - this.x*v.z,
      this.x*v.y - this.y*v.x
    );
  }
}

class Camera {
    constructor() {
    // this.type = 'camera';
    // this.angle = 0.0; // Camera angle in degrees
    this.eye = new Vector(0,0,3);
    this.at = new Vector(0,0,2);
    this.up = new Vector(0,1,0);
    }

    forward() {
        const f = this.at.subtract(this.eye).normalize();
        const move = f.multiply(0.1);
        this.eye = this.eye.add(move);
        this.at = this.at.add(move);
    }
    backward() {
        var f = this.at.subtract(this.eye).normalize();
        this.eye = this.eye.subtract(f.multiply(0.1));
        this.at = this.at.subtract(f.multiply(0.1));
    }

    left() {
        var f = this.at.subtract(this.eye).normalize();
        var r = f.cross(this.up).normalize();
        this.eye = this.eye.subtract(r.multiply(0.1));
        this.at = this.at.subtract(r.multiply(0.1));
    }
    right() {
        var f = this.at.subtract(this.eye).normalize();
        var r = f.cross(this.up).normalize();
        this.eye = this.eye.add(r.multiply(0.1));
        this.at = this.at.add(r.multiply(0.1));
    }
}