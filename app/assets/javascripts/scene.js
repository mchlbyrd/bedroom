var SCREEN_WIDTH = window.innerWidth
    , SCREEN_HEIGHT = window.innerHeight;
var aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
var container, stats, camera, scene, renderer, mesh, cameraRig, activeCamera, activeHelper, cameraPerspective, cameraOrtho, frustumSize = 600
    , model = null
    , targetYRotation = 0
    , targetYPosition = 0
    , widthScale = 1
    , globalScale = 0.5
    , baseScale = 5
    , selectedObj = null
    , hoverObj = null
    , interativeModels = []
    , speed = 10
    , rotationMod = 0
    , light = false
    , goalCameraPosition = {x:0,y:-50,z:0,zoom:3.5}
    , centerPosition = {x:0,y:0,z:0}
, center
, goalLightPosition = {x:0,y:120,z:0,intensity:0.85}
    , roomLight, ambientLight, bed, ground, currentModel, currentColor;
var models = {
    'bedroom': '/assets/models/bedroom4.json'
    , 'bedroom2': '/assets/models/bedroom8.json'
}

var soundTexture;
var numSounds = 10;
var soundMap = null;
var soundParticles = [];
var soundMaterials = [];
var soundMesh = [];

$(document).ready(function () {
    init();
});

function setCameraAndLight(obj){
    goalCameraPosition.x = parseFloat(obj[0].value);
    goalCameraPosition.y = parseFloat(obj[1].value);
    goalCameraPosition.z = parseFloat(obj[2].value);
    goalCameraPosition.zoom = parseFloat(obj[3].value);
    goalLightPosition.intensity = parseFloat(obj[4].value);
}

function loadModel(_model) {
    if (currentModel == _model) {
        return;
    }
    var modelPath = models[_model];
    if (!_model) {
        console.log("ERROR:Invalid model");
        return;
    }
    currentModel = _model;
    var manager = new THREE.LoadingManager();
    manager.onProgress = function (item, loaded, total) {
        //console.log( item, loaded, total );
        console.log(loaded + '/' + total);
    };
    var texture = new THREE.Texture();
    var onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
        }
    };
    var onError = function (xhr) {
        console.log("error");
    };
    var loader = new THREE.ObjectLoader(manager);
    loader.load(modelPath, function (object) {
        model = object;
        doneLoading(model);
    }, onProgress, onError);
}

function setYRotation(y) {
    targetYRotation = rad(y) + rad(rotationMod);
}

function doneLoading(_model) {
    scene.add(_model);
    setupObjects();
}

function setColor(hex) {
    currentColor = {
        r: 0
        , g: 0
        , b: 0
    }
    changeWallColors(currentColor);
}

function init() {
    console.log('init');
    container = document.getElementById('three-panel');
    scene = new THREE.Scene();
    setupScreen();
    setupCamera();
    setupLights();
    setupRenderer();
    setupStats();
    setupEvents();
    setupGround();
    animate();
}

function loadTextures(){
     soundTexture = new THREE.TextureLoader().load( "/assets/images/sound.png", function(event){
        console.log("LOADED");
    createParticles();
});
}

function setupObjects() {
    bed = getChildObj(model, "bed");
    tweenAllObjs(model, 700, 0, 50);
    rSetProp(model, 'castShadow', true);
    rSetProp(model, 'receiveShadow', true);
    toggleLight();
    loadTextures();
}

function createParticles(){
    for(var i = 0; i < numSounds; i++){
        soundParticles[i] = new THREE.PlaneGeometry(16,16,32);
        soundMaterials[i] = new THREE.MeshLambertMaterial({color:0x000000,side:THREE.doubleSide});
        soundMesh[i] = new THREE.Mesh( soundParticles[i], soundMaterials[i] );
        console.log(soundMesh[i]);
        scene.add(soundMesh[i]);
        console.log(i);
    }
}

