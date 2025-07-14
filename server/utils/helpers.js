const generateShortCode = () => {
  // Implement your short code generation logic
  return Math.random().toString(36).substring(2, 10);
};

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;  
  }
};

module.exports = {
  generateShortCode,
  isValidUrl
};