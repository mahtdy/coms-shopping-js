import BasePageRepository from "../../../core/mongoose-controller/basePage/repository";
// import { PackageModel } from "./model";
// import Package from "./model";
import Package, { PackageModel } from "../../../repositories/admin/package/model";
import BaseRepositoryService, {RepositoryConfigOptions} from "../../../core/mongoose-controller/repository";

export default class PackageRepository extends BaseRepositoryService<Package> {
    constructor(options?: RepositoryConfigOptions) {
        super(PackageModel, options);
    }
}
