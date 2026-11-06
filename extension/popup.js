const status = document.getElementById("status");

async function refresh() {
  const { profile, cv } = await chrome.storage.local.get(["profile", "cv"]);
  status.textContent = profile
    ? `Profil : ${profile.firstName} ${profile.lastName}${cv ? ` · CV : ${cv.name}` : ""}`
    : "Aucun profil importé.";
}

document.getElementById("profile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    await chrome.storage.local.set({ profile: JSON.parse(await file.text()) });
    refresh();
  } catch {
    status.textContent = "Ce fichier n'est pas valide.";
  }
});

document.getElementById("cv").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    await chrome.storage.local.set({ cv: { name: file.name, data: reader.result } });
    refresh();
  };
  reader.readAsDataURL(file);
});

document.getElementById("fill").addEventListener("click", async () => {
  const { profile, cv } = await chrome.storage.local.get(["profile", "cv"]);
  if (!profile) {
    status.textContent = "Importe d'abord ton profil.";
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: false },
    func: fillForm,
    args: [profile, cv ?? null],
  });
  status.textContent = `${result.result} champ(s) rempli(s). Vérifie avant d'envoyer.`;
});

/** Exécutée dans la page : remplit les champs reconnus. Ne soumet jamais le formulaire. */
function fillForm(p, cv) {
  const rules = [
    [/first.?name|given|pr[ée]nom|voornaam/i, p.firstName],
    [/last.?name|family|surname|\bnom\b|achternaam|familienaam/i, p.lastName],
    [/e-?mail|courriel/i, p.email],
    [/phone|mobile|t[ée]l[ée]phone|\bgsm\b|telefoon/i, p.phone],
    [/post.?(al)?.?code|zip|code postal/i, p.postcode],
    [/\bcity\b|ville|localit[ée]|commune|gemeente|stad/i, p.city],
    [/address|adresse|\brue\b|straat/i, [p.street, p.number].filter(Boolean).join(" ")],
    [/motivation|message|cover|lettre|bericht|comment/i, p.mailBody],
  ];
  const describe = (el) => {
    const label = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    return [el.name, el.id, el.placeholder, el.getAttribute("aria-label"), el.autocomplete, label?.textContent, el.closest("label")?.textContent].join(" ");
  };
  const put = (el, value) => {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  let filled = 0;
  for (const el of document.querySelectorAll("input, textarea")) {
    if (el.disabled || el.readOnly || el.value || ["hidden", "password", "checkbox", "radio", "submit", "button", "file"].includes(el.type)) continue;
    const text = describe(el);
    // Le message type ne va que dans une grande zone de texte.
    const rule = rules.find(([re, value]) => value && re.test(text) && (value !== p.mailBody || el.tagName === "TEXTAREA"));
    if (rule) {
      put(el, rule[1]);
      filled++;
    }
  }
  if (cv) {
    const input = [...document.querySelectorAll('input[type="file"]')].find((el) => /cv|resume|curriculum|lebenslauf/i.test(describe(el))) ?? document.querySelector('input[type="file"]');
    if (input) {
      const bytes = Uint8Array.from(atob(cv.data.split(",")[1]), (c) => c.charCodeAt(0));
      const data = new DataTransfer();
      data.items.add(new File([bytes], cv.name, { type: "application/pdf" }));
      input.files = data.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      filled++;
    }
  }
  return filled;
}
