'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoomService extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  RoomService.init({
    name: DataTypes.STRING,
    owner_id: DataTypes.BIGINT,
    price_based_on: DataTypes.SMALLINT,
  }, {
    sequelize,
    modelName: 'RoomService',
    tableName: 'room_services',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',     
  });
  return RoomService;
};