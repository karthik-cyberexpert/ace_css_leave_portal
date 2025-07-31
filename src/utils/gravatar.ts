/**
 * Simple MD5 hash implementation for browser compatibility
 * @param str - String to hash
 * @returns MD5 hash in hex format
 */
function md5(str: string): string {
  // Proper MD5 implementation for Gravatar
  // This is a simplified but working MD5 implementation
  
  function rotateLeft(value: number, amount: number): number {
    return (value << amount) | (value >>> (32 - amount));
  }
  
  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }
  
  function F(x: number, y: number, z: number): number {
    return (x & y) | ((~x) & z);
  }
  
  function G(x: number, y: number, z: number): number {
    return (x & z) | (y & (~z));
  }
  
  function H(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }
  
  function I(x: number, y: number, z: number): number {
    return y ^ (x | (~z));
  }
  
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  
  function convertToWordArray(str: string): number[] {
    const wordArray: number[] = [];
    const len = str.length;
    
    for (let i = 0; i < len; i += 4) {
      wordArray.push(
        (str.charCodeAt(i) << 0) |
        ((i + 1 < len ? str.charCodeAt(i + 1) : 0) << 8) |
        ((i + 2 < len ? str.charCodeAt(i + 2) : 0) << 16) |
        ((i + 3 < len ? str.charCodeAt(i + 3) : 0) << 24)
      );
    }
    
    return wordArray;
  }
  
  function wordToHex(lValue: number): string {
    let wordToHexValue = '';
    for (let i = 0; i <= 3; i++) {
      const byte = (lValue >>> (i * 8)) & 255;
      wordToHexValue += byte.toString(16).padStart(2, '0');
    }
    return wordToHexValue;
  }
  
  // Convert string to UTF-8 and add padding
  const utf8Str = unescape(encodeURIComponent(str));
  const len = utf8Str.length;
  const paddedStr = utf8Str + '\x80' + '\x00'.repeat((55 - (len % 64)) % 64);
  
  const wordArray = convertToWordArray(paddedStr);
  
  // Append length in bits
  wordArray.push(len * 8);
  wordArray.push(0);
  
  // Initialize MD5 buffer
  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;
  
  // Process message in 512-bit chunks
  for (let i = 0; i < wordArray.length; i += 16) {
    const chunk = wordArray.slice(i, i + 16);
    
    let a = h0, b = h1, c = h2, d = h3;
    
    // Round 1
    a = FF(a, b, c, d, chunk[0], 7, 0xD76AA478);
    d = FF(d, a, b, c, chunk[1], 12, 0xE8C7B756);
    c = FF(c, d, a, b, chunk[2], 17, 0x242070DB);
    b = FF(b, c, d, a, chunk[3], 22, 0xC1BDCEEE);
    a = FF(a, b, c, d, chunk[4], 7, 0xF57C0FAF);
    d = FF(d, a, b, c, chunk[5], 12, 0x4787C62A);
    c = FF(c, d, a, b, chunk[6], 17, 0xA8304613);
    b = FF(b, c, d, a, chunk[7], 22, 0xFD469501);
    a = FF(a, b, c, d, chunk[8], 7, 0x698098D8);
    d = FF(d, a, b, c, chunk[9], 12, 0x8B44F7AF);
    c = FF(c, d, a, b, chunk[10], 17, 0xFFFF5BB1);
    b = FF(b, c, d, a, chunk[11], 22, 0x895CD7BE);
    a = FF(a, b, c, d, chunk[12], 7, 0x6B901122);
    d = FF(d, a, b, c, chunk[13], 12, 0xFD987193);
    c = FF(c, d, a, b, chunk[14], 17, 0xA679438E);
    b = FF(b, c, d, a, chunk[15], 22, 0x49B40821);
    
    // Round 2
    a = GG(a, b, c, d, chunk[1], 5, 0xF61E2562);
    d = GG(d, a, b, c, chunk[6], 9, 0xC040B340);
    c = GG(c, d, a, b, chunk[11], 14, 0x265E5A51);
    b = GG(b, c, d, a, chunk[0], 20, 0xE9B6C7AA);
    a = GG(a, b, c, d, chunk[5], 5, 0xD62F105D);
    d = GG(d, a, b, c, chunk[10], 9, 0x02441453);
    c = GG(c, d, a, b, chunk[15], 14, 0xD8A1E681);
    b = GG(b, c, d, a, chunk[4], 20, 0xE7D3FBC8);
    a = GG(a, b, c, d, chunk[9], 5, 0x21E1CDE6);
    d = GG(d, a, b, c, chunk[14], 9, 0xC33707D6);
    c = GG(c, d, a, b, chunk[3], 14, 0xF4D50D87);
    b = GG(b, c, d, a, chunk[8], 20, 0x455A14ED);
    a = GG(a, b, c, d, chunk[13], 5, 0xA9E3E905);
    d = GG(d, a, b, c, chunk[2], 9, 0xFCEFA3F8);
    c = GG(c, d, a, b, chunk[7], 14, 0x676F02D9);
    b = GG(b, c, d, a, chunk[12], 20, 0x8D2A4C8A);
    
    // Round 3
    a = HH(a, b, c, d, chunk[5], 4, 0xFFFA3942);
    d = HH(d, a, b, c, chunk[8], 11, 0x8771F681);
    c = HH(c, d, a, b, chunk[11], 16, 0x6D9D6122);
    b = HH(b, c, d, a, chunk[14], 23, 0xFDE5380C);
    a = HH(a, b, c, d, chunk[1], 4, 0xA4BEEA44);
    d = HH(d, a, b, c, chunk[4], 11, 0x4BDECFA9);
    c = HH(c, d, a, b, chunk[7], 16, 0xF6BB4B60);
    b = HH(b, c, d, a, chunk[10], 23, 0xBEBFBC70);
    a = HH(a, b, c, d, chunk[13], 4, 0x289B7EC6);
    d = HH(d, a, b, c, chunk[0], 11, 0xEAA127FA);
    c = HH(c, d, a, b, chunk[3], 16, 0xD4EF3085);
    b = HH(b, c, d, a, chunk[6], 23, 0x04881D05);
    a = HH(a, b, c, d, chunk[9], 4, 0xD9D4D039);
    d = HH(d, a, b, c, chunk[12], 11, 0xE6DB99E5);
    c = HH(c, d, a, b, chunk[15], 16, 0x1FA27CF8);
    b = HH(b, c, d, a, chunk[2], 23, 0xC4AC5665);
    
    // Round 4
    a = II(a, b, c, d, chunk[0], 6, 0xF4292244);
    d = II(d, a, b, c, chunk[7], 10, 0x432AFF97);
    c = II(c, d, a, b, chunk[14], 15, 0xAB9423A7);
    b = II(b, c, d, a, chunk[5], 21, 0xFC93A039);
    a = II(a, b, c, d, chunk[12], 6, 0x655B59C3);
    d = II(d, a, b, c, chunk[3], 10, 0x8F0CCC92);
    c = II(c, d, a, b, chunk[10], 15, 0xFFEFF47D);
    b = II(b, c, d, a, chunk[1], 21, 0x85845DD1);
    a = II(a, b, c, d, chunk[8], 6, 0x6FA87E4F);
    d = II(d, a, b, c, chunk[15], 10, 0xFE2CE6E0);
    c = II(c, d, a, b, chunk[6], 15, 0xA3014314);
    b = II(b, c, d, a, chunk[13], 21, 0x4E0811A1);
    a = II(a, b, c, d, chunk[4], 6, 0xF7537E82);
    d = II(d, a, b, c, chunk[11], 10, 0xBD3AF235);
    c = II(c, d, a, b, chunk[2], 15, 0x2AD7D2BB);
    b = II(b, c, d, a, chunk[9], 21, 0xEB86D391);
    
    h0 = addUnsigned(h0, a);
    h1 = addUnsigned(h1, b);
    h2 = addUnsigned(h2, c);
    h3 = addUnsigned(h3, d);
  }
  
  return wordToHex(h0) + wordToHex(h1) + wordToHex(h2) + wordToHex(h3);
}

