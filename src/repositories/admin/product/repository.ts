import {
  QueryInfo,
  RepositoryConfigOptions,
} from "../../../core/mongoose-controller/repository";
import BasePageRepository, {
  BasePageOptions,
} from "../../../core/mongoose-controller/basePage/repository";
import Product, { ProductModel } from "./model";
import ProductWarehouseRepository from "../productWarehouse/repository";
import { Types } from "mongoose";
import Warehouse from "../warehouse/model";
import Productwarehouse from "../productWarehouse/model";
import WarehouseRepository from "../warehouse/repository";
import ProductVariantRepository from "../productVariant/repository";
import DiscountRepository from "../discount/repository";
import { ProductVariantModel } from "../productVariant/model";

export default class ProductRepository extends BasePageRepository<Product> {
  productWarehouseRepo: ProductWarehouseRepository;
  discountRepo: DiscountRepository;
  warehouseRepo: WarehouseRepository;

  constructor(options?: RepositoryConfigOptions) {
    super({
      model: ProductModel,
      typeName: "product",


      contentFunc: async function (
        url: string,
        category: string,
        language?: string
      ) {
        return "/product" + url;
      },

      selectData: {
        type: 1,
        title: 1,
        price: 1,
        mainImage: 1,
        description: 1,
        brand: 1,
        viewCount: 1,
        saleCount: 1,
        author: 1,
        category: 1,
        publishDate: 1,
        insertDate: 1,
      },
      sort: {
        publishDate: {
          show: "زمان انتشار",
        },
        insertDate: {
          show: "زمان انتشار",
        },
        view: {
          show: "بازدید",
        },
      },

    });
    this.productWarehouseRepo = new ProductWarehouseRepository();
    this.warehouseRepo = new WarehouseRepository();
    this.productVariantRepo = new ProductVariantRepository();
    this.discountRepo = new DiscountRepository();

  }

  async getVariantsByProduct(productId: string) {
    // return ProductVariantModel.find({ product: productId, active: true }).lean();
    return this.productVariantRepo.findByProduct(productId);
  }

  async getProductList(page = 1, limit = 10, filters: any = {}, sortType?: string) {
    const query: any = {};
    
    // کامنت: فیلتر دسته‌بندی
    if (filters.category) query.category = filters.category;
    
    // کامنت: فیلتر برند
    if (filters.brand) query.brand = filters.brand;
    
    // کامنت: جستجوی متن (در title و description)
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { summary: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
      ];
    }
    
    // کامنت: فیلتر قیمت (حداقل)
    if (filters.minPrice) {
      query.price = { ...query.price, $gte: filters.minPrice };
    }
    
    // کامنت: فیلتر قیمت (حداکثر)
    if (filters.maxPrice) {
      query.price = { ...query.price, $lte: filters.maxPrice };
    }
    
    // کامنت: فیلتر امتیاز (حداقل)
    if (filters.minRating) {
      // کامنت: این فیلتر نیاز به join با reviews دارد که در pipeline انجام می‌شود
      // در حال حاضر فقط در pipeline اعمال می‌شود
    }
    
    // کامنت: فیلتر موجودی (فقط محصولات موجود)
    if (filters.inStock === true || filters.inStock === "true") {
      // کامنت: این فیلتر در pipeline اعمال می‌شود
    }

