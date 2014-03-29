/* ------- */
/* HELPERS */
/* ------- */

function GetQueryStringParams(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}

function cloneState(obj) {
  var newObj = (obj instanceof Array) ? [] : {};
  for (i in obj) {
    if (i == 'clone') continue;
    if (obj[i] && typeof obj[i] == "object") {
      newObj[i] = cloneState(obj[i]);
    } else newObj[i] = obj[i]
  } return newObj;
};

/* 
	helper for figuring out the number of props 
	TODO : this should interpret a-g as valid toss heights
*/
function sumIntegers(str) {
	if (str.length == 1 && parseInt(str)) {
		return parseInt(str);
	} else if (str.charCodeAt(0) >= 97 && str.charCodeAt(0) <= 111) {
		return str.charCodeAt(0)-87;
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

/* interpolate flight path */
var flightPathCache = {};
function interpolateFlightPath(p0, p1, T, t, config) {
	/*
	p0 - starting position
	p1 - ending position
	T - total time
	t - time elapsed
	config - configurable parameters
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

	if (config == undefined) { config = {}; }

	/* set defaults */
	if (!config.bounceType)
		config.bounceType = "L";
	if (!config.dt)
		config.dt = .01;
	if (!config.eps) 
		config.eps = .01;
	if (!config.dv)
		config.dv = .01;
	if (!config.numBounces)
		config.numBounces = 0;
	if (!config.G)
		config.G = -9.8;
	if (!config.C)
		config.C = .95;
	if (!config.tries) 
		config.tries = 10000;
	if (!config.R) /* should this one be required? */
		config.R = .1;

	/*
	regardless of bouncing, x and z will be the same

	x(t) = x(0) + v_x*t 
	v_x = (x(T) - x(0))/T
	*/

	var xt = p0.x + (p1.x-p0.x)*t/T;
	var zt = p0.z + (p1.z-p0.z)*t/T;

	var inputKey = JSON.stringify({p0:p0,p1:p1,T:T,config:config});

	if (config.numBounces == 0) {

		return  {
			x: xt,
			y: p0.y + (p1.y - p0.y - .5*config.G*T*T)*t/T + .5*config.G*t*t,
			z: zt
		};

	} else if (flightPathCache[inputKey] == undefined) {

		var done = true;

		/* run simulation */
		
		var tries = 0;
		var v0 = 0; // starting toss y velocity
		done = false;

		while (!done && tries <= config.tries) {

			var y = [p0.y];
			var vy = v0;
			var bounces = 0;

			for (var tSim = 0; tSim < T; tSim += config.dt) {

				/* update position and velocity */
				y.push(y[y.length-1] + vy*config.dt);
				vy += config.G*config.dt;

				/* if the prop is at the floor, velocity changes and loses momentum according to C */
				if (y[y.length-1] - config.R <= 0 && vy <= 0) {
					vy = -config.C*vy;
					bounces++;
				}

			}

			if (bounces == config.numBounces && Math.abs(p1.y-y[y.length-1]) <= config.eps && ( ( (config.bounceType == "HF" || config.bounceType == "L") && vy >= 0) || ( (config.bounceType == "F" || config.bounceType == "HL") && vy <= 0) )) {
				done = true;
				flightPathCache[inputKey] = y;				
			} else {

				/* check to see if this just isn't going to happen */
				if ( (config.bounceType == "HL" || config.bounceType == "L" || config.bounceType == "F" || (config.bounceType == "HF" && config.numBounces > 1)) && bounces < config.numBounces ) {
					throw 'Not enough time for all bounces'
				} else if (config.bounceType == "HF" && config.numBounces == 1 && y[y.length-1] > p1.y+config.eps) {
					throw 'Too much time for hyperforce and single bounce'
				}

				if (config.bounceType == "HL" || config.bounceType == "L") {
					v0+=config.dv;
				} else {
					v0-=config.dv;
				}
			}

			tries++;

		}

		if (!done) {
			/* TODO - improve error to explain why the bounce path couldn't be calculated */
			throw 'Unable to calculate bounce path';
		}

	}

	var flightPath = flightPathCache[inputKey];
	return {x:xt, y:flightPath[Math.floor((flightPath.length-1)*t/T)], z: zt};

}