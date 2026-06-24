import { SignIn } from "@clerk/nextjs";

// Clerk's prebuilt sign-in renders whichever methods are enabled in the Clerk
// Dashboard (Google / GitHub / Apple). Disable Phone there to remove it.
export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <SignIn path={`/${locale}/sign-in`} signUpUrl={`/${locale}/sign-up`} />
    </div>
  );
}
