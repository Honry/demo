'use strict';

// Test is based on the following editor draft:
// https://w3c.github.io/mediacapture-main/archives/20170828/getusermedia.html
// https://www.w3.org/TR/2017/WD-mediacapture-depth-20170418/

// Helper function for testing dictionary fields

// This file depends on dictionary-helper.js which should
// be loaded from the main HTML file.

/*
  partial dictionary MediaTrackSupportedConstraints {
    // Apply to both depth stream track and color stream track:
    boolean videoKind = true;
    boolean focalLengthX = false;
    boolean focalLengthY = false;
    boolean principalPointX = false;
    boolean principalPointY = false;
    boolean deprojectionDistortionCoefficients = false;
    boolean projectionDistortionCoefficients = false;
    // Apply to depth stream track:
    boolean depthNear = false;
    boolean depthFar = false;
    boolean depthToVideoTransform = false;
  };
*/

function validateMediaTrackSupportedConstraints(supports) {
  assert_optional_boolean_field(supports, 'videoKind', true);
  assert_optional_boolean_field(supports, 'focalLengthX', false);
  assert_optional_boolean_field(supports, 'focalLengthY', false);
  assert_optional_boolean_field(supports, 'principalPointX', false);
  assert_optional_boolean_field(supports, 'principalPointY', false);
  assert_optional_boolean_field(supports, 'deprojectionDistortionCoefficients', false);
  assert_optional_boolean_field(supports, 'projectionDistortionCoefficients', false);
  assert_optional_boolean_field(supports, 'depthNear', false);
  assert_optional_boolean_field(supports, 'depthFar', false);
  assert_optional_boolean_field(supports, 'depthToVideoTransform', false);
}

/*
  partial dictionary MediaTrackCapabilities {
    // Apply to both depth stream track and color stream track:
    DOMString               videoKind;
    (double or DoubleRange) focalLengthX;
    (double or DoubleRange) focalLengthY;
    (double or DoubleRange) principalPointX;
    (double or DoubleRange) principalPointY;
    boolean                 deprojectionDistortionCoefficients;
    boolean                 projectionDistortionCoefficients;
    // Apply to depth stream track:
    (double or DoubleRange) depthNear;
    (double or DoubleRange) depthFar;
    boolean                 depthToVideoTransform;
  };

  dictionary DoubleRange {
    double max;
    double min;
  };
*/

function validateMediaTrackCapabilities(capabilities) {
  assert_optional_string_field(capabilities, 'videoKind');
  assert_optional_number_or_number_range_field(capabilities, 'focalLengthX');
  assert_optional_number_or_number_range_field(capabilities, 'focalLengthY');
  assert_optional_number_or_number_range_field(capabilities, 'principalPointX');
  assert_optional_number_or_number_range_field(capabilities, 'principalPointY');
  assert_optional_boolean_field(capabilities, 'deprojectionDistortionCoefficients');
  assert_optional_boolean_field(capabilities, 'projectionDistortionCoefficients');
  assert_optional_number_or_number_range_field(capabilities, 'depthNear');
  assert_optional_number_or_number_range_field(capabilities, 'depthFar');
  assert_optional_boolean_field(capabilities, 'depthToVideoTransform');
}

/*
  partial dictionary MediaTrackConstraintSet {
    // Apply to both depth stream track and color stream track:
    ConstrainDOMString videoKind;
    ConstrainDouble    focalLengthX;
    ConstrainDouble    focalLengthY;
    ConstrainDouble    principalPointX;
    ConstrainDouble    principalPointY;
    ConstrainBoolean   deprojectionDistortionCoefficients;
    ConstrainBoolean   projectionDistortionCoefficients;
    // Apply to depth stream track:
    ConstrainDouble    depthNear;
    ConstrainDouble    depthFar;
    ConstrainBoolean   depthToVideoTransform;
  };

  typedef (DOMString or sequence<DOMString> or ConstrainDOMStringParameters) ConstrainDOMString;

  dictionary ConstrainDOMStringParameters {
    (DOMString or sequence<DOMString>) exact;
    (DOMString or sequence<DOMString>) ideal;
  };

  typedef (double or ConstrainDoubleRange) ConstrainDouble;

  dictionary DoubleRange {
    double max;
    double min;
  };

  dictionary ConstrainDoubleRange : DoubleRange {
    double exact;
    double ideal;
  };

  typedef (boolean or ConstrainBooleanParameters) ConstrainBoolean;

  dictionary ConstrainBooleanParameters {
    boolean exact;
    boolean ideal;
  };

  enum VideoKindEnum {
    "color",
    "depth"
  };
*/

