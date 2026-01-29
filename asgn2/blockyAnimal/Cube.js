class Cube{
  constructor(){
    this.type = 'cube';
    // this.postion = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    // this.size = 5.0;
    // this.segments = 10;
    this.matrix = new Matrix4();
  }

  render() {
    var rgba = this.color;
    
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass the matrix to u_ModelMatrix attribute
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Front
    drawTriangle3D([0,0,0,  1,1,0,  1,0,0]);
    drawTriangle3D([0,0,0,  0,1,0,  1,1,0]);


    // Colores ---------------------------------------------------------------
    
    // FRONT
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // TOP
    gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);

    // SIDE 
    gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);

    // BOTTOM
    gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
    // -------------------------------------------------------------------------
    
    // Back
    drawTriangle3D([0,0,1,  1,0,1,  1,1,1]);
    drawTriangle3D([0,0,1,  1,1,1,  0,1,1]);

    // Top
    drawTriangle3D([0,1,0,  0,1,1,  1,1,1]);
    drawTriangle3D([0,1,0,  1,1,1,  1,1,0]);

    // RIGHT
    drawTriangle3D([1,0,0,  1,1,0,  1,1,1]);
    drawTriangle3D([1,0,0,  1,1,1,  1,0,1]);

    // LEFT
    drawTriangle3D([0,0,0,  0,0,1,  0,1,1]);
    drawTriangle3D([0,0,0,  0,1,1,  0,1,0]);
  }
}