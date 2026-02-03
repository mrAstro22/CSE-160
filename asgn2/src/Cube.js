// Cube.js

// Vertex data for a unit cube (same as before)
const cubeVerts = new Float32Array([
  // Front
  0,0,0,  1,1,0,  1,0,0,
  0,0,0,  0,1,0,  1,1,0,
  // Back
  0,0,1,  1,0,1,  1,1,1,
  0,0,1,  1,1,1,  0,1,1,
  // Top
  0,1,0,  0,1,1,  1,1,1,
  0,1,0,  1,1,1,  1,1,0,
  // Bottom
  0,0,0,  1,0,0,  1,0,1,
  0,0,0,  1,0,1,  0,0,1,
  // Right
  1,0,0,  1,1,0,  1,1,1,
  1,0,0,  1,1,1,  1,0,1,
  // Left
  0,0,0,  0,0,1,  0,1,1,
  0,0,0,  0,1,1,  0,1,0
]);

let cubeVertexBuffer = null;

// Initialize the shared buffer once
function initCubeBuffer() {
  if (!cubeVertexBuffer) {
    cubeVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVerts, gl.STATIC_DRAW);
  }
}

// Cube class
class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  render() {
    const rgba = this.color;

    // Pass the matrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Bind the cube buffer once
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Pass the color for front face
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Pass the color for back face
    gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
    gl.drawArrays(gl.TRIANGLES, 6, 6);

    // Top
    gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
    gl.drawArrays(gl.TRIANGLES, 12, 6);

    // Bottom
    gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
    gl.drawArrays(gl.TRIANGLES, 18, 6);

    // Right
    gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
    gl.drawArrays(gl.TRIANGLES, 24, 6);

    // Left
    gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
    gl.drawArrays(gl.TRIANGLES, 30, 6);
  }
}
