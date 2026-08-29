// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "LightningOCRNative",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "vision-ocr", targets: ["vision-ocr"]),
        .executable(name: "clipboard-image", targets: ["clipboard-image"]),
    ],
    targets: [
        .executableTarget(
            name: "vision-ocr",
            path: "Sources/vision-ocr"
        ),
        .executableTarget(
            name: "clipboard-image",
            path: "Sources/clipboard-image"
        ),
    ]
)
