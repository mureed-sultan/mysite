/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/animejs/lib/anime.es.js":
/*!**********************************************!*\
  !*** ./node_modules/animejs/lib/anime.es.js ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/*
 * anime.js v3.2.1
 * (c) 2020 Julian Garnier
 * Released under the MIT license
 * animejs.com
 */

// Defaults

var defaultInstanceSettings = {
  update: null,
  begin: null,
  loopBegin: null,
  changeBegin: null,
  change: null,
  changeComplete: null,
  loopComplete: null,
  complete: null,
  loop: 1,
  direction: 'normal',
  autoplay: true,
  timelineOffset: 0
};

var defaultTweenSettings = {
  duration: 1000,
  delay: 0,
  endDelay: 0,
  easing: 'easeOutElastic(1, .5)',
  round: 0
};

var validTransforms = ['translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY', 'perspective', 'matrix', 'matrix3d'];

// Caching

var cache = {
  CSS: {},
  springs: {}
};

// Utils

function minMax(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function stringContains(str, text) {
  return str.indexOf(text) > -1;
}

function applyArguments(func, args) {
  return func.apply(null, args);
}

var is = {
  arr: function (a) { return Array.isArray(a); },
  obj: function (a) { return stringContains(Object.prototype.toString.call(a), 'Object'); },
  pth: function (a) { return is.obj(a) && a.hasOwnProperty('totalLength'); },
  svg: function (a) { return a instanceof SVGElement; },
  inp: function (a) { return a instanceof HTMLInputElement; },
  dom: function (a) { return a.nodeType || is.svg(a); },
  str: function (a) { return typeof a === 'string'; },
  fnc: function (a) { return typeof a === 'function'; },
  und: function (a) { return typeof a === 'undefined'; },
  nil: function (a) { return is.und(a) || a === null; },
  hex: function (a) { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a); },
  rgb: function (a) { return /^rgb/.test(a); },
  hsl: function (a) { return /^hsl/.test(a); },
  col: function (a) { return (is.hex(a) || is.rgb(a) || is.hsl(a)); },
  key: function (a) { return !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes'; },
};

// Easings

function parseEasingParameters(string) {
  var match = /\(([^)]+)\)/.exec(string);
  return match ? match[1].split(',').map(function (p) { return parseFloat(p); }) : [];
}

// Spring solver inspired by Webkit Copyright © 2016 Apple Inc. All rights reserved. https://webkit.org/demos/spring/spring.js

function spring(string, duration) {

  var params = parseEasingParameters(string);
  var mass = minMax(is.und(params[0]) ? 1 : params[0], .1, 100);
  var stiffness = minMax(is.und(params[1]) ? 100 : params[1], .1, 100);
  var damping = minMax(is.und(params[2]) ? 10 : params[2], .1, 100);
  var velocity =  minMax(is.und(params[3]) ? 0 : params[3], .1, 100);
  var w0 = Math.sqrt(stiffness / mass);
  var zeta = damping / (2 * Math.sqrt(stiffness * mass));
  var wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
  var a = 1;
  var b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

  function solver(t) {
    var progress = duration ? (duration * t) / 1000 : t;
    if (zeta < 1) {
      progress = Math.exp(-progress * zeta * w0) * (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
    } else {
      progress = (a + b * progress) * Math.exp(-progress * w0);
    }
    if (t === 0 || t === 1) { return t; }
    return 1 - progress;
  }

  function getDuration() {
    var cached = cache.springs[string];
    if (cached) { return cached; }
    var frame = 1/6;
    var elapsed = 0;
    var rest = 0;
    while(true) {
      elapsed += frame;
      if (solver(elapsed) === 1) {
        rest++;
        if (rest >= 16) { break; }
      } else {
        rest = 0;
      }
    }
    var duration = elapsed * frame * 1000;
    cache.springs[string] = duration;
    return duration;
  }

  return duration ? solver : getDuration;

}

// Basic steps easing implementation https://developer.mozilla.org/fr/docs/Web/CSS/transition-timing-function

function steps(steps) {
  if ( steps === void 0 ) steps = 10;

  return function (t) { return Math.ceil((minMax(t, 0.000001, 1)) * steps) * (1 / steps); };
}

// BezierEasing https://github.com/gre/bezier-easing

var bezier = (function () {

  var kSplineTableSize = 11;
  var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1 }
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1 }
  function C(aA1)      { return 3.0 * aA1 }

  function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT }
  function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1) }

  function binarySubdivide(aX, aA, aB, mX1, mX2) {
    var currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) { aB = currentT; } else { aA = currentT; }
    } while (Math.abs(currentX) > 0.0000001 && ++i < 10);
    return currentT;
  }

  function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
    for (var i = 0; i < 4; ++i) {
      var currentSlope = getSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) { return aGuessT; }
      var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }

  function bezier(mX1, mY1, mX2, mY2) {

    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) { return; }
    var sampleValues = new Float32Array(kSplineTableSize);

    if (mX1 !== mY1 || mX2 !== mY2) {
      for (var i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }
    }

    function getTForX(aX) {

      var intervalStart = 0;
      var currentSample = 1;
      var lastSample = kSplineTableSize - 1;

      for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
        intervalStart += kSampleStepSize;
      }

      --currentSample;

      var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      var guessForT = intervalStart + dist * kSampleStepSize;
      var initialSlope = getSlope(guessForT, mX1, mX2);

      if (initialSlope >= 0.001) {
        return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
      }

    }

    return function (x) {
      if (mX1 === mY1 && mX2 === mY2) { return x; }
      if (x === 0 || x === 1) { return x; }
      return calcBezier(getTForX(x), mY1, mY2);
    }

  }

  return bezier;

})();

var penner = (function () {

  // Based on jQuery UI's implemenation of easing equations from Robert Penner (http://www.robertpenner.com/easing)

  var eases = { linear: function () { return function (t) { return t; }; } };

  var functionEasings = {
    Sine: function () { return function (t) { return 1 - Math.cos(t * Math.PI / 2); }; },
    Circ: function () { return function (t) { return 1 - Math.sqrt(1 - t * t); }; },
    Back: function () { return function (t) { return t * t * (3 * t - 2); }; },
    Bounce: function () { return function (t) {
      var pow2, b = 4;
      while (t < (( pow2 = Math.pow(2, --b)) - 1) / 11) {}
      return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow(( pow2 * 3 - 2 ) / 22 - t, 2)
    }; },
    Elastic: function (amplitude, period) {
      if ( amplitude === void 0 ) amplitude = 1;
      if ( period === void 0 ) period = .5;

      var a = minMax(amplitude, 1, 10);
      var p = minMax(period, .1, 2);
      return function (t) {
        return (t === 0 || t === 1) ? t : 
          -a * Math.pow(2, 10 * (t - 1)) * Math.sin((((t - 1) - (p / (Math.PI * 2) * Math.asin(1 / a))) * (Math.PI * 2)) / p);
      }
    }
  };

  var baseEasings = ['Quad', 'Cubic', 'Quart', 'Quint', 'Expo'];

  baseEasings.forEach(function (name, i) {
    functionEasings[name] = function () { return function (t) { return Math.pow(t, i + 2); }; };
  });

  Object.keys(functionEasings).forEach(function (name) {
    var easeIn = functionEasings[name];
    eases['easeIn' + name] = easeIn;
    eases['easeOut' + name] = function (a, b) { return function (t) { return 1 - easeIn(a, b)(1 - t); }; };
    eases['easeInOut' + name] = function (a, b) { return function (t) { return t < 0.5 ? easeIn(a, b)(t * 2) / 2 : 
      1 - easeIn(a, b)(t * -2 + 2) / 2; }; };
    eases['easeOutIn' + name] = function (a, b) { return function (t) { return t < 0.5 ? (1 - easeIn(a, b)(1 - t * 2)) / 2 : 
      (easeIn(a, b)(t * 2 - 1) + 1) / 2; }; };
  });

  return eases;

})();

function parseEasings(easing, duration) {
  if (is.fnc(easing)) { return easing; }
  var name = easing.split('(')[0];
  var ease = penner[name];
  var args = parseEasingParameters(easing);
  switch (name) {
    case 'spring' : return spring(easing, duration);
    case 'cubicBezier' : return applyArguments(bezier, args);
    case 'steps' : return applyArguments(steps, args);
    default : return applyArguments(ease, args);
  }
}

// Strings

function selectString(str) {
  try {
    var nodes = document.querySelectorAll(str);
    return nodes;
  } catch(e) {
    return;
  }
}

// Arrays

function filterArray(arr, callback) {
  var len = arr.length;
  var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
  var result = [];
  for (var i = 0; i < len; i++) {
    if (i in arr) {
      var val = arr[i];
      if (callback.call(thisArg, val, i, arr)) {
        result.push(val);
      }
    }
  }
  return result;
}

function flattenArray(arr) {
  return arr.reduce(function (a, b) { return a.concat(is.arr(b) ? flattenArray(b) : b); }, []);
}

function toArray(o) {
  if (is.arr(o)) { return o; }
  if (is.str(o)) { o = selectString(o) || o; }
  if (o instanceof NodeList || o instanceof HTMLCollection) { return [].slice.call(o); }
  return [o];
}

function arrayContains(arr, val) {
  return arr.some(function (a) { return a === val; });
}

// Objects

function cloneObject(o) {
  var clone = {};
  for (var p in o) { clone[p] = o[p]; }
  return clone;
}

function replaceObjectProps(o1, o2) {
  var o = cloneObject(o1);
  for (var p in o1) { o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p]; }
  return o;
}

function mergeObjects(o1, o2) {
  var o = cloneObject(o1);
  for (var p in o2) { o[p] = is.und(o1[p]) ? o2[p] : o1[p]; }
  return o;
}

// Colors

function rgbToRgba(rgbValue) {
  var rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
  return rgb ? ("rgba(" + (rgb[1]) + ",1)") : rgbValue;
}

function hexToRgba(hexValue) {
  var rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  var hex = hexValue.replace(rgx, function (m, r, g, b) { return r + r + g + g + b + b; } );
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);
  return ("rgba(" + r + "," + g + "," + b + ",1)");
}

function hslToRgba(hslValue) {
  var hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
  var h = parseInt(hsl[1], 10) / 360;
  var s = parseInt(hsl[2], 10) / 100;
  var l = parseInt(hsl[3], 10) / 100;
  var a = hsl[4] || 1;
  function hue2rgb(p, q, t) {
    if (t < 0) { t += 1; }
    if (t > 1) { t -= 1; }
    if (t < 1/6) { return p + (q - p) * 6 * t; }
    if (t < 1/2) { return q; }
    if (t < 2/3) { return p + (q - p) * (2/3 - t) * 6; }
    return p;
  }
  var r, g, b;
  if (s == 0) {
    r = g = b = l;
  } else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return ("rgba(" + (r * 255) + "," + (g * 255) + "," + (b * 255) + "," + a + ")");
}

function colorToRgb(val) {
  if (is.rgb(val)) { return rgbToRgba(val); }
  if (is.hex(val)) { return hexToRgba(val); }
  if (is.hsl(val)) { return hslToRgba(val); }
}

// Units

function getUnit(val) {
  var split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
  if (split) { return split[1]; }
}

function getTransformUnit(propName) {
  if (stringContains(propName, 'translate') || propName === 'perspective') { return 'px'; }
  if (stringContains(propName, 'rotate') || stringContains(propName, 'skew')) { return 'deg'; }
}

// Values

function getFunctionValue(val, animatable) {
  if (!is.fnc(val)) { return val; }
  return val(animatable.target, animatable.id, animatable.total);
}

function getAttribute(el, prop) {
  return el.getAttribute(prop);
}

function convertPxToUnit(el, value, unit) {
  var valueUnit = getUnit(value);
  if (arrayContains([unit, 'deg', 'rad', 'turn'], valueUnit)) { return value; }
  var cached = cache.CSS[value + unit];
  if (!is.und(cached)) { return cached; }
  var baseline = 100;
  var tempEl = document.createElement(el.tagName);
  var parentEl = (el.parentNode && (el.parentNode !== document)) ? el.parentNode : document.body;
  parentEl.appendChild(tempEl);
  tempEl.style.position = 'absolute';
  tempEl.style.width = baseline + unit;
  var factor = baseline / tempEl.offsetWidth;
  parentEl.removeChild(tempEl);
  var convertedUnit = factor * parseFloat(value);
  cache.CSS[value + unit] = convertedUnit;
  return convertedUnit;
}

function getCSSValue(el, prop, unit) {
  if (prop in el.style) {
    var uppercasePropName = prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    var value = el.style[prop] || getComputedStyle(el).getPropertyValue(uppercasePropName) || '0';
    return unit ? convertPxToUnit(el, value, unit) : value;
  }
}

function getAnimationType(el, prop) {
  if (is.dom(el) && !is.inp(el) && (!is.nil(getAttribute(el, prop)) || (is.svg(el) && el[prop]))) { return 'attribute'; }
  if (is.dom(el) && arrayContains(validTransforms, prop)) { return 'transform'; }
  if (is.dom(el) && (prop !== 'transform' && getCSSValue(el, prop))) { return 'css'; }
  if (el[prop] != null) { return 'object'; }
}

function getElementTransforms(el) {
  if (!is.dom(el)) { return; }
  var str = el.style.transform || '';
  var reg  = /(\w+)\(([^)]*)\)/g;
  var transforms = new Map();
  var m; while (m = reg.exec(str)) { transforms.set(m[1], m[2]); }
  return transforms;
}

function getTransformValue(el, propName, animatable, unit) {
  var defaultVal = stringContains(propName, 'scale') ? 1 : 0 + getTransformUnit(propName);
  var value = getElementTransforms(el).get(propName) || defaultVal;
  if (animatable) {
    animatable.transforms.list.set(propName, value);
    animatable.transforms['last'] = propName;
  }
  return unit ? convertPxToUnit(el, value, unit) : value;
}

function getOriginalTargetValue(target, propName, unit, animatable) {
  switch (getAnimationType(target, propName)) {
    case 'transform': return getTransformValue(target, propName, animatable, unit);
    case 'css': return getCSSValue(target, propName, unit);
    case 'attribute': return getAttribute(target, propName);
    default: return target[propName] || 0;
  }
}

function getRelativeValue(to, from) {
  var operator = /^(\*=|\+=|-=)/.exec(to);
  if (!operator) { return to; }
  var u = getUnit(to) || 0;
  var x = parseFloat(from);
  var y = parseFloat(to.replace(operator[0], ''));
  switch (operator[0][0]) {
    case '+': return x + y + u;
    case '-': return x - y + u;
    case '*': return x * y + u;
  }
}

function validateValue(val, unit) {
  if (is.col(val)) { return colorToRgb(val); }
  if (/\s/g.test(val)) { return val; }
  var originalUnit = getUnit(val);
  var unitLess = originalUnit ? val.substr(0, val.length - originalUnit.length) : val;
  if (unit) { return unitLess + unit; }
  return unitLess;
}

// getTotalLength() equivalent for circle, rect, polyline, polygon and line shapes
// adapted from https://gist.github.com/SebLambla/3e0550c496c236709744

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function getCircleLength(el) {
  return Math.PI * 2 * getAttribute(el, 'r');
}

function getRectLength(el) {
  return (getAttribute(el, 'width') * 2) + (getAttribute(el, 'height') * 2);
}

function getLineLength(el) {
  return getDistance(
    {x: getAttribute(el, 'x1'), y: getAttribute(el, 'y1')}, 
    {x: getAttribute(el, 'x2'), y: getAttribute(el, 'y2')}
  );
}

function getPolylineLength(el) {
  var points = el.points;
  var totalLength = 0;
  var previousPos;
  for (var i = 0 ; i < points.numberOfItems; i++) {
    var currentPos = points.getItem(i);
    if (i > 0) { totalLength += getDistance(previousPos, currentPos); }
    previousPos = currentPos;
  }
  return totalLength;
}

function getPolygonLength(el) {
  var points = el.points;
  return getPolylineLength(el) + getDistance(points.getItem(points.numberOfItems - 1), points.getItem(0));
}

// Path animation

function getTotalLength(el) {
  if (el.getTotalLength) { return el.getTotalLength(); }
  switch(el.tagName.toLowerCase()) {
    case 'circle': return getCircleLength(el);
    case 'rect': return getRectLength(el);
    case 'line': return getLineLength(el);
    case 'polyline': return getPolylineLength(el);
    case 'polygon': return getPolygonLength(el);
  }
}

function setDashoffset(el) {
  var pathLength = getTotalLength(el);
  el.setAttribute('stroke-dasharray', pathLength);
  return pathLength;
}

// Motion path

function getParentSvgEl(el) {
  var parentEl = el.parentNode;
  while (is.svg(parentEl)) {
    if (!is.svg(parentEl.parentNode)) { break; }
    parentEl = parentEl.parentNode;
  }
  return parentEl;
}

function getParentSvg(pathEl, svgData) {
  var svg = svgData || {};
  var parentSvgEl = svg.el || getParentSvgEl(pathEl);
  var rect = parentSvgEl.getBoundingClientRect();
  var viewBoxAttr = getAttribute(parentSvgEl, 'viewBox');
  var width = rect.width;
  var height = rect.height;
  var viewBox = svg.viewBox || (viewBoxAttr ? viewBoxAttr.split(' ') : [0, 0, width, height]);
  return {
    el: parentSvgEl,
    viewBox: viewBox,
    x: viewBox[0] / 1,
    y: viewBox[1] / 1,
    w: width,
    h: height,
    vW: viewBox[2],
    vH: viewBox[3]
  }
}

function getPath(path, percent) {
  var pathEl = is.str(path) ? selectString(path)[0] : path;
  var p = percent || 100;
  return function(property) {
    return {
      property: property,
      el: pathEl,
      svg: getParentSvg(pathEl),
      totalLength: getTotalLength(pathEl) * (p / 100)
    }
  }
}

function getPathProgress(path, progress, isPathTargetInsideSVG) {
  function point(offset) {
    if ( offset === void 0 ) offset = 0;

    var l = progress + offset >= 1 ? progress + offset : 0;
    return path.el.getPointAtLength(l);
  }
  var svg = getParentSvg(path.el, path.svg);
  var p = point();
  var p0 = point(-1);
  var p1 = point(+1);
  var scaleX = isPathTargetInsideSVG ? 1 : svg.w / svg.vW;
  var scaleY = isPathTargetInsideSVG ? 1 : svg.h / svg.vH;
  switch (path.property) {
    case 'x': return (p.x - svg.x) * scaleX;
    case 'y': return (p.y - svg.y) * scaleY;
    case 'angle': return Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
  }
}

// Decompose value

function decomposeValue(val, unit) {
  // const rgx = /-?\d*\.?\d+/g; // handles basic numbers
  // const rgx = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  var rgx = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  var value = validateValue((is.pth(val) ? val.totalLength : val), unit) + '';
  return {
    original: value,
    numbers: value.match(rgx) ? value.match(rgx).map(Number) : [0],
    strings: (is.str(val) || unit) ? value.split(rgx) : []
  }
}

// Animatables

function parseTargets(targets) {
  var targetsArray = targets ? (flattenArray(is.arr(targets) ? targets.map(toArray) : toArray(targets))) : [];
  return filterArray(targetsArray, function (item, pos, self) { return self.indexOf(item) === pos; });
}

function getAnimatables(targets) {
  var parsed = parseTargets(targets);
  return parsed.map(function (t, i) {
    return {target: t, id: i, total: parsed.length, transforms: { list: getElementTransforms(t) } };
  });
}

// Properties

function normalizePropertyTweens(prop, tweenSettings) {
  var settings = cloneObject(tweenSettings);
  // Override duration if easing is a spring
  if (/^spring/.test(settings.easing)) { settings.duration = spring(settings.easing); }
  if (is.arr(prop)) {
    var l = prop.length;
    var isFromTo = (l === 2 && !is.obj(prop[0]));
    if (!isFromTo) {
      // Duration divided by the number of tweens
      if (!is.fnc(tweenSettings.duration)) { settings.duration = tweenSettings.duration / l; }
    } else {
      // Transform [from, to] values shorthand to a valid tween value
      prop = {value: prop};
    }
  }
  var propArray = is.arr(prop) ? prop : [prop];
  return propArray.map(function (v, i) {
    var obj = (is.obj(v) && !is.pth(v)) ? v : {value: v};
    // Default delay value should only be applied to the first tween
    if (is.und(obj.delay)) { obj.delay = !i ? tweenSettings.delay : 0; }
    // Default endDelay value should only be applied to the last tween
    if (is.und(obj.endDelay)) { obj.endDelay = i === propArray.length - 1 ? tweenSettings.endDelay : 0; }
    return obj;
  }).map(function (k) { return mergeObjects(k, settings); });
}


function flattenKeyframes(keyframes) {
  var propertyNames = filterArray(flattenArray(keyframes.map(function (key) { return Object.keys(key); })), function (p) { return is.key(p); })
  .reduce(function (a,b) { if (a.indexOf(b) < 0) { a.push(b); } return a; }, []);
  var properties = {};
  var loop = function ( i ) {
    var propName = propertyNames[i];
    properties[propName] = keyframes.map(function (key) {
      var newKey = {};
      for (var p in key) {
        if (is.key(p)) {
          if (p == propName) { newKey.value = key[p]; }
        } else {
          newKey[p] = key[p];
        }
      }
      return newKey;
    });
  };

  for (var i = 0; i < propertyNames.length; i++) loop( i );
  return properties;
}

function getProperties(tweenSettings, params) {
  var properties = [];
  var keyframes = params.keyframes;
  if (keyframes) { params = mergeObjects(flattenKeyframes(keyframes), params); }
  for (var p in params) {
    if (is.key(p)) {
      properties.push({
        name: p,
        tweens: normalizePropertyTweens(params[p], tweenSettings)
      });
    }
  }
  return properties;
}

// Tweens

function normalizeTweenValues(tween, animatable) {
  var t = {};
  for (var p in tween) {
    var value = getFunctionValue(tween[p], animatable);
    if (is.arr(value)) {
      value = value.map(function (v) { return getFunctionValue(v, animatable); });
      if (value.length === 1) { value = value[0]; }
    }
    t[p] = value;
  }
  t.duration = parseFloat(t.duration);
  t.delay = parseFloat(t.delay);
  return t;
}

function normalizeTweens(prop, animatable) {
  var previousTween;
  return prop.tweens.map(function (t) {
    var tween = normalizeTweenValues(t, animatable);
    var tweenValue = tween.value;
    var to = is.arr(tweenValue) ? tweenValue[1] : tweenValue;
    var toUnit = getUnit(to);
    var originalValue = getOriginalTargetValue(animatable.target, prop.name, toUnit, animatable);
    var previousValue = previousTween ? previousTween.to.original : originalValue;
    var from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
    var fromUnit = getUnit(from) || getUnit(originalValue);
    var unit = toUnit || fromUnit;
    if (is.und(to)) { to = previousValue; }
    tween.from = decomposeValue(from, unit);
    tween.to = decomposeValue(getRelativeValue(to, from), unit);
    tween.start = previousTween ? previousTween.end : 0;
    tween.end = tween.start + tween.delay + tween.duration + tween.endDelay;
    tween.easing = parseEasings(tween.easing, tween.duration);
    tween.isPath = is.pth(tweenValue);
    tween.isPathTargetInsideSVG = tween.isPath && is.svg(animatable.target);
    tween.isColor = is.col(tween.from.original);
    if (tween.isColor) { tween.round = 1; }
    previousTween = tween;
    return tween;
  });
}

// Tween progress

var setProgressValue = {
  css: function (t, p, v) { return t.style[p] = v; },
  attribute: function (t, p, v) { return t.setAttribute(p, v); },
  object: function (t, p, v) { return t[p] = v; },
  transform: function (t, p, v, transforms, manual) {
    transforms.list.set(p, v);
    if (p === transforms.last || manual) {
      var str = '';
      transforms.list.forEach(function (value, prop) { str += prop + "(" + value + ") "; });
      t.style.transform = str;
    }
  }
};

