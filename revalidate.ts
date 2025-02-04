import "./env.js";

const post = (endpoint: string, body?: Record<string, unknown>) => {
  return fetch(`${process.env.WEB_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REVALIDATE_SECRET}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
};

export const revalidateProposals = () => {
  return post("/api/proposals");
};

export const revalidateProposal = (proposal: string) => {
  return post(`/api/proposal`, { proposal });
};
