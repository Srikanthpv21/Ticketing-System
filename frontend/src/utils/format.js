// Display helper: "agent1" -> "Agent1". Display only; never sent to the API.
export const displayName = (name) => {
  const s = String(name ?? "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
