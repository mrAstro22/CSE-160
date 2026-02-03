// Sphere.js

// Chat GPT helped me with the calculations of the Sphere Class
// I essentially brought over drawTriangle to form a low-poly sphere

// Sphere.js
class Sphere {
  constructor(radius = 1.0, slices = 12, stacks = 12) {
    this.type = 'sphere';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.radius = radius;
    this.slices = slices;
    this.stacks = stacks;

    // Buffers
    this.vertexBuffer = gl.createBuffer();

    // Precompute vertices per stack
    this.stackVertices = []; // array of Float32Arrays per stack
    for (let stack = 0; stack < stacks; stack++) {
      let vertices = [];
      let phi1 = Math.PI * stack / stacks;
      let phi2 = Math.PI * (stack + 1) / stacks;
      let y1 = Math.cos(phi1), y2 = Math.cos(phi2);
      let r1 = Math.sin(phi1), r2 = Math.sin(phi2);

      for (let slice = 0; slice < slices; slice++) {
        let theta1 = 2 * Math.PI * slice / slices;
        let theta2 = 2 * Math.PI * (slice + 1) / slices;

        let x1 = r1 * Math.cos(theta1), z1 = r1 * Math.sin(theta1);
        let x2 = r2 * Math.cos(theta1), z2 = r2 * Math.sin(theta1);
        let x3 = r2 * Math.cos(theta2), z3 = r2 * Math.sin(theta2);
        let x4 = r1 * Math.cos(theta2), z4 = r1 * Math.sin(theta2);

        // Triangle 1
        vertices.push(
          this.radius*x1, this.radius*y1, this.radius*z1,
          this.radius*x2, this.radius*y2, this.radius*z2,
          this.radius*x3, this.radius*y2, this.radius*z3
        );
        // Triangle 2
        vertices.push(
          this.radius*x1, this.radius*y1, this.radius*z1,
          this.radius*x3, this.radius*y2, this.radius*z3,
          this.radius*x4, this.radius*y1, this.radius*z4
        );
      }
      this.stackVertices.push(new Float32Array(vertices));
    }
  }

  render() {
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Loop through stacks and darken each one slightly for fake shading
    for (let i = 0; i < this.stackVertices.length; i++) {
      let shadeFactor = 0.5 + 0.5 * (i / this.stackVertices.length); // 0.5→1.0 from bottom to top
      gl.uniform4f(
        u_FragColor,
        this.color[0]*shadeFactor,
        this.color[1]*shadeFactor,
        this.color[2]*shadeFactor,
        this.color[3]
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.stackVertices[i], gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);

      gl.drawArrays(gl.TRIANGLES, 0, this.stackVertices[i].length/3);
    }
  }
}