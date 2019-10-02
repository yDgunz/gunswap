import { DwellPathSnapshot, DefaultBallRotation } from "./DwellPathSnapshot";
import { vec4, vec3 } from "@tlaukkan/tsm";
import { Hand } from "./Toss";
import { InterpolateBezierSpline } from "./Bezier";
	
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
			throw "Invalid dwell path";
		}
		if (emptyDwellPathSnapshots) {
			emptyDwellPathSnapshots.forEach(x => {
				this.Snapshots.push(new DwellPathSnapshot(x, true, defaultRotation))
			});
		}
	}

	// todo - this should transform position based on juggler position
	public GetPosition(
		t : number, 
		hand : Hand,
		startVelocity : vec3,
		endVelocity : vec3,
		startVelocityScale : number,
		endVelocityScale : number
	) : vec3 {
		var pos = new vec3();
		if (t == 0) {
			pos = this.Snapshots[0].Position.copy();
			if (hand == Hand.Left) {
				pos.x *= -1;
			}
		} else if (t == 1) {
			pos = this.Snapshots[this.Snapshots.length-1].Position.copy();
			if (hand == Hand.Left) {
				pos.x *= -1;
			}
		} else {
			var splinePath = this.Snapshots.map((a) => { 
				var positionCopy = a.Position.copy();
				if (hand == Hand.Left) {
					positionCopy.x *= -1;
				}	
				return positionCopy;
			});
			pos = InterpolateBezierSpline(splinePath,t,startVelocity,endVelocity,startVelocityScale,endVelocityScale,false);
		}		

		// scale y by juggler height
		pos.y += 1.0125;

		return pos;

	}

}

export function GetDwellPaths(input : string, defaultRotation : vec4 = DefaultBallRotation) : DwellPath[] {
	var dwellPaths = input.split(').').map(function(a,ix,arr) { if (ix < arr.length-1) { return a+')'; } else { return a; } });
	if (dwellPaths) {
		return dwellPaths.map(function(a) {
			return new DwellPath(a);
		});
	} else {
		throw "Could not determine dwell paths"
	}
}