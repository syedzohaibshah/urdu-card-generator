# 🎨 Urdu Canvas Pro - Professional Urdu Card Generator

A modern, professional-grade web application for creating beautiful Urdu cards, banners, and designs with high-quality export capabilities.

## ✨ Features

### 🎯 **Canvas-Based Design**
- **Interactive Canvas Editor** - Drag, resize, and rotate text elements
- **Canva-Style Interface** - Professional, spacious layout
- **Real-time Preview** - See changes instantly
- **Multiple Text Elements** - Add unlimited text blocks

### 🔤 **Typography Excellence**
- **16 Premium Fonts** - Comprehensive Urdu/Arabic font collection
- **Large Font Sizes** - 8px to 200px for banners and posters
- **Advanced Spacing** - Word spacing (0-50px) and line spacing (0-100px)
- **RTL Support** - Perfect right-to-left text rendering

### 🖨️ **Print-Ready Quality**
- **Ultra-High Resolution** - 1200 DPI exports for professional printing
- **Multiple Formats** - JPG and PDF export
- **Custom Dimensions** - Any size from business cards to posters
- **Aspect Ratio Presets** - Common formats including A4

### 🎨 **Design Features**
- **Color Controls** - Text and background color pickers
- **Text Effects** - Shadow, opacity, rotation
- **Flexible Layout** - Custom canvas sizes and ratios
- **Font Weights** - Light to Extra Bold support

## 🚀 **Live Demo**

[**🌟 Try Urdu Canvas Pro Live**](https://web-production-a32d7.up.railway.app/canvas-pro)

## 📦 **Installation**

### Prerequisites
- Python 3.11+
- pip

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/syedzohaibshah/urdu-card-generator.git
   cd urdu-card-generator
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open in browser**
   ```
   http://localhost:5002/canvas-pro
   ```

## 🌐 **Deployment**

### Railway Deployment (Recommended ⭐)

1. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "Deploy from GitHub repo"
   - Select `syedzohaibshah/urdu-card-generator`
   - Railway auto-detects Flask and deploys!

3. **Access your app**
   - Railway provides a URL like: `https://your-app.up.railway.app`
   - Add `/canvas-pro` to access the main interface

### Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and create app**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Alternative Free Hosting

- **Railway** - `railway deploy`
- **Render** - Connect GitHub repository
- **PythonAnywhere** - Upload and configure
- **Vercel** - `vercel deploy`

## 🎨 **Font Collection**

### Traditional Urdu
- **Noto Nastaliq Urdu** - Premium Urdu typography
- **Lateef** - Traditional Urdu script
- **Aref Ruqaa** - Classical Ruqaa style

### Modern Arabic
- **Cairo** - Clean and readable
- **Tajawal** - Contemporary sans-serif
- **IBM Plex Arabic** - Corporate modern

### Decorative
- **Rakkas** - Bold decorative Arabic
- **Gulzar** - Elegant Persian calligraphy
- **Lalezar** - Modern Persian display

### Contemporary
- **Amiri** - Classical Arabic calligraphy
- **Mirza** - Modern Urdu typography
- **Marhey** - Contemporary Arabic design
- **Playpen Sans** - Playful Arabic script

Plus: Scheherazade New, Reem Kufi, Markazi Text

## 📱 **Usage Guide**

### Basic Usage
1. **Add Text** - Click "Add Text" or double-click canvas
2. **Edit Content** - Use the text area in properties panel
3. **Style Text** - Choose fonts, sizes, colors
4. **Position** - Drag to move, corners to resize
5. **Export** - Click JPG or PDF export buttons

### Advanced Features
- **Rotation** - Use rotation handle or slider
- **Word Spacing** - Perfect for Urdu text layout
- **Shadows** - Add depth with text shadows
- **Multiple Elements** - Layer text for complex designs

### Export Options
- **JPG** - 1200 DPI for high-quality images
- **PDF** - Vector-based for perfect printing
- **Custom Sizes** - Any dimensions in millimeters

## 🛠️ **Technical Stack**

- **Backend** - Flask (Python)
- **Frontend** - HTML5 Canvas, Vanilla JavaScript
- **Image Processing** - Pillow (PIL)
- **PDF Generation** - ReportLab
- **Fonts** - Google Fonts API
- **Styling** - Modern CSS3 with gradients

## 📂 **Project Structure**

```
write-urdu/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── Procfile              # Heroku deployment
├── runtime.txt           # Python version
├── static/
│   ├── css/
│   │   └── style.css     # Styling
│   ├── js/
│   │   └── canvas-editor-pro.js  # Canvas editor
│   └── fonts/            # Font files
├── templates/
│   ├── index.html        # Home page
│   ├── canvas.html       # Basic canvas
│   └── canvas-pro.html   # Pro canvas editor
└── exports/              # Generated files
```

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Google Fonts** - Comprehensive Urdu/Arabic font collection
- **ReportLab** - Professional PDF generation
- **Pillow** - Image processing capabilities
- **Flask** - Lightweight web framework

## 🐛 **Issues & Support**

Found a bug or need help? 
- [Open an Issue](https://github.com/syedzohaibshah/urdu-card-generator/issues)
- [Discussions](https://github.com/syedzohaibshah/urdu-card-generator/discussions)

## 🌟 **Show Your Support**

Give a ⭐️ if this project helped you!

---

**Made with ❤️ for the Urdu community**
