import { PhongVertexShader, PhongFragmentShader, LightCubeVertexShader, LightCubeFragmentShader } from './loader';

export interface ShaderVar {
  type: string,
  value: any
}

export class Material {
  uniforms: { [key: string]: ShaderVar }
  vsSrc: string = ""
  fsSrc: string = ""
  constructor(uniforms: { [key: string]: ShaderVar }, vsSrc: string, fsSrc: string) {
    this.uniforms = uniforms;
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
        'uModelMatrix': { type: 'matrix4fv', value: undefined },
        'uViewMatrix': { type: 'matrix4fv', value: undefined },
        'uCameraPos': { type: '3fv', value: undefined },
        'uLightPos': { type: '3fv', value: undefined },
        'uProjectionMatrix': { type: 'matrix4fv', value: undefined },
        'uTextureSample': { type: '1i', value: textureSample },
        'uSampler': { type: 'texture', value: colorMap },
        'uKd': { type: '3fv', value: color },
        'uKs': { type: '3fv', value: specular },
        'uLightIntensity': { type: '1f', value: intensity }
      }, PhongVertexShader, PhongFragmentShader);
    } else {
      //console.log(color);
      super({
        'uModelMatrix': { type: 'matrix4fv', value: undefined },
        'uViewMatrix': { type: 'matrix4fv', value: undefined },
        'uProjectionMatrix': { type: 'matrix4fv', value: undefined },
        'uCameraPos': { type: '3fv', value: undefined },
        'uLightPos': { type: '3fv', value: undefined },
        'uTextureSample': { type: '1i', value: textureSample },
        'uKd': { type: '3fv', value: color },
        'uKs': { type: '3fv', value: specular },
        'uLightIntensity': { type: '1f', value: intensity }
      }, PhongVertexShader, PhongFragmentShader);
    }

  }
}

export class EmissiveMaterial extends Material {
  intensity: number
  color: number[]
  constructor(lightIntensity: number, lightColor: number[]) {
    super({
      'uModelMatrix': { type: 'matrix4fv', value: undefined },
      'uViewMatrix': { type: 'matrix4fv', value: undefined },
      'uProjectionMatrix': { type: 'matrix4fv', value: undefined },
      'uCameraPos': { type: '3fv', value: undefined },
      'uLightPos': { type: '3fv', value: undefined },
      'uLigIntensity': { type: '1f', value: lightIntensity },
      'uLightColor': { type: '3fv', value: lightColor }
    }, LightCubeVertexShader, LightCubeFragmentShader);

    this.intensity = lightIntensity;
    this.color = lightColor;
  }
}
