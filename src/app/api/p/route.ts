import { auth } from "@/lib/auth";

export const GET = auth((req) => {
  if (req.auth) {
    console.log("auth",req.auth)
    if (req.auth.user) {
      return Response.json({ email: req.auth.user.email });
    }
    return Response.json({ message: "User information is missing" }, { status: 400 });
  }

  return Response.json({ message: "Not authenticated" }, { status: 401 })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any // TODO: Fix `auth()` return type