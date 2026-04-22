import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@gjirafanews/ui";

export default function LoginPage() {
  const navigate = useNavigate();
  const { initialized, authenticated, login } = useAuth();

  useEffect(() => {
    if (initialized && authenticated) {
      navigate("/", { replace: true });
    }
  }, [initialized, authenticated, navigate]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gn-text-tertiary">Duke ngarkuar...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="bg-gn-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
            <span className="text-gn-text-inverse text-lg font-bold">G</span>
          </div>
          <h1 className="text-gn-text text-xl font-bold tracking-tight">
            Kyqu ne GjirafaNews
          </h1>
          <p className="text-gn-text-tertiary mt-1 text-sm">
            Identifikimi behet permes Keycloak
          </p>
        </div>
        <Button
          onClick={() => login()}
          className="bg-gn-primary text-gn-text-inverse w-full"
        >
          Kyqu me Keycloak
        </Button>
      </div>
    </div>
  );
}
