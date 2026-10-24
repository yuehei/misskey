/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { customEmail } from './custom-email.js';

// [custom] Check bilingual ordering and preserve action URLs in both email formats.
describe('custom system emails', () => {
	test.each(['signup', 'verifyEmail', 'resetPassword'] as const)('%s preserves and escapes the action URL', (kind) => {
		const link = 'https://example.test/action?token=a&next="<test>"';
		const [subject, html, text] = customEmail[kind](link);
		expect(subject).toMatch(/\p{Script=Han}.* \/ [A-Za-z]/u);
		expect(text.split('\n')).toHaveLength(3);
		expect(text.split('\n')[0]).toMatch(/\p{Script=Han}/u);
		expect(text.split('\n')[1]).toMatch(/^To /);
		expect(text.split('\n')[2]).toBe(link);
		expect(html).toContain('href="https://example.test/action?token=a&amp;next=&quot;&lt;test&gt;&quot;"');
		expect(html).not.toContain('<test>');
	});

	test('pairs Chinese and English lines in every informational message', () => {
		for (const mail of [customEmail.login, customEmail.accountDeleted, customEmail.moderatorInactivity({ asDays: 2, asHours: 48 }), customEmail.invitationOnly(7)]) {
			expect(mail.subject).toMatch(/\p{Script=Han}.* \/ [A-Za-z]/u);
			const lines = mail.text.split('\n');
			expect(lines.length % 2).toBe(0);
			for (let i = 0; i < lines.length; i += 2) {
				expect(lines[i]).toMatch(/\p{Script=Han}/u);
				expect(lines[i + 1]).toMatch(/^[A-Za-z]/);
			}
			expect(mail.html.split('<br>')).toEqual(lines);
		}
	});

	test('uses remaining hours below one day and retains the invitation threshold', () => {
		const warning = customEmail.moderatorInactivity({ asDays: 0, asHours: 6 });
		expect(warning.text).toContain('6 小时');
		expect(warning.text).toContain('6 hours');
		const changed = customEmail.invitationOnly(7);
		expect(changed.text).toContain('7 天');
		expect(changed.text).toContain('7 days');
	});
});
