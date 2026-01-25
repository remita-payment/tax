// app/auth/error/page.jsx
import { Suspense } from "react";
import AuthErrorClient from "./AuthErrorClient";

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <AuthErrorClient />
    </Suspense>
  );
}
