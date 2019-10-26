import { Siteswap } from "../simulator/Siteswap";
import { GetDwellPaths } from './DwellPath';
import { Pattern } from "./Pattern";
import { PatternSimulation } from "./PatternSimulation";
import { BasePatternHeight } from "./JugglerConfig";

it("Gets correct number of props and states for vanilla siteswap", () => {
	var s = new Siteswap("3");
	var dwellPaths = GetDwellPaths("(30)");
	var pattern = new Pattern(s, dwellPaths, 1, 1);
	expect(pattern.Props.length).toBe(3);
	expect(pattern.States.length).toBe(6);
	expect(pattern.Props[0].TossSchedule.length).toBe(2);

});

it("Gets correct number of props and states for passing siteswap", () => {
	var s = new Siteswap("<3|3>");
	var dwellPaths = GetDwellPaths("(30)");
	var pattern = new Pattern(s, dwellPaths, 1, 1);
	expect(pattern.Props.length).toBe(6);
	expect(pattern.States.length).toBe(6);
});

it("Gets correct number of props and states for sync siteswap", () => {
	var s = new Siteswap("(4,4)");
	var dwellPaths = GetDwellPaths("(30)");
	var pattern = new Pattern(s, dwellPaths, 1, 1);
	expect(pattern.Props.length).toBe(4);	
	expect(pattern.States.length).toBe(4);
});

it("Gets correct number of props and states for multiplex siteswap", () => {
	var s = new Siteswap("[33]");
	var dwellPaths = GetDwellPaths("(30)");
	var pattern = new Pattern(s, dwellPaths, 1, 1);
	expect(pattern.Props.length).toBe(6);
	expect(pattern.States.length).toBe(6);
});

it("Gets correct number of props and states for complicated siteswap", () => {
	var s = new Siteswap("<(4,4)|([44],[44])>");
	var dwellPaths = GetDwellPaths("(30)");
	var pattern = new Pattern(s, dwellPaths, 1, 1);
	expect(pattern.Props.length).toBe(12);
	expect(pattern.States.length).toBe(4);
});

it("Errors on invalid siteswap where number of props can't be determined", () => {
	var s = new Siteswap("54");
	var dwellPaths = GetDwellPaths("(30)");
	expect(() => { new Pattern(s, dwellPaths, 1, 1) }).toThrow();
});

it("Simulates siteswap 3 correctly", () => {
	var s = new Siteswap("3");
	var dwellPaths = GetDwellPaths("(30)");
	var p = new Pattern(s, dwellPaths, 0.5, 1);
	p.Simulate(300,1);
	var simulation = p.Simulation as PatternSimulation;
	
	// simulation should contain 3 props
	expect(simulation.Props.length).toBe(3);	

	// simulation should have 600 frames (100 frames per beat * 6 beats in pattern)
	expect(simulation.Props[0].Positions.length).toBe(1800);

	// first prop should start and finish at x == 0.3 and y == BasePatternHeight according to dwell path
	expect(simulation.Props[0].Positions[0].x).toBeCloseTo(0.3);
	expect(simulation.Props[0].Positions[1799].x).toBeCloseTo(0.3);
	expect(simulation.Props[0].Positions[0].y).toBeCloseTo(BasePatternHeight, 1);
	expect(simulation.Props[0].Positions[1799].y).toBeCloseTo(BasePatternHeight, 1);

	// right hand (which gets first prop) should start and finish at same positions
	expect(simulation.Jugglers[0].RightHandPositions[0].x).toBeCloseTo(0.3);
	expect(simulation.Jugglers[0].RightHandPositions[1799].x).toBeCloseTo(0.3);
	expect(simulation.Jugglers[0].RightHandPositions[0].y).toBeCloseTo(BasePatternHeight, 1);
	expect(simulation.Jugglers[0].RightHandPositions[1799].y).toBeCloseTo(BasePatternHeight, 1);
});