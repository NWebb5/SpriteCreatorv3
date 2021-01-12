class FrameCache
{
  constructor(canvas)
  {
    this.frames = [];
    this.display = [];
    this.canvas = canvas;
    this.currentFrame = -1;

    this.AddFrame(canvas);

    const oldAdd = document.getElementById('buttonAddFrame');
    const newAdd = oldAdd.cloneNode(true);
    newAdd.addEventListener('click', this.AddFrame.bind(this), false);
    oldAdd.parentNode.replaceChild(newAdd, oldAdd);

    const oldDelete = document.getElementById('buttonDeleteFrame');
    const newDelete = oldDelete.cloneNode(true);
    newDelete.addEventListener('click', (e => this.RemoveFrame(e)).bind(this), false);
    oldDelete.parentNode.replaceChild(newDelete, oldDelete);

    const oldClear = document.getElementById('buttonClearFrame');
    const newClear = oldClear.cloneNode(true);
    newClear.addEventListener('click', this.ClearFrame.bind(this), false);
    oldClear.parentNode.replaceChild(newClear, oldClear);

    document.getElementById('buttonFrameSwap').addEventListener('click', this.SwapFrames.bind(this));

    Tools.AddUIBR();
  }

  SwapFrames()
  {
    const left = document.getElementById('inputFrameSwapLeft').value;
    const right = document.getElementById('inputFrameSwapRight').value;

    if(isNaN(left) || isNaN(right) || left === right)
      return;

    let leftGreater = left > right;
    let min = Math.min(left, right), max = Math.max(left, right);
    if(min < 0 || max < 0 || min >= this.frames.length || max >= this.frames.length){
      console.log(min, max, this.frames.length);
      alert('One or more of the given frame indices is invalid.');
      return;
    }
    console.log("B");

    const li = (leftGreater ? max : min);
    const ri = (leftGreater ? min + 1 : max);

    const frame = this.frames[li];
    const preview = this.display[li];

    this.frames.splice(li, 1);
    this.frames.splice(ri, 0, frame);

    for(var i = 0; i < this.frames.length; i++)
    {
      this.SetCurrentFrame(i);
      this.canvas.Draw();
    }
  }

  ClearFrame()
  {
    if(confirm('Clear the current frame? YOU CANNOT UNDO THIS.'))
    {
      this.frames[this.currentFrame] = new Frame(this.canvas.spritewidth * Constants.PIXELS_PER_SIDE, this.canvas.spriteheight * Constants.PIXELS_PER_SIDE);
      this.canvas.Draw();
    }
  }

  Destroy()
  {
    this.display.forEach(d => Constants.PREVIEW_DIV.removeChild(d));
  }

  GetCurrentFrame()
  {
    return this.frames[this.currentFrame];
  }

  SetCurrentFrame(i)
  {
    this.SelectFrame(this.currentFrame = i);
    navigator.clipboard.writeText(i);
  }

  AdvanceCurrentFrame(dx)
  {
    this.currentFrame += dx;
    if(this.currentFrame < 0)
      this.currentFrame = this.frames.length - 1;
    else if(this.currentFrame >= this.frames.length)
      this.currentFrame = 0;
    this.SelectFrame(this.currentFrame);
  }

  async AddFrame()
  {
    let newFrame;
    if(this.currentFrame !== -1)
      newFrame = this.GetCurrentFrame().Copy();
    else
      newFrame = new Frame(this.canvas.spritewidth * Constants.PIXELS_PER_SIDE, this.canvas.spriteheight * Constants.PIXELS_PER_SIDE)
    const index = this.currentFrame + 1;
    this.frames.splice(index, 0, newFrame);

    const button = Tools.AddUIInput(
      { type: 'image', src: this.canvas.c.toDataURL(), class: 'preview', id: index, style: `width: ${Constants.PREVIEW_SIZE}px; height: ${Constants.PREVIEW_SIZE}px;` },
      { click: (async e =>
        {
          this.SetCurrentFrame(parseInt(e.target.id));
          if(this.canvas.initialized)
          {
            await this.canvas.Draw();
            await this.canvas.UpdateCurrentFramePreview();
          }
        }).bind(this)
      }
    );
    this.display.splice(index, 0, Tools.InsertPreview(button, this.display[index]));
    await button.click();

    for(var i = index + 1; i < this.display.length; i++)
      this.display[i].id = parseInt(this.display[i].id) + 1;


    document.getElementById('buttonFrameSwap').addEventListener('click', this.SwapFrames.bind(this));


    return this.GetCurrentFrame();
  }

  SelectFrame(i)
  {
    if(this.display.length)
    {
      this.display.forEach(preview => preview.setAttribute('class', 'preview'));
      this.display[i].setAttribute('class', 'preview-selected');
      this.currentFrame = i;
    }
  }

  RemoveFrame(e, override = false)
  {
    if(this.frames.length === 1)
      return;

    if(override || confirm('Delete the current frame? YOU CANNOT UNDO THIS.'))
    {
      this.frames.splice(this.currentFrame, 1);
      Constants.PREVIEW_DIV.removeChild(this.display[this.currentFrame]);
      this.display.splice(this.currentFrame, 1);

      for(var i = this.currentFrame; i < this.display.length; i++)
        this.display[i].id--;

      this.AdvanceCurrentFrame(-1);
      this.canvas.Draw();

      document.getElementById('buttonFrameSwap').addEventListener('click', this.SwapFrames.bind(this));
    }
  }

  UpdatePreview(url)
  {
    this.display[this.currentFrame].setAttribute('src', url);
  }

  UpdatePreviews()
  {
    const start = this.currentFrame;
    const grid = this.canvas.toggleGrid.checked;
    this.canvas.toggleGrid.checked = false;

    for(var i = 0; i < this.frames.length; i++)
    {
      this.SelectFrame(i);
      this.canvas.Draw();
      this.canvas.UpdateCurrentFramePreview();
    }

    this.canvas.toggleGrid.checked = grid;
    this.currentFrame = start;
  }

  Resize(w, h)
  {
    this.frames.forEach(f => f.Resize(w, h));
    console.log(`${w / Constants.PIXELS_PER_SIDE}, ${h / Constants.PIXELS_PER_SIDE}`);
    for(var i = 0; i < this.display.length; i++)
    {
      let d = this.display[i];
      d.style.width = `${w / Constants.PIXELS_PER_SIDE * Constants.PREVIEW_SIZE}px`;
      d.style.height = `${h / Constants.PIXELS_PER_SIDE * Constants.PREVIEW_SIZE}px`;
    }
  }
}
