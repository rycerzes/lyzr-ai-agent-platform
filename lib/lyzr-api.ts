// lib/lyzr-api.ts
const BASE_URL = "https://agent-prod.studio.lyzr.ai/v3";
const RAG_BASE_URL = "https://rag-prod.studio.lyzr.ai/v3";

export async function getAgents(apiKey: string) {
  const res = await fetch(`${BASE_URL}/agents/`, {
    headers: {
      "accept": "application/json",
      "x-api-key": apiKey,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch agents");
  }
  return res.json();
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  agent_role: string;
  agent_goal?: string;
  agent_instructions: string;
  examples?: any;
  tool?: string;
  tool_usage_description?: string;
  provider_id: string;
  model: string;
  temperature: number;
  top_p: number;
  llm_credential_id: string;
  features: any[];
  managed_agents?: any[];
  response_format?: {
    type: string;
  };
}

export interface CreateSingleTaskAgentRequest {
  name: string;
  description: string;
  agent_role: string;
  agent_instructions: string;
  examples?: string;
  features: Array<{
    type: string;
    config?: any;
    priority?: number;
  }>;
  tool: string;
  tool_usage_description?: string;
  llm_credential_id: string;
  response_format?: any;
  provider_id: string;
  model: string;
  top_p: number;
  temperature: number;
}

export interface UpdateAgentRequest {
  name?: string;
  system_prompt?: string;
  description?: string;
  features?: Array<{
    type: string;
    config?: any;
    priority?: number;
  }>;
  tools?: string[];
  llm_credential_id?: string;
  provider_id?: string;
  model?: string;
  top_p?: number;
  temperature?: number;
  response_format?: any;
}

export interface UpdateSingleTaskAgentRequest {
  name?: string;
  description?: string;
  agent_role?: string;
  agent_instructions?: string;
  examples?: string;
  features?: Array<{
    type: string;
    config?: any;
    priority?: number;
  }>;
  tool?: string;
  tool_usage_description?: string;
  llm_credential_id?: string;
  provider_id?: string;
  model?: string;
  top_p?: number;
  temperature?: number;
  response_format?: any;
}

export interface ChatRequest {
  user_id: string;
  system_prompt_variables?: any;
  agent_id: string;
  session_id: string;
  message: string;
  filter_variables?: any;
  features?: Array<{ [key: string]: any }>;
  assets?: string[];
}

// RAG Interfaces
export interface CreateRagConfigRequest {
  user_id: string;
  llm_credential_id: string;
  embedding_credential_id: string;
  vector_db_credential_id: string;
  description?: string;
  collection_name: string;
  llm_model: string;
  embedding_model: string;
  vector_store_provider: string;
  semantic_data_model?: boolean;
  meta_data?: any;
}

export interface UpdateRagConfigRequest {
  user_id?: string;
  llm_credential_id?: string;
  embedding_credential_id?: string;
  vector_db_credential_id?: string;
  description?: string;
  collection_name?: string;
  llm_model?: string;
  embedding_model?: string;
  vector_store_provider?: string;
  semantic_data_model?: boolean;
  meta_data?: any;
}

export interface TrainDocumentRequest {
  data_parser: string;
  extra_info?: any;
  file: File;
}

export async function createAgent(apiKey: string, agentData: CreateAgentRequest) {
  const res = await fetch(`${BASE_URL}/agents/`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(agentData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create agent: ${res.status}`);
  }

  return res.json();
}

export async function createSingleTaskAgent(apiKey: string, agentData: CreateSingleTaskAgentRequest) {
  const res = await fetch(`${BASE_URL}/agents/template/single-task`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(agentData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create single-task agent: ${res.status}`);
  }

  return res.json();
}

// Chat with agent
export async function chatWithAgent(apiKey: string, chatData: ChatRequest) {
  const res = await fetch(`${BASE_URL}/inference/chat/`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(chatData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to chat with agent: ${res.status}`);
  }

  return res.json();
}

// Get agent by ID (v3 endpoint)
export async function getAgentById(apiKey: string, agentId: string) {
  const res = await fetch(`${BASE_URL}/agents/${agentId}`, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch agent: ${res.status}`);
  }

  return res.json();
}

// Get agent versions
export async function getAgentVersions(apiKey: string, agentId: string) {
  const res = await fetch(`${BASE_URL}/agents/${agentId}/versions`, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch agent versions: ${res.status}`);
  }

  return res.json();
}

// Get specific agent version
export async function getAgentVersion(apiKey: string, agentId: string, versionId: string) {
  const res = await fetch(`${BASE_URL}/agents/${agentId}/versions/${versionId}`, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch agent version: ${res.status}`);
  }

  return res.json();
}

// Update agent
export async function updateAgent(apiKey: string, agentId: string, agentData: UpdateAgentRequest) {
  const res = await fetch(`${BASE_URL}/agents/${agentId}`, {
    method: "PUT",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(agentData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update agent: ${res.status}`);
  }

  return res.json();
}

// Update single-task agent
export async function updateSingleTaskAgent(apiKey: string, agentId: string, agentData: UpdateSingleTaskAgentRequest) {
  const res = await fetch(`${BASE_URL}/agents/template/single-task/${agentId}`, {
    method: "PUT",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(agentData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update single-task agent: ${res.status}`);
  }

  return res.json();
}

// Delete agent
export async function deleteAgent(apiKey: string, agentId: string) {
  const res = await fetch(`${BASE_URL}/agents/${agentId}`, {
    method: "DELETE",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to delete agent: ${res.status}`);
  }

  return res.json();
}

// RAG Configuration Functions

// Get all RAG configurations by user ID
export async function getRagConfigsByUserId(apiKey: string, userId: string) {
  const res = await fetch(`${RAG_BASE_URL}/rag/user/${userId}/`, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to get RAG configurations: ${res.status}`);
  }

  return res.json();
}

// Create RAG configuration
export async function createRagConfig(apiKey: string, ragData: CreateRagConfigRequest) {
  const res = await fetch(`${RAG_BASE_URL}/rag/`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(ragData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create RAG configuration: ${res.status}`);
  }

  return res.json();
}

// Get RAG configuration by ID
export async function getRagConfig(apiKey: string, configId: string) {
  const res = await fetch(`${RAG_BASE_URL}/rag/${configId}/`, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to get RAG configuration: ${res.status}`);
  }

  return res.json();
}

// Update RAG configuration
export async function updateRagConfig(apiKey: string, configId: string, ragData: UpdateRagConfigRequest) {
  const res = await fetch(`${RAG_BASE_URL}/rag/${configId}/`, {
    method: "PUT",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(ragData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update RAG configuration: ${res.status}`);
  }

  return res.json();
}

// Delete RAG configuration
export async function deleteRagConfig(apiKey: string, configId: string) {
  const res = await fetch(`${RAG_BASE_URL}/rag/${configId}/`, {
    method: "DELETE",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to delete RAG configuration: ${res.status}`);
  }

  return res.json();
}

// Document Training Functions

// Upload parsed documents to RAG for training
export async function uploadDocumentsToRag(apiKey: string, ragConfigId: string, documents: any[]) {
  const res = await fetch(`${RAG_BASE_URL}/rag/train/${ragConfigId}`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ documents }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to upload documents to RAG: ${res.status}`);
  }

  return res.json();
}

// Train PDF document (parse + upload)
export async function trainPdfDocument(apiKey: string, ragId: string, file: File, dataParser: string = 'llmsherpa', extraInfo: any = {}) {
  // Step 1: Parse the document
  const formData = new FormData();
  formData.append('data_parser', dataParser);
  formData.append('extra_info', JSON.stringify(extraInfo));
  formData.append('file', file);

  const parseRes = await fetch(`${RAG_BASE_URL}/parse/pdf/?rag_id=${ragId}`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
    },
    body: formData,
  });

  if (!parseRes.ok) {
    const errorData = await parseRes.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to parse PDF document: ${parseRes.status}`);
  }

  const parseResult = await parseRes.json();

  // Step 2: Upload parsed documents to RAG for training
  if (parseResult.documents && parseResult.documents.length > 0) {
    const uploadResult = await uploadDocumentsToRag(apiKey, ragId, parseResult.documents);
    return {
      ...parseResult,
      upload_result: uploadResult
    };
  }

  return parseResult;
}

// Train DOCX document (parse + upload)
export async function trainDocxDocument(apiKey: string, ragId: string, file: File, dataParser: string = 'docx2txt', extraInfo: any = {}) {
  // Step 1: Parse the document
  const formData = new FormData();
  formData.append('data_parser', dataParser);
  formData.append('extra_info', JSON.stringify(extraInfo));
  formData.append('file', file);

  const parseRes = await fetch(`${RAG_BASE_URL}/parse/docx/?rag_id=${ragId}`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
    },
    body: formData,
  });

  if (!parseRes.ok) {
    const errorData = await parseRes.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to parse DOCX document: ${parseRes.status}`);
  }

  const parseResult = await parseRes.json();

  // Step 2: Upload parsed documents to RAG for training
  if (parseResult.documents && parseResult.documents.length > 0) {
    const uploadResult = await uploadDocumentsToRag(apiKey, ragId, parseResult.documents);
    return {
      ...parseResult,
      upload_result: uploadResult
    };
  }

  return parseResult;
}

// Train TXT document (parse + upload)
export async function trainTxtDocument(apiKey: string, ragId: string, file: File, dataParser: string = 'txt_parser', extraInfo: any = {}) {
  // Step 1: Parse the document
  const formData = new FormData();
  formData.append('data_parser', dataParser);
  formData.append('extra_info', JSON.stringify(extraInfo));
  formData.append('file', file);

  const parseRes = await fetch(`${RAG_BASE_URL}/parse/txt/?rag_id=${ragId}`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
    },
    body: formData,
  });

  if (!parseRes.ok) {
    const errorData = await parseRes.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to parse TXT document: ${parseRes.status}`);
  }

  const parseResult = await parseRes.json();

  // Step 2: Upload parsed documents to RAG for training
  if (parseResult.documents && parseResult.documents.length > 0) {
    const uploadResult = await uploadDocumentsToRag(apiKey, ragId, parseResult.documents);
    return {
      ...parseResult,
      upload_result: uploadResult
    };
  }

  return parseResult;
}
