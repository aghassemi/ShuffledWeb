module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    dirs: {
        build: 'build',
        dist: 'dist'
    },
    clean: {
      build: '<%= dirs.build %>',
      dist: '<%= dirs.dist %>'
    },
    copy: {
      app: {
        filter: 'isFile',
        cwd: 'src/',
        expand: true,
        src: '*',
        dest: '<%= dirs.dist %>/',
      },
      assets: {
        filter: 'isFile',
        cwd: 'src/static/',
        expand: true,
        src: '*',
        dest: '<%= dirs.dist %>/static/',
      },
    },
    concat: {
      js: {
        src: ['src/static/javascript/*.js'],
        dest: '<%= dirs.build %>/<%= pkg.name %>.js'
      },
      css: {   
        src: ['src/static/css/*.css'],
        dest: '<%= dirs.build %>/<%= pkg.name %>.css'
      }
    },
    cssmin: {
      css:{
        src: '<%= dirs.build %>/<%= pkg.name %>.css',
        dest: '<%= dirs.dist %>/static/<%= pkg.name %>.min.css'
      }
    },
    uglify: { 
      options: {
          mangle: true,
          compress: true
      },
      dist: {
        files: {
          '<%= dirs.dist %>/static/<%= pkg.name %>.min.js': ['<%= dirs.build %>/<%= pkg.name %>.js']
        }
      }
    }
    
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  

  grunt.registerTask('default', [ 'clean:dist', 'copy:assets', 'copy:app', 'concat:js', 'concat:css', 'uglify', 'cssmin:css', 'clean:build']);

};