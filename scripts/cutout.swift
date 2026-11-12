// macOS Vision으로 사진 배경 제거(누끼).
// 사용: swift scripts/cutout.swift <입력 이미지> <출력 폴더>
// 출력: all.png(전체 전경), instance-N.png(개별 객체)

import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
guard args.count == 3 else {
  print("usage: cutout.swift <input> <outdir>")
  exit(1)
}
let input = URL(fileURLWithPath: args[1])
let outDir = URL(fileURLWithPath: args[2], isDirectory: true)
try FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

guard let ciImage = CIImage(contentsOf: input) else {
  print("cannot read \(input.path)")
  exit(1)
}

let handler = VNImageRequestHandler(ciImage: ciImage)
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let result = request.results?.first else {
  print("no foreground found")
  exit(1)
}

let ctx = CIContext()
func save(_ instances: IndexSet, _ name: String) throws {
  let buffer = try result.generateMaskedImage(
    ofInstances: instances, from: handler, croppedToInstancesExtent: true)
  let image = CIImage(cvPixelBuffer: buffer)
  let url = outDir.appendingPathComponent(name)
  try ctx.writePNGRepresentation(
    of: image, to: url, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
  print("saved \(url.path)")
}

try save(result.allInstances, "all.png")
for i in result.allInstances {
  try save(IndexSet(integer: i), "instance-\(i).png")
}
