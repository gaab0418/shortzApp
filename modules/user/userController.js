const User = require('./userModel');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
	const { username, email, password, confirmPassword, fullName } = req.body;
	try {
		// 1. Validação básica de senhas coincidentes
		if (password !== confirmPassword) {
			req.flash('error', 'As senhas não coincidem.');
			return res.redirect('/register');
		}

		// 2. Verificar se usuário ou e-mail já existem (opcional, mas melhora o UX)
		const emailExists = await User.findOne({ where: { email } });
		const usernameExists = await User.findOne({ where: { username } });
		if (emailExists || usernameExists) {
			req.flash('error', 'Este e-mail ou usuário já está cadastrado.');
			return res.redirect('/register');
		}

		// 3. Hash da senha
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// 4. Salvar no banco
		await User.create({
			username,
			email,
			password: hashedPassword,
			fullName
		});

		// 5. Redirecionar para login com mensagem de sucesso
		req.flash('success', 'Conta criada com sucesso! Faça seu login.');
		res.redirect('/login');
	} catch (error) {
		console.error(error);
		req.flash(
			'error',
			'Erro ao criar conta. Verifique os dados e tente novamente.'
		);
		res.redirect('/register');
	}
};
