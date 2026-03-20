import { useRef, useCallback, useState } from "react";
import { useCreateListing } from "@/context/CreateListingContext";
import { useAuth } from "@/context/AuthContext";
import { Camera, X, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 8;

export default function StepUpload() {
  const { data, updatePhotos, completeStep, goNext } = useCreateListing();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadToStorage = useCallback(async (file: File): Promise<string> => {
    if (!user) throw new Error("Não autenticado");
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("product-photos").getPublicUrl(path);
    return urlData.publicUrl;
  }, [user]);

  const addFiles = useCallback(async (files: FileList | null) => {
    if (!files || !user) return;

    const incoming = Array.from(files);
    const totalAfter = data.photos.length + incoming.length;
    if (totalAfter > MAX_FILES) {
      toast({ title: `Máximo de ${MAX_FILES} fotos`, variant: "destructive" });
      return;
    }

    const oversized = incoming.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast({ title: "Arquivo muito grande", description: "Máximo 10MB por foto", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const newUrls = await Promise.all(incoming.map(uploadToStorage));
      const allFiles = [...data.photos, ...incoming];
      const allUrls = [...data.photoUrls, ...newUrls];
      updatePhotos(allFiles, allUrls);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [data.photos, data.photoUrls, updatePhotos, uploadToStorage, user]);

  const removePhoto = useCallback((index: number) => {
    const newFiles = data.photos.filter((_, i) => i !== index);
    const newUrls = data.photoUrls.filter((_, i) => i !== index);
    updatePhotos(newFiles, newUrls);
  }, [data.photos, data.photoUrls, updatePhotos]);

  const handleNext = () => {
    completeStep(0);
    goNext();
  };

  return (
    <div className="px-4 sm:px-6 py-6 space-y-5">
      <div className="text-center space-y-2">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
          Envie as fotos do produto
        </h2>
        <p className="text-sm text-muted-foreground">
          Fotos do produto e da caixa para a IA identificar
        </p>
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full border-2 border-dashed border-primary/30 rounded-xl p-8 flex flex-col items-center gap-3 bg-primary/5 hover:bg-primary/10 transition-colors active:scale-[0.98] disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <span className="text-sm font-medium text-primary">Enviando fotos...</span>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-7 h-7 text-primary" />
            </div>
            <span className="text-sm font-medium text-primary hidden md:inline">Clique para adicionar fotos</span>
            <span className="text-sm font-medium text-primary md:hidden">Toque para adicionar fotos</span>
          </>
        )}
        <span className="text-xs text-muted-foreground">{data.photos.length}/{MAX_FILES} fotos · máx 10MB cada</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { addFiles(e.target.files); e.target.value = ""; }}
      />

      {data.photoUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.photoUrls.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/70 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-background" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleNext}
        disabled={data.photos.length === 0 || uploading}
        className="w-full h-12 text-base font-semibold gap-2"
      >
        Próximo <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
