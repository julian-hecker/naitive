const { Platform } = require("react-native");

// Polyfill for Symbol.asyncIterator
// https://www.npmjs.com/package/@azure/core-asynciterator-polyfill
if (typeof Symbol === undefined || !Symbol.asyncIterator) {
  Symbol.asyncIterator = Symbol.for("Symbol.asyncIterator");
}

// btoa, atob (not used)
// require("react-native-polyfill-globals/src/base64").polyfill();
// used to decode uint8array to string
require("react-native-polyfill-globals/src/encoding").polyfill();
// used by llm response for streaming
require("react-native-polyfill-globals/src/readable-stream").polyfill();
// required to make calls to the correct url
require("react-native-polyfill-globals/src/url").polyfill();
// getRandomValues required for llm calls
require("react-native-polyfill-globals/src/crypto").polyfill();
// native fetch doesn't have response.body. this polyfills it, but breaks web
Platform.OS !== "web" && require("react-native-polyfill-globals/src/fetch").polyfill();

// // ReadableStream Async Iterator Polyfill
// // https://bugs.chromium.org/p/chromium/issues/detail?id=929585
// if (ReadableStream.prototype[Symbol.asyncIterator]) {
//   ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
//     const reader = this.getReader();
//     try {
//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) return;
//         yield value;
//       }
//     } finally {
//       reader.releaseLock();
//     }
//   };
// }
