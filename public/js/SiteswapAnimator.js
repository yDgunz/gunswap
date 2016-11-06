(function(exports){

function SiteswapAnimator(containerId, options) {
	
	var 
		container,
		width,
		height,
		camera, 
		scene, 
		renderer,
		/* camera starting point */
		camTheta = Math.PI, 
		camPhi = .7, 
		camRadius = 5,
		/* helpers for mouse interaction */
		isMouseDown = false, 
		onMouseDownTheta, 
		onMouseDownPhi, 
		onMouseDownPosition,
		cameraMode = {mode: 'sky'},
		propMeshes = [],
		jugglerMeshes = [],
		surfaceMeshes = [],
		propPathLines = [],
		jugglerElbowMeshes = [],
		jugglerHandVertices,
		jugglerTorso,
		highestPoint,
		startTime,
		siteswap,
		renderMode = '3D',
		context,
		randomColors = ['red','blue','green','black','yellow','purple'],
		drawHands = false;

	this.displayPropPaths = options.displayPropPaths === true ? true : false;

	container = $('#' + containerId);

	width = container.width();
	height = container.height();

	if (renderMode == '2D') {

		container.append('<canvas id="siteswapAnimatorCanvas"></canvas>');
		canvas = container.find('canvas')[0];
		canvas.height = height;
		canvas.width = width;
		context = canvas.getContext('2d');

		context.clearRect(0,0,width,height);

	} else if (renderMode == '3D') {
		
		camera = new THREE.PerspectiveCamera( 90, width / height, .05, 100 );
		updateCamera();

		scene = new THREE.Scene();		
		
		/* create the renderer and add it to the canvas container */
		/* if browser is mobile, render using canvas */
		if( !window.WebGLRenderingContext ) {
			renderer = new THREE.CanvasRenderer();	
		} else {
			renderer = new THREE.WebGLRenderer( {antialias: true, preserveDrawingBuffer: true} );
		}
		
		renderer.setSize( width, height );

		container.empty();
		container.append(renderer.domElement);

		//add the event listeners for mouse interaction
		renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
		renderer.domElement.addEventListener( 'touchmove', onDocumentTouchMove, false );
		renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
		renderer.domElement.addEventListener( 'touchstart', onDocumentTouchStart, false );
		renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
		renderer.domElement.addEventListener( 'touchend', onDocumentMouseUp, false );
		renderer.domElement.addEventListener( 'mousewheel', onDocumentMouseWheel, false );

		onMouseDownPosition = new THREE.Vector2();

		renderer.setClearColor( 0xffffff, 1);

		renderer.render(scene,camera);

		this.renderer = renderer; // expose renderer		
		this.oneCycleComplete = false;
		this.paused = false;
		this.animationSpeed = .6;

	}

	this.resize = function(w,h) {
		width = w;
		height = h;
		camera = new THREE.PerspectiveCamera( 75, width / height, .05, 100 );
		updateCamera();
		renderer.setSize(width, height);
	}

	this.init = function(s,options) {

		this.paused = false;
		startTime = 0;
		siteswap = s;

		if (siteswap.errorMessage) {
			
			$('#errorMessage').html("ERROR: " + siteswap.errorMessage);
			$('#errorMessage').show();

		} else {

			/* find highest point in the pattern */
			highestPoint = 0;
			for (var i = 0; i < siteswap.propPositions.length; i++) {
				for (var j = 0; j < siteswap.propPositions[i].length; j++) {
					if (siteswap.propPositions[i][j].y > highestPoint) {
						highestPoint = siteswap.propPositions[i][j].y;
					}
				}
			}
			camRadius = highestPoint+.5;

			if (siteswap.pass) {

				/* show warnings for doing passing/bouncing with rings/clubs */
				for (var i = 0; i < siteswap.props.length; i++) {
					if (siteswap.props[i].type == 'club' || siteswap.props[i].type == 'club') {
						$('#errorMessage').html("WARNING: Passing patterns with clubs/rings may look weird. Still working out kinks with prop orientation.");
						$('#errorMessage').show();
						break;
					}
				}

				// for passing siteswaps we want to rotate the default camera a bit
				camTheta += Math.PI/3;
				camRadius += 1;

			}

			/* clear out all meshes from scene */
			for( var i = scene.children.length - 1; i >= 0; i--) { scene.remove(scene.children[i]); }

			var light = new THREE.HemisphereLight( 0xffffff, 0x080820, 1 );
			scene.add( light );

			var pointLight = new THREE.PointLight( 0x888888, 1, 100 );
			pointLight.position.set( 0, 0, -2 );
			scene.add( pointLight );

			scene.background = new THREE.Color(options.backgroundColor);

			propMeshes = [];
			jugglerMeshes = [];
			jugglerHandVertices = [];
			jugglerElbowMeshes = [];
			propPathLines = [];

			drawHands = options.drawHands ? options.drawHands : 0;

			drawSurfaces();

			drawJugglers();

			/* create each prop and add to empty propMeshes array */
			for (var i = 0; i < siteswap.numProps; i++) {

				var geometry;

				if (siteswap.props[i].type == "ball") {
					geometry = new THREE.SphereGeometry( siteswap.props[i].radius, 20 );
				}
				else if (siteswap.props[i].type == "club") {
					geometry = new THREE.CylinderGeometry( .008, .02, .02, 7, 5 );
					geometry.vertices.map(function(v) { v.y += .01; });
					var clubHandle = new THREE.CylinderGeometry( .015, .008, .18, 7, 5 );
					clubHandle.vertices.map(function(v) { v.y += .11; });
					var clubBody1 = new THREE.CylinderGeometry( .04, .015, .18, 7, 5 );
					clubBody1.vertices.map(function(v) { v.y += .29});
					var clubBody2 = new THREE.CylinderGeometry( .02, .04, .11, 7, 5 );
					clubBody2.vertices.map(function(v) { v.y += .43});
					THREE.GeometryUtils.merge(geometry,clubHandle);
					THREE.GeometryUtils.merge(geometry,clubBody1);
					THREE.GeometryUtils.merge(geometry,clubBody2);
					// move entire club down to correct center of gravity
					geometry.vertices.map(function(v) { v.y -= .2});

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
						material = new THREE.MeshLambertMaterial( { color: propColor } );
						//material = new THREE.MeshBasicMaterial( { color: propColor, wireframe: true } );
					} else {
						material = new THREE.MeshLambertMaterial( { color: propColor, transparent: true, opacity: 1-1/(numTails+1)*j } );
					}
					var mesh = new THREE.Mesh( geometry, material );			

					scene.add( mesh );

					tmpPropMeshes.push(mesh); 

				}

				propMeshes.push( tmpPropMeshes );
				
			}

			if (this.displayPropPaths) {
				buildPropPaths();			
			}

		}

	}

	this.animate = function() {		

		if (startTime === 0) {
			startTime = (new Date()).getTime();
		}

		/* find time in the pattern and translate that to a discrete step in the prop position arrays */
		var timeElapsed = ((new Date()).getTime() - startTime)*this.animationSpeed;
		if (timeElapsed > (siteswap.states.length*siteswap.beatDuration*1000)) {
			this.oneCycleComplete = true;
		}
		var t = timeElapsed % (siteswap.states.length*siteswap.beatDuration*1000); // need to *1000 b/c timeElapsed is in ms
		
		this.render(t);

		if (!this.paused) {
			var self = this;
			requestAnimationFrame(function() { self.animate(); });
		}

	}

	this.render = function(t) {

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

				/* apply current rotation */				
				propMeshes[i][j].quaternion.set(1,0,0,0);
				
				// rotate rings so they are in correct position by default
				if (siteswap.props[i].type == 'ring') {
					var rotateRing = new THREE.Quaternion();
					rotateRing.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
					propMeshes[i][j].quaternion.multiply(rotateRing);
				}

				var q = siteswap.propRotations[i][stepIx];
				propMeshes[i][j].quaternion.multiplyQuaternions(q, propMeshes[i][j].quaternion);

			}
		}

		/* update juggler hand positions */
		updateHandAndElbowPositions(step);

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

	}

	function drawSurfaces() {

		siteswap.surfaces.map(function(a) {
			var surface = {
				position: new THREE.Vector3(a.position.x,a.position.y,a.position.z),
				normal: new THREE.Vector3(a.normal.x,a.normal.y,a.normal.z),
				axis1: new THREE.Vector3(a.axis1.x,a.axis1.y,a.axis1.z),
				axis2: new THREE.Vector3(a.axis2.x,a.axis2.y,a.axis2.z),
				scale: a.scale
			}
			var surfaceGeom = new THREE.Geometry();
			surfaceGeom.vertices.push( (new THREE.Vector3()).copy(surface.position).add((new THREE.Vector3()).add(surface.axis1).add(surface.axis2)) );
			surfaceGeom.vertices.push( (new THREE.Vector3()).copy(surface.position).add((new THREE.Vector3()).add(surface.axis1).negate().add(surface.axis2)) );
			surfaceGeom.vertices.push( (new THREE.Vector3()).copy(surface.position).add((new THREE.Vector3()).add(surface.axis1).add(surface.axis2).negate()) );
			surfaceGeom.vertices.push( (new THREE.Vector3()).copy(surface.position).add((new THREE.Vector3()).add(surface.axis2).negate().add(surface.axis1)) );

			surfaceGeom.faces.push( new THREE.Face3( 0, 1, 2 ) );
			surfaceGeom.faces.push( new THREE.Face3( 2, 0, 3 ) );

			var surfaceMesh = new THREE.Mesh(surfaceGeom, new THREE.MeshBasicMaterial( { color: a.color ? a.color : "grey", side: THREE.DoubleSide } ));
			surfaceMeshes.push(surfaceMesh);
			scene.add(surfaceMesh);
		});
	}

	function toVector3(v) {
		return new THREE.Vector3(v.x,v.y,v.z);
	}

	function drawJugglers() {

		/* create each juggler and add to empty jugglerMeshes array */
		for (var i = 0; i < siteswap.numJugglers; i++) {

			function transformVector(x,y,z) {
				return new THREE.Vector3(
					siteswap.jugglers[i].position.x+(Math.cos(siteswap.jugglers[i].rotation)*x-Math.sin(siteswap.jugglers[i].rotation)*z),
					y,
					siteswap.jugglers[i].position.z+(Math.cos(siteswap.jugglers[i].rotation)*z+Math.sin(siteswap.jugglers[i].rotation)*x)
				);
			}

			jugglerHandVertices.push([[],[]]);
			jugglerElbowMeshes.push([]);
			
			/* create juggler mesh at 0,0,0 */
			var jugglerColor = siteswap.jugglers[i].color;

			var jugglerMesh = new THREE.Object3D();

			var jugglerTorsoG = new THREE.CylinderGeometry( .15, 0, .625, 20, 20 );
			jugglerTorso = new THREE.Mesh(jugglerTorsoG, new THREE.MeshLambertMaterial( { color: jugglerColor } ));
			jugglerTorso.position.set(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*0,1.11,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0);

			var shoulderElbowGeometry = new THREE.SphereGeometry( .03, 20, 20 );

			var jugglerLeftShoulder = new THREE.Mesh( shoulderElbowGeometry , new THREE.MeshLambertMaterial( { color: jugglerColor } ) );
			jugglerLeftShoulder.position.copy(transformVector(-.225,1.425,0));

			var jugglerRightShoulder = new THREE.Mesh( shoulderElbowGeometry , new THREE.MeshLambertMaterial( { color: jugglerColor } ) );
			jugglerRightShoulder.position.copy(transformVector(.225,1.425,0));

			var jugglerLeftElbow = new THREE.Mesh( shoulderElbowGeometry , new THREE.MeshLambertMaterial( { color: jugglerColor } ) );
			var jugglerRightElbow = new THREE.Mesh( shoulderElbowGeometry , new THREE.MeshLambertMaterial( { color: jugglerColor } ) );			

			for (var h = -1; h <= 1; h+=2) {
				
				var hix = (h == -1 ? 0 : 1);
				
				armG = new THREE.Geometry();
				armG.vertices.push(transformVector(h*.225,1.425,0));
				if (hix == 0) {
					jugglerLeftElbow.position.copy(transformVector(h*.225,1.0125,0));
					armG.vertices.push(jugglerLeftElbow.position);
				} else {
					jugglerRightElbow.position.copy(transformVector(h*.225,1.0125,0));
					armG.vertices.push(jugglerRightElbow.position);
				}
				
				jugglerHandVertices[i][hix].push(transformVector(h*.225,1.0125,-.4125));
				armG.vertices.push(jugglerHandVertices[i][hix][0]);
				armG.dynamic = true;
				var arm = new THREE.Line(armG, new THREE.LineBasicMaterial({color: 'black'}));

				jugglerMesh.add( arm );

				if (drawHands) {

					// hand, don't need to specify vertices now because they'll be set later
					var handG = new THREE.Geometry();
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					handG.vertices.push(jugglerHandVertices[i][hix][1]);
					handG.vertices.push(jugglerHandVertices[i][hix][2]);
					handG.vertices.push(jugglerHandVertices[i][hix][3]);
					handG.vertices.push(jugglerHandVertices[i][hix][4]);
					handG.faces.push( new THREE.Face3( 0, 1, 2 ) );
					handG.faces.push( new THREE.Face3( 2, 0, 3 ) );
					handG.dynamic = true;
					var handMesh = new THREE.Mesh(handG, new THREE.MeshLambertMaterial( { color: jugglerColor, side: THREE.DoubleSide }));

					jugglerMesh.add( handMesh );

					var fingerG = new THREE.Geometry();
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					fingerG.vertices.push(jugglerHandVertices[i][hix][5]);
					fingerG.vertices.push(jugglerHandVertices[i][hix][6]);
					fingerG.vertices.push(jugglerHandVertices[i][hix][7]);
					fingerG.dynamic = true;
					var finger = new THREE.Line(fingerG, new THREE.LineBasicMaterial({color: 'black'}));

					jugglerMesh.add( finger );

					fingerG = new THREE.Geometry();
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					fingerG.vertices.push(jugglerHandVertices[i][hix][8]);
					fingerG.vertices.push(jugglerHandVertices[i][hix][9]);
					fingerG.vertices.push(jugglerHandVertices[i][hix][10]);
					fingerG.dynamic = true;
					finger = new THREE.Line(fingerG, new THREE.LineBasicMaterial({color: 'black'}));

					jugglerMesh.add( finger );

					fingerG = new THREE.Geometry();
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					fingerG.vertices.push(jugglerHandVertices[i][hix][11]);
					fingerG.vertices.push(jugglerHandVertices[i][hix][12]);
					fingerG.vertices.push(jugglerHandVertices[i][hix][13]);
					fingerG.dynamic = true;
					finger = new THREE.Line(fingerG, new THREE.LineBasicMaterial({color: 'black'}));

					jugglerMesh.add( finger );

					fingerG = new THREE.Geometry();
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					jugglerHandVertices[i][hix].push(new THREE.Vector3());
					fingerG.vertices.push(jugglerHandVertices[i][hix][14]);
					fingerG.vertices.push(jugglerHandVertices[i][hix][15]);
					fingerG.vertices.push(jugglerHandVertices[i][hix][16]);
					fingerG.dynamic = true;
					finger = new THREE.Line(fingerG, new THREE.LineBasicMaterial({color: 'black'}));

					jugglerMesh.add( finger );

				}


			}

			var jugglerHead = new THREE.Mesh( new THREE.SphereGeometry( .1125, 20, 20 ), new THREE.MeshLambertMaterial( { color: jugglerColor } ) );
			jugglerHead.position.set(siteswap.jugglers[i].position.x+Math.cos(siteswap.jugglers[i].rotation)*0,1.6125,siteswap.jugglers[i].position.z+Math.sin(siteswap.jugglers[i].rotation)*0);
			
			jugglerMesh.add( jugglerTorso );
			jugglerMesh.add( jugglerLeftShoulder );
			jugglerMesh.add( jugglerRightShoulder );
			jugglerMesh.add( jugglerLeftElbow );
			jugglerMesh.add( jugglerRightElbow );
			jugglerMesh.add( jugglerHead );

			scene.add(jugglerMesh);
			jugglerMeshes.push(jugglerMesh);
			jugglerElbowMeshes[i].push(jugglerLeftElbow);
			jugglerElbowMeshes[i].push(jugglerRightElbow);

		}
	}

	function buildPropPaths() {

		for (var i = 0; i < siteswap.propPositions.length; i++) {
			var propPathGeom = new THREE.Geometry();
			for (var j = 0; j < siteswap.propPositions[i].length; j++) {
				var propPosition = siteswap.propPositions[i][j];
				var eps = .001;
				propPathGeom.vertices.push(new THREE.Vector3(propPosition.x+(Math.random()-.5)*eps,propPosition.y+(Math.random()-.5)*eps,propPosition.z+(Math.random()-.5)*eps));
			}
			var propPathLine = new THREE.Line(propPathGeom, new THREE.LineBasicMaterial({color: siteswap.props[i].color}));
			propPathLines.push(propPathLine);
			scene.add(propPathLine);
		}

	}

	this.hidePropPaths = function() {
		propPathLines.map(function(a) { a.visible = false; });
	}

	this.showPropPaths = function() {
		if (propPathLines.length == 0) {
			buildPropPaths();
		} else {
			propPathLines.map(function(a) { a.visible = true; });
		}		
	}

	function updateHandAndElbowPositions(step) {
				
		for (var i = 0; i < jugglerHandVertices.length; i++) {
			for (var j = 0; j < 2; j++) {
				
				if (drawHands) {
					var handSize = .03;
					var zOffset = .03;
					var handVerticesDiff = [
						new THREE.Vector3(0,0,handSize+zOffset),
						new THREE.Vector3(-handSize,0,-handSize+zOffset),
						new THREE.Vector3(handSize,0,-handSize+zOffset),
						new THREE.Vector3(handSize,0,handSize+zOffset),
						new THREE.Vector3(-handSize,0,handSize+zOffset),
						new THREE.Vector3(0,0,-handSize+zOffset),
						new THREE.Vector3(0,.01,-2*handSize+zOffset),
						new THREE.Vector3(0,.05,-3*handSize+zOffset),
						new THREE.Vector3(handSize,0,-handSize+zOffset),
						new THREE.Vector3(handSize,.01,-2*handSize+zOffset),
						new THREE.Vector3(handSize,.05,-3*handSize+zOffset),
						new THREE.Vector3(-handSize,0,-handSize+zOffset),
						new THREE.Vector3(-handSize,.01,-2*handSize+zOffset),
						new THREE.Vector3(-handSize,.05,-3*handSize+zOffset),
						// thumbs
						new THREE.Vector3((j == 0 ? -1 : 1)*handSize,0,handSize+zOffset),
						new THREE.Vector3((j == 0 ? -1 : 1)*2*handSize,0,handSize+zOffset-.02),
						new THREE.Vector3((j == 0 ? -1 : 1)*2*handSize,.02,handSize+zOffset-.04)
					];
					var angle = siteswap.jugglerHandPositions[i][j][step].angle;
					var propRadius = siteswap.props[0].radius;
					var jugglerWristPosition = toVector3(siteswap.jugglerHandPositions[i][j][step]).add(new THREE.Vector3(propRadius*Math.sin(angle),-propRadius*Math.cos(angle),0));
					
					var handAngle = -Math.atan2(siteswap.jugglerElbowPositions[i][j][step].x-siteswap.jugglerHandPositions[i][j][step].x,siteswap.jugglerElbowPositions[i][j][step].z-siteswap.jugglerHandPositions[i][j][step].z);

					for (var k = 0; k < handVerticesDiff.length; k++) {
						var newX = handVerticesDiff[k].x*Math.cos(angle) - handVerticesDiff[k].y*Math.sin(angle);
						var newY = handVerticesDiff[k].y*Math.cos(angle) + handVerticesDiff[k].x*Math.sin(angle);
						newX = newX*Math.cos(handAngle) - handVerticesDiff[k].z*Math.sin(handAngle);
						var newZ = handVerticesDiff[k].z*Math.cos(handAngle) + newX*Math.sin(handAngle);
						// rotate w/ juggler cos - sin, cos + sin
						handVerticesDiff[k].x = newX*Math.cos(siteswap.jugglers[i].rotation) - newZ*Math.sin(siteswap.jugglers[i].rotation); 
						handVerticesDiff[k].y = newY;
						handVerticesDiff[k].z = newZ*Math.cos(siteswap.jugglers[i].rotation) + newX*Math.sin(siteswap.jugglers[i].rotation);						
						jugglerHandVertices[i][j][k].copy((new THREE.Vector3()).copy(jugglerWristPosition).add(handVerticesDiff[k]));
					}
				} else {
					jugglerHandVertices[i][j][0].copy(toVector3(siteswap.jugglerHandPositions[i][j][step])); 
				}

			}

			jugglerElbowMeshes[i][0].position.set(siteswap.jugglerElbowPositions[i][0][step].x, siteswap.jugglerElbowPositions[i][0][step].y, siteswap.jugglerElbowPositions[i][0][step].z);
			jugglerElbowMeshes[i][1].position.set(siteswap.jugglerElbowPositions[i][1][step].x, siteswap.jugglerElbowPositions[i][1][step].y, siteswap.jugglerElbowPositions[i][1][step].z);

		}
	}

	function updateCamera() {
		if (cameraMode.mode == 'sky') {
			if (jugglerTorso) jugglerTorso.visible = true;
			camera.position.x = camRadius * Math.sin( camTheta ) * Math.cos( camPhi );
			camera.position.y = camRadius * Math.sin( camPhi );
			camera.position.z = camRadius * Math.cos( camTheta ) * Math.cos( camPhi );
			var lookAt = new THREE.Vector3(0,0,0);
			if (siteswap !== undefined) {
				for (var i = 0; i < siteswap.jugglers.length; i++) {
					lookAt.x += siteswap.jugglers[i].position.x;
					lookAt.z += siteswap.jugglers[i].position.z;
				}
				lookAt.x /= siteswap.jugglers.length;
				lookAt.z /= siteswap.jugglers.length;
				lookAt.y = highestPoint/2;
			}			
			camera.lookAt(lookAt);
		} else if (cameraMode.mode == 'juggler') {
			if (jugglerTorso) jugglerTorso.visible = false; // hide juggler torso so it doesn't interfere with seeing the pattern
			/* need to update x and y to reflect the position of the juggler you are possessing */
			camera.position.x = 0;
			camera.position.y = 1.6125;
			camera.position.z = 0;
			camera.lookAt(new THREE.Vector3(Math.sin(camTheta)*Math.cos(camPhi),1.6125-Math.sin(camPhi),Math.cos(camTheta)*Math.cos(camPhi)));
		} else if (cameraMode.mode == 'custom') {
			if (jugglerTorso) jugglerTorso.visible = true;
			camera.position.set(cameraMode.x,cameraMode.y,cameraMode.z);
			camera.lookAt(new THREE.Vector3(camera.position.x-Math.sin(camTheta)*Math.cos(camPhi),camera.position.y-Math.sin(camPhi),camera.position.z-Math.cos(camTheta)*Math.cos(camPhi)));
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

	function onDocumentTouchStart( event ) {
		isMouseDown = true;
		onMouseDownTheta = camTheta;
		onMouseDownPhi = camPhi;
		onMouseDownPosition.x = event.changedTouches[0].clientX;
		onMouseDownPosition.y = event.changedTouches[0].clientY;
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

	function onDocumentTouchMove( event ) {
		event.preventDefault();
		if ( isMouseDown ) {
			camTheta = - ( ( event.changedTouches[0].clientX - onMouseDownPosition.x ) * 0.01 ) + onMouseDownTheta;
			
			var dy = event.changedTouches[0].clientY - onMouseDownPosition.y;
			
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

	function onDocumentMouseWheel( event ) { camRadius -= event.wheelDeltaY*.002; }

	this.updateAnimationSpeed = function(speed) {
		this.animationSpeed = speed;
	}

	this.updateCameraMode = function(mode) {
		cameraMode = mode;
	}

}

exports.SiteswapAnimator = SiteswapAnimator;

})(typeof exports === 'undefined'? this['SiteswapAnimator']={}: exports);