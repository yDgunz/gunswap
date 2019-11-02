import { FindSiteswaps, FindSiteswapsConfig } from "./Search";


it("Finds all siteswaps with 3 props and period 5", () => { 	
	var config : FindSiteswapsConfig = {
		MinPeriod: 1,
		MaxPeriod: 5,
		NumProps: 3,
		IncludeMultiplex: false,
		IncludeExcited: true,
		MaxSearches: 1000,
		MaxSiteswaps: 100,
		Sync: false,
		Exclude: []
	}
	var siteswaps = FindSiteswaps(config);
	expect(siteswaps.length).toEqual(23);
});