// Set Value helper

function setTargetsValue(targets, properties) {
  var animatables = getAnimatables(targets);
  animatables.forEach(function (animatable) {
    for (var property in properties) {
      var value = getFunctionValue(properties[property], animatable);
      var target = animatable.target;
      var valueUnit = getUnit(value);
      var originalValue = getOriginalTargetValue(target, property, valueUnit, animatable);
      var unit = valueUnit || getUnit(originalValue);
      var to = getRelativeValue(validateValue(value, unit), originalValue);
      var animType = getAnimationType(target, property);
      setProgressValue[animType](target, property, to, animatable.transforms, true);
    }
  });
}

// Animations

function createAnimation(animatable, prop) {
  var animType = getAnimationType(animatable.target, prop.name);
  if (animType) {
    var tweens = normalizeTweens(prop, animatable);
    var lastTween = tweens[tweens.length - 1];
    return {
      type: animType,
      property: prop.name,
      animatable: animatable,
      tweens: tweens,
      duration: lastTween.end,
      delay: tweens[0].delay,
      endDelay: lastTween.endDelay
    }
  }
}

function getAnimations(animatables, properties) {
  return filterArray(flattenArray(animatables.map(function (animatable) {
    return properties.map(function (prop) {
      return createAnimation(animatable, prop);
    });
  })), function (a) { return !is.und(a); });
}

// Create Instance

function getInstanceTimings(animations, tweenSettings) {
  var animLength = animations.length;
  var getTlOffset = function (anim) { return anim.timelineOffset ? anim.timelineOffset : 0; };
  var timings = {};
  timings.duration = animLength ? Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration; })) : tweenSettings.duration;
  timings.delay = animLength ? Math.min.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.delay; })) : tweenSettings.delay;
  timings.endDelay = animLength ? timings.duration - Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration - anim.endDelay; })) : tweenSettings.endDelay;
  return timings;
}

var instanceID = 0;

function createNewInstance(params) {
  var instanceSettings = replaceObjectProps(defaultInstanceSettings, params);
  var tweenSettings = replaceObjectProps(defaultTweenSettings, params);
  var properties = getProperties(tweenSettings, params);
  var animatables = getAnimatables(params.targets);
  var animations = getAnimations(animatables, properties);
  var timings = getInstanceTimings(animations, tweenSettings);
  var id = instanceID;
  instanceID++;
  return mergeObjects(instanceSettings, {
    id: id,
    children: [],
    animatables: animatables,
    animations: animations,
    duration: timings.duration,
    delay: timings.delay,
    endDelay: timings.endDelay
  });
}

// Core

var activeInstances = [];

var engine = (function () {
  var raf;

  function play() {
    if (!raf && (!isDocumentHidden() || !anime.suspendWhenDocumentHidden) && activeInstances.length > 0) {
      raf = requestAnimationFrame(step);
    }
  }
  function step(t) {
    // memo on algorithm issue:
    // dangerous iteration over mutable `activeInstances`
    // (that collection may be updated from within callbacks of `tick`-ed animation instances)
    var activeInstancesLength = activeInstances.length;
    var i = 0;
    while (i < activeInstancesLength) {
      var activeInstance = activeInstances[i];
      if (!activeInstance.paused) {
        activeInstance.tick(t);
        i++;
      } else {
        activeInstances.splice(i, 1);
        activeInstancesLength--;
      }
    }
    raf = i > 0 ? requestAnimationFrame(step) : undefined;
  }

  function handleVisibilityChange() {
    if (!anime.suspendWhenDocumentHidden) { return; }

    if (isDocumentHidden()) {
      // suspend ticks
      raf = cancelAnimationFrame(raf);
    } else { // is back to active tab
      // first adjust animations to consider the time that ticks were suspended
      activeInstances.forEach(
        function (instance) { return instance ._onDocumentVisibility(); }
      );
      engine();
    }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return play;
})();

function isDocumentHidden() {
  return !!document && document.hidden;
}

// Public Instance

function anime(params) {
  if ( params === void 0 ) params = {};


  var startTime = 0, lastTime = 0, now = 0;
  var children, childrenLength = 0;
  var resolve = null;

  function makePromise(instance) {
    var promise = window.Promise && new Promise(function (_resolve) { return resolve = _resolve; });
    instance.finished = promise;
    return promise;
  }

  var instance = createNewInstance(params);
  var promise = makePromise(instance);

  function toggleInstanceDirection() {
    var direction = instance.direction;
    if (direction !== 'alternate') {
      instance.direction = direction !== 'normal' ? 'normal' : 'reverse';
    }
    instance.reversed = !instance.reversed;
    children.forEach(function (child) { return child.reversed = instance.reversed; });
  }

  function adjustTime(time) {
    return instance.reversed ? instance.duration - time : time;
  }

  function resetTime() {
    startTime = 0;
    lastTime = adjustTime(instance.currentTime) * (1 / anime.speed);
  }

  function seekChild(time, child) {
    if (child) { child.seek(time - child.timelineOffset); }
  }

  function syncInstanceChildren(time) {
    if (!instance.reversePlayback) {
      for (var i = 0; i < childrenLength; i++) { seekChild(time, children[i]); }
    } else {
      for (var i$1 = childrenLength; i$1--;) { seekChild(time, children[i$1]); }
    }
  }

  function setAnimationsProgress(insTime) {
    var i = 0;
    var animations = instance.animations;
    var animationsLength = animations.length;
    while (i < animationsLength) {
      var anim = animations[i];
      var animatable = anim.animatable;
      var tweens = anim.tweens;
      var tweenLength = tweens.length - 1;
      var tween = tweens[tweenLength];
      // Only check for keyframes if there is more than one tween
      if (tweenLength) { tween = filterArray(tweens, function (t) { return (insTime < t.end); })[0] || tween; }
      var elapsed = minMax(insTime - tween.start - tween.delay, 0, tween.duration) / tween.duration;
      var eased = isNaN(elapsed) ? 1 : tween.easing(elapsed);
      var strings = tween.to.strings;
      var round = tween.round;
      var numbers = [];
      var toNumbersLength = tween.to.numbers.length;
      var progress = (void 0);
      for (var n = 0; n < toNumbersLength; n++) {
        var value = (void 0);
        var toNumber = tween.to.numbers[n];
        var fromNumber = tween.from.numbers[n] || 0;
        if (!tween.isPath) {
          value = fromNumber + (eased * (toNumber - fromNumber));
        } else {
          value = getPathProgress(tween.value, eased * toNumber, tween.isPathTargetInsideSVG);
        }
        if (round) {
          if (!(tween.isColor && n > 2)) {
            value = Math.round(value * round) / round;
          }
        }
        numbers.push(value);
      }
      // Manual Array.reduce for better performances
      var stringsLength = strings.length;
      if (!stringsLength) {
        progress = numbers[0];
      } else {
        progress = strings[0];
        for (var s = 0; s < stringsLength; s++) {
          var a = strings[s];
          var b = strings[s + 1];
          var n$1 = numbers[s];
          if (!isNaN(n$1)) {
            if (!b) {
              progress += n$1 + ' ';
            } else {
              progress += n$1 + b;
            }
          }
        }
      }
      setProgressValue[anim.type](animatable.target, anim.property, progress, animatable.transforms);
      anim.currentValue = progress;
      i++;
    }
  }

  function setCallback(cb) {
    if (instance[cb] && !instance.passThrough) { instance[cb](instance); }
  }

  function countIteration() {
    if (instance.remaining && instance.remaining !== true) {
      instance.remaining--;
    }
  }

  function setInstanceProgress(engineTime) {
    var insDuration = instance.duration;
    var insDelay = instance.delay;
    var insEndDelay = insDuration - instance.endDelay;
    var insTime = adjustTime(engineTime);
    instance.progress = minMax((insTime / insDuration) * 100, 0, 100);
    instance.reversePlayback = insTime < instance.currentTime;
    if (children) { syncInstanceChildren(insTime); }
    if (!instance.began && instance.currentTime > 0) {
      instance.began = true;
      setCallback('begin');
    }
    if (!instance.loopBegan && instance.currentTime > 0) {
      instance.loopBegan = true;
      setCallback('loopBegin');
    }
    if (insTime <= insDelay && instance.currentTime !== 0) {
      setAnimationsProgress(0);
    }
    if ((insTime >= insEndDelay && instance.currentTime !== insDuration) || !insDuration) {
      setAnimationsProgress(insDuration);
    }
    if (insTime > insDelay && insTime < insEndDelay) {
      if (!instance.changeBegan) {
        instance.changeBegan = true;
        instance.changeCompleted = false;
        setCallback('changeBegin');
      }
      setCallback('change');
      setAnimationsProgress(insTime);
    } else {
      if (instance.changeBegan) {
        instance.changeCompleted = true;
        instance.changeBegan = false;
        setCallback('changeComplete');
      }
    }
    instance.currentTime = minMax(insTime, 0, insDuration);
    if (instance.began) { setCallback('update'); }
    if (engineTime >= insDuration) {
      lastTime = 0;
      countIteration();
      if (!instance.remaining) {
        instance.paused = true;
        if (!instance.completed) {
          instance.completed = true;
          setCallback('loopComplete');
          setCallback('complete');
          if (!instance.passThrough && 'Promise' in window) {
            resolve();
            promise = makePromise(instance);
          }
        }
      } else {
        startTime = now;
        setCallback('loopComplete');
        instance.loopBegan = false;
        if (instance.direction === 'alternate') {
          toggleInstanceDirection();
        }
      }
    }
  }

  instance.reset = function() {
    var direction = instance.direction;
    instance.passThrough = false;
    instance.currentTime = 0;
    instance.progress = 0;
    instance.paused = true;
    instance.began = false;
    instance.loopBegan = false;
    instance.changeBegan = false;
    instance.completed = false;
    instance.changeCompleted = false;
    instance.reversePlayback = false;
    instance.reversed = direction === 'reverse';
    instance.remaining = instance.loop;
    children = instance.children;
    childrenLength = children.length;
    for (var i = childrenLength; i--;) { instance.children[i].reset(); }
    if (instance.reversed && instance.loop !== true || (direction === 'alternate' && instance.loop === 1)) { instance.remaining++; }
    setAnimationsProgress(instance.reversed ? instance.duration : 0);
  };

  // internal method (for engine) to adjust animation timings before restoring engine ticks (rAF)
  instance._onDocumentVisibility = resetTime;

  // Set Value helper

  instance.set = function(targets, properties) {
    setTargetsValue(targets, properties);
    return instance;
  };

  instance.tick = function(t) {
    now = t;
    if (!startTime) { startTime = now; }
    setInstanceProgress((now + (lastTime - startTime)) * anime.speed);
  };

  instance.seek = function(time) {
    setInstanceProgress(adjustTime(time));
  };

  instance.pause = function() {
    instance.paused = true;
    resetTime();
  };

  instance.play = function() {
    if (!instance.paused) { return; }
    if (instance.completed) { instance.reset(); }
    instance.paused = false;
    activeInstances.push(instance);
    resetTime();
    engine();
  };

  instance.reverse = function() {
    toggleInstanceDirection();
    instance.completed = instance.reversed ? false : true;
    resetTime();
  };

  instance.restart = function() {
    instance.reset();
    instance.play();
  };

  instance.remove = function(targets) {
    var targetsArray = parseTargets(targets);
    removeTargetsFromInstance(targetsArray, instance);
  };

  instance.reset();

  if (instance.autoplay) { instance.play(); }

  return instance;

}

// Remove targets from animation

function removeTargetsFromAnimations(targetsArray, animations) {
  for (var a = animations.length; a--;) {
    if (arrayContains(targetsArray, animations[a].animatable.target)) {
      animations.splice(a, 1);
    }
  }
}

function removeTargetsFromInstance(targetsArray, instance) {
  var animations = instance.animations;
  var children = instance.children;
  removeTargetsFromAnimations(targetsArray, animations);
  for (var c = children.length; c--;) {
    var child = children[c];
    var childAnimations = child.animations;
    removeTargetsFromAnimations(targetsArray, childAnimations);
    if (!childAnimations.length && !child.children.length) { children.splice(c, 1); }
  }
  if (!animations.length && !children.length) { instance.pause(); }
}

function removeTargetsFromActiveInstances(targets) {
  var targetsArray = parseTargets(targets);
  for (var i = activeInstances.length; i--;) {
    var instance = activeInstances[i];
    removeTargetsFromInstance(targetsArray, instance);
  }
}

// Stagger helpers

function stagger(val, params) {
  if ( params === void 0 ) params = {};

  var direction = params.direction || 'normal';
  var easing = params.easing ? parseEasings(params.easing) : null;
  var grid = params.grid;
  var axis = params.axis;
  var fromIndex = params.from || 0;
  var fromFirst = fromIndex === 'first';
  var fromCenter = fromIndex === 'center';
  var fromLast = fromIndex === 'last';
  var isRange = is.arr(val);
  var val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
  var val2 = isRange ? parseFloat(val[1]) : 0;
  var unit = getUnit(isRange ? val[1] : val) || 0;
  var start = params.start || 0 + (isRange ? val1 : 0);
  var values = [];
  var maxValue = 0;
  return function (el, i, t) {
    if (fromFirst) { fromIndex = 0; }
    if (fromCenter) { fromIndex = (t - 1) / 2; }
    if (fromLast) { fromIndex = t - 1; }
    if (!values.length) {
      for (var index = 0; index < t; index++) {
        if (!grid) {
          values.push(Math.abs(fromIndex - index));
        } else {
          var fromX = !fromCenter ? fromIndex%grid[0] : (grid[0]-1)/2;
          var fromY = !fromCenter ? Math.floor(fromIndex/grid[0]) : (grid[1]-1)/2;
          var toX = index%grid[0];
          var toY = Math.floor(index/grid[0]);
          var distanceX = fromX - toX;
          var distanceY = fromY - toY;
          var value = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
          if (axis === 'x') { value = -distanceX; }
          if (axis === 'y') { value = -distanceY; }
          values.push(value);
        }
        maxValue = Math.max.apply(Math, values);
      }
      if (easing) { values = values.map(function (val) { return easing(val / maxValue) * maxValue; }); }
      if (direction === 'reverse') { values = values.map(function (val) { return axis ? (val < 0) ? val * -1 : -val : Math.abs(maxValue - val); }); }
    }
    var spacing = isRange ? (val2 - val1) / maxValue : val1;
    return start + (spacing * (Math.round(values[i] * 100) / 100)) + unit;
  }
}

// Timeline

function timeline(params) {
  if ( params === void 0 ) params = {};

  var tl = anime(params);
  tl.duration = 0;
  tl.add = function(instanceParams, timelineOffset) {
    var tlIndex = activeInstances.indexOf(tl);
    var children = tl.children;
    if (tlIndex > -1) { activeInstances.splice(tlIndex, 1); }
    function passThrough(ins) { ins.passThrough = true; }
    for (var i = 0; i < children.length; i++) { passThrough(children[i]); }
    var insParams = mergeObjects(instanceParams, replaceObjectProps(defaultTweenSettings, params));
    insParams.targets = insParams.targets || params.targets;
    var tlDuration = tl.duration;
    insParams.autoplay = false;
    insParams.direction = tl.direction;
    insParams.timelineOffset = is.und(timelineOffset) ? tlDuration : getRelativeValue(timelineOffset, tlDuration);
    passThrough(tl);
    tl.seek(insParams.timelineOffset);
    var ins = anime(insParams);
    passThrough(ins);
    children.push(ins);
    var timings = getInstanceTimings(children, params);
    tl.delay = timings.delay;
    tl.endDelay = timings.endDelay;
    tl.duration = timings.duration;
    tl.seek(0);
    tl.reset();
    if (tl.autoplay) { tl.play(); }
    return tl;
  };
  return tl;
}

anime.version = '3.2.1';
anime.speed = 1;
// TODO:#review: naming, documentation
anime.suspendWhenDocumentHidden = true;
anime.running = activeInstances;
anime.remove = removeTargetsFromActiveInstances;
anime.get = getOriginalTargetValue;
anime.set = setTargetsValue;
anime.convertPx = convertPxToUnit;
anime.path = getPath;
anime.setDashoffset = setDashoffset;
anime.stagger = stagger;
anime.timeline = timeline;
anime.easing = parseEasings;
anime.penner = penner;
anime.random = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };

/* harmony default export */ __webpack_exports__["default"] = (anime);


/***/ }),

/***/ "./src/scripts/config/event-types.js":
/*!*******************************************!*\
  !*** ./src/scripts/config/event-types.js ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ({
  init: 1,
  route: 2,
  loadStart: 3,
  preload: 4,
  loading: 5,
  loaded: 6,
  unload: 7,
  resize: 8,
  scroll: 9,
  view: 10,
  wheel: 11,
  lang: 12,
  gdpr: 13,
  user: 14
});

/***/ }),

/***/ "./src/scripts/config/setup.js":
/*!*************************************!*\
  !*** ./src/scripts/config/setup.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var setup = {
  templateUrls: function templateUrls(urls) {
    return urls.map(function (x) {
      return '/templates/' + x + '.html?t=' + setup.timestamp();
    });
  },
  init: function init(obj) {
    $.each(obj, function (key, value) {
      if (setup[key]) {
        throw 'Duplicate key: ' + key;
      }

      setup[key] = function () {
        return value;
      };
    });
  },
  useVideo: function useVideo() {
    return navigator.vendor && navigator.vendor.match(/apple/i) && !navigator.userAgent.match(/crios/i) && !navigator.userAgent.match(/fxios/i);
  }
};
/* harmony default export */ __webpack_exports__["default"] = (setup);

/***/ }),

/***/ "./src/scripts/configurator/components/alert-box.js":
/*!**********************************************************!*\
  !*** ./src/scripts/configurator/components/alert-box.js ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var setjs_template_component_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/template/component.js */ "./src/scripts/setjs/template/component.js");

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(opts) {
  var alertComp = (0,setjs_template_component_js__WEBPACK_IMPORTED_MODULE_0__["default"])('config/alert-box', opts, {
    oK: function oK() {
      alertComp.$root.remove();
      opts.ok();
    },
    no: function no() {
      alertComp.$root.remove();
      opts.no();
    },
    cancel: function cancel() {
      alertComp.$root.remove();
    }
  });
  $body.append(alertComp.$root);
}

/***/ }),

/***/ "./src/scripts/configurator/components/range.js":
/*!******************************************************!*\
  !*** ./src/scripts/configurator/components/range.js ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var setjs_template_component_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/template/component.js */ "./src/scripts/setjs/template/component.js");
/* harmony import */ var setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/utility/numbers.js */ "./src/scripts/setjs/utility/numbers.js");


/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(opts) {
  var $el = opts.$el,
      update = opts.update,
      list = opts.list,
      min = opts.min,
      max = opts.max,
      _opts$grow_by = opts.grow_by,
      grow_by = _opts$grow_by === void 0 ? 0 : _opts$grow_by,
      _opts$step = opts.step,
      step = _opts$step === void 0 ? 0.1 : _opts$step,
      double = opts.double,
      _opts$decimals = opts.decimals,
      decimals = _opts$decimals === void 0 ? 2 : _opts$decimals;
  var restrict = opts.double ? opts.restrict : 0;
  var range = max - min;
  var rangeData = setupData({
    double: double,
    list: list,
    round: round
  });
  var rangeComp = (0,setjs_template_component_js__WEBPACK_IMPORTED_MODULE_0__["default"])('config/range', rangeData, {
    change: function change(_ref) {
      var $el = _ref.$el,
          arg = _ref.arg;
      var val = +$el.val();
      list[arg] = (0,setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_1__.roundNum)(val, decimals);
      setRange(arg, val);
      setupData(rangeData);
      update(val, +arg, opts);
    }
  });
  $el.append(rangeComp.$root);

  function setRange(arg, val) {
    if (arg) {
      max = Math.max(val, opts.max);
    } else {
      min = Math.min(val, opts.min);
    }

    range = max - min;
  }

  function setupData(data) {
    data.low_val = (list[0] - min) / range * 100;
    data.low_min = min - grow_by;
    data.low_max = restrict ? list[1] - step : max;

    if (double) {
      data.high_val = (list[1] - min) / range * 100;
      data.high_min = restrict ? list[0] + step : min;
      data.high_max = max + grow_by;
    }

    return data;
  }

  function round(num) {
    return (0,setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_1__.roundNum)(num, decimals);
  }
}

/***/ }),

/***/ "./src/scripts/configurator/configs.js":
/*!*********************************************!*\
  !*** ./src/scripts/configurator/configs.js ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "dataVersion": function() { return /* binding */ dataVersion; },
/* harmony export */   "getRangeConfig": function() { return /* binding */ getRangeConfig; },
/* harmony export */   "hasUnits": function() { return /* binding */ hasUnits; },
/* harmony export */   "createItem": function() { return /* binding */ createItem; },
/* harmony export */   "getUnits": function() { return /* binding */ getUnits; },
/* harmony export */   "getProps": function() { return /* binding */ getProps; }
/* harmony export */ });
var propList = ['opacity', 'translateX', 'translateY', 'scale', 'left', 'top', 'fontSize', 'easing', 'width', 'height', 'sequence'];
var dataVersion = 6;
function getRangeConfig(key) {
  if (key == 'opacity') {
    return {
      min: 0,
      max: 1
    };
  } else if (key == 'fontSize') {
    return {
      min: 1,
      max: 50
    };
  } else if (key == 'scale') {
    return {
      min: -50,
      max: 50
    };
  } else {
    return {
      min: -250,
      max: 250
    };
  }
}
function hasUnits(key) {
  return 'translateX translateY left top fontSize width height'.indexOf(key) >= 0;
}
function createItem(key) {
  var val = key == 'easing' ? 'linear' : getArr(key);

  if (hasUnits(key)) {
    return {
      key: key,
      val: val,
      unit: key == 'fontSize' ? 'rem' : '%'
    };
  } else {
    return {
      key: key,
      val: val
    };
  }
}
function getUnits(key) {
  if (key == 'fontSize') {
    return ['rem', 'em', 'px'];
  } else {
    return ['%', 'vw', 'vh', 'rem', 'em', 'px'];
  }
}
function getProps() {
  return propList.map(function (x) {
    return {
      value: x,
      txt: x
    };
  });
}

function getArr(key) {
  if (key == 'fontSize') {
    return [2, 10];
  } else if (key == 'scale') {
    return [1, 10];
  } else if (key == 'opacity') {
    return [0.5, 1];
  } else if (key == 'width' || key == 'height') {
    return [100, 200];
  } else {
    return [0, 50];
  }
}

/***/ }),

/***/ "./src/scripts/configurator/easings.js":
/*!*********************************************!*\
  !*** ./src/scripts/configurator/easings.js ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = (['linear', 'easeInSine', 'easeInCubic', 'easeInQuart', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeOutInQuad', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 'easeOutInCubic', 'easeInQuart', 'easeOutQuart', 'easeInOutQuart', 'easeOutInQuart', 'easeInQuint', 'easeOutQuint', 'easeInOutQuint', 'easeOutInQuint', 'easeInSine', 'easeOutSine', 'easeInOutSine', 'easeOutInSine', 'easeInExpo', 'easeOutExpo', 'easeInOutExpo', 'easeOutInExpo', 'easeInCirc', 'easeOutCirc', 'easeInOutCirc', 'easeOutInCirc', 'easeInBack', 'easeOutBack', 'easeInOutBack', 'easeOutInBack']);

/***/ }),

/***/ "./src/scripts/configurator/funcs.js":
/*!*******************************************!*\
  !*** ./src/scripts/configurator/funcs.js ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! core/acts-funcs.js */ "./src/scripts/core/acts-funcs.js");

