
Function.prototype.implement = function (members) {
	var key, prototype = this.prototype;

	for (key in members) {
		if (members[key] != prototype[key]) {
			if (prototype.hasOwnProperty(key)) {
				warn('overwriting "' + key + '" in ' + (this.name || this) + '.prototype');
			}

			Object.defineProperty(prototype, key, {
				value: members[key],
				enumerable: false
			});
		}
	}
};

Function.implement({

	isFunction: true,

	leastFixedPoint: function (i) {
		var next = this(i);

		while (i != next) {
			i = next;
			next = this(i);
		}

		return i;
	},

	methodize: function (context) {
		var callback = this;

		return function () {
			return callback.apply(context, [this].add(arguments));
		}
	},

	memoize: function () {
		var callback = this, memo = {};

		return function () {
			return memo[arguments.toString()] || (memo[arguments.toString()] = callback.apply(null, arguments));
		}
	},

	curry: function () {
		var callback = this, args = arguments;

		return function () {
			return callback.apply(null, args.add(arguments));
		}
	},

	bind: Function.prototype.bind || function (context) {
		var callback = this, args = arguments.slice(1);

		return function () {
			return callback.apply(context, args.add(arguments));
		}
	},

	debounce: function (wait) {
		var callback = this, timeout;

		return function () {
			var args = arguments;

			clearTimeout(timeout);
			timeout = setTimeout(function () {
				callback.apply(null, args);
			}, wait); 
		};
	},

	throttle: function (wait) {
		var callback = this, timeout, args;

		return function () {
			args = arguments;

			if (! timeout) {
				timeout = setTimeout(function () {
					callback.apply(null, args);
					clearTimeout(timeout);
				}, wait);
			}
		};
	},

	timeout: function (wait) {
		return setTimeout(this, wait);
	},

	interval: function (wait) {
		return setInterval(this, wait);
	},

	defer: function () {
		return setTimeout(this, 1);
	}

});

Array.implement({

	isArray: true,

	toString: JSON.stringify.methodize(JSON),

	toColorHex: function () {
		var red = (this[0] * 255 | 0).toHex();
		red = '0'.times(2 - red.length) + red;
		var green = (this[1] * 255 | 0).toHex();
		green = '0'.times(2 - green.length) + green;
		var blue = (this[2] * 255 | 0).toHex();
		blue = '0'.times(2 - blue.length) + blue;
		return '#' + red + green + blue;
	},

	add: function (array) {
		this.push.apply(this, array);
		return this;
	},

	append: function () {
		this.push.apply(this, arguments);
		return this;
	},

	prepend: function () {
		this.unshift.apply(this, arguments);
		return this;
	},

	index: function (i) {
		return this[i.mod(this.length)];
	},

	last: function () {
		return this[this.length - 1];
	},

	contains: function (object) {
		return this.indexOf(object) !== -1;
	},

	remove: function (object) {
		var index = this.indexOf(object);
		if (index === -1) return this;
		this.splice(index, 1);
		return this;
	},

	from: function (object) {
		var result = {};

		for (var i = 0, l = this.length; i < l; ++i) {
			result[this[i]] = object[this[i]];
		}

		return result;
	},

	sortBy: function (method) {
		return this.sort(function (a, b) {
			if (method.isString) return b[method].toNumber() - a[method].toNumber();
			else return method(b).toNumber() - method(a).toNumber();
		});
	},

	unique: function () {
		var result = [];

		for (var i = 0, l = this.length; i < l; ++i) {
			if (result.contains(this[i])) continue;
			result.push(this[i]);
		}

		return result;
	},

	random: function () {
		return this[random() * this.length | 0];
	},

	shuffle: function () {
		var result = [], clone = this.slice(0);

		while (clone.length) {
			result.push(clone.splice(random() * clone.length, 1)[0]);
		}

		return result;
	},

	max: function () {
		return Math.max.apply(Math, this);
	},

	min: function () {
		return Math.min.apply(Math, this);
	},

	or: function () {
		var result = null;

		for (var i = 0, l = this.length; i < l; ++i) {
			result = result || this[i];
		}

		return result;
	},

	and: function () {
		var result = null;

		for (var i = 0, l = this.length; i < l; ++i) {
			result = result && this[i];
		}

		return result;
	},

	sum: function () {
		var sum = 0;

		for (var i = 0, l = this.length; i < l; ++i) {
			sum += this[i];
		}

		return sum;
	},

	mean: function () {
		return this.sum() / this.length;
	},

	median: function () {
		return this[this.length / 2];
	},

	stdDev: function () {
		var devs = 0;
		var mean = this.mean();

		for (var variance, i = 0, l = this.length; i < l; ++i) {
			variance = this[i] - mean;
			devs += variance * variance;
		}

		return sqrt(devs / this.length);
	}
	
});

