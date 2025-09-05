class UrduCanvasEditor {
    constructor() {
        this.canvas = document.getElementById('cardCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.textElements = [];
        this.selectedElement = null;
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.history = [];
        this.historyStep = -1;
        
        this.initializeCanvas();
        this.initializeElements();
        this.bindEvents();
        this.loadWebFonts();
        this.updateCanvasSize();
        
        // Add default text
        setTimeout(() => {
            this.addTextElement();
        }, 1000); // Wait for fonts to load
    }

    async loadWebFonts() {
        // Load Google Fonts for better Urdu support
        const fontLinks = [
            'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap',
            'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap',
            'https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap'
        ];

        for (const link of fontLinks) {
            if (!document.querySelector(`link[href="${link}"]`)) {
                const linkElement = document.createElement('link');
                linkElement.rel = 'stylesheet';
                linkElement.href = link;
                document.head.appendChild(linkElement);
            }
        }

        // Wait for fonts to load
        try {
            await document.fonts.ready;
            console.log('All fonts loaded successfully');
        } catch (error) {
            console.log('Font loading error:', error);
        }
    }

    initializeCanvas() {
        this.canvas.style.background = '#ffffff';
        this.canvas.style.border = '2px solid #ddd';
        this.canvas.style.borderRadius = '10px';
        
        // Set canvas resolution for crisp rendering
        const rect = this.canvas.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * scale;
        this.canvas.height = rect.height * scale;
        this.ctx.scale(scale, scale);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    initializeElements() {
        // Get control elements
        this.textInput = document.getElementById('textInput');
        this.fontFamily = document.getElementById('fontFamily');
        this.fontSize = document.getElementById('fontSize');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.fontColor = document.getElementById('fontColor');
        this.alignment = document.getElementById('alignment');
        this.rotation = document.getElementById('rotation');
        this.rotationValue = document.getElementById('rotationValue');
        this.backgroundColor = document.getElementById('backgroundColor');
        this.lineSpacing = document.getElementById('lineSpacing');
        this.lineSpacingValue = document.getElementById('lineSpacingValue');
        this.cardWidth = document.getElementById('cardWidth');
        this.cardHeight = document.getElementById('cardHeight');
        this.previewDimensions = document.getElementById('previewDimensions');

        // Tool buttons
        this.addTextBtn = document.getElementById('addTextBtn');
        this.selectBtn = document.getElementById('selectBtn');
        this.deleteBtn = document.getElementById('deleteBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.exportJpg = document.getElementById('exportJpg');
        this.exportPdf = document.getElementById('exportPdf');
    }

    bindEvents() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));

        // Tool buttons
        this.addTextBtn?.addEventListener('click', () => this.addTextElement());
        this.selectBtn?.addEventListener('click', () => this.setTool('select'));
        this.deleteBtn?.addEventListener('click', () => this.deleteSelectedElement());
        this.undoBtn?.addEventListener('click', () => this.undo());
        this.redoBtn?.addEventListener('click', () => this.redo());
        this.clearBtn?.addEventListener('click', () => this.clearCanvas());

        // Control updates
        this.fontSize?.addEventListener('input', () => this.updateSliderValues());
        this.rotation?.addEventListener('input', () => this.updateSliderValues());
        this.lineSpacing?.addEventListener('input', () => this.updateSliderValues());
        
        // Text and style updates
        const styleInputs = [
            this.textInput, this.fontFamily, this.fontSize, this.fontColor,
            this.alignment, this.rotation, this.backgroundColor, this.lineSpacing
        ];
        
        styleInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.updateSelectedElement();
                    this.redrawCanvas();
                });
            }
        });

        // Dimension updates
        this.cardWidth?.addEventListener('input', () => this.updateCanvasSize());
        this.cardHeight?.addEventListener('input', () => this.updateCanvasSize());

        // Template buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('template-btn')) {
                const template = e.target.getAttribute('data-template');
                if (template && this.textInput) {
                    this.textInput.value = template;
                    this.updateSelectedElement();
                    this.redrawCanvas();
                }
            }
        });

        // Export buttons
        this.exportJpg?.addEventListener('click', () => this.exportCanvas('jpg'));
        this.exportPdf?.addEventListener('click', () => this.exportCanvas('pdf'));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedElement) {
                this.deleteSelectedElement();
            } else if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    this.undo();
                } else if (e.key === 'y') {
                    e.preventDefault();
                    this.redo();
                }
            }
        });
    }

    updateSliderValues() {
        if (this.fontSizeValue) this.fontSizeValue.textContent = `${this.fontSize?.value || 20}px`;
        if (this.rotationValue) this.rotationValue.textContent = `${this.rotation?.value || 0}°`;
        if (this.lineSpacingValue) this.lineSpacingValue.textContent = `${this.lineSpacing?.value || 5}px`;
    }

    updateCanvasSize() {
        const width = parseInt(this.cardWidth?.value || 100);
        const height = parseInt(this.cardHeight?.value || 70);
        
        // Update canvas size (mm to pixels at 96 DPI for display)
        const pixelWidth = Math.max(200, width * 3.7795); // mm to pixels
        const pixelHeight = Math.max(150, height * 3.7795);
        
        this.canvas.style.width = Math.min(pixelWidth, 500) + 'px';
        this.canvas.style.height = Math.min(pixelHeight, 400) + 'px';
        
        // Update display dimensions
        if (this.previewDimensions) {
            this.previewDimensions.textContent = `${width}mm × ${height}mm`;
        }
        
        this.initializeCanvas();
        this.redrawCanvas();
    }

    addTextElement() {
        const text = this.textInput?.value || 'نمونہ متن';
        const element = {
            id: Date.now(),
            text: text,
            x: 50,
            y: 50,
            width: 200,
            height: 60,
            fontSize: parseInt(this.fontSize?.value || 20),
            fontFamily: this.fontFamily?.value || 'Noto Nastaliq Urdu',
            color: this.fontColor?.value || '#000000',
            alignment: this.alignment?.value || 'right',
            rotation: parseInt(this.rotation?.value || 0),
            lineSpacing: parseInt(this.lineSpacing?.value || 5)
        };
        
        this.textElements.push(element);
        this.selectedElement = element;
        this.saveState();
        this.redrawCanvas();
        this.updateControls();
    }

    updateSelectedElement() {
        if (!this.selectedElement) return;
        
        this.selectedElement.text = this.textInput?.value || 'نمونہ متن';
        this.selectedElement.fontSize = parseInt(this.fontSize?.value || 20);
        this.selectedElement.fontFamily = this.fontFamily?.value || 'Noto Nastaliq Urdu';
        this.selectedElement.color = this.fontColor?.value || '#000000';
        this.selectedElement.alignment = this.alignment?.value || 'right';
        this.selectedElement.rotation = parseInt(this.rotation?.value || 0);
        this.selectedElement.lineSpacing = parseInt(this.lineSpacing?.value || 5);
    }

    updateControls() {
        if (!this.selectedElement) return;
        
        if (this.textInput) this.textInput.value = this.selectedElement.text;
        if (this.fontSize) this.fontSize.value = this.selectedElement.fontSize;
        if (this.fontFamily) this.fontFamily.value = this.selectedElement.fontFamily;
        if (this.fontColor) this.fontColor.value = this.selectedElement.color;
        if (this.alignment) this.alignment.value = this.selectedElement.alignment;
        if (this.rotation) this.rotation.value = this.selectedElement.rotation;
        if (this.lineSpacing) this.lineSpacing.value = this.selectedElement.lineSpacing;
        
        this.updateSliderValues();
    }

    redrawCanvas() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set background
        const bgColor = this.backgroundColor?.value || '#ffffff';
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw all text elements
        this.textElements.forEach(element => {
            this.drawTextElement(element);
        });
        
        // Draw selection handles for selected element
        if (this.selectedElement) {
            this.drawSelectionHandles(this.selectedElement);
        }
    }

    drawTextElement(element) {
        this.ctx.save();
        
        // Set font with proper fallbacks for Urdu
        const fontFamily = element.fontFamily.includes('Noto') ? 
            `${element.fontSize}px "Noto Nastaliq Urdu", "Amiri", "Scheherazade New", "Arial Unicode MS", sans-serif` :
            `${element.fontSize}px "${element.fontFamily}", "Noto Nastaliq Urdu", "Amiri", sans-serif`;
        
        this.ctx.font = fontFamily;
        this.ctx.fillStyle = element.color;
        this.ctx.textBaseline = 'top';
        
        // Apply rotation
        if (element.rotation !== 0) {
            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((element.rotation * Math.PI) / 180);
            this.ctx.translate(-centerX, -centerY);
        }
        
        // Split text into lines and draw
        const lines = element.text.split('\n');
        const lineHeight = element.fontSize + element.lineSpacing;
        
        lines.forEach((line, index) => {
            if (line.trim()) {
                let x = element.x;
                const y = element.y + (index * lineHeight);
                
                // Handle text alignment
                if (element.alignment === 'center') {
                    this.ctx.textAlign = 'center';
                    x = element.x + element.width / 2;
                } else if (element.alignment === 'right') {
                    this.ctx.textAlign = 'right';
                    x = element.x + element.width;
                } else {
                    this.ctx.textAlign = 'left';
                    x = element.x;
                }
                
                // Draw text with proper direction for Urdu
                this.ctx.direction = element.alignment === 'right' ? 'rtl' : 'ltr';
                this.ctx.fillText(line, x, y);
            }
        });
        
        this.ctx.restore();
    }

    drawSelectionHandles(element) {
        this.ctx.save();
        
        // Draw selection border
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(element.x, element.y, element.width, element.height);
        
        // Draw resize handles
        const handleSize = 8;
        this.ctx.fillStyle = '#667eea';
        this.ctx.setLineDash([]);
        
        // Corner handles
        const corners = [
            { x: element.x - handleSize/2, y: element.y - handleSize/2 }, // top-left
            { x: element.x + element.width - handleSize/2, y: element.y - handleSize/2 }, // top-right
            { x: element.x - handleSize/2, y: element.y + element.height - handleSize/2 }, // bottom-left
            { x: element.x + element.width - handleSize/2, y: element.y + element.height - handleSize/2 } // bottom-right
        ];
        
        corners.forEach(corner => {
            this.ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
        });
        
        // Rotation handle
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(element.x + element.width/2, element.y - 20, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.lastMousePos = { x, y };
        this.dragStart = { x, y };
        
        // Check if clicking on selected element's handles
        if (this.selectedElement) {
            if (this.isPointInRotationHandle(x, y, this.selectedElement)) {
                this.isRotating = true;
                return;
            }
            
            if (this.isPointInResizeHandle(x, y, this.selectedElement)) {
                this.isResizing = true;
                return;
            }
        }
        
        // Check if clicking on any text element
        const clickedElement = this.getElementAt(x, y);
        if (clickedElement) {
            this.selectedElement = clickedElement;
            this.isDragging = true;
            this.updateControls();
        } else {
            this.selectedElement = null;
        }
        
        this.redrawCanvas();
    }

    onMouseMove(e) {
        if (!this.isDragging && !this.isResizing && !this.isRotating) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const deltaX = x - this.lastMousePos.x;
        const deltaY = y - this.lastMousePos.y;
        
        if (this.isDragging && this.selectedElement) {
            this.selectedElement.x += deltaX;
            this.selectedElement.y += deltaY;
        } else if (this.isResizing && this.selectedElement) {
            this.selectedElement.width = Math.max(50, this.selectedElement.width + deltaX);
            this.selectedElement.height = Math.max(30, this.selectedElement.height + deltaY);
        } else if (this.isRotating && this.selectedElement) {
            const centerX = this.selectedElement.x + this.selectedElement.width / 2;
            const centerY = this.selectedElement.y + this.selectedElement.height / 2;
            const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
            this.selectedElement.rotation = Math.round(angle);
            if (this.rotation) this.rotation.value = this.selectedElement.rotation;
            this.updateSliderValues();
        }
        
        this.lastMousePos = { x, y };
        this.redrawCanvas();
    }

    onMouseUp(e) {
        if (this.isDragging || this.isResizing || this.isRotating) {
            this.saveState();
        }
        
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
    }

    onDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedElement = this.getElementAt(x, y);
        if (!clickedElement) {
            // Add new text element at click position
            const element = {
                id: Date.now(),
                text: this.textInput?.value || 'نیا متن',
                x: x - 50,
                y: y - 15,
                width: 100,
                height: 30,
                fontSize: parseInt(this.fontSize?.value || 20),
                fontFamily: this.fontFamily?.value || 'Noto Nastaliq Urdu',
                color: this.fontColor?.value || '#000000',
                alignment: this.alignment?.value || 'right',
                rotation: 0,
                lineSpacing: parseInt(this.lineSpacing?.value || 5)
            };
            
            this.textElements.push(element);
            this.selectedElement = element;
            this.saveState();
            this.redrawCanvas();
            this.updateControls();
        }
    }

    getElementAt(x, y) {
        for (let i = this.textElements.length - 1; i >= 0; i--) {
            const element = this.textElements[i];
            if (x >= element.x && x <= element.x + element.width &&
                y >= element.y && y <= element.y + element.height) {
                return element;
            }
        }
        return null;
    }

    isPointInResizeHandle(x, y, element) {
        const handleSize = 8;
        const corners = [
            { x: element.x + element.width - handleSize/2, y: element.y + element.height - handleSize/2 }
        ];
        
        return corners.some(corner => 
            x >= corner.x && x <= corner.x + handleSize &&
            y >= corner.y && y <= corner.y + handleSize
        );
    }

    isPointInRotationHandle(x, y, element) {
        const handleX = element.x + element.width / 2;
        const handleY = element.y - 20;
        const distance = Math.sqrt((x - handleX) ** 2 + (y - handleY) ** 2);
        return distance <= 8;
    }

    deleteSelectedElement() {
        if (this.selectedElement) {
            const index = this.textElements.indexOf(this.selectedElement);
            if (index > -1) {
                this.textElements.splice(index, 1);
                this.selectedElement = null;
                this.saveState();
                this.redrawCanvas();
            }
        }
    }

    clearCanvas() {
        this.textElements = [];
        this.selectedElement = null;
        this.saveState();
        this.redrawCanvas();
    }

    saveState() {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        this.history.push(JSON.parse(JSON.stringify(this.textElements)));
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.textElements = JSON.parse(JSON.stringify(this.history[this.historyStep]));
            this.selectedElement = null;
            this.redrawCanvas();
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.textElements = JSON.parse(JSON.stringify(this.history[this.historyStep]));
            this.selectedElement = null;
            this.redrawCanvas();
        }
    }

    async exportCanvas(format) {
        try {
            // Create high-resolution canvas for export
            const exportCanvas = document.createElement('canvas');
            const exportCtx = exportCanvas.getContext('2d');
            
            const width = parseInt(this.cardWidth?.value || 100);
            const height = parseInt(this.cardHeight?.value || 70);
            const dpi = 300;
            
            // Set export canvas size (mm to pixels at 300 DPI)
            exportCanvas.width = (width / 25.4) * dpi;
            exportCanvas.height = (height / 25.4) * dpi;
            
            // Scale factor from display to export
            const scaleX = exportCanvas.width / this.canvas.offsetWidth;
            const scaleY = exportCanvas.height / this.canvas.offsetHeight;
            
            // Set background
            const bgColor = this.backgroundColor?.value || '#ffffff';
            exportCtx.fillStyle = bgColor;
            exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            
            // Draw all text elements at high resolution
            for (const element of this.textElements) {
                exportCtx.save();
                
                // Scale font size for high resolution
                const scaledFontSize = element.fontSize * scaleX;
                const fontFamily = element.fontFamily.includes('Noto') ? 
                    `${scaledFontSize}px "Noto Nastaliq Urdu", "Amiri", "Arial Unicode MS", sans-serif` :
                    `${scaledFontSize}px "${element.fontFamily}", "Noto Nastaliq Urdu", sans-serif`;
                
                exportCtx.font = fontFamily;
                exportCtx.fillStyle = element.color;
                exportCtx.textBaseline = 'top';
                
                // Apply rotation
                if (element.rotation !== 0) {
                    const centerX = (element.x + element.width / 2) * scaleX;
                    const centerY = (element.y + element.height / 2) * scaleY;
                    exportCtx.translate(centerX, centerY);
                    exportCtx.rotate((element.rotation * Math.PI) / 180);
                    exportCtx.translate(-centerX, -centerY);
                }
                
                // Draw text
                const lines = element.text.split('\n');
                const lineHeight = (element.fontSize + element.lineSpacing) * scaleY;
                
                lines.forEach((line, index) => {
                    if (line.trim()) {
                        let x = element.x * scaleX;
                        const y = (element.y + (index * (element.fontSize + element.lineSpacing))) * scaleY;
                        
                        if (element.alignment === 'center') {
                            exportCtx.textAlign = 'center';
                            x = (element.x + element.width / 2) * scaleX;
                        } else if (element.alignment === 'right') {
                            exportCtx.textAlign = 'right';
                            x = (element.x + element.width) * scaleX;
                        } else {
                            exportCtx.textAlign = 'left';
                        }
                        
                        exportCtx.direction = element.alignment === 'right' ? 'rtl' : 'ltr';
                        exportCtx.fillText(line, x, y);
                    }
                });
                
                exportCtx.restore();
            }
            
            // Convert to blob and download
            exportCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `urdu_card_${Date.now()}.${format}`;
                a.click();
                URL.revokeObjectURL(url);
                
                this.showNotification(`${format.toUpperCase()} exported successfully!`, 'success');
            }, `image/${format}`, 0.95);
            
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Export failed. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        const colors = {
            success: { bg: '#4CAF50', icon: '✓' },
            error: { bg: '#f44336', icon: '✗' },
            warning: { bg: '#ff9800', icon: '⚠' },
            info: { bg: '#2196F3', icon: 'ℹ' }
        };
        
        const color = colors[type] || colors.info;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 20px',
            backgroundColor: color.bg,
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '1001',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            animation: 'slideInRight 0.3s ease-out'
        });
        
        const closeBtn = notification.querySelector('.notification-close');
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0'
        });
        
        notification.querySelector('.notification-message').innerHTML = 
            `<span style="margin-right: 8px;">${color.icon}</span>${message}`;

        document.body.appendChild(notification);

        const closeNotification = () => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };

        closeBtn.addEventListener('click', closeNotification);
        setTimeout(closeNotification, 4000);
    }
}

// Initialize the canvas editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Urdu Canvas Editor...');
    const editor = new UrduCanvasEditor();
    
    // Make it globally accessible for debugging
    window.urduEditor = editor;
});
