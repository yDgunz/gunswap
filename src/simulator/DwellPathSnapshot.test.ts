import { DwellPathSnapshot } from "./DwellPathSnapshot";

it("Sets position correctly", () => { 
	var dps = new DwellPathSnapshot("(11.11,22.22,33.33)")
	expect(dps.Position.x).toBeCloseTo(.1111);
	expect(dps.Position.y).toBeCloseTo(.2222);
	expect(dps.Position.z).toBeCloseTo(.3333);
});

it("Defaults z position correctly", () => { 
	var dps = new DwellPathSnapshot("(11.11,22.22)")
	expect(dps.Position.x).toBeCloseTo(.1111);
	expect(dps.Position.y).toBeCloseTo(.2222);
	expect(dps.Position.z).toEqual(0);
});

it("Defaults y and z position correctly", () => { 
	var dps = new DwellPathSnapshot("(11.11)")
	expect(dps.Position.x).toBeCloseTo(.1111);
	expect(dps.Position.y).toEqual(0);
	expect(dps.Position.z).toEqual(0);
});

it("Throws error on invalid dwell path snapshot", () => {
	expect(() => new DwellPathSnapshot("adsfsdf")).toThrow();
});

it("Sets rotation correctly", () => { 
	var dps = new DwellPathSnapshot("(11.11,22.22,33.33,{11.11,22.22,33.33,0.5})")
	expect(dps.Rotation.x).toBeCloseTo(11.11);
	expect(dps.Rotation.y).toBeCloseTo(22.22);
	expect(dps.Rotation.z).toBeCloseTo(33.33);
	expect(dps.Rotation.w).toBeCloseTo(0.5);
});

it("Defaults rotation correctly", () => { 
	var dps = new DwellPathSnapshot("(30)")
	expect(dps.Rotation.x).toEqual(0);
	expect(dps.Rotation.y).toEqual(0);
	expect(dps.Rotation.z).toEqual(0);
	expect(dps.Rotation.w).toEqual(0);
});