# Dashboard Requirements Specification (SRS)

**Project:** การวิเคราะห์ข่าวปลอมและภัยหลอกลวงออนไลน์ในยุค AI: เปรียบเทียบสถานการณ์ประเทศไทยและต่างประเทศ ปี 2020–2022  
**Version:** 1.0 | **Status:** สำหรับพัฒนาและตรวจรับงาน | **Related:** `BRD.md`, `HANDOFF.md`  
**Language:** Thai UI; English technical field names permitted in tooltips/data dictionary

## 1. เป้าหมายและขอบเขต

สร้าง Dashboard **3 แท็บ** ที่ตอบคำถามต่างมิติจาก 3 แหล่ง: (1) AI Incident Database, (2) EUvsDisinfo, (3) Thai AFNC โดยให้ผู้ใช้สำรวจแนวโน้ม ประเภท และหลักฐานที่มาของรายการได้จริงในช่วง **1 มกราคม 2020 – 31 ธันวาคม 2022** เท่านั้น

**คำถามภาพรวม:** ข่าวปลอมและภัยหลอกลวงออนไลน์ในยุค AI มีลักษณะและแนวโน้มอย่างไรในข้อมูลที่มีอยู่ และ 3 มุมมองเผยให้เห็นอะไรคล้ายหรือต่างกัน?

**ขอบเขตที่ไม่รวม:** การพยากรณ์, จำนวนผู้ตกเป็นเหยื่อ/เงินเสียหาย, การเชื่อมรายเหตุการณ์ระหว่างฐานข้อมูล, การสรุปว่า AI เป็นสาเหตุของข่าวปลอมไทย, การตีความว่าชุดข้อมูลคือภาพแทนโลกทั้งหมด

## 2. ผู้ใช้เป้าหมาย

| ผู้ใช้ | สิ่งที่ต้องทำได้ |
|---|---|
| นักวิจัย/นักพัฒนา AI | ตรวจสอบประเภทและช่วงเวลาของ AI incidents ที่เข้าเกณฑ์ |
| นักข่าว/ผู้ตรวจสอบข้อเท็จจริง | สำรวจหัวข้อ คำสำคัญ ภาษา และโดเมน พร้อมเปิดหลักฐานอ้างอิง |
| ประชาชน/หน่วยงานสื่อสาร | สำรวจผลตรวจสอบ AFNC และเทียบหมวดการเงิน สุขภาพ นโยบายรัฐ |
| อาจารย์/ผู้ประเมิน | ทดสอบตัวกรอง ย้อนกลับไปหาแหล่งที่มา และตรวจสอบหน่วยนับได้ |

## 3. Data requirements และ Data contract

| ID | Priority | Requirement / Rule |
|---|---|---|
| DATA-01 | Must | ใช้เฉพาะไฟล์คลีน 2020–2022; ไม่แก้ raw source และรักษา `cleaning_report.json` |
| DATA-02 | Must | `ai_incidents_clean.csv`: 1 แถวต่อ `incident_id` และนับแบบ distinct; baseline 59 |
| DATA-03 | Must | `euvsdisinfo_debunks_clean.csv`: 1 แถวต่อ `debunk_id`, baseline 4,820; ใช้ date ของ debunk สำหรับแนวโน้มเรื่องตรวจสอบ |
| DATA-04 | Must | `euvsdisinfo_articles_clean.csv`: 1 แถวต่อความสัมพันธ์ `(debunk_id,article_id,article_class)`, baseline 12,186; ห้ามนับเป็น 12,186 debunks |
| DATA-05 | Must | `thai_afnc_verdicts_clean.csv`: 1 แถวต่อ `post_id` ประเภท Verdict, baseline 4,627; ใช้ verdict Fake/Distorted/True |
| DATA-06 | Must | แสดงวัน/เดือน/ปีในมาตรฐานเดียวกัน; ปีที่ใช้ได้ 2020, 2021, 2022; แกนเวลารายเดือน 36 เดือนและคงช่องเดือนที่ไม่มีรายการเป็น 0 ตามนิยามชุดข้อมูล |
| DATA-07 | Must | แหล่งต่างกันต้องรักษา grain และ denominator ของตนเอง; ห้ามบวกตัวเลข AI + EU + Thai เข้าด้วยกัน |
| DATA-08 | Must | EU keyword ต้อง tokenize/normalize และทดสอบ sample ก่อนใช้ Top 10; เก็บคำต้นฉบับอ้างอิงได้ |
| DATA-09 | Must | หาก EU topic mapping ยังไม่ผ่านการยืนยัน ให้เปลี่ยนกราฟ E3 เป็น article classes by year พร้อมบอกหน่วย “ความสัมพันธ์บทความ” อย่างชัดเจน |
| DATA-10 | Must | หาก AI harmed-group mapping ยังไม่ผ่านการยืนยัน ไม่ให้เผยแพร่กราฟ A4 แบบเดาหมวด; ใช้ตารางรายละเอียด/ข้อความ “อยู่ระหว่างตรวจสอบการจัดกลุ่ม” แทน |
| DATA-11 | Must | ค่า null, ไม่ทราบภาษา/โดเมน/หมวดต้องไม่ถูกแสดงเป็นค่าจริงหรือโยนทิ้งโดยไม่เปิดเผย; ใช้ “ไม่ระบุ” เมื่อเหมาะสม |

