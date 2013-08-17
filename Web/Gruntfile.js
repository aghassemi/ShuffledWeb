module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    dirs: {
        build: 'build',
        dist: 'dist',
        filters: 'filters'
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
        dest: '<%= dirs.dist %>/',
      },
      libs: {
        cwd: 'src/node_modules/',
        expand: true,
        src: '**',
        dest: '<%= dirs.dist %>/node_modules/',
      },
      deploy: {
        cwd: '<%= dirs.dist %>',
        expand: true,
        src: '**',
        dest: 'C:\\Users\\Ali\\Documents\\My Web Sites\\ShuffledWeb',
      }
    },
    concat: {
      js: {
        src: ['src/static/javascript/*.js'],
        dest: '<%= dirs.build %>/<%= pkg.name %>.js'
      },
      css: {   
        src: ['src/static/css/*.css'],
        dest: '<%= dirs.build %>/<%= pkg.name %>.css'
      },
      filters: {
        src: ['<%= dirs.filters %>/*'],
        dest: '<%= dirs.filters %>/filters-all.csv'
      }
    },
    cssmin: {
      css:{
        src: '<%= dirs.build %>/<%= pkg.name %>.css',
        dest: '<%= dirs.dist %>/<%= pkg.name %>.min.css'
      }
    },
    uglify: { 
      options: {
          mangle: true,
          compress: true
      },
      dist: {
        files: {
          '<%= dirs.dist %>/<%= pkg.name %>.min.js': ['<%= dirs.build %>/<%= pkg.name %>.js']
        }
      }
    }
    
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  

  grunt.registerTask('deploy', ['copy:deploy'] );
  grunt.registerTask('build', ['copy:assets', 'copy:libs','copy:app', 'concat:js', 'concat:css', 'uglify', 'cssmin:css', 'clean:build']);
  grunt.registerTask('default', ['build','deploy'] );
  grunt.registerTask('filter', ['concat:filters','filter-urls'] );

  grunt.registerTask('filter-urls', function() {
  
    var done = this.async();

    var csv = require('csv')
    var fs = require('fs');
    var filters = [];
    csv()
    .from.stream(fs.createReadStream( grunt.config.get('dirs.filters') + '/filters-all.csv'))
    .on('record', function(row,index){
        filters.push( row[0].toLowerCase() );
    })
    .on('end', function(count) {
        LoadAndWriteTopSites();
    });

    function LoadAndWriteTopSites() {
        csv()
        .from.stream(fs.createReadStream('top-1m.csv'))
        .to.stream(fs.createWriteStream( grunt.config.get('dirs.dist') + '/top-1m.csv'))
        .transform( function(row){
            var site = row[1];

            if( IsSafe( site ) ) {
               return row;
            } else {
              return;
            }
            
        }).on('end', function( count ) {
            grunt.log.writeln(count + ' Urls written');
            done();
        });
    };

    function IsSafe( url ) {

      url = url.toLowerCase();
      
      for( var i =0; i < filters.length; i++ ) {
          if( url.indexOf( filters[i] ) >= 0 ){

              return false;
          }
      }

      return true;
    };

  });

};