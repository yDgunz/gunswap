// app/models/bear.js

var mongoose     = require('mongoose');

var PatternSchema   = new mongoose.Schema({
    name: String,
    description: String,
    tags: [String],
    siteswap: String,
    beatDuration: Number,
    dwellRatio: Number,
    props: [
    	{
    		type: String,
    		color: String,
    		radius: Number,
    		C: Number
    	}
    ],
    dwellPath: String,
    matchVelocity: Boolean,
    dwellCatchScale: Number,
    dwellTossScale: Number,
    emptyCatchScale: Number,
    emptyTossScale: Number,
    armAngle: Number,
    jugglers: [
    	{
    		position: {
    			x: Number,
    			z: Number
    		},
    		rotation: Number
    	}
    ],
    surfaces: [
    	{
    		position: {
    			x: Number,
    			y: Number,
    			z: Number
    		},
    		normal: {
    			x: Number,
    			y: Number,
    			z: Number
    		},
    		scale: Number
    	}
    ],
    drawHands: Boolean
});

module.exports = mongoose.model('Pattern', PatternSchema);