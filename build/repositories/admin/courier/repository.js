"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/basePage/repository"));
const model_1 = require("./model");
class CourierRepository extends repository_1.default {
    constructor(options) {
        super({
            model: model_1.CourierModel,
            typeName: "courier",
            selectData: {
                name: 1,
                phone: 1,
                status: 1,
                capacity: 1,
                currentLocation: 1,
            },
            sort: {
                insertDate: { show: "زمان ثبت" },
            },
            ...(options || {}),
        });
    }
    async findAvailable(limit = 10) {
        return this.findAll({ status: "available" }, 
        // { limit },
        [{ path: "" }]);
    }
    /**
     * Update courier location (lon, lat) and timestamp
     */
    async updateLocation(courierId, lon, lat) {
        return this.editById(courierId, {
            $set: {
                currentLocation: {
                    type: "Point",
                    coordinates: [lon, lat],
                    updatedAt: new Date(),
                },
            },
        });
    }
    /**
     * Geo-near couriers (within radiusMeters)
     */
    async findNearby(lon, lat, radiusMeters = 5000, limit = 10) {
        return model_1.CourierModel.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [lon, lat] },
                    distanceField: "dist.calculated",
                    maxDistance: radiusMeters,
                    spherical: true,
                },
            },
            { $limit: limit },
        ]);
    }
}
exports.default = CourierRepository;
