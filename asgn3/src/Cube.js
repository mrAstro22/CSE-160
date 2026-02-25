// Cube.js

// // Vertex data for a unit cube (same as before)
// const cubeVerts = new Float32Array([
//   // Front
//   0,0,0,  1,1,0,  1,0,0,
//   0,0,0,  0,1,0,  1,1,0,
//   // Back
//   0,0,1,  1,0,1,  1,1,1,
//   0,0,1,  1,1,1,  0,1,1,
//   // Top
//   0,1,0,  0,1,1,  1,1,1,
//   0,1,0,  1,1,1,  1,1,0,
//   // Bottom
//   0,0,0,  1,0,0,  1,0,1,
//   0,0,0,  1,0,1,  0,0,1,
//   // Right
//   1,0,0,  1,1,0,  1,1,1,
//   1,0,0,  1,1,1,  1,0,1,
//   // Left
//   0,0,0,  0,0,1,  0,1,1,
//   0,0,0,  0,1,1,  0,1,0
// ]);

// let cubeVertexBuffer = null;

// // Initialize the shared buffer once
// function initCubeBuffer() {
//   if (!cubeVertexBuffer) {
//     cubeVertexBuffer = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
//     gl.bufferData(gl.ARRAY_BUFFER, cubeVerts, gl.STATIC_DRAW);
//   }
// }

// Cube class
class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -1; // Default to no texture
    this.cubeVerts = new Float32Array([
      // Front face (fixed UVs)
      0,0,0,  0,1,   1,0,0,  0,0,   1,1,0,  1,0,
      0,0,0,  0,1,   1,1,0,  1,0,   0,1,0,  1,1,

      // Back face
      1,0,1, 0,0,   1,1,1, 1,0,   0,1,1, 1,1,
      1,0,1, 0,0,   0,1,1, 1,1,   0,0,1, 0,1,

      // Top face
      0,1,0, 0,0,   0,1,1, 0,1,   1,1,1, 1,1,
      0,1,0, 0,0,   1,1,1, 1,1,   1,1,0, 1,0,

      // Bottom face
      0,0,1, 0,0,   1,0,1, 1,0,   1,0,0, 1,1,
      0,0,1, 0,0,   1,0,0, 1,1,   0,0,0, 0,1,

      // Right face
      1,0,0, 0,0,   1,1,0, 1,0,   1,1,1, 1,1,
      1,0,0, 0,0,   1,1,1, 1,1,   1,0,1, 0,1,

      // Left face
      0,0,0, 0,0,   0,1,0, 1,0,   0,1,1, 1,1,
      0,0,0, 0,0,   0,1,1, 1,1,   0,0,1, 0,1
    ]);

    this.bufferInitialized = false;
  }

  render() {
    const rgba = this.color;

    // Pass the texture number
    gl.uniform1i(u_whichTexture, this.textureNum);

    // Pass the color of a point to u_FragColor uniform variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass the matrix to u_ModelMatrix attribute
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);



    // Pass the color of a point to u_FragColor uniform variable
    gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);


  // Front face
    drawTriangle3DUV(
      [0,0,0,   1,0,0,   1,1,0],
      [0,1,     0,0,     1,0]
    );
    drawTriangle3DUV(
      [0,0,0,   1,1,0,   0,1,0],
      [0,1,     1,0,     1,1]
    );

    // Back of Cube 
    drawTriangle3DUV( [1,0,1, 1,1,1, 0,1,1], [0,0, 1,0, 1,1] ); 
    drawTriangle3DUV( [1,0,1, 0,1,1, 0,0,1], [0,0, 1,1, 0,1] );

    // Top of Cube
    drawTriangle3DUV(
      [0,1,0,  0,1,1,  1,1,1],
      [0,0,    0,1,    1,1]
    );
    drawTriangle3DUV(
      [0,1,0,  1,1,1,  1,1,0],
      [0,0,    1,1,    1,0]
    );


    // Left of Cube
    drawTriangle3DUV(
      [0,0,0,  0,1,0,  0,1,1],
      [0,0,    1,0,    1,1]
    );
    drawTriangle3DUV(
      [0,0,0,  0,1,1,  0,0,1],
      [0,0,    1,1,    0,1]
    );

    // Right of Cube
    drawTriangle3DUV(
      [1,0,0,  1,1,0,  1,1,1],
      [0,0,    1,0,    1,1]
    );
    drawTriangle3DUV(
      [1,0,0,  1,1,1,  1,0,1],
      [0,0,    1,1,    0,1]
    );

    // Bottom of Cube
    drawTriangle3DUV(
      [0,0,1,  1,0,1,  1,0,0],
      [0,0,    1,0,    1,1]
    );
    drawTriangle3DUV(
      [0,0,1,  1,0,0,  0,0,0],
      [0,0,    1,1,    0,1]
    );
  }
  initBuffer() {
    if (!g_vertexBuffer) {
      g_vertexBuffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.cubeVerts, gl.STATIC_DRAW);

    // Set up interleaved attributes: x,y,z,u,v
    const FSIZE = this.cubeVerts.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*5, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE*5, FSIZE*3);
    gl.enableVertexAttribArray(a_UV);

    this.bufferInitialized = true;
  }

  renderFaster() {
    if (!this.bufferInitialized) this.initBuffer();

    // Pass uniforms
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Draw cube
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}