(0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_0__.addFuncs)({
  hasProp: function hasProp(parent, opts, prop) {
    return prop in parent;
  },
  isArray: function isArray(val) {
    return Array.isArray(val);
  },
  perc: function perc(val) {
    return val + '%';
  },
  localeString: function localeString(ts) {
    return new Date(ts).toLocaleString();
  }
});

/***/ }),

/***/ "./src/scripts/configurator/init.js":
/*!******************************************!*\
  !*** ./src/scripts/configurator/init.js ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; },
/* harmony export */   "timelineUpdate": function() { return /* binding */ timelineUpdate; }
/* harmony export */ });
/* harmony import */ var setjs_template_component_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/template/component.js */ "./src/scripts/setjs/template/component.js");
/* harmony import */ var setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/kernel/basics.js */ "./src/scripts/setjs/kernel/basics.js");
/* harmony import */ var setjs_template_templates_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! setjs/template/templates.js */ "./src/scripts/setjs/template/templates.js");
/* harmony import */ var setjs_utility_assets_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! setjs/utility/assets.js */ "./src/scripts/setjs/utility/assets.js");
/* harmony import */ var setjs_utility_calls_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! setjs/utility/calls.js */ "./src/scripts/setjs/utility/calls.js");
/* harmony import */ var setjs_plugins_template_funcs_basic_filters_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! setjs/plugins/template-funcs/basic-filters.js */ "./src/scripts/setjs/plugins/template-funcs/basic-filters.js");
/* harmony import */ var setjs_plugins_template_funcs_misc_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! setjs/plugins/template-funcs/misc.js */ "./src/scripts/setjs/plugins/template-funcs/misc.js");
/* harmony import */ var setjs_plugins_template_funcs_debug_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! setjs/plugins/template-funcs/debug.js */ "./src/scripts/setjs/plugins/template-funcs/debug.js");
/* harmony import */ var setjs_plugins_misc_dropdown_menu_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! setjs/plugins/misc/dropdown-menu.js */ "./src/scripts/setjs/plugins/misc/dropdown-menu.js");
/* harmony import */ var setjs_plugins_misc_dropdown_menu_js__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(setjs_plugins_misc_dropdown_menu_js__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var configurator_funcs_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! configurator/funcs.js */ "./src/scripts/configurator/funcs.js");
/* harmony import */ var configurator_menu_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! configurator/menu.js */ "./src/scripts/configurator/menu.js");
/* harmony import */ var configurator_waterfall_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! configurator/waterfall.js */ "./src/scripts/configurator/waterfall.js");
/* harmony import */ var configurator_player_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! configurator/player.js */ "./src/scripts/configurator/player.js");
/* harmony import */ var configurator_easings_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! configurator/easings.js */ "./src/scripts/configurator/easings.js");
/* harmony import */ var core_timeliner_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! core/timeliner.js */ "./src/scripts/core/timeliner.js");















var launchComp;
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_1__.setDefData)('easings', configurator_easings_js__WEBPACK_IMPORTED_MODULE_13__["default"]);
  (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_1__.setDefData)('progress', '0.0');
  (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_1__.setDefData)('animPlaying', false);
  (0,setjs_utility_calls_js__WEBPACK_IMPORTED_MODULE_4__.batchCall)({
    success: function success() {
      launchComp = (0,setjs_template_component_js__WEBPACK_IMPORTED_MODULE_0__["default"])('config/launch');
      $body.append(launchComp.$root);
    }
  }).add(setjs_template_templates_js__WEBPACK_IMPORTED_MODULE_2__.ensureTemplates, {
    urls: ['/templates/configurator.html?t=' + Date.now()]
  }).add(setjs_utility_assets_js__WEBPACK_IMPORTED_MODULE_3__.loadAssets, {
    urlSets: [['/styles/configurator.css']]
  }).go();
}
function timelineUpdate(timeConfigs) {
  if (launchComp) {
    launchComp.data.timeConfigs = timeConfigs;
    launchComp.renderList('timeConfigs');
    timeConfigs.forEach(function (config) {
      (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_14__.addProgressLinster)(config.id, function (progress) {
        (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_1__.setDefData)('progress', config.id + ':' + progress.toFixed(1));
      });
    });

    if (!timeConfigs.length) {
      (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_1__.setDefData)('progress', '0.0');
    }
  } else {
    setTimeout(timelineUpdate, 250, timeConfigs);
  }
}

/***/ }),

/***/ "./src/scripts/configurator/menu.js":
/*!******************************************!*\
  !*** ./src/scripts/configurator/menu.js ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var setjs_template_binding_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/template/binding.js */ "./src/scripts/setjs/template/binding.js");
/* harmony import */ var core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! core/acts-funcs.js */ "./src/scripts/core/acts-funcs.js");
/* harmony import */ var configurator_timeline_panel_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! configurator/timeline-panel.js */ "./src/scripts/configurator/timeline-panel.js");
/* harmony import */ var configurator_waterfall_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! configurator/waterfall.js */ "./src/scripts/configurator/waterfall.js");
/* harmony import */ var core_scroll_data_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! core/scroll-data.js */ "./src/scripts/core/scroll-data.js");






function createDownloadUrl(timedata) {
  timedata.timestamp = Date.now();
  return URL.createObjectURL(new Blob([JSON.stringify(timedata, null, 2)], {
    type: 'text/json;encoding:utf-8'
  }));
}

function download(_ref) {
  var comp = _ref.comp;
  var timedata = (0,core_scroll_data_js__WEBPACK_IMPORTED_MODULE_4__.getTimeData)(comp.data.config.id);
  comp.$downloadBtn.attr({
    download: timedata.id + '.json',
    href: createDownloadUrl(timedata)
  })[0].click();
}

function closePanel() {
  $('.side-panel').remove();
  $body.removeClass('panel-open');
  (0,setjs_template_binding_js__WEBPACK_IMPORTED_MODULE_0__.updateWatches)();
}

function panelFunc(func) {
  return function (opts) {
    closePanel();
    func(opts);
  };
}

(0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_1__.addAction)('closePanel', closePanel);
(0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_1__.addAction)('download', download);
(0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_1__.addAction)('showTimeline', panelFunc(configurator_timeline_panel_js__WEBPACK_IMPORTED_MODULE_2__["default"]));
(0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_1__.addAction)('showWaterfall', panelFunc(configurator_waterfall_js__WEBPACK_IMPORTED_MODULE_3__["default"]));
(0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_1__.addAction)('import', function (opts) {
  var file = opts.e.target.files[0];
  if (!file) return;
  var reader = new FileReader();

  reader.onload = function (e) {
    closePanel();
    (0,core_scroll_data_js__WEBPACK_IMPORTED_MODULE_4__.setTimeData)(JSON.parse(e.target.result));
  };

  reader.readAsText(file);
});

/***/ }),

/***/ "./src/scripts/configurator/player.js":
/*!********************************************!*\
  !*** ./src/scripts/configurator/player.js ***!
  \********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var animejs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! animejs */ "./node_modules/animejs/lib/anime.es.js");
/* harmony import */ var setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/kernel/basics.js */ "./src/scripts/setjs/kernel/basics.js");
/* harmony import */ var core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! core/acts-funcs.js */ "./src/scripts/core/acts-funcs.js");
/* harmony import */ var core_timeliner_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! core/timeliner.js */ "./src/scripts/core/timeliner.js");
/* harmony import */ var helpers_app_helpers_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! helpers/app-helpers.js */ "./src/scripts/helpers/app-helpers.js");





var previous;

function playTimeline(config, start, end) {
  var winHeight = (0,helpers_app_helpers_js__WEBPACK_IMPORTED_MODULE_4__.getWinHeight)();
  var height = config.$container.outerHeight() - winHeight;
  var target = {
    time: start
  };
  (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_3__.resetTimeline)(config.id);
  previous = {
    target: target,
    anim: (0,animejs__WEBPACK_IMPORTED_MODULE_0__["default"])({
      targets: target,
      time: end,
      duration: height * (end - start) / 100,
      easing: 'linear',
      complete: function complete() {
        (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_1__.setDefData)('animPlaying', false);
        previous = 0;
      },
      update: function update() {
        $doc.scrollTop(config.$container.offset().top + target.time / 100 * height);
        (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_1__.setDefData)('progress', config.id + ':' + target.time.toFixed(1));
      }
    })
  };
}

function stopPlayer() {
  (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_1__.setDefData)('animPlaying', false);

  if (previous) {
    previous.anim.remove(previous.target);
    previous = 0;
  }
}

(0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_2__.addAction)('toggleAnim', function (opts) {
  var full = opts.data.field ? 0 : 100;

  if (previous) {
    stopPlayer();
  } else {
    (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_1__.setDefData)('animPlaying', true);
    playTimeline(opts.data.rd.config || opts.data.config, full ? 0 : opts.data.field.time[0], full || opts.data.field.time[1]);
  }
});

/***/ }),

/***/ "./src/scripts/configurator/timeline-panel.js":
/*!****************************************************!*\
  !*** ./src/scripts/configurator/timeline-panel.js ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var setjs_template_component_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/template/component.js */ "./src/scripts/setjs/template/component.js");
/* harmony import */ var setjs_utility_objects_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/utility/objects.js */ "./src/scripts/setjs/utility/objects.js");
/* harmony import */ var core_scroll_data_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! core/scroll-data.js */ "./src/scripts/core/scroll-data.js");
/* harmony import */ var configurator_configs_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! configurator/configs.js */ "./src/scripts/configurator/configs.js");
/* harmony import */ var configurator_components_range_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! configurator/components/range.js */ "./src/scripts/configurator/components/range.js");
/* harmony import */ var setjs_utility_array_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! setjs/utility/array.js */ "./src/scripts/setjs/utility/array.js");
/* harmony import */ var configurator_components_alert_box_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! configurator/components/alert-box.js */ "./src/scripts/configurator/components/alert-box.js");
/* harmony import */ var core_timeliner_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! core/timeliner.js */ "./src/scripts/core/timeliner.js");









/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(opts) {
  var timedata = (0,core_scroll_data_js__WEBPACK_IMPORTED_MODULE_2__.getTimeData)(opts.data.config.id);
  var sequences = (0,core_scroll_data_js__WEBPACK_IMPORTED_MODULE_2__.getSequences)();
  var compData = {
    timedata: timedata,
    config: opts.data.config,
    dom: timedata.dom,
    obj: timedata.obj,
    seq: sequences,
    hasUnits: configurator_configs_js__WEBPACK_IMPORTED_MODULE_3__.hasUnits,
    getUnits: configurator_configs_js__WEBPACK_IMPORTED_MODULE_3__.getUnits,
    getProps: function getProps(list) {
      var props = (0,configurator_configs_js__WEBPACK_IMPORTED_MODULE_3__.getProps)();

      list.forEach(function (item) {
        (0,setjs_utility_array_js__WEBPACK_IMPORTED_MODULE_5__.removeFromListByValue)(props, item.key, 'value');
      });
      return props;
    },
    setupRange: function setupRange(item, _ref, time, prop) {
      var $el = _ref.$el;
      var config = $el.data('arg') || (0,configurator_configs_js__WEBPACK_IMPORTED_MODULE_3__.getRangeConfig)(item.key);
      config.double = time;
      (0,configurator_components_range_js__WEBPACK_IMPORTED_MODULE_4__["default"])($.extend({
        $el: $el,
        list: item[prop || 'val'],
        update: function update(val) {
          (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_7__.resetTimeline)(timedata.id);

          if (prop == 'time') {
            $doc.scrollTop(val * (document.scrollingElement.scrollHeight - $win.height()));
          }
        }
      }, config));
    },
    slotData: function slotData(_, _ref2) {
      var target_prop = _ref2.target_prop;
      return {
        items: compData[target_prop],
        target_prop: target_prop
      };
    }
  };
  var editorComp = (0,setjs_template_component_js__WEBPACK_IMPORTED_MODULE_0__["default"])('config/timeline', compData, {
    tabClick: function tabClick(_ref3) {
      var $el = _ref3.$el;
      $el.addClass('active');
      $el.siblings().removeClass('active');
      editorComp.$root.find('.tabs .tab').addClass('hide').eq($el.index()).removeClass('hide');
    },
    addProp: function addProp(_ref4) {
      var $el = _ref4.$el,
          data = _ref4.data,
          comp = _ref4.comp;
      data.pd.field.list.push((0,configurator_configs_js__WEBPACK_IMPORTED_MODULE_3__.createItem)(data.prop.value));
      $el.hide();
      comp.pComp.renderList('list');
    },
    addItem: function addItem(_ref5) {
      var $el = _ref5.$el,
          comp = _ref5.comp,
          arg = _ref5.arg,
          end = _ref5.end;
      end();
      compData[arg].push({
        el: $el.find('input').val(),
        fields: []
      });
      comp.renderList('targets');
      $el.find('input').val('');
    },
    removeItem: function removeItem(_ref6) {
      var comp = _ref6.comp,
          data = _ref6.data;
      (0,configurator_components_alert_box_js__WEBPACK_IMPORTED_MODULE_6__["default"])({
        title: data.target.el,
        okTxt: 'Delete',
        noClose: 0,
        message: 'Are you sure you want to delete ' + data.target.el + '?',
        ok: function ok() {
          data.pd.items.splice(data.dex, 1);
          comp.pComp.renderList('targets');
          (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_7__.resetTimeline)(timedata.id);
        }
      });
    },
    addField: function addField(_ref7) {
      var data = _ref7.data,
          comp = _ref7.comp;
      data.target.fields.push({
        time: [0, 10],
        list: []
      });
      comp.renderList('fields');
      comp.update();
    },
    removeField: function removeField(_ref8) {
      var data = _ref8.data,
          comp = _ref8.comp;
      data.pd.target.fields.splice(data.dex, 1);
      comp.pComp.renderList('fields');
      comp.pComp.update();
      (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_7__.resetTimeline)(timedata.id);
    },
    removeProp: function removeProp(_ref9) {
      var comp = _ref9.comp,
          data = _ref9.data;
      data.pd.field.list.splice(data.dex, 1);
      comp.pComp.renderList('list', 'props');
    },
    toggleBrowser: function toggleBrowser(_ref10) {
      var $el = _ref10.$el,
          comp = _ref10.comp,
          data = _ref10.data,
          arg = _ref10.arg;
      var currentVal = data.field.browser || 0;
      arg = +arg;

      if ($el.hasClass('on')) {
        data.field.browser = currentVal ^ arg;
      } else {
        data.field.browser = currentVal | arg;
      }

      if (!data.field.browser) {
        delete data.field.browser;
      }

      comp.update(comp.$root.find('.bit-flag'));
      (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_7__.resetTimeline)(timedata.id);
    },
    toggleView: function toggleView(_ref11) {
      var comp = _ref11.comp;
      comp.$root.toggleClass('open'); // comp.$root.siblings().removeClass('open');
    },
    unitChange: function unitChange(opts) {
      opts.data.item.unit = opts.$el.val();
      (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_7__.resetTimeline)(timedata.id);
    },
    valChange: function valChange(opts) {
      opts.data.item.val = opts.$el.val();
      (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_7__.resetTimeline)(timedata.id);
    }
  });
  (0,configurator_components_range_js__WEBPACK_IMPORTED_MODULE_4__["default"])({
    $el: editorComp.$lengthRange,
    list: [timedata.pages],
    min: 0,
    max: 100,
    decimals: 0,
    update: function update(val) {
      changeValue('pages', val);
    }
  });
  $body.append(editorComp.$root).addClass('panel-open');

  function changeValue(path, val) {
    (0,setjs_utility_objects_js__WEBPACK_IMPORTED_MODULE_1__.storeValue)(timedata, path, val);
    (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_7__.resetTimeline)(timedata.id);
  }
}

/***/ }),

/***/ "./src/scripts/configurator/waterfall.js":
/*!***********************************************!*\
  !*** ./src/scripts/configurator/waterfall.js ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var setjs_template_component_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/template/component.js */ "./src/scripts/setjs/template/component.js");
/* harmony import */ var setjs_utility_array_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/utility/array.js */ "./src/scripts/setjs/utility/array.js");
/* harmony import */ var setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! setjs/utility/numbers.js */ "./src/scripts/setjs/utility/numbers.js");
/* harmony import */ var core_timeliner_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! core/timeliner.js */ "./src/scripts/core/timeliner.js");
/* harmony import */ var core_scroll_data_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! core/scroll-data.js */ "./src/scripts/core/scroll-data.js");





/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(opts) {
  var timedata = (0,core_scroll_data_js__WEBPACK_IMPORTED_MODULE_4__.getTimeData)(opts.data.config.id);
  var allAnims = getAnims(timedata);
  var waterfallComp = (0,setjs_template_component_js__WEBPACK_IMPORTED_MODULE_0__["default"])('config/waterfall', {
    timedata: timedata,
    config: opts.data.config,
    filterBy: 0,
    getAnims: function getAnims(data) {
      return data.filterBy ? allAnims.filter(function (x) {
        return x.target == data.filterBy;
      }) : allAnims;
    },
    rangeCss: function rangeCss(anim, _ref) {
      var $el = _ref.$el;
      $el.css({
        left: anim.start + '%',
        width: anim.end - anim.start + '%'
      });
    }
  }, {
    changeStart: function changeStart(_ref2) {
      var $el = _ref2.$el,
          data = _ref2.data;
      var anims = waterfallComp.anims.list.map(function (x) {
        return x.data.anim;
      });
      var dex = data.dex;
      var diff = $el.val() - anims[dex].start;

      for (var i = dex; i < anims.length; i++) {
        anims[i].start = anims[i].field.time[0] = (0,setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_2__.roundNum)(anims[i].start + diff, 2);
        anims[i].end = anims[i].field.time[1] = (0,setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_2__.roundNum)(anims[i].end + diff, 2);
        waterfallComp.anims.list[i].update();
      }
    },
    changeEnd: function changeEnd(_ref3) {
      var $el = _ref3.$el,
          data = _ref3.data,
          comp = _ref3.comp;
      data.anim.end = data.anim.field.time[1] = Math.max(data.anim.start + 0.01, +$el.val());
      comp.update();
    },
    applyFilter: function applyFilter(_ref4) {
      var data = _ref4.data;
      waterfallComp.data.filterBy = waterfallComp.data.filterBy ? 0 : data.anim.target;
      waterfallComp.renderList('anims');
      waterfallComp.update();
    },
    finish: function finish() {
      var ratio = 100 / maxEnd();
      allAnims.forEach(function (anim) {
        anim.start = anim.field.time[0] = (0,setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_2__.roundNum)(anim.start * ratio, 2);
        anim.end = anim.field.time[1] = (0,setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_2__.roundNum)(anim.end * ratio, 2);
      });
      waterfallComp.renderList('anims');
      (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_3__.resetTimeline)(timedata.id);
    },
    expand: function expand() {
      allAnims.forEach(function (anim) {
        anim.start = anim.field[0] = (0,setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_2__.roundNum)(anim.start * 0.95, 2);
        anim.end = anim.field[1] = (0,setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_2__.roundNum)(anim.end * 0.95, 2);
      });
      waterfallComp.renderList('anims');
      (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_3__.resetTimeline)(timedata.id);
    }
  });
  $body.append(waterfallComp.$root).addClass('panel-open');

  function maxEnd() {
    var end = 0;
    allAnims.forEach(function (anim) {
      end = Math.max(end, anim.end);
    });
    return end || 100;
  }
}

function getAnims(timedata) {
  var anims = [];
  addAnims(timedata.dom);
  addAnims(timedata.obj);
  return (0,setjs_utility_array_js__WEBPACK_IMPORTED_MODULE_1__.sort)(anims, 'start');

  function addAnims(list, type) {
    list.forEach(function (target) {
      anims = anims.concat(target.fields.filter(function (x) {
        return x.time;
      }).map(function (field) {
        return {
          type: type,
          start: field.time[0],
          end: field.time[1],
          field: field,
          target: target
        };
      }));
    });
  }
}

/***/ }),

/***/ "./src/scripts/core/acts-funcs.js":
/*!****************************************!*\
  !*** ./src/scripts/core/acts-funcs.js ***!
  \****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "act": function() { return /* binding */ act; },
/* harmony export */   "func": function() { return /* binding */ func; },
/* harmony export */   "jqFuncs": function() { return /* binding */ jqFuncs; },
/* harmony export */   "addAction": function() { return /* binding */ addAction; },
/* harmony export */   "addFuncs": function() { return /* binding */ addFuncs; }
/* harmony export */ });
var functions = {};
var actions = {};
var jqList = ['attr', 'css', 'data', 'html', 'prop', 'text', 'addClass', 'toggleClass', 'val'];
function act(funcName) {
  if (actions[funcName]) {
    return actions[funcName];
  }

  throw {
    msg: 'No such function',
    name: funcName
  };
}
function func(funcName) {
  if (functions[funcName]) {
    return functions[funcName];
  } else if (jqList.indexOf(funcName) >= 0) {
    functions[funcName] = function (val, _ref, val2) {
      var $el = _ref.$el;

      if (arguments.length > 2) {
        $el[funcName](val2, val);
      } else {
        $el[funcName](val);
      }
    };

    return functions[funcName];
  } else {
    throw {
      msg: 'No such function',
      name: funcName
    };
  }
}
function jqFuncs(list) {
  jqList = jqList.concat(list);
}
function addAction(name, onFunc) {
  if (actions[name]) {
    throw 'action exists: ' + name;
  }

  actions[name] = onFunc;
}
function addFuncs(funcs) {
  Object.keys(funcs).forEach(function (funcName) {
    if (functions[funcName] || typeof funcs[funcName] != 'function') {
      throw {
        msg: 'Duplicate or not a function',
        funcName: funcName,
        funcs: funcs
      };
    }

    functions[funcName] = funcs[funcName];
  });
}

/***/ }),

/***/ "./src/scripts/core/loader.js":
/*!************************************!*\
  !*** ./src/scripts/core/loader.js ***!
  \************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getImage": function() { return /* binding */ getImage; },
/* harmony export */   "getVideo": function() { return /* binding */ getVideo; },
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var config_setup_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! config/setup.js */ "./src/scripts/config/setup.js");
/* harmony import */ var setjs_utility_assets_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/utility/assets.js */ "./src/scripts/setjs/utility/assets.js");
/* harmony import */ var setjs_utility_calls_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! setjs/utility/calls.js */ "./src/scripts/setjs/utility/calls.js");



var imgAssets;
var videos;
var $progress = $('#progress-bar');
function getImage(name) {
  return imgAssets[name] && imgAssets[name].img;
}
function getVideo(name) {
  return videos[name];
}
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(done) {
  var imagesToLoad = [{
    id: 'usain',
    url: '/images/usainbolt.png'
  }];
  var bc = (0,setjs_utility_calls_js__WEBPACK_IMPORTED_MODULE_2__.batchCall)({
    success: function success(assets) {
      imgAssets = assets.images;
      videos = assets.videos || {};
      done();
      setTimeout(function () {
        $progress.css('width', '100%');
        $progress.animate({
          'opacity': 0
        }, 1200, function () {
          $progress.remove();
        });
      }, 2000);
    },
    error: function error() {
      alert('There was an error. Please try later.');
    }
  }).add(imageLoader, null, 'images');

  if (config_setup_js__WEBPACK_IMPORTED_MODULE_0__["default"].useVideo()) {
    bc.add(videoLoader, null, 'videos');
  } else {
    imagesToLoad.push({
      id: 'logo',
      url: '/images/vmlogoforparticles.png'
    });
  }

  bc.go();

  function imageLoader(opts) {
    (0,setjs_utility_assets_js__WEBPACK_IMPORTED_MODULE_1__.loadImages)(imagesToLoad, opts.success, function (prog) {
      $progress.css('width', 20 + 60 * prog + '%');
    });
  }

  function videoLoader(opts) {
    var $vmVideo = $("<video id=\"particles-vid\" autoplay playsinline muted src=\"/videos/particles.mp4\"></video>");
    $vmVideo.on('loadeddata', function () {
      if ($vmVideo[0].readyState >= 2) {
        opts.success({
          $vmVideo: $vmVideo
        });
      }
    });
  }
}

