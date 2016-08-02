
(function() {

if (!this.Meeko) this.Meeko = {};
if (!this.vendorPrefix) this.vendorPrefix = 'meeko';

}).call(this);

/*!
 JS and Promise utils
 (c) Sean Hogan, 2008,2012,2013,2014,2015
 Mozilla Public License v2.0 (http://mozilla.org/MPL/2.0/)
*/

(function() {

/*
 ### Utility functions
 These might (or might not) be lodash equivalents
 */

var Meeko = this.Meeko;
var stuff = Meeko.stuff = {};

// TODO do string utils needs to sanity check args?
var uc = function(str) { return str ? str.toUpperCase() : ''; }
var lc = function(str) { return str ? str.toLowerCase() : ''; }

function ucFirst(str) {
	return str ? str.charAt(0).toUpperCase() + str.substr(1) : '';
}
function camelCase(str) {
	return str ?
		_.map(str.split('-'), function(part, i) { return i === 0 ? part :
		ucFirst(part); }).join('') : ''; 
}
function kebabCase(str) {
	return str ?
	_.map(str.split(/(?=[A-Z])/), function(part, i) { return i === 0 ? part :
	_.lc(part); }).join('-') : '';
}

var includes = function(a, item) {
	for (var n=a.length, i=0; i<n; i++) if (a[i] === item) return true;
	return false;
}

var forEach = function(a, fn, context) { for (var n=a.length, i=0; i<n; i++) fn.call(context, a[i], i, a); }

var some = function(a, fn, context) { for (var n=a.length, i=0; i<n; i++) { if (fn.call(context, a[i], i, a)) return true; } return false; }

var every = function(a, fn, context) { for (var n=a.length, i=0; i<n; i++) { if (!fn.call(context, a[i], i, a)) return false; } return true; }

var map = function(a, fn, context) {
	var output = [];
	for (var n=a.length, i=0; i<n; i++) {
		var value = a[i];
		output[i] = fn ? 
			fn.call(context, value, i, a) :
			value;
	}
	return output;
}

var filter = function(a, fn, context) {
	var output = [];
	for (var n=a.length, i=0; i<n; i++) {
		var success = fn.call(context, a[i], i, a);
		if (success) output.push(a[i]);
	}
	return output;
}

function _find(a, fn, context, byIndex) {
	for (var n=a.length, i=0; i<n; i++) {
		var item = a[i];
		var success = fn.call(context, item, i, a);
		if (success) return byIndex ? i : item;
	}
	return byIndex ? -1 : undefined;
}

var findIndex = function(a, fn, context) {
	return _find(a, fn, context, true);
}

var find = function(a, fn, context) {
	return _find(a, fn, context, false);
}

var without = function(a1, a2) {
	var result = [];
	forEach(a1, function(item) {
		if (includes(a2, item) || includes(result, item)) return;
		result.push(item);
	});
	return result;
}

var difference = function(a1, a2) {
	var result = [].concat(
		without(a1, a2),
		without(a2, a1)
	);
	return result;
}

var words = function(text) { return text.split(/\s+/); }

var forIn = function(object, fn, context) {
	for (var key in object) {
		fn.call(context, object[key], key, object);
	}
}

var forOwn = function(object, fn, context) {
	var keys = Object.keys(object);
	for (var i=0, n=keys.length; i<n; i++) {
		var key = keys[i];
		fn.call(context, object[key], key, object);
	}
}

var isEmpty = function(o) { // NOTE lodash supports arrays and strings too
	if (o) for (var p in o) if (o.hasOwnProperty(p)) return false;
	return true;
}


var defaults = function(dest, src) {
	forOwn(src, function(val, key, object) {
		if (typeof this[key] !== 'undefined') return;
		this[key] = object[key];
	}, dest);
	return dest;
}

var assign = function(dest, src) {
	forOwn(src, function(val, key, object) {
		this[key] = object[key];
	}, dest);
	return dest;
}


assign(stuff, {
	uc: uc, lc: lc, ucFirst: ucFirst, camelCase: camelCase, kebabCase: kebabCase, words: words, // string
	contains: includes, // FIXME deprecated
	includes: includes, forEach: forEach, some: some, every: every, map: map, filter: filter, find: find, findIndex: findIndex, // array
	without: without, difference: difference,
	forIn: forIn, forOwn: forOwn, isEmpty: isEmpty, defaults: defaults, assign: assign, extend: assign // object
});


}).call(this);

(function() {

var window = this;
var _ = window._ || Meeko.stuff; // WARN this could potentially use underscore.js / lodash.js but HAS NOT BEEN TESTED!!!


/*
 ### Task queuing and isolation
	TODO Only intended for use by Promise. Should this be externally available?
 */

var Task = Meeko.Task = (function() {

// NOTE Task.asap could use window.setImmediate, except for
// IE10 CPU contention bugs http://codeforhire.com/2013/09/21/setimmediate-and-messagechannel-broken-on-internet-explorer-10/

// FIXME record Task statistics

var frameRate = 60; // FIXME make this a boot-option??
var frameInterval = 1000 / frameRate;
var frameExecutionRatio = 0.75; // FIXME another boot-option??
var frameExecutionTimeout = frameInterval * frameExecutionRatio;

var performance = window.performance && window.performance.now ? window.performance :
	Date.now ? Date :
	{
		now: function() { return (new Date).getTime(); }
	};

var schedule = (function() { 
	// See http://creativejs.com/resources/requestanimationframe/
	var fn = window.requestAnimationFrame;
	if (fn) return fn;

	_.some(_.words('moz ms o webkit'), function(vendor) {
		var name = vendor + 'RequestAnimationFrame';
		if (!window[name]) return false;
		fn = window[name];
		return true;
	});
	if (fn) return fn;

	var lastTime = 0;
	var callback;
	fn = function(cb, element) {
		if (callback) throw 'schedule() only allows one callback at a time';
		callback = cb;
		var currTime = performance.now();
		var timeToCall = Math.max(0, frameInterval - (currTime - lastTime));
		var id = window.setTimeout(function() { 
			lastTime = performance.now();
			var cb = callback;
			callback = undefined;
			cb(lastTime, element); 
		}, timeToCall);
		return id;
	};
	
	return fn;
})();


var asapQueue = [];
var deferQueue = [];
var errorQueue = [];
var scheduled = false;
var processing = false;

function asap(fn) {
	asapQueue.push(fn);
	if (processing) return;
	if (scheduled) return;
	schedule(processTasks);
	scheduled = true;
}

function defer(fn) {
	if (processing) {
		deferQueue.push(fn);
		return;
	}
	asap(fn);
}

function delay(fn, timeout) {
	if (timeout <= 0 || timeout == null) {
		defer(fn);
		return;
	}

	setTimeout(function() {
		try { fn(); }
		catch (error) { postError(error); }
		processTasks();
	}, timeout);
}

var execStats = {};
var frameStats = {};

function resetStats() {
	_.forEach([execStats, frameStats], function(stats) {
		_.assign(stats, {
			count: 0,
			totalTime: 0,
			minTime: Infinity,
			maxTime: 0,
			avgTime: 0
		});
	});
}
resetStats();

function updateStats(stats, currTime) {
	stats.count++;
	stats.totalTime += currTime;
	if (currTime < stats.minTime) stats.minTime = currTime;
	if (currTime > stats.maxTime) stats.maxTime = currTime;
}

function getStats() {
	var exec = _.assign({}, execStats);
	var frame = _.assign({}, frameStats);
	exec.avgTime = exec.totalTime / exec.count;
	frame.avgTime = frame.totalTime / frame.count;
	return {
		exec: exec,
		frame: frame
	}
}

var lastStartTime = performance.now();
function getTime(bRemaining) {
	var delta = performance.now() - lastStartTime;
	if (!bRemaining) return delta;
	return frameExecutionTimeout - delta;
}

var idle = true;
function processTasks() {
	var startTime = performance.now();
	if (!idle) updateStats(frameStats, startTime - lastStartTime);
	lastStartTime = startTime;
	processing = true;
	var fn;
	var currTime;
	while (asapQueue.length) {
		fn = asapQueue.shift();
		if (typeof fn !== 'function') continue;
		try { fn(); }
		catch (error) { postError(error); }
		currTime = getTime();
		if (currTime >= frameExecutionTimeout) break;
	}
	scheduled = false;
	processing = false;
	if (currTime) updateStats(execStats, currTime);
	
	asapQueue = asapQueue.concat(deferQueue);
	deferQueue = [];
	if (asapQueue.length) {
		schedule(processTasks);
		scheduled = true;
		idle = false;
	}
	else idle = true;
	
	throwErrors();
	
}

function postError(error) {
	errorQueue.push(error);
}

var throwErrors = (function() {

var evType = vendorPrefix + '-error';
function throwErrors() {
	var handlers = createThrowers(errorQueue);
	_.forEach(handlers, function(handler) {
		window.addEventListener(evType, handler, false);
	});
	var e = document.createEvent('Event');
	e.initEvent(evType, true, true);
	window.dispatchEvent(e);
	_.forEach(handlers, function(handler) {
		window.removeEventListener(evType, handler, false);
	});
	errorQueue = [];
}

function createThrowers(list) {
	return _.map(list, function(error) {
		return function() {
			if (console.logLevel === 'debug') {
				if (error && error.stack) console.debug(error.stack);
				else console.debug('Untraceable error: ' + error); // FIXME why are these occuring??
			}
			throw error;
		};
	});
}

return throwErrors;
})();

return {
	asap: asap,
	defer: defer,
	delay: delay,
	getTime: getTime,
	getStats: getStats,
	resetStats: resetStats,
	postError: postError
};

})(); // END Task


}).call(this);
/*
 ### Promise
 WARN: This was based on early DOM Futures specification. This has been evolved towards ES6 Promises.
 */

(function() {

var window = this;
var _ = window._ || Meeko.stuff; // WARN this could potentially use underscore.js / lodash.js but HAS NOT BEEN TESTED!!!
var Task = Meeko.Task;

var Promise = Meeko.Promise = (function() {

var Promise = function(init) { // `init` is called as init(resolve, reject)
	if (!(this instanceof Promise)) return new Promise(init);
	
	var promise = this;
	promise._initialize();

	try { init(resolve, reject); }
	catch(error) { reject(error); }

	// NOTE promise is returned by `new` invocation but anyway
	return promise;

	// The following are hoisted
	function resolve(result) {
		if (typeof result !== 'function') {
			promise._resolve(result);
			return;
		}
		try { promise._resolve(result()); }
		catch (err) { promise._reject(err); }
	}
	function reject(error) {
		if (typeof error !== 'function') {
			promise._reject(error);
			return;
		}
		try { promise._reject(error()); }
		catch (err) { promise._reject(err); }
	}
}

_.defaults(Promise, {

applyTo: function(object) {
	var resolver = {}
	var promise = new Promise(function(resolve, reject) {
		resolver.resolve = resolve;
		resolver.reject = reject;
	});
	if (!object) object = promise;
	_.assign(object, resolver);
	return promise;
},

isPromise: function(value) {
	return value instanceof Promise;
},

isThenable: function(value) {
	return value != null && typeof value.then === 'function';
}

});

_.defaults(Promise.prototype, {

_initialize: function() {
	var promise = this;
	_.defaults(promise, {
		/* 
			use lazy creation for callback lists - 
			with synchronous inspection they may never be called
		// _fulfilCallbacks: [],
		// _rejectCallbacks: [],
		*/
		isPending: true,
		isFulfilled: false,
		isRejected: false,
		value: undefined,
		reason: undefined,
		_willCatch: false,
		_processing: false
	});
},

/*
See https://github.com/promises-aplus/synchronous-inspection-spec/issues/6 and
https://github.com/petkaantonov/bluebird/blob/master/API.md#synchronous-inspection
*/
inspectState: function() { 
	return this;
},

_fulfil: function(result, sync) { // NOTE equivalent to 'fulfil algorithm'. External calls MUST NOT use sync
	var promise = this;
	if (!promise.isPending) return;
	promise.isPending = false;
	promise.isRejected = false;
	promise.isFulfilled = true;
	promise.value = result;
	promise._requestProcessing(sync);
},

_resolve: function(value, sync) { // NOTE equivalent to 'resolve algorithm'. External calls MUST NOT use sync
	var promise = this;
	if (!promise.isPending) return;
	if (Promise.isPromise(value) && !value.isPending) {
		if (value.isFulfilled) promise._fulfil(value.value, sync);
		else /* if (value.isRejected) */ promise._reject(value.reason, sync);
		return;
	}
	/* else */ if (Promise.isThenable(value)) {
		try {
			value.then(
				function(result) { promise._resolve(result, true); },
				function(error) { promise._reject(error, true); }
			);
		}
		catch(error) {
			promise._reject(error, sync);
		}
		return;
	}
	/* else */ promise._fulfil(value, sync);
},

_reject: function(error, sync) { // NOTE equivalent to 'reject algorithm'. External calls MUST NOT use sync
	var promise = this;
	if (!promise.isPending) return;
	promise.isPending = false;
	promise.isFulfilled = false;
	promise.isRejected = true;
	promise.reason = error;
	if (!promise._willCatch) {
		Task.postError(error);
	}
	else promise._requestProcessing(sync);
},

_requestProcessing: function(sync) { // NOTE schedule callback processing. TODO may want to disable sync option
	var promise = this;
	if (promise.isPending) return;
	if (!promise._willCatch) return;
	if (promise._processing) return;
	if (sync) {
		promise._processing = true;
		promise._process();
		promise._processing = false;
	}
	else {
		Task.asap(function() {
			promise._processing = true;
			promise._process();
			promise._processing = false;
		});
	}
},

_process: function() { // NOTE process a promises callbacks
	var promise = this;
	var result;
	var callbacks, cb;
	if (promise.isFulfilled) {
		result = promise.value;
		callbacks = promise._fulfilCallbacks;
	}
	else {
		result = promise.reason;
		callbacks = promise._rejectCallbacks;
	}

	// NOTE callbacks may not exist
	delete promise._fulfilCallbacks;
	delete promise._rejectCallbacks;
	if (callbacks) while (callbacks.length) {
		cb = callbacks.shift();
		if (typeof cb === 'function') cb(result);
	}
},

then: function(fulfilCallback, rejectCallback) {
	var promise = this;
	return new Promise(function(resolve, reject) {
		var fulfilWrapper = fulfilCallback ?
			wrapResolve(fulfilCallback, resolve, reject) :
			function(value) { resolve(value); }
	
		var rejectWrapper = rejectCallback ? 
			wrapResolve(rejectCallback, resolve, reject) :
			function(error) { reject(error); }
	
		if (!promise._fulfilCallbacks) promise._fulfilCallbacks = [];
		if (!promise._rejectCallbacks) promise._rejectCallbacks = [];
		
		promise._fulfilCallbacks.push(fulfilWrapper);
		promise._rejectCallbacks.push(rejectWrapper);
	
		promise._willCatch = true;
	
		promise._requestProcessing();
		
	});
},

'catch': function(rejectCallback) { // WARN 'catch' is unexpected identifier in IE8-
	var promise = this;
	return promise.then(undefined, rejectCallback);
}

});


/* Functional composition wrapper for `then` */
function wrapResolve(callback, resolve, reject) {
	return function() {
		try {
			var value = callback.apply(undefined, arguments); 
			resolve(value);
		} catch (error) {
			reject(error);
		}
	}
}


_.defaults(Promise, {

resolve: function(value) {
	if (Promise.isPromise(value)) return value;
	var promise = Object.create(Promise.prototype);
	promise._initialize();
	promise._resolve(value);
	return promise;
},

reject: function(error) { // FIXME should never be used
return new Promise(function(resolve, reject) {
	reject(error);
});
}

});


/*
 ### Async functions
   wait(test) waits until test() returns true
   asap(fn) returns a promise which is fulfilled / rejected by fn which is run asap after the current micro-task
   delay(timeout) returns a promise which fulfils after timeout ms
   pipe(startValue, [fn1, fn2, ...]) will call functions sequentially
 */
var wait = (function() { // TODO wait() isn't used much. Can it be simpler?
	
var tests = [];

function wait(fn) {
	var test = { fn: fn };
	var promise = Promise.applyTo(test);
	asapTest(test);
	return promise;
}

function asapTest(test) {
	asap(test.fn)
	.then(function(done) {
		if (done) test.resolve();
		else deferTest(test);
	},
	function(error) {
		test.reject(error);
	});
}

function deferTest(test) {
	var started = tests.length > 0;
	tests.push(test);
	if (!started) Task.defer(poller);
}

function poller() {
	var currentTests = tests;
	tests = [];
	_.forEach(currentTests, asapTest);
}

return wait;

})();

var asap = function(value) { // FIXME asap(fn) should execute immediately
	if (Promise.isPromise(value)) {
		if (value.isPending) return value; // already deferred
		if (Task.getTime(true) <= 0) return value.then(); // will defer
		return value; // not-deferred
	}
	if (Promise.isThenable(value)) return Promise.resolve(value); // will defer
	if (typeof value === 'function') {
		if (Task.getTime(true) <= 0) return Promise.resolve().then(value);
		return new Promise(function(resolve) { resolve(value); }); // WARN relies on Meeko.Promise behavior
	}
	// NOTE otherwise we have a non-thenable, non-function something
	if (Task.getTime(true) <= 0) return Promise.resolve(value).then(); // will defer
	return Promise.resolve(value); // not-deferred
}

var defer = function(value) {
	if (Promise.isPromise(value)) {
		if (value.isPending) return value; // already deferred
		return value.then();
	}
	if (Promise.isThenable(value)) return Promise.resolve(value);
	if (typeof value === 'function') return Promise.resolve().then(value);
	return Promise.resolve(value).then();
}

function delay(timeout) { // FIXME delay(timeout, value_or_fn_or_promise)
	return new Promise(function(resolve, reject) {
		if (timeout <= 0 || timeout == null) Task.defer(resolve);
		else Task.delay(resolve, timeout);
	});
}

function pipe(startValue, fnList) { // TODO make more efficient with sync introspection
	var promise = Promise.resolve(startValue);
	for (var n=fnList.length, i=0; i<n; i++) {
		var fn = fnList[i];
		promise = promise.then(fn);
	}
	return promise;
}

function reduce(accumulator, a, fn, context) {
return new Promise(function(resolve, reject) {
	var length = a.length;
	var i = 0;

	var predictor = new TimeoutPredictor(256, 2);
	process(accumulator);
	return;

	function process(acc) {
		var prevTime;
		var j = 0;
		var timeoutCount = 1;

		while (i < length) {
			if (Promise.isThenable(acc)) {
				if (!Promise.isPromise(acc) || !acc.isFulfilled) { 
					acc.then(process, reject);
					if (j <= 0 || !prevTime || i >= length) return;
					var currTime = Task.getTime(true);
					predictor.update(j, prevTime - currTime);
					return;
				}
				/* else */ acc = acc.value;
			}
			try {
				acc = fn.call(context, acc, a[i], i, a);
				i++; j++;
			}
			catch (error) {
				reject(error);
				return;
			}
			if (i >= length) break;
			if (j < timeoutCount) continue;

			// update timeout counter data
			var currTime = Task.getTime(true); // NOTE *remaining* time
			if (prevTime) predictor.update(j, prevTime - currTime); // NOTE based on *remaining* time
			if (currTime <= 0) {
				// Could use Promise.resolve(acc).then(process, reject)
				// ... but this is considerably quicker
				// FIXME ... although with TimeoutPredictor maybe it doesn't matter
				Task.asap(function() { process(acc); });
				return;
			}
			j = 0;
			timeoutCount = predictor.getTimeoutCount(currTime);
			prevTime = currTime;
		}
		resolve(acc);
	}
});
}

function TimeoutPredictor(max, mult) { // FIXME test args are valid
	if (!(this instanceof TimeoutPredictor)) return new TimeoutPredictor(max, mult);
	var predictor = this;
	_.assign(predictor, {
		count: 0,
		totalTime: 0,
		currLimit: 1,
		absLimit: !max ? 256 : max < 1 ? 1 : max,
		multiplier: !mult ? 2 : mult < 1 ? 1 : mult
	});
}

_.assign(TimeoutPredictor.prototype, {

update: function(count, delta) {
	var predictor = this;
	predictor.count += count;
	predictor.totalTime += delta;
},

getTimeoutCount: function(remainingTime) {
	var predictor = this;
	if (predictor.count <= 0) return 1;
	var avgTime = predictor.totalTime / predictor.count;
	var n = Math.floor( remainingTime / avgTime );
	if (n <= 0) return 1;
	if (n < predictor.currLimit) return n;
	n = predictor.currLimit;
	if (predictor.currLimit >= predictor.absLimit) return n;
	predictor.currLimit = predictor.multiplier * predictor.currLimit;
	if (predictor.currLimit < predictor.absLimit) return n;
	predictor.currLimit = predictor.absLimit;
	// FIXME do methods other than reduce() use TimeoutPredictor??
	console.debug('Promise.reduce() hit absLimit: ', predictor.absLimit);
	return n;
}


});

_.defaults(Promise, {
	asap: asap, defer: defer, delay: delay, wait: wait, pipe: pipe, reduce: reduce
});

return Promise;

})();


}).call(this);




