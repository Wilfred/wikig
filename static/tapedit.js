var headers = document.getElementsByTagName("h1");

console.log(headers);

for (var header of headers) {
  if (header.hasAttribute("data-edit-url")) {
    var url = header.getAttribute("data-edit-url");
    var h = new Hammer(header);
    h.on("doubletap", function(ev) {
      window.location.href = url;
    });
  }
}
