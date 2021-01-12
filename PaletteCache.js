class PaletteCache
{
  constructor(canvas)
  {
    this.canvas = canvas;

    this.paletteName = document.getElementById('inputPaletteName');
    this.paletteName.addEventListener('change', this.UpdatePaletteName.bind(this));
    document.getElementById('buttonSavePalette').addEventListener('click', this.SavePalette.bind(this));

    this.input = document.getElementById('inputPaletteFile');
    this.input.addEventListener('change', this.LoadPalette.bind(this));
    this.paletteSelect = document.getElementById('selectPalette');
    this.paletteSelect.addEventListener('change', this.SwitchPalette.bind(this));

    this.paletteCombo1 = document.getElementById("selectPaletteCombo1");
    this.paletteCombo2 = document.getElementById("selectPaletteCombo2");
    this.paletteCombo1Top = document.getElementById("inputPaletteCombo1Top");
    this.paletteCombo2Top = document.getElementById("inputPaletteCombo2Top");
    this.paletteComboName = document.getElementById("inputPaletteComboName");

    this.blendColor1 = document.getElementById('inputBlendColor1');
    this.blendColor1.addEventListener('change', (e => this.BlendColors(e, 1, false)).bind(this));
    this.blendColor1Display = document.getElementById('inputBlendColor1Display');
    this.blendColor1Display.addEventListener('change', (e => this.BlendColors(e, 1, true)).bind(this));

    this.blendColor2 = document.getElementById('inputBlendColor2');
    this.blendColor2.addEventListener('change', (e => this.BlendColors(e, 2, false)).bind(this));
    this.blendColor2Display = document.getElementById('inputBlendColor2Display');
    this.blendColor2Display.addEventListener('change', (e => this.BlendColors(e, 2, true)).bind(this));

    this.blendCanvas = new Canvas(
      document.getElementById('canvasBlend'),
      Constants.NUM_COLORS, 1,
      { nocache: true, spsize: 20, style: 'border: 1px solid black; margin-top: 5px;' }
    );
    this.blendCanvas.paletteCache = this;

    this.copyFromMin = document.getElementById('inputCopyFromMin');
    this.copyFromMax = document.getElementById('inputCopyFromMax');
    this.copyToStart = document.getElementById('inputCopyToStart');
    this.copyStep = document.getElementById('inputCopyStep');
    document.getElementById('buttonCopyRange').addEventListener('click', (e => this.CopyRange()).bind(this));

    this.paletteColor = document.getElementById('inputPaletteColor');
    this.paletteColor.addEventListener('change', (e => this.UpdatePaletteColor(false)).bind(this));
    this.paletteColorDisplay = document.getElementById('inputPaletteColorDisplay');
    this.paletteColorDisplay.addEventListener('change', (e => this.UpdatePaletteColor(true)).bind(this));
    this.paletteIndex = document.getElementById('inputPaletteIndex');
    this.paletteIndex.addEventListener('change', (e => this.SetCurrentColor(this.paletteIndex.value)).bind(this));

    this.paletteCanvas = new Canvas(
      document.getElementById('canvasPalette'),
      Constants.NUM_COLORS, 1,
      { nocache: true, spsize: Constants.PALETTE_CANVAS_SIZE, style: 'border: 1px solid black; margin-top: 5px;' }
    );
    this.paletteCanvas.paletteCache = this;

    this.colorList = [];
    for(var i = 0; i < Constants.NUM_COLORS; i++)
    {
      this.colorList.push(Tools.AddUIInput({ type: 'text', size: 6 }, { change: this.UpdatePalette.bind(this) }, {}, Constants.PALETTE_INPUT_DIV));
      if((i + 1) % (Constants.NUM_COLORS / 2) == 0)
        Tools.AddUIBR(1, Constants.PALETTE_INPUT_DIV);
    }

    this.palettes = [];
    this.currentPalette = new Palette('newPalette',
      [
        new Color(0x000000), new Color(0xffffff), new Color(0xaaaaaa), new Color(0x555555),
        new Color(0xff0000), new Color(0x00ff00), new Color(0x0000ff), new Color(0xffff00),
        new Color(0xff00ff), new Color(0x00ffff), new Color(0x770000), new Color(0x007700),
        new Color(0x000077), new Color(0x777700), new Color(0x770077), new Color(0x007777)
      ]);
    this.UpdateDisplay();
    this.AddPalette(this.currentPalette);
    this.AddPalette(Constants.PALETTE_RAINBOW);
    this.lastCanvasUpdateCoords = { x: 0, y: 0 };
    this.blendColorList = [];
  }

  CopyRange()
  {
    const min = parseInt(this.copyFromMin.value);
    const max = parseInt(this.copyFromMax.value);
    const dir = min < max ? 1 : -1;
    const step = parseInt(this.copyStep.value);

    let cur = parseInt(this.copyToStart.value);
    for(var i = min; i !== max + dir; i += step * dir)
    {
      this.currentPalette.Set(cur, this.blendColorList[i]);
      cur = (cur + 1) % Constants.NUM_COLORS;
    }

    this.DrawPaletteColors();
  }

  CreatePaletteCombo()
  {
    let temp = new Array(Constants.NUM_COLORS);
    temp.fill(new Color(0));

    let p = new Palette(this.paletteComboName.value, temp);

    const palette1 = this.palettes.find(p => p.name === this.paletteCombo1.value);
    const palette2 = this.palettes.find(p => p.name === this.paletteCombo2.value);

    let start = (this.paletteCombo1Top.checked ? 0 : Constants.NUM_COLORS / 2), end = start + Constants.NUM_COLORS / 2;
    for(var i = start; i < end; i++)
      p.Set(i - start, palette1.At(i));

    start = (this.paletteCombo2Top.checked ? 0 : Constants.NUM_COLORS / 2), end = start + Constants.NUM_COLORS / 2;
    for(var i = start; i < end; i++)
      p.Set(Constants.NUM_COLORS / 2 + (i - start), palette2.At(i));

    this.AddPalette(p);
  }

  SwitchPalette()
  {
    this.SetPalette(this.palettes.find(p => p.name === this.paletteSelect.value));
  }

  UpdatePaletteName()
  {
    const option = Tools.ToArray(this.paletteSelect.children).find(c => c.textContent === this.currentPalette.name);
    option.textContent = this.paletteName.value;
    this.currentPalette.SetName(this.paletteName.value);
  }

  RawColorList()
  {
    return this.colorList.map(c => new Color(parseInt(c.value, 16)));
  }

  UpdateCanvases(e)
  {
    const bccoords = this.blendCanvas.RelativeMouse(e);
    const pccoords = this.paletteCanvas.RelativeMouse(e);
    const coords = (bccoords.inBounds ? bccoords : pccoords);
    const canvas = (bccoords.inBounds ? this.blendCanvas : (pccoords.inBounds ? this.paletteCanvas : undefined));
    const list = (canvas === this.paletteCanvas ? this.RawColorList() : this.blendColorList);

    if(!canvas)
      return undefined;

    const spsize = canvas.spsize;
    const x = parseInt(coords.x / spsize);
    const y = parseInt(coords.y / spsize);

    if(coords.inBounds && this.lastCanvasUpdateCoords !== { x, y })
    {
      canvas.Clear();
      if(canvas === this.paletteCanvas)
        this.DrawPaletteColors();
      else
        this.DrawBlendColors();
      canvas.StrokeRect(x, y, list[x].inverseHex);
      this.lastCanvasUpdateCoords = { x, y };
    }

    return list;
  }

  SelectFromCanvases(e, button)
  {
    const list = this.UpdateCanvases(e);
    if(list)
    {
      if(button === 0)
      {
        navigator.clipboard.writeText(list[this.lastCanvasUpdateCoords.x].hex.substring(1));
        if(list !== this.blendColorList)
          this.SetCurrentColor(this.lastCanvasUpdateCoords.x);
      }
      else
        navigator.clipboard.writeText(this.lastCanvasUpdateCoords.x);
    }
  }

  BlendColors(e, slot, display)
  {
    if(display)
    {
      this['blendColor' + slot].value = '#' + this['blendColor' + slot + 'Display'].value;
      this['blendColor' + slot + 'Display'].value = this['blendColor' + slot + 'Display'].value.toUpperCase();
    }
    else
      this['blendColor' + slot + 'Display'].value = this['blendColor' + slot].value.substring(1).toUpperCase();

      this.DrawBlendColors();
  }

  DrawBlendColors()
  {
    const fg = new Color(parseInt(this.blendColor1Display.value, 16));
    const bg = new Color(parseInt(this.blendColor2Display.value, 16));
    this.blendCanvas.Clear();
    for(var i = 0; i < Constants.NUM_COLORS; i++)
    {
      const color = this.BlendColor(fg, bg, i / (Constants.NUM_COLORS - 1)).hex;
      this.blendCanvas.DrawPixel(i, 0, color);
      this.blendColorList[i] = new Color(parseInt(color.substring(1), 16));
    }
  }

  BlendColor(fg, bg, alpha)
  {
    const ri = 0xff << 16, gi = 0xff << 8, bi = 0xff;

    const r = Math.round(fg.r * alpha + bg.r * (1 - alpha)) & ri;
    const g = Math.round(fg.g * alpha + bg.g * (1 - alpha)) & gi;
    const b = Math.round(fg.b * alpha + bg.b * (1 - alpha)) & bi;

    return new Color(r | g | b);
  }

  UpdatePalette()
  {
    this.colorList.forEach((c, i) =>
    {
      const value = c.value || '000000';
      this.currentPalette.Set(i,  new Color(parseInt(value, 16)));
    });
    this.UpdateDisplay();
    this.DrawPaletteColors();
    if(this.canvas.initialized)
      this.canvas.Draw();
  }

  UpdatePaletteColor(display)
  {
    if(display)
      this.paletteColor.value = '#' + this.paletteColorDisplay.value;
    else
      this.paletteColorDisplay.value = this.paletteColor.value.substring(1);

    this.currentPalette.Set(this.currentPalette.selected, new Color(parseInt(this.paletteColorDisplay.value, 16)));

    this.UpdateDisplay();

    this.canvas.Draw();
  }

  SetCurrentColor(i)
  {
    if(!(i >= 0 && i < Constants.NUM_COLORS))
      return;

    if(this.currentPalette)
      this.currentPalette.Select(i);

    const hex = this.currentPalette.At(this.currentPalette.selected).hex;
    this.paletteColor.value = hex;
    this.paletteColorDisplay.value = hex.substring(1);

    this.UpdatePaletteColor(false);

    this.paletteIndex.value = i;
  }

  UpdateDisplay()
  {
    for(var i = 0; i < Constants.NUM_COLORS; i++)
      this.colorList[i].value = this.currentPalette.At(i).hex.substring(1);

    this.DrawPaletteColors();
  }

  SetPalette(p)
  {
    this.currentPalette = p;
    this.paletteCanvas.Clear();
    this.DrawPaletteColors();
    this.paletteSelect.value = p.name;
    this.paletteName.value = p.name;
    this.UpdateDisplay();
  }

  DrawPaletteColors()
  {
    for(var i = 0; i < Constants.NUM_COLORS; i++)
      this.paletteCanvas.DrawPixel(i, 0, this.currentPalette.At(i).hex);
  }

  SavePalette()
  {
    this.currentPalette.Save();
  }

  AddPalette(p)
  {
    this.palettes.push(p);
    const option = document.createElement('OPTION');
    option.textContent = p.name;
    this.paletteSelect.appendChild(option);

    const option1 = document.createElement('OPTION');
    option1.textContent = p.name;
    this.paletteCombo1.appendChild(option1);
    const option2 = document.createElement('OPTION');
    option2.textContent = p.name;
    this.paletteCombo2.appendChild(option2);
  }

  LoadPalette(e)
  {
    let file = e.target.files[0];
    let reader = new FileReader();
    let self = this;

    reader.onload = (e) => {
      let data = new Uint8Array(e.target.result);
      let index = 0;

      let nameLength = data[index++];
      let nameBuffer = [];
      for(var i = 0; i < nameLength; i++)
        nameBuffer.push(data[index++]);
      let name = String.fromCharCode(...nameBuffer);

      let temp = [];
      for(var i = 0; i < 16; i++){
        let cur = 0;
        cur |= (data[index++] << 16);
        cur |= (data[index++] << 8);
        cur |= data[index++];
        temp.push(new Color(cur));
      }
      const palette = new Palette(name, temp);
      self.AddPalette(palette);
      self.SetPalette(palette);
      self.paletteName.value = palette.name;
    };
    reader.readAsArrayBuffer(file);
    this.input.value = '';
  }
}
