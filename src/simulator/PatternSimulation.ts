import { vec3, vec4 } from "@tlaukkan/tsm";

export interface PatternSimulation {
	readonly Props : SimulationProp[];
	readonly Jugglers : SimulationJuggler[];
	readonly BeatDuration : number;
	readonly NumStepsPerBeat : number;
}

export interface SimulationProp {
	readonly Positions : vec3[];
	readonly Rotations : vec4[];
}

export interface SimulationJuggler {
	readonly LeftHandPositions : vec3[];
	readonly RightHandPositions : vec3[];
	readonly LeftElbowPositions : vec3[];	
	readonly RightElbowPositions : vec3[];
	readonly LeftHandDirections : vec3[]; // normalized vector for direction the hand should be facing
	readonly RightHandDirections : vec3[];
}