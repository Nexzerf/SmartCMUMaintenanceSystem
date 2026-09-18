/**
 * Campuses, buildings and rooms of Chiang Mai University used by the app.
 *
 * Sources: room lists supplied by the project team; SOCMAP 2026 (Faculty of Social Sciences student
 * organization), ENTANEER MAP (Faculty of Engineering) and the Faculty of Nursing map; checked against the CMU campus map
 * (Google My Maps "Chiang Mai University Buildings") for building codes. Where the map's code differs
 * from the supplied list (e.g. Education = EB1–EB4, Economics = ECB1–ECB2, Law = LB1), the building uses
 * the map code and the room names are kept exactly as supplied.
 *
 * Room floor: coded rooms follow CMU's convention — for a 4-digit number the 2nd digit is the floor
 * (RB5201 → floor 2, HB7801 → floor 8), for a 3-digit number the 1st digit is (CE201 → floor 2).
 * Named rooms without a code use the floor given in the list, otherwise floor 1.
 *
 * Buildings from the map without a room list (library, dormitories, services) get generic areas
 * instead of invented room numbers; reporters add the exact spot in "จุดสังเกตเพิ่มเติม".
 *
 * Apply to a database: `npm run db:sync-locations` (safe to re-run). Seeding uses the same data.
 */

export type RoomDef = string | { name: string; floor: number };
export type BuildingDef = { name: string; rooms: RoomDef[] };
export type CampusDef = { name: string; buildings: BuildingDef[] };

/** "RB3101".."RB3102" style helpers */
function seq(prefix: string, from: number, to: number): string[] {
  const out: string[] = [];
  for (let n = from; n <= to; n++) out.push(prefix + n);
  return out;
}
function named(base: string, from: number, to: number, floor = 1): RoomDef[] {
  const out: RoomDef[] = [];
  for (let n = from; n <= to; n++) out.push({ name: `${base} ${n}`, floor });
  return out;
}
function onFloor(floor: number, ...names: string[]): RoomDef[] {
  return names.map((name) => ({ name, floor }));
}

const GENERIC_AREAS: RoomDef[] = onFloor(1, "โถงและพื้นที่ส่วนกลาง", "ห้องน้ำ", "ภายนอกอาคาร");
const DORM_AREAS: RoomDef[] = onFloor(1, "ห้องพัก (ระบุชั้นและเลขห้องในจุดสังเกต)", "ห้องน้ำรวม", "โถงและพื้นที่ส่วนกลาง", "ภายนอกอาคาร");
const OUTDOOR_AREAS: RoomDef[] = onFloor(1, "พื้นที่ลานและทางเดิน", "ไฟส่องสว่าง", "ม้านั่งและสิ่งอำนวยความสะดวก");

