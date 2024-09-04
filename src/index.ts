import { Editor } from "./editor";
import { Settings } from "./settings";

const settings = new Settings({
	themeToggle: document.querySelector(".theme-toggle") as HTMLButtonElement,
});

const editor = new Editor({
	editor: document.getElementById("editor") as HTMLInputElement,
});

editor.onWordCountChange((count) => {
	const wordcount = document.querySelector(
		"#word-count span",
	) as HTMLSpanElement;
	wordcount.textContent = count.toString();
});

const themeToggle = document.querySelector(".theme-toggle")!;
const fontToggle = document.getElementById("font-family")!;
fontToggle.addEventListener("click", settings.toggleFont);
themeToggle.addEventListener("click", settings.toggleTheme);

document.body.addEventListener("click", (event) => {
	if (event.target === document.body) {
		editor.focus();
	}
});
