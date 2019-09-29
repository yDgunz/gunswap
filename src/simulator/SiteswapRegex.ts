// construct the various regex patterns. see blog post for details about this
var validToss = "([\\da-o])x?A?(P\\d?)?(C{(C|P)?})?(T{(C|P)?})?(B({\\d*(L|HL|F|HF)?\\d*})?)?(S{-?\\d+(.\\d+)?(,-?\\d+(.\\d+)?,-?\\d+(.\\d+)?,-?\\d+(.\\d+)?)?})?(D{\\d*\\.?\\d*})?";
var validMultiplex = "\\[(" + validToss + ")+\\]";
var validThrow = validToss + "|" + validMultiplex;
var validSync = "\\((" + validThrow + "),(" + validThrow + ")\\)";
var validBeat = "(" + validThrow + "|" + validSync + ")";
var validPass = "<" + validBeat + "(\\|" + validBeat + ")+>";
var validSiteswap = "^(" + validPass + ")+|(" + validBeat + ")+\\*?$";

// use this to identify passing pattern shorthand like <3P333|3P333>
// we will then convert those patterns to standard notation like <3P|3P><3|3><3|3><3|3> 
// and parse them as we did before
var validPassShorthand = "<" + validBeat + "+(\\|" + validBeat + "+)+>"; 

export const ValidTossRe = new RegExp(validToss,"g");
export const ValidMultiplexRe = new RegExp(validMultiplex,"g");
export const ValidThrowRe = new RegExp(validThrow,"g");
export const ValidSyncRe = new RegExp(validSync,"g");
export const ValidBeatRe = new RegExp(validBeat,"g");
export const ValidPassRe = new RegExp(validPass,"g");
export const ValidSiteswapRe = new RegExp(validSiteswap,"g");
export const ValidPassShorthandRe = new RegExp(validPassShorthand,"g");