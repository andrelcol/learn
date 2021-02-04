function init() {
    // use the defaults
    var scene = new THREE.Scene(); // Create main scene
    //var stats = initStats(); // To show FPS information
    var renderer = initRenderer(); // View function in util/utils
    //renderer.setClearColor("rgb(30, 30, 40)");
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000); //var camera = initCamera(new THREE.Vector3(0, 10, 20));
    camera.lookAt(0, 0, 0);
    camera.position.set(5, 15, 30);
    camera.up.set(0, 1, 0);

    var clock = new THREE.Clock();
    var light = initDefaultLighting(scene, new THREE.Vector3(25, 30, 20)); // Use default light

    // Show axes (parameter is size of each axis)
    var axes = new THREE.AxesHelper(12);
    axes.name = "AXES";
    axes.visible = false;
    scene.add(axes);

    var groundPlane = createGroundPlane(30, 30); // width and height
    groundPlane.rotateX(degreesToRadians(-90));
    scene.add(groundPlane);

    // Enable mouse rotation, pan, zoom etc.
    var orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.target.set(0, 0, 0);
    orbitControls.minDistance = 25;
    orbitControls.maxDistance = 100;

    // Object Material for all objects
    var objectMaterial = new THREE.MeshPhongMaterial({ color: "rgb(255, 0, 0)" });
    var wireframe = new THREE.LineBasicMaterial({ color: "rgb(255, 0, 0)" });

    // Add objects to scene
    var objectArray = new Array();
    scene.add(createTetrahedron(4.0, 0));
    scene.add(createCube(5.0));
    scene.add(createOctahedron(4.0, 0));
    scene.add(createDodecahedron(4.0, 0));
    scene.add(createIcosahedron(4.0, 0));

    scene.add(createTetrahedronWireframe(4.0, 0));
    scene.add(createCubeWireframe(5.0));
    scene.add(createOctahedronWireframe(4.0, 0));
    scene.add(createDodecahedronWireframe(4.0, 0));
    scene.add(createIcosahedronWireframe(4.0, 0));

    // Position of the cube
    objectArray[1].position.y = 5;
    objectArray[6].position.y = 5;

    // Controls of sidebar
    var controls = new function () {
        var self = this;

        // Axes
        this.axes = false;

        // Inicia a geometria e material de base a serem controlados pelo menu interativo
        //this.appliedMaterial = applyMeshNormalMaterial;
        this.castShadow = true;
        this.groundPlaneVisible = true;

        //Physics
        this.animation = true;
        this.rotation = 0.015;
        this.wireframe = false;
        this.wireframeStatus = false;
        this.color = "rgb(255, 0, 0)";

        // Geometry
        this.mesh = objectArray[0];
        this.meshNumber = 0;
        this.radius = 10;
        this.detail = 0;
        this.type = 'Tetrahedron';
        this.size = 1.0;

        this.choosePoligon = function () {
            objectArray[this.meshNumber].visible = false;

            if (this.wireframe) {
                switch (this.type) {
                    case 'Tetrahedron':
                        this.type = 'TetrahedronWireframe';
                        this.meshNumber = 5;
                        break;
                    case 'Cube':
                        this.type = 'CubeWireframe';
                        this.meshNumber = 6;
                        break;
                    case 'Octahedron':
                        this.type = 'OctahedronWireframe';
                        this.meshNumber = 7;
                        break;
                    case 'Dodecahedron':
                        this.type = 'DodecahedronWireframe';
                        this.meshNumber = 8;
                        break;
                    case 'Icosahedron':
                        this.type = 'IcosahedronWireframe';
                        this.meshNumber = 9;
                        break;
                }
            } else {
                switch (this.type) {
                    case 'Tetrahedron':
                        this.meshNumber = 0;
                        break;
                    case 'Cube':
                        this.meshNumber = 1;
                        break;
                    case 'Octahedron':
                        this.meshNumber = 2;
                        break;
                    case 'Dodecahedron':
                        this.meshNumber = 3;
                        break;
                    case 'Icosahedron':
                        this.meshNumber = 4;
                        break;
                }
            }
            objectArray[this.meshNumber].visible = true;
            this.mesh = objectArray[this.meshNumber];
        }

        this.resizePoligon = function () {

            const poligon = objectArray[this.meshNumber];

            poligon.scale.set(this.size, this.size, this.size);
            // console.log(poligon)
            if (this.size < 1.4 && this.size >= 1) {
                poligon.position.y = this.size * 3 + 1.8;
            }
            if (this.size >= 0.5 && this.size < 1) {
                poligon.position.y = this.size * 3 + 1;
            }
            if (this.size >= 1.4 && this.size <= 2) {
                poligon.position.y = this.size * 3 + 2.5;
            }
        }

        this.updateColor = function () {
            // removing the objects with the old material color
            for (let i = 0; i < objectArray.length; i++) {
                //scene.remove(scene.getObjectByName("particles1"));
                scene.remove(objectArray[i]);
            }
            objectArray = new Array();
            objectMaterial = new THREE.MeshPhongMaterial({ color: controls.color }); // Setting the material with new color
            wireframe = new THREE.LineBasicMaterial({ color: controls.color });

            // Recreating those objects
            scene.add(createTetrahedron(4.0, 0));
            scene.add(createCube(5.0));
            scene.add(createOctahedron(4.0, 0));
            scene.add(createDodecahedron(4.0, 0));
            scene.add(createIcosahedron(4.0, 0));

            scene.add(createTetrahedronWireframe(4.0, 0));
            scene.add(createCubeWireframe(5.0));
            scene.add(createOctahedronWireframe(4.0, 0));
            scene.add(createDodecahedronWireframe(4.0, 0));
            scene.add(createIcosahedronWireframe(4.0, 0));

            // Position of the cube
            objectArray[1].position.y = 5;
            objectArray[6].position.y = 5;

            this.choosePoligon();

            this.resizePoligon();

            // Correcting if the wireframe option is tick
            this.wireframeController();
        }

        this.wireframeController = function () {

            if (this.wireframe) {
                objectArray[this.meshNumber].visible = false;
                if (this.meshNumber < 5) {
                    this.meshNumber += 5;
                }
                objectArray[this.meshNumber].visible = true;
                objectArray[this.meshNumber].scale.set(this.size, this.size, this.size);
                this.wireframeStatus = true;
            } else {
                objectArray[this.meshNumber].visible = false;
                if (this.meshNumber > 4) {
                    this.meshNumber -= 5;
                }
                objectArray[this.meshNumber].visible = true;
                objectMaterial.visible = true;
                this.wireframeStatus = false;
            }
            this.choosePoligon();
            this.resizePoligon();
        }
    }

    // GUI de controle e ajuste de valores especificos da geometria do objeto
    var gui = new dat.GUI();

    var guiFolder = gui.addFolder("Properties");
    guiFolder.open(); // Open the folder
    guiFolder.add(controls, "animation").listen().onChange(function (e) {
        if (controls.animation) {
            controls.rotation = 0.015;
        }
        else {
            controls.rotation = 0;
        }
    });
    /*guiFolder.add(controls, "axes").listen().onChange(function(e) {
        if (controls.axes) {
            axes.visible = true;
        } else {
            axes.visible = false;
        }
    });*/

    //guiFolder.add(controls, 'rotation', 0, 0.5).onChange();
    //gui.add(controls, 'radius', 0, 40).step(1).onChange(controls.redraw);
    //gui.add(controls, 'detail', 0, 3).step(1).onChange(controls.redraw);
    guiFolder.addColor(controls, 'color').onChange(function (e) {
        controls.updateColor();
    });

    guiFolder.add(controls, 'wireframe').listen().onChange(function (e) {
        controls.wireframeController();

    });

    guiFolder.add(controls, 'type', ['Tetrahedron', 'Cube', 'Octahedron', 'Dodecahedron', 'Icosahedron']).onChange(function (e) {
        if (this.wireframeStatus) {
            this.meshNumber -= 5;
        }
        controls.choosePoligon();
        controls.resizePoligon();
    });

    gui.add(controls, 'size', 0.5, 2).listen().onChange(function (e) {
        controls.resizePoligon()
    })
    controls.wireframeController();
    controls.choosePoligon(); // Update de selection of the polygon


    // 4 faces
    function createTetrahedron(radius, detail) {
        var geometry = new THREE.TetrahedronGeometry(radius, detail);
        var object = new THREE.Mesh(geometry, objectMaterial);
        object.castShadow = true;
        object.position.set(0.0, radius * 1.1, 0.0);
        object.visible = false;
        object.name = "Tetrahedron";
        objectArray.push(object);
        return object;
    }

    // 6 faces
    function createCube(s) {
        let geometry = new THREE.BoxGeometry(s, s, s);
        let object = new THREE.Mesh(geometry, objectMaterial);
        object.castShadow = true;
        object.position.set(0.0, s / 2.0, 0.0);
        object.visible = false;
        object.name = "Cube";
        objectArray.push(object);
        return object;
    }

    // 8 faces
    function createOctahedron(radius, detail) {
        var geometry = new THREE.OctahedronGeometry(radius, detail);
        var object = new THREE.Mesh(geometry, objectMaterial);
        object.castShadow = true;
        object.position.set(0.0, radius, 0.0);
        object.visible = false;
        object.name = "Octahedro";
        objectArray.push(object);
        return object;
    }

    // 12 faces
    function createDodecahedron(radius, detail) {
        var geometry = new THREE.DodecahedronGeometry(radius, detail);
        var object = new THREE.Mesh(geometry, objectMaterial);
        object.castShadow = true;
        object.position.set(0.0, radius, 0.0);
        object.visible = false;
        object.name = "Dodecahedron";
        objectArray.push(object);
        return object;
    }

    // 20 faces
    function createIcosahedron(radius, detail) {
        let geometry = new THREE.IcosahedronGeometry(radius, detail);
        let object = new THREE.Mesh(geometry, objectMaterial);
        object.castShadow = true;
        object.position.set(0.0, radius, 0.0);
        object.visible = false;
        object.name = "Icosahedron";
        objectArray.push(object);
        return object;
    }

    function createTetrahedronWireframe(radius, detail) {
        let edges = new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(radius, detail));
        let object = new THREE.LineSegments(edges, wireframe);
        object.castShadow = true;
        object.position.set(0.0, radius * 1.1, 0.0);
        object.visible = false;
        object.name = "TetrahedronWireframe";
        object.rotation.x += 0.15;
        objectArray.push(object);
        return object;
    }

    function createCubeWireframe(s) {
        let edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(s, s, s));
        let object = new THREE.LineSegments(edges, wireframe);
        object.castShadow = true;
        object.position.set(0.0, s / 2.0, 0.0);
        object.name = "CubeWireframe";
        object.visible = false;
        objectArray.push(object);
        return object;
    }

    function createOctahedronWireframe(radius, detail) {
        const edges = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(radius, detail));
        const edgesMesh = new THREE.LineSegments(edges, wireframe);
        edgesMesh.castShadow = true;
        edgesMesh.position.set(0.0, radius, 0.0);
        edgesMesh.name = "OcatahedronWireframe";
        edgesMesh.visible = false;
        objectArray.push(edgesMesh);
        return edgesMesh;
    }

    function createDodecahedronWireframe(radius, detail) {
        const edges = new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(radius, detail));
        const edgesMesh = new THREE.LineSegments(edges, wireframe);
        edgesMesh.castShadow = true;
        edgesMesh.position.set(0.0, radius, 0.0);
        edgesMesh.name = "DodecahedronWireframe";
        edgesMesh.visible = false;
        objectArray.push(edgesMesh);
        return edgesMesh;
    }

    function createIcosahedronWireframe(radius, detail) {
        const edges = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(radius, detail));
        const edgesMesh = new THREE.LineSegments(edges, wireframe);
        edgesMesh.castShadow = true;
        edgesMesh.position.set(0.0, radius, 0.0);
        edgesMesh.name = "IcosahedronWireframe";
        edgesMesh.visible = false;
        objectArray.push(edgesMesh);
        return edgesMesh;
    }

    // Reajuste da renderização com base na mudança da janela
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;  //Atualiza o aspect da camera com relação as novas dimensões
        camera.updateProjectionMatrix();                         //Atualiza a matriz de projeção
        renderer.setSize(window.innerWidth, window.innerHeight); //Define os novos valores para o renderizador
        //console.log('Resizing to %s x %s.', window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize, false);         // Ouve os eventos de resize


    render();

    function render() {
        //stats.update();
        orbitControls.update();
        // Atualiza o controle da câmera
        //orbitControls.update(clock.getDelta());

        // Rotating the mesh selected

        controls.mesh.rotation.x += controls.rotation;
        controls.mesh.rotation.y += controls.rotation;
        controls.mesh.rotation.z += controls.rotation;
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }
}