function validateMediaTrackConstraintSet(constraints) {
  assert_optional_constrain_string_field(constraints, 'videoKind');
  assert_optional_enum_field(constraints, 'videoKind', ['color', 'depth'])
  assert_optional_number_or_number_constrain_field(constraints, 'focalLengthX');
  assert_optional_number_or_number_constrain_field(constraints, 'focalLengthY');
  assert_optional_number_or_number_constrain_field(constraints, 'principalPointX');
  assert_optional_number_or_number_constrain_field(constraints, 'principalPointY');
  assert_optional_boolean_or_boolean_constrain_field(constraints, 'deprojectionDistortionCoefficients');
  assert_optional_boolean_or_boolean_constrain_field(constraints, 'projectionDistortionCoefficients');
  assert_optional_number_or_number_constrain_field(constraints, 'depthNear');
  assert_optional_number_or_number_constrain_field(constraints, 'depthFar');
  assert_optional_boolean_or_boolean_constrain_field(constraints, 'depthToVideoTransform');
}

/*
  partial dictionary MediaTrackSettings {
    // Apply to both depth stream track and color stream track:
    DOMString              videoKind;
    double                 focalLengthX;
    double                 focalLengthY;
    double                 principalPointX;
    double                 principalPointY;
    DistortionCoefficients deprojectionDistortionCoefficients;
    DistortionCoefficients projectionDistortionCoefficients;
    // Apply to depth stream track:
    double                 depthNear;
    double                 depthFar;
    Transformation         depthToVideoTransform;
  };

  dictionary DistortionCoefficients {
    double k1;
    double k2;
    double p1;
    double p2;
    double k3;
  };

  dictionary Transformation {
    Float32Array transformationMatrix;
    DOMString    videoDeviceId;
  };
*/

function validateDistortionCoefficients(coefficients) {
  assert_optional_number_field(coefficients, 'k1');
  assert_optional_number_field(coefficients, 'k2');
  assert_optional_number_field(coefficients, 'p1');
  assert_optional_number_field(coefficients, 'p2');
  assert_optional_number_field(coefficients, 'k3');
}

function validateTransformation(depthToVideoTransform) {
  assert_optional_array_field(depthToVideoTransform, 'transformationMatrix');
  assert_optional_string_field(depthToVideoTransform, 'videoDeviceId');
}

function validateMediaTrackSettings(settings) {
  assert_optional_string_field(settings, 'videoKind');
  assert_optional_enum_field(settings, 'videoKind', ['color', 'depth'])
  assert_optional_number_field(settings, 'focalLengthX');
  assert_optional_number_field(settings, 'focalLengthY');
  assert_optional_number_field(settings, 'principalPointX');
  assert_optional_number_field(settings, 'principalPointY');
  if (settings.deprojectionDistortionCoefficients) {
    validateDistortionCoefficients(settings.deprojectionDistortionCoefficients);
  }
  if (settings.projectionDistortionCoefficients) {
    validateDistortionCoefficients(settings.projectionDistortionCoefficients);
  }
  assert_optional_number_field(settings, 'depthNear');
  assert_optional_number_field(settings, 'depthFar');
  if (settings.depthToVideoTransform) {
    validateTransformation(settings.depthToVideoTransform);
  }
}
