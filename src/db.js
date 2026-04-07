import PocketBase from "pocketbase";

const PB_URL = import.meta.env.VITE_PB_URL || "https://api.financascasa.online";
export const pb = new PocketBase(PB_URL);

// ─── ACCOUNTS ───
export async function getAccount(email) {
  try {
    const res = await pb.collection("accounts").getFirstListItem(`email="${email}"`);
    return res;
  } catch { return null; }
}
export async function getAllAccounts() {
  try { return await pb.collection("accounts").getFullList(); }
  catch { return []; }
}
export async function saveAccount(acc) {
  const existing = await pb.collection("accounts").getFirstListItem(`email="${acc.email}"`).catch(() => null);
  if (existing) {
    return await pb.collection("accounts").update(existing.id, acc);
  } else {
    return await pb.collection("accounts").create(acc);
  }
}
export async function deleteAccount(email) {
  try {
    const rec = await pb.collection("accounts").getFirstListItem(`email="${email}"`);
    await pb.collection("accounts").delete(rec.id);
  } catch {}
}
export async function getSubUsers(parentEmail) {
  try { return await pb.collection("accounts").getFullList({ filter: `parentEmail="${parentEmail}"` }); }
  catch { return []; }
}

// ─── SIGNUP REQUESTS ───
export async function getSignupRequests() {
  try { return await pb.collection("signup_requests").getFullList(); }
  catch { return []; }
}
export async function addSignupRequest(req) {
  const existing = await pb.collection("signup_requests").getFirstListItem(`email="${req.email}"`).catch(() => null);
  if (existing) return;
  await pb.collection("signup_requests").create(req);
}
export async function deleteSignupRequest(email) {
  try {
    const rec = await pb.collection("signup_requests").getFirstListItem(`email="${email}"`);
    await pb.collection("signup_requests").delete(rec.id);
  } catch {}
}

// ─── GROUPS ───
export async function getGroups(ownerEmail) {
  try { return await pb.collection("groups").getFullList({ filter: `ownerEmail="${ownerEmail}"` }); }
  catch { return []; }
}
export async function saveGroup(g) {
  try {
    if (g.id) return await pb.collection("groups").update(g.id, g);
    const created = await pb.collection("groups").create(g);
    g.id = created.id;
    return created;
  } catch (e) { throw e; }
}
export async function deleteGroup(id) {
  try { await pb.collection("groups").delete(id); } catch {}
}

// ─── MEMBERS ───
export async function getMembers(ownerEmail) {
  try { return await pb.collection("members").getFullList({ filter: `ownerEmail="${ownerEmail}"` }); }
  catch { return []; }
}
export async function getMembersByGroup(groupId) {
  try { return await pb.collection("members").getFullList({ filter: `groupId="${groupId}"` }); }
  catch { return []; }
}
export async function saveMember(m) {
  try {
    if (m.id) return await pb.collection("members").update(m.id, m);
    const created = await pb.collection("members").create(m);
    m.id = created.id;
    return created;
  } catch (e) { throw e; }
}
export async function deleteMember(id) {
  try { await pb.collection("members").delete(id); } catch {}
}

// ─── ENTRIES ───
export async function getEntries(ownerEmail) {
  try { return await pb.collection("entries").getFullList({ filter: `ownerEmail="${ownerEmail}"` }); }
  catch { return []; }
}
export async function saveEntry(e) {
  try {
    if (e.id) return await pb.collection("entries").update(e.id, e);
    const created = await pb.collection("entries").create(e);
    e.id = created.id;
    return created;
  } catch (err) { throw err; }
}
export async function deleteEntry(id) {
  try { await pb.collection("entries").delete(id); } catch {}
}

// ─── GOALS ───
export async function getGoals(ownerEmail) {
  try { return await pb.collection("goals").getFullList({ filter: `ownerEmail="${ownerEmail}"` }); }
  catch { return []; }
}
export async function saveGoal(g) {
  try {
    if (g.id) return await pb.collection("goals").update(g.id, g);
    const created = await pb.collection("goals").create(g);
    g.id = created.id;
    return created;
  } catch (e) { throw e; }
}
export async function deleteGoal(id) {
  try { await pb.collection("goals").delete(id); } catch {}
}

// ─── BACKUP ───
export async function exportAllData(ownerEmail) {
  const entries = await getEntries(ownerEmail);
  const goals = await getGoals(ownerEmail);
  const groups = await getGroups(ownerEmail);
  const members = await getMembers(ownerEmail);
  return { appName: "Financas", version: 4, exportDate: new Date().toISOString(), ownerEmail, entries, goals, groups, members };
}
export async function importAllData(data) {
  for (const e of data.entries || []) { e.id = null; await saveEntry(e); }
  for (const g of data.goals || []) { g.id = null; await saveGoal(g); }
  for (const g of data.groups || []) { g.id = null; await saveGroup(g); }
  for (const m of data.members || []) { m.id = null; await saveMember(m); }
}

// ─── INIT ADMIN ───
export async function initAdmin() {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "";
  const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || "";
  try {
    const existing = await getAccount(adminEmail);
    if (!existing) {
      await saveAccount({ email: adminEmail, name: "Admin", password: adminPass, role: "admin", status: "active", mustChangePassword: false, protected: true, parentEmail: "" });
    }
  } catch {}
}
