/* ------- */
/* HELPERS */
/* ------- */

function GetQueryStringParams(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}

function cloneState(obj) {
  var newObj = (obj instanceof Array) ? [] : {};
  for (i in obj) {
    if (i == 'clone') continue;
    if (obj[i] && typeof obj[i] == "object") {
      newObj[i] = cloneState(obj[i]);
    } else newObj[i] = obj[i]
  } return newObj;
};

/* 
	helper for figuring out the number of props 
	TODO : this should interpret a-g as valid toss heights
*/
function sumIntegers(str) {
	if (str.length == 1 && parseInt(str)) {
		return parseInt(str);
	} else if (str.charCodeAt(0) >= 97 && str.charCodeAt(0) <= 111) {
		return str.charCodeAt(0)-87;
	} else if (str.length > 1) {
		return str.split('').reduce(function(prev,cur) { return (parseInt(prev) ? parseInt(prev) : 0) + (parseInt(cur) ? parseInt(cur) : 0) });
	} else {
		return 0;
	}
}

/* helper for state array equality */
function arraysEqual(a,b) {
	if (a instanceof Array && b instanceof Array) {
		if (a.length != b.length) {
			return false;
		} else {
			for (var i = 0; i < a.length; i++) {
				/* if this is a multi-dimensional array, check equality at the next level */
				if (a[i] instanceof Array || b[i] instanceof Array) {
					var tmp = arraysEqual(a[i],b[i]);
					if (!tmp) {
						return false;
					}
				} else if (a[i] != b[i]) {
					return false;
				}
			}
		}
	} else {
		return false;
	}
	return true;
}