(function() {

var window = this;
var document = window.document;

var Meeko = window.Meeko;
var _ = window._ || Meeko.stuff; // WARN this could potentially use underscore.js / lodash.js but HAS NOT BEEN TESTED!!!

/*
 ### URL utility functions
 */
var URL = Meeko.URL = (function() {

// TODO Ideally Meeko.URL is read-only compatible with DOM4 URL
// NOTE This could use `document.createElement('a').href = url` except DOM is too slow

var URL = function(href, base) {
	if (!(this instanceof URL)) return new URL(href, base);
	var baseURL;
	if (base) baseURL = typeof base === 'string' ? new URL(base) : base;
	init.call(this, href, baseURL);
}

var init = function(href, baseURL) {
	if (baseURL) {
		href = baseURL.resolve(href);
		_.assign(this, new URL(href));
	}
	else {
		var url = parse(href);
		for (var key in url) this[key] = url[key]; // _.assign(this, url);
		enhance(this);
	}
}

var keys = ['source','protocol','hostname','port','pathname','search','hash'];
var parser = /^([^:\/?#]+:)?(?:\/\/([^:\/?#]*)(?::(\d*))?)?([^?#]*)?(\?[^#]*)?(#.*)?$/;

var parse = ((typeof window.URL === 'function') && ('href' in window.URL.prototype)) ? 
function(href) {
	return new window.URL(href);
} :
function(href) {
	href = href.trim();
	var m = parser.exec(href);
	var url = {};
	for (var n=keys.length, i=0; i<n; i++) url[keys[i]] = m[i] || '';
	return url;
}

function enhance(url) {
	url.protocol = _.lc(url.protocol);
	url.supportsResolve = /^(http|https|ftp|file):$/i.test(url.protocol);
	if (!url.supportsResolve) return;
	if (url.hostname) url.hostname = _.lc(url.hostname);
	if (!url.host) {
		url.host = url.hostname;
		if (url.port) url.host += ':' + url.port;
	}
	if (!url.origin) url.origin = url.protocol + '//' + url.host;
	if (!url.pathname) url.pathname = '/';
	var pathParts = url.pathname.split('/'); // creates an array of at least 2 strings with the first string empty: ['', ...]
	pathParts.shift(); // leaves an array of at least 1 string [...]
	url.filename = pathParts.pop(); // filename could be ''
	url.basepath = pathParts.length ? '/' + pathParts.join('/') + '/' : '/'; // either '/rel-path-prepended-by-slash/' or '/'
	url.base = url.origin + url.basepath;
	url.nosearch = url.origin + url.pathname;
	url.nohash = url.nosearch + url.search;
	url.href = url.nohash + url.hash;
	url.toString = function() { return url.href; }
};

URL.prototype.resolve = function resolve(relHref) {
	relHref = relHref.trim();
	if (!this.supportsResolve) return relHref;
	var substr1 = relHref.charAt(0), substr2 = relHref.substr(0,2);
	var absHref =
		/^[a-zA-Z0-9-]+:/.test(relHref) ? relHref :
		substr2 == '//' ? this.protocol + relHref :
		substr1 == '/' ? this.origin + relHref :
		substr1 == '?' ? this.nosearch + relHref :
		substr1 == '#' ? this.nohash + relHref :
		substr1 != '.' ? this.base + relHref :
		substr2 == './' ? this.base + relHref.replace('./', '') :
		(function() {
			var myRel = relHref;
			var myDir = this.basepath;
			while (myRel.substr(0,3) == '../') {
				myRel = myRel.replace('../', '');
				myDir = myDir.replace(/[^\/]+\/$/, '');
			}
			return this.origin + myDir + myRel;
		}).call(this);
	return absHref;
}

var urlAttributes = URL.attributes = (function() {
	
var AttributeDescriptor = function(tagName, attrName, loads, compound) {
	var testEl = document.createElement(tagName);
	var supported = attrName in testEl;
	var lcAttr = _.lc(attrName); // NOTE for longDesc, etc
	_.defaults(this, { // attrDesc
		tagName: tagName,
		attrName: attrName,
		loads: loads,
		compound: compound,
		supported: supported
	});
}

_.defaults(AttributeDescriptor.prototype, {

resolve: function(el, baseURL) {
	var attrName = this.attrName;
	var url = el.getAttribute(attrName);
	if (url == null) return;
	var finalURL = this.resolveURL(url, baseURL)
	if (finalURL !== url) el.setAttribute(attrName, finalURL);
},

resolveURL: function(url, baseURL) {
	var relURL = url.trim();
	var finalURL = relURL;
	switch (relURL.charAt(0)) {
		case '': // empty, but not null. TODO should this be a warning??
			break;
		
		default:
			finalURL = baseURL.resolve(relURL);
			break;
	}
	return finalURL;
}

});

var urlAttributes = {};
_.forEach(_.words('link@<href script@<src img@<longDesc,<src,+srcset iframe@<longDesc,<src object@<data embed@<src video@<poster,<src audio@<src source@<src,+srcset input@formAction,<src button@formAction,<src a@+ping,href area@href q@cite blockquote@cite ins@cite del@cite form@action'), function(text) {
	var m = text.split('@'), tagName = m[0], attrs = m[1];
	var attrList = urlAttributes[tagName] = {};
	_.forEach(attrs.split(','), function(attrName) {
		var downloads = false;
		var compound = false;
		var modifier = attrName.charAt(0);
		switch (modifier) {
		case '<':
			downloads = true;
			attrName = attrName.substr(1);
			break;
		case '+':
			compound = true;
			attrName = attrName.substr(1);
			break;
		}
		attrList[attrName] = new AttributeDescriptor(tagName, attrName, downloads, compound);
	});
});

function resolveSrcset(urlSet, baseURL) {
	var urlList = urlSet.split(/\s*,\s*/); // FIXME this assumes URLs don't contain ','
	_.forEach(urlList, function(urlDesc, i) {
		urlList[i] = urlDesc.replace(/^\s*(\S+)(?=\s|$)/, function(all, url) { return baseURL.resolve(url); });
	});
	return urlList.join(', ');
}

urlAttributes['img']['srcset'].resolveURL = resolveSrcset;
urlAttributes['source']['srcset'].resolveURL = resolveSrcset;

urlAttributes['a']['ping'].resolveURL = function(urlSet, baseURL) {
	var urlList = urlSet.split(/\s+/);
	_.forEach(urlList, function(url, i) {
		urlList[i] = baseURL.resolve(url);
	});
	return urlList.join(' ');
}

return urlAttributes;

})();


return URL;

})();


}).call(this);
/*!
 DOM utils
 (c) Sean Hogan, 2008,2012,2013,2014
 Mozilla Public License v2.0 (http://mozilla.org/MPL/2.0/)
*/

/* NOTE
Requires some features not implemented on older browsers:
element.matchesSelector (or prefixed equivalent) - IE9+
element.querySelectorAll - IE8+
element.addEventListener - IE9+
element.dispatchEvent - IE9+
Object.create - IE9+
*/

(function() {

var window = this;
var document = window.document;

var Meeko = window.Meeko;
var _ = window._ || Meeko.stuff; // WARN this could potentially use underscore.js / lodash.js but HAS NOT BEEN TESTED!!!
var Promise = Meeko.Promise;

/*
 ### DOM utility functions
 */
var DOM = Meeko.DOM = (function() {

// TODO all this node manager stuff assumes that nodes are only released on unload
// This might need revising

// TODO A node-manager API would be useful elsewhere

var nodeIdSuffix = Math.round(Math.random() * 1000000);
var nodeIdProperty = '__' + vendorPrefix + nodeIdSuffix;
var nodeCount = 0; // used to generated node IDs
var nodeTable = []; // list of tagged nodes
var nodeStorage = {}; // hash of storage for nodes, keyed off `nodeIdProperty`

var uniqueId = function(node) {
	var nodeId = node[nodeIdProperty];
	if (nodeId) return nodeId;
	nodeId = '__' + nodeCount++;
	node[nodeIdProperty] = nodeId; // WARN would need `new String(nodeId)` in IE<=8
			// so that node cloning doesn't copy the node ID property
	nodeTable.push(node);
	return nodeId;
}

var setData = function(node, data) { // FIXME assert node is element
	var nodeId = uniqueId(node);
	nodeStorage[nodeId] = data;
}

var hasData = function(node) {
	var nodeId = node[nodeIdProperty];
	return !nodeId ? false : nodeId in nodeStorage;
}

var getData = function(node) { // TODO should this throw if no data?
	var nodeId = node[nodeIdProperty];
	if (!nodeId) return;
	return nodeStorage[nodeId];
}

var releaseNodes = function(callback, context) { // FIXME this is never called
	for (var i=nodeTable.length-1; i>=0; i--) {
		var node = nodeTable[i];
		delete nodeTable[i];
		if (callback) callback.call(context, node);
		var nodeId = node[nodeIdProperty];
		delete nodeStorage[nodeId];
	}
	nodeTable.length = 0;
}

var getTagName = function(el) {
	return el && el.nodeType === 1 ? _.lc(el.tagName) : '';
}


var getTagName = function(el) {
	return el && el.nodeType === 1 ? _.lc(el.tagName) : '';
}

var matchesSelector;

if (document.documentElement.matches) matchesSelector = function(element, selector) {
	return (element && element.nodeType === 1) ? element.matches(selector) : false; 
}
else _.some(_.words('moz webkit ms o'), function(prefix) {
	var method = prefix + 'MatchesSelector';
	if (document.documentElement[method]) {
		matchesSelector = function(element, selector) { return (element && element.nodeType === 1) ? element[method](selector) : false; }
		return true;
	}
	return false;
});


var matches = matchesSelector ?
function(element, selector, scope) {
return scopeify(function(absSelector) {

	return matchesSelector(element, absSelector);

}, selector, scope);
} :
function() { throw Error('matches not supported'); } // NOTE fallback

var closest = matchesSelector ?
function(element, selector, scope) {
return scopeify(function(absSelector) {

	for (var el=element; el && el.nodeType === 1 && el!==scope; el=el.parentNode) {
		if (matchesSelector(el, absSelector)) return el;
	}

}, selector, scope);
} :
function() { throw Error('closest not supported'); } // NOTE fallback

function scopeify(fn, selector, scope) {
	var absSelector = selector;
	if (scope) {
		var uid = uniqueId(scope);
		scope.setAttribute(nodeIdProperty, uid);
		absSelector = absolutizeSelector(selector, scope);
	}

	var result = fn(absSelector);

	if (scope) {
		scope.removeAttribute(nodeIdProperty);
	}

	return result;
}

function absolutizeSelector(selectorGroup, scope) { // WARN does not handle relative selectors that start with sibling selectors
	switch (scope.nodeType) {
	case 1:
		break;
	case 9: case 11:
		// TODO what to do with document / fragment
		return selectorGroup;
	default:
		// TODO should other node types throw??
		return selectorGroup;
	}
	
	var nodeId = uniqueId(scope);
	var scopeSelector = '[' + nodeIdProperty + '=' + nodeId + ']';

	// split on COMMA (,) that is not inside BRACKETS. Technically: not followed by a RHB ')' or ']' unless first followed by LHB '(' or '[' 
	var selectors = selectorGroup.split(/,(?![^\(]*\)|[^\[]*\])/);
	selectors = _.map(selectors, function(s) {
		if (/^:scope\b/.test(s)) return s.replace(/^:scope\b/, scopeSelector);
		else return scopeSelector + ' ' + s;
	});
		
	return selectors.join(', ');
}

var findId = function(id, doc) {
	if (!id) return;
	if (!doc) doc = document;
	if (!doc.getElementById) throw Error('Context for findId() must be a Document node');
	return doc.getElementById(id);
	// WARN would need a work around for broken getElementById in IE <= 7
}

var findAll = document.querySelectorAll ?
function(selector, node, scope, inclusive) {
	if (!node) node = document;
	if (!node.querySelectorAll) return [];
	if (scope && !scope.nodeType) scope = node; // `true` but not the scope element
	return scopeify(function(absSelector) {
		var result = _.map(node.querySelectorAll(absSelector));
		if (inclusive && matchesSelector(node, absSelector)) result.unshift(node);
		return result;
	}, selector, scope);
} :
function() { throw Error('findAll() not supported'); };

var find = document.querySelector ?
function(selector, node, scope, inclusive) {
	if (!node) node = document;
	if (!node.querySelector) return null;
	if (scope && !scope.nodeType) scope = node; // `true` but not the scope element
	return scopeify(function(absSelector) {
		if (inclusive && matchesSelector(node, absSelector)) return node;
		return node.querySelector(absSelector);
	}, selector, scope);
} :
function() { throw Error('find() not supported'); };

var siblings = function(conf, refNode, conf2, refNode2) {
	
	conf = _.lc(conf);
	if (conf2) {
		conf2 = _.lc(conf2);
		if (conf === 'ending' || conf === 'before') throw Error('siblings() startNode looks like stopNode');
		if (conf2 === 'starting' || conf2 === 'after') throw Error('siblings() stopNode looks like startNode');
		if (!refNode2 || refNode2.parentNode !== refNode.parentNode) throw Error('siblings() startNode and stopNode are not siblings');
	}
	
	var nodeList = [];
	if (!refNode || !refNode.parentNode) return nodeList;
	var node, stopNode, first = refNode.parentNode.firstChild;

	switch (conf) {
	case 'starting': node = refNode; break;
	case 'after': node = refNode.nextSibling; break;
	case 'ending': node = first; stopNode = refNode.nextSibling; break;
	case 'before': node = first; stopNode = refNode; break;
	default: throw Error(conf + ' is not a valid configuration in siblings()');
	}
	if (conf2) switch (conf2) {
	case 'ending': stopNode = refNode2.nextSibling; break;
	case 'before': stopNode = refNode2; break;
	}
	
	if (!node) return nodeList; // FIXME is this an error??
	for (;node && node!==stopNode; node=node.nextSibling) nodeList.push(node);
	return nodeList;
}

var contains = // WARN `contains()` means contains-or-isSameNode
document.documentElement.contains && function(node, otherNode) {
	if (node === otherNode) return true;
	if (node.contains) return node.contains(otherNode);
	if (node.documentElement) return node.documentElement.contains(otherNode); // FIXME won't be valid on pseudo-docs
	return false;
} ||
document.documentElement.compareDocumentPosition && function(node, otherNode) { return (node === otherNode) || !!(node.compareDocumentPosition(otherNode) & 16); } ||
function(node, otherNode) { throw Error('contains not supported'); };

function dispatchEvent(target, type, params) { // NOTE every JS initiated event is a custom-event
	if (typeof type === 'object') {
		params = type;
		type = params.type;
	}
	var bubbles = params && 'bubbles' in params ? !!params.bubbles : true;
	var cancelable = params && 'cancelable' in params ? !!params.cancelable : true;
	if (typeof type !== 'string') throw Error('trigger() called with invalid event type');
	var detail = params && params.detail;
	var event = document.createEvent('CustomEvent');
	event.initCustomEvent(type, bubbles, cancelable, detail);
	if (params) _.defaults(event, params);
	return target.dispatchEvent(event);
}

var managedEvents = [];

function manageEvent(type) {
	if (_.includes(managedEvents, type)) return;
	managedEvents.push(type);
	window.addEventListener(type, function(event) {
		// NOTE stopPropagation() prevents custom default-handlers from running. DOMSprockets nullifies it.
		event.stopPropagation = function() { console.warn('event.stopPropagation() is a no-op'); }
		event.stopImmediatePropagation = function() { console.warn('event.stopImmediatePropagation() is a no-op'); }
	}, true);
}

var SUPPORTS_ATTRMODIFIED = (function() {
	var supported = false;
	var div = document.createElement('div');
	div.addEventListener('DOMAttrModified', function(e) { supported = true; }, false);
	div.setAttribute('hidden', '');
	return supported;
})();

// DOM node visibilitychange implementation and monitoring
if (!('hidden' in document.documentElement)) { // implement 'hidden' for older browsers

	var head = document.head;
	// NOTE on <=IE8 this needs a styleSheet work-around
	var style = document.createElement('style');
	
	var cssText = '*[hidden] { display: none; }\n';
	style.textContent = cssText;
	
	head.insertBefore(style, head.firstChild);

	Object.defineProperty(Element.prototype, 'hidden', {
		get: function() { return this.hasAttribute('hidden'); },
		set: function(value) {
			if (!!value) this.setAttribute('hidden', '');
			else this.removeAttribute('hidden');
			
			// IE9 has a reflow bug. The following forces a reflow. FIXME can we stop suporting IE9
			var elementDisplayStyle = this.style.display;
			var computedDisplayStyle = window.getComputedStyle(this, null);
			this.style.display = computedDisplayStyle;
			this.style.display = elementDisplayStyle;
		}
	});
}

if (window.MutationObserver) {

	var observer = new MutationObserver(function(mutations, observer) {
		_.forEach(mutations, function(entry) {
			triggerVisibilityChangeEvent(entry.target);
		});
	});
	observer.observe(document, { attributes: true, attributeFilter: ['hidden'], subtree: true });
	
}
else if (SUPPORTS_ATTRMODIFIED) {
	
	document.addEventListener('DOMAttrModified', function(e) {
		e.stopPropagation();
		if (e.attrName !== 'hidden') return;
		triggerVisibilityChangeEvent(e.target);
	}, true);
	
}
else console.warn('element.visibilitychange event will not be supported');

// FIXME this should use observers, not events
function triggerVisibilityChangeEvent(target) {
	var visibilityState = target.hidden ? 'hidden' : 'visible';
	DOM.dispatchEvent(target, 'visibilitychange', { bubbles: false, cancelable: false, detail: visibilityState }); // NOTE doesn't bubble to avoid clash with same event on document (and also performance)
}

function isVisible(element) {
	var closestHidden = DOM.closest(element, '[hidden]');
	return (!closestHidden);
}


function whenVisible(element) { // FIXME this quite possibly causes leaks if closestHidden is removed from document before removeEventListener
	return new Promise(function(resolve, reject) {	
		var closestHidden = DOM.closest(element, '[hidden]');
		if (!closestHidden) {
			resolve();
			return;
		}
		var listener = function(e) {
			if (e.target.hidden) return;
			closestHidden.removeEventListener('visibilitychange', listener, false);
			whenVisible(element).then(resolve);
		}
		closestHidden.addEventListener('visibilitychange', listener, false);
	});
}


var insertNode = function(conf, refNode, node) { // like imsertAdjacentHTML but with a node and auto-adoption
	var doc = refNode.ownerDocument;
	if (doc.adoptNode) node = doc.adoptNode(node); // Safari 5 was throwing because imported nodes had been added to a document node
	switch(conf) {

	case 'before':
	case 'beforebegin': refNode.parentNode.insertBefore(node, refNode); break;

	case 'after':
	case 'afterend': refNode.parentNode.insertBefore(node, refNode.nextSibling); break;

	case 'start':
	case 'afterbegin': refNode.insertBefore(node, refNode.firstChild); break;

	case 'end':
	case 'beforeend': refNode.appendChild(node); break;

	case 'replace': refNode.parentNode.replaceChild(node, refNode); break;

	case 'empty':
	case 'contents': 
		// TODO DOM.empty(refNode);
		var child;
		while (child = refNode.firstChild) refNode.removeChild(child);
		refNode.appendChild(node);
		break;
	}
	return refNode;
}

var adoptContents = function(parentNode, doc) {
	if (!doc) doc = document;
	var frag = doc.createDocumentFragment();
	var node;
	while (node = parentNode.firstChild) frag.appendChild(doc.adoptNode(node));
	return frag;
}
	
/* 
NOTE:  for more details on how checkStyleSheets() works cross-browser see 
http://aaronheckmann.blogspot.com/2010/01/writing-jquery-plugin-manager-part-1.html
TODO: does this still work when there are errors loading stylesheets??
*/
// TODO would be nice if this didn't need to be polled
// TODO should be able to use <link>.onload, see
// http://stackoverflow.com/a/13610128/108354
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
var checkStyleSheets = function() { 
	// check that every <link rel="stylesheet" type="text/css" /> 
	// has loaded
	return _.every(DOM.findAll('link'), function(node) {
		if (!node.rel || !/^stylesheet$/i.test(node.rel)) return true;
		if (node.type && !/^text\/css$/i.test(node.type)) return true;
		if (node.disabled) return true;
		
		// handle IE
		if (node.readyState) return readyStateLookup[node.readyState];

		var sheet = node.sheet;

		// handle webkit
		if (!sheet) return false;

		try {
			// Firefox should throw if not loaded or cross-domain
			var rules = sheet.rules || sheet.cssRules;
			return true;
		} 
		catch (error) {
			// handle Firefox cross-domain
			switch(error.name) {
			case 'NS_ERROR_DOM_SECURITY_ERR': case 'SecurityError':
				return true;
			case 'NS_ERROR_DOM_INVALID_ACCESS_ERR': case 'InvalidAccessError':
				return false;
			default:
				return true;
			}
		} 
	});
}

// WARN IE <= 8 would need styleText() to get/set <style> contents
// WARN old non-IE would need scriptText() to get/set <script> contents

var copyAttributes = function(node, srcNode) {
	_.forEach(_.map(srcNode.attributes), function(attr) {
		node.setAttribute(attr.name, attr.value); // WARN needs to be more complex for IE <= 7
	});
	return node;
}

var removeAttributes = function(node) {
	_.forEach(_.map(node.attributes), function(attr) {
		node.removeAttribute(attr.name);
	});
	return node;
}

var CREATE_DOCUMENT_COPIES_URL = (function() {
	var doc = document.implementation.createHTMLDocument('');
	return doc.URL === document.URL;
})();

var CLONE_DOCUMENT_COPIES_URL = (function() {
	try {
		var doc = document.cloneNode(false);
		if (doc.URL === document.URL) return true;
	}
	catch (err) { }
	return false;
})();
		
// NOTE we want create*Document() to have a URL
var CREATE_DOCUMENT_WITH_CLONE = !CREATE_DOCUMENT_COPIES_URL && CLONE_DOCUMENT_COPIES_URL;

var createDocument = function(srcDoc) { // modern browsers. IE >= 9
	if (!srcDoc) srcDoc = document;
	// TODO find doctype element??
	var doc;
	if (CREATE_DOCUMENT_WITH_CLONE) { 
		doc = srcDoc.cloneNode(false);
	}
	else {
		doc = srcDoc.implementation.createHTMLDocument('');
		doc.removeChild(doc.documentElement);
	}
	return doc;
}

var createHTMLDocument = function(title, srcDoc) { // modern browsers. IE >= 9
	if (!srcDoc) srcDoc = document;
	// TODO find doctype element??
	var doc;
	if (CREATE_DOCUMENT_WITH_CLONE) { 
		doc = srcDoc.cloneNode(false);
		docEl = doc.createElement('html');
		docEl.innerHTML = '<head><title>' + title + '</title></head><body></body>';
		doc.appendChild(docEl);
	}
	else {
		doc = srcDoc.implementation.createHTMLDocument('');
	}
	return doc;
}

var cloneDocument = function(srcDoc) {
	var doc = DOM.createDocument(srcDoc);
	var docEl = doc.importNode(srcDoc.documentElement, true);
	doc.appendChild(docEl); // NOTE already adopted

	// WARN sometimes IE9/IE10/IE11 doesn't read the content of inserted <style>
	// NOTE this doesn't seem to matter on IE10+. The following is precautionary
	_.forEach(DOM.findAll('style', doc), function(node) {
		var sheet = node.sheet;
		if (!sheet || sheet.cssText == null) return;
		if (sheet.cssText != '') return;
		node.textContent = node.textContent;
	});
	
	return doc;
}

var scrollToId = function(id) { // FIXME this isn't being used
	if (id) {
		var el = DOM.findId(id);
		if (el) el.scrollIntoView(true);
	}
	else window.scroll(0, 0);
}

var readyStateLookup = { // used in domReady() and checkStyleSheets()
	'uninitialized': false,
	'loading': false,
	'interactive': false,
	'loaded': true,
	'complete': true
}

var domReady = (function() { // WARN this assumes that document.readyState is valid or that content is ready...

var readyState = document.readyState;
var loaded = readyState ? readyStateLookup[readyState] : true;
var queue = [];

function domReady(fn) {
	if (typeof fn !== 'function') return;
	queue.push(fn);
	if (loaded) processQueue();
}

function processQueue() {
	_.forEach(queue, function(fn) { setTimeout(fn); });
	queue.length = 0;
}

var events = {
	'DOMContentLoaded': document,
	'load': window
};

if (!loaded) _.forOwn(events, function(node, type) { node.addEventListener(type, onLoaded, false); });

return domReady;

// NOTE the following functions are hoisted
function onLoaded(e) {
	loaded = true;
	_.forOwn(events, function(node, type) { node.removeEventListener(type, onLoaded, false); });
	processQueue();
}

})();

return {
	uniqueIdAttr: nodeIdProperty,
	uniqueId: uniqueId, setData: setData, getData: getData, hasData: hasData, // FIXME releaseNodes
	getTagName: getTagName,
	contains: contains, matches: matches,
	findId: findId, find: find, findAll: findAll, closest: closest, siblings: siblings,
	dispatchEvent: dispatchEvent, manageEvent: manageEvent,
	adoptContents: adoptContents,
	SUPPORTS_ATTRMODIFIED: SUPPORTS_ATTRMODIFIED, 
	isVisible: isVisible, whenVisible: whenVisible,
	insertNode: insertNode, 
	checkStyleSheets: checkStyleSheets,
	copyAttributes: copyAttributes, removeAttributes: removeAttributes, // attrs
	ready: domReady, // events
	createDocument: createDocument, createHTMLDocument: createHTMLDocument, cloneDocument: cloneDocument, // documents
	scrollToId: scrollToId
}

})();


}).call(this);

(function() {

var window = this;
var document = window.document;
var _ = window._ || Meeko.stuff; // WARN this could potentially use underscore.js / lodash.js but HAS NOT BEEN TESTED!!!
var Task = Meeko.Task;

Meeko.controllers = (function() { // TODO should this be under Meeko.sprockets??

return {

values: {},

listeners: {},

create: function(name) {
        this.values[name] = [];
        this.listeners[name] = [];
},

has: function(name) {
        return (name in this.values);
},

get: function(name) { 
        if (!this.has(name)) throw name + ' is not a registered controller';
        return this.values[name];
},

set: function(name, value) {
        if (!this.has(name)) throw name + ' is not a registered controller';
        if (value === false || value == null) value = [];
        else if (typeof value === 'string' || !('length' in value)) value = [ value ];
        var oldValue = this.values[name];
        if (_.difference(value, oldValue).length <= 0) return;
        this.values[name] = value;
        _.forEach(this.listeners[name], function(listener) {
                Task.asap(function() { listener(value); });
        });     
},

listen: function(name, listener) {
        if (!this.has(name)) throw name + ' is not a registered controller';
        this.listeners[name].push(listener);
        var value = this.values[name];
        Task.asap(function() { listener(value) });
}

};

})();


}).call(this);
/*!
 Sprocket
 (c) Sean Hogan, 2008,2012,2013,2014,2016
 Mozilla Public License v2.0 (http://mozilla.org/MPL/2.0/)
*/

/* NOTE
Requires some features not implemented on older browsers:
element.matchesSelector (or prefixed equivalent) - IE9+
element.querySelectorAll - IE8+
element.addEventListener - IE9+
element.dispatchEvent - IE9+
Object.create - IE9+
*/

/* FIXME
- event modifiers aren't filtering
- everything in the sprockets code (apart from the Binding implementation) is a BIG BALL OF MUD
*/

(function() {

var document = window.document;

var Meeko = this.Meeko;
var _ = window._ || Meeko.stuff; // WARN this could potentially use underscore.js / lodash.js but HAS NOT BEEN TESTED!!!
var Task = Meeko.Task;
var Promise = Meeko.Promise;
var DOM = Meeko.DOM;


var sprockets = Meeko.sprockets = (function() {
/* FIXME
	- auto DOM monitoring for node insertion / removal should be a start() option
	- manual control must allow attached, enteredView, leftView lifecycle management
	- binding registration must be blocked after sprockets.start()
*/

var sprockets = {};

var activeListeners = {};

function attachBinding(definition, element) {
	var binding;
	if (DOM.hasData(element)) {
		binding = DOM.getData(element);
		if (binding.definition !== rule.definition) throw Error('Mismatch between definition and binding already present');
		console.warn('Binding definition applied when binding already present');
		return binding;
	}
	binding = new Binding(definition);
	DOM.setData(element, binding);
	binding.attach(element);
	return binding;
}

function enableBinding(element) {
	if (!DOM.hasData(element)) throw Error('No binding attached to element');
	var binding = DOM.getData(element);
	if (!binding.inDocument) binding.enteredDocumentCallback();
}

// TODO disableBinding() ??

function detachBinding(element) {
	if (!DOM.hasData(element)) throw Error('No binding attached to element');
	var binding = DOM.getData(element);
	if (binding.inDocument) binding.leftDocumentCallback();
	binding.detach();
	DOM.setData(element, null);
}


var Binding = function(definition) {
	var binding = this;
	binding.definition = definition;
	binding.object = Object.create(definition.prototype);
	binding.handlers = definition.handlers ? _.map(definition.handlers) : [];
	binding.listeners = [];
	binding.inDocument = null; // TODO state assertions in attach/onenter/leftDocumentCallback/detach
}

_.assign(Binding, {

getInterface: function(element) {
	var nodeData = DOM.getData(element);
	if (nodeData && nodeData.object) return nodeData;
},

enteredDocumentCallback: function(element) {
	var binding = Binding.getInterface(element);
	if (!binding) return;
	binding.enteredDocumentCallback();
},

leftDocumentCallback: function(element) {
	var binding = Binding.getInterface(element);
	if (!binding) return;
	binding.leftDocumentCallback();
},

managedEvents: [],

manageEvent: function(type) {
	if (_.includes(this.managedEvents, type)) return;
	this.managedEvents.push(type);
	window.addEventListener(type, function(event) {
		// NOTE stopPropagation() prevents custom default-handlers from running. DOMSprockets nullifies it.
		event.stopPropagation = function() { console.debug('event.stopPropagation() is a no-op'); }
		event.stopImmediatePropagation = function() { console.debug('event.stopImmediatePropagation() is a no-op'); }
	}, true);
}

});

_.assign(Binding.prototype, {

attach: function(element) {
	var binding = this;
	var definition = binding.definition;
	var object = binding.object;

	object.element = element; 
	binding.attachedCallback();

	_.forEach(binding.handlers, function(handler) {
		var listener = binding.addHandler(handler); // handler might be ignored ...
		if (listener) binding.listeners.push(listener);// ... resulting in an undefined listener
	});
},

attachedCallback: function() {
	var binding = this;
	var definition = binding.definition;
	var object = binding.object;

	binding.inDocument = false;
	if (definition.attached) definition.attached.call(object, binding.handlers); // FIXME try/catch
},

enteredDocumentCallback: function() {
	var binding = this;
	var definition = binding.definition;
	var object = binding.object;

	binding.inDocument = true;
	if (definition.enteredDocument) definition.enteredDocument.call(object);	
},

leftDocumentCallback: function() {
	var binding = this;
	var definition = binding.definition;
	var object = binding.object;

	binding.inDocument = false;
	if (definition.leftDocument) definition.leftDocument.call(object);	
},

detach: function() {
	var binding = this;
	var definition = binding.definition;
	var object = binding.object;

	_.forEach(binding.listeners, binding.removeListener, binding);
	binding.listeners.length = 0;
	
	binding.detachedCallback();
},

detachedCallback: function() {
	var binding = this;
	var definition = binding.definition;
	var object = binding.object;
	
	binding.inDocument = null;
	if (definition.detached) definition.detached.call(object);	
},

addHandler: function(handler) {
	var binding = this;
	var object = binding.object;
	var element = object.element;
	var type = handler.type;
	var capture = (handler.eventPhase == 1); // Event.CAPTURING_PHASE
	if (capture) {
		console.warn('Capture phase for events not supported');
		return; // FIXME should this convert to bubbling instead??
	}

	Binding.manageEvent(type);
	var fn = function(event) {
		if (fn.normalize) event = fn.normalize(event);
		try {
			return handleEvent.call(object, event, handler);
		}
		catch (error) {
			Task.postError(error);
			throw error;
		}
	}
	fn.type = type;
	fn.capture = capture;
	element.addEventListener(type, fn, capture);
	return fn;
},

removeListener: function(fn) {
	var binding = this;
	var object = binding.object;
	var element = object.element;
	var type = fn.type;
	var capture = fn.capture;
	var target = (element === document.documentElement && _.includes(redirectedWindowEvents, type)) ? window : element; 
	target.removeEventListener(type, fn, capture);	
},

});

// WARN polyfill Event#preventDefault
if (!('defaultPrevented' in Event.prototype)) { // NOTE ensure defaultPrevented works
	Event.prototype.defaultPrevented = false;
	Event.prototype._preventDefault = Event.prototype.preventDefault;
	Event.prototype.preventDefault = function() { this.defaultPrevented = true; this._preventDefault(); }
}

function handleEvent(event, handler) {
	var bindingImplementation = this;
	var target = event.target;
	var current = bindingImplementation.element;
	if (!DOM.hasData(current)) throw Error('Handler called on non-bound element');
	if (!matchesEvent(handler, event, true)) return; // NOTE the phase check is below
	var delegator = current;
	if (handler.delegator) {
		var el = DOM.closest(target, handler.delegator, current);
		if (!el) return;
		delegator = el;
	}
	switch (handler.eventPhase) { // FIXME DOMSprockets doesn't intend to support eventPhase
	case 1:
		throw Error('Capture phase for events not supported');
		break;
	case 2:
		if (delegator !== target) return;
		break;
	case 3:
		if (delegator === target) return;
		break;
	default:
		break;
	}

	if (handler.action) {
		var result = handler.action.call(bindingImplementation, event, delegator);
		if (result === false) event.preventDefault();
	}
	return;
}


/*
	TODO: better reporting of invalid content
*/

var convertXBLHandler = function(config) {
	var handler = {}
	handler.type = config.event;
	if (null == config.event) console.warn('Invalid handler: event property undeclared');

	function lookupValue(attrName, lookup) {
		var attrValue = config[attrName];
		var result;
		if (attrValue) {
			result = lookup[attrValue];
			if (null == result) console.info('Ignoring invalid property ' + attrName + ': ' + attrValue);
		}
		return result;
	}

	handler.eventPhase = lookupValue('phase', {
		'capture': 1, // Event.CAPTURING_PHASE,
		'target': 2, // Event.AT_TARGET,
		'bubble': 3, // Event.BUBBLING_PHASE,
		'default-action': 0x78626C44 
	}) || 0;

	handler.preventDefault = lookupValue('default-action', {
		'cancel' : true,
		'perform' : false
	}) || false;

	handler.stopPropagation = lookupValue('propagate', {
		'stop': true,
		'continue': false
	}) || false;
	
	function attrText_to_numArray(attr) {				
		var attrText = config[attr];
		if (!attrText) return null;
		var result = [];
		var strings = attrText.split(/\s+/);
		for (var n=strings.length, i=0; i<n; i++) {
			var text = strings[i];
			var num = Number(text);
			if (NaN != num && Math.floor(num) == num) result.push(num);
		}
		return result;
	}

	// Event Filters: mouse / keyboard / text / mutation / modifiers
	
	// mouse
	handler.button = attrText_to_numArray('button');
	handler.clickCount = attrText_to_numArray('click-count');
	
	// keyboard
	handler.key = config.key;
	handler.keyLocation = [];
	var keyLocationText = config['key-location']
	var keyLocationStrings =  (keyLocationText) ? keyLocationText.split(/\s+/) : [];
	for (var n=keyLocationStrings.length, i=0; i<n; i++) {
		var text = keyLocationStrings[i];
		switch (text) {
			case 'standard': handler.keyLocation.push(KeyboardEvent.DOM_KEY_LOCATION_STANDARD); break;
			case 'left': handler.keyLocation.push(KeyboardEvent.DOM_KEY_LOCATION_LEFT); break;
			case 'right': handler.keyLocation.push(KeyboardEvent.DOM_KEY_LOCATION_RIGHT); break;
			case 'numpad': handler.keyLocation.push(KeyboardEvent.DOM_KEY_LOCATION_NUMPAD); break;
		}
	}

	// text
	handler.text = config.text;
	
	// non-standard
	handler.filter = new RegExp(config.filter, '');
	
	// mutation
	// FIXME not supported anymore
	handler.attrName = config['attr-name'];
	handler.attrChange = [];
	var attrChangeText = config['attr-change'];
	var attrChangeStrings =  (attrChangeText) ? attrChangeText.split(/\s+/) : [];
	for (var n=attrChangeStrings.length, i=0; i<n; i++) {
		var text = attrChangeStrings[i];
		switch (text) {
			case 'modification': handler.attrChange.push(MutationEvent.MODIFICATION); break;
			case 'addition': handler.attrChange.push(MutationEvent.ADDITION); break;
			case 'removal': handler.attrChange.push(MutationEvent.REMOVAL); break;
		}
	}
	handler.prevValue = config['prev-value'];
	handler.newValue = config['new-value'];
	
	// modifiers
	// TODO should handler.modifiers be {} or []?
	if (null != config['modifiers']) {
		handler.modifiers = [];
		var modifiersText = config['modifiers'];
		var modifiersStrings = (modifiersText) ? modifiersText.split(/\s+/) : [];
		for (var n=modifiersStrings, i=0; i<n; i++) {
			var text = modifiersStrings[i];
			var m;
			m = /^([+-]?)([a-z]+)(\??)$/.exec(text);
			if (m) {
				var key = m[2];
				var condition = 1; // MUST
				if (m[3]) condition = 0; // OPTIONAL
				else if (m[1] == '+') condition = 1; // MUST
				else if (m[1] == '-') condition = -1; // MUST NOT
				handler.modifiers.push({ key: key, condition: condition });
			}
		}
	}
	else handler.modifiers = null;
	handler.action = config.action;
	
	return handler;
}

var EventModules = {};
EventModules.AllEvents = {};
registerModule('FocusEvents', 'focus blur focusin focusout');
registerModule('MouseEvents', 'click dblclick mousedown mouseup mouseover mouseout mousemove mousewheel');
registerModule('KeyboardEvents', 'keydown keyup');
registerModule('UIEvents', 'load unload abort error select change submit reset resize scroll');

function registerModule(modName, evTypes) {
	var mod = {};
	EventModules[modName] = mod;
	_.forEach(_.words(evTypes), registerEvent, mod);
}
function registerEvent(evType) {
	EventModules.AllEvents[evType] = true;
	this[evType] = true;
}

var matchesEvent = function(handler, event, ignorePhase) {
	// type
	var xblEvents = EventModules.AllEvents;
	var xblMouseEvents = EventModules.MouseEvents;
	var xblKeyboardEvents = EventModules.KeyboardEvents;
	var xblUIEvents = EventModules.UIEvents;

	if (event.type != handler.type) return false;

	// phase
	if (!ignorePhase && !phaseMatchesEvent(handler.eventPhase, event)) return false;
	
	var evType = event.type;

	// MouseEvents
	if (evType in xblMouseEvents) { // FIXME needs testing. Bound to be cross-platform issues still
		if (handler.button && handler.button.length) {
			if (!_.includes(handler.button, event.button) == -1) return false;
		}
		if (handler.clickCount && handler.clickCount.length) { 
			var count = 1;
			// if ('dblclick' == event.type) count = 2;
			if ('click' == event.type) count = (event.detail) ? event.detail : 1;
			if (!_.includes(handler.clickCount, count)) return false;
		}
		if (handler.modifiers) {
			if (!modifiersMatchEvent(handler.modifiers, event)) return false;
		}
	}

	// KeyboardEvents
	// NOTE some of these are non-standard
	var ourKeyIdentifiers = {
		Backspace: 'U+0008', Delete: 'U+007F', Escape: 'U+001B', Space: 'U+0020', Tab: 'U+0009'
	}

	if (evType in xblKeyboardEvents) {
		if (handler.key) {
			var success = false;
			var keyId = event.keyIdentifier;
			if (/^U\+00....$/.test(keyId)) { // TODO Needed for Safari-2. It would be great if this test could be done elsewhere
				keyId = keyId.replace(/^U\+00/, 'U+');
			}
			if (handler.key != keyId && ourKeyIdentifiers[handler.key] != keyId) return false;
		}

		// TODO key-location		
		if (handler.modifiers || handler.key) {
			if (!modifiersMatchEvent(handler.modifiers || [ 'none' ], event)) return false;
		}
	}

	// UI events
	if (evType in xblUIEvents) { } // TODO
	
	// user-defined events
	if (!(evType in xblEvents)) { } // TODO should these be optionally allowed / prevented??

	return true;
}

var modifiersMatchEvent = function(modifiers, event) {
	// TODO comprehensive modifiers list
	// event.getModifierState() -> evMods
	// Need to account for any positives
	// Fields are set to -1 when accounted for
	var evMods = {
		control: event.ctrlKey,
		shift: event.shiftKey,
		alt: event.altKey,
		meta: event.metaKey
	};

	var evMods_any = event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
	var evMods_none = !evMods_any;

	var any = false;

	if (modifiers)	{
		for (var i=0, n=modifiers.length; i<n; i++) {
			var modifier = modifiers[i];
			switch (modifier.key) {
				case 'none':
					if (evMods_any) return false;
					break;
	
				case 'any':
					any = true;
					break;
	
				default:
					var active = evMods[modifier.key];
					switch (modifier.condition) {
						case -1:
							if (active) return false;
							break;
						case 0:
							if (active) evMods[modifier.key] = -1;
							break;
						case 1:
							if (!active) return false;
							evMods[modifier.key] = -1;
							break;
					}				
			}
		}
	}
	
	if (any) return true;
	
	// Fail if any positive modifiers not accounted for
	for (var key in evMods) {
		if (evMods[key] > 0) return false;
	}
	return true;
}

var isPrototypeOf = {}.isPrototypeOf ?
function(prototype, object) { return prototype.isPrototypeOf(object); } :
function(prototype, object) {
	for (var current=object.__proto__; current; current=current.__proto__) if (current === prototype) return true;
	return false;
};

/* CSS Rules */

function BindingDefinition(desc) {
	_.assign(this, desc);
	if (!this.prototype) {
		if (desc.prototype) this.prototype = desc.prototype;
		else this.prototype = null;
	}
	if (!this.handlers) this.handlers = [];
}

function BindingRule(selector, bindingDefn) {
	this.selector = selector;
	this.definition = bindingDefn;
}


var bindingRules = sprockets.rules = [];

function findAllBindees(root, bExcludeRoot) {
	var selector = _.map(bindingRules, function(rule) { return rule.selector; })
		.join(', ');
	var result = DOM.findAll(selector, root);
	if (!bExcludeRoot && DOM.matches(root, selector)) result.unshift(root);
	return result;
}

var started = false;
var manualDOM = false;

_.assign(sprockets, {

registerElement: function(tagName, defn) { // FIXME test tagName
	if (started) throw Error('sprockets management already started');
	if (defn.rules) console.warn('registerElement() does not support rules. Try registerComposite()');
	var bindingDefn = new BindingDefinition(defn);
	var selector = tagName + ', [is=' + tagName + ']'; // TODO why should @is be supported??
	var rule = new BindingRule(selector, bindingDefn);
	bindingRules.push(rule);
	return rule;
},

start: function(options) {
	if (started) throw Error('sprockets management has already started');
	started = true;
	if (options && options.manual) manualDOM = true;
	nodeInserted(document.body);
	if (!manualDOM) observe(nodeInserted, nodeRemoved);
},

insertNode: function(conf, refNode, node) {
	if (!started) throw Error('sprockets management has not started yet');
	if (!manualDOM) throw Error('Must not use sprockets.insertNode: auto DOM monitoring');
	var doc = refNode.ownerDocument;
	if (doc !== document || !DOM.contains(document, refNode)) throw Error('sprockets.insertNode must insert into `document`');
	if (doc.adoptNode) node = doc.adoptNode(node); // Safari 5 was throwing because imported nodes had been added to a document node
	switch(conf) {
	case 'beforebegin': refNode.parentNode.insertBefore(node, refNode); break;
	case 'afterend': refNode.parentNode.insertBefore(node, refNode.nextSibling); break;
	case 'afterbegin': refNode.insertBefore(node, refNode.firstChild); break;
	case 'beforeend': refNode.appendChild(node); break;
	default: throw Error('Unsupported configuration in sprockets.insertNode: ' + conf);
	// TODO maybe case 'replace' which will call sprockets.removeNode() first
	}
	nodeInserted(node);
	return node;
},

removeNode: function(node) {
	if (!started) throw Error('sprockets management has not started yet');
	if (!manualDOM) throw Error('Must not use sprockets.insertNode: auto DOM monitoring');
	var doc = node.ownerDocument;
	if (doc !== document || !DOM.contains(document, node)) throw Error('sprockets.removeNode must remove from `document`');
	node.parentNode.removeChild(node);
	nodeRemoved(node);
	return node;
}


});

var nodeInserted = function(node) { // NOTE called AFTER node inserted into document
	if (!started) throw Error('sprockets management has not started yet');
	if (node.nodeType !== 1) return;

	var bindees = findAllBindees(node);
	var composites = [];
	_.forEach(bindees, function(el) {
		_.some(bindingRules, function(rule) {
			if (!DOM.matches(el, rule.selector)) return false;
			var binding = attachBinding(rule.definition, el);
			if (binding && binding.rules) composites.push(el);
			return true;
		});
	});

	_.forEach(bindees, function(el) {
		enableBinding(el);
	});


	var composite = sprockets.getComposite(node);
	if (composite) applyCompositedRules(node, composite);

	while (composite = composites.shift()) applyCompositedRules(composite);
	
	return;
		
	function applyCompositedRules(node, composite) {
		if (!composite) composite = node;
		var rules = getRules(composite);
		if (rules.length <= 0) return;

		var walker = createCompositeWalker(node, false); // don't skipRoot
		var el;
		while (el = walker.nextNode()) {
			_.forEach(rules, function(rule) {
				var selector = rule.selector; // FIXME absolutizeSelector??
				if (!DOM.matches(el, selector)) return;
				var binding = attachBinding(rule.definition, el);
				rule.callback.call(binding.object, el);
			});
		}
	}
	
	function getRules(composite) { // buffer uses unshift so LIFO
		var rules = [];
		var binding = DOM.getData(composite);
		_.forEach(binding.rules, function(rule) {
			if (!rule.callback) return;
			var clonedRule = _.assign({}, rule);
			clonedRule.composite = composite;
			rules.unshift(clonedRule);
		});
		return rules;
	}
	
}

var nodeRemoved = function(node) { // NOTE called AFTER node removed document
	if (!started) throw Error('sprockets management has not started yet');
	if (node.nodeType !== 1) return;

	// TODO leftComponentCallback. Might be hard to implement *after* node is removed
	// FIXME the following logic maybe completely wrong
	var nodes = DOM.findAll('*', node);
	nodes.unshift(node);
	_.forEach(nodes, Binding.leftDocumentCallback);
}

// FIXME this auto DOM Monitoring could have horrible performance for DOM sorting operations
// It would be nice to have a list of moved nodes that could potentially be ignored
var observe = (window.MutationObserver) ?
function(onInserted, onRemoved) {
	var observer = new MutationObserver(function(mutations, observer) {
		if (!started) return;
		_.forEach(mutations, function(record) {
			if (record.type !== 'childList') return;
			_.forEach(record.addedNodes, onInserted, sprockets);
			_.forEach(record.removedNodes, onRemoved, sprockets);
		});
	});
	observer.observe(document.body, { childList: true, subtree: true });
	
	// FIXME when to call observer.disconnect() ??
} :
function(onInserted, onRemoved) { // otherwise assume MutationEvents. TODO is this assumption safe?
	document.body.addEventListener('DOMNodeInserted', function(e) {
		e.stopPropagation();
		if (!started) return;
 		// NOTE IE sends event for every descendant of the inserted node
		if (e.target.parentNode !== e.relatedNode) return;
		Task.asap(function() { onInserted(e.target); });
	}, true);
	document.body.addEventListener('DOMNodeRemoved', function(e) {
		e.stopPropagation();
		if (!started) return;
 		// NOTE IE sends event for every descendant of the inserted node
		if (e.target.parentNode !== e.relatedNode) return;
		Task.asap(function() { onRemoved(e.target); });
		// FIXME
	}, true);
};


var SprocketDefinition = function(prototype) {
	var constructor = function(element) {
		return sprockets.cast(element, constructor);
	}
	constructor.prototype = prototype;
	return constructor;
}


_.assign(sprockets, {

registerSprocket: function(selector, definition, callback) { // WARN this can promote any element into a composite
	var rule = {};
	var composite;
	if (typeof selector === 'string') {
		_.assign(rule, {
			selector: selector
		});
		composite = document;
	}
	else {
		_.assign(rule, selector);
		composite = selector.composite;
		delete rule.composite;
	}
	var nodeData = DOM.getData(composite); // NOTE nodeData should always be a binding
	if (!nodeData) {
		nodeData = {};
		DOM.setData(composite, nodeData);
	}
	var nodeRules = nodeData.rules;
	if (!nodeRules) nodeRules = nodeData.rules = [];
	rule.definition = definition;
	rule.callback = callback;
	nodeRules.unshift(rule); // WARN last registered means highest priority. Is this appropriate??
},

register: function(options, sprocket) {
	return sprockets.registerSprocket(options, sprocket);
},

registerComposite: function(tagName, definition) {
	var defn = _.assign({}, definition);
	var rules = defn.rules;
	delete defn.rules;
	if (!rules) console.warn('registerComposite() called without any sprocket rules. Try registerElement()');
	var onattached = defn.attached;
	defn.attached = function() {
		var object = this;
		if (rules) _.forEach(rules, function(rule) {
			var selector = {
				composite: object.element
			}
			var definition = {};
			var callback;
			if (Array.isArray(rule)) {
				selector.selector = rule[0];
				definition = rule[1];
				callback = rule[2];
			}
			else {
				selector.selector = rule.selector;
				definition = rule.definition;
				callback = rule.callback;
			}
			sprockets.registerSprocket(selector, definition, callback);
		});
		if (onattached) return onattached.call(this);
	};
	return sprockets.registerElement(tagName, defn);
},

registerComponent: function(tagName, sprocket, extras) {
	var defn = { prototype: sprocket.prototype };
	if (extras) {
		defn.handlers = extras.handlers;
		if (extras.sprockets) _.forEach(extras.sprockets, function(oldRule) {
			if (!defn.rules) defn.rules = [];
			var rule = {
				selector: oldRule.matches,
				definition: oldRule.sprocket,
				callback: oldRule.enteredComponent
			}
			defn.rules.push(rule);
		});
		if (extras.callbacks) _.defaults(defn, extras.callbacks);
	}
	if (defn.rules) return sprockets.registerComposite(tagName, defn);
	else return sprockets.registerElement(tagName, defn);
},

evolve: function(base, properties) {
	var prototype = Object.create(base.prototype);
	var sub = new SprocketDefinition(prototype);
	var baseProperties = base.prototype.__properties__ || {};
	var subProperties = prototype.__properties__ = {};
	_.forOwn(baseProperties, function(desc, name) {
		subProperties[name] = Object.create(desc);
	});
	if (properties) sprockets.defineProperties(sub, properties);
	return sub;
},

defineProperties: function(sprocket, properties) {
	var prototype = sprocket.prototype;
	var definition = prototype.__properties__ || (prototype.__properties__ = {});
	_.forOwn(properties, function(desc, name) {
		switch (typeof desc) {
		case 'object':
			var propDesc = definition[name] || (definition[name] = {});
			_.assign(propDesc, desc);
			Object.defineProperty(prototype, name, {
				get: function() { throw Error('Attempt to get an ARIA property'); },
				set: function() { throw Error('Attempt to set an ARIA property'); }
			});
			break;
		default:
			prototype[name] = desc;
			break;
		}
	});
},

getPropertyDescriptor: function(sprocket, prop) {
	return sprocket.prototype.__properties__[prop];
},

_matches: function(element, sprocket, rule) { // internal utility method which is passed a "cached" rule
	var binding = Binding.getInterface(element);
	if (binding) return prototypeMatchesSprocket(binding.object, sprocket);
	if (rule && DOM.matches(element, rule.selector)) return true; // TODO should make rules scoped by rule.composite
	return false;
},

matches: function(element, sprocket, inComposite) {
	var composite;
	if (inComposite) {
		composite = sprockets.getComposite(element);
		if (!composite) return false;
	}
	var rule = getMatchingSprocketRule(element.parentNode, sprocket, inComposite);
	return sprockets._matches(element, sprocket, rule);
},

closest: function(element, sprocket, inComposite) {
	var composite;
	if (inComposite) {
		composite = sprockets.getComposite(element);
		if (!composite) return;
	}
	var rule = getMatchingSprocketRule(element.parentNode, sprocket, inComposite);
	for (var node=element; node && node.nodeType === 1; node=node.parentNode) {
		if (sprockets._matches(node, sprocket, rule)) return node;
		if (node === composite) return;
	}
},

findAll: function(element, sprocket) { // FIXME this search is blocked by descendant composites (scopes). Is this appropriate?
	var nodeList = [];
	var rule = getMatchingSprocketRule(element, sprocket);
	if (!rule) return nodeList;
	var walker = createCompositeWalker(element, true); // skipRoot
	
	var node;
	while (node = walker.nextNode()) {
		if (DOM.matches(node, rule.selector)) nodeList.push(node);
	}
	return nodeList;
},

find: function(element, sprocket) { // FIXME this search is blocked by descendant composites (scopes). Is this appropriate?
	var rule = getMatchingSprocketRule(element, sprocket);
	if (!rule) return null;
	var walker = createCompositeWalker(element, true); // skipRoot
	
	var node;
	while (node = walker.nextNode()) {
		if (DOM.matches(node, rule.selector)) return node;
	}
	return null;
},

cast: function(element, sprocket) {
	var object = sprockets.getInterface(element);
	if (prototypeMatchesSprocket(object, sprocket)) return object;
	throw Error('Attached sprocket is not compatible');
},

getInterface: function(element) {
	var binding = Binding.getInterface(element);
	if (binding) return binding.object;
	var rule = getSprocketRule(element);
	if (!rule) 	throw Error('No sprocket declared'); // WARN should never happen - should be a universal fallback
	var binding = attachBinding(rule.definition, element);
	return binding.object;
},

isComposite: function(node) {
	if (!DOM.hasData(node)) return false;
	var nodeData = DOM.getData(node);
	if (!nodeData.rules) return false;
	return true;
},

getComposite: function(element) { // WARN this can return `document`. Not sure if that should count
	for (var node=element; node; node=node.parentNode) {
		if (sprockets.isComposite(node)) return node;
	}
}

});

function getSprocketRule(element) {
	var sprocketRule;
	var composite = sprockets.getComposite(element);
	sprocketRule = getRuleFromComposite(composite, element);
	if (sprocketRule) return sprocketRule;
	return getRuleFromComposite(document, element);
}

function getRuleFromComposite(composite, element) {
	var sprocketRule;
	var nodeData = DOM.getData(composite);
	_.some(nodeData.rules, function(rule) {
		if (!DOM.matches(element, rule.selector)) return false; // TODO should be using relative selector
		sprocketRule = { composite: composite };
		_.defaults(sprocketRule, rule);
		return true;
	});
	if (sprocketRule) return sprocketRule;
}

function getMatchingSprocketRule(element, sprocket, inComposite) {
	var sprocketRule;
	var composite = sprockets.getComposite(element);
	sprocketRule = getMatchingRuleFromComposite(composite, sprocket);
	if (inComposite || sprocketRule) return sprocketRule;
	return getMatchingRuleFromComposite(document, sprocket);
}

function getMatchingRuleFromComposite(composite, sprocket) {
	var sprocketRule;
	var nodeData = DOM.getData(composite);
	_.some(nodeData.rules, function(rule) {
		if (typeof sprocket === 'string') {
			if (rule.definition.prototype.role !== sprocket) return false;
		}
		else {
			if (sprocket.prototype !== rule.definition.prototype && !isPrototypeOf(sprocket.prototype, rule.definition.prototype)) return false;
		}
		sprocketRule = { composite: composite };
		_.defaults(sprocketRule, rule);
		return true;
	});
	return sprocketRule;
}

function prototypeMatchesSprocket(prototype, sprocket) {
	if (typeof sprocket === 'string') return (prototype.role === sprocket);
	else return (sprocket.prototype === prototype || isPrototypeOf(sprocket.prototype, prototype));
}

function createCompositeWalker(root, skipRoot) {
	return document.createNodeIterator(
			root,
			1,
			acceptNode,
			null // IE9 throws if this irrelavent argument isn't passed
		);
	
	function acceptNode(el) {
		 return (skipRoot && el === root) ? NodeFilter.FILTER_SKIP : sprockets.isComposite(el) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; 
	}
}

var basePrototype = {};
sprockets.Base = new SprocketDefinition(basePrototype); // NOTE now we can extend basePrototype

return sprockets;

})(); // END sprockets


/* Extend BaseSprocket.prototype */
(function() {

var _ = Meeko.stuff;
var DOM = Meeko.DOM;
var sprockets = Meeko.sprockets, Base = sprockets.Base;


_.assign(Base.prototype, {

find: function(selector, scope) { return DOM.find(selector, this.element, scope); },
findAll: function(selector, scope) { return DOM.findAll(selector, this.element, scope); },
matches: function(selector, scope) { return DOM.matches(this.element, selector, scope); },
closest: function(selector, scope) { return DOM.closest(this.element, selector, scope); },

contains: function(otherNode) { return DOM.contains(this.element, otherNode); },

attr: function(name, value) {
	var element = this.element;
	if (typeof value === 'undefined') return element.getAttribute(name);
	if (value == null) element.removeAttribute(name);
	else element.setAttribute(name, value);
},
hasClass: function(token) {
	var element = this.element;
	var text = element.getAttribute('class');
	if (!text) return false;
	return _.includes(_.words(text), token);
},
addClass: function(token) {
	var element = this.element;
	var text = element.getAttribute('class');
	if (!text) {
		element.setAttribute('class', token);
		return;
	}
	if (_.includes(_.words(text), token)) return;
	var n = text.length,
		space = (n && text.charAt(n-1) !== ' ') ? ' ' : '';
	text += space + token;
	element.setAttribute('class', text);
},
removeClass: function(token) {
	var element = this.element;
	var text = element.getAttribute('class');
	if (!text) return;
	var prev = _.words(text);
	var next = [];
	_.forEach(prev, function(str) { if (str !== token) next.push(str); });
	if (prev.length === next.length) return;
	element.setAttribute('class', next.join(' '));
},
toggleClass: function(token, force) {
	var found = this.hasClass(token);
	if (found) {
		if (force) return true;
		this.removeClass(token);
		return false;
	}
	else {
		if (force === false) return false;
		this.addClass(token);
		return true;
	}
},
css: function(name, value) {
	var element = this.element;
	var isKebabCase = (name.indexOf('-') >= 0);
	if (typeof value === 'undefined') return isKebabCase ? element.style.getPropertyValue(name) : element.style[name];
	if (value == null || value === '') {
		if (isKebabCase) element.style.removeProperty(name);
		else element.style[name] = '';
	}
	else {
		if (isKebabCase) element.style.setProperty(name, value);
		else element.style[name] = value;
	}
},

trigger: function(type, params) {
	return DOM.dispatchEvent(this.element, type, params);
}


});

// Element.prototype.hidden and visibilitychange event
var Element = window.Element || window.HTMLElement;

Object.defineProperty(Element.prototype, '$', {
	get: function() { return sprockets.getInterface(this); }
});

})();

(function() {

var _ = Meeko.stuff;
var DOM = Meeko.DOM;
var sprockets = Meeko.sprockets, Base = sprockets.Base;

var ariaProperties = { // TODO this lookup is only for default values
	hidden: false,
	selected: false,
	expanded: true
}

var ARIA = sprockets.evolve(Base, {

role: 'roletype',

aria: function(name, value) {
	var element = this.element;
	var defn = ariaProperties[name];
	if (defn == null) throw Error('No such aria property: ' + name);

	if (name === 'hidden') {
		if (typeof value === 'undefined') return element.hasAttribute('hidden');
		if (!value) element.removeAttribute('hidden');
		else element.setAttribute('hidden', '');
		return;
	}
	
	var ariaName = 'aria-' + name;
	var type = typeof defn;
	if (typeof value === 'undefined') {
		var result = element.getAttribute(ariaName);
		switch(type) {
		case 'string': default: return result;
		case 'boolean': return result === 'false' ? false : result == null ? undefined : true;
		}
	}
	if (value == null) element.removeAttribute(ariaName);
	else switch(type) {
		case 'string': default:
			element.setAttribute(ariaName, value);
			break;
		case 'boolean':
			var bool = value === 'false' ? 'false' : value === false ? 'false' : 'true';
			element.setAttribute(ariaName, bool);
			break;
	}
},

ariaCan: function(name, value) {
	var desc = this.__properties__[name];
	if (!desc) throw Error('Property not defined: ' + name);
	if (desc.type !== 'boolean' || desc.can && !desc.can.call(this)) return false;
	return true;
},

ariaToggle: function(name, value) {
	var desc = this.__properties__[name];
	if (!desc) throw Error('Property not defined: ' + name);
	if (desc.type !== 'boolean' || desc.can && !desc.can.call(this)) throw Error('Property can not toggle: ' + name);
	var oldValue = desc.get.call(this);
	
	if (typeof value === 'undefined') desc.set.call(this, !oldValue);
	else desc.set.call(this, !!value);
	return oldValue;
},

ariaGet: function(name) {
	var desc = this.__properties__[name];
	if (!desc) throw Error('Property not defined: ' + name);
	return desc.get.call(this); // TODO type and error handling
},

ariaSet: function(name, value) {
	var desc = this.__properties__[name];
	if (!desc) throw Error('Property not defined: ' + name);
	return desc.set.call(this, value); // TODO type and error handling
}

});

var RoleType = sprockets.evolve(ARIA, {

hidden: {
	type: 'boolean',
	can: function() { return true; },
	get: function() { return this.aria('hidden'); },
	set: function(value) { this.aria('hidden', !!value); }
}

});

sprockets.ARIA = ARIA;
sprockets.RoleType = RoleType;
sprockets.register('*', RoleType);

var Element = window.Element || window.HTMLElement;

_.defaults(Element.prototype, { // NOTE this assumes that the declared sprocket for every element is derived from ARIA

aria: function(prop, value) {
	return this.$.aria(prop, value);
},

ariaCan: function(prop) {
	return this.$.ariaCan(prop);
},

ariaToggle: function(prop, value) {
	return this.$.ariaToggle(prop, value);
},

ariaGet: function(prop) {
	return this.$.ariaGet(prop);
},

ariaSet: function(prop, value) {
	return this.$.ariaSet(prop, value);
},

ariaFind: function(role) {
	return sprockets.find(this, role);
},

ariaFindAll: function(role) {
	return sprockets.findAll(this, role);	
},

ariaClosest: function(role) {
	return sprockets.closest(this, role);
},

ariaMatches: function(role) {
	return sprockets.matches(this, role);
}
	
});


})();


}).call(this);
/*!
 * scriptQueue
 * Copyright 2009-2016 Sean Hogan (http://meekostuff.net/)
 * Mozilla Public License v2.0 (http://mozilla.org/MPL/2.0/)
 */

(function(classnamespace) {

var window = this;
var document = window.document;

var Meeko = this.Meeko;
var _ = Meeko.stuff;
var Promise = Meeko.Promise;
var DOM = Meeko.DOM;

/*
 WARN: This description comment was from the former scriptQueue implementation.
 It is still a correct description of behavior,
 but doesn't give a great insight into the current Promises-based implementation.
 
 We want <script>s to execute in document order (unless @async present)
 but also want <script src>s to download in parallel.
 The script queue inserts scripts until it is paused on a blocking script.
 The onload (or equivalent) or onerror handlers of the blocking script restart the queue.
 Inline <script> and <script src="..." async> are never blocking.
 Sync <script src> are blocking, but if `script.async=false` is supported by the browser
 then only the last <script src> (in a series of sync scripts) needs to pause the queue. See
	http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order#My_Solution
 Script preloading is always initiated, even if the browser doesn't support it. See
	http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order#readyState_.22preloading.22
	
 FIXME scriptQueue.push should also accept functions
*/
var queue = [],
	emptying = false;

var testScript = document.createElement('script'),
	supportsSync = (testScript.async === true);

var scriptQueue = {

push: function(node) {
return new Promise(function(resolve, reject) {
	if (emptying) throw Error('Attempt to append script to scriptQueue while emptying');
	
	// TODO assert node is in document

	// TODO this filtering may need reworking now we don't support older browsers
	if (!node.type || /^text\/javascript$/i.test(node.type)) {
		console.info('Attempt to queue already executed script ' + node.src);
		resolve(); // TODO should this be reject() ??
		return;
	}

	if (!/^text\/javascript\?disabled$/i.test(node.type)) {
		console.info('Unsupported script-type ' + node.type);
		resolve(); // TODO should this be reject() ??
		return;
	}

	var script = document.createElement('script');

	if (node.src) addListeners(); // WARN must use `node.src` because attrs not copied to `script` yet
	
	DOM.copyAttributes(script, node); 
	script.text = node.text;

	if (script.getAttribute('defer')) { // @defer is not appropriate. Implement as @async
		script.removeAttribute('defer');
		script.setAttribute('async', '');
		console.warn('@defer not supported on scripts');
	}
	if (supportsSync && script.src && !script.hasAttribute('async')) script.async = false;
	script.type = 'text/javascript';
	
	// enabledFu resolves after script is inserted
	var enabledFu = Promise.applyTo(); 
	
	var prev = queue[queue.length - 1], prevScript = prev && prev.script;

	var triggerFu; // triggerFu allows this script to be enabled, i.e. inserted
	if (prev) {
		if (prevScript.hasAttribute('async') || script.src && supportsSync && !script.hasAttribute('async')) triggerFu = prev.enabled;
		else triggerFu = prev.complete; 
	}
	else triggerFu = Promise.resolve();
	
	triggerFu.then(enable, enable);

	var completeFu = Promise.applyTo();
	completeFu.then(resolve, reject);

	var current = { script: script, complete: completeFu, enabled: enabledFu };
	queue.push(current);
	return;

	// The following are hoisted
	function enable() {
		DOM.insertNode('replace', node, script);
		enabledFu.resolve(); 
		if (!script.src) {
			spliceItem(queue, current);
			completeFu.resolve();
		}
	}
	
	function onLoad(e) {
		removeListeners();
		spliceItem(queue, current);
		completeFu.resolve();
	}

	function onError(e) {
		removeListeners();
		spliceItem(queue, current);
		completeFu.reject(function() { throw Error('Script loading failed'); }); // FIXME throw NetworkError()
	}

	function addListeners() {
		script.addEventListener('load', onLoad, false);
		script.addEventListener('error', onError, false);
	}
	
	function removeListeners() {
		script.removeEventListener('load', onLoad, false);
		script.removeEventListener('error', onError, false);
	}
	
	function spliceItem(a, item) {
		for (var n=a.length, i=0; i<n; i++) {
			if (a[i] !== item) continue;
			a.splice(i, 1);
			return;
		}
	}

});
},

empty: function() {
return new Promise(function(resolve, reject) {
	
	emptying = true;
	if (queue.length <= 0) {
		emptying = false;
		resolve();
		return;
	}
	_.forEach(queue, function(value, i) {
		var acceptCallback = function() {
			if (queue.length <= 0) {
				emptying = false;
				resolve();
			}
		}
		value.complete.then(acceptCallback, acceptCallback);
	});

});
}

} // end scriptQueue

classnamespace.scriptQueue = scriptQueue;

}).call(this, this.Meeko);


(function() {

var window = this;
var Meeko = window.Meeko;
var _ = Meeko.stuff;
var URL = Meeko.URL;
var DOM = Meeko.DOM;
var Promise = Meeko.Promise;

/*
	HTML_IN_DOMPARSER indicates if DOMParser supports 'text/html' parsing. Historically only Firefox did.
	Cross-browser support coming? https://developer.mozilla.org/en-US/docs/Web/API/DOMParser#Browser_compatibility
*/
var HTML_IN_DOMPARSER = (function() {

	try {
		var doc = (new DOMParser).parseFromString('', 'text/html');
		return !!doc;
	}
	catch(err) { return false; }

})();


/*
	normalize() is called between html-parsing (internal) and document normalising (external function).
	It is called after using the native parser:
	- with DOMParser#parseFromString(), see htmlParser#nativeParser()
	- with XMLHttpRequest & xhr.responseType='document', see httpProxy's request()
	The innerHTMLParser also uses this call
*/
function normalize(doc, details) { 

	var baseURL = URL(details.url);

	_.forEach(DOM.findAll('style', doc.body), function(node) {
		if (node.hasAttribute('scoped')) return; // ignore
		doc.head.appendChild(node); // NOTE no adoption
	});
	
	_.forEach(DOM.findAll('style', doc), function(node) {
		// TODO the following rewrites url() property values but isn't robust
		var text = node.textContent;
		var replacements = 0;
		text = text.replace(/\burl\(\s*(['"]?)([^\r\n]*)\1\s*\)/ig, function(match, quote, url) {
				absURL = baseURL.resolve(url);
				if (absURL === url) return match;
				replacements++;
				return "url(" + quote + absURL + quote + ")";
			});
		if (replacements) node.textContent = text;
	});

	return resolveAll(doc, baseURL, false);
}

/*
	resolveAll() resolves all URL attributes
*/
var urlAttributes = URL.attributes;

var resolveAll = function(doc, baseURL) {

	return Promise.pipe(null, [

	function () {
		var selector = Object.keys(urlAttributes).join(', ');
		return DOM.findAll(selector, doc);
	},

	function(nodeList) {
		return Promise.reduce(null, nodeList, function(dummy, el) {
			var tag = DOM.getTagName(el);
			var attrList = urlAttributes[tag];
			_.forOwn(attrList, function(attrDesc, attrName) {
				if (!el.hasAttribute(attrName)) return;
				attrDesc.resolve(el, baseURL);
			});
		});
	},

	function() {
		return doc;
	}

	]);

}



var htmlParser = Meeko.htmlParser = (function() {

function nativeParser(html, details) {

	return Promise.pipe(null, [
		
	function() {
		var doc = (new DOMParser).parseFromString(html, 'text/html');
		return normalize(doc, details);
	}
	
	]);

}

function innerHTMLParser(html, details) {
	return Promise.pipe(null, [
		
	function() {
		var doc = DOM.createHTMLDocument('');
		var docElement = doc.documentElement;
		docElement.innerHTML = html;
		var m = html.match(/<html(?=\s|>)(?:[^>]*)>/i); // WARN this assumes there are no comments containing '<html' and no attributes containing '>'.
		var div = document.createElement('div');
		div.innerHTML = m[0].replace(/^<html/i, '<div');
		var htmlElement = div.firstChild;
		DOM.copyAttributes(docElement, htmlElement);
		return doc;
	},
	
	function(doc) {
		return normalize(doc, details);
	}
	
	]);
}


return {
	HTML_IN_DOMPARSER: HTML_IN_DOMPARSER,
	parse: HTML_IN_DOMPARSER ? nativeParser : innerHTMLParser,
	normalize: normalize
}

})();



}).call(this);
(function() {

var window = this;
var Meeko = window.Meeko;
var _ = Meeko.stuff;
var URL = Meeko.URL;
var DOM = Meeko.DOM;
var Promise = Meeko.Promise;
var htmlParser = Meeko.htmlParser;

/*
	HTML_IN_XHR indicates if XMLHttpRequest supports HTML parsing
*/
var HTML_IN_XHR = (function() { // FIXME more testing, especially Webkit
	if (!window.XMLHttpRequest) return false;
	var xhr = new XMLHttpRequest;
	if (!('responseType' in xhr)) return false;
	if (!('response' in xhr)) return false;
	xhr.open('get', document.URL, true);

	try { xhr.responseType = 'document'; } // not sure if any browser throws for this, but they should
	catch (err) { return false; }

	try { if (xhr.responseText == '') return false; } // Opera-12. Other browsers will throw
	catch(err) { }

	try { if (xhr.status) return false; } // this should be 0 but throws on Chrome and Safari-5.1
	catch(err) { // Chrome and Safari-5.1
		xhr.abort(); 
		try { xhr.responseType = 'document'; } // throws on Safari-5.1 which doesn't support HTML requests 
		catch(err2) { return false; }
	}

	return true;
})();


var httpProxy = Meeko.httpProxy = (function() {

var methods = _.words('get'); // TODO words('get post put delete');
var responseTypes = _.words('document'); // TODO words('document json text');
var defaultInfo = {
	method: 'get',
	responseType: 'document'
}

// NOTE cache, etc is currently used only for landing page
// FIXME cacheLookup doesn't indicate if a resource is currently being fetched
// TODO an API like ServiceWorker may be more appropriate
var cache = [];

function cacheAdd(request, response) {
	var rq = _.defaults({}, request);
	var resp = _.defaults({}, response);
	resp.document = DOM.cloneDocument(response.document); // TODO handle other response types
	cache.push({
		request: rq,
		response: resp
	});
}

function cacheLookup(request) {
	var response;
	_.some(cache, function(entry) {
		if (!cacheMatch(request, entry)) return false;
		response = entry.response;
		return true;
	});
	if (!response) return;
	var resp = _.defaults({}, response);
	resp.document = DOM.cloneDocument(response.document); // TODO handle other response types
	return resp;
}

function cacheMatch(request, entry) {
	if (request.url !== entry.request.url) return false;
	// FIXME what testing is appropriate?? `method`, other headers??
	return true;
}

var httpProxy = {

HTML_IN_XHR: HTML_IN_XHR,

add: function(response) { // NOTE this is only for the landing page
	var url = response.url;
	if (!url) throw Error('Invalid url in response object');
	if (!_.includes(responseTypes, response.type)) throw Error('Invalid type in response object');
	var request = {
		url: response.url
	}
	_.defaults(request, defaultInfo);
	return Promise.pipe(undefined, [

	function() {
		return htmlParser.normalize(response.document, request);
	},
	function(doc) {
		response.document = doc;
		cacheAdd(request, response);
	}

	]);
},

load: function(url, requestInfo) {
	var info = {
		url: url
	};
	if (requestInfo) _.defaults(info, requestInfo);
	_.defaults(info, defaultInfo);
	if (!_.includes(methods, info.method)) throw Error('method not supported: ' + info.method);
	if (!_.includes(responseTypes, info.responseType)) throw Error('responseType not supported: ' + info.responseType);
	return request(info);
}

}

var request = function(info) {
	var sendText = null;
	var method = _.lc(info.method);
	switch (method) {
	case 'post':
		throw Error('POST not supported'); // FIXME proper error handling
		info.body = serialize(info.body, info.type);
		return doRequest(info);
		break;
	case 'get':
		var response = cacheLookup(info);
		if (response) return Promise.resolve(response);
		return doRequest(info)
			.then(function(response) {
				cacheAdd(info, response);
				return response;
			});
		break;
	default:
		throw Error(_.uc(method) + ' not supported');
		break;
	}
}

var doRequest = function(info) {
return new Promise(function(resolve, reject) {
	var method = info.method;
	var url = info.url;
	var sendText = info.body; // FIXME not-implemented
	var xhr = new XMLHttpRequest;
	xhr.onreadystatechange = onchange;
	xhr.open(method, url, true);
	if (HTML_IN_XHR) {
		xhr.responseType = info.responseType;
		// WARN overrideMimeType is needed for file:/// on Firefox
		// TODO test cross-browser
		// FIXME shouldn't be assuming text/html
		if (info.responseType === 'document' && xhr.overrideMimeType) xhr.overrideMimeType('text/html');
	}
	xhr.send(sendText);
	function onchange() { // FIXME rewrite this to use onload/onerror/onabort/ontimeout
		if (xhr.readyState != 4) return;
		var protocol = new URL(url).protocol;
		switch (protocol) {
		case 'http:': case 'https:':
			switch (xhr.status) {
			default:
				reject(function() { throw Error('Unexpected status ' + xhr.status + ' for ' + url); });
				return;
				
			// FIXME what about other status codes?
			case 200:
				break; // successful so just continue
			}
			break;

		default:
			if (HTML_IN_XHR ? !xhr.response : !xhr.responseText) {
				reject(function() { throw Error('No response for ' + url); });
				return;
			}
			break;
		}
		
		Promise.defer(onload); // Use delay to stop the readystatechange event interrupting other event handlers (on IE). 
	}
	function onload() {
		var result = handleResponse(xhr, info);
		resolve(result);
	}
});
}

function handleResponse(xhr, info) { // TODO handle info.responseType
	var response = {
		url: info.url,
		type: info.responseType,
		status: xhr.status,
		statusText: xhr.statusText
	};
	if (HTML_IN_XHR) {
		return htmlParser.normalize(xhr.response, info)
		.then(function(doc) {
			response.document = doc;
			return response;
		});
	}
	else {
		return htmlParser.parse(new String(xhr.responseText), info)
		.then(function(doc) {
				response.document = doc;
				return response;
		});
	}
}

return httpProxy;

})();

}).call(this);

(function() {

var window = this;
var Meeko = window.Meeko;
var _ = Meeko.stuff;
var Promise = Meeko.Promise;

// wrapper for `history` mostly to provide locking around state-updates and throttling of popstate events
var historyManager = Meeko.historyManager = (function() {

var historyManager = {};

var stateTag = 'HyperFrameset';
var currentState;
var popStateHandler;
var started = false;

_.defaults(historyManager, {

getState: function() {
	return currentState;
},

start: function(data, title, url, onNewState, onPopState) { // FIXME this should call onPopState if history.state is defined
return scheduler.now(function() {
	if (started) throw Error('historyManager has already started');
	started = true;
	popStateHandler = onPopState;
	var newState = State.create(data, title, url);
	if (history.replaceState) {
		history.replaceState(newState.settings, title, url);
	}
	currentState = newState;
	return onNewState(newState);
});
},

newState: function(data, title, url, useReplace, callback) {
return scheduler.now(function() {
	var newState = State.create(data, title, url);
	if (history.replaceState) {
		if (useReplace) history.replaceState(newState.settings, title, url);
		else history.pushState(newState.settings, title, url);
	}
	currentState = newState;
	if (callback) return callback(newState);
});
},

replaceState: function(data, title, url, callback) {
	return this.newState(data, title, url, true, callback);
},

pushState: function(data, title, url, callback) {
	return this.newState(data, title, url, false, callback);
}

});

if (history.replaceState) window.addEventListener('popstate', function(e) {
		if (e.stopImmediatePropagation) e.stopImmediatePropagation();
		else e.stopPropagation();
		
		var newSettings = e.state;
		if (!newSettings[stateTag]) {
			console.warn('Ignoring invalid PopStateEvent');
			return;
		}
		scheduler.reset(function() {
			currentState = new State(newSettings);
			if (!popStateHandler) return;
			return popStateHandler(currentState);
		});
	}, true);

function State(settings) {
	if (!settings[stateTag]) throw Error('Invalid settings for new State');
	this.settings = settings;
}

State.create = function(data, title, url) {
	var timeStamp = +(new Date);
	var settings = {
		title: title,
		url: url,
		timeStamp: timeStamp,
		data: data
	};
	settings[stateTag] = true;
	return new State(settings);
}

_.defaults(State.prototype, {

getData: function() {
	return this.settings.data;
},

update: function(data, callback) { // FIXME not being used. Can it be reomved?
	var state = this;
	return Promise.resolve(function() {
		if (state !== currentState) throw Error('Cannot update state: not current');
		return scheduler.now(function() {
			if (history.replaceState) history.replaceState(state.settings, title, url);
			return callback(state);
		});
	});
}

});

return historyManager;

})();


var scheduler = (function() { // NOTE only used in historyManager

var queue = [];
var maxSize = 1;
var processing = false;

function bump() {
	if (processing) return;
	processing = true;
	process();
}

function process() {
	if (queue.length <= 0) {
		processing = false;
		return;
	}
	var task = queue.shift();
	var promise = Promise.defer(task.fn);
	promise.then(process, process);
	promise.then(task.resolve, task.reject);
}

var scheduler = {
	
now: function(fn, fail) {
	return this.whenever(fn, fail, 0);
},

reset: function(fn) {
	queue.length = 0;
	return this.whenever(fn, null, 1);
},

whenever: function(fn, fail, max) {
return new Promise(function(resolve, reject) {

	if (max == null) max = maxSize;
	if (queue.length > max || (queue.length === max && processing)) {
		if (fail) Promise.defer(fail).then(resolve, reject);
		else reject(function() { throw Error('No `fail` callback passed to whenever()'); });
		return;
	}
	queue.push({ fn: fn, resolve: resolve, reject: reject });

	bump();
});
}

}

return scheduler;

})();


}).call(this);


(function() {

var global = this;
var Meeko = global.Meeko;
var _ = Meeko.stuff;

var CustomNamespace = Meeko.CustomNamespace = (function() {

function CustomNamespace(options) {
	if (!(this instanceof CustomNamespace)) return new CustomNamespace(options);
	if (!options) return; // WARN for cloning / inheritance
	var style = options.style = _.lc(options.style);
	var styleInfo = _.find(CustomNamespace.namespaceStyles, function(styleInfo) {
		return styleInfo.style === style;
	});
	if (!styleInfo) throw Error('Unexpected namespace style: ' + style);
	var name = options.name = _.lc(options.name);
	if (!name) throw Error('Unexpected name: ' + name);
	
	var nsDef = this;
	_.assign(nsDef, options);
	var separator = styleInfo.separator;
	nsDef.prefix = nsDef.name + separator;
	nsDef.selectorPrefix = nsDef.name + (separator === ':' ? '\\:' : separator);
}

_.defaults(CustomNamespace.prototype, {

clone: function() {
	var clone = new CustomNamespace();
	_.assign(clone, this);
	return clone;
},

lookupTagName: function(name) { return this.prefix + name; },
lookupSelector: function(name) { return this.selectorPrefix + name; }

});

CustomNamespace.namespaceStyles = [
	{
		style: 'vendor',
		configNamespace: 'custom',
		separator: '-'
	},
	{
		style: 'xml',
		configNamespace: 'xmlns',
		separator: ':'
	}
];

_.forOwn(CustomNamespace.namespaceStyles, function(styleInfo) {
	styleInfo.configPrefix = styleInfo.configNamespace + styleInfo.separator;
});

CustomNamespace.getNamespaces = function(doc) { // NOTE modelled on IE8, IE9 document.namespaces interface
	return new NamespaceCollection(doc);
}

return CustomNamespace;

})();

var NamespaceCollection = Meeko.NamespaceCollection = function(doc) { 
	if (!(this instanceof NamespaceCollection)) return new NamespaceCollection(doc);
	this.items = [];
	if (!doc) return; // WARN for cloning / inheritance
	this.init(doc); 
}

_.assign(NamespaceCollection.prototype, {

init: function(doc) {
	var coll = this;
	_.forEach(_.map(doc.documentElement.attributes), function(attr) {
		var fullName = _.lc(attr.name);
		var styleInfo = _.find(CustomNamespace.namespaceStyles, function(styleInfo) {
			return (fullName.indexOf(styleInfo.configPrefix) === 0);
		});
		if (!styleInfo) return;
		var name = fullName.substr(styleInfo.configPrefix.length);
		var nsDef = new CustomNamespace({
			urn: attr.value,
			name: name,
			style: styleInfo.style
		});
		coll.add(nsDef);
	});
},

clone: function() {
	var coll = new NamespaceCollection();
	_.forEach(this.items, function(nsDef) { 
		coll.items.push(nsDef.clone());
	});
	return coll;
},

add: function(nsDef) {
	var coll = this;
	var matchingNS = _.find(coll.items, function(def) {
		if (_.lc(def.urn) === _.lc(nsDef.urn)) {
			if (def.prefix !== nsDef.prefix) console.warn('Attempted to add namespace with same urn as one already present: ' + def.urn);
			return true;
		}
		if (def.prefix === nsDef.prefix) {
			if (_.lc(def.urn) !== _.lc(nsDef.urn)) console.warn('Attempted to add namespace with same prefix as one already present: ' + def.prefix);
			return true;
		}
	});
	if (matchingNS) return;
	coll.items.push(nsDef);
},

lookupNamespace: function(urn) {
	var coll = this;
	urn = _.lc(urn);
	var nsDef = _.find(coll.items, function(def) {
		return (_.lc(def.urn) === urn);
	});
	return nsDef;
},


lookupPrefix: function(urn) {
	var coll = this;
	var nsDef = coll.lookupNamespace(urn);
	return nsDef && nsDef.prefix;
},

lookupNamespaceURI: function(prefix) {
	var coll = this;
	prefix = _.lc(prefix);
	var nsDef = _.find(coll.items, function(def) {
		return (def.prefix === prefix);
	});
	return nsDef && nsDef.urn;
},

lookupTagNameNS: function(name, urn) {
	var coll = this;
	var nsDef = coll.lookupNamespace(urn);
	if (!nsDef) return name; // TODO is this correct?
	return nsDef.prefix + name; // TODO _.lc(name) ??
},

lookupSelector: function(selector, urn) {
	var nsDef = this.lookupNamespace(urn);
	if (!nsDef) return selector;
	var tags = selector.split(/\s*,\s*|\s+/);
	return _.map(tags, function(tag) { return nsDef.lookupSelector(tag); }).join(', ');
}

});



}).call(this);
(function(classnamespace) {

var global = this;
var Meeko = global.Meeko;
var _ = Meeko.stuff;

var Registry = function(options) {
	if (!options || typeof options !== 'object') options = {};
	this.options = options;
	this.items = {};
}

_.assign(Registry.prototype, {

clear: function() {
	if (this.options.writeOnce) throw Error('Attempted to clear write-once storage');
	this.items = Object.create(null);
},

has: function(key) {
	return key in this.items;
},

get: function(key) {
	return this.items[key];
},

set: function(key, value) {
	if (this.options.writeOnce && this.has(key)) {
		throw Error('Attempted to rewrite key ' + key + ' in write-once storage');
	}
	if (this.options.keyTest) {
		var ok = this.options.keyTest(key);
		if (!ok) throw Error('Invalid key ' + key + ' for storage');
	}
	if (this.options.valueTest) {
		var ok = this.options.valueTest(value);
		if (!ok) throw Error('Invalid value ' + value + ' for storage');
	}
	this.items[key] = value;
},

'delete': function(key) {
	if (this.options.writeOnce && this.has(key)) {
		throw Error('Attempted to delete key ' + key + ' in write-once storage');
	}
	delete this.items[key];
}

});

Registry.prototype.register = Registry.prototype.set;

classnamespace.Registry = Registry;

}).call(this, this.Meeko);
/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

Meeko.stuff.dateFormat = (function() {

var dateFormat = function () {
	var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = dateFormat;

		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date;
		if (isNaN(date)) throw SyntaxError("invalid date");

		mask = String(dF.masks[mask] || mask || dF.masks["default"]);

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}

		var	_ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

		return mask.replace(token, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
	};
}();

// Some common format strings
dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
	dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
	monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
};

return dateFormat;

}).call(window);



(function(classnamespace) {

var global = this;
var Meeko = global.Meeko;
var _ = Meeko.stuff;
var Registry = Meeko.Registry;

var filters = new Registry({
	writeOnce: true,
	testKey: function(key) {
		return /^[_a-zA-Z][_a-zA-Z0-9]*$/.test(key);
	},
	testValue: function(fn) {
		return typeof fn === 'function';
	}
});

_.assign(filters, {

evaluate: function(name, value, params) {
	var fn = this.get(name);
	// NOTE filter functions should only accept string_or_number_or_boolean
	// FIXME Need to wrap fn() to assert / cast supplied value and accept params
	var args = params.slice(0);
	args.unshift(value);
	return fn.apply(undefined, args);
}

});

classnamespace.filters = filters;

}).call(this, this.Meeko);




(function() {

var global = this;
var Meeko = global.Meeko;
var _ = Meeko.stuff;
var filters = Meeko.filters;

// FIXME filters need sanity checking
filters.register('lowercase', function(value, text) {
	return value.toLowerCase();
});

filters.register('uppercase', function(value, text) {
	return value.toUpperCase();
});

filters.register('if', function(value, yep) {
	return (!!value) ? yep : value;
});

filters.register('unless', function(value, nope) {
	return (!value) ? nope : value;
});

filters.register('if_unless', function(value, yep, nope) {
	return (!!value) ? yep : nope;
});

filters.register('map', function(value, dict) { // dict can be {} or []

	if (Array.isArray(dict)) {
		var patterns = _.filter(dict, function(item, i) { return !(i % 2); });
		var results = _.filter(dict, function(item, i) { return !!(i % 2); });
		_.some(patterns, function(pattern, i) {
			// FIXME what if pattern not RegExp && not string??
			if (!(pattern instanceof RegExp)) pattern = new RegExp('^' + pattern + '$');
			if (!pattern.test(value)) return false;
			value = results[i];
			return true;
		});
		return value;
	}

	if (value in dict) return dict[value]; // TODO sanity check before returning
	return value;
});

filters.register('match', function(value, pattern, yep, nope) {
	// FIXME what if pattern not RegExp && not string??
	if (!(pattern instanceof RegExp)) pattern = new RegExp('^' + pattern + '$'); // FIXME sanity TODO case-insensitive??
	var bMatch = pattern.test(value);
	if (yep != null && bMatch) return yep;
	if (nope != null && !bMatch) return nope;
	return bMatch;
});

filters.register('replace', function(value, pattern, text) {
	return value.replace(pattern, text); // TODO sanity check before returning
});

if (_.dateFormat) filters.register('date', function(value, format, utc) {
	return _.dateFormat(value, format, utc);
});


}).call(this);



(function(classnamespace) {

var global = this;

var Meeko = global.Meeko;
var _ = Meeko.stuff;
var Registry = Meeko.Registry;

var decoders = new Registry({
	writeOnce: true,
	testKey: function(key) {
		return typeof key === 'string' && /^[_a-zA-Z][_a-zA-Z0-9]*/.test(key);
	},
	testValue: function(constructor) {
		return typeof constructor === 'function';
	}
});

_.assign(decoders, {

create: function(type, options, namespaces) {
	var constructor = this.get(type);
	return new constructor(options, namespaces);
}

});

classnamespace.decoders = decoders;

}).call(this, this.Meeko);
(function(classnamespace) {

var global = this;

var Meeko = global.Meeko;
var _ = Meeko.stuff;
var DOM = Meeko.DOM;
var decoders = Meeko.decoders;

// FIXME textAttr & htmlAttr used in HazardProcessor & CSSDecoder
var textAttr = '_text';
var htmlAttr = '_html';
// TODO what about tagnameAttr, namespaceAttr

CSS_CONTEXT_VARIABLE = '_';

function CSSDecoder(options, namespaces) {}

_.defaults(CSSDecoder.prototype, {

init: function(node) {
	this.srcNode = node;
},

// TODO should matches() support Hazard variables
matches: function(element, query) { // FIXME refactor common-code in matches / evaluate
	var queryParts = query.match(/^\s*([^{]*)\s*(?:\{\s*([^}]*)\s*\}\s*)?$/);
	var selector = queryParts[1];
	var attr = queryParts[2];
	var result;
	if (!matches(element, selector)) return;
	var node = element;
	var result = node;

	if (attr) {
		attr = attr.trim();
		if (attr.charAt(0) === '@') attr = attr.substr(1);
		result = getAttr(node, attr);
	}

	return result;

	function getAttr(node, attr) {
		switch(attr) {
		case null: case undefined: case '': return node;
		case textAttr: 
			return node.textContent;
		case htmlAttr:
			var frag = doc.createDocumentFragment();
			_.forEach(node.childNodes, function(child) { 
				frag.appendChild(doc.importNode(child, true)); // TODO does `child` really need to be cloned??
			});
			return frag;
		default: 
			return node.getAttribute(attr);
		}
	}


},

evaluate: function(query, context, variables, wantArray) {
	if (!context) context = this.srcNode;
	var doc = context.nodeType === 9 ? context : context.ownerDocument; // FIXME which document??
	var queryParts = query.match(/^\s*([^{]*)\s*(?:\{\s*([^}]*)\s*\}\s*)?$/);
	var selector = queryParts[1];
	var attr = queryParts[2];
	var result = find(selector, context, variables, wantArray);

	if (attr) {
		attr = attr.trim();
		if (attr.charAt(0) === '@') attr = attr.substr(1);

		if (!wantArray) result = [ result ];
		result = _.map(result, function(node) {
			return getAttr(node, attr);
		});
		if (!wantArray) result = result[0];
	}

	return result;

	function getAttr(node, attr) {
		switch(attr) {
		case null: case undefined: case '': return node;
		case textAttr: 
			return node.textContent;
		case htmlAttr:
			var frag = doc.createDocumentFragment();
			_.forEach(node.childNodes, function(child) { 
				frag.appendChild(doc.importNode(child, true)); // TODO does `child` really need to be cloned??
			});
			return frag;
		default: 
			return node.getAttribute(attr);
		}
	}

}

});

function matches(element, selectorGroup) {
	if (selectorGroup.trim() === '') return;
	return DOM.matches(element, selectorGroup);
}

function find(selectorGroup, context, variables, wantArray) { // FIXME currently only implements `context` expansion
	selectorGroup = selectorGroup.trim();
	if (selectorGroup === '') return wantArray ? [ context ] : context;
	var nullResult = wantArray ? [] : null;
	var selectors = selectorGroup.split(/,(?![^\(]*\)|[^\[]*\])/);
	selectors = _.map(selectors, function(s) { return s.trim(); });

	var invalidVarUse = false;
	var contextVar;
	_.forEach(selectors, function(s, i) {
		var m = s.match(/\\?\$[_a-zA-Z][_a-zA-Z0-9]*\b/g);
		if (!m) {
			if (i > 0 && contextVar) {
				invalidVarUse = true;
				console.warn('All individual selectors in a selector-group must share same context: ' + selectorGroup);
			}
			return; // if no matches then m will be null not []
		}
		_.forEach(m, function(varRef, j) {
			if (varRef.charAt(0) === '\\') return; // Ignore "\$"
			var varName = varRef.substr(1);
			var varPos = s.indexOf(varRef);
			if (j > 0 || varPos > 0) {
				invalidVarUse = true;
				console.warn('Invalid use of ' + varRef + ' in ' + selectorGroup);
				return;
			}
			if (i > 0) {
				if (varName !== contextVar) {
					invalidVarUse = true;
					console.warn('All individual selectors in a selector-group must share same context: ' + selectorGroup);
				}
				return;
			}
			contextVar = varName;
		});
	});

	if (invalidVarUse) {
		console.error('Invalid use of variables in CSS selector. Assuming no match.');
		return nullResult;
	}

	if (contextVar && contextVar !== CSS_CONTEXT_VARIABLE) {
		if (!variables.has(contextVar)) {
			console.debug('Context variable $' + contextVar + ' not defined for ' + selectorGroup);
			return nullResult;
		}
		if (contextVar !== CSS_CONTEXT_VARIABLE) context = variables.get(contextVar);

		// NOTE if the selector is just '$variable' then 
		// context doesn't even need to be a node
		if (selectorGroup === '$' + contextVar) return context;

		if (!(context && context.nodeType === 1)) {
			console.debug('Context variable $' + contextVar + ' not an element in ' + selectorGroup);
			return nullResult;
		}
	}

	var isRoot = false;
	if (context.nodeType === 9 || context.nodeType === 11) isRoot = true;

	selectors = _.filter(selectors, function(s) {
			switch(s.charAt(0)) {
			case '+': case '~': 
				console.warn('Siblings of context-node cannot be selected in ' + selectorGroup);
				return false;
			case '>': return (isRoot) ? false : true; // FIXME probably should be allowed even if isRoot
			default: return true;
			}
		});

	if (selectors.length <= 0) return nullResult;

	selectors = _.map(selectors, function(s) {
			if (isRoot) return s;
			var prefix = ':scope';
			return (contextVar) ? 
				s.replace('$' + contextVar, prefix) : 
				prefix + ' ' + s;
		});
	
	var finalSelector = selectors.join(', ');

	if (wantArray) {
		return DOM.findAll(finalSelector, context, !isRoot, !isRoot);
	}
	else {
		return DOM.find(finalSelector, context, !isRoot, !isRoot);
	}
}

function markElement(context) {
	if (context.hasAttribute(DOM.uniqueIdAttr)) return context.getAttribute(DOM.uniqueIdAttr);
	var uid = DOM.uniqueId(context);
	context.setAttribute(DOM.uniqueIdAttr, uid);
	return uid;
}


_.assign(classnamespace, {

CSSDecoder: CSSDecoder

});

}).call(this, this.Meeko);
(function(classnamespace) {

var window = this;
var document = window.document;

var Meeko = window.Meeko;
var _ = Meeko.stuff;
var DOM = Meeko.DOM;
var decoders = Meeko.decoders;

var Microdata = (function() {

function intersects(a1, a2) { // TODO add to Meeko.stuff
	return _.some(a1, function(i1) {
		return _.some(a2, function(i2) { 
			return i2 === i1; 
		});
	});
}

function walkTree(root, skipRoot, callback) { // callback(el) must return NodeFilter code
	var walker = document.createNodeIterator(
			root,
			1,
			acceptNode,
			null // IE9 throws if this irrelavent argument isn't passed
		);
	
	var el;
	while (el = walker.nextNode());

	function acceptNode(el) {
		if (skipRoot && el === root) return NodeFilter.FILTER_SKIP;
		return callback(el);
	}
}

// TODO copied from DOMSprockets. Could be a generic "class"

var nodeIdProperty = '__microdata__';
var nodeCount = 0; // used to generated node IDs
var nodeStorage = {}; // hash of storage for nodes, keyed off `nodeIdProperty`

var uniqueId = function(node) {
	var nodeId = node[nodeIdProperty];
	if (nodeId) return nodeId;
	nodeId = nodeCount++; // TODO stringify??
	node[nodeIdProperty] = new String(nodeId); // NOTE so that node cloning in old IE doesn't copy the node ID property
	return nodeId;
}

var setData = function(node, data) { // FIXME assert node is element
	var nodeId = uniqueId(node);
	nodeStorage[nodeId] = data;
}

var hasData = function(node) {
	var nodeId = node[nodeIdProperty];
	return !nodeId ? false : nodeId in nodeStorage;
}

var getData = function(node) { // TODO should this throw if no data?
	var nodeId = node[nodeIdProperty];
	if (!nodeId) return;
	return nodeStorage[nodeId];
}


function getItems(rootNode, type) {
	if (!hasData(rootNode)) parse(rootNode);

	var scope = getData(rootNode);
	var typeList = 
		(typeof type === 'string') ? _.words(type.trim()) :
		type && type.length ? type :
		[];
			
	var resultList = [];

	_.forEach(scope.properties.names, function(propName) {
		var propList = scope.properties.namedItem(propName);
		_.forEach(propList, function(prop) {
			if (prop.isScope) [].push.apply(resultList, getItems(prop.element, typeList));
		});
	});

	_.forEach(scope.childScopes, function(scope) {
		if (!typeList.length || intersects(scope.type, typeList)) resultList.push(scope);
		[].push.apply(resultList, getItems(scope.element, typeList));
	});

	// now convert descriptors back to nodes
	_.forEach(resultList, function(desc, i) {
		resultList[i] = desc.element;
	});
	return resultList;
}

function getProperties(el) {
	if (!hasData(el)) return;
	var desc = getData(el);
	if (!desc.isScope) return;
	return desc.properties;
}

function parse(rootNode) {
	if (!rootNode) rootNode = document;
	var desc = getScopeDesc(rootNode);
}

function getScopeDesc(scopeEl) {
	if (hasData(scopeEl)) return getData(scopeEl);
	
	var scopeDesc = {
		element: scopeEl,
		isScope: true,
		type: scopeEl.nodeType === 1 || _.words(scopeEl.getAttribute('itemtype')),
		properties: createHTMLPropertiesCollection(),
		childScopes: []
	}

	walkTree(scopeEl, true, function(el) {
		var isScope = el.hasAttribute('itemscope');
		var propName = el.getAttribute('itemprop');
		if (!(isScope || propName)) return NodeFilter.FILTER_SKIP;
		
		var item = isScope ? getScopeDesc(el) : getPropDesc(el);
		if (propName) scopeDesc.properties.addNamedItem(propName, el);
		else scopeDesc.childScopes.push(el);

		return isScope ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
	});

	setData(scopeEl, scopeDesc);
	return scopeDesc;
}
	
function getValue(el) {
	if (hasData(el)) return getData(el).value;
	var desc = getPropDesc(el);
	setData(el, desc);
	return desc.value;
}

function getPropDesc(el) {
	if (hasData(el)) return getData(el);

	var name = el.getAttribute('itemprop');
	
	var prop = {
		name: name,
		value: evaluate(el)
	}
	
	setData(el, prop);
	return prop;
}

function evaluate(el) {
	var tagName = el.tagName.toLowerCase();
	var attrName = valueAttr[tagName];
	if (attrName) return el[attrName] || el.getAttribute(attrName);

	return el;
}

function createHTMLPropertiesCollection() {
	var list = [];
	list.names = [];
	list.nodeLists = {};
	_.assign(list, HTMLPropertiesCollection.prototype);
	return list;
}

var HTMLPropertiesCollection = function() {}
_.assign(HTMLPropertiesCollection.prototype, {

namedItem: function(name) {
	return this.nodeLists[name];
},

addNamedItem: function(name, el) {
	this.push(el);
	if (!this.nodeLists[name]) {
		this.nodeLists[name] = [];
		this.names.push(name);
	}
	this.nodeLists[name].push(el);
}

});


var valueAttr = {};
_.forEach(_.words("meta@content link@href a@href area@href img@src video@src audio@src source@src track@src iframe@src embed@src object@data time@datetime data@value meter@value"), function(text) {
	var m = text.split("@"), tagName = m[0], attrName = m[1];
	valueAttr[tagName] = attrName;
});


return {

getItems: getItems,
getProperties: getProperties,
getValue: getValue

}

})();


function MicrodataDecoder(options, namespaces) {}

_.defaults(MicrodataDecoder.prototype, {

init: function(node) {
	Microdata.getItems(node);
	this.rootNode = node;
},

evaluate: function(query, context, variables, wantArray) {
	if (!context) context = this.rootNode;

	var query = query.trim();
	var startAtRoot = false;
	var baseSchema;
	var pathParts;

	if (query === '.') return (wantArray) ? [ context ] : context;

	var m = query.match(/^(?:(\^)?\[([^\]]*)\]\.)/);
	if (m && m.length) {
		query = query.substr(m[0].length);
		startAtRoot = !!m[1];
		baseSchema = _.words(m[2].trim());
	}
	pathParts = _.words(query.trim());
	
	var nodes;
	if (baseSchema) {
		if (startAtRoot) context = this.view;
		nodes = Microdata.getItems(context, baseSchema);	
	}
	else nodes = [ context ];

	var resultList = nodes;
	_.forEach(pathParts, function(relPath, i) {
		var parents = resultList;
		resultList = [];
		_.forEach(parents, function(el) {
			var props = Microdata.getProperties(el);
			if (!props) return;
			var nodeList = props.namedItem(relPath);
			if (!nodeList) return;
			[].push.apply(resultList, nodeList);
		});
	});

	// now convert elements to values
	resultList = _.map(resultList, function(el) {
		var props = Microdata.getProperties(el);
		if (props) return el;
		return Microdata.getValue(el);
	});

	if (wantArray) return resultList;

	return resultList[0];
}

});


_.assign(classnamespace, {

Microdata: Microdata,
MicrodataDecoder: MicrodataDecoder

});


}).call(this, this.Meeko);
(function(classnamespace) {

var global = this;

var Meeko = global.Meeko;
var _ = Meeko.stuff;
var DOM = Meeko.DOM;
var decoders = Meeko.decoders;

// FIXME not really a JSON decoder since expects JSON input and 
// doesn't use JSON paths

function JSONDecoder(options, namespaces) {}

_.defaults(JSONDecoder.prototype, {

init: function(object) {
	if (typeof object !== 'object' || object === null) throw 'JSONDecoder cannot handle non-object';
	this.object = object;
},

evaluate: function(query, context, variables, wantArray) {
	if (!context) context = this.object;

	var query = query.trim();
	var pathParts;

	if (query === '.') return (wantArray) ? [ context ] : context;

	var m = query.match(/^\^/);
	if (m && m.length) {
		query = query.substr(m[0].length);
		context = this.object;
	}
	pathParts = query.split('.');
	
	var resultList = [ context ];
	_.forEach(pathParts, function(relPath, i) {
		var parents = resultList;
		resultList = [];
		_.forEach(parents, function(item) {
			var child = item[relPath];
			if (child != null) {
				if (Array.isArray(child)) [].push.apply(resultList, child);
				else resultList.push(child);
			}
		});
	});

	if (wantArray) return resultList;

	var value = resultList[0];
	return value;
}

});


_.assign(classnamespace, {

JSONDecoder: JSONDecoder

});


}).call(this, this.Meeko);
(function(classnamespace) {

var global = this;

var Meeko = global.Meeko;
var decoders = Meeko.decoders;

var CSSDecoder = Meeko.CSSDecoder;
decoders.register('css', CSSDecoder);

var MicrodataDecoder = Meeko.MicrodataDecoder;
decoders.register('microdata', MicrodataDecoder);

var JSONDecoder = Meeko.JSONDecoder;
decoders.register('json', JSONDecoder);

}).call(this, this.Meeko);
/*!
 * HyperFrameset Processors
 * Copyright 2014-2015 Sean Hogan (http://meekostuff.net/)
 * Mozilla Public License v2.0 (http://mozilla.org/MPL/2.0/)
 */

(function(classnamespace) {

var global = this;
var Meeko = global.Meeko;
var _ = Meeko.stuff;
var Registry = Meeko.Registry;

var processors = new Registry({
	writeOnce: true,
	testKey: function(key) {
		return typeof key === 'string' && /^[_a-zA-Z][_a-zA-Z0-9]*/.test(key);
	},
	testValue: function(constructor) {
		return typeof constructor === 'function';
	}
});

_.assign(processors, {

create: function(type, options, namespaces) {
	var constructor = this.get(type);
	return new constructor(options, namespaces);
}

});

classnamespace.processors = processors;

}).call(this, this.Meeko);
/*!
 * MainProcessor
 * Copyright 2014-2016 Sean Hogan (http://meekostuff.net/)
 * Mozilla Public License v2.0 (http://mozilla.org/MPL/2.0/)
 */

(function(classnamespace) {

var global = this;

var Meeko = global.Meeko;
var _ = Meeko.stuff;
var DOM = Meeko.DOM;
var processors = Meeko.processors;

function MainProcessor(options) {}

_.defaults(MainProcessor.prototype, {

loadTemplate: function(template) {
	if (/\S+/.test(template.textContent)) console.warn('"main" transforms do not use templates');
},

transform: function(provider, details) { // TODO how to use details?
	var srcNode = provider.srcNode;
	var srcDoc = srcNode.nodeType === 9 ? srcNode : srcNode.ownerDocument;
	var main;
	if (!main) main = DOM.find('main, [role=main]', srcNode);
	if (!main && srcNode === srcDoc) main = srcDoc.body;
	if (!main) main = srcNode;

	var frag = srcDoc.createDocumentFragment();
	var node;
	while (node = main.firstChild) frag.appendChild(node); // NOTE no adoption
	return frag;
}
	
});

_.assign(classnamespace, {

MainProcessor: MainProcessor

});


}).call(this, this.Meeko);
/*!
 * ScriptProcessor
 * Copyright 2014-2016 Sean Hogan (http://meekostuff.net/)
 * Mozilla Public License v2.0 (http://mozilla.org/MPL/2.0/)
 */

(function(classnamespace) {

var global = this;

var Meeko = global.Meeko;
var _ = Meeko.stuff;
var DOM = Meeko.DOM;
var Task = Meeko.Task;
var processors = Meeko.processors;

function ScriptProcessor(options) {
	this.processor = options;
}

_.defaults(ScriptProcessor.prototype, {

loadTemplate: function(template) {
	var script;
	_.forEach(_.map(template.childNodes), function(node) {
		switch (node.nodeType) {
		case 1: // Element
			switch (DOM.getTagName(node)) {
			case 'script':
				if (script) console.warn('Ignoring secondary <script> in "script" transform template');
				else script = node;
				return;
			default:
				console.warn('Ignoring unexpected non-<script> element in "script" transform template');
				return;
			}
			break; // should never reach here
		case 3: // Text
			if (/\S+/.test(node.nodeValue)) console.warn('"script" transforms should not have non-empty text-nodes');
			return;
		case 8: // Comment
			return;
		default:
			console.warn('Unexpected node in "script" transform template');
			return;
		}
	});
	if (!script) {
		// no problem if already a processor defined in new ScriptProcessor(options)
		if (this.processor) return;
		console.warn('No <script> found in "script" transform template');
		return;
	}
	try { this.processor = (Function('return (' + script.text + ')'))(); }
	catch(err) { Task.postError(err); }
	
	if (!this.processor || !this.processor.transform) {
		console.warn('"script" transform template did not produce valid transform object');
		return;
	}
},

transform: function(provider, details) {
	var srcNode = provider.srcNode;
	if (!this.processor || !this.processor.transform) {
		console.warn('"script" transform template did not produce valid transform object');
		return;
	}
	return this.processor.transform(srcNode, details);
}
	
});


_.assign(classnamespace, {

ScriptProcessor: ScriptProcessor

});


}).call(this, this.Meeko);
/*!
 * HazardProcessor
 * Copyright 2014-2016 Sean Hogan (http://meekostuff.net/)
 * Mozilla Public License v2.0 (http://mozilla.org/MPL/2.0/)
 */

/* NOTE
	+ assumes DOMSprockets
*/
/* TODO
    + The passing of nodes between documents needs to be audited.
		Safari and IE10,11 in particular seem to require nodes to be imported / adopted
		(not fully understood right now)
 */

(function(classnamespace) {

var window = this;
var document = window.document;

var Meeko = window.Meeko;
var _ = Meeko.stuff;
var DOM = Meeko.DOM;
var Task = Meeko.Task;
var Promise = Meeko.Promise;
var filters = Meeko.filters;
var processors = Meeko.processors;
var CustomNamespace = Meeko.CustomNamespace;

// NOTE textAttr & htmlAttr used in HazardProcessor & CSSDecoder
var textAttr = '_text';
var htmlAttr = '_html';

var PIPE_OPERATOR = '//>';

var HYPERFRAMESET_URN = 'hyperframeset'; // FIXME DRY with libHyperFrameset.js

/* WARN 
	on IE11 and Edge, certain elements (or attrs) *not* attached to a document 
	can trash the layout engine. Examples:
		- <custom-element>
		- <element style="...">
		- <li value="NaN">
*/
var FRAGMENTS_ARE_INERT = !(window.HTMLUnknownElement && 
	'runtimeStyle' in window.HTMLUnknownElement.prototype);
// NOTE actually IE10 is okay, but no reasonable feature detection has been determined

var HAZARD_TRANSFORM_URN = 'HazardTransform';
var hazDefaultNS = new CustomNamespace({
	urn: HAZARD_TRANSFORM_URN,
	name: 'haz',
	style: 'xml'
});
var HAZARD_EXPRESSION_URN = 'HazardExpression';
var exprDefaultNS = new CustomNamespace({
	urn: HAZARD_EXPRESSION_URN,
	name: 'expr',
	style: 'xml'
});
var HAZARD_MEXPRESSION_URN = 'HazardMExpression';
var mexprDefaultNS = new CustomNamespace({
	urn: HAZARD_MEXPRESSION_URN,
	name: 'mexpr',
	style: 'xml'
});

/* 
 NOTE IE11 / Edge has a bad performance regression with DOM fragments 
 containing certain elements / attrs, see
     https://connect.microsoft.com/IE/feedback/details/1776195/ie11-edge-performance-regression-with-dom-fragments
*/
var PERFORMANCE_UNFRIENDLY_CONDITIONS = [
	{
		tag: '*', // must be present for checkElementPerformance()
		attr: 'style',
		description: 'an element with @style'
	},
	{
		tag: 'li',
		attr: 'value',
		description: 'a <li> element with @value'
	},
	{
		tag: undefined,
		description: 'an unknown or custom element'
	}
];

function checkElementPerformance(el, namespaces) {
	var exprPrefix = namespaces.lookupPrefix(HAZARD_EXPRESSION_URN);
	var mexprPrefix = namespaces.lookupPrefix(HAZARD_MEXPRESSION_URN);

	var outerHTML;
	_.forEach(PERFORMANCE_UNFRIENDLY_CONDITIONS, function(cond) {
		switch (cond.tag) {
		case undefined: case null:
			if (el.toString() !== '[object HTMLUnknownElement]') return;
			break;
		default:
			if (DOM.getTagName(el) !== cond.tag) return;
			// fall-thru
		case '*': case '':
			if (_.every(
				['', exprPrefix, mexprPrefix], function(prefix) {
					var attr = prefix + cond.attr;
					return !el.hasAttribute(attr);
				})
			) return;
			break;
		}
		if (!outerHTML) outerHTML = el.cloneNode(false).outerHTML; // FIXME caniuse outerHTML??
		console.debug('Found ' + cond.description + ':\n\t\t' + outerHTML + '\n\t' +
			'This can cause poor performance on IE / Edge.');
	});
}

/*
 - items in hazLangDefinition are element@list-of-attrs
 - if element is prefixed with '<' or '>' then it can be defined 
    as an attribute on a normal HTML element. 
 - in preprocessing the attr is promoted to an element
    either above or below the HTML element. 
 - the attr value is used as the "default" attr of the created element. 
    The "default" attr is the first attr-name in the list-of-attrs.  
 - the order of items in hazLangDefinition is the order of promoting 
    attrs to elements.
*/
var hazLangDefinition = 
	'<otherwise <when@test <each@select <one@select +var@name,select <if@test <unless@test ' +
	'>choose <template@name,match >eval@select >mtext@select >text@select ' +
	'call@name apply param@name,select clone deepclone element@name attr@name';

var hazLang = _.map(_.words(hazLangDefinition), function(def) {
	def = def.split('@');
	var tag = def[0];
	var attrToElement = tag.charAt(0);
	switch (attrToElement) {
	default: 
		attrToElement = false; 
		break;
	case '<': case '>': case '+':
		break;
	}
	if (attrToElement) tag = tag.substr(1);
	var attrs = def[1];
	attrs = (attrs && attrs !== '') ? attrs.split(',') : [];
	return {
		tag: tag,
		attrToElement: attrToElement,
		attrs: attrs
	}
});

var hazLangLookup = {};

_.forEach(hazLang, function(directive) {
	var tag = directive.tag; 
	hazLangLookup[tag] = directive;
});

function walkTree(root, skipRoot, callback) { // always "accept" element nodes
	var walker = document.createNodeIterator(
			root,
			1,
			acceptNode,
			null // IE9 throws if this irrelavent argument isn't passed
		);
	
	var el;
	while (el = walker.nextNode()) callback(el);

	function acceptNode(el) {
		if (skipRoot && el === root) return NodeFilter.FILTER_SKIP;
		return NodeFilter.FILTER_ACCEPT;
	}
}

function childNodesToFragment(el) {
	var doc = el.ownerDocument;
	var frag = doc.createDocumentFragment();
	_.forEach(_.map(el.childNodes), function(child) { frag.appendChild(child); });
	return frag;
}

function htmlToFragment(html, doc) {
	if (!doc) doc = document;
	var div = doc.createElement('div');
	div.innerHTML = html;
	var result = childNodesToFragment(div);
	return result;
}

function HazardProcessor(options, namespaces) {
	this.templates = [];
	this.namespaces = namespaces = namespaces.clone();
	if (!namespaces.lookupNamespace(HAZARD_TRANSFORM_URN))
		namespaces.add(hazDefaultNS);
	if (!namespaces.lookupNamespace(HAZARD_EXPRESSION_URN))
		namespaces.add(exprDefaultNS);
	if (!namespaces.lookupNamespace(HAZARD_MEXPRESSION_URN))
		namespaces.add(mexprDefaultNS);
}

_.defaults(HazardProcessor.prototype, {
	
loadTemplate: function(template) {
	var processor = this;
	processor.root = template; // FIXME assert template is Fragment
	processor.templates = [];

	var namespaces = processor.namespaces;
	var hazPrefix = namespaces.lookupPrefix(HAZARD_TRANSFORM_URN);
	var exprPrefix = namespaces.lookupPrefix(HAZARD_EXPRESSION_URN);
	var mexprPrefix = namespaces.lookupPrefix(HAZARD_MEXPRESSION_URN);

	var exprHtmlAttr = exprPrefix + htmlAttr; // NOTE this is mapped to haz:eval
	var hazEvalTag = hazPrefix + 'eval';
	var mexprHtmlAttr = mexprPrefix + htmlAttr; // NOTE this is invalid

	var mexprTextAttr = mexprPrefix + textAttr; // NOTE this is mapped to haz:mtext
	var hazMTextTag = hazPrefix + 'mtext';
	var exprTextAttr = exprPrefix + textAttr; // NOTE this is mapped to haz:text
	var hazTextTag = hazPrefix + 'text';

	// FIXME extract exprToHazPriority from hazLang
	var exprToHazPriority = [ exprHtmlAttr, mexprTextAttr, exprTextAttr ];
	var exprToHazMap = {};
	exprToHazMap[exprHtmlAttr] = hazEvalTag;
	exprToHazMap[mexprTextAttr] = hazMTextTag;
	exprToHazMap[exprTextAttr] = hazTextTag;

	var doc = template.ownerDocument;

	// rewrite the template if necessary
	walkTree(template, true, function(el) {
		var tag = DOM.getTagName(el);
		if (tag.indexOf(hazPrefix) === 0) return;

		// pre-process @expr:_html -> @haz:eval, etc
		_.forEach(exprToHazPriority, function(attr) {
			if (!el.hasAttribute(attr)) return;
			var tag = exprToHazMap[attr];
			var val = el.getAttribute(attr);
			el.removeAttribute(attr);
			el.setAttribute(tag, val);
		});

		if (el.hasAttribute(mexprHtmlAttr)) {
			console.warn('Removing unsupported @' + mexprHtmlAttr);
			el.removeAttribute(mexprHtmlAttr);
		}

		// promote applicable hazard attrs to elements
		_.forEach(hazLang, function(def) {
			if (!def.attrToElement) return;
			var nsTag = hazPrefix + def.tag;
			if (!el.hasAttribute(nsTag)) return;

			// create <haz:element> ...
			var directiveEl = doc.createElement(nsTag);
			// with default attr set from @haz:attr on original element
			var defaultAttr = def.attrs[0];
			var value = el.getAttribute(nsTag);
			el.removeAttribute(nsTag);
			if (defaultAttr) directiveEl.setAttribute(defaultAttr, value);

			// copy non-default hazard attrs
			_.forEach(def.attrs, function(attr, i) {
				if (i === 0) return; // the defaultAttr
				var nsAttr = hazPrefix + attr;
				if (!el.hasAttribute(nsAttr)) return;
				var value = el.getAttribute(nsAttr);
				el.removeAttribute(nsAttr);
				directiveEl.setAttribute(attr, value);
			});
			// insert the hazard element goes below or above the current element
			switch (def.attrToElement) {
			case '>':
				var frag = childNodesToFragment(el);
				directiveEl.appendChild(frag);
				el.appendChild(directiveEl);
				break;
			case '<':
				el.parentNode.replaceChild(directiveEl, el);
				directiveEl.appendChild(el);
				break;
			case '+':
				el.parentNode.insertBefore(directiveEl, el);
				break;
			default:
				break;
			}
		});
	});
	
	walkTree(template, true, function(el) {
		var tag = DOM.getTagName(el);
		if (tag === hazPrefix + 'template') markTemplate(el);
		if (tag === hazPrefix + 'choose') implyOtherwise(el);
	});

	implyEntryTemplate(template);

	// finally, preprocess all elements to extract hazardDetails
	walkTree(template, true, function(el) {
		el.hazardDetails = getHazardDetails(el, processor.namespaces);
	});
	
	if (console.logLevel !== 'debug') return;

	// if debugging then warn about PERFORMANCE_UNFRIENDLY_CONDITIONS (IE11 / Edge)
	var hfNS = processor.namespaces.lookupNamespace(HYPERFRAMESET_URN);
	walkTree(template, true, function(el) {
		var tag = DOM.getTagName(el);
		if (tag.indexOf(hazPrefix) === 0) return;
		if (tag.indexOf(hfNS.prefix) === 0) return; // HyperFrameset element
		checkElementPerformance(el, namespaces);
	});


	function implyOtherwise(el) { // NOTE this slurps *any* non-<haz:when>, including <haz:otherwise>
		var otherwise = el.ownerDocument.createElement(hazPrefix + 'otherwise');
		_.forEach(_.map(el.childNodes), function(node) {
			var tag = DOM.getTagName(node);
			if (tag === hazPrefix + 'when') return;
			otherwise.appendChild(node);
		});
		el.appendChild(otherwise);
	}

	function markTemplate(el) {
		processor.templates.push(el);
	}

	function implyEntryTemplate(el) { // NOTE this slurps *any* non-<haz:template>
		var firstExplicitTemplate;
		var contentNodes = _.filter(el.childNodes, function(node) {
			var tag = DOM.getTagName(node);
			if (tag === hazPrefix + 'template') {
				if (!firstExplicitTemplate) firstExplicitTemplate = node;
				return false;
			}
			if (tag === hazPrefix + 'var') return false;
			if (tag === hazPrefix + 'param') return false;
			if (node.nodeType === 3 && !(/\S/).test(node.nodeValue)) return false;
			if (node.nodeType !== 1) return false;
			return true;
		});

		if (contentNodes.length <= 0) {
			if (firstExplicitTemplate) return;
			console.warn('This Hazard Template cannot generate any content.');
		}
		var entryTemplate = el.ownerDocument.createElement(hazPrefix + 'template');
		_.forEach(contentNodes, function(node) {
			entryTemplate.appendChild(node);
		});
		el.insertBefore(entryTemplate, firstExplicitTemplate);
		processor.templates.unshift(entryTemplate);
	}

},

getEntryTemplate: function() {
	return this.templates[0];
},

getNamedTemplate: function(name) {
	var processor = this;
	name = _.lc(name);
	return _.find(processor.templates, function(template) {
		return _.lc(template.getAttribute('name')) === name;
	});
},

getMatchingTemplate: function(element) {
	var processor = this;
	return _.find(processor.templates, function(template) {
		if (!template.hasAttribute('match')) return false;
		var expression = template.getAttribute('match');
		return processor.provider.matches(element, expression);
	});	
},

transform: FRAGMENTS_ARE_INERT ?
function(provider, details) { // TODO how to use details
	var processor = this;
	var root = processor.root;
	var doc = root.ownerDocument;
	var frag = doc.createDocumentFragment();
	return processor._transform(provider, details, frag)
	.then(function() {
		return frag;
	});
} :

// NOTE IE11, Edge needs a different transform() because fragments are not inert
function(provider, details) {
	var processor = this;
	var root = processor.root;
	var doc = DOM.createHTMLDocument('', root.ownerDocument);
	var frag = doc.body; // WARN don't know why `doc.body` is inert but fragments aren't
	return processor._transform(provider, details, frag)
	.then(function() {
		frag = childNodesToFragment(frag);
		return frag;
	});
},

_transform: function(provider, details, frag) {
	var processor = this;
	processor.provider = provider;

	processor.globalParams = _.assign({}, details);
	processor.globalVars = {};
	processor.localParams = processor.globalParams;
	processor.localVars = processor.globalVars;
	processor.localParamsStack = [];
	processor.localVarsStack = [];

	processor.variables = {
		has: function(key) {
			var result = 
				key in processor.localVars ||
				key in processor.localParams ||
				key in processor.globalVars ||
				key in processor.globalParams ||
				false;
			return result;
		},
		get: function(key) {
			var result = 
				key in processor.localVars && processor.localVars[key] ||
				key in processor.localParams && processor.localParams[key] ||
				key in processor.globalVars && processor.globalVars[key] ||
				key in processor.globalParams && processor.globalParams[key] ||
				undefined;
			return result;
		},
		set: function(key, value, inParams, isGlobal) {
			var mapName = isGlobal ?
				( inParams ? 'globalParams' : 'globalVars' ) :
				( inParams ? 'localParams' : 'localVars' );
			// NOTE params are write-once
			if (mapName === 'localParams' && key in processor.localParams) return;
			if (mapName === 'globalParams' && key in processor.globalParams) return;
			processor[mapName][key] = value;
		},
		push: function(params) {
			processor.localParamsStack.push(processor.localParams);
			processor.localVarsStack.push(processor.localVars);

			if (typeof params !== 'object' || params == null) params = {};
			processor.localParams = params;
			processor.localVars = {};
		},
		pop: function() {
			processor.localParams = processor.localParamsStack.pop();		
			processor.localVars = processor.localVarsStack.pop();		
		}
	}

	return processor.transformChildNodes(processor.root, null, frag)
	.then(function() {
		var template = processor.getEntryTemplate();
		return processor.transformTemplate(template, null, null, frag);
	});
},

transformTemplate: function(template, context, params, frag) {
	var processor = this;
	processor.variables.push(params);

	return processor.transformChildNodes(template, context, frag)
	.then(function() { 
		processor.variables.pop(); 
		return frag;
	});
},

transformChildNodes: function(srcNode, context, frag) {
	var processor = this;

	return Promise.reduce(null, srcNode.childNodes, function(dummy, current) {
		return processor.transformNode(current, context, frag);
	});
},

transformNode: function(srcNode, context, frag) {
	var processor = this;

	switch (srcNode.nodeType) {
	default: 
		var node = srcNode.cloneNode(true);
		frag.appendChild(node);
		return;
	case 3: // NOTE text-nodes are special-cased for perf testing
		var node = srcNode.cloneNode(true);
		frag.appendChild(node);
		return;
	case 1:
		var details = srcNode.hazardDetails;
		if (details.definition) return processor.transformHazardTree(srcNode, context, frag);
		else return processor.transformTree(srcNode, context, frag);
	}
},

transformHazardTree: function(el, context, frag) {
	var processor = this;
	var doc = el.ownerDocument;

	var details = el.hazardDetails;
	var def = details.definition;

	var invertTest = false; // for haz:if haz:unless

	switch (def.tag) {
	default: // for unknown (or unhandled) haz: elements just process the children
		return processor.transformChildNodes(el, context, frag); 
		
	case 'template':
		return frag;

	case 'var':
		var name = el.getAttribute('name');
		var selector = el.getAttribute('select');
		var value = context;
		if (selector) {
			try {
				value = processor.provider.evaluate(selector, context, processor.variables, false);
			}
			catch (err) {
				Task.postError(err);
				console.warn('Error evaluating <haz:var name="' + name + '" select="' + selector + '">. Assumed empty.');
				value = undefined;
			}
		}

		processor.variables.set(name, value);
		return frag;

	case 'param':
		var name = el.getAttribute('name');
		var selector = el.getAttribute('select');
		var value = context;
		if (selector) {
			try {
				value = processor.provider.evaluate(selector, context, processor.variables, false);
			}
			catch (err) {
				Task.postError(err);
				console.warn('Error evaluating <haz:param name="' + name + '" select="' + selector + '">. Assumed empty.');
				value = undefined;
			}
		}

		processor.variables.set(name, value, true);
		return frag;


	case 'call':
		// FIXME attributes should already be in hazardDetails
		var name = el.getAttribute('name');
		var template = processor.getNamedTemplate(name);
		if (!template) {
			console.warn('Hazard could not find template name=' + name);
			return frag;
		}
	
		return processor.transformTemplate(template, context, null, frag); 

	case 'apply': // WARN only applies to DOM-based provider
		var template = processor.getMatchingTemplate(context);
		var promise = Promise.resolve(el);
		if (template) {
			return processor.transformTemplate(template, context, null, frag);
		}
		var node = context.cloneNode(false);
		frag.appendChild(node);
		return Promise.reduce(null, context.childNodes, function(dummy, child) {
			return processor.transformHazardTree(el, child, node);
		});

	case 'clone': // WARN only applies to DOM-based providers
		var node = context.cloneNode(false);
		frag.appendChild(node);
		return processor.transformChildNodes(el, context, node);

	case 'deepclone': // WARN only applies to DOM-based providers
		var node = context.cloneNode(true);
		frag.appendChild(node);
		// TODO WARN if el has child-nodes
		return frag;

	case 'element':
		// FIXME attributes should already be in hazardDetails
		// FIXME log a warning if this directive has children
		var mexpr = el.getAttribute('name');
		var name = evalMExpression(mexpr, processor.provider, context, processor.variables);
		var type = typeof value;
		if (type !== 'string') return frag;

		var node = doc.createElement(name);
		frag.appendChild(node);
		return processor.transformChildNodes(el, context, node);

	case 'attr':
		// FIXME attributes should already be in hazardDetails
		// FIXME log a warning if this directive has children
		var mexpr = el.getAttribute('name');
		var name = evalMExpression(mexpr, processor.provider, context, processor.variables);
		var type = typeof value;
		if (type !== 'string') return frag;

		var node = doc.createDocumentFragment();
		return processor.transformChildNodes(el, context, node)
		.then(function() {
			value = node.textContent;
			frag.setAttribute(name, value);
			return frag;
		});

	case 'eval':
		// FIXME attributes should already be in hazardDetails
		// FIXME log a warning if this directive has children
		var selector = el.getAttribute('select');
		var value = evalExpression(selector, processor.provider, context, processor.variables, 'node');
		var type = typeof value;
		if (type === 'undefined' || type === 'boolean' || value == null) return frag;
		if (!value.nodeType) { // TODO test performance
			value = htmlToFragment(value, doc);
		}
		frag.appendChild(value);
		return frag;

	case 'mtext':
		// FIXME attributes should already be in hazardDetails
		// FIXME log a warning if this directive has children
		var mexpr = el.getAttribute('select');
		var value = evalMExpression(mexpr, processor.provider, context, processor.variables);
		// FIXME `value` should always already be "text"
		if (type === 'undefined' || type === 'boolean' || value == null) return frag;
		if (!value.nodeType) {
			value = doc.createTextNode(value);
		}
		frag.appendChild(value);
		return frag;

	case 'text':
		// FIXME attributes should already be in hazardDetails
		// FIXME log a warning if this directive has children
		var expr = el.getAttribute('select');
		var value = evalExpression(expr, processor.provider, context, processor.variables, 'text');
		// FIXME `value` should always already be "text"
		var type = typeof value;
		if (type === 'undefined' || type === 'boolean' || value == null) return frag;
		if (!value.nodeType) {
			value = doc.createTextNode(value);
		}
		frag.appendChild(value);
		return frag;

	case 'unless':
		invertTest = true;
	case 'if':
		// FIXME attributes should already be in hazardDetails
		var testVal = el.getAttribute('test');
		var pass = false;
		try {
			pass = evalExpression(testVal, processor.provider, context, processor.variables, 'boolean');
		}
		catch (err) {
			Task.postError(err);
			console.warn('Error evaluating <haz:if test="' + testVal + '">. Assumed false.');
			pass = false;
		}
		if (invertTest) pass = !pass;
		if (!pass) return frag;
		return processor.transformChildNodes(el, context, frag); 

	case 'choose':
		// FIXME attributes should already be in hazardDetails
 		// NOTE if no successful `when` then chooses *first* `otherwise` 		
		var otherwise;
		var when;
		var found = _.some(el.childNodes, function(child) { // TODO .children??
			if (child.nodeType !== 1) return false;
			var childDef = child.hazardDetails.definition;
			if (!childDef) return false;
			if (childDef.tag === 'otherwise') {
				if (!otherwise) otherwise = child;
				return false;
			}
			if (childDef.tag !== 'when') return false;
			var testVal = child.getAttribute('test');
			var pass = evalExpression(testVal, processor.provider, context, processor.variables, 'boolean');
			if (!pass) return false;
			when = child;
			return true;
		});
		if (!found) when = otherwise;
		if (!when) return frag;
		return processor.transformChildNodes(when, context, frag); 

	case 'one': // FIXME refactor common parts with `case 'each':`
		// FIXME attributes should already be in hazardDetails
		var selector = el.getAttribute('select');
		var subContext;
		try {
			subContext = processor.provider.evaluate(selector, context, processor.variables, false);
		}
		catch (err) {
			Task.postError(err);
			console.warn('Error evaluating <haz:one select="' + selector + '">. Assumed empty.');
			return frag;
		}

		if (!subContext) return frag;
		return processor.transformChildNodes(el, subContext, frag);


	case 'each':
		// FIXME attributes should already be in hazardDetails
		var selector = el.getAttribute('select');
		var subContexts;
		try {
			subContexts = processor.provider.evaluate(selector, context, processor.variables, true);
		}
		catch (err) {
			Task.postError(err);
			console.warn('Error evaluating <haz:each select="' + selector + '">. Assumed empty.');
			return frag;
		}

		return Promise.reduce(null, subContexts, function(dummy, subContext) {
			return processor.transformChildNodes(el, subContext, frag);
		});

	}
			
},

transformTree: function(srcNode, context, frag) { // srcNode is Element
	var processor = this;
	
	var nodeType = srcNode.nodeType;
	if (nodeType !== 1) throw Error('transformTree() expects Element');
	var node = processor.transformSingleElement(srcNode, context);
	var nodeAsFrag = frag.appendChild(node); // WARN use returned value not `node` ...
	// ... this allows frag to be a custom object, which in turn 
	// ... allows a different type of output construction

	return processor.transformChildNodes(srcNode, context, nodeAsFrag);
},

transformSingleElement: function(srcNode, context) {
	var processor = this;
	var details = srcNode.hazardDetails;

	el = srcNode.cloneNode(false);

	_.forEach(details.exprAttributes, function(desc) {
		var value;
		try {
			value = (desc.namespaceURI === HAZARD_MEXPRESSION_URN) ?
				processMExpression(desc.mexpression, processor.provider, context, processor.variables) :
				processExpression(desc.expression, processor.provider, context, processor.variables, desc.type);
		}
		catch (err) {
			Task.postError(err);
			console.warn('Error evaluating @' + desc.attrName + '="' + desc.expression + '". Assumed false.');
			value = false;
		}
		setAttribute(el, desc.attrName, value);
	});

	return el;
}

});

function getHazardDetails(el, namespaces) {
	var details = {};
	var tag = DOM.getTagName(el);
	var hazPrefix = namespaces.lookupPrefix(HAZARD_TRANSFORM_URN);
	var isHazElement = tag.indexOf(hazPrefix) === 0;

	if (isHazElement) { // FIXME preprocess attrs of <haz:*>
		tag = tag.substr(hazPrefix.length);
		var def = hazLangLookup[tag];
		details.definition = def || { tag: '' };
	}

	details.exprAttributes = getExprAttributes(el, namespaces);
	return details;
}

function getExprAttributes(el, namespaces) {
	var attrs = [];
	
	var exprNS = namespaces.lookupNamespace(HAZARD_EXPRESSION_URN);
	var mexprNS = namespaces.lookupNamespace(HAZARD_MEXPRESSION_URN);
	_.forEach(_.map(el.attributes), function(attr) {
		var ns = _.find([ exprNS, mexprNS ], function(ns) {
			return (attr.name.indexOf(ns.prefix) === 0);
		});
		if (!ns) return;
		var prefix = ns.prefix;
		var namespaceURI = ns.urn;
		var attrName = attr.name.substr(prefix.length);
		el.removeAttribute(attr.name);
		var desc = {
			namespaceURI: namespaceURI,
			prefix: prefix,
			attrName: attrName,
			type: 'text'
		}
		switch (namespaceURI) {
		case HAZARD_EXPRESSION_URN:
			desc.expression = interpretExpression(attr.value);
			break;
		case HAZARD_MEXPRESSION_URN:
			desc.mexpression = interpretMExpression(attr.value);
			break;
		default: // TODO an error?
			break;
		}
		attrs.push(desc);
	});
	return attrs;
}


function setAttribute(el, attrName, value) {
	var type = typeof value;
	if (type === 'undefined' || type === 'boolean' || value == null) {
		if (!value) el.removeAttribute(attrName);
		else el.setAttribute(attrName, '');
	}
	else {
		el.setAttribute(attrName, value.toString());
	}
}

function evalMExpression(mexprText, provider, context, variables) {
	var mexpr = interpretMExpression(mexprText);
	var result = processMExpression(mexpr, provider, context, variables);
	return result;
}

function evalExpression(exprText, provider, context, variables, type) {
	var expr = interpretExpression(exprText);
	var result = processExpression(expr, provider, context, variables, type);
	return result;
}
	
function interpretMExpression(mexprText) {
	var expressions = [];
	var mexpr = mexprText.replace(/\{\{((?:[^}]|\}(?=\}\})|\}(?!\}))*)\}\}/g, function(all, expr) {
		expressions.push(expr);
		return '{{}}';
	});

	expressions = expressions.map(function(expr) { return interpretExpression(expr); });
	return {
		template: mexpr,
		expressions: expressions
	};
}

