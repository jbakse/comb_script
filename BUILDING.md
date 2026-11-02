# Building CombScript

CombScript's build is a 2015 gulp 3 / browserify toolchain. It no longer runs as-is on a current Node, so these notes describe how to get a working build in 2026 (last verified November 2026 on macOS, Apple Silicon).

The output goes to `build/`, a static site that can be served from any web server.

## Requirements

- **Node 10** (tested with 10.24.1) for the gulp build. gulp 3 doesn't run on Node 12 or newer.
- **A current Node** (14 or newer) for compiling the Sass, see below.

Node 10 has no Apple Silicon build. The Intel (x64) build runs fine under Rosetta. Either:

- download `node-v10.24.1-darwin-x64.tar.gz` from https://nodejs.org/dist/v10.24.1/, unpack it anywhere, and put its `bin` folder first on your `PATH` for the build shell, or
- with nvm, open an Intel shell (`arch -x86_64 zsh`) and run `nvm install 10`.

## Build

In a shell using Node 10:

```bash
npm ci
```

`package-lock.json` pins every dependency to the versions that last worked. Don't run a plain `npm install` unless you mean to update them: the `^` ranges in `package.json` now resolve to versions that behave differently. (For example, marked newer than 0.3.3 needs a space after `###` in headings.)

On macOS, remove the 2015 copy of fsevents that watchify bundles. It crashes Node 10 on load, and it's optional:

```bash
rm -rf node_modules/watchify/node_modules/fsevents
```

Then build everything except the CSS:

```bash
node scripts/build-legacy.js
```

Use `scripts/build-legacy.js` instead of `gulp`. It runs the tasks in `gulp/tasks` without the gulp CLI, and works around the parts that break on Node 10 (comments in the file explain each one).

## CSS

The original `sass` gulp task uses node-sass 2.x, which can't be installed anymore (it needs Python 2 to compile). Compile the SCSS with Dart Sass instead, **in a shell using a current Node**:

```bash
npx sass@1.77.8 --no-source-map --quiet src/style/main.scss build/css/main.css
```

```bash
npx sass@1.77.8 --no-source-map --quiet src/style/docs.scss build/css/docs.css
```

`--quiet` hides deprecation warnings about the 2015 SCSS; they don't affect the output. Unlike the original task, this skips autoprefixer and doesn't inline source maps. The page renders the same in current browsers.

## Preview

```bash
python3 -m http.server 8000 --directory build
```

Then open http://localhost:8000/.

## Deploy

The site is hosted on Netlify at https://combscript.justinbakse.com/. Netlify doesn't build it. Deploy a local build with the Netlify CLI:

```bash
npx netlify-cli deploy --prod --dir build
```

The first run asks which Netlify site to deploy to (and saves the answer in `.netlify/`).

`scripts/live.sh` is the old rsync deploy to DreamHost, which no longer hosts the site.
