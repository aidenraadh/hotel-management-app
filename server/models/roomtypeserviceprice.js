'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoomTypeServicePrice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  RoomTypeServicePrice.init({
    name: DataTypes.STRING,
    room_service_id: DataTypes.BIGINT,
    room_type_id: DataTypes.BIGINT,
    price: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'RoomTypeServicePrice',
    tableName: 'room_type_service_prices',
    createdAt: 'created_at',
    updatedAt: 'updated_at',    
  });
  return RoomTypeServicePrice;
};