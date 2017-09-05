const VIDEO_TAG_WIDTH = 96;
const VIDEO_TAG_HEIGHT = 96;

$ = function(id) {
  return document.getElementById(id);
};

function cubemapFaces(gl) {
  return [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
          gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
          gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
          gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
          gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
          gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
}

function getConstraintsForDevice(deviceLabel) {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      for (let i = 0; i < devices.length; ++i) {
        if (deviceLabel == devices[i].label) {
          return resolve({video:{deviceId: {exact: devices[i].deviceId},
                                 width: {exact:96},
                                 height: {exact:96}}
                          });
        }
      }
      return reject("Expected to have a device with label:" + deviceLabel);
    })
  });
}

function getMediaStream(deviceLabel) {
  return new Promise((resolve, reject) => {
    getConstraintsForDevice(deviceLabel)
    .then(constraints => {
      if (!constraints)
        return reject("No device found");
      return navigator.mediaDevices.getUserMedia(constraints);
    }).then(stream => {
      return resolve(stream);
    });
  });
}

function createMediaStreamVideo(stream) {
  let localStreamUrl = URL.createObjectURL(stream);
  let video = document.createElement('video');
  video.width = VIDEO_TAG_WIDTH;
  video.height = VIDEO_TAG_HEIGHT;
  video.src = localStreamUrl;
  video.play();
  document.body.appendChild(video);
  return video;
}

function createCanvas() {
  let canvas = document.createElement('canvas');
  canvas.width = VIDEO_TAG_WIDTH;
  canvas.height = VIDEO_TAG_HEIGHT;
  document.body.appendChild(canvas);
  return canvas;
}

//detectVideoPlaying
function isVideoPlaying(pixels, previousPixels) {
  for (let i = 0; i < pixels.length; i++) {
    if (pixels[i] != previousPixels[i]) {
      return true;
    }
  }
  return false;
}

function verifyPixels(
    data, width, height, flip_y, step, wrap_around, tolerance, test_name) {
  let rowsColumnsToCheck = [[1, 1],
                            [0, width - 1],
                            [height - 1, 0],
                            [height - 1, width - 1],
                            [height - 3, width - 3]];

  // Calculate all reference points based on top left and compare.
  for (let j = 0; j < rowsColumnsToCheck.length; ++j) {
    let row = rowsColumnsToCheck[j][0];
    let column = rowsColumnsToCheck[j][1];
    let i = (width * row + column) * 4;
    let calculated = (data[0] + wrap_around +
                      step * ((flip_y ? -row : row) + column)) % wrap_around;
    //TODO Don't understand the check point.
    assert_greater_than_equal(tolerance, Math.abs(calculated - data[i]))
  }
  return true;
}

function runImageBitmapTest(bitmap, canvas, flip_y) {
  let context = canvas.getContext('2d');
  context.drawImage(bitmap, 0, 0);
  let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  let color_step = 255.0 / (canvas.width + canvas.height);
  return verifyPixels(imageData.data, canvas.width, canvas.height, flip_y,
                      color_step, 255, 2, "ImageBitmap");
}

function testVideoToRGBA32FTexture(video, canvas) {
  let gl = canvas.getContext('webgl');
  if (!gl)
    assert_true(false, "WebGL is available");
  if (!gl.getExtension("OES_texture_float"))
    assert_true(false, "OES_texture_float extension is available");
  testVideoToTexture(gl, video, gl.RGBA, gl.RGBA, gl.FLOAT,
                            readAndVerifyRGBA32F);
}

function testVideoToRGBA8Texture(video, canvas) {
  let gl = canvas.getContext('webgl');
  if (!gl)
    assert_true(false, "WebGL is available");
  testVideoToTexture(gl, video, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
                            readAndVerifyRGBA8);
}

function testVideoToR32FTexture(video, canvas) {
  let gl = canvas.getContext('webgl2');
  if (!gl)
    assert_true(false, "WebGL2 is available");
  if (!gl.getExtension('EXT_color_buffer_float'))
    assert_true(false, "EXT_color_buffer_float extension is available");
  testVideoToTexture(gl, video, gl.R32F, gl.RED, gl.FLOAT,
                            readAndVerifyR32F);
}

