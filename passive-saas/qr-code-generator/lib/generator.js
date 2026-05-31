const QRCode = require('qrcode');

/**
 * Generate QR code content string based on type
 */
function buildContent(type, data) {
  switch (type) {
    case 'url':
      return data.url || data.content || '';
    case 'text':
      return data.text || data.content || '';
    case 'vcard':
      return buildVCard(data);
    case 'wifi':
      return buildWifi(data);
    default:
      return data.content || '';
  }
}

function buildVCard(data) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${data.lastName || ''};${data.firstName || ''}`,
    `FN:${data.firstName || ''} ${data.lastName || ''}`.trim()
  ];
  if (data.phone) lines.push(`TEL:${data.phone}`);
  if (data.email) lines.push(`EMAIL:${data.email}`);
  if (data.organization) lines.push(`ORG:${data.organization}`);
  if (data.url) lines.push(`URL:${data.url}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

function buildWifi(data) {
  const auth = data.encryption || 'WPA';
  const ssid = data.ssid || '';
  const password = data.password || '';
  const hidden = data.hidden ? 'true' : 'false';
  return `WIFI:T:${auth};S:${ssid};P:${password};H:${hidden};;`;
}

/**
 * Generate QR code as PNG buffer
 */
async function generatePNG(content, options = {}) {
  const qrOptions = {
    width: options.size || 300,
    margin: 2,
    color: {
      dark: options.foreground_color || '#000000',
      light: options.background_color || '#ffffff'
    }
  };
  return QRCode.toBuffer(content, qrOptions);
}

/**
 * Generate QR code as SVG string
 */
async function generateSVG(content, options = {}) {
  const qrOptions = {
    width: options.size || 300,
    margin: 2,
    color: {
      dark: options.foreground_color || '#000000',
      light: options.background_color || '#ffffff'
    },
    type: 'svg'
  };
  return QRCode.toString(content, qrOptions);
}

/**
 * Generate QR code as data URL (for previews)
 */
async function generateDataURL(content, options = {}) {
  const qrOptions = {
    width: options.size || 300,
    margin: 2,
    color: {
      dark: options.foreground_color || '#000000',
      light: options.background_color || '#ffffff'
    }
  };
  return QRCode.toDataURL(content, qrOptions);
}

module.exports = {
  buildContent,
  generatePNG,
  generateSVG,
  generateDataURL
};