function load(key) {
	return localStorage[key].toObject();
}

Object.implement({

	isObject: true,

	toString: JSON.stringify.methodize(JSON),

	toArray: function () {
		return Array.prototype.slice.call(this, 0);
	},

	toCSON: function (depth) {
		var space = '&nbsp;', depth = depth || 1;
		var pretty = '';

		for (var key in this) {
			var value = this[key];

			if (! (value == null || value.isNumber || value.isString)) {
				value = '<br>' + value.toCSON(depth + 1);
			}

			pretty += space.times(depth * 2) + key + ': ' + value + '<br>';
		}

		return pretty;
	},

	save: function (key) {
		localStorage[key] = this;
		return this;
	},

	erase: function (key) {
		localStorage.removeItem(key);
		return this;
	},

	keys: Object.getOwnPropertyNames.methodize() || function () {
		var result = [];

		for (var key in this) {
			result.push(key);
		}

		return result;
	},

	values: function () {
		var result = [];

		for (var key in this) {
			result.push(this[key]);
		}

		return result;
	},

	only: function (keys) {
		var result = {};

		if (keys.isString) keys = arguments;

		for (var i = 0, l = keys.length; i < l; ++i) {
			var key = keys[i];
			result[key] = this[key];
		}

		return result;
	},

	has: function (keys) {
		if (! keys.isArray) keys = keys.keys();

		for (var i = 0, l = keys.length; i < l; ++i) {
			var key = keys[i];
			if (! this.hasOwnProperty(key)) return false;
		}

		return true;
	},

	equals: function (object) {
		for (var key in this) {
			if (object[key] != this[key]) return false;
		}

		return true;
	},

	extend: function (object) {
		for (var key in object) {
			this[key] = object[key];
		}

		return this;
	},

	defaults: function (object) {
		for (var key in object) {
			if (this[key] == null) this[key] = object[key];
		}

		return this;
	},

	into: function (object) {
		object.extend(this);
		return this;
	},

	enhance: function (type) {
		type.implement(this);
		return this;
	},

	each: function (callback) {
		for (var key in this) {
			callback(this[key], key);
		}

		return this;
	},

	map: function (callback) {
		var result = {};

		for (var key in this) {
			result[key] = callback(this[key], key);
		}

		return result;
	},

	mapKeys: function (callback) {
		var result = {};

		for (var key in this) {
			result[callback(key)] = this[key];
		}

		return result;
	},

	reduce: function (accumulator, callback) {
		var result = accumulator || {};

		for (var key in this) {
			result = callback(result, this[key], key);
		}

		return result;
	},

	destructure: function (pairsDelimeter, pairDelimeter) {
		// convert an object into a key-value string
		var pairs = [];

		for (var key in this) {
			pairs.push(key + pairDelimeter + this[key]);
		}

		return pairs.join(pairsDelimeter);
	},

	callsString: function (callsDelimeter) {
		// convert a methods-args hash into a string
		var calls = [];

		for (var key in this) {
			calls.push(key + '(' + this[key] + ')');
		}

		return calls.join(callsDelimeter);
	},

	freeze: Object.freeze.methodize(),

	seal: Object.seal.methodize()

});

['slice', 'unshift', 'push', 'append', 'prepend', 'add']
	.from(Array.prototype)
	.enhance(Object);

Boolean.implement({

	isBoolean: true

});

