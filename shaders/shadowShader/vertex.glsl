attribute vec3 aVertexPosition;
attribute vec3 aNormalPosition;
attribute vec2 aTextureCoord;

uniform mat4 uLightMVP;

void main(void) {
  gl_Position = uLightMVP * vec4(aVertexPosition, 1.0);
}