import { FindSiteswaps, FindSiteswapsConfig } from "./Search";


it("Finds all siteswaps with 3 props and period 5", () => { 	
	var config : FindSiteswapsConfig = {
		minPeriod: 1,
		maxPeriod: 5,
		numProps: 3,
		includeMultiplex: false,
		includeExcited: true,
		maxSearches: 1000,
		maxSiteswaps: 100,
		sync: false,
		exclude: []
	}
	var siteswaps = FindSiteswaps(config);
	expect(siteswaps.length).toEqual(23);
});