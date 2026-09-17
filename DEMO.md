# Demo guide (10 minutes)

Reset to a clean state before presenting: `npm run db:reset`.

## Test accounts

Passwords are **not** stored in this repository or shown on the site. The project admin shares them privately.
For a local database, `npm run db:seed` uses `SEED_PASSWORD` from `.env.local` (or prints a random one).

| Username | Role | Notes |
|---|---|---|
| `student01` | Reporter (นักศึกษา) | Fresh account: shows first-time profile setup + PDPA |
| `staff01` | Reporter (บุคลากร) | Profile already complete |
| `tech01` | Technician (ไฟฟ้า / เครื่องปรับอากาศ) | Best match for air-conditioning jobs |
| `tech02` | Technician (ประปา / อาคาร / เฟอร์นิเจอร์) | |
| `admin01` | Admin | Desktop layout |

An extra technician `tech03` (IT / อื่น ๆ) and reporters `student02`–`student06`, `staff02`–`staff03` exist to make the seed data realistic.

Tip: use two browsers (or one normal + one private window) so the reporter and staff/admin/technician sessions run side by side.

## Script

1. **Browser A**: log in as `student01` → complete the profile and tick PDPA (saving is blocked until it is ticked).
2. Tap **+ แจ้งซ่อม** → เครื่องปรับอากาศ → ปกติ → วิทยาเขตสวนสัก / อาคาร CAMT / ชั้น 3 / ห้อง 301 → description + 2 photos → review → **ส่งคำร้อง** → success animation and code (`MR-YYMM-NNNN`).
3. Tap **ติดตามสถานะ**: the timeline shows `รอรับเรื่อง`.
4. **Browser B**: log in as `staff01` → แจ้งซ่อม → เครื่องปรับอากาศ → same room → the **มีคนแจ้งปัญหานี้แล้ว** sheet appears → **ติดตามงานนี้แทน**.
5. Log out, log in as `admin01` → คำร้องทั้งหมด (pending badge) → click the new request → **รับเรื่อง** → **มอบหมายช่าง** → `ช่างสมศักดิ์ ใจดี` is at the top with the **เหมาะสมที่สุด** tag → confirm.
6. **Browser A** (no refresh): the timeline moves to `มอบหมายช่างแล้ว` within 5 seconds and the bell shakes with a new badge.
7. **Browser B**: log in as `tech01` → งานใหม่ → open the job → **รับงาน** → **รออะไหล่** → **ได้อะไหล่แล้ว กลับไปซ่อมต่อ** → **ซ่อมเสร็จแล้ว** with an after photo and cause.
8. **Browser A** shows `ซ่อมเสร็จ รอยืนยัน` → **ยังไม่หาย** (type a reason) → admin sees it back at `รับเรื่องแล้ว` → reassign `tech01` → technician starts and completes again → student taps **ยืนยันว่าซ่อมเสร็จ**, gives 5 stars → `ปิดงาน`.
9. `admin01` → แดชบอร์ด: totals, closing time, and rating include the new request → download **Excel** and **PDF**.
10. As `student01`, open `/admin` in the address bar → redirected to `/home`.
11. Narrow the window to 360 px and turn on reduced motion (OS setting, or DevTools → Rendering → *prefers-reduced-motion*) → everything still works; animations become simple fades.

### Extras if there is time

- Admin panel: **ขอข้อมูลเพิ่ม** → reporter answers on the tracking page; **รวมคำร้องซ้ำ**; **ปฏิเสธ** with a reason.
- Dashboard → **จำลองเวลาผ่านไป 3 วัน** closes every request still waiting for confirmation.
- ข้อมูลพื้นฐาน: add a category or a room; it appears immediately in the reporter's form.
- History: filters, search by code or building, **แจ้งซ่อมซ้ำ** on a closed request pre-fills category and room.
- Leave the app idle for 30 minutes → automatic logout with an explanation on the login page.

### Driving steps from a terminal (optional)

If a second presenter is not available, technician/admin steps can be run from the terminal while the audience watches the reporter screen update live:

```bash
npx tsx --conditions=react-server scripts/demo-step.ts MR-2609-0013 assign tech01
npx tsx --conditions=react-server scripts/demo-step.ts MR-2609-0013 in_progress
npx tsx --conditions=react-server scripts/demo-step.ts MR-2609-0013 completed
```
