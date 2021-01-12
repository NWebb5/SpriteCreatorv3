class InputManager
{
  constructor(canvas)
  {
    this.kd = [];
    this.ku = [];
    this.mm = [];
    this.md = [];
    this.mu = [];

    window.oncontextmenu = (e) => { e.preventDefault(); };
    window.onkeydown     = async (e) => { await Promise.all(this.kd.map(fn => fn.fn(e, this, fn.user))); };
    window.onkeyup       = async (e) => { await Promise.all(this.ku.map(fn => fn.fn(e, this, fn.user))); };
    window.onmousemove   = async (e) => { await Promise.all(this.mm.map(fn => fn.fn(e, this, fn.user))); };
    window.onmousedown   = async (e) => { await Promise.all(this.md.map(fn => fn.fn(e, this, fn.user))); };
    window.onmouseup     = async (e) => { await Promise.all(this.mu.map(fn => fn.fn(e, this, fn.user))); };

    this.canvas = canvas;
    this.mouse = {
      x: undefined,
      y: undefined,
      px: undefined,
      py: undefined,
      button: -1
    };

    this.AddMouseMove(e =>
    {
      const r = this.canvas.c.getBoundingClientRect();
      this.mouse.x = e.clientX - r.x;
      this.mouse.y = e.clientY - r.y;
      this.mouse.px = parseInt(this.mouse.x / this.canvas.spsize);
      this.mouse.py = parseInt(this.mouse.y / this.canvas.spsize);
    });
    this.AddMouseDown(e =>
    {
      this.mouse.button = e.button;
    });
  }

  AddKeyUp(fn, user = {})
  {
    this.ku.push({ fn, user });
  }
  AddKeyDown(fn, user = {})
  {
    this.kd.push({ fn, user });
  }
  AddMouseMove(fn, user = {})
  {
    this.mm.push({ fn, user });
  }
  AddMouseUp(fn, user = {})
  {
    this.mu.push({ fn, user });
  }
  AddMouseDown(fn, user = {})
  {
    this.md.push({ fn, user });
  }
}
