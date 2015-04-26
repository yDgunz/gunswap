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
			stateOptions.push('x');
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
	if (nextUp == 'x') {
		for (var i = 0; i < newState.length; i++) {
			if (newState[i] == '-' && state2[i] == 'x') {
				transition = i+1;
				newState[i] = 'x';
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

	var graph = [];

	for (var i = 0; i < states.length; i++) {
		graph.push([]);
		for (var j = 0; j < states.length; j++) {
			var transition = getTransition(states[i],states[j]);
			if (transition !== false) {
				graph[i].push({stateIx: j, transition: transition});
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

function generateSiteswaps(inputs,outputs,callback) {
	var it = 0, limit = 10000;
	var siteswaps = outputs.siteswaps;
	var graph = outputs.graph;
	var period = inputs.period;
	var maxSiteswaps = inputs.maxSiteswaps;


	function transition(origStateIx,history) {

		outputs.origStateIx = origStateIx;
		outputs.history = history;

		it++;		
		if (it <= limit && siteswaps.length < maxSiteswaps) {
			
			var nextStateIx = origStateIx;
			var validSiteswap = false;

			if (history.length > 0 && history.length <= period) {
				if (history.last().stateIx == origStateIx) {
					var siteswap = history.map(function (a) { return a.transition; });
					var exists = false;
					for (var i = 0; i < siteswaps.length; i++) {						
						if (patternsMatch(siteswaps[i].slice(),siteswap.slice())) {							
							exists = true;
							break;
						}
					}
					if (!exists) {
						siteswaps.push(siteswap);
					}
					validSiteswap = true;
				}
				nextStateIx = history.last().stateIx;
			}

			if (!validSiteswap) {

				graph[nextStateIx].map(function(next) {

					setTimeout(function () {

						var alreadyVisited = false;
						for (var j = 0; j < history.length; j++) {
							if (history[j].stateIx == next.stateIx) {
								alreadyVisited = true;
								break;
							}
						}
						if (!alreadyVisited) {
							var newHistory = history.slice();
							newHistory.push(next);
							transition(origStateIx,newHistory);
						}

					},0);

				});
				
			}
		}		
	}

	function runFromNewState(stateIx) {
		setTimeout(function() {
			if (stateIx < graph.length) {
				transition(stateIx,[]);
				runFromNewState(stateIx+1);
			} else {
				callback();
			}
		},0);
	}

	runFromNewState(0);

}


exports.getSiteswaps = function(inputs,outputs,callback) {

	inputs.maxSiteswaps = 100;

	outputs.states = generateStates(inputs.period,inputs.numProps);
	outputs.graph = generateGraph(outputs.states);
	
	generateSiteswaps(inputs,outputs,callback);

}

})(typeof exports === 'undefined'? this['SiteswapGenerator']={}: exports);