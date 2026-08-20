const API_BASE = "http://localhost:8000/api/v1";

export async function sendChatMessage(message: string, conversationId?: string) {
  const res = await fetch(`${API_BASE}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId || "default",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to send message");
  }

  return res.json();
}

export async function getProperties() {
  const res = await fetch(`${API_BASE}/properties/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch properties");
  }

  return res.json();
}
export async function getLeads() {
  const res = await fetch(`${API_BASE}/leads/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch leads");
  }

  return res.json();
}
