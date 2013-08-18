module.exports = function(grunt) {

  var csv = require('csv')
  var fs = require('fs');

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
      jsDev: {
        src: ['src/static/javascript/*.js'],
        dest: '<%= dirs.dist %>/<%= pkg.name %>.min.js'
      },
      css: {   
        src: ['src/static/css/*.css'],
        dest: '<%= dirs.build %>/<%= pkg.name %>.css'
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
  grunt.registerTask('buildAssets', ['copy:assets', 'copy:libs','copy:app', 'concat:js', 'concat:css', 'cssmin:css']);
  grunt.registerTask('buildProd', ['buildAssets', 'uglify', 'clean:build']);
  grunt.registerTask('buildDev', ['buildAssets', 'concat:jsDev', 'clean:build']);


  grunt.registerTask('default', ['buildProd','deploy'] );
  grunt.registerTask('dev', ['buildDev','deploy'] );

  grunt.registerTask('filter', function() {
  
    var done = this.async();

    var phrases = [];
    var domains = {};

    csv()
    .from.stream(fs.createReadStream( grunt.config.get('dirs.filters') + '/phrases'))
    .on('record', function(row,index){
        phrases.push( row[0].toLowerCase() );
    })
    .on('end', function(count) {
        grunt.log.writeln( count + ' bad phrases loaded.');
        LoadDomains();
    });

    function LoadDomains() {
      csv()
      .from.stream(fs.createReadStream( grunt.config.get('dirs.filters') + '/domains'))
      .on('record', function(row,index){
          domains[ row[0].toLowerCase() ] = true;
      })
      .on('end', function(count) {
          grunt.log.writeln( count + ' blacklisted domains loaded.');
          LoadAndWriteTopSites( Filter, done );
      });
    };

    function Filter( url ) {

      url = url.toLowerCase();
      
      if( domains[ url ] === true ) {
        return 'bad_domain';
      }

      for( var i =0; i < phrases.length; i++ ) {
          if( url.indexOf( phrases[i] ) >= 0 ){
              return 'bad_phrase';
          }
      }
      return 'safe';

    };

  });

  function LoadAndWriteTopSites( filterFunc, doneCallback ) {

      grunt.log.writeln( 'Filtering started.' );

      var numSites = 0;
      var numSafeSites = 0;
      var numUnsafeByDomain = 0;
      var numUnsafeByPhrase = 0;

      csv()
      .from.stream(fs.createReadStream('top-1m.csv'))
      .to.stream(fs.createWriteStream( grunt.config.get('dirs.dist') + '/top-1m.csv'))
      .transform( function(row){
          var site = row[1];
          numSites++;

          if( (numSites % 10000) == 0 ) {
            grunt.log.write('.');
          }

          var filterResult = filterFunc.call( filterFunc, site );

          if( filterResult == 'safe' ) {
            numSafeSites++;
            return row;
          } else if( filterResult == 'bad_domain' ) {
            numUnsafeByDomain++;
          } else if( filterResult == 'bad_phrase' ) {
            numUnsafeByPhrase++;
          } 

          return;
          
      }).on('end', function( count ) {
          grunt.log.writeln( '\nFiltering done, out of ' + numSites + ' sites:' );
          grunt.log.writeln(  numSafeSites + ' safe' );
          grunt.log.writeln(  numUnsafeByDomain + ' matched domain blacklist');
          grunt.log.writeln(  numUnsafeByPhrase + ' matched phrase blacklist');
          doneCallback.call( doneCallback );
      });
  };

};