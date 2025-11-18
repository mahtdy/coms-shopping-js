import BasePageRepository from "../../../core/mongoose-controller/basePage/repository";
import Courier, { CourierModel } from "./model";
import { RepositoryConfigOptions, QueryInfo } from "../../../core/mongoose-controller/repository";
import { Types } from "mongoose";

export default class CourierRepository extends BasePageRepository<Courier> {
    constructor(options?: RepositoryConfigOptions) {
        super({
            model: CourierModel,
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
        return this.findAll(
            { status: "available" },
            // { limit },
            [{ path: "" }]
        );
    }

    /**
     * Update courier location (lon, lat) and timestamp
     */
    async updateLocation(courierId: string | Types.ObjectId, lon: number, lat: number) {
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
    async findNearby(lon: number, lat: number, radiusMeters = 5000, limit = 10) {
        return CourierModel.aggregate([
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
