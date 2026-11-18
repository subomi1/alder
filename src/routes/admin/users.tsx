import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminListUsers, adminSetRole, adminSetSuspended, getMyProfile } from "@/lib/catalog/api";
import { AdminFrame } from "@/components/admin-frame";
import { ErrorState } from "@/components/states";
import { errorText, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile() });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => adminListUsers() });
  const role = useMutation({
    mutationFn: adminSetRole,
    onSuccess: async () => {
      toast.success("Role updated");
      await queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(errorText(err)),
  });
  const suspend = useMutation({
    mutationFn: adminSetSuspended,
    onSuccess: async () => {
      toast.success("Account updated");
      await queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(errorText(err)),
  });

  return (
    <AdminFrame
      title="Users"
      lede="Promote another administrator or suspend an account that should not publish. You cannot suspend yourself or give up the last admin role."
    >
      {users.isPending ? <div className="h-40 animate-pulse rounded-lg bg-paper-deep" /> : null}
      {users.isError ? <ErrorState message={errorText(users.error)} onRetry={() => void users.refetch()} /> : null}
      {users.data ? (
        <div className="overflow-x-auto rounded-lg bg-surface shadow-card">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Reviews</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((user) => {
                const self = user.id === me.data?.userId;
                return (
                  <tr key={user.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-muted">{user.email}</p>
                      {user.suspended ? <p className="text-xs text-danger">Suspended</p> : null}
                    </td>
                    <td className="px-4 py-3 capitalize">{user.role}</td>
                    <td className="px-4 py-3 tabular-nums">{user.reviewCount}</td>
                    <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {!self && user.role === "user" ? (
                        <button
                          type="button"
                          className="min-h-11 px-2 hover:underline"
                          onClick={() => role.mutate({ data: { userId: user.id, role: "admin" } })}
                        >
                          Make admin
                        </button>
                      ) : null}
                      {!self && user.role === "admin" ? (
                        <button
                          type="button"
                          className="min-h-11 px-2 hover:underline"
                          onClick={() => role.mutate({ data: { userId: user.id, role: "user" } })}
                        >
                          Make member
                        </button>
                      ) : null}
                      {!self ? (
                        <button
                          type="button"
                          className="min-h-11 px-2 text-danger hover:underline"
                          onClick={() =>
                            suspend.mutate({ data: { userId: user.id, suspended: !user.suspended } })
                          }
                        >
                          {user.suspended ? "Restore" : "Suspend"}
                        </button>
                      ) : (
                        <span className="text-muted">You</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </AdminFrame>
  );
}
