var createFBO = require("gl-fbo")
var glslify = require("glslify")
var createShader = require("gl-shader")
var createTexture = require("gl-texture2d");

console.log('app.js loaded...')

document.addEventListener('readystatechange', () => {
    if (document.readyState == 'complete') setupViewer();
});


function setupViewer() {
  // Setup Canvas
  let canvas = document.getElementById('mainCanvas');
  const gl = canvas.getContext("webgl2", {depth:false,alpha:false,antialias:false});
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }
  addCanvasCallbacks(canvas);
  addButtonCallbacks();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Setup GL
  document.shaders = {}
  document.fbos = {}
  document.texs = {}
  document.w = 640;
  document.h = 480;
  document.gl = gl;
  document.tick = 0;
  let z = -1, o = 1, d = .0;
  document.verts = Float32Array.from([
    z,z,d, 0,1,
    o,z,d, 1,1,
    o,o,d, 1,0,
    z,o,d, 0,0,
  ]);
  document.inds = Uint16Array.from([0,1,2, 2,3,0])
  gl.viewport(0,0,document.w,document.h);
  console.log(document.gl.getContextAttributes())

  document.vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, document.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, document.verts, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  document.ibo = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, document.ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, document.inds, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // Variables for uniforms.
  document.firstTime = new Date().getTime();
  document.mouseClicked = -1;
  document.mousePos = [0,0];
  document.lastClick = [0,0];
  document.channels = {};

  // Find Shaders
  /*
  toLookFor = ['main', 'bufferA', 'bufferB'];
  for (let x of toLookFor)
    fetch('http://localhost:9966/' + x)
      .then(resp => resp.text())
      .then(data => handleShaderFetch(x, data))
  */
  //const dir = window.location.substr(window.location.search('/'))
  //const dir = window.location.substr(window.location.search('/'))
  let target = window.location.pathname;
  if (target.endsWith('/')) target += 'data';
  else target += '/data';
  //fetch('http://localhost:9966/getAll')
  console.log('HOST',window.location.hostname)
  console.log('TARGET',target)
  fetch(target)
    .then(resp => resp.json())
    .then(data => handleAllDataFetch(data))

  document.start();

}
document.start = function() {
  if (! document.isPlaying)
    document.playInterval = setInterval(document.stepFrame, 100);
  document.isPlaying = true;
}
document.pause = function() {
  if (document.isPlaying) {
    clearInterval(document.playInterval);
  }
  document.isPlaying = false;
}

function addCanvasCallbacks(canvas) {
  canvas.addEventListener('mousedown', e => {
    document.mouseClicked = 1;
  });
  canvas.addEventListener('mouseup', e => {
    document.mouseClicked = -1;
  });
  canvas.addEventListener('mousemove', e => {
    if (e.x > 0) {
      document.mousePos[0] = document.lastClick[0] = e.x;
      document.mousePos[1] = document.lastClick[1] = e.y;
    } else {
      document.mousePos[0] = e.x;
      document.mousePos[1] = e.y;
    }
  });
}
function addButtonCallbacks() {
  document.getElementById('reset').addEventListener('click', function() {
    document.firstTime = new Date().getTime();
    document.tick = 0;
    document.stepFrame();
  });
  document.getElementById('play').addEventListener('click', function() {
    document.start();
  });
  document.getElementById('stop').addEventListener('click', function() {
    document.pause();
  });
}

const basicVertexSrc = `#version 300 es
precision mediump float;
in vec3 in_pos;
in vec2 in_uv;
out vec2 v_uv;
uniform int iFrame;
uniform float iTime;
void main() {
  gl_Position = vec4(in_pos, 1.0);
  gl_PointSize = 20.;
  v_uv = in_uv;
}`

function handleAllDataFetch(data) {
  // Shaders
  let shaders = data.shaders;
  for (let [name,src] of Object.entries(shaders)) {
    handleShaderFetch(name,src);
  }

  // Mappings
  /*
  let channels = data.channels;
  for (let [name,map] of Object.entries(channels)) {
    document.channels[name] = map;
  }
  */
}

