import { DwellPath } from "./DwellPath";
import { vec3 } from "@tlaukkan/tsm";
import { ValidTossRe } from "./SiteswapRegex";

export enum Hand {
	Left = 0,
	Right = 1,
	Any = 2
}

export enum BounceType {
    Force,
    HyperForce,
    Lift,
	HyperLift,
	Any
}

export enum TossType {
    Standard,
    Claw,
    Penguin
}

export enum CatchType {
    Standard,
    Claw,
    Penguin
}

const defaultTossOrientation = new vec3([.1,.1,1]).normalize();

export class Toss {
	
	public readonly Juggler: number;
	public readonly TargetJuggler: number;
	public readonly Hand: Hand;
	public readonly Crossing: boolean;
	public readonly NumBeats: number;
	public readonly Siteswap: string;
	public readonly NumBounces: number;
	public readonly BounceOrder: number[];
	public readonly BounceType?: BounceType;
	public readonly NumSpins: number;
	public readonly DwellPath : DwellPath;
	public readonly DwellRatio : number;
	public readonly TossType : TossType
	public readonly CatchType : CatchType;
	public readonly TossOrientation : vec3;
	public readonly RotationAxis : vec3;
	public readonly Hold : boolean;
	
	constructor(siteswap : string, juggler : number, hand : Hand, dwellPath : DwellPath, numJugglers : number, defaultDwellRatio : number, numSurfaces: number) {
		this.Juggler = juggler;
		this.Hand = hand;
		this.Siteswap = siteswap;
		this.DwellPath = dwellPath;

		var tossMatches = siteswap.match(ValidTossRe);
		if (!tossMatches || tossMatches.length > 1) {
			throw "Invalid toss string"
		} else {
			/* will work from "a" to "o" */
			this.NumBeats = (siteswap[0].charCodeAt(0) >= 97 && siteswap[0].charCodeAt(0) <= 119) ? siteswap[0].charCodeAt(0)-87 : parseInt(siteswap[0]);
			
			// by default the target juggler is the tossing juggler
			this.TargetJuggler = juggler;
			var isPass = false;
			var pIx = siteswap.indexOf("P");			
			if (
				pIx > 0 &&
				siteswap[pIx+1] != "}" // check that the next character isn't a }, in which case this is a catch/toss penguin modifier
			) {				
				if (numJugglers > 2) {					
					this.TargetJuggler = parseInt(siteswap[pIx+1])-1;
				} else {
					this.TargetJuggler = 1 - juggler;
				}
				isPass = true;
			}

			var dIx = siteswap.indexOf("D");
			if (dIx > 0) {
				this.DwellRatio = parseFloat(siteswap.substring(dIx+2,siteswap.indexOf("}")));
			} else {
				this.DwellRatio = defaultDwellRatio;
			}

			this.NumBounces = 0;
			this.BounceOrder = [];
			var bounceIdentifierIx = siteswap.indexOf("B");
			if (bounceIdentifierIx > 0) {
				var bounceParamsIx = siteswap.slice(bounceIdentifierIx).search(/\d/) + bounceIdentifierIx; // find index of next number indicating # bounces and bounce order
				if (siteswap[bounceIdentifierIx+1] == "{" && bounceParamsIx != undefined) {
					this.NumBounces = parseInt(siteswap[bounceParamsIx]);
					for (var i = bounceParamsIx + 1; i < siteswap.length; i++) {
						if (!isNaN(siteswap[i] as any)) {
							var surfaceIx = parseInt(siteswap[i]);
							if (surfaceIx >= numSurfaces) {
								throw "Bounce surface index out of range";
							} else {
								this.BounceOrder.push(surfaceIx);
							}							
						} else {
							break;
						}
					}
				} else {
					this.NumBounces = 1;
					this.BounceOrder = [0];
				}
				if (this.BounceOrder.length < this.NumBounces) {
					var numMissingBounces = this.NumBounces - this.BounceOrder.length;
					for (var i = 0; i < numMissingBounces; i++) {
						this.BounceOrder.push(0);
					}
				}
			}

		}

		if (this.NumBounces > 0) {
			if (siteswap.match("HF")) {
				this.BounceType = BounceType.HyperForce;
			} else if (siteswap.match("HL")) {
				this.BounceType = BounceType.HyperLift;
			} else if (siteswap.match("F")) {
				this.BounceType = BounceType.Force;
			} else if (siteswap.match("L")) {
				this.BounceType = BounceType.Lift;
			} else {
				this.BounceType = BounceType.Any;
			}
		}

		var tIx = siteswap.indexOf("T");
		this.TossType = TossType.Standard;
		if (tIx > 0) {
			var tossTypeId = siteswap.substring(tIx+2,siteswap.indexOf('}',tIx));
			if (tossTypeId.match("C")) {
				this.TossType = TossType.Claw;
			} else if (tossTypeId.match("P")) {
				this.TossType = TossType.Penguin;
			}
		}

		var cIx = siteswap.indexOf("C");
		this.CatchType = CatchType.Standard;
		if (cIx > 0) {
			var catchTypeId = siteswap.substring(cIx+2,siteswap.indexOf('}',cIx));
			if (catchTypeId.match("C")) {
				this.CatchType = CatchType.Claw;
			} else if (catchTypeId.match("P")) {
				this.CatchType = CatchType.Penguin;
			}
		}

		this.Crossing = this.NumBeats % 2 == 1;
		// if the second character is an "x" then crossing is flipped
		if (siteswap.length > 1 && siteswap[1] == "x") {
			this.Crossing = !this.Crossing;
		}

		// TODO - can the animator actually support this?
		if (siteswap[0] == "R") {
			this.Hand = Hand.Right;
		} else if (siteswap[0] == "L") {
			this.Hand = Hand.Left;
		}

		this.TossOrientation = defaultTossOrientation;
		var sIx = siteswap.indexOf("S");			
		if (sIx > 0) {			
			var spinConfig = siteswap.substring(sIx+2,siteswap.indexOf('}',sIx)).match(/-?\d+(\.\d+)?/g);
			if (spinConfig) {
				this.NumSpins = parseFloat(spinConfig[0]);
				if (spinConfig.length > 1) {
					this.TossOrientation = new vec3([
						parseFloat(spinConfig[1]),
						parseFloat(spinConfig[2]),
						parseFloat(spinConfig[3])
					]).normalize();					
				} 
			} else {
				throw "Invalid spin configuration";
			}		
		} else {					
			this.NumSpins = Math.floor(this.NumBeats/2) + .2;
			// passes get an extra bit of spin
			if (isPass) {
				this.NumSpins += .1;
			}
		}

		this.Hold = this.NumBeats == 2 && !this.Crossing && siteswap.indexOf("A") == -1;
		this.RotationAxis = new vec3([1,0,0]);

    }    
}