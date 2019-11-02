import { GetNodes } from "./Node";


it("Gets node array correctly", () => { 	
	var nodes = GetNodes(5, 3, false);
	expect(nodes.length).toEqual(10);
});

it("Gets multiplex node array correctly", () => { 	
	var nodes = GetNodes(5, 3, true);
	expect(nodes.length).toEqual(30);
});