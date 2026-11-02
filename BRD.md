# BRD — Business Requirements Document

**Project:** การวิเคราะห์ข่าวปลอมและภัยหลอกลวงออนไลน์ในยุค AI: เปรียบเทียบสถานการณ์ประเทศไทยและต่างประเทศ ปี 2020–2022  
**Version:** 1.0 | **Period:** 1 ม.ค. 2020 – 31 ธ.ค. 2022 | **Companion:** `HANDOFF.md`

## 1. ที่มาและความสำคัญ

ช่วงปี 2020–2022 มีเหตุการณ์โลก เช่น โควิด-19 และสงครามรัสเซีย–ยูเครน ซึ่งเป็นบริบทสำหรับศึกษาข่าวบิดเบือน ขณะเดียวกันมีการบันทึกเหตุการณ์ AI ที่เกี่ยวข้องกับข้อมูลผิดและการหลอกลวง โครงการนี้นำข้อมูล **01 AI Incident, 03 EUvsDisinfo และ 04 AFNC** มาวิเคราะห์เป็น 3 มุมมองใน Dashboard เดียว เพื่อช่วยสำรวจแนวโน้มและคัดเลือกประเด็นเฝ้าระวัง โดยไม่อ้างว่าแหล่งใดครอบคลุมข่าวปลอมทั้งหมดหรือพิสูจน์ความเป็นเหตุเป็นผล

## 2. กลุ่มผู้ใช้และประโยชน์

| กลุ่มผู้ใช้ | งานที่ต้องการทำ | สิ่งที่ Dashboard ช่วยได้ |
|---|---|---|
| นักวิจัย/นักพัฒนา AI | รู้ประเภทความเสี่ยง AI ที่บันทึกไว้ | วิเคราะห์เหตุการณ์ที่เกี่ยวกับข้อมูลผิด/หลอกลวงแยกประเภทและเวลา |
| นักข่าวและผู้ตรวจสอบข้อเท็จจริง | เลือกประเด็นและแหล่งข่าวที่ควรติดตาม | ดูคำสำคัญ แนวโน้ม ภาษา โดเมนและกรณีอ้างอิงจาก EUvsDisinfo |
| ประชาชน/หน่วยงานให้ความรู้ | เห็นข่าวปลอมไทยที่ได้รับคำตัดสินมาก | สำรวจหมวดการเงิน สุขภาพ นโยบายรัฐและข่าวต้นทาง |

## 3. คำถามวิจัยและวัตถุประสงค์

**คำถามหลัก:** ข่าวปลอมและภัยหลอกลวงออนไลน์ในยุค AI มีลักษณะและแนวโน้มเปลี่ยนแปลงอย่างไรในปี 2020–2022 และมีประเด็นใดน่าสนใจเมื่อพิจารณาสถานการณ์ไทยควบคู่กับต่างประเทศ?

**คำถามย่อย**

1. AI incidents ด้านข้อมูลผิด/หลอกลวงเปลี่ยนอย่างไรใน 2020–2022?
2. AI risk subdomain ใดถูกบันทึกมากที่สุด?
3. เหตุการณ์ AI ที่เข้าเกณฑ์เกี่ยวข้องกับผู้ได้รับผลกระทบใด ตามข้อมูลที่จำแนกได้?
4. จำนวน debunk ไม่ซ้ำของ EUvsDisinfo เปลี่ยนอย่างไร?
5. คำสำคัญหรือประเด็นใดปรากฏบ่อย และต่างกันระหว่างปีอย่างไร?
6. บทความที่เชื่อมโยงกับเรื่องตรวจสอบปรากฏในภาษาและโดเมนใด?
7. จำนวนข่าวที่ AFNC ตัดสิน Fake/Distorted/True เปลี่ยนอย่างไร?
8. หมวดข่าวปลอมไทยใดถูกตรวจสอบมากที่สุด?
9. แนวโน้มข่าวปลอมด้านการเงินเทียบสุขภาพและนโยบายรัฐแตกต่างอย่างไร?
10. เมื่อนำ **ข้อค้นพบ** ของแต่ละแท็บมาพิจารณาร่วมกัน มีประเด็นคล้ายหรือแตกต่างอย่างไร โดยไม่เทียบยอดจำนวนข้ามแหล่งแบบผิดหน่วย?

