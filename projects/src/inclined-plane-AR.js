function main() {
    // Physijs configuration
    Physijs.scripts.worker = '../libs/other/physijs/physijs_worker.js';
    Physijs.scripts.ammo = 'ammo.js';

    // use the defaults
    var stats = initStats();
    var gui = new dat.GUI();

    // use the defaults
    var scene = new Physijs.Scene({reportSize: 4, fixedTimeStep: 1 / 420}); //fixedTimeStep: 1 / 60
    var gravity = -9.8;
    scene.setGravity(new THREE.Vector3(0, gravity, 0));
    var camera = new THREE.Camera();
    scene.add(camera);

    // init renderer
    var renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setClearColor(new THREE.Color('lightgrey'), 0);

    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    renderer.setPixelRatio(window.devicePixelRatio); //Improve Ratio of pixel in function of the of device
    renderer.setSize(window.innerWidth, window.innerHeight); //640, 480

    // Adiciona a saída do renderizador para um elemento da página HTML
    document.getElementById("webgl-output").appendChild(renderer.domElement);

    // Positioning Lights

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, 40, 70);
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.fov = 20;
    spotLight.decay = 2;
    spotLight.penumbra = 0.05;
    spotLight.name = "spotLight";
    scene.add(spotLight);

    var ambientLight = new THREE.AmbientLight(0x343434);
    ambientLight.name = "ambientLight";
    scene.add(ambientLight);
    scene.add(new THREE.AmbientLight(0x0393939));

    // Axis
    //var axis = new THREE.AxisHelper(300);
    //scene.add(axis);

    var textureLoader = new THREE.TextureLoader();

    // setup controls
    var controls = {
        angleRamp: 30,                              // Degrees of inclination of the ramp
        animation: true,
        frictionRamp: 0.9,
        frictionBox: 0.5,
        restitutionRamp: 0.3,
        gravityX: 0,
        gravityY: -9.8,
        gravityZ: 0,
        groupForces: null,
        massBox: 1,
        mesh: null,
        ramp: [],
        
                    /*************************
                     *  Dimensions of size   *
                     ************************/
        scaleObjects: 1.5,

        // Ramp 
        lengthRamp: 0.5,    // Comprimento
        widthRamp: 0.5,     // Largura
        deepRamp: 0.01,     // Profundidade
        fixDistRamp: 0.025, // Base da rampa
        groundWallDeep: 0.005,

        // Box
        lengthBox: 0.1,            // BoxSize
        startPosition: {
            x: 0,
            y: 0,
            z: 0,
        },
        visibleBox: true,

        // GroupForces
        gForces: {
            centerDiagram: 0.015,
        },

        // WoodenBox
        woodenBox:{
            groundLength: 1,
            groundWidth: 1,
            woodenBoxDeep: 0.05,
            borderHeight: 0.125,
            borderLeftRightLength: 1.1,
            xPosition: 0.525,
            yPosition: 0.035,
            zPosition: 0.525,
        },


        // Paineis
        informations: document.getElementById("informations"),
        panels: {
            informations: false,
        },

        // Collision Check
        collision:{
            ramp: false,
            ground: false,
        },

        createRamp: function(){
            for(let i = 0; i < this.ramp.length; i++){
                scene.remove(this.ramp[i]);         // Remove old version
            }
            this.ramp = [];

            var ramp_material = Physijs.createMaterial(
                new THREE.MeshStandardMaterial(
                    {map: textureLoader.load("assets/textures/bathroom.jpg")}
                ),
                this.frictionRamp, this.restitutionRamp
            ); //Friction and restitution
            
            // Adjust the texture
            ramp_material.map.repeat.set(3,3);
            ramp_material.map.wrapS = THREE.RepeatWrapping;
            ramp_material.map.wrapT = THREE.RepeatWrapping;
            
            var ramp = new Physijs.BoxMesh(new THREE.BoxGeometry(this.lengthRamp, this.deepRamp, this.widthRamp), ramp_material, 0);
            ramp.name = "ramp";

            let altura = Math.sin(this.angleRamp * (Math.PI/180)) * this.lengthRamp;
            ramp.position.y = altura/2 + this.fixDistRamp;    //  8

            ramp.rotation.y = THREE.MathUtils.degToRad(90);
            ramp.rotation.z = THREE.MathUtils.degToRad(this.angleRamp);
            this.ramp.push(ramp);
            scene.add(ramp);

            var wall_material = Physijs.createMaterial(
                new THREE.MeshStandardMaterial(
                    {
                        map: textureLoader.load("assets/textures/bathroom.jpg"),
                        side: THREE.DoubleSide
                    }
                ),
                this.frictionRamp, this.restitutionRamp
            ); //Friction and restitution
            
            // Adjust the texture
            wall_material.map.repeat.set(3, 3);
            wall_material.map.wrapS = THREE.RepeatWrapping;
            wall_material.map.wrapT = THREE.RepeatWrapping;

            var wall_sides_material = Physijs.createMaterial(new THREE.MeshBasicMaterial({
                color: 0xc222222, side: THREE.DoubleSide
                }),
                this.frictionRamp, this.restitutionRamp
            ); //Friction and restitution

            var backWall = new  Physijs.BoxMesh(new THREE.BoxGeometry(this.widthRamp, altura, this.deepRamp), wall_material, 0);
            backWall.position.z = - ((altura - altura/2) / Math.tan(this.angleRamp * (Math.PI/180)));
            backWall.position.y = altura/2 + this.fixDistRamp;
            this.ramp.push(backWall);
            scene.add(backWall);

            // Calculando posicao inicial do bloco
            let centerPointRamp = new THREE.Vector3(ramp.position.x, ramp.position.y, ramp.position.z);
            let heightPointRamp = new THREE.Vector3(backWall.position.x, altura, backWall.position.z);
            let mediumPointRamp = new THREE.Vector3(backWall.position.x, ramp.position.y, backWall.position.z);
            let mediumPointGroundRamp = new THREE.Vector3(backWall.position.x, 0, backWall.position.z);

            // Calculate the unit vector of direction of the center ramp to the height point
            let unitVector = {
                component: new THREE.Vector3(0, 0, 0),
                module: 0,
            };
            unitVector.component.x =  centerPointRamp.x - heightPointRamp.x;
            unitVector.component.y =  centerPointRamp.y - heightPointRamp.y;
            unitVector.component.z =  centerPointRamp.z - heightPointRamp.z;
            unitVector.module = Math.sqrt(unitVector.component.x * unitVector.component.x + 
            unitVector.component.y * unitVector.component.y + 
            unitVector.component.z + unitVector.component.z);
            
            // Unitary Vector
            unitVector.component.x = unitVector.component.x / unitVector.module;
            unitVector.component.y = unitVector.component.y / unitVector.module;
            unitVector.component.z = unitVector.component.z / unitVector.module;

            let tempStartPosition = new THREE.Vector3(
                heightPointRamp.x + unitVector.component.x * (unitVector.module/2),
                heightPointRamp.y + unitVector.component.y * (unitVector.module/2), 
                heightPointRamp.z + unitVector.component.z * (unitVector.module/2)
            );

            // Calculating the start position of the block
            // Calculate the new unit vector of tempStartPosition to mediumPointRamp
            let unitVector2 = {
                component: new THREE.Vector3(0, 0, 0),
                module: 0,
            };
            unitVector2.component.x = tempStartPosition.x - mediumPointGroundRamp.x;
            unitVector2.component.y = tempStartPosition.y - mediumPointGroundRamp.y;
            unitVector2.component.z = tempStartPosition.z - mediumPointGroundRamp.z;
            unitVector2.module = Math.sqrt(unitVector2.component.x * unitVector2.component.x + 
            unitVector2.component.y * unitVector2.component.y + 
            unitVector2.component.z + unitVector2.component.z);
            
            // Unitary Vector
            unitVector2.component.x = unitVector2.component.x / unitVector2.module;
            unitVector2.component.y = unitVector2.component.y / unitVector2.module;
            unitVector2.component.z = unitVector2.component.z / unitVector2.module;

            // Set the start position of the box
            if(this.angleRamp > 20){
                this.startPosition.x = mediumPointGroundRamp.x + 
                (unitVector2.component.x * ((this.lengthBox * Math.sqrt(2))/2 + unitVector2.module));
                this.startPosition.y = mediumPointGroundRamp.y 
                + (unitVector2.component.y * ((this.lengthBox * Math.sqrt(1.8)) + unitVector2.module));
                this.startPosition.z = mediumPointGroundRamp.z + 
                (unitVector2.component.z * Math.ceil((this.lengthBox)/2 + unitVector2.module));

                if(this.angleRamp > 38){
                    this.startPosition.y = mediumPointGroundRamp.y 
                    + (unitVector2.component.y * ((this.lengthBox) + unitVector2.module));
                }
            }
            else{
                this.startPosition.x = mediumPointGroundRamp.x + 
                (unitVector2.component.x * ((this.lengthBox * Math.sqrt(2))/2 + unitVector2.module));
                this.startPosition.y = mediumPointGroundRamp.y 
                + (unitVector2.component.y * ((this.lengthBox * 3) + unitVector2.module));
                this.startPosition.z = mediumPointGroundRamp.z + 
                (unitVector2.component.z * Math.ceil((this.lengthBox)/2 + unitVector2.module));
            }

            var groundWall = new  Physijs.BoxMesh(new THREE.BoxGeometry(this.widthRamp, this.groundWallDeep, (altura / Math.tan(controls.angleRamp * (Math.PI/180)))), wall_material, 0);
            groundWall.position.y = this.fixDistRamp;
            this.ramp.push(groundWall);
            scene.add(groundWall);

            // Adiciona os pontos da face lateral

            // Left Side
            var points = [];
            points.push(new THREE.Vector3(this.widthRamp/2, altura + this.fixDistRamp, backWall.position.z));
            points.push(new THREE.Vector3(this.widthRamp/2, this.fixDistRamp, 
                backWall.position.z + (Math.cos(this.angleRamp * Math.PI/180) * this.lengthRamp)
            ));
            points.push(new THREE.Vector3(this.widthRamp/2, this.fixDistRamp, backWall.position.z));
            points.push(new THREE.Vector3(this.widthRamp/2, altura + this.fixDistRamp, backWall.position.z));

            // Usa os mesmos pontos para criar o objeto geometrico convexo
            var geometry = new THREE.ConvexGeometry( points );
            geometry.computeVertexNormals();                        // Computa as normais
            geometry.computeFaceNormals();                          // Computa as normais de cada face
            geometry.normalsNeedUpdate = true;
            var leftWall = new Physijs.ConvexMesh(geometry, wall_sides_material, 0);

            geometry.computeVertexNormals();                        // Computa as normais
            geometry.computeFaceNormals();                          // Computa as normais de cada face
            geometry.normalsNeedUpdate = true;

            this.ramp.push(leftWall);
            scene.add(leftWall);

            // Right Side
            points = [];
            points.push(new THREE.Vector3(-this.widthRamp/2, altura + this.fixDistRamp, backWall.position.z));
            points.push(new THREE.Vector3(-this.widthRamp/2, this.fixDistRamp, 

                backWall.position.z + (Math.cos(this.angleRamp * Math.PI/180) * this.lengthRamp)
            ));
            points.push(new THREE.Vector3(-this.widthRamp/2, this.fixDistRamp, backWall.position.z));
            points.push(new THREE.Vector3(-this.widthRamp/2, altura + this.fixDistRamp, backWall.position.z));

            // Usa os mesmos pontos para criar o objeto geometrico convexo
            geometry = new THREE.ConvexGeometry( points );
            geometry.computeVertexNormals();                        // Computa as normais
            geometry.computeFaceNormals();                          // Computa as normais de cada face
            geometry.normalsNeedUpdate = true;
            var rightWall = new Physijs.ConvexMesh(geometry, wall_sides_material, 0);
            this.ramp.push(rightWall);
            scene.add(rightWall);
        },

        createBox: function(){
            if(this.mesh != null){
                scene.remove(this.mesh);         // Remove old version       -- Box
                this.mesh = null;
            }
            if(this.groupForces != null){
                scene.remove(this.groupForces);         // Remove old version -- GroupForces
                this.groupForces = null;
            }

            var block_material = Physijs.createMaterial(
                new THREE.MeshStandardMaterial(
                {map: textureLoader.load('assets/textures/stone.jpg')}
                ),
                this.frictionBox, .1
            ); //Friction and restitution
            this.mesh = new Physijs.BoxMesh(new THREE.BoxGeometry(this.lengthBox, this.lengthBox, this.lengthBox), 
            block_material, this.massBox);     //geometry, material and mass
            this.mesh.position.x = this.startPosition.x;
            this.mesh.position.y = this.startPosition.y;
            this.mesh.position.z = this.startPosition.z;
            this.mesh.rotation.set(0, 0, 0);
            this.mesh.rotation.y = THREE.MathUtils.degToRad(90);
            this.mesh.rotation.z = THREE.MathUtils.degToRad(this.angleRamp);
            scene.add(this.mesh);

            handleCollision = function( collided_with, linearVelocity, angularVelocity ) {
                if(controls.frictionBox > 0){             // Without friction
                    if(collided_with.name === "ground"){ 
                        controls.collision.ground = true;
                        controls.groupForces.children[0].visible = false;
                        controls.groupForces.children[1].visible = true;
                        controls.groupForces.children[2].visible = false;
                        controls.groupForces.children[3].visible = false;
                    }
                    if(collided_with.name === "ramp" && controls.collision.ground === false){ //FIX the diagram forces
                        controls.collision.ramp = true;
                        controls.groupForces.children[0].visible = true;
                        controls.groupForces.children[1].visible = false;
                        controls.groupForces.children[2].visible = false;
                        controls.groupForces.children[3].visible = false;
                    }
                }
                else{
                    if(collided_with.name === "ground"){ 
                        controls.collision.ground = true;
                        controls.groupForces.children[0].visible = false;
                        controls.groupForces.children[1].visible = false;
                        controls.groupForces.children[2].visible = false;
                        controls.groupForces.children[3].visible = true;
                    }
                    if(collided_with.name === "ramp" && controls.collision.ground === false){ //FIX the diagram forces
                        controls.collision.ramp = true;
                        controls.groupForces.children[0].visible = false;
                        controls.groupForces.children[1].visible = false;
                        controls.groupForces.children[2].visible = true;
                        controls.groupForces.children[3].visible = false;
                    }
                }
                this.collisions++;
            }
            this.mesh.collisions = 0;
            this.mesh.addEventListener( 'collision', handleCollision );

            this.groupForces = createForcesDiagram(controls);             // id to identify collision and plot the forces
            this.groupForces.rotation.y = THREE.MathUtils.degToRad(90);
            scene.add(this.groupForces);
        },

        startSimulation: function(){
            // You may also want to cancel the object's velocity
            this.mesh.setLinearVelocity(new THREE.Vector3(0, 0, 0));
            this.mesh.setAngularVelocity(new THREE.Vector3(0, 0, 0));

            this.mesh.position.x = this.startPosition.x;
            this.mesh.position.y = this.startPosition.y;
            this.mesh.position.z = this.startPosition.z;

            this.mesh.rotation.set(0, 0, 0);
            this.mesh.rotation.y = THREE.MathUtils.degToRad(90);
            this.mesh.rotation.z = THREE.MathUtils.degToRad(this.angleRamp);

            // https://github.com/chandlerprall/Physijs/wiki/Updating-an-object's-position-&-rotation
            // Permite a mudança de posição
            this.mesh.__dirtyPosition = true;
            this.mesh.__dirtyRotation = true;

            //updateDisplay(gui);           // Update GUI

            document.getElementById("alertPanel").style.display = "none";
            this.animation = true;
            this.collision.ramp = false;
            this.collision.ground = false;

            this.groupForces.children[0].visible = false;
            this.groupForces.children[1].visible = false;
            this.groupForces.children[2].visible = false;
            this.groupForces.children[3].visible = false;
        },

        updateForces: function(){
            if(this.mesh != null){
                this.groupForces.position.x = this.mesh.position.x; 
                this.groupForces.position.y = this.mesh.position.y + (this.lengthBox * 2);
                this.groupForces.position.z = this.mesh.position.z;
            }

            // Forces Diagram -- Stopped Box
            if(this.collision.ground){
                if(Math.abs(this.mesh.getLinearVelocity().x) < 0.001 && Math.abs(this.mesh.getLinearVelocity().y) < 0.001
                && Math.abs(this.mesh.getLinearVelocity().z) < 0.001){
                this.groupForces.children[0].visible = false;
                this.groupForces.children[1].visible = false;
                this.groupForces.children[2].visible = false;
                this.groupForces.children[3].visible = true;
                }
            }
        },

        updateDates: function(){
            this.collision.ramp = false;
            this.collision.ground = false;
            this.groupForces.children[0].visible = false;
            this.groupForces.children[1].visible = false;
            this.groupForces.children[2].visible = false;
            this.groupForces.children[3].visible = false;
            this.animation = false;
            updateInstructionPanel(gravity, this);
        },

        updateScaleWorld: function(){
            // Ramp 
            this.lengthRamp = this.lengthRamp * this.scaleObjects;
            this.widthRamp = this.widthRamp * this.scaleObjects;
            this.deepRamp = this.deepRamp * this.scaleObjects;
            this.fixDistRamp = this.fixDistRamp * this.scaleObjects;
            //this.groundWallDeep = this.groundWallDeep * this.scaleObjects;
            
            // Box
            this.lengthBox = this.lengthBox * this.scaleObjects;

            // GroupForces
            this.gForces.centerDiagram = this.gForces.centerDiagram * this.scaleObjects;

            // WoodenBox
            this.woodenBox.groundLength = this.woodenBox.groundLength * this.scaleObjects;
            this.woodenBox.groundWidth = this.woodenBox.groundWidth * this.scaleObjects;
            this.woodenBox.borderLeftRightLength = this.woodenBox.borderLeftRightLength * this.scaleObjects;
            this.woodenBox.woodenBoxDeep = this.woodenBox.woodenBoxDeep * this.scaleObjects;
            this.woodenBox.xPosition = this.woodenBox.xPosition * this.scaleObjects;
            this.woodenBox.zPosition = this.woodenBox.zPosition * this.scaleObjects;
            //this.woodenBox.y = this.woodenBox.xPosition * this.scaleObjects;
        },
    };

    // Update scale of the world
    controls.updateScaleWorld();

    // Create world
    controls.createRamp();
    controls.createBox();
    controls.updateDates();
    controls.startSimulation();

    // Don't active the first simulation
    document.getElementById("alertPanel").style.display = "none";   // "block"

    function updateInstructionPanel(gravity, controls){
        // Adjust values of the Instructions Panel
        document.getElementById("gravityCoefficient").innerHTML = gravity * -1;
        document.getElementById("frictionCoefficient").innerHTML = controls.frictionBox;
        document.getElementById("thetaAngleDegree").innerHTML = controls.angleRamp;
        document.getElementById("thetaAngleRadians").innerHTML = THREE.MathUtils.degToRad(controls.angleRamp).toFixed(3);
        document.getElementById("thetaAngleSin").innerHTML = Math.sin(THREE.MathUtils.degToRad(controls.angleRamp)).toFixed(3);
        document.getElementById("thetaAngleCos").innerHTML = Math.cos(THREE.MathUtils.degToRad(controls.angleRamp)).toFixed(3);
        document.getElementById("thetaAngleTan").innerHTML = Math.tan(THREE.MathUtils.degToRad(controls.angleRamp)).toFixed(3);
        document.getElementById("weightForce").innerHTML = (controls.massBox * Math.abs(gravity)).toFixed(2);
        document.getElementById("weightXForce").innerHTML = ((controls.massBox * Math.abs(gravity)) 
        * Math.sin(THREE.MathUtils.degToRad(controls.angleRamp))).toFixed(2);
        document.getElementById("weightYForce").innerHTML = ((controls.massBox * Math.abs(gravity)) 
        * Math.cos(THREE.MathUtils.degToRad(controls.angleRamp))).toFixed(2);
        document.getElementById("normalForce").innerHTML = ((controls.massBox * Math.abs(gravity)) 
        * Math.cos(THREE.MathUtils.degToRad(controls.angleRamp))).toFixed(2);
        document.getElementById("frictionForce").innerHTML = (controls.frictionBox * (controls.massBox * Math.abs(gravity)) 
        * Math.cos(THREE.MathUtils.degToRad(controls.angleRamp))).toFixed(2);
    }

    updateInstructionPanel(gravity, controls);
    controls.animation = false;                   //animação parada
    createGroundAndWalls(scene, controls);

    // Criando atributos do menu lateral
    var objectMenu = gui.addFolder("Menu");
    objectMenu.open();
    objectMenu.add(controls, "frictionBox", 0, 1, 0.01).name("Friction").onChange(function(e){
        controls.createRamp();           // Recria o objeto pois a fisica é mudada
        controls.createBox();            
        controls.updateDates();
    });
    objectMenu.add(controls, "angleRamp", 10, 50, 2).name("Angle (°)").onChange(function(e){
        controls.createRamp();           // Recria o objeto pois a fisica é mudada
        controls.createBox();           
        controls.updateDates();
    });
    objectMenu.add(controls.panels, "informations").onChange(function(e){
        if(controls.panels.informations){
            controls.informations.style.display = "flex";
            onResizePanels();                     // redraw the canvas forces
        }
        else{
            controls.informations.style.display = "none";
        }
    }).name("Informations");
    objectMenu.add(controls, "startSimulation").name("Start");

    // Update GUI Elements
    function updateDisplay(gui) {
        for (var i in gui.__controllers) {
            gui.__controllers[i].updateDisplay();
        }
        for (var f in gui.__folders) {
            updateDisplay(gui.__folders[f]);
        }
    }

    window.onload = function(){
        document.getElementById('close').onclick = function(){
            this.parentNode.style.display = "none";
            return false;
        };
        document.getElementById('close2').onclick = function(){
            controls.informations.style.display = "none";
            controls.panels.informations = false;
            updateDisplay(gui);
            return false;
        };
    };


    ////////////////////////////////////////////////////////////////////////////////
    //          Handler arToolkitSource
    ////////////////////////////////////////////////////////////////////////////////

    var arToolkitSource = new THREEx.ArToolkitSource({
        // to read from the webcam
        sourceType: 'webcam',
        // resolution of at which we initialize the source image
        sourceWidth: 640,
        sourceHeight: 480,
        // resolution displayed for the source 
        displayWidth: 640,
        displayHeight: 480,
    })

    arToolkitSource.init(function onReady() {
        // Esse timeout força a interface de AR se redimensionar com base no tempo passado
        setTimeout(onResize, 1000);
    });

    // handle resize
    window.addEventListener('resize', function() {
        onResize();
    });

    function onResize() {
        arToolkitSource.onResizeElement();
        arToolkitSource.copyElementSizeTo(renderer.domElement);
        if (arToolkitContext.arController !== null) {
            arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////
    //          initialize arToolkitContext
    ////////////////////////////////////////////////////////////////////////////////


    // create atToolkitContext
    var arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: THREEx.ArToolkitContext.baseURL + 'data/data/camera_para.dat',
        detectionMode: 'mono',
        imageSmoothingEnabled : true,
        // resolution of at which we detect pose in the source image
        canvasWidth: 640,
        canvasHeight: 480,
    })

    // initialize it
    arToolkitContext.init(function onCompleted() {
        // copy projection matrix to camera
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    ////////////////////////////////////////////////////////////////////////////////
    //          Create a ArMarkerControls
    ////////////////////////////////////////////////////////////////////////////////

    // init controls for camera
    var markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
        type: 'pattern',
        patternUrl: THREEx.ArToolkitContext.baseURL + 'data/data/patt.hiro',
        // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
        // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
        changeMatrixMode: 'cameraTransformMatrix',
        smooth: true,
    });

    // as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
    scene.visible = false;

    //////////////////////////////////////////////////////////////////////////////////
    //		Rendering of camera and solids
    //////////////////////////////////////////////////////////////////////////////////

    function updateAR() {
        if (arToolkitSource.ready === false) return;

        arToolkitContext.update(arToolkitSource.domElement);

        // update scene.visible if the marker is seen
        scene.visible = camera.visible;
    }

    render();

    function render() {
        updateAR();
        stats.update();

        // Diagrama de forças
        controls.updateForces();
        
        if(controls.animation){
            scene.simulate(undefined, 2);     // Fix the error that occurrent when change parameter the block
                                            // start with an initial speed 
        }
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    // id to identify collision and plot the forces
    function createForcesDiagram(controls){
        var block_material = new THREE.MeshBasicMaterial({color: 0xEEEEEE});
        let size = controls.gForces.centerDiagram;
        var length = controls.lengthBox;            // Length of arrows
        var centerDiagram = new THREE.Mesh(new THREE.SphereGeometry(size, 64, 64), block_material);
        centerDiagram.position.y = 0;
        centerDiagram.position.x = 0;
        centerDiagram.position.z = 0;
        centerDiagram.rotation.z = THREE.MathUtils.degToRad(controls.angleRamp);
    
        // Axes of origin of block
        var groupForces = new THREE.Group;
        groupForces.name = "Forces";
    
                    /**************
                     * Com atrito *
                     **************/
    
        /**********
         *  Peso  *
         *********/
    
        var dir = new THREE.Vector3(0, 1, 0 );
        dir.normalize();  //normalize the direction vector (convert to vector of length 1)
        var origin = new THREE.Vector3(0, 0, 0);
        var hex = 0xff0000;
        var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        arrowHelper.rotation.z = THREE.MathUtils.degToRad(180 - controls.angleRamp);
        centerDiagram.add(arrowHelper);
    
        /************
         *  Normal  *
         ************/
    
        dir = new THREE.Vector3(0, 1, 0 );
        dir.normalize();  //normalize the direction vector (convert to vector of length 1)
        origin = new THREE.Vector3(0, 0, 0);
        hex = 0x00ff00;
        arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        centerDiagram.add(arrowHelper);
    
        /************
         *  Atrito  *
         ***********/
        dir = new THREE.Vector3(1, 0, 0);
        dir.normalize(); //normalize the direction vector (convert to vector of length 1)
        origin = new THREE.Vector3(0, 0, 0);
        hex = 0x0000ff;
        arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        centerDiagram.add(arrowHelper);
    
        groupForces.add(centerDiagram);
    
        /**********************************
         * Colisão com o chão de madeira   *
         **********************************/
    
        centerDiagram = new THREE.Mesh(new THREE.SphereGeometry(size, 64, 64), block_material);
        centerDiagram.position.y = 0;
        centerDiagram.position.x = 0;
        centerDiagram.position.z = 0;
        centerDiagram.visible = false;
    
        /**********
         *  Peso  *
         *********/
    
        var dir = new THREE.Vector3(0, 1, 0 );
        dir.normalize();  //normalize the direction vector (convert to vector of length 1)
        var origin = new THREE.Vector3(0, 0, 0);
        var hex = 0xff0000;
        var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        arrowHelper.rotation.z = THREE.MathUtils.degToRad(180);
        centerDiagram.add(arrowHelper);
    
        /************
         *  Normal  *
         ************/
    
        dir = new THREE.Vector3(0, 1, 0 );
        dir.normalize();  //normalize the direction vector (convert to vector of length 1)
        origin = new THREE.Vector3(0, 0, 0);
        hex = 0x00ff00;
        arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        centerDiagram.add(arrowHelper);
    
        /************
         *  Atrito  *
         ***********/
        dir = new THREE.Vector3(1, 0, 0);
        dir.normalize(); //normalize the direction vector (convert to vector of length 1)
        origin = new THREE.Vector3(0, 0, 0);
        hex = 0x0000ff;
        arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        centerDiagram.add(arrowHelper);
    
        groupForces.add(centerDiagram);
    
                /**************
                 * Sem atrito *
                 **************/
    
        /**********
         * Ramp   *
         **********/
        
        centerDiagram = new THREE.Mesh(new THREE.SphereGeometry(size, 64, 64), block_material);
        centerDiagram.position.y = 0;
        centerDiagram.position.x = 0;
        centerDiagram.position.z = 0;
        centerDiagram.visible = false;
        centerDiagram.rotation.z = THREE.MathUtils.degToRad(controls.angleRamp);
    
        /**********
         *  Peso  *
         *********/
    
        dir = new THREE.Vector3(0, 1, 0 );
        dir.normalize();  //normalize the direction vector (convert to vector of length 1)
        var origin = new THREE.Vector3(0, 0, 0);
        var hex = 0xff0000;
        var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        arrowHelper.rotation.z = THREE.MathUtils.degToRad(180 - controls.angleRamp);
        centerDiagram.add(arrowHelper);
    
        /************
         *  Normal  *
         ************/
    
        dir = new THREE.Vector3(0, 1, 0 );
        dir.normalize();  //normalize the direction vector (convert to vector of length 1)
        origin = new THREE.Vector3(0, 0, 0);
        hex = 0x00ff00;
        arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        centerDiagram.add(arrowHelper);
    
        groupForces.add(centerDiagram);
    
        /**********************************
         * Colisão com o chão de madeira   *
         **********************************/
    
        centerDiagram = new THREE.Mesh(new THREE.SphereGeometry(size, 64, 64), block_material);
        centerDiagram.position.y = 0;
        centerDiagram.position.x = 0;
        centerDiagram.position.z = 0;
        centerDiagram.visible = false;
    
        /**********
         *  Peso  *
         *********/
    
        var dir = new THREE.Vector3(0, 1, 0 );
        dir.normalize();  //normalize the direction vector (convert to vector of length 1)
        var origin = new THREE.Vector3(0, 0, 0);
        var hex = 0xff0000;
        var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        arrowHelper.rotation.z = THREE.MathUtils.degToRad(180);
        centerDiagram.add(arrowHelper);
    
        /************
         *  Normal  *
         ************/
    
        dir = new THREE.Vector3(0, 1, 0 );
        dir.normalize();  //normalize the direction vector (convert to vector of length 1)
        origin = new THREE.Vector3(0, 0, 0);
        hex = 0x00ff00;
        arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        centerDiagram.add(arrowHelper);
        
        groupForces.add(centerDiagram);
    
        return groupForces;
    }
    
    /**********************************************
     * Adiciona uma caixa de madeira na cena      *
     * @param {*} scene                           *
     *********************************************/
    
    function createGroundAndWalls(scene, controls) {
        var textureLoader = new THREE.TextureLoader();
        var ground_material = Physijs.createMaterial(
                new THREE.MeshStandardMaterial(
                {map: textureLoader.load('assets/textures/wood-2.jpg')}
                ),
                .9, .3);
    
        var ground = new Physijs.BoxMesh(new THREE.BoxGeometry(controls.woodenBox.groundLength, 
        controls.woodenBox.woodenBoxDeep, controls.woodenBox.groundWidth), ground_material, 0);
        ground.name = "ground";
    
        var borderLeft = new Physijs.BoxMesh(new THREE.BoxGeometry(controls.woodenBox.woodenBoxDeep,
        controls.woodenBox.borderHeight, controls.woodenBox.borderLeftRightLength), ground_material, 0);
        borderLeft.position.x = - controls.woodenBox.xPosition;
        borderLeft.position.y = controls.woodenBox.yPosition;
    
        ground.add(borderLeft);
    
        var borderRight = new Physijs.BoxMesh(new THREE.BoxGeometry(controls.woodenBox.woodenBoxDeep,
        controls.woodenBox.borderHeight, controls.woodenBox.borderLeftRightLength), ground_material, 0);
        borderRight.position.x = controls.woodenBox.xPosition;
        borderRight.position.y = controls.woodenBox.yPosition;
    
        ground.add(borderRight);
    
        var borderBottom = new Physijs.BoxMesh(new THREE.BoxGeometry(controls.woodenBox.borderLeftRightLength,controls.woodenBox.borderHeight, controls.woodenBox.woodenBoxDeep), ground_material, 0);
        borderBottom.position.z = controls.woodenBox.zPosition;
        borderBottom.position.y = controls.woodenBox.yPosition;
    
        ground.add(borderBottom);
    
        var borderTop = new Physijs.BoxMesh(new THREE.BoxGeometry(controls.woodenBox.borderLeftRightLength,
        controls.woodenBox.borderHeight, controls.woodenBox.woodenBoxDeep), ground_material, 0);
        borderTop.position.z = - controls.woodenBox.zPosition;
        borderTop.position.y = controls.woodenBox.yPosition;
    
        ground.add(borderTop);
        scene.add(ground);
    }
}