ค่าตัวเลข baseline ใช้สำหรับ **ตรวจ reconciliation** เมื่อไม่กรอง ไม่ใช่ค่าที่ hard-code ใน KPI.

## 4. Global functional requirements

| ID | Priority | Acceptance behavior |
|---|---|---|
| FR-01 | Must | มี 3 แท็บ AI Risks / Global Disinformation / Thai Fake News พร้อมคำถามประจำแท็บและคำอธิบายหน่วยนับ |
| FR-02 | Must | ตัวกรอง Year เลือก All/2020/2021/2022 และ Month เลือกได้ตามช่วง; เมื่อเปลี่ยนแท็บ ค่าสองตัวกรองยังคงเดิม |
| FR-03 | Must | ตัวกรองเฉพาะแท็บ: AI risk, EU keyword/language/domain, Thai verdict/category; ไม่ส่ง category/keyword ไปกรองอีกชุดโดยอัตโนมัติ |
| FR-04 | Must | ทุกกราฟที่ระบุว่า clickable ต้อง click-to-cross-filter ภายในแท็บ: KPI + กราฟอื่น + ตารางรายละเอียดเปลี่ยนตาม selection |
| FR-05 | Must | คลิกหมวด/จุดที่เลือกอยู่ซ้ำเพื่อยกเลิก; แสดง selected state, filter chips, Clear tab filters และ Clear all filters |
| FR-06 | Must | ตัวกรองหลายมิติใช้ AND; ภายในมิติเดียวกันหากรองรับหลายค่าให้ระบุ OR; เริ่มต้นรองรับ single-select ต่อ chart ได้ |
| FR-07 | Must | KPI คำนวณใหม่จากรายการหลังการกรอง; เปลี่ยนช่วงปี/เดือน/กราฟแล้วตัวเลขต้องเปลี่ยนสอดคล้องกับตาราง |
| FR-08 | Must | ทุกกราฟมีชื่อ แกน หน่วย ช่วงเวลา แหล่งข้อมูล และ tooltip ที่ระบุ count กับมิติ; ห้ามใช้เปอร์เซ็นต์ที่ไม่ระบุตัวหาร |
| FR-09 | Must | ตารางรายละเอียดกรองตาม visual ได้, search/sort/pagination และ link ต้นทางที่เปิดได้; กรณี URL หายให้แสดง N/A |
| FR-10 | Must | กรณี no data แสดง “ไม่พบข้อมูลตามตัวกรอง” และวิธีล้าง; ไม่แสดง NaN, Infinity หรือข้อความชวนให้เข้าใจว่ามีข้อมูล |
| FR-11 | Must | มีส่วน Key Findings สรุปเชิงพรรณนา 3 มุมมอง โดยไม่สร้างตัวเลขยอดรวมข้ามฐานหรือคำอธิบายเชิงสาเหตุ |
| FR-12 | Should | ผู้ใช้ดาวน์โหลด CSV ของตารางหลังกรอง พร้อมชื่อแหล่งและช่วงข้อมูล |

## 5. Requirements แยกตามแท็บ

### Tab 1 — AI Risks

