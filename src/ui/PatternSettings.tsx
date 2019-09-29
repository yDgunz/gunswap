import React, { Component } from 'react';
import { Siteswap } from '../simulator/Siteswap';
import { Pattern } from '../simulator/Pattern';
import { GetDwellPaths, DwellPath } from '../simulator/DwellPath';
import { PrimaryButton, Stack, TextField } from 'office-ui-fabric-react';
import 'office-ui-fabric-react/dist/css/fabric.css';

interface Props {
	initialSiteswap: string,
	updatePattern: Function
}

interface State {
	siteswap: string
}

export class PatternSettings extends Component<Props,State> {

	constructor(props : Props) {
		super(props);		

		this.state = {
			siteswap: props.initialSiteswap
		}
	
		// This binding is necessary to make `this` work in the callback
		this.juggle = this.juggle.bind(this);
		this.updateSiteswap = this.updateSiteswap.bind(this);
	}

	updateSiteswap(e : any) {
		this.setState({siteswap: e.target.value});
	}

	juggle() {
		var siteswap = new Siteswap(this.state.siteswap);
		var pattern = new Pattern(siteswap, GetDwellPaths("(30)(10)"), 1, 1);
		pattern.Simulate(30,0.24);
		this.props.updatePattern(pattern);
	}

	render() {
		return (
			<Stack>
				 <PrimaryButton text="Juggle" onClick={this.juggle} />
				 <TextField value={this.state.siteswap} label="Siteswap" placeholder="Siteswap" onChange={this.updateSiteswap} />
				 <TextField label="Props" placeholder="Props"  />
			</Stack>
		);
	}

}