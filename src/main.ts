import { Renderer } from "./renderer"

Renderer.initialize(document.getElementById("game"), [320, 240]);

function update(time: number)
{
	Renderer.update(time);
	requestAnimationFrame(update);
}
requestAnimationFrame(update);