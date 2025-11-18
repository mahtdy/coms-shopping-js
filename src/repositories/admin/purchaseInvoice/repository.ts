import BaseRepositoryService, {
    RepositoryConfigOptions,
} from "../../../core/mongoose-controller/repository";
import { PurchaseInvoice, PurchaseInvoiceModel } from "../purchaseInvoice/model";

export default class PurchaseInvoiceRepository extends BaseRepositoryService<PurchaseInvoice> {
    constructor(options?: RepositoryConfigOptions) {
        super(PurchaseInvoiceModel, options);
    }
}