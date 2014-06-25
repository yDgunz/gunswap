(function(exports){

var flightPathCache = {};

/* CONSTANTS */

var LEFT = 0, RIGHT = 1;

/* HELPER FUNCTIONS */

/* calculates the sum of all throws in the siteswap. used to determine the number of props */
function sumThrows(str) {

	var total = 0;
	for (var i = 0; i < str.length; i++) {
		if(parseInt(str[i])) {
			total += parseInt(str[i]);					
		} else if (str.charCodeAt(i) >= 97 && str.charCodeAt(i) <= 111) {
			// handle "a" through "o" (where "a" = 10)
			total += str.charCodeAt(0)-87;
		}

		// if the current character is a pass marker 
		// ignore the next character so we don't count the
		// juggler identifier  in something like <5p2|5p3|5p1>
		if (str[i] == "p") {
			i++;
		}
	}

	return total;
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
		jugglers: 				undefined,
		validationOnly:			undefined,
		numSteps: 				undefined,
		beatDuration: 			undefined,
		dwellDuration: 			undefined,
		propRadius: 			undefined,
		propC: 					undefined,
		dwellPath: 				undefined,
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
		siteswap.numSteps = (options.numSteps === undefined ? 1000 : options.numSteps);
		siteswap.beatDuration = (options.beatDuration === undefined ? .2 : options.beatDuration);
		siteswap.dwellDuration = (options.dwellDuration === undefined ? .1 : options.dwellDuration);
		siteswap.propRadius = (options.propRadius === undefined ? .05 : options.propRadius);
		siteswap.propC = (options.propC === undefined ? .95 : options.propC);

		if (options.dwellPath === undefined) {
			siteswap.dwellPath = [
				/* left */
				{
					radius: .15,
					catchRotation: Math.PI,
					tossRotation: 2*Math.PI
				},
				/* right */
				{
					radius: .15,
					catchRotation: 2*Math.PI,
					tossRotation: Math.PI
				}
			]			
		} else {
			siteswap.dwellPath = options.dwellPath;
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
			passPattern = "p";
		} else if (numJugglers > 2) {
			passPattern = "p[1-" + numJugglers + "]";
		}

		/* construct the various regex patterns. see blog post for details about this */
		var validToss = "(R|L)?([\\da-o])x?(" + passPattern + ")?(B*(L|HL|F|HF))?";
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
	function getTosses(tosses, siteswapStr, juggler, sync, hand) {
		if (siteswapStr.match(validPassRe)) {
			var patterns = siteswapStr.match(validBeatRe);
			patterns.map(function(s,ix) {
				getTosses(tosses, s, ix);
			});
		} else if (siteswapStr.match(validSyncRe)) {
			var patterns = siteswapStr.split(",");
			getTosses(tosses,patterns[0].substr(1),juggler,true,LEFT);
			getTosses(tosses,patterns[1].substr(0,patterns.length),juggler,true,RIGHT);
		} else if (siteswapStr.match(validMultiplexRe)) {
			var patterns = siteswapStr.match(validTossRe);
			patterns.map(function(s) {
				getTosses(tosses,s,juggler);
			});
		} else {
			/* will work from "a" to "o" (p is reserved for passing) */
			var numBeats = (siteswapStr[0].charCodeAt(0) >= 97 && siteswapStr[0].charCodeAt(0) <= 111) ? siteswapStr[0].charCodeAt(0)-87 : parseInt(siteswapStr[0]);
			var targetJuggler = juggler;

			var pIx = siteswapStr.indexOf("p");
			if (pIx > 0) {				
				if (siteswap.numJugglers > 2) {					
					targetJuggler = parseInt(siteswapStr[pIx+1])-1;
				} else {
					targetJuggler = 1 - juggler;
				}			
			}

			var numBounces = siteswapStr.split('B').length-1;
			var bounceType;
			if (siteswapStr.match("HF")) {
				bounceType = "HF";
			} else if (siteswapStr.match("HL")) {
				bounceType = "HL";
			} else if (siteswapStr.match("F")) {
				bounceType = "F";
			} else if (siteswapStr.match("L")) {
				bounceType = "L";
			} else {
				bounceType = undefined;
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

			var numSpins = Math.floor(numBeats/2);

			tosses.push(
				{
					juggler: juggler,
					targetJuggler: targetJuggler,
					hand: hand,
					crossing: crossing,
					numBeats: numBeats,
					siteswapStr: siteswapStr,
					numBounces: numBounces,
					bounceType: bounceType,
					numSpins: numSpins
				}
			);
		}
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

		siteswap.tosses = [];

		/* for each beat get all the tosses */
		for (var i = 0; i < siteswap.beats.length; i++) {
			var tosses = [];
			getTosses(tosses,siteswap.beats[i], 0 /* assume juggler 0 */);
			siteswap.tosses.push(tosses);
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

					tmpPropOrbits[prop].push({beat: beat, juggler: toss.juggler, hand: tossHand, numBounces: toss.numBounces, bounceType: toss.bounceType, numSpins: toss.numSpins});

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

		siteswap.validPattern = true;
	}

	function generatePropPositions() {

		//try {
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
					
					var tossJuggler, tossHand, catchJuggler, catchHand, tossBeat, catchBeat, numBounces, bounceType, numSpins;
					
					if (siteswap.propOrbits[prop].length == 1) {
						tossBeat = siteswap.propOrbits[prop][0].beat;
						tossJuggler = siteswap.propOrbits[prop][0].juggler;
						tossHand = siteswap.propOrbits[prop][0].hand;
						catchBeat = siteswap.propOrbits[prop][0].beat;
						catchJuggler = siteswap.propOrbits[prop][0].juggler;
						catchHand = siteswap.propOrbits[prop][0].hand;	
						numBounces = siteswap.propOrbits[prop][0].numBounces;
						bounceType = siteswap.propOrbits[prop][0].bounceType;
						numSpins = siteswap.propOrbits[prop][0].numSpins;
					}
					var orbitBeatFound = false;
					for (var i = 0; i < siteswap.propOrbits[prop].length-1; i++) {
						if (!orbitBeatFound && siteswap.propOrbits[prop][i].beat <= currentBeat && siteswap.propOrbits[prop][i+1].beat > currentBeat) {
							tossBeat = siteswap.propOrbits[prop][i].beat;
							tossJuggler = siteswap.propOrbits[prop][i].juggler;
							tossHand = siteswap.propOrbits[prop][i].hand;
							catchBeat = siteswap.propOrbits[prop][i+1].beat;
							catchJuggler = siteswap.propOrbits[prop][i+1].juggler;
							catchHand = siteswap.propOrbits[prop][i+1].hand;
							numBounces = siteswap.propOrbits[prop][i].numBounces;
							bounceType = siteswap.propOrbits[prop][i].bounceType;
							numSpins = siteswap.propOrbits[prop][i].numSpins;
							orbitBeatFound = true;
						} else if (!orbitBeatFound && i == siteswap.propOrbits[prop].length-2) { 
							tossBeat = siteswap.propOrbits[prop][i+1].beat;
							tossJuggler = siteswap.propOrbits[prop][i+1].juggler;
							tossHand = siteswap.propOrbits[prop][i+1].hand;
							catchBeat = siteswap.propOrbits[prop][0].beat;
							catchJuggler = siteswap.propOrbits[prop][0].juggler;
							catchHand = siteswap.propOrbits[prop][0].hand;
							numBounces = siteswap.propOrbits[prop][i+1].numBounces;
							bounceType = siteswap.propOrbits[prop][i+1].bounceType;
							numSpins = siteswap.propOrbits[prop][i+1].numSpins;
						}
					}

					var tossTime = tossBeat*siteswap.beatDuration+siteswap.dwellDuration;
					var catchTime = catchBeat*siteswap.beatDuration;
					if (tossTime >= catchTime && catchTime >= currentTime) { 
						tossTime -= (siteswap.beatDuration*siteswap.states.length);
					}
					if (tossTime >= catchTime && catchTime < currentTime) {
						catchTime += (siteswap.beatDuration*siteswap.states.length);	
					}

					if (currentTime < tossTime) {
						/* interpolate dwell path */
						var t = 1-(tossTime - currentTime)/siteswap.dwellDuration;
						var pos = interpolateDwellPath(siteswap.jugglers[tossJuggler],tossHand,t);
						propPositions[prop].push(pos);
						/* assign juggler hand positions */
						if (tmpJugglerHandPositions[tossJuggler][tossHand] == undefined) {
							tmpJugglerHandPositions[tossJuggler][tossHand] = pos;
						}
						/* default in hand rotation */
						propRotations[prop].push({ x: 3*Math.PI/2, y: 0, z:0 });
					} else {

						/*
						calculate position at current time
						*/

						var T = catchTime - tossTime;
						var t = currentTime - tossTime;

						propPositions[prop].push(
							interpolateFlightPath(
								interpolateDwellPath(siteswap.jugglers[tossJuggler],tossHand,1), /* p0 */
								interpolateDwellPath(siteswap.jugglers[catchJuggler],catchHand,0), /* p1 */
								T,
								t,
								{
									numBounces: numBounces, 
									bounceType: bounceType, 
									R: siteswap.propRadius, 
									C: siteswap.propC}
							)
						);

						var catchRotation = (3+4*numSpins)*Math.PI/2;
						var tossRotation = 3*Math.PI/2;
						var currentRotation = tossRotation + (t/T)*(catchRotation - tossRotation);

						propRotations[prop].push({x: currentRotation, y: 0, z: 0});

					}

				}

				/* set hand positions that weren't set */
				for (var juggler = 0; juggler < siteswap.numJugglers; juggler++) {
					for (var hand = 0; hand <= 1; hand++) {
						if(tmpJugglerHandPositions[juggler][hand] == undefined) {
							/* find the next beat a prop is going to be in this hand and linearly move to the catch position */
							var nextBeat = undefined; 
							var minBeat = undefined;
							var lastBeat = undefined;
							var maxBeat = undefined;
							for (var prop = 0; prop < siteswap.propOrbits.length; prop++) {
								for (var orbit = 0; orbit < siteswap.propOrbits[prop].length; orbit++) {
									if (siteswap.propOrbits[prop][orbit].juggler == juggler && siteswap.propOrbits[prop][orbit].hand == hand) {
										// min beat
										if (minBeat == undefined || siteswap.propOrbits[prop][orbit].beat < minBeat) {
											minBeat = siteswap.propOrbits[prop][orbit].beat;
										}
										// next beat
										if (siteswap.propOrbits[prop][orbit].beat > currentBeat && (nextBeat == undefined || siteswap.propOrbits[prop][orbit].beat < nextBeat)) {
											nextBeat = siteswap.propOrbits[prop][orbit].beat;
										}
										// max beat
										if (maxBeat == undefined || siteswap.propOrbits[prop][orbit].beat > maxBeat) {
											maxBeat = siteswap.propOrbits[prop][orbit].beat;
										}
										// last beat
										if (siteswap.propOrbits[prop][orbit].beat <= currentBeat && (lastBeat == undefined || siteswap.propOrbits[prop][orbit].beat > lastBeat)) {
											lastBeat = siteswap.propOrbits[prop][orbit].beat;
										}
									}
								}
							}
							if (nextBeat == undefined) {
								nextBeat = minBeat;
							}
							if (lastBeat == undefined) {
								lastBeat = maxBeat;
							}

							var nextCatchTime = nextBeat*siteswap.beatDuration;
							if (nextCatchTime < currentTime) {
								nextCatchTime += (siteswap.beatDuration*siteswap.states.length);
							}
							var lastThrowTime = lastBeat*siteswap.beatDuration+siteswap.dwellDuration;
							if (lastThrowTime > currentTime) {
								lastThrowTime -= (siteswap.beatDuration*siteswap.states.length);
							}

							var throwPos = interpolateDwellPath(siteswap.jugglers[juggler],hand,1);
							var catchPos = interpolateDwellPath(siteswap.jugglers[juggler],hand,0);

							var x = throwPos.x + (catchPos.x-throwPos.x)/(nextCatchTime-lastThrowTime)*(currentTime-lastThrowTime);
							var y = throwPos.y + (catchPos.y-throwPos.y)/(nextCatchTime-lastThrowTime)*(currentTime-lastThrowTime);
							var z = throwPos.z + (catchPos.z-throwPos.z)/(nextCatchTime-lastThrowTime)*(currentTime-lastThrowTime);

							tmpJugglerHandPositions[juggler][hand] = {x:x,y:y,z:z};
						}
						jugglerHandPositions[juggler][hand].push(tmpJugglerHandPositions[juggler][hand]);
					}
				}

			}

			siteswap.propPositions = propPositions;
			siteswap.propRotations = propRotations;
			siteswap.jugglerHandPositions = jugglerHandPositions;

		/*} catch(e) {
			siteswap.errorMessage = e.message;
		}*/
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
		var zt = p0.z + (p1.z-p0.z)*t/T;

		var inputKey = JSON.stringify({p0:p0,p1:p1,T:T,options:options});

		if (options.numBounces == 0) {

			return  {
				x: xt,
				y: p0.y + (p1.y - p0.y - .5*options.G*T*T)*t/T + .5*options.G*t*t,
				z: zt
			};

		} else if (flightPathCache[inputKey] == undefined) {

			var done = true;

			/* run simulation */
			
			var tries = 0;
			var v0 = 0; // starting toss y velocity
			done = false;

			while (!done && tries <= options.tries) {

				var y = [p0.y];
				var vy = v0;
				var bounces = 0;

				for (var tSim = 0; tSim < T; tSim += options.dt) {

					/* update position and velocity */
					y.push(y[y.length-1] + vy*options.dt);
					vy += options.G*options.dt;

					/* if the prop is at the floor, velocity changes and loses momentum according to C */
					if (y[y.length-1] - options.R <= 0 && vy <= 0) {
						vy = -options.C*vy;
						bounces++;
					}

				}

				if (bounces == options.numBounces && Math.abs(p1.y-y[y.length-1]) <= options.eps && ( ( (options.bounceType == "HF" || options.bounceType == "L") && vy >= 0) || ( (options.bounceType == "F" || options.bounceType == "HL") && vy <= 0) )) {
					done = true;
					flightPathCache[inputKey] = y;				
				} else {

					/* check to see if this just isn't going to happen */
					if ( (options.bounceType == "HL" || options.bounceType == "L" || options.bounceType == "F" || (options.bounceType == "HF" && options.numBounces > 1)) && bounces < options.numBounces ) {
						throw 'Not enough time for all bounces'
					} else if (options.bounceType == "HF" && options.numBounces == 1 && y[y.length-1] > p1.y+options.eps) {
						throw 'Too much time for hyperforce and single bounce'
					}

					if (options.bounceType == "HL" || options.bounceType == "L") {
						v0+=options.dv;
					} else {
						v0-=options.dv;
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

	function interpolateDwellPath(juggler,hand,t) {
		/* t goes from 0 to 1 */
		var currentRotation = siteswap.dwellPath[hand].catchRotation + (siteswap.dwellPath[hand].tossRotation - siteswap.dwellPath[hand].catchRotation)*t;
		
		var dwellPosition = {
			x: siteswap.dwellPath[hand].radius*Math.cos(currentRotation),
			y: siteswap.dwellPath[hand].radius*Math.sin(currentRotation),
			z: 0
		};

		return {
			x: juggler.position.x - .4125*Math.sin(juggler.rotation) + ((hand == LEFT ? -1 : 1)*.225+dwellPosition.x)*Math.cos(juggler.rotation),
			y: 1.0125 + dwellPosition.y,
			z: juggler.position.z - .4125*Math.cos(juggler.rotation) + ((hand == LEFT ? -1 : 1)*.225/2+dwellPosition.x)*Math.sin(juggler.rotation)
		};
	}
}

exports.CreateSiteswap = CreateSiteswap;

})(typeof exports === 'undefined'? this['SiteswapJS']={}: exports);