function tweenAllObjs(obj, speed, num, numMod) {
    if (obj) {
        tweenObjStartPos(obj, {
            x: 0
            , y: (num / 100 > 2 ? 250 : 0)
            , z: 0
        }, {
            x: 0
            , y: 0
            , z: 0
        }, speed * 0.75, num * 0.55)
        if (obj.children) {
            for (var o in obj.children) {
                num += numMod;
                tweenAllObjs(obj.children[o], speed, num, numMod);
            }
        }
    }
}

function changeWallColors(_color) {
    wall1 = getChildObj(model, "wallNW");
    wall2 = getChildObj(model, "wallNE");
    console.log(_color);
    if (!wall1 || !wall2) {
        return;
    }
    var tween = new TWEEN.Tween(wall2.material.color).to(0xFFFFFF, 5000).easing(TWEEN.Easing.Quartic.In).onUpdate(function () {
        wall2.material.color.r = this.r;
        wall2.material.color.g = this.g;
        wall2.material.color.b = this.b;
    }).start();
}
/*
function rChangeColor(){
    
    if (obj.name.indexOf('wall') > -1) {
        var tween = new TWEEN.Tween(obj.material.color).to(currentColor, 5000).easing(TWEEN.Easing.Quartic.In).onUpdate(function () {
            obj.material.color.r = this.r;
            obj.material.color.g = this.g;
            obj.material.color.b = this.b;
        }).start()
    }
}*/

function getWorldPosition(obj){
    var vector = new THREE.Vector3();
    vector.setFromMatrixPosition( obj.matrixWorld );
    return vector;
}

function toggleLight(){
    light = !light;
    var lightswitch = getChildObj(model,"lightswitch");
    console.log(lightswitch.position);
    if(light){
        console.log("TURNING LIGHT ON");
        goalLightPosition.x = 0;
        goalLightPosition.y = 120;
        goalLightPosition.z = 0;
        goalLightPosition.intensity = 0.8;
        ambientLight.color.setRGB(0.5,0.5,0.5);
        ambientLight.intensity = 0.9;
        lightswitch.rotation.x = rad(-90);
        lightswitch.position.y = 23.3515;
        lightswitch.position.x = -38.84;
        lightswitch.position.z = -33.56;
//        lightswitch.position.x = -38.8420;
//        lightswitch.position.z = -31.8606;
        //lightswitch.position.set(-38.8,23.3,-31.8);
    } else {
        console.log("TURNING LIGHT OFF");
        goalLightPosition.x = -60;
        goalLightPosition.y = 120;
        goalLightPosition.z = -60;
        goalLightPosition.intensity = 0.1;
        ambientLight.color.setRGB(0.3,0.3,0.5);
        ambientLight.intensity = 0.8;
        lightswitch.rotation.x = rad(90);
       lightswitch.position.y = 21;
        lightswitch.position.z = -34.06;
//        lightswitch.position.z = -32.3606;
//        lightswitch.position.set(-38.8,21,-32.3);
    }
    console.log(lightswitch.position);
}

