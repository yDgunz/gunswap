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
			this.jugglingScene = new JugglingScene(this.CanvasContainerRef as HTMLDivElement, this.props.pattern, 500, 500);
		} else {
			this.jugglingScene.updatePattern(this.props.pattern);
		}		
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