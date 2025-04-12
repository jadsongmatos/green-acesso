import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import Stack from "@mui/material/Stack";
import { SignInPage, type AuthProvider } from "@toolpad/core/SignInPage";

import { signIn, auth } from "@/lib/auth";
import { providerMap } from "@/lib/auth.config";
import Content from "@/components/Content";

export default async function SignInSide() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <Stack
      direction="column"
      component="main"
      sx={{
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <Stack
        direction={{ xs: "column-reverse", md: "row" }}
        sx={{
          justifyContent: "center",
          gap: { xs: 6, sm: 12 },
          p: 2,
          mx: "auto",
        }}
      >
        <Stack
          direction={{ xs: "column-reverse", md: "row" }}
          sx={{
            justifyContent: "center",
            gap: { xs: 6, sm: 12 },
            p: { xs: 2, sm: 4 },
            m: "auto",
          }}
        >
          <Content />
          <SignInPage
            providers={providerMap}
            sx={{
              minHeight: "auto",
            }}
            signIn={async (
              provider: AuthProvider,
              //formData: FormData,
              callbackUrl?: string
            ) => {
              "use server";
              try {
                return await signIn(provider.id, {
                  redirectTo: callbackUrl ?? "/dashboard",
                });
              } catch (error) {
                // The desired flow for successful sign in in all cases
                // and unsuccessful sign in for OAuth providers will cause a `redirect`,
                // and `redirect` is a throwing function, so we need to re-throw
                // to allow the redirect to happen
                // Source: https://github.com/vercel/next.js/issues/49298#issuecomment-1542055642
                // Detect a `NEXT_REDIRECT` error and re-throw it
                if (
                  error instanceof Error &&
                  error.message === "NEXT_REDIRECT"
                ) {
                  throw error;
                }
                // Handle Auth.js errors
                if (error instanceof AuthError) {
                  return {
                    error:
                      error.type === "CredentialsSignin"
                        ? "Invalid credentials."
                        : "An error with Auth.js occurred.",
                    type: error.type,
                  };
                }
                // An error boundary must exist to handle unknown errors
                return {
                  error: "Something went wrong.",
                  type: "UnknownError",
                };
              }
            }}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
