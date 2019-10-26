import React, { Component } from 'react';
import { Siteswap } from '../simulator/Siteswap';
import { Pattern } from '../simulator/Pattern';
import { GetDwellPaths, DwellPath } from '../simulator/DwellPath';
import { PrimaryButton, Stack, TextField, MessageBar, MessageBarType } from 'office-ui-fabric-react';
import 'office-ui-fabric-react/dist/css/fabric.css';
import * as Yaml from 'js-yaml';

interface Props {
	updatePattern: Function
}

interface PatternSettings {	
	siteswap: string,
	beatDuration: number,
	dwellPath: string,
	dwellRatio: number
}

interface State {
	input: string,
	errorMessage: string|null
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
			errorMessage: null
		};
	
		// This binding is necessary to make `this` work in the callback
		this.juggle = this.juggle.bind(this);
		this.updateState = this.updateState.bind(this);
	}

	updateState(e : any) {				
		this.setState({
			input: e.target.value
		});
	}

	juggle() {
		var patternSettings : PatternSettings | undefined;
		try {
			patternSettings = Yaml.safeLoad(this.state.input);
		} catch (e) {
			this.setState({errorMessage: "Invalid pattern settings."});
		}
		if (patternSettings) {
			try {
				var siteswap = new Siteswap(patternSettings.siteswap.toString());
				var pattern = new Pattern(siteswap, GetDwellPaths(patternSettings.dwellPath), patternSettings.dwellRatio, 1);
				pattern.Simulate(30,patternSettings.beatDuration);
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
	}

	render() {		
		return (
			<Stack>
				{this.state.errorMessage &&
					<MessageBar messageBarType={MessageBarType.severeWarning} isMultiline={false}>
						{this.state.errorMessage}
			 	 	</MessageBar>
				}
				<PrimaryButton id="juggle-button" text="Juggle" onClick={this.juggle} />
				<TextField 
					value={this.state.input} 
					multiline={true} 
					label="Advanced Inputs" 
					onChange={this.updateState} 
					autoAdjustHeight={true} />
			</Stack>
		);
	}

}