function interpretExpression(exprText) { // FIXME robustness
	var expression = {};
	expression.text = exprText;
	var exprParts = exprText.split(PIPE_OPERATOR);
	expression.selector = exprParts.shift();
	expression.filters = [];

	_.forEach(exprParts, function(filterSpec) {
		filterSpec = filterSpec.trim();
		var text = filterSpec;
		var m = text.match(/^([_a-zA-Z][_a-zA-Z0-9]*)\s*(:?)/);
		if (!m) {
			console.warn('Syntax Error in filter call: ' + filterSpec);
			return false;
		}
		var filterName = m[1];
		var hasParams = m[2];
		text = text.substr(m[0].length);
		if (!hasParams && /\S+/.test(text)) {
			console.warn('Syntax Error in filter call: ' + filterSpec);
			return false;
		}

		try {
			var filterParams = (Function('return [' + text + '];'))();
		}
		catch (err) {
			console.warn('Syntax Error in filter call: ' + filterSpec);
			return false;
		}

		expression.filters.push({
			text: filterSpec,
			name: filterName,
			params: filterParams
		});
		return true;
	});

	return expression;
}


function processMExpression(mexpr, provider, context, variables) {
	var i = 0;
	return mexpr.template.replace(/\{\{\}\}/g, function(all) {
		return processExpression(mexpr.expressions[i++], provider, context, variables, 'text');
	});
}

