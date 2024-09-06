import { Editor } from "./editor";
import { Settings } from "./settings";

const opfsRoot = await navigator.storage.getDirectory();
const fileName = localStorage.getItem("fileName") || "Untitled";
const fileHandle = await opfsRoot.getFileHandle(fileName, { create: true });

const text = await fileHandle.getFile().then((file) => file.text());

console.log(text);

const settings = new Settings({
	themeToggle: document.querySelector(".theme-toggle") as HTMLButtonElement,
});

const editor = new Editor({
	editor: document.getElementById("editor") as HTMLInputElement,
});

editor.loadText(text);
editor.on("save", async (text) => {
	const currentFileWriter = await fileHandle.createWritable({ keepExistingData: false });
	await currentFileWriter.write(text);
	await currentFileWriter.close();
});

editor.on("wordCountChange", (count) => (document.querySelector("#word-count span")!.textContent = count.toString()));
document.getElementById("font-family")!.addEventListener("click", settings.toggleFont);
document.querySelector(".theme-toggle")!.addEventListener("click", settings.toggleTheme);
document.body.addEventListener("click", (event) => event.target === document.body && editor.focus());
