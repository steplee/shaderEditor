#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 outColor;

uniform float iTime;
uniform vec4 iMouse;
uniform ivec2 iResolution;

void main() {
  outColor = vec4(0.,0., 1., 1.);
}

