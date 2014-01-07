module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        
        concat: {
            js: {
                src: [
                    'js/_start.js',
                    'js/main.js',
                    'js/utils.js',
                    'js/fixdet.js',
                    'js/headcorr.js',
                    'js/smoother.js',
                    'js/hgdet.js',
                    'js/chgdet.js',
                    'js/keyboard.js',
                    'js/scroller.js',
                    'js/_end.js'
                ],
                dest: '<%= pkg.name %>-<%= pkg.version %>.js'
            },
            css: {
                src: 'css/**/*.css',
                dest: '<%= pkg.name %>-<%= pkg.version %>.css'
            },
            testJS: {
                src: [
                    'js/_start.js',
                    'js/main.js',
                    'js/utils.js',
                    'js/fixdet.js',
                    'js/headcorr.js',
                    'js/smoother.js',
                    'js/hgdet.js',
                    'js/chgdet.js',
                    'js/keyboard.js',
                    'js/scroller.js',
                    'tests/tests.js',
                    'js/_end.js'
                ],
                dest: 'test/<%= pkg.name %>.js'
            },
            testCSS: {
                src: 'css/**/*.css',
                dest: 'test/<%= pkg.name %>.css'
            }
        },
        
        autoprefixer: {
            options: {
                browsers: ['last 3 versions', 'ff > 12']
            },
            no_dest: {
                src: ['<%= pkg.name %>-<%= pkg.version %>.css', 'test/<%= pkg.name %>.css', 'examples/*.css']
            }
        },
    
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    '<%= pkg.name %>-<%= pkg.version %>.min.js': ['<%= concat.js.dest %>']
                }
            }
        },
        
        csso: {
            dist: {
                files: {
                    '<%= pkg.name %>-<%= pkg.version %>.min.css': ['<%= pkg.name %>-<%= pkg.version %>.css']
                }
            }
        },
        
        /*
        copy: {
            imagesToExamples: {
                expand: true,
                cwd: 'images/',
                src: '** /*.png',
                dest: 'examples/images/'
            }
        },
        */
        
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
    //grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-csso');

    //grunt.registerTask('less', ['less']);
    grunt.registerTask('inspect', ['jshint', 'csslint']);
    grunt.registerTask('default', ['concat', 'autoprefixer', 'uglify', 'csso']);
};