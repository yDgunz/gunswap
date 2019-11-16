import { Siteswap as SiteswapClass } from "./Siteswap";
import { DwellPath } from "./DwellPath";
import * as SiteswapRegex from "./SiteswapRegex";
import { Prop, PropType, ScheduledToss } from "./Prop";
import { Toss, Hand, TossType, CatchType } from "./Toss";
import { PatternSimulation } from "./PatternSimulation";
import { vec3 } from "@tlaukkan/tsm";
import { GetTossPathPositionAndVelocity } from "./TossPath";
import { InterpolateBezierSpline } from "./Bezier";
import { ShoulderZOffset, ShoulderHeight, ArmHalfLength, ShoulderXOffset, BasePatternHeight, ArmAngle } from "./JugglerConfig";

export interface PropLanding {
	Prop : Prop,
	Juggler : number,
	Hand : Hand
}

export class Pattern {	

	public readonly Props : Prop[];
	public readonly TossCollection : Toss[][];
	public readonly States : (Prop[]|null)[][][][]; // States[referenceBeat][juggler][hand][beat] contains a Prop[] of the props scheduled to land at beat as of the referenceBeat
	public Simulation : PatternSimulation|undefined;

	constructor(public readonly Siteswap : SiteswapClass, public readonly DwellPaths : DwellPath[], defaultDwellRatio : number, numSurfaces : number) {
		
		// TODO: move GetTossCollection to this class
		this.TossCollection = Siteswap.GetTossCollection(DwellPaths, defaultDwellRatio, numSurfaces);

		/* figure out how many props */
		var sumOfAllTosses = 0;
		var _this = this;
		Siteswap.Beats.map(function(beat) {
			if (beat.match(SiteswapRegex.ValidPassRe)) {
				var patterns = beat.split('|');
				for (var i = 0; i < patterns.length; i++) {
					if (i == 0) {
						patterns[i] = patterns[i].substr(1);
					} 
					if (i == patterns.length-1) {
						patterns[i] = patterns[i].substr(0,patterns[i].length-1);
					}
					sumOfAllTosses += _this.sumThrows(patterns[i]);
				}
			} else {
				sumOfAllTosses += _this.sumThrows(beat);
			}
		});

		if((sumOfAllTosses/Siteswap.Beats.length % 1) == 0 && sumOfAllTosses/Siteswap.Beats.length > 0) {
			var numProps = sumOfAllTosses/Siteswap.Beats.length;
		} else {		
			throw "Cannot determine number of props";
		}

		// TODO: update this to use prop templates from constructor
		this.Props = [];
		for(let i = 0; i < numProps; i++) {
			this.Props.push(new Prop(i,PropType.Ball, 0.5, 0.1));
		}		

		/* figure out the max throw height which will inform the size of the state array */
		var maxHeight = 0;

		this.TossCollection.forEach(x => {
			x.forEach(y => {
				if (y.NumBeats > maxHeight) {
					maxHeight = y.NumBeats;
				}
			});
		});
		
		/* ------------------------------------ */
		/* GENERATE STATE ARRAY AND PROP ORBITS */
		/* ------------------------------------ */
		
		/* create a queue of props */
		var propsQueue = this.Props.slice(0);		
		
		/* initialize the state and prop orbits array */
		this.States = [];

		/* initialize current state */
		var curState : (Prop[]|null)[][][] = []; // curState[juggler][hand][beat] can be null (ie. no props landing) or Prop[] (ie. list of props landing, more than 1 in case of a multiplex)
		for (var j = 0; j < Siteswap.NumJugglers; j++) {
			curState.push([[],[]]);
			for (var k = 0; k < maxHeight; k++) {
				curState[j][Hand.Left].push(null);
				curState[j][Hand.Right].push(null);
			}
		}

		var patternComplete = false;
		var initComplete = false;
		var beat = 0;
		var hand = Hand.Left;
		
		while (!patternComplete) {
			
			/* queue of props to throw this beat */
			var propsLanding : PropLanding[] = [];

			curState.forEach((juggler, jugglerIx) => {
				var landingLeft = juggler[Hand.Left].shift();
				juggler[Hand.Left].push(null);
				if (landingLeft) {
					landingLeft.forEach(prop => {
						propsLanding.push({
							Prop: prop,
							Juggler: jugglerIx,
							Hand: Hand.Left
						});
					});					
				}

				var landingRight = juggler[Hand.Right].shift();
				juggler[Hand.Right].push(null);
				if (landingRight) {
					landingRight.forEach(prop => {
						propsLanding.push({
							Prop: prop,
							Juggler: jugglerIx,
							Hand: Hand.Right
						});
					});					
				}
			});
			
			/* iterate through all the tosses and update the current state */
			this.TossCollection[beat % this.TossCollection.length].forEach(toss => {
				
				var tossHand = toss.Hand == Hand.Any ? hand : toss.Hand;
				var catchHand = toss.Crossing ? 1 - tossHand : tossHand; 

				var propToToss : Prop|undefined = undefined;

				// go through props landing and look for one landing in the hand that this toss is occurring
				for (var propLandingIx = 0; propLandingIx < propsLanding.length; propLandingIx++) {
					var propLanding = propsLanding[propLandingIx];
					if(propLanding.Hand == tossHand && propLanding.Juggler == toss.Juggler) {
						// if a prop is landing in a hand that is tossing a 0 then invalid pattern
						if(toss.NumBeats == 0) {
							throw `Prop landing on 0 toss at beat ${beat}`;
						}
						propToToss = propLanding.Prop;
						propsLanding.splice(propLandingIx,1);
						break;
					}
				}

				// if no props landing to be thrown, get one from the queue - only if this isn't a 0 toss
				if  (propToToss === undefined && toss.NumBeats > 0) {
					propToToss = propsQueue.shift();
				}

				// if prop is still undefined (ie. there are none left) then we've got an invalid siteswap - only if this isn't a 0 toss
				if  (propToToss === undefined && toss.NumBeats > 0) {
					throw `No prop available to toss at beat ${beat}`;
				}

				// so long as this isn't a 0 toss, update the current state and add to props scheduled tosses
				if (toss.NumBeats > 0) {				

					// only build TossSchedule once init is complete 
					if (initComplete) {
	
						propToToss!.TossSchedule.push({
							Toss: toss,
							Beat: beat,
							Hand: tossHand
						})
					}										

					if(curState[toss.TargetJuggler][catchHand][toss.NumBeats-1]) {
						curState[toss.TargetJuggler][catchHand][toss.NumBeats-1]!.push(propToToss as Prop);						
					} else {
						curState[toss.TargetJuggler][catchHand][toss.NumBeats-1] = [propToToss as Prop];
					}

				}								

			});	
			
			// TODO: address performance/memory concerns with constantly recreating state arrays using this deep clone method
			if(initComplete) {
				// if we're at the beginning of the toss array and we've returned to the original state, the pattern is complete
				if (beat % this.TossCollection.length == 0 && JSON.stringify(this.States[0], ["Id"]) == JSON.stringify(curState, ["Id"])) {
					patternComplete = true;	
					
					// if the pattern is complete now we need to remove the last set of scheduled tosses
					// this is kind of a hack				
					this.Props.forEach(prop => {
						var i = 0;
						if (prop.TossSchedule[prop.TossSchedule.length-1].Beat == beat) {
							prop.TossSchedule.pop();
						}
					});
					
				} else {
					// add the current state to the state array
					this.States.push(JSON.parse(JSON.stringify(curState, ["Id"])));
				}	
			} else {
				// if all props have been introduced to pattern and we're at the end of the pattern, init is complete and steady-state pattern truly begins with the next beat
				if (propsQueue.length == 0 && (beat+1) % this.TossCollection.length == 0) {
					initComplete = true;
					beat = -1;
					this.States = []; 
				}	
			}

			beat++;
			hand = 1 - hand; //alternate hands

			/* fail safe in case the pattern is too long */
			if (beat > 1000) {
				throw "Pattern took more than 1000 beats to repeat states";
			}

		}

	}

