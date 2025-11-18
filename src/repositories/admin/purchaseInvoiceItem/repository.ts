import BaseRepositoryService, {
    RepositoryConfigOptions,
} from "../../../core/mongoose-controller/repository";
import { PurchaseInvoiceItem, PurchaseInvoiceItemModel } from "../purchaseInvoiceItem/model";

export default class PurchaseInvoiceItemRepository extends BaseRepositoryService<PurchaseInvoiceItem> {
    constructor(options?: RepositoryConfigOptions) {
        super(PurchaseInvoiceItemModel, options);
    }
}