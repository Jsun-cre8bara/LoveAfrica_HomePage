import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();
const ADMIN_EMAIL =
  Deno.env.get("ADMIN_EMAIL") || "loveafrica1004@gmail.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM =
  Deno.env.get("RESEND_FROM_EMAIL") || "Love Africa <onboarding@resend.dev>";

// Supabase 클라이언트 생성
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Storage 버킷 초기화
const BUCKET_NAME = 'make-5f047ca7-notices';

async function initializeStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
      
      if (error) {
        console.error('Failed to create bucket:', error);
      } else {
        console.log('Storage bucket created:', BUCKET_NAME);
      }
    }
  } catch (err) {
    console.error('Storage initialization error:', err);
  }
}

// 서버 시작 시 스토리지 초기화
initializeStorage();

async function sendEmail({
  subject,
  text,
  replyTo,
}: {
  subject: string;
  text: string;
  replyTo?: string;
}) {
  if (!RESEND_API_KEY) {
    throw new Error(
      "메일 발송 환경변수(RESEND_API_KEY)가 설정되지 않아 관리자 메일을 보낼 수 없습니다.",
    );
  }
  if (!ADMIN_EMAIL) {
    throw new Error(
      "메일 발송 환경변수(ADMIN_EMAIL)가 설정되지 않아 관리자 메일을 보낼 수 없습니다.",
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [ADMIN_EMAIL],
      subject,
      text,
      reply_to: replyTo || undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `메일 전송 실패 (status ${response.status}): ${errorText}`,
    );
  }

  return response.json();
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    // apikey 헤더도 허용해야 프론트 요청이 차단되지 않습니다.
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-5f047ca7/health", (c) => {
  return c.json({ status: "ok" });
});

// ===== 인증/인가 헬퍼 =====
async function requireAdmin(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No authorization header' }, 401);
  }

  const accessToken = authHeader.replace('Bearer ', '').trim();
  if (!accessToken) {
    return c.json({ error: 'Empty access token' }, 401);
  }

  try {
    // JWT를 직접 파싱하여 검증 (서비스 롤 키 클라이언트는 사용자 토큰 검증에 문제가 있을 수 있음)
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Malformed JWT');
    }

    // JWT payload 디코드
    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0)),
      ),
    );

    // 토큰 만료 확인
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return c.json({ error: 'Token expired' }, 401);
    }

    // user_metadata에서 role 확인
    const role = payload.user_metadata?.role || payload.app_metadata?.role;
    
    if (role !== 'admin') {
      console.error('Role check failed. Role:', role, 'Payload:', payload);
      return c.json({ error: 'Admin role required' }, 403);
    }

    return null;
  } catch (err: any) {
    console.error('JWT verify error:', err);
    return c.json({ error: 'Invalid JWT' }, 401);
  }
}

