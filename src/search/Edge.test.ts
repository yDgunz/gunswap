import { Node } from "./Node";
import { Edge, GetEdgeValue, GetEdges } from "./Edge";


it("Gets edge value between 2 nodes", () => { 	
	var sourceNode = {LandingSchedule: [1,1,1,0,0], Edges: []};
	var targetNode = {LandingSchedule: [1,1,1,0,0], Edges: []};
	var edge = GetEdgeValue(sourceNode, targetNode);
	expect(edge).toEqual("3");

	sourceNode = {LandingSchedule: [1,1,1,0,0], Edges: []};
	targetNode = {LandingSchedule: [1,1,0,0,1], Edges: []};
	edge = GetEdgeValue(sourceNode, targetNode);
	expect(edge).toEqual("5");

	sourceNode = {LandingSchedule: [1,1,1,0,0], Edges: []};
	targetNode = {LandingSchedule: [1,0,0,1,1], Edges: []};
	edge = GetEdgeValue(sourceNode, targetNode);
	expect(edge).toEqual(null);
});


it("Gets all edges for all specified nodes", () => {
	var nodes = [
		{LandingSchedule: [1,1,1,0], Edges: []},
		{LandingSchedule: [1,0,1,1], Edges: []},
		{LandingSchedule: [1,1,0,1], Edges: []},
		{LandingSchedule: [0,1,1,1], Edges: []}
	];

	var edges = GetEdges(nodes);

	expect(edges.length).toEqual(7);


});