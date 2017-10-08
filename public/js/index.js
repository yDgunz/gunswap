var twoWindow = false;
var DEFAULT_INPUTS;

window.onload = function () {

	displayMenu('pattern');

	window.animator = new SiteswapAnimator.SiteswapAnimator('animatorCanvasContainer', {displayPropPaths: false});

	window.onresize();

	buildExamples();
	refreshSavedSiteswapsList();

	// load default pattern
	// only want to retrieve default inputs once, hence the global var
	$.get("defaultPattern.yml", function(data) {
		DEFAULT_INPUTS = YAML.parse(data);		

		var patternId = getURLQueryStringParameterByName("patternId");
		if (patternId != undefined) {
			runSavedSiteswap(patternId, false);
		} else {
			$('#inputsAdvanced').val(YAML.stringify(DEFAULT_INPUTS.inputs,1,1));
			go();
		}

	});	

}

//update advanced inputs from basics
function updateInputSiteswap() {
	var siteswap = $('#siteswap').val();
	var inputs = YAML.parse($('#inputsAdvanced').val());
	inputs.siteswap = siteswap;
	$('#inputsAdvanced').val(YAML.stringify(inputs,1,1));
}

function updateInputProp() {
	var prop = $('#prop').val();
	var inputs = YAML.parse($('#inputsAdvanced').val());
	inputs.props.splice(1); // reduce to 1 prop
	inputs.props[0].type = prop;
	$('#inputsAdvanced').val(YAML.stringify(inputs,1,1));
}

function updateInputDwellPath() {
	var dwellPath = $('#dwellPath').val();
	var inputs = YAML.parse($('#inputsAdvanced').val());
	inputs.dwellPath = dwellPath;
	$('#inputsAdvanced').val(YAML.stringify(inputs,1,1));
}

function updateInputBeatDuration() {
	var beatDuration = $('#beatDuration').val();
	var inputs = YAML.parse($('#inputsAdvanced').val());
	inputs.beatDuration = beatDuration;
	$('#inputsAdvanced').val(YAML.stringify(inputs,1,1));
}

function updateInputDrawHands() {
	var drawHands = $('#drawHands')[0].checked;
	var inputs = YAML.parse($('#inputsAdvanced').val());
	inputs.drawHands = drawHands;
	$('#inputsAdvanced').val(YAML.stringify(inputs,1,1));
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
	var minAnimatorWidth = 400;
	var animatorHeight = windowHeight - 30;

	if (animatorWidth > minAnimatorWidth) {
		$('#nav #animator').hide();
		$('#animatorCanvasContainer').appendTo($('body'));
		$('#animatorMenu').removeClass('controlDiv');
		$('.navText').show();

		twoWindow = true;
	} else {
		if (controlsWidth > windowWidth) {
			controlsWidth = windowWidth;
		}
		$('#nav #animator').show();
		$('#animatorCanvasContainer').appendTo($('#controlsContainer #animatorMenu'));
		$('#animatorMenu').addClass('controlDiv');
		animatorWidth = windowWidth-15;
		controlsWidth = windowWidth;
		twoWindow = false;
		animatorHeight = animatorHeight - $('#animatorCanvasContainer').offset().top;
		$('.navText').hide();
	}

	$('#controlsContainer').height(windowHeight);
	$('#controlsContainer').width(controlsWidth);

	$('#animatorCanvasContainer').height(animatorHeight);
	$('#animatorCanvasContainer').width(animatorWidth);	

	// resize divs containing lists
	$('#generatedSiteswaps').height(windowHeight-$('#generatedSiteswaps').offset().top-10);
	$('#exampleSiteswaps').height(windowHeight-$('#exampleSiteswaps').offset().top-10);
	$('#stateDiagramTableContainer').height(windowHeight-$('#exampleSiteswaps').offset().top-10);
	$('#savedSiteswaps').height(windowHeight-$('#exampleSiteswaps').offset().top-10);
	$('#patternMenu').height(windowHeight-$('#patternMenu').offset().top-10);

	if (animator.resize) {
		animator.resize(animatorWidth, animatorHeight);
	}	
}

function parseInputs() {
	
	var inputs = YAML.parse($('#inputsAdvanced').val());

	// use the defaults where values weren't defined
	var defaults = cloneObject(DEFAULT_INPUTS.pattern);

	// iterate over all properties set in the example and apply them to the inputs
	var keys = Object.keys(inputs)
	for (var keyIx = 0; keyIx < keys.length; keyIx++) {
		if (keys[keyIx] == "siteswap") {
			defaults[keys[keyIx]] = inputs[keys[keyIx]].toString();
		} else {
			defaults[keys[keyIx]] = inputs[keys[keyIx]];
		}
	}	

	return defaults;
}

