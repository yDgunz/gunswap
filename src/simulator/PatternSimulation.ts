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
	readonly HandPositions : vec3[];
	readonly HandRotations : vec4[];
	readonly ElbowPositions : vec4[];	
}