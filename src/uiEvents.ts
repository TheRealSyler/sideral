export class UiEvents {
  private listeners: { [key: string]: () => void } = {}
  constructor(interval = 250) {
    setInterval(() => {
      for (const key in this.listeners) {
        if (Object.prototype.hasOwnProperty.call(this.listeners, key)) {
          this.listeners[key]();
        }
      }
    }, interval)
  }
  add(key: string, func: () => void) {
    this.listeners[key] = func
  }
  remove(key: string) {
    delete this.listeners[key]
  }

}