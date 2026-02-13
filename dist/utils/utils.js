"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePassword = void 0;
const generatePassword = (length = 6) => {
    let sequence = '';
    for (let i = 0; i < length; i++) {
        sequence += Math.floor(Math.random() * 10);
    }
    return sequence;
};
exports.generatePassword = generatePassword;
//# sourceMappingURL=utils.js.map