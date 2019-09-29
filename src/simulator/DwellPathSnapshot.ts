import { vec3, vec4 } from "@tlaukkan/tsm";

// TODO: this wasn't ported completely from Siteswap.js
export const DefaultClubRotation = new vec4([4,0,1,Math.PI/2]);
export const DefaultRingRotation = new vec4([0,1,0,Math.PI/2]);
export const DefaultBallRotation = new vec4([0,0,0,0]);

export class DwellPathSnapshot {
	
	public readonly Position : vec3;
	public readonly Rotation : vec4;
	public readonly Empty : boolean;

	constructor(input: string, empty : boolean = false, defaultRotation : vec4 = DefaultBallRotation) {
		this.Empty = empty;

		var xyzMatch = input.match(/\(-?\d+(\.\d+)?(,-?\d+(\.\d+)?)?(,-?\d+(\.\d+)?)?/g)
		if (!xyzMatch) {
			throw "Could not find position for dwell path snapshot."
		} else {
			var xyz = xyzMatch[0].match(/-?\d+(\.\d+)?/g);
			if (xyz) {
				this.Position = new vec3([
					parseFloat(xyz[0])/100,
					// y and z default to 0
					xyz[1] ? parseFloat(xyz[1])/100 : 0,
					xyz[2] ? parseFloat(xyz[2])/100 : 0
				]);
			} else {
				throw "Could not find position for dwell path snapshot."
			}						
		}			
		
		var rot = input.match(/\{-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?\}/g); 
		if (!rot) {
			this.Rotation = defaultRotation;
		} else {
			var rotationValues = rot[0].match(/-?\d+(\.\d+)?/g);
			if (rotationValues && rotationValues.length == 4) {
				this.Rotation = new vec4([
					parseFloat(rotationValues[0]),
					parseFloat(rotationValues[1]),
					parseFloat(rotationValues[2]),
					parseFloat(rotationValues[3])
				]);
			} else {
				throw "Could not find 4 rotation values";
			}
		}
	}
}