function processExpression(expr, provider, context, variables, type) { // FIXME robustness
	var doc = (context && context.nodeType) ? // TODO which document
		(context.nodeType === 9 ? context : context.ownerDocument) : 
		document; 
	var value = provider.evaluate(expr.selector, context, variables);

	_.every(expr.filters, function(filter) {
		if (value == null) value = '';
		if (value.nodeType) {
			if (value.nodeType === 1) value = value.textContent;
			else value = '';
		}
		try {
			value = filters.evaluate(filter.name, value, filter.params);
			return true;
		}
		catch (err) {
			Task.postError(err);
			console.warn('Failure processing filter call: "' + filter.text + '" with input: "' + value + '"');
			value = '';
			return false;
		}
	});

	result = cast(value, type);
	return result;

	function cast(value, type) {
		switch (type) {
		case 'text':
			if (value && value.nodeType) value = value.textContent;
			break;
		case 'node':
			var frag = doc.createDocumentFragment();
			if (value && value.nodeType) frag.appendChild(doc.importNode(value, true)); // NOTE no adoption
			else {
				var div = doc.createElement('div');
				div.innerHTML = value;
				var node;
				while (node = div.firstChild) frag.appendChild(node); // NOTE no adoption
			}
			value = frag;
			break;
		case 'boolean':
			if (value == null || value === false) value = false;
			else value = true;
			break;
		default: // FIXME should never occur. console.warn !?
			if (value && value.nodeType) value = value.textContent;
			break;
		}
		return value;
	}


}

