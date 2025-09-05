from flask import Flask, render_template, request, send_file, jsonify, make_response
from PIL import Image, ImageDraw, ImageFont
import io
import base64
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.colors import Color
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
import os
from datetime import datetime

app = Flask(__name__)

# Create necessary directories
os.makedirs('static/fonts', exist_ok=True)
os.makedirs('static/css', exist_ok=True)
os.makedirs('static/js', exist_ok=True)
os.makedirs('templates', exist_ok=True)
os.makedirs('exports', exist_ok=True)

class UrduCardGenerator:
    def __init__(self):
        self.default_fonts = [
            'Noto Nastaliq Urdu',
            'Jameel Noori Nastaleeq',
            'Alvi Nastaleeq',
            'Nafees Web Naskh'
        ]
    
    def hex_to_rgb(self, hex_color):
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def get_font(self, font_family, font_size_px):
        """Get font with fallback options"""
        # Map font names to actual files
        font_mapping = {
            'Noto Nastaliq Urdu': 'NotoNastaliqUrdu.ttf',
            'NotoNastaliqUrdu': 'NotoNastaliqUrdu.ttf',
        }
        
        # Try mapped font name first
        if font_family in font_mapping:
            font_filename = font_mapping[font_family]
            font_path = f"static/fonts/{font_filename}"
            if os.path.exists(font_path):
                try:
                    return ImageFont.truetype(font_path, font_size_px)
                except Exception as e:
                    print(f"Error loading mapped font {font_path}: {e}")
        
        # Try multiple font paths and extensions
        font_paths = [
            f"static/fonts/{font_family}.ttf",
            f"static/fonts/{font_family}.otf",
            f"static/fonts/{font_family.replace(' ', '')}.ttf",
            f"static/fonts/{font_family.replace(' ', '')}.otf",
            f"static/fonts/{font_family.replace(' ', '').replace('-', '')}.ttf",
        ]
        
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    return ImageFont.truetype(font_path, font_size_px)
                except Exception as e:
                    print(f"Error loading font {font_path}: {e}")
                    continue
        
        # Try system fonts for common Urdu fonts
        system_font_paths = [
            '/System/Library/Fonts/NotoNastaliqUrdu.ttc',
            '/System/Library/Fonts/Helvetica.ttc',
            '/System/Library/Fonts/Arial.ttf',
        ]
        
        for sys_font in system_font_paths:
            try:
                if os.path.exists(sys_font):
                    return ImageFont.truetype(sys_font, font_size_px)
            except Exception as e:
                print(f"Error loading system font {sys_font}: {e}")
                continue
        
        # Fallback to default font with appropriate size
        try:
            # For newer Pillow versions, try to create a default font with size
            return ImageFont.load_default()
        except:
            # Last resort - create a basic font
            return ImageFont.load_default()
    
    def create_card_image(self, text, width, height, font_size, font_color, bg_color, 
                         alignment, line_spacing, font_family, dpi=300):
        """Create high-quality card image with improved text rendering"""
        try:
            # Convert dimensions to pixels for high DPI (mm to pixels)
            img_width = int(width * dpi / 25.4)  # mm to inches to pixels
            img_height = int(height * dpi / 25.4)
            font_size_px = int(font_size * dpi / 72)  # points to pixels
            line_spacing_px = int(line_spacing * dpi / 72)
            
            # Ensure minimum dimensions
            img_width = max(img_width, 200)
            img_height = max(img_height, 100)
            font_size_px = max(font_size_px, 12)
            
            # Convert colors
            bg_rgb = self.hex_to_rgb(bg_color)
            font_rgb = self.hex_to_rgb(font_color)
            
            # Create image with high DPI
            img = Image.new('RGB', (img_width, img_height), bg_rgb)
            draw = ImageDraw.Draw(img)
            
            # Get font
            font = self.get_font(font_family, font_size_px)
            
            # Process text
            if not text or not text.strip():
                text = "نمونہ متن\nSample Text"
            
            lines = [line for line in text.split('\n') if line.strip()]
            if not lines:
                lines = ["نمونہ متن"]
            
            # Calculate text metrics
            line_heights = []
            line_widths = []
            
            for line in lines:
                try:
                    bbox = draw.textbbox((0, 0), line, font=font)
                    width_px = bbox[2] - bbox[0]
                    height_px = bbox[3] - bbox[1]
                    line_widths.append(width_px)
                    line_heights.append(height_px)
                except:
                    # Fallback measurement
                    line_widths.append(len(line) * font_size_px * 0.6)
                    line_heights.append(font_size_px)
            
            # Calculate total text block height
            total_line_height = max(line_heights) if line_heights else font_size_px
            total_text_height = len(lines) * total_line_height + (len(lines) - 1) * line_spacing_px
            
            # Calculate starting Y position for vertical centering
            start_y = max(20, (img_height - total_text_height) // 2)
            
            # Draw each line
            for i, line in enumerate(lines):
                if line.strip():
                    line_width = line_widths[i] if i < len(line_widths) else 0
                    
                    # Calculate X position based on alignment
                    padding = 20
                    if alignment == 'center':
                        x = max(padding, (img_width - line_width) // 2)
                    elif alignment == 'right':
                        x = max(padding, img_width - line_width - padding)
                    else:  # left
                        x = padding
                    
                    y = start_y + i * (total_line_height + line_spacing_px)
                    
                    # Ensure text is within bounds
                    x = max(padding, min(x, img_width - padding))
                    y = max(10, min(y, img_height - total_line_height - 10))
                    
                    # Draw text with better rendering
                    try:
                        draw.text((x, y), line, font=font, fill=font_rgb)
                    except Exception as e:
                        print(f"Error drawing text: {e}")
                        # Fallback: draw with basic font
                        basic_font = ImageFont.load_default()
                        draw.text((x, y), line, font=basic_font, fill=font_rgb)
            
            return img
            
        except Exception as e:
            print(f"Error creating card image: {e}")
            # Create error image
            error_img = Image.new('RGB', (400, 300), (255, 255, 255))
            error_draw = ImageDraw.Draw(error_img)
            error_draw.text((20, 20), f"Error: {str(e)}", fill=(255, 0, 0))
            return error_img
    
    def create_pdf(self, text, width, height, font_size, font_color, bg_color,
                   alignment, line_spacing, font_family):
        """Create PDF with improved Urdu text support"""
        try:
            buffer = io.BytesIO()
            
            # Convert mm to points (1 mm = 2.834645669 points)
            page_width = float(width) * 2.834645669
            page_height = float(height) * 2.834645669
            
            c = pdf_canvas.Canvas(buffer, pagesize=(page_width, page_height))
            
            # Set background color
            if bg_color != '#FFFFFF' and bg_color != '#ffffff':
                bg_rgb = self.hex_to_rgb(bg_color)
                c.setFillColor(Color(bg_rgb[0]/255, bg_rgb[1]/255, bg_rgb[2]/255))
                c.rect(0, 0, page_width, page_height, fill=1)
            
            # Try to register and use Urdu font
            font_registered = False
            try:
                font_paths = [
                    f"static/fonts/{font_family}.ttf",
                    f"static/fonts/{font_family}.otf",
                    f"static/fonts/{font_family.replace(' ', '')}.ttf",
                ]
                
                for font_path in font_paths:
                    if os.path.exists(font_path):
                        pdfmetrics.registerFont(TTFont(font_family, font_path))
                        c.setFont(font_family, int(font_size))
                        font_registered = True
                        break
                
                if not font_registered:
                    c.setFont("Helvetica", int(font_size))
                    
            except Exception as e:
                print(f"Font registration error: {e}")
                c.setFont("Helvetica", int(font_size))
            
            # Set text color
            font_rgb = self.hex_to_rgb(font_color)
            c.setFillColor(Color(font_rgb[0]/255, font_rgb[1]/255, font_rgb[2]/255))
            
            # Process text
            if not text or not text.strip():
                text = "نمونہ متن\nSample Text"
            
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            if not lines:
                lines = ["نمونہ متن"]
            
            # Calculate layout
            line_height = int(font_size) + int(line_spacing)
            total_height = len(lines) * line_height
            start_y = page_height - (page_height - total_height) / 2
            
            # Draw text lines
            for i, line in enumerate(lines):
                if line:
                    try:
                        # Calculate text width for alignment
                        if font_registered:
                            text_width = c.stringWidth(line, font_family, int(font_size))
                        else:
                            text_width = c.stringWidth(line, "Helvetica", int(font_size))
                        
                        # Calculate X position
                        padding = 20
                        if alignment == 'center':
                            x = max(padding, (page_width - text_width) / 2)
                        elif alignment == 'right':
                            x = max(padding, page_width - text_width - padding)
                        else:  # left
                            x = padding
                        
                        y = start_y - (i * line_height)
                        
                        # Ensure text is within bounds
                        x = max(padding, min(x, page_width - padding))
                        y = max(line_height, min(y, page_height - 20))
                        
                        c.drawString(x, y, line)
                        
                    except Exception as e:
                        print(f"Error drawing PDF text line: {e}")
                        # Fallback positioning
                        c.drawString(20, start_y - (i * line_height), line)
            
            c.save()
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            print(f"Error creating PDF: {e}")
            # Create simple error PDF
            buffer = io.BytesIO()
            c = pdf_canvas.Canvas(buffer, pagesize=(200, 100))
            c.setFont("Helvetica", 12)
            c.drawString(20, 50, f"Error: {str(e)}")
            c.save()
            buffer.seek(0)
            return buffer

card_generator = UrduCardGenerator()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/canvas')
def canvas():
    return render_template('canvas.html')

@app.route('/canvas-pro')
def canvas_pro():
    return render_template('canvas-pro.html')

@app.route('/preview', methods=['POST'])
def preview_card():
    """Generate preview image with improved error handling"""
    try:
        data = request.json
        
        # Validate and sanitize input data
        text = data.get('text', 'نمونہ متن\nSample Text')
        width = max(10, min(500, float(data.get('width', 100))))
        height = max(10, min(500, float(data.get('height', 70))))
        font_size = max(8, min(72, int(data.get('fontSize', 16))))
        font_color = data.get('fontColor', '#000000')
        bg_color = data.get('backgroundColor', '#FFFFFF')
        alignment = data.get('alignment', 'right')
        line_spacing = max(0, min(50, int(data.get('lineSpacing', 5))))
        font_family = data.get('fontFamily', 'Noto Nastaliq Urdu')
        
        # Validate color formats
        if not font_color.startswith('#') or len(font_color) != 7:
            font_color = '#000000'
        if not bg_color.startswith('#') or len(bg_color) != 7:
            bg_color = '#FFFFFF'
        
        print(f"Preview request - Text: {text[:50]}..., Size: {width}x{height}, Font: {font_family}")
        
        img = card_generator.create_card_image(
            text=text,
            width=width,
            height=height,
            font_size=font_size,
            font_color=font_color,
            bg_color=bg_color,
            alignment=alignment,
            line_spacing=line_spacing,
            font_family=font_family,
            dpi=150  # Lower DPI for faster preview
        )
        
        # Convert to base64 for preview
        buffer = io.BytesIO()
        img.save(buffer, format='PNG', optimize=True)
        buffer.seek(0)
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{img_str}',
            'message': 'Preview generated successfully'
        })
    
    except Exception as e:
        print(f"Preview error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False, 
            'error': f'Preview generation failed: {str(e)}',
            'message': 'Please check your input and try again'
        }), 400

