/* ------- */
/* JUGGLER */
/* ------- */

function Juggler(config) {
	this.position = config.position;
	this.rotation = config.rotation;
	this.width = config.width;
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
			x: this.position.x + ((hand == LEFT ? -1 : 1)*this.width/2+dwellPosition.x)*Math.cos(this.rotation),
			y: this.position.y + dwellPosition.y,
			z: this.position.z + ((hand == LEFT ? -1 : 1)*this.width/2+dwellPosition.x)*Math.sin(this.rotation)
		};

	}
}