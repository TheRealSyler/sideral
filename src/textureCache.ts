import { loadTexture } from "./utils"

export class TextureCache<K extends string> {
  private textures: { [key in K]?: HTMLImageElement } = {}
  constructor(private textureLocations: { [key in K]: string }) { }
  async getTexture(name: K): Promise<HTMLImageElement> {
    if (!this.textures[name]) {
      this.textures[name] = await loadTexture(this.textureLocations[name])
    }
    return this.textures[name]!
  }
}