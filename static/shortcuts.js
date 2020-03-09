// Ensure Shift-Enter in a textarea submits the enclosing form.
var textareas = document.getElementsByTagName("textarea");

for (var i = 0; i < textareas.length; i++) {
  var textarea = textareas[i];
  textarea.addEventListener("keyup", function(e) {
    if (e.keyCode === 16) {
      e.preventDefault();
      textarea.closest("form").submit();
      return false;
    }
  });
}
