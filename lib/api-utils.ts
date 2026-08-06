import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  console.error("API error:", error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
