import sharp from "sharp";

for (const state of ["before", "after"]) {
  const version = state === "before" ? "v3" : "v2";
  const input = `output/imagegen/kitchen-${state}-source.png`;
  for (const [suffix, width, quality] of [
    ["", 1672, 84],
    ["-mobile", 1100, 78],
  ]) {
    const output = `public/images/kitchen-${state}-${version}${suffix}.webp`;
    const result = await sharp(input)
      .resize({ width })
      .webp({ quality, effort: 6 })
      .toFile(output);
    console.log(`${output}: ${Math.round(result.size / 1024)} KB`);
  }
}
