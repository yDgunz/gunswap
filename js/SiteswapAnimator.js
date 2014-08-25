var 
	$container,
	width,
	height,
	paused = false,
	camera, 
	scene, 
	renderer,
	/* camera starting point */
	camTheta = Math.PI+.8, 
	camPhi = .7, 
	camRadius = 5,
	/* helpers for mouse interaction */
	isMouseDown = false, 
	onMouseDownTheta, 
	onMouseDownPhi, 
	onMouseDownPosition,
	cameraMode = 'sky',
	propType,
	propMeshes = [],
	jugglerMeshes = [],
	jugglerHandVertices,
	animationSpeed = 1,
	startTime,
	siteswap,
	renderMode = '3D',
	context;

init();

/* function to play a new siteswap */
function go() {

	$('#errorMessage').empty();
	$('#errorMessage').hide();

	var inputs = readInputs();

	/* create dwell path based on inputs */
	var dwellPath;
	if (inputs.dwellPathType == 'cascade') {
		dwellPath = 
			[
				/* left */
				{
					radius: .15,
					catchRotation: Math.PI,
					tossRotation: 2*Math.PI
				},
				/* right */
				{
					radius: .15,
					catchRotation: 2*Math.PI,
					tossRotation: Math.PI
				}
			];
	} else if (inputs.dwellPathType == 'reverse cascade') {
		dwellPath = 
			[
				/* left */
				{
					radius: .15,
					catchRotation: 2*Math.PI,
					tossRotation: Math.PI
				},
				/* right */
				{
					radius: .15,
					catchRotation: Math.PI,
					tossRotation: 2*Math.PI
				}
			];
	} else if (inputs.dwellPathType == 'shower') {
		dwellPath = 
			[
				/* left */
				{
					radius: .15,
					catchRotation: Math.PI,
					tossRotation: 2*Math.PI
				},
				/* right */
				{
					radius: .15,
					catchRotation: Math.PI,
					tossRotation: 2*Math.PI
				}
			];
	}

	siteswap = SiteswapJS.CreateSiteswap(inputs.siteswap, 
		{
			beatDuration: 	inputs.beatDuration,
			dwellDuration: 	inputs.dwellDuration,
			propRadius: 	inputs.propRadius,
			dwellPath: 		dwellPath
		});

	if (siteswap.errorMessage) {
		
		$('#errorMessage').html("ERROR: " + siteswap.errorMessage);
		$('#errorMessage').show();

	} else {

		propType = inputs.propType;

		/* show warnings for doing passing/bouncing with rings/clubs */
		if (propType == 'club' && siteswap.passing) {
			$('#errorMessage').html("WARNING: Passing patterns with clubs may look weird. Still working out kinks with club orientation.");
			$('#errorMessage').show();
		}

		if (propType == 'ring' && siteswap.passing) {
			$('#errorMessage').html("WARNING: Passing patterns with rings may look weird. Still working out kinks with ring orientation.");
			$('#errorMessage').show();
		}

		/* clear out all meshes from scene */
		propMeshes.map(function(a) { scene.remove(a); });
		propMeshes = [];
		jugglerMeshes.map(function(a) { scene.remove(a); });
		jugglerMeshes = [];
		jugglerHandVertices = [];

		drawJugglers();

		/* create each prop and add to empty propMeshes array */
		for (var i = 0; i < siteswap.numProps; i++) {

			if (propType == "ball") {
				var mesh = new THREE.Mesh( new THREE.SphereGeometry( siteswap.propRadius, 20 ), new THREE.MeshPhongMaterial( { color: 'red' } ) );
				mesh.castShadow = true;
			}
			else if (propType == "club") {
				var clubKnob = new THREE.CylinderGeometry( .008, .02, .02, 5, 4 );
				clubKnob.vertices.map(function(v) { v.y += .01; });
				var clubHandle = new THREE.CylinderGeometry( .015, .008, .18, 5, 4 );
				clubHandle.vertices.map(function(v) { v.y += .11; });
				var clubBody1 = new THREE.CylinderGeometry( .04, .015, .18, 5, 4 );
				clubBody1.vertices.map(function(v) { v.y += .29});
				var clubBody2 = new THREE.CylinderGeometry( .02, .04, .11, 5, 4 );
				clubBody2.vertices.map(function(v) { v.y += .43});
				THREE.GeometryUtils.merge(clubKnob,clubHandle);
				THREE.GeometryUtils.merge(clubKnob,clubBody1);
				THREE.GeometryUtils.merge(clubKnob,clubBody2);
				// move entire club down so center of gravity is at fattest point
				clubKnob.vertices.map(function(v) { v.y -= .38});
				var material = new THREE.MeshLambertMaterial( {color: 'red'} );
				var mesh = new THREE.Mesh(clubKnob,material);
				//rotate to correct starting orientation
				mesh.rotation.x = Math.PI/2;
			}
			else if (propType == "ring") {
				// ring meshes
				var points = [];
				points.push( new THREE.Vector3( .14, 0, .01 ) );
				points.push( new THREE.Vector3( .18, 0, .01 ) );
				points.push( new THREE.Vector3( .18, 0, -.01 ) );
				points.push( new THREE.Vector3( .14, 0, -.01 ) );
				points.push( new THREE.Vector3( .14, 0, .01 ) );
				var ringGeometry = new THREE.LatheGeometry( points );
				var ringMaterial = new THREE.MeshLambertMaterial( { color: 'red' } );
				var mesh = new THREE.Mesh( ringGeometry, ringMaterial );				
			}

			scene.add( mesh );
			propMeshes.push( mesh );
			
		}

		paused = false;
		startTime = 0;
		animate();

	}

}

