"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = void 0;
exports.actions = {
    content: [
        {
            name: "insert",
            type: "boolean",
            showTitle: "درج محتوا",
            value: false
        },
        {
            name: "manageSeo",
            type: "boolean",
            showTitle: "مدیریت سئو",
            related: "insert",
            value: false
        },
        {
            name: "questionManage",
            type: "boolean",
            showTitle: "مدیریت پرسش و پاسخ",
            related: "insert",
            value: false
        },
        {
            name: "socialManage",
            type: "boolean",
            showTitle: "مدیریت شبکه‌های اجتماعی",
            related: "insert",
            value: false
        },
        {
            name: "delete",
            type: "boolean",
            showTitle: "حذف محتوا",
            value: false
        },
        {
            name: "update",
            type: "boolean",
            showTitle: "آپدیت محتوا",
            value: false
        },
        {
            name: "contentType",
            type: "list",
            options: ["مقاله", "ویدیویی", "گالری", "پادکست", "جامع", "همه"],
            showTitle: "نوع محتوا",
            value: []
        },
        {
            name: "manageSub",
            showTitle: "مدیریت زیر نویس",
            type: "boolean",
            value: false,
            optionRelated: {
                option: "ویدیویی",
                related: "contentType"
            }
        },
        {
            name: "publish",
            type: "boolean",
            showTitle: "انتشار محتوا",
            value: false
        },
        {
            name: "exportPDF",
            type: "boolean",
            showTitle: "خروجی pdf",
            value: false
        },
        {
            name: "exportExcel",
            type: "boolean",
            showTitle: "خروجی excel",
            value: false
        },
        {
            name: "exportCSV",
            type: "boolean",
            showTitle: "خروجی csv",
            value: false
        },
        {
            name: "datatableManage",
            type: "boolean",
            showTitle: "شخصی سازی ستون",
            value: false
        },
        {
            name: "linkManage",
            type: "boolean",
            showTitle: "مدیریت لینک سازی",
            value: false
        },
        {
            name: "analyseContent",
            type: "boolean",
            showTitle: "تحلیل محتوا",
            value: false
        },
        {
            name: "manageTemplate",
            type: "boolean",
            showTitle: "مدیریت قالب",
            value: false
        },
        {
            name: "manageLanguage",
            type: "autoComplate",
            autoComplate: "/language/search?page=1&limit=10&title$reg=",
            showTitle: "محدود کردن زبان",
            value: []
        },
        {
            name: "manageCategory",
            type: "autoComplate",
            autoComplate: "/categorys/search?page=1&limit=10&title$reg=",
            showTitle: "محدود کردن دسته‌بندی",
            value: []
        },
        {
            name: "publisher",
            showTitle: "انتشار‌‌‌‌‌‌‌ دهنده",
            type: "autoComplateEQ",
            value: "",
            relatedNot: "publish",
            autoComplate: "/admins/publisher?name="
        }
    ],
    fileManagerConfig: [
        {
            name: "insert",
            showTitle: "درج",
            type: "boolean",
            value: false
        },
        {
            name: "type",
            showTitle: "نوع",
            type: "list",
            options: ["ftp", "objectStorage"],
            value: []
        },
        {
            name: "delete",
            showTitle: "حذف",
            type: "boolean",
            value: false
        },
        {
            name: "edit",
            showTitle: "ویرایش",
            type: "boolean",
            value: false
        },
        {
            name: "changeStatus",
            showTitle: "فعال و غیر فعال کردن",
            type: "boolean",
            value: false
        },
    ],
    SMSConfig: [
        {
            name: "insert",
            showTitle: "درج",
            type: "boolean",
            value: false
        },
        {
            name: "type",
            showTitle: "نوع",
            type: "list",
            options: [
                "kasbarg",
                "sms",
                "sabapayamak",
                "farapayamak",
                "payam-resan",
                "mediapayamak",
                "kavenegar",
                "parsgreen",
                "hiro-sms",
                "niksms",
                "smspanel",
                "mellipayamak"
            ],
            value: []
        },
        {
            name: "delete",
            showTitle: "حذف",
            type: "boolean",
            value: false
        },
        {
            name: "edit",
            showTitle: "ویرایش",
            type: "boolean",
            value: false
        },
        {
            name: "changeStatus",
            showTitle: "فعال و غیر فعال کردن",
            type: "boolean",
            value: false
        },
        {
            name: "showSendList",
            showTitle: "مشاهده لیست ارسال",
            type: "boolean",
            value: false
        },
    ],
    emailConfig: [
        {
            name: "insert",
            showTitle: "درج",
            type: "boolean",
            value: false
        },
        {
            name: "type",
            showTitle: "نوع",
            type: "list",
            options: [
                "smtp",
                "other"
            ],
            value: []
        },
        {
            name: "delete",
            showTitle: "حذف",
            type: "boolean",
            value: false
        },
        {
            name: "edit",
            showTitle: "ویرایش",
            type: "boolean",
            value: false
        },
        {
            name: "changeStatus",
            showTitle: "فعال و غیر فعال کردن",
            type: "boolean",
            value: false
        },
        // {
        //     name: "showSendList",
        //     showTitle: "مشاهده لیست ارسال",
        //     type: "boolean",
        //     value: false
        // },
    ],
    payPortConfig: [
        {
            name: "insert",
            showTitle: "درج",
            type: "boolean",
            value: false
        },
        {
            name: "type",
            showTitle: "نوع",
            type: "list",
            options: [
                "پاساردگاد",
                "پارسیان",
                "ملی",
                "ملت",
                "اقتصاد نوین",
                "سامان",
                " آسان پرداخت-آپ",
                "صادرات",
                "پی",
                "آیدی پی",
                "نکس پی",
                "زرین پال",
            ],
            value: []
        },
        {
            name: "delete",
            showTitle: "حذف",
            type: "boolean",
            value: false
        },
        {
            name: "edit",
            showTitle: "ویرایش",
            type: "boolean",
            value: false
        },
        {
            name: "changeStatus",
            showTitle: "فعال و غیر فعال کردن",
            type: "boolean",
            value: false
        },
        {
            name: "changePayOrder",
            showTitle: "تغییر ترتیب پرداخت",
            type: "boolean",
            value: false
        },
        {
            name: "showPortTarnsactions",
            showTitle: "نمایش ریز پرداخت ها",
            type: "boolean",
            value: false
        }
    ],
    bankAccount: [
        {
            name: "insert",
            showTitle: "درج",
            type: "boolean",
            value: false
        },
        {
            name: "delete",
            showTitle: "حذف",
            type: "boolean",
            value: false
        },
        {
            name: "edit",
            showTitle: "ویرایش",
            type: "boolean",
            value: false
        },
        {
            name: "changeStatus",
            showTitle: "فعال و غیر فعال کردن",
            type: "boolean",
            value: false
        },
        {
            name: "showAccountDetail",
            showTitle: "نمایش ریز حساب",
            type: "boolean",
            value: false
        },
    ]
};
// const role = new RoleController("/role", new RoleRepository(), {
//     adminRepo: new AdminRepository({
//         model: AdminModel
//     }),
//     insertSchema: z.object({
//         name: z.string(),
//         parent: BaseController.id.optional()
//     }),
//     searchFilters: {
//         name: ["reg"],
//         createAt: ["gte", "lte"],
//         _id: ["list", "eq"]
//     },
//     paginationConfig: {
//         fields: {
//             name: {
//                 en_title: "name",
//                 fa_title: "عنوان",
//                 type: "string",
//                 sortOrderKey: false,
//                 filters: ["reg"],
//                 isAutoComplate: false,
//                 isOptional: false
//             },
//             createAt: {
//                 en_title: "createAt",
//                 fa_title: "تاریخ ایجاد",
//                 type: "date",
//                 sortOrderKey: false,
//                 filters: ["gte", "lte"],
//                 isAutoComplate: false,
//                 isOptional: false
//             },
//             parent: {
//                 en_title: "parent",
//                 fa_title: "والد",
//                 type: "string",
//                 object_value: ["name"],
//                 target_func : "v1",
//                 sortOrderKey: false,
//                 isOptional: true,
//                 isAutoComplate: true,
//                 filters: ["reg"],
//                 autoComplete: {
//                     key: "name$reg",
//                     target_idKey: "_id",    
//                     target_func: "v1",
//                     url: "/roles?",
//                     isopen_sub: false,
//                     values: [],
//                     target_value: "name",
//                     fields : ["name"]
//                 }
//             }
//         },
//         actions: [{
//             type: "setting",
//             api: "",
//             route: "/panel/permission",
//             queryName : "roleid"
//         }],
//         paginationUrl: "/roles",
//         searchUrl: "/roles",
//         auto_search_url: "/roles?",
//         auto_search_key: "name$reg",
//         auto_search_title: 'عنوان نقش',
//         auto_filter_name: 'name',
//         auto_search_submit: '_id$list',
//         auto_filter_idKey: '_id',
//         serverType: "",
//         tableLabel: "roles"
//     },
//     actions
// })
// export default role
