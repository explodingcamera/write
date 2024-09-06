// biome-ignore lint/suspicious/noExplicitAny:
export const debounce = <T extends (...args: any[]) => void>(func: T, delay = 500) => {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	return (...args: Parameters<T>) => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => func(...args), delay);
	};
};
