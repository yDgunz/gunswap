/* ON PAGE LOAD */

var animator = new SiteswapAnimator.SiteswapAnimator('animatorContainer');

var queryStringSiteswap = getURLQueryStringParameterByName('siteswap');
if (queryStringSiteswap !== "") {
	$('#siteswap').val(decodeURIComponent(queryStringSiteswap));
}

go();

window.onresize = function () {
	animator.resize($('#animatorContainer').width()-10, $(window).height()-10);
}

function readInputs() {
	return {
			siteswap: $('#siteswap').val(),
			beatDuration: parseFloat($('#beatDuration').val()),
			dwellRatio: parseFloat($('#dwellRatio').val()),
			propType: $('#propType').val(),
			propRadius: .05,
			propC: .95,
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

	siteswap = SiteswapJS.CreateSiteswap(inputs.siteswap, 
		{
			beatDuration: 	inputs.beatDuration,
			dwellRatio: 	inputs.dwellRatio,
			propType: 		inputs.propType,
			propRadius: 	inputs.propRadius,
			dwellPath: 		dwellPath
		});

	animator.go(siteswap, {motionBlur: inputs.motionBlur});
}

function zoomIn() { animator.zoomIn(); }

function zoomOut() { animator.zoomOut(); }

function updateAnimationSpeed() {
	animationSpeed = parseFloat($('#animationSpeed').val())/100;
	animator.updateAnimationSpeed(animationSpeed);
}

function updateCameraMode() {
	cameraMode = $('#cameraMode').val();
	animator.updateCameraMode(cameraMode);
}