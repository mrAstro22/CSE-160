// Cube.js — no imports, just global data
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

function initCubeBuffer(gl) {
  if (!cubeVertexBuffer) {
    cubeVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVerts, gl.STATIC_DRAW);
  }
  return cubeVertexBuffer;
}

/********** Cube class **********/
class Cube {
  constructor() {
    this.color = [1,1,1,1];
    this.matrix = new Matrix4();
  }

  render(gl, a_Position, u_FragColor, u_ModelMatrix) {
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    const rgba = this.color;
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Use shared buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}
