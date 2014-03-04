/* --------- */
/* CONSTANTS */
/* --------- */
var LEFT = 0, RIGHT = 1, G = -9.8;

var paused = false;
var renderMode = '3D';
var camera, scene, renderer;
var meshes, floor;
var camTheta = 0, camPhi = .4, camRadius = 5; // camera starting point
var isMouseDown = false, onMouseDownTheta, onMouseDownPhi, onMouseDownPosition; // helpers for mouse interaction

/* ------- */
/* HELPERS */
/* ------- */

Object.prototype.cloneState = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].cloneState();
    } else newObj[i] = this[i]
  } return newObj;
};

/* 
	helper for figuring out the number of props 
	TODO : this should interpret a-g as valid toss heights
*/
function sumIntegers(str) {
	if (str.length == 1 && parseInt(str)) {
		return parseInt(str);
	} else if (str.length > 1) {
		return str.split('').reduce(function(prev,cur) { return (parseInt(prev) ? parseInt(prev) : 0) + (parseInt(cur) ? parseInt(cur) : 0) });
	} else {
		return 0;
	}
}

/* helper for state array equality */
function arraysEqual(a,b) {
	if (a instanceof Array && b instanceof Array) {
		if (a.length != b.length) {
			return false;
		} else {
			for (var i = 0; i < a.length; i++) {
				/* if this is a multi-dimensional array, check equality at the next level */
				if (a[i] instanceof Array || b[i] instanceof Array) {
					var tmp = arraysEqual(a[i],b[i]);
					if (!tmp) {
						return false;
					}
				} else if (a[i] != b[i]) {
					return false;
				}
			}
		}
	} else {
		return false;
	}
	return true;
}

/* returns a string describing a given state */
function printState(state) {

	var str = '';

	for(var juggler = 0; juggler < state.length; juggler++) {
		str += ('J' + juggler);
		for (var hand = 0; hand < state[juggler].length; hand++) {
			str += (hand == LEFT ? ' L ' : ' R ');
			for (var beat = 0; beat < state[juggler][hand].length; beat++) {
				str += (state[juggler][hand][beat] == undefined ? 'X' : state[juggler][hand][beat][0]);
			}
		}
		if (juggler < state.length-1) {			
			str += ' ';
		}
	}

	return str;
}

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

/* -------------- */
/* SITESWAP CLASS */
/* -------------- */

