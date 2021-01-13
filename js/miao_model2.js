let container, stats;
let camera, scene, renderer, orbitControls;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let THREE = window.THREE;
//模型路径
let mat1 = '../models/testModel/objTest/objTest.mtl';
let obj1 = '../models/testModel/objTest/objTest.obj';
let model1;
let haha = [];
let info_obj = [];
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

    let meshBox3 = new THREE.Box3();

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
                    //model1.scale.set(0.4, 0.4, 0.4);
                    console.log(loadedMesh);

                    model1.traverse(function (value) {
                        if (value.isMesh) {
                            meshBox3.setFromObject(value);
                            haha.push(value);
                        }
                    });
                    scene.add(model1);
                });
        });

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, autoClear: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.autoRotate = false;


    drag();
    event();

}

//窗口自适应
function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function drag() {

    let transformControls = new THREE.TransformControls(camera, renderer.domElement);
    transformControls.setSize(0.5);
    scene.add(transformControls);

    // 初始化拖拽控件
    let dragControls = new THREE.DragControls(haha, camera, renderer.domElement);

    // 鼠标略过事件
    dragControls.addEventListener('hoveron', function (event) {
        // 让变换控件对象和选中的对象绑定
        transformControls.attach(event.object);
        console.log(event.object.id);
        let target = event.object;
        let obj = info_obj[target.id] || {};
        d3.select('#info_content').html(`<div>${obj.name}</div>`);
        d3.select('#info').style('display', 'block');

    });
    // 开始拖拽
    dragControls.addEventListener('dragstart', function (event) {
        orbitControls.enabled = false;


    });
    // 拖拽结束
    dragControls.addEventListener('dragend', function (event) {
        orbitControls.enabled = true;

    });
}


function animate() {
    orbitControls.update();

    requestAnimationFrame(animate);

    render();

}

function render() {
    //模型自转
    /*if (rotation) {
         model1.rotation.y += 0.01;
     }*/
    renderer.render(scene, camera);

}


function event() {
    d3.select('#blast').on('click', function () {
        location.href = "./miao_blast_index.html"
    });
    d3.select('#clip').on('click', function () {
        location.href = "./miao_clip_index.html"
    });
    d3.select('#home').on('click', function () {
        location.href = "../index.html"
    });
}
