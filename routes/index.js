var express = require('express');
var router = express.Router();
const userController = require('../modules/user/userController');

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

module.exports = router;
