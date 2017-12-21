function getURLQueryStringParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/* used for deep cloning of various arrays/objects */
function cloneObject(obj) {
  var newObj = (obj instanceof Array) ? [] : {};
  for (var i in obj) {
    if (i == 'clone') continue;
    if (obj[i] && typeof obj[i] == "object") {
      newObj[i] = cloneObject(obj[i]);
    } else newObj[i] = obj[i]
  } return newObj;
}

/* used to check if two states are the same */
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

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}

if (!Array.prototype.getIndexCyclic){
    Array.prototype.getIndexCyclic = function(i){
    	return this[i % this.length];
    };
}

if (!Array.prototype.getNextCyclic){
    Array.prototype.getNextCyclic = function(i){
    	i = i % this.length;
        if (this.length - 1 == i) {
        	return this[0];
        } else {
        	return this[i+1];
        }
    };
}

if (!Array.prototype.getPreviousCyclic){
    Array.prototype.getPreviousCyclic = function(i){
        i = i % this.length;
        if (i == 0) {
        	return this[this.length-1];
        } else {
        	return this[i-1];
        }
    };
}

function cross(a,b) {
	return {
		x: a.y*b.z - a.z*b.y,
		y: a.z*b.x - a.x*b.z,
		z: a.x*b.y - a.y*b.x
	}
}

function dot(a,b) {
	return a.x*b.x + a.y*b.y + a.z*b.z;
}

function magnitude(a) {
	return Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
}

function normalize(a) {
	var mag = magnitude(a);
	a.x = a.x/mag;
	a.y = a.y/mag;
	a.z = a.z/mag;
	return a;
}

function multiply(a,b) {
	a.x *= b;
	a.y *= b;
	a.z *= b;
	return a;
}

function add(a,b) {
	a.x += b.x;
	a.y += b.y;
	a.z += b.z;
	return a;
}

function sub(a,b) {
	a.x -= b.x;
	a.y -= b.y;
	a.z -= b.z;
	return a;
}

function negate(a) {
	multiply(a,-1);
	return a;
}

/* global vars */
window.randomColors = ['red','blue','green','black','yellow','purple'];
;function BounceGA(gaConfig, fitnessConfig) {
	/* TO DO - fill in unprovided inputs */
	this.gaConfig = gaConfig;
	this.fitnessConfig = fitnessConfig;

	/* get axes for surfaces, surfaces will always have bottom edge perpendicular to y-axis */
	if (fitnessConfig.axis1 === undefined) {
		for (var i = 0; i < this.fitnessConfig.surfaces.length; i++) {	
			var surface = this.fitnessConfig.surfaces[i];
			normalize(surface.normal);
			var axis1;
			if (surface.normal.x == 0 && surface.normal.z == 0) {
				axis1 = {x:1,y:0,z:0};
			} else {
				axis1 = {x:-surface.normal.z,y:0,z:surface.normal.x};
			}
			var axis2 = cross(surface.normal,axis1);
			normalize(axis1);
			normalize(axis2);
			multiply(axis1,surface.scale);
			multiply(axis2,surface.scale);
			surface.axis1 = axis1;
			surface.axis2 = axis2;
		}
	}

	this.simple = false;
	// if we're only doing 1 bounce on 1 surface that has a standard normal, we can simplify the member generation
	if (
		fitnessConfig.numBounces == 1 && 
		fitnessConfig.surfaces.length == 1 && 
		fitnessConfig.surfaces[0].normal.x == 0 && 
		fitnessConfig.surfaces[0].normal.z == 0 &&
		fitnessConfig.minT == fitnessConfig.maxT) {
		this.simple = true;
	}

	this.generations = 0;
	this.rankedPopulation = [];	// the current, ranked, population
	this.fittestMembers = []; // array of the fittest members by generation
	this.ableToFindSolution = undefined;

}

BounceGA.prototype.getBouncePath = function(v) {

	var pt = cloneObject(this.fitnessConfig.p0); 
	var vt = cloneObject(v);

	var p = [];
	var velocities = [];
	p.push(cloneObject(pt));
	velocities.push(cloneObject(vt));

	// reset surfaces 
	for (var i = 0; i < this.fitnessConfig.surfaces.length; i++) {
		this.fitnessConfig.surfaces[i].bounces = 0;
		this.fitnessConfig.surfaces[i].colliding = false;
	}

	var totalBounces = 0;
	var actualBounceOrder = [];

	var pTchoices = [];

	for (var t = 0; t <= this.fitnessConfig.maxT; t += this.fitnessConfig.dt) {

		// update position / velocity
		add(pt, multiply(cloneObject(vt), this.fitnessConfig.dt));
		vt.y += this.fitnessConfig.G*this.fitnessConfig.dt;

		p.push(cloneObject(pt));
		velocities.push(cloneObject(vt));

		// check for collisions
		for (var i = 0; i < this.fitnessConfig.surfaces.length; i++) {
			var surface = this.fitnessConfig.surfaces[i];	
			var distance = (surface.normal.x*pt.x + surface.normal.y*pt.y + surface.normal.z*pt.z - surface.normal.x*surface.position.x - surface.normal.y*surface.position.y - surface.normal.z*surface.position.z);

			if (
				Math.abs(distance) <= this.fitnessConfig.R // distance from plane is within radius
				&& Math.abs(dot(sub(cloneObject(pt),surface.position),normalize(cloneObject(surface.axis1)))) <= surface.scale
				&& Math.abs(dot(sub(cloneObject(pt),surface.position),normalize(cloneObject(surface.axis2)))) <= surface.scale
				&& !surface.colliding
			) {
				surface.colliding = true;
				surface.bounces++;
				actualBounceOrder.push(i);
				totalBounces++;

				//new velocity from bounce
				var bounceV = (new THREE.Vector3()).copy(surface.normal);
				var bounceV = cloneObject(surface.normal);
				multiply(bounceV, dot(vt, surface.normal));
				multiply(bounceV, 2*this.fitnessConfig.C);
				negate(bounceV);
				add(vt, bounceV);

			} else if (Math.abs(distance) > this.fitnessConfig.R && surface.colliding) {
				surface.colliding = false;
			}

		}

		if (t >= this.fitnessConfig.minT || t + this.fitnessConfig.dt > this.fitnessConfig.maxT) {	
			/* if bounce order is specified, check that it is followed */
			var correctBounceOrder = true;
			if (this.fitnessConfig.surfaceBounceOrder && actualBounceOrder.toString() != this.fitnessConfig.surfaceBounceOrder.toString()) {
				correctBounceOrder = false;
			}

			var enoughBounces = false;
			/* check that the total number of bounces was correct */
			if (totalBounces == this.fitnessConfig.numBounces) {
				enoughBounces = true;
			}

			// must match expected number of bounces, otherwise fitness is terrible
			if ( 
				correctBounceOrder
				&& enoughBounces
				&& ( (this.fitnessConfig.catchSign == 1 && vt.y >= 0) || (this.fitnessConfig.catchSign == -1 && vt.y <= 0 ) || this.fitnessConfig.catchSign == undefined ) 
				&& ( (this.fitnessConfig.tossSign == 1 && v.y >= 0) || (this.fitnessConfig.tossSign == -1 && v.y <= 0 ) || this.fitnessConfig.tossSign == undefined ) 
			) {
				pTchoices.push({
					pT: cloneObject(pt), 
					T: t,
					actualpT: this.fitnessConfig.pT // need this for comparator function below
				});
			}
		}		

	}

	if (pTchoices.length > 0) {
		// go through pT choices and grab the best
		pTchoices.sort(function(a,b) { 
			return magnitude(sub(cloneObject(a.pT),a.actualpT)) - magnitude(sub(cloneObject(b.pT),a.actualpT));
		});

		return {path: p.splice(0,pTchoices[0].T/this.fitnessConfig.dt), velocities: velocities.splice(0,pTchoices[0].T/this.fitnessConfig.dt), T: pTchoices[0].T};
	} else {
		return {path: undefined, velocities: undefined, T: undefined};
	}

}

BounceGA.prototype.generateMember = function(parent) {	

	var v = {x:0, y:0, z:0};

	if (parent && parent.fitness < 100) {

		if (Math.random() < this.gaConfig.mutationChance) {			
			
			v.y = (1-2*Math.random())*(parent.fitness < this.gaConfig.mutationScale ? parent.fitness : this.gaConfig.mutationScale);

			//only edit x/z if we're not in simple mode
			if (!this.simple) {
				v.x = (1-2*Math.random())*(parent.fitness < this.gaConfig.mutationScale ? parent.fitness : this.gaConfig.mutationScale);	
				v.z = (1-2*Math.random())*(parent.fitness < this.gaConfig.mutationScale ? parent.fitness : this.gaConfig.mutationScale);
			}

			add(v, parent.v);
		} else {
			v = cloneObject(parent.v);
		}
	} else {

		if (this.simple) {
			
			v.x = (this.fitnessConfig.pT.x-this.fitnessConfig.p0.x)/this.fitnessConfig.minT;
			v.z = (this.fitnessConfig.pT.z-this.fitnessConfig.p0.z)/this.fitnessConfig.minT;
			
			v.y = this.fitnessConfig.tossSign * Math.random() * this.gaConfig.initialScale;

		} else {

			var targetSurface;
			if(this.fitnessConfig.surfaceBounceOrder) {
				targetSurface = this.fitnessConfig.surfaces[this.fitnessConfig.surfaceBounceOrder[0]];
			} else {
				targetSurface = this.fitnessConfig.surfaces[Math.floor(Math.random()*this.fitnessConfig.surfaces.length)];
			}
			
			// first find a random spot on the surface
			v = cloneObject(targetSurface.position);
			add(v, multiply(cloneObject(targetSurface.axis1), 1-2*Math.random()));
			add(v, multiply(cloneObject(targetSurface.axis2), 1-2*Math.random()));

			// save and remove the y component
			var targetY = v.y;
			v.y = 0;

			var p0copy = cloneObject(this.fitnessConfig.p0);
			p0copy.y = 0;
			var pTcopy = cloneObject(this.fitnessConfig.pT);
			pTcopy.y = 0;

			// the minimum possible velocity is for us to get to this spot at the half-way point
			// var minV = p0copy.distanceTo(v)+pTcopy.distanceTo(v) / (this.fitnessConfig.maxT);
			// maximum velocity is for us to go directly to the spot and back in minT
			// ACTUALLY THIS SHOULD BE HIGHER
			// var maxV = (p0copy.distanceTo(v)+pTcopy.distanceTo(v) / (this.fitnessConfig.minT))/this.fitnessConfig.C;
			var minV = 0;
			var maxV = this.gaConfig.initialScale;

			// create velocity vector from p0 to random spot on surface
			sub(v, p0copy);
			
			normalize(v);
			multiply(v, minV + (maxV-minV)*Math.random());

			// now get minV and maxV for y-component
			// the min velocity (or max velocity down) is either 0 if tossSign is 1 or targetY is above, or the time it takes to bounce back from straight down
			// this calculation is naively simplified to not consider C or G, may need to refactor
			minV = (this.fitnessConfig.tossSign == 1 || targetY > this.fitnessConfig.p0.y) ? 0 : -( (this.fitnessConfig.p0.y - targetY)*2 / (this.fitnessConfig.minT) );
			// the max velocity is either 0 if tossSign is -1 or the time it takes to get back from a straight toss up
			//maxV = (this.fitnessConfig.pT.y - this.fitnessConfig.p0.y - .5*this.fitnessConfig.G*this.fitnessConfig.maxT*this.fitnessConfig.maxT)/this.fitnessConfig.maxT;
			maxV = this.gaConfig.initialScale;

			v.y = minV + (maxV-minV)*Math.random();
		}
	
	}

	var bouncePath = this.getBouncePath(v);

	return {
		v: v, 
		T: bouncePath.T,
		fitness: bouncePath.path ? magnitude(sub(cloneObject(bouncePath.path[bouncePath.path.length-1]), this.fitnessConfig.pT)) : 100
	};
}