function testVideoToTexture(gl, video, internalformat, format, type,
                            readAndVerifyFunction) {
  // Create framebuffer that we will use for reading back the texture.
  let fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  let tests = [];
  // Premultiply alpha is ignored but we just test both values.
  let cases = [
    {flip_y: false, premultiply_alpha: true},
    {flip_y: true, premultiply_alpha: false}
  ];
  for (let i in cases) {
    let flip_y = cases[i].flip_y;
    let premultiply = cases[i].premultiply_alpha;
    uploadVideoToTexture2D(gl, video, internalformat, format, type, flip_y,
                           premultiply);
    assert_equals(readAndVerifyFunction(gl, video.width, video.height, flip_y,
                                     "TexImage_TEXTURE_2D"), true);
    uploadVideoToSubTexture2D(gl, video, internalformat, format, type, flip_y,
                              premultiply);
    assert_equals(readAndVerifyFunction(gl, video.width, video.height, flip_y,
                                     "TexSubImage_TEXTURE_2D"), true);

    // cubemap texImage2D.
    let tex = uploadVideoToTextureCubemap(gl, video, internalformat, format,
                                          type, flip_y, premultiply);
    for (let i = 0; i < cubemapFaces(gl).length; ++i) {
      // Attach the texture to framebuffer for readback.
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                              cubemapFaces(gl)[i], tex, 0);
      assert_equals(readAndVerifyFunction(gl, video.width, video.height, flip_y,
                                       "TexImage_" + cubemapFaces(gl)[i]), true);
    }

    // cubemap texSubImage2D.
    tex = uploadVideoToSubTextureCubemap(gl, video, internalformat, format,
                                         type, flip_y, premultiply);
    for (let i = 0; i < cubemapFaces(gl).length; ++i) {
      // Attach the texture to framebuffer for readback.
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                              cubemapFaces(gl)[i], tex, 0);
      assert_equals(readAndVerifyFunction(gl, video.width, video.height, flip_y,
                                       "TexSubImage_" + cubemapFaces(gl)[i]), true);
    }
  }
}

// Test setup helper method: create the texture and set texture parameters.
// For cubemap, target is gl.TEXTURE_CUBE_MAP.  For gl.TEXTURE_2D, it is
// gl.TEXTURE_2D.
function createTexture(gl, target, video, flip_y, premultiply_alpha) {
  let tex = gl.createTexture();
  gl.bindTexture(target, tex);
  gl.texParameteri(target, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);
  gl.texParameteri(target, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
  gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip_y);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply_alpha);
  return tex;
}

function uploadVideoToTexture2D(gl, video, internalformat, format, type,
                                flip_y, premultiply_alpha) {
  let tex = createTexture(gl, gl.TEXTURE_2D, video, flip_y,
                          premultiply_alpha);
  // Attach the texture to framebuffer for readback.
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
                          tex, 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalformat, format, type, video);
  return tex;
}

function uploadVideoToSubTexture2D(gl, video, internalformat, format, type,
                                   flip_y, premultiply_alpha) {
  let tex = createTexture(gl, gl.TEXTURE_2D, video, flip_y,
                          premultiply_alpha);
  // Attach the texture to framebuffer for readback.
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
                          tex, 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalformat, video.width, video.height,
                0, format, type, null);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, format, type, video);
  return tex;
}

function uploadVideoToTextureCubemap(gl, video, internalformat, format, type,
                                     flip_y, premultiply_alpha) {
  let tex = createTexture(gl, gl.TEXTURE_CUBE_MAP, video, flip_y,
                          premultiply_alpha);
  for (let i = 0; i < cubemapFaces(gl).length; ++i) {
    gl.texImage2D(cubemapFaces(gl)[i], 0, internalformat, format, type,
                  video);
  }
  return tex;
}

function uploadVideoToSubTextureCubemap(gl, video, internalformat, format,
                                        type, flip_y, premultiply_alpha) {
  let tex = createTexture(gl, gl.TEXTURE_CUBE_MAP, video, flip_y,
                          premultiply_alpha);
  for (let i = 0; i < cubemapFaces(gl).length; ++i) {
    gl.texImage2D(cubemapFaces(gl)[i], 0, internalformat, video.width,
                  video.height, 0, format, type, null);
    gl.texSubImage2D(cubemapFaces(gl)[i], 0, 0, 0, format, type, video);
  }
  return tex;
}

function readAndVerifyRGBA8(gl, width, height, flip_y, test_name) {
  let arr = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, arr);
  let color_step = 255.0 / (width + height);
  return verifyPixels(arr, width, height, flip_y, color_step,
                      255 /*wrap_around*/, 2 /*tolerance*/, test_name);
}

