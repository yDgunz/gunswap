(function(exports){

// some helper functions 
if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

function factorial(a) { if (a == 2) { return a; } else { return a*factorial(a-1); } } 

exports.siteswapGraph = function(config, outputs) {
	
	// apply default configs 
	config.minPeriod = (config.minPeriod === undefined ? [] : config.minPeriod);
	config.async = (config.async === undefined ? [] : config.async);
	config.callbacks = (config.callbacks === undefined ? [] : config.callbacks);
	config.exclude = (config.exclude === undefined ? [] : config.exclude);
	config.includeExcited = (config.includeExcited === undefined ? true : config.includeExcited);
	config.maxSearches = (config.maxSearches === undefined ? 100000 : config.maxSearches);
	config.maxSiteswaps = (config.maxSiteswaps === undefined ? 100 : config.maxSiteswaps);
	config.multiplex = (config.multiplex === undefined ? false : config.multiplex);
	
	// init outputs object, this will contain the graph and will be updated as we go for async access 
	outputs = (outputs === undefined ? {} : outputs);

	var nodes = [];			// each node is a state (ie. prop landing schedule)
	var edges = [];			// each edge specifies a source/target node and a transition value (ie. the siteswap)
	var siteswaps = [];		// each siteswap is an array of edges that composes a unique cycle

	outputs.graph = {
		nodes: nodes,
		edges: edges,
		siteswaps: siteswaps
	};

	// get the values that can contribute to a state 
	var nodeOptions = [];
	if (config.type = 'vanilla') {
		for (var i = 0; i < config.numProps; i++) { nodeOptions.push(1); }
		for (var i = 0; i < config.maxPeriod-config.numProps; i++) { nodeOptions.push(0); }
	} else if (config.type = 'sync') {
		var todo;
	}
	// get the expected number of nodes so that we can start building edges once we've reached it 
	var expectedNumNodes = factorial(config.maxPeriod) / (factorial(config.numProps) * factorial(config.maxPeriod-config.numProps));

	// build nodes helper function, this also kicks off building the edges once all nodes have been created 
	function buildNodes(node,nodeOptions) {

		// if the node we're constructing has reached the expected length
		if (node.length == config.maxPeriod) {
			// check to see if the node already exists
			var exists = false;
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].value.toString() == node.toString()) {
					exists = true;
				}
			}
			if (!exists) {
				nodes.push({value: node, edges: []});
				// if we've created all the nodes kick off the function to build the edges
				if (nodes.length == expectedNumNodes) {
					buildEdges();
				}
			}	

		// if the node is not the expected length then we need to keep building
		} else {

			// add each node option to the node
			// for some reason that i haven't figured out a for loop locks the thread, but the map function
			// allows us to run asynchronously
			nodeOptions.map(function(nodeOption,ix,nodeOptions) {
			
			// only continue if we haven't built the expected number of nodes yet
			if (nodes.length < expectedNumNodes) {

				// construct a new node with each node option
				var newNode = node.slice();
				newNode.push(nodeOption);

				newNodeOptions = nodeOptions.slice(0,ix).concat(nodeOptions.slice(ix+1,nodeOptions.length));
						
				if (config.async) {
					setTimeout(buildNodes,0,newNode,newNodeOptions);
				} else {
					buildNodes(newNode,newNodeOptions);
				}
				}
			
			});

		}
	}

	// helper functions to get edges between 2 nodes
	function getEdgesVanilla(node1,node2) {
		var nextUp = node1[0];
		var newNode = node1.slice(1,node1.length);
		newNode.push(0);

		var edges = [];
		if (nextUp == 0) {
			edges.push(0);
		}		
		for (var i = 0; i < newNode.length; i++) {			
			if(newNode[i] != node2[i]) {
				if (edges.length == 0) {
					edges.push(i+1);
				} else {
					return [];
				}
			}
		}

		return edges;
	}

	function getEdges(node1,node2) {
		var nextUp = node1[0];
		var newNode = node1.slice(1,node1.length);
		newNode.push([0,0]);

		var discrepancies = [];

		for (var i = 0; i < newNode.length; i++) {
			if (newNode[i][0] != node2[i][0]) {
				discrepancies.push([0,i]);
			} 
			if (newNode[i][1] != node2[i][1]) {
				discrepancies.push([1,i]);
			}
		}

		var edges = [];
		if (discrepancies.length == (nextUp[0] + nextUp[1])) {
			if (discrepancies.length == 0) {
				edges.push('0');
			} else {
				for (var i = 0; i < discrepancies.length; i++) {
					for (var j = 0; j < nextUp[0]; j++) {
						var tossValue = (discrepancies[i][1]+1);
						edges.push(tossValue + ( (discrepancies[0] == 0 && tossValue % 2 == 1) || (discrepancies[0] == 1 && tossValue % 2 == 0) ? 'x' : ''));
					}
					for (var j = 0; j < nextUp[1]; j++) {
						var tossValue = (discrepancies[i][1]+1);	
						edges.push(tossValue + ( (discrepancies[0] == 1 && tossValue % 2 == 1) || (discrepancies[0] == 0 && tossValue % 2 == 0) ? 'x' : ''));
					}
				}
			}			
		}

		return edges;
	}

	// recursively build edges between all nodes, want to make this async
	function buildEdges() {

		// compare all nodes
		for (var i = 0; i < nodes.length; i++) {
			for (var j = 0; j < nodes.length; j++) {
				// get edges between 2 nodes
				var edgeValues = getEdgesVanilla(nodes[i].value, nodes[j].value);
				// add each edge
				for (var k = 0; k < edgeValues.length; k++) {
					nodes[i].edges.push(edges.push({source: i, target: j, value: edgeValues[k]})-1);
				}
			}
		}

		// kick off siteswap search
		if (config.async) {
			setTimeout(search,0,0,[]);
		} else {
			search(0,[]);
		}
	}
	
	// compare 2 siteswap patterns to check for equality
	function patternsMatch(p1,p2) {

		if (p1.length != p2.length) {
			return false;
		} else {			
			for (var i = 0; i <= p1.length; i++) {
				if (p1.toString() == p2.toString()) {
					return true;
				}
				p1.push(p1[0]);
				p1 = p1.slice(1);			
			}
		}
	}

	var numSearches = 0;	

	function search(origNodeIx,history) {

		numSearches++;	
		if (numSearches <= config.maxSearches && siteswaps.length < config.maxSiteswaps) {


			var nextNodeIx = origNodeIx;
			var validSiteswap = false;
			var siteswapStartNode = undefined;

			if (history.length > 0 && history.length <= config.maxPeriod) {
				// check if valid siteswap, ie. the last edge returns us to the first node
				if (history.length >= config.minPeriod) {
					if (edges[history.last()].target == origNodeIx) {
						validSiteswap = true;
						siteswapStartNode = 0;
					} else {
						// excited siteswaps would return us to any node within the search (assuming the first node is the ground node)
						if (config.includeExcited) {
							for (var i = 0; i < history.length; i++) {
								if (edges[history.last()].target == edges[history[i]].source) {
									validSiteswap = true;
									siteswapStartNode = i;
								}
							}
						}					
					}
				}
				// if the siteswap is valid check to see if it exists or not, then add it to the list
				if (validSiteswap) {
					var siteswap = history.map(function (a) { return edges[a].value; }).slice(siteswapStartNode);
					var exists = false;
					for (var i = 0; i < siteswaps.length; i++) {
						var ssToMatch = siteswaps[i].map(function (a) { return edges[a].value; });
						if (patternsMatch(ssToMatch,siteswap.slice())) {							
							exists = true;
							break;
						}
					}
					if (!exists) {
						// the siteswaps array will actually store the edge history which can be converted into a siteswap string
						var siteswapIx = siteswaps.push(history.slice(siteswapStartNode))-1;
						if (config.callbacks.siteswapFound) {
							config.callbacks.siteswapFound(siteswap.join(''),siteswapIx,(siteswapStartNode > 0));
						}
					}
					validSiteswap = true;
				}
				nextNodeIx = edges[history.last()].target;
			}

			// if the siteswap was invalid or it was valid but was excited, and we're still below the maxperiod for a siteswap, keep searching
			if ((!validSiteswap || siteswapStartNode > 0) && history.length < config.maxPeriod) {

				// search each edge of this next node
				nodes[nextNodeIx].edges.map(function(edgeIx) {

					function runSearch() {

						// was previously checking if we already visited the next node, but not doing that anymore since we're checking for excited swaps
						var alreadyVisited = false;
						// for (var j = 0; j < history.length; j++) {
						// 	if (edges[history[j]].target == edges[edgeIx].target) {
						// 		alreadyVisited = true;
						// 		break;
						// 	}
						// }

						// check if searching this edge is going to match the exclusion pattern
						// TODO: need to fix this to search better
						var exclude = false;
						for (var j = 0; j < config.exclude.length; j++) {
							if (config.exclude[j] == edges[edgeIx].value) {																
								exclude = true;
								break;
							}
						}

						// execute the search through the edge
						if (!alreadyVisited && !exclude) {
							var newHistory = history.slice();
							newHistory.push(edgeIx);
							search(origNodeIx,newHistory);
						}

					}

					if (config.async) {
						setTimeout(runSearch,0);
					} else {
						runSearch();
					}

				});

			}
		}		
	}

	// kick off the whole process
	buildNodes([],nodeOptions);

	// only explicitly return the outputs on synchronous mode. 
	// async calls should be monitoring the ouputs param
	if(!config.async) {
		return outputs;
	}

}

})(typeof exports === 'undefined'? this['SiteswapGraph'] = {} : exports);