class Frame
{
  constructor(w, h)
  {
    this.undoStack = [];
    this.redoStack = [];
    this.grid = new PixelGrid(w, h);
    this.selected = new PixelGrid(w, h);
  }

  PushUndo()
  {
    this.undoStack.push(this.grid.Copy());
  }

  ShiftRow(r, dx)
  {
    this.grid.ShiftRow(r, dx);
  }
  ShiftCol(c, dy)
  {
    this.grid.ShiftCol(c, dy);
  }
  WrapX(dx)
  {
    this.grid.WrapX(dx);
  }
  WrapY(dy)
  {
    this.grid.WrapY(dy);
  }

  ShiftX(dx, selectMode)
  {
    if(selectMode)
      this.selected.ShiftX(dx);
    else
    {
      this.PushUndo();
      this.grid.ShiftX(dx);
    }
  }

  ShiftY(dy, selectMode)
  {
    if(selectMode)
      this.selected.ShiftY(dy);
    else
    {
      this.PushUndo();
      this.grid.ShiftY(dy);
    }
  }

  Undo(canvas)
  {
    if(this.undoStack.length)
    {
      this.redoStack.push(this.grid.Copy());
      this.grid = this.undoStack.pop();
      canvas.Draw();
    }
  }

  Redo(canvas)
  {
    if(this.redoStack.length)
    {
      this.undoStack.push(this.grid.Copy());
      this.grid = this.redoStack.pop();
      canvas.Draw();
    }
  }

  SetPixel(x, y, v, mirrorX, mirrorY, undoOverride = false)
  {
    if(y < 0 || y >= this.grid.height || x < 0 || x >= this.grid.width ||
      this.grid.grid[y][x] === v)
      return;

    this.redoStack = [];
    // used in flood fill to prevent from undoing each filled pixel
    if(!undoOverride)
      this.PushUndo();

    this.grid.grid[y][x] = v;
    if(mirrorX)
      this.grid.grid[y][this.grid.grid[y].length - 1 - x] = v;
    if(mirrorY)
      this.grid.grid[this.grid.grid.length - 1 - y][x] = v;
    if(mirrorX && mirrorY)
      this.grid.grid[this.grid.grid.length - 1 - y][this.grid.grid[y].length - 1 - x] = v;
  }

  GetPixel(x, y)
  {
    if(y < 0 || y >= this.grid.height || x < 0 || x >= this.grid.width)
      return;
    return this.grid.grid[y][x];
  }

  SelectPixel(x, y)
  {
    if(this.grid.grid[y][x] != Constants.COLOR_CLEAR)
    {
      this.selected.grid[y][x] = this.grid.grid[y][x];
      this.grid.grid[y][x] = Constants.COLOR_CLEAR;
    }
  }

  SelectRect(start, end)
  {
    const xmin = Math.min(start.x, end.x), xmax = Math.max(start.x, end.x);
    const ymin = Math.min(start.y, end.y), ymax = Math.max(start.y, end.y);

    for(var y = ymin; y <= ymax; y++)
      for(var x = xmin; x <= xmax; x++)
      this.SelectPixel(x, y);
  }

  FloodFill(x, y, v, start)
  {
    if(y < 0 || y >= this.grid.height || x < 0 || x >= this.grid.width)
      return;
    // starting point
    if(start === undefined)
    {
      start = this.grid.grid[y][x];
      this.PushUndo();
    }
    if(this.grid.grid[y][x] != start || this.grid.grid[y][x] == v)
      return;

    this.SetPixel(x, y, v, false, false, true);
    this.FloodFill(x - 1, y, v, start);
    this.FloodFill(x, y - 1, v, start);
    this.FloodFill(x + 1, y, v, start);
    this.FloodFill(x, y + 1, v, start);
  }

  Resize(w, h)
  {
    this.grid.Resize(w, h);
    this.selected.Resize(w, h);
  }

  MergeSelection()
  {
    for(var y = 0; y < this.grid.height; y++)
      for(var x = 0; x < this.grid.width; x++)
        if(this.selected.grid[y][x] != Constants.COLOR_CLEAR)
          this.grid.grid[y][x] = this.selected.grid[y][x];
    this.selected = new PixelGrid(this.grid.width, this.grid.height);
  }

  Copy()
  {
    const grid = this.grid.Copy();
    const selected = this.selected.Copy();
    const undo = this.undoStack.slice(0);
    const redo = this.redoStack.slice(0);

    let f = new Frame(0, 0);
    f.grid = grid;
    f.selected = selected;
    f.undo = undo;
    f.redo = redo;

    return f;
  }

  FlipX()
  {
    this.grid.FlipX();
    this.selected.FlipX();
  }
  FlipY()
  {
    this.grid.FlipY();
    this.selected.FlipY();
  }
}
