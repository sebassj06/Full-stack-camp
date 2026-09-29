const { sum } = require("./math.js");

const result = sum(2, 3);
console.log(result);

// en math.js
const sum = (a, b) => a + b;
module.exports = { sum };
