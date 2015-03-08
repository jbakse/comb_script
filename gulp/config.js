var dest = "./build";
var src = './src';

module.exports = {
  browserSync: {
    server: {
      // Serve up our build folder
      baseDir: dest
    }
  },
  images: {
    src: src + "/images/**",
    dest: dest + "/images"
  },
  markup: {
    src: [src + "/**/*.html", src + "/**/*.yaml"],
    dest: dest
  },
  less: {
    src: [src + "/style/main.less", src + "/style/docs.less"],
    dest: dest + "/css"
  },
  jade: {
    src: src + "/docs.jade",
    dest: dest
  },
  browserify: {
    // A separate bundle will be generated for each
    // bundle config in the list below
    bundleConfigs: [{
      entries: src + '/javascript/main.js',
      dest: dest + '/javascript',
      outputName: 'main.js',
      paths: ['new_lib']
      // Additional file extentions to make optional
      // extensions: ['.coffee', '.hbs'],
      // list of modules to make require-able externally
      // require: ['jquery', 'backbone/node_modules/underscore']
      }]
  },
  production: {
    cssSrc: dest + '/*.css',
    jsSrc: dest + '/*.js',
    dest: dest
  }
};
