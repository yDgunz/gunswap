import * as THREE from "three";
import { Pattern } from "../simulator/Pattern";
import { Object3D } from "three";
import { vec3 } from "@tlaukkan/tsm";

export class JugglingScene {
	
	private scene : THREE.Scene;
	private camera : THREE.PerspectiveCamera;
	private renderer : THREE.WebGLRenderer;	
	private propMeshes : THREE.Mesh[];
	private camRadius : number;
	private camPhi : number;
	private camTheta : number;
	private startTime : number;
	private pattern : Pattern|null;	
	private isMouseDown : boolean;
	private onMouseDownPosition : vec3;
	private onMouseDownTheta : number;
	private onMouseDownPhi : number;
	private positionToLookAt : vec3;

	constructor(container : HTMLDivElement, pattern : Pattern|null, width : number, height : number) {
		
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 75, width/height, 0.1, 1000 );
		this.positionToLookAt = new vec3();
		this.scene.add( new THREE.HemisphereLight(0xffffff, 0x080820, 1 ));
		this.scene.background = new THREE.Color("white");
		
		this.renderer = new THREE.WebGLRenderer();
		
		this.propMeshes = [];
		
		this.camRadius = 3;
		this.camPhi = 0;
		this.camTheta = Math.PI;
		
		this.startTime = (new Date()).getTime();
		
		this.pattern = pattern;
		if (pattern) {
			this.UpdatePattern(pattern);
		}
		
		this.isMouseDown = false;
		this.onMouseDownPosition = new vec3();
		this.onMouseDownTheta = 0;
		this.onMouseDownPhi = 0;
		
		this.renderer.setSize(width, height);

		this.renderer.domElement.addEventListener( 'mousemove', (event) => { 
			this.onDocumentMouseMove(event); 
		}, false );
		this.renderer.domElement.addEventListener( 'mousedown', (event) => {
			this.onDocumentMouseDown(event);
		}, false );
		this.renderer.domElement.addEventListener( 'mouseup', (event) => {
			this.onDocumentMouseUp(event);
		}, false );
		
		this.renderer.domElement.addEventListener( 'wheel', (event) => {
			this.onDocumentMouseWheel(event);
		}, false );

		// TODO - add support for touch
		//this.renderer.domElement.addEventListener( 'touchmove', this.onDocumentTouchMove, false );
		//this.renderer.domElement.addEventListener( 'touchstart', this.onDocumentTouchStart, false );		
		//this.renderer.domElement.addEventListener( 'touchend', this.onDocumentMouseUp, false );
		
		container.append(this.renderer.domElement);

		this.animate();
	} 

	public UpdatePattern(pattern : Pattern|null) {
		this.pattern = pattern;
		if (pattern) {
			var highestLowest = (pattern as Pattern).GetHeighestAndLowestPositionInSimulation();
			this.positionToLookAt.y = (highestLowest[0] - highestLowest[1])/2;
			this.updateCamera();
		}		
	}

	public Resize(width : number, height : number) {
		this.renderer.setSize(width, height);
		this.camera.aspect = width/height;
	}

	private onDocumentMouseDown( event : MouseEvent ) {
		this.isMouseDown = true;
		this.onMouseDownTheta = this.camTheta;
		this.onMouseDownPhi = this.camPhi;
		this.onMouseDownPosition.x = event.clientX;
		this.onMouseDownPosition.y = event.clientY;
	}

	private onDocumentMouseMove(event : MouseEvent) {
		event.preventDefault();
		if ( this.isMouseDown ) {
			this.camTheta = - ( ( event.clientX - this.onMouseDownPosition.x ) * 0.01 ) + this.onMouseDownTheta;
			
			var dy = event.clientY - this.onMouseDownPosition.y;
			
			var newCamPhi = ( ( dy ) * 0.01 ) + this.onMouseDownPhi;

			if (newCamPhi < Math.PI/2 && newCamPhi > -Math.PI/2) {
				this.camPhi = newCamPhi;
			}
			this.updateCamera();
		}
	}

	private onDocumentMouseUp( event : MouseEvent) {
		event.preventDefault();
		this.isMouseDown = false;
	}

	private onDocumentMouseWheel(event : WheelEvent) {
		this.camRadius += event.deltaY*.002;
		this.updateCamera();
	}

	// TODO - account for multiple jugglers
	private updateCamera() {
		this.camera.position.x = this.camRadius * Math.sin( this.camTheta ) * Math.cos( this.camPhi );
		this.camera.position.y = this.camRadius * Math.sin( this.camPhi ) + this.positionToLookAt.y;
		this.camera.position.z = this.camRadius * Math.cos( this.camTheta ) * Math.cos( this.camPhi );

		this.camera.lookAt(this.positionToLookAt.x, this.positionToLookAt.y, this.positionToLookAt.z);
	}

	private animate() {
		if (this.pattern && this.pattern.Simulation) {			

			var timeElapsed = ((new Date()).getTime() - this.startTime);
		
			// todo - update 0.24 to beatDuration variable and 30 to numStepsPerBeat variable
			var patternTimeElapsed = timeElapsed % (this.pattern.States.length*this.pattern.Simulation.BeatDuration*1000); 
			var step = Math.floor(patternTimeElapsed/(this.pattern.States.length*this.pattern.Simulation.BeatDuration*1000)*(this.pattern.Simulation.NumStepsPerBeat*this.pattern.States.length));

			// if we need to, remove some meshes from the scene
			while (this.pattern.Props.length < this.propMeshes.length) {
				var meshToRemove = this.propMeshes.pop() as Object3D;
				this.scene.remove(meshToRemove);
			}

			// need to create some meshes
			while (this.pattern.Props.length > this.propMeshes.length) {
				var geometry = new THREE.SphereGeometry( 0.05, 20 );
				var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
				var cube = new THREE.Mesh( geometry, material );
				
				this.propMeshes.push( cube );
				this.scene.add( cube );
			}
			
			this.propMeshes.forEach((mesh, propIx) => {
				var position = this.pattern!.Simulation!.Props[propIx].Positions[step];
				mesh.position.set(position.x, position.y, position.z);
			});
		}
		requestAnimationFrame( () => this.animate() );
		this.renderer.render( this.scene, this.camera );
	}

}