**คำถาม:** เหตุการณ์ AI ที่เกี่ยวข้องกับข้อมูลผิด/บิดเบือนและการหลอกลวงเปลี่ยนอย่างไร และประเภทใดโดดเด่น?

| ID | Type | Requirement / Measure |
|---|---|---|
| AI-K1 | KPI | จำนวน `incident_id` ไม่ซ้ำที่เข้าเกณฑ์ |
| AI-K2 | KPI | จำนวน incident ใน `topic_group` misinformation + disinformation_influence |
| AI-K3 | KPI | จำนวน incident ใน `topic_group` fraud_scams |
| AI-C1 | Line | distinct incidents ตาม `year_month`, แสดงช่วง 2020–2022 ที่เลือก |
| AI-C2 | Stacked column | distinct incidents แยก `year` × `topic_group` |
| AI-C3 | Horizontal bar | Ranking distinct incidents ตาม `risk_subdomain` |
| AI-C4 | Bar / fallback | กลุ่มผู้ได้รับผลกระทบ `harmed` เมื่อ mapping ผ่าน audit เท่านั้น; มิฉะนั้นแสดง details พร้อมสถานะ |
| AI-T1 | Detail table | incident ID, วัน/เดือน/ปี, ชื่อเรื่อง, risk subdomain, harmed (ถ้ามี), description, source link (ถ้ามี) |

**กฎสำคัญ:** เฉพาะ 3 risk subdomains ที่ระบุใน Data contract; subset 59 records มีเพียง 27/36 เดือนที่มีรายการ การไม่มีรายการไม่ใช่หลักฐานว่าไม่มีเหตุการณ์เกิดขึ้นจริง.

### Tab 2 — Global Disinformation (EUvsDisinfo)

**คำถาม:** เรื่องที่ EUvsDisinfo ตรวจสอบเปลี่ยนตามเวลาอย่างไร และคำสำคัญ ภาษา โดเมนใดปรากฏในข้อมูลที่เชื่อมโยง?

| ID | Type | Requirement / Measure |
|---|---|---|
| EU-K1 | KPI | distinct `debunk_id` หลังทุก filter ที่เกี่ยวข้อง |
| EU-K2 | KPI | article associations ที่ `article_class=disinformation`; ไม่เรียกว่า “ข่าวปลอมทั้งหมด” |
| EU-K3 | KPI | จำนวนภาษาที่แตกต่างกันใน article associations หลัง filter (นับเฉพาะค่าที่ระบุ) |
| EU-C1 | Line | distinct debunks ตาม `debunk_date` รายเดือน |
| EU-C2 | Horizontal bar | Top 10 normalized keywords ตาม distinct debunks ที่มี keyword นั้น |
| EU-C3 | Stacked column | verified topic group × year (distinct debunks); หากยังไม่มี verified mapping ใช้ `article_class` × year ที่ระดับ association และเปลี่ยนชื่อกราฟ/หน่วย |
| EU-C4 | Horizontal bar | Top 10 `article_language` นับ article associations |
| EU-C5 | Horizontal bar | Top 10 `article_domain` นับ article associations |
| EU-I1 | Insights | ข้อค้นพบ 3 ข้อที่สร้างจากข้อมูลหลังกรอง (เช่น keyword เด่น, เทรนด์, ภาษา/โดเมน) พร้อมตัวเลขและขอบเขต |
| EU-T1 | Detail table | debunk ID/date, keyword, article class, language, domain, URL/หลักฐาน |

**กฎสำคัญ:** เมื่อคลิกภาษา/โดเมน ให้คัด article associations ที่ match ก่อน แล้วนับ `debunk_id` ไม่ซ้ำเมื่อกลับมาคำนวณ KPI/line; 1 debunk อาจเชื่อมหลาย articles. การจัด `disinformation/trustworthy` เป็น **article class** ไม่ใช่ verdict ของทุก debunk.

### Tab 3 — Thai Fake News (AFNC)

**คำถาม:** ผลการตรวจสอบข่าวไทยเปลี่ยนอย่างไร หมวด Fake ไหนเด่น และการเงินแตกต่างจากสุขภาพ/นโยบายรัฐอย่างไร?

