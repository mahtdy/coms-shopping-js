import BaseRepositoryService, {
    RepositoryConfigOptions,
} from "../../../core/mongoose-controller/repository";
import { WarehouseTransfer, WarehouseTransferModel } from "../warehouseTransfer/model";

export default class WarehouseTransferRepository extends BaseRepositoryService<WarehouseTransfer> {
    constructor(options?: RepositoryConfigOptions) {
        super(WarehouseTransferModel, options);
    }
}