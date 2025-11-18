import BaseRepositoryService, {
    RepositoryConfigOptions,
} from "../../../core/mongoose-controller/repository";
import { SaleInvoiceItem, SaleInvoiceItemModel } from "../saleInvoiceItem/model";

export default class SaleInvoiceItemRepository extends BaseRepositoryService<SaleInvoiceItem> {
    constructor(options?: RepositoryConfigOptions) {
        super(SaleInvoiceItemModel, options);
    }
}