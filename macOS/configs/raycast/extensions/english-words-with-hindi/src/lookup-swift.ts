export const SWIFT_LOOKUP_CODE = `
import Foundation
import CoreServices.DictionaryServices

func getDefinition(for word: String) -> String? {
    let nsString = word as NSString
    let range = CFRange(location: 0, length: nsString.length)
    
    guard let definition = DCSCopyTextDefinition(nil, nsString, range) else {
        return nil
    }
    
    return definition.takeUnretainedValue() as String
}

let args = CommandLine.arguments
if args.count < 2 {
    exit(1)
}

let word = args[1]
if let definition = getDefinition(for: word) {
    print(definition)
} else {
    exit(2)
}
`;
