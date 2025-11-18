"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repository"));
const model_1 = require("./model");
const mongoose_1 = require("mongoose");
class WarrantyRepository extends repository_1.default {
    constructor() {
        super(model_1.WarrantyModel);
    }
    async findApplicableWarranties(categoryId, brandId, isPublic = true) {
        const filter = {
            isActive: true,
            isPublic,
            $or: [
                { applicableCategories: { $exists: false } },
                { applicableCategories: { $size: 0 } },
                ...(categoryId ? [{ applicableCategories: { $in: [new mongoose_1.Types.ObjectId(categoryId)] } }] : []),
            ],
        };
        if (brandId) {
            filter.$and = [
                {
                    $or: [
                        { applicableBrands: { $exists: false } },
                        { applicableBrands: { $size: 0 } },
                        { applicableBrands: { $in: [new mongoose_1.Types.ObjectId(brandId)] } },
                    ],
                },
            ];
        }
        return this.findAll(filter, {
            sort: { displayOrder: 1, createdAt: -1 },
        });
    }
    async findActiveWarranties() {
        return this.findAll({
            isActive: true,
            $or: [
                { validFrom: { $exists: false } },
                { validFrom: { $lte: new Date() } },
            ],
            $and: [
                {
                    $or: [
                        { validTo: { $exists: false } },
                        { validTo: { $gte: new Date() } },
                    ],
                },
            ],
        }, {
            sort: { displayOrder: 1, title: 1 },
        });
    }
}
exports.default = WarrantyRepository;
