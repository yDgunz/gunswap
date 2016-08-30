// Most of the ideas below are from http://www.benknowscode.com/2012/09/path-interpolation-using-cubic-bezier_9742.html
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