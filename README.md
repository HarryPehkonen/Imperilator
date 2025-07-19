# Imperilator Input

A professional Progressive Web App (PWA) for imperial measurement calculations. Built for contractors, carpenters, and anyone working with feet, inches, and fractions.

## 🎯 Features

- **Imperial Measurements**: Feet, inches, and fractional inches (1/8", 1/16", 1/32")
- **Mathematical Operations**: Addition, subtraction, multiplication, division
- **Dimensional Analysis**: Length + Length = Length, Scalar × Length = Length, etc.
- **Volume Calculations**: Length × Length × Length = Volume
- **Calculation History**: Scrollable history with 4-5 previous calculations
- **Mobile Optimized**: Full-width responsive design for mobile devices
- **Offline Support**: Works without internet connection once installed
- **Professional Design**: Construction/measurement themed with blueprint styling

## 🚀 Quick Start

### Development Mode
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Building for Production

### Create Distribution Package
```bash
# Build optimized production files
npm run build

# This creates a 'dist' folder with all files needed for deployment
```

### Preview Production Build (Optional)
```bash
# Preview the production build locally
npm run preview

# Opens at http://localhost:4173
```

## 🌐 Web Server Deployment

### Step 1: Build the Application
```bash
npm run build
```

### Step 2: Upload to Your Web Server
Upload the entire contents of the `dist` folder to your web server's public directory:

```bash
# Example file structure after upload:
/var/www/html/imperilator/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
├── vite.svg
└── manifest.json
```

### Step 3: Web Server Configuration

#### Apache (.htaccess)
Create a `.htaccess` file in your deployment directory:
```apache
# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# PWA Support - Serve manifest with correct MIME type
<Files "manifest.json">
    Header set Content-Type application/manifest+json
</Files>

# Service Worker - must be served from root path
<Files "sw.js">
    Header set Service-Worker-Allowed "/"
    Header set Cache-Control "no-cache"
</Files>

# SPA routing - redirect all routes to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### Nginx
Add to your nginx configuration:
```nginx
location /imperilator/ {
    alias /var/www/html/imperilator/;
    try_files $uri $uri/ /index.html;
    
    # PWA Support
    location ~* manifest\.json$ {
        add_header Content-Type application/manifest+json;
    }
    
    # Service Worker
    location ~* sw\.js$ {
        add_header Service-Worker-Allowed "/";
        add_header Cache-Control "no-cache";
    }
}
```

## 📱 Installing as PWA

### On Mobile (Android/iOS)
1. Open the app in Chrome/Safari
2. Tap the menu (⋮ or share icon)
3. Select "Add to Home Screen" or "Install App"
4. Choose a name and tap "Add"
5. App appears on home screen like a native app

### On Desktop (Chrome/Edge)
1. Open the app in Chrome/Edge
2. Look for the install icon (⚏) in the address bar
3. Click "Install"
4. App opens in standalone window without browser chrome

### Features When Installed
- ✅ **Offline functionality** - Works without internet
- ✅ **Standalone window** - No address bar or browser UI
- ✅ **Native app feel** - Fast startup, smooth performance
- ✅ **Home screen icon** - Easy access like any other app

## 🎨 Design Theme

The app features a professional construction/measurement theme:
- **Blueprint background** with subtle grid patterns
- **Brushed metal keypads** with 3D depth
- **Color coding**: Feet (blue), Inches (green), Scalar (neutral)
- **Paper texture** overlays for authentic feel

## 🔧 Architecture

### Token-Based Input System
- **Input Tokens** → **Useful Tokens** → **Math Tokens** → **Display**
- Pure functions with memoization for predictable behavior
- Backspace removes tokens from useful tokens array

### Calculation Engine
- **Shunting Yard algorithm** for operator precedence
- **Dimensional analysis** prevents invalid operations
- **Fraction simplification** using GCD algorithm
- **Result formatting** with total inches display

### State Management
- Simple React state with useState and useMemo
- No external state management library needed
- Auto-scroll to show calculation results

## 📝 Usage Examples

### Basic Calculations
- `2ft 6in + 1ft 3in` = `3ft 9in (45in)`
- `10in × 3` = `2ft 6in (30in)`
- `4ft ÷ 2` = `2ft (24in)`

### Fractional Calculations
- `5 1/4in + 2 3/8in` = `7 5/8in`
- `3ft 2 1/2in × 2` = `6ft 5in (77in)`

### Volume Calculations
- `2ft × 3ft × 4ft` = `24 cubic feet`

## 🐛 Troubleshooting

### PWA Not Installing
- Ensure you're accessing via HTTPS (not http://)
- Clear browser cache and reload
- Check that manifest.json is accessible

### Offline Not Working
- Service worker requires HTTPS to function
- Check browser developer tools for service worker registration
- Ensure all assets are cached properly

### Mobile Layout Issues
- App is optimized for viewport widths 320px and up
- Use mobile device mode in browser dev tools for testing
- Ensure viewport meta tag is present in index.html

## 🤝 Contributing

### Running Tests
```bash
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Code Style
- TypeScript for type safety
- React functional components with hooks
- CSS modules for styling
- Pure functions preferred over classes

## 📄 License

This project is licensed under the MIT License.

## 🏗️ Built With

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework
- **PWA Plugin** - Service worker and manifest generation

---

*Built for professional measurement work with precision and reliability in mind.*