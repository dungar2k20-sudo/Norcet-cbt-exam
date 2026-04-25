// VAULT METADATA - Only update THIS when adding new vaults
const VAULT_METADATA = {
  'omega': {
    label: '👶 OMEGA Vault',
    subject: 'Obstetrics & Gynecology',
    description: 'Pregnancy, Labor, Childbirth & Postpartum Care',
    icon: '👶',
    unlocked: 1,
    price: 0
  }
};

// Auto-generate VAULT_CONFIG from metadata
const VAULT_CONFIG = Object.entries(VAULT_METADATA).map(([id, meta]) => ({
  id: id,
  folder: id.toUpperCase(),
  label: meta.label,
  subject: meta.subject,
  description: meta.description,
  prefix: id,
  questions: 0,
  unlocked: meta.unlocked,
  price: meta.price
}));