/**
 * CALCULADORA ELITE - CORE ENGINE
 * Motor de lógica nativo, offline-first.
 */

// --- NAVEGACIÓN ---
function switchTab(tab) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-${tab}`).classList.add('active-tab');
}

// --- MINI CHART ENGINE (Canvas API) ---
class MiniChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.options = options;
        this.margin = { top: 40, right: 60, bottom: 80, left: 60 };
        this.resize();
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        
        // High Definition Scaling
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawAxes(xLabels, yMax, y2Max = null) {
        // Dynamic Font Size
        const fontSize = xLabels.length > 15 ? 10 : 12;
        this.ctx.font = `bold ${fontSize}px sans-serif`;
        
        // Dynamic Left Margin based on Y-axis text width
        const yLabelWidth = this.ctx.measureText(Math.round(yMax).toString()).width;
        this.margin.left = yLabelWidth + 30;

        const { top, right, bottom, left } = this.margin;
        const drawWidth = this.width - left - right;
        const drawHeight = this.height - top - bottom;

        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = '#334155';

        // Y-Axis Ticks & Labels
        const ticks = 5;
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        for (let i = 0; i <= ticks; i++) {
            const y = top + drawHeight - (i * drawHeight / ticks);
            const val = Math.round(i * yMax / ticks);
            
            this.ctx.beginPath();
            this.ctx.moveTo(left - 5, y);
            this.ctx.lineTo(left + drawWidth, y);
            this.ctx.stroke();
            this.ctx.fillText(val, left - 15, y);

            if (y2Max !== null) {
                const val2 = Math.round(i * y2Max / ticks);
                this.ctx.save();
                this.ctx.textAlign = 'left';
                this.ctx.fillText(val2 + (y2Max === 100 ? '%' : ''), left + drawWidth + 15, y);
                this.ctx.restore();
            }
        }

        // X-Axis Labels (Dynamic Rotation & Anchoring)
        const xStep = drawWidth / xLabels.length;
        const rotateLabels = xLabels.length > 8;

        xLabels.forEach((label, i) => {
            const x = left + (i * xStep) + (xStep / 2);
            const y = top + drawHeight + 15;

            this.ctx.save();
            if (rotateLabels) {
                this.ctx.translate(x, y);
                this.ctx.rotate(-Math.PI / 4); // -45 degrees
                this.ctx.textAlign = 'right';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(label, 0, 0);
            } else {
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'top';
                this.ctx.fillText(label, x, y);
            }
            this.ctx.restore();
        });

        return { left, top, drawWidth, drawHeight };
    }

    drawHistogram(labels, data) {
        this.clear();
        const yMax = Math.max(...data) * 1.1 || 10;
        const { left, top, drawWidth, drawHeight } = this.drawAxes(labels, yMax);
        
        const xStep = drawWidth / data.length;

        // Bars
        data.forEach((val, i) => {
            const h = (val / yMax) * drawHeight;
            const x = left + (i * xStep);
            const y = top + drawHeight - h;

            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
            this.ctx.strokeStyle = '#2563eb';
            this.ctx.lineWidth = 1;
            this.ctx.fillRect(x, y, xStep, h);
            this.ctx.strokeRect(x, y, xStep, h);
        });

        // Polygon
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#f97316';
        this.ctx.lineWidth = 3;
        data.forEach((val, i) => {
            const h = (val / yMax) * drawHeight;
            const x = left + (i * xStep) + (xStep / 2);
            const y = top + drawHeight - h;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();
        
        // Points
        this.ctx.fillStyle = '#f97316';
        data.forEach((val, i) => {
            const h = (val / yMax) * drawHeight;
            const x = left + (i * xStep) + (xStep / 2);
            const y = top + drawHeight - h;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawOjiva(labels, data) {
        this.clear();
        const yMax = Math.max(...data) * 1.1 || 10;
        const { left, top, drawWidth, drawHeight } = this.drawAxes(labels, yMax);
        
        const xStep = drawWidth / data.length;

        // Area
        this.ctx.beginPath();
        this.ctx.moveTo(left, top + drawHeight);
        data.forEach((val, i) => {
            const h = (val / yMax) * drawHeight;
            const x = left + (i * xStep) + (xStep / 2);
            const y = top + drawHeight - h;
            this.ctx.lineTo(x, y);
        });
        this.ctx.lineTo(left + drawWidth, top + drawHeight);
        this.ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
        this.ctx.fill();

        // Line
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 3;
        data.forEach((val, i) => {
            const h = (val / yMax) * drawHeight;
            const x = left + (i * xStep) + (xStep / 2);
            const y = top + drawHeight - h;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();
    }

    drawPareto(labels, freq, percent) {
        this.clear();
        const yMax = Math.max(...freq) * 1.1 || 10;
        const { left, top, drawWidth, drawHeight } = this.drawAxes(labels, yMax, 100);

        const xStep = drawWidth / freq.length;

        // Bars
        freq.forEach((val, i) => {
            const h = (val / yMax) * drawHeight;
            const x = left + (i * xStep) + (xStep * 0.1);
            const y = top + drawHeight - h;
            const w = xStep * 0.8;

            this.ctx.fillStyle = '#475569';
            this.ctx.fillRect(x, y, w, h);
        });

        // Cumulative Line
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 3;
        percent.forEach((val, i) => {
            const h = (val / 100) * drawHeight;
            const x = left + (i * xStep) + (xStep / 2);
            const y = top + drawHeight - h;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();

        // Points
        this.ctx.fillStyle = '#ef4444';
        percent.forEach((val, i) => {
            const h = (val / 100) * drawHeight;
            const x = left + (i * xStep) + (xStep / 2);
            const y = top + drawHeight - h;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}

/**
 * Función auxiliar para dibujo simple de barras
 */
function drawSimpleBar(canvasId, labels, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const yMax = Math.max(...data) * 1.1 || 10;
    const xStep = chartWidth / data.length;
    
    data.forEach((val, i) => {
        const h = (val / yMax) * chartHeight;
        const x = padding + (i * xStep);
        const y = padding + chartHeight - h;
        
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(x + 5, y, xStep - 10, h);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + xStep/2, padding + chartHeight + 15);
    });
}

// --- ESTADÍSTICA LOGIC ---
let charts = { h: null, o: null, p: null };

function generateAndCalculate() {
    const n = Math.max(20, Math.min(1000, parseInt(document.getElementById('gen-count').value) || 100));
    document.getElementById('gen-count').value = n;
    const data = Array.from({ length: n }, () => Math.floor(Math.random() * 999) + 1);
    document.getElementById('data-input').value = data.join(', ');
    calculateStats();
}

function calculateStats() {
    const input = document.getElementById('data-input').value;
    const raw = input.split(/[,\s]+/).filter(v => v.trim() !== '').map(Number);
    if (raw.length === 0 || raw.some(isNaN)) return;

    const data = [...raw].sort((a, b) => a - b);
    const n = data.length;
    const min = Math.floor(data[0]);
    const max = Math.ceil(data[n-1]);
    const range = max - min;
    
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 !== 0 ? data[Math.floor(n/2)] : (data[n/2-1] + data[n/2]) / 2;
    
    const freqMap = new Map();
    data.forEach(x => freqMap.set(x, (freqMap.get(x) || 0) + 1));
    let maxF = 0; freqMap.forEach(v => { if(v > maxF) maxF = v; });
    const modes = []; freqMap.forEach((v, k) => { if(v === maxF) modes.push(k); });

    const k = Math.ceil(Math.sqrt(n));
    const a = Math.ceil(range / k) || 1;
    const intervals = [];
    let currentMin = min;
    for (let i = 0; i < k; i++) {
        const lower = currentMin;
        const upper = lower + a;
        const count = (i === k - 1) ? data.filter(x => x >= lower && x <= upper).length : data.filter(x => x >= lower && x < upper).length;
        intervals.push({ label: `${lower}-${upper}`, midpoint: (lower+upper)/2, f: count });
        currentMin = upper;
    }

    renderStatsUI(mean, median, modes, maxF, n, min, max, range, intervals, freqMap);
}

function renderStatsUI(mean, median, modes, maxF, n, min, max, range, intervals, freqMap) {
    document.getElementById('res-mean').textContent = mean.toFixed(2);
    document.getElementById('res-median').textContent = median.toFixed(2);
    document.getElementById('res-mode').textContent = (maxF === 1 && n > 1) ? "Sin Moda" : modes.slice(0, 3).join(', ');
    document.getElementById('res-min').textContent = min;
    document.getElementById('res-max').textContent = max;
    document.getElementById('res-range').textContent = range;

    const tbody = document.getElementById('table-stats-body');
    tbody.innerHTML = '';
    let cum = 0;
    intervals.forEach(int => {
        cum += int.f;
        tbody.innerHTML += `<tr>
            <td class="font-mono-bold">${int.label}</td>
            <td style="color: var(--text-light); font-weight: 700;">${int.midpoint.toFixed(1)}</td>
            <td style="color: var(--primary); font-weight: 900;">${int.f}</td>
            <td style="color: var(--text-light); font-weight: 700;">${cum}</td>
            <td style="color: var(--accent-emerald); font-weight: 900;">${((int.f/n)*100).toFixed(1)}%</td>
        </tr>`;
    });

    // Aseguramos visibilidad ANTES de renderizar gráficos para que getBoundingClientRect funcione
    document.getElementById('stats-results').classList.remove('hidden');
    
    try {
        renderCharts(intervals, n, freqMap);
    } catch (e) {
        console.error("Error renderizando gráficos:", e);
    }
}

function renderCharts(intervals, n, freqMap) {
    const labels = intervals.map(i => i.label);
    const freqs = intervals.map(i => i.f);
    let cum = 0; const cums = freqs.map(f => { cum += f; return cum; });

    // Histograma
    if (!charts.h) charts.h = new MiniChart('chartHist');
    charts.h.resize();
    charts.h.drawHistogram(labels, freqs);

    // Ojiva
    if (!charts.o) charts.o = new MiniChart('chartOjiva');
    charts.o.resize();
    charts.o.drawOjiva(labels, cums);

    // Pareto
    const pData = Array.from(freqMap.entries()).sort((a,b) => b[1]-a[1]);
    let pCum = 0;
    const pLabels = pData.map(x => x[0]);
    const pFreqs = pData.map(x => x[1]);
    const pPercents = pData.map(x => { pCum += x[1]; return (pCum/n)*100; });

    if (!charts.p) charts.p = new MiniChart('chartPareto');
    charts.p.resize();
    charts.p.drawPareto(pLabels, pFreqs, pPercents);
}

function clearStats() {
    document.getElementById('data-input').value = '';
    document.getElementById('stats-results').classList.add('hidden');
}

// --- CONJUNTOS PARSER ---
class SetParser {
    constructor(setsMap, universe) {
        this.sets = setsMap;
        this.universe = universe;
        this.ops = {
            "'": { prec: 4, assoc: 'right', unary: true },
            "n": { prec: 3, assoc: 'left' },
            "U": { prec: 2, assoc: 'left' },
            "-": { prec: 2, assoc: 'left' },
            "Δ": { prec: 2, assoc: 'left' }
        };
    }

    tokenize(expr) {
        expr = expr.replace(/\^c/g, "'").replace(/\*/g, 'n').replace(/\+/g, 'U').replace(/\\/g, '-').replace(/d/g, 'Δ')
                   .replace(/∩/g, 'n').replace(/∪/g, 'U').replace(/−/g, '-');
        const tokens = [];
        let i = 0;
        while (i < expr.length) {
            let c = expr[i];
            if (/\s/.test(c)) { i++; continue; }
            if (this.ops[c] || c === '(' || c === ')') {
                tokens.push(c);
                i++;
            } else {
                let name = "";
                while (i < expr.length && /[a-zA-Z0-9]/.test(expr[i])) {
                    name += expr[i++];
                }
                if (name) tokens.push(name);
                else i++;
            }
        }
        return tokens;
    }

    parse(tokens) {
        const output = [];
        const stack = [];
        tokens.forEach(token => {
            if (this.sets.has(token) || token === 'S') {
                output.push(token);
            } else if (token === '(') {
                stack.push(token);
            } else if (token === ')') {
                while (stack.length && stack[stack.length - 1] !== '(') output.push(stack.pop());
                stack.pop();
            } else if (this.ops[token]) {
                const o1 = this.ops[token];
                while (stack.length && this.ops[stack[stack.length - 1]]) {
                    const o2 = this.ops[stack[stack.length - 1]];
                    if ((o1.assoc === 'left' && o1.prec <= o2.prec) || (o1.assoc === 'right' && o1.prec < o2.prec)) {
                        output.push(stack.pop());
                    } else break;
                }
                stack.push(token);
            }
        });
        while (stack.length) output.push(stack.pop());
        return output;
    }

    evaluate(rpn) {
        const stack = [];
        rpn.forEach(token => {
            if (this.sets.has(token) || token === 'S') {
                stack.push(token === 'S' ? this.universe : this.sets.get(token));
            } else {
                const op = this.ops[token];
                if (op.unary) {
                    const A = stack.pop();
                    stack.push(new Set([...this.universe].filter(x => !A.has(x))));
                } else {
                    const B = stack.pop();
                    const A = stack.pop();
                    if (!A || !B) return;
                    if (token === 'n') stack.push(new Set([...A].filter(x => B.has(x))));
                    else if (token === 'U') stack.push(new Set([...A, ...B]));
                    else if (token === '-') stack.push(new Set([...A].filter(x => !B.has(x))));
                    else if (token === 'Δ') stack.push(new Set([...[...A].filter(x => !B.has(x)), ...[...B].filter(x => !A.has(x))]));
                }
            }
        });
        return stack[0];
    }
}

let setIndex = 0;
function addSetRow() {
    const container = document.getElementById('sets-container');
    const letters = "ABCDEFGHIJKLMOPQRTUVWXYZ";
    const defaultName = letters[container.children.length] || `K${setIndex++}`;
    const id = `row-${Date.now()}`;
    const html = `
        <div id="${id}" class="set-card fade-in">
            <input type="text" class="set-name-input" value="${defaultName}">
            <input type="text" class="set-elements-input" placeholder="a, b, 1, 2...">
            <button onclick="document.getElementById('${id}').remove()" style="color: #cbd5e1; background: none; border: none; cursor: pointer; font-size: 1.25rem; font-weight: 900;">×</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function insertAtCursor(v) {
    const input = document.getElementById('set-expression');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, start) + v + input.value.substring(end);
    input.focus();
}