function Siteswap(siteswap) {	

	this.siteswap = siteswap;

	/* first check if the siteswap is a passing siteswap, that will inform the pattern for a valid toss */
	this.numJugglers = 1;
	var isPassingPattern = /<[^ ]+>/.test(siteswap);

	var numJugglerMismatch = false;

	if (isPassingPattern) {
		var passingBeatArray = siteswap.match(/<[^ <>]+>/g);
		this.numJugglers = passingBeatArray[0].split("|").length;

		/* 
			check to make sure each beat in the passing pattern has the same number of jugglers 
			if a passing pattern only has 1 juggler than it's automatically a mismatch
		*/
		numJugglerMismatch = (this.numJugglers == 1 ? true : false);
		
		var numJugglersTmp = this.numJugglers;
		passingBeatArray.map(function(a) { 
			if (a.split("|").length != numJugglersTmp) 
				{ numJugglerMismatch = true; } 
		});
	}

	/* the number of jugglers determines a valid pass pattern */
	var passPattern = "";
	if (this.numJugglers == 2) {
		passPattern = "p";
	} else if (this.numJugglers > 2) {
		passPattern = "p[1-" + this.numJugglers + "]";
	}

	/* construct the various regex patterns. see blog post for details about this */
	var validToss = "(\\d|[a-g])x?(" + passPattern + ")?";
	var validMultiplex = "\\[(" + validToss + ")+\\]";
	var validSync = "\\((" + validToss + "|" + validMultiplex + "),(" + validToss + "|" + validMultiplex + ")\\)";
	var validBeat = "(" + validToss + "|" + validMultiplex + "|" + validSync + ")";
	var validPass = "<" + validBeat + "(\\|" + validBeat + ")+>";
	var validSiteswap = "^(" + validPass + ")+|(" + validBeat + ")+$";

	var validTossRe = new RegExp(validToss,"g");
	var validMultiplexRe = new RegExp(validMultiplex,"g");
	var validSyncRe = new RegExp(validSync,"g");
	var validBeatRe = new RegExp(validBeat,"g");
	var validPassRe = new RegExp(validPass,"g");
	var validSiteswapRe = new RegExp(validSiteswap,"g");	

	if (siteswap.match(validSiteswapRe) && !numJugglerMismatch) {
		
		/* get the array of each beats' tosses */
		var beatArr = isPassingPattern ? siteswap.match(validPassRe) : siteswap.match(validBeatRe);
		
		/* figure out how many props */
		var tmp = 0;
		beatArr.map(function(beat) {
			if (beat.match(validPassRe)) {
				var patterns = beat.split('|');
				for (var i = 0; i < patterns.length; i++) {
					if (i == 0) {
						patterns[i] = patterns[i].substr(1);
					} 
					if (i == patterns.length-1) {
						patterns[i] = patterns[i].substr(0,patterns[i].length-1);
					}
					if (patterns[i].match(validSyncRe)) {
						tmp += sumIntegers(patterns[i])/2;
					} else {
						tmp += sumIntegers(patterns[i]);
					}
				}
			} else {
				if (beat.match(validSyncRe)) {
					tmp += sumIntegers(beat)/2;
				} else {
					tmp += sumIntegers(beat);
				}				
			}
		});

		if((tmp/beatArr.length % 1) == 0 && tmp/beatArr.length > 0) {
			this.numProps = tmp/beatArr.length;
		} else {
			throw 'Invalid pattern - could not determine number of props'
		}

		/* if there is a valid number of props, start creating the state array */
		if(this.numProps) {

			/* initialize array of tosses */
			this.tossArr = [];

			/* for each beat get all the tosses */
			for (var i = 0; i < beatArr.length; i++) {
				var tosses = [];
				getTosses(tosses,beatArr[i], 0 /* assume juggler 0 */);
				this.tossArr.push(tosses);
			}

			/* figure out the max throw height which will inform the size of the state array */
			this.maxTossHeight = 0;

			for (var i = 0; i < this.tossArr.length; i++) {
				for (var j = 0; j < this.tossArr[i].length; j++) {
					if(this.tossArr[i][j].numBeats > this.maxTossHeight) {
						this.maxTossHeight = this.tossArr[i][j].numBeats;
					}
				}
			}			
			
			/* create a queue of props */
			var props = [];

			for (var i = 0; i < this.numProps; i++) {
				props.push(i);
			}

			/* initialize the state and prop orbits array */
			this.states = [];
			this.propOrbits = [];

			/* initialize current state */
			var curState = [];
			for (var j = 0; j < this.numJugglers; j++) {
				curState.push([[],[]]);
				for (var k = 0; k < this.maxTossHeight; k++) {
					curState[j][LEFT].push(undefined);
					curState[j][RIGHT].push(undefined);
				}
			}

			var patternComplete = false;
			var initComplete = false;
			var beat = 0;
			var hand = LEFT;

			/* keep going until pattern complete */
			while (!patternComplete) {

				/* queue of props to throw this beat */
				var propsLanding = [];

				/* update the current state for each juggler */
				for (var j = 0; j < this.numJugglers; j++) {
					var landingLeft = curState[j][LEFT].shift();
					if (landingLeft) {
						for (var k = 0; k < landingLeft.length; k++) {
							propsLanding.push({propId: landingLeft[k], juggler: j, hand: LEFT});	
						}						
					}
					var landingRight = curState[j][RIGHT].shift();
					if (landingRight) {
						for (var k = 0; k < landingRight.length; k++) {
							propsLanding.push({propId: landingRight[k], juggler: j, hand: RIGHT});	
						}						
					}					
					curState[j][LEFT].push(undefined);
					curState[j][RIGHT].push(undefined);
				}

				/* iterate through all the tosses and update the current state */
				for (var j = 0; j < this.tossArr[beat % this.tossArr.length].length; j++) {
					
					var toss = this.tossArr[beat % this.tossArr.length][j];
					var tossHand = (toss.hand == undefined ? hand : toss.hand);
					var catchHand = (toss.crossing ? 1 - tossHand : tossHand);

					var prop = undefined;

					/* iterate through the props landing and look for one landing in the hand that this toss is occurring */
					for (var k = 0; k < propsLanding.length; k++) {
						if(propsLanding[k].juggler == toss.juggler && propsLanding[k].hand == tossHand) {
							
							/* if a prop is landing in a hand this is tossing a 0 then invalid siteswap */
							if (toss.numBeats == 0) {
								throw 'Invalid pattern, prop landing on 0 toss';
							}

							prop = propsLanding[k].propId;														
						}
					}

					/* if no props landing to be thrown, get one from the queue - only if this isn't a 0 toss */
					if (prop == undefined && toss.numBeats > 0) {
						prop = props.shift();			
					} 

					/* if prop is still undefined (ie. there are none left) then we've got an invalid siteswap - only if this isn't a 0 toss */
					if (prop == undefined && toss.numBeats > 0) {
						throw 'Invalid pattern, no prop available to toss';
					}

					/* so long as this isn't a 0 toss, update the current state and append to prop orbits */
					if (toss.numBeats > 0) {
						
						if(!this.propOrbits[prop]) {
							this.propOrbits[prop] = [];
						}

						var tmpPropOrbits = this.propOrbits.cloneState();
						tmpPropOrbits[prop].push({beat: beat, juggler: toss.juggler, hand: tossHand});

						if(curState[toss.targetJuggler][catchHand][toss.numBeats-1] == undefined) {
							curState[toss.targetJuggler][catchHand][toss.numBeats-1] = [prop];
						} else {
							curState[toss.targetJuggler][catchHand][toss.numBeats-1].push(prop);
						}

					}
					
				}
								

				/* if we're at the beginning of the toss array and we've returned to the original state, the pattern is complete */
				if (initComplete && beat % this.tossArr.length == 0 && arraysEqual(this.states[0],curState)) {					
					patternComplete = true;				
				} else {
					/* add the current state to the state array and update prop orbits */
					this.states.push(curState.cloneState());
					this.propOrbits = tmpPropOrbits;
				}					

				/* if all props have been introduced to pattern and we're at the end of the pattern, init is complete and steady-state pattern truly begins with the next beat */
				if (props.length == 0 && (beat+1) % this.tossArr.length == 0 && !initComplete) {
					initComplete = true;
					beat = -1;
					this.states = []; /* reset the states and prop orbits */
					this.propOrbits = [];
				}			

				beat++;
				hand = 1 - hand; //alternate hands

				/* fail safe in case the pattern is too long */
				if (beat > 100) {
					patternComplete = true;
				}

			}

		}

	} else {
		throw 'Invalid siteswap format';
	}	

	/* get all the tosses for a given beat's siteswap */
	function getTosses(tosses, siteswap, juggler, sync, hand) {
		if (siteswap.match(validPassRe)) {
			var patterns = siteswap.match(validBeatRe);
			patterns.map(function(s,ix) {
				getTosses(tosses, s, ix);				
			});
		} else if (siteswap.match(validSyncRe)) {
			var patterns = siteswap.split(",");
			getTosses(tosses,patterns[0].substr(1),juggler,true,LEFT);
			getTosses(tosses,patterns[1].substr(0,patterns.length),juggler,true,RIGHT);
		} else if (siteswap.match(validMultiplex)) {
			var patterns = siteswap.match(validTossRe);
			patterns.map(function(s) {
				getTosses(tosses,s,juggler);
			});
		} else {
			var numBeats = parseInt(siteswap[0]);
			var targetJuggler = juggler;

			var pIx = siteswap.indexOf("p");
			if (pIx > 0) {
				if (this.numJugglers > 2) {
					targetJuggler = siteswap[pIx+1];
				} else {
					targetJuggler = 1 - juggler;
				}			
			}

			var crossing = (siteswap.length > 1 && (siteswap[1] == "x" && numBeats % 2 == 0) || (siteswap[1] != "x" && numBeats % 2 == 1)) || numBeats % 2 == 1 ? true : false;

			if (sync) {
				numBeats = numBeats/2;
			}

			tosses.push(
				{
					juggler: juggler,
					targetJuggler: targetJuggler,
					hand: hand, /* only !undefined for sync throws */
					crossing: crossing,
					numBeats: numBeats,
					siteswap: siteswap
				}
			);
		}
	}

	this.debugStates = function() {
		$('#states').empty();
		/*
		for (var i = 0; i < this.states.length; i++) {
			$('#states').append(printState(this.states[i]) + '</br>');
		}
		*/
		$('#states').append("<table border='1'>");
		var tbl = '';
		/* juggler header */
		tbl += '<tr>';
		for (var i = 0; i < this.states[0].length; i++) {
			tbl += '<td colspan=' + this.states[0][0][0].length*2 + '>Juggler ' + i + '</td>';
		}
		tbl += '</tr><tr>';
		for (var i = 0; i < this.states[0].length; i++) {
			tbl += '<td colspan=' + this.states[0][0][0].length + '>Left</td><td colspan=' + this.states[0][0][0].length + '>Right</td>';
		}
		tbl += '</tr>'
		for (var state = 0; state < this.states.length; state++) { // states
			tbl += '<tr>';
			for (var juggler = 0; juggler < this.states[state].length; juggler++) { // jugglers
				for (var hand = 0; hand < this.states[state][juggler].length; hand++) { //hands
					for (var i = 0; i < this.states[state][juggler][hand].length; i++) { //landing schedule
						if (this.states[state][juggler][hand][i] == undefined) {
							tbl += '<td>x</td>';
						} else {
							tbl += '<td>'
							for (var prop = 0; prop < this.states[state][juggler][hand][i].length; prop++) {
								tbl += (this.states[state][juggler][hand][i][prop] + (prop == this.states[state][juggler][hand][i].length-1 ? '' : ', '));
							}
						}						
					}
				}
			}
			tbl += '</tr>';			
		}
		$('#states table').append(tbl);

		$('#propOrbits').empty();
		$('#propOrbits').append("<table border='1'>");
		tbl = '';
		for (var prop = 0; prop < this.propOrbits.length; prop++) {
			tbl += '<tr><td>Prop ' + prop + '</td>';
			for (var i = 0; i < this.propOrbits[prop].length; i++) {
				tbl += ('<td>Beat: ' + this.propOrbits[prop][i].beat + ', Hand: ' + this.propOrbits[prop][i].hand + '</td>');
			}
			tbl += '</tr>';
		}
		$('#propOrbits table').append(tbl);

	}

}

