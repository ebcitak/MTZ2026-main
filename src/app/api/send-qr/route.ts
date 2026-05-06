import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, qrCodeData, organization, richData } = await req.json();

    // Data URL yerine harici bir API kullanarak QR kodu daha güvenli hale getiriyoruz
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(JSON.stringify(richData))}`;

    const { data, error } = await resend.emails.send({
      from: 'Milli Teknoloji Zirvesi <onboarding@resend.dev>', 
      to: [email],
      subject: `MTZ 2026 Giriş Kartınız - Sn. ${name}`,
      html: `
        <div style="font-family: 'Helvetica', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0f1e; color: #ffffff; padding: 40px; border-radius: 20px; border: 1px solid #00f0ff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00f0ff; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Milli Teknoloji Zirvesi 2026</h1>
            <p style="color: #ffffff; opacity: 0.6; font-size: 12px; margin-top: 5px;">DİJİTAL GİRİŞ KARTI</p>
          </div>
          
          <div style="background: rgba(255,255,255,0.03); padding: 30px; border-radius: 15px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
            <p style="font-size: 20px; margin-bottom: 5px; color: #ffffff;">Sayın <strong>${name}</strong>,</p>
            <p style="font-size: 14px; color: #00ff41; margin-bottom: 30px; font-weight: bold;">${organization}</p>
            
            <div style="background-color: white; padding: 15px; display: inline-block; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 0 20px rgba(0,240,255,0.3);">
              <img src="${qrUrl}" alt="QR Kod" width="220" height="220" style="display: block; border: none;" />
            </div>
            
            <p style="font-size: 13px; line-height: 1.6; color: #ffffff; opacity: 0.8; max-width: 400px; margin: 0 auto;">
              Zirve girişinde bu QR kodu görevlilere okutarak hızlıca giriş yapabilirsiniz. Bu kart size özeldir.
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #ffffff; opacity: 0.3; text-transform: uppercase; letter-spacing: 2px;">
            MTZ 2026 - TÜRKİYE TEKNOLOJİ TAKIMI
          </div>
        </div>
      `
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
