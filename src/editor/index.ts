import { debounce } from "../utils";
import { EditorHistory } from "./history";

export class Editor {
	history: EditorHistory;
	editor: HTMLInputElement;
	historyTimeout: Timer | null = null;

	constructor({ editor }: { editor: HTMLInputElement }) {
		this.editor = editor;
		this.editor.addEventListener("beforeinput", this.handleBeforeInput);
		this.editor.addEventListener("input", this.handleInput as EventListener);
		this.editor.addEventListener("keydown", this.handleKeydown);

		editor.value = localStorage.getItem("text") ?? "";

		this.history = new EditorHistory(editor.value);
		this.resize();
		this.focus();

		window.addEventListener("beforeunload", () => {
			localStorage.setItem("text", this.editor.value);
		});

		setInterval(() => {
			this.pushHistory();
		}, 2000);
	}

	pushHistory = () => this.history.push(this.editor.value);
	focus = () => this.editor.focus();

	handleKeydown = (event: KeyboardEvent) => {
		if (event.key === "Tab") {
			console.log("tab");

			event.preventDefault();
			this.pushHistory();
			this.editor.setRangeText(
				"  ",
				this.editor.selectionStart ?? 0,
				this.editor.selectionEnd ?? 0,
				"end",
			);
		}

		if (event.key === "z" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			if (event.shiftKey) {
				this.editor.value = this.history.redo();
			} else {
				this.editor.value = this.history.undo();
			}
			this.resize();
		}
		if (event.key === "y" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			this.editor.value = this.history.redo();
			this.resize();
		}
	};

	onWordCountChange = (callback: (count: number) => void) => {
		this.editor.addEventListener("input", () => {
			const text = this.editor.value;
			if (text.length === 0 || text.trim().length === 0) {
				callback(0);
				return;
			}

			const words = text.trim().split(/\s+/).length;
			callback(words);
		});
	};

	resize = () => {
		this.editor.style.height = "auto";
		this.editor.style.height = `${this.editor.scrollHeight}px`;
	};

	handlePaste = (event: ClipboardEvent) => {
		event.preventDefault();
		const text = event.clipboardData?.getData("text/plain") ?? "";
		this.editor.setRangeText(
			text,
			this.editor.selectionStart ?? 0,
			this.editor.selectionEnd ?? 0,
			"end",
		);
		this.resize();
	};

	handleBeforeInput = (event: InputEvent) => {
		const selectionStart = this.editor.selectionStart ?? 0;
		const selectionEnd = this.editor.selectionEnd ?? 0;

		if (selectionEnd - selectionStart > 0) {
			if (["*", "_", "~", '"'].includes(event.data ?? "")) {
				event.preventDefault();
				this.pushHistory();

				let prefix = event.data;
				let suffix = event.data;

				if (event.data === '"') {
					prefix = "“";
					suffix = "”";
				}

				this.editor.setRangeText(
					prefix +
						this.editor.value.substring(selectionStart, selectionEnd) +
						suffix,
					selectionStart,
					selectionEnd,
					"end",
				);

				// select the text inside the formatting
				this.editor.setSelectionRange(selectionStart + 1, selectionEnd + 1);
			}
		}
	};

	handleInput = (event: InputEvent) => {
		this.resize();
		const text = this.editor.value;

		debounce(() => {
			localStorage.setItem("text", text);
		})();

		if (this.editor.selectionStart === this.editor.value.length) {
			window.scrollTo(0, document.body.scrollHeight);
		}

		if (event.inputType === "deleteContentBackward") {
			this.historyTimeout = setTimeout(this.pushHistory, 200);
		}

		if (event.inputType === "insertText") {
			const position = this.editor.selectionStart ?? 0;
			const text = this.editor.value;

			if (this.historyTimeout) clearTimeout(this.historyTimeout);
			if (text === " ") {
				this.historyTimeout = setTimeout(this.pushHistory, 200);
			} else {
				this.historyTimeout = setTimeout(this.pushHistory, 500);
			}

			// ellipsis
			if (event.data === ".") {
				if (text[position - 2] === "." && text[position - 3] === ".") {
					this.editor.setRangeText("…", position - 3, position, "end");
				}
			}

			// em dash
			if (event.data === "-" && text[position - 2] === "-") {
				this.editor.setRangeText("—", position - 2, position, "end");
			}

			// << and >>
			if (event.data === ">" && text[position - 2] === ">") {
				this.editor.setRangeText("»", position - 2, position, "end");
			}

			if (event.data === "<" && text[position - 2] === "<") {
				this.editor.setRangeText("«", position - 2, position, "end");
			}

			// smart quotes
			if (event.data === '"') {
				// check if the inserted character is a quote
				let prevQuotePosition = position - 2;
				let foundMatchingQuote = false;
				let newlines = 0;

				// Loop backwards from the current position to find the previous matching quote
				while (prevQuotePosition >= 0) {
					const charBefore =
						prevQuotePosition === 0 ? undefined : text[prevQuotePosition - 1];

					const char = text[prevQuotePosition];

					if (char === "\n") {
						newlines++;
					}

					if (newlines > 5) {
						break;
					}

					if (
						char === '"' &&
						(charBefore === " " ||
							charBefore === "\n" ||
							charBefore === undefined)
					) {
						foundMatchingQuote = true;
						break;
					}

					if (char === "”" || char === "“" || char === '"') {
						break;
					}

					prevQuotePosition--;
				}

				// Only replace quotes if a matching quote was found
				if (foundMatchingQuote) {
					this.editor.setRangeText(
						"“",
						prevQuotePosition,
						prevQuotePosition + 1,
						"end",
					); // replace previous with opening quote
					this.editor.setRangeText("”", position - 1, position, "end"); // replace current with closing quote
				}
			}
		}

		if (event.inputType === "insertLineBreak") {
			const lines = text.split("\n");
			const lastLine = lines[lines.length - 2];

			const prefixMatch = lastLine.match(/^(\d+\. |(?:>|\*|-) )/);
			if (prefixMatch) {
				const fullPrefix = prefixMatch[0];
				const trimmedLastLine = lastLine.trim();

				if (trimmedLastLine === fullPrefix.trim()) {
					this.editor.value = `${text.substring(0, text.length - fullPrefix.length - 1)}\n`;
				} else {
					let newPrefix = fullPrefix;
					const match = Number.parseInt(prefixMatch[1]);
					if (!Number.isNaN(match)) {
						newPrefix = `${match + 1}. `;
					}
					this.editor.value += newPrefix;
				}

				event.preventDefault();
			}

			this.pushHistory();
		}
	};
}
