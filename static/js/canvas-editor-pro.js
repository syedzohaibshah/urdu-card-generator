class UrduCanvasEditorPro {
    constructor() {
        this.canvas = document.getElementById('cardCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.textElements = [];
        this.selectedElement = null;
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.dragStart = { x: 0, y: 0 };
        this.resizeHandle = null;
        this.history = [];
        this.historyIndex = -1;
        this.isAddingText = true;
        
        this.init();
        this.setupEventListeners();
        this.updateCanvas();
        this.saveState();
    }

    init() {
        // Set initial canvas size (high DPI for quality)
        this.updateCanvasSize();
        
        // Set initial font loading
        this.loadFonts();
        
        // Initial text element
        this.addTextElement("السلام علیکم\nیہ جدید کینوس ایڈیٹر ہے", 50, 30);
    }

    async loadFonts() {
        const fonts = [
            'Noto Nastaliq Urdu',
            'Amiri',
            'Lalezar',
            'Playpen Sans',
            'Rakkas',
            'Lateef',
            'Aref Ruqaa',
            'Gulzar',
            'Mirza',
            'Marhey',
            'Scheherazade New',
            'Reem Kufi',
            'Cairo',
            'Tajawal',
            'IBM Plex Arabic',
            'Markazi Text'
        ];
        
        for (const font of fonts) {
            try {
                await document.fonts.load(`400 16px "${font}"`);
                await document.fonts.load(`700 16px "${font}"`);
            } catch (e) {
                console.log(`Font ${font} failed to load`);
            }
        }
        this.updateCanvas();
    }

    updateCanvasSize() {
        const width = parseInt(document.getElementById('cardWidth').value);
        const height = parseInt(document.getElementById('cardHeight').value);
        
        // Convert mm to pixels (600 DPI for ultra-high quality)
        const dpi = 600;
        const mmToInch = 1 / 25.4;
        
        this.canvas.width = width * mmToInch * dpi;
        this.canvas.height = height * mmToInch * dpi;
        
        // Scale canvas for display
        const maxDisplayWidth = 600;
        const maxDisplayHeight = 400;
        
        const scaleX = maxDisplayWidth / this.canvas.width;
        const scaleY = maxDisplayHeight / this.canvas.height;
        const scale = Math.min(scaleX, scaleY, 1);
        
        this.canvas.style.width = (this.canvas.width * scale) + 'px';
        this.canvas.style.height = (this.canvas.height * scale) + 'px';
        
        this.displayScale = scale;
        
        // Update dimension display
        document.getElementById('previewDimensions').textContent = `${width}mm × ${height}mm (600 DPI)`;
        
        this.updateCanvas();
    }

    addTextElement(text, x, y) {
        const element = {
            id: Date.now(),
            text: text || 'نیا متن',
            x: x || 50,
            y: y || 50,
            width: 250,
            height: 80,
            fontSize: 24,
            fontFamily: 'Noto Nastaliq Urdu',
            fontWeight: '400',
            color: '#000000',
            alignment: 'right',
            rotation: 0,
            lineSpacing: 8,
            wordSpacing: 0,
            shadowColor: '#000000',
            shadowBlur: 0,
            opacity: 100
        };
        
        this.textElements.push(element);
        this.selectedElement = element;
        this.updatePropertiesPanel();
        this.updateCanvas();
        this.saveState();
        return element;
    }

    getElementAt(x, y) {
        // Convert display coordinates to canvas coordinates
        x = x / this.displayScale;
        y = y / this.displayScale;
        
        for (let i = this.textElements.length - 1; i >= 0; i--) {
            const element = this.textElements[i];
            if (x >= element.x && x <= element.x + element.width &&
                y >= element.y && y <= element.y + element.height) {
                return element;
            }
        }
        return null;
    }

    updateCanvas() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill background
        const bgColor = document.getElementById('backgroundColor').value;
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render text elements
        this.textElements.forEach(element => {
            this.renderTextElement(element);
        });
        
        // Render selection handles
        if (this.selectedElement) {
            this.renderSelectionHandles(this.selectedElement);
        }
    }

    renderTextElement(element) {
        this.ctx.save();
        
        // Apply opacity
        this.ctx.globalAlpha = element.opacity / 100;
        
        // Apply rotation
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate((element.rotation * Math.PI) / 180);
        this.ctx.translate(-centerX, -centerY);
        
        // Set font
        this.ctx.font = `${element.fontWeight} ${element.fontSize}px "${element.fontFamily}", "Noto Nastaliq Urdu", Arial, sans-serif`;
        this.ctx.fillStyle = element.color;
        this.ctx.textAlign = element.alignment;
        this.ctx.direction = 'rtl';
        
        // Apply shadow
        if (element.shadowBlur > 0) {
            this.ctx.shadowColor = element.shadowColor;
            this.ctx.shadowBlur = element.shadowBlur;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
        }
        
        // Split text into lines and render
        const lines = element.text.split('\n');
        const lineHeight = element.fontSize + element.lineSpacing;
        let startY = element.y + element.fontSize;
        
        if (element.alignment === 'center') {
            startY = element.y + (element.height - (lines.length - 1) * lineHeight) / 2 + element.fontSize;
        }
        
        let textX = element.x;
        if (element.alignment === 'center') {
            textX = element.x + element.width / 2;
        } else if (element.alignment === 'right') {
            textX = element.x + element.width - 10;
        } else {
            textX = element.x + 10;
        }
        
        lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            
            // Apply word spacing for Urdu text
            if (element.wordSpacing !== 0) {
                const words = line.split(/(\s+)/); // Split while preserving spaces
                let currentX = textX;
                
                if (element.alignment === 'right') {
                    // Calculate total width first for RTL alignment
                    const totalExtraSpacing = (words.filter(word => word.trim()).length - 1) * element.wordSpacing;
                    currentX = textX - totalExtraSpacing;
                }
                
                words.forEach((word, wordIndex) => {
                    if (word.trim()) { // Only render non-empty words
                        this.ctx.fillText(word, currentX, y);
                        // Measure word width for proper spacing
                        const wordWidth = this.ctx.measureText(word).width;
                        currentX += wordWidth + element.wordSpacing;
                    } else if (word) { // Handle spaces
                        const spaceWidth = this.ctx.measureText(word).width;
                        currentX += spaceWidth;
                    }
                });
            } else {
                this.ctx.fillText(line, textX, y);
            }
        });
        
        this.ctx.restore();
    }

    renderSelectionHandles(element) {
        this.ctx.save();
        
        // Selection border
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(element.x, element.y, element.width, element.height);
        
        // Resize handles
        const handleSize = 8;
        this.ctx.fillStyle = '#667eea';
        this.ctx.setLineDash([]);
        
        // Corner handles
        this.ctx.fillRect(element.x - handleSize/2, element.y - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(element.x + element.width - handleSize/2, element.y - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(element.x - handleSize/2, element.y + element.height - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(element.x + element.width - handleSize/2, element.y + element.height - handleSize/2, handleSize, handleSize);
        
        // Rotation handle
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(element.x + element.width/2, element.y - 20, 6, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    getResizeHandle(x, y, element) {
        const handleSize = 8;
        const tolerance = handleSize;
        
        x = x / this.displayScale;
        y = y / this.displayScale;
        
        const handles = [
            { name: 'nw', x: element.x, y: element.y },
            { name: 'ne', x: element.x + element.width, y: element.y },
            { name: 'sw', x: element.x, y: element.y + element.height },
            { name: 'se', x: element.x + element.width, y: element.y + element.height },
            { name: 'rotate', x: element.x + element.width/2, y: element.y - 20 }
        ];
        
        for (const handle of handles) {
            if (Math.abs(x - handle.x) <= tolerance && Math.abs(y - handle.y) <= tolerance) {
                return handle.name;
            }
        }
        return null;
    }

    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        
        // Tool buttons
        document.getElementById('addTextBtn').addEventListener('click', () => {
            this.isAddingText = true;
            this.updateToolButtons();
        });
        
        document.getElementById('selectBtn').addEventListener('click', () => {
            this.isAddingText = false;
            this.updateToolButtons();
        });
        
        document.getElementById('deleteBtn').addEventListener('click', () => {
            if (this.selectedElement) {
                this.deleteElement(this.selectedElement);
            }
        });
        
        // History buttons
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        
        // Export buttons
        document.getElementById('exportJpg').addEventListener('click', () => this.exportAsJPG());
        document.getElementById('exportPdf').addEventListener('click', () => this.exportAsPDF());
        
        // Canvas size controls
        document.getElementById('cardWidth').addEventListener('input', () => this.updateCanvasSize());
        document.getElementById('cardHeight').addEventListener('input', () => this.updateCanvasSize());
        document.getElementById('aspectRatio').addEventListener('change', this.handleAspectRatioChange.bind(this));
        document.getElementById('backgroundColor').addEventListener('input', () => this.updateCanvas());
        
        // Properties panel
        document.getElementById('textInput').addEventListener('input', () => this.updateSelectedElementText());
        document.getElementById('fontFamily').addEventListener('change', () => this.updateSelectedElementProperty('fontFamily'));
        document.getElementById('fontSize').addEventListener('input', () => this.updateSelectedElementProperty('fontSize'));
        document.getElementById('fontWeight').addEventListener('change', () => this.updateSelectedElementProperty('fontWeight'));
        document.getElementById('fontColor').addEventListener('input', () => this.updateSelectedElementProperty('color'));
        document.getElementById('alignment').addEventListener('change', () => this.updateSelectedElementProperty('alignment'));
        document.getElementById('rotation').addEventListener('input', () => this.updateSelectedElementProperty('rotation'));
        document.getElementById('lineSpacing').addEventListener('input', () => this.updateSelectedElementProperty('lineSpacing'));
        document.getElementById('wordSpacing').addEventListener('input', () => this.updateSelectedElementProperty('wordSpacing'));
        document.getElementById('shadowColor').addEventListener('input', () => this.updateSelectedElementProperty('shadowColor'));
        document.getElementById('shadowBlur').addEventListener('input', () => this.updateSelectedElementProperty('shadowBlur'));
        document.getElementById('opacity').addEventListener('input', () => this.updateSelectedElementProperty('opacity'));
        
        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('open');
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'z':
                        e.preventDefault();
                        this.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.selectAll();
                        break;
                    case 'Delete':
                    case 'Backspace':
                        if (this.selectedElement) {
                            this.deleteElement(this.selectedElement);
                        }
                        break;
                }
            }
        });
        
        // Range value updates
        this.setupRangeValueUpdates();
    }

    setupRangeValueUpdates() {
        const ranges = [
            { id: 'fontSize', suffix: 'px' },
            { id: 'rotation', suffix: '°' },
            { id: 'lineSpacing', suffix: 'px' },
            { id: 'wordSpacing', suffix: 'px' },
            { id: 'shadowBlur', suffix: 'px' },
            { id: 'opacity', suffix: '%' }
        ];
        
        ranges.forEach(range => {
            const input = document.getElementById(range.id);
            const valueSpan = document.getElementById(range.id + 'Value');
            
            if (input && valueSpan) {
                input.addEventListener('input', () => {
                    valueSpan.textContent = input.value + range.suffix;
                });
            }
        });
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const element = this.getElementAt(x, y);
        
        if (this.isAddingText && !element) {
            // Add new text element
            this.addTextElement(document.getElementById('textInput').value, x / this.displayScale, y / this.displayScale);
            return;
        }
        
        if (element) {
            this.selectedElement = element;
            this.updatePropertiesPanel();
            
            // Check for resize handles
            const handle = this.getResizeHandle(x, y, element);
            if (handle) {
                if (handle === 'rotate') {
                    this.isRotating = true;
                } else {
                    this.isResizing = true;
                    this.resizeHandle = handle;
                }
            } else {
                this.isDragging = true;
            }
            
            this.dragStart = { x: x / this.displayScale, y: y / this.displayScale };
        } else {
            this.selectedElement = null;
            this.updatePropertiesPanel();
        }
        
        this.updateCanvas();
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const canvasX = x / this.displayScale;
        const canvasY = y / this.displayScale;
        
        if (this.isDragging && this.selectedElement) {
            const dx = canvasX - this.dragStart.x;
            const dy = canvasY - this.dragStart.y;
            
            this.selectedElement.x += dx;
            this.selectedElement.y += dy;
            
            this.dragStart = { x: canvasX, y: canvasY };
            this.updateCanvas();
        }
        
        if (this.isResizing && this.selectedElement && this.resizeHandle) {
            this.handleResize(canvasX, canvasY);
        }
        
        if (this.isRotating && this.selectedElement) {
            this.handleRotation(canvasX, canvasY);
        }
        
        // Update cursor
        this.updateCursor(x, y);
    }

    handleMouseUp(e) {
        if (this.isDragging || this.isResizing || this.isRotating) {
            this.saveState();
        }
        
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.resizeHandle = null;
    }

    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (!this.getElementAt(x, y)) {
            this.addTextElement("نیا متن", x / this.displayScale, y / this.displayScale);
        }
    }

    handleResize(x, y) {
        const element = this.selectedElement;
        
        switch (this.resizeHandle) {
            case 'se':
                element.width = Math.max(50, x - element.x);
                element.height = Math.max(20, y - element.y);
                break;
            case 'sw':
                const newWidth = Math.max(50, element.x + element.width - x);
                element.x = element.x + element.width - newWidth;
                element.width = newWidth;
                element.height = Math.max(20, y - element.y);
                break;
            case 'ne':
                element.width = Math.max(50, x - element.x);
                const newHeight = Math.max(20, element.y + element.height - y);
                element.y = element.y + element.height - newHeight;
                element.height = newHeight;
                break;
            case 'nw':
                const newW = Math.max(50, element.x + element.width - x);
                const newH = Math.max(20, element.y + element.height - y);
                element.x = element.x + element.width - newW;
                element.y = element.y + element.height - newH;
                element.width = newW;
                element.height = newH;
                break;
        }
        
        this.updateCanvas();
    }

    handleRotation(x, y) {
        const element = this.selectedElement;
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        
        const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
        element.rotation = Math.round(angle);
        
        // Update the rotation slider
        document.getElementById('rotation').value = element.rotation;
        document.getElementById('rotationValue').textContent = element.rotation + '°';
        
        this.updateCanvas();
    }

    updateCursor(x, y) {
        let cursor = 'default';
        
        if (this.isAddingText) {
            cursor = 'crosshair';
        } else if (this.selectedElement) {
            const handle = this.getResizeHandle(x, y, this.selectedElement);
            if (handle) {
                switch (handle) {
                    case 'nw':
                    case 'se':
                        cursor = 'nw-resize';
                        break;
                    case 'ne':
                    case 'sw':
                        cursor = 'ne-resize';
                        break;
                    case 'rotate':
                        cursor = 'grab';
                        break;
                }
            } else if (this.getElementAt(x, y)) {
                cursor = 'move';
            }
        }
        
        this.canvas.style.cursor = cursor;
    }

    updateToolButtons() {
        document.getElementById('addTextBtn').classList.toggle('primary', this.isAddingText);
        document.getElementById('selectBtn').classList.toggle('primary', !this.isAddingText);
    }

    updatePropertiesPanel() {
        if (this.selectedElement) {
            document.getElementById('textInput').value = this.selectedElement.text;
            document.getElementById('fontFamily').value = this.selectedElement.fontFamily;
            document.getElementById('fontSize').value = this.selectedElement.fontSize;
            document.getElementById('fontWeight').value = this.selectedElement.fontWeight;
            document.getElementById('fontColor').value = this.selectedElement.color;
            document.getElementById('alignment').value = this.selectedElement.alignment;
            document.getElementById('rotation').value = this.selectedElement.rotation;
            document.getElementById('lineSpacing').value = this.selectedElement.lineSpacing;
            document.getElementById('wordSpacing').value = this.selectedElement.wordSpacing;
            document.getElementById('shadowColor').value = this.selectedElement.shadowColor;
            document.getElementById('shadowBlur').value = this.selectedElement.shadowBlur;
            document.getElementById('opacity').value = this.selectedElement.opacity;
            
            // Update range value displays
            document.getElementById('fontSizeValue').textContent = this.selectedElement.fontSize + 'px';
            document.getElementById('rotationValue').textContent = this.selectedElement.rotation + '°';
            document.getElementById('lineSpacingValue').textContent = this.selectedElement.lineSpacing + 'px';
            document.getElementById('wordSpacingValue').textContent = this.selectedElement.wordSpacing + 'px';
            document.getElementById('shadowBlurValue').textContent = this.selectedElement.shadowBlur + 'px';
            document.getElementById('opacityValue').textContent = this.selectedElement.opacity + '%';
        }
    }

    updateSelectedElementText() {
        if (this.selectedElement) {
            this.selectedElement.text = document.getElementById('textInput').value;
            this.updateCanvas();
            this.saveState();
        }
    }

    updateSelectedElementProperty(property) {
        if (this.selectedElement) {
            const value = document.getElementById(property === 'color' ? 'fontColor' : property).value;
            
            if (property === 'color') {
                this.selectedElement.color = value;
            } else {
                this.selectedElement[property] = isNaN(value) ? value : Number(value);
            }
            
            this.updateCanvas();
            this.saveState();
        }
    }

    handleAspectRatioChange() {
        const aspectRatio = document.getElementById('aspectRatio').value;
        
        if (aspectRatio !== 'custom') {
            const [w, h] = aspectRatio.split(':').map(Number);
            const currentWidth = parseInt(document.getElementById('cardWidth').value);
            const newHeight = Math.round(currentWidth * h / w);
            
            document.getElementById('cardHeight').value = newHeight;
            this.updateCanvasSize();
        }
    }

    deleteElement(element) {
        const index = this.textElements.indexOf(element);
        if (index > -1) {
            this.textElements.splice(index, 1);
            this.selectedElement = null;
            this.updatePropertiesPanel();
            this.updateCanvas();
            this.saveState();
        }
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all elements?')) {
            this.textElements = [];
            this.selectedElement = null;
            this.updatePropertiesPanel();
            this.updateCanvas();
            this.saveState();
        }
    }

    saveState() {
        const state = {
            textElements: JSON.parse(JSON.stringify(this.textElements)),
            selectedElement: this.selectedElement ? this.selectedElement.id : null
        };
        
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadState(this.history[this.historyIndex]);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadState(this.history[this.historyIndex]);
        }
    }

    loadState(state) {
        this.textElements = JSON.parse(JSON.stringify(state.textElements));
        this.selectedElement = state.selectedElement ? 
            this.textElements.find(el => el.id === state.selectedElement) : null;
        this.updatePropertiesPanel();
        this.updateCanvas();
    }

    async exportAsJPG() {
        this.showLoading(true);
        
        try {
            // Create ultra-high resolution canvas for export
            const exportCanvas = document.createElement('canvas');
            const exportCtx = exportCanvas.getContext('2d');
            
            const width = parseInt(document.getElementById('cardWidth').value);
            const height = parseInt(document.getElementById('cardHeight').value);
            
            // Ultra-high resolution: 1200 DPI for printing
            const exportDpi = 1200;
            const mmToInch = 1 / 25.4;
            
            exportCanvas.width = width * mmToInch * exportDpi;
            exportCanvas.height = height * mmToInch * exportDpi;
            
            // Scale factor from display canvas to export canvas
            const scaleFactor = exportDpi / 600; // 600 is our display canvas DPI
            
            // Clear selection for export
            const originalSelected = this.selectedElement;
            this.selectedElement = null;
            
            // Fill background
            const bgColor = document.getElementById('backgroundColor').value;
            exportCtx.fillStyle = bgColor;
            exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            
            // Render all text elements at high resolution
            this.textElements.forEach(element => {
                this.renderTextElementOnContext(exportCtx, element, scaleFactor);
            });
            
            // Restore selection
            this.selectedElement = originalSelected;
            this.updateCanvas();
            
            // Export as high-quality JPEG
            const link = document.createElement('a');
            link.download = `urdu-card-${width}x${height}mm-1200dpi.jpg`;
            link.href = exportCanvas.toDataURL('image/jpeg', 1.0); // Maximum quality
            link.click();
            
            this.showNotification('High-quality JPG exported successfully! (1200 DPI)');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Export failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async exportAsPDF() {
        this.showLoading(true);
        
        try {
            // Create ultra-high resolution canvas for PDF export
            const exportCanvas = document.createElement('canvas');
            const exportCtx = exportCanvas.getContext('2d');
            
            const width = parseInt(document.getElementById('cardWidth').value);
            const height = parseInt(document.getElementById('cardHeight').value);
            
            // Ultra-high resolution: 1200 DPI for PDF
            const exportDpi = 1200;
            const mmToInch = 1 / 25.4;
            
            exportCanvas.width = width * mmToInch * exportDpi;
            exportCanvas.height = height * mmToInch * exportDpi;
            
            // Scale factor from display canvas to export canvas
            const scaleFactor = exportDpi / 600;
            
            // Clear selection for export
            const originalSelected = this.selectedElement;
            this.selectedElement = null;
            
            // Fill background
            const bgColor = document.getElementById('backgroundColor').value;
            exportCtx.fillStyle = bgColor;
            exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            
            // Render all text elements at high resolution
            this.textElements.forEach(element => {
                this.renderTextElementOnContext(exportCtx, element, scaleFactor);
            });
            
            // Restore selection
            this.selectedElement = originalSelected;
            this.updateCanvas();
            
            // Convert to base64 for server processing
            const canvasData = exportCanvas.toDataURL('image/png');
            
            const response = await fetch('/export_pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    canvas_data: canvasData,
                    width: width,
                    height: height,
                    dpi: exportDpi
                })
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `urdu-card-${width}x${height}mm-1200dpi.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                this.showNotification('High-quality PDF exported successfully! (1200 DPI)');
            } else {
                const errorText = await response.text();
                throw new Error(`Server error: ${errorText}`);
            }
        } catch (error) {
            console.error('PDF export error:', error);
            this.showNotification('PDF export failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderTextElementOnContext(ctx, element, scaleFactor = 1) {
        ctx.save();
        
        // Apply opacity
        ctx.globalAlpha = element.opacity / 100;
        
        // Scale all coordinates and sizes for high-resolution export
        const scaledX = element.x * scaleFactor;
        const scaledY = element.y * scaleFactor;
        const scaledWidth = element.width * scaleFactor;
        const scaledHeight = element.height * scaleFactor;
        const scaledFontSize = element.fontSize * scaleFactor;
        const scaledLineSpacing = element.lineSpacing * scaleFactor;
        const scaledWordSpacing = element.wordSpacing * scaleFactor;
        
        // Apply rotation
        const centerX = scaledX + scaledWidth / 2;
        const centerY = scaledY + scaledHeight / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
        
        // Set font with scaled size
        ctx.font = `${element.fontWeight} ${scaledFontSize}px "${element.fontFamily}", "Noto Nastaliq Urdu", Arial, sans-serif`;
        ctx.fillStyle = element.color;
        ctx.textAlign = element.alignment;
        ctx.direction = 'rtl';
        
        // Apply shadow with scaled values
        if (element.shadowBlur > 0) {
            ctx.shadowColor = element.shadowColor;
            ctx.shadowBlur = element.shadowBlur * scaleFactor;
            ctx.shadowOffsetX = 2 * scaleFactor;
            ctx.shadowOffsetY = 2 * scaleFactor;
        }
        
        // Split text into lines and render
        const lines = element.text.split('\n');
        const lineHeight = scaledFontSize + scaledLineSpacing;
        let startY = scaledY + scaledFontSize;
        
        if (element.alignment === 'center') {
            startY = scaledY + (scaledHeight - (lines.length - 1) * lineHeight) / 2 + scaledFontSize;
        }
        
        let textX = scaledX;
        if (element.alignment === 'center') {
            textX = scaledX + scaledWidth / 2;
        } else if (element.alignment === 'right') {
            textX = scaledX + scaledWidth - (10 * scaleFactor);
        } else {
            textX = scaledX + (10 * scaleFactor);
        }
        
        lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            
            // Apply word spacing for Urdu text
            if (element.wordSpacing !== 0) {
                const words = line.split(/(\s+)/); // Split while preserving spaces
                let currentX = textX;
                
                if (element.alignment === 'right') {
                    // Calculate total width first for RTL alignment
                    const totalExtraSpacing = (words.filter(word => word.trim()).length - 1) * scaledWordSpacing;
                    currentX = textX - totalExtraSpacing;
                }
                
                words.forEach((word, wordIndex) => {
                    if (word.trim()) { // Only render non-empty words
                        ctx.fillText(word, currentX, y);
                        // Measure word width for proper spacing
                        const wordWidth = ctx.measureText(word).width;
                        currentX += wordWidth + scaledWordSpacing;
                    } else if (word) { // Handle spaces
                        const spaceWidth = ctx.measureText(word).width;
                        currentX += spaceWidth;
                    }
                });
            } else {
                ctx.fillText(line, textX, y);
            }
        });
        
        ctx.restore();
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    selectAll() {
        // Implementation for select all if needed
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.urduEditor = new UrduCanvasEditorPro();
});

// Add some nice visual feedback
document.addEventListener('DOMContentLoaded', () => {
    // Add fade-in animation to main elements
    const elements = document.querySelectorAll('.sidebar, .canvas-area, .properties-panel');
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            el.style.transition = 'all 0.6s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100 * index);
    });
});
