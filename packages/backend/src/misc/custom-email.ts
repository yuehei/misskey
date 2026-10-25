/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { escapeHtml } from './escape-html.js';

// [custom] System email copy: Chinese first, followed by English on the next line.
function message(subject: string, lines: string[]) {
	return { subject, text: lines.join('\n'), html: lines.map(escapeHtml).join('<br>') };
}

function linkedMessage(subject: string, lines: string[], link: string): [string, string, string] {
	const mail = message(subject, lines);
	const escapedLink = escapeHtml(link);
	return [subject, mail.html + '<br><a href="' + escapedLink + '">' + escapedLink + '</a>', mail.text + '\n' + link];
}

export const customEmail = {
	settings: '邮件设置 / Email settings',
	abuseReportSubject: '新的举报 / New abuse report',
	login: message('新的登录提醒 / New login', [
		'您的账号有一次新的登录。',
		'There is a new login to your account.',
		'如果这不是您本人的操作，请修改密码并检查账号的安全设置。',
		'If you do not recognize this login, change your password and review your account security settings.',
	]),
	accountDeleted: message('账号已删除 / Account deleted', [
		'您的账号已删除。',
		'Your account has been deleted.',
	]),
	signup: (link: string) => linkedMessage('注册确认 / Signup confirmation', [
		'请点击以下链接完成注册：',
		'To complete signup, please click the link below:',
	], link),
	verifyEmail: (link: string) => linkedMessage('邮箱验证 / Email verification', [
		'请点击以下链接验证您的邮箱：',
		'To verify your email address, please click the link below:',
	], link),
	resetPassword: (link: string) => linkedMessage('密码重置请求 / Password reset requested', [
		'请点击以下链接重置密码：',
		'To reset your password, please click the link below:',
	], link),
	moderatorInactivity: (remaining: { asDays: number; asHours: number }) => {
		const zh = remaining.asDays === 0 ? remaining.asHours + ' 小时' : remaining.asDays + ' 天';
		const en = remaining.asDays === 0 ? remaining.asHours + ' hours' : remaining.asDays + ' days';
		return message('管理团队长期未活跃提醒 / Moderator inactivity warning', [
			'致管理团队：',
			'To moderators,',
			'管理团队已一段时间未活跃。如果再过 ' + zh + ' 仍无活动，服务器将切换为邀请制。',
			'No moderator activity has been detected for a while. If inactivity continues for another ' + en + ', the server will switch to invitation-only registration.',
			'若要避免切换为邀请制，请登录 Misskey 以更新最后活跃时间。',
			'To prevent this change, log into Misskey to update your last active time.',
		]);
	},
	invitationOnly: (days: number) => message('已切换为邀请制 / Changed to invitation-only registration', [
		'致管理团队：',
		'To moderators,',
		'由于连续 ' + days + ' 天未检测到管理团队的活动，服务器已切换为邀请制。',
		'The server has switched to invitation-only registration because no moderator activity was detected for ' + days + ' days.',
		'如需解除邀请制，请前往控制面板修改设置。',
		'To allow open registration again, update the settings in the control panel.',
	]),
};
