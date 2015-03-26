/* ON PAGE LOAD */

$('#inputsDiv').height($(window).height());

var animator = new SiteswapAnimator.SiteswapAnimator('animatorContainer');

var queryStringSiteswap = getURLQueryStringParameterByName('siteswap');
if (queryStringSiteswap !== "") {
	$('#siteswap').val(decodeURIComponent(queryStringSiteswap));
}

var siteswap = SiteswapJS.CreateSiteswap($('#siteswap').val(),{validationOnly: true});
buildPropInputs();

buildExamples();

go();

window.onresize = function () {
	//animator.resize($('#animatorContainer').width()-25, $(window).height()-40);
	$('#inputsDiv').height($(window).height());
}

function siteswapChanged() {
	$('#errorMessage').empty();
	$('#errorMessage').hide();

	siteswap = SiteswapJS.CreateSiteswap($('#siteswap').val(),{validationOnly: true});

	if (siteswap.errorMessage) {
		$('#errorMessage').html("WARNING: " + siteswap.errorMessage);
		$('#errorMessage').show();
	}

	buildPropInputs();

}

function buildPropInputs() {

	/* only re-build the single prop inputs if they haven't been built yet */
	if ($('#singlePropInputs select').length == 0) {
		$('#singlePropInputs').empty();
		$('#singlePropInputs').html($('#propInputTemplate').html().replace(/NNN/g,''));
	}

	$('#multiPropInputs').empty();
	$('#multiPropInputs').append('<select id="propSelector" class="form-control input-sm" onchange="toggleMultiPropInputs();"></select>');

	for (var i = 0; i < siteswap.numProps; i++) {
		$('#propSelector').append('<option id="prop' + i + '" value="' + i + '">Prop ' + (i+1) + '</option>');
		$('#multiPropInputs').append('<div id="propInputs' + i + '" style="' + (i > 0 ? 'display:none;' : '') + '"></div>');
		$('#propInputs' + i).html($('#propInputTemplate').html().replace(/NNN/g,i));
	}

}

function togglePropInputType() {

	$('#singlePropInputs').toggle();
	$('#multiPropInputs').toggle();

}

function toggleMultiPropInputs() {
	for (var i = 0; i < siteswap.numProps; i++) {
		
		if (i == $("#propSelector").val()) {
			$('#propInputs' + i).show();
		} else {
			$('#propInputs' + i).hide();
		}
	}
}

var defaultInputs = {
	siteswap: 5,
	beatDuration: .24,
	dwellRatio: .7,
	dwellPath: '(30)(10)',
	dwellPathType: 'cascade',
	armAngle: .1,
	propType: 'ball',
	propColor: 'red'
}

function bindInputs(inputs,defaults) {
	/* leave these inputs as they were unless otherwise specified */		
	$('#siteswap').val(inputs.siteswap ? inputs.siteswap : defaults.siteswap);
	$('#beatDuration').val(inputs.beatDuration ? inputs.beatDuration : defaults.beatDuration);
	$('#dwellRatio').val(inputs.dwellRatio ? inputs.dwellRatio : defaults.dwellRatio);
	$('#dwellPath').val(inputs.dwellPath ? inputs.dwellPath : defaults.dwellPath);
	$('#dwellPathType').val(inputs.dwellPath ? 'custom' : defaults.dwellPathType);
	$('#armAngle').val(inputs.armAngle ? inputs.armAngle : defaults.armAngle);

	/* not going to add the advanced dwell path inputs to this for now since they'll probably get taken out */

	/* only allow uniform prop types */
	if(!$('#propInputType')[0].checked) {
		togglePropInputType();
	}
	$('#propInputType')[0].checked = true;

	$('#propType').val(inputs.propType ? inputs.propType : defaults.propType);
	$('#propColor').val(inputs.propColor ? inputs.propColor : defaults.propColor);

}

