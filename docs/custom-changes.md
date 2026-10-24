# Fork 定制与上游同步记录

本文记录定制目的、冲突处理原则与验证方法；逐行差异以 Git 为准。

## 当前基线

- 上游：`https://github.com/misskey-dev/misskey`。
- 版本：`2026.10.1`，提交 `4840fa6d576128ba916ba69169258ca177d40faf`。
- 本轮定制：2026-10-24，时间线、主题、字体、主页、双语邮件及 GHCR 手动发布。
- `AGENTS.md` 保持上游内容。本机操作约定保存在不入库的 `AGENTS.override.md`；可共享的维护信息以本文为准。

## 定制范围与冲突处理

以下路径均相对于仓库根目录。

### 时间线与个人主页

修改上游文件：

- `packages/frontend/src/components/MkNote.vue`：操作栏使用可换行 flex 布局，缩小按钮间距，适配窄屏；注释停用旧的 ≤300px 按钮外边距，保留原代码便于合并对照，防止与 gap 叠加。已用实际组件编译样式验证 350/301/300/280px 容器的按钮间距均为 4px。
- `packages/frontend/src/pages/user/index.timeline.vue`：保留上游已有的 `noGap=true`，仅补充定制意图注释。
- `packages/frontend/src/pages/user/home.vue`：展示互相关注、正在关注、关注了你、屏蔽状态徽标，并补充菜单无障碍标签。

合并原则：优先保留上游功能与数据逻辑，在样式层保留上述效果。`MkStreamingNotesTimeline.vue` 和 `MkNotesTimeline.vue` 已恢复上游实现：连续模式保留 0.5px 分隔线，非 noGap 模式保留原面板颜色与卡片布局。导航圆角与行高已撤销定制，保持上游胶囊样式，不要从旧方案恢复小圆角或独立时间线卡片。

### 主题与默认字体

新增文件：

- `packages/frontend-shared/themes/{l,d}-{peach-soda,lime-pop,sky-club,grape-candy,amber-radio}.json5`：蜜桃汽水、青柠游乐场、晴空俱乐部、葡萄软糖、琥珀电台的明暗主题，共 10 个文件。

修改上游文件：

- `packages/frontend-shared/js/theme.ts`：追加定制主题；原有主题保留上游名称及 ID，仅新增主题使用中文名称，不设置名称覆盖映射。
- `packages/frontend/src/boot/common.ts`、`src/pages/settings/theme.vue`、`src/utility/code-highlighter.ts`（后两者同属 frontend）及 `packages/frontend-embed/src/boot.ts`：默认明暗主题统一为葡萄软糖。
- `packages/frontend/public/loader/boot.js`：仅首次使用的新浏览器初始化现有 15px 档（`fontSize=1`）与系统字体；通过 `customTypographyInitialized` 避免重复初始化。
- `packages/frontend/src/style.scss`：系统字体增加中英文及 emoji 回退字体。

合并原则：保留主题 ID、用户与实例已有主题覆盖；已有字号/字体偏好不得重置。没有修改字号档位定义或设置控件。葡萄软糖浅色使用紫色与灰粉底，深色提高强调色亮度以保持可读性。若上游调整主题加载、存储键或首启流程，需重新验证默认值与已有偏好保留。

### 系统邮件中英双语

新增文件：

- `packages/backend/src/misc/custom-email.ts`：集中模板，标题“中文 / English”，正文逐句中文一行、英文下一行；HTML 内容与链接转义，纯文本链接保留原值。
- `packages/backend/src/misc/custom-email.test.ts`：双语顺序、链接保留与转义、时间参数测试。

修改上游文件（均位于 `packages/backend/src/`）：

- `server/api/SigninService.ts`、`server/api/SignupApiService.ts`。
- `server/api/endpoints/i/update-email.ts`、`server/api/endpoints/request-reset-password.ts`。
- `queue/processors/DeleteAccountProcessorService.ts`、`queue/processors/CheckModeratorsActivityProcessorService.ts`。
- `core/AbuseReportNotificationService.ts`、`core/EmailService.ts`。

合并原则：仅替换系统文案，不改变发送条件、收件人、验证链接生成、有效期、API 契约或数据库。举报原文与管理员手动邮件内容不翻译；邮件底部为“邮件设置 / Email settings”。邀请制提醒复用文案的站内管理员公告同步双语。不要修改 Crowdin 管理的中文 locale YAML。上游新增邮件类型或支持服务端多语言时，应重新盘点调用方，优先评估复用上游机制，避免重复维护。

原管理团队通知的两个模板函数保留为注释，并注明实际使用 `custom-email.ts`。对仅停用而非改写的上游代码，保留原文并注释停用原因，便于合并时对照；注释内的旧文案不参与邮件发送。

### GHCR 手动发布

新增 `.github/workflows/docker-custom.yml`，保留原工作流内容：仅 `workflow_dispatch` 手动触发，构建 amd64/arm64 镜像并发布至当前仓库对应 GHCR 路径，使用 `GITHUB_TOKEN`。

合并原则：不修改上游发布流程、不引入明文凭证。升级版本时同时核对工作流中硬编码的版本标签（当前为 `2026.10.1`）、`latest` 和 SHA 标签；未经发布指示，不触发该工作流。

## 后续同步步骤

1. 先备份并暂存本地未提交改动，创建本地备份分支；获取上游并确认目标 tag/提交。
2. 默认在独立同步分支合并新 tag，保留已发布的定制历史。只有明确要求重排未发布分支时才 rebase/squash，不擅自强推远端。
3. 按上面的文件清单处理冲突，结合 `git diff <旧基线> <定制分支>` 和 `[custom]` 标记确认意图，避免整文件选择 ours/theirs。
4. 若上游已提供等价功能，验证需求后移除重复定制，并更新本文；保留原主题 ID 和已有用户设置的兼容性。
5. 执行相关验证，更新本文的基线、行为变化和工作流版本标签，再提交。`AGENTS.md` 跟随上游，本地约定写入 `AGENTS.override.md`。

## 验证记录与复查方法

本轮已通过：变更文件 lint、SPDX、locale safety、6 项前端定向测试、5 项邮件模板测试。浏览器检查覆盖明暗切换、窄屏与偏好保留。未发送真实邮件，未执行 GHCR 发布，未做生产部署验证。

后续合并至少执行：

```sh
# 从仓库根目录执行，base 指定本次同步前的基线或集成分支
node scripts/check-shipping.mjs --base <base>
git diff --check <base> HEAD
pnpm --filter frontend test test/unit/theme.test.ts test/unit/home.test.ts
# 后端测试前按仓库要求准备 .config/test.yml，勿覆盖现有配置
pnpm --filter backend exec vitest run --config vitest.config.unit.ts src/misc/custom-email.test.ts
```

手工复查：连续时间线与主页徽标；320/390px 窄屏操作栏；所有主题仍可选、默认葡萄软糖；新浏览器 15px/系统字体与已有设置保留；邮件中英顺序与有效链接。若涉及 API schema、实体或 migration，再按上游技能要求补充生成与数据库检查。

本轮未调整依赖，锁文件不应夹带包管理器启动器的自动变更。
