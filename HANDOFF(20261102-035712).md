# HANDOFF — Digital Disinformation & AI Risk Dashboard

**Version:** 1.0 | **Scope:** 2020–2022 | **Status:** Ready for dashboard implementation; data transformation gates noted below

## 1. Project

**ชื่อ:** การวิเคราะห์ข่าวปลอมและภัยหลอกลวงออนไลน์ในยุค AI: เปรียบเทียบสถานการณ์ประเทศไทยและต่างประเทศ ปี 2020–2022

กลุ่มผู้ใช้งาน: นักวิจัยด้านสื่อ/AI, ผู้ตรวจสอบข้อเท็จจริง, หน่วยงานสื่อสารสาธารณะ และประชาชน

**คำถามหลัก:** ข่าวปลอมและภัยหลอกลวงออนไลน์ในยุค AI มีลักษณะและแนวโน้มเปลี่ยนแปลงอย่างไรในปี 2020–2022 และมีประเด็นใดน่าสนใจเมื่อพิจารณาไทยควบคู่กับต่างประเทศ?

Dashboard มี 3 แท็บ: (1) AI Risks — ความเสี่ยงจาก AI, (2) Global Disinformation — ข้อมูลบิดเบือนใน EUvsDisinfo, (3) Thai Fake News — ข่าวที่ AFNC ตรวจสอบในไทย

> 3 แท็บนำเสนอ 3 มุมมอง ไม่ใช่ 3 ฐานข้อมูลที่ JOIN รายเหตุการณ์ได้โดยตรง ห้ามทำยอดรวมปะปนหรือสรุปความสัมพันธ์เชิงสาเหตุ

## 2. Data contract (ใช้ไฟล์ที่คลีนแล้ว)

| Table | Granularity / key | Fields used | Counts after cleaning |
|---|---|---|---:|
| `ai_incidents_clean.csv` | 1 AI incident / `incident_id` | `event_date,year,month,year_month,topic_group,risk_domain,risk_subdomain,harmed,title,description` | 59 |
| `euvsdisinfo_debunks_clean.csv` | 1 debunk / `debunk_id` | `event_date,year,month,year_month,keywords,article_rows,disinformation_articles,trustworthy_articles` | 4,820 |
| `euvsdisinfo_articles_clean.csv` | 1 association of debunk/article/class | `debunk_id,article_id,event_date,year,month,year_month,keywords,article_language,article_domain,article_class,article_url` | 12,186 |
| `thai_afnc_verdicts_clean.csv` | 1 AFNC verdict / `post_id` | `event_date,year,month,year_month,verdict_th,verdict_en,category_th,category_en,title,checked_by_agency,url` | 4,627 |
| `cleaning_report.json` | audit | source/period/duplicates/coverage | — |

ต้นฉบับ: 01 AIID Excel export 2026-10-26, 03 `euvsdisinfo_base.csv`, 04 `afnc_items.csv`. คงไฟล์ต้นฉบับไว้โดยไม่แก้ไข ไม่ใช้ข้อมูล ACSC คดีหลอกลวงปี 2025–2026 ในการวิเคราะห์ 2020–2022

**Validation gate:** ตัวเลขข้างต้นมาจากการทดสอบกระบวนการคลีน ไม่ใช่ KPI ที่ต้อง hard-code; ทุก KPI คำนวณใหม่จากข้อมูลและตัวกรองจริง

### 2.1 Additional transformations required before charting

