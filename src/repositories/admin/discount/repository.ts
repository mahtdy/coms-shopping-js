import BaseRepositoryService from "../../../core/mongoose-controller/repository";
import { RepositoryConfigOptions } from "../../../core/mongoose-controller/repository";
import Discount, { DiscountModel } from "../../../repositories/admin/discount/model";

export default class DiscountRepository extends BaseRepositoryService<Discount> {
    constructor(options?: RepositoryConfigOptions) {
        super(DiscountModel, options);
    }



    async findActiveForProductAndVariant(
        productId: string,
        categoryId?: string,
        brandId?: string,
        variantFeatures?: { [key: string]: string } // مثل { color: "red", size: "M" }
    ) {
        const now = new Date();
        const discounts = await this.findAll({
            isActive: true,
            $and :[{
                $or: [
                    { applyOnProducts: productId },
                    { applyOnCategories: categoryId },
                    { applyOnBrands: brandId },
                ],
            } , {
                $or: [
                    { eventStart: { $lte: now }, eventEnd: { $gte: now } },
                    { disStart: { $lte: now }, disEnd: { $gte: now } },
                ],
            }]
           
            
        });

        // فیلتر کردن بر اساس ویژگی واریانت‌ها
        return discounts.filter(discount => {
            if (!discount.variantFilter || discount.variantFilter.length === 0) return true;
            if (!variantFeatures) return false;

            return discount.variantFilter.every(vf => {
                const value = variantFeatures[vf.featureKey];
                if (!value) return false;
                if (!vf.featureValues || vf.featureValues.length === 0) return true;
                return vf.featureValues.includes(value);
            });
        });
    }

}
