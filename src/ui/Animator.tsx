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
import { Search } from './Search';

interface State {
	pattern: Pattern,
	animationSpeed: number
}

class Animator extends Component<any,State> {

	constructor(props : any) {
		super(props);		

		this.state = {
			pattern: new Pattern(new Siteswap("3"), GetDwellPaths("(30)(10)"), 0.8, 0),
			animationSpeed: 2000
		}

		this.state.pattern.Simulate(100,0.24);

		window.onresize = () => {
			this.forceUpdate();
		}

		this.updatePattern = this.updatePattern.bind(this);
	}

	private updatePattern(pattern : Pattern) {
		this.setState({pattern: pattern});
	}

	private updateAnimationSpeed(value : number) {
		this.setState({animationSpeed: value});
	}	

  	render() {
		let controls = (
			<Pivot >
				<PivotItem headerText="Pattern" itemIcon="Settings">
					<PatternSettingsControls updatePattern={this.updatePattern} updateAnimationSpeed={this.updateAnimationSpeed}></PatternSettingsControls>
				</PivotItem>
				<PivotItem headerText="Siteswaps" itemIcon="Search">
					<Search></Search>
				</PivotItem>
			</Pivot>
		);
	
		let viewport = (
			<Viewport pattern={this.state.pattern} animationSpeed={this.state.animationSpeed} />
		);
		if (window.innerWidth > 900) {
			return (			
				<div className="ms-Grid" dir="ltr">
					<div className="ms-Grid-row">
						<div style={{"height":"100vh", "overflow":"auto"}} className="ms-Grid-col ms-sm6 ms-md4 ms-lg4">
							{controls}		
						</div>
						<div className="ms-Grid-col ms-sm6 ms-md8 ms-lg8">
							{viewport}
						</div>
					</div>
				</div>      		
			);
		} else {
			return (
				<Pivot>
					<PivotItem headerText="Controls">
						{controls}
					</PivotItem>
					<PivotItem headerText="Animator">
						{viewport}
					</PivotItem>
				</Pivot>
			)
		}

  	}
}

export default Animator;