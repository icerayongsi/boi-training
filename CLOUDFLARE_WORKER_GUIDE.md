# คู่มือการ Deploy Cloudflare Worker สำหรับเว็บดาวน์โหลดและรัน Script

สคริปต์ [worker.js](file:///c:/Users/icera/work/db-training/worker.js) ถูกออกแบบมาให้เป็น **Zero-Dependency (ไฟล์เดียวจบ)** โดยฝังไฟล์ `unix-connect-db.sh` และ `windows-connect-db.ps1` ไว้ในตัว คุณสามารถนำไป Deploy ได้ง่ายๆ 2 วิธี:

---

## วิธีที่ 1: Deploy ผ่านหน้าเว็บ Cloudflare Dashboard (ง่ายที่สุด ไม่ต้องลงโปรแกรม)

1. ล็อกอินเข้าสู่ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. ที่เมนูด้านซ้าย เลือก **Compute (Workers & Pages)** > **Workers & Pages**
3. กดปุ่ม **Create** > เลือกแท็บ **Workers** > กด **Create Worker**
4. ตั้งชื่อ Worker เช่น `mysql-training-portal` แล้วกด **Deploy**
5. เมื่อสร้างเสร็จ ให้กดปุ่ม **Edit code** (Quick Edit) ที่มุมขวาบน
6. ลบโค้ดเริ่มต้นออกทั้งหมด แล้วนำโค้ดในไฟล์ [worker.js](file:///c:/Users/icera/work/db-training/worker.js) ในเครื่องนี้ไป **Paste (วาง)** แทนที่
7. กดปุ่ม **Deploy** ที่มุมขวาบน
8. ระบบจะให้ URL ของ Worker มาทันที เช่น:
   ```text
   https://mysql-training-portal.<your-subdomain>.workers.dev
   ```

---

## วิธีที่ 2: Deploy ผ่าน Wrangler CLI

หากในเครื่องมี Node.js และ npm ติดตั้งอยู่แล้ว สามารถรันผ่านเทอร์มินัลได้ทันที:

```bash
# ล็อกอิน Cloudflare (ทำครั้งแรกครั้งเดียว)
npx wrangler login

# Deploy ขึ้น Cloudflare Worker
npx wrangler deploy
```

---

## Endpoints ที่พร้อมใช้งาน

เมื่อ Deploy แล้ว URL ของ Worker จะรองรับ Endpoint ดังต่อไปนี้:

| Endpoint | คำอธิบาย | ตัวอย่างการใช้งาน |
| :--- | :--- | :--- |
| `GET /` | หน้าเว็บ Portal แสดงคู่มือ ปุ่มดาวน์โหลด และ Connection Details | เปิดใน Web Browser |
| `GET /windows` หรือ `/win` หรือ `/ps1` | สคริปต์ PowerShell สำหรับรัน One-liner | `irm https://<worker-url>/windows \| iex` |
| `GET /windows-connect-db.ps1` | ดาวน์โหลดไฟล์ PowerShell โดยตรง | ดาวน์โหลดไฟล์ `.ps1` |
| `GET /unix` หรือ `/sh` | สคริปต์ Bash สำหรับรัน One-liner | `curl -sSL https://<worker-url>/unix \| bash` |
| `GET /unix-connect-db.sh` | ดาวน์โหลดไฟล์ Bash โดยตรง | ดาวน์โหลดไฟล์ `.sh` |
| `GET /health` | ตรวจสอบสถานะ Worker | `{"status": "ok"}` |

---

## ตัวอย่างคำสั่งที่แจกให้ผู้เข้าอบรมใช้งาน

### 1. สำหรับ Windows (PowerShell)
ผู้เข้าอบรมเปิด PowerShell แล้วพิมพ์บรรทัดเดียว:
```powershell
irm https://<worker-url>/windows | iex
```
*(หากติดสิทธิ์ ExecutionPolicy ให้รัน `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` ก่อน)*

### 2. สำหรับ macOS / Linux / WSL (Bash)
ผู้เข้าอบรมเปิด Terminal แล้วพิมพ์บรรทัดเดียว:
```bash
curl -sSL https://<worker-url>/unix | bash
```

---

## การทดสอบหน้าเว็บบนเครื่อง Local

คุณสามารถทดสอบเปิดดูหน้าตา UI ในเครื่องได้ทันที โดยดับเบิลคลิกเปิดไฟล์ [index.html](file:///c:/Users/icera/work/db-training/index.html) ในเว็บเบราว์เซอร์
