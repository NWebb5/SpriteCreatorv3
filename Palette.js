class Palette
{
  constructor(name, colors)
  {
    if(colors.length != Constants.NUM_COLORS)
      console.log(`Invalid Palette length ${colors.length}`);

    this.name = undefined;
    this.colors = colors;
    this.selected = 0;

    this.Select(0);
    this.SetName(name);
  }

  Set(i, c)
  {
    if(i < 0 || i >= this.colors.length)
      console.log(`Invalid Palette index ${i}`);
    return this.colors[i] = c;
  }
  At(i)
  {
    if(i < 0 || i >= this.colors.length)
      console.log(`Invalid Palette index ${i}`);
    return this.colors[i];
  }
  Select(i, nowarn = false)
  {
    if(!nowarn && (i < 0 || i >= this.colors.length))
      console.log(`Invalid Palette index ${i}`);
    return this.selected = i;
  }

  SetName(s)
  {
    if(s.length > 255)
    {
      alert('Palette name must be <= 255 characters.');
      return;
    }
    this.name = s;
  }

  Save()
  {
    let index = 0;
    let data = new Uint8Array(Constants.NUM_COLORS * 3 + (1 + this.name.length));
    data[index++] = this.name.length;
    for(var i = 0; i < this.name.length; i++)
      data[index++] = this.name.charCodeAt(i);
    for(var i = 0; i < Constants.NUM_COLORS; i++){
      let cur = this.At(i).uint;
      data[index++] = (cur & (0b11111111 << 16)) >> 16;
      data[index++] = (cur & (0b11111111 << 8)) >> 8;
      data[index++] = cur & 0b11111111;
    }

    let file = new Blob([data], { type: 'application/octet-stream' });

    let a = document.createElement("a"), url = URL.createObjectURL(file);
    a.href = url;
    a.download = `${this.name}.palette`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}
