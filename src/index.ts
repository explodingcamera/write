import { Files } from "./files";
import { Editor } from "./editor";
import { Settings } from "./settings";

const files = new Files();

const settings = new Settings({
	themeToggle: document.querySelector(".theme-toggle") as HTMLButtonElement,
	fontFamily: document.getElementById("font-family") as HTMLButtonElement,
});

const editor = new Editor({
	files,
	editor: document.getElementById("editor") as HTMLInputElement,
});

// editor.loadText(text);
// editor.on("save", async (text) => {
// 	const currentFileWriter = await fileHandle.createWritable({ keepExistingData: false });
// 	await currentFileWriter.write(text);
// 	await currentFileWriter.close();
// });

editor.on("wordCountChange", (count) => (document.querySelector("#word-count span")!.textContent = count.toString()));
document.body.addEventListener("click", (event) => event.target === document.body && editor.focus());

const modal = document.getElementById("files")! as HTMLDialogElement;
modal.addEventListener("click", async (event) => {
	const rect = modal.getBoundingClientRect();
	const isOutside =
		event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
	if (isOutside) modal.close();
});

document.getElementById("files-toggle")!.addEventListener("click", async () => {
	modal.showModal();
});
