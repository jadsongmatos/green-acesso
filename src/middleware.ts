import NextAuth from "next-auth"
import authConfig from "@/lib/auth.config"

export const { auth } = NextAuth(authConfig)

export default auth((req) => {
  console.log("middleware",req.nextUrl.pathname)
  if (!req.auth && req.nextUrl.pathname == "/dashboard") {
    const newUrl = new URL("/auth/signin", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};