'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoomPricing extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.RoomPricing.belongsTo(
        models.GuestType, {foreignKey: 'guest_type_id', as: 'guestType'}
      )   
    }
  };
  RoomPricing.init({
    room_type_id: DataTypes.BIGINT,
    guest_type_id: DataTypes.BIGINT,
    price_on_monday: DataTypes.INTEGER,
    price_on_tuesday: DataTypes.INTEGER,
    price_on_wednesday: DataTypes.INTEGER,
    price_on_thursday: DataTypes.INTEGER,
    price_on_friday: DataTypes.INTEGER,
    price_on_saturday: DataTypes.INTEGER,
    price_on_sunday: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'RoomPricing',
    tableName: 'room_pricings',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  return RoomPricing;
};