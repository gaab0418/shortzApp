var express = require('express');
var router = express.Router();
const userController = require('../modules/user/userController');
const authMiddleware = require('../middlewares/auth');

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Vídeos Curtos e Engajadores' });
});

/* GET register page. */
router.get('/register', (req, res) => {
	res.render('register', { title: 'Criar Conta' });
});

// Rota que processa o formulário de cadastro
router.post('/register', userController.register);

// Rota para exibir o formulário de login
router.get('/login', (req, res) => {
	res.render('login', { title: 'Entrar' });
});

// Rota para processar o formulário de login
router.post('/login', userController.login);

// Rota para processar o logout
router.get('/logout', userController.logout);

// Rota para exibir o feed de vídeos (protegida por autenticação)
router.get('/feed', authMiddleware, (req, res) => {
	res.render('home', { user: req.session.user });
});

module.exports = router;
