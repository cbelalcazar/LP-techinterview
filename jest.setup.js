import '@testing-library/jest-dom'

if (typeof global.Request === 'undefined') {
  global.Request = globalThis.Request;
  global.Response = globalThis.Response;
  global.Headers = globalThis.Headers;
  global.FormData = globalThis.FormData;
  global.File = globalThis.File;
}
