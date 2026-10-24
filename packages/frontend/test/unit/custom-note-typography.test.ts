/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { usesChineseLineHeight } from '@/utility/custom-note-typography.js';

describe('Chinese note typography', () => {
	test.each(['今天的天气很好，适合出去走走。', '這是一段繁體中文，閱讀時需要舒適的行距。', '今天使用 Vue 和 TypeScript 调整页面，中文正文更舒展。', '测试 https://example.com/very-long-url @user@example.com :blobcat:'])('recognizes Chinese prose: %s', text => {
		expect(usesChineseLineHeight(text)).toBe(true);
	});
	test.each([null, '', 'A longer English paragraph stays at its original line height.', 'The Chinese word 中文 appears once in this otherwise English sentence.', '今日は良い天気です。', '한국어 문장입니다.', '🙂 12345'])('preserves other content: %s', text => {
		expect(usesChineseLineHeight(text)).toBe(false);
	});
});