/***/ }),

/***/ "./src/scripts/core/nav.js":
/*!*********************************!*\
  !*** ./src/scripts/core/nav.js ***!
  \*********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var config_setup_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! config/setup.js */ "./src/scripts/config/setup.js");
/* harmony import */ var animejs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! animejs */ "./node_modules/animejs/lib/anime.es.js");
/* harmony import */ var core_timeliner_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! core/timeliner.js */ "./src/scripts/core/timeliner.js");
/* harmony import */ var pages_home_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! pages/home.js */ "./src/scripts/pages/home.js");
/* harmony import */ var pages_scream_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! pages/scream.js */ "./src/scripts/pages/scream.js");
/* harmony import */ var pages_static_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! pages/static.js */ "./src/scripts/pages/static.js");
/* harmony import */ var helpers_dom_helpers__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! helpers/dom-helpers */ "./src/scripts/helpers/dom-helpers.js");







/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var allowScroll = 1;
  var $nav = $('#nav');
  var navData = {
    navProgress: 0
  };
  var navTimeline = animejs__WEBPACK_IMPORTED_MODULE_1__["default"].timeline({
    duration: 100,
    autoplay: false,
    easing: 'linear'
  }).add({
    targets: '#nav-btn',
    rotate: [0, '-315deg'],
    duration: 100
  }).add({
    targets: '#nav .content, #nav .overlay',
    translateX: [0, '-100%'],
    duration: 100
  }, 0);
  var pages = {
    home: (0,pages_home_js__WEBPACK_IMPORTED_MODULE_3__["default"])(),
    'hi-scream': (0,pages_scream_js__WEBPACK_IMPORTED_MODULE_4__["default"])(),
    about: (0,pages_static_js__WEBPACK_IMPORTED_MODULE_5__["default"])('about'),
    create: (0,pages_static_js__WEBPACK_IMPORTED_MODULE_5__["default"])('create'),
    content: (0,pages_static_js__WEBPACK_IMPORTED_MODULE_5__["default"])('content'),
    contact: (0,pages_static_js__WEBPACK_IMPORTED_MODULE_5__["default"])('contact'),
    production: (0,pages_static_js__WEBPACK_IMPORTED_MODULE_5__["default"])('production'),
    'dj-snake': (0,pages_static_js__WEBPACK_IMPORTED_MODULE_5__["default"])('snake', {
      title: 2020,
      page: 800
    }),
    ibiza: (0,pages_static_js__WEBPACK_IMPORTED_MODULE_5__["default"])('ibiza', {
      title: 20,
      page: 200
    }),
    'an-ant-for-ants': (0,pages_static_js__WEBPACK_IMPORTED_MODULE_5__["default"])('ants', {
      title: 20,
      page: 200
    }),
    'institut-du-monde': (0,pages_static_js__WEBPACK_IMPORTED_MODULE_5__["default"])('institut', {
      title: 20,
      page: 200
    }),
    notfound: (0,pages_static_js__WEBPACK_IMPORTED_MODULE_5__["default"])('404', {
      title: 20,
      page: 200
    })
  };
  var lastPage;
  window.onpopstate = handleRoute;
  (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_2__.addProgressLinster)('home', function (progress, _ref) {
    var navParams = _ref.navParams;

    if (allowScroll) {
      navData.navProgress = navParams.prog;
      navTimeline.seek(navData.navProgress);
      $nav.find('.reveal').toggleClass('show', navData.navProgress > 0);
    } else if (navParams.prog < 1) {
      allowScroll = 1;
    }
  });
  $('[data-href]').each(function () {
    var $el = $(this);
    var href = $el.data('href');

    if (href[0] != '/') {
      href = '/' + href;
    }

    href = href + config_setup_js__WEBPACK_IMPORTED_MODULE_0__["default"].extension();
    $el.on('click', function (e) {
      e.preventDefault();
      window.history.pushState({}, document.title, href);
      handleRoute($el.closest('.footer').length);
    }).css('cursor', 'pointer').attr('href', href);
  });
  handleRoute();

  function handleRoute(slide) {
    var route = document.location.pathname.replace(/^\/|\/$|\.html$/g, '') || 'home';
    var page = pages[route] || pages.notfound;
    toggleMenu(false);

    if (page != lastPage) {
      (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_2__.disableTimelines)();
      lastPage && lastPage.deactivate();
      showPage(page, slide);
      lastPage = page;
    }
  }

  $nav.find('#nav-btn').on('click', function () {
    $('.work-dropdown').css('height', '').removeClass('open');
    toggleMenu(navData.navProgress == 0 || navData.navProgress >= 50 && navData.navProgress < 99);
  });
  $nav.find('.work-btn').on('click', function () {
    var $dropdown = $('.work-dropdown').toggleClass('open');
    $dropdown.css('height', $dropdown.hasClass('open') ? $('.work-dropdown-inner').height() + 10 : 0);
    return false;
  });

  function toggleMenu(open) {
    (0,animejs__WEBPACK_IMPORTED_MODULE_1__["default"])({
      targets: navData,
      navProgress: open ? 100 : 0,
      easing: 'easeInOutQuart',
      duration: 1200,
      update: function update() {
        navTimeline.seek(navData.navProgress);
      }
    });
    $nav.find('.reveal').toggleClass('show', open);
    allowScroll = 0;
  }

  function showPage(page, slide) {
    var $page = page.$root;
    var $main = $page.find('.main').removeClass('show');
    var $intro = $page.find('.intro').css({
      opacity: '',
      transform: ''
    });
    var $bg = $page.find('.page-bg').css({
      transform: '',
      opacity: ''
    });
    var $oldPage = $('.page.show');
    $main.find('.right').css({
      opacity: ''
    });
    $page.find('.reveal').removeClass('show');

    if (lastPage && slide) {
      return slidePage({
        page: page,
        $oldPage: $oldPage,
        $page: $page,
        $intro: $intro,
        $main: $main,
        $bg: $bg
      });
    }

    $doc.scrollTop(0);

    if ($oldPage.length) {
      (0,animejs__WEBPACK_IMPORTED_MODULE_1__["default"])({
        targets: $oldPage.css({
          zIndex: 12
        })[0],
        opacity: [1, 0],
        duration: 800,
        easing: 'linear',
        complete: function complete() {
          $oldPage.removeClass('show ready').css({
            zIndex: -1,
            opacity: ''
          });
        }
      });
      (0,animejs__WEBPACK_IMPORTED_MODULE_1__["default"])({
        targets: $page[0],
        opacity: [0, 1],
        duration: 800,
        easing: 'linear'
      });
      displayPage({
        page: page,
        $page: $page,
        $intro: $intro,
        $main: $main,
        $bg: $bg
      });
    } else {
      $('.page').css('opacity', '');
      setTimeout(displayPage, page.times.page, {
        page: page,
        $page: $page,
        $intro: $intro,
        $main: $main,
        $bg: $bg
      });
    }
  }

  function slidePage(_ref2) {
    var page = _ref2.page,
        $oldPage = _ref2.$oldPage,
        $page = _ref2.$page,
        $intro = _ref2.$intro,
        $main = _ref2.$main,
        $bg = _ref2.$bg;
    var $detail = $oldPage.find('.detail-section').css({
      position: 'fixed',
      top: 'auto'
    });
    var $others = $oldPage.find('>*').not($detail).css('display', 'none');
    $page.css({
      zIndex: 11,
      opacity: 1
    }).addClass('show ready');
    displayPage({
      page: page,
      $page: $page,
      $intro: $intro,
      $main: $main,
      $bg: $bg
    });
    $oldPage.css({
      zIndex: 12,
      background: 'none',
      position: 'fixed'
    });
    $doc.scrollTop(1);
    (0,animejs__WEBPACK_IMPORTED_MODULE_1__["default"])({
      targets: $detail[0],
      bottom: [0, $win.height()],
      duration: 1500,
      easing: 'linear',
      complete: function complete() {
        $oldPage.removeClass('show ready').css({
          zIndex: -1,
          background: '',
          position: ''
        });
        $detail.css({
          bottom: '',
          position: '',
          top: ''
        });
        $others.css('display', '');
      }
    });
  }

  function displayPage(_ref3) {
    var page = _ref3.page,
        $page = _ref3.$page,
        $intro = _ref3.$intro,
        $main = _ref3.$main,
        $bg = _ref3.$bg;
    var triTop = $page.find('.tri-wrap.top')[0];
    $page.addClass('show').css({
      zIndex: 11
    });
    $main.addClass('show');
    $page.find('.services-outer').css('height', '').removeClass('active');
    $page.find('.services-btn').removeClass('active');
    (0,helpers_dom_helpers__WEBPACK_IMPORTED_MODULE_6__.fixSizes)();

    if ($intro[0]) {
      (0,animejs__WEBPACK_IMPORTED_MODULE_1__["default"])({
        targets: $intro[0],
        opacity: [0, 1],
        duration: 800,
        delay: $intro.data('time') || 800,
        easing: 'easeInSine'
      });
    }

    (0,animejs__WEBPACK_IMPORTED_MODULE_1__["default"])({
      targets: $bg[0],
      opacity: $bg.data('opacity'),
      scale: $bg.data('scale'),
      duration: 3300,
      easing: 'linear'
    });
    triTop && (0,animejs__WEBPACK_IMPORTED_MODULE_1__["default"])({
      targets: [triTop, $page.find('.tri-wrap.bottom')[0]],
      opacity: [0.8, 0.4],
      scale: [2, 1],
      duration: 3500,
      easing: 'linear'
    });
    page.activate();
    setTimeout(function () {
      $page.find('.reveal').addClass('show');
      $doc.scrollTop(0);
      setTimeout(function () {
        $main.find('.left').addClass('show');
        $page.addClass('ready');
        (0,animejs__WEBPACK_IMPORTED_MODULE_1__["default"])({
          targets: $main.find('.right')[0],
          opacity: [0, 1],
          duration: 800,
          delay: 1000,
          easing: 'easeInSine'
        });
      }, 1000);
    }, page.times.title);
  }
}

/***/ }),

/***/ "./src/scripts/core/scroll-data.js":
/*!*****************************************!*\
  !*** ./src/scripts/core/scroll-data.js ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getSequences": function() { return /* binding */ getSequences; },
/* harmony export */   "getTimeData": function() { return /* binding */ getTimeData; },
/* harmony export */   "setTimeData": function() { return /* binding */ setTimeData; },
/* harmony export */   "getNames": function() { return /* binding */ getNames; }
/* harmony export */ });
/* harmony import */ var data_home_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! data/home.json */ "./src/scripts/data/home.json");
/* harmony import */ var data_sequences_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! data/sequences.json */ "./src/scripts/data/sequences.json");
/* harmony import */ var core_timeliner_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! core/timeliner.js */ "./src/scripts/core/timeliner.js");



var map = {
  home: data_home_json__WEBPACK_IMPORTED_MODULE_0__
};
function getSequences() {
  return data_sequences_json__WEBPACK_IMPORTED_MODULE_1__;
}
function getTimeData(name) {
  return map[name];
}
function setTimeData(timedata) {
  map[timedata.id] = timedata;
  (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_2__.resetTimeline)(timedata.id);
}
function getNames() {
  return Object.keys(map);
}

/***/ }),

/***/ "./src/scripts/core/setjs-init.js":
/*!****************************************!*\
  !*** ./src/scripts/core/setjs-init.js ***!
  \****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var setjs_kernel_setjs_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/kernel/setjs.js */ "./src/scripts/setjs/kernel/setjs.js");


function fixPath(pathStr) {
  if (RegExp('account/(confirm|reset-password)/.+/').test(pathStr)) {
    return pathStr;
  }

  return pathStr.replace(/\/{2,}/g, '/').replace(/(.+)\/$/, '$1');
}

function getLink(subRoute) {
  return fixPath('/' + (subRoute || ''));
}

function compUpdate() {}

function handleEvent(args, func) {
  var comp = args.comp,
      $el = args.$el,
      action = args.action,
      e = args.e;

  if (comp.busy || e.type == 'submit' || $el.data('stop')) {
    // Do this early to avoid default browser action in case of errors
    e.preventDefault();
    e.stopPropagation();
  }

  if (!comp.busy) {
    args._e = e;

    if (e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
      args.e = e.originalEvent.changedTouches[0];
    }

    if (action == 'form') {
      var $button = $el.find('[type="submit"]');
      comp.busy = true;
      $button.prop('disabled', true);
      $el.addClass('loading').removeClass('error success');

      args.error = function (message) {
        args.end('error', message);
      };

      args.success = function (messageObj) {
        args.end('success', messageObj && messageObj.message || messageObj);
      };

      args.end = function (cls, message) {
        comp.busy = false;
        $el.removeClass('loading').addClass(cls);
        $button.prop('disabled', false);
        $('body').removeClass('loading');

        if (comp.$formMsg) {
          comp.$formMsg.text(message || '');
        }
      };
    }

    func(args);
  }
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  (0,setjs_kernel_setjs_js__WEBPACK_IMPORTED_MODULE_0__.initSetjs)({
    fixPath: fixPath,
    getLink: getLink,
    compUpdate: compUpdate,
    handleEvent: handleEvent,
    lang: ''
  });
}

/***/ }),

/***/ "./src/scripts/core/timeliner.js":
/*!***************************************!*\
  !*** ./src/scripts/core/timeliner.js ***!
  \***************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "resetTimeline": function() { return /* binding */ resetTimeline; },
/* harmony export */   "initTimeline": function() { return /* binding */ initTimeline; },
/* harmony export */   "addProgressLinster": function() { return /* binding */ addProgressLinster; },
/* harmony export */   "disableTimelines": function() { return /* binding */ disableTimelines; },
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var animejs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! animejs */ "./node_modules/animejs/lib/anime.es.js");
/* harmony import */ var setjs_utility_calls_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/utility/calls.js */ "./src/scripts/setjs/utility/calls.js");
/* harmony import */ var helpers_app_helpers_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! helpers/app-helpers.js */ "./src/scripts/helpers/app-helpers.js");
/* harmony import */ var setjs_utility_array_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! setjs/utility/array.js */ "./src/scripts/setjs/utility/array.js");
/* harmony import */ var core_scroll_data_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! core/scroll-data.js */ "./src/scripts/core/scroll-data.js");
/* harmony import */ var Configurator__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! Configurator */ "./src/scripts/configurator/init.js");







var cssProps = ['top', 'left', 'opacity', 'fontSize', 'transform', 'width', 'height'];
var progressListeners = {};
var timeConfigs = [];

function seek() {
  var winHeight = $win.height();
  timeConfigs.forEach(function (config) {
    var bounds = config.$container[0].getBoundingClientRect();
    var progress = Math.min(1, Math.max(0, bounds.top / (winHeight + bounds.top - bounds.bottom)));
    config.timeline.seek(config.duration * progress);
    (progressListeners[config.id] && progressListeners[config.id]).forEach(function (listener) {
      listener && listener(100 * progress, config.targets);
    });
  });
}

function resetTimeline(id) {
  var index = timeConfigs.findIndex(function (x) {
    return x.id == id;
  });
  timeConfigs[index] = createTimeline(timeConfigs[index].$container, (0,core_scroll_data_js__WEBPACK_IMPORTED_MODULE_4__.getTimeData)(id));
}

function resetTimelines() {
  for (var i = 0; i < timeConfigs.length; i++) {
    timeConfigs[i] = createTimeline(timeConfigs[i].$container, (0,core_scroll_data_js__WEBPACK_IMPORTED_MODULE_4__.getTimeData)(timeConfigs[i].id));
  }
}

function initTimeline() {
  $win.on('resize', (0,setjs_utility_calls_js__WEBPACK_IMPORTED_MODULE_1__.debounce)(resetTimelines));
  $doc.on('scroll', seek);
}
function addProgressLinster(name, func) {
  progressListeners[name] = progressListeners[name] || [];
  progressListeners[name].push(func);
}
function disableTimelines() {
  timeConfigs.length = 0;
  (0,Configurator__WEBPACK_IMPORTED_MODULE_5__.timelineUpdate)(timeConfigs);
}
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__($container, timedata) {
  timeConfigs.push(createTimeline($container, timedata));
  (0,Configurator__WEBPACK_IMPORTED_MODULE_5__.timelineUpdate)(timeConfigs);
}

function createTimeline($container, timedata) {
  var winHeight = (0,helpers_app_helpers_js__WEBPACK_IMPORTED_MODULE_2__.getWinHeight)();
  var objTargets = {};
  var duration = timedata.pages * winHeight || $container.outerHeight();
  var timeline = animejs__WEBPACK_IMPORTED_MODULE_0__["default"].timeline({
    duration: duration,
    autoplay: false,
    easing: 'linear'
  });
  timedata.pages && $container.css('height', duration + winHeight);
  timedata.obj.forEach(function (target) {
    createTargets(target, 0, objTargets[target.el] = {});
  });
  timedata.dom.forEach(function (target) {
    var $el = $(target.el);
    cssProps.forEach(function (prop) {
      $el.css(prop, '');
    });
    createTargets(target, $el);
  });
  return {
    id: timedata.id,
    $container: $container,
    timeline: timeline,
    duration: duration,
    targets: objTargets
  };

  function createTargets(target, $el, animObj) {
    targetFields(target).filter(function (field) {
      return (field.browser || -1) & getBrowserFlag($container.width());
    }).forEach(function (field) {
      var item = {};
      var listItems = field.list.filter(function (x) {
        return x.key != 'sequence';
      });
      if (!listItems.length) return;
      listItems.forEach(function (config) {
        var unit = config.unit || 0;
        item[config.key] = Array.isArray(config.val) ? config.val.slice().map(function (x) {
          return x + unit;
        }) : isNaN(config.val) ? config.val : config.val + unit;

        if (animObj) {
          animObj[config.key] = Array.isArray(config.val) ? config.val[0] : config.val;
        }
      });
      item.targets = animObj || $el.toArray();
      item.duration = (field.time[1] - field.time[0]) / 100 * duration;
      timeline.add(item, field.time[0] / 100 * duration);

      if (animObj) {
        animObj.start = Math.min(field.time[0], animObj.start || 100);
        animObj.end = Math.max(field.time[1], animObj.end || 0);
      }
    });
  }
}

function targetFields(target) {
  var fields = [];
  target.fields.forEach(function (field) {
    fields.push(field);
    field.list.forEach(function (item) {
      if (item.key == 'sequence') {
        var seqFields = (0,setjs_utility_array_js__WEBPACK_IMPORTED_MODULE_3__.getVal)((0,core_scroll_data_js__WEBPACK_IMPORTED_MODULE_4__.getSequences)(), item.val, 'el').fields;
        var mul = (field.time[1] - field.time[0]) / 100;
        seqFields.forEach(function (sField) {
          fields.push({
            time: [field.time[0] + sField.time[0] * mul, field.time[0] + sField.time[1] * mul],
            list: sField.list
          });
        });
      }
    });
  });
  return fields;
}

function getBrowserFlag(containerWidth) {
  if (containerWidth <= 720) {
    return 1;
  } else if (containerWidth <= 1024) {
    return 2;
  }

  return 4;
}

/***/ }),

/***/ "./src/scripts/helpers/app-helpers.js":
/*!********************************************!*\
  !*** ./src/scripts/helpers/app-helpers.js ***!
  \********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "addPath": function() { return /* binding */ addPath; },
/* harmony export */   "plus": function() { return /* binding */ plus; },
/* harmony export */   "getWinWidth": function() { return /* binding */ getWinWidth; },
/* harmony export */   "getWinHeight": function() { return /* binding */ getWinHeight; }
/* harmony export */ });
function addPath(path2d, str, points) {
  var path = '';
  var index = 0;

  for (var i = 0; i < str.length; i++) {
    var char = str[i];

    if (char == 'M' || char == 'L' || char == 'Z') {
      path += (char == 'Z' ? 'L' : char) + points.slice(index, index + 2).join(',');
      index += 2;
    } else if (char == 'C') {
      path += char + points.slice(index, index + 6).join(',');
      index += 6;
    }
  }

  if (!path2d) {
    return new Path2D(path);
  }

  path2d.addPath(new Path2D(path));
  return path2d;
}
function plus(r, d, w) {
  return [{
    x: r - w,
    y: d
  }, {
    x: r + w,
    y: d
  }, {
    x: r + w,
    y: r - w
  }, {
    x: 2 * r - d,
    y: r - w
  }, {
    x: 2 * r - d,
    y: r + w
  }, {
    x: r + w,
    y: r + w
  }, {
    x: r + w,
    y: 2 * r - d
  }, {
    x: r - w,
    y: 2 * r - d
  }, {
    x: r - w,
    y: r + w
  }, {
    x: d,
    y: r + w
  }, {
    x: d,
    y: r - w
  }, {
    x: r - w,
    y: r - w
  }];
}
function getWinWidth() {
  return window.innerWidth && document.documentElement.clientWidth ? Math.min(window.innerWidth, document.documentElement.clientWidth) : window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}
function getWinHeight() {
  return window.innerHeight && document.documentElement.clientHeight ? Math.min(window.innerHeight, document.documentElement.clientHeight) : window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
}

/***/ }),

/***/ "./src/scripts/helpers/dom-helpers.js":
/*!********************************************!*\
  !*** ./src/scripts/helpers/dom-helpers.js ***!
  \********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; },
/* harmony export */   "fixSizes": function() { return /* binding */ fixSizes; }
/* harmony export */ });
/* harmony import */ var setjs_utility_calls_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/utility/calls.js */ "./src/scripts/setjs/utility/calls.js");
/* harmony import */ var setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/utility/numbers.js */ "./src/scripts/setjs/utility/numbers.js");


/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  fontSizes();
  fixSizes();
  $win.on('resize', (0,setjs_utility_calls_js__WEBPACK_IMPORTED_MODULE_0__.debounce)(fixSizes));
  $('.carousel-section').carousel();
  $('.white-tri').on('click', function () {
    $('html, body').animate({
      scrollTop: ($(this).data('factor') || 1) * $win.height()
    }, 2500);
  });
  $('.services-btn').on('click', function () {
    var $btn = $(this).toggleClass('active');
    var $target = $btn.closest('.page-section').find('.services-outer').toggleClass('active');
    $target.css('height', $target.hasClass('active') ? $target.find('.services').height() + 6 : '');
  });
  $win.on('scroll', function () {
    var height = $win.height();
    $('.white-tri').toggleClass('disable', $doc.scrollTop() > height);
    $('.scream-tri').css('opacity', 0);
    $('.page.show').find('.scream-tri').css('opacity', (height - Math.min(height, window.scrollY)) / height);
    $('[data-scroll]').each(function () {
      var $el = $(this);
      var opts = $el.data('scroll');
      var top = this.getBoundingClientRect().top + 120;
      var progress = Math.min(1, Math.max(0, (opts.factor || 1) * (height - top) / height));
      $el.css({
        opacity: opts.opacity ? opts.opacity[0] + progress * (opts.opacity[1] - opts.opacity[0]) : '',
        transform: opts.scale ? "scale(".concat(opts.scale[0] + progress * (opts.scale[1] - opts.scale[0]), ")") : ''
      });
    });
  });
}
function fixSizes() {
  var winWidth = $win.width();
  $('.video iframe').each(function (i, el) {
    el.style.maxHeight = Math.floor(winWidth * el.height / el.width) + 'px';
  });
  $('.tri-wrap.bottom').each(function () {
    var $wrapper = $(this);
    var width = $wrapper.width();
    $wrapper.css('margin-left', "".concat(width > winWidth ? (winWidth - width) / 2 : 0, "px"));
  });

  if ($('#institut-page').hasClass('show')) {
    var $parent = $('#institut-carousel');
    $parent.find('.nav-buttons').css('height', $parent.find('.carousel img').height());
  }
}

