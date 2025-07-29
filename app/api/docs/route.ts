import { NextResponse } from "next/server";
import { getApiDocs } from "@/lib/swagger";

export async function GET() {
  try {
    const spec = await getApiDocs();
    
    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error("Error generating API docs:", error);
    return NextResponse.json(
      { error: "Failed to generate API documentation" },
      { status: 500 }
    );
  }
}
