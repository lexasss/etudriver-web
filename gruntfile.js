module.exports = function(grunt) {

    var srcDir = 'src/';
    var libDir = 'libs/';
    var buildDir = 'build/';
    var buildName = buildDir + '<%= pkg.name %>';

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        
        concat: {
            js: {
                src: [srcDir + 'js/**/*.js', libDir + '**/*.js'],
                dest: buildName + '.js'
            },
            css: {
                src: srcDir + 'css/**/*.css',
                dest: buildName + '.css'
            }
        },
        
        autoprefixer: {
            options: {
                browsers: ['last 3 versions', 'ff > 12']
            },
            all: {
                src: [buildName + '.css', 'examples/*.css']
            }
        },
    
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            build: {
                src: [buildName + '.js'],
                dest: buildName + '.min.js'
            }
        },
        
        csso: {
            build: {
                src: [buildName + '.css'],
                dest: buildName + '.min.css'
                // files: {
                //     buildName + '.min.css': [buildName + '.css'] //['<%= concat.css.dest %>']
                // }
            }
        },
        
        copy: {
            versionize: {
                files: [
                    { src: buildName + '.js', dest: buildName + '-<%= pkg.version %>.js' },
                    { src: buildName + '.css', dest: buildName + '-<%= pkg.version %>.css' },
                    { src: buildName + '.min.js', dest: buildName + '-<%= pkg.version %>.min.js' },
                    { src: buildName + '.min.css', dest: buildName + '-<%= pkg.version %>.min.css' }
                ]
            },
            media: {
                files: [
                    { 
                        expand: true,
                        cwd: srcDir,
                        src: [
                            'images/**/*.png', 
                            'sounds/**/*.wav'
                        ],
                        dest: buildDir
                    }
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
            files: [
                'src/js/**/*.js'
            ],
            options: {
                globals: {
                    jQuery: true,
                    console: true,
                    module: true
                },
                multistr: true,
                eqnull: true
            }
        },
        
        csslint: {
            options: {
                ids: false
            },
            main: {
                src: 'src/css/**/*.css'
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
    grunt.registerTask('check', ['jshint', 'csslint']);
    grunt.registerTask('min', ['uglify', 'csso']);
    grunt.registerTask('default', ['concat', 'autoprefixer', 'copy:media']);
    grunt.registerTask('full', ['concat', 'autoprefixer', 'copy', 'uglify', 'csso']);
};