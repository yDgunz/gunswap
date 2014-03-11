var paused = false;
var renderMode = '3D';
var camera, scene, renderer;
var meshes = [], floor;
var camTheta = 0, camPhi = .4, camRadius = 5; // camera starting point
var isMouseDown = false, onMouseDownTheta, onMouseDownPhi, onMouseDownPosition; // helpers for mouse interaction

//got the camera rotation code from: http://www.mrdoob.com/projects/voxels/#A/
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

	///update camera
	camera.position.x = camRadius * Math.sin( camTheta ) * Math.cos( camPhi );
	camera.position.y = camRadius * Math.sin( camPhi );
	camera.position.z = camRadius * Math.cos( camTheta ) * Math.cos( camPhi );

	camera.lookAt(new THREE.Vector3(0,1,0));	

	renderer.render(scene, camera);
}

function onDocumentMouseUp( event ) {
	event.preventDefault();
	isMouseDown = false;
}

function onDocumentMouseWheel( event ) {
	camRadius -= event.wheelDeltaY*.01;
}

/* --------------------------- */
/* ANIMATION INIT ON PAGE LOAD */
/* --------------------------- */

var $container = $('#canvasContainer');
var width = $container.width(), height = $(window).height()-5;

if (renderMode == '3D') {

	camera = new THREE.PerspectiveCamera( 75, width / height, 1, 10000 );
	camera.position.x = camRadius * Math.sin( camTheta ) * Math.cos( camPhi );
	camera.position.y = camRadius * Math.sin( camPhi );
	camera.position.z = camRadius * Math.cos( camTheta ) * Math.cos( camPhi );

	camera.lookAt(new THREE.Vector3(0,1,0));

	scene = new THREE.Scene();

	/* lights */
	var pointLight = new THREE.PointLight( 0xffffff );
	pointLight.position.set(0,4,0);
	scene.add( pointLight );

	/* draw floor */
	var floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshLambertMaterial( { color: 0xaaaaaa } ));
	floor.rotation.x += 3*Math.PI/2
	scene.add(floor);

	/*
	var backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshLambertMaterial( { color: 0xaaaaaa } ));
	backWall.position.z -= 1;
	backWall.position.y += 5;
	scene.add(backWall);
	*/

	/* create the renderer and add it to the canvas container */
	renderer = new THREE.WebGLRenderer( {antialias: true} );
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

