/* ON PAGE LOAD */

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

	return {
			siteswap: $('#siteswap').val(),
			beatDuration: parseFloat($('#beatDuration').val()),
			dwellRatio: parseFloat($('#dwellRatio').val()),
			props: props,
			dwellPathType: $('#dwellPathType').val(),
			motionBlur: $('#motionBlur')[0].checked
		};
}

function go() {

	$('#errorMessage').empty();
	$('#errorMessage').hide();

	var inputs = readInputs();

	/* create dwell path based on inputs */
	var dwellPath;
	if (inputs.dwellPathType == 'cascade') {
		dwellPath = 
			{
				type: "circular",
				path: [
					/* left */
					{
						radius: .15,
						catchRotation: Math.PI,
						tossRotation: 2*Math.PI
					},
					/* right */
					{
						radius: .15,
						catchRotation: 2*Math.PI,
						tossRotation: Math.PI
					}
				]
			};
	} else if (inputs.dwellPathType == 'reverse cascade') {
		dwellPath = 
			{
				type:"circular",
				path: [
					/* left */
					{
						radius: .15,
						catchRotation: 2*Math.PI,
						tossRotation: Math.PI
					},
					/* right */
					{
						radius: .15,
						catchRotation: Math.PI,
						tossRotation: 2*Math.PI
					}
				]
			};
	} else if (inputs.dwellPathType == 'shower') {
		dwellPath = 
			{
				type:"circular",
				path: [
					/* left */
					{
						radius: .15,
						catchRotation: Math.PI,
						tossRotation: 2*Math.PI
					},
					/* right */
					{
						radius: .15,
						catchRotation: Math.PI,
						tossRotation: 2*Math.PI
					}
				]
			};
	} else if (inputs.dwellPathType == 'cascade bezier') {
		dwellPath = 
			{
				type:"bezier",
				path: [
					/* left */
					[{x:-.2,y:0,z:0},{x:.2,y:0,z:0}],
					/* right */
					[{x:.2,y:0,z:0},{x:-.2,y:0,z:0}]
				]
			};
	} else if (inputs.dwellPathType == 'factory') {
		dwellPath = 
			{
				type:"bezier",
				path: [
					/* left */
					[{x:0,y:.4,z:0},{x:.6,y:.4,z:0}],
					/* right */
					[{x:.2,y:-.1,z:0},{x:-.2,y:-.1,z:0}]
				]
			};
	}

	var siteswap = SiteswapJS.CreateSiteswap(inputs.siteswap, 
		{
			beatDuration: 	inputs.beatDuration,
			dwellRatio: 	inputs.dwellRatio,
			props: 			inputs.props,
			dwellPath: 		dwellPath
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