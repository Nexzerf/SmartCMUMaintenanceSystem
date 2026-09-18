"use client";

import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, useTransition } from "react";
import { deleteCategory, deleteLocation, saveBuilding, saveCampus, saveCategory, saveRoom, saveTechnician } from "@/app/actions/settings";
import { Button } from "@/components/ui/Button";
import { CATEGORY_ICONS, CategoryIcon } from "@/components/ui/CategoryIcon";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { Pill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/cn";
import { facultiesOf, facultyName } from "@/lib/faculties";
import { floorLabel, formatPhone } from "@/lib/format";
import type { Catalog } from "@/lib/requests/queries";

type Tech = { id: string; username: string; full_name: string; phone: string | null; is_active: boolean; skills: number[] };

type Editor =
  | { kind: "category"; id?: number; name_th: string; icon: string; is_active: boolean }
  | { kind: "campus"; id?: number; name_th: string }
  | { kind: "building"; id?: number; campus_id: number; name_th: string; faculty_th: string }
  | { kind: "room"; id?: number; building_id: number; floor: string; name_th: string }
  | { kind: "tech"; id?: string; username: string; full_name: string; phone: string; password: string; is_active: boolean; skills: number[] };

const TITLES: Record<Editor["kind"], string> = { category: "ประเภทปัญหา", campus: "วิทยาเขต", building: "อาคาร", room: "ห้อง", tech: "บัญชีช่าง" };

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
      <span className="text-[15px] font-semibold">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-green-ink" : "bg-fill-strong")}
      >
        {/* left-0 anchors the knob: without it the absolute span starts at the button's centered content box. */}
        <span className={cn("absolute left-0 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

function Column({ title, onAdd, addLabel, children }: { title: string; onAdd?: () => void; addLabel: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-[16px] bg-white">
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {onAdd ? (
          <button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-semibold text-brand">
            <Plus size={16} aria-hidden /> {addLabel}
          </button>
        ) : null}
      </div>
      <ul className="max-h-[520px] overflow-y-auto pb-2">{children}</ul>
    </section>
  );
}

function Row({ label, detail, selected, onSelect, onEdit, muted }: { label: React.ReactNode; detail?: React.ReactNode; selected?: boolean; onSelect?: () => void; onEdit: () => void; muted?: boolean }) {
  return (
    <li className={cn("flex items-center gap-1 pr-1", selected && "bg-brand-soft")}>
      <button type="button" onClick={onSelect ?? onEdit} className={cn("flex min-h-12 min-w-0 flex-1 items-center gap-2 px-4 py-2 text-left", muted && "opacity-60")}>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[15px]", selected && "font-semibold text-brand")}>{label}</span>
          {detail ? <span className="block truncate text-[13px] text-muted">{detail}</span> : null}
        </span>
        {onSelect ? <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden /> : null}
      </button>
      <button type="button" onClick={onEdit} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-fill" aria-label={`แก้ไข ${typeof label === "string" ? label : ""}`}>
        <Pencil size={16} />
      </button>
    </li>
  );
}

export function SettingsView({ catalog, technicians }: { catalog: Catalog; technicians: Tech[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"categories" | "locations" | "techs">("categories");
  const [campusId, setCampusId] = useState<number | null>(catalog.campuses[0]?.id ?? null);
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [facultyFilter, setFacultyFilter] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const campusBuildings = catalog.buildings.filter((b) => b.campus_id === campusId);
  const faculties = facultiesOf(campusBuildings);
  const buildings = campusBuildings.filter((b) => !facultyFilter || facultyName(b) === facultyFilter);
  // Every faculty name in use, offered as suggestions when editing a building.
  const allFaculties = [...new Set(catalog.buildings.map((b) => b.faculty_th).filter((f): f is string => !!f))].sort((a, b) => a.localeCompare(b, "th"));
  const rooms = useMemo(() => catalog.rooms.filter((r) => r.building_id === buildingId).sort((a, b) => a.floor - b.floor || a.name_th.localeCompare(b.name_th, "th")), [catalog.rooms, buildingId]);
  const catName = (id: number) => catalog.categories.find((c) => c.id === id)?.name_th ?? "";

  const open = (e: Editor) => {
    setError(null);
    setEditor(e);
  };
  const patch = (p: Partial<Editor>) => setEditor((e) => (e ? ({ ...e, ...p } as Editor) : e));

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    start(async () => {
      try {
        const res = await fn();
        if (!res.ok) return setError(res.error ?? "บันทึกไม่สำเร็จ");
        setEditor(null);
        router.refresh();
      } catch {
        setError("เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง");
      }
    });
  };

  const save = () => {
    if (!editor) return;
    switch (editor.kind) {
      case "category":
        return run(() => saveCategory({ id: editor.id, name_th: editor.name_th, icon: editor.icon, is_active: editor.is_active }));
      case "campus":
        return run(() => saveCampus({ id: editor.id, name_th: editor.name_th }));
      case "building":
        return run(() => saveBuilding({ id: editor.id, campus_id: editor.campus_id, name_th: editor.name_th, faculty_th: editor.faculty_th }));
      case "room":
        return run(() => saveRoom({ id: editor.id, building_id: editor.building_id, floor: Number(editor.floor), name_th: editor.name_th }));
      case "tech":
        return run(() => saveTechnician({ id: editor.id, username: editor.username, full_name: editor.full_name, phone: editor.phone, password: editor.password || undefined, is_active: editor.is_active, skills: editor.skills }));
    }
  };

  const remove = () => {
    if (!editor?.id) return;
    if (editor.kind === "category") return run(() => deleteCategory(editor.id as number));
    if (editor.kind === "campus" || editor.kind === "building" || editor.kind === "room") return run(() => deleteLocation(editor.kind as "campus", editor.id as number));
  };

  return (
    <div className="mt-5">
      <SegmentedControl
        label="หมวดข้อมูล"
        className="max-w-[520px]"
        value={tab}
        onChange={setTab}
        options={[
          { value: "categories", label: "ประเภทปัญหา" },
          { value: "locations", label: "สถานที่" },
          { value: "techs", label: "บัญชีช่าง" },
        ]}
      />

      <div className="mt-4">
        {tab === "categories" ? (
          <div className="max-w-[640px]">
            <Column title={`ประเภทปัญหา (${catalog.categories.length})`} addLabel="เพิ่มประเภท" onAdd={() => open({ kind: "category", name_th: "", icon: "Wrench", is_active: true })}>
              {catalog.categories.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4">
                  <CategoryIcon name={c.icon} size="sm" className={cn(!c.is_active && "opacity-50")} />
                  <span className={cn("min-w-0 flex-1 truncate py-3 text-[15px]", !c.is_active && "text-muted")}>{c.name_th}</span>
                  {c.is_active ? <Pill tone="green">เปิดใช้งาน</Pill> : <Pill tone="gray">ปิดใช้งาน</Pill>}
                  <button type="button" onClick={() => open({ kind: "category", id: c.id, name_th: c.name_th, icon: c.icon, is_active: c.is_active })} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-fill" aria-label={`แก้ไข ${c.name_th}`}>
                    <Pencil size={16} />
                  </button>
                </li>
              ))}
            </Column>
          </div>
        ) : null}

        {tab === "locations" ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <Column title="วิทยาเขต" addLabel="เพิ่ม" onAdd={() => open({ kind: "campus", name_th: "" })}>
              {catalog.campuses.map((c) => (
                <Row
                  key={c.id}
                  label={c.name_th}
                  detail={`${catalog.buildings.filter((b) => b.campus_id === c.id).length} อาคาร`}
                  selected={campusId === c.id}
                  onSelect={() => {
                    setCampusId(c.id);
                    setBuildingId(null);
                    setFacultyFilter("");
                  }}
                  onEdit={() => open({ kind: "campus", id: c.id, name_th: c.name_th })}
                />
              ))}
            </Column>
            <Column
              title="อาคาร"
              addLabel="เพิ่ม"
              onAdd={campusId ? () => open({ kind: "building", campus_id: campusId, name_th: "", faculty_th: facultyFilter }) : undefined}
            >
              {campusBuildings.length ? (
                <li className="px-4 pb-2 pt-1">
                  <label htmlFor="fac-filter" className="sr-only">
                    กรองตามคณะหรือหน่วยงาน
                  </label>
                  <select
                    id="fac-filter"
                    value={facultyFilter}
                    onChange={(e) => {
                      setFacultyFilter(e.target.value);
                      setBuildingId(null);
                    }}
                    className="min-h-11 w-full rounded-[12px] bg-page px-3 text-[15px] outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">ทุกคณะและหน่วยงาน ({campusBuildings.length} อาคาร)</option>
                    {faculties.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name} ({f.count})
                      </option>
                    ))}
                  </select>
                </li>
              ) : null}
              {buildings.length ? (
                (facultyFilter ? [{ name: facultyFilter }] : faculties).map((f) => (
                  <Fragment key={f.name}>
                    {!facultyFilter ? <li className="bg-page px-4 py-1.5 text-[13px] font-semibold text-muted">{f.name}</li> : null}
                    {buildings
                      .filter((b) => facultyName(b) === f.name)
                      .map((b) => (
                        <Row
                          key={b.id}
                          label={b.name_th}
                          detail={`${catalog.rooms.filter((r) => r.building_id === b.id).length} ห้อง`}
                          selected={buildingId === b.id}
                          onSelect={() => setBuildingId(b.id)}
                          onEdit={() => open({ kind: "building", id: b.id, campus_id: b.campus_id, name_th: b.name_th, faculty_th: b.faculty_th ?? "" })}
                        />
                      ))}
                  </Fragment>
                ))
              ) : (
                <li className="px-4 py-6 text-sm text-muted">{campusId ? "ยังไม่มีอาคารในวิทยาเขตนี้" : "เลือกวิทยาเขตก่อน"}</li>
              )}
            </Column>
            <Column title="ห้อง" addLabel="เพิ่ม" onAdd={buildingId ? () => open({ kind: "room", building_id: buildingId, floor: "1", name_th: "" }) : undefined}>
              {buildingId ? (
                rooms.length ? (
                  rooms.map((r) => <Row key={r.id} label={r.name_th} detail={floorLabel(r.floor)} onEdit={() => open({ kind: "room", id: r.id, building_id: r.building_id, floor: String(r.floor), name_th: r.name_th })} />)
                ) : (
                  <li className="px-4 py-6 text-sm text-muted">ยังไม่มีห้องในอาคารนี้</li>
                )
              ) : (
                <li className="px-4 py-6 text-sm text-muted">เลือกอาคารเพื่อดูห้อง</li>
              )}
            </Column>
          </div>
        ) : null}

        {tab === "techs" ? (
          <div className="max-w-[760px]">
            <Column title={`บัญชีช่าง (${technicians.length})`} addLabel="เพิ่มช่าง" onAdd={() => open({ kind: "tech", username: "", full_name: "", phone: "", password: "", is_active: true, skills: [] })}>
              {technicians.map((t) => (
                <Row
                  key={t.id}
                  muted={!t.is_active}
                  label={
                    <span className="flex items-center gap-2">
                      ช่าง{t.full_name}
                      {!t.is_active ? <Pill tone="gray">ปิดใช้งาน</Pill> : null}
                    </span>
                  }
                  detail={`${t.username} · ${t.phone ? formatPhone(t.phone) : "ไม่มีเบอร์"} · ${t.skills.map(catName).join(", ") || "ยังไม่กำหนดความถนัด"}`}
                  onEdit={() => open({ kind: "tech", id: t.id, username: t.username, full_name: t.full_name, phone: t.phone ?? "", password: "", is_active: t.is_active, skills: t.skills })}
                />
              ))}
            </Column>
          </div>
        ) : null}
      </div>

      <Sheet
        open={!!editor}
        onClose={() => setEditor(null)}
        side="right"
        title={editor ? `${editor.id ? "แก้ไข" : "เพิ่ม"}${TITLES[editor.kind]}` : ""}
        footer={
          <div className="flex gap-2">
            {editor?.id && editor.kind !== "tech" ? (
              <Button variant="danger" onClick={remove} loading={pending} aria-label="ลบ">
                <Trash2 size={17} aria-hidden />
              </Button>
            ) : null}
            <Button className="flex-1" size="lg" onClick={save} loading={pending}>
              บันทึก
            </Button>
          </div>
        }
      >
        {editor ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {editor.kind === "tech" ? (
              <>
                <div>
                  <Label htmlFor="ed-name">ชื่อ-นามสกุล</Label>
                  <Input id="ed-name" value={editor.full_name} onChange={(e) => patch({ full_name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="ed-user">Username (CMU Account)</Label>
                  <Input id="ed-user" value={editor.username} autoCapitalize="none" onChange={(e) => patch({ username: e.target.value.split("@")[0] })} />
                </div>
                <div>
                  <Label htmlFor="ed-phone" optional>
                    เบอร์โทร
                  </Label>
                  <Input id="ed-phone" type="tel" value={editor.phone} onChange={(e) => patch({ phone: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="ed-pass" optional={!!editor.id}>
                    {editor.id ? "ตั้งรหัสผ่านใหม่" : "รหัสผ่านเริ่มต้น"}
                  </Label>
                  <Input id="ed-pass" type="password" autoComplete="new-password" value={editor.password} onChange={(e) => patch({ password: e.target.value })} placeholder={editor.id ? "เว้นว่างถ้าไม่เปลี่ยน" : "อย่างน้อย 8 ตัวอักษร"} />
                </div>
                <fieldset>
                  <legend className="mb-1.5 text-sm font-semibold">ความถนัด</legend>
                  <div className="overflow-hidden rounded-[14px] bg-white">
                    {catalog.categories.map((c) => {
                      const on = editor.skills.includes(c.id);
                      return (
                        <label key={c.id} className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-line px-3.5 last:border-0">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => patch({ skills: on ? editor.skills.filter((s) => s !== c.id) : [...editor.skills, c.id] })}
                            className="h-5 w-5 accent-[#5B2C83]"
                          />
                          <CategoryIcon name={c.icon} size="sm" />
                          <span className="text-[15px]">{c.name_th}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <Switch label="เปิดใช้งานบัญชี" checked={editor.is_active} onChange={(v) => patch({ is_active: v })} />
              </>
            ) : (
              <>
                {editor.kind === "building" ? (
                  <div>
                    <Label htmlFor="ed-campus">วิทยาเขต</Label>
                    <select id="ed-campus" value={editor.campus_id} onChange={(e) => patch({ campus_id: Number(e.target.value) })} className="min-h-12 w-full rounded-[12px] bg-white px-3 text-[16px] outline-none focus:ring-2 focus:ring-brand">
                      {catalog.campuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_th}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {editor.kind === "building" ? (
                  <div>
                    <Label htmlFor="ed-faculty" optional>
                      คณะหรือหน่วยงาน
                    </Label>
                    <Input
                      id="ed-faculty"
                      list="faculty-options"
                      value={editor.faculty_th}
                      onChange={(e) => patch({ faculty_th: e.target.value })}
                      placeholder="เช่น คณะวิศวกรรมศาสตร์"
                      aria-describedby="ed-faculty-hint"
                    />
                    <datalist id="faculty-options">
                      {allFaculties.map((f) => (
                        <option key={f} value={f} />
                      ))}
                    </datalist>
                    <p id="ed-faculty-hint" className="mt-1 text-[13px] text-muted">
                      ผู้แจ้งเลือกคณะก่อนแล้วจึงเห็นอาคาร ถ้าเว้นว่าง อาคารจะอยู่ในกลุ่ม “อื่น ๆ”
                    </p>
                  </div>
                ) : null}
                {editor.kind === "room" ? (
                  <div>
                    <Label htmlFor="ed-floor">ชั้น</Label>
                    <Input id="ed-floor" type="number" inputMode="numeric" value={editor.floor} onChange={(e) => patch({ floor: e.target.value })} aria-describedby="ed-floor-hint" />
                    <p id="ed-floor-hint" className="mt-1 text-[13px] text-muted">ใส่ 0 สำหรับชั้น G และ -1 สำหรับชั้นใต้ดิน B1</p>
                  </div>
                ) : null}
                <div>
                  <Label htmlFor="ed-name">ชื่อ{TITLES[editor.kind]}</Label>
                  <Input
                    id="ed-name"
                    value={editor.name_th}
                    onChange={(e) => patch({ name_th: e.target.value })}
                    placeholder={editor.kind === "room" ? "เช่น ห้อง 301" : editor.kind === "building" ? "เช่น อาคาร CAMT" : ""}
                    autoFocus
                  />
                </div>
                {editor.kind === "category" ? (
                  <>
                    <fieldset>
                      <legend className="mb-1.5 text-sm font-semibold">ไอคอน</legend>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.keys(CATEGORY_ICONS).map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => patch({ icon })}
                            aria-pressed={editor.icon === icon}
                            aria-label={icon}
                            className={cn("flex h-12 items-center justify-center rounded-[12px] bg-white", editor.icon === icon && "ring-2 ring-brand")}
                          >
                            <CategoryIcon name={icon} size="sm" />
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <Switch label="ให้ผู้แจ้งเลือกประเภทนี้ได้" checked={editor.is_active} onChange={(v) => patch({ is_active: v })} />
                  </>
                ) : null}
              </>
            )}
            <FieldError>{error}</FieldError>
          </form>
        ) : null}
      </Sheet>
    </div>
  );
}