BounceGA.prototype.evolve = function() {
	if (this.generations >= this.gaConfig.maxGenerations) {
		this.ableToFindSolution = false;
	} else if (this.rankedPopulation.length > 0 && this.rankedPopulation[0].fitness <= this.gaConfig.fitnessThreshold) {
		this.ableToFindSolution = true;
	} else {
		
		/* if this is first generation, we have no viable solutions yet, or we the noGA flag is set create them all from scratch */
		if (this.rankedPopulation.length == 0 || this.gaConfig.noGA) {
			this.rankedPopulation = []; // just make sure the population is empty
			for (var i = 0; i < this.gaConfig.populationSize; i++) {
				this.rankedPopulation.push(this.generateMember(undefined));
			}				
		} 
		/* otherwise create the next generation */
		else {
			/* we want to create a selection bias based on the fitness */
			var totalWeights = 0;
			var selectorHelper = []; 
			for (var i = 0; i < this.rankedPopulation.length; i++) {
				totalWeights += 1/this.rankedPopulation[i].fitness;
				selectorHelper.push(totalWeights);
			}
			/* select and mutate to create new members using the weighted selector helper array, so we'll pick more of the better members */
			var newPopulation = [];
			for (var i = 0; i < this.gaConfig.populationSize; i++) {
				// make half the population completely new members, the other half choose based on fitness
				if (i < this.gaConfig.populationSize*.5) {
					newPopulation.push(this.generateMember(undefined));
				} else {
					var rand = Math.random()*totalWeights;
					for (var j = 0; j < selectorHelper.length; j++) {
						if (rand < selectorHelper[j]) {
							newPopulation.push(this.generateMember(this.rankedPopulation[j]));
							break;
						}
					}
				}		
			}
			this.rankedPopulation = newPopulation;			
		}

		/* sort population, hence the variable name */
		this.rankedPopulation.sort(function(a,b) { return a.fitness - b.fitness; });
		var fittestMember = this.rankedPopulation[0];
		this.fittestMembers.push(fittestMember);
		this.generations++;

		if (this.generations % 100 == 0) {
			console.log(this.generations + ' ' + fittestMember.fitness);
		}

		/* call evolve again, make sure to use setTimeout so we don't lock the browser */		
		this.evolve();
		/*
		var self = this;
		setTimeout(function() { self.evolve(); }, 0);
		*/
	}
}

// function Animator(ga) {

// 	var 
// 		container,
// 		width,
// 		height,
// 		camera, 
// 		scene, 
// 		renderer,
// 		/* camera starting point */
// 		camTheta = Math.PI, 
// 		camPhi = .3, 
// 		camRadius = 5,
// 		/* helpers for mouse interaction */
// 		isMouseDown = false, 
// 		onMouseDownTheta, 
// 		onMouseDownPhi, 
// 		onMouseDownPosition;

// 	container = $('#animationContainer');

// 	width = container.width();
// 	height = container.height();

// 	camera = new THREE.PerspectiveCamera( 75, width / height, .05, 100 );
// 	updateCamera();

// 	scene = new THREE.Scene();

// 	/* lights */
// 	var ceilingLight = new THREE.PointLight( 0xffffff );
// 	ceilingLight.position.set(0,20,0);
// 	scene.add( ceilingLight );

// 	/* surfaces */
// 	ga.fitnessConfig.surfaces.map(function(a) {
// 		var surface = {
// 			position: new THREE.Vector3(a.position.x,a.position.y,a.position.z),
// 			normal: new THREE.Vector3(a.normal.x,a.normal.y,a.normal.z),
// 			axis1: new THREE.Vector3(a.axis1.x,a.axis1.y,a.axis1.z),
// 			axis2: new THREE.Vector3(a.axis2.x,a.axis2.y,a.axis2.z),
// 			scale: a.scale
// 		}
// 		var surfaceGeom = new THREE.Geometry();
// 		surfaceGeom.vertices.push( (new THREE.Vector3()).copy(surface.position).add((new THREE.Vector3()).add(surface.axis1).add(surface.axis2)) );
// 		surfaceGeom.vertices.push( (new THREE.Vector3()).copy(surface.position).add((new THREE.Vector3()).add(surface.axis1).negate().add(surface.axis2)) );
// 		surfaceGeom.vertices.push( (new THREE.Vector3()).copy(surface.position).add((new THREE.Vector3()).add(surface.axis1).add(surface.axis2).negate()) );
// 		surfaceGeom.vertices.push( (new THREE.Vector3()).copy(surface.position).add((new THREE.Vector3()).add(surface.axis2).negate().add(surface.axis1)) );

// 		surfaceGeom.faces.push( new THREE.Face3( 0, 1, 2 ) );
// 		surfaceGeom.faces.push( new THREE.Face3( 2, 0, 3 ) );

// 		var surfaceMesh = new THREE.Mesh(surfaceGeom, new THREE.MeshBasicMaterial( { color: 'grey', side: THREE.DoubleSide } ));
// 		scene.add(surfaceMesh);
// 	});

// 	/* draw ball */

// 	var ballMesh = new THREE.Mesh(new THREE.SphereGeometry( .1, 32, 32 ), new THREE.MeshBasicMaterial( { color: 'red' } ));
// 	ballMesh.position = ga.fitnessConfig.p0;
// 	scene.add(ballMesh);

// 	var targetMesh = new THREE.Mesh(new THREE.SphereGeometry( .1, 32, 32 ), new THREE.MeshBasicMaterial( { color: 'green' } ));
// 	targetMesh.position = ga.fitnessConfig.pT;
// 	scene.add(targetMesh);

// 	/* add axes for debugging */
// 	axes = buildAxes( 1 );
// 	scene.add(axes);

// 	/* create the renderer and add it to the canvas container */
// 	if( !window.WebGLRenderingContext ) {
// 		renderer = new THREE.CanvasRenderer();	
// 	} else {
// 		renderer = new THREE.WebGLRenderer( {antialias: true} );
// 	}

// 	renderer.setSize( width, height );

// 	container.empty();
// 	container.append(renderer.domElement);

// 	//add the event listeners for mouse interaction
// 	renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
// 	renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
// 	renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
// 	renderer.domElement.addEventListener( 'mousewheel', onDocumentMouseWheel, false );

// 	onMouseDownPosition = new THREE.Vector2();

// 	renderer.setClearColor( 0xffffff, 1);

// 	renderer.render(scene,camera);

// 	function updateCamera() {
// 		camera.position.x = camRadius * Math.sin( camTheta ) * Math.cos( camPhi );
// 		camera.position.y = camRadius * Math.sin( camPhi );
// 		camera.position.z = camRadius * Math.cos( camTheta ) * Math.cos( camPhi );
// 		camera.lookAt(new THREE.Vector3(0,1,0));
// 	}

// 	/* got the camera rotation code from: http://www.mrdoob.com/projects/voxels/#A/ */
// 	function onDocumentMouseDown( event ) {
// 		isMouseDown = true;
// 		onMouseDownTheta = camTheta;
// 		onMouseDownPhi = camPhi;
// 		onMouseDownPosition.x = event.clientX;
// 		onMouseDownPosition.y = event.clientY;
// 	}

// 	function onDocumentMouseMove( event ) {
// 		event.preventDefault();
// 		if ( isMouseDown ) {
// 			camTheta = - ( ( event.clientX - onMouseDownPosition.x ) * 0.01 ) + onMouseDownTheta;
			
// 			var dy = event.clientY - onMouseDownPosition.y;
			
// 			var newCamPhi = ( ( dy ) * 0.01 ) + onMouseDownPhi;

// 			if (newCamPhi < Math.PI/2 && newCamPhi > -Math.PI/2) {
// 				camPhi = newCamPhi;
// 			}
// 		}

// 		updateCamera();
// 		renderer.render(scene, camera);
// 	}

// 	function onDocumentMouseUp( event ) {
// 		event.preventDefault();
// 		isMouseDown = false;
// 	}

// 	function onDocumentMouseWheel( event ) { camRadius -= event.wheelDeltaY*.01; }

// 	function buildAxes( length ) {
// 	        var axes = new THREE.Object3D();

// 	        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000 ) ); // +X
// 	        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000) ); // -X
// 	        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00 ) ); // +Y
// 	        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00 ) ); // -Y
// 	        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF ) ); // +Z
// 	        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF ) ); // -Z

// 	        return axes;

// 	}

// 	function buildAxis( src, dst, colorHex, dashed ) {
// 	        var geom = new THREE.Geometry(),
// 	            mat; 

// 	        if(dashed) {
// 	                mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
// 	        } else {
// 	                mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
// 	        }

// 	        geom.vertices.push( src.clone() );
// 	        geom.vertices.push( dst.clone() );
// 	        geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

// 	        var axis = new THREE.Line( geom, mat, THREE.LinePieces );

// 	        return axis;

// 	}

// 	this.animate = function(bouncePath,startTime) {
// 		if (startTime === undefined) {
// 			startTime = (new Date()).getTime();
// 		}

// 		var animationSpeed = 1;

// 		/* find time in the pattern and translate that to a discrete step in the prop position arrays */
// 		var timeElapsed = ((new Date()).getTime() - startTime)*animationSpeed/1000;
// 		var t = timeElapsed % bouncePath.T; // need to *1000 b/c timeElapsed is in ms
// 		var step = Math.floor(t/bouncePath.T*bouncePath.path.length);

// 		ballMesh.position = bouncePath.path[step];

// 		renderer.render(scene, camera);

// 		if (timeElapsed < bouncePath.T) {
// 			var self = this;
// 			requestAnimationFrame(function() { self.animate(bouncePath,startTime); });
// 		}
// 	}

// }

// function reportStats(ga) {
// 	var bestFitness;
// 	var T;
// 	if (ga.fittestMembers[ga.generations-1].fitness < 100) {
// 		bestFitness = ga.fittestMembers[ga.generations-1].fitness;
// 		T = ga.fittestMembers[ga.generations-1].T;
// 				var msg = 'Generation ' + ga.generations + ', best fitness: ' + bestFitness.toFixed(2) + ', ' + T.toFixed(2) + 's, velocity: ' + ga.fittestMembers[ga.generations-1].v.x.toFixed(2) + ', ' + ga.fittestMembers[ga.generations-1].v.y.toFixed(2) + ', ' + ga.fittestMembers[ga.generations-1].v.z.toFixed(2);
// 		$('#stats').append('<a href="#" onclick="animator.animate(ga.getBouncePath(ga.fittestMembers[' + (ga.generations-1).toString() + '].v))">'+msg+'</span><br/>');
// 	}

// 	if (ga.ableToFindSolution === undefined) {
// 		setTimeout(function() { reportStats(ga); },100);
// 	}	
// }

// function getConfigFromInput() {
// 	var input = $('#fitness').val().split('\n');
// 	/*
// 	p0.x,p0.y,p0.z,pT.x,pT.y,pT.z,T
// 	R,C
// 	numBounces,bounceOrder
// 	tossSign,catchSign
// 	surface1
// 	surface2
// 	surfaceN
// 	*/

// 	var posAndTime = input[0].split(',');
// 	var p0 = {x:parseFloat(posAndTime[0]), y:parseFloat(posAndTime[1]), z:parseFloat(posAndTime[2])};
// 	var pT = {x:parseFloat(posAndTime[3]), y:parseFloat(posAndTime[4]), z:parseFloat(posAndTime[5])};
// 	var minT = parseFloat(posAndTime[6]);
// 	var maxT = parseFloat(posAndTime[7]);

// 	var ballProperties = input[1].split(',');
// 	var R = parseFloat(ballProperties[0]);
// 	var C = parseFloat(ballProperties[1]);

// 	var bounces = input[2].split(',');
// 	var numBounces = parseInt(bounces[0]);
// 	var surfaceBounceOrder = undefined;
// 	if (bounces.length > 1) {
// 		surfaceBounceOrder = bounces.splice(1).map(function(a) { return parseInt(a); });
// 	}

// 	var tossCatchSigns = input[3].split(',');
// 	var tossSign = tossCatchSigns[0].trim() == 'u' ? undefined : parseInt(tossCatchSigns[0]);
// 	var catchSign = tossCatchSigns[1].trim() == 'u' ? undefined : parseInt(tossCatchSigns[1]);

// 	var surfaces = [];
// 	for (var i = 4; i < input.length; i++) {
// 		var surfaceProperties = input[i].split(',');
// 		var normal = {x:parseFloat(surfaceProperties[0]), y:parseFloat(surfaceProperties[1]), z:parseFloat(surfaceProperties[2])};
// 		var position = {x:parseFloat(surfaceProperties[3]), y:parseFloat(surfaceProperties[4]), z:parseFloat(surfaceProperties[5])};
// 		var scale = parseFloat(surfaceProperties[6]);
// 		surfaces.push({
// 			normal: normal,
// 			position: position,
// 			scale: scale
// 		});
// 	}

