import sharp from 'sharp';
import { readFileSync } from 'fs';

// Load and resize the logo to fit nicely centered (400px tall)
const logoBuffer = await sharp(readFileSync('public/icims-logo.jpg'))
  .resize(400, 400, { fit: 'contain', background: { r: 26, g: 26, b: 46, alpha: 1 } })
  .png()
  .toBuffer();

// SVG background with branding
const bg = Buffer.from(`
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1a1a2e"/>
  <!-- top accent bar -->
  <rect x="0" y="0" width="1200" height="6" fill="#a855f7"/>
  <!-- bottom accent bar -->
  <rect x="0" y="624" width="1200" height="6" fill="#a855f7"/>
  <!-- subtle grid lines -->
  <rect x="0" y="0" width="1200" height="630" fill="url(#grid)" opacity="0.05"/>
  <!-- right side text block -->
  <text x="760" y="240" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#ffffff">ICIMS</text>
  <text x="760" y="300" font-family="Arial, sans-serif" font-size="22" fill="#a855f7">Integrated Church Management</text>
  <text x="760" y="335" font-family="Arial, sans-serif" font-size="22" fill="#a855f7">System</text>
  <text x="760" y="400" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">Membership · Giving · Attendance</text>
  <text x="760" y="430" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">Events · Communication · Reports</text>
  <text x="760" y="490" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" opacity="0.6">churchcentral.church</text>
</svg>`);

await sharp(bg)
  .composite([
    {
      input: logoBuffer,
      left: 115,
      top: 115,
    },
  ])
  .png()
  .toFile('public/og-image.png');

console.log('✅ og-image.png generated at public/og-image.png');