function fontSizes() {
  $('head').append("<style>".concat(createSize('lg', 5)).concat(mediaSize('md', 4, 1024)).concat(mediaSize('sm', 3, 768)).concat(mediaSize('xs', 2, 594)).concat(mediaSize('xxs', 2, 480), "</style>"));

  function createSize(prefix, max) {
    var styles = [];

    for (var i = 0.9; i <= max; i = (0,setjs_utility_numbers_js__WEBPACK_IMPORTED_MODULE_1__.roundNum)(i + 0.1, 1)) {
      styles.push(".".concat(prefix, "-").concat(('' + i).replace('.', '-'), "{font-size:").concat(i, "rem!important;}"));
    }

    return styles.join('\n') + '\n';
  }

  function mediaSize(prefix, max, res) {
    return "@media only screen and (max-width: ".concat(res, "px) {\n").concat(createSize(prefix, max), "\n}");
  }
}

/***/ }),

/***/ "./src/scripts/helpers/triangles.js":
/*!******************************************!*\
  !*** ./src/scripts/helpers/triangles.js ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
function getPath(inv, color) {
  if (inv) {
    return "<path d=\"M572.21 0L308.67 389.93c-6.15 9.38-13.33 13.55-22.56 13.55-9.23 0-16.41-4.17-22.56-13.55L0 0\" fill=\"#".concat(color, "\"/>");
  } else {
    return "<path d=\"M0 403.48L263.54 13.55C269.69 4.17 276.87 0 286.1 0c9.23 0 16.41 4.17 22.56 13.55l263.55 389.93\" fill=\"#".concat(color, "\"/>");
  }
}

function createSvg(inv, black, color) {
  color = color || (black ? '000000' : 'ffffff');
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 572 403\">".concat(getPath(inv, color), "</svg>");
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  $('[data-tri]').each(function () {
    var $el = $(this);
    $el.data('tri').forEach(function (data) {
      $el.append($(createSvg(data.inv, data.black, data.color)).attr('id', data.id));
    });
  });
  $('[data-triangles]').each(function () {
    var $el = $(this);
    var data = $el.data('triangles');
    $el.append('<div class="tri-wrap top">' + createSvg(1, data.black, data.color) + '</div>');
    $el.append('<div class="tri-wrap bottom">' + createSvg(0, data.black, data.color) + createSvg(0, data.black, data.color) + '</div>');
  });
}

/***/ }),

/***/ "./src/scripts/pages/home.js":
/*!***********************************!*\
  !*** ./src/scripts/pages/home.js ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var core_timeliner_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! core/timeliner.js */ "./src/scripts/core/timeliner.js");
/* harmony import */ var helpers_app_helpers_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! helpers/app-helpers.js */ "./src/scripts/helpers/app-helpers.js");
/* harmony import */ var core_scroll_data_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! core/scroll-data.js */ "./src/scripts/core/scroll-data.js");
/* harmony import */ var _home_emotion_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./home/emotion.js */ "./src/scripts/pages/home/emotion.js");
/* harmony import */ var _home_entrance_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./home/entrance.js */ "./src/scripts/pages/home/entrance.js");
/* harmony import */ var _home_home_canvas_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./home/home-canvas.js */ "./src/scripts/pages/home/home-canvas.js");
/* harmony import */ var _home_stimulate_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./home/stimulate.js */ "./src/scripts/pages/home/stimulate.js");
/* harmony import */ var _home_story_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./home/story.js */ "./src/scripts/pages/home/story.js");








/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var $home = $('#home-page');
  var emotion = (0,_home_emotion_js__WEBPACK_IMPORTED_MODULE_3__["default"])();
  var entrance = (0,_home_entrance_js__WEBPACK_IMPORTED_MODULE_4__["default"])();
  var homeCanvas = (0,_home_home_canvas_js__WEBPACK_IMPORTED_MODULE_5__["default"])();
  var stimulate = (0,_home_stimulate_js__WEBPACK_IMPORTED_MODULE_6__["default"])();
  var story = (0,_home_story_js__WEBPACK_IMPORTED_MODULE_7__["default"])();
  (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_0__.addProgressLinster)('home', function (progress, targets) {
    emotion.seek(progress, targets);
    homeCanvas.seek(progress, targets);
    stimulate.seek(progress, targets);
    story.seek(progress, targets);
    entrance.seek(progress);
  });

  function setup() {
    var opts = {
      winHeight: (0,helpers_app_helpers_js__WEBPACK_IMPORTED_MODULE_1__.getWinHeight)(),
      winWidth: (0,helpers_app_helpers_js__WEBPACK_IMPORTED_MODULE_1__.getWinWidth)()
    };
    homeCanvas.setup(opts);
    story.setup(opts);
    entrance.setup(opts);
  }

  return {
    $root: $home,
    times: {
      title: 2020,
      page: 800
    },
    activate: function activate() {
      setup();
      (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_0__["default"])($home, (0,core_scroll_data_js__WEBPACK_IMPORTED_MODULE_2__.getTimeData)('home'));
      $win.on('resize.home', setup);
    },
    deactivate: function deactivate() {
      $win.off('.home');
    }
  };
}

/***/ }),

/***/ "./src/scripts/pages/home/emotion.js":
/*!*******************************************!*\
  !*** ./src/scripts/pages/home/emotion.js ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var animejs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! animejs */ "./node_modules/animejs/lib/anime.es.js");

var lines = [[{
  txt: 'Passion ',
  h: 1,
  so: 0,
  sd: 11,
  eo: 20,
  ed: 11
}, {
  txt: 'fuels my work',
  so: 8,
  sd: 8,
  eo: 19,
  ed: 8
}], [{
  txt: 'As well as ',
  so: 32,
  sd: 8,
  eo: 50,
  ed: 8
}, {
  txt: 'Ignites',
  h: 1,
  so: 36,
  sd: 11,
  eo: 55,
  ed: 11
}, {
  txt: ' my creativity',
  so: 41,
  sd: 8,
  eo: 55,
  ed: 8
}], [{
  txt: 'in ',
  so: 67,
  sd: 8,
  eo: 85,
  ed: 8
}, {
  txt: 'everything',
  h: 1,
  so: 68,
  sd: 11,
  eo: 89,
  ed: 11
}, {
  txt: ' I undertake.',
  so: 73,
  sd: 8,
  eo: 85,
  ed: 8
}]]; // function getChars(line, prop) {
//   let chars = line[prop].split('');
//   return $(`<span class="${prop}">`).append(chars.map(char => `<span>${char.replace(' ', '&nbsp;')}</span>`));
// }

function createSentences($parent) {
  var sentences = [];
  lines.forEach(function (phrases) {
    var list = [];
    var $sentence = $('<div class="sentence">').appendTo($parent);
    phrases.forEach(function (phrase) {
      var $el = $("<span>".concat(phrase.txt, "</span>")).addClass(phrase.h ? 'highlight' : 'normal');
      $sentence.append($el);
      list.push($.extend({
        el: $el[0]
      }, phrase));
    });
    sentences.push(list);
  });
  return sentences;
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var emotionVid = $('#emotion-video')[0];
  var sentences = createSentences($('#emotion-section'));
  var timeline = animejs__WEBPACK_IMPORTED_MODULE_0__["default"].timeline({
    autoplay: false,
    easing: 'linear'
  });
  sentences.forEach(function (sentence) {
    sentence.forEach(addSequence);
  });

  function addSequence(_ref) {
    var el = _ref.el,
        so = _ref.so,
        sd = _ref.sd,
        eo = _ref.eo,
        ed = _ref.ed;
    timeline.add({
      targets: el,
      duration: sd,
      opacity: [0, 1]
    }, so);
    timeline.add({
      targets: el,
      duration: ed,
      opacity: [1, 0]
    }, eo);
  }

  return {
    seek: function seek(progress, _ref2) {
      var emotion = _ref2.emotion,
          top_black = _ref2.top_black;
      timeline.seek(emotion.m * timeline.duration);

      if (top_black.emotion_show) {
        if (emotionVid.paused) {
          emotionVid.muted = true;
          emotionVid.play();
        }
      } else if (!emotionVid.paused) {
        emotionVid.pause();
      }
    }
  };
}

/***/ }),

/***/ "./src/scripts/pages/home/entrance.js":
/*!********************************************!*\
  !*** ./src/scripts/pages/home/entrance.js ***!
  \********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var core_loader_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! core/loader.js */ "./src/scripts/core/loader.js");

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var $entrance = $('#entrance-section');
  var $entranceImg = $('#vmlogoforparticles');
  var $vmVideo = (0,core_loader_js__WEBPACK_IMPORTED_MODULE_0__.getVideo)('$vmVideo');
  var img = (0,core_loader_js__WEBPACK_IMPORTED_MODULE_0__.getImage)('logo');
  var progress = 0;
  var vid, nextParticle;

  if ($vmVideo) {
    $entrance.empty().append($vmVideo);
    vid = $vmVideo[0];
    $vmVideo.on('ended', function () {
      videoState(1);
    });
  }

  function videoState(resetTime) {
    if (vid) {
      if (resetTime || vid.currentTime >= 6.9) {
        vid.currentTime = 6.8;
      }

      if (progress < 6) {
        vid.muted = true;
        vid.paused && vid.play();
      } else {
        vid.pause();
      }
    }
  }

  return {
    setup: function setup(_ref) {
      var winWidth = _ref.winWidth;

      if (img) {
        var ratio = img.height / img.width;
        var width = Math.floor(Math.min(800, winWidth));

        if (nextParticle) {
          nextParticle.width = width;
          nextParticle.height = Math.floor(ratio * width);
          nextParticle.start();
        } else {
          nextParticle = new NextParticle($entranceImg.attr({
            'data-width': width,
            'data-height': ratio * width
          })[0]);
        }

        $entrance.css('opacity', 0);
        prompts(function () {
          $entrance.css('opacity', 1);
          $entrance.find('canvas').css({
            marginLeft: winWidth < width ? Math.floor(Math.min(0, winWidth - width) * 0.36) : ''
          });
        });
      } else {
        if (vid) {
          vid.currentTime = 0;
        }

        videoState();
      }
    },
    seek: function seek(_progress) {
      progress = _progress;
      videoState();
    }
  };

  function prompts(done) {
    var canvas = $entrance.find('canvas')[0];

    if (!canvas) {
      return setTimeout(prompts, 250, done);
    }

    var bounds = canvas.getBoundingClientRect();
    $entrance.find('.corner.t').css('top', Math.max(30, Math.floor(bounds.top) - 30));
    $entrance.find('.corner.b').css('top', Math.min($win.height() - 30, Math.floor(bounds.bottom)));
    $entrance.find('.corner.l').css('left', Math.max(20, Math.floor(bounds.left) - 60));
    $entrance.find('.corner.r').css('left', Math.min($win.width() - 30, Math.floor(bounds.right)));
    done();
  }
}

/***/ }),

/***/ "./src/scripts/pages/home/home-canvas.js":
/*!***********************************************!*\
  !*** ./src/scripts/pages/home/home-canvas.js ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var core_loader_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! core/loader.js */ "./src/scripts/core/loader.js");
/* harmony import */ var helpers_app_helpers_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! helpers/app-helpers.js */ "./src/scripts/helpers/app-helpers.js");


/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var img = (0,core_loader_js__WEBPACK_IMPORTED_MODULE_0__.getImage)('usain');
  var canvas = $('#home-canvas')[0];
  var ctx = canvas.getContext('2d');
  var points = [0, 0, 572.21, 0, 308.67, 389.93, 302.52, 399.31, 295.34, 403.48, 286.11, 403.48, 276.88, 403.48, 269.7, 399.31, 263.55, 389.93, 0, 0];
  var centerX = 286;
  var svgHeight = 403.5;
  var winWidth, winHeight;
  return {
    setup: function setup(opts) {
      canvas.width = winWidth = opts.winWidth;
      canvas.height = winHeight = opts.winHeight;
    },
    seek: function seek(progress, _ref) {
      var usain = _ref.usain,
          top_white = _ref.top_white,
          top_black = _ref.top_black;
      ctx.clearRect(0, 0, winWidth, winHeight);
      $('#home-page .white-tri').toggle(progress < top_white.start);
      $('#home-canvas, #tri-overlay').css('z-index', progress < top_white.start ? 10 : '');

      if (progress >= top_white.start && progress < top_black.end) {
        var triScale = top_white.scale * winHeight * 0.3 / svgHeight;
        var path = (0,helpers_app_helpers_js__WEBPACK_IMPORTED_MODULE_1__.addPath)(null, "MLLCCL", points.map(function (x) {
          return x * triScale;
        }));
        var triCenter = winWidth / 2 - centerX * triScale;
        ctx.save();
        ctx.translate(triCenter, top_white.top * winHeight);
        ctx.fillStyle = 'rgba(255,255,255, ' + top_white.opacity + ')';
        ctx.fill(path);

        if (progress >= usain.start) {
          var ratio = Math.min(winHeight / img.height, winWidth / img.height);
          ctx.save();
          ctx.clip(path);
          ctx.translate(-triCenter, -(top_white.top * winHeight));

          if (img.height * ratio < winHeight) {
            ratio = winHeight / img.height;
          }

          ratio *= usain.scale;
          ctx.translate(winWidth / 2 - img.width * .6 * ratio / 2, -img.height * ratio * usain.head * 0.22);
          ctx.globalCompositeOperation = 'source-atop';
          ctx.globalAlpha = usain.opacity;
          ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width * ratio, img.height * ratio);
          ctx.restore();

          if (progress >= top_black.start) {
            triScale = top_black.scale * winHeight * 0.3 / svgHeight;
            triCenter = winWidth / 2 - centerX * triScale;
            path = (0,helpers_app_helpers_js__WEBPACK_IMPORTED_MODULE_1__.addPath)(null, "MLLCCL", points.map(function (x) {
              return x * triScale;
            }));
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(triCenter + winWidth * top_black.left / 100, 0);
            ctx.fillStyle = 'rgba(0,0,0, ' + top_black.opacity + ')';
            ctx.clip(path);

            if (top_black.emotion_show) {
              ctx.clearRect(-(triCenter + winWidth * top_black.left / 100), 0, winWidth, winHeight);
            }

            ctx.fill(path);
            var blackWidth = $('#bottom-black').width();

            if (blackWidth > winWidth) {
              var done = (100 - top_black.left) / 100;
              $('#bottom-black').css('margin-left', "".concat(blackWidth > winWidth ? done * (winWidth - blackWidth) / 2 : 0, "px"));
            } else {
              $('#bottom-black').css('margin-left', '');
            }
          }
        }

        ctx.restore();
      }
    }
  };
}

/***/ }),

/***/ "./src/scripts/pages/home/stimulate.js":
/*!*********************************************!*\
  !*** ./src/scripts/pages/home/stimulate.js ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var stimulateVid = $('#stimulate-video')[0];
  return {
    seek: function seek(progress) {
      if (progress > 4 && progress < 34) {
        if (stimulateVid.paused) {
          stimulateVid.muted = true;
          stimulateVid.play();
        }
      } else {
        stimulateVid.pause();
      }
    }
  };
}

/***/ }),

/***/ "./src/scripts/pages/home/story.js":
/*!*****************************************!*\
  !*** ./src/scripts/pages/home/story.js ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var animejs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! animejs */ "./node_modules/animejs/lib/anime.es.js");

var text = 'I AM THE STORY BEHIND THE CODE';
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var $section = $('#story-section').append(text.split(' ').map(function (x) {
    return $("<p class=\"word\"><b>".concat(x, "</b></p>")).addClass(x == 'BEHIND' ? 'l' : '');
  }));
  var $words = $section.find('.word');
  var step = 1 / $words.length;
  var timeline = animejs__WEBPACK_IMPORTED_MODULE_0__["default"].timeline({
    autoplay: false,
    easing: 'linear'
  });
  var fontSize;
  return {
    setup: function setup(_ref) {
      var winWidth = _ref.winWidth,
          winHeight = _ref.winHeight;
      fitWordWidth($section.css('font-size', fontSize = 60).find('.l b'));
      var wordHeight = $words.eq(0).height();
      var wTop = -winHeight / 2 - wordHeight / 2 - 10;
      var frac = -wordHeight / wTop * 0.75;
      wTop = wTop + 'px';
      $words.each(function (index, word) {
        timeline.remove(word);
        $(word).css({
          transform: '',
          opacity: ''
        });
      });
      $words.each(function (index, word) {
        var firstOffset = index * step * frac;
        var secondOffset = step + index * step * frac;
        addStep({
          opacity: [0, 1],
          easing: 'easeInCubic'
        }, firstOffset, 0.9);
        addStep({
          translateY: [0, wTop]
        }, firstOffset);

        if (index < $words.length - 1) {
          addStep({
            opacity: [1, 0],
            easing: 'easeOutQuart'
          }, secondOffset);
          addStep({
            translateY: [wTop, -winHeight - wordHeight + 'px']
          }, secondOffset);
        } else {
          addStep({
            scale: [1, 14],
            easing: 'easeInQuad'
          }, step * 0.4 + secondOffset, 0.6);
          addStep({
            opacity: [1, 0],
            easing: 'easeInQuad'
          }, step * 0.2 + secondOffset, 0.8);
        }

        function addStep(props, offset) {
          var mul = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
          timeline.add($.extend({
            targets: word,
            duration: step * mul
          }, props), offset);
        }
      });

      function fitWordWidth($word) {
        while ($word.width() < winWidth * 0.96 && fontSize < 400) {
          $section.css('font-size', fontSize++);
        }
      }
    },
    seek: function seek(progress, _ref2) {
      var story = _ref2.story;
      timeline.seek(story.m * timeline.duration);
    }
  };
}

/***/ }),

/***/ "./src/scripts/pages/scream.js":
/*!*************************************!*\
  !*** ./src/scripts/pages/scream.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var animejs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! animejs */ "./node_modules/animejs/lib/anime.es.js");

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var $screamPage = $('#scream-page');
  var $theStory = $screamPage.find('.the-story');
  var $content = $screamPage.find('.content-section');
  $('.read-btn').on('click', function () {
    $screamPage.addClass('show-content');
    $('.btn-div').css('overflow', 'visible');
    setTimeout(reveal, 400);
  });
  $('.bottom-btn').on('click', function () {
    $screamPage.removeClass('show-content');
    conceal();
  }); // $win.on('menuChange', function(e, show) {
  //   show = !!show;
  //   $screamPage.toggleClass('show-content', show);
  //   !show && conceal();
  //   $('.btn-div').css('overflow', '');
  // });

  return {
    $root: $screamPage,
    times: {
      title: 200,
      page: 20
    },
    activate: function activate() {},
    deactivate: function deactivate() {}
  };

  function conceal() {
    (0,animejs__WEBPACK_IMPORTED_MODULE_0__["default"])({
      targets: [$content[0], $content.find('.container')[0]],
      opacity: [1, 0],
      easing: 'easeOutQuad',
      duration: 1200
    });
    (0,animejs__WEBPACK_IMPORTED_MODULE_0__["default"])({
      targets: '#scream-read',
      opacity: [0, 0.75],
      easing: 'linear',
      duration: 2000
    });
    (0,animejs__WEBPACK_IMPORTED_MODULE_0__["default"])({
      targets: '#scream-read svg',
      scale: [170, 1],
      easing: 'linear',
      duration: 2000
    });
  }

  function reveal() {
    showText($theStory[0], 0);
    showText($theStory[1], 1200);
    showText($theStory[2], 2500);
    opacityEaseInQuad($content[0], 4000);
    opacityEaseInQuad($content.find('.container')[0], 6000);
    (0,animejs__WEBPACK_IMPORTED_MODULE_0__["default"])({
      targets: '#scream-read',
      opacity: [0.75, 0],
      easing: 'linear',
      duration: 7000
    });
    (0,animejs__WEBPACK_IMPORTED_MODULE_0__["default"])({
      targets: '#scream-read svg',
      scale: [1, 170],
      easing: 'linear',
      duration: 7000
    });

    function opacityEaseInQuad(el, delay) {
      (0,animejs__WEBPACK_IMPORTED_MODULE_0__["default"])({
        targets: el,
        opacity: [0, 1],
        easing: 'easeInQuad',
        duration: 1200,
        delay: delay
      });
    }

    function showText(el) {
      var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      (0,animejs__WEBPACK_IMPORTED_MODULE_0__["default"])({
        targets: el,
        scale: [0.05, 9],
        opacity: [0, 1],
        easing: 'easeInCirc',
        duration: 2000,
        delay: delay
      });
      setTimeout(function () {
        (0,animejs__WEBPACK_IMPORTED_MODULE_0__["default"])({
          targets: el,
          opacity: [1, 0],
          scale: [9, 70],
          easing: 'easeOutSine',
          duration: 3200
        });
      }, 2000 + delay);
    }
  }
}

/***/ }),

/***/ "./src/scripts/pages/static.js":
/*!*************************************!*\
  !*** ./src/scripts/pages/static.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(id) {
  var times = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    title: 2020,
    page: 800
  };
  var $page = $('#' + id + '-page');
  var $slides = $page.find('.carousel-slides');
  var $carouselTop = $page.find('.carousel-top');
  var carousel = $page.find('.carousel-wrap')[0];

  function resize() {
    $('#intro-extra').appendTo($win.width() > 768 ? '#snake-intro' : '#carousel-inner');
  }

  function scroll() {
    var bounds = carousel.getBoundingClientRect();
    var winHeight = $win.height();
    var progress = Math.min(1, Math.max(0, bounds.top / (winHeight + bounds.top - bounds.bottom)));
    $slides.css('left', $win.width() - $slides.outerWidth() * progress);
    $carouselTop.css('transform', "translateY(".concat(Math.max(0, bounds.top), "px)"));
  }

  return {
    $root: $page,
    times: times,
    activate: function activate() {
      resize();
      $win.on('resize.static', resize);

      if ($slides.length) {
        scroll();
        $win.on('scroll.static', scroll);
      }
    },
    deactivate: function deactivate() {
      $win.off('.static');
    }
  };
}

/***/ }),

/***/ "./src/scripts/plugins/jquery/carousel.js":
/*!************************************************!*\
  !*** ./src/scripts/plugins/jquery/carousel.js ***!
  \************************************************/
/***/ (function() {

function carousel() {
  var $section = $(this);
  var $slides = $section.find('.slide');
  var $dots = createDots();
  var index = -1;
  select(0);
  $section.find('.nav-buttons .btn').on('click', function () {
    var dir = $(this).data('arg');
    var newIndex = index + dir < 0 ? $slides.length - 1 : index + dir > $slides.length - 1 ? 0 : index + dir;
    $slides.eq(index).css('left', -102 * dir + '%');
    $slides.eq(newIndex).addClass('stop').css('left', 102 * dir + '%');
    setTimeout(function () {
      $slides.eq(newIndex).removeClass('stop').css('left', 0);
    });
    index = newIndex;
    $dots.removeClass('active').eq(index).addClass('active');
  });
  $dots.on('click', function () {
    select($(this).index());
  });

  function createDots() {
    var $btns = $section.find('.buttons');

    for (var i = 0; i < $slides.length; i++) {
      $btns.append('<div class="dot"></div>');
    }

    return $btns.children();
  }

  function select(newIndex) {
    if (index != newIndex) {
      index = newIndex;

      for (var i = 0; i < $slides.length; i++) {
        $slides.eq(i).css('left', (i - index) * 102 + '%');
      }

      $dots.removeClass('active').eq(index).addClass('active');
    }
  }
}

$.fn.carousel = function () {
  return this.each(carousel);
};

/***/ }),

/***/ "./src/scripts/setjs/kernel/basics.js":
/*!********************************************!*\
  !*** ./src/scripts/setjs/kernel/basics.js ***!
  \********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "fatal": function() { return /* binding */ fatal; },
