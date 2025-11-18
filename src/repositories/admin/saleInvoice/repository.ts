import BaseRepositoryService, {
    RepositoryConfigOptions,
} from "../../../core/mongoose-controller/repository";
import { SaleInvoice, SaleInvoiceModel } from "../saleInvoice/model";

export default class SaleInvoiceRepository extends BaseRepositoryService<SaleInvoice> {
    constructor(options?: RepositoryConfigOptions) {
        super(SaleInvoiceModel, options);
    }
}