(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _globals = require('./globals');

var UTILS = _interopRequireWildcard(_globals);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
var conf = {
  world: {
    autoresize: true,

    gravity: {
      x: 0,
      y: -100,
      z: 0
    },

    camera: {
      far: 10000,
      y: 10,
      z: 30
    },

    init: {
      rendering: false
    },

    rendering: {
      background: {
        color: 0x162129
      },

      renderer: {
        antialias: true
      }
    },

    shadowmap: {
      type: THREE.PCFSoftShadowMap
    }

  },

  sphere: {
    geometry: {
      radius: 5,
      widthSegments: 16,
      heightSegments: 16
    },

    mass: 10,

    material: {
      color: 0xF2F2F2,
      kind: 'basic'
    },

    position: {
      x: 0,
      y: 50,
      z: 0
    }
  },

  plane: {
    geometry: {
      width: 250,
      height: 250
    },

    mass: 0,

    material: {
      color: 0x447F8B,
      kind: 'basic'
    },

    position: {
      x: 0,
      y: 0,
      z: 0
    },

    rotation: {
      x: -Math.PI / 2
    }
  }
};

// -----------------------------------------------------------------------------
// Glitch Pass
// -----------------------------------------------------------------------------
var DigitalGlitchShader = {
  uniforms: {
    tDiffuse: { value: null }, //diffuse texture
    tDisp: { value: null }, //displacement texture for digital glitch squares
    byp: { value: 0 }, //apply the glitch ?
    amount: { value: 0.08 },
    angle: { value: 0.02 },
    seed: { value: 0.02 },
    seed_x: { value: 0.02 }, //-1,1
    seed_y: { value: 0.02 }, //-1,1
    distortion_x: { value: 0.5 },
    distortion_y: { value: 0.6 },
    col_s: { value: 0.05 }
  },

  vertexShader: '\n    varying vec2 vUv;\n\n    void main() {\n      vUv = uv;\n      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n    }\n  ',

  fragmentShader: '\n    uniform int byp; //should we apply the glitch ?\n\n    uniform sampler2D tDiffuse;\n    uniform sampler2D tDisp;\n\n    uniform float amount;\n    uniform float angle;\n    uniform float seed;\n    uniform float seed_x;\n    uniform float seed_y;\n    uniform float distortion_x;\n    uniform float distortion_y;\n    uniform float col_s;\n\n    varying vec2 vUv;\n\n\n    float rand(vec2 co){\n      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n    }\n\n    void main() {\n      if(byp<1) {\n        vec2 p = vUv;\n        float xs = floor(gl_FragCoord.x / 0.5);\n        float ys = floor(gl_FragCoord.y / 0.5);\n        //based on staffantans glitch shader for unity https://github.com/staffantan/unityglitch\n        vec4 normal = texture2D (tDisp, p*seed*seed);\n\n        if(p.y<distortion_x+col_s && p.y>distortion_x-col_s*seed) {\n          if(seed_x>0.){\n            p.y = 1. - (p.y + distortion_y);\n          }\n          else {\n            p.y = distortion_y;\n          }\n        }\n\n        if(p.x<distortion_y+col_s && p.x>distortion_y-col_s*seed) {\n          if(seed_y>0.){\n            p.x=distortion_x;\n          }\n          else {\n            p.x = 1. - (p.x + distortion_x);\n          }\n        }\n\n        p.x+=normal.x*seed_x*(seed/5.);\n        p.y+=normal.y*seed_y*(seed/5.);\n\n        //base from RGB shift shader\n\n        vec2 offset = amount * vec2( cos(angle), sin(angle));\n        vec4 cr = texture2D(tDiffuse, p + offset);\n        vec4 cga = texture2D(tDiffuse, p);\n        vec4 cb = texture2D(tDiffuse, p - offset);\n        gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);\n\n        //add noise\n        vec4 snow = 200.*amount*vec4(rand(vec2(xs * seed,ys * seed*50.))*0.2);\n        gl_FragColor = gl_FragColor+ snow;\n      }\n      else {\n        gl_FragColor = texture2D (tDiffuse, vUv);\n      }\n    }\n  '
};

var GlitchPass = function (_WHS$Pass) {
  _inherits(GlitchPass, _WHS$Pass);

  function GlitchPass(name, dt_size) {
    _classCallCheck(this, GlitchPass);

    var _this = _possibleConstructorReturn(this, (GlitchPass.__proto__ || Object.getPrototypeOf(GlitchPass)).call(this, name));

    if (DigitalGlitchShader === undefined) console.error("THREE.GlitchPass relies on DigitalGlitchShader");

    var shader = DigitalGlitchShader;
    _this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    if (dt_size == undefined) dt_size = 64;

    _this.uniforms["tDisp"].value = _this.generateHeightmap(dt_size);

    _this.material = new THREE.ShaderMaterial({
      uniforms: _this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    _this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    _this.scene = new THREE.Scene();

    _this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
    _this.scene.add(_this.quad);

    _this.goWild = false;
    _this.curF = 0;
    _this.generateTrigger();
    return _this;
  }

  _createClass(GlitchPass, [{
    key: 'render',
    value: function render(renderer, writeBuffer, readBuffer, delta, maskActive) {
      this.uniforms["tDiffuse"].value = readBuffer.texture;
      this.uniforms['seed'].value = Math.random(); //default seeding
      this.uniforms['byp'].value = 0;

      if (this.curF % this.randX == 0 || this.goWild == true) {
        this.uniforms['amount'].value = Math.random() / 30;
        this.uniforms['angle'].value = THREE.Math.randFloat(-Math.PI, Math.PI);
        this.uniforms['seed_x'].value = THREE.Math.randFloat(-1, 1);
        this.uniforms['seed_y'].value = THREE.Math.randFloat(-1, 1);
        this.uniforms['distortion_x'].value = THREE.Math.randFloat(0, 1);
        this.uniforms['distortion_y'].value = THREE.Math.randFloat(0, 1);
        this.curF = 0;
        this.generateTrigger();
      } else if (this.curF % this.randX < this.randX / 5) {
        this.uniforms['amount'].value = Math.random() / 90;
        this.uniforms['angle'].value = THREE.Math.randFloat(-Math.PI, Math.PI);
        this.uniforms['distortion_x'].value = THREE.Math.randFloat(0, 1);
        this.uniforms['distortion_y'].value = THREE.Math.randFloat(0, 1);
        this.uniforms['seed_x'].value = THREE.Math.randFloat(-0.3, 0.3);
        this.uniforms['seed_y'].value = THREE.Math.randFloat(-0.3, 0.3);
      } else if (this.goWild == false) {
        this.uniforms['byp'].value = 1;
      }

      this.curF++;
      this.quad.material = this.material;

      if (this.renderToScreen) {
        renderer.render(this.scene, this.camera);
      } else {
        renderer.render(this.scene, this.camera, writeBuffer, this.clear);
      }
    }
  }, {
    key: 'generateTrigger',
    value: function generateTrigger() {
      this.randX = THREE.Math.randInt(120, 240);
    }
  }, {
    key: 'generateHeightmap',
    value: function generateHeightmap(dt_size) {
      var data_arr = new Float32Array(dt_size * dt_size * 3);
      var length = dt_size * dt_size;

      for (var i = 0; i < length; i++) {
        var val = THREE.Math.randFloat(0, 1);
        data_arr[i * 3 + 0] = val;
        data_arr[i * 3 + 1] = val;
        data_arr[i * 3 + 2] = val;
      }

      var texture = new THREE.DataTexture(data_arr, dt_size, dt_size, THREE.RGBFormat, THREE.FloatType);
      texture.needsUpdate = true;
      return texture;
    }
  }]);

  return GlitchPass;
}(WHS.Pass);

// -----------------------------------------------------------------------------
// Game class
// -----------------------------------------------------------------------------


var Game = function () {
  function Game(options) {
    _classCallCheck(this, Game);

    this.options = options;

    this.world = new WHS.World(options.world);

    this.createPostProcessing();
    this.createGeometry();
  }

  _createClass(Game, [{
    key: 'createPostProcessing',
    value: function createPostProcessing() {
      var computedWidth = Number(this.world.params.width * this.world.params.rWidth).toFixed();
      var computedHeight = Number(this.world.params.height * this.world.params.rHeight).toFixed();

      var renderingPluginParams = {
        width: computedWidth,
        height: computedHeight,

        stats: this.world.params.stats,
        init: {
          stats: this.world.params.init.stats
        },

        background: {
          color: 0x162129
        }
      };

      this.world.renderingPlugin = new WHS.PostProcessor(renderingPluginParams);
      this.postProcessor = this.world.renderingPlugin;

      this.postProcessor.createRenderPass(false);
      this.postProcessor.createPass(function (composer) {
        var pass = new GlitchPass('Glitch');
        pass.renderToScreen = true;
        composer.addPass(pass);
      });
    }
  }, {
    key: 'createGeometry',
    value: function createGeometry() {
      this.plane = new WHS.Plane(this.options.plane);
      this.plane.addTo(this.world);

      this.sphere = new WHS.Sphere(this.options.sphere);
      this.sphere.addTo(this.world);
    }
  }, {
    key: 'start',
    value: function start() {
      this.world.start();
      this.world.setControls(new WHS.OrbitControls());
    }
  }]);

  return Game;
}();

// -----------------------------------------------------------------------------
// Application bootstrap
// -----------------------------------------------------------------------------


var app = null;

function bootstrap() {
  app.start();
}

function configure() {
  return new Promise(function (resolve) {
    // some async config fetch could be done from here
    // ...

    // Create a Game instance with its conf
    app = new Game(conf);
    resolve(true);
  });
}

configure().then(function () {
  return bootstrap();
});

},{"./globals":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addAmbient = addAmbient;
exports.addBasicLights = addBasicLights;
exports.addPlane = addPlane;
exports.addBoxPlane = addBoxPlane;
var $world = exports.$world = {
  stats: "fps", // fps, ms, mb or false if not need.
  autoresize: "window",

  gravity: { // Physic gravity.
    x: 0,
    y: -100,
    z: 0
  },

  camera: {
    z: 50, // Move camera.
    y: 10
  },

  rendering: {
    background: {
      color: 0x162129
    },

    renderer: {
      antialias: true
    }
  },

  shadowmap: {
    type: THREE.PCFSoftShadowMap
  }
};

var $colors = exports.$colors = {
  bg: 0x162129,
  plane: 0x447F8B,
  mesh: 0xF2F2F2
};

function addAmbient(world, intensity) {
  new WHS.AmbientLight({
    light: {
      intensity: intensity
    }
  }).addTo(world);
}

function addBasicLights(world) {
  var intensity = arguments.length <= 1 || arguments[1] === undefined ? 0.5 : arguments[1];
  var position = arguments.length <= 2 || arguments[2] === undefined ? [0, 10, 10] : arguments[2];

  new WHS.PointLight({
    light: {
      intensity: intensity
    },

    shadowmap: {
      fov: 90
    },

    position: [0, 10, 10]
  }).addTo(world);

  addAmbient(world, 1 - intensity);
}

function addPlane(world) {
  var size = arguments.length <= 1 || arguments[1] === undefined ? 100 : arguments[1];

  new WHS.Plane({
    geometry: {
      width: size,
      height: size
    },

    mass: 0,

    material: {
      color: 0x447F8B,
      kind: 'phong'
    },

    rotation: {
      x: -Math.PI / 2
    }
  }).addTo(world);
}

function addBoxPlane(world) {
  var size = arguments.length <= 1 || arguments[1] === undefined ? 100 : arguments[1];

  new WHS.Box({
    geometry: {
      width: size,
      height: 1,
      depth: size
    },

    mass: 0,

    material: {
      color: 0x447F8B,
      kind: 'phong'
    }
  }).addTo(world);
}

},{}]},{},[1]);
