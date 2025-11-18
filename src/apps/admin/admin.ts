import Part from "../../core/part";

import log from "../../core/mongoose-controller/controllers/log";
import login from "./login";
import smsConfig from "../../core/mongoose-controller/controllers/smsConfig";
import emailConfig from "../../core/mongoose-controller/controllers/emailConfig";
import fileManagerConfig from "../../core/mongoose-controller/controllers/fileManagerConfig";
import account from "./controllers/account";
import smsTemplate from "../../core/mongoose-controller/controllers/smsTemplate";
import emailTemplate from "../../core/mongoose-controller/controllers/emailTemplate";
import fileManager from "./controllers/fileManager";
import fileManagerPermission from "../../core/mongoose-controller/controllers/fileManagerPermission";
import backup from "../../core/mongoose-controller/controllers/backup";
import backupLog from "../../core/mongoose-controller/controllers/backupLog";
import category from "../../core/mongoose-controller/controllers/category";
import categoryMap from "../../core/mongoose-controller/controllers/categoryMap";
import dataTableConfig from "../../core/mongoose-controller/controllers/dataTableConfig";
import adminCdnPermission from "../../core/mongoose-controller/controllers/adminCdnPermission";
import systemConfig from "../../core/mongoose-controller/controllers/systemConfig";
import article from "./controllers/article";
import seoContentController from "../../core/mongoose-controller/controllers/content";
import parser from "../../core/express/middlewares/parseer";
import linktag from "../../core/mongoose-controller/controllers/linkTag";
import ticket from "../../core/mongoose-controller/controllers/ticket";
import redirect from "../../core/mongoose-controller/controllers/redirect";
import notFoundLog from "../../core/mongoose-controller/controllers/notFoundLog";
import author from "../../core/mongoose-controller/controllers/author";
import backlink from "../../core/mongoose-controller/controllers/backlink";
import customerCategory from "../../core/mongoose-controller/controllers/customerCategory";
import department from "../../core/mongoose-controller/controllers/department";
import ticketPreText from "../../core/mongoose-controller/controllers/ticketPreText";
import ticketPreTextCategory from "../../core/mongoose-controller/controllers/ticketPreTextCategory";
import apikey from "../../core/mongoose-controller/controllers/apikey";
import notificationConfig from "../../core/mongoose-controller/controllers/notificationConfig";
import action from "../../core/mongoose-controller/controllers/action";
import user from "./controllers/user";
import dbSchema from "../../core/mongoose-controller/controllers/dbschema";
// import role from "../admin/controllers/role"
import admins from "./controllers/admin";
import moduleAction from "../../core/mongoose-controller/moduleAction";
import language from "../../core/mongoose-controller/controllers/language";
import categoryContent from "../../core/mongoose-controller/controllers/categoryContent";
// import translator from "../../core/controllers/translator";
import template from "../../core/mongoose-controller/controllers/template";
import templateConfig from "../../core/mongoose-controller/controllers/templateConfig";
import videoQueue from "../../core/mongoose-controller/controllers/videoQueue";
import videoConfig from "../../core/mongoose-controller/controllers/videoConfig";
import queryMaker from "../../core/mongoose-controller/controllers/queryMaker";
import product from "../admin/controllers/product";
import brand from "../admin/controllers/brand";
import warranty from "../admin/controllers/warranty";
// import watermark from "../../core/mongoose-controller/controllers/waterMarkComfig";
import {
    hamberger,
    header,
    menu,
    nav,
} from "../../core/mongoose-controller/controllers/block";
import productwarehouse from "../admin/controllers/productwarehouse";
import warehouse from "../admin/controllers/warehouse";
import basket from "../admin/controllers/basket";
import order from "../admin/controllers/order";
import discount from "../admin/controllers/discount";
import address from "../admin/controllers/address";
// import brandFeatureValues from "../admin/controllers/brandFeatureValues";
// import productVariant from "../admin/controllers/productVariant";
import courier from "./controllers/courier";
import productVariant from "./controllers/productVariant";
import productWarranty from "./controllers/productWarranty";

category.log = true;
article.addMiddlewares("/content/video", "post", parser("youtube"));
article.addMiddlewares("/content/video", "post", parser("aparat"));

/// enable login
admins.loginRequired = true;
// role.loginRequired = true
moduleAction.loginRequired = true;
// translator.loginRequired = true;
language.loginRequired = true;
apikey.loginRequired = true;
article.loginRequired = true;
template.loginRequired = true;
templateConfig.loginRequired = true;
queryMaker.loginRequired = true;
categoryContent.loginRequired = true;
videoQueue.loginRequired = true;
videoConfig.loginRequired = true;
action.loginRequired = true;
dbSchema.loginRequired = true;
user.loginRequired = true;
redirect.loginRequired = true;
notFoundLog.loginRequired = true;
notificationConfig.loginRequired = true;
ticket.loginRequired = true;
ticketPreText.loginRequired = true;
ticketPreTextCategory.loginRequired = true;
seoContentController.loginRequired = true;
linktag.loginRequired = true;
category.loginRequired = true;
backlink.loginRequired = true;
author.loginRequired = true;
categoryMap.loginRequired = true;
department.loginRequired = true;
customerCategory.loginRequired = true;
dataTableConfig.loginRequired = true;
fileManager.loginRequired = true;
account.loginRequired = true;
smsConfig.loginRequired = true;
smsTemplate.loginRequired = true;
emailConfig.loginRequired = true;
emailTemplate.loginRequired = true;
fileManagerConfig.loginRequired = true;
fileManagerPermission.loginRequired = true;
adminCdnPermission.loginRequired = true;
systemConfig.loginRequired = true;
backup.loginRequired = true;
backupLog.loginRequired = true;
log.loginRequired = true;
product.loginRequired = true;
// variant.loginRequired = true;

export var adminPart = new Part("/admin", {
    controllers: [
        // admins,
        product,
        brand,
        productwarehouse,
        warehouse,
        basket,
        order,
        discount,
        address,
        warranty,
        address,
        courier,
        productVariant,
        productWarranty,

        // productDiscount,
        // brandFeatureValues,


        // variant,
        // role,
        // moduleAction,
        // translator,
        // language,
        // apikey,
        article,
        // watermark,
        // template,
        // templateConfig,

        //blocks

        // menu,
        // hamberger,
        // nav,
        // header,

        // queryMaker,
        categoryContent,
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
    logInController: login,
});
