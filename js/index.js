/* ON PAGE LOAD */

$('#inputsDiv').height($(window).height()-20);

var animator = new SiteswapAnimator.SiteswapAnimator('animatorContainer');

var queryStringSiteswap = getURLQueryStringParameterByName('siteswap');
if (queryStringSiteswap !== "") {
	$('#siteswap').val(decodeURIComponent(queryStringSiteswap));
}

var siteswap = SiteswapJS.CreateSiteswap($('#siteswap').val(),{validationOnly: true});
buildPropInputs();

go();

window.onresize = function () {
	$('#container').width($(window).width());
	animator.resize($('#animatorContainer').width()-25, $(window).height()-40);
	$('#inputsDiv').height($(window).height()-20);
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