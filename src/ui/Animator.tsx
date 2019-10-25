import React, { Component } from 'react';
import { Siteswap } from '../simulator/Siteswap';
import { Pattern } from '../simulator/Pattern';
import { GetDwellPaths } from '../simulator/DwellPath';
import { PivotItem, Pivot } from 'office-ui-fabric-react/lib/Pivot';
import { PatternSettingsControls } from './PatternSettings';
import 'office-ui-fabric-react/dist/css/fabric.css';
import Viewport from './Viewport';
import { PatternSimulation } from '../simulator/PatternSimulation';

interface State {
	pattern: Pattern
}

class Animator extends Component<any,State> {

	constructor(props : any) {
		super(props);		

		this.state = {
			pattern: new Pattern(new Siteswap("3"), GetDwellPaths("(30)(10)"), 0.8, 0)
		}

		this.state.pattern.Simulate(100,0.24);

		this.updatePattern = this.updatePattern.bind(this);
	}

	updatePattern(pattern : Pattern) {
		this.setState({pattern: pattern});
	}

  render() {
	return (
		<div className="ms-Grid" dir="ltr">
  			<div className="ms-Grid-row">
    			<div className="ms-Grid-col ms-sm6 ms-md4 ms-lg4">
					<Pivot >
						<PivotItem headerText="Pattern" itemIcon="Settings">          
							<PatternSettingsControls updatePattern={this.updatePattern}></PatternSettingsControls>
						</PivotItem>
						<PivotItem headerText="Animator" itemIcon="Video">
							Content 2
						</PivotItem>
					</Pivot>
				</div>
    			<div className="ms-Grid-col ms-sm6 ms-md8 ms-lg8">
					<Viewport pattern={this.state.pattern} />
				</div>
  			</div>
		</div>      		
	);
  }
}

export default Animator;