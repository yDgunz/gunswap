import React, { Component, ReactNode } from 'react';
import { FindSiteswaps, FindSiteswapsConfig } from '../search/Search';
import { List, Stack, PrimaryButton, TextField, Label, Link } from 'office-ui-fabric-react';
import * as Yaml from 'js-yaml';
import { Siteswap } from '../simulator/Siteswap';
import { Pattern } from '../simulator/Pattern';
import { GetDwellPaths } from '../simulator/DwellPath';
import { PatternSettings } from './PatternSettings';

interface Props {
	updatePattern : Function
}

interface State {
	siteswaps : string[];
	input: string
}

export class Search extends Component<Props,State> {

	constructor(props : any) {
		super(props);

		var defaultConfig : FindSiteswapsConfig = {
			numProps: 3,
			minPeriod: 1,
			maxPeriod: 5,			
			includeMultiplex: false,
			includeExcited: true,
			maxSearches: 1000,
			maxSiteswaps: 100,
			sync: false,
			exclude: []
		}		

		this.state = {
			siteswaps: [],
			input: Yaml.safeDump(defaultConfig),
		};

		this.onRenderCell = this.onRenderCell.bind(this);
		this.findSiteswaps = this.findSiteswaps.bind(this);
		this.updateInput = this.updateInput.bind(this);
		this.juggleSiteswap = this.juggleSiteswap.bind(this);
	}

	private juggleSiteswap(siteswap : string) {
		var patternSettings : PatternSettings = {
			siteswap: siteswap,
			dwellPath: "(30)(10)",
			beatDuration: 0.24,
			dwellRatio: 0.8
		}

		var s = new Siteswap(patternSettings.siteswap);
		var pattern = new Pattern(s, GetDwellPaths(patternSettings.dwellPath), patternSettings.dwellRatio, 1);
		pattern.Simulate(100,patternSettings.beatDuration);		

		this.props.updatePattern(pattern, patternSettings);
	}
	
	private findSiteswaps() {
		var config : FindSiteswapsConfig | undefined;
		try {
			config = Yaml.safeLoad(this.state.input);
		} catch (e) {
			// TODO
		}

		if (config) {
			var siteswaps = FindSiteswaps(config);
			this.setState({siteswaps: siteswaps});
		}		
	}	

	private onRenderCell(item?: string, index?: number | undefined): ReactNode {
		return (
			<div id={index!.toString()}>
				<Link onClick={() => {this.juggleSiteswap(item as string)}}>{item}</Link>
			</div>
		);
	}

	private updateInput(e : any) {
		this.setState({
			input: e.target.value
		});
	}

	componentDidUpdate() {
		var siteswapList = document.getElementsByClassName('siteswap-list');
		if (siteswapList) {
			(siteswapList[0] as any).style.height = (window.innerHeight - (siteswapList[0] as any).offsetTop).toString()+"px";
			(siteswapList[0] as any).style.overflow = "auto";
		}
	}

	render() {

		return (
			<Stack>
				<PrimaryButton className="panel-main-button" text="Find Siteswaps" onClick={this.findSiteswaps} />					
				<Label>Search Settings</Label>
				<TextField 
					value={this.state.input} 
					multiline={true}
					onChange={this.updateInput} 
					autoAdjustHeight={true} />
				<List className="siteswap-list" items={this.state.siteswaps} onRenderCell={this.onRenderCell}></List>
			</Stack>				
		)
	}

}