function hoverObject(obj) {
    if(hoverObj != obj){
        hoverObj = obj;
        if(obj){
            obj.originalPosition = obj.matrixWorld.getPosition();
        }
    }
}
function selectObject(obj) {
    if (!obj) return;
    //scene.updateMatrixWorld();
    if (model && model.geometry) {
        if (!model.geometry.boundingBox) {
            model.geometry.computeBoundingBox();
        }
    }
    if (!obj.geometry.boundingBox) {
        obj.geometry.computeBoundingBox();
    }
    var vector = obj.geometry.boundingBox.getCenter();
//    console.log('********************');
//    console.log(obj.name);
//    console.log('********************');
    
    if(!center){
        center = getChildObj(model, "center");
        centerPosition = center.position;
    }
    
    var diff = new THREE.Vector3();
//    console.log('obj world position');
//    console.log(getWorldPosition(center));
   // obj.position.set(diff);
    
    var objWorldPos = getWorldPosition(obj);
    var centerWorldPos = getWorldPosition(center);
    
    //diff.subVectors(objWorldPos,centerWorldPos);
    /*
    diff.x = centerWorldPos.x - objWorldPos.x;
    diff.y = centerWorldPos.y - objWorldPos.y;
    diff.z = centerWorldPos.z - objWorldPos.z;
    */
    //console.log(diff);
    
    if(selectedObj != obj){
        obj.originalPosition = obj.matrixWorld.getPosition();
        if(selectedObj){
            //resetObjPosition(selectedObj);
        }
        selectedObj = obj;
        console.log("SELECT:" + selectedObj.name);
        //obj.position.copy(center.matrixWorld.getPosition());
    }
    
    
    switch(obj.name){
        case 'lightswitch':
            toggleLight();
        break;
    }
//    var newPosition = {
//        x: vector.x - obj.position.x
//        , y: vector.y - obj.position.y
//        , z: vector.z - obj.position.z
//    , }
//    obj.position.set(newPosition);
    /*
    var start = {x:0,y:0,z:0};
     var tween = new TWEEN.Tween(start);
    tween.easing(TWEEN.Easing.Quadratic.Out);
    tween.to(vector, 500).onUpdate(function () {
        obj.position.x = start.x;
        obj.position.y = start.y;
        obj.position.z = start.z;
    });
    if (0) {
        tween.delay(0);
    }
    tween.start();
    */
}

function resetObjPosition(obj){
    if(obj.originalPosition){
        console.log("setting " + obj.name + " to ");
        console.log(obj.originalPosition);
        obj.position.set(obj.originalPosition);
    }
}

function tweenObjStartPos(obj, startOffset, endOffset, duration, delay) {
    var prop = 'position';
    if (obj && obj.material && !obj.meh && !obj.children) {
        //        obj.meh = true;
        //        obj.material.opacity = 0;
        //        obj.material.transparent = true;
        //        obj.castShadow = false;
        //        obj.receiveShadow = false;
        //        var tween1 = new TWEEN.Tween( obj.material ).to( { opacity: 1 }, duration ).onUpdate(function(){
        //          if(obj.material.opacity > 0.5){
        //              obj.castShadow = true;
        //              obj.receiveShadow = true;
        //          }
        //        }).delay(delay).start();
    }
    if ((obj.name.indexOf('book') > -1 && obj.name.indexOf('shelf') < 0)
       
       ) {
        startOffset = {
            x: 20
            , y: 0
            , z: 0
        }
    } else 
    if (obj.name.indexOf('painting') > -1 || (obj.name.indexOf('cutains') > -1)) {
        startOffset = {
            z: -20
            , y: 0
            , x: 0
        }
    } else {
        startOffset = {
            x:50,y:50,z:50
        }
    }
    var end = {
        x: obj.position.x + endOffset.x
        , y: obj.position.y + endOffset.y
        , z: obj.position.z + endOffset.z
    }
    var start = {
        x: end.x + startOffset.x
        , y: end.y + startOffset.y
        , z: end.z + startOffset.z
    };
    obj[prop].x = start.x;
    obj[prop].y = start.y;
    obj[prop].z = start.z;
    var tween = new TWEEN.Tween(start);
    tween.easing(TWEEN.Easing.Quadratic.Out);
    tween.to(end, duration).onUpdate(function () {
        obj[prop].x = start.x;
        obj[prop].y = start.y;
        obj[prop].z = start.z;
    });
    if (delay) {
        tween.delay(delay);
    }
    tween.start();
    obj.originalScale = {
        x:obj.scale.x,
        y:obj.scale.y,
        z:obj.scale.z,
    }
    obj.scale.set(0);
    new TWEEN.Tween( obj.scale ).to( { y: obj.originalScale.y, x: obj.originalScale.x, z: obj.originalScale.z }, duration  / 2 ).delay(delay + 500 || 0).start();
}

