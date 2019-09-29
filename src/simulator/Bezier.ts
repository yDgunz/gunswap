import { vec3 } from "@tlaukkan/tsm";
import { DwellPath } from "./DwellPath";

export function InterpolateBezierSpline(
	dwellPath : vec3[],
	t : number, // from 0 to 1, how far to interpolate
	v_0 : vec3,
	v_T : vec3,
	v_0scale : number,
	v_Tscale : number,
	matchVelocity : boolean
) : vec3 {

	var dwellPosition : vec3;

	if (t == 0) {
		dwellPosition = dwellPath[0];
	} else if (t == 1) {
		dwellPosition = dwellPath[dwellPath.length-1];
	} else {

		/* if P is just one point, duplicate it */
		if (dwellPath.length == 1) {
			dwellPath.push(dwellPath[0]);
		}			

		var lastPosition = dwellPath[dwellPath.length-1];
		var C = [
				new vec3([dwellPath[0].x+v_0.x*v_0scale, dwellPath[0].y+v_0.y*v_0scale, dwellPath[0].z+v_0.z*v_0scale]),
				new vec3([lastPosition.x-v_T.x*v_Tscale, lastPosition.y-v_T.y*v_Tscale, lastPosition.z-v_T.z*v_Tscale])
				];
		var eps = .00001;

		var c : vec3[] = [];
		var interpolatedPath = [];

		for (var i = 0; i < dwellPath.length-1; i++) {
			var p0 = dwellPath[i];
			var p1 = dwellPath[i+1];

			var c0 : vec3, c1 : vec3;

			if (i == 0) {
				c0 = C[0];
			} else {
				var c1prev = c[c.length-1];
				var c0 = new vec3([p0.x + (p0.x - c1prev.x), p0.y + (p0.y - c1prev.y), p0.z + (p0.z - c1prev.z)]);
				c.push(c0);
			}

			if (i+1 == dwellPath.length-1) {
				c1 = C[1];
			} else {
				var m0 = new vec3([(dwellPath[i].x+dwellPath[i+1].x)/2, (dwellPath[i].y+dwellPath[i+1].y)/2, (dwellPath[i].z+dwellPath[i+1].z)/2]);
				var m1 = new vec3([(dwellPath[i+1].x+dwellPath[i+2].x)/2, (dwellPath[i+1].y+dwellPath[i+2].y)/2, (dwellPath[i+1].z+dwellPath[i+2].z)/2]);
				var l0 = Math.sqrt( Math.pow(dwellPath[i].x - dwellPath[i+1].x,2) + Math.pow(dwellPath[i].y - dwellPath[i+1].y,2) + Math.pow(dwellPath[i].z - dwellPath[i+1].z,2) );
				var l1 = Math.sqrt( Math.pow(dwellPath[i+1].x - dwellPath[i+2].x,2) + Math.pow(dwellPath[i+1].y - dwellPath[i+2].y,2) + Math.pow(dwellPath[i+1].z - dwellPath[i+2].z,2) );
				var _t = l0/(l0+l1);
				var q = new vec3([(1-_t)*m0.x + _t*m1.x, (1-_t)*m0.y + _t*m1.y, (1-_t)*m0.z + _t*m1.z]);
				c1 = new vec3([p1.x + (m0.x-q.x), p1.y + (m0.y-q.y), p1.z + (m0.z-q.z)]);
				c.push(c1);
			}

			for (var _t = 0; _t <= 1+eps; _t += .02) {
				interpolatedPath.push(
					new vec3([
						Math.pow(1-_t,3)*p0.x + 3*Math.pow(1-_t,2)*_t*c0.x + 3*(1-_t)*Math.pow(_t,2)*c1.x + Math.pow(_t,3)*p1.x,
						Math.pow(1-_t,3)*p0.y + 3*Math.pow(1-_t,2)*_t*c0.y + 3*(1-_t)*Math.pow(_t,2)*c1.y + Math.pow(_t,3)*p1.y,
						Math.pow(1-_t,3)*p0.z + 3*Math.pow(1-_t,2)*_t*c0.z + 3*(1-_t)*Math.pow(_t,2)*c1.z + Math.pow(_t,3)*p1.z
					])
				);

				// TODO - implement velocity matching feature
				/*
				if (interpolatedPath.length == 1) {
					interpolatedPath.last().dist = 0;
				} else {
					interpolatedPath.last().dist = interpolatedPath[interpolatedPath.length-2].dist + Math.sqrt(Math.pow(interpolatedPath.last().x-interpolatedPath[interpolatedPath.length-2].x,2)+Math.pow(interpolatedPath.last().y-interpolatedPath[interpolatedPath.length-2].y,2)+Math.pow(interpolatedPath.last().z-interpolatedPath[interpolatedPath.length-2].z,2));
				}
				*/
			}
		}

		var dwellPositionIx = Math.floor(t*interpolatedPath.length);
		
		dwellPosition = interpolatedPath[dwellPositionIx < 0 ? 0 : dwellPositionIx];		
	}

	return dwellPosition;

}