**วัตถุประสงค์:** วิเคราะห์สามมิติข้างต้น, ออกแบบ Dashboard ให้สำรวจข้อมูลจริงและตรวจสอบย้อนกลับได้, สื่อสารข้อจำกัดและข้อค้นพบเพื่อประกอบการเฝ้าระวัง

## 4. ขอบเขตข้อมูลและตัวชี้วัด

ใช้ไฟล์ที่คลีนแล้วตาม `HANDOFF.md` รวม 4 CSV จาก 3 แหล่งข้อมูลหลัก: AI incidents 59 records, EU debunks 4,820, EU article associations 12,186, Thai AFNC verdicts 4,627 (baseline ก่อนกรองบนหน้าจอ)

- **AI grain:** `incident_id`; จำกัด 3 risk subdomains คือ False or misleading information, Disinformation/surveillance/influence at scale, Fraud/scams/targeted manipulation
- **EU grain:** `debunk_id` สำหรับเรื่อง และ `(debunk_id,article_id,article_class)` สำหรับบทความที่เชื่อมโยง; ประเภท disinformation/trustworthy อยู่ในระดับบทความ
- **Thai grain:** `post_id` เฉพาะ `Verdict`; ใช้ `verdict_en` Fake/Distorted/True และหมวดจาก `category_en` หรือ `category_th`
- **เวลา:** ปี 2020, 2021, 2022 และเดือน; ทั้งแหล่ง EU/Thai มีรายการในทุกเดือนของช่วงที่ศึกษา แต่ AI subset ที่เข้าหัวข้อมีรายการเพียง 27/36 เดือน

## 5. Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| FR-01 | Must | 3 tabs ตามคำถาม 3 มุมมอง และสรุป Key Insights ภาพรวมโดยไม่รวมยอดจากคนละหน่วย |
| FR-02 | Must | Shared year/month filter ข้ามแท็บ พร้อมรักษาค่าเมื่อสลับแท็บ |
| FR-03 | Must | Local filters ตามแท็บ: AI risk; EU keyword/language/domain; Thai verdict/category |
| FR-04 | Must | Click-to-cross-filter ทุกกราฟที่รองรับ, KPI/กราฟ/ตารางอัปเดต, คลิกซ้ำยกเลิก, clear controls |
| FR-05 | Must | แสดง filter chips; multi-filter AND ข้ามมิติ; no-data state ชัดเจน |
| FR-06 | Must | ตารางค้นหา เรียง แบ่งหน้า และลิงก์หลักฐานจากแหล่งข้อมูล |
| FR-07 | Must | แหล่งข้อมูล/ช่วงเวลา/หน่วยนับใต้กราฟทุกกราฟ; tooltip แสดงค่าเหมาะสม |
| FR-08 | Must | KPI คำนวณจาก record หลัง filter ห้าม hard-code totals |
| FR-09 | Must | EU distinct debunks ไม่ถูกนับซ้ำตามบทความ; Thai duplicate post IDs ไม่ถูกคูณ |
| FR-10 | Must | Thai stacked chart toggle Count/100%; zero denominator แสดง “ไม่มีข้อมูล” |
| FR-11 | Must | Tab 2 Key Insights อย่างน้อย 3 ประเด็นที่สร้างจาก filtered data |
| FR-12 | Should | Tab 3 category ranking Top 5/All; Tab 3 three small-multiple lines with shared Y axis |
| FR-13 | Should | ส่งออกหรือคัดลอกตารางตาม filter โดยรักษา provenance |
| FR-14 | Must | ไม่มี Forecasting, ข้อมูลสมมติ หรือข้อความชวนเข้าใจว่า AI เป็นต้นเหตุของข่าวปลอมไทย |

## 6. Tab requirements, KPI and visuals

### Tab 1: AI Risks

**Question:** ความเสี่ยง AI ที่เกี่ยวกับข้อมูลผิดและการหลอกลวงเปลี่ยนอย่างไรและกระทบกลุ่มใด?  
**KPIs:** จำนวน incident เข้าเกณฑ์ / incident ด้านข้อมูลผิดหรือบิดเบือน / incident ด้าน fraud/scams  
**Charts:** A1 line รายเดือน, A2 stacked column risk type รายปี, A3 horizontal rank ของ risk subdomain, A4 กลุ่ม harmed เฉพาะเมื่อ mapping ผ่านการตรวจ (มิฉะนั้นแสดงรายละเอียดแทน)  
**Detail:** วันที่, incident ID, ชื่อ, risk, harmed, description  
**Benefit:** นักวิจัยและผู้ใช้ AI เห็นประเภทความเสี่ยงในฐานข้อมูล ไม่ใช่อัตราการเกิดจริงทั้งโลก

