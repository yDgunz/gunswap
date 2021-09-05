import { vec3 } from "@tlaukkan/tsm";

// // /*

// // 		<li>p0 - starting position</li>
// // 		<li>pT - ending position</li>
// // 		<li>minT - minimum amount of time for bounce path</li>
// // 		<li>maxT - maximum amount of time for bounce path</li>
// // 		<li>R - ball radius</li>
// // 		<li>C - ball coefficient of restitution</li>
// // 		<li>numBounces - expected number of bounces</li>
// // 		<li>bounceOrder (optional) - comma separated list of surface indices representing the bounce order. So 1,0 means bounce off surface 1 first, then surface 0</li>
// // 		<li>tossSign - 1 means the toss is up, -1 means the toss is down, u means it doesn't matter</li>
// // 		<li>catchSign - 1 means the catch is made while the prop is traveling up, -1 means the catch is made while the prop is traveling down, u means it doesn't matter</li>
// // 		<li>surfaceNormal - vector for the surface normal</li>
// // 		<li>surfacePosition - vector for the position of the center of the surface</li>
// // 		<li>surfaceScale - all surfaces are squares with an edge parallel to the x-z plane, the scale provides the half-width of the square</li>
// // */

// export interface SolveBouncePathInput {
// 	startingPosition: vec3;
// 	endPosition: vec3;
// 	minTime: number;
// 	maxTime: number;
// 	radius: number;
// 	C: number; // coefficient of restitution (ie. bounciness)
// 	numBounces: number;
// 	bounceOrder: number[]|undefined;
// 	tossVelocityUp: boolean; // if true then toss up, else toss down
// 	catchVelocityDown: boolean; // if true then catching while prop is falling, else catching while prop is rising
// 	surfaces: Surface[];
// }

// export interface Surface {
// 	normal: vec3;
// 	position: vec3;
// 	scale: number; // all surfaces are squares with an edge parallel to the x-z plane, the scale provides the half-width of the square
// }

// interface BouncePathSolution {
// 	bouncePathPositions: vec3[];
// 	bouncePathVelocities: vec3[];
// 	error: number; // the distance between the last position in the solution and the expected last position
// }

// export function SolveBouncePath(input: SolveBouncePathInput) : BouncePathSolution {

// 	// generate population of bounce path solutions
// 	// if desired error is not reached, create new population using GA

// 	// function GenerateBouncePathSolution()

// 	function GetBouncePathSolution(startVelocity : vec3) : BouncePathSolution {

// 		var pt = input.startingPosition.copy();
// 		var vt = startVelocity.copy();
	
// 		var positions : vec3[] = [];
// 		var velocities : vec3[] = [];
// 		positions.push(pt.copy());
// 		velocities.push(vt.copy());

// 		interface SurfaceStatus {
// 			surface : Surface;
// 			bounces : number;
// 			colliding : boolean;
// 			axis1: vec3;
// 			axis2: vec3;
// 		}

// 		var surfaceStatuses : SurfaceStatus[] = [];

// 		// reset surfaces 
// 		for (var i = 0; i < input.surfaces.length; i++) {
			
// 			var surfaceStatus = {
// 				surface: input.surfaces[i],
// 				bounces: 0,
// 				colliding: false,
// 				axis1: new vec3(1,0,0),
// 				axis2: new vec3()
// 			};

// 			if (surfaceStatus.surface.normal.x == 0 && surfaceStatus.surface.normal.z == 0) {
// 				surfaceStatus.axis1 = new vec3(1,0,0);
// 			}

// 			surfaceStatuses.push(
// 				{
// 					surface: input.surfaces[i],
// 					bounces: 0,
// 					colliding: false
// 				}
// 			);

// 		}
	
// 		var totalBounces = 0;
// 		var actualBounceOrder : number[] = [];
	
// 		var pTchoices = [];
	
// 		var dt = .01;
// 		var G = -9.8;

// 		for (var t = 0; t <= input.maxTime; t += dt) {
	
// 			// update position / velocity

// 			pt.add(vt.copy().scale(dt));
// 			vt.y += G*dt;
	