export const LOCATIONS: CampusDef[] = [
  {
    name: "วิทยาเขตสวนสัก",
    buildings: [
      // 1. Central lecture buildings
      { name: "RB1 อาคารเรียนรวม 1 (ทรงกลม)", rooms: ["RB1101", "RB1102"] },
      { name: "RB2 อาคารเรียนรวม 2", rooms: ["RB2101", "RB2102", "RB2201", "RB2202", "RB2203"] },
      { name: "RB3 อาคารเรียนรวม 3", rooms: ["RB3101", "RB3102", "RB3201", "RB3202", "RB3301", "RB3302", "RB3401", "RB3402"] },
      {
        name: "RB5 อาคารเรียนรวม 5",
        rooms: [...seq("RB", 5101, 5103), ...seq("RB", 5201, 5205), ...seq("RB", 5301, 5305), ...seq("RB", 5401, 5404)],
      },

      // 2. Humanities and social sciences
      { name: "HB1 คณะมนุษยศาสตร์", rooms: ["HB1101", "HB1102", "HB1201", "HB1202", "HB1203"] },
      { name: "HB2 คณะมนุษยศาสตร์", rooms: ["HB2101", "HB2102", "HB2201", "HB2202", "HB2301"] },
      { name: "HB3 คณะมนุษยศาสตร์", rooms: ["HB3101", "HB3102", "HB3201", "HB3202"] },
      { name: "HB5 คณะมนุษยศาสตร์ (ห้องบรรยายรวม)", rooms: ["HB5100", "HB5200"] },
      {
        name: "HB7 คณะมนุษยศาสตร์ (8 ชั้น)",
        rooms: [
          ...onFloor(1, "โถงและสำนักงาน"),
          "HB7100",
          ...seq("HB", 7201, 7205),
          ...seq("HB", 7301, 7305),
          ...seq("HB", 7401, 7405),
          ...seq("HB", 7501, 7505),
          ...seq("HB", 7601, 7605),
          ...seq("HB", 7701, 7705),
          "HB7801",
          "HB7802",
        ],
      },
      {
        name: "BAB1 คณะบริหารธุรกิจ",
        rooms: ["BAB1101", "BAB1102", ...onFloor(1, "ห้องประชุม"), "BAB1201", "BAB1202", "BAB1203", "BAB1301", "BAB1302", "BAB1321", "BAB1322", "BAB1323"],
      },
      { name: "BAB2 คณะบริหารธุรกิจ", rooms: ["BAB2101", "BAB2102", "BAB2201", "BAB2202", "BAB2203", "BAB2301", "BAB2302"] },
      // Faculty of Social Sciences: SOCMAP 2026 by the faculty student organization.
      // Building numbers 1–4 match the room codes SB1xxx–SB4xxx.
      {
        name: "SB1 คณะสังคมศาสตร์ อาคาร 1 ภูมิศาสตร์ (ฝั่งหน้า)",
        rooms: [
          "SB1111", "SB1114", "SB1115", "SB1122", "SB1201", "SB1202", "SB1301",
          ...onFloor(1, "สำนักงานคณะสังคมศาสตร์", "ห้องคณบดีคณะสังคมศาสตร์", "ห้องประชุม ธนี พหลโยธิน", "งานบริหารงานวิจัย บริการวิชาการ และวิเทศสัมพันธ์",
            "งานบริการการศึกษาและพัฒนาคุณภาพนักศึกษา", "งานนโยบายและแผนประกันคุณภาพการศึกษา", "งานบริหารทั่วไป", "งานการเงิน การคลัง และพัสดุ"),
          ...onFloor(2, "สำนักงานภาควิชาภูมิศาสตร์", "ห้องพักคณาจารย์ภูมิศาสตร์ ชั้น 2"),
          ...onFloor(3, "ห้องพักคณาจารย์ภูมิศาสตร์ ชั้น 3", "ห้องประชุมภาควิชาภูมิศาสตร์"),
        ],
      },
      {
        name: "SB1 คณะสังคมศาสตร์ อาคาร 1 ภูมิศาสตร์ (ปีกตะวันออก)",
        rooms: [
          ...onFloor(1, "ห้องสมุดคณะสังคมศาสตร์"),
          ...onFloor(2, "ห้องเรียนนักศึกษาปริญญาโท สาขาวิชาภูมิศาสตร์", "ห้องสมุดแผนที่"),
          ...onFloor(3, "ศูนย์ภูมิภาคเทคโนโลยีอวกาศและภูมิสารสนเทศภาคเหนือ", "ห้องเรียนปฏิบัติการภาควิชาภูมิศาสตร์"),
        ],
      },
      {
        name: "SB2 คณะสังคมศาสตร์ อาคาร 2 ภาควิชาสังคมศาสตร์กับการพัฒนา",
        rooms: [
          "SB2101", "SB2102", "SB2201", "SB2202", "SB2301",
          ...onFloor(1, "สำนักงานภาควิชาสังคมศาสตร์กับการพัฒนา"),
          ...onFloor(2, "ห้องพักคณาจารย์ ชั้น 2"),
          ...onFloor(3, "ห้องพักคณาจารย์ ชั้น 3"),
        ],
      },
      {
        name: "SB3 คณะสังคมศาสตร์ อาคาร 3 ภาควิชาสังคมวิทยาและมานุษยวิทยา",
        rooms: [
          ...onFloor(1, "ร้านถ่ายเอกสาร", "ห้อง Co-Working Space"),
          ...onFloor(2, "ห้องประชุมใหญ่คณะสังคมศาสตร์", "ห้องโครงการหลักสูตรนานาชาติ ระดับปริญญาเอก", "ห้องประชุมสาขาวิชา ปริญญาเอก"),
          ...seq("SB", 3201, 3211),
          ...onFloor(3, "ห้องภาควิชาสังคมวิทยาและมานุษยวิทยา", "สำนักงานสาขาสังคมวิทยาและมานุษยวิทยา", "ห้องพักคณาจารย์สาขาสังคมวิทยาและมานุษยวิทยา ชั้น 3", "ห้องประชุมบัณฑิต"),
          ...onFloor(4, "ห้องประชุมชั้น 4", "ศูนย์ข้อมูลภาควิชาสังคมวิทยาและมานุษยวิทยา", "ห้องพักนักศึกษาปริญญาโทสังคมวิทยา", "ห้องพักคณาจารย์สาขาสังคมวิทยา ชั้น 4"),
        ],
      },
      {
        name: "SB4 คณะสังคมศาสตร์ อาคาร 4 อาคารเรียนรวม",
        rooms: [...seq("SB", 4105, 4107), ...seq("SB", 4201, 4204), ...seq("SB", 4301, 4303), ...seq("SB", 4401, 4403), ...seq("SB", 4408, 4411)],
      },
      {
        name: "คณะสังคมศาสตร์ อาคารปฏิบัติการ (อาคาร 04107)",
        rooms: [
          ...onFloor(1, "ห้องประชุมย่อย Subaltern Room (ชั้นใต้ดิน)", "สโมสรนักศึกษาคณะสังคมศาสตร์"),
          ...onFloor(2, "ห้องเรียน RCSD", "ศูนย์จีนศึกษา", "ห้องพักคณาจารย์", "ห้องปฏิบัติการคดีอาญา", "ห้องทดลองปฏิบัติการทางการพิสูจน์หลักฐาน", "ห้องโปลีกราฟ"),
          ...onFloor(3, "สมาคมนักศึกษาเก่าคณะสังคมศาสตร์", "ห้อง ITSC Corner", "หน่วยเทคโนโลยีสารสนเทศ", "ห้องประชุมศูนย์วิจัย"),
          ...onFloor(4, "ห้องประชุมคณะสังคมศาสตร์ (04-003)", "ศูนย์ศึกษาชาติพันธุ์และการพัฒนา", "ศูนย์ภูมิอากาศเพื่อการศึกษาด้านภูมิอากาศและสิ่งแวดล้อม (RCCES)"),
        ],
      },
      { name: "คณะสังคมศาสตร์ International Building", rooms: GENERIC_AREAS },
      { name: "คณะสังคมศาสตร์ โรงอาหาร (SOC Cafeteria)", rooms: GENERIC_AREAS },
      { name: "ECB1 คณะเศรษฐศาสตร์", rooms: ["EC1101", "EC1102", "EC1201", "EC1202", "EC1301"] },
      { name: "ECB2 คณะเศรษฐศาสตร์", rooms: ["EC2101", "EC2102", "EC2201", ...onFloor(1, "ห้องศาลาเศรษฐศาสตร์")] },
      { name: "LB1 คณะนิติศาสตร์", rooms: ["LAW1101", "LAW1201", "LAW1202", "LAW2101", "LAW2201", ...onFloor(1, "ห้อง Moot Court")] },
      { name: "PSB1 คณะรัฐศาสตร์และรัฐประศาสนศาสตร์", rooms: ["POL1101", "POL1201", "POL2101", "POL2201", "POL3101", "POL3201"] },
      { name: "EB1 คณะศึกษาศาสตร์", rooms: ["EDU1101", "EDU1201"] },
      { name: "EB2 คณะศึกษาศาสตร์", rooms: ["EDU2101", "EDU2201"] },
      { name: "EB3 คณะศึกษาศาสตร์", rooms: ["EDU3101", "EDU3201"] },
      { name: "EB4 คณะศึกษาศาสตร์", rooms: ["EDU4101"] },
      { name: "MCB2 คณะการสื่อสารมวลชน", rooms: ["MC1101", "MC1102", "MC1201", "MC2101", ...onFloor(1, "ห้องตัดต่อ", "Studio Broadcast")] },

      // 3. Science and technology
      { name: "SCB1 คณะวิทยาศาสตร์ (อาคาร 30 ปี)", rooms: ["SCB1100", "SCB1200", "SCB1300"] },
      { name: "SCB2 คณะวิทยาศาสตร์ (อาคาร 40 ปี)", rooms: ["SCB2100", "SCB2200", "SCB2300", "SCB2400"] },
      { name: "MB2 อาคารคณิตศาสตร์", rooms: ["MB2101", "MB2105", "MB2201", "MB2205", "MB2301"] },
      { name: "STB อาคารสถิติ", rooms: ["STAT101", "STAT102", "STAT201", ...onFloor(1, "STAT Lab")] },
      { name: "PB1 อาคารฟิสิกส์", rooms: ["PHYS101", "PHYS102", "PHYS201", "PHYS202", ...named("Lab ฟิสิกส์", 1, 2)] },
      { name: "CB1 อาคารเคมี", rooms: ["CHEM101", "CHEM102", "CHEM201", "CHEM202", ...onFloor(1, "Lab เคมีพื้นฐาน")] },
      { name: "BB1 อาคารชีววิทยา", rooms: ["BIO101", "BIO102", "BIO201", "BIO202", "BIO301", ...onFloor(1, "Lab จุลชีววิทยา")] },
      { name: "CSB อาคารวิทยาการคอมพิวเตอร์", rooms: ["CSB101", "CSB102", "CSB201", ...named("CS Lab", 1, 3)] },
      { name: "ENG คณะวิศวกรรมศาสตร์", rooms: ["ENG1101", "ENG1201"] },
      { name: "ENG2 คณะวิศวกรรมศาสตร์", rooms: ["ENG2101", "ENG2102", "ENG2201"] },
      { name: "ENG3 คณะวิศวกรรมศาสตร์", rooms: ["ENG3101", "ENG3201"] },
      // Faculty of Engineering: ENTANEER MAP (numbers in the comments are the map numbers).
      {
        name: "ENG4 คณะวิศวกรรมศาสตร์ อาคารเรียน 4 ชั้น", // 10
        rooms: [
          "ENG4101", "ENG4102", "ENG4201", "ENG4202", "ENG4301", "ENG4302",
          ...onFloor(1, "Robotics & AI Engineering ชั้น 1", "Integrated Engineering ชั้น 1", "สโมสรนักศึกษาคณะวิศวกรรมศาสตร์ (Entaneer Student Club)"),
          ...onFloor(2, "Robotics & AI Engineering ชั้น 2", "Integrated Engineering ชั้น 2"),
        ],
      },
      {
        name: "คณะวิศวกรรมศาสตร์ อาคาร 30 ปี", // 2; Computer Engineering on floors 4–5
        rooms: [
          ...onFloor(1, "AU Choix", "Puenplay Cafe", "Easy Corner", "โถงและพื้นที่ส่วนกลาง", "ห้องน้ำ"),
          ...onFloor(2, "Chiang Mai International Engineering School (CM-IES)", "ห้อง 204 ITSC"),
          ...onFloor(4, "ภาควิชาวิศวกรรมคอมพิวเตอร์ ชั้น 4"),
          ...named("CPE Lab", 1, 4, 4),
          ...onFloor(5, "ภาควิชาวิศวกรรมคอมพิวเตอร์ ชั้น 5"),
          ...onFloor(6, "สำนักงานคณบดี คณะวิศวกรรมศาสตร์", "สำนักงานคณะวิศวกรรมศาสตร์"),
        ],
      },
      {
        name: "คณะวิศวกรรมศาสตร์ อาคารเรียน 3 ชั้น", // 9
        rooms: [
          ...onFloor(1, "งานบริการการศึกษา", "Roasto @Entaneer"),
          ...onFloor(2, "หน่วยพัฒนาคุณภาพนักศึกษา"),
          ...onFloor(3, "ห้องบรรยายใหญ่ (Main Lecture Hall)"),
        ],
      },
      { name: "ME ภาควิชาวิศวกรรมเครื่องกล", rooms: ["ME101", "ME201", "ME301", ...onFloor(1, "ME Workshop")] }, // 1
      { name: "CE ภาควิชาวิศวกรรมโยธา", rooms: ["CE101", "CE201", "CE202", ...onFloor(1, "ห้องปฏิบัติการวิศวกรรมชลศาสตร์ (Hydraulic Lab)")] }, // 4
      { name: "EE ภาควิชาวิศวกรรมไฟฟ้า", rooms: ["EE101", "EE201", "EE202", "EE301"] }, // 5
      { name: "IE ภาควิชาวิศวกรรมอุตสาหการ", rooms: ["IE101", "IE201", "IE301"] }, // 7
      { name: "ภาควิชาวิศวกรรมเหมืองแร่และปิโตรเลียม", rooms: GENERIC_AREAS }, // 6
      { name: "ภาควิชาวิศวกรรมสิ่งแวดล้อม", rooms: GENERIC_AREAS }, // 8
      { name: "คณะวิศวกรรมศาสตร์ อาคาร RTT", rooms: GENERIC_AREAS }, // 3
      { name: "คณะวิศวกรรมศาสตร์ อาคารปฏิบัติการวิศวกรรมไฟฟ้า", rooms: GENERIC_AREAS },
      { name: "คณะวิศวกรรมศาสตร์ อาคาร Workshop", rooms: GENERIC_AREAS },
      { name: "คณะวิศวกรรมศาสตร์ อาคารร่วมใจวิศวกรรม", rooms: [...onFloor(1, "Entaneer Academy ชั้น 1"), ...onFloor(2, "Entaneer Academy ชั้น 2")] }, // 17
      { name: "คณะวิศวกรรมศาสตร์ ห้องสมุด (Engineering Library)", rooms: GENERIC_AREAS }, // 13
      { name: "คณะวิศวกรรมศาสตร์ โรงอาหาร (Engineering Canteen)", rooms: GENERIC_AREAS }, // 14
      { name: "คณะวิศวกรรมศาสตร์ Entaneer Space", rooms: GENERIC_AREAS }, // 15
      { name: "คณะวิศวกรรมศาสตร์ Learning Court", rooms: GENERIC_AREAS }, // 16
      { name: "คณะวิศวกรรมศาสตร์ E-SIE Hub", rooms: GENERIC_AREAS }, // 18
      { name: "คณะวิศวกรรมศาสตร์ อาคาร Chotmanotum (Mini Learning Factory)", rooms: GENERIC_AREAS }, // 20
      { name: "คณะวิศวกรรมศาสตร์ Home of Alumni", rooms: onFloor(1, "สมาคมศิษย์เก่า (Alumni Association)", "Gear Cafe", "ห้องน้ำ", "ภายนอกอาคาร") }, // 21
      { name: "คณะวิศวกรรมศาสตร์ อาคาร Ritta", rooms: GENERIC_AREAS }, // 22
      { name: "คณะวิศวกรรมศาสตร์ ลานพระนารายณ์ (Lord Vishnu Courtyard)", rooms: OUTDOOR_AREAS }, // 11
      { name: "คณะวิศวกรรมศาสตร์ Gear Playground", rooms: OUTDOOR_AREAS }, // 12
      { name: "คณะวิศวกรรมศาสตร์ Cover Way (ทางเดินมีหลังคา)", rooms: OUTDOOR_AREAS }, // 19
      {
        name: "CAMT วิทยาลัยศิลปะ สื่อ และเทคโนโลยี",
        rooms: [
          "CAMT101", "CAMT102", ...onFloor(1, "CAMT Auditorium"),
          "CAMT201", "CAMT202", "CAMT203", "CAMT204",
          "CAMT301", "CAMT302", ...onFloor(3, "Lab Game", "Lab Animation"),
          "CAMT401", "CAMT402", ...onFloor(4, "Studio บันทึกเสียง/กราฟิก"),
        ],
      },
      { name: "Architecture คณะสถาปัตยกรรมศาสตร์", rooms: ["ARCH101", "ARCH102", "ARCH201", ...named("Design Studio", 1, 5), ...onFloor(1, "Wood & Model Workshop")] },

      // TLIC building: studios and training on floor 1, Active Learning classrooms ILC-A/B/C on floors 2–3
      // (ILC-A ~60–80 seats, ILC-B ~40–50, ILC-C ~30–40).
      {
        name: "TLIC ศูนย์นวัตกรรมการเรียนการสอน",
        rooms: [
          ...onFloor(1, "One-Button Studio / Lightboard Studio", "Micro Studio 1", "Micro Studio 2", "Main Production Studio", "Smart Training Room", "Open Co-Working Space"),
          ...seq("ILC-A", 201, 208),
          ...seq("ILC-B", 201, 208),
          ...seq("ILC-C", 201, 208),
          ...seq("ILC-A", 301, 308),
          ...seq("ILC-B", 301, 308),
          ...seq("ILC-C", 301, 308),
        ],
      },

      // Other real buildings from the campus map (no room list: generic areas)
      { name: "สำนักหอสมุด (Main Library)", rooms: GENERIC_AREAS },
      { name: "ITSC สำนักบริการเทคโนโลยีสารสนเทศ", rooms: GENERIC_AREAS },
      { name: "สถาบันภาษา (Language Institute)", rooms: GENERIC_AREAS },
      { name: "สำนักทะเบียนและประมวลผล", rooms: GENERIC_AREAS },
      { name: "ศูนย์อาหาร (Food Center)", rooms: GENERIC_AREAS },
      { name: "ศูนย์บริการสุขภาพ (Health Center)", rooms: GENERIC_AREAS },
      { name: "ศูนย์กีฬา (Sports Center)", rooms: GENERIC_AREAS },
      { name: "โรงยิม (Gymnasium)", rooms: GENERIC_AREAS },
      { name: "สระว่ายน้ำ (Swimming Pool)", rooms: GENERIC_AREAS },
      ...Array.from({ length: 7 }, (_, i) => ({ name: `หอพักนักศึกษาชาย ${i + 1}`, rooms: DORM_AREAS })),
      ...Array.from({ length: 13 }, (_, i) => ({ name: `หอพักนักศึกษาหญิง ${i + 1}`, rooms: DORM_AREAS })),
    ],
  },
  {
    name: "วิทยาเขตสวนดอก",
    buildings: [
      { name: "อาคารเรียนรวม คณะแพทยศาสตร์", rooms: ["MED201", "MED202", "MED301", "MED302", "MED401", "MED402"] },
      { name: "อาคารสุจิณฺโณ คณะแพทยศาสตร์", rooms: named("ห้องประชุมบรรยาย", 1, 2) },
      { name: "อาคารปรีคลินิก คณะแพทยศาสตร์", rooms: [...named("Gross Anatomy (อาจารย์ใหญ่)", 1, 3), ...onFloor(1, "Lab พยาธิวิทยา")] },
      { name: "คณะทันตแพทยศาสตร์", rooms: ["DENT101", "DENT102", "DENT201", "DENT202", ...onFloor(1, "Pre-clinic Simulation Lab")] },
      { name: "PHARM1 คณะเภสัชศาสตร์ อาคาร 1", rooms: ["PHARM1101", "PHARM1201", ...onFloor(1, "Lab เภสัชเวท/เภสัชกรรม")] },
      { name: "PHARM2 คณะเภสัชศาสตร์ อาคาร 2", rooms: ["PHARM2101", "PHARM2202"] },
      { name: "NUR1 คณะพยาบาลศาสตร์ อาคาร 1", rooms: ["NUR1101", "NUR1201", ...onFloor(1, "Simulation Ward")] },
      { name: "NUR2 คณะพยาบาลศาสตร์ อาคาร 2", rooms: ["NUR2101", "NUR2201"] },
      { name: "NUR3 คณะพยาบาลศาสตร์ อาคาร 3", rooms: ["NUR3101"] },
      // Faculty of Nursing map: Building 4, NT Building, nursing dormitories and the faculty garage.
      { name: "NUR4 คณะพยาบาลศาสตร์ อาคาร 4", rooms: GENERIC_AREAS },
      { name: "คณะพยาบาลศาสตร์ อาคาร NT", rooms: GENERIC_AREAS },
      { name: "หอพักนักศึกษาพยาบาล 1 (DORM 1)", rooms: DORM_AREAS },
      { name: "หอพักพยาบาล 2 (DORM 2)", rooms: DORM_AREAS },
      { name: "หอพักพยาบาล 3 (DORM 3)", rooms: DORM_AREAS },
      { name: "หอพักพยาบาล 4 (DORM 4)", rooms: DORM_AREAS },
      { name: "หอพักพยาบาล 6 (DORM 6)", rooms: DORM_AREAS },
      { name: "อาคารจอดรถ คณะพยาบาลศาสตร์ (Faculty Garage Parking)", rooms: onFloor(1, "พื้นที่จอดรถ", "ห้องน้ำ", "ภายนอกอาคาร") },
      { name: "AMS คณะเทคนิคการแพทย์", rooms: ["AMS1101", "AMS1201", "AMS2101", "AMS2201", "AMS3101", ...named("AMS Lab", 1, 5)] },
      { name: "คณะสาธารณสุขศาสตร์", rooms: ["PH101", "PH102", "PH201", "PH202"] },
    ],
  },
  {
    name: "วิทยาเขตแม่เหียะ",
    buildings: [
      { name: "AGI1 คณะอุตสาหกรรมเกษตร", rooms: ["AGI1101", "AGI1102", "AGI1201", "AGI1202"] },
      { name: "AGI2 คณะอุตสาหกรรมเกษตร", rooms: ["AGI2101", "AGI2201"] },
      { name: "AGI3 คณะอุตสาหกรรมเกษตร", rooms: ["AGI3101", ...onFloor(1, "Pilot Plant Lab")] },
      { name: "VET คณะสัตวแพทยศาสตร์", rooms: ["VET1101", "VET1201", "VET2101", "VET2201", "VET3101", ...onFloor(1, "Vet Anatomy Lab")] },
      { name: "ศูนย์วิจัยและฝึกอบรมแม่เหียะ", rooms: named("ห้องฝึกอบรมแปลงวิจัย", 1, 2) },
    ],
  },
];