| ID | Type | Requirement / Measure |
|---|---|---|
| TH-K1 | KPI | จำนวน `post_id` ไม่ซ้ำที่มี verdict |
| TH-K2 | KPI | distinct posts ที่ `verdict_en=Fake` |
| TH-K3 | KPI | `(Fake + Distorted) / (Fake + Distorted + True) × 100` ในช่วงหลังกรอง; ถ้าตัวหาร 0 แสดง N/A |
| TH-C1 | Line | Fake posts รายเดือน (`post_id` distinct) |
| TH-C2 | Stacked column | verdict Fake/Distorted/True ตามปี; toggle **Count ↔ 100%** พร้อมเปลี่ยนหน่วยแกนและ tooltip |
| TH-C3 | Horizontal bar | จัดอันดับหมวด Fake ตาม distinct posts; toggle Top 5 / All; click category ต้องเลือกเฉพาะ category **ไม่บังคับ verdict Fake กับทั้งแท็บ** |
| TH-C4 | Small multiples | 3 mini-line charts ของ `Finance & stocks`, `Health products`, `Government policy & news`, นับ Fake posts, ใช้ช่วงเวลาเดียวกันและ **แกน Y scale เท่ากัน** |
| TH-T1 | Detail table | post ID/date, หัวข้อ, หมวด, verdict, หน่วยงานตรวจสอบ (ถ้ามี), URL |

**กฎสำคัญ:** หากผู้ใช้กรอง `verdict=True` กราฟที่นิยามเป็น Fake-only ต้องแสดง empty state/context note ตามข้อมูลที่ match จริง ไม่แอบละเลยตัวกรอง True. คำว่า “การเงิน” ในที่นี้คือหมวดข่าวที่ตรวจสอบ ไม่ใช่คนเสียหายหรือมูลค่าความเสียหาย.

## 6. UX, UI และ Non-functional requirements

| ID | Priority | Requirement |
|---|---|---|
| NFR-01 | Must | ภาษาไทยอ่านง่าย, ฟอนต์ Kanit ถ้าพร้อมใช้, ชื่อกราฟและ tooltip ไม่ตัดความหมาย |
| NFR-02 | Must | Responsive บน desktop และ tablet; กราฟไม่ซ้อนกันหรือตารางล้นโดยไม่จัดการ |
| NFR-03 | Must | Contrast เพียงพอ; มี label/legend ที่ไม่พึ่งสีอย่างเดียว; คีย์บอร์ดใช้งานตัวกรองและล้าง filter ได้ |
| NFR-04 | Must | ข้อมูลและสูตรตรวจย้อนกับ CSV ได้; ไม่มีตัวเลข/ข้อความตัวอย่างตกค้างใน build ที่ส่ง |
| NFR-05 | Must | ทุก interaction มี feedback ที่เข้าใจได้ภายในเวลาที่สมเหตุสมผลกับขนาด dataset; ไม่เกิด freeze เมื่อคลิกกราฟต่อเนื่อง |
| NFR-06 | Must | Header แสดงช่วงปีและสถานะ filter, สรุปวิธีอ่านข้อมูล/ข้อจำกัดในแต่ละแท็บ |
| NFR-07 | Should | Visual direction แบบ modern editorial/bento; **ยังไม่ล็อก palette/ธีม** เพื่อให้ทีม UI/UX อนุมัติ |
| NFR-08 | Should | โค้ดแยก loader/transformations, aggregations, filters, components; มี README วิธีรันและอ้างอิงแหล่งข้อมูล |

## 7. UAT: เกณฑ์ตรวจรับก่อนส่งอาจารย์