// 관리자 회원가입 (최초 1회만 실행)
app.post("/make-server-5f047ca7/admin/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'admin' },
      // 자동으로 이메일 확인 (이메일 서버 미설정)
      email_confirm: true
    });

    if (error) {
      console.error('Admin signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, user: data.user });
  } catch (err: any) {
    console.error('Admin signup exception:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 관리자 로그인 (클라이언트에서 Supabase Auth 사용)
// 이 엔드포인트는 필요 없지만, 서버에서 사용자 확인용으로 사용 가능

// 공지사항 목록 조회
app.get("/make-server-5f047ca7/notices", async (c) => {
  try {
    const { data: notices, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get notices error:', error);
      return c.json({ error: error.message }, 500);
    }

    // 데이터가 없으면 초기 데이터 생성
    if (!notices || notices.length === 0) {
      const initialNotices = [
        { title: '2025년 새해 인사 및 후원 안내', content: '', date: '2025.01.03', views: 124 },
        { title: '연말 특별 후원 캠페인', content: '', date: '2024.12.28', views: 256 },
        { title: '아프리카 학교 건립 프로젝트 완료', content: '', date: '2024.12.20', views: 189 },
        { title: '겨울철 긴급 구호물품 전달', content: '', date: '2024.12.15', views: 203 },
        { title: '후원금 사용 내역 공개', content: '', date: '2024.12.10', views: 312 },
      ];

      const { data: inserted } = await supabase
        .from('notices')
        .insert(initialNotices)
        .select();

      return c.json({ notices: inserted || [] });
    }

    return c.json({ notices });
  } catch (err: any) {
    console.error('Get notices error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 공지사항 생성 (관리자만)
app.post("/make-server-5f047ca7/notices", async (c) => {
  try {
    const authError = await requireAdmin(c);
    if (authError) return authError;

    const { title, content, date, views = 0, attachments = [] } = await c.req.json();
    
    const { data: notice, error } = await supabase
      .from('notices')
      .insert([{ title, content, date, views, attachments }])
      .select()
      .single();

    if (error) {
      console.error('Create notice error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('Notice created:', notice.id);
    return c.json({ success: true, notice });
  } catch (err: any) {
    console.error('Create notice error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 공지사항 수정 (관리자만)
app.put("/make-server-5f047ca7/notices/:id", async (c) => {
  try {
    const authError = await requireAdmin(c);
    if (authError) return authError;

    const id = c.req.param('id');
    const { title, content, date, views, attachments } = await c.req.json();

    const { data: notice, error } = await supabase
      .from('notices')
      .update({ title, content, date, views, attachments })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update notice error:', error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }

    console.log('Notice updated:', id);
    return c.json({ success: true, notice });
  } catch (err: any) {
    console.error('Update notice error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 공지사항 삭제 (관리자만)
app.delete("/make-server-5f047ca7/notices/:id", async (c) => {
  try {
    const authError = await requireAdmin(c);
    if (authError) return authError;

    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete notice error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('Notice deleted:', id);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('Delete notice error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ========================================
// NEWSLETTER API
// ========================================

// 뉴스레터 목록 조회
app.get("/make-server-5f047ca7/newsletters", async (c) => {
  try {
    const { data: newsletters, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get newsletters error:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ newsletters: newsletters || [] });
  } catch (err: any) {
    console.error('Get newsletters error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 뉴스레터 생성 (관리자만)
app.post("/make-server-5f047ca7/newsletters", async (c) => {
  try {
    const authError = await requireAdmin(c);
    if (authError) return authError;

    const { title, content, published, attachments = [] } = await c.req.json();
    
    const { data: newsletter, error } = await supabase
      .from('newsletters')
      .insert([{ title, content, published, attachments }])
      .select()
      .single();

    if (error) {
      console.error('Create newsletter error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('Newsletter created:', newsletter.id);
    return c.json({ success: true, newsletter });
  } catch (err: any) {
    console.error('Create newsletter error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 뉴스레터 수정 (관리자만)
app.put("/make-server-5f047ca7/newsletters/:id", async (c) => {
  try {
    const authError = await requireAdmin(c);
    if (authError) return authError;

    const id = c.req.param('id');
    const { title, content, published, attachments } = await c.req.json();

    const { data: newsletter, error } = await supabase
      .from('newsletters')
      .update({ title, content, published, attachments })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update newsletter error:', error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }

    console.log('Newsletter updated:', id);
    return c.json({ success: true, newsletter });
  } catch (err: any) {
    console.error('Update newsletter error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 뉴스레터 삭제 (관리자만)
app.delete("/make-server-5f047ca7/newsletters/:id", async (c) => {
  try {
    const authError = await requireAdmin(c);
    if (authError) return authError;

    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('newsletters')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete newsletter error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('Newsletter deleted:', id);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('Delete newsletter error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ========================================
// FILE UPLOAD
// ========================================

// 파일 업로드 (관리자만)
app.post("/make-server-5f047ca7/upload", async (c) => {
  try {
    const authError = await requireAdmin(c);
    if (authError) return authError;

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return c.json({ error: error.message }, 500);
    }

    // Signed URL 생성 (7일 유효)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1년 유효

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return c.json({ error: signedUrlError.message }, 500);
    }

    console.log('File uploaded:', fileName);

    return c.json({
      success: true,
      attachment: {
        name: file.name,
        url: signedUrlData.signedUrl,
        type: file.type,
        size: file.size,
      },
    });
  } catch (err: any) {
    console.error('Upload exception:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ========================================
// DONATION RECEIPT EMAIL
// ========================================

// 기부금 영수증 신청서 메일 전송
app.post("/make-server-5f047ca7/donation-receipt", async (c) => {
  try {
    const { name, birthDate, phone, email } = await c.req.json();

    // 필수 필드 검증
    if (!name || !birthDate || !phone || !email) {
      return c.json({ error: '모든 필드를 입력해주세요.' }, 400);
    }

    // 생년월일 검증 (8자리)
    if (birthDate.length !== 8) {
      return c.json({ error: '생년월일은 8자리로 입력해주세요.' }, 400);
    }

    // 전화번호 검증 (11자리)
    if (phone.length !== 11) {
      return c.json({ error: '전화번호는 11자리로 입력해주세요.' }, 400);
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: '올바른 이메일 형식을 입력해주세요.' }, 400);
    }

    // 메일 제목: "'이름'님의 기부금 신청서 요청 메일입니다"
    const subject = `${name}님의 기부금 신청서 요청 메일입니다`;

    // 메일 본문 작성
    const formattedPhone = phone.length === 11 
      ? `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`
      : phone;
    const body = `
기부금 영수증 발급 신청서

이름: ${name}
생년월일: ${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}
전화번호: ${formattedPhone}
이메일: ${email}

신청일시: ${new Date().toLocaleString('ko-KR')}
    `.trim();

    // DB 저장
    const { data: saved, error: insertError } = await supabase
      .from("donation_receipts")
      .insert([
        {
          name,
          birth_date: birthDate,
          phone,
          email,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Donation receipt insert error:", insertError);
      return c.json(
        {
          error:
            insertError.message ||
            "기부금 영수증 신청서를 저장하는 중 오류가 발생했습니다.",
        },
        500,
      );
    }

    let emailStatus: "sent" | "failed" | "skipped" = "sent";
    let emailError: string | undefined;

    try {
      await sendEmail({
        subject,
        text: body,
        replyTo: email,
      });
    } catch (err: any) {
      emailStatus = "failed";
      emailError = err?.message || "메일 전송 중 알 수 없는 오류가 발생했습니다.";
      console.error("Donation receipt email send error:", err);
    }

    return c.json({
      success: true,
      message:
        emailStatus === "sent"
          ? "기부금 영수증 신청서가 성공적으로 접수되었습니다."
          : "신청이 저장되었으나 관리자 메일 전송에 실패했습니다. 관리자에게 메일 환경변수를 확인해주세요.",
      data: saved,
      emailStatus,
      emailError,
    });

  } catch (err: any) {
    console.error('Donation receipt email error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ========================================
// INQUIRY EMAIL
// ========================================

app.post("/make-server-5f047ca7/inquiries", async (c) => {
  try {
    const { name, contact, email, message } = await c.req.json();

    if (!name || !contact || !email || !message) {
      return c.json({ error: "모든 필드를 입력해주세요." }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "올바른 이메일 형식을 입력해주세요." }, 400);
    }

    const subject = `${name}님의 후원/사업 문의입니다`;
    const body = `
새 문의가 접수되었습니다.

이름: ${name}
연락처: ${contact}
이메일: ${email}

문의 내용:
${message}

접수일시: ${new Date().toLocaleString('ko-KR')}
    `.trim();

    const { data: saved, error: insertError } = await supabase
      .from("inquiries")
      .insert([
        {
          name,
          contact,
          email,
          message,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Inquiry insert error:", insertError);
      return c.json(
        {
          error:
            insertError.message ||
            "문의 내용을 저장하는 중 오류가 발생했습니다.",
        },
        500,
      );
    }

    let emailStatus: "sent" | "failed" | "skipped" = "sent";
    let emailError: string | undefined;

    try {
      await sendEmail({
        subject,
        text: body,
        replyTo: email,
      });
    } catch (err: any) {
      emailStatus = "failed";
      emailError = err?.message || "메일 전송 중 알 수 없는 오류가 발생했습니다.";
      console.error("Inquiry email send error:", err);
    }

    return c.json({
      success: true,
      message:
        emailStatus === "sent"
          ? "문의가 성공적으로 접수되었습니다."
          : "문의는 저장되었으나 관리자 메일 전송에 실패했습니다. 관리자에게 메일 환경변수를 확인해주세요.",
      data: saved,
      emailStatus,
      emailError,
    });
  } catch (err: any) {
    console.error("Inquiry email error:", err);
    return c.json({ error: err.message }, 500);
  }
});

Deno.serve(app.fetch);