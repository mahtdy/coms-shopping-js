"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userPart = void 0;
const ticket_1 = __importDefault(require("../../core/mongoose-controller/controllers/user/ticket"));
const part_1 = __importDefault(require("../../core/part"));
const account_1 = __importDefault(require("./controllers/account"));
const basket_1 = __importDefault(require("./controllers/basket"));
// import content from "./controllers/content";
const login_1 = __importDefault(require("./login"));
const order_1 = __importDefault(require("./controllers/order"));
const discount_1 = __importDefault(require("./controllers/discount"));
const product_1 = __importDefault(require("./controllers/product"));
exports.userPart = new part_1.default("/user", {
    controllers: [
        account_1.default,
        ticket_1.default,
        basket_1.default,
        order_1.default,
        product_1.default,
        discount_1.default,
        // content
    ],
    logInController: login_1.default,
});
