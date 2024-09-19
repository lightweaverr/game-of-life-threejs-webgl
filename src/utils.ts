import * as THREE from 'three';

export function createDataTexture(sizes : {width: number, height: number}) {


  var size = sizes.width * sizes.height;
  var data = new Uint8Array(size);

  for (var i = 0; i < size; i++) {
    var stride = i; // * 4; changed from 4 to 1 channels to save space

    if (Math.random() < 0.5) {
      data[stride] = 255;
      // data[stride + 1] = 255;
      // data[stride + 2] = 255;
      // data[stride + 3] = 255;
    } else {
      data[stride] = 0;
      // data[stride + 1] = 0;
      // data[stride + 2] = 0;
      // data[stride + 3] = 255;
    }
  }

  // used the buffer to create a DataTexture


  var texture = new THREE.DataTexture(
    data,
    sizes.width,
    sizes.height,
    THREE.RedFormat
  );

  texture.needsUpdate = true;

  return texture;
}
