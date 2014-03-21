/* ------- */
/* JUGGLER */
/* ------- */

function Juggler(config) {
	this.position = config.position;
	this.rotation = config.rotation;
	this.dwellPath = config.dwellPath;

	this.interpolateDwellPath = function(hand,t) {
		/* t from 0 to 1 */
		var currentRotation = this.dwellPath[hand].catchRotation + (this.dwellPath[hand].tossRotation - this.dwellPath[hand].catchRotation)*t;
		
		var dwellPosition = {
			x: this.dwellPath[hand].radius*Math.cos(currentRotation),
			y: this.dwellPath[hand].radius*Math.sin(currentRotation),
			z: 0
		};

		return {
			x: this.position.x - .4125*Math.sin(this.rotation) + ((hand == LEFT ? -1 : 1)*.225+dwellPosition.x)*Math.cos(this.rotation),
			y: 1.0125 + dwellPosition.y,
			z: this.position.z - .4125*Math.cos(this.rotation) + ((hand == LEFT ? -1 : 1)*.225/2+dwellPosition.x)*Math.sin(this.rotation)
		};

	}
}