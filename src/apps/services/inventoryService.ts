import { Types, ClientSession } from "mongoose";
import ProductWarehouseRepository from "../../repositories/admin/productWarehouse/repository";
import InventoryHistoryRepository from "../../repositories/admin/inventoryHistory/repository";
import Productwarehouse from "../../repositories/admin/productWarehouse/model";
import WarehouseTransferRepository from "../../repositories/admin/warehouseTransfer/repository";

type HistoryType = "purchase" | "sale" | "transfer" | "adjustment";

interface StockChangeInput {
  warehouseId: string;
  variantId?: string;
  productId?: string;
  batchNumber: string;
  quantityDelta: number;
  variantPrice?: number;
  purchasePrice?: number;
  reason: string;
  changeType: HistoryType;
}

interface UpdateInventoryInput {
  inventoryId: string;
  data: {
    quantity?: number;
    variantPrice?: number;
    purchasePrice?: number;
    minStockThreshold?: number;
    batchNumber?: string;
  };
  reason?: string;
}

interface TransferInput {
  fromWarehouseId: string;
  toWarehouseId: string;
  variantId: string;
  batchNumber: string;
  quantity: number;
  variantPrice?: number;
  purchasePrice?: number;
  transferId: string;
}

/**
 * توضیح: این سرویس تمام منطق افزایش/کاهش موجودی و ثبت تاریخچه را متمرکز می‌کند.
 */
export default class InventoryService {
  private productWarehouseRepo: ProductWarehouseRepository;
  private historyRepo: InventoryHistoryRepository;
  private transferRepo: WarehouseTransferRepository;

  constructor() {
    this.productWarehouseRepo = new ProductWarehouseRepository();
    this.historyRepo = new InventoryHistoryRepository();
    this.transferRepo = new WarehouseTransferRepository();
  }

  /**
   * دریافت لیست موجودی با امکان صفحه‌بندی.
   */
  async listInventory(
    filter: Record<string, any>,
    options: { skip?: number; limit?: number } = {}
  ) {
    const inventory = await this.productWarehouseRepo.find(filter, options);
    const total = await this.productWarehouseRepo.count(filter);
    return { inventory, total };
  }

  /**
   * افزایش یا کاهش موجودی انبار و ثبت تاریخچه.
   * @param session MongoDB Session برای Transaction (اختیاری)
   */
  async adjustStock(input: StockChangeInput, session?: ClientSession): Promise<Productwarehouse> {
    const filter = this.buildInventoryFilter(input);
    const existing =
      (await this.productWarehouseRepo.collection
        .findOne(filter)
        .lean()) || undefined;

    const currentQty = existing?.quantity || 0;
    const nextQty = currentQty + input.quantityDelta;
    if (nextQty < 0) {
      throw {
        status: 400,
        message: "موجودی کافی برای این عملیات وجود ندارد.",
      };
    }

    const now = new Date();
    const updateDoc: any = {
      quantity: nextQty,
      variantPrice:
        input.variantPrice ?? existing?.variantPrice ?? input.purchasePrice ?? 0,
      purchasePrice:
        input.purchasePrice ?? existing?.purchasePrice ?? input.variantPrice ?? 0,
      lastUpdated: now,
      minStockThreshold: existing?.minStockThreshold ?? 5,
    };

    const setOnInsert: any = {
      warehouse: new Types.ObjectId(input.warehouseId),
      batchNumber: input.batchNumber,
    };

    if (input.variantId) {
      updateDoc.variant = new Types.ObjectId(input.variantId);
      setOnInsert.variant = new Types.ObjectId(input.variantId);
    }
    if (input.productId) {
      updateDoc.product = new Types.ObjectId(input.productId);
      setOnInsert.product = new Types.ObjectId(input.productId);
    }

    const updated = await this.productWarehouseRepo.collection
      .findOneAndUpdate(
        filter,
        {
          $set: updateDoc,
          $setOnInsert: setOnInsert,
        },
        {
          upsert: true,
          new: true,
          session, // کامنت: استفاده از session برای Transaction
        }
      )
      .exec();

    // کامنت: ثبت تاریخچه با session
    const historyData = {
      inventory_id: updated._id,
      change_type: input.changeType,
      quantity_changed: input.quantityDelta,
      batch_number: input.batchNumber,
      reason: input.reason,
    };
    
    if (session) {
      await this.historyRepo.collection.create([historyData], { session });
    } else {
      await this.historyRepo.create(historyData);
    }

    return updated;
  }

  /**
   * بروزرسانی مستقیم رکورد موجودی (برای ویرایش‌های دستی).
   */
  async updateInventoryRecord({
    inventoryId,
    data,
    reason = "Inventory update",
  }: UpdateInventoryInput) {
    const current = await this.productWarehouseRepo.findById(inventoryId);
    if (!current) {
      throw {
        status: 404,
        message: "رکورد موجودی یافت نشد.",
      };
    }

    const updatePayload: any = { ...data, lastUpdated: new Date() };
    const updated = await this.productWarehouseRepo.editById(
      inventoryId,
      {
        $set: updatePayload,
      },
      { new: true }
    );

    if (data.quantity !== undefined) {
      const delta = data.quantity - (current.quantity || 0);
      await this.historyRepo.create({
        inventory_id: inventoryId,
        change_type: "adjustment",
        quantity_changed: delta,
        batch_number: updated.batchNumber,
        reason,
      });
    }

    return updated;
  }

  /**
   * انتقال موجودی بین انبارها با ثبت تاریخچه.
   */
  async transferStock(input: TransferInput) {
    const fromInventory = await this.adjustStock({
      warehouseId: input.fromWarehouseId,
      variantId: input.variantId,
      batchNumber: input.batchNumber,
      quantityDelta: -input.quantity,
      variantPrice: input.variantPrice,
      purchasePrice: input.purchasePrice,
      reason: `Transfer #${input.transferId} from warehouse ${input.fromWarehouseId}`,
      changeType: "transfer",
    });

    const toInventory = await this.adjustStock({
      warehouseId: input.toWarehouseId,
      variantId: input.variantId,
      batchNumber: input.batchNumber,
      quantityDelta: input.quantity,
      variantPrice: input.variantPrice,
      purchasePrice: input.purchasePrice,
      reason: `Transfer #${input.transferId} to warehouse ${input.toWarehouseId}`,
      changeType: "transfer",
    });

    return { fromInventory, toInventory };
  }

  /**
   * ثبت وضعیت انتقال (در صورت نیاز به تغییر وضعیت).
   */
  async updateTransferStatus(
    transferId: string,
    status: "pending" | "confirmed" | "canceled"
  ) {
    return this.transferRepo.editById(
      transferId,
      {
        $set: { status, updated_at: new Date() },
      },
      { new: true }
    );
  }

  /**
   * تبدیل شناسه‌ها به ساختار جستجو.
   */
  private buildInventoryFilter(input: StockChangeInput) {
    const filter: any = {
      warehouse: new Types.ObjectId(input.warehouseId),
      batchNumber: input.batchNumber,
    };
    if (input.variantId) {
      filter.variant = new Types.ObjectId(input.variantId);
    }
    if (input.productId) {
      filter.product = new Types.ObjectId(input.productId);
    }
    return filter;
  }
}

