var twoWindow = false;

window.onload = function () {

	displayMenu('pattern');

	updateAdvancedInputsFromBasic();	

	window.animator = new SiteswapAnimator.SiteswapAnimator('animatorCanvasContainer', {displayPropPaths: false});

	window.onresize();

	buildExamples();
	refreshSavedSiteswapsList();

	bindInputs(applyInputDefaults(getInputsFromQueryString()));

	go();

}

function displayMenu(menu) {	
	$('.controlDiv').hide()
	$('#'+menu+'Menu').show();
	$('#nav a').removeClass('selected');
	$('#nav a').addClass('unselected');
	$('#nav #' +menu).addClass('selected');
	$('#nav #' +menu).removeClass('unselected');	
	window.onresize();
}

window.onresize = function () {
	var windowWidth = $(window).width()-5;
	var windowHeight = $(window).height()-10;
	var controlsWidth = 500;
	var animatorWidth = windowWidth-controlsWidth;
	var minAnimatorWidth = 250;
	var animatorHeight = windowHeight;

	if (animatorWidth > minAnimatorWidth) {
		$('#nav #animator').hide();
		$('#animatorCanvasContainer').appendTo($('body'));
		$('#animatorMenu').removeClass('controlDiv');		
		twoWindow = true;
	} else {
		if (controlsWidth > windowWidth) {
			controlsWidth = windowWidth;
		}
		$('#nav #animator').show();
		$('#animatorCanvasContainer').appendTo($('#controlsContainer #animatorMenu'));
		$('#animatorMenu').addClass('controlDiv');
		animatorWidth = windowWidth;
		controlsWidth = windowWidth;
		twoWindow = false;
		animatorHeight = windowHeight - $('#animatorCanvasContainer').offset().top;
	}

	$('#controlsContainer').height(windowHeight);
	$('#controlsContainer').width(controlsWidth);

	$('#animatorCanvasContainer').height(animatorHeight);
	$('#animatorCanvasContainer').width(animatorWidth);	

	// resize divs containing lists
	$('#generatedSiteswaps').height(windowHeight-$('#generatedSiteswaps').offset().top-10);
	$('#exampleSiteswaps').height(windowHeight-$('#exampleSiteswaps').offset().top-10);
	$('#savedSiteswaps').height(windowHeight-$('#exampleSiteswaps').offset().top-10);
	$('#patternMenu').height(windowHeight-$('#patternMenu').offset().top-10);

	if (animator.resize) {
		animator.resize(animatorWidth, windowHeight);
	}	
}

function updateAdvancedInputsFromBasic() {
	bindInputs(applyInputDefaults({
		siteswap: $('#siteswap').val(),
		props: [{type: $('#prop').val(), color: 'red', radius: .05, C: .97}],
		beatDuration: $('#beatDuration').val(),
		dwellPath: $('#dwellPath').val()
	}));
	updateAdvancedLabels();
}

function applyInputDefaults(inputs) {
	inputs.siteswap = inputs.siteswap === undefined ? "3" : inputs.siteswap;
	inputs.props = inputs.props === undefined ? [{type: "ball", color: "red", radius: ".05", C: .97}] : inputs.props;
	inputs.beatDuration = inputs.beatDuration === undefined ? .28 : inputs.beatDuration;
	inputs.dwellRatio = inputs.dwellRatio === undefined ? .8 : inputs.dwellRatio;
	inputs.dwellPath = inputs.dwellPath === undefined ? "(30)(10)" : inputs.dwellPath;
	inputs.matchVelocity = inputs.matchVelocity === undefined ? 0 : inputs.matchVelocity;
	inputs.dwellCatchScale = inputs.dwellCatchScale === undefined ? .06 : inputs.dwellCatchScale;
	inputs.dwellTossScale = inputs.dwellTossScale === undefined ? .06 : inputs.dwellTossScale;
	inputs.emptyTossScale = inputs.emptyTossScale === undefined ? .025 : inputs.emptyTossScale;
	inputs.emptyCatchScale = inputs.emptyCatchScale === undefined ? .025 : inputs.emptyCatchScale;
	inputs.armAngle = inputs.armAngle === undefined ? .1 : inputs.armAngle;
	inputs.jugglers = inputs.jugglers === undefined ? [{position: {x: 0, z: 0}, rotation: 0}] : inputs.jugglers;
	inputs.surfaces = inputs.surfaces === undefined ? [{position: {x: 0, y: 0, z:0}, normal: {x: 0, y:1, z:0}, scale: 2}] : inputs.surfaces;
	return inputs;
}

