import bcrypt from "bcryptjs";

export const genererMotDePasseTemporaire = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let mdp = "BJJ-";
  for (let i = 0; i < 6; i++) mdp += chars[Math.floor(Math.random() * chars.length)];
  return mdp;
};

export const hasherMotDePasse = (mdp: string) => bcrypt.hash(mdp, 12);
export const verifierMotDePasse = (mdp: string, hash: string) => bcrypt.compare(mdp, hash);
