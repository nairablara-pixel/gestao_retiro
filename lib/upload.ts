import { supabase } from "./supabase";
import { fileToDataUrl, mimeOf } from "./images";

export async function storeImage(folder: string, file: File) {
  const safeName = file.name.replace(/[^\w.\-]+/g, "-") || "arte.jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`;
  const contentType = mimeOf(file);

  const { error } = await supabase.storage.from("designs").upload(path, file, {
    upsert: true,
    contentType,
  });

  if (!error) {
    const { data } = supabase.storage.from("designs").getPublicUrl(path);
    return { url: data.publicUrl, storage_path: path, file_name: file.name };
  }

  const dataUrl = await fileToDataUrl(file);
  return { url: dataUrl, storage_path: null, file_name: file.name };
}
