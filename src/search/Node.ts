/*
Interfaces

SiteswapSearch
 - Graph : SiteswapGraph
  - Nodes : Node[]
   - LandingSchedule : int[]
   - Edges : int[]
  - Edges : Edge[]
   - SourceNode : int
   - TargetNode : int
   - Value: string
 - Siteswaps : Edge[][]
 - FormattedSiteswaps : string[]

SiteswapSearchConfig
 - MinPeriod : int
 - Async : boolean
 - Callbacks : SiteswapSearchCallbacks // add callbacks later
 - Exclude : string[]
 - IncludeExcited : boolean
 - MaxSearches : int
 - MaxSiteswaps : int
 - Sync : boolean



exports function SiteswapSearch(config) : SiteswapSearch

 - buildNodes
 - buildEdges
 - search
*/

export interface Node {
	LandingSchedule: number[];	
	Edges: number[]
}

export function GetNodes(maxPeriod : number, numProps : number, includeMultiplex : boolean) : Node[] {
	
	var nodes : Node[] = [];

	var firstNode = {LandingSchedule:[], Edges:[]};
	var options = [1,0];
	if (includeMultiplex) {
		options.push(2);
	}

	buildNodes(firstNode, options, false);

	return nodes;

	function buildNodes(node : Node, options : number[], last : boolean) {
		// if the node we're constructing has reached the expected length
		if (node.LandingSchedule.length == maxPeriod) {
			if (node.LandingSchedule.reduce(function(a,b) { return a+b; }) == numProps) {
				nodes.push(node);
			}			
			
			// if we've created all the nodes kick off the function to build the edges
			if (last) {
				//buildEdges();
			}
		
		} 
		// if the node is not the expected length then we need to keep building
		else {

			options.map(function(nodeOption,ix,nodeOptions) {		

				var newNode = {
					LandingSchedule : node.LandingSchedule.slice(),
					Edges: []
				}			
				newNode.LandingSchedule.push(nodeOption);

				var propDiff = newNode.LandingSchedule.reduce(function(a,b) { return a+b; }) - numProps;
				var newNodeOptions = [];
				
				// always have 1 first so the first node is the ground node
				if (propDiff == 0) {
					newNodeOptions = [0];
				} else if (propDiff == 1) {
					newNodeOptions = [1,0];
				} else {
					if (includeMultiplex) {
						newNodeOptions = [1,2,0];
					} else {
						newNodeOptions = [1,0];
					}
					
				}

				// if (config.async) {
				// 	setTimeout(buildNodes,0,newNode,newNodeOptions,last);
				// } else {
					buildNodes(newNode,newNodeOptions,last && (ix == nodeOptions.length-1));
				//}
		
			});

		}
	}

}