/* -------------- */
/* ANIMATION VARS */
/* -------------- */

var paused = false,
	camera, 
	scene, 
	renderer,
	/* camera starting point */
	camTheta = 3.14, 
	camPhi = .4, 
	camRadius = 5,
	/* helpers for mouse interaction */
	isMouseDown = false, 
	onMouseDownTheta, 
	onMouseDownPhi, 
	onMouseDownPosition,
	cameraMode = 'sky',
	propMeshes = [],
	jugglerMeshes = [],
	jugglerHandVertices,
	animationSpeed;

/* ----------------- */
/* ANIMATION HELPERS */
/* ----------------- */

function updateCamera() {
	if (cameraMode == 'sky') {
		camera.position.x = camRadius * Math.sin( camTheta ) * Math.cos( camPhi );
		camera.position.y = camRadius * Math.sin( camPhi );
		camera.position.z = camRadius * Math.cos( camTheta ) * Math.cos( camPhi );
		camera.lookAt(new THREE.Vector3(0,1,0));
	} else if (cameraMode == 'juggler') {
		/* need to update x and y to reflect the position of the juggler you are possessing */
		camera.position.x = 0;
		camera.position.y = 1.6125;
		camera.position.z = 0;
		//camera.lookAt(new THREE.Vector3(Math.sin(camTheta),3,Math.cos(camTheta)));
		camera.lookAt(new THREE.Vector3(Math.sin(camTheta)*Math.cos(camPhi),1.6125-Math.sin(camPhi),Math.cos(camTheta)*Math.cos(camPhi)));
	}
}

/* got the camera rotation code from: http://www.mrdoob.com/projects/voxels/#A/ */
function onDocumentMouseDown( event ) {
	isMouseDown = true;
	onMouseDownTheta = camTheta;
	onMouseDownPhi = camPhi;
	onMouseDownPosition.x = event.clientX;
	onMouseDownPosition.y = event.clientY;
}

function onDocumentMouseMove( event ) {
	event.preventDefault();
	if ( isMouseDown ) {
		camTheta = - ( ( event.clientX - onMouseDownPosition.x ) * 0.01 ) + onMouseDownTheta;
		
		var dy = event.clientY - onMouseDownPosition.y;
		//TODO: update this so the camera can't cross the pole
		camPhi = ( ( dy ) * 0.01 ) + onMouseDownPhi;
	}

	updateCamera();
	renderer.render(scene, camera);
}

function onDocumentMouseUp( event ) {
	event.preventDefault();
	isMouseDown = false;
}

function onDocumentMouseWheel( event ) {
	camRadius -= event.wheelDeltaY*.01;
}

/* handle screen resizing */
$(window).resize(function() {
	var width = $container.width()-5, height = $(window).height()-5;
	renderer.setSize(width, height);
});

/* --------------------------- */
/* ANIMATION INIT ON PAGE LOAD */
/* --------------------------- */

var $container = $('#canvasContainer');
var width = $container.width()-5, height = $(window).height()-5;


camera = new THREE.PerspectiveCamera( 75, width / height, .05, 100 );
updateCamera();

scene = new THREE.Scene();

/* lights */
var pointLight = new THREE.PointLight( 0xffffff );
pointLight.position.set(0,4,0);
scene.add( pointLight );

/* draw floor */
var floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshLambertMaterial( { color: 0xaaaaaa } ));
floor.rotation.x += 3*Math.PI/2
scene.add(floor);

/* create the renderer and add it to the canvas container */
/* if browser is mobile, render using canvas */
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	renderer = new THREE.CanvasRenderer();	
} else {
	renderer = new THREE.WebGLRenderer( {antialias: true} );
}
renderer.setSize( width, height );

$container.empty();
$container.append(renderer.domElement);

//add the event listeners for mouse interaction
renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
renderer.domElement.addEventListener( 'mousewheel', onDocumentMouseWheel, false );

onMouseDownPosition = new THREE.Vector2();

/* called by Go button on page */

/* on page load instantiate siteswap object, clicking go just re-initializes it with a new siteswap */
var s = new Siteswap();

