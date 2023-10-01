#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D uSampler;
uniform vec3 uKd;
uniform vec3 uKs;
uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform float uLightIntensity;
uniform int uTextureSample;

varying highp vec2 vTextureCoord;
varying highp vec3 vFragPos;
varying highp vec3 vNormal;

#define EPS 1e-3


vec3 blinnPhong() {
  vec3 color = texture2D(uSampler, vTextureCoord).rgb;
  color = pow(color, vec3(2.2));

  vec3 ambient = 0.05 * color;

  vec3 lightDir = normalize(uLightPos);
  vec3 normal = normalize(vNormal);
  float diff = max(dot(lightDir, normal), 0.0);
  vec3 light_atten_coff =
      uLightIntensity / pow(length(uLightPos - vFragPos), 2.0);
  vec3 diffuse = diff * light_atten_coff * color;

  vec3 viewDir = normalize(uCameraPos - vFragPos);
  vec3 halfDir = normalize((lightDir + viewDir));
  float spec = pow(max(dot(halfDir, normal), 0.0), 32.0);
  vec3 specular = uKs * light_atten_coff * spec;

  vec3 radiance = (ambient + diffuse + specular);
  vec3 phongColor = pow(radiance, vec3(1.0 / 2.2));
  return phongColor;
}

float useShadowMap(sampler2D shadowMap, vec4 shadowCoord){
  vec4 depthpack =texture2D(shadowMap,shadowCoord.xy);
  float depthUnpack =unpack(depthpack);
  if(depthUnpack > shadowCoord.z)
      return 1.0;
  return 0.0;
}

float unpack(vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
    float depth =dot(rgbaDepth, bitShift) ;
    if(abs(depth)<EPS){
      depth=1.0;
    }
    return  depth;
}

void main(void) {
  float visibility;
  vec3 projCoords = vPositionFromLight.xyz / vPositionFromLight.w;
  vec3 shadowCoord = projCoords * 0.5 + 0.5;
  visibility = useShadowMap(uShadowMap, vec4(shadowCoord, 1.0));
  vec3 phongColor = blinnPhong();
  gl_FragColor = vec4(phongColor * visibility, 1.0);
}