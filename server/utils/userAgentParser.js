const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  
  // Device detection
  let device = 'Desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
    device = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    device = 'Mobile';
  }

  // Browser detection
  let browser = 'Other';
  if (/Chrome/.test(ua)) {
    browser = 'Chrome';
  } else if (/Firefox/.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari/.test(ua)) {
    browser = 'Safari';
  } else if (/Edge/.test(ua)) {
    browser = 'Edge';
  } else if (/Opera|OPR/.test(ua)) {
    browser = 'Opera';
  } else if (/MSIE|Trident/.test(ua)) {
    browser = 'Internet Explorer';
  }

  return { device, browser };
};

module.exports = { parseUserAgent };