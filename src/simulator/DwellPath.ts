import { DwellPathSnapshot, DefaultBallRotation } from "./DwellPathSnapshot";
import { vec4, vec3 } from "@tlaukkan/tsm";
import { Hand } from "./Toss";
import { InterpolateBezierSpline } from "./Bezier";
import { BasePatternHeight } from "./JugglerConfig";
	
export class DwellPath {

	public readonly Snapshots : DwellPathSnapshot[];

	constructor(input : string, defaultRotation : vec4 = DefaultBallRotation) {
		this.Snapshots = [];

		// check if there's going to be any empty hand dwell path snapshots
		// if not then terminate the input with an e
		if (input.indexOf("e") == -1) {
			input += "e";
		}
		var dwellPathSnapshotRe = /\(-?\d+(\.\d+)?(,-?\d+(\.\d+)?)?(,-?\d+(\.\d+)?)?(,\{-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?\})?\)/g;
		var heldDwellPathSnapshots = input.split("e")[0].match(dwellPathSnapshotRe);
		var emptyDwellPathSnapshots = input.split("e")[1].match(dwellPathSnapshotRe);
		if (heldDwellPathSnapshots) {
			heldDwellPathSnapshots.forEach(x => {
				this.Snapshots.push(new DwellPathSnapshot(x, false, defaultRotation))
			});
		} else {		
			throw new Error("Invalid dwell path");
		}
		if (emptyDwellPathSnapshots) {
			emptyDwellPathSnapshots.forEach(x => {
				this.Snapshots.push(new DwellPathSnapshot(x, true, defaultRotation))
			});
		}
	}

	// todo - this should take an obect as params
	public GetPosition(
		t : number, 
		hand : Hand,
		startVelocity : vec3,
		endVelocity : vec3,
		startVelocityScale : number,
		endVelocityScale : number,
		additionalPathSnapshot: DwellPathSnapshot | null, // optional dwell path snapshot to append to spline path
		jugglerBodyPosition : vec3,
		jugglerBodyRotation : number
	) : vec3 {

		var splinePath = this.Snapshots.map((a) => { 
			return adjustDwellPathSnapshotByHandAndJuggler(a, hand, jugglerBodyPosition, jugglerBodyRotation);
		});

		if (additionalPathSnapshot) {
			splinePath.push(adjustDwellPathSnapshotByHandAndJuggler(additionalPathSnapshot, hand, jugglerBodyPosition, jugglerBodyRotation));
		}

		var pos = new vec3();
		if (t == 0) {
			pos = splinePath[0].copy();
		} else if (t == 1) {
			pos = splinePath[splinePath.length-1].copy();			
		} else {									
			pos = InterpolateBezierSpline(splinePath,t,startVelocity,endVelocity,startVelocityScale,endVelocityScale,false);
		}				

		return pos;

	}

}

function adjustDwellPathSnapshotByHandAndJuggler(a: DwellPathSnapshot, hand: Hand, jugglerBodyPosition : vec3, jugglerBodyRotation : number) {
	var positionCopy = a.Position.copy();
	if (hand == Hand.Left) {
		positionCopy.x *= -1;
	}
	
	// scale y by juggler height
	positionCopy.y += BasePatternHeight;

	positionCopy.x = positionCopy.x*Math.cos(jugglerBodyRotation) - positionCopy.z*Math.sin(jugglerBodyRotation);
	positionCopy.z = positionCopy.x*Math.sin(jugglerBodyRotation) + positionCopy.z*Math.cos(jugglerBodyRotation);

	positionCopy.add(jugglerBodyPosition);

	return positionCopy;
}

export function GetDwellPaths(input : string, defaultRotation : vec4 = DefaultBallRotation) : DwellPath[] {
	var dwellPaths = input.split(').').map(function(a,ix,arr) { if (ix < arr.length-1) { return a+')'; } else { return a; } });
	if (dwellPaths) {
		return dwellPaths.map(function(a) {
			return new DwellPath(a);
		});
	} else {
		throw new Error("Could not determine dwell paths");
	}
}