/* eslint-env browser */
/* eslint no-var: "off", prefer-arrow-callback: "off" */

// Ensure Shift-Enter in a textarea submits the enclosing form.
var textareas = document.getElementsByTagName("textarea");

for (var i = 0; i < textareas.length; i++) {
  var textarea = textareas[i];
  textarea.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      textarea.closest("form").submit();
      return false;
    }
  });
}
