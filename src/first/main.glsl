#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 outColor;

uniform float iTime;
uniform vec4 iMouse;
uniform ivec2 iResolution;

uniform sampler2D bufferA;

void main() {
  vec2 fragCoord = v_uv * vec2(iResolution);
  float d = length(iMouse.xy - fragCoord) * .01;
  outColor = vec4(sin(v_uv.y+iTime*4.), sin(v_uv.x+iTime), d, 1.);

  if (v_uv.x < .5) outColor = texture(bufferA, v_uv);
}
