class PixelGrid
{
  constructor(w, h)
  {
    this.grid = Tools.Arr2d(w, h, Constants.COLOR_CLEAR);
    this.width = w;
    this.height = h;
  }

  IsEmpty()
  {
    for(var y = 0; y < this.grid.length; y++)
      for(var x = 0; x < this.grid[y].length; x++)
        if(this.grid[y][x] !== Constants.COLOR_CLEAR)
          return false;
    return true;
  }

  FlipX()
  {
    this.grid.forEach(row =>
    {
      for(var x = 0; x < row.length / 2; x++)
      {
        const temp = row[x];
        row[x] = row[row.length - 1 - x];
        row[row.length - 1 - x] = temp;
      }
    });
  }

  FlipY()
  {
    for(var y = 0; y < this.grid.length / 2; y++)
    {
      const temp = this.grid[y];
      this.grid[y] = this.grid[this.grid.length - 1 - y];
      this.grid[this.grid.length - 1 - y] = temp;
    }
  }

  ShiftRow(r, dx)
  {
    const step = Math.sign(dx);
    for(var i = 0; i < Math.abs(dx); i++)
    {
      if(step < 0)
      {
        const left = this.grid[r][0];
        this.grid[r].shift();
        this.grid[r].push(left);
      }
      else {
        const right = this.grid[r][this.grid[r].length - 1];
        this.grid[r].pop();
        this.grid[r].unshift(right);
      }
    }
  }

  ShiftCol(c, dy)
  {
    const step = Math.sign(dy);
    for(var i = 0; i < Math.abs(dy); i++)
    {
      if(step < 0)
      {
        const top = this.grid[0][c];
        for(var j = 0; j < this.grid.length - 1; j++)
          this.grid[j][c] = this.grid[j + 1][c];
        this.grid[this.grid.length - 1][c] = top;
      }
      else {
        const bot = this.grid[this.grid.length - 1][c];
        for(var j = this.grid.length - 1; j > 0; j--)
          this.grid[j][c] = this.grid[j - 1][c];
        this.grid[0][c] = bot;
      }
    }
  }

  WrapX(dx)
  {
    for(var i = 0; i < Math.abs(dx); i++)
    {
      for(var j = 0; j < this.grid.length; j++)
      {
        if(Math.sign(dx) < 0)
          this.grid[j].push(this.grid[j].shift());
        else
          this.grid[j].unshift(this.grid[j].pop());
      }
    }
  }

  WrapY(dy)
  {
    console.log(Math.abs(dy))
    for(var i = 0; i < Math.abs(dy); i++)
    {
      if(Math.sign(dy) < 0)
        this.grid.push(this.grid.shift());
      else
        this.grid.unshift(this.grid.pop());
    }
  }

  ShiftX(dx)
  {
    if(dx < 0)
      this.grid.forEach(row => { row.shift(); row.push(Constants.COLOR_CLEAR); });
    else
      this.grid.forEach(row => { row.pop(); row.unshift(Constants.COLOR_CLEAR); });
  }

  ShiftY(dy)
  {
    const temp = new Array(this.grid[0].length).fill(Constants.COLOR_CLEAR);
    if(dy < 0)
    {
      this.grid.shift();
      this.grid.push(temp);
    }
    else
    {
      this.grid.pop();
      this.grid.unshift(temp);
    }
  }

  InBounds(x, y)
  {
    return (y > 0 && y < this.height && x > 0 && x < this.width);
  }

  Clear()
  {
    this.grid = Tools.Arr2d(w, h, Constants.COLOR_CLEAR);
  }

  Resize(w, h)
  {
    let temp = Tools.Arr2d(w, h, Constants.COLOR_CLEAR);

    for(var y = 0; y < Math.min(h, this.height); y++)
      for(var x = 0; x < Math.min(w, this.width); x++)
        temp[y][x] = this.grid[y][x];

    this.width = w;
    this.height = h;
    this.grid = temp;
  }

  Copy()
  {
    let temp = new PixelGrid(this.width, this.height);
    this.grid.forEach((r, y) => r.forEach((c, x) => temp.grid[y][x] = c));
    return temp;
  }
}
