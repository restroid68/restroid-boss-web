/**
 * Boss UI: teknik `HQ` şube kodunu son kullanıcıya gösterme.
 * Tek lokasyon (kod HQ / boş) → boş etiket (rozet gizlenir).
 * Merkezi yönetim + HQ → «Merkez».
 */
export function bossBranchDisplayLabel(
  branchCode: string | null | undefined,
  opts?: { centralManagementEnabled?: boolean | null },
): string {
  const code = String(branchCode ?? "").trim()
  const upper = code.toUpperCase()
  if (!code || upper === "HQ") {
    if (opts?.centralManagementEnabled === true) return "Merkez"
    return ""
  }
  return code
}
