'use strict';

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static getLanguageISOCode(){
      return {
        '1': 'eng',
        '2': 'ind'
      }
    }
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {          
      models.User.belongsTo(
        models.Hotel, {foreignKey: 'hotel_id', as: 'hotel'}
      )      
      models.User.belongsTo(
        models.Role, {foreignKey: 'role_id', as: 'role'}
      )        
    }
  };
  User.init({
    name: DataTypes.STRING(100),
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role_id: DataTypes.SMALLINT,
    hotel_id: DataTypes.BIGINT,
    language_id: DataTypes.SMALLINT,
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    defaultScope: {
      attributes: {exclude: ['password']}
    },
    scopes: {
      withPassword: {
        attributes: {include: ['password']}
      }
    }
  });
  return User;
};