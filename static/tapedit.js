/* Navigate to the edit URL if double clicking or double tapping on
 * the page title. */

/* This is run client side, so target a wide range of older
 * browsers. */
/* eslint-env browser */
/* eslint no-var: "off", prefer-arrow-callback: "off" */
/* global Hammer */
var headers = document.getElementsByTagName("h1");

// Newer browsers support .forEach on NodeList, as well as .forEach,
// but an old fashioned loop covers everything.
// https://developer.mozilla.org/en-US/docs/Web/API/NodeList
for (var i = 0; i < headers.length; i++) {
  var header = headers[i];
  if (header.hasAttribute("data-edit-url")) {
    var url = header.getAttribute("data-edit-url");
    var h = new Hammer(header);
    h.on("doubletap", function(_ev) {
      window.location.href = url;
    });
  }
}
