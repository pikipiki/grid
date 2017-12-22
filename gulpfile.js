const gulp         = require('gulp');
const sass         = require('gulp-sass');
const browserSync  = require('browser-sync').create();
const concat       = require('gulp-concat');
const babel        = require('gulp-babel');
const inject       = require('gulp-inject-string');
const rename       = require('gulp-rename');
const runSequence  = require('run-sequence');
const del          = require('del');
const autoprefixer = require('gulp-autoprefixer');
const prompt       = require('gulp-prompt');
const replace      = require('gulp-string-replace');
const sassLint     = require('gulp-sass-lint');
const plumber      = require('gulp-plumber');
const sourcemaps   = require('gulp-sourcemaps');
const uglify       = require('gulp-uglify');

const root         = './src'
const dist         = './dist'
const projectName  = 'apps'
const paths        = {
  modules   : [
    'magnific-popup/dist/jquery.magnific-popup.js'
  ],  
  myJsFiles : [
    // 'json.js',
    // '**/*.js'
  ],
  samsungOldAssetsPath: '//image.samsung.com/uk/apps_great/',
  samsungNewAssetsPath: `//images.samsung.com/is/image/samsung/p5/fr/${projectName}/`,

  css       : `${root}/css/**/*.css`,
  scss      : `${root}/scss/**/*.scss`,
  js        : `${root}/js/**/*.js`,
  libJs     : `${root}/js/lib/*.js`,
  html      : `${root}/**/*.html `,
  static    : [
    `${root}/images/**/*`,
    `${root}/fonts/**/*`,
    `${root}/footer.html`,
    `${root}/header.html`
  ],
  allFiles   : [
    `${dist}/header.html`,
    `${dist}/css/.tmp/cssWithTag.css`,
    `${dist}/html/indexWithBodyTag.html`,
    `${dist}/js/.tmp/bundleVendorWithTag.js`,
    `${dist}/footer.html`,
  ],
  prod       : [
    `${dist}/header.html`,
    `${dist}/css/.tmp/cssWithTag.css`,
    `${dist}/html/index.html`,
    `${dist}/js/.tmp/bundleVendorWithTag.js`,
    `${dist}/footer.html`,
  ],
  compiledJs : [
  `${dist}/js/vendor.js`,
  `${dist}/js/bundle.js`
  ],
  compiledCss: `${dist}/css/style.css`
}
const JsFullPaths = paths.myJsFiles.map(path => {
  return `${root}/js/${path}`
});
const ModulesFullPaths = paths.modules.map(path => {
  return `./node_modules/${path}`
});

gulp.task('clean', cb => del(`${dist}/**/*`, cb));

gulp.task('cleanTmp', cb => del(
  [
    `${dist}/**/.tmp`, 
    `${dist}/**/header.html`, 
    `${dist}/**/footer.html`,
  ],
  cb
));

gulp.task('sass', () => {
  return gulp.src(paths.scss)
    .pipe(sourcemaps.init())
    // .pipe(plumber())
    .pipe(sassLint())
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError())
    .pipe(sass())
    // .pipe(sass({outputStyle: 'compressed'}))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(`${dist}/css`))
    .pipe(browserSync.stream())
})

gulp.task('minJs', () => {
  return gulp.src(
    [
      `!${paths.libJs}`,
      paths.js
    ])
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(concat('bundle.js'))
    // .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(`${dist}/js`))
})

gulp.task('htmlTag', () => {
  return gulp.src(paths.html)
    .pipe(inject.prepend(
      '<body>\n'
    ))
    .pipe(inject.append(
      '\n</body>'
    ))
    .pipe(rename('indexWithBodyTag.html'))
    .pipe(gulp.dest(`${dist}/html`))
})

gulp.task('copyHtml', () => {
  return gulp.src(paths.html)
    .pipe(gulp.dest(`${dist}/html`))
})

gulp.task('styleTag', ['sass'], () => {
  return gulp.src(paths.compiledCss)
    .pipe(inject.prepend(
      '<style>\n'
    ))
    .pipe(inject.append(
      '\n</style>'
    ))
    .pipe(rename('cssWithTag.css'))
    .pipe(gulp.dest(`${dist}/css/.tmp`))
})

gulp.task('scriptTag', ['minJs', 'sass', 'modules'], () => {
  return gulp.src(paths.compiledJs)
    .pipe(concat('bundleVendor.js'))
    .pipe(gulp.dest(`${dist}/js`))
    .pipe(inject.prepend(
      '<script>\n'
    ))
    .pipe(inject.append(
      '\n</script>'
    ))
    .pipe(rename('bundleVendorWithTag.js'))
    .pipe(gulp.dest(`${dist}/js/.tmp`))
})

gulp.task('serve', ['build'], () => {
  browserSync.init({
    files: [`${dist}/**`],
    injectChanges: true,
    server: {
      baseDir: dist
    }
  })
})

gulp.task('watch', ['serve'], () => {
  gulp.watch(
    [
      paths.scss, 
      paths.js, 
      paths.html, 
    ], 
    [
      'build'
    ]
  );
})

gulp.task('copyStatic', () => {
  gulp.src(paths.static, { base: 'src' })
    .pipe(gulp.dest(dist));
})

gulp.task('copyLibCss', () => {
  gulp.src(paths.libCss)
    .pipe(gulp.dest(`${dist}/css`));
})

gulp.task('modules', () => {
  gulp.src([
      `${root}/js/lib/jquery-2.2.4.min.js`,
      ...ModulesFullPaths,
      paths.libJs
    ])
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(`${dist}/js`))
})

gulp.task('singleFile', () => {
  return gulp.src(paths.allFiles)
    .pipe(concat('index.html'))
    .pipe(gulp.dest(`${dist}/`))
})

gulp.task('singleFileProd', () => {
  return gulp.src(paths.prod)
    .pipe(concat('index.html'))
    .pipe(gulp.dest(`${dist}/`))
})

gulp.task('build', (cb) => {
  runSequence(
    ['scriptTag', 'htmlTag', 'styleTag'],
    'singleFile',
    cb)
})

gulp.task('prod', (cb) => {
  runSequence(
    'clean',
    ['scriptTag', 'copyHtml', 'styleTag', 'copyStatic'],
    'singleFileProd',
    'cleanTmp',
    'changeImgPath',
    cb)
})

gulp.task('changeImgPath', () => {
  return gulp.src('dist/**/*.html')
    // .pipe(replace(paths.samsungOldAssetsPath, paths.samsungNewAssetsPath))
    .pipe(replace(/\.png/g, '.png?$ORIGIN_PNG$'))
    .pipe(replace(/\.jpg/g, '.jpg?$ORIGIN_JPG$'))
    .pipe(replace(/\.gif/g, '.gif?$ORIGIN_GIF$'))
    .pipe(gulp.dest('dist'))
})

gulp.task('default', [
  'copyStatic',
  'build',
  'watch',
  'serve'
])