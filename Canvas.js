class Canvas
{
  constructor(c, w, h, { style = '', spsize = 5, grid = false, nocache = false } = {})
  {
    c.width = w * spsize;
    c.height = h * spsize;
    c.style = style;

    this.c = c;
    this.ctx = this.c.getContext('2d');
    this.spsize = spsize;

    if(!nocache)
    {
      this.preview = document.createElement('CANVAS');
      this.preview.width = c.width;
      this.preview.height = c.height;
      this.previewctx = this.preview.getContext('2d');

      this.grid = undefined;
      this.spritewidth = w / Constants.PIXELS_PER_SIDE;
      this.spriteheight = h / Constants.PIXELS_PER_SIDE;
      this.tilewidth = 1;
      this.tileheight = 1;

      this.spriteName = document.getElementById('inputSpriteName');
      document.getElementById('buttonSaveSprite').addEventListener('click', this.Save.bind(this));
      Tools.AddUIBR();

      this.spriteFile = document.getElementById('inputSpriteFile');
      this.spriteFile.addEventListener('change', (e => this.Load(e)).bind(this));

      this.frameCache = new FrameCache(this);
      this.frameTime = document.getElementById('inputFrameTime');
      this.frameTime.addEventListener('change', this.UpdateFrameTime.bind(this));

      this.toggleAnimate = document.getElementById('buttonAnimate');
      this.toggleAnimate.addEventListener('click', (e => this.ToggleAnimate()).bind(this));

      this.toggleGrid = document.getElementById('inputDrawGrid');
      this.toggleGrid.addEventListener('change', this.Draw.bind(this));
      this.gridColor = document.getElementById('inputGridColor');
      this.gridColor.addEventListener('change', (() => { this.CreateGrid(); this.Draw(); }).bind(this));

      this.clearColor = document.getElementById('inputBackgroundColor');
      this.clearColor.addEventListener('change', this.Draw.bind(this));

      document.getElementById('inputSpriteWidth').addEventListener('change', (e => this.UpdateSize(e, 'width')).bind(this));
      document.getElementById('inputSpriteHeight').addEventListener('change', (e => this.UpdateSize(e, 'height')).bind(this));

      document.getElementById('inputTileWidth').addEventListener('change', (e => this.UpdateTileSize(e, 'width')).bind(this));
      document.getElementById('inputTileHeight').addEventListener('change', (e => this.UpdateTileSize(e, 'height')).bind(this));

      this.pixelSize = document.getElementById('inputPixelSize');
      this.pixelSize.addEventListener('change', (e => this.UpdatePixelSize()).bind(this));
      this.realPixelSize = document.getElementById('buttonRealPixelSize');
      this.realPixelSize.addEventListener('click', this.ToggleRealPixelSize.bind(this));
      this.tempPixelSize = this.spsize;

      this.toggleSelect = document.getElementById('inputSelect');
      this.toggleSelect.addEventListener('change', this.ToggleSelect.bind(this));
      this.selectMode = document.getElementById('selectSelectMode');
      this.selectRectStart = undefined;

      document.getElementById('buttonFlipX').addEventListener('click', this.FlipX.bind(this));
      document.getElementById('buttonFlipY').addEventListener('click', this.FlipY.bind(this));
      this.mirrorX = document.getElementById('inputMirrorX');
      this.mirrorX.addEventListener('click', (() => { this.CreateGrid(); this.Draw(); }).bind(this));
      this.mirrorY = document.getElementById('inputMirrorY');
      this.mirrorY.addEventListener('click', (() => { this.CreateGrid(); this.Draw(); }).bind(this));

      this.paletteCache = new PaletteCache(this);
      this.CreateGrid();

      this.playing = false;
      this.lastFrameSwitch = performance.now();
    }
    this.initialized = true;
    this.nocache = nocache;

    this.Clear();
    this.UpdateCurrentFramePreview();
  }

  ToggleRealPixelSize()
  {
    if(this.realPixelSize.checked)
    {
      this.tempPixelSize = this.spsize;
      this.pixelSize.value = Constants.REAL_PIXEL_SIZE;
    }
    else
      this.pixelSize.value = this.tempPixelSize;
    this.UpdatePixelSize();
    this.Draw();
  }

  FlipX()
  {
    this.GetCurrentFrame().FlipX();
    this.Draw();
  }

  FlipY()
  {
    this.GetCurrentFrame().FlipY();
    this.Draw();
  }

  SelectColor(mouse)
  {
    if(this.paletteCache.currentPalette)
    {
      const value = this.GetPixel(mouse.px, mouse.py);
      if(value !== undefined && value !== Constants.COLOR_CLEAR)
        this.paletteCache.SetCurrentColor(value, true);
    }
  }

  ToggleSelect()
  {
    if(!this.toggleSelect.checked)
    {
      this.GetCurrentFrame().MergeSelection();
      this.selectRectStart = undefined;
    }
    else
      this.GetCurrentFrame().PushUndo();

    this.Draw();
  }

  Shift(dx, dy)
  {
    if(dx)
      this.GetCurrentFrame().ShiftX(dx, this.toggleSelect.checked);
    if(dy)
      this.GetCurrentFrame().ShiftY(dy, this.toggleSelect.checked);

    this.Draw();
  }

  Undo()
  {
    this.frameCache.GetCurrentFrame().Undo(this);
  }

  Redo()
  {
    this.frameCache.GetCurrentFrame().Redo(this);
  }

  Save()
  {
    let timePerFrame = parseInt(this.frameTime.value);
    let charMax = 0b11111111;

    let index = 0;
    let data = new Uint8Array(5 + (Constants.NUM_COLORS * 3) + (this.spritewidth * Constants.PIXELS_PER_SIDE * this.spriteheight * Constants.PIXELS_PER_SIDE * this.frameCache.frames.length));
    data[index++] = this.spritewidth;
    data[index++] = this.spriteheight;
    data[index++] = this.frameCache.frames.length;
    data[index++] = (timePerFrame & (charMax << 8)) >> 8;
    data[index++] = (timePerFrame & charMax);

    for(var i = 0; i < Constants.NUM_COLORS; i++)
    {
      let cur = this.paletteCache.currentPalette.At(i).uint;
      data[index++] = (cur & (charMax << 16)) >> 16;
      data[index++] = (cur & (charMax << 8)) >> 8;
      data[index++] = (cur & charMax);
    }

    for(var i = 0; i < this.frameCache.frames.length; i++)
      for(var j = 0; j < this.spriteheight * Constants.PIXELS_PER_SIDE; j++)
        for(var k = 0; k < this.spritewidth * Constants.PIXELS_PER_SIDE; k++)
          data[index++] = this.frameCache.frames[i].grid.grid[j][k];

    let file = new Blob([data], { type: 'application/octet-stream' });
    let a = document.createElement("a"), url = URL.createObjectURL(file);
    a.href = url;
    a.download = `${this.spriteName.value}.sprite`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  async Load(e){
    if(!confirm('WARNING: Any unsaved progress on the current sprite will be lost. Load anyway?'))
      return;
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.onload = async (e) => {
      let data = new Uint8Array(e.target.result);
      let index = 0;

      let width = data[index++];
      let height = data[index++];
      let nframes = data[index++];
      this.frameTime.value = (data[index++] << 8) | data[index++];

      let temp = new Array(16);
      for(var i = 0; i < 16; i++)
      {
        let red = (data[index++] << 16);
        let green = (data[index++] << 8);
        let blue = data[index++];
        temp[i] = new Color(red | green | blue);
      }

      const name = file.name.substring(0, file.name.indexOf('.'));
      const palette = new Palette(name, temp)
      this.paletteCache.AddPalette(palette);
      this.paletteCache.SetPalette(palette);

      this.frameCache.Destroy();
      this.frameCache = new FrameCache(this);
      this.spriteName.value = name;
      document.getElementById('inputSpriteWidth').value = width;
      document.getElementById('inputSpriteHeight').value = height;
      this.UpdateSize({ target: { value: width, min: 1, max: 256 } }, 'width');
      this.UpdateSize({ target: { value: height, min: 1, max: 256 } }, 'height');

      for(var i = 0; i < nframes; i++){
        let grid = this.frameCache.GetCurrentFrame().grid.grid;
        for(var j = 0; j < this.spriteheight * Constants.PIXELS_PER_SIDE; j++)
          for(var k = 0; k < this.spritewidth * Constants.PIXELS_PER_SIDE; k++)
            grid[j][k] = data[index++];
        await this.Draw();
        if(i != nframes - 1)
          this.frameCache.AddFrame();
      }
    };
    await reader.readAsArrayBuffer(file);
    this.spriteFile.value = "";
  }

  RelativeMouse(e)
  {
    const crect = this.c.getBoundingClientRect();
    const x = e.clientX - crect.x, y = e.clientY - crect.y;
    return { x, y, inBounds: (x > 0 && x < this.c.width && y > 0 && y < this.c.height) };
  }

  UpdateFrameTime()
  {
    this.frameTime.value = Tools.Clamp(parseInt(this.frameTime.value), 0, 65535);
    // stop previous timer
    this.toggleAnimate.click();
    this.toggleAnimate.click();
  }

  UpdateSize(e, axis)
  {
    e.target.value = Tools.Clamp(parseInt(e.target.value), e.target.min, e.target.max);
    this['sprite' + axis] = parseInt(e.target.value);
    this.c[axis] = this.spsize * this['sprite' + axis] * this['tile' + axis] * Constants.PIXELS_PER_SIDE;
    this.preview[axis] = this.spsize * this['sprite' + axis] * Constants.PIXELS_PER_SIDE;
    this.frameCache.Resize(this.spritewidth * Constants.PIXELS_PER_SIDE, this.spriteheight * Constants.PIXELS_PER_SIDE);
    this.frameCache.UpdatePreviews();
    this.CreateGrid();
    this.Draw();
  }

  UpdateTileSize(e, axis)
  {
    e.target.value = Tools.Clamp(parseInt(e.target.value), e.target.min, e.target.max);
    this['tile' + axis] = parseInt(e.target.value);
    this.c[axis] = this.spsize * this['sprite' + axis] * this['tile' + axis] * Constants.PIXELS_PER_SIDE;
    this.CreateGrid();
    this.Draw();
  }

  UpdatePixelSize()
  {
    this.spsize = parseInt(this.pixelSize.value);

    this.c.width = this.spsize * this.spritewidth * this.tilewidth * Constants.PIXELS_PER_SIDE;
    this.c.height = this.spsize * this.spriteheight * this.tileheight * Constants.PIXELS_PER_SIDE;
    this.preview.width = this.spsize * this.spritewidth * Constants.PIXELS_PER_SIDE;
    this.preview.height = this.spsize * this.spriteheight * Constants.PIXELS_PER_SIDE;

    this.CreateGrid();
    this.Draw();
  }

  AdvanceCurrentFrame(dx)
  {
    this.UpdateCurrentFramePreview();
    this.frameCache.AdvanceCurrentFrame(dx);
    if(!this.GetCurrentFrame().selected.IsEmpty())
    {
      this.toggleSelect.checked = true;
      this.ToggleSelect();
    }
    this.Draw();
  }

  GetCurrentFrame()
  {
    return this.frameCache.GetCurrentFrame();
  }

  Clear()
  {
    this.ctx.clearRect(0, 0, this.c.width, this.c.height);
    this.ctx.fillStyle = (this.clearColor ? this.clearColor.value : '#000000');
    this.ctx.fillRect(0, 0, this.c.width, this.c.height);
  }

  CreateGrid()
  {
    this.ctx.clearRect(0, 0, this.c.width, this.c.height);

    const color = new Color(parseInt(this.gridColor.value.substring(1), 16));
    const alpha = 1;
    const mirrorColor = new Color(0x00ff00);

    for(var x = 0; x <= this.c.width; x += this.spsize)
    {
      let c;

      if(this.mirrorX.checked && x === Constants.PIXELS_PER_SIDE * this.spsize * this.spritewidth / 2)
        c = mirrorColor.hex;
      else
        c = (x !== 0 && x % (this.spsize * this.spritewidth * Constants.PIXELS_PER_SIDE) === 0) ? color.inverseHex : color.hex;

      this.Line(x, 0, x, this.c.height, c, alpha);
    }
    for(var y = 0; y <= this.c.height; y += this.spsize)
    {
      let c;

      if(this.mirrorY.checked && y === Constants.PIXELS_PER_SIDE * this.spsize * this.spriteheight / 2)
        c = mirrorColor.hex;
      else
        c = (y !== 0 && y % (this.spsize * this.spriteheight * Constants.PIXELS_PER_SIDE) === 0) ? color.inverseHex : color.hex;

      this.Line(0, y, this.c.width, y, c, alpha);
    }

    this.grid = new Image();
    this.grid.onload = () => this.DrawGrid();
    this.grid.src = this.c.toDataURL();
  }

  Line(x1, y1, x2, y2, c, a = 1)
  {
    const alpha = this.ctx.globalAlpha;
    this.ctx.globalAlpha = a;
    this.ctx.strokeStyle = c;

    this.ctx.beginPath();
    this.ctx.moveTo(x1 + .5, y1 + .5);
    this.ctx.lineTo(x2 + .5, y2 + .5);
    this.ctx.stroke();
    this.ctx.closePath();

    this.ctx.globalAlpha = alpha;
  }

  StrokeRect(x, y, c)
  {
    this.ctx.strokeStyle = c;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x * this.spsize + .5, y * this.spsize + .5, this.spsize - 1, this.spsize - 1);
  }

  DrawPixel(x, y, c, a = 1)
  {
    const tempAlpha = this.ctx.globalAlpha;

    this.ctx.fillStyle = c;
    this.ctx.globalAlpha = a;
    this.ctx.fillRect(x * this.spsize, y * this.spsize, this.spsize, this.spsize);

    this.ctx.globalAlpha = tempAlpha;
  }

  GetPixel(x, y)
  {
    if(x < 0 || x >= this.tilewidth * this.spritewidth * Constants.PIXELS_PER_SIDE ||
      y < 0 || y >= this.tileheight * this.spriteheight * Constants.PIXELS_PER_SIDE)
      return;
    const rx = x % (this.spritewidth * Constants.PIXELS_PER_SIDE);
    const ry = y % (this.spriteheight * Constants.PIXELS_PER_SIDE);
    return this.GetCurrentFrame().GetPixel(rx, ry);
  }

  MouseInBounds(mouse)
  {
    if(mouse.px < 0 || mouse.px >= this.tilewidth * this.spritewidth * Constants.PIXELS_PER_SIDE ||
      mouse.py < 0 || mouse.py >= this.tileheight * this.spriteheight * Constants.PIXELS_PER_SIDE)
      return false;
    return true;
  }

  SetPixel(mouse, v = (this.paletteCache.currentPalette ? this.paletteCache.currentPalette.selected : undefined))
  {
    if(!this.MouseInBounds(mouse))
      return;

    const x = mouse.px % (this.spritewidth * Constants.PIXELS_PER_SIDE);
    const y = mouse.py % (this.spriteheight * Constants.PIXELS_PER_SIDE);
    const mx = this.mirrorX.checked, my = this.mirrorY.checked;
    let cf = this.GetCurrentFrame();

    if(this.toggleSelect.checked)
    {
      if(this.selectMode.value == Constants.SELECT_RECT)
      {
        if(this.selectRectStart === undefined)
          this.selectRectStart = { x, y };
        else
        {
          this.GetCurrentFrame().SelectRect(this.selectRectStart, { x, y });
          this.Draw();
        }
      }
      else
        this.GetCurrentFrame().SelectPixel(x, y);

      const color = this.GetCurrentFrame().selected.grid[y][x];
      if(color !== Constants.COLOR_CLEAR)
        this.DrawPixel(x, y, this.paletteCache.currentPalette.At(color).inverseHex, .75);
      return;
    }
    else if(v === undefined || cf.GetPixel(x, y) === v)
      return;
    else
    {
      cf.SetPixel(x, y, v, mx, my);

      const color = (v !== Constants.COLOR_CLEAR ? this.paletteCache.currentPalette.At(cf.grid.grid[y][x]).hex : this.clearColor.value);

      for(var tx = 0; tx < this.tilewidth; tx++)
        for(var ty = 0; ty < this.tileheight; ty++)
        {
          const ex = x + tx * Constants.PIXELS_PER_SIDE;
          const ey = y + ty * Constants.PIXELS_PER_SIDE;

          this.ctx.clearRect(ex * this.spsize, ey * this.spsize, this.spsize, this.spsize);
          this.DrawPixel(ex, ey, color);
          if(mx)
          {
            const x2 = (cf.grid.grid[0].length - 1 - ex);
            this.ctx.clearRect(x2 * this.spsize, ey * this.spsize, this.spsize, this.spsize);
            this.DrawPixel(x2, ey, color);
          }
          if(my)
          {
            const y2 = (cf.grid.grid.length - 1 - ey);
            this.ctx.clearRect(ex * this.spsize, y2 * this.spsize, this.spsize, this.spsize);
            this.DrawPixel(ex, y2, color);
          }
          if(mx && my)
          {
            const x2 = (cf.grid.grid[0].length - 1 - ex);
            const y2 = (cf.grid.grid.length - 1 - ey);
            this.ctx.clearRect(x2 * this.spsize, y2 * this.spsize, this.spsize, this.spsize);
            this.DrawPixel(x2, y2, color);
          }
        }
    }

    this.DrawGrid();
  }

  FloodFill(mouse)
  {
    if(!this.MouseInBounds(mouse))
      return;
    const x = mouse.px % (this.spritewidth * Constants.PIXELS_PER_SIDE);
    const y = mouse.py % (this.spriteheight * Constants.PIXELS_PER_SIDE);
    this.GetCurrentFrame().FloodFill(x, y, this.paletteCache.currentPalette.selected);
    this.Draw();
  }

  async Draw()
  {
    this.Clear();

    const pg = this.GetCurrentFrame().grid;

    const palette = this.paletteCache.currentPalette;
    if(pg.height > this.spriteheight * Constants.PIXELS_PER_SIDE || pg.width > this.spritewidth * Constants.PIXELS_PER_SIDE)
      console.log(`PixelGrid dimensions (${pg.width}, ${pg.height}) incompatible with Canvas dimensions (${this.spritewidth}, ${this.spriteheight})`);

    for(var y = 0; y < pg.height; y++)
    {
      for(var x = 0; x < pg.width; x++)
      {
        const cur = pg.grid[y][x];
        const selected = this.GetCurrentFrame().selected.grid[y][x];
        if(cur != Constants.COLOR_CLEAR || selected != Constants.COLOR_CLEAR)
          for(var tx = 0; tx < this.tilewidth; tx++)
            for(var ty = 0; ty < this.tileheight; ty++)
            {
              const sx = x + this.spritewidth * Constants.PIXELS_PER_SIDE * tx;
              const sy = y + this.spriteheight * Constants.PIXELS_PER_SIDE * ty;
              if(selected != Constants.COLOR_CLEAR)
              {
                this.DrawPixel(sx, sy, palette.At(selected).hex);
                this.DrawPixel(sx, sy, palette.At(selected).inverseHex, .75);
              }
              else
                this.DrawPixel(sx, sy, palette.At(cur).hex);
            }
      }
    }

    this.DrawGrid();
  }

  async SavePNG()
  {
    const frame = this.frameCache.currentFrame;

    for(var i = 0; i < this.frameCache.frames.length; i++)
    {
      this.frameCache.SetCurrentFrame(i);
      this.Draw();
      let a = document.createElement('a');
      a.href = this.c.toDataURL();
      a.download = `${document.getElementById("inputSpriteName").value}_${this.frameCache.currentFrame}.png`;
      a.click();

      await Tools.Sleep(100);
    }

    this.frameCache.SetCurrentFrame(frame);
  }

  async UpdateCurrentFramePreview()
  {
    if(this.nocache)
      return;
    return new Promise(resolve =>
      {
        let img = new Image();
        img.onload = (e) =>
        {
          this.previewctx.drawImage(
            e.target,
            0, 0, this.spsize * Constants.PIXELS_PER_SIDE * this.spritewidth, this.spsize * Constants.PIXELS_PER_SIDE * this.spriteheight,
            0, 0, this.preview.width, this.preview.height
          );
          this.frameCache.UpdatePreview(this.preview.toDataURL());
          resolve();
        };

        const redraw = this.toggleGrid.checked;

        if(redraw)
        {
          this.toggleGrid.checked = false;
          this.Draw();
        }

        img.src = this.c.toDataURL();

        if(redraw)
        {
          this.toggleGrid.checked = true;
          this.Draw();
        }
      });
  }

  DrawGrid()
  {
    if(this.toggleGrid.checked)
    {
      const alpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = 1;
      this.ctx.drawImage(this.grid, 0, 0);
      this.ctx.globalAlpha = alpha;
    }
  }

  ToggleAnimate()
  {
    this.playing = !this.playing;
    this.toggleAnimate.textContent = (this.playing ? 'Pause' : 'Play');
    this.Animate();
  }

  ToggleGrid()
  {
    this.toggleGrid.click();
  }

  async Animate()
  {
    if(this.playing)
    {
      this.lastFrameSwitch = performance.now;
      this.frameCache.AdvanceCurrentFrame(1);
      this.Draw();
      await Tools.Sleep(parseInt(this.frameTime.value));
      this.Animate();
    }
  }
}
