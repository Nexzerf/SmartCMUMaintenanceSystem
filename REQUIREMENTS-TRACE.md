# Requirements traceability

Paths are relative to the project root. "Verified" notes how each item was checked during development.

## Functional requirements

### Core 1 — Submit a maintenance request

| Requirement | Implementation | Verified |
|---|---|---|
| 3-step form with progress bar and slide transitions | `components/reporter/NewRequestForm.tsx`, `app/(reporter)/request/new/page.tsx` | Browser, 390 px |
| Category as iOS grouped list with icon + checkmark | `components/ui/GroupedList.tsx`, `components/ui/CategoryIcon.tsx` | Browser |
| Urgency with hints | `lib/status.ts` (`URGENCY_HINT`), `NewRequestForm.tsx` | Browser |
| Campus → building → floor → room drill-down with breadcrumbs, landmark | `NewRequestForm.tsx` (step 2) | Browser |
| Duplicate check sheet, "ติดตามงานนี้แทน" / "แจ้งใหม่อยู่ดี" | `lib/requests/queries.ts` (`findDuplicate`), `app/actions/requests.ts` (`checkDuplicate`, `followRequest`) | Browser at 360 px, `scripts/check-flow.ts` |
| Description ≥ 10 chars with live counter | `NewRequestForm.tsx`, `createRequest` zod schema | Browser |
| 1–3 JPG/PNG photos, ≤ 10 MB original, compressed to ≤ 1 MB, progress ring, camera capture | `components/request/ImageUploader.tsx`, `app/api/upload/route.ts`, `lib/storage.ts` | Browser: 12.2 MB rejected; 2.9 MB compressed to 0.76 MB |
| Review screen with "แก้ไข" links | `NewRequestForm.tsx` (step 4) | Browser |
| Code `MR-YYMM-NNNN`, status `pending`, before images | `app/actions/requests.ts` (`createRequest`), `request_code_counters` table | Browser |
| Animated success check, "ติดตามสถานะ" / "กลับหน้าแรก" | `components/reporter/SuccessCheck.tsx` | Browser |
| Actionable Thai validation; input kept after failures | zod schemas in `app/actions/*`; draft kept in `sessionStorage` | Browser |

### Core 2 — Track request status

| Requirement | Implementation | Verified |
|---|---|---|
| Header: code, icon, location, status pill | `components/request/RequestDetailBody.tsx` (`RequestHeader`) | Browser |
| Vertical timeline (done / pulsing current / gray future, date + relative time, inline orange side states) | `lib/timeline.ts`, `components/request/Timeline.tsx` | Browser (reopen, waiting parts) |
| Before/after photos with fullscreen viewer, technician, repair notes | `components/request/PhotoGallery.tsx`, `RequestDetailBody.tsx` | Browser |
| Live updates within 5 s | `components/shell/LiveUpdates.tsx` (Supabase Broadcast or 4 s polling), `lib/realtime/server.ts`, `app/api/pulse/route.ts` | Browser: status changed without reload after a server-side change |
| Cancel while pending (confirmation sheet) | `components/reporter/RequestActions.tsx`, `cancelRequest` | Script |
| Answer need_info question | `RequestActions.tsx`, `answerInfoRequest` | Script |
| Confirm with 1–5 stars + comment / "ยังไม่หาย" with reason; auto-close countdown | `RequestActions.tsx`, `confirmCompletion`, `reopenRequest` | Browser |
| History with filter, search, "ติดตาม" tag, "แจ้งซ่อมซ้ำ" prefill | `app/(reporter)/history/page.tsx`, `components/reporter/HistoryList.tsx` | Route smoke test |
| Notifications: bell badge, sheet, tap → open + mark read | `components/shell/NotificationBell.tsx`, `NotificationList.tsx`, `app/actions/notifications.ts` | Browser |
| Home: greeting, active request + progress, "+ แจ้งซ่อม", recent 3, empty state | `app/(reporter)/home/page.tsx`, `ActiveRequestCard.tsx`, `EmptyIllustration.tsx` | Browser |
| Profile setup with PDPA (blocked until ticked), editable profile | `app/(onboarding)/profile/setup/page.tsx`, `components/reporter/ProfileForm.tsx`, `app/actions/profile.ts` | Browser |
| Bottom tab bar with raised center button | `components/shell/TabBar.tsx` | Browser |

### Core 3 — Technician views and updates jobs

| Requirement | Implementation | Verified |
|---|---|---|
| Jobs assigned to me, sorted by urgency then age; segmented filter | `lib/requests/queries.ts` (`listTechnicianJobs`), `components/tech/JobList.tsx` | Browser |
| Live updates + notification on new assignment | `LiveUpdates.tsx`, `transition.ts` (`job_assigned`) | Script |
| Job detail with landmark, photos, reporter name + tap-to-call phone (assigned tech/admin only) | `app/(technician)/tech/job/[code]/page.tsx`, `getRequestForUser` (`can_view_phone`) | Browser |
| รับงาน → รออะไหล่ → กลับไปซ่อมต่อ → ซ่อมเสร็จแล้ว | `components/tech/JobActions.tsx`, `app/actions/technician.ts` | Browser |
| Completion sheet: 1–3 after photos, required cause, optional parts | `JobActions.tsx`, `completeJob` | Browser (validation + submit) |
| Reopened job returns to admin; technician notified | `transition.ts` (reopen branch) | `scripts/check-flow.ts` |

