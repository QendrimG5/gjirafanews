import { jwtVerify } from "jose";
import type { UserRole } from "@/lib/data";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: Date;
};

const secretKey = process.env.SESSION_SECRET!;
const encodedKey = new TextEncoder().encode(secretKey);

export async function decrypt(
  session: string | undefined = ""
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
