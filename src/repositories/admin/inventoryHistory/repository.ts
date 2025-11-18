import BaseRepositoryService, {
    RepositoryConfigOptions,
} from "../../../core/mongoose-controller/repository";
import { InventoryHistory, InventoryHistoryModel } from "../inventoryHistory/model";

export default class InventoryHistoryRepository extends BaseRepositoryService<InventoryHistory> {
    constructor(options?: RepositoryConfigOptions) {
        super(InventoryHistoryModel, options);
    }
}