/* harmony export */   "getPropDef": function() { return /* binding */ getPropDef; },
/* harmony export */   "getDefData": function() { return /* binding */ getDefData; },
/* harmony export */   "setDefData": function() { return /* binding */ setDefData; },
/* harmony export */   "dataForName": function() { return /* binding */ dataForName; }
/* harmony export */ });
/* harmony import */ var setjs_utility_objects_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/utility/objects.js */ "./src/scripts/setjs/utility/objects.js");

var defData = {};
function fatal(msg, info) {
  for (var _len = arguments.length, extra = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    extra[_key - 2] = arguments[_key];
  }

  throw {
    msg: msg,
    info: info,
    extra: extra
  };
}
function getPropDef(propPath, data) {
  return (0,setjs_utility_objects_js__WEBPACK_IMPORTED_MODULE_0__.getProp)(propPath, data, defData);
}
function getDefData(name) {
  return defData['@' + name];
}
function setDefData(name, val) {
  defData['@' + name] = val;
}
function dataForName(name, data) {
  return name in data ? data : name in defData ? defData : null;
}

/***/ }),

/***/ "./src/scripts/setjs/kernel/event-manager.js":
/*!***************************************************!*\
  !*** ./src/scripts/setjs/kernel/event-manager.js ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "eventTypes": function() { return /* reexport safe */ config_event_types_js__WEBPACK_IMPORTED_MODULE_1__["default"]; },
/* harmony export */   "addEventListeners": function() { return /* binding */ addEventListeners; }
/* harmony export */ });
/* harmony import */ var setjs_utility_array_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/utility/array.js */ "./src/scripts/setjs/utility/array.js");
/* harmony import */ var config_event_types_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! config/event-types.js */ "./src/scripts/config/event-types.js");
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }



var events = {};
$.each(config_event_types_js__WEBPACK_IMPORTED_MODULE_1__["default"], function (i, v) {
  events[v] = [];
});
var eventManager = {
  route: function route(_route) {
    eventManager.raiseEvent(config_event_types_js__WEBPACK_IMPORTED_MODULE_1__["default"].init || config_event_types_js__WEBPACK_IMPORTED_MODULE_1__["default"].route, _route);
    delete events[config_event_types_js__WEBPACK_IMPORTED_MODULE_1__["default"].init];
    config_event_types_js__WEBPACK_IMPORTED_MODULE_1__["default"].init = 0;
  },
  addListener: function addListener(type, config, method, data) {
    var listener = {
      priority: config.priority || 3,
      config: config,
      method: method,
      data: data,
      hasData: arguments.length > 3
    };
    events[type].push(listener);
    (0,setjs_utility_array_js__WEBPACK_IMPORTED_MODULE_0__.sort)(events[type], 'priority');

    if (typeof method != 'function') {
      throw 'Not a function';
    }

    return listener;
  },
  removeListener: function removeListener(type, listener) {
    listener && (0,setjs_utility_array_js__WEBPACK_IMPORTED_MODULE_0__.removeFromListByValue)(events[type], listener.method || listener, 'method');
  },
  raiseEvent: function raiseEvent(type) {
    for (var _len = arguments.length, _args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      _args[_key - 1] = arguments[_key];
    }

    events[type].forEach(function (item) {
      var args = _args.slice();

      try {
        if (item.hasData) {
          args.unshift(item.data);
        }

        item.method.apply(item, _toConsumableArray(args));
      } catch (e) {
        throw {
          type: type,
          item: item,
          args: args,
          e: e
        };
      }
    });
  }
};
eventManager.addListener(config_event_types_js__WEBPACK_IMPORTED_MODULE_1__["default"].unload, {
  p: 'em',
  priority: 5
}, function () {
  $.each(events, function (name, list) {
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].config.pageOnly) {
        list.splice(i, 1);
      }
    }
  });
});

/* harmony default export */ __webpack_exports__["default"] = (eventManager);
function addEventListeners(types) {
  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }

  var listeners = [];
  types.forEach(function (type) {
    listeners.push(eventManager.addListener.apply(eventManager, [type].concat(args)));
  });
  return listeners;
}

/***/ }),

/***/ "./src/scripts/setjs/kernel/setjs.js":
/*!*******************************************!*\
  !*** ./src/scripts/setjs/kernel/setjs.js ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "makeRoute": function() { return /* binding */ makeRoute; },
/* harmony export */   "setRoute": function() { return /* binding */ setRoute; },
/* harmony export */   "setQs": function() { return /* binding */ setQs; },
/* harmony export */   "prevRoute": function() { return /* binding */ prevRoute; },
/* harmony export */   "getRoute": function() { return /* binding */ getRoute; },
/* harmony export */   "reloadPage": function() { return /* binding */ reloadPage; },
/* harmony export */   "initSetjs": function() { return /* binding */ initSetjs; },
/* harmony export */   "startApp": function() { return /* binding */ startApp; }
/* harmony export */ });
/* harmony import */ var Router__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! Router */ "./src/scripts/setjs/router/history-router.js");
/* harmony import */ var setjs_utility_browser_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/utility/browser.js */ "./src/scripts/setjs/utility/browser.js");


var setjs = {};
var currentRoute = {};
var oldRoute, skipRout;
function makeRoute(path) {
  var i, route;
  var parts = path.split('/');
  var lang = setjs.lang() && parts.splice(0, 1)[0];
  route = {
    lang: lang,
    path: parts.join('/'),
    pageId: parts[0] || '',
    slug: parts[1],
    id: parts[2],
    qs: (0,setjs_utility_browser_js__WEBPACK_IMPORTED_MODULE_1__.getQsMap)()
  };

  for (i = 3; i < parts.length; i++) {
    route['id' + (i - 1)] = parts[i];
  }

  return route;
}

function baseRouteHandler(path) {
  var newRoute = makeRoute(path);
  var fixedPath = setjs.fixPath(path);
  var lang = setjs.lang();

  if (path != fixedPath) {
    setRoute(newRoute.path);
  } else if (!lang || lang == newRoute.lang) {
    oldRoute = currentRoute;
    currentRoute = newRoute;

    if (!skipRout) {
      setjs.handleRoute(currentRoute);
    }

    skipRout = 0;
  } else {
    setRoute(path);
  }
}

function setRoute(newRoute, _skipRout) {
  skipRout = _skipRout;
  Router__WEBPACK_IMPORTED_MODULE_0__["default"].fire(setjs.getLink(newRoute));
}
function setQs(qsObj) {
  setRoute(currentRoute.path + (0,setjs_utility_browser_js__WEBPACK_IMPORTED_MODULE_1__.makeQs)(qsObj, 1), 1);
}
function prevRoute() {
  return oldRoute;
}
function getRoute() {
  return currentRoute;
}
function reloadPage() {
  setjs.handleRoute(currentRoute);
}
function initSetjs(setjsExt) {
  $.extend(setjs, setjsExt);
}
function startApp() {
  Router__WEBPACK_IMPORTED_MODULE_0__["default"].init(baseRouteHandler);
}
/* harmony default export */ __webpack_exports__["default"] = (setjs);

/***/ }),

/***/ "./src/scripts/setjs/plugins/misc/dropdown-menu.js":
/*!*********************************************************!*\
  !*** ./src/scripts/setjs/plugins/misc/dropdown-menu.js ***!
  \*********************************************************/
/***/ (function() {

$(document).on('click', function (e) {
  var $menuBtn = $('.menu-dropdown-btn');
  var $found = $menuBtn.find(e.target).add($menuBtn.filter(e.target));

  if ($(e.target).closest('.prevent-close').length) {
    return;
  }

  if ($found.length) {
    var $menu = $found.closest('.menu-dropdown');
    $menu.toggleClass('open');
    $('.menu-dropdown.open').not($menu).removeClass('open');
    $('body').toggleClass('dropdown', $menu.hasClass('open'));
    return !$menu.length;
  } else {
    $('.menu-dropdown.open').removeClass('open');
    $('body').removeClass('dropdown');
  }
});

/***/ }),

/***/ "./src/scripts/setjs/plugins/template-funcs/basic-filters.js":
/*!*******************************************************************!*\
  !*** ./src/scripts/setjs/plugins/template-funcs/basic-filters.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! core/acts-funcs.js */ "./src/scripts/core/acts-funcs.js");
/* harmony import */ var setjs_utility_strings_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/utility/strings.js */ "./src/scripts/setjs/utility/strings.js");



function _number(val) {
  return isNaN(val) ? 0 : +val;
}

(0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_0__.addFuncs)({
  slugify: setjs_utility_strings_js__WEBPACK_IMPORTED_MODULE_1__.slugify,
  capitalize: setjs_utility_strings_js__WEBPACK_IMPORTED_MODULE_1__.capitalize,
  lowercase: function lowercase(str) {
    return str.toLowerCase();
  },
  number: function number(val, opts, def) {
    return _number(val == undefined ? def : val);
  },
  prefix: function prefix(val, opts) {
    for (var _len = arguments.length, strList = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      strList[_key - 2] = arguments[_key];
    }

    return strList.join('') + val;
  },
  suffix: function suffix(val, opts) {
    for (var _len2 = arguments.length, strList = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      strList[_key2 - 2] = arguments[_key2];
    }

    return val + strList.join('');
  },
  wrap: function wrap(val, opts, left, right) {
    return left + val + right;
  },
  str: function str(val, opts) {
    var def = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    return val != undefined && val.toString && val.toString() || def;
  },
  fixed: function fixed(val, opts, places) {
    return _number(val).toFixed(places);
  },
  equal: function equal(val, opts, other) {
    return other == val;
  },
  testFlag: function testFlag(val, opts, flag) {
    flag = +flag;
    return (val & flag) == flag;
  },
  bool: function bool(val) {
    return !!val;
  },
  percent: function percent(val) {
    return _number(val) + '%';
  },
  round: function round(val) {
    return Math.round(_number(val));
  },
  floor: function floor(val) {
    return Math.floor(_number(val));
  },
  ceil: function ceil(val) {
    return Math.ceil(_number(val));
  },
  not: function not(val) {
    return !val;
  },
  negate: function negate(val) {
    return -_number(val);
  },
  json: function json(val) {
    return JSON.parse(val);
  },
  either: function either(condition, opts, val1, val2) {
    return condition ? val1 : val2;
  },
  commaList: function commaList(list) {
    return list.join(', ');
  },
  lowerCase: function lowerCase(val) {
    return val.toLowerCase();
  },
  includes: function includes(list, opts, item) {
    return list && list.indexOf(item) >= 0;
  },
  inList: function inList(val, opts) {
    for (var _len3 = arguments.length, list = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
      list[_key3 - 2] = arguments[_key3];
    }

    return list && list.indexOf(val) >= 0;
  }
});

/***/ }),

/***/ "./src/scripts/setjs/plugins/template-funcs/debug.js":
/*!***********************************************************!*\
  !*** ./src/scripts/setjs/plugins/template-funcs/debug.js ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! core/acts-funcs.js */ "./src/scripts/core/acts-funcs.js");

(0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_0__.addFuncs)({
  dump: function dump(val, opts) {
    opts.$el.html(JSON.stringify(val, null, 2));
  },
  log: function log(val) {
    console.log(val);
  }
});

/***/ }),

/***/ "./src/scripts/setjs/plugins/template-funcs/misc.js":
/*!**********************************************************!*\
  !*** ./src/scripts/setjs/plugins/template-funcs/misc.js ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! core/acts-funcs.js */ "./src/scripts/core/acts-funcs.js");

(0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_0__.addFuncs)({
  t: function t(val, opts) {
    opts.$el.text(val);
  },
  h: function h(val, opts) {
    opts.$el.html(val);
  },
  gt: function gt(val, opts, other, add) {
    return val > +other + (+add || 0);
  },
  lt: function lt(val, opts, other, add) {
    return val < +other + (+add || 0);
  },
  plurify: function plurify(number, _ref, singular, plural) {
    var $el = _ref.$el;
    plural = plural || singular + 's';
    number = number || 0;
    $el.text(number + ' ' + (number == 1 ? singular : plural));
  },
  test: function test(str, opts, pattern) {
    return RegExp(pattern).test(str);
  }
});

/***/ }),

/***/ "./src/scripts/setjs/router/history-router.js":
/*!****************************************************!*\
  !*** ./src/scripts/setjs/router/history-router.js ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var baseRouteHandler;

function processRoute() {
  baseRouteHandler(getPath());
}

function getPath() {
  return document.location.pathname.replace(/^(\/)/, '');
}

/* harmony default export */ __webpack_exports__["default"] = ({
  getPath: getPath,
  prefix: '/',
  fire: function fire(route) {
    window.history.pushState({}, document.title, route);
    processRoute();
  },
  init: function init(routeHandler) {
    baseRouteHandler = routeHandler;
    window.onpopstate = processRoute;
    processRoute();
  }
});

/***/ }),

/***/ "./src/scripts/setjs/template/binding.js":
/*!***********************************************!*\
  !*** ./src/scripts/setjs/template/binding.js ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "processIf": function() { return /* binding */ processIf; },
/* harmony export */   "applyBindings": function() { return /* binding */ applyBindings; },
/* harmony export */   "cleanupWatch": function() { return /* binding */ cleanupWatch; },
/* harmony export */   "updateWatches": function() { return /* binding */ updateWatches; },
/* harmony export */   "applyWatch": function() { return /* binding */ applyWatch; }
/* harmony export */ });
/* harmony import */ var setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/kernel/basics.js */ "./src/scripts/setjs/kernel/basics.js");
/* harmony import */ var setjs_kernel_event_manager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/kernel/event-manager.js */ "./src/scripts/setjs/kernel/event-manager.js");
/* harmony import */ var core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! core/acts-funcs.js */ "./src/scripts/core/acts-funcs.js");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }




var watchSet = new Set();
var watchMap = new WeakMap();
setjs_kernel_event_manager_js__WEBPACK_IMPORTED_MODULE_1__["default"].addListener(setjs_kernel_event_manager_js__WEBPACK_IMPORTED_MODULE_1__.eventTypes.loaded, 'binding', updateWatches);

function getStatements(bindingStr) {
  var statements = [];
  var opType = ';';
  var start = 0;
  var strip = 0;
  var i, char, escape;

  for (i = 0; i < bindingStr.length; i++) {
    char = bindingStr[i];

    if (char == '`' && bindingStr[i - 1] != '\\') {
      escape = !escape;

      if (escape && start < i) {
        parseError(char);
      }

      strip = 1;
    } else if (!escape && (char == ';' || char == ',' || char == '|' || char == ':')) {
      pushOp();
      opType = char;
    }
  }

  if (start < i + 1) {
    pushOp();
  }

  return statements;

  function pushOp() {
    if (escape) {
      parseError('`');
    }

    var item = {
      o: opType,
      v: bindingStr.slice(start + strip, i - strip),
      s: strip
    };

    if (opType != ',' && !item.v) {
      parseError('val needed');
    }

    statements.push(item);
    start = i + 1; // +1, as "i" has not yet incremented in the for loop

    strip = 0;
  }

  function parseError(msg) {
    (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.fatal)('bind:' + msg, start, bindingStr);
  }
}

function createBindings(bindingStr, rdata, isIf) {
  var bindings = [];
  var statements = getStatements(bindingStr);
  var binding, funcBinding;
  statements.forEach(function (statement) {
    if (statement.o == ';' || statement.o == ':' && isIf) {
      bindings.push(statement);
      binding = statement;
    } else if (statement.o == '|' && !binding.g) {
      binding.f = binding.f || [];
      pushFunc(binding.f, statement);
    } else if (statement.o == ',') {
      var statementVal = statement.v;
      funcBinding.p = funcBinding.p || [];
      statement.s = 1; // literal by default

      if (statementVal[0] == '~') {
        statement.v = statementVal.slice(1);

        if (statement.v[0] != '~') {
          statement.s = 0; // not a literal
        }
      }

      funcBinding.p.push(statement);
    } else {
      // either "|" or ":"
      var groups = binding.g = binding.g || [];
      statement.o == ':' && groups.push([]);
      pushFunc(groups[groups.length - 1], statement);
    }
  });
  return bindings;

  function pushFunc(list, statement) {
    var funcName = statement.v;
    funcBinding = {
      f: rdata[funcName] || (0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_2__.func)(funcName)
    };

    if (typeof funcBinding.f != 'function') {
      (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.fatal)(funcName + ' is not a function', bindingStr, rdata);
    }

    list.push(funcBinding);
  }
}

function getBindingVal(binding, opts) {
  var val = binding.v;

  if (!binding.s) {
    if (val == '_') {
      val = opts.data;
    } else if (val == '#') {
      val = '';
    } else {
      val = (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.getPropDef)(val, opts.data);

      if (typeof val == 'function') {
        val = val(opts);
      }
    }
  }

  return val;
}

function runFuncs(funcs, opts, val, applyText) {
  if (funcs) {
    funcs.forEach(function (funcBinding) {
      var args = [val, opts];
      funcBinding.p && funcBinding.p.forEach(function (param) {
        args.push(param.s ? param.v : getBindingVal(param, opts));
      });
      val = funcBinding.f.apply(opts, args);
    });
  } else if (applyText) {
    opts.$el.text(val);
  }

  return val;
}

function getGroupVal(binding, opts, applyText) {
  return runFuncs(binding.f, opts, getBindingVal(binding, opts), applyText);
}

function processIf($el, comp, data, dataIf) {
  var remove = 1;
  var bindings = createBindings(dataIf, (comp.rComp || comp).data, 1);
  var opts = {
    $el: $el,
    comp: comp,
    data: data
  };
  var groups = [];
  $.each(bindings, function (i, binding) {
    if (binding.o == ';') {
      groups.push([binding]);
    } else {
      groups[groups.length - 1].push(binding);
    }
  });
  $.each(groups, function (i, group) {
    $.each(group, function (i, binding) {
      remove = !getGroupVal(binding, opts);
      return remove;
    });
    return !remove;
  });

  if (remove) {
    var $next = $el.next('[data-elif]');
    $el.remove();

    if ($next.length) {
      processIf($next, comp, data, $next.data('elif'));
    }
  } else {
    $el.nextUntil(':not([data-elif])').remove();
    $el.next('[data-else]').remove();
  }

  return remove;
}

function runBinding(binding, opts) {
  var groupVal = getGroupVal(binding, opts, !binding.g);
  binding.g && binding.g.forEach(function (group) {
    runFuncs(group, opts, groupVal, 1);
  });
}

function applyBindings($el, comp, data) {
  var bindings = createBindings($el.data('bind'), (comp.rComp || comp).data);
  var opts = {
    $el: $el,
    comp: comp,
    data: data
  };
  bindings.forEach(function (binding) {
    runBinding(binding, opts);
  });
}

function ensureWatch(obj) {
  var watch = watchMap.get(obj);

  if (!watch) {
    watch = {
      obj: obj,
      props: new Set(),
      acts: new Set()
    };
    watchMap.set(obj, watch);
    watchSet.add(obj);
  }

  return watch;
}

function objChange(parentWatch, oldVal, newVal) {
  var watch = watchMap.get(oldVal);

  if (watch) {
    var newWatch = ensureWatch(newVal);
    var found = new Set();
    watch.props.forEach(function (key) {
      setupWatch(newWatch, newVal, key);
      objChange(watch, watch.obj[key], newWatch.obj[key]);
    });

    var _iterator = _createForOfIteratorHelper(parentWatch.acts),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var pAct = _step.value;

        var _iterator3 = _createForOfIteratorHelper(watch.acts),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var wAct = _step3.value;

            if (wAct == pAct) {
              found.add(wAct);
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    var _iterator2 = _createForOfIteratorHelper(found),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var act = _step2.value;
        newWatch.acts.add(act);
        watch.acts.delete(act);

        if (act.watch) {
          act.watch = newWatch;
          runBinding(act.binding, act.opts);
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }

    cleanupWatch(oldVal);
  }
}

function setupWatch(watch, obj, key) {
  if (!watch.props.has(key)) {
    watch.props.add(key);
    var val = obj[key];
    Object.defineProperty(obj, key, {
      get: function get() {
        return val;
      },
      set: function set(newVal) {
        if (val !== newVal) {
          var oldVal = val;
          val = newVal;
          objChange(watch, oldVal, newVal);
          watch.acts.forEach(function (act) {
            if (act.watch == watch) {
              runBinding(act.binding, act.opts);
            }
          });
        }
      }
    });
  }
}

function processWatch(parts, data, act) {
  var key = parts.shift();
  var obj = (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.dataForName)(key, data);

  if (obj) {
    var watch = ensureWatch(obj);
    var val = obj[key];
    watch.acts.add(act);
    setupWatch(watch, obj, key);

    if (parts.length) {
      processWatch(parts, val, act);
    } else {
      act.watch = watch;
      runBinding(act.binding, act.opts);
    }
  }
}

function cleanupWatch(obj) {
  var watch = watchMap.get(obj);

  if (watch) {
    var remove = [];
    watch.props.forEach(function (key) {
      cleanupWatch(obj[key]);
    });
    watch.acts.forEach(function (act) {
      if (!act.opts.$el.data('watched')) {
        remove.push(act);
      }
    });
    remove.forEach(function (act) {
      watch.acts.delete(act);
    });

    if (!watch.acts.size) {
      watchMap.delete(obj);
      watchSet.delete(obj);
    }
  }
}
function updateWatches() {
  watchSet.forEach(function (obj) {
    cleanupWatch(obj);
  });
}
function applyWatch($el, comp, data) {
  var opts = {
    $el: $el.data('watched', 1),
    comp: comp,
    data: data
  };
  var bindings = createBindings($el.data('watch'), (comp.rComp || comp).data);
  bindings.forEach(function (binding) {
    processWatch(binding.v.split('.'), data, {
      binding: binding,
      opts: opts
    });
  });
}

/***/ }),

/***/ "./src/scripts/setjs/template/component.js":
/*!*************************************************!*\
  !*** ./src/scripts/setjs/template/component.js ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* export default binding */ __WEBPACK_DEFAULT_EXPORT__; }
/* harmony export */ });
/* harmony import */ var setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/kernel/basics.js */ "./src/scripts/setjs/kernel/basics.js");
/* harmony import */ var setjs_kernel_setjs_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/kernel/setjs.js */ "./src/scripts/setjs/kernel/setjs.js");
/* harmony import */ var setjs_template_binding_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! setjs/template/binding.js */ "./src/scripts/setjs/template/binding.js");
/* harmony import */ var setjs_template_events_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! setjs/template/events.js */ "./src/scripts/setjs/template/events.js");
/* harmony import */ var setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! setjs/utility/comp-helpers.js */ "./src/scripts/setjs/utility/comp-helpers.js");
/* harmony import */ var setjs_template_template_config_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! setjs/template/template-config.js */ "./src/scripts/setjs/template/template-config.js");
/* harmony import */ var setjs_template_templates_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! setjs/template/templates.js */ "./src/scripts/setjs/template/templates.js");
/* harmony import */ var core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! core/acts-funcs.js */ "./src/scripts/core/acts-funcs.js");
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }










function processSlot($item, comp, data, slotConfig, forceReplace) {
  var slotComp = createComponent((0,setjs_template_template_config_js__WEBPACK_IMPORTED_MODULE_5__.getConfigTemplate)('slot', slotConfig, $item.data('tname')), (0,setjs_template_template_config_js__WEBPACK_IMPORTED_MODULE_5__.configData)(slotConfig, data), comp.actions, comp);
  $item.empty();

  if (slotComp) {
    slotComp.$root.data('slotConfig', slotConfig);
    (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__.storeItemByName)(comp, slotConfig.name || $item.data('name'), slotComp);

    if (slotConfig.replace || forceReplace) {
      $item.replaceWith(slotComp.$root);
    } else {
      $item.append(slotComp.$root);
    }
  } else if (slotConfig.replace) {
    $item.remove();
  }
}

