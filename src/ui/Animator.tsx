import React, { Component } from 'react';
import { Siteswap } from '../simulator/Siteswap';
import { Pattern } from '../simulator/Pattern';
import { GetDwellPaths } from '../simulator/DwellPath';
import { PivotItem, Pivot } from 'office-ui-fabric-react/lib/Pivot';
import { PatternSettings } from './PatternSettings';
import 'office-ui-fabric-react/dist/css/fabric.css';
import Viewport from './Viewport';
import { PatternSimulation } from '../simulator/PatternSimulation';

interface State {
	pattern: Pattern|null
}

class Animator extends Component<any,State> {

	constructor(props : any) {
		super(props);		

		this.state = {
			pattern: null
		}

		this.updatePattern = this.updatePattern.bind(this);
	}

	updatePattern(pattern : Pattern) {
		this.setState({pattern: pattern});
	}

  render() {
	var patternDisplay : number|undefined;
	if (this.state.pattern != null) {
		patternDisplay = (this.state.pattern as Pattern).Props.length
	}
	return (
		<div className="ms-Grid" dir="ltr">
  			<div className="ms-Grid-row">
    			<div className="ms-Grid-col ms-sm6 ms-md4 ms-lg4">
					<Pivot >
						<PivotItem headerText="Pattern" itemIcon="Settings">          
							<PatternSettings updatePattern={this.updatePattern} initialSiteswap="3"></PatternSettings>
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