/* ------- */
/* JUGGLER */
/* ------- */

function Juggler(config) {
	this.position = config.position;
	this.rotation = config.rotation;
	this.width = config.width;
	this.dwellPath = config.dwellPath;

	this.interpolateDwellPath = function(hand,t) {
		/* t from 0 to 1 */
		var currentRotation = this.dwellPath[hand].catchRotation + (this.dwellPath[hand].tossRotation - this.dwellPath[hand].catchRotation)*t;
		
		var dwellPosition = {
			x: this.dwellPath[hand].radius*Math.cos(currentRotation),
			y: this.dwellPath[hand].radius*Math.sin(currentRotation),
			z: 0
		};

		return {
			x: this.position.x + ((hand == LEFT ? -1 : 1)*this.width/2+dwellPosition.x)*Math.cos(this.rotation),
			y: this.position.y + dwellPosition.y,
			z: this.position.z + ((hand == LEFT ? -1 : 1)*this.width/2+dwellPosition.x)*Math.sin(this.rotation)
		};

	}
}

/* ------- */
/* ON LOAD */
/* ------- */

s = new Siteswap('5');

s.debugStates();

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
					catchRotation: 2*Math.PI,
					tossRotation: Math.PI
				},
				/* right */
				{
					radius: .2,
					catchRotation: Math.PI,
					tossRotation: 2*Math.PI
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
		
		for (var i = 0; i < s.propOrbits[prop].length-1; i++) {
			if (s.propOrbits[prop][i].beat <= currentBeat && s.propOrbits[prop][i+1].beat > currentBeat) {
				tossBeat = s.propOrbits[prop][i].beat;
				tossJuggler = s.propOrbits[prop][i].juggler;
				tossHand = s.propOrbits[prop][i].hand;
				catchBeat = s.propOrbits[prop][i+1].beat;
				catchJuggler = s.propOrbits[prop][i+1].juggler;
				catchHand = s.propOrbits[prop][i+1].hand;
			} else if (i == s.propOrbits[prop].length-2) {
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
		if (tossTime > catchTime && catchTime > currentTime) { 
			tossTime -= (beatDuration*s.states.length);
		}
		if (tossTime > catchTime && catchTime < currentTime) {
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

/* -------------- */
/* ANIMATION INIT */
/* -------------- */

var $container = $('#canvasContainer');
var width = 400, height = 400;

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

	meshes = [];

	/* create each prop */
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

	/* draw floor */
	var floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshLambertMaterial( { color: 0xaaaaaa } ));
	floor.rotation.x += 3*Math.PI/2
	scene.add(floor);

	var backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshLambertMaterial( { color: 0xaaaaaa } ));
	backWall.position.z -= 1;
	backWall.position.y += 5;
	scene.add(backWall);

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

	/* update slider position */
	$('#sliderStep').val( step );

	if (!paused) {
		requestAnimationFrame(function() { animate(); });
	}

}

function animateFromSlider() {
	paused = true;

	var step = $('#sliderStep').val();

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
}