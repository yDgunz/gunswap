import { ScheduledToss } from "./Prop";
import { vec3 } from "@tlaukkan/tsm";

export function GetTossPathPositionAndVelocity(
	curToss : ScheduledToss, 
	nextToss: ScheduledToss, 
	currentTime: number, 
	totalTime: number
) : [vec3,vec3] {
	// figure out flight path
	var startPosition = curToss.Toss.DwellPath.GetPosition(1, curToss.Hand, new vec3(), new vec3(), 0, 0);
	var endPosition = nextToss.Toss.DwellPath.GetPosition(0, nextToss.Hand, new vec3(), new vec3(), 0, 0);

	return [
		new vec3([
			startPosition.x + (endPosition.x-startPosition.x)*currentTime/totalTime,
			startPosition.y + (endPosition.y - startPosition.y + .5*9.8*totalTime*totalTime)*currentTime/totalTime - .5*9.8*currentTime*currentTime,
			startPosition.z + (endPosition.z-startPosition.z)*currentTime/totalTime
		]),
		new vec3([
			(endPosition.x-startPosition.x)/totalTime,
			(endPosition.y - startPosition.y +.5*9.8*totalTime*totalTime)/totalTime - 9.8*currentTime,
			(endPosition.z-startPosition.z)/totalTime
		])
	];
	
}