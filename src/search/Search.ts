import { Node, GetNodes } from "./Node";
import { Edge, GetEdges } from "./Edge";

export interface FindSiteswapsConfig {
	MinPeriod: number;
	MaxPeriod: number;
	NumProps: number;
	IncludeMultiplex: boolean;
	IncludeExcited: boolean;
	MaxSearches: number;
	MaxSiteswaps: number;
	Sync: boolean;
	Exclude: string[];
}

function last<T>(arr : T[]) : T {
	return arr[arr.length-1];
}


export function FindSiteswaps(config : FindSiteswapsConfig) : string[] {

	var nodes = GetNodes(config.MaxPeriod, config.NumProps, config.IncludeMultiplex);
	var edges = GetEdges(nodes);

	var numSearches = 0;
	var siteswaps : number[][] = [];
	var formattedSiteswaps : string[] = [];

	search(0, []);	

	return formattedSiteswaps;

	function search(origNodeIx : number, history : number[]) {

		numSearches++;	
		if (numSearches <= config.MaxSearches && siteswaps.length < config.MaxSiteswaps) {

			var nextNodeIx = origNodeIx;
			var validSiteswap = false;
			var siteswapStartNode = undefined;

			if (history.length > 0 && history.length <= config.MaxPeriod) {
				
				// check if valid siteswap, ie. the last edge returns us to a node in the history
				if (history.length >= config.MinPeriod && (!config.Sync || history.length % 2 == 0)) {
					if (edges[last(history)].TargetNode == origNodeIx) {
						validSiteswap = true;
						siteswapStartNode = 0;
					} else {
						// excited siteswaps would return us to any node within the search (assuming the first node is the ground node)
						if (config.IncludeExcited) {
							for (var i = 0; i < history.length; i++) {
								if (edges[last(history)].TargetNode == edges[history[i]].SourceNode && (!config.Sync || i % 2 == 0)) {
									validSiteswap = true;									
									siteswapStartNode = i;
								}
							}
						}					
					}
				}

				// if the siteswap is valid check to see if it already exists, and if not, then add it to the list
				if (validSiteswap) {
					
					var siteswap = history.map(function (a,ix) {
						if (!config.Sync) {
							return edges[a].Value; 
						} else {
							var syncEdgeValue = "";
							var asyncEdgeValue = edges[a].Value;
							for (var i = 0; i < asyncEdgeValue.length; i++) {
								if (asyncEdgeValue[i] == "[" || asyncEdgeValue[i] == "]" || parseInt(asyncEdgeValue[i]) % 2 == 0 ) {
									syncEdgeValue += asyncEdgeValue[i];
								} else if (ix % 2 == 0) {
									syncEdgeValue += ((parseInt(asyncEdgeValue[i])-1)+"x");
								} else {
									syncEdgeValue += ((parseInt(asyncEdgeValue[i])+1)+"x");
								}
							}
							return syncEdgeValue;
						}
					}).slice(siteswapStartNode);

					var exists = false;
					for (var i = 0; i < siteswaps.length; i++) {
						var ssToMatch = siteswaps[i].map(function (a,ix) {
							if (!config.Sync) {
								return edges[a].Value; 
							} else {
								var syncEdgeValue = "";
								var asyncEdgeValue = edges[a].Value;
								for (var i = 0; i < asyncEdgeValue.length; i++) {
									if (asyncEdgeValue[i] == "[" || asyncEdgeValue[i] == "]" || parseInt(asyncEdgeValue[i]) % 2 == 0 ) {
										syncEdgeValue += asyncEdgeValue[i];
									} else if (ix % 2 == 0) {
										syncEdgeValue += ((parseInt(asyncEdgeValue[i])-1)+"x");
									} else {
										syncEdgeValue += ((parseInt(asyncEdgeValue[i])+1)+"x");
									}
								}
								return syncEdgeValue;
							}
						});
						if (patternsMatch(ssToMatch,siteswap.slice())) {							
							exists = true;
							break;
						}
					}
					if (!exists) {
						// the siteswaps array will actually store the edge history which can be converted into a siteswap string
						var siteswapIx = siteswaps.push(history.slice(siteswapStartNode))-1;
						for (var i = 0; i < siteswap.length; i++) {
							if (parseInt(siteswap[i]) > 9) {
								siteswap[i] = String.fromCharCode(87+parseInt(siteswap[i]));
							}
						}
						var formattedSiteswap = "";
						if (config.Sync) {
							for (var i = 0; i < siteswap.length; i++) {
								if (i % 2 == 0) {
									formattedSiteswap += ("(" + siteswap[i] + ",");
								} else { 
									formattedSiteswap += (siteswap[i] + ")");
								}
							}
						} else {
							formattedSiteswap = siteswap.join('');
						}
						formattedSiteswaps.push(formattedSiteswap);
					}
					validSiteswap = true;
				}
				nextNodeIx = edges[last(history)].TargetNode;
			}

			// if the siteswap was invalid or it was valid but was excited, and we're still below the maxperiod for a siteswap, keep searching
			if ((!validSiteswap || siteswapStartNode! > 0) && history.length < config.MaxPeriod) {

				// search each edge of this next node
				nodes[nextNodeIx].Edges.map(function(edgeIx) {

					// was previously checking if we already visited the next node, but not doing that anymore since we're checking for excited swaps
					var alreadyVisited = false;

					// check if searching this edge is going to match the exclusion pattern
					// TODO: need to fix this to search better
					var exclude = false;
					for (var j = 0; j < config.Exclude.length; j++) {
						if (config.Exclude[j] == edges[edgeIx].Value) {
							exclude = true;
							break;
						}
					}

					// if this is an odd numbered edge in the history and we're doing sync, this can't be a 1
					if (config.Sync && history.length % 2 == 0 && edges[edgeIx].Value.indexOf("1") > -1) {
						exclude = true;
					}

					// execute the search through the edge
					if (!alreadyVisited && !exclude) {
						var newHistory = history.slice();
						newHistory.push(edgeIx);
						search(origNodeIx,newHistory);
					}

				});

			}
		}				

	}

	// compare 2 siteswap patterns to check for equality
	function patternsMatch(p1 : string[], p2 : string[]) {

		if (p1.length != p2.length) {
			return false;
		} else {			
			for (var i = 0; i <= p1.length; i++) {
				if (p1.toString() == p2.toString()) {
					return true;
				}
				p1.push(p1[0]);
				p1 = p1.slice(1);	
				if (config.Sync) {
					p1.push(p1[0]);
					p1 = p1.slice(1);
				}		
			}
		}
	}

}