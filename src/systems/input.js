export class InputManager {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.dragging = false;
    this.enabled = false;
    this.canvas = canvas;
    addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (
        [
          "Space",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Tab",
        ].includes(e.code)
      )
        e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("blur", () => this.clear());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.clear();
    });
    canvas.addEventListener("pointerdown", (e) => {
      if (!this.enabled) return;
      this.dragging = true;
      if (e.button === 0 && document.pointerLockElement !== canvas)
        canvas.requestPointerLock?.().catch(() => {});
    });
    addEventListener("pointerup", () => (this.dragging = false));
    addEventListener("mousemove", (e) => {
      if (
        this.enabled &&
        (document.pointerLockElement === canvas || this.dragging)
      ) {
        this.mouseX += e.movementX;
        this.mouseY += e.movementY;
      }
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  down(code) {
    return this.enabled && this.keys.has(code);
  }
  take(code) {
    const had = this.pressed.has(code);
    this.pressed.delete(code);
    return had;
  }
  clear() {
    this.keys.clear();
    this.pressed.clear();
    this.mouseX = this.mouseY = 0;
    this.dragging = false;
  }
  mouse() {
    let a = [this.mouseX, this.mouseY];
    this.mouseX = this.mouseY = 0;
    return a;
  }
}
