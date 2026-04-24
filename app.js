var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const flash = require('connect-flash');
const session = require('express-session');
var expressLayouts = require('express-ejs-layouts');

var indexRouter = require('./routes/index');
var usersRouter = require('./modules/user/userRoutes');
var videoRoutes = require("./modules/video/videoRoutes"); // [ADICIONAR] Importa as rotas de vídeo

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views/pages'));
app.set('layout', path.join(__dirname, 'views/layouts/main'));
app.use(expressLayouts);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
	session({
		secret: process.env.SESSION_SECRET || 'DEFAULT_SECRET',
		resave: false,
		saveUninitialized: false,
		cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 dia
	})
);
app.use(flash());
app.use((req, res, next) => {
	res.locals.messages = req.flash();
	res.locals.user = req.session.user || null;
	next();
});

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/', usersRouter);
app.use("/", videoRoutes); // [ADICIONAR] Usa as rotas de vídeo

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

const sequelize = require('./config/database');
const User = require('./modules/user/userModel');
const Video = require("./modules/video/videoModel"); // [ADICIONAR] Importa o modelo Video

sequelize
	.authenticate()
	.then(() => console.log('Banco OK'))
	.catch((err) => console.error('Erro no banco: ', err));

sequelize
	.sync({ alter: true })
	.then(() => console.log('Banco sincronizado'))
	.catch((err) => console.error('Erro no banco: ', err));

console.log('---===========================---');

module.exports = app;
