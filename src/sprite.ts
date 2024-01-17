import * as DGL from "devon-webgl"
import { Renderer } from "./renderer"
import { Sheet } from "./sheet"

const SPRITE_COUNT = 1024;

const vertexShader =
`#version 300 es

layout (location = 0) in vec2 vecFragCoord;
layout (location = 1) in vec2 vecTexCoord;

out vec2 texCoord;
uniform mat4 projection;

void main(void)
{
	texCoord = vecTexCoord;
	gl_Position = projection * vec4(vecFragCoord, 0, 1);
}
`;

const fragmentShader = 
`#version 300 es
precision highp float;

in vec2 texCoord;
out vec4 fragColor;
uniform sampler2D tex;

void main(void)
{
	fragColor = texture(tex, texCoord);
}
`

class Vertex extends DGL.Vertex
{
	constructor(public coord: DGL.Vector2<number>,
		public tex: DGL.Vector2<number>) { super(); }

	public getData(): readonly number[][]
	{
		return [this.coord, this.tex];
	}
}

class Batch
{
	public static initialized: boolean = false;
	public static elements: number[];
	
	private readonly _meshID: string;
	private readonly _vertices: Vertex[] = new Array<Vertex>(SPRITE_COUNT * 4);
	private _count: number = 0;
	private _cursor: number = 0;
	
	get isFull(): boolean { return this._count >= SPRITE_COUNT; }
	
	// Constructor
	public constructor(private readonly _textureID: string)
	{
		if (!Batch.initialized) {
			DGL.Shader.create("shader_batch", vertexShader, fragmentShader);
			
			Batch.elements = new Array<number>(SPRITE_COUNT * 6);
			for (let i = 0; i < SPRITE_COUNT; i++) {
				Batch.elements[(i * 6) + 0] = (i * 4) + 0;
				Batch.elements[(i * 6) + 1] = (i * 4) + 1;
				Batch.elements[(i * 6) + 2] = (i * 4) + 2;
				Batch.elements[(i * 6) + 3] = (i * 4) + 1;
				Batch.elements[(i * 6) + 4] = (i * 4) + 0;
				Batch.elements[(i * 6) + 5] = (i * 4) + 3;
			}
			
			Batch.initialized = true;
		}
		
		for (let i = 0; i < SPRITE_COUNT * 4; i++) {
			this._vertices[i] = new Vertex([0, 0], [0, 0]);
		}
		
		this._meshID = `mesh_batch_${this._textureID}`;
		DGL.Mesh.createDynamic(this._meshID);
		DGL.Mesh.setVertexArray(this._meshID, this._vertices, 0);
		DGL.Mesh.setElementArray(this._meshID, Batch.elements, 0);
		DGL.Mesh.flushVertices(this._meshID);
		DGL.Mesh.flushElements(this._meshID);
	}
	
	// Add sprite
	public add(bounds: DGL.Vector4<DGL.Vector4<number>>, textureBounds: DGL.Vector4<DGL.Vector2<number>>)
	{
		this._count++;
		
		this._vertices[this._cursor].coord = [bounds[0][0], bounds[0][1]];
		this._vertices[this._cursor++].tex = textureBounds[0];
		this._vertices[this._cursor].coord = [bounds[3][0], bounds[3][1]];
		this._vertices[this._cursor++].tex = textureBounds[3];
		this._vertices[this._cursor].coord = [bounds[1][0], bounds[1][1]];
		this._vertices[this._cursor++].tex = textureBounds[1];
		this._vertices[this._cursor].coord = [bounds[2][0], bounds[2][1]];
		this._vertices[this._cursor++].tex = textureBounds[2];
		
		if (this.isFull) {
			this.flush();
		}
	}
	
	// Flush vertex data
	public flush()
	{
		if (this._count != 0) {
			DGL.Mesh.setVertexArray(this._meshID, this._vertices, 0);
			DGL.Mesh.flushVertices(this._meshID);
			
			let projection = DGL.Matrix.ortho([0, 0], Renderer.getResolution(), [0, 1]);
			
			DGL.Shader.bind("shader_batch");
			DGL.Shader.setMatrix4("projection", projection);
			DGL.Shader.setTexture("tex", 0);
			DGL.Texture.setActive(0, this._textureID);
			
			DGL.Mesh.partialDraw(this._meshID, 0, this._count * 6);
			
			this._count = 0;
			this._cursor = 0;
		}
	}
	
	// Delete
	public delete()
	{
		DGL.Mesh.delete(this._meshID);
		for (let i = 0; i < SPRITE_COUNT * 4; i++) {
			this._vertices[i] = null;
		}
	}
}

export class Sprite
{
	private static _batches: Map<string, Batch> = new Map<string, Batch>();
	
	// Draw sprite
	public static draw(sheetID: string, frameID: string, pos: DGL.Vector2<number>,
		angle: number, scale: DGL.Vector2<number>)
	{
		let frame = Sheet.getFrame(sheetID, frameID);
		if (frame != null) {
			let batch = this._batches.get(frame.textureID);
			if (batch == null) {
				this._batches.set(frame.textureID, new Batch(frame.textureID));
				batch = this._batches.get(frame.textureID);
			}
			
			let transform = DGL.Matrix.transform2D(pos, angle, scale);
			
			let topLeft = DGL.Matrix.multiplyVector(transform, [frame.left, frame.top, 0, 1]);
			let topRight = DGL.Matrix.multiplyVector(transform, [frame.right, frame.top, 0, 1]);
			let bottomLeft = DGL.Matrix.multiplyVector(transform, [frame.left, frame.bottom, 0, 1]);
			let bottomRight = DGL.Matrix.multiplyVector(transform, [frame.right, frame.bottom, 0, 1]);
			
			let texTopLeft = [frame.textureLeft, frame.textureTop] as DGL.Vector2<number>;
			let texTopRight = [frame.textureRight, frame.textureTop] as DGL.Vector2<number>;
			let texBottomLeft = [frame.textureLeft, frame.textureBottom] as DGL.Vector2<number>;
			let texBottomRight = [frame.textureRight, frame.textureBottom] as DGL.Vector2<number>;
			
			batch.add([topLeft, topRight, bottomLeft, bottomRight],
				[texTopLeft, texTopRight, texBottomLeft, texBottomRight]);
		}
	}
	
	// Flush sprites
	public static flush()
	{
		for (let [id, batch] of this._batches) {
			batch.flush();
		}
	}
	
	// Delete batches
	public static clearBatches()
	{
		for (let [id, batch] of this._batches) {
			batch.delete();
		}
		this._batches.clear();
	}
	
	// Delete
	public static delete()
	{
		this.clearBatches();
		Batch.initialized = false;
		Batch.elements = new Array<number>(0);
		DGL.Shader.delete("shader_batch");
	}
}