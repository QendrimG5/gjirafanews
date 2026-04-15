import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { users } from "@/lib/data";
import { createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const { password: _, ...safeUser } = user;
    return Response.json({ user: safeUser });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
