import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, qrCodeData, organization } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'Milli Teknoloji Zirvesi <onboarding@resend.dev>', // Kendi domaininiz varsa burayı güncelleyebilirsiniz
      to: [email],
      subject: `MTZ 2026 Giriş Kartınız - Sn. ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0f1e; color: #ffffff; padding: 40px; border-radius: 20px; border: 1px solid #00f0ff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00f0ff; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Milli Teknoloji Zirvesi 2026</h1>
            <p style="color: #ffffff; opacity: 0.6; font-size: 14px;">Giriş Kartınız ve QR Kodunuz</p>
          </div>
          
          <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 15px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
            <p style="font-size: 18px; margin-bottom: 5px;">Sayın <strong>${name}</strong>,</p>
            <p style="font-size: 14px; color: #00ff41; margin-bottom: 25px;">${organization}</p>
            
            <div style="background-color: white; padding: 20px; display: inline-block; border-radius: 10px; margin-bottom: 25px;">
              <img src="${qrCodeData}" alt="QR Kod" style="width: 200px; height: 200px; display: block;" />
            </div>
            
            <p style="font-size: 12px; line-height: 1.6; color: #ffffff; opacity: 0.8;">
              Bu QR kod sizin kişisel giriş anahtarınızdır. <br /> 
              Zirve girişinde görevlilere bu kodu okutarak hızlıca giriş yapabilirsiniz.
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #ffffff; opacity: 0.4; text-transform: uppercase; letter-spacing: 1px;">
            MTZ 2026 - Geleceği Şekillendiren Teknoloji Hamlesi
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
