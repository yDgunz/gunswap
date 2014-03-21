/* -------------- */
/* ANIMATION VARS */
/* -------------- */

var paused = false,
	renderMode = '3D',
	camera, 
	scene, 
	renderer,
	/* camera starting point */
	camTheta = 3.6, 
	camPhi = .4, 
	camRadius = 5,
	/* helpers for mouse interaction */
	isMouseDown = false, 
	onMouseDownTheta, 
	onMouseDownPhi, 
	onMouseDownPosition,
	cameraMode = 'sky',
	propMeshes = [],
	jugglerMeshes = [];

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
		camera.position.x = 0;
		camera.position.y = 1.3;
		camera.position.z = -.5;
		camera.lookAt(new THREE.Vector3(0,3,1));
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

if (renderMode == '3D') {

	/* build the 3D scene */

	camera = new THREE.PerspectiveCamera( 75, width / height, 1, 10000 );
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

} else {
	/* 2D rendering mode */

	$container.empty();
	$container.append('<canvas id="canvas" width=' + width + ' height=' + height + '></canvas>');

}

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
			propRadius: $('#propRadius').val()
		};

	/* try to init the siteswap. if failure occurs, display accordingly */
	try {

		s.init(config);
		$('#error').hide();
	
		/* clear out all meshes from scene */
		while (propMeshes.length > 0) {
			var tmp = propMeshes[0];		
			scene.remove(tmp);
			propMeshes.splice(0,1);
		}
		while (jugglerMeshes.length > 0) {
			var tmp = jugglerMeshes[0];
			scene.remove(tmp);
			jugglerMeshes.splice(0,1);
		}

		/* create each prop and add to empty propMeshes array */
		for (var i = 0; i < s.numProps; i++) {

			var mesh = new THREE.Mesh( new THREE.SphereGeometry( config.propRadius, 20 ), 
			new THREE.MeshPhongMaterial( { color: 'red' } ) );
			mesh.castShadow = true;

			scene.add( mesh );
			propMeshes.push( mesh );
		}
		/* create each juggler and add to empty jugglerMeshes array */
		for (var i = 0; i < s.numJugglers; i++) {
			
			/* create juggler mesh at 0,0,0 */

			var jugglerLegsG = new THREE.Geometry();
			jugglerLegsG.vertices.push(new THREE.Vector3(-.125,0,0));
			jugglerLegsG.vertices.push(new THREE.Vector3(0,.8,0));
			jugglerLegsG.vertices.push(new THREE.Vector3(.125,0,0));
			var jugglerLegs = new THREE.Line(jugglerLegsG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));

			var jugglerTorsoG = new THREE.Geometry();
			jugglerTorsoG.vertices.push(new THREE.Vector3(0,.8,0));
			jugglerTorsoG.vertices.push(new THREE.Vector3(0,1.5,0));
			var jugglerTorso = new THREE.Line(jugglerTorsoG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));

			var jugglerShouldersG = new THREE.Geometry();
			jugglerShouldersG.vertices.push(new THREE.Vector3(-.225,1.425,0));
			jugglerShouldersG.vertices.push(new THREE.Vector3(.225,1.425,0));
			var jugglerShoulders = new THREE.Line(jugglerShouldersG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));	

			var jugglerLeftArmG = new THREE.Geometry();
			jugglerLeftArmG.vertices.push(new THREE.Vector3(-.225,1.425,0));
			jugglerLeftArmG.vertices.push(new THREE.Vector3(-.225,1.0125,0));
			jugglerLeftArmG.vertices.push(new THREE.Vector3(-.225,1.0125,-.4125));
			var jugglerLeftArm = new THREE.Line(jugglerLeftArmG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));	

			var jugglerRightArmG = new THREE.Geometry();
			jugglerRightArmG.vertices.push(new THREE.Vector3(.225,1.425,0));
			jugglerRightArmG.vertices.push(new THREE.Vector3(.225,1.0125,0));
			jugglerRightArmG.vertices.push(new THREE.Vector3(.225,1.0125,-.4125));
			var jugglerRightArm = new THREE.Line(jugglerRightArmG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));	
			jugglerRightArmG.dynamic = true;
			jugglerRightArmG.verticesNeedUpdate = true;

			var jugglerHead = new THREE.Mesh( new THREE.SphereGeometry( .1125, 20 ), new THREE.MeshPhongMaterial( { color: 'blank' } ) );
			jugglerHead.position = new THREE.Vector3(0,1.6125,0);

			var jugglerMesh = new THREE.Object3D();
			jugglerMesh.add( jugglerLegs );
			jugglerMesh.add( jugglerTorso );
			jugglerMesh.add( jugglerShoulders );
			jugglerMesh.add( jugglerLeftArm );
			jugglerMesh.add( jugglerRightArm );
			jugglerMesh.add( jugglerHead );

			/* move and rotate accordingly */
			jugglerMesh.position.x = s.jugglers[i].position.x;
			jugglerMesh.position.z = s.jugglers[i].position.z;
			jugglerMesh.rotation.y = s.jugglers[i].rotation;

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
		var t = (((new Date()).getTime() - startTime)/1000) % (s.states.length*config.beatDuration);
		var step = Math.floor(t/(s.states.length*config.beatDuration)*1000);

		/* update prop mesh positions */
		for (var i = 0; i < propMeshes.length; i++) {
			propMeshes[i].position.x = s.propPositions[i][step].x;
			propMeshes[i].position.y = s.propPositions[i][step].y;
			propMeshes[i].position.z = s.propPositions[i][step].z;
		}

		updateCamera();

		jugglerRightArmG.verticesNeedUpdate = true;

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