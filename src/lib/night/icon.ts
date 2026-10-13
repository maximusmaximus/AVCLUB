export async function fileToIcon(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Use a picture.");
  const bitmap = await createImageBitmap(file);
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't read that picture.");
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();
  const data = canvas.toDataURL("image/jpeg", 0.82);
  if (data.length > 120_000) throw new Error("That picture is still too large.");
  return data;
}

export function isIcon(value: string) {
  return value === "" || (value.startsWith("data:image/jpeg;base64,") && value.length <= 120_000);
}
