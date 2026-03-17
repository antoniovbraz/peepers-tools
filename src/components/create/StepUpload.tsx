import { useRef, useCallback } from "react";
import { useCreateListing } from "@/context/CreateListingContext";
import { Camera, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StepUpload() {
  const { data, updatePhotos, completeStep, goNext } = useCreateListing();
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = [...data.photos, ...Array.from(files)];
    const newUrls = newFiles.map(f => URL.createObjectURL(f));
    updatePhotos(newFiles, newUrls);
  }, [data.photos, updatePhotos]);

  const removePhoto = useCallback((index: number) => {
    const newFiles = data.photos.filter((_, i) => i !== index);
    const newUrls = newFiles.map(f => URL.createObjectURL(f));
    updatePhotos(newFiles, newUrls);
  }, [data.photos, updatePhotos]);

  const handleNext = () => {
    completeStep(0);
    goNext();
  };

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="text-center space-y-2">
        <h2 className="font-display text-xl font-bold text-foreground">
          Envie as fotos do produto
        </h2>
        <p className="text-sm text-muted-foreground">
          Fotos do produto e da caixa para a IA identificar
        </p>
      </div>

      {/* Upload Area */}
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-primary/30 rounded-xl p-8 flex flex-col items-center gap-3 bg-primary/5 hover:bg-primary/10 transition-colors active:scale-[0.98]"
      >
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Camera className="w-7 h-7 text-primary" />
        </div>
        <span className="text-sm font-medium text-primary">Toque para adicionar fotos</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => addFiles(e.target.files)}
      />

      {/* Preview Grid */}
      {data.photoUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
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

      {/* Next Button */}
      <Button
        onClick={handleNext}
        disabled={data.photos.length === 0}
        className="w-full h-12 text-base font-semibold gap-2"
      >
        Próximo <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
