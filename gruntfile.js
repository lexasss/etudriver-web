module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        
        concat: {
            js: {
                src: 'js/*.js',
                dest: '<%= pkg.name %>.js'
            },
            css: {
                src: 'css/**/*.css',
                dest: '<%= pkg.name %>.css'
            }
        },
        
        autoprefixer: {
            options: {
                browsers: ['last 3 versions', 'ff > 12']
            },
            no_dest: {
                src: ['<%= pkg.name %>.css', 'examples/*.css']
            }
        },
    
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    '<%= pkg.name %>.min.js': ['<%= concat.js.dest %>']
                }
            }
        },
        
        csso: {
            dist: {
                files: {
                    '<%= pkg.name %>.min.css': ['<%= concat.css.dest %>']
                }
            }
        },
        
        copy: {
            versionize: {
                files: [
                    { src: '<%= concat.js.dest %>', dest: '<%= pkg.name %>-<%= pkg.version %>.js' },
                    { src: '<%= concat.css.dest %>', dest: '<%= pkg.name %>-<%= pkg.version %>.css' },
                    { src: '<%= pkg.name %>.min.js', dest: '<%= pkg.name %>-<%= pkg.version %>.min.js' },
                    { src: '<%= pkg.name %>.min.css', dest: '<%= pkg.name %>-<%= pkg.version %>.min.css' }
                ]
            }
        },
        
        /*
        less: {
            main: {
                files: {
                    'dest/examples/keyboard.css': 'dest/examples/keyboard.less'
                }
            }
        },*/
        
        jshint: {
            files: ['gruntfile.js', 'js/**/*.js', 'test/**/*.js'],
            options: {
                globals: {
                    jQuery: true,
                    console: true,
                    module: true
                },
                multistr: true
            }
        },
        
        csslint: {
            main: {
                src: 'css/**/*.css'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-csso');

    //grunt.registerTask('less', ['less']);
    grunt.registerTask('ver', ['copy:versionize']);
    grunt.registerTask('inspect', ['jshint', 'csslint']);
    grunt.registerTask('default', ['concat', 'autoprefixer', 'uglify', 'csso']);
};