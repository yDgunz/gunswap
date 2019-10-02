import React, { Component } from 'react';
import { Siteswap } from '../simulator/Siteswap';
import { Pattern } from '../simulator/Pattern';
import { GetDwellPaths, DwellPath } from '../simulator/DwellPath';
import { PrimaryButton, Stack, TextField } from 'office-ui-fabric-react';
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
	patternSettings: PatternSettings
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
			patternSettings: defaultPatternSettings
		};
	
		// This binding is necessary to make `this` work in the callback
		this.juggle = this.juggle.bind(this);
		this.updateState = this.updateState.bind(this);
	}

	updateState(e : any) {		
		var patternSettings = Yaml.safeLoad(e.target.value);
		this.setState({
			input: e.target.value,
			patternSettings: patternSettings || defaultPatternSettings 
		});
	}

	juggle() {
		var siteswap = new Siteswap(this.state.patternSettings.siteswap);
		var pattern = new Pattern(siteswap, GetDwellPaths(this.state.patternSettings.dwellPath), this.state.patternSettings.dwellRatio, 1);
		pattern.Simulate(30,this.state.patternSettings.beatDuration);
		
		// lift pattern w/ simulation up to parent
		this.props.updatePattern(pattern);
	}

	render() {
		return (
			<Stack>
				 <PrimaryButton id="juggle-button" text="Juggle" onClick={this.juggle} />
				 <TextField value={this.state.input} multiline={true} label="Advanced Inputs" onChange={this.updateState}  />
			</Stack>
		);
	}

}