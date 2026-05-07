import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email, organization, qrCodeData } = await req.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Milli Teknoloji Zirvesi 2026" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Etkinlik Giriş Kartınız - MTZ 2026',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #00f0ff; text-align: center;">Milli Teknoloji Zirvesi 2026</h2>
          <p>Merhaba <strong>${name}</strong>,</p>
          <p>Milli Teknoloji Zirvesi 2026'ya kaydınız başarıyla tamamlanmıştır. Etkinlik alanına giriş yaparken aşağıdaki QR kodu görevlilere okutmanız gerekmektedir.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <img src="cid:qrcode" alt="QR Kod" style="width: 200px; height: 200px; border: 10px solid #f9f9f9;" />
          </div>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px;"><strong>Katılımcı Bilgileri:</strong></p>
            <p style="margin: 5px 0; font-size: 13px;">Kurum/Üniversite: ${organization}</p>
          </div>

          <p style="font-size: 12px; color: #777; margin-top: 20px;">Bu mail otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
          <hr />
          <p style="text-align: center; font-size: 10px; color: #999;">T3 VAKFI ANKARA EKİBİ</p>
        </div>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrCodeData.split('base64,')[1],
          encoding: 'base64',
          cid: 'qrcode' // Embedded image
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ success: true, message: "E-posta başarıyla gönderildi." });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
