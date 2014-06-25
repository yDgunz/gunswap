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

    // `default` task for the everyday.
    grunt.registerTask('default', ['watch:default']);

    // `build`, `test` task for Travis CI.
    grunt.registerTask('test', ['simplemocha']);

};