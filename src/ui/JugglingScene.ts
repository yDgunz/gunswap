import * as THREE from "three";
import { Pattern } from "../simulator/Pattern";
import { Object3D } from "three";
import { vec3 } from "@tlaukkan/tsm";
import { ShoulderZOffset, ShoulderHeight, ArmHalfLength, ShoulderXOffset } from "../simulator/JugglerConfig";

const JugglerMeshMaterial = new THREE.MeshLambertMaterial( { color: 'grey' } );

interface JugglerMeshes {
	LeftHandMesh : THREE.Mesh;
	RightHandMesh : THREE.Mesh;
	LeftElbowMesh : THREE.Mesh;
	RightElbowMesh : THREE.Mesh;
	LeftShoulderMesh : THREE.Mesh;
	RightShoulderMesh : THREE.Mesh;
	LeftBicepMesh: THREE.Mesh;
	LeftForearmMesh: THREE.Mesh;
	RightBicepMesh: THREE.Mesh;
	RightForearmMesh: THREE.Mesh;
	LeftWristMesh: THREE.Mesh;
	RightWristMesh: THREE.Mesh;
	BodyMesh: THREE.Mesh;
	HeadMesh: THREE.Mesh;
}

export class JugglingScene {
	
	private scene : THREE.Scene;
	private camera : THREE.PerspectiveCamera;
	private renderer : THREE.WebGLRenderer;	
	private propMeshes : THREE.Mesh[];
	private jugglerMeshes : JugglerMeshes[];
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
	public currentStep : number;
	public userControllingStep : boolean;
	public animationSpeed : number;

	

	constructor(container : HTMLDivElement, pattern : Pattern|null, width : number, height : number, animationSpeed: number) {		

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 75, width/height, 0.1, 1000 );
		this.positionToLookAt = new vec3();	
		
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		
		this.scene.add( new THREE.HemisphereLight(0xffffff, 0x000000, 1 ));
		//this.scene.background = new THREE.Color("white");

		this.propMeshes = [];
		this.jugglerMeshes = [];
		
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
		this.userControllingStep = false;
		this.currentStep = 0;
		this.animationSpeed = animationSpeed;

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
		this.renderer.domElement.addEventListener( 'touchmove', (event) => {
			this.onDocumentTouchMove(event);
		}, false );
		this.renderer.domElement.addEventListener( 'touchstart', (event) => {
			this.onDocumentTouchStart(event);
		}, false );
		this.renderer.domElement.addEventListener( 'touchmove', (event) => {
			this.onDocumentTouchEnd(event);
		}, false );
		
		container.append(this.renderer.domElement);