@app.route('/export/jpg', methods=['POST'])
def export_jpg():
    """Export as high-quality JPG with improved error handling"""
    try:
        data = request.json
        
        # Validate input data (same as preview)
        text = data.get('text', 'نمونہ متن\nSample Text')
        width = max(10, min(500, float(data.get('width', 100))))
        height = max(10, min(500, float(data.get('height', 70))))
        font_size = max(8, min(72, int(data.get('fontSize', 16))))
        font_color = data.get('fontColor', '#000000')
        bg_color = data.get('backgroundColor', '#FFFFFF')
        alignment = data.get('alignment', 'right')
        line_spacing = max(0, min(50, int(data.get('lineSpacing', 5))))
        font_family = data.get('fontFamily', 'Noto Nastaliq Urdu')
        
        print(f"JPG Export - Size: {width}x{height}, Font: {font_family}")
        
        img = card_generator.create_card_image(
            text=text,
            width=width,
            height=height,
            font_size=font_size,
            font_color=font_color,
            bg_color=bg_color,
            alignment=alignment,
            line_spacing=line_spacing,
            font_family=font_family,
            dpi=300  # High DPI for export
        )
        
        # Save as high-quality JPG
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"urdu_card_{timestamp}.jpg"
        filepath = f"exports/{filename}"
        
        # Ensure exports directory exists
        os.makedirs('exports', exist_ok=True)
        
        # Convert to RGB if necessary and save with high quality
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        img.save(filepath, 'JPEG', quality=95, dpi=(300, 300), optimize=True)
        
        return send_file(filepath, as_attachment=True, download_name=filename)
    
    except Exception as e:
        print(f"JPG Export error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'error': f'JPG export failed: {str(e)}'
        }), 500

