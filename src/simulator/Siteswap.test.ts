import { Siteswap } from "../simulator/Siteswap";
import { GetDwellPaths } from './DwellPath';

it("Detects passing patterns", () => { 
	var s = new Siteswap("<3|3>");
	expect(s.IsPassingPattern).toBeTruthy();
});

it("Errors on passing patterns with 1 juggler", () => { 
    expect(() => new Siteswap("<3>")).toThrow();
});

it("Errors on passing patterns with different numbers of jugglers in each beat", () => {     
	expect(() => new Siteswap("<3|3><3|3|3>")).toThrow();
});

it("Detects and transforms passing shorthand", () => {     
    var s = new Siteswap("<33|33>");
    expect(s.Siteswap).toBe("<3|3><3|3>");
});

it("Detects and transforms symmetric sync shorthand", () => {     
    var s = new Siteswap("(6x,4)*");
	expect(s.Siteswap).toBe("(6x,4)(4,6x)");
});

it("Errors on invalid siteswaps", () => {         
    expect(() => new Siteswap("(6x,)*")).toThrow();
});

it("Breaks vanilla siteswap into beats", () => {
	var s = new Siteswap("531");
	expect(s.Beats).toEqual(["5","3","1"]);
});

it("Breaks passing siteswap into beats", () => {
    var s = new Siteswap("<531|444>");
    expect(s.Beats).toEqual(["<5|4>","<3|4>","<1|4>"]);
});

it("Breaks sync/multiplex siteswap into beats", () => {
    var s = new Siteswap("([44],[44])(4,4)");
    expect(s.Beats).toEqual(["([44],[44])","(0,0)","(4,4)","(0,0)"]);
});

it("Generates correct length toss collection for single toss and dwell path", () => {
	var s = new Siteswap("3");
	var dwellPaths = GetDwellPaths("(30)");
	var tc = s.GetTossCollection(dwellPaths, 1, 1);
	expect(tc.length).toBe(1);
	expect(tc[0].length).toBe(1);
});

it("Loops through siteswap tosses if more dwell paths provided", () => {
	var s = new Siteswap("3");
	var dwellPaths = GetDwellPaths("(30).(10)");
	var tc = s.GetTossCollection(dwellPaths, 1, 1);
	expect(tc.length).toBe(2);
});

it("Loops through dwell paths if more tosses provided", () => {
	var s = new Siteswap("33");
	var dwellPaths = GetDwellPaths("(30)");
	var tc = s.GetTossCollection(dwellPaths, 1, 1);
	expect(tc.length).toBe(2);
});

it("Gets separate toss per juggler in passing siteswap", () => {
	var s = new Siteswap("<3P|3P>");
	var dwellPaths = GetDwellPaths("(30)");
	var tc = s.GetTossCollection(dwellPaths, 1, 1);
	expect(tc.length).toBe(1);
	expect(tc[0].length).toBe(2);
});

it("Gets separate toss per hand in sync siteswap", () => {
	var s = new Siteswap("(4,4)");
	var dwellPaths = GetDwellPaths("(30)");
	var tc = s.GetTossCollection(dwellPaths, 1, 1);
	expect(tc.length).toBe(2); // actually expect this to be 2 b/c of the added (0,0) beat
	expect(tc[0].length).toBe(2);
});

it("Gets separate toss per prop in multiplex siteswap", () => {
	var s = new Siteswap("3[33]");
	var dwellPaths = GetDwellPaths("(30)");
	var tc = s.GetTossCollection(dwellPaths, 1, 1);
	expect(tc.length).toBe(2);
	expect(tc[0].length).toBe(1);
	expect(tc[1].length).toBe(2);
});
