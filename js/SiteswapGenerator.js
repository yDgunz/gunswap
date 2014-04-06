/* called by explorer UI */
function updateExplorer() {
	
	var $results = $('#explorerSiteswaps tbody');
	$results.empty();

	var siteswap = $('#explorerInput').val().split('').map(function(a) { return parseInt(a); });
	var primeOnly = $('#explorerPrimeOnly')[0].checked;
	var numProps = undefined;
	if (!$('#explorerAnyNumProps')[0].checked) {
		numProps = $('#explorerNumProps').val();
	}
	var maxBeats = $('#explorerMaxBeats').val();
	var maxToss = $('#explorerMaxToss').val();

	var config = {
		siteswap: siteswap,
		primeOnly: primeOnly,
		numProps: numProps
	};

	siteswaps = getValidSiteswaps(maxBeats,maxToss,config);

	siteswaps.map(function(s) {
		$results.append('<tr><td><a href="#" onclick="$(\'#siteswap\').val(\'' + s.siteswap + '\');go();">' + s.siteswap + '</a></td><td>' + s.numProps + '</td></tr>');
	});
	
}

function getValidSiteswaps(maxBeats,maxToss,config) {
	if (!config) {
		config = {};
	}
	var siteswap = config.siteswap ? config.siteswap.slice(0) : [];
	var primeOnly = config.primeOnly != undefined ? config.primeOnly : true;
	var requestedNumProps = config.numProps;
	var maxTries = config.maxTries ? config.maxTries : 9999999;
	var it = 0;
	var siteswaps = [];

	getSiteswaps(siteswap);
	
	return siteswaps;

	function getSiteswaps(siteswap) {

		it++;
		if (it < maxTries) {
			if (siteswap.length > 0 ) {
				var numProps = validateSiteswap(siteswap, primeOnly);
				if(numProps && (requestedNumProps == undefined || requestedNumProps == numProps)) {
					siteswaps.push(
						{
							siteswap: siteswap.join(''),
							numProps: numProps
						}
					);
				}
			}

			if (siteswap.length < maxBeats) {
				for(var nextToss = 0; nextToss <= maxToss; nextToss++) {					
					if (!checkCollision(siteswap,nextToss)) {
						var newSiteswap = siteswap.slice(0);
						newSiteswap.push(nextToss);
						getSiteswaps(newSiteswap);
					}
				}
			}
		}
	}

	function checkCollision(siteswap,nextToss) {
		for (var i = 0; i < siteswap.length; i++) {
			if (i+siteswap[i] == siteswap.length+nextToss) {
				return true;
			}
		}
		return false;
	}

	function validateSiteswap(siteswap,primeOnly) {
		/* first easy check is to validate number of props */
		var numProps = siteswap.reduce(function(p,c) { return p+c; })/siteswap.length;
		
		if (numProps % 1 != 0) {
			return false;
		}

		var init = false;
		var complete = false;
		var propsWaiting = numProps;
		var maxToss = siteswap.reduce(function(p,c) { return (c > p ? c : p); });
		var state = [];
		for (var i = 0; i < maxToss; i++) {
			state.push(false);
		}
		var i = 0;
		var initState = [];
		var endState = [];
		while (!complete && i < 100) {
			var nextToss = siteswap[i%siteswap.length];
			
			// shift and if nothing landing toss another prop from the waiting queue
			if(!state.shift()) {
				propsWaiting--;
			}

			state.push(false);
			if (state[nextToss-1]) {
				return false;
			}
			state[nextToss-1] = true;

			if (primeOnly && init && i%siteswap.length < siteswap.length-1 && !(initState > state) && !(initState < state)) {
				return false;
			}		

			if (init && i%siteswap.length == siteswap.length-1) {
				complete = true;
				endState = state.slice(0);
			}

			if (i%siteswap.length == siteswap.length-1 && propsWaiting == 0) {
				init = true;
				initState = state.slice(0);
			}

			//console.log(state + ' \t' + init + ' \t' + complete);

			i++;

		}

		if (!(initState > endState) && !(initState < endState)) {
			return numProps;
		} else {
			return false;
		}

	}

}