@app.route('/export/pdf', methods=['POST'])
def export_pdf():
    """Export as PDF with improved error handling"""
    try:
        data = request.json
        
        # Validate input data
        text = data.get('text', 'نمونہ متن\nSample Text')
        width = max(10, min(500, float(data.get('width', 100))))
        height = max(10, min(500, float(data.get('height', 70))))
        font_size = max(8, min(72, int(data.get('fontSize', 16))))
        font_color = data.get('fontColor', '#000000')
        bg_color = data.get('backgroundColor', '#FFFFFF')
        alignment = data.get('alignment', 'right')
        line_spacing = max(0, min(50, int(data.get('lineSpacing', 5))))
        font_family = data.get('fontFamily', 'Noto Nastaliq Urdu')
        
        print(f"PDF Export - Size: {width}x{height}, Font: {font_family}")
        
        pdf_buffer = card_generator.create_pdf(
            text=text,
            width=width,
            height=height,
            font_size=font_size,
            font_color=font_color,
            bg_color=bg_color,
            alignment=alignment,
            line_spacing=line_spacing,
            font_family=font_family
        )
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"urdu_card_{timestamp}.pdf"
        filepath = f"exports/{filename}"
        
        # Ensure exports directory exists
        os.makedirs('exports', exist_ok=True)
        
        with open(filepath, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        return send_file(filepath, as_attachment=True, download_name=filename)
    
    except Exception as e:
        print(f"PDF Export error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'error': f'PDF export failed: {str(e)}'
        }), 500