_.assign(classnamespace, {

HazardProcessor: HazardProcessor

});


}).call(this, this.Meeko);
/*!
 * Builtin Processors
 * Copyright 2016 Sean Hogan (http://meekostuff.net/)
 * Mozilla Public License v2.0 (http://mozilla.org/MPL/2.0/)
 */

(function(classnamespace) {

var global = this;

var Meeko = global.Meeko;
var processors = Meeko.processors;

var MainProcessor = Meeko.MainProcessor;
processors.register('main', MainProcessor);

var ScriptProcessor = Meeko.ScriptProcessor;
processors.register('script', ScriptProcessor);

var HazardProcessor = Meeko.HazardProcessor;
processors.register('hazard', HazardProcessor);

}).call(this, this.Meeko);
/*!
 * HyperFrameset
 * Copyright 2009-2016 Sean Hogan (http://meekostuff.net/)
 * Mozilla Public License v2.0 (http://mozilla.org/MPL/2.0/)
 */

/* NOTE
	+ assumes DOMSprockets
*/
/* TODO
    + substantial error handling and notification needs to be added
    + <link rel="self" />
    + Would be nice if more of the internal functions were called as method, eg DOM.ready()...
        this would allow the boot-script to modify them as appropriate
    + Up-front feature testing to prevent boot on unsupportable platorms...
        e.g. can't create HTML documents
    + use requestAnimationFrame() when available
    + The passing of nodes between documents needs to be audited.
		Safari and IE10,11 in particular seem to require nodes to be imported / adopted
		(not fully understood right now)
 */

