module.exports = function(grunt)
{
    // Configuration.
    grunt.initConfig({

        // Import package information.
        package: grunt.file.readJSON('package.json'),

        // Test.
        simplemocha:
        {
            options: {
                timeout: 3000,
                ignoreLeaks: false,
                ui: 'bdd',
                reporter: 'nyan'
            },

            all:
            {
                src: [ 'test.js' ]
            }
        },

        concat:
        {
            options: {
                separator: "\n;"
            },
            dist: {
                files: {
                    'build/Siteswap.js': ['public/js/util.js','public/js/BounceGA.js','public/js/Bezier.js','public/js/Siteswap.js'],
                    'build/gunswap.js': ['public/js/lib/*.js','build/Siteswap.js','public/js/SiteswapAnimator.js','public/js/SiteswapGraph.js','public/js/index.js']
                }
            }
        },

        uglify: 
        {
            dist: {
                files: {
                    'build/gunswap.min.js': ['build/gunswap.js'],
                    'build/Siteswap.min.js': ['build/Siteswap.js']
                }
            }
        },

        // Watch.
        watch:
        {
            // Build product.
            default:
            {
                files: ['**'],
                tasks: ['simplemocha'],
            }

        }

    });

    // Load plugins.
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // `default` task for the everyday.
    grunt.registerTask('default', ['watch:default']);

    // `build`, `test` task for Travis CI.
    grunt.registerTask('test', ['simplemocha']);

    grunt.registerTask('build', ['concat','uglify']);

};