// 			positions.push(pt.copy());
// 			velocities.push(vt.copy());
	
// 			// check for collisions
// 			for (var i = 0; i < surfaceStatuses.length; i++) {
// 				var surface = surfaceStatuses[i];	
// 				//var distance = (surface.surface.normal.x*pt.x + surface.surface.normal.y*pt.y + surface.surface.normal.z*pt.z - surface.surface.normal.x*surface.surface.position.x - surface.surface.normal.y*surface.surface.position.y - surface.surface.normal.z*surface.surface.position.z);
// 				var distance = vec3.dot(surface.surface.normal,pt) - vec3.dot(surface.surface.normal,surface.surface.position);

// 				if (
// 					Math.abs(distance) <= input.radius // distance from plane is within radius
// 					&& vec3.dot(pt.copy().subtract(surface.surface.position),surface.surface.

// 					&& Math.abs(dot(sub(cloneObject(pt),surface.position),normalize(cloneObject(surface.axis1)))) <= surface.scale
// 					&& Math.abs(dot(sub(cloneObject(pt),surface.position),normalize(cloneObject(surface.axis2)))) <= surface.scale
// 					&& !surface.colliding
// 				) {
// 					surface.colliding = true;
// 					surface.bounces++;
// 					actualBounceOrder.push(i);
// 					totalBounces++;
	
// 					//new velocity from bounce
// 					var bounceV = (new THREE.Vector3()).copy(surface.normal);
// 					var bounceV = cloneObject(surface.normal);
// 					multiply(bounceV, dot(vt, surface.normal));
// 					multiply(bounceV, 2*this.fitnessConfig.C);
// 					negate(bounceV);
// 					add(vt, bounceV);
	
// 				} else if (Math.abs(distance) > this.fitnessConfig.R && surface.colliding) {
// 					surface.colliding = false;
// 				}
	
// 			}
	
// 			if (t >= this.fitnessConfig.minT || t + this.fitnessConfig.dt > this.fitnessConfig.maxT) {	
// 				/* if bounce order is specified, check that it is followed */
// 				var correctBounceOrder = true;
// 				if (this.fitnessConfig.surfaceBounceOrder && actualBounceOrder.toString() != this.fitnessConfig.surfaceBounceOrder.toString()) {
// 					correctBounceOrder = false;
// 				}
	
// 				var enoughBounces = false;
// 				/* check that the total number of bounces was correct */
// 				if (totalBounces == this.fitnessConfig.numBounces) {
// 					enoughBounces = true;
// 				}
	
// 				// must match expected number of bounces, otherwise fitness is terrible
// 				if ( 
// 					correctBounceOrder
// 					&& enoughBounces
// 					&& ( (this.fitnessConfig.catchSign == 1 && vt.y >= 0) || (this.fitnessConfig.catchSign == -1 && vt.y <= 0 ) || this.fitnessConfig.catchSign == undefined ) 
// 					&& ( (this.fitnessConfig.tossSign == 1 && v.y >= 0) || (this.fitnessConfig.tossSign == -1 && v.y <= 0 ) || this.fitnessConfig.tossSign == undefined ) 
// 				) {
// 					pTchoices.push({
// 						pT: cloneObject(pt), 
// 						T: t,
// 						actualpT: this.fitnessConfig.pT // need this for comparator function below
// 					});
// 				}
// 			}		
	
// 		}
	
// 		if (pTchoices.length > 0) {
// 			// go through pT choices and grab the best
// 			pTchoices.sort(function(a,b) { 
// 				return magnitude(sub(cloneObject(a.pT),a.actualpT)) - magnitude(sub(cloneObject(b.pT),a.actualpT));
// 			});
	
// 			return {path: positions.splice(0,pTchoices[0].T/this.fitnessConfig.dt), velocities: velocities.splice(0,pTchoices[0].T/this.fitnessConfig.dt), T: pTchoices[0].T};
// 		} else {
// 			return {path: undefined, velocities: undefined, T: undefined};
// 		}
		
// 	}

// }