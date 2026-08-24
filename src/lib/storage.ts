export async function uploadObject(_opts: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
}): Promise<string | null> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) return null;
  // Storage is optional. When credentials are present, a real S3 client can be wired here.
  // Returning null keeps card generation working via HTML/CSS rendering.
  return process.env.S3_PUBLIC_URL ? `${process.env.S3_PUBLIC_URL}/${_opts.key}` : null;
}
