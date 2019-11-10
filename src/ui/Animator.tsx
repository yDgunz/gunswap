import React, { Component } from 'react';
import { Siteswap } from '../simulator/Siteswap';
import { Pattern } from '../simulator/Pattern';
import { GetDwellPaths } from '../simulator/DwellPath';
import { PivotItem, Pivot } from 'office-ui-fabric-react/lib/Pivot';
import { PatternSettingsControls, PatternSettings } from './PatternSettings';
import 'office-ui-fabric-react/dist/css/fabric.css';
import Viewport from './Viewport';
import { PatternSimulation } from '../simulator/PatternSimulation';
import { Slider } from 'office-ui-fabric-react';
import { Search } from './Search';

interface State {
	pattern: Pattern,
	patternSettings: PatternSettings
}

const defaultPatternSettings : PatternSettings = {	
	siteswap: '3',
	beatDuration: 0.24,
	dwellPath: "(30)(10)",
	dwellRatio: 0.8
};

class Animator extends Component<any,State> {

	constructor(props : any) {
		super(props);		

		this.state = {
			pattern: new Pattern(new Siteswap(defaultPatternSettings.siteswap), GetDwellPaths(defaultPatternSettings.dwellPath), defaultPatternSettings.dwellRatio, 0),
			patternSettings: defaultPatternSettings
		}

		this.state.pattern.Simulate(100,0.24);

		window.onresize = () => {
			this.forceUpdate();
		}

		this.updatePattern = this.updatePattern.bind(this);
	}

	private updatePattern(pattern : Pattern, patternSettings: PatternSettings) {
		this.setState({pattern: pattern, patternSettings: patternSettings});
	}

  	render() {
		let patternSettings = <PatternSettingsControls updatePattern={this.updatePattern} patternSettings={this.state.patternSettings}></PatternSettingsControls>;
		let search = <Search></Search>; 
		let viewport = <Viewport pattern={this.state.pattern} />;
		
		if (window.innerWidth > 900) {
			return (			
				<div className="ms-Grid" dir="ltr">
					<div className="ms-Grid-row">
						<div className="ms-Grid-col ms-sm6 ms-md4 ms-lg4">
						<Pivot >
							<PivotItem headerText="Pattern" itemIcon="Settings">
								{patternSettings}
							</PivotItem>
							<PivotItem headerText="Siteswaps" itemIcon="Search">
								{search}
							</PivotItem>
						</Pivot>
						</div>
						<div className="ms-Grid-col ms-sm6 ms-md8 ms-lg8">
							{viewport}
						</div>
					</div>
				</div>      		
			);
		} else {
			return (
				<Pivot >
					<PivotItem headerText="Animator" itemIcon="Video">
						{viewport}
					</PivotItem>
					<PivotItem headerText="Pattern" itemIcon="Settings">
						{patternSettings}
					</PivotItem>
					<PivotItem headerText="Siteswaps" itemIcon="Search">
						{search}
					</PivotItem>					
				</Pivot>
			)
		}

  	}
}

export default Animator;