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

interface State {
	debugInfo: DebugInfo | null,
	userControllingStep: boolean
}

interface DebugInfo {
	step: number
}

class Viewport extends Component<Props,State> {

	CanvasContainerRef : HTMLDivElement | null;

	private jugglingScene : JugglingScene|undefined;

	constructor(props : Props) {
		super(props);		
		this.CanvasContainerRef = null;

		this.state = {
			debugInfo: null,
			userControllingStep: false
		};
	}		

	updateStep(sliderValue : number) {
		if (this.jugglingScene) {
			this.jugglingScene.UpdateStep(sliderValue);
			
			 this.setState({
				 debugInfo: {step: this.jugglingScene!.currentStep},
				 userControllingStep: true
			});

		}		
	}

	componentDidUpdate() {		
		if (this.jugglingScene) {
			// if the pattern changed then user is no longer controlling step
			if (this.jugglingScene.pattern !== this.props.pattern) {
				this.jugglingScene.userControllingStep = false;
				this.setState({userControllingStep: false, debugInfo: null});
			}
			this.jugglingScene.UpdatePattern(this.props.pattern);
			this.jugglingScene.animationSpeed = this.props.animationSpeed;
		}
	}

	componentDidMount() {
		
		var width = (this.CanvasContainerRef as HTMLDivElement).offsetWidth;
		var height = window.innerHeight-28; // subtracting size of slider
		this.jugglingScene = new JugglingScene(this.CanvasContainerRef as HTMLDivElement, this.props.pattern, width, height, this.props.animationSpeed);

		(window as any).jugglingScene = this.jugglingScene; // for debugging

		window.addEventListener('resize', () => { 
			if (this.CanvasContainerRef) {
				var width = this.CanvasContainerRef.offsetWidth;
				var height = window.innerHeight-28; // subtracting size of slider
				if (this.jugglingScene) {
					this.jugglingScene!.Resize(width, height); 
				}
			}			
		});
	}

  	render() {
		let debug : JSX.Element = (<div></div>);
		if (this.state.debugInfo) {
			debug = <div>{this.state.debugInfo.step}</div>
		}
		return (
			<div>				
				<div className="debug-info">{debug}</div>
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