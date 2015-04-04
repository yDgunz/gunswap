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
                src: ['js/lib/*.js','js/util.js','js/BounceGA.js','js/Siteswap.js','js/SiteswapAnimator.js','js/index.js'],
                dest: 'js/gunswap.js'
            }
        },

        uglify: 
        {
            dist: {
                files: {
                    'js/gunswap.min.js': ['js/gunswap.js']
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