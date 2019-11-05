import React, { Component } from 'react';
import { Siteswap } from '../simulator/Siteswap';
import { Pattern } from '../simulator/Pattern';
import { GetDwellPaths, DwellPath } from '../simulator/DwellPath';
import { PrimaryButton, Stack, TextField, MessageBar, MessageBarType, Modal, Label, Link, DefaultButton, Slider } from 'office-ui-fabric-react';
import 'office-ui-fabric-react/dist/css/fabric.css';
import * as Yaml from 'js-yaml';
import { SyntaxHelp } from './SyntaxHelp';
import { FindRandomPattern } from '../search/RandomPattern';

interface Props {
	updatePattern: Function,
	updateAnimationSpeed: Function
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

const defaultPatternSettings : PatternSettings = {	
	siteswap: '3',
	beatDuration: 0.24,
	dwellPath: "(30)(10)",
	dwellRatio: 0.8
};

export class PatternSettingsControls extends Component<Props,State> {

	constructor(props : Props) {
		super(props);		

		this.state = {
			input: Yaml.safeDump(defaultPatternSettings),
			errorMessage: null,
			showSyntaxHelp: false
		};
	
		// This binding is necessary to make `this` work in the callback		
		this.updatePatternSettingsInput = this.updatePatternSettingsInput.bind(this);
		this.closeSyntaxHelp = this.closeSyntaxHelp.bind(this);
		this.showSyntaxHelp = this.showSyntaxHelp.bind(this);
		this.juggleRandomPattern = this.juggleRandomPattern.bind(this);
		this.juggleInputPattern = this.juggleInputPattern.bind(this);
		this.juggle = this.juggle.bind(this);
	}

	private showSyntaxHelp() {
		this.setState({
			showSyntaxHelp: true
		});
	}

	private closeSyntaxHelp() {
		this.setState({
			showSyntaxHelp: false
		});
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
			this.props.updatePattern(pattern);
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
		this.setState({input: Yaml.safeDump(patternSettings)});
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

	private updateAnimationSpeed(value : number) {
		var animationSpeed = 1000*value + 5000*(1-value);
		this.props.updateAnimationSpeed(animationSpeed);
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
				<Label>Advanced Pattern Settings | <Link onClick={this.showSyntaxHelp}>Syntax Help</Link></Label>
				<Modal
					isOpen={this.state.showSyntaxHelp}
					onDismiss={this.closeSyntaxHelp}
					isBlocking={false}
				>
					<SyntaxHelp closeSyntaxHelp={this.closeSyntaxHelp} />
				</Modal>							
				<TextField 
					value={this.state.input} 
					multiline={true}
					onChange={this.updatePatternSettingsInput} 
					autoAdjustHeight={true} />		
				<br/>		
				<Slider
					label={"Animation Speed"}
					min={0}
					max={1}
					step={0.01}
					defaultValue={0.5}
					showValue={false}
					onChanged={(e,value) => this.updateAnimationSpeed(value)}
				/>
			</Stack>
		);
	}

}

// would like to use this for the buttons but adds scrollbars to the window
/*
				<div className="ms-Grid" dir="ltr">
					<div className="ms-Grid-row">
						<div className="ms-Grid-col ms-md6">
							<PrimaryButton className="panel-main-button" text="Juggle" onClick={this.juggle} />
						</div>
						<div className="ms-Grid-col ms-md6">
							<PrimaryButton className="panel-main-button" text="Random Pattern" onClick={this.randomPattern} />	
						</div>
					</div>
				</div>
*/