(function() {

var window = this;
var document = window.document;


if (!window.XMLHttpRequest) throw Error('HyperFrameset requires native XMLHttpRequest');


var _ = Meeko.stuff; // provided by DOMSprockets

var Task = Meeko.Task;
var Promise = Meeko.Promise;
var URL = Meeko.URL;

/*
 ### DOM utility functions
 */

var DOM = Meeko.DOM;
var htmlParser = Meeko.htmlParser;
var httpProxy = Meeko.httpProxy;
var CustomNamespace = Meeko.CustomNamespace;
var NamespaceCollection = Meeko.NamespaceCollection;
var scriptQueue = Meeko.scriptQueue;

var historyManager = Meeko.historyManager;
var sprockets = Meeko.sprockets;
var controllers = Meeko.controllers;
var filters = Meeko.filters;
var decoders = Meeko.decoders;
var processors = Meeko.processors;


/* BEGIN HFrameset code */

var framer = Meeko.framer = (function() {

// FIXME DRY these @rel values with boot.js
var FRAMESET_REL = 'frameset'; // NOTE http://lists.w3.org/Archives/Public/www-html/1996Dec/0143.html
var SELF_REL = 'self';

var HYPERFRAMESET_URN = 'hyperframeset';
var hfDefaultNamespace = new CustomNamespace({
	name: 'hf',
	style: 'vendor',
	urn: HYPERFRAMESET_URN
});


function registerFormElements() {

var eventConfig = 'form@submit,reset,input,change,invalid input,textarea@input,change,invalid,focus,blur select,fieldset@change,invalid,focus,blur button@click';

var eventTable = (function(config) {

var table = {};
_.forEach(config.split(/\s+/), function(combo) {
	var m = combo.split('@');
	var tags = m[0].split(',');
	var events = m[1].split(',');
	_.forEach(tags, function(tag) {
		table[tag] = _.map(events);
	});
});

return table;

})(eventConfig);


_.forOwn(eventTable, function(events, tag) {

var Interface = sprockets.evolve(sprockets.RoleType, {});
_.assign(Interface, {

attached: function(handlers) {
	var object = this;
	var element = object.element;
	if (!element.hasAttribute('config')) return;
	var configID = _.words(element.getAttribute('config'))[0];	
	var options = framer.definition.configData[configID];
	if (!options) return;
	_.forEach(events, function(type) {
		var ontype = 'on' + type;
		var callback = options[ontype];
		if (!callback) return;

		var fn = function() { callback.apply(object, arguments); };
		object[ontype] = fn;
		handlers.push({
			type: type,
			action: fn
		});
	});
}

});

sprockets.registerElement(tag, Interface);

});

} // END registerFormElements()

// NOTE handlers are registered for "body@submit,reset,input,change" in HFrameset
function registerBodyAsPseudoForm(object, handlers) {
	var element = object.element;
	if (!element.hasAttribute('config')) return;
	var configID = _.words(element.getAttribute('config'))[0];	
	var options = framer.definition.configData[configID];
	if (!options) return;

	var events = _.words('submit reset change input');
	var needClickWatcher = false;

	_.forEach(events, function(type) {
		var ontype = 'on' + type;
		var callback = options[ontype];
		if (!callback) return;

		var fn = function(e) { 
			if (DOM.closest(e.target, 'form')) return;
			callback.apply(object, arguments); 
		};
		object[ontype] = fn;
		handlers.push({
			type: type,
			action: fn
		});
		
		switch (type) {
		default: break;
		case 'submit': case 'reset': needClickWatcher = true;
		}
	});

	if (needClickWatcher) {
		document.addEventListener('click', function(e) { 
			if (DOM.closest(e.target, 'form')) return;
			var type = e.target.type;
			if (!(type === 'submit' || type === 'reset')) return;
			Task.asap(function() {
				var pseudoEvent = document.createEvent('CustomEvent');
				// NOTE pseudoEvent.detail = e.target
				pseudoEvent.initCustomEvent(type, true, true, e.target);
				pseudoEvent.preventDefault();
				element.dispatchEvent(pseudoEvent);
			});
		}, false);
	}
}


/*
 * HyperFrameset definitions
 */

var hfHeadTags = _.words('title meta link style script');

var HFrameDefinition = (function() {

function HFrameDefinition(el, framesetDef) {
	if (!el) return; // in case of inheritance
	this.framesetDefinition = framesetDef;
	this.init(el);
}

_.defaults(HFrameDefinition.prototype, {

init: function(el) {
    var frameDef = this;
	var framesetDef = frameDef.framesetDefinition;
	_.defaults(frameDef, {
		element: el,
		mainSelector: el.getAttribute('main') // TODO consider using a hash in `@src`
    });
	var bodies = frameDef.bodies = [];
	_.forEach(_.map(el.childNodes), function(node) {
		var tag = DOM.getTagName(node);
		if (!tag) return;
		if (_.includes(hfHeadTags, tag)) return; // ignore typical <head> elements
		if (tag === framesetDef.namespaces.lookupTagNameNS('body', HYPERFRAMESET_URN)) {
			el.removeChild(node);
			bodies.push(new HBodyDefinition(node, framesetDef));
			return;
		}
		console.warn('Unexpected element in HFrame: ' + tag);
		return;
	});

	// FIXME create fallback bodies
},

render: function(resource, condition, details) {
	var frameDef = this;
	var framesetDef = frameDef.framesetDefinition;
	if (!details) details = {};
	_.defaults(details, { // TODO more details??
		scope: framer.scope,
		url: resource && resource.url,
		mainSelector: frameDef.mainSelector,
	});
	var bodyDef = _.find(frameDef.bodies, function(body) { return body.condition === condition;});
	if (!bodyDef) return; // FIXME what to do here??
	return bodyDef.render(resource, details);
}

	
});

return HFrameDefinition;
})();


var HBodyDefinition = (function() {
	
function HBodyDefinition(el, framesetDef) {
	if (!el) return; // in case of inheritance
	this.framesetDefinition = framesetDef;
	this.init(el);
}

var conditions = _.words('uninitialized loading loaded error');

var conditionAliases = {
	'blank': 'uninitialized',
	'waiting': 'loading',
	'interactive': 'loaded',
	'complete': 'loaded'
}

function normalizeCondition(condition) {
	condition = _.lc(condition);
	if (_.includes(conditions, condition)) return condition;
	return conditionAliases[condition];
}

_.defaults(HBodyDefinition, {
	
conditions: conditions,
conditionAliases: conditionAliases

});

_.defaults(HBodyDefinition.prototype, {

init: function(el) {
	var bodyDef = this;
	var framesetDef = bodyDef.framesetDefinition;
	var condition = el.getAttribute('condition');
	var finalCondition;
	if (condition) {
		finalCondition = normalizeCondition(condition);
		if (!finalCondition) {
			finalCondition = condition;
			console.warn('Frame body defined with unknown condition: ' + condition);
		}
	}
	else finalCondition = 'loaded';
		
	_.defaults(bodyDef, {
		element: el,
		condition: finalCondition,
		transforms: []
	});
	_.forEach(_.map(el.childNodes), function(node) {
		if (DOM.getTagName(node) === framesetDef.namespaces.lookupTagNameNS('transform', HYPERFRAMESET_URN)) {
			el.removeChild(node);
			bodyDef.transforms.push(new HTransformDefinition(node, framesetDef));
		}	
	});
	if (!bodyDef.transforms.length && bodyDef.condition === 'loaded') {
		console.warn('HBody definition for loaded content contains no HTransform definitions');
	}
},

render: function(resource, details) {
	var bodyDef = this;
	var framesetDef = bodyDef.framesetDefinition;
	if (bodyDef.transforms.length <= 0) {
		return bodyDef.element.cloneNode(true);
	}
	if (!resource) return null;
	var doc = resource.document; // FIXME what if resource is a Request?
	if (!doc) return null;
	var frag0 = doc;
	if (details.mainSelector) frag0 = DOM.find(details.mainSelector, doc);

	return Promise.reduce(frag0, bodyDef.transforms, function(fragment, transform) {
		return transform.process(fragment, details);
	})
	.then(function(fragment) {
		var el = bodyDef.element.cloneNode(false);
		// crop to <body> if it exists
		var htmlBody = DOM.find('body', fragment);
		if (htmlBody) fragment = DOM.adoptContents(htmlBody, el.ownerDocument);
		// remove all stylesheets
		_.forEach(DOM.findAll('link[rel~=stylesheet], style', fragment), function(node) {
			node.parentNode.removeChild(node);
		});
		DOM.insertNode('beforeend', el, fragment);
		return el;
	});
}

});

return HBodyDefinition;
})();


var HTransformDefinition = (function() {
	
function HTransformDefinition(el, framesetDef) {
	if (!el) return; // in case of inheritance
	this.framesetDefinition = framesetDef;
	this.init(el);
}

_.defaults(HTransformDefinition.prototype, {

init: function(el) {
	var transform = this;
	var framesetDef = transform.framesetDefinition;
	_.defaults(transform, {
		element: el,
		type: el.getAttribute('type') || 'main',
		format: el.getAttribute('format')
    });
	if (transform.type === 'main') transform.format = '';
	var doc = framesetDef.document; // or el.ownerDocument
	var frag = doc.createDocumentFragment();
	var node;
	while (node = el.firstChild) frag.appendChild(node); // NOTE no adoption

	var options;
	if (el.hasAttribute('config')) {
		var configID = _.words(el.getAttribute('config'))[0];
		options = framesetDef.configData[configID];
	}
	var processor = transform.processor = processors.create(transform.type, options, framesetDef.namespaces);
	processor.loadTemplate(frag);
},

process: function(srcNode, details) {
	var transform = this;
	var framesetDef = transform.framesetDefinition;
	var decoder;
	if (transform.format) {
		decoder = decoders.create(transform.format, {}, framesetDef.namespaces);
		decoder.init(srcNode);
	}
	else decoder = {
		srcNode: srcNode
	}
	var processor = transform.processor;
	var output = processor.transform(decoder, details);
	return output;
}

});

return HTransformDefinition;
})();


var HFramesetDefinition = (function() {

function HFramesetDefinition(doc, settings) {
	if (!doc) return; // in case of inheritance
	this.namespaces = null;
	this.init(doc, settings);
}

_.defaults(HFramesetDefinition.prototype, {

init: function(doc, settings) {
	var framesetDef = this;
	_.defaults(framesetDef, {
		url: settings.framesetURL
	});

	var namespaces = framesetDef.namespaces = CustomNamespace.getNamespaces(doc);
	if (!namespaces.lookupNamespace(HYPERFRAMESET_URN)) {
		namespaces.add(hfDefaultNamespace);
	}

	// NOTE first rebase scope: urls
	var scopeURL = URL(settings.scope);
	rebase(doc, scopeURL);
	var frameElts = DOM.findAll(
		framesetDef.namespaces.lookupSelector('frame', HYPERFRAMESET_URN), 
		doc.body);
	_.forEach(frameElts, function(el, index) { // FIXME hyperframes can't be outside of <body> OR descendants of repetition blocks
		// NOTE first rebase @src with scope: urls
		var src = el.getAttribute('src');
		if (src) {
			var newSrc = rebaseURL(src, scopeURL);
			if (newSrc != src) el.setAttribute('src', newSrc);
		}
	});

	// warn about not using @id
	var idElements = DOM.findAll('*[id]:not(script)', doc.body);
	if (idElements.length) {
		console.warn('@id is strongly discouraged in frameset-documents (except on <script>).\n' +
			'Found ' + idElements.length + ', ' + 
			'first @id is ' + idElements[0].getAttribute('id')
		);
	}

	// Add @id and @sourceurl to inline <script type="text/javascript">
	var scripts = DOM.findAll('script', doc);
	_.forEach(scripts, function(script, i) {
		// ignore non-javascript scripts
		if (script.type && !/^text\/javascript/.test(script.type)) return;
		// ignore external scripts
		if (script.hasAttribute('src')) return;
		var id = script.id;
		// TODO generating ID always has a chance of duplicating IDs
		if (!id) id = script.id = 'script[' + i + ']'; // FIXME doc that i is zero-indexed
		var sourceURL;
		if (script.hasAttribute('sourceurl')) sourceURL = script.getAttribute('sourceurl');
		else {
			sourceURL = framesetDef.url + '__' + id; // FIXME this should be configurable
			script.setAttribute('sourceurl', sourceURL);
		}
		script.text += '\n//# sourceURL=' + sourceURL;
	});

	
	var firstChild = doc.body.firstChild;
	_.forEach(DOM.findAll('script[for]', doc.head), function(script) {
		doc.body.insertBefore(script, firstChild);
		script.setAttribute('for', '');
		console.info('Moved <script for> in frameset <head> to <body>');
	});

	var allowedScope = 'panel, frame';
	var allowedScopeSelector = framesetDef.namespaces.lookupSelector(allowedScope, HYPERFRAMESET_URN);
	normalizeScopedStyles(doc, allowedScopeSelector);

	var body = doc.body;
	body.parentNode.removeChild(body);
	framesetDef.document = doc;
	framesetDef.element = body;
},

preprocess: function() {
	var framesetDef = this;
	var body = framesetDef.element;
	_.defaults(framesetDef, {
		configData: {}, // Indexed by @sourceURL
		frames: {} // all hyperframe definitions. Indexed by @defid (which may be auto-generated)
	});

	var scripts = DOM.findAll('script', body);
	_.forEach(scripts, function(script, i) {
		// Ignore non-javascript scripts
		if (script.type && !/^text\/javascript/.test(script.type)) return;

		if (script.hasAttribute('src')) { // external javascript in <body> is invalid
			console.warn('Frameset <body> may not contain external scripts: \n' +
				script.cloneNode(false).outerHTML);
			script.parentNode.removeChild(script);
			return;
		}

		var sourceURL = script.getAttribute('sourceurl');

		if (!script.hasAttribute('for')) {
			var newScript = script.cloneNode(true);

			try {
				DOM.insertNode('beforeend', document.head, newScript);
			}
			catch(err) { // TODO test if this actually catches script errors
				console.warn('Error evaluating inline script in frameset:\n' +
					framesetDef.url + '#' + script.id);
				Task.postError(err);
			}
			script.parentNode.removeChild(script); // physical <script> no longer needed
			return;
		}

		if (script.getAttribute('for') !== '') {
			console.warn('<script> may only contain EMPTY @for: \n' +
				script.cloneNode(false).outerHTML);
			script.parentNode.removeChild(script);
			return;
		}

		var scriptFor = script;
		while (scriptFor = scriptFor.previousSibling) {
			if (scriptFor.nodeType !== 1) continue;
			var tag = DOM.getTagName(scriptFor);
			if (tag !== 'script' && tag !== 'style') break;
		}
		if (!scriptFor) scriptFor = script.parentNode;
		
		// FIXME @config shouldn't be hard-wired here
		var configID = scriptFor.hasAttribute('config') ? 
			scriptFor.getAttribute('config') :
			'';
		// TODO we can add more than one @config to an element but only first is used
		configID = configID ?
			configID.replace(/\s*$/, ' ' + sourceURL) :
			sourceURL;
		scriptFor.setAttribute('config', configID);

		var fnText = 'return (' + script.text + '\n);';

		try {
			var fn = Function(fnText);
			var object = fn();
			framesetDef.configData[sourceURL] = object;
		}
		catch(err) { 
			console.warn('Error evaluating inline script in frameset:\n' +
				framesetDef.url + '#' + script.id);
			Task.postError(err);
		}

		script.parentNode.removeChild(script); // physical <script> no longer needed
	});

	var frameElts = DOM.findAll(
		framesetDef.namespaces.lookupSelector('frame', HYPERFRAMESET_URN), 
		body);
	var frameDefElts = [];
	var frameRefElts = [];
	_.forEach(frameElts, function(el, index) { // FIXME hyperframes can't be outside of <body> OR descendants of repetition blocks

		// NOTE even if the frame is only a declaration (@def && @def !== @defid) it still has its content removed
		var placeholder = el.cloneNode(false);
		el.parentNode.replaceChild(placeholder, el); // NOTE no adoption

		var defId = el.getAttribute('defid');
		var def = el.getAttribute('def');
		if (def && def !== defId) {
			frameRefElts.push(el);
			return;
		}
		if (!defId) {
			defId = '__frame_' + index + '__'; // FIXME not guaranteed to be unique. Should be a function at top of module
			el.setAttribute('defid', defId);
		}
		if (!def) {
			def = defId;
			placeholder.setAttribute('def', def);
		}
		frameDefElts.push(el);
	});
	_.forEach(frameDefElts, function(el) {
		var defId = el.getAttribute('defid');
		framesetDef.frames[defId] = new HFrameDefinition(el, framesetDef);
	});
	_.forEach(frameRefElts, function(el) {
		var def = el.getAttribute('def');
		var ref = framesetDef.frames[def];
		if (!ref) {
			console.warn('Frame declaration references non-existant frame definition: ' + def);
			return;
		}
		var refEl = ref.element;
		if (!refEl.hasAttribute('scopeid')) return;
		var id = el.getAttribute('id');
		if (id) {
			console.warn('Frame declaration references a frame definition with scoped-styles but these cannot be applied because the frame declaration has its own @id: ' + id);
			return;
		}
		id = refEl.getAttribute('id');
		var scopeId = refEl.getAttribute('scopeid');
		if (id !== scopeId) {
			console.warn('Frame declaration references a frame definition with scoped-styles but these cannot be applied because the frame definition has its own @id: ' + id);
			return;
		}
		el.setAttribute('id', scopeId);
	});

},

render: function() {
	var framesetDef = this;
	return framesetDef.element.cloneNode(true);
}

});

/*
 Rebase scope URLs:
	scope:{path}
 is rewritten with `path` being relative to the current scope.
 */

var urlAttributes = URL.attributes;

function rebase(doc, scopeURL) {
	_.forOwn(urlAttributes, function(attrList, tag) {
		_.forEach(DOM.findAll(tag, doc), function(el) {
			_.forOwn(attrList, function(attrDesc, attrName) {
				var relURL = el.getAttribute(attrName);
				if (relURL == null) return;
				var url = rebaseURL(relURL, scopeURL);
				if (url != relURL) el[attrName] = url;
			});
		});
	});
}

function rebaseURL(url, baseURL) {
	var relURL = url.replace(/^scope:/i, '');
	if (relURL == url) return url;
	return baseURL.resolve(relURL);
}

function normalizeScopedStyles(doc, allowedScopeSelector) {
	var scopedStyles = DOM.findAll('style[scoped]', doc.body);
	var dummyDoc = document.implementation.createHTMLDocument('');
	_.forEach(scopedStyles, function(el, index) {
		var scope = el.parentNode;
		if (!DOM.matches(scope, allowedScopeSelector)) {
			console.warn('Removing <style scoped>. Must be child of ' + allowedScopeSelector);
			scope.removeChild(el);
			return;
		}
		
		var scopeId = '__scope_' + index + '__';
		scope.setAttribute('scopeid', scopeId);
		if (scope.hasAttribute('id')) scopeId = scope.getAttribute('id');
		else scope.setAttribute('id', scopeId);

		el.removeAttribute('scoped');
		var sheet = el.sheet || (function() {
			// Firefox doesn't seem to instatiate el.sheet in XHR documents
			var dummyEl = dummyDoc.createElement('style');
			dummyEl.textContent = el.textContent;
			DOM.insertNode('beforeend', dummyDoc.head, dummyEl);
			return dummyEl.sheet;
		})();
		forRules(sheet, processRule, scope);
		var cssText = _.map(sheet.cssRules, function(rule) { 
				return rule.cssText; 
			}).join('\n');
		el.textContent = cssText;
		DOM.insertNode('beforeend', doc.head, el);
		return;
	});
}

function processRule(rule, id, parentRule) {
	var scope = this;
	switch (rule.type) {
	case 1: // CSSRule.STYLE_RULE
		// prefix each selector in selector-chain with scopePrefix
		// selector-chain is split on COMMA (,) that is not inside BRACKETS. Technically: not followed by a RHB ')' unless first followed by LHB '(' 
		var scopeId = scope.getAttribute('scopeid');
		var scopePrefix = '#' + scopeId + ' ';
		var selectorText = scopePrefix + rule.selectorText.replace(/,(?![^(]*\))/g, ', ' + scopePrefix); 
		var cssText = rule.cssText.replace(rule.selectorText, '');
		cssText = selectorText + ' ' + cssText;
		parentRule.deleteRule(id);
		parentRule.insertRule(cssText, id);
		break;

	case 11: // CSSRule.COUNTER_STYLE_RULE
		break;

	case 4: // CSSRule.MEDIA_RULE
	case 12: // CSSRule.SUPPORTS_RULE
		forRules(rule, processRule, scope);
		break;
	
	default:
		console.warn('Deleting invalid rule for <style scoped>: \n' + rule.cssText);
		parentRule.deleteRule(id);
		break;
	}
}

function forRules(parentRule, callback, context) {
	var ruleList = parentRule.cssRules;
	for (var i=ruleList.length-1; i>=0; i--) callback.call(context, ruleList[i], i, parentRule);
}
	

return HFramesetDefinition;	
})();


/*
 * HyperFrameset sprockets
 */

// All HyperFrameset sprockets inherit from Base
var Base = (function() {

var Base = sprockets.evolve(sprockets.RoleType, {

});

_.assign(Base, {

iAttached: function(handlers) {
	var object = this;
	object.options = {};
	var element = object.element;
	if (!element.hasAttribute('config')) return;
	var configID = _.words(element.getAttribute('config'))[0];	
	var options = framer.definition.configData[configID];
	object.options = options;
}

});

return Base;
})();

// Almost all HyperFrameset sprockets inherit from Link
var Link = (function() {

var Link = sprockets.evolve(Base, {

role: 'link', // FIXME probably doesn't match functionality of aria "link"

lookup: function(url, details) {
	var link = this;
	var options = link.options;
	if (!options || !options.lookup) return false;
	var partial = options.lookup(url, details);
	if (partial === '' || partial === true) return true;
	if (partial == null || partial === false) return false;
	return inferChangeset(url, partial);
}

});

_.assign(Link, {

iAttached: function(handlers) {
	var object = this;
	var options = object.options;
	if (!options.lookup) return;

	handlers.push({
		type: 'requestnavigation',
		action: function(e) {
			if (e.defaultPrevented) return;
			var acceptDefault = framer.onRequestNavigation(e, this);
			if (acceptDefault === false) e.preventDefault();
		}
	});
}

});

return Link;
})();



var Layer = (function() {

var Layer = sprockets.evolve(Base, {

role: 'layer'

});

var zIndex = 1;

_.assign(Layer, {

iAttached: function(handlers) {
	this.css('z-index', zIndex++);
},

attached: function(handlers) {
	Base.iAttached.call(this, handlers);
	Layer.iAttached.call(this, handlers);
}

});

return Layer;
})();

var Popup = (function() {

var Popup = sprockets.evolve(Base, {

role: 'popup',

});

_.assign(Popup, {

attached: function(handlers) {
	Base.iAttached.call(this, handlers);
},

iEnteredDocument: function() {
	var panel = this;
	var name = panel.attr('name'); 
	var value = panel.attr('value'); 
	if (!name && !value) return;
	panel.ariaToggle('hidden', true);
	if (!name) return; // being controlled by an ancestor
	controllers.listen(name, function(values) {
		panel.ariaToggle('hidden', !(_.includes(values, value)));
	});
},

enteredDocument: function() {
	Popup.iEnteredDocument.call(this);
}

});

return Popup;
})();

var Panel = (function() {

var Panel = sprockets.evolve(Link, {

role: 'panel',

});

_.assign(Panel, {

iAttached: function(handlers) {
	var overflow = this.attr('overflow');
	if (overflow) this.css('overflow', overflow); // FIXME sanity check
	var height = this.attr('height');
	if (height) this.css('height', height); // FIXME units
	var width = this.attr('width');
	if (width) this.css('width', width); // FIXME units
	var minWidth = this.attr('minwidth');
	if (minWidth) this.css('min-width', minWidth); // FIXME units
}, 

attached: function(handlers) {
	Base.iAttached.call(this, handlers);
	Link.iAttached.call(this, handlers);
	Panel.iAttached.call(this, handlers);
},

iEnteredDocument: function() {
	var panel = this;
	var name = panel.attr('name'); 
	var value = panel.attr('value'); 
	if (!name && !value) return;
	panel.ariaToggle('hidden', true);
	if (!name) return; // being controlled by an ancestor
	controllers.listen(name, function(values) {
		panel.ariaToggle('hidden', !(_.includes(values, value)));
	});
},

enteredDocument: function() {
	Panel.iEnteredDocument.call(this);
}

});

return Panel;
})();

var Layout = (function() { // a Layout is a list of Panel (or other Layout) and perhaps separators for hlayout, vlayout

var Layout = sprockets.evolve(Link, {

role: 'group',

owns: {
	get: function() { 
		var namespaces = framer.definition.namespaces;
		return _.filter(this.element.children, function(el) { 
			return DOM.matches(el, 
				namespaces.lookupSelector(
					'hlayout, vlayout, deck, rdeck, panel, frame', 
					HYPERFRAMESET_URN
				)
			); 
		}); 
	}
}

});

_.assign(Layout, {

iEnteredDocument: function() {
	var namespaces = framer.definition.namespaces;
	var element = this.element;
	var parent = element.parentNode;

	// FIXME dimension setting should occur before becoming visible
	if (DOM.matches(parent, namespaces.lookupSelector('layer', HYPERFRAMESET_URN))) { // TODO vh, vw not tested on various platforms
		var height = this.attr('height'); // TODO css unit parsing / validation
		if (!height) height = '100vh';
		else height = height.replace('%', 'vh');
		this.css('height', height); // FIXME units
		var width = this.attr('width'); // TODO css unit parsing / validation
		if (!width) width = '100vw';
		else width = width.replace('%', 'vw');
		if (width) this.css('width', width); // FIXME units
	}
	_.forEach(_.map(element.childNodes), normalizeChild, element);
	return;
	
	function normalizeChild(node) {
		var element = this;
		if (DOM.matches(node, namespaces.lookupSelector('hlayout, vlayout, deck, rdeck, panel, frame', HYPERFRAMESET_URN))) return; 
		switch (node.nodeType) {
		case 1: // hide non-layout elements
			node.hidden = true;
			return;
		case 3: // hide text nodes by wrapping in <wbr hidden>
			if (/^\s*$/.test(node.nodeValue )) {
				element.removeChild(node);
				return;
			}
			var wbr = element.ownerDocument.createElement('wbr');
			wbr.hidden = true;
			element.replaceChild(wbr, node); // NOTE no adoption
			wbr.appendChild(node); // NOTE no adoption
			return;
		default:
			return;
		}
	}
},

enteredDocument: function() {
	Panel.iEnteredDocument.call(this);
	Layout.iEnteredDocument.call(this);
}

});

return Layout;
})();

var VLayout = (function() {

var VLayout = sprockets.evolve(Layout, {
});

_.assign(VLayout, {

iAttached: function() {
	var hAlign = this.attr('align'); // FIXME assert left/center/right/justify - also start/end (stretch?)
	if (hAlign) this.css('text-align', hAlign); // NOTE defaults defined in <style> above
},

attached: function(handlers) {
	Base.iAttached.call(this, handlers);
	Link.iAttached.call(this, handlers);
	Panel.iAttached.call(this, handlers);
	VLayout.iAttached.call(this, handlers);
},

enteredDocument: function() {
	Panel.iEnteredDocument.call(this);
	Layout.iEnteredDocument.call(this);
}

});

return VLayout;
})();

var HLayout = (function() {

var HLayout = sprockets.evolve(Layout, {
});

_.assign(HLayout, {

attached: function(handlers) {
	Base.iAttached.call(this, handlers);
	Link.iAttached.call(this, handlers);
	Panel.iAttached.call(this, handlers);
},

iEnteredDocument: function() {
	var vAlign = this.attr('align'); // FIXME assert top/middle/bottom/baseline - also start/end (stretch?)
	_.forEach(this.ariaGet('owns'), function(panel) {
		if (vAlign) panel.$.css('vertical-align', vAlign);
	});
},

enteredDocument: function() {
	Panel.iEnteredDocument.call(this);
	Layout.iEnteredDocument.call(this);
	HLayout.iEnteredDocument.call(this);
}

});

return HLayout;
})();

var Deck = (function() {

var Deck = sprockets.evolve(Layout, {

activedescendant: {
	set: function(item) { // if !item then hide all children
		
		var element = this.element;
		var panels = this.ariaGet('owns');
		if (item && !_.includes(panels, item)) throw Error('set activedescendant failed: item is not child of deck');
		_.forEach(panels, function(child) {
			if (child === item) child.ariaToggle('hidden', false);
			else child.ariaToggle('hidden', true);
		});
	
	}
}

	
});

_.assign(Deck, {

attached: function(handlers) {
	Base.iAttached.call(this, handlers);
	Link.iAttached.call(this, handlers);
	Panel.iAttached.call(this, handlers);
},

iEnteredDocument: function() {
	var deck = this;
	var name = deck.attr('name'); 
	if (!name) {
		deck.ariaSet('activedescendant', deck.ariaGet('owns')[0]);
		return;
	}
	controllers.listen(name, function(values) {
		var panels = deck.ariaGet('owns');
		var activePanel = _.find(panels, function(child) { 
			var value = child.getAttribute('value');
			if (!_.includes(values, value)) return false;
			return true;
		});
		if (activePanel) deck.ariaSet('activedescendant', activePanel);
	});

},

enteredDocument: function() {
	Layout.iEnteredDocument.call(this);
	Deck.iEnteredDocument.call(this);
}

});

return Deck;
})();

var ResponsiveDeck = (function() {

var ResponsiveDeck = sprockets.evolve(Deck, {
	
});

_.assign(ResponsiveDeck, {

attached: function(handlers) {
	Base.iAttached.call(this, handlers);
	Link.iAttached.call(this, handlers);
	Panel.iAttached.call(this, handlers);
	Deck.iAttached.call(this, handlers);
},

iEnteredDocument: function() {
	var width = parseFloat(window.getComputedStyle(this.element, null).width);
	var panels = this.ariaGet('owns');
	var activePanel = _.find(panels, function(panel) {
		var minWidth = window.getComputedStyle(panel, null).minWidth;
		if (minWidth == null || minWidth === '' || minWidth === '0px') return true;
		minWidth = parseFloat(minWidth); // FIXME minWidth should be "NNNpx" but need to test
		if (minWidth > width) return false;
		return true;
	});
	if (activePanel) {
		activePanel.$.css('height', '100%');
		activePanel.$.css('width', '100%');
		this.ariaSet('activedescendant', activePanel);
	}
},

enteredDocument: function() {
	Layout.iEnteredDocument.call(this);
	Panel.iEnteredDocument.call(this);
	Deck.iEnteredDocument.call(this);
	ResponsiveDeck.iEnteredDocument.call(this);
}

});

return ResponsiveDeck;
})();


var HFrame = (function() {

var HFrame = sprockets.evolve(Panel, {

role: 'frame',

frameEntered: function(frame) {
	this.frames.push(frame);
},

frameLeft: function(frame) {
	var index = this.frames.indexOf(frame);
	this.frames.splice(index);
},

preload: function(request) {
	var frame = this;
	return Promise.pipe(request, [
		
	function(request) { return frame.definition.render(request, 'loading'); },
	function(result) {
		if (!result) return;
		return frame.insert(result);
	}
	
	]);
},

load: function(response) { // FIXME need a teardown method that releases child-frames	
	var frame = this;
	if (response) frame.src = response.url;
	// else a no-src frame
	return Promise.pipe(response, [
	
	function(response) { 
		return frame.definition.render(response, 'loaded', {
			mainSelector: frame.mainSelector
			}); 
	},
	function(result) {
		if (!result) return;
		return frame.insert(result);
	}

	]);
},

insert: function(bodyElement) { // FIXME need a teardown method that releases child-frames	
	var frame = this;
	
	var options = frame.options;

	// FIXME .bodyElement will probably become .bodies[] for transition animations.
	if (frame.bodyElement) {
		if (options && options.bodyLeft) {
			try { options.bodyLeft(frame, frame.bodyElement); } 
			catch (err) { Task.postError(err); }
		}
		sprockets.removeNode(frame.bodyElement);
	}

	sprockets.insertNode('beforeend', frame.element, bodyElement);
	frame.bodyElement = bodyElement;

	if (options && options.bodyEntered) {
		try { options.bodyEntered(frame, frame.bodyElement); } 
		catch (err) { Task.postError(err); }
	}
},

});

_.assign(HFrame, {

iAttached: function() {
	var frame = this;
	var def = frame.attr('def');
	frame.definition = framer.definition.frames[def];
	_.defaults(frame, {
		frames: [],
		bodyElement: null,
		targetname: frame.attr('targetname'),
		src: frame.attr('src'),
		mainSelector: frame.attr('main') // TODO consider using a hash in `@src`
    });
},
attached: function(handlers) {
	Base.iAttached.call(this, handlers);
	Link.iAttached.call(this, handlers);
	Panel.iAttached.call(this, handlers);
	HFrame.iAttached.call(this, handlers);
},
iEnteredDocument: function() {
	var frame = this;
	framer.frameEntered(frame);
},
enteredDocument: function() {
	Panel.iEnteredDocument.call(this);
	HFrame.iEnteredDocument.call(this);
},
iLeftDocument: function() {
	var frame = this;
	framer.frameLeft(frame);
},
leftDocument: function() {
	this.iLeftDocument();
}

});

return HFrame;	
})();


var HFrameset = (function() {
	
var HFrameset = sprockets.evolve(Link, {

role: 'frameset',
isFrameset: true,

frameEntered: function(frame) {
	this.frames.push(frame);
},

frameLeft: function(frame) {
	var index = this.frames.indexOf(frame);
	this.frames.splice(index);
},

render: function() {

	var frameset = this;
	var definition = frameset.definition;
	var dstBody = this.element;

	var srcBody = definition.render();
	
	return Promise.pipe(null, [

	function() {
		_.forEach(_.map(srcBody.childNodes), function(node) {
			sprockets.insertNode('beforeend', dstBody, node);
		});
	}

	]);

}

});

_.assign(HFrameset, {

iAttached: function() {
	var frameset = this;
	frameset.definition = framer.definition;
	_.defaults(frameset, {
		frames: []
	});
}, 
attached: function(handlers) {
	Base.iAttached.call(this, handlers);
	Link.iAttached.call(this, handlers);
	HFrameset.iAttached.call(this, handlers);
	registerBodyAsPseudoForm(this, handlers); // NOTE not .call()
},
iEnteredDocument: function() {
	var frameset = this;
	framer.framesetEntered(frameset);
	frameset.render();
},
enteredDocument: function() {
	HFrameset.iEnteredDocument.call(this);
},
iLeftDocument: function() { // FIXME should never be called??
	var frameset = this;
	framer.framesetLeft(frameset);
},
leftDocument: function() {
	HFrameset.iLeftDocument.call(this);
}

});


_.defaults(HFrameset, {
	
prepare: function(dstDoc, definition) {

	if (getFramesetMarker(dstDoc)) throw Error('The HFrameset has already been applied');

	var srcDoc = DOM.cloneDocument(definition.document);

	var selfMarker;
	
	return Promise.pipe(null, [

	function() { // remove all <link rel=stylesheet /> just in case
		// FIXME maybe remove all <link>
		var dstHead = dstDoc.head;
		_.forEach(DOM.findAll('link[rel|=stylesheet]', dstHead), function(node) {
			dstHead.removeChild(node);
		});
	},

	function() { // empty the body
		var dstBody = dstDoc.body;
		var node;
		while (node = dstBody.firstChild) dstBody.removeChild(node);
	},

	function() {
		selfMarker = getSelfMarker(dstDoc);
		if (selfMarker) return;
		selfMarker = dstDoc.createElement('link');
		selfMarker.rel = SELF_REL;
		selfMarker.href = dstDoc.URL;
		dstDoc.head.insertBefore(selfMarker, dstDoc.head.firstChild); // NOTE no adoption
	},

	function() {
		var framesetMarker = dstDoc.createElement('link');
		framesetMarker.rel = FRAMESET_REL;
		framesetMarker.href = definition.src;
		dstDoc.head.insertBefore(framesetMarker, selfMarker); // NOTE no adoption
	},
	
	function() {
		mergeElement(dstDoc.documentElement, srcDoc.documentElement);
		mergeElement(dstDoc.head, srcDoc.head);
		mergeHead(dstDoc, srcDoc.head, true);
		// allow scripts to run. FIXME scripts should always be appended to document.head
		_.forEach(DOM.findAll('script', dstDoc.head), function(script) {
			scriptQueue.push(script);
		});
		return scriptQueue.empty();
	}
	
	]);

},

prerender: function(dstDoc, definition) { // FIXME where does this go
	var srcBody = definition.element;
	var dstBody = document.body;
	mergeElement(dstBody, srcBody);
}

});

// TODO separateHead and mergeHead are only called with isFrameset === true
function separateHead(dstDoc, isFrameset) {
	var dstHead = dstDoc.head;
	var framesetMarker = getFramesetMarker(dstDoc);
	if (!framesetMarker) throw Error('No ' + FRAMESET_REL + ' marker found. ');

	var selfMarker = getSelfMarker(dstDoc);
	// remove frameset / page elements except for <script type=text/javascript>
	if (isFrameset) _.forEach(DOM.siblings('after', framesetMarker, 'before', selfMarker), remove);
	else _.forEach(DOM.siblings('after', selfMarker), remove);
	
	function remove(node) {
		if (DOM.getTagName(node) == 'script' && (!node.type || node.type.match(/^text\/javascript/i))) return;
		dstHead.removeChild(node);
	}
}

function mergeHead(dstDoc, srcHead, isFrameset) {
	var baseURL = URL(dstDoc.URL);
	var dstHead = dstDoc.head;
	var framesetMarker = getFramesetMarker();
	if (!framesetMarker) throw Error('No ' + FRAMESET_REL + ' marker found. ');
	var selfMarker = getSelfMarker();

	separateHead(dstDoc, isFrameset);

	_.forEach(_.map(srcHead.childNodes), function(srcNode) {
		if (srcNode.nodeType != 1) return;
		switch (DOM.getTagName(srcNode)) {
		default:
			break;
		case 'title':
			if (isFrameset) return; // ignore <title> in frameset. FIXME what if topic content has no <title>?
			if (!srcNode.innerHTML) return; // IE will add a title even if non-existant
			break;
		case 'link': // FIXME no duplicates @rel, @href pairs
			break;
		case 'meta': // FIXME no duplicates, warn on clash
			if (srcNode.httpEquiv) return;
			break;
		case 'style': 
			break;
		case 'script':  // FIXME no duplicate @src
			if (!isFrameset) return; // WARN even non-js script-type is rejected
			if (!srcNode.type || /^text\/javascript$/i.test(srcNode.type)) srcNode.type = 'text/javascript?disabled';
			break;
		}
		if (isFrameset) DOM.insertNode('beforebegin', selfMarker, srcNode);
		else DOM.insertNode('beforeend', dstHead, srcNode);
		if (DOM.getTagName(srcNode) == 'link') srcNode.href = srcNode.getAttribute('href'); // Otherwise <link title="..." /> stylesheets don't work on Chrome
	});
}

function mergeElement(dst, src) { // NOTE this removes all dst (= landing page) attrs and imports all src (= frameset) attrs.
	DOM.removeAttributes(dst);
	DOM.copyAttributes(dst, src);
	dst.removeAttribute('style'); // FIXME is this appropriate? There should at least be a warning
}

function getFramesetMarker(doc) {
	if (!doc) doc = document;
	var marker = DOM.find('link[rel~=' + FRAMESET_REL + ']', doc.head);
	return marker;
}

function getSelfMarker(doc) {
	if (!doc) doc = document;
	var marker = DOM.find('link[rel~=' + SELF_REL + ']', doc.head); 
	return marker;
}

return HFrameset;
})();


function registerHyperFramesetElements() {

var namespaces = framer.definition.namespaces;

sprockets.registerElement('body', HFrameset);
sprockets.registerElement(namespaces.lookupSelector('frame', HYPERFRAMESET_URN), HFrame);

sprockets.registerElement(namespaces.lookupSelector('layer', HYPERFRAMESET_URN), Layer);
sprockets.registerElement(namespaces.lookupSelector('popup', HYPERFRAMESET_URN), Popup);
sprockets.registerElement(namespaces.lookupSelector('panel', HYPERFRAMESET_URN), Panel);
sprockets.registerElement(namespaces.lookupSelector('vlayout', HYPERFRAMESET_URN), VLayout);
sprockets.registerElement(namespaces.lookupSelector('hlayout', HYPERFRAMESET_URN), HLayout);
sprockets.registerElement(namespaces.lookupSelector('deck', HYPERFRAMESET_URN), Deck);
sprockets.registerElement(namespaces.lookupSelector('rdeck', HYPERFRAMESET_URN), ResponsiveDeck);

var cssText = [
'*[hidden] { display: none !important; }', // TODO maybe not !important
'html, body { margin: 0; padding: 0; }',
'html { width: 100%; height: 100%; }',
namespaces.lookupSelector('layer, popup, hlayout, vlayout, deck, rdeck, panel, frame, body', HYPERFRAMESET_URN) + ' { box-sizing: border-box; }', // TODO http://css-tricks.com/inheriting-box-sizing-probably-slightly-better-best-practice/
namespaces.lookupSelector('layer', HYPERFRAMESET_URN) + ' { display: block; position: fixed; top: 0; left: 0; width: 0; height: 0; }',
namespaces.lookupSelector('hlayout, vlayout, deck, rdeck', HYPERFRAMESET_URN) + ' { display: block; width: 0; height: 0; text-align: left; margin: 0; padding: 0; }', // FIXME text-align: start
namespaces.lookupSelector('hlayout, vlayout, deck, rdeck', HYPERFRAMESET_URN) + ' { width: 100%; height: 100%; }', // FIXME should be 0,0 before manual calculations
namespaces.lookupSelector('frame, panel', HYPERFRAMESET_URN) + ' { display: block; width: auto; height: auto; text-align: left; margin: 0; padding: 0; }', // FIXME text-align: start
namespaces.lookupSelector('body', HYPERFRAMESET_URN) + ' { display: block; width: auto; height: auto; margin: 0; }',
namespaces.lookupSelector('popup', HYPERFRAMESET_URN) + ' { display: block; position: relative; width: 0; height: 0; }',
namespaces.lookupSelector('popup', HYPERFRAMESET_URN) + ' > * { position: absolute; top: 0; left: 0; }', // TODO or change 'body' styling above
namespaces.lookupSelector('vlayout', HYPERFRAMESET_URN) + ' { height: 100%; }',
namespaces.lookupSelector('hlayout', HYPERFRAMESET_URN) + ' { width: 100%; overflow-y: hidden; }',
namespaces.lookupSelector('vlayout', HYPERFRAMESET_URN) + ' > * { display: block; float: left; width: 100%; height: auto; text-align: left; }',
namespaces.lookupSelector('vlayout', HYPERFRAMESET_URN) + ' > *::after { clear: both; }',
namespaces.lookupSelector('hlayout', HYPERFRAMESET_URN) + ' > * { display: block; float: left; width: auto; height: 100%; vertical-align: top; overflow-y: auto; }',
namespaces.lookupSelector('hlayout', HYPERFRAMESET_URN) + '::after { clear: both; }',
namespaces.lookupSelector('deck', HYPERFRAMESET_URN) + ' > * { width: 100%; height: 100%; }',
namespaces.lookupSelector('rdeck', HYPERFRAMESET_URN) + ' > * { width: 0; height: 0; }',
].join('\n');

var style = document.createElement('style');
style.textContent = cssText;
document.head.insertBefore(style, document.head.firstChild);

} // END registerLayoutElements()


var notify = function(msg) { // FIXME this isn't being used called everywhere it should
	var module;
	switch (msg.module) {
	case 'frameset': module = framer.frameset.options; break;
	default: return Promise.resolve();
	}
	var handler = module[msg.type];
	if (!handler) return Promise.resolve();
	var listener;

	if (handler[msg.stage]) listener = handler[msg.stage];
	else switch(msg.module) {
	case 'frame':
		listener =
			msg.type == 'bodyLeft' ? (msg.stage == 'before' ? handler : null) :
			msg.type == 'bodyEntered' ? (msg.stage == 'after' ? handler : null) :
			null;
		break;
	case 'frameset':
		listener =
			msg.type == 'leftState' ? (msg.stage == 'before' ? handler : null) :
			msg.type == 'enteredState' ? (msg.stage == 'after' ? handler : null) :
			null;
		break;
	default:
		throw Error(msg.module + ' is invalid module');
		break;
	}

	if (typeof listener == 'function') {
		var promise = Promise.defer(function() { listener(msg); }); // TODO isFunction(listener)
		promise['catch'](function(err) { throw Error(err); });
		return promise;
	}
	else return Promise.resolve();
}


var framer = {};

var framesetReady = Promise.applyTo();

_.defaults(framer, {

frameset: null,

started: false,

start: function(startOptions) {
	var framer = this;
	
	if (framer.started) throw Error('Already started');
	if (!startOptions || !startOptions.contentDocument) throw Error('No contentDocument passed to start()');

	framer.started = true;
	startOptions.contentDocument
	.then(function(doc) { // FIXME potential race condition between document finished loading and frameset rendering
		return httpProxy.add({
			url: document.URL,
			type: 'document',
			document: doc
		});
	});
	
	return Promise.pipe(null, [
		
	function() { // sanity check
		return Promise.wait(function() { return !!document.body; });		
	},

	function() { // lookup or detect frameset.URL
		var framerConfig;
		framerConfig = framer.lookup(document.URL);
		if (framerConfig) return framerConfig;
		return startOptions.contentDocument
			.then(function(doc) {
				return framer.detect(doc);
			});
	},

	function(framerConfig) { // initiate fetch of frameset.URL
		if (!framerConfig) throw Error('No frameset could be determined for this page');
		framer.scope = framerConfig.scope; // FIXME shouldn't set this until loadFramesetDefinition() returns success
		var framesetURL = URL(framerConfig.framesetURL);
		if (framesetURL.hash) console.info('Ignoring hash component of frameset URL: ' + framesetURL.hash);
		framer.framesetURL = framerConfig.framesetURL = framesetURL.nohash;
		return httpProxy.load(framer.framesetURL, { responseType: 'document' })
		.then(function(response) {
			var framesetDoc = response.document;
			return new HFramesetDefinition(framesetDoc, framerConfig);
		});
	},

	function(definition) {
		return Promise.pipe(definition, [
		
		function() {
			framer.definition = definition;
			return HFrameset.prepare(document, definition)
		},

		function() { 
			return definition.preprocess();
		},

		function() {
			return HFrameset.prerender(document, definition)
		}

		]);
	},
	
	function() {
		window.addEventListener('click', function(e) {
			if (e.defaultPrevented) return;
			var acceptDefault = framer.onClick(e);
			if (acceptDefault === false) e.preventDefault();
		}, false); // onClick generates requestnavigation event
		window.addEventListener('submit', function(e) {
			if (e.defaultPrevented) return;
			var acceptDefault = framer.onSubmit(e);
			if (acceptDefault === false) e.preventDefault();
		}, false);
		
		registerFormElements();
		registerHyperFramesetElements();

		return sprockets.start({ manual: true }); // FIXME should be a promise
	},

	function() { // TODO ideally frameset rendering wouldn't start until after this step
		return framesetReady
		.then(function() {

			var changeset = framer.currentChangeset;
			// FIXME what if no changeset is returned
			return historyManager.start(changeset, '', document.URL,
				function(state) { }, // FIXME need some sort of rendering status
				function(state) { return framer.onPopState(state.getData()); }
				);
		});
	},

	function() { // FIXME this should wait until at least the landing document has been rendered in one frame

		notify({ // NOTE this doesn't prevent start() from resolving
			module: 'frameset',
			type: 'enteredState',
			stage: 'after',
			url: document.URL
		});

	},

	// TODO it would be nice if <body> wasn't populated until stylesheets were loaded
	function() {
		return Promise.wait(function() { return DOM.checkStyleSheets(); })
	}	
	
	]);

	
},

framesetEntered: function(frameset) {
	var framer = this;
	framer.frameset = frameset;
	var url = document.URL;
	framer.currentChangeset = frameset.lookup(url, {
		referrer: document.referrer
	});
	framesetReady.resolve();
},

framesetLeft: function(frameset) { // WARN this should never happen
	var framer = this;
	delete framer.frameset;
},

frameEntered: function(frame) {
	var namespaces = framer.definition.namespaces;
	var parentFrame;
	var parentElement = DOM.closest(frame.element.parentNode, namespaces.lookupSelector('frame', HYPERFRAMESET_URN)); // TODO frame.element.parentNode.ariaClosest('frame')
	if (parentElement) parentFrame = HFrame(parentElement);
	else {
		parentElement = document.body; // TODO  frame.elenent.parentNode.ariaClosest('frameset'); 
		parentFrame = HFrameset(parentElement);
	}
	parentFrame.frameEntered(frame);
	frame.parentFrame = parentFrame;

	if (frame.targetname === framer.currentChangeset.target) { // FIXME should only be used at startup
		frame.attr('src', framer.currentChangeset.url);
	}

	DOM.whenVisible(frame.element).then(function() { // FIXME could be clash with loadFrames() above

	var src = frame.attr('src');

	if (src == null) { // a non-src frame
		return frame.load(null, { condition: 'loaded' });
	}

	if (src === '') {
		return; // FIXME frame.load(null, { condition: 'uninitialized' })
	}
	
	var fullURL = URL(src);
	var nohash = fullURL.nohash;
	var hash = fullURL.hash;
	
	var request = { method: 'get', url: nohash, responseType: 'document'};
	return Promise.pipe(null, [ // FIXME how to handle `hash` if present??
	
	function() { return frame.preload(request); },
	function() { return httpProxy.load(nohash, request); },
	function(response) { return frame.load(response); }

	]);

	});
},

frameLeft: function(frame) {
	var parentFrame = frame.parentFrame;
	delete frame.parentFrame;
	parentFrame.frameLeft(frame);
},

onClick: function(e) { // return false means success
	var framer = this;

	if (e.button != 0) return; // FIXME what is the value for button in IE's W3C events model??
	if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return; // FIXME do these always trigger modified click behavior??

	// Find closest <a href> to e.target
	var linkElement = DOM.closest(e.target, 'a, [link]');
	if (!linkElement) return;
	var hyperlink;
	if (DOM.getTagName(linkElement) === 'a') hyperlink = linkElement;
	else {
		hyperlink = DOM.find('a, link', linkElement);
		if (!hyperlink) hyperlink = DOM.closest('a', linkElement);
		if (!hyperlink) return;
	}
	var href = hyperlink.getAttribute('href');
	if (!href) return; // not really a hyperlink

	var baseURL = URL(document.URL);
	var url = baseURL.resolve(href); // TODO probably don't need to resolve on browsers that support pushstate

	// NOTE The following creates a pseudo-event and dispatches to frames in a bubbling order.
	// FIXME May as well use a virtual event system, e.g. DOMSprockets
	var details = {
		url: url,
		element: hyperlink
	}; // TODO more details?? event??

	framer.triggerRequestNavigation(details.url, details);
	return false;
},

onSubmit: function(e) { // return false means success
	var framer = this;

	// test submit
	var form = e.target;
	if (form.target) return; // no iframe
	var baseURL = URL(document.URL);
	var action = baseURL.resolve(form.action); // TODO probably don't need to resolve on browsers that support pushstate
	
	var details = {
		element: form
	};
	var method = _.lc(form.method);
	switch(method) {
	case 'get':
		var oURL = URL(action);
		var query = encode(form);
		details.url = oURL.nosearch + (oURL.search || '?') + query + oURL.hash;
		break;
	default: return; // TODO handle POST
	}
	
	framer.triggerRequestNavigation(details.url, details);
	return false;
	
	function encode(form) {
		var data = [];
		_.forEach(form.elements, function(el) {
			if (!el.name) return;
			data.push(el.name + '=' + encodeURIComponent(el.value));
		});
		return data.join('&');
	}
},

triggerRequestNavigation: function(url, details) {
	Promise.defer(function() {
		var event = document.createEvent('CustomEvent');
		event.initCustomEvent('requestnavigation', true, true, details.url);
		var acceptDefault = details.element.dispatchEvent(event);
		if (acceptDefault !== false) {
			location.assign(details.url);
		}
	});
},

onRequestNavigation: function(e, frame) { // `return false` means success (so preventDefault)
	var framer = this;
	if (!frame) throw Error('Invalid frame / frameset in onRequestNavigation');
	// NOTE only pushState enabled browsers use this
	// We want panning to be the default behavior for clicks on hyperlinks - <a href>
	// Before panning to the next page, have to work out if that is appropriate
	// `return` means ignore the click

	var url = e.detail;
	var details = {
		url: url,
		element: e.target
	}
	
	if (!frame.isFrameset) {
		if (requestNavigation(frame, url, details)) return false;
		return;
	}
	
	// test hyperlinks
	var baseURL = URL(document.URL);
	var oURL = URL(url);
	if (oURL.origin != baseURL.origin) return; // no external urls

	// TODO perhaps should test same-site and same-page links
	var isPageLink = (oURL.nohash === baseURL.nohash); // TODO what about page-links that match the current hash?
	if (isPageLink) {
		framer.onPageLink(url, details);
		return false;
	}

	var frameset = frame;
	var framesetScope = framer.lookup(url);
	if (!framesetScope || !framer.compareFramesetScope(framesetScope)) { // allow normal browser navigation
		return;
	}
	
	if (requestNavigation(frameset, url, details)) return false;
	return;

	function requestNavigation(frame, url, details) { // `return true` means success
		var changeset = frame.lookup(url, details);
		if (changeset === '' || changeset === true) return true;
		if (changeset == null || changeset === false) return false;
		framer.load(url, changeset, frame.isFrameset);
		return true;
	}

},

onPageLink: function(url, details) {
	var framer = this;
	console.warn('Ignoring on-same-page links for now.'); // FIXME
},

navigate: function(url, changeset) { // FIXME doesn't support replaceState
	var framer = this;	
	return framer.load(url, changeset, true);
},

load: function(url, changeset, changeState) { // FIXME doesn't support replaceState
	var framer = this;	
	var frameset = framer.frameset;
	var mustNotify = changeState || changeState === 0;
	var target = changeset.target;
	var frames = [];
	recurseFrames(frameset, function(frame) {
		if (frame.targetname !== target) return;
		frames.push(frame);
		return true;
	});
	
	var fullURL = URL(url);
	var hash = fullURL.hash;
	var nohash = fullURL.nohash;
	var request = { method: 'get', url: nohash, responseType: 'document' }; // TODO one day may support different response-type
	var response;

	return Promise.pipe(null, [

	function() {
		if (mustNotify) return notify({ // FIXME need a timeout on notify
			module: 'frameset',
			type: 'leftState',
			stage: 'before',
			url: document.URL
			// TODO details, resource, url, frames??
			});
	},
	function() {
		_.forEach(frames, function(frame) {
			frame.preload(request);
		});
	},
	function() {
		return httpProxy.load(nohash, request)
		.then(function(resp) { response = resp; });
	},
	function() { // FIXME how to handle `hash` if present??
		if (changeState) return historyManager.pushState(changeset, '', url, function(state) {
				loadFrames(frames, response);
			});
		else return loadFrames(frames, response);
	},
	function() { // FIXME need to wait for the DOM to stabilize before this notification
		if (mustNotify) return notify({ // FIXME need a timeout on notify
			module: 'frameset',
			type: 'enteredState',
			stage: 'after',
			url: url
			// TODO details, resource, url, frames??
			});
	}
		
	]);

	function loadFrames(frames, response) { // TODO promisify
		_.forEach(frames, function(frame) {
			frame.attr('src', response.url);
			DOM.whenVisible(frame.element).then(function() {
				frame.load(response); // FIXME this can potentially clash with framer.frameEntered code
			});
		});
	}
	
	function recurseFrames(parentFrame, fn) {
		_.forEach(parentFrame.frames, function(frame) {
			var found = fn(frame);
			if (!found) recurseFrames(frame, fn);
		});			
	}
},

onPopState: function(changeset) {
	var framer = this;
	var frameset = framer.frameset;
	var frames = [];
	var url = changeset.url;
	if (url !== document.URL) {
		console.warn('Popped state URL does not match address-bar URL.');
		// FIXME needs an optional error recovery, perhaps reloading document.URL
	}
	framer.load(url, changeset, 0);
}

});


_.defaults(framer, {

lookup: function(docURL) {
	var framer = this;
	if (!framer.options.lookup) return;
	var result = framer.options.lookup(docURL);
	// FIXME if (result === '' || result === true) 
	if (result == null || result === false) return false;

	// FIXME error if `result` is a relative URL
	if (typeof result === 'string') result = implyFramesetScope(result, docURL);
	if (typeof result !== 'object' || !result.scope || !result.framesetURL) throw Error('Unexpected result from frameset lookup');
	return result;
},

detect: function(srcDoc) {
	var framer = this;
	if (!framer.options.detect) return;
	var result = framer.options.detect(srcDoc);
	// FIXME if (result === '' || result === true) 
	if (result == null || result === false) return false;

	// FIXME error if `result` is a relative URL
	if (typeof result === 'string') result = implyFramesetScope(result, document.URL);
	if (typeof result !== 'object' || !result.scope || !result.framesetURL) throw Error('Unexpected result from frameset detect');
	return result;
},

compareFramesetScope: function(settings) {
	var framer = this;
	if (framer.framesetURL !== settings.framesetURL) return false;
	if (framer.scope !== settings.scope) return false;
	return true;
}

});

function implyFramesetScope(framesetSrc, docSrc) {
	var docURL = URL(docSrc);
	var docSiteURL = URL(docURL.origin);
	var framesetSrc = docSiteURL.resolve(framesetSrc);
	var scope = implyScope(framesetSrc, docSrc);
	return {
		scope: scope,
		framesetURL: framesetSrc
	}
}

function implyScope(framesetSrc, docSrc) {
	var docURL = URL(docSrc);
	var framesetURL = URL(framesetSrc);
	var scope = docURL.base;
	var framesetBase = framesetURL.base;
	if (scope.indexOf(framesetBase) >= 0) scope = framesetBase;
	return scope;
}

function inferChangeset(url, partial) {
	var inferred = {
		url: url
	}
	
	switch (typeof partial) {
	case 'string':
		inferred.target = partial;
		break;
	case 'object':
		/*
		if (partial instanceof Array) {
			inferred.target = partial[0];
			inferred.targets = partial.slice(0);
			break;
		}
		*/
	default:
		throw Error('Invalid changeset returned from lookup()');
		break;
	}
	
	return inferred;
}


_.defaults(framer, {

options: {
	/* The following options are available (unless otherwise indicated) *
	lookup: function(url) {},
	detect: function(document) {},
	entering: { before: noop, after: noop },
	leaving: { before: noop, after: noop }, // TODO not called at all
	ready: noop // TODO should this be entering:complete ??
	/**/
},

config: function(options) {
	var framer = this;
	if (!options) return;
	_.assign(framer.options, options);
}

});


_.defaults(framer, {

	HFrameDefinition: HFrameDefinition,
	HFramesetDefinition: HFramesetDefinition,
	HFrame: HFrame,
	HFrameset: HFrameset,
	Layer: Layer,
	HLayout: HLayout,
	VLayout: VLayout,
	Deck: Deck,
	ResponsiveDeck: ResponsiveDeck

});

return framer;

})();

// end framer defn

}).call(window);

