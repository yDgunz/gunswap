import React, { Component, Ref } from 'react';
import * as THREE from "three";
import 'office-ui-fabric-react/dist/css/fabric.css';
import { Pattern } from '../simulator/Pattern';
import { JugglingScene } from './JugglingScene';
import { Slider, Stack, PrimaryButton, IconButton } from 'office-ui-fabric-react';


interface Props {
	pattern: Pattern
}

interface State {
	debugInfo: DebugInfo | null,
	userControllingStep: boolean,
	isPlaying: boolean,
	animationSpeed: number
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
			userControllingStep: false,
			isPlaying: true,
			animationSpeed: 0.5
		};

		this.userUpdateStep = this.userUpdateStep.bind(this);
		this.play = this.play.bind(this);
		this.pause = this.pause.bind(this);
	}		

	private play() {
		if (this.jugglingScene) {
			this.jugglingScene.isPlaying = true;
			this.jugglingScene.userControllingStep = false;
			this.setState({isPlaying: true, userControllingStep: false});			
		}
	}

	private pause() {
		if (this.jugglingScene) {
			this.jugglingScene.isPlaying = false;
			this.setState({isPlaying: false});
		}
	}

	private userUpdateStep(sliderValue : number) {
		if (this.jugglingScene) {
			this.jugglingScene.UpdateStep(sliderValue);
			
			 this.setState({
				 debugInfo: {step: this.jugglingScene!.currentStep},
				 userControllingStep: true
			});

		}		
	}

	componentDidUpdate() {		
		if (this.jugglingScene && this.jugglingScene.pattern !== this.props.pattern) {
			// if the pattern changed then user is no longer controlling step
			this.jugglingScene.userControllingStep = false;
			this.jugglingScene.isPlaying = true;
			this.setState({userControllingStep: false, debugInfo: null, isPlaying: true});
			this.jugglingScene.UpdatePattern(this.props.pattern);
		}
	}

	componentDidMount() {
		
		var width = (this.CanvasContainerRef as HTMLDivElement).offsetWidth;
		var height = window.innerHeight-32; // subtracting size of button
		this.jugglingScene = new JugglingScene(this.CanvasContainerRef as HTMLDivElement, this.props.pattern, width, height, this.state.animationSpeed);

		(window as any).jugglingScene = this.jugglingScene; // for debugging

		window.addEventListener('resize', () => { 
			if (this.CanvasContainerRef) {
				var width = this.CanvasContainerRef.offsetWidth;
				var height = window.innerHeight-32; // subtracting size of button
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

		let playbackButton;
		if (this.state.isPlaying && !this.state.userControllingStep) {
			playbackButton = <IconButton iconProps={{iconName:"Pause"}} onClick={this.pause} />
		} else {
			playbackButton = <IconButton iconProps={{iconName:"Play"}} onClick={this.play} />			
		}

		return (
			<div>				
				<div className="debug-info">{debug}</div>
				<div ref={(DOMNodeRef) => {
					this.CanvasContainerRef=DOMNodeRef;
				}}>
				</div>
				<Stack horizontal>
					{playbackButton}
					<Slider
						className="viewport-slider"
						min={0}
						max={0.99}
						step={.005}
						showValue={false}
						onChange={(value: number) => this.userUpdateStep(value)}
					/>
				</Stack>				
			</div>			
			 
		);
  	}
}

export default Viewport;