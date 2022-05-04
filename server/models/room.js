'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {

    static getPriceBasedOn(){
      return {
        '1': 'room type',
        '2': 'guest type',
      }
    }
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Room.init({
    name: DataTypes.STRING,
    owner_id: DataTypes.BIGINT,
    room_type_id: DataTypes.BIGINT,
    price_based_id: DataTypes.SMALLINT,
  }, {
    sequelize,
    modelName: 'Room',
    tableName: 'rooms',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',    
  });
  return Room;
};