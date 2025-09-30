# PWA Icons Setup

## Current Status

✅ Temporary icons created for PWA functionality
⚠️  Proper sized icons needed for best user experience

## Required Icon Sizes

The following icon files are needed in the `public/` directory:

- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels ⭐ (Most important)
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels ⭐ (Most important)

## How to Generate Icons

### Option 1: Using ImageMagick (Recommended)

1. Install ImageMagick: `https://imagemagick.org/script/download.php`
2. Run the batch file: `generate-icons.bat`
3. Or run manually:

   ```batch
   magick "LearningSphereLogo.png" -resize 192x192 "icon-192x192.png"
   magick "LearningSphereLogo.png" -resize 512x512 "icon-512x512.png"
   # Repeat for other sizes
   ```

### Option 2: Online Tools

1. Go to `https://favicon.io/favicon-converter/`
2. Upload `LearningSphereLogo.png`
3. Download the generated icons
4. Rename and place them in the `public/` directory

### Option 3: Using GIMP/Photoshop

1. Open `LearningSphereLogo.png`
2. Resize to each required dimension
3. Export as PNG with transparency
4. Save with the correct filename

## Testing PWA Installation

After generating icons:

1. Start the dev server: `npm run dev`
2. Open browser dev tools → Application → Manifest
3. Check that all icons are loading correctly
4. Test PWA installation on mobile/desktop

## Troubleshooting

- **Icons not showing**: Clear browser cache and hard refresh
- **PWA not installing**: Check console for manifest errors
- **Icons blurry**: Ensure proper sizing and PNG format with transparency

## Current Temporary Setup

- `icon-192x192.png` and `icon-512x512.png` are copies of the original logo
- PWA will work but icons may appear stretched
- Replace with properly sized icons for production