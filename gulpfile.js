const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

// node
const path = require('path');
const del = require('del');
const fs = require('fs');

// gulp
const gulp = require(`gulp`);
const watch = require('gulp-watch');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require(`gulp-plumber`);

// browserSync
const server = require(`browser-sync`).create();
const reload = server.reload;

// markup
const pug = require('gulp-pug');
const data = require('gulp-data');

// styles
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const postcssPresetEnv = require('postcss-preset-env');
const cssnano = require('cssnano');
const gulpStylelint = require('gulp-stylelint');
const sass = require('gulp-sass');
const cssImport = require('gulp-cssimport');
const webpInCSS = require('webp-in-css/plugin');
const purgecss = require('gulp-purgecss');
sass.compiler = require('node-sass');

// scripts
const webpackStream = require(`webpack-stream`);
const webpackConfigMain = require(`./webpack.main.js`);
const webpackConfigVendor = require(`./webpack.vendor.js`);

// images
const imagemin = require(`gulp-imagemin`);
const webp = require('gulp-webp');

const paths = {
  src: {
    root: path.join(__dirname, 'source'),
    templates: path.join(__dirname, 'source', 'templates'),
    data: path.join(__dirname, 'source', 'data'),
    js: path.join(__dirname, 'source', 'js'),
    css: path.join(__dirname, 'source', 'sass'),
    images: path.join(__dirname, 'source', 'images'),
  },
  dist: {
    root: path.join(__dirname, 'build'),
    js: path.join(__dirname, 'build', 'js'),
    css: path.join(__dirname, 'build', 'css'),
    images: path.join(__dirname, 'build', 'images'),
  },
};

// markup
const templating = () => {
  return gulp
    .src(path.join(paths.src.templates, '*.pug'))
    .pipe(
      plumber({
        handleError: err => {
          console.log(err);
          this.emit('end');
        },
      })
    )
    .pipe(
      data(file => {
        return JSON.parse(
          fs.readFileSync(
            path.join(
              paths.src.data,
              `${path.basename(file.path).replace(/\.[^/.]+$/, '')}.json`
            )
          )
        );
      })
    )
    .pipe(
      pug({
        doctype: 'html',
        pretty: true,
      })
    )
    .pipe(gulp.dest(paths.dist.root))
    .pipe(server.stream());
};

// styles
const postcssPlugins = [
  postcssPresetEnv({
    stage: 0,
    autoprefixer: false,
    features: {
      block_reusable: true,
    },
  }),
  webpInCSS({
    webpClass: 'is-webp-supported-true',
    noWebpClass: 'is-webp-supported-false',
  }),
  require('postcss-join-transitions')
];

if (isProd) {
  postcssPlugins.push(
    cssnano({
      presets: [
        'default',
        {
          discardComments: {
            removeAll: true,
          },
        },
      ],
    }),
    autoprefixer()
  );
}

const styles = () => {
  let sassStream;

  if (isDev) {
    sassStream = gulp
      .src(path.join(paths.src.css, 'style.scss'))
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      .pipe(cssImport())
      .pipe(concat('style.min.css'))
      .pipe(postcss(postcssPlugins))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.dist.css))
      .pipe(server.stream());
  } else {
    sassStream = gulp
      .src(path.join(paths.src.css, 'style.scss'))
      .pipe(sass().on('error', sass.logError))
      .pipe(cssImport())
      .pipe(concat('style.min.css'))
      .pipe(postcss(postcssPlugins))
      .pipe(gulp.dest(paths.dist.css))
      .pipe(server.stream());
  }

  return sassStream;
};

const stylelint = () => {
  const info = {
    src: [
      path.join(paths.src.css, '**', '*.scss'),
      '!source/sass/vendor/**/*.scss',
    ],
  };
  return gulp.src(info.src).pipe(
    gulpStylelint({
      failAfterError: false,
      reporters: [{ formatter: 'string', console: true }],
    })
  );
};

const purgeStyles = () => {
  return gulp
    .src(path.join(paths.dist.css, 'style.min.css'))
    .pipe(
      purgecss({
        content: [
          path.join(paths.dist.root, 'index.html'),
          path.join(paths.dist.js, '*.js'),
        ],
        safelist: [
          'focus-visible',
          'is-webp-supported-true',
          'is-webp-supported-false',
        ],
      })
    )
    .pipe(gulp.dest(paths.dist.css));
};

// scripts
const scriptMain = () => {
  return gulp
    .src(path.join(paths.src.js, 'core', 'main.js'))
    .pipe(webpackStream(webpackConfigMain))
    .pipe(gulp.dest(paths.dist.js))
    .pipe(server.stream());
};

const scriptVendor = () => {
  return gulp
    .src(path.join(paths.src.js, 'vendor', 'vendor.js'))
    .pipe(webpackStream(webpackConfigVendor))
    .pipe(gulp.dest(paths.dist.js))
    .pipe(server.stream());
};

// copy
const copy = () => {
  const targets = [];

  if (isDev) {
    targets.push(path.join(paths.src.images, '**', '*'));
  }

  return gulp
    .src(targets, {
      base: `source`,
    })
    .pipe(gulp.dest('build'));
};

