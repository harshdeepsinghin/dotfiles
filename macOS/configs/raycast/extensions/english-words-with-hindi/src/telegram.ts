/**
 * Telegram formatting and Bot API utility module.
 */

/**
 * Formats a vocabulary entry's raw markdown content into Telegram-friendly text.
 *
 * Formatting rules:
 * - Title: **Word (Pronunciation)** with 2 spaces line end
 * - Definitions: Grouped by POS (**Noun:**) with 1) ... 2) ... numbered list
 * - Sections (**Hindi Equivalent:**, **When to use:**, **Examples:**, etc.)
 * - Lists: Bullets formatted with `- item` and 2 spaces line end
 * - Etymology: Origin terms formatted with `__term__` (Telegram double underscore italic)
 * - Main sections separated by double newlines `\n\n`
 */
export function formatForTelegram(markdownContent: string): string {
  if (!markdownContent || !markdownContent.trim()) {
    return "";
  }

  const lines = markdownContent.trim().split("\n");

  // 1. Find H1 Title line (# Word ...)
  let titleIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#\s+/.test(lines[i])) {
      titleIndex = i;
      break;
    }
  }

  if (titleIndex === -1) {
    return markdownContent;
  }

  const rawTitleLine = lines[titleIndex];
  const titleMatch = rawTitleLine.match(/^#\s+([^(]+?)(?:\s*\(([^)]*)\))?\s*$/);
  let titleText = "";
  if (titleMatch) {
    const rawWord = titleMatch[1].trim();
    const capitalizedWord = rawWord.charAt(0).toUpperCase() + rawWord.slice(1);
    const pron = titleMatch[2] ? titleMatch[2].trim() : "";
    titleText = pron
      ? `**${capitalizedWord} (${pron})**`
      : `**${capitalizedWord}**`;
  } else {
    const cleanedTitle = rawTitleLine.replace(/^#\s+/, "").trim();
    const capitalizedTitle =
      cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
    titleText = `**${capitalizedTitle}**`;
  }

  // 2. Tokenize content into Title Block and ## Sections
  let currentHeading = "__title__";
  let currentLines: string[] = [];
  const sectionMap = new Map<
    string,
    { originalHeading: string; contentLines: string[] }
  >();
  const sectionOrder: string[] = [];

  for (let i = titleIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      if (currentHeading === "__title__") {
        sectionMap.set("__title__", {
          originalHeading: "__title__",
          contentLines: currentLines,
        });
      } else {
        sectionMap.set(currentHeading, {
          originalHeading: currentHeading,
          contentLines: currentLines,
        });
      }
      currentHeading = h2Match[1].trim();
      currentLines = [];
      sectionOrder.push(currentHeading);
    } else {
      currentLines.push(line);
    }
  }

  if (currentHeading === "__title__") {
    sectionMap.set("__title__", {
      originalHeading: "__title__",
      contentLines: currentLines,
    });
  } else {
    sectionMap.set(currentHeading, {
      originalHeading: currentHeading,
      contentLines: currentLines,
    });
  }

  // 3. Process Definitions in Title Block
  const titleBlock = sectionMap.get("__title__");
  const posDefinitionsMap = new Map<string, string[]>();

  if (titleBlock) {
    const posPattern =
      /^\s*(?:-\s+)?\*\*(Noun|Verb|Adjective|Adverb|Preposition|Conjunction|Pronoun|Interjection):\*\*\s*(.+)$/i;
    for (const line of titleBlock.contentLines) {
      const match = line.match(posPattern);
      if (match) {
        const pos =
          match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        const meaning = match[2].trim();
        if (!posDefinitionsMap.has(pos)) {
          posDefinitionsMap.set(pos, []);
        }
        posDefinitionsMap.get(pos)!.push(meaning);
      }
    }
  }

  const resultBlocks: string[] = [];

  // Title line block
  resultBlocks.push(`${titleText}  `);

  // Definitions block
  if (posDefinitionsMap.size > 0) {
    const defBlockLines: string[] = [];
    for (const [pos, defs] of posDefinitionsMap.entries()) {
      defs.forEach((def) => {
        const cleanDef = def.replace(/^\d+\)\s*/, "").replace(/^-\s*/, "");
        defBlockLines.push(`**${pos}:** ${cleanDef}  `);
      });
    }
    resultBlocks.push(defBlockLines.join("\n"));
  }

  // 4. Process each ## Section in original order
  for (const headingName of sectionOrder) {
    const sectionData = sectionMap.get(headingName);
    if (!sectionData) continue;

    const headingLower = headingName.toLowerCase();
    const rawContentLines = sectionData.contentLines
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawContentLines.length === 0) continue;

    if (headingLower === "hindi equivalent") {
      const line = rawContentLines.join(" ");
      resultBlocks.push(`**Hindi Equivalent:**  \n${line}`);
    } else if (headingLower === "when to use") {
      const items = rawContentLines.map((line) => {
        const cleaned = line.replace(/^-\s*/, "");
        return `- ${cleaned}  `;
      });
      resultBlocks.push(`**When to use:**  \n${items.join("\n")}`);
    } else if (headingLower === "examples") {
      const items = rawContentLines.map((line) => {
        const cleaned = line.replace(/^-\s*/, "");
        return `- ${cleaned}  `;
      });
      resultBlocks.push(`**Examples:**  \n${items.join("\n")}`);
    } else if (headingLower === "synonyms") {
      const text = rawContentLines.join(" ").replace(/^-\s*/, "");
      resultBlocks.push(`**Synonyms:** ${text}  `);
    } else if (headingLower === "antonyms") {
      const text = rawContentLines.join(" ").replace(/^-\s*/, "");
      resultBlocks.push(`**Antonyms:** ${text}  `);
    } else if (headingLower === "word breakdown") {
      const items = rawContentLines.map((line) => {
        const cleaned = line.replace(/^-\s*/, "");
        return `- ${cleaned}  `;
      });
      resultBlocks.push(`**Word Breakdown:**\n${items.join("\n")}`);
    } else if (headingLower === "formation flow") {
      const items = rawContentLines.map((line) => {
        const cleaned = line.replace(/^-\s*/, "");
        return `- ${cleaned}  `;
      });
      resultBlocks.push(`**Formation Flow:**\n${items.join("\n")}`);
    } else if (headingLower === "etymology") {
      let text = rawContentLines.join(" ");
      // Convert single-quoted or single-asterisk origin words to __word__
      text = text.replace(/'([^']+)'/g, "__$1__");
      text = text.replace(/(^|\s)\*([^*]+)\*(\s|$)/g, "$1__$2__$3");
      resultBlocks.push(`**Etymology:**  \n${text}`);
    } else {
      const headingCap =
        headingName.charAt(0).toUpperCase() + headingName.slice(1);
      resultBlocks.push(`**${headingCap}:**  \n${rawContentLines.join("\n")}`);
    }
  }

  return resultBlocks.join("\n\n");
}

