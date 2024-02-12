import { TMarkersToVariablesMapping, TVariablesToMarkersMapping } from './types';

const VARIABLE_REGEX =
	/\{\{\s(([_a-zA-Z0-9][_a-zA-Z0-9 ]*[_a-zA-Z0-9])|[_a-zA-Z0-9])\s\}\}(?=(?:(?:[^"]*"){2})*[^"]*$)/g;
const PLACEHOLDER_REGEX =
	/\[\[\s(([_a-zA-Z0-9][_a-zA-Z0-9 ]*[_a-zA-Z0-9])|[_a-zA-Z0-9])\s\]\](?=(?:(?:[^"]*"){2})*[^"]*$)/g;

export const CIRCLE_BRACKET_DIAGNOSTIC_OFFSET = 1;
export const INLINE_CSS_ID = '#inline-styles-configuration';

function generateMarkerId(length: number) {
	const characters = '0123456789';
	const charactersLength = characters.length;
	return Array.from({ length }, () =>
		characters.charAt(Math.floor(Math.random() * charactersLength))
	).join('');
}

// Issue: https://gitlab.com/assertiveyield/assertiveAnalytics/-/issues/2524
// Converts variables definitions to valid identifiers {{ Window Height }} to vr_5137247664608517
// Note: identifier length should match variable's length. In opposite case diagnostic markers will have incorrect positions.
export const replaceVariablesWithMarkers = (
	text: string,
	initialMapping: TMarkersToVariablesMapping
) => {
	const markersToVariables: TMarkersToVariablesMapping = { ...initialMapping };
	const variablesToMarkersIds: TVariablesToMarkersMapping = {};

	const markerPrefix = 'VR_';

	return {
		text: text.replace(VARIABLE_REGEX, (variable) => {
			if (variablesToMarkersIds[variable]) {
				const markerId = variablesToMarkersIds[variable];
				return markerId;
			} else {
				const markerId = `${markerPrefix}${generateMarkerId(
					variable.length - markerPrefix.length
				)}`;
				variablesToMarkersIds[variable] = markerId;
				markersToVariables[markerId] = variable;
				return markerId;
			}
		}),
		markersMapping: markersToVariables
	};
};

// Issue: https://gitlab.com/assertiveyield/assertiveAnalytics/-/issues/2524
// JSON: Wraps placeholders and variables with quotes, e.g., {{ var1 }} becomes "{ var1 }" and [[ placeholder1 ]] becomes "[ placeholder1 ]"
// Note: The length of wrapped placeholders and variables should match the initial length of placeholders and variables.
// Cut the first "[" and last "]" of placeholder definitions because quotes take their positions while diagnostics performing. The same applies to variables; cut the first "{" and last "}".
// In opposite case diagnostic markers will have incorrect positions.
export const wrapPlaceholdersAndVariablesWithQuotes = (text: string) =>
	text.replace(
		new RegExp(`${PLACEHOLDER_REGEX.source}|${VARIABLE_REGEX.source}`, 'g'),
		(target) => `"${target.slice(1, target.length - 1)}"`
	);

// Checks if code block starts with "{"
export const isInlineConfig = (text: string) => /^\s*{/.test(text);

// Checks if code block starts with "{" or "function() {..."
export const shouldWrapWithCircleBrackets = (text: string) => /^\s*({|function\s*())/.test(text);
