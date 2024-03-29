import { Pattern } from "../simulator/Pattern";
import { FindSiteswaps, FindSiteswapsConfig } from "./Search";
import { Siteswap } from "../simulator/Siteswap";
import { DwellPath, GetDwellPaths } from "../simulator/DwellPath";
import { PatternSettings } from "../ui/PatternSettings";


export function FindRandomPattern() : PatternSettings {
	
	var config : FindSiteswapsConfig = {
		numProps: 3+Math.round(Math.random()),
		minPeriod: 1,
		maxPeriod: 6,
		includeMultiplex: false,
		includeExcited: true, // kept as false so we can string together patterns
		maxSearches: 1000,
		maxSiteswaps: 100,
		sync: Math.random() < 0.3,
		exclude: []
	}

	var siteswaps = FindSiteswaps(config);	

	var dwellPathXPositions = [-20,-10,0,10,20,30];
	var dwellPathYPositions = [0,0,10,20,20,30];

	var dwellPathPositions : string[] = [];
	for(var i = 0; i < dwellPathXPositions.length; i++) {
		for(var j = 0; j < dwellPathYPositions.length; j++) {
			dwellPathPositions.push(`(${dwellPathXPositions[i]},${dwellPathYPositions[j]})`);
		}
	}

	function findRandomPattern() : PatternSettings {

		var siteswap = siteswaps[Math.floor(Math.random()*siteswaps.length)];	
		
		var dwellPaths = [];
		for (var i = 0; i < 1+Math.round(Math.random()); i++) {			
			var dwellPath = "";
			for (var j = 0; j < 1+Math.round(Math.random()); j++) {
				dwellPath += dwellPathPositions[Math.floor(Math.random()*dwellPathPositions.length)];
			}
			dwellPaths.push(dwellPath);		
		}
	
		var dwellPath = dwellPaths.join(".");
	
		var dwellRatio = 0.8;

		var s = new Siteswap(siteswap);
		var d = GetDwellPaths(dwellPath);
		var p = new Pattern(s, d, dwellRatio, 0);	
	
		var beatDuration = 0.2;

		// todo - should be able to call this w/ breakOnCollision = true
		var hasCollision = p.Simulate(20,beatDuration,false);

		if (hasCollision) {
			return findRandomPattern();
		} else {
			return {	
				siteswap: siteswap,
				beatDuration: beatDuration,
				dwellPath: dwellPath,
				dwellRatio: dwellRatio
			}
		}

	}
	
	return findRandomPattern();

}