/**
 * 手绘涂鸦画板
 */
class DoodleBoard {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.drawing = false;
    this.tool = 'pen';
    this.color = '#333333';
    this.size = 3;
    this.history = [];
    this.historyIndex = -1;
    this.startX = 0;
    this.startY = 0;
    this.snapshot = null;
    this.saveCallback = null;

    this.init();
  }

  init() {
    document.getElementById('btnDoodle').addEventListener('click', () => this.open());
    document.getElementById('doodleClose').addEventListener('click', () => this.close());
    document.getElementById('doodleUndo').addEventListener('click', () => this.undo());
    document.getElementById('doodleRedo').addEventListener('click', () => this.redo());
    document.getElementById('doodleClear').addEventListener('click', () => this.clearCanvas());
    document.getElementById('doodleSave').addEventListener('click', () => this.save());

    document.getElementById('doodleColor').addEventListener('input', (e) => this.color = e.target.value);
    document.getElementById('doodleSize').addEventListener('input', (e) => this.size = parseInt(e.target.value));

    document.querySelectorAll('.doodle-tool[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.doodle-tool[data-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.tool = btn.dataset.tool;
      });
    });
  }

  open(callback) {
    this.saveCallback = callback || null;
    this.canvas = document.getElementById('doodleCanvas');
    this.ctx = this.canvas.getContext('2d');

    // 调整画布大小
    const modal = document.getElementById('doodleModal');
    modal.classList.add('show');
    setTimeout(() => {
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = 500;
      this.ctx.strokeStyle = this.color;
      this.ctx.lineWidth = this.size;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.saveState();
    }, 100);

    this.bindEvents();
  }

  close() {
    document.getElementById('doodleModal').classList.remove('show');
    this.unbindEvents();
  }

  bindEvents() {
    this._onMouseDown = (e) => this.startDraw(e);
    this._onMouseMove = (e) => this.draw(e);
    this._onMouseUp = () => this.endDraw();
    this._onTouchStart = (e) => { e.preventDefault(); this.startDraw(e.touches[0]); };
    this._onTouchMove = (e) => { e.preventDefault(); this.draw(e.touches[0]); };
    this._onTouchEnd = () => this.endDraw();

    this.canvas.addEventListener('mousedown', this._onMouseDown);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mouseup', this._onMouseUp);
    this.canvas.addEventListener('mouseleave', this._onMouseUp);
    this.canvas.addEventListener('touchstart', this._onTouchStart, {passive: false});
    this.canvas.addEventListener('touchmove', this._onTouchMove, {passive: false});
    this.canvas.addEventListener('touchend', this._onTouchEnd);
  }

  unbindEvents() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('mouseleave', this._onMouseUp);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchmove', this._onTouchMove);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
  }

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  startDraw(e) {
    this.drawing = true;
    const pos = this.getPos(e);
    this.startX = pos.x;
    this.startY = pos.y;

    if (this.tool === 'pen' || this.tool === 'eraser') {
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
      if (this.tool === 'eraser') {
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = this.size * 3;
      } else {
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.size;
      }
    }

    // 对于图形工具，先保存快照
    if (['line','circle','arrow'].includes(this.tool)) {
      this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  draw(e) {
    if (!this.drawing) return;
    const pos = this.getPos(e);

    if (this.tool === 'pen' || this.tool === 'eraser') {
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
    } else if (['line','circle','arrow'].includes(this.tool)) {
      this.ctx.putImageData(this.snapshot, 0, 0);
      this.ctx.strokeStyle = this.color;
      this.ctx.lineWidth = this.size;
      this.ctx.beginPath();

      if (this.tool === 'line') {
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(pos.x, pos.y);
      } else if (this.tool === 'circle') {
        const r = Math.sqrt((pos.x - this.startX) ** 2 + (pos.y - this.startY) ** 2);
        this.ctx.arc(this.startX, this.startY, r, 0, Math.PI * 2);
      } else if (this.tool === 'arrow') {
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(pos.x, pos.y);
        // 箭头头部
        const angle = Math.atan2(pos.y - this.startY, pos.x - this.startX);
        const headLen = 15;
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(pos.x - headLen * Math.cos(angle - Math.PI/6), pos.y - headLen * Math.sin(angle - Math.PI/6));
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(pos.x - headLen * Math.cos(angle + Math.PI/6), pos.y - headLen * Math.sin(angle + Math.PI/6));
      }
      this.ctx.stroke();
    }
  }

  endDraw() {
    if (!this.drawing) return;
    this.drawing = false;
    this.ctx.beginPath();
    this.saveState();
  }

  saveState() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    this.historyIndex = this.history.length - 1;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
    }
  }

  clearCanvas() {
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.saveState();
  }

  save() {
    if (!this.canvas) return;
    const dataUrl = this.canvas.toDataURL('image/png');
    if (this.saveCallback) {
      this.saveCallback(dataUrl);
    } else {
      // 下载图片
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `doodle_${Date.now()}.png`;
      a.click();
    }
    this.close();
    showToast('涂鸦已保存', 'success');
    addCoins(5);
  }
}
