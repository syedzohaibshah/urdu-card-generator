class UrduCardGenerator {
  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.updateSliderValues();
    this.loadAvailableFonts();
  }

  initializeElements() {
    // Text and dimensions
    this.textInput = document.getElementById("textInput");
    this.cardWidth = document.getElementById("cardWidth");
    this.cardHeight = document.getElementById("cardHeight");
    this.aspectRatio = document.getElementById("aspectRatio");

    // Typography
    this.fontFamily = document.getElementById("fontFamily");
    this.fontSize = document.getElementById("fontSize");
    this.fontSizeValue = document.getElementById("fontSizeValue");
    this.fontColor = document.getElementById("fontColor");
    this.alignment = document.getElementById("alignment");

    // Layout
    this.backgroundColor = document.getElementById("backgroundColor");
    this.lineSpacing = document.getElementById("lineSpacing");
    this.lineSpacingValue = document.getElementById("lineSpacingValue");

    // Buttons
    this.previewBtn = document.getElementById("previewBtn");
    this.exportJpg = document.getElementById("exportJpg");
    this.exportPdf = document.getElementById("exportPdf");

    // Preview
    this.cardPreview = document.getElementById("cardPreview");
    this.previewDimensions = document.getElementById("previewDimensions");
    this.loadingOverlay = document.getElementById("loadingOverlay");
  }

  bindEvents() {
    // Slider value updates
    this.fontSize.addEventListener("input", () => this.updateSliderValues());
    this.lineSpacing.addEventListener("input", () => this.updateSliderValues());

    // Dimension updates
    this.cardWidth.addEventListener("input", () => this.updateDimensions());
    this.cardHeight.addEventListener("input", () => this.updateDimensions());
    this.aspectRatio.addEventListener("change", () =>
      this.handleAspectRatioChange()
    );

    // Button events
    this.previewBtn.addEventListener("click", () => this.generatePreview());
    this.exportJpg.addEventListener("click", () => this.exportCard("jpg"));
    this.exportPdf.addEventListener("click", () => this.exportCard("pdf"));

    // Template buttons
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("template-btn")) {
        const template = e.target.getAttribute("data-template");
        if (template) {
          this.textInput.value = template;
          this.generatePreview();
          this.showNotification("Template applied!", "success");
        }
      }
    });

    // Real-time preview updates
    const inputs = [
      this.textInput,
      this.fontFamily,
      this.fontSize,
      this.fontColor,
      this.alignment,
      this.backgroundColor,
      this.lineSpacing,
    ];

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        clearTimeout(this.previewTimeout);
        this.previewTimeout = setTimeout(() => this.generatePreview(), 800);
      });
    });

    // Dimension inputs - immediate update for dimensions display
    this.cardWidth.addEventListener("input", () => {
      this.updateDimensions();
      clearTimeout(this.previewTimeout);
      this.previewTimeout = setTimeout(() => this.generatePreview(), 1000);
    });

    this.cardHeight.addEventListener("input", () => {
      this.updateDimensions();
      clearTimeout(this.previewTimeout);
      this.previewTimeout = setTimeout(() => this.generatePreview(), 1000);
    });
  }

  updateSliderValues() {
    this.fontSizeValue.textContent = `${this.fontSize.value}px`;
    this.lineSpacingValue.textContent = `${this.lineSpacing.value}px`;
  }

  updateDimensions() {
    const width = this.cardWidth.value;
    const height = this.cardHeight.value;
    this.previewDimensions.textContent = `${width}mm × ${height}mm`;
  }

  handleAspectRatioChange() {
    const ratio = this.aspectRatio.value;
    if (ratio === "custom") return;

    const currentWidth = parseInt(this.cardWidth.value);
    let newHeight;

    switch (ratio) {
      case "16:9":
        newHeight = Math.round((currentWidth * 9) / 16);
        break;
      case "4:3":
        newHeight = Math.round((currentWidth * 3) / 4);
        break;
      case "1:1":
        newHeight = currentWidth;
        break;
      case "3:4":
        newHeight = Math.round((currentWidth * 4) / 3);
        break;
      case "5:7":
        newHeight = Math.round((currentWidth * 7) / 5);
        break;
      default:
        return;
    }

    this.cardHeight.value = newHeight;
    this.updateDimensions();
    this.generatePreview();
  }

  async loadAvailableFonts() {
    try {
      const response = await fetch("/fonts");
      const fonts = await response.json();

      // Clear existing options
      this.fontFamily.innerHTML = "";

      // Add fonts to select
      fonts.forEach((font) => {
        const option = document.createElement("option");
        option.value = font;
        option.textContent = font;
        this.fontFamily.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading fonts:", error);
    }
  }

  getCardData() {
    return {
      text: this.textInput.value.trim() || "نمونہ متن\nSample Text",
      width: Math.max(
        10,
        Math.min(500, parseFloat(this.cardWidth.value) || 100)
      ),
      height: Math.max(
        10,
        Math.min(500, parseFloat(this.cardHeight.value) || 70)
      ),
      fontSize: Math.max(8, Math.min(72, parseInt(this.fontSize.value) || 16)),
      fontColor: this.fontColor.value || "#000000",
      backgroundColor: this.backgroundColor.value || "#FFFFFF",
      alignment: this.alignment.value || "right",
      lineSpacing: Math.max(
        0,
        Math.min(50, parseInt(this.lineSpacing.value) || 5)
      ),
      fontFamily: this.fontFamily.value || "Noto Nastaliq Urdu",
    };
  }

  showLoading(show = true) {
    this.loadingOverlay.style.display = show ? "flex" : "none";

    // Disable/enable buttons during loading
    const buttons = [this.previewBtn, this.exportJpg, this.exportPdf];
    buttons.forEach((btn) => {
      if (btn) {
        btn.disabled = show;
        btn.style.opacity = show ? "0.6" : "1";
      }
    });
  }

  async generatePreview() {
    try {
      const cardData = this.getCardData();

      // Validate required data
      if (!cardData.text || cardData.text.trim() === "") {
        this.showNotification("Please enter some text", "warning");
        return;
      }

      // Show loading
      this.showLoading(true);

      // Update preview placeholder
      this.cardPreview.innerHTML =
        '<div class="preview-placeholder">Generating preview...</div>';

      const response = await fetch("/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.cardPreview.innerHTML = `<img src="${result.image}" alt="Card Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        this.showNotification("Preview generated successfully!", "success");
      } else {
        const errorMsg =
          result.error || result.message || "Preview generation failed";
        this.cardPreview.innerHTML = `<div class="preview-placeholder error">Error: ${errorMsg}</div>`;
        this.showNotification(errorMsg, "error");
      }
    } catch (error) {
      console.error("Preview error:", error);
      this.cardPreview.innerHTML =
        '<div class="preview-placeholder error">Network error. Please check your connection.</div>';
      this.showNotification("Network error. Please try again.", "error");
    } finally {
      this.showLoading(false);
    }
  }

  async exportCard(format) {
    try {
      const cardData = this.getCardData();

      // Validate required data
      if (!cardData.text || cardData.text.trim() === "") {
        this.showNotification(
          "Please enter some text before exporting",
          "warning"
        );
        return;
      }

      // Show loading
      this.showLoading(true);
      this.showNotification(
        `Generating ${format.toUpperCase()} file...`,
        "info"
      );

      const response = await fetch(`/export/${format}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
      });

      if (response.ok) {
        // Check if response is a file or error JSON
        const contentType = response.headers.get("Content-Type");

        if (contentType && contentType.includes("application/json")) {
          // It's an error response
          const error = await response.json();
          this.showNotification(error.error || "Export failed", "error");
          return;
        }

        // It's a file - proceed with download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;

        // Get filename from response headers or create one
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = `urdu_card_${Date.now()}.${format}`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(
            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
          );
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, "");
          }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        this.showNotification(
          `${format.toUpperCase()} exported successfully!`,
          "success"
        );
      } else {
        // Try to get error message from response
        let errorMsg = `Export failed (${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch (e) {
          errorMsg = (await response.text()) || errorMsg;
        }
        this.showNotification(errorMsg, "error");
      }
    } catch (error) {
      console.error("Export error:", error);
      this.showNotification(
        "Export failed. Please check your connection and try again.",
        "error"
      );
    } finally {
      this.showLoading(false);
    }
  }

  showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((n) => n.remove());

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

    // Color scheme based on type
    const colors = {
      success: { bg: "#4CAF50", icon: "✓" },
      error: { bg: "#f44336", icon: "✗" },
      warning: { bg: "#ff9800", icon: "⚠" },
      info: { bg: "#2196F3", icon: "ℹ" },
    };

    const color = colors[type] || colors.info;

    // Style the notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "16px 20px",
      backgroundColor: color.bg,
      color: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      zIndex: "1001",
      fontSize: "14px",
      fontWeight: "500",
      maxWidth: "350px",
      wordWrap: "break-word",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      animation: "slideInRight 0.3s ease-out",
      cursor: "pointer",
    });

    // Style close button
    const closeBtn = notification.querySelector(".notification-close");
    Object.assign(closeBtn.style, {
      background: "none",
      border: "none",
      color: "white",
      fontSize: "18px",
      cursor: "pointer",
      padding: "0",
      marginLeft: "10px",
      opacity: "0.7",
    });

    // Add icon
    notification.querySelector(
      ".notification-message"
    ).innerHTML = `<span style="margin-right: 8px;">${color.icon}</span>${message}`;

    // Add animation keyframes if not exist
    if (!document.querySelector("#notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .notification:hover {
                    transform: translateX(-5px);
                    transition: transform 0.2s ease;
                }
                .notification-close:hover {
                    opacity: 1 !important;
                    transform: scale(1.2);
                    transition: all 0.2s ease;
                }
            `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Close notification on click
    const closeNotification = () => {
      notification.style.animation = "slideOutRight 0.3s ease-in";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    };

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeNotification();
    });

    notification.addEventListener("click", closeNotification);

    // Auto-remove notification
    const duration = type === "error" ? 6000 : type === "warning" ? 5000 : 4000;
    setTimeout(closeNotification, duration);
  }

  // Initialize with a default preview
  init() {
    setTimeout(() => {
      this.generatePreview();
    }, 500);
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const generator = new UrduCardGenerator();
  generator.init();
});

// Add some helpful keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Enter for preview
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    document.getElementById("previewBtn").click();
  }

  // Ctrl/Cmd + S for JPG export
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    document.getElementById("exportJpg").click();
  }

  // Ctrl/Cmd + P for PDF export
  if ((e.ctrlKey || e.metaKey) && e.key === "p") {
    e.preventDefault();
    document.getElementById("exportPdf").click();
  }
});
