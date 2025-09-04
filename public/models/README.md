# Face-API.js Models

This directory should contain the model files required for `face-api.js` to function. The application will not be able to perform face detection or recognition without them.

## Required Files

You need to download the model files and place them in this directory. Each model consists of a `.json` manifest file and a binary `.weights` file.

The required models are:
- `tiny_face_detector_model`
- `face_landmark_68_model`
- `face_recognition_model`
- `face_expression_model` (Used in the check-in form)

This means you should have the following files in this directory:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model.weights`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model.weights`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model.weights`
- `face_expression_model-weights_manifest.json`
- `face_expression_model.weights`

## Where to get them?

These files are part of the `face-api.js` library's assets. You can usually find them in the library's official GitHub repository. Search for "face-api.js models" to find the source.
