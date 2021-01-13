let container, stats;
let camera, scene, renderer;
let group;
let mouseX = 0, mouseY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let THREE = window.THREE;

// 模型组的外接盒
let envelopeBox = new THREE.Box3();

//模型路径
let mat1 = '../models/testModel/objTest/objTest.mtl';
let obj1 = '../models/testModel/objTest/objTest.obj';

let model1;
let info_obj = [];

// 存储每个mesh的材质的颜色
let matColorMap = new Map();

// 模型是否自传
let rotation = true;


init();
animate();

function init() {

    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 10, 10000000);
    camera.position.z = 1000;
    camera.position.y = 250;

    scene = new THREE.Scene();

    group = new THREE.Group();
    scene.add(group);

    scene.add(new THREE.AmbientLight(0xFFFFFF, 1.5));

    //加载模型
    new THREE.MTLLoader()
        .load(mat1, function (mat) {
            mat.preload();
            self.materials = mat;
            new THREE.OBJLoader()
                .setMaterials(mat)
                .load(obj1, function (loadedMesh) {
                    model1 = loadedMesh;
                    model1.scale.set(0.4, 0.4, 0.4);
                    console.log(loadedMesh);
                    group.add(model1);
                    envelopeBox.expandByObject(group);
                    _initBlast();
                });
        });

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, autoClear: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    let orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.autoRotate = false;


    onClick();

    event();

    slider();

}


//窗口自适应
function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onDocumentMouseMove(event) {

    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);

}


function onClick() {
    //renderer.domElement.style.cursor = 'crosshair';
    renderer.domElement.addEventListener('click', clickFn);
}

function clickFn(e) {
    rotation = false;
    //恢复所有被点击的mesh的颜色
    recursionFn(model1, (mesh) => {
        let mats = matColorMap.get(mesh.uuid);
        if (mats) {
            mesh.material = mats;
            matColorMap.delete(mesh.uuid);
        }
    });
    let targets = getMeshByClientXY(e.clientX, e.clientY);

    console.log('get targets', targets);

    if (targets.length > 0) {

        let target = targets[0].object;
        let obj = info_obj[target.id] || {};
        console.log(target.id);
        //d3.select('#info_content').html(target.id);
        //d3.select('#info_content').html(`<div>${obj.name}</div>`);
        d3.select('#info_content').html(target.name);
        d3.select('#info').style('display', 'block');

        console.log(target);

        let mats = target.material;
        matColorMap.set(target.uuid, mats);

        if (Array.isArray(mats)) {
            let newMats = mats.map(m => {
                let mClone = m.clone();
                mClone.color = new THREE.Color('#ADFF2F');
                return mClone;
            });
            target.material = newMats;
        } else {
            let mClone = mats.clone();
            mClone.color = new THREE.Color('#ADFF2F');
            target.material = mClone;
        }
    }
}

function animate() {

    requestAnimationFrame(animate);

    render();

}


function render() {
    //模型自转
    if (rotation) {
        group.rotation.y += 0.01;
    }
    renderer.render(scene, camera);

}


/**
 * 递归循环模型，并执行相应的操作
 * @param mesh 贷循环的模型
 * @param fn function(mesh)
 */
function recursionFn(mesh, fn) {
    if (mesh.children.length !== 0) {
        fn(mesh);
        mesh.children.forEach(m => {
            recursionFn(m, fn);
        })
    } else {
        fn(mesh);
    }
}

/**
 * 根据鼠标事件对象：e.clientX,e.clientY获取Mesh数组
 * @param clientX
 * @param clientY
 * @returns {*}
 */
function getMeshByClientXY(clientX, clientY) {
    return fetchObjects(clientX, clientY);
}

function fetchObjects(clientX, clientY) {
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();

    //将鼠标点击位置的屏幕坐标转成threejs中的标准坐标
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    //从相机发射一条射线，经过鼠标点击位置
    raycaster.setFromCamera(mouse, camera);
    //计算射线相机到的对象，可能有多个对象，因此返回的是一个数组，按离相机远近排列
    let intersectObjs = raycaster.intersectObjects(model1.children);

    return intersectObjs;
}


function event() {
    d3.select('#drag').on('click', function () {
        location.href = "./miao_drag_index.html"
    });

    d3.select('#clip').on('click', function () {
        location.href = "./miao_clip_index.html"
    });

    d3.select('#home').on('click', function () {
        location.href = "../index.html"
    });

    d3.select('#info_close').on('click', function () {
        d3.select('#info').style('display', 'none');
    })
}


function slider() {
    let slider = document.getElementById('slider');
    let sliderValue = document.getElementById('slider-value');

    window.onload = function () {
        slider.addEventListener('input', function (e) {
            let value = e.target.value;
            sliderValue.textContent = value + '%';
            modelBlast(value)
        });
    }
}

/**
 * 内部方法，计算模型爆炸中心点及方向
 * @private
 */
function _initBlast() {
    //获取模型的包围盒
    let modelBox3 = envelopeBox;
    let meshBox3 = new THREE.Box3();

    //计算模型的中心点坐标，这个为爆炸中心
    let modelWorldPs = new THREE.Vector3().addVectors(modelBox3.max, modelBox3.min).multiplyScalar(0.5);

    model1.traverse(function (value) {
        if (value.isMesh) {
            meshBox3.setFromObject(value);

            //获取每个mesh的中心点，爆炸方向为爆炸中心点指向mesh中心点
            var worldPs = new THREE.Vector3().addVectors(meshBox3.max, meshBox3.min).multiplyScalar(0.5);
            if (isNaN(worldPs.x)) return;
            //计算爆炸方向
            value.worldDir = new THREE.Vector3().subVectors(worldPs, modelWorldPs).normalize();
            //保存初始坐标
            value.userData.oldPs = value.getWorldPosition(new THREE.Vector3())
        }
    });
}

/**
 * 模型爆炸
 * @param scalar
 */
function modelBlast(scalar) {
    scalar = scalar * 10;
    model1.traverse(function (value) {
        if (!value.isMesh || !value.worldDir) return;

        //爆炸公式
        value.position.copy(new THREE.Vector3().copy(value.userData.oldPs).add(new THREE.Vector3().copy(value.worldDir).multiplyScalar(scalar)))
    });
}