function bindInputs(inputs) {
	var inputsText = inputs.siteswap + "\n";
	inputsText += inputs.beatDuration + " " + inputs.dwellRatio + "\n";
	for (var i = 0; i < inputs.props.length; i++) {
		inputsText += inputs.props[i].type + " " + inputs.props[i].color + " " + inputs.props[i].radius + " " + inputs.props[i].C;
		if (i < inputs.props.length-1) {
			inputsText += " ";
		} else {
			inputsText += "\n";
		}
	}
	inputsText += inputs.dwellPath + "\n";
	inputsText += inputs.matchVelocity + " " + inputs.dwellCatchScale + " " + inputs.dwellTossScale + " " + inputs.emptyTossScale + " " + inputs.emptyCatchScale + " " + inputs.armAngle + "\n";
	for (var i = 0; i < inputs.jugglers.length; i++) {
		inputsText += inputs.jugglers[i].position.x + " " + inputs.jugglers[i].position.z + " " + inputs.jugglers[i].rotation;
		if (i < inputs.jugglers.length-1) {
			inputsText += " ";
		}
	}
	if (inputs.surfaces.length > 0) {
		inputsText += "\n"
	}
	for (var i = 0; i < inputs.surfaces.length; i++) {
		inputsText += inputs.surfaces[i].position.x + " " + inputs.surfaces[i].position.y + " " + inputs.surfaces[i].position.z + " " + inputs.surfaces[i].normal.x + " " + inputs.surfaces[i].normal.y + " " + inputs.surfaces[i].normal.z + " " + inputs.surfaces[i].scale;
		if (i < inputs.surfaces.length-1) {
			inputsText += "\n";
		}
	}
	$('#inputsAdvanced').val(inputsText);
	updateAdvancedLabels();
} 