function animate() {
	
	if (startTime == 0) {
		startTime = (new Date()).getTime();
	}

	/* find time in the pattern and translate that to a discrete step in the prop position arrays */
	var t = (((new Date()).getTime() - startTime)/1000)*animationSpeed % (siteswap.states.length*siteswap.beatDuration);
	var step = Math.floor(t/(siteswap.states.length*siteswap.beatDuration)*1000);

	/* update prop mesh positions and rotations */
	for (var i = 0; i < propMeshes.length; i++) {
		propMeshes[i].position.x = siteswap.propPositions[i][step].x;
		propMeshes[i].position.y = siteswap.propPositions[i][step].y;
		propMeshes[i].position.z = siteswap.propPositions[i][step].z;

		/* reset rotation */
		propMeshes[i].quaternion.set(1,0,0,0);

		/* set to toss orientation */
		var q = new THREE.Quaternion();
		if (siteswap.propRotations[i][step].tossOrientation == 'X') {
			if (propType == 'club')
				q.setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI/2);
		} else if (siteswap.propRotations[i][step].tossOrientation == '-X') {
			if (propType == 'club')
				q.setFromAxisAngle(new THREE.Vector3(0,0,-1), Math.PI/2);
		} else if (siteswap.propRotations[i][step].tossOrientation == 'Y') {
			if (propType == 'club')
				q.setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI);
			else if (propType == 'ring')
				q.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
		} else if (siteswap.propRotations[i][step].tossOrientation == '-Y') {
			if (propType == 'ring')
				q.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
		} else if (siteswap.propRotations[i][step].tossOrientation == 'Z') {
			if (propType == 'club')
				q.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
			else if (propType == 'ring')
				q.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
		} else if (siteswap.propRotations[i][step].tossOrientation == '-Z') {
			if (propType == 'club')
				q.setFromAxisAngle(new THREE.Vector3(-1,0,0), Math.PI/2);
			else if (propType == 'ring')
				q.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
		} else { // defaults
			if (propType == 'club')
				q.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
			else if (propType == 'ring')
				q.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
		}
		propMeshes[i].quaternion.multiplyQuaternions(q, propMeshes[i].quaternion);

		/* rotate along spin axis */
		q = new THREE.Quaternion();
		if (siteswap.propRotations[i][step].spinOrientation == 'X' || siteswap.propRotations[i][step].spinOrientation == undefined) {
			q.setFromAxisAngle(new THREE.Vector3(1,0,0), siteswap.propRotations[i][step].rotation);
		} else if (siteswap.propRotations[i][step].spinOrientation == '-X') {
			q.setFromAxisAngle(new THREE.Vector3(-1,0,0), siteswap.propRotations[i][step].rotation);
		} else if (siteswap.propRotations[i][step].spinOrientation == 'Y') {
			q.setFromAxisAngle(new THREE.Vector3(0,1,0), siteswap.propRotations[i][step].rotation);
		} else if (siteswap.propRotations[i][step].spinOrientation == '-Y') {
			q.setFromAxisAngle(new THREE.Vector3(0,-1,0), siteswap.propRotations[i][step].rotation);
		} else if (siteswap.propRotations[i][step].spinOrientation == 'Z') {
			q.setFromAxisAngle(new THREE.Vector3(0,0,1), siteswap.propRotations[i][step].rotation);
		} else if (siteswap.propRotations[i][step].spinOrientation == '-Z') {
			q.setFromAxisAngle(new THREE.Vector3(0,0,-1), siteswap.propRotations[i][step].rotation);
		}
		propMeshes[i].quaternion.multiplyQuaternions(q, propMeshes[i].quaternion);

	}

	/* update juggler hand positions */
	for (var i = 0; i < jugglerHandVertices.length; i++) {
		jugglerHandVertices[i][0].x = siteswap.jugglerHandPositions[i][0][step].x;
		jugglerHandVertices[i][0].y = siteswap.jugglerHandPositions[i][0][step].y;
		jugglerHandVertices[i][0].z = siteswap.jugglerHandPositions[i][0][step].z;
		jugglerHandVertices[i][1].x = siteswap.jugglerHandPositions[i][1][step].x;
		jugglerHandVertices[i][1].y = siteswap.jugglerHandPositions[i][1][step].y;
		jugglerHandVertices[i][1].z = siteswap.jugglerHandPositions[i][1][step].z;
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

function init() {
	
	/* find container for animator */
	$container = $('#siteswapAnimator');

	width = $container.width()-10;
	height = $(window).height()-10;

	if (renderMode == '2D') {

		$container.append('<canvas id="siteswapAnimatorCanvas"></canvas>');
		canvas = $container.find('canvas')[0];
		canvas.height = height;
		canvas.width = width;
		context = canvas.getContext('2d');

		context.clearRect(0,0,width,height);

	} else if (renderMode == '3D') {
		camera = new THREE.PerspectiveCamera( 75, width / height, .05, 100 );
		updateCamera();

		scene = new THREE.Scene();

		/* lights */
		var pointLight = new THREE.PointLight( 0xffffff );
		pointLight.position.set(0,4,0);
		scene.add( pointLight );

		/* draw floor */
		var floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture('images/grass.jpg') } ));
		floor.rotation.x += 3*Math.PI/2
		scene.add(floor);

		/* create the renderer and add it to the canvas container */
		/* if browser is mobile, render using canvas */
		if( !window.WebGLRenderingContext ) {
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

		renderer.setClearColor( 0xffffff, 1);

		renderer.render(scene,camera);
	}

}

