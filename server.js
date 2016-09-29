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
//mongoose.connect('mongodb://localhost/gunswap'); // connect to our database
mongoose.connect('mongodb://testuser:password@ds041526.mlab.com:41526/heroku_xrnd287q');

var Pattern     = require('./app/models/pattern');

// test out writing to DB

var pattern = new Pattern();

pattern.name = "test";

pattern.save(function(err) {
    if (err)
        res.send(err);

    res.json({ message: 'Pattern created!' });
});

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

    .get(function(req, res) {
        var query = [];

        if (req.query.public == 1) {
            query.push({ 'public': true });
        } else if (req.query.public == 0) {
            query.push({ 'public' : false });
        }
        
        if (req.query.userOnly == 1) {
            query.push({'user_id' : req.isAuthenticated() ? req.user.id : null });
        }

        Pattern.find(query.length > 0 ? { $and: query } : {}, '_id name public user_id', function(err, patterns) {
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