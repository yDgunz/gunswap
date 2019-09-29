import { DwellPath, GetDwellPaths } from "./DwellPath";

it("Sets dwell path snapshots correctly", () => { 
	var dp = new DwellPath("(30)(10)")
	expect(dp.Snapshots.length).toEqual(2);
	expect(dp.Snapshots[0].Position.x).toBeCloseTo(0.3);
	expect(dp.Snapshots[0].Empty).toBeFalsy();
});

it("Sets empty dwell path snapshots correctly", () => { 
	var dp = new DwellPath("(30)(10)e(20)")
	expect(dp.Snapshots.length).toEqual(3);
	expect(dp.Snapshots[2].Position.x).toBeCloseTo(0.2);
	expect(dp.Snapshots[2].Empty).toBeTruthy();
});

it("Gets collection of dwell paths correctly", () => {
	var dwellPaths = GetDwellPaths("(30)(10).(10)(30)(20)");
	expect(dwellPaths.length).toEqual(2);
	expect(dwellPaths[0].Snapshots.length).toEqual(2);
	expect(dwellPaths[1].Snapshots.length).toEqual(3);
});