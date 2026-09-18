/** Grouping of buildings by faculty or unit, shared by the request form and the admin screens. */

export const OTHER_FACULTY = "อื่น ๆ";
// Shared facilities go after the faculties, in this order.
const LAST = ["อาคารเรียนรวม (ส่วนกลาง)", "หอพักนักศึกษา", "หน่วยงานส่วนกลางและสิ่งอำนวยความสะดวก", OTHER_FACULTY];

export function facultyName(b: { faculty_th: string | null }) {
  return b.faculty_th?.trim() || OTHER_FACULTY;
}

/** Faculties of the given buildings with their building counts, faculties first (Thai order), shared facilities last. */
export function facultiesOf<B extends { faculty_th: string | null }>(buildings: B[]) {
  const counts = new Map<string, number>();
  for (const b of buildings) counts.set(facultyName(b), (counts.get(facultyName(b)) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      const ra = LAST.indexOf(a.name);
      const rb = LAST.indexOf(b.name);
      if (ra !== rb) return (ra === -1 ? -1 : ra) - (rb === -1 ? -1 : rb);
      return a.name.localeCompare(b.name, "th");
    });
}