function evaluateExpression() {
    const universeStr = document.getElementById('set-universe').value;
    const expr = document.getElementById('set-expression').value;
    const resBox = document.getElementById('set-result-box');
    const errBox = document.getElementById('set-error-box');
    
    resBox.classList.add('hidden');
    errBox.classList.add('hidden');

    try {
        const universe = new Set(universeStr.split(/[,\s]+/).filter(v => v.trim() !== '').map(v => v.trim()));
        if (universe.size === 0) throw "Define el Universo S primero.";

        const setsMap = new Map();
        document.querySelectorAll('.set-card').forEach(card => {
            const name = card.querySelector('.set-name-input').value.trim().toUpperCase();
            const els = new Set(card.querySelector('.set-elements-input').value.split(/[,\s]+/).filter(v => v.trim() !== '').map(v => v.trim()));
            if (name === 'S') throw "El nombre 'S' está reservado.";
            setsMap.set(name, els);
        });

        const parser = new SetParser(setsMap, universe);
        const tokens = parser.tokenize(expr);
        const rpn = parser.parse(tokens);
        const result = parser.evaluate(rpn);

        if (!result) throw "Expresión inválida.";

        const sorted = Array.from(result).sort();
        document.getElementById('set-result-data').textContent = sorted.length > 0 ? `{ ${sorted.join(', ')} }` : "{ ∅ (Vacío) }";
        document.getElementById('set-result-cardinality').textContent = `n(Res) = ${result.size}`;
        resBox.classList.remove('hidden');
    } catch (e) {
        document.getElementById('set-error-text').textContent = e;
        errBox.classList.remove('hidden');
    }
}

