var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt');
var flash = require('connect-flash');
var username = 'cmps369';
var password = 'finalproject';


bcrypt.genSalt(10, function(err, salt){
	bcrypt.hash(password, salt, function(err, hash){
		password = hash;
	});
});

var routes = require('./routes/index');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(cookieParser());
app.use(session({secret: "cmps369"}));
app.use(express.static(path.join(__dirname, 'public')));


var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
	{
		usernameField: 'username',
		passwordField: 'password'
	},

	function(user, pswd, done){
		if(user != username){
			console.log("Username mismatch");
			return done(null, false);
		}

		bcrypt.compare(pswd, password, function(err, isMatch){
			if(err) return done(err);
			if( !isMatch){
				console.log("Password mismatch");
			}
			else{
				console.log("Valid credentials");
			}
			done(null, isMatch);
		});
	}
));

passport.serializeUser(function(username, done) {
      // this is called when the user object associated with the session
      // needs to be turned into a string.  Since we are only storing the user
      // as a string - just return the username.
      done(null, username);
  });

passport.deserializeUser(function(username, done) {
  // normally we would find the user in the database and
  // return an object representing the user (for example, an object
  // that also includes first and last name, email, etc)
  done(null, username);
});

// Posts to login will have username/password form data.
// passport will call the appropriate functions...
routes.post('/login',
    passport.authenticate('local', { successRedirect: '/login_success',
                                     failureRedirect: '/login_fail',
                                  })
);

routes.get('/login', function (req, res) {
  res.render('login', {});
});

routes.get('/login_fail', function (req, res) {
  res.render('login_fail', {});
});

routes.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/login');
});



app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
