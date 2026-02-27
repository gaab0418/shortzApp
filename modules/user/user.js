const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const User = sequelize.define(
	'User',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'id'
		},
		username: {
			type: DataTypes.STRING(60),
			allowNull: false,
			unique: true,
			field: 'username'
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: { isEmail: true },
			field: 'email'
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'password'
		},
		fullName: {
			type: DataTypes.STRING(120),
			allowNull: false,
			field: 'fullName'
		},
		profilePicture: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'profilePicture'
		},
		bio: {
			type: DataTypes.TEXT,
			allowNull: true,
			validate: {
				len: [0, 500]
			},
			field: 'bio'
		},
		phone: {
			type: DataTypes.STRING(20),
			allowNull: true,
			field: 'phone'
		},
		followersCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'followersCount'
		},
		followingCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'followingCount'
		},
		videosCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'videosCount'
		},
		isBlocked: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'isBlocked'
		},
		isDeleted: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'isDeleted'
		},
		isAdmin: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'isAdmin'
		}
	},
	{
		tableName: 'users'
	}
);

module.exports = User;