### Tab 2: Global Disinformation

**Question:** EUvsDisinfo ตรวจสอบประเด็นใดและแนวโน้ม/ภาษา/แหล่งบทความมีลักษณะอย่างไร?  
**KPIs:** distinct debunks / จำนวนบทความที่ class=disinformation / จำนวนภาษาในบทความ  
**Charts:** E1 line debunks รายเดือน; E2 Top10 keyword; E3 stacked topics by year **เมื่อมี mapping ที่ตรวจแล้ว** (fallback เป็น article classes/year พร้อมเปลี่ยน label และหน่วย); E4 Top10 languages; E5 Top10 domains  
**Detail:** วันที่, debunk ID, keywords, article class, ภาษา, โดเมน, URL  
**Key Insights:** keyword เด่น, การเปลี่ยนแปลงในช่วงเท่ากัน, ภาษา/โดเมนเด่น — คำนวณตาม filter  
**Benefit:** ผู้ตรวจสอบเลือกประเด็นติดตามอย่างมีหลักฐาน; ไม่กล่าวหาภาษาหรือโดเมนโดยเหมารวม

### Tab 3: Thai Fake News

**Question:** ประเภท verdict และหมวดข่าวปลอมไทยเปลี่ยนอย่างไร รวมถึงหมวดการเงินเทียบกับอื่น?  
**KPIs:** distinct verdict posts / distinct Fake posts / (Fake+Distorted)/all verdict × 100  
**Charts:** T1 line Fake รายเดือน; T2 stacked Fake/Distorted/True รายปี toggle Count/100%; T3 ranked horizontal bar Fake by category (Top 5/All); T4 **small multiples** 3 เส้นของการเงิน–หุ้น, ผลิตภัณฑ์สุขภาพ, นโยบายรัฐบาล–ข่าวสาร โดยใช้แกน Y เดียวกันและ timeline เดียวกัน  
**Detail:** วันที่, ข่าว, หมวด, verdict, หน่วยงานตรวจสอบ, URL  
**Benefit:** ประชาชนและผู้สื่อสารสาธารณะเห็นหมวดที่ AFNC ตรวจสอบ ไม่ใช่จำนวนคนโดนหลอก

**Note on design source:** รายละเอียดแท็บ 3 ใน Word แนบเสนอ Small Multiples Line เป็นการปรับปรุงจาก Grouped Bar เดิม; ใช้ Small Multiples ตามส่วนรายละเอียดล่าสุด หากกลุ่มต้องการคง Grouped Bar จะเป็นการเปลี่ยนแบบที่ต้องยืนยันก่อนพัฒนา

## 7. Non-Functional Requirements

- **Correctness:** ข้อมูลจริงปี 2020–2022 เท่านั้น; exact counting grain; audit/reconcile กับ CSV; ไม่มีตัวเลขสมมติ
- **Performance:** การคลิกตัวกรอง/กราฟต้องตอบสนองได้ลื่นไหลกับข้อมูลขนาดนี้; หลีกเลี่ยงการประมวลผลซ้ำทั้งไฟล์ทุกครั้งถ้าไม่จำเป็น
- **Usability:** ภาษาไทยอ่านง่าย ฟอนต์ Kanit ตามแนวกลุ่ม; layout Modern Editorial/Bento เป็นแนวทางเบื้องต้น แต่ **รายละเอียดสี/ธีมสุดท้ายให้ทีม UI/UX ตัดสิน** ตามข้อความล่าสุดในเอกสารอ้างอิง
- **Accessibility:** contrast สูง, tooltip/labels ไม่พึ่งสีเพียงอย่างเดียว, keyboard-friendly, responsive
- **Transparency:** คำอธิบายที่มา, หน่วยนับ, filter state, empty state และข้อจำกัดอยู่ใกล้ visual
- **Maintainability:** แยก parsing / aggregation / UI; ไม่แก้ไฟล์ต้นฉบับ; มีขั้นตอนตรวจอัตโนมัติ

## 8. Exclusions and limitations

