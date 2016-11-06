// app/models/bear.js

var mongoose     = require('mongoose');

var Prop = new mongoose.Schema({
    type: String,
    color: String,
    radius: Number,
    C: Number
});

var Juggler = new mongoose.Schema({
    position: {
        x: Number,
        z: Number
    },
    rotation: Number,
    color: String
});

var Surface = new mongoose.Schema({
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
    scale: Number,
    color: String
});

var PatternSchema   = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    public: Boolean,
    description: String,
    tags: [String],
    inputs: {
        siteswap: String,
        beatDuration: Number,
        dwellRatio: Number,
        props: [Prop],
        dwellPath: String,
        matchVelocity: Boolean,
        dwellCatchScale: Number,
        dwellTossScale: Number,
        emptyCatchScale: Number,
        emptyTossScale: Number,
        armAngle: Number,
        jugglers: [Juggler],
        surfaces: [Surface],
        drawHands: Boolean
    }    
});

module.exports = mongoose.model('Pattern', PatternSchema);