		this.animate();
	} 

	public UpdateStep(patternProgress : number) {
		this.currentStep = Math.floor(this.pattern!.States.length*this.pattern!.Simulation!.NumStepsPerBeat*patternProgress);
		this.userControllingStep = true;
	}

	public UpdatePattern(pattern : Pattern|null) {
		this.pattern = pattern;
		if (pattern) {
			var highestLowest = (pattern as Pattern).GetHeighestAndLowestPositionInSimulation();
			this.positionToLookAt.y = highestLowest[0] - (highestLowest[0] - highestLowest[1])/2;
			this.updateCamera();
		}		
	}

	public Resize(width : number, height : number) {
		this.renderer.setSize(width, height);
		this.camera.aspect = width/height;
		this.camera.updateProjectionMatrix();
	}

	private onDocumentMouseDown( event : MouseEvent ) {
		this.isMouseDown = true;
		this.onMouseDownTheta = this.camTheta;
		this.onMouseDownPhi = this.camPhi;
		this.onMouseDownPosition.x = event.clientX;
		this.onMouseDownPosition.y = event.clientY;
	}

	private onDocumentTouchStart(event : TouchEvent) {
		this.isMouseDown = true;
		this.onMouseDownTheta = this.camTheta;
		this.onMouseDownPhi = this.camPhi;
		this.onMouseDownPosition.x = event.touches[0].clientX;
		this.onMouseDownPosition.y = event.touches[0].clientY;
	}

	private onMove(x : number, y : number) {
		if ( this.isMouseDown ) {
			this.camTheta = - ( ( x - this.onMouseDownPosition.x ) * 0.01 ) + this.onMouseDownTheta;
			
			var dy = y - this.onMouseDownPosition.y;
			
			var newCamPhi = ( ( dy ) * 0.01 ) + this.onMouseDownPhi;

			if (newCamPhi < Math.PI/2 && newCamPhi > -Math.PI/2) {
				this.camPhi = newCamPhi;
			}
			this.updateCamera();
		}
	}

	private onDocumentMouseMove(event : MouseEvent) {
		event.preventDefault();		
		this.onMove(event.clientX, event.clientY);
	}

	private onDocumentTouchMove(event : TouchEvent) {
		event.preventDefault();
		this.onMove(event.touches[0].clientX, event.touches[0].clientY);
	}

	private onDocumentMouseUp( event : MouseEvent) {
		event.preventDefault();
		this.isMouseDown = false;
	}

	private onDocumentTouchEnd( event : TouchEvent) {
		event.preventDefault();
		this.isMouseDown = false;
	}

	private onDocumentMouseWheel(event : WheelEvent) {
		this.camRadius += event.deltaY*.05;
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

			if (!this.userControllingStep) {
				var timeElapsed = ((new Date()).getTime() - this.startTime);
		
				var patternTimeElapsed = timeElapsed % (this.pattern.States.length*this.pattern.Simulation.BeatDuration*this.animationSpeed); 
				this.currentStep = Math.floor(patternTimeElapsed/(this.pattern.States.length*this.pattern.Simulation.BeatDuration*this.animationSpeed)*(this.pattern.Simulation.NumStepsPerBeat*this.pattern.States.length));
			}

			// if we need to, remove some meshes from the scene
			while (this.pattern.Props.length < this.propMeshes.length) {
				var meshToRemove = this.propMeshes.pop() as Object3D;
				this.scene.remove(meshToRemove);
			}

			// need to create some meshes
			while (this.pattern.Props.length > this.propMeshes.length) {
				var geometry = new THREE.SphereGeometry( 0.05, 40 );
				var material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
				var propMesh = new THREE.Mesh( geometry, material );
				
				this.propMeshes.push( propMesh );
				this.scene.add( propMesh );
			}
			
			this.propMeshes.forEach((mesh, propIx) => {
				var position = this.pattern!.Simulation!.Props[propIx].Positions[this.currentStep];
				mesh.position.set(position.x, position.y, position.z);
			});

			// TODO - remove juggler meshes if necessary
			while (this.pattern.Simulation.Jugglers.length > this.jugglerMeshes.length) {				
				this.addJugglerMeshes();				
			}

			this.jugglerMeshes.forEach((meshes, jugglerIx) => {								
				var jugglerPositions = this.pattern!.Simulation!.Jugglers[jugglerIx];
				
				meshes.BodyMesh.position.set(
					-ShoulderZOffset*Math.sin(jugglerPositions.BodyRotations[this.currentStep]),
					(ShoulderHeight-.4/2),
					ShoulderZOffset*Math.cos(jugglerPositions.BodyRotations[this.currentStep])
				);
				meshes.BodyMesh.position.add(this.vec3ToTHREEVector3(jugglerPositions.BodyPositions[this.currentStep]));

				meshes.HeadMesh.position.set(
					-ShoulderZOffset*Math.sin(jugglerPositions.BodyRotations[this.currentStep]),
					(ShoulderHeight+.17),
					ShoulderZOffset*Math.cos(jugglerPositions.BodyRotations[this.currentStep])
				);
				meshes.HeadMesh.position.add(this.vec3ToTHREEVector3(jugglerPositions.BodyPositions[this.currentStep]));

				var leftShoulderPosition = new THREE.Vector3(
					-ShoulderXOffset*Math.cos(jugglerPositions.BodyRotations[this.currentStep])-ShoulderZOffset*Math.sin(jugglerPositions.BodyRotations[this.currentStep]),
					(ShoulderHeight),
					-ShoulderXOffset*Math.sin(jugglerPositions.BodyRotations[this.currentStep])+ShoulderZOffset*Math.cos(jugglerPositions.BodyRotations[this.currentStep])
				);
				leftShoulderPosition.add(this.vec3ToTHREEVector3(jugglerPositions.BodyPositions[this.currentStep]));

				var rightShoulderPosition = new THREE.Vector3(
					ShoulderXOffset*Math.cos(jugglerPositions.BodyRotations[this.currentStep])-ShoulderZOffset*Math.sin(jugglerPositions.BodyRotations[this.currentStep]),
					(ShoulderHeight),
					ShoulderXOffset*Math.sin(jugglerPositions.BodyRotations[this.currentStep])+ShoulderZOffset*Math.cos(jugglerPositions.BodyRotations[this.currentStep])
				);
				rightShoulderPosition.add(this.vec3ToTHREEVector3(jugglerPositions.BodyPositions[this.currentStep]));

				var leftHandPosition = this.vec3ToTHREEVector3(jugglerPositions.LeftHandPositions[this.currentStep]);
				var rightHandPosition = this.vec3ToTHREEVector3(jugglerPositions.RightHandPositions[this.currentStep]);
				var leftElbowPosition = this.vec3ToTHREEVector3(jugglerPositions.LeftElbowPositions[this.currentStep]);
				var rightElbowPosition = this.vec3ToTHREEVector3(jugglerPositions.RightElbowPositions[this.currentStep]);				
				
				meshes.LeftHandMesh.position.copy(leftHandPosition);
				meshes.RightHandMesh.position.copy(rightHandPosition);
				meshes.LeftElbowMesh.position.copy(leftElbowPosition);
				meshes.RightElbowMesh.position.copy(rightElbowPosition);
				meshes.LeftShoulderMesh.position.copy(leftShoulderPosition);
				meshes.RightShoulderMesh.position.copy(rightShoulderPosition);

				this.positionAndRotateArm(leftElbowPosition, leftShoulderPosition, leftHandPosition, meshes.LeftBicepMesh, meshes.LeftForearmMesh, meshes.LeftWristMesh);
				this.positionAndRotateArm(rightElbowPosition, rightShoulderPosition, rightHandPosition, meshes.RightBicepMesh, meshes.RightForearmMesh, meshes.RightWristMesh);

				// rotate hands
				var rotation = new THREE.Quaternion();
				rotation.setFromUnitVectors(new THREE.Vector3(0,1,0), this.vec3ToTHREEVector3(jugglerPositions.LeftHandDirections[this.currentStep]));
				meshes.LeftHandMesh.setRotationFromQuaternion(rotation);
				rotation.setFromUnitVectors(new THREE.Vector3(0,1,0), this.vec3ToTHREEVector3(jugglerPositions.RightHandDirections[this.currentStep]));
				meshes.RightHandMesh.setRotationFromQuaternion(rotation);

			});
		}

		requestAnimationFrame( () => this.animate() );
		this.renderer.render( this.scene, this.camera );
	}

	private vec3ToTHREEVector3(vec3 : vec3) : THREE.Vector3 {
		return new THREE.Vector3(vec3.x, vec3.y, vec3.z);
	}

	private positionAndRotateArm(elbowPosition: THREE.Vector3, shoulderPosition: THREE.Vector3, handPosition: THREE.Vector3, bicepMesh : THREE.Mesh, forearmMesh: THREE.Mesh, wristMesh: THREE.Mesh) {
		// bicep
		var armDirection = new THREE.Vector3().subVectors(elbowPosition, shoulderPosition);
		var arrow = new THREE.ArrowHelper(armDirection.clone().normalize(), shoulderPosition);
		bicepMesh.rotation.setFromVector3(arrow.rotation.toVector3());
		var newPosition = new THREE.Vector3().addVectors(shoulderPosition, armDirection.multiplyScalar(0.5));
		bicepMesh.position.copy(newPosition);
		
		// forearm
		armDirection = new THREE.Vector3().subVectors(elbowPosition, handPosition);
		arrow = new THREE.ArrowHelper(armDirection.clone().normalize(), handPosition);
		forearmMesh.rotation.setFromVector3(arrow.rotation.toVector3());
		newPosition = new THREE.Vector3().addVectors(handPosition, armDirection.multiplyScalar(0.5)).add(armDirection.clone().normalize().multiplyScalar(.04));
		forearmMesh.position.copy(newPosition);

		// wrist
		newPosition = handPosition.clone().add(armDirection.clone().normalize().multiplyScalar(.08));
		wristMesh.position.copy(newPosition);
	}

	private getHandMesh() : THREE.Mesh {
		var geometry = new THREE.SphereBufferGeometry( 0.06, 20, 20, 0, Math.PI*2, Math.PI/2, Math.PI);
		var material = new THREE.MeshPhongMaterial( { color: 'grey', side: THREE.DoubleSide, flatShading: true } );
		return new THREE.Mesh( geometry, material );
	}

	private getJointMesh(radius : number) : THREE.Mesh {
		var geometry = new THREE.SphereGeometry( radius, 20);
		return new THREE.Mesh( geometry, JugglerMeshMaterial );
	}

	private getArmCylinder(radius1 : number, radius2: number, length: number) : THREE.Mesh {		 
    	var cylinder = new THREE.CylinderGeometry( radius2, radius1, length, 20, 20 );
    	return new THREE.Mesh( cylinder, JugglerMeshMaterial );
	}

	private addJugglerMeshes() {
		var jugglerMeshes =  {	
			LeftHandMesh: this.getHandMesh(),
			RightHandMesh: this.getHandMesh(),
			LeftElbowMesh: this.getJointMesh(.04),
			RightElbowMesh: this.getJointMesh(.04),
			LeftShoulderMesh: this.getJointMesh(.025),
			RightShoulderMesh: this.getJointMesh(.025),
			LeftWristMesh: this.getJointMesh(.02),
			RightWristMesh: this.getJointMesh(.02),
			LeftBicepMesh: this.getArmCylinder(.025, .04, ArmHalfLength),
			LeftForearmMesh: this.getArmCylinder(.02, .04, ArmHalfLength-0.09),
			RightBicepMesh: this.getArmCylinder(.025, .04, ArmHalfLength),
			RightForearmMesh: this.getArmCylinder(.02, .04, ArmHalfLength-0.09),
			BodyMesh: new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.05, .4, 20, 20, false), JugglerMeshMaterial),
			HeadMesh: new THREE.Mesh(new THREE.SphereBufferGeometry(.1, 20, 20), JugglerMeshMaterial)
		};

		this.jugglerMeshes.push(jugglerMeshes);

		this.scene.add(jugglerMeshes.LeftElbowMesh);
		this.scene.add(jugglerMeshes.LeftHandMesh);
		this.scene.add(jugglerMeshes.LeftShoulderMesh);
		this.scene.add(jugglerMeshes.RightElbowMesh);
		this.scene.add(jugglerMeshes.RightHandMesh);
		this.scene.add(jugglerMeshes.RightShoulderMesh);
		this.scene.add(jugglerMeshes.LeftBicepMesh);
		this.scene.add(jugglerMeshes.LeftForearmMesh);
		this.scene.add(jugglerMeshes.RightBicepMesh);
		this.scene.add(jugglerMeshes.RightForearmMesh);
		this.scene.add(jugglerMeshes.LeftWristMesh);
		this.scene.add(jugglerMeshes.RightWristMesh);
		this.scene.add(jugglerMeshes.BodyMesh);
		this.scene.add(jugglerMeshes.HeadMesh);
	}

}