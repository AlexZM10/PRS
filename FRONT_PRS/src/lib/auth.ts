import { API_BASE, clearAuthStorage, persistTokens } from "./api";

export async function login(username: string, password: string) {
  const trimmedUser = username.trim();
  const res = await fetch(`${API_BASE}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: trimmedUser, password }),
  });

  if (!res.ok) {
    throw new Error(await parseAuthError(res));
  }

  const data = await res.json(); // { access, refresh }

  if (typeof window !== "undefined") {
    if (typeof data?.access !== "string") {
      throw new Error("Respuesta de autenticación inválida");
    }
    persistTokens(data.access, typeof data.refresh === "string" ? data.refresh : undefined);
    window.localStorage.setItem("username", trimmedUser);
  }

  return data;
}

export function logout() {
  if (typeof window !== "undefined") {
    clearAuthStorage();
    window.localStorage.removeItem("username");
  }
}

async function parseAuthError(res: Response) {
  const messages: Record<number, string> = {
    400: "Usuario o contraseña inválidos.",
    401: "Usuario o contraseña inválidos.",
    403: "Acceso denegado.",
  };

  const fallback = messages[res.status] ?? `Error ${res.status}`;

  try {
    const data = await res.json();
    const detail = typeof data?.detail === "string" ? data.detail : null;

    if (detail) {
      return mapKnownDetail(detail) ?? fallback;
    }
  } catch {
    // Ignorar errores de parseo y usar mensaje por defecto
  }

  return fallback;
}

function mapKnownDetail(detail: string) {
  const normalized = detail.trim().toLowerCase();

  if (normalized.includes("no active account")) {
    return "No existe una cuenta activa con esas credenciales.";
  }
  if (normalized.includes("invalid credentials") || normalized.includes("incorrect credentials")) {
    return "Usuario o contraseña inválidos.";
  }
  if (normalized.includes("credentials were not provided")) {
    return "Debes ingresar usuario y contraseña.";
  }

  return null;
}
