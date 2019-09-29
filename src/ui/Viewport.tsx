import React, { Component, Ref } from 'react';
import * as THREE from "three";
import 'office-ui-fabric-react/dist/css/fabric.css';
import { Pattern } from '../simulator/Pattern';
import { JugglingScene } from './JugglingScene';


interface Props {
	pattern: Pattern|null
}

class Viewport extends Component<Props,any> {

	CanvasContainerRef : HTMLDivElement | null;	

	private jugglingScene : JugglingScene|undefined;

	constructor(props : Props) {
		super(props);		
		this.CanvasContainerRef = null;		
	}		

	componentDidUpdate() {		
		if (this.jugglingScene === undefined) {
			var width = (this.CanvasContainerRef as HTMLDivElement).offsetWidth;
			var height = window.innerHeight;
			this.jugglingScene = new JugglingScene(this.CanvasContainerRef as HTMLDivElement, this.props.pattern, width, height);
		} else {
			this.jugglingScene.UpdatePattern(this.props.pattern);
		}		
	}

	componentDidMount() {
		window.addEventListener('resize', () => { 
			var width = (this.CanvasContainerRef as HTMLDivElement).offsetWidth;
			var height = window.innerHeight;
			(this.jugglingScene as JugglingScene).Resize(width, height); 
		});
	}

  	render() {
		return (
			<div ref={(DOMNodeRef) => {
				this.CanvasContainerRef=DOMNodeRef;
			   }}>
	 		</div>
		);
  	}
}

export default Viewport;