import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json(
        { error: 'Admin wachtwoord is niet ingesteld op de server.' },
        { status: 500 }
      );
    }

    if (password === correctPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Onjuist wachtwoord.' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Er is een fout opgetreden.' },
      { status: 500 }
    );
  }
}
