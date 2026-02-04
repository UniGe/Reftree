/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 	};
/******/
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"example": 0
/******/ 	};
/******/
/******/
/******/
/******/ 	// script path function
/******/ 	function jsonpScriptSrc(chunkId) {
/******/ 		return __webpack_require__.p + "" + {"0":"483c869e734d7c45926d","1":"ef35c678ae4277a42b6d","2":"50a337d6e2d4a7c589ab","3":"a5ca186c565929164a57","4":"14112a1e64ecf5bc76a3","5":"3812be6f65f8d2c9efd9","6":"0adee7000d746b13662f"}[chunkId] + ".js"
/******/ 	}
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId) {
/******/ 		var promises = [];
/******/
/******/
/******/ 		// JSONP chunk loading for javascript
/******/
/******/ 		var installedChunkData = installedChunks[chunkId];
/******/ 		if(installedChunkData !== 0) { // 0 means "already installed".
/******/
/******/ 			// a Promise means "currently loading".
/******/ 			if(installedChunkData) {
/******/ 				promises.push(installedChunkData[2]);
/******/ 			} else {
/******/ 				// setup Promise in chunk cache
/******/ 				var promise = new Promise(function(resolve, reject) {
/******/ 					installedChunkData = installedChunks[chunkId] = [resolve, reject];
/******/ 				});
/******/ 				promises.push(installedChunkData[2] = promise);
/******/
/******/ 				// start chunk loading
/******/ 				var head = document.getElementsByTagName('head')[0];
/******/ 				var script = document.createElement('script');
/******/
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.src = jsonpScriptSrc(chunkId);
/******/ 				var timeout = setTimeout(function(){
/******/ 					onScriptComplete({ type: 'timeout', target: script });
/******/ 				}, 120000);
/******/ 				script.onerror = script.onload = onScriptComplete;
/******/ 				function onScriptComplete(event) {
/******/ 					// avoid mem leaks in IE.
/******/ 					script.onerror = script.onload = null;
/******/ 					clearTimeout(timeout);
/******/ 					var chunk = installedChunks[chunkId];
/******/ 					if(chunk !== 0) {
/******/ 						if(chunk) {
/******/ 							var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 							var realSrc = event && event.target && event.target.src;
/******/ 							var error = new Error('Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')');
/******/ 							error.type = errorType;
/******/ 							error.request = realSrc;
/******/ 							chunk[1](error);
/******/ 						}
/******/ 						installedChunks[chunkId] = undefined;
/******/ 					}
/******/ 				};
/******/ 				head.appendChild(script);
/******/ 			}
/******/ 		}
/******/ 		return Promise.all(promises);
/******/ 	};
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/Views/0/Js/react/build/";
/******/
/******/ 	// on error function for async loading
/******/ 	__webpack_require__.oe = function(err) { console.error(err); throw err; };
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./Views/0/Js/react/example.jsx");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./Views/0/Js/react/example.jsx":
/*!**************************************!*\
  !*** ./Views/0/Js/react/example.jsx ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\n\nvar _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nfunction _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return call && (typeof call === \"object\" || typeof call === \"function\") ? call : self; }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function, not \" + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }\n\nfunction _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step(\"next\", value); }, function (err) { step(\"throw\", err); }); } } return step(\"next\"); }); }; }\n\nexports.default = new Promise(function () {\n    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(resolve) {\n        var React, ExampleComponent, Form, Example;\n        return regeneratorRuntime.wrap(function _callee$(_context) {\n            while (1) {\n                switch (_context.prev = _context.next) {\n                    case 0:\n                        _context.next = 2;\n                        return __webpack_require__.e(/*! import() */ 6).then(function() { var module = __webpack_require__(/*! react */ \"./node_modules/react/index.js\"); return typeof module === \"object\" && module && module.__esModule ? module : Object.assign({/* fake namespace object */}, typeof module === \"object\" && module, { \"default\": module }); });\n\n                    case 2:\n                        React = _context.sent;\n                        _context.next = 5;\n                        return __webpack_require__.e(/*! import() */ 0).then(function() { var module = __webpack_require__(/*! ./components/exampleComponent.jsx */ \"./Views/0/Js/react/components/exampleComponent.jsx\"); return typeof module === \"object\" && module && module.__esModule ? module : Object.assign({/* fake namespace object */}, typeof module === \"object\" && module, { \"default\": module }); });\n\n                    case 5:\n                        _context.next = 7;\n                        return _context.sent.ExampleComponent;\n\n                    case 7:\n                        ExampleComponent = _context.sent;\n                        _context.next = 10;\n                        return __webpack_require__.e(/*! import() */ 1).then(function() { var module = __webpack_require__(/*! ../../../../Magic/Views/Js/react/components/form.jsx */ \"./Magic/Views/Js/react/components/form.jsx\"); return typeof module === \"object\" && module && module.__esModule ? module : Object.assign({/* fake namespace object */}, typeof module === \"object\" && module, { \"default\": module }); });\n\n                    case 10:\n                        _context.next = 12;\n                        return _context.sent.default;\n\n                    case 12:\n                        Form = _context.sent;\n\n                        Example = function (_React$Component) {\n                            _inherits(Example, _React$Component);\n\n                            function Example(props) {\n                                _classCallCheck(this, Example);\n\n                                var _this = _possibleConstructorReturn(this, (Example.__proto__ || Object.getPrototypeOf(Example)).call(this, props));\n\n                                _this.state = {\n                                    value: 'react',\n                                    formDefinition: {\n                                        grid: [{\n                                            field: 'text'\n                                        }],\n                                        fields: {\n                                            text: {\n                                                name: 'textarea',\n                                                type: 'textarea'\n                                            }\n                                        }\n                                    }\n                                };\n                                return _this;\n                            }\n\n                            _createClass(Example, [{\n                                key: 'render',\n                                value: function render() {\n                                    return React.createElement(\n                                        'div',\n                                        null,\n                                        React.createElement(\n                                            'h1',\n                                            null,\n                                            'Hi from ',\n                                            this.state.value\n                                        ),\n                                        React.createElement(\n                                            'p',\n                                            null,\n                                            'If you want to develop with react:'\n                                        ),\n                                        React.createElement(\n                                            'ul',\n                                            null,\n                                            React.createElement(\n                                                'li',\n                                                null,\n                                                'make sure you have installed node v8.x'\n                                            ),\n                                            React.createElement(\n                                                'li',\n                                                null,\n                                                'run (in cmd from MagicSolution folder) npm install'\n                                            ),\n                                            React.createElement(\n                                                'li',\n                                                null,\n                                                'modify webpack.config.js according the example you already find in it'\n                                            ),\n                                            React.createElement(\n                                                'li',\n                                                null,\n                                                'run npm run build'\n                                            )\n                                        ),\n                                        React.createElement(ExampleComponent, { name: this.state.value }),\n                                        React.createElement(Form, { definition: this.state.formDefinition })\n                                    );\n                                }\n                            }]);\n\n                            return Example;\n                        }(React.Component);\n\n                        resolve(Example);\n\n                    case 15:\n                    case 'end':\n                        return _context.stop();\n                }\n            }\n        }, _callee, undefined);\n    }));\n\n    return function (_x) {\n        return _ref.apply(this, arguments);\n    };\n}());//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9WaWV3cy8wL0pzL3JlYWN0L2V4YW1wbGUuanN4PzhiOWEiXSwibmFtZXMiOlsiUHJvbWlzZSIsInJlc29sdmUiLCJSZWFjdCIsIkV4YW1wbGVDb21wb25lbnQiLCJkZWZhdWx0IiwiRm9ybSIsIkV4YW1wbGUiLCJwcm9wcyIsInN0YXRlIiwidmFsdWUiLCJmb3JtRGVmaW5pdGlvbiIsImdyaWQiLCJmaWVsZCIsImZpZWxkcyIsInRleHQiLCJuYW1lIiwidHlwZSIsIkNvbXBvbmVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztrQkFBZSxJQUFJQSxPQUFKO0FBQUEsdUVBQVksaUJBQU1DLE9BQU47QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSwrQkFDSCxvVUFERzs7QUFBQTtBQUNqQkMsNkJBRGlCO0FBQUE7QUFBQSwrQkFFZSxxWEFGZjs7QUFBQTtBQUFBO0FBQUEsNkNBRTREQyxnQkFGNUQ7O0FBQUE7QUFFakJBLHdDQUZpQjtBQUFBO0FBQUEsK0JBR0csZ1lBSEg7O0FBQUE7QUFBQTtBQUFBLDZDQUdtRUMsT0FIbkU7O0FBQUE7QUFHakJDLDRCQUhpQjs7QUFJakJDLCtCQUppQjtBQUFBOztBQUtuQiw2Q0FBWUMsS0FBWixFQUFtQjtBQUFBOztBQUFBLDhJQUNUQSxLQURTOztBQUVmLHNDQUFLQyxLQUFMLEdBQWE7QUFDVEMsMkNBQU8sT0FERTtBQUVUQyxvREFBZ0I7QUFDWkMsOENBQU0sQ0FDRjtBQUNJQyxtREFBTztBQURYLHlDQURFLENBRE07QUFNWkMsZ0RBQVE7QUFDSkMsa0RBQU07QUFDRkMsc0RBQU0sVUFESjtBQUVGQyxzREFBTTtBQUZKO0FBREY7QUFOSTtBQUZQLGlDQUFiO0FBRmU7QUFrQmxCOztBQXZCa0I7QUFBQTtBQUFBLHlEQXlCVjtBQUNMLDJDQUNJO0FBQUE7QUFBQTtBQUNJO0FBQUE7QUFBQTtBQUFBO0FBQWEsaURBQUtSLEtBQUwsQ0FBV0M7QUFBeEIseUNBREo7QUFFSTtBQUFBO0FBQUE7QUFBQTtBQUFBLHlDQUZKO0FBS0k7QUFBQTtBQUFBO0FBQ0k7QUFBQTtBQUFBO0FBQUE7QUFBQSw2Q0FESjtBQUVJO0FBQUE7QUFBQTtBQUFBO0FBQUEsNkNBRko7QUFHSTtBQUFBO0FBQUE7QUFBQTtBQUFBLDZDQUhKO0FBSUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUpKLHlDQUxKO0FBV0ksNERBQUMsZ0JBQUQsSUFBa0IsTUFBTSxLQUFLRCxLQUFMLENBQVdDLEtBQW5DLEdBWEo7QUFZSSw0REFBQyxJQUFELElBQU0sWUFBWSxLQUFLRCxLQUFMLENBQVdFLGNBQTdCO0FBWkoscUNBREo7QUFnQkg7QUExQ2tCOztBQUFBO0FBQUEsMEJBSURSLE1BQU1lLFNBSkw7O0FBNkN2QmhCLGdDQUFRSyxPQUFSOztBQTdDdUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsS0FBWjs7QUFBQTtBQUFBO0FBQUE7QUFBQSxJIiwiZmlsZSI6Ii4vVmlld3MvMC9Kcy9yZWFjdC9leGFtcGxlLmpzeC5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IG5ldyBQcm9taXNlKGFzeW5jIHJlc29sdmUgPT4ge1xyXG4gICAgY29uc3QgUmVhY3QgPSBhd2FpdCBpbXBvcnQoJ3JlYWN0Jyk7XHJcbiAgICBjb25zdCBFeGFtcGxlQ29tcG9uZW50ID0gYXdhaXQgKGF3YWl0IGltcG9ydCgnLi9jb21wb25lbnRzL2V4YW1wbGVDb21wb25lbnQuanN4JykpLkV4YW1wbGVDb21wb25lbnQ7XHJcbiAgICBjb25zdCBGb3JtID0gYXdhaXQgKGF3YWl0IGltcG9ydCgnLi4vLi4vLi4vLi4vTWFnaWMvVmlld3MvSnMvcmVhY3QvY29tcG9uZW50cy9mb3JtLmpzeCcpKS5kZWZhdWx0O1xyXG4gICAgY2xhc3MgRXhhbXBsZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJvcHMpIHtcclxuICAgICAgICAgICAgc3VwZXIocHJvcHMpO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0ge1xyXG4gICAgICAgICAgICAgICAgdmFsdWU6ICdyZWFjdCcsXHJcbiAgICAgICAgICAgICAgICBmb3JtRGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyaWQ6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgZmllbGRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXh0YXJlYScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dGFyZWEnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPGgxPkhpIGZyb20ge3RoaXMuc3RhdGUudmFsdWV9PC9oMT5cclxuICAgICAgICAgICAgICAgICAgICA8cD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgSWYgeW91IHdhbnQgdG8gZGV2ZWxvcCB3aXRoIHJlYWN0OlxyXG4gICAgICAgICAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgICAgICAgICAgICA8dWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5tYWtlIHN1cmUgeW91IGhhdmUgaW5zdGFsbGVkIG5vZGUgdjgueDwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5ydW4gKGluIGNtZCBmcm9tIE1hZ2ljU29sdXRpb24gZm9sZGVyKSBucG0gaW5zdGFsbDwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5tb2RpZnkgd2VicGFjay5jb25maWcuanMgYWNjb3JkaW5nIHRoZSBleGFtcGxlIHlvdSBhbHJlYWR5IGZpbmQgaW4gaXQ8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+cnVuIG5wbSBydW4gYnVpbGQ8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgICAgICAgICAgICAgPEV4YW1wbGVDb21wb25lbnQgbmFtZT17dGhpcy5zdGF0ZS52YWx1ZX0gLz5cclxuICAgICAgICAgICAgICAgICAgICA8Rm9ybSBkZWZpbml0aW9uPXt0aGlzLnN0YXRlLmZvcm1EZWZpbml0aW9ufSAvPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlc29sdmUoRXhhbXBsZSk7XHJcbn0pOyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./Views/0/Js/react/example.jsx\n");

/***/ })

/******/ });