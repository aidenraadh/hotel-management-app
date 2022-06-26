'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoomType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.RoomType.hasMany(
        models.RoomPricing, {foreignKey: 'room_type_id', as: 'roomPricings', }
      )
      models.RoomType.hasMany(
        models.RoomTypeRoomService, {foreignKey: 'room_type_id', as: 'roomServiceList', }
      )      
    }
  };
  RoomType.init({
    name: DataTypes.STRING,
    hotel_id: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'RoomType',
    tableName: 'room_types',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',       
  });
  return RoomType;
};