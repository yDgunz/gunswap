import React, { Component } from 'react';
import { Siteswap } from '../simulator/Siteswap';
import { Pattern } from '../simulator/Pattern';
import { GetDwellPaths } from '../simulator/DwellPath';
import { PivotItem, Pivot } from 'office-ui-fabric-react/lib/Pivot';
import { PatternSettingsControls } from './PatternSettings';
import 'office-ui-fabric-react/dist/css/fabric.css';
import Viewport from './Viewport';
import { PatternSimulation } from '../simulator/PatternSimulation';
import { Slider } from 'office-ui-fabric-react';

interface State {
	pattern: Pattern,
	animationSpeed: number
}

class Animator extends Component<any,State> {

	constructor(props : any) {
		super(props);		

		this.state = {
			pattern: new Pattern(new Siteswap("3"), GetDwellPaths("(30)(10)"), 0.8, 0),
			animationSpeed: 3000
		}

		this.state.pattern.Simulate(100,0.24);

		this.updatePattern = this.updatePattern.bind(this);
	}

	updatePattern(pattern : Pattern) {
		this.setState({pattern: pattern});
	}

	updateAnimationSpeed(value : number) {
		var animationSpeed = 1000*value + 5000*(1-value);
		this.setState({animationSpeed: animationSpeed});
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
							<Slider
								label={"Animation Speed"}
								min={0}
								max={1}
								step={0.01}
								defaultValue={0.5}
								showValue={false}
								onChanged={(e,value) => this.updateAnimationSpeed(value)}
							/>
							</PivotItem>
						</Pivot>
					</div>
					<div className="ms-Grid-col ms-sm6 ms-md8 ms-lg8">
						<Viewport pattern={this.state.pattern} animationSpeed={this.state.animationSpeed} />
					</div>
				</div>
			</div>      		
		);
  	}
}

export default Animator;