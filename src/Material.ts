import { PhongVertexShader, PhongFragmentShader, LightCubeVertexShader, LightCubeFragmentShader } from './loader';

export interface ShaderVar {
  type: string,
  value: any
}

export class Material {
  uniform_keys: string[] = []
  attibute_keys: string[] = []
  uniforms: { [key: string]: ShaderVar }
  attribs: string[]
  vsSrc: string = ""
  fsSrc: string = ""
  constructor(uniforms: { [key: string]: ShaderVar }, attribs: string[], vsSrc: string, fsSrc: string) {
    this.uniform_keys = ['uModelMatrix', 'uViewMatrix', 'uProjectionMatrix', 'uCameraPos', 'uLightPos'];
    this.uniform_keys.push(...Object.keys(uniforms));
    this.attibute_keys.push(...Object.keys(attribs));
    this.uniforms = uniforms;
    this.attribs = attribs;
    this.fsSrc = fsSrc;
    this.vsSrc = vsSrc;
  }
}

export class PhongMaterial extends Material {
  constructor(color: number[], colorMap: HTMLImageElement, specular: number[], intensity: number) {
    let textureSample = 0;

    if (colorMap != null) {
      textureSample = 1;
      super({
        'uTextureSample': { type: '1i', value: textureSample },
        'uSampler': { type: 'texture', value: colorMap },
        'uKd': { type: '3fv', value: color },
        'uKs': { type: '3fv', value: specular },
        'uLightIntensity': { type: '1f', value: intensity }
      }, [], PhongVertexShader, PhongFragmentShader);
    } else {
      //console.log(color);
      super({
        'uTextureSample': { type: '1i', value: textureSample },
        'uKd': { type: '3fv', value: color },
        'uKs': { type: '3fv', value: specular },
        'uLightIntensity': { type: '1f', value: intensity }
      }, [], PhongVertexShader, PhongFragmentShader);
    }

  }
}

export class EmissiveMaterial extends Material {
  intensity: number
  color: number[]
  constructor(lightIntensity: number, lightColor: number[]) {
    super({
      'uLigIntensity': { type: '1f', value: lightIntensity },
      'uLightColor': { type: '3fv', value: lightColor }
    }, [], LightCubeVertexShader, LightCubeFragmentShader);

    this.intensity = lightIntensity;
    this.color = lightColor;
  }
}