1. ไม่ JOIN รายเหตุการณ์ของ AI/EU/AFNC เพราะไม่มี common entity ID; แชร์ได้เพียงปี/เดือน ส่วน keyword/topic cross-source ต้องมี mapping ที่พิสูจน์ได้
2. EUvsDisinfo เน้นขอบเขตของแหล่งนี้ ไม่ใช่ตัวแทนข่าวปลอมทั่วโลก; 1 debunk อาจมีหลายบทความและบทความหลาย class
3. AI เป็น subset เพียง 59 เหตุการณ์ มีรายการ 27/36 เดือน; ขาดช่วงไม่ได้แปลว่าศูนย์ของเหตุการณ์ที่เกิดขึ้นทั้งหมด
4. AFNC มีเฉพาะโพสต์ที่ถูกตรวจสอบ; ไม่ใช่อุบัติการณ์จริงทั้งหมด ไม่ใช่จำนวนคนที่เชื่อหรือเสียเงิน
5. ไม่มีข้อมูลยอดคดี/ความเสียหายปี 2020–2022 ที่ใช้เทียบได้จาก ACSC ในโฟลเดอร์นี้
6. เหตุการณ์ COVID-19/สงครามเป็นเพียงบริบท มิใช่ข้อพิสูจน์ว่าเป็นสาเหตุทำให้ตัวเลขเปลี่ยน
7. EU keyword/topic mapping และ AI harmed mapping ต้องได้รับการตรวจตาม Data contract ก่อนเปิดใช้กราฟที่ต้องพึ่งการจัดกลุ่ม
8. ข้อมูลเต็ม 36 เดือนของ *source* ไม่รับประกันการครอบคลุมทุกกรณี; ไม่ทำ forecasting

## 9. Acceptance Criteria (UAT)

| ID | Test / Expected result |
|---|---|
| AC-01 | Year 2020/2021/2022/All และ Month เลือกแล้วทุกแท็บใช้ช่วงเวลาตรงกัน |
| AC-02 | AI baseline distinct 59 และเฉพาะ risk subdomains ที่กำหนดเมื่อไม่กรอง |
| AC-03 | EU baseline distinct debunks 4,820, article associations 12,186; กราฟ class ใช้หน่วย “บทความ” |
| AC-04 | Thai baseline 4,627 verdict posts; Fake+Distorted+True = total; share จากตัวหาร verdict |
| AC-05 | คลิกกราฟทุกชุดที่กำหนดแล้ว KPI/กราฟอื่น/ตารางปรับจริง ไม่ใช่แค่ dropdown |
| AC-06 | Cross-filter ปี/เดือนคงสถานะเมื่อสลับแท็บ; category/keyword ไม่ส่งข้ามแหล่งแบบผิดความหมาย |
| AC-07 | Click again/Clear reset กู้ค่าก่อนกรองได้ และ filter chips แสดงชัด |
| AC-08 | กราฟ Fake-only กับตัวกรอง True แสดงสถานะที่ไม่หลอกผู้ใช้ |
| AC-09 | Thai Count/100% Stacked ใช้หน่วยถูก; Three small multiples ใช้ Y scale เดียวกัน |
| AC-10 | EU keyword parsing และ topic mapping มีเกณฑ์และตรวจ sample; ถ้ายังไม่ผ่านใช้ fallback chart พร้อม label |
| AC-11 | Key Insights เปลี่ยนตาม filter; no-data/zero-denominator ไม่เกิด NaN/Infinity/กราฟหลอก |
| AC-12 | ตารางเปิด link แหล่งจริงได้, กราฟมี source/units, UI อ่านง่ายบน desktop/tablet |
| AC-13 | ไม่มี Forecasting, ตัวเลขสมมติ, หรือ claim เชิงสาเหตุเกินข้อมูล |

## 10. Delivery and next steps

สิ่งส่งมอบขั้นต่ำ: Dashboard 3 แท็บ, raw-preserving cleaned CSV 4 ไฟล์ + JSON audit, `HANDOFF.md`, `BRD.md`, รายงานผล UAT และคู่มือเปิดโปรเจกต์

ลำดับงาน: verify cleaned CSV → keyword/harmed mapping & data checks → shared filters → three tabs → dynamic insights → cross-filter UAT → visual QA → review with team → deploy

**Reference authority:** เอกสาร Word ของกลุ่มที่แนบล่าสุด และข้อมูลที่คลีนแล้วเป็นแหล่งกำหนดเนื้อหา ไม่ใช้ข้อความตัวอย่างหรือจำนวนสมมติเป็นผลวิเคราะห์
