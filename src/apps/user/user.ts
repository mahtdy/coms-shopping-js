import ticket from "../../core/mongoose-controller/controllers/user/ticket";
import Part from "../../core/part";
import account from "./controllers/account";
import basket from "./controllers/basket";
// import content from "./controllers/content";
import login from "./login";
import order from "./controllers/order";
import discount from "./controllers/discount";
import product from "./controllers/product";
import review from "./controllers/review";
import returnController from "./controllers/return";

export var userPart = new Part("/user", {
  controllers: [
    account,
    ticket,
    basket,
    order,
    product,
    discount,
    review,
    returnController,
    // content
  ],
  logInController: login,
});
