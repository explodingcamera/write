export const smartQuotes = (
	eventData: string | null,
	position: number,
	editor: HTMLInputElement,
) => {
	const text = editor.value;

	if (eventData === '"') {
		let prevQuotePosition = position - 2;
		let foundMatchingQuote = false;
		let newlines = 0;

		while (prevQuotePosition >= 0) {
			const charBefore =
				prevQuotePosition === 0 ? undefined : text[prevQuotePosition - 1];

			const char = text[prevQuotePosition];

			if (char === "\n") newlines++;
			if (newlines > 5) break;

			if (
				char === '"' &&
				(charBefore === " " || charBefore === "\n" || charBefore === undefined)
			) {
				foundMatchingQuote = true;
				break;
			}

			if (char === "”" || char === "“" || char === '"') break;

			prevQuotePosition--;
		}

		if (foundMatchingQuote) {
			editor.setRangeText("“", prevQuotePosition, prevQuotePosition + 1, "end");
			editor.setRangeText("”", position - 1, position, "end");
		}
	}
};
