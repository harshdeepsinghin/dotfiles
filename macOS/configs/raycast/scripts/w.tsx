import {
  Action,
  ActionPanel,
  Detail,
  Form,
  showToast,
  Toast,
} from "@raycast/api";
import { useState } from "react";
import fs from "fs/promises";
import os from "os";
import path from "path";

const API_KEY = "YOUR_GEMINI_API_KEY";

const PROMPT = `
You are a vocabulary assistant.

Word: {word}

Output STRICT Markdown.

Rules:

- Use only Markdown
- No HTML
- No emojis
- No tables
- Use "-" bullets only
- Keep spacing clean
- Keep concise
- No code blocks
- Do not wrap response in markdown fences
- Use direct parts of speech (Noun, Verb, Adjective, etc.)
- Maximum clarity, minimum words

Format:

# Word (Hindi Pronunciation)

## Noun / Verb / Adjective
short definition (≤20 words)

## Hindi Equivalent
meaning1, meaning2, meaning3

## When to use
- point
- point
- point

## Examples
- sentence
- Hindi translation
- sentence
- Hindi translation

## Synonyms
w1, w2, w3, w4

## Antonyms
w1, w2, w3, w4

Conditional:
Include only when meaningful.

## Word Breakdown
- part → meaning

## Formation Flow
- step → meaning

## Etymology
brief origin

Constraints:
- No extra text
- No explanations
- No deviations
- Output only the formatted entry
`;

async function fetchWord(word: string): Promise<string> {
  const prompt = PROMPT.replace("{word}", word);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "No response received."
  );
}

export default function Command() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function search() {
    if (!word.trim()) return;

    setLoading(true);

    try {
      const res = await fetchWord(word);
      setResult(res);
    } catch (err) {
      setResult(String(err));
    }

    setLoading(false);
  }

  async function saveWord() {
    try {
      const dir = path.join(os.homedir(), "words");

      await fs.mkdir(dir, {
        recursive: true,
      });

      const file = path.join(
        dir,
        `${word.toLowerCase()}.md`
      );

      await fs.writeFile(file, result);

      await showToast({
        style: Toast.Style.Success,
        title: "Word saved",
        message: file,
      });
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Save failed",
        message: String(err),
      });
    }
  }

  if (!result) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action
              title="Search Word"
              onAction={search}
            />
          </ActionPanel>
        }
      >
        <Form.TextField
          id="word"
          title="Word"
          value={word}
          onChange={setWord}
        />
      </Form>
    );
  }

  return (
    <Detail
      isLoading={loading}
      markdown={result}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Result"
            content={result}
          />

          <Action
            title="Save Word"
            onAction={saveWord}
          />
        </ActionPanel>
      }
    />
  );
}