function go() {

	if (!twoWindow) {
		displayMenu('animator');
	}

	var inputs = parseInputs();

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
			jugglers: 			inputs.jugglers,
			startingHand: 		inputs.startingHand
		});

	/* display state diagram if it's available */
	if (siteswap.stateDiagram) {
		var headerColSpan = (siteswap.stateDiagram[0].length-2)/2;
		var sdHtml = "<tr><th colspan='2'></th><th colspan='" + headerColSpan + "'>L</th><th colspan='" + headerColSpan + "'>R</th></tr>";
		siteswap.stateDiagram.map(function(r) {
			sdHtml += "<tr>";
			r.map(function(c) { 
				var props = c.toString();
				var bgColor = "white";
				if (!isNaN(props) && props < siteswap.props.length) {
					if (siteswap.props[parseInt(props)].color == "random") {
						bgColor = randomColors.getIndexCyclic(parseInt(props));
					} else {
						bgColor = siteswap.props[parseInt(props)];
					}
				}
				sdHtml += ("<td bgcolor='" + bgColor + "'>" + c.toString() + "</td>"); 
			});
			sdHtml += "</tr>";
		});
		$('#stateDiagramTable').html(sdHtml);
	}

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

		updateCameraModeNumJugglers(siteswap.numJugglers);

		animator.init(siteswap, 
			{
				drawHands: inputs.drawHands
				, motionBlur: inputs.motionBlur
				, backgroundColor: inputs.backgroundColor
			}
		);
		animator.usingSlider = false;
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

function runExample(exampleIndex) {
	// get example and apply on top of defaults
	$.get("examples.yml", function(data) {
		var examples = YAML.parse(data);
		for (var i = 0; i < examples.length; i++) {
			if (i == exampleIndex) {
				delete examples[i]["name"];
				$('#inputsAdvanced').val(YAML.stringify(examples[i],1,1));
				break;			
			}
		}
		
		go();
	});
}

function buildExamples() {
	$.get("examples.yml", function(data) {
		var examples = YAML.parse(data);
		for (var i = 0; i < examples.length; i++) {
			$('#examplesList').append('<li><a href="#" onclick="runExample(\'' + i + '\');">' + examples[i].name + '</a></li>');
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

		animator.step = Math.floor((currentFrame/numFrames)*siteswap.numSteps);
		animator.render();

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
				$('#siteswapsList').append('<li><a class="' + (excited ? 'excited' : 'ground') + ' patternLink" href="#" onclick="runSiteswap(\''+siteswap+'\')">'+siteswap+'</a></li>');
			}
		}
	};
	
	SiteswapGraph.siteswapGraph(config);
}

function runSiteswap(s) {
	$('#siteswap').val(s);
	updateInputSiteswap();
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


function saveCurrentSiteswap() {

	var pattern = {};
	pattern.inputs = YAML.parse($('#inputsAdvanced').val());
	pattern.name = $('#savedName').val();

	$.post("api/patterns", pattern)
	.done(function(d) { 
		$("#saveSuccess").show().delay(5000).fadeOut();
		refreshSavedSiteswapsList(); 
	})
	.fail(function() {
		$("#saveFailure").show().delay(5000).fadeOut();
	});

}

function refreshSavedSiteswapsList() {
	$.get("api/patterns?public=1").done(function(patterns) { 
		var savedList = $('#savedList');
		savedList.empty();
		for(var i = 0; i < patterns.length; i++) {
			savedList.append('\
				<li>\
					<div class="patternLink">\
						<a href="#" onclick="runSavedSiteswap(\'' + patterns[i]._id + '\',true);">' + patterns[i].name + '</a>\
						<a href="" style="float:right;" onclick="deleteSavedSiteswap(\'' + patterns[i]._id + '\');">X</a>\
					</div>\
				</li>'
			);
		}	
	});
}

function runSavedSiteswap(id,updateUrl) {
	$.get("api/patterns/"+id).done(function(pattern) {
		
		// clear out irrelevant fields
		if (pattern.inputs.surfaces.length == 0) {
			delete pattern.inputs.surfaces;
		} else {
			for (var i = 0; i < pattern.inputs.surfaces.length; i++) {
				delete pattern.inputs.surfaces[i]._id;
			}
		}

		if (pattern.inputs.jugglers.length == 0) {
			delete pattern.inputs.jugglers;
		} else {
			for (var i = 0; i < pattern.inputs.jugglers.length; i++) {
				delete pattern.inputs.jugglers[i]._id;
			}
		}

		if (pattern.inputs.props.length == 0) {
			delete pattern.inputs.props;
		} else {
			for (var i = 0; i < pattern.inputs.props.length; i++) {
				delete pattern.inputs.props[i]._id;
			}
		}

		// set URL query string for sharing pattern
		if (updateUrl) {
			window.location.href = window.location.origin + "?patternId=" + id;
		}	

		$('#inputsAdvanced').val(YAML.stringify(pattern.inputs,1,1));
		go();

	});
}

function deleteSavedSiteswap(id) {
	$.ajax({
	    url: 'api/patterns/'+id,
	    type: 'DELETE',
	    success: function(result) {
	        refreshSavedSiteswapsList();
	    }
	});

}

function updateCameraModeNumJugglers(numJugglers) {
	
}