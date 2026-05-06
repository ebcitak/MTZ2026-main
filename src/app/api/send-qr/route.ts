import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// I'll suggest the user to set RESEND_API_KEY in their .env file
export async function POST(req: Request) {
  try {
    const { name, email, qrCodeData, organization } = await JSON.parse(await req.text());

    if (!process.env.RESEND_API_KEY || 
        process.env.RESEND_API_KEY === 're_123456789' || 
        process.env.RESEND_API_KEY.includes('your_actual_key')) {
      // Mock mode if no API key
      console.log('-----------------------------------------');
      console.log(`[SIMÜLASYON] Mail Gönderildi: ${email}`);
      console.log(`[ALICI]: ${name}`);
      console.log('-----------------------------------------');
      return NextResponse.json({ success: true, mock: true });
    }

    // Construct the QR data URL using a public API to avoid attachments
    const qrValue = JSON.stringify({
      n: name,
      e: email,
      o: organization,
      t: "KATILIMCI" // Default to participant for now
    });
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}`;

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'MTZ 2026 <onboarding@resend.dev>',
      to: [email],
      subject: 'MTZ 2026 Giriş Kartınız',
      html: `
        <div style="background-color: #050810; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <div style="max-width: 600px; text-align: left; margin-bottom: 20px;">
                  <h1 style="color: white; font-size: 22px; font-weight: bold; margin-bottom: 10px;">Merhaba ${name},</h1>
                  <p style="color: #94a3b8; font-size: 16px; line-height: 1.5; margin: 0;">
                    Milli Teknoloji Zirvesi 2026'ya hoş geldiniz! Kaydınız başarıyla tamamlanmıştır. 
                    Aşağıda size özel oluşturulan dijital giriş kartınızı bulabilirsiniz.
                  </p>
                </div>

                <table width="350" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 30px; overflow: hidden; border: 1px solid #1e293b; border-top: 5px solid #00f0ff;">
                  <tr>
                    <td align="center" style="padding: 30px 20px 20px 20px;">
                      <!-- Logo Area -->
                      <div style="margin-bottom: 15px;">
                        <span style="color: white; font-size: 24px; font-weight: 900; letter-spacing: -1px;">MTZ <span style="color: #00f0ff;">2026</span></span>
                      </div>
                      <div style="color: #00f0ff; font-weight: bold; letter-spacing: 5px; font-size: 10px; text-transform: uppercase; margin-bottom: 25px;">MİLLİ TEKNOLOJİ ZİRVESİ</div>
                      
                      <div style="background-color: rgba(255,255,255,0.05); padding: 18px; border-radius: 18px; margin-bottom: 25px;">
                        <div style="color: #94a3b8; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">KATILIMCI</div>
                        <div style="color: white; font-size: 22px; font-weight: 900;">${name}</div>
                        <div style="color: #00f0ff; font-size: 11px; margin-top: 5px;">${organization || ''}</div>
                      </div>

                      <div style="background-color: white; padding: 12px; border-radius: 15px; display: inline-block; margin-bottom: 25px; box-shadow: 0 10px 20px rgba(0,0,0,0.5);">
                        <img src="${qrImageUrl}" width="180" height="180" alt="QR KOD" style="display: block; border: none;" />
                      </div>

                      <div style="color: #64748b; font-size: 11px; line-height: 1.4; padding: 0 10px;">
                        Lütfen bu kartı etkinlik alanına girişte <br/> görevlilere okutunuz.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 15px; background-color: rgba(0,0,0,0.2); border-top: 1px solid #1e293b;">
                      <div style="color: #475569; font-size: 9px; font-weight: bold; text-transform: uppercase;">GÜVENLİ DİJİTAL ERİŞİM SİSTEMİ</div>
                    </td>
                  </tr>
                </table>

                <div style="margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 20px; color: #475569; font-size: 11px; text-align: center;">
                  Bu e-posta MTZ 2026 Kayıt Sistemi tarafından otomatik olarak oluşturulmuştur.
                </div>
              </td>
            </tr>
          </table>
        </div>
      `,
    });

    if (error) {
      console.error('[Resend Error]:', error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