1. **EU keyword tokens:** `keywords` เป็นข้อความหัวข้อ/คำสำคัญ ต้องตรวจรูปแบบตัวคั่นจริง แยกเป็นตาราง `debunk_id,keyword` ด้วยกฎที่บันทึกไว้ แล้วนับ `debunk_id` แบบ distinct ต่อคำสำคัญ ห้ามนับจำนวนบทความแทนจำนวนเรื่อง และห้ามแยกคำด้วยเครื่องหมายที่อาจเป็นส่วนของคำโดยไม่ตรวจตัวอย่าง
2. **EU topic categories (optional/conditional):** กราฟ Stacked Column “ประเด็นแยกปี” ต้องมีตาราง mapping `keyword -> topic_group` ที่ตรวจสอบได้ (เช่น COVID/health, war/conflict, politics, other/unmapped) หากยังไม่ผ่านการตรวจ ให้เปลี่ยนกราฟนี้เป็น “ประเภทบทความแยกปี” โดยนับ *บทความ* ของ `article_class` ให้ชัด ไม่อ้างว่าเป็นประเภทของ debunk
3. **AI harmed:** `harmed` เป็นข้อความอิสระ อาจมีหลายกลุ่มในช่องเดียว ไม่ควรจัดอันดับ “กลุ่มผู้ได้รับผลกระทบ” จนกว่าจะนิยามและตรวจ mapping; ถ้าไม่มี mapping ที่เชื่อถือได้ ให้ใช้ตารางรายการตัวอย่างที่กรองได้แทนกราฟนี้ พร้อมแจ้งข้อจำกัด
4. **EU source classes:** `article_class` เป็นคำตัดสินระดับ *บทความ* ไม่ใช่คำตัดสินระดับ `debunk_id`; debunk หนึ่งเรื่องมีได้หลายบทความ และอาจมีทั้งสอง class
5. **Thai categories:** ใช้ `category_th`/ `category_en` ที่มาจากแหล่งจริง; กราฟสามหมวดใช้ `Finance & stocks`, `Health products`, `Government policy & news` (ตรวจและแสดงชื่อภาษาไทยตามหมวดจริง)
6. **Time:** ใช้ 2020-01 ถึง 2022-12 เสมอ; สร้าง date dimension 36 เดือนเพื่อแสดงกรอบเวลาอย่างต่อเนื่อง แต่ให้ 0 เฉพาะกรณียืนยันว่าไม่มีรายการ มิใช่ช่วงที่ข้อมูลสูญหาย

## 3. Shared UX and interactions

- แสดงชื่อ Dashboard, บทนำสั้น ๆ, แถบแท็บ 3 แท็บ และแผงตัวกรองที่ค้นพบง่าย โดยอ้างอิงแนว **Modern Editorial / Bento**; เลือกสีและ layout ขั้นสุดท้ายตามงาน UI/UX ของกลุ่ม ไม่สร้างภาพ/ตัวเลขตกแต่งที่อาจสับสนกับข้อมูลจริง
- **Shared state:** `year` (All/2020/2021/2022) และ `month` (All/1–12) แชร์ข้ามทั้ง 3 แท็บและคงอยู่เมื่อสลับแท็บ
- **Local state:** ความเสี่ยง AI, คำสำคัญ/ภาษา/โดเมน EU, หมวดข่าว/คำตัดสินไทย จำกัดภายในแท็บที่เกี่ยวข้อง ไม่ส่ง mapping ที่ไม่มีหลักฐานข้ามฐานข้อมูล
- **Cross-filter on click:** คลิกกราฟ = เปลี่ยนตัวกรองที่เกี่ยวข้องและ redraw KPI + กราฟ + ตารางภายในแท็บ; คลิกซ้ำ = ยกเลิก; มี active filter chips และปุ่ม Clear tab filters / Clear all filters
- ตัวกรองหลายตัวใช้ตรรกะ **AND ข้ามมิติ**; เลือกหลายค่าภายในมิติเดียวใช้ **OR** เมื่อ UI อนุญาต; ห้ามละเลยตัวกรองเงียบ ๆ หากขัดแย้งกัน
- Chart totals ต้องระบุ denominator และ grain; กราฟที่นับเฉพาะ Fake ต้องระบุว่าเป็น subset ของผลตรวจสอบ, ไม่ใช่ total ของทุก verdict
- Hover tooltip แสดงจำนวนหน่วย ช่วงเวลา สัดส่วนเมื่อเหมาะสม; กดกราฟด้วยคีย์บอร์ดได้เท่าที่กราฟรองรับ; empty state “ไม่มีข้อมูลตามตัวกรองที่เลือก” (ไม่เด้ง popup)
- แสดง **แหล่งข้อมูลใต้กราฟทุกกราฟ**, ปี 2020–2022, หน่วยนับ, ลิงก์ต้นทางจาก record เท่าที่มี; ใช้ Kanit ภาษาไทยเป็นหลัก, contrast สูง, ไม่ใช้ emoji, responsive desktop/tablet
- ไม่ทำ Forecasting, prediction, sentiment score สมมติ, world map ที่ไม่มีภูมิศาสตร์เชื่อถือได้ หรือ causal inference