function go() {

	try {
		var s = new Siteswap($('#siteswapInput').val());
		$('#error').hide();
	} catch(e) {		
		$('#error').show();
		$('#errorMessage').html(e);
	}

	/* should really refactor the DOM references out of the Siteswap class */
	s.debugStatesText();

	/* initialize jugglers */
	var jugglers = [];
	for (var i = 0; i < s.numJugglers; i++) {
		jugglers.push(
			new Juggler({
				position: {x:0,y:1,z:i}, 
				rotation: 0, 
				width:1,
				dwellPath: [
					/* left */
					{
						radius: .2,
						catchRotation: Math.PI,
						tossRotation: 2*Math.PI
					},
					/* right */
					{
						radius: .2,
						catchRotation: 2*Math.PI,
						tossRotation: Math.PI
					}
				]
			})
		);
	}

	/* initialize prop orbits */
	propOrbits = [];
	for (var i = 0; i < s.numProps; i++) {
		propOrbits.push([]);
	}

	/* create prop orbits */
	var numSteps = 1000;
	var beatDuration = .2;
	var dwellRatio = .5;

	for (var step = 0; step < numSteps; step++) {
		
		var currentBeat = Math.floor(step*s.states.length/numSteps);
		var currentTime = beatDuration*step*s.states.length/numSteps;

		/* find the current state of each prop */
		for(var prop = 0; prop < s.numProps; prop++) {
			
			var tossJuggler, tossHand, catchJuggler, catchHand, tossBeat, catchBeat;
			
			if (s.propOrbits[prop].length == 1) {
				tossBeat = s.propOrbits[prop][0].beat;
				tossJuggler = s.propOrbits[prop][0].juggler;
				tossHand = s.propOrbits[prop][0].hand;
				catchBeat = s.propOrbits[prop][0].beat;
				catchJuggler = s.propOrbits[prop][0].juggler;
				catchHand = s.propOrbits[prop][0].hand;			
			}
			var orbitBeatFound = false;
			for (var i = 0; i < s.propOrbits[prop].length-1; i++) {
				if (!orbitBeatFound && s.propOrbits[prop][i].beat <= currentBeat && s.propOrbits[prop][i+1].beat > currentBeat) {
					tossBeat = s.propOrbits[prop][i].beat;
					tossJuggler = s.propOrbits[prop][i].juggler;
					tossHand = s.propOrbits[prop][i].hand;
					catchBeat = s.propOrbits[prop][i+1].beat;
					catchJuggler = s.propOrbits[prop][i+1].juggler;
					catchHand = s.propOrbits[prop][i+1].hand;
					orbitBeatFound = true;
				} else if (!orbitBeatFound && i == s.propOrbits[prop].length-2) { 
					tossBeat = s.propOrbits[prop][i+1].beat;
					tossJuggler = s.propOrbits[prop][i+1].juggler;
					tossHand = s.propOrbits[prop][i+1].hand;
					catchBeat = s.propOrbits[prop][0].beat;
					catchJuggler = s.propOrbits[prop][0].juggler;
					catchHand = s.propOrbits[prop][0].hand;
				}
			}

			var tossTime = tossBeat*beatDuration+beatDuration*dwellRatio;
			var catchTime = catchBeat*beatDuration;
			if (tossTime >= catchTime && catchTime >= currentTime) { 
				tossTime -= (beatDuration*s.states.length);
			}
			if (tossTime >= catchTime && catchTime < currentTime) {
				catchTime += (beatDuration*s.states.length);	
			}

			if (currentTime < tossTime) {
				/* interpolate dwell path */
				var t = 1-(tossTime - currentTime)/(beatDuration*dwellRatio);
				propOrbits[prop].push(jugglers[tossJuggler].interpolateDwellPath(tossHand,t));
			} else {

				/*
				calculate position at current time


				x(t) = x(0) + v_x*t 
				v_x = (x(T) - x(0))/T

				y(t) = y(0) + v_y(0)*t + .5*G*t*t
				v_y = (y(T) - y(0) - .5*G*T*T)/T

				where x(0) is current position, x(T) is target position, and T is the time in the air
				*/

				var T = catchTime - tossTime;
				var x0 = jugglers[tossJuggler].interpolateDwellPath(tossHand,1).x;
				var xT = jugglers[catchJuggler].interpolateDwellPath(catchHand,0).x;
				var y0 = jugglers[tossJuggler].interpolateDwellPath(tossHand,1).y;
				var yT = jugglers[catchJuggler].interpolateDwellPath(catchHand,0).y;
				var z0 = jugglers[tossJuggler].interpolateDwellPath(tossHand,1).z;
				var zT = jugglers[catchJuggler].interpolateDwellPath(catchHand,0).z;

				var t = currentTime - tossTime;

				var xt = x0 + (xT - x0)/T*t;
				var zt = z0 + (zT - z0)/T*t;
				var vy = (yT - y0 - .5*G*T*T)/T;
				var yt = y0 + vy*t + .5*G*t*t;

				propOrbits[prop].push({x: xt, y: yt, z: zt});

			}

		}
	}


	/* clear out all meshes from scene */
	while (meshes.length > 0) {
		var tmp = meshes[0];		
		scene.remove(tmp);
		meshes.splice(0,1);
	}

	/* create each prop and add to empty meshes array */
	for (var i = 0; i < s.numProps; i++) {

		var mesh = new THREE.Mesh( new THREE.SphereGeometry( .1, 20 ), 
		new THREE.MeshPhongMaterial( { color: 'red' } ) );
		mesh.castShadow = true;

		/* synchronize the prop mesh and the prop object */
		mesh.position.x = 0;
		mesh.position.y = 0;
		mesh.position.z = 0;

		mesh.rotation.x = 0;
		mesh.rotation.y = 0;
		mesh.rotation.z = 0;


		scene.add( mesh );
		meshes.push( mesh );
	}

	var startTime = 0;
	animate();

	function animate() {
		if (startTime == 0) {
			startTime = (new Date()).getTime();
		}

		var t = (((new Date()).getTime() - startTime)/1000) % (s.states.length*beatDuration);
		var step = Math.floor(t/(s.states.length*beatDuration)*1000);

		for (var i = 0; i < meshes.length; i++) {
			meshes[i].position.x = propOrbits[i][step].x;
			meshes[i].position.y = propOrbits[i][step].y;
			meshes[i].position.z = propOrbits[i][step].z;
		}

		///update camera
		camera.position.x = camRadius * Math.sin( camTheta ) * Math.cos( camPhi );
		camera.position.y = camRadius * Math.sin( camPhi );
		camera.position.z = camRadius * Math.cos( camTheta ) * Math.cos( camPhi );

		camera.lookAt(new THREE.Vector3(0,1,0));	

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