const selectedCopy = targets => {
  return gulp
    .src(targets, {
      base: `source`,
    })
    .pipe(gulp.dest('build'));
};

// images
const minifyImages = () => {
  return gulp
    .src(path.join(paths.src.images, '**', '*'))
    .pipe(
      imagemin([
        imagemin.optipng({ optimizationLevel: 3 }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
      ])
    )
    .pipe(gulp.dest(paths.dist.images));
};

const convertToWebp = () => {
  return gulp
    .src(path.join(paths.src.images, '**', '*'))
    .pipe(
      webp({
        method: isDev ? 0 : 6,
        nearLossless: isDev ? 100 : 75,
      })
    )
    .pipe(gulp.dest(paths.dist.images));
};

// clean
const clean = () => {
  const files = [
    path.join(paths.dist.js, 'main.js'),
    path.join(paths.dist.js, 'vendor.min.js'),
    path.join(paths.dist.css, 'style.min.css'),
    path.join(paths.dist.css, 'style.min.css.map'),
    path.join(paths.dist.images, '*'),
    path.join(paths.dist.root, '*.html'),
  ];

  return del(files);
};

const selectedClean = files => {
  return del(files);
};

// server
const watchFiles = () => {
  server.init({
    server: {
      baseDir: './build',
      index: 'index.html',
      injectChanges: true,
    },
    open: false,
    ghostMode: false,
    notify: false,
  });

  watch(
    './source/js/core/**/*.js',
    gulp.series(
      selectedClean.bind(this, path.join(paths.dist.js, 'main.js')),
      scriptMain
    )
  );

  watch(
    './source/js/vendor/**/*.js',
    gulp.series(
      selectedClean.bind(this, path.join(paths.dist.js, 'vendor.min.js')),
      scriptVendor
    )
  );

  watch(
    './source/sass/**/*',
    gulp.series(
      selectedClean.bind(this, [
        path.join(paths.dist.css, 'style.min.css'),
        path.join(paths.dist.css, 'style.min.css.map'),
      ]),
      stylelint,
      styles
    )
  );

  watch('./.stylelintrc', gulp.series(stylelint));

  watch(
    ['./source/templates/**/*', './source/data/**/*', './source/svg/**/*'],
    gulp.series(
      selectedClean.bind(this, path.join(paths.dist.root, '*.html')),
      templating
    )
  );

  watch(
    './source/images/**/*',
    gulp.series(
      selectedClean.bind(this, path.join(paths.dist.images, '*')),
      selectedCopy.bind(this, path.join(paths.src.images, '**', '*')),
      convertToWebp
    )
  );
};

const liveReload = () => {
  watch(
    [
      './build/*.html',
      './build/js/*.js',
      './build/fonts/**/*',
      './build/images/**/*',
      './build/videos/**/*',
      './build/favicons/**/*',
    ],
    gulp.series(reload)
  );
};

const otherTasks = [];

if (isDev) {
  otherTasks.push(
    convertToWebp,
    templating,
    scriptVendor,
    scriptMain,
    styles,
    stylelint,
    copy
  );
} else {
  otherTasks.push(templating, scriptVendor, scriptMain, styles);
}

const baseTask = gulp.series(clean, gulp.parallel(...otherTasks));

const build = gulp.series(
  baseTask,
  purgeStyles,
  gulp.parallel(minifyImages, convertToWebp)
);

const dev = gulp.series(baseTask, watchFiles, liveReload);

const test = gulp.series(
  baseTask,
  purgeStyles,
  convertToWebp,
  watchFiles,
  liveReload
);

exports.start = dev;
exports.build = build;
exports.test = test;

const buildStyles = gulp.series(
  selectedClean.bind(this, [
    path.join(paths.dist.css, 'style.min.css'),
    path.join(paths.dist.css, 'style.min.css.map'),
  ]),
  styles,
  purgeStyles
);

const buildTemplates = gulp.series(
  selectedClean.bind(this, path.join(paths.dist.root, '*.html')),
  templating,
  purgeStyles
);

const buildScripts = gulp.series(
  selectedClean.bind(this, [
    path.join(paths.dist.js, 'main.js'),
    path.join(paths.dist.js, 'vendor.min.js'),
  ]),
  scriptMain,
  scriptVendor
);

const buildImages = gulp.series(
  selectedClean.bind(this, path.join(paths.dist.images, '*')),
  gulp.parallel(minifyImages, convertToWebp)
);

const buildWithoutImages = gulp.series(
  selectedClean.bind(this, [
    path.join(paths.dist.css, 'style.min.css'),
    path.join(paths.dist.css, 'style.min.css.map'),
    path.join(paths.dist.root, '*.html'),
    path.join(paths.dist.js, 'main.js'),
    path.join(paths.dist.js, 'vendor.min.js'),
  ]),
  gulp.parallel(styles, templating, scriptMain, scriptVendor),
  purgeStyles
)

exports.buildStyles = buildStyles;
exports.buildTemplates = buildTemplates;
exports.buildImages = buildImages;
exports.buildScripts = buildScripts;
exports.buildWithoutImages = buildWithoutImages;
