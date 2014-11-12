/* calculates the sum of all throws in the siteswap. used to determine the number of props */
function sumThrows(str) {

	var total = 0;
	for (var i = 0; i < str.length; i++) {
		if(parseInt(str[i])) {
			total += parseInt(str[i]);					
		} else if (str.charCodeAt(i) >= 97 && str.charCodeAt(i) <= 119) {
			// handle "a" through "z" (where "a" = 10)
			total += str.charCodeAt(0)-87;
		}

		// if the current character is a pass/bounce/spin marker
		// ignore the next character so we don't count the
		// juggler identifier  in something like <5p2|5p3|5p1>
		if (str[i] == "P" || str[i] == "S" || str[i] == "B") {
			i++;
		}
	}

	return total;
}

/* used for deep cloning of various arrays/objects */
function cloneObject(obj) {
  var newObj = (obj instanceof Array) ? [] : {};
  for (var i in obj) {
    if (i == 'clone') continue;
    if (obj[i] && typeof obj[i] == "object") {
      newObj[i] = cloneObject(obj[i]);
    } else newObj[i] = obj[i]
  } return newObj;
}

/* used to check if two states are the same */
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

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

function getURLQueryStringParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}