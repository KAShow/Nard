# خطة إصلاح تطبيق نرد - الإصلاح الشامل

## Context
تطبيق React Native / Expo لإدارة جلسات ألعاب الطاولة. الفحص الشامل للكود كشف عن 15+ مشكلة تتراوح بين أخطاء حرجة وتحسينات ضرورية. الهدف إصلاح جميع المشاكل الموثقة.

---

## الملفات المتأثرة

- `app/_layout.tsx`
- `app/login.tsx`
- `app/create-session.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/index.tsx`
- `app/session/[id].tsx`
- `hooks/useAuth.tsx`
- `components/BGGGamePicker.tsx`
- `components/SessionCard.tsx`
- `services/supabaseService.ts`

---

## خطة الإصلاح

### 1. `app/_layout.tsx` — RTL guard صحيح
**المشكلة:** `I18nManager.forceRTL(true)` يُستدعى عند كل تحميل
**الحل:** الكود الحالي `if (!I18nManager.isRTL)` صحيح بالفعل — لا يحتاج تغيير ✅

### 2. `app/create-session.tsx` — إصلاح شريط التقدم
**المشكلة:** `(filledCount / 1) * 100` — القسمة على 1 دائماً = 100%
**الحل:** تغيير الحساب ليعكس الحقل المطلوب الوحيد (العنوان) بشكل صحيح، أو إضافة الحد الأدنى للتاريخ

**تغييرات:**
- السطر 46: تصحيح `progressPercent` ليكون `title.trim() ? 100 : 0`
- السطر 35: إضافة `minimumDate={new Date()}` لمنع اختيار تواريخ الماضي
- السطر 55: تغيير نوع `event: any` → `event: { type: string }`

### 3. `app/login.tsx` — توحيد المعالجة
**المشكلة:** trim() غير متسق على password
**الحل:**
- السطر 32: تغيير `signInWithPassword(email.trim(), password)` → `signInWithPassword(email.trim(), password.trim())`
- إضافة تحقق بسيط من صيغة البريد الإلكتروني (regex)

### 4. `hooks/useAuth.tsx` — إزالة `require()` الديناميكي
**المشكلة:** السطر 26: `const { getSupabaseClient } = require('@/template');`
**الحل:** نقل الـ import إلى أعلى الملف:
```ts
import { useAuth as useSupabaseAuth, getSupabaseClient } from '@/template';
```

### 5. `app/(tabs)/profile.tsx` — حماية حذف الحساب + إصلاح badge savior
**المشاكل:**
- حذف الحساب بدون تأكيد إضافي
- `savior` badge دائماً يعرض 0

**الحل:**
- Modal تأكيد الحذف موجود فعلاً (السطر 37) — التحقق من أنه يُعرض قبل `handleDeleteAccount`
- إصلاح `getBadgeProgress` لـ savior: إضافة حقل `lastMinuteJoins` في بيانات المستخدم أو إبقاؤه 0 مع تعليق واضح

### 6. `app/session/[id].tsx` — إصلاح Polling / Memory Leak
**المشكلة:** `setInterval` كل 5 ثوانٍ بدون توقف
**الحل:** التحقق من وجود cleanup صحيح في `useEffect`:
```ts
useEffect(() => {
  const interval = setInterval(() => refreshSessions(), 5000);
  return () => clearInterval(interval); // cleanup عند unmount
}, []);
```
إذا كان الـ cleanup غائباً أو ناقصاً → إضافته

### 7. `components/BGGGamePicker.tsx` — إصلاح البحث
**المشكلة:** البحث حساس لحالة الأحرف الإنجليزية
**الحل:** تطبيق `.toLowerCase()` على اسم اللعبة أيضاً عند المقارنة

### 8. إزالة `console.log` (96 مكان)
**الأداة:** Grep + Edit لاستبدال جميع `console.log(` و `console.error(` الغير ضرورية
**الاستراتيجية:** إبقاء console.error للأخطاء الحقيقية، حذف console.log الديباغ

### 9. إصلاح `router.push as any`
**المشكلة:** استخدام `as any` في navigation
**الحل:** استخدام `href` المكتوب بشكل صحيح مع expo-router types

---

## الأولويات (ترتيب التنفيذ)

| # | الإصلاح | الأثر |
|---|---------|-------|
| 1 | `require()` → `import` في useAuth.tsx | بنيوي |
| 2 | Memory leak في session/[id].tsx | أداء |
| 3 | شريط التقدم في create-session.tsx | وظيفي |
| 4 | trim() في login.tsx | صحة بيانات |
| 5 | البحث في BGGGamePicker | وظيفي |
| 6 | حذف console.log | نظافة |

---

## التحقق

- تشغيل التطبيق: `npx expo start`
- اختبار إنشاء جلسة: التحقق من شريط التقدم
- اختبار تسجيل الدخول: كلمة مرور بمسافات
- اختبار صفحة الجلسة: فتح جلسة والتحقق من عدم تسرب memory
- اختبار BGG: البحث عن لعبة بأحرف كبيرة/صغيرة
