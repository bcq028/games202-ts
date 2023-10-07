attribute vec3 aVertexPosition;

uniform mat4 uLightMVP;

void main(void) {
  gl_Position = uLightMVP * vec4(aVertexPosition, 1.0);
}