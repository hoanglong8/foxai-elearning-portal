# FOXAI E-Learning Platform — Hướng dẫn cài đặt & Deploy

## Yêu cầu

- Node.js 18+
- Tài khoản [Supabase](https://supabase.com) (free tier đủ dùng)
- Tài khoản [Vercel](https://vercel.com) (free tier)
- Google Cloud Console (để cấu hình OAuth)

---

## Bước 1: Tạo Supabase Project

1. Vào [supabase.com](https://supabase.com) → New Project
2. Đặt tên: `foxai-elearning`, chọn region gần nhất (Singapore)
3. Lưu lại **Project URL** và **anon public key** (Settings → API)

### Chạy Database Migration

Vào Supabase Dashboard → **SQL Editor** → New query → Paste nội dung file `supabase/migrations/001_initial_schema.sql` → Run.

---

## Bước 2: Cấu hình Google OAuth

### Trong Google Cloud Console:

1. Tạo project mới hoặc dùng project hiện có
2. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
3. Application type: **Web application**
4. Authorized redirect URIs: thêm:
   - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (cho dev)
5. Lưu **Client ID** và **Client Secret**

### Trong Supabase Dashboard:

1. Authentication → Providers → Google
2. Enable Google provider
3. Nhập Client ID và Client Secret từ bước trên
4. Save

---

## Bước 3: Cài đặt local

```bash
cd foxai-elearning
cp .env.local.example .env.local
```

Chỉnh sửa `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

---

## Bước 4: Deploy lên Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

Khi được hỏi về environment variables, nhập:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Option B — Vercel Dashboard (khuyến nghị)

1. Push code lên GitHub repository
2. Vào [vercel.com](https://vercel.com) → New Project → Import GitHub repo
3. Framework: Next.js (tự detect)
4. Environment Variables: thêm 2 biến Supabase
5. Deploy

### Sau khi deploy:

Cập nhật Supabase Auth → Redirect URLs, thêm URL production:
```
https://your-app.vercel.app/auth/callback
```

---

## Bước 5: Tạo Admin Account

Sau khi đăng nhập lần đầu bằng Google, vào Supabase SQL Editor và chạy:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '<your-user-uuid>';
```

Tìm UUID của bạn tại: Supabase Dashboard → Authentication → Users.

---

## Cấu trúc Course Content

Nội dung khóa học nằm trong `lib/courses-data.ts`. Để thêm khóa học mới:

```typescript
{
  id: 'ten-khoa-hoc',
  slug: 'ten-khoa-hoc',
  title: 'Tên Khóa Học',
  description: 'Mô tả ngắn',
  category: 'ai-technology', // internal-processes | technical-skills | sales-softskills | ai-technology
  level: 'beginner',         // beginner | intermediate | advanced
  emoji: '🚀',
  lessons: [
    {
      id: 'bai-01',
      title: 'Tiêu đề bài học',
      duration_minutes: 15,
      content: `# Markdown content here...`,
    },
  ],
}
```

---

## Troubleshooting

**Lỗi "Invalid login credentials":**
- Kiểm tra Supabase URL và anon key trong `.env.local`

**Google OAuth không redirect về đúng URL:**
- Kiểm tra Redirect URLs trong Supabase Authentication settings

**Trang admin hiện "Access denied":**
- Chạy SQL `UPDATE profiles SET role = 'admin'...` như Bước 5

**Build lỗi TypeScript:**
- Chạy `npm run build` để xem lỗi cụ thể