function rSetProp(obj, prop, val, name, count = 0) {
    if (obj) {
        obj[prop] = val;
        if (obj.name && obj.children.length < 1 && !obj.pushed && obj.type == "Mesh") {
            obj.pushed = true;
            interativeModels.push(obj);
        }
        if (obj.children) {
            for (var o in obj.children) {
                rSetProp(obj.children[o], prop, val, name, count + 1);
            }
        }
    }
    else {
        console.log("ERROR");
        console.log(obj);
    }
}

function getChildObj(obj, name) {
    var result = null;
    if (obj) {
        if (obj.name) {
            
            if (obj.name == name) {
                console.log('found ' + obj.name);
                return obj;
            }
        }
        if (obj.children) {
            for (var o in obj.children) {
                var res1 = getChildObj(obj.children[o], name);
                if (res1) {
                    result = res1;
                }
            }
        }
    }
    return result;
}

function setupGround() {
    var geometry = new THREE.PlaneGeometry(1500, 1500, 1);
    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff
        , side: THREE.DoubleSide
    });
    var ground = new THREE.Mesh(geometry, material);
    ground.receiveShadow = true;
    ground.scale.set(1, 1, 1);
    ground.rotation.set(rad(90), 0, 0);
    ground.position.set(0, -80, 0);
    scene.add(ground);
}

function setupStats() {
    stats = new Stats();
    container.appendChild(stats.dom);
}

function setupScreen() {
    SCREEN_WIDTH = container.clientWidth;
    SCREEN_HEIGHT = container.clientHeight;
    aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    widthScale = (SCREEN_WIDTH / 1500) * globalScale;
}

function setupCamera() {
    cameraOrtho = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 150, 1000);
    cameraOrthoHelper = new THREE.CameraHelper(cameraOrtho);
    cameraOrtho.zoom = 20;
    scene.add(cameraOrthoHelper);
    activeCamera = cameraOrtho;
    activeHelper = cameraOrthoHelper;
    cameraOrtho.rotation.y = Math.PI;
    cameraRig = new THREE.Group();
    cameraRig.add(cameraOrtho);
    scene.add(cameraRig);
}

function setupEvents() {
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseClick, false);
}

function onDocumentMouseMove(e) {
    e.preventDefault();
    var vector = new THREE.Vector3();
    var raycaster = new THREE.Raycaster();
    var dir = new THREE.Vector3();
    vector.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, -1); // z = - 1 important!
    vector.unproject(cameraOrtho);
    dir.set(0, 0, -1).transformDirection(cameraOrtho.matrixWorld);
    raycaster.set(vector, dir);
    var intersects = raycaster.intersectObjects(interativeModels, true);
    if (intersects.length) {
        hoverObject(intersects[0].object);
    } else {
        hoverObject(null);
    }
}

function onDocumentMouseClick(e) {
    e.preventDefault();
    if(hoverObj){
        selectObject(hoverObj);
    }
}

function setupLights() {
    roomLight = new THREE.SpotLight(0xffffff);
    roomLight.angle = 180;
    roomLight.intensity = 0.5;
    roomLight.castShadow = true;
    roomLight.shadowMapWidth = 1024; // default is 512
    roomLight.shadowMapHeight = 1024; // default is 512
    scene.add(roomLight);
    ambientLight = new THREE.AmbientLight(0x555566);
    scene.add(ambientLight);
}

function setupRenderer() {
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.shadowMapType = THREE.PCFSoftShadowMap;
    renderer.shadowMapEnabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.domElement.style.position = "relative";
    renderer.autoClear = true;
    renderer.setClearColor(0xffffff, 1);
    container.appendChild(renderer.domElement);
}
//
function onKeyDown(event) {
    switch (event.keyCode) {
    case 79:
        /*O*/
        activeCamera = cameraOrtho;
        activeHelper = cameraOrthoHelper;
        break;
    case 80:
        /*P*/
        activeCamera = cameraPerspective;
        activeHelper = cameraPerspectiveHelper;
        break;
    }
}