['E', 'PI', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT1_2', 'SQRT2']
	.from(Math)
	.mapKeys(function (key) {
		return key.toLowerCase();
	})
	.into(window);

['random', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2']
	.from(Math)
	.into(window);

['pow', 'abs', 'ceil', 'floor', 'round', 'min', 'max']
	.from(Math)
	.map(function (value) {
		return value.methodize();
	})
	.enhance(Number);

function now() {
	return +new Date;
}

function gcd(a, b) {
	if (! b) return a;
	return gcd(b, a % b);
}

function fibonacci(n) {
	var sqrt5 = sqrt(5);
	return ((1 + sqrt5).pow(n) - (1 - sqrt5).pow(n)) / ((2).pow(n) * sqrt5);
}

function prime(n) {
	if (n < 1) return;
	if (n = 1) return 2;
	// now what?
}

Number.implement({

	isNumber: true,

	toClick: function () {
		return ["left", "middle", "right"][this - 1];
	},

	toHex: function () {
		return this.toString(16);
	},

	toKey: function () {
		return ({
			192: "`", 189: "-", 187: "=", 91: "meta", 40: "down", 39: "right", 38: "up", 
			37: "left", 32: "space", 27: "esc", 20: "capslock", 18: "option",
			17: "control", 16: "shift", 13: "return", 9: "tab", 8: "delete"
		})[this] || String.fromCharCode(this).toLowerCase();
	},

	stop: clearTimeout.methodize(),

	root: function (value) {
		return value.pow(1 / this);
	},

	between: function (min, max) {
		return min < this && this < max;
	},

	clamp: function (min, max) {
		return this.min(max).max(min);
	},

	mod: function (n) {
		return (this % n + n) % n;
	},

	wrap: function (min, max) {
		return min + ((this - min).mod(max - min));
	},

	factorial: function () {
		return this > 0 ? this * (this - 1).factorial() : 1;
	},

	choose: function (k) {
		// number of combinations of k objects without repeats
		return this.factorial() / ((this - k).factorial() * k.factorial())
	},

	multiChoose: function (k) {
		// number of combinations of k objects with repeats
		return (this + k - 1).choose(k);
	},

	powmod: function (x, n) {
		// modular exponentiation
		var a = this, r = 1;
		while (x > 0) {
			if (x % 2 == 1) r = (r * a) % n;
			x /= 2;
			a = (a * a) % n;
		}
		return r;
	}

});

String.implement({

	isString: true,

	$: function () {
		return this.toElement().$();
	},

	toInt: parseInt.methodize(),

	toNumber: parseFloat.methodize(),

	toObject: JSON.parse.methodize(JSON),

	toElement: document.createElement.methodize(document),

	toDashCase: function () {
		return this.replace(/([A-Z])|_(.)/g, function (match, first, second, offset) {
			return (offset > 0 ? '-' : '') + (first || second).toLowerCase();
		});
	},

	toSnakeCase: function () {
		return this.replace(/([A-Z])|-(.)/g, function (match, first, second, offset) {
			return (offset > 0 ? '_' : '') + (first || second).toLowerCase();
		});
	},

	toCamelCase: function () {
		return this.replace(/-(.)|_(.)/g, function (match, first, second, offset) {
			return (first || second).toUpperCase();
		});
	},

	save: function (key) {
		localStorage[key] = '"' + this + '"';
		return this;
	},

	times: function (count) {
		var result = '';
		while (count--) result += this;
		return result;
	},

	colorHexToDec: function () {
		return [
			this.substring(1,3).toInt(16), 
			this.substring(3,5).toInt(16), 
			this.substring(5,7).toInt(16)
		];
	},

	structure: function (pairsDelimeter, pairDelimeter) {
		// convert a key-value string into an object
		var result = {};
		var pairs = this.split(pairsDelimeter);

		if (this == '') return result;

		for (var i = 0, l = pairs.length; i < l; ++i) {
			var pair = pairs[i].split(pairDelimeter);
			result[pair[0]] = pair[1];
		}

		return result;
	},

	callsObject: function (callsDelimeter) {
		var result = {};
		var calls = this.split(callsDelimeter);

		if (this == '') return result;

		for (var i = 0, l = calls.length; i < l; ++i) {
			var call = calls[i].match(/(.*)\((.*)\)/);
			result[call[1]] = call[2];
		}

		return result;
	},

	contains: function (string) {
		return this.indexOf(string) !== -1;
	},

	extract: function (regex) {
		var match = this.match(regex);
		return match ? match[1] : null;
	},

	matches: function (regex) {
		return this.match(regex) != null;
	},

	stem: function () {
		var postfixes = [
			'able', 'ac', 'acity', 'age', 'ate',
			'e', 'ed', 'en',
			'ful', 'fy', 'fier',
			'hood',
			'i?ty', 'ian', 'ic', 'ie', 'ing', 'ious', 'ism', 'ite', 'ive',
			'ling', 'ly',
			'ship', 'sion', 'some',
			'tion', 'tude',
			'ward', 'ware',
			'y'
		];
		return this.extract(new RegExp('(.+)' + postfixes.join('s?|(.+)') + 's?'))
	},

	prefixStyle: function () {
		var style = document.body.style;
		if (style[this] != null) return this;
		if (style['-ms-' + this] != null) return '-ms-' + this;
		if (style['-moz-' + this] != null) return '-moz-' + this;
		if (style['-webkit-' + this] != null) return '-webkit-' + this;
		return this;
	}

});

Element.extend({

	event: function (name) {
		return function (delegation, handler) {
			if (arguments.length == 0) { // event()
				this.dispatchEvent(new CustomEvent(name));
			} else if (arguments.length == 1) {
				if (arguments[0] == false) { // event(false)
					this.addEventListener(name, function (event) {
						event.preventDefault();
						event.cancelBubble = true;
					});
				} else { // event(handler)
					handler = arguments[0];
					this.addEventListener(name, handler);
				}
			} else if (arguments.length == 2) { // event(delegation, handler)
				this.addEventListener(name, function (event) {
					if (event.target.matches(delegation)) {
						return handler(event);
					}
				});
			}

			return this;
		}
	},

	detailedEvent: function (name, listener) {
		return function (detail, delegation, handler) {
			var context = {
				detail: detail,
				delegation: delegation,
				handler: handler
			};

			this.listeners = this.listeners || [];

			if (arguments.length == 0) { // event()
				this.dispatchEvent(new CustomEvent(name, {detail: "*"}));
			} else if (arguments.length == 1) {
				if (arguments[0] == false) { // event(false)
					for (var i = 0; i < this.listeners; ++i) {
						this.removeEventListener(name, this.listeners[i]);
					}
				} else if (arguments[0].isFunction) { // event(handler)
					context.handler = arguments[0];
					context.detail = "*";
					var bound = listener.bind(context);
					this.listeners.push(bound);
					this.addEventListener(name, bound);
				} else { // event(detail)
					this.dispatchEvent(new CustomEvent(name, {detail: detail}));
				}
			} else if (arguments.length == 2) { // event(detail, handler)
				context.handler = arguments[1];
				context.delegation = null;
				var bound = listener.bind(context);
				this.listeners.push(bound);
				this.addEventListener(name, bound);
			} else if (arguments.length == 3) { // event(detail, delegation, handler)
				var bound = listener.bind(context);
				this.listeners.push(bound);
				this.addEventListener(name, bound);
			}

			return this;
		}
	},

	mouseListener: function (event) {
		event.click = event.which ? event.which.toClick() : event.detail;
		
		if (! this.delegation || event.target.matches(this.delegation)) {
			if (this.detail == "*" || this.detail == event.click) return this.handler(event);
		}
	},

	keyListener: function (event) {
		event.key = event.which ? event.which.toKey() : event.detail;

		if (! this.delegation || event.target.matches(this.delegation)) {
			if (this.detail == "*" || this.detail == event.key) return this.handler(event);
		}
	},

	attribute: function (key) {
		return function (value) {
			if (value == null) return this.getAttribute(key);
			this.setAttribute(key, value);
			return this;
		}
	},

	style: function (key) {
		return function (value, time) {
			var style = this.style;

			if (value == null) return style[key];
			if (time != null) this.transition(key, time);

			(function () {
				style[key] = value;
			}).defer();

			return this;
		}
	},

	pxStyle: function (key) {
		return function (value, time) {
			var style = this.style;

			if (value == null) return (style[key] || '0px').toInt();

			if (time != null) {
				this.transition(key, time);
				if (this.style[key] == '') style[key] = '0px';
			}

			(function () {
				style[key] = value.isString ? value : value + 'px';
			}).defer();

			return this;
		}
	},

	transformName: 'transform'.prefixStyle()

});

['touchstart', 'touchend', 'touchstart', 'touchend', 'touchcancel', 'touchleave', 
 'touchmove', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 
 'scroll', 'contextmenu', 'ended', 'progress', 'loadeddata', 'error', 'load',
 'loadedmetadata', 'canplay']
	.from({})
	.map(function (value, key) {
		return Element.event(key);
	})
	.enhance(Element);

['mouseup', 'mousedown']
	.from({})
	.map(function (value, key) {
		return Element.detailedEvent(key, Element.mouseListener);
	})
	.enhance(Element);

['keyup', 'keydown', 'keypress']
	.from({})
	.map(function (value, key) {
		return Element.detailedEvent(key, Element.keyListener);
	})
	.enhance(Element);

['top', 'right', 'bottom', 'left', 'marginTop', 'marginRight', 'marginBottom',
 'marginLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth',
 'borderLeftWidth', 'borderWidth', 'borderRadius', 'paddingTop', 'paddingRight',
 'paddingBottom', 'paddingLeft']
	.from({})
	.map(function (value, key) {
		return Element.pxStyle(key.toDashCase());
	})
	.enhance(Element);

['background', 'backgroundColor', 'display', 'visibility', 'borderTop', 'borderRight', 
 'borderBottom', 'borderLeft', 'position', 'float', 'cursor']
	.from({})
	.map(function (value, key) {
		return Element.style(key.toDashCase());
	})
	.enhance(Element);

Element.implement({

	isElement: true,

	prototype: Element.prototype,

	$: function () {
		return new Query(this);
	},

	drag: function (handler) {
		this.mousemove(function (event) {
			if (window.dragging) handler(event);
		});

		return this;
	},

	start: function (handler) {
		return Element.event('play');
	},

	off: function (name, listener) {
		this.removeEventListener(name, listener);
		return this;
	},

	matches: Element.prototype.matches
		|| Element.prototype.matchesSelector
		|| Element.prototype.msMatchesSelector
		|| Element.prototype.mozMatchesSelector
		|| Element.prototype.webkitMatchesSelector,

	siblings: function (selector) {
		var children = $(this.parentElement).children(selector);
		return children.remove(this);
	},

	next: function (selector) {
		var children = $(this.parentElement).children(selector);
		return children.index(children.indexOf(this) + 1);
	},

	prev: function (selector) {
		var children = $(this.parentElement).children(selector);
		return children.index(children.indexOf(this) - 1);
	},

	closest: function (selector) {
		var element = this;

		while (element && element.matches && ! element.matches(selector)) {
			element = element.parentNode;
		}

		return element;
	},

	find: function (selector) {
		var children = this.children, matches = [];

		for (var i = 0, l = children.length; i < l; ++i) {
			var child = children[i];

			if (child.matches(selector)) matches.push(child);
			matches.add(child.find(selector));
		}

		return new Query(matches);
	},

	tag: function () {
		return this.tagName.toLowerCase();
	},

	has: function (object) {
		if (object.isString) {
			return this.matches(object);
		} else if (object.isElement) {
			return this.contains(object)
		}

		return this;
	},

	attr: function (key, value) {
		if (! value) return this.getAttribute(key);
		this.setAttribute(key, value);
		return this;
	},

	prepend: function (object) {
		this.insertBefore(object, this.firstChild);
		return this;
	},

	prependTo: function (parent) {
		return $(parent)[0].prepend(this);
	},

	append: function (object) {
		this.appendChild(object)
		return this;
	},

	appendTo: function (parent) {
		return $(parent)[0].append(this);
	},

	removeFrom: function (parent) {
		return $(parent)[0].remove(this);
	},

	html: function (markup) {
		this.innerHTML = markup;
		return this;
	},

	addClass: function (string) {
		var classes = this.classes();
		if (classes) this.classes(classes.split(' ').append(string).unique().join(' '));
		else this.classes(string);
		return this;
	},

	removeClass: function (string) {
		var classes = this.classes();
		if (classes) this.classes(classes.split(' ').remove(string).join(' '));
		return this;
	},

	classes: Element.attribute('class'),

	tooltip: Element.attribute('title'),

	src: Element.attribute('src'),

	opacity: function (value, time) {
		if (value == null) return (this.style.opacity || '1').toNumber();
		if (time != null) this.transition('opacity', time);
		this.style.opacity = value;
		return this;
	},

	shadow: Element.style('box-shadow'.prefixStyle()),

	transition: function (key, time) {
		var transitions = this.style['transition'].structure(', ', ' ');

		if (time == null) {
			if (transitions[key] == null) return null;
			return transitions[key].toInt();
		}

		transitions[key] = time + 'ms';
		this.style['transition'] = transitions.destructure(', ', ' ');
		return this;
	},

	transform: function (key, value) {
		var transforms = this.style[Element.transformName].callsObject(' ');
		if (arguments.length == 1) return transforms[key];
		transforms[key] = value;
		this.style[Element.transformName] = transforms.callsString(' ');
		return this;
	},

	x: function (value, time) {
		if (value == null) return (this.transform('translateX') || '0').toInt();
		if (time != null) this.transition(Element.transformName, time);
		this.transform('translateX', value + 'px');
		return this;
	},

	y: function (value, time) {
		if (value == null) return (this.transform('translateY') || '0').toInt();
		if (time != null) this.transition(Element.transformName, time);
		this.transform('translateY', value + 'px');
		return this;
	},

	z: function (value, time) {
		if (value == null) return (this.transform('translateZ') || '0').toInt();
		if (time != null) this.transition(Element.transformName, time);
		this.transform('translateZ', value + 'px');
		return this;
	},

	rotate: function (value, time) {
		if (value == null) return (this.transform('rotate') || '0').toInt();
		if (time != null) this.transition(Element.transformName, time);
		this.transform('rotate', value + 'deg');
		return this;
	},

	layer: Element.style('z-index'),

	borderVertical: function (value) {
		if (arguments.length == 0) return this.borderTop();
		this.borderTop(value), this.borderBottom(value);
		return this;
	},

	borderHorizontal: function (value) {
		if (arguments.length == 0) return this.borderLeft();
		this.borderLeft(value), this.borderRight(value);
		return this;
	},

	border: function (value) {
		if (arguments.length == 0) return this.borderTop();
		this.borderTop(value), this.borderRight(value), this.borderBottom(value), this.borderLeft(value);
		return this;
	},

	borderVerticalWidth: function (value) {
		if (arguments.length == 0) return this.borderTopWidth() + this.borderBottomWidth();
		this.borderTopWidth(value), this.borderBottomWidth(value);
		return this;
	},

	borderHorizontalWidth: function (value) {
		if (arguments.length == 0) return this.borderLeftWidth() + this.borderRightWidth();
		this.borderLeftWidth(value), this.borderRightWidth(value);
		return this;
	},

	paddingVertical: function (value) {
		if (arguments.length == 0) return this.paddingTop() + this.paddingBottom();
		this.paddingTop(value), this.paddingBottom(value);
		return this;
	},

	paddingHorizontal: function (value) {
		if (arguments.length == 0) return this.paddingLeft() + this.paddingRight();
		this.paddingLeft(value), this.paddingRight(value);
		return this;
	},

	padding: function (value) {
		if (arguments.length == 0) return this.paddingTop();
		this.paddingTop(value), this.paddingRight(value), this.paddingBottom(value), this.paddingLeft(value);
		return this;
	},

	width: function (value) {
		if (arguments.length == 0) return this.clientWidth - this.paddingHorizontal();
		if (value.isBoolean) return this.clientWidth + this.borderHorizontalWidth();
		this.style['width'] = value.isString ? value : value + 'px';
		return this;
	},

	height: function (value) {
		if (arguments.length == 0) return this.clientHeight - this.paddingVertical();
		if (value.isBoolean) return this.clientHeight + this.borderVerticalWidth();
		this.style['height'] = value.isString ? value : value + 'px';
		return this;
	},

	centerX: function () {
		return this
			.position('absolute')
			.left('50%')
			.marginLeft(-this.width(true) / 2 | 0);
	},

	centerY: function () {
		return this
			.position('absolute')
			.top('50%')
			.marginTop(-this.height(true) / 2 | 0);
	},

	center: function () {
		return this.centerX().centerY();
	},

	context2d: function () {
		return this.getContext('2d');
	},

	context3d: function () {
		return this.getContext('3d');
	}

});

function $(selector) {
	if (selector.isQuery) return selector;
	if (selector.isFunction) return selector.defer();

	if (selector.isString) {
		var create = selector.extract(/<(.*)>/);
		if (create) return create.$();
	}

	return new Query(selector);
}

function Query(object) {
	if (! object) return;
	if (object.isString) return this.add(document.querySelectorAll(object));
	if (object.isElement) return this.add([object]);
	if (object.isArray) return this.add(object);
}

Query.extend({

	prototype: new Array(),

	invoker: function (key) {
		return function () {
			// call a method on each item in a Query set
			if (arguments.length == 0 && this[0]) return this[0].prototype[key].apply(this[0], []);

			for (var i = 0, l = this.length; i < l; ++i) {
				this[i].prototype[key].apply(this[i], arguments);
			}

			return this;
		}
	},

	transformer: function (key) {
		return function () {
			// call a method on each item in a Query set, returning the results
			var transforms = [];

			for (var transform, i = 0, l = this.length; i < l; ++i) {
				transform = this[i].prototype[key].apply(this[i], arguments);
				transform.isQuery ? transforms.add(transform) : transforms.push(transform);
			}

			return new Query(transforms);
		}
	}

});

['touchstart', 'touchend', 'touchcancel', 'touchleave', 'touchmove', 'drag',
 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'scroll',
 'ended', 'progress', 'loadeddata', 'loadedmetadata', 'canplay', 'start', 'load',
 'mouseup', 'mousedown', 'contextmenu', 'keyup', 'keydown', 'keypress', 'error',
 'width', 'height', 'position', 'top', 'right', 'bottom', 'left', 'attr',
 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 
 'paddingVertical', 'paddingHorizontal', 'paddingRight', 'paddingBottom', 
 'paddingLeft', 'opacity', 'border', 'borderVertical', 'borderHorizontal', 
 'borderTop', 'borderRight', 'borderBottom', 'borderLeft', 'borderTopWidth', 
 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderWidth', 
 'borderRadius', 'center', 'centerX', 'centerY', 'background', 'backgroundColor',
 'classes', 'addClass', 'removeClass', 'html', 'appendTo', 'removeFrom', 
 'prependTo', 'prepend', 'has', 'tag', 'matches', 'src', 'float', 'off',
 'visibility', 'layer', 'rotate', 'x', 'y', 'z', 'transform', 'transition', 
 'tooltip', 'shadow', 'context2d', 'context3d', 'display', 'cursor']
	.from({})
	.map(function (value, key) {
		return Query.invoker(key);
	})
	.enhance(Query);

['closest', 'find', 'next', 'prev', 'siblings']
	.from({})
	.map(function (value, key) {
		return Query.transformer(key);
	})
	.enhance(Query);

Query.implement({

	isQuery: true,

	children: function (selector) {
		var matches = [];

		for (var i = 0, l = this.length; i < l; ++i) {
			var children = this[i].children;

			if (selector) {
				for (var c = 0, cl = children.length; c < cl; ++c) {
					var child = children[c];
					if (child.matches(selector)) matches.push(child);
				}
			} else {
				matches.add(children);
			}
		}

		return new Query(matches);
	}

});

function log() {
	console.log.apply(console, arguments);
}

function warn() {
  console.warn.apply(console, arguments);
}

function error() {
  console.error.apply(console, arguments);
}

function resize(handler) {
	window.addEventListener('resize', handler);
}

resize(function (event) {
  window.width = innerWidth;
  window.height = innerHeight;
});

window.extend({
  html: document.body.parentNode,
  head: document.head,
  body: document.body,
  width: innerWidth,
  height: innerHeight,
  query: location.toString().split('?')[1]
});

window.params = query ? query.structure('&', '=') : null;

$('body').mousedown('left', function () {
  window.dragging = true
});

$('body').mouseup('left', function () {
  window.dragging = false
});

function script(src) {
  $('<script>').attr('src', src).appendTo(head);
}

function xhr(options) {
  var xhr = new XMLHttpRequest();
  var url = options.to;

  if (options.params) url += '?' + options.params.destructure('&', '=');

  options.success && xhr.addEventListener('load', function () {
    log(xhr.status, xhr);
    options.success(xhr.response);
  }, false);

  options.error && xhr.addEventListener('error', function () {
    error(xhr.status, xhr);
    options.error(xhr.response);
  }, false);

  xhr.open(options.method || 'get', url, true);
  xhr.send();
}

function get(url, params, success, error) {
  if (params.isFunction) error = success, success = params, params = null;
  return xhr({
    method: 'get',
    to: url,
    params: params,
    success: success,
    error: error
  });
}

function post(url, params, success, error) {
  if (params.isFunction) error = success, success = params, params = null;
  return xhr({
    method: 'post',
    to: url,
    params: params,
    success: success,
    error: error
  });
}

function put(url, params, success, error) {
  if (params.isFunction) error = success, success = params, params = null;
  return xhr({
    method: 'put',
    to: url,
    params: params,
    success: success,
    error: error
  });
}

function del(url, params, success, error) {
  if (params.isFunction) error = success, success = params, params = null;
  return xhr({
    method: 'delete',
    to: url,
    params: params,
    success: success,
    error: error
  });
}