@app.route('/export_pdf', methods=['POST'])
def export_canvas_pdf():
    """Export canvas as high-resolution PDF"""
    try:
        data = request.json
        canvas_data = data.get('canvas_data', '')
        width = data.get('width', 100)
        height = data.get('height', 70)
        dpi = data.get('dpi', 1200)  # Support high DPI from frontend
        
        if not canvas_data:
            return jsonify({'error': 'No canvas data provided'}), 400
        
        # Remove data URL prefix
        if canvas_data.startswith('data:image/png;base64,'):
            canvas_data = canvas_data[22:]
        elif canvas_data.startswith('data:image/jpeg;base64,'):
            canvas_data = canvas_data[23:]
        
        # Decode base64 image
        try:
            image_data = base64.b64decode(canvas_data)
            image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            return jsonify({'error': f'Invalid image data: {str(e)}'}), 400
        
        # Create PDF
        pdf_buffer = io.BytesIO()
        
        # Convert mm to points (1 mm = 2.83465 points)
        mm_to_points = 2.83465
        page_width = width * mm_to_points
        page_height = height * mm_to_points
        
        # Create PDF document
        c = pdf_canvas.Canvas(pdf_buffer, pagesize=(page_width, page_height))
        
        # Save image to temporary buffer
        img_buffer = io.BytesIO()
        # Convert to RGB if needed (for JPEG compatibility)
        if image.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        image.save(img_buffer, format='JPEG', quality=95, dpi=(dpi, dpi))
        img_buffer.seek(0)
        
        # Add image to PDF
        c.drawImage(ImageReader(img_buffer), 0, 0, page_width, page_height)
        c.save()
        
        pdf_buffer.seek(0)
        
        response = make_response(pdf_buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=urdu-card-{width}x{height}mm-{dpi}dpi.pdf'
        
        return response
        
    except Exception as e:
        print(f"Canvas PDF export error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500

@app.route('/fonts')
def get_fonts():
    """Get available fonts"""
    fonts = []
    font_dir = 'static/fonts'
    
    # Add default fonts
    fonts.extend(card_generator.default_fonts)
    
    # Add custom fonts
    if os.path.exists(font_dir):
        for file in os.listdir(font_dir):
            if file.endswith('.ttf') or file.endswith('.otf'):
                font_name = os.path.splitext(file)[0]
                if font_name not in fonts:
                    fonts.append(font_name)
    
    return jsonify(fonts)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5002))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)
