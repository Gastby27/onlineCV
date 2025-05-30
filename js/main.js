class ColorExtractor {
    constructor() {
        this.tooltip = document.getElementById('colorTooltip');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1;
        this.canvas.height = 1;
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseleave', () => this.hideTooltip());
    }

    handleMouseMove(e) {
        const element = e.target;
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        try {
            const color = this.getColorAtPoint(element, x, y);
            if (color) {
                this.showTooltip(e.clientX, e.clientY, color);
            }
        } catch (error) {
            // Fallback per elementi che non possono essere analizzati
            const computedStyle = window.getComputedStyle(element);
            const bgColor = computedStyle.backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                const hexColor = this.rgbToHex(bgColor);
                if (hexColor) {
                    this.showTooltip(e.clientX, e.clientY, hexColor);
                }
            }
        }
    }

    getColorAtPoint(element, x, y) {
        // Crea un elemento temporaneo per il rendering
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = element.offsetWidth + 'px';
        tempDiv.style.height = element.offsetHeight + 'px';

        // Copia gli stili
        const computedStyle = window.getComputedStyle(element);
        tempDiv.style.background = computedStyle.background;
        tempDiv.style.backgroundColor = computedStyle.backgroundColor;
        tempDiv.style.backgroundImage = computedStyle.backgroundImage;

        document.body.appendChild(tempDiv);

        // Usa html2canvas-like approach o fallback
        const bgColor = computedStyle.backgroundColor;
        const bgImage = computedStyle.backgroundImage;

        document.body.removeChild(tempDiv);

        if (bgImage && bgImage !== 'none') {
            // Per i gradienti, usa un approccio diverso
            return this.extractGradientColor(bgImage, x, y, element.offsetWidth, element.offsetHeight);
        } else if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            return this.rgbToHex(bgColor);
        }

        return null;
    }

    extractGradientColor(backgroundImage, x, y, width, height) {
        // Parsing semplificato per gradienti lineari
        if (backgroundImage.includes('linear-gradient')) {
            const colors = this.parseGradientColors(backgroundImage);
            if (colors.length >= 2) {
                // Calcola la posizione relativa nel gradiente
                const position = x / width; // semplificato per gradiente orizzontale
                return this.interpolateColor(colors[0], colors[1], position);
            }
        }

        // Per gradienti complessi, usa il primo colore trovato
        const colors = this.parseGradientColors(backgroundImage);
        return colors.length > 0 ? colors[0] : null;
    }

    parseGradientColors(gradient) {
        // Regex per estrarre i colori dai gradienti
        const colorRegex = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
        const matches = gradient.match(colorRegex) || [];

        return matches.map(color => {
            if (color.startsWith('#')) {
                return color;
            } else {
                return this.rgbToHex(color);
            }
        }).filter(color => color !== null);
    }

    interpolateColor(color1, color2, factor) {
        // Semplice interpolazione tra due colori hex
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        if (!c1 || !c2) return color1;

        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);

        return this.rgbToHex(`rgb(${r}, ${g}, ${b})`);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(rgb) {
        // Gestisce rgb(), rgba() e named colors
        if (rgb.startsWith('#')) return rgb;

        const rgbMatch = rgb.match(/\d+/g);
        if (!rgbMatch || rgbMatch.length < 3) return null;

        const r = parseInt(rgbMatch[0]);
        const g = parseInt(rgbMatch[1]);
        const b = parseInt(rgbMatch[2]);

        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    showTooltip(mouseX, mouseY, color) {
        this.tooltip.textContent = color;
        this.tooltip.style.left = (mouseX + 10) + 'px';
        this.tooltip.style.top = (mouseY - 40) + 'px';
        this.tooltip.classList.add('show');
    }

    hideTooltip() {
        this.tooltip.classList.remove('show');
    }
}

// Inizializza l'estrattore di colori quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    new ColorExtractor();
});