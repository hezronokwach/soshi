"use client";

import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import AuthDebug from '@/components/AuthDebug';

export default function LoginPage() {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <AuthDebug/>
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
