/* -------------- */
/* SITESWAP CLASS */
/* -------------- */

function Siteswap() {	

	this.init = function(config) {

		/* ---------------------------- */
		/* READ INPUTS AND SET DEFAULTS */
		/* ---------------------------- */
		this.siteswap = config.siteswap;

		/* config validation */
		if (config.dwellDuration >= config.beatDuration) {
			throw 'Dwell duration must be less than beat duration'
		}

		/* ------------------------------------------------- */
		/* VALIDATE PATTERN FORMAT AND BREAK INTO TOSS ARRAY */		
		/* ------------------------------------------------- */

		this.numJugglers = 1;
		var isPassingPattern = /<[^ ]+>/.test(this.siteswap);

		var numJugglerMismatch = false;

		if (isPassingPattern) {
			var passingBeatArray = this.siteswap.match(/<[^ <>]+>/g);
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
		var validToss = "(\\d|[a-o])x?(" + passPattern + ")?(B*(L|HL|F|HF))?";
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

		if (this.siteswap.match(validSiteswapRe) && !numJugglerMismatch) {
			
			/* get the array of each beats' tosses */
			this.beatArr = isPassingPattern ? this.siteswap.match(validPassRe) : this.siteswap.match(validBeatRe);
			
			/* figure out how many props */
			var tmp = 0;
			this.beatArr.map(function(beat) {
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

			if((tmp/this.beatArr.length % 1) == 0 && tmp/this.beatArr.length > 0) {
				this.numProps = tmp/this.beatArr.length;
			} else {
				throw 'Invalid pattern - could not determine number of props'
			}

			/* if there is a valid number of props, start creating the state array */
			if(this.numProps) {

				/* initialize array of tosses */
				this.tossArr = [];

				/* for each beat get all the tosses */
				for (var i = 0; i < this.beatArr.length; i++) {
					var tosses = [];
					getTosses(tosses,this.beatArr[i], 0 /* assume juggler 0 */);
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

					/* TODO: explain this */
					var tmpPropOrbits = cloneState(this.propOrbits);

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
							throw 'Invalid pattern, no prop available to toss';
						}

						/* so long as this isn't a 0 toss, update the current state and append to prop orbits */
						if (toss.numBeats > 0) {
							
							if(!tmpPropOrbits[prop]) {
								tmpPropOrbits[prop] = [];
							}

							tmpPropOrbits[prop].push({beat: beat, juggler: toss.juggler, hand: tossHand, numBounces: toss.numBounces, bounceType: toss.bounceType});

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
						this.states.push(cloneState(curState));
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
	
		/* ----------------------- */
		/* GENERATE PROP POSITIONS */
		/* ----------------------- */

		/* initialize jugglers */
		this.jugglers = [];
		for (var i = 0; i < this.numJugglers; i++) {
			this.jugglers.push(
				new Juggler({
					position: {x:0,z:-2*i}, 
					rotation: i*Math.PI, 
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

		/* initialize prop positions */
		this.propPositions = [];
		for (var i = 0; i < this.numProps; i++) {
			this.propPositions.push([]);
		}

		/* initialize juggler hand positions */
		this.jugglerHandPositions = [];
		for (var i = 0; i < this.numJugglers; i++) {
			this.jugglerHandPositions.push([[],[]]);
		}

		/* create prop orbits */
		var numSteps = 1000;

		for (var step = 0; step < numSteps; step++) {
			
			var tmpJugglerHandPositions = [];
			for (var i = 0; i < this.numJugglers; i++) {
				tmpJugglerHandPositions.push([undefined,undefined]);
			}

			var currentBeat = Math.floor(step*this.states.length/numSteps);
			var currentTime = config.beatDuration*step*this.states.length/numSteps;

			/* find the current state of each prop */
			for(var prop = 0; prop < this.numProps; prop++) {
				
				var tossJuggler, tossHand, catchJuggler, catchHand, tossBeat, catchBeat, numBounces, bounceType;
				
				if (this.propOrbits[prop].length == 1) {
					tossBeat = this.propOrbits[prop][0].beat;
					tossJuggler = this.propOrbits[prop][0].juggler;
					tossHand = this.propOrbits[prop][0].hand;
					catchBeat = this.propOrbits[prop][0].beat;
					catchJuggler = this.propOrbits[prop][0].juggler;
					catchHand = this.propOrbits[prop][0].hand;	
					numBounces = this.propOrbits[prop][0].numBounces;
					bounceType = this.propOrbits[prop][0].bounceType;
				}
				var orbitBeatFound = false;
				for (var i = 0; i < this.propOrbits[prop].length-1; i++) {
					if (!orbitBeatFound && this.propOrbits[prop][i].beat <= currentBeat && this.propOrbits[prop][i+1].beat > currentBeat) {
						tossBeat = this.propOrbits[prop][i].beat;
						tossJuggler = this.propOrbits[prop][i].juggler;
						tossHand = this.propOrbits[prop][i].hand;
						catchBeat = this.propOrbits[prop][i+1].beat;
						catchJuggler = this.propOrbits[prop][i+1].juggler;
						catchHand = this.propOrbits[prop][i+1].hand;
						numBounces = this.propOrbits[prop][i].numBounces;
						bounceType = this.propOrbits[prop][i].bounceType;
						orbitBeatFound = true;
					} else if (!orbitBeatFound && i == this.propOrbits[prop].length-2) { 
						tossBeat = this.propOrbits[prop][i+1].beat;
						tossJuggler = this.propOrbits[prop][i+1].juggler;
						tossHand = this.propOrbits[prop][i+1].hand;
						catchBeat = this.propOrbits[prop][0].beat;
						catchJuggler = this.propOrbits[prop][0].juggler;
						catchHand = this.propOrbits[prop][0].hand;
						numBounces = this.propOrbits[prop][i+1].numBounces;
						bounceType = this.propOrbits[prop][i+1].bounceType;
					}
				}

				var tossTime = tossBeat*config.beatDuration+config.dwellDuration;
				var catchTime = catchBeat*config.beatDuration;
				if (tossTime >= catchTime && catchTime >= currentTime) { 
					tossTime -= (config.beatDuration*this.states.length);
				}
				if (tossTime >= catchTime && catchTime < currentTime) {
					catchTime += (config.beatDuration*this.states.length);	
				}

				if (currentTime < tossTime) {
					/* interpolate dwell path */
					var t = 1-(tossTime - currentTime)/config.dwellDuration;
					var pos = this.jugglers[tossJuggler].interpolateDwellPath(tossHand,t);
					this.propPositions[prop].push(pos);
					/* assign juggler hand positions */
					if (tmpJugglerHandPositions[tossJuggler][tossHand] == undefined) {
						tmpJugglerHandPositions[tossJuggler][tossHand] = pos;
					}
				} else {

					/*
					calculate position at current time
					*/

					var T = catchTime - tossTime;
					var t = currentTime - tossTime;

					this.propPositions[prop].push(
						interpolateFlightPath(
							this.jugglers[tossJuggler].interpolateDwellPath(tossHand,1), /* p0 */
							this.jugglers[catchJuggler].interpolateDwellPath(catchHand,0), /* p1 */
							T,
							t,
							{
								numBounces: numBounces, 
								bounceType: bounceType, 
								R: config.propRadius, 
								C: config.propC}
						)
					);

				}

			}

			/* set hand positions that weren't set */
			for (var juggler = 0; juggler < this.numJugglers; juggler++) {
				for (var hand = 0; hand <= 1; hand++) {
					if(tmpJugglerHandPositions[juggler][hand] == undefined) {
						/* find the next beat a prop is going to be in this hand and linearly move to the catch position */
						var nextBeat = undefined; 
						var minBeat = undefined;
						var lastBeat = undefined;
						var maxBeat = undefined;
						for (var prop = 0; prop < this.propOrbits.length; prop++) {
							for (var orbit = 0; orbit < this.propOrbits[prop].length; orbit++) {
								if (this.propOrbits[prop][orbit].juggler == juggler && this.propOrbits[prop][orbit].hand == hand) {
									// min beat
									if (minBeat == undefined || this.propOrbits[prop][orbit].beat < minBeat) {
										minBeat = this.propOrbits[prop][orbit].beat;
									}
									// next beat
									if (this.propOrbits[prop][orbit].beat > currentBeat && (nextBeat == undefined || this.propOrbits[prop][orbit].beat < nextBeat)) {
										nextBeat = this.propOrbits[prop][orbit].beat;
									}
									// max beat
									if (maxBeat == undefined || this.propOrbits[prop][orbit].beat > maxBeat) {
										maxBeat = this.propOrbits[prop][orbit].beat;
									}
									// last beat
									if (this.propOrbits[prop][orbit].beat <= currentBeat && (lastBeat == undefined || this.propOrbits[prop][orbit].beat > lastBeat)) {
										lastBeat = this.propOrbits[prop][orbit].beat;
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

						var nextCatchTime = nextBeat*config.beatDuration;
						if (nextCatchTime < currentTime) {
							nextCatchTime += (config.beatDuration*this.states.length);
						}
						var lastThrowTime = lastBeat*config.beatDuration+config.dwellDuration;
						if (lastThrowTime > currentTime) {
							lastThrowTime -= (config.beatDuration*this.states.length);
						}

						var throwPos = this.jugglers[juggler].interpolateDwellPath(hand,1);
						var catchPos = this.jugglers[juggler].interpolateDwellPath(hand,0);

						var x = throwPos.x + (catchPos.x-throwPos.x)/(nextCatchTime-lastThrowTime)*(currentTime-lastThrowTime);
						var y = throwPos.y + (catchPos.y-throwPos.y)/(nextCatchTime-lastThrowTime)*(currentTime-lastThrowTime);
						var z = throwPos.z + (catchPos.z-throwPos.z)/(nextCatchTime-lastThrowTime)*(currentTime-lastThrowTime);

						tmpJugglerHandPositions[juggler][hand] = {x:x,y:y,z:z};
					}
					this.jugglerHandPositions[juggler][hand].push(tmpJugglerHandPositions[juggler][hand]);
				}
			}

		}

		/* helper to get all the tosses for a given beat's siteswap */
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
				/* will work from "a" to "o" (p is reserved for passing) */
				var numBeats = (siteswap[0].charCodeAt(0) >= 97 && siteswap[0].charCodeAt(0) <= 111) ? siteswap[0].charCodeAt(0)-87 : parseInt(siteswap[0]);
				var targetJuggler = juggler;

				var pIx = siteswap.indexOf("p");
				if (pIx > 0) {
					if (this.numJugglers > 2) {
						targetJuggler = siteswap[pIx+1];
					} else {
						targetJuggler = 1 - juggler;
					}			
				}

				var numBounces = siteswap.split('B').length-1;
				var bounceType;
				if (siteswap.match("HF")) {
					bounceType = "HF";
				} else if (siteswap.match("HL")) {
					bounceType = "HL";
				} else if (siteswap.match("F")) {
					bounceType = "F";
				} else {
					bounceType = "L";
				}

				var crossing = numBeats % 2 == 1 ? true : false;
				// if the second character is an "x" then crossing is flipped
				if (siteswap.length > 1 && siteswap[1] == "x") {
					crossing = !crossing;
				}

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
						siteswap: siteswap,
						numBounces: numBounces,
						bounceType: bounceType
					}
				);
			}
		}

	}

	this.debugStatesText = function() {
		$('#states').empty();

		var html = '';
		for (var i = 0; i < this.states.length; i++) {
			html += (this.printState(i) + '<br/>');
		}
		$('#states').append(html);
	}

	/* returns a string describing a given state */
	this.printState = function(ix) {

		var str = (this.beatArr[ix%this.beatArr.length] + ' ');

		for(var juggler = 0; juggler < this.states[ix].length; juggler++) {
			str += ('J' + juggler + ' ');
			for (var hand = 0; hand < this.states[ix][juggler].length; hand++) {
				str += (hand == 0 ? 'L ' : 'R ');
				for (var beat = 0; beat < this.states[ix][juggler][hand].length; beat++) {
					str += '[';
					if (this.states[ix][juggler][hand][beat] == undefined) {
						str += 'X';
					} else {
						for (var prop = 0; prop < this.states[ix][juggler][hand][beat].length; prop++) {
							str += this.states[ix][juggler][hand][beat][prop];
						}
					}
					str += ']';
				}
				if (hand == 0) {				
					str += ' ';
				}
			}
			if (juggler < this.states[ix].length-1) {			
				str += ' ';
			}
		}

		return str;
	}

}