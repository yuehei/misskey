/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, test } from 'vitest';

const bootScript = readFileSync(resolve(process.cwd(), 'public/loader/boot.js'), 'utf8');

async function boot(values: Record<string, string>) {
	const storage = new Map(Object.entries(values));
	const classes = new Set<string>();
	const context = {
		LANGS: ['en-US'],
		URLSearchParams,
		navigator: { language: 'en-US' },
		window: { location: { search: '' }, addEventListener: () => {} },
		document: {
			// Keep the app import pending while executing the real bootloader.
			readyState: 'loading',
			documentElement: { classList: { add: (name: string) => classes.add(name) } },
		},
		localStorage: {
			getItem: (key: string) => storage.get(key) ?? null,
			setItem: (key: string, value: string) => storage.set(key, value),
		},
	};
	await runInNewContext(bootScript, context);
	return { storage, classes };
}

describe('system font boot defaults', () => {
	const profiles: Record<string, string>[] = [
		{},
		{ lastVersion: '2026.10.1' },
		{ account: '{"id":"new-account"}', preferences: '{}' },
		{ customTypographyInitialized: 'true', lastVersion: '2026.10.1' },
	];
	test.each(profiles)('enables an unset font independently of browser history: %j', async values => {
		const { storage, classes } = await boot(values);
		expect(storage.get('useSystemFont')).toBe('t');
		expect(classes.has('useSystemFont')).toBe(true);
	});

	test('keeps an explicit opt-out across reloads and account changes', async () => {
		const first = await boot({ useSystemFont: 'f', account: '{"id":"first"}' });
		first.storage.set('account', '{"id":"second"}');
		const second = await boot(Object.fromEntries(first.storage));
		expect(second.storage.get('useSystemFont')).toBe('f');
		expect(first.classes.has('useSystemFont')).toBe(false);
		expect(second.classes.has('useSystemFont')).toBe(false);
	});

	test('preserves the enabled value and the selected font size', async () => {
		const { storage, classes } = await boot({ useSystemFont: 't', fontSize: '2' });
		expect(storage.get('fontSize')).toBe('2');
		expect(classes.has('f-2')).toBe(true);
		expect(classes.has('useSystemFont')).toBe(true);
	});

	test('keeps the upstream default font size for an unset profile', async () => {
		const { storage, classes } = await boot({});
		expect(storage.has('fontSize')).toBe(false);
		expect([...classes]).toEqual(['useSystemFont']);
	});
});