/**
 * Earlier demo buildings → the real building that replaces them. The sync renames or merges these so
 * existing requests keep a sensible location; their rooms are matched by floor and number.
 */
export const LEGACY_BUILDINGS: Record<string, string> = {
  "อาคาร CAMT": "CAMT วิทยาลัยศิลปะ สื่อ และเทคโนโลยี",
  "อาคารเรียนรวม": "RB5 อาคารเรียนรวม 5",
  "สำนักหอสมุด": "สำนักหอสมุด (Main Library)",
  "หอพักนักศึกษา 5": "หอพักนักศึกษาชาย 5",
  "อาคารคณะวิศวกรรมศาสตร์ 30 ปี": "คณะวิศวกรรมศาสตร์ อาคาร 30 ปี",
  // Renamed with the SOCMAP 2026 and ENTANEER MAP data.
  "SB1 คณะสังคมศาสตร์": "SB1 คณะสังคมศาสตร์ อาคาร 1 ภูมิศาสตร์ (ฝั่งหน้า)",
  "SB2 คณะสังคมศาสตร์": "SB2 คณะสังคมศาสตร์ อาคาร 2 ภาควิชาสังคมศาสตร์กับการพัฒนา",
  "ENG4 คณะวิศวกรรมศาสตร์ (4 ชั้น)": "ENG4 คณะวิศวกรรมศาสตร์ อาคารเรียน 4 ชั้น",
  // Computer Engineering is on floors 4–5 of the 30th Anniversary Building, not a building of its own.
  "CPE ภาควิชาวิศวกรรมคอมพิวเตอร์": "คณะวิศวกรรมศาสตร์ อาคาร 30 ปี",
  "อาคารคณะพยาบาลศาสตร์": "NUR1 คณะพยาบาลศาสตร์ อาคาร 1",
  "หอพักนักศึกษาแพทย์": "อาคารเรียนรวม คณะแพทยศาสตร์",
  "อาคารศูนย์ประชุม": "AGI1 คณะอุตสาหกรรมเกษตร",
  "อาคารปฏิบัติการวิจัย": "ศูนย์วิจัยและฝึกอบรมแม่เหียะ",
  // ILC-A/B/C are zones inside the TLIC building, not separate buildings.
  "ILC-A ห้องเรียน Active Learning (60–80 ที่นั่ง)": "TLIC ศูนย์นวัตกรรมการเรียนการสอน",
  "ILC-B ห้องเรียน Active Learning (40–50 ที่นั่ง)": "TLIC ศูนย์นวัตกรรมการเรียนการสอน",
  "ILC-C ห้องเรียน Active Learning (30–40 ที่นั่ง)": "TLIC ศูนย์นวัตกรรมการเรียนการสอน",
};

export function roomName(r: RoomDef): string {
  return typeof r === "string" ? r : r.name;
}

/** Floor of a room: explicit, or from CMU's numbering convention, or 1. */
export function roomFloor(r: RoomDef): number {
  if (typeof r !== "string") return r.floor;
  const m = /^[A-Za-z-]+(\d{3,4})$/.exec(r);
  if (!m) return 1;
  const digits = m[1];
  return Number(digits.length === 4 ? digits[1] : digits[0]) || 1;
}