## 4. Tab 1 — AI Risks

**Question Q1–Q3:** มีเหตุการณ์เกี่ยวกับข้อมูลผิด/การหลอกลวงมากเท่าใด แนวโน้มเป็นอย่างไร ประเภทความเสี่ยงใดเด่น และใครได้รับผลกระทบเท่าที่จำแนกได้?

**Scope:** ใช้ `topic_group` ที่คลีนมา 3 ค่า: `misinformation`, `disinformation_influence`, `fraud_scams`; 1 record = 1 `incident_id`. ไม่อ้างว่าเหตุการณ์ทั้งหมดในฐาน AI คือข่าวปลอม

**KPI (dynamic)**
1. จำนวนเหตุการณ์ที่เข้าเกณฑ์ = `COUNT(DISTINCT incident_id)`
2. จำนวนเหตุการณ์ด้านข้อมูลผิด/บิดเบือน = `COUNT(DISTINCT incident_id WHERE topic_group IN ('misinformation','disinformation_influence'))`
3. จำนวนเหตุการณ์หลอกลวง = `COUNT(DISTINCT incident_id WHERE topic_group='fraud_scams')`

**Charts**
| ID | Chart / title | Data / calculation | Click behavior |
|---|---|---|---|
| A1 | Line — แนวโน้มเหตุการณ์ AI รายเดือน | x `year_month`, y distinct `incident_id` | เลือกเดือน/ปี |
| A2 | Stacked Column — ประเภทความเสี่ยง AI จำแนกตามปี | x `year`, stack `topic_group`, y distinct incidents | เลือกปี/ประเภท |
| A3 | Ranked Horizontal Bar — ประเภทความเสี่ยงที่ถูกบันทึก | y `risk_subdomain`, x distinct incidents | เลือกหมวดย่อย |
| A4 | Bar — กลุ่มผู้ได้รับผลกระทบ | **Conditional:** ใช้เฉพาะ mapping `harmed` ที่ตรวจสอบแล้ว; หากยังไม่มีให้แสดงรายละเอียดแทน | เลือกกลุ่มเมื่อมี mapping |

**Detail table:** วันที่, `incident_id`, ชื่อ, หมวดความเสี่ยง, ผู้ได้รับผลกระทบตามข้อความแหล่งต้นฉบับ, คำอธิบาย; ค้นหา/เรียง/แบ่งหน้า; เปลี่ยนตามตัวกรอง

**Caveat:** หลังคัดเฉพาะ risk subdomain ที่เกี่ยวข้องเหลือ **59 เหตุการณ์และมีข้อมูล 27 ใน 36 เดือน**; ต้องแสดงความต่างระหว่าง “ไม่มีเหตุการณ์ใน subset” กับ “ฐานข้อมูลไม่ครอบคลุม” อย่างระมัดระวัง

## 5. Tab 2 — Global Disinformation / EUvsDisinfo

**Question Q4–Q6:** แนวโน้มเรื่องที่ฐานข้อมูลตรวจสอบ ประเด็นสำคัญ และภาษา/โดเมนของบทความประกอบช่วยให้ผู้ตรวจสอบติดตามอะไรได้?