/**
 * Converts Telegram-friendly text (**bold**, __italic__) to Telegram HTML format
 * for use with Telegram Bot API `sendMessage` (parse_mode: "HTML").
 */
export function telegramMarkdownToHtml(telegramText: string): string {
  if (!telegramText) return "";

  // 1. Escape HTML entities
  let html = telegramText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Convert **bold** to <b>bold</b>
  html = html.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

  // 3. Convert __italic__ to <i>italic</i>
  html = html.replace(/__([^_]+)__/g, "<i>$1</i>");

  // 4. Convert ~~strikethrough~~ to <s>strikethrough</s>
  html = html.replace(/~~([^~]+)~~/g, "<s>$1</s>");

  // 5. Strip trailing line spaces before newlines for clean HTML rendering
  html = html.replace(/[ \t]+\n/g, "\n");

  return html;
}

/**
 * Directly posts a Telegram-formatted vocabulary entry to a Telegram channel/chat using Telegram Bot API.
 */
export async function postToTelegramChannel(
  botToken: string,
  chatId: string,
  telegramFormattedText: string,
): Promise<{ success: boolean; messageId?: number; message?: string }> {
  const token = botToken.trim();
  const chat = chatId.trim();

  if (!token) {
    return { success: false, message: "Telegram Bot Token is required." };
  }
  if (!chat) {
    return {
      success: false,
      message: "Telegram Channel / Chat ID is required.",
    };
  }

  const htmlContent = telegramMarkdownToHtml(telegramFormattedText);

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chat,
        text: htmlContent,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    interface TelegramResponse {
      ok: boolean;
      description?: string;
      error_code?: number;
      result?: {
        message_id: number;
      };
    }

    const data = (await response.json()) as TelegramResponse;

    if (response.ok && data.ok) {
      return { success: true, messageId: data.result?.message_id };
    }

    const errDesc =
      data.description || response.statusText || `HTTP ${response.status}`;
    if (response.status === 401 || data.error_code === 401) {
      return {
        success: false,
        message:
          "Invalid Telegram Bot Token. Please check extension preferences.",
      };
    }
    if (response.status === 400 || data.error_code === 400) {
      return {
        success: false,
        message: `Telegram Error: ${errDesc}. Ensure the bot is added to the channel.`,
      };
    }
    if (response.status === 403 || data.error_code === 403) {
      return {
        success: false,
        message: `Telegram Error: ${errDesc}. Ensure bot has posting admin permissions.`,
      };
    }

    return {
      success: false,
      message: `Telegram Error (${data.error_code || response.status}): ${errDesc}`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Deletes a message from a Telegram channel/chat using Telegram Bot API.
 */
export async function deleteTelegramMessage(
  botToken: string,
  chatId: string,
  messageId: number,
): Promise<{ success: boolean; message?: string }> {
  const token = botToken.trim();
  const chat = chatId.trim();

  if (!token || !chat || !messageId) {
    return { success: false, message: "Missing required parameters." };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/deleteMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chat,
        message_id: messageId,
      }),
    });

    const data = (await response.json()) as {
      ok: boolean;
      description?: string;
    };

    if (response.ok && data.ok) {
      return { success: true };
    }

    return {
      success: false,
      message: data.description || `HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
