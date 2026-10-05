const NodeEnv = require('jest-environment-node').TestEnvironment;

module.exports = class CustomReactNativeEnv extends NodeEnv {
  customExportConditions = ['require', 'react-native'];

  constructor(config, context) {
    super(config, context);

    // Capture Node's real WHATWG primitives before React Native / Expo polyfills overwrite them
    this.nativeGlobals = {
      fetch: this.global.fetch,
      Headers: this.global.Headers,
      Request: this.global.Request,
      Response: this.global.Response,
      FormData: this.global.FormData,
      ReadableStream: this.global.ReadableStream,
      TransformStream: this.global.TransformStream,
      WritableStream: this.global.WritableStream,
      TextEncoder: this.global.TextEncoder,
      TextDecoder: this.global.TextDecoder,
    };
    this.global.__NATIVE_GLOBALS__ = this.nativeGlobals;
  }

  async setup() {
    await super.setup();
    this.global.__NATIVE_GLOBALS__ = this.nativeGlobals;
  }
};
