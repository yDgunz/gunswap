import { InterpolateBezierSpline } from "./Bezier";
import { vec3 } from "@tlaukkan/tsm";

var testPath = [new vec3([0,0,0]), new vec3([10,0,0])];
var vec = new vec3();

it("Determines beginning of bezier spline correctly", () => { 
	var s = InterpolateBezierSpline(testPath, 0, vec, vec, 0, 0, false);
	expect(s.x).toEqual(0);
});

it("Determines end of bezier spline correctly", () => { 
	var s = InterpolateBezierSpline(testPath, 1, vec, vec, 0, 0, false);
	expect(s.x).toEqual(10);
});

it("Determines middle of bezier spline correctly", () => { 
	var s = InterpolateBezierSpline(testPath, 0.5, new vec3([0,-10,0]), new vec3([0,10,0]), .1, .1, false);
	expect(s.x).toBeCloseTo(5); 
	expect(s.y).toBeLessThan(0); 
});