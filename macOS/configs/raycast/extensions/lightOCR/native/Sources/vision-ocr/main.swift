import Foundation
import Vision
import AppKit

// ---------------------------------------------------------------------------
// vision-ocr — Apple Vision text recognition CLI
//
// Usage:
//   vision-ocr <image-path> [--accurate|--fast]
//
// Output (stdout):
//   A JSON array of observations:
//   [{"text": "...", "confidence": 0.99, "bbox": [x1, y1, x2, y2]}, ...]
//
// Exit codes:
//   0 — success (may return empty array if no text found)
//   1 — argument error
//   2 — image load error
//   3 — recognition error
// ---------------------------------------------------------------------------

// MARK: - Helpers

struct Observation: Encodable {
    let text: String
    let confidence: Float
    let bbox: [Int]
}

func exit(code: Int32, message: String) -> Never {
    fputs("vision-ocr: \(message)\n", stderr)
    exit(code)
}

// MARK: - Argument parsing

let args = CommandLine.arguments
guard args.count >= 2 else {
    exit(code: 1, message: "Usage: vision-ocr <image-path> [--accurate|--fast]")
}

let imagePath = args[1]
let useAccurate = !args.contains("--fast")

// MARK: - Image loading

guard let nsImage = NSImage(contentsOfFile: imagePath),
      let cgImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil)
else {
    exit(code: 2, message: "Could not load image at path: \(imagePath)")
}

let imageSize = CGSize(width: cgImage.width, height: cgImage.height)

// MARK: - Recognition

let semaphore = DispatchSemaphore(value: 0)
var results: [Observation] = []
var recognitionError: Error? = nil

let request = VNRecognizeTextRequest { request, error in
    defer { semaphore.signal() }

    if let error = error {
        recognitionError = error
        return
    }

    guard let observations = request.results as? [VNRecognizedTextObservation] else {
        return
    }

    for obs in observations {
        guard let candidate = obs.topCandidates(1).first else { continue }

        // Convert normalised bounding box (origin at bottom-left in Vision)
        // to pixel coordinates with origin at top-left.
        let normBbox = obs.boundingBox
        let x1 = Int(normBbox.minX * imageSize.width)
        let y1 = Int((1.0 - normBbox.maxY) * imageSize.height)
        let x2 = Int(normBbox.maxX * imageSize.width)
        let y2 = Int((1.0 - normBbox.minY) * imageSize.height)

        results.append(Observation(
            text: candidate.string,
            confidence: candidate.confidence,
            bbox: [x1, y1, x2, y2]
        ))
    }
}

request.recognitionLevel = useAccurate ? .accurate : .fast
request.usesLanguageCorrection = true
request.recognitionLanguages = ["en-US"]

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
    try handler.perform([request])
} catch {
    exit(code: 3, message: "Vision request failed: \(error.localizedDescription)")
}

semaphore.wait()

if let err = recognitionError {
    exit(code: 3, message: "Recognition error: \(err.localizedDescription)")
}

// MARK: - Output

let encoder = JSONEncoder()
encoder.outputFormatting = [.withoutEscapingSlashes]

guard let jsonData = try? encoder.encode(results),
      let jsonString = String(data: jsonData, encoding: .utf8)
else {
    exit(code: 3, message: "Failed to serialise results.")
}

print(jsonString)
exit(0)
