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
mongoose.connect('mongodb://localhost/gunswap'); // connect to our database

var Pattern     = require('./app/models/pattern');

// ROUTES FOR OUR API
// =============================================================================
var acctRouter = express.Router();

acctRouter.get('/login', function(req,res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
});

acctRouter.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
}));

acctRouter.get('/signup', function(req,res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
});

acctRouter.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
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

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

router.route('/patterns')

    .post(function(req, res) {
        
        var pattern = new Pattern();   
        pattern.name = req.body.name;  

        pattern.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Pattern created!' });
        });
        
    })

    .get(function(req, res) {
        Pattern.find(function(err, patterns) {
            if (err)
                res.send(err);

            res.json(patterns);
        });
    });

router.route('/patterns/:pattern_id')

    .get(function(req, res) {
        Pattern.findById(req.params.pattern_id, function(err, pattern) {
            if (err)
                res.send(err);
            res.json(pattern);
        });
    })

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
        Pattern.remove({
            _id: req.params.pattern_id
        }, function(err, pattern) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
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