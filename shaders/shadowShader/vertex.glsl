attribute vec3 aVertexPosition;
attribute vec3 aNormalPosition;
attribute vec2 aTextureCoord;

uniform mat4 uLightMVP;

variying vec3 vNormal;
varing vec2 vTextureCoord;

void main(void) {
    vNormal=aNormalPosition;
    vTextureCoord=aTextureCoord;
    gl_Position=uLightMVP * vec4(aVertexPosition,1.0);
}