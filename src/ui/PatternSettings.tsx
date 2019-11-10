import React, { Component } from 'react';
import { Siteswap } from '../simulator/Siteswap';
import { Pattern } from '../simulator/Pattern';
import { GetDwellPaths, DwellPath } from '../simulator/DwellPath';
import { PrimaryButton, Stack, TextField, MessageBar, MessageBarType, Modal, Label, Link, DefaultButton, Slider } from 'office-ui-fabric-react';
import 'office-ui-fabric-react/dist/css/fabric.css';
import * as Yaml from 'js-yaml';
import { FindRandomPattern } from '../search/RandomPattern';

interface Props {
	updatePattern: Function,
	patternSettings: PatternSettings
}

export interface PatternSettings {	
	siteswap: string,
	beatDuration: number,
	dwellPath: string,
	dwellRatio: number
}

interface State {
	input: string,
	errorMessage: string|null,
	showSyntaxHelp: boolean
}

export class PatternSettingsControls extends Component<Props,State> {

	constructor(props : Props) {
		super(props);		

		this.state = {
			input: Yaml.safeDump(this.props.patternSettings).replace(/'/g,""),
			errorMessage: null,
			showSyntaxHelp: false
		};
	
		// This binding is necessary to make `this` work in the callback		
		this.updatePatternSettingsInput = this.updatePatternSettingsInput.bind(this);
		this.juggleRandomPattern = this.juggleRandomPattern.bind(this);
		this.juggleInputPattern = this.juggleInputPattern.bind(this);
		this.juggle = this.juggle.bind(this);
	}

	private updatePatternSettingsInput(e : any) {
		this.setState({
			input: e.target.value
		});
	}

	private juggle(patternSettings : PatternSettings) {
		try {
			var siteswap = new Siteswap(patternSettings.siteswap.toString());
			var pattern = new Pattern(siteswap, GetDwellPaths(patternSettings.dwellPath), patternSettings.dwellRatio, 1);
			pattern.Simulate(100,patternSettings.beatDuration);
			// lift pattern w/ simulation up to parent
			this.props.updatePattern(pattern, patternSettings);			
			this.setState({
				errorMessage: null
			});
		} catch(e) {
			var errorMessage : string;
			if (e.message) {
				errorMessage = e.message;
			} else {
				// fallback in case any exceptions were thrown as strings
				errorMessage = e;
			}
			this.setState({errorMessage: errorMessage});	
		}
	}

	private juggleRandomPattern() {
		var patternSettings = FindRandomPattern();
		this.setState({input: Yaml.safeDump(patternSettings).replace(/'/g,"")});
		this.juggle(patternSettings);
	}

	private juggleInputPattern() {
		var patternSettings : PatternSettings | undefined;		
		try {
			patternSettings = Yaml.safeLoad(this.state.input);
		} catch (e) {
			this.setState({errorMessage: "Invalid pattern settings."});
		}
		if (patternSettings) {
			this.juggle(patternSettings);
		}		
	}

	render() {		
		return (
			<Stack>				
				<MessageBar messageBarType={MessageBarType.info}>
					This is a new version of Gunswap still in development. The old version is still available at <Link href="https://www.gunswap.co">gunswap.co</Link>. Found a bug or have an enhancement idea? <Link href="https://github.com/yDgunz/gunswap/issues">Open a ticket in Github</Link> or email me at <Link href="mailto:gunswapjuggling@gmail.com">gunswapjuggling@gmail.com</Link>.
				</MessageBar>
				{this.state.errorMessage &&
					<MessageBar messageBarType={MessageBarType.severeWarning} isMultiline={false}>
						{this.state.errorMessage}
			 	 	</MessageBar>
				}
				<Stack horizontal>
					<PrimaryButton className="panel-main-button" text="Juggle" onClick={this.juggleInputPattern} />
					<DefaultButton className="panel-main-button" text="Random Pattern" onClick={this.juggleRandomPattern} />	
				</Stack>
				<Label>Pattern Settings</Label>
				<TextField 
					value={this.state.input} 
					multiline={true}
					onChange={this.updatePatternSettingsInput} 
					autoAdjustHeight={true} />
			</Stack>
		);
	}

}