"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiDELETE, apiGET, apiPATCH, apiPOST } from "@/lib/api";
import type { AppUser } from "@/lib/types";
import {
  ITEMS_PER_PAGE,
  buttonClass,
  formatDate,
  statusStyle,
  type NotifyFn,
} from "./shared";
import { useBusyMutation } from "./useBusyMutation";
import { Pagination } from "./Pagination";

const APP_USERS_ENDPOINT = "/usuarios-app/";

type SystemUsersSectionProps = {
  notify: NotifyFn;
};

export function SystemUsersSection({ notify }: SystemUsersSectionProps) {
  const { busy, runMutation } = useBusyMutation(notify);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [role, setRole] = useState<"operador" | "admin">("operador");

  const load = useCallback(async () => {
    const data = await apiGET<AppUser[]>(APP_USERS_ENDPOINT);
    setUsers(data);
  }, []);

  useEffect(() => {
    void load().catch((error) => {
      const message =
        error instanceof Error ? error.message : "No se pudieron cargar los usuarios.";
      notify("error", message);
    });
  }, [load, notify]);

  const filtered = useMemo(() => {
    const value = filter.trim().toLowerCase();
    if (!value) return users;
    return users.filter((user) => user.username.toLowerCase().includes(value));
  }, [filter, users]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)),
    [filtered.length]
  );

  const pageItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, filtered.length]);

  const createUser = useCallback(async () => {
    if (!username.trim() || !password) {
      notify("error", "Completa usuario y contrasena.");
      return;
    }
    if (password !== password2) {
      notify("error", "Las contrasenas no coinciden.");
      return;
    }
    const ok = await runMutation(async () => {
      await apiPOST(APP_USERS_ENDPOINT, {
        username: username.trim(),
        password,
        is_staff: role === "admin",
      });
      await load();
    }, "Usuario creado.");

    if (ok) {
      setUsername("");
      setPassword("");
      setPassword2("");
      setRole("operador");
    }
  }, [username, password, password2, role, runMutation, notify, load]);

  const updateUser = useCallback(
    (id: number, payload: Partial<AppUser> & { password?: string }) =>
      runMutation(async () => {
        await apiPATCH<AppUser>(`${APP_USERS_ENDPOINT}${id}/`, payload);
        await load();
      }, "Usuario actualizado."),
    [runMutation, load]
  );

  const deleteUser = useCallback(
    (id: number) =>
      runMutation(async () => {
        await apiDELETE(`${APP_USERS_ENDPOINT}${id}/`);
        await load();
      }, "Usuario eliminado."),
    [runMutation, load]
  );

  return (
    <section className="card p-6 space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Nuevo usuario del sistema</h2>
          <input
            className="input"
            placeholder="Usuario"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Repetir contrasena"
            value={password2}
            onChange={(event) => setPassword2(event.target.value)}
          />
          <select
            className="input"
            value={role}
            onChange={(event) => setRole(event.target.value as "operador" | "admin")}
          >
            <option value="operador">Operador</option>
            <option value="admin">Administrador</option>
          </select>
          <button className={`${buttonClass("primary")} w-full`} disabled={busy} onClick={createUser}>
            Guardar
          </button>
        </div>
        <div className="card p-4 space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="text-sm muted">{users.length} registros</span>
            <input
              className="input md:max-w-xs"
              placeholder="Buscar..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Ultimo ingreso</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-cell text-center text-sm muted">
                      Sin usuarios
                    </td>
                  </tr>
                ) : (
                  pageItems.map((user) => (
                    <AppUserRow
                      key={user.id}
                      user={user}
                      disabled={busy}
                      onSave={updateUser}
                      onDelete={deleteUser}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </section>
  );
}

type AppUserRowProps = {
  user: AppUser;
  onSave: (id: number, payload: Partial<AppUser> & { password?: string }) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  disabled: boolean;
};

function AppUserRow({ user, onSave, onDelete, disabled }: AppUserRowProps) {
  const [edit, setEdit] = useState(false);
  const [active, setActive] = useState(user.is_active);
  const [admin, setAdmin] = useState(user.is_staff || user.is_superuser || false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    setActive(user.is_active);
    setAdmin(user.is_staff || user.is_superuser || false);
  }, [user]);

  return (
    <tr className="table-row">
      <td className="table-cell font-medium">{user.username}</td>
      <td className="table-cell">
        {edit ? (
          <select className="input" value={admin ? "admin" : "operador"} onChange={(event) => setAdmin(event.target.value === "admin")}>
            <option value="operador">Operador</option>
            <option value="admin">Administrador</option>
          </select>
        ) : admin || user.is_staff || user.is_superuser ? (
          "Administrador"
        ) : (
          "Operador"
        )}
      </td>
      <td className="table-cell text-sm muted">{formatDate(user.last_login)}</td>
      <td className="table-cell">
        {edit ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-brand"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Activo
          </label>
        ) : (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={statusStyle(user.is_active)}
          >
            {user.is_active ? "Activo" : "Inactivo"}
          </span>
        )}
      </td>
      <td className="table-cell">
        <div className="flex flex-wrap gap-2">
          {edit ? (
            <>
              <input
                className="input input-sm"
                type="password"
                placeholder="Contrasena (opcional)"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className={buttonClass("primary", "sm")}
                disabled={disabled}
                onClick={async () => {
                  const payload: Partial<AppUser> & { password?: string } = {
                    is_active: active,
                    is_staff: admin,
                  };
                  if (password.trim()) payload.password = password;
                  const ok = await onSave(user.id, payload);
                  if (ok) {
                    setPassword("");
                    setEdit(false);
                  }
                }}
              >
                Guardar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                onClick={() => {
                  setActive(user.is_active);
                  setAdmin(user.is_staff || user.is_superuser || false);
                  setPassword("");
                  setEdit(false);
                }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button className={buttonClass("outline", "sm")} onClick={() => setEdit(true)}>
                Editar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                disabled={disabled}
                onClick={async () => {
                  if (confirm(`Eliminar usuario ${user.username}?`)) {
                    await onDelete(user.id);
                  }
                }}
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
