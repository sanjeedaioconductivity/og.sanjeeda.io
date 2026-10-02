import { NextResponse } from "next/server";

export function jsonError(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status });
}

export const notFound = () =>
  jsonError(404, "not_found", "Resource not found.");

export const unauthorized = () =>
  jsonError(401, "unauthorized", "Authentication required.");

export const badRequest = (message: string) =>
  jsonError(400, "validation_error", message);
