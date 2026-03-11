var express = require('express');
var router = express.Router();
const userController = require('../modules/user/userController');

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Express' });
});

/* GET register page. */
router.get('/register', function (req, res, next) {
	res.render('register', { title: 'Registre-se', messages: {} });
});

/* GET login page. */
router.get('/login', function (req, res, next) {
	res.render('login', { title: 'Entrar', messages: {} });
});

router.post('/register', userController.register);

module.exports = router;