function go() {

	paused = true; // stop animation

	/* read inputs from UI */
	var config = 
		{
			siteswap: $('#siteswap').val(),
			beatDuration: parseFloat($('#beatDuration').val()),
			dwellDuration: parseFloat($('#dwellDuration').val()),
			gravity: $('#gravity').val(),
			propRadius: $('#propRadius').val(),
			propC: parseFloat($('#propC').val())/100
		};

	animationSpeed = parseFloat($('#animationSpeed').val())/100;
	cameraMode = $('#cameraMode').val();

	/* try to init the siteswap. if failure occurs, display accordingly */
	try {

		s.init(config);
		$('#error').hide();
	
		/* clear out all meshes from scene */
		propMeshes.map(function(a) { scene.remove(a); });
		propMeshes = [];
		jugglerMeshes.map(function(a) { scene.remove(a); });
		jugglerMeshes = [];
		jugglerHandVertices = [];

		/* create each prop and add to empty propMeshes array */
		for (var i = 0; i < s.numProps; i++) {

			var mesh = new THREE.Mesh( new THREE.SphereGeometry( config.propRadius, 20 ), new THREE.MeshPhongMaterial( { color: 'red' } ) );
			mesh.castShadow = true;

			scene.add( mesh );
			propMeshes.push( mesh );
		}
		/* create each juggler and add to empty jugglerMeshes array */
		for (var i = 0; i < s.numJugglers; i++) {

			jugglerHandVertices.push([[],[]]);
			
			/* create juggler mesh at 0,0,0 */

			var jugglerLegsG = new THREE.Geometry();
			jugglerLegsG.vertices.push(new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*-.125,0,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0));
			jugglerLegsG.vertices.push(new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*0,.8,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0));
			jugglerLegsG.vertices.push(new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*.125,0,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0));
			var jugglerLegs = new THREE.Line(jugglerLegsG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));

			var jugglerTorsoG = new THREE.Geometry();
			jugglerTorsoG.vertices.push(new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*0,.8,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0));
			jugglerTorsoG.vertices.push(new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*0,1.5,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0));
			var jugglerTorso = new THREE.Line(jugglerTorsoG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));

			var jugglerShouldersG = new THREE.Geometry();
			jugglerShouldersG.vertices.push(new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*-.225,1.425,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0));
			jugglerShouldersG.vertices.push(new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*.225,1.425,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0));
			var jugglerShoulders = new THREE.Line(jugglerShouldersG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));	

			var jugglerLeftArmG = new THREE.Geometry();
			jugglerLeftArmG.vertices.push(new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*-.225,1.425,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0));
			jugglerLeftArmG.vertices.push(new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*-.225,1.0125,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0));
			jugglerHandVertices[i][LEFT] = new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*-.225,1.0125,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*-.4125);
			jugglerLeftArmG.vertices.push(jugglerHandVertices[i][LEFT]);
			jugglerLeftArmG.dynamic = true;
			var jugglerLeftArm = new THREE.Line(jugglerLeftArmG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));	

			var jugglerRightArmG = new THREE.Geometry();
			jugglerRightArmG.vertices.push(new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*.225,1.425,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0));
			jugglerRightArmG.vertices.push(new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*.225,1.0125,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0));
			jugglerHandVertices[i][RIGHT] = new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*.225,1.0125,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*-.4125);
			jugglerRightArmG.vertices.push(jugglerHandVertices[i][RIGHT]);
			jugglerRightArmG.dynamic = true;
			var jugglerRightArm = new THREE.Line(jugglerRightArmG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));				

			var jugglerHead = new THREE.Mesh( new THREE.SphereGeometry( .1125, 20 ), new THREE.MeshPhongMaterial( { color: 'blank' } ) );
			jugglerHead.position = new THREE.Vector3(s.jugglers[i].position.x+Math.cos(s.jugglers[i].rotation)*0,1.6125,s.jugglers[i].position.z+Math.sin(s.jugglers[i].rotation)*0);

			var jugglerMesh = new THREE.Object3D();
			jugglerMesh.add( jugglerLegs );
			jugglerMesh.add( jugglerTorso );
			jugglerMesh.add( jugglerShoulders );
			jugglerMesh.add( jugglerLeftArm );
			jugglerMesh.add( jugglerRightArm );
			jugglerMesh.add( jugglerHead );

			scene.add(jugglerMesh);
			jugglerMeshes.push(jugglerMesh);

		}

		paused = false;
		var startTime = 0;
		animate();

	} catch(e) {		
		$('#error').show();
		$('#errorMessage').html(e);
	}

	function animate() {
		
		if (startTime == 0) {
			startTime = (new Date()).getTime();
		}

		/* find time in the pattern and translate that to a discrete step in the prop position arrays */
		var t = (((new Date()).getTime() - startTime)/1000)*animationSpeed % (s.states.length*config.beatDuration);
		var step = Math.floor(t/(s.states.length*config.beatDuration)*1000);

		/* update prop mesh positions */
		for (var i = 0; i < propMeshes.length; i++) {
			propMeshes[i].position.x = s.propPositions[i][step].x;
			propMeshes[i].position.y = s.propPositions[i][step].y;
			propMeshes[i].position.z = s.propPositions[i][step].z;
		}

		/* update juggler hand positions */
		for (var i = 0; i < jugglerHandVertices.length; i++) {
			jugglerHandVertices[i][LEFT].x = s.jugglerHandPositions[i][LEFT][step].x;
			jugglerHandVertices[i][LEFT].y = s.jugglerHandPositions[i][LEFT][step].y;
			jugglerHandVertices[i][LEFT].z = s.jugglerHandPositions[i][LEFT][step].z;
			jugglerHandVertices[i][RIGHT].x = s.jugglerHandPositions[i][RIGHT][step].x;
			jugglerHandVertices[i][RIGHT].y = s.jugglerHandPositions[i][RIGHT][step].y;
			jugglerHandVertices[i][RIGHT].z = s.jugglerHandPositions[i][RIGHT][step].z;
		}

		updateCamera();

		/* mark geometry vertices as needs update */
		for (var i = 0; i < jugglerMeshes.length; i++) {
			for (var j = 0; j < jugglerMeshes[i].children.length; j++) {
				jugglerMeshes[i].children[j].geometry.verticesNeedUpdate = true;
			} 
		}

		try {
			renderer.render(scene, camera);
		} catch(e) {
			console.log('Error rendering');
		}

		if (!paused) {
			requestAnimationFrame(function() { animate(); });
		}

	}

}