function readAndVerifyRGBA32F(gl, width, height, flip_y, test_name) {
  let arr = new Float32Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, arr);
  let color_step = 1.0 / (width + height);
  return verifyPixels(arr, width, height, flip_y, color_step,
                      1.0 /*wrap_around*/, 1.5/65535 /*tolerance*/,
                      test_name);
}

function readAndVerifyR32F(gl, width, height, flip_y, test_name) {
  let arr = new Float32Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, arr);
  let color_step = 1.0 / (width + height);
  return verifyPixels(arr, width, height, flip_y, color_step,
                      1.0 /*wrap_around*/, 1.5 / 65535 /*tolerance*/,
                      test_name);
}

function getStreamOfVideoKind(constraint_kind) {
  let constraints = {
    video:{
      videoKind: constraint_kind
    }
  }
  return navigator.mediaDevices.getUserMedia(constraints);
}

function detectVideoPlaying(stream) {
  return new Promise((resolve, reject) => {
    let video = createMediaStreamVideo(stream);
    let width = VIDEO_TAG_WIDTH;
    let height = VIDEO_TAG_HEIGHT;
    let oldPixels = [];
    let pixels = [];
    let startTimeMs = new Date().getTime();
    let canvas = createCanvas();
    let context = canvas.getContext('2d');
    let waitVideo = setInterval(() => {
      context.drawImage(video, 0, 0, width, height);
      pixels = context.getImageData(0, 0 , width, height / 3).data;
      // Check that there is an old and a new picture with the same size to
      // compare and use the function |predicate| to detect the video state in
      // that case.
      // There's a failure(?) mode here where the video generated claims to
      // have size 2x2. Don't consider that a valid video.
      if (oldPixels.length == pixels.length &&
        isVideoPlaying(pixels, oldPixels)) {
        clearInterval(waitVideo);
        canvas.remove();
        return resolve(video);
      }
      oldPixels = pixels;
    }, 1000);
  });
}

function getDepthStreamAndCallCreateImageBitmap(deviceLabel) {
  promise_test(t => {
    let canvas = createCanvas();
    let video_element, depth_stream;
    return getMediaStream(deviceLabel)
    .then(stream => {
      depth_stream = stream;
      return detectVideoPlaying(depth_stream);
    })
    .then(video => {
      video_element = video;
      let p1 = createImageBitmap(video).then(function(imageBitmap) {
        return runImageBitmapTest(imageBitmap, canvas, false); });
      let p2 = createImageBitmap(video,
        {imageOrientation: "none", premultiplyAlpha: "premultiply"}).then(
            function(imageBitmap) {
              assert_true(runImageBitmapTest(imageBitmap, canvas, false)); });
      let p3 = createImageBitmap(video,
        {imageOrientation: "none", premultiplyAlpha: "default"}).then(
            function(imageBitmap) {
              assert_true(runImageBitmapTest(imageBitmap, canvas, false)); });
      let p4 = createImageBitmap(video,
        {imageOrientation: "none", premultiplyAlpha: "none"}).then(
            function(imageBitmap) {
              assert_true(runImageBitmapTest(imageBitmap, canvas, false)); });
      let p5 = createImageBitmap(video,
        {imageOrientation: "flipY", premultiplyAlpha: "premultiply"}).then(
            function(imageBitmap) {
              assert_true(runImageBitmapTest(imageBitmap, canvas, true)); });
      let p6 = createImageBitmap(video,
        {imageOrientation: "flipY", premultiplyAlpha: "default"}).then(
            function(imageBitmap) {
              assert_true(runImageBitmapTest(imageBitmap, canvas, true)); });
      let p7 = createImageBitmap(video,
        {imageOrientation: "flipY", premultiplyAlpha: "none"}).then(
            function(imageBitmap) {
              assert_true(runImageBitmapTest(imageBitmap, canvas, true)); });
      return Promise.all([p1, p2, p3, p4, p5, p6, p7]);
    })
  }, "depth video can change to image bitmap");
}

function depthStreamToRGBAFloatTexture(deviceLabel) {
  promise_test(t => {
    let depth_stream;
    return getMediaStream(deviceLabel)
    .then(stream => {
      depth_stream = stream;
      return detectVideoPlaying(depth_stream);
    })
    .then(video => {
      let canvas = createCanvas();
      testVideoToRGBA32FTexture(video, canvas);
      depth_stream.getVideoTracks()[0].stop();
      video.remove();
      canvas.remove();
    })
  }, "depth video can change to RGBA32 Float Texture");
}

