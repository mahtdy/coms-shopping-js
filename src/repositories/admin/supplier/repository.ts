import BaseRepositoryService, {
    RepositoryConfigOptions,
} from "../../../core/mongoose-controller/repository";
import { Supplier, SupplierModel } from "../supplier/model";

export default class SupplierRepository extends BaseRepositoryService<Supplier> {
    constructor(options?: RepositoryConfigOptions) {
        super(SupplierModel, options);
    }
}