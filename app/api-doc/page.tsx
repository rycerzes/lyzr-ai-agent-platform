import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export default async function ApiDocPage() {
  const spec = await getApiDocs();
  
  return (
    <section className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Lyzr AI Tickets API Documentation
        </h1>
        <p className="text-gray-600">
          Complete API documentation for the ticket management system
        </p>
      </div>
      <ReactSwagger spec={spec as Record<string, unknown>} />
    </section>
  );
}
