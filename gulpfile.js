const { src, dest, watch } = require("gulp");
const minifyCSS = require("gulp-csso");
const concatCss = require("gulp-concat-css");
const purgecss = require("gulp-purgecss");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");
const concat = require("gulp-concat");

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
    "node_modules/semantic-ui-css/components/label.css",
    "node_modules/semantic-ui-css/components/popup.css",
    "node_modules/semantic-ui-css/components/segment.css",
    "node_modules/semantic-ui-css/components/site.css",
    "node_modules/semantic-ui-css/components/table.css",
    "static/style.css",
  ])
    .pipe(concatCss("bundle.css"))
    .pipe(
      purgecss({
        whitelist: [
          "no-such-page",
          "blockquote",
          // used for labels in emoji-summary
          "label",
          "pointing",
          // Used in markdown, but we don't have any examples in the
          // raw HTML layouts.
          "h1",
          "h2",
          "h3",
          "h4",
          // Not autodetected, presumably because of our use of handlebars?
          "dividing",
        ],
        content: ["views/**/*.html"],
      }),
    )
    .pipe(minifyCSS())
    .pipe(dest("static"));
}

function js() {
  return src([
    "node_modules/hammerjs/hammer.js",
    "./static/tapedit.js",
    "./static/shortcuts.js",
  ])
    .pipe(concat("bundle"))
    .pipe(uglify())
    .pipe(rename({ extname: ".min.js" }))
    .pipe(dest("static"));
}

exports.default = function () {
  watch(["gulpfile.js", "static/style.css"], { ignoreInitial: false }, css);
  watch(
    ["gulpfile.js", "./static/tapedit.js", "./static/shortcuts.js"],
    { ignoreInitial: false },
    js,
  );
};
