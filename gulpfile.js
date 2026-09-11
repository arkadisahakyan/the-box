import gulp from "gulp";
import browserSyncModule from "browser-sync";
import { deleteAsync } from "del";
import eslint from "gulp-eslint-new";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import fileinclude from "gulp-file-include";
import sharpResponsive from "gulp-sharp-responsive";
import fonter from "gulp-fonter-fix";
import ttf2woff2 from "gulp-ttf2woff2";
import fs from "fs/promises";
import path from "node:path";
import svgmin from "gulp-svgmin";
import autoprefixer from "gulp-autoprefixer";
import webpack from "webpack-stream";

const browserSync = browserSyncModule.create();
const sass = gulpSass(dartSass);

const devFolder = "app";
const distFolder = "dist";
const paths = {
  pages: {
    src: "app/*.html",
    dest: "dist/",
  },
  components: {
    src: "app/components/*.html",
  },
  styles: {
    src: "app/styles/**/*.scss",
    dest: "dist/styles/",
    entries: ["app/styles/**/*.scss", "!app/styles/**/_*.scss"],
  },
  scripts: {
    src: "app/scripts/**/*.js",
    dest: "dist/scripts/",
  },
  images: {
    jpegSrc: "app/images/**/*.{jpg,jpeg}",
    pngSrc: "app/images/**/*.png",
    src: `${devFolder}/images/**/*`,
    dest: "dist/images/",
  },
  fonts: {
    src: `${devFolder}/fonts/`,
    dest: `${distFolder}/fonts/`,
    cssFile: `${devFolder}/styles/_fonts.scss`,
  },
};

const fontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  heavy: 800,
  black: 900,
};

export function clean() {
  return deleteAsync(["dist/"]);
}

export function pages() {
  return gulp
    .src(paths.pages.src)
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: `${devFolder}/components/`,
      }),
    )
    .pipe(gulp.dest(paths.pages.dest))
    .pipe(browserSync.stream());
}

export function styles() {
  return gulp
    .src(paths.styles.entries)
    .pipe(sass().on("error", sass.logError))
    .pipe(
      autoprefixer({
        cascade: false,
      }),
    )
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

export function scripts() {
  return gulp
    .src(paths.scripts.src)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(webpack())
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(browserSync.stream());
}

export function initBrowserSync(done) {
  browserSync.init({
    server: {
      baseDir: "./dist/",
    },
    notify: false,
  });
  done();
}

export function minifyJpeg() {
  return gulp
    .src(paths.images.jpegSrc, { allowEmpty: true, encoding: false })
    .pipe(
      sharpResponsive({
        includeOriginalFile: false,
        formats: [
          {
            width: null,
            format: "jpeg",
            jpegOptions: { quality: 80, progressive: true },
          },
        ],
      }),
    )
    .pipe(gulp.dest(paths.images.dest));
}

export function minifyPng() {
  return gulp
    .src(paths.images.pngSrc, { allowEmpty: true, encoding: false })
    .pipe(
      sharpResponsive({
        includeOriginalFile: false,
        formats: [
          {
            width: null,
            format: "png",
            pngOptions: { quality: 80, compressionLevel: 6 },
          },
        ],
      }),
    )
    .pipe(gulp.dest(paths.images.dest));
}

export function handleSvg() {
  return gulp
    .src(`${paths.images.src}.svg`)
    .pipe(
      svgmin({
        js2svg: { pretty: true },
      }),
    )
    .pipe(gulp.dest(paths.images.dest));
}

export function convertToTtf() {
  return gulp
    .src(`${paths.fonts.src}**/*.{otf,eot,woff}`, { encoding: false })
    .pipe(
      fonter({
        formats: ["ttf"],
      }),
    )
    .pipe(gulp.dest(paths.fonts.src));
}

export function convertTtfToWoff2() {
  return gulp
    .src(`${paths.fonts.src}**/*.ttf`, { encoding: false })
    .pipe(ttf2woff2())
    .pipe(gulp.dest(paths.fonts.src));
}

export function copyFonts() {
  return gulp
    .src(`${paths.fonts.src}**/*.woff2`, { encoding: false })
    .pipe(gulp.dest(paths.fonts.dest));
}

export async function fontStyle() {
  try {
    await fs.access(paths.fonts.cssFile);
    console.log(
      `[Gulp] ${paths.fonts.cssFile} already exists. Skipping generation.`,
    );
    return;
  } catch {
    // fonts.scss does not exist
  }

  try {
    const entries = await fs.readdir(paths.fonts.dest, {
      recursive: true,
      withFileTypes: true,
    });
    const fonts = entries
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const fullPath = path.join(entry.parentPath, entry.name);
        const relativePath = path.relative("dist", fullPath);
        return relativePath.replaceAll("\\", "/");
      });
    let cssContent = "";
    fonts.forEach((fontPath) => {
      const fontMatch = fontPath.match(/([^/]+)-(.+)\.(.+)$/);
      const fontName = fontMatch[1];
      const fontWeight = fontWeights[fontMatch[2].toLowerCase()];
      const fontStyle = fontMatch[2].toLowerCase().endsWith("italic")
        ? "italic"
        : "normal";
      if (!fontWeight) return;
      cssContent += `@font-face {\n\tfont-family: '${fontName}';\n\tsrc: url('../${fontPath}') format('woff2');\n\tfont-weight: ${fontWeight};\n\tfont-style: ${fontStyle};\n\tfont-display: swap;\n}\n\n`;
    });
    if (cssContent) {
      await fs.writeFile(paths.fonts.cssFile, cssContent);
      console.log(`[Gulp] ${paths.fonts.cssFile} was generated successfully.`);
    }
  } catch {
    console.log(
      `[Gulp] Error occurred when handling the file ${paths.fonts.cssFile}`,
    );
  }
}

export function watchFiles() {
  gulp.watch([paths.pages.src, paths.components.src], pages);
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.scripts.src, scripts);
}

export default gulp.series(
  clean,
  gulp.parallel(minifyJpeg, minifyPng, handleSvg),
  gulp.series(convertToTtf, convertTtfToWoff2, copyFonts, fontStyle),
  gulp.parallel(pages, styles, scripts),
  gulp.parallel(initBrowserSync, watchFiles),
);

export const fast = gulp.series(
  clean,
  gulp.parallel(minifyJpeg, minifyPng, handleSvg),
  gulp.series(copyFonts, fontStyle),
  gulp.parallel(pages, styles, scripts),
  gulp.parallel(initBrowserSync, watchFiles),
);
