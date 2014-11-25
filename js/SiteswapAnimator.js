
(function(exports){

function SiteswapAnimator(containerId) {
	
	var 
		container,
		width,
		height,
		paused = false,
		camera, 
		scene, 
		renderer,
		/* camera starting point */
		camTheta = Math.PI, 
		camPhi = .3, 
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
		animationSpeed = .75,
		startTime,
		siteswap,
		renderMode = '3D',
		context,
		randomColors = ['red','white','blue','green','black','yellow','purple'];

	container = $('#' + containerId);

	width = container.width()-25;
	height = $(window).height()-40;

	if (renderMode == '2D') {

		container.append('<canvas id="siteswapAnimatorCanvas"></canvas>');
		canvas = container.find('canvas')[0];
		canvas.height = height;
		canvas.width = width;
		context = canvas.getContext('2d');

		context.clearRect(0,0,width,height);

	} else if (renderMode == '3D') {
		camera = new THREE.PerspectiveCamera( 75, width / height, .05, 100 );
		updateCamera();

		scene = new THREE.Scene();

		/* lights */
		var ceilingLight = new THREE.PointLight( 0xffffff );
		ceilingLight.position.set(0,20,0);
		scene.add( ceilingLight );
		var floorLight = new THREE.PointLight( 0xffffff );
		floorLight.position.set(0,0,-2);
		scene.add( floorLight );

		/* draw floor */
		/*
		var floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture('images/grass.jpg') } ));
		floor.rotation.x += 3*Math.PI/2
		scene.add(floor);
		*/

		/* create the renderer and add it to the canvas container */
		/* if browser is mobile, render using canvas */
		if( !window.WebGLRenderingContext ) {
			renderer = new THREE.CanvasRenderer();	
		} else {
			renderer = new THREE.WebGLRenderer( {antialias: true} );
		}
		
		renderer.setSize( width, height );

		container.empty();
		container.append(renderer.domElement);

		//add the event listeners for mouse interaction
		renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
		renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
		renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
		renderer.domElement.addEventListener( 'mousewheel', onDocumentMouseWheel, false );

		onMouseDownPosition = new THREE.Vector2();

		renderer.setClearColor( 0xffffff, 1);

		renderer.render(scene,camera);
	}

	this.resize = function(w,h) {
		width = w;
		height = h;
		camera = new THREE.PerspectiveCamera( 75, width / height, .05, 100 );
		updateCamera();
		renderer.setSize(width, height);
	}

	this.go = function (s,options) {

		siteswap = s;

		if (siteswap.errorMessage) {
			
			$('#errorMessage').html("ERROR: " + siteswap.errorMessage);
			$('#errorMessage').show();

		} else {

			/* show warnings for doing passing/bouncing with rings/clubs */
			if (siteswap.pass) {
				for (var i = 0; i < siteswap.props.length; i++) {
					if (siteswap.props[i].type == 'club' || siteswap.props[i].type == 'club') {
						$('#errorMessage').html("WARNING: Passing patterns with clubs/rings may look weird. Still working out kinks with prop orientation.");
						$('#errorMessage').show();
						break;
					}
				}
			}

			/* find highest point in the pattern */
			var highestPoint = 0;
			for (var i = 0; i < siteswap.propPositions.length; i++) {
				for (var j = 0; j < siteswap.propPositions[i].length; j++) {
					if (siteswap.propPositions[i][j].y > highestPoint) {
						highestPoint = siteswap.propPositions[i][j].y;
					}
				}
			}
			camRadius = highestPoint+1;

			/* clear out all meshes from scene */
			for (var i = 0; i < propMeshes.length; i++) {
				for (var j = 0; j < propMeshes[i].length; j++) {
					scene.remove(propMeshes[i][j]);
				}
			}
			propMeshes = [];
			jugglerMeshes.map(function(a) { scene.remove(a); });
			jugglerMeshes = [];
			jugglerHandVertices = [];

			drawJugglers();

			/* create each prop and add to empty propMeshes array */
			for (var i = 0; i < siteswap.numProps; i++) {

				var geometry;

				if (siteswap.props[i].type == "ball") {
					geometry = new THREE.SphereGeometry( siteswap.props[i].radius, 20 );
				}
				else if (siteswap.props[i].type == "club") {
					geometry = new THREE.CylinderGeometry( .008, .02, .02, 5, 4 );
					geometry.vertices.map(function(v) { v.y += .01; });
					var clubHandle = new THREE.CylinderGeometry( .015, .008, .18, 5, 4 );
					clubHandle.vertices.map(function(v) { v.y += .11; });
					var clubBody1 = new THREE.CylinderGeometry( .04, .015, .18, 5, 4 );
					clubBody1.vertices.map(function(v) { v.y += .29});
					var clubBody2 = new THREE.CylinderGeometry( .02, .04, .11, 5, 4 );
					clubBody2.vertices.map(function(v) { v.y += .43});
					THREE.GeometryUtils.merge(geometry,clubHandle);
					THREE.GeometryUtils.merge(geometry,clubBody1);
					THREE.GeometryUtils.merge(geometry,clubBody2);
					// move entire club down so center of gravity is at fattest point
					geometry.vertices.map(function(v) { v.y -= .38});

				}
				else if (siteswap.props[i].type == "ring") {
					// ring meshes
					var points = [];
					points.push( new THREE.Vector3( .14, 0, .01 ) );
					points.push( new THREE.Vector3( .18, 0, .01 ) );
					points.push( new THREE.Vector3( .18, 0, -.01 ) );
					points.push( new THREE.Vector3( .14, 0, -.01 ) );
					points.push( new THREE.Vector3( .14, 0, .01 ) );
					geometry = new THREE.LatheGeometry( points );
				}

				if (options.motionBlur) {
					var numTails = 2;
				} else {
					var numTails = 0;
				}
				
				var tmpPropMeshes = [];
				
				var propColor = (siteswap.props[i].color == "random" ? randomColors[Math.floor(Math.random()*randomColors.length)] : siteswap.props[i].color);

				for (var j = 0; j <= numTails; j++) {

					var material;					

					if (j == 0) {
						//material = new THREE.MeshLambertMaterial( { color: propColor } );
						material = new THREE.MeshBasicMaterial( { color: propColor, wireframe: true } );
					} else {
						//material = new THREE.MeshLambertMaterial( { color: propColor, transparent: true, opacity: 1-1/(numTails+1)*j } );
					}
					var mesh = new THREE.Mesh( geometry, material );			

					if (siteswap.props[i].type == 'club') {
						//rotate to correct starting orientation
						mesh.rotation.x = Math.PI/2;
					}

					scene.add( mesh );

					tmpPropMeshes.push(mesh); 

				}

				propMeshes.push( tmpPropMeshes );
				
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
		var timeElapsed = ((new Date()).getTime() - startTime)*animationSpeed;
		var t = timeElapsed % (siteswap.states.length*siteswap.beatDuration*1000); // need to *1000 b/c timeElapsed is in ms
		var step = Math.floor(t/(siteswap.states.length*siteswap.beatDuration*1000)*siteswap.numSteps);

		/* update prop mesh positions and rotations */
		for (var i = 0; i < propMeshes.length; i++) {
			for (var j = 0; j < propMeshes[i].length; j++) {

				var stepIx = step-j*Math.floor(siteswap.numStepsPerBeat/8); // the 10 here is the tail length factor
				if (stepIx < 0) {
					stepIx += siteswap.numSteps; 
				}

				propMeshes[i][j].position.x = siteswap.propPositions[i][stepIx].x;
				propMeshes[i][j].position.y = siteswap.propPositions[i][stepIx].y;
				propMeshes[i][j].position.z = siteswap.propPositions[i][stepIx].z;

				/* reset rotation */
				propMeshes[i][j].quaternion.set(1,0,0,0);

				/* set to toss orientation */
				var q = new THREE.Quaternion();
				if (siteswap.propRotations[i][stepIx].tossOrientation == 'X') {
					if (siteswap.props[i].type == 'club')
						q.setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI/2);
				} else if (siteswap.propRotations[i][stepIx].tossOrientation == '-X') {
					if (siteswap.props[i].type == 'club')
						q.setFromAxisAngle(new THREE.Vector3(0,0,-1), Math.PI/2);
				} else if (siteswap.propRotations[i][stepIx].tossOrientation == 'Y') {
					if (siteswap.props[i].type == 'club')
						q.setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI);
					else if (siteswap.props[i].type == 'ring')
						q.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
				} else if (siteswap.propRotations[i][stepIx].tossOrientation == '-Y') {
					if (siteswap.props[i].type == 'ring')
						q.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
				} else if (siteswap.propRotations[i][stepIx].tossOrientation == 'Z') {
					if (siteswap.props[i].type == 'club')
						q.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
					else if (siteswap.props[i].type == 'ring')
						q.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
				} else if (siteswap.propRotations[i][stepIx].tossOrientation == '-Z') {
					if (siteswap.props[i].type == 'club')
						q.setFromAxisAngle(new THREE.Vector3(-1,0,0), Math.PI/2);
					else if (siteswap.props[i].type == 'ring')
						q.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
				} else { // defaults
					if (siteswap.props[i].type == 'club')
						q.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
					else if (siteswap.props[i].type == 'ring')
						q.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
				}
				propMeshes[i][j].quaternion.multiplyQuaternions(q, propMeshes[i][j].quaternion);

				/* rotate along spin axis */
				q = new THREE.Quaternion();
				if (siteswap.propRotations[i][stepIx].spinOrientation == 'X' || siteswap.propRotations[i][stepIx].spinOrientation == undefined) {
					q.setFromAxisAngle(new THREE.Vector3(1,0,0), siteswap.propRotations[i][stepIx].rotation);
				} else if (siteswap.propRotations[i][stepIx].spinOrientation == '-X') {
					q.setFromAxisAngle(new THREE.Vector3(-1,0,0), siteswap.propRotations[i][stepIx].rotation);
				} else if (siteswap.propRotations[i][stepIx].spinOrientation == 'Y') {
					q.setFromAxisAngle(new THREE.Vector3(0,1,0), siteswap.propRotations[i][stepIx].rotation);
				} else if (siteswap.propRotations[i][stepIx].spinOrientation == '-Y') {
					q.setFromAxisAngle(new THREE.Vector3(0,-1,0), siteswap.propRotations[i][stepIx].rotation);
				} else if (siteswap.propRotations[i][stepIx].spinOrientation == 'Z') {
					q.setFromAxisAngle(new THREE.Vector3(0,0,1), siteswap.propRotations[i][stepIx].rotation);
				} else if (siteswap.propRotations[i][stepIx].spinOrientation == '-Z') {
					q.setFromAxisAngle(new THREE.Vector3(0,0,-1), siteswap.propRotations[i][stepIx].rotation);
				}
				propMeshes[i][j].quaternion.multiplyQuaternions(q, propMeshes[i][j].quaternion);

			}
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

	this.zoomIn = function() { camRadius-=.1; }

	this.zoomOut = function() { camRadius+=.1; }

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
			
			var newCamPhi = ( ( dy ) * 0.01 ) + onMouseDownPhi;

			if (newCamPhi < Math.PI/2 && newCamPhi > -Math.PI/2) {
				camPhi = newCamPhi;
			}
		}

		updateCamera();
		renderer.render(scene, camera);
	}

	function onDocumentMouseUp( event ) {
		event.preventDefault();
		isMouseDown = false;
	}

	function onDocumentMouseWheel( event ) { camRadius -= event.wheelDeltaY*.01; }

	this.updateAnimationSpeed = function(speed) {
		animationSpeed = speed;
	}

	this.updateCameraMode = function(mode) {
		cameraMode = mode;
	}

}

exports.SiteswapAnimator = SiteswapAnimator;

})(typeof exports === 'undefined'? this['SiteswapAnimator']={}: exports);