// 	var fitnessConfig = {
// 		p0: p0,
// 		pT: pT,
// 		minT: minT,
// 		maxT: maxT,
// 		R: R,
// 		C: C,
// 		dt: .01,
// 		G: -9.8,
// 		numBounces: numBounces,
// 		surfaceBounceOrder: surfaceBounceOrder,
// 		tossSign: tossSign,
// 		catchSign: catchSign,
// 		surfaces: surfaces
// 	};
	
// 	input = $('#ga').val().split(',');

// 	var gaConfig = {
// 		maxGenerations: parseInt(input[0]),
// 		populationSize: parseInt(input[1]),
// 		mutationChance: parseFloat(input[2]),
// 		mutationScale: parseFloat(input[3]),
// 		initialScale: parseFloat(input[4]),
// 		fitnessThreshold: parseFloat(input[5]),
// 		noGA: input.length > 6 && input[6] == 1 ? true : false
// 	}

// 	return {fitnessConfig: fitnessConfig, gaConfig: gaConfig};
// }

// var ga;
// var animator;

// function go() {
// 	var configs = getConfigFromInput();
// 	ga = new BounceGA(configs.gaConfig,configs.fitnessConfig);
// 	var done = ga.evolve();

// 	animator = new Animator(ga);

// 	function runAnimation() {
// 		if (ga.ableToFindSolution == true) {
// 			animator.animate(ga.getBouncePath(ga.fittestMembers[ga.fittestMembers.length-1].v));
// 		} else {
// 			setTimeout(runAnimation,0);
// 		}
// 	}

// 	$('#stats').empty();
// 	setTimeout(function() { reportStats(ga); },0);
	
// 	setTimeout(runAnimation,0);
// }

// function setExample(i) {
// 	switch (i) {
// 		case 0:
// 			$('#fitness').val("-.5,1.5,0, .5,1.5,0, 1.5,2\n\
// .05, .97\n\
// 1\n\
// 1, -1\n\
// 0,1,0, 0,0,0, 1");
// 			break;
// 		case 1:
// 			$('#fitness').val("-.5,1.5,0, .5,1.5,0, 2,2.1\n\
// .05, .97\n\
// 2, 0,1\n\
// u, u\n\
// .4,1,-.3, -1,0,1, 1\n\
// -.4,1,-.3, 1,0,1, 1");
// 			break;
// 		case 2:
// 			$('#fitness').val("-.5,1.5,0, .5,1.5,0, .3,1\n\
// .05, .97\n\
// 2\n\
// u, u\n\
// 1,0,0, 1,2,0, 2\n\
// 1,0,0, -1,2,0, 2");
// 			break; 
// 		case 3:
// 			$('#fitness').val("-.5,1.5,0, .5,1.5,0, 2,3\n\
// .05, .97\n\
// 3, 1,2,0\n\
// u, u\n\
// 1,0,0, 1,2,0, 1\n\
// 1,0,0, -1,2,0, 1\n\
// 0,1,0, 0,0,0, 1");
// 			break; 
// 	}
// }

// setExample(0);
;// Most of the ideas below are from http://www.benknowscode.com/2012/09/path-interpolation-using-cubic-bezier_9742.html
// The only thing I can take any credit for is modifying the algorithm to accomodate variable input control points and
// the "matchVelocity" idea.