/**
 * Generate a Gravatar URL for the given email address
 * @param email - The email address to generate Gravatar for
 * @param size - The size of the avatar (default: 200)
 * @param defaultImage - Default image type if no Gravatar exists (default: 'identicon')
 * @returns Gravatar URL
 */
export const getGravatarUrl = (
  email: string, 
  size: number = 200, 
  defaultImage: 'identicon' | 'monsterid' | 'wavatar' | 'retro' | 'robohash' | 'blank' = 'identicon'
): string => {
  if (!email) return '';
  
  // Convert email to lowercase and trim whitespace
  const normalizedEmail = email.toLowerCase().trim();
  
  // Create hash of the email (simplified for browser compatibility)
  const hash = md5(normalizedEmail);
  
  // Build Gravatar URL
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}&r=g`;
};

/**
 * Check if a Gravatar exists for the given email
 * @param email - The email address to check
 * @returns Promise<boolean> - Whether a Gravatar exists
 */
export const checkGravatarExists = async (email: string): Promise<boolean> => {
  if (!email) return false;
  
  try {
    const url = getGravatarUrl(email, 80, 'blank');
    const response = await fetch(url, { method: 'HEAD' });
    
    // If the response is successful and not redirected to default image
    return response.ok && !response.url.includes('d=blank');
  } catch (error) {
    console.warn('Failed to check Gravatar existence:', error);
    return false;
  }
};

/**
 * Get the best available profile picture URL
 * Priority: Custom uploaded image > Gravatar > Default fallback
 * @param customImageUrl - Custom uploaded profile picture URL
 * @param email - Email address for Gravatar lookup
 * @param size - Avatar size (default: 200)
 * @returns Profile picture URL or null if none available
 */
export const getBestProfilePicture = (
  customImageUrl?: string | null,
  email?: string,
  size: number = 200
): string | null => {
  // First priority: custom uploaded image
  if (customImageUrl) {
    // If it's a relative URL starting with /uploads/, prepend the server base URL
    if (customImageUrl.startsWith('/uploads/')) {
      return `http://localhost:3002${customImageUrl}`;
    }
    return customImageUrl;
  }
  
  // Second priority: Gravatar
  if (email) {
    return getGravatarUrl(email, size);
  }
  
  // No profile picture available
  return null;
};
