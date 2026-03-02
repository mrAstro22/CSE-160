class Model {
    constructor(filePath) {
        this.filePath = filePath;
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.isFullyLoaded = false;
        this.textureNum = -2;

        // Create GPU buffers
        this.vertexBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
        this.uvBuffer = gl.createBuffer();

        this.getFileContent();
    }

    async parseModel(fileContent) {
        const lines = fileContent.split("\n");
        const allVertices = [];
        const allNormals = [];
        const unpackedVerts = [];
        const unpackedNormals = [];

        for (let line of lines) {
            line = line.trim();
            const tokens = line.split(/\s+/);
            if (tokens[0] === "v") {
                allVertices.push(
                    parseFloat(tokens[1]),
                    parseFloat(tokens[2]),
                    parseFloat(tokens[3])
                );
            } else if (tokens[0] === "vn") {
                allNormals.push(
                    parseFloat(tokens[1]),
                    parseFloat(tokens[2]),
                    parseFloat(tokens[3])
                );
            } else if (tokens[0] === "f") {
                const faceVerts = tokens.slice(1);
                for (let j = 1; j < faceVerts.length - 1; j++) {
                    for (const f of [faceVerts[0], faceVerts[j], faceVerts[j + 1]]) {
                        const parts = f.split(/\/+/);
                        const vi = (parseInt(parts[0]) - 1) * 3;
                        const ni = (parseInt(parts[parts.length - 1]) - 1) * 3;

                        unpackedVerts.push(
                            allVertices[vi],
                            allVertices[vi + 1],
                            allVertices[vi + 2]
                        );
                        unpackedNormals.push(
                            allNormals[ni],
                            allNormals[ni + 1],
                            allNormals[ni + 2]
                        );
                    }
                }
            }
        }

        this.modelData = {
            vertices: new Float32Array(unpackedVerts),
            normals: new Float32Array(unpackedNormals)
        };

        // Upload once to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.modelData.vertices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.modelData.normals, gl.STATIC_DRAW);

        this.isFullyLoaded = true;
    }

    render() {
        if (!this.isFullyLoaded) return;

        // Set object color and texture
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Compute normal matrix for lighting
        const normalMatrix = new Matrix4();
        normalMatrix.setInverseOf(this.matrix);
        normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        // Draw all triangles at once
        gl.drawArrays(gl.TRIANGLES, 0, this.modelData.vertices.length / 3);
    }

    async getFileContent() {
        try {
            const response = await fetch(this.filePath);
            if (!response.ok) throw new Error(`Could not load "${this.filePath}"`);
            const fileContent = await response.text();
            await this.parseModel(fileContent);
        } catch (e) {
            console.error(`Model load error: ${e}`);
        }
    }
}