import { JugglingScene } from "./JugglingScene";

var gifjs = require('gif.js');

export function GenerateGif(js : JugglingScene) {
	var gif = new gifjs({
		workers: 4,
		quality: 10,
		workerScript: 'gif.worker.js',
		debug: true
	  });	  
	  
	var canvas = document.getElementsByTagName('canvas')[0];
	var numFrames = Math.round((js.pattern!.States.length*js.pattern!.Simulation!.BeatDuration)*30);
	var currentFrame = 0;

	var addFrame = function() {
	
		js.UpdateStep(currentFrame/numFrames);

		window.requestAnimationFrame(() => {
			gif.addFrame(canvas);

			currentFrame++;
			if (currentFrame == numFrames) {
				finish();
			} else {
				setTimeout(addFrame,0);
			}
		});

	}	  
	
	var finish = function () {

		gif.render();

		gif.on('finished', function(blob : any) {
			window.open(URL.createObjectURL(blob));
		});

		js.isPlaying = true;
		js.userControllingStep = false;

	}	  
			
	addFrame();
}