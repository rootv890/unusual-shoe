/**
 * Full-screen textured quad shader
 */

const fbm = /* glsl */ `#define NUM_OCTAVES 5

float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}


float fbm(vec3 x) {
	float v = 0.0;
	float a = 0.5;
	vec3 shift = vec3(100);
	for (int i = 0; i < NUM_OCTAVES; ++i) {
		v += a * noise(x);
		x = x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

#pragma glslify: export(fbm)`;

export const NoiseShader = {
  name: "NoiseShader",

  uniforms: {
    tDiffuse: { value: null },
    opacity: { value: 1.0 },
    time: { value: 0.0 },
    effect: { value: 0.0 },
    aspectRatio: { value: 1.0 },
  },

  vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `

		uniform float opacity;

		uniform float time;

		uniform float effect;

		uniform float aspectRatio;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		// FBM
		${fbm}

		// Distoration

		void main() {
			float dSize=  0.1;
			float dAmount =  50.0;


			vec2 distortion = effect *  vec2(
								   mix(1.0 * dSize, dSize, fbm(vec3(vUv.x, vUv.y, time* 0.01)* dAmount)),
								   mix(-1.0 * dSize*aspectRatio, dSize*aspectRatio, fbm(vec3(vUv.x, vUv.y,  time* 0.01)* dAmount))
								);
			vec4 texel = texture2D( tDiffuse, vUv + distortion);
			gl_FragColor = texel * opacity;
		}`,
};