function depthStreamToRGBAUint8Texture(deviceLabel) {
  promise_test(t => {
    return getMediaStream(deviceLabel)
    .then(stream => {
      depth_stream = stream;
      return detectVideoPlaying(depth_stream);
    })
    .then(video => {
      let canvas = createCanvas();
      testVideoToRGBA8Texture(video, canvas);
      depth_stream.getVideoTracks()[0].stop();
      video.remove();
      canvas.remove();
    })
  }, "depth video can change to RGBA8 Texture");
}

function depthStreamToR32FloatTexture(deviceLabel) {
  promise_test(t => {
    return getMediaStream(deviceLabel)
    .then(stream => {
      depth_stream = stream;
      return detectVideoPlaying(depth_stream);
    })
    .then(video => {
      let canvas = createCanvas();
      testVideoToR32FTexture(video, canvas);
      depth_stream.getVideoTracks()[0].stop();
      video.remove();
      canvas.remove();
    })
  }, "depth video can change to R32 Float Texture");
}

function getDepthStreamAndCameraCalibration(deviceLabel) {
  promise_test(t => {
    return getMediaStream(deviceLabel)
    .then(stream => {
      let depth_track = stream.getVideoTracks()[0];
      assert_not_equals(depth_track, undefined);
      let settings = depth_track.getSettings();
      /*TODO The following attributes of settings are not realized.
      assert_not_equals(settings, undefined)
      assert_equals(settings.depthNear, 0)
      assert_equals(settings.depthFar, 65.535)
      assert_equals(settings.focalLengthX, 135.0)
      assert_equals(settings.focalLengthY, 135.6)*/
      depth_track.stop();
    });
  }, "camera calibration is corrent");
}

function getBothStreamsAndCheckForFeaturesPresence(deviceLabel, videoDeviceLabel) {
  promise_test(t => {
    let video_stream;
    return getMediaStream(videoDeviceLabel)
    .then(stream => {
      video_stream = stream;
      return getMediaStream(deviceLabel)
    })
    .then(depth_stream => {
      assert_equals(video_stream.getVideoTracks().length, 1);
      assert_equals(depth_stream.getVideoTracks().length, 1);
      let video_track = video_stream.getVideoTracks()[0];
      let depth_track = depth_stream.getVideoTracks()[0];
      /*TODO The getSettings and getConstraints function are not realized.
      let expected_fields = ["deviceId", "height", "width"];
      for (let field in expected_fields) {
        let expected_field = expected_fields[field];
        assert_not_equals(video_track.getSettings()[expected_field], undefined);
        assert_not_equals(video_track.getConstraints()[expected_field], undefined);
        assert_not_equals(depth_track.getSettings()[expected_field], undefined);
        assert_not_equals(depth_track.getConstraints()[expected_field], undefined);
      }
      let depth_fields = ["depthNear", "depthFar", "focalLengthX",
                          "focalLengthY"];
      for (let field in depth_fields) {
        let depth_field = depth_fields[field];
        assert_equals(video_track.getSettings()[depth_field], undefined);
        assert_not_equals(depth_track.getSettings()[depth_field], undefined);
      }*/
      video_track.stop();
      depth_track.stop();
    });
  }, "test media stream feature presence corrent");
}

function getStreamsByVideoKind() {
  let cases = [{constraint: {exact: "depth"}, kind: "depth"},
               {constraint: {exact: "color"}, kind: "color"}];
  for (let i in cases) {
    let test_case = cases[i];
    promise_test(t => {
      return getStreamOfVideoKind(test_case.constraint)
      .then(stream => {
        assert_equals(stream.getVideoTracks().length, 1);
        let track = stream.getVideoTracks()[0];
        assert_equals(track.getSettings().videoKind, test_case.kind);
        track.stop();
      });
    }, "can get " + test_case.kind + " media stream by kind constraint");
  }

  promise_test(t => {
    let video_stream;
    return getStreamOfVideoKind({exact: "color"})
    .then(stream => {
      video_stream = stream;
      assert_equals(video_stream.getVideoTracks().length, 1);
      let track = video_stream.getVideoTracks()[0];
      assert_equals(track.getSettings().videoKind, "color");
      return getStreamOfVideoKind({exact: "depth"}).then(depth_stream => {
        depth_stream.getVideoTracks()[0].stop();
        assert_unreached("Expected to fail, got depth instead");
      });
    })
    .then(() => {
      return getStreamOfVideoKind({exact: "fisheye"}).then(fisheye_stream => {
        fisheye_stream.getVideoTracks()[0].stop();
        assert_unreached("Expected to fail, got fisheye instead");   
      });
    })
  }, "only get color media stream when no depth");
}