function readInputs() {
	var props = [];
	var singlePropInput = $('#propInputType')[0].checked;
	for (var i = 0; i < siteswap.numProps; i++) {
		props.push(
		{
			type: singlePropInput ? $('#propType').val() : $('#propType' + i).val(),
			color: singlePropInput ? $('#propColor').val() : $('#propColor' + i).val(),
			C: .95,
			radius: .05
		});
	}

	var customDwellPathInput = $('#dwellPath').val();
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
	
	return {
			siteswap: $('#siteswap').val(),
			beatDuration: parseFloat($('#beatDuration').val()),
			dwellRatio: parseFloat($('#dwellRatio').val()),
			props: props,
			dwellPath: dwellPath,
			motionBlur: $('#motionBlur')[0].checked,
			matchVelocity: $('#matchVelocity')[0].checked,
			dwellCatchScale: parseFloat($('#dwellCatchScale').val()),
			dwellTossScale: parseFloat($('#dwellTossScale').val()),
			emptyTossScale: parseFloat($('#emptyTossScale').val()),
			emptyCatchScale: parseFloat($('#emptyCatchScale').val()),
			armAngle: parseFloat($('#armAngle').val())
		};
}

function handMovementChanged() {
	var dwellPathType = $('#dwellPathType').val();
	if (dwellPathType == 'cascade') {
		$('#dwellPath').val('(30)(10)');
	} else if (dwellPathType == 'reverse cascade') {
		$('#dwellPath').val('(10)(30)');
	} else if (dwellPathType == 'shower') {
		$('#dwellPath').val('(30)(10).(10)(30)');
	} else if (dwellPathType == 'mills mess') {
		$('#dwellPath').val('(2.5)(-30).(-2.5)(30).(0)(-30)');
	} else if (dwellPathType == 'windmill') {
		$('#dwellPath').val('(-20)(20).(20)(-20)');
	} else if (dwellPathType == 'custom') {
		$('#dwellPath').val('');
	}
}

function go() {

	$('#errorMessage').empty();
	$('#errorMessage').hide();

	var inputs = readInputs();

	var siteswap = SiteswapJS.CreateSiteswap(inputs.siteswap, 
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
			armAngle: 			inputs.armAngle
		});

	animator.go(siteswap, {motionBlur: inputs.motionBlur});
}

function zoomIn() { animator.zoomIn(); }

function zoomOut() { animator.zoomOut(); }

function updateAnimationSpeed() {
	animationSpeed = parseFloat($('#animationSpeed').val());
	animator.updateAnimationSpeed(animationSpeed);
}

function updateCameraMode() {
	cameraMode = $('#cameraMode').val();
	animator.updateCameraMode(cameraMode);
}

function generateGIF() {

	var current = 0;
	var total = 100;

	var canvas = document.createElement( 'canvas' );
	canvas.width = $('canvas')[0].width;
	canvas.height = $('canvas')[0].height;

	var context = canvas.getContext( '2d' );

	var buffer = new Uint8Array( canvas.width * canvas.height * total * 5 );
	var gif = new GifWriter( buffer, canvas.width, canvas.height, { loop: 0 } );

	var pixels = new Uint8Array( canvas.width * canvas.height );

	var addFrame = function () {

		context.drawImage( $('canvas')[0], 0, 0 );

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

		current ++;

		if ( current < total ) {

			setTimeout( addFrame, 0 );

		} else {

			setTimeout( finish, 0 );

		}

	}

	var finish = function () {

		// return buffer.slice( 0, gif.end() );

		var string = '';

		for ( var i = 0, l = gif.end(); i < l; i ++ ) {

			string += String.fromCharCode( buffer[ i ] )

		}

		var image = document.createElement( 'img' );
		image.src = 'data:image/gif;base64,' + btoa( string );
		document.body.appendChild( image );

	}

	addFrame();

}

function runExample(exampleName) {
	$.getJSON("examples.json", function(data) {
		for (var i = 0; i < data.examples.length; i++) {
			if (data.examples[i].name == exampleName) {
				bindInputs(data.examples[i],defaultInputs);
				go();
			}
		}
	});
}

function buildExamples() {
	$.getJSON("examples.json", function(data) {
		for (var i = 0; i < data.examples.length; i++) {
			$('#examples').append('<li><a href="#" onclick="runExample(\'' + data.examples[i].name + '\');">' + data.examples[i].name + '</a></li>');
		}
	});
}

function filterExamples() {
	var filterValue = $('#filterExamples').val();
	if (filterValue == '') {
		$('#examples li').show();	
	} else {
		$('#examples li').hide();
		$('#examples li:contains("' + filterValue + '")').show();
	}
}