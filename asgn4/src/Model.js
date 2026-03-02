class Model {
    constructor(filePath) {
        this.filePath = filePath;
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.isFullyLoaded = false;
        this.textureNum = -2;

        // Create buffers immediately while gl is valid
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

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const tokens = line.split(/\s+/);

            if (tokens[0] == "v") {
                allVertices.push(
                    parseFloat(tokens[1]),
                    parseFloat(tokens[2]),
                    parseFloat(tokens[3])
                );
            } else if (tokens[0] == "vn") {
                allNormals.push(
                    parseFloat(tokens[1]),
                    parseFloat(tokens[2]),
                    parseFloat(tokens[3])
                );
            } else if (tokens[0] == "f") {
                // Handle both v//vn and v/vt/vn formats
                const faceVerts = tokens.slice(1);
                for (let j = 1; j < faceVerts.length - 1; j++) {
                    // Triangulate: fan from first vertex
                    for (const face of [faceVerts[0], faceVerts[j], faceVerts[j+1]]) {
                        const parts = face.split(/\/+/);
                        const vertexIndex = (parseInt(parts[0]) - 1) * 3;
                        const normalIndex = (parseInt(parts[parts.length - 1]) - 1) * 3;

                        unpackedVerts.push(
                            allVertices[vertexIndex],
                            allVertices[vertexIndex + 1],
                            allVertices[vertexIndex + 2]
                        );
                        unpackedNormals.push(
                            allNormals[normalIndex],
                            allNormals[normalIndex + 1],
                            allNormals[normalIndex + 2]
                        );
                    }
                }
            }
        }

        this.modelData = {
            vertices: new Float32Array(unpackedVerts),
            normals: new Float32Array(unpackedNormals)
        };
        this.isFullyLoaded = true;
    }

    render() {
        if (!this.isFullyLoaded) return;

        gl.uniform1i(u_whichTexture, -2);
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Pass normal matrix for correct lighting
        if (this.normalMatrix) {
            gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);
        }

        // positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.modelData.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.modelData.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        // dummy UVs — required because a_UV is still enabled from cube draws
        if (!this.dummyUVs) {
            this.dummyUVs = new Float32Array((this.modelData.vertices.length / 3) * 2);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.dummyUVs, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

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