**KPI (dynamic)**
1. จำนวนเรื่องตรวจสอบ = `COUNT(DISTINCT debunk_id)` หลังใช้ filter ที่สัมพันธ์กับ debunk/article
2. จำนวนบทความที่จัดเป็น Disinformation = จำนวน **บทความไม่ซ้ำตาม `(debunk_id, article_id, article_class)`** ที่ class เป็น disinformation (นับเป็นแถวความสัมพันธ์; หากต้องการ unique URL ให้ตั้งชื่อ KPI ใหม่)
3. จำนวนภาษา = `COUNT(DISTINCT article_language)` จากแถวบทความที่ผ่าน filter

**Charts**
| ID | Chart / title | Data / calculation | Click behavior |
|---|---|---|---|
| E1 | Line — แนวโน้มจำนวนเรื่องตรวจสอบรายเดือน | x `year_month`, distinct `debunk_id` | เดือน/ปี |
| E2 | Ranked Horizontal Bar — Top 10 Keywords | distinct `debunk_id` ต่อ keyword token หลังสร้าง mapping | keyword |
| E3 | Stacked Column — ประเด็นข่าวแยกตามปี | distinct debunks ต่อ verified `topic_group` (**conditional**, ดูข้อ 2.1) | ปี/ประเด็น |
| E4 | Horizontal Bar — Top 10 Languages | จำนวน article associations ต่อ `article_language` | ภาษา |
| E5 | Horizontal Bar — Top 10 Publishing Domains | จำนวน article associations ต่อ `article_domain` | โดเมน |

**Interaction:** คลิก COVID-related keyword ให้ line/KPI/ตารางใช้เฉพาะ debunk ที่ match; ภาษา/โดเมน filter ระดับบทความแล้วโปรเจ็กต์ `debunk_id` กลับไปนับ distinct debunks; แสดง active filters และปุ่มล้าง

**Key Insights & Applications:** คำนวณใหม่เมื่อเปลี่ยน filter อย่างน้อย 3 ประเด็น ได้แก่ (1) keyword/topic ที่เด่น (2) ความต่างเมื่อเทียบช่วงเวลายาวเท่ากัน (3) ภาษา/โดเมนที่มากสุด; **ห้าม hard-code ข้อสรุปล่วงหน้า** ถ้า sample น้อยหรือไม่มีข้อมูลให้ขึ้นข้อความอธิบาย

**Detail table:** `event_date,debunk_id,keywords,article_class,article_language,article_domain,article_url`; แสดง multi-article relationships และลิงก์จริง, ค้นหา/แบ่งหน้า

**Caveat:** EUvsDisinfo มีขอบเขตเฉพาะ ไม่ใช่ข้อมูลข่าวปลอมทั่วโลก; ภาษา/โดเมนที่พบมากไม่ใช่การกล่าวหาผู้ใช้ภาษาหรือทุกเว็บไซต์ในโดเมนนั้น

## 6. Tab 3 — Thai Fake News

**Question Q7–Q9:** ผลตรวจสอบเปลี่ยนอย่างไร หมวดข่าวปลอมใดพบในฐานข้อมูลมากสุด และการเงิน/สุขภาพ/นโยบายรัฐต่างกันอย่างไร?

**Source filter:** `item_type='Verdict'` ถูกคัดใน CSV แล้ว; 1 `post_id` = 1 verdict post; ไม่ใช้ `view_count` เป็นจำนวนผู้ถูกหลอก

**KPI (dynamic)**
1. จำนวนโพสต์ที่มีคำตัดสิน = distinct `post_id` ที่ `verdict_en IN ('Fake','Distorted','True')`
2. จำนวนข่าวปลอม = distinct `post_id` ที่ `verdict_en='Fake'`
3. สัดส่วนข่าวปลอม+บิดเบือน = `(Fake+Distorted)/all verdicts*100`; ถ้าตัวหาร 0 แสดง “ไม่มีข้อมูล”

