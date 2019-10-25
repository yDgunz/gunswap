import { Toss, Hand } from "./Toss";

export enum PropType {
	Ball,
	Club,
	Ring
}

export class Prop {	
	
	TossSchedule : ScheduledToss[]

	constructor(public readonly Id : number, public readonly PropType : PropType, public readonly C : number, public readonly Radius : number) {
		this.TossSchedule = [];
	}

	public GetPreviousCurrentAndNextTossForBeat(beat : number) : [ScheduledToss,ScheduledToss,ScheduledToss] {
		for (var i = 0; i < this.TossSchedule.length; i++) {
			if (i == this.TossSchedule.length-1 || this.TossSchedule[i].Beat <= beat && this.TossSchedule[i+1].Beat > beat) {
				
				var prevToss : ScheduledToss;
				if (i == 0) {
					prevToss = this.TossSchedule[this.TossSchedule.length-1];
				} else {
					prevToss = this.TossSchedule[i-1];
				}
				var curToss : ScheduledToss = this.TossSchedule[i];
				var nextToss : ScheduledToss;
				if (i == this.TossSchedule.length-1) {
					nextToss = this.TossSchedule[0];
				} else {
					nextToss = this.TossSchedule[i+1];
				}

				return [prevToss, curToss, nextToss];

			} 
		}
		throw "Unable to determine previous, current, and next toss for beat";
	} 

}

export interface ScheduledToss {
	readonly Beat : number;
	readonly Hand : Hand;
	readonly Toss : Toss;
}