function zoomIn() { camRadius-=.1; }

function zoomOut() { camRadius+=.1; }

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

function onDocumentMouseWheel( event ) { camRadius -= event.wheelDeltaY*.01; }

function updateAnimationSpeed() {
	animationSpeed = parseFloat($('#animationSpeed').val())/100;
}

function updateCameraMode() {
	cameraMode = $('#cameraMode').val();
}

function drawJugglers() {
	/* create each juggler and add to empty jugglerMeshes array */
	for (var i = 0; i < siteswap.numJugglers; i++) {

		jugglerHandVertices.push([[],[]]);
		
		/* create juggler mesh at 0,0,0 */

		var jugglerLegsG = new THREE.Geometry();
		jugglerLegsG.vertices.push(new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*-.125,0,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0));
		jugglerLegsG.vertices.push(new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*0,.8,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0));
		jugglerLegsG.vertices.push(new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*.125,0,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0));
		var jugglerLegs = new THREE.Line(jugglerLegsG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));

		var jugglerTorsoG = new THREE.Geometry();
		jugglerTorsoG.vertices.push(new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*0,.8,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0));
		jugglerTorsoG.vertices.push(new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*0,1.5,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0));
		var jugglerTorso = new THREE.Line(jugglerTorsoG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));

		var jugglerShouldersG = new THREE.Geometry();
		jugglerShouldersG.vertices.push(new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*-.225,1.425,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0));
		jugglerShouldersG.vertices.push(new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*.225,1.425,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0));
		var jugglerShoulders = new THREE.Line(jugglerShouldersG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));	

		var jugglerLeftArmG = new THREE.Geometry();
		jugglerLeftArmG.vertices.push(new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*-.225,1.425,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0));
		jugglerLeftArmG.vertices.push(new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*-.225,1.0125,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0));
		jugglerHandVertices[i][0] = new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*-.225,1.0125,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*-.4125);
		jugglerLeftArmG.vertices.push(jugglerHandVertices[i][0]);
		jugglerLeftArmG.dynamic = true;
		var jugglerLeftArm = new THREE.Line(jugglerLeftArmG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));	

		var jugglerRightArmG = new THREE.Geometry();
		jugglerRightArmG.vertices.push(new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*.225,1.425,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0));
		jugglerRightArmG.vertices.push(new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*.225,1.0125,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0));
		jugglerHandVertices[i][1] = new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*.225,1.0125,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*-.4125);
		jugglerRightArmG.vertices.push(jugglerHandVertices[i][1]);
		jugglerRightArmG.dynamic = true;
		var jugglerRightArm = new THREE.Line(jugglerRightArmG, new THREE.LineBasicMaterial({linewidth: 3, color: 'black'}));				

		var jugglerHead = new THREE.Mesh( new THREE.SphereGeometry( .1125, 20 ), new THREE.MeshPhongMaterial( { color: 'black' } ) );
		jugglerHead.position = new THREE.Vector3(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*0,1.6125,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0);

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
}

function readInputs() {
	return {
			siteswap: $('#siteswap').val(),
			beatDuration: parseFloat($('#beatDuration').val()),
			dwellDuration: parseFloat($('#dwellDuration').val()),
			propType: $('#propType').val(),
			propRadius: .05,
			propC: .95,
			dwellPathType: $('#dwellPathType').val()
		};
}