function handleShaderFetch(name, data) {
  if (data.startsWith('No code')) return;

  console.log('fetched ' + data);

  // Compile Shaders
  let makeTup = (t,n) => { return {type: t, name: n} }
  //let attribs = [makeTup(
  document.shaders[name] = createShader(document.gl, basicVertexSrc, data,
    [
      makeTup('sampler2D', 'bufferA'),
      makeTup('sampler2D', 'bufferB'),
      makeTup('float', 'iFrame'),
      makeTup('float', 'iTime'),
      makeTup('vec4', 'iMouse'),
      makeTup('ivec2', 'iResolution')],
    [
      makeTup('vec2', 'in_uv'),
      makeTup('vec3', 'in_pos')]);

  // Setup Buffers
  // Each buffer except main gets two FBOs and two textures, so that we can ping-pong.
  if (name == 'main') {
  } else {
    /*
    document.fbos[name] = [ createFBO(document.gl, [document.w,document.h]),
                            createFBO(document.gl, [document.w,document.h]) ];
    document.texs[name] = [ createTexture(document.gl, [document.w,document.h], document.gl.RGBA, document.gl.FLOAT32),
                            createTexture(document.gl, [document.w,document.h], document.gl.RGBA, document.gl.FLOAT32) ];
    */
    document.fbos[name] = [ createFBO(document.gl, [document.w,document.h], {'preferFloat': true}),
                            createFBO(document.gl, [document.w,document.h], {'preferFloat': true}) ];
    document.texs[name] = [ document.fbos[name][0].color[0], document.fbos[name][1].color[0] ];
  }
  // Fin.
}

document.renderToTexture = function(name) {
  let tick = document.tick;
  let I = tick % 2, J = 1 - (tick % 2);

  // TODO: Read mapping of channels to buffers, and set the uniforms correctly.

  document.fbos[name][I].bind();
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

}

document.fullScreenQuad = function(shader) {
  let gl = document.gl;

  shader.bind();
  if (shader.uniforms.iResolution !== undefined)
    shader.uniforms.iResolution = document.iresolution;
  if (shader.uniforms.iMouse !== undefined)
    shader.uniforms.iMouse = document.imouse;
  if (shader.uniforms.iFrame !== undefined)
    shader.uniforms.iFrame = document.tick;
  if (shader.uniforms.iTime !== undefined)
    shader.uniforms.iTime = document.time

  if (shader.uniforms.__lookupGetter__('bufferA')) {
    shader.uniforms.bufferA = 1
    //console.log('setting tex', shader.uniforms.bufferA, document.texs['bufferA'][1 - (document.tick%2)].handle);
    gl.activeTexture(gl.TEXTURE0 + shader.uniforms.bufferA)
    gl.bindTexture(gl.TEXTURE_2D, document.texs['bufferA'][1 - (document.tick%2)].handle);
  }
  if (shader.uniforms.__lookupGetter__('bufferB')) {
    shader.uniforms.bufferB = 2
    gl.activeTexture(gl.TEXTURE0 + shader.uniforms.bufferB)
    gl.bindTexture(gl.TEXTURE_2D, document.texs['bufferB'][1 - (document.tick%2)].id);
  }


  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, document.ibo);
  gl.bindBuffer(gl.ARRAY_BUFFER, document.vbo);
  //shader.attributes.in_pos.pointer(gl.FLOAT, false, 5*4, 0)
  //shader.attributes.in_uv.pointer(gl.FLOAT, false, 5*4, 3*4)
  gl.enableVertexAttribArray(shader.attributes.in_pos.location)
  gl.enableVertexAttribArray(shader.attributes.in_uv.location)
  gl.vertexAttribPointer(shader.attributes.in_pos.location, 3, gl.FLOAT, false, 5*4, 0);
  gl.vertexAttribPointer(shader.attributes.in_uv.location,  2, gl.FLOAT, false, 5*4, 3*4);

  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  gl.disableVertexAttribArray(shader.attributes.in_pos.location)
  gl.disableVertexAttribArray(shader.attributes.in_uv.location)
  gl.useProgram(null)

  for (let i=0; i<5; i++) {
    gl.activeTexture(gl.TEXTURE0 + i)
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

document.stepFrame = function () {
  // Setup variables
  document.tick = document.tick + 1;
  document.time = (new Date().getTime() - document.firstTime) * .001
  document.imouse = [
      document.mousePos[0], document.mousePos[1],
      document.mouseClicked*document.lastClick[0], document.mouseClicked*document.lastClick[1]];
  document.iresolution = [document.w,document.h];
  let gl = document.gl;
  gl.disable(gl.DEPTH_TEST)
  gl.disable(gl.CULL_FACE)
  gl.enable(gl.BLEND)
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // TODO Handle channel inputs and such.

  // Run render per buffer
  const tick = document.tick;
  for (let [name,fbo] of Object.entries(document.fbos)) {
    let I = tick % 2, J = 1 - (tick % 2);

    document.fbos[name][I].bind();
    console.log('binding fbo', name, 'parity',I);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    document.fullScreenQuad(document.shaders[name])
  }

  // Run render for main, with default fbo
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  document.fullScreenQuad(document.shaders.main)
}