**Charts**
| ID | Chart / title | Data / calculation | Click behavior |
|---|---|---|---|
| T1 | Line — แนวโน้มข่าวปลอมรายเดือน | x `year_month`, y distinct `post_id` where Fake, 36-month calendar | ปี/เดือน |
| T2 | Stacked Column — ผลการตรวจสอบจำแนกตามปี | x `year`, stacks Fake/Distorted/True, distinct posts; toggle Count ↔ 100% | เลือกปีหรือผลตรวจสอบ |
| T3 | Ranked Horizontal Bar — อันดับหมวดหมู่ข่าวปลอม | distinct `post_id` where Fake by `category_th`; Top 5 / All | category only (**ไม่บังคับ Fake ไปยังทุกกราฟ**) |
| T4 | Small Multiples Line — การเงิน สุขภาพ นโยบายรัฐ | 3 mini-lines, same timeline + **same Y scale**, distinct Fake posts; monthly/quarterly toggle if implemented | category + year/month |

**Critical T3/T4 behavior:** หากมี active `verdict=True` กราฟ Fake-only จะแสดง empty/no matching data อย่างชัดเจน หรือแสดง unfiltered context พร้อม badge ระบุ; ห้ามแอบละเลย filter. ถ้าคลิกหมวดอื่นที่ไม่อยู่ใน T4 ให้คง T4 เป็น contextual comparison พร้อมคำอธิบาย (ไม่แสดงผิดว่าหมวดนั้นเป็นหนึ่งในสาม)

**Table:** วันที่, หัวข้อ, หมวด, ผลตรวจสอบ, หน่วยงานตรวจสอบ, URL; search/sort/pagination, filter-aware

**Caveat:** ตัวเลขเป็นจำนวนโพสต์ที่ AFNC มีคำตัดสิน ไม่ใช่จำนวนข่าวปลอมทั้งหมดในไทยหรือจำนวนผู้หลงเชื่อ

## 7. Reconciliation and acceptance checks

- [ ] ใช้เฉพาะ 2020-01-01 ถึง 2022-12-31; แสดงทุกเดือนบน timeline
- [ ] ไม่ใช้ไฟล์ `weekly_panel.csv` เป็นจำนวนโพสต์รายปีโดยไม่ปรับกติกา เพราะ `year` ใน panel อิงสัปดาห์
- [ ] AI: unique `incident_id`, scope 3 risk subdomains, 59 rows baseline; ระบุความขาดช่วงใน subset
- [ ] EU: unique `debunk_id` 4,820 baseline; article associations 12,186 baseline; KPI debunks ไม่ถูกคูณตาม articles
- [ ] Thai: unique `post_id` 4,627 baseline; Fake+Distorted+True = total; share denominator ตาม verdict
- [ ] Chart T2 toggle Count/100% ใช้คนละหน่วยและ label ถูกต้อง
- [ ] Clicking any supported chart changes appropriate KPI, other charts, table; clicking again clears
- [ ] Year/month filters persist across all tabs; local filters do not incorrectly propagate across datasets
- [ ] Empty states, zero denominators, no-match filters, multi-filter AND tested
- [ ] Sources and units shown under **every** chart, no unsupported causal claims or fabricated figures
- [ ] Key Insights generated from current filtered data, not fixed assertions
- [ ] No forecasting; keyboard-readable labels; responsive; no unreadable low contrast

## 8. Suggested implementation handover

Suggested folders: `data/cleaned/` (4 CSV + audit JSON), `src/data/` (parsers and aggregation), `src/components/` (filters, KPI, charts, details), `src/tabs/` (AI/EU/Thai), `tests/` (data reconciliation and crossfilter). This is a logical guide, not a mandate to overwrite an existing repository layout.

Implementation order: import + validate CSV → time dimension + EU keyword/map decisions → shared filter store → Tab 3 → Tab 2 → Tab 1 → crossfilter verification → responsive polish → acceptance test. Preserve original datasets; do not commit/push to an existing Git repo without the owner's explicit go-ahead.

**Source of truth:** user-supplied Word document `01-Dashboard-3-3-.docx`, cleaned ZIP `dashboard_cleaned_2020_2022.zip`, and the cleaning audit. When conflicts occur, prefer the detailed tab-specific section to earlier overview tables, while requiring confirmation for a substantive change in chart type or research scope.
