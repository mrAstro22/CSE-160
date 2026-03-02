class Triangle{
  constructor(){
    this.type = 'triangle';
    this.postion = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0; 
  }

  render() {
    var xy = this.postion;
    var rgba = this.color;
    // var size = 5.0;
    
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass Size of point to u_Size variable
    gl.uniform1f(u_Size, 4.0);

    // Draw
    var d = this.size / 200.0; // deltaS
    drawTriangle([xy[0], xy[1], xy[0] + d, xy[1], xy[0], xy[1] + d]);
  }
}

function drawTriangle(vertices){
    var n = 3; // The number of vertices
    
    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    // Draw the triangle
    gl.drawArrays(gl.TRIANGLES, 0, n);

    return n;
}

var g_triangleBuffer = null;

function initTriangle3D() {
  if (g_triangleBuffer) return;

  g_triangleBuffer = gl.createBuffer();
  if (!g_triangleBuffer) {
    console.log('Failed to create triangle buffer');
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleBuffer);

  const FSIZE = Float32Array.BYTES_PER_ELEMENT;

  // Layout: x,y,z, u,v, nx,ny,nz  (8 floats per vertex)

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 8, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 8, FSIZE * 3);
  gl.enableVertexAttribArray(a_UV);

  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 8, FSIZE * 5);
  gl.enableVertexAttribArray(a_Normal);
}

function drawTriangle3D(vertices){
    var n = vertices.length / 3; // The number of vertices
    
    if (!g_vertexBuffer) {
      initTriangle3D();
    }
    // Bind the buffer object to target
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Draw the triangle
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3DUV(vertices, uv){
    var n = 3; // The number of vertices
    
    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    // Create a buffer object for UV
    var uvBuffer = gl.createBuffer();
    if (!uvBuffer) {
      console.log('Failed to create the buffer object');
    }
    
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);

    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_UV);

    // Draw the triangle
    gl.drawArrays(gl.TRIANGLES, 0, n);
    g_vertexBuffer = null; // Clean up buffer for next use
}

function drawTriangle3DUVNormal(vertices, uv, normals) {
  const n = vertices.length / 3;

  if (!g_triangleBuffer) {
    initTriangle3D();
  }

  const interleaved = [];

  for (let i = 0; i < n; i++) {
    interleaved.push(
      vertices[i*3], vertices[i*3+1], vertices[i*3+2],  // position
      uv[i*2], uv[i*2+1],                               // uv
      normals[i*3], normals[i*3+1], normals[i*3+2]      // normal
    );
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(interleaved), gl.DYNAMIC_DRAW);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}