function _renderList(comp, data, listData) {
  var config = listData.c;
  var oldList = listData.list;
  var index = 0;
  var list = listData.list = [];
  var rd = comp.rComp && comp.rComp.data || data;
  listData.$el.empty();
  $.each((0,setjs_template_template_config_js__WEBPACK_IMPORTED_MODULE_5__.configData)(config, data), appendItem);

  if (!list.length && (config.alt || config.sub)) {
    listData.$el.append(createComponent((0,setjs_template_templates_js__WEBPACK_IMPORTED_MODULE_6__.getTemplate)(config.alt, config.sub), $.extend({
      rd: rd,
      pd: data
    }, listData), comp.actions, comp).$root);
  }

  listData.$elements = listData.$el.children();
  oldList && oldList.forEach(function (comp) {
    (0,setjs_template_binding_js__WEBPACK_IMPORTED_MODULE_2__.cleanupWatch)(comp.data);
  });

  if (listData.name) {
    listData.append = function (items) {
      $.each(items, function (key, val) {
        appendItem(key, val, 1);
      });
      listData.$elements = listData.$el.children();
    };
  }

  function appendItem(key, val, compUpdate) {
    var _itemData;

    var itemData = (_itemData = {}, _defineProperty(_itemData, listData.d, index), _defineProperty(_itemData, listData.i, ++index), _defineProperty(_itemData, listData.k, key), _defineProperty(_itemData, listData.v, val), _defineProperty(_itemData, "c", config), _defineProperty(_itemData, "pd", data), _defineProperty(_itemData, "rd", rd), _itemData);
    var itemComp = createComponent(config.tf && (rd[config.tf] || (0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_7__.func)(config.tf))(itemData, comp, listData) || listData.t, itemData, comp.actions, comp);

    if (itemComp) {
      listData.$el.append(itemComp.$root);
      list.push(itemComp);
      compUpdate && setjs_kernel_setjs_js__WEBPACK_IMPORTED_MODULE_1__["default"].compUpdate(itemComp.$root);
    }
  }
}

function createList($el, comp, data) {
  var config = $el.data('list');
  var template = (0,setjs_template_template_config_js__WEBPACK_IMPORTED_MODULE_5__.getConfigTemplate)('list', config, $el.data('tname'));
  var listData = $.extend({
    name: config.name || $el.data('name'),
    $el: $el,
    c: config,
    t: template,
    i: 'index',
    k: 'key',
    v: 'val',
    d: 'dex'
  }, config.vars);
  (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__.storeItemByName)(comp, listData.name, listData);

  _renderList(comp, data, listData);
}
/**
 * Builds a template
 * @param {Object} templateStr - The template html string
 * @param {Object} pComp - The parent component (if any)
 * @param {Object} data - component data
 * @param {Object} actions - event handlers
 * @return {Object} returns the compiled template
 */


function createComponent(templateStr, data, actions, pComp) {
  var $root, tmpRoot, $watchElements, $bindingElements, $actElements, $listElements, comp;
  data = data || {};
  actions = actions || {};
  $root = $((0,setjs_template_template_config_js__WEBPACK_IMPORTED_MODULE_5__.tmpStr)(templateStr, data));
  comp = {
    data: data,
    actions: actions,
    rComp: pComp && pComp.rComp || pComp,
    pComp: pComp,
    update: function update($selection) {
      if (!($selection && $selection.jquery)) {
        $selection = $bindingElements;
      }

      $selection.each(function (i, el) {
        (0,setjs_template_binding_js__WEBPACK_IMPORTED_MODULE_2__.applyBindings)($(el), comp, data);
      });
      setjs_kernel_setjs_js__WEBPACK_IMPORTED_MODULE_1__["default"].compUpdate($selection);
    },
    renderSlot: function renderSlot(name) {
      var slotComp = comp[name];

      if (slotComp) {
        delete comp[name];
        processSlot(slotComp.$root, comp, data, slotComp.$root.data('slotConfig'), 1);
        setjs_kernel_setjs_js__WEBPACK_IMPORTED_MODULE_1__["default"].compUpdate(comp[name].$root);
        (0,setjs_template_binding_js__WEBPACK_IMPORTED_MODULE_2__.cleanupWatch)(slotComp.data);
      }
    },
    renderList: function renderList() {
      $.each(arguments, function (i, name) {
        if (comp[name]) {
          _renderList(comp, data, comp[name]);

          setjs_kernel_setjs_js__WEBPACK_IMPORTED_MODULE_1__["default"].compUpdate(comp[name].$el);
        }
      });
    }
  };

  if ($root.length > 1) {
    tmpRoot = 1;
    $root = $('<div>').append($root);
  } else if ($root.data('if') && (0,setjs_template_binding_js__WEBPACK_IMPORTED_MODULE_2__.processIf)($root, comp, data, $root.data('if'))) {
    return;
  }

  (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__.dataAttrFunc)($root, 'if', function ($item, dataIf) {
    (0,setjs_template_binding_js__WEBPACK_IMPORTED_MODULE_2__.processIf)($item, comp, data, dataIf);
  }, 1);

  if (tmpRoot) {
    $root = $root.children();
  }

  if (!$root.length) {
    return;
  }

  (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__.dataAttrFunc)($root, 'src', function ($item, src) {
    $item.attr('src', src);
  });
  (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__.dataAttrFunc)($root, 'val', function ($item, val) {
    $item.attr('value', val);
  });
  comp.$root = $root.data('comp', comp);
  $watchElements = (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__.dataAttrFind)($root, 'watch');
  $bindingElements = (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__.dataAttrFind)($root, 'bind');
  $actElements = (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__.dataAttrFind)($root, 'act');
  $listElements = (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__.dataAttrFind)($root, 'list');
  (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__.dataAttrFunc)($root, 'name', function ($item, name) {
    name = '$' + name;

    if (comp[name]) {
      (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.fatal)('Repeat name', name);
    }

    comp[name] = $item;
  }); // You cannot call dataAttrFunc() after this, as this might add items which can affect the selection

  (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_4__.dataAttrFunc)($root, 'slot', function ($item, slotConfig) {
    processSlot($item, comp, data, slotConfig);
  });
  $listElements.each(function (i, item) {
    createList($(item), comp, data);
  });
  $bindingElements.each(function (i, item) {
    (0,setjs_template_binding_js__WEBPACK_IMPORTED_MODULE_2__.applyBindings)($(item), comp, data);
  });
  $watchElements.each(function (i, item) {
    (0,setjs_template_binding_js__WEBPACK_IMPORTED_MODULE_2__.applyWatch)($(item), comp, data);
  });
  $actElements.each(function (i, item) {
    (0,setjs_template_events_js__WEBPACK_IMPORTED_MODULE_3__.bindEvents)($(item), comp, data, actions);
  });
  !pComp && setjs_kernel_setjs_js__WEBPACK_IMPORTED_MODULE_1__["default"].compUpdate($root);
  return comp;
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(templateName, data, actions, pComp) {
  return createComponent((0,setjs_template_templates_js__WEBPACK_IMPORTED_MODULE_6__.getTemplate)(templateName), data, actions, pComp);
}

/***/ }),

/***/ "./src/scripts/setjs/template/events.js":
/*!**********************************************!*\
  !*** ./src/scripts/setjs/template/events.js ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bindEvents": function() { return /* binding */ bindEvents; }
/* harmony export */ });
/* harmony import */ var setjs_kernel_setjs_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/kernel/setjs.js */ "./src/scripts/setjs/kernel/setjs.js");
/* harmony import */ var core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! core/acts-funcs.js */ "./src/scripts/core/acts-funcs.js");


var events = {
  down: 'mousedown touchstart',
  up: 'mouseup touchend',
  out: 'mouseleave touchleave touchcancel',
  move: 'mousemove touchmove',
  form: 'submit'
};
function bindEvents($el, comp, data, actions) {
  var name = $el.data('name');
  var acts = ($el.data('act') || '').split(' ');
  acts.forEach(function (action) {
    $el.on(events[action] || action, function (e) {
      var funcName = $el.data('func') || action;
      var args = {
        $el: $el,
        name: name,
        action: action,
        comp: comp,
        e: e,
        data: data,
        arg: $el.data('arg')
      };
      setjs_kernel_setjs_js__WEBPACK_IMPORTED_MODULE_0__["default"].handleEvent(args, actions[funcName] || (0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_1__.act)(funcName));
    });
  });
}

/***/ }),

/***/ "./src/scripts/setjs/template/template-config.js":
/*!*******************************************************!*\
  !*** ./src/scripts/setjs/template/template-config.js ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getConfigTemplate": function() { return /* binding */ getConfigTemplate; },
/* harmony export */   "configData": function() { return /* binding */ configData; },
/* harmony export */   "tmpStr": function() { return /* binding */ tmpStr; }
/* harmony export */ });
/* harmony import */ var setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/kernel/basics.js */ "./src/scripts/setjs/kernel/basics.js");
/* harmony import */ var core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! core/acts-funcs.js */ "./src/scripts/core/acts-funcs.js");
/* harmony import */ var setjs_template_templates_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! setjs/template/templates.js */ "./src/scripts/setjs/template/templates.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }




function getConfigTemplate(callerName, config, tId) {
  var templateStr = (0,setjs_template_templates_js__WEBPACK_IMPORTED_MODULE_2__.getTemplate)(tId || config.t);

  if (_typeof(config) != 'object') {
    (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.fatal)('Bad JSON in data-' + callerName, config);
  }

  if (!templateStr) {
    (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.fatal)('Invalid data-' + callerName, config);
  }

  $.each(config.vars, function (name, val) {
    templateStr = templateStr.replace(RegExp('{(o:)?' + name + '}', 'g'), val);
  });
  $.each(config.subs, function (name, val) {
    templateStr = templateStr.replace(RegExp(name, 'g'), val);
  });
  return templateStr;
}
function configData(config, data) {
  var funcName = config.func;
  var source = config.prop ? (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.getPropDef)(config.prop, data) : data;

  if (funcName) {
    var dataFunc = (data.rd || data)[funcName] || (0,core_acts_funcs_js__WEBPACK_IMPORTED_MODULE_1__.func)(funcName);
    typeof dataFunc != 'function' && (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.fatal)('Not a function', funcName, config, data);
    source = dataFunc(source, config, data);
  }

  return source;
}
function tmpStr(templateStr, data) {
  return templateStr.replace(/{(?:(o):)?([^{}]+)}/g, function (match, group1, group2) {
    var result = (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.getPropDef)(group2, data);

    if (typeof result == 'function') {
      result = result(data);
    }

    return typeof result == 'string' || typeof result == 'number' ? result : group1 ? '' : match;
  });
}

/***/ }),

/***/ "./src/scripts/setjs/template/templates.js":
/*!*************************************************!*\
  !*** ./src/scripts/setjs/template/templates.js ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ensureTemplates": function() { return /* binding */ ensureTemplates; },
/* harmony export */   "loadTemplates": function() { return /* binding */ loadTemplates; },
/* harmony export */   "getTemplate": function() { return /* binding */ getTemplate; }
/* harmony export */ });
/* harmony import */ var setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/kernel/basics.js */ "./src/scripts/setjs/kernel/basics.js");
/* harmony import */ var setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! setjs/utility/comp-helpers.js */ "./src/scripts/setjs/utility/comp-helpers.js");


var templates = {};
var doneUrls = {};
var tId = 1;
function ensureTemplates(_ref) {
  var _ref$urls = _ref.urls,
      urls = _ref$urls === void 0 ? [] : _ref$urls,
      success = _ref.success,
      error = _ref.error;
  var done = 0;
  urls = urls.filter(function (url) {
    return !doneUrls[url];
  });

  if (!urls.length) {
    success();
  }

  urls.forEach(function (url) {
    $.get(url).done(function (templateStr) {
      !doneUrls[url] && loadTemplates(templateStr);
      doneUrls[url] = true;

      if (++done == urls.length) {
        success();
      }
    }).fail(error);
  });
}

function extractHtml($el) {
  var elHtml = $el.html();
  var config = $el.data('list') || $el.data('slot');
  var tName = config.t;

  if (!tName && !config.tf) {
    tName = 't_' + tId++;
    templates[tName] = elHtml;
  }

  $el.attr('data-tname', tName).empty();
}

function inlineTemplates($parent) {
  var selector = '[data-list], [data-slot]';
  var $children = $parent.find(selector);
  var tree = [];

  if ($children.length) {
    $children.each(function (index, el) {
      var $el = $(el);
      var depth = $el.parents(selector).length;
      tree[depth] = tree[depth] || [];
      tree[depth].push($el);
    });
    tree.reverse().forEach(function (branch) {
      branch.forEach(extractHtml);
    });
  }

  $parent = $parent.filter(selector);
  $parent.length && extractHtml($parent);
}

function loadTemplates(templateStr) {
  var $html = $(templateStr);
  (0,setjs_utility_comp_helpers_js__WEBPACK_IMPORTED_MODULE_1__.dataAttrFunc)($html, 'template', function ($item, name) {
    if (templates[name]) {
      (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.fatal)('Template exists', name);
    }

    inlineTemplates($item);
    templates[name] = $item[0].outerHTML;
  });
}
function getTemplate(templateName, alt) {
  if (templates[templateName] || alt) {
    return templates[templateName] || alt;
  } else {
    (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.fatal)('No such template', templateName);
  }
}

/***/ }),

/***/ "./src/scripts/setjs/utility/array.js":
/*!********************************************!*\
  !*** ./src/scripts/setjs/utility/array.js ***!
  \********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sort": function() { return /* binding */ sort; },
/* harmony export */   "removeFromList": function() { return /* binding */ removeFromList; },
/* harmony export */   "removeFromListByValue": function() { return /* binding */ removeFromListByValue; },
/* harmony export */   "indexOf": function() { return /* binding */ indexOf; },
/* harmony export */   "shuffle": function() { return /* binding */ shuffle; },
/* harmony export */   "getUniqueList": function() { return /* binding */ getUniqueList; },
/* harmony export */   "obtain": function() { return /* binding */ obtain; },
/* harmony export */   "getVal": function() { return /* binding */ getVal; },
/* harmony export */   "randItem": function() { return /* binding */ randItem; },
/* harmony export */   "randItems": function() { return /* binding */ randItems; },
/* harmony export */   "spinIndex": function() { return /* binding */ spinIndex; },
/* harmony export */   "listOverlap": function() { return /* binding */ listOverlap; }
/* harmony export */ });
function sort(items, prop, direction) {
  if (!items) {
    return;
  }

  direction = direction || 1;
  items.sort(function (a, b) {
    if (a[prop] > b[prop]) {
      return direction;
    }

    if (a[prop] < b[prop]) {
      return direction * -1;
    }

    return 0;
  });
  return items;
}
function removeFromList(list, value) {
  for (var i = 0; i < list.length; i++) {
    if (list[i] == value) {
      list.splice(i, 1);
      return i;
    }
  }
}
function removeFromListByValue(list, value, prop1, prop2) {
  for (var i = list.length - 1; i >= 0; i--) {
    if (list[i][prop1] == value || arguments.length > 3 && list[i][prop2] == value) {
      list.splice(i, 1);
      return i;
    }
  }
}
function indexOf(list, value, prop) {
  for (var i = 0; i < list.length; i++) {
    if ((prop ? list[i][prop] : list[i]) === value) {
      return i;
    }
  }

  return -1;
} //Knuth-Fisher-Yates

function shuffle(array) {
  var counter = array.length,
      temp,
      index;

  while (counter > 0) {
    index = Math.floor(Math.random() * counter);
    counter--;
    temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}
function getUniqueList(list, prop) {
  var unique = [];
  var done = {};
  list.forEach(function (obj) {
    var thing = obj[prop];

    if (!done[thing]) {
      done[thing] = 1;
      unique.push(thing);
    }
  });
  return unique;
}
function obtain(list, value, prop1, prop2, prop3) {
  for (var i = 0; i < list.length; i++) {
    if (list[i][prop1] == value || arguments.length > 3 && list[i][prop2] == value || arguments.length > 4 && list[i][prop3] == value) {
      return {
        index: i,
        val: list[i]
      };
    }
  }
}
function getVal(list, value) {
  for (var _len = arguments.length, props = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    props[_key - 2] = arguments[_key];
  }

  var result = obtain.apply(void 0, [list, value].concat(props));
  return result && result.val;
}
function randItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}
function randItems(list, count) {
  return shuffle(list.slice()).slice(0, count);
}
function spinIndex(limit, change) {
  var current = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var index = current + change;
  limit = limit.length || limit;

  if (index < 0) {
    index += limit;
  }

  return index % limit;
}
function listOverlap(list1, list2, prop) {
  var overlap = [];
  list1.forEach(function (one) {
    if (prop) {
      var found = obtain(list2, one[prop], prop);

      if (found) {
        overlap.push(one);
      }
    } else {
      if (list2.indexOf(one) >= 0) {
        overlap.push(one);
      }
    }
  });
  return overlap;
}

/***/ }),

/***/ "./src/scripts/setjs/utility/assets.js":
/*!*********************************************!*\
  !*** ./src/scripts/setjs/utility/assets.js ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getFileMimeType": function() { return /* binding */ getFileMimeType; },
/* harmony export */   "fileAsDataURL": function() { return /* binding */ fileAsDataURL; },
/* harmony export */   "unloadHead": function() { return /* binding */ unloadHead; },
/* harmony export */   "loadJS": function() { return /* binding */ loadJS; },
/* harmony export */   "loadCSS": function() { return /* binding */ loadCSS; },
/* harmony export */   "loadUrls": function() { return /* binding */ loadUrls; },
/* harmony export */   "loadJSCSS": function() { return /* binding */ loadJSCSS; },
/* harmony export */   "loadAssets": function() { return /* binding */ loadAssets; },
/* harmony export */   "loadImage": function() { return /* binding */ loadImage; },
/* harmony export */   "loadImages": function() { return /* binding */ loadImages; },
/* harmony export */   "imageAJAX": function() { return /* binding */ imageAJAX; }
/* harmony export */ });
var loaded = {};
function getFileMimeType(file, callback) {
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var filereader = new FileReader();

    filereader.onload = function (evt) {
      var hex = Array.prototype.slice.call(new Uint8Array(evt.target.result)).map(function (x) {
        return x.toString(16);
      }).join('').toUpperCase();
      var reg = /^(FFD8FF(?:DB|E[01238]))|^(89504E47)|^(47494638)/;
      var result = hex.replace(reg, function (m, jpg, png, gif) {
        return jpg ? 'jpeg' : png ? 'png' : gif ? 'gif' : '';
      });
      var type = reg.test(hex) && "image/".concat(result) || file.type || '';
      var ext = type.split('/')[1];
      callback(type, ext == 'jpeg' ? 'jpg' : ext);
    };

    filereader.onerror = function () {
      callback(file.type, file.type && file.type.split('/')[1]);
    };

    filereader.readAsArrayBuffer(file.slice(0, 4));
  }
}
function fileAsDataURL(file, onload) {
  var reader = new FileReader();
  reader.addEventListener('load', function () {
    onload(reader.result);
  }, false);
  reader.readAsDataURL(file);
}

function processUrlLoad(url, el, success, error) {
  if (loaded[url]) {
    processLoaded();
  } else {
    el.id = ('id_' + Date.now() + Math.random()).replace('.', '');

    el.onload = function () {
      loaded[url] = {
        status: 2,
        id: el.id
      };
      processLoaded();
    };

    el.onerror = function () {
      loaded[url] = {
        status: 0
      };
      $('head').find('#' + el.id).remove();
      processLoaded();
    };

    loaded[url] = {
      status: 1
    };
    document.getElementsByTagName('head')[0].appendChild(el);
  }

  function processLoaded() {
    var status = loaded[url].status;

    if (status == 1) {
      // pending
      setTimeout(processLoaded, 500);
    } else if (status == 2) {
      success && success();
    } else {
      error && error();
    }
  }
}

function unloadHead(url) {
  if (loaded[url]) {
    $('head #' + loaded[url].id).remove();
    loaded[url] = 0;
  }
}
function loadJS(url, success, error) {
  var el = document.createElement('script');
  el.src = url;
  processUrlLoad(url, el, success, error);
}
function loadCSS(url, success, error) {
  var el = document.createElement('link');
  el.rel = 'stylesheet';
  el.href = url;
  processUrlLoad(url, el, success, error);
}
function loadUrls(urls, kind, success, errorCb) {
  var done = 0;

  if (testArray(urls, success)) {
    urls.forEach(function (url) {
      (kind == 'css' ? loadCSS : loadJS)(url, function () {
        done++;

        if (done == urls.length) {
          success();
        }
      }, errorCb);
    });
  }
}

function testArray(obj, otherwise) {
  if (Array.isArray(obj) && obj.length) {
    return true;
  } else {
    otherwise();
  }
}

function loadJSCSS(urls, success, errorCb) {
  var done = 0;

  if (testArray(urls, success)) {
    urls.forEach(function (url) {
      (/\.css(?:\?.*)*$/.test(url) ? loadCSS : loadJS)(url, function () {
        done++;

        if (done == urls.length) {
          success();
        }
      }, errorCb);
    });
  }
}
function loadAssets(_ref) {
  var urlSets = _ref.urlSets,
      success = _ref.success,
      error = _ref.error,
      errMsg = _ref.errMsg;
  var done = 0;

  if (testArray(urlSets, success)) {
    loadNext();
  }

  function loadNext() {
    var next = urlSets[done];
    loadJSCSS(next, function () {
      done++;

      if (done == urlSets.length) {
        success();
      } else {
        loadNext();
      }
    }, function () {
      error(errMsg);
    });
  }
}
function loadImage(_ref2) {
  var url = _ref2.url,
      success = _ref2.success,
      error = _ref2.error,
      complete = _ref2.complete;
  var img = new Image();

  img.onload = function () {
    success && success(img);
    complete && complete(1, img);
  };

  img.onerror = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    error && error(args);
    complete && complete(0, args);
  };

  img.src = url;
  return {
    cancel: function cancel() {
      success = null;
      error = null;
      complete = null;
    }
  };
} // list is either an array of URL strings or a jQuery collection

function loadImages(list, done, progress) {
  var count = 0;
  var urls = list;
  var result = {};

  if (!(list && list.length)) {
    return done();
  }

  if (list.jquery) {
    urls = [];
    list.each(function () {
      urls.push($(this).attr('src'));
    });
  }

  urls.forEach(function (item) {
    var url = item.url || item;
    loadImage({
      url: url,
      complete: function complete(code, data) {
        count++;
        result[item.id || url] = code ? {
          item: item,
          img: data
        } : {
          item: item,
          errors: data
        };

        if (count == urls.length) {
          var arr = [];
          $.each(result, function (key, item) {
            item.img && arr.push(item.img);
          });
          done(result, arr);
        }

        progress && progress(count / list.length);
      }
    });
  });
}
function imageAJAX(opts) {
  $.ajax({
    type: 'GET',
    url: opts.url,
    error: opts.error,
    success: opts.success,
    complete: opts.complete,
    beforeSend: function beforeSend(jqXHR) {
      if (opts.prog) {
        jqXHR.onprogress = function (e) {
          if (e.lengthComputable) {
            opts.prog(e.loaded / e.total * 100 || 0);
          }
        };
      }
    }
  });
}

/***/ }),

/***/ "./src/scripts/setjs/utility/browser.js":
/*!**********************************************!*\
  !*** ./src/scripts/setjs/utility/browser.js ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getQsMap": function() { return /* binding */ getQsMap; },
