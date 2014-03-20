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

/* get all prop orbits */
var allPropOrbits = [];

function getAllPropOrbits(currentBeat,numBeats,numJugglers,orbit) {
	for (var beat = currentBeat; beat < numBeats; beat++) {
		for (var juggler = 0; juggler < numJugglers; juggler++) {
			var newOrbit = cloneState(orbit);
			newOrbit.push({beat: beat, juggler: juggler, hand: LEFT});
			allPropOrbits.push(newOrbit);
			getAllPropOrbits(beat+1,numBeats,numJugglers,newOrbit);
			newOrbit = cloneState(orbit);
			newOrbit.push({beat: beat, juggler: juggler, hand: RIGHT});
			allPropOrbits.push(newOrbit);
			getAllPropOrbits(beat+1,numBeats,numJugglers,newOrbit);
		}
	}
	return null;
}

var allSiteswapOrbits = [];
function getAllSiteswapOrbits(currentSiteswapOrbits,numProps) {
	for (var i = 0; i < allPropOrbits.length; i++) {
		var tmpSiteswapOrbits = cloneState(currentSiteswapOrbits);
		tmpSiteswapOrbits.push(allPropOrbits[i]);
		if (tmpSiteswapOrbits.length == numProps) {
			allSiteswapOrbits.push(tmpSiteswapOrbits);
		} else {
			getAllSiteswapOrbits(tmpSiteswapOrbits,numProps);
		}
	}
	return null;
}

function getTossArrayFromOrbit(orbits,numBeats) {
	var tossArr = [];
	for (var prop = 0; prop < orbits.length; prop++) {
		for (var toss = 0; toss < orbits[prop].length; toss++) {
			var nextTossIx = (toss == orbits[prop].length-1 ? 0 : toss+1);
			if (tossArr[orbits[prop][toss].beat] == undefined) {
				tossArr[orbits[prop][toss].beat] = [];
			}
			tossArr[orbits[prop][toss].beat].push({
				juggler: orbits[prop][toss].juggler,
				numBeats: (nextTossIx == 0 ? numBeats - orbits[prop][toss].beat + orbits[prop][nextTossIx].beat : orbits[prop][nextTossIx].beat - orbits[prop][toss].beat),
				hand: orbits[prop][toss].juggler,
				crossing: (orbits[prop][toss] != orbits[prop][nextTossIx])				
			});
		}
	}
	return tossArr;
}

function getSiteswapFromTossArray(tossArr) {
	var siteswap = "";
	for (var beat = 0; beat < tossArr.length; beat++) {
		var handTosses = [[],[]];
		for (var toss = 0; toss < tossArr[beat].length; toss++) {
			handTosses[tossArr[beat][toss].hand].push(tossArr[beat][toss]);
		}
		/* vanilla */
		if (handTosses[LEFT].length == 1 && handTosses[RIGHT].length == 0) {
			siteswap += ("L"+handTosses[LEFT][0].numBeats+((handTosses[LEFT][0].numBeats%2==0 && handTosses[LEFT][0].crossing) || (handTosses[LEFT][0].numBeats%2==1 && !handTosses[LEFT][0].crossing) ? "x" : ""));
		} else if (handTosses[LEFT].length == 0 && handTosses[RIGHT].length == 1) {
			siteswap += ("R"+handTosses[RIGHT][0].numBeats+((handTosses[RIGHT][0].numBeats%2==0 && handTosses[RIGHT][0].crossing) || (handTosses[RIGHT][0].numBeats%2==1 && !handTosses[RIGHT][0].crossing) ? "x" : ""));
		} 
		/* multiplex */
		else if (handTosses[LEFT].length > 1 && handTosses[RIGHT].length == 0) {
			siteswap += "L[";
			for (var toss = 0; toss < handTosses[LEFT].length; toss++) {
				siteswap += (handTosses[LEFT][toss].numBeats+((handTosses[LEFT][toss].numBeats%2==0 && handTosses[LEFT][toss].crossing) || (handTosses[LEFT][toss].numBeats%2==1 && !handTosses[LEFT][toss].crossing) ? "x" : ""));
			}
			siteswap += "]";
		} else if (handTosses[RIGHT].length > 1 && handTosses[LEFT].length == 0) {
			siteswap += "R[";
			for (var toss = 0; toss < handTosses[RIGHT].length; toss++) {
				siteswap += (handTosses[RIGHT][toss].numBeats+((handTosses[RIGHT][toss].numBeats%2==0 && handTosses[RIGHT][toss].crossing) || (handTosses[RIGHT][toss].numBeats%2==1 && !handTosses[RIGHT][toss].crossing) ? "x" : ""));
			}
			siteswap += "]";
		}
	}
	return siteswap;
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

			var dbg = true;
			if (dbg && tries % 20 == 0) {
				console.log('v0 ' + v0 + ' y ' + y[y.length-1] + ' vy ' + vy + ' bounces ' + bounces);
			}

			if (bounces == config.numBounces && Math.abs(p1.y-y[y.length-1]) <= config.eps && ( ( (config.bounceType == "HF" || config.bounceType == "L") && vy >= 0) || ( (config.bounceType == "F" || config.bounceType == "HL") && vy <= 0) )) {
				done = true;
				flightPathCache[inputKey] = y;
				if (dbg) {
					console.log('v0 ' + v0 + ' y ' + y[y.length-1] + ' vy ' + vy + ' bounces ' + bounces);
				}				
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