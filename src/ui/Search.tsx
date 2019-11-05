import React, { Component, ReactNode } from 'react';
import { FindSiteswaps, FindSiteswapsConfig } from '../search/Search';
import { List, Stack, PrimaryButton, TextField, Label } from 'office-ui-fabric-react';
import * as Yaml from 'js-yaml';

interface State {
	Siteswaps : string[];
	Input: string
}

export class Search extends Component<any,State> {

	constructor(props : any) {
		super(props);

		var defaultConfig : FindSiteswapsConfig = {
			NumProps: 3,
			MinPeriod: 1,
			MaxPeriod: 5,			
			IncludeMultiplex: false,
			IncludeExcited: true,
			MaxSearches: 1000,
			MaxSiteswaps: 100,
			Sync: false,
			Exclude: []
		}		

		this.state = {
			Siteswaps: [],
			Input: Yaml.safeDump(defaultConfig),
		};

		this.onRenderCell = this.onRenderCell.bind(this);
		this.findSiteswaps = this.findSiteswaps.bind(this);
		this.updateInput = this.updateInput.bind(this);

	}

	private findSiteswaps() {
		var config : FindSiteswapsConfig | undefined;
		try {
			config = Yaml.safeLoad(this.state.Input);
		} catch (e) {
			// TODO
		}

		if (config) {
			var siteswaps = FindSiteswaps(config);
			this.setState({Siteswaps: siteswaps});
		}		
	}	

	private onRenderCell(item?: string, index?: number | undefined): ReactNode {
		return (
			<div id={index!.toString()}>
				{item}
			</div>
		);
	}

	private updateInput(e : any) {
		this.setState({
			Input: e.target.value
		});
	}

	render() {
		return (
			<Stack>
				<PrimaryButton className="panel-main-button" text="Find Siteswaps" onClick={this.findSiteswaps} />					
				<Label>Search Settings</Label>
				<TextField 
					value={this.state.Input} 
					multiline={true}
					onChange={this.updateInput} 
					autoAdjustHeight={true} />
				<List items={this.state.Siteswaps} onRenderCell={this.onRenderCell}></List>
			</Stack>				
		)
	}

}