function copySetResult() {
    const text = document.getElementById('set-result-data').textContent;
    navigator.clipboard.writeText(text);
}

function clearSets() {
    document.getElementById('set-expression').value = '';
    document.getElementById('set-result-box').classList.add('hidden');
    document.getElementById('set-error-box').classList.add('hidden');
}

// --- PROBABILIDAD LOGIC ---
function calculateProbability() {
    const n = parseFloat(document.getElementById('prob-n').value);
    const N = parseFloat(document.getElementById('prob-N').value);
    const resBox = document.getElementById('prob-results-container');
    const errBox = document.getElementById('prob-error-box');

    resBox.classList.add('hidden');
    errBox.classList.add('hidden');

    if (isNaN(n) || isNaN(N) || N <= 0 || n < 0) {
        document.getElementById('prob-error-text').textContent = "Ingresa valores válidos (N > 0, n >= 0).";
        errBox.classList.remove('hidden');
        return;
    }

    const prob = n / N;
    const common = gcd(Math.round(n), Math.round(N));

    document.getElementById('res-prob-decimal').textContent = prob.toFixed(4);
    document.getElementById('res-prob-fraction').textContent = `${Math.round(n)/common}/${Math.round(N)/common}`;
    document.getElementById('res-prob-percent').textContent = (prob * 100).toFixed(2) + '%';
    resBox.classList.remove('hidden');
}

function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
}

// Init
window.addEventListener('load', () => {
    addSetRow(); 
    addSetRow();
    
    // Resize charts on window resize
    window.addEventListener('resize', () => {
        if (charts.h) charts.h.resize();
        if (charts.o) charts.o.resize();
        if (charts.p) charts.p.resize();
        if (!document.getElementById('stats-results').classList.contains('hidden')) {
            calculateStats();
        }
    });
});
