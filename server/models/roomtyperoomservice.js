'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoomTypeRoomService extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.RoomTypeRoomService.belongsTo(
        models.RoomService, {foreignKey: 'room_service_id', as: 'roomService'}
      )      
    }
  }
  RoomTypeRoomService.init({
    room_service_id: DataTypes.BIGINT,
    room_type_id: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'RoomTypeRoomService',
    tableName: 'room_type_room_services',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return RoomTypeRoomService;
};