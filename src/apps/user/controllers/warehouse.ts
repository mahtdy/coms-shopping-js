import BaseController, {
    ControllerOptions,
} from "../../../core/mongoose-controller/controller";
import WarehouseRepository from "../../../repositories/admin/warehouse/repository";
import ProductWarehouseRepository from "../../../repositories/admin/productWarehouse/repository";
import SaleInvoiceRepository from "../../../repositories/admin/saleInvoice/repository";
import { Get } from "../../../core/decorators/method";
import { Query } from "../../../core/decorators/parameters";
import { z } from "zod";
import Warehouse from "../../../repositories/admin/warehouse/model";
import OrderRepository from "../../../repositories/admin/order/repository";

export class WarehouseController extends BaseController<Warehouse> {
    private warehouseRepo: WarehouseRepository;
    private productWarehouseRepo: ProductWarehouseRepository;
    private saleInvoiceRepo: SaleInvoiceRepository;

    constructor(
        baseRoute: string,
        repo: WarehouseRepository,
        options?: ControllerOptions
    ) {
        super(baseRoute, repo, options);
        this.warehouseRepo = new WarehouseRepository();
        this.productWarehouseRepo = new ProductWarehouseRepository();
        this.saleInvoiceRepo = new SaleInvoiceRepository();
    }

    @Get("")
    async getWarehouses(
        @Query({ schema: z.object({ page: z.number().default(1), limit: z.number().default(10) }) }) query: { page: number; limit: number }
    ) {
        const { page, limit } = query;
        const warehouses = await this.warehouseRepo.find(
            { is_active: true },
            { skip: (page - 1) * limit, limit },
            { projection: { title: 1, address: 1 } }
        );
        const total = await this.warehouseRepo.count({ is_active: true });
        return { warehouses, total };
    }

    @Get("/:warehouse_id/productWarehouse")
    async getProductWarehouse(
        @Query({ destination: "warehouse_id", schema: BaseController.id }) warehouse_id: string,
        @Query({
            schema: z.object({
                variant_id: BaseController.id.optional(),
                product_id: BaseController.id.optional(),
                page: z.number().default(1),
                limit: z.number().default(10),
            }),
        })
        query: { variant_id?: string; product_id?: string; page: number; limit: number }
    ) {
        const filter: any = { warehouse_id };
        if (query.variant_id) filter.variant_id = query.variant_id;
        // Assuming product_id is linked via variant_id in product_variant table
        const productWarehouse = await this.productWarehouseRepo.find(filter, {
            skip: (query.page - 1) * query.limit,
            limit: query.limit,
        });
        const total = await this.productWarehouseRepo.count(filter);
        return { productWarehouse, total };
    }

    @Get("/sale-invoices/:saleInvoiceId")
    async getSaleInvoice(@Query({ destination: "saleInvoiceId", schema: BaseController.id }) saleInvoiceId: string) {
        const invoice = await this.saleInvoiceRepo.findById(saleInvoiceId);
        const items = await this.saleInvoiceRepo.find({ saleInvoiceId });
        return { ...invoice, items };
    }
}

const warehouse = new WarehouseController("/warehouse", new WarehouseRepository(),{

});
export default warehouse;