	private sumThrows(str : string) : number {
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

	public Simulate(numStepsPerBeat : number, beatDuration : number, breakOnCollision : boolean = false) : boolean {
		var totalNumBeats = this.States.length;
		var numSteps = totalNumBeats*numStepsPerBeat;		
		var hasCollision = false;
		
		// initialize pattern simulation
		var patternSimulation : PatternSimulation = {
			Props: [],
			Jugglers: [],
			BeatDuration: beatDuration,
			NumStepsPerBeat: numStepsPerBeat,
		};

		this.Props.forEach(prop => patternSimulation.Props.push({
			Positions: [],
			Rotations: []
		}));

		this.States[0].forEach((juggler, jugglerIx, jugglers) => {
		
			// todo - this is still a bit hokey and should be based on inputs

			var bodyPosition : vec3;
			var bodyRotation : number;

			if (jugglers.length == 1) {
				bodyPosition = new vec3([0,0,0]);
				bodyRotation = 0;
			} else {
				var jugglerCircleRadius = 1;

				var t = jugglerIx/jugglers.length;

				bodyRotation = t*Math.PI*2;

				bodyPosition = new vec3([
					-jugglerCircleRadius*Math.sin(bodyRotation),
					0,
					jugglerCircleRadius*Math.cos(bodyRotation)
				]);

			}

			patternSimulation.Jugglers.push({
				BodyPositions: Array(numSteps).fill(bodyPosition),
				BodyRotations: Array(numSteps).fill(bodyRotation),
				LeftHandPositions: [],
				RightHandPositions: [],
				LeftElbowPositions: [],
				RightElbowPositions: [],
				LeftHandDirections: [],
				RightHandDirections: []
			})
		});

		for(var step = 0; step < numSteps; step++) {
			var currentBeat = Math.floor(step*totalNumBeats/numSteps);
			var currentTime = beatDuration*step*totalNumBeats/numSteps;

			// find position of each prop
			this.Props.forEach((prop, propIx) => {
				var prevToss : ScheduledToss;
				var curToss : ScheduledToss;
				var nextToss : ScheduledToss;

				[prevToss, curToss, nextToss] = prop.GetPreviousCurrentAndNextTossForBeat(currentBeat);

				// create "virtual" beat/time if the previous/next toss results in a loop back through the states
				var virtualCurrentTime = currentTime;

				var prevTossVirtualBeat = prevToss.Beat;
				if (prevTossVirtualBeat >= curToss.Beat) {
					prevTossVirtualBeat -= totalNumBeats;				
				}

				var nextTossVirtualBeat = nextToss.Beat;
				var curTossVirtualBeat = curToss.Beat;
				if (nextTossVirtualBeat <= curToss.Beat) {
					prevTossVirtualBeat -= totalNumBeats;
					curTossVirtualBeat -= totalNumBeats;
				}

				var tossTime = curTossVirtualBeat*beatDuration + curToss.Toss.DwellRatio*beatDuration;
				var catchTime = nextTossVirtualBeat*beatDuration;
				var prevTossTime = prevTossVirtualBeat*beatDuration + prevToss.Toss.DwellRatio*beatDuration;
				var prevCatchTime = curTossVirtualBeat*beatDuration;

				if (virtualCurrentTime >= catchTime) {
					virtualCurrentTime -= totalNumBeats*beatDuration;
				}							

				var prevTossJugglerBodyPosition = patternSimulation.Jugglers[prevToss.Toss.Juggler].BodyPositions[step];
				var prevTossJugglerBodyRotation = patternSimulation.Jugglers[prevToss.Toss.Juggler].BodyRotations[step];

				var tossJugglerBodyPosition = patternSimulation.Jugglers[curToss.Toss.Juggler].BodyPositions[step];
				var tossJugglerBodyRotation = patternSimulation.Jugglers[curToss.Toss.Juggler].BodyRotations[step];

				var catchJugglerBodyPosition = patternSimulation.Jugglers[nextToss.Toss.Juggler].BodyPositions[step];
				var catchJugglerBodyRotation = patternSimulation.Jugglers[nextToss.Toss.Juggler].BodyRotations[step];

				// if we're before the toss then we're in the dwell path
				if (virtualCurrentTime < tossTime || curToss.Toss.Hold) {
					// velocity at time of catch
					var prevTossFlightTime = prevCatchTime - prevTossTime;				

					var catchVelocity = GetTossPathPositionAndVelocity(prevToss, curToss, prevTossFlightTime, prevTossFlightTime, prevTossJugglerBodyPosition, prevTossJugglerBodyRotation, tossJugglerBodyPosition, tossJugglerBodyRotation)[1];

					// velocity at the time of throw
					var tossVelocity = GetTossPathPositionAndVelocity(curToss, nextToss, 0, catchTime-tossTime, tossJugglerBodyPosition, tossJugglerBodyRotation, catchJugglerBodyPosition, catchJugglerBodyRotation)[1];

					var t : number;
					if (curToss.Toss.Hold) {
						var t = 1 - (catchTime - virtualCurrentTime) / (catchTime - prevCatchTime);
					} else {
						var t = 1 - (tossTime - virtualCurrentTime) / (tossTime - prevCatchTime);
					}
					
					var pos = curToss.Toss.DwellPath.GetPosition(t, curToss.Hand, catchVelocity, tossVelocity, 0.01, 0.015, curToss.Toss.Hold ? nextToss.Toss.DwellPath.Snapshots[0] : null, tossJugglerBodyPosition, tossJugglerBodyRotation);
					
					patternSimulation.Props[propIx].Positions.push(pos);				

					var handDirection = this.interpolateHandDirection(catchVelocity.copy().scale(curToss.Toss.CatchType == CatchType.Claw ? 1 : -1), tossVelocity.copy().scale(curToss.Toss.TossType == TossType.Claw ? -1 : 1), t);

					if (curToss.Hand === Hand.Left) {
						patternSimulation.Jugglers[curToss.Toss.Juggler].LeftHandPositions[step] = pos;
						patternSimulation.Jugglers[curToss.Toss.Juggler].LeftHandDirections[step] = handDirection;
					} else {
						patternSimulation.Jugglers[curToss.Toss.Juggler].RightHandPositions[step] = pos;
						patternSimulation.Jugglers[curToss.Toss.Juggler].RightHandDirections[step] = handDirection;
					}

				} else {
					// figure out flight path
					var T = catchTime - tossTime;
					var t = virtualCurrentTime - tossTime;
					
					var pos = GetTossPathPositionAndVelocity(curToss, nextToss, t, T, tossJugglerBodyPosition, tossJugglerBodyRotation, catchJugglerBodyPosition, catchJugglerBodyRotation)[0];

					patternSimulation.Props[propIx].Positions.push(pos);
				}

			});

			// check to see if any of the props are colliding
			for (var i = 0; i < this.Props.length; i++) {
				for (var j = i+1; j < this.Props.length; j++) {
					var pos1 = patternSimulation.Props[i].Positions[step];
					var pos2 = patternSimulation.Props[j].Positions[step];
					var dist = vec3.distance(pos1, pos2);
					if (dist < this.Props[i].Radius || dist < this.Props[j].Radius) {
						if (breakOnCollision) {
							return false;
						} else {
							hasCollision = true;
						}
					}
				}
			}

			// find position for hands that are empty and calculate elbow positions
			patternSimulation.Jugglers.forEach((juggler, jugglerIx) => {
				[Hand.Left, Hand.Right].forEach((hand) => {
					/* need 
						nextToss - to determine where the hand is going to
						propLastToss - to determine where the prop we're catching came from so we know its catch velocity
						lastToss - to determine where the hand is coming from
						propNextToss - to determine where the prop we just tossed is going so we know its toss velocity
					*/

					if ((hand === Hand.Left && juggler.LeftHandPositions[step] === undefined) || (hand === Hand.Right && juggler.RightHandPositions[step] === undefined)) {
						
						var handNextToss : ScheduledToss|undefined;
						var handNextTossVirtualBeat : number = 0;						
						this.Props.forEach((prop) => {
							prop.TossSchedule.forEach((scheduledToss) => {
								
								var scheduledTossVirtualBeat = scheduledToss.Beat;
								if (scheduledTossVirtualBeat <= currentBeat) {
									scheduledTossVirtualBeat += totalNumBeats;
								}								
								
								if (scheduledTossVirtualBeat > currentBeat && scheduledToss.Toss.Juggler == jugglerIx && scheduledToss.Hand == hand) {
									if (handNextToss === undefined || scheduledTossVirtualBeat < handNextTossVirtualBeat) {
										handNextToss = scheduledToss;
										handNextTossVirtualBeat = scheduledTossVirtualBeat;
									}
								}
								
							});
						});

						var handLastToss : ScheduledToss|undefined;	
						var handLastTossVirtualBeat : number = 0;					
						this.Props.forEach((prop) => {
							prop.TossSchedule.forEach((scheduledToss) => {
								
								var scheduledTossVirtualBeat = scheduledToss.Beat;
								if (scheduledTossVirtualBeat > currentBeat) {
									scheduledTossVirtualBeat -= totalNumBeats;
								}

								if (scheduledTossVirtualBeat <= currentBeat && scheduledToss.Toss.Juggler == jugglerIx && scheduledToss.Hand == hand) {
									if (handLastToss === undefined || scheduledTossVirtualBeat > handLastTossVirtualBeat) {
										handLastToss = scheduledToss;
										handLastTossVirtualBeat = scheduledTossVirtualBeat;
									}
								}								
							});
						});											
					
						var handPos : vec3;
						var handDirection : vec3;
						if (handLastToss === undefined || handNextToss === undefined) {
							// TODO - don't hardcode this
							handPos = new vec3([.3*hand == Hand.Left ? -1 : 1, BasePatternHeight, 0]);							
							handDirection = new vec3([0,1,0]);
						} else {
							var emptyHandPath : vec3[] = [];
							emptyHandPath.push(handLastToss.Toss.DwellPath.Snapshots[handLastToss.Toss.DwellPath.Snapshots.length-1].Position.copy());
							emptyHandPath.push(handNextToss.Toss.DwellPath.Snapshots[0].Position.copy());

							var catchingPropLastToss : ScheduledToss;
							var tossedPropNextToss : ScheduledToss;

							this.Props.forEach((prop) => {
								prop.TossSchedule.forEach((scheduledToss, scheduledTossIx, tossSchedule) => {
									if(scheduledToss.Hand === hand && scheduledToss.Beat === handNextToss!.Beat && scheduledToss.Toss.Juggler === jugglerIx) {
										if (scheduledTossIx == 0) {
											catchingPropLastToss = tossSchedule[tossSchedule.length-1];
										} else {
											catchingPropLastToss = tossSchedule[scheduledTossIx-1];
										}
									}
								});
							});
							
							this.Props.forEach((prop) => {
								prop.TossSchedule.forEach((scheduledToss, scheduledTossIx, tossSchedule) => {
									if(scheduledToss === handLastToss) {
										if (scheduledTossIx === (tossSchedule.length-1)) {
											tossedPropNextToss = tossSchedule[0];
										} else {
											tossedPropNextToss = tossSchedule[scheduledTossIx+1];
										}
									}
								});
							});

							// the juggler whose empty hand we're calculting
							var jugglerBodyPosition = juggler.BodyPositions[step];
							var jugglerBodyRotation = juggler.BodyRotations[step];

							// the juggler that we just tossed a prop to
							var tossedPropCatchingJugglerBodyPosition = patternSimulation.Jugglers[handLastToss.Toss.TargetJuggler].BodyPositions[step];
							var tossedPropCatchingJugglerBodyRotation = patternSimulation.Jugglers[handLastToss.Toss.TargetJuggler].BodyRotations[step]; 

							// the juggler that tossed the prop we're catching
							var catchingPropTossJugglerBodyPosition = patternSimulation.Jugglers[catchingPropLastToss!.Toss.Juggler].BodyPositions[step];
							var catchingPropTossJugglerBodyRotation = patternSimulation.Jugglers[catchingPropLastToss!.Toss.Juggler].BodyRotations[step];

							var tossVelocity = GetTossPathPositionAndVelocity(handLastToss, tossedPropNextToss!, 0, handLastToss.Toss.NumBeats*beatDuration, jugglerBodyPosition, jugglerBodyRotation, tossedPropCatchingJugglerBodyPosition, tossedPropCatchingJugglerBodyRotation)[1];
							var catchVelocity = GetTossPathPositionAndVelocity(catchingPropLastToss!, handNextToss, catchingPropLastToss!.Toss.NumBeats*beatDuration-catchingPropLastToss!.Toss.DwellRatio*beatDuration,catchingPropLastToss!.Toss.NumBeats*beatDuration-catchingPropLastToss!.Toss.DwellRatio*beatDuration, catchingPropTossJugglerBodyPosition, catchingPropTossJugglerBodyRotation, jugglerBodyPosition, jugglerBodyRotation)[1];
							
							if (hand === Hand.Left) {
								emptyHandPath.forEach((x) => x.x*=-1);
							}

							var virtualCurrentTime = currentTime;
							if (virtualCurrentTime > handNextTossVirtualBeat*beatDuration) {
								virtualCurrentTime -= totalNumBeats*beatDuration;
							}

							var totalEmptyHandTime = handNextTossVirtualBeat*beatDuration - (handLastTossVirtualBeat*beatDuration + handLastToss.Toss.DwellRatio*beatDuration);
							var t = (virtualCurrentTime - (handLastTossVirtualBeat*beatDuration + handLastToss.Toss.DwellRatio*beatDuration))/totalEmptyHandTime;

							// todo - this probably doesn't actually work
							// fail-safe in case virtual times weren't calculated perfectly
							// solves bug with hands flashing to wrong position for even patterns like 4
							if (t < 0) {
								t = 1;
							}
							if (t > 1) {
								t = 0;
							}

							for (var i = 0; i < emptyHandPath.length; i++) {
								var copy = emptyHandPath[i].copy();
								emptyHandPath[i].x = copy.x*Math.cos(jugglerBodyRotation) - copy.z*Math.sin(jugglerBodyRotation);
								emptyHandPath[i].y = copy.y + BasePatternHeight;
								emptyHandPath[i].z = copy.x*Math.sin(jugglerBodyRotation) + copy.z*Math.cos(jugglerBodyRotation);							
							
								emptyHandPath[i].add(jugglerBodyPosition);
							}							

							handPos = InterpolateBezierSpline(emptyHandPath,t,tossVelocity,catchVelocity,0.01,0.01,false);

							var handDirection = this.interpolateHandDirection(tossVelocity.copy().scale(handLastToss.Toss.TossType == TossType.Claw ? -1 : 1), catchVelocity.copy().scale(handNextToss.Toss.CatchType == CatchType.Claw ? 1 : -1), t);

						}						
						
						if (hand === Hand.Left) {
							juggler.LeftHandPositions[step] = handPos;
							juggler.LeftHandDirections[step] = handDirection;
						} else {
							juggler.RightHandPositions[step] = handPos;
							juggler.RightHandDirections[step] = handDirection;
						}

					}

					// now that both hands are accounted for, calculate elbow positions					
					var rot = juggler.BodyRotations[step];
					var pos = juggler.BodyPositions[step];
					var x = (hand === Hand.Left ? - 1 : 1)*ShoulderXOffset;
					var z = ShoulderZOffset;
					var shoulderPosition = new vec3([
						pos.x + (x*Math.cos(rot) - z*Math.sin(rot)),
						ShoulderHeight,
						pos.z + (x*Math.sin(rot) + z*Math.cos(rot))
						
					]);
					
					var elbowPosition = this.getElbowPosition(shoulderPosition, hand === Hand.Left ? juggler.LeftHandPositions[step] : juggler.RightHandPositions[step], ArmAngle, hand);
					if (hand === Hand.Left) {
						juggler.LeftElbowPositions[step] = elbowPosition;
					} else {
						juggler.RightElbowPositions[step] = elbowPosition;
					}

				});
			});

		}

		this.Simulation = patternSimulation;

		return hasCollision;

	}

	private getElbowPosition(shoulderPosition : vec3, handPosition : vec3, armAngle : number, hand : Hand) : vec3 {
		var armHalfLength = ArmHalfLength;

		armAngle*=-1;

		var Hp = new vec3();
		Hp.x = handPosition.x - shoulderPosition.x;
		Hp.y = handPosition.y - shoulderPosition.y;
		Hp.z = handPosition.z - shoulderPosition.z;

		var Hpp = new vec3();
		Hpp.x = Math.sqrt(Hp.x*Hp.x + Hp.z*Hp.z);
		Hpp.y = Hp.y;
		Hpp.z = 0;

		var th = Math.atan2(Hp.z,Hp.x);

		var magHp = Math.sqrt(Hp.x*Hp.x + Hp.y*Hp.y + Hp.z*Hp.z);

		/* magically stretch arms */
		if (2*armHalfLength < magHp) {
			armHalfLength = magHp/2;
		}

		var u1 = new vec3();
		u1.x = Hpp.y/magHp;
		u1.y = -Hpp.x/magHp;
		u1.z = 0;

		var u2 = new vec3([0,0,0]);
		if (hand == 1) {
			u2.z = -1;
		} else {
			u2.z = 1;
		}

		var h = Math.sqrt(armHalfLength*armHalfLength - .25*magHp*magHp);

		var Epp = new vec3();
		Epp.x = Hpp.x/2 + h*u1.x*Math.cos(armAngle) + h*u2.x*Math.sin(armAngle);
		Epp.y = Hpp.y/2 + h*u1.y*Math.cos(armAngle) + h*u2.y*Math.sin(armAngle);
		Epp.z = Hpp.z/2 + h*u1.z*Math.cos(armAngle) + h*u2.z*Math.sin(armAngle);

		var Ep = new vec3();
		Ep.x = Epp.x*Math.cos(th) - Epp.z*Math.sin(th);
		Ep.y = Epp.y;
		Ep.z = Epp.x*Math.sin(th) + Epp.z*Math.cos(th);	

		var E = new vec3();
		E.x = Ep.x + shoulderPosition.x;
		E.y = Ep.y + shoulderPosition.y;
		E.z = Ep.z + shoulderPosition.z;


		return E;
	}

	private interpolateHandDirection(v0: vec3, v1: vec3, t: number) : vec3 {
		// this logic taken from http://number-none.com/product/Understanding%20Slerp,%20Then%20Not%20Using%20It/

		v0 = v0.copy().normalize();
		v1 = v1.copy().normalize();
		var dot = vec3.dot(v0, v1);

		if (dot > .9995) {
			v1.subtract(v0).scale(t).add(v0);
			return v1;
		}

		var theta = t*Math.acos(dot);
		var v2 = (v1.copy().subtract(v0.copy().scale(dot))).normalize();
		return v0.scale(Math.cos(theta)).add(v2.scale(Math.sin(theta)));
	}

	public GetHeighestAndLowestPositionInSimulation() : [number, number] {
		var highestPoint = BasePatternHeight;
		var lowestPoint = BasePatternHeight;
		if (this.Simulation) {			
			this.Simulation.Props.forEach((prop) => {
				prop.Positions.forEach((p) => {
					if (p.y > highestPoint) {
						highestPoint = p.y;
					}
					if (p.y < lowestPoint) {
						lowestPoint = p.y;
					}
				});
			});			
		} 
		return [highestPoint, lowestPoint];
	}
}