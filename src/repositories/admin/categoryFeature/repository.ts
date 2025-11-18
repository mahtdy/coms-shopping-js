import BaseRepositoryService from "../../../core/mongoose-controller/repository";
import { RepositoryConfigOptions } from "../../../core/mongoose-controller/repository";
import CategoryFeature, { CategoryFeatureModel } from "../../../repositories/admin/categoryFeature/model";

export default class CategoryFeatureRepository extends BaseRepositoryService<CategoryFeature> {
    constructor(options?: RepositoryConfigOptions) {
        super(CategoryFeatureModel, options);
    }
}
