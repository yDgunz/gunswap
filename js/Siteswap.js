(function(exports){

/* helper functions. initially wanted these in util but that caused some tests to fail and i didn't want to do the necessary refactoring */
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
};

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

/* calculates the sum of all throws in the siteswap. used to determine the number of props */
function sumThrows(str) {

	var total = 0;
	for (var i = 0; i < str.length; i++) {
		if(parseInt(str[i])) {
			total += parseInt(str[i]);					
		} else if (str.charCodeAt(i) >= 97 && str.charCodeAt(i) <= 119) {
			// handle "a" through "z" (where "a" = 10)
			total += str.charCodeAt(0)-87;
		}

		// if the current character is a pass/spin marker
		// ignore the next character so we don't count the
		// juggler identifier  in something like <5p2|5p3|5p1>
		if ((str[i] == "P" || str[i] == "S") && parseInt(str[i+1]) ){
			i++;
		}
		// if the current character is a bounce marker
		// and then next character is a {, move forward until we find a }
		if (str[i] == "B" && str[i+1] == "{") {
			i = str.indexOf("}",i)+1;
		}
	}

	return total;
}

var flightPathCache = {};

/* CONSTANTS */

var LEFT = 0, RIGHT = 1;

/* core functions */
function CreateSiteswap(siteswapStr, options) {
	
	/* return variable */
	var siteswap = {
		siteswap: 				siteswapStr,
		validSyntax: 			false,
		validPattern: 			false,
		multiplex: 				undefined,
		sync: 					undefined,
		pass: 					undefined,
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
		errorMessage:  			undefined
	};

	/* regexps */
	var validTossRe,
		validMultiplexRe,
		validSyncRe,
		validBeatRe,
		validPassRe,
		validSiteswapRe;

	setDefaultOptions();

	validateSyntax();
	
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
		siteswap.numStepsPerBeat = (options.numStepsPerBeat === undefined ? Math.floor(siteswap.beatDuration*100) : options.numStepsPerBeat);
		siteswap.matchVelocity = (options.matchVelocity === undefined ? false : options.matchVelocity);
		siteswap.dwellCatchScale = (options.dwellCatchScale === undefined ? 0.05 : options.dwellCatchScale);
		siteswap.dwellTossScale = (options.dwellTossScale === undefined ? 0.05 : options.dwellTossScale);
		siteswap.emptyTossScale = (options.emptyTossScale === undefined ? 0.05 : options.emptyTossScale);
		siteswap.emptyCatchScale = (options.emptyCatchScale === undefined ? 0.05 : options.emptyCatchScale);
		siteswap.armAngle = (options.armAngle === undefined ? 0.1 : options.armAngle);
		
		if (options.props === undefined) {
			siteswap.props = [{type: 'ball', radius: .05, C: .95}];
		} else {
			siteswap.props = options.props;
		}

		if (options.dwellPath === undefined) {
			siteswap.dwellPath = [[{x:0.3,y:0,z:0,rotation:{x:4,y:0,z:-1,th:Math.PI/2}},{x:0.1,y:0,z:0,rotation:{x:4,y:0,z:1,th:Math.PI/2}}]];
		} else {
			siteswap.dwellPath = options.dwellPath;
		}

		if (options.surfaces === undefined) {
			siteswap.surfaces = [{position:{x:0,y:0,z:0}, normal:{x:0,y:1,z:0}, scale: 5}];
		} else {
			siteswap.surfaces = options.surfaces;
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
		var validToss = "(R|L)?([\\da-o])x?(" + passPattern + ")?(B({\\d*(L|HL|F|HF)?})?)?(S\\d?)?";
		var validMultiplex = "\\[(" + validToss + ")+\\]";
		var validSync = "\\((" + validToss + "|" + validMultiplex + "),(" + validToss + "|" + validMultiplex + ")\\)";
		var validBeat = "(" + validToss + "|" + validMultiplex + "|" + validSync + ")";
		var validPass = "<" + validBeat + "(\\|" + validBeat + ")+>";
		var validSiteswap = "^(" + validPass + ")+|(" + validBeat + ")+$";

		validTossRe = new RegExp(validToss,"g");
		validMultiplexRe = new RegExp(validMultiplex,"g");
		validSyncRe = new RegExp(validSync,"g");
		validBeatRe = new RegExp(validBeat,"g");
		validPassRe = new RegExp(validPass,"g");
		validSiteswapRe = new RegExp(validSiteswap,"g");

		if (siteswapStr.match(validSiteswapRe)) {
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
			dwellPathIx = getTosses(tosses,patterns[0].substr(1),juggler,true,LEFT, dwellPathIx);
			dwellPathIx = getTosses(tosses,patterns[1].substr(0,patterns.length),juggler,true,RIGHT, dwellPathIx);
		} else if (siteswapStr.match(validMultiplexRe)) {
			var patterns = siteswapStr.match(validTossRe);
			patterns.map(function(s) {
				dwellPathIx = getTosses(tosses,s,juggler, undefined, undefined, dwellPathIx);
			});
		} else {
			/* will work from "a" to "z" */
			var numBeats = (siteswapStr[0].charCodeAt(0) >= 97 && siteswapStr[0].charCodeAt(0) <= 119) ? siteswapStr[0].charCodeAt(0)-87 : parseInt(siteswapStr[0]);
			var targetJuggler = juggler;

			var pIx = siteswapStr.indexOf("P");
			if (pIx > 0) {				
				if (siteswap.numJugglers > 2) {					
					targetJuggler = parseInt(siteswapStr[pIx+1])-1;
				} else {
					targetJuggler = 1 - juggler;
				}			
			}

			var numBounces = 0;
			var bounceOrder = [];
			var bIx = siteswapStr.indexOf("B");
			if (bIx > 0) {
				if (siteswapStr[bIx+1] == "{" && !isNaN(siteswapStr[bIx+2])) {
					numBounces = parseInt(siteswapStr[bIx+2]);
					for (var i = bIx + 3; i < siteswapStr.length; i++) {
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
					bounceType = "L";
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
			var sIx = siteswapStr.indexOf("S");
			if ( sIx > 0 && !isNaN(parseInt(siteswapStr[sIx+1])) ) {
				numSpins = parseInt(siteswapStr[sIx+1]);				
			} else {
				numSpins = Math.floor(numBeats/2);
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
					dwellPathIx: dwellPathIx
				}
			);

		}

		if (dwellPathIx == siteswap.dwellPath.length-1) {
			dwellPathIx = 0;
		} else {
			dwellPathIx++;
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
		var hand = LEFT; /* default to starting with the left hand. this will automatically alternate */

		/* keep going until pattern complete */
		while (!patternComplete) {

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

				/* so long as this isn't a 0 toss, update the current state and append to prop orbits */
				if (toss.numBeats > 0) {
					
					if(!tmpPropOrbits[prop]) {
						tmpPropOrbits[prop] = [];
					}

					tmpPropOrbits[prop].push({beat: beat, juggler: toss.juggler, hand: tossHand, numBounces: toss.numBounces, bounceType: toss.bounceType, bounceOrder: toss.bounceOrder, numSpins: toss.numSpins, dwellPathIx: toss.dwellPathIx });

					if(curState[toss.targetJuggler][catchHand][toss.numBeats-1] == undefined) {
						curState[toss.targetJuggler][catchHand][toss.numBeats-1] = [prop];
					} else {
						curState[toss.targetJuggler][catchHand][toss.numBeats-1].push(prop);
					}

				}
				
			}
							

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
			hand = 1 - hand; //alternate hands

			/* fail safe in case the pattern is too long */
			if (beat > 500) {
				siteswap.errorMessage = "Pattern took more than 500 beats to repeat states"
				return;
			}

		}

		/* if we've gotten to this point, the pattern is repeatable and thus valid */
		siteswap.numSteps = siteswap.states.length*siteswap.numStepsPerBeat;
		siteswap.validPattern = true;
	}

	function generatePropPositions() {

		//try {

			// clear flight path cache
			flightPathCache = {};

			/* initialize jugglers */
			siteswap.jugglers = [];		
			for (var i = 0; i < siteswap.numJugglers; i++) {
				siteswap.jugglers.push(
					{
						position: {x:0,z:-2*i}, 
						rotation: i*Math.PI
					}
				);
			}

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
					
					if (siteswap.propOrbits[prop].length == 1) {
						
						prevToss = siteswap.propOrbits[prop][0];
						curToss = siteswap.propOrbits[prop][0];
						nextToss = siteswap.propOrbits[prop][0];

					}
					var orbitBeatFound = false;
					for (var i = 0; i < siteswap.propOrbits[prop].length-1; i++) {
						if (!orbitBeatFound && siteswap.propOrbits[prop][i].beat <= currentBeat && siteswap.propOrbits[prop][i+1].beat > currentBeat) {
							
							if (i == 0) {
								prevToss = siteswap.propOrbits[prop][siteswap.propOrbits[prop].length-1];
							} else {
								prevToss = siteswap.propOrbits[prop][i-1];
							}
							curToss = siteswap.propOrbits[prop][i];
							nextToss = siteswap.propOrbits[prop][i+1];

							orbitBeatFound = true;

						} else if (!orbitBeatFound && i == siteswap.propOrbits[prop].length-2) { 

							prevToss = siteswap.propOrbits[prop][i];
							curToss = siteswap.propOrbits[prop][i+1];
							nextToss = siteswap.propOrbits[prop][0];

						}
					}

					var tossTime = curToss.beat*siteswap.beatDuration+siteswap.dwellDuration;
					var catchTime = nextToss.beat*siteswap.beatDuration;
					if (tossTime >= catchTime && catchTime >= currentTime) { 
						tossTime -= (siteswap.beatDuration*siteswap.states.length);
					}
					if (tossTime >= catchTime && catchTime < currentTime) {
						catchTime += (siteswap.beatDuration*siteswap.states.length);	
					}

					var lastTossTime = prevToss.beat*siteswap.beatDuration+siteswap.dwellDuration;
					var lastCatchTime = curToss.beat*siteswap.beatDuration;
					if (lastTossTime >= lastCatchTime && lastCatchTime >= currentTime) { 
						lastTossTime -= (siteswap.beatDuration*siteswap.states.length);
					}
					if (lastTossTime >= lastCatchTime && lastCatchTime < currentTime) {
						lastCatchTime += (siteswap.beatDuration*siteswap.states.length);	
					}

					if (currentTime < tossTime) {
						/* interpolate dwell path */
						var launch = interpolateFlightPath(
								interpolateBezierSpline(siteswap.dwellPath[curToss.dwellPathIx],curToss.juggler,curToss.hand,1), /* p0 */
								interpolateBezierSpline(siteswap.dwellPath[nextToss.dwellPathIx],nextToss.juggler,nextToss.hand,0), /* p1 */
								(catchTime - tossTime),
								0,								
								{
									numBounces: curToss.numBounces, 
									bounceType: curToss.bounceType, 
									bounceOrder: curToss.bounceOrder,
									R: siteswap.props[prop].radius, 
									C: siteswap.props[prop].C
								}
							);

						var land = interpolateFlightPath(
								interpolateBezierSpline(siteswap.dwellPath[prevToss.dwellPathIx],prevToss.juggler,prevToss.hand,1), /* p0 */
								interpolateBezierSpline(siteswap.dwellPath[curToss.dwellPathIx],curToss.juggler,curToss.hand,0), /* p1 */
								(lastCatchTime - lastTossTime),
								(lastCatchTime - lastTossTime),
								{
									numBounces: prevToss.numBounces, 
									bounceType: prevToss.bounceType,
									bounceOrder: prevToss.bounceOrder, 
									R: siteswap.props[prop].radius, 
									C: siteswap.props[prop].C
								}
							);

						var t = 1-(tossTime - currentTime)/siteswap.dwellDuration;
						var pos = interpolateBezierSpline(
							siteswap.dwellPath[curToss.dwellPathIx]
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
						var correctLand = interpolateBezierSpline(siteswap.dwellPath[curToss.dwellPathIx],curToss.juggler,curToss.hand,0);

						var landingDiff = {x: land.x - correctLand.x, y: land.y - correctLand.y, z: land.z - correctLand.z};
						pos.x += (1-t)*landingDiff.x;
						pos.y += (1-t)*landingDiff.y;
						pos.z += (1-t)*landingDiff.z;

						pos.dwell = true;
						
						propPositions[prop].push(pos);
						
						/* assign juggler hand positions */
						if (tmpJugglerHandPositions[curToss.juggler][curToss.hand] == undefined) {
							tmpJugglerHandPositions[curToss.juggler][curToss.hand] = pos;
						}					

						propRotations[prop].push({
							x: siteswap.dwellPath[curToss.dwellPathIx][0].rotation.x+(siteswap.dwellPath[curToss.dwellPathIx].last().rotation.x-siteswap.dwellPath[curToss.dwellPathIx][0].rotation.x)*t,
							y: siteswap.dwellPath[curToss.dwellPathIx][0].rotation.y+(siteswap.dwellPath[curToss.dwellPathIx].last().rotation.y-siteswap.dwellPath[curToss.dwellPathIx][0].rotation.y)*t,
							z: (curToss.hand == LEFT ? 1 : -1)*siteswap.dwellPath[curToss.dwellPathIx][0].rotation.z+((curToss.hand == LEFT ? 1 : -1)*siteswap.dwellPath[curToss.dwellPathIx].last().rotation.z-(curToss.hand == LEFT ? 1 : -1)*siteswap.dwellPath[curToss.dwellPathIx][0].rotation.z)*t,
							th: siteswap.dwellPath[curToss.dwellPathIx][0].rotation.th+(siteswap.dwellPath[curToss.dwellPathIx].last().rotation.th-siteswap.dwellPath[curToss.dwellPathIx][0].rotation.th)*t
						});
					} else {

						/*
						calculate position at current time
						*/

						var T = catchTime - tossTime;
						var t = currentTime - tossTime;

						var pos = interpolateFlightPath(
								interpolateBezierSpline(siteswap.dwellPath[curToss.dwellPathIx],curToss.juggler,curToss.hand,1), /* p0 */
								interpolateBezierSpline(siteswap.dwellPath[nextToss.dwellPathIx],nextToss.juggler,nextToss.hand,0), /* p1 */
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

						/* don't spin rings for now */
						if (siteswap.props[prop].type == 'ring') {
							currentRotation = 0;
						}

						propRotations[prop].push({
							x: siteswap.dwellPath[curToss.dwellPathIx].last().rotation.x+(siteswap.dwellPath[nextToss.dwellPathIx][0].rotation.x-siteswap.dwellPath[curToss.dwellPathIx].last().rotation.x)*(t/T),
							y: siteswap.dwellPath[curToss.dwellPathIx].last().rotation.y+(siteswap.dwellPath[nextToss.dwellPathIx][0].rotation.y-siteswap.dwellPath[curToss.dwellPathIx].last().rotation.y)*(t/T),
							z: (curToss.hand == LEFT ? 1 : -1)*siteswap.dwellPath[curToss.dwellPathIx].last().rotation.z+((nextToss.hand == LEFT ? 1 : -1)*siteswap.dwellPath[nextToss.dwellPathIx][0].rotation.z-(curToss.hand == LEFT ? 1 : -1)*siteswap.dwellPath[curToss.dwellPathIx].last().rotation.z)*(t/T),
							th: currentRotation+siteswap.dwellPath[curToss.dwellPathIx].last().rotation.th+(siteswap.dwellPath[nextToss.dwellPathIx][0].rotation.th-siteswap.dwellPath[curToss.dwellPathIx].last().rotation.th)*(t/T)
						});

					}

				}

				/* set hand positions that weren't set */
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

							if (nextTossOrbit == 0) {
								propLastToss = siteswap.propOrbits[nextTossProp].last();
							} else {
								propLastToss = siteswap.propOrbits[nextTossProp][nextTossOrbit-1];
							}

							if (lastTossOrbit == 0) {
								propNextToss = siteswap.propOrbits[lastTossProp].last();
							} else {
								propNextToss = siteswap.propOrbits[lastTossProp][lastTossOrbit-1];
							}

							var nextCatchTime = nextToss.beat*siteswap.beatDuration;
							if (nextCatchTime < currentTime) {
								nextCatchTime += (siteswap.beatDuration*siteswap.states.length);
							}
							var lastThrowTime = lastToss.beat*siteswap.beatDuration+siteswap.dwellDuration;
							if (lastThrowTime > currentTime) {
								lastThrowTime -= (siteswap.beatDuration*siteswap.states.length);
							}
							var propNextCatchTime = propNextToss.beat*siteswap.beatDuration;
							if (propNextCatchTime < lastThrowTime) {
								propNextCatchTime += (siteswap.beatDuration*siteswap.states.length);
							}
							var propLastThrowTime = propLastToss.beat*siteswap.beatDuration+siteswap.dwellDuration;
							if (propLastThrowTime > nextCatchTime) {
								propLastThrowTime -= (siteswap.beatDuration*siteswap.states.length);
							}

							var v_0 = interpolateFlightPath(
								interpolateBezierSpline(siteswap.dwellPath[lastToss.dwellPathIx],lastToss.juggler,lastToss.hand,1), /* p0 */
								interpolateBezierSpline(siteswap.dwellPath[propNextToss.dwellPathIx],propNextToss.juggler,propNextToss.hand,0), /* p1 */
								(propNextCatchTime - lastThrowTime),
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
								interpolateBezierSpline(siteswap.dwellPath[propLastToss.dwellPathIx],propLastToss.juggler,propLastToss.hand,1), /* p0 */
								interpolateBezierSpline(siteswap.dwellPath[nextToss.dwellPathIx],nextToss.juggler,nextToss.hand,0), /* p1 */
								(nextCatchTime - propLastThrowTime),
								(nextCatchTime - propLastThrowTime),
								{
									numBounces: propLastToss.numBounces, 
									bounceType: propLastToss.bounceType,
									bounceOrder: propLastToss.bounceOrder,
									R: siteswap.props[nextTossProp].radius, 
									C: siteswap.props[nextTossProp].C
								}
							);

							var t = (currentTime - lastThrowTime)/(nextCatchTime - lastThrowTime);
							var pos = interpolateBezierSpline(
								[siteswap.dwellPath[lastToss.dwellPathIx].last(),siteswap.dwellPath[nextToss.dwellPathIx][0]]
								, lastToss.juggler
								, lastToss.hand
								, t
								, v_0
								, v_T
								, siteswap.emptyTossScale
								, siteswap.emptyCatchScale
							);

							var correctCatch = interpolateBezierSpline(
								[siteswap.dwellPath[lastToss.dwellPathIx].last(),siteswap.dwellPath[nextToss.dwellPathIx][0]]
								, lastToss.juggler
								, lastToss.hand
								, 1
							);

							var catchDiff = {x: v_T.x - correctCatch.x, y: v_T.y - correctCatch.y, z: v_T.z - correctCatch.z};
							pos.x += (t)*catchDiff.x;
							pos.y += (t)*catchDiff.y;
							pos.z += (t)*catchDiff.z;							

							tmpJugglerHandPositions[juggler][hand] = pos;
						}					

						jugglerHandPositions[juggler][hand].push(tmpJugglerHandPositions[juggler][hand]);
						jugglerElbowPositions[juggler][hand].push(
							getElbowPosition(
								{x:siteswap.jugglers[juggler].position.x+Math.cos(siteswap.jugglers[juggler].rotation)*(hand == LEFT ? - 1 : 1)*.225,y:1.425,z:siteswap.jugglers[juggler].position.z+Math.sin(siteswap.jugglers[juggler].rotation)*0}, // shoulder
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

		//} catch(e) {
		//	siteswap.errorMessage = e.message;
		//}
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

		/*
		regardless of bouncing, x and z will be the same

		x(t) = x(0) + v_x*t 
		v_x = (x(T) - x(0))/T
		*/

		var xt = p0.x + (p1.x-p0.x)*t/T;
		var dx = (p1.x-p0.x)/T;
		var zt = p0.z + (p1.z-p0.z)*t/T;
		var dz = (p1.z-p0.z)/T;

		var inputKey = JSON.stringify({p0:p0,p1:p1,T:T,options:options});

		if (options.numBounces == 0) {

			return  {
				x: xt,
				y: p0.y + (p1.y - p0.y - .5*options.G*T*T)*t/T + .5*options.G*t*t,
				z: zt,
				dx: dx,
				dy: (p1.y - p0.y -.5*options.G*T*T)/T + options.G*t,
				dz: dz
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
				initialScale: 20,
				fitnessThreshold: .1,
				noGA: false
			};

			ga = new BounceGA(gaConfig,fitnessConfig);
			ga.evolve();

			// var done = true;

			// /* run simulation */
			
			// var tries = 0;
			// var v0 = 0; // starting toss y velocity
			// done = false;

			// while (!done && tries <= options.tries) {

			// 	var y = [p0.y];
			// 	var vy = [v0];
			// 	var bounces = 0;

			// 	for (var tSim = 0; tSim < T; tSim += options.dt) {

			// 		/* update position and velocity */
			// 		y.push(y[y.length-1] + vy[vy.length-1]*options.dt);
			// 		vy.push(vy[vy.length-1] + options.G*options.dt);

			// 		/* if the prop is at the floor, velocity changes and loses momentum according to C */
			// 		if (y[y.length-1] - options.R <= 0 && vy[vy.length-1] <= 0) {
			// 			vy[vy.length-1] = -options.C*vy[vy.length-1];
			// 			bounces++;
			// 		}

			// 	}

			// 	if (bounces == options.numBounces && Math.abs(p1.y-y[y.length-1]) <= options.eps && ( ( (options.bounceType == "HF" || options.bounceType == "L") && vy[vy.length-1] >= 0) || ( (options.bounceType == "F" || options.bounceType == "HL") && vy[vy.length-1] <= 0) )) {
			// 		done = true;
			// 		flightPathCache[inputKey] = {y:y, dy: vy};		
			// 	} else {

			// 		/* check to see if this just isn't going to happen */
			// 		if ( (options.bounceType == "HL" || options.bounceType == "L" || options.bounceType == "F" || (options.bounceType == "HF" && options.numBounces > 1)) && bounces < options.numBounces ) {
			// 			throw {message: 'Not enough time for all bounces'};
			// 		} else if (options.bounceType == "HF" && options.numBounces == 1 && y[y.length-1] > p1.y+options.eps) {
			// 			throw {message: 'Too much time for hyperforce and single bounce'};
			// 		}

			// 		if (options.bounceType == "HL" || options.bounceType == "L") {
			// 			v0+=options.dv;
			// 		} else {
			// 			v0-=options.dv;
			// 		}
			// 	}

			// 	tries++;

			// }

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

	function interpolateBezierSpline(P,juggler,hand,t,v_0,v_T,v_0scale,v_Tscale,matchVelocity) {
		
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

			/* if left hand, flip x values of v_0 and v_T */
			if (hand == LEFT) {
				v_0.dx *= -1;
				v_T.dx *= -1;
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
			if (siteswap.matchVelocity) {
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

		return {
			x: siteswap.jugglers[juggler].position.x + (dwellPosition.z - .4125)*Math.sin(siteswap.jugglers[juggler].rotation) + ((hand == LEFT ? -1 : 1)*dwellPosition.x)*Math.cos(siteswap.jugglers[juggler].rotation),
			y: 1.0125 + dwellPosition.y,
			z: siteswap.jugglers[juggler].position.z + (dwellPosition.z - .4125)*Math.cos(siteswap.jugglers[juggler].rotation) + ((hand == LEFT ? -1 : 1)*dwellPosition.x)*Math.sin(siteswap.jugglers[juggler].rotation)
		};

	}

	function getElbowPosition(S,H,l,w,hand) {
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
		Ep.x = Epp.x*Math.cos(th) + Epp.z*Math.sin(th);
		Ep.y = Epp.y;
		Ep.z = Epp.x*Math.sin(th) + Epp.z*Math.cos(th);	

		var E = {};
		E.x = Ep.x + S.x;
		E.y = Ep.y + S.y;
		E.z = Ep.z + S.z;


		return E;
	}

}

exports.CreateSiteswap = CreateSiteswap;

})(typeof exports === 'undefined'? this['SiteswapJS']={}: exports);