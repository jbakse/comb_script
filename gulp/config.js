var dest = "./build";
var src = './src';

module.exports = {
  browserSync: {
    server: {
      // Serve up our build folder
      baseDir: dest
    },
    port: 8000
    // https: true
  },
  images: {
    src: src + "/images/**",
    dest: dest + "/images"
  },
  markup: {
    src: [src + "/**/*.html", src + "/**/*.yaml"],
    dest: dest
  },
  // less: {
  //   src: [src + "/style/*.less", src + "/style/docs.less"],
  //   dest: dest + "/css"
  // },
  sass: {
    src: src + "/style/*.{sass,scss}",
    dest: dest + "/css",
    settings: {
      //indentedSyntax: true, // Enable .sass syntax!
      //imagePath: 'images' // Used by the image-url helper
    }
  },
  jade: {
    watch: [src + "/**.jade", src + "/docs/**"],
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
      },
      {
      entries: src + '/javascript/docs.js',
      dest: dest + '/javascript',
      outputName: 'docs.js',
      paths: ['new_lib']
      }
      ]
  },
  production: {
    cssSrc: dest + '/*.css',
    jsSrc: dest + '/*.js',
    dest: dest
  }
};