### Additional — Admin analytics dashboard (+ admin management)

| Requirement | Implementation | Verified |
|---|---|---|
| Range selector: 7 วัน / 30 วัน / เดือนนี้ / กำหนดเอง | `lib/dashboard.ts` (`resolveRange`), `components/admin/DashboardView.tsx` | Browser |
| KPI count-up: total, open, urgent open, avg close hours, avg rating | `DashboardView.tsx` (`CountUp`), `getDashboard` | Browser |
| Charts: requests over time, by status, top 5 buildings, by category, technician workload | `DashboardView.tsx` (Recharts); palette checked with a colorblind-safety validator | Browser |
| 5 oldest open urgent requests → detail panel | `DashboardView.tsx`, `components/admin/RequestPanel.tsx` | Browser |
| Export Excel and PDF (Thai text) | `lib/export.ts`, `app/api/admin/export/{xlsx,pdf}/route.ts` | Downloaded both; PDF rendered and inspected |
| Request table: filters, code search, sortable columns | `app/(admin)/admin/requests/page.tsx`, `components/admin/RequestTable.tsx` | Browser |
| Side detail panel: accept, urgency, ask info, assign (skill match + open job count), merge, reject | `RequestPanel.tsx`, `app/actions/admin.ts`, `technicianOptions` | Browser (accept, assign), script (others) |
| Pending badge in sidebar | `components/admin/AdminSidebar.tsx`, `pendingCount` | Browser (5 → 4) |
| Auto-close after 3 days + demo button | `runAutoClose` in `transition.ts`, `simulateAutoClose` | `scripts/check-flow.ts` |
| Master data CRUD: categories, campuses → buildings → rooms, technicians + skills | `app/(admin)/admin/settings/page.tsx`, `components/admin/SettingsView.tsx`, `app/actions/settings.ts` | Route smoke test |

### Authentication and roles

| Requirement | Implementation |
|---|---|
| Single login page, fixed `@cmu.ac.th` suffix, strips `@…` | `app/login/LoginForm.tsx` |
| bcrypt compare in Server Action, httpOnly cookie, role redirect, Thai error | `app/actions/auth.ts`, `lib/auth/session.ts` |
| "ลืมรหัสผ่าน?" sheet, prototype notice, test-account panel, no sign-up | `LoginForm.tsx` |
| Status machine in one function; history + notifications per transition | `lib/requests/transition.ts` |

## Non-functional requirements

| NFR | Implementation | Verified |
|---|---|---|
| Session on every route; 30-minute idle timeout | `middleware.ts` (sliding 30-min JWT, passive polling excluded), `components/shell/IdleLogout.tsx` | Idle logout happened during testing; route smoke test |
| Role checks on server for every page and action | `middleware.ts`, `requirePageUser` / `requireActionUser` in `lib/auth/guard.ts`, used by every page and action | curl: wrong role → own home; admin export as reporter → 403 |
| Reporters see own + followed; technicians see assigned; admin all | `getRequestForUser`, `listReporterRequests`, `listTechnicianJobs` | curl: other reporter's request → 404 |
| bcrypt passwords, HTTPS | `bcryptjs` in `auth.ts`/`seed.ts`/`settings.ts`; Secure cookie in production, Vercel HTTPS |  |
| Phone visible only to assigned technician and admin | `getRequestForUser` nulls `reporter_phone` otherwise | Code review |
| PDPA consent at first use | `saveProfile` requires consent in setup mode; `requirePageUser` redirects incomplete profiles | Browser |
| Responsive from 360 px | Mobile-first layouts, `overflow-x-auto` tables | Browser at 360 px and 390 px |
| Tap targets ≥ 44 px | `min-h-11`/`h-11` on controls, 52 px list rows | Code review |
| Thai UI with actionable errors | All messages in `app/actions/*`, forms | Browser |
| WCAG 2.1 AA contrast | Tokens in `app/globals.css` (muted `#6B6B6B` on `#F5F5F7` ≈ 5:1; pill inks on tints ≥ 4.5:1) | Calculated |
| `prefers-reduced-motion` | `MotionConfig reducedMotion="user"` (`components/providers/MotionProvider.tsx`), CSS media query in `globals.css`, charts disable animation | Code review |
| Load ≤ 3 s: Server Components, skeletons, `next/image` | Server pages, `loading.tsx` + `components/ui/PageSkeletons.tsx`, `PhotoGallery.tsx` | Production build: 102–301 kB first load |
| Images ≤ 1 MB before upload | `ImageUploader.tsx` + server check in `app/api/upload/route.ts` | Browser |
| Realtime ≤ 5 s | Supabase Broadcast, 4 s polling fallback | Browser |
| Graceful errors, retry, keep input | Upload retry tile, submit retry banner, draft in `sessionStorage`, manual form dispatch (no reset), `app/error.tsx` | Browser |
| Master data without code changes | Settings UI | Route smoke test |
| Modern browsers | Standard Next.js 15 targets | — |
| Visual system (no borders/gradients, filled buttons, status colors, sheets, skeletons, lucide icons) | `app/globals.css`, `components/ui/*` | Browser |
| Motion table (press 0.97, step slide, success draw, pulse, sheets, stagger, count-up, bell shake) | `Button.tsx`, `NewRequestForm.tsx`, `SuccessCheck.tsx`, `Timeline.tsx`, `Sheet.tsx`, `RequestRow.tsx`, `DashboardView.tsx`, `NotificationBell.tsx` | Browser |