/* harmony export */   "getQs": function() { return /* binding */ getQs; },
/* harmony export */   "makeQs": function() { return /* binding */ makeQs; }
/* harmony export */ });
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function getQsMap(opts) {
  var _ref = opts || {},
      names = _ref.names,
      sep = _ref.sep,
      values = _ref.values;

  var pairs = (window.location.href.split('?')[1] || '').split('&');
  var result = {};
  pairs.forEach(function (pair) {
    var _pair$split = pair.split('='),
        _pair$split2 = _slicedToArray(_pair$split, 2),
        name = _pair$split2[0],
        value = _pair$split2[1];

    name = decodeURIComponent(name);
    value = decodeURIComponent(value);

    if (name && value) {
      value = sep ? value.split(sep) : value;
      result[name] = value;
    }
  });

  if (names) {
    Object.keys(result).forEach(function (key) {
      if (names.indexOf(key) < 0) {
        delete result[key];
      }
    });
  }

  if (values) {
    Object.keys(result).forEach(function (key) {
      if (values[key] && values[key].indexOf(result[key]) < 0) {
        delete result[key];
      }
    });
  }

  return result;
}
function getQs(name, opts) {
  return getQsMap(opts)[name] || '';
}
function makeQs(params, question) {
  var qs = '';
  $.each(params, function (name, val) {
    var isArray = Array.isArray(val);

    if (val && (!isArray || val.length)) {
      qs += (qs ? '&' : '') + encodeURIComponent(name) + '=' + encodeURIComponent(isArray ? val.join(',') : val);
    }
  });
  return question && qs ? '?' + qs : qs;
} // Obsolete. now use this: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
// export function copyText(text) {
//   let $body = $('body');
//   let input = $('<input type="text">').val(text)[0];
//   $body.append(input);
//   input.select();
//   input.setSelectionRange(0, 99999);
//   document.execCommand('copy');
//   $(input).remove();
// }

/***/ }),

/***/ "./src/scripts/setjs/utility/calls.js":
/*!********************************************!*\
  !*** ./src/scripts/setjs/utility/calls.js ***!
  \********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "throttle": function() { return /* binding */ throttle; },
/* harmony export */   "debounce": function() { return /* binding */ debounce; },
/* harmony export */   "batchCall": function() { return /* binding */ batchCall; },
/* harmony export */   "serialCall": function() { return /* binding */ serialCall; }
/* harmony export */ });
/* harmony import */ var setjs_utility_objects_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/utility/objects.js */ "./src/scripts/setjs/utility/objects.js");
 // https://davidwalsh.name/javascript-debounce-function#comment-509154
// Returns a function, that, as long as it continues to be invoked, will only
// trigger every N milliseconds. If <code>immediate</code> is passed, trigger the
// function on the leading edge, instead of the trailing.

function throttle(func) {
  var wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 250;
  var immediate = arguments.length > 2 ? arguments[2] : undefined;
  var timeout;
  return function () {
    var context = this,
        args = arguments;

    var later = function later() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
} // https://davidwalsh.name/javascript-debounce-function
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.

function debounce(func) {
  var wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 250;
  var immediate = arguments.length > 2 ? arguments[2] : undefined;
  var timeout;
  return function () {
    var context = this,
        args = arguments;

    var later = function later() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}
function batchCall(_ref) {
  var _success = _ref.success,
      _error = _ref.error,
      progress = _ref.progress;
  var done = 0;
  var result = {};
  var calls = [];
  var callManager = {
    go: go,
    add: function add(func, opts, key, prop) {
      calls.push({
        func: func,
        opts: opts,
        key: key,
        prop: prop
      });
      return callManager;
    }
  };
  return callManager;

  function go() {
    if (!calls.length) {
      _success(result);
    }

    calls.forEach(function (item) {
      item.func($.extend({}, item.opts, {
        error: function error(errObj) {
          typeof _error == 'function' && _error(errObj);
          _error = 1;
        },
        success: function success(res) {
          done++;

          if (item.key) {
            result[item.key] = item.prop ? (0,setjs_utility_objects_js__WEBPACK_IMPORTED_MODULE_0__.getProp)(item.prop, res) : res;
          }

          item.opts && item.opts.success && item.opts.success(res);

          if (_error != 1 && progress) {
            progress({
              done: done,
              rem: calls.length - done,
              percent: Math.round(100 * done / calls.length)
            });
          }

          if (done == calls.length) {
            _success(result);
          }
        }
      }));
    });
  }
}
function serialCall(_ref2) {
  var condition = _ref2.condition,
      success = _ref2.success,
      error = _ref2.error;
  var calls = [];
  var callManager = {
    go: go,
    add: function add(func, opts) {
      calls.push({
        func: func,
        opts: opts
      });
      return callManager;
    }
  };
  return callManager;

  function go() {
    if (calls.length) {
      if (!condition || condition()) {
        var item = calls.shift();
        var opts = $.extend({
          success: go,
          error: error
        }, item.opts);

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        item.func.apply(item, [opts].concat(args));
      }
    } else {
      success && success();
    }
  }
}

/***/ }),

/***/ "./src/scripts/setjs/utility/comp-helpers.js":
/*!***************************************************!*\
  !*** ./src/scripts/setjs/utility/comp-helpers.js ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "storeItemByName": function() { return /* binding */ storeItemByName; },
/* harmony export */   "dataAttrFunc": function() { return /* binding */ dataAttrFunc; },
/* harmony export */   "dataAttrFind": function() { return /* binding */ dataAttrFind; }
/* harmony export */ });
/* harmony import */ var setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! setjs/kernel/basics.js */ "./src/scripts/setjs/kernel/basics.js");

function storeItemByName(comp, name, item) {
  if (name) {
    if (comp[name]) {
      (0,setjs_kernel_basics_js__WEBPACK_IMPORTED_MODULE_0__.fatal)('Repeat name', name);
    }

    comp[name] = item;
  }
}
function dataAttrFunc($el, dataName, func, excludeSelf) {
  dataAttrFind($el, dataName, excludeSelf).each(function (i, item) {
    var $item = $(item);
    func($item, $item.data(dataName));
  });
}
function dataAttrFind($el, dataName, excludeSelf) {
  dataName = '[data-' + dataName + ']';
  return excludeSelf ? $el.find(dataName) : $el.find(dataName).addBack(dataName);
}

/***/ }),

/***/ "./src/scripts/setjs/utility/numbers.js":
/*!**********************************************!*\
  !*** ./src/scripts/setjs/utility/numbers.js ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "uniqueId": function() { return /* binding */ uniqueId; },
/* harmony export */   "randomBool": function() { return /* binding */ randomBool; },
/* harmony export */   "randInclusive": function() { return /* binding */ randInclusive; },
/* harmony export */   "minMax": function() { return /* binding */ minMax; },
/* harmony export */   "guid": function() { return /* binding */ guid; },
/* harmony export */   "roundNum": function() { return /* binding */ roundNum; },
/* harmony export */   "formatNumber": function() { return /* binding */ formatNumber; },
/* harmony export */   "nth": function() { return /* binding */ nth; }
/* harmony export */ });
var id = 0;
function uniqueId(prefix) {
  id++;
  return (prefix ? prefix.toString() : 0) + id;
}
function randomBool() {
  return Math.random() >= 0.5;
}
function randInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
function minMax(val, min, max) {
  return Math.min(max, Math.max(min, val));
}
function guid() {
  function _p8(s) {
    var p = (Math.random().toString(16) + '000000000').substr(2, 8);
    return s ? '-' + p.substr(0, 4) + '-' + p.substr(4, 4) : p;
  }

  return _p8() + _p8(true) + _p8(true) + _p8();
} // https://stackoverflow.com/a/29101013/2211098

function roundNum(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}
function formatNumber(x) {
  return x.toString().replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
} // https://stackoverflow.com/a/39466341/2211098

function nth(n) {
  return n + (['st', 'nd', 'rd'][(n / 10 % 10 ^ 1 && n % 10) - 1] || 'th');
} // var alphabet = '0123456789';
// for (var i = 65; i < 91; i++) {
//   alphabet += String.fromCharCode(i);
//   alphabet += String.fromCharCode(i + 32);
// }
// export function randId(length) {
//   var id = '';
//   while (length--) {
//     id += alphabet[randInclusive(0, alphabet.length - 1)];
//   }
//   return id;
// }

/***/ }),

/***/ "./src/scripts/setjs/utility/objects.js":
/*!**********************************************!*\
  !*** ./src/scripts/setjs/utility/objects.js ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "resetObject": function() { return /* binding */ resetObject; },
/* harmony export */   "storeValue": function() { return /* binding */ storeValue; },
/* harmony export */   "copyObj": function() { return /* binding */ copyObj; },
/* harmony export */   "getProp": function() { return /* binding */ getProp; }
/* harmony export */ });
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function processType(path, val) {
  var type = path.slice(-1);

  if (path[path.length - 2] == ':') {
    path = path.slice(0, -2);

    if (type == 'n') {
      val = +val;
    } else if (type == 'b') {
      val = !!val;
    }
  }

  return {
    path: path,
    val: val
  };
}

function listIndex(str) {
  if (str.length) {
    if (isNaN(str)) {
      return str;
    } else {
      return +str;
    }
  }
}

function parsePath(path) {
  var parts = [];
  var mark = 0;
  var skip;

  for (var i = 0; i < path.length; i++) {
    if (skip) {
      if (path[i] == ']') {
        parts.push({
          list: 1,
          key: path.slice(mark, skip),
          index: listIndex(path.slice(skip + 1, i))
        });
        mark = i + 1;
        skip = 0;
      }
    } else if (path[i] == '[') {
      skip = i;

      if (!i) {
        throw 'Bad object config ' + path;
      }
    } else if (path[i] == '.') {
      addObj();
      mark = i + 1;
    }
  }

  addObj();
  return parts;

  function addObj() {
    if (mark < i) {
      parts.push({
        key: path.slice(mark, i)
      });
    }
  }
}

function resetItem(data, parts, key, config, index) {
  var part = parts[index++];

  if (index < parts.length) {
    data = data[part];

    if (Array.isArray(data)) {
      data.forEach(function (listItem) {
        resetItem(listItem, parts, key, config, index);
      });
    } else if (data) {
      resetItem(data, parts, key, config, index);
    }
  } else {
    if ('val' in config) {
      data[part] = typeof config.val == 'function' ? config.val() : config.val;
    } else if (config.arr) {
      data[part] = [];
    } else if (config.obj) {
      data[part] = {};
    } else {
      delete data[part];
    }
  }
}

function resetObject(data, resets) {
  $.each(resets, function (key, config) {
    resetItem(data, key.split('.'), key, config, 0);
  });
}

function partIndex(part, arr) {
  return part.list ? part.index != null ? part.index : arr.length : null;
}

function storeValue(target, _path, _val) {
  var _processType = processType(_path, _val),
      path = _processType.path,
      val = _processType.val;

  var parts = parsePath(path);
  var index;
  parts.forEach(function (part, i) {
    var end = i == parts.length - 1;

    if (Array.isArray(target)) {
      storeInArray(part, end);
    } else {
      storeInObject(part, end);
    }

    index = partIndex(part, target);
  });

  function storeInObject(part, end) {
    var tmp = target[part.key];

    if (part.list) {
      tmp = Array.isArray(tmp) ? tmp : [];

      if (end) {
        tmp[partIndex(part, tmp)] = val;
      }
    } else {
      if (end) {
        tmp = val;
      } else {
        tmp = _typeof(tmp) == 'object' ? tmp : {};
      }
    }

    target = target[part.key] = tmp;
  }

  function storeInArray(part, end) {
    var tmp = target[index];

    if (part.list) {
      if (part.key) {
        if (_typeof(tmp) != 'object') {
          tmp = target[index] = {};
        }

        tmp = tmp[part.key] = Array.isArray(tmp[part.key]) ? tmp[part.key] : [];
      } else {
        tmp = target[index] = Array.isArray(tmp) ? tmp : [];
      }

      if (end) {
        tmp[partIndex(part, tmp)] = val;
      }
    } else {
      target[index] = tmp = _typeof(tmp) == 'object' ? tmp : {};

      if (end) {
        tmp[part.key] = val;
      } else {
        tmp = tmp[part.key] = {};
      }
    }

    target = tmp;
  }
}
function copyObj(target, source, props) {
  props.forEach(function (prop) {
    storeValue(target, prop, getProp(prop, source));
  });
  return target;
}
function getProp(propPath, data, data2) {
  var parts = propPath.split('.');

  for (var j = 0; data && j < parts.length; j++) {
    if (j == parts.length - 1 && Object.prototype.hasOwnProperty.call(data, parts[j])) {
      return data[parts[j]];
    }

    data = data[parts[j]];
  }

  if (data2) {
    return getProp(propPath, data2);
  }
}

/***/ }),

/***/ "./src/scripts/setjs/utility/strings.js":
/*!**********************************************!*\
  !*** ./src/scripts/setjs/utility/strings.js ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "capitalize": function() { return /* binding */ capitalize; },
/* harmony export */   "getStrHash": function() { return /* binding */ getStrHash; },
/* harmony export */   "supplant": function() { return /* binding */ supplant; },
/* harmony export */   "getInitials": function() { return /* binding */ getInitials; },
/* harmony export */   "prettyTime": function() { return /* binding */ prettyTime; },
/* harmony export */   "timeToText": function() { return /* binding */ timeToText; },
/* harmony export */   "slugify": function() { return /* binding */ slugify; }
/* harmony export */ });
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
} //https://stackoverflow.com/a/8831937/2211098
//https://github.com/darkskyapp/string-hash

function getStrHash(str) {
  var hash = 5381,
      i = str && str.length || 0;

  while (i) {
    hash = hash * 33 ^ str.charCodeAt(--i);
  }

  return hash >>> 0;
}
/**
 * A simple solution to replace variables in templates
 * http://javascript.crockford.com/remedial.html
 * @param {string} string
 * @param {string} o
 * @return {string}
 */

function supplant(string, o) {
  return string.replace(/{([^{}]*)}/g, function (a, b) {
    var r = o,
        parts = b.split('.');

    for (var i = 0; r && i < parts.length; i++) {
      r = r[parts[i]];
    }

    return typeof r === 'string' || typeof r === 'number' ? r : a;
  });
}
/**
 * getInitials - Create initials from full name
 * @param {string} name - full name
 * @return {string} - The initials
*/

function getInitials(name) {
  var initials;

  try {
    initials = name.toUpperCase().match(/\b\w/g);

    if (initials.length > 1) {
      initials = initials.shift() + initials.pop();
    } else {
      initials = initials.shift();
    }
  } catch (e) {
    initials = name.charAt(0);
  }

  return initials;
}
function prettyTime(num) {
  return (num < 10 ? '0' : '') + num;
}
function timeToText(ms) {
  var total_seconds = ms / 1000;
  var hours = Math.floor(total_seconds / 3600);
  total_seconds = total_seconds % 3600;
  var minutes = Math.floor(total_seconds / 60);
  total_seconds = total_seconds % 60;
  var seconds = Math.floor(total_seconds);
  hours = prettyTime(hours);
  minutes = prettyTime(minutes);
  seconds = prettyTime(seconds);
  return hours + ':' + minutes + ':' + seconds;
} // https://medium.com/@mhagemann/the-ultimate-way-to-slugify-a-url-string-in-javascript-b8e4a0d849e1

function slugify(string) {
  var a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
  var b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
  var p = new RegExp(a.split('').join('|'), 'g');
  return string.toString().toLowerCase().replace(/\s+/g, '-') // Replace spaces with -
  .replace(p, function (c) {
    return b.charAt(a.indexOf(c));
  }) // Replace special characters
  .replace(/&/g, '-and-') // Replace & with 'and'
  .replace(/[^\w-]+/g, '') // Remove all non-word characters
  .replace(/--+/g, '-') // Replace multiple - with single -
  .replace(/^-+/, '') // Trim - from start of text
  .replace(/-+$/, ''); // Trim - from end of text
}

/***/ }),

/***/ "./src/scripts/data/home.json":
/*!************************************!*\
  !*** ./src/scripts/data/home.json ***!
  \************************************/
/***/ (function(module) {

"use strict";
module.exports = JSON.parse('{"id":"home","timestamp":1639338589804,"pages":20,"obj":[{"el":"usain","fields":[{"list":[{"key":"opacity","val":[0,1]}],"time":[36.67,40.76]},{"time":[36.67,48.97],"list":[{"key":"scale","val":[0.7,2.4]}]},{"list":[{"key":"head","val":[-0.4,0.5]}],"time":[36.67,48.97]},{"time":[64.86,68.94],"list":[{"key":"bg_opacity","val":[1,0]}]}]},{"el":"emotion","fields":[{"time":[68.89,95],"list":[{"key":"m","val":[0,1]}]}]},{"el":"navParams","fields":[{"list":[{"key":"prog","val":[0,100]}],"time":[95.56,100]}]},{"el":"story","fields":[{"time":[40.8,64.13],"list":[{"key":"m","val":[0,1]}]}]},{"el":"top_white","fields":[{"time":[4.49,20.16],"list":[{"key":"scale","val":[0.08,1]},{"key":"opacity","val":[0.1,0.3]},{"key":"top","val":[0.9,0]}]},{"time":[31.82,44.4],"list":[{"key":"scale","val":[1,10]},{"key":"easing","val":"easeInQuad"}]},{"time":[31.82,37.49],"list":[{"key":"opacity","val":[0.3,1]}]}]},{"el":"top_black","fields":[{"time":[40.59,46.27],"list":[{"key":"left","val":[100,0]},{"key":"opacity","val":[0.3,0.3]}]},{"time":[59.38,63.48],"list":[{"key":"opacity","val":[0.3,1]}]},{"time":[63.01,64.18],"list":[{"key":"emotion_show","val":[0,1]}]},{"time":[63.48,68.94],"list":[{"key":"opacity","val":[1,0]}]},{"time":[62.11,71.68],"list":[{"key":"scale","val":[1,10]}]}]}],"dom":[{"el":"#entrance-section","fields":[{"list":[{"key":"top","val":[0,-100],"unit":"%"}],"time":[0,10.84]}]},{"el":"#entrance-quote","fields":[{"list":[{"key":"opacity","val":[0,1]}],"time":[0,10]},{"list":[{"key":"bottom","val":[-200,200],"unit":"px"}],"time":[10,14]}]},{"el":"#stimulate-section","fields":[{"list":[{"key":"translateY","val":[0,-100],"unit":"%"}],"time":[4.49,20.16]},{"list":[{"key":"opacity","val":[0,1]},{"key":"easing","val":"easeInQuad"}],"time":[4.49,20.16]},{"list":[{"key":"opacity","val":[1,0]},{"key":"easing","val":"easeInQuad"}],"time":[31.82,39.01]}]},{"el":"#stimulate-video","fields":[{"time":[30.02,39.01],"list":[{"key":"opacity","val":[1,0]}]}]},{"el":"#we-dont-sell","fields":[{"list":[{"key":"opacity","val":[0,1]},{"key":"easing","val":"easeInQuad"}],"time":[20.16,24.82]},{"list":[{"key":"opacity","val":[1,0.2]},{"key":"easing","val":"easeOutSine"}],"time":[24.82,35.43]},{"time":[21.96,26.44],"list":[{"key":"scale","val":[0.1,6]},{"key":"easing","val":"easeInQuad"},{"key":"translateY","val":[0,-3],"unit":"px"}]},{"time":[26.44,40.8],"list":[{"key":"scale","val":[6,70]},{"key":"easing","val":"easeOutQuad"}]}]},{"el":"#we-stimulate","fields":[{"list":[{"key":"opacity","val":[0,1]},{"key":"easing","val":"easeInSine"}],"time":[25.73,31.12]},{"list":[{"key":"opacity","val":[1,0.2]},{"key":"easing","val":"easeOutQuad"}],"time":[32.02,37.23]},{"time":[27.53,32.02],"list":[{"key":"scale","val":[0.1,4]},{"key":"easing","val":"easeInSine"}]},{"time":[32.02,46.36],"list":[{"key":"scale","val":[4,60]},{"key":"easing","val":"easeOutQuad"}]}]},{"el":"#emotion-section","fields":[{"time":[60.73,62.11],"list":[{"key":"opacity","val":[0,1]}]}]},{"el":"#bottom-white","fields":[{"time":[3.94,20.79],"list":[{"key":"translateY","val":[60,0],"unit":"vh"},{"key":"opacity","val":[0.1,0.3]}]},{"time":[31.82,42.96],"list":[{"key":"translateY","val":[0,160],"unit":"vh"},{"key":"scale","val":[1,10]},{"key":"opacity","val":[0.3,1]}]}]},{"el":"#bottom-black","fields":[{"time":[40.59,46.27],"list":[{"key":"left","val":[100,0],"unit":"vw"}]},{"time":[59.38,63.48],"list":[{"key":"opacity","val":[0.3,1]}]},{"time":[62.11,71.68],"list":[{"key":"scale","val":[1,12]},{"key":"translateY","val":[0,150],"unit":"%"}]}]}]}');

/***/ }),

/***/ "./src/scripts/data/sequences.json":
/*!*****************************************!*\
  !*** ./src/scripts/data/sequences.json ***!
  \*****************************************/
/***/ (function(module) {

"use strict";
module.exports = JSON.parse('[{"el":"fade-out-blow-up","fields":[{"time":[0,20],"list":[{"key":"opacity","val":[0,1]},{"key":"easing","val":"easeInQuad"}]},{"time":[30,100],"list":[{"key":"opacity","val":[1,0]},{"key":"easing","val":"easeOutSine"}]},{"time":[5,20],"list":[{"key":"scale","val":[0.1,6]},{"key":"easing","val":"easeInQuad"}]},{"time":[30,100],"list":[{"key":"scale","val":[6,90]},{"key":"easing","val":"easeOutSine"}]}]}]');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function() { return module['default']; } :
/******/ 				function() { return module; };
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
!function() {
"use strict";
/*!*****************************!*\
  !*** ./src/scripts/main.js ***!
  \*****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var config_setup_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! config/setup.js */ "./src/scripts/config/setup.js");
/* harmony import */ var core_setjs_init_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! core/setjs-init.js */ "./src/scripts/core/setjs-init.js");
/* harmony import */ var Configurator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! Configurator */ "./src/scripts/configurator/init.js");
/* harmony import */ var core_loader_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! core/loader.js */ "./src/scripts/core/loader.js");
/* harmony import */ var core_timeliner_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! core/timeliner.js */ "./src/scripts/core/timeliner.js");
/* harmony import */ var core_nav_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! core/nav.js */ "./src/scripts/core/nav.js");
/* harmony import */ var helpers_triangles_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! helpers/triangles.js */ "./src/scripts/helpers/triangles.js");
/* harmony import */ var helpers_dom_helpers__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! helpers/dom-helpers */ "./src/scripts/helpers/dom-helpers.js");
/* harmony import */ var plugins_jquery_carousel_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! plugins/jquery/carousel.js */ "./src/scripts/plugins/jquery/carousel.js");
/* harmony import */ var plugins_jquery_carousel_js__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(plugins_jquery_carousel_js__WEBPACK_IMPORTED_MODULE_8__);









window.$win = $(window);
window.$doc = $(document);
window.$body = $('body');
$(function () {
  config_setup_js__WEBPACK_IMPORTED_MODULE_0__["default"].init({timestamp: 1702910662524, extension: ""
});
  (0,core_setjs_init_js__WEBPACK_IMPORTED_MODULE_1__["default"])();

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  (0,core_loader_js__WEBPACK_IMPORTED_MODULE_3__["default"])(function () {
    loadTemplates();
    (0,core_timeliner_js__WEBPACK_IMPORTED_MODULE_4__.initTimeline)();
    (0,helpers_triangles_js__WEBPACK_IMPORTED_MODULE_6__["default"])();
    (0,helpers_dom_helpers__WEBPACK_IMPORTED_MODULE_7__["default"])();
    (0,core_nav_js__WEBPACK_IMPORTED_MODULE_5__["default"])();
    (0,Configurator__WEBPACK_IMPORTED_MODULE_2__["default"])();
  });
});

function loadTemplates() {
  var html = $('#page-templates').html();
  $('#page-templates').remove();
  $('body').append($(html).filter(function (i, el) {
    return el.outerHTML && !$('#' + el.id).length;
  }));
}
}();
/******/ })()
;
//# sourceMappingURL=bundle.js.map