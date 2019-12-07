const { src, dest } = require("gulp");
const minifyCSS = require("gulp-csso");
const concatCss = require("gulp-concat-css");

function css() {
  return src([
    "node_modules/semantic-ui-css/components/reset.css",
    "node_modules/semantic-ui-css/components/button.css",
    "node_modules/semantic-ui-css/components/container.css",
    "node_modules/semantic-ui-css/components/divider.css",
    "node_modules/semantic-ui-css/components/form.css",
    "node_modules/semantic-ui-css/components/grid.css",
    "node_modules/semantic-ui-css/components/header.css",
    "node_modules/semantic-ui-css/components/input.css",
    "node_modules/semantic-ui-css/components/item.css",
    "node_modules/semantic-ui-css/components/site.css"
  ])
    .pipe(concatCss("bundle.css"))
    .pipe(minifyCSS())
    .pipe(dest("static"));
}

exports.default = css;
