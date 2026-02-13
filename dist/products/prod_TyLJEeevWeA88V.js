"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleProduct = void 0;
const email_1 = require("../utils/email");
const handleProduct = async (productId, customerEmail) => {
    console.log(`[prod_TyLJEeevWeA88V] Processing for ${customerEmail}`);
    // Product-specific logic here
    await (0, email_1.sendEmail)('noreply@svethappy.com', customerEmail, 'Your Order Confirmation', `<p>Thank you for purchasing product ${productId}!</p>`);
};
exports.handleProduct = handleProduct;
//# sourceMappingURL=prod_TyLJEeevWeA88V.js.map