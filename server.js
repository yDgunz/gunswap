// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var passport = require('passport');
var flash    = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var session      = require('express-session');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'secret' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

require('./config/passport')(passport); // pass passport for configuration

var port = process.env.PORT || 8080;        // set our port

var mongoose   = require('mongoose');
var mongo_uri = process.env.MONGODB_URI || 'mongodb://localhost/gunswap';
mongoose.connect(mongo_uri); // connect to our database
console.log('Connecting to DB at ' + mongo_uri);

var Pattern     = require('./app/models/pattern');

// ROUTES FOR OUR API
// =============================================================================
var acctRouter = express.Router();

acctRouter.get('/login', function(req,res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
});

acctRouter.post('/login', passport.authenticate('local-login', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

acctRouter.get('/signup', function(req,res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
});

acctRouter.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/signup',
    failureFlash: true
}));

acctRouter.get('/profile', isLoggedIn, function(req,res) {
    res.render('profile.ejs', { user: req.user });
});

acctRouter.get('/logout', function(req,res) {
    req.logout();
    res.redirect('/');
});

acctRouter.get('/', function(req,res) {
    res.render('animator.ejs', { isLoggedIn: req.isAuthenticated() });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

var router = express.Router();              // get an instance of the express Router

router.route('/patterns')

    .post(isLoggedIn, function(req, res) {

        var pattern = new Pattern();

        // this method wasn't working, was writing nested objects as "Object object"
        var keys = Object.keys(req.body.inputs);
        for (var i = 0; i < keys.length; i++) {
            pattern.inputs[keys[i]] = req.body.inputs[keys[i]];            
        }

        pattern.user_id = req.user.id;
        pattern.public = true;
        pattern.name = req.body.name;

        pattern.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Pattern created!' });
        });
        
    })

    .get(isLoggedIn, function(req, res) {
        Pattern.find({ 'user_id': req.user.id }, '_id name public user_id', function(err, patterns) {
            if (err)
                res.send(err);

            res.json(patterns);
        });
    });

router.route('/patterns/:pattern_id')

    .get(function(req, res) {
        Pattern.findById(req.params.pattern_id, function(err, pattern) {
            if (err) {
                res.send(err);
            }
            // only return this pattern if it's the user's pattern or it's public
            if (req.user.id == pattern.user_id || pattern.public) {
                res.json(pattern);
            }            
        });
    })

    // TODO - still need to do this part
    .put(function(req, res) {

        Pattern.findById(req.params.pattern_id, function(err, pattern) {

            if (err)
                res.send(err);

            pattern.name = req.body.name; 

            pattern.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Pattern updated!' });
            });

        });
    })

    .delete(function(req, res) {
        
        Pattern.findById(req.params.pattern_id, function(err, pattern) {

            if (err)
                res.send(err);

            if (pattern.user_id == req.user.id) {
                Pattern.remove({
                    _id: pattern.id
                }, function(err, pattern) {
                    if (err)
                        res.send(err);

                    res.json({ message: 'Successfully deleted' });
                });  
            }            

        });
        
    });

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
app.use('/', acctRouter);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);