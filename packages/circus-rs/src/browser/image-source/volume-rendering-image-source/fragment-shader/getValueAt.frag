/**
 * Fetches the pixel value at the specified position.
 * Arguments must be all integer (fract(x) == 0.0, etc)
 */
vec2 getValueAt(float x, float y, float z)
{
  float sliceColNo = mod(z, uSliceGridSize[0]);
  float sliceRowNo = floor(z / uSliceGridSize[0]);

  float s = x / uTextureSize[0] + sliceColNo / uSliceGridSize[0];
  float t = y / uTextureSize[1] + sliceRowNo / uSliceGridSize[1];

  vec4 dataTexel = texture2D(uVolumeTextureSampler, vec2(s,t));
  float texelValue = floor(dataTexel.r * 255.0) * 256.0 + floor(dataTexel.g * 255.0);
  dataTexel.b =  floor(dataTexel.b * 255.0);

  // Check If the voxel is masked
  return vec2(texelValue, dataTexel.b);
}