function updateContainer() {
    if (renderer) {
        console.log("---------> UPDATE CONTAINER");
        SCREEN_WIDTH = container.clientWidth;
        SCREEN_HEIGHT = container.clientHeight;
        console.log(SCREEN_WIDTH + ',' + SCREEN_HEIGHT);
        widthScale = (SCREEN_WIDTH / 1500);
        aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        cameraOrtho.left = frustumSize * aspect / -2;
        cameraOrtho.right = frustumSize * aspect / 2;
        cameraOrtho.top = frustumSize / 2;
        cameraOrtho.bottom = frustumSize / -2;
        //frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2
        cameraOrtho.updateProjectionMatrix();
    }
}
//
function onWindowResize(event) {
    updateContainer();
}
//
function animate(time) {
    requestAnimationFrame(animate);
    render();
    TWEEN.update(time);
    if (stats) stats.update();
}

function updateModel() {
    if (model) {
        var bw = widthScale * baseScale;
        model.receiveShadow = true;
        model.castShadow = true;
        model.position.x = 0;
        model.position.z = 0;
        model.position.y += (targetYPosition - model.position.y) / speed;
        model.rotation.y += (targetYRotation - model.rotation.y) / speed;
        model.scale.x += (bw - model.scale.x) / speed;
        model.scale.y += (bw - model.scale.y) / speed;
        model.scale.z += (bw - model.scale.z) / speed;
    }
}

function updateLights() {
    if (roomLight) {
        //roomLight.position.set(Math.sin(frameCount / 50) * 120, 100, Math.cos(frameCount / 50) * 120);
        roomLight.position.x += (goalLightPosition.x - roomLight.position.x) / 20;
        roomLight.position.y += (goalLightPosition.y - roomLight.position.y) / 20;
        roomLight.position.z += (goalLightPosition.z - roomLight.position.z) / 20;
        roomLight.intensity += (goalLightPosition.intensity - roomLight.intensity) / 20;
    }
}

function updateCamera() {
    if (cameraRig) {
        cameraRig.position.x += (goalCameraPosition.x - cameraRig.position.x) / 20;
        cameraRig.position.y += (goalCameraPosition.y - cameraRig.position.y) / 20;
        cameraRig.position.z += (goalCameraPosition.z - cameraRig.position.z) / 20;
        cameraRig.rotation.order = 'YXZ';
        cameraRig.rotation.y = -Math.PI / 4;
        cameraRig.rotation.x = Math.atan(1 / Math.sqrt(2));
    }
    if (cameraOrtho) {
        cameraOrtho.far = 1500;
        cameraOrtho.near = -500;
        cameraOrtho.updateProjectionMatrix();
        cameraOrthoHelper.update();
        cameraOrthoHelper.visible = true;
        cameraOrtho.zoom += (goalCameraPosition.zoom - cameraOrtho.zoom) / 20;
        cameraOrtho.updateProjectionMatrix();
    }
    if (activeHelper) {
        activeHelper.visible = false;
    }
}
var frameCount = 0;

function render() {
    //    if(frameCount % 60 == 0){
    //        console.log(">>>render");
    //        console.log(model);
    //    }
    widthScale = (SCREEN_WIDTH / 1500) * globalScale;
    if (widthScale < 0) {
        widthScale = 0;
    }
    targetYPosition = -80;
    frameCount++;
    updateCamera();
    updateModel();
    updateLights();
    if (renderer) {
        renderer.clear();
        renderer.render(scene, activeCamera);
    }
}

function deg(rad) {
    return (180 / Math.PI) * rad;
}

function rad(deg) {
    return (deg) * (Math.PI / 180);
}