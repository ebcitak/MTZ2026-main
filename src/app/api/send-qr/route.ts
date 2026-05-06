import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { name, email, organization, qrString } = await req.json();
    
    // Mail sistemi geçici olarak devre dışı (Siteyi ayağa kaldırmak için)
    console.log("Mail gönderim isteği (Simüle edildi):", email);
    
    return NextResponse.json({ success: true, message: "Site restore edildi." });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
