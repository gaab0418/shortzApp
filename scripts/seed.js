const bcrypt = require('bcryptjs');
const User = require('../modules/user/userModel');

exports.seed = async () => {

    console.log('Iniciando Seed...')

    const userAdmin = {
        username: 'admin',
        email: process.env.EMAIL_ADMIN || 'admin@admin.local',
        password: process.env.PASSWORD_ADMIN || 'admin123',
        fullName: 'Administrador'
    }
    
    const userCommon = {
        username: 'jonh',
        email: 'common@common.local',
        password: 'common123',
        fullName: 'Jonathan'
    }

    const emailExists = await User.findOne({ where: { email: userAdmin.email } });
    const usernameExists = await User.findOne({ where: { username: userAdmin.username } });
    if (!emailExists && !usernameExists) {
        console.log('Criando usuário admin...')
        const saltAdmin = await bcrypt.genSalt(10);
        const hashedPasswordAdmin = await bcrypt.hash(userAdmin.password, saltAdmin);
        await User.create({
            username: userAdmin.username,
            email: userAdmin.email,
            password: hashedPasswordAdmin,
            fullName: userAdmin.fullName
        });
    } else {
        console.log('Usuário admin já existe.');
    }

    const emailExistsCommon = await User.findOne({ where: { email: userCommon.email } });
    const usernameExistsCommon = await User.findOne({ where: { username: userCommon.username } });
    if (!emailExistsCommon && !usernameExistsCommon) {
        console.log('Criando usuário comum...')
        const saltCommon = await bcrypt.genSalt(10);
        const hashedPasswordCommon = await bcrypt.hash(userCommon.password, saltCommon);
        await User.create({
            username: userCommon.username,
            email: userCommon.email,
            password: hashedPasswordCommon,
            fullName: userCommon.fullName
        });
    } else {
        console.log('Usuário comum já existe.');
    }

    console.log('----------------------------------------')
    console.log('Dados do usuário administrador: ')
    console.log('Email: ' + userAdmin.email + ' - Senha: ' + userAdmin.password)
    console.log('\nDados do usuário comum: ')
    console.log('Email: ' + userCommon.email + ' - Senha: ' + userCommon.password)
    console.log('\n----------------------------------------')
    console.log('Seed rodado com sucesso, usuário admin e usuário comum criados.')
}

exports.seed().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('Erro ao executar o seed:', err);
    process.exit(1);
});