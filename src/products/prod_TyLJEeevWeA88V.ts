import { sendEmail } from '../utils/email';

export const handleProduct = async (productId: string, customerEmail: string) => {
  console.log(`[prod_TyLJEeevWeA88V] Processing for ${customerEmail}`);
  // Product-specific logic here

  await sendEmail('noreply@svethappy.com', customerEmail, 'Your Order Confirmation', `<p>Thank you for purchasing product ${productId}!</p>`); 
};
