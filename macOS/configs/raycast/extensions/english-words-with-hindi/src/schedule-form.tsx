import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  useNavigation,
  Icon,
  Keyboard,
} from "@raycast/api";
import { useState } from "react";
import { formatForTelegram } from "./telegram";
import { addScheduledPost, getRandomFutureDate } from "./scheduler";

interface ScheduleFormProps {
  wordName: string;
  markdownContent: string;
  onScheduled?: () => void;
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface FormValues {
  scheduledDate: Date | null;
}

export function ScheduleForm({
  wordName,
  markdownContent,
  onScheduled,
}: ScheduleFormProps) {
  const { pop } = useNavigation();

  // Default initial scheduled date: 1 hour from now
  const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
  defaultDate.setSeconds(0, 0);

  const [scheduledDate, setScheduledDate] = useState<Date | null>(defaultDate);
  const formattedText = formatForTelegram(markdownContent);

  function handleRandomTime() {
    const randomDate = getRandomFutureDate(2, 4);
    setScheduledDate(randomDate);
    showToast({
      style: Toast.Style.Success,
      title: "Random Time Picked",
      message: randomDate.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    });
  }

  async function handleSubmit(values: FormValues) {
    const targetDate = values.scheduledDate || scheduledDate;

    if (!targetDate) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Date Required",
        message: "Please select a valid date and time.",
      });
      return;
    }

    if (targetDate.getTime() <= Date.now()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Scheduled Time",
        message: "Please pick a time in the future.",
      });
      return;
    }

    try {
      await addScheduledPost(wordName, formattedText, targetDate);
      await showToast({
        style: Toast.Style.Success,
        title: "Message Scheduled",
        message: `"${capitalize(wordName)}" scheduled for ${targetDate.toLocaleString()}`,
      });
      if (onScheduled) onScheduled();
      pop();
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Scheduling Failed",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Confirm Schedule"
            icon={Icon.Calendar}
            onSubmit={handleSubmit}
          />
          <Action
            title="Set Random Time"
            icon={Icon.Shuffle}
            shortcut={Keyboard.Shortcut.Common.Refresh}
            onAction={handleRandomTime}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Word"
        text={`Scheduling "${capitalize(wordName)}" to post to Telegram`}
      />

      <Form.DatePicker
        id="scheduledDate"
        title="Scheduled Date & Time"
        type={Form.DatePicker.Type.DateTime}
        value={scheduledDate}
        onChange={setScheduledDate}
      />

      <Form.Separator />

      <Form.Description
        title="Random Time Generator"
        text="Press ⌘R or choose 'Set Random Time' from actions to automatically pick a random future daytime slot."
      />

      <Form.Separator />

      <Form.Description
        title="Telegram Preview"
        text={formattedText || "No content available to format."}
      />
    </Form>
  );
}
