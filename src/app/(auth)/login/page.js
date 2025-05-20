import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login - Soshi',
  description: 'Log in to your Soshi account',
};

export default function LoginPage() {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
