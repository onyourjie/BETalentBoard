import bcrypt from 'bcrypt';

/**
 * Hash password menggunakan bcrypt
 * @param {String} password - Password yang mau di-hash
 * @returns {String} - Hashed password
 */
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password dengan hash
 * @param {String} password - Password plain text
 * @param {String} hashedPassword - Password yang sudah di-hash
 * @returns {Boolean} - True jika password cocok
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};