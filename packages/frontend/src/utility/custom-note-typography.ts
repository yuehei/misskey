/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// [custom] A typography heuristic, not language detection. Ignore URLs and mentions
// so Chinese technical posts can retain a more comfortable line height.
export function usesChineseLineHeight(text: string | null | undefined): boolean {
	if (!text) return false;
	const prose = text.replace(/https?:\/\/\S+|@[\w.-]+(?:@[\w.-]+)?|:[\w]+:/g, '');
	if (/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(prose)) return false;
	const han = prose.match(/\p{Script=Han}/gu)?.length ?? 0;
	const letters = prose.match(/\p{Letter}/gu)?.length ?? 0;
	return han > 0 && han / letters >= 0.3;
}
