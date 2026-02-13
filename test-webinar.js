require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

const { handleProduct } = require('./src/products/prod_Tx89OR3aYHSh1n.ts');

// Test the function with a specific email
const testEmail = process.argv[2] || 'novice@gmail.com';
const productId = 'prod_Tx89OR3aYHSh1n';

console.log(`Testing webinar registration for: ${testEmail}`);

handleProduct(productId, testEmail)
  .then(() => {
    console.log('✓ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Test failed:', error);
    process.exit(1);
  });
