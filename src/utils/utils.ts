export const generatePassword = (length=6 )=>{
  let sequence = '';
  for (let i = 0; i < length; i++) {
    sequence += Math.floor(Math.random() * 10);
  }
  return sequence;
}