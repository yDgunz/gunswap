(function(exports){

// some helper functions 
if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

if (!Array.prototype.sum){
    Array.prototype.sum = function(){
        return this.reduce(function(a,b) { return a+b; });
    };
};

function factorial(a) { if (a == 2) { return a; } else if (a == 0) { return 1; } else { return a*factorial(a-1); } } 

exports.siteswapGraph = function(config, outputs) {
	
	// apply default configs 
	config.minPeriod = (config.minPeriod === undefined ? [] : config.minPeriod);
	config.async = (config.async === undefined ? [] : config.async);
	config.callbacks = (config.callbacks === undefined ? [] : config.callbacks);
	config.exclude = (config.exclude === undefined ? [] : config.exclude);
	config.includeExcited = (config.includeExcited === undefined ? true : config.includeExcited);
	config.maxSearches = (config.maxSearches === undefined ? 99999999 : config.maxSearches);
	config.maxSiteswaps = (config.maxSiteswaps === undefined ? 1000 : config.maxSiteswaps);
	config.includeMultiplex = (config.includeMultiplex === undefined ? false : config.includeMultiplex);
	config.sync = (config.sync === undefined ? false : config.sync);
	
	// init outputs object, this will contain the graph and will be updated as we go for async access 
	outputs = (outputs === undefined ? {} : outputs);

	var nodes = [];			// each node is a state (ie. prop landing schedule)
	var edges = [];			// each edge specifies a source/target node and a transition value (ie. the siteswap)
	var siteswaps = [];		// each siteswap is an array of edges that composes a unique cycle
	var formattedSiteswaps = [];

	outputs.graph = {
		nodes: nodes,
		edges: edges,
		siteswaps: siteswaps,
		formattedSiteswaps: formattedSiteswaps
	};


	// build nodes helper function, this also kicks off building the edges once all nodes have been created 
	function buildNodes(node,nodeOptions,last) {

		// if the node we're constructing has reached the expected length
		if (node.length == config.maxPeriod) {
			if (node.reduce(function(a,b) { return a+b; }) == config.numProps) {
				nodes.push({value: node, edges: []});
			}			
			
			if (config.callbacks.updateGraphProgress) {				
				//var progress = nodes.length/expectedNumNodes;
				var progress = 1; // todo
				config.callbacks.updateGraphProgress(progress);
			}	
			// if we've created all the nodes kick off the function to build the edges
			if (last) {
				buildEdges();
			}

		// if the node is not the expected length then we need to keep building
		} else {

			nodeOptions.map(function(nodeOption,ix,nodeOptions) {		

				var newNode = node.slice();
				newNode.push(nodeOption);

				var propDiff = newNode.reduce(function(a,b) { return a+b; }) - config.numProps;
				var newNodeOptions = [];
				
				// always have 1 first so the first node is the ground node
				if (propDiff == 0) {
					newNodeOptions = [0];
				} else if (propDiff == 1) {
					newNodeOptions = [1,0];
				} else {
					if (config.includeMultiplex) {
						newNodeOptions = [1,2,0];
					} else {
						newNodeOptions = [1,0];
					}
					
				}

				var last = this.last && (ix == nodeOptions.length-1);
				if (config.async) {
					setTimeout(buildNodes,0,newNode,newNodeOptions,last);
				} else {
					buildNodes(newNode,newNodeOptions,last);
				}
			
			},{last:last}); // no idea why i have to do this, for some reason the variable last isn't available within the scope of the map call. but the variable node is. wtf?

		}
	}

	// helper functions to get edges between 2 nodes
	function getEdgesBetween2Nodes(node1,node2) {

		var edges = [];

		var nextUp = node1[0];
		var newNode = node1.slice(1,node1.length);
		newNode.push(0);
		
		var multiplex = false;
		if (nextUp == 0) {
			edges.push('0');
		} else if (nextUp > 1) {
			multiplex = true;
			edges.push('[');
		} else {
			edges.push('');
		}
		for (var i = 0; i < newNode.length; i++) {
			var tossValue = i+1;
			if (tossValue > 9) {
				tossValue = String.fromCharCode(87+tossValue);
			}
			if(newNode[i] != node2[i]) {
				if (nextUp >= (node2[i] - newNode[i])) {
					edges[0] += tossValue;
					nextUp--;
					if (nextUp == 1 && (node2[i] - newNode[i]) == 2) {
						edges[0] += tossValue;
						nextUp--;
					}	
				} else {
					return [];
				}
			}
		}
		if (multiplex) {
			edges[0] += ']';
		}	

		return edges;
	}

	// recursively build edges between all nodes, want to make this async
	function buildEdges() {

		// compare all nodes
		for (var i = 0; i < nodes.length; i++) {
			if (config.callbacks.updateGraphProgress) {
				var progress = (i+1)/nodes.length;
				config.callbacks.updateGraphProgress(progress);
			}
			for (var j = 0; j < nodes.length; j++) {				
				function addEdgesToGraph(i,j) {
					// get edges between 2 nodes
					var edgeValues = getEdgesBetween2Nodes(nodes[i].value, nodes[j].value);
					// add each edge
					for (var k = 0; k < edgeValues.length; k++) {
						nodes[i].edges.push(edges.push({source: i, target: j, value: edgeValues[k]})-1);
					}
				}
				setTimeout(addEdgesToGraph,0,i,j);			
			}
		}

		if (config.callbacks.graphDone) {
			setTimeout(config.callbacks.graphDone);
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
				if (config.sync) {
					p1.push(p1[0]);
					p1 = p1.slice(1);
				}		
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
				if (history.length >= config.minPeriod && (!config.sync || history.length % 2 == 0)) {
					if (edges[history.last()].target == origNodeIx) {
						validSiteswap = true;
						siteswapStartNode = 0;
					} else {
						// excited siteswaps would return us to any node within the search (assuming the first node is the ground node)
						if (config.includeExcited) {
							for (var i = 0; i < history.length; i++) {
								if (edges[history.last()].target == edges[history[i]].source && (!config.sync || i % 2 == 0)) {
									validSiteswap = true;									
									siteswapStartNode = i;
								}
							}
						}					
					}
				}
				// if the siteswap is valid check to see if it exists or not, then add it to the list
				if (validSiteswap) {
					var siteswap = history.map(function (a,ix) {
						if (!config.sync) {
							return edges[a].value; 
						} else {
							var syncEdgeValue = "";
							var asyncEdgeValue = edges[a].value;
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
							if (!config.sync) {
								return edges[a].value; 
							} else {
								var syncEdgeValue = "";
								var asyncEdgeValue = edges[a].value;
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
						if (config.callbacks.siteswapFound) {
							for (var i = 0; i < siteswap.length; i++) {
								if (siteswap[i] > 9) {
									siteswap[i] = String.fromCharCode(87+parseInt(siteswap[i]));
								}
							}
							var formattedSiteswap = "";
							if (config.sync) {
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
							config.callbacks.siteswapFound(formattedSiteswap,siteswapIx,(siteswapStartNode > 0));							
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

						// if this is an odd numbered edge in the history and we're doing sync, this can't be a 1
						if (config.sync && history.length % 2 == 0 && edges[edgeIx].value.indexOf(1) > -1) {
							exclude = true;
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
	// get the values that can contribute to a state 
	var nodeOptions = [];
	nodeOptions.push(1);
	nodeOptions.push(0);
	if (config.includeMultiplex) {
		nodeOptions.push(2);
	}

	if (config.async) {
		setTimeout(buildNodes,0,[],nodeOptions.slice(),true);
	} else {			
		buildNodes([],nodeOptions.slice(),true);
	}

	// only explicitly return the outputs on synchronous mode. 
	// async calls should be monitoring the ouputs param
	if(!config.async) {
		return outputs;
	}

}

})(typeof exports === 'undefined'? this['SiteswapGraph'] = {} : exports);