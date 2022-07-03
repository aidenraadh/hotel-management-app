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
    }
  };
  RoomService.init({
    name: DataTypes.STRING,
    hotel_id: DataTypes.BIGINT,
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