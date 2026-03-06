const User = require('./userModel');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

exports.register = async (req, res) => {
	const { username, fullName, email, password, confirmPassword } = req.body;

	try {
		// senha diferente
		if (password !== confirmPassword) {
			req.flash('error', 'As senhas nao coincidem');
			return res.redirect('/register');
		}

		// usuario existe?
		const emailExists = await User.findOne({
			where: { email, isDeleted: false }
		});

		if (emailExists) {
			req.flash('error', 'Email já cadastrado');
			return res.redirect('/register');
		}

		const usernameExists = await User.findOne({
			where: { username, isDeleted: false }
		});

		if (usernameExists) {
			req.flash('error', 'Usuário já cadastrado');
			return res.redirect('/register');
		}

		// senha
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		await User.create({
			username,
			fullName,
			email,
			password: hashedPassword
		});

		req.flash('success', 'Cadastrado realizado com sucesso!');
		return res.redirect('/login');
	} catch (e) {
		console.error(e);
		req.flash('error', 'Um erro interno ocorreu, tente novamente!');
		return res.redirect('/register');
	}
};
