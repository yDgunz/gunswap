import { Siteswap } from "../simulator/Siteswap";
import { GetDwellPaths } from './DwellPath';
import { Pattern } from "./Pattern";

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