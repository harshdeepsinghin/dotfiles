import AppKit
import Foundation
import UniformTypeIdentifiers

// ---------------------------------------------------------------------------
// clipboard-image — Extract the current NSPasteboard image to a temp file
//
// Usage:
//   clipboard-image [--format png|tiff]
//
// Output (stdout):
//   Absolute path to the saved temp file, followed by a newline.
//
// Exit codes:
//   0 — success
//   1 — no image found in clipboard
//   2 — failed to write temp file
// ---------------------------------------------------------------------------

// MARK: - Argument parsing

let args = CommandLine.arguments
let wantFormat = args.dropFirst().first(where: { $0 != "--format" && !$0.hasPrefix("-") }) ?? "png"
let format = wantFormat.lowercased() == "tiff" ? "tiff" : "png"

// MARK: - Read clipboard

let pasteboard = NSPasteboard.general

// Try PNG first (most screenshots land here), then TIFF.
var imageData: Data? = nil
var fileExtension = format

if let pngData = pasteboard.data(forType: .png) {
    imageData = pngData
    fileExtension = "png"
} else if let tiffData = pasteboard.data(forType: .tiff) {
    // Convert TIFF to PNG for consistent downstream handling.
    if let nsImage = NSImage(data: tiffData),
       let cgImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) {
        let bitmap = NSBitmapImageRep(cgImage: cgImage)
        imageData = bitmap.representation(using: .png, properties: [:])
        fileExtension = "png"
    } else {
        imageData = tiffData
        fileExtension = "tiff"
    }
} else if let fileURLs = pasteboard.readObjects(forClasses: [NSURL.self], options: nil) as? [URL] {
    // Clipboard may contain a file reference to an image.
    for url in fileURLs {
        let ext = url.pathExtension.lowercased()
        if ["png", "jpg", "jpeg", "webp", "tiff", "heic"].contains(ext) {
            // Print the existing file path directly — no copy needed.
            print(url.path)
            exit(0)
        }
    }
}

guard let data = imageData else {
    fputs("clipboard-image: No image found in clipboard.\n", stderr)
    exit(1)
}

// MARK: - Write to temp file

let tempDir = FileManager.default.temporaryDirectory
let filename = "lightningocr_clipboard_\(Int(Date().timeIntervalSince1970)).\(fileExtension)"
let tempURL = tempDir.appendingPathComponent(filename)

do {
    try data.write(to: tempURL, options: .atomic)
} catch {
    fputs("clipboard-image: Failed to write temp file: \(error.localizedDescription)\n", stderr)
    exit(2)
}

// MARK: - Output

print(tempURL.path)
exit(0)
