"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staticImplements = staticImplements;
// interface MyTypeStatic {
//     staticMethod(): any;
// }
/* class decorator */
function staticImplements() {
    return (constructor) => constructor;
}
