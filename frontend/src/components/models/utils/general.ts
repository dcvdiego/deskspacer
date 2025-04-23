export const isTouchDevice = () =>
  'ontouchstart' in window || navigator.maxTouchPoints > 0;
//  this is for IE10 which will be unsupported for this kind of app anyway
//  ||
//  (navigator.msMaxTouchPoints > 0));