(function(exports){

exports.interpolateBezierSpline = function(P,t,v_0,v_T,v_0scale,v_Tscale,matchVelocity) {
		
	// t goes from 0 to 1

	/* dwellPath object looks like this */
	/*
		[
			[{x1,y1,z1},{x2,y2,z2},...]
			,[{x1,y1,z1},{x2,y2,z2},...]
		]			
	*/

	var dwellPosition;

	if (t == 0) {
		dwellPosition = P[0];
	} else if (t == 1) {
		dwellPosition = P.last();
	} else {

		/* if P is just one point, duplicate it */
		if (P.length == 1) {
			P.push(P[0]);
		}			

		var C = [{x: P[0].x+v_0.dx*v_0scale, y: P[0].y+v_0.dy*v_0scale, z: P[0].z+v_0.dz*v_0scale},{x: P.last().x-v_T.dx*v_Tscale, y: P.last().y-v_T.dy*v_Tscale, z: P.last().z-v_T.dz*v_Tscale}];
		var eps = .00001;

		var c = [];
		var path = [];

		for (var i = 0; i < P.length-1; i++) {
			var p0 = P[i];
			var p1 = P[i+1];

			var c0, c1;

			if (i == 0) {
				c0 = C[0];
			} else {
				var c1prev = c[c.length-1];
				var c0 = { x: p0.x + (p0.x - c1prev.x), y: p0.y + (p0.y - c1prev.y), z: p0.z + (p0.z - c1prev.z) };
				c.push(c0);
			}

			if (i+1 == P.length-1) {
				c1 = C[1];
			} else {
				var m0 = { x: (P[i].x+P[i+1].x)/2, y: (P[i].y+P[i+1].y)/2, z: (P[i].z+P[i+1].z)/2 };
				var m1 = { x: (P[i+1].x+P[i+2].x)/2, y: (P[i+1].y+P[i+2].y)/2, z: (P[i+1].z+P[i+2].z)/2 };
				var l0 = Math.sqrt( Math.pow(P[i].x - P[i+1].x,2) + Math.pow(P[i].y - P[i+1].y,2) + Math.pow(P[i].z - P[i+1].z,2) );
				var l1 = Math.sqrt( Math.pow(P[i+1].x - P[i+2].x,2) + Math.pow(P[i+1].y - P[i+2].y,2) + Math.pow(P[i+1].z - P[i+2].z,2) );
				var _t = l0/(l0+l1);
				var q = { x: (1-_t)*m0.x + _t*m1.x, y: (1-_t)*m0.y + _t*m1.y, z: (1-_t)*m0.z + _t*m1.z };
				c1 = { x: p1.x + (m0.x-q.x), y: p1.y + (m0.y-q.y), z: p1.z + (m0.z-q.z) };
				c.push(c1);
			}

			for (var _t = 0; _t <= 1+eps; _t += .02) {
				path.push(
					{
						x: Math.pow(1-_t,3)*p0.x + 3*Math.pow(1-_t,2)*_t*c0.x + 3*(1-_t)*Math.pow(_t,2)*c1.x + Math.pow(_t,3)*p1.x,
						y: Math.pow(1-_t,3)*p0.y + 3*Math.pow(1-_t,2)*_t*c0.y + 3*(1-_t)*Math.pow(_t,2)*c1.y + Math.pow(_t,3)*p1.y,
						z: Math.pow(1-_t,3)*p0.z + 3*Math.pow(1-_t,2)*_t*c0.z + 3*(1-_t)*Math.pow(_t,2)*c1.z + Math.pow(_t,3)*p1.z
					}
				);
				if (path.length == 1) {
					path.last().dist = 0;
				} else {
					path.last().dist = path[path.length-2].dist + Math.sqrt(Math.pow(path.last().x-path[path.length-2].x,2)+Math.pow(path.last().y-path[path.length-2].y,2)+Math.pow(path.last().z-path[path.length-2].z,2));
				}
			}
		}

		var dwellPositionIx;
		if (matchVelocity) {
			var v_0mag = Math.sqrt(Math.pow(v_0.dx,2)+Math.pow(v_0.dy,2)+Math.pow(v_0.dz,2));
			var v_Tmag = Math.sqrt(Math.pow(v_T.dx,2)+Math.pow(v_T.dy,2)+Math.pow(v_T.dz,2));
			var L = path.last().dist;
			var T = siteswap.dwellDuration;
			var j = (6*T*(v_Tmag + v_0mag) - 12*L)/Math.pow(T,3);
			var a_0 = (v_Tmag - v_0mag - .5*j*Math.pow(T,2))/T;
			var dt = t*T;
			var p_dt = v_0mag*dt + .5*a_0*Math.pow(dt,2) + (1/6)*j*Math.pow(dt,3);

			dwellPositionIx = 0;
			for (var i = 0; i < path.length; i++) {
				if (path[i].dist <= p_dt) {
					dwellPositionIx = i;
				}
			}
		} else {
			dwellPositionIx = Math.floor(t*path.length);
		}
		
		dwellPosition = path[dwellPositionIx < 0 ? 0 : dwellPositionIx];

	}

	return dwellPosition;

}

})(typeof exports === 'undefined'? this['Bezier'] = {} : exports);
;(function(exports){

/* calculates the sum of all throws in the siteswap. used to determine the number of props */
function sumThrows(str) {

	var total = 0;
	for (var i = 0; i < str.length; i++) {
		if(parseInt(str[i])) {
			total += parseInt(str[i]);					
		} else if (str.charCodeAt(i) >= 97 && str.charCodeAt(i) <= 119) {
			// handle "a" through "z" (where "a" = 10)
			total += str.charCodeAt(i)-87;
		}

		// if the current character is a pass/spin marker
		// ignore the next character so we don't count the
		// juggler identifier  in something like <5p2|5p3|5p1>
		if ((str[i] == "P" || str[i] == "S") && parseInt(str[i+1]) ){
			i++;
		}
		// if the current character is a bounce marker
		// and then next character is a {, move forward until we find a }
		if ((str[i] == "B" || str[i] == "D" || str[i] == "T" || str[i] == "C" || str[i] == "S") && str[i+1] == "{") {
			i = str.indexOf("}",i);
		}
	}

	return total;
}

var flightPathCache = {};

/* CONSTANTS */

var LEFT = 0, RIGHT = 1;

/* core functions */
exports.CreateSiteswap = function(siteswapStr, options) {
	
	/* return variable */
	var siteswap = {
		siteswap: 				siteswapStr,
		validSyntax: 			false,
		validPattern: 			false,
		collision:              undefined,
		multiplex: 				undefined,
		sync: 					undefined,
		pass: 					undefined,
		startingHand:			RIGHT,
		numJugglers: 			undefined,
		numProps: 				undefined,
		maxHeight: 				undefined,
		tosses: 				undefined,
		beats: 					undefined,
		states: 				undefined,
		propOrbits: 			undefined,
		propPositions: 			undefined,
		propRotations:  		undefined,
		jugglerHandPositions: 	undefined,
		jugglerElbowPositions: 	undefined,
		jugglers: 				undefined,
		validationOnly:			undefined,
		numStepsPerBeat:		undefined,		
		numSteps: 				undefined,
		beatDuration: 			undefined,
		dwellDuration: 			undefined,
		props:  				undefined,
		dwellPath: 				undefined,
		tossMatchVelocity:		undefined,
		catchMatchVelocity:		undefined,
		dwellCatchScale:		undefined,
		dwellTossScale:			undefined,
		emptyTossScale:			undefined,
		emptyCatchScale:		undefined,
		armAngle: 				undefined,
		surfaces: 				undefined,		
		errorMessage:  			undefined,
		stateDiagram:			undefined
	};	

	/* regexps */
	var validTossRe,
		validMultiplexRe,
	    	validThrowRe,
		validSyncRe,
		validBeatRe,
		validPassRe,
		validSiteswapRe,
		validPassShorthandRe;

	validateSyntax();

	setDefaultOptions();	
	
	if (siteswap.errorMessage) { return siteswap; }
	
	validatePattern();
	
	if (siteswap.errorMessage) { return siteswap; }

	if (!siteswap.validationOnly) {
		generatePropPositions();
	}

	return siteswap;

	function setDefaultOptions() {

		if (options === undefined) {
			options = {};
		}

		siteswap.validationOnly = (options.validationOnly === undefined ? false : options.validationOnly);		
		siteswap.beatDuration = (options.beatDuration === undefined ? .2 : options.beatDuration);		
		siteswap.dwellDuration = (options.dwellRatio === undefined ? siteswap.beatDuration*.5 : siteswap.beatDuration*options.dwellRatio);
		siteswap.numStepsPerBeat = (options.numStepsPerBeat === undefined ? Math.floor(siteswap.beatDuration*200) : options.numStepsPerBeat);
		siteswap.matchVelocity = (options.matchVelocity === undefined ? false : options.matchVelocity);
		siteswap.dwellCatchScale = (options.dwellCatchScale === undefined ? 0.05 : options.dwellCatchScale);
		siteswap.dwellTossScale = (options.dwellTossScale === undefined ? 0.05 : options.dwellTossScale);
		siteswap.emptyTossScale = (options.emptyTossScale === undefined ? 0.05 : options.emptyTossScale);
		siteswap.emptyCatchScale = (options.emptyCatchScale === undefined ? 0.05 : options.emptyCatchScale);
		siteswap.armAngle = (options.armAngle === undefined ? 0.1 : options.armAngle);
				
		if (options.startingHand == "L" || options.startingHand == "LEFT") {
			siteswap.startingHand = LEFT;			
		} else { 
			siteswap.startingHand = RIGHT;
		}

		if (options.props === undefined) {
			siteswap.props = [{type: 'ball', radius: .05, C: .95}];
		} else {
			siteswap.props = options.props;
		}

		if (options.dwellPath === undefined) {
			
			siteswap.dwellPath = [
				[
					{x:0.3,y:0,z:0,rotation:{x:4,y:0,z:-1,th:Math.PI/2},empty:false},
					{x:0.1,y:0,z:0,rotation:{x:4,y:0,z:1,th:Math.PI/2},empty:false}
				]
			];

		} else {

			var customDwellPathBeats = options.dwellPath.split(').').map(function(a,ix,arr) { if (ix < arr.length-1) { return a+')'; } else { return a; } });
			siteswap.dwellPath = [];
			for (var i = 0; i < customDwellPathBeats.length; i++) {
				if (customDwellPathBeats[i].indexOf("e") == -1) {
					customDwellPathBeats[i] += "e";
				}
				var heldDwellPathArr = customDwellPathBeats[i].split("e")[0].match(/\(-?\d+(\.\d+)?(,-?\d+(\.\d+)?)?(,-?\d+(\.\d+)?)?(,\{-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?\})?\)/g);		
				var emptyDwellPathArr = customDwellPathBeats[i].split("e")[1].match(/\(-?\d+(\.\d+)?(,-?\d+(\.\d+)?)?(,-?\d+(\.\d+)?)?(,\{-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?\})?\)/g);
				var emptyDwellPathStrLen;
				if (emptyDwellPathArr == null) {
					emptyDwellPathArr = [];
					emptyDwellPathStrLen = 0;
				} else {
					emptyDwellPathStrLen = emptyDwellPathArr.reduce(function(a,b) { return a+b }).length;
				}
				// this is just a check that it's a valid dwell path
				if ( 
					heldDwellPathArr.reduce(function(a,b) { return a+b }).length == customDwellPathBeats[i].split("e")[0].length &&
					emptyDwellPathStrLen == customDwellPathBeats[i].split("e")[1].length
				) {
					
					function parseDwellPathBeat(a,ix,empty) {
						var xyz = a.match(/\(-?\d+(\.\d+)?(,-?\d+(\.\d+)?)?(,-?\d+(\.\d+)?)?/g)[0].match(/-?\d+(\.\d+)?/g);
						var rot = a.match(/\{-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?\}/g); 
						var xyzth;
						if (rot) {
							xyzth = rot[0].match(/-?\d+(\.\d+)?/g);
						}
						var rotation;
						if (xyzth) {
							rotation = {x:parseFloat(xyzth[0]),y:parseFloat(xyzth[1]),z:parseFloat(xyzth[2]),th:parseFloat(xyzth[3])};
						} else if (siteswap.props[0].type == 'club') {
							rotation = {x:4,y:0,z:(ix == 0 ? -1 : 1),th:Math.PI/2+(ix == 0 ? .5 : -.7)};
						} else if (siteswap.props[0].type == 'ring') {
							rotation = {x:0,y:1,z:0,th:Math.PI/2};
						} else {
							rotation = {x:1,y:0,z:0,th:0};
						}
						return {
							x: parseFloat(xyz[0])/100,
							y: xyz[1] ? parseFloat(xyz[1])/100 : 0,
							z: xyz[2] ? parseFloat(xyz[2])/100 : 0,
							rotation: rotation,
							empty: empty
						}
					}

					
					siteswap.dwellPath.push(
						heldDwellPathArr.map(function(a,ix) { return parseDwellPathBeat(a,ix,false); }).concat(emptyDwellPathArr.map(function(a,ix) { return parseDwellPathBeat(a,ix,true); }))
					);

				} else {
					siteswap.errorMessage = 'Invalid custom dwell path';
				}
			}

		}

		if (options.surfaces === undefined) {
			siteswap.surfaces = [{position:{x:0,y:0,z:0}, normal:{x:0,y:1,z:0}, scale: 5, color: 'grey'}];
		} else {
			siteswap.surfaces = options.surfaces;
		}

		siteswap.jugglers = [];
		// if no juggler's were specified or there was a mismatch in the inputs
		if (options.jugglers === undefined || siteswap.numJugglers != options.jugglers.length) {				
			// if 1 juggler just put them in the middle
			if (siteswap.numJugglers == 1) {				
				siteswap.jugglers.push(
					{
						position: {x:0,z:-2*i},
						rotation: i*Math.PI,
						color: 'grey'
					}
				);
			} else {
				// if more than 1 put them in even numbers around a circle facing the middle
				for (var i = 0; i < siteswap.numJugglers; i++) {
					var rot = i*2*Math.PI/siteswap.numJugglers;
					siteswap.jugglers.push(
						{
							position: {x:Math.cos(rot),z:Math.sin(rot)},
							rotation: rot-Math.PI/2,
							color: 'grey'
						}
					);
				}
			}		
		} else {
			for (var i = 0; i < options.jugglers.length; i++) {
				siteswap.jugglers.push(
					{
						position: options.jugglers[i].position,
						rotation: options.jugglers[i].rotation,
						color: options.jugglers[i].color
					}
				);
			}
		}

		// set up axes on surfaces
		for (var i = 0; i < siteswap.surfaces.length; i++) {
			var surface = siteswap.surfaces[i];
			normalize(surface.normal);
			var axis1;
			if (surface.normal.x == 0 && surface.normal.z == 0) {
				axis1 = {x:1, y:0, z:0};
			} else {
				axis1 = {x:-surface.normal.z, y:0, z:surface.normal.x};
			}
			var axis2 = cross(surface.normal,axis1);
			normalize(axis1);
			multiply(axis1,surface.scale);
			normalize(axis2);
			multiply(axis2,surface.scale);
			surface.axis1 = axis1;
			surface.axis2 = axis2;
		}

	}

	/* check that the siteswap has the correct syntax */
	function validateSyntax() {
		siteswapStr = siteswapStr.replace(/\s/g,"");
		var numJugglers = 1;
		var isPassingPattern = /<[^ ]+>/.test(siteswapStr);

		if (isPassingPattern) {
			var passingBeatArray = siteswapStr.match(/<[^ <>]+>/g);
			numJugglers = passingBeatArray[0].split("|").length;

			/* 
				check to make sure each beat in the passing pattern has the same number of jugglers 
				if a passing pattern only has 1 juggler than it's automatically a mismatch
			*/
			if(numJugglers == 1) {
				return siteswap;
			};
			
			var numJugglersTmp = numJugglers;
			passingBeatArray.map(function(a) { 
				if (a.split("|").length != numJugglersTmp) 
					{ return siteswap; } 
			});
		}

		/* the number of jugglers determines a valid pass pattern */
		var passPattern = "";
		if (numJugglers == 2) {
			passPattern = "P";
		} else if (numJugglers > 2) {
			passPattern = "P[1-" + numJugglers + "]";
		}

		/* construct the various regex patterns. see blog post for details about this */
		var validToss = "([\\da-o])x?A?(" + passPattern + ")?(C{(C|P)?})?(T{(C|P)?})?(B({\\d*(L|HL|F|HF)?\\d*})?)?(S{-?\\d+(.\\d+)?(,-?\\d+(.\\d+)?,-?\\d+(.\\d+)?,-?\\d+(.\\d+)?)?})?(D{\\d*\\.?\\d*})?";
		var validMultiplex = "\\[(" + validToss + ")+\\]";
		var validThrow = validToss + "|" + validMultiplex;
		var validSync = "\\((" + validThrow + "),(" + validThrow + ")\\)";
		var validBeat = "(" + validThrow + "|" + validSync + ")";
		var validPass = "<" + validBeat + "(\\|" + validBeat + ")+>";
		var validSiteswap = "^(" + validPass + ")+|(" + validBeat + ")+\\*?$";

		// use this to identify passing pattern shorthand like <3P333|3P333>
		// we will then convert those patterns to standard notation like <3P|3P><3|3><3|3><3|3> 
		// and parse them as we did before
		var validPassShorthand = "<" + validBeat + "+(\\|" + validBeat + "+)+>"; 

		validTossRe = new RegExp(validToss,"g");
		validMultiplexRe = new RegExp(validMultiplex,"g");
		validThrowRe = new RegExp(validThrow,"g");
		validSyncRe = new RegExp(validSync,"g");
		validBeatRe = new RegExp(validBeat,"g");
		validPassRe = new RegExp(validPass,"g");
		validSiteswapRe = new RegExp(validSiteswap,"g");
		validPassShorthandRe = new RegExp(validPassShorthand,"g");

		// if the input string was shorthand for a passing pattern
		// then replace the siteswap string with a fully formed passing pattern
		// ie. transform <33|33> to <3|3><3|3>
		if (siteswapStr.match(validPassShorthandRe) == siteswapStr) {
			var newSiteswapStr = "";
			var jugglerSiteswaps = siteswapStr.split('|');
			var jugglerBeats = [];
			for(var i = 0; i < jugglerSiteswaps.length; i++) {
				jugglerBeats.push(jugglerSiteswaps[i].match(validBeatRe));
			}
			for (var i = 0; i < jugglerBeats[0].length; i++) {
				newSiteswapStr += "<";
				for (var j = 0; j < jugglerBeats.length; j++) {
					newSiteswapStr += jugglerBeats[j][i];
					if (j < jugglerBeats.length - 1) {
						newSiteswapStr += "|";
					}
				}
				newSiteswapStr += ">";
			}
			siteswapStr = newSiteswapStr;
		}

		// if the input string was a synchronous siteswap ending in *
		// then we repeat the input pattern, but swap the throws in each pair
		// to make the pattern symmetric
		// e.g. transform (6x,4)* to (6x,4)(4,6x)
		if (siteswapStr.charAt(siteswapStr.length-1) == "*") {
			var newSiteswapStr = siteswapStr.slice(0,-1);
			var pairs = newSiteswapStr.match(validSyncRe);
			if (pairs !== null) {
				for (var i = 0; i < pairs.length; i++) {
					newSiteswapStr += "(" + pairs[i].match(validThrowRe).reverse().join(",") + ")";
				}
				siteswapStr = newSiteswapStr;
			}
		}

		if (siteswapStr.match(validSiteswapRe) == siteswapStr) {
			siteswap.validSyntax = true;
			siteswap.multiplex = siteswapStr.match(validMultiplexRe) ? true : false;
			siteswap.sync = siteswapStr.match(validSyncRe) ? true : false;
			siteswap.pass = siteswapStr.match(validPassRe) ? true : false;
			siteswap.numJugglers = numJugglers;
		} else {
			siteswap.errorMessage = "Invalid syntax";
		} 
	}

	/* helper to get all the tosses for a given beat's siteswap */
	function getTosses(tosses, siteswapStr, juggler, sync, hand, dwellPathIx) {
		if (siteswapStr.match(validPassRe)) {
			var patterns = siteswapStr.match(validBeatRe);
			patterns.map(function(s,ix) {
				dwellPathIx = getTosses(tosses, s, ix, undefined, undefined, dwellPathIx);
				});
		} else if (siteswapStr.match(validSyncRe)) {
			var patterns = siteswapStr.split(",");
			var leftToss = patterns[0].substr(1);
			var rightToss = patterns[1].substr(0,patterns[1].length-1);
			dwellPathIx = getTosses(tosses,leftToss,juggler,true,LEFT, dwellPathIx);
			dwellPathIx = getTosses(tosses,rightToss,juggler,true,RIGHT, dwellPathIx);
		} else if (siteswapStr.match(validMultiplexRe)) {
			var patterns = siteswapStr.match(validTossRe);
			patterns.map(function(s,ix,arr) {
				dwellPathIx = getTosses(tosses,s,juggler, undefined, hand, dwellPathIx);
				if (ix < arr.length-1) {
					if (dwellPathIx == 0) {
						dwellPathIx = siteswap.dwellPath.length-1;
					} else {
						dwellPathIx--;
					}					
				}
			});
		} else {
			/* will work from "a" to "z" */
			var numBeats = (siteswapStr[0].charCodeAt(0) >= 97 && siteswapStr[0].charCodeAt(0) <= 119) ? siteswapStr[0].charCodeAt(0)-87 : parseInt(siteswapStr[0]);
			var targetJuggler = juggler;

			var pIx = siteswapStr.indexOf("P");
			var isPass = false;
			if (
				pIx > 0 &&
				siteswapStr[pIx+1] != "}" // check that the next character isn't a }, in which case this is a catch/toss penguin modifier
			) {				
				if (siteswap.numJugglers > 2) {					
					targetJuggler = parseInt(siteswapStr[pIx+1])-1;
				} else {
					targetJuggler = 1 - juggler;
				}
				isPass = true;
			}

			var dIx = siteswapStr.indexOf("D");
			var dwellDuration;
			if (dIx > 0) {
				dwellDuration = siteswap.beatDuration*parseFloat(siteswapStr.substring(dIx+2,siteswapStr.indexOf("}")));
			} else {
				dwellDuration = siteswap.dwellDuration;
			}

			var numBounces = 0;
			var bounceOrder = [];
			var bIx = siteswapStr.indexOf("B");
			if (bIx > 0) {
				var bpIx;
				if (!isNaN(siteswapStr[bIx+3])) {
					bpIx = 3;
				} else if (!isNaN(siteswapStr[bIx+4])) {
					bpIx = 4;
				} else {
					bpIx = 2;
				}
				if (siteswapStr[bIx+1] == "{" && bpIx != undefined) {
					numBounces = parseInt(siteswapStr[bIx+bpIx]);
					for (var i = bIx + bpIx + 1; i < siteswapStr.length; i++) {
						if (!isNaN(siteswapStr[i])) {
							var surfaceIx = parseInt(siteswapStr[i]);
							if (surfaceIx >= siteswap.surfaces.length) {
								throw {message: "Bounce surface index out of range"};
							} else {
								bounceOrder.push(surfaceIx);
							}							
						} else {
							break;
						}
					}
				} else {
					numBounces = 1;
					bounceOrder = [0];
				}
				if (bounceOrder.length < numBounces) {
					var numMissingBounces = bounceOrder.length;
					for (var i = 0; i < numBounces-numMissingBounces; i++) {
						bounceOrder.push(0);
					}
				}
			}

			var bounceType = undefined;
			if (numBounces > 0) {
				if (siteswapStr.match("HF")) {
					bounceType = "HF";
				} else if (siteswapStr.match("HL")) {
					bounceType = "HL";
				} else if (siteswapStr.match("F")) {
					bounceType = "F";
				} else if (siteswapStr.match("L")) {
					bounceType = "L";
				} else {
					
					// determine appropriate bounce type according to some hardcoded timing constraints
					// these were determined via trial and error with the default bounce params
					var bounceTime = siteswap.beatDuration*numBeats - dwellDuration;
					if (bounceTime < .68) {
						bounceType = "HF";
					} else if (bounceTime < 1.25) {
						bounceType = "F";	
					} else {
						bounceType = "L";
					}

				}
			}

			var tIx = siteswapStr.indexOf("T");
			var tossType = 'standard';
			if (tIx > 0) {
				var tossTypeId = siteswapStr.substring(tIx+2,siteswapStr.indexOf('}',tIx));
				if (tossTypeId.match("C")) {
					tossType = 'claw';
				} else if (tossTypeId.match("P")) {
					tossTypeId = "penguin";
				}
			}

			var cIx = siteswapStr.indexOf("C");
			var catchType = 'standard';
			if (cIx > 0) {
				var catchTypeId = siteswapStr.substring(cIx+2,siteswapStr.indexOf('}',cIx));
				if (catchTypeId.match("C")) {
					catchType = 'claw';
				} else if (catchTypeId.match("P")) {
					catchType = 'penguin';
				}
			}

			var crossing = numBeats % 2 == 1 ? true : false;
			// if the second character is an "x" then crossing is flipped
			if (siteswapStr.length > 1 && siteswapStr[1] == "x") {
				crossing = !crossing;
			}

			if (siteswapStr[0] == "R") {
				hand = RIGHT;
			} else if (siteswapStr[0] == "L") {
				hand = LEFT;
			}

			var numSpins;
			var tossOrientation = normalize({x:.1,y:.1,z:1});

			var sIx = siteswapStr.indexOf("S");			
			if (sIx > 0) {
				
				var spinConfig = siteswapStr.substring(sIx+2,siteswapStr.indexOf('}',sIx)).match(/-?\d+(\.\d+)?/g);				
				numSpins = parseFloat(spinConfig[0]);

				if (spinConfig.length > 1) {
					tossOrientation.x = parseFloat(spinConfig[1]);
					tossOrientation.y = parseFloat(spinConfig[2]);
					tossOrientation.z = parseFloat(spinConfig[3]);
					normalize(tossOrientation);
				}

			} else {
				
				// if all props are balls then no spin
				var allBalls = true;
				siteswap.props.forEach(function(prop) { if (prop.type != 'ball') { allBalls = false; } });

				if (allBalls) {
					numSpins = 0;
				} else {
					numSpins = Math.floor(numBeats/2) + .2;
					// passes get an extra bit of spin
					if (isPass) {
						numSpins += .1;
					}
				}

			}

			tosses.push(
				{
					juggler: juggler,
					targetJuggler: targetJuggler,
					hand: hand,
					crossing: crossing,
					numBeats: numBeats,
					siteswapStr: siteswapStr,
					numBounces: numBounces,
					bounceOrder: bounceOrder,
					bounceType: bounceType,
					numSpins: numSpins,					
					dwellPathIx: dwellPathIx,
					dwellDuration: dwellDuration,
					tossType: tossType,
					catchType: catchType,
					tossOrientation: tossOrientation,
					rotationAxis: {x:1,y:0,z:0},
					hold: numBeats == 2 && !crossing && siteswapStr.indexOf("A") == -1 ? true : false
				}
			);

			// only advance dwellPathIx if the toss is > 0 beats
			if (numBeats > 0) {
				if (dwellPathIx == siteswap.dwellPath.length-1) {
					dwellPathIx = 0;
				} else {
					dwellPathIx++;
				}
			}

		}		

		return dwellPathIx;
	}

	/* check that the siteswap is a repeatable pattern */
	function validatePattern() {

		/* get the array of each siteswap.beats' tosses */
		siteswap.beats = siteswap.pass ? siteswapStr.match(validPassRe) : siteswapStr.match(validBeatRe);		

		/* add (0,0) after each synchronous throw - this prevents the halving issue */
		for(var i = 0; i < siteswap.beats.length; i++) {
			if (siteswap.beats[i].match(validSyncRe)) {
				siteswap.beats.splice(i+1,0,'(0,0)');
				i++;
			}
		}
		
		/* figure out how many props */
		var tmp = 0;
		siteswap.beats.map(function(beat) {
			if (beat.match(validPassRe)) {
				var patterns = beat.split('|');
				for (var i = 0; i < patterns.length; i++) {
					if (i == 0) {
						patterns[i] = patterns[i].substr(1);
					} 
					if (i == patterns.length-1) {
						patterns[i] = patterns[i].substr(0,patterns[i].length-1);
					}
					tmp += sumThrows(patterns[i]);
				}
			} else {
				tmp += sumThrows(beat);
			}
		});

		if((tmp/siteswap.beats.length % 1) == 0 && tmp/siteswap.beats.length > 0) {
			siteswap.numProps = tmp/siteswap.beats.length;
		} else {		
			siteswap.errorMessage = "Cannot determine number of props";
			return;
		}

		/* make sure props array is correct length */
		while (siteswap.props.length < siteswap.numProps) {
			siteswap.props.push(cloneObject(siteswap.props.last()));
		}
		while (siteswap.props.length > siteswap.numProps) {
			siteswap.props.pop();
		}

		siteswap.tosses = [];

		var dwellPathIx = 0;

		/* for each beat get all the tosses */
		for (var i = 0; i < siteswap.beats.length; i++) {
			var tosses = [];
			dwellPathIx = getTosses(tosses,siteswap.beats[i], 0 /* assume juggler 0 */, undefined, undefined, dwellPathIx);
			siteswap.tosses.push(tosses);

			/* if the dwell paths aren't starting over at the same time as the beats, restart the pattern */
			if (i == siteswap.beats.length-1 && dwellPathIx != 0) {
				i = -1; // will get set to 0 above
			}

		}

		/* figure out the max throw height which will inform the size of the state array */
		siteswap.maxHeight = 0;

		for (var i = 0; i < siteswap.tosses.length; i++) {
			for (var j = 0; j < siteswap.tosses[i].length; j++) {
				if(siteswap.tosses[i][j].numBeats > siteswap.maxHeight) {
					siteswap.maxHeight = siteswap.tosses[i][j].numBeats;
				}
			}
		}

		/* ------------------------------------ */
		/* GENERATE STATE ARRAY AND PROP ORBITS */
		/* ------------------------------------ */

		/* create a queue of props */
		var props = [];

		for (var i = 0; i < siteswap.numProps; i++) {
			props.push(i);
		}

		/* initialize the state and prop orbits array */
		siteswap.states = [];
		siteswap.propOrbits = [];
		siteswap.stateDiagram = [];

		/* initialize current state */
		var curState = [];
		for (var j = 0; j < siteswap.numJugglers; j++) {
			curState.push([[],[]]);
			for (var k = 0; k < siteswap.maxHeight; k++) {
				curState[j][LEFT].push(undefined);
				curState[j][RIGHT].push(undefined);
			}
		}

		var patternComplete = false;
		var initComplete = false;
		var beat = 0;
		var stateDiagramBeatCounter = 0;
		var hand = siteswap.startingHand;

		/* keep going until pattern complete */
		while (!patternComplete) {

			/* start constructing the state diagram by indicating which hand we're on */
			siteswap.stateDiagram.push([hand == 1 ? "R" : "L"]);
			/* add an asterisk to indicate when the cycle actually begins */
			if (beat == 0 && initComplete) {
				siteswap.stateDiagram[stateDiagramBeatCounter][0] += "*";
			}

			/* TODO: explain this */
			var tmpPropOrbits = cloneObject(siteswap.propOrbits);

			/* queue of props to throw this beat */
			var propsLanding = [];

			/* update the current state for each juggler */
			for (var j = 0; j < siteswap.numJugglers; j++) {
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
			var stateDiagramTossString = "";
			for (var j = 0; j < siteswap.tosses[beat % siteswap.tosses.length].length; j++) {
				
				var toss = siteswap.tosses[beat % siteswap.tosses.length][j];
				var tossHand = (toss.hand == undefined ? hand : toss.hand);
				var catchHand = (toss.crossing ? 1 - tossHand : tossHand);

				var prop = undefined;

				/* iterate through the props landing and look for one landing in the hand that this toss is occurring */
				for (var k = 0; k < propsLanding.length; k++) {
					if(propsLanding[k].juggler == toss.juggler && propsLanding[k].hand == tossHand) {
						
						/* if a prop is landing in a hand this is tossing a 0 then invalid siteswap */
						if (toss.numBeats == 0) {
							siteswap.errorMessage = "Prop landing on 0 toss at beat " + beat;
							return;
						}

						prop = propsLanding.splice(k,1)[0].propId;
						break;
					}
				}

				/* if no props landing to be thrown, get one from the queue - only if this isn't a 0 toss */
				if (prop == undefined && toss.numBeats > 0) {
					prop = props.shift();			
				} 

				/* if prop is still undefined (ie. there are none left) then we've got an invalid siteswap - only if this isn't a 0 toss */
				if (prop == undefined && toss.numBeats > 0) {
					siteswap.errorMessage = "No prop available to toss at beat " + beat;
					return;
				}
				
				stateDiagramTossString += (prop === undefined ? "X" : prop) + "-" + toss.siteswapStr;
				if(j < siteswap.tosses[beat % siteswap.tosses.length].length-1) {
					stateDiagramTossString += ",";
				}

				/* so long as this isn't a 0 toss, update the current state and append to prop orbits */
				if (toss.numBeats > 0) {
					
					if(!tmpPropOrbits[prop]) {
						tmpPropOrbits[prop] = [];
					}

					tmpPropOrbits[prop].push({beat: beat, numBeats: toss.numBeats, juggler: toss.juggler, hand: tossHand, numBounces: toss.numBounces, bounceType: toss.bounceType, bounceOrder: toss.bounceOrder, numSpins: toss.numSpins, dwellPathIx: toss.dwellPathIx, dwellDuration: toss.dwellDuration, tossType: toss.tossType, catchType: toss.catchType, tossOrientation: toss.tossOrientation, rotationAxis: toss.rotationAxis, hold: toss.hold });

					if(curState[toss.targetJuggler][catchHand][toss.numBeats-1] == undefined) {
						curState[toss.targetJuggler][catchHand][toss.numBeats-1] = [prop];
					} else {
						curState[toss.targetJuggler][catchHand][toss.numBeats-1].push(prop);
					}

				}
				
			}
			siteswap.stateDiagram[stateDiagramBeatCounter].push(stateDiagramTossString);
			curState[0][0].map(function(a) {
				if (a == undefined) {
					siteswap.stateDiagram[stateDiagramBeatCounter].push("X");
				} else {
					siteswap.stateDiagram[stateDiagramBeatCounter].push(a.reduce(function(p1,p2) { return p1.toString() + p2.toString(); } ));
				}
			});
			curState[0][1].map(function(a) {
				if (a == undefined) {
					siteswap.stateDiagram[stateDiagramBeatCounter].push("X");
				} else {
					siteswap.stateDiagram[stateDiagramBeatCounter].push(a.reduce(function(p1,p2) { return p1.toString() + p2.toString(); } ));
				}
			});
							

			/* if we're at the beginning of the toss array and we've returned to the original state, the pattern is complete */
			if (initComplete && beat % siteswap.tosses.length == 0 && arraysEqual(siteswap.states[0],curState)) {					
				patternComplete = true;				
			} else {
				/* add the current state to the state array and update prop orbits */
				siteswap.states.push(cloneObject(curState));
				siteswap.propOrbits = tmpPropOrbits;
			}					

			/* if all props have been introduced to pattern and we're at the end of the pattern, init is complete and steady-state pattern truly begins with the next beat */
			if (props.length == 0 && (beat+1) % siteswap.tosses.length == 0 && !initComplete) {
				initComplete = true;
				beat = -1;
				siteswap.states = []; /* reset the states and prop orbits */
				siteswap.propOrbits = [];
			}			

			beat++;
			stateDiagramBeatCounter++;
			hand = 1 - hand; //alternate hands

			/* fail safe in case the pattern is too long */
			if (beat > 1000) {
				siteswap.errorMessage = "Pattern took more than 1000 beats to repeat states"
				return;
			}

		}

		// check that we don't have a 1 toss with a dwellRatio >= 1 which would cause dwellDuration >= beatDuration which is impossible
		for (var i = 0; i < siteswap.tosses.length; i++) {
			for (var j = 0; j < siteswap.tosses[i].length; j++) {
				if (siteswap.tosses[i][j].numBeats > 0 && siteswap.tosses[i][j].dwellDuration >= siteswap.beatDuration*siteswap.tosses[i][j].numBeats) {
					siteswap.errorMessage = "Cannot have a '1' toss with a dwellRatio >= 1"
				}
			}
		}

		/* if we've gotten to this point, the pattern is repeatable and thus valid */
		siteswap.numSteps = siteswap.states.length*siteswap.numStepsPerBeat;
		siteswap.validPattern = true;
	}

	function generatePropPositions() {

		try {

			// clear flight path cache
			flightPathCache = {};

			/* initialize prop positions */
			var propPositions = [];
			for (var i = 0; i < siteswap.numProps; i++) {
				propPositions.push([]);
			}

			/* init prop rotations */
			var propRotations = [];
			for (var i = 0; i < siteswap.numProps; i++) {
				propRotations.push([]);
			}

			/* initialize juggler hand positions */
			var jugglerHandPositions = [];
			for (var i = 0; i < siteswap.numJugglers; i++) {
				jugglerHandPositions.push([[],[]]);
			}
			var jugglerElbowPositions = [];
			for (var i = 0; i < siteswap.numJugglers; i++) {
				jugglerElbowPositions.push([[],[]]);
			}

			/* generate prop positions */
			for (var step = 0; step < siteswap.numSteps; step++) {
				
				var tmpJugglerHandPositions = [];
				for (var i = 0; i < siteswap.numJugglers; i++) {
					tmpJugglerHandPositions.push([undefined,undefined]);
				}

				var currentBeat = Math.floor(step*siteswap.states.length/siteswap.numSteps);
				var currentTime = siteswap.beatDuration*step*siteswap.states.length/siteswap.numSteps;

				/* find the current state of each prop */
				for(var prop = 0; prop < siteswap.numProps; prop++) {					

					var prevToss = undefined, curToss = undefined, nextToss = undefined;
					
					var orbitBeatFound = false;
					for (var i = 0; i < siteswap.propOrbits[prop].length; i++) {
						if (!orbitBeatFound && (i == siteswap.propOrbits[prop].length-1 || (siteswap.propOrbits[prop][i].beat <= currentBeat && siteswap.propOrbits[prop][i+1].beat > currentBeat))) {
							
							prevToss = siteswap.propOrbits[prop].getPreviousCyclic(i);
							curToss = siteswap.propOrbits[prop][i];
							nextToss = siteswap.propOrbits[prop].getNextCyclic(i);

							orbitBeatFound = true;

						} 
					}

					var tossTime = curToss.beat*siteswap.beatDuration+curToss.dwellDuration;
					var catchTime = nextToss.beat*siteswap.beatDuration;
					if (tossTime > catchTime && catchTime <= currentTime) {
						catchTime += (siteswap.beatDuration*siteswap.states.length);	
					}					
					else if (tossTime > catchTime && catchTime > currentTime) { 
						tossTime -= (siteswap.beatDuration*siteswap.states.length);
					}

					var lastTossTime = prevToss.beat*siteswap.beatDuration+prevToss.dwellDuration;
					var lastCatchTime = curToss.beat*siteswap.beatDuration;
					if (lastTossTime > lastCatchTime && lastCatchTime <= currentTime) {
						lastCatchTime += (siteswap.beatDuration*siteswap.states.length);	
					}
					else if (lastTossTime > lastCatchTime && lastCatchTime > currentTime) { 
						lastTossTime -= (siteswap.beatDuration*siteswap.states.length);
					}

					if (currentTime < tossTime) {
						/* interpolate dwell path */

						var launches = [];
						var landings = [];

						// iterate over all other props to see if any others are in the hand now as well
						if (siteswap.multiplex) {
							for (var i = 0; i < siteswap.propOrbits.length; i++) {
								if (i != prop) {
									for (j = 0; j < siteswap.propOrbits[i].length; j++) {
										var multiplexCurToss = siteswap.propOrbits[i][j];

										if (curToss.beat == multiplexCurToss.beat && curToss.juggler == multiplexCurToss.juggler && curToss.hand == multiplexCurToss.hand) {
											
											var multiplexNextToss = j == siteswap.propOrbits[i].length-1 ? siteswap.propOrbits[i][0] : siteswap.propOrbits[i][j+1];
											var multiplexPrevToss = j == 0 ? siteswap.propOrbits[i][siteswap.propOrbits[i].length-1] : siteswap.propOrbits[i][j-1];

											var multiplexTossTime = multiplexCurToss.beat*siteswap.beatDuration+multiplexCurToss.dwellDuration;
											var multiplexCatchTime = multiplexNextToss.beat*siteswap.beatDuration;
											if (multiplexTossTime > multiplexCatchTime && multiplexCatchTime <= currentTime) {
												multiplexCatchTime += (siteswap.beatDuration*siteswap.states.length);	
											}					
											else if (multiplexTossTime > multiplexCatchTime && multiplexCatchTime > currentTime) { 
												multiplexTossTime -= (siteswap.beatDuration*siteswap.states.length);
											}

											var multiplexLastTossTime = multiplexPrevToss.beat*siteswap.beatDuration+multiplexPrevToss.dwellDuration;
											var multiplexLastCatchTime = multiplexCurToss.beat*siteswap.beatDuration;
											if (multiplexLastTossTime > multiplexLastCatchTime && multiplexLastCatchTime <= currentTime) {
												multiplexLastCatchTime += (siteswap.beatDuration*siteswap.states.length);	
											}
											else if (multiplexLastTossTime > multiplexLastCatchTime && multiplexLastCatchTime > currentTime) { 
												multiplexLastTossTime -= (siteswap.beatDuration*siteswap.states.length);
											}

											launches.push(interpolateFlightPath(
												getDwellPosition(removeEmptyPositions(siteswap.dwellPath[multiplexCurToss.dwellPathIx]),multiplexCurToss.juggler,multiplexCurToss.hand,1), /* p0 */
												getDwellPosition(removeEmptyPositions(siteswap.dwellPath[multiplexNextToss.dwellPathIx]),multiplexNextToss.juggler,multiplexNextToss.hand,0), /* p1 */
												(multiplexCatchTime - multiplexTossTime),
												0,								
												{
													numBounces: multiplexCurToss.numBounces, 
													bounceType: multiplexCurToss.bounceType, 
													bounceOrder: multiplexCurToss.bounceOrder,
													R: siteswap.props[i].radius, 
													C: siteswap.props[i].C
												}
											));

											landings.push(interpolateFlightPath(
												getDwellPosition(removeEmptyPositions(siteswap.dwellPath[multiplexPrevToss.dwellPathIx]),multiplexPrevToss.juggler,multiplexPrevToss.hand,1), /* p0 */
												getDwellPosition(removeEmptyPositions(siteswap.dwellPath[multiplexCurToss.dwellPathIx]),multiplexCurToss.juggler,multiplexCurToss.hand,0), /* p1 */
												(multiplexLastCatchTime - multiplexLastTossTime),
												(multiplexLastCatchTime - multiplexLastTossTime),
												{
													numBounces: multiplexPrevToss.numBounces, 
													bounceType: multiplexPrevToss.bounceType,
													bounceOrder: multiplexPrevToss.bounceOrder, 
													R: siteswap.props[i].radius, 
													C: siteswap.props[i].C
												}
											));										
										}
									}
								}
							}
						}						

						launches.push(interpolateFlightPath(
								getDwellPosition(removeEmptyPositions(siteswap.dwellPath[curToss.dwellPathIx]),curToss.juggler,curToss.hand,1), /* p0 */
								getDwellPosition(removeEmptyPositions(siteswap.dwellPath[nextToss.dwellPathIx]),nextToss.juggler,nextToss.hand,0), /* p1 */
								(catchTime - tossTime),
								0,								
								{
									numBounces: curToss.numBounces, 
									bounceType: curToss.bounceType, 
									bounceOrder: curToss.bounceOrder,
									R: siteswap.props[prop].radius, 
									C: siteswap.props[prop].C
								}
							));

						landings.push(interpolateFlightPath(
								getDwellPosition(removeEmptyPositions(siteswap.dwellPath[prevToss.dwellPathIx]),prevToss.juggler,prevToss.hand,1), /* p0 */
								getDwellPosition(removeEmptyPositions(siteswap.dwellPath[curToss.dwellPathIx]),curToss.juggler,curToss.hand,0), /* p1 */
								(lastCatchTime - lastTossTime),
								(lastCatchTime - lastTossTime),
								{
									numBounces: prevToss.numBounces, 
									bounceType: prevToss.bounceType,
									bounceOrder: prevToss.bounceOrder, 
									R: siteswap.props[prop].radius, 
									C: siteswap.props[prop].C
								}
							));

						var land = {dx: 0, dy: 0, dz: 0, x: 0, y: 0, z:0};
						var launch = {dx: 0, dy: 0, dz: 0, x: 0, y: 0, z:0};
						for (i = 0; i < landings.length; i++) {
							land.dx += landings[i].dx/landings.length;
							land.dy += landings[i].dy/landings.length;
							land.dz += landings[i].dz/landings.length;
							land.x += landings[i].x/landings.length;
							land.y += landings[i].y/landings.length;
							land.z += landings[i].z/landings.length;

							launch.dx += launches[i].dx/landings.length;
							launch.dy += launches[i].dy/landings.length;
							launch.dz += launches[i].dz/landings.length;
							launch.x += launches[i].x/landings.length;
							launch.y += launches[i].y/landings.length;
							launch.z += launches[i].z/landings.length;
						}

						//var land = landings.last();
						//var launch = launches.last();

						var t = 1-(tossTime - currentTime)/curToss.dwellDuration;
						var pos = getDwellPosition(
							removeEmptyPositions(siteswap.dwellPath[curToss.dwellPathIx])
							, curToss.juggler
							, curToss.hand
							, t
							, land
							, launch
							, siteswap.dwellCatchScale
							, siteswap.dwellTossScale
						);

						// the landing return by flight path interpolation may be slightly off (if solved by BounceGA)
						// in this case we should find the correct landing and interpolate between the two 
						var correctLand = getDwellPosition(removeEmptyPositions(siteswap.dwellPath[curToss.dwellPathIx]),curToss.juggler,curToss.hand,0);

						var landingDiff = {x: land.x - correctLand.x, y: land.y - correctLand.y, z: land.z - correctLand.z};
						pos.x += (1-t)*landingDiff.x;
						pos.y += (1-t)*landingDiff.y;
						pos.z += (1-t)*landingDiff.z;
						var catchAngle = Math.atan2(-land.dx,-land.dy);
						var tossAngle = Math.atan2(launch.dx,launch.dy);
						if (curToss.tossType == 'claw') {
							tossAngle -= Math.PI;
						} else if (curToss.tossTypeId == 'penguin') {
							tossAngle -= 2*Math.PI;
						}
						if (curToss.catchType == 'claw') {
							catchAngle -= Math.PI;
						} else if (curToss.catchType == 'penguin') {
							catchAngle -= 2*Math.PI;
						}
						pos.angle = catchAngle + t*(tossAngle-catchAngle);						
						if (curToss.hand == RIGHT)
							pos.angle *= -1;

						pos.dwell = true;
						
						propPositions[prop].push(pos);
						
						/* assign juggler hand positions */
						if (tmpJugglerHandPositions[curToss.juggler][curToss.hand] == undefined) {
							tmpJugglerHandPositions[curToss.juggler][curToss.hand] = pos;
						}					

						var q = getPropQuaternion(prevToss.tossOrientation, prevToss.rotationAxis, siteswap.jugglers[prevToss.juggler].rotation, prevToss.numSpins*2*Math.PI, prevToss.hand);
						var q2 = getPropQuaternion(curToss.tossOrientation, curToss.rotationAxis, siteswap.jugglers[curToss.juggler].rotation, 0, curToss.hand);
						q.slerp(q2, t);
						propRotations[prop].push(q);
					} 
					else if (curToss.hold) {

						// extra dwell path for the hold is from the end of the dwell path for the current toss 
						// to the beginning of the dwell path for the next toss
						var dwellPath = [siteswap.dwellPath[curToss.dwellPathIx].last(), siteswap.dwellPath[nextToss.dwellPathIx][0]];

						// velocity of toss if it wasn't held
						var T = curToss.numBeats*siteswap.beatDuration-curToss.dwellDuration;
						var v_0 = interpolateFlightPath(
							getDwellPosition(removeEmptyPositions(siteswap.dwellPath[curToss.dwellPathIx]),curToss.juggler,curToss.hand,1),
							getDwellPosition(removeEmptyPositions(siteswap.dwellPath[nextToss.dwellPathIx]),nextToss.juggler,nextToss.hand,0),
							T,
							0
						);

						// velocity of catch if it wasn't held
						var v_T = interpolateFlightPath(
							getDwellPosition(removeEmptyPositions(siteswap.dwellPath[curToss.dwellPathIx]),curToss.juggler,curToss.hand,1),
							getDwellPosition(removeEmptyPositions(siteswap.dwellPath[nextToss.dwellPathIx]),nextToss.juggler,nextToss.hand,0),
							T,
							T
						);
						
						// using the velocity of the toss/catch if it wasn't held to help inform the additional dwell path
						// there's really no right way to do this part, you don't need the velocity of the toss/catch if it wasn't held
						// but it helps it look better
						pos = getDwellPosition(
							removeEmptyPositions(dwellPath)
							, curToss.juggler
							, curToss.hand
							, (currentTime-tossTime)/(catchTime-tossTime)
							, v_0
							, v_T
							, siteswap.emptyTossScale
							, siteswap.emptyCatchScale
						);

						var catchAngle = Math.atan2(-v_0.dx,-v_0.dy);
						var tossAngle = Math.atan2(v_T.dx,v_T.dy);
						if (curToss.tossType == 'claw') {
							tossAngle -= Math.PI;
						} else if (curToss.tossTypeId == 'penguin') {
							tossAngle -= 2*Math.PI;
						}
						if (curToss.catchType == 'claw') {
							catchAngle -= Math.PI;
						} else if (curToss.catchType == 'penguin') {
							catchAngle -= 2*Math.PI;
						}
						pos.angle = catchAngle + (currentTime-(tossTime-curToss.dwellDuration))/(catchTime-(tossTime-curToss.dwellDuration))*(tossAngle-catchAngle);						
						if (curToss.hand == RIGHT)
							pos.angle *= -1;

						pos.dwell = true;
						
						propPositions[prop].push(pos);
						
						/* assign juggler hand positions */
						if (tmpJugglerHandPositions[curToss.juggler][curToss.hand] == undefined) {
							tmpJugglerHandPositions[curToss.juggler][curToss.hand] = pos;
						}					

						var q = getPropQuaternion(curToss.tossOrientation, curToss.rotationAxis, siteswap.jugglers[curToss.juggler].rotation, 0, curToss.hand);
						var q2 = getPropQuaternion(nextToss.tossOrientation, nextToss.rotationAxis, siteswap.jugglers[nextToss.juggler].rotation, 0, nextToss.hand);
						q.slerp(q2, (currentTime-(tossTime-curToss.dwellDuration))/(catchTime-(tossTime-curToss.dwellDuration)));
						propRotations[prop].push(q);

					}
					else {

						/*
						calculate position at current time
						*/

						var T = catchTime - tossTime;
						var t = currentTime - tossTime;						
						var pos;							

						// if not holding prop then interpolate flight path

						pos = interpolateFlightPath(
							getDwellPosition(removeEmptyPositions(siteswap.dwellPath[curToss.dwellPathIx]),curToss.juggler,curToss.hand,1), /* p0 */
							getDwellPosition(removeEmptyPositions(siteswap.dwellPath[nextToss.dwellPathIx]),nextToss.juggler,nextToss.hand,0), /* p1 */
							T,
							t,
							{
								numBounces: curToss.numBounces, 
								bounceType: curToss.bounceType, 
								bounceOrder: curToss.bounceOrder,
								R: siteswap.props[prop].radius, 
								C: siteswap.props[prop].C
							}
						);

						pos.dwell = false;

						propPositions[prop].push(pos);

						var catchRotation = curToss.numSpins*2*Math.PI;
						var tossRotation = 0;
						var currentRotation = tossRotation + (t/T)*(catchRotation - tossRotation);

						propRotations[prop].push(getPropQuaternion(curToss.tossOrientation, curToss.rotationAxis, siteswap.jugglers[curToss.juggler].rotation, currentRotation, curToss.hand));

					}					

				}

				/* set hand positions that weren't set - ie. empty hands */
				for (var juggler = 0; juggler < siteswap.numJugglers; juggler++) {
					for (var hand = 0; hand <= 1; hand++) {
						if(tmpJugglerHandPositions[juggler][hand] == undefined) {
							
							/* need 
								nextToss - to determine where the hand is going to
								propLastToss - to determine where the prop we're catching came from so we know its catch velocity
								lastToss - to determine where the hand is coming from
								propNextToss - to determine where the prop we just tossed is going so we know its toss velocity
							*/


							/* find the next beat a prop is going to be in this hand and linearly move to the catch position */
							var nextToss = undefined, minToss = undefined, lastToss = undefined, maxToss = undefined;
							var minTossProp = undefined, minTossOrbit = undefined, nextTossProp = undefined, nextTossOrbit = undefined, maxTossProp = undefined, maxTossOrbit = undefined, lastTossProp = undefined, lastTossOrbit = undefined;
							var propLastToss = undefined, propNextToss = undefined;

							for (var prop = 0; prop < siteswap.propOrbits.length; prop++) {
								for (var orbit = 0; orbit < siteswap.propOrbits[prop].length; orbit++) {
									if (siteswap.propOrbits[prop][orbit].juggler == juggler && siteswap.propOrbits[prop][orbit].hand == hand) {
										
										// min beat
										if (minToss == undefined || siteswap.propOrbits[prop][orbit].beat < minToss.beat) {
											minToss = siteswap.propOrbits[prop][orbit];
											minTossProp = prop;
											minTossOrbit = orbit;
										}
										// next beat
										if (siteswap.propOrbits[prop][orbit].beat > currentBeat && (nextToss == undefined || siteswap.propOrbits[prop][orbit].beat < nextToss.beat)) {
											nextToss = siteswap.propOrbits[prop][orbit];
											nextTossProp = prop;
											nextTossOrbit = orbit;
										}
										
										// max beat
										if (maxToss == undefined || siteswap.propOrbits[prop][orbit].beat > maxToss.beat) {
											maxToss = siteswap.propOrbits[prop][orbit];
											maxTossProp = prop;
											maxTossOrbit = orbit;
										}
										// last beat
										if (siteswap.propOrbits[prop][orbit].beat <= currentBeat && (lastToss == undefined || siteswap.propOrbits[prop][orbit].beat > lastToss.beat)) {
											lastToss = siteswap.propOrbits[prop][orbit];
											lastTossProp = prop;
											lastTossOrbit = orbit;
										}
									}
								}
							}

							if (nextToss == undefined) {
								nextToss = minToss;
								nextTossProp = minTossProp;
								nextTossOrbit = minTossOrbit;
							}
							if (lastToss == undefined) {
								lastToss = maxToss;
								lastTossProp = maxTossProp;
								lastTossOrbit = maxTossOrbit;
							}							

							// if nextToss and lastToss are still undefined, it means this hand is not making any tosses, in a pattern like (4,0)
							if (nextToss == undefined && lastToss == undefined) {
								
								var pos = getDwellPosition([{x:.20,y:0,z:0}],juggler,hand,0);
								pos.angle = 0;

							} else {

								if (nextTossOrbit == 0) {
									propLastToss = siteswap.propOrbits[nextTossProp].last();
								} else {
									propLastToss = siteswap.propOrbits[nextTossProp][nextTossOrbit-1];
								}

								if (lastTossOrbit == siteswap.propOrbits[lastTossProp].length-1) {
									propNextToss = siteswap.propOrbits[lastTossProp][0];
								} else {
									propNextToss = siteswap.propOrbits[lastTossProp][lastTossOrbit+1];
								}

								var nextCatchTime = nextToss.beat*siteswap.beatDuration;
								if (nextCatchTime < currentTime) {
									nextCatchTime += (siteswap.beatDuration*siteswap.states.length);
								}
								var lastThrowTime = lastToss.beat*siteswap.beatDuration+lastToss.dwellDuration;
								if (lastThrowTime > currentTime) {
									lastThrowTime -= (siteswap.beatDuration*siteswap.states.length);
								}
								var propNextCatchTime = propNextToss.beat*siteswap.beatDuration;
								if (propNextCatchTime < lastThrowTime) {
									propNextCatchTime += (siteswap.beatDuration*siteswap.states.length);
								}
								var propLastThrowTime = propLastToss.beat*siteswap.beatDuration+propLastToss.dwellDuration;
								if (propLastThrowTime > nextCatchTime) {
									propLastThrowTime -= (siteswap.beatDuration*siteswap.states.length);
								}

								var v_0 = interpolateFlightPath(
									getDwellPosition(removeEmptyPositions(siteswap.dwellPath[lastToss.dwellPathIx]),lastToss.juggler,lastToss.hand,1), /* p0 */
									getDwellPosition(removeEmptyPositions(siteswap.dwellPath[propNextToss.dwellPathIx]),propNextToss.juggler,propNextToss.hand,0), /* p1 */
									lastToss.numBeats*siteswap.beatDuration-lastToss.dwellDuration,
									0,
									{
										numBounces: lastToss.numBounces, 
										bounceType: lastToss.bounceType,
										bounceOrder: lastToss.bounceOrder,
										R: siteswap.props[lastTossProp].radius, 
										C: siteswap.props[lastTossProp].C
									}
								);
								var v_T = interpolateFlightPath(
									getDwellPosition(removeEmptyPositions(siteswap.dwellPath[propLastToss.dwellPathIx]),propLastToss.juggler,propLastToss.hand,1), /* p0 */
									getDwellPosition(removeEmptyPositions(siteswap.dwellPath[nextToss.dwellPathIx]),nextToss.juggler,nextToss.hand,0), /* p1 */
									propLastToss.numBeats*siteswap.beatDuration-propLastToss.dwellDuration,
									propLastToss.numBeats*siteswap.beatDuration-propLastToss.dwellDuration,
									{
										numBounces: propLastToss.numBounces, 
										bounceType: propLastToss.bounceType,
										bounceOrder: propLastToss.bounceOrder,
										R: siteswap.props[nextTossProp].radius, 
										C: siteswap.props[nextTossProp].C
									}
								);

								var t = (currentTime - lastThrowTime)/(nextCatchTime - lastThrowTime);
								
								var emptyPath = [];
								// get toss position + empty positions (if any) from last toss
								var lastTossPath = siteswap.dwellPath[lastToss.dwellPathIx];
								for (var i = 0; i < lastTossPath.length; i++) {
									if (lastTossPath[i].empty) {
										// if this is the first empty then the last position was the toss position
										if (emptyPath.length == 0) {
											emptyPath.push(lastTossPath[i-1]);
										}																				
										emptyPath.push(lastTossPath[i]);
									}
								}
								// if empty never found then just take the last position
								if (emptyPath.length == 0) {
									emptyPath.push(lastTossPath.last());
								}
								// add catch position for next toss
								emptyPath.push(siteswap.dwellPath[nextToss.dwellPathIx][0]);

								var pos = getDwellPosition(
									emptyPath
									, lastToss.juggler
									, lastToss.hand
									, t
									, v_0
									, v_T
									, siteswap.emptyTossScale
									, siteswap.emptyCatchScale
								);

								var correctCatch = getDwellPosition(
									emptyPath
									, lastToss.juggler
									, lastToss.hand
									, 1
								);							

								var catchDiff = {x: v_T.x - correctCatch.x, y: v_T.y - correctCatch.y, z: v_T.z - correctCatch.z};
								pos.x += (t)*catchDiff.x;
								pos.y += (t)*catchDiff.y;
								pos.z += (t)*catchDiff.z;						

								var catchAngle = Math.atan2(-v_T.dx,-v_T.dy);
								var tossAngle = Math.atan2(v_0.dx,v_0.dy);
								if (lastToss.tossType == 'claw') {
									tossAngle -= Math.PI;
								} else if (lastToss.tossType == 'penguin') {
									tossAngle -= 2*Math.PI;
								}
								if (nextToss.catchType == 'claw') {
									catchAngle -= Math.PI;
								} else if (nextToss.catchType == 'penguin') {
									catchAngle -= 2*Math.PI;
								}
								pos.angle = tossAngle + t*(catchAngle-tossAngle);
								if (hand == RIGHT) {
									pos.angle *= -1;
								}
							}

							tmpJugglerHandPositions[juggler][hand] = pos;
						}					

						jugglerHandPositions[juggler][hand].push(tmpJugglerHandPositions[juggler][hand]);
						jugglerElbowPositions[juggler][hand].push(
							getElbowPosition(
								// shoulder position
								{
									x:siteswap.jugglers[juggler].position.x+Math.cos(siteswap.jugglers[juggler].rotation)*(hand == LEFT ? - 1 : 1)*.225
									, y:1.425
									, z:siteswap.jugglers[juggler].position.z+Math.sin(siteswap.jugglers[juggler].rotation)*(hand == LEFT ? - 1 : 1)*.225
								},
								tmpJugglerHandPositions[juggler][hand], // hand position
								.45, // half arm length
								siteswap.armAngle, // chicken wing factor
								hand // hand
							)
						);						

					}

				}

			}

			siteswap.propPositions = propPositions;
			siteswap.propRotations = propRotations;
			siteswap.jugglerHandPositions = jugglerHandPositions;
			siteswap.jugglerElbowPositions = jugglerElbowPositions;

			siteswap.collision = checkForCollision();

		} catch(e) {
			siteswap.errorMessage = e.message;
		}
	}

	/* interpolate flight path */	
	function interpolateFlightPath(p0, p1, T, t, options) {
		/*
		p0 - starting position
		p1 - ending position
		T - total time
		t - time elapsed
		options - configurable parameters
			- bounceType - L,F,HL,HF
			- dt - time increment for bounce simulation
			- eps - margin of error acceptable for bouncing
			- dv - velocity increment for bouncing
			- numBounces
			- G - gravity
			- C - coefficient of restitution
			- tries - # of times to try and get it right before throwing error
			- R - radius of prop
		*/

		// round T to 2 decimal places for the sake of the flight path cache
		T = parseFloat(T.toFixed(2));

		if (options == undefined) { options = {}; }

		/* set defaults */
		if (!options.bounceType)
			options.bounceType = "L";
		if (!options.dt)
			options.dt = .01;
		if (!options.eps) 
			options.eps = .01;
		if (!options.dv)
			options.dv = .01;
		if (!options.numBounces)
			options.numBounces = 0;
		if (!options.bounceOrder)
			options.bounceOrder = [0];
		if (!options.G)
			options.G = -9.8;
		if (!options.C)
			options.C = .95;
		if (!options.tries) 
			options.tries = 10000;
		if (!options.R) /* should this one be required? */
			options.R = .1;

		var inputKey = JSON.stringify({p0:p0,p1:p1,T:T,options:options});

		if (options.numBounces == 0) {
			
			return  {
				x: p0.x + (p1.x-p0.x)*t/T,
				y: p0.y + (p1.y - p0.y - .5*options.G*T*T)*t/T + .5*options.G*t*t,
				z: p0.z + (p1.z-p0.z)*t/T,
				dx: (p1.x-p0.x)/T,
				dy: (p1.y - p0.y -.5*options.G*T*T)/T + options.G*t,
				dz: (p1.z-p0.z)/T
			};

		} else if (flightPathCache[inputKey] == undefined) {

			var fitnessConfig = {
				p0: p0,
				pT: p1,
				minT: T,
				maxT: T,
				R: options.R,
				C: options.C,
				dt: options.dt,
				G: -9.8,
				numBounces: options.numBounces,
				surfaceBounceOrder: options.bounceOrder,
				tossSign: options.bounceType == 'L' || options.bounceType == 'HL' ? 1 : -1,
				catchSign: options.bounceType == 'L' || options.bounceType == 'HF' ? 1 : -1,
				surfaces: siteswap.surfaces
			};

			var gaConfig = {
				maxGenerations: 500,
				populationSize: 50,
				mutationChance: .7,
				mutationScale: 5,
				initialScale: 40,
				fitnessThreshold: .05,
				noGA: false
			};

			ga = new BounceGA(gaConfig,fitnessConfig);
			ga.evolve();

			if (!ga.ableToFindSolution) {
				/* TODO - improve error to explain why the bounce path couldn't be calculated */
				throw {message: 'Unable to calculate bounce path'};
			}

			var gaResult = ga.getBouncePath(ga.fittestMembers[ga.fittestMembers.length-1].v);

			flightPathCache[inputKey] = {path: gaResult.path, velocities: gaResult.velocities};

		}

		var flightPath = flightPathCache[inputKey];
		return {
			x: flightPath.path[Math.floor((flightPath.path.length-1)*t/T)].x,
			y: flightPath.path[Math.floor((flightPath.path.length-1)*t/T)].y,
			z: flightPath.path[Math.floor((flightPath.path.length-1)*t/T)].z,
			dx: flightPath.velocities[Math.floor((flightPath.velocities.length-1)*t/T)].x,
			dy: flightPath.velocities[Math.floor((flightPath.velocities.length-1)*t/T)].y,
			dz: flightPath.velocities[Math.floor((flightPath.velocities.length-1)*t/T)].z,
		};
	}

	function removeEmptyPositions(dwellPath) {

		// remove the empty positions from the dwell path
		var P = [];
		for (var i = 0; i < dwellPath.length; i++) {
			if (!dwellPath[i].empty) {
				P.push(dwellPath[i]);
			}
		}

		return P;

	}

	function getDwellPosition(P,juggler,hand,t,v_0,v_T,v_0scale,v_Tscale,matchVelocity) {

		if (hand == LEFT && (v_0 || v_T)) {
			v_0.dx *= -1;
			v_T.dx *= -1;
		}		

		// juggler rotation transformation should be done before interpolating spline

		var dwellPosition = Bezier.interpolateBezierSpline(P,t,v_0,v_T,v_0scale,v_Tscale,matchVelocity);

		return {
			x: siteswap.jugglers[juggler].position.x + ((hand == LEFT ? -1 : 1)*dwellPosition.x)*Math.cos(siteswap.jugglers[juggler].rotation) - (dwellPosition.z - .4125)*Math.sin(siteswap.jugglers[juggler].rotation),
			y: 1.0125 + dwellPosition.y,
			z: siteswap.jugglers[juggler].position.z + ((hand == LEFT ? -1 : 1)*dwellPosition.x)*Math.sin(siteswap.jugglers[juggler].rotation) + (dwellPosition.z - .4125)*Math.cos(siteswap.jugglers[juggler].rotation)
		};
	}

	function getElbowPosition(S,H,l,w,hand) {
		w*=-1;
		
		var Hp = {};
		Hp.x = H.x - S.x;
		Hp.y = H.y - S.y;
		Hp.z = H.z - S.z;

		var Hpp = {};
		Hpp.x = Math.sqrt(Hp.x*Hp.x + Hp.z*Hp.z);
		Hpp.y = Hp.y;
		Hpp.z = 0;

		var th = Math.atan2(Hp.z,Hp.x);

		var magHp = Math.sqrt(Hp.x*Hp.x + Hp.y*Hp.y + Hp.z*Hp.z);

		/* magically stretch arms */
		if (2*l < magHp) {
			l = magHp/2;
		}

		var u1 = {};
		u1.x = Hpp.y/magHp;
		u1.y = -Hpp.x/magHp;
		u1.z = 0;

		var u2 = {x:0,y:0};
		if (hand == 1) {
			u2.z = -1;
		} else {
			u2.z = 1;
		}

		var h = Math.sqrt(l*l - .25*magHp*magHp);

		var Epp = {};
		Epp.x = Hpp.x/2 + h*u1.x*Math.cos(w) + h*u2.x*Math.sin(w);
		Epp.y = Hpp.y/2 + h*u1.y*Math.cos(w) + h*u2.y*Math.sin(w);
		Epp.z = Hpp.z/2 + h*u1.z*Math.cos(w) + h*u2.z*Math.sin(w);

		var Ep = {};
		Ep.x = Epp.x*Math.cos(th) - Epp.z*Math.sin(th);
		Ep.y = Epp.y;
		Ep.z = Epp.x*Math.sin(th) + Epp.z*Math.cos(th);	

		var E = {};
		E.x = Ep.x + S.x;
		E.y = Ep.y + S.y;
		E.z = Ep.z + S.z;


		return E;
	}	

	function getPropQuaternion (tossOrientation, rotationAxis, jugglerRotation, propRotation, hand) {

		T = new THREE.Vector3(tossOrientation.x,tossOrientation.y,tossOrientation.z);
		R = new THREE.Vector3(rotationAxis.x,rotationAxis.y,rotationAxis.z);
		C = new THREE.Vector3(0,-1,0);

		if (hand == LEFT) {
			T.x *= -1;	
			R.x *= -1;
		}

		// rotate by juggler's rotation
		var Q1 = new THREE.Quaternion();
		Q1.setFromAxisAngle(new THREE.Vector3(0,-1,0), jugglerRotation);
		T.applyQuaternion(Q1);
		
		// get rotation to tossOrientation
		var Q2 = new THREE.Quaternion();
		Q2.setFromAxisAngle(new THREE.Vector3(T.z,0,-T.x), Math.acos(T.y));		
		
		// rotate rotationAxis according to tossOrientation
		var RQ = new THREE.Quaternion();
		RQ.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.acos(-R.z*T.x + R.x*T.z));
		R.applyQuaternion(RQ);
		
		// rotate according to prop rotation
		var Q3 = new THREE.Quaternion();
		Q3.setFromAxisAngle(R, propRotation);
		
		// return composite rotation
		var q = new THREE.Quaternion();
		q = (new THREE.Quaternion()).multiplyQuaternions(Q2,Q3);
		
		return q;

	}

	function checkForCollision() {
		var r1, r2;
		// iterate over each props positions array
		for (var i = 0; i < siteswap.propPositions.length; i++) {			
			r1 = siteswap.props[i].radius;
			// iterate over all positions
			for (var j = 0; j < siteswap.propPositions[i].length; j++) {				
				// check position against all other props at that time
				for (var k = i+1; k < siteswap.propPositions.length; k++) {
					r2 = siteswap.props[i].radius;
					if (
						Math.sqrt(
							Math.pow(siteswap.propPositions[i][j].x-siteswap.propPositions[k][j].x,2)+
							Math.pow(siteswap.propPositions[i][j].y-siteswap.propPositions[k][j].y,2)+
							Math.pow(siteswap.propPositions[i][j].z-siteswap.propPositions[k][j].z,2)
						) <= (r1+r2)
					) {
						return true;
					}
				}
			}
		}
		return false;
	}

}

})(typeof exports === 'undefined'? this['SiteswapJS']={}: exports);
