import * as THREE from 'three';

import { extend } from '../../../utils/index';
import { RenderingPlugin } from '../RenderingPlugin';
import { EffectComposer } from './EffectComposer.js';
import { RenderPass } from './pass/RenderPass.js';

class PostProcessor extends RenderingPlugin {
  static defaults = {
    autoresize: true,

    rWidth: 1, // Resolution(width).
    rHeight: 1, // Resolution(height).

    renderTarget: {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
      toScreen: true
    }
  };

  constructor(params = {}, localWindow = window) {
    PostProcessor.defaults.width = localWindow.innerWidth;
    PostProcessor.defaults.height = localWindow.innerHeight;
    const _params = extend(params, PostProcessor.defaults);

    super(_params);

    return (world) => {
      this.parentWorld = world;
      return this;
    }
  }

  build() {
    const _params = this.params;

    const width = Number(window.innerWidth * _params.rWidth).toFixed();
    const height = Number(window.innerHeight * _params.rHeight).toFixed();

    // Renderer.
    this.renderer = new THREE.WebGLRenderer(_params.renderer);

    const _renderer = this.renderer;
    _renderer.setClearColor(_params.background.color, _params.background.opacity);

    // Shadowmap.
    _renderer.shadowMap.enabled = _params.shadowmap.enabled;
    _renderer.shadowMap.type = _params.shadowmap.type;
    _renderer.shadowMap.cascade = true;

    this.setSize(_params.width, _params.height);

    // RenderTarget
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, _params.renderTarget);
  }

  _initComposer() {
    const _renderer = this.renderer;
    const _renderTarget = this.renderTarget;

    // TODO: throw or something here
    if (!_renderer || !_renderTarget) return;

    if (!this.composer)
      this.composer = new EffectComposer(_renderer, _renderTarget);
  }

  onParentWorldChanged() {
    // Scene and camera
    this.setRenderScene(this.parentWorld.scene, this.parentWorld.camera);

    // EffectComposer
    if (this.parentWorld){
      this._initComposer();
    }
    else {
      this.composer = undefined;
    }
  }

  /**
   * Create and add a WHS.Pass to the post processing pipeline.
   * @param  {Function} passCreator : A function that must return a WHS.Pass instance. It can be used to configurate the pass.
   * @return {WHS.Pass} The created WHS.Pass
   */
  createPass(passCreator) {
    if (typeof passCreator === 'function') return passCreator(this.composer);
  }

  /**
   * [getPass description]
   * @param  {String} name : The unique name of the pass.
   * @return {WHS.Pass} The found WHS.Pass, otherwise undefined.
   */
  getPass(name) {
    return this.composer ? this.composer.getPass(name) : undefined;
  }

  /**
   * A helper to create a render pass (WHS.RenderPass) that will draw your geometry in the PostProcessor first pass.
   * @param  {Boolean} renderToScreen : Should the renderpass be rendered directly to screen
   */
  createRenderPass(renderToScreen = false) {
    const world = this.parentWorld;

    if (world.scene && world.camera && this.composer) {
      this.createPass(composer => {
        const pass = new RenderPass('renderscene', world.scene, world.camera.native);
        pass.renderToScreen = renderToScreen;
        composer.addPass(pass);
      });
    }
  }

  /**
   * A helper to get the render pass of this PostProcessor.
   * @return {WHS.RenderPass} The render pass found, otherwise undefined.
   */
  getRenderPass() {
    return this.getPass('renderscene');
  }

  /**
   * Remove a pass from the PostProcessor
   * @param  {String} name : The unique name of the pass
   */
  removePass(name) {
    if (this.composer) this.composer.removePass(name);
  }

  /**
   * Used by the WHS.World instance associated with this PostProcessor to set the container.
   * @param {DOM} container : The Dom container element.
   */
  setContainerConfig(container) {
    this.container = container;
    // TODO: handle autoresize container offset
  }

  /**
   * Set the Scene and camera used by the renderTarget in this PostProcessor.
   * @param {THREE.Scene} scene : The scenagraph containing the geometry.
   * @param {THREE.Camera} camera : The camera used for the rendering point of view.
   */
  setRenderScene(scene, camera) {
    this.scene = scene;
    this.camera = camera;
  }

  setSize(width, height) {
    if (this.renderer) {
      this.renderer.setSize(width, height);
      const _composer = this.composer;
      if (_composer) _composer.setSize(width, height);
    }
  }

  /**
   * Rendering the PostProcessor and all its passes.
   * @param  {Number} delta : The delta time between two frames.
   */
  renderPlugin(delta) {
    if (this.composer) this.composer.render(delta);
  }

  /**
   * Set the renderer to use.
   * @param {THREE.WebGLRenderer} renderer : The renderer instance.
   */
  set renderer(renderer) {
    this._renderer = renderer;
    this._initComposer();
  }

  /**
   * Get the renderer used by this PostProcessor to render.
   * @return {THREE.WebGLRenderer} The WebGLRenderer.
   */
  get renderer() {
    return this._renderer;
  }

  /**
   * Set renderTarget, this will rebuild the internal EffectComposer.
   * @param  {THREE.WebGLRenderTarget} renderTarget : The WebGLRenderTarget to use.
   */
  set renderTarget(renderTarget) {
    this._renderTarget = renderTarget;
    this._initComposer();
  }

  /**
   * Get renderTarget used by this PostProcessor to render to.
   * @return {THREE.WebGLRenderTarget} The WebGLRenderTarget.
   */
  get renderTarget() {
    return this._renderTarget;
  }

  /**
   * Set composer, by default PostProcessor instanciate its own instance of EffectComposer.
   * @param  {EffectComposer} composer : The composer instance to use.
   */
  set composer(composer) {
    this._composer = composer;
  }

  /**
   * Get composer attribute
   * @return {EffectCompost} The EffectComposer managed by this PostProcessor.
   */
  get composer() {
    return this._composer;
  }

}

export {
  PostProcessor
};