    let sort: Record<string, 1 | -1> = {};
    switch (sortType) {
      case "latest": sort = { insertDate: -1 }; break;
      case "price_high": sort = { price: -1 }; break;
      case "price_low": sort = { price: 1 }; break;
      case "most_viewed": sort = { viewCount: -1 }; break;
      case "best_seller": sort = { saleCount: -1 }; break;
      default: sort = { insertDate: -1 }; break;
    }

    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: query },
      // کامنت: Lookup برای نظرات و امتیازها
      {
        $lookup: {
          from: "productreviews",
          localField: "_id",
          foreignField: "product",
          as: "reviews",
          pipeline: [
            { $match: { status: "approved" } },
            {
              $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
              },
            },
          ],
        },
      },
      // کامنت: محاسبه averageRating از reviews
      {
        $addFields: {
          averageRating: {
            $ifNull: [{ $arrayElemAt: ["$reviews.averageRating", 0] }, 0],
          },
          totalReviews: {
            $ifNull: [{ $arrayElemAt: ["$reviews.totalReviews", 0] }, 0],
          },
        },
      },
      // واریانت‌ها
      {
        $lookup: {
          from: "productvariants",
          localField: "_id",
          foreignField: "product",
          as: "variants",
        },
      },
      // انبارها (در محصول ممکنه رکوردهای بدون variant هم باشه)
      {
        $lookup: {
          from: "productwarehouses",
          localField: "_id",
          foreignField: "product",
          as: "warehouses",
        },
      },
      // محاسبه‌ی موجودی کلی و قیمت‌های واریانت
      {
        $addFields: {
          totalStock: { $sum: "$warehouses.quantity" },
          // محاسبه لیست قیمت نهایی هر واریانت با ترکیب قیمت پایه و priceAdjustment‌های واریانت
          variantPrices: {
            $map: {
              input: "$variants",
              as: "v",
              in: {
                sku: "$$v.sku",
                variantId: "$$v._id",
                // base price: اگر variant.basePrice موجوده از اون استفاده کن، در غیر اینصورت از product.price استفاده کن
                base: { $ifNull: ["$$v.basePrice", "$price"] },
                // مجموع priceAdjustment های واریانت
                adjustments: { $sum: "$$v.features.priceAdjustment" }, // دقت: این خط وقتی features آرایه‌ از آبجکتهاست کار می‌کنه اگر priceAdjustment مقدار عددی داشته باشد
                finalVariantPrice: {
                  $add: [
                    { $ifNull: ["$$v.basePrice", "$price"] },
                    { $ifNull: [{ $sum: "$$v.features.priceAdjustment" }, 0] }
                  ]
                }
              }
            }
          },
        }
      },
      // حالا min price بین variantPrices و همچنین بررسی قیمت‌هایی که در warehouses (برای variant یا پروڈاکت) ثبت شده
      {
        $addFields: {
          // از warehouses اگر رکورد مرتبط به variant وجود داشته باشه، ممکنه قیمت override شده باشه
          warehouseVariantPrices: {
            $map: {
              input: "$warehouses",
              as: "wh",
              in: {
                variant: "$$wh.variant",
                price: "$$wh.variantPrice",
                quantity: "$$wh.quantity",
                warehouseId: "$$wh.warehouse"
              }
            }
          }
        }
      },
      // محاسبه minFinalPrice: مقایسه بین variant.finalVariantPrice و warehouse.variantPrice (اگر موجود)
      {
        $addFields: {
          // لیست تمام قیمت‌هایی که می‌توانند بعنوان قیمت نهایی در نظر گرفته شوند:
          candidatePrices: {
            $concatArrays: [
              // قیمت‌های واریانت محاسبه‌شده
              {
                $map: {
                  input: "$variantPrices",
                  as: "vp",
                  in: "$$vp.finalVariantPrice"
                }
              },
              // قیمت‌هایی که مستقیماً در productwarehouse ثبت شدند (برای واریانت/یا برای خود محصول)
              {
                $map: {
                  input: "$warehouseVariantPrices",
                  as: "wp",
                  in: "$$wp.price"
                }
              }
            ]
          }
        }
      },
      // minCandidatePrice و discountPercent و finalPrice را تعیین کن
      {
        $addFields: {
          minCandidatePrice: {
            $reduce: {
              input: "$candidatePrices",
              initialValue: { v: null },
              in: {
                v: {
                  $cond: [
                    { $or: [{ $eq: ["$$value.v", null] }, { $lt: ["$$this", "$$value.v"] }] },
                    "$$this",
                    "$$value.v"
                  ]
                }
              }
            }
          }
        }
      },
      // به دلیل ساختار reduce بالا، minCandidatePrice.v نگهدارنده مقدار واقعی است — آن را نرمال می‌کنیم:
      {
        $addFields: {
          minCandidatePrice: { $ifNull: ["$minCandidatePrice.v", "$price"] }
        }
      },
      {
        $addFields: {
          discountPercent: {
            $round: [
              {
                $multiply: [
                  {
                    $cond: [
                      { $gt: ["$price", 0] },
                      { $divide: [{ $subtract: ["$price", "$minCandidatePrice"] }, "$price"] },
                      0
                    ]
                  },
                  100
                ]
              },
              1
            ]
          },
          finalPrice: {
            $cond: [{ $gt: ["$minCandidatePrice", 0] }, "$minCandidatePrice", "$price"]
          }
        }
      },
      // پروجکت خروجی برای لیست
      {
        $project: {
          title: 1,
          price: 1,
          image: 1,
          description: 1,
          brand: 1,
          category: 1,
          totalStock: 1,
          discountPercent: 1,
          finalPrice: 1,
          variants: 1,
          warehouses: 1
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const items = await ProductModel.aggregate(pipeline);
    const count = await ProductModel.countDocuments(query);

    return { items, count, page, limit, pages: Math.ceil(count / limit),status: 200  };
  }

  async calculateFinalPrice(productId: string, variantId?: string) {
    // مرحله ۱: دریافت اطلاعات پایه محصول
    const product = await this.findById(productId);
    if (!product) throw new Error("محصول یافت نشد");

    // مرحله ۲: دریافت اطلاعات انبارهای محصول
    const warehouses = await this.productWarehouseRepo.findAll({ product: productId });

    const totalStock = warehouses.reduce((sum, w) => sum + (w.quantity || 0), 0);
    const basePrice = warehouses.length
        ? warehouses.reduce((sum, w) => sum + w.price, 0) / warehouses.length
        : product.price;

    // مرحله ۳: اگر محصول variant دارد، قیمت آن variant را بگیر
    let variantExtra = 0;
    if (variantId) {
      const variant = await this.productVariantRepo.findById(variantId);
      if (variant && variant.extraPrice) {
        variantExtra = variant.extraPrice;
      }
    }

    let priceBeforeDiscount = basePrice + variantExtra;

    // مرحله ۴: بررسی تخفیف‌های فعال
    const activeDiscounts = await this.discountRepo.getActiveDiscounts();

    // تخفیف مرتبط با محصول / دسته / برند / ویژگی
    const matchedDiscount = activeDiscounts.find((d:any) => {
      if (d.apply_to === "product" && String(d.product_id) === String(productId)) return true;
      if (d.apply_to === "category" && String(d.category_id) === String(product.category)) return true;
      if (d.apply_to === "brand" && String(d.brand_id) === String(product.brand)) return true;
      if (variantId && d.apply_to === "variant" && String(d.variant_id) === String(variantId)) return true;
      return false;
    });

    let finalPrice = priceBeforeDiscount;
    let discountAmount = 0;

    if (matchedDiscount) {
      if (matchedDiscount.type === "percent") {
        discountAmount = (priceBeforeDiscount * matchedDiscount.value) / 100;
      } else if (matchedDiscount.type === "amount") {
        discountAmount = matchedDiscount.value;
      }
      finalPrice = priceBeforeDiscount - discountAmount;
    }

    return {
      product_id: productId,
      variant_id: variantId || null,
      price_before_discount: priceBeforeDiscount,
      final_price: finalPrice,
      discount_amount: discountAmount,
      total_stock: totalStock,
      has_discount: !!matchedDiscount,
    };
  }

  /**
   * محاسبه قیمت نهایی برای چند محصول (لیست صفحه)
   */
   async calculateForList(products: any[]) {
    const result = [];
    for (const p of products) {
      const calc = await this.calculateFinalPrice(p._id);
      result.push({
        ...p._doc,
        ...calc,
      });
    }
    return result;
  }

  // async getProductList(page = 1, limit = 10, filters: any = {}, sortType?: string) {
  //   const query: any = {};
  //
  //   // فیلترها
  //   if (filters.category) query.category = filters.category;
  //   if (filters.brand) query.brand = filters.brand;
  //   if (filters.search)
  //     query.title = { $regex: filters.search, $options: "i" };
  //
  //   // مرتب‌سازی داینامیک
  //   let sort: Record<string, 1 | -1> = {};
  //   switch (sortType) {
  //     case "latest":
  //       sort = { insertDate: -1 };
  //       break;
  //     case "price_high":
  //       sort = { price: -1 };
  //       break;
  //     case "price_low":
  //       sort = { price: 1 };
  //       break;
  //     case "most_viewed":
  //       sort = { viewCount: -1 };
  //       break;
  //     case "best_seller":
  //       sort = { saleCount: -1 };
  //       break;
  //     default:
  //       sort = { insertDate: -1 };
  //       break;
  //   }
  //
  //   const skip = (page - 1) * limit;
  //   const pipeline = [
  //     { $match: query },
  //     {
  //       $lookup: {
  //         from: "productwarehouses",
  //         localField: "_id",
  //         foreignField: "product",
  //         as: "warehouses",
  //       },
  //     },
  //     {
  //       $addFields: {
  //         totalStock: { $sum: "$warehouses.quantity" },
  //         minWarehousePrice: { $min: "$warehouses.price" },
  //       },
  //     },
  //     {
  //       $addFields: {
  //         discountPercent: {
  //           $round: [
  //             {
  //               $multiply: [
  //                 {
  //                   $cond: [
  //                     { $gt: ["$minWarehousePrice", 0] },
  //                     {
  //                       $divide: [
  //                         { $subtract: ["$price", "$minWarehousePrice"] },
  //                         "$price",
  //                       ],
  //                     },
  //                     0,
  //                   ],
  //                 },
  //                 100,
  //               ],
  //             },
  //             1,
  //           ],
  //         },
  //         finalPrice: {
  //           $cond: [
  //             { $gt: ["$minWarehousePrice", 0] },
  //             "$minWarehousePrice",
  //             "$price",
  //           ],
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         title: 1,
  //         price: 1,
  //         image: 1,
  //         description: 1,
  //         brand: 1,
  //         category: 1,
  //         totalStock: 1,
  //         discountPercent: 1,
  //         finalPrice: 1,
  //         warehouses: {
  //           $map: {
  //             input: "$warehouses",
  //             as: "wh",
  //             in: {
  //               _id: "$$wh._id",
  //               quantity: "$$wh.quantity",
  //               price: "$$wh.price",
  //               variantPrice: "$$wh.variantPrice",
  //             },
  //           },
  //         },
  //       },
  //     },
  //     { $sort: sort },
  //     { $skip: skip },
  //     { $limit: limit },
  //   ];
  //
  //   const items = await ProductModel.aggregate(pipeline);
  //   const count = await ProductModel.countDocuments(query);
  //
  //   return {
  //     items,
  //     count,
  //     page,
  //     limit,
  //     pages: Math.ceil(count / limit),
  //   };
  // }

  async findById(
      id: string | Types.ObjectId,
      queryInfo?: QueryInfo | undefined,
      population?: Object[]
  ): Promise<Product | null> {
    let product: any = await super.findById(id);

    if (!product) return null;

    // واریانت‌ها
    const variants = await this.getVariantsByProduct(String(product._id));

    // انبارها شامل رکوردهای دارای variant یا بدون variant
    const warehouses = await this.productWarehouseRepo.findAll(
        { product: product._id },
        {},
        [{ path: "warehouse" }]
    );

    const totalStock = warehouses.reduce((acc: number, w: any) => acc + (w.quantity || 0), 0);

    // قیمت نهایی برای هر واریانت
    const variantPrices = variants.map((v: any) => {
      const base = v.basePrice ?? product.price;
      const adjustments = Array.isArray(v.features) ? v.features.reduce((s: number, f: any) => s + (f.priceAdjustment || 0), 0) : 0;
      let final = base + adjustments;

      // اگر در productwarehouse برای این variant قیمت ثبت شده باشه، از پایین‌ترینش استفاده کن
      const whPricesForVariant = warehouses.filter((w: any) => String(w.variant) === String(v._id)).map((w: any) => w.variantPrice).filter((p: any) => typeof p === "number");
      if (whPricesForVariant.length) final = Math.min(final, ...whPricesForVariant);

      return { variantId: v._id, sku: v.sku, finalPrice: final, base, adjustments, features: v.features };
    });

    // قیمت‌های کاندید (واریانت‌ها + قیمت‌های productwarehouse که بدون واریانت هستند)
    const candidatePrices = [
      ...variantPrices.map((vp: any) => vp.finalPrice),
      ...warehouses.filter((w: any) => !w.variant).map((w: any) => w.variantPrice || product.price)
    ].filter((p: any) => typeof p === "number" && !isNaN(p));

    const minCandidatePrice = candidatePrices.length ? Math.min(...candidatePrices) : product.price;
    const discountPercent = minCandidatePrice < product.price ? Math.round(((product.price - minCandidatePrice) / product.price) * 100) : 0;
    const finalPrice = minCandidatePrice;

    product.variants = variantPrices;
    product.warehouses = warehouses;
    product.totalStock = totalStock;
    product.discountPercent = discountPercent;
    product.finalPrice = finalPrice;

    return product;
  }




  // async findById(
  //   id: string | Types.ObjectId,
  //   queryInfo?: QueryInfo | undefined,
  //   population?: Object[]
  // ): Promise<Product | null> {
  //   // console.log(id);
  //   // let product:
  //   //   | (Product & {
  //   //       warehouses?: Productwarehouse[];
  //   //     })
  //   //   | null = await super.findById(id);
  //
  //   let product: any = await super.findById(id);
  //
  //   if (product != null)
  //     product.warehouses = await this.productWarehouseRepo.findAll(
  //       {
  //         product: product._id,
  //       },
  //       {},
  //       [
  //         {
  //           path: "warehouse",
  //         },
  //       ]
  //     );
  //
  //   return product;
  // }


}
// console.log("haj meiti");
