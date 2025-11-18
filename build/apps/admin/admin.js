"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPart = void 0;
const part_1 = __importDefault(require("../../core/part"));
const log_1 = __importDefault(require("../../core/mongoose-controller/controllers/log"));
const login_1 = __importDefault(require("./login"));
const smsConfig_1 = __importDefault(require("../../core/mongoose-controller/controllers/smsConfig"));
const emailConfig_1 = __importDefault(require("../../core/mongoose-controller/controllers/emailConfig"));
const fileManagerConfig_1 = __importDefault(require("../../core/mongoose-controller/controllers/fileManagerConfig"));
const account_1 = __importDefault(require("./controllers/account"));
const smsTemplate_1 = __importDefault(require("../../core/mongoose-controller/controllers/smsTemplate"));
const emailTemplate_1 = __importDefault(require("../../core/mongoose-controller/controllers/emailTemplate"));
const fileManager_1 = __importDefault(require("./controllers/fileManager"));
const fileManagerPermission_1 = __importDefault(require("../../core/mongoose-controller/controllers/fileManagerPermission"));
const backup_1 = __importDefault(require("../../core/mongoose-controller/controllers/backup"));
const backupLog_1 = __importDefault(require("../../core/mongoose-controller/controllers/backupLog"));
const category_1 = __importDefault(require("../../core/mongoose-controller/controllers/category"));
const categoryMap_1 = __importDefault(require("../../core/mongoose-controller/controllers/categoryMap"));
const dataTableConfig_1 = __importDefault(require("../../core/mongoose-controller/controllers/dataTableConfig"));
const adminCdnPermission_1 = __importDefault(require("../../core/mongoose-controller/controllers/adminCdnPermission"));
const systemConfig_1 = __importDefault(require("../../core/mongoose-controller/controllers/systemConfig"));
const article_1 = __importDefault(require("./controllers/article"));
const content_1 = __importDefault(require("../../core/mongoose-controller/controllers/content"));
const parseer_1 = __importDefault(require("../../core/express/middlewares/parseer"));
const linkTag_1 = __importDefault(require("../../core/mongoose-controller/controllers/linkTag"));
const ticket_1 = __importDefault(require("../../core/mongoose-controller/controllers/ticket"));
const redirect_1 = __importDefault(require("../../core/mongoose-controller/controllers/redirect"));
const notFoundLog_1 = __importDefault(require("../../core/mongoose-controller/controllers/notFoundLog"));
const author_1 = __importDefault(require("../../core/mongoose-controller/controllers/author"));
const backlink_1 = __importDefault(require("../../core/mongoose-controller/controllers/backlink"));
const customerCategory_1 = __importDefault(require("../../core/mongoose-controller/controllers/customerCategory"));
const department_1 = __importDefault(require("../../core/mongoose-controller/controllers/department"));
const ticketPreText_1 = __importDefault(require("../../core/mongoose-controller/controllers/ticketPreText"));
const ticketPreTextCategory_1 = __importDefault(require("../../core/mongoose-controller/controllers/ticketPreTextCategory"));
const apikey_1 = __importDefault(require("../../core/mongoose-controller/controllers/apikey"));
const notificationConfig_1 = __importDefault(require("../../core/mongoose-controller/controllers/notificationConfig"));
const action_1 = __importDefault(require("../../core/mongoose-controller/controllers/action"));
const user_1 = __importDefault(require("./controllers/user"));
const dbschema_1 = __importDefault(require("../../core/mongoose-controller/controllers/dbschema"));
// import role from "../admin/controllers/role"
const admin_1 = __importDefault(require("./controllers/admin"));
const moduleAction_1 = __importDefault(require("../../core/mongoose-controller/moduleAction"));
const language_1 = __importDefault(require("../../core/mongoose-controller/controllers/language"));
const categoryContent_1 = __importDefault(require("../../core/mongoose-controller/controllers/categoryContent"));
// import translator from "../../core/controllers/translator";
const template_1 = __importDefault(require("../../core/mongoose-controller/controllers/template"));
const templateConfig_1 = __importDefault(require("../../core/mongoose-controller/controllers/templateConfig"));
const videoQueue_1 = __importDefault(require("../../core/mongoose-controller/controllers/videoQueue"));
const videoConfig_1 = __importDefault(require("../../core/mongoose-controller/controllers/videoConfig"));
const queryMaker_1 = __importDefault(require("../../core/mongoose-controller/controllers/queryMaker"));
const product_1 = __importDefault(require("../admin/controllers/product"));
const brand_1 = __importDefault(require("../admin/controllers/brand"));
const warranty_1 = __importDefault(require("../admin/controllers/warranty"));
const productwarehouse_1 = __importDefault(require("../admin/controllers/productwarehouse"));
const warehouse_1 = __importDefault(require("../admin/controllers/warehouse"));
const basket_1 = __importDefault(require("../admin/controllers/basket"));
const order_1 = __importDefault(require("../admin/controllers/order"));
const discount_1 = __importDefault(require("../admin/controllers/discount"));
const address_1 = __importDefault(require("../admin/controllers/address"));
// import brandFeatureValues from "../admin/controllers/brandFeatureValues";
// import productVariant from "../admin/controllers/productVariant";
const courier_1 = __importDefault(require("./controllers/courier"));
const productVariant_1 = __importDefault(require("./controllers/productVariant"));
const productWarranty_1 = __importDefault(require("./controllers/productWarranty"));
category_1.default.log = true;
article_1.default.addMiddlewares("/content/video", "post", (0, parseer_1.default)("youtube"));
article_1.default.addMiddlewares("/content/video", "post", (0, parseer_1.default)("aparat"));
/// enable login
admin_1.default.loginRequired = true;
// role.loginRequired = true
moduleAction_1.default.loginRequired = true;
// translator.loginRequired = true;
language_1.default.loginRequired = true;
apikey_1.default.loginRequired = true;
article_1.default.loginRequired = true;
template_1.default.loginRequired = true;
templateConfig_1.default.loginRequired = true;
queryMaker_1.default.loginRequired = true;
categoryContent_1.default.loginRequired = true;
videoQueue_1.default.loginRequired = true;
videoConfig_1.default.loginRequired = true;
action_1.default.loginRequired = true;
dbschema_1.default.loginRequired = true;
user_1.default.loginRequired = true;
redirect_1.default.loginRequired = true;
notFoundLog_1.default.loginRequired = true;
notificationConfig_1.default.loginRequired = true;
ticket_1.default.loginRequired = true;
ticketPreText_1.default.loginRequired = true;
ticketPreTextCategory_1.default.loginRequired = true;
content_1.default.loginRequired = true;
linkTag_1.default.loginRequired = true;
category_1.default.loginRequired = true;
backlink_1.default.loginRequired = true;
author_1.default.loginRequired = true;
categoryMap_1.default.loginRequired = true;
department_1.default.loginRequired = true;
customerCategory_1.default.loginRequired = true;
dataTableConfig_1.default.loginRequired = true;
fileManager_1.default.loginRequired = true;
account_1.default.loginRequired = true;
smsConfig_1.default.loginRequired = true;
smsTemplate_1.default.loginRequired = true;
emailConfig_1.default.loginRequired = true;
emailTemplate_1.default.loginRequired = true;
fileManagerConfig_1.default.loginRequired = true;
fileManagerPermission_1.default.loginRequired = true;
adminCdnPermission_1.default.loginRequired = true;
systemConfig_1.default.loginRequired = true;
backup_1.default.loginRequired = true;
backupLog_1.default.loginRequired = true;
log_1.default.loginRequired = true;
product_1.default.loginRequired = true;
// variant.loginRequired = true;
exports.adminPart = new part_1.default("/admin", {
    controllers: [
        // admins,
        product_1.default,
        brand_1.default,
        productwarehouse_1.default,
        warehouse_1.default,
        basket_1.default,
        order_1.default,
        discount_1.default,
        address_1.default,
        warranty_1.default,
        address_1.default,
        courier_1.default,
        productVariant_1.default,
        productWarranty_1.default,
        // productDiscount,
        // brandFeatureValues,
        // variant,
        // role,
        // moduleAction,
        // translator,
        // language,
        // apikey,
        article_1.default,
        // watermark,
        // template,
        // templateConfig,
        //blocks
        // menu,
        // hamberger,
        // nav,
        // header,
        // queryMaker,
        categoryContent_1.default,
        // videoQueue,
        // videoConfig,
        // action,
        // dbSchema,
        // user,
        // redirect,
        // notFoundLog,
        // notificationConfig,
        // ticket,
        // ticketPreText,
        // ticketPreTextCategory,
        // seoContentController,
        // linktag,
        // category,
        // backlink,
        // author,
        // categoryMap,
        // department,
        // customerCategory,
        // dataTableConfig,
        // fileManager,
        // account,
        // smsConfig,
        // smsTemplate,
        // emailConfig,
        // emailTemplate,
        // fileManagerConfig,
        // fileManagerPermission,
        // adminCdnPermission,
        // systemConfig,
        // backup,
        // backupLog,
        // log,
    ],
    logInController: login_1.default,
});
