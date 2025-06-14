"use client";
import { useAuth } from "@/hooks/useAuth";

export default function AuthDebug() {
  const { user, loading } = useAuth();

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div>
        <strong>Loading:</strong> {loading ? "true" : "false"}
      </div>
      <div>
        <strong>User:</strong> {user ? "Logged in" : "Not logged in"}
      </div>
      {user && (
        <div>
          <strong>User ID:</strong> {user.id}
          <br />
          <strong>Email:</strong> {user.email}
        </div>
      )}
    </div>
  );
}