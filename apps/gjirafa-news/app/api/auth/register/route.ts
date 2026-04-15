import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { users, generateUserId } from "@/lib/data";
import { createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return Response.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existingUser) {
      return Response.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: generateUserId(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: "user" as const,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    await createSession({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    const { password: _, ...safeUser } = newUser;
    return Response.json({ user: safeUser }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
