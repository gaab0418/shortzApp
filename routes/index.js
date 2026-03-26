var express = require('express');
var router = express.Router();

// Rota para a página inicial (landing page)
router.get('/', function (req, res, next) {
	res.render('landing', { title: 'Vídeos Curtos e Engajadores' });
});

module.exports = router;
