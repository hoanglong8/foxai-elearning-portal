import type { StaticCourse } from '@/types'

export const COURSES: StaticCourse[] = [
  // ─── AI & CÔNG NGHỆ ────────────────────────────────────────
  {
    id: 'llm-telegram-enterprise',
    slug: 'llm-telegram-enterprise',
    title: 'Triển khai LLM + Telegram Bot trong Doanh nghiệp',
    description: 'Hướng dẫn thực chiến xây dựng AI assistant trên Telegram cho doanh nghiệp Việt Nam. Bao gồm kiến trúc, NLP hybrid, bảo mật và tối ưu chi phí.',
    category: 'ai-technology',
    level: 'intermediate',
    emoji: '🤖',
    lessons: [
      {
        id: 'llm-tele-01',
        title: 'Tại sao Telegram + LLM cho doanh nghiệp Việt?',
        duration_minutes: 15,
        content: `# Tại sao Telegram + LLM cho doanh nghiệp Việt?

## Bối cảnh

Doanh nghiệp Việt Nam — đặc biệt vừa và nhỏ (50–500 nhân sự) — có các đặc điểm riêng khi triển khai công nghệ:

| Đặc điểm | Thách thức | Telegram + LLM giải quyết |
|-----------|-----------|--------------------------|
| Nhân viên quen dùng Telegram/Zalo | Ngại dùng phần mềm mới | Bot hoạt động ngay trong ứng dụng quen thuộc |
| Quản lý ra lệnh bằng tiếng Việt tự nhiên | Phần mềm nước ngoài không hỗ trợ tốt | LLM hiểu tiếng Việt tự nhiên |
| Quy trình thay đổi nhanh | Khó tùy biến phần mềm đóng gói | Bot thay đổi logic trong vài giờ |
| Ngân sách hạn chế | Chi phí SaaS cao | Self-hosted, ~$5–20/tháng |

## So sánh các kênh giao tiếp

\`\`\`
Slack / Teams   → Phù hợp doanh nghiệp lớn, đội kỹ thuật
Zalo OA         → Phù hợp B2C, giới hạn API automation
Email           → Không real-time, khó automation
Telegram Bot    → API mở, miễn phí, real-time, đa nền tảng ✅
\`\`\`

## Khi nào NÊN dùng

- ✅ Quản lý công việc nội bộ theo thời gian thực
- ✅ Nhắc nhở deadline, cảnh báo tự động
- ✅ Báo cáo nhanh không cần mở phần mềm
- ✅ Truy vấn dữ liệu bằng ngôn ngữ tự nhiên

## Khi nào KHÔNG NÊN dùng

- ❌ Thông tin mật cấp cao
- ❌ Quy trình cần audit trail pháp lý
- ❌ Khối lượng >1000 tin/ngày/user

## Kết luận

FOXAI đã triển khai thành công mô hình này cho quản lý dự án nội bộ với 37 nhân viên, tiết kiệm ~2-3 giờ/ngày so với báo cáo thủ công.`,
      },
      {
        id: 'llm-tele-02',
        title: 'Kiến trúc hệ thống Bot + LLM',
        duration_minutes: 20,
        content: `# Kiến trúc hệ thống Bot + LLM

## Sơ đồ kiến trúc tổng quan

\`\`\`
Người dùng (Telegram App)
       │
       ▼
Telegram Bot API (Polling/Webhook)
       │
       ▼
Bot Handler (Python)
  ├── NLP Layer (Intent Classification)
  │     ├── Rule-based (regex, keywords) → fast & cheap
  │     └── LLM fallback (Claude/GPT) → complex queries
  ├── Context Manager (conversation memory)
  └── Action Router
        ├── Task Manager (tạo/cập nhật task)
        ├── Report Generator
        └── Query Handler
\`\`\`

## Chiến lược NLP Hybrid

**Tại sao Hybrid?** Rule-based xử lý 70% tin nhắn với tốc độ <10ms và chi phí $0. LLM chỉ gọi khi cần thiết.

### Layer 1 — Rule-based (ưu tiên)
\`\`\`python
INTENT_PATTERNS = {
    "create_task": [r"tạo task", r"thêm việc", r"assign"],
    "list_tasks": [r"danh sách", r"xem task", r"show.*task"],
    "standup": [r"standup", r"họp sáng", r"morning"],
}
\`\`\`

### Layer 2 — LLM fallback
Khi rule-based không match, gửi message + context lên Claude API để phân loại intent.

## Stack kỹ thuật FOXAI PRM

| Component | Technology | Chi phí |
|-----------|-----------|---------|
| Bot framework | python-telegram-bot v20 | Free |
| LLM | Claude Sonnet 4.6 | ~$5-15/tháng |
| Database | SQLite / Supabase | Free |
| Hosting | Windows PC nội bộ | $0 |
| Monitoring | Logging + Telegram alerts | Free |`,
      },
      {
        id: 'llm-tele-03',
        title: 'Bảo mật, phân quyền và chi phí tối ưu',
        duration_minutes: 15,
        content: `# Bảo mật, phân quyền và chi phí tối ưu

## Mô hình phân quyền

\`\`\`python
ROLES = {
    "admin": ["view_all", "create_task", "delete_task", "view_reports"],
    "manager": ["view_team", "create_task", "update_task", "view_reports"],
    "member": ["view_own", "update_own_task"],
}
\`\`\`

## Whitelist Telegram User ID

Chỉ cho phép Telegram user ID đã đăng ký:
\`\`\`python
ALLOWED_USERS = {
    123456789: {"name": "Nguyễn Hoàng Long", "role": "admin"},
    987654321: {"name": "Nguyễn Quốc Anh", "role": "manager"},
}
\`\`\`

## Tối ưu chi phí LLM

### Prompt Caching
\`\`\`python
# Cấu trúc message với cache_control để tái sử dụng system prompt
messages = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": SYSTEM_CONTEXT,
             "cache_control": {"type": "ephemeral"}},  # Cache 5 phút
            {"type": "text", "text": user_message}
        ]
    }
]
\`\`\`

### Kết quả thực tế tại FOXAI
- **Tháng đầu:** $18 (chưa cache)
- **Tháng 2+:** $6 (sau khi áp dụng caching + rule-based filter)
- **Tiết kiệm:** ~67%

## Checklist triển khai

- [ ] Tạo Telegram Bot qua BotFather
- [ ] Cấu hình whitelist user IDs
- [ ] Set up Google OAuth cho web dashboard
- [ ] Deploy bot trên server nội bộ
- [ ] Kiểm tra rate limiting
- [ ] Backup database hàng ngày`,
      },
    ],
  },

  // ─── QUY TRÌNH NỘI BỘ ──────────────────────────────────────
  {
    id: 'foxai-onboarding',
    slug: 'foxai-onboarding',
    title: 'Onboarding FOXAI — Quy trình & Văn hóa công ty',
    description: 'Giới thiệu FOXAI Technology: cơ cấu tổ chức, quy trình làm việc, công cụ sử dụng, và văn hóa Delivery Center. Dành cho nhân viên mới.',
    category: 'internal-processes',
    level: 'beginner',
    emoji: '🏢',
    lessons: [
      {
        id: 'onboard-01',
        title: 'Giới thiệu FOXAI Technology',
        duration_minutes: 10,
        content: `# Giới thiệu FOXAI Technology

## Về FOXAI

FOXAI Technology là công ty công nghệ chuyên cung cấp giải pháp AI native, Big Data và ERP cho doanh nghiệp Việt Nam.

| Thông tin | Chi tiết |
|-----------|---------|
| **Quy mô** | 37 nhân viên |
| **Doanh thu** | ~50 tỷ/năm |
| **Lĩnh vực** | AI, Big Data, ERP, Digital Transformation |

## Cơ cấu tổ chức

\`\`\`
FOXAI Technology
├── Delivery (12 người) — Triển khai dự án, BA, Tech Architecture
├── R&D (11 người)       — AI/ML research, Backend, Data Engineering
├── Sales (7 người)      — Business development, Partnerships
├── Marketing (2 người)  — Brand, Content
└── Back-office (5 người)— HR, Finance, Operations
\`\`\`

## Các dự án trọng tâm

- **AI Native Solutions** — Chatbot, AI Agent, LLM applications
- **Big Data** — KMS, Data Lakehouse, IOC, DGOS
- **ERP Systems** — SAP B1, custom ERP trên 8 domain
- **Digital Government** — Sở KHCN, Chính quyền xã thông minh

## Giá trị cốt lõi

1. **Thực chiến** — Học từ dự án thực, không lý thuyết suông
2. **Chủ động** — Đề xuất giải pháp, không chỉ đợi chỉ thị
3. **Minh bạch** — Báo cáo trung thực, kể cả khi có vấn đề
4. **Liên tục cải tiến** — Review sau mỗi dự án, lưu lessons learned`,
      },
      {
        id: 'onboard-02',
        title: 'Quy trình Daily & Công cụ làm việc',
        duration_minutes: 15,
        content: `# Quy trình Daily & Công cụ làm việc

## Lịch làm việc hàng ngày

| Thời gian | Hoạt động |
|-----------|----------|
| 09:00 | **Morning Standup** — Ưu tiên ngày, blockers |
| 12:30 | Midday check-in — Cập nhật tiến độ |
| 17:00 | End-of-day summary — Tổng kết, kế hoạch mai |

## Công cụ bắt buộc

### Jira — Quản lý task dự án
- Mỗi task đều phải có Jira ticket
- Update status hàng ngày
- Comment khi gặp blocker

### Telegram Bot (FOXAI PRM)
- Báo cáo công việc qua bot
- Nhận nhắc nhở deadline
- Escalate blocker nhanh

### GitHub — Version control
- Branch naming: \`feature/\`, \`fix/\`, \`docs/\`
- PR cần ít nhất 1 reviewer
- Không merge vào main trực tiếp

### Google Workspace
- Email: \`@foxai.vn\`
- Drive: Lưu tài liệu dự án
- Meet: Họp nội bộ + khách hàng

## Quy trình báo cáo

\`\`\`
Nhân viên → Update Jira → Thông báo Team Lead
     ↓
Team Lead → Review → Escalate lên Director nếu cần
     ↓
Director → Quyết định → Phản hồi trong 4 giờ làm việc
\`\`\`

## Khi gặp blocker

1. Update Jira ticket với nhãn "BLOCKED"
2. Thông báo ngay cho Team Lead qua Telegram
3. Mô tả: Vấn đề là gì? Ai cần giải quyết? Impact ra sao?
4. Team Lead escalate nếu không tự giải quyết được trong 2 giờ`,
      },
      {
        id: 'onboard-03',
        title: 'Cơ cấu Delivery Team & Vai trò',
        duration_minutes: 12,
        content: `# Cơ cấu Delivery Team & Vai trò

## Delivery Team (12 người)

Delivery là trái tim của FOXAI — team trực tiếp triển khai dự án cho khách hàng.

### Leads

| Người | Vai trò | Chuyên môn |
|-------|---------|-----------|
| Nguyễn Quốc Anh | Delivery Manager, BA Lead | Phân tích yêu cầu, điều phối |
| Trần Thị Bích Hoài | Technical Lead | SQL, system design, báo cáo |
| Ngô Đức Kiên | QA Lead | Kiểm thử, chất lượng |

### Business Analysts
- Nguyễn Thị Linh — BA, phân tích yêu cầu nghiệp vụ
- Nguyễn Khánh Huy — BA, thiết kế giải pháp, cấu hình SAP
- Nguyễn Hương Trà — Onsite khách hàng, trình bày giải pháp

### Implementation Engineers
- Lê Định — Xây dựng báo cáo, đào tạo, viết HDSD
- Đinh Thị Quế — Hỗ trợ khách hàng, chốt sổ, xử lý dữ liệu cuối kỳ
- Nguyễn Mạnh Toàn — Hỗ trợ khách hàng, quản lý dữ liệu
- Nguyễn Xuân Tiến — Dashboard Power BI, báo cáo
- Nguyễn Việt Hoàng — Hỗ trợ khách hàng, quản lý bán hàng

## Vòng đời dự án Delivery

\`\`\`
Kickoff → Phân tích (BA) → Thiết kế (Tech Lead) → Phát triển → QA → UAT → Go-live → Support
\`\`\`

## Chuẩn giao tiếp với khách hàng

- Họp: Có biên bản (dùng template FOXAI)
- Email: Reply trong 4 giờ làm việc
- Escalation: Director quyết định trong 1 ngày làm việc
- Báo cáo tiến độ: Hàng tuần (thứ 6)`,
      },
    ],
  },

  // ─── KỸ NĂNG KỸ THUẬT ──────────────────────────────────────
  {
    id: 'ba-framework-mastery',
    slug: 'ba-framework-mastery',
    title: 'BA Framework — Phân tích Yêu cầu & Viết Tài liệu',
    description: 'Master kỹ năng Business Analysis tại FOXAI: từ checklist khởi đầu, chọn template, đến viết tài liệu chuẩn chất lượng enterprise. Dành cho Delivery team.',
    category: 'technical-skills',
    level: 'intermediate',
    emoji: '📋',
    lessons: [
      {
        id: 'ba-01',
        title: 'Checklist trước khi viết bất kỳ tài liệu nào',
        duration_minutes: 10,
        content: `# Checklist trước khi viết bất kỳ tài liệu nào

## Nguyên tắc vàng

> **Đừng bao giờ bắt đầu viết khi chưa hiểu rõ: Ai đọc? Để làm gì? Deadline khi nào?**

## 4 câu hỏi bắt buộc

### 1. Hiểu bối cảnh
- Dự án này là gì? Tên, client, ngành?
- Mục tiêu tài liệu là gì (business case, spec, framework, glossary)?
- Ai là audience (lãnh đạo, engineers, domain experts, QA)?
- Deadline là khi nào?

### 2. Chọn template phù hợp

| Loại tài liệu | Template |
|---------------|---------|
| Business Vision / Business Case | Business Model Canvas |
| Domain Glossary | A-Z terms + definitions + examples |
| Event Storming | Timeline + Events + Flows + Insights |
| Implementation Roadmap | Phases + Milestones + Budget + Risks |
| Bounded Context Canvas | Name + Responsibilities + Events + Integration |
| Process Flow / Use Case | User story map hoặc swimlane diagram |

### 3. Độ dài & cấu trúc
- Chỉ viết outline hay full content?
- Độ dài mục tiêu?
- Có cần diagram/table/visual không?

### 4. Ngôn ngữ & thuật ngữ
- Dự án có glossary/ubiquitous language chưa?
- Viết tiếng Việt hay tiếng Anh?
- Cần chuẩn hóa thuật ngữ không?

## Sai lầm thường gặp

- ❌ Bắt đầu viết ngay mà không review context
- ❌ Dùng thuật ngữ không nhất quán (đôi khi gọi "đơn hàng", đôi khi "order")
- ❌ Không có TOC/version control
- ❌ Viết cho người đọc "trong đầu" — không phải người đọc thực tế`,
      },
      {
        id: 'ba-02',
        title: 'Viết Business Vision Document',
        duration_minutes: 20,
        content: `# Viết Business Vision Document

## Mục đích

Business Vision Document xác định **tại sao** dự án tồn tại, **ai** hưởng lợi, và **kết quả** cụ thể cần đạt được. Đây là tài liệu nền tảng — mọi quyết định thiết kế sau đó đều tham chiếu về đây.

## Template Business Model Canvas (cho BA)

\`\`\`markdown
# Business Vision: [Tên dự án / Client]

## 1. Business Model Canvas
- **Customer Segments:** Ai là người dùng chính?
- **Value Proposition:** Cái gì tổ chức cần?
- **Channels:** Qua đâu deliver solution?
- **Revenue Streams:** Mô hình chi phí/doanh thu?

## 2. Current Pain Points (As-Is)
- [Vấn đề 1]: Mô tả + impact quantified
- [Vấn đề 2]: Mô tả + impact quantified

## 3. Solution Vision (To-Be)
- Tầm nhìn ngắn gọn (1-2 câu)
- 3-5 outcomes đo được

## 4. Success Metrics (KPIs)
| KPI | Baseline (As-Is) | Target (To-Be) | Deadline |
|-----|-----------------|----------------|----------|
| ... | ... | ... | ... |

## 5. Scope
**In scope:** [List]
**Out of scope:** [List]

## 6. Stakeholders
| Stakeholder | Role | Concern |
|-------------|------|---------|
| ... | ... | ... |
\`\`\`

## Ví dụ thực tế — IOC Bắc Ninh

**Pain Point:** Trung tâm IOC nhận dữ liệu từ 12 hệ thống khác nhau, xử lý thủ công, mất 4 giờ/ngày để tổng hợp báo cáo.

**Vision:** Hệ thống IOC tự động tổng hợp và visualize dữ liệu từ tất cả sensor/camera/hệ thống trong <5 phút.

**KPI:** Giảm thời gian báo cáo từ 4h xuống còn 5 phút (95% reduction).`,
      },
      {
        id: 'ba-03',
        title: 'Domain Glossary — Chuẩn hóa ngôn ngữ dự án',
        duration_minutes: 15,
        content: `# Domain Glossary — Chuẩn hóa ngôn ngữ dự án

## Tại sao Domain Glossary quan trọng?

Trong dự án enterprise, một khái niệm có thể được gọi khác nhau bởi:
- Khách hàng: "đơn hàng"
- BA: "sales order"
- Developer: "order entity"
- QA: "transaction record"

Kết quả: Bug, miscommunication, rework tốn kém.

**Domain Glossary** tạo ra **Ubiquitous Language** — ngôn ngữ chung duy nhất.

## Template Glossary Entry

\`\`\`markdown
### [Thuật ngữ tiếng Việt] / [English Term]

**Định nghĩa:** [1-2 câu mô tả chính xác]

**Ví dụ:** [Ví dụ cụ thể trong context dự án]

**Phân biệt với:** [Thuật ngữ dễ nhầm lẫn]

**Sử dụng trong:** [Module/feature nào dùng term này]

**Không dùng:** [Những cách gọi sai/gây nhầm lẫn]
\`\`\`

## Ví dụ — Dự án ERP tài chính

### Phiếu nhập kho / Goods Receipt

**Định nghĩa:** Chứng từ ghi nhận hàng hóa đã nhận vào kho, làm căn cứ tăng tồn kho và ghi nhận nợ phải trả.

**Ví dụ:** Khi nhận 100 hộp mực từ nhà cung cấp ABC, kế toán tạo Phiếu nhập kho #PN2026001.

**Phân biệt với:** Đơn đặt hàng (Purchase Order) — PO là yêu cầu, Phiếu nhập kho là xác nhận đã nhận.

**Không dùng:** "receipt" (mơ hồ), "nhận hàng" (không chính thức)

## Best Practices

1. **Viết glossary trước khi viết spec** — không phải sau
2. **Domain expert phải review** — BA tự viết dễ sai nghiệp vụ
3. **Version control** — Glossary sẽ thay đổi, phải track history
4. **Link trong tài liệu** — Mỗi lần dùng term lần đầu, hyperlink về glossary`,
      },
    ],
  },

  // ─── SALES & SOFT SKILLS ───────────────────────────────────
  {
    id: 'sales-enterprise-vietnam',
    slug: 'sales-enterprise-vietnam',
    title: 'Bán hàng Enterprise tại Việt Nam — Thực chiến FOXAI',
    description: 'Kỹ năng bán hàng B2B enterprise đặc thù thị trường Việt Nam: từ prospecting, demo, xử lý objection đến close deal. Kinh nghiệm thực tế từ dự án FOXAI.',
    category: 'sales-softskills',
    level: 'intermediate',
    emoji: '💼',
    lessons: [
      {
        id: 'sales-01',
        title: 'Đặc thù bán hàng enterprise Việt Nam',
        duration_minutes: 15,
        content: `# Đặc thù bán hàng enterprise Việt Nam

## Sự khác biệt B2B Việt Nam vs. Quốc tế

| Yếu tố | Quốc tế | Việt Nam |
|--------|---------|---------|
| Quyết định | Process-driven | Relationship-driven |
| Champion | Middle manager | Thường là C-level |
| Timeline | 3-6 tháng | 6-18 tháng |
| Proof | Case study từ xa | Must-have: local reference |
| Budget | Pre-approved | Thường xin duyệt riêng |
| Contract | Standard | Đàm phán từng điều khoản |

## 3 Rào cản lớn nhất

### 1. "Chúng tôi đang dùng X rồi, không cần thay"
Đây không phải objection — đây là thiếu trigger. Bạn cần **tạo ra sự bức thiết**:
- Hỏi: "Hiện tại mất bao lâu để xuất báo cáo tháng?"
- Quantify pain: "Với 20 nhân viên làm 2 ngày/tháng = 480 giờ/năm × lương = X tỷ"

### 2. "Ngân sách năm nay không có"
Hỏi về **kế hoạch ngân sách năm sau** ngay bây giờ. Nếu deal đáng, họ có thể tìm ngân sách.

### 3. "Cần xin ý kiến ban lãnh đạo"
Bạn cần **multi-thread** — đừng chỉ có 1 contact. Tìm champion ở nhiều cấp độ.

## FOXAI Sales Process

\`\`\`
Discovery → Demo → Proposal → Pilot → Negotiation → Close
  (2w)      (1w)    (1w)       (4-8w)    (2-4w)
\`\`\`

## Key Principle

> **"Bán giải pháp cho problem, không bán tính năng của sản phẩm."**

Khách hàng không quan tâm bạn có bao nhiêu tính năng. Họ quan tâm **vấn đề của họ được giải quyết như thế nào**.`,
      },
      {
        id: 'sales-02',
        title: 'Demo hiệu quả — Từ Feature đến Value',
        duration_minutes: 20,
        content: `# Demo hiệu quả — Từ Feature đến Value

## Sai lầm phổ biến khi demo

❌ **Feature-dump demo**: "Đây là chức năng A, chức năng B, chức năng C..."
✅ **Problem-solution demo**: "Hôm nay tôi sẽ cho anh thấy cách giải quyết 3 vấn đề anh đã chia sẻ..."

## Cấu trúc Demo 45 phút (Best Practice FOXAI)

### Phần 1 — Context (5 phút)
"Dựa trên cuộc nói chuyện tuần trước, tôi hiểu rằng team anh đang gặp:
1. [Pain 1] → impact X
2. [Pain 2] → impact Y

Hôm nay tôi sẽ tập trung vào cách giải quyết những vấn đề này."

### Phần 2 — Demo chính (30 phút)
Mỗi section = 1 problem solved:
\`\`\`
Mô tả problem (2 min) → Show solution (8 min) → Confirm (2 min)
\`\`\`

### Phần 3 — ROI discussion (10 phút)
- "Nếu chúng ta tiết kiệm được X giờ/tháng, với [số nhân viên] người..."
- Tính toán cụ thể payback period

## Câu hỏi discovery TRƯỚC demo

Luôn hỏi ít nhất 3 câu này trước khi demo:
1. "Hiện tại quy trình [X] của anh/chị đang làm thế nào?"
2. "Phần nào tốn thời gian nhất?"
3. "Nếu có thể thay đổi 1 thứ, anh/chị muốn thay gì nhất?"

## Red Flags trong Demo

- Không ai hỏi câu hỏi → chưa engage
- Hỏi về price quá sớm → chưa thấy value
- "Để tôi show lại cho team" → cần multi-thread ngay`,
      },
      {
        id: 'sales-03',
        title: 'Xử lý Objections & Close Deal',
        duration_minutes: 15,
        content: `# Xử lý Objections & Close Deal

## Framework xử lý objection: FEEL-FELT-FOUND

\`\`\`
"Tôi hiểu anh/chị CẢM THẤY [objection]..."     (Empathy)
"Nhiều khách hàng của chúng tôi CŨNG ĐÃ NGHĨ như vậy..."  (Normalize)
"Nhưng sau khi triển khai, họ NHẬN RA rằng..."  (Reframe)
\`\`\`

## Top 5 Objections & Cách xử lý

### "Giá quá cao"
Không giảm giá ngay. Hỏi:
- "So với cái gì thì cao?"
- "Nếu chúng ta có thể chứng minh ROI trong 6 tháng, anh có xem xét không?"

### "Cần thêm thời gian suy nghĩ"
- Hỏi: "Điều gì khiến anh chưa sẵn sàng quyết định hôm nay?"
- Set hard next step: "Để tôi gửi proposal chi tiết, mình có thể review cùng nhau vào [ngày cụ thể] không?"

### "Đội ngũ IT nội bộ có thể tự làm"
- "Đó là một lựa chọn tốt. Nhóm IT của anh đang focus vào project nào?"
- Quantify opportunity cost: build vs. buy

### "Cần xin ý kiến cấp trên"
- "Tôi rất vui nếu được trình bày trực tiếp với ban lãnh đạo. Anh có thể sắp xếp buổi họp không?"

### "Chưa có ngân sách"
- "Khi nào chu kỳ ngân sách mới của công ty anh bắt đầu?"
- Đề xuất pilot nhỏ trong budget hiện tại

## Dấu hiệu Closing signals

- ✅ Hỏi về implementation timeline
- ✅ Hỏi về điều kiện contract
- ✅ Introduce người ký hợp đồng
- ✅ Hỏi "nếu chúng tôi bắt đầu tháng sau thì..."

## FOXAI Close Rate Benchmark

| Stage | Conversion Rate |
|-------|----------------|
| Lead → Demo | 30-40% |
| Demo → Proposal | 60-70% |
| Proposal → Close | 25-35% |`,
      },
    ],
  },
]

export function getCourseBySlug(slug: string): StaticCourse | undefined {
  return COURSES.find((c) => c.slug === slug)
}

export function getLessonById(courseSlug: string, lessonId: string) {
  const course = getCourseBySlug(courseSlug)
  return course?.lessons.find((l) => l.id === lessonId)
}

export function getNextLesson(courseSlug: string, currentLessonId: string) {
  const course = getCourseBySlug(courseSlug)
  if (!course) return null
  const idx = course.lessons.findIndex((l) => l.id === currentLessonId)
  return idx >= 0 && idx < course.lessons.length - 1 ? course.lessons[idx + 1] : null
}

export function getPrevLesson(courseSlug: string, currentLessonId: string) {
  const course = getCourseBySlug(courseSlug)
  if (!course) return null
  const idx = course.lessons.findIndex((l) => l.id === currentLessonId)
  return idx > 0 ? course.lessons[idx - 1] : null
}
