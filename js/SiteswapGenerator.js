(function(exports){

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

function generateStates(period, numProps) {
	var stateOptions = [];
	for (var i = 0; i < period; i++) {
		if (i < numProps) {
			stateOptions.push('o');
		} else {
			stateOptions.push('-');
		}
	}

	// recursively build state array
	function buildStates(state,stateOptions) {
		if (state.length == period) {
			// only add distinct values
			var exists = false;
			for (var i = 0; i < states.length; i++) {
				if (states[i].toString() == state.toString()) {
					exists = true;
				}
			}
			if (!exists) {
				states.push(state);
			}			
		} else {
			for (var i = 0; i < stateOptions.length; i++) {				
				
				var newState = state.slice();
				newState.push(stateOptions[i]);
				
				newStateOptions = stateOptions.slice(0,i).concat(stateOptions.slice(i+1,stateOptions.length));
				
				setTimeout(buildStates(newState,newStateOptions), 0);
			}
		}
	}

	// kick off recursive function
	var states = [];
	setTimeout(buildStates([],stateOptions),0);

	return states;
}

function getTransition(state1,state2) {
	var nextUp = state1[0];
	var newState = state1.slice(1,state1.length);
	newState.push('-');
	var transition = 0;
	if (nextUp == 'o') {
		for (var i = 0; i < newState.length; i++) {
			if (newState[i] == '-' && state2[i] == 'o') {
				transition = i+1;
				newState[i] = 'o';
				break;
			}
		}
	}
	if (newState.toString() == state2.toString()) {
		return transition;
	} else {
		return false;
	}
}

function generateGraph(states) {

	var graph = {};

	graph.nodes = states.map(function(state) { return {edges: [], state: state} });
	graph.edges = [];

	for (var i = 0; i < graph.nodes.length; i++) {
		for (var j = 0; j < graph.nodes.length; j++) {
			var transition = getTransition(graph.nodes[i].state,graph.nodes[j].state);
			if (transition !== false) {
				var edgeIx = graph.edges.push({source: i, target: j, value: transition})-1;
				graph.nodes[i].edges.push(edgeIx);
			}
		}
	}

	return graph;

}

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

function generateSiteswaps(inputs,outputs,callbacks) {
	var it = 0, limit = 1000000;
	var siteswaps = outputs.siteswaps;
	var graph = outputs.graph;
	var period = inputs.period;
	var maxSiteswaps = inputs.maxSiteswaps;
	var delay = inputs.delay;
	console.log(delay);

	function transition(origNodeIx,history) {

		outputs.origNodeIx = origNodeIx;
		outputs.history = history;

		it++;		
		if (it <= limit && siteswaps.length < maxSiteswaps) {
			
			callbacks.onNodeSearch(origNodeIx,history);
			sleep(delay);

			var nextNodeIx = origNodeIx;
			var validSiteswap = false;

			if (history.length > 0 && history.length <= period) {
				if (graph.edges[history.last()].target == origNodeIx) {
					var siteswap = history.map(function (a) { return graph.edges[a].value; });
					var exists = false;
					for (var i = 0; i < siteswaps.length; i++) {						
						if (patternsMatch(siteswaps[i].siteswap.slice(),siteswap.slice())) {							
							exists = true;
							break;
						}
					}
					if (!exists) {
						var siteswapIx = siteswaps.push({siteswap: siteswap, history: history.slice()})-1;
						callbacks.onSiteswapAdded(siteswap,siteswapIx);
					}
					validSiteswap = true;
				}
				nextNodeIx = graph.edges[history.last()].target;
			}

			if (!validSiteswap && history.length < period) {

				graph.nodes[nextNodeIx].edges.map(function(edgeIx) {

					setTimeout(function () {						

						var alreadyVisited = false;
						for (var j = 0; j < history.length; j++) {
							if (graph.edges[history[j]].target == graph.edges[edgeIx].target) {
								alreadyVisited = true;
								break;
							}
						}
						if (!alreadyVisited) {
							var newHistory = history.slice();
							newHistory.push(edgeIx);
							transition(origNodeIx,newHistory);
						}

					},0);					

				});

			}
		}		
	}

	function runFromNewNode(nodeIx) {
		setTimeout(function() {
			if (nodeIx < graph.nodes.length) {
				transition(nodeIx,[]);
				runFromNewNode(nodeIx+1);
			}			
		},0);
	}

	//runFromNewNode(0);
	transition(0,[]);

}


exports.getSiteswaps = function(inputs,outputs,callbacks) {

	inputs.maxSiteswaps = 1000;

	outputs.states = generateStates(inputs.period,inputs.numProps);
	outputs.graph = generateGraph(outputs.states);
	
	var force = callbacks.onGraphCreated(function () { generateSiteswaps(inputs,outputs,callbacks); });

}

})(typeof exports === 'undefined'? this['SiteswapGenerator']={}: exports);