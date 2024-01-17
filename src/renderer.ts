import * as DGL from "devon-webgl"
import { Sprite } from "./sprite"
import { Sheet } from "./sheet"

const RENDER_SIZE = [320, 240];

export class Renderer
{
	private static readonly _id: string = "game";
	private static _element: HTMLElement;
	
	private static _angle = 0;
	
	// Constructor
	public static initialize(element: HTMLElement, size: DGL.Vector2<number>)
	{
		if (element != null) {
			this._element = element;
			DGL.Context.create(this._id, element, size);
			DGL.Context.bind(this._id);
			
			let container = DGL.Context.getContainer(this._id);
			let button = document.createElement("button");
			let canvasID = this._id;
			button.className = "devon-webgl-canvas-container";
			button.innerText = "Fullscreen";
			button.onclick = function ()
			{
				DGL.Context.setFullscreen(canvasID);
			};
			container.after(button);
			
			DGL.Texture.create("texture_test");
			DGL.Texture.loadImageFile("texture_test", "./img/test.png");
			DGL.Texture.createMipmap("texture_test");
			
			Sheet.create("sheet_test");
			Sheet.addFrame("sheet_test", "frame0", "texture_test", [[0, 0], [298, 299]], [298/2, 299/2])
		}
	}
	
	// Update
	public static update(time: number)
	{
		if (this._element != null) {
			DGL.Context.bind(this._id);
			DGL.Viewport.set([0, 0], DGL.Context.getSize());
			DGL.Context.clear([0, 0, 0, 1]);
			
			let res = this.getResolution();
			Sprite.draw("sheet_test", "frame0", [res[0]/2, res[1]/2], (this._angle++) * (Math.PI / 180.0), [0.5, 0.5]);
			
			Sprite.flush();
			DGL.Context.draw();
		}
	}
	
	// Get resolution
	public static getResolution(): DGL.Vector2<number>
	{
		let res = DGL.Context.getSize();
		if (res[0] > res[1]) {
			return [RENDER_SIZE[1] * (res[0] / res[1]), RENDER_SIZE[1]];
		}
		return [RENDER_SIZE[0], RENDER_SIZE[0] * (res[1] / res[0])];
	}
}