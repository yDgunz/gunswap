import { Toss, Hand, TossType, CatchType } from "./Toss";
import { DwellPath } from "./DwellPath";

it("Gets correct number of beats for numeric siteswap", () => { 
	var t = new Toss("5", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 1);
	expect(t.NumBeats).toBe(5);
});

it("Gets correct number of beats for alpha siteswap", () => { 
	var t = new Toss("o", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 1);
	expect(t.NumBeats).toBe(24);
});

it("Gets correct target juggler for single juggler", () => { 
	var t = new Toss("5", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 1);
	expect(t.TargetJuggler).toBe(0);
});

it("Gets correct target juggler for 2 jugglers passing", () => { 
	var t = new Toss("5P", 1, Hand.Right, new DwellPath("(30)"), 2, 1, 1);
	expect(t.TargetJuggler).toBe(0);
});

it("Gets correct target juggler for 3 jugglers passing", () => { 
	var t = new Toss("5P3", 0, Hand.Right, new DwellPath("(30)"), 3, 1, 1);
	expect(t.TargetJuggler).toBe(2);
});

it("Gets correct dwell ratio", () => { 
	var t = new Toss("5D{0.2}", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 1);
	expect(t.DwellRatio).toBe(0.2);
});

it("Uses default dwell ratio", () => { 
	var t = new Toss("5", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 1);
	expect(t.DwellRatio).toBe(1);
});

it("Defaults to 0 bounces", () => { 
	var t = new Toss("5", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 1);
	expect(t.NumBounces).toBe(0);
});

it("Gets correct number of bounces", () => { 
	var t = new Toss("5B{2}", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 1);
	expect(t.NumBounces).toBe(2);
});

it("Gets correct order of bounces", () => { 
	var t = new Toss("5B{234}", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 5);
	expect(t.BounceOrder).toEqual([3,4]);
});

it("Gets correct toss type", () => { 
	var t = new Toss("5T{C}", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 5);
	expect(t.TossType).toEqual(TossType.Claw);
});

it("Gets correct catch type", () => { 
	var t = new Toss("5C{P}", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 5);
	expect(t.CatchType).toEqual(CatchType.Penguin);
});

it("Detects crossing throws correctly", () => { 
	var t = new Toss("5", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 5);
	expect(t.Crossing).toBeTruthy();

	var t = new Toss("4", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 5);
	expect(t.Crossing).toBeFalsy();

	var t = new Toss("4x", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 5);
	expect(t.Crossing).toBeTruthy();
});

it("Detects holds correctly", () => { 
	var t = new Toss("2", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 5);
	expect(t.Hold).toBeTruthy();

	var t = new Toss("2x", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 5);
	expect(t.Hold).toBeFalsy();

	var t = new Toss("2A", 0, Hand.Right, new DwellPath("(30)"), 1, 1, 5);
	expect(t.Hold).toBeFalsy();
});