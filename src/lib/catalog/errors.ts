export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isUniqueViolation(err: unknown): boolean {
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  const code =
    typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
  return code === "23505" || message.includes("duplicate") || message.includes("unique");
}
