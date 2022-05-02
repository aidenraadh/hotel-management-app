'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GuestType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  GuestType.init({
    name: DataTypes.STRING,
    owner_id: DataTypes.BIGINT,
    room_price: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'GuestType',
    tableName: 'guest_types',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',     
  });
  return GuestType;
};