| Test | Steps | Expected result |
|---|---|---|
| UAT-01 Baseline | เปิด All years, All months, clear ทุก filter | AI = 59 incidents; EU = 4,820 debunks และ 12,186 associations; Thai = 4,627 posts โดยหน่วยตรง |
| UAT-02 Date shared | เลือก 2021 แล้วเปลี่ยนครบ 3 แท็บ | แสดงช่วง 2021 ทั้งสามแท็บและ filter คงเดิม |
| UAT-03 Cross-filter | คลิกปี/แท่ง/จุดที่เลือกได้ | KPI กราฟอื่น และตารางที่เกี่ยวข้องอัปเดต; selected chip ปรากฏ |
| UAT-04 Reset | คลิกซ้ำและกด Clear tab / Clear all | กลับสู่ผลที่คำนวณจาก filter ที่เหลืออย่างถูกต้อง |
| UAT-05 EU grain | เลือก language/domain แล้วเทียบ EU-K1 กับ distinct debunk IDs ของแถว match | EU-K1 ไม่เพิ่มตามจำนวนบทความซ้ำ; class counts ใช้ระดับ association |
| UAT-06 Thai verdict | กรอง True แล้วเปิด TH-C1/TH-C3/TH-C4 | Fake-only ไม่มี matched records หรือมี context warning ตรงไปตรงมา |
| UAT-07 Thai chart modes | สลับ Count/100% และ Top 5/All | ค่า/หน่วย/tooltip เปลี่ยนถูก; 100% รวมเป็น 100 เมื่อมีข้อมูล |
| UAT-08 Source | เปิดรายละเอียดแต่ละแท็บและดู source ใต้กราฟ | URL ใช้ได้เมื่อมีค่า, บอกชื่อแหล่งข้อมูลและหน่วยครบ |
| UAT-09 No data | กรองชุดที่ไม่มี record | Empty state ไม่ขึ้น NaN/Infinity, ไม่แสดงค่าที่อ้างว่ามีเหตุการณ์ |
| UAT-10 Conditional charts | ตรวจ EU keyword/topic และ AI harmed mapping | ใช้ chart จริงเฉพาะเมื่อ audit ผ่าน ไม่เช่นนั้นแสดง fallback ติดป้ายชัดเจน |
| UAT-11 Small multiples | ดู TH-C4 เมื่อเปลี่ยน year/month | ทั้ง 3 เส้นเทียบกันบน timeline และ Y scale เดียวกัน |
| UAT-12 Claims | ตรวจหน้า dashboard และ insights ทุกแห่ง | ไม่รวมยอด 3 แหล่ง, ไม่อ้างจำนวนเหยื่อ/มูลค่าความเสียหาย, ไม่มี causal/forecast claims |

## 8. ลำดับส่งงานและ Definition of Done

1. **Data Ready:** 4 CSV + `cleaning_report.json`, ทดสอบ uniqueness/date/mapping และบันทึกกฎ EU keyword / AI harmed ที่ใช้จริง.
2. **MVP:** โครงหน้า 3 แท็บ, ปี/เดือนร่วม, KPI/กราฟ/ตารางครบตาม Must, chart fallback ถูกต้อง.
3. **Interactive:** click-to-cross-filter, clear, selected state, empty state และ EU association projection ทำงานตาม UAT.
4. **QA:** ผ่าน UAT 01–12, ทุกแผนภูมิมี source/unit, visual QA เดสก์ท็อป/แท็บเล็ต, ไม่พบตัวเลขสมมติ.
5. **Delivery:** ลิงก์หรือโฟลเดอร์ Dashboard ที่เปิดรันได้, README, CSV ที่ใช้, data dictionary/cleaning report, สรุปผลการทดสอบ, BRD/Handoff/Requirements ชุดเดียวกัน.

## 9. สิ่งที่ยังต้องยืนยันกับทีม

- Framework และสถานที่เผยแพร่ (เช่น Streamlit/React/Power BI) **ยังไม่ถูกกำหนด**; Requirements นี้เป็นกลางต่อเครื่องมือ.
- EU keyword tokenization และการแมปหัวข้อที่ผ่าน QA; AI harmed taxonomy: ใช้ conditional/fallback จนกว่าจะรับรอง.
- UI/UX ทีมเลือกชุดสีและรายละเอียดธีมสุดท้าย; Kanit และความอ่านง่ายเป็นแนวทาง.
- การ export filtered CSV เป็น **Should**; ไม่ใช่เงื่อนไขปิดงานขั้นต่ำหากเวลาจำกัด.

**Traceability:** `BRD.md` = เหตุผลทางธุรกิจ/โจทย์ที่ตอบ; `REQUIREMENTS.md` = สิ่งที่ระบบต้องทำและเงื่อนไขตรวจรับ; `HANDOFF.md` = ข้อตกลงข้อมูลและแนวทางส่งต่อให้ผู้พัฒนา.
