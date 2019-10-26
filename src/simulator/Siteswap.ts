import * as SiteswapRegex from "./SiteswapRegex";
import { DwellPath } from "./DwellPath";
import { Toss, Hand } from "./Toss";

export class Siteswap {
    
    public readonly Siteswap : string;
	public readonly Beats : string[];
	public readonly IsSync : boolean;
	public readonly IsMultiplex : boolean;	
	public readonly IsPassingPattern : boolean;
	public readonly NumJugglers : number;

    constructor(siteswapInput: string) {
        this.Siteswap = siteswapInput.replace(/\s/g,"");
        this.NumJugglers = 1;
        this.IsPassingPattern = /<[^ ]+>/.test(this.Siteswap);
        
        if (this.IsPassingPattern) {
			var passingBeats = this.Siteswap.match(/<[^ <>]+>/g);
			if (passingBeats) {
				this.NumJugglers = passingBeats[0].split("|").length;

				/* 
					check to make sure each beat in the passing pattern has the same number of jugglers 
					if a passing pattern only has 1 juggler than it's automatically a mismatch
				*/
				if(this.NumJugglers == 1) {
					throw new Error("Cannot have passing pattern with 1 juggler.");
				};
							
				// ensure all beats have the same number of jugglers
				passingBeats.forEach(beat => {
					if (beat.split("|").length != this.NumJugglers) {
						throw new Error("Each beat in passing siteswap must contain same number of jugglers");
					}
				});
			}			
		}

		// if the input string was shorthand for a passing pattern
		// then replace the siteswap string with a fully formed passing pattern
		// ie. transform <33|33> to <3|3><3|3>
		var validPassShorthandMatch = this.Siteswap.match(SiteswapRegex.ValidPassShorthandRe);
		if (validPassShorthandMatch != null && validPassShorthandMatch[0] == this.Siteswap) {
			this.Siteswap = this.transformPassingShorthand();
		}

		// if the input string was a synchronous siteswap ending in *
		// then we repeat the input pattern, but swap the throws in each pair
		// to make the pattern symmetric
		// e.g. transform (6x,4)* to (6x,4)(4,6x)
		if (this.Siteswap.charAt(this.Siteswap.length-1) == "*") {
			this.Siteswap = this.transformSymmetricSyncShorthand();
		}

		var siteswapMatch = this.Siteswap.match(SiteswapRegex.ValidSiteswapRe);
		if (siteswapMatch !== null && siteswapMatch[0] === this.Siteswap) {			
			this.IsMultiplex = this.Siteswap.match(SiteswapRegex.ValidMultiplexRe) ? true : false;
			this.IsSync = this.Siteswap.match(SiteswapRegex.ValidSyncRe) ? true : false;
		} else {
			throw "Invalid siteswap syntax.";
		} 

		// break the siteswap into individual beats
		var beats = this.IsPassingPattern ? this.Siteswap.match(SiteswapRegex.ValidPassRe) : this.Siteswap.match(SiteswapRegex.ValidBeatRe);
		this.Beats = [];
		if (beats) {			
			beats.forEach(x => {this.Beats.push(x)});
		}

		// add (0,0) after each synchronous throw - this prevents the halving issue
		for(var i = 0; i < this.Beats.length; i++) {
			if (this.Beats[i].match(SiteswapRegex.ValidSyncRe)) {
				this.Beats.splice(i+1,0,'(0,0)');
				i++;
			}
		}

    }    
	
	private transformPassingShorthand() : string {
        var newSiteswapStr = "";
		var jugglerSiteswaps = this.Siteswap.split('|');
		var jugglerBeats = [];
		for(var i = 0; i < jugglerSiteswaps.length; i++) {
			jugglerBeats.push(jugglerSiteswaps[i].match(SiteswapRegex.ValidBeatRe));
		}		
		for (var i = 0; i < jugglerBeats[0]!.length; i++) {
			newSiteswapStr += "<";
			for (var j = 0; j < jugglerBeats.length; j++) {
				newSiteswapStr += jugglerBeats[j]![i];
				if (j < jugglerBeats.length - 1) {
					newSiteswapStr += "|";
				}
			}
			newSiteswapStr += ">";
		}
		return newSiteswapStr;
	}
	
	private transformSymmetricSyncShorthand() : string {
		var newSiteswapStr = this.Siteswap.slice(0,-1);
		var pairs = newSiteswapStr.match(SiteswapRegex.ValidSyncRe);
		if (pairs !== null) {
			for (var i = 0; i < pairs.length; i++) {
				newSiteswapStr += "(" + pairs[i].match(SiteswapRegex.ValidThrowRe)!.reverse().join(",") + ")";
			}
		}
		return newSiteswapStr
	}

	public GetTossCollection(dwellPaths : DwellPath[], defaultDwellRatio : number, numSurfaces : number) : Toss[][] {
		var tossCollection:Toss[][] = [];

		// for each beat get the tosses
		var beatIx = 0;
		var dwellPathIx = 0;
		do {
		
			var beat = this.Beats[beatIx];
			beatIx++;
			if (beatIx == this.Beats.length) {
				beatIx = 0;
			}

			var singleBeatTossCollection:Toss[] = [];

			var jugglerTosses;
			if (beat.match(SiteswapRegex.ValidPassRe)) {
				jugglerTosses = beat.match(SiteswapRegex.ValidBeatRe);
			} else {
				jugglerTosses = [beat];
			}
			
			jugglerTosses!.forEach((jugglerToss, jugglerIx, jugglerTosses) => {
				var handTosses = [];
				if (jugglerToss.match(SiteswapRegex.ValidSyncRe)) {
					var splitToss = jugglerToss.split(",");	
					handTosses.push({hand: Hand.Left, toss: splitToss[0]});
					handTosses.push({hand: Hand.Right, toss: splitToss[1]});
				} else {
					handTosses.push({hand: Hand.Any, toss: jugglerToss})
				}

				handTosses.forEach(handToss => {
					
					var dwellPath = dwellPaths[dwellPathIx];
					dwellPathIx++;
					if (dwellPathIx == dwellPaths.length) {
						dwellPathIx = 0;
					}

					var propTosses = handToss.toss.match(SiteswapRegex.ValidTossRe);
					
					propTosses!.forEach(propToss => {
						singleBeatTossCollection.push(
							new Toss(
								propToss,
								jugglerIx, 
								handToss.hand,
								dwellPath,
								jugglerTosses.length,
								defaultDwellRatio,
								numSurfaces
							)
						);
					});				
				});
			});
			tossCollection.push(singleBeatTossCollection);
		} while (!(beatIx == 0 && dwellPathIx == 0))

		return tossCollection;

	}

}