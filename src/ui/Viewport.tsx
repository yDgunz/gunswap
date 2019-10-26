import React, { Component, Ref } from 'react';
import * as THREE from "three";
import 'office-ui-fabric-react/dist/css/fabric.css';
import { Pattern } from '../simulator/Pattern';
import { JugglingScene } from './JugglingScene';
import { Slider } from 'office-ui-fabric-react';


interface Props {
	pattern: Pattern,
	animationSpeed: number
}

class Viewport extends Component<Props,any> {

	CanvasContainerRef : HTMLDivElement | null;

	private jugglingScene : JugglingScene|undefined;

	constructor(props : Props) {
		super(props);		
		this.CanvasContainerRef = null;
	}		

	updateStep(step : number) {
		if (this.jugglingScene) {
			this.jugglingScene.UpdateStep(step);
		}
	}

	componentDidUpdate() {		
		if (this.jugglingScene) {
			this.jugglingScene.UpdatePattern(this.props.pattern);
			this.jugglingScene.userControllingStep = false;
			this.jugglingScene.animationSpeed = this.props.animationSpeed;
		}
	}

	componentDidMount() {
		
		var width = (this.CanvasContainerRef as HTMLDivElement).offsetWidth;
		var height = window.innerHeight-28; // subtracting size of slider
		this.jugglingScene = new JugglingScene(this.CanvasContainerRef as HTMLDivElement, this.props.pattern, width, height, this.props.animationSpeed);

		(window as any).jugglingScene = this.jugglingScene; // for debugging

		window.addEventListener('resize', () => { 
			var width = (this.CanvasContainerRef as HTMLDivElement).offsetWidth;
			var height = window.innerHeight-28; // subtracting size of slider
			if (this.jugglingScene) {
				this.jugglingScene!.Resize(width, height); 
			}			
		});
	}

  	render() {
		return (
			<div>
				<div ref={(DOMNodeRef) => {
					this.CanvasContainerRef=DOMNodeRef;
				}}>
				</div>
				<Slider
					min={0}
					max={0.99}
					step={.005}
					showValue={false}
					onChange={(value: number) => this.updateStep(value)}
				/>
			</div>			
			 
		);
  	}
}

export default Viewport;