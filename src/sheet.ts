import * as DGL from "devon-webgl"

export class SheetFrame
{
	get width(): number { return this.bounds[1][0] - this.bounds[0][0]; }
	get height(): number { return this.bounds[1][1] - this.bounds[0][1]; }
	get left(): number { return -this.pivot[0]; }
	get right(): number { return this.left + this.width; }
	get top(): number { return -this.pivot[1]; }
	get bottom(): number { return this.top + this.height; }
	get textureLeft(): number { return this.bounds[0][0] / DGL.Texture.getWidth(this.textureID); }
	get textureRight(): number { return this.bounds[1][0] / DGL.Texture.getWidth(this.textureID); }
	get textureTop(): number { return this.bounds[0][1] / DGL.Texture.getHeight(this.textureID); }
	get textureBottom(): number { return this.bounds[1][1] / DGL.Texture.getHeight(this.textureID); }
	
	constructor(public readonly id: string, public readonly sheetID: string,
		public readonly textureID: string, public readonly bounds: DGL.Vector2<DGL.Vector2<number>>,
		public readonly pivot: DGL.Vector2<number>) { }
}

export class Sheet
{
	private static _sheets: Map<string, Sheet> = new Map<string, Sheet>();
	private _frames: Map<string, SheetFrame> = new Map<string, SheetFrame>();
	
	// Create sheet
	public static create(id: string)
	{
		this._sheets.set(id, new Sheet());
	}
	
	// Add frame
	public static addFrame(id: string, frameID: string, textureID: string,
		bounds: DGL.Vector2<DGL.Vector2<number>>, pivot: DGL.Vector2<number>)
	{
		this._sheets.get(id)?._frames.set(frameID, new SheetFrame(frameID, id, textureID, bounds, pivot));
	}
	
	// Get frame
	public static getFrame(id: string, frameID: string): SheetFrame
	{
		return this._sheets.get(id)?._frames.get(frameID);
	}
	
	// Delete frame
	public static deleteFrame(id: string, frameID: string)
	{
		this._sheets.get(id)?._frames.delete(frameID);
	}
	
	// Delete sheet
	public static delete(id: string)
	{
		this._sheets.get(id)?._frames.clear();
		this._sheets.delete(id);
	}
	
	// Delete all sheets
	public static clear()
	{
		for (let [id, sheet] of this._sheets) {
			this.delete(id);
		}
		this._sheets.clear();
	}
}