function parseInputs(inputs) {
	var lines = inputs.split('\n');
	var siteswap = lines[0];
	var beatDuration = parseFloat(lines[1].split(' ')[0]);
	var dwellRatio = parseFloat(lines[1].split(' ')[1]);
	var propsLine = lines[2].split(' ');
	var props = [];
	for (var i = 3; i < propsLine.length; i+=4) {
		props.push({
			type: propsLine[i-3],
			color: propsLine[i-2], 
			radius: parseFloat(propsLine[i-1]), 
			C: parseFloat(propsLine[i])
		});
	}
	
	// this whole bit should probably be moved into the Siteswap class
	var customDwellPathInput = lines[3];
	var customDwellPathBeats = customDwellPathInput.split(').').map(function(a,ix,arr) { if (ix < arr.length-1) { return a+')'; } else { return a; } });
	var dwellPath = [];
	for (var i = 0; i < customDwellPathBeats.length; i++) {
		var customDwellPathArr = customDwellPathBeats[i].match(/\(-?\d+(\.\d+)?(,-?\d+(\.\d+)?)?(,-?\d+(\.\d+)?)?(,\{-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?\})?\)/g);
		if ( customDwellPathArr.reduce(function(a,b) { return a+b }).length == customDwellPathBeats[i].length ) {
			dwellPath.push(
				customDwellPathArr.map(function(a,ix) {   
					var xyz = a.match(/\(-?\d+(\.\d+)?(,-?\d+(\.\d+)?)?(,-?\d+(\.\d+)?)?/g)[0].match(/-?\d+(\.\d+)?/g);
					var rot = a.match(/\{-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?\}/g); 
					var xyzth;
					if (rot) {
						xyzth = rot[0].match(/-?\d+(\.\d+)?/g);
					}
					var rotation;
					if (xyzth) {
						rotation = {x:parseFloat(xyzth[0]),y:parseFloat(xyzth[1]),z:parseFloat(xyzth[2]),th:parseFloat(xyzth[3])};
					} else if (props[0].type == 'club') {
						rotation = {x:4,y:0,z:(ix == 0 ? -1 : 1),th:Math.PI/2+(ix == 0 ? .5 : -.7)};
					} else if (props[0].type == 'ring') {
						rotation = {x:0,y:1,z:0,th:Math.PI/2};
					} else {
						rotation = {x:1,y:0,z:0,th:0};
					}
					return {
						x: parseFloat(xyz[0])/100,
						y: xyz[1] ? parseFloat(xyz[1])/100 : 0,
						z: xyz[2] ? parseFloat(xyz[2])/100 : 0,
						rotation: rotation
					}
				})
			);
		} else {
			throw 'Invalid custom dwell path';
		}
	}

	var dwellPathConfigs = lines[4].split(' ');
	var matchVelocity = dwellPathConfigs[0] == 1 ? true : false;
	var dwellCatchScale = parseFloat(dwellPathConfigs[1]);
	var dwellTossScale = parseFloat(dwellPathConfigs[2]);
	var emptyTossScale = parseFloat(dwellPathConfigs[3]);
	var emptyCatchScale = parseFloat(dwellPathConfigs[4]);
	var armAngle = parseFloat(dwellPathConfigs[5]);

	var jugglerPositions = lines[5].split(' ');
	var jugglers = undefined;
	for (var i = 0; i < jugglerPositions.length; i+=3) {
		if (jugglers === undefined) {
			jugglers = [];
		}
		jugglers.push({
			position: {x: parseFloat(jugglerPositions[i]), z: parseFloat(jugglerPositions[i+1])},
			rotation: parseFloat(jugglerPositions[i+2])
		});
	}

	var surfaces= [];
	for (var i = 6; i < lines.length; i++) {
		var surfaceLine = lines[i].split(' ');
		surfaces.push({
			position: {
				x: parseFloat(surfaceLine[0]),
				y: parseFloat(surfaceLine[1]),
				z: parseFloat(surfaceLine[2]),
			},
			normal: {
				x: parseFloat(surfaceLine[3]),
				y: parseFloat(surfaceLine[4]),
				z: parseFloat(surfaceLine[5]),	
			},
			scale: parseFloat(surfaceLine[6])
		});
	}

	return {
		siteswap: siteswap,
		beatDuration: beatDuration,
		dwellRatio: dwellRatio,
		props: props,
		inputDwellPath: customDwellPathInput,
		dwellPath: dwellPath,
		matchVelocity: matchVelocity,
		dwellCatchScale: dwellCatchScale,
		dwellTossScale: dwellTossScale,
		emptyTossScale: emptyTossScale,
		emptyCatchScale: emptyCatchScale,
		armAngle: armAngle,
		surfaces: surfaces,
		jugglers: jugglers
	};
}

function go() {

	if (!twoWindow) {
		displayMenu('animator');
	}

	var inputs = parseInputs($('#inputsAdvanced').val());

	var saveURL = window.location.href.replace("#","");
	if (saveURL.indexOf("?") > -1) {
		saveURL = saveURL.substring(0,saveURL.indexOf("?"));
	}

	var saveQueryString = "?v=16&siteswap=" + encodeURIComponent(inputs.siteswap) + "&beatDuration=" + inputs.beatDuration + "&dwellPath=" + inputs.inputDwellPath; 

	$('#saveURL').text(saveURL + saveQueryString);
	$('#saveURL').attr("href",saveURL + saveQueryString);	

	window.siteswap = SiteswapJS.CreateSiteswap(inputs.siteswap, 
		{
			beatDuration: 		inputs.beatDuration,
			dwellRatio: 		inputs.dwellRatio,
			props: 				inputs.props,
			dwellPath: 			inputs.dwellPath,
			matchVelocity: 		inputs.matchVelocity,
			dwellCatchScale: 	inputs.dwellCatchScale,
			dwellTossScale: 	inputs.dwellTossScale,
			emptyTossScale: 	inputs.emptyTossScale,
			emptyCatchScale: 	inputs.emptyCatchScale,
			armAngle: 			inputs.armAngle,
			surfaces: 			inputs.surfaces,
			jugglers: 			inputs.jugglers
		});

	if (siteswap.errorMessage) {
		animator.paused = true;
		$('#errorMessage').show();
		$('#message').text(siteswap.errorMessage);
	} else {

		if (siteswap.collision) {
			$('#errorMessage').show();
			$('#message').text("This pattern has collisions.");
		} else {
			$('#errorMessage').hide();
		}		

		var drawHands = false;
		if (siteswap.props[0].type == 'ball' && siteswap.numJugglers == 1) {
			drawHands = true;
		}

		animator.init(siteswap, 
			{
				drawHands: $('#drawHands')[0].checked
				//, motionBlur: true
			}
		);
		animator.animate();

	}

}

function zoomIn() { animator.zoomIn(); }

function zoomOut() { animator.zoomOut(); }

function updateAnimationSpeed() {
	var animationSpeed = parseFloat($('#animationSpeed').val());
	animator.updateAnimationSpeed(animationSpeed);
}

function updateCameraMode() {
	var mode = $('#cameraMode').val();
	cameraMode = {mode: mode};
	if (mode == "custom") {
		var cameraCustomPosition = $('#cameraCustomPosition').val().split(",");
		cameraMode.x = parseFloat(cameraCustomPosition[0]);
		cameraMode.y = parseFloat(cameraCustomPosition[1]);
		cameraMode.z = parseFloat(cameraCustomPosition[2]);
	}
	animator.updateCameraMode(cameraMode);
}

function updateDisplayPropPaths() {
	animator.displayPropPaths = !animator.displayPropPaths;
	if (animator.displayPropPaths) {
		animator.showPropPaths();
	} else {
		animator.hidePropPaths();
	}
}

function updateAdvancedLabels() {
	var inputs = parseInputs($('#inputsAdvanced').val());
	$('#lblSiteswap').text(inputs.siteswap);
	$('#lblBeatDuration').text(inputs.beatDuration);
	$('#lblDwellRatio').text(inputs.dwellRatio);
	var lblProps = "";
	for (var i = 0; i < inputs.props.length; i++) {
		var prop = inputs.props[i];
		lblProps += prop.color + ' ' + prop.type + ' ' + prop.radius + 'm ' + prop.C;
		if (i < inputs.props.length-1) {
			lblProps += ', ';
		}
	}
	$('#lblProps').text(lblProps);
	$('#lblDwellPath').text(inputs.inputDwellPath);
	$('#lblMatchVelocity').text(inputs.matchVelocity == 1 ? 'Y' : 'N');
	$('#lblDwellCatchScale').text(inputs.dwellCatchScale);
	$('#lblDwellTossScale').text(inputs.dwellTossScale);
	$('#lblEmptyTossScale').text(inputs.emptyTossScale);
	$('#lblEmptyCatchScale').text(inputs.emptyCatchScale);
	$('#lblArmAngle').text(inputs.armAngle + ' rad');

	var lblSurfaces = "";
	for (var i = 0; i < inputs.surfaces.length; i++) {
		var surface = inputs.surfaces[i];
		lblSurfaces += 'surface ' + i + ': position <' + surface.position.x + ',' + surface.position.y + ',' + surface.position.z + '>' + ' normal <' + surface.normal.x + ',' + surface.normal.y + ',' + surface.normal.z + '> half-width ' + surface.scale + 'm';
		if (i < inputs.surfaces.length-1) {
			lblSurfaces += ", ";
		}
	}
	$('#lblSurfaces').text(lblSurfaces);

}

function runExample(exampleName) {
	$.getJSON("examples.json", function(data) {
		for (var i = 0; i < data.examples.length; i++) {
			if (data.examples[i].name == exampleName) {
				bindInputs(applyInputDefaults(data.examples[i]));
				go();
			}
		}
	});
}

function buildExamples() {
	$.getJSON("examples.json", function(data) {
		for (var i = 0; i < data.examples.length; i++) {
			$('#examplesList').append('<li><a href="#" onclick="runExample(\'' + data.examples[i].name + '\');">' + data.examples[i].name + '</a></li>');
		}
	});
}

function generateGIF() {

	$('#gifProgress').show();
	$('#gifLink').empty();

	animator.paused = true;
	var numFrames = Math.round((siteswap.states.length*siteswap.beatDuration)*35);
	var currentFrame = 0;

	var canvas = document.createElement( 'canvas' );
	canvas.width = animator.renderer.domElement.width;
	canvas.height = animator.renderer.domElement.height;

	var context = canvas.getContext( '2d' );

	var buffer = new Uint8Array( canvas.width * canvas.height * numFrames * 5 );
	var gif = new GifWriter( buffer, canvas.width, canvas.height, { loop: 0 } );

	var pixels = new Uint8Array( canvas.width * canvas.height );

	var addFrame = function () {

		animator.render((currentFrame/numFrames)*(siteswap.states.length*siteswap.beatDuration)*1000);

		context.drawImage( animator.renderer.domElement, 0, 0 );

		var data = context.getImageData( 0, 0, canvas.width, canvas.height ).data;

		var palette = [];

		for ( var j = 0, k = 0, jl = data.length; j < jl; j += 4, k ++ ) {

			var r = Math.floor( data[ j + 0 ] * 0.1 ) * 10;
			var g = Math.floor( data[ j + 1 ] * 0.1 ) * 10;
			var b = Math.floor( data[ j + 2 ] * 0.1 ) * 10;
			var color = r << 16 | g << 8 | b << 0;

			var index = palette.indexOf( color );

			if ( index === -1 ) {

				pixels[ k ] = palette.length;
				palette.push( color );

			} else {

				pixels[ k ] = index;

			}

		}

		// force palette to be power of 2

		var powof2 = 1;
		while ( powof2 < palette.length ) powof2 <<= 1;
		palette.length = powof2;

		gif.addFrame( 0, 0, canvas.width, canvas.height, pixels, { palette: new Uint32Array( palette ), delay: 5 } );

		$('#gifProgress').val(currentFrame/numFrames);

		currentFrame++;
		if (currentFrame == numFrames) {
			finish();
		} else {
			setTimeout(addFrame,0);
		}


	}

	var finish = function () {

		// return buffer.slice( 0, gif.end() );

		var string = '';

		for ( var i = 0, l = gif.end(); i < l; i ++ ) {

			string += String.fromCharCode( buffer[ i ] )

		}

		$('#gifLink').append("<a href='" + 'data:image/gif;base64,' + btoa( string ) + "' target='_blank'>Download GIF</a>");

		animator.paused = false;
		animator.animate();
		$('#gifProgress').hide();

	}

	addFrame();

}

function findSiteswaps() {
	window.onresize();
	$('#siteswapsList').empty();
	$('#graphContainer').empty();	
	$('#activeSiteswapContainer').hide();

	var excludeInput = $('#exclude').val();

	var config = {
		minPeriod: 1, 
		maxPeriod: parseInt($("#explorerMaxPeriod").val()),
		numProps: parseInt($("#explorerNumProps").val()),
		maxSiteswaps: parseInt($("#explorerMaxSiteswaps").val()),
		includeExcited: $('#explorerIncludeExcited')[0].checked,
		includeMultiplex: $('#explorerIncludeMultiplex')[0].checked,
		async: true,
		sync: $('#explorerSync')[0].checked,
		callbacks: {
			siteswapFound: function (siteswap, siteswapIx, excited) {
				$('#siteswapsList').append('<li><a class="' + (excited ? 'excited' : 'ground') + '" href="#" onclick="runSiteswap(\''+siteswap+'\')">'+siteswap+'</a></li>');
			}
		}
	};
	
	SiteswapGraph.siteswapGraph(config);
}

function runSiteswap(s) {
	$('#siteswap').val(s);
	updateAdvancedInputsFromBasic();
	go();
}

function updateDrawHandsForProp() {
	if ($('#prop').val() != 'ball') {
		$('#drawHands')[0].checked = false;
	}
}

function showHideCameraCustomPosition() {
	if ($('#cameraMode').val() == "custom") {
		$('#cameraCustomPositionContainer').show();
	} else {
		$('#cameraCustomPositionContainer').hide();
	}
}

function getInputsFromQueryString() {
	var inputs = {};
	var siteswap = getURLQueryStringParameterByName("siteswap");
	var props = JSON.parse(getURLQueryStringParameterByName("props"));
	var beatDuration = getURLQueryStringParameterByName("beatDuration");
	var dwellPath = getURLQueryStringParameterByName("dwellPath");
	
	if(siteswap !== null) {
		inputs.siteswap = siteswap;
	}
	if (props !== null) {
		inputs.props = props;
	}
	if (beatDuration !== null) {
		inputs.beatDuration = beatDuration;
	}
	if (dwellPath !== null) {
		inputs.dwellPath = dwellPath;
	}

	return inputs;
}

function saveCurrentSiteswap() {
	var savedSiteswaps = getSavedSiteswaps();
	savedSiteswaps.push({name: $('#savedName').val(), version: 16, inputs: $('#inputsAdvanced').val()});
	window.localStorage.setItem("savedSiteswaps",JSON.stringify(savedSiteswaps));
	refreshSavedSiteswapsList();
	$('#saveSuccess').show(1000);
	setTimeout(function() { $('#saveSuccess').hide(1000); }, 2000);
}

function getSavedSiteswaps() {	
	if (window.localStorage.getItem("savedSiteswaps") === null) {
		window.localStorage.setItem("savedSiteswaps", "[]");
	} 
	return JSON.parse(window.localStorage.getItem("savedSiteswaps"));	
}

function refreshSavedSiteswapsList() {
	var savedSiteswaps = getSavedSiteswaps();
	var savedList = $('#savedList');
	savedList.empty();
	for(var i = 0; i < savedSiteswaps.length; i++) {
		savedList.append('<li><a href="#" class="deleteLink" onclick="deleteSavedSiteswap(' + i + ');"><span class="glyphicon glyphicon-remove"></span></a><a href="#" onclick="runSavedSiteswap(' + i + ');">'+ savedSiteswaps[i].name +'</a></li>');
	}	
}

function runSavedSiteswap(savedSiteswapIndex) {
	var savedSiteswaps = getSavedSiteswaps();
	$('#inputsAdvanced').val(savedSiteswaps[savedSiteswapIndex].inputs);
	go();
}

function deleteSavedSiteswap(savedSiteswapIndex) {
	var savedSiteswaps = getSavedSiteswaps();
	savedSiteswaps.splice(savedSiteswapIndex);
	window.localStorage.setItem("savedSiteswaps",JSON.stringify(savedSiteswaps));
	refreshSavedSiteswapsList();
}