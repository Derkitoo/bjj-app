import { ShieldOff } from "lucide-react";

export default function NoAccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center mb-4">
        <ShieldOff size={28} className="text-[#aaaaaa]" />
      </div>
      <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Accès restreint</h1>
      <p className="text-sm text-[#666666] max-w-sm">
        Votre compte ne dispose d&apos;aucune section autorisée pour le moment.
        Contactez un administrateur pour configurer vos accès.
      </p>
    </div>
  );
}
