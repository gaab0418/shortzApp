const bcrypt = require('bcryptjs');
const User = require('../modules/user/userModel');

exports.seed = async () => {

    const user = {
        username: 'admin',
        email: process.env.EMAIL_ADMIN || 'admin@admin.local',
        password: process.env.PASSWORD_ADMIN || 'admin123',
        fullName: 'Administrador'
    }

    const emailExists = await User.findOne({ where: { email: user.email } });
    const usernameExists = await User.findOne({ where: { username: user.username } });
    if (emailExists || usernameExists) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    await User.create({
        username: user.username,
        email: user.email,
        password: hashedPassword,
        fullName: user.fullName
    });

    console.log('Seed rodado com sucesso, usuário admin criado.')
}